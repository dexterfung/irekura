# Feature: Barcode Scanning

**Status**: Backlog — not yet planned
**Raised**: 2026-03-25

## Summary

Let users scan a product barcode (EAN/UPC) with their phone camera to auto-fill product
details when adding a new coffee to their inventory. Reduces manual data entry friction,
especially for commercially packaged products.

## How It Works

1. User taps "Scan Barcode" on the Add Product screen
2. Camera viewfinder opens (using a browser-based barcode scanning library)
3. Barcode is detected and decoded (EAN-13, UPC-A, or similar)
4. The app looks up the barcode against a product data source (see below)
5. If found: product name, brand, and any available details are pre-filled into the form
6. If not found: the barcode number is stored, but the user fills in details manually
7. User reviews, adjusts, and confirms — then proceeds as normal

## Barcode Scanning Library

Options (all browser-based, no native app required):

- **ZXing-js** (`@aspect-software/barcode-reader` or `@aspect-software/zxing-js`) — mature,
  widely used, supports multiple barcode formats
- **QuaggaJS** — lightweight, EAN/UPC focused
- **Barcode Detection API** — native browser API (Chrome/Edge on Android), no library needed
  but limited browser support

Recommendation: Start with a well-supported library (ZXing-js or similar) with Barcode
Detection API as a progressive enhancement where available.

## Product Data Source

This is the biggest open question. Options:

### Option A: Open Food Facts API

- Free, open-source product database (https://world.openfoodfacts.org)
- Has coffee products, but coverage varies by region
- REST API, no key required
- Returns: product name, brand, image, categories
- **Pro**: Free, no signup, decent global coverage
- **Con**: Coffee-specific coverage may be patchy; no flavour profile data

### Option B: User-contributed local database

- When a user scans a barcode and manually fills in details, store the barcode-to-product
  mapping in the app's own database
- Over time, the app builds its own product catalog from user contributions
- **Pro**: Perfectly tailored to coffee products; gets better over time
- **Con**: Starts empty; only useful after critical mass of users

### Option C: Hybrid

- Try Open Food Facts first; if no result, fall back to the local database; if still no
  result, manual entry
- User-entered data is stored locally for future lookups
- **Pro**: Best of both worlds
- **Con**: More implementation complexity

Recommendation: Start with Option A (Open Food Facts) with manual fallback. Option B/C can
be added later if the user base grows.

## What Gets Auto-Filled

From a barcode lookup, the following fields can potentially be pre-filled:

- Product name
- Brand
- Product type (if detectable from category data — e.g. "instant coffee", "ground coffee")
- Image (if available from the API)

**Not auto-filled** (user must enter):
- Flavour profile (bitterness, sourness, richness) — subjective, not in barcode databases
- Batch details (quantity, best-before date) — specific to this purchase

## Schema Changes

### Modified tables

- `products` — add optional field:
  - `barcode: v.optional(v.string())` — EAN/UPC barcode string

### No new tables required initially

(A local product catalog table would be added if Option B/C is pursued later)

## UI Changes

1. **Add Product form** — "Scan Barcode" button (shows camera permission prompt on first use)
2. **Camera viewfinder** — overlay with barcode detection guide frame
3. **Auto-fill confirmation** — show pre-filled fields with edit capability before saving
4. **Product detail** — optionally display barcode number

## PWA Considerations

- Camera access requires HTTPS (already required for PWA)
- Camera permission is requested via the browser's standard permission flow
- Scanning should work offline (barcode detection is client-side); lookup falls back to
  "not found" if offline

## Guest Profile Interaction

- No interaction — barcode scanning is about product entry, which is account-level

## Open Questions

- Should the app store product images from barcode lookups, or just link to them?
- Should there be a "scan history" showing recently scanned barcodes?
- Is there a preferred barcode scanning library the project should use?
- Should the barcode field be searchable (e.g. "show me all products with this barcode")?
