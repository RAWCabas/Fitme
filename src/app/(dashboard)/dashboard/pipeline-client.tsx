"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Clock, 
  Send, 
  CheckCircle2, 
  Trophy, 
  AlertTriangle, 
  FileText, 
  ArrowRight, 
  Printer, 
  FileCode,
  Building,
  Plus,
  TrendingUp,
  FolderArchive
} from "lucide-react";
import { TailoredResume, JobOpportunity, ResumeStatus } from "@/features/tailor/schema";
import { formatRelativeTime } from "@/lib/dates";

interface PipelineClientProps {
  initialResumes: TailoredResume[];
  jobs: Record<string, JobOpportunity>;
  userName: string;
}

export function PipelineClient({ initialResumes, jobs, userName }: PipelineClientProps) {
  const [resumes, setResumes] = useState<TailoredResume[]>(initialResumes);
  const [filter, setFilter] = useState<"all" | ResumeStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Compute status counts
  const counts = {
    draft: resumes.filter((r) => r.status === "draft").length,
    sent: resumes.filter((r) => r.status === "sent").length,
    interview: resumes.filter((r) => r.status === "interview").length,
    job_offer: resumes.filter((r) => r.status === "job_offer").length,
    rejected: resumes.filter((r) => r.status === "rejected").length,
  };

  // 7-day aging alerts: applications in "sent" status for >= 7 days
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const agingApplications = resumes.filter((r) => {
    if (r.status !== "sent") return false;
    const updatedTime = new Date(r.updatedAt).getTime();
    return now - updatedTime >= SEVEN_DAYS_MS;
  });

  // Filtered list
  const filteredResumes = resumes.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  async function handleStatusChange(resumeId: string, newStatus: ResumeStatus) {
    setUpdatingId(resumeId);
    try {
      const res = await fetch(`/api/tailor/resumes/${resumeId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated: TailoredResume = await res.json();
        setResumes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdatingId(null);
    }
  }

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
            Hello, {userName}
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

      {/* 7-DAY AGING FOLLOW-UP ALERT BANNER */}
      {agingApplications.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Follow-Up Reminders ({agingApplications.length})</span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            You have {agingApplications.length} application{agingApplications.length > 1 ? "s" : ""} waiting in &quot;Sent&quot; status for 7 or more days. Consider sending a polite recruiter follow-up note to stay top of mind.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {agingApplications.map((app) => {
              const job = jobs[app.jobOpportunityId];
              return (
                <div
                  key={app.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-background border text-xs font-medium text-foreground shadow-sm"
                >
                  <Building className="w-3 h-3 text-muted-foreground" />
                  <span className="font-semibold">{job?.company || "Target Company"}</span>
                  <span className="text-muted-foreground">({job?.role || "Role"})</span>
                  <span className="text-[10px] text-amber-600 font-bold ml-1">
                    {formatRelativeTime(app.updatedAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lifecycle Status Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => setFilter("draft")}
          className={`p-4 rounded-xl border bg-card shadow-sm space-y-2 cursor-pointer transition-colors ${
            filter === "draft" ? "ring-2 ring-primary" : "hover:border-primary/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Drafts</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">{counts.draft}</div>
          <p className="text-[11px] text-muted-foreground">In progress in Studio</p>
        </div>

        <div 
          onClick={() => setFilter("sent")}
          className={`p-4 rounded-xl border bg-card shadow-sm space-y-2 cursor-pointer transition-colors ${
            filter === "sent" ? "ring-2 ring-primary" : "hover:border-primary/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Sent</span>
            <Send className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{counts.sent}</div>
          <p className="text-[11px] text-muted-foreground">Applied & submitted</p>
        </div>

        <div 
          onClick={() => setFilter("interview")}
          className={`p-4 rounded-xl border bg-card shadow-sm space-y-2 cursor-pointer transition-colors ${
            filter === "interview" ? "ring-2 ring-primary" : "hover:border-primary/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Interviews</span>
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold">{counts.interview}</div>
          <p className="text-[11px] text-muted-foreground">Active interview pipeline</p>
        </div>

        <div 
          onClick={() => setFilter("job_offer")}
          className={`p-4 rounded-xl border bg-card shadow-sm space-y-2 cursor-pointer transition-colors ${
            filter === "job_offer" ? "ring-2 ring-primary" : "hover:border-primary/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Job Offers</span>
            <Trophy className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold">{counts.job_offer}</div>
          <p className="text-[11px] text-muted-foreground">Offers received</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            filter === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Applications ({resumes.length})
        </button>
        <button
          onClick={() => setFilter("draft")}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            filter === "draft" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Drafts ({counts.draft})
        </button>
        <button
          onClick={() => setFilter("sent")}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            filter === "sent" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sent ({counts.sent})
        </button>
        <button
          onClick={() => setFilter("interview")}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            filter === "interview" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Interviews ({counts.interview})
        </button>
        <button
          onClick={() => setFilter("job_offer")}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            filter === "job_offer" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Offers ({counts.job_offer})
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            filter === "rejected" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Archived ({counts.rejected})
        </button>
      </div>

      {/* Applications Card Grid */}
      {filteredResumes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border bg-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base">No resumes found in this stage</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Ready to apply for a role? Use the Fit Studio to generate an ATS-tailored resume and track it across your pipeline.
            </p>
          </div>
          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tailor Resume</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResumes.map((resume) => {
            const job = jobs[resume.jobOpportunityId];
            const isUpdating = updatingId === resume.id;

            return (
              <div
                key={resume.id}
                className="p-5 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Row: Fit Score & Status Dropdown */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{resume.fitScore.score}% ATS Fit</span>
                    </div>

                    <select
                      value={resume.status}
                      disabled={isUpdating}
                      onChange={(e) => handleStatusChange(resume.id, e.target.value as ResumeStatus)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                        resume.status === "interview"
                          ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
                          : resume.status === "sent"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                          : resume.status === "job_offer"
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
                  </div>

                  {/* Company & Role */}
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-base text-foreground leading-tight">
                      {job?.role || "Tailored Position"}
                    </h3>
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      <span>{job?.company || "Target Tech Inc."}</span>
                    </p>
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {resume.tailoredSummary}
                  </p>
                </div>

                {/* Card Footer: Version, Date, and Actions */}
                <div className="pt-3 border-t space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Version {resume.versionNumber}</span>
                    <span>Updated {formatRelativeTime(resume.updatedAt)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href="/studio"
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
                    >
                      <span>Studio</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>

                    <button
                      onClick={() => window.open(`/api/export/${resume.id}/markdown`, "_blank")}
                      title="Download Markdown"
                      className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => window.open(`/api/export/${resume.id}/html?print=true`, "_blank")}
                      title="Print / Save PDF"
                      className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Navigation Quick Links to Vault */}
      <div className="p-6 rounded-2xl border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Master Experience Vault</h4>
            <p className="text-xs text-muted-foreground">
              Add new roles, certifications, and skills to feed your ATS tailoring engine.
            </p>
          </div>
        </div>
        <Link
          href="/vault"
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border text-xs font-semibold hover:bg-muted transition-colors self-start sm:self-auto"
        >
          <span>Open Vault</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
