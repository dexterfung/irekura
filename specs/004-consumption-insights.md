# Feature: Consumption Insights & Analytics

**Status**: Backlog — not yet planned
**Raised**: 2026-03-25

## Summary

Surface visual analytics from existing consumption data so users can understand their coffee
habits over time. All data already exists in `consumptionLogs`, `products`, and `batches` —
this feature is purely read-side, requiring no new data entry from the user.

## Proposed Views

### 1. Overview Dashboard (default Insights tab)

- **This week / this month** consumption count (cups) with comparison to prior period
- **Streak**: consecutive days with at least one coffee logged
- **Top product**: most consumed product in the current month

### 2. Consumption Trends

- **Daily / weekly / monthly** bar chart of cups consumed
- Toggle between time ranges: 7 days, 30 days, 3 months, all time
- If guest profile is enabled, show stacked bars (self vs guest)

### 3. Flavour Profile Over Time

- Radar chart (or similar) showing the average bitterness / sourness / richness of coffees
  consumed in the selected period
- Compare current month vs previous month to show taste drift

### 4. Product Breakdown

- Pie or donut chart: consumption share by product
- Table view: product name, total cups, percentage of total, last consumed date
- Sortable by count or recency

### 5. Expiry Waste Rate

- Count/percentage of batches that expired (best-before passed) with brews still remaining
- Helps the user buy more appropriate quantities

## Navigation

- New "Insights" tab in the bottom navigation bar (or accessible from the existing History page
  as a sub-tab — to be decided during planning)

## Data Requirements

- All data comes from existing tables; no schema changes expected
- Aggregations should be computed client-side from Convex queries or via Convex aggregation
  queries if performance requires it

## Guest Profile Interaction

- When guest profile is enabled, insights can be filtered by person (All / Self / Guest)
- Default view shows combined data

## Open Questions

- Should insights be a new top-level tab or a sub-view within History?
- What is the minimum amount of data before showing charts (e.g. at least 7 days of logs)?
- Should there be a "share my stats" export (image/text) for social sharing?
