import { describe, it, expect } from 'vitest';
import {
  buildDefaultConstraints,
  evaluateConstraints,
  checkFeasibility,
  buildDependencyGraph,
  detectCycles,
  getAffectedTasks,
  propagateChanges,
} from '@/lib/constraint-engine';
import type { EventDetails, Scenario, Task } from '@/types/events';

describe('Constraint Engine & Dependency Graph', () => {
  const mockEvent: EventDetails = {
    id: 'ev-1',
    name: "Vikram & Ananya's Wedding",
    type: 'wedding',
    status: 'planning',
    description: 'Test Event',
    date: '2026-11-20',
    location: 'Chennai',
    venueCapacity: 250,
    guestCount: 200,
    budgetCeilingPaise: 50000000,
    currency: 'INR',
    preferences: {
      dietaryRequirements: ['Vegetarian'],
      priorityAreas: ['catering'],
    },
    accessibilityRequirements: ['Wheelchair access'],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    currentScenarioId: 'sc-1',
    scenarioHistory: ['sc-1'],
  };

  const mockScenario: Scenario = {
    id: 'sc-1',
    eventId: 'ev-1',
    status: 'approved',
    name: 'Base Scenario',
    guestCount: 200,
    budgetCeilingPaise: 50000000,
    budgetItems: [
      {
        id: 'bi-1',
        category: 'catering',
        name: 'Feast',
        amountPaise: 24000000,
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
        id: 'bi-2',
        category: 'venue',
        name: 'Hall',
        amountPaise: 8000000,
        costType: 'fixed',
        status: 'committed',
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

  it('builds default hard constraints and preferences correctly', () => {
    const constraints = buildDefaultConstraints(mockEvent, mockScenario);
    const hard = constraints.filter((c) => c.type === 'hard');
    const prefs = constraints.filter((c) => c.type === 'preference');

    expect(hard.length).toBeGreaterThanOrEqual(3); // budget, venue capacity, date validity
    expect(prefs.length).toBeGreaterThanOrEqual(1);
  });

  it('evaluates venue capacity constraint and fails if guest count exceeds venue capacity', () => {
    const constraints = buildDefaultConstraints(mockEvent, mockScenario);
    // Baseline passes: 200 <= 250
    const evalPass = evaluateConstraints(constraints, mockScenario, mockEvent);
    const capacityPass = evalPass.find((c) => c.field === 'venueCapacity')!;
    expect(capacityPass.isSatisfied).toBe(true);

    // Over capacity: 280 > 250
    const overCapacityScenario: Scenario = {
      ...mockScenario,
      guestCount: 280,
    };
    const evalFail = evaluateConstraints(constraints, overCapacityScenario, mockEvent);
    const capacityFail = evalFail.find((c) => c.field === 'venueCapacity')!;
    expect(capacityFail.isSatisfied).toBe(false);

    const feasibility = checkFeasibility(evalFail);
    expect(feasibility.feasible).toBe(false);
    expect(feasibility.hardViolations.length).toBeGreaterThan(0);
  });

  it('evaluates budget ceiling constraint and marks plan infeasible if ceiling is breached', () => {
    const constraints = buildDefaultConstraints(mockEvent, mockScenario);
    const overBudgetScenario: Scenario = {
      ...mockScenario,
      budgetItems: [
        {
          id: 'bi-huge',
          category: 'venue',
          name: 'Palace',
          amountPaise: 60000000, // ₹6L > ₹5L ceiling
          costType: 'fixed',
          status: 'quoted',
          depositPaise: 0,
          isGenerated: false,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
      ],
    };

    const evaluated = evaluateConstraints(constraints, overBudgetScenario, mockEvent);
    const budgetConstraint = evaluated.find((c) => c.field === 'budgetCeilingPaise')!;
    expect(budgetConstraint.isSatisfied).toBe(false);

    const feasibility = checkFeasibility(evaluated);
    expect(feasibility.feasible).toBe(false);
  });

  it('builds dependency graph and detects circular dependencies', () => {
    // A -> B -> C -> A
    const circularTasks: Task[] = [
      {
        id: 't-A',
        title: 'Task A',
        dueDate: '2025-05-01',
        priority: 'high',
        status: 'pending',
        dependencies: ['t-C'],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      {
        id: 't-B',
        title: 'Task B',
        dueDate: '2025-05-02',
        priority: 'high',
        status: 'pending',
        dependencies: ['t-A'],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      {
        id: 't-C',
        title: 'Task C',
        dueDate: '2025-05-03',
        priority: 'high',
        status: 'pending',
        dependencies: ['t-B'],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    ];

    const graph = buildDependencyGraph(circularTasks);
    const cycles = detectCycles(graph);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('determines transitively affected tasks when an upstream task changes', () => {
    // 1 -> 2 -> 3
    const tasks: Task[] = [
      {
        id: 't-1',
        title: 'Book Venue',
        dueDate: '2025-02-01',
        priority: 'critical',
        status: 'pending',
        dependencies: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      {
        id: 't-2',
        title: 'Decorate Venue',
        dueDate: '2025-02-15',
        priority: 'high',
        status: 'pending',
        dependencies: ['t-1'],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      {
        id: 't-3',
        title: 'Final Lighting Test',
        dueDate: '2025-02-20',
        priority: 'medium',
        status: 'pending',
        dependencies: ['t-2'],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    ];

    const graph = buildDependencyGraph(tasks);
    const affected = getAffectedTasks('t-1', graph);
    expect(affected).toContain('t-2');
    expect(affected).toContain('t-3');
  });

  it('propagates changes to per-person items when guestCount changes', () => {
    const result = propagateChanges(mockScenario, [
      { field: 'guestCount', value: 250 },
    ]);
    expect(result.affectedBudgetItemIds).toContain('bi-1'); // catering is per_person
  });
});
