# Brief 08: Quick-Fill Clipboard Tray

Build the Quick-Fill application clipboard assistant: slide-out drawer on Desktop, thumb-friendly bottom sheet on Mobile, with 1-click copy actions for summaries, experience bullets, categorized skills, and profile links to streamline filling out ATS job application forms (Workday, Greenhouse, Lever).

## Read First
- `GEMINI.md`
- `AGENTS.md`
- `_masterplan/product/features-v1.md` § F-07 (Quick-Fill Clipboard Tray)
- `_masterplan/data-structures/domain-types.md`

## What to Build

1. **`src/components/quick-fill-tray.tsx`**:
   - Responsive overlay component:
     - **Desktop ($\ge 1024\text{px}$)**: Slide-out drawer on right edge with smooth transition and backdrop overlay.
     - **Mobile ($< 768\text{px}$)**: Thumb-friendly bottom sheet with drag handle / header.
   - Organized into 4 sections:
     - **Contact & Links**: 1-click copy for Full Name, Email, Phone, LinkedIn, GitHub, Portfolio URL.
     - **Summary**: 1-click copy for tailored summary or master summary.
     - **Experience Bullets**: Grouped by employer/role, with 1-click copy on each bullet point.
     - **Skills**: 1-click copy as comma-separated text or per category.
   - Micro-interaction: Animated checkmark (`Check` icon) and temporary "Copied!" tooltip/feedback when clicking any copy button.
2. **Global Integration & Trigger**:
   - In `src/app/(dashboard)/layout.tsx`: Mount `QuickFillTray` so it is globally available across the dashboard, vault, and studio.
   - Provide a persistent floating launcher button (`Quick-Fill` badge with `ClipboardCopy` icon) on the lower right screen (hidden when tray is open).
3. **`tests/quick-fill-tray.test.tsx`**:
   - Component tests verifying drawer toggle open/close.
   - Verifying copy actions copy appropriate content to clipboard via `navigator.clipboard.writeText`.
   - Verifying responsive classes for desktop drawer and mobile bottom sheet.

## Acceptance Criteria
- [ ] Drawer opens cleanly as a side panel on desktop and bottom sheet on mobile.
- [ ] 1-Click copy buttons copy contact info, tailored summary, individual bullets, and skills.
- [ ] Visual copy feedback (checkmark / "Copied") appears on click.
- [ ] `npm run check` passes with 0 lint, type, or test errors.
- [ ] Commit message: `feat(quickfill): build desktop drawer and mobile bottom sheet clipboard tray`
