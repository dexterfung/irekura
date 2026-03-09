"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface FilterOption {
  value: string;
  label: string;
}

// ─── Desktop pill ────────────────────────────────────────────────────────────

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

      {open && buttonRect &&
        createPortal(
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(option.value);
                    setOpen(false);
                  }}
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

// ─── Shared option data ───────────────────────────────────────────────────────

export const TYPE_OPTIONS: FilterOption[] = [
  { value: "all", label: "All Types" },
  { value: "drip-bag", label: "Drip Bag" },
  { value: "ground-bean", label: "Ground Bean" },
  { value: "concentrate-capsule", label: "Capsule" },
  { value: "instant-powder", label: "Instant" },
];

export const STATUS_OPTIONS: FilterOption[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "expiring", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
];

export const SORT_OPTIONS: FilterOption[] = [
  { value: "name", label: "Name (A→Z)" },
  { value: "brews", label: "Brews Remaining" },
  { value: "bestBefore", label: "Best Before" },
];

// ─── Mobile sheet section ────────────────────────────────────────────────────

function SheetSection({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: FilterOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        {title}
      </p>
      <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors cursor-pointer",
              value === option.value
                ? "bg-foreground text-background"
                : "bg-background hover:bg-accent"
            )}
          >
            {option.label}
            {value === option.value && <span className="text-xs">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Public types ─────────────────────────────────────────────────────────────

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

// ─── FilterBar ────────────────────────────────────────────────────────────────

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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  function update(key: keyof FilterState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const brandOptions: FilterOption[] = [
    { value: "all", label: "All Brands" },
    ...brands.map((b) => ({ value: b, label: b })),
  ];

  const activeFilterCount = [filters.type, filters.status, filters.brand].filter(
    (v) => v !== "all"
  ).length;

  const hasActiveFilters = activeFilterCount > 0;
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ?? "Sort";

  return (
    <>
      {/* ── Desktop ─────────────────────────────────────────────────── */}
      <div className="hidden lg:block px-4 py-2 border-b border-border">
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

      {/* ── Mobile ──────────────────────────────────────────────────── */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-2 border-b border-border">
        <button
          type="button"
          onClick={() => setFilterSheetOpen(true)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors cursor-pointer",
            hasActiveFilters
              ? "bg-foreground text-background border-foreground"
              : "bg-background border-border hover:bg-accent"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background text-foreground text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSortSheetOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background text-sm font-medium hover:bg-accent transition-colors cursor-pointer"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {currentSortLabel}
        </button>

        <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
          {hasActiveFilters
            ? `${resultCount} of ${totalCount}`
            : `${totalCount} coffee${totalCount !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* ── Filters sheet (mobile) ───────────────────────────────────── */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            <SheetSection
              title="Type"
              options={TYPE_OPTIONS}
              value={filters.type}
              onChange={(v) => update("type", v)}
            />
            <SheetSection
              title="Status"
              options={STATUS_OPTIONS}
              value={filters.status}
              onChange={(v) => update("status", v)}
            />
            <SheetSection
              title="Brand"
              options={brandOptions}
              value={filters.brand}
              onChange={(v) => update("brand", v)}
            />
          </div>

          <div className="flex gap-3 mt-6">
            {hasActiveFilters && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onChange({ ...filters, type: "all", status: "all", brand: "all" });
                  setFilterSheetOpen(false);
                }}
              >
                Clear all
              </Button>
            )}
            <Button className="flex-1" onClick={() => setFilterSheetOpen(false)}>
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Sort sheet (mobile) ──────────────────────────────────────── */}
      <Sheet open={sortSheetOpen} onOpenChange={setSortSheetOpen}>
        <SheetContent side="bottom">
          <SheetHeader className="mb-4">
            <SheetTitle>Sort by</SheetTitle>
          </SheetHeader>

          <SheetSection
            title=""
            options={SORT_OPTIONS}
            value={filters.sort}
            onChange={(v) => { update("sort", v); setSortSheetOpen(false); }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
