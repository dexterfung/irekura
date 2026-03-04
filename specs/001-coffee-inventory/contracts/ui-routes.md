# Contract: UI Routes

**Branch**: `001-coffee-inventory` | **Date**: 2026-03-03
**Framework**: Next.js 15 App Router

---

## Route Structure

| Route | File | Auth Required | Description |
|-------|------|---------------|-------------|
| `/` | `app/page.tsx` | No | Redirects to `/inventory` if signed in, `/auth/signin` if not |
| `/auth/signin` | `app/auth/signin/page.tsx` | No | Sign-in page (Google OAuth button) |
| `/inventory` | `app/(protected)/inventory/page.tsx` | Yes | Inventory overview |
| `/inventory/new` | `app/(protected)/inventory/new/page.tsx` | Yes | Add new product |
| `/inventory/[productId]` | `app/(protected)/inventory/[productId]/page.tsx` | Yes | Product detail + batch management |
| `/recommend` | `app/(protected)/recommend/page.tsx` | Yes | Daily recommendation screen |
| `/history` | `app/(protected)/history/page.tsx` | Yes | Calendar consumption history |
| `/preferences` | `app/(protected)/preferences/page.tsx` | Yes | Preference profiles (weekday/weekend) |
| `/api/auth/[...nextauth]` | `app/api/auth/[...nextauth]/route.ts` | — | NextAuth route handler |

---

## Authentication Guard

The `(protected)` route group uses a shared layout (`app/(protected)/layout.tsx`) that:
1. Calls `auth()` from NextAuth v5 server-side
2. Redirects to `/auth/signin` if no session exists
3. Passes the session `userId` to the Convex provider via a server component boundary

---

## Page Contracts

### `/inventory` — Inventory Overview

**Displays**:
- List of all `CoffeeProduct` records grouped by type (optional) or by nearest expiry
- Each product card shows: name, brand, type badge, total brews remaining (sum across
  active batches), earliest best-before date
- Expiring-soon indicator on any product with a batch ≤30 days from expiry
- Depleted indicator if ALL batches are at 0 brews
- FAB (floating action button) to navigate to `/inventory/new`

**Mobile layout**: Single-column list with swipe-to-expand batch detail
**Desktop layout**: Two-column grid of product cards

---

### `/inventory/new` — Add Product

**Form fields**:
- Product name (text)
- Brand (text)
- Type (segmented control: 4 options)
- Bitterness, Sourness, Richness (each: 1–5 slider or star selector)
- Notes (optional textarea)
- Initial batch: brews remaining (number input), best-before date (date picker)

**Submit**: Creates product + first batch via `api.products.create` then
`api.batches.create`. Redirects to `/inventory/[newProductId]`.

---

### `/inventory/[productId]` — Product Detail

**Displays**:
- Product header: name, brand, type badge, flavour rating chips
- Batch list: each batch shows brews remaining, best-before date, urgency badge,
  and controls to edit quantity or delete batch
- "Add batch" button: opens drawer/dialog for new batch form (bestBeforeDate + brews)
- "Edit product" button: opens drawer for name/brand/type/flavour edits
- "Delete product" button (with confirmation): cascades to all batches and logs

---

### `/recommend` — Daily Recommendation

**Layout**:
1. Mood selector — 4 buttons: Light & Bright, Strong & Rich, Smooth & Balanced, Surprise Me
2. Recommendation card: product name, brand, type, flavour bars, brews remaining,
   best-before date, expiry urgency badge
3. "Drink this" button: creates consumption log → decrements batch → optional rating prompt
4. "Show another" link: cycles to next-ranked result for same mood (stateless — client
   re-runs engine skipping the first result)

**No recommendation available**: Shows empty state with CTA to add coffee

---

### `/history` — Consumption Calendar

**Desktop (≥640px)**: Full monthly calendar grid (7 columns, variable rows)
- Marked days: filled dot indicator
- Tapping a marked day: side panel showing consumption log details for that day

**Mobile (<640px)**: Weekly strip (7-day row, current week centred)
- Previous/next week chevrons for navigation
- Tapping a marked day: bottom sheet with log details

**Navigation**: Month/week arrows; "Today" shortcut button

---

### `/preferences` — Preference Profiles

**Layout**: Two tabs — Weekday / Weekend

Each tab shows:
- Three sliders: Bitterness importance (1–5), Sourness importance (1–5),
  Richness importance (1–5)
- Live preview radar chart (Recharts `<RadarChart>`) showing the current weighting
- Save button (calls `api.preferenceProfiles.upsert`)

**Default state**: Sliders at 3 if no profile exists yet
