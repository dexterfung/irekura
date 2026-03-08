"use client";

import {
  startOfMonth,
  getDaysInMonth,
  getDay,
  addMonths,
  subMonths,
  format,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MonthlyCalendarProps {
  year: number;
  month: number; // 1-indexed
  datesWithEntries: Set<string>; // "YYYY-MM-DD"
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onNavigate: (year: number, month: number) => void;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthlyCalendar({
  year,
  month,
  datesWithEntries,
  selectedDate,
  onSelectDate,
  onNavigate,
}: MonthlyCalendarProps) {
  const firstDay = startOfMonth(new Date(year, month - 1));
  const daysInMonth = getDaysInMonth(firstDay);
  const startDayOfWeek = getDay(firstDay);
  const todayISO = format(new Date(), "yyyy-MM-dd");

  function handlePrev() {
    const prev = subMonths(firstDay, 1);
    onNavigate(prev.getFullYear(), prev.getMonth() + 1);
  }

  function handleNext() {
    const next = addMonths(firstDay, 1);
    onNavigate(next.getFullYear(), next.getMonth() + 1);
  }

  function handleToday() {
    const now = new Date();
    onNavigate(now.getFullYear(), now.getMonth() + 1);
  }

  const cells: (number | null)[] = [
    ...Array(startDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handlePrev} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold text-lg min-w-[140px] text-center">
            {format(firstDay, "MMMM yyyy")}
          </h2>
          <Button variant="ghost" size="icon" onClick={handleNext} className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleToday}>
          Today
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {label}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }

          const dateISO = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasEntry = datesWithEntries.has(dateISO);
          const isSelected = selectedDate === dateISO;
          const isTodayDate = todayISO === dateISO;

          return (
            <button
              key={dateISO}
              onClick={() => onSelectDate(dateISO)}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg aspect-square text-sm transition-colors min-h-[40px]",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && isTodayDate && "border border-primary",
                !isSelected && !isTodayDate && "hover:bg-accent"
              )}
            >
              {day}
              {hasEntry && (
                <span
                  className={cn(
                    "absolute bottom-1 h-1 w-1 rounded-full",
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
