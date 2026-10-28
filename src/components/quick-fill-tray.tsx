"use client";

import React, { useState, useEffect } from "react";
import { 
  ClipboardCopy, 
  X, 
  Check, 
  Copy, 
  User, 
  Briefcase, 
  Sparkles, 
  FileText 
} from "lucide-react";
import { Profile } from "@/features/profile/schema";

interface QuickFillTrayProps {
  profile: Profile;
}

type TrayTab = "contact" | "bullets" | "skills" | "summary";

export function QuickFillTray({ profile }: QuickFillTrayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TrayTab>("contact");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  async function handleCopy(key: string, text: string) {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((curr) => (curr === key ? null : curr));
      }, 1500);
    } catch (err) {
      console.error("Failed to copy to clipboard", err);
    }
  }

  const visibleExperiences = profile.experiences.filter((exp) => !exp.isHidden);
  const visibleSkills = profile.skills.filter((s) => !s.isHidden);
  const allSkillsText = visibleSkills.map((s) => s.name).join(", ");

  return (
    <>
      {/* Persistent Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          aria-label="Open Quick-Fill Application Clipboard Tray"
        >
          <ClipboardCopy className="w-4 h-4" />
          <span>Quick-Fill</span>
        </button>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200"
        />
      )}

      {/* Drawer: Right Slide-out on Desktop (>=1024px), Bottom Sheet on Mobile (<768px) */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed z-50 bg-card border shadow-2xl flex flex-col 
            /* Mobile bottom sheet */
            inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t animate-in slide-in-from-bottom duration-300
            /* Desktop right side drawer */
            md:inset-y-0 md:right-0 md:left-auto md:w-[420px] md:max-h-full md:rounded-none md:border-l md:slide-in-from-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <ClipboardCopy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Quick-Fill Tray</h3>
                <p className="text-[11px] text-muted-foreground">1-Click copy to application portals</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Close Quick-Fill Tray"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-2 border-b bg-muted/40 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab("contact")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === "contact" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Contact</span>
            </button>
            <button
              onClick={() => setActiveTab("bullets")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === "bullets" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Bullets</span>
            </button>
            <button
              onClick={() => setActiveTab("skills")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === "skills" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Skills</span>
            </button>
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === "summary" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Summary</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB 1: CONTACT & LINKS */}
            {activeTab === "contact" && (
              <div className="space-y-3">
                <CopyItem
                  label="Full Name"
                  value={profile.contact.fullName}
                  copied={copiedKey === "fullName"}
                  onCopy={() => handleCopy("fullName", profile.contact.fullName)}
                />
                <CopyItem
                  label="Email"
                  value={profile.contact.email}
                  copied={copiedKey === "email"}
                  onCopy={() => handleCopy("email", profile.contact.email)}
                />
                {profile.contact.phone && (
                  <CopyItem
                    label="Phone"
                    value={profile.contact.phone}
                    copied={copiedKey === "phone"}
                    onCopy={() => handleCopy("phone", profile.contact.phone)}
                  />
                )}
                {profile.contact.location && (
                  <CopyItem
                    label="Location"
                    value={profile.contact.location}
                    copied={copiedKey === "location"}
                    onCopy={() => handleCopy("location", profile.contact.location)}
                  />
                )}
                {profile.contact.linkedinUrl && (
                  <CopyItem
                    label="LinkedIn URL"
                    value={profile.contact.linkedinUrl}
                    copied={copiedKey === "linkedinUrl"}
                    onCopy={() => handleCopy("linkedinUrl", profile.contact.linkedinUrl)}
                  />
                )}
                {profile.contact.githubUrl && (
                  <CopyItem
                    label="GitHub URL"
                    value={profile.contact.githubUrl}
                    copied={copiedKey === "githubUrl"}
                    onCopy={() => handleCopy("githubUrl", profile.contact.githubUrl)}
                  />
                )}
                {profile.contact.portfolioUrl && (
                  <CopyItem
                    label="Portfolio URL"
                    value={profile.contact.portfolioUrl}
                    copied={copiedKey === "portfolioUrl"}
                    onCopy={() => handleCopy("portfolioUrl", profile.contact.portfolioUrl)}
                  />
                )}
              </div>
            )}

            {/* TAB 2: EXPERIENCE BULLETS */}
            {activeTab === "bullets" && (
              <div className="space-y-4">
                {visibleExperiences.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No active work experiences found in your Master Vault.
                  </p>
                ) : (
                  visibleExperiences.map((exp) => (
                    <div key={exp.id} className="space-y-2">
                      <div className="text-xs font-bold text-foreground">
                        {exp.role} — <span className="font-semibold text-muted-foreground">{exp.company}</span>
                      </div>
                      <div className="space-y-1.5">
                        {exp.bullets
                          .filter((b) => !b.isHidden)
                          .map((bullet) => (
                            <div
                              key={bullet.id}
                              onClick={() => handleCopy(bullet.id, bullet.content)}
                              className="group relative p-2.5 rounded-lg border bg-background hover:border-primary/50 cursor-pointer transition-all duration-150 text-xs"
                            >
                              <p className="text-foreground leading-relaxed pr-6">{bullet.content}</p>
                              <div className="absolute top-2.5 right-2.5 text-muted-foreground group-hover:text-primary transition-colors">
                                {copiedKey === bullet.id ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                                    <Check className="w-3 h-3" />
                                    Copied
                                  </span>
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: SKILLS */}
            {activeTab === "skills" && (
              <div className="space-y-4">
                {visibleSkills.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold">All Skills ({visibleSkills.length})</span>
                      <button
                        onClick={() => handleCopy("allSkills", allSkillsText)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                      >
                        {copiedKey === "allSkills" ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied All</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Comma-Separated</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 rounded-lg border bg-background text-xs font-mono text-muted-foreground leading-relaxed">
                      {allSkillsText}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Individual Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {visibleSkills.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleCopy(s.id, s.name)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                          copiedKey === s.id
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                            : "bg-background hover:bg-muted text-foreground"
                        }`}
                      >
                        {copiedKey === s.id && <Check className="w-3 h-3 text-emerald-600" />}
                        <span>{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SUMMARY & HEADLINE */}
            {activeTab === "summary" && (
              <div className="space-y-3">
                {profile.contact.headline && (
                  <CopyItem
                    label="Professional Headline"
                    value={profile.contact.headline}
                    copied={copiedKey === "headline"}
                    onCopy={() => handleCopy("headline", profile.contact.headline)}
                  />
                )}

                <CopyItem
                  label="Executive Summary"
                  value={profile.summary || "No summary saved in Master Vault."}
                  copied={copiedKey === "summary"}
                  onCopy={() => handleCopy("summary", profile.summary)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CopyItem({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div
      onClick={onCopy}
      className="group flex items-center justify-between p-2.5 rounded-lg border bg-background hover:border-primary/50 cursor-pointer transition-all duration-150"
    >
      <div className="space-y-0.5 overflow-hidden pr-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <p className="text-xs font-medium text-foreground truncate">{value}</p>
      </div>

      <div className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
        {copied ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <Check className="w-3 h-3" />
            Copied
          </span>
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </div>
    </div>
  );
}
