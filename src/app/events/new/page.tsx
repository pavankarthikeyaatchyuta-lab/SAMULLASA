'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Card, Button, Input, Select, Textarea, Badge } from '@/components/ui';
import type { EventType, EventDetails, Scenario, BudgetItem, Task, Vendor } from '@/types/events';
import { buildDefaultConstraints, evaluateConstraints } from '@/lib/constraint-engine';
import { formatPaise } from '@/lib/budget-engine';

export default function NewEventPage() {
  const router = useRouter();
  const { dispatch } = useStore();
  const [step, setStep] = useState<number>(1);

  // Form State
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('2025-11-20');
  const [location, setLocation] = useState('Bengaluru, Karnataka');
  const [venueCapacity, setVenueCapacity] = useState('300');
  const [guestCount, setGuestCount] = useState('200');
  const [budgetCeiling, setBudgetCeiling] = useState('500000'); // ₹5,00,000

  // Preferences & Accessibility
  const [culturalStyle, setCulturalStyle] = useState('South Indian');
  const [dietary, setDietary] = useState('Vegetarian, Jain option');
  const [accessibility, setAccessibility] = useState('Wheelchair ramp at entrance, Priority seating');
  const [priorityAreas, setPriorityAreas] = useState<string[]>(['catering', 'photography']);
  const [theme, setTheme] = useState('Traditional Gold & Jasmine');

  const [error, setError] = useState<string | null>(null);

  const togglePriority = (area: string) => {
    setPriorityAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError('Please enter a celebration name.');
        return;
      }
    }
    if (step === 2) {
      const gCount = Number(guestCount);
      const vCap = Number(venueCapacity);
      if (!date) {
        setError('Please select a valid event date.');
        return;
      }
      if (gCount <= 0) {
        setError('Guest count must be at least 1.');
        return;
      }
      if (vCap < gCount) {
        setError('Venue capacity cannot be smaller than expected guest count.');
        return;
      }
    }
    if (step === 3) {
      const bCeiling = Number(budgetCeiling);
      if (bCeiling < 1000) {
        setError('Please specify a realistic budget ceiling in ₹.');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleCreateEvent = () => {
    const eventId = `event-${Date.now()}`;
    const scenarioId = `scenario-init-${Date.now()}`;
    const ceilingPaise = Math.round(Number(budgetCeiling) * 100);
    const guests = Number(guestCount);
    const capacity = Number(venueCapacity);

    // Initial Budget Items tailored to event type
    const initialBudgetItems: BudgetItem[] = [
      {
        id: `item-v-${Date.now()}`,
        category: 'venue',
        name: 'Venue & Banquet Booking',
        amountPaise: Math.round(ceilingPaise * 0.20),
        costType: 'fixed',
        status: 'estimated',
        depositPaise: 0,
        isGenerated: true,
        sourceNote: 'Illustrative initial estimate (20% of budget)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `item-c-${Date.now()}`,
        category: 'catering',
        name: `${culturalStyle} Festive Banquet`,
        amountPaise: Math.round(ceilingPaise * 0.45),
        costType: 'per_person',
        unitCount: guests,
        unitRatePaise: Math.round((ceilingPaise * 0.45) / Math.max(1, guests)),
        status: 'estimated',
        depositPaise: 0,
        isGenerated: true,
        sourceNote: 'Illustrative initial estimate based on guest count',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `item-d-${Date.now()}`,
        category: 'decoration',
        name: `${theme || 'Celebration'} Theme Styling & Florals`,
        amountPaise: Math.round(ceilingPaise * 0.15),
        costType: 'fixed',
        status: 'estimated',
        depositPaise: 0,
        isGenerated: true,
        sourceNote: 'Illustrative initial estimate',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `item-p-${Date.now()}`,
        category: 'photography',
        name: 'Professional Photography & Cinematic Film',
        amountPaise: Math.round(ceilingPaise * 0.10),
        costType: 'fixed',
        status: 'estimated',
        depositPaise: 0,
        isGenerated: true,
        sourceNote: 'Illustrative initial estimate',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `item-con-${Date.now()}`,
        category: 'contingency',
        name: 'Contingency Reserve Fund',
        amountPaise: Math.round(ceilingPaise * 0.10),
        costType: 'fixed',
        status: 'estimated',
        depositPaise: 0,
        isGenerated: true,
        sourceNote: 'Recommended 10% emergency reserve',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Initial Preparation Tasks
    const initialTasks: Task[] = [
      {
        id: `task-1-${Date.now()}`,
        title: 'Confirm and secure venue booking',
        dueDate: date,
        priority: 'critical',
        status: 'pending',
        dependencies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `task-2-${Date.now()}`,
        title: 'Finalize catering menu tasting',
        dueDate: date,
        priority: 'high',
        status: 'pending',
        dependencies: [`task-1-${Date.now()}`],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `task-3-${Date.now()}`,
        title: 'Review accessibility arrangements and seating',
        dueDate: date,
        priority: 'high',
        status: 'pending',
        dependencies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const initialVendors: Vendor[] = [];

    const newEvent: EventDetails = {
      id: eventId,
      name,
      type: eventType,
      status: 'planning',
      description,
      date,
      location,
      venueCapacity: capacity,
      guestCount: guests,
      budgetCeilingPaise: ceilingPaise,
      currency: 'INR',
      preferences: {
        culturalStyle,
        dietaryRequirements: dietary.split(',').map((s) => s.trim()).filter(Boolean),
        theme,
        priorityAreas,
      },
      accessibilityRequirements: accessibility.split(',').map((s) => s.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentScenarioId: scenarioId,
      scenarioHistory: [scenarioId],
    };

    const initialScenario: Scenario = {
      id: scenarioId,
      eventId,
      status: 'approved',
      name: 'Initial Approved Master Plan',
      description: 'Master plan generated by event wizard',
      guestCount: guests,
      budgetCeilingPaise: ceilingPaise,
      budgetItems: initialBudgetItems,
      tasks: initialTasks,
      vendors: initialVendors,
      constraints: [],
      changes: [],
      warnings: [],
      isFeasible: true,
      feasibilityNotes: ['Plan created with standard constraints check'],
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      version: 1,
    };

    // Calculate constraints
    const defaultConstraints = buildDefaultConstraints(newEvent, initialScenario);
    const evaluated = evaluateConstraints(defaultConstraints, initialScenario, newEvent);
    initialScenario.constraints = evaluated;

    dispatch({
      type: 'CREATE_EVENT',
      payload: {
        event: newEvent,
        scenario: initialScenario,
      },
    });

    router.push('/scenarios');
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Create Celebration</h1>
        <p className="text-sm text-[var(--muted)]">
          Step {step} of 6 — Design your event with deterministic budget & constraint intelligence
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 text-xs font-semibold">
        {[
          '1. Basic Details',
          '2. Scale & Dates',
          '3. Budget Ceiling',
          '4. Accessibility',
          '5. Cultural Style',
          '6. Review & Launch',
        ].map((lbl, idx) => (
          <span
            key={lbl}
            className={`${
              step === idx + 1
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] pb-1'
                : step > idx + 1
                ? 'text-[var(--success)]'
                : 'text-[var(--muted)]'
            }`}
          >
            {lbl}
          </span>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-[var(--danger-bg)] text-[var(--danger)] text-sm rounded-[var(--radius-md)]" role="alert">
          {error}
        </div>
      )}

      {/* Step 1: Event Type & Basics */}
      {step === 1 && (
        <Card padding="lg" className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Celebration Type</label>
            <div className="grid grid-cols-3 gap-3">
              {(['wedding', 'birthday', 'community'] as EventType[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setEventType(t)}
                  className={`p-4 border rounded-[var(--radius-md)] text-center transition-all ${
                    eventType === t
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] font-bold'
                      : 'border-[var(--border)] hover:bg-[var(--surface-secondary)]'
                  }`}
                >
                  <p className="capitalize text-base">{t}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {t === 'wedding' ? 'Multi-ritual celebration' : t === 'birthday' ? 'Milestone party' : 'Civic gathering'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Diya & Rohit's Wedding, Aarav's 1st Birthday"
            required
          />

          <Textarea
            label="Celebration Summary / Notes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief vision, key family priorities, or special requests..."
          />
        </Card>
      )}

      {/* Step 2: Date, Location & Guests */}
      {step === 2 && (
        <Card padding="lg" className="space-y-4">
          <Input
            label="Event Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            label="Location / City"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Bengaluru, Chennai, Mumbai"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Expected Guest Count"
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              min={1}
              required
            />
            <Input
              label="Venue Capacity (Hard Constraint)"
              type="number"
              value={venueCapacity}
              onChange={(e) => setVenueCapacity(e.target.value)}
              helpText="Capacity is strictly enforced by the constraint engine"
              min={1}
              required
            />
          </div>
        </Card>
      )}

      {/* Step 3: Budget Ceiling & Priorities */}
      {step === 3 && (
        <Card padding="lg" className="space-y-4">
          <Input
            label="Budget Ceiling (in INR ₹)"
            type="number"
            value={budgetCeiling}
            onChange={(e) => setBudgetCeiling(e.target.value)}
            helpText={`Displayed in Indian numbering format: ${formatPaise(Number(budgetCeiling || 0) * 100)}`}
            required
          />

          <div>
            <label className="block text-sm font-semibold mb-2">Priority Spending Focus</label>
            <p className="text-xs text-[var(--muted)] mb-3">
              Priority areas receive protection during automated budget optimization.
            </p>
            <div className="flex flex-wrap gap-2">
              {['catering', 'venue', 'decoration', 'photography', 'entertainment', 'gifts'].map((area) => (
                <button
                  type="button"
                  key={area}
                  onClick={() => togglePriority(area)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-colors ${
                    priorityAreas.includes(area)
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'border-[var(--border)] hover:bg-[var(--surface-secondary)] text-[var(--muted)]'
                  }`}
                >
                  {priorityAreas.includes(area) ? '✓ ' : '+ '} {area}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Accessibility & Dietary */}
      {step === 4 && (
        <Card padding="lg" className="space-y-4">
          <Input
            label="Accessibility Requirements (Hard Constraints)"
            value={accessibility}
            onChange={(e) => setAccessibility(e.target.value)}
            helpText="Comma separated. e.g.: Wheelchair access, Step-free entrance, Sign language interpreter"
          />

          <Input
            label="Dietary Inclusions"
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            helpText="Comma separated. e.g.: Pure Vegetarian, Jain counter, Halal options, Nut-free"
          />
        </Card>
      )}

      {/* Step 5: Cultural Style & Theme */}
      {step === 5 && (
        <Card padding="lg" className="space-y-4">
          <Select
            label="Cultural / Regional Style"
            value={culturalStyle}
            onChange={(e) => setCulturalStyle(e.target.value)}
            options={[
              { value: 'South Indian', label: 'South Indian (Traditional Tamil/Telugu/Kannada)' },
              { value: 'North Indian', label: 'North Indian (Punjabi/Marwari/Hindi)' },
              { value: 'Western/Contemporary', label: 'Western / Contemporary Chic' },
              { value: 'Fusion', label: 'Cross-Cultural Fusion' },
              { value: 'Secular/Modern', label: 'Modern Minimalist' },
            ]}
          />

          <Input
            label="Aesthetic Theme / Colors"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g. Royal Marigold & Gold, Pastel Spring Garden"
          />
        </Card>
      )}

      {/* Step 6: Review & Launch */}
      {step === 6 && (
        <Card padding="lg" className="space-y-4">
          <h3 className="text-lg font-bold text-[var(--foreground)]">Review Plan Configuration</h3>
          <div className="grid grid-cols-2 gap-4 text-sm bg-[var(--surface-secondary)] p-4 rounded-[var(--radius-md)]">
            <div>
              <p className="text-xs text-[var(--muted)]">Event Name</p>
              <p className="font-semibold">{name}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Type</p>
              <Badge variant="accent">{eventType.toUpperCase()}</Badge>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Date & City</p>
              <p className="font-semibold">{date} • {location}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Guest Count & Capacity</p>
              <p className="font-semibold">{guestCount} guests / {venueCapacity} max</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Budget Ceiling</p>
              <p className="font-semibold text-[var(--primary)]">{formatPaise(Number(budgetCeiling) * 100)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Cultural Style</p>
              <p className="font-semibold">{culturalStyle}</p>
            </div>
          </div>

          <div className="text-xs text-[var(--muted)] space-y-1">
            <p>✓ Automated initial budget breakdown generated with 10% contingency reserve.</p>
            <p>✓ Actionable date-aware preparation tasks generated.</p>
            <p>✓ Strict constraints validation initialized for capacity, budget ceiling, and accessibility.</p>
          </div>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-2">
        {step > 1 ? (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
            ← Back
          </Button>
        ) : (
          <div />
        )}

        {step < 6 ? (
          <Button variant="primary" onClick={handleNext}>
            Continue →
          </Button>
        ) : (
          <Button variant="secondary" onClick={handleCreateEvent}>
            🚀 Generate & Launch Plan
          </Button>
        )}
      </div>
    </div>
  );
}
