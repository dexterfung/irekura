"use client";

import type { FlavorProfile } from "@/lib/recommendations/engine";

interface FlavorRadarChartProps {
  profile: FlavorProfile;
}

const DIMENSIONS = [
  { key: "bitterness", label: "Bitterness" },
  { key: "sourness", label: "Sourness" },
  { key: "richness", label: "Richness" },
] as const;

export default function FlavorRadarChart({ profile }: FlavorRadarChartProps) {
  return (
    <div className="space-y-3">
      {DIMENSIONS.map(({ key, label }) => {
        const value = profile[key];
        const pct = (value / 5) * 100;
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-sm text-muted-foreground text-right">
              {label}
            </span>
            <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-sm font-medium tabular-nums text-right">
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
