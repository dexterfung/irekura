"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ConsumptionTrendPoint, TimeRange } from "@/lib/insights/aggregations";
import { useTranslations } from "next-intl";

/** Resolve a CSS variable (e.g. oklch) into an rgb() string that SVG can use. */
function useResolvedColor(cssVar: string, fallback: string): string {
  const [color, setColor] = useState(fallback);
  useEffect(() => {
    function resolve() {
      const el = document.createElement("div");
      el.style.color = `var(${cssVar})`;
      document.body.appendChild(el);
      const resolved = getComputedStyle(el).color;
      document.body.removeChild(el);
      if (resolved) setColor(resolved);
    }
    resolve();
    // Re-resolve when theme changes (class toggle on <html>)
    const observer = new MutationObserver(resolve);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [cssVar]);
  return color;
}

interface ConsumptionChartProps {
  data: ConsumptionTrendPoint[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const RANGE_OPTIONS: TimeRange[] = ["7d", "30d", "3m", "all"];

export default function ConsumptionChart({
  data,
  timeRange,
  onTimeRangeChange,
}: ConsumptionChartProps) {
  const t = useTranslations("insights");
  const barColor = useResolvedColor("--foreground", "#404040");

  const rangeLabels: Record<TimeRange, string> = {
    "7d": t("timeRange7d"),
    "30d": t("timeRange30d"),
    "3m": t("timeRange3m"),
    all: t("timeRangeAll"),
  };

  const maxCount = Math.max(...data.map((d) => d.totalCount), 1);

  if (data.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                timeRange === range
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {rangeLabels[range]}
            </button>
          ))}
        </div>
        <div className="text-center py-8 text-sm text-muted-foreground">
          {t("noCupsThisPeriod")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Time range selector */}
      <div className="flex gap-1">
        {RANGE_OPTIONS.map((range) => (
          <button
            key={range}
            onClick={() => onTimeRangeChange(range)}
            className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
              timeRange === range
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {rangeLabels[range]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              allowDecimals={false}
              width={24}
              domain={[0, maxCount]}
              tickCount={Math.min(maxCount + 1, 6)}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
              }}
            />
            <Bar
              dataKey="totalCount"
              fill={barColor}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
