"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const t = useTranslations("pwa");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if previously dismissed
    if (sessionStorage.getItem("pwa-prompt-dismissed")) return;

    const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") setInstallEvent(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-prompt-dismissed", "1");
    setDismissed(true);
  };

  if (dismissed) return null;
  if (!installEvent && !isIOS) return null;

  return (
    <div className="lg:hidden fixed bottom-20 left-4 right-4 z-50 rounded-xl border border-border bg-background shadow-lg p-4">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/irekura-icon-512.svg" alt="" className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{t("title")}</p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground mt-0.5">{t("iosHint")}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">{t("androidHint")}</p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground text-lg leading-none shrink-0 cursor-pointer"
          aria-label={t("dismiss")}
        >
          ×
        </button>
      </div>
      {!isIOS && (
        <button
          onClick={handleInstall}
          className="mt-3 w-full rounded-lg bg-foreground text-background text-sm font-medium py-2 hover:opacity-90 transition-opacity cursor-pointer"
        >
          {t("install")}
        </button>
      )}
    </div>
  );
}
