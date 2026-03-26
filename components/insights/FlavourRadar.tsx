"use client";

import type { FlavourSnapshot } from "@/lib/insights/aggregations";
import { useTranslations } from "next-intl";

interface FlavourRadarProps {
  current: FlavourSnapshot | null;
  previous: FlavourSnapshot | null;
}

interface BarRowProps {
  label: string;
  current: number;
  previous: number | null;
  max: number;
}

function BarRow({ label, current, previous, max }: BarRowProps) {
  const pct = (current / max) * 100;
  const prevPct = previous !== null ? (previous / max) * 100 : null;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {current.toFixed(1)}{previous !== null && ` (${previous.toFixed(1)})`}
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        {prevPct !== null && (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/30"
            style={{ width: `${prevPct}%` }}
          />
        )}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-foreground transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function FlavourRadar({ current, previous }: FlavourRadarProps) {
  const t = useTranslations("insights");
  const tForm = useTranslations("productForm");

  if (!current) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        {t("noCupsThisPeriod")}
      </div>
    );
  }

  const max = 5;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {t("currentPeriod")}{previous ? ` vs ${t("previousPeriod")}` : ""}
      </p>
      <BarRow
        label={tForm("bitterness")}
        current={current.bitterness}
        previous={previous?.bitterness ?? null}
        max={max}
      />
      <BarRow
        label={tForm("sourness")}
        current={current.sourness}
        previous={previous?.sourness ?? null}
        max={max}
      />
      <BarRow
        label={tForm("richness")}
        current={current.richness}
        previous={previous?.richness ?? null}
        max={max}
      />
    </div>
  );
}
