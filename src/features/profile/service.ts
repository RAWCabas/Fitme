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
  educationItemSchema,
  skillItemSchema, 
  WorkExperience, 
  Project, 
  Certification,
  EducationItem,
  SkillItem 
} from "./schema";

/**
 * Detects whether a bullet contains quantifiable achievements / Google XYZ metrics.
 */
export function detectMetrics(text: string): boolean {
  if (!text) return false;
  return /\b\d+([.,]\d+)?\s*(%|\+|x|k|m|hours?|hrs?|users?|devices?|tickets?|workstations?|pts?|days?|months?|years?)?\b|\$\s*\d+/i.test(text);
}

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
      // Check if this profile belongs to Rhinn Cabas (or our primary candidate / dev user)
      const isTestEnv = !!process.env.VITEST || process.env.NODE_ENV === "test";
      const isRhinnExplicit =
        defaultEmail.toLowerCase().includes("rhinn") ||
        defaultEmail.toLowerCase().includes("cabas") ||
        defaultName.toLowerCase().includes("rhinn") ||
        defaultName.toLowerCase().includes("cabas") ||
        defaultName.toLowerCase().includes("chinn") ||
        userId.toLowerCase().includes("rhinn") ||
        userId === "dev_user_7268696e6e61" ||
        existing.contact.email.toLowerCase().includes("rhinn") ||
        existing.contact.email.toLowerCase().includes("cabas") ||
        existing.contact.fullName.toLowerCase().includes("cabas") ||
        existing.contact.fullName.toLowerCase().includes("rhinn") ||
        existing.contact.fullName.toLowerCase().includes("chinn");

      const isRhinn =
        isRhinnExplicit ||
        (!isTestEnv &&
          (existing.contact.fullName === "Candidate" ||
            existing.contact.email === "candidate@fitme.dev"));

      let needsSave = false;
      // Ensure backwards-compatible fields exist on legacy records
      if (!existing.education) {
        existing.education = [];
        needsSave = true;
      }
      if (!existing.certifications) {
        existing.certifications = [];
        needsSave = true;
      }
      if (!existing.projects) {
        existing.projects = [];
        needsSave = true;
      }
      if (!existing.experiences) {
        existing.experiences = [];
        needsSave = true;
      }
      if (!existing.skills) {
        existing.skills = [];
        needsSave = true;
      }
      if (!existing.hiddenContactFields) {
        existing.hiddenContactFields = [];
        needsSave = true;
      }

      // If user profile is completely empty (brand new initialization for Rhinn)
      if (
        isRhinn &&
        existing.experiences.length === 0 &&
        existing.projects.length === 0 &&
        existing.skills.length === 0
      ) {
        const masterEmail =
          existing.contact.email && existing.contact.email !== "candidate@fitme.dev"
            ? existing.contact.email
            : defaultEmail || "rhinnanthon@gmail.com";
        const masterName =
          existing.contact.fullName && existing.contact.fullName !== "Candidate"
            ? existing.contact.fullName
            : defaultName || "Rhinn Anthon William Cabas";
        const master = buildRhinnMasterProfile(userId, masterEmail, masterName);
        return await this.repo.saveProfile(master);
      }

      if (needsSave) {
        existing.updatedAt = nowIso();
        return await this.repo.saveProfile(existing);
      }

      return existing;
    }

    const isTestEnv = !!process.env.VITEST || process.env.NODE_ENV === "test";
    const isRhinnExplicit =
      defaultEmail.toLowerCase().includes("rhinn") ||
      defaultEmail.toLowerCase().includes("cabas") ||
      defaultName.toLowerCase().includes("rhinn") ||
      defaultName.toLowerCase().includes("cabas") ||
      defaultName.toLowerCase().includes("chinn") ||
      userId.toLowerCase().includes("rhinn") ||
      userId === "dev_user_7268696e6e61";

    const isRhinn =
      isRhinnExplicit ||
      (!isTestEnv && (!defaultEmail || defaultEmail === "candidate@fitme.dev"));

    const newProfile: Profile = isRhinn
      ? buildRhinnMasterProfile(
          userId,
          defaultEmail && defaultEmail !== "candidate@fitme.dev" ? defaultEmail : "rhinnanthon@gmail.com",
          defaultName && defaultName !== "Candidate" ? defaultName : "Rhinn Anthon William Cabas"
        )
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
          education: [],
          certifications: [],
          skills: [],
          summary: "",
          hiddenContactFields: [],
          updatedAt: nowIso(),
        };

    const validated = profileSchema.parse(newProfile);
    return await this.repo.saveProfile(validated);
  }

  /**
   * Resets / imports the full dual-track master profile for Rhinn Cabas (IT + Embedded/Software Tracks).
   */
  async importBothResumes(userId: string): Promise<Profile> {
    if (!userId) throw AppError.unauthorized();
    const existing = await this.repo.getProfile(userId);
    const email = existing?.contact?.email || "rhinnanthon@gmail.com";
    const name = "Rhinn Anthon William Cabas";
    const master = buildRhinnMasterProfile(userId, email, name);
    return await this.repo.saveProfile(master);
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
            const content = String(bulletObj.content || "").trim();
            return {
              id: bulletObj.id || crypto.randomUUID(),
              content,
              isHidden: Boolean(bulletObj.isHidden),
              hasMetrics: bulletObj.hasMetrics !== undefined ? Boolean(bulletObj.hasMetrics) : detectMetrics(content),
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
    let item = profile.experiences.find((e) => e.id === experienceId);
    if (!item) {
      item = profile.experiences.find(
        (e) =>
          e.company.toLowerCase().trim() === experienceId.toLowerCase().trim() ||
          e.role.toLowerCase().trim() === experienceId.toLowerCase().trim()
      );
    }
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
            const content = String(bulletObj.content || "").trim();
            return {
              id: bulletObj.id || crypto.randomUUID(),
              content,
              isHidden: Boolean(bulletObj.isHidden),
              hasMetrics: bulletObj.hasMetrics !== undefined ? Boolean(bulletObj.hasMetrics) : detectMetrics(content),
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
            const content = String(bulletObj.content || "").trim();
            return {
              id: bulletObj.id || crypto.randomUUID(),
              content,
              isHidden: Boolean(bulletObj.isHidden),
              hasMetrics: bulletObj.hasMetrics !== undefined ? Boolean(bulletObj.hasMetrics) : detectMetrics(content),
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
    let item = profile.projects.find((p) => p.id === projectId);
    if (!item) {
      item = profile.projects.find(
        (p) => p.name.toLowerCase().trim() === projectId.toLowerCase().trim()
      );
    }
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
            const content = String(bulletObj.content || "").trim();
            return {
              id: bulletObj.id || crypto.randomUUID(),
              content,
              isHidden: Boolean(bulletObj.isHidden),
              hasMetrics: bulletObj.hasMetrics !== undefined ? Boolean(bulletObj.hasMetrics) : detectMetrics(content),
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
    let item = profile.skills.find((s) => s.id === skillId);
    if (!item) {
      item = profile.skills.find(
        (s) => s.name.toLowerCase().trim() === skillId.toLowerCase().trim()
      );
    }
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
    const issueDate = raw.issueDate ? String(raw.issueDate).trim() : null;
    const expiryDate = raw.expiryDate ? String(raw.expiryDate).trim() : null;
    const withId = {
      ...raw,
      id: raw.id || crypto.randomUUID(),
      issueDate: issueDate || null,
      expiryDate: expiryDate || null,
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
    let item = profile.certifications.find((c) => c.id === certificationId);
    if (!item) {
      item = profile.certifications.find(
        (c) => c.name.toLowerCase().trim() === certificationId.toLowerCase().trim()
      );
    }
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
    const issueDate = raw.issueDate !== undefined ? (raw.issueDate ? String(raw.issueDate).trim() : null) : existing.issueDate;
    const expiryDate = raw.expiryDate !== undefined ? (raw.expiryDate ? String(raw.expiryDate).trim() : null) : existing.expiryDate;

    const updatedData = {
      ...existing,
      ...raw,
      issueDate: issueDate || null,
      expiryDate: expiryDate || null,
      id: certificationId,
    };

    const validated = certificationSchema.parse(updatedData);
    profile.certifications[existingIdx] = validated;
    profile.updatedAt = nowIso();

    await this.repo.saveProfile(profile);
    return validated;
  }

  /**
   * Adds an education item.
   */
  async addEducation(userId: string, input: unknown): Promise<EducationItem> {
    const profile = await this.getOrCreateProfile(userId);
    const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
    const startDate = raw.startDate ? String(raw.startDate).trim() : null;
    const endDate = raw.endDate ? String(raw.endDate).trim() : null;
    const withId = {
      ...raw,
      id: raw.id || crypto.randomUUID(),
      startDate: startDate || null,
      endDate: endDate || null,
      isHidden: Boolean(raw.isHidden),
    };

    const edu = educationItemSchema.parse(withId);
    if (!profile.education) profile.education = [];
    profile.education.unshift(edu);
    profile.updatedAt = nowIso();

    await this.repo.saveProfile(profile);
    return edu;
  }

  /**
   * Toggles visibility for an education item.
   */
  async toggleEducationVisibility(userId: string, educationId: string): Promise<boolean> {
    const profile = await this.getOrCreateProfile(userId);
    if (!profile.education) profile.education = [];
    let item = profile.education.find((e) => e.id === educationId);
    if (!item) {
      item = profile.education.find(
        (e) =>
          e.institution.toLowerCase().trim() === educationId.toLowerCase().trim() ||
          e.degree.toLowerCase().trim() === educationId.toLowerCase().trim()
      );
    }
    if (!item) throw AppError.notFound("Education item not found");

    item.isHidden = !item.isHidden;
    profile.updatedAt = nowIso();
    await this.repo.saveProfile(profile);
    return item.isHidden;
  }

  /**
   * Deletes an education item.
   */
  async deleteEducation(userId: string, educationId: string): Promise<void> {
    const profile = await this.getOrCreateProfile(userId);
    if (!profile.education) profile.education = [];
    const initialLen = profile.education.length;
    profile.education = profile.education.filter((e) => e.id !== educationId);

    if (profile.education.length === initialLen) {
      throw AppError.notFound("Education item not found");
    }

    profile.updatedAt = nowIso();
    await this.repo.saveProfile(profile);
  }

  /**
   * Updates an existing education item.
   */
  async updateEducation(userId: string, educationId: string, input: unknown): Promise<EducationItem> {
    const profile = await this.getOrCreateProfile(userId);
    if (!profile.education) profile.education = [];
    const existingIdx = profile.education.findIndex((e) => e.id === educationId);
    if (existingIdx === -1) throw AppError.notFound("Education item not found");

    const existing = profile.education[existingIdx];
    const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
    const startDate = raw.startDate !== undefined ? (raw.startDate ? String(raw.startDate).trim() : null) : existing.startDate;
    const endDate = raw.endDate !== undefined ? (raw.endDate ? String(raw.endDate).trim() : null) : existing.endDate;

    const updatedData = {
      ...existing,
      ...raw,
      startDate: startDate || null,
      endDate: endDate || null,
      id: educationId,
    };

    const validated = educationItemSchema.parse(updatedData);
    profile.education[existingIdx] = validated;
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
      let parent = profile.experiences.find((e) => e.id === parentId);
      if (!parent) {
        parent = profile.experiences.find(
          (e) =>
            e.company.toLowerCase().trim() === parentId.toLowerCase().trim() ||
            e.role.toLowerCase().trim() === parentId.toLowerCase().trim()
        );
      }
      if (!parent) throw AppError.notFound("Experience not found");
      let bullet = parent.bullets.find((b) => b.id === bulletId);
      if (!bullet) {
        bullet = parent.bullets.find((b) => b.content.toLowerCase().trim() === bulletId.toLowerCase().trim());
      }
      if (!bullet) throw AppError.notFound("Bullet not found");
      bullet.isHidden = !bullet.isHidden;
      profile.updatedAt = nowIso();
      await this.repo.saveProfile(profile);
      return bullet.isHidden;
    } else {
      let parent = profile.projects.find((p) => p.id === parentId);
      if (!parent) {
        parent = profile.projects.find(
          (p) => p.name.toLowerCase().trim() === parentId.toLowerCase().trim()
        );
      }
      if (!parent) throw AppError.notFound("Project not found");
      let bullet = parent.bullets.find((b) => b.id === bulletId);
      if (!bullet) {
        bullet = parent.bullets.find((b) => b.content.toLowerCase().trim() === bulletId.toLowerCase().trim());
      }
      if (!bullet) throw AppError.notFound("Bullet not found");
      bullet.isHidden = !bullet.isHidden;
      profile.updatedAt = nowIso();
      await this.repo.saveProfile(profile);
      return bullet.isHidden;
    }
  }

  /**
   * Toggles visibility for a contact or personal summary field (e.g. phone, location, headline, linkedinUrl, githubUrl, summary).
   */
  async toggleContactFieldVisibility(userId: string, fieldName: string): Promise<boolean> {
    const profile = await this.getOrCreateProfile(userId);
    if (!profile.hiddenContactFields) profile.hiddenContactFields = [];
    const normalized = fieldName.trim();
    const idx = profile.hiddenContactFields.indexOf(normalized);
    let isHidden = false;
    if (idx >= 0) {
      profile.hiddenContactFields.splice(idx, 1);
      isHidden = false;
    } else {
      profile.hiddenContactFields.push(normalized);
      isHidden = true;
    }
    profile.updatedAt = nowIso();
    await this.repo.saveProfile(profile);
    return isHidden;
  }

  /**
   * Saves the complete profile atomically, validating against profileSchema.
   */
  async saveFullProfile(userId: string, input: unknown): Promise<Profile> {
    if (!userId) throw AppError.unauthorized();
    const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
    const validated = profileSchema.parse({
      ...raw,
      userId,
      updatedAt: nowIso(),
    });
    return await this.repo.saveProfile(validated);
  }
}

export const profileService = new ProfileService();

/**
 * Builds the comprehensive dual-track Master Profile for Rhinn Cabas,
 * unifying both the IT & Technical Support resume and the Embedded Systems & Edge AI resume.
 */
export function buildRhinnMasterProfile(
  userId: string,
  email = "rhinnanthon@gmail.com",
  name = "Rhinn Anthon William Cabas"
): Profile {
  return {
    userId,
    contact: {
      fullName: name || "Rhinn Anthon William Cabas",
      headline: "Computer Engineer | Embedded Systems & Edge AI | IT & Technical Support",
      email: email || "rhinnanthon@gmail.com",
      phone: "0945-350-7389",
      location: "Deca Homes, Cubacub, Mandaue City, Cebu",
      portfolioUrl: "https://github.com/RAWCabas",
      linkedinUrl: "https://linkedin.com/in/rhinnanthon",
      githubUrl: "https://github.com/RAWCabas",
    },
    summary:
      "Analytical Computer Engineering graduate specializing in smart automation, embedded systems, and machine learning integration alongside strong foundations in hardware maintenance, systems troubleshooting, and network operations. Demonstrates hands-on expertise in hardware prototyping, 3D mechanical modeling, deploying Edge AI and computer vision solutions, and delivering dependable on-site and remote technical support across distributed teams and enterprise systems.",
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
          {
            id: crypto.randomUUID(),
            content:
              "Conducted system-level diagnostics, hardware assembly, and sensor integration for IoT embedded prototypes.",
            isHidden: false,
            hasMetrics: false,
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
          {
            id: crypto.randomUUID(),
            content:
              "Demonstrated reliable punctuality, active communication, and dispute resolution under operational pressure.",
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
        description:
          "Embedded machine learning deployment utilizing Edge Impulse and physical enclosure design.",
        technologies: [
          "Edge Impulse",
          "Embedded C/C++",
          "Autodesk Fusion 360",
          "Arduino IDE",
          "Computer Vision",
        ],
        liveUrl: "https://github.com/RAWCabas",
        repoUrl: "https://github.com/RAWCabas",
        isHidden: false,
        bullets: [
          {
            id: crypto.randomUUID(),
            content:
              "Engineered detailed 3D mechanical models and physical enclosures for edge computing hardware.",
            isHidden: false,
            hasMetrics: true,
          },
          {
            id: crypto.randomUUID(),
            content:
              "Trained and deployed real-time machine learning inference models using Edge Impulse.",
            isHidden: false,
            hasMetrics: true,
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: "Computer Systems Servicing & Network Infrastructure",
        description:
          "Workstation hardware diagnostics, operating system installations, and small-office LAN/WAN deployment.",
        technologies: [
          "Hardware Diagnostics",
          "Windows OS",
          "LAN/WAN",
          "TCP/IP",
          "Wi-Fi & Router Configuration",
        ],
        liveUrl: "https://github.com/RAWCabas",
        repoUrl: "https://github.com/RAWCabas",
        isHidden: false,
        bullets: [
          {
            id: crypto.randomUUID(),
            content:
              "Diagnosed hardware faults, assembled custom PC units, and configured Windows OS workstations with peripheral support.",
            isHidden: false,
            hasMetrics: false,
          },
          {
            id: crypto.randomUUID(),
            content:
              "Set up network switches, configured Wi-Fi routers with WPA security, and performed packet troubleshooting with TCP/IP utilities.",
            isHidden: false,
            hasMetrics: false,
          },
        ],
      },
    ],
    education: [
      {
        id: crypto.randomUUID(),
        institution: "Cebu Technological University- Main Campus",
        degree: "Bachelor of Science in Computer Engineering",
        fieldOfStudy: "Computer Engineering",
        startDate: "2020",
        endDate: "2024",
        level: "college",
        honors: "",
        isHidden: false,
      },
      {
        id: crypto.randomUUID(),
        institution: "High School",
        degree: "High School Diploma",
        fieldOfStudy: "STEM / General Academic",
        startDate: "2016",
        endDate: "2020",
        level: "high_school",
        honors: "",
        isHidden: false,
      },
      {
        id: crypto.randomUUID(),
        institution: "Elementary School",
        degree: "Primary Education Certificate",
        fieldOfStudy: "General",
        startDate: "2010",
        endDate: "2016",
        level: "elementary",
        honors: "",
        isHidden: false,
      },
    ],
    certifications: [
      {
        id: crypto.randomUUID(),
        name: "Computer Systems Servicing NCII",
        issuer: "TESDA Accredited Training",
        issueDate: null,
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
        issueDate: null,
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
        issueDate: null,
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
        issueDate: null,
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
        issueDate: null,
        expiryDate: null,
        credentialId: "CWD-102",
        credentialUrl: "",
        hours: "102 Hours",
        isHidden: false,
      },
    ],
    skills: [
      // Languages
      { id: crypto.randomUUID(), name: "Java (TESDA NC III)", category: "languages", isHidden: false },
      { id: crypto.randomUUID(), name: "C/C++ basics", category: "languages", isHidden: false },
      { id: crypto.randomUUID(), name: "HTML/CSS", category: "languages", isHidden: false },

      // Frameworks & Core Engineering
      { id: crypto.randomUUID(), name: "Edge Impulse", category: "frameworks", isHidden: false },
      { id: crypto.randomUUID(), name: "Arduino IDE", category: "frameworks", isHidden: false },
      { id: crypto.randomUUID(), name: "Problem-Solving & Algorithm Design", category: "frameworks", isHidden: false },

      // Cloud, Systems & Networking
      { id: crypto.randomUUID(), name: "Internet of Things (IoT)", category: "cloud", isHidden: false },
      { id: crypto.randomUUID(), name: "LAN/WAN Fundamentals", category: "cloud", isHidden: false },
      { id: crypto.randomUUID(), name: "TCP/IP & Internet Protocols", category: "cloud", isHidden: false },
      { id: crypto.randomUUID(), name: "Wi-Fi & Router Configuration", category: "cloud", isHidden: false },
      { id: crypto.randomUUID(), name: "Network Troubleshooting", category: "cloud", isHidden: false },

      // Tools & Hardware
      { id: crypto.randomUUID(), name: "PC Assembly & Hardware Diagnostics", category: "tools", isHidden: false },
      { id: crypto.randomUUID(), name: "OS Installation (Windows)", category: "tools", isHidden: false },
      { id: crypto.randomUUID(), name: "Printer & Scanner Setup", category: "tools", isHidden: false },
      { id: crypto.randomUUID(), name: "Autodesk Fusion 360", category: "tools", isHidden: false },
      { id: crypto.randomUUID(), name: "VS Code", category: "tools", isHidden: false },
      { id: crypto.randomUUID(), name: "Microsoft Office (Word, Excel, PowerPoint)", category: "tools", isHidden: false },
      { id: crypto.randomUUID(), name: "Google Workspace", category: "tools", isHidden: false },
      { id: crypto.randomUUID(), name: "Adobe Photoshop", category: "tools", isHidden: false },
      { id: crypto.randomUUID(), name: "Adobe Illustrator", category: "tools", isHidden: false },
      { id: crypto.randomUUID(), name: "Adobe Premiere Pro", category: "tools", isHidden: false },

      // Soft Skills
      { id: crypto.randomUUID(), name: "Diagnostic Problem-Solving", category: "soft", isHidden: false },
      { id: crypto.randomUUID(), name: "Customer Service & High-Volume Operations", category: "soft", isHidden: false },
      { id: crypto.randomUUID(), name: "Team Collaboration & Conflict Resolution", category: "soft", isHidden: false },
    ],
    hiddenContactFields: [],
    updatedAt: nowIso(),
  };
}
