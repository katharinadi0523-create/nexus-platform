"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  ArrowLeft,
  Bot,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Cpu,
  Eye,
  EyeOff,
  FileStack,
  FileText,
  FolderOpen,
  GripVertical,
  Loader2,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RadioTower,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ClawCapabilitySection } from "@/components/claw-hub-next/detail/capability-section";
import { ClawPublishValidationDialog } from "@/components/claw-hub-next/claw-publish-validation-dialog";
import { AgentBomBadge } from "@/components/claw-hub-next/agent-bom-badge";
import { buildAgentBomTreeFromDetail } from "@/components/claw-hub-next/agent-bom-tree";
import { ClawKnowledgeAssetsSection } from "@/components/claw-hub-next/detail/claw-knowledge-assets-section";
import { ClawAgentResourceSection } from "@/components/claw-hub-next/detail/agent-resource-section";
import { ClawCoreConfigSection } from "@/components/claw-hub-next/detail/core-config-section";
import { ClawInteractiveChatPanel } from "@/components/claw-hub-next/interactive-chat-panel";
import { ResearchMultiAgentDebugPanel } from "@/components/claw-hub-next/research-multi-agent-debug-panel";
import { ClawWorkspaceSection } from "@/components/claw-hub-next/detail/workspace-section";
import { WorkbenchEntityProvider } from "@/components/claw-hub-next/workbench-entity-context";
import {
  MultiAgentMainAgentConfig,
} from "@/components/agent/multi-agent-main-agent-config";
import {
  MULTI_AGENT_ROOT_NODE_ID,
  MultiAgentOrchestrationPanel,
} from "@/components/agent/multi-agent-orchestration-panel";
import { MultiAgentSubAgentConfig } from "@/components/agent/multi-agent-sub-agent-config";
import {
  type DetailSectionKey,
  type KnowledgePanelKey,
  type LogPanelKey,
  type ToolSkillViewScope,
} from "@/components/claw-hub-next/detail/constants";
import { ClawSecuritySection } from "@/components/claw-hub-next/detail/security-section";
import { SectionCard } from "@/components/claw-hub-next/detail/section-card";
import {
  addToolProtectionRule,
  deleteScopedCollectionItem,
  normalizeAutonomyBoundaries,
  mergeClawKnowledgeSelections,
  mergeClawSkillSelections,
  mergeClawToolSelections,
  resolveSecurityApproval,
  setAllSkillsEnabled,
  setAllToolsEnabled,
  toggleScopedEnabledCollection,
  updateAutonomyBoundaryLevel,
  updateToolProtectionEnabled,
  updateToolProtectionRuleEnabled,
} from "@/components/claw-hub-next/detail/state";
import { KnowledgeConfigDialog, type KnowledgeConfigSelection } from "@/components/claw-hub-next/knowledge-config-dialog";
import {
  CreateAutomatedTaskDialog,
  type AutomatedTaskExecutionMode,
} from "@/components/claw-hub-next/create-automated-task-dialog";
import { SkillConfigDialog, type SkillConfigSelection } from "@/components/claw-hub-next/skill-config-dialog";
import { ToolConfigDialog, type ToolConfigSelection } from "@/components/claw-hub-next/tool-config-dialog";
import {
  buildConversationSessionSummaries,
  formatDurationMs,
  type ConversationSessionSummary,
  getAuditStatusClassName,
  getAuditTypeClassName,
  getSecurityActionClassName,
  getSecurityLevelClassName,
} from "@/components/claw-hub-next/detail/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AGENT_RELATION_SELECT_OPTIONS,
  AUTOMATED_TASK_DELIVERY_CHANNELS,
  type AutomatedTaskDeliveryChannel,
  type AgentRelationItem,
  type AgentRelationKind,
  type CapabilityScope,
  type ClawAutomatedTaskExecutionItem,
  type ClawAutomatedTaskExecutionStatus,
  type ClawAutomatedTaskItem,
  type ClawAutomatedTaskRecentResult,
  type ClawDetailData,
  type ClawCapabilityConfig,
  type ConversationAuditItem,
  type ConversationUsageChannel,
  type KnowledgeScope,
  type SecurityManagementConfig,
  type ToolProtectionRuleItem,
  buildKnowledgeAssetsFromLegacy,
} from "@/lib/mock/claw-hub-next";
import { ModelSelector, type ModelParams } from "@/components/agent-editor/ModelSelector";
import { PRESET_MODEL_IDS, getDefaultModelParams, type ModelParamKey } from "@/lib/model-schemas";
import {
  formatMultiAgentUpdatedAt,
  upsertPublishedMultiAgent,
} from "@/lib/published-multi-agents";
import { cn } from "@/lib/utils";

const CLAW_MODEL_SELECTOR_HIDDEN_KEYS: readonly ModelParamKey[] = ["context_turns", "current_time"];
const DEBUG_SPLIT_MIN_CONFIG_WIDTH = 520;
const DEBUG_SPLIT_MIN_DEBUG_WIDTH = 560;
const DEBUG_SPLIT_DEFAULT_DEBUG_WIDTH = 760;
const DEBUG_SPLIT_HANDLE_WIDTH = 8;
const DEBUG_SPLIT_COLLAPSE_WIDTH =
  DEBUG_SPLIT_MIN_CONFIG_WIDTH + DEBUG_SPLIT_MIN_DEBUG_WIDTH + DEBUG_SPLIT_HANDLE_WIDTH;
const DEBUG_INSPECTOR_AUTO_MIN_WIDTH = 900;
const DEBUG_INSPECTOR_FORCE_MIN_WIDTH = 760;

type AutomatedTaskPanelKey = "task-list" | "execution-history";
type AutomatedTaskExecutionScope = "all" | "specified";
type AutomatedTaskExecutionStatusFilter = "all" | ClawAutomatedTaskExecutionStatus;
type AutomatedTaskExecutionChannelFilter = "all" | AutomatedTaskDeliveryChannel;
type ClawPlazaStatus = "未上架" | "已上架";
type ClawReleaseMode = "组织发布" | "公开发布";

const CLAW_RELEASE_MODE_OPTIONS: ClawReleaseMode[] = ["组织发布", "公开发布"];
const CLAW_AGENT_TYPE_OPTIONS = [
  "产品设计",
  "软件开发",
  "项目管理",
  "市场营销",
  "销售",
  "质量测试",
  "战略分析",
  "科研实验",
  "媒体",
] as const;

const CLAW_DETAIL_NAV_GROUPS: Array<{
  title: string;
  items: Array<{
    value: DetailSectionKey;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }>;
}> = [
  {
    title: "配置",
    items: [
      { value: "core", label: "Claw配置", icon: Cpu },
    ],
  },
  {
    title: "资源",
    items: [
      { value: "skills", label: "技能", icon: Sparkles },
      { value: "tools", label: "插件", icon: Wrench },
      { value: "knowledge", label: "知识", icon: FileStack },
      { value: "agents", label: "智能体", icon: Bot },
    ],
  },
  {
    title: "管理",
    items: [
      { value: "workspace", label: "文件", icon: FolderOpen },
      { value: "channels", label: "渠道", icon: RadioTower },
      { value: "security", label: "安全", icon: ShieldCheck },
      { value: "logs", label: "日志", icon: FileText },
    ],
  },
];

function buildInitialWorkspacePath() {
  return [];
}

const AUTOMATED_TASK_PANEL_ITEMS: Array<{ key: AutomatedTaskPanelKey; label: string; description: string }> = [
  { key: "task-list", label: "任务列表", description: "管理当前 Claw 已配置的自动化任务。" },
  { key: "execution-history", label: "执行历史", description: "查看每次触发与执行产生的历史记录。" },
];

const AUTOMATED_EXECUTION_SCOPE_OPTIONS = [
  { value: "all", label: "全部任务" },
  { value: "specified", label: "指定任务" },
];

const AUTOMATED_EXECUTION_STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "success", label: "成功" },
  { value: "failure", label: "失败" },
];

type ClawFallbackModelRow = { id: string; model: string; params: ModelParams };

function pickDefaultFallbackModel(primaryModel: string): string {
  const different = PRESET_MODEL_IDS.find((id) => id !== primaryModel);
  return different ?? PRESET_MODEL_IDS[0] ?? "Qwen3-8B";
}

/** 当前 Fallback 行是否与主力或更早的 Fallback 选了同一模型（重复项） */
function isClawFallbackModelDuplicate(
  primaryModel: string,
  rows: ClawFallbackModelRow[],
  rowIndex: number
): boolean {
  const model = rows[rowIndex]?.model;
  if (!model) {
    return false;
  }
  if (model === primaryModel) {
    return true;
  }
  for (let i = 0; i < rowIndex; i++) {
    if (rows[i]?.model === model) {
      return true;
    }
  }
  return false;
}

type LogSessionListItem = {
  id: string;
  title: string;
  sessionId: string;
  channel: ConversationUsageChannel;
  startedAt: string;
  updatedAt: string;
  messageCount: number;
  eventCount: number;
  traceId: string;
};

type LogSessionEventKind = "user" | "agent" | "skill" | "tool";

type LogSessionEventItem = {
  id: string;
  kind: LogSessionEventKind;
  label: "User" | "Agent" | "技能" | "插件";
  title: string;
  time: string;
  summary: string;
  detail: string;
  traceId: string;
  turnNumber: number;
  status?: ConversationAuditItem["status"];
  durationLabel?: string;
  typeLabel?: ConversationAuditItem["type"];
  inputSummary?: string;
  outputSummary?: string;
};

type EditableDistributionChannel = ClawDetailData["distributionChannels"][number];

const CHANNEL_ICON_MAP = {
  蓝信: "/icons/蓝信.png",
  企业微信: "/icons/企业微信.png",
  飞书: "/icons/飞书.png",
  钉钉: "/icons/钉钉.png",
  QQ: "/icons/QQ.svg",
} as const;

const CHANNEL_SUBTITLE_MAP = {
  蓝信: "Lanxin",
  企业微信: "WeCom / WeChat Work",
  飞书: "Feishu / Lark",
  钉钉: "DingTalk",
  QQ: "Tencent QQ",
} as const;

const CHANNEL_ORDER = ["蓝信", "企业微信", "飞书", "钉钉", "QQ"] as const;

function buildEditableDistributionChannels(
  channels: ClawDetailData["distributionChannels"]
): EditableDistributionChannel[] {
  const channelMap = new Map(channels.map((channel) => [channel.name, channel]));

  return CHANNEL_ORDER.map((channelName) => {
    const existingChannel = channelMap.get(channelName);

    return {
      name: channelName,
      status: existingChannel?.status ?? "未接入",
      appId: existingChannel?.appId ?? "未配置",
      secretIdMasked: existingChannel?.secretIdMasked ?? "未配置",
    };
  });
}

function ClawPublishedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
      已发布
    </span>
  );
}

function MultiAgentStatusBadge({ published }: { published: boolean }) {
  if (published) {
    return <ClawPublishedBadge />;
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden />
      未发布
    </span>
  );
}

function PublishChannelStatusBadge({
  status,
  tone,
}: {
  status: "未生效" | "已生效" | ClawPlazaStatus;
  tone: "neutral" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[56px] items-center justify-center rounded-[4px] border px-2 py-0.5 text-xs font-medium",
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      )}
    >
      {status}
    </span>
  );
}

function getLogEventKind(record: ConversationAuditItem): Extract<LogSessionEventKind, "skill" | "tool"> {
  return /skill/i.test(record.targetName) ? "skill" : "tool";
}

function getLogEventLabel(kind: LogSessionEventKind): LogSessionEventItem["label"] {
  if (kind === "user") {
    return "User";
  }

  if (kind === "agent") {
    return "Agent";
  }

  if (kind === "skill") {
    return "技能";
  }

  return "插件";
}

function getLogEventBadgeClassName(kind: LogSessionEventKind) {
  if (kind === "user") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (kind === "agent") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (kind === "skill") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function isStructuredLogEvent(event: LogSessionEventItem) {
  return event.kind === "tool" || event.kind === "skill";
}

function isCliLogEvent(event: LogSessionEventItem) {
  return event.typeLabel === "CLI执行";
}

function getLogEventPrimaryPayloadLabel(event: LogSessionEventItem) {
  return isCliLogEvent(event) ? "命令行" : "Arguments";
}

function getLogEventPrimaryPayloadValue(event: LogSessionEventItem) {
  return isCliLogEvent(event) ? event.title : event.inputSummary || event.detail;
}

function getLogEventResultValue(event: LogSessionEventItem) {
  return event.outputSummary || event.detail;
}

function buildLogSessionEvents(summary: ConversationSessionSummary, agentName: string): LogSessionEventItem[] {
  return summary.session.turns.flatMap((turn) => {
    const auditEvents = turn.auditRecords.map((record, index) => {
      const kind = getLogEventKind(record);

      return {
        id: `${turn.id}-audit-${record.id}-${index}`,
        kind,
        label: getLogEventLabel(kind),
        title: record.targetName,
        time: turn.occurredAt,
        summary: record.outputSummary || record.inputSummary || record.targetName,
        detail: record.outputSummary || record.inputSummary || record.targetName,
        traceId: record.traceId,
        turnNumber: turn.turnNumber,
        status: record.status,
        durationLabel: formatDurationMs(record.durationMs),
        typeLabel: record.type,
        inputSummary: record.inputSummary,
        outputSummary: record.outputSummary,
      } satisfies LogSessionEventItem;
    });

    return [
      {
        id: `${turn.id}-user`,
        kind: "user",
        label: getLogEventLabel("user"),
        title: "用户",
        time: turn.occurredAt,
        summary: turn.userInput,
        detail: turn.userInput,
        traceId: turn.traceId,
        turnNumber: turn.turnNumber,
      },
      ...auditEvents,
      {
        id: `${turn.id}-agent`,
        kind: "agent",
        label: getLogEventLabel("agent"),
        title: agentName,
        time: turn.occurredAt,
        summary: turn.assistantOutput.split("\n")[0] ?? turn.assistantOutput,
        detail: turn.assistantOutput,
        traceId: turn.traceId,
        turnNumber: turn.turnNumber,
      },
    ];
  });
}

function mergeSecurityManagementWithCanonicalAutonomy(
  sm: ClawDetailData["securityManagement"]
): SecurityManagementConfig {
  return {
    ...sm,
    autonomyBoundaries: normalizeAutonomyBoundaries(sm.autonomyBoundaries),
  };
}

function AutomatedTaskResultCell({ result }: { result: ClawAutomatedTaskRecentResult }) {
  if (result === "success") {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-green-700">
        <span className="h-2 w-2 shrink-0 rounded-full bg-green-500 ring-1 ring-green-600/25" aria-hidden />
        成功
      </span>
    );
  }
  if (result === "failure") {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-red-600">
        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 ring-1 ring-red-600/30" aria-hidden />
        失败
      </span>
    );
  }
  if (result === "running") {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-amber-300/80 bg-amber-50 px-2 py-1 text-sm font-medium text-amber-900">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-500" aria-hidden />
        执行中
      </span>
    );
  }
  return <span className="text-sm text-slate-500">从未执行</span>;
}

function AutomatedTaskExecutionStatusBadge({ status }: { status: ClawAutomatedTaskExecutionStatus }) {
  if (status === "failure") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden />
        失败
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
      <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" aria-hidden />
      成功
    </span>
  );
}

function normalizeAutomatedTaskExecutionStatus(status: string): ClawAutomatedTaskExecutionStatus {
  return status === "failure" ? "failure" : "success";
}

export type ClawDetailWorkbenchMode = "claw" | "multi-agent";

export type ClawDetailWorkbenchProps = {
  detail: ClawDetailData;
  /** claw：原 Claw 详情；multi-agent：多智能体创建/配置（无顶栏开关、无渠道） */
  mode?: ClawDetailWorkbenchMode;
  backHref?: string;
  backAriaLabel?: string;
};

export function ClawDetailWorkbench({
  detail,
  mode = "claw",
  backHref = "/claw-hub-next",
  backAriaLabel = "返回 Claw 列表",
}: ClawDetailWorkbenchProps) {
  const isMultiAgentMode = mode === "multi-agent";
  const entityLabel = isMultiAgentMode ? "多智能体" : "Claw";
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<DetailSectionKey>("core");
  const [entityName, setEntityName] = useState(detail.overview.name);
  const [entityDescription, setEntityDescription] = useState(detail.overview.summary);
  const [subAgentConfigEnabled, setSubAgentConfigEnabled] = useState(
    () => isMultiAgentMode || detail.capabilityConfig.agents.claw.length > 0
  );

  const navGroups = useMemo(() => {
    const multiAgentHiddenNavKeys = new Set<DetailSectionKey>([
      "channels",
      "skills",
      "tools",
      "knowledge",
      "agents",
    ]);
    return CLAW_DETAIL_NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items
        .filter((item) => !(isMultiAgentMode && multiAgentHiddenNavKeys.has(item.value)))
        .map((item) => {
          if (item.value === "core") {
            return {
              ...item,
              label: isMultiAgentMode ? "多智能体配置" : `${entityLabel}配置`,
            };
          }
          return item;
        }),
    })).filter((group) => group.items.length > 0);
  }, [isMultiAgentMode, entityLabel]);

  const automatedTaskPanelItems = useMemo(
    () => [
      {
        key: "task-list" as const,
        label: "任务列表",
        description: `管理当前 ${entityLabel} 已配置的自动化任务。`,
      },
      {
        key: "execution-history" as const,
        label: "执行历史",
        description: "查看每次触发与执行产生的历史记录。",
      },
    ],
    [entityLabel]
  );
  const [debugOpen, setDebugOpen] = useState(false);
  const [configCollapsed, setConfigCollapsed] = useState(false);
  const [orchestrationTreeCollapsed, setOrchestrationTreeCollapsed] = useState(false);
  const [selectedOrchestrationNodeId, setSelectedOrchestrationNodeId] =
    useState(MULTI_AGENT_ROOT_NODE_ID);
  const [mainAgentName, setMainAgentName] = useState("主智能体");
  const [mainAgentPrompt, setMainAgentPrompt] = useState(
    () => detail.coreFiles.find((file) => file.key === "agent")?.content ?? ""
  );
  const [debugWidth, setDebugWidth] = useState(DEBUG_SPLIT_DEFAULT_DEBUG_WIDTH);
  const [isResizingDebug, setIsResizingDebug] = useState(false);
  const [splitWidth, setSplitWidth] = useState(0);
  const [debugInspectorMode, setDebugInspectorMode] = useState<"auto" | "open" | "closed">("auto");
  const [debugFreshSession, setDebugFreshSession] = useState(false);
  const [debugPanelKey, setDebugPanelKey] = useState(0);
  const [activeLogPanel] = useState<LogPanelKey>("conversation");
  const [publishStatus, setPublishStatus] = useState(detail.overview.publishStatus);
  const [publishPanelOpen, setPublishPanelOpen] = useState(false);
  const [publishValidationOpen, setPublishValidationOpen] = useState(false);
  const [apiPublishEffective, setApiPublishEffective] = useState(detail.overview.publishStatus === "已发布");
  const [plazaStatus, setPlazaStatus] = useState<ClawPlazaStatus>("未上架");
  const [shelfDialogOpen, setShelfDialogOpen] = useState(false);
  const [shelfReleaseMode, setShelfReleaseMode] = useState<ClawReleaseMode>("公开发布");
  const [shelfAgentTypes, setShelfAgentTypes] = useState<string[]>([]);
  const [chatSessions, setChatSessions] = useState(detail.chatSessions);
  const [conversationRuns, setConversationRuns] = useState(detail.conversationRuns);
  const [securityManagement, setSecurityManagement] = useState(() =>
    mergeSecurityManagementWithCanonicalAutonomy(detail.securityManagement)
  );
  const [selectedChatId, setSelectedChatId] = useState(detail.chatSessions[0]?.id ?? "");
  const [agentMdDraft, setAgentMdDraft] = useState(
    () => detail.coreFiles.find((file) => file.key === "agent")?.content ?? ""
  );
  const [capabilityConfig, setCapabilityConfig] = useState(detail.capabilityConfig);
  const [clawPrimaryModel, setClawPrimaryModel] = useState("Qwen3-32B");
  const [clawPrimaryModelParams, setClawPrimaryModelParams] = useState<ModelParams>(() =>
    getDefaultModelParams("Qwen3-32B")
  );
  const [clawFallbackModels, setClawFallbackModels] = useState<ClawFallbackModelRow[]>([]);
  const [distributionChannels, setDistributionChannels] = useState<EditableDistributionChannel[]>(() =>
    buildEditableDistributionChannels(detail.distributionChannels)
  );
  const [expandedChannelNames, setExpandedChannelNames] = useState<string[]>([]);
  const [visibleChannelSecrets, setVisibleChannelSecrets] = useState<Record<string, boolean>>({});
  const [toolConfigDialogOpen, setToolConfigDialogOpen] = useState(false);
  const [skillConfigDialogOpen, setSkillConfigDialogOpen] = useState(false);
  const [knowledgeConfigDialogOpen, setKnowledgeConfigDialogOpen] = useState(false);
  const [createAutomatedTaskOpen, setCreateAutomatedTaskOpen] = useState(false);
  const [createAutomatedTaskInitialMode, setCreateAutomatedTaskInitialMode] =
    useState<AutomatedTaskExecutionMode>("scheduled");
  const [toolScope, setToolScope] = useState<ToolSkillViewScope>("preset");
  const [skillScope, setSkillScope] = useState<ToolSkillViewScope>("preset");
  const [activeKnowledgePanel, setActiveKnowledgePanel] = useState<KnowledgePanelKey>("knowledge-base");
  const [knowledgeAssets, setKnowledgeAssets] = useState(
    () =>
      detail.knowledgeAssets ??
      buildKnowledgeAssetsFromLegacy(
        detail.capabilityConfig.knowledge,
        detail.overview.updatedBy || detail.overview.creator
      )
  );
  const [automatedTasks, setAutomatedTasks] = useState<ClawAutomatedTaskItem[]>(() => [...detail.automatedTasks]);
  const [automatedTaskExecutions] = useState<ClawAutomatedTaskExecutionItem[]>(() => [
    ...detail.automatedTaskExecutions,
  ]);
  const [activeAutomatedTaskPanel, setActiveAutomatedTaskPanel] = useState<AutomatedTaskPanelKey>("task-list");
  const [automatedTaskQuery, setAutomatedTaskQuery] = useState("");
  const [automatedTaskCreatorFilter, setAutomatedTaskCreatorFilter] = useState("all");
  const [automatedExecutionScope, setAutomatedExecutionScope] = useState<AutomatedTaskExecutionScope>("all");
  const [automatedExecutionTaskId, setAutomatedExecutionTaskId] = useState("all");
  const [automatedExecutionQuery, setAutomatedExecutionQuery] = useState("");
  const [automatedExecutionStatus, setAutomatedExecutionStatus] =
    useState<AutomatedTaskExecutionStatusFilter>("all");
  const [automatedExecutionChannel, setAutomatedExecutionChannel] =
    useState<AutomatedTaskExecutionChannelFilter>("all");
  const [workspaceStorageConfig] = useState(detail.workspaceStorageConfig);
  const [selectedWorkspacePath, setSelectedWorkspacePath] = useState<string[]>(() => buildInitialWorkspacePath());
  const [workspaceStorageDialogOpen, setWorkspaceStorageDialogOpen] = useState(false);
  const [selectedLogSessionId, setSelectedLogSessionId] = useState<string | null>(null);
  const [selectedLogEventId, setSelectedLogEventId] = useState<string | null>(null);
  const [agentRelations, setAgentRelations] = useState<AgentRelationItem[]>(() => [...detail.agentRelations]);
  const [agentRelationDraft, setAgentRelationDraft] = useState<AgentRelationItem | null>(null);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);

  const relationSelectOptions = useMemo(
    () => AGENT_RELATION_SELECT_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
    []
  );

  const automatedTaskCreatorFilterOptions = useMemo(() => {
    const names = Array.from(new Set(automatedTasks.map((t) => t.createdBy).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "zh-CN")
    );
    return [{ value: "all", label: "全部创建人" }, ...names.map((n) => ({ value: n, label: n }))];
  }, [automatedTasks]);

  const activeAutomatedTaskCreatorFilter =
    automatedTaskCreatorFilter === "all" || automatedTasks.some((t) => t.createdBy === automatedTaskCreatorFilter)
      ? automatedTaskCreatorFilter
      : "all";

  const filteredAutomatedTasks = useMemo(() => {
    const q = automatedTaskQuery.trim().toLowerCase();
    return automatedTasks.filter((task) => {
      if (activeAutomatedTaskCreatorFilter !== "all" && task.createdBy !== activeAutomatedTaskCreatorFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        task.name.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.createdBy.toLowerCase().includes(q)
      );
    });
  }, [activeAutomatedTaskCreatorFilter, automatedTaskQuery, automatedTasks]);

  const automatedExecutionTaskOptions = useMemo(
    () => [
      { value: "all", label: "请选择任务" },
      ...automatedTasks.map((task) => ({ value: task.id, label: task.name })),
    ],
    [automatedTasks]
  );

  const automatedExecutionChannelOptions = useMemo(
    () => [
      { value: "all", label: "全部" },
      ...AUTOMATED_TASK_DELIVERY_CHANNELS.map((channel) => ({ value: channel, label: channel })),
    ],
    []
  );

  const filteredAutomatedTaskExecutions = useMemo(() => {
    const q = automatedExecutionQuery.trim().toLowerCase();

    return automatedTaskExecutions
      .filter((execution) => {
        if (automatedExecutionScope === "specified") {
          return automatedExecutionTaskId !== "all" && execution.taskId === automatedExecutionTaskId;
        }
        return true;
      })
      .filter((execution) => {
        if (!q) {
          return true;
        }
        const name = execution.taskName.toLowerCase();
        const output = execution.finalOutput.toLowerCase();
        return name.includes(q) || output.includes(q);
      })
      .filter(
        (execution) =>
          automatedExecutionStatus === "all" ||
          normalizeAutomatedTaskExecutionStatus(execution.status) === automatedExecutionStatus
      )
      .filter(
        (execution) => automatedExecutionChannel === "all" || execution.deliveryChannel === automatedExecutionChannel
      )
      .sort((a, b) => b.executedAt.localeCompare(a.executedAt));
  }, [
    automatedExecutionChannel,
    automatedExecutionQuery,
    automatedExecutionScope,
    automatedExecutionStatus,
    automatedExecutionTaskId,
    automatedTaskExecutions,
  ]);

  function addClawFallbackModel() {
    const model = pickDefaultFallbackModel(clawPrimaryModel);
    setClawFallbackModels((rows) => [
      ...rows,
      { id: crypto.randomUUID(), model, params: getDefaultModelParams(model) },
    ]);
  }

  function removeClawFallbackModel(rowId: string) {
    setClawFallbackModels((rows) => rows.filter((row) => row.id !== rowId));
  }

  function reorderClawFallbackModels(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return;
    }
    setClawFallbackModels((rows) => {
      const next = [...rows];
      const from = Math.max(0, Math.min(fromIndex, next.length - 1));
      const to = Math.max(0, Math.min(toIndex, next.length - 1));
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  const currentSession = chatSessions.find((session) => session.id === selectedChatId) ?? chatSessions[0];
  const matchedConversationRun = conversationRuns.find((session) => session.id === selectedChatId);
  const conversationSessionSummaries = buildConversationSessionSummaries(chatSessions, conversationRuns);
  const logSessions = useMemo<LogSessionListItem[]>(
    () =>
      conversationSessionSummaries.map((summary) => ({
        id: summary.session.id,
        title: summary.session.title,
        sessionId: summary.session.sessionId,
        channel: summary.session.channel,
        startedAt: summary.session.startedAt,
        updatedAt: summary.session.updatedAt,
        messageCount: summary.messages.length,
        eventCount: summary.session.turns.length * 2 + summary.auditRecordCount,
        traceId: summary.session.traceId,
      })),
    [conversationSessionSummaries]
  );
  const selectedLogSession = logSessions.find((session) => session.id === selectedLogSessionId) ?? null;
  const selectedLogSessionSummary =
    conversationSessionSummaries.find((summary) => summary.session.id === selectedLogSessionId) ?? null;
  const selectedLogSessionEvents = useMemo(
    () => (selectedLogSessionSummary ? buildLogSessionEvents(selectedLogSessionSummary, detail.overview.name) : []),
    [detail.overview.name, selectedLogSessionSummary]
  );
  const activeLogEvent =
    selectedLogSessionEvents.find((event) => event.id === selectedLogEventId) ?? selectedLogSessionEvents[0] ?? null;
  const isPublished = publishStatus === "已发布";
  const agentBomTree = useMemo(
    () =>
      buildAgentBomTreeFromDetail(
        {
          ...detail,
          capabilityConfig,
          knowledgeAssets,
          securityManagement,
          resourceConfig: detail.resourceConfig,
        },
        entityLabel
      ),
    [detail, capabilityConfig, knowledgeAssets, securityManagement, entityLabel]
  );
  const isApiEffective = isPublished && apiPublishEffective;
  const canConfirmShelf = shelfAgentTypes.length > 0;

  useEffect(() => {
    const element = splitContainerRef.current;
    if (!element) {
      return undefined;
    }

    const updateWidth = () => setSplitWidth(element.getBoundingClientRect().width);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isResizingDebug) {
      return undefined;
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function handlePointerMove(event: PointerEvent) {
      const element = splitContainerRef.current;
      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      if (rect.width < DEBUG_SPLIT_COLLAPSE_WIDTH) {
        return;
      }

      const nextDebugWidth = rect.right - event.clientX;
      const maxDebugWidth = rect.width - DEBUG_SPLIT_MIN_CONFIG_WIDTH - DEBUG_SPLIT_HANDLE_WIDTH;
      setDebugWidth(
        Math.min(
          Math.max(nextDebugWidth, DEBUG_SPLIT_MIN_DEBUG_WIDTH),
          Math.max(maxDebugWidth, DEBUG_SPLIT_MIN_DEBUG_WIDTH)
        )
      );
    }

    function handlePointerUp() {
      setIsResizingDebug(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isResizingDebug]);

  function handleToggleChannelExpand(channelName: string) {
    setExpandedChannelNames((current) =>
      current.includes(channelName) ? current.filter((name) => name !== channelName) : [...current, channelName]
    );
  }

  function handleChannelFieldChange(
    channelName: string,
    field: "appId" | "secretIdMasked",
    value: string
  ) {
    setDistributionChannels((current) =>
      current.map((channel) => (channel.name === channelName ? { ...channel, [field]: value } : channel))
    );
  }

  function handleToggleChannelSecretVisibility(channelName: string) {
    setVisibleChannelSecrets((current) => ({
      ...current,
      [channelName]: !current[channelName],
    }));
  }

  function handleSaveDistributionChannel(channelName: string) {
    setDistributionChannels((current) =>
      current.map((channel) => {
        if (channel.name !== channelName) {
          return channel;
        }

        const isConfigured =
          Boolean(channel.appId.trim()) &&
          Boolean(channel.secretIdMasked.trim()) &&
          channel.appId !== "未配置" &&
          channel.secretIdMasked !== "未配置";

        return {
          ...channel,
          status: isConfigured ? "已接入" : "未接入",
        };
      })
    );

    toast.success(`${channelName} 渠道配置已保存。`);
  }

  function resolveKnowledgeItemScope(
    knowledge: ClawCapabilityConfig["knowledge"],
    id: string
  ): KnowledgeScope | null {
    if (knowledge.tenant.some((row) => row.id === id)) {
      return "tenant";
    }
    if (knowledge.claw.some((row) => row.id === id)) {
      return "claw";
    }
    return null;
  }

  function handleOpenLogSession(sessionId: string) {
    setSelectedLogSessionId(sessionId);
    setSelectedLogEventId(null);
  }

  function handleClearDebugSession() {
    setDebugFreshSession(true);
    setDebugPanelKey((current) => current + 1);
    toast.success("已清空当前会话，开始新会话。");
  }

  function handleCloseDebugPanel() {
    setDebugOpen(false);
    setDebugFreshSession(false);
    setDebugPanelKey(0);
    setConfigCollapsed(false);
  }

  function handleToggleDebugPanel() {
    if (debugOpen) {
      handleCloseDebugPanel();
      return;
    }

    setDebugOpen(true);
  }

  function handleDeleteLogSession(sessionId: string) {
    const nextChatSessions = chatSessions.filter((session) => session.id !== sessionId);
    const nextConversationRuns = conversationRuns.filter((session) => session.id !== sessionId);

    setChatSessions(nextChatSessions);
    setConversationRuns(nextConversationRuns);

    if (selectedChatId === sessionId) {
      setSelectedChatId(nextChatSessions[0]?.id ?? "");
    }

    if (selectedLogSessionId === sessionId) {
      setSelectedLogSessionId(null);
      setSelectedLogEventId(null);
    }

    toast.success("会话已删除。");
  }

  function handleBackToLogSessions() {
    setSelectedLogSessionId(null);
    setSelectedLogEventId(null);
  }

  function handleAutonomyBoundaryLevelChange(
    boundaryId: string,
    nextLevel: ClawDetailData["securityManagement"]["autonomyBoundaries"][number]["level"]
  ) {
    setSecurityManagement((current) => updateAutonomyBoundaryLevel(current, boundaryId, nextLevel));
  }

  function handleToolProtectionEnabledChange(enabled: boolean) {
    setSecurityManagement((current) => updateToolProtectionEnabled(current, enabled));
  }

  function handleToolProtectionRuleToggle(ruleId: string, enabled: boolean) {
    setSecurityManagement((current) => updateToolProtectionRuleEnabled(current, ruleId, enabled));
  }

  function handleAddToolProtectionRule(rule: ToolProtectionRuleItem) {
    setSecurityManagement((current) => addToolProtectionRule(current, rule));
  }

  function handleAddProtectedTool(name: string) {
    setSecurityManagement((current) => {
      if (current.toolProtection.protectedTools.includes(name)) {
        return current;
      }
      return {
        ...current,
        toolProtection: {
          ...current.toolProtection,
          protectedTools: [...current.toolProtection.protectedTools, name],
        },
      };
    });
  }

  function handleRemoveProtectedTool(name: string) {
    setSecurityManagement((current) => ({
      ...current,
      toolProtection: {
        ...current.toolProtection,
        protectedTools: current.toolProtection.protectedTools.filter((item) => item !== name),
      },
    }));
  }

  function handleAddProhibitedTool(name: string) {
    setSecurityManagement((current) => {
      if (current.toolProtection.prohibitedTools.includes(name)) {
        return current;
      }
      return {
        ...current,
        toolProtection: {
          ...current.toolProtection,
          prohibitedTools: [...current.toolProtection.prohibitedTools, name],
        },
      };
    });
  }

  function handleRemoveProhibitedTool(name: string) {
    setSecurityManagement((current) => ({
      ...current,
      toolProtection: {
        ...current.toolProtection,
        prohibitedTools: current.toolProtection.prohibitedTools.filter((item) => item !== name),
      },
    }));
  }

  function handleResolveApproval(approvalId: string, resolution: "approved" | "rejected") {
    setSecurityManagement((current) => resolveSecurityApproval(current, approvalId, resolution));
    toast.success(resolution === "approved" ? "已批准该请求。" : "已拒绝该请求。");
  }

  function handleSaveAgentMd() {
    toast.success("Agent.md 已保存。");
  }

  function handleToggleTool(scope: CapabilityScope, id: string, checked: boolean) {
    setCapabilityConfig((current) => ({
      ...current,
      tools: toggleScopedEnabledCollection(current.tools, scope, id, checked),
    }));
  }

  function handleSetAllToolsEnabled(enabled: boolean) {
    setCapabilityConfig((current) => ({
      ...current,
      tools: setAllToolsEnabled(current.tools, enabled),
    }));
    toast.success(enabled ? "已全部启用插件。" : "已全部停用插件。");
  }

  function handleSetAllSkillsEnabled(enabled: boolean) {
    setCapabilityConfig((current) => ({
      ...current,
      skills: setAllSkillsEnabled(current.skills, enabled),
    }));
    toast.success(enabled ? "已全部启用技能。" : "已全部停用技能。");
  }

  function handleDeleteTool(scope: CapabilityScope, id: string) {
    setCapabilityConfig((current) => ({
      ...current,
      tools: deleteScopedCollectionItem(current.tools, scope, id),
    }));
    toast.success("插件已移除。");
  }

  function handleOpenToolConfigDialog() {
    setToolConfigDialogOpen(true);
  }

  function handleOpenWorkspaceStorageDialog() {
    setWorkspaceStorageDialogOpen(true);
  }

  function handleOpenSkillConfigDialog() {
    setSkillConfigDialogOpen(true);
  }

  function handleConfirmToolConfig(selections: ToolConfigSelection[]) {
    const { items } = mergeClawToolSelections(capabilityConfig.tools.claw, selections);

    setCapabilityConfig((current) => ({
      ...current,
      tools: {
        ...current.tools,
        claw: items,
      },
    }));

    setToolScope("claw");
    setToolConfigDialogOpen(false);
  }

  function handleConfirmSkillConfig(selections: SkillConfigSelection[]) {
    const { items } = mergeClawSkillSelections(capabilityConfig.skills.claw, selections);

    setCapabilityConfig((current) => ({
      ...current,
      skills: {
        ...current.skills,
        claw: items,
      },
    }));

    setSkillScope("claw");
    setSkillConfigDialogOpen(false);
  }

  function handleConfirmKnowledgeConfig(selections: KnowledgeConfigSelection[]) {
    const creatorFallback = detail.overview.updatedBy || detail.overview.creator;

    setCapabilityConfig((current) => {
      const { items } = mergeClawKnowledgeSelections(current.knowledge.claw, selections);
      return {
        ...current,
        knowledge: {
          ...current.knowledge,
          claw: items,
        },
      };
    });

    setKnowledgeAssets((current) => {
      const byId = new Map(current.knowledgeBases.map((row) => [row.id, row]));
      selections.forEach((sel) => {
        const prev = byId.get(sel.id);
        byId.set(sel.id, {
          id: sel.id,
          name: sel.name,
          type: prev?.type ?? "高级",
          description: sel.description,
          creator: prev?.creator ?? creatorFallback,
          updatedAt: sel.updatedAt,
          enabled: true,
        });
      });
      return { ...current, knowledgeBases: Array.from(byId.values()) };
    });

    setKnowledgeConfigDialogOpen(false);
  }

  function handleToggleSkill(scope: CapabilityScope, id: string, enabled: boolean) {
    setCapabilityConfig((current) => ({
      ...current,
      skills: toggleScopedEnabledCollection(current.skills, scope, id, enabled),
    }));
    toast.success(enabled ? "技能已启用。" : "技能已停用。");
  }

  function handleDeleteSkill(scope: CapabilityScope, id: string) {
    setCapabilityConfig((current) => ({
      ...current,
      skills: deleteScopedCollectionItem(current.skills, scope, id),
    }));
    toast.success("技能已移除。");
  }

  function handleDeleteKnowledgeBase(id: string) {
    setKnowledgeAssets((current) => ({
      ...current,
      knowledgeBases: current.knowledgeBases.filter((row) => row.id !== id),
    }));
    setCapabilityConfig((current) => {
      const scope = resolveKnowledgeItemScope(current.knowledge, id);
      if (!scope) {
        return current;
      }
      return {
        ...current,
        knowledge: deleteScopedCollectionItem(current.knowledge, scope, id),
      };
    });
    toast.success("知识库已移除。");
  }

  function handleDeleteDatabase(id: string) {
    setKnowledgeAssets((current) => ({
      ...current,
      databases: current.databases.filter((row) => row.id !== id),
    }));
    toast.success("数据库已移除。");
  }

  function handleDeleteOntologyObject(id: string) {
    setKnowledgeAssets((current) => ({
      ...current,
      ontologyObjects: current.ontologyObjects.filter((row) => row.id !== id),
    }));
    toast.success("本体对象已移除。");
  }

  function handleDeleteTermBank(id: string) {
    setKnowledgeAssets((current) => ({
      ...current,
      termBanks: current.termBanks.filter((row) => row.id !== id),
    }));
    toast.success("术语库已移除。");
  }

  function handleToggleAutomatedTask(id: string, enabled: boolean) {
    setAutomatedTasks((rows) => rows.map((task) => (task.id === id ? { ...task, enabled } : task)));
  }

  function handleEditAutomatedTask(task: ClawAutomatedTaskItem) {
    toast.info(`编辑「${task.name}」入口即将接入。`);
  }

  function handleDeleteAutomatedTask(id: string) {
    setAutomatedTasks((rows) => rows.filter((task) => task.id !== id));
    setAutomatedExecutionTaskId((current) => (current === id ? "all" : current));
    toast.success("任务已删除。");
  }

  function openCreateAutomatedTask(mode: AutomatedTaskExecutionMode) {
    setCreateAutomatedTaskInitialMode(mode);
    setCreateAutomatedTaskOpen(true);
  }

  function handleViewAutomatedTaskExecutionDetail(execution: ClawAutomatedTaskExecutionItem) {
    const targetSessionId =
      execution.relatedSessionId && conversationRuns.some((run) => run.id === execution.relatedSessionId)
        ? execution.relatedSessionId
        : conversationRuns[0]?.id;

    if (!targetSessionId) {
      toast.info("这条执行记录暂未关联会话。");
      return;
    }

    setSelectedChatId(targetSessionId);
    setDebugOpen(true);
    toast.success("已切换到关联会话。");
  }

  function openEditAgentRelation(item: AgentRelationItem) {
    setAgentRelationDraft({ ...item });
  }

  function closeEditAgentRelation() {
    setAgentRelationDraft(null);
  }

  function saveAgentRelation() {
    if (!agentRelationDraft) {
      return;
    }
    setAgentRelations((rows) => rows.map((r) => (r.id === agentRelationDraft.id ? { ...agentRelationDraft } : r)));
    toast.success("已保存。");
    closeEditAgentRelation();
  }

  function deleteAgentRelation(id: string) {
    setAgentRelations((rows) => rows.filter((r) => r.id !== id));
    setAgentRelationDraft((draft) => (draft?.id === id ? null : draft));
    toast.success("已删除。");
  }

  function handlePublish() {
    setPublishPanelOpen(false);
    window.setTimeout(() => {
      setPublishValidationOpen(true);
    }, 120);
  }

  function handlePublishValidationPassed() {
    const wasPublished = publishStatus === "已发布";
    const publishedName = entityName.trim() || detail.overview.name;

    if (isMultiAgentMode) {
      upsertPublishedMultiAgent({
        id: detail.overview.id || `multi-agent-${Date.now()}`,
        name: publishedName,
        desc: entityDescription.trim() || detail.overview.summary,
        updatedAt: formatMultiAgentUpdatedAt(),
      });
      setPublishStatus("已发布");
      setApiPublishEffective(true);
      setPublishValidationOpen(false);
      toast.success(`已发布：${publishedName}`);
      router.push("/agent");
      return;
    }

    setPublishStatus("已发布");
    setApiPublishEffective(true);
    if (wasPublished) {
      toast.success(`校验通过：${publishedName}，API 调用已生效。`);
      return;
    }
    toast.success(`已发布：${publishedName}，API 调用已生效。`);
  }

  function handleOpenShelfDialog() {
    if (!isPublished) {
      toast.info(`请先发布 ${entityLabel}，再上架到智能体广场。`);
      return;
    }

    setPublishPanelOpen(false);
    setShelfDialogOpen(true);
  }

  function handleToggleShelfAgentType(agentType: string) {
    setShelfAgentTypes((current) => {
      if (current.includes(agentType)) {
        return current.filter((item) => item !== agentType);
      }

      if (current.length >= 2) {
        toast.info("智能体类型最多选择 2 个。");
        return current;
      }

      return [...current, agentType];
    });
  }

  function handleConfirmShelf() {
    if (!canConfirmShelf) {
      toast.error("请选择智能体类型。");
      return;
    }

    setPlazaStatus("已上架");
    setShelfDialogOpen(false);
    toast.success(`已上架到智能体广场：${shelfReleaseMode} / ${shelfAgentTypes.join("、")}`);
  }

  function handleSubAgentConfigToggle(enabled: boolean) {
    setSubAgentConfigEnabled(enabled);
    if (!enabled && activeSection === "agents") {
      setActiveSection("core");
    }
    toast.success(enabled ? "已开启子智能体配置" : "已关闭子智能体配置，已有配置将保留");
  }

  function handleAddOrchestrationSubAgent() {
    setCapabilityConfig((current) => {
      const nextIndex = current.agents.claw.length + 1;
      const nextAgent = {
        id: `sub-agent-${Date.now()}`,
        name: `子智能体 ${nextIndex}`,
        description: "",
        enabled: true,
        target: "",
        primaryModel: clawPrimaryModel,
        fallbackModel: pickDefaultFallbackModel(clawPrimaryModel),
        prompt: "",
        sourceType: "created" as const,
        resources: {
          skills: [],
          tools: [],
          knowledge: [],
        },
      };
      return {
        ...current,
        agents: {
          ...current.agents,
          claw: [...current.agents.claw, nextAgent],
        },
      };
    });
    setSubAgentConfigEnabled(true);
    toast.success("已添加子智能体");
  }

  function handleRemoveOrchestrationSubAgent(agentId: string) {
    setCapabilityConfig((current) => ({
      ...current,
      agents: {
        ...current.agents,
        claw: current.agents.claw.filter((agent) => agent.id !== agentId),
      },
    }));
    if (selectedOrchestrationNodeId === agentId) {
      setSelectedOrchestrationNodeId(MULTI_AGENT_ROOT_NODE_ID);
    }
    toast.success("已删除子智能体");
  }

  function handleUpdateOrchestrationSubAgent(
    agentId: string,
    patch: Partial<(typeof capabilityConfig.agents.claw)[number]>
  ) {
    setCapabilityConfig((current) => ({
      ...current,
      agents: {
        ...current.agents,
        claw: current.agents.claw.map((agent) =>
          agent.id === agentId ? { ...agent, ...patch } : agent
        ),
      },
    }));
  }

  const configSection = activeSection === "chat" ? "core" : activeSection;
  const compactDebugSplit = debugOpen && splitWidth > 0 && splitWidth < DEBUG_SPLIT_COLLAPSE_WIDTH;
  const debugPaneWidth =
    debugOpen && !compactDebugSplit && splitWidth > 0
      ? Math.min(
          Math.max(debugWidth, DEBUG_SPLIT_MIN_DEBUG_WIDTH),
          Math.max(splitWidth - DEBUG_SPLIT_MIN_CONFIG_WIDTH - DEBUG_SPLIT_HANDLE_WIDTH, DEBUG_SPLIT_MIN_DEBUG_WIDTH)
        )
      : debugWidth;
  const configPaneWidth =
    debugOpen && !compactDebugSplit && splitWidth > 0
      ? Math.max(splitWidth - debugPaneWidth - DEBUG_SPLIT_HANDLE_WIDTH, DEBUG_SPLIT_MIN_CONFIG_WIDTH)
      : undefined;
  const compactConfigNav = Boolean(configPaneWidth && configPaneWidth < 720);
  const compactConfigContent = Boolean(configPaneWidth && configPaneWidth < 980);
  const canForceDebugInspector = debugPaneWidth >= DEBUG_INSPECTOR_FORCE_MIN_WIDTH;
  const showDebugInspector =
    debugInspectorMode === "open"
      ? canForceDebugInspector
      : debugInspectorMode === "closed"
        ? false
        : debugPaneWidth >= DEBUG_INSPECTOR_AUTO_MIN_WIDTH;
  const debugInspectorToggleLabel = showDebugInspector ? "收起侧栏" : "展开侧栏";

  return (
    <WorkbenchEntityProvider entityLabel={entityLabel}>
    <div className="claw-detail-muted-theme flex h-full min-h-0 flex-col overflow-hidden bg-slate-50">
      <section className="shrink-0 border-b border-slate-200 bg-white px-5 py-3">
        <div className="flex min-h-12 items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            aria-label={backAriaLabel}
            title="返回"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          {isMultiAgentMode ? (
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <Input
                  value={entityName}
                  onChange={(event) => setEntityName(event.target.value)}
                  placeholder="请输入多智能体名称"
                  aria-label="多智能体名称"
                  className="h-8 max-w-[420px] min-w-[160px] truncate rounded-md border-transparent bg-transparent px-1.5 text-lg font-semibold text-slate-950 shadow-none hover:border-slate-200 hover:bg-white focus-visible:border-blue-300 focus-visible:bg-white focus-visible:ring-blue-100"
                />
                <MultiAgentStatusBadge published={isPublished} />
              </div>
              <Input
                value={entityDescription}
                onChange={(event) => setEntityDescription(event.target.value)}
                placeholder="请输入多智能体描述"
                aria-label="多智能体描述"
                className="mt-0.5 h-7 max-w-[640px] truncate rounded-md border-transparent bg-transparent px-1.5 text-sm text-slate-500 shadow-none hover:border-slate-200 hover:bg-white focus-visible:border-blue-300 focus-visible:bg-white focus-visible:ring-blue-100"
              />
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <h1 className="min-w-0 truncate text-xl font-semibold text-slate-950">
                {entityName || detail.overview.name}
              </h1>
              {isPublished ? <ClawPublishedBadge /> : null}
              {isPublished ? <AgentBomBadge tree={agentBomTree} versionLabel={detail.overview.version} /> : null}
              <div className="ml-1 flex shrink-0 items-center gap-2 border-l border-slate-200 pl-3">
                <span className="text-xs font-medium text-slate-500">多智能体</span>
                <Switch
                  checked={subAgentConfigEnabled}
                  onCheckedChange={handleSubAgentConfigToggle}
                  aria-label="启用多智能体配置"
                  title={subAgentConfigEnabled ? "关闭后将不能配置子智能体" : "开启后可配置子智能体"}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={isMultiAgentMode ? "outline" : "default"}
              className={cn(
                isMultiAgentMode
                  ? cn(
                      "h-9 rounded-md border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-none hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800",
                      debugOpen && "border-blue-300 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800"
                    )
                  : cn(
                      "h-10 rounded-md border border-blue-600 bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.30)] transition-all hover:-translate-y-px hover:border-blue-700 hover:bg-blue-700 hover:shadow-[0_6px_18px_rgba(37,99,235,0.34)] focus-visible:ring-blue-500/30",
                      debugOpen &&
                        "border-blue-800 bg-blue-800 shadow-[0_4px_14px_rgba(30,64,175,0.28)] hover:border-blue-900 hover:bg-blue-900"
                    )
              )}
              onClick={handleToggleDebugPanel}
            >
              {isMultiAgentMode ? null : <MessageSquareText className="size-[18px]" />}
              {isMultiAgentMode ? "预览与调试" : "对话调试"}
            </Button>
            <Popover open={publishPanelOpen} onOpenChange={setPublishPanelOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    isMultiAgentMode
                      ? "h-9 rounded-md bg-blue-600 px-3.5 text-sm font-medium text-white shadow-none hover:bg-blue-700"
                      : "h-9 rounded-md border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-none hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800"
                  )}
                  variant={isMultiAgentMode ? "default" : "outline"}
                >
                  发布
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={10} className="w-[320px] rounded-md border-slate-200 bg-white p-0 shadow-lg">
                <div className="space-y-3 p-4">
                  <div className="text-sm font-medium text-slate-700">
                    {isPublished ? "当前版本已发布" : "当前草稿未发布"}
                  </div>
                  <Button
                    type="button"
                    className="h-9 w-full rounded-[4px] bg-blue-600 text-sm font-medium text-white shadow-none hover:bg-blue-700"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handlePublish();
                    }}
                  >
                    {isPublished ? "校验并发布" : "发布"}
                  </Button>
                </div>

                <div className="border-t border-slate-100 px-4 py-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">API调用</span>
                        <PublishChannelStatusBadge
                          status={isApiEffective ? "已生效" : "未生效"}
                          tone={isApiEffective ? "success" : "neutral"}
                        />
                        <CircleHelp className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                      </div>
                      <button
                        type="button"
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-blue-600"
                        onClick={() => toast.info("调用说明入口即将接入。")}
                      >
                        调用说明
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">智能体广场</span>
                        <PublishChannelStatusBadge
                          status={plazaStatus}
                          tone={plazaStatus === "已上架" ? "success" : "neutral"}
                        />
                        <CircleHelp className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!isPublished}
                        className="h-7 rounded-[4px] border-slate-300 bg-white px-3 text-xs font-medium text-slate-600 shadow-none hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                        onClick={handleOpenShelfDialog}
                      >
                        {plazaStatus === "已上架" ? "变更" : "上架"}
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </section>

      <Tabs
        value={configSection}
        onValueChange={(value) => {
          const nextSection = value as DetailSectionKey;
          if (nextSection === "agents" && !subAgentConfigEnabled) return;
          setActiveSection(nextSection);
        }}
        className="min-h-0 flex-1 gap-0 overflow-hidden"
      >
        <div ref={splitContainerRef} className="flex min-h-0 flex-1 overflow-hidden">
          <div
            className={cn(
              "flex min-h-0 min-w-0 overflow-hidden",
              compactDebugSplit || configCollapsed ? "hidden" : "flex-1"
            )}
            style={configPaneWidth ? { width: configPaneWidth, flex: "0 0 auto" } : undefined}
          >
          <aside
            className={cn(
              "hidden shrink-0 border-r border-slate-200 bg-white transition-[width] md:block",
              compactConfigNav ? "w-[56px]" : "w-[220px]"
            )}
          >
            <nav className={cn("h-full overflow-y-auto py-5", compactConfigNav ? "px-2" : "px-4")}>
              {navGroups.map((group) => (
                <div key={group.title} className={cn(compactConfigNav ? "mb-3" : "mb-6", "last:mb-0")}>
                  {compactConfigNav ? null : (
                    <div className="mb-2 px-2 text-xs font-medium text-slate-400">{group.title}</div>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.value;
                      const isDisabled = item.value === "agents" && !subAgentConfigEnabled;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => !isDisabled && setActiveSection(item.value)}
                          disabled={isDisabled}
                          aria-label={item.label}
                          title={isDisabled ? "请先在页头开启子智能体配置" : item.label}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors",
                            compactConfigNav && "justify-center px-0",
                            isDisabled
                              ? "cursor-not-allowed text-slate-300"
                              : isActive
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", isDisabled ? "text-slate-300" : isActive ? "text-blue-600" : "text-slate-400")} />
                          {compactConfigNav ? null : <span className="min-w-0 truncate">{item.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
          {isMultiAgentMode && configSection === "core" ? (
            <MultiAgentOrchestrationPanel
              collapsed={orchestrationTreeCollapsed}
              onCollapsedChange={setOrchestrationTreeCollapsed}
              selectedNodeId={selectedOrchestrationNodeId}
              onSelectNode={setSelectedOrchestrationNodeId}
              rootLabel={mainAgentName || "主智能体"}
              subAgents={capabilityConfig.agents.claw}
              onAddSubAgent={handleAddOrchestrationSubAgent}
              onRemoveSubAgent={handleRemoveOrchestrationSubAgent}
            />
          ) : null}
          <div
            className={cn(
              "min-h-0 min-w-0 flex-1",
              "overflow-y-auto bg-slate-50 px-5 py-5"
            )}
          >
          <TabsContent value="status" className="mt-0">
            <SectionCard>
              <div className="rounded-[28px] border border-sky-100 bg-[linear-gradient(135deg,rgba(240,249,255,0.95),rgba(255,255,255,0.98))] p-6 shadow-sm shadow-sky-100/50">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] border border-sky-100 bg-white text-sky-700 shadow-sm shadow-sky-100/60">
                      <Bot className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-slate-950">{detail.overview.name}</div>
                      <div className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{detail.overview.summary}</div>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 text-sm text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                    Agent 已激活
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Name</div>
                    <div className="mt-3 text-base font-semibold text-slate-950">{detail.overview.name}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Description</div>
                    <div className="mt-3 text-sm leading-7 text-slate-600">{detail.overview.summary}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">创建时间</div>
                    <div className="mt-3 text-base font-semibold text-slate-950">{detail.overview.createdAt}</div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="core" className="mt-0">
            {isMultiAgentMode ? (
              selectedOrchestrationNodeId === MULTI_AGENT_ROOT_NODE_ID ? (
                <MultiAgentMainAgentConfig
                  agentName={mainAgentName}
                  onAgentNameChange={setMainAgentName}
                  prompt={mainAgentPrompt}
                  onPromptChange={setMainAgentPrompt}
                  primaryModel={clawPrimaryModel}
                  primaryModelParams={clawPrimaryModelParams}
                  fallbackModels={clawFallbackModels}
                  hiddenModelParamKeys={CLAW_MODEL_SELECTOR_HIDDEN_KEYS}
                  onPrimaryModelChange={setClawPrimaryModel}
                  onPrimaryModelParamsChange={setClawPrimaryModelParams}
                  onAddFallbackModel={addClawFallbackModel}
                  onRemoveFallbackModel={removeClawFallbackModel}
                  onFallbackModelChange={(rowId, model) =>
                    setClawFallbackModels((rows) => rows.map((r) => (r.id === rowId ? { ...r, model } : r)))
                  }
                  onFallbackModelParamsChange={(rowId, params) =>
                    setClawFallbackModels((rows) => rows.map((r) => (r.id === rowId ? { ...r, params } : r)))
                  }
                  isFallbackModelDuplicate={(index) =>
                    isClawFallbackModelDuplicate(clawPrimaryModel, clawFallbackModels, index)
                  }
                  capabilityConfig={capabilityConfig}
                  toolScope={toolScope}
                  onToolScopeChange={setToolScope}
                  skillScope={skillScope}
                  onSkillScopeChange={setSkillScope}
                  onOpenToolConfigDialog={handleOpenToolConfigDialog}
                  onOpenSkillConfigDialog={handleOpenSkillConfigDialog}
                  onSetAllSkillsEnabled={handleSetAllSkillsEnabled}
                  onSetAllToolsEnabled={handleSetAllToolsEnabled}
                  onToggleTool={handleToggleTool}
                  onDeleteTool={handleDeleteTool}
                  onToggleSkill={handleToggleSkill}
                  onDeleteSkill={handleDeleteSkill}
                  activeKnowledgePanel={activeKnowledgePanel}
                  onActiveKnowledgePanelChange={setActiveKnowledgePanel}
                  knowledgeAssets={knowledgeAssets}
                  onDeleteKnowledgeBase={handleDeleteKnowledgeBase}
                  onDeleteDatabase={handleDeleteDatabase}
                  onDeleteOntology={handleDeleteOntologyObject}
                  onDeleteTermBank={handleDeleteTermBank}
                  onOpenKnowledgeBaseConfig={() => setKnowledgeConfigDialogOpen(true)}
                  onOpenDatabaseConfig={() => toast.info("配置数据库入口即将接入。")}
                  onOpenOntologyConfig={() => toast.info("配置本体对象入口即将接入。")}
                  onOpenTermBankConfig={() => toast.info("配置术语库入口即将接入。")}
                />
              ) : (
                (() => {
                  const selectedSubAgent = capabilityConfig.agents.claw.find(
                    (agent) => agent.id === selectedOrchestrationNodeId
                  );
                  if (!selectedSubAgent) {
                    return (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
                        未找到该子智能体，请从左侧树重新选择。
                      </div>
                    );
                  }
                  return (
                    <MultiAgentSubAgentConfig
                      agent={selectedSubAgent}
                      clawDetail={{ ...detail, capabilityConfig }}
                      onChange={(patch) =>
                        handleUpdateOrchestrationSubAgent(selectedSubAgent.id, patch)
                      }
                    />
                  );
                })()
              )
            ) : (
              <ClawCoreConfigSection
                agentMdContent={agentMdDraft}
                primaryModel={clawPrimaryModel}
                primaryModelParams={clawPrimaryModelParams}
                fallbackModels={clawFallbackModels}
                hiddenModelParamKeys={CLAW_MODEL_SELECTOR_HIDDEN_KEYS}
                onAgentMdContentChange={setAgentMdDraft}
                onSaveAgentMd={handleSaveAgentMd}
                onPrimaryModelChange={setClawPrimaryModel}
                onPrimaryModelParamsChange={setClawPrimaryModelParams}
                onAddFallbackModel={addClawFallbackModel}
                onRemoveFallbackModel={removeClawFallbackModel}
                onFallbackModelChange={(rowId, model) =>
                  setClawFallbackModels((rows) => rows.map((r) => (r.id === rowId ? { ...r, model } : r)))
                }
                onFallbackModelParamsChange={(rowId, params) =>
                  setClawFallbackModels((rows) => rows.map((r) => (r.id === rowId ? { ...r, params } : r)))
                }
                isFallbackModelDuplicate={(index) =>
                  isClawFallbackModelDuplicate(clawPrimaryModel, clawFallbackModels, index)
                }
              />
            )}
          </TabsContent>

          <TabsContent value="model" className="mt-0">
            <SectionCard
              title="模型配置"
              description="Fallback 按列表顺序依次尝试。"
            >
              <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <div className="grid gap-0 md:grid-cols-2 md:divide-x md:divide-slate-200">
                  <div className="space-y-3 p-5">
                    <Label className="text-sm font-medium text-slate-800">
                      <span className="text-rose-500" aria-hidden>
                        *
                      </span>
                      主力模型
                    </Label>
                    <ModelSelector
                      selectedModel={clawPrimaryModel}
                      modelParams={clawPrimaryModelParams}
                      onModelChange={setClawPrimaryModel}
                      onParamsChange={setClawPrimaryModelParams}
                      presetOnly
                      hiddenParamKeys={CLAW_MODEL_SELECTOR_HIDDEN_KEYS}
                      triggerClassName="w-full min-w-0 justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 hover:bg-slate-50"
                    />
                  </div>
                  <div className="space-y-3 border-t border-slate-200 p-5 md:border-t-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <Label className="text-sm font-medium text-slate-800">Fallback 模型</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 rounded-md border-slate-200 bg-white shadow-none"
                        onClick={addClawFallbackModel}
                      >
                        <Plus className="h-4 w-4" />
                        添加
                      </Button>
                    </div>

                    {clawFallbackModels.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-800">
                        暂无 Fallback，请点击「添加」加入降级模型。
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {clawFallbackModels.map((row, index) => {
                          const duplicate = isClawFallbackModelDuplicate(
                            clawPrimaryModel,
                            clawFallbackModels,
                            index
                          );
                          return (
                            <li
                              key={row.id}
                              onDragOver={(event) => {
                                event.preventDefault();
                                event.dataTransfer.dropEffect = "move";
                              }}
                              onDrop={(event) => {
                                event.preventDefault();
                                const raw = event.dataTransfer.getData("application/x-claw-fallback-index");
                                const fromIndex = Number.parseInt(raw, 10);
                                if (!Number.isFinite(fromIndex)) {
                                  return;
                                }
                                reorderClawFallbackModels(fromIndex, index);
                              }}
                              className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/30 p-3 sm:flex-row sm:items-start sm:gap-2"
                            >
                              <div
                                draggable
                                title="拖动排序"
                                aria-label={`拖动排序，当前第 ${index + 1} 条`}
                                className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-md border border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
                                onDragStart={(event) => {
                                  event.dataTransfer.setData("application/x-claw-fallback-index", String(index));
                                  event.dataTransfer.effectAllowed = "move";
                                }}
                              >
                                <GripVertical className="h-4 w-4" aria-hidden />
                              </div>
                              <span className="shrink-0 text-xs font-medium text-slate-500 sm:w-6 sm:pt-1">
                                {index + 1}.
                              </span>
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <ModelSelector
                                  selectedModel={row.model}
                                  modelParams={row.params}
                                  onModelChange={(model) =>
                                    setClawFallbackModels((rows) =>
                                      rows.map((r) => (r.id === row.id ? { ...r, model } : r))
                                    )
                                  }
                                  onParamsChange={(params) =>
                                    setClawFallbackModels((rows) =>
                                      rows.map((r) => (r.id === row.id ? { ...r, params } : r))
                                    )
                                  }
                                  presetOnly
                                  hiddenParamKeys={CLAW_MODEL_SELECTOR_HIDDEN_KEYS}
                                  triggerClassName={cn(
                                    "w-full min-w-0 justify-between rounded-lg bg-white px-3 py-2.5",
                                    duplicate
                                      ? "border-2 border-red-500 hover:bg-red-50/40"
                                      : "border border-slate-200 hover:bg-slate-50"
                                  )}
                                />
                                {duplicate ? (
                                  <p className="text-xs leading-5 text-red-600" role="status">
                                    与已选模型重复，建议选择不同模型作为fallback模型
                                  </p>
                                ) : null}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mt-0 shrink-0 self-start text-slate-500 hover:text-red-600 sm:mt-1.5"
                                onClick={() => removeClawFallbackModel(row.id)}
                                aria-label={`移除第 ${index + 1} 条 Fallback 模型`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="skills" className="mt-0">
            <ClawCapabilitySection
              panel="skills"
              capabilityConfig={capabilityConfig}
              toolScope={toolScope}
              onToolScopeChange={setToolScope}
              skillScope={skillScope}
              onSkillScopeChange={setSkillScope}
              onOpenToolConfigDialog={handleOpenToolConfigDialog}
              onOpenSkillConfigDialog={handleOpenSkillConfigDialog}
              onSetAllSkillsEnabled={handleSetAllSkillsEnabled}
              onToggleTool={handleToggleTool}
              onDeleteTool={handleDeleteTool}
              onToggleSkill={handleToggleSkill}
              onDeleteSkill={handleDeleteSkill}
            />
          </TabsContent>

          <TabsContent value="tools" className="mt-0">
            <ClawCapabilitySection
              panel="tools"
              capabilityConfig={capabilityConfig}
              toolScope={toolScope}
              onToolScopeChange={setToolScope}
              skillScope={skillScope}
              onSkillScopeChange={setSkillScope}
              onOpenToolConfigDialog={handleOpenToolConfigDialog}
              onOpenSkillConfigDialog={handleOpenSkillConfigDialog}
              onSetAllToolsEnabled={handleSetAllToolsEnabled}
              onToggleTool={handleToggleTool}
              onDeleteTool={handleDeleteTool}
              onToggleSkill={handleToggleSkill}
              onDeleteSkill={handleDeleteSkill}
            />
          </TabsContent>

          <TabsContent value="knowledge" className="mt-0">
            <ClawKnowledgeAssetsSection
              activePanel={activeKnowledgePanel}
              onActivePanelChange={setActiveKnowledgePanel}
              assets={knowledgeAssets}
              onDeleteKnowledgeBase={handleDeleteKnowledgeBase}
              onDeleteDatabase={handleDeleteDatabase}
              onDeleteOntology={handleDeleteOntologyObject}
              onDeleteTermBank={handleDeleteTermBank}
              onOpenKnowledgeBaseConfig={() => setKnowledgeConfigDialogOpen(true)}
              onOpenDatabaseConfig={() => toast.info("配置数据库入口即将接入。")}
              onOpenOntologyConfig={() => toast.info("配置本体对象入口即将接入。")}
              onOpenTermBankConfig={() => toast.info("配置术语库入口即将接入。")}
            />
          </TabsContent>

          <TabsContent value="agents" className="mt-0">
            <ClawAgentResourceSection
              agents={capabilityConfig.agents.claw}
              clawDetail={{ ...detail, capabilityConfig }}
              compact={compactConfigContent}
              onChange={(agents) => setCapabilityConfig((current) => ({
                ...current,
                agents: { ...current.agents, claw: agents },
              }))}
            />
          </TabsContent>

          <TabsContent value="channels" className="mt-0">
            <SectionCard>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-500">
                  当前共接入
                  <span className="mx-2 font-semibold text-slate-950">
                    {distributionChannels.filter((item) => item.status === "已接入").length}
                  </span>
                  个渠道
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-md border-slate-200 bg-white shadow-none"
                  onClick={() => toast.success("已预留接入新渠道的入口。")}
                >
                  <Plus className="h-4 w-4" />
                  接入新渠道
                </Button>
              </div>

              <div className="overflow-hidden border border-slate-200 bg-white">
                {distributionChannels.map((channel) => {
                  const isConnected = channel.status === "已接入";
                  const isExpanded = expandedChannelNames.includes(channel.name);
                  const channelIcon = CHANNEL_ICON_MAP[channel.name as keyof typeof CHANNEL_ICON_MAP];
                  const channelSubtitle = CHANNEL_SUBTITLE_MAP[channel.name as keyof typeof CHANNEL_SUBTITLE_MAP] ?? channel.name;

                  return (
                    <div key={channel.name} className="border-b border-slate-200 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => handleToggleChannelExpand(channel.name)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/70"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                            <Image src={channelIcon} alt={channel.name} width={28} height={28} className="h-7 w-7 object-contain" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-950">{channel.name}</div>
                            <div className="mt-1 text-xs text-slate-500">{channelSubtitle}</div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium",
                              isConnected
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-500"
                            )}
                          >
                            {isConnected ? "已接入" : "未接入"}
                          </span>
                          <ChevronDown
                            className={cn("h-4 w-4 text-slate-400 transition-transform", isExpanded ? "rotate-180" : "")}
                          />
                        </div>
                      </button>

                      {isExpanded ? (
                        <div className="border-t border-slate-200 px-5 py-5">
                          <div className="space-y-4">
                            <div className="grid gap-4">
                              <div className="grid items-center gap-3 md:grid-cols-[140px_minmax(0,1fr)]">
                                <Label
                                  htmlFor={`${channel.name}-app-id`}
                                  className="flex items-center gap-1 text-sm font-medium text-slate-800"
                                >
                                  <span className="text-rose-500">*</span>
                                  <span>App ID</span>
                                </Label>
                                <Input
                                  id={`${channel.name}-app-id`}
                                  value={channel.appId}
                                  onChange={(event) => handleChannelFieldChange(channel.name, "appId", event.target.value)}
                                  className="h-10 rounded-md border-slate-200 bg-white text-sm shadow-none"
                                />
                              </div>

                              <div className="grid items-center gap-3 md:grid-cols-[140px_minmax(0,1fr)]">
                                <Label
                                  htmlFor={`${channel.name}-secret`}
                                  className="flex items-center gap-1 text-sm font-medium text-slate-800"
                                >
                                  <span className="text-rose-500">*</span>
                                  <span>App Secret</span>
                                </Label>
                                <div className="relative">
                                  <Input
                                    id={`${channel.name}-secret`}
                                    type={visibleChannelSecrets[channel.name] ? "text" : "password"}
                                    value={channel.secretIdMasked}
                                    onChange={(event) =>
                                      handleChannelFieldChange(channel.name, "secretIdMasked", event.target.value)
                                    }
                                    className="h-10 rounded-md border-slate-200 bg-white pr-10 text-sm shadow-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleToggleChannelSecretVisibility(channel.name)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                                    aria-label={visibleChannelSecrets[channel.name] ? "隐藏密文" : "显示密文"}
                                  >
                                    {visibleChannelSecrets[channel.name] ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              className="rounded-md bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => handleSaveDistributionChannel(channel.name)}
                            >
                              保存配置
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="automated-tasks" className="mt-0">
            <SectionCard>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="inline-flex w-fit rounded-md border border-slate-200 bg-slate-50 p-1">
                    {automatedTaskPanelItems.map((panel) => (
                      <button
                        key={panel.key}
                        type="button"
                        onClick={() => setActiveAutomatedTaskPanel(panel.key)}
                        className={cn(
                          "rounded-sm px-4 py-1.5 text-sm font-medium transition-colors",
                          activeAutomatedTaskPanel === panel.key
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        {panel.label}
                      </button>
                    ))}
                  </div>
                  <div className="max-w-2xl text-sm leading-6 text-slate-500">
                    {automatedTaskPanelItems.find((panel) => panel.key === activeAutomatedTaskPanel)?.description}
                  </div>
                </div>

                {activeAutomatedTaskPanel === "task-list" ? (
                  <>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="relative min-w-0 flex-1 sm:max-w-md">
                          <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            aria-hidden
                          />
                          <Input
                            value={automatedTaskQuery}
                            onChange={(event) => setAutomatedTaskQuery(event.target.value)}
                            placeholder="按名称、描述或创建人搜索"
                            className="h-9 border-slate-200 bg-white pl-9 shadow-none"
                            aria-label="搜索自动化任务"
                          />
                        </div>
                        <div className="w-full space-y-1.5 sm:w-[200px] sm:shrink-0">
                          <Label className="text-xs font-medium text-slate-500">创建人</Label>
                          <Select
                            value={activeAutomatedTaskCreatorFilter}
                            onValueChange={setAutomatedTaskCreatorFilter}
                            options={automatedTaskCreatorFilterOptions}
                            placeholder="筛选创建人"
                            className="h-9 border-slate-200 bg-white shadow-none"
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 border-slate-200 bg-white shadow-none"
                          aria-label="刷新列表"
                          onClick={() => toast.success("任务列表已刷新。")}
                        >
                          <RefreshCw className="h-4 w-4 text-slate-600" />
                        </Button>
                        <Button
                          type="button"
                          className="h-9 gap-1 rounded-md bg-blue-600 px-4 text-white shadow-none hover:bg-blue-700"
                          onClick={() => openCreateAutomatedTask("scheduled")}
                        >
                          <Plus className="h-4 w-4" />
                          新建任务
                        </Button>
                      </div>
                    </div>

                    <div className="border border-slate-200 bg-white">
                      <Table className="min-w-[1480px] table-fixed border-collapse [&_td]:break-words">
                        <TableHeader className="bg-slate-50">
                          <TableRow className="border-slate-200 hover:bg-slate-50">
                            <TableHead className="h-11 w-[14%] min-w-[160px] px-4 text-sm font-medium text-slate-700">
                              名称
                            </TableHead>
                            <TableHead className="h-11 w-[22%] min-w-[220px] px-4 text-sm font-medium text-slate-700">
                              描述
                            </TableHead>
                            <TableHead className="h-11 w-[10%] min-w-[100px] px-4 text-sm font-medium text-slate-700">
                              创建人
                            </TableHead>
                            <TableHead className="h-11 w-[16%] min-w-[168px] px-4 text-sm font-medium text-slate-700">
                              触发方式和时间
                            </TableHead>
                            <TableHead className="h-11 w-[11%] min-w-[124px] px-4 text-sm font-medium text-slate-700">
                              上次执行时间
                            </TableHead>
                            <TableHead className="h-11 w-[8%] min-w-[80px] px-4 text-sm font-medium text-slate-700">
                              最近结果
                            </TableHead>
                            <TableHead className="h-11 w-[10%] min-w-[100px] px-4 text-sm font-medium text-slate-700">
                              交付位置（渠道）
                            </TableHead>
                            <TableHead className="h-11 w-[15%] min-w-[168px] px-4 text-sm font-medium text-slate-700">
                              操作项
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAutomatedTasks.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="px-4 py-16 text-center text-sm text-slate-500">
                                {automatedTasks.length === 0 ? "暂无自动化任务。" : "没有匹配的任务。"}
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredAutomatedTasks.map((task) => (
                              <TableRow key={task.id} className="border-slate-200 hover:bg-slate-50/60">
                                <TableCell className="w-[14%] min-w-[160px] px-4 py-4 align-top whitespace-normal">
                                  <div className="flex min-w-0 gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                                      <CalendarClock className="h-5 w-5 text-blue-600" aria-hidden />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="break-words text-[15px] font-semibold text-slate-950">{task.name}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="w-[22%] min-w-[220px] px-4 py-4 align-top text-sm leading-6 text-slate-600 whitespace-normal">
                                  <p className="break-words [overflow-wrap:anywhere]">{task.description}</p>
                                </TableCell>
                                <TableCell className="w-[10%] min-w-[100px] px-4 py-4 align-top text-sm text-slate-800 whitespace-normal">
                                  <span className="break-words [overflow-wrap:anywhere]">{task.createdBy}</span>
                                </TableCell>
                                <TableCell className="w-[16%] min-w-[168px] px-4 py-4 align-top whitespace-normal">
                                  <div className="min-w-0 space-y-2">
                                    <div className="break-words text-sm text-slate-800 [overflow-wrap:anywhere]">
                                      {task.triggerSummary}
                                    </div>
                                    <span className="inline-flex max-w-full items-center rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                      {task.triggerKind}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="w-[11%] min-w-[124px] whitespace-nowrap px-4 py-4 align-middle text-sm text-slate-700">
                                  {task.lastExecutedAt ?? "—"}
                                </TableCell>
                                <TableCell className="w-[8%] min-w-[80px] px-4 py-4 align-middle whitespace-normal">
                                  <AutomatedTaskResultCell result={task.recentResult} />
                                </TableCell>
                                <TableCell className="w-[10%] min-w-[100px] px-4 py-4 align-middle whitespace-normal">
                                  <span className="inline-flex max-w-full rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-800 [overflow-wrap:anywhere]">
                                    {task.deliveryChannel}
                                  </span>
                                </TableCell>
                                <TableCell className="w-[15%] min-w-[168px] px-4 py-4 align-middle whitespace-normal">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <Switch
                                      checked={task.enabled}
                                      onCheckedChange={(checked) => handleToggleAutomatedTask(task.id, checked)}
                                      aria-label={`${task.name} 启停`}
                                      className="data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-200"
                                    />
                                    <button
                                      type="button"
                                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                      onClick={() => handleEditAutomatedTask(task)}
                                    >
                                      编辑
                                    </button>
                                    <span className="text-slate-300" aria-hidden>
                                      |
                                    </span>
                                    <button
                                      type="button"
                                      className="text-sm font-medium text-rose-600 hover:text-rose-700"
                                      onClick={() => handleDeleteAutomatedTask(task.id)}
                                    >
                                      删除
                                    </button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-950">自动化任务执行历史</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          用于查看当前 {entityLabel} 的自动化任务历史执行记录，一条记录对应一次任务触发与执行。
                        </p>
                      </div>
                      <div className="text-xs font-medium text-slate-400">排序：最新优先</div>
                    </div>

                    <div className="border border-slate-200 bg-slate-50/70 p-4">
                      <div className="grid gap-3 lg:grid-cols-[150px_minmax(180px,1fr)_minmax(220px,1.2fr)_140px_140px]">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-slate-500">任务范围</Label>
                          <Select
                            value={automatedExecutionScope}
                            onValueChange={(value) => {
                              const nextScope = value as AutomatedTaskExecutionScope;
                              setAutomatedExecutionScope(nextScope);
                              if (nextScope === "all") {
                                setAutomatedExecutionTaskId("all");
                              }
                            }}
                            options={AUTOMATED_EXECUTION_SCOPE_OPTIONS}
                            placeholder="全部任务"
                            className="border-slate-200 bg-white shadow-none focus:ring-0"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-slate-500">指定任务</Label>
                          {automatedExecutionScope === "specified" ? (
                            <Select
                              value={automatedExecutionTaskId}
                              onValueChange={setAutomatedExecutionTaskId}
                              options={automatedExecutionTaskOptions}
                              placeholder="请选择任务"
                              className="border-slate-200 bg-white shadow-none focus:ring-0"
                            />
                          ) : (
                            <div className="flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-400">
                              不限定具体任务
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-slate-500">搜索</Label>
                          <div className="relative">
                            <Search
                              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                              aria-hidden
                            />
                            <Input
                              value={automatedExecutionQuery}
                              onChange={(event) => setAutomatedExecutionQuery(event.target.value)}
                              placeholder="按任务名称或执行输出筛选"
                              className="h-9 border-slate-200 bg-white pl-9 shadow-none"
                              aria-label="按任务名称或执行输出筛选执行历史"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-slate-500">执行结果</Label>
                          <Select
                            value={automatedExecutionStatus}
                            onValueChange={(value) =>
                              setAutomatedExecutionStatus(value as AutomatedTaskExecutionStatusFilter)
                            }
                            options={AUTOMATED_EXECUTION_STATUS_OPTIONS}
                            placeholder="全部"
                            className="border-slate-200 bg-white shadow-none focus:ring-0"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-slate-500">交付渠道</Label>
                          <Select
                            value={automatedExecutionChannel}
                            onValueChange={(value) =>
                              setAutomatedExecutionChannel(value as AutomatedTaskExecutionChannelFilter)
                            }
                            options={automatedExecutionChannelOptions}
                            placeholder="全部"
                            className="border-slate-200 bg-white shadow-none focus:ring-0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 bg-white">
                      <Table className="min-w-[1280px] table-fixed border-collapse">
                        <TableHeader className="bg-slate-50">
                          <TableRow className="border-slate-200 hover:bg-slate-50">
                            <TableHead className="h-11 w-[16%] px-4 text-sm font-medium text-slate-700">
                              任务名称
                            </TableHead>
                            <TableHead className="h-11 w-[35%] px-4 text-sm font-medium text-slate-700">
                              执行输出
                            </TableHead>
                            <TableHead className="h-11 w-[9%] min-w-[88px] px-4 text-sm font-medium text-slate-700">
                              执行结果
                            </TableHead>
                            <TableHead className="h-11 w-[14%] px-4 text-sm font-medium text-slate-700">
                              执行时间
                            </TableHead>
                            <TableHead className="h-11 w-[18%] px-4 text-sm font-medium text-slate-700">
                              任务交付位置/对象
                            </TableHead>
                            <TableHead className="h-11 w-[8%] min-w-[72px] px-4 text-right text-sm font-medium text-slate-700">
                              操作
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAutomatedTaskExecutions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="px-4 py-16 text-center text-sm text-slate-500">
                                暂无匹配的执行记录。
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredAutomatedTaskExecutions.map((execution) => (
                              <TableRow key={execution.id} className="border-slate-200 hover:bg-slate-50/60">
                                <TableCell className="max-w-0 px-4 py-4 align-top">
                                  <button
                                    type="button"
                                    className="break-words text-left text-sm font-semibold text-slate-950 transition-colors hover:text-blue-600"
                                    onClick={() => handleViewAutomatedTaskExecutionDetail(execution)}
                                  >
                                    {execution.taskName}
                                  </button>
                                  <div className="mt-1 font-mono text-[11px] text-slate-400">{execution.traceId}</div>
                                </TableCell>
                                <TableCell className="max-w-0 px-4 py-4 align-top">
                                  <div className="truncate text-sm text-slate-700" title={execution.finalOutput}>
                                    {execution.finalOutput}
                                  </div>
                                </TableCell>
                                <TableCell className="w-[9%] min-w-[88px] max-w-0 px-4 py-4 align-middle">
                                  <div className="flex w-fit min-w-0 items-center justify-start">
                                    <AutomatedTaskExecutionStatusBadge
                                      status={normalizeAutomatedTaskExecutionStatus(execution.status)}
                                    />
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap px-4 py-4 align-top text-sm text-slate-700">
                                  {execution.executedAt}
                                </TableCell>
                                <TableCell className="max-w-0 px-4 py-4 align-top">
                                  <span className="inline-flex rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                                    {execution.deliveryChannel}
                                  </span>
                                  <div className="mt-2 break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
                                    {execution.deliveryTarget}
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-4 text-right align-top">
                                  <button
                                    type="button"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                    onClick={() => handleViewAutomatedTaskExecutionDetail(execution)}
                                  >
                                    查看详情
                                  </button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="workspace" className="mt-0">
            <ClawWorkspaceSection
              workspaceRoot={detail.workspaceRoot}
              storageConfig={workspaceStorageConfig}
              selectedPath={selectedWorkspacePath}
              onSelectPath={setSelectedWorkspacePath}
              onOpenStorageConfig={handleOpenWorkspaceStorageDialog}
            />
          </TabsContent>

          <TabsContent value="logs" className="mt-0 h-full min-h-0 overflow-hidden">
            {activeLogPanel === "conversation" ? (
              selectedLogSession && selectedLogSessionSummary ? (
                <div className="flex h-full min-h-0 flex-col">
                  <div className="shrink-0 border-b border-slate-200 pb-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <button
                        type="button"
                        onClick={handleBackToLogSessions}
                        className="transition-colors hover:text-slate-900"
                      >
                        会话日志
                      </button>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                      <span className="font-medium text-slate-900">{selectedLogSession.sessionId}</span>
                    </div>

                    <div className="mt-3">
                      <div>
                        <div className="text-xl font-semibold text-slate-950">{selectedLogSession.title}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span>{selectedLogSession.channel}</span>
                          <span className="text-slate-300">/</span>
                          <span className="font-mono text-xs text-slate-400">{selectedLogSession.traceId}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="flex min-h-0 flex-col overflow-hidden border border-slate-200 bg-white">
                      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-950">消息与事件</div>
                          <div className="mt-1 text-xs text-slate-500">按时间顺序展示 User、Agent、技能与插件事件</div>
                        </div>
                        <div className="text-xs text-slate-400">{selectedLogSessionEvents.length} 项</div>
                      </div>

                      <ScrollArea className="min-h-0 flex-1">
                        <div className="divide-y divide-slate-200">
                          {selectedLogSessionEvents.map((event) => (
                            <button
                              key={event.id}
                              type="button"
                              onClick={() => setSelectedLogEventId(event.id)}
                              className={cn(
                                "grid w-full gap-3 px-4 py-3 text-left transition-colors md:grid-cols-[96px_minmax(0,1fr)_88px]",
                                activeLogEvent?.id === event.id ? "bg-slate-50" : "hover:bg-slate-50/70"
                              )}
                            >
                              <div className="flex flex-col gap-2">
                                <Badge
                                  className={cn(
                                    "w-fit rounded-none border px-2 py-0.5 text-[11px] font-medium",
                                    getLogEventBadgeClassName(event.kind)
                                  )}
                                >
                                  {event.label}
                                </Badge>
                                <div className="text-xs text-slate-400">第 {event.turnNumber} 轮</div>
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="truncate text-sm font-medium text-slate-950">{event.title}</div>
                                  {event.status ? (
                                    <Badge className={cn("rounded-none border px-2 py-0.5 text-[11px]", getAuditStatusClassName(event.status))}>
                                      {event.status}
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{event.summary}</div>
                              </div>

                              <div className="text-left text-xs text-slate-400 md:text-right">{event.time}</div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="flex min-h-0 flex-col overflow-hidden border border-slate-200 bg-white">
                      {activeLogEvent ? (
                        <>
                          <div className="border-b border-slate-200 px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                className={cn(
                                  "rounded-none border px-2 py-0.5 text-[11px] font-medium",
                                  getLogEventBadgeClassName(activeLogEvent.kind)
                                )}
                              >
                                {activeLogEvent.label}
                              </Badge>
                              <div className="text-sm font-medium text-slate-950">{activeLogEvent.title}</div>
                            </div>
                            <div className="mt-2 text-xs text-slate-400">
                              {activeLogEvent.time} · 第 {activeLogEvent.turnNumber} 轮
                            </div>
                          </div>

                          <ScrollArea className="min-h-0 flex-1">
                            <div className="space-y-4 p-4">
                              <div className="flex flex-wrap gap-2">
                                <Badge className="border-slate-200 bg-white text-slate-600">{activeLogEvent.time}</Badge>
                                {activeLogEvent.traceId ? (
                                  <Badge className="border-slate-200 bg-white font-mono text-slate-600">
                                    {activeLogEvent.traceId}
                                  </Badge>
                                ) : null}
                                {activeLogEvent.typeLabel ? (
                                  <Badge className={cn("border", getAuditTypeClassName(activeLogEvent.typeLabel))}>
                                    {activeLogEvent.typeLabel}
                                  </Badge>
                                ) : null}
                                {activeLogEvent.status ? (
                                  <Badge className={cn("border", getAuditStatusClassName(activeLogEvent.status))}>
                                    {activeLogEvent.status}
                                  </Badge>
                                ) : null}
                                {activeLogEvent.durationLabel ? (
                                  <Badge className="border-slate-200 bg-white text-slate-600">{activeLogEvent.durationLabel}</Badge>
                                ) : null}
                              </div>

                              {isStructuredLogEvent(activeLogEvent) ? (
                                <>
                                  <div className="overflow-hidden border border-slate-200 bg-white">
                                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                      {getLogEventPrimaryPayloadLabel(activeLogEvent)}
                                    </div>
                                    <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-[13px] leading-6 text-slate-700">
                                      {getLogEventPrimaryPayloadValue(activeLogEvent)}
                                    </pre>
                                  </div>

                                  {getLogEventResultValue(activeLogEvent) ? (
                                    <div className="overflow-hidden border border-slate-200 bg-white">
                                      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        Result
                                      </div>
                                      <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-[13px] leading-6 text-slate-700">
                                        {getLogEventResultValue(activeLogEvent)}
                                      </pre>
                                    </div>
                                  ) : null}
                                </>
                              ) : (
                                <div>
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">内容</div>
                                  <div className="mt-2 whitespace-pre-line border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                                    {activeLogEvent.detail}
                                  </div>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </>
                      ) : (
                        <div className="flex min-h-full flex-col items-center justify-center px-6 text-center">
                          <div className="text-sm font-medium text-slate-900">请选择一条消息或事件</div>
                          <div className="mt-2 text-xs text-slate-500">右侧会展示该条记录的详细内容与审计摘要。</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                  <div className="flex min-h-0 flex-col overflow-hidden border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                      <div className="text-sm font-semibold text-slate-950">会话列表</div>
                    </div>

                    <div className="hidden border-b border-slate-200 bg-slate-50/70 px-4 py-2 text-xs font-medium text-slate-500 lg:grid lg:grid-cols-[minmax(0,1.6fr)_200px_160px_160px_140px]">
                      <span>会话</span>
                      <span>使用渠道</span>
                      <span>创建时间</span>
                      <span>更新时间</span>
                      <span>操作项</span>
                    </div>

                    <ScrollArea className="min-h-0 flex-1">
                      {logSessions.length ? (
                        <div className="divide-y divide-slate-200">
                          {logSessions.map((session) => (
                            <div
                              key={session.id}
                              className="grid gap-3 px-4 py-4 transition-colors hover:bg-slate-50/70 lg:grid-cols-[minmax(0,1.6fr)_200px_160px_160px_140px]"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-950">{session.title}</div>
                                <div className="mt-1 font-mono text-xs text-slate-400">{session.sessionId}</div>
                              </div>
                              <div className="min-w-0 text-sm text-slate-600">
                                <div className="truncate">{session.channel}</div>
                              </div>
                              <div className="text-sm text-slate-600">{session.startedAt}</div>
                              <div className="text-sm text-slate-600">{session.updatedAt}</div>
                              <div className="flex items-center gap-3 text-sm">
                                <button
                                  type="button"
                                  onClick={() => handleOpenLogSession(session.id)}
                                  className="text-blue-600 transition-colors hover:text-blue-700"
                                >
                                  详情
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLogSession(session.id)}
                                  className="text-blue-600 transition-colors hover:text-blue-700"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex min-h-full items-center justify-center px-6 py-16 text-sm text-slate-500">
                          暂无可展示的 Session。
                        </div>
                      )}
                    </ScrollArea>
                  </div>
              )
            ) : null}

            {activeLogPanel === "security" ? (
                <div className="min-h-0 h-full overflow-y-auto">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">安全审计</div>
                      <div className="mt-1 text-xs text-slate-500">汇总会话和任务中的拦截、脱敏、记录与放行结果。</div>
                    </div>
                    <Badge className="border-slate-200 bg-white text-slate-600">{detail.securityEvents.length}</Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-[22px] border border-slate-200 bg-white/90 p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          安全事件总数
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-slate-950">{detail.securityEvents.length}</div>
                      </div>
                      <div className="rounded-[22px] border border-slate-200 bg-white/90 p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          拦截
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-rose-700">
                          {detail.securityEvents.filter((event) => event.action === "拦截").length}
                        </div>
                      </div>
                      <div className="rounded-[22px] border border-slate-200 bg-white/90 p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          脱敏
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-amber-700">
                          {detail.securityEvents.filter((event) => event.action === "脱敏").length}
                        </div>
                      </div>
                      <div className="rounded-[22px] border border-slate-200 bg-white/90 p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          低风险记录
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-slate-700">
                          {
                            detail.securityEvents.filter(
                              (event) => event.level === "低" && (event.action === "记录" || event.action === "放行")
                            ).length
                          }
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {detail.securityEvents.map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "rounded-[24px] border bg-white/90 p-5",
                            event.level === "高"
                              ? "border-rose-200"
                              : event.level === "中"
                                ? "border-amber-200"
                                : "border-slate-200"
                          )}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className={cn("border", getSecurityLevelClassName(event.level))}>
                                  {event.level}风险
                                </Badge>
                                <Badge className={cn("border", getSecurityActionClassName(event.action))}>
                                  {event.action}
                                </Badge>
                                <div className="text-base font-semibold text-slate-950">{event.ruleName}</div>
                              </div>
                              <div className="mt-2 text-sm text-slate-500">
                                {event.sourceType} · {event.sourceName}
                              </div>
                            </div>

                            <div className="text-right text-sm text-slate-500">
                              <div>{event.time}</div>
                              <div className="mt-1 font-mono text-xs text-slate-400">{event.traceId}</div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 xl:grid-cols-[180px_minmax(0,1fr)]">
                            <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                命中阶段
                              </div>
                              <div className="mt-2 text-sm font-medium text-slate-900">{event.stage}</div>
                            </div>

                            <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                内容摘要
                              </div>
                              <div className="mt-2 text-sm leading-6 text-slate-600">{event.contentSummary}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
          </TabsContent>

          <TabsContent value="security" className="mt-0 w-full min-w-0">
            <ClawSecuritySection
              activePanel="all"
              securityManagement={securityManagement}
              onAutonomyBoundaryLevelChange={handleAutonomyBoundaryLevelChange}
              onToolProtectionEnabledChange={handleToolProtectionEnabledChange}
              onToolProtectionRuleToggle={handleToolProtectionRuleToggle}
              onAddToolProtectionRule={handleAddToolProtectionRule}
              onAddProtectedTool={handleAddProtectedTool}
              onRemoveProtectedTool={handleRemoveProtectedTool}
              onAddProhibitedTool={handleAddProhibitedTool}
              onRemoveProhibitedTool={handleRemoveProhibitedTool}
              onResolveApproval={handleResolveApproval}
            />
          </TabsContent>

          <TabsContent value="relations" className="mt-0">
            <div className="border border-slate-200 bg-white">
              <section className="min-w-0">
                <div className="flex items-center justify-between gap-4 px-6 py-5">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-slate-600" />
                    <div className="text-lg font-semibold text-slate-950">Agent</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-md border-slate-200 bg-white shadow-none"
                    onClick={() => toast.success("已预留添加 Agent 的入口。")}
                  >
                    <Plus className="h-4 w-4" />
                    添加Agent
                  </Button>
                </div>

                <div className="border-t border-slate-200" />

                <div className="divide-y divide-slate-200">
                  {agentRelations.length === 0 ? (
                    <div className="px-6 py-12 text-center text-sm text-slate-500">暂无关联 Agent。</div>
                  ) : null}
                  {agentRelations.map((item) => (
                    <div key={item.id} className="px-6 py-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold text-slate-950">{item.name}</span>
                            <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                              {item.relationship}
                            </Badge>
                          </div>
                          <p className="text-sm leading-6 text-slate-500">{item.originalDescription}</p>
                          <p className="text-sm leading-6 text-slate-800">
                            <span className="font-medium text-slate-700">关系说明</span>
                            <span className="text-slate-600">：</span>
                            {item.personalizedDescription}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-5 text-sm font-medium">
                          <button
                            type="button"
                            className="text-blue-600 transition-colors hover:text-blue-700"
                            onClick={() => openEditAgentRelation(item)}
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            className="text-blue-600 transition-colors hover:text-blue-700"
                            onClick={() => deleteAgentRelation(item.id)}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </TabsContent>

          </div>
          </div>

          {debugOpen ? (
            <>
              {!compactDebugSplit && !configCollapsed ? (
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="调整配置和调试区域宽度"
                  title="拖拽调整宽度"
                  className={cn(
                    "group flex w-2 shrink-0 cursor-col-resize items-stretch justify-center bg-white transition-colors hover:bg-blue-50",
                    isResizingDebug && "bg-blue-50"
                  )}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    setIsResizingDebug(true);
                  }}
                >
                  <span
                    className={cn(
                      "my-0.5 w-px bg-slate-200 transition-colors group-hover:bg-blue-300",
                      isResizingDebug && "bg-blue-400"
                    )}
                  />
                </div>
              ) : null}

              <section
                className="flex min-h-0 min-w-0 flex-col border-l border-slate-200 bg-white"
                style={
                  compactDebugSplit || configCollapsed
                    ? { flex: "1 1 auto" }
                    : { width: debugPaneWidth, flex: "0 0 auto" }
                }
              >
                <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
                  <div className="min-w-0 truncate text-sm font-semibold text-slate-900">对话调试</div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfigCollapsed((current) => !current)}
                      aria-label={configCollapsed ? "展开配置页" : "收起配置页"}
                      title={configCollapsed ? "展开配置页" : "收起配置页，让对话调试更宽"}
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-blue-100 bg-white px-2 text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {configCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
                      <span className="text-xs font-medium">{configCollapsed ? "展开配置" : "收起配置"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearDebugSession}
                      aria-label="清空当前会话"
                      title="清空当前会话"
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-blue-100 bg-white px-2 text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">清空</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDebugInspectorMode(showDebugInspector ? "closed" : "open")}
                      disabled={!showDebugInspector && !canForceDebugInspector}
                      aria-label={debugInspectorToggleLabel}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-blue-100 bg-white text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                      title={
                        canForceDebugInspector || showDebugInspector
                          ? debugInspectorToggleLabel
                          : "当前调试区域过窄，无法展开侧栏"
                      }
                    >
                      {showDebugInspector ? (
                        <PanelRightClose className="h-3.5 w-3.5" />
                      ) : (
                        <PanelRightOpen className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      aria-label="关闭对话调试"
                      title="关闭"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      onClick={handleCloseDebugPanel}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden">
                  {detail.overview.id === "claw-scientific-research" ||
                  isMultiAgentMode ? (
                    <ResearchMultiAgentDebugPanel key={`research-debug-${debugPanelKey}`} detail={detail} inspectorMode={debugInspectorMode} />
                  ) : (
                    <ClawInteractiveChatPanel
                      key={`debug-${debugPanelKey}`}
                      detail={detail}
                      session={debugFreshSession ? undefined : currentSession}
                      run={debugFreshSession ? undefined : matchedConversationRun}
                      inspectorMode={debugInspectorMode}
                    />
                  )}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </Tabs>
      <Dialog open={shelfDialogOpen} onOpenChange={setShelfDialogOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-[600px]">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-lg font-semibold text-slate-950">上架</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="grid items-center gap-3 sm:grid-cols-[88px_minmax(0,1fr)]">
              <Label className="flex items-center gap-1 text-sm font-medium text-slate-700">
                <span className="text-rose-500">*</span>
                <span>发布方式:</span>
              </Label>
              <RadioGroup
                value={shelfReleaseMode}
                onValueChange={(value) => setShelfReleaseMode(value as ClawReleaseMode)}
                className="flex flex-wrap items-center gap-5"
              >
                {CLAW_RELEASE_MODE_OPTIONS.map((mode) => (
                  <label key={mode} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <RadioGroupItem value={mode} className="border-slate-300 text-blue-600" />
                    <span>{mode}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="grid items-start gap-3 sm:grid-cols-[88px_minmax(0,1fr)]">
              <Label className="flex items-center gap-1 pt-2 text-sm font-medium text-slate-700">
                <span className="text-rose-500">*</span>
                <span>智能体类型:</span>
              </Label>
              <div className="min-w-0">
                <div className="flex min-h-10 w-full items-center rounded-[4px] border border-slate-300 bg-white px-3 py-1.5 text-sm">
                  {shelfAgentTypes.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {shelfAgentTypes.map((agentType) => (
                        <span
                          key={agentType}
                          className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                        >
                          {agentType}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">请选择</span>
                  )}
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                </div>

                <div className="mt-2 flex flex-wrap gap-2 rounded-[4px] border border-slate-200 bg-slate-50 px-2 py-2">
                  {CLAW_AGENT_TYPE_OPTIONS.map((agentType) => {
                    const selected = shelfAgentTypes.includes(agentType);
                    return (
                      <button
                        key={agentType}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => handleToggleShelfAgentType(agentType)}
                        className={cn(
                          "h-8 rounded-full border px-4 text-sm font-medium transition-colors",
                          selected
                            ? "border-blue-200 bg-blue-600 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
                        )}
                      >
                        {agentType}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-white px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-[4px] border-slate-300 bg-white px-5 text-slate-700 shadow-none"
              onClick={() => setShelfDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={!canConfirmShelf}
              className="h-9 rounded-[4px] bg-blue-600 px-5 text-white shadow-none hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              onClick={handleConfirmShelf}
            >
              确认上架
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={workspaceStorageDialogOpen} onOpenChange={setWorkspaceStorageDialogOpen}>
        <DialogContent className="sm:max-w-[920px]">
          <DialogHeader>
            <DialogTitle>存储配置</DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="border border-slate-200 bg-slate-50/50 px-5 py-4">
              <div className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                  <div className="text-slate-500">存储卷名称:</div>
                  <div className="text-slate-900">{workspaceStorageConfig.volumeDisplayName}</div>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                  <div className="text-slate-500">存储卷描述:</div>
                  <div className="text-slate-900">{workspaceStorageConfig.volumeDescription || "--"}</div>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                  <div className="text-slate-500">存储源:</div>
                  <div className="text-slate-900">{workspaceStorageConfig.volumeName}</div>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                  <div className="text-slate-500">子目录:</div>
                  <div className="text-slate-900">{workspaceStorageConfig.subdirectory}</div>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                  <div className="text-slate-500">分配容量:</div>
                  <div className="text-slate-900">{workspaceStorageConfig.volumeTotalGb.toFixed(2)}GB</div>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                  <div className="text-slate-500">所属组织:</div>
                  <div className="text-slate-900">{workspaceStorageConfig.organizationName}</div>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                  <div className="text-slate-500">绑定项目:</div>
                  <div className="text-slate-900">{workspaceStorageConfig.projectName ?? "--"}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-800">已使用/总空间</Label>
              <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                {workspaceStorageConfig.workspaceUsedGb}GB / {workspaceStorageConfig.volumeTotalGb}GB
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setWorkspaceStorageDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setWorkspaceStorageDialogOpen(false)}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={agentRelationDraft !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeEditAgentRelation();
          }
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton>
          {agentRelationDraft ? (
            <>
              <DialogHeader className="border-b border-slate-200 px-6 py-5 text-left">
                <DialogTitle className="sr-only">编辑 Agent 关系</DialogTitle>
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                    {agentRelationDraft.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-slate-950">{agentRelationDraft.name}</span>
                      <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        {agentRelationDraft.relationship}
                      </Badge>
                    </div>
                    <p className="text-sm leading-6 text-slate-500">{agentRelationDraft.originalDescription}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 px-6 py-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-800">关系</Label>
                  <Select
                    value={agentRelationDraft.relationship}
                    onValueChange={(value) =>
                      setAgentRelationDraft((current) =>
                        current ? { ...current, relationship: value as AgentRelationKind } : current
                      )
                    }
                    options={relationSelectOptions}
                    placeholder="请选择关系"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent-relation-personal" className="text-sm font-medium text-slate-800">
                    关系说明
                  </Label>
                  <Textarea
                    id="agent-relation-personal"
                    value={agentRelationDraft.personalizedDescription}
                    onChange={(event) =>
                      setAgentRelationDraft((current) =>
                        current ? { ...current, personalizedDescription: event.target.value } : current
                      )
                    }
                    className="min-h-[120px] resize-y rounded-md border-slate-200 text-sm leading-6"
                    placeholder={`说明该 Agent 的能力、专长及在本 ${entityLabel} 中的用途…`}
                  />
                </div>
              </div>

              <DialogFooter className="border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:justify-start">
                <Button
                  type="button"
                  className="rounded-md bg-slate-900 px-5 text-white hover:bg-slate-800"
                  onClick={saveAgentRelation}
                >
                  保存
                </Button>
                <Button type="button" variant="outline" className="rounded-md border-slate-200 bg-white" onClick={closeEditAgentRelation}>
                  取消
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ToolConfigDialog open={toolConfigDialogOpen} onOpenChange={setToolConfigDialogOpen} onConfirm={handleConfirmToolConfig} />
      <SkillConfigDialog
        open={skillConfigDialogOpen}
        onOpenChange={setSkillConfigDialogOpen}
        onConfirm={handleConfirmSkillConfig}
      />
      <KnowledgeConfigDialog
        open={knowledgeConfigDialogOpen}
        onOpenChange={setKnowledgeConfigDialogOpen}
        onConfirm={handleConfirmKnowledgeConfig}
      />
      <CreateAutomatedTaskDialog
        open={createAutomatedTaskOpen}
        onOpenChange={setCreateAutomatedTaskOpen}
        initialExecutionMode={createAutomatedTaskInitialMode}
        defaultCreatedBy={detail.overview.creator}
        onCreated={({ item }) => setAutomatedTasks((rows) => [item, ...rows])}
      />
      <ClawPublishValidationDialog
        open={publishValidationOpen}
        onOpenChange={setPublishValidationOpen}
        agentName={entityName.trim() || detail.overview.name}
        confirmLabel={isPublished ? "确认生效" : "确认发布"}
        onValidationPassed={handlePublishValidationPassed}
      />
    </div>
    </WorkbenchEntityProvider>
  );
}
