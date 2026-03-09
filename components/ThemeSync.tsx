"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ThemeSync() {
  const { setTheme } = useTheme();
  const savedTheme = useQuery(api.settings.getTheme);

  useEffect(() => {
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [savedTheme, setTheme]);

  return null;
}
