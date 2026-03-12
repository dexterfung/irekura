# Implementation Plan: Guest Profile

**Branch**: `002-guest-profile` | **Date**: 2026-03-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-guest-profile/spec.md`

## Summary

Allow a single named guest slot per user account so another person's coffee consumption can be tracked without a login. The main account enables the guest in Preferences, sets their display name and flavour preferences, and logs coffee on their behalf. Recommendations and history work per-person. Implemented entirely through Convex schema additions and UI changes — no new tables, no new npm packages.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: Next.js 15 (App Router), Convex, NextAuth v5, Tailwind CSS v4, shadcn/ui
**Storage**: Convex (sole backend) — `userSettings`, `consumptionLogs`, `preferenceProfiles` tables modified
**Testing**: Vitest (unit tests for recommendation engine integration)
**Target Platform**: Mobile-first PWA (iOS Safari, Android Chrome); Vercel hosting
**Project Type**: Mobile-first web application (PWA)
**Performance Goals**: Guest preference fetch adds one extra Convex query on Recommend page; acceptable given Convex's real-time subscription model
**Constraints**: No new npm packages; no new Convex tables; backward-compatible schema additions only
**Scale/Scope**: Single user + single guest slot; no multi-tenancy

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Stack Conformance | ✅ PASS | No new frameworks or packages. All existing stack technologies used. |
| II. Convex as Sole Backend | ✅ PASS | All data changes go through Convex mutations/queries. No route handlers for data. |
| III. Mobile-First Interface | ✅ PASS | New UI components (person switcher, attribution badge, history filter) use Tailwind utilities with mobile-first sizing and 44px touch targets. |
| IV. Pure Functional Recommendation Engine | ✅ PASS | `scoreAndRankBatches` is unchanged. Guest support is a data-fetching concern only — the engine receives a `FlavorProfile` and doesn't know if it belongs to a guest or main account. |
| V. Google OAuth via NextAuth v5 | ✅ PASS | Guest profile has no login; the main account's existing NextAuth session is used for all Convex calls. No new auth mechanism. |
| VI. Simplicity Over Engineering | ✅ PASS | Three optional fields on `userSettings`, one optional field on `consumptionLogs`, four new Convex functions, targeted UI additions. No abstractions beyond current need. |

## Project Structure

### Documentation (this feature)

```text
specs/002-guest-profile/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code changes

```text
convex/
├── schema.ts                   ← add guestEnabled/guestId/guestDisplayName to userSettings;
│                                  add loggedFor to consumptionLogs
├── settings.ts                 ← add getGuestSettings, setGuestEnabled, setGuestDisplayName
├── preferences.ts              ← add getForGuest, upsertForGuest
└── consumption.ts              ← add loggedFor arg to create; update listByMonth;
                                   add listRecentForGuest

app/(protected)/
├── preferences/
│   └── page.tsx                ← add Guest Profile section (toggle, name, flavour prefs)
├── history/
│   └── page.tsx                ← add attribution badges, person filter pills
└── recommend/
    └── page.tsx                ← add person switcher; fetch guest prefs when guest selected

components/
├── preferences/
│   └── GuestProfileSection.tsx ← new: toggle + display name + ProfileForm for guest
├── calendar/
│   └── DayDetail.tsx           ← add attribution badge to log entries
└── history/
    └── LogCoffeeSheet.tsx      ← add "Logging for" toggle when guest is enabled

lib/recommendations/
└── engine.test.ts              ← add tests for guest profile integration (data passthrough)

messages/
├── en.json                     ← add guest i18n keys
└── zh-HK.json                  ← add guest i18n keys (Traditional Chinese HK)
```

## Key Design Decisions

### Guest ID Strategy
`guestId` is set to `"guest:{mainUserId}"` on first enable and never changes. This makes the guest's `preferenceProfiles` rows trivially findable without an extra lookup.

### Backward Compatibility
- `loggedFor` is optional; existing log entries have no value and are treated as `"self"`.
- `guestEnabled` is optional; absence means `false`. No migration needed.
- All new Convex functions are additive (no existing function signatures change except `consumption.create` gaining an optional arg).

### `consumption.create` change
The existing `create` mutation currently validates that `product.userId === identity.subject` and `batch.userId === identity.subject`. This check remains — the guest logs consumption against the main account's inventory (same userId), only the `loggedFor` attribution changes.

### History filter visibility
The person filter pills (All / You / GuestName) only render when `guestEnabled` is `true`. When disabled, the filter is hidden but existing guest-attributed entries remain in the feed with their attribution badge.
