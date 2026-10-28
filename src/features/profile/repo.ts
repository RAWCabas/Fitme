import { Profile } from "./schema";

export interface ProfileRepo {
  getProfile(userId: string): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<Profile>;
}

export class MemoryProfileRepo implements ProfileRepo {
  private profiles = new Map<string, Profile>();

  async getProfile(userId: string): Promise<Profile | null> {
    const found = this.profiles.get(userId);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async saveProfile(profile: Profile): Promise<Profile> {
    const copy = JSON.parse(JSON.stringify(profile));
    this.profiles.set(profile.userId, copy);
    return copy;
  }

  // Clear helper for unit tests
  clear(): void {
    this.profiles.clear();
  }
}

let instance: ProfileRepo | null = null;

export function getProfileRepo(): ProfileRepo {
  if (!instance) {
    instance = new MemoryProfileRepo();
  }
  return instance;
}

export function setProfileRepo(repo: ProfileRepo | null): void {
  instance = repo;
}

