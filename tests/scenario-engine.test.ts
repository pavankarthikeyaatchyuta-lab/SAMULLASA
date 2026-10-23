import { describe, it, expect } from 'vitest';
import {
  parseNaturalLanguageChange,
  applyChangeProposal,
  computeScenarioDiff,
  approveScenario,
  rejectScenario,
  rollbackToScenario,
} from '@/lib/scenario-engine';
import type { EventDetails, Scenario, ChangeProposal } from '@/types/events';

describe('Scenario Engine & Natural Language Interpretation', () => {
  const mockEvent: EventDetails = {
    id: 'ev-wedding',
    name: "Vikram & Ananya's Wedding",
    type: 'wedding',
    status: 'planning',
    description: 'Master Wedding',
    date: '2026-11-20',
    location: 'Chennai',
    venueCapacity: 300,
    guestCount: 200,
    budgetCeilingPaise: 50000000, // ₹5,00,000
    currency: 'INR',
    preferences: {
      culturalStyle: 'South Indian',
      dietaryRequirements: ['Vegetarian'],
      priorityAreas: ['catering', 'photography'],
    },
    accessibilityRequirements: ['Wheelchair access'],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    currentScenarioId: 'sc-v1',
    scenarioHistory: ['sc-v1'],
  };

  const initialScenario: Scenario = {
    id: 'sc-v1',
    eventId: 'ev-wedding',
    status: 'approved',
    name: 'Version 1 Master Plan',
    guestCount: 200,
    budgetCeilingPaise: 50000000,
    budgetItems: [
      {
        id: 'bi-cat',
        category: 'catering',
        name: 'South Indian Feast',
        amountPaise: 24000000, // ₹2,40,000 (200 * ₹1,200)
        costType: 'per_person',
        unitCount: 200,
        unitRatePaise: 120000,
        status: 'quoted',
        depositPaise: 0,
        isGenerated: false,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      {
        id: 'bi-ven',
        category: 'venue',
        name: 'Temple Mandapam',
        amountPaise: 8000000, // ₹80,000
        costType: 'fixed',
        status: 'committed',
        depositPaise: 2000000,
        isGenerated: false,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      {
        id: 'bi-dec',
        category: 'decoration',
        name: 'Floral Mandap',
        amountPaise: 6000000, // ₹60,000
        costType: 'fixed',
        status: 'quoted',
        depositPaise: 0,
        isGenerated: false,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      {
        id: 'bi-con',
        category: 'contingency',
        name: 'Contingency Reserve',
        amountPaise: 3000000, // ₹30,000
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

  it('correctly parses benchmark prompt: "Increase wedding guest count to 280, keep budget unchanged..."', () => {
    const input =
      "Increase the wedding guest count to 280, keep the budget unchanged, preserve accessibility requirements and don't reduce catering quality.";
    const proposal = parseNaturalLanguageChange(input);

    expect(proposal.changes.some((c) => c.type === 'guest_count' && c.proposedValue === 280)).toBe(true);
    expect(proposal.preserveFields).toContain('budget');
    expect(proposal.preserveFields).toContain('catering');
    expect(proposal.preserveFields).toContain('accessibility');
  });

  it('correctly parses budget reduction prompt', () => {
    const input = 'reduce budget to 400000';
    const proposal = parseNaturalLanguageChange(input);

    expect(proposal.changes.some((c) => c.type === 'budget' && c.proposedValue === 40000000)).toBe(true);
  });

  it('applies change proposal to create a proposed scenario without corrupting original plan', () => {
    const proposal: ChangeProposal = {
      description: 'Increase guests to 280',
      changes: [
        {
          type: 'guest_count',
          field: 'guestCount',
          proposedValue: 280,
          reason: 'Extended family invitations',
        },
      ],
      preserveFields: ['budget', 'catering'],
      ambiguities: [],
    };

    const proposed = applyChangeProposal(initialScenario, proposal, mockEvent);

    // Proposed scenario updated
    expect(proposed.guestCount).toBe(280);
    const cateringItem = proposed.budgetItems.find((i) => i.category === 'catering')!;
    expect(cateringItem.unitCount).toBe(280);
    expect(cateringItem.amountPaise).toBe(280 * 120000); // 33600000 paise

    // Original scenario completely preserved
    expect(initialScenario.guestCount).toBe(200);
    const origCatering = initialScenario.budgetItems.find((i) => i.category === 'catering')!;
    expect(origCatering.unitCount).toBe(200);
    expect(origCatering.amountPaise).toBe(24000000);
  });

  it('computes scenario diffs accurately', () => {
    const proposed: Scenario = {
      ...initialScenario,
      guestCount: 280,
      budgetItems: initialScenario.budgetItems.map((item) =>
        item.category === 'catering'
          ? { ...item, unitCount: 280, amountPaise: 33600000 }
          : item,
      ),
    };

    const diffs = computeScenarioDiff(initialScenario, proposed);
    expect(diffs.length).toBeGreaterThan(0);
    expect(diffs.some((d) => d.field === 'guestCount' && d.proposedValue === 280)).toBe(true);
  });

  it('approves feasible scenario and updates status and timestamp', () => {
    const feasibleScenario: Scenario = {
      ...initialScenario,
      id: 'sc-v2',
      status: 'proposed',
      isFeasible: true,
    };

    const approved = approveScenario(feasibleScenario);
    expect(approved.status).toBe('approved');
    expect(approved.approvedAt).toBeDefined();
  });

  it('rejects proposed scenario cleanly without modifying base plan', () => {
    const proposed: Scenario = {
      ...initialScenario,
      id: 'sc-v2',
      status: 'proposed',
    };

    const rejected = rejectScenario(proposed, 'Rejected by host');
    expect(rejected.status).toBe('rejected');
  });

  it('rolls back to prior scenario version safely without data corruption', () => {
    const scenarios = {
      'sc-v1': initialScenario,
      'sc-v2': {
        ...initialScenario,
        id: 'sc-v2',
        version: 2,
        guestCount: 250,
      },
    };

    const restored = rollbackToScenario(scenarios, 'sc-v1');
    expect(restored.guestCount).toBe(200);
    expect(restored.id).not.toBe('sc-v1'); // creates new draft version
  });
});
