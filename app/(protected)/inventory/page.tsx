"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import ProductCard from "@/components/inventory/ProductCard";
import FilterBar, { DEFAULT_FILTERS, type FilterState } from "@/components/inventory/FilterBar";
import { Button } from "@/components/ui/button";
import { getDaysUntilExpiry, toISODateString } from "@/lib/utils";
import type { Doc } from "@/convex/_generated/dataModel";

function InventorySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

export default function InventoryPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const products = useQuery(api.products.list);
  const allBatches = useQuery(api.batches.listActive);

  if (products === undefined || allBatches === undefined) {
    return (
      <div className="min-h-full">
        <InventorySkeleton />
      </div>
    );
  }

  const today = toISODateString(new Date());

  // Build batches-by-product map
  const batchesByProduct: Record<string, Doc<"batches">[]> = {};
  for (const { batch } of (allBatches as Array<{ batch: Doc<"batches">; product: Doc<"products"> }>)) {
    const pid = batch.productId;
    if (!batchesByProduct[pid]) batchesByProduct[pid] = [];
    batchesByProduct[pid].push(batch);
  }

  // Derive unique brands from all products (sorted)
  const brands = [...new Set((products as Doc<"products">[]).map((p) => p.brand))].sort();

  // Apply filters
  let filtered = (products as Doc<"products">[]).filter((product) => {
    const batches = batchesByProduct[product._id] ?? [];

    if (filters.type !== "all" && product.type !== filters.type) return false;
    if (filters.brand !== "all" && product.brand !== filters.brand) return false;

    if (filters.status !== "all") {
      const activeBatches = batches.filter((b) => b.brewsRemaining > 0);
      const hasExpired = batches.some((b) => getDaysUntilExpiry(b.bestBeforeDate, today) < 0);
      const hasExpiringSoon = activeBatches.some(
        (b) => getDaysUntilExpiry(b.bestBeforeDate, today) <= 30
      );
      const hasActive = activeBatches.length > 0;

      if (filters.status === "active" && !hasActive) return false;
      if (filters.status === "expiring" && !hasExpiringSoon) return false;
      if (filters.status === "expired" && !hasExpired) return false;
    }

    return true;
  });

  // Apply sort
  filtered = [...filtered].sort((a, b) => {
    if (filters.sort === "name") {
      return a.name.localeCompare(b.name);
    }
    if (filters.sort === "brews") {
      const aBrews = (batchesByProduct[a._id] ?? []).reduce((s, b) => s + b.brewsRemaining, 0);
      const bBrews = (batchesByProduct[b._id] ?? []).reduce((s, b) => s + b.brewsRemaining, 0);
      return bBrews - aBrews;
    }
    if (filters.sort === "bestBefore") {
      const aBatches = batchesByProduct[a._id] ?? [];
      const bBatches = batchesByProduct[b._id] ?? [];
      const aDate = aBatches.length > 0 ? aBatches.reduce((min, b) => b.bestBeforeDate < min ? b.bestBeforeDate : min, aBatches[0].bestBeforeDate) : "9999";
      const bDate = bBatches.length > 0 ? bBatches.reduce((min, b) => b.bestBeforeDate < min ? b.bestBeforeDate : min, bBatches[0].bestBeforeDate) : "9999";
      return aDate.localeCompare(bDate);
    }
    return 0;
  });

  if ((products as Doc<"products">[]).length === 0) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="text-4xl mb-4">☕</div>
        <h2 className="text-lg font-semibold mb-1">No coffee yet</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Add your first coffee product to get started
        </p>
        <Button asChild>
          <Link href="/inventory/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Coffee
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        brands={brands}
        resultCount={filtered.length}
        totalCount={(products as Doc<"products">[]).length}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <p className="text-muted-foreground text-sm">No coffees match the current filters.</p>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="mt-3 text-sm underline cursor-pointer text-foreground"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
          {filtered.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              batches={batchesByProduct[product._id] ?? []}
              href={`/inventory/${product._id}`}
            />
          ))}
        </div>
      )}

      <Button
        asChild
        size="icon"
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg lg:bottom-6"
        aria-label="Add new coffee"
      >
        <Link href="/inventory/new">
          <Plus className="h-6 w-6" />
        </Link>
      </Button>
    </div>
  );
}
