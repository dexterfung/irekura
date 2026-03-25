# Feature Specification: Product Ratings & Tasting Notes

**Feature Branch**: `006-product-ratings`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "Allow users to rate coffees (1-5 stars) and add free-text tasting notes after consumption. Ratings feed back into the recommendation engine to boost highly-rated products and deprioritize poorly-rated ones."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rate a Coffee After Consumption (Priority: P1) 🎯 MVP

After the user logs a coffee consumption (either by accepting a recommendation or logging
manually), they are presented with an optional prompt to rate the coffee on a 1–5 star scale.
The rating is attached to that specific consumption log entry. The user can skip the prompt
and continue without rating. This is the foundational interaction — every other part of this
feature depends on ratings existing.

**Why this priority**: Without ratings being captured, no other part of this feature (engine
integration, history display, tasting notes) has data to work with. This is the data-entry
foundation.

**Independent Test**: A user logs a coffee, sees the rating prompt, rates it 4 stars, and
verifies the rating is saved by checking the History page where the entry now displays 4 stars.

**Acceptance Scenarios**:

1. **Given** a user has just logged a coffee consumption, **When** the consumption is confirmed,
   **Then** a rating prompt appears offering 1–5 stars and a skip option.
2. **Given** the rating prompt is displayed, **When** the user taps 4 stars and confirms,
   **Then** the rating is saved on the consumption log entry and the prompt dismisses.
3. **Given** the rating prompt is displayed, **When** the user skips it, **Then** no rating is
   saved and the consumption log entry remains without a rating.
4. **Given** a consumption log entry without a rating, **When** the user views it in History,
   **Then** they can tap to add a rating at any time.
5. **Given** a consumption log entry with an existing rating, **When** the user taps it in
   History, **Then** they can update the rating to a different value.

---

### User Story 2 - Ratings Improve Recommendations (Priority: P1) 🎯 MVP

The recommendation engine uses the user's past ratings to adjust product scores. Products the
user has consistently rated highly are boosted in recommendations; products rated poorly are
deprioritized. This makes recommendations improve over time based on actual enjoyment rather
than flavour profile matching alone. Products with no ratings are treated neutrally so new
products are not disadvantaged.

**Why this priority**: This is the core value proposition of the feature — without engine
integration, ratings are just passive data. The user should see the impact of their ratings
reflected in recommendation quality.

**Independent Test**: A user rates Product A as 5 stars three times and Product B as 2 stars
three times. Both have similar flavour profiles. When requesting a recommendation with a mood
that matches both, Product A is recommended first.

**Acceptance Scenarios**:

1. **Given** a user has rated a product 5 stars on their last 3 consumptions, **When** they
   request a recommendation with a mood matching that product's flavour profile, **Then** the
   product's recommendation score is boosted compared to an unrated product with an identical
   flavour profile.
2. **Given** a user has rated a product 1 star on their last 3 consumptions, **When** they
   request a recommendation, **Then** the product's recommendation score is reduced compared to
   an unrated product with an identical flavour profile.
3. **Given** a product has never been rated, **When** the recommendation engine scores it,
   **Then** it receives a neutral multiplier (no boost or penalty), ensuring new products are
   not disadvantaged.
4. **Given** a user initially rated a product 2 stars but recently rated it 4 stars, **When**
   the engine computes the product's rating score, **Then** the recent higher rating carries
   more weight than the older low rating (recency weighting via a sliding window of the last
   5 ratings).
5. **Given** a guest profile is enabled, **When** recommendations are generated for the guest,
   **Then** only ratings from consumption logs attributed to the guest are used, and vice versa
   for the main account.

---

### User Story 3 - Add Tasting Notes (Priority: P2)

Beyond a numeric rating, the user wants to capture what they noticed about a specific cup —
"fruity aftertaste", "too bitter today", "perfect with milk". A free-text tasting notes field
(max 280 characters) is available alongside the rating prompt and on the History page. Notes
are for personal record-keeping and do not affect recommendations.

**Why this priority**: Tasting notes add richness to the consumption record but are not
functionally required for the recommendation engine to benefit from ratings. This can ship
alongside or after ratings without blocking the core value.

**Independent Test**: A user logs a coffee, adds the note "Smooth, slight chocolate finish",
and verifies the note appears on the corresponding History entry.

**Acceptance Scenarios**:

1. **Given** the rating prompt is displayed after consumption, **When** the user types a tasting
   note (up to 280 characters) and confirms, **Then** the note is saved on the consumption log
   entry alongside the rating.
2. **Given** a consumption log entry in History, **When** the user taps it, **Then** they can
   add or edit a tasting note regardless of whether a rating exists.
3. **Given** a user types a note exceeding 280 characters, **When** they attempt to save,
   **Then** the input is limited to 280 characters (truncated or blocked with a character count
   indicator).
4. **Given** a consumption log entry with a tasting note, **When** the user views History,
   **Then** the note is displayed below the entry details.

---

### User Story 4 - View Product Average Rating (Priority: P3)

Over time, a user builds up multiple ratings for the same product across different consumption
occasions. The product detail view shows an aggregate average rating (across all consumption
entries for that product) so the user can see their overall impression at a glance.

**Why this priority**: This is a convenience aggregation. It adds polish but is not required
for the core rating and recommendation flow.

**Independent Test**: A user rates the same product 3, 4, and 5 stars on three separate
occasions. They view the product in the Inventory and see an average rating of 4.0 displayed.

**Acceptance Scenarios**:

1. **Given** a product has been rated on 3 separate consumption log entries (3, 4, 5 stars),
   **When** the user views the product in Inventory, **Then** the average rating (4.0) is
   displayed alongside the product details.
2. **Given** a product has never been rated, **When** the user views it in Inventory, **Then**
   no average rating is displayed (no misleading "0 stars").
3. **Given** the guest profile is enabled, **When** viewing the product detail, **Then** the
   average rating shown reflects only the currently selected person's ratings (self or guest).

---

### Edge Cases

- What happens if the user logs a coffee for the guest and then rates it — is the rating
  attributed to the guest's history?
  → Yes. The rating is stored on the consumption log entry, which already has a `loggedFor`
  field. The rating inherits the same attribution.
- What if the user deletes a consumption log entry that had a rating — does the product's
  average update?
  → Yes. The average is computed dynamically from existing entries, so deleting one
  automatically adjusts the average.
- Can the user rate a coffee without logging consumption (e.g. rating from memory)?
  → No. Ratings are attached to consumption log entries only. There is no standalone rating
  concept.
- What if a product has only 1 rating — does it still get a recommendation boost/penalty?
  → Yes, but the sliding window (last 5 ratings) means a single rating has limited influence
  and will be diluted as more ratings are added.
- What happens to the rating prompt if the user navigates away before rating?
  → The prompt dismisses. The consumption is logged without a rating. The user can rate later
  from History.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display an optional rating prompt (1–5 stars) after each coffee
  consumption is logged.
- **FR-002**: The system MUST allow the user to skip the rating prompt without saving a rating.
- **FR-003**: The system MUST persist ratings on individual consumption log entries, not on
  products globally.
- **FR-004**: The system MUST allow the user to add, view, or update a rating on any past
  consumption log entry from the History page.
- **FR-005**: The system MUST allow the user to add, view, or update a free-text tasting note
  (max 280 characters) on any consumption log entry.
- **FR-006**: The recommendation engine MUST factor in the user's past ratings when scoring
  products, using a sliding window of the last 5 ratings per product.
- **FR-007**: The recommendation engine MUST apply a boost multiplier for products with a high
  average recent rating (>= 4 stars) and a penalty multiplier for products with a low average
  recent rating (<= 2 stars).
- **FR-008**: Products with no ratings MUST receive a neutral multiplier (1.0) in the
  recommendation engine — new products must not be disadvantaged.
- **FR-009**: Guest ratings MUST be stored separately from main account ratings (via the
  existing `loggedFor` attribution on consumption logs) and MUST only influence the
  corresponding person's recommendations.
- **FR-010**: The system MUST display the aggregate average rating for a product in the
  Inventory/product detail view, computed from all consumption log entries for that product
  by the current person.
- **FR-011**: The system MUST NOT display an average rating for products that have never been
  rated — no misleading "0 stars" or empty stars.
- **FR-012**: The tasting notes field MUST enforce a maximum of 280 characters, with a visible
  character count indicator.

### Key Entities

- **Rating**: An integer value (1–5) attached to a single consumption log entry. Represents
  the user's enjoyment of that specific cup. The same product can have different ratings across
  different consumption occasions.
- **Tasting Note**: A free-text string (max 280 characters) attached to a single consumption
  log entry. Captures subjective observations about a specific cup.
- **Product Rating Score**: A computed value (not stored) derived from the average of the last
  5 ratings for a product by a specific person. Used by the recommendation engine as a
  multiplier on the product's recommendation score.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can rate a coffee within 5 seconds of completing a consumption log,
  without navigating to a separate screen.
- **SC-002**: After rating 5+ coffees, the user's top-rated product appears in the top 2
  recommendations when requesting a mood that matches its flavour profile.
- **SC-003**: Products with no ratings appear in recommendations at the same frequency as
  before ratings were introduced — no cold-start penalty.
- **SC-004**: Tasting notes entered on the rating prompt are visible on the corresponding
  History entry immediately without a page reload.
- **SC-005**: The product average rating displayed in Inventory accurately reflects all
  rated consumption entries for that product and person.

## Assumptions

- Ratings are integer values only (no half-stars) — 1, 2, 3, 4, or 5.
- The rating prompt is shown inline (e.g. a bottom sheet or card) after consumption, not as a
  separate page navigation.
- The sliding window for the recommendation engine is fixed at 5 most recent ratings per
  product per person. This is not user-configurable.
- The boost/penalty multiplier values are fixed at launch (not user-configurable). Suggested
  values: >= 4 stars → x1.2 boost, <= 2 stars → x0.8 penalty, 3 stars → x1.0 neutral.
- Tasting notes do not affect recommendations — they are purely for personal record-keeping.
- Deleting a consumption log entry removes its associated rating and note. The product's
  average rating updates accordingly.
- The rating prompt appears for both self and guest consumption logs (when guest profile is
  enabled and the user is logging for the guest).
