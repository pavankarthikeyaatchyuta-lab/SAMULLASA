/**
 * Core domain types for SAMULLĀSA event planning.
 * All monetary amounts are stored in paise (1/100 INR) to avoid floating-point errors.
 */

// ─── Event Types ──────────────────────────────────────────────────────────────

export type EventType = 'wedding' | 'birthday' | 'community';

export type EventStatus = 'draft' | 'planning' | 'confirmed' | 'completed' | 'cancelled';

export interface EventDetails {
  id: string;
  name: string;
  type: EventType;
  status: EventStatus;
  description: string;
  date: string; // ISO date string
  endDate?: string;
  time?: string;
  location: string;
  venueCapacity: number;
  guestCount: number;
  budgetCeilingPaise: number; // Hard constraint
  currency: string; // e.g., 'INR'
  preferences: EventPreferences;
  accessibilityRequirements: string[];
  createdAt: string;
  updatedAt: string;
  currentScenarioId: string;
  scenarioHistory: string[]; // ordered scenario IDs
}

export interface EventPreferences {
  culturalStyle?: string; // e.g., 'South Indian', 'North Indian', 'Western', 'Fusion'
  dietaryRequirements: string[];
  theme?: string;
  colorPalette?: string[];
  musicPreference?: string;
  decorStyle?: string;
  priorityAreas: string[]; // e.g., ['catering', 'photography']
  notes?: string;
}

// ─── Budget Types ─────────────────────────────────────────────────────────────

export type BudgetCategory =
  | 'venue'
  | 'catering'
  | 'decoration'
  | 'photography'
  | 'entertainment'
  | 'transport'
  | 'equipment'
  | 'attire'
  | 'invitations'
  | 'gifts'
  | 'contingency'
  | 'other';

export type CostStatus = 'estimated' | 'quoted' | 'committed' | 'paid';

export type CostType = 'fixed' | 'per_person' | 'per_unit';

export interface BudgetItem {
  id: string;
  category: BudgetCategory;
  name: string;
  description?: string;
  amountPaise: number; // Total amount in paise
  costType: CostType;
  unitCount?: number; // For per_person or per_unit costs
  unitRatePaise?: number; // Rate per unit in paise
  status: CostStatus;
  depositPaise: number; // Deposit paid
  vendorId?: string; // Link to vendor
  isGenerated: boolean; // true if AI-generated estimate
  sourceNote?: string; // e.g., "User entered", "AI estimate", "Vendor quote"
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  ceilingPaise: number;
  projectedTotalPaise: number;
  actualSpentPaise: number; // Sum of committed + paid
  remainingPaise: number;
  contingencyPaise: number;
  categoryBreakdown: Record<BudgetCategory, number>; // paise per category
  perPersonPaise: number;
  variancePaise: number; // ceiling - projected
  isOverBudget: boolean;
  utilizationPercent: number;
}

// ─── Task Types ───────────────────────────────────────────────────────────────

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';

export interface Task {
  id: string;
  title: string;
  description?: string;
  owner?: string; // Responsible person or role
  dueDate: string; // ISO date
  priority: TaskPriority;
  status: TaskStatus;
  dependencies: string[]; // Task IDs this depends on
  category?: BudgetCategory; // Links task to budget category
  vendorId?: string; // Links task to vendor
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Vendor Types ─────────────────────────────────────────────────────────────

export type VendorStatus = 'shortlisted' | 'contacted' | 'quoted' | 'booked' | 'confirmed' | 'rejected';

export interface Vendor {
  id: string;
  name: string;
  category: BudgetCategory;
  contactName?: string;
  phone?: string;
  email?: string;
  quotedPricePaise?: number;
  inclusions: string[];
  exclusions: string[];
  status: VendorStatus;
  paymentTerms?: string;
  depositPaidPaise: number;
  balanceDuePaise: number;
  notes?: string;
  rating?: number; // User's rating 1-5
  createdAt: string;
  updatedAt: string;
}

// ─── Scenario Types ───────────────────────────────────────────────────────────

export type ScenarioStatus = 'draft' | 'proposed' | 'approved' | 'rejected';

export type ConstraintType = 'hard' | 'preference';

export interface Constraint {
  id: string;
  name: string;
  type: ConstraintType;
  description: string;
  field: string; // Which field this constrains
  check: string; // Serialized check description
  isSatisfied: boolean;
  violationMessage?: string;
}

export interface ScenarioChange {
  field: string;
  label: string;
  originalValue: string | number;
  proposedValue: string | number;
  impact: string;
}

export interface Scenario {
  id: string;
  eventId: string;
  parentScenarioId?: string; // The scenario this was based on
  status: ScenarioStatus;
  name: string;
  description?: string;
  changeRequest?: string; // Original natural language request
  guestCount: number;
  budgetCeilingPaise: number;
  budgetItems: BudgetItem[];
  tasks: Task[];
  vendors: Vendor[];
  constraints: Constraint[];
  changes: ScenarioChange[]; // Diff from parent
  warnings: string[];
  isFeasible: boolean;
  feasibilityNotes: string[];
  createdAt: string;
  approvedAt?: string;
  version: number;
}

// ─── Application State ───────────────────────────────────────────────────────

export interface AppState {
  events: EventDetails[];
  scenarios: Record<string, Scenario>; // scenarioId -> Scenario
  version: number; // For optimistic concurrency
}

// ─── AI Types ─────────────────────────────────────────────────────────────────

export interface ChangeProposal {
  description: string;
  changes: Array<{
    type: 'guest_count' | 'budget' | 'add_item' | 'remove_item' | 'modify_item' | 'preference' | 'date' | 'venue';
    field: string;
    currentValue?: string | number;
    proposedValue: string | number;
    reason: string;
  }>;
  preserveFields: string[];
  ambiguities: string[];
}

export interface AIRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  estimatedCostPaise?: number;
  rationale: string;
  isGenerated: boolean;
  tags: string[];
}
