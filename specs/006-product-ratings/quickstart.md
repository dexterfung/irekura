# Quickstart: Product Ratings & Tasting Notes

**Feature**: 006-product-ratings
**Date**: 2026-03-25

## Prerequisites

- Node.js LTS 22
- npm
- Convex CLI (`npx convex dev`)
- `.env.local` configured (see `.env.local.example`)

## Setup

```bash
# Install dependencies (if not already done)
npm install

# Start Convex dev server (generates types, applies schema changes)
npx convex dev

# In a separate terminal, start Next.js dev server
npm run dev
```

## What's Changing

### Schema

One new field added to `consumptionLogs`:
- `tastingNotes: v.optional(v.string())` — max 280 characters

Run `npx convex dev` to apply the schema change. No data migration needed — the field is
optional and existing logs remain valid without it.

### Recommendation Engine

The pure recommendation engine (`lib/recommendations/engine.ts`) gains rating awareness:
- New `computeRatingMultiplier()` function
- `computeFlavorScore()` accepts an optional rating multiplier
- `scoreAndRankBatches()` accepts an optional product ratings map

### Unit Tests

Run tests to verify engine changes:

```bash
npm test
```

Expected: all existing 19 tests pass + new rating multiplier tests pass.

### Type Checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

## Verification Checklist

1. [ ] `npx convex dev` runs without errors (schema applied)
2. [ ] `npm test` — all tests pass (existing + new)
3. [ ] `npx tsc --noEmit` — no type errors
4. [ ] `npm run lint` — no lint errors
5. [ ] Log a coffee on Recommend page → rating prompt appears → rate and add note → visible in History
6. [ ] Rate a past entry from History → rating saved → tasting note editable
7. [ ] Product in Inventory shows average rating (after ≥1 rated consumption)
8. [ ] Product with no ratings shows no rating indicator in Inventory
9. [ ] High-rated product appears higher in recommendations than unrated equivalent
10. [ ] "Surprise Me" mood is unaffected by ratings
11. [ ] Guest ratings are separate from main account ratings
