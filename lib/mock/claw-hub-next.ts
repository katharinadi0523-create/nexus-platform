export type ClawType = "运维型" | "销售型" | "审核型" | "办公型" | "研发型";
export type ClawStatus = "运行中" | "设计中" | "待评审" | "冻结";

export interface ClawHubListItem {
  id: string;
  name: string;
  type: ClawType;
  scene: string;
  owner: string;
  status: ClawStatus;
  model: string;
  updatedAt: string;
  summary: string;
}

export type ClawCoreFileKey = "identity" | "soul" | "memory" | "heartbeat";

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

export interface CapabilityToolItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  badge?: string;
  meta?: string;
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
  toolLabel?: string;
  attachments?: string[];
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

export interface DistributionChannelItem {
  name: string;
  status: "已接入" | "未接入";
  appId: string;
  secretIdMasked: string;
}

export interface WorkspaceFolderItem {
  id: string;
  name: string;
  children: WorkspaceFolderItem[];
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

export interface PersonRelationItem {
  name: string;
  role: string;
  description: string;
}

export interface AgentRelationItem {
  name: string;
  goal: string;
  description: string;
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
  resourceConfig: ResourceConfig;
  distributionChannels: DistributionChannelItem[];
  taskGroups: ClawTaskGroup[];
  workspaceRoot: WorkspaceFolderItem;
  messageLogs: MessageLogItem[];
  taskLogs: TaskLogItem[];
  personRelations: PersonRelationItem[];
  agentRelations: AgentRelationItem[];
  usageSettings: UsageSettingItem[];
  permissionSettings: PermissionSettingItem[];
}

export interface TenantSettingSection {
  title: string;
  description: string;
  groups: {
    title: string;
    description: string;
    entries: string[];
  }[];
}

export const clawHubList: ClawHubListItem[] = [
  {
    id: "claw-ops-watch",
    name: "运维值守 Claw",
    type: "运维型",
    scene: "运维协同",
    owner: "平台运维组",
    status: "运行中",
    model: "Qwen3-32B + MCP",
    updatedAt: "2026-03-28 18:20",
    summary: "负责告警分发、工单补录、值守问答和巡检结果汇总。",
  },
  {
    id: "claw-sales-pilot",
    name: "销售陪练 Claw",
    type: "销售型",
    scene: "售前销售",
    owner: "增长运营组",
    status: "设计中",
    model: "DeepSeek-R1",
    updatedAt: "2026-03-27 14:05",
    summary: "负责销售演练、客户画像整理和异议处理建议。",
  },
  {
    id: "claw-risk-review",
    name: "风控审核 Claw",
    type: "审核型",
    scene: "审批风控",
    owner: "风险管理组",
    status: "待评审",
    model: "Qwen3-32B + 私有知识库",
    updatedAt: "2026-03-26 21:40",
    summary: "负责异常材料审阅、规则命中说明和复核意见生成。",
  },
  {
    id: "claw-office-assist",
    name: "办公助理 Claw",
    type: "办公型",
    scene: "办公协同",
    owner: "行政服务组",
    status: "运行中",
    model: "Qwen3-8B",
    updatedAt: "2026-03-25 09:15",
    summary: "负责请假、报销、日程、会议纪要和制度问答。",
  },
  {
    id: "claw-research-pm",
    name: "研发生命周期 Claw",
    type: "研发型",
    scene: "研发协作",
    owner: "产品研发组",
    status: "运行中",
    model: "Qwen3-32B + 向量检索",
    updatedAt: "2026-03-29 10:30",
    summary: "负责需求拆解、研发答疑、测试回归和版本复盘。",
  },
];

export const tenantSettingSections: TenantSettingSection[] = [
  {
    title: "资源与环境配置",
    description: "统一管理租户级模型、环境、存储和审计策略。",
    groups: [
      {
        title: "模型资源",
        description: "租户默认可用模型与资源池。",
        entries: ["默认模型映射", "备用模型策略", "多环境模型白名单"],
      },
      {
        title: "运行环境",
        description: "测试、预发、生产环境的发布与隔离配置。",
        entries: ["环境变量管理", "发布分支映射", "网络访问策略"],
      },
      {
        title: "存储与审计",
        description: "统一管理工作空间配额和日志保留策略。",
        entries: ["工作空间容量", "日志保留周期", "审计归档策略"],
      },
    ],
  },
  {
    title: "能力配置",
    description: "统一下发租户级共享能力，供多个 Claw 复用。",
    groups: [
      {
        title: "Agent",
        description: "维护租户可复用的 Agent 模板和协作边界。",
        entries: ["角色模板", "协同策略", "默认审批规则"],
      },
      {
        title: "租户 Skill",
        description: "管理租户级 Built in 和 Skill 下发能力。",
        entries: ["租户级 Built in", "Skill 下发", "版本灰度与回滚"],
      },
      {
        title: "租户 Tool",
        description: "统一管理租户共用的 Tool 与插件入口。",
        entries: ["租户级 Tool 白名单", "共享密钥托管", "调用频控"],
      },
      {
        title: "租户级共享知识库",
        description: "供所有 Claw 共用的公共知识资产。",
        entries: ["制度库", "业务 FAQ", "公共语料标签"],
      },
    ],
  },
];

const HEARTBEAT_TEMPLATE = `HEARTBEAT

When this file is read during a heartbeat, you are performing a periodic awareness check.


Phase 1: Review Context & Discover Interest Points

Review your recent conversations and your role/responsibilities.

Identify topics or questions that:

Are directly relevant to your role and current work
Were mentioned by users but not fully explored at the time
Represent emerging trends or changes in your professional domain
Could improve your ability to serve your users

If no genuine, informative topics emerge from recent context, skip exploration and go directly to Phase 3.

Do NOT search for generic or obvious topics just to fill time. Quality over quantity.


Phase 2: Targeted Exploration (Conditional)

Only if you identified genuine interest points in Phase 1:


Use web_search to investigate (maximum 5 searches per heartbeat)
Keep searches tightly scoped to your role and recent work topics
For each discovery worth keeping:
Record it using writefile to memory/curiosityjournal.md
Include the source URL and a brief note on why it matters to your work
Rate its relevance (high/medium/low) to your current responsibilities

Format for curiosity_journal.md entries:

### [Date] - [Topic]
- **Finding**: [What you learned]
- **Source**: [URL]
- **Relevance**: [high/medium/low] — [Why it matters to your work]
- **Follow-up**: [Optional: questions this raises for next time]

Phase 3: Agent Plaza

Call plazagetnew_posts to check recent activity
If you found something genuinely valuable in Phase 2:
Share the most impactful discovery to plaza (max 1 post)
Always include the source URL when sharing internet findings
Frame it in terms of how it's relevant to your team/domain
Comment on relevant existing posts (max 2 comments)

Phase 4: Wrap Up

If nothing needed attention and no exploration was warranted: reply with HEARTBEAT_OK
Otherwise, briefly summarize what you explored and why

Key Principles
Always ground exploration in YOUR role and YOUR recent work context
Never search for random unrelated topics out of idle curiosity
If you don't have a specific angle worth investigating, don't search
Prefer depth over breadth — one thoroughly explored topic > five surface-level queries
Generate follow-up questions only when you genuinely want to know more

Rules
⛔ NEVER share private information: user conversations, memory contents, workspace files, task details
✅ Share only public-safe content: general insights, tips, industry news, web search discoveries with links
📝 Limits per heartbeat: max 1 post + 2 comments
🔍 Search limits: max 5 web searches per heartbeat
🤐 If nothing interesting to explore or share, respond with HEARTBEAT_OK`;

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
            content: "我先帮你排一下最近一小时的异常趋势，再把影响服务和建议排查顺序一起整理出来。",
          },
          {
            id: "ops-alert-3",
            role: "tool",
            sender: "系统执行",
            time: "10:19",
            content: "prometheus_query(error_rate{service=\"api-gateway\"}, last_60m)\nlog_search(\"api-gateway\", level:error, window:60m)",
            toolLabel: "监控检索",
          },
          {
            id: "ops-alert-4",
            role: "assistant",
            sender: "运维值守 Claw",
            time: "10:20",
            content:
              "初步判断是上游认证服务抖动导致网关重试放大。\n\n1. 峰值时段集中在 09:42 - 09:57。\n2. 主要影响登录、令牌刷新和用户资料接口。\n3. 建议先核对 auth-service 的线程池和数据库连接数，再检查网关重试配置是否异常放大。",
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
            content: "收到，我会输出一版适合晨会直接宣读的摘要，并把待办事项单独列出来。",
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
            content: "已生成催办摘要，准备同步给值班负责人和故障协同群。",
          },
        ],
      },
    ],
    coreFiles: [
      {
        key: "identity",
        title: "identity.md",
        description: "定义当前 Claw 的角色、职责和边界，作为所有行为的第一约束。",
        note: "身份定义",
        sizeLabel: "1.2 KB",
        content: `# Identity — 运维值守 Claw

## 名称
- 运维值守 Claw

## 角色
- 运维协同值守 Agent

## 核心职责
- 负责告警分发、工单补录、值守问答和巡检结果汇总
- 面向值班工程师输出稳定、简洁、可执行的判断
- 在突发事件处理中优先保障服务连续性和信息同步效率

## 边界
- 不直接执行高风险变更
- 涉及生产写操作时必须由人工确认
- 对外输出需要说明依据、影响面和建议动作`,
      },
      {
        key: "soul",
        title: "Soul.md",
        description: "定义人格、风格和行为偏好，保证 Claw 在长期协作中稳定一致。",
        note: "人格定义",
        sizeLabel: "1.4 KB",
        content: `# Soul — 运维值守 Claw

## Identity
- 名称：运维值守 Claw
- 角色：运维协同值守 Agent
- 创建者：平台运维组
- 创建时间：2026-01-12

## Personality
- 冷静、可靠、偏审慎
- 输出简洁，不制造额外焦虑
- 面对突发事件时先给结论，再给排查路径

## Boundaries
- 高风险操作前必须说明影响和回滚方案
- 对不确定结论要明确标注假设和待确认项
- 不越权代替人工审批或最终决策`,
      },
      {
        key: "memory",
        title: "memory.md",
        description: "记录长期记忆和每日记忆，帮助当前 Claw 保持连续上下文和经验沉淀。",
        note: "记忆文件",
        sizeLabel: "1.6 KB",
        tags: ["长期记忆", "每日记忆"],
        content: `# Memory — 运维值守 Claw

## 长期记忆
- 平台高峰时段集中在工作日 09:30 - 11:30 / 14:00 - 18:00
- 认证服务抖动时容易放大网关重试，优先检查 auth-service 和数据库连接池
- 值班负责人最关注影响面、恢复时间和是否需要客户同步

## 每日记忆
### 2026-03-29
- API 网关错误率在 09:42 - 09:57 期间出现明显峰值
- 已提醒王超优先检查认证服务线程池和数据库连接数
- 晨会摘要已同步给李涛，待补充恢复时间线

### 2026-03-28
- 高优工单 INC-22031 超时 30 分钟，已完成催办
- 夜间巡检结果已归档到工作空间 /巡检报告
- 值守交接中新增 2 个待跟进事项`,
      },
      {
        key: "heartbeat",
        title: "heartbeat.md",
        description: "定义周期性感知与自检策略，控制心跳时该探索什么、记录什么、分享什么。",
        note: "周期心跳策略",
        sizeLabel: "3.0 KB",
        content: HEARTBEAT_TEMPLATE,
      },
    ],
    capabilityConfig: {
      tools: {
        platform: [
          {
            id: "agentbay-click",
            name: "AgentBay: 浏览器点击",
            description: "[ENV: Browser] 点击页面元素，适合巡检或流程自动化。",
            enabled: true,
            badge: "Built-in",
            meta: "AGENTBAY",
          },
          {
            id: "agentbay-observe",
            name: "AgentBay: 浏览器观察",
            description: "[ENV: Browser] 观察页面交互元素和状态，辅助故障排查。",
            enabled: false,
            badge: "Built-in",
            meta: "AGENTBAY",
          },
          {
            id: "shell-command",
            name: "AgentBay: Shell Command",
            description: "[ENV: Code Sandbox] 执行脚本和命令，适合自动巡检。",
            enabled: true,
            badge: "Built-in",
            meta: "AGENTBAY",
          },
        ],
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
          },
        ],
      },
      skills: {
        platform: [
          {
            id: "complex-task-executor",
            name: "complex-task-executor",
            description: "多步骤任务执行模板，适合复杂值守场景拆解。",
            enabled: true,
            sizeLabel: "0.3 KB",
          },
          {
            id: "web-research",
            name: "web-research",
            description: "执行聚焦型网络检索并输出结构化结论。",
            enabled: true,
            sizeLabel: "0.2 KB",
          },
        ],
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
    ],
    taskGroups: [
      {
        title: "定时任务",
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
    workspaceRoot: {
      id: "workspace",
      name: "workspace",
      children: [
        {
          id: "output",
          name: "output",
          children: [
            {
              id: "daily-report",
              name: "daily-report",
              children: [
                { id: "2026-03-29", name: "2026-03-29", children: [] },
                { id: "2026-03-28", name: "2026-03-28", children: [] },
              ],
            },
            {
              id: "inspection-summary",
              name: "inspection-summary",
              children: [],
            },
          ],
        },
        {
          id: "archived",
          name: "archived",
          children: [
            {
              id: "incident-2026-q1",
              name: "incident-2026-q1",
              children: [
                { id: "gateway-spike", name: "gateway-spike", children: [] },
                { id: "db-failover", name: "db-failover", children: [] },
              ],
            },
          ],
        },
        {
          id: "handoff",
          name: "handoff",
          children: [
            { id: "morning-shift", name: "morning-shift", children: [] },
            { id: "night-shift", name: "night-shift", children: [] },
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
        name: "销售 Claw",
        goal: "帮助销售团队理解故障对客户的业务影响。",
        description: "接收运维值守 Claw 输出的事件摘要，再转换成面向客户的解释口径。",
      },
      {
        name: "工单 Claw",
        goal: "负责工单流转和状态同步。",
        description: "当运维值守 Claw 判断需要补录或催办时，把结构化信息发给工单 Claw 执行。",
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
};

function buildFallbackDetail(listItem: ClawHubListItem): ClawDetailData {
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
          },
        ],
      },
    ],
    coreFiles: [
      {
        key: "identity",
        title: "identity.md",
        description: `${listItem.name} 的身份定义与职责边界。`,
        note: "身份定义",
        sizeLabel: "1.0 KB",
        content: `# Identity — ${listItem.name}

## 名称
- ${listItem.name}

## 场景
- ${listItem.scene}

## 角色
- ${listItem.type} Agent

## 职责
- 服务于 ${listItem.scene} 场景下的日常协作
- 按照当前角色提供稳定、可执行的支持
- 在边界内推进任务并沉淀上下文`,
      },
      {
        key: "soul",
        title: "Soul.md",
        description: `${listItem.name} 的稳定人格和行为倾向。`,
        note: "人格定义",
        sizeLabel: "1.1 KB",
        content: `# Soul — ${listItem.name}

## Personality
- 稳定、克制、清晰
- 优先确保信息表达准确
- 面向协作对象给出可执行建议

## Working Style
- 先理解上下文，再输出结论
- 对高风险事项保持审慎
- 对未确认信息显式标注`,
      },
      {
        key: "memory",
        title: "memory.md",
        description: `${listItem.name} 的长期记忆与召回策略。`,
        note: "记忆文件",
        sizeLabel: "1.3 KB",
        tags: ["长期记忆", "每日记忆"],
        content: `# Memory — ${listItem.name}

## 长期记忆
- 记录当前 Claw 在 ${listItem.scene} 场景中的长期规律、经验和偏好
- 沉淀高频任务模式和关键协作对象信息

## 每日记忆
### ${listItem.updatedAt}
- 最近一次围绕 ${listItem.scene} 的任务已记录
- 当前上下文和阶段性产出可从工作空间中继续追溯`,
      },
      {
        key: "heartbeat",
        title: "heartbeat.md",
        description: `${listItem.name} 的状态检查与周期更新机制。`,
        note: "周期心跳策略",
        sizeLabel: "3.0 KB",
        content: HEARTBEAT_TEMPLATE,
      },
    ],
    capabilityConfig: {
      tools: {
        platform: [
          {
            id: `${listItem.id}-tool-platform-browser`,
            name: "平台浏览器工具",
            description: "平台预置的基础浏览器执行能力。",
            enabled: true,
            badge: "Built-in",
            meta: "平台预置",
          },
        ],
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
        claw: [
          {
            id: `${listItem.id}-tool-claw-custom`,
            name: "Claw 专属工具",
            description: `当前 ${listItem.name} 单独配置的自定义工具。`,
            enabled: false,
            badge: "Claw配置",
            meta: "场景专属",
          },
        ],
      },
      skills: {
        platform: [
          {
            id: `${listItem.id}-skill-platform-base`,
            name: "base-skill",
            description: "平台预置的基础技能。",
            enabled: true,
            sizeLabel: "0.2 KB",
          },
        ],
        tenant: [
          {
            id: `${listItem.id}-skill-tenant-shared`,
            name: "tenant-shared-skill",
            description: "租户统一下发的共享技能。",
            enabled: true,
            sizeLabel: "0.3 KB",
          },
        ],
        claw: [
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
        claw: [
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
        tenant: [
          {
            id: `${listItem.id}-knowledge-tenant`,
            name: "租户共享知识库",
            description: "租户统一维护的业务知识与制度文档。",
            enabled: true,
            documentCount: 68,
            updatedAt: listItem.updatedAt,
          },
        ],
        claw: [
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
    ],
    taskGroups: [
      {
        title: "定时任务",
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
    workspaceRoot: {
      id: "workspace",
      name: "workspace",
      children: [
        {
          id: "output",
          name: "output",
          children: [
            { id: "drafts", name: "drafts", children: [] },
            { id: "deliverables", name: "deliverables", children: [] },
          ],
        },
        {
          id: "archived",
          name: "archived",
          children: [],
        },
        {
          id: "notes",
          name: "notes",
          children: [
            { id: "daily", name: "daily", children: [] },
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
    personRelations: [
      {
        name: "李俊",
        role: "销售主管",
        description: "这是一个对人的关系描述示例。",
      },
    ],
    agentRelations: [
      {
        name: "协作 Agent",
        goal: "接受指令并完成协作目标。",
        description: "这是一个对 Agent 关系的描述示例。",
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

export function getClawDetail(clawId: string) {
  if (detailMap[clawId]) {
    return detailMap[clawId];
  }

  const listItem = clawHubList.find((item) => item.id === clawId);
  if (!listItem) {
    return null;
  }

  return buildFallbackDetail(listItem);
}
