import crypto from "crypto";
import { AppError } from "@/lib/errors";
import { nowIso } from "@/lib/dates";
import { getProfileRepo, ProfileRepo } from "./repo";
import { 
  Profile, 
  profileSchema, 
  contactInfoSchema, 
  workExperienceSchema, 
  projectSchema, 
  skillItemSchema, 
  WorkExperience, 
  Project, 
  SkillItem 
} from "./schema";

export class ProfileService {
  private customRepo?: ProfileRepo;

  constructor(repo?: ProfileRepo) {
    this.customRepo = repo;
  }

  private get repo(): ProfileRepo {
    return this.customRepo || getProfileRepo();
  }

  /**
   * Retrieves the user's master profile, initializing a clean one if it does not exist.
   */
  async getOrCreateProfile(userId: string, defaultEmail = "", defaultName = ""): Promise<Profile> {
    if (!userId) throw AppError.unauthorized();

    const existing = await this.repo.getProfile(userId);
    if (existing) {
      return existing;
    }

    const isRhinn = defaultEmail.toLowerCase().includes("rhinn") || defaultEmail.toLowerCase().includes("cabas");

    const newProfile: Profile = isRhinn
      ? {
          userId,
          contact: {
            fullName: "Rhinn Anthon William Cabas",
            headline: "Computer Engineer | Embedded Systems & Edge AI | IT & Technical Support",
            email: defaultEmail || "rhinnanthon@gmail.com",
            phone: "0945-350-7389",
            location: "Deca Homes, Cubacub, Mandaue City, Cebu",
            portfolioUrl: "https://github.com/RAWCabas",
            linkedinUrl: "https://linkedin.com/in/rhinnanthon",
            githubUrl: "https://github.com/RAWCabas",
          },
          summary:
            "Analytical Computer Engineering graduate specializing in smart automation, embedded systems, and machine learning integration. Demonstrates hands-on expertise in hardware prototyping, 3D mechanical modeling, and deploying Edge AI and computer vision solutions. Ready to deliver dependable on-site and remote technical support across office environments, distributed teams, and enterprise systems.",
          experiences: [
            {
              id: crypto.randomUUID(),
              company: "Sustainable Center for Engineering and Next-Generation Technology",
              role: "Project Research Assistant (Internship)",
              location: "Cebu, Philippines",
              startDate: "2026-01-01",
              endDate: null,
              isHidden: false,
              bullets: [
                {
                  id: crypto.randomUUID(),
                  content:
                    "Engineered detailed 3D designs and mechanical modeling for project hardware, optimizing structural integrity for physical enclosures.",
                  isHidden: false,
                  hasMetrics: true,
                },
                {
                  id: crypto.randomUUID(),
                  content:
                    "Collaborated closely on embedded programming and machine learning model training utilizing Edge Impulse for real-time edge computing deployment.",
                  isHidden: false,
                  hasMetrics: true,
                },
              ],
            },
            {
              id: crypto.randomUUID(),
              company: "McDonald's Philippines",
              role: "Customer Service Crew",
              location: "Cebu, Philippines",
              startDate: "2022-01-01",
              endDate: "2022-12-31",
              isHidden: false,
              bullets: [
                {
                  id: crypto.randomUUID(),
                  content:
                    "Assisted customers and efficiently handled orders within a high-volume, fast-paced environment.",
                  isHidden: false,
                  hasMetrics: false,
                },
                {
                  id: crypto.randomUUID(),
                  content:
                    "Worked effectively as part of a cohesive team to ensure consistent customer satisfaction.",
                  isHidden: false,
                  hasMetrics: false,
                },
              ],
            },
          ],
          projects: [
            {
              id: crypto.randomUUID(),
              name: "Edge AI & Hardware Prototyping (SCENG)",
              description: "Embedded machine learning deployment utilizing Edge Impulse and physical enclosure design.",
              technologies: ["Edge Impulse", "Embedded C/C++", "Autodesk Fusion 360", "Arduino IDE"],
              liveUrl: "https://github.com/RAWCabas",
              repoUrl: "https://github.com/RAWCabas",
              isHidden: false,
              bullets: [
                {
                  id: crypto.randomUUID(),
                  content: "Engineered detailed 3D mechanical models and physical enclosures for edge computing hardware.",
                  isHidden: false,
                  hasMetrics: true,
                },
                {
                  id: crypto.randomUUID(),
                  content: "Trained and deployed real-time machine learning inference models using Edge Impulse.",
                  isHidden: false,
                  hasMetrics: true,
                },
              ],
            },
            {
              id: crypto.randomUUID(),
              name: "TESDA Computer Systems Servicing & Java Certifications",
              description: "Certified hardware diagnostics, LAN/WAN network configuration, and Java programming.",
              technologies: ["Java", "LAN/WAN", "TCP/IP", "Windows OS", "Hardware Diagnostics"],
              liveUrl: "https://github.com/RAWCabas",
              repoUrl: "https://github.com/RAWCabas",
              isHidden: false,
              bullets: [
                {
                  id: crypto.randomUUID(),
                  content: "Completed 280 hours of Computer Systems Servicing NCII covering PC assembly, hardware diagnostics, and network troubleshooting.",
                  isHidden: false,
                  hasMetrics: true,
                },
                {
                  id: crypto.randomUUID(),
                  content: "Completed 240 hours of Programming (JAVA NCIII) and 120 hours of Level 3 Data Analysis.",
                  isHidden: false,
                  hasMetrics: true,
                },
              ],
            },
          ],
          skills: [
            { id: crypto.randomUUID(), name: "Java (TESDA NC III)", category: "languages", isHidden: false },
            { id: crypto.randomUUID(), name: "C/C++ basics", category: "languages", isHidden: false },
            { id: crypto.randomUUID(), name: "HTML/CSS", category: "languages", isHidden: false },
            { id: crypto.randomUUID(), name: "Edge Impulse", category: "frameworks", isHidden: false },
            { id: crypto.randomUUID(), name: "Arduino IDE", category: "frameworks", isHidden: false },
            { id: crypto.randomUUID(), name: "Internet of Things (IoT)", category: "cloud", isHidden: false },
            { id: crypto.randomUUID(), name: "LAN/WAN & TCP/IP", category: "cloud", isHidden: false },
            { id: crypto.randomUUID(), name: "Autodesk Fusion 360", category: "tools", isHidden: false },
            { id: crypto.randomUUID(), name: "VS Code", category: "tools", isHidden: false },
            { id: crypto.randomUUID(), name: "PC Assembly & Hardware Diagnostics", category: "tools", isHidden: false },
            { id: crypto.randomUUID(), name: "Adobe Photoshop & Premiere Pro", category: "tools", isHidden: false },
            { id: crypto.randomUUID(), name: "Diagnostic Problem-Solving", category: "soft", isHidden: false },
            { id: crypto.randomUUID(), name: "Collaborative Operations & Customer Service", category: "soft", isHidden: false },
          ],
          updatedAt: nowIso(),
        }
      : {
          userId,
          contact: {
            fullName: defaultName || "Candidate",
            headline: "",
            email: defaultEmail || "candidate@fitme.dev",
            phone: "",
            location: "",
            portfolioUrl: "",
            linkedinUrl: "",
            githubUrl: "",
          },
          experiences: [],
          projects: [],
          skills: [],
          summary: "",
          updatedAt: nowIso(),
        };

    const validated = profileSchema.parse(newProfile);
    return await this.repo.saveProfile(validated);
  }

  /**
   * Updates contact information.
   */
  async updateContact(userId: string, input: unknown): Promise<Profile> {
    const profile = await this.getOrCreateProfile(userId);
    const parsedContact = contactInfoSchema.parse(input);

    profile.contact = parsedContact;
    profile.updatedAt = nowIso();

    return await this.repo.saveProfile(profile);
  }

  /**
   * Updates executive summary.
   */
  async updateSummary(userId: string, summary: string): Promise<Profile> {
    const profile = await this.getOrCreateProfile(userId);
    profile.summary = summary.trim();
    profile.updatedAt = nowIso();
    return await this.repo.saveProfile(profile);
  }

  /**
   * Adds a new work experience.
   */
  async addExperience(userId: string, input: unknown): Promise<WorkExperience> {
    const profile = await this.getOrCreateProfile(userId);

    const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
    const withId = {
      ...raw,
      id: raw.id || crypto.randomUUID(),
      bullets: Array.isArray(raw.bullets)
        ? raw.bullets.map((b: unknown) => {
            const bulletObj = typeof b === "object" && b !== null ? (b as Record<string, unknown>) : { content: String(b) };
            return {
              id: bulletObj.id || crypto.randomUUID(),
              content: bulletObj.content,
              isHidden: Boolean(bulletObj.isHidden),
              hasMetrics: Boolean(bulletObj.hasMetrics),
            };
          })
        : [],
    };

    const experience = workExperienceSchema.parse(withId);
    profile.experiences.unshift(experience);
    profile.updatedAt = nowIso();

    await this.repo.saveProfile(profile);
    return experience;
  }

  /**
   * Toggles visibility for an entire work experience.
   */
  async toggleExperienceVisibility(userId: string, experienceId: string): Promise<boolean> {
    const profile = await this.getOrCreateProfile(userId);
    const item = profile.experiences.find((e) => e.id === experienceId);
    if (!item) throw AppError.notFound("Experience not found");

    item.isHidden = !item.isHidden;
    profile.updatedAt = nowIso();
    await this.repo.saveProfile(profile);
    return item.isHidden;
  }

  /**
   * Deletes a work experience.
   */
  async deleteExperience(userId: string, experienceId: string): Promise<void> {
    const profile = await this.getOrCreateProfile(userId);
    const initialLen = profile.experiences.length;
    profile.experiences = profile.experiences.filter((e) => e.id !== experienceId);

    if (profile.experiences.length === initialLen) {
      throw AppError.notFound("Experience not found");
    }

    profile.updatedAt = nowIso();
    await this.repo.saveProfile(profile);
  }

  /**
   * Adds a new project.
   */
  async addProject(userId: string, input: unknown): Promise<Project> {
    const profile = await this.getOrCreateProfile(userId);

    const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
    const withId = {
      ...raw,
      id: raw.id || crypto.randomUUID(),
      bullets: Array.isArray(raw.bullets)
        ? raw.bullets.map((b: unknown) => {
            const bulletObj = typeof b === "object" && b !== null ? (b as Record<string, unknown>) : { content: String(b) };
            return {
              id: bulletObj.id || crypto.randomUUID(),
              content: bulletObj.content,
              isHidden: Boolean(bulletObj.isHidden),
              hasMetrics: Boolean(bulletObj.hasMetrics),
            };
          })
        : [],
    };

    const project = projectSchema.parse(withId);
    profile.projects.unshift(project);
    profile.updatedAt = nowIso();

    await this.repo.saveProfile(profile);
    return project;
  }

  /**
   * Toggles visibility for an entire project.
   */
  async toggleProjectVisibility(userId: string, projectId: string): Promise<boolean> {
    const profile = await this.getOrCreateProfile(userId);
    const item = profile.projects.find((p) => p.id === projectId);
    if (!item) throw AppError.notFound("Project not found");

    item.isHidden = !item.isHidden;
    profile.updatedAt = nowIso();
    await this.repo.saveProfile(profile);
    return item.isHidden;
  }

  /**
   * Deletes a project.
   */
  async deleteProject(userId: string, projectId: string): Promise<void> {
    const profile = await this.getOrCreateProfile(userId);
    const initialLen = profile.projects.length;
    profile.projects = profile.projects.filter((p) => p.id !== projectId);

    if (profile.projects.length === initialLen) {
      throw AppError.notFound("Project not found");
    }

    profile.updatedAt = nowIso();
    await this.repo.saveProfile(profile);
  }

  /**
   * Adds a skill.
   */
  async addSkill(userId: string, input: unknown): Promise<SkillItem> {
    const profile = await this.getOrCreateProfile(userId);

    const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
    const withId = {
      ...raw,
      id: raw.id || crypto.randomUUID(),
    };

    const skill = skillItemSchema.parse(withId);
    profile.skills.push(skill);
    profile.updatedAt = nowIso();

    await this.repo.saveProfile(profile);
    return skill;
  }

  /**
   * Toggles visibility for a skill.
   */
  async toggleSkillVisibility(userId: string, skillId: string): Promise<boolean> {
    const profile = await this.getOrCreateProfile(userId);
    const item = profile.skills.find((s) => s.id === skillId);
    if (!item) throw AppError.notFound("Skill not found");

    item.isHidden = !item.isHidden;
    profile.updatedAt = nowIso();
    await this.repo.saveProfile(profile);
    return item.isHidden;
  }

  /**
   * Deletes a skill.
   */
  async deleteSkill(userId: string, skillId: string): Promise<void> {
    const profile = await this.getOrCreateProfile(userId);
    const initialLen = profile.skills.length;
    profile.skills = profile.skills.filter((s) => s.id !== skillId);

    if (profile.skills.length === initialLen) {
      throw AppError.notFound("Skill not found");
    }

    profile.updatedAt = nowIso();
    await this.repo.saveProfile(profile);
  }

  /**
   * Granular bullet toggle: toggles an individual bullet point inside an experience or project.
   */
  async toggleBulletVisibility(
    userId: string,
    parentType: "experience" | "project",
    parentId: string,
    bulletId: string
  ): Promise<boolean> {
    const profile = await this.getOrCreateProfile(userId);

    if (parentType === "experience") {
      const parent = profile.experiences.find((e) => e.id === parentId);
      if (!parent) throw AppError.notFound("Experience not found");
      const bullet = parent.bullets.find((b) => b.id === bulletId);
      if (!bullet) throw AppError.notFound("Bullet not found");
      bullet.isHidden = !bullet.isHidden;
      profile.updatedAt = nowIso();
      await this.repo.saveProfile(profile);
      return bullet.isHidden;
    } else {
      const parent = profile.projects.find((p) => p.id === parentId);
      if (!parent) throw AppError.notFound("Project not found");
      const bullet = parent.bullets.find((b) => b.id === bulletId);
      if (!bullet) throw AppError.notFound("Bullet not found");
      bullet.isHidden = !bullet.isHidden;
      profile.updatedAt = nowIso();
      await this.repo.saveProfile(profile);
      return bullet.isHidden;
    }
  }
}

export const profileService = new ProfileService();
