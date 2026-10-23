'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { formatPaise, calculateBudgetSummary } from '@/lib/budget-engine';
import { Card, Button, Badge, ProgressBar, EmptyState, StatusIndicator } from '@/components/ui';

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
      <div className="py-12">
        <EmptyState
          title="Welcome to SAMULLĀSA"
          description="Your adaptive celebration & event planner. Start by creating your first celebration or load a pre-configured sample wedding plan to explore."
          action={
            <div className="flex flex-wrap gap-4 justify-center">
              <Button onClick={handleLoadSample} variant="primary">
                Load Sample Wedding (₹5L / 200 Guests)
              </Button>
              <Link href="/events/new">
                <Button variant="outline">Create New Event Wizard</Button>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
            Celebration Workspace
          </h1>
          <p className="text-sm text-[var(--muted)]">
            PromptWars Virtual Challenge 5 — Adaptive Event Intelligence
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {state.events.length > 1 && (
            <select
              value={activeEvent?.id}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] text-[var(--foreground)] font-medium"
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
            <Button size="sm" variant="secondary">
              ⚡ Adaptive Engine
            </Button>
          </Link>
        </div>
      </div>

      {activeEvent && activeScenario && budgetSummary && (
        <>
          {/* Event Header Card */}
          <Card className="bg-gradient-to-r from-[var(--surface)] to-[var(--surface-secondary)] border-[var(--border)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={activeEvent.type === 'wedding' ? 'accent' : 'info'}>
                    {activeEvent.type.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-[var(--muted)]">
                    Scenario v{activeScenario.version} • {activeScenario.name}
                  </span>
                  <Badge variant={activeScenario.isFeasible ? 'success' : 'danger'}>
                    {activeScenario.isFeasible ? '✓ Plan Feasible' : '⚠ Constraints Violated'}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">{activeEvent.name}</h2>
                <p className="text-sm text-[var(--muted)] mt-1">
                  📅 {new Date(activeEvent.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} • 📍 {activeEvent.location}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-[var(--muted)]">Guest Count</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {activeScenario.guestCount}
                    <span className="text-xs font-normal text-[var(--muted)] ml-1">
                      / max {activeEvent.venueCapacity}
                    </span>
                  </p>
                </div>
                <div className="text-right border-l border-[var(--border)] pl-6">
                  <p className="text-xs text-[var(--muted)]">Budget Ceiling</p>
                  <p className="text-2xl font-bold text-[var(--primary)]">
                    {formatPaise(activeScenario.budgetCeilingPaise)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="md">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Budget Projected
              </p>
              <p className="text-2xl font-bold mt-1 text-[var(--foreground)]">
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

            <Card padding="md">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Remaining Buffer
              </p>
              <p className={`text-2xl font-bold mt-1 ${budgetSummary.remainingPaise >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                {formatPaise(budgetSummary.remainingPaise)}
              </p>
              <p className="text-xs text-[var(--muted)] mt-2">
                Contingency Reserve: {formatPaise(budgetSummary.contingencyPaise)}
              </p>
            </Card>

            <Card padding="md">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Per-Guest Cost
              </p>
              <p className="text-2xl font-bold mt-1 text-[var(--foreground)]">
                {formatPaise(budgetSummary.perPersonPaise)}
              </p>
              <p className="text-xs text-[var(--muted)] mt-2">
                Across {activeScenario.budgetItems.length} budget items
              </p>
            </Card>

            <Card padding="md">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Preparation Tasks
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-[var(--foreground)]">
                  {completedTasks.length}
                </span>
                <span className="text-sm text-[var(--muted)]">
                  / {activeScenario.tasks.length} done ({pendingTasks.length} pending)
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-2">
                Vendors: {bookedVendors.length} confirmed / {activeScenario.vendors.length} total
              </p>
            </Card>
          </div>

          {/* Quick Navigation Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Snapshot */}
            <Card padding="lg" className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[var(--foreground)]">
                  Upcoming Preparation Deadlines
                </h3>
                <Link href="/timeline" className="text-xs font-semibold text-[var(--primary)] hover:underline">
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
                      className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-secondary)]/40 hover:bg-[var(--surface-secondary)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <StatusIndicator status={task.status} label="" />
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">{task.title}</p>
                          <p className="text-xs text-[var(--muted)]">
                            Due: {task.dueDate} {task.priority === 'critical' && <span className="text-[var(--danger)] font-semibold ml-1">● Critical</span>}
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
              <Card padding="md" className="border-l-4 border-l-[var(--accent)]">
                <h3 className="text-base font-bold text-[var(--foreground)]">Adaptive Event Engine</h3>
                <p className="text-xs text-[var(--muted)] mt-1 mb-4">
                  Need to change guest counts, adjust dates, or trade off catering quality? The adaptive engine recalculates dependencies and validates constraints in real time.
                </p>
                <Link href="/scenarios">
                  <Button variant="primary" className="w-full">
                    Open Adaptive Simulator
                  </Button>
                </Link>
              </Card>

              <Card padding="md">
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-3">Key Constraints Check</h3>
                <div className="space-y-2">
                  {activeScenario.constraints.slice(0, 4).map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-xs py-1 border-b border-[var(--border-subtle)] last:border-none">
                      <span className="text-[var(--foreground)] font-medium">{c.name}</span>
                      <span className={c.isSatisfied ? 'text-[var(--success)] font-semibold' : 'text-[var(--danger)] font-semibold'}>
                        {c.isSatisfied ? 'Passed' : 'Violated'}
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
