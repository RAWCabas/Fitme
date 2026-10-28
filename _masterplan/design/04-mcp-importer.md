# Brief 04: MCP Resume Importer

Implement the Amazon Bedrock structured AI extraction wrapper (`src/lib/bedrock.ts`), the Model Context Protocol (MCP) HTTP endpoint at `/api/mcp`, and the `fitme_import_resume` tool allowing AI assistants (Claude Desktop, Antigravity, Cursor) or the UI to parse raw resume text directly into the Master Experience Vault.

## Read First
- `GEMINI.md`
- `AGENTS.md`
- `_masterplan/architecture/tech-stack.md` § Bedrock
- `_masterplan/mcp/app-server.md`
- `_masterplan/data-structures/domain-types.md`

## What to Build

1. **`src/lib/bedrock.ts`**:
   - `invokeBedrockJson<T>(params)`: Invokes Amazon Bedrock (`anthropic.claude-3-5-haiku-20241022-v1:0` or configured model) with a system prompt and prompt string, enforcing structured JSON extraction.
   - Parses the model's output using a provided Zod schema.
   - If AWS credentials are not configured (local dev/tests), uses a deterministic fallback parser so the full test suite runs reliably offline.
2. **`src/features/mcp/resume-extractor.ts`**:
   - Extractor schema & function `parseResumeToProfile(rawResumeText: string)`:
     - Extracts contact info, summary, work experiences (with bullets), projects (with tech stacks), and categorized skills.
3. **`src/app/api/mcp/route.ts`**:
   - Implements JSON-RPC 2.0 / MCP protocol handler:
     - Handles `initialize`
     - Handles `tools/list`:
       - `fitme_import_resume`: Takes `rawText` (string) and populates the Master Vault.
       - `fitme_get_profile`: Returns the user's structured profile.
     - Handles `tools/call`: Executes the requested tool using the authenticated session or MCP Bearer secret.
4. **Vault UI Enhancement**:
   - Add a "Quick Import Resume" button/dialog in `src/app/(dashboard)/vault/vault-client.tsx` where users can paste raw resume text or markdown to auto-populate their vault.
5. **Tests (`tests/mcp-importer.test.ts`)**:
   - Unit tests for `invokeBedrockJson`, resume parsing extraction schema, MCP protocol `tools/list` and `tools/call`, and vault ingestion.

## Files to Create / Touch
- `_masterplan/design/04-mcp-importer.md`
- `src/lib/bedrock.ts`
- `src/features/mcp/resume-extractor.ts`
- `src/app/api/mcp/route.ts`
- `src/app/(dashboard)/vault/vault-client.tsx`
- `tests/mcp-importer.test.ts`

## Acceptance Criteria
- [ ] Bedrock wrapper parses structured JSON responses strictly through Zod.
- [ ] `fitme_import_resume` parses raw text and populates experiences, projects, and skills into the user's vault.
- [ ] MCP endpoint `/api/mcp` answers standard `initialize`, `tools/list`, and `tools/call`.
- [ ] UI allows pasting a resume to trigger the importer.
- [ ] `npm run check` passes with 0 lint, type, or test errors.
- [ ] Commit message: `feat(mcp): implement bedrock resume extractor and mcp import tool`
