import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Irekura",
  description: "Personal coffee inventory manager with smart daily recommendations",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Irekura",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1a1a1a" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <ConvexClientProvider session={session}>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
