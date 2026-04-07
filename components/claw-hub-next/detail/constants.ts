import type { ComponentType } from "react";
import {
  Bot,
  Clock3,
  FileStack,
  FileText,
  FolderOpen,
  Gauge,
  MessageSquareText,
  RadioTower,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import type {
  CapabilityScope,
  ClawCoreFileKey,
  ExecutionResourceTier,
  KnowledgeScope,
  ResourceConfig,
  RuntimeResourceTier,
} from "@/lib/mock/claw-hub-next";
import type { ToolConfigKind } from "@/components/claw-hub-next/tool-config-dialog";

export type DetailSectionKey =
  | "chat"
  | "status"
  | "core"
  | "capability"
  | "channels"
  | "tasks"
  | "workspace"
  | "logs"
  | "security"
  | "relations"
  | "resource"
  | "settings";

export type CapabilityPanelKey = "tools" | "skills" | "agents" | "knowledge";
export type LogPanelKey = "conversation" | "task" | "security";

export const DETAIL_SECTION_ITEMS: Array<{
  value: DetailSectionKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: "chat", label: "对话", icon: MessageSquareText },
  { value: "status", label: "状态", icon: Bot },
  { value: "core", label: "核心文件", icon: FileText },
  { value: "capability", label: "能力配置", icon: Sparkles },
  { value: "channels", label: "渠道与分发", icon: RadioTower },
  { value: "tasks", label: "任务", icon: Clock3 },
  { value: "workspace", label: "工作空间", icon: FolderOpen },
  { value: "logs", label: "日志与审计", icon: FileStack },
  { value: "security", label: "安全管理", icon: ShieldCheck },
  { value: "relations", label: "关系", icon: UserRound },
  { value: "resource", label: "资源配置", icon: Server },
  { value: "settings", label: "设置", icon: Settings2 },
];

export const LOG_PANEL_ITEMS: Array<{
  key: LogPanelKey;
  label: string;
  description: string;
}> = [
  {
    key: "conversation",
    label: "会话运行",
    description: "从业务视角查看每次会话、每一轮输入输出，以及该轮触发的关键执行动作。",
  },
  {
    key: "task",
    label: "任务运行",
    description: "查看定时任务、催办任务和条件触发任务的每次运行详情与结果。",
  },
  {
    key: "security",
    label: "安全事件",
    description: "汇总会话与任务中的安全命中、脱敏、拦截与放行记录。",
  },
];

export const AUTONOMY_BOUNDARY_LEVELS = ["L1 自动执行", "L2 通知", "L3 审批", "禁止"] as const;
export const SECURITY_RULE_LEVELS = ["严格", "标准", "宽松"] as const;

export const CORE_FILE_ICONS: Record<ClawCoreFileKey, ComponentType<{ className?: string }>> = {
  identity: FileText,
  soul: Sparkles,
  memory: FileStack,
  heartbeat: Gauge,
};

export const CAPABILITY_SCOPE_LABELS: Record<CapabilityScope, string> = {
  platform: "平台预置",
  tenant: "租户配置",
  claw: "Claw配置",
};

export const KNOWLEDGE_SCOPE_LABELS: Record<KnowledgeScope, string> = {
  tenant: "租户配置",
  claw: "Claw配置",
};

export const TOOL_CONFIG_KIND_LABELS: Record<ToolConfigKind, string> = {
  workflow: "工作流",
  mcp: "MCP",
  plugin: "插件",
};

export const RUNTIME_TIER_OPTIONS: Array<{
  value: RuntimeResourceTier;
  title: string;
  summary: string;
}> = [
  { value: "light", title: "轻量型", summary: "2 vCPU / 4 GB 内存" },
  { value: "standard", title: "标准型", summary: "4 vCPU / 8 GB 内存" },
  { value: "enhanced", title: "增强型", summary: "8 vCPU / 16 GB 内存" },
];

export const EXECUTION_TIER_OPTIONS: Array<{
  value: ExecutionResourceTier;
  title: string;
  summary: string;
}> = [
  { value: "basic", title: "基础型", summary: "2 vCPU / 4 GB / 5 GB 工作目录" },
  { value: "standard", title: "标准型", summary: "4 vCPU / 8 GB / 10 GB 工作目录" },
  { value: "enhanced", title: "增强型", summary: "8 vCPU / 16 GB / 20 GB 工作目录" },
];

export const EXECUTION_CAPABILITY_OPTIONS = [
  { key: "browser", label: "浏览器操作", note: "适合页面巡检和流程自动化。" },
  { key: "python", label: "Python 代码执行", note: "适合数据处理和脚本分析。" },
  { key: "shell", label: "Shell 命令执行", note: "高风险", tone: "risk" as const },
  { key: "file", label: "文件处理", note: "适合临时文件读写和结果整理。" },
  { key: "document", label: "文档解析", note: "适合提取结构化内容。" },
  { key: "network", label: "网络访问", note: "受策略约束", tone: "policy" as const },
] satisfies Array<{
  key: keyof ResourceConfig["execution"]["capabilities"];
  label: string;
  note: string;
  tone?: "risk" | "policy";
}>;
