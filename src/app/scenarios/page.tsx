'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { formatPaise, calculateBudgetSummary } from '@/lib/budget-engine';
import {
  parseNaturalLanguageChange,
  applyChangeProposal,
  approveScenario,
  rejectScenario,
  rollbackToScenario,
  computeScenarioDiff,
} from '@/lib/scenario-engine';
import { generateAlternatives } from '@/lib/constraint-engine';
import { Card, Button, Textarea, Badge, EmptyState } from '@/components/ui';
import type { Scenario, ChangeProposal } from '@/types/events';

export default function ScenariosPage() {
  const { state, dispatch, getCurrentScenario } = useStore();
  const [selectedEventId, setSelectedEventId] = useState<string>(
    state.events[0]?.id || '',
  );

  const activeEvent = state.events.find((e) => e.id === selectedEventId) || state.events[0];
  const activeApprovedScenario = activeEvent ? getCurrentScenario(activeEvent.id) : undefined;

  // Adaptive Engine State
  const [naturalLanguageInput, setNaturalLanguageInput] = useState(
    'Increase the wedding guest count to 280, keep the budget unchanged, preserve accessibility requirements and don\'t reduce catering quality.',
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [proposedScenario, setProposedScenario] = useState<Scenario | null>(null);
  const [alternatives, setAlternatives] = useState<Scenario[]>([]);
  const [engineSource, setEngineSource] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Quick Preset Prompts
  const PRESET_PROMPTS = [
    {
      label: 'Benchmark Scenario (280 Guests, ₹5L Budget)',
      text: 'Increase the wedding guest count to 280, keep the budget unchanged, preserve accessibility requirements and don\'t reduce catering quality.',
    },
    {
      label: 'Budget Cut (Reduce to ₹4,00,000)',
      text: 'Reduce budget to 400000 and keep guest count unchanged.',
    },
    {
      label: 'Intimate Gathering (120 Guests)',
      text: 'Reduce guest count to 120 and keep catering quality high.',
    },
  ];

  const handleSimulate = async () => {
    if (!activeEvent || !activeApprovedScenario) return;
    setIsSimulating(true);
    setActionMessage(null);

    try {
      // 1. Call AI interpretation API with fallback
      let proposal: ChangeProposal;
      try {
        const res = await fetch('/api/ai/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: naturalLanguageInput,
            currentGuestCount: activeApprovedScenario.guestCount,
            budgetCeilingPaise: activeApprovedScenario.budgetCeilingPaise,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          proposal = data.proposal;
          setEngineSource(data.source || 'deterministic-fallback');
        } else {
          proposal = parseNaturalLanguageChange(naturalLanguageInput);
          setEngineSource('deterministic-local');
        }
      } catch {
        proposal = parseNaturalLanguageChange(naturalLanguageInput);
        setEngineSource('deterministic-local');
      }

      // 2. Apply proposal through deterministic scenario engine
      const simulated = applyChangeProposal(activeApprovedScenario, proposal, activeEvent);
      simulated.id = crypto.randomUUID();
      simulated.status = 'proposed';
      simulated.name = `Proposed: ${proposal.description || 'Custom Change'}`;
      simulated.changeRequest = naturalLanguageInput;

      setProposedScenario(simulated);

      // 3. If infeasible or strained, generate alternatives
      if (!simulated.isFeasible || simulated.warnings.length > 0) {
        const alts = generateAlternatives(simulated, activeEvent, simulated.constraints);
        setAlternatives(alts);
      } else {
        setAlternatives([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Simulation failed';
      setActionMessage(`Error simulating scenario: ${msg}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApprove = (
    scenarioToApprove: Scenario,
    allowConstraintRelaxation = false,
  ) => {
    if (!activeEvent) return;

    try {
      const approved = approveScenario(scenarioToApprove, {
        allowConstraintRelaxation,
      });
      dispatch({
        type: 'APPROVE_SCENARIO',
        payload: {
          eventId: activeEvent.id,
          scenario: approved,
        },
      });

      setProposedScenario(null);
      setAlternatives([]);
      setActionMessage(
        `✓ Successfully approved Scenario v${approved.version}. All records updated atomically.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cannot approve scenario';
      setActionMessage(`Approval blocked: ${msg}`);
    }
  };

  const handleReject = () => {
    if (proposedScenario) {
      const rejected = rejectScenario(proposedScenario, 'User dismissed proposed scenario');
      dispatch({
        type: 'SET_SCENARIO',
        payload: { scenario: rejected },
      });
    }
    setProposedScenario(null);
    setAlternatives([]);
    setActionMessage('Rejected proposed scenario. Original approved plan remains completely intact.');
  };

  const handleRollback = (targetScenarioId: string) => {
    if (!activeEvent) return;
    try {
      const rolledBack = rollbackToScenario(state.scenarios, targetScenarioId);
      const approvedRollback = approveScenario(rolledBack);
      dispatch({
        type: 'APPROVE_SCENARIO',
        payload: {
          eventId: activeEvent.id,
          scenario: approvedRollback,
        },
      });
      setActionMessage(`✓ Restored to prior state (Scenario v${approvedRollback.version}).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rollback failed';
      setActionMessage(`Rollback failed: ${msg}`);
    }
  };

  if (!activeEvent || !activeApprovedScenario) {
    return (
      <EmptyState
        title="No Event Selected"
        description="Please create or load an event to use the Adaptive Event Intelligence Engine."
        action={
          <Button onClick={() => dispatch({ type: 'LOAD_SAMPLE_DATA' })} variant="primary">
            Load Benchmark Wedding
          </Button>
        }
      />
    );
  }

  const approvedSummary = calculateBudgetSummary(
    activeApprovedScenario.budgetItems,
    activeApprovedScenario.budgetCeilingPaise,
    activeApprovedScenario.guestCount,
  );

  const proposedSummary = proposedScenario
    ? calculateBudgetSummary(
        proposedScenario.budgetItems,
        proposedScenario.budgetCeilingPaise,
        proposedScenario.guestCount,
      )
    : null;

  const diffs = proposedScenario
    ? computeScenarioDiff(activeApprovedScenario, proposedScenario)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Adaptive Event Intelligence Engine
            </h1>
            <Badge variant="accent">SIGNATURE FEATURE</Badge>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Transitive dependency recalculation, hard constraint enforcement, and scenario comparison
          </p>
        </div>

        {state.events.length > 1 && (
          <select
            value={activeEvent.id}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] text-[var(--foreground)]"
          >
            {state.events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        )}
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-[var(--radius-md)] text-sm font-medium ${
            actionMessage.startsWith('✓')
              ? 'bg-[var(--success-bg)] text-[var(--success)]'
              : actionMessage.startsWith('Approval blocked') || actionMessage.startsWith('Error')
              ? 'bg-[var(--danger-bg)] text-[var(--danger)]'
              : 'bg-[var(--info-bg)] text-[var(--info)]'
          }`}
          role="status"
        >
          {actionMessage}
        </div>
      )}

      {/* Natural Language Change Simulator Input */}
      <Card padding="lg" className="border-2 border-[var(--primary)]/30 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-secondary)]/30">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="nl-input" className="text-sm font-bold text-[var(--foreground)]">
            Natural-Language Requirement Modification
          </label>
          {engineSource && (
            <span className="text-xs text-[var(--muted)]">
              Interpreter: <strong className="text-[var(--primary)]">{engineSource}</strong>
            </span>
          )}
        </div>

        <Textarea
          id="nl-input"
          label=""
          value={naturalLanguageInput}
          onChange={(e) => setNaturalLanguageInput(e.target.value)}
          placeholder="State your change requirements..."
          className="text-base font-medium"
        />

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs font-semibold text-[var(--muted)]">Presets:</span>
          {PRESET_PROMPTS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setNaturalLanguageInput(preset.text)}
              className="text-xs px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[var(--border)]">
          <Button
            onClick={handleSimulate}
            variant="primary"
            loading={isSimulating}
            className="w-full sm:w-auto font-semibold px-6"
          >
            ⚡ Simulate & Detect Impact
          </Button>
        </div>
      </Card>

      {/* Side-by-Side Comparison Screen (Active Plan vs Proposed Scenario) */}
      {proposedScenario && proposedSummary && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Scenario Comparison & Impact Analysis
            </h2>
            <div className="flex items-center gap-3">
              <Button onClick={handleReject} variant="outline" size="sm">
                ✕ Reject Proposal
              </Button>
              <Button
                onClick={() => handleApprove(proposedScenario)}
                variant="primary"
                size="sm"
                disabled={!proposedScenario.isFeasible}
                title={!proposedScenario.isFeasible ? 'Cannot approve an infeasible plan with hard constraint violations' : undefined}
              >
                ✓ Approve Proposed Scenario
              </Button>
            </div>
          </div>

          {/* Hard Constraint Feasibility Alert */}
          {!proposedScenario.isFeasible ? (
            <div className="p-4 bg-[var(--danger-bg)] border-l-4 border-l-[var(--danger)] text-[var(--danger)] rounded-[var(--radius-md)]">
              <h3 className="font-bold text-base mb-1">
                ⚠ Hard Constraints Violated — Plan Is Infeasible
              </h3>
              <p className="text-xs mb-2">
                The deterministic constraint engine detected that this proposal breaks one or more mandatory physical/financial boundaries:
              </p>
              <ul className="list-disc list-inside text-xs space-y-1">
                {proposedScenario.feasibilityNotes
                  .filter((n) => n.startsWith('[Violation]'))
                  .map((v, i) => (
                    <li key={i} className="font-semibold">{v}</li>
                  ))}
              </ul>
              <p className="text-xs mt-3 italic">
                Notice: Hard constraints are NEVER silently bypassed. Review the ranked feasible alternatives below.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-[var(--success-bg)] border-l-4 border-l-[var(--success)] text-[var(--success)] rounded-[var(--radius-md)]">
              <h3 className="font-bold text-base mb-1">
                ✓ All Hard Constraints Satisfied
              </h3>
              <p className="text-xs">
                Budget ceiling, venue capacity, and mandatory accessibility criteria are all fully respected.
              </p>
            </div>
          )}

          {/* Side by Side Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Approved Baseline */}
            <Card padding="lg" className="border-t-4 border-t-[var(--muted)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge variant="default">CURRENT APPROVED PLAN</Badge>
                  <h3 className="text-lg font-bold text-[var(--foreground)] mt-1">
                    Scenario v{activeApprovedScenario.version}
                  </h3>
                </div>
                <span className="text-xs text-[var(--muted)]">
                  Approved {activeApprovedScenario.approvedAt?.slice(0, 10)}
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--muted)]">Guest Count:</span>
                  <strong className="text-base">{activeApprovedScenario.guestCount} guests</strong>
                </div>

                <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--muted)]">Budget Ceiling:</span>
                  <strong className="text-base">{formatPaise(activeApprovedScenario.budgetCeilingPaise)}</strong>
                </div>

                <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--muted)]">Projected Total:</span>
                  <strong className="text-base">{formatPaise(approvedSummary.projectedTotalPaise)}</strong>
                </div>

                <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--muted)]">Remaining Buffer:</span>
                  <span className="font-semibold text-[var(--success)]">{formatPaise(approvedSummary.remainingPaise)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--muted)]">Per-Guest Cost:</span>
                  <span>{formatPaise(approvedSummary.perPersonPaise)}</span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[var(--muted)] mb-2 uppercase">Key Constraints</p>
                  <div className="space-y-1">
                    {activeApprovedScenario.constraints.map((c) => (
                      <div key={c.id} className="flex justify-between text-xs py-1">
                        <span>{c.name}</span>
                        <span className={c.isSatisfied ? 'text-[var(--success)] font-semibold' : 'text-[var(--danger)] font-semibold'}>
                          {c.isSatisfied ? '✓ Pass' : '⚠ Violation'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Right: Proposed Scenario */}
            <Card
              padding="lg"
              className={`border-t-4 ${
                proposedScenario.isFeasible ? 'border-t-[var(--success)]' : 'border-t-[var(--danger)]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge variant={proposedScenario.isFeasible ? 'success' : 'danger'}>
                    PROPOSED SCENARIO
                  </Badge>
                  <h3 className="text-lg font-bold text-[var(--foreground)] mt-1">
                    {proposedScenario.name}
                  </h3>
                </div>
                <Badge variant={proposedScenario.isFeasible ? 'success' : 'danger'}>
                  {proposedScenario.isFeasible ? 'Feasible' : 'Blocked'}
                </Badge>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--muted)]">Guest Count:</span>
                  <div>
                    <strong className="text-base">{proposedScenario.guestCount} guests</strong>
                    <span className="text-xs ml-2 font-semibold text-[var(--accent)]">
                      ({proposedScenario.guestCount - activeApprovedScenario.guestCount > 0 ? '+' : ''}
                      {proposedScenario.guestCount - activeApprovedScenario.guestCount})
                    </span>
                  </div>
                </div>

                <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--muted)]">Budget Ceiling:</span>
                  <strong>{formatPaise(proposedScenario.budgetCeilingPaise)}</strong>
                </div>

                <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--muted)]">Projected Total:</span>
                  <div>
                    <strong className={`text-base ${proposedSummary.isOverBudget ? 'text-[var(--danger)]' : 'text-[var(--foreground)]'}`}>
                      {formatPaise(proposedSummary.projectedTotalPaise)}
                    </strong>
                    <span className="text-xs ml-2 font-semibold text-[var(--danger)]">
                      (+{formatPaise(Math.max(0, proposedSummary.projectedTotalPaise - approvedSummary.projectedTotalPaise))})
                    </span>
                  </div>
                </div>

                <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--muted)]">Remaining Buffer:</span>
                  <span className={`font-semibold ${proposedSummary.remainingPaise >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {formatPaise(proposedSummary.remainingPaise)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--muted)]">Per-Guest Cost:</span>
                  <span>{formatPaise(proposedSummary.perPersonPaise)}</span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[var(--muted)] mb-2 uppercase">Evaluated Constraints</p>
                  <div className="space-y-1">
                    {proposedScenario.constraints.map((c) => (
                      <div key={c.id} className="flex justify-between text-xs py-1">
                        <span>{c.name}</span>
                        <span className={c.isSatisfied ? 'text-[var(--success)] font-semibold' : 'text-[var(--danger)] font-semibold'}>
                          {c.isSatisfied ? '✓ Pass' : `⚠ ${c.violationMessage || 'Violated'}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Diffs Table */}
          {diffs.length > 0 && (
            <Card padding="md">
              <h3 className="text-base font-bold text-[var(--foreground)] mb-3">
                Detected Direct & Transitive Changes ({diffs.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--surface-secondary)] text-xs font-semibold text-[var(--muted)]">
                    <tr>
                      <th className="py-2.5 px-3">Field / Record</th>
                      <th className="py-2.5 px-3">Original Approved</th>
                      <th className="py-2.5 px-3">Proposed Value</th>
                      <th className="py-2.5 px-3 text-right">Calculated Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {diffs.map((d, i) => (
                      <tr key={i} className="hover:bg-[var(--surface-secondary)]/30">
                        <td className="py-2.5 px-3 font-semibold text-[var(--foreground)]">{d.label}</td>
                        <td className="py-2.5 px-3 text-xs text-[var(--muted)]">
                          {typeof d.originalValue === 'number' && d.originalValue > 10000
                            ? formatPaise(d.originalValue)
                            : String(d.originalValue)}
                        </td>
                        <td className="py-2.5 px-3 text-xs font-medium text-[var(--foreground)]">
                          {typeof d.proposedValue === 'number' && d.proposedValue > 10000
                            ? formatPaise(d.proposedValue)
                            : String(d.proposedValue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-xs text-[var(--primary)]">
                          {d.impact}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Recovery Options Section */}
          {alternatives.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">
                  Recovery Options
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Since the direct proposal exceeds the budget ceiling or violates constraints, the deterministic engine synthesized these evaluated recovery options:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {alternatives.map((alt, idx) => {
                  const altSummary = calculateBudgetSummary(
                    alt.budgetItems,
                    alt.budgetCeilingPaise,
                    alt.guestCount,
                  );

                  const isStrictFeasible = alt.classification === 'strict_feasible' || (alt.isFeasible && !alt.classification?.startsWith('relax_'));
                  const isInfeasibleDeficit = alt.classification === 'infeasible_deficit' || (!alt.isFeasible && !alt.relaxationDetails);
                  const isRelaxation = alt.classification?.startsWith('relax_');

                  return (
                    <Card key={alt.id} padding="md" className="flex flex-col justify-between border-2 border-[var(--accent)]/40">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="accent">OPTION {idx + 1}</Badge>
                          {isStrictFeasible && (
                            <Badge variant="success">✓ Feasible (Preserves Constraints)</Badge>
                          )}
                          {isInfeasibleDeficit && (
                            <Badge variant="danger">⚠ Infeasible (Deficit Remains)</Badge>
                          )}
                          {isRelaxation && (
                            <Badge variant="warning">⚡ Requires Host Approval (Relaxation)</Badge>
                          )}
                        </div>

                        <h4 className="font-bold text-base text-[var(--foreground)]">{alt.name}</h4>
                        <p className="text-xs text-[var(--muted)] mt-1">{alt.description}</p>

                        {/* Explicit Constraint Relaxation Disclosure */}
                        {alt.relaxationDetails && (
                          <div className="my-3 p-2.5 bg-[var(--surface-secondary)] border border-[var(--accent)]/40 rounded-[var(--radius-sm)] text-xs">
                            <p className="font-bold text-[var(--accent)] mb-1">
                              Constraint Modification Disclosure:
                            </p>
                            {alt.relaxationDetails.type === 'budget_ceiling' ? (
                              <div className="space-y-0.5">
                                <div className="flex justify-between">
                                  <span className="text-[var(--muted)]">Original Ceiling:</span>
                                  <span>{formatPaise(alt.relaxationDetails.originalValue)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[var(--muted)]">Proposed Ceiling:</span>
                                  <span className="font-semibold">{formatPaise(alt.relaxationDetails.proposedValue)}</span>
                                </div>
                                <div className="flex justify-between border-t border-[var(--border)] pt-1 mt-1">
                                  <span className="font-medium">Exact Budget Increase:</span>
                                  <strong className="text-[var(--danger)]">+{formatPaise(alt.relaxationDetails.difference)}</strong>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <div className="flex justify-between">
                                  <span className="text-[var(--muted)]">Original Guest Target:</span>
                                  <span>{alt.relaxationDetails.originalValue} guests</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[var(--muted)]">Proposed Guest Target:</span>
                                  <span className="font-semibold">{alt.relaxationDetails.proposedValue} guests</span>
                                </div>
                                <div className="flex justify-between border-t border-[var(--border)] pt-1 mt-1">
                                  <span className="font-medium">Exact Guest Reduction:</span>
                                  <strong className="text-[var(--danger)]">-{alt.relaxationDetails.difference} guests</strong>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Infeasible Deficit Disclosure */}
                        {isInfeasibleDeficit && alt.remainingDeficitPaise && alt.remainingDeficitPaise > 0 && (
                          <div className="my-3 p-2.5 bg-[var(--danger-bg)]/30 border border-[var(--danger)]/30 rounded-[var(--radius-sm)] text-xs">
                            <p className="font-bold text-[var(--danger)]">
                              Uncovered Deficit: {formatPaise(alt.remainingDeficitPaise)}
                            </p>
                            <p className="text-[var(--muted)] mt-0.5">
                              Discretionary cuts cannot close this gap without cutting protected priority categories.
                            </p>
                          </div>
                        )}

                        <div className="my-3 p-3 bg-[var(--surface-secondary)] rounded-[var(--radius-md)] text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[var(--muted)]">Guests:</span>
                            <strong className="text-[var(--foreground)]">{alt.guestCount}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--muted)]">Budget Ceiling:</span>
                            <strong className="text-[var(--foreground)]">{formatPaise(alt.budgetCeilingPaise)}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--muted)]">Projected:</span>
                            <strong className={altSummary.isOverBudget ? 'text-[var(--danger)]' : 'text-[var(--success)]'}>
                              {formatPaise(altSummary.projectedTotalPaise)}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--muted)]">Remaining Buffer:</span>
                            <span>{formatPaise(altSummary.remainingPaise)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[var(--border)]">
                        {isInfeasibleDeficit ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full opacity-60 cursor-not-allowed"
                            disabled={true}
                            title="Cannot approve an infeasible option that violates hard constraints"
                          >
                            Cannot Approve (Infeasible)
                          </Button>
                        ) : isRelaxation ? (
                          <Button
                            onClick={() => handleApprove(alt, true)}
                            variant="secondary"
                            size="sm"
                            className="w-full"
                          >
                            Approve Option {idx + 1} (Confirm Relaxation)
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleApprove(alt, false)}
                            variant="primary"
                            size="sm"
                            className="w-full"
                          >
                            Approve Option {idx + 1}
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scenario Version History & Rollback */}
      <Card padding="lg">
        <h3 className="text-base font-bold text-[var(--foreground)] mb-2">
          Scenario Version History & Transactional Rollback
        </h3>
        <p className="text-xs text-[var(--muted)] mb-4">
          Every approved change proposal is saved as an immutable scenario snapshot. Roll back to any prior version at any time without data corruption.
        </p>

        <div className="space-y-3">
          {activeEvent.scenarioHistory.map((scenId) => {
            const sc = state.scenarios[scenId];
            if (!sc) return null;
            const isCurrent = sc.id === activeEvent.currentScenarioId;

            return (
              <div
                key={sc.id}
                className={`p-3 rounded-[var(--radius-md)] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCurrent
                    ? 'border-[var(--primary)] bg-[var(--primary-light)]/20'
                    : 'border-[var(--border)] bg-[var(--surface)]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--foreground)]">
                      Version {sc.version}: {sc.name}
                    </span>
                    {isCurrent && <Badge variant="accent">CURRENT APPROVED</Badge>}
                    <Badge variant={sc.isFeasible ? 'success' : 'danger'}>
                      {sc.isFeasible ? 'Feasible' : 'Infeasible'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {sc.guestCount} guests • Ceiling: {formatPaise(sc.budgetCeilingPaise)} • Created {sc.createdAt.slice(0, 10)}
                  </p>
                </div>

                {!isCurrent && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRollback(sc.id)}
                  >
                    Restore This Version
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
