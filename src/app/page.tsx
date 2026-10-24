'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { formatPaise, calculateBudgetSummary } from '@/lib/budget-engine';
import { Card, Button, Badge, ProgressBar, StatusIndicator } from '@/components/ui';

export default function DashboardPage() {
  const { state, dispatch, getCurrentScenario } = useStore();
  const [selectedEventId, setSelectedEventId] = useState<string>(
    state.events[0]?.id || '',
  );

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

  if (state.events.length === 0) {
    return (
      <div className="space-y-12 py-4">
        {/* Luxury Hero Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--surface)] via-[var(--surface-secondary)]/50 to-[var(--surface)] border border-[var(--border)] p-8 sm:p-12 shadow-sm">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[var(--accent)]/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-[var(--primary)]/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--accent)]/30 text-xs font-semibold text-[var(--accent)] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              समुल्लासः • Celebration with Mathematical Clarity & Grace
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--foreground)] tracking-tight leading-tight">
                Plan the Celebration.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]">
                  Master Every Trade-off.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
                Adaptive event intelligence for weddings, milestone birthdays, and community festivals. Experience deterministic paise-precision budgets, date-aware milestone dependency graphs, and instant constraint recovery.
              </p>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                onClick={handleLoadSample}
                variant="primary"
                size="lg"
                className="shadow-md shadow-[var(--primary)]/20 px-6 py-3 font-semibold text-base"
              >
                Load Sample Wedding (₹5L / 200 Guests)
              </Button>

              <Link href="/events/new">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-6 py-3 font-semibold text-base bg-[var(--surface)] hover:bg-[var(--surface-secondary)] border-[var(--border)]"
                >
                  + Create Custom Celebration
                </Button>
              </Link>

              <Link href="/scenarios">
                <Button variant="ghost" size="lg" className="text-sm font-semibold text-[var(--primary)]">
                  Explore Adaptive Simulator →
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Preset Blueprint Launch Cards */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Curated Celebration Blueprints</h2>
              <p className="text-xs sm:text-sm text-[var(--muted)]">Choose a celebration archetype to launch complete budgets, timelines, and vendor workflows</p>
            </div>
            <Badge variant="accent">3 ARCHETYPES</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Wedding Blueprint */}
            <div className="celebration-card p-6 flex flex-col justify-between space-y-4 border-t-4 border-t-[var(--primary)]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl" role="img" aria-label="Wedding">💍</span>
                  <Badge variant="accent">WEDDING</Badge>
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Royal South Indian Wedding</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Traditional mandapam, Carnatic classical nadaswaram, 32-item authentic Sadya feast, wheelchair access, and multi-tier vendor quotes.
                </p>
                <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Budget Ceiling:</span>
                    <strong className="text-[var(--foreground)]">₹5,00,000</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Guest Capacity:</span>
                    <strong className="text-[var(--foreground)]">200 Guests (Venue max 300)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Timeline Horizon:</span>
                    <strong className="text-[var(--foreground)]">3 Months (10 Milestones)</strong>
                  </div>
                </div>
              </div>
              <Button onClick={handleLoadSample} variant="primary" size="sm" className="w-full">
                Load Wedding Blueprint
              </Button>
            </div>

            {/* Milestone Birthday Blueprint */}
            <div className="celebration-card p-6 flex flex-col justify-between space-y-4 border-t-4 border-t-[var(--accent)]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl" role="img" aria-label="Birthday">🎂</span>
                  <Badge variant="info">MILESTONE BIRTHDAY</Badge>
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">50th Golden Jubilee Birthday</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Rooftop banquet, retro jazz duo, live charcoal barbecue grill, memory retrospective video wall, and personalized guest favors.
                </p>
                <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Budget Target:</span>
                    <strong className="text-[var(--foreground)]">₹2,50,000</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Guest Count:</span>
                    <strong className="text-[var(--foreground)]">80 Close Guests</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Timeline Horizon:</span>
                    <strong className="text-[var(--foreground)]">6 Weeks</strong>
                  </div>
                </div>
              </div>
              <Link href="/events/new" className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  Create Birthday Plan
                </Button>
              </Link>
            </div>

            {/* Community Festival Blueprint */}
            <div className="celebration-card p-6 flex flex-col justify-between space-y-4 border-t-4 border-t-[var(--success)]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl" role="img" aria-label="Community Festival">🪔</span>
                  <Badge variant="success">COMMUNITY UTSAV</Badge>
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Diwali Community Mela & Feast</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Open amphitheater, eco-friendly floral rangoli, 10 food stalls, folk dance performers, crowd safety management, and municipal approvals.
                </p>
                <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Budget Ceiling:</span>
                    <strong className="text-[var(--foreground)]">₹7,50,000</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Attendee Target:</span>
                    <strong className="text-[var(--foreground)]">450 Attendees</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Timeline Horizon:</span>
                    <strong className="text-[var(--foreground)]">8 Weeks</strong>
                  </div>
                </div>
              </div>
              <Link href="/events/new" className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  Create Community Plan
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Architectural Highlights */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[var(--border)]">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)]">
            <span className="text-2xl mt-0.5" role="img" aria-label="Security">🛡️</span>
            <div>
              <h4 className="text-sm font-bold text-[var(--foreground)]">Zero-Error Paise Math</h4>
              <p className="text-xs text-[var(--muted)] mt-1">
                All monetary computations execute in integer paise (1/100 INR) with strict variance tracking, eliminating float rounding drift.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)]">
            <span className="text-2xl mt-0.5" role="img" aria-label="Engine">⚡</span>
            <div>
              <h4 className="text-sm font-bold text-[var(--foreground)]">Adaptive Constraint Graph</h4>
              <p className="text-xs text-[var(--muted)] mt-1">
                Guest count surges dynamically recalculate per-person costs, venue capacities, and vendor requirements with instant recovery options.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)]">
            <span className="text-2xl mt-0.5" role="img" aria-label="Timeline">📅</span>
            <div>
              <h4 className="text-sm font-bold text-[var(--foreground)]">Date-Aware Milestones</h4>
              <p className="text-xs text-[var(--muted)] mt-1">
                Graph-linked task deadlines synchronize tastings, invitations, and vendor payments backwards from celebration day.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

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
            <Button size="sm" variant="secondary" className="shadow-xs">
              ⚡ Adaptive Engine
            </Button>
          </Link>
        </div>
      </div>

      {activeEvent && activeScenario && budgetSummary && (
        <>
          {/* Event Header Card */}
          <div className="celebration-card p-6 bg-gradient-to-r from-[var(--surface)] via-[var(--surface-secondary)]/40 to-[var(--surface)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={activeEvent.type === 'wedding' ? 'accent' : 'info'}>
                    {activeEvent.type.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-[var(--muted)] font-medium">
                    Scenario v{activeScenario.version} • {activeScenario.name}
                  </span>
                  <Badge variant={activeScenario.isFeasible ? 'success' : 'danger'}>
                    {activeScenario.isFeasible ? '✓ Plan Feasible' : '⚠ Constraints Violated'}
                  </Badge>
                </div>
                <h2 className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight">
                  {activeEvent.name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[var(--muted)]">
                  <span>📅 {new Date(activeEvent.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>•</span>
                  <span>📍 {activeEvent.location}</span>
                  {activeEvent.preferences?.culturalStyle && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-[var(--accent)]">{activeEvent.preferences.culturalStyle} Tradition</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 sm:gap-8 bg-[var(--surface)]/80 p-4 rounded-xl border border-[var(--border)] shadow-xs">
                <div className="text-right">
                  <p className="text-xs text-[var(--muted)] font-medium">Guest Count</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)]">
                    {activeScenario.guestCount}
                    <span className="text-xs font-normal text-[var(--muted)] ml-1">
                      / max {activeEvent.venueCapacity}
                    </span>
                  </p>
                </div>
                <div className="text-right border-l border-[var(--border)] pl-6 sm:pl-8">
                  <p className="text-xs text-[var(--muted)] font-medium">Budget Ceiling</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[var(--primary)]">
                    {formatPaise(activeScenario.budgetCeilingPaise)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="md" className="celebration-card">
              <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                Budget Projected
              </p>
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
              <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                Remaining Buffer
              </p>
              <p className={`text-2xl font-black mt-1 ${budgetSummary.remainingPaise >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                {formatPaise(budgetSummary.remainingPaise)}
              </p>
              <p className="text-xs text-[var(--muted)] mt-2">
                Contingency Reserve: <strong className="text-[var(--foreground)]">{formatPaise(budgetSummary.contingencyPaise)}</strong>
              </p>
            </Card>

            <Card padding="md" className="celebration-card">
              <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                Per-Guest Cost
              </p>
              <p className="text-2xl font-black mt-1 text-[var(--foreground)]">
                {formatPaise(budgetSummary.perPersonPaise)}
              </p>
              <p className="text-xs text-[var(--muted)] mt-2">
                Distributed over <strong className="text-[var(--foreground)]">{activeScenario.budgetItems.length}</strong> cost items
              </p>
            </Card>

            <Card padding="md" className="celebration-card">
              <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                Milestone Execution
              </p>
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

          {/* Quick Navigation Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Snapshot */}
            <Card padding="lg" className="lg:col-span-2 celebration-card">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)]">
                <div>
                  <h3 className="text-base font-bold text-[var(--foreground)]">
                    Upcoming Preparation Deadlines
                  </h3>
                  <p className="text-xs text-[var(--muted)]">Critical date-aware tasks linked to event schedule</p>
                </div>
                <Link href="/timeline" className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1">
                  View Full Timeline →
                </Link>
              </div>

              {activeScenario.tasks.length === 0 ? (
                <p className="text-sm text-[var(--muted)] py-4">No tasks configured for this event.</p>
              ) : (
                <div className="space-y-3">
                  {activeScenario.tasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/30 hover:bg-[var(--surface-secondary)]/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <StatusIndicator status={task.status} label="" />
                        <div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">{task.title}</p>
                          <p className="text-xs text-[var(--muted)]">
                            Due: {task.dueDate} {task.priority === 'critical' && <span className="text-[var(--danger)] font-bold ml-1.5">● Critical</span>}
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
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Actions & Adaptive Intelligence CTA */}
            <div className="space-y-6">
              <Card padding="md" className="celebration-card border-l-4 border-l-[var(--accent)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-secondary)]/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg" role="img" aria-label="Simulator">⚡</span>
                  <h3 className="text-base font-bold text-[var(--foreground)]">Adaptive Simulator</h3>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed mb-4">
                  Test requirement changes—such as guest count surges, budget reductions, or venue changes. The engine checks constraints and computes feasible alternatives.
                </p>
                <Link href="/scenarios">
                  <Button variant="primary" className="w-full shadow-sm">
                    Open Adaptive Simulator
                  </Button>
                </Link>
              </Card>

              <Card padding="md" className="celebration-card">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border)]">
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Active Constraints Health</h3>
                  <Badge variant={activeScenario.isFeasible ? 'success' : 'danger'}>
                    {activeScenario.isFeasible ? 'Pass' : 'Violations'}
                  </Badge>
                </div>
                <div className="space-y-2.5">
                  {activeScenario.constraints.slice(0, 4).map((c) => (
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
