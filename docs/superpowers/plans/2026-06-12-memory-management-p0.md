# Memory Management P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the interactive P0 Memory Store and Dreaming demo in the existing Nexus management console, including Claw memory configuration and debug-session memory events.

**Architecture:** Keep domain types and demo data in one mock module, expose thin Next.js route components, and put client behavior in focused workbench components. Reuse the existing management list primitives and Claw detail shell so the feature matches the current CeCloud interface without restructuring unrelated code.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Radix-based local UI components, lucide-react, sonner.

---

### Task 1: Memory domain and shared UI primitives

**Files:**
- Create: `lib/mock/memory-management.ts`
- Create: `components/memory-management/memory-shared.tsx`

- [ ] **Step 1: Define the domain model and realistic P0 fixtures**

Create the Store, file tree, version, Dreaming job, diff, mount, and runtime-setting types. Export immutable fixture arrays and lookup helpers:

```ts
export type MemoryStoreType = "shared" | "fork" | "builtin_c";
export type DreamJobStatus =
  | "queued"
  | "running"
  | "pending_review"
  | "applied"
  | "dismissed"
  | "failed";
export type MountAccess = "read_only" | "propose_only" | "read_write";

export function getMemoryStore(storeId: string) {
  return memoryStores.find((store) => store.id === storeId);
}
```

Fixtures must include `store_客户某局`, `store_售前打法`, one fork Store, one built-in C Store, and Dreaming jobs covering review, applied, running, and failed states.

- [ ] **Step 2: Add shared formatters and badges**

Create reusable Store type labels, access labels, Dreaming status labels, compact number formatting, Store icon tile, and subdued status badge.

- [ ] **Step 3: Verify the module compiles**

Run: `npx tsc --noEmit`

Expected: no new errors from `memory-management.ts` or `memory-shared.tsx`.

### Task 2: Navigation and Memory Store list

**Files:**
- Modify: `app/(dashboard)/layout.tsx`
- Create: `app/(dashboard)/memory-management/page.tsx`
- Create: `components/memory-management/memory-management-workbench.tsx`
- Create: `components/memory-management/create-memory-store-dialog.tsx`

- [ ] **Step 1: Add the Memory navigation entry**

Add a Brain icon entry under the existing knowledge group:

```ts
{
  key: "MemoryManagement",
  label: "记忆",
  icon: Brain,
  href: "/memory-management",
}
```

Apply the same white management shell treatment used by skills and OpenAPI management.

- [ ] **Step 2: Build the page-level Store/Dreaming tabs**

Use query state (`?tab=stores|dreaming`) so the default Store list and Dreaming list share one route and retain direct links.

- [ ] **Step 3: Build Store search, filters, table, and row actions**

Implement name/description search, type filter, pending-candidate filter, refresh, details navigation, Dreaming navigation, and guarded deletion. Disable deletion for `builtin_c`.

- [ ] **Step 4: Build the create Store dialog**

Implement inline required-name validation and initialization modes:

```ts
type StoreInitialization = "blank" | "template" | "import";
```

Template and import selections generate plausible initial Markdown files. On submit, add the new Store to component state, close the dialog, show a toast, and navigate to its detail route.

- [ ] **Step 5: Verify the list page**

Run: `npx tsc --noEmit`

Expected: the new route and components compile without errors.

### Task 3: Store detail and version rollback

**Files:**
- Create: `app/(dashboard)/memory-management/stores/[storeId]/page.tsx`
- Create: `components/memory-management/memory-store-detail-workbench.tsx`

- [ ] **Step 1: Add the server route and not-found handling**

Resolve the Store by route parameter and call `notFound()` when the fixture does not exist.

- [ ] **Step 2: Build the Store identity header and memory file workspace**

Create a compact header with type/version/mount metadata and a two-column file tree/editor. The editor must support selecting a file, preview/edit mode, saving, adding Markdown files, and guarded deletion.

- [ ] **Step 3: Add lightweight version history and rollback**

Display each version with source, author, and time. Rollback must update the visible current version and file content state while preserving the version list and displaying a success toast.

- [ ] **Step 4: Link Store to Dreaming creation**

The primary action navigates to:

```text
/memory-management?tab=dreaming&create=1&storeId={storeId}
```

- [ ] **Step 5: Verify detail behavior compiles**

Run: `npx tsc --noEmit`

Expected: no TypeScript errors in the Store route or workbench.

### Task 4: Dreaming list, creation, Diff, and review

**Files:**
- Create: `components/memory-management/dreaming-list.tsx`
- Create: `components/memory-management/create-dreaming-dialog.tsx`
- Create: `app/(dashboard)/memory-management/dreaming/[jobId]/page.tsx`
- Create: `components/memory-management/dreaming-detail-workbench.tsx`

- [ ] **Step 1: Build the Dreaming task list**

Render task name, Store, session count, status, token usage, creator, time, and details action. Use subdued status dots/badges.

- [ ] **Step 2: Build the create Dreaming dialog**

Implement Store, session scope, optional prompt, and model tier fields. Support preselecting the Store from query parameters. Submit a review-ready mock job and navigate to its detail page.

- [ ] **Step 3: Build the Dreaming detail summary and file Diff**

Show review statistics and grouped side-by-side old/new text with added, removed, and unchanged line treatments. Keep Diff text selectable and horizontally safe.

- [ ] **Step 4: Implement apply and dismiss**

`应用新版本` changes the local job status to `applied`; `驳回` changes it to `dismissed`. Both require confirmation, disable conflicting actions after resolution, and show toast feedback.

- [ ] **Step 5: Verify Dreaming pages**

Run: `npx tsc --noEmit`

Expected: no TypeScript errors in Dreaming components or routes.

### Task 5: Claw memory configuration

**Files:**
- Create: `components/claw-hub-next/detail/claw-memory-section.tsx`
- Modify: `components/claw-hub-next/claw-detail-workbench.tsx`

- [ ] **Step 1: Build the isolated Claw memory section**

The component owns display and editing for:

```ts
interface ClawMemorySettings {
  memoryGuide: string;
  mounts: ClawMemoryMount[];
  sessionExtraction: boolean;
  acceptContextPack: boolean;
  returnMemorySuggestions: boolean;
}
```

Render built-in C Store details, private U Store aggregate, external mount table, and runtime switches.

- [ ] **Step 2: Build the mount dialog**

Allow selecting unmounted shared/fork Stores, access mode, and `usage_prompt`. Default to `propose_only`.

- [ ] **Step 3: Guard read-write mounts**

When access is `read_write`, show a second confirmation dialog explaining that the Claw writes directly to shared organizational memory. Only the confirmation adds the mount.

- [ ] **Step 4: Replace the existing placeholder**

Import `ClawMemorySection` and replace only the existing `TabsContent value="memory"` body. Remove the obsolete `clawMemoryEnabled` state if no longer used.

- [ ] **Step 5: Verify Claw detail compiles**

Run: `npx tsc --noEmit`

Expected: no TypeScript errors and no unused imports/state.

### Task 6: Debug-session memory sandbox and events

**Files:**
- Modify: `components/claw-hub-next/interactive-chat-panel.tsx`
- Modify: `components/claw-hub-next/conversation-timeline.tsx`

- [ ] **Step 1: Add the sandbox status bar**

Show a compact blue-gray bar above the conversation:

```text
记忆沙箱：本次调试读取真实记忆，写入暂存区，关闭会话后自动丢弃。
```

The `转正` action changes local state and shows a toast.

- [ ] **Step 2: Add memory event cards**

Create reusable `MemoryEventCard` UI for retrieval and write events. Add one retrieval and one write event to the historical demo state, and reveal equivalent cards during the runtime flow.

- [ ] **Step 3: Verify the debug panel**

Run: `npx tsc --noEmit`

Expected: no TypeScript errors and the existing timeline actions still render unchanged.

### Task 7: Static and browser verification

**Files:**
- Modify only files required by discovered defects.

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Expected: exit code 0, or only pre-existing errors documented and new errors fixed.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: successful Next.js production build.

- [ ] **Step 3: Start the development server**

Run: `npm run dev`

Expected: server responds on the assigned localhost port.

- [ ] **Step 4: Verify the P0 browser flow**

Using the in-app Browser, verify navigation, Store search/filter/create, Store file editing, Dreaming creation and review, version rollback, Claw mounting with read-write confirmation, and debug memory sandbox/events.

- [ ] **Step 5: Fix and re-verify visible defects**

Correct layout overflow, padding, interaction, or runtime errors discovered during browser verification, then rerun the affected static checks and browser steps.
