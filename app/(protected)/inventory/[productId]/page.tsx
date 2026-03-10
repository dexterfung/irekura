"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import BatchItem from "@/components/inventory/BatchItem";
import BatchForm from "@/components/inventory/BatchForm";
import ProductForm from "@/components/inventory/ProductForm";
import { ChevronLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

function StarDisplay({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex gap-0.5 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= value ? "text-yellow-400 text-sm" : "text-muted-foreground text-sm"}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const router = useRouter();
  const pid = productId as Id<"products">;
  const t = useTranslations("productDetail");
  const tCommon = useTranslations("common");
  const tForm = useTranslations("productForm");
  const tTypes = useTranslations("productTypes");

  const products = useQuery(api.products.list);
  const batches = useQuery(api.batches.listByProduct, { productId: pid });
  const updateProduct = useMutation(api.products.update);
  const deleteProduct = useMutation(api.products.remove);
  const createBatch = useMutation(api.batches.create);
  const updateBatchQty = useMutation(api.batches.updateQuantity);
  const deleteBatch = useMutation(api.batches.remove);

  const [addBatchOpen, setAddBatchOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<{ id: Id<"batches">; qty: string } | null>(null);
  const [deletingBatchId, setDeletingBatchId] = useState<Id<"batches"> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const product = (products as Doc<"products">[] | undefined)?.find((p) => p._id === (pid as string));

  if (products === undefined || batches === undefined) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-24 bg-muted rounded" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">{t("productNotFound")}</p>
        <Button variant="link" onClick={() => router.push("/inventory")}>
          {tCommon("backToInventory")}
        </Button>
      </div>
    );
  }

  async function handleAddBatch(values: { brewsRemaining: number; bestBeforeDate: string }) {
    setIsLoading(true);
    try {
      await createBatch({ productId: pid, ...values });
      setAddBatchOpen(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateProduct(values: Omit<Parameters<typeof updateProduct>[0], "id">) {
    setIsLoading(true);
    try {
      await updateProduct({ id: pid, ...values });
      setEditProductOpen(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteProduct() {
    setIsLoading(true);
    try {
      await deleteProduct({ id: pid });
      router.push("/inventory");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateBatchQty() {
    if (!editingBatch) return;
    const qty = parseInt(editingBatch.qty, 10);
    if (isNaN(qty) || qty < 0) return;
    setIsLoading(true);
    try {
      await updateBatchQty({ id: editingBatch.id, brewsRemaining: qty });
      setEditingBatch(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteBatch(batchId: Id<"batches">) {
    setIsLoading(true);
    try {
      await deleteBatch({ id: batchId });
      setDeletingBatchId(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 border-b bg-background px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/inventory")}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold flex-1 truncate">{product.name}</h1>
        <div className="flex gap-1">
          <Sheet open={editProductOpen} onOpenChange={setEditProductOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Pencil className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t("editProduct")}</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <ProductForm
                  defaultValues={product}
                  onSubmit={handleUpdateProduct}
                  submitLabel={t("saveChanges")}
                  isLoading={isLoading}
                />
              </div>
            </SheetContent>
          </Sheet>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Product info */}
        <div className="space-y-2">
          <div className="text-muted-foreground">{product.brand}</div>
          <Badge variant="secondary">
            {tTypes(product.type as "drip-bag" | "ground-bean" | "concentrate-capsule" | "instant-powder")}
          </Badge>
          <div className="flex gap-6 mt-3">
            <StarDisplay value={product.bitterness} label={tForm("bitterness")} />
            <StarDisplay value={product.sourness} label={tForm("sourness")} />
            <StarDisplay value={product.richness} label={tForm("richness")} />
          </div>
          {product.notes && (
            <p className="text-sm text-muted-foreground mt-2">{product.notes}</p>
          )}
        </div>

        <Separator />

        {/* Batches */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("batches")}</h2>
            <Sheet open={addBatchOpen} onOpenChange={setAddBatchOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  {t("addBatch")}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom">
                <SheetHeader>
                  <SheetTitle>{t("addNewBatch")}</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <BatchForm
                    onSubmit={handleAddBatch}
                    submitLabel={t("addBatch")}
                    isLoading={isLoading}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {batches.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t("noBatches")}</p>
          ) : (
            <div className="divide-y">
              {(batches as Doc<"batches">[]).map((batch) => (
                <BatchItem
                  key={batch._id}
                  batch={batch}
                  onEditQuantity={() =>
                    setEditingBatch({ id: batch._id, qty: batch.brewsRemaining.toString() })
                  }
                  onDelete={() => setDeletingBatchId(batch._id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit batch quantity dialog */}
      <Dialog open={!!editingBatch} onOpenChange={(open) => !open && setEditingBatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editBrewsRemaining")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="edit-qty">{t("brewsRemainingLabel")}</Label>
            <Input
              id="edit-qty"
              type="number"
              min={0}
              value={editingBatch?.qty ?? ""}
              onChange={(e) =>
                setEditingBatch((prev) => prev ? { ...prev, qty: e.target.value } : null)
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBatch(null)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleUpdateBatchQty} disabled={isLoading}>
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete batch dialog */}
      <Dialog
        open={!!deletingBatchId}
        onOpenChange={(open) => !open && setDeletingBatchId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteBatch")}</DialogTitle>
            <DialogDescription>
              {t("deleteBatchConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingBatchId(null)}>
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingBatchId && handleDeleteBatch(deletingBatchId)}
              disabled={isLoading}
            >
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete product dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteProduct")}</DialogTitle>
            <DialogDescription>
              {t("deleteProductConfirm", { name: product.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={isLoading}>
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
