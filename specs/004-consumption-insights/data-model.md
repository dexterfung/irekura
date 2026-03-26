# Data Model: Consumption Insights & Analytics

## Overview

This feature is **read-only** — it derives all data from existing tables. No schema changes are required.

## Existing Tables (read from)

### `consumptionLogs`
| Field | Type | Used For |
|-------|------|----------|
| userId | string | Scoping to current user |
| productId | Id<"products"> | Joining to products for breakdown & flavour |
| batchId | Id<"batches"> | Joining to batches for waste rate |
| date | string (YYYY-MM-DD) | Time-based aggregation, streak calculation |
| loggedFor | "self" \| "guest" (optional) | Guest filter: All / You / Guest |

### `products`
| Field | Type | Used For |
|-------|------|----------|
| userId | string | Ownership validation |
| name | string | Product name in breakdown table |
| brand | string | Display in breakdown |
| bitterness | number (1-5) | Flavour radar chart |
| sourness | number (1-5) | Flavour radar chart |
| richness | number (1-5) | Flavour radar chart |

### `batches`
| Field | Type | Used For |
|-------|------|----------|
| userId | string | Ownership validation |
| brewsRemaining | number | Waste rate (expired with remaining > 0) |
| bestBeforeDate | string (YYYY-MM-DD) | Waste rate (expired = bestBefore < today) |

## Derived Entities (computed at read time)

### ConsumptionSummary
Computed from `consumptionLogs` for the current user.

| Field | Type | Description |
|-------|------|-------------|
| thisWeekCount | number | Cups logged in current ISO week |
| lastWeekCount | number | Cups logged in previous ISO week |
| thisMonthCount | number | Cups logged in current calendar month |
| lastMonthCount | number | Cups logged in previous calendar month |
| currentStreak | number | Consecutive days with at least 1 log, counting back from today |
| topProductId | Id<"products"> \| null | Most consumed product in current month |
| topProductName | string \| null | Name of top product |
| topProductCount | number | Cup count of top product this month |

### ConsumptionTrendPoint
One data point per bar in the consumption trends chart.

| Field | Type | Description |
|-------|------|-------------|
| label | string | Period label (e.g. "Mon", "Mar 5", "Week 12", "Jan") |
| date | string | Start date of the period (YYYY-MM-DD) |
| selfCount | number | Cups logged by self in this period |
| guestCount | number | Cups logged by guest in this period |
| totalCount | number | selfCount + guestCount |

### ProductBreakdownEntry
One entry per product in the breakdown view.

| Field | Type | Description |
|-------|------|-------------|
| productId | string | Product ID |
| productName | string | Product name |
| brand | string | Product brand |
| totalCups | number | Total cups consumed (all time or in selected range) |
| percentage | number | Share of total consumption (0-100) |
| lastConsumedDate | string | Most recent consumption date (YYYY-MM-DD) |

### FlavourSnapshot
Aggregated flavour profile for a time period.

| Field | Type | Description |
|-------|------|-------------|
| bitterness | number | Weighted average bitterness of consumed products (1-5 scale) |
| sourness | number | Weighted average sourness of consumed products (1-5 scale) |
| richness | number | Weighted average richness of consumed products (1-5 scale) |
| cupCount | number | Number of cups in this period (for weighting context) |

### WasteStats
Derived from `batches`.

| Field | Type | Description |
|-------|------|-------------|
| totalCompletedOrExpired | number | Batches that are either fully consumed (brewsRemaining = 0) or expired (bestBefore < today) |
| expiredWithRemaining | number | Batches where bestBefore < today AND brewsRemaining > 0 |
| wastePercentage | number | (expiredWithRemaining / totalCompletedOrExpired) × 100 |
| hasEnoughData | boolean | True if totalCompletedOrExpired > 0 |

## Convex Queries (new file: `convex/insights.ts`)

### `insights.consumptionLogs`
- **Args**: none
- **Returns**: All consumption logs for the current user (full records)
- **Used by**: All aggregation functions on the client side

### `insights.allBatches`
- **Args**: none
- **Returns**: All batches for the current user (full records)
- **Used by**: Waste rate calculation

**Note**: Products are already available via `api.products.list`. No new product query needed.

## Aggregation Functions (pure, in `lib/insights/aggregations.ts`)

All functions are pure — no side effects, fully unit-testable.

| Function | Input | Output | Description |
|----------|-------|--------|-------------|
| `computeSummary` | logs[], today | ConsumptionSummary | Week/month counts, streak, top product |
| `computeStreak` | sortedDates[], today | number | Consecutive days counting back from today |
| `computeTrendData` | logs[], range, today | ConsumptionTrendPoint[] | Aggregated trend data for selected range |
| `computeProductBreakdown` | logs[], products[] | ProductBreakdownEntry[] | Per-product consumption stats |
| `computeFlavourSnapshot` | logs[], products[], dateRange | FlavourSnapshot | Weighted average flavour for a period |
| `computeWasteStats` | batches[], today | WasteStats | Expiry waste rate |
| `filterByPerson` | logs[], person | logs[] | Filter logs by "all" \| "self" \| "guest" |
