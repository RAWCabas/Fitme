# Brief 07: ATS Export Engine (PDF & Markdown)

Build the clean ATS-friendly Resume Exporter: Markdown generator, clean single-column printable HTML/PDF engine with 3 typography presets (`modern_standard`, `classic_ivy`, `tech_minimalist`), and export download endpoints.

## Read First
- `GEMINI.md`
- `AGENTS.md`
- `_masterplan/product/features-v1.md` § F-06 (ATS Exports & Typography Presets)
- `_masterplan/data-structures/domain-types.md`

## What to Build

1. **`src/features/export/service.ts`**:
   - `exportService.generateMarkdown(resume: TailoredResume, profile: Profile): string`
     - Generates clean, machine-readable standard Markdown with proper heading hierarchy (`#`, `##`, `###`), contact info, executive summary, bullet points, projects, and skills.
   - `exportService.generateHtmlDocument(resume: TailoredResume, profile: Profile, preset?: TypographyPreset): string`
     - Generates single-column ATS-compliant HTML document with `@media print` CSS rules, standard margins (0.5-0.75in), page-break controls, and typography styles for the 3 presets:
       - `modern_standard`: Inter/system sans-serif, bold headers, subtle horizontal dividers.
       - `classic_ivy`: Garamond/Georgia serif, formal centered headers, traditional typography.
       - `tech_minimalist`: Clean sans body with monospace headers and tech skills formatting.
2. **Export API Routes**:
   - `src/app/api/export/[id]/markdown/route.ts`:
     - `GET /api/export/[id]/markdown`: Authenticated endpoint returning `Content-Type: text/markdown` with `Content-Disposition: attachment; filename="<Role>_Resume.md"`.
   - `src/app/api/export/[id]/html/route.ts`:
     - `GET /api/export/[id]/html`: Authenticated endpoint returning `Content-Type: text/html` ready for standard browser print-to-PDF (`window.print()`).
3. **Studio UI Integration**:
   - In `src/app/(dashboard)/studio/studio-client.tsx`:
     - Add Export Actions toolbar:
       - "Export Markdown" button (triggers direct download).
       - "Print / Save PDF" button (opens printable document).
       - Typography preset switcher that dynamically adjusts the preview and export styles.
4. **`tests/export-engine.test.ts`**:
   - Unit tests for Markdown output structure.
   - Unit tests for HTML document generation and typography preset classes.
   - Integration tests for authenticated export API endpoints.

## Acceptance Criteria
- [ ] Markdown export generates clean single-column text adhering to ATS conventions.
- [ ] HTML export includes `@media print` styles and supports `modern_standard`, `classic_ivy`, and `tech_minimalist`.
- [ ] Export API endpoints enforce user authentication and return proper headers.
- [ ] Fit Studio UI allows switching typography preset and exporting to Markdown and PDF.
- [ ] `npm run check` passes with 0 lint, type, or test errors.
- [ ] Semantic commit message: `feat(export): add ats-clean pdf and markdown exporters with typography presets`

