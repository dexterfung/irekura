"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import MonthlyCalendar from "@/components/calendar/MonthlyCalendar";
import WeeklyStrip from "@/components/calendar/WeeklyStrip";
import DayDetail from "@/components/calendar/DayDetail";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toISODateString } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function HistoryPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [weekRef, setWeekRef] = useState(toISODateString(now));
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [personFilter, setPersonFilter] = useState<"all" | "self" | "guest">("all");
  const t = useTranslations("history");
  const tCommon = useTranslations("common");
  const tGuest = useTranslations("guestProfile");

  // Quick-log form state
  const [logProductId, setLogProductId] = useState("");
  const [logBatchId, setLogBatchId] = useState("");
  const [logDate, setLogDate] = useState(toISODateString(now));
  const [logRating, setLogRating] = useState<string>("");
  const [logTastingNotes, setLogTastingNotes] = useState("");
  const [loggedFor, setLoggedFor] = useState<"self" | "guest">("self");
  const [isLogging, setIsLogging] = useState(false);
  const tNotes = useTranslations("tastingNotes");

  const guestSettings = useQuery(api.settings.getGuestSettings);
  const monthLogs = useQuery(api.consumption.listByMonth, { year, month });
  const products = useQuery(api.products.list);
  const batches = useQuery(api.batches.listByProduct, logProductId ? { productId: logProductId as Id<"products"> } : "skip");
  const createLog = useMutation(api.consumption.create);

  const guestEnabled = guestSettings?.guestEnabled ?? false;
  const guestDisplayName = guestSettings?.guestDisplayName ?? tGuest("defaultName");

  const datesWithEntries = new Set<string>(
    monthLogs?.map(({ log }: { log: { date: string } }) => log.date) ?? []
  );

  const allSelectedEntries =
    selectedDate && monthLogs
      ? monthLogs.filter(({ log }: { log: { date: string } }) => log.date === selectedDate)
      : [];

  const selectedDateEntries = allSelectedEntries.filter(({ log }: { log: { loggedFor?: string } }) => {
    if (!guestEnabled || personFilter === "all") return true;
    if (personFilter === "guest") return log.loggedFor === "guest";
    return log.loggedFor !== "guest";
  });

  async function handleQuickLog(e: React.FormEvent) {
    e.preventDefault();
    if (!logProductId || !logBatchId) return;
    setIsLogging(true);
    try {
      await createLog({
        productId: logProductId as Id<"products">,
        batchId: logBatchId as Id<"batches">,
        date: logDate,
        rating: logRating ? parseInt(logRating, 10) : undefined,
        tastingNotes: logTastingNotes.trim() || undefined,
        loggedFor,
      });
      setLogDialogOpen(false);
      setLogProductId("");
      setLogBatchId("");
      setLogRating("");
      setLogTastingNotes("");
      setLoggedFor("self");
    } finally {
      setIsLogging(false);
    }
  }

  return (
    <div className="min-h-full">
      <div className="p-4 max-w-lg mx-auto">
        {/* Person filter pills — only when guest is enabled */}
        {guestEnabled && (
          <div className="flex gap-2 mb-3">
            {(["all", "self", "guest"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setPersonFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px] ${
                  personFilter === filter
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {filter === "all"
                  ? tGuest("filterAll")
                  : filter === "self"
                  ? tGuest("filterYou")
                  : guestDisplayName}
              </button>
            ))}
          </div>
        )}

        {/* Responsive calendar */}
        <div className="sm:hidden">
          <WeeklyStrip
            referenceDate={weekRef}
            datesWithEntries={datesWithEntries}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onNavigate={setWeekRef}
          />
        </div>
        <div className="hidden sm:block">
          <MonthlyCalendar
            year={year}
            month={month}
            datesWithEntries={datesWithEntries}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onNavigate={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
          />
        </div>

        {/* Day detail — inline below calendar */}
        <DayDetail
          date={selectedDate}
          entries={selectedDateEntries}
        />
      </div>

      {/* Quick-log FAB */}
      <Button
        size="icon"
        className="fixed right-4 h-14 w-14 rounded-full shadow-lg"
        style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
        onClick={() => setLogDialogOpen(true)}
        aria-label={t("logCoffeeAria")}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Quick-log dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("logCoffee")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickLog} className="space-y-4">
            {/* Logging for toggle — only when guest is enabled */}
            {guestEnabled && (
              <div className="space-y-2">
                <Label>{tGuest("loggingFor")}</Label>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  {(["self", "guest"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setLoggedFor(option)}
                      className={`flex-1 py-2 text-sm font-medium transition-colors min-h-[44px] ${
                        loggedFor === option
                          ? "bg-foreground text-background"
                          : "bg-background text-foreground hover:bg-accent"
                      }`}
                    >
                      {option === "self" ? tGuest("you") : guestDisplayName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("product")}</Label>
              <Select value={logProductId} onValueChange={setLogProductId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectProduct")} />
                </SelectTrigger>
                <SelectContent>
                  {(products as Array<{ _id: string; name: string; brand: string }>)?.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name} — {p.brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("batch")}</Label>
              <Select
                value={logBatchId}
                onValueChange={setLogBatchId}
                disabled={!logProductId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectBatch")} />
                </SelectTrigger>
                <SelectContent>
                  {(batches as Array<{ _id: string; brewsRemaining: number; bestBeforeDate: string }>)?.map((b) => (
                    <SelectItem key={b._id} value={b._id}>
                      {b.brewsRemaining} — {b.bestBeforeDate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="log-date">{t("date")}</Label>
              <Input
                id="log-date"
                type="date"
                value={logDate}
                max={toISODateString(now)}
                onChange={(e) => setLogDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="log-rating">{t("ratingOptional")}</Label>
              <Select value={logRating} onValueChange={setLogRating}>
                <SelectTrigger>
                  <SelectValue placeholder={t("noRating")} />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <SelectItem key={r} value={r.toString()}>
                      {"★".repeat(r)}{"☆".repeat(5 - r)} ({r}/5)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>{tNotes("label")}</Label>
              <textarea
                value={logTastingNotes}
                onChange={(e) => setLogTastingNotes(e.target.value.slice(0, 280))}
                placeholder={tNotes("placeholder")}
                maxLength={280}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground text-right">
                {tNotes("charCount", { count: logTastingNotes.length })}
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setLogDialogOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isLogging || !logProductId || !logBatchId}>
                {isLogging ? t("logging") : t("logCoffee")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
