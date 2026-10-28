import Link from "next/link";
import { 
  Sparkles, 
  Layers, 
  FolderArchive, 
  Clock, 
  Send, 
  CheckCircle2, 
  Trophy,
  ArrowRight,
  Plus
} from "lucide-react";
import { getSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Fitme Pipeline Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Hello, {session?.name || "Candidate"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your tailored resumes, ATS scores, and application pipeline.
          </p>
        </div>

        <Link
          href="/studio"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Resume Tailor</span>
        </Link>
      </div>

      {/* Lifecycle Status Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Drafts</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">0</div>
          <p className="text-[11px] text-muted-foreground">In progress in Fit Studio</p>
        </div>

        <div className="p-4 rounded-xl border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Sent</span>
            <Send className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">0</div>
          <p className="text-[11px] text-muted-foreground">Submitted applications</p>
        </div>

        <div className="p-4 rounded-xl border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Interviews</span>
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold">0</div>
          <p className="text-[11px] text-muted-foreground">Cheat sheets available</p>
        </div>

        <div className="p-4 rounded-xl border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Job Offers</span>
            <Trophy className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold">0</div>
          <p className="text-[11px] text-muted-foreground">Celebratory milestones</p>
        </div>
      </div>

      {/* Main Core Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="p-6 rounded-2xl border bg-card shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold">The Fit Studio</h3>
            <p className="text-sm text-muted-foreground">
              Paste any Job Description or link. Bedrock extracts keywords, calculates your ATS Fit Score, and rewrites bullets into Google XYZ format.
            </p>
          </div>
          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline pt-2"
          >
            <span>Open Fit Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl border bg-card shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FolderArchive className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold">Master Experience Vault</h3>
            <p className="text-sm text-muted-foreground">
              Your single source of truth for past roles, side projects, and skills. Use granular item toggles to hide or display specific bullets per resume.
            </p>
          </div>
          <Link
            href="/vault"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline pt-2"
          >
            <span>Manage Master Vault</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
