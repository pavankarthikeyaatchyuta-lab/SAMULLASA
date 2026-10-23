/**
 * Budget calculation engine for SAMULLĀSA.
 *
 * All monetary values are in paise (1/100 INR).
 * Every function is pure, deterministic, and side-effect free.
 */

import type {
  BudgetItem,
  BudgetSummary,
  BudgetCategory,
} from '@/types/events';

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_CATEGORIES: readonly BudgetCategory[] = [
  'venue',
  'catering',
  'decoration',
  'photography',
  'entertainment',
  'transport',
  'equipment',
  'attire',
  'invitations',
  'gifts',
  'contingency',
  'other',
] as const;

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  venue: 'Venue',
  catering: 'Catering',
  decoration: 'Decoration',
  photography: 'Photography & Video',
  entertainment: 'Entertainment',
  transport: 'Transport & Logistics',
  equipment: 'Equipment & Rentals',
  attire: 'Attire & Grooming',
  invitations: 'Invitations & Stationery',
  gifts: 'Gifts & Favours',
  contingency: 'Contingency',
  other: 'Other / Miscellaneous',
};

/** Minimum recommended contingency as a fraction of the ceiling. */
const MIN_CONTINGENCY_FRACTION = 0.05;

// ─── Core Calculations ──────────────────────────────────────────────────────

/**
 * Build a complete {@link BudgetSummary} from a list of budget items.
 *
 * @param items          – All budget line items.
 * @param ceilingPaise   – Hard budget ceiling in paise.
 * @param guestCount     – Current guest count (≥ 0).
 */
export function calculateBudgetSummary(
  items: BudgetItem[],
  ceilingPaise: number,
  guestCount: number,
): BudgetSummary {
  const safeCeiling = safeInt(ceilingPaise);
  const safeGuests = Math.max(0, Math.floor(safeInt(guestCount)));

  // Initialise every category to 0
  const categoryBreakdown = {} as Record<BudgetCategory, number>;
  for (const cat of ALL_CATEGORIES) {
    categoryBreakdown[cat] = 0;
  }

  let projectedTotalPaise = 0;
  let actualSpentPaise = 0;
  let contingencyPaise = 0;

  for (const item of items) {
    const amount = safeInt(item.amountPaise);

    projectedTotalPaise += amount;
    categoryBreakdown[item.category] += amount;

    if (item.status === 'committed' || item.status === 'paid') {
      actualSpentPaise += amount;
    }

    if (item.category === 'contingency') {
      contingencyPaise += amount;
    }
  }

  const remainingPaise = safeCeiling - projectedTotalPaise;
  const variancePaise = safeCeiling - projectedTotalPaise;
  const isOverBudget = projectedTotalPaise > safeCeiling;
  const perPersonPaise =
    safeGuests > 0 ? Math.round(projectedTotalPaise / safeGuests) : 0;
  const utilizationPercent =
    safeCeiling > 0
      ? Math.round((projectedTotalPaise / safeCeiling) * 10000) / 100
      : 0;

  return {
    ceilingPaise: safeCeiling,
    projectedTotalPaise,
    actualSpentPaise,
    remainingPaise,
    contingencyPaise,
    categoryBreakdown,
    perPersonPaise,
    variancePaise,
    isOverBudget,
    utilizationPercent,
  };
}

// ─── Guest-Count Re-calculation ──────────────────────────────────────────────

/**
 * Return a **new** array of budget items with per-person costs recalculated
 * for a changed guest count.  Items of other cost types are preserved as-is.
 *
 * @param items         – Original budget items (not mutated).
 * @param _oldGuestCount – Previous guest count (unused but kept for API symmetry).
 * @param newGuestCount – New guest count.
 */
export function recalculatePerPersonCosts(
  items: BudgetItem[],
  _oldGuestCount: number,
  newGuestCount: number,
): BudgetItem[] {
  const safeNew = Math.max(0, Math.floor(safeInt(newGuestCount)));

  return items.map((item) => {
    if (item.costType !== 'per_person') {
      return { ...item };
    }

    const unitRate = safeInt(item.unitRatePaise ?? 0);
    return {
      ...item,
      amountPaise: unitRate * safeNew,
      unitCount: safeNew,
    };
  });
}

// ─── Constraint Validation ───────────────────────────────────────────────────

/**
 * Validate a budget summary against business rules.
 *
 * Current checks:
 * 1. Over-budget violation (hard).
 * 2. Contingency below 5 % of ceiling (warning, still included in violations list).
 */
export function validateBudgetConstraints(summary: BudgetSummary): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  if (summary.isOverBudget) {
    const overBy = summary.projectedTotalPaise - summary.ceilingPaise;
    violations.push(
      `Budget exceeded by ${formatPaise(overBy)}. Projected ${formatPaise(summary.projectedTotalPaise)} vs ceiling ${formatPaise(summary.ceilingPaise)}.`,
    );
  }

  if (summary.ceilingPaise > 0) {
    const minContingency = Math.round(
      summary.ceilingPaise * MIN_CONTINGENCY_FRACTION,
    );
    if (summary.contingencyPaise < minContingency) {
      violations.push(
        `Contingency is ${formatPaise(summary.contingencyPaise)}, which is below the recommended 5 % minimum of ${formatPaise(minContingency)}.`,
      );
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

// ─── Reduction Suggestions ───────────────────────────────────────────────────

/**
 * Find up to 3 sets of budget items whose amounts could be reduced to reach
 * a target saving.  Only items with status `estimated` or `quoted` and NOT in
 * a protected category are considered.
 *
 * Strategy (deterministic, no AI):
 * 1. **Largest-first**: greedily pick the biggest reducible items.
 * 2. **Spread-even**: reduce every eligible item by an equal percentage.
 * 3. **Category-trim**: reduce by the category with the highest total first.
 *
 * Each suggestion contains the items with their reduced `amountPaise` values.
 * If a strategy cannot reach the target, it still returns what it can.
 */
export function findBudgetReductions(
  items: BudgetItem[],
  targetSavingsPaise: number,
  protectedCategories: BudgetCategory[],
): BudgetItem[][] {
  const target = safeInt(targetSavingsPaise);
  if (target <= 0) return [];

  const protectedSet = new Set<BudgetCategory>(protectedCategories);

  const eligible = items.filter(
    (item) =>
      (item.status === 'estimated' || item.status === 'quoted') &&
      !protectedSet.has(item.category) &&
      item.amountPaise > 0,
  );

  if (eligible.length === 0) return [];

  const suggestions: BudgetItem[][] = [];

  // ── Strategy 1: Largest-first greedy ────────────────────────────────────
  suggestions.push(largestFirstReduction(eligible, target));

  // ── Strategy 2: Spread-even percentage ──────────────────────────────────
  suggestions.push(spreadEvenReduction(eligible, target));

  // ── Strategy 3: Category-trim ───────────────────────────────────────────
  suggestions.push(categoryTrimReduction(eligible, target));

  // De-duplicate identical suggestions (by comparing serialised amounts)
  const unique: BudgetItem[][] = [];
  const seen = new Set<string>();
  for (const suggestion of suggestions) {
    if (suggestion.length === 0) continue;
    const key = suggestion
      .map((i) => `${i.id}:${i.amountPaise}`)
      .sort()
      .join('|');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(suggestion);
    }
  }

  return unique.slice(0, 3);
}

/** Reduce the largest items first until we reach the target. */
function largestFirstReduction(
  eligible: BudgetItem[],
  target: number,
): BudgetItem[] {
  const sorted = [...eligible].sort((a, b) => b.amountPaise - a.amountPaise);
  const result: BudgetItem[] = [];
  let remaining = target;

  for (const item of sorted) {
    if (remaining <= 0) break;

    // Try to cut up to 50 % of the item
    const maxCut = Math.floor(item.amountPaise * 0.5);
    const cut = Math.min(maxCut, remaining);
    if (cut <= 0) continue;

    result.push({ ...item, amountPaise: item.amountPaise - cut });
    remaining -= cut;
  }

  return result;
}

/** Reduce every eligible item by the same percentage. */
function spreadEvenReduction(
  eligible: BudgetItem[],
  target: number,
): BudgetItem[] {
  const totalEligible = eligible.reduce((s, i) => s + i.amountPaise, 0);
  if (totalEligible <= 0) return [];

  // Cap the cut percentage at 50 %
  const rawFraction = target / totalEligible;
  const fraction = Math.min(rawFraction, 0.5);

  const result: BudgetItem[] = [];
  for (const item of eligible) {
    const cut = Math.round(item.amountPaise * fraction);
    if (cut <= 0) continue;
    result.push({ ...item, amountPaise: item.amountPaise - cut });
  }

  return result;
}

/** Group eligible items by category, reduce the largest category first. */
function categoryTrimReduction(
  eligible: BudgetItem[],
  target: number,
): BudgetItem[] {
  // Aggregate totals by category
  const catTotals = new Map<BudgetCategory, number>();
  for (const item of eligible) {
    catTotals.set(
      item.category,
      (catTotals.get(item.category) ?? 0) + item.amountPaise,
    );
  }

  // Sort categories by total descending
  const sortedCats = [...catTotals.entries()].sort((a, b) => b[1] - a[1]);

  const result: BudgetItem[] = [];
  let remaining = target;

  for (const [cat] of sortedCats) {
    if (remaining <= 0) break;

    const catItems = eligible.filter((i) => i.category === cat);
    const catTotal = catItems.reduce((s, i) => s + i.amountPaise, 0);
    if (catTotal <= 0) continue;

    // Cut up to 50 % of this category
    const maxCatCut = Math.floor(catTotal * 0.5);
    const catCut = Math.min(maxCatCut, remaining);
    const fraction = catCut / catTotal;

    for (const item of catItems) {
      const cut = Math.round(item.amountPaise * fraction);
      if (cut <= 0) continue;
      result.push({ ...item, amountPaise: item.amountPaise - cut });
    }

    remaining -= catCut;
  }

  return result;
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/**
 * Format an amount in paise as an INR string using the Indian numbering system.
 *
 * Examples:
 * - `123456789`  → `"₹12,34,567.89"`
 * - `-50000`     → `"-₹500.00"`
 * - `0`          → `"₹0.00"`
 */
export function formatPaise(amountPaise: number): string {
  const safe = safeInt(amountPaise);
  const isNegative = safe < 0;
  const abs = Math.abs(safe);

  const rupees = Math.floor(abs / 100);
  const paise = abs % 100;
  const paiseStr = paise.toString().padStart(2, '0');

  const rupeesFormatted = formatIndianNumber(rupees);
  return `${isNegative ? '-' : ''}₹${rupeesFormatted}.${paiseStr}`;
}

/**
 * Format a non-negative integer using the Indian grouping system
 * (rightmost 3 digits, then groups of 2).
 *
 * Examples:
 * - `1234567` → `"12,34,567"`
 * - `999`     → `"999"`
 * - `0`       → `"0"`
 */
function formatIndianNumber(n: number): string {
  const str = n.toString();
  if (str.length <= 3) return str;

  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);

  // Group remaining digits in pairs from the right
  const pairs: string[] = [];
  for (let i = rest.length; i > 0; i -= 2) {
    pairs.unshift(rest.slice(Math.max(0, i - 2), i));
  }

  return `${pairs.join(',')},${last3}`;
}

/**
 * Parse an INR display string back to paise.
 *
 * Accepts formats:
 * - `"₹1,23,456.78"`
 * - `"1,23,456.78"`
 * - `"123456.78"`
 * - `"123456"`
 * - `"-₹500.00"`
 *
 * Returns `null` for invalid or unparseable input.
 */
export function parsePaiseFromDisplay(display: string): number | null {
  if (typeof display !== 'string' || display.trim().length === 0) {
    return null;
  }

  let cleaned = display.trim();

  // Detect and strip negative sign
  let isNegative = false;
  if (cleaned.startsWith('-')) {
    isNegative = true;
    cleaned = cleaned.slice(1);
  }

  // Strip currency symbol
  cleaned = cleaned.replace(/₹/g, '').trim();

  // Strip commas
  cleaned = cleaned.replace(/,/g, '');

  if (cleaned.length === 0) {
    return null;
  }

  // Validate: must be a numeric string, optionally with one decimal point
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) {
    return null;
  }

  const parts = cleaned.split('.');
  const rupees = parseInt(parts[0], 10);
  let paise = 0;

  if (parts.length === 2) {
    const paisePart = parts[1].padEnd(2, '0');
    paise = parseInt(paisePart, 10);
  }

  if (!Number.isFinite(rupees) || !Number.isFinite(paise)) {
    return null;
  }

  const total = rupees * 100 + paise;
  return isNegative ? -total : total;
}

// ─── Labels ──────────────────────────────────────────────────────────────────

/**
 * Return a human-readable label for the given {@link BudgetCategory}.
 */
export function getCategoryLabel(category: BudgetCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Coerce a value to a safe integer, treating NaN / Infinity / undefined as 0. */
function safeInt(value: number | undefined | null): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value);
}
