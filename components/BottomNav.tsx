"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Coffee, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const navItems = [
    { href: "/inventory", label: t("inventory"), icon: Package },
    { href: "/recommend", label: t("recommend"), icon: Coffee },
    { href: "/history", label: t("history"), icon: Calendar },
    { href: "/preferences", label: t("preferences"), icon: Settings },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 px-1 min-h-[56px] text-xs transition-colors",
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
