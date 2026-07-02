export type PublishValidationItemStatus = "pending" | "running" | "passed" | "failed";

export type PublishValidationPhaseKey = "integrity" | "security";

export interface PublishValidationItem {
  id: string;
  label: string;
  description: string;
}

export interface PublishValidationPhase {
  key: PublishValidationPhaseKey;
  title: string;
  subtitle: string;
  items: PublishValidationItem[];
}

export const INTEGRITY_VALIDATION_ITEMS: PublishValidationItem[] = [
  {
    id: "tools",
    label: "插件",
    description: "校验 OpenAPI / 工作流 / 本体动作等插件清单与版本摘要",
  },
  {
    id: "skills",
    label: "技能",
    description: "校验 SKILL.md 包体哈希与技能依赖引用完整性",
  },
  {
    id: "mcp",
    label: "MCP",
    description: "校验 MCP Server 端点、工具清单与传输层签名",
  },
  {
    id: "knowledge",
    label: "知识库",
    description: "校验知识库挂载清单、切片索引与来源元数据",
  },
  {
    id: "agent-config",
    label: "Agent 配置",
    description: "校验 Agent.md、模型参数与运行时资源配置摘要",
  },
];

export const SECURITY_VALIDATION_ITEMS: PublishValidationItem[] = [
  {
    id: "high-risk-tools",
    label: "高危工具",
    description: "扫描 Shell / 网络访问等高危插件与禁用清单冲突",
  },
  {
    id: "permission-scope",
    label: "权限范围",
    description: "核对自主性边界级别与工具调用审批策略",
  },
  {
    id: "knowledge-classification",
    label: "知识密级",
    description: "检查知识库来源、密级标注与跨域引用合规性",
  },
  {
    id: "memory-policy",
    label: "记忆策略",
    description: "确认会话记忆开关、保留周期与脱敏规则",
  },
  {
    id: "audit-switch",
    label: "审计开关",
    description: "确认会话审计、安全事件与工具防护规则已启用",
  },
];

export const PUBLISH_VALIDATION_PHASES: PublishValidationPhase[] = [
  {
    key: "integrity",
    title: "资源完整性校验",
    subtitle: "对工具、Skills、MCP、知识库、Agent 配置等资源做签名与完整性校验，确认资源未被篡改。",
    items: INTEGRITY_VALIDATION_ITEMS,
  },
  {
    key: "security",
    title: "资源与配置安全性检查",
    subtitle: "检查高危工具、权限范围、知识库来源和密级、记忆策略、审计开关等安全配置。",
    items: SECURITY_VALIDATION_ITEMS,
  },
];
