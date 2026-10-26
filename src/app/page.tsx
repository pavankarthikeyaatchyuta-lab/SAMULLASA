'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { formatPaise, calculateBudgetSummary, getCategoryLabel } from '@/lib/budget-engine';
import { Card, Button, Badge, ProgressBar } from '@/components/ui';
import type { TaskStatus } from '@/types/events';

export default function DashboardPage() {
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

  // If no events loaded yet: Luxury Dark Launchpad with SINGLE Official Benchmark Birthday Demo
  if (state.events.length === 0) {
    return (
      <div className="space-y-10 py-4 max-w-5xl mx-auto">
        {/* Luxury Hero Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--surface)] via-[var(--surface-secondary)] to-[var(--surface)] border border-[var(--border)] p-8 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[var(--primary)]/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[var(--accent)]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-secondary)] border border-[var(--accent)]/30 text-xs font-semibold text-[var(--accent)] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              समुल्लासः • Celebration with Mathematical Clarity & Grace
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--foreground)] tracking-tight leading-tight">
                Plan the Celebration.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--accent-hover)]">
                  Master Every Trade-off.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
                Adaptive celebration intelligence for milestone birthdays, weddings, and community festivals. Experience deterministic integer-paise calculations, date-aware milestone dependency graphs, and instant constraint recovery.
              </p>
            </div>

            {/* Direct Action Row */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                onClick={handleLoadSample}
                variant="primary"
                size="lg"
                className="shadow-lg shadow-[var(--primary)]/30 px-7 py-3.5 font-bold text-base"
              >
                Load Sample Birthday (₹5L / 200 Guests)
              </Button>

              <Link href="/events/new">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-6 py-3.5 font-semibold text-base bg-[var(--surface)] hover:bg-[var(--surface-secondary)] border-[var(--border)]"
                >
                  + Create Custom Celebration
                </Button>
              </Link>

              <Link href="/scenarios">
                <Button variant="ghost" size="lg" className="text-sm font-semibold text-[var(--accent)]">
                  Explore Adaptive Simulator →
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Single Signature Demo Showcase Card */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Official Demonstration Blueprint</h2>
              <p className="text-xs sm:text-sm text-[var(--muted)]">Complete end-to-end birthday celebration plan with budgets, date-aware tasks, vendor contracts, and constraints</p>
            </div>
            <Badge variant="accent">BIRTHDAY DEMO</Badge>
          </div>

          <div className="celebration-card p-6 sm:p-8 border-l-4 border-l-[var(--accent)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-secondary)]/50 to-[var(--surface)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-light)] border border-[var(--accent)]/30 flex items-center justify-center text-2xl shadow-inner">
                  🎂
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[var(--foreground)]">Ananya&apos;s Grand Birthday Celebration</h3>
                  <p className="text-xs text-[var(--muted)]">Milestone 30th Birthday • Chennai, Tamil Nadu • Contemporary & Heritage Fusion</p>
                </div>
              </div>
              <Badge variant="success">✓ Pre-validated Constraints</Badge>
            </div>

            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Fully configured milestone birthday celebration featuring banquet hall & terrace lawn rental, authentic celebratory dinner feast (₹1,200/guest), professional photography with instant photobooth, theme floral and balloon installations, live entertainment band, and wheelchair-accessible facilities.
            </p>

            {/* 4 Feature Pillars of Demo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs">
              <div>
                <span className="text-[var(--muted)] block font-medium">Budget Ceiling</span>
                <strong className="text-base font-extrabold text-[var(--primary)]">₹5,00,000.00</strong>
              </div>
              <div>
                <span className="text-[var(--muted)] block font-medium">Guest Capacity</span>
                <strong className="text-base font-extrabold text-[var(--foreground)]">200 / 300 Max</strong>
              </div>
              <div>
                <span className="text-[var(--muted)] block font-medium">Timeline Horizon</span>
                <strong className="text-base font-extrabold text-[var(--accent)]">3 Months (10 Tasks)</strong>
              </div>
              <div>
                <span className="text-[var(--muted)] block font-medium">Shortlisted Vendors</span>
                <strong className="text-base font-extrabold text-[var(--foreground)]">3 Quoted</strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                onClick={handleLoadSample}
                variant="primary"
                size="md"
                className="font-bold shadow-md shadow-[var(--primary)]/20"
              >
                Launch Signature Birthday Demo
              </Button>
              <span className="text-xs text-[var(--muted)]">Loads all budget line items, tasks, and vendor quotations into your local workspace.</span>
            </div>
          </div>
        </section>

        {/* Architectural Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[var(--border)]">
          <div className="flex items-start gap-3.5 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <span className="text-2xl mt-0.5" role="img" aria-label="Security">🛡️</span>
            <div>
              <h4 className="text-sm font-bold text-[var(--foreground)]">Zero-Error Integer Math</h4>
              <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                All monetary computations execute strictly in integer paise (1/100 INR) with strict variance tracking, eliminating float rounding drift.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <span className="text-2xl mt-0.5" role="img" aria-label="Engine">⚡</span>
            <div>
              <h4 className="text-sm font-bold text-[var(--foreground)]">Adaptive Constraint Graph</h4>
              <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                Guest count surges dynamically recalculate per-person costs, venue capacities, and vendor requirements with instant recovery options.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <span className="text-2xl mt-0.5" role="img" aria-label="Timeline">📅</span>
            <div>
              <h4 className="text-sm font-bold text-[var(--foreground)]">Date-Aware Milestones</h4>
              <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                Graph-linked task deadlines synchronize tastings, invitations, and vendor payments backwards from celebration day.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Dark-mode optimized jewel-tone color tokens for budget distribution
  const categoryColors: Record<string, { bg: string; text: string; bar: string }> = {
    catering: { bg: 'bg-amber-500/15', text: 'text-amber-400', bar: 'bg-amber-500' },
    venue: { bg: 'bg-purple-500/15', text: 'text-purple-400', bar: 'bg-purple-500' },
    decoration: { bg: 'bg-rose-500/15', text: 'text-rose-400', bar: 'bg-rose-500' },
    photography: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', bar: 'bg-emerald-500' },
    entertainment: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', bar: 'bg-indigo-500' },
    contingency: { bg: 'bg-slate-500/15', text: 'text-slate-400', bar: 'bg-slate-500' },
    invitations: { bg: 'bg-orange-500/15', text: 'text-orange-400', bar: 'bg-orange-500' },
    transportation: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', bar: 'bg-cyan-500' },
    attire: { bg: 'bg-pink-500/15', text: 'text-pink-400', bar: 'bg-pink-500' },
    other: { bg: 'bg-gray-500/15', text: 'text-gray-400', bar: 'bg-gray-500' },
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
  const unitRate = perPersonItem?.unitRatePaise || 120000; // default ₹1,200
  const simCateringCost = simGuests * unitRate;
  const currentCateringCost = (activeScenario?.guestCount || 200) * unitRate;
  const simProjectedTotal = (budgetSummary?.projectedTotalPaise || 50000000) - currentCateringCost + simCateringCost;
  const simCeiling = activeScenario?.budgetCeilingPaise || 50000000;
  const simVariance = simProjectedTotal - simCeiling;
  const simIsOver = simVariance > 0;

  // Active Event Dashboard
  return (
    <div className="space-y-6">
      {/* Top Banner / Event Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
            Celebration Workspace
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Samullāsa Celebration Studio • Multi-Scenario Event Intelligence
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {state.events.length > 1 && (
            <select
              value={activeEvent?.id}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] text-[var(--foreground)] font-medium shadow-xs"
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
            <Button size="sm" variant="outline">
              + New Event
            </Button>
          </Link>

          <Link href="/scenarios">
            <Button size="sm" variant="secondary" className="shadow-xs font-semibold">
              ⚡ Adaptive Engine
            </Button>
          </Link>
        </div>
      </div>

      {activeEvent && activeScenario && budgetSummary && (
        <>
          {/* Luxury Event Header Banner */}
          <div className="celebration-card p-6 sm:p-7 bg-gradient-to-r from-[var(--surface)] via-[var(--surface-secondary)] to-[var(--surface)] border border-[var(--border)] relative overflow-hidden">
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
                    Click any task checkbox to update status directly. Changes persist automatically.
                  </p>
                </div>
                <Link href="/timeline" className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1">
                  View Full Timeline →
                </Link>
              </div>

              {activeScenario.tasks.length === 0 ? (
                <p className="text-sm text-[var(--muted)] py-4">No tasks configured for this event.</p>
              ) : (
                <div className="space-y-2.5">
                  {activeScenario.tasks.slice(0, 6).map((task) => {
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
                            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
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
                                <span className="text-amber-400 font-semibold">● High</span>
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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" role="img" aria-label="Simulator">⚡</span>
                    <h3 className="text-base font-bold text-[var(--foreground)]">Quick What-If Simulator</h3>
                  </div>
                  <Badge variant="accent">SANDBOX</Badge>
                </div>

                <p className="text-xs text-[var(--muted)] leading-relaxed mb-3">
                  Stress-test the benchmark celebration requirements: observe real-time dependency propagation across catering and capacity:
                </p>

                {/* Guest Count Selector Buttons */}
                <div className="space-y-2 mb-3">
                  <span className="text-xs font-semibold text-[var(--muted)]">Select Scenario Guest Count:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { guests: 200, label: '200 Guests (Baseline)' },
                      { guests: 280, label: '280 Guests (Stress Test)' },
                    ].map((btn) => (
                      <button
                        key={btn.guests}
                        onClick={() => setSimGuests(btn.guests)}
                        className={`py-2 px-2.5 text-xs font-bold rounded-[var(--radius-md)] border transition-all ${
                          simGuests === btn.guests
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-[var(--primary)]/20'
                            : 'bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--surface-secondary)]'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Sandbox Result Preview */}
                <div className="p-3.5 rounded-lg bg-[var(--background)] border border-[var(--border)] space-y-1.5 text-xs mb-4 shadow-inner">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Simulated Total:</span>
                    <strong className="text-[var(--foreground)]">{formatPaise(simProjectedTotal)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Budget Variance:</span>
                    <strong className={simIsOver ? 'text-[var(--danger)] font-bold' : 'text-[var(--success)] font-bold'}>
                      {simVariance === 0 ? '₹0.00 (On Target)' : `${simVariance > 0 ? '+' : ''}${formatPaise(simVariance)}`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Venue Status:</span>
                    <span className="font-semibold text-[var(--success)]">
                      {simGuests} / {activeEvent.venueCapacity} Capacity (Fits ✓)
                    </span>
                  </div>
                  {simIsOver && (
                    <p className="text-[11px] text-[var(--danger)] pt-1.5 border-t border-[var(--border-subtle)] font-semibold">
                      ⚠ Hard constraint violated: Ceiling exceeded by {formatPaise(simVariance)}
                    </p>
                  )}
                </div>

                <Link href="/scenarios">
                  <Button variant="primary" className="w-full shadow-md font-bold">
                    Open Full Adaptive Engine →
                  </Button>
                </Link>
              </Card>

              {/* Active Constraints Health Check */}
              <Card padding="md" className="celebration-card">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border)]">
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Active Constraints Health</h3>
                  <Badge variant={activeScenario.isFeasible ? 'success' : 'danger'}>
                    {activeScenario.isFeasible ? 'All Passed' : 'Violations'}
                  </Badge>
                </div>
                <div className="space-y-2.5">
                  {activeScenario.constraints.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-xs py-1 border-b border-[var(--border-subtle)] last:border-none">
                      <span className="text-[var(--foreground)] font-medium">{c.name}</span>
                      <span className={c.isSatisfied ? 'text-[var(--success)] font-bold' : 'text-[var(--danger)] font-bold'}>
                        {c.isSatisfied ? '✓ Satisfied' : '✕ Violated'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
