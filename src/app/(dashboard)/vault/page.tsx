import { requireSession } from "@/lib/auth/session";
import { profileService } from "@/features/profile/service";
import { VaultClient } from "./vault-client";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const session = await requireSession();
  const profile = await profileService.getOrCreateProfile(session.userId, session.email, session.name);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Master Experience Vault</h1>
        <p className="text-sm text-muted-foreground">
          Your single source of truth for work history, projects, and skills. Use the eye icon on any item to hide it from generated resumes.
        </p>
      </div>

      <VaultClient initialProfile={profile} />
    </div>
  );
}

