import type { SecurityLevel } from "@/lib/security-level";

export type ThirdPartyAgentProtocol = "A2A" | "OpenAI API";
export type ThirdPartyAgentInterfaceSpec = "A2A" | "Chat Completions" | "Responses" | "Dify Agent API" | "Coze Studio Agent API";
export type ThirdPartyAgentAuthMode = "API Key" | "Bearer Token" | "HTTP Basic" | "OAuth 2.0" | "无认证";
export type ThirdPartyAgentStatus = "已启用" | "已停用";
export type ThirdPartyConnectionStatus = "正常" | "异常" | "待校验";

export interface ThirdPartyAgentReference {
  id: string;
  name: string;
  type: "Claw" | "多智能体" | "工作流智能体";
  securityLevel: SecurityLevel;
  owner: string;
  updatedAt: string;
}

export interface ThirdPartyAgentCallRecord {
  id: string;
  executionId: string;
  calledAt: string;
  caller: string;
  callerType: string;
  calledAgent: string;
  protocol: ThirdPartyAgentInterfaceSpec;
  result: "成功" | "失败" | "处理中";
  duration: string;
  error?: string;
  externalTaskId?: string;
  taskStatus?: "处理中" | "已完成" | "失败";
  endedAt?: string;
}

export interface ThirdPartyAgentOperationRecord {
  id: string;
  operatedAt: string;
  operator: string;
  action: string;
  summary: string;
}

export interface ThirdPartyAgentAuthConfig {
  tokenUrl?: string;
  scope?: string;
  apiKeyLocation?: "Header" | "Query";
  apiKeyParameter?: string;
  apiKeyHeader?: string;
  bearerFormat?: string;
  username?: string;
}

export interface ThirdPartyAgentApiDefaults {
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  responseFormat?: "text" | "json";
  streaming?: "enabled" | "disabled";
  timeoutSeconds?: number;
}

export interface A2AAgentSkillDeclaration {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

export interface A2AAgentCardDeclaration {
  provider?: string;
  providerUrl?: string;
  serviceEndpoint: string;
  protocolBinding: "JSONRPC" | "GRPC" | "HTTP+JSON";
  protocolVersion: string;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    extendedAgentCard: boolean;
  };
  skills: A2AAgentSkillDeclaration[];
}

export interface ThirdPartyAgentRecord {
  id: string;
  name: string;
  description: string;
  protocol: ThirdPartyAgentProtocol;
  interfaceSpec: ThirdPartyAgentInterfaceSpec;
  modelIdentifier?: string;
  botId?: string;
  status: ThirdPartyAgentStatus;
  connectionStatus: ThirdPartyConnectionStatus;
  securityLevel: SecurityLevel;
  owner: string;
  endpoint: string;
  agentCardSource?: "URL" | "JSON";
  agentCardJson?: string;
  authMode: ThirdPartyAgentAuthMode;
  authConfig?: ThirdPartyAgentAuthConfig;
  apiDefaults?: ThirdPartyAgentApiDefaults;
  a2aDeclaration?: A2AAgentCardDeclaration;
  declaredVersion?: string;
  skills: string[];
  referenceCount: number;
  updatedAt: string;
  lastCheckedAt: string;
  usePermission: boolean;
  references: ThirdPartyAgentReference[];
  callRecords: ThirdPartyAgentCallRecord[];
  operationRecords: ThirdPartyAgentOperationRecord[];
}

export const THIRD_PARTY_AGENTS: ThirdPartyAgentRecord[] = [
  {
    id: "risk-audit-a2a",
    name: "风控审查 Agent",
    description: "对客户材料进行风险识别、条款核验并返回结构化审查结论。",
    protocol: "A2A",
    interfaceSpec: "A2A",
    status: "已启用",
    connectionStatus: "正常",
    securityLevel: "秘密",
    owner: "示例用户 A",
    endpoint: "https://agent.partner.example.com/.well-known/agent-card.json",
    agentCardSource: "URL",
    authMode: "OAuth 2.0",
    authConfig: { tokenUrl: "https://agent.partner.example.com/oauth/token", scope: "agent.invoke" },
    a2aDeclaration: {
      provider: "示例科技有限公司",
      providerUrl: "https://partner.example.com",
      serviceEndpoint: "https://agent.partner.example.com/a2a",
      protocolBinding: "JSONRPC",
      protocolVersion: "1.0",
      defaultInputModes: ["text/plain", "application/json"],
      defaultOutputModes: ["application/json"],
      capabilities: { streaming: true, pushNotifications: false, extendedAgentCard: true },
      skills: [
        { id: "contract-risk-review", name: "合同风险识别", description: "识别合同中的责任、履约与争议风险。", tags: ["合同", "风险识别"] },
        { id: "compliance-clause-check", name: "合规条款核验", description: "根据合规规则核验条款并返回问题项。", tags: ["合规", "条款核验"] },
        { id: "risk-report", name: "风险报告生成", description: "汇总审查结果并生成结构化风险报告。", tags: ["报告", "结构化输出"] },
      ],
    },
    declaredVersion: "2.4.1",
    skills: ["合同风险识别", "合规条款核验", "风险报告生成"],
    referenceCount: 3,
    updatedAt: "2026-10-26 18:42",
    lastCheckedAt: "2026-10-26 18:35",
    usePermission: true,
    references: [
      { id: "claw-research", name: "科研分析 Claw", type: "Claw", securityLevel: "秘密", owner: "示例用户 B", updatedAt: "2026-10-26 16:20" },
      { id: "multi-risk", name: "客户风险研判组", type: "多智能体", securityLevel: "秘密", owner: "示例用户 A", updatedAt: "2026-10-25 14:08" },
      { id: "workflow-contract", name: "合同审查工作流", type: "工作流智能体", securityLevel: "机密", owner: "示例用户 C", updatedAt: "2026-10-24 09:37" },
    ],
    callRecords: [
      { id: "call-001", executionId: "exec-20261026-0418", calledAt: "2026-10-26 18:18:32", caller: "合同审查工作流", callerType: "工作流智能体", calledAgent: "风控审查 Agent", protocol: "A2A", result: "成功", duration: "1.42s", endedAt: "2026-10-26 18:18:34" },
      { id: "call-002", executionId: "exec-20261026-0396", calledAt: "2026-10-26 17:56:09", caller: "客户风险研判组", callerType: "多智能体", calledAgent: "风控审查 Agent", protocol: "A2A", result: "处理中", duration: "—", externalTaskId: "task-partner-7391", taskStatus: "处理中" },
      { id: "call-003", executionId: "exec-20261026-0312", calledAt: "2026-10-26 16:41:27", caller: "科研分析 Claw", callerType: "Claw", calledAgent: "风控审查 Agent", protocol: "A2A", result: "失败", duration: "5.00s", error: "上游服务响应超时", endedAt: "2026-10-26 16:41:32" },
    ],
    operationRecords: [
      { id: "op-001", operatedAt: "2026-10-26 18:35", operator: "示例用户 A", action: "测试连接", summary: "服务连通、认证有效，AgentCard 解析成功" },
      { id: "op-002", operatedAt: "2026-10-25 13:12", operator: "示例用户 A", action: "更新 AgentCard", summary: "声明版本由 2.4.0 更新为 2.4.1，新增“合规条款核验”技能" },
      { id: "op-003", operatedAt: "2026-10-20 10:26", operator: "示例用户 A", action: "创建资产", summary: "通过 AgentCard URL 接入，初始状态为已启用" },
    ],
  },
  {
    id: "customer-insight-api",
    name: "客户洞察助手",
    description: "根据客户画像与历史交互生成洞察摘要和跟进建议。",
    protocol: "OpenAI API",
    interfaceSpec: "Responses",
    modelIdentifier: "customer-insight-v2",
    status: "已启用",
    connectionStatus: "正常",
    securityLevel: "内部",
    owner: "示例用户 D",
    endpoint: "https://api.partner.example.com/v1/responses",
    authMode: "Bearer Token",
    authConfig: { bearerFormat: "API Token" },
    apiDefaults: {
      temperature: 0.3,
      topP: 0.9,
      maxOutputTokens: 2048,
      responseFormat: "text",
      timeoutSeconds: 60,
    },
    skills: ["客户画像分析", "跟进建议"],
    referenceCount: 2,
    updatedAt: "2026-10-26 15:10",
    lastCheckedAt: "2026-10-26 15:10",
    usePermission: true,
    references: [
      { id: "workflow-sales", name: "销售跟进工作流", type: "工作流智能体", securityLevel: "内部", owner: "示例用户 D", updatedAt: "2026-10-26 11:20" },
      { id: "multi-marketing", name: "营销协作组", type: "多智能体", securityLevel: "秘密", owner: "示例用户 D", updatedAt: "2026-10-25 17:08" },
    ],
    callRecords: [],
    operationRecords: [],
  },
  {
    id: "legacy-knowledge-a2a",
    name: "旧版知识检索 Agent",
    description: "为历史业务系统提供知识检索能力，等待外部服务升级。",
    protocol: "A2A",
    interfaceSpec: "A2A",
    status: "已停用",
    connectionStatus: "正常",
    securityLevel: "内部",
    owner: "示例用户 E",
    endpoint: "https://legacy.example.com/agent-card.json",
    agentCardSource: "URL",
    authMode: "API Key",
    authConfig: { apiKeyLocation: "Header", apiKeyParameter: "x-agent-key", apiKeyHeader: "x-agent-key" },
    a2aDeclaration: {
      provider: "示例知识服务团队",
      providerUrl: "https://legacy.example.com",
      serviceEndpoint: "https://legacy.example.com/a2a",
      protocolBinding: "JSONRPC",
      protocolVersion: "0.3",
      defaultInputModes: ["text/plain"],
      defaultOutputModes: ["text/plain", "application/json"],
      capabilities: { streaming: false, pushNotifications: false, extendedAgentCard: false },
      skills: [
        { id: "knowledge-search", name: "知识检索", description: "检索历史业务知识并返回匹配内容。", tags: ["检索", "知识库"] },
      ],
    },
    declaredVersion: "1.7.0",
    skills: ["知识检索"],
    referenceCount: 1,
    updatedAt: "2026-10-23 09:40",
    lastCheckedAt: "2026-10-23 09:35",
    usePermission: true,
    references: [
      { id: "claw-archive", name: "档案检索 Claw", type: "Claw", securityLevel: "内部", owner: "示例用户 E", updatedAt: "2026-10-22 18:10" },
    ],
    callRecords: [],
    operationRecords: [],
  },
  {
    id: "finance-report-api",
    name: "财务报告分析 Agent",
    description: "分析经营数据并生成管理层财务摘要。",
    protocol: "OpenAI API",
    interfaceSpec: "Chat Completions",
    modelIdentifier: "finance-report-v1",
    status: "已启用",
    connectionStatus: "异常",
    securityLevel: "机密",
    owner: "示例用户 C",
    endpoint: "https://finance.example.com/v1/chat/completions",
    authMode: "API Key",
    authConfig: { apiKeyLocation: "Header", apiKeyParameter: "api-key", apiKeyHeader: "api-key" },
    apiDefaults: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      responseFormat: "json",
      streaming: "disabled",
      timeoutSeconds: 90,
    },
    skills: ["财务分析", "管理摘要"],
    referenceCount: 0,
    updatedAt: "2026-10-26 10:32",
    lastCheckedAt: "2026-10-26 10:30",
    usePermission: true,
    references: [],
    callRecords: [],
    operationRecords: [],
  },
  {
    id: "service-support-dify",
    name: "服务支持 Agent",
    description: "通过 Dify Agent 应用回答服务政策问题并生成处理建议。",
    protocol: "OpenAI API",
    interfaceSpec: "Dify Agent API",
    status: "已启用",
    connectionStatus: "正常",
    securityLevel: "内部",
    owner: "示例用户 F",
    endpoint: "https://dify.example.com/v1",
    authMode: "API Key",
    authConfig: { apiKeyLocation: "Header", apiKeyParameter: "Authorization" },
    skills: ["服务问答", "处理建议"],
    referenceCount: 0,
    updatedAt: "2026-10-28 15:30",
    lastCheckedAt: "2026-10-28 15:28",
    usePermission: true,
    references: [],
    callRecords: [],
    operationRecords: [],
  },
  {
    id: "campaign-coze-studio",
    name: "营销活动策划 Agent",
    description: "通过 Coze Studio Bot 生成营销活动方案与渠道执行建议。",
    protocol: "OpenAI API",
    interfaceSpec: "Coze Studio Agent API",
    botId: "bot_7391842056",
    status: "已启用",
    connectionStatus: "正常",
    securityLevel: "内部",
    owner: "示例用户 G",
    endpoint: "https://coze.example.com",
    authMode: "Bearer Token",
    authConfig: { bearerFormat: "Access Token" },
    skills: ["活动策划", "渠道建议"],
    referenceCount: 0,
    updatedAt: "2026-10-28 16:20",
    lastCheckedAt: "2026-10-28 16:18",
    usePermission: true,
    references: [],
    callRecords: [],
    operationRecords: [],
  },
  {
    id: "strategy-a2a",
    name: "集团战略推演 Agent",
    description: "面向集团战略材料进行多情景推演与敏感因素分析。",
    protocol: "A2A",
    interfaceSpec: "A2A",
    status: "已启用",
    connectionStatus: "正常",
    securityLevel: "绝密",
    owner: "示例部门",
    endpoint: "https://strategy.example.com/.well-known/agent-card.json",
    agentCardSource: "URL",
    authMode: "OAuth 2.0",
    authConfig: { tokenUrl: "https://identity.example.com/oauth2/token", scope: "strategy.invoke" },
    a2aDeclaration: {
      provider: "示例战略研究中心",
      providerUrl: "https://strategy.example.com",
      serviceEndpoint: "https://strategy.example.com/a2a/v1",
      protocolBinding: "HTTP+JSON",
      protocolVersion: "1.0",
      defaultInputModes: ["text/plain", "application/json"],
      defaultOutputModes: ["application/json"],
      capabilities: { streaming: true, pushNotifications: true, extendedAgentCard: true },
      skills: [
        { id: "scenario-simulation", name: "战略推演", description: "基于输入假设生成多情景推演结果。", tags: ["战略", "情景推演"] },
        { id: "sensitivity-analysis", name: "敏感因素分析", description: "识别并分析影响结论的关键敏感因素。", tags: ["敏感性", "因素分析"] },
      ],
    },
    declaredVersion: "3.0.0",
    skills: ["战略推演", "敏感因素分析"],
    referenceCount: 1,
    updatedAt: "2026-10-25 20:16",
    lastCheckedAt: "2026-10-25 20:10",
    usePermission: false,
    references: [],
    callRecords: [],
    operationRecords: [],
  },
];

export function getThirdPartyAgent(id: string): ThirdPartyAgentRecord | undefined {
  return THIRD_PARTY_AGENTS.find((agent) => agent.id === id);
}
