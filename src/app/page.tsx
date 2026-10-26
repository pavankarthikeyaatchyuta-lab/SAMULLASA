'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { formatPaise, calculateBudgetSummary, getCategoryLabel } from '@/lib/budget-engine';
import { Card, Button, Badge, ProgressBar } from '@/components/ui';
import { SamullasaLogo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import type { TaskStatus } from '@/types/events';

export default function DashboardPage() {
  const { state, dispatch, getCurrentScenario } = useStore();
  const [selectedEventId, setSelectedEventId] = useState<string>(
    state.events[0]?.id || '',
  );

  // View toggle: Landing Page vs Active Workspace
  // Default to 'landing' so EVERY user visiting https://samullasa.vercel.app/ sees the luxury landing page
  const [viewMode, setViewMode] = useState<'workspace' | 'landing'>('landing');

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
    setViewMode('workspace');
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. LANDING PAGE VIEW (Default for all visitors on https://samullasa.vercel.app/)
  // ═══════════════════════════════════════════════════════════════════════════
  if (viewMode === 'landing') {
    return (
      <div className="space-y-16 py-6 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Active Celebration Notification Banner if an event exists */}
        {state.events.length > 0 && activeEvent && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-[var(--surface-secondary)] via-[var(--surface)] to-[var(--surface-secondary)] border border-[var(--accent)]/30 shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-label="Celebration">🪷</span>
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  Active Celebration: {activeEvent.name}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {activeScenario?.guestCount} Guests • {formatPaise(budgetSummary?.projectedTotalPaise || 50000000)} Projected Budget
                </p>
              </div>
            </div>
            <Button
              onClick={() => setViewMode('workspace')}
              variant="primary"
              size="sm"
              className="font-bold shadow-xs whitespace-nowrap"
            >
              Enter Celebration Studio →
            </Button>
          </div>
        )}

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--surface)] via-[var(--surface-secondary)] to-[var(--surface)] border border-[var(--border)] p-8 sm:p-14 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-[var(--primary)]/20 blur-3xl pointer-events-none animate-ambient" />
          <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-[var(--accent)]/15 blur-3xl pointer-events-none animate-ambient" style={{ animationDelay: '-4.5s' }} />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-secondary)] border border-[var(--accent)]/40 text-xs font-semibold text-[var(--accent)] shadow-xs sheen-pill">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              समुल्लासः • Celebration with Mathematical Clarity & Grace
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[var(--foreground)] tracking-tight leading-tight">
                Plan Celebrations with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--accent-hover)]">
                  Grace & Precision.
                </span>
              </h1>
              <p className="text-base sm:text-xl text-[var(--muted)] leading-relaxed">
                The next-generation celebration intelligence platform for milestone birthdays, weddings, and community festivals. Experience deterministic integer-paise financial calculations, date-aware milestone dependency graphs, and instant constraint recovery.
              </p>
            </div>

            {/* Direct Action Row */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Button
                onClick={handleLoadSample}
                variant="primary"
                size="lg"
                className="shadow-xl shadow-[var(--primary)]/30 px-8 py-4 font-bold text-base"
              >
                Load Sample Birthday (₹5L / 200 Guests)
              </Button>

              <Link href="/events/new">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-7 py-4 font-semibold text-base bg-[var(--surface)] hover:bg-[var(--surface-secondary)] border-[var(--border)]"
                >
                  + Create Custom Celebration
                </Button>
              </Link>

              <Link href="/scenarios">
                <Button variant="ghost" size="lg" className="text-sm font-semibold text-[var(--accent)] hover:underline">
                  Explore Adaptive Simulator →
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Live Product Preview Card */}
        <section id="demo-preview" className="space-y-4">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Interactive Studio Preview</h2>
            <p className="text-sm text-[var(--muted)]">Real-time visibility into budgets, constraints, and preparation deadlines</p>
          </div>

          <div className="celebration-card p-6 sm:p-8 bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="accent">MILESTONE BIRTHDAY</Badge>
                  <span className="text-xs text-[var(--muted)]">Scenario v{activeScenario?.version || 1} • Approved</span>
                  <Badge variant="success">✓ Pre-validated Plan</Badge>
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  {activeEvent?.name || "Ananya's Grand Birthday Celebration"}
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  📍 {activeEvent?.location || "Chennai, Tamil Nadu"} • <span className="font-bold text-[var(--foreground)]">{activeScenario?.guestCount ?? 200}</span> Guests • <span className="font-bold text-[var(--accent)]">{formatPaise(budgetSummary?.projectedTotalPaise || 50000000)}</span> Projected Budget
                </p>
              </div>

              <Button
                onClick={() => {
                  if (!activeEvent) handleLoadSample();
                  else setViewMode('workspace');
                }}
                variant="primary"
                size="sm"
                className="font-bold shadow-md shadow-[var(--primary)]/20"
              >
                {activeEvent ? "Enter Celebration Studio →" : "Launch Live Demo →"}
              </Button>
            </div>

            {/* Visual Budget Stacked Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[var(--foreground)]">
                  Celebration Budget Allocation ({formatPaise(budgetSummary?.projectedTotalPaise || 50000000)})
                </span>
                <span className="text-[var(--success)]">100% Allocated • ₹0 Drift</span>
              </div>
              <div className="w-full h-3.5 bg-[var(--surface-secondary)] rounded-full overflow-hidden flex shadow-inner">
                <div className="h-full cat-catering-bar" style={{ width: '48%' }} title="Catering: ₹2,40,000 (48%)" />
                <div className="h-full cat-venue-bar" style={{ width: '16%' }} title="Venue: ₹80,000 (16%)" />
                <div className="h-full cat-decor-bar" style={{ width: '12%' }} title="Decor: ₹60,000 (12%)" />
                <div className="h-full cat-photo-bar" style={{ width: '9%' }} title="Photo: ₹45,000 (9%)" />
                <div className="h-full cat-entertainment-bar" style={{ width: '6%' }} title="Entertainment: ₹30,000 (6%)" />
                <div className="h-full cat-contingency-bar" style={{ width: '6%' }} title="Contingency: ₹30,000 (6%)" />
                <div className="h-full cat-invitations-bar" style={{ width: '3%' }} title="Invitations: ₹15,000 (3%)" />
              </div>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                <span className="px-2.5 py-0.5 rounded-md cat-catering-bg cat-catering-text border border-[#D4AF37]/20 font-medium">Catering ₹2.40L (48%)</span>
                <span className="px-2.5 py-0.5 rounded-md cat-venue-bg cat-venue-text border border-[#C272C8]/20 font-medium">Venue ₹80K (16%)</span>
                <span className="px-2.5 py-0.5 rounded-md cat-decor-bg cat-decor-text border border-[#D48D9F]/20 font-medium">Decor ₹60K (12%)</span>
                <span className="px-2.5 py-0.5 rounded-md cat-photo-bg cat-photo-text border border-[#69B88E]/20 font-medium">Photo ₹45K (9%)</span>
                <span className="px-2.5 py-0.5 rounded-md cat-contingency-bg cat-contingency-text border border-[#AFA2B3]/20 font-medium">Contingency ₹30K (6%)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Three Core Celebration Archetypes */}
        <section id="archetypes" className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Celebration Archetypes</h2>
            <p className="text-sm text-[var(--muted)]">Custom workflows, task templates, and budget line items for every occasion</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="celebration-card p-6 space-y-3 border-t-4 border-t-[var(--accent)]">
              <span className="text-3xl" role="img" aria-label="Birthday">🎂</span>
              <h3 className="text-lg font-bold text-[var(--foreground)]">Milestone Birthdays</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Carnival themes, custom artisan cakes, live entertainment bands, photobooths, and personalized favors for 1st to 50th jubilees.
              </p>
            </div>

            <div className="celebration-card p-6 space-y-3 border-t-4 border-t-[var(--primary)]">
              <span className="text-3xl" role="img" aria-label="Wedding">💍</span>
              <h3 className="text-lg font-bold text-[var(--foreground)]">Weddings & Sangeet</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Traditional mandapam logistics, multi-day coordination, catering feasts, guest lists, and wheelchair accessibility compliance.
              </p>
            </div>

            <div className="celebration-card p-6 space-y-3 border-t-4 border-t-[var(--success)]">
              <span className="text-3xl" role="img" aria-label="Festival">🪔</span>
              <h3 className="text-lg font-bold text-[var(--foreground)]">Community Festivals</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Open amphitheater events, food stall budgeting, municipal security permits, cultural troupes, and crowd flow management.
              </p>
            </div>
          </div>
        </section>

        {/* Interactive What-If Guest Surge Simulator */}
        <section id="surge-simulator" className="celebration-card p-6 sm:p-8 space-y-6 border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-secondary)]/50 to-[var(--surface)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-light)] text-[var(--accent)] mb-2">
                <span>⚡</span> Real-Time Constraint Engine
              </div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">Live Guest Surge Stress Test</h2>
              <p className="text-xs text-[var(--muted)]">See how mathematical DAG propagation instantly catches venue limits and budget variance</p>
            </div>

            <div className="flex items-center gap-2 bg-[var(--surface)] p-1.5 rounded-lg border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setSimGuests(200)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  simGuests === 200
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                200 Baseline Guests
              </button>
              <button
                type="button"
                onClick={() => setSimGuests(280)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  simGuests === 280
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                280 Surge Guests (+40%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <p className="text-[11px] font-semibold uppercase text-[var(--muted)]">Simulated Guests</p>
              <p className="text-2xl font-black text-[var(--foreground)]">{simGuests} Guests</p>
              <p className="text-[11px] text-[var(--muted)]">Per-person rate: ₹1,200.00/head</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <p className="text-[11px] font-semibold uppercase text-[var(--muted)]">Catering Cost</p>
              <p className="text-2xl font-black text-[var(--accent)]">{formatPaise(simGuests * 120000)}</p>
              <p className="text-[11px] text-[var(--muted)]">{simGuests === 200 ? '48% of total budget' : '+₹96K surge increase'}</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <p className="text-[11px] font-semibold uppercase text-[var(--muted)]">Projected Total</p>
              <p className={`text-2xl font-black ${simGuests > 200 ? 'text-[var(--danger)]' : 'text-[var(--foreground)]'}`}>
                {formatPaise(50000000 - (200 * 120000) + (simGuests * 120000))}
              </p>
              <p className="text-[11px] text-[var(--muted)]">Ceiling: ₹5,00,000.00</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <p className="text-[11px] font-semibold uppercase text-[var(--muted)]">Constraint Status</p>
              <div className="pt-0.5">
                {simGuests <= 200 ? (
                  <Badge variant="success">✓ 100% Feasible</Badge>
                ) : (
                  <Badge variant="danger">⚠ Hard Violations</Badge>
                )}
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                {simGuests <= 200 ? 'Within venue capacity (250)' : 'Exceeds ₹5L ceiling & venue max'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] text-xs text-[var(--muted)]">
            <p>
              {simGuests === 200
                ? '💡 The baseline plan operates with ₹0 integer paise drift and satisfies all date-aware vendor constraints.'
                : '🚨 The 280 guest surge violates the budget ceiling by ₹96,000 and exceeds the Grand Ballroom capacity of 250.'}
            </p>
            <Link href="/scenarios">
              <Button size="sm" variant="secondary" className="font-bold text-xs whitespace-nowrap">
                Resolve in Adaptive Engine ⚡
              </Button>
            </Link>
          </div>
        </section>

        {/* Five Architectural Pillars */}
        <section id="math-engine" className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">The Architectural Core</h2>
            <p className="text-sm text-[var(--muted)]">Why Samullāsa is fundamentally different from generic checklists and chatbots</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="celebration-card p-6 space-y-2">
              <span className="text-2xl" role="img" aria-label="Math">🛡️</span>
              <h3 className="text-base font-bold text-[var(--foreground)]">Zero-Float Integer Paise</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                All monetary computations execute in integer paise (1/100 INR) with strict variance tracking, eliminating float rounding drift across quotes.
              </p>
            </div>

            <div className="celebration-card p-6 space-y-2">
              <span className="text-2xl" role="img" aria-label="Graph">⚡</span>
              <h3 className="text-base font-bold text-[var(--foreground)]">Adaptive Constraint Graph</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Guest count surges automatically propagate across catering, venues, and task deadlines without manual recalculations.
              </p>
            </div>

            <div className="celebration-card p-6 space-y-2">
              <span className="text-2xl" role="img" aria-label="Timeline">📅</span>
              <h3 className="text-base font-bold text-[var(--foreground)]">Date-Aware Reverse Gantt</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Task deadlines synchronize backwards from celebration day to ensure tasting sessions and vendor confirmations are completed on schedule.
              </p>
            </div>

            <div className="celebration-card p-6 space-y-2">
              <span className="text-2xl" role="img" aria-label="Vendors">🤝</span>
              <h3 className="text-base font-bold text-[var(--foreground)]">Vendor Contract Ledger</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Track itemized quotations, inclusions, exclusions, and payment deposit tranches across catering, photography, and decor in one view.
              </p>
            </div>

            <div className="celebration-card p-6 space-y-2">
              <span className="text-2xl" role="img" aria-label="AI">🤖</span>
              <h3 className="text-base font-bold text-[var(--foreground)]">Google Gemini AI Engine</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Natural-language request interpretation and personalized celebration recommendations with deterministic output schema validation.
              </p>
            </div>

            <div className="celebration-card p-6 space-y-2">
              <span className="text-2xl" role="img" aria-label="Privacy">🔒</span>
              <h3 className="text-base font-bold text-[var(--foreground)]">Local Persistence & Privacy</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Celebration data is stored safely in client-side storage with immutable version history and instant deterministic rollback.
              </p>
            </div>
          </div>
        </section>

        {/* Royal Celebration Heritage Banner */}
        <section className="celebration-card p-8 sm:p-10 text-center space-y-4 border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--surface)] via-[var(--surface-secondary)]/70 to-[var(--surface)] relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-60 h-60 rounded-full bg-[var(--accent)]/10 blur-3xl pointer-events-none animate-ambient" />
          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <span className="text-3xl" role="img" aria-label="Lotus">🪷</span>
            <blockquote className="text-base sm:text-lg font-medium text-[var(--foreground)] italic leading-relaxed">
              &ldquo;In timeless tradition, a celebration is an emotional mandala where hospitality, culture, and precision harmonize. Samullāsa ensures mathematical peace of mind so you can celebrate with unburdened joy.&rdquo;
            </blockquote>
            <p className="text-xs uppercase font-bold tracking-widest text-[var(--accent)]">
              समुल्लासः • Celebration Intelligence Studio
            </p>
          </div>
        </section>

        {/* Demo Launch Banner */}
        <section className="celebration-card p-8 text-center space-y-4 bg-gradient-to-r from-[var(--surface-secondary)] via-[var(--surface)] to-[var(--surface-secondary)] border-2 border-[var(--primary)]/40">
          <h2 className="text-2xl font-black text-[var(--foreground)]">Ready to Experience Samullāsa?</h2>
          <p className="text-sm text-[var(--muted)] max-w-xl mx-auto">
            Launch the pre-configured milestone birthday celebration with ₹5,00,000 budget, 200 guests, 10 milestones, and 3 vendor quotations.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Button
              onClick={handleLoadSample}
              variant="primary"
              size="lg"
              className="font-bold shadow-lg shadow-[var(--primary)]/30 px-8"
            >
              Launch Signature Birthday Demo
            </Button>
            <Link href="/events/new">
              <Button variant="outline" size="lg">
                Create New Celebration
              </Button>
            </Link>
          </div>
        </section>

        {/* Landing Footer */}
        <footer className="pt-8 border-t border-[var(--border)] text-xs text-[var(--muted)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SamullasaLogo size={24} showText={false} />
            <span className="font-semibold text-[var(--foreground)]">SAMULLĀSA Celebration Studio</span>
            <span>• Deterministic Event Intelligence</span>
          </div>
          <p>© 2026 Samullāsa. Built with integer-paise math and adaptive constraint graphs.</p>
        </footer>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ACTIVE CELEBRATION WORKSPACE (When events exist and viewMode === 'workspace')
  // ═══════════════════════════════════════════════════════════════════════════
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

  return (
    <div className="space-y-6">
      {/* Top Banner / Event Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
            <h1 className="text-xl font-black text-[var(--foreground)] tracking-tight">
              Celebration Workspace
            </h1>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Samullāsa Celebration Studio • Multi-Scenario Event Intelligence
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle />

          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewMode('landing')}
            className="text-xs font-semibold hover:border-[var(--accent)]"
          >
            🌐 Back to Landing Page
          </Button>

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

          <Link href="/budget">
            <Button size="sm" variant="outline" className="text-xs">
              💰 Budget
            </Button>
          </Link>

          <Link href="/timeline">
            <Button size="sm" variant="outline" className="text-xs">
              📅 Timeline
            </Button>
          </Link>

          <Link href="/vendors">
            <Button size="sm" variant="outline" className="text-xs">
              🤝 Vendors
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
