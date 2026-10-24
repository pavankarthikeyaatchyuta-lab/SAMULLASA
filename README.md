# SAMULLĀSA (समुल्लास) — Adaptive Celebration & Event Planner

> **Adaptive Celebration & Event Planner**  
> *"A GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas."*

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/pavankarthikeyaatchyuta-lab/SAMULLASA)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0_Strict-blue)](https://github.com/pavankarthikeyaatchyuta-lab/SAMULLASA)
[![Tests](https://img.shields.io/badge/tests-40%20passing-success)](https://github.com/pavankarthikeyaatchyuta-lab/SAMULLASA)
[![Repo Size](https://img.shields.io/badge/repo%20size-%3C%201%20MB-informational)](https://github.com/pavankarthikeyaatchyuta-lab/SAMULLASA)

---

## 🌟 Product Overview & Core Promise

**Plan the celebration. Understand every trade-off. Adapt without losing control.**

**SAMULLĀSA** is an adaptive celebration-planning workspace designed for weddings, birthdays, and community gatherings. Rather than a static dashboard or generic chatbot, SAMULLĀSA features the **Adaptive Event Intelligence Engine**—a dual-layer architecture separating generative AI creativity from deterministic constraint logic:

1. **Generative AI Layer:** Interprets natural-language requests, generates culturally resonant celebration themes, and personalizes recommendations. Supports Google Gemini models (configured to `gemini-3.8-flash` via `GEMINI_MODEL`), with strict schema validation and an automatic, high-performance deterministic fallback parser when external API keys are missing or offline.
2. **Deterministic Application Logic:** Executes financial arithmetic in integer paise (zero floating-point error), validates hard physical constraints (venue capacity, budget ceilings, mandatory accessibility), manages directed acyclic dependency graphs, and enforces atomic version history with instant rollback.

---

## 📋 Challenge Requirements Traceability Matrix

| Requirement | Implementation in SAMULLĀSA | Verified Module / Route |
|---|---|---|
| **1. Weddings, birthdays & community events** | Multi-step Event Wizard with event-specific templates, cultural preferences (South Indian, North Indian, Fusion), and dietary/accessibility presets. | `/events/new`, `/events`, [`src/lib/sample-data.ts`](src/lib/sample-data.ts) |
| **2. Event budget management** | Budget Studio with 12 structured categories, per-person vs fixed costing, deposit tracking, remaining buffer, and variance calculation. Zero floating-point arithmetic. | `/budget`, [`src/lib/budget-engine.ts`](src/lib/budget-engine.ts) |
| **3. Actionable preparation timeline** | Chronological timeline with task dependencies, critical priority flags, overdue tracking, and automated circular dependency cycle detection. | `/timeline`, [`src/lib/constraint-engine.ts`](src/lib/constraint-engine.ts) |
| **4. Vendor checklists & quotations** | Vendor Workspace tracking quotations, inclusions, exclusions, contact info, deposit paid, balance due, and contract payment terms. | `/vendors` |
| **5. Personalized event ideas** | Cultural style-aware, dietary-aware, and accessibility-aware creative recommendations with cost estimates. | `/api/ai/recommend` |
| **6. Dynamic plan adaptation** | **Adaptive Event Intelligence Engine**: Parses natural-language changes, recalculates transitive dependencies, enforces hard constraints, compares scenarios, synthesizes evaluated recovery options, and manages rollback. | `/scenarios`, [`src/lib/scenario-engine.ts`](src/lib/scenario-engine.ts) |

---

## ⚡ The Adaptive Event Intelligence Engine

### How it Works:
1. **Natural-Language Interpretation:** Extracts intended changes (e.g., guest count, budget targets) while strictly preserving protected requirements (e.g., catering quality, accessibility). Returns source metadata (`gemini-${model}`, `deterministic-fallback`, or `deterministic-local`).
2. **Hard Constraint Enforcement:** Evaluates hard constraints (budget ceiling, venue capacity, date validity, mandatory accessibility) vs soft preferences (contingency reserves, photography recommendations). **Hard constraints can never be silently bypassed.**
3. **Transitive Dependency Recalculation:** When guest count changes, catering unit totals, dependent booking tasks, and vendor contracts automatically recalculate without manual re-entry.
4. **Deterministic Recovery Options (Alternative-Plan Semantics):** If a proposal causes an over-budget or over-capacity violation, the engine synthesizes evaluated recovery options with explicit classification:
   - **Option 1 (Discretionary Optimization):** Attempts to fit within the original budget ceiling and guest count by trimming non-priority discretionary items while strictly protecting prioritized categories (e.g., catering and photography). If discretionary cuts cannot cover the deficit, **it is explicitly marked Infeasible with the remaining deficit disclosed** and cannot be approved.
   - **Option 2 (Budget Ceiling Relaxation):** Preserves full catering quality and accommodations for all guests, but **explicitly discloses the required budget increase (+₹96,000.00)** and requires explicit host confirmation to relax the ceiling constraint.
   - **Option 3 (Guest Target Adjustment):** Strictly honors the original budget ceiling and food quality per person, but **explicitly discloses the required guest count reduction (-80 guests)** and requires explicit host confirmation to adjust the guest target.
5. **Transactional Approval & Rollback:** Scenario approval atomically updates the active event baseline, records the modified constraint values, and creates an immutable snapshot. Users can roll back to any prior version at any time.

---

## 🛠 Tech Stack & Repository Metrics

- **Framework:** Next.js 16.4.2 (App Router, Turbopack, React 19)
- **Language:** TypeScript 5.7 (Strict Mode, 0 compile errors)
- **Styling & Design System:** Tailwind CSS v4 with custom warm ivory (`#FFFDF7`), deep plum (`#4A1D6A`), and gold (`#B8860B`) design tokens
- **Test Framework:** Vitest 5 with 40 automated tests across 6 test suites
- **DOM Workflow Testing:** React Testing Library + jsdom for simulated DOM component interactions
- **State Management:** React Context + useReducer with LocalStorage persistence, defensive corruption recovery, and optimistic versioning (no claim of cloud synchronization or distributed ACID transactions)
- **Repository Size:** **228.5 KiB** git objects (measured via `git count-objects -vH`), well below the 10 MB challenge limit

---

## 🔒 Security & AI Configuration

### Environment Variables
Create a `.env.local` file in the root directory:

```env
# Optional: External LLM Integration (default model: gemini-3.8-flash)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```

### Security Controls Implemented
- **Zero Client Secret Exposure:** API keys are accessed strictly in server route handlers via `process.env`. No keys are prefixed with `NEXT_PUBLIC_` or bundled into client assets.
- **Runtime Zod Schema Validation:** Both `/api/ai/interpret` and `/api/ai/recommend` validate all incoming client payloads and parse external LLM outputs against strict Zod schemas before application ingestion.
- **Controlled Timeouts:** 6,000 ms `AbortController` timeout on external API requests with timer handles reliably cleared in `finally` blocks.
- **Safe Fallback Mode:** When credentials are not configured or external API calls fail, the application gracefully operates in high-performance local deterministic mode without disclosing stack traces or crashing.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24.13.0)
- npm 9+ (tested on npm 11.21.0)

### Installation
```bash
git clone https://github.com/pavankarthikeyaatchyuta-lab/SAMULLASA.git
cd SAMULLASA
npm install --legacy-peer-deps
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Automated Tests
```bash
npm run test
```

### Production Build & Linting
```bash
npm run type-check   # TypeScript strict verification (0 errors)
npm run lint         # ESLint check (0 errors, 0 warnings)
npm run build        # Production Next.js build (Turbopack)
npm run start        # Run production server
```

---

## 🧪 Reproducible Benchmark Walkthrough

To verify the core intelligence engine against the primary challenge benchmark:

1. Open the application at [http://localhost:3000](http://localhost:3000).
2. If empty, click **"Load Benchmark Wedding (₹5L / 200 Guests)"** on the dashboard.
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
   - **Recovery Options are displayed:**
     - **Option 1:** Labeled `Infeasible (Deficit Remains)` with unmovable priority categories protected and ₹51,000 deficit shown; approval is disabled.
     - **Option 2:** Labeled `Requires Host Approval (Relaxation)` disclosing original ceiling (₹5,00,000), proposed ceiling (₹5,96,000), and exact increase (+₹96,000).
     - **Option 3:** Labeled `Requires Host Approval (Relaxation)` disclosing original guests (280), proposed guests (200), and reduction (-80).
7. Click **"Approve Option 2 (Confirm Relaxation)"**.
8. Observe that the event baseline is atomically updated to ₹5,96,000 ceiling with 280 guests, recorded in Version History as an immutable snapshot.
9. Click **"Restore This Version"** on Version 1 to test instant deterministic rollback.

---

## 🌐 Live Deployment Status

- **Live URL:** [https://samullasa.vercel.app](https://samullasa.vercel.app)
- **Hosting Target:** Deployed on Vercel with automatic CI/CD from the `main` branch.
- **Build Readiness:** Production build (`npm run build`) compiles cleanly and generates optimized static pages with Turbopack.

---

## 📄 License & Integrity Statement

SAMULLĀSA is built with high engineering rigor. All financial calculations, constraint validations, and rollback mechanisms are executed deterministically in application code with full automated test assertions.
