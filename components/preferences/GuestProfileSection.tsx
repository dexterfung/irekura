"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "@/components/preferences/ProfileForm";
import type { FlavorProfile } from "@/lib/recommendations/engine";
import { useTranslations } from "next-intl";

export default function GuestProfileSection() {
  const t = useTranslations("guestProfile");
  const tPrefs = useTranslations("preferences");

  const guestSettings = useQuery(api.settings.getGuestSettings);
  const guestWeekdayProfile = useQuery(
    api.preferences.getForGuest,
    guestSettings?.guestEnabled ? { type: "weekday" } : "skip"
  );
  const guestWeekendProfile = useQuery(
    api.preferences.getForGuest,
    guestSettings?.guestEnabled ? { type: "weekend" } : "skip"
  );

  const setGuestEnabled = useMutation(api.settings.setGuestEnabled);
  const upsertForGuest = useMutation(api.preferences.upsertForGuest);

  const [isTogglingEnabled, setIsTogglingEnabled] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  if (guestSettings === undefined) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  const guestEnabled = guestSettings?.guestEnabled ?? false;

  async function handleToggle() {
    setIsTogglingEnabled(true);
    try {
      await setGuestEnabled({ enabled: !guestEnabled });
    } finally {
      setIsTogglingEnabled(false);
    }
  }

  async function handleSaveGuestPrefs(type: "weekday" | "weekend", profile: FlavorProfile) {
    setIsSavingPrefs(true);
    try {
      await upsertForGuest({ type, ...profile });
    } finally {
      setIsSavingPrefs(false);
    }
  }

  return (
    <div className="mb-6 space-y-4">
      <p className="text-sm font-medium">{t("sectionTitle")}</p>

      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <span className="text-sm">{t("enableToggle")}</span>
        <button
          onClick={handleToggle}
          disabled={isTogglingEnabled}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
            guestEnabled ? "bg-foreground" : "bg-input"
          }`}
          role="switch"
          aria-checked={guestEnabled}
        >
          <span
            className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
              guestEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Display name + guest prefs (only when enabled) */}
      {guestEnabled && (
        <>
          {/* Guest flavour preferences */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("flavorPreferences")}</p>
            <p className="text-sm text-muted-foreground">{t("flavorDescription")}</p>

            <Tabs defaultValue="weekday">
              <TabsList className="w-full">
                <TabsTrigger value="weekday" className="flex-1">
                  {tPrefs("weekday")}
                </TabsTrigger>
                <TabsTrigger value="weekend" className="flex-1">
                  {tPrefs("weekend")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="weekday" className="mt-4">
                <ProfileForm
                  defaultValues={
                    guestWeekdayProfile
                      ? {
                          bitterness: guestWeekdayProfile.bitterness,
                          sourness: guestWeekdayProfile.sourness,
                          richness: guestWeekdayProfile.richness,
                        }
                      : { bitterness: 3, sourness: 3, richness: 3 }
                  }
                  onSave={(profile) => handleSaveGuestPrefs("weekday", profile)}
                  isLoading={isSavingPrefs}
                />
              </TabsContent>
              <TabsContent value="weekend" className="mt-4">
                <ProfileForm
                  defaultValues={
                    guestWeekendProfile
                      ? {
                          bitterness: guestWeekendProfile.bitterness,
                          sourness: guestWeekendProfile.sourness,
                          richness: guestWeekendProfile.richness,
                        }
                      : { bitterness: 3, sourness: 3, richness: 3 }
                  }
                  onSave={(profile) => handleSaveGuestPrefs("weekend", profile)}
                  isLoading={isSavingPrefs}
                />
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
}
