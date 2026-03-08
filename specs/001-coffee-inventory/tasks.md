# Tasks: Coffee Inventory & Smart Recommendations

**Feature**: 001-coffee-inventory | **Date**: 2026-03-03
**Input**: Design documents from `/specs/001-coffee-inventory/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no blocking dependencies within the same phase batch)
- **[US#]**: Which user story this task belongs to (US1=Inventory, US2=Recommendations, US3=History, US4=Preferences)
- Exact file paths are included in all task descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — installs dependencies, configures build tools, testing frameworks, and PWA assets. No Convex or auth code yet.

- [X] T001 Initialize Next.js 15 project at repository root with TypeScript strict mode: create package.json with all dependencies (next, react, convex, next-auth, @serwist/next, recharts, date-fns, vitest, playwright, @testing-library/react, happy-dom) and tsconfig.json with strict: true
- [X] T002 [P] Configure Tailwind CSS v4 and initialize shadcn/ui by running `npx shadcn@latest init`, generating tailwind.config.ts, components.json, and app/globals.css
- [X] T003 [P] Configure Serwist PWA: create app/sw.ts service worker source with StaleWhileRevalidate for static assets and NetworkFirst for API routes, then wrap next.config.ts with withSerwist
- [X] T004 [P] Create PWA web manifest (display: standalone, start_url: /, theme_color) and placeholder 192×192 and 512×512 maskable icons in public/manifest.json and public/icons/
- [X] T005 [P] Configure Vitest with happy-dom environment, TypeScript path aliases (@/*), and include pattern for *.test.ts files in vitest.config.ts
- [X] T006 [P] Configure Playwright with mobile (375×812) and desktop (1280×800) viewport test projects and storageState path for authenticated sessions in playwright.config.ts
- [X] T007 [P] Configure ESLint with Next.js TypeScript rules and Prettier for consistent code style in eslint.config.mjs and .prettierrc
- [X] T008 [P] Create environment variables template in .env.local.example with AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_CONVEX_URL

**Checkpoint**: All tooling configured — `npm run dev`, `npm test`, and `npm run test:e2e` commands available

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required by all user stories — Convex schema, NextAuth v5 integration, root layout, and protected route group.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Define Convex schema with products, batches, consumptionLogs, preferenceProfiles tables and all required indexes (by_user, by_product, by_user_expiry, by_user_date, by_user_type) in convex/schema.ts
- [X] T010 [P] Configure NextAuth v5 with Google provider, JWT session strategy (session: { strategy: "jwt" }), and typed Auth export in lib/auth.ts
- [X] T011 [P] Configure Convex JWT authentication to validate NextAuth tokens via JWKS endpoint (applicationID: "convex", domain: NEXTAUTH_URL) in convex/auth.config.ts
- [X] T012 [P] Create shared date utility functions (getDaysUntilExpiry, toISODateString, getDayType returning "weekday" | "weekend") using date-fns in lib/utils.ts
- [X] T013 Implement root app layout with ConvexProviderWithAuth (custom useAuth hook reading NextAuth session and returning fetchAccessToken for Convex) and SessionProvider wrapping children in app/layout.tsx
- [X] T014 [P] Implement NextAuth v5 API route handler exporting GET and POST from auth() in app/api/auth/[...nextauth]/route.ts
- [X] T015 [P] Create root redirect page: server component calling auth(), redirecting to /inventory if session exists or /auth/signin if unauthenticated in app/page.tsx
- [X] T016 [P] Create sign-in page with Irekura branding and Google OAuth button calling signIn("google") in app/auth/signin/page.tsx
- [X] T017 Implement protected route group layout: server component calling auth() and redirecting unauthenticated users to /auth/signin in app/(protected)/layout.tsx

**Checkpoint**: Foundation ready — Google sign-in → /inventory redirect works, Convex schema deployed via `npx convex dev`

---

## Phase 3: User Story 1 — Manage Coffee Inventory (Priority: P1) 🎯 MVP

**Goal**: Users can add coffee products with multiple batches, view the inventory list with expiry indicators, edit batch quantities, and delete products or individual batches.

**Independent Test**: A user can open the app, add three different coffee products with at least two batches each, view them in the inventory list with correct quantities and best-before dates, and edit or delete a batch — all without any other feature being active.

- [X] T018 [US1] Add required shadcn/ui components for inventory UI by running `npx shadcn@latest add button card badge sheet dialog separator` into components/ui/
- [X] T019 [P] [US1] Implement api.products.list, api.products.create, api.products.update, and api.products.delete (cascade-deletes all batches and consumptionLogs for the product) in convex/products.ts
- [X] T020 [P] [US1] Implement api.batches.listByProduct, api.batches.listActive (all brewsRemaining > 0 batches joined with their parent products), api.batches.create, api.batches.updateQuantity, and api.batches.delete in convex/batches.ts
- [X] T021 [P] [US1] Create ProductCard component showing product name, brand, type badge, total brews remaining (sum of active batches), earliest best-before date, and expiry-soon badge for any batch ≤30 days in components/inventory/ProductCard.tsx
- [X] T022 [P] [US1] Create BatchItem component showing brewsRemaining, bestBeforeDate, urgency badge (expired / urgent / warning / ok), depleted visual state for brewsRemaining = 0, and edit-quantity / delete action buttons in components/inventory/BatchItem.tsx
- [X] T023 [US1] Create ProductForm component with name (text input), brand (text input), type (segmented control: drip-bag / ground-bean / concentrate-capsule / instant-powder), bitterness / sourness / richness (1–5 star selectors), and optional notes textarea in components/inventory/ProductForm.tsx
- [X] T024 [US1] Create BatchForm component with brews-remaining number input (min: 1) and best-before date picker input in components/inventory/BatchForm.tsx
- [X] T025 [US1] Implement inventory overview page: useQuery(api.products.list), render ProductCard grid (two-column on desktop, single-column on mobile), and floating action button navigating to /inventory/new in app/(protected)/inventory/page.tsx
- [X] T026 [US1] Implement add-product page: render ProductForm and BatchForm, on submit call api.products.create then api.batches.create, redirect to /inventory/[productId] on success in app/(protected)/inventory/new/page.tsx
- [X] T027 [US1] Implement product detail page: product header with flavour rating chips, BatchItem list via api.batches.listByProduct, Add Batch Sheet (BatchForm + api.batches.create), Edit Product Sheet (ProductForm + api.products.update), and Delete Product confirmation Dialog (api.products.delete + redirect to /inventory) in app/(protected)/inventory/[productId]/page.tsx

**Checkpoint**: US1 complete — full inventory CRUD is functional and independently testable

---

## Phase 4: User Story 2 — Get a Daily Coffee Recommendation (Priority: P2)

**Goal**: Users select a mood and receive a ranked recommendation from active inventory with expiry urgency as tiebreaker. Accepting a recommendation logs the consumption and decrements the batch.

**Independent Test**: With at least two products in inventory (one expiring within 7 days), the user opens /recommend, selects any mood, and the near-expiry batch is recommended above a fresher similar-profile alternative.

- [X] T028 [P] [US2] Implement recommendation engine pure functions in lib/recommendations/engine.ts: export types BatchInput, ScoredBatch, Mood, FlavorProfile, DayType, and functions scoreAndRankBatches(batches: BatchInput[], profile: FlavorProfile, dayType: DayType, mood: Mood, excludeProductId?: string), computeExpiryScore, computeFlavorScore, getDefaultProfile, getDayType — the optional excludeProductId parameter is used by "Surprise Me" to filter out the most recently consumed product (pass undefined when consumption history is empty)
- [X] T029 [P] [US2] Write Vitest unit tests in lib/recommendations/engine.test.ts covering: computeExpiryScore at all threshold boundaries (expired / urgent at ≤7 days / warning at ≤30 days / ok), computeFlavorScore for all four moods, scoreAndRankBatches with expiring batch ranked above fresh, empty input returning [], depleted batch (brewsRemaining=0) exclusion, stable sort for equal scores, getDayType for Monday and Saturday, getDefaultProfile returning {bitterness:3,sourness:3,richness:3}, Surprise Me with excludeProductId set excludes that product from results, Surprise Me with excludeProductId=undefined returns results without exclusion (REQUIRED by constitution Principle IV)
- [X] T030 [P] [US2] Implement api.consumptionLogs.create mutation (atomically creates log entry and decrements batch brewsRemaining, throws BATCH_DEPLETED if already 0 or FUTURE_DATE if date is after today) and api.consumptionLogs.listRecent query returning productId strings most-recent first in convex/consumption.ts
- [X] T031 [P] [US2] Create MoodSelector component with four mood buttons (Light & Bright, Strong & Rich, Smooth & Balanced, Surprise Me) that highlights the selected mood and calls an onSelect(mood) callback in components/recommendation/MoodSelector.tsx
- [X] T032 [US2] Create RecommendationCard component displaying product name, brand, type, flavour bars (bitterness / sourness / richness 1–5), brews remaining, best-before date, expiry urgency badge, Drink This button, and Show Another link in components/recommendation/RecommendationCard.tsx
- [X] T033 [US2] Implement recommendation page: useQuery(api.batches.listActive) + useQuery(api.consumptionLogs.listRecent, { limit: 10 }), run scoreAndRankBatches client-side on mood change, track currentIndex for Show Another cycling, call api.consumptionLogs.create on Drink This followed by optional rating dialog, display empty-state CTA when no active batches in app/(protected)/recommend/page.tsx

**Checkpoint**: US2 complete — recommendations work end-to-end including engine unit tests passing (`npm test`)

---

## Phase 5: User Story 3 — Log Consumption and Rate Coffees (Priority: P3)

**Goal**: Users view a consumption history calendar, tap days to see log details and ratings, manually log past consumption, and add or update ratings on any log entry.

**Independent Test**: With a populated inventory, the user manually logs a consumption for yesterday (selecting product and batch), gives it 3 stars, then opens /history to verify yesterday is marked and the batch quantity decreased by 1.

- [X] T034 [P] [US3] Add api.consumptionLogs.listByMonth query (returns logs joined with parent products for a given year and 1-indexed month, filtered by userId) and api.consumptionLogs.rate mutation (adds or updates rating 1–5 on an existing log) to convex/consumption.ts
- [X] T035 [P] [US3] Create MonthlyCalendar component (desktop ≥640px): 7-column month grid built with date-fns (startOfMonth, getDaysInMonth, getDay), filled dot indicators on days with consumption entries, prev/next month navigation arrows, and Today shortcut button in components/calendar/MonthlyCalendar.tsx
- [X] T036 [P] [US3] Create WeeklyStrip component (mobile <640px): 7-day row for current week built with date-fns (startOfWeek, addDays), filled dot indicators on consumed days, prev/next week chevrons, and Today shortcut button in components/calendar/WeeklyStrip.tsx
- [X] T037 [US3] Create DayDetail component: bottom Sheet on mobile / side panel on desktop listing all consumption log entries for the selected day (product name, batch best-before date, star rating display with inline edit action calling api.consumptionLogs.rate) in components/calendar/DayDetail.tsx
- [X] T038 [US3] Implement consumption history page: responsive calendar (WeeklyStrip on <640px, MonthlyCalendar on ≥640px) with useQuery(api.consumptionLogs.listByMonth), DayDetail panel on day tap, FAB and quick-log dialog (product dropdown, batch dropdown, date picker, optional 1–5 star rating) calling api.consumptionLogs.create in app/(protected)/history/page.tsx

**Checkpoint**: US3 complete — consumption calendar, manual logging, and rating all functional

---

## Phase 6: User Story 4 — Configure Personal Preference Profiles (Priority: P4)

**Goal**: Users configure weekday and weekend flavour importance profiles (bitterness / sourness / richness 1–5) that the recommendation engine uses to weight scores. Changes take effect immediately on the next recommendation.

**Independent Test**: The user sets the weekday profile to bitterness=5, sourness=1, richness=3, then on a weekday requests a recommendation — the highest-bitterness product in inventory is recommended above alternatives.

- [X] T039 [P] [US4] Implement api.preferenceProfiles.get query (returns Doc<"preferenceProfiles"> or null for "weekday" | "weekend" type) and api.preferenceProfiles.upsert mutation (creates or replaces profile atomically, throws INVALID_WEIGHT if any value outside 1–5) in convex/preferences.ts
- [X] T040 [P] [US4] Add Slider and Tabs shadcn/ui components to components/ui/ by running `npx shadcn@latest add slider tabs`
- [X] T041 [P] [US4] Create FlavorRadarChart component with "use client" directive using Recharts RadarChart (PolarGrid, PolarAngleAxis, Radar) rendering bitterness, sourness, richness axes from a FlavorProfile prop in components/preferences/FlavorRadarChart.tsx
- [X] T042 [US4] Create ProfileForm component with three Slider inputs (bitterness, sourness, richness each 1–5), live FlavorRadarChart preview that updates in real time as sliders change, and Save button calling an onSave(profile) callback in components/preferences/ProfileForm.tsx
- [X] T043 [US4] Implement preferences page with Weekday / Weekend Tabs: each tab loads its profile via useQuery(api.preferenceProfiles.get, { type }), renders ProfileForm initialised with current values or defaults (3/3/3 if null), saves via useMutation(api.preferenceProfiles.upsert) on Save in app/(protected)/preferences/page.tsx

**Checkpoint**: US4 complete — preference profiles save independently per day type and immediately influence recommendations

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Navigation, loading states, E2E tests, PWA validation, and final quality gates

- [X] T044 Add mobile-first bottom navigation bar (icons + labels for /inventory, /recommend, /history, /preferences) to the protected route group layout in app/(protected)/layout.tsx
- [X] T045 [P] Add Suspense boundaries with skeleton shimmer loading states for all four protected pages in app/(protected)/inventory/page.tsx, app/(protected)/recommend/page.tsx, app/(protected)/history/page.tsx, and app/(protected)/preferences/page.tsx
- [X] T046 [P] Write Playwright E2E tests for US1: add product with two batches, verify inventory list with expiry indicator, edit batch quantity, delete batch in tests/e2e/inventory.spec.ts
- [X] T047 [P] Write Playwright E2E tests for US2: mood selection, recommendation card display, Show Another cycling, Drink This creating a log, empty inventory state in tests/e2e/recommendation.spec.ts
- [X] T048 [P] Write Playwright E2E tests for US3: manual consumption log, calendar day marked, day detail with rating, add rating to existing log in tests/e2e/history.spec.ts
- [X] T049 [P] Write Playwright E2E tests for US4: set weekday slider values, verify radar chart updates, save profile, confirm recommendation changes reflect new weights in tests/e2e/preferences.spec.ts
- [X] T050 Validate PWA install flow: verify service worker registration via DevTools Application panel, correct manifest icons, and standalone display mode at 390×844px (iPhone 14) viewport in Chrome and Safari
- [X] T051 [P] Run ESLint and Prettier across all source files and fix any violations (`npm run lint`)
- [X] T052 [P] Run TypeScript strict mode compilation check across all files and fix all type errors (`npx tsc --noEmit`)
- [X] T053 Run full quickstart.md walkthrough against local dev server, validating all four user story paths end-to-end, and fix any issues found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately. T002–T008 can all run in parallel after T001.
- **Phase 2 (Foundational)**: Depends on Phase 1. T010–T012 run in parallel after T009. T013 requires T010 + T011. T014–T016 run in parallel after T013. T017 requires T013.
- **Phase 3 (US1)**: Depends on Phase 2. T019–T022 run in parallel alongside T018. T023 + T024 require T018. T025 requires T019 + T021. T026 requires T019 + T020 + T023 + T024. T027 requires T019 + T020 + T021 + T022 + T024.
- **Phase 4 (US2)**: Depends on Phase 2 + T020 (batches.listActive). T028–T031 run in parallel. T032 requires T028. T033 requires T028 + T030 + T031 + T032. Note: runtime testing requires US1 data.
- **Phase 5 (US3)**: Depends on Phase 2 + T030 (consumptionLogs.create). T035 + T036 run in parallel after T034. T037 requires T035 + T036. T038 requires T034 + T035 + T036 + T037.
- **Phase 6 (US4)**: Depends on Phase 2 only. T039–T041 run in parallel. T042 requires T040 + T041. T043 requires T039 + T042.
- **Phase 7 (Polish)**: Depends on all user story phases. T046–T049 run in parallel. T051 + T052 run in parallel.

### User Story Runtime Dependencies

- **US1 (P1)**: No runtime dependency on other stories.
- **US2 (P2)**: Requires US1 data (products + batches) for runtime testing. Implementation depends on T020 (batches.listActive in convex/batches.ts).
- **US3 (P3)**: Requires US1 + US2 for meaningful runtime testing (needs consumption logs). Implementation depends on T030 (consumptionLogs.create in convex/consumption.ts).
- **US4 (P4)**: Implementation-independent. Preference profiles personalise US2 recommendations but US4 is buildable without US2.

---

## Parallel Execution Examples

### Phase 4 (US2 — 4 tasks in parallel):
```
Parallel batch:
  T028 — lib/recommendations/engine.ts
  T029 — lib/recommendations/engine.test.ts
  T030 — convex/consumption.ts (create + listRecent)
  T031 — components/recommendation/MoodSelector.tsx

Then sequential:
  T032 — components/recommendation/RecommendationCard.tsx
  T033 — app/(protected)/recommend/page.tsx
```

### Phase 3 (US1 — largest phase, two parallel batches):
```
Parallel batch 1:
  T018 — add shadcn/ui components (button, card, badge, sheet, dialog, separator)
  T019 — convex/products.ts
  T020 — convex/batches.ts
  T021 — components/inventory/ProductCard.tsx
  T022 — components/inventory/BatchItem.tsx

Parallel batch 2 (after batch 1):
  T023 — components/inventory/ProductForm.tsx
  T024 — components/inventory/BatchForm.tsx

Sequential (after batch 2):
  T025 — app/(protected)/inventory/page.tsx
  T026 — app/(protected)/inventory/new/page.tsx
  T027 — app/(protected)/inventory/[productId]/page.tsx
```

### Phase 2 (Foundational — two parallel groups):
```
T009 first (schema must be defined before all others)

Parallel group A (after T009):
  T010 — lib/auth.ts
  T011 — convex/auth.config.ts
  T012 — lib/utils.ts

T013 sequential (requires T010 + T011)

Parallel group B (after T013):
  T014 — app/api/auth/[...nextauth]/route.ts
  T015 — app/page.tsx
  T016 — app/auth/signin/page.tsx

T017 sequential (requires T013)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T008)
2. Complete Phase 2: Foundational (T009–T017) — CRITICAL: blocks all stories
3. Complete Phase 3: User Story 1 (T018–T027)
4. **STOP AND VALIDATE**: Sign in with Google, add 3 products with 2 batches each, edit quantities, check expiry indicators, delete a batch
5. Deploy to Vercel preview — this is a shippable MVP

### Incremental Delivery

1. **Foundation**: Phase 1 + Phase 2 → auth works, Convex connected
2. **MVP (US1)**: Phase 3 → inventory management functional → deploy
3. **Core value (US2)**: Phase 4 → recommendations live; run `npm test` — unit tests **MUST** pass → deploy
4. **History (US3)**: Phase 5 → consumption calendar and manual logging → deploy
5. **Personalization (US4)**: Phase 6 → preference profiles influencing recommendations → deploy
6. **Polish**: Phase 7 → E2E tests, navigation, PWA validation, TypeScript/lint quality gates

### Single Developer Recommended Order

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

---

## Notes

- `[P]` tasks operate on different files with no blocking dependencies — safe to run in parallel within the same batch
- `[US#]` labels trace each task to its user story for independent delivery tracking
- Recommendation engine unit tests (T029) are **REQUIRED** by constitution Principle IV — `npm test` must pass before US2 is complete
- `api.batches.listActive` is implemented in T020 (within US1's convex/batches.ts) because it belongs to the batches module, but it is first consumed by US2's recommendation page (T033)
- Convex real-time subscriptions are automatic via `useQuery` — no polling setup required
- Every Convex function must call `ctx.auth.getUserIdentity()` and throw `ConvexError("Unauthenticated")` if identity is absent
- Run `npm run lint && npx tsc --noEmit` after completing each phase to catch issues early
- Commit after each task or logical group of related tasks
