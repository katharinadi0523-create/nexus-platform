# 「我的 Claw」迁移 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Nexus 内新增独立全屏 `/my-claw`，完整迁入会话交互「我的Claw」能力（含差旅/科研 mock 流程），会话与配置底座复用 Claw Workbench 组件，两入口改为打开平台内路由。

**Architecture:** `app/my-claw` 独立 layout（无 dashboard 顶栏侧栏）+ `MyClawProvider` 管会话列表/召唤智能体/模块状态；会话中栏右栏托管 `ClawInteractiveChatPanel` / `ResearchMultiAgentDebugPanel`；独有模块写在 `components/my-claw/*`；技能广场通过向后兼容 embed 复用 `SkillsPage`；文件与 Claw 配置复用 `ClawWorkspaceSection` / `ClawCoreConfigSection`（包 `WorkbenchEntityProvider`）。禁止改写 `claw-detail-workbench` 业务逻辑。

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Lucide, 现有 shadcn/Radix、sonner；mock 数据迁自 `/Users/nanbunan/Dev-Projects/会话交互`。

**Spec:** `docs/superpowers/specs/2026-07-26-my-claw-migration-design.md`

---

## File map（锁定边界）

| Path | Responsibility |
|------|----------------|
| `app/my-claw/layout.tsx` | 全屏壳 + Provider |
| `app/my-claw/**/page.tsx` | 薄路由页 |
| `components/my-claw/shell/*` | 左导、会话列表、设置菜单、三栏 layout |
| `components/my-claw/chat/*` | 会话宿主、智能体选择器、差旅驱动适配 |
| `components/my-claw/agents/*` | 智能体广场 |
| `components/my-claw/skills/*` | 技能双 Tab 宿主 |
| `components/my-claw/plugins/*` | 插件双 Tab 宿主 |
| `components/my-claw/automation/*` | 自动化任务 |
| `components/my-claw/product/*` | 产品说明 |
| `components/my-claw/settings/*` | 配置页包装（复用 core-config） |
| `components/my-claw/files/*` | 文件页包装（复用 workspace） |
| `lib/mock/my-claw/*` | 全部 mock / 演示剧本 |
| `components/claw-hub-next/claw-hub-next-workbench.tsx` | 仅改入口 URL |
| `app/(dashboard)/app-marketplace/page.tsx` | 仅改我的Claw 链接 |
| `app/(dashboard)/skills/page.tsx` | 仅加向后兼容 embed props（默认行为不变） |

**不做：** `subagent-*`、`memory-*`、会话交互整包 CSS/JS 拷贝、改 `claw-detail-workbench.tsx` 逻辑。

---

### Task 1: Mock 域模型与个人 Claw 夹具

**Files:**
- Create: `lib/mock/my-claw/types.ts`
- Create: `lib/mock/my-claw/personal-claw.ts`
- Create: `lib/mock/my-claw/sessions.ts`
- Create: `lib/mock/my-claw/index.ts`

- [ ] **Step 1: 定义会话列表与模块类型**

```ts
// lib/mock/my-claw/types.ts
export type MyClawModule =
  | "chat"
  | "agents"
  | "skills"
  | "plugins"
  | "automation"
  | "files"
  | "settings"
  | "product";

export type MyClawSessionKind =
  | "expense"
  | "enterprise_session"
  | "research_multi_agent"
  | "blank";

export interface MyClawSessionListItem {
  id: string;
  title: string;
  kind: MyClawSessionKind;
  pinned: boolean;
  updatedAt: string;
  preview: string;
}
```

- [ ] **Step 2: 导出个人 Claw 的 `ClawDetailData` 夹具**

从 `lib/mock/claw-hub-next.ts` 复用构建器（如列表第一条 detail / `createClawAgentMdFile` 一类 helper），导出：

```ts
// lib/mock/my-claw/personal-claw.ts
import type { ClawDetailData } from "@/lib/mock/claw-hub-next";

export const PERSONAL_CLAW_ID = "my-claw-personal";

export function getPersonalClawDetail(): ClawDetailData {
  // 基于现有 claw detail mock，id/name 改为「我的Claw」
  // coreFiles 仅保留 agent (Agent.md)
}
```

用于喂给 `ClawInteractiveChatPanel`、`ClawCoreConfigSection`、`ClawWorkspaceSection`。

- [ ] **Step 3: 会话列表种子**

从会话交互 `data.js` → `recentTasks` 迁出至少：

- `task-001`「上海出差报销」`kind: "expense"` `pinned: true`
- 至少一条可进入科研多智能体的会话或通过召唤创建
- 2–3 条 enterprise / 普通会话

```ts
export const MY_CLAW_SESSIONS: MyClawSessionListItem[] = [/* ... */];
```

- [ ] **Step 4: 编译检查**

Run: `npx tsc --noEmit`

Expected: 无新增错误。

- [ ] **Step 5: Commit**

```bash
git add lib/mock/my-claw
git commit -m "feat(my-claw): add personal claw mock types and session seeds"
```

---

### Task 2: 全屏 layout、Provider、左导壳与路由骨架

**Files:**
- Create: `components/my-claw/provider.tsx`
- Create: `components/my-claw/shell/my-claw-shell.tsx`
- Create: `components/my-claw/shell/sidebar.tsx`
- Create: `components/my-claw/shell/session-list.tsx`
- Create: `components/my-claw/shell/nav-items.ts`
- Create: `app/my-claw/layout.tsx`
- Create: `app/my-claw/page.tsx`
- Create: `app/my-claw/chat/page.tsx`
- Create: `app/my-claw/agents/page.tsx`
- Create: `app/my-claw/skills/page.tsx`
- Create: `app/my-claw/plugins/page.tsx`
- Create: `app/my-claw/automation/page.tsx`
- Create: `app/my-claw/files/page.tsx`
- Create: `app/my-claw/settings/page.tsx`
- Create: `app/my-claw/product/page.tsx`

- [ ] **Step 1: 实现 `MyClawProvider`**

状态至少包含：`sessions`、`activeSessionId`、`summonedAgentIds`、`selectedAgentId`、`setActiveSession`、`pinSession`、`renameSession`、`deleteSession`、`summonAgent`、`dismissAgent`。用 React Context + `useState`；会话种子来自 Task 1。

- [ ] **Step 2: 左导导航定义**

```ts
// components/my-claw/shell/nav-items.ts
export const MY_CLAW_PRIMARY_NAV = [
  { key: "chat", label: "新建会话", href: "/my-claw" },
  { key: "agents", label: "智能体广场", href: "/my-claw/agents" },
  { key: "skills", label: "技能", href: "/my-claw/skills" },
  { key: "plugins", label: "插件", href: "/my-claw/plugins" },
  { key: "automation", label: "自动化任务", href: "/my-claw/automation" },
] as const;

export const MY_CLAW_SETTINGS_NAV = [
  { key: "files", label: "文件", href: "/my-claw/files" },
  { key: "settings", label: "Claw配置", href: "/my-claw/settings" },
  { key: "product", label: "产品说明", href: "/my-claw/product" },
] as const;
```

**禁止**加入智能体、记忆中心。

- [ ] **Step 3: `MyClawShell` 三栏骨架**

- 左栏固定宽（参考会话交互约 260–280px）：品牌「我的Claw」、搜索占位、主导航、`SessionList`（置顶/最近分组；自动化树先占位空态）、头像、设置齿轮弹出菜单  
- 中栏：`children`  
- 右栏：仅在会话模块由 chat 宿主自行渲染（非会话模块中栏全宽，隐藏右栏）

会话列表交互：点击 → `/my-claw/chat?sessionId=`；pin/重命名/删除更新 Provider。

- [ ] **Step 4: `app/my-claw/layout.tsx`**

```tsx
import { MyClawProvider } from "@/components/my-claw/provider";
import { MyClawShell } from "@/components/my-claw/shell/my-claw-shell";

export default function MyClawLayout({ children }: { children: React.ReactNode }) {
  return (
    <MyClawProvider>
      <div className="h-screen overflow-hidden bg-slate-50">
        <MyClawShell>{children}</MyClawShell>
      </div>
    </MyClawProvider>
  );
}
```

注意：路由放在 `app/my-claw`（**不在** `(dashboard)` 下），避免平台顶栏侧栏。各 `page.tsx` 先渲染模块标题占位即可。

- [ ] **Step 5: 手测路由**

Run: `npm run dev` → 打开 `http://localhost:3000/my-claw`

Expected: 无平台侧栏；左导可切换各占位页；会话列表可点进 `/my-claw/chat`。

- [ ] **Step 6: Commit**

```bash
git add app/my-claw components/my-claw
git commit -m "feat(my-claw): add fullscreen shell, provider, and route skeleton"
```

---

### Task 3: 入口链接改为 `/my-claw`

**Files:**
- Modify: `components/claw-hub-next/claw-hub-next-workbench.tsx`（`PERSONAL_CLAW_URL`）
- Modify: `app/(dashboard)/app-marketplace/page.tsx`（我的Claw `externalLink`）

- [ ] **Step 1: 改 Claw 管理入口**

```ts
const PERSONAL_CLAW_URL = "/my-claw";
```

保持 `target="_blank"` / `rel="noopener noreferrer"`。

- [ ] **Step 2: 改应用广场卡片**

```ts
externalLink: "/my-claw",
```

`window.open(app.externalLink, "_blank")` 已有逻辑可打开站内路径。

- [ ] **Step 3: 手测两入口**

Expected: 均新开页进入 Task 2 的壳，不再打开 `claw-dialogue.vercel.app`。

- [ ] **Step 4: Commit**

```bash
git add components/claw-hub-next/claw-hub-next-workbench.tsx app/(dashboard)/app-marketplace/page.tsx
git commit -m "feat(my-claw): point personal claw entries to /my-claw"
```

---

### Task 4: 差旅报销 mock 流程 + 会话宿主 + 智能体选择器

**Files:**
- Create: `lib/mock/my-claw/expense-demo.ts`（从会话交互 `data.js` 的 `steps` 迁剧本元数据）
- Create: `lib/mock/my-claw/expense-adapter.ts`（映射到 Workbench 会话/run 或 panel 可消费结构）
- Create: `components/my-claw/chat/agent-selector.tsx`
- Create: `components/my-claw/chat/chat-workspace.tsx`
- Create: `components/my-claw/chat/composer-with-agents.tsx`
- Modify: `app/my-claw/page.tsx`、`app/my-claw/chat/page.tsx`

- [ ] **Step 1: 迁出差旅 `steps` 数据**

从 `/Users/nanbunan/Dev-Projects/会话交互/data.js` 复制 `steps`（约 32 步）到 `expense-demo.ts`，用 TypeScript 标注每步 `type`（user / thinking / clarify / plan / tool / skill / artifact 等）。**不得删减步骤语义。**

- [ ] **Step 2: 适配到 Nexus 会话结构**

编写适配器，目标是让 `ClawInteractiveChatPanel` 能展示等价时间线。优先路径：

1. 将 steps 映射为 `ChatSessionItem` + `ConversationRunItem`（见 `lib/mock/claw-hub-next.ts`），或  
2. 若现有 `buildInteractiveFlowTemplate` 无法覆盖全部类型：在 `components/my-claw/chat/chat-workspace.tsx` 用 `ClawConversationTimeline` 原子（`ClawUserMessage`、`ClawAgentThinking`、`ClawAgentAction`、`ClawAgentOutput` 等）按步渲染，右栏用与 `interactive-chat-panel` 相同的任务/文件/工具信息架构自建薄 inspector（样式抄 panel，不改 panel 文件）。

**硬性规则：** UI 组件来自 `components/claw-hub-next/*`，不复制会话交互 CSS 卡片。

- [ ] **Step 3: `ChatWorkspace` 按 `sessionId` / `kind` 分支**

```tsx
// kind === "expense" → 差旅驱动
// kind === "research_multi_agent" → Task 5
// 其它 → ClawInteractiveChatPanel + getPersonalClawDetail()
```

默认 `/my-claw` 打开置顶差旅会话或 blank + 可切入差旅。

- [ ] **Step 4: 智能体选择器**

挂在 composer 区域上方或 footer（对齐会话交互）：

- 列出 `summonedAgentIds`  
- 选中 / 取消  
- 「召唤其他智能体」→ `router.push("/my-claw/agents")`  

若复用 `DebugChatComposer`，在其外层包一层 footer，**不要改** `debug-chat-composer.tsx` 除非必须加可选 `footerSlot`（向后兼容，默认 undefined）。

- [ ] **Step 5: 手测差旅**

Expected: 打开「上海出差报销」可看到完整步骤流（思考/澄清/工具 HITL 等）；右栏有任务/文件/工具信息；选择器可跳转广场。

- [ ] **Step 6: Commit**

```bash
git add lib/mock/my-claw components/my-claw/chat app/my-claw/page.tsx app/my-claw/chat/page.tsx
git commit -m "feat(my-claw): port travel-expense mock onto Nexus chat shell"
```

---

### Task 5: 科研多智能体 mock 流程

**Files:**
- Create: `lib/mock/my-claw/research-multi-agent.ts`（从会话交互 `research-multi-agent-data.js` 迁）
- Create: `components/my-claw/chat/research-workspace.tsx`
- Modify: `components/my-claw/chat/chat-workspace.tsx`
- Modify: `components/my-claw/provider.tsx`（召唤 research 智能体时切换 session kind）

- [ ] **Step 1: 迁科研剧本与任务树**

保留主智能体「科研智能体」、子智能体、任务规划、产出物（论文/图表包）、工具事件。源：`/Users/nanbunan/Dev-Projects/会话交互/research-multi-agent-data.js` + module 行为要点。

- [ ] **Step 2: 宿主接入 Nexus research 面板**

优先直接渲染：

```tsx
import { ResearchMultiAgentDebugPanel } from "@/components/claw-hub-next/research-multi-agent-debug-panel";
// detail={getPersonalClawDetail()} inspectorMode="open"
```

若面板内置剧本与会话交互不一致：在 `research-workspace.tsx` 用同一套 timeline 原子 + 右栏标题「任务规划 / 产出物 / 工具」按迁入数据驱动，**流程步骤不得少于源数据关键路径**。

- [ ] **Step 3: 召唤入口**

智能体广场召唤 `research-claw`（Task 6）或侧栏点科研会话 → `kind: "research_multi_agent"` → 进入本宿主。

- [ ] **Step 4: 手测科研**

Expected: 可走通规划 → 子任务 → 技能/工具 → 产出物汇总；右栏标题在科研模式下正确。

- [ ] **Step 5: Commit**

```bash
git add lib/mock/my-claw/research-multi-agent.ts components/my-claw/chat
git commit -m "feat(my-claw): port research multi-agent mock flow"
```

---

### Task 6: 智能体广场

**Files:**
- Create: `lib/mock/my-claw/agents.ts`（从会话交互 `data.js` → `enterpriseAgents` 等）
- Create: `components/my-claw/agents/agents-plaza.tsx`
- Create: `components/my-claw/agents/agent-card.tsx`
- Modify: `app/my-claw/agents/page.tsx`

- [ ] **Step 1: 迁 agents 数据与 Tab 配置**

包含：`enterpriseAgentSourceScopeTabs`（全部/收藏/组织）、`enterpriseAgentCategoryTabs`、排序（最新/最热）、`enterpriseAgents` 全量卡片字段。

- [ ] **Step 2: 实现广场 UI**

- CeCloud plaza 灰蓝底（`bg-[#e8f0fb]` / 与 skills-hub 一致）  
- 来源 Tab + 类目 chips：**注意选中态对齐、避免原原型 Tab 错位/双线瑕疵**（统一 `h-8`、品牌蓝下划线或 pill，一组一种选中样式）  
- 卡片：名称、描述、标签、收藏、召唤  

- [ ] **Step 3: 召唤行为**

```ts
summonAgent(agentId);
if (agentId === "research-claw") { /* 创建或激活 research session */ }
router.push("/my-claw/chat?sessionId=...");
```

- [ ] **Step 4: 手测**

Expected: 筛选/排序/收藏不丢；召唤后回会话且选择器可见该智能体。

- [ ] **Step 5: Commit**

```bash
git add lib/mock/my-claw/agents.ts components/my-claw/agents app/my-claw/agents/page.tsx
git commit -m "feat(my-claw): add agents plaza with summon-to-chat"
```

---

### Task 7: 技能双 Tab（我的 + 内嵌广场）

**Files:**
- Modify: `app/(dashboard)/skills/page.tsx` — 增加可选 embed props  
- Create: `components/my-claw/skills/skills-hub.tsx`  
- Create: `lib/mock/my-claw/skills-mine.ts`（可选，或复用 skills mock）  
- Modify: `app/my-claw/skills/page.tsx`

- [ ] **Step 1: 为 `SkillsPage` 增加向后兼容 embed**

```ts
type SkillsPageProps = {
  moduleView?: SkillsModuleView;
  /** 嵌入 my-claw 等壳时隐藏外层页面标题/多余 padding */
  embedded?: boolean;
};
```

默认 `embedded=false`，`/skills` 与 `/skills-management` 行为不变。`embedded` 时：去掉重复大标题外边距，根容器 `bg-transparent`，适配壳内滚动。

- [ ] **Step 2: `MyClawSkillsHub` 双 Tab**

- Tab：**我的技能** | **技能广场**  
- 我的技能：Workbench/list-page 表（名称、来源 全部/内置/我的、启用开关、删除非内置、配置按钮、分页）— 视觉对齐 `skills-management` / management-list，**不要**旧 Dialog 大圆角软卡片  
- 技能广场：`<SkillsPage moduleView="hub" embedded />`

- [ ] **Step 3: 手测**

Expected: `/my-claw/skills` 左导仍在；两 Tab 可切；平台 `/skills` 外观与改前一致。

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/skills/page.tsx components/my-claw/skills app/my-claw/skills/page.tsx lib/mock/my-claw
git commit -m "feat(my-claw): embed skills plaza and workbench-style mine tab"
```

---

### Task 8: 插件双 Tab

**Files:**
- Create: `lib/mock/my-claw/plugins.ts`（从会话交互 `app.js` 插件数据 / 相关结构迁）  
- Create: `components/my-claw/plugins/plugins-hub.tsx`  
- Create: `components/my-claw/plugins/plugins-mine-table.tsx`  
- Create: `components/my-claw/plugins/plugins-plaza.tsx`  
- Modify: `app/my-claw/plugins/page.tsx`

- [ ] **Step 1: 我的插件表**

Workbench 列表：类型 `mcp | plugin | workflow | ontology_action`；来源 全部/内置/claw；启用、配置、删除。

- [ ] **Step 2: 插件广场**

因 `/tool-marketplace` 为 ComingSoon：按技能广场视觉 + 会话交互市场功能新写（来源/类目筛选、卡片、添加到我的）。**不要**链到 ComingSoon 页了事。

- [ ] **Step 3: 手测 + Commit**

```bash
git commit -m "feat(my-claw): add plugins mine table and plaza"
```

---

### Task 9: 自动化任务

**Files:**
- Create: `lib/mock/my-claw/automation.ts`（从 `automation-data.js`、`automation-executions-data.js` 迁）  
- Create: `components/my-claw/automation/automation-workbench.tsx`  
- Modify: `components/my-claw/shell/session-list.tsx`（接自动化树）  
- Modify: `components/my-claw/provider.tsx`  
- Modify: `app/my-claw/automation/page.tsx`

- [ ] **Step 1: 主区 list-page**

任务列表 / 执行历史 Tabs；工具条搜索、新建；表格列对齐原型（名称、触发、Claw、渠道、状态、操作）。样式用 `components/management/management-list.tsx` 原语或同 token（`h-8`、`#2773ff`、`rounded-[4px]`）。

- [ ] **Step 2: 创建/编辑能力（mock）**

cron/轮询、Claw 选择、投递渠道（飞书/蓝信/钉钉/企微/QQ/AF）、保存后更新列表并刷新侧栏树。

- [ ] **Step 3: 侧栏自动化树**

在置顶/最近下第三组渲染自动化任务及其执行节点；点击跳转自动化页或对应会话。

- [ ] **Step 4: 手测 + Commit**

```bash
git commit -m "feat(my-claw): add automation tasks list and sidebar tree"
```

---

### Task 10: 文件、Claw 配置、产品说明

**Files:**
- Create: `components/my-claw/files/files-page.tsx`  
- Create: `components/my-claw/settings/settings-page.tsx`  
- Create: `components/my-claw/product/product-doc-page.tsx`  
- Create: `lib/mock/my-claw/product-doc.ts`（可选）  
- Modify: 对应 `app/my-claw/*/page.tsx`

- [ ] **Step 1: 文件页**

```tsx
import { ClawWorkspaceSection } from "@/components/claw-hub-next/detail/workspace-section";
import { WorkbenchEntityProvider } from "@/components/claw-hub-next/workbench-entity-context";
// workspace 数据来自 getPersonalClawDetail().workspace*
```

本地 state 管 `selectedPath`；存储配置对话框若 Workbench 有现成可复用则复用，否则简易 mock dialog。

- [ ] **Step 2: Claw 配置页**

包 `WorkbenchEntityProvider entityLabel="Claw"`，渲染 `ClawCoreConfigSection`：

- 模型配置（主模型 + Fallback）  
- **仅** Agent.md（`onAgentMdContentChange` / `onSaveAgentMd` 走本地 state + toast）  
- **不渲染**组织记忆；不增加 SOUL/IDENTITY/USER 文件 Tab  

若 `ClawCoreConfigSection` 强制显示多余块：在 my-claw 包装层只传入 agent 相关 props，或复制其「模型 + Agent.md」JSX 到 `settings-page.tsx`（允许 UI 对齐拷贝，仍 import `ModelSelector` / `AgentMdEditor`），**不要**改 section 去拆掉 Workbench 其它用途所需 UI。优先读 section 源码确认能否只靠 props 收敛；不能则 my-claw 自组两块。

- [ ] **Step 3: 产品说明**

从会话交互 `app.js` → `renderProductDocPage` 迁「工具调用状态说明」：阶段轨、请求/代码 Tab、approve/deny 演示。用 Nexus/Tailwind 重写样式，交互逻辑保留。

- [ ] **Step 4: 手测 + Commit**

```bash
git commit -m "feat(my-claw): add files, claw settings, and product doc pages"
```

---

### Task 11: 端到端验收与缺口修补

**Files:** 按手测缺陷修改上述模块

- [ ] **Step 1: 按规格 §10 + §4.4 走查**

清单：

1. 两入口 → `/my-claw` 全屏  
2. 差旅 mock 完整可走（Nexus 组件）  
3. 科研 mock 完整可走  
4. 智能体广场筛选/召唤  
5. 技能双 Tab（平台 `/skills` 未回归坏）  
6. 插件双 Tab  
7. 自动化 + 侧栏树  
8. 文件=Workbench；配置=模型+Agent.md，无记忆  
9. 无智能体/记忆中心入口；产品说明可开  

- [ ] **Step 2: `npx tsc --noEmit` 干净**

- [ ] **Step 3: 最终 Commit（若有修复）**

```bash
git commit -m "fix(my-claw): close acceptance gaps from migration checklist"
```

---

## Spec coverage（自检）

| Spec 要求 | Task |
|-----------|------|
| 独立全屏壳 `/my-claw` | 2 |
| 两入口改链 | 3 |
| 共用会话底座 + 智能体选择器 | 4 |
| 差旅 mock 完整保留 | 4 |
| 科研 mock 完整保留 | 5 |
| 智能体广场新写 | 6 |
| 技能双 Tab + Nexus 广场嵌入 | 7 |
| 插件双 Tab | 8 |
| 自动化 list-page + 侧栏树 | 9 |
| 文件 Workbench | 10 |
| 配置模型+Agent.md，无组织记忆 | 10 |
| 产品说明 | 10 |
| 删除智能体/记忆中心 | 2（导航未加入） |
| 不改 Workbench 本体逻辑 | 全文约束；仅 skills embed / 入口 URL |

## 执行注意

- 每 Task 结束都应可手测，再 Commit。  
- 迁 mock 时以会话交互源文件为准做 diff，禁止「简化版演示」。  
- 平台改动仅限：入口 URL、SkillsPage 可选 `embedded`、（可选）Composer `footerSlot`。  
