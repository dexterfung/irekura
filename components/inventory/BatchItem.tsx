"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { getDaysUntilExpiry, toISODateString, cn } from "@/lib/utils";
import type { Doc } from "@/convex/_generated/dataModel";

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

const URGENCY_LABELS: Record<ExpiryUrgency, string> = {
  expired: "Expired",
  urgent: "Urgent",
  warning: "Expiring soon",
  ok: "Good",
};

const URGENCY_VARIANTS: Record<ExpiryUrgency, "expired" | "urgent" | "warning" | "ok"> = {
  expired: "expired",
  urgent: "urgent",
  warning: "warning",
  ok: "ok",
};

export default function BatchItem({ batch, onEditQuantity, onDelete }: BatchItemProps) {
  const urgency = getExpiryUrgency(batch.bestBeforeDate);
  const isDepleted = batch.brewsRemaining === 0;

  return (
    <div className={cn("flex items-center gap-3 py-3", isDepleted && "opacity-50")}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">
            {batch.brewsRemaining} brew{batch.brewsRemaining !== 1 ? "s" : ""} remaining
          </span>
          {isDepleted ? (
            <Badge variant="secondary">Depleted</Badge>
          ) : (
            <Badge variant={URGENCY_VARIANTS[urgency]}>{URGENCY_LABELS[urgency]}</Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Best before: {batch.bestBeforeDate}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onEditQuantity}
          aria-label="Edit quantity"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-destructive hover:text-destructive"
          onClick={onDelete}
          aria-label="Delete batch"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
