import { requireSession } from "@/lib/auth/session";
import { profileService } from "@/features/profile/service";
import { StudioClient } from "./studio-client";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const session = await requireSession();
  const profile = await profileService.getOrCreateProfile(session.userId, session.email, session.name);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">The Fit Studio</h1>
        <p className="text-sm text-muted-foreground">
          Analyze job requirements, evaluate your ATS Fit Score, and tailor your resume bullets to match the role.
        </p>
      </div>

      <StudioClient profile={profile} />
    </div>
  );
}
