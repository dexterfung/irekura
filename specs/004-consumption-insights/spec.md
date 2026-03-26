# Feature Specification: Consumption Insights & Analytics

**Feature Branch**: `004-consumption-insights`
**Created**: 2026-03-26
**Status**: Draft
**Input**: Backlog spec at `specs/004-consumption-insights.md` — surface visual analytics from existing consumption data so users can understand their coffee habits over time.

## Clarifications

### Session 2026-03-26

- Q: Should Insights be a new 5th bottom nav tab or a sub-view within the existing History tab? → A: New 5th bottom nav tab, alongside the existing 4 tabs.
- Q: Should all insight sections appear on a single scrollable page or be separated into tabs? → A: Single scrollable page with all sections stacked vertically. Can be revisited after seeing the result.

## User Scenarios & Testing

### User Story 1 — Overview Dashboard (Priority: P1)

A user opens the Insights page and immediately sees a snapshot of their coffee habits: how many cups they've had this week and this month (with comparison to the prior period), their current consecutive-day streak, and their most consumed product this month.

**Why this priority**: This is the entry point and provides instant value with minimal complexity. Even without charts, users get actionable summary stats from day one.

**Independent Test**: Open Insights page with at least 7 days of consumption data. Verify this-week count, this-month count, period-over-period comparison, streak count, and top product are all displayed and accurate.

**Acceptance Scenarios**:

1. **Given** a user with 14 days of consumption history, **When** they open the Insights page, **Then** they see this-week cup count, this-month cup count, each with a comparison indicator (e.g. "+3 vs last week"), their current streak in days, and the most consumed product name this month.
2. **Given** a user with no consumption history, **When** they open the Insights page, **Then** they see zeroes for all counts, streak of 0, and a message indicating no data yet.
3. **Given** a user who logged coffee every day for the past 5 days but not 6 days ago, **When** they view the streak, **Then** the streak shows 5.

---

### User Story 2 — Consumption Trends Chart (Priority: P2)

A user views a bar chart showing their daily, weekly, or monthly consumption over a selectable time range (7 days, 30 days, 3 months, all time). When guest profile is enabled, bars are visually split to show self vs guest consumption.

**Why this priority**: The trends chart is the core analytics visualisation — it transforms raw log data into a visual pattern that helps users understand their habits. Depends on the dashboard shell from US1.

**Independent Test**: Log coffee over 14 days with varying amounts. Open Insights, switch between time ranges, verify bar chart data matches actual consumption counts per period. Enable guest profile, log some guest entries, verify stacked bars appear.

**Acceptance Scenarios**:

1. **Given** a user with 30 days of consumption data, **When** they select "30 days" time range, **Then** a bar chart displays one bar per day with correct cup counts.
2. **Given** a user selects "7 days" range, **When** they switch to "3 months" range, **Then** the chart updates to show weekly aggregation for the past 3 months.
3. **Given** guest profile is enabled with both self and guest consumption logs, **When** viewing the chart, **Then** each bar is visually split showing self vs guest portions.
4. **Given** a time range with no consumption data for some days, **When** viewing the chart, **Then** those days show zero-height bars (no gaps in the timeline).

---

### User Story 3 — Product Breakdown (Priority: P3)

A user views a breakdown of their consumption by product — a donut chart showing share by product, plus a sortable table listing each product with total cups, percentage of total, and last consumed date.

**Why this priority**: Helps users see which products dominate their rotation and discover underused inventory. Useful but not essential for the core insights experience.

**Independent Test**: Log consumption across 4+ products with varying frequencies. Open the product breakdown view, verify donut chart segments match actual consumption ratios, verify table is sortable by count and recency.

**Acceptance Scenarios**:

1. **Given** a user has consumed 3 different products (10, 5, 2 cups respectively), **When** they view the product breakdown, **Then** the donut chart shows segments proportional to 10/17, 5/17, 2/17, and the table lists all 3 products sorted by count descending by default.
2. **Given** the table is showing, **When** the user taps the "Last consumed" column header, **Then** the table re-sorts by recency.
3. **Given** a user with only 1 product consumed, **When** they view the breakdown, **Then** the donut chart shows a single full segment and the table shows one row at 100%.

---

### User Story 4 — Flavour Profile Over Time (Priority: P4)

A user views a radar chart showing the average bitterness, sourness, and richness of the coffees they consumed in the current period, with an overlay comparing to the previous period to reveal taste drift.

**Why this priority**: An interesting "nice to have" that gives users deeper self-awareness about their taste preferences. Lower priority because it requires understanding the flavour profile data model and is less immediately actionable.

**Independent Test**: Consume a mix of coffees with different flavour profiles over 2 months. Open the flavour profile view, verify the radar chart axes match the 3 flavour dimensions, and verify the current vs previous period comparison is visually distinguishable.

**Acceptance Scenarios**:

1. **Given** a user consumed mostly high-bitterness coffees this month and mostly high-sourness coffees last month, **When** they view the flavour profile, **Then** the radar chart shows current month skewed toward bitterness and previous month skewed toward sourness.
2. **Given** a user with data in only the current month (no previous month), **When** they view the flavour profile, **Then** only the current month shape is shown with no comparison overlay.

---

### User Story 5 — Expiry Waste Rate (Priority: P5)

A user views a statistic showing what percentage of their batches expired with brews still remaining, helping them understand if they're buying appropriate quantities.

**Why this priority**: A useful metric for optimising purchasing behaviour, but it's a single stat that can be added incrementally after the core visualisations are in place.

**Independent Test**: Create several batches — some fully consumed before expiry, some expired with remaining brews. Open the waste rate view, verify the percentage matches actual waste ratio.

**Acceptance Scenarios**:

1. **Given** a user has 10 batches total — 3 expired with brews remaining and 7 fully consumed or still active, **When** they view the waste rate, **Then** it shows 30% waste rate (3 out of 10 completed/expired batches).
2. **Given** a user has no expired batches, **When** they view the waste rate, **Then** it shows 0% waste rate.
3. **Given** a user has only active batches (none expired or fully consumed), **When** they view the waste rate, **Then** it shows a message like "Not enough data yet" rather than 0%.

---

### Edge Cases

- What happens when the user has fewer than 7 days of data? Charts should still render with available data — no minimum threshold required, but comparison metrics (e.g. "vs last week") should be hidden when the comparison period has no data.
- What happens when a user deletes a product that has consumption history? Insights should gracefully handle missing product references (show "Deleted product" or omit from breakdown).
- What happens with timezone differences? All dates use the existing date string format (YYYY-MM-DD) already established in the app — no timezone conversion needed.
- How does the guest filter interact with insights? When guest profile is enabled, a filter control (All / You / Guest) lets users scope all insights to a specific person. Default is "All".

## Requirements

### Functional Requirements

- **FR-001**: System MUST display a summary dashboard with this-week cup count, this-month cup count, consecutive-day streak, and top product of the month.
- **FR-002**: System MUST show period-over-period comparison for weekly and monthly cup counts (e.g. "+3 vs last week", "-2 vs last month").
- **FR-003**: System MUST render a bar chart of consumption over time with selectable time ranges: 7 days, 30 days, 3 months, all time.
- **FR-004**: System MUST aggregate bar chart data appropriately per range — daily bars for 7d/30d, weekly bars for 3 months, monthly bars for all time.
- **FR-005**: System MUST show stacked bars (self vs guest) when guest profile is enabled.
- **FR-006**: System MUST display a donut chart showing consumption share by product.
- **FR-007**: System MUST display a sortable table of products with columns: product name, total cups, percentage of total, last consumed date.
- **FR-008**: System MUST render a radar chart with 3 axes (bitterness, sourness, richness) showing average flavour profile of consumed coffees.
- **FR-009**: System MUST overlay current period vs previous period on the radar chart for taste comparison.
- **FR-010**: System MUST display an expiry waste rate as a percentage of batches that expired with remaining brews.
- **FR-011**: System MUST provide a person filter (All / You / Guest) when guest profile is enabled, scoping all insights to the selected person.
- **FR-012**: System MUST be accessible via a new "Insights" tab in the bottom navigation bar.
- **FR-013**: System MUST display an appropriate empty state when no consumption data exists.
- **FR-014**: System MUST handle deleted products gracefully in all views (omit or label as unavailable).
- **FR-015**: All insights MUST be read-only — no new data entry is required from the user.
- **FR-016**: All chart and summary text MUST be localised (English and Traditional Chinese HK).

### Key Entities

- **Consumption Summary**: Aggregated cup counts per time period (day, week, month) derived from existing consumption logs.
- **Product Breakdown**: Per-product aggregation including total cups, share percentage, and last consumed date.
- **Flavour Profile Snapshot**: Average bitterness, sourness, and richness values for a given time period, derived from the flavour profiles of consumed products.
- **Waste Rate**: Ratio of batches that expired with remaining brews vs total completed/expired batches.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can view their consumption summary within 2 seconds of opening the Insights page.
- **SC-002**: All chart visualisations (bar, donut, radar) render correctly with up to 1 year of consumption data (365+ entries).
- **SC-003**: Time range switching updates the chart within 1 second.
- **SC-004**: Guest filter correctly scopes all displayed data — switching between All/You/Guest shows accurate, mutually consistent numbers.
- **SC-005**: All text, labels, and empty states are fully localised in both supported languages.
- **SC-006**: Users with no consumption history see a clear, helpful empty state rather than broken charts or errors.

## Assumptions

- All required data already exists in `consumptionLogs`, `products`, and `batches` tables — no schema changes are needed.
- Aggregations are computed from existing data at read time; no pre-computed analytics tables are required.
- The bottom navigation bar can accommodate a 5th tab without layout issues on mobile screens.
- Charts use a lightweight charting approach suitable for a mobile-first PWA (no heavy charting library dependencies).
- The "all time" range is bounded by the user's earliest consumption log — there is no need for arbitrary date range selection.

## Out of Scope

- Social sharing / export of stats (considered for future iteration).
- Goal setting (e.g. "drink no more than 3 cups per day").
- Notifications or alerts based on insights data.
- Comparison between multiple users or households.
