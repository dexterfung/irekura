# Feature: Expiry & Daily Recommendation Notifications

**Status**: Backlog — not yet planned
**Raised**: 2026-03-25

## Summary

Send PWA push notifications to remind users about expiring batches and to deliver a daily
coffee recommendation. Fully free — no paid push services; uses the Web Push API with
VAPID keys (self-hosted, zero cost).

## Notification Types

### 1. Expiry Warning

- Triggered when a batch's best-before date is within a configurable window (default: 7 days)
- Sent once per batch per threshold crossing (not daily repeats for the same batch)
- Message example: "Your [Product Name] expires in 3 days — 5 brews remaining"
- Tapping the notification opens the Inventory page

### 2. Daily Recommendation ("Today's Pick")

- Sent once per day at a user-configured time (default: 08:00 local time)
- Uses the existing recommendation engine with the user's default mood or "Surprise Me"
- Message example: "Good morning! Today's pick: [Product Name] — Light & Bright"
- Tapping the notification opens the Recommend page with the suggestion pre-loaded

## Technical Approach

### Web Push API + VAPID (free)

- Generate VAPID key pair (stored as environment variables)
- Service worker (Serwist already configured) handles push event and displays notification
- Subscription is stored per user in Convex
- Backend sends push messages via `web-push` npm package from a Convex scheduled function
  (cron or action)

### No third-party push services required

## User Preferences

- **Enable/disable** each notification type independently
- **Expiry warning window**: configurable (3 / 5 / 7 / 14 days before expiry)
- **Daily pick time**: hour selector (e.g. 07:00, 08:00, 09:00)
- **Quiet hours**: optional — suppress all notifications between e.g. 22:00–07:00
- All preferences stored in `userSettings`

## Schema Changes

### New table

```ts
pushSubscriptions: defineTable({
  userId: v.string(),
  endpoint: v.string(),
  keys: v.object({
    p256dh: v.string(),
    auth: v.string(),
  }),
  createdAt: v.number(),
}).index("by_user", ["userId"])
```

### Modified tables

- `userSettings` — add optional notification preference fields:
  - `notifyExpiry: v.optional(v.boolean())`
  - `expiryWarningDays: v.optional(v.number())`
  - `notifyDailyPick: v.optional(v.boolean())`
  - `dailyPickHour: v.optional(v.number())`
  - `quietHoursStart: v.optional(v.number())`
  - `quietHoursEnd: v.optional(v.number())`

## UI Changes

1. **Preferences page** — new "Notifications" section with toggles and time selectors
2. **Browser permission prompt** — triggered when user first enables any notification type
3. **No changes** to Inventory, History, or Recommend pages

## Guest Profile Interaction

- Notifications are for the main account only
- Daily pick could optionally alternate between self and guest recommendations if guest profile
  is enabled (to be decided)

## PWA / Service Worker

- The existing Serwist service worker needs a `push` event handler and a
  `notificationclick` handler for routing
- No changes to the caching strategy

## Open Questions

- Should the daily pick notification include a one-tap "Accept" action button?
- Should expiry notifications be grouped if multiple batches expire on the same day?
- Should there be a weekly digest notification summarizing consumption stats?
