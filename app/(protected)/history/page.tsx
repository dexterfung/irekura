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
  const t = useTranslations("history");
  const tCommon = useTranslations("common");

  // Quick-log form state
  const [logProductId, setLogProductId] = useState("");
  const [logBatchId, setLogBatchId] = useState("");
  const [logDate, setLogDate] = useState(toISODateString(now));
  const [logRating, setLogRating] = useState<string>("");
  const [isLogging, setIsLogging] = useState(false);

  const monthLogs = useQuery(api.consumption.listByMonth, { year, month });
  const products = useQuery(api.products.list);
  const batches = useQuery(api.batches.listByProduct, logProductId ? { productId: logProductId as Id<"products"> } : "skip");
  const createLog = useMutation(api.consumption.create);

  const datesWithEntries = new Set<string>(
    monthLogs?.map(({ log }: { log: { date: string } }) => log.date) ?? []
  );

  const selectedDateEntries =
    selectedDate && monthLogs
      ? monthLogs.filter(({ log }: { log: { date: string } }) => log.date === selectedDate)
      : [];

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
      });
      setLogDialogOpen(false);
      setLogProductId("");
      setLogBatchId("");
      setLogRating("");
    } finally {
      setIsLogging(false);
    }
  }

  return (
    <div className="min-h-full">
      <div className="p-4 max-w-lg mx-auto">
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
