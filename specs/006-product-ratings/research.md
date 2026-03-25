# Research: Product Ratings & Tasting Notes

**Feature**: 006-product-ratings
**Date**: 2026-03-25

## Research Summary

This feature has minimal unknowns — the tech stack is fixed (constitution), the rating
infrastructure is partially implemented, and the recommendation engine modification is
well-scoped. Research focused on confirming implementation patterns and engine integration
design.

## R1: Rating Multiplier Design for Pure Recommendation Engine

**Decision**: Add a `computeRatingMultiplier()` pure function that maps average recent rating
to a multiplier, applied to the flavour score only.

**Rationale**:
- Keeps the engine pure (Principle IV) — the multiplier function is deterministic with no
  side effects
- Applying to flavour score only preserves expiry urgency (clarification decision)
- Excluding "Surprise Me" mood preserves variety intent (clarification decision)
- The sliding window (last 5 ratings) is implemented at the Convex query level, not in the
  engine — the engine receives a pre-computed average

**Alternatives considered**:
- Additive bonus (e.g. +10 points for high rating): Rejected — multiplicative scaling is
  proportional to existing flavour score, preventing ratings from dominating low-flavour-match
  products
- Separate rating sort pass: Rejected — adds complexity; a single-pass multiplier is simpler

## R2: Tasting Notes Storage Pattern

**Decision**: Add `tastingNotes` as an optional string field directly on `consumptionLogs`
table, matching the existing `rating` field pattern.

**Rationale**:
- No separate table needed — notes are 1:1 with consumption log entries
- Same pattern as existing `rating` field (optional, per-entry)
- 280-char limit enforced at mutation level (Convex validator)
- No full-text search requirement — notes are for personal reference only

**Alternatives considered**:
- Separate `tastingNotes` table: Rejected — unnecessary indirection for a single optional
  field; violates Principle VI
- Rich text / markdown: Rejected — plain text is sufficient for short notes

## R3: Product Average Rating Computation

**Decision**: Compute average rating at query time (Convex query), not stored as a
materialized aggregate.

**Rationale**:
- Personal utility app with small data volume — no performance concern
- Avoids maintaining a separate aggregate that must be kept in sync on every rating
  create/update/delete
- Convex reactive queries automatically update the UI when underlying data changes
- For the recommendation engine, a separate query returns the last 5 ratings per product
  (sliding window)

**Alternatives considered**:
- Materialized aggregate on products table: Rejected — adds sync complexity for minimal
  performance gain at this scale
- Client-side computation from all logs: Rejected — better to filter at the query level

## R4: Existing Infrastructure Audit

**Decision**: Reuse all existing rating infrastructure; extend rather than replace.

**Rationale**: Audit confirmed the following already works end-to-end:
- Schema: `rating: v.optional(v.number())` on `consumptionLogs` ✓
- Create mutation: accepts `rating` arg with 1–5 validation ✓
- Rate mutation: updates existing log's rating ✓
- UI: Star rating components on Recommend and History pages ✓
- i18n: Star rating labels and prompt text ✓

Only extensions needed:
- `tastingNotes` field (schema + mutations)
- Rating multiplier in engine
- Product average rating query + Inventory display
