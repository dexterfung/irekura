"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

interface BatchFormValues {
  brewsRemaining: number;
  bestBeforeDate: string;
}

interface BatchFormProps {
  defaultValues?: Partial<BatchFormValues>;
  onSubmit: (values: BatchFormValues) => void;
  submitLabel?: string;
  isLoading?: boolean;
  isApproximate?: boolean;
}

export default function BatchForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isLoading = false,
  isApproximate = false,
}: BatchFormProps) {
  const t = useTranslations("batchForm");
  const tCommon = useTranslations("common");

  const [brewsRemaining, setBrewsRemaining] = useState(
    defaultValues?.brewsRemaining?.toString() ?? "10"
  );
  const [bestBeforeDate, setBestBeforeDate] = useState(defaultValues?.bestBeforeDate ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const brews = parseInt(brewsRemaining, 10);
    if (isNaN(brews) || brews < 1) return;
    onSubmit({ brewsRemaining: brews, bestBeforeDate });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="brews-remaining">{isApproximate ? t("estimatedServings") : t("brewsRemaining")}</Label>
        <Input
          id="brews-remaining"
          type="number"
          value={brewsRemaining}
          onChange={(e) => setBrewsRemaining(e.target.value)}
          min={1}
          required
          placeholder={t("brewsPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="best-before">{t("bestBeforeDate")}</Label>
        <Input
          id="best-before"
          type="date"
          value={bestBeforeDate}
          onChange={(e) => setBestBeforeDate(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? tCommon("saving") : (submitLabel ?? t("addBatch"))}
      </Button>
    </form>
  );
}
