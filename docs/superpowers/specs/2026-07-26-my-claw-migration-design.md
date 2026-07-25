# 「我的 Claw」迁移进 Nexus Platform 设计规格

## 1. 目标

将独立静态原型项目「会话交互」（部署于 `https://claw-dialogue.vercel.app/`，品牌「我的Claw」）的完整产品能力，迁入 Nexus Platform，使管控端 Claw 管理页「查看我的 Claw」、应用广场「我的Claw」点击后，在平台内新开页进入功能齐备的个人 Claw 工作台。

### 1.1 成功标准

- 用户从上述两入口进入 `/my-claw`，看到与会话交互对齐的三栏壳与左导模块（删除项除外）。
- 会话时间线、主会话区、右侧三面板与 Nexus Claw Workbench 对话底座共用同一套组件；输入框额外具备智能体选择器。
- 技能 / 插件 / 文件 / 模型配置等可复用能力使用 Nexus 现有实现与视觉；独有模块（智能体广场、自动化任务、产品说明）在 Nexus 内新写。
- 不改造 Claw Detail Workbench 本体业务逻辑；平台既有页面仅允许改入口链接目标。

### 1.2 明确不做

- 不迁移「智能体」（subagents）模块与导航。
- 不迁移「记忆中心」模块与导航；Claw 配置中不保留「组织记忆」。
- 不迁移会话交互自带登录遮罩；沿用平台登录态，进入 `/my-claw` 直接进工作台。
- 不通过 iframe 嵌旧项目。
- 首期不接真实后端，使用从前端原型迁出的 mock / 演示数据。

## 2. 已确认决策

| 决策点 | 选择 |
|--------|------|
| 壳层 | 独立全屏 `/my-claw`，隐藏 Nexus 顶栏与侧栏 |
| 技能/插件广场 | 嵌在 my-claw 壳内，左导不消失 |
| 会话保真度 | 完整迁移演示能力（差旅报销时间线、HITL、多智能体研究模式等） |
| 入口 | Claw 管理 + 应用广场两处均改为打开 `/my-claw` |
| 登录 | 不迁 Claw 登录 |
| 实现路径 | 新建 `my-claw` 模块 + import 复用底座（不扩 Workbench 个人模式、不用 iframe） |

## 3. 信息架构与路由

### 3.1 入口

| 现有位置 | 变更 |
|----------|------|
| `components/claw-hub-next/claw-hub-next-workbench.tsx` 「查看我的claw」 | `PERSONAL_CLAW_URL` 改为平台内 `/my-claw`（`target=_blank`） |
| `app/(dashboard)/app-marketplace/page.tsx` 「我的Claw」卡片 | `externalLink` 改为 `/my-claw`（新开页） |

除此链接目标外，不改这两页其它交互与样式。

### 3.2 路由表

`/my-claw` 使用独立 layout（类似现有 `/claw-hub-next/claws/*` 全屏策略），**不**挂 dashboard 顶栏/侧栏。

| 路径 | 模块 | 说明 |
|------|------|------|
| `/my-claw` | 新建会话 | 默认进入会话壳 |
| `/my-claw/chat` | 会话 | 可选 query：`sessionId`、`agentId` |
| `/my-claw/agents` | 智能体广场 | 新写 |
| `/my-claw/skills` | 技能 | 我的技能 / 技能广场双 Tab |
| `/my-claw/plugins` | 插件 | 我的插件 / 插件广场双 Tab |
| `/my-claw/automation` | 自动化任务 | 新写，list-page 样式 |
| `/my-claw/files` | 文件 | 复用 Workbench 文件 |
| `/my-claw/settings` | Claw 配置 | 模型配置 + Agent.md |
| `/my-claw/product` | 产品说明 | 迁工具调用状态说明 |

**不建路由：** `/my-claw/subagents`、`/my-claw/memory`。

### 3.3 左导结构

**主导航：** 新建会话、智能体广场、技能、插件、自动化任务  

**会话列表区：** 置顶、最近、自动化任务树（pin / 重命名 / 删除；样式对齐会话交互左栏）  

**底部：** 用户头像菜单（展示当前用户名；退出若平台无统一 logout API 则仅关闭菜单/占位，不迁会话交互 mock 登录）、设置齿轮  

**设置菜单：** 文件、Claw配置、产品说明（无记忆中心）

## 4. 会话壳与共用底座

### 4.1 三栏布局

1. **左栏** — 品牌「我的Claw」、搜索、主导航、会话列表、头像与设置  
2. **中栏** — 消息时间线、任务进程 dock、composer  
3. **右栏** — 可拖拽；概览：任务进程 / 会话文件 / 工具调用；文件预览 Tab  

研究多智能体模式下，右栏标题可切换为任务规划 / 产出物 / 工具（对齐会话交互）。

### 4.2 共用组件（Nexus 已有）

| 能力 | 复用来源 |
|------|----------|
| 时间线原子 | `components/claw-hub-next/conversation-timeline.tsx` |
| 主会话 + 右面板 | `components/claw-hub-next/interactive-chat-panel.tsx` |
| 输入框 / 技能 slash | `debug-chat-composer.tsx`、`skill-slash-picker.tsx` |
| 多智能体演示 | `research-multi-agent-debug-panel.tsx` 模式与事件能力 |

### 4.3 会话区唯一增量

在 composer 增加**智能体选择器**：

- 展示已召唤智能体列表，支持选中 / 取消  
- 「召唤其他智能体」→ 导航至 `/my-claw/agents`  
- 从广场召唤后写回 `summonedAgentIds` 并回到会话  

消息类型（用户、思考、澄清、计划、工具 HITL、技能、子代理、产物等）全部用 Nexus 时间线组件渲染；演示剧本从会话交互完整迁移。

## 5. 业务模块规格

### 5.1 智能体广场（新写）

- 功能对齐会话交互：来源 Tab（全部/收藏/组织）、类目筛选、最新/最热、卡片、召唤进会话。  
- 视觉对齐 Nexus CeCloud plaza（灰蓝底、卡片节奏）；修复原类别/Tab 视觉瑕疵。  
- **不丢功能**；特殊智能体（如 research-claw、pm-senior）行为对齐原型。

### 5.2 技能

- 保留 Tab：**我的技能** | **技能广场**。  
- **我的技能**：Workbench / 管理列表样式（非旧 Cloud Dialog 软卡片），能力含来源筛选、启用开关、删除（非内置）、配置、分页。  
- **技能广场**：在壳内嵌入 Nexus 技能广场（`SkillsPage` hub 能力）。优先通过向后兼容的 embed / `moduleView` props 复用；禁止破坏 `/skills`、`/skills-management` 现有行为。

### 5.3 插件

- 保留 Tab：**我的插件** | **插件广场**。  
- **我的插件**：Workbench 列表样式；类型覆盖 MCP / OpenAPI / workflow / ontology_action 等（对齐原型）。  
- **插件广场**：平台 `/tool-marketplace` 仍为 ComingSoon，故在 my-claw 内按技能广场视觉与会话交互功能重写一版市场页；后续平台广场就绪时可再切复用。

### 5.4 自动化任务（新写）

- 主区：任务列表 / 执行历史，CeCloud list-page 样式（对齐 `components/management/management-list.tsx` 节奏）。  
- 能力对齐原型：cron/轮询触发、Claw 选择、投递渠道、创建编辑、侧栏树同步。  
- 侧栏「置顶 / 最近 / 自动化」继续用 Cloud Dialog 左栏会话列表样式。

### 5.5 文件

- 复用 `components/claw-hub-next/detail/workspace-section.tsx`（`ClawWorkspaceSection`）。  
- 不使用会话交互 `FilesModule` UI。

### 5.6 Claw 配置

- 复用 Workbench 核心配置能力（`core-config-section` / 模型选择 / Agent.md 编辑器）。  
- **仅保留：** 模型配置 + **Agent.md**（与 Workbench `ClawCoreFileKey = "agent"` 对齐）。  
- **删除：** 组织记忆；不迁 SOUL.md / IDENTITY.md / USER.md 等多核心文件（除非后续 Workbench 扩展，本规格不包含）。

### 5.7 产品说明

- 迁移会话交互 `renderProductDocPage`：工具调用状态说明（阶段轨、请求/代码 Tab、approve/deny 演示）。

### 5.8 删除清单

| 原型模块 | 处理 |
|----------|------|
| 智能体 `subagents` | 不迁代码、不建导航 |
| 记忆中心 `memory` | 不迁代码、不建导航；配置中去掉组织记忆 |

## 6. 代码边界

### 6.1 新增

```
app/my-claw/
  layout.tsx                 # 全屏壳，无 dashboard chrome
  page.tsx                   # 默认会话
  chat/page.tsx
  agents/page.tsx
  skills/page.tsx
  plugins/page.tsx
  automation/page.tsx
  files/page.tsx
  settings/page.tsx
  product/page.tsx

components/my-claw/
  shell/                     # 左导、会话列表、设置菜单、布局
  chat/                      # 会话宿主 + 智能体选择器包装
  agents/                    # 智能体广场
  skills/                    # 双 Tab 宿主
  plugins/                   # 双 Tab 宿主
  automation/
  product/
  provider.tsx               # MyClawProvider

lib/mock/my-claw/
  sessions.ts                # 含差旅报销等演示剧本
  agents.ts
  skills.ts
  plugins.ts
  automation.ts
  ...
```

### 6.2 允许的最小平台改动

- 两处入口 URL 常量 / 链接目标。  
- 为技能广场等增加**向后兼容**的 embed props（默认行为不变）。  
- layout 中识别 `/my-claw` 为全屏路径（若放在 `(dashboard)` 外则可免改；优先放在 dashboard 外的 `app/my-claw`）。

### 6.3 禁止

- 重构或改写 `claw-detail-workbench.tsx` 业务逻辑以「顺带」支持个人模式。  
- 把会话交互的 `styles.css` / 整包 `app.js` 原样拷入。  
- 引入记忆中心或 subagents。

## 7. 数据流与状态

### 7.1 MyClawProvider

客户端上下文，至少包含：

- `activeModule` / 当前路由同步  
- `sessions`（置顶、最近）与 `activeSessionId`  
- `summonedAgentIds`、`selectedAgentId`  
- `automationTasks`（供侧栏树）  
- 右栏开关与宽度（可选持久化到 localStorage）

### 7.2 会话消息

- 结构对齐 Workbench timeline / `ConversationRunItem` 等既有类型。  
- 演示步进由 mock 驱动；键盘或 UI 步进行为对齐原型（若与底座冲突，以底座交互为准并保留剧本内容完整性）。

### 7.3 跨模块协作

- 智能体广场「召唤」→ 更新 `summonedAgentIds` → `router.push('/my-claw/chat')`。  
- 自动化任务变更 → 派发/回调刷新侧栏树。  
- 技能/插件「添加到我的」→ 更新对应 mine mock 列表。

## 8. 错误处理

- 未知 `sessionId`：回落默认会话，不白屏。  
- 嵌入技能/插件子视图失败：模块内空态 + 重试，左导可用。  
- 配置保存（mock）：成功提示；失败保留草稿并提示。  
- 无平台登录体系时的本地开发：直接可进 `/my-claw`（与现网 mock 管控端一致）。

## 9. 视觉与设计系统

- 壳与列表：CeCloud / Nexus B-end（品牌蓝 `#2773ff`、list-page、plaza-page 规范）。  
- 会话左栏列表：保留会话交互 Cloud Dialog 的信息密度与分组（置顶/最近/自动化）。  
- 广场页：灰蓝 shelf（`#e8f0fb` 系），与 `/skills-hub` 一致。  
- 不引入会话交互整包 CSS；按需用 Tailwind + 现有 token。

## 10. 验收清单

1. 两入口新开页进入 `/my-claw`，无平台顶栏/侧栏。  
2. 会话三栏可用；composer 有智能体选择器；演示时间线完整可走。  
3. 智能体广场筛选/排序/召唤功能不丢，Tab/类目无致命视觉瑕疵。  
4. 技能双 Tab：我的=Workbench 风；广场=Nexus hub 内嵌。  
5. 插件双 Tab：我的=Workbench 风；广场功能齐、视觉对齐 plaza。  
6. 自动化：list-page 主区 + 侧栏树。  
7. 文件=Workbench 文件；配置=模型+Agent.md，无组织记忆、无多余核心文件。  
8. 无「智能体」「记忆中心」入口；产品说明可打开。  
9. 改动范围符合 §6：无 Workbench 本体逻辑改写。

## 11. 源项目对照

| 会话交互 | Nexus my-claw |
|----------|----------------|
| `#chat` | `/my-claw`、`/my-claw/chat` |
| `#agents` | `/my-claw/agents` |
| `#skillhub` | `/my-claw/skills` |
| `#plugins` | `/my-claw/plugins` |
| `#automation` | `/my-claw/automation` |
| `#files` | `/my-claw/files` |
| `#clawconfig` | `/my-claw/settings` |
| `#product` | `/my-claw/product` |
| `#subagents`、`#memory` | **省略** |
| 源码根目录 | `/Users/nanbunan/Dev-Projects/会话交互` |

## 12. 实现顺序建议

1. 全屏 layout + 左导壳 + 路由骨架 + 两入口改链  
2. 会话宿主：接入 InteractiveChatPanel + 智能体选择器 + 演示数据  
3. 智能体广场  
4. 技能双 Tab（含 embed）  
5. 插件双 Tab  
6. 自动化任务  
7. 文件 + Claw 配置精简  
8. 产品说明  
9. 按 §10 手测验收  
