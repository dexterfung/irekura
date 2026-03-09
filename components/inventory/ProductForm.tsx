"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Doc } from "@/convex/_generated/dataModel";

type CoffeeType = "drip-bag" | "ground-bean" | "concentrate-capsule" | "instant-powder";

const COFFEE_TYPES: { value: CoffeeType; label: string }[] = [
  { value: "drip-bag", label: "Drip Bag" },
  { value: "ground-bean", label: "Ground Bean" },
  { value: "concentrate-capsule", label: "Capsule" },
  { value: "instant-powder", label: "Instant" },
];

interface ProductFormValues {
  name: string;
  brand: string;
  type: CoffeeType;
  bitterness: number;
  sourness: number;
  richness: number;
  notes?: string;
}

interface ProductFormProps {
  defaultValues?: Partial<Doc<"products">>;
  onSubmit: (values: ProductFormValues) => void;
  submitLabel?: string;
  isLoading?: boolean;
}

function StarSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={cn(
              "text-2xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer",
              star <= value ? "text-yellow-400" : "text-muted-foreground"
            )}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProductForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  isLoading = false,
}: ProductFormProps) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [brand, setBrand] = useState(defaultValues?.brand ?? "");
  const [type, setType] = useState<CoffeeType>(defaultValues?.type ?? "drip-bag");
  const [bitterness, setBitterness] = useState(defaultValues?.bitterness ?? 3);
  const [sourness, setSourness] = useState(defaultValues?.sourness ?? 3);
  const [richness, setRichness] = useState(defaultValues?.richness ?? 3);
  const [notes, setNotes] = useState(defaultValues?.notes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ name, brand, type, bitterness, sourness, richness, notes: notes || undefined });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="product-name">Name</Label>
        <Input
          id="product-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ethiopian Yirgacheffe"
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-brand">Brand</Label>
        <Input
          id="product-brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="e.g. Blue Bottle"
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {COFFEE_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors min-h-[44px] cursor-pointer",
                type === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Flavour Profile</Label>
        <StarSelector label="Bitterness" value={bitterness} onChange={setBitterness} />
        <StarSelector label="Sourness" value={sourness} onChange={setSourness} />
        <StarSelector label="Richness" value={richness} onChange={setRichness} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-notes">Notes (optional)</Label>
        <Textarea
          id="product-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes..."
          maxLength={500}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
