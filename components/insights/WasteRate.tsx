"use client";

import type { WasteStats } from "@/lib/insights/aggregations";
import { useTranslations } from "next-intl";

interface WasteRateProps {
  stats: WasteStats;
}

export default function WasteRate({ stats }: WasteRateProps) {
  const t = useTranslations("insights");

  if (!stats.hasEnoughData) {
    return (
      <div className="border border-border rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">{t("notEnoughData")}</p>
      </div>
    );
  }

  const color =
    stats.wastePercentage === 0
      ? "text-green-600 dark:text-green-400"
      : stats.wastePercentage <= 20
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="border border-border rounded-lg p-4 space-y-1">
      <div className={`text-2xl font-bold ${color}`}>
        {t("wastePercentage", { percentage: stats.wastePercentage })}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("batchesExpired", {
          expired: stats.expiredWithRemaining,
          total: stats.totalCompletedOrExpired,
        })}
      </p>
    </div>
  );
}
