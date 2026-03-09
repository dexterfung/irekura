# Feature Idea: Household Sharing

**Status**: Backlog — not yet planned
**Raised**: 2026-03-09

## Summary

Extend Irekura from a single-user app to support a whole household. Each household member
keeps their own Google login and individual preferences/history, while inventory (products and
batches) is shared across the household.

## Chosen Approach: Option A — Household with Separate Logins

Each person signs in with their own Google account. One person creates a household; others
join via an invite link. Inventory is shared; consumption tracking and preferences remain
individual.

Option B (profiles under one account) was considered but rejected — it requires sharing a
single login and feels like a workaround rather than a proper solution.

## What Stays Personal

- Consumption logs (who drank what, when)
- Flavour preferences (weekday/weekend profiles)
- Theme setting

## What Becomes Shared

- Products
- Batches (including brews remaining)
- Visible history (filterable by member)

## Schema Changes Required

### New tables

```ts
households: defineTable({
  name: v.string(),
  createdBy: v.string(), // userId
})

householdMembers: defineTable({
  householdId: v.id("households"),
  userId: v.string(),
  displayName: v.string(),
  role: v.union(v.literal("admin"), v.literal("member")),
}).index("by_user", ["userId"])
  .index("by_household", ["householdId"])

inviteCodes: defineTable({
  householdId: v.id("households"),
  code: v.string(),       // short random code
  expiresAt: v.number(),  // unix ms
}).index("by_code", ["code"])
```

### Modified tables

- `products` — replace `userId` with `householdId`
- `batches` — replace `userId` with `householdId`
- `consumptionLogs` — keep `userId`, add `householdId` for cross-member queries

### Unchanged tables

- `preferences` — stays per userId
- `userSettings` — stays per userId

## UI Changes Required

1. **Onboarding flow** — on first login, prompt user to create a new household or join one
   via invite code before reaching the main app
2. **Household settings** (new section in Preferences) — household name, member list,
   generate/revoke invite link, leave household
3. **Inventory** — no visible change; queries switch from userId to householdId
4. **History** — member filter chip; log entries show a small avatar/initial for who drank it
5. **Recommend page** — no change needed

## Migration Considerations

- Existing single-user data needs a migration: create a household per existing user and
  reassign their products, batches, and logs to it
- Users without a household (new signups mid-migration) must be handled gracefully

## Open Questions

- Should admins be able to remove members?
- Should non-admin members be able to delete products/batches, or only admins?
- What happens to a household if the admin leaves?
- Should the invite link expire or be single-use?
