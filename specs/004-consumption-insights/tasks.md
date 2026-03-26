# Tasks: Consumption Insights & Analytics

**Input**: Design documents from `/specs/004-consumption-insights/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)

---

## Phase 1: Setup

**Purpose**: Add i18n keys and shared infrastructure for all insight views.

- [ ] T001 [P] Add insights i18n keys to `messages/en.json` — nav.insights, insights section (pageTitle, emptyTitle, emptyDescription, thisWeek, thisMonth, vsLastWeek, vsLastMonth, streak, streakDays, topProduct, cups, timeRange7d, timeRange30d, timeRange3m, timeRangeAll, productBreakdown, totalCups, percentage, lastConsumed, sortByCups, sortByRecent, flavourProfile, currentPeriod, previousPeriod, wasteRate, wastePercentage, notEnoughData, batchesExpired, filterAll, filterYou)
- [ ] T002 [P] Add insights i18n keys to `messages/zh-HK.json` — Traditional Chinese HK equivalents for all keys added in T001
- [ ] T003 Add "Insights" nav item to `components/BottomNav.tsx` — add 5th nav item with href `/insights`, icon (BarChart3 from lucide-react), and label from `nav.insights` i18n key
- [ ] T004 Add "Insights" nav item to `components/DesktopSideNav.tsx` — add matching nav entry for desktop side navigation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure aggregation functions, Convex queries, and shared utilities that MUST be complete before any UI story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 Create `lib/insights/aggregations.ts` with `filterByPerson` pure function — takes consumption logs array and person filter ("all" | "self" | "guest"), returns filtered logs based on `loggedFor` field
- [ ] T006 Create `convex/insights.ts` with `allConsumptionLogs` query — returns all consumption logs for the authenticated user (all fields); no args needed
- [ ] T007 [P] Add `allBatches` query to `convex/insights.ts` — returns all batches for the authenticated user (all fields); no args needed
- [ ] T008 [P] Add unit tests for `filterByPerson` in `lib/insights/aggregations.test.ts` — test filtering by "all", "self", "guest" with mixed log data

**Checkpoint**: Backend queries and shared utilities ready — all UI stories can now proceed.

---

## Phase 3: User Story 1 — Overview Dashboard (Priority: P1) 🎯 MVP

**Goal**: Users see a snapshot of their coffee habits — this-week/month cup counts with period comparison, consecutive-day streak, and top product of the month.

**Independent Test**: Open Insights page → verify summary cards show correct this-week count, this-month count, comparison deltas, streak, and top product name.

- [ ] T009 [US1] Add `computeStreak` pure function to `lib/insights/aggregations.ts` — takes sorted date strings array and today's date string, returns number of consecutive days counting backward from today with at least one log
- [ ] T010 [US1] Add `computeSummary` pure function to `lib/insights/aggregations.ts` — takes consumption logs array, products array, and today's date string; returns ConsumptionSummary object (thisWeekCount, lastWeekCount, thisMonthCount, lastMonthCount, currentStreak, topProductId, topProductName, topProductCount)
- [ ] T011 [P] [US1] Add unit tests for `computeStreak` and `computeSummary` in `lib/insights/aggregations.test.ts` — test streak with consecutive days, gaps, zero logs; test summary counts, period comparison, top product selection
- [ ] T012 [US1] Create `app/(protected)/insights/page.tsx` — Insights page shell with "use client", fetches data from `api.insights.allConsumptionLogs` and `api.products.list`, applies guest filter via `filterByPerson`, computes summary via `computeSummary`, renders SummaryCards component; includes guest filter toggle (All/You/Guest) when guest profile is enabled
- [ ] T013 [US1] Create `components/insights/SummaryCards.tsx` — displays 4 summary cards: this-week cups (with vs-last-week delta), this-month cups (with vs-last-month delta), current streak in days, top product name with cup count; shows empty state when no data; hides comparison when prior period has no data

**Checkpoint**: Insights page accessible via nav, summary dashboard functional.

---

## Phase 4: User Story 2 — Consumption Trends Chart (Priority: P2)

**Goal**: Users view a bar chart of consumption over time with selectable time ranges (7d, 30d, 3m, all time). Stacked bars when guest profile is active.

**Independent Test**: Open Insights → scroll to trends chart → switch time ranges → verify bar counts match actual consumption. Enable guest → verify stacked bars.

- [ ] T014 [US2] Add `computeTrendData` pure function to `lib/insights/aggregations.ts` — takes consumption logs array, time range ("7d" | "30d" | "3m" | "all"), and today's date string; returns ConsumptionTrendPoint[] with label, date, selfCount, guestCount, totalCount; aggregates daily for 7d/30d, weekly for 3m, monthly for all time
- [ ] T015 [P] [US2] Add unit tests for `computeTrendData` in `lib/insights/aggregations.test.ts` — test all four time ranges, verify correct aggregation granularity, zero-fill for days with no data, self/guest split
- [ ] T016 [US2] Create `components/insights/ConsumptionChart.tsx` — Recharts BarChart wrapped in ResponsiveContainer; time range selector (segmented control or button group); stacked bars (self/guest) when guest profile enabled; single bars when guest disabled; proper axis labels and tooltips; uses i18n for all labels
- [ ] T017 [US2] Integrate ConsumptionChart into `app/(protected)/insights/page.tsx` — pass filtered logs and guest state; place below SummaryCards

**Checkpoint**: Trends chart renders with time range switching and guest stacking.

---

## Phase 5: User Story 3 — Product Breakdown (Priority: P3)

**Goal**: Users see a donut chart of consumption share by product and a sortable table of products with total cups, percentage, and last consumed date.

**Independent Test**: Open Insights → scroll to product breakdown → verify donut segments and table match actual consumption data. Sort table by count and recency.

- [ ] T018 [US3] Add `computeProductBreakdown` pure function to `lib/insights/aggregations.ts` — takes consumption logs array and products array; returns ProductBreakdownEntry[] sorted by totalCups descending (productId, productName, brand, totalCups, percentage, lastConsumedDate); handles deleted products by omitting them
- [ ] T019 [P] [US3] Add unit tests for `computeProductBreakdown` in `lib/insights/aggregations.test.ts` — test percentage calculation, sorting, deleted product handling, single product case
- [ ] T020 [US3] Create `components/insights/ProductBreakdown.tsx` — Recharts PieChart (donut) with product segments + color coding; sortable table below with columns: product name, total cups, percentage, last consumed date; sort toggle between cups (default) and recency; uses i18n for all labels
- [ ] T021 [US3] Integrate ProductBreakdown into `app/(protected)/insights/page.tsx` — pass filtered logs, products; place below ConsumptionChart

**Checkpoint**: Product breakdown donut chart and sortable table functional.

---

## Phase 6: User Story 4 — Flavour Profile Over Time (Priority: P4)

**Goal**: Users view a radar chart showing average flavour profile (bitterness, sourness, richness) for the current month, with previous month overlay for comparison.

**Independent Test**: Open Insights → scroll to flavour radar → verify axes match consumed products' average profile. Check previous month overlay appears when data exists.

- [ ] T022 [US4] Add `computeFlavourSnapshot` pure function to `lib/insights/aggregations.ts` — takes consumption logs array, products array, and date range (start, end); returns FlavourSnapshot (weighted average bitterness, sourness, richness based on consumption frequency, plus cupCount); weights each product's profile by the number of cups consumed in the period
- [ ] T023 [P] [US4] Add unit tests for `computeFlavourSnapshot` in `lib/insights/aggregations.test.ts` — test weighted averaging across products, single product case, empty period returns null
- [ ] T024 [US4] Create `components/insights/FlavourRadar.tsx` — Recharts RadarChart with 3 axes (bitterness, sourness, richness on 1-5 scale); current month filled shape; previous month semi-transparent overlay; legend distinguishing current vs previous; no overlay when previous month has no data; uses i18n for axis labels
- [ ] T025 [US4] Integrate FlavourRadar into `app/(protected)/insights/page.tsx` — compute current and previous month snapshots from filtered logs; pass to FlavourRadar; place below ProductBreakdown

**Checkpoint**: Flavour radar chart renders with period comparison.

---

## Phase 7: User Story 5 — Expiry Waste Rate (Priority: P5)

**Goal**: Users see what percentage of their batches expired with brews still remaining.

**Independent Test**: Create batches — some fully consumed, some expired with remaining brews. Open Insights → scroll to waste rate → verify percentage is accurate.

- [ ] T026 [US5] Add `computeWasteStats` pure function to `lib/insights/aggregations.ts` — takes batches array and today's date string; returns WasteStats (totalCompletedOrExpired, expiredWithRemaining, wastePercentage, hasEnoughData); a batch is "expired with waste" if bestBeforeDate < today AND brewsRemaining > 0; a batch is "completed or expired" if brewsRemaining === 0 OR bestBeforeDate < today
- [ ] T027 [P] [US5] Add unit tests for `computeWasteStats` in `lib/insights/aggregations.test.ts` — test with mixed batches, no expired batches (0%), all wasted batches (100%), no completed/expired batches (hasEnoughData = false)
- [ ] T028 [US5] Create `components/insights/WasteRate.tsx` — displays waste percentage as a prominent stat with context text (e.g. "3 of 10 batches"); shows "Not enough data yet" when hasEnoughData is false; uses i18n for all labels
- [ ] T029 [US5] Integrate WasteRate into `app/(protected)/insights/page.tsx` — fetch batches via `api.insights.allBatches`; compute waste stats; pass to WasteRate; place at bottom of page

**Checkpoint**: All user stories complete. Full insights page functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup.

- [ ] T030 Run `npm test` — verify all existing tests (34) + new aggregation tests pass
- [ ] T031 Run `npx tsc --noEmit` — verify no TypeScript errors
- [ ] T032 Run `npm run lint` — verify no lint errors
- [ ] T033 Run quickstart.md verification checklist — manually validate all items

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — dashboard shell and summary cards
- **US2 (Phase 4)**: Depends on Foundational + US1 T012 (page shell) — trends chart
- **US3 (Phase 5)**: Depends on Foundational + US1 T012 (page shell) — product breakdown
- **US4 (Phase 6)**: Depends on Foundational + US1 T012 (page shell) — flavour radar
- **US5 (Phase 7)**: Depends on Foundational + US1 T012 (page shell) — waste rate
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — creates the page shell; must be first
- **US2 (P2)**: After US1 T012 — can run in parallel with US3/US4/US5
- **US3 (P3)**: After US1 T012 — can run in parallel with US2/US4/US5
- **US4 (P4)**: After US1 T012 — can run in parallel with US2/US3/US5
- **US5 (P5)**: After US1 T012 — can run in parallel with US2/US3/US4

### Parallel Opportunities

- T001 and T002 (i18n keys) can run in parallel
- T006 and T007 (Convex queries) can run in parallel
- T008 (filterByPerson tests) can run in parallel with T006/T007
- After US1 creates the page shell, US2–US5 pure function + test tasks can all run in parallel
- Within each US: pure function tests [P] can run in parallel with other US pure function work

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup (i18n keys + nav items)
2. Complete Phase 2: Foundational (queries + filterByPerson)
3. Complete Phase 3: US1 — Summary dashboard with nav
4. **STOP and VALIDATE**: Insights tab accessible, summary cards show correct data
5. Deploy if ready

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 → Summary dashboard → Deploy (MVP!)
3. US2 → Trends chart added → Deploy
4. US3 → Product breakdown added → Deploy
5. US4 → Flavour radar added → Deploy
6. US5 → Waste rate added → Deploy
7. Each story adds a new section to the scrollable page without breaking prior sections

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Recharts is already installed — no dependency changes needed
- No schema changes — all data from existing tables
- Pure aggregation functions follow the `lib/recommendations/engine.ts` pattern
- Constitution requires unit tests for pure functions (Principle IV pattern)
- Total: 33 tasks (4 setup, 4 foundational, 5 US1, 4 US2, 4 US3, 4 US4, 4 US5, 4 polish)
