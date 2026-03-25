# Data Model: Product Ratings & Tasting Notes

**Feature**: 006-product-ratings
**Date**: 2026-03-25

## Modified Entities

### consumptionLogs (existing table — 1 field added)

| Field | Type | Status | Validation | Notes |
|-------|------|--------|------------|-------|
| userId | string | existing | — | User identity subject |
| productId | id("products") | existing | — | Foreign key to products |
| batchId | id("batches") | existing | — | Foreign key to batches |
| date | string | existing | — | "YYYY-MM-DD" format |
| rating | optional(number) | existing | 1–5 integer | Already implemented |
| loggedFor | optional("self" \| "guest") | existing | — | Already implemented |
| **tastingNotes** | **optional(string)** | **NEW** | **max 280 chars** | **Free-text tasting note** |

**Indexes** (unchanged):
- `by_user_date`: `["userId", "date"]`
- `by_user`: `["userId"]`

### No New Tables

All data fits within the existing `consumptionLogs` table.

## Computed Values (not stored)

### Product Rating Score

- **Computation**: Average of the last 5 ratings for a given productId by a specific person
  (filtered by `loggedFor` when guest profile is relevant)
- **Source**: `consumptionLogs` rows where `rating` is not null, ordered by date descending,
  limited to 5
- **Used by**: Recommendation engine (`computeRatingMultiplier()`)
- **Not persisted**: Computed on-demand via Convex query

### Product Average Rating (display)

- **Computation**: Average of ALL ratings for a given productId by the current person
- **Source**: `consumptionLogs` rows where `rating` is not null for the given productId
- **Used by**: Inventory/product detail UI
- **Not persisted**: Computed on-demand via Convex query

## New Convex Queries

### `consumption.ratingsForProducts`

Returns a map of `productId → averageOfLast5Ratings` for the current user (or guest).
Used by the recommendation page to pass rating data into the engine.

**Args**:
- `forGuest: v.optional(v.boolean())` — if true, filters by `loggedFor === "guest"`

**Returns**: `Record<string, number>` — productId to average rating (last 5)

### `consumption.averageRatings`

Returns a map of `productId → averageRating` across ALL rated consumption logs for the
current user (or guest). Used by the Inventory page for display.

**Args**:
- `forGuest: v.optional(v.boolean())`

**Returns**: `Record<string, { average: number; count: number }>` — productId to average + count

## Modified Convex Mutations

### `consumption.create` (existing — extend)

Add optional `tastingNotes: v.optional(v.string())` arg. Validate max 280 chars.
Persist alongside existing fields.

### `consumption.rate` (existing — extend)

Add optional `tastingNotes: v.optional(v.string())` arg. When provided, patch both
`rating` and `tastingNotes`. When only `rating` provided, only patch `rating`.
Validate max 280 chars.

## Engine Interface Changes

### New function: `computeRatingMultiplier`

```
Input:  averageRating: number | undefined
Output: number (multiplier)

Rules:
  undefined → 1.0
  >= 4      → 1.2
  <= 2      → 0.8
  otherwise → 1.0
```

### Modified function: `computeFlavorScore`

New optional parameter: `ratingMultiplier?: number`
- When mood is `"surprise-me"`: ignore multiplier, return score as-is
- Otherwise: return `score * (ratingMultiplier ?? 1.0)`

### Modified function: `scoreAndRankBatches`

New optional parameter: `productRatings?: Record<string, number>`
- For each batch, look up `productRatings[batch.productId]`
- Compute multiplier via `computeRatingMultiplier()`
- Pass to `computeFlavorScore()`

## State Transitions

Ratings and tasting notes have no state machine — they are simple optional fields that can
be set, updated, or left empty at any time. No lifecycle constraints beyond validation.
