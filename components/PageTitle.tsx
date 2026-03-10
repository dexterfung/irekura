"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const PAGE_PREFIXES: { prefix: string; key: "inventory" | "recommend" | "history" | "preferences" }[] = [
  { prefix: "/inventory", key: "inventory" },
  { prefix: "/recommend", key: "recommend" },
  { prefix: "/history", key: "history" },
  { prefix: "/preferences", key: "preferences" },
];

export default function PageTitle() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const match = PAGE_PREFIXES.find((p) => pathname.startsWith(p.prefix));
  if (!match) return null;

  return <h1 className="text-2xl font-bold">{t(match.key)}</h1>;
}
