"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  MessageSquareText,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { ClawCapabilitySection } from "@/components/claw-hub-next/detail/capability-section";
import { ClawInteractiveChatPanel } from "@/components/claw-hub-next/interactive-chat-panel";
import {
  DETAIL_SECTION_ITEMS,
  LOG_PANEL_ITEMS,
  SECURITY_PANEL_ITEMS,
  type DetailSectionKey,
  type LogPanelKey,
  type SecurityPanelKey,
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
  toggleScopedEnabledCollection,
  updateAutonomyBoundaryLevel,
  updateToolProtectionEnabled,
  updateToolProtectionRuleEnabled,
} from "@/components/claw-hub-next/detail/state";
import { KnowledgeConfigDialog, type KnowledgeConfigSelection } from "@/components/claw-hub-next/knowledge-config-dialog";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AGENT_RELATION_SELECT_OPTIONS,
  type AgentRelationItem,
  type AgentRelationKind,
  type CapabilityScope,
  type ClawCoreFileKey,
  type ClawDetailData,
  type ConversationAuditItem,
  type KnowledgeScope,
  type SecurityManagementConfig,
  type ToolProtectionRuleItem,
} from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";

type LogSessionListItem = {
  id: string;
  title: string;
  sessionId: string;
  channel: string;
  userIdentity: string;
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
  label: "User" | "Agent" | "Skill" | "工具";
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
} as const;

const CHANNEL_SUBTITLE_MAP = {
  蓝信: "Lanxin",
  企业微信: "WeCom / WeChat Work",
  飞书: "Feishu / Lark",
  钉钉: "DingTalk",
} as const;

const CHANNEL_ORDER = ["蓝信", "企业微信", "飞书", "钉钉"] as const;

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
    return "Skill";
  }

  return "工具";
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
        title: summary.session.userIdentity,
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

export function ClawDetailWorkbench({ detail }: { detail: ClawDetailData }) {
  const [activeSection, setActiveSection] = useState<DetailSectionKey>("core");
  const [activeLogPanel, setActiveLogPanel] = useState<LogPanelKey>("conversation");
  const [chatSessions, setChatSessions] = useState(detail.chatSessions);
  const [chatSidebarCollapsed, setChatSidebarCollapsed] = useState(false);
  const [conversationRuns, setConversationRuns] = useState(detail.conversationRuns);
  const [securityManagement, setSecurityManagement] = useState(() =>
    mergeSecurityManagementWithCanonicalAutonomy(detail.securityManagement)
  );
  const [activeSecurityPanel, setActiveSecurityPanel] = useState<SecurityPanelKey>("autonomy-boundaries");
  const [selectedChatId, setSelectedChatId] = useState(detail.chatSessions[0]?.id ?? "");
  const [selectedCoreFileKey, setSelectedCoreFileKey] = useState<ClawCoreFileKey | null>(null);
  const [coreFileDrafts, setCoreFileDrafts] = useState<Record<ClawCoreFileKey, string>>(() =>
    detail.coreFiles.reduce(
      (accumulator, file) => ({ ...accumulator, [file.key]: file.content }),
      {} as Record<ClawCoreFileKey, string>
    )
  );
  const [capabilityConfig, setCapabilityConfig] = useState(detail.capabilityConfig);
  const [distributionChannels, setDistributionChannels] = useState<EditableDistributionChannel[]>(() =>
    buildEditableDistributionChannels(detail.distributionChannels)
  );
  const [expandedChannelNames, setExpandedChannelNames] = useState<string[]>([]);
  const [visibleChannelSecrets, setVisibleChannelSecrets] = useState<Record<string, boolean>>({});
  const [toolConfigDialogOpen, setToolConfigDialogOpen] = useState(false);
  const [skillConfigDialogOpen, setSkillConfigDialogOpen] = useState(false);
  const [knowledgeConfigDialogOpen, setKnowledgeConfigDialogOpen] = useState(false);
  const [toolScope, setToolScope] = useState<ToolSkillViewScope>("preset");
  const [skillScope, setSkillScope] = useState<ToolSkillViewScope>("preset");
  const [knowledgeScope, setKnowledgeScope] = useState<KnowledgeScope>("tenant");
  const [logsMenuOpen, setLogsMenuOpen] = useState(false);
  const [securityMenuOpen, setSecurityMenuOpen] = useState(false);
  const [selectedLogSessionId, setSelectedLogSessionId] = useState<string | null>(null);
  const [selectedLogEventId, setSelectedLogEventId] = useState<string | null>(null);
  const [agentRelations, setAgentRelations] = useState<AgentRelationItem[]>(() => [...detail.agentRelations]);
  const [agentRelationDraft, setAgentRelationDraft] = useState<AgentRelationItem | null>(null);
  const logsMenuCloseTimerRef = useRef<number | null>(null);
  const securityMenuCloseTimerRef = useRef<number | null>(null);

  const relationSelectOptions = useMemo(
    () => AGENT_RELATION_SELECT_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
    []
  );

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
        userIdentity: summary.session.userIdentity,
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
  const selectedCoreFile = detail.coreFiles.find((file) => file.key === selectedCoreFileKey) ?? null;
  const statusBadgeClassName =
    detail.overview.status === "运行中"
      ? "border-[#d9e1da] bg-[#f5f7f5] text-[#5c6c5f]"
      : detail.overview.status === "设计中"
        ? "border-[#e6ddd2] bg-[#faf7f2] text-[#7b6854]"
        : detail.overview.status === "待评审"
          ? "border-[#dde2ea] bg-[#f6f8fb] text-[#61708a]"
          : "border-slate-200 bg-slate-100 text-slate-700";
  const publishBadgeClassName =
    detail.overview.publishStatus === "已发布"
      ? "border-[#d8e0ea] bg-[#f5f7fb] text-[#596b86]"
      : "border-slate-200 bg-slate-100 text-slate-600";

  useEffect(() => {
    return () => {
      if (logsMenuCloseTimerRef.current !== null) {
        window.clearTimeout(logsMenuCloseTimerRef.current);
      }
      if (securityMenuCloseTimerRef.current !== null) {
        window.clearTimeout(securityMenuCloseTimerRef.current);
      }
    };
  }, []);

  function handleSelectChatSession(sessionId: string) {
    setSelectedChatId(sessionId);
    setChatSessions((current) =>
      current.map((item) => (item.id === sessionId ? { ...item, unreadCount: 0 } : item))
    );
  }

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

  function clearLogsMenuCloseTimer() {
    if (logsMenuCloseTimerRef.current !== null) {
      window.clearTimeout(logsMenuCloseTimerRef.current);
      logsMenuCloseTimerRef.current = null;
    }
  }

  function openLogsMenu() {
    clearLogsMenuCloseTimer();
    setLogsMenuOpen(true);
  }

  function scheduleLogsMenuClose() {
    clearLogsMenuCloseTimer();
    logsMenuCloseTimerRef.current = window.setTimeout(() => {
      setLogsMenuOpen(false);
      logsMenuCloseTimerRef.current = null;
    }, 120);
  }

  function handleSelectLogPanel(panel: LogPanelKey) {
    setActiveSection("logs");
    setActiveLogPanel(panel);
    setLogsMenuOpen(false);
  }

  function clearSecurityMenuCloseTimer() {
    if (securityMenuCloseTimerRef.current !== null) {
      window.clearTimeout(securityMenuCloseTimerRef.current);
      securityMenuCloseTimerRef.current = null;
    }
  }

  function openSecurityMenu() {
    clearSecurityMenuCloseTimer();
    setSecurityMenuOpen(true);
  }

  function scheduleSecurityMenuClose() {
    clearSecurityMenuCloseTimer();
    securityMenuCloseTimerRef.current = window.setTimeout(() => {
      setSecurityMenuOpen(false);
      securityMenuCloseTimerRef.current = null;
    }, 120);
  }

  function handleSelectSecurityPanel(panel: SecurityPanelKey) {
    setActiveSection("security");
    setActiveSecurityPanel(panel);
    setSecurityMenuOpen(false);
  }

  function handleOpenLogSession(sessionId: string) {
    setSelectedLogSessionId(sessionId);
    setSelectedLogEventId(null);
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

  function handleSaveCoreFile() {
    if (!selectedCoreFile) {
      return;
    }
    toast.success(`${selectedCoreFile.title} 已保存。`);
  }

  function handleToggleTool(scope: CapabilityScope, id: string, checked: boolean) {
    setCapabilityConfig((current) => ({
      ...current,
      tools: toggleScopedEnabledCollection(current.tools, scope, id, checked),
    }));
  }

  function handleDeleteTool(scope: CapabilityScope, id: string) {
    setCapabilityConfig((current) => ({
      ...current,
      tools: deleteScopedCollectionItem(current.tools, scope, id),
    }));
    toast.success("工具已删除。");
  }

  function handleOpenToolConfigDialog() {
    setToolConfigDialogOpen(true);
  }

  function handleOpenSkillConfigDialog() {
    setSkillConfigDialogOpen(true);
  }

  function handleOpenKnowledgeConfigDialog() {
    setKnowledgeConfigDialogOpen(true);
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
    const { items } = mergeClawKnowledgeSelections(capabilityConfig.knowledge.claw, selections);

    setCapabilityConfig((current) => ({
      ...current,
      knowledge: {
        ...current.knowledge,
        claw: items,
      },
    }));

    setKnowledgeScope("claw");
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
    toast.success("技能已删除。");
  }

  function handleToggleKnowledge(scope: KnowledgeScope, id: string, enabled: boolean) {
    setCapabilityConfig((current) => ({
      ...current,
      knowledge: toggleScopedEnabledCollection(current.knowledge, scope, id, enabled),
    }));
    toast.success(enabled ? "知识已启用。" : "知识已停用。");
  }

  function handleDeleteKnowledge(scope: KnowledgeScope, id: string) {
    setCapabilityConfig((current) => ({
      ...current,
      knowledge: deleteScopedCollectionItem(current.knowledge, scope, id),
    }));
    toast.success("知识已删除。");
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
    if (detail.overview.publishStatus === "已发布") {
      toast.success(`${detail.overview.name} 已发布。`);
      return;
    }

    toast.success(`已发布：${detail.overview.name}`);
  }

  return (
    <div className="claw-detail-muted-theme flex h-full min-h-0 flex-col overflow-hidden">
      <section className="shrink-0 pb-2">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href="/claw-hub-next"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  aria-label="返回 Claw 列表"
                  title="返回"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>

                <div className="min-w-0 flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="truncate text-[30px] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[36px]">
                    {detail.overview.name}
                  </h1>
                  <Badge className={cn("rounded-full border px-3 py-1 text-xs font-medium", statusBadgeClassName)}>
                    {detail.overview.status}
                  </Badge>
                  <Badge className={cn("rounded-full border px-3 py-1 text-xs font-medium", publishBadgeClassName)}>
                    {detail.overview.publishStatus}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 pl-0">
                <p className="max-w-4xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                  {detail.overview.summary}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                    {detail.overview.updatedBy} 维护
                  </span>
                  <span>{detail.overview.creator} 创建</span>
                  <span>创建于 {detail.overview.createdAt}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-start xl:justify-end">
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-[4px] bg-blue-600 px-4 text-sm font-medium text-white shadow-none hover:bg-blue-700"
              onClick={handlePublish}
            >
              发布
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <Tabs
        value={activeSection}
        onValueChange={(value) => setActiveSection(value as DetailSectionKey)}
        className="min-h-0 flex-1 gap-0 overflow-hidden"
      >
        <div className="shrink-0 border-b border-slate-200/80 px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1 overflow-x-auto">
              <TabsList className="h-auto min-w-max gap-1 rounded-none bg-transparent p-0">
                {DETAIL_SECTION_ITEMS.map((item) => {
                  if (item.value === "logs") {
                    return (
                      <DropdownMenu key={item.value} open={logsMenuOpen} onOpenChange={setLogsMenuOpen} modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            title={item.label}
                            onClick={() => {
                              setActiveSection("logs");
                              openLogsMenu();
                            }}
                            onMouseEnter={openLogsMenu}
                            onMouseLeave={scheduleLogsMenuClose}
                            onFocus={openLogsMenu}
                            className={cn(
                              "inline-flex h-auto flex-none shrink-0 items-center gap-1 whitespace-nowrap rounded-none border-0 border-b-[3px] border-transparent bg-transparent px-3 py-4 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900",
                              activeSection === "logs" && "border-blue-600 font-semibold text-blue-600"
                            )}
                          >
                            <span>{item.label}</span>
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          side="bottom"
                          sideOffset={0}
                          onMouseEnter={openLogsMenu}
                          onMouseLeave={scheduleLogsMenuClose}
                          className="min-w-[168px] rounded-none border-slate-200 bg-white p-0 shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                        >
                          {LOG_PANEL_ITEMS.map((panel) => (
                            <DropdownMenuItem
                              key={panel.key}
                              onClick={() => handleSelectLogPanel(panel.key)}
                              className={cn(
                                "cursor-pointer rounded-none border-b border-slate-200 px-3 py-2.5 text-sm text-slate-600 last:border-b-0 focus:bg-blue-50 focus:text-blue-700",
                                activeSection === "logs" && activeLogPanel === panel.key && "bg-blue-50 font-medium text-blue-700"
                              )}
                            >
                              {panel.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }

                  if (item.value === "security") {
                    return (
                      <DropdownMenu key={item.value} open={securityMenuOpen} onOpenChange={setSecurityMenuOpen} modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            title={item.label}
                            onClick={() => {
                              setActiveSection("security");
                              openSecurityMenu();
                            }}
                            onMouseEnter={openSecurityMenu}
                            onMouseLeave={scheduleSecurityMenuClose}
                            onFocus={openSecurityMenu}
                            className={cn(
                              "inline-flex h-auto flex-none shrink-0 items-center gap-1 whitespace-nowrap rounded-none border-0 border-b-[3px] border-transparent bg-transparent px-3 py-4 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900",
                              activeSection === "security" && "border-blue-600 font-semibold text-blue-600"
                            )}
                          >
                            <span>{item.label}</span>
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          side="bottom"
                          sideOffset={0}
                          onMouseEnter={openSecurityMenu}
                          onMouseLeave={scheduleSecurityMenuClose}
                          className="min-w-[200px] rounded-none border-slate-200 bg-white p-0 shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                        >
                          {SECURITY_PANEL_ITEMS.map((panel) => (
                            <DropdownMenuItem
                              key={panel.key}
                              onClick={() => handleSelectSecurityPanel(panel.key)}
                              className={cn(
                                "cursor-pointer rounded-none border-b border-slate-200 px-3 py-2.5 text-sm text-slate-600 last:border-b-0 focus:bg-blue-50 focus:text-blue-700",
                                activeSection === "security" &&
                                  activeSecurityPanel === panel.key &&
                                  "bg-blue-50 font-medium text-blue-700"
                              )}
                            >
                              {panel.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }

                  return (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      title={item.label}
                      className="h-auto flex-none shrink-0 whitespace-nowrap rounded-none border-0 border-b-[3px] border-transparent bg-transparent px-3 py-4 text-sm font-medium text-slate-500 shadow-none transition-colors hover:text-slate-900 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                    >
                      {item.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <button
              type="button"
              onClick={() => setActiveSection("chat")}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 border-0 border-b-[3px] border-transparent bg-transparent px-3 py-4 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900",
                activeSection === "chat" && "border-blue-600 font-semibold text-blue-600"
              )}
            >
              <MessageSquareText className="h-4 w-4" />
              对话调试
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3 sm:px-6 sm:pt-4">
          <TabsContent value="chat" className="mt-0 h-full min-h-0 overflow-hidden">
            <div
              className={cn(
                "grid h-full min-h-0 overflow-hidden border border-blue-100 bg-white",
                chatSidebarCollapsed ? "xl:grid-cols-[72px_minmax(0,1fr)]" : "xl:grid-cols-[302px_minmax(0,1fr)]"
              )}
            >
              {chatSidebarCollapsed ? (
                <div className="flex min-h-0 flex-col border-b border-blue-100 bg-[linear-gradient(180deg,rgba(245,249,255,0.98),rgba(238,245,255,0.98))] xl:border-b-0 xl:border-r">
                  <div className="flex justify-center px-3 py-5">
                    <button
                      type="button"
                      onClick={() => setChatSidebarCollapsed(false)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-white text-slate-400 transition hover:border-blue-200 hover:text-slate-700"
                      aria-label="展开会话列表"
                      title="展开会话列表"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col items-center gap-3 px-3 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600">
                      <MessageSquareText className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-0 flex-col border-b border-blue-100 bg-[linear-gradient(180deg,rgba(249,251,255,0.98),rgba(243,248,255,0.98))] xl:border-b-0 xl:border-r">
                  <div className="border-b border-blue-100 px-5 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-slate-950">会话列表</h2>
                      </div>

                      <button
                        type="button"
                        onClick={() => setChatSidebarCollapsed(true)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-white text-slate-400 transition hover:border-blue-200 hover:text-slate-700"
                        aria-label="收起会话列表"
                        title="收起会话列表"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="mt-5 h-11 w-full justify-center rounded-lg border-blue-200 bg-white text-[15px] font-medium text-slate-700 shadow-none transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => toast.info("新建会话入口待接入。")}
                    >
                      <Plus className="h-4 w-4" />
                      新建会话
                    </Button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto py-2">
                    <div className="space-y-0.5">
                      {chatSessions.map((session) => {
                        const isActive = session.id === currentSession?.id;
                        const itemCount = session.messages.length;

                        return (
                          <button
                            key={session.id}
                            type="button"
                            onClick={() => handleSelectChatSession(session.id)}
                            className={cn(
                              "relative w-full border-l-[3px] px-5 py-4 text-left transition-colors",
                              isActive
                                ? "border-l-blue-600 bg-[linear-gradient(90deg,rgba(239,246,255,0.96),rgba(255,255,255,0.98))]"
                                : "border-l-transparent bg-transparent hover:bg-blue-50/70"
                            )}
                          >
                            <div className="truncate text-[15px] font-semibold leading-7 text-slate-900">
                              {session.preview || session.title}
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-slate-500">
                              <span>{session.updatedAt}</span>
                              <span className="shrink-0 text-slate-400">
                                {session.unreadCount > 0 ? session.unreadCount : itemCount}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <ClawInteractiveChatPanel
                key={currentSession?.id ?? detail.overview.id}
                detail={detail}
                session={currentSession}
                run={matchedConversationRun}
              />
            </div>
          </TabsContent>

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
            <SectionCard>
              {selectedCoreFile ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCoreFileKey(null)}>
                        <ArrowLeft className="h-4 w-4" />
                        返回
                      </Button>
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-slate-950">{selectedCoreFile.title}</div>
                        <div className="text-sm text-slate-500">{selectedCoreFile.note}</div>
                      </div>
                    </div>
                    <Button type="button" size="sm" onClick={handleSaveCoreFile}>
                      保存
                    </Button>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
                    <div className="mb-2 flex items-center justify-between px-1 text-xs text-slate-500">
                      <span>Markdown 编辑器</span>
                      <span>{coreFileDrafts[selectedCoreFile.key].split("\n").length} 行</span>
                    </div>
                    <Textarea
                      value={coreFileDrafts[selectedCoreFile.key]}
                      onChange={(event) =>
                        setCoreFileDrafts((current) => ({
                          ...current,
                          [selectedCoreFile.key]: event.target.value,
                        }))
                      }
                      className="min-h-[520px] resize-none rounded-md border-slate-200 bg-white px-4 py-3 font-mono text-[13px] leading-7 text-slate-700 shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
                  {detail.coreFiles.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5"
                    >
                      <div className="min-w-0 flex flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                        <span className="shrink-0 font-medium text-slate-950">{item.title}</span>
                        <span className="text-sm text-slate-500">{item.note}</span>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCoreFileKey(item.key)}>
                        编辑
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="tools" className="mt-0">
            <ClawCapabilitySection
              panel="tools"
              capabilityConfig={capabilityConfig}
              toolScope={toolScope}
              onToolScopeChange={setToolScope}
              skillScope={skillScope}
              onSkillScopeChange={setSkillScope}
              knowledgeScope={knowledgeScope}
              onKnowledgeScopeChange={setKnowledgeScope}
              onOpenToolConfigDialog={handleOpenToolConfigDialog}
              onOpenSkillConfigDialog={handleOpenSkillConfigDialog}
              onOpenKnowledgeConfigDialog={handleOpenKnowledgeConfigDialog}
              onToggleTool={handleToggleTool}
              onDeleteTool={handleDeleteTool}
              onToggleSkill={handleToggleSkill}
              onDeleteSkill={handleDeleteSkill}
              onToggleKnowledge={handleToggleKnowledge}
              onDeleteKnowledge={handleDeleteKnowledge}
            />
          </TabsContent>

          <TabsContent value="skills" className="mt-0">
            <ClawCapabilitySection
              panel="skills"
              capabilityConfig={capabilityConfig}
              toolScope={toolScope}
              onToolScopeChange={setToolScope}
              skillScope={skillScope}
              onSkillScopeChange={setSkillScope}
              knowledgeScope={knowledgeScope}
              onKnowledgeScopeChange={setKnowledgeScope}
              onOpenToolConfigDialog={handleOpenToolConfigDialog}
              onOpenSkillConfigDialog={handleOpenSkillConfigDialog}
              onOpenKnowledgeConfigDialog={handleOpenKnowledgeConfigDialog}
              onToggleTool={handleToggleTool}
              onDeleteTool={handleDeleteTool}
              onToggleSkill={handleToggleSkill}
              onDeleteSkill={handleDeleteSkill}
              onToggleKnowledge={handleToggleKnowledge}
              onDeleteKnowledge={handleDeleteKnowledge}
            />
          </TabsContent>

          <TabsContent value="knowledge" className="mt-0">
            <ClawCapabilitySection
              panel="knowledge"
              capabilityConfig={capabilityConfig}
              toolScope={toolScope}
              onToolScopeChange={setToolScope}
              skillScope={skillScope}
              onSkillScopeChange={setSkillScope}
              knowledgeScope={knowledgeScope}
              onKnowledgeScopeChange={setKnowledgeScope}
              onOpenToolConfigDialog={handleOpenToolConfigDialog}
              onOpenSkillConfigDialog={handleOpenSkillConfigDialog}
              onOpenKnowledgeConfigDialog={handleOpenKnowledgeConfigDialog}
              onToggleTool={handleToggleTool}
              onDeleteTool={handleDeleteTool}
              onToggleSkill={handleToggleSkill}
              onDeleteSkill={handleDeleteSkill}
              onToggleKnowledge={handleToggleKnowledge}
              onDeleteKnowledge={handleDeleteKnowledge}
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
                          <span>{selectedLogSession.userIdentity}</span>
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
                          <div className="mt-1 text-xs text-slate-500">按时间顺序展示 User、Agent、Skill 与工具事件</div>
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
                      <span>来源</span>
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
                                <div className="mt-1 truncate text-xs text-slate-400">{session.userIdentity}</div>
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
              activePanel={activeSecurityPanel}
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
      </Tabs>
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
                    placeholder="说明该 Agent 的能力、专长及在本 Claw 中的用途…"
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
    </div>
  );
}
