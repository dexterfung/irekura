# Research: Consumption Insights & Analytics

## Decision 1: Charting Library

**Decision**: Use Recharts (already installed in the project as `recharts: ^2.14.1`)

**Rationale**:
- Already a project dependency — zero additional bundle cost
- Component-based React API that integrates naturally with Next.js App Router (as `"use client"` components)
- Built-in support for all three required chart types: `BarChart` (with stacking), `PieChart` (donut via inner/outer radius), `RadarChart`
- `ResponsiveContainer` wrapper provides mobile-responsive charts out of the box
- ~40 KB gzipped — reasonable for a charting library
- Well-maintained (24K+ GitHub stars, active development)

**Alternatives considered**:
- **Chart.js + react-chartjs-2**: Rejected — 173 KB gzipped, significantly larger with no benefit over Recharts for this use case
- **Nivo**: Rejected — 343 KB gzipped, App Router compatibility issues
- **Visx (Airbnb)**: Rejected — D3-level complexity for standard chart types violates Principle VI; no built-in radar chart
- **Custom SVG**: Rejected — unnecessary implementation effort when Recharts already handles all three chart types; violates Principle VI (Simplicity)

## Decision 2: Data Aggregation Architecture

**Decision**: Pure functions in `lib/insights/aggregations.ts` + Convex queries in `convex/insights.ts`

**Rationale**:
- Follows the established pattern from `lib/recommendations/engine.ts` — pure functions for testable logic, Convex queries for data fetching
- Aggregation functions (streak calculation, period comparison, product ranking) are pure and unit-testable
- Convex queries fetch raw data and return it to the client; client-side pure functions aggregate
- No pre-computed analytics tables — data volume is small enough (single user, ~365 entries/year) for real-time aggregation
- Constitution Principle IV requires pure functions with unit tests for core logic

**Alternatives considered**:
- **Server-side aggregation in Convex**: Rejected for complex aggregations — Convex query limitations make multi-table joins and complex grouping awkward; simpler to fetch and aggregate client-side at this data scale
- **Pre-computed analytics table**: Rejected — unnecessary for single-user scale; adds schema complexity and write-path overhead

## Decision 3: Page Layout

**Decision**: Single scrollable page with all insight sections stacked vertically

**Rationale**:
- Simpler to implement (no sub-navigation state management)
- Mobile-first "feed" pattern — users can scroll through all insights in one flow
- Confirmed during clarification session (2026-03-26) with option to revisit if page feels too long

**Alternatives considered**:
- **Tabbed/segmented layout**: Deferred — can be refactored later if the single page becomes unwieldy

## Decision 4: Navigation Placement

**Decision**: New 5th bottom nav tab labelled "Insights"

**Rationale**:
- 5 tabs is standard for mobile apps (WhatsApp, Instagram)
- Current tabs use `flex-1` layout — 5 items at 20% width each fit comfortably on modern phones (375px+)
- Keeps Insights highly discoverable as top-level navigation
- Confirmed during clarification session (2026-03-26)

**Alternatives considered**:
- **Sub-tab within History**: Rejected — would overload the History page and reduce discoverability
- **Replace History tab**: Rejected — History and Insights serve different purposes (logging vs analytics)
