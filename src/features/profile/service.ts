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

      // Check if this profile belongs to Rhinn Cabas (or dev user)
      const isRhinn =
        defaultEmail.toLowerCase().includes("rhinn") ||
        defaultEmail.toLowerCase().includes("cabas") ||
        existing.contact.email.toLowerCase().includes("rhinn") ||
        existing.contact.email.toLowerCase().includes("cabas") ||
        existing.contact.fullName.toLowerCase().includes("cabas") ||
        existing.contact.fullName.toLowerCase().includes("chinn");

      if (isRhinn) {
        const master = buildRhinnMasterProfile(userId, existing.contact.email || defaultEmail, existing.contact.fullName);

        // Auto-fix typo "Chinn Rabas" -> "Rhinn Anthon William Cabas"
        if (existing.contact.fullName.toLowerCase().includes("chinn") || existing.contact.fullName === "Candidate") {
          existing.contact.fullName = "Rhinn Anthon William Cabas";
          needsSave = true;
        }

        // Ensure comprehensive headline covering both IT and Embedded Tracks
        if (!existing.contact.headline || !existing.contact.headline.includes("IT")) {
          existing.contact.headline = master.contact.headline;
          needsSave = true;
        }

        if (!existing.contact.phone) {
          existing.contact.phone = master.contact.phone;
          needsSave = true;
        }

        if (!existing.contact.location) {
          existing.contact.location = master.contact.location;
          needsSave = true;
        }

        if (!existing.summary) {
          existing.summary = master.summary;
          needsSave = true;
        }

        // Merge Work Experiences (SCENG + McDonald's)
        for (const exp of master.experiences) {
          const matchIdx = existing.experiences.findIndex(
            (e) => e.company.toLowerCase().includes(exp.company.toLowerCase().slice(0, 10))
          );
          if (matchIdx === -1) {
            existing.experiences.push(exp);
            needsSave = true;
          } else {
            // Ensure bullets exist
            if (existing.experiences[matchIdx].bullets.length === 0) {
              existing.experiences[matchIdx].bullets = exp.bullets;
              needsSave = true;
            }
          }
        }

        // Clean up TESDA if it was previously entered as a project
        const tesdaProjIdx = existing.projects.findIndex(
          (p) => p.name.includes("TESDA") || p.name.includes("Certifications")
        );
        if (tesdaProjIdx !== -1) {
          existing.projects.splice(tesdaProjIdx, 1);
          needsSave = true;
        }

        // Merge Technical Projects (SCENG + Computer Systems & Network Setup)
        for (const proj of master.projects) {
          const matchIdx = existing.projects.findIndex(
            (p) => p.name.toLowerCase().includes(proj.name.toLowerCase().slice(0, 8))
          );
          if (matchIdx === -1) {
            existing.projects.push(proj);
            needsSave = true;
          }
        }

        // Merge all 5 TESDA Certifications
        for (const cert of master.certifications) {
          const hasCert = existing.certifications.some(
            (c) => c.name.toLowerCase().includes(cert.name.toLowerCase().slice(0, 10))
          );
          if (!hasCert) {
            existing.certifications.push(cert);
            needsSave = true;
          }
        }

        // Merge all 24 Skills covering IT Support and Software/Embedded Tracks
        for (const skill of master.skills) {
          const hasSkill = existing.skills.some(
            (s) => s.name.toLowerCase() === skill.name.toLowerCase()
          );
          if (!hasSkill) {
            existing.skills.push(skill);
            needsSave = true;
          }
        }
      }

      if (needsSave) {
        existing.updatedAt = nowIso();
        return await this.repo.saveProfile(existing);
      }

      return existing;
    }

    const isRhinn = defaultEmail.toLowerCase().includes("rhinn") || defaultEmail.toLowerCase().includes("cabas");

    const newProfile: Profile = isRhinn
      ? buildRhinnMasterProfile(userId, defaultEmail, defaultName)
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
    updatedAt: nowIso(),
  };
}
