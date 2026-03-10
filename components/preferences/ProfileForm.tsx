"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { FlavorProfile } from "@/lib/recommendations/engine";
import { useTranslations } from "next-intl";

interface ProfileFormProps {
  defaultValues?: FlavorProfile;
  onSave: (profile: FlavorProfile) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  isLoading?: boolean;
}

export default function ProfileForm({
  defaultValues = { bitterness: 3, sourness: 3, richness: 3 },
  onSave,
  onDirtyChange,
  isLoading = false,
}: ProfileFormProps) {
  const t = useTranslations("profileForm");
  const tCommon = useTranslations("common");

  const [bitterness, setBitterness] = useState(defaultValues.bitterness);
  const [sourness, setSourness] = useState(defaultValues.sourness);
  const [richness, setRichness] = useState(defaultValues.richness);

  const profile: FlavorProfile = { bitterness, sourness, richness };

  const isDirty =
    bitterness !== defaultValues.bitterness ||
    sourness !== defaultValues.sourness ||
    richness !== defaultValues.richness;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function handleSave() {
    onSave(profile);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>{t("bitternessImportance")}</Label>
            <span className="text-sm font-medium tabular-nums">{bitterness}/5</span>
          </div>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[bitterness]}
            onValueChange={([v]) => setBitterness(v)}
            className="min-h-[44px] py-4"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>{t("sournessImportance")}</Label>
            <span className="text-sm font-medium tabular-nums">{sourness}/5</span>
          </div>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[sourness]}
            onValueChange={([v]) => setSourness(v)}
            className="min-h-[44px] py-4"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>{t("richnessImportance")}</Label>
            <span className="text-sm font-medium tabular-nums">{richness}/5</span>
          </div>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[richness]}
            onValueChange={([v]) => setRichness(v)}
            className="min-h-[44px] py-4"
          />
        </div>
      </div>
      <Button onClick={handleSave} disabled={isLoading} className="w-full">
        {isLoading ? tCommon("saving") : t("saveProfile")}
      </Button>
    </div>
  );
}
