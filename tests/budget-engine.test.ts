import { describe, it, expect } from 'vitest';
import {
  calculateBudgetSummary,
  recalculatePerPersonCosts,
  validateBudgetConstraints,
  findBudgetReductions,
  formatPaise,
  parsePaiseFromDisplay,
  getCategoryLabel,
} from '@/lib/budget-engine';
import type { BudgetItem } from '@/types/events';

describe('Budget Engine — Deterministic Financial Calculations', () => {
  const sampleItems: BudgetItem[] = [
    {
      id: 'item-1',
      category: 'venue',
      name: 'Banquet Hall',
      amountPaise: 8000000, // ₹80,000
      costType: 'fixed',
      status: 'committed',
      depositPaise: 2000000,
      isGenerated: false,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    {
      id: 'item-2',
      category: 'catering',
      name: 'South Indian Feast',
      amountPaise: 24000000, // ₹2,40,000 (200 guests * ₹1,200)
      costType: 'per_person',
      unitCount: 200,
      unitRatePaise: 120000, // ₹1,200 in paise
      status: 'quoted',
      depositPaise: 0,
      isGenerated: false,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    {
      id: 'item-3',
      category: 'contingency',
      name: 'Emergency Buffer',
      amountPaise: 3000000, // ₹30,000
      costType: 'fixed',
      status: 'estimated',
      depositPaise: 0,
      isGenerated: false,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
  ];

  it('calculates totals, actual spent, and category breakdown without floating-point errors', () => {
    const summary = calculateBudgetSummary(sampleItems, 50000000, 200);

    expect(summary.ceilingPaise).toBe(50000000);
    expect(summary.projectedTotalPaise).toBe(35000000); // 80k + 240k + 30k = 350k
    expect(summary.remainingPaise).toBe(15000000); // 500k - 350k = 150k
    expect(summary.actualSpentPaise).toBe(8000000); // only committed banquet hall
    expect(summary.contingencyPaise).toBe(3000000);
    expect(summary.perPersonPaise).toBe(175000); // 350k / 200 = ₹1,750
    expect(summary.isOverBudget).toBe(false);
    expect(summary.categoryBreakdown.venue).toBe(8000000);
    expect(summary.categoryBreakdown.catering).toBe(24000000);
    expect(summary.categoryBreakdown.contingency).toBe(3000000);
  });

  it('handles zero guest count safely without division by zero', () => {
    const summary = calculateBudgetSummary(sampleItems, 50000000, 0);
    expect(summary.perPersonPaise).toBe(0);
    expect(Number.isFinite(summary.perPersonPaise)).toBe(true);
  });

  it('recalculates per-person costs accurately when guest count changes', () => {
    const updated = recalculatePerPersonCosts(sampleItems, 200, 280);
    const catering = updated.find((i) => i.category === 'catering')!;

    expect(catering.unitCount).toBe(280);
    expect(catering.amountPaise).toBe(280 * 120000); // 280 * ₹1,200 = ₹3,36,000 (33600000 paise)

    // Fixed items should remain unchanged
    const venue = updated.find((i) => i.category === 'venue')!;
    expect(venue.amountPaise).toBe(8000000);
  });

  it('detects over-budget condition accurately', () => {
    const overBudgetItems: BudgetItem[] = [
      {
        ...sampleItems[0],
        amountPaise: 60000000, // ₹6,00,000
      },
    ];
    const summary = calculateBudgetSummary(overBudgetItems, 50000000, 100);
    expect(summary.isOverBudget).toBe(true);
    expect(summary.variancePaise).toBe(-10000000);

    const check = validateBudgetConstraints(summary);
    expect(check.valid).toBe(false);
    expect(check.violations.length).toBeGreaterThan(0);
  });

  it('formats currency in Indian numbering system format correctly', () => {
    expect(formatPaise(50000000)).toBe('₹5,00,000.00');
    expect(formatPaise(12345678)).toBe('₹1,23,456.78');
    expect(formatPaise(0)).toBe('₹0.00');
    expect(formatPaise(-500000)).toBe('-₹5,000.00');
  });

  it('parses currency input back to paise correctly', () => {
    expect(parsePaiseFromDisplay('₹5,00,000.00')).toBe(50000000);
    expect(parsePaiseFromDisplay('500000')).toBe(50000000);
    expect(parsePaiseFromDisplay('1234.50')).toBe(123450);
    expect(parsePaiseFromDisplay('invalid')).toBeNull();
  });

  it('returns human-readable labels for all budget categories', () => {
    expect(getCategoryLabel('catering')).toBe('Catering');
    expect(getCategoryLabel('venue')).toBe('Venue');
    expect(getCategoryLabel('contingency')).toBe('Contingency');
  });

  it('finds budget reduction proposals without touching protected categories', () => {
    const proposals = findBudgetReductions(sampleItems, 5000000, ['catering']);
    expect(proposals.length).toBeGreaterThan(0);
    // None of the reduced items in the proposals should be catering
    for (const proposal of proposals) {
      for (const item of proposal) {
        expect(item.category).not.toBe('catering');
      }
    }
  });
});
