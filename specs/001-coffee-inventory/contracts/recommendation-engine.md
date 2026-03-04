# Contract: Recommendation Engine

**Branch**: `001-coffee-inventory` | **Date**: 2026-03-03
**Location**: `lib/recommendations/engine.ts`
**Constraint**: ALL functions MUST be pure — no side effects, no I/O, no unseeded randomness.
**Tests**: `lib/recommendations/engine.test.ts` (Vitest, required by constitution Principle IV)

---

## Types

```typescript
export type CoffeeType =
  | "drip-bag"
  | "ground-bean"
  | "concentrate-capsule"
  | "instant-powder";

export type Mood =
  | "light-bright"
  | "strong-rich"
  | "smooth-balanced"
  | "surprise-me";

export type DayType = "weekday" | "weekend";

export interface FlavorProfile {
  bitterness: number;  // 1–5
  sourness:   number;  // 1–5
  richness:   number;  // 1–5
}

export interface BatchInput {
  batchId:        string;
  productId:      string;
  bestBeforeDate: string;  // "YYYY-MM-DD"
  brewsRemaining: number;
  product: {
    name:       string;
    brand:      string;
    type:       CoffeeType;
  } & FlavorProfile;
}

export interface ScoredBatch extends BatchInput {
  score:         number;
  expiryUrgency: "expired" | "urgent" | "warning" | "ok";
}
```

---

## Functions

### `scoreAndRankBatches`

The primary recommendation function. Scores all active batches and returns them sorted
descending. The caller filters to the top result(s).

```typescript
function scoreAndRankBatches(
  batches:          BatchInput[],     // Only batches with brewsRemaining > 0
  profile:          FlavorProfile,    // Weekday or weekend preference profile
  mood:             Mood,
  todayISO:         string,           // "YYYY-MM-DD" — today's date
  recentProductIds: string[],         // Most-recently consumed productIds (for surprise-me)
): ScoredBatch[]
```

**Behaviour**:
- Filters out any batch with `brewsRemaining <= 0` before scoring (defensive)
- Returns an empty array if no eligible batches remain
- Deterministic for all moods including "surprise-me" (recency list provides determinism)
- If two batches have identical scores, preserves original array order (stable sort)

---

### `computeExpiryScore`

Returns the expiry urgency bonus for a batch.

```typescript
function computeExpiryScore(
  bestBeforeDate: string,  // "YYYY-MM-DD"
  todayISO:       string,  // "YYYY-MM-DD"
): { score: number; urgency: "expired" | "urgent" | "warning" | "ok" }
```

**Score table**:

| Condition | Score | Urgency label |
|-----------|-------|---------------|
| daysUntilExpiry < 0 | 200 | `"expired"` |
| daysUntilExpiry ≤ 7 | 100 | `"urgent"` |
| daysUntilExpiry ≤ 30 | 20 | `"warning"` |
| daysUntilExpiry > 30 | 0 | `"ok"` |

`daysUntilExpiry = parseISO(bestBeforeDate) - parseISO(todayISO)` in whole days.

---

### `computeFlavorScore`

Returns the mood–profile–product compatibility score.

```typescript
function computeFlavorScore(
  product: FlavorProfile,
  profile: FlavorProfile,
  mood:    Mood,
): number
```

**Scoring per mood**:

```
"light-bright":
  score = (product.sourness × profile.sourness)
        + ((6 - product.bitterness) × profile.bitterness)
  // Rewards high sourness and low bitterness, weighted by user's preference importance

"strong-rich":
  score = (product.bitterness × profile.bitterness)
        + (product.richness   × profile.richness)
  // Rewards high bitterness and richness

"smooth-balanced":
  deviation = |product.bitterness - 3|
            + |product.sourness   - 3|
            + |product.richness   - 3|
  avgWeight = (profile.bitterness + profile.sourness + profile.richness) / 3
  score = (15 - deviation) × avgWeight
  // Rewards closeness to the mid-point (3,3,3) across all axes

"surprise-me":
  recencyPenalty = indexOf(productId, recentProductIds)
    → if not found: 0
    → if index i: (recentProductIds.length - i) × 10
  score = 50 - recencyPenalty
  // Rewards coffees not consumed recently; most-recent gets highest penalty
```

**Minimum score**: 0 (clamped; negative flavour scores do not undercut expiry urgency)

---

### `getDefaultProfile`

Returns the fallback profile when no preference profile is configured.

```typescript
function getDefaultProfile(): FlavorProfile
// Returns: { bitterness: 3, sourness: 3, richness: 3 }
```

---

### `getDayType`

Returns the day type for a given ISO date string (used to select the correct profile).

```typescript
function getDayType(dateISO: string): DayType
// "weekday" for Mon–Fri (getDay() 1–5)
// "weekend" for Sat–Sun (getDay() 0, 6)
```

---

## Vitest Test Requirements (Principle IV)

The following test cases MUST exist in `lib/recommendations/engine.test.ts`:

1. **Expiry thresholds**: `computeExpiryScore` returns correct score/urgency for:
   - date in the past (expired)
   - exactly 0 days left (today = best-before, urgent)
   - 7 days left (urgent boundary)
   - 8 days left (not urgent, warning boundary minus 1)
   - 30 days left (warning boundary)
   - 31 days left (ok)

2. **Mood scoring** for `computeFlavorScore`:
   - "light-bright" ranks high-sourness product above high-bitterness product
   - "strong-rich" ranks high-bitterness+richness product above mild product
   - "smooth-balanced" ranks product closest to (3,3,3) highest
   - "surprise-me" ranks product NOT in recent list above product at index 0 of recent list

3. **Full ranking** via `scoreAndRankBatches`:
   - An expiring batch (≤7 days) ranks above a flavour-matched but fresh batch
   - An empty input returns an empty array
   - A depleted batch (brewsRemaining = 0) is excluded from results
   - Stable sort: equal-score batches preserve input order

4. **getDayType**: Monday → "weekday", Saturday → "weekend"

5. **getDefaultProfile**: returns `{ bitterness: 3, sourness: 3, richness: 3 }`
