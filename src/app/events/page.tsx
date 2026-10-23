'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { formatPaise, calculateBudgetSummary } from '@/lib/budget-engine';
import { Card, Button, Badge, EmptyState } from '@/components/ui';

export default function EventsListPage() {
  const { state, dispatch, getCurrentScenario } = useStore();

  const handleDelete = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event and its planning history?')) {
      dispatch({ type: 'DELETE_EVENT', payload: { eventId } });
    }
  };

  const handleLoadSample = () => {
    dispatch({ type: 'LOAD_SAMPLE_DATA' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Your Celebrations</h1>
          <p className="text-sm text-[var(--muted)]">
            Manage your weddings, birthdays, and community gatherings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleLoadSample}>
            Load Sample Celebrations
          </Button>
          <Link href="/events/new">
            <Button variant="primary" size="sm">
              + New Celebration Wizard
            </Button>
          </Link>
        </div>
      </div>

      {state.events.length === 0 ? (
        <EmptyState
          title="No Celebrations Created"
          description="Create your first wedding, birthday, or community gathering using the step-by-step wizard, or load the pre-configured sample data."
          action={
            <div className="flex gap-4">
              <Button onClick={handleLoadSample} variant="primary">
                Load Sample Data
              </Button>
              <Link href="/events/new">
                <Button variant="outline">Open Wizard</Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.events.map((event) => {
            const scenario = getCurrentScenario(event.id);
            const summary = scenario
              ? calculateBudgetSummary(
                  scenario.budgetItems,
                  scenario.budgetCeilingPaise,
                  scenario.guestCount,
                )
              : null;

            return (
              <Card key={event.id} padding="lg" className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={event.type === 'wedding' ? 'accent' : event.type === 'birthday' ? 'info' : 'success'}>
                      {event.type.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-[var(--muted)]">
                      {new Date(event.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--foreground)]">{event.name}</h3>
                  <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                    📍 {event.location} • {event.preferences.culturalStyle || 'Celebration'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 my-4 p-3 bg-[var(--surface-secondary)] rounded-[var(--radius-md)] text-xs">
                    <div>
                      <span className="text-[var(--muted)]">Guests:</span>
                      <p className="font-semibold text-sm">
                        {scenario?.guestCount || event.guestCount} / {event.venueCapacity}
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--muted)]">Budget Ceiling:</span>
                      <p className="font-semibold text-sm text-[var(--primary)]">
                        {formatPaise(event.budgetCeilingPaise)}
                      </p>
                    </div>
                    {summary && (
                      <>
                        <div>
                          <span className="text-[var(--muted)]">Projected:</span>
                          <p className={`font-semibold ${summary.isOverBudget ? 'text-[var(--danger)]' : 'text-[var(--foreground)]'}`}>
                            {formatPaise(summary.projectedTotalPaise)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[var(--muted)]">Status:</span>
                          <p className="font-semibold">
                            {scenario?.isFeasible ? '✓ Feasible' : '⚠ Violation'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <Link href={`/scenarios`}>
                      <Button size="sm" variant="primary">
                        Adaptive Simulator
                      </Button>
                    </Link>
                    <Link href={`/budget`}>
                      <Button size="sm" variant="outline">
                        Budget
                      </Button>
                    </Link>
                  </div>

                  <button
                    onClick={() => handleDelete(event.id)}
                    className="text-xs text-[var(--danger)] hover:underline p-1"
                    aria-label={`Delete event ${event.name}`}
                  >
                    Delete
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
