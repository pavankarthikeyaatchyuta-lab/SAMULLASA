/**
 * Constraint Engine & Dependency Graph for SAMULLĀSA.
 *
 * Pure, deterministic functions that evaluate hard/preference constraints
 * against event scenarios, build task dependency graphs, detect cycles,
 * propagate changes, and generate feasible alternative scenarios.
 *
 * All monetary values are in paise (1/100 INR).
 */

import { formatPaise } from '@/lib/budget-engine';
import type {
  Constraint,
  ConstraintType,
  Scenario,
  EventDetails,
  Task,
  BudgetItem,
  BudgetCategory,
} from '@/types/events';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sum the `amountPaise` of every budget item in a scenario. */
function projectedTotal(scenario: Scenario): number {
  return scenario.budgetItems.reduce((sum, item) => sum + item.amountPaise, 0);
}

/** Check whether an ISO date string is in the future relative to `now`. */
function isDateInFuture(isoDate: string, now: Date): boolean {
  const d = new Date(isoDate);
  return !isNaN(d.getTime()) && d.getTime() > now.getTime();
}

/** Create a constraint object with a deterministic ID prefix. */
function makeConstraint(
  seed: string,
  name: string,
  type: ConstraintType,
  description: string,
  field: string,
  check: string,
): Constraint {
  return {
    id: `constraint-${seed}`,
    name,
    type,
    description,
    field,
    check,
    isSatisfied: true, // default until evaluated
    violationMessage: undefined,
  };
}

// ─── 1. buildDefaultConstraints ──────────────────────────────────────────────

/**
 * Generate the standard set of hard and preference constraints for an event
 * and a given scenario.
 */
export function buildDefaultConstraints(
  event: EventDetails,
  scenario: Scenario,
): Constraint[] {
  void event; // referenced for semantic completeness; kept for API symmetry
  void scenario;

  return [
    // --- Hard constraints ---
    makeConstraint(
      'budget-ceiling',
      'Budget Ceiling',
      'hard',
      'Projected total must not exceed the budget ceiling.',
      'budgetCeilingPaise',
      'projectedTotal <= budgetCeilingPaise',
    ),
    makeConstraint(
      'venue-capacity',
      'Venue Capacity',
      'hard',
      'Guest count must not exceed venue capacity.',
      'venueCapacity',
      'guestCount <= venueCapacity',
    ),
    makeConstraint(
      'date-validity',
      'Date Validity',
      'hard',
      'Event date must be in the future.',
      'date',
      'eventDate > now',
    ),
    makeConstraint(
      'accessibility',
      'Accessibility',
      'hard',
      'All accessibility requirements must be addressed.',
      'accessibilityRequirements',
      'allAccessibilityRequirementsAddressed',
    ),

    // --- Preference constraints ---
    makeConstraint(
      'catering-minimum',
      'Catering Minimum',
      'preference',
      'At least one catering budget item when guests are present.',
      'catering',
      'hasCateringItem || guestCount === 0',
    ),
    makeConstraint(
      'photography',
      'Photography Recommended',
      'preference',
      'Photography budget item recommended for events with more than 50 guests.',
      'photography',
      'hasPhotographyItem || guestCount <= 50',
    ),
    makeConstraint(
      'contingency',
      'Contingency Reserve',
      'preference',
      'Contingency should be at least 5% of total budget.',
      'contingency',
      'contingencyPaise >= budgetCeilingPaise * 0.05',
    ),
  ];
}

// ─── 2. evaluateConstraints ──────────────────────────────────────────────────

/**
 * Immutably evaluate every constraint against the current scenario and event.
 * Returns a new array with `isSatisfied` and `violationMessage` set.
 */
export function evaluateConstraints(
  constraints: Constraint[],
  scenario: Scenario,
  event: EventDetails,
): Constraint[] {
  const now = new Date();
  const total = projectedTotal(scenario);
  const guestCount = scenario.guestCount;
  const budgetCeiling = scenario.budgetCeilingPaise;

  const hasCateringItem = scenario.budgetItems.some(
    (item) => item.category === 'catering',
  );
  const hasPhotographyItem = scenario.budgetItems.some(
    (item) => item.category === 'photography',
  );
  const contingencyPaise = scenario.budgetItems
    .filter((item) => item.category === 'contingency')
    .reduce((sum, item) => sum + item.amountPaise, 0);

  return constraints.map((constraint): Constraint => {
    let isSatisfied = true;
    let violationMessage: string | undefined;

    switch (constraint.id) {
      // ── Hard ──
      case 'constraint-budget-ceiling': {
        isSatisfied = total <= budgetCeiling;
        if (!isSatisfied) {
          const overBy = total - budgetCeiling;
          violationMessage = `Projected total (${total} paise) exceeds budget ceiling (${budgetCeiling} paise) by ${overBy} paise.`;
        }
        break;
      }

      case 'constraint-venue-capacity': {
        isSatisfied = guestCount <= event.venueCapacity;
        if (!isSatisfied) {
          violationMessage = `Guest count (${guestCount}) exceeds venue capacity (${event.venueCapacity}).`;
        }
        break;
      }

      case 'constraint-date-validity': {
        isSatisfied = isDateInFuture(event.date, now);
        if (!isSatisfied) {
          violationMessage = `Event date (${event.date}) is not in the future.`;
        }
        break;
      }

      case 'constraint-accessibility': {
        // Every stated requirement must have a corresponding budget item or
        // vendor inclusion that mentions the requirement (case-insensitive).
        const requirements = event.accessibilityRequirements;
        if (requirements.length > 0) {
          const allText = [
            ...scenario.budgetItems.map((b) =>
              `${b.name} ${b.description ?? ''}`.toLowerCase(),
            ),
            ...scenario.vendors.flatMap((v) =>
              [...v.inclusions, v.name, v.notes ?? ''].map((i) => i.toLowerCase()),
            ),
            ...scenario.tasks.map((t) =>
              `${t.title} ${t.description ?? ''}`.toLowerCase(),
            ),
          ].join(' ');

          const unmet = requirements.filter(
            (req) => !allText.includes(req.toLowerCase()),
          );
          isSatisfied = unmet.length === 0;
          if (!isSatisfied) {
            violationMessage = `Unaddressed accessibility requirements: ${unmet.join(', ')}.`;
          }
        }
        break;
      }

      // ── Preferences ──
      case 'constraint-catering-minimum': {
        isSatisfied = hasCateringItem || guestCount === 0;
        if (!isSatisfied) {
          violationMessage =
            'No catering budget item found, but there are guests to feed.';
        }
        break;
      }

      case 'constraint-photography': {
        isSatisfied = hasPhotographyItem || guestCount <= 50;
        if (!isSatisfied) {
          violationMessage = `Photography is recommended for events with more than 50 guests (current: ${guestCount}).`;
        }
        break;
      }

      case 'constraint-contingency': {
        const minContingency = Math.floor(budgetCeiling * 0.05);
        isSatisfied = contingencyPaise >= minContingency;
        if (!isSatisfied) {
          violationMessage = `Contingency (${contingencyPaise} paise) is below 5% of budget ceiling (${minContingency} paise).`;
        }
        break;
      }

      default:
        // Unknown constraint – leave as satisfied.
        break;
    }

    return { ...constraint, isSatisfied, violationMessage };
  });
}

// ─── 3. checkFeasibility ─────────────────────────────────────────────────────

export interface FeasibilityResult {
  feasible: boolean;
  hardViolations: Constraint[];
  preferenceWarnings: Constraint[];
}

/**
 * Determine whether all hard constraints are satisfied.
 */
export function checkFeasibility(constraints: Constraint[]): FeasibilityResult {
  const hardViolations = constraints.filter(
    (c) => c.type === 'hard' && !c.isSatisfied,
  );
  const preferenceWarnings = constraints.filter(
    (c) => c.type === 'preference' && !c.isSatisfied,
  );

  return {
    feasible: hardViolations.length === 0,
    hardViolations,
    preferenceWarnings,
  };
}

// ─── 4. buildDependencyGraph ─────────────────────────────────────────────────

/**
 * Build an adjacency list mapping each task ID to the IDs of tasks that
 * depend on it (i.e. forward edges: "if taskA changes, these tasks are
 * affected").
 */
export function buildDependencyGraph(tasks: Task[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  // Initialise every task node.
  for (const task of tasks) {
    if (!graph.has(task.id)) {
      graph.set(task.id, []);
    }
  }

  // For each dependency edge (child depends on parent), add the child to the
  // parent's adjacency list.
  for (const task of tasks) {
    for (const depId of task.dependencies) {
      // Ensure the dependency node exists even if not in the tasks list.
      if (!graph.has(depId)) {
        graph.set(depId, []);
      }
      graph.get(depId)!.push(task.id);
    }
  }

  return graph;
}

// ─── 5. detectCycles ─────────────────────────────────────────────────────────

/**
 * Detect all cycles in the task dependency graph using iterative DFS.
 * Returns an array of cycles, each cycle being an array of task IDs forming
 * the loop. Returns an empty array when there are no cycles.
 */
export function detectCycles(graph: Map<string, string[]>): string[][] {
  const WHITE = 0; // unvisited
  const GREY = 1; // in current DFS path
  const BLACK = 2; // fully processed

  const colour = new Map<string, number>();
  for (const node of graph.keys()) {
    colour.set(node, WHITE);
  }

  const parent = new Map<string, string | null>();
  const cycles: string[][] = [];

  for (const startNode of graph.keys()) {
    if (colour.get(startNode) !== WHITE) continue;

    const stack: string[] = [startNode];
    parent.set(startNode, null);

    while (stack.length > 0) {
      const node = stack[stack.length - 1]!;

      if (colour.get(node) === WHITE) {
        colour.set(node, GREY);
        const neighbours = graph.get(node) ?? [];

        for (const neighbour of neighbours) {
          const nColour = colour.get(neighbour);

          if (nColour === WHITE) {
            parent.set(neighbour, node);
            stack.push(neighbour);
          } else if (nColour === GREY) {
            // Found a cycle – reconstruct it.
            const cycle: string[] = [neighbour];
            let current: string | null | undefined = node;
            while (current != null && current !== neighbour) {
              cycle.push(current);
              current = parent.get(current) ?? null;
            }
            cycle.push(neighbour);
            cycle.reverse();
            cycles.push(cycle);
          }
          // BLACK neighbours are already processed – skip.
        }
      } else {
        // Back-track: node already grey and all its children pushed.
        colour.set(node, BLACK);
        stack.pop();
      }
    }
  }

  return cycles;
}

// ─── 6. getAffectedTasks ────────────────────────────────────────────────────

/**
 * Return all task IDs transitively affected by a change to `taskId`.
 * Handles cycles by keeping a visited set.
 */
export function getAffectedTasks(
  taskId: string,
  graph: Map<string, string[]>,
): string[] {
  const visited = new Set<string>();
  const queue: string[] = [...(graph.get(taskId) ?? [])];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const children = graph.get(current) ?? [];
    for (const child of children) {
      if (!visited.has(child)) {
        queue.push(child);
      }
    }
  }

  return Array.from(visited);
}

// ─── 7. propagateChanges ─────────────────────────────────────────────────────

export interface PropagationResult {
  affectedBudgetItems: string[];
  affectedTasks: string[];
  affectedVendors: string[];
  affectedBudgetItemIds: string[];
  affectedTaskIds: string[];
  warnings: string[];
}

/**
 * Given a set of field-level changes, identify all budget items, tasks, and
 * vendors that are transitively affected, plus any warnings.
 */
export function propagateChanges(
  scenario: Scenario,
  changes: { field: string; value: number | string }[],
): PropagationResult {
  const affectedBudgetItemIds = new Set<string>();
  const affectedTaskIds = new Set<string>();
  const affectedVendorIds = new Set<string>();
  const warnings: string[] = [];

  for (const change of changes) {
    switch (change.field) {
      // ── Guest count change ──
      case 'guestCount': {
        const newGuestCount =
          typeof change.value === 'number'
            ? change.value
            : parseInt(change.value as string, 10);

        if (isNaN(newGuestCount) || newGuestCount < 0) {
          warnings.push(
            `Invalid guest count value: ${String(change.value)}.`,
          );
          break;
        }

        // Per-person budget items need recalculation.
        const perPersonItems = scenario.budgetItems.filter(
          (item) => item.costType === 'per_person',
        );
        for (const item of perPersonItems) {
          affectedBudgetItemIds.add(item.id);
          if (item.vendorId) affectedVendorIds.add(item.vendorId);
        }

        // Catering tasks and vendors are inherently guest-count-dependent.
        const cateringTasks = scenario.tasks.filter(
          (t) => t.category === 'catering',
        );
        for (const task of cateringTasks) {
          affectedTaskIds.add(task.id);
          if (task.vendorId) affectedVendorIds.add(task.vendorId);
        }

        // Catering vendors.
        const cateringVendors = scenario.vendors.filter(
          (v) => v.category === 'catering',
        );
        for (const vendor of cateringVendors) {
          affectedVendorIds.add(vendor.id);
        }

        if (
          newGuestCount > scenario.guestCount &&
          perPersonItems.length > 0
        ) {
          warnings.push(
            `Increasing guest count from ${scenario.guestCount} to ${newGuestCount} will raise per-person costs.`,
          );
        }
        break;
      }

      // ── Budget ceiling change ──
      case 'budgetCeilingPaise':
      case 'budget': {
        // All budget items potentially need re-evaluation.
        for (const item of scenario.budgetItems) {
          affectedBudgetItemIds.add(item.id);
        }

        const newCeiling =
          typeof change.value === 'number'
            ? change.value
            : parseInt(change.value as string, 10);

        if (!isNaN(newCeiling)) {
          const total = projectedTotal(scenario);
          if (total > newCeiling) {
            warnings.push(
              `Reducing budget ceiling to ${newCeiling} paise causes an over-budget situation (projected: ${total} paise).`,
            );
          }
        }
        break;
      }

      // ── Date change ──
      case 'date': {
        // All tasks with due dates may need adjustment.
        for (const task of scenario.tasks) {
          affectedTaskIds.add(task.id);
          if (task.vendorId) affectedVendorIds.add(task.vendorId);
        }

        const newDate = new Date(change.value as string);
        if (isNaN(newDate.getTime())) {
          warnings.push(
            `Invalid date value: ${String(change.value)}.`,
          );
        } else {
          const now = new Date();
          if (newDate.getTime() <= now.getTime()) {
            warnings.push('New event date is not in the future.');
          }

          // Warn about tasks whose due dates fall after the new event date.
          const overdueTasks = scenario.tasks.filter((t) => {
            const due = new Date(t.dueDate);
            return !isNaN(due.getTime()) && due.getTime() > newDate.getTime();
          });
          if (overdueTasks.length > 0) {
            warnings.push(
              `${overdueTasks.length} task(s) have due dates after the new event date.`,
            );
          }
        }
        break;
      }

      default:
        // Unknown field – note as warning.
        warnings.push(
          `Unknown change field "${change.field}"; unable to determine affected items.`,
        );
        break;
    }
  }

  // Propagate through the task dependency graph.
  if (affectedTaskIds.size > 0) {
    const graph = buildDependencyGraph(scenario.tasks);
    const directlyAffected = Array.from(affectedTaskIds);
    for (const taskId of directlyAffected) {
      const transitive = getAffectedTasks(taskId, graph);
      for (const id of transitive) {
        affectedTaskIds.add(id);
        const task = scenario.tasks.find((t) => t.id === id);
        if (task?.vendorId) affectedVendorIds.add(task.vendorId);
      }
    }
  }

  return {
    affectedBudgetItems: Array.from(affectedBudgetItemIds),
    affectedTasks: Array.from(affectedTaskIds),
    affectedVendors: Array.from(affectedVendorIds),
    affectedBudgetItemIds: Array.from(affectedBudgetItemIds),
    affectedTaskIds: Array.from(affectedTaskIds),
    warnings,
  };
}

// ─── 8. generateAlternatives ─────────────────────────────────────────────────

/**
 * When a scenario is infeasible, generate up to 3 alternative scenarios
 * that attempt to restore feasibility.
 *
 * Alternative 1 – Reduce non-priority spending categories.
 * Alternative 2 – Increase budget ceiling to meet projected needs.
 * Alternative 3 – Reduce guest count to fit budget.
 */
export function generateAlternatives(
  scenario: Scenario,
  event: EventDetails,
  _constraints?: Constraint[],
): Scenario[] {
  void _constraints;
  const alternatives: Scenario[] = [];
  const total = projectedTotal(scenario);
  const priorityAreas = event.preferences.priorityAreas ?? [];
  const originalCeiling = scenario.budgetCeilingPaise;
  const originalGuestCount = scenario.guestCount;
  const overshoot = total - originalCeiling;

  // ── Alternative 1: Strict Enforcement — Discretionary Cost Optimization ──
  // Preserves BOTH the requested guest count AND the hard budget ceiling.
  // Never touches:
  //   - Categories in priorityAreas
  //   - Core mandatory categories ('catering', 'venue')
  //   - Committed or paid items
  {
    const protectedCategories = new Set<BudgetCategory>([
      'venue',
      'catering',
      ...(priorityAreas as BudgetCategory[]),
    ]);

    let remainingDeficitToCut = Math.max(0, overshoot);
    const trimmedItems: BudgetItem[] = scenario.budgetItems.map((item) => {
      const isEligible =
        !protectedCategories.has(item.category) &&
        item.category !== 'contingency' &&
        item.status !== 'committed' &&
        item.status !== 'paid';

      if (isEligible && remainingDeficitToCut > 0) {
        const maxCutForItem = Math.floor(item.amountPaise * 0.5);
        const cut = Math.min(maxCutForItem, remainingDeficitToCut);
        remainingDeficitToCut -= cut;
        return {
          ...item,
          amountPaise: item.amountPaise - cut,
          sourceNote: `Discretionary reduction of ${formatPaise(cut)} applied to preserve budget ceiling`,
          updatedAt: new Date().toISOString(),
        };
      }
      return { ...item };
    });

    const alt1Projected = projectedTotal({ ...scenario, budgetItems: trimmedItems });
    const isStrictlyFeasible = alt1Projected <= originalCeiling && scenario.guestCount <= event.venueCapacity;

    const alt1Name = isStrictlyFeasible
      ? `Option 1: Discretionary Optimization (Preserves ${originalGuestCount} Guests & ${formatPaise(originalCeiling)} Ceiling)`
      : `Option 1: Max Discretionary Trim (Leaves ${formatPaise(alt1Projected - originalCeiling)} Deficit — Infeasible)`;

    const alt1Description = isStrictlyFeasible
      ? `Reduced discretionary expenses by ${formatPaise(total - alt1Projected)} across non-priority categories to strictly honor the ${formatPaise(originalCeiling)} ceiling while accommodating all ${originalGuestCount} guests.`
      : `Even after trimming all eligible discretionary expenses by ${formatPaise(total - alt1Projected)}, a deficit of ${formatPaise(alt1Projected - originalCeiling)} remains. Cannot accommodate ${originalGuestCount} guests within ${formatPaise(originalCeiling)} without relaxing either the budget ceiling or guest count.`;

    const alt1: Scenario = {
      ...scenario,
      id: crypto.randomUUID(),
      parentScenarioId: scenario.id,
      name: alt1Name,
      description: alt1Description,
      status: 'proposed',
      guestCount: originalGuestCount,
      budgetCeilingPaise: originalCeiling,
      budgetItems: trimmedItems,
      constraints: [],
      changes: [
        {
          field: 'budgetItems',
          label: 'Discretionary Expenses Trimmed',
          originalValue: total,
          proposedValue: alt1Projected,
          impact: isStrictlyFeasible
            ? `Saved ${formatPaise(total - alt1Projected)} to preserve original ${formatPaise(originalCeiling)} ceiling.`
            : `Saved ${formatPaise(total - alt1Projected)}, but deficit of ${formatPaise(alt1Projected - originalCeiling)} remains.`,
        },
      ],
      warnings: isStrictlyFeasible
        ? []
        : [`Discretionary cuts alone cannot close the ${formatPaise(alt1Projected - originalCeiling)} gap under the ${formatPaise(originalCeiling)} ceiling.`],
      isFeasible: isStrictlyFeasible,
      feasibilityNotes: [],
      createdAt: new Date().toISOString(),
      approvedAt: undefined,
    };

    const evaluated1 = evaluateConstraints(
      buildDefaultConstraints(event, alt1),
      alt1,
      event,
    );
    const feasibility1 = checkFeasibility(evaluated1);
    alt1.constraints = evaluated1;
    alt1.isFeasible = feasibility1.feasible;
    alt1.feasibilityNotes = [
      ...feasibility1.hardViolations.map((c) => c.violationMessage ?? c.name),
      ...feasibility1.preferenceWarnings.map(
        (c) => `Preference: ${c.violationMessage ?? c.name}`,
      ),
    ];
    if (!alt1.isFeasible && alt1.warnings.length === 0) {
      alt1.warnings = alt1.feasibilityNotes;
    }

    alternatives.push(alt1);
  }

  // ── Alternative 2: User-Approved Constraint Relaxation — Budget Ceiling Expansion ──
  // Explicitly labeled as requiring user approval to relax the budget constraint.
  {
    const newCeiling = total;

    const alt2: Scenario = {
      ...scenario,
      id: crypto.randomUUID(),
      parentScenarioId: scenario.id,
      name: `Option 2: [Relaxes Budget Ceiling] Expand Budget to ${formatPaise(newCeiling)} (Requires Host Approval)`,
      description: `Accommodates all ${originalGuestCount} guests and preserves full catering standard without cuts, but explicitly requires host approval to relax the hard budget ceiling from ${formatPaise(originalCeiling)} to ${formatPaise(newCeiling)} (+${formatPaise(newCeiling - originalCeiling)}).`,
      status: 'proposed',
      guestCount: originalGuestCount,
      budgetCeilingPaise: newCeiling,
      budgetItems: scenario.budgetItems.map((item) => ({ ...item })),
      constraints: [],
      changes: [
        {
          field: 'budgetCeilingPaise',
          label: 'Explicit Budget Ceiling Relaxation',
          originalValue: originalCeiling,
          proposedValue: newCeiling,
          impact: `Increases budget ceiling by ${formatPaise(newCeiling - originalCeiling)} to fully fund ${originalGuestCount} guests. Requires explicit host authorization.`,
        },
      ],
      warnings: [
        `Explicit Constraint Relaxation: Requires host approval to increase the budget ceiling from ${formatPaise(originalCeiling)} to ${formatPaise(newCeiling)}.`,
      ],
      isFeasible: false,
      feasibilityNotes: [],
      createdAt: new Date().toISOString(),
      approvedAt: undefined,
    };

    const evaluated2 = evaluateConstraints(
      buildDefaultConstraints(event, alt2),
      alt2,
      event,
    );
    const feasibility2 = checkFeasibility(evaluated2);
    alt2.constraints = evaluated2;
    alt2.isFeasible = feasibility2.feasible;
    alt2.feasibilityNotes = [
      ...feasibility2.hardViolations.map((c) => c.violationMessage ?? c.name),
      ...feasibility2.preferenceWarnings.map(
        (c) => `Preference: ${c.violationMessage ?? c.name}`,
      ),
    ];

    alternatives.push(alt2);
  }

  // ── Alternative 3: User-Approved Constraint Relaxation — Guest Count Adjustment ──
  // Explicitly labeled as requiring user approval to scale down guest count.
  {
    const fixedCosts = scenario.budgetItems
      .filter((item) => item.costType === 'fixed')
      .reduce((sum, item) => sum + item.amountPaise, 0);

    const perPersonItems = scenario.budgetItems.filter(
      (item) => item.costType === 'per_person',
    );
    const perPersonRateTotal = perPersonItems.reduce(
      (sum, item) => sum + (item.unitRatePaise ?? 0),
      0,
    );

    const nonPersonItems = scenario.budgetItems
      .filter(
        (item) => item.costType !== 'fixed' && item.costType !== 'per_person',
      )
      .reduce((sum, item) => sum + item.amountPaise, 0);

    let maxFittingGuests: number;
    if (perPersonRateTotal > 0) {
      const availableForGuests = originalCeiling - fixedCosts - nonPersonItems;
      maxFittingGuests = Math.max(
        1,
        Math.floor(availableForGuests / perPersonRateTotal),
      );
    } else {
      maxFittingGuests = Math.max(
        1,
        Math.min(event.venueCapacity, Math.floor(originalGuestCount * 0.8)),
      );
    }

    maxFittingGuests = Math.min(maxFittingGuests, event.venueCapacity);

    const adjustedItems: BudgetItem[] = scenario.budgetItems.map((item) => {
      if (item.costType === 'per_person' && item.unitRatePaise != null) {
        return {
          ...item,
          unitCount: maxFittingGuests,
          amountPaise: item.unitRatePaise * maxFittingGuests,
          sourceNote: `Recalculated for adjusted ${maxFittingGuests} guest count`,
          updatedAt: new Date().toISOString(),
        };
      }
      return { ...item };
    });

    const alt3: Scenario = {
      ...scenario,
      id: crypto.randomUUID(),
      parentScenarioId: scenario.id,
      name: `Option 3: [Relaxes Guest Target] Scale Guests to ${maxFittingGuests} (Requires Host Approval)`,
      description: `Strictly honors the original ${formatPaise(originalCeiling)} budget ceiling and maintains catering quality per guest, but explicitly requires host approval to adjust the guest count from ${originalGuestCount} to ${maxFittingGuests}.`,
      status: 'proposed',
      guestCount: maxFittingGuests,
      budgetCeilingPaise: originalCeiling,
      budgetItems: adjustedItems,
      constraints: [],
      changes: [
        {
          field: 'guestCount',
          label: 'Explicit Guest Count Adjustment',
          originalValue: originalGuestCount,
          proposedValue: maxFittingGuests,
          impact: `Adjusts guest count from ${originalGuestCount} to ${maxFittingGuests} to strictly fit the ${formatPaise(originalCeiling)} budget ceiling without sacrificing food quality. Requires explicit host authorization.`,
        },
      ],
      warnings: [
        `Explicit Constraint Relaxation: Requires host approval to reduce guest count from ${originalGuestCount} to ${maxFittingGuests}.`,
      ],
      isFeasible: false,
      feasibilityNotes: [],
      createdAt: new Date().toISOString(),
      approvedAt: undefined,
    };

    const evaluated3 = evaluateConstraints(
      buildDefaultConstraints(event, alt3),
      alt3,
      event,
    );
    const feasibility3 = checkFeasibility(evaluated3);
    alt3.constraints = evaluated3;
    alt3.isFeasible = feasibility3.feasible;
    alt3.feasibilityNotes = [
      ...feasibility3.hardViolations.map((c) => c.violationMessage ?? c.name),
      ...feasibility3.preferenceWarnings.map(
        (c) => `Preference: ${c.violationMessage ?? c.name}`,
      ),
    ];

    alternatives.push(alt3);
  }

  return alternatives;
}
