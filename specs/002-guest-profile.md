# Feature: Guest Profile

**Status**: Backlog — not yet planned
**Raised**: 2026-03-12

## Summary

Allow a main account to set up a single guest profile so that another person (e.g. a partner,
family member, or flatmate) can have their coffee consumption tracked without needing their own
login. The guest shares the same inventory but has their own flavour preferences and
consumption history.

## What a Guest Profile Is

- One guest slot per user account — either enabled or disabled
- The main account gives the guest a display name
- The guest has their own flavour preferences (set and managed by the main account)
- The main account logs coffee consumption on the guest's behalf
- The guest never logs in — this is entirely managed through the main account

## What Stays Separate

- Consumption logs — tagged as "self" or "guest" so history is distinguishable
- Flavour preferences — the guest has their own weekday/weekend profiles
- Recommendations — generated per-person based on individual preferences

## What Is Shared

- Inventory (products and batches) — unchanged, still belongs to the main account
- Brews remaining — deducted from the same batch regardless of who drank it

## Schema Changes Required

### Modified tables

- `preferences` — add a guest preferences record keyed by a stable generated guest ID stored
  in `userSettings`
- `userSettings` — add:
  - `guestEnabled: v.boolean()`
  - `guestId: v.optional(v.string())` — stable generated ID for the guest slot; created once
    when guest is first enabled; persists if guest is disabled and re-enabled
  - `guestDisplayName: v.optional(v.string())`
- `consumptionLogs` — add `loggedFor: v.union(v.literal("self"), v.literal("guest"))`,
  defaulting to `"self"`

### No new tables required

## UI Changes Required

1. **Preferences page** — new "Guest Profile" section:
   - Toggle to enable/disable the guest slot
   - Display name input (shown when enabled)
   - Flavour preferences for the guest (same sliders as main account)

2. **Log coffee flow** — when guest is enabled, show a "Logging for" toggle (Self / Guest)
   before confirming; defaults to Self

3. **Recommend page** — when guest is enabled, show a person switcher (Self / Guest) at the
   top; recommendations use the selected person's flavour preferences

4. **History page** — log entries show a small label (e.g. initials or "Guest" tag) indicating
   who consumed; optional filter to view self-only or guest-only

## Out of Scope

- Guest having their own login (see `003-household-sharing.md`)
- Multiple guest profiles
- Transferring guest history to a new account

## Open Questions

- Should disabling the guest slot hide their history entries or just stop new ones?
- Should the guest have a separate history view, or is a filter on the main history sufficient?
