# Data Model: Guest Profile

**Branch**: `002-guest-profile` | **Date**: 2026-03-12

## Schema Changes

### Modified: `userSettings`

Add three optional fields:

```ts
userSettings: defineTable({
  userId: v.string(),
  theme: v.union(v.literal("system"), v.literal("light"), v.literal("dark")),
  // NEW:
  guestEnabled: v.optional(v.boolean()),
  guestId: v.optional(v.string()),       // stable ID: "guest:{userId}"
  guestDisplayName: v.optional(v.string()),
}).index("by_user", ["userId"])
```

- `guestEnabled` — toggles the guest slot on/off; defaults to `false` when absent.
- `guestId` — created once on first enable; never changes even if guest is disabled/re-enabled. Format: `"guest:{mainUserId}"`.
- `guestDisplayName` — the label shown throughout the app for the guest. Required when `guestEnabled` is `true`.

### Modified: `consumptionLogs`

Add one optional field:

```ts
consumptionLogs: defineTable({
  userId: v.string(),
  productId: v.id("products"),
  batchId: v.id("batches"),
  date: v.string(),
  rating: v.optional(v.number()),
  // NEW:
  loggedFor: v.optional(v.union(v.literal("self"), v.literal("guest"))),
}).index("by_user_date", ["userId", "date"])
  .index("by_user", ["userId"])
```

- `loggedFor` — absent or `"self"` means the main account; `"guest"` means the guest slot.
- Existing records require no migration (treated as `"self"`).

### Unchanged: `preferenceProfiles`

No schema change. Guest preferences are stored as standard rows with `userId` set to the `guestId` value (e.g. `"guest:abc123"`). The existing `by_user_type` index handles lookups.

## New Convex Functions

### `convex/settings.ts` additions

```ts
// Get full guest settings (enabled, id, displayName)
export const getGuestSettings = query(...)

// Enable/disable guest, set display name
export const setGuestEnabled = mutation({ args: { enabled: v.boolean() } })
export const setGuestDisplayName = mutation({ args: { name: v.string() } })
```

### `convex/preferences.ts` additions

```ts
// Get preference profile for the guest (by guestId)
export const getForGuest = query({
  args: { type: v.union(v.literal("weekday"), v.literal("weekend")) }
})

// Upsert preference profile for the guest
export const upsertForGuest = mutation({
  args: {
    type: v.union(v.literal("weekday"), v.literal("weekend")),
    bitterness: v.number(),
    sourness: v.number(),
    richness: v.number(),
  }
})
```

### `convex/consumption.ts` changes

- `create` mutation gains optional `loggedFor` arg (defaults to `"self"`).
- `listByMonth` query returns `loggedFor` field alongside existing fields.
- New `listRecentForGuest` query — same as `listRecent` but filters by `loggedFor: "guest"` to power guest recommendations.

## Entity Relationships

```
userSettings (1)
  └── guestId ──→ preferenceProfiles (0–2 rows, keyed by guestId)
                  (weekday row + weekend row)

userSettings.guestEnabled
  └── gates appearance of guest UI throughout the app

consumptionLogs.loggedFor
  └── "self"  → attributed to main account userId
  └── "guest" → attributed to the guest slot of that userId
```

## Validation Rules

- `guestDisplayName` must be non-empty string (1–50 characters) when guest is being enabled.
- `loggedFor` values are strictly `"self"` | `"guest"`; any other value is rejected.
- Guest preference weights follow the same 1–5 range validation as the main account's.
- `guestId` is immutable once created; `setGuestEnabled` MUST NOT overwrite an existing `guestId`.
