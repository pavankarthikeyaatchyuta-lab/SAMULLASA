import { describe, it, expect } from 'vitest';
import { generateSampleData } from '@/lib/sample-data';
import { calculateBudgetSummary } from '@/lib/budget-engine';
import {
  parseNaturalLanguageChange,
  applyChangeProposal,
  approveScenario,
} from '@/lib/scenario-engine';
import {
  buildDefaultConstraints,
  evaluateConstraints,
  generateAlternatives,
} from '@/lib/constraint-engine';
import type { EventDetails, Scenario } from '@/types/events';

describe('Integration & End-to-End Planning Workflows', () => {
  it('Primary Benchmark Demonstration Workflow: Birthday from 200 to 280 guests', () => {
    // 1. Load initial benchmark wedding
    const { events, scenarios } = generateSampleData();
    const wedding = events[0];
    const initialScenario = scenarios[wedding.currentScenarioId];

    expect(wedding.type).toBe('birthday');
    expect(wedding.guestCount).toBe(200);
    expect(wedding.budgetCeilingPaise).toBe(50000000); // ₹5,00,000

    const initialSummary = calculateBudgetSummary(
      initialScenario.budgetItems,
      initialScenario.budgetCeilingPaise,
      initialScenario.guestCount,
    );
    expect(initialSummary.isOverBudget).toBe(false);

    // 2. Issue user request:
    // "Increase the birthday guest count to 280, keep the total budget unchanged, preserve accessibility requirements and don't reduce catering quality."
    const prompt =
      "Increase the wedding guest count to 280, keep the total budget unchanged, preserve accessibility requirements and don't reduce catering quality.";
    const proposal = parseNaturalLanguageChange(prompt);

    // 3. Apply change proposal to generate proposed scenario
    const proposed = applyChangeProposal(initialScenario, proposal, wedding);
    expect(proposed.guestCount).toBe(280);

    // 4. Recalculate affected expenses: catering per-person increases
    const cateringItem = proposed.budgetItems.find((i) => i.category === 'catering')!;
    expect(cateringItem.unitCount).toBe(280);
    // Catering rate is ₹1,200 (120000 paise). For 280 guests = ₹3,36,000 (33600000 paise)
    expect(cateringItem.amountPaise).toBe(33600000);

    // 5. Total projected budget recalculation
    const proposedSummary = calculateBudgetSummary(
      proposed.budgetItems,
      proposed.budgetCeilingPaise,
      proposed.guestCount,
    );

    // Venue (80k) + Catering (336k) + Decor (60k) + Photo (45k) + Music (30k) + Invites (15k) + Cont (30k) = ₹5,96,000
    // Ceiling is ₹5,00,000 -> so projected > ceiling!
    expect(proposedSummary.projectedTotalPaise).toBeGreaterThan(proposed.budgetCeilingPaise);
    expect(proposedSummary.isOverBudget).toBe(true);

    // 6. Hard constraint evaluation: must catch over-budget violation!
    const constraints = buildDefaultConstraints(wedding, proposed);
    const evaluated = evaluateConstraints(constraints, proposed, wedding);
    const budgetConstraint = evaluated.find((c) => c.field === 'budgetCeilingPaise')!;
    expect(budgetConstraint.isSatisfied).toBe(false);

    // 7. Verify alternatives are generated
    const alternatives = generateAlternatives(proposed, wedding, evaluated);
    expect(alternatives.length).toBeGreaterThan(0);

    // Alternative 1 trims non-essential discretionary costs
    // Alternative 2 suggests expanding the ceiling
    // Alternative 3 reduces guests to fit budget
    expect(alternatives.some((a) => a.budgetCeilingPaise > wedding.budgetCeilingPaise)).toBe(true);

    // 8. Approve a feasible alternative
    const feasibleAlt = alternatives.find((a) => a.budgetCeilingPaise > wedding.budgetCeilingPaise)!;
    const approved = approveScenario(feasibleAlt, { allowConstraintRelaxation: true });
    expect(approved.status).toBe('approved');
    expect(approved.approvedAt).toBeDefined();
  });

  it('Secondary Workflow: Birthday celebration with tight budget limit', () => {
    const birthdayEvent: EventDetails = {
      id: 'ev-bday',
      name: "Aarav's 5th Birthday Party",
      type: 'birthday',
      status: 'planning',
      description: 'Superheroes Theme Party',
      date: '2026-08-10',
      location: 'Hyderabad',
      venueCapacity: 60,
      guestCount: 40,
      budgetCeilingPaise: 5000000, // ₹50,000
      currency: 'INR',
      preferences: {
        theme: 'Superhero Marvel',
        dietaryRequirements: ['Vegetarian', 'Nut-free'],
        priorityAreas: ['entertainment', 'catering'],
      },
      accessibilityRequirements: ['Child-safe play zone'],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      currentScenarioId: 'sc-bday-1',
      scenarioHistory: ['sc-bday-1'],
    };

    const bdayScenario: Scenario = {
      id: 'sc-bday-1',
      eventId: 'ev-bday',
      status: 'approved',
      name: 'Initial Birthday Plan',
      guestCount: 40,
      budgetCeilingPaise: 5000000,
      budgetItems: [
        {
          id: 'b-cat',
          category: 'catering',
          name: 'Kids Snacks & Cake',
          amountPaise: 2000000, // ₹20,000 (40 * ₹500)
          costType: 'per_person',
          unitCount: 40,
          unitRatePaise: 50000,
          status: 'quoted',
          depositPaise: 0,
          isGenerated: false,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
        {
          id: 'b-ent',
          category: 'entertainment',
          name: 'Magician & Game Host',
          amountPaise: 1500000, // ₹15,000
          costType: 'fixed',
          status: 'quoted',
          depositPaise: 0,
          isGenerated: false,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
        {
          id: 'b-dec',
          category: 'decoration',
          name: 'Balloon Arch & Theme Banner',
          amountPaise: 1000000, // ₹10,000
          costType: 'fixed',
          status: 'estimated',
          depositPaise: 0,
          isGenerated: false,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
      ],
      tasks: [],
      vendors: [],
      constraints: [],
      changes: [],
      warnings: [],
      isFeasible: true,
      feasibilityNotes: [],
      createdAt: '2025-01-01',
      version: 1,
    };

    const summary = calculateBudgetSummary(
      bdayScenario.budgetItems,
      bdayScenario.budgetCeilingPaise,
      bdayScenario.guestCount,
    );
    expect(birthdayEvent.type).toBe('birthday');
    expect(summary.projectedTotalPaise).toBe(4500000); // ₹45,000
    expect(summary.remainingPaise).toBe(500000); // ₹5,000 buffer
    expect(summary.isOverBudget).toBe(false);
  });

  it('Tertiary Workflow: Community cultural festival with venue capacity bounds', () => {
    const communityEvent: EventDetails = {
      id: 'ev-comm',
      name: 'Diwali Community Mela & Cultural Evening',
      type: 'community',
      status: 'planning',
      description: 'Neighborhood gathering with performances and food stalls',
      date: '2026-10-30',
      location: 'Pune',
      venueCapacity: 500, // strict hall capacity
      guestCount: 450,
      budgetCeilingPaise: 20000000, // ₹2,00,000
      currency: 'INR',
      preferences: {
        dietaryRequirements: ['All vegetarian stalls'],
        priorityAreas: ['equipment', 'venue'],
      },
      accessibilityRequirements: ['Wheelchair ramps at all stall aisles'],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      currentScenarioId: 'sc-comm-1',
      scenarioHistory: ['sc-comm-1'],
    };

    const commScenario: Scenario = {
      id: 'sc-comm-1',
      eventId: 'ev-comm',
      status: 'approved',
      name: 'Community Base Plan',
      guestCount: 450,
      budgetCeilingPaise: 20000000,
      budgetItems: [],
      tasks: [],
      vendors: [],
      constraints: [],
      changes: [],
      warnings: [],
      isFeasible: true,
      feasibilityNotes: [],
      createdAt: '2025-01-01',
      version: 1,
    };

    // Attempting to exceed venue capacity to 600 > 500
    const overCapacityScenario: Scenario = {
      ...commScenario,
      guestCount: 600,
    };

    const constraints = buildDefaultConstraints(communityEvent, overCapacityScenario);
    const evaluated = evaluateConstraints(constraints, overCapacityScenario, communityEvent);
    const capacityConstraint = evaluated.find((c) => c.field === 'venueCapacity')!;
    expect(capacityConstraint.isSatisfied).toBe(false);
  });
});
