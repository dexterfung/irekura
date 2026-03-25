# Feature: Product Ratings & Tasting Notes

**Status**: Backlog — not yet planned
**Raised**: 2026-03-25

## Summary

Allow users to rate coffees (1-5 stars) and add free-text tasting notes after consumption.
Ratings feed back into the recommendation engine to boost highly-rated products and deprioritize
poorly-rated ones, making recommendations improve over time based on actual enjoyment rather
than just flavour profile matching.

## Rating Flow

- After logging a consumption (accepting a recommendation or manual log), the user is optionally
  prompted to rate the coffee (1-5 stars)
- The prompt is non-blocking — the user can skip it and rate later from History
- Ratings can be added or updated from the History page on any past consumption entry
- Each consumption log entry gets its own rating (the same product can be rated differently
  on different occasions)

## Tasting Notes

- Optional free-text field (max 280 characters) attached to each consumption log
- Entered alongside the rating or separately from History
- Displayed on the History page under each entry

## Recommendation Engine Integration

Ratings introduce a **personal enjoyment signal** alongside the existing flavour-profile and
expiry-urgency scoring:

### Proposed Scoring Adjustment

- Compute a **product rating score** = average of the user's last N ratings for that product
  (e.g. N = 5 to weight recent experience)
- Apply a multiplier to the recommendation score:
  - Rating >= 4: boost (e.g. x1.2)
  - Rating == 3: neutral (x1.0)
  - Rating <= 2: penalize (e.g. x0.8)
  - No ratings: neutral (x1.0) — new products are not disadvantaged
- The exact multiplier values should be tunable and documented

### Edge Cases

- A product with only one low rating should not be permanently buried — recency weighting
  and the small N window handle this
- Guest ratings are separate from main account ratings and affect guest recommendations only

## Schema Changes

### Modified tables

- `consumptionLogs` — add optional fields:
  - `rating: v.optional(v.number())` — integer 1-5
  - `tastingNotes: v.optional(v.string())` — max 280 chars

### No new tables required

## UI Changes

1. **Post-consumption prompt** — subtle card/bottom sheet after logging, with 1-5 star input
   and optional notes field
2. **History page** — show rating (stars) and notes on each entry; tap to add/edit
3. **Product detail** — show average rating across all consumption entries for that product
4. **Recommend page** — no visible change, but scoring now factors in ratings

## Guest Profile Interaction

- Guest ratings are stored on consumption logs where `loggedFor === "guest"`
- Guest recommendations use the guest's own rating history
- Main account ratings do not influence guest recommendations and vice versa

## Open Questions

- Should there be a "favourites" shortcut (e.g. auto-favourite anything rated 5)?
- Should the recommendation page show the user's past rating for the recommended product?
- What are the right multiplier values — should they be user-configurable or fixed?
