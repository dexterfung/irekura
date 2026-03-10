import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import ThemeSync from "@/components/ThemeSync";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { auth } from "@/lib/auth";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Irekura",
  description: "Personal coffee inventory manager with smart daily recommendations",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/irekura-icon-512.svg",
    apple: "/icons/irekura-icon-512.png",
  },
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1a1a1a" />
        <link rel="apple-touch-icon" href="/icons/irekura-icon-512.png" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ConvexClientProvider session={session}>
            <ThemeSync />
            <PWAInstallPrompt />
            <NextTopLoader color="#a16207" height={3} showSpinner={false} />
            {children}
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
