"use client";

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { format, parseISO } from "date-fns";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

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

function TastingNotesEditor({
  logId,
  initialValue,
}: {
  logId: Id<"consumptionLogs">;
  initialValue: string | undefined;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(initialValue ?? "");
  const rateLog = useMutation(api.consumption.rate);
  const tNotes = useTranslations("tastingNotes");

  async function handleSave() {
    await rateLog({
      id: logId,
      tastingNotes: notes.trim() || undefined,
    });
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          setNotes(initialValue ?? "");
          setIsEditing(true);
        }}
        className={`text-xs text-left w-full rounded-md px-2 py-1.5 transition-colors ${
          initialValue
            ? "text-muted-foreground hover:bg-accent"
            : "text-muted-foreground/60 border border-dashed border-border hover:border-foreground/30 hover:text-muted-foreground"
        }`}
      >
        {initialValue ? (
          <span className="italic">&ldquo;{initialValue}&rdquo;</span>
        ) : (
          <span>+ {tNotes("label")}</span>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value.slice(0, 280))}
        placeholder={tNotes("placeholder")}
        maxLength={280}
        rows={2}
        className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {tNotes("charCount", { count: notes.length })}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="text-xs font-medium text-foreground px-2 py-1"
          >
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DayDetail({ date, entries }: DayDetailProps) {
  const rateLog = useMutation(api.consumption.rate);
  const t = useTranslations("history");
  const tNotes = useTranslations("tastingNotes");
  const tGuest = useTranslations("guestProfile");
  const guestSettings = useQuery(api.settings.getGuestSettings);
  const guestEnabled = guestSettings?.guestEnabled ?? false;
  const guestDisplayName = guestSettings?.guestDisplayName ?? tGuest("defaultName");

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
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">{product.brand}</div>
                </div>
                {guestEnabled && (
                  <Badge variant={log.loggedFor === "guest" ? "secondary" : "default"} className="shrink-0 text-xs">
                    {log.loggedFor === "guest" ? guestDisplayName : tGuest("you")}
                  </Badge>
                )}
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
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{tNotes("label")}</div>
                <TastingNotesEditor
                  logId={log._id}
                  initialValue={log.tastingNotes}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
