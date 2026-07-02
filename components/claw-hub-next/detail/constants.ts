import type { ComponentType } from "react";
import {
  CalendarClock,
  Cpu,
  FileStack,
  FileText,
  FolderOpen,
  RadioTower,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";
import type {
  AutonomyBoundaryItem,
  CapabilityScope,
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
  | "model"
  | "tools"
  | "skills"
  | "knowledge"
  | "channels"
  | "automated-tasks"
  | "workspace"
  | "logs"
  | "security"
  | "relations";

export type CapabilityPanelKey = "tools" | "skills";

/** 插件 / 技能子 Tab：内置层 + Claw 专属配置 */
export type ToolSkillViewScope = "preset" | "claw";

/** 技能 Tab：平台预置 + 租户侧合并展示 */
export const SKILL_VIEW_SCOPE_LABELS: Record<ToolSkillViewScope, string> = {
  preset: "内置技能",
  claw: "Claw配置",
};

/** 插件 Tab：平台预置 + 租户侧合并展示 */
export const PLUGIN_VIEW_SCOPE_LABELS: Record<ToolSkillViewScope, string> = {
  preset: "内置插件",
  claw: "Claw配置",
};

export type LogPanelKey = "conversation" | "security";

/** 知识一级菜单下的四个子面板 */
export type KnowledgePanelKey = "knowledge-base" | "database" | "ontology" | "term-bank";

export const KNOWLEDGE_PANEL_ITEMS: Array<{
  key: KnowledgePanelKey;
  label: string;
  description: string;
}> = [
  {
    key: "knowledge-base",
    label: "知识库",
    description: "挂载文档与切片，供对话与任务检索、引用与溯源。",
  },
  {
    key: "database",
    label: "数据库",
    description: "绑定业务库或图库连接，为查询、统计与图谱能力提供数据源。",
  },
  {
    key: "ontology",
    label: "本体对象",
    description: "维护场景本体与对象定义，支撑关联、推理与一致性约束。",
  },
  {
    key: "term-bank",
    label: "术语库",
    description: "沉淀标准术语与别名映射，保证输出与检索口径统一。",
  },
];

export type SecurityPanelKey =
  | "autonomy-boundaries"
  | "tool-protection"
  | "security-approval";

export const DETAIL_SECTION_ITEMS: Array<{
  value: DetailSectionKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: "core", label: "Agent.md", icon: FileText },
  { value: "model", label: "模型配置", icon: Cpu },
  { value: "skills", label: "技能", icon: Sparkles },
  { value: "tools", label: "插件", icon: Wrench },
  { value: "knowledge", label: "知识", icon: FileStack },
  { value: "channels", label: "渠道", icon: RadioTower },
  { value: "automated-tasks", label: "自动化任务", icon: CalendarClock },
  { value: "workspace", label: "工作空间", icon: FolderOpen },
  { value: "logs", label: "日志与审计", icon: FileStack },
  { value: "security", label: "安全防护", icon: ShieldCheck },
  { value: "relations", label: "关系", icon: UserRound },
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
    key: "security-approval",
    label: "安全审批",
    description: "处理待审批的高风险动作。",
  },
];

export const AUTONOMY_BOUNDARY_LEVELS = ["L1：直接放行", "L2：需用户审批", "L3：禁止"] as const;

/** 全平台统一的自主性动作项（不随 Claw 变化）；级别由配置中的 id 匹配或默认值决定 */
export const AUTONOMY_BOUNDARY_DEFINITIONS: Array<Pick<AutonomyBoundaryItem, "id" | "name" | "description">> = [
  { id: "boundary-read-file", name: "读取文件", description: "读取工作区和知识库中的文件" },
  { id: "boundary-write-file", name: "写入文件", description: "创建或修改工作区中的文件" },
  { id: "boundary-delete-file", name: "删除文件", description: "删除工作区中的文件" },
  {
    id: "boundary-task-manage",
    name: "管理自动化任务",
    description: "创建、更新、启停或删除自动化任务",
  },
];

export const CAPABILITY_SCOPE_LABELS: Record<CapabilityScope, string> = {
  platform: "平台预置",
  tenant: "公共配置",
  claw: "Claw配置",
};

export const KNOWLEDGE_SCOPE_LABELS: Record<KnowledgeScope, string> = {
  tenant: "公共配置",
  claw: "Claw配置",
};

export const TOOL_CONFIG_KIND_LABELS: Record<ToolConfigKind, string> = {
  workflow: "工作流",
  mcp: "MCP",
  plugin: "OpenAPI",
  ontology_action: "本体动作",
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
