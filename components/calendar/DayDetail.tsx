"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface DayDetailEntry {
  log: Doc<"consumptionLogs">;
  product: Doc<"products">;
}

interface DayDetailProps {
  date: string | null; // "YYYY-MM-DD"
  entries: DayDetailEntry[];
  onClose: () => void;
}

function StarRating({
  value,
  logId,
  onRate,
}: {
  value: number | undefined;
  logId: Id<"consumptionLogs">;
  onRate: (id: Id<"consumptionLogs">, rating: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRate(logId, star)}
          className={cn(
            "text-xl min-w-[32px] min-h-[32px] transition-colors",
            value !== undefined && star <= value
              ? "text-yellow-400"
              : "text-muted-foreground hover:text-yellow-400"
          )}
          aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function DayDetail({ date, entries, onClose }: DayDetailProps) {
  const rateLog = useMutation(api.consumption.rate);

  async function handleRate(id: Id<"consumptionLogs">, rating: number) {
    await rateLog({ id, rating });
  }

  const formattedDate = date
    ? format(parseISO(date), "EEEE, MMMM d, yyyy")
    : "";

  return (
    <Sheet open={!!date} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{formattedDate}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No coffee logged on this day
            </p>
          ) : (
            entries.map(({ log, product }) => (
              <div key={log._id} className="border rounded-lg p-3 space-y-2">
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">{product.brand}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Batch best before: {
                    // We can't easily look up batch from here; log has batchId
                    log.batchId as string
                  }
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Rating</div>
                  <StarRating
                    value={log.rating}
                    logId={log._id}
                    onRate={handleRate}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
