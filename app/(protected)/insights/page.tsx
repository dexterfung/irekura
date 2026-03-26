"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toISODateString } from "@/lib/utils";
import {
  filterByPerson,
  computeSummary,
  computeTrendData,
  computeProductBreakdown,
  computeFlavourSnapshot,
  computeWasteStats,
  type TimeRange,
} from "@/lib/insights/aggregations";
import SummaryCards from "@/components/insights/SummaryCards";
import ConsumptionChart from "@/components/insights/ConsumptionChart";
import ProductBreakdown from "@/components/insights/ProductBreakdown";
import FlavourRadar from "@/components/insights/FlavourRadar";
import WasteRate from "@/components/insights/WasteRate";

export default function InsightsPage() {
  const t = useTranslations("insights");

  const logs = useQuery(api.insights.allConsumptionLogs);
  const products = useQuery(api.products.list);
  const batches = useQuery(api.insights.allBatches);

  const [timeRange, setTimeRange] = useState<TimeRange>("7d");

  if (logs === undefined || products === undefined || batches === undefined) {
    return (
      <div className="px-4 py-8 text-center text-muted-foreground">
        <div className="animate-pulse">...</div>
      </div>
    );
  }

  const today = toISODateString(new Date());

  // Map Convex docs to plain objects for pure functions
  const plainLogs = logs.map((l) => ({
    _id: l._id as string,
    productId: l.productId as string,
    batchId: l.batchId as string,
    date: l.date,
    loggedFor: l.loggedFor as "self" | "guest" | undefined,
    rating: l.rating,
    tastingNotes: l.tastingNotes,
  }));

  const plainProducts = products.map((p) => ({
    _id: p._id as string,
    name: p.name,
    brand: p.brand,
    bitterness: p.bitterness,
    sourness: p.sourness,
    richness: p.richness,
  }));

  const plainBatches = batches.map((b) => ({
    _id: b._id as string,
    brewsRemaining: b.brewsRemaining,
    bestBeforeDate: b.bestBeforeDate,
  }));

  // Always show only the user's own consumption (exclude guest)
  const filteredLogs = filterByPerson(plainLogs, "self");

  // Summary
  const summary = computeSummary(filteredLogs, plainProducts, today);

  // Trends
  const trendData = computeTrendData(filteredLogs, timeRange, today);

  // Product breakdown
  const breakdown = computeProductBreakdown(filteredLogs, plainProducts);

  // Flavour snapshots
  const thisMonthStart = today.slice(0, 7) + "-01";
  const thisMonthDate = new Date(thisMonthStart + "T00:00:00");
  const lastMonthDate = new Date(thisMonthDate);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthStart = toISODateString(lastMonthDate);

  const nextMonthDate = new Date(thisMonthDate);
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const nextMonthStart = toISODateString(nextMonthDate);

  const currentFlavour = computeFlavourSnapshot(
    filteredLogs,
    plainProducts,
    thisMonthStart,
    nextMonthStart
  );
  const previousFlavour = computeFlavourSnapshot(
    filteredLogs,
    plainProducts,
    lastMonthStart,
    thisMonthStart
  );

  // Waste stats
  const wasteStats = computeWasteStats(plainBatches, today);

  const isEmpty = plainLogs.length === 0;

  return (
    <div className="px-4 pb-6 space-y-6">
      {isEmpty ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-lg font-semibold">{t("emptyTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <>
          {/* US1: Summary Cards */}
          <SummaryCards summary={summary} />

          {/* US2: Consumption Trends */}
          <section className="space-y-3 border-t border-border pt-5">
            <h2 className="text-sm font-semibold">{t("consumptionTrends")}</h2>
            <ConsumptionChart
              data={trendData}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </section>

          {/* US3: Product Breakdown */}
          <section className="space-y-3 border-t border-border pt-5">
            <h2 className="text-sm font-semibold">{t("productBreakdown")}</h2>
            <ProductBreakdown data={breakdown} />
          </section>

          {/* US4: Flavour Profile */}
          <section className="space-y-3 border-t border-border pt-5">
            <h2 className="text-sm font-semibold">{t("flavourProfile")}</h2>
            <FlavourRadar
              current={currentFlavour}
              previous={previousFlavour}
            />
          </section>

          {/* US5: Waste Rate */}
          <section className="space-y-3 border-t border-border pt-5">
            <h2 className="text-sm font-semibold">{t("wasteRate")}</h2>
            <WasteRate stats={wasteStats} />
          </section>
        </>
      )}
    </div>
  );
}
