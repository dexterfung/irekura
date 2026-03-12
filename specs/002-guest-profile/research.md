# Research: Guest Profile

**Branch**: `002-guest-profile` | **Date**: 2026-03-12

## Decision Log

### 1. Guest Identity Storage

**Decision**: Store guest identity fields (`guestEnabled`, `guestId`, `guestDisplayName`) directly on the existing `userSettings` table.

**Rationale**: No new table is needed. The guest slot is 1:1 with the main account, so adding three optional fields to `userSettings` is the minimal change. The `guestId` is a stable generated string (e.g. `"guest:{userId}"`) created once when the guest is first enabled; it acts as the `userId` key for guest preference profiles.

**Alternatives considered**:
- Separate `guestProfiles` table — rejected; overkill for a single slot, adds a join on every settings read.
- Storing guest prefs inside `userSettings` as nested object — rejected; `preferenceProfiles` table already handles the weekday/weekend structure cleanly; reusing it with a `guestId` is simpler.

---

### 2. Guest Preference Profiles

**Decision**: Reuse the existing `preferenceProfiles` table with the `guestId` as the `userId` field. No schema change to `preferenceProfiles` is needed.

**Rationale**: The table is already keyed by an arbitrary `userId` string. The `guestId` (`"guest:{mainUserId}"`) is a valid string key. The existing `preferences.get` and `preferences.upsert` Convex functions accept a `userId` argument implicitly via identity — new guest-specific query/mutation functions will pass `guestId` explicitly instead.

**Alternatives considered**:
- Adding a `profileOwner: "self" | "guest"` discriminator column — rejected; overcomplicates queries without benefit.

---

### 3. Attribution on Consumption Logs

**Decision**: Add an optional `loggedFor: v.optional(v.union(v.literal("self"), v.literal("guest")))` field to `consumptionLogs`. Absence (or `"self"`) means the main account.

**Rationale**: Optional with a default of `"self"` preserves backward compatibility — existing log entries require no migration. The field is a simple literal union rather than storing a `guestId`, since there is exactly one guest slot; if the guest is later removed and re-added, attribution labels remain meaningful.

**Alternatives considered**:
- Storing the `guestId` instead of a literal — rejected; unnecessarily couples the attribution to the specific guest ID string, which could change on reset.
- Adding a separate `guestConsumptionLogs` table — rejected; duplicating the table schema violates Principle VI.

---

### 4. "Logging for" and Person Switcher UI Pattern

**Decision**: Use a segmented toggle (two-button pill: "You" / guest display name) rendered inline within the Log Coffee flow and at the top of the Recommend page. State is React local state (`useState`) — not persisted between sessions.

**Rationale**: The selection is ephemeral (each log/recommendation session starts fresh as "Self"). No URL param, cookie, or server state needed. Consistent with existing Sheet-based log flow and Recommend page mood selector.

**Alternatives considered**:
- Persisting last-used person in `userSettings` — rejected; the default should always be "Self" to prevent accidentally logging as the guest.
- Dropdown/select — rejected; with only two options a segmented toggle is clearer and more touch-friendly.

---

### 5. History Attribution Display

**Decision**: Show a small coloured chip/badge ("You" in primary colour, guest name in secondary) on each history entry. Add a filter pill row (All / You / Guest) above the calendar, visible only when the guest profile is enabled.

**Rationale**: Consistent with the existing badge/chip pattern in the codebase (Tailwind + shadcn Badge). The filter approach mirrors the existing inventory filter pattern.

**Alternatives considered**:
- Separate tabs for self/guest history — rejected; more navigation overhead, and the calendar view becomes non-obvious for a guest who shares the same timeline.

---

### 6. Recommendation Engine — Guest Profile Integration

**Decision**: The existing pure `scoreAndRankBatches` function needs no change. The Recommend page will fetch the guest's `preferenceProfiles` from Convex when "Guest" is selected, then pass them to the engine as it currently does. Recent product IDs will also be fetched for the guest's consumption history.

**Rationale**: The engine is already decoupled from identity (it accepts a `FlavorProfile` value). Adding guest support is purely a data-fetching concern at the page level.

---

### 7. No New npm Packages

**Decision**: No new dependencies required.

**Rationale**: All UI components needed (Badge, Button, Switch, Input, Separator) are already in the shadcn/ui component set. No new Convex features beyond standard queries/mutations are needed. Principle VI compliance: zero new packages.
