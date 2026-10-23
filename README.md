# SAMULLĀSA (समुल्लास) — Adaptive Celebration & Event Planner

> **PromptWars Virtual — Challenge 5: Celebration & Event Planner**  
> *"Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas."*

---

## 🌟 Product Overview & Core Promise

**Plan the celebration. Understand every trade-off. Adapt without losing control.**

**SAMULLĀSA** is an adaptive celebration-planning workspace designed for weddings, birthdays, and community gatherings. Rather than a static dashboard or generic chatbot, SAMULLĀSA features the **Adaptive Event Intelligence Engine**—a dual-layer architecture separating generative AI creativity from deterministic constraint logic:

1. **Generative AI:** Interprets natural-language requests, generates culturally resonant celebration themes, and explains planning trade-offs.
2. **Deterministic Application Logic:** Executes financial arithmetic in integer paise (zero floating-point error), validates hard physical constraints (venue capacity, budget ceilings, mandatory accessibility), manages directed acyclic dependency graphs, and enforces atomic version history with rollback.

---

## 📋 Official Requirement-to-Feature Mapping

| Requirement | Implementation in SAMULLĀSA | Verification Route / Module |
|---|---|---|
| **1. Weddings, birthdays & community events** | Multi-step Event Wizard with event-specific templates, cultural preferences (South Indian, North Indian, Fusion), and dietary/accessibility presets. | `/events/new`, `/events`, `src/lib/sample-data.ts` |
| **2. Event budget management** | Budget Studio with 12 structured categories, per-person vs fixed costing, deposit tracking, remaining buffer, and variance calculation. Zero floating-point arithmetic. | `/budget`, `src/lib/budget-engine.ts` |
| **3. Actionable preparation timeline** | Chronological timeline with task dependencies, critical priority flags, overdue tracking, and automated circular dependency cycle detection. | `/timeline`, `src/lib/constraint-engine.ts` |
| **4. Vendor checklists & quotations** | Vendor Workspace tracking quotations, inclusions, exclusions, contact info, deposit paid, balance due, and contract payment terms. | `/vendors` |
| **5. Personalized event ideas** | Cultural style-aware, dietary-aware, and accessibility-aware creative recommendations with cost estimates. | `/api/ai/recommend` |
| **6. Dynamic plan adaptation** | **Adaptive Event Intelligence Engine**: Parses natural-language changes, recalculates transitive dependencies, enforces hard constraints, compares scenarios, synthesizes alternatives, and manages rollback. | `/scenarios`, `src/lib/scenario-engine.ts` |

---

## ⚡ The Adaptive Event Intelligence Engine

### How it Works:
1. **Natural-Language Interpretation:** Extracts intended changes (e.g., guest count, budget targets) while strictly preserving protected requirements (e.g., catering quality, accessibility). Falls back seamlessly to deterministic regex parsing if no external API key is configured.
2. **Constraint Enforcement:** Evaluates hard constraints (budget ceiling, venue capacity, date validity, mandatory accessibility) vs soft preferences (contingency reserves, photography recommendations). **Hard constraints can never be silently bypassed.**
3. **Transitive Dependency Recalculation:** When guest count changes, catering unit totals, dependent booking tasks, and vendor contracts automatically recalculate without manual re-entry.
4. **Feasible Alternatives Synthesis:** If a proposal causes an over-budget or over-capacity violation, the engine automatically synthesizes up to 3 feasible ranked alternatives (e.g. trimming non-priority categories, increasing ceiling with buffer, or adjusting guest counts).
5. **Transactional Approval & Rollback:** Scenario approval atomically updates the event baseline and creates an immutable snapshot. Users can roll back to any prior version at any time.

---

## 🛠 Tech Stack & Repository Metrics

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5 (Strict Mode, 0 compile errors)
- **Styling & Design System:** Tailwind CSS v4 with custom warm ivory (`#FFFDF7`), deep plum (`#4A1D6A`), and gold (`#B8860B`) design tokens
- **Test Framework:** Vitest 5 with automated unit, integration, and E2E scenario suites
- **State Management:** React Context + useReducer with LocalStorage persistence and optimistic versioning
- **Repository Size:** **0.68 MB** (well below the 10 MB challenge limit)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24.13.0)
- npm 9+ (tested on npm 11.21.0)

### Installation
```bash
git clone <repository-url>
cd samullasa
npm install --legacy-peer-deps
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests
```bash
npm run test
```

### Production Build & Linting
```bash
npm run type-check   # Type verification (0 errors)
npm run lint         # ESLint check (0 errors)
npm run build        # Production Next.js build
npm run start        # Run production server
```

---

## 🧪 Reproducible Benchmark Walkthrough

To verify the core intelligence engine against the challenge benchmark:

1. Open the application at [http://localhost:3000](http://localhost:3000).
2. If empty, click **"Load Sample Wedding (₹5L / 200 Guests)"** on the dashboard.
3. Navigate to **Adaptive Engine** (`/scenarios`).
4. Click the preset prompt:
   > *"Increase the wedding guest count to 280, keep the budget unchanged, preserve accessibility requirements and don't reduce catering quality."*
5. Click **⚡ Simulate & Detect Impact**.
6. **Observe Result:**
   - Guest count increases to 280.
   - Catering expenses deterministically recalculate from ₹2,40,000 to ₹3,36,000 (+₹96,000).
   - Total projected budget reaches ₹5,96,000, breaching the ₹5,00,000 ceiling.
   - Hard constraint engine flags **"⚠ Hard Constraints Violated — Plan Is Infeasible"**.
   - Direct approval button is safely disabled.
   - 3 Ranked Feasible Alternatives are automatically synthesized.
   - Selecting **"Approve Option 2 (Increase budget)"** approves the feasible plan atomically and logs it in the version history.
   - You can click **"Restore This Version"** on Version 1 to instantly roll back.
