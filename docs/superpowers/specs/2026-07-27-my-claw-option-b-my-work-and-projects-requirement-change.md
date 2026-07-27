# My Claw 方案二需求变更：我的工作与项目

> 文档类型：需求变更 / Coding Agent 实现补充规格
> 变更主题：我的空间、个人 Chat、Project Chat、事项看板、Project 共享工具、全局 Inbox
> 规格日期：2026-07-27
> 适用代码库：`/Users/nanbunan/Dev-Projects/nexus-platform`
> 基础 PRD：`2026-07-27-my-claw-org-collaboration-option-b-coze-prd.md`
> 适用分支：`feat/my-claw-org-collaboration-coze-prototype`

---

## 0. 文档用途与优先级

本文用于覆盖并修正基础 PRD 中已经不再成立的产品判断。

若本文与基础 PRD 冲突，以本文为准；本文未提及的 Conversation、Inline Execution Status、Execution Detail Drawer、Agent Reply、文件与 Artifact、受控委派等机制继续沿用基础 PRD。

本次变更冻结四项结论：

1. 每个 Project 增加事项看板，事项由一个用户不可见的事项管家 Agent 辅助识别和组织。
2. 每个 Project 增加共享工具资源配置，资源直接挂在 Project 上，供 Project 内符合条件的 Agent 使用。
3. My Claw 使用端取消 Workspace 选择，只保留一个“我的空间”产品外壳，内部包含个人 Chat 和 Project Chat。
4. My Claw 使用端保留全局 Inbox，并增加“我的工作与项目”作为当前用户跨 Project 的个人视图。

---

## 1. 变更总览

### 1.1 旧模型

```text
My Claw
├── 个人空间
└── Workspace
    └── Project Chat ─ Project
```

基础 PRD 中：

- Project 按 Workspace 分组；
- Project 路由必须包含 `workspaceId`；
- Project 只有 Conversation；
- 不存在事项看板；
- Project 只能绑定 GitHub Repository 或 Local Directory；
- 插件、MCP、Workflow 等工具资源只能跟随 Agent。

### 1.2 新模型

```text
My Claw / 我的空间
├── Inbox
├── 我的工作与项目
├── 个人 Chat
│   └── 当前个人会话列表
└── Project Chat ─ Project
        ├── 会话（顶层会话）
        ├── 事项
        ├── 成员 = Human Members + Agents
        ├── Shared Tool Bindings
        ├── Files / Artifacts
        └── GitHub Repo / Local Directory
```

### 1.3 关键对象

| 对象 | 产品定位 |
|---|---|
| 我的空间 | My Claw 使用端的唯一产品外壳，不是组织、权限或资源继承层 |
| 个人 Chat | 当前个人会话列表与个人 Agent 使用场景 |
| Project Chat | 当前 Project 概念，Human 与 Agent 围绕长期目标协作 |
| Project Conversation | Project 的默认主界面与主要交互方式 |
| 事项 | 从 Conversation 中形成的长期工作台账，可跨多轮修改和验收 |
| Invocation | Agent 的一次技术执行 |
| Project-Agent Session | 同一个 Agent 在同一个 Project 中持续续接的执行上下文 |
| 共享工具 | 从已发布资源目录加入 Project 的工具类资源 |
| Inbox | 当前用户跨个人 Chat 与全部 Project 共用的事件入口 |
| 我的工作与项目 | 当前用户跨有权访问 Project 的个人聚合视图 |

---

## 2. 覆盖基础 PRD 的变更清单

| 基础 PRD 旧规则 | 新规则 |
|---|---|
| Workspace 是使用端可感知层级 | 使用端不展示 Workspace |
| Project 按 Workspace 分组 | Project Chat 使用一个扁平 Project 列表 |
| 存在工作上下文选择器 | 取消 Workspace / Project 上下文选择器 |
| 路由包含 `workspaceId` | Project 主路由只包含 `projectId` |
| Project 只有协作会话 | Project 增加“会话 / 事项”两个视图 |
| 不存在 Issue / 事项数据集合 | 正式增加 Project 事项集合 |
| Project 只绑定 Repo / Local Directory | 增加 Project Shared Tool Bindings |
| 插件 / MCP / Workflow 只能跟随 Agent | 已发布工具资源可额外绑定到 Project |
| Project Info 不承载工具配置 | Project Settings 增加“共享工具” |
| Inbox Item 必须包含 `workspaceId` | 使用端 Inbox 不要求 `workspaceId` |
| Workspace 决定 Project 成员来源 | Human 直接加入 Project |
| Workspace 决定可选 Agent / 资源 | 使用端从有权访问的已发布目录选择 |
| Provider 不得维护 Issue 集合 | Provider 必须维护 ProjectIssue 集合 |
| Project 不得创建第二视图 | 允许同页切换 Conversation / Issue Board |

保留不变：

- Project 根入口默认打开 Conversation；
- Human 通过普通消息和 `@` 与 Agent 交互；
- 每个 Project-Agent 只有一套持续 Session；
- 同一 Session 内 Invocation 串行；
- Inline Execution Status 仍然附着在触发消息下；
- Agent Reply 仍然直接回复原消息；
- Invocation completed 不等于事项完成；
- Human Review 仍然是完成事项的重要输入；
- Project 文件正文不自动全量注入 Agent 上下文；
- Agent 的基础模型、身份和默认 Capability 仍然跟随 Agent。

---

## 3. 开发端与使用端边界

### 3.1 Nexus Platform 开发端

继续负责：

- Workspace / Tenant；
- Agent 开发；
- Agent 配置；
- Skill、Plugin、MCP、Workflow、知识库等资产开发；
- 资源审核；
- Agent 和资源发布；
- 版本管理；
- 上架和下架；
- 使用授权；
- 运行监控与审计。

Workspace 可以继续存在于开发端的数据与管控体系中，但不得成为 My Claw 日常使用导航。

### 3.2 My Claw 使用端

负责：

- 个人 Chat；
- 创建和加入 Project；
- 邀请 Human；
- 添加已发布 Agent；
- 添加已发布工具资源；
- Project Conversation；
- 事项识别与管理；
- 文件和 Artifact；
- 我的工作与项目；
- 全局 Inbox。

### 3.3 资产进入 Project 的路径

```text
Nexus Platform
Agent / Tool Resource
        ↓ 发布并上架
Published Catalog
        ↓ 用户有权使用
My Claw Project
        ↓ 创建 Binding
Project Agent / Project Shared Tool
```

使用端不要求用户知道资产来自哪个 Workspace。

资产来源只作为：

- 发布方信息；
- 授权判断；
- 版本追踪；
- 审计字段；
- 下架与失效处理依据。

---

## 4. 我的空间信息架构

### 4.1 产品定义

“我的空间”是 My Claw 使用端的单一产品外壳。

它不代表：

- 开发 Workspace；
- 组织成员池；
- 权限继承层；
- 资源继承层；
- 一个可以切换的 Scope。

用户不需要切换“我的空间”，也不存在多个“我的空间”。

### 4.2 左侧导航

```text
我的Claw

Inbox                                      9
我的工作与项目

个人 Chat
  新建个人 Chat
  产品方案讨论
  科研多智能体
  安全话题

Project Chat
  新建 Project（+按钮）
  Claw 组织协作机制
  知识库 2.0
  科研项目协同
```

要求：

- 顶部只显示“我的空间”，不提供下拉选择；
- Inbox 和“我的工作与项目”是全局入口；
- 个人 Chat 直接复用当前会话列表；
- Project Chat 直接展示当前用户有权访问的 Projects；
- Project 不按 Workspace 分组；
- Project 支持搜索、置顶和最近排序；
- 不显示 Workspace 来源作为主导航信息；
- 资产来源可以在 Agent / Resource 详情中弱化展示；
- Project 很多时通过搜索、置顶和归档解决，不重新引入 Workspace。

### 4.3 个人 Chat

个人 Chat 对应当前 My Claw 会话列表。

保留：

- 新建会话；
- 历史会话；
- 会话重命名；
- 置顶；
- 删除 / 归档；
- 当前个人 Agent 使用体验。

个人 Chat 不自动进入 Project，也不自动形成事项。

### 4.4 Project Chat

Project Chat 对应当前 Project 概念。

每个 Project：

- 有一个顶层公开 Conversation；
- 有一个事项看板；
- 有直接加入的 Human；
- 有Agents；（此处Agent指的是用户的个人Claw或者管控端已经发布的claw和多智能体，下若出现Agents Binding，同此处含义）
- 有 Project Shared Tool Bindings；
- 有 Project Instructions；
- 有文件、Artifact、Repo 和 Local Directory；
- 不依赖使用端 Workspace。

### 4.5 路由

新路由：

```text
/my-claw
/my-claw/inbox
/my-claw/work
/my-claw/chat?session=[sessionId]
/my-claw/projects/[projectId]
```

Project 视图使用 query：

```text
/my-claw/projects/[projectId]?view=conversation
/my-claw/projects/[projectId]?view=issues
```

Deep Link：

```text
/my-claw/projects/[projectId]?view=conversation&message=[messageId]
/my-claw/projects/[projectId]?view=issues&issue=[issueId]
```

旧路由：

```text
/my-claw/workspaces/[workspaceId]/projects/[projectId]
```

必须兼容重定向到：

```text
/my-claw/projects/[projectId]
```

重定向后不得继续在 UI 中显示 Workspace。

---

## 5. Project 页面

### 5.1 默认视图

Project 根路由默认打开 Conversation：

```text
/my-claw/projects/[projectId]
→ view=conversation
```

Conversation 仍然是 Project 的主要交互方式。

### 5.2 Header

```text
Project Name
[会话] [事项]

Human 3 · Agent 5 · 项目工具 4 · 文件
[添加成员] [Project 设置]
```

要求：

- “会话 / 事项”使用同页 Tab 或 Segmented Control；
- 切换视图不销毁 Conversation 状态；
- 返回 Conversation 后恢复滚动位置；
- 文件、成员、Project 设置继续使用右侧 Drawer；
- 事项详情优先使用 Drawer；
- Project 根入口不得先进入概览页。

### 5.3 Project Settings Drawer

分组：

```text
基础信息
  名称
  描述
  Project Instructions

成员
  Human
  Agent

共享工具
  已绑定工具
  添加工具
  权限与状态

工作源
  GitHub Repository
  Local Directory

危险操作
  归档 Project
```

不显示：

- Workspace 切换；
- Workspace 成员继承；
- 套餐升级；
- 开发端资产编辑；
- Agent 核心 Prompt 编辑；
- 资源发布和审核。

---

## 6. Project 事项

### 6.1 产品定位

事项是一项需要持续跟踪、可能经过多轮 Human-Agent 交互、最终需要形成结论或交付的工作台账。

事项不是：

- 任意一条 `@Agent` 消息；
- 一次 Invocation；
- 一条 Agent Reply；
- 一次工具调用；
- 消息已读状态。

### 6.2 识别标准

事项通常具有：

- 明确工作对象；
- 明确或可推断的预期结果；
- Human / Agent 责任人；
- 需要持续推进；
- 可能需要澄清、修改或验收；
- 需要在全局视角中被追踪。

示例：

| 消息 | 默认判断 |
|---|---|
| `@Agent hi` | 不创建事项 |
| `@Agent 你怎么看这个方案？`，且引用具体方案 | 创建或建议创建“方案审阅”事项 |
| `@Agent 帮我调研 Coze 并输出报告` | 创建事项 |
| `@Agent 帮我看看`，没有对象 | 暂不创建，建议澄清 |
| `把刚才的审阅再补充风险分析` | 关联原事项并更新要求 |

### 6.3 事项与 Conversation

```text
Project Conversation
├── Message A
│   └── Issue 识别起点
├── Message B
│   └── 关联同一 Issue
├── Agent Reply
│   └── 候选交付
├── Human 返工
│   └── 更新 Issue
└── Human 接受
    └── Issue 完成
```

一个事项可以关联：

- 多条 Human Message；
- 多条 Agent Reply；
- 多个 Agent；
- 多次 Invocation；
- 多个 Artifact；
- 多轮返工；
- 一次最终验收。

### 6.4 状态

```ts
export type ProjectIssueStatus =
  | "clarifying"
  | "in_progress"
  | "waiting_for_human"
  | "in_review"
  | "changes_requested"
  | "blocked"
  | "done"
  | "cancelled"
  | "archived";
```

状态语义：

| 状态 | 说明 |
|---|---|
| Clarifying | 工作对象、目标或预期结果仍需澄清 |
| In Progress | Human 或 Agent 正在推进 |
| Waiting for Human | 等待 Human 补充信息、授权或决策 |
| In Review | Agent 或 Human 已提交候选结果，等待验收 |
| Changes Requested | 验收人提出修改要求 |
| Blocked | 因依赖、权限或 Runtime 问题无法推进 |
| Done | Human 明确接受结果 |
| Cancelled | Human 明确取消 |
| Archived | 从活跃看板移出但保留记录 |

核心规则：

- Agent 普通回复不自动进入 Done；
- 消息已读不改变事项状态；
- Agent 请求信息可以进入 Waiting for Human；
- Agent 提交候选结果进入 In Review；
- Human 要求返工进入 Changes Requested；
- 新一轮执行开始进入 In Progress；
- 只有 Human 明确接受才能进入 Done；
- 归档不是删除。

### 6.5 看板

Project 事项视图默认使用看板：

```text
待澄清或审批确认
进行中
等待反馈
待验收
已完成
执行失败
```

`Changes Requested` 默认进入“进行中”，同时显示“返工”标识。

`Waiting for Human` 与 `Blocked` 进入“等待反馈”，并显示具体等待对象或阻塞原因。

若等待对象包含当前用户，卡片额外显示“等待我”。

`Cancelled` 与 `Archived` 默认在筛选器中查看，不占主看板列。

卡片显示：

- 事项标题；
- 状态；
- 来源消息摘要；
- 责任 Human / Agent；
- 所属 Project；
- 最新进展；
- Artifact 数；
- 关联 Invocation 状态；
- 最后更新时间；
- 是否等待当前用户。

卡片操作：

- 打开详情；
- 回到源消息；
- 修改标题；
- 修改责任人；
- 修改状态；
- 接受结果；
- 要求返工；
- 取消；
- 归档。

### 6.6 事项详情 Drawer

展示：

```text
标题与状态
工作目标
预期结果 / 验收标准
责任 Human / Agent

关联消息
关联 Invocation
Artifact
状态变化记录
事项管家建议
```

点击关联消息：

1. 关闭 Drawer；
2. 切换到 Conversation；
3. 定位并高亮消息；
4. 保留事项详情返回入口。

---

## 7. 隐形事项管家 Agent

### 7.1 产品定位

事项管家是系统内部的 Issue Steward。

它负责：

- 识别消息是否形成事项；
- 判断消息属于新事项还是已有事项；
- 生成事项标题和摘要；
- 建议状态变更；
- 识别返工、阻塞、候选交付与验收；
- 发现重复事项并提出合并建议；
- 为“我的工作与项目”生成可读摘要。

### 7.2 用户不可感知边界

事项管家：

- 不出现在 Project Agent 成员列表；
- 不显示头像；
- 不允许被 `@`；
- 不占用 Project Agent 数量；
- 不出现在 Session 列表；
- 不以普通消息回复 Conversation；
- 不拥有 Project Agent Capability；
- 不参与实际任务执行；
- 不决定 Human / Agent Session 路由。

它只通过轻量前端提示被感知。

示例：

```text
已创建事项：审阅组织协作方案
[查看] [撤销] [改为不跟踪]
```

```text
已关联到事项：审阅组织协作方案
[改为新事项]
```

```text
建议将事项更新为“待验收”
[确认] [忽略]
```

### 7.3 运行机制

```text
Conversation Event
        ↓
Issue Steward 分析
        ↓
Issue Mutation Proposal
        ↓
Issue Service 校验
        ↓
ProjectIssue / Board / Inbox
```

事项管家不能直接写数据库。

它只能输出结构化提案：

```ts
export interface IssueMutationProposal {
  id: string;
  projectId: string;
  action:
    | "create"
    | "append"
    | "update"
    | "merge"
    | "complete"
    | "cancel"
    | "archive"
    | "none";
  targetIssueId?: string;
  proposedTitle?: string;
  proposedSummary?: string;
  proposedStatus?: ProjectIssueStatus;
  proposedHumanAssigneeIds?: string[];
  proposedAgentAssigneeIds?: string[];
  evidenceMessageIds: string[];
  confidence: number;
  reason: string;
  requiresConfirmation: boolean;
  createdAt: string;
}
```

Issue Service 负责：

- Schema 校验；
- Project 权限校验；
- 消息归属校验；
- 事项去重；
- 幂等；
- 乐观锁；
- 状态机校验；
- 实际数据写入；
- 审计记录。

### 7.4 自动化等级

| 操作 | 机制 |
|---|---|
| 识别候选事项 | 自动 |
| 生成标题和摘要 | 自动，可修改 |
| 高置信度新建事项 | 自动创建，并提供撤销 |
| 将消息追加到已有事项 | 自动关联，并允许改为新事项 |
| Artifact / Invocation 关联 | 系统事件自动关联 |
| 建议进入 Waiting / Review / Blocked | 自动建议 |
| 修改责任人 | Human 确认 |
| 合并事项 | Human 确认 |
| 标记 Done | Human 明确接受 |
| 取消 / 归档 | Human 确认 |
| 硬删除 | 不支持 |

### 7.5 Human 手动操作

Human 不依赖事项管家也可以完成 CRUD。

入口：

- 消息菜单“创建事项”；
- 消息菜单“关联事项”；
- 事项看板“新建事项”；
- 事项详情编辑；
- Agent Reply 的“创建 / 关联事项”；
- 前端提示中的确认、撤销和纠正。

原型阶段不增加专门的事项管理对话。

未来可以增加自然语言入口，但它只能调用同一个 Issue Service，不能成为事项数据的唯一管理方式。

### 7.6 范围与隔离

- 事项管家按 Project 读取消息和事项；
- 不跨 Project 合并事项；
- 不读取 Agent 私有 Session；
- 不读取其他 Project 文件；
- 只使用 Project 中公开的消息、Artifact 和状态事件；
- 当前用户无权查看的事项不得进入其“我的工作与项目”。

---

## 8. Project-Agent Session

### 8.1 单一 Session 规则

每个 Project 与每个 Agent 只有一个默认持续 Session：

```text
Project × Agent = Project-Agent Session
Project-Agent Session 1:N Invocation
```

不区分：

- 闲聊 Session；
- 工作 Session；
- Issue Session；
- Review Session。

事项只负责工作追踪，不决定 Session。

### 8.2 连续触发

- `@Agent hi` 进入同一 Session；
- `@Agent 你怎么看这个方案` 进入同一 Session；
- `@Agent 帮我写 PRD` 进入同一 Session；
- 不同时间再次 `@` 默认续接同一 Session；
- Session 可以因 Runtime 重启而重新恢复，但用户不感知为新会话。

### 8.3 同一 Agent 同时被触发

同一个 Project-Agent Session 采用串行队列：

```text
Invocation A · Running
Invocation B · Queued
Invocation C · Queued
```

规则：

- 同一 `sourceMessageId + actorId` 只创建一次 Invocation；
- 当前 Invocation 未结束时，新 Invocation 进入队列；
- 不在同一 Session 中并行执行；
- Human 可以取消当前 Invocation；
- 取消后处理下一条；
- 队列顺序默认按触发时间；
- Project 事项优先级不直接重排 Runtime 队列，原型不做调度系统。

### 8.4 Invocation 上下文

每次执行按预算组装：

```text
Agent Identity / Default Capability
Project Instructions
Project Shared Tool Manifest
Project Work Source Manifest
Project-Agent Session Summary
Recent Project-Agent Messages
Current @ Message
Explicit Message / File References
Related Issue Summary（已识别时）
On-demand Retrieved Content
```

不注入：

- 全部 Project 历史；
- 全部文件正文；
- 全部事项；
- 其他 Agent 私有 Session；
- 其他 Project 的消息与资源。

事项识别未完成时不得阻塞 Agent Invocation。

---

## 9. Project 共享工具

### 9.1 产品定位

Project 共享工具是从已发布资源目录加入 Project 的工具类资源。

它回答：

> 当前 Project 额外允许成员 Agent 使用哪些已发布工具。

它不会修改已发布 Agent 本身的默认 Capability。

### 9.2 支持类型

原型支持：

```ts
export type ProjectSharedToolKind =
  | "workflow"
  | "plugin"
  | "mcp"
  | "ontology_action";
```

GitHub Repository 和 Local Directory 继续作为 Work Source，不并入工具列表。

Project Files / Artifacts 继续作为 Project 公共内容，不并入工具列表。

知识库是否作为 Project Shared Resource 不在本次 P0 变更内；若后续加入，必须作为独立资源类型处理。

### 9.3 与 Agent 默认 Capability 的关系

```text
Agent 有效工具
= Agent 发布版本默认工具
+ Project Shared Tool Bindings
- 不兼容工具
- 无权限工具
- 不可用连接
```

规则：

- Agent 默认资源继续跟随 Agent；
- Project 工具只在当前 Project 生效；
- 同一个 Agent 在不同 Project 可以拥有不同有效工具；
- Project 绑定不回写 Agent 发布版本；
- Agent 离开 Project 后不再获得 Project 工具；
- Project 移除工具后，后续 Invocation 不再加载；
- 已完成 Invocation 保留当时使用工具的审计记录。

### 9.4 添加流程

```text
Project Settings
→ 共享工具
→ 添加工具
→ 已发布资源目录
→ 搜索 / 筛选
→ 查看兼容性与权限
→ 选择连接与访问级别
→ 添加到 Project
```

列表显示：

- 名称；
- 类型；
- 发布方；
- 版本；
- 描述；
- 适用场景；
- 授权状态；
- Runtime 兼容性；
- 已加入哪些 Agent 的有效能力；
- 是否需要额外 Credential。

### 9.5 权限

Project Tool Binding 记录：

- Project；
- Published Resource Version；
- read / execute / write；
- Credential Reference；
- 授权人；
- 授权时间；
- 状态；
- 兼容 Agent；
- 失效原因。

不得：

- 将明文 Credential 写入 Project；
- 因 Project 绑定自动绕过用户授权；
- 将工具开放给 Runtime 不兼容的 Agent；
- 将未上架资源直接加入 Project；
- 因资源下架删除历史 Invocation 审计。

### 9.6 下架与版本

- 新增 Binding 默认锁定发布版本；
- 发布方升级时 Project 显示“有新版本”；
- 原型不自动升级；
- 资源下架后禁止新 Project 添加；
- 既有 Binding 显示 degraded 或 revoked；
- 强制撤销时后续 Invocation 不加载；
- 历史记录继续显示原资源名称和版本。

### 9.7 UI

Project Settings Drawer 增加：

```text
共享工具 · 4

需求分析工作流         Workflow     可用
GitHub MCP             MCP          3/5 Agent 兼容
网页检索插件           Plugin       可用
审批动作               Ontology     需要授权

[添加共享工具]
```

Agent 详情中展示两组：

```text
Agent 默认能力
Project 共享工具
```

Execution Detail Drawer 展示本次 Invocation 实际使用的：

- Agent 默认工具；
- Project 共享工具；
- 版本；
- Credential 来源类型；
- 调用事件。

---

## 10. 我的工作与项目

### 10.1 产品定位

“我的工作与项目”是当前用户跨自己有权访问 Project 的个人读取视图。

它不是：

- 组织管理看板；
- 全租户项目总览；
- 新的协作空间；
- Agent 执行上下文；
- 另一个事项数据源。

### 10.2 给谁看

每个 Human 看到自己的视图。

默认聚合：

- 指派给当前 Human 的事项；
- 当前 Human 创建或关注的事项；
- 指派给其个人 Claw 的事项；
- 等待当前 Human 验收的事项；
- 当前 Human 发起但执行失败的工作；
- 当前 Human 所属 Project 中与其相关的新交付；
- 当前用户有权访问的 Project 列表。

不聚合：

- 无权访问的 Project；
- 其他 Agent 私有 Session；
- 与当前用户无关的全部组织事项；
- 全量 Project Conversation。

### 10.3 页面

```text
我的工作与项目

需要我处理
  等待验收 3
  执行失败 1
  等待授权 2

进行中
  我的 Agent 正在处理 4

最近交付
  已接受 5
  新增 Artifact 3

我的 Projects
  Claw 组织协作机制
  知识库 2.0
  科研项目协同
```

点击工作项：

- 进入目标 Project；
- 根据内容打开 Conversation 或 Issue Drawer；
- 定位源消息或事项；
- 不经过 Workspace。

### 10.4 产生机制

页面本身是固定入口。

内容由确定性事件投影：

- 事项创建；
- 事项责任人变化；
- 事项状态变化；
- Invocation queued / running / failed；
- Agent 提交候选结果；
- Human 接受 / 返工；
- Artifact 发布；
- Project 邀请。

事项管家可以生成标题和摘要，但不能改变确定性状态。

原型不实现定时日报或主动推送摘要。

---

## 11. 全局 Inbox

### 11.1 产品定位

Inbox 是当前用户跨个人 Chat 和全部 Project 的统一事件入口。

它与“我的工作与项目”的区别：

| Inbox | 我的工作与项目 |
|---|---|
| 按时间排列的事件流 | 按工作状态组织的聚合视图 |
| 强调未读和通知 | 强调当前责任与进展 |
| 每条事件有来源 | 每张卡对应事项或 Project |
| 处理后可标记已读 | 状态由业务事件决定 |

### 11.2 事件类型

```ts
export type GlobalInboxEventType =
  | "human_mentioned"
  | "personal_chat_reply"
  | "project_invitation"
  | "project_member_changed"
  | "issue_created"
  | "issue_assigned"
  | "issue_needs_confirmation"
  | "issue_waiting_for_human"
  | "issue_review_ready"
  | "issue_changes_requested"
  | "issue_completed"
  | "agent_reply_ready"
  | "agent_execution_failed"
  | "project_tool_authorization_required"
  | "project_tool_degraded"
  | "artifact_published";
```

### 11.3 Inbox Item

携带：

- `userId`；
- `sourceType`；
- `projectId?`；
- `personalSessionId?`；
- `messageId?`；
- `issueId?`；
- `invocationId?`；
- `artifactId?`；
- `projectToolBindingId?`；
- 标题；
- 摘要；
- 时间；
- 未读状态；
- Deep Link。

不要求：

- `workspaceId`；
- Workspace Route；
- Workspace 名称。

### 11.4 Deep Link

| 事件 | 目标 |
|---|---|
| 个人 Chat 回复 | 个人 Chat 会话 |
| Human mention | Project Conversation 消息 |
| 事项指派 | Project Issue Drawer |
| 待验收 | Project Issue Drawer 或 Agent Reply |
| Agent 失败 | Conversation 消息并打开 Execution Drawer |
| 工具授权 | Project Settings / Shared Tools |
| Artifact | 文件详情或来源消息 |

### 11.5 未读

- 未读是用户级状态；
- 切换 Project 不清空；
- 阅读一个事件不改变事项状态；
- 阅读待验收通知不等于接受；
- 支持全部已读；
- 支持按个人 Chat / Project / Issue 筛选。

---

## 12. 核心数据模型

```ts
export interface MyClawProject {
  id: string;
  name: string;
  description: string;
  instructions: string;
  status: "active" | "archived";
  ownerUserId: string;
  threadId: string;
  humanMemberIds: string[];
  agentBindingIds: string[];
  sharedToolBindingIds: string[];
  workSourceIds: string[];
  fileNodeIds: string[];
  issueIds: string[];
  createdAt: string;
  updatedAt: string;
  originWorkspaceId?: string;
}

export interface ProjectAgentBinding {
  id: string;
  projectId: string;
  actorId: string;
  publishedAgentVersionId?: string;
  bindingType:
    | "personal_claw"
    | "published_agent"
    | "published_multi_agent";
  status: "active" | "degraded" | "revoked";
  addedByUserId: string;
  createdAt: string;
}

export interface ProjectIssue {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  status: ProjectIssueStatus;
  sourceMessageId?: string;
  relatedMessageIds: string[];
  humanAssigneeIds: string[];
  agentAssigneeIds: string[];
  invocationIds: string[];
  artifactIds: string[];
  acceptanceCriteria: string[];
  waitingForCurrentUser?: boolean;
  createdBy:
    | { kind: "human"; id: string }
    | { kind: "issue_steward"; id: string };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  archivedAt?: string;
  revision: number;
}

export interface ProjectSharedToolBinding {
  id: string;
  projectId: string;
  publishedResourceVersionId: string;
  kind: ProjectSharedToolKind;
  displayName: string;
  permission: "read" | "execute" | "write";
  credentialRef?: string;
  compatibleActorIds: string[];
  status:
    | "active"
    | "authorization_required"
    | "degraded"
    | "revoked";
  addedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAgentSession {
  id: string;
  projectId: string;
  threadId: string;
  actorId: string;
  status: "active" | "paused" | "expired" | "error";
  invocationIds: string[];
  queuedInvocationIds: string[];
  lastSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface MyWorkProjection {
  userId: string;
  attentionIssueIds: string[];
  runningIssueIds: string[];
  recentDeliveryIssueIds: string[];
  projectIds: string[];
  updatedAt: string;
}

export interface GlobalInboxItem {
  id: string;
  userId: string;
  eventType: GlobalInboxEventType;
  sourceType: "personal_chat" | "project" | "issue" | "agent" | "tool";
  projectId?: string;
  personalSessionId?: string;
  messageId?: string;
  issueId?: string;
  invocationId?: string;
  artifactId?: string;
  projectToolBindingId?: string;
  title: string;
  summary: string;
  href: string;
  read: boolean;
  createdAt: string;
}
```

`originWorkspaceId` 仅允许作为开发端来源与迁移兼容字段，不参与 My Claw 导航、成员继承或资源继承。

---

## 13. Provider Actions

```ts
interface MyClawCollaborationActions {
  openPersonalChat(sessionId: string): void;
  openProject(projectId: string): void;
  setProjectView(view: "conversation" | "issues"): void;

  sendProjectMessage(payload: {
    projectId: string;
    content: string;
    mentionedHumanIds: string[];
    mentionedActorIds: string[];
    quotedMessageIds: string[];
    fileIds: string[];
  }): void;

  createIssue(payload: {
    projectId: string;
    sourceMessageId?: string;
    title: string;
    humanAssigneeIds: string[];
    agentAssigneeIds: string[];
  }): void;
  updateIssue(
    issueId: string,
    patch: Partial<Pick<
      ProjectIssue,
      | "title"
      | "summary"
      | "status"
      | "humanAssigneeIds"
      | "agentAssigneeIds"
      | "acceptanceCriteria"
    >>
  ): void;
  linkMessageToIssue(issueId: string, messageId: string): void;
  acceptIssue(issueId: string): void;
  requestIssueChanges(issueId: string, feedback: string): void;
  cancelIssue(issueId: string): void;
  archiveIssue(issueId: string): void;

  applyIssueProposal(proposalId: string): void;
  dismissIssueProposal(proposalId: string): void;
  undoIssueProposal(proposalId: string): void;

  addPublishedAgent(
    projectId: string,
    publishedAgentVersionId: string
  ): void;
  removeProjectAgent(bindingId: string): void;

  bindSharedTool(payload: {
    projectId: string;
    publishedResourceVersionId: string;
    permission: "read" | "execute" | "write";
    credentialRef?: string;
  }): void;
  unbindSharedTool(bindingId: string): void;
  resolveSharedToolAuthorization(
    bindingId: string,
    credentialRef: string
  ): void;

  markInboxRead(itemId: string): void;
  markAllInboxRead(): void;
}
```

必须保证：

- 不从 UI Scope 推断 Workspace；
- 创建 Project 不要求选择 Workspace；
- 添加 Human 不要求其是 Workspace Member；
- 添加 Agent / Tool 必须来自当前用户可访问的发布目录；
- 一个 Project-Agent 只有一个默认持续 Session；
- 同一 Session 的 Invocation 串行；
- 事项管家不能直接写 ProjectIssue；
- Issue Service 拒绝非法状态流转；
- Human 已读不能把事项标记 Done；
- Inbox 已读不能改变事项状态；
- Project 共享工具不修改 Agent 默认 Capability。

---

## 14. 组件与代码影响

### 14.1 路由

新增：

```text
app/my-claw/work/page.tsx
app/my-claw/projects/[projectId]/page.tsx
```

保留：

```text
app/my-claw/chat/page.tsx
app/my-claw/inbox/page.tsx
```

兼容：

```text
app/my-claw/workspaces/[workspaceId]/projects/[projectId]/page.tsx
```

旧路由只负责 redirect，不再渲染 Project 页面。

### 14.2 Shell

建议调整：

```text
components/my-claw/shell/my-claw-shell.tsx
components/my-claw/shell/sidebar.tsx
components/my-claw/shell/session-list.tsx
components/my-claw/shell/nav-items.ts
```

新增或重构：

```text
components/my-claw/shell/personal-chat-list.tsx
components/my-claw/shell/project-chat-list.tsx
components/my-claw/work/my-work-and-projects-page.tsx
```

废弃用户入口：

```text
components/my-claw/project-conversation/work-context-switcher.tsx
```

不得继续用隐藏 CSS 的方式保留 Workspace 选择器。

### 14.3 Project

新增：

```text
components/my-claw/project-conversation/project-view-tabs.tsx
components/my-claw/project-issues/project-issue-board.tsx
components/my-claw/project-issues/project-issue-column.tsx
components/my-claw/project-issues/project-issue-card.tsx
components/my-claw/project-issues/project-issue-detail-drawer.tsx
components/my-claw/project-issues/issue-steward-suggestion.tsx
components/my-claw/project-tools/project-shared-tools-section.tsx
components/my-claw/project-tools/add-project-tool-dialog.tsx
components/my-claw/project-tools/project-tool-row.tsx
```

复用：

```text
components/my-claw/project-conversation/shared/drawer-shell.tsx
components/my-claw/project-conversation/messages/*
components/my-claw/project-conversation/execution/*
components/my-claw/project-conversation/drawers/project-info-drawer.tsx
```

### 14.4 Mock

新增：

```text
lib/mock/my-claw/project-issues/
lib/mock/my-claw/project-tools/
lib/mock/my-claw/my-work/
lib/mock/my-claw/inbox/
```

Project Mock 不得再依赖 Workspace Mock 才能解析。

---

## 15. 必备 Mock 场景

### 15.1 我的空间

- 3 个个人 Chat；
- 3 个 Project Chat；
- 无 Workspace 分组；
- 一个置顶 Project；
- 一个归档 Project 不显示在默认列表。

### 15.2 事项识别

1. `@Agent hi`；
   - 有 Agent Reply；
   - 无事项提示；
   - 无事项创建。
2. `@Agent 你怎么看这个方案？` 并引用文件；
   - 事项管家创建“审阅方案”；
   - 显示撤销和查看；
   - 看板出现事项。
3. `再补充一下风险分析`；
   - 自动关联原事项；
   - 允许改为新事项。
4. Agent 提交结果；
   - 事项建议进入 In Review。
5. Human 要求返工；
   - 事项进入 Changes Requested；
   - 新 Invocation 排队。
6. Human 接受；
   - 事项进入 Done。

### 15.3 Session 队列

- 同一 Agent 第一次 Invocation running；
- 第二次触发 queued；
- 第一条完成后第二条开始；
- 取消第一条后第二条开始；
- 页面刷新恢复队列。

### 15.4 共享工具

- 4 个发布资源；
- Workflow active；
- MCP 仅部分 Agent 兼容；
- Plugin authorization required；
- Ontology Action revoked；
- 添加后在 Agent 有效工具中可见；
- 移除后新 Invocation 不再加载；
- 历史 Execution Detail 保留版本。

### 15.5 我的工作与项目

- 2 个需要处理；
- 2 个进行中；
- 2 个最近交付；
- 3 个 Projects；
- 每一项均可 Deep Link。

### 15.6 Inbox

- Project 邀请；
- Human mention；
- 事项指派；
- 待验收；
- Agent 失败；
- 工具授权；
- Artifact 发布；
- 全部已读。

---

## 16. 权限与隐私

- Project 是 My Claw 使用端的协作与访问边界；
- Human 必须直接成为 Project Member 才能读取 Conversation；
- Human 不需要成为来源 Workspace Member；
- 发布目录只返回当前用户可使用的 Agent 和资源；
- Project Agent 只能读取当前 Project 公开上下文；
- Project Shared Tool Credential 使用引用，不存明文；
- 事项管家只读取 Project 公开事件；
- “我的工作与项目”先按 Project ACL 过滤再聚合；
- Inbox 只向事件目标用户生成；
- 不因全局视图产生跨 Project 模型上下文；
- `originWorkspaceId` 不得暴露成使用端权限入口。

---

## 17. 错误与恢复

### 17.1 事项误识别

提示提供：

- 撤销；
- 改为不跟踪；
- 关联到其他事项；
- 改为新事项。

撤销事项创建不得删除源消息或 Invocation。

### 17.2 事项重复

事项管家可以建议合并，但必须由 Human 确认。

合并后：

- 保留两个事项的历史 ID；
- 合并关联消息和 Artifact；
- 原事项标记 merged / archived；
- 不删除历史。

### 17.3 工具不兼容

- 在绑定前展示兼容 Agent 数；
- 不兼容 Agent 不加载该工具；
- 不阻塞其他兼容 Agent；
- Execution Detail 标明未加载原因。

### 17.4 工具失效

- Project Settings 显示 degraded / revoked；
- 产生 Inbox；
- 使用该工具的 Invocation 失败时显示明确原因；
- 历史调用不删除。

### 17.5 旧路由

- 旧 Project Deep Link 必须 redirect；
- 保留 `messageId` / `issueId` query；
- 找不到 Project 时显示 Project 不可用；
- 不回退到 Workspace 首页。

---

## 18. 验收标准

### 信息架构

- [ ] My Claw 顶部只显示“我的空间”。
- [ ] 不存在 Workspace 选择器。
- [ ] Project 不按 Workspace 分组。
- [ ] 个人 Chat 使用当前会话列表。
- [ ] Project Chat 使用当前 Project 列表。
- [ ] Inbox 和“我的工作与项目”是全局入口。
- [ ] 创建 Project 不要求选择 Workspace。
- [ ] 旧 Workspace Project 路由可重定向。

### Project

- [ ] Project 根路由默认打开 Conversation。
- [ ] Project 支持“会话 / 事项”切换。
- [ ] 切换后 Conversation 状态不丢失。
- [ ] Project Header 显示 Human、Agent、共享工具和文件入口。
- [ ] Human 直接加入 Project。
- [ ] Agent 从已发布目录加入 Project。

### 事项

- [ ] 每个 Project 有事项看板。
- [ ] `@Agent hi` 不创建事项。
- [ ] 引用具体方案的审阅请求可以形成事项。
- [ ] 事项可关联多条消息和多个 Invocation。
- [ ] Agent Reply 不自动完成事项。
- [ ] 消息已读不改变事项状态。
- [ ] Human 接受后事项进入 Done。
- [ ] Human 返工后事项进入 Changes Requested。
- [ ] Human 可以手动创建、编辑、关联、取消和归档事项。
- [ ] 不支持硬删除。

### 事项管家

- [ ] 事项管家不出现在 Agent Member 列表。
- [ ] 事项管家不占 Agent 数量。
- [ ] 事项管家不产生用户可见 Session。
- [ ] 事项管家只输出 Mutation Proposal。
- [ ] Issue Service 执行权限与状态校验。
- [ ] 自动创建提供撤销。
- [ ] 自动关联提供“改为新事项”。
- [ ] Done、合并、取消和归档需要 Human 确认。

### Session

- [ ] 一个 Project-Agent 只有一个默认持续 Session。
- [ ] 不区分闲聊 Session 和工作 Session。
- [ ] 事项不决定 Session 路由。
- [ ] 同一 Session 的 Invocation 串行。
- [ ] 重复触发具有幂等保护。
- [ ] 第二次触发可以排队。
- [ ] 页面刷新恢复执行队列。

### 共享工具

- [ ] Project Settings 有共享工具区域。
- [ ] 支持 Workflow / Plugin / MCP / Ontology Action。
- [ ] 工具从已发布目录添加。
- [ ] Project Binding 不修改 Agent 默认 Capability。
- [ ] 同一 Agent 在不同 Project 可拥有不同有效工具。
- [ ] 不兼容 Agent 不加载工具。
- [ ] Credential 不以明文保存。
- [ ] 工具下架不删除历史审计。

### 我的工作与项目

- [ ] 页面仅展示当前用户有权访问的 Projects。
- [ ] 展示需要我处理、进行中和最近交付。
- [ ] 每一项可以 Deep Link。
- [ ] 页面不是 Agent 上下文。
- [ ] 不展示组织全部事项。
- [ ] 状态由确定性事件投影。

### Inbox

- [ ] Inbox 跨个人 Chat 和全部 Project。
- [ ] Inbox Item 不要求 `workspaceId`。
- [ ] 已读不改变事项状态。
- [ ] 支持 Project / Issue / Tool Deep Link。
- [ ] 未读在切换 Project 后保留。
- [ ] 支持全部已读。

### 工程

- [ ] TypeScript 编译通过。
- [ ] 目标文件 ESLint 通过。
- [ ] Production build 通过。
- [ ] 个人 Chat 无回归。
- [ ] Project Conversation 无回归。
- [ ] 1280px 无横向溢出。
- [ ] 旧 Deep Link 可兼容。
- [ ] 独立 Preview 可访问。

---

## 19. 推荐实施顺序

### 阶段 1：移除使用端 Workspace

- 重构 My Claw Shell；
- 拆分 Personal Chat List / Project Chat List；
- 新 Project Route；
- 旧 Route Redirect；
- 删除 Workspace Selector 用户入口。

验收：用户从“我的空间”直接进入个人 Chat 或 Project。

### 阶段 2：Project 数据去 Workspace 依赖

- MyClawProject；
- ProjectAgentBinding；
- 直接 Human Membership；
- Mock 迁移；
- Provider 调整。

验收：Project 不需要 Workspace Mock 即可打开。

### 阶段 3：Project 双视图

- Conversation / Issues Tabs；
- 状态保留；
- query Deep Link；
- Issue Drawer Shell。

验收：Project 默认会话，看板可切换。

### 阶段 4：事项模型与手动 CRUD

- ProjectIssue；
- 状态机；
- Issue Board；
- Issue Card；
- Issue Detail；
- 手动创建和更新；
- 消息关联。

验收：不依赖事项管家也能完整管理事项。

### 阶段 5：事项管家

- Proposal 模型；
- Mock 识别；
- 前端提示；
- 确认 / 撤销 / 纠正；
- Issue Service 校验；
- 审计事件。

验收：`hi` 不建事项，审阅和写作请求可建事项。

### 阶段 6：Session 串行队列

- 一个 Project-Agent Session；
- queued Invocation；
- 幂等；
- cancel；
- refresh restore。

验收：同一 Agent 连续触发不并行污染 Session。

### 阶段 7：Project 共享工具

- Published Tool Mock；
- ProjectSharedToolBinding；
- Add Tool Dialog；
- 兼容性；
- 授权状态；
- Effective Tool 展示。

验收：Project 工具只影响当前 Project。

### 阶段 8：我的工作与项目

- Event Projection；
- Attention；
- Running；
- Recent Delivery；
- Project List；
- Deep Link。

验收：当前用户能跨 Project 看清自己需要处理的工作。

### 阶段 9：Inbox

- 新事件类型；
- Personal / Project / Issue / Tool 来源；
- 未读；
- 全部已读；
- Deep Link。

验收：不经过 Workspace 即可进入目标。

### 阶段 10：回归与 Preview

- targeted lint；
- build；
- 核心 Mock 演示；
- 旧路由回归；
- 个人 Chat 回归；
- Preview 部署。

---

## 20. 非目标

本次不实现：

- 使用端 Workspace；
- Workspace 成员继承；
- Workspace 资源继承；
- 组织管理者跨租户总览；
- 独立事项管理对话；
- 事项管家直接写数据库；
- 事项硬删除；
- Agent Session 按事项拆分；
- 闲聊 / 工作 Session 路由；
- 同一 Project-Agent Session 并行执行；
- 复杂事项依赖；
- 子事项；
- 甘特图；
- Sprint；
- 工时；
- 截止时间调度；
- 自动资源版本升级；
- 明文 Credential；
- 真实 Marketplace 后端；
- 真实 Issue Steward Runtime；
- 真实 Agent Runtime。

---

## 21. 最终产品定义

> My Claw 使用端只有一个“我的空间”。用户在个人 Chat 中延续当前个人会话，在 Project Chat 中围绕 Project 与 Human、已发布 Agent 和 Project 共享工具协作。Project 默认以 Conversation 为主要交互方式，并通过事项看板沉淀需要长期追踪、多轮修改和 Human 验收的工作。事项管家 Agent 在后台识别和组织事项，但不参与任务执行，也不直接写数据。每个 Project-Agent 只保留一套持续 Session，Invocation 串行执行。Inbox 提供跨个人 Chat 和 Project 的统一事件入口，“我的工作与项目”则为当前用户提供跨 Project 的个人工作与进展视图。
