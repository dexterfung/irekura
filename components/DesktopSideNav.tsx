"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Coffee, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/inventory", label: "My Coffee", icon: Package },
  { href: "/recommend", label: "Recommend", icon: Coffee },
  { href: "/history", label: "History", icon: Calendar },
  { href: "/preferences", label: "Preferences", icon: Settings },
];

export default function DesktopSideNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-56 z-50 border-r border-border bg-background flex-col py-6 px-3 gap-1">
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
    </nav>
  );
}
