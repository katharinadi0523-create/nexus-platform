# Skill Import and Management Demo Implementation Plan

> **For agentic workers:** Use the native implementation approach in this session. Steps are scoped to the current Claw Demo and its mock data.

**Goal:** Align Skill import, personal management, and detail surfaces with the approved PRD while keeping marketplace metrics out of personal management.

**Architecture:** Keep the existing `MineSkillsWorkbench` and `SkillsPage` data flow. Add grouped presentation and added-time ordering to the personal management view, validate duplicate names during ZIP import, and use context-specific detail fields already present in the Demo. Do not add backend health or in-flight-call claims.

**Tech Stack:** Next.js, React, TypeScript, existing Radix UI wrappers, JSZip, Tailwind CSS.

**Spec:** Approved Skill PRD in the conversation on 2026-11-09; latest scope confirmation in the user message on 2026-11-10.

## Global Constraints

- Personal import remains browser-local Demo behavior; no backend persistence claims.
- Imported Skills are private to the current user's Claw and are enabled after a successful import.
- Management groups are “平台与组织” and “自定义”; shared skills are not deletable, personal imports are deletable.
- Marketplace download and favorite metrics remain marketplace-only.
- No online editing of an imported Skill in this iteration.
- Health status is not displayed; the enabled switch remains.
- Do not run or add tests unless the user requests them; verify with diff checks and browser inspection.

## Review Focus

- A duplicate name must keep the import dialog open and identify the conflict.
- An empty custom section must not render.
- Switching between table and card layouts must preserve the two groups and their ordering.
- Previewed `SKILL.md` metadata must not diverge from the imported package due to UI-only edits.
- Personal detail must not show marketplace statistics; marketplace detail must retain them.

## File Map

- `components/my-claw/skills/skills-hub.tsx`: personal management sections, import preview/validation, terminology, and delete confirmation.
- `lib/mock/my-claw/skills-mine.ts`: mock management ownership and added-time fields plus name-only search.
- `components/skills/skills-page.tsx`: preserve marketplace-specific stats and add/ favorite behavior without exposing them in personal management.

## Tasks

### Task 1: Personal Skill data and ordering

**Files:**
- Modify: `lib/mock/my-claw/skills-mine.ts`
- Modify: `components/my-claw/skills/skills-hub.tsx`

- [ ] Add a stable `addedAt` field to management items and populate it for built-in/demo imports.
- [ ] Sort each management group by `addedAt` descending; make search match Skill names only.
- [ ] Keep the management page’s shared and custom source distinctions without adding a health-status field.

### Task 2: Grouped management and personal detail actions

**Files:**
- Modify: `components/my-claw/skills/skills-hub.tsx`

- [ ] Render separate “平台与组织” and “自定义” sections in both list and card modes; hide an empty custom section.
- [ ] Keep platform/organization skills enabled or disabled only; expose delete only for imported personal Skills.
- [ ] Change “卸载” copy to “删除” and keep a confirmation dialog; do not simulate server call checks.
- [ ] Keep personal detail limited to source, update/version metadata, files, and `SKILL.md`; keep market counts absent.

### Task 3: Skill ZIP import flow

**Files:**
- Modify: `components/my-claw/skills/skills-hub.tsx`

- [ ] Display parsed import metadata and package file list as a read-only preview.
- [ ] Validate required metadata and duplicate Skill names against the user’s current Skill inventory.
- [ ] On success, save the personal Skill and enable it; use the exact CTA “保存并启用”.
- [ ] On validation errors, keep the preview and show the issue with a path to replace the ZIP; no partial insertion.

### Task 4: Marketplace detail boundary

**Files:**
- Modify only if necessary: `components/skills/skills-page.tsx`

- [ ] Confirm marketplace detail retains version, download/favorite metrics, add/favorite actions, and version history.
- [ ] Confirm no direct download/export action is reintroduced.

### Verification

- [ ] Run `git diff --check`.
- [ ] Inspect personal list/table and card grouping, imported Skill detail, duplicate-import feedback, and plaza detail in the browser.
- [ ] Do not run tests unless requested.
