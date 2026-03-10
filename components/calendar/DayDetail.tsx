"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { format, parseISO } from "date-fns";
import { useTranslations } from "next-intl";

interface DayDetailEntry {
  log: Doc<"consumptionLogs">;
  product: Doc<"products">;
  batch: Doc<"batches"> | null;
}

interface DayDetailProps {
  date: string | null; // "YYYY-MM-DD"
  entries: DayDetailEntry[];
}

const STAR_YELLOW = "#facc15";
const STAR_GREY = "var(--color-muted-foreground, #9ca3af)";

function StarRating({
  value,
  logId,
  onRate,
}: {
  value: number | undefined;
  logId: Id<"consumptionLogs">;
  onRate: (id: Id<"consumptionLogs">, rating: number) => void;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const tStar = useTranslations("starRating");
  const activeValue = hoverValue ?? value ?? 0;

  return (
    <div className="flex" onMouseLeave={() => setHoverValue(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          role="button"
          tabIndex={0}
          onClick={() => onRate(logId, star)}
          onMouseEnter={() => setHoverValue(star)}
          onKeyDown={(e) => e.key === "Enter" && onRate(logId, star)}
          className="text-2xl px-0.5 cursor-pointer leading-none transition-colors"
          style={{ color: star <= activeValue ? STAR_YELLOW : STAR_GREY }}
          aria-label={tStar("star", { count: star })}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function DayDetail({ date, entries }: DayDetailProps) {
  const rateLog = useMutation(api.consumption.rate);
  const t = useTranslations("history");

  if (!date) return null;

  async function handleRate(id: Id<"consumptionLogs">, rating: number) {
    await rateLog({ id, rating });
  }

  const formattedDate = format(parseISO(date), "EEEE, MMMM d, yyyy");

  return (
    <div className="border-t border-border mt-4 pt-4">
      <p className="text-sm font-semibold mb-3">{formattedDate}</p>

      {entries.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-6">
          {t("noCoffeeLogged")}
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map(({ log, product, batch }) => (
            <div key={log._id} className="border rounded-lg p-3 space-y-2">
              <div>
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-muted-foreground">{product.brand}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {t("batchBestBefore", { date: batch?.bestBeforeDate ?? "—" })}
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t("ratingOptional")}</div>
                <StarRating
                  value={log.rating}
                  logId={log._id}
                  onRate={handleRate}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
