"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import FlavorRadarChart from "./FlavorRadarChart";
import type { FlavorProfile } from "@/lib/recommendations/engine";

interface ProfileFormProps {
  defaultValues?: FlavorProfile;
  onSave: (profile: FlavorProfile) => void;
  isLoading?: boolean;
}

export default function ProfileForm({
  defaultValues = { bitterness: 3, sourness: 3, richness: 3 },
  onSave,
  isLoading = false,
}: ProfileFormProps) {
  const [bitterness, setBitterness] = useState(defaultValues.bitterness);
  const [sourness, setSourness] = useState(defaultValues.sourness);
  const [richness, setRichness] = useState(defaultValues.richness);

  const profile: FlavorProfile = { bitterness, sourness, richness };

  function handleSave() {
    onSave(profile);
  }

  return (
    <div className="space-y-6">
      <FlavorRadarChart profile={profile} />

      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Bitterness Importance</Label>
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
            <Label>Sourness Importance</Label>
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
            <Label>Richness Importance</Label>
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
        {isLoading ? "Saving..." : "Save Profile"}
      </Button>
    </div>
  );
}
