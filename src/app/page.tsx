import Link from "next/link";
import { 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  LayoutDashboard, 
  ArrowRight, 
  LogIn, 
  UserPlus 
} from "lucide-react";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Navigation Bar */}
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xl">Fitme</span>
          </Link>

          <div className="flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Signed in as <strong className="text-foreground">{session.name}</strong>
                </span>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero & Features */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:py-20 md:px-12">
        <div className="z-10 max-w-4xl w-full flex flex-col items-center text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Fitme V1 Pipeline</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            AI Resume Tailor & <br className="hidden sm:inline" />
            <span className="text-primary">Job Application Pipeline</span>
          </h1>

          <p className="max-w-2xl text-muted-foreground text-base md:text-lg">
            Ground your resume in your Master Experience Vault. Evaluate job description fit,
            rewrite bullets into metric-driven Google XYZ format, and track your applications.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
            >
              <span>{session ? "Enter Dashboard" : "Get Started Now"}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border bg-card text-foreground font-semibold text-base hover:bg-muted transition-all"
            >
              <span>Try Fit Studio</span>
            </Link>
          </div>

          {/* Interactive Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-8 text-left">
            {/* Card 1: Master Vault */}
            <Link
              href="/vault"
              className="group p-5 rounded-xl border bg-card text-card-foreground shadow-sm hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                  Master Vault
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Single source of truth with granular show/hide item toggles.
                </p>
              </div>
              <span className="text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:underline">
                Open Vault <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            {/* Card 2: Fit Studio */}
            <Link
              href="/studio"
              className="group p-5 rounded-xl border bg-card text-card-foreground shadow-sm hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                  Fit Studio
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  ATS keyword matching, 1–2 page solver, and instant diff preview.
                </p>
              </div>
              <span className="text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:underline">
                Open Studio <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            {/* Card 3: Quick-Fill & Pipeline */}
            <Link
              href="/dashboard"
              className="group p-5 rounded-xl border bg-card text-card-foreground shadow-sm hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                  Quick-Fill & Pipeline
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  1-click application form copy drawer & follow-up aging alerts.
                </p>
              </div>
              <span className="text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:underline">
                Open Pipeline <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
