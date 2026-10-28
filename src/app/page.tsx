import { Sparkles, FileText, CheckCircle2, LayoutDashboard } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-6 text-left">
          <div className="p-5 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base mb-1">Master Vault</h3>
            <p className="text-sm text-muted-foreground">
              Single source of truth with granular show/hide item toggles.
            </p>
          </div>

          <div className="p-5 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base mb-1">Fit Studio</h3>
            <p className="text-sm text-muted-foreground">
              ATS keyword matching, 1–2 page solver, and instant diff preview.
            </p>
          </div>

          <div className="p-5 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base mb-1">Quick-Fill & Pipeline</h3>
            <p className="text-sm text-muted-foreground">
              1-click application form copy drawer & follow-up aging alerts.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

