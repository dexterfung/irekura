"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { FlavorProfile } from "@/lib/recommendations/engine";

interface FlavorRadarChartProps {
  profile: FlavorProfile;
}

export default function FlavorRadarChart({ profile }: FlavorRadarChartProps) {
  const data = [
    { axis: "Bitterness", value: profile.bitterness },
    { axis: "Sourness", value: profile.sourness },
    { axis: "Richness", value: profile.richness },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12 }} />
        <Radar
          name="Profile"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.3}
          dot={true}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
