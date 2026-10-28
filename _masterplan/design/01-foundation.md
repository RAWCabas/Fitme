# Brief 01: Foundation & Health

Create the core foundation utilities: typed errors (`AppError`), HTTP response helpers, ISO date utilities, store configuration, and the system health check route (`/api/health`).

## Read First
- `GEMINI.md`
- `AGENTS.md`
- `_masterplan/architecture/folder-structure.md`

## What to Build

1. **`src/lib/errors.ts`**:
   - `AppError` class extending `Error` with `statusCode: number` and clean user-facing `message`.
   - Helper factory methods / error subclasses if appropriate (e.g., `NotFoundError(404)`, `BadRequestError(400)`, `UnauthorizedError(401)`, `ForbiddenError(403)`).
2. **`src/lib/http.ts`**:
   - Standardized API response helpers:
     - `json(data, status = 200)`: Returns `NextResponse.json(data, { status })`.
     - `errorResponse(error: unknown)`: Inspects error. If `AppError`, returns `{ error: error.message }` with `error.statusCode`. If Zod error, returns 400 with first message. If unexpected, returns 500 `{ error: "Internal server error" }`.
3. **`src/lib/dates.ts`**:
   - Standardized date & timestamp helpers:
     - `nowIso()`: Returns `new Date().toISOString()`.
     - `todayIso()`: Returns current date string `YYYY-MM-DD`.
     - `formatDisplayDate(isoString: string)`: Formats user-readable date (`"Jan 15, 2026"`).
     - `formatRelativeTime(isoString: string)`: Formats relative time (`"2 hours ago"`, `"3 days ago"`).
4. **`src/lib/config.ts`**:
   - Environment and store configuration reader:
     - `getDataStore()`: Returns `"memory"` or `"dynamo"` based on `process.env.DATA_STORE`.
     - `getVersion()`: Returns package version from `package.json`.
5. **`src/app/api/health/route.ts`**:
   - `GET /api/health`: Returns `{ ok: true, version: string, store: "memory" | "dynamo", timestamp: string }`.
6. **`tests/foundation.test.ts`**:
   - Unit tests covering `AppError`, `http.ts`, `dates.ts`, and `GET /api/health`.

## Files to Create
- `_masterplan/design/01-foundation.md`
- `src/lib/errors.ts`
- `src/lib/http.ts`
- `src/lib/dates.ts`
- `src/lib/config.ts`
- `src/app/api/health/route.ts`
- `tests/foundation.test.ts`

## Acceptance Criteria
- [ ] `GET /api/health` returns status 200 with `{ ok: true, version: ..., store: ... }`.
- [ ] `errorResponse` formats all errors consistently as `{ "error": "<message>" }`.
- [ ] All foundation unit tests pass in Vitest.
- [ ] `npm run check` passes with 0 lint, typecheck, or test errors.
- [ ] Commit message: `feat(foundation): add errors, http helpers, dates, and health check`

