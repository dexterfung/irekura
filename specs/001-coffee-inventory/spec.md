# Feature Specification: Coffee Inventory & Smart Daily Recommendations

**Feature Branch**: `001-coffee-inventory`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User description: "Build Irekura, a PWA to manage a personal coffee inventory and get smart daily recommendations."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage Coffee Inventory (Priority: P1)

The user adds coffee products they own to a personal inventory. Each product has a type (drip
bag, ground bean, concentrate capsule, or instant powder sachet), a brand/name, and a flavour
profile (bitterness, sourness, and richness rated 1–5). Because the same product is purchased
repeatedly, each purchase is stored as a separate batch with its own quantity (brews remaining)
and best-before date. The user can add new batches, edit quantities after consuming, and remove
depleted or discarded batches. The inventory overview shows all products with their active
batches and highlights items expiring soon.

**Why this priority**: Without inventory data, no other feature — recommendations, history, or
ratings — can function. This is the essential data-entry foundation of the app.

**Independent Test**: A user can open the app, add three different coffee products with at least
two batches each, view them all in the inventory list with correct quantities and best-before
dates, and edit or delete a batch — all without any other feature being active.

**Acceptance Scenarios**:

1. **Given** an empty inventory, **When** the user adds a drip-bag product (name, brand, flavour
   ratings, brews, best-before date), **Then** the product appears in the inventory list with the
   correct details and quantity.
2. **Given** an existing product, **When** the user adds a second batch with a different
   best-before date, **Then** both batches appear under the same product, each with their own
   quantity and date.
3. **Given** a batch with 1 brew remaining, **When** the user decrements it, **Then** the batch
   quantity reaches 0 and the app marks it as depleted (visually distinct from active batches).
4. **Given** a batch whose best-before date is within 30 days, **When** the user views the
   inventory, **Then** the batch is visually flagged as expiring soon.
5. **Given** a batch, **When** the user edits the brews-remaining value, **Then** the updated
   quantity is saved and reflected immediately.
6. **Given** a depleted or discarded batch, **When** the user deletes it, **Then** it is
   removed from the inventory; if it was the only batch for a product, the product is also
   removed.

---

### User Story 2 - Get a Daily Coffee Recommendation (Priority: P2)

At any point during the day, the user opens the recommendation screen and selects a mood:
**Light & Bright**, **Strong & Rich**, **Smooth & Balanced**, or **Surprise Me**. The app
evaluates the active inventory and returns one recommended coffee (product + batch) that best
matches the chosen mood alongside the user's preference profile for the current day type
(weekday or weekend), with expiry urgency acting as a tiebreaker that elevates imminently
expiring batches. The user can accept the recommendation (which logs the consumption and
decrements the batch) or ask for an alternative from the same mood.

**Why this priority**: Smart recommendations are the core value proposition of Irekura.
Once inventory exists (P1), the recommendation screen delivers immediate value with or
without a configured preference profile (it degrades gracefully to expiry-first ordering).

**Independent Test**: With at least two products in inventory (including one expiring within 7
days), the user opens the recommendation screen, selects a mood, receives a recommendation, and
the recommendation correctly elevates the near-expiry batch above a fresher alternative with a
similar flavour profile.

**Acceptance Scenarios**:

1. **Given** a populated inventory and the mood "Light & Bright", **When** the user requests a
   recommendation, **Then** the app suggests the coffee with the highest sourness / lowest
   bitterness score that has stock available, adjusted for expiry urgency.
2. **Given** a populated inventory and the mood "Strong & Rich", **When** the user requests a
   recommendation, **Then** the app suggests the coffee with the highest richness / bitterness
   score that has stock available, adjusted for expiry urgency.
3. **Given** a populated inventory and the mood "Smooth & Balanced", **When** the user requests
   a recommendation, **Then** the app suggests the coffee with mid-range scores across all
   flavour dimensions, adjusted for expiry urgency.
4. **Given** any mood and an inventory where one batch expires within 7 days, **When** the user
   requests a recommendation, **Then** that batch is recommended ahead of similarly-profiled
   fresher alternatives.
5. **Given** the mood "Surprise Me", **When** the user requests a recommendation, **Then** the
   app selects a coffee that differs from the user's most recently consumed product, ensuring
   variety.
6. **Given** a recommendation the user does not want, **When** the user taps "Show another",
   **Then** the app returns the next-best match from the same mood category.
7. **Given** an empty inventory, **When** the user opens the recommendation screen, **Then** the
   app displays a prompt to add coffee to the inventory first.

---

### User Story 3 - Log Consumption and Rate Coffees (Priority: P3)

After drinking a coffee (whether from a recommendation or their own choice), the user logs the
consumption: they select the product and batch, confirm the date (defaulting to today), and
optionally assign a 1–5 star rating. The batch quantity decrements automatically. The user can
view a monthly calendar where each day that had a consumption is marked; tapping a day shows
what was consumed and any rating given. Logging can also be done directly from the
recommendation acceptance flow.

**Why this priority**: Consumption history and ratings close the feedback loop — they make the
inventory self-maintaining and provide data that can improve future recommendations. This is
valuable but not required for the core recommendation workflow to function.

**Independent Test**: With a populated inventory, the user manually logs a consumption for
yesterday (selecting product and batch), gives it 3 stars, then opens the calendar to verify
yesterday is marked and the batch quantity has decreased by 1.

**Acceptance Scenarios**:

1. **Given** a populated inventory, **When** the user logs a consumption (product, batch, date,
   optional rating), **Then** the batch's brews-remaining decreases by 1 and the log entry
   appears on the calendar for the selected date.
2. **Given** a log entry, **When** the user taps that day on the calendar, **Then** the app
   shows the product name, batch best-before date, consumption date, and rating (if provided).
3. **Given** a recommendation the user accepts, **When** the acceptance is confirmed, **Then** a
   consumption log is automatically created for today and the batch quantity decrements, with the
   user optionally prompted to rate.
4. **Given** the calendar view, **When** the user navigates between months, **Then** each month's
   consumed days are visually marked and the view loads within 2 seconds.
5. **Given** a consumption log entry, **When** the user adds or changes the rating, **Then** the
   rating is saved and reflected in the calendar detail view.

---

### User Story 4 - Configure Personal Preference Profiles (Priority: P4)

The user configures two preference profiles — one for weekdays and one for weekends. Each
profile specifies the importance the user places on bitterness, sourness, and richness
(each on a 1–5 scale). The recommendation engine uses the profile matching the current day
type to weight flavour scores when selecting a recommendation. The user can update either
profile at any time; changes take effect immediately on the next recommendation.

**Why this priority**: Preference profiles personalise recommendations. The app works without
them (defaulting to expiry-first ordering), so this is an enhancement rather than a blocker.

**Independent Test**: The user sets the weekday profile to high bitterness (5) and low sourness
(1), then requests a recommendation on a weekday with a mixed inventory — the recommended
coffee should be the highest-bitterness option available (expiry not a factor).

**Acceptance Scenarios**:

1. **Given** no preference profile exists, **When** the user opens the profile settings,
   **Then** default mid-range values (3/3/3 for bitterness/sourness/richness) are shown and
   the recommendation engine uses expiry-first ordering.
2. **Given** a weekday profile with bitterness=5, sourness=1, richness=3, **When** the user
   requests a recommendation on a weekday, **Then** the recommendation prioritises the highest-
   bitterness coffee in inventory (above expiry urgency except within 7-day threshold).
3. **Given** separate weekday and weekend profiles, **When** the user requests a recommendation,
   **Then** the app automatically uses the profile matching whether today is a weekday or weekend.
4. **Given** the profile settings, **When** the user updates a value and saves, **Then** the
   change is reflected immediately on the next recommendation request.

---

### Edge Cases

- **Empty inventory at recommendation time**: App displays a clear prompt to add coffee products
  rather than an error.
- **All inventory batches expired**: App still recommends (most recently expired first as a
  fallback) and displays a warning that all stock is past its best-before date.
- **Batch quantity reaches zero**: The batch is automatically marked depleted; the recommendation
  engine excludes depleted batches.
- **Multiple batches of the same product with identical best-before dates**: Treated as distinct
  batches; consumed in order of whichever was added first.
- **"Surprise Me" with only one product in inventory**: App recommends that product and informs
  the user that variety is limited.
- **"Surprise Me" with no prior consumption history**: No product is excluded; the app recommends
  the highest-scored active batch for the current day type with no variety constraint applied.
- **User logs a consumption for a batch already at zero**: App prevents this and prompts the user
  to check the quantity.
- **Best-before date is today**: Treated as urgent (same as within 7-day threshold).
- **Mood selection on a public holiday vs. weekday**: App has no concept of public holidays;
  the weekday/weekend distinction is based solely on the day of the week.

## Requirements *(mandatory)*

### Functional Requirements

**Inventory Management**

- **FR-001**: The app MUST support four coffee product types: drip bag, ground bean, concentrate
  capsule, and instant powder sachet.
- **FR-002**: Each coffee product MUST have: name, brand, type, bitterness rating (1–5),
  sourness rating (1–5), and richness rating (1–5).
- **FR-003**: Each product MUST support multiple independent batches, each with a
  brews-remaining count and a best-before date.
- **FR-004**: The app MUST allow the user to create, edit, and delete products and individual
  batches.
- **FR-005**: The app MUST visually distinguish batches expiring within 30 days from those with
  longer shelf life.
- **FR-006**: The app MUST visually distinguish depleted batches (0 brews remaining) from active
  ones.

**Recommendation Engine**

- **FR-007**: The app MUST provide a daily recommendation screen with four mood options:
  Light & Bright, Strong & Rich, Smooth & Balanced, and Surprise Me.
- **FR-008**: The recommendation engine MUST only consider batches with at least 1 brew
  remaining.
- **FR-009**: Batches expiring within 7 days MUST be ranked above otherwise equivalent options.
- **FR-010**: The recommendation algorithm MUST use the weekday preference profile on Monday–
  Friday and the weekend profile on Saturday–Sunday.
- **FR-011**: The recommendation MUST display the product name, type, brand, flavour ratings,
  brews remaining, and best-before date.
- **FR-012**: The user MUST be able to request an alternative recommendation without changing
  mood.

**Consumption Logging**

- **FR-013**: Accepting a recommendation MUST automatically log a consumption entry for today
  and decrement the batch quantity by 1.
- **FR-014**: The user MUST be able to manually log a consumption for any date (past or present)
  by selecting a product and batch.
- **FR-015**: Each consumption log entry MUST store the product, batch, date, and an optional
  1–5 star rating.
- **FR-016**: The user MUST be able to add or update a rating on any existing log entry.

**Calendar & History**

- **FR-017**: The app MUST display a monthly calendar view where days with consumption entries
  are visually marked.
- **FR-018**: Tapping a marked calendar day MUST show a detail view of all consumption entries
  for that day, including product name, batch best-before date, and rating (if set).
- **FR-019**: The calendar MUST support navigation to any prior month. On mobile viewports, navigation is week-based (previous/next week); on desktop viewports, navigation is month-based (previous/next month).

**Preference Profiles**

- **FR-020**: The app MUST maintain two preference profiles: weekday and weekend.
- **FR-021**: Each profile MUST allow the user to set the importance of bitterness, sourness,
  and richness, each on a 1–5 scale.
- **FR-022**: When no profile has been configured, the recommendation engine MUST use a neutral
  default profile (bitterness: 3, sourness: 3, richness: 3), applying equal importance to all
  flavour dimensions; this makes expiry urgency the effective primary tiebreaker.

### Key Entities

- **CoffeeProduct**: Represents a distinct coffee item. Attributes: name, brand, type (one of
  four categories), bitterness (1–5), sourness (1–5), richness (1–5), optional notes. One
  product can have many batches.
- **CoffeeBatch**: Represents a single purchase of a product. Attributes: reference to product,
  brews remaining (integer ≥ 0), best-before date, purchase date (for tie-breaking). A batch
  belongs to exactly one product.
- **ConsumptionLog**: Records a single drink event. Attributes: reference to product, reference
  to batch, date, optional rating (1–5 stars).
- **PreferenceProfile**: Stores the user's flavour priorities. Attributes: type (weekday or
  weekend), bitterness importance (1–5), sourness importance (1–5), richness importance (1–5).
  Exactly two profiles exist per user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add a new coffee product with two batches in under 60 seconds.
- **SC-002**: The daily recommendation is displayed within 2 seconds of the user selecting a
  mood.
- **SC-003**: A user can log a consumption and decrement inventory in a single confirmation
  action (no more than 3 taps from the recommendation screen).
- **SC-004**: The inventory overview gives clear at-a-glance visibility of which batches expire
  within 30 days without requiring any additional navigation.
- **SC-005**: The calendar history view loads and displays up to 12 months of consumption
  entries without visible delay.
- **SC-006**: 100% of functional requirements can be completed without a desktop browser — the
  app is fully usable on a mobile device screen.

## Assumptions

- Flavour profiles for products (bitterness, sourness, richness) are entered manually by the
  user on a 1–5 scale; there is no integration with an external coffee product database.
- "Brews remaining" is entered directly by the user as an integer; for ground beans, the user
  pre-calculates how many brews their bag yields.
- The recommendation engine produces one primary result per mood selection; users can request
  alternatives but there is no side-by-side comparison view.
- "Weekday" means Monday–Friday; "weekend" means Saturday–Sunday. Public holidays are not
  distinguished.
- The expiry urgency threshold for elevated recommendation priority is 7 days; the visual
  warning in the inventory list uses a 30-day threshold.
- The app is a single-user personal utility; there is no account sharing or multi-user access.
- Authentication is handled externally (user must be signed in); the app does not need to
  manage sign-up or password recovery flows.
