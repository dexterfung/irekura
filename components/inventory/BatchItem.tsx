"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { getDaysUntilExpiry, toISODateString, cn } from "@/lib/utils";
import type { Doc } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";

interface BatchItemProps {
  batch: Doc<"batches">;
  onEditQuantity?: () => void;
  onDelete?: () => void;
}

type ExpiryUrgency = "expired" | "urgent" | "warning" | "ok";

function getExpiryUrgency(bestBeforeDate: string): ExpiryUrgency {
  const days = getDaysUntilExpiry(bestBeforeDate, toISODateString(new Date()));
  if (days < 0) return "expired";
  if (days <= 7) return "urgent";
  if (days <= 30) return "warning";
  return "ok";
}

const URGENCY_VARIANTS: Record<ExpiryUrgency, "expired" | "urgent" | "warning" | "ok"> = {
  expired: "expired",
  urgent: "urgent",
  warning: "warning",
  ok: "ok",
};

export default function BatchItem({ batch, onEditQuantity, onDelete }: BatchItemProps) {
  const t = useTranslations("inventory");
  const tDetail = useTranslations("productDetail");
  const tBatch = useTranslations("batchForm");

  const urgency = getExpiryUrgency(batch.bestBeforeDate);
  const isDepleted = batch.brewsRemaining === 0;

  const urgencyLabels: Record<ExpiryUrgency, string> = {
    expired: t("expired"),
    urgent: t("urgent"),
    warning: t("expiringSoon"),
    ok: t("good"),
  };

  return (
    <div className={cn("flex items-center gap-3 py-3", isDepleted && "opacity-50")}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">
            {t("brewsRemaining", { count: batch.brewsRemaining })}
          </span>
          {isDepleted ? (
            <Badge variant="secondary">{t("depleted")}</Badge>
          ) : (
            <Badge variant={URGENCY_VARIANTS[urgency]}>{urgencyLabels[urgency]}</Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {tBatch("bestBefore", { date: batch.bestBeforeDate })}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onEditQuantity}
          aria-label={tDetail("editQuantityAria")}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-destructive hover:text-destructive"
          onClick={onDelete}
          aria-label={tDetail("deleteBatchAria")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
