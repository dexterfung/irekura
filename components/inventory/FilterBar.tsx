"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

function FilterPill({
  label,
  value,
  options,
  onChange,
  isActive,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLabel = options.find((o) => o.value === value)?.label ?? label;
  const buttonRect = open ? buttonRef.current?.getBoundingClientRect() : null;

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
          isActive
            ? "bg-foreground text-background border-foreground"
            : "bg-background border-border hover:bg-accent"
        )}
      >
        {isActive ? currentLabel : `${label}: All`}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform shrink-0", open && "rotate-180")}
        />
      </button>

      {open && buttonRect && createPortal(
        <ul
          style={{
            position: "fixed",
            top: buttonRect.bottom + 4,
            left: buttonRect.left,
            zIndex: 9999,
            minWidth: 150,
          }}
          className="rounded-md border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden"
        >
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onChange(option.value); setOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors flex items-center justify-between gap-4",
                  value === option.value && "font-medium"
                )}
              >
                {option.label}
                {value === option.value && <span>✓</span>}
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}

export interface FilterState {
  type: string;
  status: string;
  brand: string;
  sort: string;
}

export const DEFAULT_FILTERS: FilterState = {
  type: "all",
  status: "all",
  brand: "all",
  sort: "name",
};

const TYPE_OPTIONS: FilterOption[] = [
  { value: "all", label: "All Types" },
  { value: "drip-bag", label: "Drip Bag" },
  { value: "ground-bean", label: "Ground Bean" },
  { value: "concentrate-capsule", label: "Capsule" },
  { value: "instant-powder", label: "Instant" },
];

const STATUS_OPTIONS: FilterOption[] = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "expiring", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
];

const SORT_OPTIONS: FilterOption[] = [
  { value: "name", label: "Name (A→Z)" },
  { value: "brews", label: "Brews Remaining" },
  { value: "bestBefore", label: "Best Before" },
];

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  brands: string[];
  resultCount: number;
  totalCount: number;
}

export default function FilterBar({
  filters,
  onChange,
  brands,
  resultCount,
  totalCount,
}: FilterBarProps) {
  function update(key: keyof FilterState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const brandOptions: FilterOption[] = [
    { value: "all", label: "All Brands" },
    ...brands.map((b) => ({ value: b, label: b })),
  ];

  const hasActiveFilters =
    filters.type !== "all" || filters.status !== "all" || filters.brand !== "all";

  return (
    <div className="px-4 py-2 border-b border-border">
      <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-0.5">
        <FilterPill
          label="Type"
          value={filters.type}
          options={TYPE_OPTIONS}
          onChange={(v) => update("type", v)}
          isActive={filters.type !== "all"}
        />
        <FilterPill
          label="Status"
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={(v) => update("status", v)}
          isActive={filters.status !== "all"}
        />
        <FilterPill
          label="Brand"
          value={filters.brand}
          options={brandOptions}
          onChange={(v) => update("brand", v)}
          isActive={filters.brand !== "all"}
        />
        <FilterPill
          label="Sort"
          value={filters.sort}
          options={SORT_OPTIONS}
          onChange={(v) => update("sort", v)}
          isActive={false}
        />
        <span className="ml-auto shrink-0 text-xs text-muted-foreground whitespace-nowrap pl-2">
          {hasActiveFilters
            ? `${resultCount} of ${totalCount}`
            : `${totalCount} coffee${totalCount !== 1 ? "s" : ""}`}
        </span>
      </div>
    </div>
  );
}
