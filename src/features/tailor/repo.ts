import { AppError } from "@/lib/errors";
import { nowIso } from "@/lib/dates";
import { JobOpportunity, TailoredResume, ResumeStatus } from "./schema";

export interface TailorRepo {
  saveJobOpportunity(job: JobOpportunity): Promise<JobOpportunity>;
  getJobOpportunity(userId: string, id: string): Promise<JobOpportunity | null>;
  saveTailoredResume(resume: TailoredResume): Promise<TailoredResume>;
  getTailoredResume(userId: string, id: string): Promise<TailoredResume | null>;
  listTailoredResumes(userId: string, jobId?: string): Promise<TailoredResume[]>;
  updateResumeStatus(userId: string, id: string, status: ResumeStatus): Promise<TailoredResume>;
}

export class MemoryTailorRepo implements TailorRepo {
  private jobs = new Map<string, JobOpportunity>();
  private resumes = new Map<string, TailoredResume>();

  async saveJobOpportunity(job: JobOpportunity): Promise<JobOpportunity> {
    const copy = JSON.parse(JSON.stringify(job));
    this.jobs.set(`${job.userId}#${job.id}`, copy);
    return copy;
  }

  async getJobOpportunity(userId: string, id: string): Promise<JobOpportunity | null> {
    const found = this.jobs.get(`${userId}#${id}`);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async saveTailoredResume(resume: TailoredResume): Promise<TailoredResume> {
    const copy = JSON.parse(JSON.stringify(resume));
    this.resumes.set(`${resume.userId}#${resume.id}`, copy);
    return copy;
  }

  async getTailoredResume(userId: string, id: string): Promise<TailoredResume | null> {
    const found = this.resumes.get(`${userId}#${id}`);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async listTailoredResumes(userId: string, jobId?: string): Promise<TailoredResume[]> {
    const results: TailoredResume[] = [];
    for (const [key, resume] of this.resumes.entries()) {
      if (key.startsWith(`${userId}#`)) {
        if (!jobId || resume.jobOpportunityId === jobId) {
          results.push(JSON.parse(JSON.stringify(resume)));
        }
      }
    }
    // Sort newest updated first
    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async updateResumeStatus(userId: string, id: string, status: ResumeStatus): Promise<TailoredResume> {
    const resume = await this.getTailoredResume(userId, id);
    if (!resume) throw AppError.notFound("Tailored resume not found");

    resume.status = status;
    resume.updatedAt = nowIso();
    return await this.saveTailoredResume(resume);
  }

  clear(): void {
    this.jobs.clear();
    this.resumes.clear();
  }
}

let instance: TailorRepo | null = null;

export function getTailorRepo(): TailorRepo {
  if (!instance) {
    instance = new MemoryTailorRepo();
  }
  return instance;
}

export function setTailorRepo(repo: TailorRepo | null): void {
  instance = repo;
}
