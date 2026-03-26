"use client";

import type { ConsumptionSummary } from "@/lib/insights/aggregations";
import { useTranslations } from "next-intl";

interface SummaryCardsProps {
  summary: ConsumptionSummary;
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous;
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return null; // no prior data to compare

  const sign = delta > 0 ? "+" : "";
  const color =
    delta > 0
      ? "text-green-600 dark:text-green-400"
      : delta < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <span className={`text-xs font-medium ${color}`}>
      {sign}{delta}
    </span>
  );
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const t = useTranslations("insights");

  const cards = [
    {
      label: t("thisWeek"),
      value: summary.thisWeekCount,
      delta: { current: summary.thisWeekCount, previous: summary.lastWeekCount },
    },
    {
      label: t("thisMonth"),
      value: summary.thisMonthCount,
      delta: { current: summary.thisMonthCount, previous: summary.lastMonthCount },
    },
    {
      label: t("streak"),
      value: t("streakDays", { count: summary.currentStreak }),
      delta: null,
    },
    {
      label: t("topProduct"),
      value: summary.topProductName
        ? `${summary.topProductName}`
        : "—",
      subtitle: summary.topProductName
        ? t("cups", { count: summary.topProductCount })
        : null,
      delta: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="border border-border rounded-lg p-3 space-y-1"
        >
          <div className="text-xs text-muted-foreground">{card.label}</div>
          <div className="flex items-baseline gap-2">
            <div className="text-lg font-semibold truncate">{card.value}</div>
            {card.delta && (
              <DeltaBadge
                current={card.delta.current}
                previous={card.delta.previous}
              />
            )}
          </div>
          {"subtitle" in card && card.subtitle && (
            <div className="text-xs text-muted-foreground">{card.subtitle}</div>
          )}
        </div>
      ))}
    </div>
  );
}
