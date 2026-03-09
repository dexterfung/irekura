"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Coffee, Calendar, Settings, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/inventory", label: "My Coffee", icon: Package },
  { href: "/recommend", label: "Recommend", icon: Coffee },
  { href: "/history", label: "History", icon: Calendar },
  { href: "/preferences", label: "Preferences", icon: Settings },
];

export default function DesktopSideNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { setTheme } = useTheme();

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
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="absolute bottom-full right-0 mb-1 px-2 py-1 text-xs rounded bg-foreground text-background whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Sign out
          </span>
        </button>
      </div>
    </nav>
  );
}
