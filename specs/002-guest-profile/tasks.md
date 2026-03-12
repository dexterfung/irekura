# Tasks: Guest Profile

**Input**: Design documents from `/specs/002-guest-profile/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup

**Purpose**: Add i18n keys for all new guest UI strings upfront so every subsequent task can use them.

- [X] T001 [P] Add guest profile i18n keys to `messages/en.json` (guestProfile section: toggle label, display name label, enableGuest, disableGuest, loggingFor, you, attributionYou, filterAll, filterYou, personSwitcher labels)
- [X] T002 [P] Add guest profile i18n keys to `messages/zh-HK.json` (Traditional Chinese HK equivalents for all keys added in T001)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema and Convex backend changes that MUST be complete before any UI story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Extend `convex/schema.ts` — add optional fields `guestEnabled: v.optional(v.boolean())`, `guestId: v.optional(v.string())`, `guestDisplayName: v.optional(v.string())` to the `userSettings` table definition
- [X] T004 Extend `convex/schema.ts` — add optional field `loggedFor: v.optional(v.union(v.literal("self"), v.literal("guest")))` to the `consumptionLogs` table definition (T003 must complete first as both edits are in the same file)
- [X] T005 Add `getGuestSettings` query and `setGuestEnabled` mutation to `convex/settings.ts` — `getGuestSettings` returns `{ guestEnabled, guestId, guestDisplayName }` from `userSettings`; `setGuestEnabled` toggles `guestEnabled` and, on first enable, writes a stable `guestId` of format `"guest:{identity.subject}"` if not already present
- [X] T006 Add `setGuestDisplayName` mutation to `convex/settings.ts` — validates name is non-empty and ≤50 chars, patches `guestDisplayName` on the user's `userSettings` row (T005 must complete first)
- [X] T007 [P] Add `getForGuest` query to `convex/preferences.ts` — takes `type: "weekday" | "weekend"`, looks up the guest's `preferenceProfiles` row using the caller's `guestId` from `userSettings`; returns profile or null
- [X] T008 [P] Add `upsertForGuest` mutation to `convex/preferences.ts` — same args as existing `upsert`; reads caller's `guestId` from `userSettings` and upserts a `preferenceProfiles` row keyed by `guestId` with the same 1–5 validation
- [X] T009 Update `consumption.create` mutation in `convex/consumption.ts` — add optional `loggedFor: v.optional(v.union(v.literal("self"), v.literal("guest")))` arg (defaults to `"self"`) and persist it on the inserted `consumptionLogs` row
- [X] T010 Update `consumption.listByMonth` query in `convex/consumption.ts` — include `loggedFor` field in the returned log objects alongside existing fields
- [X] T011 Add `listRecentForGuest` query to `convex/consumption.ts` — same logic as existing `listRecent` but filters `consumptionLogs` rows where `loggedFor === "guest"` for the caller's userId; returns array of productIds

**Checkpoint**: Backend ready — all UI stories can now proceed.

---

## Phase 3: User Story 1 — Enable Guest Profile (Priority: P1) 🎯 MVP

**Goal**: User can enable/disable the single guest slot and set a display name in Preferences. The guest slot persists across sessions.

**Independent Test**: Enable guest in Preferences with name "Alex" → save → reload page → guest name still shows and toggle is on. Disable → reload → toggle is off.

- [X] T012 [US1] Create `components/preferences/GuestProfileSection.tsx` — client component that renders: an enable/disable toggle (shadcn Switch), a display name Input (shown when enabled), and a Save button; calls `setGuestEnabled` and `setGuestDisplayName` mutations; reads from `getGuestSettings` query; shows inline saving/saved states
- [X] T013 [US1] Add "Guest Profile" section to `app/(protected)/preferences/page.tsx` — import and render `<GuestProfileSection />` between the Appearance section and the Flavour Preferences section; use i18n keys from T001/T002 for the section heading

**Checkpoint**: User Story 1 complete — guest enable/disable and display name fully functional.

---

## Phase 4: User Story 2 — Log Coffee on Behalf of Guest (Priority: P1)

**Goal**: When guest is enabled, the Log Coffee flow shows a "Logging for" toggle (You / GuestName) and records the attribution on the consumption log.

**Independent Test**: With guest enabled: open Log Coffee → select product and batch → select "Alex" in the toggle → confirm → check History for today → entry shows "Alex" badge. Log again selecting "You" → second entry shows "You" badge.

- [X] T014 [US2] Add `loggedFor` state (`"self" | "guest"`) and a "Logging for" segmented toggle (two Button variants side by side: "You" and guest display name) to `components/history/LogCoffeeSheet.tsx` — toggle only renders when `guestEnabled` is `true` (read from `getGuestSettings` query); pass `loggedFor` value to the existing `consumption.create` call

**Checkpoint**: User Story 2 complete — guest log attribution fully functional.

---

## Phase 5: User Story 3 — Guest Flavour Preferences & Recommendations (Priority: P2)

**Goal**: Guest has their own flavour preferences editable in Preferences. The Recommend page has a person switcher; selecting Guest uses the guest's preferences for ranking.

**Independent Test**: Set guest bitterness importance to 5, sourness to 1. Switch to guest on Recommend. Verify top recommendations differ from "You" view and favour high-bitterness products.

- [X] T015 [US3] Add guest flavour preference sliders to `components/preferences/GuestProfileSection.tsx` — below the display name input (only when guest is enabled), render the existing `ProfileForm` component twice (weekday / weekend) wired to `getForGuest` and `upsertForGuest` instead of the main account's `get`/`upsert`; reuse the existing save/unsaved-changes pattern
- [X] T016 [US3] Add person switcher state (`"self" | "guest"`) to `app/(protected)/recommend/page.tsx` — render a two-option toggle ("You" / guest display name) at the top of the page, only when `guestEnabled` is true; when "guest" is selected, fetch preferences via `getForGuest` (weekday/weekend) and recent product IDs via `listRecentForGuest` instead of the main account equivalents; pass them to `scoreAndRankBatches` as normal

**Checkpoint**: User Story 3 complete — guest recommendations fully functional.

---

## Phase 6: User Story 4 — History with Guest Attribution (Priority: P2)

**Goal**: History entries show who consumed each item. A filter allows viewing only self or only guest entries.

**Independent Test**: With mixed self+guest entries logged: open History → verify each entry has a "You" or guest-name badge → tap the guest filter pill → only guest entries remain → tap All → all return.

- [X] T017 [US4] Add attribution badge to log entries in `components/calendar/DayDetail.tsx` — for each consumption log entry, read the `loggedFor` field returned by `listByMonth`; render a small Badge: "You" in primary/default variant when `"self"` (or absent), guest display name in secondary variant when `"guest"`; badge only renders when `guestEnabled` is true
- [X] T018 [US4] Add person filter pills to `app/(protected)/history/page.tsx` — render three filter pills (All / You / GuestName) above the calendar, only when `guestEnabled` is true; store selected filter in local state; pass filter value down to `DayDetail` to show/hide entries (or filter the logs array before passing); "All" is the default

**Checkpoint**: User Story 4 complete — history attribution and filtering fully functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T019 [P] Add unit tests for recommendation engine guest passthrough in `lib/recommendations/engine.test.ts` — verify that `scoreAndRankBatches` produces different rankings when called with a guest `FlavorProfile` vs. main account profile (same batches, different preference weights); tests must be pure and pass without any Convex/network dependency
- [X] T020 [P] Verify mobile touch targets — open each new guest UI element (toggle in Preferences, "Logging for" toggle in Log Coffee, person switcher in Recommend, filter pills in History) on a 390px viewport and confirm all interactive elements meet 44×44px minimum
- [X] T021 Run `npm test && npm run lint` and fix any TypeScript or ESLint errors introduced by the new Convex function signatures and React components

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — T001 and T002 can start immediately and run in parallel
- **Phase 2 (Foundational)**: No dependency on Phase 1 (different files) — T003→T004 sequential (same file); T005→T006 sequential (same file); T007 and T008 parallel with each other; T009, T010, T011 sequential in same file
- **Phases 3–6 (User Stories)**: All depend on Phase 2 completion
- **Phase 7 (Polish)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on other stories
- **US2 (P1)**: Can start after Phase 2 — no dependency on US1 (different component)
- **US3 (P2)**: T015 depends on US1 completing (adds to GuestProfileSection); T016 independent of US1/US2
- **US4 (P2)**: T017/T018 independent of US1–US3

### Parallel Opportunities

- T001 and T002 (i18n files) — parallel
- T007 and T008 (preferences Convex functions) — parallel
- T015 and T016 (US3 tasks) — parallel
- T017 and T018 (US4 tasks) — parallel
- T019 and T020 (polish) — parallel

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1 (T001, T002) — i18n keys
2. Complete Phase 2 (T003–T011) — backend
3. Complete Phase 3 (T012, T013) — guest enable/disable UI
4. Complete Phase 4 (T014) — log for guest
5. **STOP and VALIDATE**: Full Quickstart scenarios 1 and 2 should pass
6. Deploy/demo if ready

### Incremental Delivery

1. Phases 1–2 → Backend complete
2. Phase 3 → Guest enable/disable works
3. Phase 4 → Log coffee for guest works (MVP!)
4. Phase 5 → Guest recommendations work
5. Phase 6 → History attribution works
6. Phase 7 → Polish and tests

---

## Notes

- [P] tasks = different files, no dependencies between them
- [Story] label maps each task to a specific user story for traceability
- `GuestProfileSection` is the central new component; US1 creates it, US3 extends it — plan for US3 before finalising US1 component boundaries
- No new npm packages required — all UI components already exist in shadcn/ui
- Existing `consumption.create` callers (LogCoffeeSheet) pass no `loggedFor` arg and will default to `"self"` — backward compatible
- Existing history entries without `loggedFor` are treated as `"self"` throughout the UI
