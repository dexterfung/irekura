# Quickstart: Coffee Inventory & Smart Recommendations

**Branch**: `001-coffee-inventory` | **Date**: 2026-03-03
**Validates**: All four user stories from spec.md can be exercised end-to-end

---

## Prerequisites

- Node.js LTS (≥20) installed
- `npm` or `pnpm` available
- A Google OAuth application configured with the callback URL `http://localhost:3000/api/auth/callback/google`
- A Convex account with a development deployment provisioned (`npx convex dev` authenticated)
- Environment variables set (see `.env.local.example`)

---

## Environment Setup

Copy `.env.local.example` to `.env.local` and populate:

```bash
# NextAuth
AUTH_SECRET=<random 32+ char string>
AUTH_GOOGLE_ID=<Google OAuth client ID>
AUTH_GOOGLE_SECRET=<Google OAuth client secret>
NEXTAUTH_URL=http://localhost:3000

# Convex
NEXT_PUBLIC_CONVEX_URL=<from Convex dashboard, e.g. https://xxx.convex.cloud>
```

---

## Start Development

```bash
# 1. Install dependencies
npm install

# 2. Start Convex dev server (syncs schema and watches convex/ directory)
npx convex dev &

# 3. Start Next.js dev server
npm run dev
```

Open `http://localhost:3000`. You should be redirected to the sign-in page.

---

## Validation Walkthrough

### US1 — Manage Coffee Inventory

1. Sign in with Google → confirm redirect to `/inventory`
2. Tap "+" (FAB) → navigate to `/inventory/new`
3. Fill form: name "丸山咖啡 Ethiopia", brand "丸山珈琲", type "ground-bean",
   bitterness 2, sourness 4, richness 3, brews 8, best-before (any future date)
4. Submit → confirm redirect to `/inventory/[id]` showing product detail
5. Tap "Add batch" → add a second batch with a different best-before date and 6 brews
6. Confirm both batches appear with correct quantities
7. Edit first batch quantity to 7 → confirm update
8. Add a second product of type "drip-bag" with best-before date = today + 5 days
9. Return to `/inventory` → confirm both products visible; drip-bag product shows
   expiry-soon indicator (≤30 days)
10. Delete the drip-bag product → confirm it disappears from the list

**Pass criteria**: All actions succeed; quantities and indicators are correct.

---

### US2 — Daily Recommendation

1. Navigate to `/recommend`
2. Select "Light & Bright" → confirm a recommendation card appears showing a product
3. Confirm the recommendation card shows product name, brand, type, brews remaining,
   best-before date, and expiry urgency
4. Tap "Show another" → confirm a different product/batch appears (or empty state if only 1)
5. Add a drip-bag batch with best-before = today + 3 days (very urgent)
6. Return to `/recommend`, select any mood → confirm the near-expiry batch is recommended
7. Select "Surprise Me" → confirm the recommendation is not the most recently consumed
   product (if consumption history exists)
8. Tap "Drink this" on any recommendation → confirm rating prompt appears

**Pass criteria**: Recommendations reflect expiry urgency and mood logic.

---

### US3 — Log Consumption & Rate

1. Accept a recommendation from US2 (tap "Drink this") → confirm:
   - Rating prompt appears (1–5 stars)
   - Rate 4 stars and confirm
2. Navigate to `/history` → confirm today is marked with a dot
3. Tap today → confirm detail shows the product name, batch best-before, and 4-star rating
4. Tap "+" on history screen (or navigate manually) → manually log yesterday's consumption
   for the ground-bean product, no rating
5. Navigate back to history → confirm yesterday is also marked
6. Tap yesterday → confirm no rating shown
7. Add a rating to yesterday's log (tap "Rate" in detail view) → confirm saved
8. Navigate to previous month (if prior entries exist) → confirm calendar loads

**Pass criteria**: Consumption logs appear correctly; ratings update; calendar marks are accurate.

---

### US4 — Configure Preference Profiles

1. Navigate to `/preferences`
2. Confirm sliders default to 3 for all three axes (both tabs)
3. On Weekday tab: set bitterness = 5, sourness = 1, richness = 3
4. Confirm radar chart updates in real time as sliders move
5. Save weekday profile
6. Navigate to `/recommend` (on a weekday) → confirm recommendation is a high-bitterness
   product from inventory
7. Return to `/preferences` → Weekend tab: set equal weights (3/3/3) and save
8. Confirm weekday profile still shows 5/1/3 (profiles are independent)

**Pass criteria**: Profiles save and independently influence recommendations.

---

## Unit Test Validation

```bash
# Run recommendation engine unit tests
npm run test

# Expected output: all tests in lib/recommendations/engine.test.ts PASS
# Coverage: expiry thresholds, all four moods, edge cases (empty array, depleted batches)
```

---

## E2E Test Validation

```bash
# Run Playwright E2E tests (requires dev server running on port 3000)
npm run test:e2e

# Tests cover the four user story flows above in automated form
```

---

## PWA Install Validation

1. Open `http://localhost:3000` in Chrome (or Safari on iOS)
2. Chrome: "Install app" prompt should appear in address bar
3. Install the PWA → confirm it opens as a standalone window (no browser chrome)
4. Navigate all four screens → confirm layout is correct at 390×844px (iPhone 14)
5. On a desktop browser: confirm `/history` shows the monthly calendar grid

---

## Vercel Deployment Validation

```bash
# Deploy to Vercel preview
vercel --prebuilt

# Set environment variables in Vercel dashboard:
# AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_CONVEX_URL

# Visit the preview URL → repeat sign-in and inventory walkthrough
```
