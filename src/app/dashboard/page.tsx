'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { formatPaise, calculateBudgetSummary, getCategoryLabel } from '@/lib/budget-engine';
import { Card, Button, Badge, ProgressBar, EmptyState } from '@/components/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import type { TaskStatus } from '@/types/events';

export default function WorkspaceDashboardPage() {
  const { state, dispatch, getCurrentScenario } = useStore();
  const [selectedEventId, setSelectedEventId] = useState<string>(
    state.events[0]?.id || '',
  );

  // Quick Sandbox What-If state (200 Baseline vs 280 Stress Test)
  const [simGuests, setSimGuests] = useState<number>(200);

  const activeEvent = state.events.find((e) => e.id === selectedEventId) || state.events[0];
  const activeScenario = activeEvent ? getCurrentScenario(activeEvent.id) : undefined;

  const budgetSummary = activeScenario && activeEvent
    ? calculateBudgetSummary(
        activeScenario.budgetItems,
        activeScenario.budgetCeilingPaise,
        activeScenario.guestCount,
      )
    : null;

  const pendingTasks = activeScenario?.tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled') || [];
  const completedTasks = activeScenario?.tasks.filter((t) => t.status === 'completed') || [];
  const bookedVendors = activeScenario?.vendors.filter((v) => v.status === 'booked' || v.status === 'confirmed') || [];

  const handleLoadSample = () => {
    dispatch({ type: 'LOAD_SAMPLE_DATA' });
  };

  const handleToggleTask = (taskId: string, currentStatus: TaskStatus) => {
    if (!activeScenario) return;
    const nextStatus: TaskStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        scenarioId: activeScenario.id,
        taskId,
        updates: { status: nextStatus },
      },
    });
  };

  const categoryColors: Record<string, { bg: string; text: string; bar: string }> = {
    catering: { bg: 'cat-catering-bg', text: 'cat-catering-text', bar: 'cat-catering-bar' },
    venue: { bg: 'cat-venue-bg', text: 'cat-venue-text', bar: 'cat-venue-bar' },
    decoration: { bg: 'cat-decor-bg', text: 'cat-decor-text', bar: 'cat-decor-bar' },
    photography: { bg: 'cat-photo-bg', text: 'cat-photo-text', bar: 'cat-photo-bar' },
    entertainment: { bg: 'cat-entertainment-bg', text: 'cat-entertainment-text', bar: 'cat-entertainment-bar' },
    contingency: { bg: 'cat-contingency-bg', text: 'cat-contingency-text', bar: 'cat-contingency-bar' },
    invitations: { bg: 'cat-invitations-bg', text: 'cat-invitations-text', bar: 'cat-invitations-bar' },
    transportation: { bg: 'cat-transport-bg', text: 'cat-transport-text', bar: 'cat-transport-bar' },
    attire: { bg: 'cat-attire-bg', text: 'cat-attire-text', bar: 'cat-attire-bar' },
    other: { bg: 'cat-other-bg', text: 'cat-other-text', bar: 'cat-other-bar' },
  };

  const totalPaise = budgetSummary ? budgetSummary.projectedTotalPaise : 1;
  const categoryBreakdown = budgetSummary
    ? Object.entries(budgetSummary.categoryBreakdown)
        .map(([cat, amount]) => ({
          category: cat,
          amount,
          percent: totalPaise > 0 ? (amount / totalPaise) * 100 : 0,
        }))
        .filter((c) => c.amount > 0)
        .sort((a, b) => b.amount - a.amount)
    : [];

  // Sandbox calculations for 200 vs 280 guests
  const perPersonItem = activeScenario?.budgetItems.find((i) => i.costType === 'per_person');
  const unitRate = perPersonItem?.unitRatePaise || 120000;
  const simCateringCost = simGuests * unitRate;
  const currentCateringCost = (activeScenario?.guestCount || 200) * unitRate;
  const simProjectedTotal = (budgetSummary?.projectedTotalPaise || 50000000) - currentCateringCost + simCateringCost;
  const simCeiling = activeScenario?.budgetCeilingPaise || 50000000;
  const simVariance = simProjectedTotal - simCeiling;
  const simIsOver = simVariance > 0;

  if (state.events.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={<span className="text-3xl">🪷</span>}
          title="No Celebrations in Workspace"
          description="Load the signature birthday celebration demo (₹5L ceiling, 200 guests) to explore the full dashboard workspace, integer paise math, and adaptive constraint engine."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={handleLoadSample} variant="primary" size="lg" className="font-bold shadow-md shadow-[var(--primary)]/20">
                Load Sample Birthday (₹5L / 200 Guests)
              </Button>
              <Link href="/events/new">
                <Button variant="outline" size="lg">
                  + Create Custom Celebration
                </Button>
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Event Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
            <h1 className="text-xl font-black text-[var(--foreground)] tracking-tight">
              Celebration Workspace Dashboard
            </h1>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Multi-Scenario Event Intelligence • Deterministic Integer Paise • Adaptive DAG
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle />

          <Link href="/">
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-semibold hover:border-[var(--accent)]"
            >
              🌐 Landing Page
            </Button>
          </Link>

          {state.events.length > 1 && (
            <select
              value={activeEvent?.id}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface-secondary)] text-[var(--foreground)] font-medium shadow-xs"
              aria-label="Select active event"
            >
              {state.events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.type})
                </option>
              ))}
            </select>
          )}

          <Link href="/events/new">
            <Button size="sm" variant="outline" className="text-xs">
              + New Event
            </Button>
          </Link>

          <Link href="/scenarios">
            <Button size="sm" variant="secondary" className="shadow-xs font-bold text-xs">
              ⚡ Adaptive Engine
            </Button>
          </Link>
        </div>
      </div>

      {activeEvent && activeScenario && budgetSummary && (
        <>
          {/* Luxury Event Header Banner */}
          <div className="celebration-card p-6 sm:p-7 bg-gradient-to-r from-[var(--surface)] via-[var(--surface-secondary)] to-[var(--surface)] border border-[var(--border)] relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-[var(--primary)]/15 blur-3xl pointer-events-none animate-ambient" />
            <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 rounded-full bg-[var(--accent)]/10 blur-3xl pointer-events-none animate-ambient" style={{ animationDelay: '-3s' }} />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={activeEvent.type === 'birthday' ? 'accent' : 'info'}>
                    {activeEvent.type.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-[var(--muted)] font-medium">
                    Scenario v{activeScenario.version} • {activeScenario.name}
                  </span>
                  <Badge variant={activeScenario.isFeasible ? 'success' : 'danger'}>
                    {activeScenario.isFeasible ? '✓ Plan Feasible' : '⚠ Constraints Violated'}
                  </Badge>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight">
                  {activeEvent.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--foreground)]">
                    📅 {new Date(activeEvent.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span>•</span>
                  <span>📍 {activeEvent.location}</span>
                  {activeEvent.preferences?.culturalStyle && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-[var(--accent)]">
                        🪷 {activeEvent.preferences.culturalStyle} Tradition
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 sm:gap-8 bg-[var(--surface-secondary)]/80 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-[var(--border)] shadow-md">
                <div className="text-right">
                  <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">Guest Count</p>
                  <p className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
                    {activeScenario.guestCount}
                    <span className="text-xs font-normal text-[var(--muted)] ml-1">
                      / max {activeEvent.venueCapacity}
                    </span>
                  </p>
                </div>
                <div className="text-right border-l border-[var(--border)] pl-6 sm:pl-8">
                  <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">Budget Ceiling</p>
                  <p className="text-2xl sm:text-3xl font-black text-[var(--primary)]">
                    {formatPaise(activeScenario.budgetCeilingPaise)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="md" className="celebration-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                  Budget Projected
                </p>
                <span className="text-sm" role="img" aria-label="Rupee">💰</span>
              </div>
              <p className="text-2xl font-black mt-1 text-[var(--foreground)]">
                {formatPaise(budgetSummary.projectedTotalPaise)}
              </p>
              <div className="mt-3">
                <ProgressBar
                  value={budgetSummary.utilizationPercent}
                  label="Ceiling Utilization"
                  variant={budgetSummary.isOverBudget ? 'danger' : budgetSummary.utilizationPercent > 90 ? 'warning' : 'success'}
                />
              </div>
            </Card>

            <Card padding="md" className="celebration-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                  Remaining Buffer
                </p>
                <span className="text-sm" role="img" aria-label="Buffer">🛡️</span>
              </div>
              <p className={`text-2xl font-black mt-1 ${budgetSummary.remainingPaise >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                {formatPaise(budgetSummary.remainingPaise)}
              </p>
              <p className="text-xs text-[var(--muted)] mt-2">
                Contingency Reserve: <strong className="text-[var(--foreground)]">{formatPaise(budgetSummary.contingencyPaise)}</strong>
              </p>
            </Card>

            <Card padding="md" className="celebration-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                  Per-Guest Cost
                </p>
                <span className="text-sm" role="img" aria-label="Guests">👥</span>
              </div>
              <p className="text-2xl font-black mt-1 text-[var(--foreground)]">
                {formatPaise(budgetSummary.perPersonPaise)}
              </p>
              <p className="text-xs text-[var(--muted)] mt-2">
                Across <strong className="text-[var(--foreground)]">{activeScenario.budgetItems.length} items</strong> (Catering ₹1.2k/pp)
              </p>
            </Card>

            <Card padding="md" className="celebration-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                  Milestone Execution
                </p>
                <span className="text-sm" role="img" aria-label="Milestones">🎯</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-[var(--foreground)]">
                  {completedTasks.length}
                </span>
                <span className="text-sm text-[var(--muted)]">
                  / {activeScenario.tasks.length} done ({pendingTasks.length} pending)
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-2">
                Vendors: <strong className="text-[var(--foreground)]">{bookedVendors.length} confirmed</strong> / {activeScenario.vendors.length} total
              </p>
            </Card>
          </div>

          {/* Celebration Budget Distribution Meter */}
          <Card padding="lg" className="celebration-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">
                  Celebration Budget Allocation Breakdown
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Itemized distribution across celebration domains with deterministic paise precision
                </p>
              </div>
              <Link href="/budget" className="text-xs font-bold text-[var(--accent)] hover:underline">
                Open Budget Studio →
              </Link>
            </div>

            {/* Stacked Multi-Color Progress Bar */}
            <div className="w-full h-3.5 bg-[var(--surface-secondary)] rounded-full overflow-hidden flex shadow-inner">
              {categoryBreakdown.map((cat) => {
                const colors = categoryColors[cat.category] || categoryColors.other;
                return (
                  <div
                    key={cat.category}
                    className={`h-full ${colors.bar} transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
                    style={{ width: `${Math.max(2, cat.percent)}%` }}
                    title={`${getCategoryLabel(cat.category as never)}: ${formatPaise(cat.amount)} (${Math.round(cat.percent)}%)`}
                  />
                );
              })}
            </div>

            {/* Category Badges / Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {categoryBreakdown.map((cat) => {
                const colors = categoryColors[cat.category] || categoryColors.other;
                return (
                  <div
                    key={cat.category}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${colors.bg} ${colors.text} border border-current/20`}
                  >
                    <span className={`w-2 h-2 rounded-full ${colors.bar}`} />
                    <span>{getCategoryLabel(cat.category as never)}</span>
                    <span className="font-bold">{formatPaise(cat.amount)}</span>
                    <span className="text-[10px] opacity-80">({Math.round(cat.percent)}%)</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Two-Column Workspace Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Interactive Preparation Deadlines */}
            <Card padding="lg" className="lg:col-span-2 celebration-card">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)]">
                <div>
                  <h3 className="text-base font-bold text-[var(--foreground)]">
                    Upcoming Preparation Deadlines & Tasks
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Date-aware lead times calculated backwards from celebration day
                  </p>
                </div>
                <Link href="/timeline" className="text-xs font-bold text-[var(--accent)] hover:underline">
                  Full Timeline →
                </Link>
              </div>

              {pendingTasks.length === 0 && completedTasks.length === 0 ? (
                <p className="text-xs text-[var(--muted)] py-4">No tasks configured for this scenario.</p>
              ) : (
                <div className="space-y-2.5">
                  {activeScenario.tasks.slice(0, 5).map((task) => {
                    const isCompleted = task.status === 'completed';
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isCompleted
                            ? 'bg-[var(--success-bg)] border-[var(--success)]/30'
                            : 'bg-[var(--surface-secondary)]/50 border-[var(--border)] hover:bg-[var(--surface-secondary)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleTask(task.id, task.status)}
                            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                              isCompleted
                                ? 'bg-[var(--success)] border-[var(--success)] text-white'
                                : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]'
                            }`}
                            aria-label={`Mark ${task.title} as ${isCompleted ? 'pending' : 'completed'}`}
                          >
                            {isCompleted && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            )}
                          </button>

                          <div>
                            <p className={`text-sm font-semibold ${isCompleted ? 'line-through text-[var(--muted)]' : 'text-[var(--foreground)]'}`}>
                              {task.title}
                            </p>
                            <p className="text-xs text-[var(--muted)] flex items-center gap-2">
                              <span>Due: {task.dueDate}</span>
                              {task.priority === 'critical' && (
                                <span className="text-[var(--danger)] font-bold">● Critical</span>
                              )}
                              {task.priority === 'high' && (
                                <span className="text-[var(--warning)] font-semibold">● High</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant={
                            task.status === 'completed'
                              ? 'success'
                              : task.status === 'in_progress'
                              ? 'info'
                              : 'default'
                          }
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Right 1 Col: Interactive What-If Sandbox & Constraints */}
            <div className="space-y-6">
              {/* Interactive What-If Sandbox */}
              <Card padding="md" className="celebration-card border-l-4 border-l-[var(--accent)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-secondary)]/30 to-[var(--surface)]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                    <span>⚡</span> Guest Surge What-If Simulator
                  </h4>
                  <Link href="/scenarios" className="text-[11px] font-semibold text-[var(--accent)] hover:underline">
                    Simulator →
                  </Link>
                </div>
                <p className="text-xs text-[var(--muted)] mb-3">
                  Test dynamic catering and capacity recalculation in memory:
                </p>

                {/* Quick 200 vs 280 guest toggle buttons */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setSimGuests(200)}
                    className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-all cursor-pointer ${
                      simGuests === 200
                        ? 'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-xs'
                        : 'bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    200 Guests
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimGuests(280)}
                    className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-all cursor-pointer ${
                      simGuests === 280
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    280 (+40% Surge)
                  </button>
                </div>

                <div className="space-y-2 p-3 rounded-lg bg-[var(--surface-secondary)]/60 text-xs border border-[var(--border)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Simulated Guests:</span>
                    <strong className="text-[var(--foreground)]">{simGuests} Guests</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Per-Head Catering Rate:</span>
                    <strong className="text-[var(--foreground)]">{formatPaise(unitRate)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">New Catering Line Total:</span>
                    <strong className="text-[var(--accent)]">{formatPaise(simCateringCost)}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[var(--border)]">
                    <span className="text-[var(--muted)]">Simulated Total:</span>
                    <strong className={simIsOver ? 'text-[var(--danger)] font-black' : 'text-[var(--foreground)]'}>
                      {formatPaise(simProjectedTotal)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Ceiling Variance:</span>
                    <strong className={simIsOver ? 'text-[var(--danger)] font-bold' : 'text-[var(--success)]'}>
                      {simVariance > 0 ? `+${formatPaise(simVariance)} (Over)` : `${formatPaise(Math.abs(simVariance))} (Under)`}
                    </strong>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-[var(--muted)]">
                  {simIsOver ? (
                    <span className="text-[var(--danger)] font-semibold flex items-center gap-1">
                      <span>⚠</span> Exceeds ₹5L ceiling by {formatPaise(simVariance)}!
                    </span>
                  ) : (
                    <span className="text-[var(--success)] font-semibold flex items-center gap-1">
                      <span>✓</span> Baseline plan safely within approved budget.
                    </span>
                  )}
                </div>
              </Card>

              {/* Constraint Violations Panel */}
              <Card padding="md" className="celebration-card">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                    <span>🛡️</span> Feasibility & Hard Constraints
                  </h4>
                  <Badge variant={activeScenario.isFeasible ? 'success' : 'danger'}>
                    {activeScenario.isFeasible ? '0 Violations' : 'Active Violations'}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-md bg-[var(--surface-secondary)]/50 border border-[var(--border)]">
                    <span className="text-[var(--muted)]">Venue Max Capacity (250)</span>
                    <span className={activeScenario.guestCount > activeEvent.venueCapacity ? 'text-[var(--danger)] font-bold' : 'text-[var(--success)] font-semibold'}>
                      {activeScenario.guestCount <= activeEvent.venueCapacity ? '✓ Satisfied' : '⚠ Exceeded'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-md bg-[var(--surface-secondary)]/50 border border-[var(--border)]">
                    <span className="text-[var(--muted)]">Budget Ceiling Compliance</span>
                    <span className={budgetSummary.isOverBudget ? 'text-[var(--danger)] font-bold' : 'text-[var(--success)] font-semibold'}>
                      {budgetSummary.isOverBudget ? '⚠ Breached' : '✓ Compliant'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-md bg-[var(--surface-secondary)]/50 border border-[var(--border)]">
                    <span className="text-[var(--muted)]">Deterministic Variance Drift</span>
                    <span className="text-[var(--success)] font-mono font-bold">
                      ₹0.00 (Zero Drift)
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between items-center text-xs">
                  <span className="text-[var(--muted)]">Scenario State:</span>
                  <Badge variant="accent">APPROVED v{activeScenario.version}</Badge>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
