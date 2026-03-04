# Implementation Plan: Coffee Inventory & Smart Recommendations

**Branch**: `001-coffee-inventory` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-coffee-inventory/spec.md`

## Summary

Build Irekura — a mobile-first PWA for personal coffee inventory management with smart
daily recommendations. Users manage products (drip bags, ground beans, concentrate
capsules, instant powder sachets) across multiple purchase batches (each with brews
remaining + best-before date). A pure-function recommendation engine scores batches by
expiry urgency and mood-matched flavour profile (weekday/weekend preferences). Consumption
is logged, rated, and visualised in a dual-view calendar (monthly on desktop, weekly
strip on mobile).

**Technical approach**: Next.js 15 App Router + TypeScript strict mode (frontend + SSR);
Convex (sole backend, real-time subscriptions); NextAuth v5 Google OAuth; Tailwind CSS v4 +
shadcn/ui (accessible UI); Serwist (PWA); Vitest (unit tests); Playwright (E2E);
Recharts (radar chart); deployed to Vercel.

## Technical Context

**Language/Version**: TypeScript 5.7 / Node.js LTS 22
**Primary Dependencies**: Next.js 15, Convex, NextAuth v5, Tailwind CSS v4, shadcn/ui,
  Serwist (@serwist/next), Recharts, Vitest, Playwright, date-fns
**Storage**: Convex (tables: products, batches, consumptionLogs, preferenceProfiles)
**Testing**: Vitest 2.x (unit), Playwright 1.4x (E2E)
**Target Platform**: Web PWA — Vercel (primary); installable on iOS/Android via browser
**Project Type**: PWA web application (Next.js App Router, mobile-first)
**Performance Goals**: Recommendation renders in <2 s; calendar month loads in <2 s
**Constraints**: Mobile-first (≥375 px viewport); 44×44 px minimum touch targets;
  app-shell cached by Serwist service worker; strict TypeScript; ESLint + Prettier must pass
**Scale/Scope**: Single user; ~100 products max; years of consumption history

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Stack Conformance | ✅ Pass (with justifications) | Core stack (Next.js, Convex, NextAuth v5, Tailwind v4, Vercel) is fully compliant. Additional packages (shadcn/ui, Serwist, Vitest, Playwright, Recharts) require Complexity Tracking entries — all have immediate, concrete justifications. |
| II. Convex as Sole Backend | ✅ Pass | All data access through Convex queries/mutations. No `route.ts` data handlers. No secondary databases. |
| III. Mobile-First Interface | ✅ Pass | Base styles target ≤640 px. Weekly strip on mobile, monthly calendar on desktop as progressive enhancement. 44×44 px touch targets enforced via shadcn/ui + Tailwind utilities. |
| IV. Pure Functional Recommendation Engine | ✅ Pass | Engine in `lib/recommendations/engine.ts` — pure functions, no Convex/Next.js dependencies, Vitest unit tests mandatory. |
| V. Google OAuth via NextAuth v5 | ✅ Pass | NextAuth v5 with Google provider only. JWT strategy. Server-side session checks via `auth()` in protected layout. |
| VI. Simplicity Over Engineering | ✅ Pass | Every non-constitution dependency has an immediate current need (see Complexity Tracking below). No speculative abstractions. Custom calendar built with date-fns (no new library). |

**Post-design re-check**: All Phase 1 contracts confirmed compliant. Convex schema contains
no relations bypassing Convex. All server actions use `auth()` for user isolation.

## Project Structure

### Documentation (this feature)

```text
specs/001-coffee-inventory/
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions
├── data-model.md        # Phase 1: Convex schema + entity rules
├── quickstart.md        # Phase 1: end-to-end validation walkthrough
├── checklists/
│   └── requirements.md  # Spec quality validation (all pass)
├── contracts/
│   ├── convex-functions.md      # Convex query/mutation signatures
│   ├── recommendation-engine.md # Pure function interfaces + test requirements
│   └── ui-routes.md             # Next.js App Router route contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/
├── layout.tsx                          # Root layout: ConvexProvider, SessionProvider
├── page.tsx                            # Redirects: /inventory (authed) or /auth/signin
├── api/
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts               # NextAuth v5 route handler
├── auth/
│   └── signin/
│       └── page.tsx                   # Sign-in page (Google OAuth button)
└── (protected)/                       # Route group requiring auth session
    ├── layout.tsx                     # Auth guard: auth() → redirect if unauthenticated
    ├── inventory/
    │   ├── page.tsx                   # Inventory overview (product list)
    │   ├── new/
    │   │   └── page.tsx               # Add new product + first batch
    │   └── [productId]/
    │       └── page.tsx               # Product detail + batch management
    ├── recommend/
    │   └── page.tsx                   # Mood selector + recommendation card
    ├── history/
    │   └── page.tsx                   # Calendar: monthly (desktop) / weekly strip (mobile)
    └── preferences/
        └── page.tsx                   # Weekday/weekend preference profile editor

components/
├── ui/                                # shadcn/ui copied components (Button, Card, etc.)
├── inventory/
│   ├── ProductCard.tsx                # Product summary with batch count and expiry badge
│   ├── BatchItem.tsx                  # Batch row: brews, best-before, edit/delete controls
│   ├── ProductForm.tsx                # Add/edit product form
│   └── BatchForm.tsx                  # Add/edit batch form
├── recommendation/
│   ├── MoodSelector.tsx               # 4-button mood picker
│   └── RecommendationCard.tsx         # Recommendation display + Drink/Skip actions
├── calendar/
│   ├── MonthlyCalendar.tsx            # Desktop: 7-column grid, month navigation
│   ├── WeeklyStrip.tsx                # Mobile: 7-day strip, week navigation
│   └── DayDetail.tsx                  # Consumption log detail (sheet/side-panel)
└── preferences/
    ├── ProfileForm.tsx                # Bitterness/sourness/richness sliders
    └── FlavorRadarChart.tsx           # Recharts RadarChart ("use client")

convex/
├── schema.ts                          # Convex table schema (see data-model.md)
├── auth.config.ts                     # NextAuth JWT validation config
├── _generated/                        # Auto-generated by Convex CLI (do not edit)
├── products.ts                        # products: list, create, update, delete
├── batches.ts                         # batches: listByProduct, listActive, create,
│                                      #          updateQuantity, delete
├── consumption.ts                     # consumptionLogs: listByMonth, listRecent,
│                                      #                  create, rate
└── preferences.ts                     # preferenceProfiles: get, upsert

lib/
├── auth.ts                            # NextAuth v5 config (Google provider, JWT strategy)
├── recommendations/
│   ├── engine.ts                      # Pure scoring functions (no I/O, no side effects)
│   └── engine.test.ts                 # Vitest unit tests (REQUIRED by Principle IV)
└── utils.ts                           # Shared date helpers (uses date-fns)

public/
├── manifest.json                      # PWA manifest
├── sw.js                              # Service worker (built by Serwist from app/sw.ts)
└── icons/                             # PWA icons: 192×192, 512×512, maskable

app/
└── sw.ts                              # Serwist service worker source

tests/
└── e2e/                               # Playwright E2E tests
    ├── inventory.spec.ts
    ├── recommendation.spec.ts
    ├── history.spec.ts
    └── preferences.spec.ts

vitest.config.ts                       # Vitest config (happy-dom, path aliases)
playwright.config.ts                   # Playwright config (mobile + desktop viewports)
next.config.ts                         # Next.js config (Serwist wrapper)
```

**Structure Decision**: Single Next.js 15 App Router project at repository root. Convex
functions live in `convex/` (Convex CLI convention). Pure library code in `lib/`. Tests
split between co-located unit tests (`*.test.ts` alongside source) and `tests/e2e/` for
Playwright E2E.

## Complexity Tracking

> Principle I violations requiring justification (packages outside the original constitution stack)

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| `@serwist/next` (PWA service worker) | PWA functionality is a core requirement — the app must be installable and serve a cached app shell | Manual Workbox config is significantly more complex (Principle VI); `next-pwa` is unmaintained |
| `@radix-ui/*` + `clsx` + `tailwind-merge` + `class-variance-authority` (via shadcn/ui) | Accessible dialogs, drawers, sliders, and focus management for mobile-first UX require Radix primitives | Hand-rolling accessible modal and slider components from scratch would take weeks and is error-prone; Principle III requires 44×44 px touch targets and ARIA compliance |
| `recharts` | Radar chart (3-axis: bitterness/sourness/richness) is required for the preference profile visualisation | No simpler way to render a multi-axis radar chart; building SVG from scratch violates Principle VI |
| `vitest` + `@testing-library/react` + `@testing-library/user-event` + `happy-dom` | Unit tests are REQUIRED by constitution Principle IV for the recommendation engine | No alternative — Principle IV explicitly mandates unit tests; Vitest is the simplest viable test runner for a TypeScript/Next.js project |
| `playwright` | E2E tests for the four user story flows; user explicitly requested; complexity of PWA flows (service worker, mobile viewport, auth) warrants it | Cypress lacks native mobile viewport emulation and service worker support |
