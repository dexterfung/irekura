"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "@/components/preferences/ProfileForm";
import type { FlavorProfile } from "@/lib/recommendations/engine";

export default function PreferencesPage() {
  const [isSaving, setIsSaving] = useState(false);
  const { data: session } = useSession();

  const weekdayProfile = useQuery(api.preferences.get, { type: "weekday" });
  const weekendProfile = useQuery(api.preferences.get, { type: "weekend" });
  const upsertProfile = useMutation(api.preferences.upsert);

  async function handleSave(type: "weekday" | "weekend", profile: FlavorProfile) {
    setIsSaving(true);
    try {
      await upsertProfile({ type, ...profile });
    } finally {
      setIsSaving(false);
    }
  }

  const isLoading = weekdayProfile === undefined || weekendProfile === undefined;

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 border-b bg-background px-4 py-3">
        <h1 className="text-xl font-bold">Preferences</h1>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        <p className="text-sm text-muted-foreground mb-4">
          Set how much each flavour dimension matters when getting recommendations.
        </p>

        <div className="mb-6 rounded-lg border border-border p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-destructive hover:bg-accent transition-colors"
          >
            Sign out
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
        ) : (
          <Tabs defaultValue="weekday">
            <TabsList className="w-full">
              <TabsTrigger value="weekday" className="flex-1">
                Weekday
              </TabsTrigger>
              <TabsTrigger value="weekend" className="flex-1">
                Weekend
              </TabsTrigger>
            </TabsList>

            <TabsContent value="weekday" className="mt-4">
              <ProfileForm
                defaultValues={
                  weekdayProfile
                    ? {
                        bitterness: weekdayProfile.bitterness,
                        sourness: weekdayProfile.sourness,
                        richness: weekdayProfile.richness,
                      }
                    : { bitterness: 3, sourness: 3, richness: 3 }
                }
                onSave={(profile) => handleSave("weekday", profile)}
                isLoading={isSaving}
              />
            </TabsContent>

            <TabsContent value="weekend" className="mt-4">
              <ProfileForm
                defaultValues={
                  weekendProfile
                    ? {
                        bitterness: weekendProfile.bitterness,
                        sourness: weekendProfile.sourness,
                        richness: weekendProfile.richness,
                      }
                    : { bitterness: 3, sourness: 3, richness: 3 }
                }
                onSave={(profile) => handleSave("weekend", profile)}
                isLoading={isSaving}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
