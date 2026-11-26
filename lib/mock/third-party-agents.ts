import type { SecurityLevel } from "@/lib/security-level";

export type ThirdPartyAgentProtocol = "OpenAI API";
export type ThirdPartyAgentInterfaceSpec =
  | "Chat Completions"
  | "Responses"
  | "Dify Agent API"
  | "Coze Studio Agent API";
export type ThirdPartyAgentAuthMode =
  | "API Key"
  | "Bearer Token"
  | "HTTP Basic"
  | "OAuth 2.0"
  | "无认证";
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

export interface ThirdPartyAgentAuthConfig {
  tokenUrl?: string;
  scope?: string;
  apiKeyLocation?: "Header" | "Query";
  apiKeyParameter?: string;
  apiKeyHeader?: string;
  bearerFormat?: string;
  username?: string;
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
  authMode: ThirdPartyAgentAuthMode;
  authConfig?: ThirdPartyAgentAuthConfig;
  referenceCount: number;
  updatedAt: string;
  lastCheckedAt: string;
  usePermission: boolean;
  references: ThirdPartyAgentReference[];
  callRecords: ThirdPartyAgentCallRecord[];
}

export const THIRD_PARTY_AGENTS: ThirdPartyAgentRecord[] = [
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
    referenceCount: 2,
    updatedAt: "2026-10-26 15:10",
    lastCheckedAt: "2026-10-26 15:10",
    usePermission: true,
    references: [
      { id: "workflow-sales", name: "销售跟进工作流", type: "工作流智能体", securityLevel: "内部", owner: "示例用户 D", updatedAt: "2026-10-26 11:20" },
      { id: "multi-marketing", name: "营销协作组", type: "多智能体", securityLevel: "秘密", owner: "示例用户 D", updatedAt: "2026-10-25 17:08" },
    ],
    callRecords: [],
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
    referenceCount: 0,
    updatedAt: "2026-10-26 10:32",
    lastCheckedAt: "2026-10-26 10:30",
    usePermission: true,
    references: [],
    callRecords: [],
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
    referenceCount: 0,
    updatedAt: "2026-10-28 15:30",
    lastCheckedAt: "2026-10-28 15:28",
    usePermission: true,
    references: [],
    callRecords: [],
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
    endpoint: "https://coze.example.com/v3/chat",
    authMode: "Bearer Token",
    authConfig: { bearerFormat: "Access Token" },
    referenceCount: 0,
    updatedAt: "2026-10-28 16:20",
    lastCheckedAt: "2026-10-28 16:18",
    usePermission: true,
    references: [],
    callRecords: [],
  },
];

export function getThirdPartyAgent(id: string): ThirdPartyAgentRecord | undefined {
  return THIRD_PARTY_AGENTS.find((agent) => agent.id === id);
}
