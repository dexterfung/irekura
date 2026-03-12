"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthErrorPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home — the root page checks session and routes accordingly:
    // authenticated → /inventory, unauthenticated → /auth/signin
    router.replace("/");
  }, [router]);

  return null;
}
