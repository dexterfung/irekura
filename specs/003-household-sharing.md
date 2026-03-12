# Feature: Household Sharing

**Status**: Backlog — not yet planned
**Raised**: 2026-03-12

## Summary

Extend Irekura to support a full household where each member signs in with their own Google
account. Inventory (products and batches) is shared across the household; consumption history,
flavour preferences, and recommendations remain individual.

This is a separate, more complex feature from the guest profile (`002-guest-profile.md`).
Guest profiles do not need to be "upgraded" — if a guest wants their own account they simply
create a new one; their prior consumption history stays attributed to the guest slot and is not
transferred.

## Roles

| Role | Description |
|------|-------------|
| **Admin** | Created the household. Can manage members, products, and household settings. |
| **Member** | Joined via invite link with their own Google account. |

One household has exactly one admin. The admin role can be transferred but not left vacant.

## Permissions

### Products & Batches

- Can be edited or deleted by: admin OR the member who created them
- Can be viewed by all household members

### Consumption Logs

- Each member logs their own consumption only

### Flavour Preferences & Recommendations

- Strictly per-member; never shared

### History Visibility

- All members can see the full household history feed
- Admin additionally sees a per-member filter and aggregate stats
- Regular members see the full list without the per-member breakdown

## Membership & Onboarding

1. On first login, the user is prompted to create a household or join one via invite code
2. Creating a household makes the user the admin
3. Joining via invite code makes the user a member
4. Invite links are time-limited (e.g. 48 hours) and single-use

## What Stays Personal

- Consumption logs (tagged by userId)
- Flavour preferences (weekday/weekend profiles)
- Theme and locale settings

## What Becomes Shared

- Products
- Batches (including brews remaining)
- Full history feed (visibility detail varies by role)

## Schema Changes Required

### New tables

```ts
households: defineTable({
  name: v.string(),
  createdBy: v.string(), // userId of admin
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
  code: v.string(),
  expiresAt: v.number(), // unix ms
}).index("by_code", ["code"])
```

### Modified tables

- `products` — replace `userId` with `householdId`; add `createdBy: v.string()`
- `batches` — replace `userId` with `householdId`; add `createdBy: v.string()`
- `consumptionLogs` — keep `userId`; add `householdId` for cross-member queries

### Unchanged tables

- `preferences` — stays per userId
- `userSettings` — stays per userId

## UI Changes Required

1. **Onboarding** — on first login, prompt to create household or join via invite code
2. **Household settings** (new section in Preferences):
   - Household name
   - Member list with roles
   - Generate/revoke invite link
   - Transfer admin role
   - Leave household (non-admin only)
   - Dissolve household (admin only)
3. **Inventory** — no visible change; queries switch from userId to householdId
4. **History** — log entries show who consumed (avatar/initials); admin sees a member filter
5. **Recommend page** — no changes; recommendations are already per-person

## Migration Considerations

- Existing single-user data: create a household per user, make them admin, reassign their
  products, batches, and logs to the household
- New signups before migration must be handled gracefully

## Relationship to Guest Profiles

Guest profiles (`002-guest-profile.md`) are a separate feature and do not need to be resolved
before household sharing can be implemented. If a user has a guest profile and later joins or
creates a household, the guest slot remains as-is under the main account — it is not migrated
into the household.

## Open Questions

- Should admins be able to remove members?
- What happens to a household if the admin's Google account is deleted?
- Should leaving a household delete the member's consumption logs or preserve them?
