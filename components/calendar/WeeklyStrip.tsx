"use client";

import {
  startOfWeek,
  addDays,
  subWeeks,
  addWeeks,
  format,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface WeeklyStripProps {
  referenceDate: string; // "YYYY-MM-DD" — any date within the week to display
  datesWithEntries: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onNavigate: (newReferenceDate: string) => void;
}

export default function WeeklyStrip({
  referenceDate,
  datesWithEntries,
  selectedDate,
  onSelectDate,
  onNavigate,
}: WeeklyStripProps) {
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");

  const DAY_LABELS = [
    t("sun"),
    t("mon"),
    t("tue"),
    t("wed"),
    t("thu"),
    t("fri"),
    t("sat"),
  ];

  const ref = parseISO(referenceDate);
  const weekStart = startOfWeek(ref);
  const todayISO = format(new Date(), "yyyy-MM-dd");

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return format(date, "yyyy-MM-dd");
  });

  function handlePrev() {
    const prev = subWeeks(ref, 1);
    onNavigate(format(prev, "yyyy-MM-dd"));
  }

  function handleNext() {
    const next = addWeeks(ref, 1);
    onNavigate(format(next, "yyyy-MM-dd"));
  }

  function handleToday() {
    onNavigate(format(new Date(), "yyyy-MM-dd"));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleToday}>
          {tCommon("today")}
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((dateISO, idx) => {
          const hasEntry = datesWithEntries.has(dateISO);
          const isSelected = selectedDate === dateISO;
          const isTodayDate = todayISO === dateISO;
          const dayNum = format(parseISO(dateISO), "d");

          return (
            <button
              key={dateISO}
              onClick={() => onSelectDate(dateISO)}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg py-2 text-xs gap-0.5 min-h-[56px] transition-colors cursor-pointer",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && isTodayDate && "border border-primary",
                !isSelected && !isTodayDate && "hover:bg-accent"
              )}
            >
              <span
                className={cn(
                  "text-xs",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                {DAY_LABELS[idx]}
              </span>
              <span className="font-medium">{dayNum}</span>
              {hasEntry && (
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-primary"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
