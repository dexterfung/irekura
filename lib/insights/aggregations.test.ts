import { describe, it, expect } from "vitest";
import {
  filterByPerson,
  computeStreak,
  computeSummary,
  computeTrendData,
  computeProductBreakdown,
  computeFlavourSnapshot,
  computeWasteStats,
  type ConsumptionLog,
  type Product,
  type Batch,
} from "./aggregations";

// --- Test Helpers ---

function makeLog(
  overrides: Partial<ConsumptionLog> & { date: string }
): ConsumptionLog {
  return {
    _id: Math.random().toString(),
    productId: "prod1",
    batchId: "batch1",
    loggedFor: "self",
    ...overrides,
  };
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    _id: "prod1",
    name: "Ethiopian Yirgacheffe",
    brand: "Blue Bottle",
    bitterness: 3,
    sourness: 4,
    richness: 2,
    ...overrides,
  };
}

function makeBatch(overrides: Partial<Batch> = {}): Batch {
  return {
    _id: Math.random().toString(),
    brewsRemaining: 0,
    bestBeforeDate: "2026-06-01",
    ...overrides,
  };
}

// --- filterByPerson ---

describe("filterByPerson", () => {
  const logs: ConsumptionLog[] = [
    makeLog({ date: "2026-03-01", loggedFor: "self" }),
    makeLog({ date: "2026-03-02", loggedFor: "guest" }),
    makeLog({ date: "2026-03-03", loggedFor: "self" }),
    makeLog({ date: "2026-03-04", loggedFor: "guest" }),
    makeLog({ date: "2026-03-05" }), // undefined loggedFor = self
  ];

  it("returns all logs for 'all'", () => {
    expect(filterByPerson(logs, "all")).toHaveLength(5);
  });

  it("returns only self logs for 'self'", () => {
    const result = filterByPerson(logs, "self");
    expect(result).toHaveLength(3);
    expect(result.every((l) => l.loggedFor !== "guest")).toBe(true);
  });

  it("returns only guest logs for 'guest'", () => {
    const result = filterByPerson(logs, "guest");
    expect(result).toHaveLength(2);
    expect(result.every((l) => l.loggedFor === "guest")).toBe(true);
  });
});

// --- computeStreak ---

describe("computeStreak", () => {
  it("returns 0 for no dates", () => {
    expect(computeStreak([], "2026-03-26")).toBe(0);
  });

  it("returns streak of consecutive days ending today", () => {
    const dates = ["2026-03-24", "2026-03-25", "2026-03-26"];
    expect(computeStreak(dates, "2026-03-26")).toBe(3);
  });

  it("returns 0 if no log today", () => {
    const dates = ["2026-03-24", "2026-03-25"];
    expect(computeStreak(dates, "2026-03-26")).toBe(0);
  });

  it("stops at gap", () => {
    const dates = ["2026-03-23", "2026-03-25", "2026-03-26"];
    expect(computeStreak(dates, "2026-03-26")).toBe(2);
  });

  it("handles duplicate dates", () => {
    const dates = ["2026-03-25", "2026-03-25", "2026-03-26", "2026-03-26"];
    expect(computeStreak(dates, "2026-03-26")).toBe(2);
  });
});

// --- computeSummary ---

describe("computeSummary", () => {
  const products = [
    makeProduct({ _id: "prod1", name: "Ethiopian" }),
    makeProduct({ _id: "prod2", name: "Colombian" }),
  ];

  it("returns zeroes for no logs", () => {
    const result = computeSummary([], products, "2026-03-26");
    expect(result.thisWeekCount).toBe(0);
    expect(result.lastWeekCount).toBe(0);
    expect(result.thisMonthCount).toBe(0);
    expect(result.lastMonthCount).toBe(0);
    expect(result.currentStreak).toBe(0);
    expect(result.topProductId).toBeNull();
    expect(result.topProductName).toBeNull();
  });

  it("counts cups in current and previous week/month", () => {
    // 2026-03-26 is a Thursday. Week starts Monday 2026-03-23.
    const logs = [
      makeLog({ date: "2026-03-26", productId: "prod1" }), // this week + this month
      makeLog({ date: "2026-03-23", productId: "prod1" }), // this week + this month
      makeLog({ date: "2026-03-20", productId: "prod2" }), // last week + this month
      makeLog({ date: "2026-02-28", productId: "prod2" }), // last month
    ];
    const result = computeSummary(logs, products, "2026-03-26");
    expect(result.thisWeekCount).toBe(2);
    expect(result.lastWeekCount).toBe(1);
    expect(result.thisMonthCount).toBe(3);
    expect(result.lastMonthCount).toBe(1);
  });

  it("finds top product of current month", () => {
    const logs = [
      makeLog({ date: "2026-03-26", productId: "prod1" }),
      makeLog({ date: "2026-03-25", productId: "prod1" }),
      makeLog({ date: "2026-03-24", productId: "prod2" }),
    ];
    const result = computeSummary(logs, products, "2026-03-26");
    expect(result.topProductName).toBe("Ethiopian");
    expect(result.topProductCount).toBe(2);
  });
});

// --- computeTrendData ---

describe("computeTrendData", () => {
  it("returns 7 data points for 7d range", () => {
    const logs = [makeLog({ date: "2026-03-26" })];
    const result = computeTrendData(logs, "7d", "2026-03-26");
    expect(result).toHaveLength(7);
    expect(result[6].totalCount).toBe(1);
  });

  it("returns 30 data points for 30d range", () => {
    const result = computeTrendData([], "30d", "2026-03-26");
    expect(result).toHaveLength(30);
  });

  it("returns 13 data points for 3m range (weekly)", () => {
    const result = computeTrendData([], "3m", "2026-03-26");
    expect(result).toHaveLength(13);
  });

  it("returns empty for 'all' range with no logs", () => {
    const result = computeTrendData([], "all", "2026-03-26");
    expect(result).toHaveLength(0);
  });

  it("splits self and guest counts", () => {
    const logs = [
      makeLog({ date: "2026-03-26", loggedFor: "self" }),
      makeLog({ date: "2026-03-26", loggedFor: "guest" }),
      makeLog({ date: "2026-03-26", loggedFor: "guest" }),
    ];
    const result = computeTrendData(logs, "7d", "2026-03-26");
    const todayPoint = result[6];
    expect(todayPoint.selfCount).toBe(1);
    expect(todayPoint.guestCount).toBe(2);
    expect(todayPoint.totalCount).toBe(3);
  });

  it("zero-fills days with no data", () => {
    const logs = [makeLog({ date: "2026-03-26" })];
    const result = computeTrendData(logs, "7d", "2026-03-26");
    expect(result[0].totalCount).toBe(0); // 7 days ago
    expect(result[5].totalCount).toBe(0); // yesterday
  });
});

// --- computeProductBreakdown ---

describe("computeProductBreakdown", () => {
  const products = [
    makeProduct({ _id: "prod1", name: "Ethiopian", brand: "BB" }),
    makeProduct({ _id: "prod2", name: "Colombian", brand: "SC" }),
  ];

  it("returns empty for no logs", () => {
    expect(computeProductBreakdown([], products)).toHaveLength(0);
  });

  it("calculates percentages and sorts by cups descending", () => {
    const logs = [
      makeLog({ date: "2026-03-01", productId: "prod1" }),
      makeLog({ date: "2026-03-02", productId: "prod1" }),
      makeLog({ date: "2026-03-03", productId: "prod1" }),
      makeLog({ date: "2026-03-04", productId: "prod2" }),
    ];
    const result = computeProductBreakdown(logs, products);
    expect(result).toHaveLength(2);
    expect(result[0].productName).toBe("Ethiopian");
    expect(result[0].totalCups).toBe(3);
    expect(result[0].percentage).toBe(75);
    expect(result[1].totalCups).toBe(1);
    expect(result[1].percentage).toBe(25);
  });

  it("tracks last consumed date", () => {
    const logs = [
      makeLog({ date: "2026-03-01", productId: "prod1" }),
      makeLog({ date: "2026-03-15", productId: "prod1" }),
    ];
    const result = computeProductBreakdown(logs, products);
    expect(result[0].lastConsumedDate).toBe("2026-03-15");
  });

  it("omits deleted products", () => {
    const logs = [
      makeLog({ date: "2026-03-01", productId: "prod1" }),
      makeLog({ date: "2026-03-02", productId: "deleted-prod" }),
    ];
    const result = computeProductBreakdown(logs, products);
    expect(result).toHaveLength(1);
    expect(result[0].percentage).toBe(100);
  });

  it("handles single product at 100%", () => {
    const logs = [makeLog({ date: "2026-03-01", productId: "prod1" })];
    const result = computeProductBreakdown(logs, products);
    expect(result).toHaveLength(1);
    expect(result[0].percentage).toBe(100);
  });
});

// --- computeFlavourSnapshot ---

describe("computeFlavourSnapshot", () => {
  const products = [
    makeProduct({
      _id: "prod1",
      bitterness: 4,
      sourness: 2,
      richness: 3,
    }),
    makeProduct({
      _id: "prod2",
      bitterness: 2,
      sourness: 4,
      richness: 5,
    }),
  ];

  it("returns null for empty period", () => {
    expect(
      computeFlavourSnapshot([], products, "2026-03-01", "2026-04-01")
    ).toBeNull();
  });

  it("returns product profile for single product", () => {
    const logs = [makeLog({ date: "2026-03-15", productId: "prod1" })];
    const result = computeFlavourSnapshot(
      logs,
      products,
      "2026-03-01",
      "2026-04-01"
    );
    expect(result).not.toBeNull();
    expect(result!.bitterness).toBe(4);
    expect(result!.sourness).toBe(2);
    expect(result!.richness).toBe(3);
    expect(result!.cupCount).toBe(1);
  });

  it("computes weighted average across products", () => {
    const logs = [
      makeLog({ date: "2026-03-10", productId: "prod1" }),
      makeLog({ date: "2026-03-11", productId: "prod1" }),
      makeLog({ date: "2026-03-12", productId: "prod2" }),
    ];
    const result = computeFlavourSnapshot(
      logs,
      products,
      "2026-03-01",
      "2026-04-01"
    );
    expect(result).not.toBeNull();
    // prod1: 2 cups (bit:4, sour:2, rich:3), prod2: 1 cup (bit:2, sour:4, rich:5)
    // weighted: bit=(8+2)/3=10/3, sour=(4+4)/3=8/3, rich=(6+5)/3=11/3
    expect(result!.bitterness).toBeCloseTo(10 / 3);
    expect(result!.sourness).toBeCloseTo(8 / 3);
    expect(result!.richness).toBeCloseTo(11 / 3);
    expect(result!.cupCount).toBe(3);
  });

  it("ignores logs outside date range", () => {
    const logs = [
      makeLog({ date: "2026-02-15", productId: "prod1" }),
      makeLog({ date: "2026-03-15", productId: "prod2" }),
    ];
    const result = computeFlavourSnapshot(
      logs,
      products,
      "2026-03-01",
      "2026-04-01"
    );
    expect(result!.bitterness).toBe(2); // only prod2
  });
});

// --- computeWasteStats ---

describe("computeWasteStats", () => {
  const today = "2026-03-26";

  it("returns hasEnoughData=false when no completed/expired batches", () => {
    const batches = [
      makeBatch({ brewsRemaining: 5, bestBeforeDate: "2026-06-01" }),
    ];
    const result = computeWasteStats(batches, today);
    expect(result.hasEnoughData).toBe(false);
    expect(result.wastePercentage).toBe(0);
  });

  it("returns 0% when no wasted batches", () => {
    const batches = [
      makeBatch({ brewsRemaining: 0, bestBeforeDate: "2026-06-01" }), // fully consumed
      makeBatch({ brewsRemaining: 0, bestBeforeDate: "2026-01-01" }), // expired but fully consumed
    ];
    const result = computeWasteStats(batches, today);
    expect(result.hasEnoughData).toBe(true);
    expect(result.wastePercentage).toBe(0);
    expect(result.totalCompletedOrExpired).toBe(2);
  });

  it("calculates correct waste percentage", () => {
    const batches = [
      makeBatch({ brewsRemaining: 0, bestBeforeDate: "2026-06-01" }), // consumed
      makeBatch({ brewsRemaining: 0, bestBeforeDate: "2026-06-01" }), // consumed
      makeBatch({ brewsRemaining: 3, bestBeforeDate: "2026-01-01" }), // expired with waste
    ];
    const result = computeWasteStats(batches, today);
    expect(result.totalCompletedOrExpired).toBe(3);
    expect(result.expiredWithRemaining).toBe(1);
    expect(result.wastePercentage).toBe(33);
  });

  it("returns 100% when all batches wasted", () => {
    const batches = [
      makeBatch({ brewsRemaining: 5, bestBeforeDate: "2026-01-01" }),
      makeBatch({ brewsRemaining: 2, bestBeforeDate: "2026-02-01" }),
    ];
    const result = computeWasteStats(batches, today);
    expect(result.wastePercentage).toBe(100);
    expect(result.expiredWithRemaining).toBe(2);
  });

  it("excludes active batches from calculation", () => {
    const batches = [
      makeBatch({ brewsRemaining: 5, bestBeforeDate: "2026-06-01" }), // active, not counted
      makeBatch({ brewsRemaining: 0, bestBeforeDate: "2026-06-01" }), // consumed
      makeBatch({ brewsRemaining: 3, bestBeforeDate: "2026-01-01" }), // expired with waste
    ];
    const result = computeWasteStats(batches, today);
    expect(result.totalCompletedOrExpired).toBe(2);
    expect(result.expiredWithRemaining).toBe(1);
    expect(result.wastePercentage).toBe(50);
  });
});
