# Brief 02: Cognito Auth & Shell

Implement multi-tenant user authentication with Amazon Cognito support, session resolution (`userId = session.sub`), login/registration pages, and the responsive application shell supporting desktop navigation and mobile bottom navigation.

## Read First
- `GEMINI.md`
- `AGENTS.md`
- `_masterplan/architecture/tech-stack.md`
- `_masterplan/architecture/folder-structure.md`

## What to Build

1. **`src/lib/auth/session.ts`**:
   - `AuthSession` interface: `{ userId: string; email: string; name?: string }`.
   - `getSession()`: Reads session cookie, validates payload. Returns `AuthSession | null`.
   - `requireSession()`: Returns session or throws `AppError.unauthorized("Authentication required")`.
   - `setSessionCookie(session: AuthSession)`: Sets secure, HttpOnly session cookie (`fitme_session`).
   - `clearSessionCookie()`: Clears the session cookie.
2. **`src/lib/auth/cognito.ts`**:
   - Provides Cognito client authentication methods:
     - `cognitoSignIn(email, password)`
     - `cognitoSignUp(email, password, name)`
   - Falls back gracefully to local dev mock accounts when Cognito environment variables are not populated.
3. **Auth API Routes**:
   - `POST /api/auth/login`: Validates `{ email, password }`, creates session cookie, returns `{ user }`.
   - `POST /api/auth/register`: Validates `{ email, password, name }`, creates user, returns `{ user }`.
   - `POST /api/auth/logout`: Clears session cookie, returns `{ ok: true }`.
   - `GET /api/auth/me`: Returns `{ user }` or 401.
4. **Auth Pages (`src/app/(auth)/`)**:
   - `/login`: Email & password form with error messaging, redirect to `/dashboard`.
   - `/register`: Registration form with name, email, password.
5. **Responsive App Shell (`src/app/(dashboard)/layout.tsx`)**:
   - First-class responsive support:
     - **Desktop ($\ge 1024\text{px}$)**: Top sticky navbar with Logo, links (`Dashboard`, `Fit Studio`, `Master Vault`), user greeting, and Sign Out button.
     - **Mobile ($< 768\text{px}$)**: Compact top brand bar + bottom navigation bar with icons (`Dashboard`, `Fit Studio`, `Master Vault`, `Settings`).
6. **Dashboard Page (`src/app/(dashboard)/dashboard/page.tsx`)**:
   - Displays user welcome banner, quick status counters, and action cards.
7. **Tests (`tests/auth-shell.test.ts`)**:
   - Tests for auth routes, session helpers, and unauthorized rejection.

## Files to Create / Touch
- `_masterplan/design/02-auth-cognito.md`
- `src/lib/auth/session.ts`
- `src/lib/auth/cognito.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `tests/auth-shell.test.ts`

## Acceptance Criteria
- [ ] `POST /api/auth/login` sets session cookie and returns 200.
- [ ] `GET /api/auth/me` returns 401 when not logged in, 200 with session when authenticated.
- [ ] Responsive navigation verified on desktop and mobile layout.
- [ ] `npm run check` passes with 0 lint, type, or test errors.
- [ ] Commit message: `feat(auth): implement cognito auth session, login/register UI, and responsive shell`
