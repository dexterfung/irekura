# Data Model: Coffee Inventory & Smart Recommendations

**Branch**: `001-coffee-inventory` | **Date**: 2026-03-03
**Storage**: Convex (sole backend per constitution Principle II)

---

## Entities Overview

```
CoffeeProduct (1) ──────< (many) CoffeeBatch
     |                               |
     └──────< (many) ConsumptionLog >┘
                          |
                     (optional) rating

PreferenceProfile (2 per user: weekday + weekend)
```

---

## Entity: CoffeeProduct

Represents a distinct coffee product (name + brand combination) in the user's collection.

**Convex table name**: `products`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | `Id<"products">` | Auto (Convex) | |
| `_creationTime` | `number` | Auto (Convex) | Unix ms |
| `userId` | `string` | Required, non-empty | NextAuth `token.sub` |
| `name` | `string` | Required, 1–100 chars | Product display name |
| `brand` | `string` | Required, 1–100 chars | Manufacturer/brand |
| `type` | `union` | Required | `"drip-bag" \| "ground-bean" \| "concentrate-capsule" \| "instant-powder"` |
| `bitterness` | `number` | 1–5 integer | User-rated flavour attribute |
| `sourness` | `number` | 1–5 integer | User-rated flavour attribute |
| `richness` | `number` | 1–5 integer | User-rated flavour attribute |
| `notes` | `string` | Optional, ≤500 chars | Free-text user notes |

**Indexes**:
- `by_user` on `["userId"]` — list all products for a user

**Validation rules**:
- `bitterness`, `sourness`, `richness` MUST each be integers in [1, 5]
- `type` MUST be one of the four literals
- `userId` MUST match the authenticated user's identity

---

## Entity: CoffeeBatch

Represents a single purchase of a product. The same product bought on different days with
different best-before dates creates separate batches.

**Convex table name**: `batches`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | `Id<"batches">` | Auto (Convex) | |
| `_creationTime` | `number` | Auto (Convex) | Unix ms; used as purchase timestamp |
| `userId` | `string` | Required | NextAuth `token.sub` |
| `productId` | `Id<"products">` | Required | References parent product |
| `brewsRemaining` | `number` | Non-negative integer | 0 = depleted |
| `bestBeforeDate` | `string` | Required, ISO format | `"YYYY-MM-DD"` |

**Indexes**:
- `by_product` on `["productId"]` — list all batches for a product
- `by_user` on `["userId"]` — list all batches for a user (for recommendation engine)
- `by_user_expiry` on `["userId", "bestBeforeDate"]` — sort by expiry for recommendations

**Validation rules**:
- `brewsRemaining` MUST be ≥ 0
- `bestBeforeDate` MUST be a valid ISO date string `YYYY-MM-DD`
- `productId` MUST reference an existing product owned by the same user
- A batch with `brewsRemaining = 0` is "depleted" — excluded from recommendations

**State transitions**:
```
NEW (brewsRemaining > 0) → DEPLETED (brewsRemaining = 0)
```
Depleted batches are soft-retained (not auto-deleted) so they appear in consumption
history. User may explicitly delete them.

---

## Entity: ConsumptionLog

Records a single drink event — either logged manually or auto-created when a
recommendation is accepted.

**Convex table name**: `consumptionLogs`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | `Id<"consumptionLogs">` | Auto (Convex) | |
| `_creationTime` | `number` | Auto (Convex) | |
| `userId` | `string` | Required | NextAuth `token.sub` |
| `productId` | `Id<"products">` | Required | Denormalised for history queries |
| `batchId` | `Id<"batches">` | Required | Which batch was consumed |
| `date` | `string` | Required, ISO format | `"YYYY-MM-DD"` — calendar date of drink |
| `rating` | `number` | Optional, 1–5 integer | Set immediately or later |

**Indexes**:
- `by_user_date` on `["userId", "date"]` — calendar queries: all entries for a user on a date
- `by_user` on `["userId"]` — full history; ordered by `_creationTime` desc

**Validation rules**:
- `date` MUST be ≤ today (cannot log future consumption)
- `rating` MUST be an integer in [1, 5] if provided
- `batchId` MUST reference a batch owned by the same user
- Multiple entries per day are allowed (user may drink multiple coffees)

**Note**: When a ConsumptionLog is created, the referenced batch's `brewsRemaining` MUST
be decremented by 1 in the same Convex mutation (atomically).

---

## Entity: PreferenceProfile

Stores the user's flavour weighting for recommendations. Exactly two profiles exist per
user: one for weekdays, one for weekends.

**Convex table name**: `preferenceProfiles`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | `Id<"preferenceProfiles">` | Auto (Convex) | |
| `_creationTime` | `number` | Auto (Convex) | |
| `userId` | `string` | Required | NextAuth `token.sub` |
| `type` | `union` | Required | `"weekday" \| "weekend"` |
| `bitterness` | `number` | 1–5 integer | Importance weight for bitterness |
| `sourness` | `number` | 1–5 integer | Importance weight for sourness |
| `richness` | `number` | 1–5 integer | Importance weight for richness |

**Indexes**:
- `by_user_type` on `["userId", "type"]` — fetch a specific profile (unique per user+type)

**Validation rules**:
- `type` MUST be one of the two literals
- Weights are importance levels (1 = don't care, 5 = very important), not product ratings
- Only one profile per `(userId, type)` pair — upsert pattern on mutation
- If no profile exists for the current day type, the recommendation engine defaults to
  equal weights (3/3/3)

---

## Derived / Computed Types

These are not stored in Convex but are assembled by queries and passed to the client or
recommendation engine:

### BatchWithProduct
```typescript
type BatchWithProduct = {
  batch: Doc<"batches">;
  product: Doc<"products">;
};
```
Used as input to the recommendation engine.

### ScoredBatch
```typescript
type ScoredBatch = BatchWithProduct & {
  score: number;
  expiryUrgency: "expired" | "urgent" | "warning" | "ok";
};
```
Output of the recommendation engine, sorted descending by score.

### CalendarDay
```typescript
type CalendarDay = {
  date: string;            // "YYYY-MM-DD"
  logs: ConsumptionLog[];  // may be empty
  hasEntry: boolean;
};
```
Used by the monthly and weekly-strip calendar components.

---

## Convex Schema Summary (TypeScript)

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    userId:     v.string(),
    name:       v.string(),
    brand:      v.string(),
    type:       v.union(
                  v.literal("drip-bag"),
                  v.literal("ground-bean"),
                  v.literal("concentrate-capsule"),
                  v.literal("instant-powder"),
                ),
    bitterness: v.number(),
    sourness:   v.number(),
    richness:   v.number(),
    notes:      v.optional(v.string()),
  }).index("by_user", ["userId"]),

  batches: defineTable({
    userId:         v.string(),
    productId:      v.id("products"),
    brewsRemaining: v.number(),
    bestBeforeDate: v.string(),
  }).index("by_product",    ["productId"])
    .index("by_user",       ["userId"])
    .index("by_user_expiry",["userId", "bestBeforeDate"]),

  consumptionLogs: defineTable({
    userId:    v.string(),
    productId: v.id("products"),
    batchId:   v.id("batches"),
    date:      v.string(),
    rating:    v.optional(v.number()),
  }).index("by_user_date", ["userId", "date"])
    .index("by_user",      ["userId"]),

  preferenceProfiles: defineTable({
    userId:    v.string(),
    type:      v.union(v.literal("weekday"), v.literal("weekend")),
    bitterness:v.number(),
    sourness:  v.number(),
    richness:  v.number(),
  }).index("by_user_type", ["userId", "type"]),
});
```

---

## Data Integrity Rules

1. **Cascade delete**: Deleting a `CoffeeProduct` MUST also delete all its `CoffeeBatch`
   records and all `ConsumptionLog` records referencing those batches.
2. **Atomic decrement**: Creating a `ConsumptionLog` and decrementing the batch's
   `brewsRemaining` MUST happen in a single Convex mutation.
3. **User isolation**: Every query and mutation MUST filter by `userId` from
   `ctx.auth.getUserIdentity()`. No cross-user data access is permitted.
4. **No negative brews**: A mutation attempting to decrement `brewsRemaining` below 0
   MUST throw an error.
