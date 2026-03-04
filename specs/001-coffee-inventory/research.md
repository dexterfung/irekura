# Research: Coffee Inventory & Smart Recommendations

**Branch**: `001-coffee-inventory` | **Date**: 2026-03-03
**Phase**: 0 — Technology decisions and integration patterns

---

## 1. Next.js Version

**Decision**: Next.js 15 (latest stable, targeting 15.2.x)

**Rationale**: Next.js 15 is the current stable major version (released Oct 2024, patch
releases continuing through 2026). It ships with React 19 support, stable App Router,
improved Server Actions, Partial Prerendering (PPR), and enhanced Turbopack for local
dev speed. These features are directly useful for this app:
- App Router: file-based routing for the four main screens (inventory, recommend, history,
  preferences)
- Server Actions: form submissions for adding products/batches without custom API routes
- React 19: `useOptimistic` for instant UI feedback on inventory decrements

**TypeScript**: 5.7.x (ships with Next.js 15 toolchain; strict mode required per constitution)

**Alternatives considered**:
- Next.js 14: stable but older; missing React 19 and PPR improvements
- Next.js 14 (Pages Router): explicitly forbidden by constitution (App Router required)

---

## 2. PWA: Serwist vs next-pwa

**Decision**: `@serwist/next` (Serwist)

**Rationale**:
- `next-pwa` (original by shadowwalker) has been unmaintained since 2022; its community
  fork (`@ducanh2912/next-pwa`) maintains it but is a single maintainer effort
- `@serwist/next` is the recommended modern replacement; actively maintained, based on
  Workbox 7, has first-class TypeScript types, and supports the App Router correctly
- Serwist generates a proper service worker with pre-caching of the app shell and runtime
  caching strategies — essential for a PWA that must be installable on mobile

**Configuration**:
- `swSrc: "app/sw.ts"` — service worker source in the App Router directory
- `swDest: "public/sw.js"` — output location
- Cache strategy: **StaleWhileRevalidate** for Next.js static assets; **NetworkFirst**
  for API routes and Convex HTTP endpoints
- `manifest.json` in `/public/` with `display: "standalone"`, `start_url: "/"`,
  appropriate icon sizes (192×192, 512×512, maskable)

**Alternatives considered**:
- `@ducanh2912/next-pwa`: single-maintainer fork; works but less future-proof
- Manual Workbox config: unnecessary complexity (Principle VI violation)

---

## 3. Unit Testing: Vitest

**Decision**: Vitest 2.x with `@testing-library/react`, `@testing-library/user-event`,
`happy-dom`

**Rationale**:
- Vitest is ESM-native, TypeScript-native, and dramatically faster than Jest for a
  Next.js/TypeScript project (no babel transform overhead)
- `happy-dom` is 2–5× faster than `jsdom` for DOM simulation; fully sufficient for
  unit tests of the recommendation engine and utility functions
- The constitution (Principle IV) REQUIRES unit tests for all recommendation engine
  functions — Vitest makes this low-friction
- `@testing-library/react` is the standard for React component tests; pairs well with Vitest

**Test file location**: `lib/recommendations/engine.test.ts` (co-located with source);
component tests in `components/**/*.test.tsx`

**Alternatives considered**:
- Jest: slower, requires extra config for ESM/TypeScript in a Next.js monorepo
- Bun test: built into Bun runtime; the project uses npm/pnpm per constitution

---

## 4. E2E Testing: Playwright

**Decision**: Playwright 1.4x

**Rationale**:
- Playwright is the best-in-class E2E framework for web PWAs: supports mobile viewport
  simulation, service worker interception, and Chromium/Firefox/WebKit
- Native mobile emulation is critical for testing the mobile-first responsive behaviour
  (weekly strip vs. monthly calendar)
- Playwright's `page.emulate` allows testing iPhone-sized viewports and the PWA install
  flow in CI
- The user explicitly requested Playwright

**Configuration**:
- Tests in `tests/e2e/`
- Run against local Next.js dev server or Vercel Preview deployments
- Use Playwright's `storageState` to persist Google OAuth sessions for authenticated tests

**Alternatives considered**:
- Cypress: no native mobile viewport emulation; slower; heavier runtime dependency

---

## 5. Charting: Recharts

**Decision**: Recharts 2.x (RadarChart component) for the flavour-preference radar chart

**Rationale**:
- Recharts has a first-class `<RadarChart>` component with `<Radar>`, `<PolarGrid>`, and
  `<PolarAngleAxis>` — exactly what's needed to visualise bitterness/sourness/richness
  on a three-axis radar
- React-native (uses SVG); no canvas complexity
- Recharts components are client-side only — wrap in a Next.js `"use client"` component
  (standard pattern; no special `dynamic()` import needed since the component boundary
  already isolates it from SSR)
- Smaller bundle than alternatives for this specific use case

**Alternatives considered**:
- Nivo Radar: more visually polished but ~40 kB heavier; violates Principle VI for a
  single chart
- D3 directly: no React abstraction; too complex for a single radar chart use case

---

## 6. Calendar: Custom with date-fns

**Decision**: Custom lightweight calendar components using `date-fns` (already permitted)

**Rationale**:
- `date-fns` is already listed in the approved constitution stack ("officially-maintained
  ecosystem packages")
- The calendar needs are specific: a monthly grid (desktop) and a 7-day strip (mobile),
  both with custom day cells that show a "consumed" indicator dot
- No pre-built calendar library matches this exact two-view requirement without significant
  prop overriding or CSS fighting
- Building two small components (~80–120 lines each) with date-fns is simpler than
  learning and fighting a full calendar library (Principle VI)
- No new dependency added

**Alternatives considered**:
- `react-day-picker` v9: 7 kB gzipped; would work but adds a dependency for something
  achievable with date-fns alone
- `react-big-calendar`: too heavyweight for consumption history dots

---

## 7. shadcn/ui

**Decision**: Use shadcn/ui component registry (copies components into codebase)

**Rationale**:
- shadcn/ui is not a runtime npm package — it is a CLI that copies accessible, styled
  components into `components/ui/`. The actual dependencies are Radix UI primitives
  (accessibility) and `class-variance-authority` (CVA)
- This is justified by the mobile-first requirement (Principle III): Radix UI's focus
  management, keyboard navigation, and ARIA patterns would take weeks to implement
  correctly from scratch
- Components needed: Button, Card, Badge, Dialog/Drawer (mobile-friendly sheet for
  forms), Tabs, Slider (preference profiles), Separator
- New npm dependencies introduced: `@radix-ui/*` primitives, `class-variance-authority`,
  `clsx`, `tailwind-merge` — all small, stable, and tree-shakeable

**Constitution compliance**: Justified under Principle VI (concrete current need:
accessible UI primitives) and Principle III (mobile touch target compliance)

---

## 8. NextAuth v5 + Convex Integration

**Decision**: NextAuth v5 JWT strategy → Convex custom auth provider via JWT validation

**Pattern**:
1. NextAuth v5 configured with `session: { strategy: "jwt" }` and Google provider
2. `convex/auth.config.ts` declares the NextAuth domain and `applicationID: "convex"`
3. Convex validates the NextAuth JWT on every function call via the JWKS endpoint at
   `{NEXTAUTH_URL}/.well-known/jwks.json`
4. In `ctx.auth.getUserIdentity()`, Convex returns the identity with `subject = token.sub`
   (Google user ID via NextAuth)
5. On the client: `ConvexProviderWithAuth` uses a custom `useAuth` hook that reads the
   NextAuth session and returns a fetchAccessToken function for Convex

**Key environment variables**:
- `AUTH_SECRET`: NextAuth session signing secret
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`: Google OAuth credentials
- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL
- `NEXTAUTH_URL`: canonical app URL (e.g., `https://irekura.vercel.app`)

**Alternatives considered**:
- `@convex-dev/auth`: replaces NextAuth entirely; violates constitution Principle V
- Credentials provider: explicitly forbidden by Principle V

---

## 9. Recommendation Engine Architecture

**Decision**: Pure client-side scoring function in `lib/recommendations/engine.ts`

**Algorithm** (deterministic pure function):

```
Input:  activeBatches (BatchWithProduct[]), profile (PreferenceProfile),
        mood (Mood), todayISO (string), recentProductIds (string[])
Output: ScoredBatch[] (sorted descending by score)

Score per batch:
  base_score    = flavorScore(product, profile, mood)
  expiry_bonus  = expiryScore(batch.bestBeforeDate, todayISO)
  total_score   = base_score + expiry_bonus

expiryScore(bestBefore, today):
  daysLeft = diffDays(parseISO(bestBefore), parseISO(today))
  if daysLeft < 0  → 200  (expired: urgent to consume)
  if daysLeft ≤ 7  → 100  (urgent threshold)
  if daysLeft ≤ 30 →  20  (warning threshold)
  else             →   0

flavorScore(product, profile, mood):
  "light-bright":
    sourness_match = product.sourness * profile.sourness
    bitter_penalty = (6 - product.bitterness) * profile.bitterness
    return sourness_match + bitter_penalty

  "strong-rich":
    return product.bitterness * profile.bitterness
         + product.richness   * profile.richness

  "smooth-balanced":
    deviation = |product.bitterness - 3|
              + |product.sourness   - 3|
              + |product.richness   - 3|
    return (15 - deviation) * avgProfileWeight(profile)

  "surprise-me":
    recencyPenalty = recencyScore(product._id, recentProductIds)
    return 50 - recencyPenalty   # picks least-recently-consumed

recencyScore(productId, recentIds):
  idx = recentIds.indexOf(productId)
  if idx === -1  → 0    (never consumed recently: no penalty)
  else           → (recentIds.length - idx) * 10
```

**Why client-side**: Convex queries return real-time data; the scoring is fast (<1 ms for
~200 batches) and stateless; running it on the client avoids a round-trip Convex Action.

**Vitest coverage**: The engine MUST have tests covering all four moods, the expiry
threshold boundaries, and the "surprise me" recency logic.

---

## 10. Vercel Deployment

**Decision**: Vercel (as specified in constitution v1.1.0)

**Configuration**:
- `vercel.json`: no custom config needed for a standard Next.js 15 app
- Environment variables set in Vercel dashboard (not committed to repo)
- Convex deployment: separate Convex cloud project, linked via `NEXT_PUBLIC_CONVEX_URL`
- PWA service worker served from `/public/sw.js` — Vercel serves static files correctly

---

## Summary of New Dependencies (vs. Constitution Stack)

| Package | Justification | Principle |
|---------|--------------|-----------|
| `@serwist/next` | PWA is a stated requirement; app shell caching | I (PWA), VI (immediate need) |
| `@radix-ui/*` + `clsx` + `tailwind-merge` + `class-variance-authority` | shadcn/ui accessible components; mobile touch targets | III (mobile-first) |
| `recharts` | Flavor radar chart; no simpler alternative for 3-axis radar | VI (current concrete need) |
| `vitest` + `@testing-library/react` + `happy-dom` | Unit tests REQUIRED by Principle IV | IV (mandatory) |
| `playwright` | E2E testing of PWA flows; user-requested; warranted by complexity | VI (warranted complexity) |
