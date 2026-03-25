# Feature: Cost Tracking

**Status**: Backlog — not yet planned
**Raised**: 2026-03-25

## Summary

Track how much the user spends on coffee. Since products are purchased from different countries
and in different currencies, the system needs to handle multi-currency input gracefully.

## Multi-Currency Approach: Original + Home Currency (decided)

- Each batch stores `price` + `currency` (original, e.g. 1500 JPY) AND `homeCurrencyAmount`
  (the amount the user actually paid in their home currency, e.g. 90 HKD)
- The user is the source of truth for the home currency amount — they enter or confirm it
- All aggregation (monthly spend, cost per cup, trends) uses `homeCurrencyAmount` only
- The original price + currency is kept for reference
- No external API dependency; works fully offline; handles cash exchange, credit card rates,
  duty-free purchases, gifts, etc.

## Data Entry

- When adding or editing a batch, two optional fields appear:
  - **Price**: numeric input + currency selector (e.g. "1500 JPY")
  - **Home currency amount**: auto-suggested if a conversion API is available, but always
    editable (e.g. "~90 HKD")
- Both fields are optional — cost tracking is opt-in per batch
- Currency selector shows recently used currencies first, then a searchable full list

## Analytics

- **Cost per cup**: `homeCurrencyAmount / brews` for each batch
- **Monthly spend**: sum of `homeCurrencyAmount` for batches purchased in that month
- **Spend by product type**: drip bag vs ground bean vs capsule vs instant
- **Average cost per cup** over time (trend line)
- These could live in the Insights page (004) as a "Cost" tab, or standalone

## Schema Changes

### Modified tables

- `batches` — add optional fields:
  - `price: v.optional(v.number())` — price in original currency
  - `priceCurrency: v.optional(v.string())` — ISO 4217 currency code (e.g. "JPY", "HKD")
  - `homeCurrencyAmount: v.optional(v.number())` — amount in user's home currency

### Modified tables

- `userSettings` — add optional field:
  - `homeCurrency: v.optional(v.string())` — ISO 4217 code, default "HKD"

## UI Changes

1. **Add/Edit Batch form** — price and currency fields (collapsible "Cost" section)
2. **Batch detail** — show original price and home currency amount
3. **Insights / Cost tab** — charts for spend trends and cost per cup
4. **Preferences** — home currency selector

## Guest Profile Interaction

- Cost is per-batch, not per-person — the batch cost is the same regardless of who drinks it
- Cost-per-cup analytics could optionally split by person if guest profile is enabled

## Open Questions

- Should "purchase date" be added to batches (separate from the date the batch was added to
  the app) for more accurate monthly spend tracking?
- Should the currency list be a static list of common currencies or the full ISO 4217 set?
- Should there be an optional conversion rate API hint (e.g. auto-suggest the home currency
  amount) while keeping the user-entered value as the source of truth?
