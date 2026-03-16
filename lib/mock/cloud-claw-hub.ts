export type CloudClawStatus = "草稿" | "已发布" | "已停用";
export type IntegrationStatus = "在线" | "告警" | "未启用";
export type ChannelStatus = "已发布" | "草稿" | "已停用";
export type TaskStatus = "运行中" | "待执行" | "暂停";

export type CloudClawDocId =
  | "identity"
  | "soul"
  | "user"
  | "heartbeat"
  | "protection";

export interface CloudClawOverview {
  id: string;
  name: string;
  description: string;
  scene: string;
  sceneType: string;
  serviceOwner: string;
  creator: string;
  updatedAt: string;
  version: string;
  status: CloudClawStatus;
  serviceScope: string;
  targetAudience: string;
  publishedAt: string;
  latestOperation: string;
}

export interface CloudClawBaseDoc {
  id: CloudClawDocId;
  title: string;
  subtitle: string;
  tags: string[];
  summary: string;
  content: string;
}

export interface CloudModelConfig {
  primaryModel: string;
  fallbackModels: string[];
  purpose: string;
  strategy: string;
}

export interface CapabilityBinding {
  id: string;
  marketplaceId?: string;
  name: string;
  type: "技能" | "工作流";
  source: "平台预置" | "自定义" | "插件扩展";
  configuredAt: string;
  version: string;
  entry: string;
  description: string;
  enabled: boolean;
}

export interface CloudSubAgent {
  id: string;
  name: string;
  responsibility: string;
  dispatchMode: string;
  model: string;
  enabled: boolean;
}

export interface IntegrationBinding {
  id: string;
  name: string;
  type: "MCP 服务" | "企业接口" | "插件能力" | "工作流" | "业务工具";
  target: string;
  relation: string;
  status: IntegrationStatus;
  description: string;
}

export interface ChannelRelease {
  id: string;
  channel: string;
  status: ChannelStatus;
  version: string;
  publishedAt: string;
  entry: string;
  owner: string;
}

export interface PermissionScope {
  departments: string[];
  roles: string[];
  userGroups: string[];
  adminVisibleOnly: boolean;
  visibilityNote: string;
  usageNote: string;
}

export interface MemoryVariable {
  id: string;
  name: string;
  scope: "用户变量" | "会话变量" | "系统变量";
  description: string;
  example: string;
}

export interface SessionMemoryConfig {
  retentionPolicy: string;
  longTermMemoryEnabled: boolean;
  isolationStrategy: string;
  sessionSummaryStrategy: string;
  variables: MemoryVariable[];
}

export interface SecurityRule {
  id: string;
  name: string;
  stage: "输入阶段" | "输出阶段" | "行为阶段";
  action: string;
  level: "高" | "中" | "低";
  enabled: boolean;
}

export interface ProtectionRuleTag {
  id: string;
  name: string;
  mode: "严格" | "宽松" | "观察";
}

export interface ProtectionPolicyConfig {
  id: string;
  name: string;
  stage: "输入" | "输出" | "输入+输出";
  rules: ProtectionRuleTag[];
  action: "拦截" | "记录" | "放行";
}

export interface ProtectionLexiconConfig {
  id: string;
  type: "黑名单词库" | "白名单词库" | "灰名单词库";
  stage: "输入" | "输出" | "输入+输出";
  names: string[];
  action: "拦截" | "记录" | "放行";
}

export interface ProtectionResponseConfig {
  id: string;
  name: string;
  content: string;
}

export interface SecurityGovernanceConfig {
  inputGuard: string;
  outputGuard: string;
  behaviorAudit: boolean;
  riskStrategy: string;
  logLevel: "基础日志" | "标准日志" | "详细日志";
  traceEnabled: boolean;
  traceNote: string;
  rules: SecurityRule[];
  taskName: string;
  taskId: string;
  description: string;
  policyConfigs: ProtectionPolicyConfig[];
  lexiconConfigs: ProtectionLexiconConfig[];
  responseConfigs: ProtectionResponseConfig[];
}

export interface ScheduledTaskBinding {
  id: string;
  name: string;
  trigger: string;
  bindType: "技能" | "子Agent" | "工作流";
  bindName: string;
  runtime: string;
  lastRun: string;
  status: TaskStatus;
  enabled: boolean;
}

export interface CloudClawDetail {
  overview: CloudClawOverview;
  docs: CloudClawBaseDoc[];
  modelConfig: CloudModelConfig;
  capabilities: CapabilityBinding[];
  subAgents: CloudSubAgent[];
  integrations: IntegrationBinding[];
  channels: ChannelRelease[];
  permissionScope: PermissionScope;
  sessionMemory: SessionMemoryConfig;
  securityGovernance: SecurityGovernanceConfig;
  scheduledTasks: ScheduledTaskBinding[];
}

export interface CloudClawListItem {
  id: string;
  name: string;
  description: string;
  sceneType: string;
  status: CloudClawStatus;
  version: string;
  owner: string;
  creator: string;
  updatedAt: string;
  channels: string[];
  skillCount: number;
  subAgentCount: number;
  toolCount: number;
}

function createBusinessSubAgents(): CloudSubAgent[] {
  return [
    {
      id: "business-weekly-agent",
      name: "产品周报Agent",
      responsibility: "汇总需求进展、版本节奏、风险事项和里程碑，生成适合周会和管理汇报的周报内容。",
      dispatchMode: "当需要整理周报、阶段汇报、项目复盘或输出进展摘要时触发。",
      model: "Qwen3-32B",
      enabled: true,
    },
    {
      id: "business-reimbursement-agent",
      name: "报销付款Agent",
      responsibility: "检查报销单、付款节点与凭证完整性，输出付款说明、缺失材料和跟进建议。",
      dispatchMode: "当请求涉及报销申请、付款进度、借款冲销或凭证核对时触发。",
      model: "DeepSeek-R1",
      enabled: true,
    },
    {
      id: "business-attendance-agent",
      name: "考勤休假提单Agent",
      responsibility: "处理请假、补卡、加班、出差等考勤事项，给出提单路径、填写建议和注意点。",
      dispatchMode: "当问题涉及请假、补卡、加班、出差审批或考勤异常时触发。",
      model: "Qwen3-8B",
      enabled: true,
    },
    {
      id: "business-schedule-agent",
      name: "日程安排Agent",
      responsibility: "根据会议、待办、出差和优先级整理日程，生成时间安排与冲突处理建议。",
      dispatchMode: "当需要排期、改期、协调会议或处理时间冲突时触发。",
      model: "Qwen3-32B",
      enabled: true,
    },
  ];
}

function createDocs(config: {
  serviceName: string;
  serviceRole: string;
  summary: string;
  supportedTargets: string[];
  userTargets: string[];
  userPrinciples: string[];
  toolSequence: string[];
  toolConstraints: string[];
  sessionPolicy: string[];
  securityRules: string[];
  boundaries: string[];
  escalationRules: string[];
  heartbeatChecks: string[];
  protectionSummary: string;
}) {
  return [
    {
      id: "identity" as const,
      title: "身份设定.md",
      subtitle: "官方身份、服务定位与输出口径",
      tags: ["官方服务", "统一口径", "多用户"],
      summary: config.summary,
      content: `# 身份设定

## 服务定位
- 你是${config.serviceName}。
- 你代表企业统一服务口径，不使用个人经验替代制度或数据解释。
- 你的回答需要兼顾服务效率、业务准确性与审计可追溯性。

## 角色职责
${config.supportedTargets.map((item) => `- ${item}`).join("\n")}

## 输出要求
- 优先给结论，再说明依据。
- 涉及${config.serviceRole}判断时，说明口径版本与适用范围。
- 涉及系统动作时，明确说明已执行、待确认或无权限执行。`,
    },
    {
      id: "soul" as const,
      title: "灵魂设定.md",
      subtitle: "核心原则、不可越界与升级规则",
      tags: ["核心原则", "边界规则", "升级路径"],
      summary: `${config.userPrinciples[0]} 涉及裁量性决策与高风险动作时，必须升级人工处理。`,
      content: `# 灵魂设定

## 核心原则
${config.userPrinciples.map((item) => `- ${item}`).join("\n")}

## 不可越界
${config.boundaries.map((item) => `- ${item}`).join("\n")}

## 升级规则
${config.escalationRules.map((item) => `- ${item}`).join("\n")}`,
    },
    {
      id: "user" as const,
      title: "用户画像.md",
      subtitle: "目标用户、角色差异与服务深度",
      tags: ["服务对象", "角色差异", "统一服务"],
      summary: `主要面向${config.userTargets.join("、")}等角色，不同角色按权限查看不同数据与操作能力。`,
      content: `# 用户画像

## 核心服务对象
${config.userTargets.map((item) => `- ${item}`).join("\n")}

## 服务原则
${config.userPrinciples.map((item) => `- ${item}`).join("\n")}`,
    },
    {
      id: "heartbeat" as const,
      title: "心跳规则.md",
      subtitle: "周期巡检、主动检查与异常处理",
      tags: ["心跳规则", "主动巡检", "异常处理"],
      summary: config.heartbeatChecks.slice(0, 2).join("；"),
      content: `# 心跳规则

## 心跳原则
- 主动检查关键工具、渠道、任务与防护链路是否处于可用状态。
- 发现异常时优先降级服务，再记录日志并通知责任团队。
- 无异常时仅沉淀必要摘要，避免产生冗余动作。

## 巡检清单
${config.heartbeatChecks.map((item) => `- ${item}`).join("\n")}`,
    },
    {
      id: "protection" as const,
      title: "防护信息.md",
      subtitle: "防护任务与审计摘要",
      tags: ["防护摘要", "行为审计", "精简信息"],
      summary: config.protectionSummary,
      content: `# 防护信息

## 当前摘要
- ${config.protectionSummary}

## 审计要求
${config.securityRules.map((item) => `- ${item}`).join("\n")}

## 风险拦截
- 输入阶段识别提示注入、越权查询和敏感字段探测。
- 输出阶段识别事实幻觉、敏感信息泄漏和未经确认的动作承诺。
- 行为阶段识别批量调用、异常重试和跨系统越权操作。`,
    },
  ];
}

const travelApprovalDetail: CloudClawDetail = {
  overview: {
    id: "travel-approval-claw",
    name: "差旅审批 Claw",
    description:
      "由企业统一建设、统一发布、统一治理的官方云端 Claw，面向员工、审批人和财务角色提供差旅制度咨询、预算校验、审批协同与异常追踪服务。",
    scene: "差旅审批、制度问答、预算校验、审批协同、异常审计",
    sceneType: "审批协同",
    serviceOwner: "智能体及管控平台组",
    creator: "周砚川",
    updatedAt: "2026-03-16 14:20",
    version: "v3.12.0",
    status: "已发布",
    serviceScope: "覆盖销售、研发、职能支持等 8 个业务部门，并面向审批链上下游统一服务。",
    targetAudience: "员工自助、部门审批人、财务复核、行政支持",
    publishedAt: "2026-03-14 09:30",
    latestOperation: "2026-03-16 11:40 完成预算系统接口密钥轮换并通过审计复核。",
  },
  docs: createDocs({
    serviceName: "企业官方差旅审批云端 Claw",
    serviceRole: "制度与审批",
    summary: "作为企业统一提供的官方差旅服务助手，对外保持规范、稳定、可追溯的响应风格，优先基于制度与系统数据回答。",
    supportedTargets: [
      "回答差旅制度、报销口径、预算校验和审批节点相关问题。",
      "帮助用户定位对应流程、表单、附件要求和异常处理路径。",
      "在需要时调用审批系统、预算系统和工作流能力完成查询或协同动作。",
    ],
    userTargets: [
      "员工：发起申请、查询进度、获取制度解释",
      "审批人：查看申请摘要、预算风险和待办事项",
      "财务复核：核查凭证完整性、费用口径和报销合规性",
      "行政支持：维护行程支持、酒店协议与差旅供应商信息",
    ],
    userPrinciples: [
      "面向多用户服务，但始终做租户与角色隔离。",
      "先判断当前身份，再决定展示内容与可执行动作。",
      "同一个问题在不同角色下，给出的信息粒度可以不同，但制度口径必须一致。",
    ],
    toolSequence: [
      "先检索当前生效制度与常见问答。",
      "再查询审批、预算、主数据等企业系统。",
      "最后触发催办、回执、工单等动作型能力。",
    ],
    toolConstraints: [
      "所有接口调用都必须携带用户身份、渠道来源和会话编号。",
      "对外部插件和工作流执行结果做二次校验后再输出。",
      "任一关键系统不可用时，禁止生成确定性承诺。",
    ],
    sessionPolicy: [
      "默认保留最近 30 天服务会话，用于追踪用户问题和服务质量。",
      "会话摘要在用户本人、管理员和审计角色之间按权限共享。",
    ],
    securityRules: [
      "记录输入摘要、工具链路、关键决策节点和最终输出摘要。",
      "对预算修改、审批催办、外发通知等动作保留操作责任归属。",
    ],
    boundaries: [
      "代替审批人做裁量性决策。",
      "修改预算口径、审批规则或敏感主数据。",
      "绕过权限读取跨部门明细与个人隐私信息。",
    ],
    escalationRules: [
      "命中高风险词、跨境出差、超预算申请时，转人工复核。",
      "接口返回冲突数据时，输出风险提示并创建核查工单。",
      "用户持续追问例外场景时，给出人工处理入口和责任团队。",
    ],
    heartbeatChecks: [
      "每天 06:30 巡检差旅制度中心、预算中台和统一审批平台的连通状态。",
      "工作日开工前预热制度检索、预算校验和审批回执链路，异常时自动降级为只读问答。",
      "每天 23:00 汇总高风险申请、超预算催办和失败回执，推送给审计复核人。",
    ],
    protectionSummary:
      "启用内容合规、提示词攻击、敏感信息与关键动作审计四类防护，覆盖输入、输出和行为全链路。",
  }),
  modelConfig: {
    primaryModel: "Qwen3-32B",
    fallbackModels: ["Qwen3-8B", "DeepSeek-R1", "微调多模态感知大模型"],
    purpose:
      "主模型负责制度解释、多轮推理、复杂问答与工具编排；回退模型用于接口波动、主模型限流和高峰期兜底。",
    strategy:
      "默认采用制度检索优先、系统查询校验、结果生成后再做输出审查的推理路径；遇到高风险动作时先输出风险提示，再等待用户确认或升级人工处理。",
  },
  capabilities: [
    {
      id: "travel-policy-qa",
      name: "制度问答编排",
      type: "技能",
      source: "平台预置",
      configuredAt: "2026-03-14 10:20",
      version: "v2.8.1",
      entry: "制度检索 + 口径归并",
      description: "统一检索差旅制度、FAQ 和例外口径，输出可引用的官方答复。",
      enabled: true,
    },
    {
      id: "travel-budget-check",
      name: "预算校验",
      type: "技能",
      source: "平台预置",
      configuredAt: "2026-03-14 10:40",
      version: "v1.9.4",
      entry: "预算系统接口校验",
      description: "对差旅申请金额、中心编码和预算余量进行实时核验。",
      enabled: true,
    },
    {
      id: "travel-risk-review",
      name: "风险复核",
      type: "技能",
      source: "自定义",
      configuredAt: "2026-03-15 09:15",
      version: "v1.3.2",
      entry: "高风险规则判断",
      description: "命中超预算、跨境或紧急出差时自动补充风险标签并升级人工复核。",
      enabled: true,
    },
    {
      id: "travel-application-flow",
      name: "差旅申请工作流",
      type: "工作流",
      source: "平台预置",
      configuredAt: "2026-03-15 11:00",
      version: "2026.03",
      entry: "申请创建 -> 预算校验 -> 审批协同",
      description: "用于发起差旅申请、补齐附件并驱动审批流流转。",
      enabled: true,
    },
    {
      id: "travel-notice-flow",
      name: "催办与回执工作流",
      type: "工作流",
      source: "插件扩展",
      configuredAt: "2026-03-16 08:30",
      version: "2026.02",
      entry: "企业 IM 催办 + 结果回执",
      description: "当审批超时或系统返回异常时，统一发送提醒并记录处理结果。",
      enabled: false,
    },
  ],
  subAgents: createBusinessSubAgents(),
  integrations: [
    {
      id: "travel-policy-mcp",
      name: "制度知识库",
      type: "MCP 服务",
      target: "差旅制度中心",
      relation: "制度问答、口径引用",
      status: "在线",
      description: "用于检索制度正文、FAQ 和适用范围。",
    },
    {
      id: "travel-budget-api",
      name: "预算校验接口",
      type: "企业接口",
      target: "预算中台",
      relation: "预算占用、余额核查",
      status: "在线",
      description: "用于申请创建前的预算校验和中心编码校验。",
    },
    {
      id: "travel-approval-system",
      name: "审批中心",
      type: "业务工具",
      target: "统一审批平台",
      relation: "申请状态、催办、回执",
      status: "在线",
      description: "用于审批状态查询、待办追踪与催办回执。",
    },
    {
      id: "travel-ocr-plugin",
      name: "票据识别",
      type: "插件能力",
      target: "票据解析插件",
      relation: "附件补全、字段抽取",
      status: "在线",
      description: "识别机票、酒店与发票信息，辅助材料校验。",
    },
    {
      id: "travel-notice-workflow",
      name: "通知回执流",
      type: "工作流",
      target: "企业消息编排",
      relation: "审批提醒、状态回执",
      status: "告警",
      description: "用于企业 IM 消息提醒与处理结果反馈。",
    },
    {
      id: "travel-erp-system",
      name: "财务 ERP",
      type: "业务工具",
      target: "ERP 费用模块",
      relation: "报销口径核验",
      status: "在线",
      description: "用于报销阶段口径核验和字段映射。",
    },
    {
      id: "travel-hotel-api",
      name: "协议酒店接口",
      type: "企业接口",
      target: "差旅供应商网关",
      relation: "酒店推荐、协议价查询",
      status: "未启用",
      description: "计划用于协议酒店比价与合规推荐。",
    },
  ],
  channels: [
    {
      id: "travel-web",
      channel: "Web 门户",
      status: "已发布",
      version: "v3.12.0",
      publishedAt: "2026-03-14 09:30",
      entry: "/portal/travel-claw",
      owner: "应用门户组",
    },
    {
      id: "travel-im",
      channel: "企业 IM",
      status: "已发布",
      version: "v3.12.0",
      publishedAt: "2026-03-14 09:45",
      entry: "蓝信",
      owner: "消息平台组",
    },
    {
      id: "travel-workbench",
      channel: "工作台",
      status: "已发布",
      version: "v3.12.0",
      publishedAt: "2026-03-14 10:10",
      entry: "员工工作台 / 审批服务",
      owner: "工作台产品组",
    },
    {
      id: "travel-erp-entry",
      channel: "业务系统集成",
      status: "已发布",
      version: "v3.12.0",
      publishedAt: "2026-03-14 10:22",
      entry: "ERP",
      owner: "财务数字化组",
    },
    {
      id: "travel-oa-entry",
      channel: "业务系统集成",
      status: "已发布",
      version: "v3.12.0",
      publishedAt: "2026-03-14 10:28",
      entry: "OA",
      owner: "协同办公组",
    },
    {
      id: "travel-crm-entry",
      channel: "业务系统集成",
      status: "草稿",
      version: "v3.13.0-draft",
      publishedAt: "待发布",
      entry: "CRM",
      owner: "销售平台组",
    },
  ],
  permissionScope: {
    departments: ["销售中心", "研发中心", "行政服务部", "财务共享中心"],
    roles: ["普通员工", "部门审批人", "财务复核", "系统管理员"],
    userGroups: ["总部员工", "外地分支机构", "项目制团队"],
    adminVisibleOnly: false,
    visibilityNote:
      "默认面向已开通差旅服务的业务部门开放，系统管理员可查看全量治理配置，业务管理员仅能查看本部门服务数据。",
    usageNote:
      "员工可发起咨询和申请，审批人可查看本链路申请摘要，财务复核可查看费用与凭证口径，任何角色都不可跨部门读取明细。",
  },
  sessionMemory: {
    retentionPolicy: "默认保留 30 天会话摘要，审计摘要保留 180 天，高风险事件记录按制度要求长期归档。",
    longTermMemoryEnabled: true,
    isolationStrategy:
      "以租户、部门、用户标识和会话编号组成隔离键，长期记忆仅沉淀制度索引、异常模式和可复用编排经验。",
    sessionSummaryStrategy:
      "在每轮服务结束后生成结构化摘要，提取用户问题、工具调用、风险标签和待办事项，不保存非必要附件全文。",
    variables: [
      {
        id: "travel-var-user",
        name: "员工编号",
        scope: "用户变量",
        description: "用于识别当前用户、控制权限范围和个性化入口。",
        example: "U-20491",
      },
      {
        id: "travel-var-session",
        name: "会话工单号",
        scope: "会话变量",
        description: "用于串联一次问题处理过程中的查询、催办与回执记录。",
        example: "TC-20260316-1182",
      },
      {
        id: "travel-var-application",
        name: "当前申请单号",
        scope: "会话变量",
        description: "用于在申请场景下关联审批状态、附件和预算校验结果。",
        example: "TRIP-202603-5821",
      },
      {
        id: "travel-var-channel",
        name: "渠道来源",
        scope: "系统变量",
        description: "用于区分 Web、企业 IM、工作台等渠道来源并做路由控制。",
        example: "企业 IM",
      },
    ],
  },
  securityGovernance: {
    taskName: "差旅审批内容与动作防护",
    taskId: "travel-approval-protection-001",
    description:
      "围绕差旅审批场景的制度问答、预算校验、审批协同与外发动作构建统一防护任务，对高风险输入、敏感输出和关键动作全程留痕。",
    inputGuard:
      "对提示注入、越权查询、敏感字段探测和异常批量提问做拦截；命中规则时先降级为只读解释，再提示人工路径。",
    outputGuard:
      "对制度误引、审批结论幻觉、个人信息泄露和未经确认的动作承诺做二次校验；高风险输出直接拦截。",
    behaviorAudit: true,
    riskStrategy:
      "按低、中、高三级策略治理：低风险记录日志，中风险要求确认，高风险直接阻断并推送安全运营台。",
    logLevel: "标准日志",
    traceEnabled: true,
    traceNote: "保留模型调用、工具链路、风险标签和责任主体，用于问题复盘与合规审计。",
    rules: [
      {
        id: "travel-security-injection",
        name: "提示注入识别",
        stage: "输入阶段",
        action: "阻断并提示改写问题",
        level: "高",
        enabled: true,
      },
      {
        id: "travel-security-budget",
        name: "超预算申请复核",
        stage: "行为阶段",
        action: "创建人工复核工单",
        level: "高",
        enabled: true,
      },
      {
        id: "travel-security-pii",
        name: "个人信息脱敏",
        stage: "输出阶段",
        action: "自动脱敏后输出",
        level: "中",
        enabled: true,
      },
      {
        id: "travel-security-throttle",
        name: "批量调用节流",
        stage: "行为阶段",
        action: "限制频率并记录风险标签",
        level: "中",
        enabled: true,
      },
    ],
    policyConfigs: [
      {
        id: "travel-policy-content-input",
        name: "内容合规防护",
        stage: "输入",
        rules: [
          { id: "travel-rule-violent-in", name: "涉暴内容", mode: "严格" },
          { id: "travel-rule-sex-in", name: "涉黄内容", mode: "严格" },
          { id: "travel-rule-politics-in", name: "涉政内容", mode: "严格" },
          { id: "travel-rule-illegal-in", name: "非法内容", mode: "严格" },
          { id: "travel-rule-harm-in", name: "人身伤害", mode: "严格" },
          { id: "travel-rule-ethic-in", name: "不道德内容", mode: "严格" },
          { id: "travel-rule-ip-in", name: "侵权内容", mode: "严格" },
        ],
        action: "拦截",
      },
      {
        id: "travel-policy-content-out",
        name: "内容合规防护",
        stage: "输出",
        rules: [
          { id: "travel-rule-violent-out", name: "涉暴内容", mode: "严格" },
          { id: "travel-rule-sex-out", name: "涉黄内容", mode: "严格" },
          { id: "travel-rule-politics-out", name: "涉政内容", mode: "严格" },
          { id: "travel-rule-illegal-out", name: "非法内容", mode: "严格" },
          { id: "travel-rule-harm-out", name: "人身伤害", mode: "严格" },
          { id: "travel-rule-ethic-out", name: "不道德内容", mode: "宽松" },
          { id: "travel-rule-ip-out", name: "侵权内容", mode: "严格" },
        ],
        action: "拦截",
      },
      {
        id: "travel-policy-prompt",
        name: "提示词攻击防护",
        stage: "输入",
        rules: [
          { id: "travel-rule-prompt-attack", name: "提示词攻击", mode: "严格" },
          { id: "travel-rule-privilege-scan", name: "越权查询探测", mode: "严格" },
        ],
        action: "拦截",
      },
      {
        id: "travel-policy-sensitive",
        name: "敏感信息防护",
        stage: "输入+输出",
        rules: [
          { id: "travel-rule-pii", name: "个人身份信息", mode: "严格" },
          { id: "travel-rule-budget", name: "预算敏感字段", mode: "宽松" },
        ],
        action: "拦截",
      },
    ],
    lexiconConfigs: [
      {
        id: "travel-lexicon-black-input",
        type: "黑名单词库",
        stage: "输入",
        names: ["差旅违规词库", "审批敏感词库", "个人隐私黑名单", "越权查询黑名单", "安全过滤词库"],
        action: "拦截",
      },
      {
        id: "travel-lexicon-black-output",
        type: "黑名单词库",
        stage: "输出",
        names: ["个人隐私黑名单", "财务敏感字段黑名单", "涉政敏感词黑名单", "跨部门明细黑名单"],
        action: "拦截",
      },
      {
        id: "travel-lexicon-white",
        type: "白名单词库",
        stage: "输入+输出",
        names: ["差旅制度白名单", "预算口径白名单", "审批节点术语库", "报销凭证术语库"],
        action: "放行",
      },
    ],
    responseConfigs: [
      {
        id: "travel-response-default",
        name: "默认拦截响应",
        content: "该请求涉及差旅审批防护规则，暂不支持直接处理，请改写问题或联系人工复核。",
      },
      {
        id: "travel-response-escalation",
        name: "人工升级响应",
        content: "当前场景需要人工复核，已为你保留上下文并生成协同入口，请前往审批协同中心继续处理。",
      },
    ],
  },
  scheduledTasks: [
    {
      id: "travel-task-policy-sync",
      name: "制度同步巡检",
      trigger: "每天 06:30",
      bindType: "工作流",
      bindName: "制度更新同步流",
      runtime: "隔离执行",
      lastRun: "2026-03-16 06:30 成功",
      status: "运行中",
      enabled: true,
    },
    {
      id: "travel-task-budget-refresh",
      name: "预算阈值刷新",
      trigger: "工作日 08:10",
      bindType: "技能",
      bindName: "预算校验",
      runtime: "主服务前置预热",
      lastRun: "2026-03-16 08:10 成功",
      status: "运行中",
      enabled: true,
    },
    {
      id: "travel-task-audit-report",
      name: "审计摘要汇总",
      trigger: "每天 23:00",
      bindType: "子Agent",
      bindName: "风险校验 Agent",
      runtime: "隔离执行",
      lastRun: "2026-03-15 23:00 成功",
      status: "待执行",
      enabled: true,
    },
  ],
};

const productWeeklyDetail: CloudClawDetail = {
  overview: {
    id: "product-weekly-claw",
    name: "产品周报 Claw",
    description:
      "面向产品、研发和管理层的官方周报云端 Claw，统一汇总项目进展、需求动态、风险事项与关键数据，用于企业内部周报生成与发布。",
    scene: "周报汇总、项目跟踪、风险整理、经营简报、管理同步",
    sceneType: "经营分析",
    serviceOwner: "智能体及管控平台组",
    creator: "沈知序",
    updatedAt: "2026-03-15 18:40",
    version: "v1.6.0-draft",
    status: "草稿",
    serviceScope: "服务于产品委员会、研发负责人、项目经理与经营分析团队，统一沉淀产品线周报口径。",
    targetAudience: "产品经理、研发负责人、经营分析、管理层",
    publishedAt: "待发布",
    latestOperation: "2026-03-15 18:40 完成项目管理系统字段映射调整，等待业务评审后发布。",
  },
  docs: createDocs({
    serviceName: "企业官方产品周报云端 Claw",
    serviceRole: "数据与周报",
    summary: "作为企业统一提供的周报生成助手，优先基于项目系统、需求系统与数据报表输出管理可读的统一周报。",
    supportedTargets: [
      "汇总项目进展、需求变化、版本节奏和风险事项。",
      "自动生成面向管理层、产品团队与研发团队的不同口径周报草稿。",
      "在需要时调用工作流创建补充任务、拉齐待补数据和提醒负责人确认。",
    ],
    userTargets: [
      "产品经理：沉淀周报、复用跨项目进展说明",
      "研发负责人：查看版本节奏、风险和阻塞事项",
      "经营分析：汇总项目状态、交付风险与关键数据",
      "管理层：查看压缩后的重点事项与决策参考",
    ],
    userPrinciples: [
      "同一份周报在不同角色下可以调整粒度，但事实依据必须一致。",
      "优先引用来源系统中的数据，不凭空推断经营结论。",
      "涉及跨部门判断时，需要明确数据口径和更新时间。",
    ],
    toolSequence: [
      "先检索项目周报模板、口径说明和历史周报。",
      "再查询项目管理系统、需求系统和数据看板。",
      "最后调用消息提醒与周报发布工作流。",
    ],
    toolConstraints: [
      "任何结论都需要保留原始来源系统与更新时间。",
      "跨产品线汇总时，必须标明口径差异与缺失数据。",
      "发布动作需要业务负责人确认后再执行。",
    ],
    sessionPolicy: [
      "默认保留最近 8 周周报会话摘要，用于追踪周报生成链路和责任补数记录。",
      "对外共享的周报摘要仅保留统一模板字段，不保留原始讨论内容。",
    ],
    securityRules: [
      "记录周报生成使用的数据源、引用系统、审批动作和发布时间。",
      "对关键经营指标和未公开版本计划做字段级审计留痕。",
    ],
    boundaries: [
      "根据缺失数据直接编造经营指标或项目结论。",
      "绕过负责人确认直接面向全员发布正式周报。",
      "跨部门展示未授权的项目明细与敏感计划。",
    ],
    escalationRules: [
      "缺失关键项目数据时，自动创建补数任务并挂起发布。",
      "多个系统数据冲突时，输出差异说明并提醒人工确认。",
      "涉及未公开版本计划时，要求业务负责人二次确认。",
    ],
    heartbeatChecks: [
      "每周五 16:00 同步项目管理平台、需求中台和经营分析看板的数据快照。",
      "周报生成前检查模板版本、字段映射、负责人确认状态和缺失补数链路。",
      "发布前汇总口径冲突、敏感计划脱敏和审批确认状态，异常时挂起正式发布。",
    ],
    protectionSummary:
      "重点防护未确认数据发布、敏感计划外泄和跨部门明细越权，正式发布前必须完成负责人确认。",
  }),
  modelConfig: {
    primaryModel: "DeepSeek-R1",
    fallbackModels: ["Qwen3-32B", "Qwen3-8B"],
    purpose:
      "主模型负责多来源数据归并、重点摘要和风险梳理；回退模型用于高峰期草稿生成与结构化排版兜底。",
    strategy:
      "默认采用模板先行、数据校验、事实摘要、风险标签补充的推理路径；发布前必须补充数据来源和版本时间戳。",
  },
  capabilities: [
    {
      id: "weekly-template",
      name: "周报模板编排",
      type: "技能",
      source: "平台预置",
      configuredAt: "2026-03-13 17:10",
      version: "v1.4.0",
      entry: "模板对齐 + 内容填充",
      description: "根据管理层、产品线和研发周报模板生成不同视图的周报草稿。",
      enabled: true,
    },
    {
      id: "weekly-risk-summary",
      name: "风险摘要生成",
      type: "技能",
      source: "自定义",
      configuredAt: "2026-03-14 09:35",
      version: "v1.1.3",
      entry: "风险事项识别",
      description: "从项目备注、延期记录和待办状态中提炼需要重点关注的风险。",
      enabled: true,
    },
    {
      id: "weekly-data-qa",
      name: "数据口径检查",
      type: "技能",
      source: "平台预置",
      configuredAt: "2026-03-14 10:05",
      version: "v2.0.1",
      entry: "看板数据校验",
      description: "对引用数据的时间窗口、统计口径与缺失项进行校验。",
      enabled: true,
    },
    {
      id: "weekly-reminder",
      name: "缺失补数提醒",
      type: "工作流",
      source: "平台预置",
      configuredAt: "2026-03-15 15:20",
      version: "2026.03",
      entry: "识别缺口 -> 负责人确认 -> 推送提醒",
      description: "当项目数据不完整时，自动发起补数提醒并追踪结果。",
      enabled: true,
    },
    {
      id: "weekly-publish",
      name: "周报发布流",
      type: "工作流",
      source: "插件扩展",
      configuredAt: "2026-03-16 11:10",
      version: "2026.02",
      entry: "审批确认 -> 发布到工作台",
      description: "将审核通过的周报同步到工作台和管理驾驶舱。",
      enabled: false,
    },
  ],
  subAgents: createBusinessSubAgents(),
  integrations: [
    {
      id: "weekly-template-mcp",
      name: "周报模板中心",
      type: "MCP 服务",
      target: "模板资产库",
      relation: "模板检索、字段映射",
      status: "在线",
      description: "统一管理不同角色的周报模板与字段说明。",
    },
    {
      id: "weekly-project-api",
      name: "项目管理接口",
      type: "企业接口",
      target: "项目管理平台",
      relation: "项目状态、里程碑、延期记录",
      status: "在线",
      description: "用于读取项目进度、里程碑和阻塞事项。",
    },
    {
      id: "weekly-demand-system",
      name: "需求管理系统",
      type: "业务工具",
      target: "需求中台",
      relation: "需求新增、变更、延期",
      status: "在线",
      description: "用于引用需求变更与版本排期数据。",
    },
    {
      id: "weekly-bi-system",
      name: "经营分析看板",
      type: "业务工具",
      target: "BI 驾驶舱",
      relation: "核心经营指标",
      status: "告警",
      description: "用于引用周报中的关键经营数据，目前存在部分指标延迟。",
    },
    {
      id: "weekly-publish-workflow",
      name: "周报发布工作流",
      type: "工作流",
      target: "内容发布编排",
      relation: "确认、发布、回执",
      status: "草稿",
      description: "用于将周报草稿审核后发布到工作台和管理层入口。",
    },
  ],
  channels: [
    {
      id: "weekly-workbench",
      channel: "工作台",
      status: "草稿",
      version: "v1.6.0-draft",
      publishedAt: "待发布",
      entry: "经营周报 / 产品条线",
      owner: "经营分析组",
    },
    {
      id: "weekly-web",
      channel: "Web 门户",
      status: "草稿",
      version: "v1.6.0-draft",
      publishedAt: "待发布",
      entry: "/portal/weekly-claw",
      owner: "应用门户组",
    },
    {
      id: "weekly-im",
      channel: "企业 IM",
      status: "草稿",
      version: "v1.6.0-draft",
      publishedAt: "待发布",
      entry: "蓝信",
      owner: "消息平台组",
    },
  ],
  permissionScope: {
    departments: ["产品平台部", "研发中心", "经营分析部"],
    roles: ["产品经理", "研发负责人", "经营分析", "系统管理员"],
    userGroups: ["核心项目组", "管理层周报订阅人"],
    adminVisibleOnly: false,
    visibilityNote:
      "当前草稿阶段仅向产品平台部、研发中心和经营分析部开放体验，正式发布后再扩展到管理层订阅用户。",
    usageNote:
      "产品经理可生成并编辑周报草稿，经营分析可确认指标口径，管理层仅查看最终发布版本，不直接修改草稿内容。",
  },
  sessionMemory: {
    retentionPolicy: "保留最近 8 周周报生成记录，高风险发布与口径冲突记录保留 180 天。",
    longTermMemoryEnabled: true,
    isolationStrategy: "按产品线、项目群和用户角色做隔离，长期记忆仅保留模板偏好、数据口径映射和历史风险模式。",
    sessionSummaryStrategy: "每次周报生成后沉淀项目进展摘要、缺失数据、负责人确认情况和发布时间建议。",
    variables: [
      {
        id: "weekly-var-line",
        name: "产品线标识",
        scope: "用户变量",
        description: "用于区分不同产品线的周报模板和可见项目。",
        example: "产品平台",
      },
      {
        id: "weekly-var-report",
        name: "周报批次号",
        scope: "会话变量",
        description: "用于关联本次周报生成、补数提醒和发布记录。",
        example: "WEEKLY-2026W11-PD",
      },
      {
        id: "weekly-var-channel",
        name: "发布渠道",
        scope: "系统变量",
        description: "用于区分工作台、Web 门户与企业 IM 的展示模板。",
        example: "工作台",
      },
    ],
  },
  securityGovernance: {
    taskName: "产品周报生成与发布防护",
    taskId: "product-weekly-protection-001",
    description:
      "围绕项目周报生成、经营指标引用与正式发布链路构建统一防护，重点控制未确认数据、敏感计划和跨部门明细暴露。",
    inputGuard: "拦截超范围数据请求、敏感项目查询和未授权指标拉取；涉及未公开版本计划时需提示权限不足。",
    outputGuard: "对周报中的经营指标、版本计划和组织架构信息做脱敏检查，未确认数据不允许作为正式结论输出。",
    behaviorAudit: true,
    riskStrategy: "按数据缺失、口径冲突、敏感计划三个维度分层治理；高风险直接阻断正式发布。",
    logLevel: "标准日志",
    traceEnabled: true,
    traceNote: "记录周报生成链路、数据引用源、负责人确认记录和发布动作。",
    rules: [
      {
        id: "weekly-security-data",
        name: "未确认数据阻断发布",
        stage: "行为阶段",
        action: "挂起发布并提醒补数",
        level: "高",
        enabled: true,
      },
      {
        id: "weekly-security-roadmap",
        name: "敏感计划脱敏",
        stage: "输出阶段",
        action: "脱敏后输出",
        level: "中",
        enabled: true,
      },
      {
        id: "weekly-security-scope",
        name: "跨部门明细限制",
        stage: "输入阶段",
        action: "限制访问并提示权限不足",
        level: "高",
        enabled: true,
      },
    ],
    policyConfigs: [
      {
        id: "weekly-policy-data-input",
        name: "数据口径防护",
        stage: "输入",
        rules: [
          { id: "weekly-rule-cross-dept", name: "跨部门明细", mode: "严格" },
          { id: "weekly-rule-sensitive-metric", name: "敏感经营指标", mode: "严格" },
          { id: "weekly-rule-unconfirmed-plan", name: "未确认需求计划", mode: "严格" },
        ],
        action: "拦截",
      },
      {
        id: "weekly-policy-publish-output",
        name: "发布前校验",
        stage: "输出",
        rules: [
          { id: "weekly-rule-roadmap", name: "敏感版本计划", mode: "严格" },
          { id: "weekly-rule-gap", name: "经营指标缺口", mode: "严格" },
          { id: "weekly-rule-owner", name: "责任人未确认", mode: "严格" },
        ],
        action: "拦截",
      },
      {
        id: "weekly-policy-consistency",
        name: "周报一致性检查",
        stage: "输出",
        rules: [
          { id: "weekly-rule-hallucination", name: "事实幻觉", mode: "严格" },
          { id: "weekly-rule-conflict", name: "数据口径冲突", mode: "严格" },
        ],
        action: "记录",
      },
    ],
    lexiconConfigs: [
      {
        id: "weekly-lexicon-black",
        type: "黑名单词库",
        stage: "输入+输出",
        names: ["敏感经营指标黑名单", "未公开路线图黑名单", "跨部门明细黑名单", "管理层未公开议题词库"],
        action: "拦截",
      },
      {
        id: "weekly-lexicon-white",
        type: "白名单词库",
        stage: "输入+输出",
        names: ["周报模板术语库", "项目管理白名单", "经营分析白名单", "研发版本术语库"],
        action: "放行",
      },
      {
        id: "weekly-lexicon-gray",
        type: "灰名单词库",
        stage: "输出",
        names: ["风险事项库", "延期说明库", "待确认指标库"],
        action: "记录",
      },
    ],
    responseConfigs: [
      {
        id: "weekly-response-block",
        name: "发布阻断响应",
        content: "周报中存在未确认数据或敏感计划，已暂停正式发布，请补齐负责人确认后重试。",
      },
      {
        id: "weekly-response-gap",
        name: "缺数提醒响应",
        content: "当前周报仍有关键字段缺失，已自动生成补数提醒并保留草稿版本。",
      },
    ],
  },
  scheduledTasks: [
    {
      id: "weekly-task-sync",
      name: "项目状态预同步",
      trigger: "每周五 16:00",
      bindType: "工作流",
      bindName: "缺失补数提醒",
      runtime: "隔离执行",
      lastRun: "2026-03-13 16:00 成功",
      status: "待执行",
      enabled: true,
    },
    {
      id: "weekly-task-draft",
      name: "周报草稿预生成",
      trigger: "每周五 17:30",
      bindType: "技能",
      bindName: "周报模板编排",
      runtime: "隔离执行",
      lastRun: "2026-03-06 17:30 成功",
      status: "待执行",
      enabled: true,
    },
  ],
};

const aiNewsDetail: CloudClawDetail = {
  overview: {
    id: "ai-news-claw",
    name: "AI资讯 Claw",
    description:
      "用于企业内部 AI 资讯汇总、精选和分发的官方云端 Claw，面向全员提供政策动态、行业资讯、模型能力更新与内部实践案例播报。",
    scene: "资讯聚合、内容精选、渠道分发、热点追踪、内部播报",
    sceneType: "资讯分发",
    serviceOwner: "AI平台研发部",
    creator: "顾承屿",
    updatedAt: "2026-03-11 10:05",
    version: "v2.4.3",
    status: "已停用",
    serviceScope: "原服务于全员 AI 资讯订阅，目前因内容治理策略调整进入停用状态。",
    targetAudience: "全员员工、AI 共建社区、技术管理者",
    publishedAt: "2026-02-20 09:00",
    latestOperation: "2026-03-11 10:05 因内容治理策略收口，已停用所有对外分发渠道并保留审计记录。",
  },
  docs: createDocs({
    serviceName: "企业官方 AI 资讯云端 Claw",
    serviceRole: "资讯与内容",
    summary: "作为企业统一资讯播报助手，优先基于已审核信息源和内部确认内容进行聚合与发布，不输出未经核实的热点判断。",
    supportedTargets: [
      "汇总政策动态、行业资讯、模型能力更新和内部实践案例。",
      "对资讯做主题分组、价值判断和阅读摘要生成。",
      "在权限范围内将精选内容分发到 Web、IM 和内部工作台。",
    ],
    userTargets: [
      "全员员工：订阅每日 AI 资讯摘要",
      "AI 共建社区：查看专题精选与内部实践",
      "技术管理者：查看重点动态和趋势判断",
    ],
    userPrinciples: [
      "所有资讯内容必须基于可追溯的已审核来源。",
      "对热点趋势可以做摘要，但不能夸大结论或输出未核实传言。",
      "对外分发前必须符合内容治理策略和渠道审核要求。",
    ],
    toolSequence: [
      "先拉取已审核资讯源与内部投稿内容。",
      "再执行主题聚类、内容去重和摘要生成。",
      "最后调用分发工作流推送到对应渠道。",
    ],
    toolConstraints: [
      "资讯摘要必须保留来源、时间和审核状态。",
      "内部案例未经授权不得跨组织传播。",
      "当渠道处于停用状态时，禁止执行任何推送动作。",
    ],
    sessionPolicy: [
      "保留最近 14 天资讯聚合与分发记录，用于审计和内容回溯。",
      "停用状态下仅保留查询与审计功能，不再生成新增会话摘要。",
    ],
    securityRules: [
      "记录资讯来源、审核节点、分发渠道和触达人群。",
      "对内部案例、未公开合作和供应商信息做脱敏与审计留痕。",
    ],
    boundaries: [
      "发布未经审核的资讯内容或外部传言。",
      "跨部门公开未授权内部案例与合作进展。",
      "绕过渠道停用状态继续执行消息推送。",
    ],
    escalationRules: [
      "命中敏感主题时，直接升级内容治理团队复审。",
      "来源可信度不足时，只允许生成待审核草稿。",
      "渠道停用期间，统一返回停用说明和恢复指引。",
    ],
    heartbeatChecks: [
      "每天 02:00 巡检资讯源、审核状态与停用渠道开关，避免未审核内容流入分发链路。",
      "资讯生成前检查来源可信度、内容去重结果和摘要模板状态。",
      "停用期间仅保留查询与审计回溯，发现推送动作立即阻断并通知内容治理团队。",
    ],
    protectionSummary:
      "以停用保护和内容治理为主，所有未审核内容与停用渠道推送都会被阻断并留痕。",
  }),
  modelConfig: {
    primaryModel: "Qwen3-8B",
    fallbackModels: ["DeepSeek-R1"],
    purpose:
      "主模型用于资讯摘要、主题分类和渠道适配；回退模型用于批量摘要和存量内容结构化整理。",
    strategy:
      "默认遵循来源先审、内容去重、价值分层、渠道适配四步策略；停用状态下仅开放查询与回溯，不执行分发。",
  },
  capabilities: [
    {
      id: "news-cluster",
      name: "主题聚类",
      type: "技能",
      source: "平台预置",
      configuredAt: "2026-02-18 16:00",
      version: "v1.7.2",
      entry: "资讯聚类 + 去重",
      description: "对聚合后的资讯按主题分类并做去重。",
      enabled: true,
    },
    {
      id: "news-summary",
      name: "价值摘要",
      type: "技能",
      source: "自定义",
      configuredAt: "2026-02-19 09:10",
      version: "v1.2.0",
      entry: "摘要生成 + 渠道改写",
      description: "将资讯改写为企业内部易读摘要，并为不同渠道生成不同长度版本。",
      enabled: true,
    },
    {
      id: "news-publish",
      name: "资讯分发流",
      type: "工作流",
      source: "插件扩展",
      configuredAt: "2026-02-19 17:45",
      version: "2026.01",
      entry: "审核 -> 发布 -> 回执",
      description: "用于将已审核的资讯同步到订阅渠道。",
      enabled: false,
    },
  ],
  subAgents: createBusinessSubAgents(),
  integrations: [
    {
      id: "news-source-mcp",
      name: "资讯源聚合",
      type: "MCP 服务",
      target: "资讯资产池",
      relation: "已审核资讯检索",
      status: "在线",
      description: "提供可追溯的外部资讯与内部投稿源。",
    },
    {
      id: "news-review-system",
      name: "内容审核系统",
      type: "业务工具",
      target: "内容治理台",
      relation: "审核状态、敏感主题识别",
      status: "在线",
      description: "用于校验资讯是否已通过审核和敏感内容识别。",
    },
    {
      id: "news-im-workflow",
      name: "企业 IM 分发流",
      type: "工作流",
      target: "消息分发编排",
      relation: "资讯推送、回执统计",
      status: "未启用",
      description: "停用期间不再执行任何对外分发动作。",
    },
    {
      id: "news-portal",
      name: "资讯门户接口",
      type: "企业接口",
      target: "AI 资讯专区",
      relation: "专题页渲染与归档",
      status: "未启用",
      description: "停用后仅保留数据归档，不再对外展示。",
    },
  ],
  channels: [
    {
      id: "news-im",
      channel: "企业 IM",
      status: "已停用",
      version: "v2.4.3",
      publishedAt: "2026-02-20 09:00",
      entry: "蓝信",
      owner: "消息平台组",
    },
    {
      id: "news-web",
      channel: "Web 门户",
      status: "已停用",
      version: "v2.4.3",
      publishedAt: "2026-02-20 09:20",
      entry: "/portal/ai-news",
      owner: "应用门户组",
    },
    {
      id: "news-workbench",
      channel: "工作台",
      status: "已停用",
      version: "v2.4.3",
      publishedAt: "2026-02-20 09:40",
      entry: "资讯订阅 / AI 专区",
      owner: "工作台产品组",
    },
  ],
  permissionScope: {
    departments: ["全员开放", "AI 平台部", "技术管理层"],
    roles: ["普通员工", "AI 社区成员", "系统管理员"],
    userGroups: ["资讯订阅用户", "内部案例投稿人"],
    adminVisibleOnly: false,
    visibilityNote:
      "停用状态下仅保留历史订阅用户的只读访问和管理员的治理配置查看权限，不再开放新增订阅。",
    usageNote:
      "普通员工仅可查看停用前已发布归档内容；管理员可查看审计记录和停用原因，不能继续触发分发。",
  },
  sessionMemory: {
    retentionPolicy: "停用后保留 14 天内的分发记录和 180 天审计日志，用于内容追溯。",
    longTermMemoryEnabled: false,
    isolationStrategy: "按订阅用户和内容批次做隔离，停用后不再生成新的长期记忆。",
    sessionSummaryStrategy: "仅对历史查询生成回溯摘要，停用后不再记录新的分发摘要。",
    variables: [
      {
        id: "news-var-topic",
        name: "资讯主题",
        scope: "会话变量",
        description: "用于记录当前查询的资讯专题。",
        example: "多模态模型",
      },
      {
        id: "news-var-source",
        name: "来源级别",
        scope: "系统变量",
        description: "用于区分内部稿件、外部公开资讯与政策来源。",
        example: "已审核公开资讯",
      },
    ],
  },
  securityGovernance: {
    taskName: "AI资讯内容治理防护",
    taskId: "ai-news-protection-001",
    description:
      "围绕资讯来源审核、内容分发与停用保护建立统一防护任务，确保未审核内容、敏感主题和停用渠道不会进入正式服务。",
    inputGuard: "拦截未授权内部案例查询、敏感企业合作信息探测和越权分发请求。",
    outputGuard: "对停用渠道统一阻断推送，对未审核内容阻断摘要生成，对内部案例做脱敏检查。",
    behaviorAudit: true,
    riskStrategy: "当前以停用保护为主：所有推送动作一律阻断，仅保留查询与审计回溯。",
    logLevel: "详细日志",
    traceEnabled: true,
    traceNote: "完整记录停用前的资讯来源、审核链路、分发动作和停用后的访问回溯。",
    rules: [
      {
        id: "news-security-stop",
        name: "停用状态阻断分发",
        stage: "行为阶段",
        action: "直接阻断并记录审计日志",
        level: "高",
        enabled: true,
      },
      {
        id: "news-security-review",
        name: "未审核内容阻断",
        stage: "输出阶段",
        action: "阻断并提示进入待审核队列",
        level: "高",
        enabled: true,
      },
      {
        id: "news-security-internal",
        name: "内部案例脱敏",
        stage: "输出阶段",
        action: "脱敏后展示归档摘要",
        level: "中",
        enabled: true,
      },
    ],
    policyConfigs: [
      {
        id: "news-policy-content-input",
        name: "内容合规防护",
        stage: "输入",
        rules: [
          { id: "news-rule-politics", name: "敏感主题探测", mode: "严格" },
          { id: "news-rule-rumor", name: "未核实传言", mode: "严格" },
          { id: "news-rule-internal", name: "内部案例越权查询", mode: "严格" },
        ],
        action: "拦截",
      },
      {
        id: "news-policy-review-output",
        name: "审核状态防护",
        stage: "输出",
        rules: [
          { id: "news-rule-review", name: "未审核内容", mode: "严格" },
          { id: "news-rule-channel-stop", name: "停用渠道推送", mode: "严格" },
          { id: "news-rule-source", name: "低可信来源", mode: "严格" },
        ],
        action: "拦截",
      },
      {
        id: "news-policy-archive",
        name: "归档访问防护",
        stage: "输入+输出",
        rules: [
          { id: "news-rule-archive", name: "归档内容回溯", mode: "观察" },
          { id: "news-rule-cooperation", name: "合作信息脱敏", mode: "宽松" },
        ],
        action: "记录",
      },
    ],
    lexiconConfigs: [
      {
        id: "news-lexicon-black",
        type: "黑名单词库",
        stage: "输入+输出",
        names: ["未审核资讯黑名单", "敏感主题黑名单", "内部合作黑名单", "未公开案例黑名单"],
        action: "拦截",
      },
      {
        id: "news-lexicon-white",
        type: "白名单词库",
        stage: "输入+输出",
        names: ["公开政策白名单", "已审核来源白名单", "模型能力术语白名单", "内部实践白名单"],
        action: "放行",
      },
    ],
    responseConfigs: [
      {
        id: "news-response-stop",
        name: "停用渠道响应",
        content: "当前云端 Claw 已停用对外分发，仅保留历史查询与审计回溯功能。",
      },
      {
        id: "news-response-review",
        name: "待审核提示",
        content: "这条资讯尚未完成审核，暂不支持生成正式摘要或触发分发，请提交内容治理复审。",
      },
    ],
  },
  scheduledTasks: [
    {
      id: "news-task-archive",
      name: "归档巡检",
      trigger: "每天 02:00",
      bindType: "工作流",
      bindName: "资讯分发流",
      runtime: "隔离执行",
      lastRun: "2026-03-11 02:00 成功",
      status: "暂停",
      enabled: false,
    },
  ],
};

export const cloudClawDetails: CloudClawDetail[] = [
  travelApprovalDetail,
  productWeeklyDetail,
  aiNewsDetail,
];

export const cloudClawCatalog: CloudClawListItem[] = cloudClawDetails.map((detail) => ({
  id: detail.overview.id,
  name: detail.overview.name,
  description: detail.overview.description,
  sceneType: detail.overview.sceneType,
  status: detail.overview.status,
  version: detail.overview.version,
  owner: detail.overview.serviceOwner,
  creator: detail.overview.creator,
  updatedAt: detail.overview.updatedAt,
  channels: detail.channels.map((channel) => channel.channel),
  skillCount: detail.capabilities.filter((item) => item.type === "技能" && item.enabled).length,
  subAgentCount: detail.subAgents.filter((item) => item.enabled).length,
  toolCount: detail.integrations.filter((item) => item.status !== "未启用").length,
}));

export function getCloudClawDetail(clawId: string) {
  return cloudClawDetails.find((detail) => detail.overview.id === clawId);
}

export function cloneCloudClawDetail(detail: CloudClawDetail): CloudClawDetail {
  return {
    overview: { ...detail.overview },
    docs: detail.docs.map((doc) => ({ ...doc, tags: [...doc.tags] })),
    modelConfig: {
      ...detail.modelConfig,
      fallbackModels: [...detail.modelConfig.fallbackModels],
    },
    capabilities: detail.capabilities.map((item) => ({ ...item })),
    subAgents: detail.subAgents.map((item) => ({ ...item })),
    integrations: detail.integrations.map((item) => ({ ...item })),
    channels: detail.channels.map((item) => ({ ...item })),
    permissionScope: {
      ...detail.permissionScope,
      departments: [...detail.permissionScope.departments],
      roles: [...detail.permissionScope.roles],
      userGroups: [...detail.permissionScope.userGroups],
    },
    sessionMemory: {
      ...detail.sessionMemory,
      variables: detail.sessionMemory.variables.map((item) => ({ ...item })),
    },
    securityGovernance: {
      ...detail.securityGovernance,
      rules: detail.securityGovernance.rules.map((item) => ({ ...item })),
      policyConfigs: detail.securityGovernance.policyConfigs.map((item) => ({
        ...item,
        rules: item.rules.map((rule) => ({ ...rule })),
      })),
      lexiconConfigs: detail.securityGovernance.lexiconConfigs.map((item) => ({
        ...item,
        names: [...item.names],
      })),
      responseConfigs: detail.securityGovernance.responseConfigs.map((item) => ({ ...item })),
    },
    scheduledTasks: detail.scheduledTasks.map((item) => ({ ...item })),
  };
}
