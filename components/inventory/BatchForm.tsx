"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BatchFormValues {
  brewsRemaining: number;
  bestBeforeDate: string;
}

interface BatchFormProps {
  defaultValues?: Partial<BatchFormValues>;
  onSubmit: (values: BatchFormValues) => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export default function BatchForm({
  defaultValues,
  onSubmit,
  submitLabel = "Add Batch",
  isLoading = false,
}: BatchFormProps) {
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
        <Label htmlFor="brews-remaining">Brews Remaining</Label>
        <Input
          id="brews-remaining"
          type="number"
          value={brewsRemaining}
          onChange={(e) => setBrewsRemaining(e.target.value)}
          min={1}
          required
          placeholder="e.g. 10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="best-before">Best Before Date</Label>
        <Input
          id="best-before"
          type="date"
          value={bestBeforeDate}
          onChange={(e) => setBestBeforeDate(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
