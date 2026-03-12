# Quickstart: Guest Profile Integration Scenarios

**Branch**: `002-guest-profile` | **Date**: 2026-03-12

## Scenario 1: Enable the Guest Profile

**Goal**: User enables the guest slot for the first time.

1. User navigates to **Preferences → Guest Profile** section.
2. User toggles "Enable guest profile" on.
3. A display name input appears. User types a name (e.g. "Alex") and saves.
4. `setGuestEnabled({ enabled: true })` and `setGuestDisplayName({ name: "Alex" })` are called.
5. A stable `guestId` (`"guest:{userId}"`) is written to `userSettings` if not already present.
6. App-wide guest UI (Log Coffee toggle, Recommend switcher, History filter) becomes visible.

---

## Scenario 2: Log Coffee on Behalf of Guest

**Goal**: User logs a coffee entry for the guest.

1. User navigates to **History → Log Coffee**.
2. Because `guestEnabled` is `true`, a "Logging for" toggle shows: **You** | **Alex**.
3. User selects **Alex**, picks a product and batch, and confirms.
4. `consumption.create({ ..., loggedFor: "guest" })` is called.
5. The batch's `brewsRemaining` is decremented.
6. The new log entry appears in History with an "Alex" attribution badge.

---

## Scenario 3: Get Recommendations for Guest

**Goal**: User views coffee recommendations matched to the guest's tastes.

1. User navigates to **Recommend**.
2. A person switcher appears at the top: **You** | **Alex**.
3. User selects **Alex**.
4. The page fetches `preferences.getForGuest({ type: "weekday" | "weekend" })` and `consumption.listRecentForGuest`.
5. `scoreAndRankBatches(batches, guestProfile, mood, today, guestRecentIds)` is called.
6. Ranked recommendations reflect Alex's flavour preferences, not the main account's.

---

## Scenario 4: Set Guest Flavour Preferences

**Goal**: Main account sets/updates the guest's flavour preferences.

1. User navigates to **Preferences → Guest Profile → Flavour Preferences**.
2. Sliders for bitterness, sourness, richness importance are shown for weekday and weekend separately.
3. User adjusts sliders and saves.
4. `preferences.upsertForGuest({ type, bitterness, sourness, richness })` is called.
5. Changes take effect immediately on next Recommend page load for the guest.

---

## Scenario 5: Disable and Re-enable Guest Profile

**Goal**: User temporarily disables the guest slot.

1. User toggles "Enable guest profile" off in Preferences and saves.
2. `setGuestEnabled({ enabled: false })` is called.
3. All guest UI elements disappear (Log Coffee toggle, Recommend switcher, History filter).
4. Existing guest history entries remain visible without the filter UI.
5. User re-enables the toggle — the same `guestId` is reused, display name and preferences are restored.

---

## Scenario 6: View History with Attribution

**Goal**: User reviews who drank what.

1. User navigates to **History** and selects a date.
2. Log entries for that day show attribution badges: "You" (primary) or "Alex" (secondary).
3. User taps the **Alex** filter pill above the calendar — only guest entries are shown.
4. User taps **All** to return to the full view.
