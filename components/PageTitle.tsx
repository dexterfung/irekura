"use client";

import { usePathname } from "next/navigation";

const PAGE_NAMES: { prefix: string; name: string }[] = [
  { prefix: "/inventory", name: "My Coffee" },
  { prefix: "/recommend", name: "Recommend" },
  { prefix: "/history", name: "History" },
  { prefix: "/preferences", name: "Preferences" },
];

export default function PageTitle() {
  const pathname = usePathname();
  const match = PAGE_NAMES.find((p) => pathname.startsWith(p.prefix));
  if (!match) return null;

  return <h1 className="text-2xl font-bold">{match.name}</h1>;
}
