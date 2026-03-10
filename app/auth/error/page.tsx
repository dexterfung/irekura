"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthErrorPage() {
  const router = useRouter();

  useEffect(() => {
    // Any error during OAuth means the user is not authenticated — send them
    // back to sign in. We don't rely on useSession here because Convex may not
    // be available in this context, which keeps the session stuck in "loading".
    router.replace("/auth/signin?error=true");
  }, [router]);

  return null;
}
