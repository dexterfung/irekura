// Pure aggregation functions for consumption insights.
// No side effects — fully unit-testable.

/** Format a Date as YYYY-MM-DD in local time (avoids UTC shift from toISOString). */
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type PersonFilter = "all" | "self" | "guest";

export interface ConsumptionLog {
  _id: string;
  productId: string;
  batchId: string;
  date: string; // YYYY-MM-DD
  loggedFor?: "self" | "guest";
  rating?: number;
  tastingNotes?: string;
}

export interface Product {
  _id: string;
  name: string;
  brand: string;
  bitterness: number;
  sourness: number;
  richness: number;
}

export interface Batch {
  _id: string;
  brewsRemaining: number;
  bestBeforeDate: string; // YYYY-MM-DD
}

export interface ConsumptionSummary {
  thisWeekCount: number;
  lastWeekCount: number;
  thisMonthCount: number;
  lastMonthCount: number;
  currentStreak: number;
  topProductId: string | null;
  topProductName: string | null;
  topProductCount: number;
}

export interface ConsumptionTrendPoint {
  label: string;
  date: string;
  selfCount: number;
  guestCount: number;
  totalCount: number;
}

export interface ProductBreakdownEntry {
  productId: string;
  productName: string;
  brand: string;
  totalCups: number;
  percentage: number;
  lastConsumedDate: string;
}

export interface FlavourSnapshot {
  bitterness: number;
  sourness: number;
  richness: number;
  cupCount: number;
}

export interface WasteStats {
  totalCompletedOrExpired: number;
  expiredWithRemaining: number;
  wastePercentage: number;
  hasEnoughData: boolean;
}

// --- Filtering ---

export function filterByPerson(
  logs: ConsumptionLog[],
  person: PersonFilter
): ConsumptionLog[] {
  if (person === "all") return logs;
  if (person === "guest") return logs.filter((l) => l.loggedFor === "guest");
  return logs.filter((l) => l.loggedFor !== "guest");
}

// --- Streak ---

export function computeStreak(dates: string[], today: string): number {
  const uniqueDates = [...new Set(dates)].sort().reverse();
  let streak = 0;
  let current = today;

  for (const date of uniqueDates) {
    if (date === current) {
      streak++;
      // Move to previous day
      const d = new Date(current + "T00:00:00");
      d.setDate(d.getDate() - 1);
      current = toLocalDateString(d);
    } else if (date < current) {
      break;
    }
  }

  return streak;
}

// --- Summary ---

function getISOWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return toLocalDateString(d);
}

function getMonthStart(dateStr: string): string {
  return dateStr.slice(0, 7) + "-01";
}

function getPreviousMonthStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return toLocalDateString(d);
}

function getPreviousWeekStart(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() - 7);
  return toLocalDateString(d);
}

function getNextWeekStart(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + 7);
  return toLocalDateString(d);
}

function getNextMonthStart(monthStart: string): string {
  const d = new Date(monthStart + "T00:00:00");
  d.setMonth(d.getMonth() + 1);
  return toLocalDateString(d);
}

export function computeSummary(
  logs: ConsumptionLog[],
  products: Product[],
  today: string
): ConsumptionSummary {
  const thisWeekStart = getISOWeekStart(today);
  const lastWeekStart = getPreviousWeekStart(thisWeekStart);
  const nextWeekStart = getNextWeekStart(thisWeekStart);
  const thisMonthStart = getMonthStart(today);
  const lastMonthStart = getPreviousMonthStart(today);

  let thisWeekCount = 0;
  let lastWeekCount = 0;
  let thisMonthCount = 0;
  let lastMonthCount = 0;

  const monthProductCounts: Record<string, number> = {};

  for (const log of logs) {
    // Week counts
    if (log.date >= thisWeekStart && log.date < nextWeekStart) thisWeekCount++;
    if (log.date >= lastWeekStart && log.date < thisWeekStart) lastWeekCount++;

    // Month counts
    if (log.date >= thisMonthStart) {
      thisMonthCount++;
      monthProductCounts[log.productId] =
        (monthProductCounts[log.productId] ?? 0) + 1;
    }
    if (log.date >= lastMonthStart && log.date < thisMonthStart)
      lastMonthCount++;
  }

  // Top product this month
  let topProductId: string | null = null;
  let topProductCount = 0;
  for (const [pid, count] of Object.entries(monthProductCounts)) {
    if (count > topProductCount) {
      topProductId = pid;
      topProductCount = count;
    }
  }

  const topProduct = topProductId
    ? products.find((p) => p._id === topProductId)
    : null;

  // Streak
  const allDates = logs.map((l) => l.date);
  const currentStreak = computeStreak(allDates, today);

  return {
    thisWeekCount,
    lastWeekCount,
    thisMonthCount,
    lastMonthCount,
    currentStreak,
    topProductId,
    topProductName: topProduct?.name ?? null,
    topProductCount,
  };
}

// --- Trends ---

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatMonthLabel(dateStr: string): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const d = new Date(dateStr + "T00:00:00");
  return months[d.getMonth()];
}

export type TimeRange = "7d" | "30d" | "3m" | "all";

export function computeTrendData(
  logs: ConsumptionLog[],
  range: TimeRange,
  today: string
): ConsumptionTrendPoint[] {
  if (range === "7d" || range === "30d") {
    return computeDailyTrend(logs, range === "7d" ? 7 : 30, today);
  }
  if (range === "3m") {
    return computeWeeklyTrend(logs, today);
  }
  return computeMonthlyTrend(logs, today);
}

function computeDailyTrend(
  logs: ConsumptionLog[],
  days: number,
  today: string
): ConsumptionTrendPoint[] {
  const startDate = addDays(today, -(days - 1));
  const points: ConsumptionTrendPoint[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDays(startDate, i);
    const dayLogs = logs.filter((l) => l.date === date);
    const selfCount = dayLogs.filter((l) => l.loggedFor !== "guest").length;
    const guestCount = dayLogs.filter((l) => l.loggedFor === "guest").length;
    points.push({
      label: formatDayLabel(date),
      date,
      selfCount,
      guestCount,
      totalCount: selfCount + guestCount,
    });
  }

  return points;
}

function computeWeeklyTrend(
  logs: ConsumptionLog[],
  today: string
): ConsumptionTrendPoint[] {
  // ~13 weeks (3 months)
  const currentWeekStart = getISOWeekStart(today);
  const startWeek = addDays(currentWeekStart, -12 * 7);
  const points: ConsumptionTrendPoint[] = [];

  let weekStart = startWeek;
  for (let i = 0; i < 13; i++) {
    const weekEnd = addDays(weekStart, 7);
    const weekLogs = logs.filter(
      (l) => l.date >= weekStart && l.date < weekEnd
    );
    const selfCount = weekLogs.filter((l) => l.loggedFor !== "guest").length;
    const guestCount = weekLogs.filter((l) => l.loggedFor === "guest").length;
    points.push({
      label: formatWeekLabel(weekStart),
      date: weekStart,
      selfCount,
      guestCount,
      totalCount: selfCount + guestCount,
    });
    weekStart = weekEnd;
  }

  return points;
}

function computeMonthlyTrend(
  logs: ConsumptionLog[],
  today: string
): ConsumptionTrendPoint[] {
  if (logs.length === 0) return [];

  const sortedDates = logs.map((l) => l.date).sort();
  const earliestMonth = getMonthStart(sortedDates[0]);
  const currentMonth = getMonthStart(today);
  const points: ConsumptionTrendPoint[] = [];

  let month = earliestMonth;
  while (month <= currentMonth) {
    const nextMonth = getNextMonthStart(month);
    const monthLogs = logs.filter(
      (l) => l.date >= month && l.date < nextMonth
    );
    const selfCount = monthLogs.filter((l) => l.loggedFor !== "guest").length;
    const guestCount = monthLogs.filter((l) => l.loggedFor === "guest").length;
    points.push({
      label: formatMonthLabel(month),
      date: month,
      selfCount,
      guestCount,
      totalCount: selfCount + guestCount,
    });
    month = nextMonth;
  }

  return points;
}

// --- Product Breakdown ---

export function computeProductBreakdown(
  logs: ConsumptionLog[],
  products: Product[]
): ProductBreakdownEntry[] {
  const productMap = new Map(products.map((p) => [p._id, p]));
  const counts: Record<string, { count: number; lastDate: string }> = {};

  for (const log of logs) {
    if (!productMap.has(log.productId)) continue; // skip deleted products
    const entry = counts[log.productId];
    if (entry) {
      entry.count++;
      if (log.date > entry.lastDate) entry.lastDate = log.date;
    } else {
      counts[log.productId] = { count: 1, lastDate: log.date };
    }
  }

  const total = Object.values(counts).reduce((s, e) => s + e.count, 0);

  const entries: ProductBreakdownEntry[] = Object.entries(counts).map(
    ([pid, { count, lastDate }]) => {
      const product = productMap.get(pid)!;
      return {
        productId: pid,
        productName: product.name,
        brand: product.brand,
        totalCups: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        lastConsumedDate: lastDate,
      };
    }
  );

  return entries.sort((a, b) => b.totalCups - a.totalCups);
}

// --- Flavour Snapshot ---

export function computeFlavourSnapshot(
  logs: ConsumptionLog[],
  products: Product[],
  startDate: string,
  endDate: string
): FlavourSnapshot | null {
  const productMap = new Map(products.map((p) => [p._id, p]));
  const periodLogs = logs.filter(
    (l) => l.date >= startDate && l.date < endDate
  );

  if (periodLogs.length === 0) return null;

  // Count cups per product in this period
  const cupsByProduct: Record<string, number> = {};
  for (const log of periodLogs) {
    if (!productMap.has(log.productId)) continue;
    cupsByProduct[log.productId] = (cupsByProduct[log.productId] ?? 0) + 1;
  }

  let totalCups = 0;
  let weightedBitterness = 0;
  let weightedSourness = 0;
  let weightedRichness = 0;

  for (const [pid, cups] of Object.entries(cupsByProduct)) {
    const product = productMap.get(pid);
    if (!product) continue;
    totalCups += cups;
    weightedBitterness += product.bitterness * cups;
    weightedSourness += product.sourness * cups;
    weightedRichness += product.richness * cups;
  }

  if (totalCups === 0) return null;

  return {
    bitterness: weightedBitterness / totalCups,
    sourness: weightedSourness / totalCups,
    richness: weightedRichness / totalCups,
    cupCount: totalCups,
  };
}

// --- Waste Stats ---

export function computeWasteStats(
  batches: Batch[],
  today: string
): WasteStats {
  let totalCompletedOrExpired = 0;
  let expiredWithRemaining = 0;

  for (const batch of batches) {
    const isExpired = batch.bestBeforeDate < today;
    const isFullyConsumed = batch.brewsRemaining === 0;

    if (isFullyConsumed || isExpired) {
      totalCompletedOrExpired++;
      if (isExpired && batch.brewsRemaining > 0) {
        expiredWithRemaining++;
      }
    }
  }

  return {
    totalCompletedOrExpired,
    expiredWithRemaining,
    wastePercentage:
      totalCompletedOrExpired > 0
        ? Math.round((expiredWithRemaining / totalCompletedOrExpired) * 100)
        : 0,
    hasEnoughData: totalCompletedOrExpired > 0,
  };
}
