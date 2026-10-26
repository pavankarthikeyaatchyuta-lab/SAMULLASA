'use client';

import type {
  EventDetails,
  Scenario,
  BudgetItem,
  Task,
  Vendor,
  Constraint,
} from '@/types/events';

// ─── Deterministic UUID Generator ────────────────────────────────────────────
// Uses a simple hash-based approach so sample IDs are reproducible across runs.

function deterministicUUID(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const base = hex.repeat(4).slice(0, 32);
  return [
    base.slice(0, 8),
    base.slice(8, 12),
    '4' + base.slice(13, 16), // version 4
    '8' + base.slice(17, 20), // variant
    base.slice(20, 32),
  ].join('-');
}

// ─── Date Helpers ────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toISO(date: Date): string {
  return date.toISOString();
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ─── Generate Sample Data (Birthday Celebration Benchmark Demo) ─────────────

export function generateSampleData(): {
  events: EventDetails[];
  scenarios: Record<string, Scenario>;
} {
  const now = new Date();
  const eventDate = addDays(now, 90); // ~3 months from now
  const createdAt = toISO(now);

  // Deterministic IDs
  const eventId = deterministicUUID('birthday-event-ananya');
  const scenarioId = deterministicUUID('birthday-scenario-initial');

  // Budget item IDs
  const venueItemId = deterministicUUID('budget-venue-rental');
  const cateringItemId = deterministicUUID('budget-catering');
  const decorationItemId = deterministicUUID('budget-decoration');
  const photographyItemId = deterministicUUID('budget-photography');
  const entertainmentItemId = deterministicUUID('budget-entertainment');
  const invitationsItemId = deterministicUUID('budget-invitations');
  const contingencyItemId = deterministicUUID('budget-contingency');

  // Task IDs
  const taskBookVenueId = deterministicUUID('task-book-venue');
  const taskGuestListId = deterministicUUID('task-guest-list');
  const taskBookCatererId = deterministicUUID('task-book-caterer');
  const taskBookPhotographerId = deterministicUUID('task-book-photographer');
  const taskSendInvitationsId = deterministicUUID('task-send-invitations');
  const taskDecorationsId = deterministicUUID('task-arrange-decorations');
  const taskMenuTastingId = deterministicUUID('task-menu-tasting');
  const taskConfirmVendorsId = deterministicUUID('task-confirm-vendors');
  const taskTransportId = deterministicUUID('task-arrange-transport');
  const taskRehearsalId = deterministicUUID('task-final-rehearsal');

  // Vendor IDs
  const vendorCateringId = deterministicUUID('vendor-royal-feast-catering');
  const vendorPhotographyId = deterministicUUID('vendor-pixel-perfect');
  const vendorDecorationId = deterministicUUID('vendor-bloom-petal');

  // ─── Budget Items ──────────────────────────────────────────────────────────

  const budgetItems: BudgetItem[] = [
    {
      id: venueItemId,
      category: 'venue',
      name: 'Banquet & Lawn Venue Rental',
      description: 'Banquet hall and terrace lawn rental with wheelchair accessible venue facilities and step-free access',
      amountPaise: 8000000, // ₹80,000
      costType: 'fixed',
      status: 'estimated',
      depositPaise: 0,
      isGenerated: false,
      sourceNote: 'Illustrative sample data',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: cateringItemId,
      category: 'catering',
      name: 'Catering (Full Service)',
      description: 'Multi-cuisine celebratory dinner menu with vegan options and live counters',
      amountPaise: 24000000, // ₹2,40,000 (₹1,200/person × 200 guests)
      costType: 'per_person',
      unitCount: 200,
      unitRatePaise: 120000, // ₹1,200 per person
      status: 'estimated',
      depositPaise: 0,
      vendorId: vendorCateringId,
      isGenerated: false,
      sourceNote: 'Illustrative sample rate',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: decorationItemId,
      category: 'decoration',
      name: 'Decoration & Floral Arrangements',
      description: 'Themed floral installations, entrance balloon arch, and ambient lighting',
      amountPaise: 6000000, // ₹60,000
      costType: 'fixed',
      status: 'estimated',
      depositPaise: 0,
      vendorId: vendorDecorationId,
      isGenerated: false,
      sourceNote: 'Illustrative sample data',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: photographyItemId,
      category: 'photography',
      name: 'Photography & Videography',
      description: 'Professional candid photography, videography, and instant guest photobooth',
      amountPaise: 4500000, // ₹45,000
      costType: 'fixed',
      status: 'quoted',
      depositPaise: 0,
      vendorId: vendorPhotographyId,
      isGenerated: false,
      sourceNote: 'Illustrative sample data',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: entertainmentItemId,
      category: 'entertainment',
      name: 'Entertainment & Music',
      description: 'Live acoustic band for dinner and DJ for celebration dance floor',
      amountPaise: 3000000, // ₹30,000
      costType: 'fixed',
      status: 'estimated',
      depositPaise: 0,
      isGenerated: false,
      sourceNote: 'Sample estimate',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: invitationsItemId,
      category: 'invitations',
      name: 'Birthday Invitations',
      description: 'Personalized animated digital invitations and customized keepsake favors',
      amountPaise: 1500000, // ₹15,000
      costType: 'fixed',
      status: 'estimated',
      depositPaise: 0,
      isGenerated: false,
      sourceNote: 'Illustrative sample data',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: contingencyItemId,
      category: 'contingency',
      name: 'Contingency Reserve',
      description: 'Buffer for unexpected expenses',
      amountPaise: 3000000, // ₹30,000
      costType: 'fixed',
      status: 'estimated',
      depositPaise: 0,
      isGenerated: false,
      sourceNote: 'Recommended 6% safety buffer',
      createdAt,
      updatedAt: createdAt,
    },
  ];

  // ─── Preparation Tasks ─────────────────────────────────────────────────────

  const tasks: Task[] = [
    {
      id: taskBookVenueId,
      title: 'Book venue',
      description: 'Finalize and book the celebration banquet venue',
      dueDate: toISODate(addDays(eventDate, -90)),
      priority: 'critical',
      status: 'pending',
      dependencies: [],
      category: 'venue',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: taskGuestListId,
      title: 'Finalize guest list',
      description: 'Confirm attendance and finalize the 200-guest invitation list',
      dueDate: toISODate(addDays(eventDate, -75)),
      priority: 'high',
      status: 'pending',
      dependencies: [],
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: taskBookCatererId,
      title: 'Book caterer',
      description: 'Finalize catering contract with custom menu and cake design',
      dueDate: toISODate(addDays(eventDate, -60)),
      priority: 'critical',
      status: 'pending',
      dependencies: [taskGuestListId],
      category: 'catering',
      vendorId: vendorCateringId,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: taskBookPhotographerId,
      title: 'Book photographer',
      description: 'Confirm candid photography and photobooth coverage',
      dueDate: toISODate(addDays(eventDate, -60)),
      priority: 'high',
      status: 'pending',
      dependencies: [],
      category: 'photography',
      vendorId: vendorPhotographyId,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: taskSendInvitationsId,
      title: 'Send invitations',
      description: 'Distribute personalized animated invitations to all guests',
      dueDate: toISODate(addDays(eventDate, -42)),
      priority: 'high',
      status: 'pending',
      dependencies: [taskGuestListId],
      category: 'invitations',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: taskDecorationsId,
      title: 'Arrange decorations',
      description: 'Review and approve balloon installations and theme stage setup',
      dueDate: toISODate(addDays(eventDate, -30)),
      priority: 'medium',
      status: 'pending',
      dependencies: [],
      category: 'decoration',
      vendorId: vendorDecorationId,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: taskMenuTastingId,
      title: 'Menu tasting',
      description: 'Sample dinner menu items and artisan birthday cake flavors',
      dueDate: toISODate(addDays(eventDate, -21)),
      priority: 'medium',
      status: 'pending',
      dependencies: [taskBookCatererId],
      category: 'catering',
      vendorId: vendorCateringId,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: taskConfirmVendorsId,
      title: 'Confirm all vendors',
      description: 'Reconfirm delivery schedules and staff rosters with all vendors',
      dueDate: toISODate(addDays(eventDate, -14)),
      priority: 'high',
      status: 'pending',
      dependencies: [taskBookCatererId, taskBookPhotographerId, taskDecorationsId],
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: taskTransportId,
      title: 'Arrange guest transport',
      description: 'Coordinate parking access and valet logistics for guests',
      dueDate: toISODate(addDays(eventDate, -7)),
      priority: 'low',
      status: 'pending',
      dependencies: [],
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: taskRehearsalId,
      title: 'Final soundcheck & walkthrough',
      description: 'Audio soundcheck with live band, lighting test, and stage dry-run',
      dueDate: toISODate(addDays(eventDate, -1)),
      priority: 'medium',
      status: 'pending',
      dependencies: [taskConfirmVendorsId],
      createdAt,
      updatedAt: createdAt,
    },
  ];

  // ─── Vendors ───────────────────────────────────────────────────────────────

  const vendors: Vendor[] = [
    {
      id: vendorCateringId,
      name: 'Royal Feast Catering & Bakery',
      category: 'catering',
      contactName: 'Mrs. Deepa Sundaram',
      phone: '+91 98400 12345',
      quotedPricePaise: 24000000, // ₹2,40,000
      inclusions: [
        'Welcome mocktail bar',
        'Multi-cuisine buffet dinner',
        'Custom 3-tier celebration cake',
        'Service staff and tableware',
      ],
      exclusions: ['Alcoholic beverages', 'Late-night cleanup fee'],
      status: 'shortlisted',
      depositPaidPaise: 0,
      balanceDuePaise: 24000000,
      notes: 'Illustrative sample data — not a real vendor quote',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: vendorPhotographyId,
      name: 'Pixel Perfect Studios',
      category: 'photography',
      contactName: 'Mr. Arvind Raman',
      phone: '+91 98840 54321',
      quotedPricePaise: 4500000, // ₹45,000
      inclusions: [
        'Full celebration coverage (6 hours)',
        'Candid photography',
        'Highlight celebration video teaser',
        'Instant guest photobooth with props',
      ],
      exclusions: ['Raw video footage archive', 'Drone cinematography'],
      status: 'shortlisted',
      depositPaidPaise: 0,
      balanceDuePaise: 4500000,
      notes: 'Illustrative sample data — not a real vendor quote',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: vendorDecorationId,
      name: 'Bloom & Petal Decorators',
      category: 'decoration',
      contactName: 'Mr. Karthik',
      phone: '+91 98765 67890',
      quotedPricePaise: 6000000, // ₹60,000
      inclusions: [
        'Main stage themed backdrop',
        'Entrance balloon & floral arch',
        'Table floral centerpieces',
        'Warm ambient fairy lighting',
      ],
      exclusions: ['Outdoor marquee tent', 'Sound & amplifier system'],
      status: 'shortlisted',
      depositPaidPaise: 0,
      balanceDuePaise: 6000000,
      notes: 'Illustrative sample data — not a real vendor quote',
      createdAt,
      updatedAt: createdAt,
    },
  ];

  // ─── Constraints ───────────────────────────────────────────────────────────

  const constraints: Constraint[] = [
    {
      id: deterministicUUID('constraint-budget-ceiling'),
      name: 'Budget Ceiling',
      type: 'hard',
      description: 'Total projected cost must not exceed ₹5,00,000',
      field: 'budgetCeilingPaise',
      check: 'projectedTotal <= 50000000',
      isSatisfied: true,
    },
    {
      id: deterministicUUID('constraint-venue-capacity'),
      name: 'Venue Capacity',
      type: 'hard',
      description: 'Guest count must not exceed venue capacity of 300',
      field: 'guestCount',
      check: 'guestCount <= venueCapacity',
      isSatisfied: true,
    },
    {
      id: deterministicUUID('constraint-vegetarian'),
      name: 'Vegetarian Menu',
      type: 'preference',
      description: 'Menu should be primarily vegetarian with vegan options',
      field: 'preferences.dietaryRequirements',
      check: 'dietaryRequirements includes Vegetarian',
      isSatisfied: true,
    },
  ];

  // ─── Scenario ──────────────────────────────────────────────────────────────

  const scenario: Scenario = {
    id: scenarioId,
    eventId,
    status: 'approved',
    name: 'Initial Birthday Plan',
    description:
      'Baseline milestone birthday celebration plan for Ananya — all cost figures are illustrative sample data.',
    guestCount: 200,
    budgetCeilingPaise: 50000000, // ₹5,00,000
    budgetItems,
    tasks,
    vendors,
    constraints,
    changes: [],
    warnings: [],
    isFeasible: true,
    feasibilityNotes: [
      'Budget is exactly at the ceiling — no additional buffer beyond contingency.',
    ],
    createdAt,
    approvedAt: createdAt,
    version: 1,
  };

  // ─── Event ─────────────────────────────────────────────────────────────────

  const event: EventDetails = {
    id: eventId,
    name: "Ananya's Grand Birthday Celebration",
    type: 'birthday',
    status: 'planning',
    description:
      'A festive milestone birthday celebration with family, friends, live entertainment, and fine dining.',
    date: toISODate(eventDate),
    time: '18:30',
    location: 'Chennai, Tamil Nadu',
    venueCapacity: 300,
    guestCount: 200,
    budgetCeilingPaise: 50000000, // ₹5,00,000
    currency: 'INR',
    preferences: {
      culturalStyle: 'Contemporary & Heritage Fusion',
      dietaryRequirements: ['Vegetarian', 'Vegan options', 'Dessert counter'],
      priorityAreas: ['catering', 'photography', 'entertainment'],
    },
    accessibilityRequirements: [
      'Wheelchair accessible venue',
      'Sign language interpreter',
    ],
    createdAt,
    updatedAt: createdAt,
    currentScenarioId: scenarioId,
    scenarioHistory: [scenarioId],
  };

  return {
    events: [event],
    scenarios: { [scenarioId]: scenario },
  };
}
