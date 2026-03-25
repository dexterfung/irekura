# Implementation Plan: Product Ratings & Tasting Notes

**Branch**: `006-product-ratings` | **Date**: 2026-03-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-product-ratings/spec.md`

## Summary

Add product ratings (1–5 stars) and tasting notes to the consumption flow, then integrate
ratings into the recommendation engine as a flavour-score multiplier. Much of the rating
infrastructure already exists from the 002-guest-profile implementation — the schema has a
`rating` field, the `create` and `rate` mutations exist, and star rating UI components are
present in both the Recommend and History pages. The remaining work focuses on:

1. Adding `tastingNotes` to the schema and Convex mutations
2. Integrating ratings into the recommendation engine (pure function, unit-tested)
3. Adding a Convex query to fetch recent ratings per product for the engine
4. Updating the History UI to display/edit tasting notes
5. Adding product average rating display to the Inventory page
6. Adding i18n keys for new UI strings

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: Next.js 15 (App Router), Convex, NextAuth v5, Tailwind CSS v4, shadcn/ui
**Storage**: Convex (sole backend)
**Testing**: Vitest (unit tests for recommendation engine — 19 existing tests)
**Target Platform**: PWA (mobile-first, responsive)
**Project Type**: Web application (PWA)
**Performance Goals**: Rating prompt within 5 seconds of consumption log (SC-001)
**Constraints**: Offline-capable (PWA), mobile-first (44×44px touch targets)
**Scale/Scope**: Single-user personal utility with optional guest profile

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Stack Conformance | ✅ Pass | No new frameworks or dependencies required |
| II. Convex as Sole Backend | ✅ Pass | All data changes via Convex mutations/queries |
| III. Mobile-First Interface | ✅ Pass | Star rating UI uses 44×44px touch targets (already implemented) |
| IV. Pure Functional Recommendation Engine | ✅ Pass | Rating multiplier added as pure function in `lib/recommendations/engine.ts`; unit tests required |
| V. Google OAuth via NextAuth v5 | ✅ Pass | No auth changes |
| VI. Simplicity Over Engineering | ✅ Pass | Builds on existing rating infrastructure; no new abstractions |

## Project Structure

### Documentation (this feature)

```text
specs/006-product-ratings/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
convex/
├── schema.ts            # MODIFY: add tastingNotes field to consumptionLogs
├── consumption.ts       # MODIFY: add tastingNotes to create/rate; add ratingsForProducts query
└── _generated/          # Auto-generated stubs

lib/recommendations/
├── engine.ts            # MODIFY: add computeRatingMultiplier(); update computeFlavorScore()
└── engine.test.ts       # MODIFY: add rating multiplier tests

components/
├── calendar/
│   └── DayDetail.tsx    # MODIFY: add tasting notes display/edit
└── inventory/
    └── ProductCard.tsx  # MODIFY: add average rating display (or relevant inventory component)

app/(protected)/
├── history/page.tsx     # MODIFY: tasting notes in quick-log dialog
├── recommend/page.tsx   # MODIFY: add tasting notes to post-drink rating dialog
└── inventory/page.tsx   # MODIFY: pass average ratings to product cards

messages/
├── en.json              # MODIFY: add tastingNotes i18n keys
└── zh-HK.json           # MODIFY: add tastingNotes i18n keys (Traditional Chinese HK)
```

**Structure Decision**: No new directories needed. All changes extend existing files within
the established Next.js App Router + Convex structure.

## Existing Infrastructure (already implemented)

The following components from 002-guest-profile are already in place and do NOT need to be
rebuilt:

| Component | Location | What exists |
|-----------|----------|-------------|
| Rating schema field | `convex/schema.ts` | `rating: v.optional(v.number())` on `consumptionLogs` |
| Create with rating | `convex/consumption.ts` | `create` mutation accepts optional `rating` arg (1–5 validated) |
| Rate mutation | `convex/consumption.ts` | `rate` mutation updates rating on existing log (1–5 validated) |
| Star rating UI (Recommend) | `app/(protected)/recommend/page.tsx` | `RatingStars` component with hover, 44px targets |
| Star rating UI (History) | `components/calendar/DayDetail.tsx` | `StarRating` component with inline edit |
| Rating in quick-log | `app/(protected)/history/page.tsx` | Select dropdown with star display |
| i18n: star labels | `messages/en.json` | `starRating.star` with plural support |
| i18n: rating prompts | `messages/en.json` | `recommend.ratingPrompt`, `history.ratingOptional`, etc. |

## What Needs to Be Built

### 1. Schema & Backend (Convex)

- Add `tastingNotes: v.optional(v.string())` to `consumptionLogs` in `convex/schema.ts`
- Update `create` mutation to accept optional `tastingNotes` arg with 280-char validation
- Update `rate` mutation to also accept optional `tastingNotes` arg (or add separate mutation)
- Add `ratingsForProducts` query — returns recent ratings grouped by productId for the engine
- Add `averageRatingForProduct` query (or compute client-side from existing data)

### 2. Recommendation Engine

- Add `computeRatingMultiplier(averageRating: number | undefined): number` pure function
  - `undefined` → 1.0 (neutral)
  - `>= 4` → 1.2 (boost)
  - `<= 2` → 0.8 (penalty)
  - `> 2 && < 4` → 1.0 (neutral)
- Update `computeFlavorScore()` signature to accept optional `ratingMultiplier: number`
- Apply multiplier to the returned flavour score (NOT expiry score)
- Skip multiplier when mood is `"surprise-me"`
- Update `scoreAndRankBatches()` to accept product ratings map and thread through
- Add unit tests covering all multiplier scenarios

### 3. UI Changes

- **Recommend page**: Add optional tasting notes text field to post-drink rating dialog
- **History page (DayDetail)**: Display tasting notes; allow add/edit
- **History page (quick-log)**: Add optional tasting notes text input
- **Inventory page**: Display average rating per product (computed from consumption logs)
- All text inputs: 280-char limit with character count indicator

### 4. i18n

- Add `tastingNotes` keys to `messages/en.json` and `messages/zh-HK.json`
- Add `averageRating` keys for Inventory display

## Complexity Tracking

No constitution violations. No complexity tracking entries required.
