"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AuthErrorPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/inventory");
    } else if (status === "unauthenticated") {
      router.replace("/auth/signin?error=true");
    }
  }, [status, router]);

  return null;
}
