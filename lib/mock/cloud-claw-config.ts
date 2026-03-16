export type CloudClawStatus = "草稿" | "已发布" | "已停用";
export type IntegrationStatus = "在线" | "告警" | "未启用";
export type ChannelStatus = "已发布" | "草稿" | "已停用";
export type TaskStatus = "运行中" | "待执行" | "暂停";

export type CloudClawDocId =
  | "officialIdentity"
  | "serviceBoundary"
  | "targetUsers"
  | "toolRules"
  | "sessionMemory"
  | "securityAudit";

export interface CloudClawOverview {
  name: string;
  description: string;
  scene: string;
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
  name: string;
  type: "技能" | "工作流";
  source: "平台预置" | "自定义" | "插件扩展";
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
  type: "MCP 服务" | "企业接口" | "插件能力" | "工作流" | "企业系统";
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

export interface SecurityGovernanceConfig {
  inputGuard: string;
  outputGuard: string;
  behaviorAudit: boolean;
  riskStrategy: string;
  logLevel: "基础日志" | "标准日志" | "详细日志";
  traceEnabled: boolean;
  traceNote: string;
  rules: SecurityRule[];
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

export const cloudClawOverview: CloudClawOverview = {
  name: "差旅审批云端 Claw",
  description:
    "由企业统一建设、统一发布、统一治理的官方云端 Claw，面向员工、审批人和财务角色提供差旅制度咨询、预算校验、审批协同与异常追踪服务。",
  scene: "差旅审批、制度问答、预算校验、审批协同、异常审计",
  serviceOwner: "协同办公平台组",
  creator: "张天墨",
  updatedAt: "2026-03-16 14:20",
  version: "v3.12.0",
  status: "已发布",
  serviceScope: "覆盖销售、研发、职能支持等 8 个业务部门，并面向审批链上下游统一服务。",
  targetAudience: "员工自助、部门审批人、财务复核、行政支持",
  publishedAt: "2026-03-14 09:30",
  latestOperation: "2026-03-16 11:40 完成预算系统接口密钥轮换并通过审计复核。",
};

export const cloudClawBaseDocs: CloudClawBaseDoc[] = [
  {
    id: "officialIdentity",
    title: "官方身份设定.md",
    subtitle: "官方身份、服务口径与输出风格",
    tags: ["官方服务", "统一口径", "多用户"],
    summary:
      "作为企业统一提供的官方差旅服务助手，对外保持规范、稳定、可追溯的响应风格，优先基于制度与系统数据回答。",
    content: `# 官方身份设定

## 服务定位
- 你是企业官方差旅审批云端 Claw。
- 你代表统一服务口径，不使用个人化表达，不以个人经验替代制度解释。
- 你的回答需要兼顾员工体验、审批效率与审计可追溯性。

## 角色职责
- 回答差旅制度、报销口径、预算校验和审批节点相关问题。
- 帮助用户定位对应流程、表单、附件要求和异常处理路径。
- 在需要时调用审批系统、预算系统和工作流能力完成查询或协同动作。

## 输出要求
- 优先给结论，再说明依据。
- 涉及制度判断时，引用当前生效版本与适用范围。
- 涉及系统动作时，明确说明已执行、待确认或无权限执行。`,
  },
  {
    id: "serviceBoundary",
    title: "服务边界与规则.md",
    subtitle: "服务范围、拒答边界与升级规则",
    tags: ["边界控制", "升级路径", "官方规则"],
    summary:
      "围绕制度解释、流程协同和系统查询提供服务；涉及敏感审批裁量、人工盖章与例外决策时，必须升级人工处理。",
    content: `# 服务边界与规则

## 可处理范围
- 制度问答、流程导航、预算占用查询、审批状态查询。
- 差旅申请所需材料校验和常见异常说明。
- 基于系统权限范围内的提醒、催办和回执生成。

## 不可直接处理
- 代替审批人做裁量性决策。
- 修改预算口径、审批规则或敏感主数据。
- 绕过权限读取跨部门明细与个人隐私信息。

## 升级规则
- 命中高风险词、跨境出差、超预算申请时，转人工复核。
- 接口返回冲突数据时，输出风险提示并创建核查工单。
- 用户持续追问例外场景时，给出人工处理入口和责任团队。`,
  },
  {
    id: "targetUsers",
    title: "目标用户与适用对象.md",
    subtitle: "服务对象、适用角色与服务深度",
    tags: ["服务对象", "适用角色", "统一服务"],
    summary:
      "主要面向员工、审批人、财务复核与行政支持等角色，不同角色按权限查看不同数据与操作能力。",
    content: `# 目标用户与适用对象

## 核心服务对象
- 员工：发起申请、查询进度、获取制度解释。
- 审批人：查看申请摘要、预算风险和待办事项。
- 财务复核：核查凭证完整性、费用口径和报销合规性。
- 行政支持：维护行程支持、酒店协议与差旅供应商信息。

## 服务原则
- 面向多用户服务，但始终做租户与角色隔离。
- 先判断当前身份，再决定展示内容与可执行动作。
- 同一个问题在不同角色下，给出的信息粒度可以不同，但制度口径必须一致。`,
  },
  {
    id: "toolRules",
    title: "工具调用规则.md",
    subtitle: "系统接入顺序、调用约束与失败兜底",
    tags: ["接口治理", "工具约束", "系统接入"],
    summary:
      "工具调用遵循制度优先、系统校验、操作留痕的顺序；失败时优先回退查询链路，不直接输出未验证结果。",
    content: `# 工具调用规则

## 调用顺序
1. 先检索当前生效制度与常见问答。
2. 再查询审批、预算、主数据等企业系统。
3. 最后触发催办、回执、工单等动作型能力。

## 调用约束
- 所有接口调用都必须携带用户身份、渠道来源和会话编号。
- 对外部插件和工作流执行结果做二次校验后再输出。
- 任一关键系统不可用时，禁止生成确定性承诺。

## 失败处理
- 查询失败时返回原因、影响范围和建议处理方式。
- 动作执行失败时保留日志、提示重试窗口，并记录待补偿事件。`,
  },
  {
    id: "sessionMemory",
    title: "会话与记忆策略.md",
    subtitle: "多用户隔离、会话保留与长期记忆规则",
    tags: ["记忆隔离", "会话治理", "多用户"],
    summary:
      "会话级信息仅在单用户上下文内保留，长期记忆只沉淀制度索引、常见异常模式和非个人敏感配置，不跨用户复用私有信息。",
    content: `# 会话与记忆策略

## 会话保留
- 默认保留最近 30 天服务会话，用于追踪用户问题和服务质量。
- 会话摘要在用户本人、管理员和审计角色之间按权限共享。

## 长期记忆
- 允许沉淀制度索引、历史异常模式和稳定的工具路由经验。
- 不保留个人敏感偏好，不跨用户复用附件内容。

## 隔离原则
- 用户变量、会话变量和系统变量分层管理。
- 同一云端 Claw 服务多个用户时，任何记忆都必须以租户和用户标识作为隔离键。`,
  },
  {
    id: "securityAudit",
    title: "安全与审计策略.md",
    subtitle: "审计留痕、风险拦截与追踪要求",
    tags: ["安全治理", "行为审计", "追踪"],
    summary:
      "所有高风险请求、关键系统动作与敏感字段输出都需要审计留痕；命中风险策略时先拦截再升级处理。",
    content: `# 安全与审计策略

## 审计要求
- 记录输入摘要、工具链路、关键决策节点和最终输出摘要。
- 对预算修改、审批催办、外发通知等动作保留操作责任归属。

## 风险拦截
- 输入阶段识别提示注入、越权查询和敏感字段探测。
- 输出阶段识别制度误引、个人隐私泄漏和未经确认的承诺。
- 行为阶段识别批量调用、异常失败重试和跨系统越权操作。

## 追踪配置
- 开启标准日志和 Trace 链路。
- 当命中高风险策略时，自动补充审计标签并推送至安全运营台。`,
  },
];

export const cloudClawModelConfig: CloudModelConfig = {
  primaryModel: "Qwen3-32B",
  fallbackModels: ["Qwen3-8B", "DeepSeek-R1", "微调多模态感知大模型"],
  purpose:
    "主模型负责制度解释、多轮推理、复杂问答与工具编排；回退模型用于接口波动、主模型限流和高峰期兜底。",
  strategy:
    "默认采用制度检索优先、系统查询校验、结果生成后再做输出审查的推理路径；遇到高风险动作时先输出风险提示，再等待用户确认或升级人工处理。",
};

export const cloudClawCapabilities: CapabilityBinding[] = [
  {
    id: "capability-policy-qa",
    name: "制度问答编排",
    type: "技能",
    source: "平台预置",
    version: "v2.8.1",
    entry: "制度检索 + 口径归并",
    description: "统一检索差旅制度、FAQ 和例外口径，输出可引用的官方答复。",
    enabled: true,
  },
  {
    id: "capability-budget-check",
    name: "预算校验",
    type: "技能",
    source: "平台预置",
    version: "v1.9.4",
    entry: "预算系统接口校验",
    description: "对差旅申请金额、中心编码和预算余量进行实时核验。",
    enabled: true,
  },
  {
    id: "capability-risk-review",
    name: "风险复核",
    type: "技能",
    source: "自定义",
    version: "v1.3.2",
    entry: "高风险规则判断",
    description: "命中超预算、跨境或紧急出差时自动补充风险标签并升级人工复核。",
    enabled: true,
  },
  {
    id: "capability-trip-workflow",
    name: "差旅申请工作流",
    type: "工作流",
    source: "平台预置",
    version: "2026.03",
    entry: "申请创建 -> 预算校验 -> 审批协同",
    description: "用于发起差旅申请、补齐附件并驱动审批流流转。",
    enabled: true,
  },
  {
    id: "capability-notice-workflow",
    name: "催办与回执工作流",
    type: "工作流",
    source: "插件扩展",
    version: "2026.02",
    entry: "IM 催办 + 结果回执",
    description: "当审批超时或系统返回异常时，统一发送提醒并记录处理结果。",
    enabled: false,
  },
];

export const cloudClawSubAgents: CloudSubAgent[] = [
  {
    id: "subagent-policy",
    name: "制度解释 Agent",
    responsibility: "负责制度检索、口径归并和可引用答复生成。",
    dispatchMode: "按意图路由触发",
    model: "Qwen3-32B",
    enabled: true,
  },
  {
    id: "subagent-approval",
    name: "审批协同 Agent",
    responsibility: "负责审批节点追踪、催办和流程状态回执。",
    dispatchMode: "按流程节点触发",
    model: "Qwen3-8B",
    enabled: true,
  },
  {
    id: "subagent-risk",
    name: "风险校验 Agent",
    responsibility: "负责高风险申请识别、例外处理和人工升级建议。",
    dispatchMode: "按风险规则触发",
    model: "DeepSeek-R1",
    enabled: true,
  },
];

export const cloudClawIntegrations: IntegrationBinding[] = [
  {
    id: "integration-policy-mcp",
    name: "制度知识库",
    type: "MCP 服务",
    target: "差旅制度中心",
    relation: "制度问答、口径引用",
    status: "在线",
    description: "用于检索制度正文、FAQ 和适用范围。",
  },
  {
    id: "integration-budget-api",
    name: "预算校验接口",
    type: "企业接口",
    target: "预算中台",
    relation: "预算占用、余额核查",
    status: "在线",
    description: "用于申请创建前的预算校验和中心编码校验。",
  },
  {
    id: "integration-approval-system",
    name: "审批中心",
    type: "企业系统",
    target: "统一审批平台",
    relation: "申请状态、催办、回执",
    status: "在线",
    description: "用于审批状态查询、待办追踪与催办回执。",
  },
  {
    id: "integration-ocr-plugin",
    name: "票据识别",
    type: "插件能力",
    target: "票据解析插件",
    relation: "附件补全、字段抽取",
    status: "在线",
    description: "识别机票、酒店与发票信息，辅助材料校验。",
  },
  {
    id: "integration-notice-workflow",
    name: "通知回执流",
    type: "工作流",
    target: "企业消息编排",
    relation: "审批提醒、状态回执",
    status: "告警",
    description: "用于企业 IM 消息提醒与处理结果反馈。",
  },
  {
    id: "integration-erp-system",
    name: "财务 ERP",
    type: "企业系统",
    target: "ERP 费用模块",
    relation: "报销口径核验",
    status: "在线",
    description: "用于报销阶段口径核验和字段映射。",
  },
  {
    id: "integration-hotel-api",
    name: "协议酒店接口",
    type: "企业接口",
    target: "差旅供应商网关",
    relation: "酒店推荐、协议价查询",
    status: "未启用",
    description: "计划用于协议酒店比价与合规推荐。",
  },
];

export const cloudClawChannels: ChannelRelease[] = [
  {
    id: "channel-web",
    channel: "Web 门户",
    status: "已发布",
    version: "v3.12.0",
    publishedAt: "2026-03-14 09:30",
    entry: "/portal/travel-claw",
    owner: "应用门户组",
  },
  {
    id: "channel-im",
    channel: "企业 IM",
    status: "已发布",
    version: "v3.12.0",
    publishedAt: "2026-03-14 09:45",
    entry: "企微 / 差旅助手",
    owner: "消息平台组",
  },
  {
    id: "channel-workbench",
    channel: "工作台",
    status: "已发布",
    version: "v3.12.0",
    publishedAt: "2026-03-14 10:10",
    entry: "员工工作台 / 审批服务",
    owner: "工作台产品组",
  },
  {
    id: "channel-embed",
    channel: "业务系统嵌入",
    status: "草稿",
    version: "v3.13.0-draft",
    publishedAt: "待发布",
    entry: "费控系统 / 申请详情侧边栏",
    owner: "费控产品组",
  },
];

export const cloudClawPermissionScope: PermissionScope = {
  departments: ["销售中心", "研发中心", "行政服务部", "财务共享中心"],
  roles: ["普通员工", "部门审批人", "财务复核", "系统管理员"],
  userGroups: ["总部员工", "外地分支机构", "项目制团队"],
  adminVisibleOnly: false,
  visibilityNote:
    "默认面向已开通差旅服务的业务部门开放，系统管理员可查看全量治理配置，业务管理员仅能查看本部门服务数据。",
  usageNote:
    "员工可发起咨询和申请，审批人可查看本链路申请摘要，财务复核可查看费用与凭证口径，任何角色都不可跨部门读取明细。",
};

export const cloudClawSessionMemory: SessionMemoryConfig = {
  retentionPolicy: "默认保留 30 天会话摘要，审计摘要保留 180 天，高风险事件记录按制度要求长期归档。",
  longTermMemoryEnabled: true,
  isolationStrategy:
    "以租户、部门、用户标识和会话编号组成隔离键，长期记忆仅沉淀制度索引、异常模式和可复用编排经验。",
  sessionSummaryStrategy:
    "在每轮服务结束后生成结构化摘要，提取用户问题、工具调用、风险标签和待办事项，不保存非必要附件全文。",
  variables: [
    {
      id: "memory-variable-user",
      name: "员工编号",
      scope: "用户变量",
      description: "用于识别当前用户、控制权限范围和个性化入口。",
      example: "U-20491",
    },
    {
      id: "memory-variable-session",
      name: "会话工单号",
      scope: "会话变量",
      description: "用于串联一次问题处理过程中的查询、催办与回执记录。",
      example: "TC-20260316-1182",
    },
    {
      id: "memory-variable-application",
      name: "当前申请单号",
      scope: "会话变量",
      description: "用于在申请场景下关联审批状态、附件和预算校验结果。",
      example: "TRIP-202603-5821",
    },
    {
      id: "memory-variable-channel",
      name: "渠道来源",
      scope: "系统变量",
      description: "用于区分 Web、企业 IM、工作台等渠道来源并做路由控制。",
      example: "企业 IM",
    },
  ],
};

export const cloudClawSecurityGovernance: SecurityGovernanceConfig = {
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
      id: "security-rule-injection",
      name: "提示注入识别",
      stage: "输入阶段",
      action: "阻断并提示改写问题",
      level: "高",
      enabled: true,
    },
    {
      id: "security-rule-budget",
      name: "超预算申请复核",
      stage: "行为阶段",
      action: "创建人工复核工单",
      level: "高",
      enabled: true,
    },
    {
      id: "security-rule-pii",
      name: "个人信息脱敏",
      stage: "输出阶段",
      action: "自动脱敏后输出",
      level: "中",
      enabled: true,
    },
    {
      id: "security-rule-mass-call",
      name: "批量调用节流",
      stage: "行为阶段",
      action: "限制频率并记录风险标签",
      level: "中",
      enabled: true,
    },
  ],
};

export const cloudClawScheduledTasks: ScheduledTaskBinding[] = [
  {
    id: "task-policy-sync",
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
    id: "task-budget-refresh",
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
    id: "task-audit-report",
    name: "审计摘要汇总",
    trigger: "每天 23:00",
    bindType: "子Agent",
    bindName: "风险校验 Agent",
    runtime: "隔离执行",
    lastRun: "2026-03-15 23:00 成功",
    status: "待执行",
    enabled: true,
  },
];
