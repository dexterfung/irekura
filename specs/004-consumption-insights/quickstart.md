# Quickstart Verification: Consumption Insights & Analytics

## Prerequisites

- `npx convex dev` running (for real-time queries)
- At least 14 days of consumption log data across multiple products
- At least one batch that has expired with brews remaining (for waste rate testing)
- Guest profile enabled with some guest consumption logs (for guest filter testing)

## Verification Checklist

### 1. Navigation
- [ ] "Insights" tab appears as 5th item in bottom nav bar
- [ ] "Insights" tab appears in desktop side nav
- [ ] Tapping "Insights" navigates to `/insights` route
- [ ] Active state highlights correctly when on Insights page
- [ ] All 5 tabs fit without layout issues on mobile (375px width)

### 2. Summary Cards (US1)
- [ ] This-week cup count is displayed and accurate
- [ ] This-month cup count is displayed and accurate
- [ ] Period comparison shows delta (e.g. "+3 vs last week")
- [ ] Comparison is hidden when no prior period data exists
- [ ] Current streak count is accurate (consecutive days from today)
- [ ] Top product of the month is shown with cup count
- [ ] Empty state shows zeroes and helpful message when no data

### 3. Consumption Trends Chart (US2)
- [ ] Bar chart renders with correct data for default time range
- [ ] "7 days" range shows daily bars
- [ ] "30 days" range shows daily bars
- [ ] "3 months" range shows weekly bars
- [ ] "All time" range shows monthly bars
- [ ] Switching ranges updates chart correctly
- [ ] Days with no consumption show zero-height bars
- [ ] With guest profile enabled, bars show stacked self/guest portions
- [ ] Chart is responsive on mobile viewport

### 4. Product Breakdown (US3)
- [ ] Donut chart renders with segments proportional to consumption
- [ ] Table shows product name, total cups, percentage, last consumed date
- [ ] Table is sortable by cup count
- [ ] Table is sortable by last consumed date
- [ ] Single-product case shows 100% in chart and table

### 5. Flavour Radar Chart (US4)
- [ ] Radar chart renders with 3 axes (bitterness, sourness, richness)
- [ ] Current period shape reflects consumed products' average profile
- [ ] Previous period overlay is shown when data exists
- [ ] Only current period shown when no prior period data

### 6. Waste Rate (US5)
- [ ] Waste percentage is displayed and accurate
- [ ] "Not enough data" shown when no batches are completed or expired
- [ ] 0% shown when no batches have expired with remaining brews

### 7. Guest Filter
- [ ] Filter control (All / You / Guest) appears when guest profile is enabled
- [ ] Filter control is hidden when guest profile is disabled
- [ ] Selecting "You" scopes all insights to self-logged data only
- [ ] Selecting guest name scopes all insights to guest-logged data only
- [ ] "All" shows combined data
- [ ] All sections update when filter changes

### 8. Localisation
- [ ] All text renders correctly in English
- [ ] All text renders correctly in Traditional Chinese (HK)
- [ ] Chart labels and empty states are localised

### 9. Cross-cutting
- [ ] `npm test` — all existing + new unit tests pass
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npm run lint` — no lint errors
- [ ] Page loads within 2 seconds with 1 year of data
- [ ] Deleted products handled gracefully (omitted from breakdown)
