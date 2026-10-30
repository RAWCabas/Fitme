import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { profileService } from "@/features/profile/service";
import { DashboardNav } from "./dashboard-nav";
import { QuickFillTray } from "@/components/quick-fill-tray";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  let profile;
  try {
    profile = await profileService.getOrCreateProfile(session.userId, session.email, session.name);
  } catch (err) {
    console.error("DashboardLayout profile loading error:", err);
    profile = {
      userId: session.userId,
      contact: {
        fullName: session.name || "Candidate",
        headline: "",
        email: session.email,
        phone: "",
        location: "",
        portfolioUrl: "",
        linkedinUrl: "",
        githubUrl: "",
      },
      summary: "",
      experiences: [],
      projects: [],
      certifications: [],
      skills: [],
      updatedAt: new Date().toISOString(),
    };
  }

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

