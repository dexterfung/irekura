"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProfileForm from "@/components/preferences/ProfileForm";
import type { FlavorProfile } from "@/lib/recommendations/engine";
import { useTranslations, useLocale } from "next-intl";
import { setLocale } from "@/app/actions/locale";

export default function PreferencesPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const t = useTranslations("preferences");
  const tCommon = useTranslations("common");
  const currentLocale = useLocale();

  useEffect(() => setMounted(true), []);
  const saveTheme = useMutation(api.settings.setTheme);

  const weekdayProfile = useQuery(api.preferences.get, { type: "weekday" });
  const weekendProfile = useQuery(api.preferences.get, { type: "weekend" });
  const upsertProfile = useMutation(api.preferences.upsert);

  // Keep a ref so event handlers always see the latest value
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Intercept anchor link clicks
  const handleLinkClick = useCallback((e: MouseEvent) => {
    if (!isDirtyRef.current) return;
    const link = (e.target as Element).closest("a[href]");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("/")) return;
    e.preventDefault();
    e.stopPropagation();
    setPendingHref(href);
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleLinkClick, true);
    return () => document.removeEventListener("click", handleLinkClick, true);
  }, [handleLinkClick]);

  // Push a duplicate history entry when dirty so the first back press
  // stays on this page, then intercept popstate to show the dialog
  useEffect(() => {
    if (!isDirty) return;
    window.history.pushState(null, "", window.location.href);

    function handlePopState() {
      if (isDirtyRef.current) {
        // Re-push so repeated back presses keep triggering the dialog
        window.history.pushState(null, "", window.location.href);
        setPendingHref("__back__");
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty]);

  // Warn on browser refresh / tab close
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  async function handleSave(type: "weekday" | "weekend", profile: FlavorProfile) {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await upsertProfile({ type, ...profile });
      setSaveStatus("success");
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }

  const isLoading = weekdayProfile === undefined || weekendProfile === undefined;

  return (
    <div className="min-h-full">
      <div className="p-4 max-w-lg mx-auto">

        {/* Account */}
        <div className="mb-6 rounded-lg border border-border p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => { setTheme("system"); void signOut({ callbackUrl: "/auth/signin" }); }}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-destructive hover:bg-accent transition-colors"
          >
            {tCommon("signOut")}
          </button>
        </div>

        {/* Appearance */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-2">{t("appearance")}</p>
          <div className="grid grid-cols-3 gap-2">
            {(["system", "light", "dark"] as const).map((option) => (
              <button
                key={option}
                onClick={() => { setTheme(option); void saveTheme({ theme: option }); }}
                className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors cursor-pointer ${
                  mounted && theme === option
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:bg-accent"
                }`}
              >
                {option === "system" ? tCommon("system") : option === "light" ? tCommon("light") : tCommon("dark")}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-2">{t("language")}</p>
          <div className="grid grid-cols-2 gap-2">
            {(["en", "zh-HK"] as const).map((loc) => (
              <button
                key={loc}
                onClick={() => startTransition(async () => { await setLocale(loc); window.location.reload(); })}
                disabled={isPending}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  currentLocale === loc
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:bg-accent"
                }`}
              >
                {loc === "en" ? "English" : "繁體中文"}
              </button>
            ))}
          </div>
        </div>

        {/* Flavour preferences */}
        <p className="text-sm font-medium mb-2">{t("flavorPreferences")}</p>
        <p className="text-sm text-muted-foreground mb-4">
          {t("flavorDescription")}
        </p>

        {saveStatus && (
          <Toast
            message={saveStatus === "success" ? t("saved") : t("saveFailed")}
            type={saveStatus}
            onDismiss={() => setSaveStatus(null)}
          />
        )}

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
        ) : (
          <Tabs defaultValue="weekday">
            <TabsList className="w-full">
              <TabsTrigger value="weekday" className="flex-1">
                {t("weekday")}
              </TabsTrigger>
              <TabsTrigger value="weekend" className="flex-1">
                {t("weekend")}
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
                onDirtyChange={setIsDirty}
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
                onDirtyChange={setIsDirty}
                isLoading={isSaving}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={!!pendingHref} onOpenChange={() => setPendingHref(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("unsavedTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("unsavedMessage")}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPendingHref(null)}>
              {t("stay")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const href = pendingHref;
                setPendingHref(null);
                setIsDirty(false);
                if (href === "__back__") {
                  window.history.go(-2); // skip the two duplicate entries we pushed
                } else {
                  window.location.href = href!;
                }
              }}
            >
              {t("leave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
