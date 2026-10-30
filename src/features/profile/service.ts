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
  certificationSchema,
  skillItemSchema, 
  WorkExperience, 
  Project, 
  Certification,
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
      let needsSave = false;
      if (!existing.certifications) {
        existing.certifications = [];
        needsSave = true;
      }

      // Auto-migration: if TESDA was saved as a project, migrate it to the 5 distinct certifications
      const tesdaProjIdx = existing.projects.findIndex(
        (p) => p.name.includes("TESDA") || p.name.includes("Certifications")
      );
      if (tesdaProjIdx !== -1) {
        existing.projects.splice(tesdaProjIdx, 1);
        if (existing.certifications.length === 0) {
          existing.certifications = [
            {
              id: crypto.randomUUID(),
              name: "Computer Systems Servicing NCII",
              issuer: "TESDA Accredited Training",
              issueDate: "2024-01-01",
              expiryDate: null,
              credentialId: "NCII-CSS-280",
              credentialUrl: "",
              hours: "280 Hours",
              isHidden: false,
            },
            {
              id: crypto.randomUUID(),
              name: "Programming (JAVA NCIII)",
              issuer: "TESDA Accredited Training",
              issueDate: "2024-01-01",
              expiryDate: null,
              credentialId: "NCIII-JAVA-240",
              credentialUrl: "",
              hours: "240 Hours",
              isHidden: false,
            },
            {
              id: crypto.randomUUID(),
              name: "Data Analysis Level 3",
              issuer: "TESDA Accredited Training",
              issueDate: "2024-01-01",
              expiryDate: null,
              credentialId: "DA-L3-120",
              credentialUrl: "",
              hours: "120 Hours",
              isHidden: false,
            },
            {
              id: crypto.randomUUID(),
              name: "Internet of Things (IoT)",
              issuer: "TESDA Accredited Training",
              issueDate: "2024-01-01",
              expiryDate: null,
              credentialId: "IOT-102",
              credentialUrl: "",
              hours: "102 Hours",
              isHidden: false,
            },
            {
              id: crypto.randomUUID(),
              name: "Creative Web Design",
              issuer: "TESDA Accredited Training",
              issueDate: "2024-01-01",
              expiryDate: null,
              credentialId: "CWD-102",
              credentialUrl: "",
              hours: "102 Hours",
              isHidden: false,
            },
          ];
        }
        needsSave = true;
      }

      if (needsSave) {
        existing.updatedAt = nowIso();
        return await this.repo.saveProfile(existing);
      }

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
          ],
          certifications: [
            {
              id: crypto.randomUUID(),
              name: "Computer Systems Servicing NCII",
              issuer: "TESDA Accredited Training",
              issueDate: "2024-01-01",
              expiryDate: null,
              credentialId: "NCII-CSS-280",
              credentialUrl: "",
              hours: "280 Hours",
              isHidden: false,
            },
            {
              id: crypto.randomUUID(),
              name: "Programming (JAVA NCIII)",
              issuer: "TESDA Accredited Training",
              issueDate: "2024-01-01",
              expiryDate: null,
              credentialId: "NCIII-JAVA-240",
              credentialUrl: "",
              hours: "240 Hours",
              isHidden: false,
            },
            {
              id: crypto.randomUUID(),
              name: "Data Analysis Level 3",
              issuer: "TESDA Accredited Training",
              issueDate: "2024-01-01",
              expiryDate: null,
              credentialId: "DA-L3-120",
              credentialUrl: "",
              hours: "120 Hours",
              isHidden: false,
            },
            {
              id: crypto.randomUUID(),
              name: "Internet of Things (IoT)",
              issuer: "TESDA Accredited Training",
              issueDate: "2024-01-01",
              expiryDate: null,
              credentialId: "IOT-102",
              credentialUrl: "",
              hours: "102 Hours",
              isHidden: false,
            },
            {
              id: crypto.randomUUID(),
              name: "Creative Web Design",
              issuer: "TESDA Accredited Training",
              issueDate: "2024-01-01",
              expiryDate: null,
              credentialId: "CWD-102",
              credentialUrl: "",
              hours: "102 Hours",
              isHidden: false,
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
          certifications: [],
          skills: [],
          summary: "",
          updatedAt: nowIso(),
        };

    const validated = profileSchema.parse(newProfile);
    return await this.repo.saveProfile(validated);
  }

  /**
   * Updates contact information and optional executive summary.
   */
  async updateContact(userId: string, input: unknown): Promise<Profile> {
    const profile = await this.getOrCreateProfile(userId);
    const parsedContact = contactInfoSchema.parse(input);

    profile.contact = parsedContact;
    if (typeof input === "object" && input !== null && "summary" in input) {
      profile.summary = String((input as Record<string, unknown>).summary).trim();
    }
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
   * Updates an existing work experience.
   */
  async updateExperience(userId: string, experienceId: string, input: unknown): Promise<WorkExperience> {
    const profile = await this.getOrCreateProfile(userId);
    const existingIdx = profile.experiences.findIndex((e) => e.id === experienceId);
    if (existingIdx === -1) throw AppError.notFound("Experience not found");

    const existing = profile.experiences[existingIdx];
    const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};

    const updatedData = {
      ...existing,
      ...raw,
      id: experienceId,
      bullets: Array.isArray(raw.bullets)
        ? raw.bullets.map((b: unknown) => {
            const bulletObj = typeof b === "object" && b !== null ? (b as Record<string, unknown>) : { content: String(b) };
            return {
              id: bulletObj.id || crypto.randomUUID(),
              content: String(bulletObj.content || "").trim(),
              isHidden: Boolean(bulletObj.isHidden),
              hasMetrics: Boolean(bulletObj.hasMetrics),
            };
          })
        : existing.bullets,
    };

    const validated = workExperienceSchema.parse(updatedData);
    profile.experiences[existingIdx] = validated;
    profile.updatedAt = nowIso();

    await this.repo.saveProfile(profile);
    return validated;
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
   * Updates an existing project.
   */
  async updateProject(userId: string, projectId: string, input: unknown): Promise<Project> {
    const profile = await this.getOrCreateProfile(userId);
    const existingIdx = profile.projects.findIndex((p) => p.id === projectId);
    if (existingIdx === -1) throw AppError.notFound("Project not found");

    const existing = profile.projects[existingIdx];
    const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};

    const updatedData = {
      ...existing,
      ...raw,
      id: projectId,
      technologies: Array.isArray(raw.technologies)
        ? raw.technologies.map(String)
        : typeof raw.technologies === "string"
        ? (raw.technologies as string).split(",").map((t) => t.trim()).filter(Boolean)
        : existing.technologies,
      bullets: Array.isArray(raw.bullets)
        ? raw.bullets.map((b: unknown) => {
            const bulletObj = typeof b === "object" && b !== null ? (b as Record<string, unknown>) : { content: String(b) };
            return {
              id: bulletObj.id || crypto.randomUUID(),
              content: String(bulletObj.content || "").trim(),
              isHidden: Boolean(bulletObj.isHidden),
              hasMetrics: Boolean(bulletObj.hasMetrics),
            };
          })
        : existing.bullets,
    };

    const validated = projectSchema.parse(updatedData);
    profile.projects[existingIdx] = validated;
    profile.updatedAt = nowIso();

    await this.repo.saveProfile(profile);
    return validated;
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
   * Updates an existing skill.
   */
  async updateSkill(userId: string, skillId: string, input: unknown): Promise<SkillItem> {
    const profile = await this.getOrCreateProfile(userId);
    const existingIdx = profile.skills.findIndex((s) => s.id === skillId);
    if (existingIdx === -1) throw AppError.notFound("Skill not found");

    const existing = profile.skills[existingIdx];
    const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};

    const updatedData = {
      ...existing,
      ...raw,
      id: skillId,
    };

    const validated = skillItemSchema.parse(updatedData);
    profile.skills[existingIdx] = validated;
    profile.updatedAt = nowIso();

    await this.repo.saveProfile(profile);
    return validated;
  }

  /**
   * Adds a new certification.
   */
  async addCertification(userId: string, input: unknown): Promise<Certification> {
    const profile = await this.getOrCreateProfile(userId);
    const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
    const withId = {
      ...raw,
      id: raw.id || crypto.randomUUID(),
      isHidden: Boolean(raw.isHidden),
    };

    const cert = certificationSchema.parse(withId);
    if (!profile.certifications) profile.certifications = [];
    profile.certifications.unshift(cert);
    profile.updatedAt = nowIso();

    await this.repo.saveProfile(profile);
    return cert;
  }

  /**
   * Toggles visibility for a certification.
   */
  async toggleCertificationVisibility(userId: string, certificationId: string): Promise<boolean> {
    const profile = await this.getOrCreateProfile(userId);
    if (!profile.certifications) profile.certifications = [];
    const item = profile.certifications.find((c) => c.id === certificationId);
    if (!item) throw AppError.notFound("Certification not found");

    item.isHidden = !item.isHidden;
    profile.updatedAt = nowIso();
    await this.repo.saveProfile(profile);
    return item.isHidden;
  }

  /**
   * Deletes a certification.
   */
  async deleteCertification(userId: string, certificationId: string): Promise<void> {
    const profile = await this.getOrCreateProfile(userId);
    if (!profile.certifications) profile.certifications = [];
    const initialLen = profile.certifications.length;
    profile.certifications = profile.certifications.filter((c) => c.id !== certificationId);

    if (profile.certifications.length === initialLen) {
      throw AppError.notFound("Certification not found");
    }

    profile.updatedAt = nowIso();
    await this.repo.saveProfile(profile);
  }

  /**
   * Updates an existing certification.
   */
  async updateCertification(userId: string, certificationId: string, input: unknown): Promise<Certification> {
    const profile = await this.getOrCreateProfile(userId);
    if (!profile.certifications) profile.certifications = [];
    const existingIdx = profile.certifications.findIndex((c) => c.id === certificationId);
    if (existingIdx === -1) throw AppError.notFound("Certification not found");

    const existing = profile.certifications[existingIdx];
    const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};

    const updatedData = {
      ...existing,
      ...raw,
      id: certificationId,
    };

    const validated = certificationSchema.parse(updatedData);
    profile.certifications[existingIdx] = validated;
    profile.updatedAt = nowIso();

    await this.repo.saveProfile(profile);
    return validated;
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
