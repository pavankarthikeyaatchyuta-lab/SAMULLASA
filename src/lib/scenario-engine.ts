/**
 * Scenario Engine for SAMULLĀSA
 *
 * Manages what-if scenarios: creating, diffing, approving, rejecting,
 * rolling back, and parsing natural-language change requests.
 *
 * All functions are pure (except crypto.randomUUID for ID generation).
 * All monetary values are in paise (1/100 INR).
 */

import type {
  Scenario,
  ScenarioStatus,
  ScenarioChange,
  BudgetItem,
  EventDetails,
  ChangeProposal,
} from '@/types/events';

import {
  calculateBudgetSummary,
  recalculatePerPersonCosts,
} from '@/lib/budget-engine';

import {
  buildDefaultConstraints,
  evaluateConstraints,
  checkFeasibility,
  propagateChanges,
} from '@/lib/constraint-engine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format paise amount as human-readable INR string.
 * 5000000 → "₹50,000"
 */
function formatPaise(paise: number): string {
  const rupees = Math.abs(paise) / 100;
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
  return paise < 0 ? `-${formatted}` : formatted;
}

/** ISO timestamp for the current instant. */
function now(): string {
  return new Date().toISOString();
}

// ─── 1. createScenario ────────────────────────────────────────────────────────

/**
 * Create a new draft scenario, optionally based on a parent scenario.
 *
 * If a parent is provided its budget items, tasks, and vendors are deep-cloned
 * into the new scenario.  Otherwise the scenario starts empty.
 */
export function createScenario(
  event: EventDetails,
  parentScenario: Scenario | null,
  name: string,
  description?: string,
): Scenario {
  if (!name || name.trim().length === 0) {
    throw new Error('Scenario name must not be empty.');
  }

  const timestamp = now();

  if (parentScenario) {
    return {
      id: crypto.randomUUID(),
      eventId: event.id,
      parentScenarioId: parentScenario.id,
      status: 'draft' as ScenarioStatus,
      name: name.trim(),
      description: description?.trim(),
      guestCount: parentScenario.guestCount,
      budgetCeilingPaise: parentScenario.budgetCeilingPaise,
      budgetItems: structuredClone(parentScenario.budgetItems),
      tasks: structuredClone(parentScenario.tasks),
      vendors: structuredClone(parentScenario.vendors),
      constraints: structuredClone(parentScenario.constraints),
      changes: [],
      warnings: [],
      isFeasible: parentScenario.isFeasible,
      feasibilityNotes: [...parentScenario.feasibilityNotes],
      createdAt: timestamp,
      version: parentScenario.version + 1,
    };
  }

  return {
    id: crypto.randomUUID(),
    eventId: event.id,
    status: 'draft' as ScenarioStatus,
    name: name.trim(),
    description: description?.trim(),
    guestCount: event.guestCount,
    budgetCeilingPaise: event.budgetCeilingPaise,
    budgetItems: [],
    tasks: [],
    vendors: [],
    constraints: [],
    changes: [],
    warnings: [],
    isFeasible: true,
    feasibilityNotes: [],
    createdAt: timestamp,
    version: 1,
  };
}

// ─── 2. applyChangeProposal ──────────────────────────────────────────────────

/**
 * Apply every change from a ChangeProposal to a scenario, producing a new
 * immutable scenario.  Constraints are re-evaluated after all mutations.
 */
export function applyChangeProposal(
  scenario: Scenario,
  proposal: ChangeProposal,
  event: EventDetails,
): Scenario {
  if (!proposal || !Array.isArray(proposal.changes)) {
    throw new Error('Invalid change proposal: missing changes array.');
  }

  // Deep-clone so we never mutate the original.
  const draft: Scenario = structuredClone(scenario);
  const changes: ScenarioChange[] = [...draft.changes];
  draft.changeRequest = proposal.description;

  for (const change of proposal.changes) {
    switch (change.type) {
      case 'guest_count': {
        const proposed = Number(change.proposedValue);
        if (!Number.isFinite(proposed) || proposed < 0) {
          throw new Error(`Invalid guest count: ${change.proposedValue}`);
        }
        const original = draft.guestCount;
        draft.guestCount = proposed;
        draft.budgetItems = recalculatePerPersonCosts(draft.budgetItems, original, proposed);
        const delta = proposed - original;
        changes.push({
          field: 'guestCount',
          label: 'Guest Count',
          originalValue: original,
          proposedValue: proposed,
          impact: delta >= 0 ? `+${delta} guests` : `${delta} guests`,
        });
        break;
      }

      case 'budget': {
        const proposed = Number(change.proposedValue);
        if (!Number.isFinite(proposed) || proposed < 0) {
          throw new Error(`Invalid budget value: ${change.proposedValue}`);
        }
        const original = draft.budgetCeilingPaise;
        draft.budgetCeilingPaise = proposed;
        const delta = proposed - original;
        changes.push({
          field: 'budgetCeilingPaise',
          label: 'Budget Ceiling',
          originalValue: original,
          proposedValue: proposed,
          impact: delta >= 0 ? `+${formatPaise(delta)}` : formatPaise(delta),
        });
        break;
      }

      case 'add_item': {
        const newItem: BudgetItem = {
          id: crypto.randomUUID(),
          category: (change.field as BudgetItem['category']) || 'other',
          name: String(change.proposedValue),
          amountPaise: 0,
          costType: 'fixed',
          status: 'estimated',
          depositPaise: 0,
          isGenerated: false,
          sourceNote: change.reason || 'Added via scenario change',
          createdAt: now(),
          updatedAt: now(),
        };
        draft.budgetItems.push(newItem);
        changes.push({
          field: `budgetItems.${newItem.id}`,
          label: `Add Item: ${newItem.name}`,
          originalValue: '(none)',
          proposedValue: newItem.name,
          impact: 'New budget item added',
        });
        break;
      }

      case 'remove_item': {
        const itemId = String(change.proposedValue);
        const idx = draft.budgetItems.findIndex((b) => b.id === itemId);
        if (idx === -1) {
          throw new Error(`Budget item not found: ${itemId}`);
        }
        const item = draft.budgetItems[idx];
        if (item.status === 'committed' || item.status === 'paid') {
          throw new Error(
            `Cannot remove budget item "${item.name}" — status is "${item.status}".`,
          );
        }
        draft.budgetItems.splice(idx, 1);
        changes.push({
          field: `budgetItems.${itemId}`,
          label: `Remove Item: ${item.name}`,
          originalValue: item.name,
          proposedValue: '(removed)',
          impact: `-${formatPaise(item.amountPaise)}`,
        });
        break;
      }

      case 'modify_item': {
        const targetId = String(change.field);
        const idx = draft.budgetItems.findIndex((b) => b.id === targetId);
        if (idx === -1) {
          throw new Error(`Budget item not found for modification: ${targetId}`);
        }
        const before = draft.budgetItems[idx];
        const originalAmount = before.amountPaise;

        // Merge proposed value — it can be a JSON-encoded partial update or a
        // simple amount.
        if (typeof change.proposedValue === 'number') {
          draft.budgetItems[idx] = {
            ...before,
            amountPaise: change.proposedValue,
            updatedAt: now(),
          };
        } else {
          try {
            const patch = JSON.parse(String(change.proposedValue)) as Partial<BudgetItem>;
            draft.budgetItems[idx] = {
              ...before,
              ...patch,
              id: before.id, // ID is immutable
              updatedAt: now(),
            };
          } catch {
            // Treat string as a new name
            draft.budgetItems[idx] = {
              ...before,
              name: String(change.proposedValue),
              updatedAt: now(),
            };
          }
        }

        const after = draft.budgetItems[idx];
        const delta = after.amountPaise - originalAmount;
        changes.push({
          field: `budgetItems.${targetId}`,
          label: `Modify Item: ${before.name}`,
          originalValue: originalAmount,
          proposedValue: after.amountPaise,
          impact: delta !== 0
            ? (delta > 0 ? `+${formatPaise(delta)}` : formatPaise(delta))
            : 'No cost change',
        });
        break;
      }

      case 'preference': {
        const key = change.field;
        const original = (event.preferences as unknown as Record<string, unknown>)[key];
        changes.push({
          field: `preferences.${key}`,
          label: `Preference: ${key}`,
          originalValue: original != null ? String(original) : '(unset)',
          proposedValue: change.proposedValue,
          impact: 'Preference updated',
        });
        break;
      }

      case 'date': {
        changes.push({
          field: 'date',
          label: 'Event Date',
          originalValue: event.date,
          proposedValue: change.proposedValue,
          impact: 'Date changed',
        });
        break;
      }

      case 'venue': {
        changes.push({
          field: 'venue',
          label: 'Venue',
          originalValue: event.location,
          proposedValue: change.proposedValue,
          impact: 'Venue changed',
        });
        break;
      }

      default: {
        // Record unknown change types as informational.
        changes.push({
          field: change.field,
          label: change.field,
          originalValue: change.currentValue ?? '(unknown)',
          proposedValue: change.proposedValue,
          impact: change.reason || 'Changed',
        });
      }
    }
  }

  draft.changes = changes;

  // Rebuild constraints after all mutations.
  const constraints = buildDefaultConstraints(
    { ...event, guestCount: draft.guestCount, budgetCeilingPaise: draft.budgetCeilingPaise },
    draft,
  );
  const evaluated = evaluateConstraints(constraints, draft, event);
  const propagated = propagateChanges(draft, changes.map((c) => ({ field: c.field, value: c.proposedValue })));
  const feasibility = checkFeasibility(evaluated);

  draft.constraints = evaluated;
  draft.isFeasible = feasibility.feasible;
  draft.feasibilityNotes = [
    ...feasibility.hardViolations.map((v) => `[Violation] ${v.description}: ${v.violationMessage ?? ''}`),
    ...feasibility.preferenceWarnings.map((w) => `[Warning] ${w.description}: ${w.violationMessage ?? ''}`),
  ];
  draft.warnings = [
    ...propagated.warnings,
    ...feasibility.preferenceWarnings.map((w) => w.violationMessage ?? w.name),
  ];

  return draft;
}

// ─── 3. computeScenarioDiff ──────────────────────────────────────────────────

/**
 * Compare two scenarios and produce a human-readable list of changes
 * covering guest count, budget ceiling, budget items, tasks, and vendors.
 */
export function computeScenarioDiff(
  original: Scenario,
  proposed: Scenario,
): ScenarioChange[] {
  const diffs: ScenarioChange[] = [];

  // Guest count
  if (original.guestCount !== proposed.guestCount) {
    const delta = proposed.guestCount - original.guestCount;
    diffs.push({
      field: 'guestCount',
      label: 'Guest Count',
      originalValue: original.guestCount,
      proposedValue: proposed.guestCount,
      impact: delta > 0 ? `+${delta} guests` : `${delta} guests`,
    });
  }

  // Budget ceiling
  if (original.budgetCeilingPaise !== proposed.budgetCeilingPaise) {
    const delta = proposed.budgetCeilingPaise - original.budgetCeilingPaise;
    diffs.push({
      field: 'budgetCeilingPaise',
      label: 'Budget Ceiling',
      originalValue: original.budgetCeilingPaise,
      proposedValue: proposed.budgetCeilingPaise,
      impact: delta > 0 ? `+${formatPaise(delta)}` : formatPaise(delta),
    });
  }

  // Budget items — build maps by ID for O(n) comparison
  const origItemMap = new Map(original.budgetItems.map((i) => [i.id, i]));
  const propItemMap = new Map(proposed.budgetItems.map((i) => [i.id, i]));

  for (const [id, item] of propItemMap) {
    if (!origItemMap.has(id)) {
      diffs.push({
        field: `budgetItems.${id}`,
        label: `Added: ${item.name}`,
        originalValue: '(none)',
        proposedValue: `${item.name} (${formatPaise(item.amountPaise)})`,
        impact: `+${formatPaise(item.amountPaise)}`,
      });
    } else {
      const origItem = origItemMap.get(id)!;
      if (origItem.amountPaise !== item.amountPaise) {
        const delta = item.amountPaise - origItem.amountPaise;
        diffs.push({
          field: `budgetItems.${id}`,
          label: `Modified: ${item.name}`,
          originalValue: origItem.amountPaise,
          proposedValue: item.amountPaise,
          impact: delta > 0 ? `+${formatPaise(delta)}` : formatPaise(delta),
        });
      }
      if (origItem.name !== item.name) {
        diffs.push({
          field: `budgetItems.${id}.name`,
          label: `Renamed Item`,
          originalValue: origItem.name,
          proposedValue: item.name,
          impact: 'Name changed',
        });
      }
      if (origItem.status !== item.status) {
        diffs.push({
          field: `budgetItems.${id}.status`,
          label: `Status: ${item.name}`,
          originalValue: origItem.status,
          proposedValue: item.status,
          impact: `${origItem.status} → ${item.status}`,
        });
      }
    }
  }
  for (const [id, item] of origItemMap) {
    if (!propItemMap.has(id)) {
      diffs.push({
        field: `budgetItems.${id}`,
        label: `Removed: ${item.name}`,
        originalValue: `${item.name} (${formatPaise(item.amountPaise)})`,
        proposedValue: '(removed)',
        impact: `-${formatPaise(item.amountPaise)}`,
      });
    }
  }

  // Tasks — by ID
  const origTaskMap = new Map(original.tasks.map((t) => [t.id, t]));
  const propTaskMap = new Map(proposed.tasks.map((t) => [t.id, t]));

  for (const [id, task] of propTaskMap) {
    if (!origTaskMap.has(id)) {
      diffs.push({
        field: `tasks.${id}`,
        label: `Added Task: ${task.title}`,
        originalValue: '(none)',
        proposedValue: task.title,
        impact: 'New task added',
      });
    } else {
      const origTask = origTaskMap.get(id)!;
      if (origTask.status !== task.status) {
        diffs.push({
          field: `tasks.${id}.status`,
          label: `Task: ${task.title}`,
          originalValue: origTask.status,
          proposedValue: task.status,
          impact: `${origTask.status} → ${task.status}`,
        });
      }
      if (origTask.dueDate !== task.dueDate) {
        diffs.push({
          field: `tasks.${id}.dueDate`,
          label: `Task Due: ${task.title}`,
          originalValue: origTask.dueDate,
          proposedValue: task.dueDate,
          impact: 'Due date changed',
        });
      }
    }
  }
  for (const [id, task] of origTaskMap) {
    if (!propTaskMap.has(id)) {
      diffs.push({
        field: `tasks.${id}`,
        label: `Removed Task: ${task.title}`,
        originalValue: task.title,
        proposedValue: '(removed)',
        impact: 'Task removed',
      });
    }
  }

  // Vendors — by ID
  const origVendorMap = new Map(original.vendors.map((v) => [v.id, v]));
  const propVendorMap = new Map(proposed.vendors.map((v) => [v.id, v]));

  for (const [id, vendor] of propVendorMap) {
    if (!origVendorMap.has(id)) {
      diffs.push({
        field: `vendors.${id}`,
        label: `Added Vendor: ${vendor.name}`,
        originalValue: '(none)',
        proposedValue: vendor.name,
        impact: 'New vendor added',
      });
    } else {
      const origVendor = origVendorMap.get(id)!;
      if (origVendor.status !== vendor.status) {
        diffs.push({
          field: `vendors.${id}.status`,
          label: `Vendor: ${vendor.name}`,
          originalValue: origVendor.status,
          proposedValue: vendor.status,
          impact: `${origVendor.status} → ${vendor.status}`,
        });
      }
      if (origVendor.quotedPricePaise !== vendor.quotedPricePaise) {
        const delta = (vendor.quotedPricePaise ?? 0) - (origVendor.quotedPricePaise ?? 0);
        diffs.push({
          field: `vendors.${id}.quotedPricePaise`,
          label: `Quote: ${vendor.name}`,
          originalValue: origVendor.quotedPricePaise ?? 0,
          proposedValue: vendor.quotedPricePaise ?? 0,
          impact: delta > 0 ? `+${formatPaise(delta)}` : formatPaise(delta),
        });
      }
    }
  }
  for (const [id, vendor] of origVendorMap) {
    if (!propVendorMap.has(id)) {
      diffs.push({
        field: `vendors.${id}`,
        label: `Removed Vendor: ${vendor.name}`,
        originalValue: vendor.name,
        proposedValue: '(removed)',
        impact: 'Vendor removed',
      });
    }
  }

  return diffs;
}

// ─── 4. approveScenario ──────────────────────────────────────────────────────

/**
 * Mark a scenario as approved.
 * Only draft or proposed scenarios may be approved.
 * Infeasible scenarios (hard-constraint violations) cannot be approved.
 */
export function approveScenario(
  scenario: Scenario,
  options?: { allowConstraintRelaxation?: boolean },
): Scenario {
  if (scenario.status !== 'draft' && scenario.status !== 'proposed') {
    throw new Error(
      `Cannot approve a scenario with status "${scenario.status}". Only "draft" or "proposed" scenarios may be approved.`,
    );
  }

  const isExplicitRelaxation =
    Boolean(options?.allowConstraintRelaxation) &&
    (scenario.classification === 'relax_budget_ceiling' ||
      scenario.classification === 'relax_guest_count');

  if (!scenario.isFeasible && !isExplicitRelaxation) {
    const violationSummary =
      scenario.feasibilityNotes.length > 0
        ? scenario.feasibilityNotes.join('; ')
        : 'Hard constraint violations detected.';
    throw new Error(
      `Cannot approve an infeasible scenario: ${violationSummary}`,
    );
  }

  return {
    ...structuredClone(scenario),
    status: 'approved' as ScenarioStatus,
    isFeasible: true,
    approvedAt: now(),
  };
}

// ─── 5. rejectScenario ───────────────────────────────────────────────────────

/**
 * Mark a scenario as rejected, optionally with a reason appended to
 * feasibility notes.
 */
export function rejectScenario(scenario: Scenario, reason?: string): Scenario {
  const rejected = structuredClone(scenario);
  rejected.status = 'rejected' as ScenarioStatus;

  if (reason && reason.trim().length > 0) {
    rejected.feasibilityNotes = [
      ...rejected.feasibilityNotes,
      `Rejected: ${reason.trim()}`,
    ];
  }

  return rejected;
}

// ─── 6. rollbackToScenario ───────────────────────────────────────────────────

/**
 * Create a new draft scenario that is a snapshot of a target historical
 * scenario.  This preserves history — nothing is deleted.
 */
export function rollbackToScenario(
  scenarios: Record<string, Scenario>,
  targetScenarioId: string,
): Scenario {
  const target = scenarios[targetScenarioId];
  if (!target) {
    throw new Error(`Target scenario not found: ${targetScenarioId}`);
  }

  const rolled: Scenario = structuredClone(target);
  rolled.id = crypto.randomUUID();
  rolled.parentScenarioId = target.id;
  rolled.status = 'draft' as ScenarioStatus;
  rolled.createdAt = now();
  rolled.approvedAt = undefined;
  rolled.version = target.version + 1;
  rolled.changes = [];
  rolled.warnings = [];

  return rolled;
}

// ─── 7. validateScenarioForApproval ──────────────────────────────────────────

/**
 * Validate that a scenario can be approved.  Returns any blockers that
 * prevent approval (hard constraint violations, missing required fields, etc.).
 */
export function validateScenarioForApproval(
  scenario: Scenario,
  event: EventDetails,
): { canApprove: boolean; blockers: string[] } {
  const blockers: string[] = [];

  // 1) Status must be draft or proposed
  if (scenario.status !== 'draft' && scenario.status !== 'proposed') {
    blockers.push(
      `Scenario status is "${scenario.status}" — must be "draft" or "proposed".`,
    );
  }

  // 2) Hard constraint violations
  const hardViolations = scenario.constraints.filter(
    (c) => c.type === 'hard' && !c.isSatisfied,
  );
  for (const violation of hardViolations) {
    blockers.push(
      violation.violationMessage ?? `Hard constraint violated: ${violation.name}`,
    );
  }

  // 3) Budget must be defined
  if (scenario.budgetCeilingPaise <= 0) {
    blockers.push('Budget ceiling must be greater than zero.');
  }

  // 4) Guest count must be positive
  if (scenario.guestCount <= 0) {
    blockers.push('Guest count must be greater than zero.');
  }

  // 5) Event date must be present
  if (!event.date || event.date.trim().length === 0) {
    blockers.push('Event date is missing.');
  }

  // 6) Event location must be present
  if (!event.location || event.location.trim().length === 0) {
    blockers.push('Event location/venue is missing.');
  }

  // 7) Budget projected total should not exceed ceiling
  const summary = calculateBudgetSummary(
    scenario.budgetItems,
    scenario.budgetCeilingPaise,
    scenario.guestCount,
  );
  if (summary.isOverBudget) {
    blockers.push(
      `Projected total (${formatPaise(summary.projectedTotalPaise)}) exceeds budget ceiling (${formatPaise(summary.ceilingPaise)}).`,
    );
  }

  // 8) Guest count vs venue capacity
  if (event.venueCapacity > 0 && scenario.guestCount > event.venueCapacity) {
    blockers.push(
      `Guest count (${scenario.guestCount}) exceeds venue capacity (${event.venueCapacity}).`,
    );
  }

  return {
    canApprove: blockers.length === 0,
    blockers,
  };
}

// ─── 8. parseNaturalLanguageChange ───────────────────────────────────────────

/**
 * DETERMINISTIC fallback parser for natural-language change requests.
 * Uses regex-based extraction — no AI required.
 *
 * Supported patterns:
 *   "increase guest count to 280"
 *   "reduce budget to 400000"           → converted to paise
 *   "change date to 2025-03-15"
 *   "keep budget unchanged"             → preserveFields: ['budget']
 *   "don't reduce catering"             → preserveFields: ['catering']
 *   "preserve accessibility"            → preserveFields: ['accessibility']
 */
export function parseNaturalLanguageChange(input: string): ChangeProposal {
  if (!input || input.trim().length === 0) {
    throw new Error('Change request must not be empty.');
  }

  const text = input.trim().toLowerCase();
  const changes: ChangeProposal['changes'] = [];
  const preserveFields: string[] = [];
  const ambiguities: string[] = [];

  // Track which parts of the input have been parsed
  let matched = false;

  // ── Guest count patterns ────────────────────────────────────────────────
  const guestPatterns = [
    /(?:set|change|update|increase|reduce|decrease|adjust)\s+(?:the\s+)?(?:wedding\s+|birthday\s+|event\s+)?guest\s*(?:count|number|list)?\s+(?:to|=)\s*(\d+)/i,
    /(\d+)\s+guests?/i,
    /guest\s*(?:count|number)\s*(?:to|=|:)\s*(\d+)/i,
  ];
  for (const pattern of guestPatterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseInt(match[1], 10);
      if (Number.isFinite(value) && value > 0) {
        changes.push({
          type: 'guest_count',
          field: 'guestCount',
          proposedValue: value,
          reason: `Parsed from: "${input.trim()}"`,
        });
        matched = true;
        break;
      }
    }
  }

  // ── Budget patterns ─────────────────────────────────────────────────────
  const budgetPatterns = [
    /(?:set|change|update|increase|reduce|decrease|adjust)\s+(?:the\s+)?budget\s+(?:to|=)\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:lakhs?|lacs?)?/i,
    /budget\s*(?:to|=|:)\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:lakhs?|lacs?)?/i,
    /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(?:lakhs?|lacs?)?\s*budget/i,
  ];
  for (const pattern of budgetPatterns) {
    const match = text.match(pattern);
    if (match) {
      const rawStr = match[1].replace(/,/g, '');
      let value = parseFloat(rawStr);
      if (Number.isFinite(value) && value > 0) {
        // Check if "lakhs" / "lacs" modifier is present
        if (/lakhs?|lacs?/i.test(text)) {
          value *= 100_000;
        }
        // Convert rupees to paise
        const paise = Math.round(value * 100);
        changes.push({
          type: 'budget',
          field: 'budgetCeilingPaise',
          proposedValue: paise,
          reason: `Parsed from: "${input.trim()}"`,
        });
        matched = true;
        break;
      }
    }
  }

  // ── Date patterns ───────────────────────────────────────────────────────
  const datePatterns = [
    /(?:change|move|set|update|shift)\s+(?:the\s+)?date\s+(?:to|=)\s*(\d{4}-\d{2}-\d{2})/i,
    /date\s*(?:to|=|:)\s*(\d{4}-\d{2}-\d{2})/i,
    /(\d{4}-\d{2}-\d{2})/,
  ];
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const dateStr = match[1];
      // Basic validation: ensure it is a plausible date
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        changes.push({
          type: 'date',
          field: 'date',
          proposedValue: dateStr,
          reason: `Parsed from: "${input.trim()}"`,
        });
        matched = true;
        break;
      }
    }
  }

  // ── Preserve / keep-unchanged patterns ──────────────────────────────────
  const preservePatterns = [
    /(?:keep|maintain|preserve|protect|retain)\s+(?:the\s+)?(\w[\w\s]*?)\s*(?:unchanged|the same|as is|intact|untouched)/i,
    /(?:don'?t|do\s+not|never)\s+(?:reduce|change|modify|alter|touch|remove|cut)\s+(?:the\s+)?(\w[\w\s]*)/i,
    /preserve\s+(\w[\w\s]*)/i,
  ];
  for (const pattern of preservePatterns) {
    const match = text.match(pattern);
    if (match) {
      const rawField = match[1].trim();
      const field = rawField.replace(/\s+/g, '_');
      if (!preserveFields.includes(field)) {
        preserveFields.push(field);
      }
      if (rawField.includes('catering') && !preserveFields.includes('catering')) {
        preserveFields.push('catering');
      }
      if (rawField.includes('accessibility') && !preserveFields.includes('accessibility')) {
        preserveFields.push('accessibility');
      }
      if (rawField.includes('budget') && !preserveFields.includes('budget')) {
        preserveFields.push('budget');
      }
      matched = true;
    }
  }

  // ── If nothing matched, log the entire input as ambiguous ───────────────
  if (!matched) {
    ambiguities.push(
      `Could not parse a structured change from: "${input.trim()}". Please rephrase or specify the change type and value explicitly.`,
    );
  }

  return {
    description: input.trim(),
    changes,
    preserveFields,
    ambiguities,
  };
}
