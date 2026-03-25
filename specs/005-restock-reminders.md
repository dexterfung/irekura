# Feature: Restock Reminders & Shopping List

**Status**: Backlog — not yet planned
**Raised**: 2026-03-25

## Summary

Help the user stay ahead of running out of coffee. When a product's total brews remaining drops
below a configurable threshold (or reaches zero), surface a "running low" indicator. Provide an
in-app shopping list where the user can track products they intend to repurchase.

## Running Low Indicators

- Each product can have a **restock threshold** (default: 3 brews remaining across all batches)
- When total brews remaining for a product falls at or below the threshold:
  - A visual badge appears on the product in the Inventory list
  - The product is surfaced in a "Running Low" section at the top of Inventory
- When a product reaches 0 brews remaining (all batches depleted), it is highlighted as
  "Out of stock"
- The user can adjust the threshold per product or globally in Preferences

## Shopping List

- In-app only — no external integrations
- The user can manually add items to the shopping list (product name + optional notes)
- "Running low" products can be added to the shopping list with one tap
- Items can be checked off (purchased) or removed
- When checked off, the app can optionally prompt the user to add a new batch to the
  corresponding product in inventory

## Schema Changes

### New table

```ts
shoppingList: defineTable({
  userId: v.string(),
  productName: v.string(),
  productId: v.optional(v.id("products")), // linked if from inventory
  notes: v.optional(v.string()),
  completed: v.boolean(),
  createdAt: v.number(),
}).index("by_user", ["userId"])
```

### Modified tables

- `products` — add optional `restockThreshold: v.optional(v.number())` field
- `userSettings` — add optional `defaultRestockThreshold: v.optional(v.number())` for global default

## UI Changes

1. **Inventory page** — "Running Low" section at top; badge on low-stock products
2. **Shopping List page** — new page accessible from Inventory or bottom nav
3. **Preferences** — global restock threshold setting

## Guest Profile Interaction

- Shopping list is per-account, not per-person — the guest shares the same inventory
- Running low indicators are based on shared batch quantities

## Open Questions

- Should the shopping list support quantities (e.g. "buy 2 boxes")?
- Should there be a "buy again" shortcut from consumption history?
