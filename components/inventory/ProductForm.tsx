"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type CoffeeType = "drip-bag" | "ground-bean" | "concentrate-capsule" | "instant-powder";

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
  defaultValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  submitLabel?: string;
  isLoading?: boolean;
}

function AutocompleteInput({
  id,
  value,
  onChange,
  suggestions,
  placeholder,
  required,
  maxLength,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const filtered = value.trim()
    ? suggestions.filter(
        (s) =>
          s.toLowerCase().includes(value.toLowerCase()) &&
          s.toLowerCase() !== value.toLowerCase()
      )
    : [];

  function updateRect() {
    if (inputRef.current) setRect(inputRef.current.getBoundingClientRect());
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!inputRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => { onChange(e.target.value); updateRect(); setOpen(true); }}
        onFocus={() => { updateRect(); setOpen(true); }}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        autoComplete="off"
      />
      {open && filtered.length > 0 && rect && createPortal(
        <ul
          style={{
            position: "fixed",
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
          }}
          className="rounded-md border border-border bg-popover text-popover-foreground shadow-lg max-h-48 overflow-y-auto"
        >
          {filtered.slice(0, 6).map((s) => (
            <li
              key={s}
              onMouseDown={(e) => { e.preventDefault(); onChange(s); setOpen(false); }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
            >
              {s}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </>
  );
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
  const tStar = useTranslations("starRating");
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
            aria-label={tStar("star", { count: star })}
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
  submitLabel,
  isLoading = false,
}: ProductFormProps) {
  const t = useTranslations("productForm");
  const tTypes = useTranslations("productTypes");
  const tCommon = useTranslations("common");

  const COFFEE_TYPES: { value: CoffeeType; label: string }[] = [
    { value: "drip-bag", label: tTypes("drip-bag") },
    { value: "ground-bean", label: tTypes("ground-bean") },
    { value: "concentrate-capsule", label: tTypes("concentrate-capsule") },
    { value: "instant-powder", label: tTypes("instant-powder") },
  ];

  const [name, setName] = useState(defaultValues?.name ?? "");
  const [brand, setBrand] = useState(defaultValues?.brand ?? "");

  const allProducts = (useQuery(api.products.list) ?? []) as Array<{ name: string; brand: string }>;
  const nameSuggestions = [...new Set(allProducts.map((p) => p.name))];
  const brandSuggestions = [...new Set(allProducts.map((p) => p.brand))];
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
        <Label htmlFor="product-name">{t("name")}</Label>
        <AutocompleteInput
          id="product-name"
          value={name}
          onChange={setName}
          suggestions={nameSuggestions}
          placeholder={t("namePlaceholder")}
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-brand">{t("brand")}</Label>
        <AutocompleteInput
          id="product-brand"
          value={brand}
          onChange={setBrand}
          suggestions={brandSuggestions}
          placeholder={t("brandPlaceholder")}
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("type")}</Label>
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
        <Label>{t("flavorProfile")}</Label>
        <StarSelector label={t("bitterness")} value={bitterness} onChange={setBitterness} />
        <StarSelector label={t("sourness")} value={sourness} onChange={setSourness} />
        <StarSelector label={t("richness")} value={richness} onChange={setRichness} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-notes">{t("notes")}</Label>
        <Textarea
          id="product-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("notesPlaceholder")}
          maxLength={500}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? tCommon("saving") : (submitLabel ?? tCommon("save"))}
      </Button>
    </form>
  );
}
