# Tasks: Product Ratings & Tasting Notes

**Input**: Design documents from `/specs/006-product-ratings/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup

**Purpose**: Add i18n keys for all new UI strings upfront so every subsequent task can use them.

- [ ] T001 [P] Add tasting notes and average rating i18n keys to `messages/en.json` (tastingNotes section: placeholder, charCount, label, save; averageRating section: label, outOf, noRatings)
- [ ] T002 [P] Add tasting notes and average rating i18n keys to `messages/zh-HK.json` (Traditional Chinese HK equivalents for all keys added in T001)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema and Convex backend changes that MUST be complete before any UI story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Extend `convex/schema.ts` — add optional field `tastingNotes: v.optional(v.string())` to the `consumptionLogs` table definition
- [ ] T004 Update `consumption.create` mutation in `convex/consumption.ts` — add optional `tastingNotes: v.optional(v.string())` arg with 280-character validation; persist alongside existing fields
- [ ] T005 Update `consumption.rate` mutation in `convex/consumption.ts` — add optional `tastingNotes: v.optional(v.string())` arg with 280-character validation; when provided, patch `tastingNotes` alongside `rating`
- [ ] T006 Add `ratingsForProducts` query to `convex/consumption.ts` — takes optional `forGuest: v.optional(v.boolean())`; returns `Record<string, number>` mapping productId to the average of the last 5 ratings for each product by the current user (filtered by `loggedFor` when forGuest is true); products with no ratings are omitted from the result
- [ ] T007 [P] Add `averageRatings` query to `convex/consumption.ts` — takes optional `forGuest: v.optional(v.boolean())`; returns `Record<string, { average: number; count: number }>` mapping productId to the average rating and count across ALL rated consumption logs for the current user (or guest); products with no ratings are omitted

**Checkpoint**: Backend ready — all UI stories can now proceed.

---

## Phase 3: User Story 1 — Rate a Coffee After Consumption (Priority: P1) 🎯 MVP

**Goal**: User can rate coffees 1–5 stars after consumption. Ratings are persisted per consumption log entry and visible in History.

**Independent Test**: Log a coffee → rating prompt appears → rate 4 stars → check History page → entry shows 4 stars. Skip rating on next log → no rating shown.

- [ ] T008 [US1] Update the post-drink rating dialog in `app/(protected)/recommend/page.tsx` — add an optional tasting notes text input (max 280 chars with character count indicator) below the existing star rating; pass `tastingNotes` to `api.consumption.rate` when saving
- [ ] T009 [US1] Update the quick-log dialog in `app/(protected)/history/page.tsx` — add an optional tasting notes text input (max 280 chars with character count indicator) alongside the existing rating selector; pass `tastingNotes` to `api.consumption.create` when creating
- [ ] T010 [US1] Update `components/calendar/DayDetail.tsx` — display `tastingNotes` below each consumption log entry; add a tap-to-edit interaction that opens a text input to add or update tasting notes via `api.consumption.rate`

**Checkpoint**: Rating and tasting notes capture flow complete end-to-end.

---

## Phase 4: User Story 2 — Ratings Improve Recommendations (Priority: P1) 🎯 MVP

**Goal**: The recommendation engine factors in the user's past ratings to boost or penalize products, making recommendations improve over time.

**Independent Test**: Rate Product A 5 stars ×3, Product B 2 stars ×3 (similar flavour profiles). Request recommendation with matching mood → Product A recommended first.

- [ ] T011 [US2] Add `computeRatingMultiplier` pure function to `lib/recommendations/engine.ts` — accepts `averageRating: number | undefined`, returns multiplier: `undefined` → 1.0, `>= 4` → 1.2, `<= 2` → 0.8, otherwise → 1.0
- [ ] T012 [US2] Update `computeFlavorScore` in `lib/recommendations/engine.ts` — add optional `ratingMultiplier?: number` parameter; when mood is NOT `"surprise-me"`, multiply the computed flavour score by `(ratingMultiplier ?? 1.0)` before returning; when mood IS `"surprise-me"`, ignore the multiplier entirely
- [ ] T013 [US2] Update `scoreAndRankBatches` in `lib/recommendations/engine.ts` — add optional `productRatings?: Record<string, number>` parameter; for each batch, look up `productRatings[batch.productId]`, compute multiplier via `computeRatingMultiplier()`, and pass it to `computeFlavorScore()`; update `ScoredBatch` type if needed
- [ ] T014 [US2] Add unit tests for rating multiplier in `lib/recommendations/engine.test.ts` — test `computeRatingMultiplier` (undefined→1.0, 5→1.2, 1→0.8, 3→1.0); test `computeFlavorScore` with multiplier for non-surprise moods; test that surprise-me ignores multiplier; test `scoreAndRankBatches` with productRatings map boosts high-rated product above unrated equivalent
- [ ] T015 [US2] Update `app/(protected)/recommend/page.tsx` — call `ratingsForProducts` query (with `forGuest` flag when guest is active); pass the resulting ratings map to `scoreAndRankBatches()`

**Checkpoint**: Recommendations now reflect user's rating history. Existing 19 tests + new tests all pass.

---

## Phase 5: User Story 3 — Add Tasting Notes (Priority: P2)

**Goal**: Users can capture free-text tasting notes alongside ratings. Notes are visible in History.

**Independent Test**: Log a coffee → add note "Smooth, slight chocolate finish" → check History → note displayed below entry.

Note: The tasting notes backend (T003–T005) and UI integration (T008–T010) were already implemented in Phases 2–3. This phase handles any remaining tasting-notes-specific polish.

- [ ] T016 [US3] Update `convex/consumption.ts` `listByMonth` query — ensure the returned log objects include the `tastingNotes` field alongside existing fields (verify the field is surfaced to the frontend)

**Checkpoint**: Tasting notes fully visible and editable in History.

---

## Phase 6: User Story 4 — View Product Average Rating (Priority: P3)

**Goal**: Products in the Inventory show their average rating (across all consumption entries for the current person).

**Independent Test**: Rate a product 3, 4, 5 stars on 3 occasions → view product in Inventory → average rating of 4.0 displayed. Unrated product shows no rating.

- [ ] T017 [US4] Update `app/(protected)/inventory/page.tsx` — call `averageRatings` query (with `forGuest` flag when guest is active); pass the average rating data to product card components
- [ ] T018 [US4] Update the product card component (identify the correct component in `components/inventory/` or inline in the inventory page) — display average rating as stars (e.g. "★★★★☆ 4.0") next to the product name/details; show nothing for unrated products (FR-011); when guest profile is enabled, show the selected person's average only

**Checkpoint**: All user stories complete. Products show average ratings in Inventory.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup.

- [ ] T019 Run `npm test` — verify all existing tests (19) + new rating multiplier tests pass
- [ ] T020 Run `npx tsc --noEmit` — verify no TypeScript errors
- [ ] T021 Run `npm run lint` — verify no lint errors
- [ ] T022 Run quickstart.md verification checklist — manually validate all 11 items

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — rating/notes capture UI
- **US2 (Phase 4)**: Depends on Foundational — engine integration (can run in parallel with US1)
- **US3 (Phase 5)**: Depends on Foundational + T010 from US1 — tasting notes display
- **US4 (Phase 6)**: Depends on Foundational + T007 — average rating display
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependencies on other stories
- **US2 (P1)**: After Foundational — no dependencies on other stories (**can run in parallel with US1**)
- **US3 (P2)**: After Foundational + US1 T010 (tasting notes display in DayDetail)
- **US4 (P3)**: After Foundational — no dependencies on other stories (**can run in parallel with US1/US2**)

### Parallel Opportunities

- T001 and T002 (i18n keys) can run in parallel
- T006 and T007 (queries) can run in parallel
- US1 and US2 can run in parallel (different files: UI vs engine)
- US4 can run in parallel with US1/US2 (different files: inventory vs recommend/history)

---

## Parallel Example: User Story 2

```bash
# T011 and first part of T014 can be written together (function + its tests):
Task: "Add computeRatingMultiplier to lib/recommendations/engine.ts"
Task: "Add unit tests for computeRatingMultiplier in lib/recommendations/engine.test.ts"

# After T011-T013 complete, T014 (remaining tests) and T015 (UI wiring) can proceed in parallel:
Task: "Complete unit tests in lib/recommendations/engine.test.ts"
Task: "Update recommend/page.tsx to pass ratings to engine"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (i18n keys)
2. Complete Phase 2: Foundational (schema + backend)
3. Complete Phase 3: US1 — Rating/notes capture in UI
4. Complete Phase 4: US2 — Engine integration + tests
5. **STOP and VALIDATE**: Ratings captured and affecting recommendations
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Backend ready
2. US1 → Ratings/notes flow works end-to-end → Deploy (MVP!)
3. US2 → Recommendations improve with ratings → Deploy
4. US3 → Tasting notes polish → Deploy
5. US4 → Average ratings in Inventory → Deploy
6. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Much infrastructure already exists from feature 002 — tasks focus on what's NEW
- Constitution requires unit tests for all recommendation engine functions (Principle IV)
- Total: 22 tasks (2 setup, 5 foundational, 3 US1, 5 US2, 1 US3, 2 US4, 4 polish)
