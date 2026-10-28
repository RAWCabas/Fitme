# Brief 03: Master Experience Vault

Implement the Master Experience Vault feature: domain schemas, repository interface, business service with granular item-level visibility toggles (`isHidden`), API routes, responsive vault UI, and unit tests.

## Read First
- `GEMINI.md`
- `AGENTS.md`
- `_masterplan/data-structures/domain-types.md` § Master Experience Vault
- `_masterplan/architecture/folder-structure.md`

## What to Build

1. **`src/features/profile/schema.ts`**:
   - Exact schemas from `domain-types.md`:
     - `contactInfoSchema`
     - `bulletPointSchema` (with `id: uuid`, `content: text(1000)`, `isHidden: boolean`, `hasMetrics: boolean`)
     - `workExperienceSchema` (with `id: uuid`, `company`, `role`, `location`, `startDate`, `endDate`, `bullets`, `isHidden: boolean`)
     - `projectSchema` (with `id: uuid`, `name`, `description`, `technologies`, `liveUrl`, `repoUrl`, `bullets`, `isHidden: boolean`)
     - `skillItemSchema` (with `id: uuid`, `name`, `category`, `isHidden: boolean`)
     - `profileSchema` (with `userId`, `contact`, `experiences`, `projects`, `skills`, `summary`, `updatedAt`)
     - Inferred TypeScript types.
2. **`src/features/profile/repo.ts`**:
   - `ProfileRepo` interface: `getProfile(userId: string)`, `saveProfile(profile: Profile)`.
   - `MemoryProfileRepo`: in-memory thread-safe store for local tests and development.
   - `getProfileRepo()`: singleton factory returning `MemoryProfileRepo` or Dynamo repo.
3. **`src/features/profile/service.ts`**:
   - Business service enforcing user isolation:
     - `getOrCreateProfile(userId: string, defaultEmail?: string, defaultName?: string)`
     - `updateContact(userId: string, input: unknown)`
     - `addExperience(userId: string, input: unknown)`
     - `toggleExperienceVisibility(userId: string, id: string)`
     - `deleteExperience(userId: string, id: string)`
     - `addProject(userId: string, input: unknown)`
     - `toggleProjectVisibility(userId: string, id: string)`
     - `deleteProject(userId: string, id: string)`
     - `addSkill(userId: string, input: unknown)`
     - `toggleSkillVisibility(userId: string, id: string)`
     - `deleteSkill(userId: string, id: string)`
     - `toggleBulletVisibility(userId: string, parentType: "experience" | "project", parentId: string, bulletId: string)`
4. **API Routes**:
   - `GET /api/profile`: returns the current user's profile.
   - `PUT /api/profile/contact`: updates contact details.
   - `POST /api/profile/experiences`: adds a work experience.
   - `PATCH /api/profile/experiences/[id]/toggle`: toggles experience visibility.
   - `DELETE /api/profile/experiences/[id]`: deletes an experience.
   - `POST /api/profile/projects`: adds a project.
   - `PATCH /api/profile/projects/[id]/toggle`: toggles project visibility.
   - `DELETE /api/profile/projects/[id]`: deletes a project.
   - `POST /api/profile/skills`: adds a skill.
   - `PATCH /api/profile/skills/[id]/toggle`: toggles skill visibility.
   - `DELETE /api/profile/skills/[id]`: deletes a skill.
5. **Vault UI (`src/app/(dashboard)/vault/page.tsx`)**:
   - Responsive multi-section / tabbed view (`Contact`, `Experience`, `Projects`, `Skills`).
   - Granular **eye toggle** buttons allowing the user to hide/show entire jobs, side projects, bullet points, or skills.
   - Clean forms to add experience, projects, and skills.
6. **Tests (`tests/profile-vault.test.ts`)**:
   - Unit tests covering schemas, repository CRUD, tenant isolation, and visibility toggling.

## Files to Create
- `_masterplan/design/03-profile-vault.md`
- `src/features/profile/schema.ts`
- `src/features/profile/repo.ts`
- `src/features/profile/service.ts`
- `src/app/api/profile/route.ts`
- `src/app/api/profile/contact/route.ts`
- `src/app/api/profile/experiences/route.ts`
- `src/app/api/profile/experiences/[id]/toggle/route.ts`
- `src/app/api/profile/experiences/[id]/route.ts`
- `src/app/api/profile/projects/route.ts`
- `src/app/api/profile/projects/[id]/toggle/route.ts`
- `src/app/api/profile/projects/[id]/route.ts`
- `src/app/api/profile/skills/route.ts`
- `src/app/api/profile/skills/[id]/toggle/route.ts`
- `src/app/api/profile/skills/[id]/route.ts`
- `src/app/(dashboard)/vault/page.tsx`
- `src/app/(dashboard)/vault/vault-client.tsx`
- `tests/profile-vault.test.ts`

## Acceptance Criteria
- [ ] Profile schemas adhere strictly to `_masterplan/data-structures/domain-types.md`.
- [ ] Users can hide or show individual jobs, projects, bullet points, or skills via `isHidden`.
- [ ] All profile mutations are tenant-isolated strictly by `userId`.
- [ ] Responsive Vault UI supports both desktop viewports and mobile touch targets.
- [ ] `npm run check` passes with 0 lint, type, or test errors.
- [ ] Commit message: `feat(vault): implement master experience vault with granular item toggles`
