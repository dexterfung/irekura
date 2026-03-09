"use client";

import { Suspense } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import ProductCard from "@/components/inventory/ProductCard";
import { Button } from "@/components/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";

function InventoryList() {
  const router = useRouter();
  const products = useQuery(api.products.list);
  const allBatches = useQuery(api.batches.listActive);

  if (products === undefined || allBatches === undefined) {
    return <InventorySkeleton />;
  }

  const batchesByProduct: Record<string, Doc<"batches">[]> = {};
  for (const { batch } of (allBatches as Array<{ batch: Doc<"batches">; product: Doc<"products"> }>)) {
    const pid = batch.productId;
    if (!batchesByProduct[pid]) batchesByProduct[pid] = [];
    batchesByProduct[pid].push(batch);
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="text-4xl mb-4">☕</div>
        <h2 className="text-lg font-semibold mb-1">No coffee yet</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Add your first coffee product to get started
        </p>
        <Button onClick={() => router.push("/inventory/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Coffee
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
      {(products as Doc<"products">[]).map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          batches={batchesByProduct[product._id] ?? []}
          onClick={() => router.push(`/inventory/${product._id}`)}
        />
      ))}
    </div>
  );
}

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
  const router = useRouter();

  return (
    <div className="min-h-full">
<Suspense fallback={<InventorySkeleton />}>
        <InventoryList />
      </Suspense>

      <Button
        size="icon"
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg"
        onClick={() => router.push("/inventory/new")}
        aria-label="Add new coffee"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
