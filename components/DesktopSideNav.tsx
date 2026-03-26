"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Coffee, Calendar, Settings, BarChart3, LogOut, Sun, Moon, Monitor } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useState, useEffect, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { setLocale } from "@/app/actions/locale";

const THEME_OPTIONS = [
  { value: "system", icon: Monitor },
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
] as const;

export default function DesktopSideNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const saveTheme = useMutation(api.settings.setTheme);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const currentLocale = useLocale();

  useEffect(() => setMounted(true), []);

  const navItems = [
    { href: "/inventory", label: t("inventory"), icon: Package },
    { href: "/recommend", label: t("recommend"), icon: Coffee },
    { href: "/history", label: t("history"), icon: Calendar },
    { href: "/insights", label: t("insights"), icon: BarChart3 },
    { href: "/preferences", label: t("preferences"), icon: Settings },
  ];

  const themeLabels: Record<string, string> = {
    system: tCommon("system"),
    light: tCommon("light"),
    dark: tCommon("dark"),
  };

  return (
    <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-56 z-50 border-r border-border bg-background flex-col py-6 px-3">
      <div className="flex flex-col gap-1 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Theme toggle */}
      <div className="flex items-center gap-1 px-3 py-2 mb-1">
        {THEME_OPTIONS.map(({ value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => { setTheme(value); void saveTheme({ theme: value }); }}
            className={cn(
              "flex-1 flex items-center justify-center py-1.5 rounded-md transition-colors cursor-pointer group relative",
              mounted && theme === value
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
            aria-label={themeLabels[value]}
          >
            <Icon className="h-4 w-4" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded bg-foreground text-background whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {themeLabels[value]}
            </span>
          </button>
        ))}
      </div>

      {/* Language switcher */}
      <div className="flex items-center gap-1 px-3 py-2 mb-1">
        {(["en", "zh-HK"] as const).map((loc) => (
          <button
            key={loc}
            onClick={() => startTransition(async () => { await setLocale(loc); window.location.reload(); })}
            disabled={isPending}
            className={cn(
              "flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
              currentLocale === loc
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {loc === "en" ? "EN" : "中文"}
          </button>
        ))}
      </div>

      {/* User info at bottom */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
          {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{session?.user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
        </div>
        <button
          onClick={() => { setTheme("system"); void signOut({ callbackUrl: "/auth/signin" }); }}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors cursor-pointer group relative"
          aria-label={tCommon("signOut")}
        >
          <LogOut className="h-4 w-4" />
          <span className="absolute bottom-full right-0 mb-1 px-2 py-1 text-xs rounded bg-foreground text-background whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {tCommon("signOut")}
          </span>
        </button>
      </div>
    </nav>
  );
}
