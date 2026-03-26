"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { ProductBreakdownEntry } from "@/lib/insights/aggregations";
import { useTranslations } from "next-intl";

interface ProductBreakdownProps {
  data: ProductBreakdownEntry[];
}

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
    const observer = new MutationObserver(resolve);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [cssVar]);
  return color;
}

const STATIC_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#06b6d4",
];

export default function ProductBreakdown({ data }: ProductBreakdownProps) {
  const t = useTranslations("insights");
  const fgColor = useResolvedColor("--foreground", "#404040");

  const colors = [fgColor, ...STATIC_COLORS];

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        {t("noCupsThisPeriod")}
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.totalCups - a.totalCups);

  return (
    <div className="space-y-4">
      {/* Donut chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="totalCups"
              nameKey="productName"
              innerRadius="50%"
              outerRadius="80%"
              paddingAngle={2}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
              }}
              formatter={(value: number, name: string) => [
                `${value} ${t("cups", { count: value }).split(" ").slice(1).join(" ")}`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="space-y-2">
        {sorted.map((entry) => (
          <div
            key={entry.productId}
            className="flex items-center gap-3 text-sm"
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: colors[data.findIndex(d => d.productId === entry.productId) % colors.length] }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{entry.productName}</div>
              <div className="text-xs text-muted-foreground">{entry.brand}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-medium">{entry.totalCups}</div>
              <div className="text-xs text-muted-foreground">
                {t("percentage", { value: entry.percentage })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
