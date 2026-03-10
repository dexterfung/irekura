"use client";

import { cn } from "@/lib/utils";
import type { Mood } from "@/lib/recommendations/engine";
import { useTranslations } from "next-intl";

interface MoodSelectorProps {
  selected: Mood | null;
  onSelect: (mood: Mood) => void;
}

export default function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  const t = useTranslations("recommend");

  const MOODS: { value: Mood; label: string; emoji: string; description: string }[] = [
    {
      value: "light-bright",
      label: t("lightBright"),
      emoji: "☀️",
      description: t("lightBrightDesc"),
    },
    {
      value: "strong-rich",
      label: t("strongRich"),
      emoji: "💪",
      description: t("strongRichDesc"),
    },
    {
      value: "smooth-balanced",
      label: t("smoothBalanced"),
      emoji: "⚖️",
      description: t("smoothBalancedDesc"),
    },
    {
      value: "surprise-me",
      label: t("surpriseMe"),
      emoji: "🎲",
      description: t("surpriseMeDesc"),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {MOODS.map(({ value, label, emoji, description }) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl border p-4 text-center transition-colors min-h-[88px] cursor-pointer",
            selected === value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:bg-accent"
          )}
        >
          <span className="text-2xl">{emoji}</span>
          <span className="font-medium text-sm leading-tight">{label}</span>
          <span
            className={cn(
              "text-xs leading-tight",
              selected === value ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            {description}
          </span>
        </button>
      ))}
    </div>
  );
}
