import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";
import DesktopSideNav from "@/components/DesktopSideNav";
import PageHeader from "@/components/PageHeader";
import PageTitle from "@/components/PageTitle";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen flex">
      <DesktopSideNav />

      <div className="flex flex-col flex-1 lg:ml-56 min-h-screen">
        {/* Mobile fixed top bar */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
          <PageHeader />
        </header>

        {/* Desktop scrollable header */}
        <div className="hidden lg:block border-b border-border">
          <PageHeader />
        </div>

        <main className="flex-1 pt-16 pb-20 lg:pt-0 lg:pb-0">
          <div className="px-4 pt-4 pb-2">
            <PageTitle />
          </div>
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
