// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { POST as interpretRoute } from '@/app/api/ai/interpret/route';
import { NextRequest } from 'next/server';
import { generateAlternatives } from '@/lib/constraint-engine';
import { approveScenario, rejectScenario } from '@/lib/scenario-engine';
import { storeReducer, StoreProvider } from '@/lib/store';
import ScenariosPage from '@/app/scenarios/page';
import type { EventDetails, Scenario, AppState } from '@/types/events';

describe('SAMULLĀSA — Adversarial Regression & Verification Test Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // Mock baseline event & scenario
  const mockEvent: EventDetails = {
    id: 'ev-wedding-test',
    name: 'Ananya & Vikram Wedding',
    type: 'wedding',
    status: 'planning',
    description: 'Adversarial Test Wedding',
    date: '2026-11-20',
    location: 'Chennai',
    venueCapacity: 300,
    guestCount: 200,
    budgetCeilingPaise: 50000000, // ₹5,00,000.00
    currency: 'INR',
    preferences: {
      dietaryRequirements: ['Vegetarian'],
      priorityAreas: ['catering', 'photography'],
    },
    accessibilityRequirements: ['Wheelchair accessible venue'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    currentScenarioId: 'sc-baseline',
    scenarioHistory: ['sc-baseline'],
  };

  const mockScenario: Scenario = {
    id: 'sc-baseline',
    eventId: 'ev-wedding-test',
    status: 'approved',
    name: 'Baseline Plan',
    guestCount: 200,
    budgetCeilingPaise: 50000000,
    budgetItems: [
      {
        id: 'bi-cat',
        category: 'catering',
        name: 'South Indian Feast',
        amountPaise: 24000000, // ₹2,40,000
        costType: 'per_person',
        unitCount: 200,
        unitRatePaise: 120000, // ₹1,200/guest
        status: 'quoted',
        depositPaise: 0,
        isGenerated: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'bi-venue',
        category: 'venue',
        name: 'Wedding Hall',
        amountPaise: 8000000, // ₹80,000
        costType: 'fixed',
        status: 'committed',
        depositPaise: 0,
        isGenerated: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'bi-photo',
        category: 'photography',
        name: 'Studio Photography',
        amountPaise: 4500000, // ₹45,000 (Priority protected)
        costType: 'fixed',
        status: 'quoted',
        depositPaise: 0,
        isGenerated: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'bi-music',
        category: 'entertainment',
        name: 'Music & DJ',
        amountPaise: 3000000, // ₹30,000 (Discretionary)
        costType: 'fixed',
        status: 'estimated',
        depositPaise: 0,
        isGenerated: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'bi-invites',
        category: 'invitations',
        name: 'Digital & Print Invites',
        amountPaise: 1500000, // ₹15,000 (Discretionary)
        costType: 'fixed',
        status: 'estimated',
        depositPaise: 0,
        isGenerated: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'bi-cont',
        category: 'contingency',
        name: 'Contingency',
        amountPaise: 3000000, // ₹30,000
        costType: 'fixed',
        status: 'estimated',
        depositPaise: 0,
        isGenerated: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    tasks: [
      {
        id: 'task-access',
        title: 'Inspect venue for wheelchair access',
        description: 'Confirm Wheelchair accessible venue entry and ramps',
        dueDate: '2026-10-01',
        priority: 'high',
        status: 'completed',
        dependencies: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    vendors: [],
    constraints: [],
    changes: [],
    warnings: [],
    isFeasible: true,
    feasibilityNotes: [],
    createdAt: '2026-01-01T00:00:00Z',
    version: 1,
  };

  // Case 1: Gemini response succeeds and validated output is returned (mocked HTTP boundary)
  it('1. Gemini response succeeds and validated output is returned via mocked HTTP boundary', async () => {
    process.env.GEMINI_API_KEY = 'valid-mock-key';
    process.env.GEMINI_MODEL = 'gemini-3.8-flash';

    const mockGeminiInterpretResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  description: 'Increase guests to 280 and preserve budget',
                  changes: [
                    {
                      type: 'guest_count',
                      field: 'guestCount',
                      proposedValue: 280,
                      reason: 'User requested 280 guests',
                    },
                  ],
                  preserveFields: ['budget', 'catering', 'accessibility'],
                  ambiguities: [],
                }),
              },
            ],
          },
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockGeminiInterpretResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const req = new NextRequest('http://localhost:3000/api/ai/interpret', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'Increase guest count to 280' }),
    });

    const res = await interpretRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.source).toBe('gemini-gemini-3.8-flash');
    expect(data.proposal.changes[0].proposedValue).toBe(280);
    expect(data.proposal.preserveFields).toContain('budget');
  });

  // Case 2: Invalid Gemini output triggers safe, clearly identified fallback behavior
  it('2. Invalid Gemini output triggers safe, clearly identified fallback behavior', async () => {
    process.env.GEMINI_API_KEY = 'mock-key';

    // Mock Gemini returning malformed JSON (not matching schema)
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'NOT VALID JSON' }] } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const req = new NextRequest('http://localhost:3000/api/ai/interpret', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'increase guest count to 280' }),
    });

    const res = await interpretRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.source).toBe('deterministic-fallback');
    expect(data.proposal.changes[0].proposedValue).toBe(280);
  });

  // Case 3: Missing credentials trigger deterministic fallback behavior
  it('3. Missing credentials trigger deterministic fallback behavior', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;

    const req = new NextRequest('http://localhost:3000/api/ai/interpret', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'increase guest count to 280' }),
    });

    const res = await interpretRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.source).toBe('deterministic-local');
    expect(data.proposal.changes[0].proposedValue).toBe(280);
  });

  // Case 4: Real API smoke-test status is reported separately from mock-based unit tests
  it('4. Real API smoke-test status reports failure/missing key explicitly without faking Gemini output', async () => {
    // If the environment contains an API key that is rejected by Google (HTTP 400),
    // calling the real API must NOT crash the route, must fall back cleanly, and must return deterministic-fallback.
    const req = new NextRequest('http://localhost:3000/api/ai/interpret', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'increase guest count to 250' }),
    });

    const res = await interpretRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    // In our live audit check, Google returned 400 API_KEY_INVALID, so source is deterministic-fallback
    expect(['deterministic-fallback', 'deterministic-local']).toContain(data.source);
    expect(data.proposal).toBeDefined();
  }, 10000);

  // Case 5: A strict alternative cannot be approved while it violates hard constraints
  it('5. A strict alternative cannot be approved while it violates hard constraints', () => {
    const infeasibleProposal: Scenario = {
      ...mockScenario,
      id: 'sc-infeasible-proposal',
      status: 'proposed',
      isFeasible: false,
      feasibilityNotes: ['[Violation] Budget ceiling exceeded by ₹96,000.00'],
    };

    // 1. scenario-engine approveScenario must throw
    expect(() => approveScenario(infeasibleProposal)).toThrowError(/Cannot approve an infeasible scenario/i);

    // 2. store reducer must reject approving an infeasible scenario without relaxation
    const initialState: AppState = {
      events: [mockEvent],
      scenarios: { [mockScenario.id]: mockScenario },
      version: 1,
    };

    const nextState = storeReducer(initialState, {
      type: 'APPROVE_SCENARIO',
      payload: { eventId: mockEvent.id, scenario: infeasibleProposal },
    });

    // Event currentScenarioId remains unchanged!
    expect(nextState.events[0].currentScenarioId).toBe('sc-baseline');
  });

  // Case 6: An infeasible discretionary-reduction alternative shows its remaining deficit
  it('6. An infeasible discretionary-reduction alternative shows its remaining deficit', () => {
    // Strained scenario: 280 guests -> catering becomes ₹3,36,000 (+₹96,000 overshoot)
    const strainedScenario: Scenario = {
      ...mockScenario,
      guestCount: 280,
      budgetItems: mockScenario.budgetItems.map((item) =>
        item.category === 'catering'
          ? { ...item, unitCount: 280, amountPaise: 33600000 }
          : item,
      ),
    };

    const alternatives = generateAlternatives(strainedScenario, mockEvent);
    expect(alternatives.length).toBe(3);

    const alt1 = alternatives[0];
    expect(alt1.classification).toBe('infeasible_deficit');
    expect(alt1.isFeasible).toBe(false);
    expect(alt1.remainingDeficitPaise).toBeGreaterThan(0);
    expect(alt1.name).toContain('Infeasible');
    expect(alt1.description).toContain('deficit');
  });

  // Case 7: Relaxing the budget requires explicit approval and records the modified ceiling
  it('7. Relaxing the budget requires explicit approval and records the modified ceiling', () => {
    const strainedScenario: Scenario = {
      ...mockScenario,
      guestCount: 280,
      budgetItems: mockScenario.budgetItems.map((item) =>
        item.category === 'catering'
          ? { ...item, unitCount: 280, amountPaise: 33600000 }
          : item,
      ),
    };

    const alternatives = generateAlternatives(strainedScenario, mockEvent);
    const alt2 = alternatives[1]; // Budget relaxation

    expect(alt2.classification).toBe('relax_budget_ceiling');
    expect(alt2.relaxationDetails).toBeDefined();
    expect(alt2.relaxationDetails?.type).toBe('budget_ceiling');
    expect(alt2.relaxationDetails?.originalValue).toBe(50000000);
    expect(alt2.relaxationDetails?.proposedValue).toBe(53600000);
    expect(alt2.relaxationDetails?.difference).toBe(3600000);

    // Unapproved relaxation fails standard approval
    expect(() => approveScenario(alt2)).toThrowError(/Cannot approve an infeasible scenario/i);

    // Explicit host approval succeeds
    const approvedAlt2 = approveScenario(alt2, { allowConstraintRelaxation: true });
    expect(approvedAlt2.status).toBe('approved');
    expect(approvedAlt2.isFeasible).toBe(true);

    // Reducer updates event's budgetCeilingPaise
    const initialState: AppState = {
      events: [mockEvent],
      scenarios: { [mockScenario.id]: mockScenario, [approvedAlt2.id]: approvedAlt2 },
      version: 1,
    };

    const nextState = storeReducer(initialState, {
      type: 'APPROVE_SCENARIO',
      payload: { eventId: mockEvent.id, scenario: approvedAlt2 },
    });

    expect(nextState.events[0].currentScenarioId).toBe(approvedAlt2.id);
    expect(nextState.events[0].budgetCeilingPaise).toBe(53600000);
  });

  // Case 8: Reducing the guest count requires explicit approval and records the modified count
  it('8. Reducing the guest count requires explicit approval and records the modified count', () => {
    const strainedScenario: Scenario = {
      ...mockScenario,
      guestCount: 280,
      budgetItems: mockScenario.budgetItems.map((item) =>
        item.category === 'catering'
          ? { ...item, unitCount: 280, amountPaise: 33600000 }
          : item,
      ),
    };

    const alternatives = generateAlternatives(strainedScenario, mockEvent);
    const alt3 = alternatives[2]; // Guest reduction

    expect(alt3.classification).toBe('relax_guest_count');
    expect(alt3.relaxationDetails?.type).toBe('guest_count');
    expect(alt3.relaxationDetails?.proposedValue).toBeLessThan(280);

    // Explicit approval succeeds
    const approvedAlt3 = approveScenario(alt3, { allowConstraintRelaxation: true });
    expect(approvedAlt3.status).toBe('approved');

    // Reducer updates event's guestCount
    const initialState: AppState = {
      events: [mockEvent],
      scenarios: { [mockScenario.id]: mockScenario, [approvedAlt3.id]: approvedAlt3 },
      version: 1,
    };

    const nextState = storeReducer(initialState, {
      type: 'APPROVE_SCENARIO',
      payload: { eventId: mockEvent.id, scenario: approvedAlt3 },
    });

    expect(nextState.events[0].currentScenarioId).toBe(approvedAlt3.id);
    expect(nextState.events[0].guestCount).toBe(alt3.relaxationDetails?.proposedValue);
  });

  // Case 9: The UI never labels an infeasible strict option as feasible
  it('9. The UI never labels an infeasible strict option as feasible', async () => {
    localStorage.clear();
    const { unmount } = render(
      <StoreProvider>
        <ScenariosPage />
      </StoreProvider>,
    );

    const loadBtn = screen.getByRole('button', { name: /Load Benchmark (Wedding|Birthday)/i });
    fireEvent.click(loadBtn);

    const simulateBtn = screen.getByRole('button', { name: /Simulate & Detect Impact/i });
    fireEvent.click(simulateBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Recovery Options/i })).toBeInTheDocument();
    });

    // Verify Option 1 is marked Infeasible (Deficit Remains)
    expect(screen.getByText(/Infeasible \(Deficit Remains\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Uncovered Deficit:/i)).toBeInTheDocument();

    // Verify relaxation badges
    const relaxationBadges = screen.getAllByText(/Requires Host Approval \(Relaxation\)/i);
    expect(relaxationBadges.length).toBe(2);

    unmount();
  });

  // Case 10: Rejecting a scenario preserves the approved baseline
  it('10. Rejecting a scenario preserves the approved baseline', () => {
    const initialState: AppState = {
      events: [mockEvent],
      scenarios: { [mockScenario.id]: mockScenario },
      version: 1,
    };

    const proposed: Scenario = {
      ...mockScenario,
      id: 'sc-proposed',
      status: 'proposed',
      guestCount: 280,
    };

    const rejected = rejectScenario(proposed, 'Rejected by evaluator');
    expect(rejected.status).toBe('rejected');

    const nextState = storeReducer(initialState, {
      type: 'SET_SCENARIO',
      payload: { scenario: rejected },
    });

    // Approved baseline is untouched
    expect(nextState.events[0].currentScenarioId).toBe('sc-baseline');
    expect(nextState.scenarios['sc-baseline'].guestCount).toBe(200);
  });

  // Case 11: Approving a validated scenario updates the correct records and preserves history
  it('11. Approving a validated scenario updates the correct records and preserves history', () => {
    const initialState: AppState = {
      events: [mockEvent],
      scenarios: { [mockScenario.id]: mockScenario },
      version: 1,
    };

    const validNewScenario: Scenario = {
      ...mockScenario,
      id: 'sc-v2',
      status: 'proposed',
      version: 2,
      name: 'Approved Expansion',
      guestCount: 280,
      budgetCeilingPaise: 59600000,
      isFeasible: true,
    };

    const approved = approveScenario(validNewScenario);
    const nextState = storeReducer(initialState, {
      type: 'APPROVE_SCENARIO',
      payload: { eventId: mockEvent.id, scenario: approved },
    });

    // Version incremented, history preserved, baseline preserved in scenarios
    expect(nextState.events[0].currentScenarioId).toBe('sc-v2');
    expect(nextState.events[0].scenarioHistory).toEqual(['sc-baseline', 'sc-v2']);
    expect(nextState.scenarios['sc-baseline']).toBeDefined();
    expect(nextState.scenarios['sc-v2'].status).toBe('approved');
  });
});
