import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, parseISO, format, getDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDaysUntilExpiry(bestBeforeDate: string, today?: string): number {
  const todayDate = today ? parseISO(today) : new Date();
  const expiryDate = parseISO(bestBeforeDate);
  return differenceInDays(expiryDate, todayDate);
}

export function toISODateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getDayType(dateISO: string): "weekday" | "weekend" {
  const day = getDay(parseISO(dateISO));
  return day === 0 || day === 6 ? "weekend" : "weekday";
}
