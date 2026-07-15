export type ClawType = "运维型" | "销售型" | "审核型" | "办公型" | "研发型";
export type ClawStatus = "运行中" | "设计中" | "待评审" | "冻结";
export type ClawPublishStatus = "已发布" | "未发布";

export interface ClawHubListItem {
  id: string;
  name: string;
  creator: string;
  type: ClawType;
  scene: string;
  owner: string;
  status: ClawStatus;
  publishStatus: ClawPublishStatus;
  model: string;
  updatedAt: string;
  updatedBy: string;
  summary: string;
}

export type ClawCoreFileKey = "agent";

export const CLAW_AGENT_MD_PLACEHOLDER =
  "定义它的身份、目标、服务对象、工作方式和行为边界。\n支持使用 Markdown 语法组织内容，例如标题、列表、加粗、表格等，让提示词结构化、可维护。";

export function createClawAgentMdFile(content: string): ClawDetailFileItem {
  return {
    key: "agent",
    title: "Agent.md",
    description: "定义 Claw 的身份、目标、服务对象、工作方式和行为边界。",
    note: "Agent",
    sizeLabel: `${Math.max(0.1, content.length / 1024).toFixed(1)} KB`,
    content,
  };
}

export interface ClawDetailFileItem {
  key: ClawCoreFileKey;
  title: string;
  description: string;
  note: string;
  sizeLabel: string;
  content: string;
  tags?: string[];
}

export type CapabilityScope = "platform" | "tenant" | "claw";
export type KnowledgeScope = "tenant" | "claw";

/** 与工具配置弹窗 ToolConfigKind 对齐 */
export type CapabilityToolKind = "workflow" | "mcp" | "plugin" | "ontology_action";

/**
 * 工具来源：公共配置 = 来自平台/租户公共池；单Claw配置 = 仅当前 Claw 配置。
 * 在「公共配置」Tab 下展示时固定为公共配置语义。
 */
export type CapabilityToolOrigin = "public_config" | "claw_only";

export interface CapabilityToolItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  badge?: string;
  meta?: string;
  /** 缺省时由界面根据 meta/名称推断 */
  kind?: CapabilityToolKind;
  /** 仅在 tools.claw 列表中有意义；缺省视为单Claw配置 */
  origin?: CapabilityToolOrigin;
}

export interface CapabilitySkillItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  sizeLabel: string;
}

export interface CapabilityAgentItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  target: string;
  primaryModel?: string;
  fallbackModel?: string;
  prompt?: string;
  sourceType?: "created" | "referenced";
  /** 子智能体独立挂载的资源；未配置时为空，不再隐式继承主 Claw。 */
  resources?: {
    skills: CapabilitySkillItem[];
    tools: CapabilityToolItem[];
    knowledge: CapabilityKnowledgeItem[];
  };
}

export interface CapabilityKnowledgeItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  documentCount: number;
  updatedAt: string;
}

export interface ClawCapabilityConfig {
  tools: Record<CapabilityScope, CapabilityToolItem[]>;
  skills: Record<CapabilityScope, CapabilitySkillItem[]>;
  agents: Record<CapabilityScope, CapabilityAgentItem[]>;
  knowledge: Record<KnowledgeScope, CapabilityKnowledgeItem[]>;
}

export type DatabaseEngineType = "MySQL" | "Neo4j";
export type KnowledgeBaseLevel = "基础" | "高级";

export interface KnowledgeBaseRow {
  id: string;
  name: string;
  type: KnowledgeBaseLevel;
  description: string;
  creator: string;
  updatedAt: string;
  enabled: boolean;
}

export interface DatabaseRow {
  id: string;
  name: string;
  description: string;
  dbType: DatabaseEngineType;
  creator: string;
  updatedAt: string;
  enabled: boolean;
}

export interface OntologyObjectRow {
  id: string;
  name: string;
  scene: string;
  description: string;
  creator: string;
  updatedAt: string;
  enabled: boolean;
}

export interface TermBankRow {
  id: string;
  name: string;
  description: string;
  creator: string;
  updatedAt: string;
  enabled: boolean;
}

export interface ClawKnowledgeAssets {
  knowledgeBases: KnowledgeBaseRow[];
  databases: DatabaseRow[];
  ontologyObjects: OntologyObjectRow[];
  termBanks: TermBankRow[];
}

export function buildKnowledgeAssetsFromLegacy(
  knowledge: ClawCapabilityConfig["knowledge"],
  defaultCreator: string
): ClawKnowledgeAssets {
  const tenantCreator = "公共配置";
  const knowledgeBases: KnowledgeBaseRow[] = [
    ...knowledge.tenant.map((item) => ({
      id: item.id,
      name: item.name,
      type: "基础" as const,
      description: item.description,
      creator: tenantCreator,
      updatedAt: item.updatedAt,
      enabled: item.enabled,
    })),
    ...knowledge.claw.map((item) => ({
      id: item.id,
      name: item.name,
      type: "高级" as const,
      description: item.description,
      creator: defaultCreator,
      updatedAt: item.updatedAt,
      enabled: item.enabled,
    })),
  ];

  return {
    knowledgeBases,
    databases: [
      {
        id: "db-mysql-demo",
        name: "业务只读库",
        description: "支撑报表与指标查询的只读实例。",
        dbType: "MySQL",
        creator: tenantCreator,
        updatedAt: "2026-04-01 10:00",
        enabled: true,
      },
      {
        id: "db-neo4j-demo",
        name: "关系图谱库",
        description: "用于路径分析与关联扩散。",
        dbType: "Neo4j",
        creator: defaultCreator,
        updatedAt: "2026-03-28 09:00",
        enabled: true,
      },
    ],
    ontologyObjects: [
      {
        id: "onto-demo-1",
        name: "客户本体",
        scene: "销售协同",
        description: "客户、商机与合同对象的核心属性和关系定义。",
        creator: defaultCreator,
        updatedAt: "2026-04-02 11:20",
        enabled: true,
      },
    ],
    termBanks: [
      {
        id: "term-demo-1",
        name: "标准术语库",
        description: "对外口径、缩写与禁用词。",
        creator: tenantCreator,
        updatedAt: "2026-03-30 15:00",
        enabled: true,
      },
    ],
  };
}

function attachKnowledgeAssetsIfMissing(detail: ClawDetailData): ClawDetailData {
  if (detail.knowledgeAssets) {
    return detail;
  }
  return {
    ...detail,
    knowledgeAssets: buildKnowledgeAssetsFromLegacy(
      detail.capabilityConfig.knowledge,
      detail.overview.updatedBy || detail.overview.creator
    ),
  };
}

/** 全平台 Claw 统一的内置技能（与具体业务 Claw 无关） */
const BUILTIN_CLAW_PLATFORM_SKILL_SPECS: ReadonlyArray<{ name: string; description: string }> = [
  { name: "ppt", description: "演示文稿：大纲、版式与讲者备注。" },
  { name: "excel", description: "电子表格：数据整理、公式与简易分析。" },
  { name: "word", description: "文档编辑：长文结构、样式与修订。" },
  { name: "frontend-design", description: "前端与界面：布局、组件与设计规范。" },
  { name: "diagram", description: "图示与图解：流程、架构与可视化草图。" },
];

function buildBuiltinClawPlatformSkills(idPrefix: string): CapabilitySkillItem[] {
  return BUILTIN_CLAW_PLATFORM_SKILL_SPECS.map((spec) => ({
    id: `${idPrefix}builtin-${spec.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "")}`,
    name: spec.name,
    description: spec.description,
    enabled: true,
    sizeLabel: "通用",
  }));
}

/** 工具能力 V1：全平台 Claw 统一的内置插件 / 内置工具（与租户、Claw 专属配置无关） */
const BUILTIN_CLAW_PLATFORM_TOOL_SPECS: ReadonlyArray<{
  key: string;
  name: string;
  description: string;
  badge: string;
  meta: string;
}> = [
  {
    key: "execute_python",
    name: "execute_python",
    description:
      "沙箱内 Python，预装 pandas、numpy、matplotlib、plotly、openpyxl、python-docx、python-pptx、requests、beautifulsoup4 等常用库。沙箱隔离：每会话独立工作区；网络出口按策略；会话结束即销毁。",
    badge: "代码执行",
    meta: "沙箱",
  },
  {
    key: "execute_shell",
    name: "execute_shell",
    description:
      "受限 Shell，用于文件操作与基础命令；与会话沙箱同源隔离策略（每会话独立、策略化网络出口、结束销毁）。",
    badge: "代码执行",
    meta: "沙箱",
  },
  {
    key: "read_file",
    name: "read_file",
    description: "读取工作区文件。作用域限定在当前会话工作区。",
    badge: "文件工具",
    meta: "工作区",
  },
  {
    key: "write_file",
    name: "write_file",
    description: "写入工作区文件。作用域限定在当前会话工作区。",
    badge: "文件工具",
    meta: "工作区",
  },
  {
    key: "edit_file",
    name: "edit_file",
    description: "编辑工作区已有文件。作用域限定在当前会话工作区。",
    badge: "文件工具",
    meta: "工作区",
  },
  {
    key: "list_files",
    name: "list_files",
    description: "列出会话工作区内的文件与目录。作用域限定在当前会话工作区。",
    badge: "文件工具",
    meta: "工作区",
  },
  {
    key: "move_file",
    name: "move_file",
    description: "在工作区内移动或重命名文件。作用域限定在当前会话工作区。",
    badge: "文件工具",
    meta: "工作区",
  },
  {
    key: "delete_file",
    name: "delete_file",
    description: "删除工作区内的文件。作用域限定在当前会话工作区。",
    badge: "文件工具",
    meta: "工作区",
  },
  {
    key: "web_search",
    name: "web_search",
    description: "搜索引擎检索，获取公开网页摘要与链接。",
    badge: "网络工具",
    meta: "网络",
  },
  {
    key: "web_fetch",
    name: "web_fetch",
    description: "按 URL 抓取内容，遵守 robots.txt；企业可配置域名白/黑名单。",
    badge: "网络工具",
    meta: "网络",
  },
  {
    key: "drive_search",
    name: "drive_search",
    description: "示例：由 MCP Gateway 统一注册的连接器工具（Google Drive），搜索云端文件。",
    badge: "连接器",
    meta: "MCP Gateway",
  },
  {
    key: "drive_read",
    name: "drive_read",
    description: "示例：读取 Google Drive 对象内容与元数据（经 MCP Gateway）。",
    badge: "连接器",
    meta: "MCP Gateway",
  },
  {
    key: "drive_create",
    name: "drive_create",
    description: "示例：在 Google Drive 创建对象（经 MCP Gateway）。",
    badge: "连接器",
    meta: "MCP Gateway",
  },
  {
    key: "drive_update",
    name: "drive_update",
    description: "示例：更新 Google Drive 对象（经 MCP Gateway）。",
    badge: "连接器",
    meta: "MCP Gateway",
  },
  {
    key: "create_docx",
    name: "create_docx",
    description:
      "生成 Word（.docx）；支持企业上传标准模板；支持表格、图表、分节、页眉页脚与样式等复杂格式。",
    badge: "文档生成",
    meta: "文档",
  },
  {
    key: "create_xlsx",
    name: "create_xlsx",
    description:
      "生成 Excel（.xlsx）；支持模板化与企业标准样式；支持表格与图表嵌入。",
    badge: "文档生成",
    meta: "文档",
  },
  {
    key: "create_pptx",
    name: "create_pptx",
    description:
      "生成 PowerPoint（.pptx）；支持模板母版与版式；支持图示与分页结构。",
    badge: "文档生成",
    meta: "文档",
  },
  {
    key: "create_pdf",
    name: "create_pdf",
    description: "生成 PDF；可从模板渲染，保留版式与嵌入字体策略（按租户配置）。",
    badge: "文档生成",
    meta: "文档",
  },
  {
    key: "create_markdown",
    name: "create_markdown",
    description: "生成 Markdown 文档；适合协作交付与后续转排版。",
    badge: "文档生成",
    meta: "文档",
  },
];

function buildBuiltinClawPlatformTools(idPrefix: string): CapabilityToolItem[] {
  return BUILTIN_CLAW_PLATFORM_TOOL_SPECS.map((spec) => ({
    id: `${idPrefix}builtin-${spec.key}`,
    name: spec.name,
    description: spec.description,
    enabled: true,
    badge: spec.badge,
    meta: spec.meta,
  }));
}

export type RuntimeResourceTier = "light" | "standard" | "enhanced";
export type ExecutionResourceTier = "basic" | "standard" | "enhanced";

export interface ResourceConfig {
  runtime: {
    tier: RuntimeResourceTier;
    maxConcurrentTasks: number;
    maxTaskDurationMin: number;
    advanced: {
      cpu: number;
      memoryGb: number;
      diskGb: number;
      runtimeVersion: string;
      startupTimeoutSec: number;
    };
  };
  execution: {
    tier: ExecutionResourceTier;
    workspaceDiskGb: number;
    maxConcurrentExecutions: number;
    maxExecutionTimeoutMin: number;
    capabilities: {
      browser: boolean;
      python: boolean;
      shell: boolean;
      file: boolean;
      document: boolean;
      network: boolean;
    };
  };
}

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant" | "tool";
  sender: string;
  time: string;
  content: string;
  displayMode?: "thinking" | "output" | "skill" | "tool";
  toolLabel?: string;
  attachments?: string[];
  auditTurnId?: string;
}

export interface ChatSessionItem {
  id: string;
  title: string;
  source: string;
  preview: string;
  updatedAt: string;
  unreadCount: number;
  messages: ChatMessageItem[];
}

export interface ClawTaskItem {
  name: string;
  trigger: string;
  status: string;
  note: string;
}

export interface ClawTaskGroup {
  title: string;
  description: string;
  tasks: ClawTaskItem[];
}

export type ClawAutomatedTaskRecentResult = "success" | "failure" | "running" | "never";

/** 任务交付渠道（与渠道列表概念对齐的枚举） */
export const AUTOMATED_TASK_DELIVERY_CHANNELS = [
  "AF平台",
  "飞书",
  "钉钉",
  "企微",
  "蓝信",
  "QQ",
] as const;

export type AutomatedTaskDeliveryChannel = (typeof AUTOMATED_TASK_DELIVERY_CHANNELS)[number];

/** 交付位置：独立会话（新建）或复用已有会话 */
export type AutomatedTaskDeliveryLocation = "dedicated" | "existing";

/** 供「交付位置 - 选择已有会话」下拉的会话项（按更新时间倒序展示） */
export interface DeliveryConversationOption {
  id: string;
  name: string;
  /** ISO 8601，用于排序与展示 */
  updatedAt: string;
}

/** 全量会话列表示例（已按 updatedAt 倒序） */
export const AUTOMATED_TASK_DELIVERY_CONVERSATIONS_SAMPLE: DeliveryConversationOption[] = [
  { id: "conv-crm-brief", name: "CRM 日报跟进会话", updatedAt: "2026-04-20T18:30:00" },
  { id: "conv-weekly-archive", name: "知识库归档主会话", updatedAt: "2026-04-19T10:12:00" },
  { id: "conv-lead-sync", name: "线索同步巡检", updatedAt: "2026-04-18T08:45:00" },
  { id: "conv-migration-check", name: "数据迁移校验会话", updatedAt: "2026-04-17T14:00:00" },
  { id: "conv-default-work", name: "默认工作会话", updatedAt: "2026-04-15T09:00:00" },
];

export interface ClawAutomatedTaskItem {
  id: string;
  name: string;
  description: string;
  /** 创建该自动化任务的平台用户展示名 */
  createdBy: string;
  /** 触发方式与时间，如「每天 09:00」「每 6 小时」 */
  triggerSummary: string;
  triggerKind: "定时执行" | "间隔执行" | "单次执行";
  /** 任务产出或通知的交付渠道 */
  deliveryChannel: AutomatedTaskDeliveryChannel;
  /** 交付位置：独立会话或已有会话 */
  deliveryLocation: AutomatedTaskDeliveryLocation;
  /** 当 deliveryLocation 为 existing 时，选中的会话 id */
  deliveryConversationId: string | null;
  lastExecutedAt: string | null;
  recentResult: ClawAutomatedTaskRecentResult;
  enabled: boolean;
}

export type ClawAutomatedTaskExecutionStatus = "success" | "failure";

export interface ClawAutomatedTaskExecutionItem {
  id: string;
  taskId: string;
  taskName: string;
  /** 本次执行后 Agent 对外输出的最终结果 */
  finalOutput: string;
  status: ClawAutomatedTaskExecutionStatus;
  resultSummary: string;
  executedAt: string;
  deliveryChannel: AutomatedTaskDeliveryChannel;
  deliveryTarget: string;
  relatedSessionId?: string;
  traceId: string;
}

/** Claw 配置页「自动化任务」列表示例数据 */
export const CLAW_AUTOMATED_TASKS_SAMPLE: ClawAutomatedTaskItem[] = [
  {
    id: "auto-task-daily-sales",
    name: "每日销售简报",
    description: "汇总 CRM 新增线索、跟进状态与本周重点客户动态。",
    createdBy: "林越",
    triggerSummary: "每天 09:00",
    triggerKind: "定时执行",
    deliveryChannel: "飞书",
    deliveryLocation: "dedicated",
    deliveryConversationId: null,
    lastExecutedAt: "2026-04-19 09:02",
    recentResult: "success",
    enabled: true,
  },
  {
    id: "auto-task-weekly-archive",
    name: "周报归档",
    description: "将本周会话与产出摘要写入知识库归档目录。",
    createdBy: "周琪",
    triggerSummary: "每周一 10:00",
    triggerKind: "定时执行",
    deliveryChannel: "蓝信",
    deliveryLocation: "existing",
    deliveryConversationId: "conv-weekly-archive",
    lastExecutedAt: "2026-04-14 10:05",
    recentResult: "success",
    enabled: true,
  },
  {
    id: "auto-task-interval-sync",
    name: "线索同步巡检",
    description: "周期性拉取外部系统变更并比对本地缓存。",
    createdBy: "林越",
    triggerSummary: "每 6 小时",
    triggerKind: "间隔执行",
    deliveryChannel: "钉钉",
    deliveryLocation: "dedicated",
    deliveryConversationId: null,
    lastExecutedAt: "2026-04-20 08:00",
    recentResult: "running",
    enabled: true,
  },
  {
    id: "auto-task-once-migration",
    name: "一次性数据迁移校验",
    description: "在指定时间触发全量校验并生成差异报告。",
    createdBy: "何帆",
    triggerSummary: "单次: 2026-04-20 14:00",
    triggerKind: "单次执行",
    deliveryChannel: "企微",
    deliveryLocation: "existing",
    deliveryConversationId: "conv-migration-check",
    lastExecutedAt: "2026-04-20 14:00",
    recentResult: "failure",
    enabled: false,
  },
  {
    id: "auto-task-never",
    name: "客户回访提醒（草稿）",
    description: "按客户分层生成待回访清单（尚未启用执行）。",
    createdBy: "周琪",
    triggerSummary: "每天 18:00",
    triggerKind: "定时执行",
    deliveryChannel: "QQ",
    deliveryLocation: "dedicated",
    deliveryConversationId: null,
    lastExecutedAt: null,
    recentResult: "never",
    enabled: false,
  },
];

/** Claw 配置页「自动化任务执行历史」示例数据，按执行时间倒序展示 */
export const CLAW_AUTOMATED_TASK_EXECUTIONS_SAMPLE: ClawAutomatedTaskExecutionItem[] = [
  {
    id: "auto-exec-migration-20260420-1400",
    taskId: "auto-task-once-migration",
    taskName: "一次性数据迁移校验",
    finalOutput: "生成 1 份迁移差异报告，包含 17 条字段映射异常。",
    status: "failure",
    resultSummary: "执行失败：目标系统返回字段 schema 不一致，已保留差异报告并停止后续写入。",
    executedAt: "2026-04-20 14:00:23",
    deliveryChannel: "企微",
    deliveryTarget: "企微 / 数据迁移项目群",
    relatedSessionId: "office-shrimp-expense",
    traceId: "trace-auto-migration-20260420-1400",
  },
  {
    id: "auto-exec-sync-20260420-0800",
    taskId: "auto-task-interval-sync",
    taskName: "线索同步巡检",
    finalOutput: "已完成 CRM、企微和本地缓存中的线索状态比对。",
    status: "success",
    resultSummary: "执行成功：完成外部系统变更比对，本地缓存无需修复。",
    executedAt: "2026-04-20 08:00:11",
    deliveryChannel: "钉钉",
    deliveryTarget: "钉钉 / 销售运营群",
    relatedSessionId: "ops-ticket-followup",
    traceId: "trace-auto-sync-20260420-0800",
  },
  {
    id: "auto-exec-sales-20260419-0902",
    taskId: "auto-task-daily-sales",
    taskName: "每日销售简报",
    finalOutput: "新增线索 24 条，重点客户 6 个，生成今日跟进建议。",
    status: "success",
    resultSummary: "执行成功：简报已发送至飞书销售日报群，并创建 3 条高优先级跟进提醒。",
    executedAt: "2026-04-19 09:02:18",
    deliveryChannel: "飞书",
    deliveryTarget: "飞书 / 销售日报群",
    relatedSessionId: "office-shrimp-reminder",
    traceId: "trace-auto-sales-20260419-0902",
  },
  {
    id: "auto-exec-sales-20260418-0901",
    taskId: "auto-task-daily-sales",
    taskName: "每日销售简报",
    finalOutput: "新增线索 19 条，输出本日客户回访排序。",
    status: "success",
    resultSummary: "执行成功：飞书消息已送达，CRM 回写 5 条跟进状态。",
    executedAt: "2026-04-18 09:01:52",
    deliveryChannel: "飞书",
    deliveryTarget: "飞书 / 销售日报群",
    relatedSessionId: "office-shrimp-reminder",
    traceId: "trace-auto-sales-20260418-0901",
  },
  {
    id: "auto-exec-archive-20260414-1005",
    taskId: "auto-task-weekly-archive",
    taskName: "周报归档",
    finalOutput: "归档 12 个会话摘要和 4 份产出物索引。",
    status: "success",
    resultSummary: "执行成功：已写入知识库 /周报归档/2026-W16，并同步到蓝信项目空间。",
    executedAt: "2026-04-14 10:05:37",
    deliveryChannel: "蓝信",
    deliveryTarget: "蓝信 / 知识归档空间",
    relatedSessionId: "ops-report-sync",
    traceId: "trace-auto-archive-20260414-1005",
  },
  {
    id: "auto-exec-sales-20260412-0902",
    taskId: "auto-task-daily-sales",
    taskName: "每日销售简报",
    finalOutput: "新增线索 16 条，生成本周客户分层变化摘要。",
    status: "success",
    resultSummary: "执行成功：AF 平台工作台已生成简报卡片，并同步飞书通知。",
    executedAt: "2026-04-12 09:02:04",
    deliveryChannel: "AF平台",
    deliveryTarget: "AF平台 / 办公虾自动化会话",
    relatedSessionId: "office-shrimp-expense",
    traceId: "trace-auto-sales-20260412-0902",
  },
];

export interface DistributionChannelItem {
  name: string;
  status: "已接入" | "未接入";
  appId: string;
  secretIdMasked: string;
}

export interface WorkspaceFileItem {
  id: string;
  name: string;
  kind: "file";
  sizeLabel: string;
  updatedAt: string;
  updatedBy: string;
  description?: string;
}

export interface WorkspaceFolderItem {
  id: string;
  name: string;
  kind: "folder";
  description?: string;
  children: WorkspaceEntryItem[];
}

export type WorkspaceEntryItem = WorkspaceFolderItem | WorkspaceFileItem;

export interface WorkspaceStorageConfig {
  volumeDisplayName: string;
  volumeDescription?: string;
  volumeName: string;
  subdirectory: string;
  organizationName: string;
  projectName?: string;
  volumeTotalGb: number;
  volumeAvailableGb: number;
  workspaceUsedGb: number;
  workspaceQuotaGb: number | null;
}

export interface MessageLogItem {
  time: string;
  peer: string;
  summary: string;
}

export interface TaskLogItem {
  time: string;
  taskName: string;
  result: string;
}

export type ConversationAuditType = "接口调用" | "MCP调用" | "CLI执行" | "工作流节点" | "工具执行";
export type ConversationAuditStatus = "成功" | "失败" | "已拦截";

export interface ConversationAuditItem {
  id: string;
  turnId: string;
  type: ConversationAuditType;
  targetName: string;
  inputSummary: string;
  outputSummary: string;
  durationMs: number;
  status: ConversationAuditStatus;
  traceId: string;
}

export interface ConversationRunTurnItem {
  id: string;
  turnNumber: number;
  occurredAt: string;
  userInput: string;
  assistantOutput: string;
  attachments?: string[];
  traceId: string;
  auditRecords: ConversationAuditItem[];
}

/** 会话日志中的使用渠道（预览调试 / Agent 广场 / API） */
export type ConversationUsageChannel = "预览与调试" | "Agent广场" | "API调用";

export const CONVERSATION_USAGE_CHANNELS: ConversationUsageChannel[] = [
  "预览与调试",
  "Agent广场",
  "API调用",
];

export function getConversationUsageChannelForSeed(seed: string): ConversationUsageChannel {
  let hash = 0;
  for (const char of seed) {
    hash = (hash + char.charCodeAt(0)) % CONVERSATION_USAGE_CHANNELS.length;
  }
  return CONVERSATION_USAGE_CHANNELS[hash]!;
}

export interface ConversationRunItem {
  id: string;
  title: string;
  channel: ConversationUsageChannel;
  userIdentity: string;
  sessionId: string;
  traceId: string;
  startedAt: string;
  updatedAt: string;
  turns: ConversationRunTurnItem[];
}

export type TaskRunType = "自动化任务" | "催办任务" | "条件触发任务";
export type TaskRunStatus = "成功" | "失败" | "运行中";

export interface TaskRunItem {
  id: string;
  taskName: string;
  taskType: TaskRunType;
  triggerSource: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  status: TaskRunStatus;
  resultSummary: string;
  relatedSessionId?: string;
  traceId: string;
}

export type SecurityEventLevel = "高" | "中" | "低";
export type SecurityEventAction = "拦截" | "脱敏" | "记录" | "放行";
export type SecurityEventSourceType = "会话运行" | "任务运行";

export interface SecurityEventItem {
  id: string;
  time: string;
  level: SecurityEventLevel;
  stage: string;
  ruleName: string;
  action: SecurityEventAction;
  contentSummary: string;
  sourceType: SecurityEventSourceType;
  sourceName: string;
  traceId: string;
}

export type AutonomyBoundaryLevel = "L1：直接放行" | "L2：需用户审批" | "L3：禁止";

export interface AutonomyBoundaryItem {
  id: string;
  name: string;
  description: string;
  level: AutonomyBoundaryLevel;
}

export type ToolProtectionSeverity = "HIGH" | "CRITICAL";

export type ToolProtectionRuleSource = "内置" | "自定义";

export interface ToolProtectionRuleItem {
  id: string;
  severity: ToolProtectionSeverity;
  description: string;
  source: ToolProtectionRuleSource;
  enabled: boolean;
  targetTool?: string;
  targetParam?: string;
  category?: string;
  regexPattern?: string;
  exclusionPattern?: string;
  remediation?: string;
}

export interface ToolProtectionConfig {
  enabled: boolean;
  protectedTools: string[];
  prohibitedTools: string[];
  rules: ToolProtectionRuleItem[];
}

export interface FileProtectionPathItem {
  id: string;
  path: string;
  kind: "file" | "directory";
}

export interface FileProtectionConfig {
  enabled: boolean;
  paths: FileProtectionPathItem[];
}

export interface SecurityPendingApprovalItem {
  id: string;
  actionName: string;
  payload: string;
  requestedAt: string;
  requestedBy: string;
}

export interface SecurityApprovalHistoryItem {
  id: string;
  actionName: string;
  resolution: "approved" | "rejected";
  resolvedAt: string;
  detail: string;
}

export interface SecurityApprovalsConfig {
  pending: SecurityPendingApprovalItem[];
  history: SecurityApprovalHistoryItem[];
}

export interface SecurityManagementConfig {
  autonomyBoundaries: AutonomyBoundaryItem[];
  toolProtection: ToolProtectionConfig;
  fileProtection: FileProtectionConfig;
  securityApprovals: SecurityApprovalsConfig;
}

export const DEFAULT_TOOL_PROTECTION_RULES: ToolProtectionRuleItem[] = [
  {
    id: "TOOL_CMD_DANGEROUS_RM",
    severity: "HIGH",
    description: "检测可能导致数据丢失的 rm 命令",
    source: "内置",
    enabled: true,
  },
  {
    id: "TOOL_CMD_FS_DESTRUCTION",
    severity: "CRITICAL",
    description: "检测格式化、整卷删除等文件系统破坏性操作",
    source: "内置",
    enabled: true,
  },
  {
    id: "TOOL_CMD_PRIVILEGE_ESCALATION",
    severity: "CRITICAL",
    description: "检测 sudo、提权与敏感系统调用组合",
    source: "内置",
    enabled: true,
  },
  {
    id: "TOOL_CMD_ARBITRARY_WRITE",
    severity: "HIGH",
    description: "检测向系统目录或关键配置路径写入",
    source: "内置",
    enabled: true,
  },
];

export function createDefaultToolProtection(
  overrides?: Partial<Pick<ToolProtectionConfig, "enabled" | "protectedTools" | "prohibitedTools">> & {
    rules?: ToolProtectionRuleItem[];
  }
): ToolProtectionConfig {
  return {
    enabled: overrides?.enabled ?? true,
    protectedTools: overrides?.protectedTools ?? [],
    prohibitedTools: overrides?.prohibitedTools ?? [],
    rules: overrides?.rules ?? DEFAULT_TOOL_PROTECTION_RULES.map((rule) => ({ ...rule })),
  };
}

export function createDefaultFileProtection(paths: FileProtectionPathItem[] = []): FileProtectionConfig {
  return {
    enabled: true,
    paths,
  };
}

export function createDefaultSecurityApprovals(
  pending: SecurityPendingApprovalItem[] = [],
  history: SecurityApprovalHistoryItem[] = []
): SecurityApprovalsConfig {
  return { pending, history };
}

export interface PersonRelationItem {
  name: string;
  role: string;
  description: string;
}

export const AGENT_RELATION_KINDS = [
  "上级",
  "下级",
  "协作",
  "同事",
  "导师",
  "利益相关者",
  "其他",
] as const;

export type AgentRelationKind = (typeof AGENT_RELATION_KINDS)[number];

export const AGENT_RELATION_SELECT_OPTIONS: Array<{ value: AgentRelationKind; label: string }> =
  AGENT_RELATION_KINDS.map((value) => ({ value, label: value }));

export interface AgentRelationItem {
  id: string;
  name: string;
  relationship: AgentRelationKind;
  /** 被添加 Claw 的平台侧原始说明，只读 */
  originalDescription: string;
  /** 面向当前 Claw 的个性化说明（能力、专长、用途），可编辑 */
  personalizedDescription: string;
}

export interface UsageSettingItem {
  label: string;
  value: string;
  description: string;
}

export interface PermissionSettingItem {
  name: string;
  scope: string;
  mode: string;
}

export interface ClawDetailData {
  overview: ClawHubListItem & {
    version: string;
    createdAt: string;
  };
  chatSessions: ChatSessionItem[];
  coreFiles: ClawDetailFileItem[];
  capabilityConfig: ClawCapabilityConfig;
  /** 知识域四类资产列表；缺省时由 getClawDetail 根据 capabilityConfig.knowledge 推导 */
  knowledgeAssets?: ClawKnowledgeAssets;
  resourceConfig: ResourceConfig;
  distributionChannels: DistributionChannelItem[];
  taskGroups: ClawTaskGroup[];
  automatedTasks: ClawAutomatedTaskItem[];
  automatedTaskExecutions: ClawAutomatedTaskExecutionItem[];
  workspaceStorageConfig: WorkspaceStorageConfig;
  workspaceRoot: WorkspaceFolderItem;
  messageLogs: MessageLogItem[];
  taskLogs: TaskLogItem[];
  conversationRuns: ConversationRunItem[];
  taskRuns: TaskRunItem[];
  securityEvents: SecurityEventItem[];
  securityManagement: SecurityManagementConfig;
  personRelations: PersonRelationItem[];
  agentRelations: AgentRelationItem[];
  usageSettings: UsageSettingItem[];
  permissionSettings: PermissionSettingItem[];
}

export const clawHubList: ClawHubListItem[] = [
  {
    id: "claw-scientific-research",
    name: "科研 Claw",
    creator: "RowanDI",
    type: "研发型",
    scene: "科研协作",
    owner: "科研创新中心",
    status: "运行中",
    publishStatus: "已发布",
    model: "Qwen3-32B + 科研智能体组",
    updatedAt: "2026-07-11 10:30",
    updatedBy: "RowanDI",
    summary: "面向科研全流程，协同完成假设生成、文献检索、科研绘图、论文生成与论文审核。",
  },
  {
    id: "claw-ops-watch",
    name: "运维值守 Claw",
    creator: "林越",
    type: "运维型",
    scene: "运维协同",
    owner: "平台运维组",
    status: "运行中",
    publishStatus: "已发布",
    model: "Qwen3-32B + MCP",
    updatedAt: "2026-03-28 18:20",
    updatedBy: "RowanDI",
    summary: "负责告警分发、工单补录、值守问答和巡检结果汇总。",
  },
  {
    id: "claw-sales-pilot",
    name: "销售陪练 Claw",
    creator: "苏澄",
    type: "销售型",
    scene: "售前销售",
    owner: "增长运营组",
    status: "设计中",
    publishStatus: "未发布",
    model: "DeepSeek-R1",
    updatedAt: "2026-03-27 14:05",
    updatedBy: "周岚",
    summary: "负责销售演练、客户画像整理和异议处理建议。",
  },
  {
    id: "claw-risk-review",
    name: "风控审核 Claw",
    creator: "陈屿",
    type: "审核型",
    scene: "审批风控",
    owner: "风险管理组",
    status: "待评审",
    publishStatus: "未发布",
    model: "Qwen3-32B + 私有知识库",
    updatedAt: "2026-03-26 21:40",
    updatedBy: "唐溪",
    summary: "负责异常材料审阅、规则命中说明和复核意见生成。",
  },
  {
    id: "claw-office-assist",
    name: "办公助理 Claw",
    creator: "许珂",
    type: "办公型",
    scene: "办公协同",
    owner: "行政服务组",
    status: "运行中",
    publishStatus: "已发布",
    model: "Qwen3-8B",
    updatedAt: "2026-03-25 09:15",
    updatedBy: "林澄",
    summary: "负责请假、报销、日程、会议纪要和制度问答。",
  },
  {
    id: "claw-research-pm",
    name: "研发生命周期 Claw",
    creator: "宋砚",
    type: "研发型",
    scene: "研发协作",
    owner: "产品研发组",
    status: "运行中",
    publishStatus: "已发布",
    model: "Qwen3-32B + 向量检索",
    updatedAt: "2026-03-29 10:30",
    updatedBy: "RowanDI",
    summary: "负责需求拆解、研发答疑、测试回归和版本复盘。",
  },
  {
    id: "claw-office-shrimp",
    name: "办公虾",
    creator: "顾宁",
    type: "办公型",
    scene: "智能办公",
    owner: "平台办公服务中心",
    status: "运行中",
    publishStatus: "已发布",
    model: "Qwen3-32B + Office 技能包",
    updatedAt: "2026-04-06 10:20",
    updatedBy: "RowanDI",
    summary: "负责差旅报销、表单填报、审批发起和常规办公协同。",
  },
  {
    id: "claw-intel-shrimp",
    name: "情报虾",
    creator: "孟川",
    type: "研发型",
    scene: "情报研判",
    owner: "平台情报分析中心",
    status: "运行中",
    publishStatus: "已发布",
    model: "Qwen3-32B + 本体MCP",
    updatedAt: "2026-04-06 11:05",
    updatedBy: "RowanDI",
    summary: "负责竞品动态、行业政策、多源情报归集与结构化简报输出。",
  },
];

export function createDefaultResourceConfig(): ResourceConfig {
  return {
    runtime: {
      tier: "standard",
      maxConcurrentTasks: 3,
      maxTaskDurationMin: 60,
      advanced: {
        cpu: 4,
        memoryGb: 8,
        diskGb: 40,
        runtimeVersion: "Docker Runtime 2026.03",
        startupTimeoutSec: 90,
      },
    },
    execution: {
      tier: "standard",
      workspaceDiskGb: 10,
      maxConcurrentExecutions: 2,
      maxExecutionTimeoutMin: 30,
      capabilities: {
        browser: false,
        python: true,
        shell: false,
        file: true,
        document: true,
        network: false,
      },
    },
  };
}

const detailMap: Record<string, ClawDetailData> = {
  "claw-ops-watch": {
    overview: {
      ...clawHubList[0],
      version: "v2.3.1",
      createdAt: "2026-01-12 09:30",
    },
    chatSessions: [
      {
        id: "ops-alert-briefing",
        title: "飞书群聊",
        source: "运维升级群",
        preview: "看一下 API 网关错误率升高的原因，并整理最近一小时影响面。",
        updatedAt: "今天 10:18",
        unreadCount: 2,
        messages: [
          {
            id: "ops-alert-1",
            role: "user",
            sender: "值班工程师 王超",
            time: "10:18",
            content: "看一下 API 网关错误率升高的原因，并整理最近一小时影响面。",
          },
          {
            id: "ops-alert-2",
            role: "assistant",
            sender: "运维值守 Claw",
            time: "10:18",
            content: "我先拉最近 60 分钟监控和关联日志，先确认峰值时段和受影响链路。",
            auditTurnId: "ops-alert-turn-1",
          },
          {
            id: "ops-alert-3",
            role: "assistant",
            sender: "运维值守 Claw",
            time: "10:19",
            content: "09:42 - 09:57 波动最明显，主要集中在登录、令牌刷新和用户资料接口相关链路。",
            auditTurnId: "ops-alert-turn-1",
          },
          {
            id: "ops-alert-4",
            role: "assistant",
            sender: "运维值守 Claw",
            time: "10:20",
            content:
              "初步判断是上游认证服务抖动导致网关重试放大。\n\n1. 峰值时段集中在 09:42 - 09:57。\n2. 主要影响登录、令牌刷新和用户资料接口。\n3. 建议先核对 auth-service 的线程池和数据库连接数，再检查网关重试配置是否异常放大。",
            auditTurnId: "ops-alert-turn-1",
          },
        ],
      },
      {
        id: "ops-report-sync",
        title: "企业微信",
        source: "晨会同步",
        preview: "把昨晚巡检结果整理成晨会摘要，重点突出高优未闭环项。",
        updatedAt: "今天 08:15",
        unreadCount: 0,
        messages: [
          {
            id: "ops-report-1",
            role: "user",
            sender: "SRE 负责人 李涛",
            time: "08:15",
            content: "把昨晚巡检结果整理成晨会摘要，重点突出高优未闭环项。",
          },
          {
            id: "ops-report-2",
            role: "assistant",
            sender: "运维值守 Claw",
            time: "08:16",
            content: "收到，我先读巡检报告和交接清单，把高优未闭环项单独拎出来。",
            auditTurnId: "ops-report-turn-1",
          },
          {
            id: "ops-report-3",
            role: "assistant",
            sender: "运维值守 Claw",
            time: "08:16",
            content:
              "晨会摘要已经整理好了：昨夜整体稳定，但仍有 3 个高优事项未闭环，我也把负责人和下一步动作列到了待办清单里。",
            auditTurnId: "ops-report-turn-1",
          },
        ],
      },
      {
        id: "ops-ticket-followup",
        title: "钉钉",
        source: "工单催办",
        preview: "高优工单超时了，补一版催办信息并同步影响范围。",
        updatedAt: "昨天 20:40",
        unreadCount: 1,
        messages: [
          {
            id: "ops-ticket-1",
            role: "user",
            sender: "工单系统机器人",
            time: "昨天 20:40",
            content: "高优工单 INC-22031 已超时 30 分钟，请催办并同步当前影响范围。",
          },
          {
            id: "ops-ticket-2",
            role: "assistant",
            sender: "运维值守 Claw",
            time: "昨天 20:41",
            content: "我先补齐工单状态和当前影响面，再生成催办信息。",
            auditTurnId: "ops-ticket-turn-1",
          },
          {
            id: "ops-ticket-3",
            role: "assistant",
            sender: "运维值守 Claw",
            time: "昨天 20:41",
            content: "已生成催办摘要，准备同步给值班负责人和故障协同群。",
            auditTurnId: "ops-ticket-turn-1",
          },
        ],
      },
    ],
    coreFiles: [
      createClawAgentMdFile(`# 运维值守 Claw

## 身份
- 运维协同值守 Agent，由平台运维组创建

## 目标
- 负责告警分发、工单补录、值守问答和巡检结果汇总
- 在突发事件处理中优先保障服务连续性和信息同步效率

## 服务对象
- 值班工程师、SRE 负责人、运维协同群

## 工作方式
- 冷静、可靠、偏审慎；输出简洁，先给结论再给排查路径
- P0/P1 事故主控，子 Agent 仅提供草案与证据链
- 对不确定结论明确标注假设和待确认项

## 行为边界
- 不直接执行高风险变更；写库、改配置、重启实例须人工确认
- 对外输出需说明依据、影响面和建议动作
- 不越权代替人工审批或最终决策`),
    ],
    capabilityConfig: {
      tools: {
        platform: buildBuiltinClawPlatformTools("claw-ops-watch-tool-"),
        tenant: [
          {
            id: "tenant-wecom-notifier",
            name: "企业微信群通知",
            description: "租户统一配置的企业微信告警推送工具。",
            enabled: true,
            badge: "租户配置",
            meta: "消息基础设施",
          },
          {
            id: "tenant-ticket-sync",
            name: "工单状态同步",
            description: "同步工单平台状态并记录变更轨迹。",
            enabled: true,
            badge: "租户配置",
            meta: "ITSM",
          },
        ],
        claw: [
          {
            id: "claw-incident-replayer",
            name: "故障回放器",
            description: "仅当前运维值守 Claw 使用的故障时间线回放工具。",
            enabled: true,
            badge: "Claw配置",
            meta: "值守专属",
            kind: "plugin",
            origin: "claw_only",
          },
        ],
      },
      skills: {
        platform: buildBuiltinClawPlatformSkills("claw-ops-watch-skill-"),
        tenant: [
          {
            id: "incident-brief",
            name: "incident-brief",
            description: "租户统一下发的故障摘要生成技能。",
            enabled: true,
            sizeLabel: "0.4 KB",
          },
          {
            id: "sla-reminder",
            name: "sla-reminder",
            description: "超时任务提醒与催办模板。",
            enabled: false,
            sizeLabel: "0.2 KB",
          },
        ],
        claw: [
          {
            id: "nightly-inspection",
            name: "nightly-inspection",
            description: "当前 Claw 的夜间巡检总结技能。",
            enabled: true,
            sizeLabel: "0.5 KB",
          },
        ],
      },
      agents: {
        platform: [
          {
            id: "summary-agent",
            name: "摘要 Agent",
            description: "负责把长消息和工具结果浓缩成可转发摘要。",
            enabled: true,
            target: "平台预置函数",
          },
          {
            id: "translator-agent",
            name: "解释 Agent",
            description: "把技术结论转换成非技术角色可理解的说明。",
            enabled: true,
            target: "平台预置函数",
          },
        ],
        tenant: [
          {
            id: "tenant-ticket-agent",
            name: "工单协同 Agent",
            description: "租户统一配置的工单状态协同函数。",
            enabled: true,
            target: "租户流程中心",
          },
        ],
        claw: [
          {
            id: "postmortem-agent",
            name: "复盘 Agent",
            description: "当前 Claw 专用的故障复盘整理函数。",
            enabled: false,
            target: "Claw私有函数",
          },
        ],
      },
      knowledge: {
        tenant: [
          {
            id: "tenant-ops-policy",
            name: "租户运维制度库",
            description: "供所有运维相关 Claw 共享的制度与规范。",
            enabled: true,
            documentCount: 128,
            updatedAt: "2026-03-28",
          },
          {
            id: "tenant-topology",
            name: "基础服务拓扑",
            description: "租户统一维护的服务依赖与拓扑图谱。",
            enabled: true,
            documentCount: 46,
            updatedAt: "2026-03-27",
          },
        ],
        claw: [
          {
            id: "claw-handoff-memory",
            name: "值守交接知识库",
            description: "当前 Claw 专用的交接事项与排障经验沉淀。",
            enabled: true,
            documentCount: 24,
            updatedAt: "2026-03-29",
          },
        ],
      },
    },
    resourceConfig: createDefaultResourceConfig(),
    distributionChannels: [
      {
        name: "蓝信",
        status: "已接入",
        appId: "lanxin-ops-lx01",
        secretIdMasked: "lxsec_****_9k3m",
      },
      {
        name: "企业微信",
        status: "已接入",
        appId: "wxwork-ops-001",
        secretIdMasked: "wwsec_****_92hk",
      },
      {
        name: "钉钉",
        status: "已接入",
        appId: "dingtalk-ops-223",
        secretIdMasked: "dingsec_****_4mqp",
      },
      {
        name: "飞书",
        status: "未接入",
        appId: "未配置",
        secretIdMasked: "未配置",
      },
      {
        name: "Slack",
        status: "未接入",
        appId: "未配置",
        secretIdMasked: "未配置",
      },
      {
        name: "QQ",
        status: "未接入",
        appId: "未配置",
        secretIdMasked: "未配置",
      },
    ],
    taskGroups: [
      {
        title: "自动化任务",
        description: "按固定时间执行的任务。",
        tasks: [
          {
            name: "凌晨巡检汇总",
            trigger: "每天 06:30",
            status: "已启用",
            note: "汇总夜间告警、工单和未闭环问题。",
          },
          {
            name: "值守日报推送",
            trigger: "工作日 09:00",
            status: "已启用",
            note: "推送前一日巡检摘要和待办清单。",
          },
        ],
      },
      {
        title: "催办任务",
        description: "对长时间未处理的事项进行催办。",
        tasks: [
          {
            name: "高优工单催办",
            trigger: "工单超时 30 分钟",
            status: "已启用",
            note: "通知值班群并记录催办时间。",
          },
        ],
      },
      {
        title: "条件触发任务",
        description: "满足条件后自动触发执行。",
        tasks: [
          {
            name: "异常峰值通知",
            trigger: "同类告警 10 分钟内连续 3 次",
            status: "已启用",
            note: "自动生成故障摘要并发给值班负责人。",
          },
        ],
      },
    ],
    automatedTasks: CLAW_AUTOMATED_TASKS_SAMPLE,
    automatedTaskExecutions: CLAW_AUTOMATED_TASK_EXECUTIONS_SAMPLE,
    workspaceStorageConfig: {
      volumeDisplayName: "运维专用存储卷",
      volumeDescription: "运维值守 Claw 共享的巡检存储卷。",
      volumeName: "s3://juicefs-vol-001",
      subdirectory: "claw-ops-watch",
      organizationName: "平台运维组",
      projectName: "运维协同",
      volumeTotalGb: 8000,
      volumeAvailableGb: 4440,
      workspaceUsedGb: 126,
      workspaceQuotaGb: 300,
    },
    workspaceRoot: {
      id: "workspace",
      name: "workspace",
      kind: "folder",
      description: "运维值守 Claw 的企业工作空间",
      children: [
        {
          id: "output",
          name: "output",
          kind: "folder",
          children: [
            {
              id: "daily-report",
              name: "daily-report",
              kind: "folder",
              children: [
                {
                  id: "2026-03-29",
                  name: "2026-03-29",
                  kind: "folder",
                  children: [
                    {
                      id: "ops-report-20260329",
                      name: "summary.md",
                      kind: "file",
                      sizeLabel: "92 KB",
                      updatedAt: "2026-03-29 06:34",
                      updatedBy: "系统任务",
                    },
                  ],
                },
                {
                  id: "2026-03-28",
                  name: "2026-03-28",
                  kind: "folder",
                  children: [],
                },
              ],
            },
            {
              id: "inspection-summary",
              name: "inspection-summary",
              kind: "folder",
              children: [],
            },
          ],
        },
        {
          id: "archived",
          name: "archived",
          kind: "folder",
          children: [
            {
              id: "incident-2026-q1",
              name: "incident-2026-q1",
              kind: "folder",
              children: [
                { id: "gateway-spike", name: "gateway-spike", kind: "folder", children: [] },
                { id: "db-failover", name: "db-failover", kind: "folder", children: [] },
              ],
            },
          ],
        },
        {
          id: "handoff",
          name: "handoff",
          kind: "folder",
          children: [
            { id: "morning-shift", name: "morning-shift", kind: "folder", children: [] },
            { id: "night-shift", name: "night-shift", kind: "folder", children: [] },
          ],
        },
      ],
    },
    messageLogs: [
      {
        time: "2026-03-29 10:18",
        peer: "值班工程师 王超",
        summary: "询问数据库连接数突增原因，并要求整理最近 1 小时关联告警。",
      },
      {
        time: "2026-03-29 09:43",
        peer: "运维群机器人",
        summary: "收到 API 网关错误率升高提醒，返回了影响范围和建议排查顺序。",
      },
      {
        time: "2026-03-29 08:15",
        peer: "SRE 负责人 李涛",
        summary: "请求生成晨会用的夜间巡检摘要。",
      },
    ],
    taskLogs: [
      {
        time: "2026-03-29 06:30",
        taskName: "凌晨巡检汇总",
        result: "执行完成，生成 1 份巡检摘要并写入工作空间。",
      },
      {
        time: "2026-03-28 20:40",
        taskName: "高优工单催办",
        result: "已催办 2 个超时工单，并通知值班负责人。",
      },
      {
        time: "2026-03-28 09:00",
        taskName: "值守日报推送",
        result: "已推送至运维晨会群。",
      },
    ],
    conversationRuns: [
      {
        id: "ops-alert-briefing",
        title: "API 网关错误率排查",
        channel: "API调用",
        userIdentity: "值班工程师 王超",
        sessionId: "sess-ops-20260329-1018",
        traceId: "trace-ops-gateway-001",
        startedAt: "2026-03-29 10:18:12",
        updatedAt: "2026-03-29 10:20:41",
        turns: [
          {
            id: "ops-alert-turn-1",
            turnNumber: 1,
            occurredAt: "2026-03-29 10:18:12",
            userInput: "看一下 API 网关错误率升高的原因，并整理最近一小时影响面。",
            assistantOutput:
              "初步判断是上游认证服务抖动导致网关重试放大。我已经整理出峰值时段、受影响接口和建议排查顺序，下一步建议优先核对 auth-service 线程池和数据库连接数。",
            traceId: "trace-ops-gateway-001",
            auditRecords: [
              {
                id: "ops-alert-audit-1",
                turnId: "ops-alert-turn-1",
                type: "接口调用",
                targetName: "Prometheus / error_rate",
                inputSummary:
                  '{\n  "query": "sum(rate(http_requests_total{job=\\"api-gateway\\",status=~\\"5..\\"}[5m])) by (route)",\n  "range": "60m",\n  "step": "1m"\n}',
                outputSummary:
                  '{\n  "peakWindow": { "start": "2026-03-29T09:42:00Z", "end": "2026-03-29T09:57:00Z" },\n  "maxErrorRate": 0.128,\n  "topRoutes": ["/v1/auth/token", "/v1/user/profile"]\n}',
                durationMs: 460,
                status: "成功",
                traceId: "trace-ops-gateway-001",
              },
              {
                id: "ops-alert-audit-2",
                turnId: "ops-alert-turn-1",
                type: "MCP调用",
                targetName: "Incident_Log.search",
                inputSummary:
                  '{\n  "services": ["auth-service", "api-gateway"],\n  "levels": ["ERROR", "WARN"],\n  "limit": 200,\n  "timeRange": "60m"\n}',
                outputSummary:
                  '{\n  "hits": 42,\n  "facets": { "auth_timeout": 28, "retry_amplification": 9 },\n  "cursor": "c2VhcmNoLXJlc3VsdC0wMDE"\n}',
                durationMs: 820,
                status: "成功",
                traceId: "trace-ops-gateway-001",
              },
              {
                id: "ops-alert-audit-3",
                turnId: "ops-alert-turn-1",
                type: "CLI执行",
                targetName: "kubectl top pods -n prod",
                inputSummary:
                  "# stderr: none\n# kubeconfig: prod-admin\nkubectl top pods -n prod -l app=auth-service",
                outputSummary:
                  "NAME                          CPU(cores)   MEMORY(bytes)\nauth-service-7d8f9c6b4-abcde   889m         512Mi\nauth-service-7d8f9c6b4-fghij   834m         498Mi",
                durationMs: 1240,
                status: "成功",
                traceId: "trace-ops-gateway-001",
              },
              {
                id: "ops-alert-audit-4",
                turnId: "ops-alert-turn-1",
                type: "工具执行",
                targetName: "故障摘要生成器",
                inputSummary:
                  '{\n  "tool": "incident_digest",\n  "version": "v2",\n  "inputs": { "alerts": true, "logs": true, "metrics": true },\n  "locale": "zh-CN"\n}',
                outputSummary:
                  '{\n  "artifactId": "digest-20260329-1018",\n  "impactStatements": 3,\n  "recommendedActions": 2,\n  "workspacePath": "/workspace/output/digests/20260329.json"\n}',
                durationMs: 690,
                status: "成功",
                traceId: "trace-ops-gateway-001",
              },
            ],
          },
        ],
      },
      {
        id: "ops-report-sync",
        title: "夜间巡检摘要同步",
        channel: "Agent广场",
        userIdentity: "SRE 负责人 李涛",
        sessionId: "sess-ops-20260329-0815",
        traceId: "trace-ops-report-014",
        startedAt: "2026-03-29 08:15:20",
        updatedAt: "2026-03-29 08:16:02",
        turns: [
          {
            id: "ops-report-turn-1",
            turnNumber: 1,
            occurredAt: "2026-03-29 08:15:20",
            userInput: "把昨晚巡检结果整理成晨会摘要，重点突出高优未闭环项。",
            assistantOutput:
              "已生成适合晨会直接宣读的摘要，并把高优未闭环事项单独列成待办清单，便于继续跟进。",
            attachments: ["nightly-inspection-20260328.pdf", "handoff-checklist.xlsx"],
            traceId: "trace-ops-report-014",
            auditRecords: [
              {
                id: "ops-report-audit-1",
                turnId: "ops-report-turn-1",
                type: "工作流节点",
                targetName: "夜间巡检摘要工作流",
                inputSummary:
                  '{\n  "node": "ingest.attachments",\n  "files": ["nightly-inspection-20260328.pdf", "handoff-checklist.xlsx"],\n  "extract": ["tables", "bullet_lists", "open_tickets"]\n}',
                outputSummary:
                  '{\n  "briefDraftId": "morning-brief-draft-014",\n  "openHighPriority": 7,\n  "pendingConfirm": 3\n}',
                durationMs: 1780,
                status: "成功",
                traceId: "trace-ops-report-014",
              },
              {
                id: "ops-report-audit-2",
                turnId: "ops-report-turn-1",
                type: "工具执行",
                targetName: "附件解析器",
                inputSummary:
                  '{\n  "tool": "attachment_parser",\n  "mimeTypes": ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],\n  "ocr": false\n}',
                outputSummary:
                  '{\n  "structuredFields": 42,\n  "highPriorityItems": 7,\n  "needsConfirmation": 3,\n  "parserVersion": "1.8.2"\n}',
                durationMs: 930,
                status: "成功",
                traceId: "trace-ops-report-014",
              },
            ],
          },
        ],
      },
      {
        id: "ops-ticket-followup",
        title: "高优工单催办",
        channel: "预览与调试",
        userIdentity: "工单系统机器人",
        sessionId: "sess-ops-20260328-2040",
        traceId: "trace-ops-ticket-092",
        startedAt: "2026-03-28 20:40:08",
        updatedAt: "2026-03-28 20:41:16",
        turns: [
          {
            id: "ops-ticket-turn-1",
            turnNumber: 1,
            occurredAt: "2026-03-28 20:40:08",
            userInput: "高优工单 INC-22031 已超时 30 分钟，请催办并同步当前影响范围。",
            assistantOutput:
              "已完成催办摘要，并同步给值班负责人和故障协同群。当前影响范围为登录、令牌刷新与用户资料接口。",
            traceId: "trace-ops-ticket-092",
            auditRecords: [
              {
                id: "ops-ticket-audit-1",
                turnId: "ops-ticket-turn-1",
                type: "接口调用",
                targetName: "ITSM / tickets.get",
                inputSummary: '{\n  "method": "GET",\n  "path": "/api/v1/tickets/INC-22031",\n  "fields": ["status", "assignee", "sla", "timeline"]\n}',
                outputSummary:
                  '{\n  "id": "INC-22031",\n  "status": "in_progress",\n  "breachMinutes": 30,\n  "assignee": "auth-service-oncall"\n}',
                durationMs: 350,
                status: "成功",
                traceId: "trace-ops-ticket-092",
              },
              {
                id: "ops-ticket-audit-2",
                turnId: "ops-ticket-turn-1",
                type: "工具执行",
                targetName: "企业微信群通知",
                inputSummary:
                  '{\n  "tool": "wework.notify",\n  "chatIds": ["ww-chat-ops-primary", "ww-chat-ops-escalation"],\n  "template": "ticket_escalation_v1"\n}',
                outputSummary: '{\n  "delivered": 2,\n  "messageIds": ["msg-aa01", "msg-bb02"],\n  "httpStatus": 200\n}',
                durationMs: 610,
                status: "成功",
                traceId: "trace-ops-ticket-092",
              },
            ],
          },
        ],
      },
    ],
    taskRuns: [
      {
        id: "task-run-ops-0630",
        taskName: "凌晨巡检汇总",
        taskType: "自动化任务",
        triggerSource: "每天 06:30",
        startedAt: "2026-03-29 06:30:00",
        finishedAt: "2026-03-29 06:34:48",
        durationMs: 288000,
        status: "成功",
        resultSummary: "汇总 12 条夜间告警，生成 1 份巡检摘要并写入工作空间。",
        relatedSessionId: "ops-report-sync",
        traceId: "trace-task-nightly-630",
      },
      {
        id: "task-run-ops-0900",
        taskName: "值守日报推送",
        taskType: "自动化任务",
        triggerSource: "工作日 09:00",
        startedAt: "2026-03-28 09:00:00",
        finishedAt: "2026-03-28 09:01:42",
        durationMs: 102000,
        status: "成功",
        resultSummary: "晨会摘要已推送至运维晨会群，包含 3 个待跟进事项。",
        traceId: "trace-task-daily-report-0900",
      },
      {
        id: "task-run-ticket-followup",
        taskName: "高优工单催办",
        taskType: "催办任务",
        triggerSource: "工单超时 30 分钟",
        startedAt: "2026-03-28 20:40:00",
        finishedAt: "2026-03-28 20:41:16",
        durationMs: 76000,
        status: "成功",
        resultSummary: "已催办 2 个超时工单，并同步值班负责人。",
        relatedSessionId: "ops-ticket-followup",
        traceId: "trace-task-ticket-followup-2040",
      },
      {
        id: "task-run-spike-alert",
        taskName: "异常峰值通知",
        taskType: "条件触发任务",
        triggerSource: "同类告警 10 分钟内连续 3 次",
        startedAt: "2026-03-29 09:43:00",
        durationMs: 54000,
        status: "运行中",
        resultSummary: "正在整理峰值告警影响面，并等待日志检索结果回填。",
        relatedSessionId: "ops-alert-briefing",
        traceId: "trace-task-spike-alert-943",
      },
    ],
    securityEvents: [
      {
        id: "security-event-1",
        time: "2026-03-29 10:19:06",
        level: "高",
        stage: "工具调用前",
        ruleName: "生产写操作防护",
        action: "拦截",
        contentSummary: "阻止直接执行 `kubectl rollout restart auth-service`，要求人工确认后继续。",
        sourceType: "会话运行",
        sourceName: "API 网关错误率排查 / 第 1 轮",
        traceId: "trace-ops-gateway-001",
      },
      {
        id: "security-event-2",
        time: "2026-03-29 08:15:41",
        level: "中",
        stage: "输出阶段",
        ruleName: "客户标识脱敏",
        action: "脱敏",
        contentSummary: "晨会摘要中的客户实例编号已脱敏处理后继续发送。",
        sourceType: "会话运行",
        sourceName: "夜间巡检摘要同步 / 第 1 轮",
        traceId: "trace-ops-report-014",
      },
      {
        id: "security-event-3",
        time: "2026-03-28 20:40:22",
        level: "低",
        stage: "输入阶段",
        ruleName: "工单编号白名单校验",
        action: "记录",
        contentSummary: "识别到工单编号 INC-22031，命中内部标识白名单，仅记录不拦截。",
        sourceType: "会话运行",
        sourceName: "高优工单催办 / 第 1 轮",
        traceId: "trace-ops-ticket-092",
      },
      {
        id: "security-event-4",
        time: "2026-03-29 06:33:18",
        level: "低",
        stage: "任务执行阶段",
        ruleName: "外发渠道白名单",
        action: "放行",
        contentSummary: "凌晨巡检汇总仅向企业微信晨会群投递，符合当前外发白名单策略。",
        sourceType: "任务运行",
        sourceName: "凌晨巡检汇总",
        traceId: "trace-task-nightly-630",
      },
    ],
    securityManagement: {
      autonomyBoundaries: [
        {
          id: "boundary-read-file",
          name: "读取文件",
          description: "读取工作台或知识库中的文件",
          level: "L1：直接放行",
        },
        {
          id: "boundary-write-file",
          name: "写入文件",
          description: "创建或修改工作区中的文件",
          level: "L2：需用户审批",
        },
        {
          id: "boundary-delete-file",
          name: "删除文件",
          description: "删除工作区中的文件",
          level: "L3：禁止",
        },
        {
          id: "boundary-task-manage",
          name: "管理自动化任务",
          description: "创建、更新、启停或删除自动化任务",
          level: "L1：直接放行",
        },
      ],
      toolProtection: createDefaultToolProtection(),
      fileProtection: createDefaultFileProtection([
        { id: "fp-copaw-secret", path: "/Users/nanbunan/.copaw.secret/", kind: "directory" },
      ]),
      securityApprovals: createDefaultSecurityApprovals(
        [
          {
            id: "approval-del-001",
            actionName: "delete_files",
            payload: `{ "tool": "delete_file", "args": "{'path': 'workspace/多智能体协作报告_附录_工具与竞品分析.md'}", "requested_by": "c35c081e-ede7-402b-88ba-7275caae5808" }`,
            requestedAt: "2026/4/10 16:11:16",
            requestedBy: "c35c081e-ede7-402b-88ba-7275caae5808",
          },
        ],
        []
      ),
    },
    personRelations: [
      {
        name: "李俊",
        role: "销售主管",
        description: "会临时来询问客户侧告警影响，需要用业务能听懂的语言给出风险说明。",
      },
      {
        name: "王超",
        role: "值班工程师",
        description: "是日常主要交互对象，收到他的请求时优先整理诊断步骤和可执行命令。",
      },
      {
        name: "李涛",
        role: "SRE 负责人",
        description: "关注全局稳定性和复盘结论，向他汇报时需要突出影响面和处理结果。",
      },
    ],
    agentRelations: [
      {
        id: "ar-ops-sales",
        name: "销售 Claw",
        relationship: "协作",
        originalDescription: "接收运维值守 Claw 输出的事件摘要，再转换成面向客户的解释口径。",
        personalizedDescription: "帮助销售团队理解故障对客户的业务影响，需要对外口径时优先咨询。",
      },
      {
        id: "ar-ops-ticket",
        name: "工单 Claw",
        relationship: "同事",
        originalDescription: "当运维值守 Claw 判断需要补录或催办时，把结构化信息发给工单 Claw 执行。",
        personalizedDescription: "负责工单流转和状态同步，值守侧补录与催办走该通道。",
      },
    ],
    usageSettings: [
      {
        label: "Token 上限",
        value: "200,000 / 日",
        description: "超出上限后进入限流，避免高峰期无控制消耗。",
      },
      {
        label: "消息保留窗口",
        value: "30 天",
        description: "保留近期交互记录，超过窗口后只保留摘要。",
      },
      {
        label: "任务并发",
        value: "3 个",
        description: "同一时间最多并发执行 3 个自动任务。",
      },
    ],
    permissionSettings: [
      {
        name: "高风险操作建议",
        scope: "生产环境变更",
        mode: "仅建议，不自动执行",
      },
      {
        name: "日志读取",
        scope: "近 30 天值守日志",
        mode: "允许读取",
      },
      {
        name: "工作空间写入",
        scope: "巡检报告 / 值守交接",
        mode: "允许写入",
      },
    ],
  },
  "claw-office-shrimp": {
    ...buildFallbackDetail(clawHubList[5]!),
    overview: {
      ...clawHubList[5]!,
      version: "v1.4.2",
      createdAt: "2026-03-18 09:20",
    },
    chatSessions: [
      {
        id: "office-shrimp-expense",
        title: "统一入口 / 企业虾",
        source: "员工办公入口",
        preview: "帮我提交这笔差旅报销，验票、填单并发起审批。",
        updatedAt: "今天 10:14",
        unreadCount: 0,
        messages: [
          {
            id: "office-shrimp-expense-1",
            role: "user",
            sender: "员工 李然",
            time: "10:12",
            content: "帮我提交这笔差旅报销，验票、填单并发起审批。",
          },
          {
            id: "office-shrimp-expense-2",
            role: "assistant",
            sender: "办公虾",
            time: "10:12",
            content:
              "我先思考当前要完成的动作：核对材料完整性、执行验票工作流、完成 ERP 报销表单填写，并在发起审批前向你做一次 HitL 确认。",
            auditTurnId: "office-shrimp-turn-1",
          },
          {
            id: "office-shrimp-expense-3",
            role: "tool",
            sender: "办公虾",
            toolLabel: "技能：差旅报销",
            time: "10:13",
            content:
              "已调用技能：差旅报销\n- 已触发：验票工作流\n- 已触发：差旅表单填写与提交工作流\n- 当前状态：等待 HitL 确认后发起审批",
            auditTurnId: "office-shrimp-turn-1",
          },
          {
            id: "office-shrimp-expense-4",
            role: "assistant",
            sender: "办公虾",
            time: "10:13",
            content:
              "验票工作流已完成，3 张票据均通过校验；差旅表单已自动填充完成，预计报销金额 4,860 元。请确认是否现在发起审批。",
            auditTurnId: "office-shrimp-turn-1",
          },
          {
            id: "office-shrimp-expense-5",
            role: "user",
            sender: "员工 李然",
            time: "10:14",
            content: "确认发起审批。",
          },
          {
            id: "office-shrimp-expense-6",
            role: "assistant",
            sender: "办公虾",
            time: "10:14",
            content:
              "已发起审批，单号 BX-20260406-018，审批流已推送给直属主管和财务复核。最终结果已回写到 ERP，并在待办中心为你保留了查看入口。",
            auditTurnId: "office-shrimp-turn-2",
          },
        ],
      },
      {
        id: "office-shrimp-reminder",
        title: "行政服务群",
        source: "报销补件提醒",
        preview: "本周仍有 2 笔差旅报销待补件，是否统一发起提醒？",
        updatedAt: "今天 09:08",
        unreadCount: 1,
        messages: [
          {
            id: "office-shrimp-reminder-1",
            role: "user",
            sender: "行政同学 周宁",
            time: "09:08",
            content: "本周仍有 2 笔差旅报销待补件，是否统一发起提醒？",
          },
          {
            id: "office-shrimp-reminder-2",
            role: "assistant",
            sender: "办公虾",
            time: "09:08",
            content: "可以，我会按补件状态分组后生成提醒文案，并只向相关员工单独发送。",
            auditTurnId: "office-shrimp-turn-reminder-1",
          },
        ],
      },
      {
        id: "office-shrimp-debug",
        title: "报销流程调试",
        source: "预览与调试",
        preview: "在调试面板试跑验票工作流，检查字段映射是否正确。",
        updatedAt: "昨天 16:42",
        unreadCount: 0,
        messages: [
          {
            id: "office-shrimp-debug-1",
            role: "user",
            sender: "调试用户",
            time: "16:40",
            content: "用样例发票试跑验票工作流，检查 OCR 字段映射和合规规则是否命中。",
          },
          {
            id: "office-shrimp-debug-2",
            role: "assistant",
            sender: "办公虾",
            time: "16:42",
            content:
              "调试运行已完成：3 张样例票据全部通过结构化与合规校验，字段映射结果与预期一致，可继续联调 ERP 草稿写入节点。",
            auditTurnId: "office-shrimp-turn-debug-1",
          },
        ],
      },
    ],
    coreFiles: [
      createClawAgentMdFile(`# 办公虾

## 身份
- 企业办公协同 Agent，服务于智能办公场景

## 目标
- 负责差旅报销、表单填写、审批发起和办公事项提醒
- 优先调用标准化技能和工作流完成稳定执行

## 服务对象
- 企业员工、行政与财务协同人员

## 工作方式
- 轻快、清晰、强执行感；优先给出「下一步怎么做」
- 固定走标准工作流，对 HitL 节点显式提示
- 制度解读与科目映射由本 Claw 主控

## 行为边界
- ERP 正式写入和审批提交须经过 HitL 确认
- 不修改企业制度，不绕过财务和审批链
- 子 Agent 不得跳过 HitL 节点`),
    ],
    capabilityConfig: {
      tools: {
        platform: buildBuiltinClawPlatformTools("office-shrimp-tool-"),
        tenant: [
          {
            id: "office-shrimp-tool-erp",
            name: "ERP MCP",
            description: "对接企业 ERP 的报销单草稿写入、审批发起和状态同步能力。",
            enabled: true,
            badge: "租户配置",
            meta: "MCP",
          },
          {
            id: "office-shrimp-tool-ocr",
            name: "票据 OCR 识别服务",
            description: "识别机票行程单、酒店发票和出租车票的结构化字段。",
            enabled: true,
            badge: "租户配置",
            meta: "OpenAPI",
          },
          {
            id: "office-shrimp-tool-invoice-check",
            name: "企业验票系统接口",
            description: "完成票据真伪核查、重复报销校验和发票抬头一致性检查。",
            enabled: true,
            badge: "租户配置",
            meta: "接口",
          },
        ],
        claw: [
          {
            id: "workflow-invoice-validation",
            name: "验票工作流",
            description: "完成 OCR 识别发票、票据信息结构化提取、系统核查与合规校验。",
            enabled: true,
            badge: "Claw配置",
            meta: "工作流",
            kind: "workflow",
            origin: "public_config",
          },
          {
            id: "workflow-expense-submit",
            name: "差旅表单填写与提交工作流",
            description: "完成出行信息提取、字段映射、自动填充表单、ERP 写入与审批提交。",
            enabled: true,
            badge: "Claw配置",
            meta: "工作流",
            kind: "workflow",
            origin: "claw_only",
          },
        ],
      },
      skills: {
        platform: buildBuiltinClawPlatformSkills("office-shrimp-skill-"),
        tenant: [
          {
            id: "office-shrimp-skill-policy-lookup",
            name: "expense-policy-lookup",
            description: "租户统一下发的差旅制度查询技能。",
            enabled: true,
            sizeLabel: "0.3 KB",
          },
        ],
        claw: [
          {
            id: "office-shrimp-skill-reminder",
            name: "补件提醒",
            description: "针对待补件报销单生成提醒文案并选择合适的发送对象。",
            enabled: true,
            sizeLabel: "0.3 KB",
          },
        ],
      },
      agents: {
        platform: [
          {
            id: "office-shrimp-agent-summary",
            name: "表单摘要 Agent",
            description: "将流程执行结果整理成员工可读的结果摘要。",
            enabled: true,
            target: "平台预置函数",
          },
        ],
        tenant: [
          {
            id: "office-shrimp-agent-finance",
            name: "财务规则 Agent",
            description: "负责把制度要求转换为报销校验规则和映射字段。",
            enabled: true,
            target: "租户共享函数",
          },
        ],
        claw: [
          {
            id: "office-shrimp-agent-travel",
            name: "差旅报销Agent",
            description: "作为办公虾的函数化执行代理，负责稳定串联报销处理全链路。",
            enabled: true,
            target: "Claw私有函数",
          },
        ],
      },
      knowledge: {
        tenant: [
          {
            id: "office-shrimp-knowledge-policy",
            name: "差旅制度知识库",
            description: "汇总差旅制度、费用标准、审批路径和常见异常处理规则。",
            enabled: true,
            documentCount: 48,
            updatedAt: "2026-04-05 18:10",
          },
        ],
        claw: [
          {
            id: "office-shrimp-knowledge-cases",
            name: "办公虾报销案例库",
            description: "沉淀报销场景下的标准示例、异常票据样本和 HitL 反馈记录。",
            enabled: true,
            documentCount: 19,
            updatedAt: "2026-04-06 09:55",
          },
        ],
      },
    },
    resourceConfig: {
      runtime: {
        tier: "standard",
        maxConcurrentTasks: 6,
        maxTaskDurationMin: 25,
        advanced: {
          cpu: 4,
          memoryGb: 8,
          diskGb: 40,
          runtimeVersion: "office-runtime-1.4",
          startupTimeoutSec: 90,
        },
      },
      execution: {
        tier: "standard",
        workspaceDiskGb: 10,
        maxConcurrentExecutions: 2,
        maxExecutionTimeoutMin: 20,
        capabilities: {
          browser: false,
          python: false,
          shell: false,
          file: true,
          document: true,
          network: false,
        },
      },
    },
    distributionChannels: [
      {
        name: "蓝信",
        status: "已接入",
        appId: "office-shrimp-lanxin",
        secretIdMasked: "lxsec_****_bx00",
      },
      {
        name: "企业微信",
        status: "已接入",
        appId: "office-shrimp-wxwork",
        secretIdMasked: "sec_****_bx01",
      },
      {
        name: "飞书",
        status: "已接入",
        appId: "office-shrimp-lark",
        secretIdMasked: "sec_****_bx02",
      },
      {
        name: "钉钉",
        status: "未接入",
        appId: "未配置",
        secretIdMasked: "未配置",
      },
      {
        name: "QQ",
        status: "未接入",
        appId: "未配置",
        secretIdMasked: "未配置",
      },
    ],
    taskGroups: [
      {
        title: "自动化任务",
        description: "定期汇总和提醒待处理的办公事项。",
        tasks: [
          {
            name: "每日待补件报销提醒",
            trigger: "每天 18:00",
            status: "已启用",
            note: "汇总未提交或待补件的报销单，生成提醒并等待人工确认发送。",
          },
        ],
      },
      {
        title: "催办任务",
        description: "针对审批中和待补件的事项做追踪催办。",
        tasks: [
          {
            name: "审批超时催办",
            trigger: "审批节点超时 24 小时",
            status: "已启用",
            note: "自动识别超时审批节点并生成催办摘要。",
          },
        ],
      },
      {
        title: "条件触发任务",
        description: "根据业务状态变化自动触发执行。",
        tasks: [
          {
            name: "报销草稿自动补齐",
            trigger: "上传完整票据且命中差旅场景",
            status: "已启用",
            note: "自动触发差旅报销技能，预填表单并进入 HitL 确认。",
          },
        ],
      },
    ],
    automatedTasks: CLAW_AUTOMATED_TASKS_SAMPLE,
    automatedTaskExecutions: CLAW_AUTOMATED_TASK_EXECUTIONS_SAMPLE,
    workspaceStorageConfig: {
      volumeDisplayName: "GF专用存储卷",
      volumeDescription: "办公虾工作空间默认绑定的项目存储卷。",
      volumeName: "s3://juicefs-vol-001",
      subdirectory: "claw-office-shrimp",
      organizationName: "综合办公中心",
      projectName: "企业办公入口",
      volumeTotalGb: 8000,
      volumeAvailableGb: 4440,
      workspaceUsedGb: 182.4,
      workspaceQuotaGb: null,
    },
    workspaceRoot: {
      id: "workspace",
      name: "workspace",
      kind: "folder",
      description: "办公虾主目录，承载组织共享、用户资料、记忆与执行产物。",
      children: [
        {
          id: "core",
          name: "core",
          kind: "folder",
          description: "Claw 核心身份和行为文件。",
          children: [
            {
              id: "core-identity-md",
              name: "identity.md",
              kind: "file",
              sizeLabel: "1.3 KB",
              updatedAt: "2026-04-06 08:20",
              updatedBy: "产品运营 陈昭",
              description: "Claw 身份定义。",
            },
            {
              id: "core-bootstrap-md",
              name: "bootstrap.md",
              kind: "file",
              sizeLabel: "0.9 KB",
              updatedAt: "2026-04-06 08:20",
              updatedBy: "产品运营 陈昭",
              description: "启动说明与初始化指令。",
            },
            {
              id: "core-rules-md",
              name: "rules.md",
              kind: "file",
              sizeLabel: "1.1 KB",
              updatedAt: "2026-04-06 08:20",
              updatedBy: "产品运营 陈昭",
              description: "行为边界与执行规则。",
            },
            {
              id: "core-manifest-json",
              name: "manifest.json",
              kind: "file",
              sizeLabel: "3 KB",
              updatedAt: "2026-04-06 08:20",
              updatedBy: "系统",
              description: "工作空间元信息，不建议直接编辑。",
            },
          ],
        },
        {
          id: "users",
          name: "users",
          kind: "folder",
          description: "企业办公用户目录，每个用户单独沉淀资料与偏好。",
          children: [
            {
              id: "users-liran",
              name: "li-ran",
              kind: "folder",
              children: [
                {
                  id: "users-liran-profile",
                  name: "profile.md",
                  kind: "file",
                  sizeLabel: "12 KB",
                  updatedAt: "2026-04-06 09:58",
                  updatedBy: "办公虾",
                  description: "李然的常用报销偏好、默认成本中心和审批路径。",
                },
                {
                  id: "users-liran-preferences",
                  name: "preferences.md",
                  kind: "file",
                  sizeLabel: "4 KB",
                  updatedAt: "2026-04-06 09:58",
                  updatedBy: "办公虾",
                },
                {
                  id: "users-liran-context",
                  name: "context.md",
                  kind: "file",
                  sizeLabel: "6 KB",
                  updatedAt: "2026-04-06 09:58",
                  updatedBy: "办公虾",
                },
              ],
            },
            {
              id: "users-zhouning",
              name: "zhou-ning",
              kind: "folder",
              children: [
                {
                  id: "users-zhouning-profile",
                  name: "profile.md",
                  kind: "file",
                  sizeLabel: "10 KB",
                  updatedAt: "2026-04-06 09:08",
                  updatedBy: "办公虾",
                },
                {
                  id: "users-zhouning-preferences",
                  name: "preferences.md",
                  kind: "file",
                  sizeLabel: "3 KB",
                  updatedAt: "2026-04-06 09:08",
                  updatedBy: "办公虾",
                },
                {
                  id: "users-zhouning-context",
                  name: "context.md",
                  kind: "file",
                  sizeLabel: "4 KB",
                  updatedAt: "2026-04-06 09:08",
                  updatedBy: "办公虾",
                },
              ],
            },
          ],
        },
        {
          id: "memory",
          name: "memory",
          kind: "folder",
          description: "组织级、项目级和个人级记忆分层存储。",
          children: [
            {
              id: "memory-org",
              name: "org",
              kind: "folder",
              children: [
                {
                  id: "memory-org-memory",
                  name: "memory.md",
                  kind: "file",
                  sizeLabel: "96 KB",
                  updatedAt: "2026-04-05 18:10",
                  updatedBy: "财务共享中心",
                  description: "组织统一差旅制度与费用标准。",
                },
              ],
            },
            {
              id: "memory-claw",
              name: "claw",
              kind: "folder",
              children: [
                {
                  id: "memory-claw-memory",
                  name: "memory.md",
                  kind: "file",
                  sizeLabel: "18 KB",
                  updatedAt: "2026-04-06 10:14",
                  updatedBy: "办公虾",
                  description: "当前 Claw 的专属长期记忆。",
                },
              ],
            },
            {
              id: "memory-users",
              name: "users",
              kind: "folder",
              children: [
                {
                  id: "memory-users-liran",
                  name: "li-ran",
                  kind: "folder",
                  children: [
                    {
                      id: "memory-users-liran-memory",
                      name: "memory.md",
                      kind: "file",
                      sizeLabel: "18 KB",
                      updatedAt: "2026-04-06 10:14",
                      updatedBy: "办公虾",
                      description: "本次差旅报销过程中的偏好与确认记录。",
                    },
                  ],
                },
              ],
            },
            {
              id: "memory-sessions",
              name: "sessions",
              kind: "folder",
              children: [
                {
                  id: "memory-session-office-shrimp-expense",
                  name: "office-shrimp-expense",
                  kind: "folder",
                  children: [
                    {
                      id: "memory-session-office-shrimp-expense-memory",
                      name: "memory.md",
                      kind: "file",
                      sizeLabel: "9 KB",
                      updatedAt: "2026-04-06 10:14",
                      updatedBy: "办公虾",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "shared",
          name: "shared",
          kind: "folder",
          description: "项目和组织共享文件。",
          children: [
            {
              id: "shared-templates",
              name: "templates",
              kind: "folder",
              children: [
                {
                  id: "shared-template-expense",
                  name: "expense-form-template.xlsx",
                  kind: "file",
                  sizeLabel: "248 KB",
                  updatedAt: "2026-04-01 14:22",
                  updatedBy: "财务共享中心",
                },
              ],
            },
            {
              id: "shared-documents",
              name: "documents",
              kind: "folder",
              children: [],
            },
            {
              id: "shared-examples",
              name: "examples",
              kind: "folder",
              children: [],
            },
          ],
        },
        {
          id: "sessions",
          name: "sessions",
          kind: "folder",
          description: "会话上传、过程文件与最终结果。",
          children: [
            {
              id: "sessions-office-shrimp-expense",
              name: "office-shrimp-expense",
              kind: "folder",
              children: [
                {
                  id: "sessions-office-shrimp-expense-attachments",
                  name: "attachments",
                  kind: "folder",
                  children: [],
                },
                {
                  id: "sessions-office-shrimp-expense-intermediate",
                  name: "intermediate",
                  kind: "folder",
                  children: [],
                },
                {
                  id: "sessions-office-shrimp-expense-final",
                  name: "final",
                  kind: "folder",
                  children: [],
                },
              ],
            },
          ],
        },
        {
          id: "output",
          name: "output",
          kind: "folder",
          description: "自动化任务和会话执行产物。",
          children: [
            {
              id: "output-tasks",
              name: "tasks",
              kind: "folder",
              children: [],
            },
            {
              id: "output-automations",
              name: "automations",
              kind: "folder",
              children: [
                {
                  id: "output-automation-run-20260406-1800",
                  name: "automation-run-20260406-1800",
                  kind: "folder",
                  children: [
                    {
                      id: "output-reminder-20260406",
                      name: "pending-materials-2026-04-06.md",
                      kind: "file",
                      sizeLabel: "28 KB",
                      updatedAt: "2026-04-06 09:08",
                      updatedBy: "办公虾",
                    },
                  ],
                },
              ],
            },
            {
              id: "output-exports",
              name: "exports",
              kind: "folder",
              children: [
                {
                  id: "output-approval-bx",
                  name: "BX-20260406-018.json",
                  kind: "file",
                  sizeLabel: "9 KB",
                  updatedAt: "2026-04-06 10:14",
                  updatedBy: "办公虾",
                  description: "差旅报销审批发起结果回执。",
                },
              ],
            },
          ],
        },
        {
          id: "tmp",
          name: "tmp",
          kind: "folder",
          description: "解析、转换、工具执行产生的临时文件。",
          children: [
            {
              id: "tmp-runtime-office-20260406",
              name: "runtime-office-20260406",
              kind: "folder",
              children: [],
            },
          ],
        },
      ],
    },
    messageLogs: [
      {
        time: "2026-04-06 10:14",
        peer: "员工 李然",
        summary: "完成差旅报销技能执行、两条工作流调用和审批发起。",
      },
      {
        time: "2026-04-06 09:08",
        peer: "行政同学 周宁",
        summary: "生成两笔待补件报销的提醒摘要，等待统一外发。",
      },
    ],
    taskLogs: [
      {
        time: "2026-04-06 08:30",
        taskName: "每日待补件报销提醒",
        result: "已汇总 2 笔待补件报销单，提醒草稿已生成。",
      },
      {
        time: "2026-04-05 18:00",
        taskName: "审批超时催办",
        result: "识别 1 条超时审批链路，催办信息已推送给申请人。",
      },
    ],
    conversationRuns: [
      {
        id: "office-shrimp-expense",
        title: "差旅报销处理",
        channel: "Agent广场",
        userIdentity: "员工 李然",
        sessionId: "office-shrimp-session-001",
        traceId: "trace-office-shrimp-001",
        startedAt: "2026-04-06 10:12:03",
        updatedAt: "2026-04-06 10:14:16",
        turns: [
          {
            id: "office-shrimp-turn-1",
            turnNumber: 1,
            occurredAt: "10:12",
            userInput: "帮我提交这笔差旅报销，验票、填单并发起审批。",
            assistantOutput:
              "已完成差旅报销技能调用，并串联验票工作流和差旅表单填写与提交工作流。当前等待 HitL 确认后发起审批。",
            traceId: "trace-office-shrimp-001",
            auditRecords: [
              {
                id: "office-audit-1",
                turnId: "office-shrimp-turn-1",
                type: "工具执行",
                targetName: "技能：差旅报销",
                inputSummary:
                  '{\n  "intent": "travel_expense.submit",\n  "skillId": "skill-travel-expense-v3",\n  "locale": "zh-CN"\n}',
                outputSummary:
                  '{\n  "matched": true,\n  "nextWorkflows": ["invoice-verify-v2", "erp-reimbursement-draft-v1"],\n  "confidence": 0.94\n}',
                durationMs: 230,
                status: "成功",
                traceId: "trace-office-shrimp-001",
              },
              {
                id: "office-audit-2",
                turnId: "office-shrimp-turn-1",
                type: "工作流节点",
                targetName: "验票工作流 / OCR 识别发票",
                inputSummary:
                  '{\n  "node": "ocr.ingest",\n  "assets": ["flight-itinerary.pdf", "hotel-invoice.jpg", "taxi-e-receipt.png"],\n  "engine": "tesseract+layoutlm"\n}',
                outputSummary:
                  '{\n  "documents": 3,\n  "fieldsExtracted": ["amount", "tax", "sellerName", "buyerTitle"],\n  "avgConfidence": 0.91\n}',
                durationMs: 820,
                status: "成功",
                traceId: "trace-office-shrimp-001",
              },
              {
                id: "office-audit-3",
                turnId: "office-shrimp-turn-1",
                type: "工作流节点",
                targetName: "验票工作流 / 票据信息结构化提取",
                inputSummary:
                  '{\n  "node": "normalize.invoices",\n  "schema": "corp.invoice.v2",\n  "strictTypes": true\n}',
                outputSummary:
                  '{\n  "normalized": [\n    { "id": "inv-001", "amountCents": 128000, "taxCents": 7680 },\n    { "id": "inv-002", "amountCents": 98000, "taxCents": 5880 },\n    { "id": "inv-003", "amountCents": 260000, "taxCents": 15600 }\n  ]\n}',
                durationMs: 360,
                status: "成功",
                traceId: "trace-office-shrimp-001",
              },
              {
                id: "office-audit-4",
                turnId: "office-shrimp-turn-1",
                type: "接口调用",
                targetName: "验票工作流 / 调企业验票系统核查",
                inputSummary:
                  '{\n  "POST": "/api/v1/invoice/verify-batch",\n  "body": { "invoices": ["inv-001", "inv-002", "inv-003"], "employeeId": "emp-7741" }\n}',
                outputSummary:
                  '{\n  "results": [\n    { "id": "inv-001", "duplicate": false, "authentic": true },\n    { "id": "inv-002", "duplicate": false, "authentic": true },\n    { "id": "inv-003", "duplicate": false, "authentic": true }\n  ]\n}',
                durationMs: 540,
                status: "成功",
                traceId: "trace-office-shrimp-001",
              },
              {
                id: "office-audit-5",
                turnId: "office-shrimp-turn-1",
                type: "工作流节点",
                targetName: "验票工作流 / 合规规则校验",
                inputSummary:
                  '{\n  "node": "policy.evaluate",\n  "policyPack": "travel-2026-Q2",\n  "ruleset": ["per_diem", "receipt_type", "trip_justification"]\n}',
                outputSummary: '{\n  "violations": [],\n  "materialCompleteness": "ok",\n  "evaluatedAt": "2026-04-06T02:12:18Z"\n}',
                durationMs: 290,
                status: "成功",
                traceId: "trace-office-shrimp-001",
              },
              {
                id: "office-audit-6",
                turnId: "office-shrimp-turn-1",
                type: "工作流节点",
                targetName: "差旅表单填写与提交工作流 / 提取出行信息",
                inputSummary:
                  '{\n  "node": "trip.extract",\n  "sources": ["normalized_invoices", "travel_memo.md"],\n  "outputShape": "erp.trip_segment[]"\n}',
                outputSummary:
                  '{\n  "segments": [\n    { "from": "SHA", "to": "SZX", "depart": "2026-03-28", "return": "2026-03-31" }\n  ],\n  "lodgingNights": 3,\n  "localTransportCents": 186000\n}',
                durationMs: 310,
                status: "成功",
                traceId: "trace-office-shrimp-001",
              },
              {
                id: "office-audit-7",
                turnId: "office-shrimp-turn-1",
                type: "工作流节点",
                targetName: "差旅表单填写与提交工作流 / 映射报销字段",
                inputSummary:
                  '{\n  "node": "erp.map_fields",\n  "form": "BX-DRAFT-V12",\n  "mappingProfile": "finance.cost_center.default"\n}',
                outputSummary:
                  '{\n  "totalAmountCents": 486000,\n  "lines": [\n    { "gl": "660203", "costCenter": "CC-SH-RD", "amountCents": 486000 }\n  ],\n  "approvalChain": ["mgr-01", "fin-02"]\n}',
                durationMs: 270,
                status: "成功",
                traceId: "trace-office-shrimp-001",
              },
              {
                id: "office-audit-8",
                turnId: "office-shrimp-turn-1",
                type: "工作流节点",
                targetName: "差旅表单填写与提交工作流 / 自动填充表单",
                inputSummary:
                  '{\n  "node": "erp.reimbursement.apply_patch",\n  "draftId": null,\n  "patch": { "op": "merge", "path": "/draft/lines", "valueRef": "mapped_lines_v7" }\n}',
                outputSummary:
                  '{\n  "draftId": "BX-20260406-018",\n  "status": "pending_submit",\n  "erpRevision": 3\n}',
                durationMs: 410,
                status: "成功",
                traceId: "trace-office-shrimp-001",
              },
              {
                id: "office-audit-9",
                turnId: "office-shrimp-turn-1",
                type: "接口调用",
                targetName: "差旅表单填写与提交工作流 / 写入 ERP",
                inputSummary:
                  '{\n  "PUT": "/erp/api/reimbursements/drafts/BX-20260406-018",\n  "body": { "state": "draft", "hitlGate": "before_submit" }\n}',
                outputSummary:
                  '{\n  "saved": true,\n  "etag": "rev-3",\n  "nextAction": "await_human_confirm"\n}',
                durationMs: 620,
                status: "成功",
                traceId: "trace-office-shrimp-001",
              },
              {
                id: "office-audit-10",
                turnId: "office-shrimp-turn-1",
                type: "工具执行",
                targetName: "HitL / 发起审批确认",
                inputSummary:
                  '{\n  "tool": "hitl.prompt",\n  "surface": "unified_portal",\n  "payloadRef": "BX-20260406-018.summary.json"\n}',
                outputSummary:
                  '{\n  "uiSessionId": "hitl-sess-9f3c",\n  "presented": ["totals", "invoice_results", "approval_chain"],\n  "userDecision": null\n}',
                durationMs: 120,
                status: "成功",
                traceId: "trace-office-shrimp-001",
              },
            ],
          },
          {
            id: "office-shrimp-turn-2",
            turnNumber: 2,
            occurredAt: "10:14",
            userInput: "确认发起审批。",
            assistantOutput: "已发起审批，审批链已推送到直属主管和财务复核。",
            traceId: "trace-office-shrimp-002",
            auditRecords: [
              {
                id: "office-audit-11",
                turnId: "office-shrimp-turn-2",
                type: "接口调用",
                targetName: "ERP MCP / 发起报销审批",
                inputSummary:
                  '{\n  "mcp": "erp.reimbursement",\n  "method": "submit_for_approval",\n  "arguments": { "draftId": "BX-20260406-018", "confirmedBy": "emp-7741" }\n}',
                outputSummary:
                  '{\n  "approvalInstanceId": "appr-88c1",\n  "todoSynced": true,\n  "workflowEngine": "bpm-prod-01"\n}',
                durationMs: 540,
                status: "成功",
                traceId: "trace-office-shrimp-002",
              },
            ],
          },
        ],
      },
      {
        id: "office-shrimp-reminder",
        title: "报销补件提醒",
        channel: "API调用",
        userIdentity: "行政同学 周宁",
        sessionId: "office-shrimp-session-002",
        traceId: "trace-office-shrimp-101",
        startedAt: "2026-04-06 09:08:11",
        updatedAt: "2026-04-06 09:08:42",
        turns: [
          {
            id: "office-shrimp-turn-reminder-1",
            turnNumber: 1,
            occurredAt: "09:08",
            userInput: "本周仍有 2 笔差旅报销待补件，是否统一发起提醒？",
            assistantOutput: "已按员工分组生成提醒文案，待确认后可统一发送。",
            traceId: "trace-office-shrimp-101",
            auditRecords: [
              {
                id: "office-audit-12",
                turnId: "office-shrimp-turn-reminder-1",
                type: "工具执行",
                targetName: "补件提醒技能",
                inputSummary:
                  '{\n  "skillId": "skill-reimbursement-reminder",\n  "query": { "status": "pending_materials", "window": "7d" },\n  "groupBy": "employeeId"\n}',
                outputSummary:
                  '{\n  "groups": 2,\n  "draftMessages": ["dm-template-v4#A", "dm-template-v4#B"],\n  "channels": ["feishu", "email"]\n}',
                durationMs: 260,
                status: "成功",
                traceId: "trace-office-shrimp-101",
              },
            ],
          },
        ],
      },
      {
        id: "office-shrimp-debug",
        title: "报销流程调试",
        channel: "预览与调试",
        userIdentity: "调试用户",
        sessionId: "office-shrimp-session-003",
        traceId: "trace-office-shrimp-debug-001",
        startedAt: "2026-04-05 16:40:18",
        updatedAt: "2026-04-05 16:42:05",
        turns: [
          {
            id: "office-shrimp-turn-debug-1",
            turnNumber: 1,
            occurredAt: "16:40",
            userInput: "用样例发票试跑验票工作流，检查 OCR 字段映射和合规规则是否命中。",
            assistantOutput:
              "调试运行已完成：3 张样例票据全部通过结构化与合规校验，字段映射结果与预期一致，可继续联调 ERP 草稿写入节点。",
            traceId: "trace-office-shrimp-debug-001",
            auditRecords: [
              {
                id: "office-audit-debug-1",
                turnId: "office-shrimp-turn-debug-1",
                type: "工作流节点",
                targetName: "验票工作流 / OCR 识别发票（调试）",
                inputSummary:
                  '{\n  "node": "ocr.ingest",\n  "mode": "debug",\n  "assets": ["sample-flight.pdf", "sample-hotel.jpg"],\n  "dryRun": true\n}',
                outputSummary:
                  '{\n  "documents": 2,\n  "fieldsExtracted": ["amount", "tax", "sellerName"],\n  "avgConfidence": 0.93\n}',
                durationMs: 410,
                status: "成功",
                traceId: "trace-office-shrimp-debug-001",
              },
              {
                id: "office-audit-debug-2",
                turnId: "office-shrimp-turn-debug-1",
                type: "工作流节点",
                targetName: "验票工作流 / 合规规则校验（调试）",
                inputSummary:
                  '{\n  "node": "policy.evaluate",\n  "policyPack": "travel-2026-Q2",\n  "mode": "debug"\n}',
                outputSummary: '{\n  "violations": [],\n  "mappingCheck": "passed",\n  "evaluatedAt": "2026-04-05T08:41:52Z"\n}',
                durationMs: 180,
                status: "成功",
                traceId: "trace-office-shrimp-debug-001",
              },
            ],
          },
        ],
      },
    ],
    taskRuns: [
      {
        id: "office-task-run-1",
        taskName: "每日待补件报销提醒",
        taskType: "自动化任务",
        triggerSource: "每天 18:00",
        startedAt: "2026-04-06 18:00:00",
        finishedAt: "2026-04-06 18:00:41",
        durationMs: 41000,
        status: "成功",
        resultSummary: "已整理 2 笔待补件报销单，并生成可发送提醒草稿。",
        traceId: "trace-office-task-001",
      },
      {
        id: "office-task-run-2",
        taskName: "审批超时催办",
        taskType: "催办任务",
        triggerSource: "审批节点超时 24 小时",
        startedAt: "2026-04-05 18:10:02",
        finishedAt: "2026-04-05 18:10:25",
        durationMs: 23000,
        status: "成功",
        resultSummary: "已识别 1 条超时审批链路并同步给申请人与直属主管。",
        traceId: "trace-office-task-002",
      },
    ],
    securityEvents: [
      {
        id: "office-security-1",
        time: "2026-04-06 10:13:21",
        level: "中",
        stage: "工具结果回写前",
        ruleName: "ERP 写入审批门禁",
        action: "记录",
        contentSummary: "报销草稿 BX-20260406-018 已写入 ERP，但审批提交动作被挂起等待 HitL 确认。",
        sourceType: "会话运行",
        sourceName: "差旅报销处理 / 第 1 轮",
        traceId: "trace-office-shrimp-001",
      },
      {
        id: "office-security-2",
        time: "2026-04-06 10:14:12",
        level: "低",
        stage: "输出阶段",
        ruleName: "银行卡号脱敏",
        action: "脱敏",
        contentSummary: "审批说明中的银行卡号仅保留后四位，其余字段已自动脱敏。",
        sourceType: "会话运行",
        sourceName: "差旅报销处理 / 第 2 轮",
        traceId: "trace-office-shrimp-002",
      },
      {
        id: "office-security-3",
        time: "2026-04-06 10:13:05",
        level: "低",
        stage: "输入阶段",
        ruleName: "费用科目白名单校验",
        action: "放行",
        contentSummary: "识别到“差旅交通费”“住宿费”两个费用科目，命中内部白名单后继续执行。",
        sourceType: "会话运行",
        sourceName: "差旅报销处理 / 第 1 轮",
        traceId: "trace-office-shrimp-001",
      },
    ],
    securityManagement: {
      autonomyBoundaries: [
        {
          id: "office-boundary-read-policy",
          name: "读取制度与票据",
          description: "读取差旅制度、票据附件和历史报销草稿与范畴说明",
          level: "L1：直接放行",
        },
        {
          id: "office-boundary-write-erp-draft",
          name: "写入 ERP 单据",
          description: "将报销单据写入 ERP 系统并回传处理状态",
          level: "L2：需用户审批",
        },
        {
          id: "office-boundary-launch-approval",
          name: "发起审批",
          description: "将报销单据提交到正式审批链路",
          level: "L2：需用户审批",
        },
        {
          id: "office-boundary-send-reminder",
          name: "发送提醒消息",
          description: "向员工或行政服务发送邮件或即时处理通知",
          level: "L2：需用户审批",
        },
        {
          id: "office-boundary-task",
          name: "管理自动化任务",
          description: "创建、更新、启停或删除报销相关的自动化任务",
          level: "L1：直接放行",
        },
      ],
      toolProtection: createDefaultToolProtection({
        protectedTools: ["erp.write_draft", "feishu.message_batch"],
        prohibitedTools: ["shell.exec", "workspace.format_disk"],
      }),
      fileProtection: createDefaultFileProtection([
        {
          id: "office-fp-hr-salary",
          path: "/share/hr/薪酬与个税敏感目录/",
          kind: "directory",
        },
        {
          id: "office-fp-finance-keys",
          path: "/var/oa/finance/.credential_store/",
          kind: "directory",
        },
        {
          id: "office-fp-pii-rules",
          path: "/data/office-shrimp/config/pii_mask_rules.json",
          kind: "file",
        },
        {
          id: "office-fp-employee-ssn",
          path: "/archive/reimburse/employee_identities.csv",
          kind: "file",
        },
      ]),
      securityApprovals: createDefaultSecurityApprovals(
        [
          {
            id: "office-approval-erp-submit",
            actionName: "submit_erp_approval",
            payload: `{ "tool": "erp.submit_approval", "args": { "draftId": "BX-20260410-031", "amountCny": 4820.5, "costCenter": "RD-上海", "applicant": "李然" }, "requested_by": "office-shrimp-runtime" }`,
            requestedAt: "2026/4/10 09:48:22",
            requestedBy: "office-shrimp-runtime",
          },
          {
            id: "office-approval-bulk-export",
            actionName: "export_reimbursement_batch",
            payload: `{ "tool": "workspace.export_excel", "args": { "scope": "部门=研发中心", "month": "2026-03", "containsPii": true }, "requested_by": "office-shrimp-runtime" }`,
            requestedAt: "2026/4/10 10:05:03",
            requestedBy: "office-shrimp-runtime",
          },
        ],
        [
          {
            id: "office-hist-feishu-bulk",
            actionName: "send_bulk_feishu",
            resolution: "approved",
            resolvedAt: "2026/4/9 18:02:11",
            detail: `{ "tool": "feishu.message_batch", "template": "reimburse_reminder_v4", "recipients": 12, "channel": "部门群" }`,
          },
          {
            id: "office-hist-delete-temp",
            actionName: "delete_temp_attachments",
            resolution: "rejected",
            resolvedAt: "2026/4/8 11:16:40",
            detail: `{ "tool": "workspace.delete_files", "paths": ["uploads/tmp/*"], "reason_hint": "批量删除范围过大" }`,
          },
          {
            id: "office-hist-erp-draft",
            actionName: "overwrite_erp_draft",
            resolution: "approved",
            resolvedAt: "2026/4/7 16:21:08",
            detail: `{ "tool": "erp.patch_draft", "draftId": "BX-20260405-009", "fields": ["costCenter", "invoiceNo"] }`,
          },
        ]
      ),
    },
    personRelations: [
      {
        name: "李然",
        role: "普通员工",
        description: "从统一入口发起差旅报销，是办公虾本次演示的主要服务对象。",
      },
      {
        name: "周宁",
        role: "行政同学",
        description: "负责处理待补件提醒和异常报销单跟进，关注提醒结果和执行稳定性。",
      },
      {
        name: "财务复核 王敏",
        role: "财务复核",
        description: "关注 ERP 字段映射准确性和审批发起前的校验结果。",
      },
    ],
    agentRelations: [
      {
        id: "ar-office-gateway",
        name: "企业虾总入口",
        relationship: "协作",
        originalDescription: "当识别到差旅报销任务时，把上下文和材料交给办公虾处理。",
        personalizedDescription: "统一承接员工办公诉求并把任务分发给专属虾。",
      },
      {
        id: "ar-office-finance",
        name: "财务规则 Agent",
        relationship: "协作",
        originalDescription: "与办公虾配合，确保制度解释和报销校验口径一致。",
        personalizedDescription: "把企业制度与财务规则转换成可执行的字段校验和审批约束。",
      },
    ],
    usageSettings: [
      {
        label: "Token 上限",
        value: "120,000 / 日",
        description: "面向高频办公任务配置的日常调用额度。",
      },
      {
        label: "任务并发",
        value: "2 个",
        description: "保证差旅报销等任务稳定执行，不因并发过高影响结果一致性。",
      },
      {
        label: "附件保留窗口",
        value: "7 天",
        description: "票据附件默认保留 7 天，超期后只保留结构化摘要。",
      },
    ],
    permissionSettings: [
      {
        name: "制度中心读取",
        scope: "租户差旅制度库",
        mode: "允许",
      },
      {
        name: "ERP 草稿写入",
        scope: "报销模块草稿区",
        mode: "允许写入",
      },
      {
        name: "正式审批提交",
        scope: "ERP 报销审批链",
        mode: "需人工确认",
      },
    ],
  },
  "claw-intel-shrimp": {
    ...buildFallbackDetail(clawHubList[6]!),
    overview: {
      ...clawHubList[6]!,
      version: "v2.0.1",
      createdAt: "2026-03-16 14:00",
    },
    chatSessions: [
      {
        id: "intel-shrimp-weekly-brief",
        title: "统一入口 / 企业虾",
        source: "员工情报入口",
        preview: "搜集本周竞品动态和行业政策变化，输出一份符合公司规范的情报简报。",
        updatedAt: "今天 11:08",
        unreadCount: 0,
        messages: [
          {
            id: "intel-shrimp-brief-1",
            role: "user",
            sender: "战略分析师 周衡",
            time: "11:03",
            content: "搜集本周竞品动态和行业政策变化，输出一份符合公司规范的情报简报。",
          },
          {
            id: "intel-shrimp-brief-2",
            role: "assistant",
            sender: "情报虾",
            time: "11:03",
            content:
              "我先思考本次情报任务的处理链路：多源采集、去重过滤、敏感校验、结构化拆解，再结合本体历史数据做真伪研判、重要性回填、图谱溯源和本体回写。",
            auditTurnId: "intel-shrimp-turn-1",
          },
          {
            id: "intel-shrimp-brief-3",
            role: "tool",
            sender: "情报虾",
            toolLabel: "情报处理链路",
            time: "11:04",
            content:
              "已启动情报处理链路\n- 已接入：本体情报源接入\n- 已启动：多源采集与去重过滤\n- 已开启：真伪与重要性研判\n- 已支持：查看依据 / 图谱溯源",
            auditTurnId: "intel-shrimp-turn-1",
          },
          {
            id: "intel-shrimp-brief-4",
            role: "assistant",
            sender: "情报虾",
            time: "11:06",
            content:
              "已完成多源采集和去重过滤，筛选出 6 条有效动态，其中 2 条为高优重点。当前正在把真伪研判和重要性结果回填到本体，并准备生成结构化情报简报。",
            auditTurnId: "intel-shrimp-turn-1",
          },
          {
            id: "intel-shrimp-brief-5",
            role: "assistant",
            sender: "情报虾",
            time: "11:08",
            content:
              "情报简报和 Word 文档已生成，重点动态均支持“查看依据”下钻来源与图谱关系。你可以直接查看重点条目，也可以下载完整周报文档。",
            attachments: ["market-intel-weekly-brief.docx"],
            auditTurnId: "intel-shrimp-turn-1",
          },
          {
            id: "intel-shrimp-brief-6",
            role: "user",
            sender: "战略分析师 周衡",
            time: "11:09",
            content: "查看“竞品发布算力调度新品”这条重点动态的依据。",
          },
          {
            id: "intel-shrimp-brief-7",
            role: "assistant",
            sender: "情报虾",
            time: "11:09",
            content:
              "已展开来源依据与图谱关系：当前重点动态来自 2 条公开新闻、1 条公司公告和 1 条历史本体关联记录，图谱中可继续查看关联产品线、监管政策和历史动作。",
            auditTurnId: "intel-shrimp-turn-2",
          },
        ],
      },
      {
        id: "intel-shrimp-daily-watch",
        title: "市场情报群",
        source: "自动周报提醒",
        preview: "本周新增 2 条高优竞品动态，是否同步给战略例会群？",
        updatedAt: "今天 08:42",
        unreadCount: 1,
        messages: [
          {
            id: "intel-shrimp-watch-1",
            role: "user",
            sender: "市场情报运营",
            time: "08:42",
            content: "本周新增 2 条高优竞品动态，是否同步给战略例会群？",
          },
          {
            id: "intel-shrimp-watch-2",
            role: "assistant",
            sender: "情报虾",
            time: "08:42",
            content: "可以，我先按安全校验规则过滤敏感字段，再生成适合例会群的摘要版本。",
            auditTurnId: "intel-shrimp-turn-watch-1",
          },
        ],
      },
    ],
    coreFiles: [
      createClawAgentMdFile(`# 情报虾

## 身份
- 企业情报归集与研判 Agent，服务于情报研判场景

## 目标
- 负责竞品动态、行业政策等多源情报的采集、筛选和结构化整理
- 产出结构化情报简报，并把结果沉淀回本体

## 服务对象
- 情报分析人员、战略与产品决策团队

## 工作方式
- 冷静、严谨、可追溯；先给重点结论，再说明来源和依据
- 先采集、再校验、再研判、最后沉淀
- 高敏情报须经安全校验 MCP 后再进入简报生成

## 行为边界
- 不跳过安全校验直接外发情报内容
- 本体回写需保留来源依据和字段变更留痕
- 高敏内容须先命中安全校验再决定是否拦截或放行`),
    ],
    capabilityConfig: {
      tools: {
        platform: buildBuiltinClawPlatformTools("intel-shrimp-tool-"),
        tenant: [
          {
            id: "intel-shrimp-tool-competitor-feed",
            name: "竞品动态采集器",
            description: "订阅公开新闻、公司公告和行业站点的竞品动态源。",
            enabled: true,
            badge: "租户配置",
            meta: "接口",
          },
          {
            id: "intel-shrimp-tool-policy-feed",
            name: "政策公告聚合器",
            description: "汇总部委政策、行业规范和地方监管公告。",
            enabled: true,
            badge: "租户配置",
            meta: "接口",
          },
          {
            id: "intel-shrimp-tool-word-export",
            name: "Word 导出 OpenAPI",
            description: "把结构化情报简报转换成正式 Word 文档并生成下载结果。",
            enabled: true,
            badge: "租户配置",
            meta: "OpenAPI",
          },
        ],
        claw: [
          {
            id: "intel-shrimp-workflow-process-chain",
            name: "情报处理链路",
            description: "完成多源采集、去重过滤、敏感校验和结构化拆解。",
            enabled: true,
            badge: "Claw配置",
            meta: "工作流",
            kind: "workflow",
            origin: "public_config",
          },
          {
            id: "intel-shrimp-workflow-graph-trace",
            name: "扩散检索 / 图谱溯源",
            description: "围绕重点动态做关联扩散、本体检索和图谱关系溯源。",
            enabled: true,
            badge: "Claw配置",
            meta: "工作流",
            kind: "workflow",
            origin: "claw_only",
          },
          {
            id: "intel-shrimp-action-ontology-writeback",
            name: "本体回写 Action",
            description: "把真伪、重要性、来源依据和关联对象写回情报本体。",
            enabled: true,
            badge: "Claw配置",
            meta: "动作",
            kind: "plugin",
            origin: "claw_only",
          },
        ],
      },
      skills: {
        platform: buildBuiltinClawPlatformSkills("intel-shrimp-skill-"),
        tenant: [
          {
            id: "intel-shrimp-skill-policy-screening",
            name: "policy-screening",
            description: "租户共享的政策筛选和摘要技能。",
            enabled: true,
            sizeLabel: "0.4 KB",
          },
        ],
        claw: [
          {
            id: "intel-shrimp-skill-keywatch",
            name: "重点动态追踪",
            description: "对高优重点动态做连续跟踪、补证和提醒。",
            enabled: true,
            sizeLabel: "0.4 KB",
          },
        ],
      },
      agents: {
        platform: [
          {
            id: "intel-shrimp-agent-brief",
            name: "情报简报生成 Agent",
            description: "将结构化情报对象整理为适合汇报的简报摘要。",
            enabled: true,
            target: "平台预置函数",
          },
        ],
        tenant: [
          {
            id: "intel-shrimp-agent-verification",
            name: "真伪研判 Agent",
            description: "结合历史本体数据和公开来源对重点动态做可信度判断。",
            enabled: true,
            target: "租户共享函数",
          },
        ],
        claw: [
          {
            id: "intel-shrimp-agent-graph",
            name: "图谱溯源 Agent",
            description: "对重点动态做扩散检索、图谱下钻和依据回填。",
            enabled: true,
            target: "Claw私有函数",
          },
        ],
      },
      knowledge: {
        tenant: [
          {
            id: "intel-shrimp-knowledge-market",
            name: "竞品情报知识库",
            description: "沉淀竞品动作、产品信息和市场动态等基础情报。",
            enabled: true,
            documentCount: 86,
            updatedAt: "2026-04-06 10:50",
          },
          {
            id: "intel-shrimp-knowledge-policy",
            name: "政策知识库",
            description: "沉淀行业政策、监管公告和公开解读材料。",
            enabled: true,
            documentCount: 54,
            updatedAt: "2026-04-06 09:40",
          },
        ],
        claw: [
          {
            id: "intel-shrimp-knowledge-cases",
            name: "情报虾重点案例库",
            description: "沉淀高优重点动态的来源依据、研判过程和图谱关系。",
            enabled: true,
            documentCount: 27,
            updatedAt: "2026-04-06 11:02",
          },
        ],
      },
    },
    resourceConfig: {
      runtime: {
        tier: "enhanced",
        maxConcurrentTasks: 8,
        maxTaskDurationMin: 45,
        advanced: {
          cpu: 8,
          memoryGb: 16,
          diskGb: 80,
          runtimeVersion: "intel-runtime-2.0",
          startupTimeoutSec: 120,
        },
      },
      execution: {
        tier: "enhanced",
        workspaceDiskGb: 20,
        maxConcurrentExecutions: 3,
        maxExecutionTimeoutMin: 35,
        capabilities: {
          browser: true,
          python: true,
          shell: false,
          file: true,
          document: true,
          network: true,
        },
      },
    },
    distributionChannels: [
      {
        name: "蓝信",
        status: "已接入",
        appId: "intel-shrimp-lanxin",
        secretIdMasked: "lxsec_****_iq00",
      },
      {
        name: "企业微信",
        status: "已接入",
        appId: "intel-shrimp-wxwork",
        secretIdMasked: "sec_****_iq01",
      },
      {
        name: "飞书",
        status: "已接入",
        appId: "intel-shrimp-lark",
        secretIdMasked: "sec_****_iq02",
      },
      {
        name: "邮件网关",
        status: "已接入",
        appId: "intel-shrimp-mail",
        secretIdMasked: "sec_****_iq03",
      },
      {
        name: "QQ",
        status: "未接入",
        appId: "未配置",
        secretIdMasked: "未配置",
      },
    ],
    taskGroups: [
      {
        title: "自动化任务",
        description: "按固定周期拉取和更新情报内容。",
        tasks: [
          {
            name: "每周情报自动归集",
            trigger: "每周一 08:30",
            status: "已启用",
            note: "自动拉取竞品动态与行业政策变化，生成本周情报简报草稿。",
          },
        ],
      },
      {
        title: "催办任务",
        description: "对重点动态做持续跟踪和补证。",
        tasks: [
          {
            name: "高优动态补证提醒",
            trigger: "重点动态缺少二次来源 12 小时",
            status: "已启用",
            note: "对高优重点动态自动发起补证提醒并等待分析师处理。",
          },
        ],
      },
      {
        title: "条件触发任务",
        description: "根据研判结果自动触发后续动作。",
        tasks: [
          {
            name: "高优情报本体回写",
            trigger: "真伪=高 且 重要性=高",
            status: "已启用",
            note: "自动触发本体回写和周报补充更新。",
          },
        ],
      },
    ],
    automatedTasks: CLAW_AUTOMATED_TASKS_SAMPLE,
    automatedTaskExecutions: CLAW_AUTOMATED_TASK_EXECUTIONS_SAMPLE,
    messageLogs: [
      {
        time: "2026-04-06 11:08",
        peer: "战略分析师 周衡",
        summary: "完成情报处理链路执行、处理链路研判和 Word 周报生成。",
      },
      {
        time: "2026-04-06 08:42",
        peer: "市场情报运营",
        summary: "识别 2 条高优动态，生成安全校验后的例会群摘要版本。",
      },
    ],
    taskLogs: [
      {
        time: "2026-04-06 08:30",
        taskName: "每周情报自动归集",
        result: "已拉取 23 条公开情报，筛选出 6 条有效动态并完成初步结构化。",
      },
      {
        time: "2026-04-05 20:10",
        taskName: "高优动态补证提醒",
        result: "已对 1 条重点动态发起补证提醒，并补充公司公告来源。",
      },
    ],
    conversationRuns: [
      {
        id: "intel-shrimp-weekly-brief",
        title: "情报周报生成",
        channel: "Agent广场",
        userIdentity: "战略分析师 周衡",
        sessionId: "intel-shrimp-session-001",
        traceId: "trace-intel-shrimp-001",
        startedAt: "2026-04-06 11:03:08",
        updatedAt: "2026-04-06 11:08:37",
        turns: [
          {
            id: "intel-shrimp-turn-1",
            turnNumber: 1,
            occurredAt: "11:03",
            userInput: "搜集本周竞品动态和行业政策变化，输出一份符合公司规范的情报简报。",
            assistantOutput:
              "已启动情报处理链路，并完成本体情报源接入、处理链路运行、真伪与重要性研判、本体回写和 Word 文档生成。",
            attachments: ["market-intel-weekly-brief.docx"],
            traceId: "trace-intel-shrimp-001",
            auditRecords: [
              {
                id: "intel-audit-1",
                turnId: "intel-shrimp-turn-1",
                type: "工具执行",
                targetName: "情报处理链路",
                inputSummary:
                  '{\n  "pipeline": "intel.standard.v3",\n  "taskType": "competitor_and_policy_digest",\n  "hooks": ["ontology_mcp", "security_mcp"]\n}',
                outputSummary:
                  '{\n  "runId": "intel-run-9a2f",\n  "status": "started",\n  "stages": ["ingest", "dedupe", "structure", "judge", "export"]\n}',
                durationMs: 260,
                status: "成功",
                traceId: "trace-intel-shrimp-001",
              },
              {
                id: "intel-audit-2",
                turnId: "intel-shrimp-turn-1",
                type: "MCP调用",
                targetName: "情报场景本体 MCP / 本体情报源接入",
                inputSummary:
                  '{\n  "resource": "ontology://intel/competitors",\n  "select": ["entities", "historical_signals", "policy_tags"],\n  "limit": 500\n}',
                outputSummary:
                  '{\n  "entityCount": 14,\n  "historicalRecords": 27,\n  "contextHandle": "ctx-ont-441b"\n}',
                durationMs: 640,
                status: "成功",
                traceId: "trace-intel-shrimp-001",
              },
              {
                id: "intel-audit-3",
                turnId: "intel-shrimp-turn-1",
                type: "工作流节点",
                targetName: "情报处理链路 / 多源采集",
                inputSummary:
                  '{\n  "node": "collect.multi_source",\n  "feeds": ["news", "issuer_filings", "trade_assoc", "regulator_portal"],\n  "timeWindow": "7d"\n}',
                outputSummary: '{\n  "rawItems": 23,\n  "bytesIngested": 1842033,\n  "fetchErrors": 0\n}',
                durationMs: 1180,
                status: "成功",
                traceId: "trace-intel-shrimp-001",
              },
              {
                id: "intel-audit-4",
                turnId: "intel-shrimp-turn-1",
                type: "工作流节点",
                targetName: "情报处理链路 / 去重过滤",
                inputSummary:
                  '{\n  "node": "dedupe.filter",\n  "strategy": "simhash+topic",\n  "minScore": 0.72\n}',
                outputSummary: '{\n  "kept": 6,\n  "dropped": 17,\n  "dropReasons": { "near_dup": 11, "low_signal": 6 }\n}',
                durationMs: 520,
                status: "成功",
                traceId: "trace-intel-shrimp-001",
              },
              {
                id: "intel-audit-5",
                turnId: "intel-shrimp-turn-1",
                type: "MCP调用",
                targetName: "安全校验服务 MCP / 敏感内容校验",
                inputSummary:
                  '{\n  "tool": "security.scan_text",\n  "targets": ["summary", "entity_names", "export_draft"],\n  "ruleset": "external_comms_strict"\n}',
                outputSummary:
                  '{\n  "blockedFragments": 1,\n  "ruleHits": ["codename_unpublished"],\n  "passed": ["summary", "entity_names"]\n}',
                durationMs: 430,
                status: "成功",
                traceId: "trace-intel-shrimp-001",
              },
              {
                id: "intel-audit-6",
                turnId: "intel-shrimp-turn-1",
                type: "工作流节点",
                targetName: "情报处理链路 / 结构化拆解",
                inputSummary:
                  '{\n  "node": "structure.extract",\n  "schema": "intel.signal.v1",\n  "fields": ["actor", "action", "time", "source", "impacted"]\n}',
                outputSummary: '{\n  "signals": 6,\n  "nextStage": "veracity_importance",\n  "artifactRef": "signals-batch-7c91.json"\n}',
                durationMs: 360,
                status: "成功",
                traceId: "trace-intel-shrimp-001",
              },
              {
                id: "intel-audit-7",
                turnId: "intel-shrimp-turn-1",
                type: "工具执行",
                targetName: "真伪与重要性研判 / 历史本体比对",
                inputSummary:
                  '{\n  "tool": "intel.judge.cross_check",\n  "inputs": ["ontology_history", "issuer_filings", "press_wire"],\n  "focusSignalId": "sig-003"\n}',
                outputSummary:
                  '{\n  "signalId": "sig-003",\n  "veracity": "high",\n  "importance": "high",\n  "headline": "竞品发布算力调度新品"\n}',
                durationMs: 870,
                status: "成功",
                traceId: "trace-intel-shrimp-001",
              },
              {
                id: "intel-audit-8",
                turnId: "intel-shrimp-turn-1",
                type: "工具执行",
                targetName: "真伪与重要性研判 / 字段回填",
                inputSummary:
                  '{\n  "tool": "intel.judge.apply_labels",\n  "batchId": "signals-batch-7c91",\n  "writeMode": "merge"\n}',
                outputSummary: '{\n  "updated": 6,\n  "fields": ["veracity", "importance", "rationale_refs"]\n}',
                durationMs: 280,
                status: "成功",
                traceId: "trace-intel-shrimp-001",
              },
              {
                id: "intel-audit-9",
                turnId: "intel-shrimp-turn-1",
                type: "工作流节点",
                targetName: "扩散检索 / 图谱溯源",
                inputSummary:
                  '{\n  "node": "graph.expand",\n  "seed": "sig-003",\n  "depth": 2,\n  "edgeTypes": ["mentions", "supplies", "regulated_by"]\n}',
                outputSummary:
                  '{\n  "nodes": 18,\n  "edges": 27,\n  "evidenceBundles": ["eb-01", "eb-02", "eb-03"]\n}',
                durationMs: 690,
                status: "成功",
                traceId: "trace-intel-shrimp-001",
              },
              {
                id: "intel-audit-10",
                turnId: "intel-shrimp-turn-1",
                type: "接口调用",
                targetName: "本体回写 Action / 写入情报对象",
                inputSummary:
                  '{\n  "POST": "/ontology/v2/intel/batch_upsert",\n  "body": { "signals": 6, "includeEvidence": true }\n}',
                outputSummary:
                  '{\n  "upserted": 6,\n  "tagsAdded": { "priority_watch": 2 },\n  "transactionId": "tx-ont-8831"\n}',
                durationMs: 550,
                status: "成功",
                traceId: "trace-intel-shrimp-001",
              },
              {
                id: "intel-audit-11",
                turnId: "intel-shrimp-turn-1",
                type: "工具执行",
                targetName: "Word 简报生成器",
                inputSummary:
                  '{\n  "tool": "docx.render",\n  "templateId": "intel-brief-corporate-v5",\n  "dataRef": "weekly-brief-2026-W14.json"\n}',
                outputSummary:
                  '{\n  "path": "/workspace/output/deliverables/market-intel-weekly-brief.docx",\n  "sizeBytes": 482910,\n  "downloadToken": "dl-tok-1f9c"\n}',
                durationMs: 460,
                status: "成功",
                traceId: "trace-intel-shrimp-001",
              },
            ],
          },
          {
            id: "intel-shrimp-turn-2",
            turnNumber: 2,
            occurredAt: "11:09",
            userInput: "查看“竞品发布算力调度新品”这条重点动态的依据。",
            assistantOutput: "已展开来源依据、关联产品线和图谱关系。",
            traceId: "trace-intel-shrimp-002",
            auditRecords: [
              {
                id: "intel-audit-12",
                turnId: "intel-shrimp-turn-2",
                type: "MCP调用",
                targetName: "情报场景本体 MCP / 读取关联对象",
                inputSummary:
                  '{\n  "method": "related_objects.get",\n  "signalId": "sig-003",\n  "include": ["product_lines", "policies", "historical"]\n}',
                outputSummary:
                  '{\n  "objects": 4,\n  "graphEdges": 6,\n  "queryMs": 418\n}',
                durationMs: 420,
                status: "成功",
                traceId: "trace-intel-shrimp-002",
              },
              {
                id: "intel-audit-13",
                turnId: "intel-shrimp-turn-2",
                type: "工作流节点",
                targetName: "图谱溯源 / 关系下钻",
                inputSummary:
                  '{\n  "node": "graph.drilldown",\n  "from": "sig-003.source_graph",\n  "maxHops": 3\n}',
                outputSummary:
                  '{\n  "expandedNodes": ["news", "filing", "history", "policy"],\n  "edgeCount": 14,\n  "layout": "evidence_tree"\n}',
                durationMs: 510,
                status: "成功",
                traceId: "trace-intel-shrimp-002",
              },
            ],
          },
        ],
      },
      {
        id: "intel-shrimp-daily-watch",
        title: "高优动态同步",
        channel: "API调用",
        userIdentity: "市场情报运营",
        sessionId: "intel-shrimp-session-002",
        traceId: "trace-intel-shrimp-101",
        startedAt: "2026-04-06 08:42:06",
        updatedAt: "2026-04-06 08:42:40",
        turns: [
          {
            id: "intel-shrimp-turn-watch-1",
            turnNumber: 1,
            occurredAt: "08:42",
            userInput: "本周新增 2 条高优竞品动态，是否同步给战略例会群？",
            assistantOutput: "已生成安全校验后的摘要版本，待确认后可同步到例会群。",
            traceId: "trace-intel-shrimp-101",
            auditRecords: [
              {
                id: "intel-audit-14",
                turnId: "intel-shrimp-turn-watch-1",
                type: "MCP调用",
                targetName: "安全校验服务 MCP / 对外发布校验",
                inputSummary:
                  '{\n  "tool": "security.scan_text",\n  "channel": "external_meeting_group",\n  "profile": "redact_codenames"\n}',
                outputSummary:
                  '{\n  "redactions": 1,\n  "rules": ["codename_unauthorized"],\n  "exportable": true\n}',
                durationMs: 240,
                status: "成功",
                traceId: "trace-intel-shrimp-101",
              },
            ],
          },
        ],
      },
    ],
    taskRuns: [
      {
        id: "intel-task-run-1",
        taskName: "每周情报自动归集",
        taskType: "自动化任务",
        triggerSource: "每周一 08:30",
        startedAt: "2026-04-06 08:30:00",
        finishedAt: "2026-04-06 08:31:12",
        durationMs: 72000,
        status: "成功",
        resultSummary: "已拉取本周竞品和政策动态并形成初步结构化结果。",
        traceId: "trace-intel-task-001",
      },
      {
        id: "intel-task-run-2",
        taskName: "高优动态补证提醒",
        taskType: "催办任务",
        triggerSource: "重点动态缺少二次来源 12 小时",
        startedAt: "2026-04-05 20:10:00",
        finishedAt: "2026-04-05 20:10:28",
        durationMs: 28000,
        status: "成功",
        resultSummary: "已提醒分析师补充 1 条重点动态的二次来源依据。",
        traceId: "trace-intel-task-002",
      },
    ],
    securityEvents: [
      {
        id: "intel-security-1",
        time: "2026-04-06 11:05:14",
        level: "高",
        stage: "输出阶段",
        ruleName: "涉密代号外发拦截",
        action: "拦截",
        contentSummary: "周报草稿中命中未公开项目代号“Northbridge”，已在导出前拦截并要求替换。",
        sourceType: "会话运行",
        sourceName: "情报周报生成 / 第 1 轮",
        traceId: "trace-intel-shrimp-001",
      },
      {
        id: "intel-security-2",
        time: "2026-04-06 11:04:36",
        level: "中",
        stage: "处理阶段",
        ruleName: "来源可信度分层校验",
        action: "记录",
        contentSummary: "对 1 条社媒爆料和 1 条公开新闻进行了可信度分层，未达到直接高优回写门槛。",
        sourceType: "会话运行",
        sourceName: "情报周报生成 / 第 1 轮",
        traceId: "trace-intel-shrimp-001",
      },
      {
        id: "intel-security-3",
        time: "2026-04-06 11:07:55",
        level: "低",
        stage: "本体回写前",
        ruleName: "公开来源白名单",
        action: "放行",
        contentSummary: "行业政策条目全部来自部委官网和公开公告，命中来源白名单后允许回写。",
        sourceType: "会话运行",
        sourceName: "情报周报生成 / 第 1 轮",
        traceId: "trace-intel-shrimp-001",
      },
      {
        id: "intel-security-4",
        time: "2026-04-06 08:42:22",
        level: "中",
        stage: "外发前",
        ruleName: "高优动态摘要安全校验",
        action: "脱敏",
        contentSummary: "例会群摘要中的客户项目代号已脱敏后继续发送。",
        sourceType: "任务运行",
        sourceName: "高优动态同步",
        traceId: "trace-intel-shrimp-101",
      },
    ],
    securityManagement: {
      autonomyBoundaries: [
        {
          id: "intel-boundary-public-search",
          name: "公开情报采集",
          description: "访问公开新闻、公司公告和政策站点采集情报",
          level: "L1：直接放行",
        },
        {
          id: "intel-boundary-ontology-lookup",
          name: "本体扩散检索",
          description: "基于重点动态做本体检索、扩散查询和图谱关系下钻",
          level: "L1：直接放行",
        },
        {
          id: "intel-boundary-ontology-write",
          name: "本体回写",
          description: "把真伪、重要性和来源依据写回情报本体",
          level: "L2：需用户审批",
        },
        {
          id: "intel-boundary-export",
          name: "导出情报文档",
          description: "导出结构化情报简报和正式文档",
          level: "L2：需用户审批",
        },
        {
          id: "intel-boundary-publish",
          name: "对外发布情报摘要",
          description: "向群聊、邮件或例会渠道同步情报摘要",
          level: "L2：需用户审批",
        },
        {
          id: "intel-boundary-task",
          name: "管理自动化任务",
          description: "创建、更新、启停或删除采集与投递相关的自动化任务",
          level: "L1：直接放行",
        },
      ],
      toolProtection: createDefaultToolProtection(),
      fileProtection: createDefaultFileProtection([]),
      securityApprovals: createDefaultSecurityApprovals([], []),
    },
    personRelations: [
      {
        name: "周衡",
        role: "战略分析师",
        description: "关注重点竞品动态和政策变化，是情报虾本次演示的主要使用者。",
      },
      {
        name: "市场情报运营",
        role: "情报运营",
        description: "负责周报投递和高优动态同步，关注安全校验和摘要质量。",
      },
      {
        name: "法务合规 赵睿",
        role: "法务合规",
        description: "关注政策内容和对外发布时的敏感信息风险。",
      },
    ],
    agentRelations: [
      {
        id: "ar-intel-gateway",
        name: "企业虾总入口",
        relationship: "上级",
        originalDescription: "识别为情报分析任务后，把需求、时间范围和主题上下文交给情报虾。",
        personalizedDescription: "统一承接员工的情报需求并分发给情报虾处理。",
      },
      {
        id: "ar-intel-graph",
        name: "图谱溯源 Agent",
        relationship: "协作",
        originalDescription: "配合情报虾在“查看依据”时展示来源节点和关联对象。",
        personalizedDescription: "负责重点动态的来源依据展开和图谱关系下钻。",
      },
    ],
    usageSettings: [
      {
        label: "Token 上限",
        value: "260,000 / 日",
        description: "用于支撑多源采集、研判和图谱溯源场景下的高频调用。",
      },
      {
        label: "任务并发",
        value: "3 个",
        description: "保证多源情报归集和重点动态补证可并行执行。",
      },
      {
        label: "文档导出保留",
        value: "14 天",
        description: "Word 周报默认保留 14 天，超期后仅保留结构化简报和本体记录。",
      },
    ],
    permissionSettings: [
      {
        name: "公开情报采集",
        scope: "公开新闻 / 公告 / 政策站点",
        mode: "允许",
      },
      {
        name: "本体回写",
        scope: "情报对象可信度 / 重要性 / 图谱关系",
        mode: "允许写入",
      },
      {
        name: "对外发布情报摘要",
        scope: "群聊 / 邮件 / 周报投递",
        mode: "需人工确认",
      },
    ],
  },
};

function buildFallbackDetail(listItem: ClawHubListItem): ClawDetailData {
  const isScientificResearchClaw = listItem.id === "claw-scientific-research";
  const researchAgentSkills = {
    hypothesis: { id: "research-hypothesis-validation-skill", name: "科研假设验证 skill", description: "生成可证伪假设并定义关键变量与验证路径。", enabled: true, sizeLabel: "2.4 KB" },
    literature: { id: "research-systematic-review-skill", name: "文献检索 Skill", description: "检索学术文献并建立研究脉络、争议与证据缺口矩阵。", enabled: true, sizeLabel: "3.1 KB" },
    chart: { id: "research-chart-skill", name: "科研绘图 skill", description: "将实验数据与论证目标转换为规范科研图表。", enabled: true, sizeLabel: "2.8 KB" },
    paper: { id: "research-academic-writing-skill", name: "学术写作 skill", description: "依据研究材料组织论文结构并区分事实、推断与待验证内容。", enabled: true, sizeLabel: "3.6 KB" },
    review: { id: "research-peer-review-skill", name: "同行评审 skill", description: "从方法、证据、逻辑和引用规范维度审核论文。", enabled: true, sizeLabel: "2.7 KB" },
  } satisfies Record<string, CapabilitySkillItem>;
  const researchAgentTools = {
    hypothesis: { id: "research-python-statistics", name: "Python 统计分析工具", description: "用于研究变量处理、统计检验与假设验证。", enabled: true, badge: "Claw配置", meta: "OpenAPI", kind: "plugin", origin: "claw_only" },
    literatureArxiv: { id: "research-literature-arxiv", name: "arXiv 连接器", description: "检索学术预印本并保留来源、发布时间与主题信息。", enabled: true, badge: "Claw配置", meta: "MCP", kind: "mcp", origin: "claw_only" },
    literatureSemanticScholar: { id: "research-literature-semantic-scholar", name: "Semantic Scholar 连接器", description: "检索高被引实证研究并提取论文元数据与引用关系。", enabled: true, badge: "Claw配置", meta: "MCP", kind: "mcp", origin: "claw_only" },
    literatureCrossref: { id: "research-literature-crossref", name: "Crossref 连接器", description: "核对同行评审论文的 DOI、出版信息与引用关系。", enabled: true, badge: "Claw配置", meta: "MCP", kind: "mcp", origin: "claw_only" },
    chart: { id: "research-python-plotting", name: "Python 绘图环境", description: "生成可复现的研究框架图、效应对比图与置信区间图。", enabled: true, badge: "Claw配置", meta: "OpenAPI", kind: "plugin", origin: "claw_only" },
    paper: { id: "research-citation-checker", name: "引用校验工具", description: "核对论文引用、图表编号和参考文献对应关系。", enabled: true, badge: "Claw配置", meta: "OpenAPI", kind: "plugin", origin: "claw_only" },
    review: { id: "research-paper-compliance", name: "论文规范检查工具", description: "按同行评审口径检查方法、证据、逻辑与写作规范。", enabled: true, badge: "Claw配置", meta: "工作流", kind: "workflow", origin: "claw_only" },
  } satisfies Record<string, CapabilityToolItem>;
  const researchKnowledge = {
    project: { id: "research-project-knowledge", name: "科研项目资料库", description: "沉淀研究问题、实验方案、数据说明和阶段结论。", enabled: true, documentCount: 86, updatedAt: listItem.updatedAt },
    papers: { id: "research-public-paper-corpus", name: "公开学术论文库", description: "公开论文元数据、摘要与来源索引。", enabled: true, documentCount: 128430, updatedAt: "2026-07-10 18:20" },
    evidence: { id: "research-evidence-library", name: "核心文献证据库", description: "保存已筛选文献、证据矩阵、引用片段与证据边界。", enabled: true, documentCount: 312, updatedAt: listItem.updatedAt },
    standards: { id: "research-writing-standards", name: "论文写作与审核规范库", description: "提供论文结构、引用格式、图表规范与同行评审检查项。", enabled: true, documentCount: 42, updatedAt: "2026-07-09 16:40" },
  } satisfies Record<string, CapabilityKnowledgeItem>;
  const researchAgents: CapabilityAgentItem[] = [
    {
      id: "research-hypothesis-agent",
      name: "假设生成智能体",
      description: "结合研究问题与已有证据，生成可验证的科研假设。",
      enabled: true,
      target: "Claw私有智能体",
      primaryModel: "Qwen3-32B",
      fallbackModel: "Qwen3-8B",
      prompt: "根据研究问题、已有证据和约束条件，提出可证伪、可验证的科研假设，并说明变量与验证路径。",
      resources: { skills: [researchAgentSkills.hypothesis], tools: [researchAgentTools.hypothesis], knowledge: [researchKnowledge.project, researchKnowledge.evidence] },
    },
    {
      id: "research-literature-agent",
      name: "文献检索智能体",
      description: "检索并归纳相关论文，形成带来源的研究脉络与证据摘要。",
      enabled: true,
      target: "Claw私有智能体",
      primaryModel: "Qwen3-32B",
      fallbackModel: "Qwen3-8B",
      prompt: "围绕研究主题检索高相关文献，优先呈现原始来源、发表信息、关键结论与证据边界。",
      resources: { skills: [researchAgentSkills.literature], tools: [researchAgentTools.literatureArxiv, researchAgentTools.literatureSemanticScholar, researchAgentTools.literatureCrossref], knowledge: [researchKnowledge.papers, researchKnowledge.evidence] },
    },
    {
      id: "research-chart-agent",
      name: "科研绘图智能体",
      description: "将实验数据与研究结论转化为规范、可复现的科研图表。",
      enabled: true,
      target: "Claw私有智能体",
      primaryModel: "Qwen3-32B",
      fallbackModel: "Qwen3-8B",
      prompt: "根据数据类型和论证目标选择合适图表，输出清晰、准确、可复现的科研可视化方案。",
      resources: { skills: [researchAgentSkills.chart], tools: [researchAgentTools.chart], knowledge: [researchKnowledge.project, researchKnowledge.standards] },
    },
    {
      id: "research-paper-agent",
      name: "论文生成智能体",
      description: "依据研究材料生成结构完整、引证清晰的论文草稿。",
      enabled: true,
      target: "Claw私有智能体",
      primaryModel: "Qwen3-32B",
      fallbackModel: "Qwen3-8B",
      prompt: "严格依据提供的研究材料撰写论文，区分事实、推断与待验证内容，不虚构数据或引用。",
      resources: { skills: [researchAgentSkills.paper], tools: [researchAgentTools.paper], knowledge: [researchKnowledge.project, researchKnowledge.evidence, researchKnowledge.standards] },
    },
    {
      id: "research-review-agent",
      name: "论文审核智能体",
      description: "从方法、证据、逻辑与写作规范等维度审核论文质量。",
      enabled: true,
      target: "Claw私有智能体",
      primaryModel: "Qwen3-32B",
      fallbackModel: "Qwen3-8B",
      prompt: "以同行评审标准检查论文的方法合理性、证据充分性、论证一致性与引用规范，并给出可执行修改建议。",
      resources: { skills: [researchAgentSkills.review], tools: [researchAgentTools.review], knowledge: [researchKnowledge.evidence, researchKnowledge.standards] },
    },
  ];
  const researchTools: CapabilityToolItem[] = [
    { id: "research-subagent-scheduler", name: "子智能体调度器", description: "按科研任务依赖关系并行调度子智能体，并汇总阶段产出。", enabled: true, badge: "Claw配置", meta: "科研协作", kind: "workflow", origin: "claw_only" },
    ...Object.values(researchAgentTools),
  ];
  const researchSkills: CapabilitySkillItem[] = [
    { id: "research-requirement-insight-skill", name: "需求洞察 skill", description: "识别研究对象、成果形态、证据要求与时间范围。", enabled: true, sizeLabel: "1.2 KB" },
    ...Object.values(researchAgentSkills),
  ];
  return {
    overview: {
      ...listItem,
      version: "v1.0.0",
      createdAt: "2026-02-01 10:00",
    },
    chatSessions: [
      {
        id: `${listItem.id}-chat-main`,
        title: "默认会话",
        source: listItem.scene,
        preview: `围绕 ${listItem.name} 的当前主会话。`,
        updatedAt: listItem.updatedAt,
        unreadCount: 0,
        messages: [
          {
            id: `${listItem.id}-chat-msg-1`,
            role: "user",
            sender: "默认交互对象",
            time: listItem.updatedAt,
            content: `请开始处理与 ${listItem.scene} 相关的事项。`,
          },
          {
            id: `${listItem.id}-chat-msg-2`,
            role: "assistant",
            sender: listItem.name,
            time: listItem.updatedAt,
            content: "收到，我会先整理上下文，再给出当前可执行的处理结果。",
            auditTurnId: `${listItem.id}-turn-001`,
          },
        ],
      },
    ],
    coreFiles: [
      createClawAgentMdFile(`# ${listItem.name}

## 身份
- ${listItem.type} Agent，服务于 ${listItem.scene} 场景

## 目标
- 按照当前角色提供稳定、可执行的支持
- 在边界内推进任务并沉淀上下文

## 服务对象
- ${listItem.scene} 场景下的协作成员

## 工作方式
- 稳定、克制、清晰；先理解上下文，再输出结论
- 对高风险事项保持审慎，对未确认信息显式标注

## 行为边界
- 高风险步骤须人工确认后再执行
- 不越权代替人工审批或最终决策`),
    ],
    capabilityConfig: {
      tools: {
        platform: buildBuiltinClawPlatformTools(`${listItem.id}-tool-`),
        tenant: [
          {
            id: `${listItem.id}-tool-tenant-message`,
            name: "租户消息分发工具",
            description: "租户统一配置的消息分发工具。",
            enabled: true,
            badge: "租户配置",
            meta: "租户共享",
          },
        ],
        claw: isScientificResearchClaw ? researchTools : [
          {
            id: `${listItem.id}-tool-claw-custom`,
            name: "Claw 专属工具",
            description: `当前 ${listItem.name} 单独配置的自定义工具。`,
            enabled: false,
            badge: "Claw配置",
            meta: "场景专属",
            kind: "plugin",
            origin: "claw_only",
          },
        ],
      },
      skills: {
        platform: buildBuiltinClawPlatformSkills(`${listItem.id}-skill-`),
        tenant: [
          {
            id: `${listItem.id}-skill-tenant-shared`,
            name: "tenant-shared-skill",
            description: "租户统一下发的共享技能。",
            enabled: true,
            sizeLabel: "0.3 KB",
          },
        ],
        claw: isScientificResearchClaw ? researchSkills : [
          {
            id: `${listItem.id}-skill-claw-custom`,
            name: "claw-custom-skill",
            description: `服务于 ${listItem.scene} 的专属技能。`,
            enabled: false,
            sizeLabel: "0.2 KB",
          },
        ],
      },
      agents: {
        platform: [
          {
            id: `${listItem.id}-agent-platform-summary`,
            name: "平台摘要 Agent",
            description: "平台预置的通用摘要函数。",
            enabled: true,
            target: "平台预置函数",
          },
        ],
        tenant: [
          {
            id: `${listItem.id}-agent-tenant-shared`,
            name: "租户协作 Agent",
            description: "租户统一配置的共享 Agent。",
            enabled: true,
            target: "租户共享函数",
          },
        ],
        claw: isScientificResearchClaw ? researchAgents : [
          {
            id: `${listItem.id}-agent-claw-custom`,
            name: "Claw 专属 Agent",
            description: `仅当前 ${listItem.name} 使用的函数化 Agent。`,
            enabled: false,
            target: "Claw私有函数",
          },
        ],
      },
      knowledge: {
        tenant: isScientificResearchClaw ? [
          {
            id: "research-public-paper-corpus",
            name: "公开学术论文库",
            description: "租户共享的公开论文元数据、摘要与来源索引。",
            enabled: true,
            documentCount: 128430,
            updatedAt: "2026-07-10 18:20",
          },
        ] : [
          {
            id: `${listItem.id}-knowledge-tenant`,
            name: "租户共享知识库",
            description: "租户统一维护的业务知识与制度文档。",
            enabled: true,
            documentCount: 68,
            updatedAt: listItem.updatedAt,
          },
        ],
        claw: isScientificResearchClaw ? [
          {
            id: "research-project-knowledge",
            name: "科研项目资料库",
            description: "沉淀研究问题、实验方案、数据说明和阶段结论。",
            enabled: true,
            documentCount: 86,
            updatedAt: listItem.updatedAt,
          },
          {
            id: "research-evidence-library",
            name: "核心文献证据库",
            description: "保存已筛选文献、证据矩阵、引用片段与证据边界。",
            enabled: true,
            documentCount: 312,
            updatedAt: listItem.updatedAt,
          },
          {
            id: "research-writing-standards",
            name: "论文写作与审核规范库",
            description: "提供论文结构、引用格式、图表规范与同行评审检查项。",
            enabled: true,
            documentCount: 42,
            updatedAt: "2026-07-09 16:40",
          },
        ] : [
          {
            id: `${listItem.id}-knowledge-claw`,
            name: "Claw 专属知识库",
            description: `围绕 ${listItem.scene} 沉淀的场景知识。`,
            enabled: true,
            documentCount: 18,
            updatedAt: listItem.updatedAt,
          },
        ],
      },
    },
    resourceConfig: createDefaultResourceConfig(),
    distributionChannels: [
      {
        name: "蓝信",
        status: "已接入",
        appId: `${listItem.id}-lanxin`,
        secretIdMasked: "lxsec_****_8fh1",
      },
      {
        name: "企业微信",
        status: "已接入",
        appId: `${listItem.id}-wxwork`,
        secretIdMasked: "sec_****_8fh2",
      },
      {
        name: "飞书",
        status: "未接入",
        appId: "未配置",
        secretIdMasked: "未配置",
      },
      {
        name: "钉钉",
        status: "未接入",
        appId: "未配置",
        secretIdMasked: "未配置",
      },
      {
        name: "QQ",
        status: "未接入",
        appId: "未配置",
        secretIdMasked: "未配置",
      },
    ],
    taskGroups: [
      {
        title: "自动化任务",
        description: "按固定时间执行。",
        tasks: [
          {
            name: "每日同步",
            trigger: "每天 09:00",
            status: "已启用",
            note: "同步当日需要处理的事项。",
          },
        ],
      },
      {
        title: "催办任务",
        description: "对超时未处理事项进行催办。",
        tasks: [
          {
            name: "超时催办",
            trigger: "事项超时 30 分钟",
            status: "已启用",
            note: "提醒负责人尽快处理。",
          },
        ],
      },
      {
        title: "条件触发任务",
        description: "满足条件后自动触发。",
        tasks: [
          {
            name: "条件通知",
            trigger: "命中预设条件",
            status: "已启用",
            note: "生成对应处理任务。",
          },
        ],
      },
    ],
    automatedTasks: CLAW_AUTOMATED_TASKS_SAMPLE,
    automatedTaskExecutions: CLAW_AUTOMATED_TASK_EXECUTIONS_SAMPLE,
    workspaceStorageConfig: {
      volumeDisplayName: `${listItem.name} 专用存储卷`,
      volumeDescription: "默认工作空间绑定的存储卷。",
      volumeName: "s3://juicefs-vol-001",
      subdirectory: "default",
      organizationName: listItem.owner,
      projectName: listItem.scene,
      volumeTotalGb: 8000,
      volumeAvailableGb: 4440,
      workspaceUsedGb: 8.6,
      workspaceQuotaGb: null,
    },
    workspaceRoot: {
      id: "workspace",
      name: "workspace",
      kind: "folder",
      description: "默认工作空间主目录",
      children: [
        {
          id: "output",
          name: "output",
          kind: "folder",
          children: [
            {
              id: "drafts",
              name: "drafts",
              kind: "folder",
              children: [
                {
                  id: "output-draft-brief",
                  name: "weekly-brief.md",
                  kind: "file",
                  sizeLabel: "84 KB",
                  updatedAt: "2026-04-02 09:12",
                  updatedBy: listItem.updatedBy,
                  description: "最近一次执行生成的草稿。",
                },
              ],
            },
            {
              id: "deliverables",
              name: "deliverables",
              kind: "folder",
              children: [
                {
                  id: "deliverable-docx",
                  name: "delivery.docx",
                  kind: "file",
                  sizeLabel: "1.2 MB",
                  updatedAt: "2026-04-02 09:20",
                  updatedBy: listItem.updatedBy,
                },
              ],
            },
          ],
        },
        {
          id: "archived",
          name: "archived",
          kind: "folder",
          children: [],
        },
        {
          id: "notes",
          name: "notes",
          kind: "folder",
          children: [
            {
              id: "daily",
              name: "daily",
              kind: "folder",
              children: [
                {
                  id: "daily-note",
                  name: "2026-04-02.md",
                  kind: "file",
                  sizeLabel: "16 KB",
                  updatedAt: "2026-04-02 08:40",
                  updatedBy: listItem.updatedBy,
                },
              ],
            },
          ],
        },
      ],
    },
    messageLogs: [
      {
        time: listItem.updatedAt,
        peer: "默认交互对象",
        summary: `最近一次围绕 ${listItem.scene} 的消息记录。`,
      },
    ],
    taskLogs: [
      {
        time: listItem.updatedAt,
        taskName: "最近一次任务",
        result: "任务已执行并记录结果。",
      },
    ],
    conversationRuns: [
      {
        id: `${listItem.id}-chat-main`,
        title: `${listItem.name} 默认会话`,
        channel: getConversationUsageChannelForSeed(listItem.id),
        userIdentity: "默认交互对象",
        sessionId: `${listItem.id}-session-001`,
        traceId: `${listItem.id}-trace-001`,
        startedAt: listItem.updatedAt,
        updatedAt: listItem.updatedAt,
        turns: [
          {
            id: `${listItem.id}-turn-001`,
            turnNumber: 1,
            occurredAt: listItem.updatedAt,
            userInput: `请开始处理与 ${listItem.scene} 相关的事项。`,
            assistantOutput: "收到，我会先整理上下文，再给出当前可执行的处理结果。",
            traceId: `${listItem.id}-trace-001`,
            auditRecords: [
              {
                id: `${listItem.id}-audit-001`,
                turnId: `${listItem.id}-turn-001`,
                type: "工具执行",
                targetName: "上下文整理器",
                inputSummary: `{\n  "tool": "context.pack",\n  "scope": ${JSON.stringify(listItem.scene)},\n  "sources": ["session", "workspace", "kb"]\n}`,
                outputSummary:
                  '{\n  "contextHandle": "ctx-default-001",\n  "tokenEstimate": 1820,\n  "suggestions": ["run_checklist", "draft_reply"]\n}',
                durationMs: 540,
                status: "成功",
                traceId: `${listItem.id}-trace-001`,
              },
            ],
          },
        ],
      },
    ],
    taskRuns: [
      {
        id: `${listItem.id}-task-run-001`,
        taskName: "最近一次任务",
        taskType: "自动化任务",
        triggerSource: "每天 09:00",
        startedAt: listItem.updatedAt,
        finishedAt: listItem.updatedAt,
        durationMs: 60000,
        status: "成功",
        resultSummary: "最近一次任务已执行并记录结果。",
        traceId: `${listItem.id}-task-trace-001`,
      },
    ],
    securityEvents: [
      {
        id: `${listItem.id}-security-001`,
        time: listItem.updatedAt,
        level: "低",
        stage: "输出阶段",
        ruleName: "默认内容审计",
        action: "记录",
        contentSummary: `围绕 ${listItem.scene} 的最近一次输出已完成安全记录。`,
        sourceType: "会话运行",
        sourceName: `${listItem.name} 默认会话 / 第 1 轮`,
        traceId: `${listItem.id}-trace-001`,
      },
    ],
    securityManagement: {
      autonomyBoundaries: [
        {
          id: `${listItem.id}-boundary-read`,
          name: "读取文件",
          description: "读取工作区和知识库中的文件内容",
          level: "L1：直接放行",
        },
        {
          id: `${listItem.id}-boundary-write`,
          name: "写入文件",
          description: "创建或更新工作区中的文档",
          level: "L2：需用户审批",
        },
        {
          id: `${listItem.id}-boundary-delete`,
          name: "删除文件",
          description: "删除工作区中的文件",
          level: "L2：需用户审批",
        },
        {
          id: `${listItem.id}-boundary-task`,
          name: "管理自动化任务",
          description: "创建、更新、启停或删除自动化任务",
          level: "L1：直接放行",
        },
      ],
      toolProtection: createDefaultToolProtection(),
      fileProtection: createDefaultFileProtection([]),
      securityApprovals: createDefaultSecurityApprovals([], []),
    },
    personRelations: [
      {
        name: "李俊",
        role: "销售主管",
        description: "这是一个对人的关系描述示例。",
      },
    ],
    agentRelations: [
      {
        id: `ar-${listItem.id}-collab`,
        name: "协作 Agent",
        relationship: "协作",
        originalDescription: "这是一个对 Agent 关系的描述示例。",
        personalizedDescription: "接受指令并完成协作目标。",
      },
    ],
    usageSettings: [
      {
        label: "Token 上限",
        value: "100,000 / 日",
        description: "控制日常消耗。",
      },
      {
        label: "任务并发",
        value: "2 个",
        description: "控制自动任务执行并发。",
      },
    ],
    permissionSettings: [
      {
        name: "知识库读取",
        scope: "当前业务知识库",
        mode: "允许",
      },
      {
        name: "高风险操作",
        scope: "涉及外部写入",
        mode: "需人工确认",
      },
    ],
  };
}

export function createFallbackClawListItem(
  clawId: string,
  input: Partial<Pick<ClawHubListItem, "name" | "creator" | "model" | "summary" | "updatedAt" | "updatedBy">> = {}
): ClawHubListItem {
  return {
    id: clawId,
    name: input.name?.trim() || "新建 Claw",
    creator: input.creator?.trim() || "RowanDI",
    type: "办公型",
    scene: "通用办公",
    owner: "默认项目组",
    status: "设计中",
    publishStatus: "未发布",
    model: input.model?.trim() || "Qwen3-32B",
    updatedAt: input.updatedAt?.trim() || "刚刚",
    updatedBy: input.updatedBy?.trim() || input.creator?.trim() || "RowanDI",
    summary: input.summary?.trim() || "新建 Claw，待补充描述。",
  };
}

export function getClawDetail(clawId: string, fallbackListItem?: ClawHubListItem) {
  const fromMap = detailMap[clawId];
  if (fromMap) {
    return attachKnowledgeAssetsIfMissing(fromMap);
  }

  const listItem = clawHubList.find((item) => item.id === clawId) ?? fallbackListItem;
  if (!listItem) {
    return null;
  }

  return attachKnowledgeAssetsIfMissing(buildFallbackDetail(listItem));
}
