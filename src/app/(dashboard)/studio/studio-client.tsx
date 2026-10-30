"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Loader2, 
  Wand2, 
  ArrowLeft,
  Building,
  MapPin,
  TrendingUp,
  Printer,
  FileCode,
  X,
  Copy,
  Check,
  History,
  Award,
  Pencil,
  Plus,
  Trash2,
  Save
} from "lucide-react";
import { Profile } from "@/features/profile/schema";
import { JobOpportunity, TailoredResume, PageBudget, TypographyPreset, ResumeStatus } from "@/features/tailor/schema";

interface StudioClientProps {
  profile: Profile;
  savedResumes?: TailoredResume[];
  savedJobs?: Record<string, JobOpportunity>;
}

export function StudioClient({ profile, savedResumes = [], savedJobs = {} }: StudioClientProps) {
  // Ingestion form state
  const [jdText, setJdText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [pageBudget, setPageBudget] = useState<PageBudget>("1_page");
  const [preset, setPreset] = useState<TypographyPreset>("cabas_executive");
  const [analyzing, setAnalyzing] = useState(false);

  // Active Tailoring state & Saved versions list
  const [resumesList, setResumesList] = useState<TailoredResume[]>(savedResumes);
  const [jobsMap, setJobsMap] = useState<Record<string, JobOpportunity>>(savedJobs);
  const [activeJob, setActiveJob] = useState<JobOpportunity | null>(() => {
    if (savedResumes.length > 0 && savedJobs[savedResumes[0].jobOpportunityId]) {
      return savedJobs[savedResumes[0].jobOpportunityId];
    }
    return null;
  });
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(() => {
    if (savedResumes.length > 0) {
      return savedResumes[0];
    }
    return null;
  });

  // Mobile navigation tabs
  const [mobileTab, setMobileTab] = useState<"job" | "ats" | "resume">("resume");

  // Bullet booster modal state
  const [boostingBullet, setBoostingBullet] = useState<{ roleIndex: number; bulletIndex: number; content: string } | null>(null);
  const [boostMetrics, setBoostMetrics] = useState("");
  const [boosting, setBoosting] = useState(false);

  // Status updating
  const [statusUpdating, setStatusUpdating] = useState(false);

  // On-Demand AI Boosters state
  const [showBoosters, setShowBoosters] = useState(false);
  const [boosterTab, setBoosterTab] = useState<"cover_letter" | "outreach" | "cheat_sheet">("cover_letter");
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [outreachNote, setOutreachNote] = useState<string | null>(null);
  const [cheatSheet, setCheatSheet] = useState<{
    predictedQuestions: { question: string; context: string; suggestedApproach: string }[];
    talkingPointsForGaps: string[];
    questionsToAskInterviewer: string[];
  } | null>(null);
  const [generatingBooster, setGeneratingBooster] = useState(false);
  const [copiedBooster, setCopiedBooster] = useState<string | null>(null);

  // Resume Direct Editing State
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [editingSummary, setEditingSummary] = useState(false);
  const [tempSummary, setTempSummary] = useState("");
  const [editingBulletKey, setEditingBulletKey] = useState<string | null>(null);
  const [editBulletText, setEditBulletText] = useState("");
  const [addingBulletForRole, setAddingBulletForRole] = useState<number | null>(null);
  const [newRoleBulletText, setNewRoleBulletText] = useState("");
  const [savingEdits, setSavingEdits] = useState(false);
  const [savedEditsSuccess, setSavedEditsSuccess] = useState(false);

  // LocalStorage Resilience: Restore cached resumes if server memory restarted / cold-started
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cachedRaw = localStorage.getItem(`fitme_resumes_cache_${profile.userId}`);
      const cachedJobsRaw = localStorage.getItem(`fitme_jobs_cache_${profile.userId}`);
      if (cachedRaw) {
        const cached: TailoredResume[] = JSON.parse(cachedRaw);
        if (cached.length > 0) {
          setResumesList((current) => {
            const map = new Map<string, TailoredResume>();
            current.forEach((r) => map.set(r.id, r));
            cached.forEach((r) => {
              if (!map.has(r.id)) map.set(r.id, r);
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            return merged;
          });
        }
      }
      if (cachedJobsRaw) {
        const cachedJ: Record<string, JobOpportunity> = JSON.parse(cachedJobsRaw);
        setJobsMap((current) => ({ ...cachedJ, ...current }));
      }
    } catch (e) {
      console.error("Failed to load cached resumes from localStorage", e);
    }
  }, [profile.userId]);

  // Persist to localStorage whenever resumesList or jobsMap updates
  React.useEffect(() => {
    if (typeof window === "undefined" || resumesList.length === 0) return;
    try {
      localStorage.setItem(`fitme_resumes_cache_${profile.userId}`, JSON.stringify(resumesList));
    } catch {}
  }, [resumesList, profile.userId]);

  React.useEffect(() => {
    if (typeof window === "undefined" || Object.keys(jobsMap).length === 0) return;
    try {
      localStorage.setItem(`fitme_jobs_cache_${profile.userId}`, JSON.stringify(jobsMap));
    } catch {}
  }, [jobsMap, profile.userId]);

  async function saveResumeEdits(updates: Partial<Pick<TailoredResume, "title" | "tailoredSummary" | "tailoredExperiences" | "tailoredProjects" | "tailoredCertifications" | "selectedSkills">>) {
    if (!tailoredResume) return;
    setSavingEdits(true);
    try {
      const res = await fetch(`/api/tailor/resumes/${tailoredResume.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updated: TailoredResume = await res.json();
        setTailoredResume(updated);
        setResumesList((prev) => {
          const list = prev.map((r) => (r.id === updated.id ? updated : r));
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(`fitme_resumes_cache_${profile.userId}`, JSON.stringify(list));
            } catch {}
          }
          return list;
        });
        setSavedEditsSuccess(true);
        setTimeout(() => setSavedEditsSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save resume edits", err);
    } finally {
      setSavingEdits(false);
    }
  }

  // Delete Tailored Resume
  async function handleDeleteResume(resumeId: string) {
    if (!window.confirm("Are you sure you want to delete this tailored resume? This cannot be undone.")) return;
    try {
      await fetch(`/api/tailor/resumes/${resumeId}`, { method: "DELETE" });
      const remaining = resumesList.filter((r) => r.id !== resumeId);
      setResumesList(remaining);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`fitme_resumes_cache_${profile.userId}`, JSON.stringify(remaining));
        } catch {}
      }

      if (tailoredResume?.id === resumeId) {
        if (remaining.length > 0) {
          const next = remaining[0];
          setTailoredResume(next);
          if (jobsMap[next.jobOpportunityId]) {
            setActiveJob(jobsMap[next.jobOpportunityId]);
          }
        } else {
          setTailoredResume(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete resume", err);
    }
  }

  // Duplicate / Clone Resume as a new version
  async function handleDuplicateResume() {
    if (!tailoredResume || !activeJob) return;
    setAnalyzing(true);
    try {
      const nextVersion = resumesList.length + 1;
      const duplicated: TailoredResume = {
        ...tailoredResume,
        id: crypto.randomUUID(),
        title: `${tailoredResume.title || activeJob.role} (v${nextVersion})`,
        versionNumber: nextVersion,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch(`/api/tailor/resumes/${duplicated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicated),
      });

      const saved = res.ok ? await res.json() : duplicated;
      setTailoredResume(saved);
      const updatedList = [saved, ...resumesList];
      setResumesList(updatedList);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`fitme_resumes_cache_${profile.userId}`, JSON.stringify(updatedList));
        } catch {}
      }
    } catch (err) {
      console.error("Failed to duplicate resume", err);
    } finally {
      setAnalyzing(false);
    }
  }

  // 1-Click Add Missing Keyword to Selected Skills
  async function handleAddMissingSkill(keyword: string) {
    if (!tailoredResume) return;
    const exists = tailoredResume.selectedSkills.some(
      (s) => s.name.toLowerCase() === keyword.toLowerCase()
    );
    if (exists) return;

    const newSkill = {
      id: crypto.randomUUID(),
      name: keyword,
      category: "tools" as const,
      isHidden: false,
    };

    const updatedSkills = [...tailoredResume.selectedSkills, newSkill];
    const updatedKeywords = tailoredResume.fitScore.keywords.map((kw) =>
      kw.keyword.toLowerCase() === keyword.toLowerCase() ? { ...kw, status: "matched" as const } : kw
    );
    const matchedCount = updatedKeywords.filter((k) => k.status === "matched").length;
    const missingCount = updatedKeywords.filter((k) => k.status === "missing").length;
    const newScore = Math.min(100, Math.round((matchedCount / updatedKeywords.length) * 100));

    const updatedResume: TailoredResume = {
      ...tailoredResume,
      selectedSkills: updatedSkills,
      fitScore: {
        ...tailoredResume.fitScore,
        score: newScore,
        matchedCount,
        missingCount,
        keywords: updatedKeywords,
      },
    };

    setTailoredResume(updatedResume);
    await saveResumeEdits({ selectedSkills: updatedSkills });
  }

  // Submit Job Description & Tailor
  async function handleAnalyzeAndTailor(e: React.FormEvent) {
    e.preventDefault();
    if (!jdText.trim() || jdText.trim().length < 10) return;
    setAnalyzing(true);

    try {
      // Step 1: Parse Job Description
      const parseRes = await fetch("/api/tailor/parse-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawDescription: jdText, sourceUrl }),
      });
      if (!parseRes.ok) throw new Error("Failed to parse Job Description");
      const job: JobOpportunity = await parseRes.json();
      setActiveJob(job);

      // Step 2: Generate Tailored Resume
      const tailorRes = await fetch("/api/tailor/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, pageBudget, preset }),
      });
      if (!tailorRes.ok) throw new Error("Failed to tailor resume");
      const resume: TailoredResume = await tailorRes.json();
      setTailoredResume(resume);
      setResumesList((prev) => [resume, ...prev.filter((r) => r.id !== resume.id)]);
      setJobsMap((prev) => ({ ...prev, [job.id]: job }));
    } catch (err) {
      console.error("Tailoring failed", err);
    } finally {
      setAnalyzing(false);
    }
  }

  // Update Status
  async function handleStatusChange(newStatus: ResumeStatus) {
    if (!tailoredResume) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/tailor/resumes/${tailoredResume.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated: TailoredResume = await res.json();
        setTailoredResume(updated);
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setStatusUpdating(false);
    }
  }

  // Boost Bullet via Google XYZ Formula
  async function handleBoostBullet(e: React.FormEvent) {
    e.preventDefault();
    if (!boostingBullet || !tailoredResume) return;
    setBoosting(true);

    try {
      const res = await fetch("/api/tailor/boost-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullet: boostingBullet.content,
          metricsContext: boostMetrics,
        }),
      });

      if (res.ok) {
        const { boostedBullet } = await res.json();
        const updatedExperiences = [...tailoredResume.tailoredExperiences];
        updatedExperiences[boostingBullet.roleIndex].bullets[boostingBullet.bulletIndex].content = boostedBullet;
        updatedExperiences[boostingBullet.roleIndex].bullets[boostingBullet.bulletIndex].hasMetrics = true;

        await saveResumeEdits({ tailoredExperiences: updatedExperiences });
        setBoostingBullet(null);
        setBoostMetrics("");
      }
    } catch (err) {
      console.error("Failed to boost bullet", err);
    } finally {
      setBoosting(false);
    }
  }

  // Switch Page Budget dynamically
  async function handleBudgetSwitch(newBudget: PageBudget) {
    if (!activeJob || !tailoredResume) return;
    setPageBudget(newBudget);
    setAnalyzing(true);
    try {
      const tailorRes = await fetch("/api/tailor/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: activeJob.id, pageBudget: newBudget, preset }),
      });
      if (tailorRes.ok) {
        const updated: TailoredResume = await tailorRes.json();
        setTailoredResume(updated);
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleExportMarkdown() {
    if (!tailoredResume) return;
    try {
      await fetch(`/api/tailor/resumes/${tailoredResume.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tailoredResume),
      });
    } catch {}
    window.open(`/api/export/${tailoredResume.id}/markdown`, "_blank");
  }

  async function handleExportPdf() {
    if (!tailoredResume) return;
    try {
      await fetch(`/api/tailor/resumes/${tailoredResume.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tailoredResume),
      });
    } catch {}
    window.open(`/api/export/${tailoredResume.id}/html?preset=${preset}&print=true`, "_blank");
  }

  async function handleGenerateCoverLetter() {
    if (!tailoredResume) return;
    setGeneratingBooster(true);
    try {
      const res = await fetch("/api/boosters/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: tailoredResume.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setCoverLetter(data.coverLetter);
      }
    } finally {
      setGeneratingBooster(false);
    }
  }

  async function handleGenerateOutreach() {
    if (!tailoredResume) return;
    setGeneratingBooster(true);
    try {
      const res = await fetch("/api/boosters/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: tailoredResume.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setOutreachNote(data.recruiterOutreach);
      }
    } finally {
      setGeneratingBooster(false);
    }
  }

  async function handleGenerateCheatSheet() {
    if (!tailoredResume) return;
    setGeneratingBooster(true);
    try {
      const res = await fetch("/api/boosters/cheat-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: tailoredResume.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setCheatSheet(data.cheatSheet);
      }
    } finally {
      setGeneratingBooster(false);
    }
  }

  function handleCopyText(key: string, text: string) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedBooster(key);
      setTimeout(() => setCopiedBooster(null), 1500);
    }
  }

  return (
    <div className="space-y-6">
      {/* VIEW 1: JOB INGESTION & SETUP (When no resume is active) */}
      {!tailoredResume && (
        <div className="max-w-3xl mx-auto p-6 md:p-8 rounded-2xl border bg-card shadow-sm space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              AI Fit Studio
            </div>
            <h2 className="text-xl md:text-2xl font-bold">Tailor Resume to a Job Description</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Paste the target job description or job posting URL. Fitme will extract keywords, calculate your ATS match score, and rewrite your bullets into Google XYZ format.
            </p>
          </div>

          <form onSubmit={handleAnalyzeAndTailor} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Job Posting URL (optional)</label>
              <input
                placeholder="https://jobs.lever.co/... or https://linkedin.com/jobs/..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Job Description Text *</label>
              <textarea
                required
                rows={8}
                placeholder="Paste the role responsibilities, requirements, and tech stack here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="w-full p-3.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Page Length Budget</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPageBudget("1_page")}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      pageBudget === "1_page" ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"
                    }`}
                  >
                    1 Page (Compact)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageBudget("2_pages")}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      pageBudget === "2_pages" ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"
                    }`}
                  >
                    2 Pages (Standard)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">ATS Typography Preset</label>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value as TypographyPreset)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border bg-background"
                >
                  <option value="cabas_executive">Cabas Executive (Exact PDF Template)</option>
                  <option value="modern_standard">Modern Standard (Inter / Sans)</option>
                  <option value="classic_ivy">Classic Ivy (Garamond / Serif)</option>
                  <option value="tech_minimalist">Tech Minimalist (Monospace accents)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={analyzing || !jdText.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating ATS Fit & Tailoring Bullets...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Fit & Generate Tailored Resume</span>
                </>
              )}
            </button>
          </form>

          {/* Saved Tailored Resumes List */}
          {resumesList.length > 0 && (
            <div className="pt-6 border-t space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold">Saved Tailored Resumes ({resumesList.length})</h3>
                </div>
                <span className="text-xs text-muted-foreground">Click to reopen and edit</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resumesList.map((res) => {
                  const job = jobsMap[res.jobOpportunityId];
                  const resumeDisplayName = res.title || `${job?.role || "Tailored Resume"} - v${res.versionNumber}`;
                  return (
                    <div
                      key={res.id}
                      onClick={() => {
                        if (job) setActiveJob(job);
                        setTailoredResume(res);
                      }}
                      className="group p-3.5 rounded-xl border bg-background hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all duration-150 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {resumeDisplayName}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                            {res.fitScore?.score || 0}% ATS
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteResume(res.id);
                            }}
                            className="p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors"
                            title="Delete this tailored resume"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="truncate font-medium text-foreground/80 flex items-center gap-1">
                          <Building className="w-3 h-3 text-muted-foreground" />
                          {job?.company || "Target Company"}
                        </span>
                        <span>v{res.versionNumber} • {res.pageBudget === "1_page" ? "1-pg" : "2-pg"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: INTERACTIVE TAILORING STUDIO (Split-view Desktop & Tabbed Mobile) */}
      {tailoredResume && activeJob && (
        <div className="space-y-4">
          {/* Top Bar: Company, Role, Status, Presets, and Exports */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTailoredResume(null)}
                className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Back to input"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                {editingTitle ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      placeholder="e.g. Hardware Support Specialist"
                      className="px-2.5 py-1 text-sm font-bold rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-[220px]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          saveResumeEdits({ title: tempTitle });
                          setEditingTitle(false);
                        } else if (e.key === "Escape") {
                          setEditingTitle(false);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        saveResumeEdits({ title: tempTitle });
                        setEditingTitle(false);
                      }}
                      className="p-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                      title="Save resume title"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTitle(false)}
                      className="p-1 rounded-md border hover:bg-muted text-muted-foreground"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                      {tailoredResume.title || `${activeJob.role} - v${tailoredResume.versionNumber}`}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setTempTitle(tailoredResume.title || `${activeJob.role} - v${tailoredResume.versionNumber}`);
                        setEditingTitle(true);
                      }}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Rename resume"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {resumesList.length > 1 && (
                      <select
                        value={tailoredResume.id}
                        onChange={(e) => {
                          const selected = resumesList.find((r) => r.id === e.target.value);
                          if (selected) {
                            setTailoredResume(selected);
                            if (jobsMap[selected.jobOpportunityId]) {
                              setActiveJob(jobsMap[selected.jobOpportunityId]);
                            }
                          }
                        }}
                        className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-lg border bg-muted/60 text-foreground cursor-pointer"
                        title="Switch between saved tailored resumes"
                      >
                        {resumesList.map((r) => {
                          const j = jobsMap[r.jobOpportunityId];
                          return (
                            <option key={r.id} value={r.id}>
                              {r.title || (j ? `${j.role} (${j.company}) - v${r.versionNumber}` : `v${r.versionNumber}`)}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                )}

                {/* Company Name Underneath Resume Name */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-primary" />
                    {activeJob.company || "Target Company"}
                  </span>
                  <span>•</span>
                  <span>{activeJob.role}</span>
                  {activeJob.location && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {activeJob.location}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>Version {tailoredResume.versionNumber}</span>
                </div>
              </div>
            </div>

            {/* Export Toolbar, Status Selector & Page Budget Switch */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Preset Selector */}
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value as TypographyPreset)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border bg-background"
                title="ATS Typography Preset"
              >
                <option value="cabas_executive">Cabas Executive</option>
                <option value="modern_standard">Modern Standard</option>
                <option value="classic_ivy">Classic Ivy</option>
                <option value="tech_minimalist">Tech Minimalist</option>
              </select>

              <div className="flex items-center gap-1 p-0.5 rounded-lg border bg-muted text-xs font-semibold">
                <button
                  onClick={() => handleBudgetSwitch("1_page")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    pageBudget === "1_page" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  1 Page
                </button>
                <button
                  onClick={() => handleBudgetSwitch("2_pages")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    pageBudget === "2_pages" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  2 Pages
                </button>
              </div>

              {/* Status Dropdown */}
              <select
                value={tailoredResume.status}
                disabled={statusUpdating}
                onChange={(e) => handleStatusChange(e.target.value as ResumeStatus)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  tailoredResume.status === "interview"
                    ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
                    : tailoredResume.status === "sent"
                    ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                    : tailoredResume.status === "job_offer"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    : "bg-background text-foreground"
                }`}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="interview">Interview</option>
                <option value="job_offer">Offer</option>
                <option value="rejected">Archived</option>
              </select>

              {/* Duplicate Button */}
              <button
                type="button"
                onClick={handleDuplicateResume}
                title="Duplicate this resume as a new version"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border bg-background hover:bg-muted transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Duplicate</span>
              </button>

              {/* Export Buttons */}
              <button
                type="button"
                onClick={handleExportMarkdown}
                title="Download as ATS-clean Markdown"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border bg-background hover:bg-muted transition-colors"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Markdown</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                title="Print or Save to ATS PDF"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF / Print</span>
              </button>

              {/* Delete Resume Button */}
              <button
                type="button"
                onClick={() => handleDeleteResume(tailoredResume.id)}
                title="Delete this tailored resume"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>

              {/* AI Boosters Trigger Button */}
              <button
                type="button"
                onClick={() => setShowBoosters(true)}
                title="Open AI Application Boosters"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Boosters</span>
              </button>

              {savedEditsSuccess && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
            </div>
          </div>

          {/* ATS Fit Score & Keyword Heatmap Card */}
          <div className="p-5 rounded-2xl border bg-card shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary font-black text-xl shadow-inner">
                  {tailoredResume.fitScore.score}%
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-base">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span>ATS Match Score</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tailoredResume.fitScore.summaryEvaluation}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="text-emerald-600">● {tailoredResume.fitScore.matchedCount} Direct Matches</span>
                <span className="text-amber-600">● {tailoredResume.fitScore.keywords.filter((k) => k.status === "transferable").length} Transferable</span>
                <span className="text-red-500">● {tailoredResume.fitScore.missingCount} Missing</span>
              </div>
            </div>

            {/* Keyword Match Checklist Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tailoredResume.fitScore.keywords.map((kw) => (
                <span
                  key={kw.keyword}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                    kw.status === "matched"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      : kw.status === "transferable"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                      : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                  }`}
                >
                  {kw.status === "matched" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  {kw.status === "transferable" && <Sparkles className="w-3 h-3 text-amber-600" />}
                  {kw.status === "missing" && <AlertCircle className="w-3 h-3 text-red-500" />}
                  <span>{kw.keyword}</span>
                  {kw.status === "missing" && (
                    <button
                      type="button"
                      onClick={() => handleAddMissingSkill(kw.keyword)}
                      className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      title={`Add "${kw.keyword}" to resume skills`}
                    >
                      + Add
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* MOBILE TAB CONTROLS (Only visible on screens < 768px) */}
          <div className="md:hidden flex items-center p-1 rounded-xl bg-card border">
            <button
              onClick={() => setMobileTab("resume")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                mobileTab === "resume" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Tailored Resume
            </button>
            <button
              onClick={() => setMobileTab("job")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                mobileTab === "job" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Job Posting
            </button>
            <button
              onClick={() => setMobileTab("ats")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                mobileTab === "ats" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              ATS Match Analysis
            </button>
          </div>

          {/* MAIN DUAL SPLIT-VIEW (Desktop side-by-side, Mobile conditional) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Target Job Posting (Desktop: 5 cols, Mobile: tab 'job') */}
            <div className={`md:col-span-5 space-y-4 ${mobileTab !== "job" ? "hidden md:block" : ""}`}>
              <div className="p-5 rounded-2xl border bg-card shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold border-b pb-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Target Job Requirements</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Must-Have Qualifications
                    </h4>
                    <ul className="space-y-1.5 text-xs text-foreground list-disc list-inside">
                      {activeJob.mustHaves.length > 0 ? (
                        activeJob.mustHaves.map((mh, idx) => <li key={idx}>{mh}</li>)
                      ) : (
                        <li className="text-muted-foreground">General engineering requirements</li>
                      )}
                    </ul>
                  </div>

                  {activeJob.niceToHaves.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Nice-to-Have Skills
                      </h4>
                      <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                        {activeJob.niceToHaves.map((nh, idx) => <li key={idx}>{nh}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Raw Job Description
                    </h4>
                    <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground font-mono max-h-56 overflow-y-auto whitespace-pre-wrap">
                      {activeJob.rawDescription}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Tailored Resume Preview (Desktop: 7 cols, Mobile: tab 'resume') */}
            <div className={`md:col-span-7 space-y-4 ${mobileTab !== "resume" ? "hidden md:block" : ""}`}>
              <div className={`p-6 md:p-8 rounded-2xl border bg-card shadow-sm space-y-6 ${
                preset === "classic_ivy" ? "font-serif" : ""
              }`}>
                {/* Resume Header */}
                <div className="text-center space-y-1 border-b pb-4">
                  <h1 className="text-2xl font-bold tracking-tight">{profile.contact.fullName}</h1>
                  {profile.contact.headline && (
                    <p className="text-xs font-medium text-primary">{profile.contact.headline}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {profile.contact.email} • {profile.contact.phone || "+1 (555) 000-0000"} • {profile.contact.location || "Remote"}
                  </p>
                </div>

                {/* Tailored Executive Summary */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                      Tailored Professional Summary
                    </h3>
                    {!editingSummary ? (
                      <button
                        onClick={() => {
                          setTempSummary(tailoredResume.tailoredSummary);
                          setEditingSummary(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                        title="Edit tailored summary"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit Summary</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingSummary(false)}
                          className="px-2 py-0.5 text-[11px] rounded border hover:bg-muted"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            await saveResumeEdits({ tailoredSummary: tempSummary.trim() });
                            setEditingSummary(false);
                          }}
                          disabled={savingEdits || !tempSummary.trim()}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" />
                          <span>{savingEdits ? "Saving..." : "Save"}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {editingSummary ? (
                    <textarea
                      rows={3}
                      value={tempSummary}
                      onChange={(e) => setTempSummary(e.target.value)}
                      className="w-full p-3 text-xs sm:text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  ) : (
                    <p className="text-xs sm:text-sm text-foreground leading-relaxed p-3 rounded-xl bg-primary/5 border border-primary/10">
                      {tailoredResume.tailoredSummary}
                    </p>
                  )}
                </div>

                {/* Tailored Work Experiences */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Work Experience ({tailoredResume.tailoredExperiences.length} Roles Curated)
                  </h3>

                  <div className="space-y-4">
                    {tailoredResume.tailoredExperiences.map((exp, roleIdx) => (
                      <div key={exp.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground">{exp.role} — <span className="font-semibold text-muted-foreground">{exp.company}</span></span>
                          <span className="text-muted-foreground">{exp.startDate || "N/A"} – {exp.endDate || "Present"}</span>
                        </div>

                        <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground pl-2">
                          {exp.bullets.map((b, bulletIdx) => {
                            const bulletKey = `${roleIdx}-${bulletIdx}`;
                            const isEditing = editingBulletKey === bulletKey;

                            return (
                              <li key={b.id} className="space-y-1">
                                {isEditing ? (
                                  <div className="flex items-center gap-2 p-1.5 rounded-lg border bg-background">
                                    <input
                                      autoFocus
                                      value={editBulletText}
                                      onChange={(e) => setEditBulletText(e.target.value)}
                                      onKeyDown={async (e) => {
                                        if (e.key === "Enter" && editBulletText.trim()) {
                                          e.preventDefault();
                                          const updated = [...tailoredResume.tailoredExperiences];
                                          updated[roleIdx].bullets[bulletIdx].content = editBulletText.trim();
                                          await saveResumeEdits({ tailoredExperiences: updated });
                                          setEditingBulletKey(null);
                                        }
                                      }}
                                      className="flex-1 px-2 py-1 text-xs sm:text-sm rounded border bg-background"
                                    />
                                    <button
                                      onClick={async () => {
                                        if (!editBulletText.trim()) return;
                                        const updated = [...tailoredResume.tailoredExperiences];
                                        updated[roleIdx].bullets[bulletIdx].content = editBulletText.trim();
                                        await saveResumeEdits({ tailoredExperiences: updated });
                                        setEditingBulletKey(null);
                                      }}
                                      disabled={savingEdits || !editBulletText.trim()}
                                      className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
                                      title="Save bullet"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingBulletKey(null)}
                                      className="p-1 rounded border hover:bg-muted"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="group flex items-start justify-between gap-2">
                                    <span className="flex-1 text-foreground leading-relaxed">• {b.content}</span>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => {
                                          setEditingBulletKey(bulletKey);
                                          setEditBulletText(b.content);
                                        }}
                                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                        title="Edit this bullet point directly"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => setBoostingBullet({ roleIndex: roleIdx, bulletIndex: bulletIdx, content: b.content })}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20"
                                        title="Boost this bullet using Google XYZ formula"
                                      >
                                        <Wand2 className="w-3 h-3" />
                                        <span>XYZ</span>
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const updated = [...tailoredResume.tailoredExperiences];
                                          updated[roleIdx].bullets.splice(bulletIdx, 1);
                                          await saveResumeEdits({ tailoredExperiences: updated });
                                        }}
                                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        title="Remove bullet from this tailored resume"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>

                        {/* Inline Add Bullet for this Role */}
                        {addingBulletForRole === roleIdx ? (
                          <div className="flex items-center gap-2 pl-2 pt-1">
                            <input
                              autoFocus
                              placeholder="Write custom bullet point for this job application..."
                              value={newRoleBulletText}
                              onChange={(e) => setNewRoleBulletText(e.target.value)}
                              onKeyDown={async (e) => {
                                if (e.key === "Enter" && newRoleBulletText.trim()) {
                                  e.preventDefault();
                                  const updated = [...tailoredResume.tailoredExperiences];
                                  updated[roleIdx].bullets.push({
                                    id: crypto.randomUUID(),
                                    content: newRoleBulletText.trim(),
                                    isHidden: false,
                                    hasMetrics: false,
                                  });
                                  await saveResumeEdits({ tailoredExperiences: updated });
                                  setNewRoleBulletText("");
                                  setAddingBulletForRole(null);
                                }
                              }}
                              className="flex-1 px-2.5 py-1 text-xs rounded-lg border bg-background"
                            />
                            <button
                              onClick={async () => {
                                if (!newRoleBulletText.trim()) return;
                                const updated = [...tailoredResume.tailoredExperiences];
                                updated[roleIdx].bullets.push({
                                  id: crypto.randomUUID(),
                                  content: newRoleBulletText.trim(),
                                  isHidden: false,
                                  hasMetrics: false,
                                });
                                await saveResumeEdits({ tailoredExperiences: updated });
                                setNewRoleBulletText("");
                                setAddingBulletForRole(null);
                              }}
                              disabled={savingEdits || !newRoleBulletText.trim()}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => {
                                setAddingBulletForRole(null);
                                setNewRoleBulletText("");
                              }}
                              className="p-1 rounded-lg border hover:bg-muted text-muted-foreground"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="pl-2 pt-1">
                            <button
                              onClick={() => {
                                setAddingBulletForRole(roleIdx);
                                setNewRoleBulletText("");
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Bullet Point</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tailored Projects */}
                {tailoredResume.tailoredProjects.length > 0 && (
                  <div className="space-y-3 pt-2 border-t">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                      Technical Projects
                    </h3>
                    <div className="space-y-3">
                      {tailoredResume.tailoredProjects.map((p) => (
                        <div key={p.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold">{p.name}</span>
                            <span className="text-muted-foreground font-mono text-[10px]">{p.technologies.join(", ")}</span>
                          </div>
                          {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tailored Certifications */}
                {tailoredResume.tailoredCertifications && tailoredResume.tailoredCertifications.length > 0 && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center gap-1.5 text-primary">
                      <Award className="w-3.5 h-3.5" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        Certifications & Trainings
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {tailoredResume.tailoredCertifications.map((c) => (
                        <div key={c.id} className="text-xs space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{c.name}</span>
                            {c.hours && <span className="text-[10px] text-muted-foreground font-mono">{c.hours}</span>}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {c.issuer} {c.issueDate ? `• ${c.issueDate}` : ""} {c.credentialId ? `• ID: ${c.credentialId}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Core Competencies */}
                <div className="space-y-2 pt-2 border-t">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Core Competencies
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {tailoredResume.selectedSkills.map((s) => (
                      <span key={s.id} className="px-2 py-0.5 rounded-full text-xs bg-muted text-foreground font-medium">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE ONLY: ATS Details tab view */}
            {mobileTab === "ats" && (
              <div className="md:hidden space-y-4">
                <div className="p-5 rounded-2xl border bg-card shadow-sm space-y-3">
                  <h3 className="font-bold text-sm">Keyword Breakdown & Suggestions</h3>
                  <div className="space-y-2">
                    {tailoredResume.fitScore.keywords.map((kw) => (
                      <div key={kw.keyword} className="p-2.5 rounded-lg border bg-background text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span>{kw.keyword}</span>
                          <span className={kw.status === "matched" ? "text-emerald-600" : kw.status === "transferable" ? "text-amber-600" : "text-red-500"}>
                            {kw.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-[11px]">{kw.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INLINE GOOGLE XYZ BULLET BOOSTER MODAL */}
          {boostingBullet && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-lg p-6 rounded-2xl border bg-card shadow-xl space-y-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    Google XYZ Formula Booster
                  </div>
                  <h3 className="text-lg font-bold">Upgrade Bullet Point</h3>
                  <p className="text-xs text-muted-foreground">
                    &quot;Accomplished [X] as measured by [Y] by doing [Z]&quot;
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 border text-xs text-foreground italic">
                  &quot;{boostingBullet.content}&quot;
                </div>

                <form onSubmit={handleBoostBullet} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Add rough metrics, percentages, or scale results:</label>
                    <input
                      required
                      placeholder="e.g. reduced p99 latency by 35%, 100k daily users, saved team 10 hrs/week"
                      value={boostMetrics}
                      onChange={(e) => setBoostMetrics(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setBoostingBullet(null)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={boosting || !boostMetrics.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {boosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                      <span>{boosting ? "Rewriting with AI..." : "Boost Bullet"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ON-DEMAND AI BOOSTERS MODAL */}
          {showBoosters && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-2xl max-h-[85vh] p-6 rounded-2xl border bg-card shadow-2xl flex flex-col space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="space-y-0.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Application Boosters
                    </div>
                    <h3 className="text-lg font-bold">On-Demand Tailored Assets</h3>
                  </div>
                  <button
                    onClick={() => setShowBoosters(false)}
                    className="p-1 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Booster Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted text-xs font-semibold">
                  <button
                    onClick={() => setBoosterTab("cover_letter")}
                    className={`flex-1 py-1.5 rounded-lg transition-colors ${
                      boosterTab === "cover_letter" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Cover Letter
                  </button>
                  <button
                    onClick={() => setBoosterTab("outreach")}
                    className={`flex-1 py-1.5 rounded-lg transition-colors ${
                      boosterTab === "outreach" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Recruiter Outreach
                  </button>
                  <button
                    onClick={() => setBoosterTab("cheat_sheet")}
                    className={`flex-1 py-1.5 rounded-lg transition-colors ${
                      boosterTab === "cheat_sheet" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Interview Cheat Sheet
                  </button>
                </div>

                {/* Booster Content Area */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {/* COVER LETTER */}
                  {boosterTab === "cover_letter" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Generates a 3-paragraph tailored cover letter strictly referencing your verified Vault experiences.
                        </p>
                        <button
                          onClick={handleGenerateCoverLetter}
                          disabled={generatingBooster}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shrink-0"
                        >
                          {generatingBooster ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          <span>{coverLetter ? "Regenerate" : "Generate Letter"}</span>
                        </button>
                      </div>

                      {coverLetter && (
                        <div className="relative p-4 rounded-xl border bg-muted/30 text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed space-y-2">
                          <button
                            onClick={() => handleCopyText("coverLetter", coverLetter)}
                            className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-background border text-xs font-semibold shadow-sm hover:bg-muted"
                          >
                            {copiedBooster === "coverLetter" ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                          <div>{coverLetter}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* RECRUITER OUTREACH */}
                  {boosterTab === "outreach" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Generates a concise (&lt;100 words) connection note highlighting your top matching skills.
                        </p>
                        <button
                          onClick={handleGenerateOutreach}
                          disabled={generatingBooster}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shrink-0"
                        >
                          {generatingBooster ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          <span>{outreachNote ? "Regenerate" : "Generate Note"}</span>
                        </button>
                      </div>

                      {outreachNote && (
                        <div className="relative p-4 rounded-xl border bg-muted/30 text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          <button
                            onClick={() => handleCopyText("outreach", outreachNote)}
                            className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-background border text-xs font-semibold shadow-sm hover:bg-muted"
                          >
                            {copiedBooster === "outreach" ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                          <p className="pr-16">{outreachNote}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* INTERVIEW CHEAT SHEET */}
                  {boosterTab === "cheat_sheet" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Predicts technical questions and supplies STAR-method talking points for any missing ATS skills.
                        </p>
                        <button
                          onClick={handleGenerateCheatSheet}
                          disabled={generatingBooster}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shrink-0"
                        >
                          {generatingBooster ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          <span>{cheatSheet ? "Regenerate" : "Generate Cheat Sheet"}</span>
                        </button>
                      </div>

                      {cheatSheet && (
                        <div className="space-y-4">
                          {/* Predicted Questions */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                              Predicted Technical & Behavioral Questions
                            </h4>
                            <div className="space-y-2">
                              {cheatSheet.predictedQuestions.map((pq, idx) => (
                                <div key={idx} className="p-3 rounded-xl border bg-card text-xs space-y-1">
                                  <div className="font-bold text-foreground">Q: {pq.question}</div>
                                  <div className="text-muted-foreground text-[11px] italic">{pq.context}</div>
                                  <div className="text-foreground pt-1 border-t text-[11px]"><span className="font-semibold text-primary">Suggested Approach:</span> {pq.suggestedApproach}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Gap Talking Points */}
                          <div className="space-y-2 pt-2 border-t">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600">
                              Talking Points for Missing / Transferable Skills
                            </h4>
                            <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                              {cheatSheet.talkingPointsForGaps.map((tp, idx) => (
                                <li key={idx} className="text-foreground">{tp}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Questions to ask */}
                          <div className="space-y-2 pt-2 border-t">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                              High-Signal Questions to Ask the Interviewer
                            </h4>
                            <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                              {cheatSheet.questionsToAskInterviewer.map((q, idx) => (
                                <li key={idx} className="text-foreground">{q}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
