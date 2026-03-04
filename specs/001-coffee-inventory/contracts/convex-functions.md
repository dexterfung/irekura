# Contract: Convex Functions

**Branch**: `001-coffee-inventory` | **Date**: 2026-03-03
**Backend**: Convex (sole backend per constitution Principle II)

All functions require an authenticated user identity (`ctx.auth.getUserIdentity()`).
Functions MUST throw `ConvexError("Unauthenticated")` if identity is absent.
All `userId` values are implicitly scoped to the authenticated user — never passed from client.

---

## Products

### `api.products.list` — Query

Returns all products for the authenticated user, ordered by creation time descending.

```typescript
// Input
{}

// Output
Doc<"products">[]
```

---

### `api.products.create` — Mutation

Creates a new coffee product. Returns the new product ID.

```typescript
// Input
{
  name:       string;          // 1–100 chars
  brand:      string;          // 1–100 chars
  type:       "drip-bag" | "ground-bean" | "concentrate-capsule" | "instant-powder";
  bitterness: number;          // integer 1–5
  sourness:   number;          // integer 1–5
  richness:   number;          // integer 1–5
  notes?:     string;          // optional, ≤500 chars
}

// Output
Id<"products">

// Errors
ConvexError("INVALID_FLAVOR_RATING") if any rating outside 1–5
ConvexError("INVALID_TYPE") if type not one of the four literals
```

---

### `api.products.update` — Mutation

Updates editable fields of an existing product. Partial update — only provided fields change.

```typescript
// Input
{
  id:          Id<"products">;
  name?:       string;
  brand?:      string;
  type?:       "drip-bag" | "ground-bean" | "concentrate-capsule" | "instant-powder";
  bitterness?: number;
  sourness?:   number;
  richness?:   number;
  notes?:      string;
}

// Output
void

// Errors
ConvexError("NOT_FOUND") if product does not exist or belongs to different user
```

---

### `api.products.delete` — Mutation

Deletes a product and cascades to all its batches and consumption logs.

```typescript
// Input
{ id: Id<"products"> }

// Output
void

// Errors
ConvexError("NOT_FOUND") if product does not exist or belongs to different user
```

---

## Batches

### `api.batches.listByProduct` — Query

Returns all batches for a given product, ordered by best-before date ascending
(earliest expiry first).

```typescript
// Input
{ productId: Id<"products"> }

// Output
Doc<"batches">[]

// Errors
ConvexError("NOT_FOUND") if product does not exist or belongs to different user
```

---

### `api.batches.listActive` — Query

Returns all batches across all products with `brewsRemaining > 0`, joined with their
parent product. Used as input to the recommendation engine on the client.

```typescript
// Input
{}

// Output
Array<{
  batch:   Doc<"batches">;
  product: Doc<"products">;
}>
```

---

### `api.batches.create` — Mutation

Adds a new batch (purchase) to an existing product.

```typescript
// Input
{
  productId:      Id<"products">;
  brewsRemaining: number;      // positive integer ≥ 1
  bestBeforeDate: string;      // "YYYY-MM-DD"
}

// Output
Id<"batches">

// Errors
ConvexError("NOT_FOUND") if product does not exist or belongs to different user
ConvexError("INVALID_QUANTITY") if brewsRemaining < 1
ConvexError("INVALID_DATE") if bestBeforeDate is not a valid ISO date
```

---

### `api.batches.updateQuantity` — Mutation

Directly sets the brews remaining on a batch (used for manual corrections, not
consumption). For consumption, use `api.consumptionLogs.create` instead.

```typescript
// Input
{
  id:             Id<"batches">;
  brewsRemaining: number;      // non-negative integer ≥ 0
}

// Output
void

// Errors
ConvexError("NOT_FOUND") if batch does not belong to authenticated user
ConvexError("INVALID_QUANTITY") if brewsRemaining < 0
```

---

### `api.batches.delete` — Mutation

Deletes a batch and all consumption logs referencing it.

```typescript
// Input
{ id: Id<"batches"> }

// Output
void

// Errors
ConvexError("NOT_FOUND") if batch does not belong to authenticated user
```

---

## Consumption Logs

### `api.consumptionLogs.listByMonth` — Query

Returns all consumption logs for the authenticated user in a given calendar month,
used to populate the calendar view.

```typescript
// Input
{
  year:  number;   // e.g., 2026
  month: number;   // 1–12
}

// Output
Array<{
  log:     Doc<"consumptionLogs">;
  product: Doc<"products">;
}>
```

---

### `api.consumptionLogs.listRecent` — Query

Returns the N most recent consumption log product IDs for the "Surprise Me" mood
recency scoring in the recommendation engine.

```typescript
// Input
{ limit: number }  // suggested: 10

// Output
string[]   // productId strings, most recent first
```

---

### `api.consumptionLogs.create` — Mutation

Creates a consumption log entry AND atomically decrements the referenced batch's
`brewsRemaining` by 1.

```typescript
// Input
{
  productId: Id<"products">;
  batchId:   Id<"batches">;
  date:      string;            // "YYYY-MM-DD", must not be in future
  rating?:   number;            // integer 1–5
}

// Output
Id<"consumptionLogs">

// Errors
ConvexError("NOT_FOUND") if product or batch not found or not owned by user
ConvexError("BATCH_DEPLETED") if batch brewsRemaining is already 0
ConvexError("FUTURE_DATE") if date is after today
ConvexError("INVALID_RATING") if rating outside 1–5
```

---

### `api.consumptionLogs.rate` — Mutation

Adds or updates the star rating on an existing consumption log.

```typescript
// Input
{
  id:     Id<"consumptionLogs">;
  rating: number;   // integer 1–5
}

// Output
void

// Errors
ConvexError("NOT_FOUND") if log does not belong to authenticated user
ConvexError("INVALID_RATING") if rating outside 1–5
```

---

## Preference Profiles

### `api.preferenceProfiles.get` — Query

Returns the preference profile for a given day type, or null if not yet configured.

```typescript
// Input
{ type: "weekday" | "weekend" }

// Output
Doc<"preferenceProfiles"> | null
```

---

### `api.preferenceProfiles.upsert` — Mutation

Creates or updates a preference profile. Replaces all fields atomically.

```typescript
// Input
{
  type:       "weekday" | "weekend";
  bitterness: number;   // integer 1–5
  sourness:   number;   // integer 1–5
  richness:   number;   // integer 1–5
}

// Output
void

// Errors
ConvexError("INVALID_WEIGHT") if any weight outside 1–5
```
