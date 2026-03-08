"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { SessionProvider, useSession } from "next-auth/react";
import { useCallback } from "react";
import type { Session } from "next-auth";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function useAuthFromSession() {
  const { status } = useSession();

  const fetchAccessToken = useCallback(
    async (_opts: { forceRefreshToken: boolean }) => {
      if (status !== "authenticated") return null;
      const response = await fetch("/api/auth/convex-token");
      if (!response.ok) return null;
      const data = (await response.json()) as { token?: string };
      return data.token ?? null;
    },
    [status]
  );

  return {
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    fetchAccessToken,
  };
}

function ConvexWithAuth({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthFromSession}>
      {children}
    </ConvexProviderWithAuth>
  );
}

export default function ConvexClientProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <ConvexWithAuth>{children}</ConvexWithAuth>
    </SessionProvider>
  );
}
