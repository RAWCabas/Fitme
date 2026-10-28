"use client";

import { useState } from "react";
import { 
  Briefcase, 
  Code2, 
  Wrench, 
  User, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Loader2, 
  Check, 
  Globe, 
  MapPin, 
  Calendar 
} from "lucide-react";
import { Profile, WorkExperience, Project, SkillItem, SkillCategory } from "@/features/profile/schema";

interface VaultClientProps {
  initialProfile: Profile;
}

export function VaultClient({ initialProfile }: VaultClientProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [activeTab, setActiveTab] = useState<"experiences" | "projects" | "skills" | "contact">("experiences");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Experience Form State
  const [showExpForm, setShowExpForm] = useState(false);
  const [newExpCompany, setNewExpCompany] = useState("");
  const [newExpRole, setNewExpRole] = useState("");
  const [newExpLocation, setNewExpLocation] = useState("");
  const [newExpStartDate, setNewExpStartDate] = useState("");
  const [newExpEndDate, setNewExpEndDate] = useState("");
  const [newExpBullet, setNewExpBullet] = useState("");

  // New Project Form State
  const [showProjForm, setShowProjForm] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjTech, setNewProjTech] = useState("");
  const [newProjLive, setNewProjLive] = useState("");
  const [newProjRepo, setNewProjRepo] = useState("");

  // New Skill Form State
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCat, setNewSkillCat] = useState<SkillCategory>("frameworks");

  // Contact Form State
  const [contactName, setContactName] = useState(profile.contact.fullName);
  const [contactHeadline, setContactHeadline] = useState(profile.contact.headline || "");
  const [contactEmail, setContactEmail] = useState(profile.contact.email);
  const [contactPhone, setContactPhone] = useState(profile.contact.phone || "");
  const [contactLocation, setContactLocation] = useState(profile.contact.location || "");
  const [contactLinkedin, setContactLinkedin] = useState(profile.contact.linkedinUrl || "");
  const [contactGithub, setContactGithub] = useState(profile.contact.githubUrl || "");

  function flashSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  // Toggle Experience Visibility
  async function toggleExperience(id: string) {
    try {
      const res = await fetch(`/api/profile/experiences/${id}/toggle`, { method: "PATCH" });
      if (res.ok) {
        setProfile((prev) => ({
          ...prev,
          experiences: prev.experiences.map((e) => (e.id === id ? { ...e, isHidden: !e.isHidden } : e)),
        }));
      }
    } catch (err) {
      console.error("Failed to toggle experience visibility", err);
    }
  }

  // Delete Experience
  async function deleteExperience(id: string) {
    if (!confirm("Are you sure you want to remove this work experience?")) return;
    try {
      const res = await fetch(`/api/profile/experiences/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProfile((prev) => ({
          ...prev,
          experiences: prev.experiences.filter((e) => e.id !== id),
        }));
        flashSuccess("Experience removed");
      }
    } catch (err) {
      console.error("Failed to delete experience", err);
    }
  }

  // Add Experience
  async function handleAddExperience(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        company: newExpCompany,
        role: newExpRole,
        location: newExpLocation,
        startDate: newExpStartDate || null,
        endDate: newExpEndDate || null,
        bullets: newExpBullet
          ? newExpBullet.split("\n").filter((b) => b.trim()).map((b) => ({ content: b.trim() }))
          : [],
      };

      const res = await fetch("/api/profile/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created: WorkExperience = await res.json();
        setProfile((prev) => ({ ...prev, experiences: [created, ...prev.experiences] }));
        setShowExpForm(false);
        setNewExpCompany("");
        setNewExpRole("");
        setNewExpLocation("");
        setNewExpStartDate("");
        setNewExpEndDate("");
        setNewExpBullet("");
        flashSuccess("Experience added to vault");
      }
    } catch (err) {
      console.error("Failed to add experience", err);
    } finally {
      setLoading(false);
    }
  }

  // Toggle Project Visibility
  async function toggleProject(id: string) {
    try {
      const res = await fetch(`/api/profile/projects/${id}/toggle`, { method: "PATCH" });
      if (res.ok) {
        setProfile((prev) => ({
          ...prev,
          projects: prev.projects.map((p) => (p.id === id ? { ...p, isHidden: !p.isHidden } : p)),
        }));
      }
    } catch (err) {
      console.error("Failed to toggle project visibility", err);
    }
  }

  // Delete Project
  async function deleteProject(id: string) {
    if (!confirm("Are you sure you want to remove this project?")) return;
    try {
      const res = await fetch(`/api/profile/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProfile((prev) => ({
          ...prev,
          projects: prev.projects.filter((p) => p.id !== id),
        }));
        flashSuccess("Project removed");
      }
    } catch (err) {
      console.error("Failed to delete project", err);
    }
  }

  // Add Project
  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: newProjName,
        description: newProjDesc,
        technologies: newProjTech ? newProjTech.split(",").map((t) => t.trim()).filter(Boolean) : [],
        liveUrl: newProjLive || "",
        repoUrl: newProjRepo || "",
      };

      const res = await fetch("/api/profile/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created: Project = await res.json();
        setProfile((prev) => ({ ...prev, projects: [created, ...prev.projects] }));
        setShowProjForm(false);
        setNewProjName("");
        setNewProjDesc("");
        setNewProjTech("");
        setNewProjLive("");
        setNewProjRepo("");
        flashSuccess("Project added to vault");
      }
    } catch (err) {
      console.error("Failed to add project", err);
    } finally {
      setLoading(false);
    }
  }

  // Toggle Skill Visibility
  async function toggleSkill(id: string) {
    try {
      const res = await fetch(`/api/profile/skills/${id}/toggle`, { method: "PATCH" });
      if (res.ok) {
        setProfile((prev) => ({
          ...prev,
          skills: prev.skills.map((s) => (s.id === id ? { ...s, isHidden: !s.isHidden } : s)),
        }));
      }
    } catch (err) {
      console.error("Failed to toggle skill visibility", err);
    }
  }

  // Delete Skill
  async function deleteSkill(id: string) {
    try {
      const res = await fetch(`/api/profile/skills/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProfile((prev) => ({
          ...prev,
          skills: prev.skills.filter((s) => s.id !== id),
        }));
      }
    } catch (err) {
      console.error("Failed to delete skill", err);
    }
  }

  // Add Skill
  async function handleAddSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/profile/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSkillName.trim(), category: newSkillCat }),
      });

      if (res.ok) {
        const created: SkillItem = await res.json();
        setProfile((prev) => ({ ...prev, skills: [...prev.skills, created] }));
        setNewSkillName("");
        setShowSkillForm(false);
        flashSuccess("Skill added");
      }
    } catch (err) {
      console.error("Failed to add skill", err);
    } finally {
      setLoading(false);
    }
  }

  // Save Contact Info
  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        fullName: contactName,
        headline: contactHeadline,
        email: contactEmail,
        phone: contactPhone,
        location: contactLocation,
        linkedinUrl: contactLinkedin,
        githubUrl: contactGithub,
      };

      const res = await fetch("/api/profile/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated: Profile = await res.json();
        setProfile(updated);
        flashSuccess("Contact details updated");
      }
    } catch (err) {
      console.error("Failed to update contact info", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm shadow-md animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Responsive Tab Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("experiences")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === "experiences"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Experiences ({profile.experiences.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === "projects"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Projects ({profile.projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("skills")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === "skills"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Skills ({profile.skills.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("contact")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === "contact"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Contact & Profile</span>
        </button>
      </div>

      {/* TAB 1: WORK EXPERIENCES */}
      {activeTab === "experiences" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Work History</h2>
            <button
              onClick={() => setShowExpForm(!showExpForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Role</span>
            </button>
          </div>

          {/* Add Experience Modal/Card */}
          {showExpForm && (
            <form onSubmit={handleAddExperience} className="p-5 rounded-xl border bg-card shadow-sm space-y-4">
              <h3 className="font-semibold text-sm">Add New Work Experience</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Company Name (e.g., Stripe)"
                  value={newExpCompany}
                  onChange={(e) => setNewExpCompany(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border bg-background"
                />
                <input
                  required
                  placeholder="Role Title (e.g., Senior Fullstack Engineer)"
                  value={newExpRole}
                  onChange={(e) => setNewExpRole(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border bg-background"
                />
                <input
                  placeholder="Location (e.g., San Francisco, CA or Remote)"
                  value={newExpLocation}
                  onChange={(e) => setNewExpLocation(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border bg-background"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Start (YYYY-MM)"
                    value={newExpStartDate}
                    onChange={(e) => setNewExpStartDate(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border bg-background"
                  />
                  <input
                    type="text"
                    placeholder="End (or leave blank)"
                    value={newExpEndDate}
                    onChange={(e) => setNewExpEndDate(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border bg-background"
                  />
                </div>
              </div>
              <textarea
                placeholder="Key achievements / bullet points (one per line)"
                rows={3}
                value={newExpBullet}
                onChange={(e) => setNewExpBullet(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpForm(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Experience"}
                </button>
              </div>
            </form>
          )}

          {/* Experience List */}
          {profile.experiences.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed bg-card/50 text-muted-foreground text-sm">
              No work experiences added yet. Click &quot;Add Role&quot; or import your resume.
            </div>
          ) : (
            <div className="space-y-3">
              {profile.experiences.map((exp) => (
                <div
                  key={exp.id}
                  className={`p-5 rounded-xl border bg-card shadow-sm transition-opacity ${
                    exp.isHidden ? "opacity-50 bg-muted/30" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base">{exp.role}</h3>
                        <span className="text-muted-foreground font-normal">at</span>
                        <span className="font-semibold">{exp.company}</span>
                        {exp.isHidden && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                            Hidden from resumes
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {exp.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {exp.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {exp.startDate || "N/A"} - {exp.endDate || "Present"}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Hide Toggle & Delete */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => toggleExperience(exp.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          exp.isHidden
                            ? "bg-muted text-muted-foreground hover:bg-muted/80"
                            : "bg-background text-foreground hover:bg-muted"
                        }`}
                        title={exp.isHidden ? "Show in resumes" : "Hide from resumes"}
                      >
                        {exp.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-primary" />}
                        <span className="hidden sm:inline">{exp.isHidden ? "Hidden" : "Visible"}</span>
                      </button>

                      <button
                        onClick={() => deleteExperience(exp.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {exp.bullets.length > 0 && (
                    <ul className="mt-3 space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
                      {exp.bullets.map((b) => (
                        <li key={b.id} className={b.isHidden ? "line-through opacity-40" : ""}>
                          {b.content}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROJECTS */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Side Projects & Technical Builds</h2>
            <button
              onClick={() => setShowProjForm(!showProjForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          {showProjForm && (
            <form onSubmit={handleAddProject} className="p-5 rounded-xl border bg-card shadow-sm space-y-4">
              <h3 className="font-semibold text-sm">Add New Project</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Project Name (e.g., Fitme)"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border bg-background"
                />
                <input
                  placeholder="Technologies (comma-separated, e.g. React, Next.js, AWS)"
                  value={newProjTech}
                  onChange={(e) => setNewProjTech(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border bg-background"
                />
                <input
                  placeholder="Live URL (optional)"
                  value={newProjLive}
                  onChange={(e) => setNewProjLive(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border bg-background"
                />
                <input
                  placeholder="Repo URL (optional)"
                  value={newProjRepo}
                  onChange={(e) => setNewProjRepo(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border bg-background"
                />
              </div>
              <textarea
                placeholder="Description of the project and impact"
                rows={2}
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProjForm(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Project"}
                </button>
              </div>
            </form>
          )}

          {profile.projects.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed bg-card/50 text-muted-foreground text-sm">
              No projects added yet. Click &quot;Add Project&quot; to showcase your builds.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.projects.map((proj) => (
                <div
                  key={proj.id}
                  className={`p-5 rounded-xl border bg-card shadow-sm flex flex-col justify-between space-y-3 transition-opacity ${
                    proj.isHidden ? "opacity-50 bg-muted/30" : ""
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base">{proj.name}</h3>
                          {proj.isHidden && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                              Hidden
                            </span>
                          )}
                        </div>
                        {proj.liveUrl && (
                          <a
                            href={proj.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <Globe className="w-3 h-3" />
                            <span>Live Demo</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleProject(proj.id)}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                          title={proj.isHidden ? "Show in resumes" : "Hide from resumes"}
                        >
                          {proj.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-primary" />}
                        </button>
                        <button
                          onClick={() => deleteProject(proj.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {proj.description && (
                      <p className="text-xs text-muted-foreground">{proj.description}</p>
                    )}
                  </div>

                  {proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                      {proj.technologies.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SKILLS */}
      {activeTab === "skills" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Skills Taxonomy</h2>
            <button
              onClick={() => setShowSkillForm(!showSkillForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Skill</span>
            </button>
          </div>

          {showSkillForm && (
            <form onSubmit={handleAddSkill} className="p-4 rounded-xl border bg-card shadow-sm flex flex-col sm:flex-row gap-3 items-center">
              <input
                required
                placeholder="Skill name (e.g., TypeScript)"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="w-full sm:w-auto flex-1 px-3 py-2 text-sm rounded-lg border bg-background"
              />
              <select
                value={newSkillCat}
                onChange={(e) => setNewSkillCat(e.target.value as SkillCategory)}
                className="w-full sm:w-auto px-3 py-2 text-sm rounded-lg border bg-background"
              >
                <option value="languages">Languages</option>
                <option value="frameworks">Frameworks & Libraries</option>
                <option value="cloud">Cloud & DevOps</option>
                <option value="tools">Tools & Platforms</option>
                <option value="soft">Soft Skills</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save
              </button>
            </form>
          )}

          {profile.skills.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed bg-card/50 text-muted-foreground text-sm">
              No skills added yet. Click &quot;Add Skill&quot; or import a resume to extract them automatically.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(["languages", "frameworks", "cloud", "tools", "soft"] as SkillCategory[]).map((cat) => {
                const categorySkills = profile.skills.filter((s) => s.category === cat);
                if (categorySkills.length === 0) return null;

                const titles: Record<SkillCategory, string> = {
                  languages: "Programming Languages",
                  frameworks: "Frameworks & Libraries",
                  cloud: "Cloud & Infrastructure",
                  tools: "Developer Tools",
                  soft: "Core Competencies",
                };

                return (
                  <div key={cat} className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      {titles[cat]} ({categorySkills.length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {categorySkills.map((s) => (
                        <div
                          key={s.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            s.isHidden
                              ? "bg-muted/40 text-muted-foreground line-through opacity-50"
                              : "bg-background text-foreground"
                          }`}
                        >
                          <span>{s.name}</span>
                          <button
                            onClick={() => toggleSkill(s.id)}
                            className="p-0.5 hover:text-primary transition-colors"
                            title={s.isHidden ? "Show in resumes" : "Hide from resumes"}
                          >
                            {s.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 text-muted-foreground" />}
                          </button>
                          <button
                            onClick={() => deleteSkill(s.id)}
                            className="p-0.5 hover:text-destructive transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CONTACT & HEADLINE */}
      {activeTab === "contact" && (
        <form onSubmit={handleSaveContact} className="max-w-2xl p-6 rounded-2xl border bg-card shadow-sm space-y-4">
          <h2 className="text-lg font-bold">Contact & Header Details</h2>
          <p className="text-xs text-muted-foreground">
            These contact details are included in exported PDFs and Markdown resumes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Full Name</label>
              <input
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Professional Headline</label>
              <input
                placeholder="Senior Fullstack Engineer"
                value={contactHeadline}
                onChange={(e) => setContactHeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Email Address</label>
              <input
                required
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Phone</label>
              <input
                placeholder="+1 (555) 000-0000"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Location</label>
              <input
                placeholder="San Francisco, CA"
                value={contactLocation}
                onChange={(e) => setContactLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">LinkedIn URL</label>
              <input
                placeholder="https://linkedin.com/in/..."
                value={contactLinkedin}
                onChange={(e) => setContactLinkedin(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium">GitHub / Portfolio URL</label>
              <input
                placeholder="https://github.com/..."
                value={contactGithub}
                onChange={(e) => setContactGithub(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Contact Details</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
