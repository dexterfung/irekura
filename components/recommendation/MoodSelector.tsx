"use client";

import { cn } from "@/lib/utils";
import type { Mood } from "@/lib/recommendations/engine";

const MOODS: { value: Mood; label: string; emoji: string; description: string }[] = [
  {
    value: "light-bright",
    label: "Light & Bright",
    emoji: "☀️",
    description: "Citrusy and refreshing",
  },
  {
    value: "strong-rich",
    label: "Strong & Rich",
    emoji: "💪",
    description: "Bold and intense",
  },
  {
    value: "smooth-balanced",
    label: "Smooth & Balanced",
    emoji: "⚖️",
    description: "Well-rounded",
  },
  {
    value: "surprise-me",
    label: "Surprise Me",
    emoji: "🎲",
    description: "Something different",
  },
];

interface MoodSelectorProps {
  selected: Mood | null;
  onSelect: (mood: Mood) => void;
}

export default function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
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
