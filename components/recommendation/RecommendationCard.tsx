"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ScoredBatch } from "@/lib/recommendations/engine";
import { useTranslations } from "next-intl";

interface RecommendationCardProps {
  recommendation: ScoredBatch;
  onDrink: () => void;
  onShowAnother: () => void;
  hasMore: boolean;
}

const URGENCY_VARIANTS = {
  expired: "expired" as const,
  urgent: "urgent" as const,
  warning: "warning" as const,
  ok: "ok" as const,
};

function FlavorBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/5</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function RecommendationCard({
  recommendation,
  onDrink,
  onShowAnother,
  hasMore,
}: RecommendationCardProps) {
  const t = useTranslations("recommend");
  const tTypes = useTranslations("productTypes");
  const tForm = useTranslations("productForm");
  const tInventory = useTranslations("inventory");

  const { product, brewsRemaining, bestBeforeDate, expiryUrgency } = recommendation;

  const urgencyLabels: Record<string, string> = {
    expired: tInventory("expired"),
    urgent: tInventory("urgent"),
    warning: tInventory("expiringSoon"),
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold">{product.name}</h2>
            <p className="text-muted-foreground">{product.brand}</p>
          </div>
          <Badge variant="secondary">
            {tTypes(product.type as "drip-bag" | "ground-bean" | "concentrate-capsule" | "instant-powder")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <FlavorBar label={tForm("bitterness")} value={product.bitterness} />
          <FlavorBar label={tForm("sourness")} value={product.sourness} />
          <FlavorBar label={tForm("richness")} value={product.richness} />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("brewsRemaining", { count: brewsRemaining })}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">{t("bestBefore", { date: bestBeforeDate })}</span>
            {expiryUrgency !== "ok" && (
              <Badge variant={URGENCY_VARIANTS[expiryUrgency]}>
                {urgencyLabels[expiryUrgency]}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Button onClick={onDrink} className="w-full min-h-[44px]">
            {t("drink")}
          </Button>
          {hasMore && (
            <Button
              variant="ghost"
              onClick={onShowAnother}
              className="w-full text-muted-foreground"
            >
              {t("showAnother")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
