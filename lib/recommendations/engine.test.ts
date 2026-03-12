import { describe, it, expect } from "vitest";
import {
  computeExpiryScore,
  computeFlavorScore,
  scoreAndRankBatches,
  getDefaultProfile,
  getDayType,
  type BatchInput,
  type FlavorProfile,
} from "./engine";

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeBatch(overrides: Partial<BatchInput> = {}): BatchInput {
  return {
    batchId: "batch-1",
    productId: "product-1",
    bestBeforeDate: "2026-12-31",
    brewsRemaining: 10,
    product: {
      name: "Test Coffee",
      brand: "Test Brand",
      type: "drip-bag",
      bitterness: 3,
      sourness: 3,
      richness: 3,
    },
    ...overrides,
  };
}

const defaultProfile: FlavorProfile = { bitterness: 3, sourness: 3, richness: 3 };
const today = "2026-03-05";

// ─── computeExpiryScore ─────────────────────────────────────────────────────

describe("computeExpiryScore", () => {
  it("returns expired for past date", () => {
    const result = computeExpiryScore("2026-03-01", today);
    expect(result.score).toBe(200);
    expect(result.urgency).toBe("expired");
  });

  it("returns urgent for today = best-before (0 days left)", () => {
    const result = computeExpiryScore(today, today);
    expect(result.score).toBe(100);
    expect(result.urgency).toBe("urgent");
  });

  it("returns urgent for exactly 7 days left", () => {
    const result = computeExpiryScore("2026-03-12", today);
    expect(result.score).toBe(100);
    expect(result.urgency).toBe("urgent");
  });

  it("returns warning for 8 days left (not urgent)", () => {
    const result = computeExpiryScore("2026-03-13", today);
    expect(result.score).toBe(20);
    expect(result.urgency).toBe("warning");
  });

  it("returns warning for exactly 30 days left", () => {
    const result = computeExpiryScore("2026-04-04", today);
    expect(result.score).toBe(20);
    expect(result.urgency).toBe("warning");
  });

  it("returns ok for 31 days left", () => {
    const result = computeExpiryScore("2026-04-05", today);
    expect(result.score).toBe(0);
    expect(result.urgency).toBe("ok");
  });
});

// ─── computeFlavorScore ─────────────────────────────────────────────────────

describe("computeFlavorScore", () => {
  it("light-bright: ranks high-sourness product above high-bitterness", () => {
    const highSour: FlavorProfile & { bitterness: number; sourness: number; richness: number } = {
      bitterness: 1,
      sourness: 5,
      richness: 3,
    };
    const highBitter: FlavorProfile & {
      bitterness: number;
      sourness: number;
      richness: number;
    } = {
      bitterness: 5,
      sourness: 1,
      richness: 3,
    };

    const sour = computeFlavorScore(highSour, defaultProfile, "light-bright");
    const bitter = computeFlavorScore(highBitter, defaultProfile, "light-bright");
    expect(sour).toBeGreaterThan(bitter);
  });

  it("strong-rich: ranks high-bitterness+richness above mild product", () => {
    const strong = { bitterness: 5, sourness: 2, richness: 5 };
    const mild = { bitterness: 2, sourness: 2, richness: 2 };

    const strongScore = computeFlavorScore(strong, defaultProfile, "strong-rich");
    const mildScore = computeFlavorScore(mild, defaultProfile, "strong-rich");
    expect(strongScore).toBeGreaterThan(mildScore);
  });

  it("smooth-balanced: ranks product closest to (3,3,3) highest", () => {
    const balanced = { bitterness: 3, sourness: 3, richness: 3 };
    const extreme = { bitterness: 5, sourness: 1, richness: 5 };

    const balancedScore = computeFlavorScore(balanced, defaultProfile, "smooth-balanced");
    const extremeScore = computeFlavorScore(extreme, defaultProfile, "smooth-balanced");
    expect(balancedScore).toBeGreaterThan(extremeScore);
  });

  it("surprise-me: ranks product NOT in recent list above product at index 0", () => {
    const recent = ["product-recent", "product-old"];
    const fresh = computeFlavorScore(
      { bitterness: 3, sourness: 3, richness: 3 },
      defaultProfile,
      "surprise-me",
      "product-new",
      recent
    );
    const mostRecent = computeFlavorScore(
      { bitterness: 3, sourness: 3, richness: 3 },
      defaultProfile,
      "surprise-me",
      "product-recent",
      recent
    );
    expect(fresh).toBeGreaterThan(mostRecent);
  });
});

// ─── scoreAndRankBatches ────────────────────────────────────────────────────

describe("scoreAndRankBatches", () => {
  it("returns empty array for empty input", () => {
    const result = scoreAndRankBatches([], defaultProfile, "light-bright", today, []);
    expect(result).toEqual([]);
  });

  it("excludes depleted batches (brewsRemaining = 0)", () => {
    const depleted = makeBatch({ brewsRemaining: 0, batchId: "depleted" });
    const active = makeBatch({ brewsRemaining: 5, batchId: "active" });
    const result = scoreAndRankBatches(
      [depleted, active],
      defaultProfile,
      "light-bright",
      today,
      []
    );
    expect(result).toHaveLength(1);
    expect(result[0].batchId).toBe("active");
  });

  it("ranks expiring batch (≤7 days) above flavour-matched fresh batch", () => {
    const expiring = makeBatch({
      batchId: "expiring",
      productId: "product-expiring",
      bestBeforeDate: "2026-03-10", // 5 days from today
      product: { name: "Expiring", brand: "Brand", type: "drip-bag", bitterness: 1, sourness: 1, richness: 1 },
    });
    const fresh = makeBatch({
      batchId: "fresh",
      productId: "product-fresh",
      bestBeforeDate: "2027-01-01", // > 30 days
      product: { name: "Fresh", brand: "Brand", type: "drip-bag", bitterness: 5, sourness: 5, richness: 5 },
    });
    const result = scoreAndRankBatches(
      [fresh, expiring],
      defaultProfile,
      "strong-rich",
      today,
      []
    );
    expect(result[0].batchId).toBe("expiring");
  });

  it("preserves stable sort for equal-score batches", () => {
    const b1 = makeBatch({ batchId: "b1", productId: "p1", bestBeforeDate: "2027-01-01" });
    const b2 = makeBatch({ batchId: "b2", productId: "p2", bestBeforeDate: "2027-01-01" });
    const b3 = makeBatch({ batchId: "b3", productId: "p3", bestBeforeDate: "2027-01-01" });
    const result = scoreAndRankBatches([b1, b2, b3], defaultProfile, "light-bright", today, []);
    expect(result.map((r) => r.batchId)).toEqual(["b1", "b2", "b3"]);
  });

  it("Surprise Me with excludeProductId set excludes that product", () => {
    const target = makeBatch({ batchId: "target", productId: "product-recent" });
    const other = makeBatch({ batchId: "other", productId: "product-other" });
    const result = scoreAndRankBatches(
      [target, other],
      defaultProfile,
      "surprise-me",
      today,
      ["product-recent"]
    );
    // product-other should rank higher (not in recent list)
    expect(result[0].batchId).toBe("other");
  });

  it("Surprise Me with no recent history returns results without exclusion", () => {
    const b1 = makeBatch({ batchId: "b1", productId: "p1" });
    const b2 = makeBatch({ batchId: "b2", productId: "p2" });
    const result = scoreAndRankBatches([b1, b2], defaultProfile, "surprise-me", today, []);
    expect(result).toHaveLength(2);
  });
});

// ─── getDayType ─────────────────────────────────────────────────────────────

describe("getDayType", () => {
  it("returns weekday for Monday", () => {
    // 2026-03-02 is a Monday
    expect(getDayType("2026-03-02")).toBe("weekday");
  });

  it("returns weekend for Saturday", () => {
    // 2026-03-07 is a Saturday
    expect(getDayType("2026-03-07")).toBe("weekend");
  });
});

// ─── getDefaultProfile ──────────────────────────────────────────────────────

describe("getDefaultProfile", () => {
  it("returns bitterness:3, sourness:3, richness:3", () => {
    expect(getDefaultProfile()).toEqual({ bitterness: 3, sourness: 3, richness: 3 });
  });
});

// ─── Guest profile passthrough ──────────────────────────────────────────────
// Verifies that the recommendation engine produces different results when
// called with a guest FlavorProfile vs. the main account's profile.
// The engine is pure: it accepts a FlavorProfile value and is unaware of
// whether it belongs to a guest or main account.

describe("guest profile passthrough", () => {
  // batchA: high bitterness, low richness — wins when bitterness matters more
  const batchA = makeBatch({
    batchId: "batch-a",
    productId: "p-a",
    product: { name: "Dark Roast", brand: "B", type: "drip-bag", bitterness: 5, sourness: 3, richness: 1 },
  });
  // batchB: low bitterness, high richness — wins when richness matters more
  const batchB = makeBatch({
    batchId: "batch-b",
    productId: "p-b",
    product: { name: "Rich Blend", brand: "B", type: "drip-bag", bitterness: 1, sourness: 3, richness: 5 },
  });
  const batches = [batchA, batchB];

  // strong-rich score = product.bitterness * profile.bitterness + product.richness * profile.richness
  // batchA with mainProfile {bitterness:5, richness:1}: 5*5 + 1*1 = 26
  // batchB with mainProfile {bitterness:5, richness:1}: 1*5 + 5*1 = 10  → A wins
  // batchA with guestProfile {bitterness:1, richness:5}: 5*1 + 1*5 = 10
  // batchB with guestProfile {bitterness:1, richness:5}: 1*1 + 5*5 = 26  → B wins
  it("strong-rich: different top recommendation when bitterness vs richness profile weight differs", () => {
    const mainProfile: FlavorProfile = { bitterness: 5, sourness: 3, richness: 1 };
    const guestProfile: FlavorProfile = { bitterness: 1, sourness: 3, richness: 5 };

    const mainRanked = scoreAndRankBatches(batches, mainProfile, "strong-rich", today, []);
    const guestRanked = scoreAndRankBatches(batches, guestProfile, "strong-rich", today, []);

    expect(mainRanked[0].batchId).toBe("batch-a"); // bitterness wins for main
    expect(guestRanked[0].batchId).toBe("batch-b"); // richness wins for guest
  });

  it("engine does not modify the profile passed in (no mutation side effects)", () => {
    const guestProfile: FlavorProfile = { bitterness: 5, sourness: 1, richness: 5 };
    const original = { ...guestProfile };
    scoreAndRankBatches(batches, guestProfile, "strong-rich", today, []);
    expect(guestProfile).toEqual(original);
  });

  it("passing guest profile to engine yields same type as main account profile", () => {
    const guestProfile: FlavorProfile = { bitterness: 3, sourness: 3, richness: 3 };
    const result = scoreAndRankBatches(batches, guestProfile, "smooth-balanced", today, []);
    expect(Array.isArray(result)).toBe(true);
    result.forEach((r) => expect(typeof r.score).toBe("number"));
  });
});
