# 管控端记忆管理 P0 设计规格

## 1. 目标

在现有 Nexus 管控端新增可演示的记忆管理模块，覆盖 Memory Store 的创建、浏览与人工维护，Dreaming 的创建、Diff 审核与版本应用，以及 Claw 对自带记忆和外接记忆的配置。

本轮以两份 PRD 中标注的 P0 Demo 为边界，使用前端 Mock 数据提供完整交互，不建设真实后端或持久化接口。

## 2. 产品原则

- 所有记忆统一为 Memory Store；Claw 即使不挂载共享 Store，也拥有自带 C Store 和用户侧 U Store。
- U Store 内容对管控端不可见，只显示用户数与条目规模。
- 自带 C Store 可查看、编辑和 Dreaming，但不可删除，也不可挂载给其他 Claw。
- 共享 Store 默认以 `propose_only` 挂载；`read_write` 必须二次确认。
- Store 的 Dreaming 结果形成新版本，旧版本保留，应用前必须展示 Diff。
- 管控端视觉复用现有 CeCloud 管理页：白底、紧凑表格、品牌蓝主操作、4-6px 圆角、低饱和状态色。

## 3. 信息架构

### 3.1 左侧导航

在现有“知识”组中新增一级菜单“记忆”，入口为 `/memory-management`。页面内部包含：

- 记忆库：默认 Tab。
- Dreaming：任务管理 Tab。

### 3.2 页面路由

| 路由 | 页面 |
|---|---|
| `/memory-management` | 记忆库列表与 Dreaming 任务列表 |
| `/memory-management/stores/[storeId]` | Memory Store 详情 |
| `/memory-management/dreaming/[jobId]` | Dreaming 任务详情 |
| `/claw-hub-next/claws/[clawId]` | 现有 Claw 详情中的“记忆”配置 |

## 4. 数据模型

### 4.1 Memory Store

```ts
type MemoryStoreType = "shared" | "fork" | "builtin_c";

interface MemoryStore {
  id: string;
  name: string;
  description: string;
  type: MemoryStoreType;
  entryCount: number;
  tokenCount: number;
  currentVersion: number;
  mountCount: number;
  pendingCandidateCount: number;
  lastDreamingAt?: string;
  updatedBy: string;
  updatedAt: string;
  files: MemoryFileNode[];
  versions: MemoryVersion[];
}
```

### 4.2 Dreaming

```ts
type DreamJobStatus =
  | "queued"
  | "running"
  | "pending_review"
  | "applied"
  | "dismissed"
  | "failed";

interface DreamJob {
  id: string;
  name: string;
  storeId: string;
  sessionScope: "since_last" | "time_range" | "manual";
  sessionCount: number;
  prompt?: string;
  modelTier: "standard" | "advanced";
  status: DreamJobStatus;
  tokenUsage: number;
  diffFiles: MemoryFileDiff[];
}
```

### 4.3 Claw 记忆配置

```ts
type MountAccess = "read_only" | "propose_only" | "read_write";

interface ClawMemoryMount {
  storeId: string;
  access: MountAccess;
  usagePrompt: string;
}
```

配置同时包含会话级提取、`context_pack`、`memory_suggestions` 三个开关。

## 5. 页面设计

### 5.1 记忆库列表

沿用管理列表的标题、工具栏、表格和分页结构。

功能：

- 按 Store 名称或描述搜索。
- 按类型筛选。
- 筛选是否存在待审候选。
- 创建 Memory Store。
- 行操作：详情、Dreaming、删除。
- 自带 C Store 禁止删除和被其他 Claw 挂载。

创建弹窗字段：

- 名称，必填。
- 描述。
- 初始化方式：空白、模板、导入 Markdown。
- 根据初始化方式显示模板或上传区域。

创建成功后加入当前前端状态并跳转详情页。

### 5.2 Store 详情

顶部展示返回入口、名称、版本、类型、挂载数量和“发起 Dreaming”按钮。

P0 主体为“记忆文件”Tab：

- 左侧树展示 `INDEX.md`、`entities/`、`decisions/`、`lessons/` 等节点。
- 右侧显示 Markdown 内容。
- 支持预览/编辑切换、保存、新增文件、删除文件。
- 自带 C Store 同样允许人工编辑。

为 P0 的版本操作提供轻量入口：

- 展示版本号、产生方式和时间。
- 可选择历史版本并回滚；回滚形成新的当前状态提示，不删除历史版本。

候选区和挂载关系完整页属于 P1，本轮只在顶部展示数量或摘要，不实现审核与反向关系管理。

### 5.3 Dreaming 列表与创建

列表字段：

- 任务名、输入 Store、会话数、状态、token 消耗、创建人、创建时间、操作。

创建流程使用单个 Dialog 分区完成：

1. 选择输入 Store。
2. 选择会话范围，默认“自上次 Dreaming 以来”。
3. 输入可选整理提示词。
4. 选择模型档位。

提交后生成 `pending_review` Mock 任务并进入任务详情。

### 5.4 Dreaming 任务详情

展示：

- 输入 Store、会话数、耗时、token 消耗。
- 条目新增、删除、修改统计。
- 按文件分组的左右 Diff。
- 应用新版本、驳回。

P0 必须完成应用、驳回和 Store 回滚；“外溢候选清单”属于 P1，不实现。

应用后：

- 任务状态变为 `applied`。
- Store 当前版本递增。
- 旧版本仍保留。

### 5.5 Claw 详情记忆页

替换现有占位内容，分为三个区块：

- 自带记忆：C Store 规模、更新时间、记忆指引、详情入口和 Dreaming 入口；U Store 仅展示用户数和条目总数。
- 外接记忆：挂载表格和“挂载 Memory Store”Dialog。
- 运行设置：会话级提取、接受 `context_pack`、回传 `memory_suggestions`。

`read_write` 选择后，在保存挂载前弹出二次确认。

### 5.6 会话页记忆可视化

在现有预览/调试会话中加入：

- 顶部“记忆沙箱”状态条，说明调试写入不会直接生效。
- 记忆检索事件卡：Store、命中条目、用途。
- 记忆写入事件卡：目标 U/C/共享 Store 候选区、写入摘要。
- “转正”操作只做前端状态反馈。

## 6. 状态与错误处理

- Mock 状态集中定义，页面组件不各自复制枚举和示例数据。
- 必填字段在提交前校验并显示行内提示。
- 删除 Store 前确认；自带 C Store 的删除入口禁用。
- 找不到 Store 或 Dreaming 任务时展示明确空状态和返回入口。
- 所有成功、失败和保护性限制通过 `sonner` toast 反馈。
- 页面刷新后允许恢复为初始 Mock 数据，本轮不承诺持久化。

## 7. 组件边界

- `lib/mock/memory-management.ts`：领域类型、Mock 数据和纯状态辅助函数。
- `components/memory-management/`：列表、详情、创建 Dialog、Dreaming 列表与详情。
- `components/claw-hub-next/detail/claw-memory-section.tsx`：Claw 详情记忆配置。
- `components/claw-hub-next/` 的会话组件：仅添加记忆事件展示，不重构现有会话架构。
- `app/(dashboard)/memory-management/`：路由薄层。

## 8. 测试与验收

静态检查：

- `npm run lint`
- `npm run build`

浏览器验收：

1. 左侧导航可进入“记忆”。
2. 记忆库可搜索、筛选、创建 Store 并进入详情。
3. Store 文件树可切换文件并完成编辑保存。
4. 可从 Store 发起 Dreaming。
5. Dreaming 详情展示 Diff，并可应用或驳回。
6. Store 可从历史版本回滚。
7. Claw 详情记忆页可配置 C Store、挂载共享 Store，并对 `read_write` 二次确认。
8. 会话页展示沙箱条及记忆读写事件。

## 9. 本轮不做

- 候选区采纳、合并、拒绝与批量操作。
- Dreaming 外溢候选及搬运。
- 从已有 Store 或 Dreaming 结果 fork 新 Store。
- 完整挂载关系反向视图。
- Store 健康度与 token 报表。
- 定时或阈值触发 Dreaming。
- 后端 API、数据库、跨页面持久化和权限系统。
