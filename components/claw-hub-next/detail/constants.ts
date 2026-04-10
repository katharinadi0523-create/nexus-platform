import type { ComponentType } from "react";
import {
  Bot,
  Clock3,
  FileStack,
  FileText,
  FolderOpen,
  Gauge,
  RadioTower,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";
import type {
  AutonomyBoundaryItem,
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
  | "tools"
  | "skills"
  | "agents"
  | "knowledge"
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

export type SecurityPanelKey =
  | "autonomy-boundaries"
  | "tool-protection"
  | "file-protection"
  | "security-approval";

export const DETAIL_SECTION_ITEMS: Array<{
  value: DetailSectionKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: "core", label: "核心文件", icon: FileText },
  { value: "tools", label: "工具", icon: Wrench },
  { value: "skills", label: "技能", icon: Sparkles },
  { value: "agents", label: "多智能体", icon: Bot },
  { value: "knowledge", label: "知识库", icon: FileStack },
  { value: "channels", label: "渠道与分发", icon: RadioTower },
  { value: "tasks", label: "任务", icon: Clock3 },
  { value: "workspace", label: "工作空间", icon: FolderOpen },
  { value: "logs", label: "日志与审计", icon: FileStack },
  { value: "security", label: "安全防护", icon: ShieldCheck },
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
    label: "会话日志",
    description: "查看会话列表，以及每个会话中的消息与事件时间流。",
  },
  {
    key: "task",
    label: "任务运行",
    description: "查看定时任务、催办任务和条件触发任务的每次运行详情与结果。",
  },
  {
    key: "security",
    label: "安全审计",
    description: "汇总会话与任务中的安全命中、脱敏、拦截与放行记录。",
  },
];

export const SECURITY_PANEL_ITEMS: Array<{
  key: SecurityPanelKey;
  label: string;
  description: string;
}> = [
  {
    key: "autonomy-boundaries",
    label: "自主性动作边界配置",
    description: "配置数字员工执行各项操作时的自主性级别。",
  },
  {
    key: "tool-protection",
    label: "工具防护",
    description: "配置工具调用的安全扫描与限制规则。",
  },
  {
    key: "file-protection",
    label: "文件防护",
    description: "保护敏感路径，防止被工具访问。",
  },
  {
    key: "security-approval",
    label: "安全审批",
    description: "处理待审批的高风险动作并查看历史记录。",
  },
];

export const AUTONOMY_BOUNDARY_LEVELS = ["L1 直接执行", "L2 通知", "L3 审批", "禁止"] as const;

/** 全平台统一的自主性动作项（不随 Claw 变化）；级别由配置中的 id 匹配或默认值决定 */
export const AUTONOMY_BOUNDARY_DEFINITIONS: Array<Pick<AutonomyBoundaryItem, "id" | "name" | "description">> = [
  { id: "boundary-read-file", name: "读取文件", description: "读取工作区和知识库中的文件" },
  { id: "boundary-write-file", name: "写入文件", description: "创建或修改工作区中的文件" },
  { id: "boundary-delete-file", name: "删除文件", description: "删除工作区中的文件" },
  { id: "boundary-feishu", name: "发送飞书消息", description: "通过飞书给用户发送消息" },
  { id: "boundary-network-search", name: "网络搜索", description: "搜索互联网获取信息" },
  { id: "boundary-task-manage", name: "管理任务", description: "创建、更新或删除任务" },
];

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
