# My Claw 交互设计：左侧会话 / Project 分离与 Project 概览

> 文档类型：交互设计 / Coding Agent 实现规格  
> 日期：2026-07-29  
> 适用分支：`feat/my-claw-project-multi-conversation`（或后续独立交互分支）  
> 基础规格：`2026-07-29-my-claw-project-multi-conversation-prototype-change-spec.md`  
> 状态：已确认方向（用户选择 A：单击 Project 进入概览）

---

## 0. 目标与边界

### 0.1 要解决的问题

当前原型把 Project 当成聊天入口，导致：

1. 左侧「Project Chat」按 Project 罗列，会话被藏在 Project 内第二层；
2. Project Header 堆叠成员 / 工具 / 文件 / 会话信息，过于拥挤；
3. 新建会话的成员、工具选择交互不适合大规模列表；
4. 工具 / 技能未统一走 Cloud Workbench；
5. 文件操作入口生硬（单独「发布」按钮），会话文件 Mock 常为 0。

### 0.2 产品结论

```text
左侧「会话」= 聊天主入口（Conversation）
左侧「Project」= 项目经营入口（Overview / Board / Settings）
```

单击 Project → **直接进入 Project 概览页**（选项 A，已确认）。  
单击会话 → 进入会话消息页；会话页不再承载完整 Project 配置。

### 0.3 非目标（本次不做）

- 不恢复使用端 Workspace 选择器；
- 不引入真实后端 / 真实 Agent Runtime；
- 不重做个人 Chat；
- 不建设完整 Project 权限服务；
- 不建设文件版本管理；
- 不把「文件归属」做成事后可改的会话状态开关。

---

## 1. 左侧信息架构

### 1.1 区块顺序

```text
Inbox
我的工作与项目
个人 Chat
会话                          ← 新增/迁入：跨 Project 可见会话
Project                       ← 原「Project Chat」改名
```

### 1.2 「会话」区

- 列表项图标：沿用当前 Project Chat 使用的会话图标（如 `MessagesSquare`）。
- 数据范围：当前用户作为 Human 参与者、且未归档的全部 Project Conversation。
- 每项至少展示：
  - 会话名称；
  - 所属 Project 名称（副标题，避免重名混淆）；
  - 最近可见消息摘要；
  - 相对时间；
  - 未读 / 运行中状态（若有）。
- 排序：置顶 → 未读或运行中 → 最近更新。
- 点击：进入  
  `/my-claw/projects/[projectId]/conversations/[conversationId]`
- 不在会话区展示「供应商评估」等当前用户不可见会话。

### 1.3 「Project」区

- 区标题：`Project`（不再叫 Project Chat）。
- 区标题右侧：灰色小 `+` → **新建 Project**（原型可先用轻量表单 / 占位，但入口必须存在）。
- 列表项图标：文件夹类图标（如 `Folder`），不再用会话图标。
- 每项右侧：悬停或常显灰色小 `+` → **在该 Project 下新建会话**。
- 点击项目行主体（非 `+`）：进入 Project 概览  
  `/my-claw/projects/[projectId]`
- 仅展示 `status = active` 的 Project；归档项目不进默认列表。

### 1.4 与个人 Chat 的关系

- 个人 Chat 区块保持现有行为与视觉节奏。
- 「会话」区视觉节奏对齐个人 Chat（列表型聊天入口），但数据源是 Project Conversation。

---

## 2. 路由与默认进入规则

### 2.1 路由

| 路径 | 页面 |
|------|------|
| `/my-claw/projects/[projectId]` | Project 概览 |
| `/my-claw/projects/[projectId]/conversations/[conversationId]` | 会话消息页 |
| `/my-claw/projects/[projectId]?view=issues` | Project 事项看板 |
| `/my-claw/projects/[projectId]?view=files` | Project 文件（可选；也可作为概览内锚点） |

### 2.2 默认进入

1. 打开 `/my-claw/projects/[projectId]` → **停在概览**，不再自动 `replace` 到某个会话。
2. 从左侧「会话」或概览内会话入口进入具体会话。
3. 刷新会话 URL 时仍恢复该会话。
4. 路由变化时关闭右侧抽屉（已实现；保持）。

### 2.3 兼容

- 旧深链 `?issue=` / `?message=` 仍可用；若落在 Project 根路径且带 `view=issues`，打开看板并可打开 Issue Drawer。
- 带 `message=` 且无 `conversationId` 时：若能从消息反查会话，则跳到对应会话；否则留在概览并提示。

---

## 3. Project 概览页

### 3.1 布局原则

- 一页摊开 Project 经营信息，避免全部挤在会话 Header。
- 每块一个职责：说明、成员、工具、技能、文件、事项入口、会话入口。
- CeCloud B 端风格：白底、细边框、`#2773ff` 主色；不做营销风卡片堆叠。

### 3.2 区块内容

#### 顶部

- Project 名称 + 状态；
- 简短 description / brief（可编辑或只读展示，沿用现有更新能力即可）；
- 不在顶部横排堆满大按钮。

#### 成员

- **Human 一行**：重叠小头像（最多展示约 5–8 个，超出 `+N`）；
- **Agent 一行**：同样重叠小头像；
- 不把 Human / Agent 混成一排大块按钮；
- 行尾可有「管理」弱入口（打开现有成员 Drawer / 页内展开）。

#### 工具

- 展示 Project Shared Tools 列表（名称、类型、状态）；
- 右侧或标题旁灰色 `+`：打开 **Cloud Workbench `ToolConfigDialog`**；
- 可选类型仅：**MCP**、**OpenAPI**（即现有 `plugin` tab）；
- 来源语义：广场 / 可用目录（原型用 Workbench 现有目录；不引导「管控端管理」入口）；
- 确认后写入 Project Shared Tool Bindings。

#### 技能

- 新增 Project 级技能绑定展示（Mock：`ProjectSkillBinding`）；
- 标题旁 `+`：打开 **Cloud Workbench `SkillConfigDialog`**；
- **仅技能广场**：实现时扩展 `SkillConfigDialog` 支持 `plazaOnly`（或等价 prop），隐藏「技能管理」tab；
- 确认后写入 Project 技能绑定集合。

#### 文件

- 仅展示 `scope = "project"` 的文件；
- **路径式**展示（例如 `docs/订单导出 PRD.md`），不要只给扁平无结构列表；
- 每行右侧 `⋯` 菜单：
  - 下载（原型可 toast / 假下载）；
  - 同步到 Project 空间（对已是 Project 文件可禁用或显示「已在 Project」）；
- 去掉单独占一整行的「发布到 Project」主按钮形态。

#### 事项

- 概览内提供「打开事项看板」入口；
- 看板本身见第 5 节。

#### 会话

- 概览可列出本 Project 对当前用户可见的会话摘要（可选短列表）；
- 「新建会话」主入口：概览按钮 + Project 行内 `+` +（可选）会话区空态。

---

## 4. 会话页（Conversation）

### 4.1 Header 变轻

会话页 Header 只保留：

- 所属 Project 名称（弱）+ 会话名称（强）；
- 文件归属只读标签（创建时选定，不可改）；
- 轻量会话成员重叠头像；
- 会话文件入口；
- 会话设置（弱）。

不再在会话 Header 堆：Project 工具总数、Project 文件总数、大块「信息 / 添加」等经营控件。这些回到概览。

### 4.2 主体

- 左侧可保留本 Project 内会话列表（次要），但 **全局主入口是左侧壳层「会话」区**；
- 消息列表 + Composer；
- 消息菜单：创建事项 / 绑定未归属事项 / 引用已有事项（已有能力保留）。

### 4.3 会话文件

- 展示 `scope = "conversation"` 且 `sourceConversationId = 当前会话` 的文件；
- **必须有 Mock 数据**：至少「方案二需求讨论」「原型技术验证」「科研数据血缘」各有 ≥1 个会话文件（或明确的会话产出文件）；
- 「原型技术验证」继续体现会话私有文件；
- 文件行 `⋯`：
  - 下载；
  - 同步到 Project（调用既有 `publishArtifactToProject` / 等价动作）。

### 4.4 文件归属规则（冻结）

- 仅在 **创建会话** 时选择：`project`（默认）或 `conversation`；
- 创建后在会话设置 / Header **只读展示**；
- 不允许事后改默认归属；
- 历史文件 `scope` 不被批量改写；
- 会话私有文件可通过「同步到 Project」主动公开。

---

## 5. 事项看板

### 5.1 去掉看板顶栏

删除当前看板顶部的说明条（「Project 唯一事项看板 · …」）以及与之绑定的顶栏布局。

### 5.2 「新建事项」位置

将「新建事项」移出该顶栏，任选其一（实现选更轻的）：

- 看板右上角独立工具位；或
- 「待澄清」列头旁的小 `+`。

推荐：看板区域右上角小按钮，不占整行说明 Header。

### 5.3 Issue Drawer

- 保留主会话区块（可打开 / 未绑定 / 无权访问）；
- **先移除 Issue 详情中的 Invocation 段落**（本次明确要求先去掉）；
- 其它验收 / 负责人 / Artifact 保留。

---

## 6. 新建会话弹窗

### 6.1 字段

| 字段 | 交互 |
|------|------|
| 会话名称 | 必填输入 |
| 会话说明 | 可选 |
| Human 参与者 | **可搜索下拉多选**；创建者默认选中且不可移出；候选仅限 Project Human Members |
| 参与 Agent | **可搜索下拉多选**；个人 Agent 仅当其所属 Human 已在会话中可选；平台 Agent 来自 Project Agents |
| 工具 | 标签「工具」；`+` 打开 Workbench（MCP / OpenAPI） |
| 技能 | 标签「技能」；`+` 打开 Workbench 技能广场 |
| 文件归属 | 单选；创建后不可改；选项下保留说明文案 |

### 6.2 禁止

- 不再用一排可点 chip 作为 Human / Agent 的唯一选择方式；
- 不再用前 N 个工具的行内勾选列表冒充 Workbench。

---

## 7. Cloud Workbench 接入约定

### 7.1 工具

- 组件：`components/claw-hub-next/tool-config-dialog.tsx`
- `allowedKinds={["mcp", "plugin"]}`（UI 文案：MCP / OpenAPI）
- 用于：Project 概览添加工具、新建会话时会话工具、会话设置中的会话工具。

### 7.2 技能

- 组件：`components/claw-hub-next/skill-config-dialog.tsx`
- 扩展：`sourceMode?: "plaza" | "all"`（默认可保持现状；本次调用传 `plaza`）
- 用于：Project 概览添加技能、新建会话可选技能。

### 7.3 Mock 模型增量

```ts
interface ProjectSkillBinding {
  id: string;
  projectId: string;
  skillId: string;
  displayName: string;
  source: "plaza";
  status: "active" | "revoked";
  addedByUserId: string;
  createdAt: string;
}

interface ConversationSkillBinding {
  id: string;
  projectId: string;
  conversationId: string;
  skillId: string;
  displayName: string;
  source: "plaza";
  status: "active" | "revoked";
  addedByUserId: string;
  createdAt: string;
}
```

Provider 增加 `bindProjectSkill` / `unbindProjectSkill` / `bindConversationSkill` / `unbindConversationSkill`（命名可等价）。

---

## 8. 文件交互细节

### 8.1 行菜单

每个文件行右侧 `⋯`：

1. 下载  
2. 同步到 Project（仅 `scope = "conversation"` 时可用）

### 8.2 Project 文件页 / 概览文件区

- 用路径层级或 `path` 字段展示；
- Mock 为现有文件补全合理 path（如 `docs/...`、`data/...`）；
- Project 文件区不聚合会话私有文件。

### 8.3 会话文件 Mock 要求

至少：

- `conv-req-discussion`：≥1 个会话可见文件或可打开的会话产出（若默认归属为 project，则会话文件区可展示「本会话产生的 Project 文件」只读引用 **或** 额外补 1 个 conversation-scope 附件；优先补 conversation-scope，避免「会话文件 0」）；
- `conv-proto-verify`：保持 conversation-scope 文件 ≥1，并支持同步到 Project；
- `conv-lineage`：有血缘相关文件可点。

---

## 9. 组件与文件影响（建议）

### 9.1 壳层

- `components/my-claw/shell/sidebar.tsx`：接入会话区 + 改名 Project 区；
- `components/my-claw/shell/project-chat-list.tsx` → 重构为 `project-list.tsx`（Folder + 行内 +）；
- 新增 `components/my-claw/shell/conversation-chat-list.tsx`（跨 Project 会话列表）。

### 9.2 Project / 会话

- 新增 `components/my-claw/project-overview/project-overview-page.tsx`；
- 收敛 `project-conversation-header.tsx` 为会话轻 Header；
- 改造 `create-project-conversation-dialog.tsx`（搜索下拉 + Workbench）；
- 改造 `project-files-panel.tsx`（路径 + `⋯` 菜单）；
- 改造 `project-issue-board.tsx`（去顶栏说明）；
- 改造 `project-issue-detail-drawer.tsx`（移除 Invocation 段）。

### 9.3 路由

- `app/my-claw/projects/[projectId]/page.tsx`：渲染概览，不再自动跳会话；
- 会话路由保持 `.../conversations/[conversationId]/page.tsx`。

---

## 10. 验收标准

- [ ] 左侧存在「会话」与「Project」两个独立区块。
- [ ] 会话区列出跨 Project 可见会话；点击进入会话页。
- [ ] Project 区使用文件夹图标；点击进入概览，不自动进会话。
- [ ] Project 行内 `+` 可打开「在该 Project 新建会话」。
- [ ] Project 区标题 `+` 有新建 Project 入口。
- [ ] Project 概览中 Human / Agent 分行重叠头像。
- [ ] 概览工具 `+` 打开 Workbench，仅 MCP / OpenAPI。
- [ ] 概览技能 `+` 打开 Workbench，仅技能广场。
- [ ] 会话 Header 明显轻于现状，不再堆 Project 经营控件。
- [ ] 文件归属创建后只读。
- [ ] 事项看板无说明顶栏；仍能新建事项。
- [ ] Issue Drawer 不再展示 Invocation 段落。
- [ ] 至少一个会话的「会话文件」计数 > 0。
- [ ] 文件行 `⋯` 提供下载与同步到 Project。
- [ ] 换路由后右侧抽屉不会残留。

---

## 11. 实现优先级

1. 左侧 IA：会话列表 + Project 列表（Folder / +）  
2. Project 概览页 + 根路由不再自动进会话  
3. 会话 Header 瘦身  
4. 新建会话：搜索下拉 + Workbench 工具/技能  
5. 文件路径 / `⋯` 菜单 + 会话文件 Mock  
6. 事项看板去顶栏 + Issue 去 Invocation  

---

## 12. 已确认决策记录

| 决策点 | 结论 |
|--------|------|
| 单击 Project | 直接进概览（A） |
| 会话与 Project 左侧分离 | 是 |
| 工具选择 | Cloud Workbench；MCP + OpenAPI |
| 技能选择 | Cloud Workbench；仅广场 |
| 文件归属 | 创建时选定，之后只读 |
| 看板顶栏说明 | 删除 |
| Issue Invocation 段 | 先删除 |
