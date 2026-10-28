import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { profileService } from "@/features/profile/service";
import { DashboardNav } from "./dashboard-nav";
import { QuickFillTray } from "@/components/quick-fill-tray";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const profile = await profileService.getOrCreateProfile(session.userId, session.email, session.name);

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <DashboardNav session={session} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
        {children}
      </main>
      <QuickFillTray profile={profile} />
    </div>
  );
}

