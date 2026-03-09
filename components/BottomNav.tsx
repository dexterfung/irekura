"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Coffee, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/recommend", label: "Recommend", icon: Coffee },
  { href: "/history", label: "History", icon: Calendar },
  { href: "/preferences", label: "Preferences", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
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
