# Feature Specification: Guest Profile

**Feature Branch**: `002-guest-profile`
**Created**: 2026-03-12
**Status**: Draft
**Input**: User description: "Allow a main account to enable a single guest slot so another person's coffee consumption can be tracked without a login."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enable Guest Profile (Priority: P1)

A user wants to track coffee consumption for someone else in their household (e.g. a partner) without that person needing a separate login. They go to Preferences, enable the guest profile, give it a name (e.g. "Alex"), and the guest slot is now active throughout the app.

**Why this priority**: This is the foundational step — all other guest features depend on the guest slot being enabled. Without it, nothing else works.

**Independent Test**: Can be fully tested by enabling the guest profile in Preferences, setting a display name, and verifying the guest name appears in the Log Coffee and Recommend flows.

**Acceptance Scenarios**:

1. **Given** no guest profile exists, **When** the user enables the guest toggle in Preferences and saves a display name, **Then** the guest profile becomes active and the name is shown throughout the app.
2. **Given** a guest profile is enabled, **When** the user disables the toggle, **Then** the guest slot is deactivated and guest-specific UI elements are hidden across the app.
3. **Given** a guest profile is enabled and then disabled, **When** the user re-enables it, **Then** the previously saved display name and flavour preferences are restored.

---

### User Story 2 - Log Coffee on Behalf of Guest (Priority: P1)

The main account user drinks coffee together with their guest. When logging a coffee, they can switch who they are logging for — themselves or the guest — so each person's consumption is tracked separately.

**Why this priority**: Core value of the feature. Without this, the guest profile serves no purpose.

**Independent Test**: Can be fully tested by logging a coffee entry as "Guest" and verifying it appears in history attributed to the guest, while a separate entry for "Self" appears under the main account.

**Acceptance Scenarios**:

1. **Given** the guest profile is enabled, **When** the user opens the Log Coffee flow, **Then** a "Logging for" toggle shows with options Self and Guest.
2. **Given** the user selects "Guest" in the Log Coffee flow and confirms, **Then** the consumption is recorded under the guest and the batch's brews remaining is decremented.
3. **Given** the guest profile is disabled, **When** the user opens Log Coffee, **Then** no "Logging for" toggle is shown and the log is attributed to self only.

---

### User Story 3 - Guest Flavour Preferences & Recommendations (Priority: P2)

The guest has their own taste — they prefer stronger, less acidic coffee. The main account sets the guest's flavour preferences so that when viewing recommendations as the guest, the suggestions match the guest's palate.

**Why this priority**: Unlocks personalised value for the guest. Without this, the guest's recommendations would be identical to the main account's.

**Independent Test**: Can be fully tested by setting different flavour preferences for the guest, switching to the guest view on the Recommend page, and verifying the ranked recommendations differ from the main account's.

**Acceptance Scenarios**:

1. **Given** the guest profile is enabled, **When** the user opens the Guest Profile section in Preferences, **Then** flavour preference sliders (bitterness, sourness, richness importance) are shown for the guest separately from the main account's.
2. **Given** the guest has different flavour preferences set, **When** the user selects "Guest" on the Recommend page, **Then** the recommendations are generated using the guest's preferences.
3. **Given** the main account switches back to "Self" on the Recommend page, **Then** recommendations revert to the main account's preferences.

---

### User Story 4 - History with Guest Attribution (Priority: P2)

After a week of tracking, the user wants to review who drank what. The History page shows all entries with a label indicating whether the main account or the guest consumed each item, and can be filtered to see only one person's history.

**Why this priority**: Transparency and insight into shared consumption. Lower priority than logging itself but important for the feature to feel complete.

**Independent Test**: Can be fully tested by logging entries for both Self and Guest on the same day and verifying each appears with the correct attribution label in History.

**Acceptance Scenarios**:

1. **Given** consumption has been logged for both self and guest, **When** the user views the History page, **Then** each entry shows a label ("You" or the guest's display name) indicating who consumed it.
2. **Given** the guest profile is enabled, **When** the user filters history by guest, **Then** only entries attributed to the guest are shown.
3. **Given** the guest profile is disabled, **When** the user views History, **Then** all past guest entries remain visible with their attribution label.

---

### Edge Cases

- What happens if the user tries to log coffee as a guest when the guest profile has been disabled mid-session?
- What happens to the brews remaining count if a guest log is deleted — is it restored?
- What if the guest display name is left blank — is a default name used?
- What happens to guest history entries if the user attempts to delete the guest profile data?
- Can the main account view the Recommend page for the guest even if the guest has no flavour preferences set yet (all sliders at default)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a user to enable or disable a single guest profile slot from the Preferences page.
- **FR-002**: The system MUST allow the user to set and update a display name for the guest profile.
- **FR-003**: The system MUST store flavour preference settings (bitterness importance, sourness importance, richness importance, weekday/weekend profiles) independently for the guest profile.
- **FR-004**: When the guest profile is enabled, the Log Coffee flow MUST offer a "Logging for" choice between Self and Guest.
- **FR-005**: Each consumption log entry MUST be attributed to either the main account or the guest.
- **FR-006**: The recommendation engine MUST generate recommendations using the selected person's flavour preferences when the user switches between Self and Guest on the Recommend page.
- **FR-007**: The History page MUST display an attribution label on each entry indicating whether it was consumed by the main account or the guest.
- **FR-008**: The History page MUST support filtering entries by person (all / self / guest) when the guest profile is enabled.
- **FR-009**: When the guest profile is disabled, all guest-specific UI elements (Logging for toggle, person switcher, history filter) MUST be hidden.
- **FR-010**: Guest history entries MUST remain visible even after the guest profile is disabled, preserving the historical record.
- **FR-011**: Re-enabling the guest profile MUST restore the previously saved display name and flavour preferences.

### Key Entities

- **Guest Profile**: A single named slot belonging to the main account. Has an enabled/disabled state, a display name, and its own flavour preferences. No login credentials.
- **Consumption Log**: An existing record of a coffee being drunk. Gains an attribution field identifying whether the main account or the guest consumed it.
- **Flavour Preferences**: Existing per-user preference set (bitterness/sourness/richness importance, weekday/weekend profile). The guest profile gets its own independent set.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can enable the guest profile and log a coffee on the guest's behalf in under 60 seconds from the Preferences page.
- **SC-002**: Switching between Self and Guest on the Recommend page takes effect immediately with no page reload required.
- **SC-003**: All past consumption entries retain correct attribution regardless of whether the guest profile is later disabled.
- **SC-004**: The guest's flavour preferences are reflected in recommendations independently from the main account's preferences with 100% accuracy.

## Assumptions

- The guest profile is a convenience feature — there is no authentication, privacy separation, or data ownership for the guest. The main account has full control.
- "One guest per account" is a hard constraint; the UI should make it clear there is only one slot.
- Deleting guest profile data (if supported) is out of scope for this feature.
- The guest shares the same inventory view as the main account — no inventory filtering by person.
- Default flavour preferences for the guest (before the user sets them) are the same neutral defaults as for a new main account.
