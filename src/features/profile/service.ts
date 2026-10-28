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

    const newProfile: Profile = {
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
