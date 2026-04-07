"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CircleHelp,
  ChevronRight,
  Clock3,
  FilePlus2,
  FileStack,
  FolderOpen,
  FolderPlus,
  Gauge,
  Mic,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Plus,
  RadioTower,
  SendHorizontal,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { ClawCapabilitySection } from "@/components/claw-hub-next/detail/capability-section";
import {
  CORE_FILE_ICONS,
  DETAIL_SECTION_ITEMS,
  LOG_PANEL_ITEMS,
  type CapabilityPanelKey,
  type DetailSectionKey,
  type LogPanelKey,
} from "@/components/claw-hub-next/detail/constants";
import { ClawResourceSection } from "@/components/claw-hub-next/detail/resource-section";
import { ClawSecuritySection } from "@/components/claw-hub-next/detail/security-section";
import { SectionCard } from "@/components/claw-hub-next/detail/section-card";
import {
  addLexiconLibrary,
  applyExecutionTier,
  applyRuntimeTier,
  buildInitialLexiconDrafts,
  deleteScopedCollectionItem,
  mergeClawSkillSelections,
  mergeClawToolSelections,
  removeLexiconLibrary,
  toggleScopedEnabledCollection,
  updateAutonomyBoundaryLevel,
  updateExecutionCapability,
  updateExecutionNumber,
  updateLexiconPolicyAction,
  updateLexiconPolicyEnabled,
  updateLexiconPolicyMode,
  updateRuntimeAdvancedNumber,
  updateRuntimeAdvancedText,
  updateRuntimeNumber,
  updateSecurityPolicyAction,
  updateSecurityPolicyEnabled,
  updateSecurityPolicyMode,
  updateSecurityPolicyRuleLevel,
} from "@/components/claw-hub-next/detail/state";
import { SkillConfigDialog, type SkillConfigSelection } from "@/components/claw-hub-next/skill-config-dialog";
import { ToolConfigDialog, type ToolConfigSelection } from "@/components/claw-hub-next/tool-config-dialog";
import {
  buildConversationSessionSummaries,
  cloneResourceConfig,
  formatDurationMs,
  getAuditStatusClassName,
  getAuditTypeClassName,
  getResourceValidation,
  getSecurityActionClassName,
  getSecurityLevelClassName,
  getTaskRunStatusClassName,
  getWorkspaceTrail,
} from "@/components/claw-hub-next/detail/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  CapabilityScope,
  ClawCoreFileKey,
  ClawDetailData,
  KnowledgeScope,
  ResourceConfig,
} from "@/lib/mock/claw-hub-next";
import { createDefaultResourceConfig } from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";

export function ClawDetailWorkbench({ detail }: { detail: ClawDetailData }) {
  const [activeSection, setActiveSection] = useState<DetailSectionKey>("chat");
  const [activeLogPanel, setActiveLogPanel] = useState<LogPanelKey>("conversation");
  const [conversationHistoryCollapsed, setConversationHistoryCollapsed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatSessions, setChatSessions] = useState(detail.chatSessions);
  const [conversationRuns, setConversationRuns] = useState(detail.conversationRuns);
  const [securityManagement, setSecurityManagement] = useState(detail.securityManagement);
  const [lexiconDrafts, setLexiconDrafts] = useState<Record<string, string>>(() =>
    buildInitialLexiconDrafts(detail.securityManagement)
  );
  const [selectedChatId, setSelectedChatId] = useState(detail.chatSessions[0]?.id ?? "");
  const [selectedConversationAuditMessageId, setSelectedConversationAuditMessageId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [queuedFiles, setQueuedFiles] = useState<string[]>([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [selectedCoreFileKey, setSelectedCoreFileKey] = useState<ClawCoreFileKey | null>(null);
  const [capabilityConfig, setCapabilityConfig] = useState(detail.capabilityConfig);
  const [resourceConfig, setResourceConfig] = useState<ResourceConfig>(() => cloneResourceConfig(detail.resourceConfig));
  const [activeCapabilityPanel, setActiveCapabilityPanel] = useState<CapabilityPanelKey>("tools");
  const [toolConfigDialogOpen, setToolConfigDialogOpen] = useState(false);
  const [skillConfigDialogOpen, setSkillConfigDialogOpen] = useState(false);
  const [toolScope, setToolScope] = useState<CapabilityScope>("platform");
  const [skillScope, setSkillScope] = useState<CapabilityScope>("platform");
  const [agentScope, setAgentScope] = useState<CapabilityScope>("platform");
  const [knowledgeScope, setKnowledgeScope] = useState<KnowledgeScope>("tenant");
  const [runtimeAdvancedOpen, setRuntimeAdvancedOpen] = useState(false);
  const [workspacePath, setWorkspacePath] = useState<string[]>([]);
  const [coreFileDrafts, setCoreFileDrafts] = useState<Record<ClawCoreFileKey, string>>(() =>
    detail.coreFiles.reduce(
      (accumulator, file) => ({ ...accumulator, [file.key]: file.content }),
      { identity: "", soul: "", memory: "", heartbeat: "" }
    )
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentSession = chatSessions.find((session) => session.id === selectedChatId) ?? chatSessions[0];
  const currentConversationRun = conversationRuns.find((session) => session.id === selectedChatId) ?? conversationRuns[0];
  const conversationSessionSummaries = buildConversationSessionSummaries(chatSessions, conversationRuns);
  const currentConversationSummary =
    conversationSessionSummaries.find((session) => session.session.id === currentConversationRun?.id) ??
    conversationSessionSummaries[0];
  const currentConversationMessages = currentConversationSummary?.messages ?? [];
  const selectedConversationAuditMessage =
    currentConversationMessages.find(
      (message) => message.id === selectedConversationAuditMessageId && message.auditRecords.length > 0
    ) ?? null;
  const selectedCoreFile = detail.coreFiles.find((file) => file.key === selectedCoreFileKey) ?? null;
  const workspaceTrail = getWorkspaceTrail(detail.workspaceRoot, workspacePath);
  const currentWorkspaceFolder = workspaceTrail[workspaceTrail.length - 1];
  const resourceValidation = getResourceValidation(resourceConfig);
  const enabledSecurityPolicies = securityManagement.strategyPolicies.filter((policy) => policy.enabled).length;
  const approvalBoundaryCount = securityManagement.autonomyBoundaries.filter((item) => item.level === "L3 审批").length;
  const activeLexiconBindingCount = securityManagement.lexiconPolicies.reduce(
    (total, policy) => total + policy.selectedLibraries.length,
    0
  );

  function handleQueueFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).map((file) => file.name);
    if (!files.length) {
      return;
    }

    setQueuedFiles((current) => [...current, ...files]);
    toast.success(`已加入 ${files.length} 个文件。`);
    event.target.value = "";
  }

  function handleToggleVoice() {
    setVoiceMode((current) => {
      const next = !current;
      toast.success(next ? "已切换到语音输入模式。" : "已退出语音输入模式。");
      return next;
    });
  }

  function handleRemoveQueuedFile(fileName: string) {
    setQueuedFiles((current) => current.filter((item) => item !== fileName));
  }

  function handleSelectChatSession(sessionId: string) {
    setSelectedChatId(sessionId);
    setSelectedConversationAuditMessageId(null);
    setChatSessions((current) =>
      current.map((item) => (item.id === sessionId ? { ...item, unreadCount: 0 } : item))
    );
  }

  function handleSendMessage() {
    if (!currentSession) {
      return;
    }

    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage && !queuedFiles.length && !voiceMode) {
      toast.info("先输入消息、开启语音或上传文件。");
      return;
    }

    const userContent = trimmedMessage || (voiceMode ? "请基于这段语音继续处理当前事项。" : "请先处理我刚刚上传的文件。");

    const assistantContent = [
      queuedFiles.length ? `已收到 ${queuedFiles.join("、")}，我会先解析附件内容。` : "",
      voiceMode ? "语音输入入口已接入，后续会先完成转写再继续分析。" : "",
      trimmedMessage ? "当前消息已进入会话上下文，我会继续根据现有线索推进处理。" : "",
    ]
      .filter(Boolean)
      .join("\n");
    const now = Date.now();
    const traceId = `trace-live-${now}`;
    const newTurnId = `${currentSession.id}-turn-${now}`;

    setChatSessions((current) => {
      const updated = current.map((session) => {
        if (session.id !== currentSession.id) {
          return session;
        }

        return {
          ...session,
          updatedAt: "刚刚",
          unreadCount: 0,
          preview: trimmedMessage || (queuedFiles.length ? `已上传 ${queuedFiles.length} 个文件` : "已发送语音输入"),
          messages: [
            ...session.messages,
            {
              id: `${session.id}-user-${now}`,
              role: "user" as const,
              sender: "你",
              time: "刚刚",
              content: userContent,
              attachments: queuedFiles.length ? queuedFiles : undefined,
            },
            {
              id: `${session.id}-assistant-${now}`,
              role: "assistant" as const,
              sender: detail.overview.name,
              time: "刚刚",
              content: assistantContent || "已收到，我继续处理。",
              auditTurnId: queuedFiles.length || voiceMode ? newTurnId : undefined,
            },
          ],
        };
      });

      const active = updated.find((session) => session.id === currentSession.id);
      return active ? [active, ...updated.filter((session) => session.id !== currentSession.id)] : updated;
    });

    setConversationRuns((current) => {
      const auditRecords = [
        queuedFiles.length
          ? {
              id: `${currentSession.id}-audit-upload-${now}`,
              turnId: newTurnId,
              type: "工具执行" as const,
              targetName: "附件解析器",
              inputSummary: `接收 ${queuedFiles.length} 个附件并提取结构化内容。`,
              outputSummary: "附件内容已写入当前会话上下文。",
              durationMs: 420,
              status: "成功" as const,
              traceId,
            }
          : null,
        voiceMode
          ? {
              id: `${currentSession.id}-audit-voice-${now}`,
              turnId: newTurnId,
              type: "工具执行" as const,
              targetName: "语音转写",
              inputSummary: "转写当前语音输入并生成文本草稿。",
              outputSummary: "语音内容已完成转写并合入当前轮次。",
              durationMs: 680,
              status: "成功" as const,
              traceId,
            }
          : null,
      ].filter((item): item is NonNullable<typeof item> => Boolean(item));

      const nextTurn = {
        id: newTurnId,
        turnNumber: (current.find((item) => item.id === currentSession.id)?.turns.length ?? 0) + 1,
        occurredAt: "刚刚",
        userInput: userContent,
        assistantOutput: assistantContent || "已收到，我继续处理。",
        attachments: queuedFiles.length ? queuedFiles : undefined,
        traceId,
        auditRecords,
      };

      const matched = current.find((item) => item.id === currentSession.id);
      if (!matched) {
        return [
          {
            id: currentSession.id,
            title: currentSession.title,
            channel: currentSession.source,
            userIdentity: "你",
            sessionId: currentSession.id,
            traceId,
            startedAt: "刚刚",
            updatedAt: "刚刚",
            turns: [nextTurn],
          },
          ...current,
        ];
      }

      const updated = current.map((item) =>
        item.id === currentSession.id
          ? {
              ...item,
              updatedAt: "刚刚",
              traceId,
              turns: [...item.turns, nextTurn],
            }
          : item
      );
      const active = updated.find((item) => item.id === currentSession.id);
      return active ? [active, ...updated.filter((item) => item.id !== currentSession.id)] : updated;
    });

    setDraftMessage("");
    setQueuedFiles([]);
    setVoiceMode(false);
    setSelectedConversationAuditMessageId(null);
  }

  function handleAutonomyBoundaryLevelChange(
    boundaryId: string,
    nextLevel: ClawDetailData["securityManagement"]["autonomyBoundaries"][number]["level"]
  ) {
    setSecurityManagement((current) => updateAutonomyBoundaryLevel(current, boundaryId, nextLevel));
  }

  function handleToggleSecurityPolicy(policyId: string, enabled: boolean) {
    setSecurityManagement((current) => updateSecurityPolicyEnabled(current, policyId, enabled));
  }

  function handleSecurityPolicyModeChange(
    policyId: string,
    mode: ClawDetailData["securityManagement"]["strategyPolicies"][number]["mode"]
  ) {
    setSecurityManagement((current) => updateSecurityPolicyMode(current, policyId, mode));
  }

  function handleSecurityPolicyActionChange(
    policyId: string,
    action: ClawDetailData["securityManagement"]["strategyPolicies"][number]["availableActions"][number]
  ) {
    setSecurityManagement((current) => updateSecurityPolicyAction(current, policyId, action));
  }

  function handleSecurityPolicyRuleLevelChange(
    policyId: string,
    ruleId: string,
    level: ClawDetailData["securityManagement"]["strategyPolicies"][number]["rules"][number]["level"]
  ) {
    setSecurityManagement((current) => updateSecurityPolicyRuleLevel(current, policyId, ruleId, level));
  }

  function handleToggleLexiconPolicy(policyId: string, enabled: boolean) {
    setSecurityManagement((current) => updateLexiconPolicyEnabled(current, policyId, enabled));
  }

  function handleLexiconPolicyModeChange(
    policyId: string,
    mode: ClawDetailData["securityManagement"]["lexiconPolicies"][number]["mode"]
  ) {
    setSecurityManagement((current) => updateLexiconPolicyMode(current, policyId, mode));
  }

  function handleLexiconPolicyActionChange(
    policyId: string,
    action: ClawDetailData["securityManagement"]["lexiconPolicies"][number]["availableActions"][number]
  ) {
    setSecurityManagement((current) => updateLexiconPolicyAction(current, policyId, action));
  }

  function handleLexiconDraftChange(policyId: string, value: string) {
    setLexiconDrafts((current) => ({
      ...current,
      [policyId]: value,
    }));
  }

  function handleAddLexiconLibrary(policyId: string) {
    const selectedLibrary = lexiconDrafts[policyId];
    if (!selectedLibrary) {
      return;
    }

    const result = addLexiconLibrary(securityManagement, policyId, selectedLibrary);
    setSecurityManagement(result.config);
    setLexiconDrafts((current) => ({
      ...current,
      [policyId]: result.nextDraft,
    }));

    if (!result.added) {
      return;
    }

    toast.success("词库已加入当前策略。");
  }

  function handleRemoveLexiconLibrary(policyId: string, libraryName: string) {
    setSecurityManagement((current) => removeLexiconLibrary(current, policyId, libraryName));
    setLexiconDrafts((current) => ({
      ...current,
      [policyId]: current[policyId] || libraryName,
    }));
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

  function handleConfirmToolConfig(selections: ToolConfigSelection[]) {
    const { items, addedCount, reenabledCount } = mergeClawToolSelections(capabilityConfig.tools.claw, selections);

    setCapabilityConfig((current) => ({
      ...current,
      tools: {
        ...current.tools,
        claw: items,
      },
    }));

    setToolScope("claw");
    setToolConfigDialogOpen(false);

    if (addedCount > 0 && reenabledCount > 0) {
      toast.success(`已新增 ${addedCount} 个工具，并重新启用 ${reenabledCount} 个已有工具。`);
      return;
    }

    if (addedCount > 0) {
      toast.success(`已新增 ${addedCount} 个工具到 Claw配置。`);
      return;
    }

    if (reenabledCount > 0) {
      toast.success(`已重新启用 ${reenabledCount} 个已有工具。`);
      return;
    }

    toast.info("所选工具已存在于 Claw配置中。");
  }

  function handleConfirmSkillConfig(selections: SkillConfigSelection[]) {
    const { items, addedCount, reenabledCount } = mergeClawSkillSelections(capabilityConfig.skills.claw, selections);

    setCapabilityConfig((current) => ({
      ...current,
      skills: {
        ...current.skills,
        claw: items,
      },
    }));

    setSkillScope("claw");
    setSkillConfigDialogOpen(false);

    if (addedCount > 0 && reenabledCount > 0) {
      toast.success(`已新增 ${addedCount} 个技能，并重新启用 ${reenabledCount} 个已有技能。`);
      return;
    }

    if (addedCount > 0) {
      toast.success(`已新增 ${addedCount} 个技能到 Claw配置。`);
      return;
    }

    if (reenabledCount > 0) {
      toast.success(`已重新启用 ${reenabledCount} 个已有技能。`);
      return;
    }

    toast.info("所选技能已存在于 Claw配置中。");
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

  function handleToggleAgent(scope: CapabilityScope, id: string, enabled: boolean) {
    setCapabilityConfig((current) => ({
      ...current,
      agents: toggleScopedEnabledCollection(current.agents, scope, id, enabled),
    }));
    toast.success(enabled ? "Agent 已启用。" : "Agent 已停用。");
  }

  function handleDeleteAgent(scope: CapabilityScope, id: string) {
    setCapabilityConfig((current) => ({
      ...current,
      agents: deleteScopedCollectionItem(current.agents, scope, id),
    }));
    toast.success("Agent 已删除。");
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

  function handleRuntimeTierChange(tier: ResourceConfig["runtime"]["tier"]) {
    setResourceConfig((current) => applyRuntimeTier(current, tier));
  }

  function handleExecutionTierChange(tier: ResourceConfig["execution"]["tier"]) {
    setResourceConfig((current) => applyExecutionTier(current, tier));
  }

  function handleRuntimeNumberChange(field: "maxConcurrentTasks" | "maxTaskDurationMin", value: string) {
    setResourceConfig((current) => updateRuntimeNumber(current, field, value));
  }

  function handleRuntimeAdvancedNumberChange(field: "cpu" | "memoryGb" | "diskGb" | "startupTimeoutSec", value: string) {
    setResourceConfig((current) => updateRuntimeAdvancedNumber(current, field, value));
  }

  function handleRuntimeAdvancedTextChange(value: string) {
    setResourceConfig((current) => updateRuntimeAdvancedText(current, value));
  }

  function handleExecutionNumberChange(
    field: "workspaceDiskGb" | "maxConcurrentExecutions" | "maxExecutionTimeoutMin",
    value: string
  ) {
    setResourceConfig((current) => updateExecutionNumber(current, field, value));
  }

  function handleExecutionCapabilityChange(key: keyof ResourceConfig["execution"]["capabilities"], checked: boolean) {
    setResourceConfig((current) => updateExecutionCapability(current, key, checked));
  }

  function handleResetResourceConfig() {
    setResourceConfig(cloneResourceConfig(detail.resourceConfig ?? createDefaultResourceConfig()));
    setRuntimeAdvancedOpen(false);
    toast.success("资源配置已恢复默认。");
  }

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/claw-hub-next"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Link>
            <div className="hidden h-5 w-px bg-slate-200 sm:block" />
            <h1 className="min-w-0 truncate text-xl font-semibold text-slate-950 sm:text-2xl">
              {detail.overview.name}
            </h1>
          </div>

          <div className="text-sm text-slate-500">
            最新更新时间
            <span className="ml-2 font-medium text-slate-900">{detail.overview.updatedAt}</span>
          </div>
        </div>
      </section>

      <Tabs
        value={activeSection}
        onValueChange={(value) => setActiveSection(value as DetailSectionKey)}
        className="flex flex-col gap-5 xl:flex-row xl:items-start"
      >
        <aside
          className={cn(
            "group relative shrink-0 rounded-[24px] border border-sky-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.92),rgba(248,250,252,0.96))] p-1 shadow-sm shadow-sky-100/40 transition-all duration-200 xl:sticky xl:top-0",
            sidebarCollapsed ? "xl:w-[72px]" : "xl:w-[178px]"
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={sidebarCollapsed ? "展开侧边导航" : "收起侧边导航"}
            aria-label={sidebarCollapsed ? "展开侧边导航" : "收起侧边导航"}
            className="absolute right-2 top-2 z-10 hidden size-7 rounded-full border border-transparent bg-white/55 text-slate-400 opacity-55 shadow-none backdrop-blur-sm transition-all hover:border-sky-100 hover:bg-white hover:text-sky-700 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-90 xl:inline-flex"
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
          </Button>

          <TabsList className="grid h-auto w-full gap-1 bg-transparent p-0">
            {DETAIL_SECTION_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  title={item.label}
                  className={cn(
                    "h-auto rounded-[16px] border border-transparent py-2.5 text-left text-[13px] font-semibold tracking-[0.01em] text-slate-600 transition-all data-[state=active]:border-sky-200 data-[state=active]:bg-white data-[state=active]:text-sky-700 data-[state=active]:shadow-[0_10px_24px_-16px_rgba(14,116,144,0.45)]",
                    "justify-start gap-2 px-2.5 hover:bg-white/80 hover:text-slate-900",
                    !sidebarCollapsed && "pr-8",
                    sidebarCollapsed && "xl:mx-auto xl:size-11 xl:justify-center xl:rounded-[14px] xl:px-0 xl:py-0"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={cn(sidebarCollapsed && "xl:hidden")}>{item.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </aside>

        <div className="min-w-0 flex-1">
          <TabsContent value="chat" className="mt-0">
            <Card className="overflow-hidden rounded-[30px] border-slate-200 bg-white py-0 shadow-sm">
              <div className="grid min-h-[760px] xl:grid-cols-[286px_minmax(0,1fr)]">
                <div className="border-b border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.92))] xl:border-b-0 xl:border-r">
                  <div className="border-b border-slate-200/80 px-4 py-4">
                    <div className="text-lg font-semibold text-slate-950">对话</div>
                    <div className="mt-3 rounded-[22px] border border-sky-100 bg-white/90 p-3 shadow-sm shadow-sky-100/40">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]" />
                        <span className="text-sm font-semibold text-slate-900">
                          {currentSession?.title ?? "默认会话"}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        已连接 · {currentSession?.messages.length ?? 0} 条消息
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-3">
                    <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      历史会话
                    </div>
                    <div className="space-y-2">
                      {chatSessions.map((session) => {
                        const isActive = session.id === currentSession?.id;

                        return (
                          <button
                            key={session.id}
                            type="button"
                            onClick={() => handleSelectChatSession(session.id)}
                            className={cn(
                              "w-full rounded-[20px] border px-3 py-3 text-left transition-all",
                              isActive
                                ? "border-sky-200 bg-white shadow-sm shadow-sky-100/60"
                                : "border-transparent bg-white/60 hover:border-slate-200 hover:bg-white"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-900">{session.title}</div>
                                <div className="mt-1 truncate text-xs text-slate-500">{session.source}</div>
                              </div>
                              {session.unreadCount > 0 ? (
                                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-sky-100 px-1.5 py-0.5 text-[11px] font-semibold text-sky-700">
                                  {session.unreadCount}
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">{session.preview}</div>
                            <div className="mt-3 text-[11px] text-slate-400">{session.updatedAt}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex min-h-[760px] flex-col bg-[radial-gradient(circle_at_top,rgba(240,249,255,0.55),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))]">
                  <div className="border-b border-slate-200/90 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-slate-950">{currentSession?.source ?? "当前会话"}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          最近更新 {currentSession?.updatedAt ?? "--"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className="border-sky-100 bg-sky-50 text-sky-700">
                          {currentSession?.messages.length ?? 0} 条消息
                        </Badge>
                        <Badge className="border-slate-200 bg-white text-slate-600">{detail.overview.type}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                    {currentSession?.messages.map((message) => {
                      if (message.role === "tool") {
                        return (
                          <div
                            key={message.id}
                            className="rounded-[22px] border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-950"
                          >
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-amber-500">
                                T
                              </span>
                              {message.toolLabel ?? "Tool"}
                            </div>
                            <div className="mt-3 whitespace-pre-line font-mono text-[13px] leading-6 text-amber-900/90">
                              {message.content}
                            </div>
                          </div>
                        );
                      }

                      const isUser = message.role === "user";

                      return (
                        <div key={message.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                          <div className={cn("flex max-w-[88%] flex-col space-y-2", isUser && "items-end")}>
                            <div
                              className={cn(
                                "flex items-center gap-2 text-xs text-slate-400",
                                isUser ? "justify-end" : "justify-start"
                              )}
                            >
                              <span>{message.sender}</span>
                              <span>{message.time}</span>
                            </div>

                            <div
                              className={cn(
                                "rounded-[24px] px-4 py-3 text-sm leading-7 shadow-sm",
                                isUser
                                  ? "bg-slate-950 text-white shadow-slate-200"
                                  : "border border-slate-200 bg-white text-slate-700"
                              )}
                            >
                              <div className="whitespace-pre-line">{message.content}</div>
                              {message.attachments?.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {message.attachments.map((attachment) => (
                                    <span
                                      key={`${message.id}-${attachment}`}
                                      className={cn(
                                        "inline-flex items-center rounded-full px-3 py-1 text-xs",
                                        isUser ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"
                                      )}
                                    >
                                      {attachment}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-200/90 bg-white/90 px-5 py-4 backdrop-blur-sm">
                    {queuedFiles.length || voiceMode ? (
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        {queuedFiles.map((file) => (
                          <button
                            key={file}
                            type="button"
                            onClick={() => handleRemoveQueuedFile(file)}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-100"
                          >
                            {file}
                          </button>
                        ))}
                        {voiceMode ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                            <span className="h-2 w-2 rounded-full bg-sky-500" />
                            语音输入已开启
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-3 shadow-inner shadow-slate-100">
                      <Textarea
                        value={draftMessage}
                        onChange={(event) => setDraftMessage(event.target.value)}
                        placeholder="输入消息，或通过下方语音 / 文件入口继续补充上下文..."
                        className="min-h-[108px] resize-none border-0 bg-transparent px-1 py-1 text-sm leading-7 shadow-none focus-visible:ring-0"
                      />

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleQueueFiles}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full bg-white"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Paperclip className="h-4 w-4" />
                            上传文件
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn("rounded-full bg-white", voiceMode && "border-sky-200 bg-sky-50 text-sky-700")}
                            onClick={handleToggleVoice}
                          >
                            <Mic className="h-4 w-4" />
                            语音
                          </Button>
                        </div>

                        <Button type="button" className="rounded-full px-5" onClick={handleSendMessage}>
                          <SendHorizontal className="h-4 w-4" />
                          发送
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="mt-0">
            <SectionCard title="状态" description="当前 Agent 的基础信息。">
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
            <SectionCard title="核心文件" description="当前 Claw 的核心文件由 identity、Soul、memory 和 heartbeat 组成。">
              {selectedCoreFile ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCoreFileKey(null)}>
                        <ArrowLeft className="h-4 w-4" />
                        返回
                      </Button>

                      <div className="min-w-0">
                        <div className="truncate text-lg font-semibold text-slate-950">
                          {selectedCoreFile.title} - {selectedCoreFile.note}
                        </div>
                        <div className="mt-2 text-sm leading-7 text-slate-600">{selectedCoreFile.description}</div>
                        {selectedCoreFile.tags?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedCoreFile.tags.map((tag) => (
                              <Badge key={`${selectedCoreFile.key}-${tag}`} className="border-sky-100 bg-sky-50 text-sky-700">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="border-slate-200 bg-white text-slate-600">{selectedCoreFile.sizeLabel}</Badge>
                      <Button type="button" onClick={handleSaveCoreFile}>
                        保存
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,0.98))] p-3 shadow-sm shadow-slate-100">
                    <div className="mb-3 flex items-center justify-between px-2 text-xs text-slate-500">
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
                      className="min-h-[620px] resize-none rounded-[22px] border-slate-200 bg-white px-5 py-4 font-mono text-[13px] leading-7 text-slate-700 shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {detail.coreFiles.map((item) => {
                    const Icon = CORE_FILE_ICONS[item.key];

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSelectedCoreFileKey(item.key)}
                        className="rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.88),rgba(255,255,255,0.98))] p-5 text-left transition-all hover:border-sky-200 hover:bg-sky-50/60 hover:shadow-sm hover:shadow-sky-100/60"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-sky-100 bg-white text-sky-700 shadow-sm shadow-sky-100/50">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-lg font-semibold text-slate-950">{item.title}</div>
                              <div className="mt-1 text-sm text-slate-500">{item.note}</div>
                            </div>
                          </div>

                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                            编辑
                          </span>
                        </div>

                        <div className="mt-4 text-sm leading-7 text-slate-600">{item.description}</div>

                        {item.tags?.length ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {item.tags.map((tag) => (
                              <Badge key={`${item.key}-${tag}`} className="border-sky-100 bg-sky-50 text-sky-700">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
                          <span>{item.sizeLabel}</span>
                          <span>点击展开 Markdown 编辑器</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="capability" className="mt-0">
            <ClawCapabilitySection
              capabilityConfig={capabilityConfig}
              activeCapabilityPanel={activeCapabilityPanel}
              onActiveCapabilityPanelChange={setActiveCapabilityPanel}
              toolScope={toolScope}
              onToolScopeChange={setToolScope}
              skillScope={skillScope}
              onSkillScopeChange={setSkillScope}
              agentScope={agentScope}
              onAgentScopeChange={setAgentScope}
              knowledgeScope={knowledgeScope}
              onKnowledgeScopeChange={setKnowledgeScope}
              onOpenToolConfigDialog={handleOpenToolConfigDialog}
              onOpenSkillConfigDialog={handleOpenSkillConfigDialog}
              onToggleTool={handleToggleTool}
              onDeleteTool={handleDeleteTool}
              onToggleSkill={handleToggleSkill}
              onDeleteSkill={handleDeleteSkill}
              onToggleAgent={handleToggleAgent}
              onDeleteAgent={handleDeleteAgent}
              onToggleKnowledge={handleToggleKnowledge}
              onDeleteKnowledge={handleDeleteKnowledge}
            />
          </TabsContent>

          <TabsContent value="channels" className="mt-0">
            <SectionCard title="渠道与分发" description="配置当前 OpenClaw 在哪些 IM 渠道进行分发。">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-500">
                  当前共接入
                  <span className="mx-2 font-semibold text-slate-950">
                    {detail.distributionChannels.filter((item) => item.status === "已接入").length}
                  </span>
                  个渠道
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.success("已预留接入新渠道的入口。")}>
                  <Plus className="h-4 w-4" />
                  接入新渠道
                </Button>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {detail.distributionChannels.map((channel) => {
                  const isConnected = channel.status === "已接入";

                  return (
                    <div
                      key={channel.name}
                      className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 transition-colors hover:border-sky-100 hover:bg-sky-50/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-lg font-semibold text-slate-950">{channel.name}</div>
                          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                            <span
                              className={cn(
                                "h-2.5 w-2.5 rounded-full",
                                isConnected ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" : "bg-slate-300"
                              )}
                            />
                            {channel.status}
                          </div>
                        </div>

                        <div
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-2xl border",
                            isConnected
                              ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                              : "border-slate-200 bg-white text-slate-400"
                          )}
                        >
                          <RadioTower className="h-[18px] w-[18px]" />
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">APP ID</div>
                          <div className="mt-2 text-sm font-medium text-slate-900">{channel.appId}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Secret ID
                          </div>
                          <div className="mt-2 font-mono text-sm text-slate-900">{channel.secretIdMasked}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="tasks" className="mt-0">
            <SectionCard title="任务" description="当前 Claw 的任务分为定时任务、催办任务和条件触发任务。">
              <div className="grid gap-4 xl:grid-cols-3">
                {detail.taskGroups.map((group) => (
                  <div key={group.title} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700">
                        <Clock3 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-slate-950">{group.title}</div>
                        <div className="mt-1 text-sm text-slate-600">{group.description}</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {group.tasks.map((task) => (
                        <div key={`${group.title}-${task.name}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-900">{task.name}</div>
                            <Badge className="border-slate-200 bg-slate-100 text-slate-700">{task.status}</Badge>
                          </div>
                          <div className="mt-2 text-sm text-slate-600">触发方式：{task.trigger}</div>
                          <div className="mt-3 text-sm leading-7 text-slate-600">{task.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="workspace" className="mt-0">
            <SectionCard title="工作空间" description="工作空间中的内容就是普通文件夹。">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-500">
                    {workspaceTrail.map((folder, index) => (
                      <div key={folder.id} className="flex items-center gap-2">
                        {index > 0 ? <ChevronRight className="h-4 w-4 text-slate-300" /> : null}
                        <button
                          type="button"
                          onClick={() => setWorkspacePath(workspaceTrail.slice(1, index + 1).map((item) => item.id))}
                          className={cn(
                            "rounded-md px-1 py-0.5 transition-colors",
                            index === workspaceTrail.length - 1
                              ? "font-medium text-slate-900"
                              : "hover:bg-slate-100 hover:text-slate-900"
                          )}
                        >
                          {folder.name}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => toast.success("已预留上传入口。")}>
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toast.success("已预留新建文件夹入口。")}
                    >
                      <FolderPlus className="h-4 w-4" />
                      新建文件夹
                    </Button>
                    <Button type="button" size="sm" onClick={() => toast.success("已预留新建文件入口。")}>
                      <FilePlus2 className="h-4 w-4" />
                      新建文件
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {currentWorkspaceFolder.children.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => setWorkspacePath((current) => [...current, folder.id])}
                      className="flex w-full items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50/60 px-4 py-5 text-left transition-all hover:border-sky-200 hover:bg-white"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FolderOpen className="h-[18px] w-[18px] shrink-0 text-slate-400" />
                        <div className="truncate text-sm font-medium text-slate-900">{folder.name}</div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{folder.children.length} 项</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </button>
                  ))}

                  {currentWorkspaceFolder.children.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center text-sm text-slate-500">
                      当前目录为空
                    </div>
                  ) : null}
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="logs" className="mt-0">
            <div className="space-y-4">
              <TooltipProvider delayDuration={120}>
                <div className="flex flex-wrap gap-2">
                  {LOG_PANEL_ITEMS.map((panel) => (
                    <button
                      key={panel.key}
                      type="button"
                      onClick={() => setActiveLogPanel(panel.key)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                        activeLogPanel === panel.key
                          ? "border-sky-200 bg-sky-50 text-sky-700 shadow-sm"
                          : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                      )}
                    >
                      <span>{panel.label}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              "inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition-colors",
                              activeLogPanel === panel.key ? "text-sky-500" : "text-slate-400"
                            )}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <CircleHelp className="h-3.5 w-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[280px] text-xs leading-6">
                          {panel.description}
                        </TooltipContent>
                      </Tooltip>
                    </button>
                  ))}
                </div>
              </TooltipProvider>

              {activeLogPanel === "conversation" ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full bg-white/90"
                      onClick={() => setConversationHistoryCollapsed((current) => !current)}
                    >
                      {conversationHistoryCollapsed ? (
                        <PanelLeftOpen className="h-4 w-4" />
                      ) : (
                        <PanelLeftClose className="h-4 w-4" />
                      )}
                      {conversationHistoryCollapsed ? "展开会话历史" : "收起会话历史"}
                    </Button>

                    {!conversationHistoryCollapsed ? (
                      <div className="text-sm text-slate-500">{conversationRuns.length} 条会话记录</div>
                    ) : null}
                  </div>

                  <div
                    className={cn(
                      "grid gap-4",
                      conversationHistoryCollapsed ? "xl:grid-cols-[minmax(0,1fr)]" : "xl:grid-cols-[280px_minmax(0,1fr)]"
                    )}
                  >
                    {!conversationHistoryCollapsed ? (
                      <div className="flex min-h-0 flex-col rounded-[24px] border border-slate-200 bg-white/90 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                              <MessageSquareText className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-base font-semibold text-slate-950">会话历史</div>
                              <div className="mt-1 text-sm text-slate-500">{conversationRuns.length} 条记录</div>
                            </div>
                          </div>
                          <Badge className="border-slate-200 bg-white text-slate-600">{conversationRuns.length}</Badge>
                        </div>

                        <ScrollArea className="mt-4 h-[760px] pr-3">
                          <div className="space-y-2 pr-4">
                            {conversationSessionSummaries.map((summary) => (
                              <button
                                key={summary.session.id}
                                type="button"
                                onClick={() => handleSelectChatSession(summary.session.id)}
                                className={cn(
                                  "w-full rounded-[20px] border px-4 py-4 text-left transition-all",
                                  currentConversationRun?.id === summary.session.id
                                    ? "border-sky-200 bg-sky-50/70 shadow-sm shadow-sky-100/70"
                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-slate-900">
                                      {summary.session.title}
                                    </div>
                                    <div className="mt-1 truncate text-xs text-slate-500">
                                      {summary.linkedChatSession?.source ?? summary.session.channel}
                                    </div>
                                  </div>
                                  <Badge className="border-slate-200 bg-white text-slate-600">
                                    {summary.messages.length}
                                  </Badge>
                                </div>

                                <div className="mt-3 text-sm text-slate-600">{summary.session.userIdentity}</div>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                  <span>{summary.session.updatedAt}</span>
                                  {summary.auditRecordCount > 0 ? (
                                    <>
                                      <span className="text-slate-300">/</span>
                                      <span>{summary.auditRecordCount} 条留痕</span>
                                    </>
                                  ) : null}
                                </div>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    ) : null}

                    <div className="space-y-4">
                      {currentConversationRun ? (
                        <>
                          <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <div className="text-xl font-semibold text-slate-950">{currentConversationRun.title}</div>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                  <span>{currentConversationRun.channel}</span>
                                  {currentConversationSummary?.linkedChatSession?.source ? (
                                    <>
                                      <span className="text-slate-300">/</span>
                                      <span>{currentConversationSummary.linkedChatSession.source}</span>
                                    </>
                                  ) : null}
                                  <span className="text-slate-300">/</span>
                                  <span>{currentConversationRun.userIdentity}</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                                  Session ID · {currentConversationRun.sessionId}
                                </Badge>
                                <Badge className="border-sky-100 bg-sky-50 text-sky-700">
                                  Trace · {currentConversationRun.traceId}
                                </Badge>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  用户身份
                                </div>
                                <div className="mt-2 text-sm font-medium text-slate-900">{currentConversationRun.userIdentity}</div>
                              </div>
                              <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  开始时间
                                </div>
                                <div className="mt-2 text-sm font-medium text-slate-900">{currentConversationRun.startedAt}</div>
                              </div>
                              <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  消息数
                                </div>
                                <div className="mt-2 text-sm font-medium text-slate-900">{currentConversationMessages.length}</div>
                              </div>
                              <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  带执行记录
                                </div>
                                <div className="mt-2 text-sm font-medium text-slate-900">
                                  {currentConversationSummary?.auditMessageCount ?? 0}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "grid gap-4",
                              conversationHistoryCollapsed
                                ? "xl:grid-cols-[minmax(0,1fr)_460px]"
                                : "xl:grid-cols-[minmax(0,1fr)_340px]"
                            )}
                          >
                            <div className="flex min-h-0 flex-col rounded-[24px] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(240,249,255,0.42),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] p-5">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-lg font-semibold text-slate-950">对话历史</div>
                                <Badge className="border-slate-200 bg-white text-slate-600">
                                  {currentConversationMessages.length} 条消息
                                </Badge>
                              </div>

                              <ScrollArea className="mt-5 h-[420px] pr-3 md:h-[520px] xl:h-[680px]">
                                <div className="space-y-3 pr-4">
                                  {currentConversationMessages.map((message) => {
                                    const isUser = message.role === "user";
                                    const isTool = message.role === "tool";
                                    const hasAudit = message.auditRecords.length > 0;
                                    const isSelected = selectedConversationAuditMessage?.id === message.id;

                                    if (isTool) {
                                      return (
                                        <div key={message.id} className="flex justify-center">
                                          <button
                                            type="button"
                                            disabled={!hasAudit}
                                            onClick={() =>
                                              setSelectedConversationAuditMessageId((current) =>
                                                current === message.id ? null : message.id
                                              )
                                            }
                                            className={cn(
                                              "max-w-[92%] rounded-full border px-4 py-2.5 text-left transition-all",
                                              hasAudit
                                                ? "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/70"
                                                : "cursor-default border-slate-200 bg-slate-100 text-slate-500",
                                              isSelected && "border-sky-200 bg-sky-50 text-sky-700 shadow-sm shadow-sky-100/70"
                                            )}
                                          >
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                系统动作
                                              </span>
                                              <span className="text-sm font-medium">{message.toolLabel ?? "系统执行"}</span>
                                              {hasAudit ? (
                                                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700">
                                                  执行 {message.auditRecords.length}
                                                </span>
                                              ) : null}
                                            </div>
                                          </button>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div key={message.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                                        <div className={cn("flex max-w-[88%] flex-col space-y-2", isUser && "items-end")}>
                                          <div
                                            className={cn(
                                              "flex flex-wrap items-center gap-2 text-xs text-slate-400",
                                              isUser ? "justify-end" : "justify-start"
                                            )}
                                          >
                                            <span>{message.sender}</span>
                                            <span>{message.time}</span>
                                            {message.turnNumber ? <span>第 {message.turnNumber} 轮</span> : null}
                                            {hasAudit ? (
                                              <span
                                                className={cn(
                                                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                                                  isSelected
                                                    ? "border-sky-200 bg-sky-50 text-sky-700"
                                                    : "border-slate-200 bg-white text-slate-500"
                                                )}
                                              >
                                                <span
                                                  className={cn(
                                                    "h-1.5 w-1.5 rounded-full",
                                                    isSelected ? "bg-sky-500" : "bg-slate-400"
                                                  )}
                                                />
                                                执行 {message.auditRecords.length}
                                              </span>
                                            ) : null}
                                          </div>

                                          {hasAudit ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setSelectedConversationAuditMessageId((current) =>
                                                  current === message.id ? null : message.id
                                                )
                                              }
                                              className={cn(
                                                "rounded-[24px] px-4 py-3 text-left text-sm leading-7 shadow-sm transition-all",
                                                isUser
                                                  ? "bg-slate-950 text-white shadow-slate-200 hover:bg-slate-900"
                                                  : "border border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/60",
                                                isSelected &&
                                                  (isUser
                                                    ? "ring-2 ring-sky-200 ring-offset-2 ring-offset-white"
                                                    : "border-sky-200 bg-sky-50 shadow-sky-100/70")
                                              )}
                                            >
                                              <div className="whitespace-pre-line">{message.content}</div>
                                              {message.attachments?.length ? (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                  {message.attachments.map((attachment) => (
                                                    <span
                                                      key={`${message.id}-${attachment}`}
                                                      className={cn(
                                                        "inline-flex items-center rounded-full px-3 py-1 text-xs",
                                                        isUser ? "bg-white/15 text-white" : "bg-white text-slate-600"
                                                      )}
                                                    >
                                                      {attachment}
                                                    </span>
                                                  ))}
                                                </div>
                                              ) : null}
                                            </button>
                                          ) : (
                                            <div
                                              className={cn(
                                                "rounded-[24px] px-4 py-3 text-sm leading-7 shadow-sm",
                                                isUser
                                                  ? "bg-slate-950 text-white shadow-slate-200"
                                                  : "border border-slate-200 bg-white text-slate-700"
                                              )}
                                            >
                                              <div className="whitespace-pre-line">{message.content}</div>
                                              {message.attachments?.length ? (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                  {message.attachments.map((attachment) => (
                                                    <span
                                                      key={`${message.id}-${attachment}`}
                                                      className={cn(
                                                        "inline-flex items-center rounded-full px-3 py-1 text-xs",
                                                        isUser ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"
                                                      )}
                                                    >
                                                      {attachment}
                                                    </span>
                                                  ))}
                                                </div>
                                              ) : null}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </ScrollArea>
                            </div>

                            <div className="flex min-h-0 flex-col rounded-[24px] border border-slate-200 bg-white/95 p-5 xl:sticky xl:top-5">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-lg font-semibold text-slate-950">执行明细</div>
                                {selectedConversationAuditMessage ? (
                                  <Badge className="border-sky-100 bg-sky-50 text-sky-700">
                                    {selectedConversationAuditMessage.auditRecords.length} 项执行
                                  </Badge>
                                ) : null}
                              </div>

                              {selectedConversationAuditMessage ? (
                                <ScrollArea className="mt-4 h-[420px] pr-3 md:h-[520px] xl:h-[680px]">
                                  <div className="space-y-4 pr-4">
                                    <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        已选消息
                                      </div>
                                      <div className="mt-2 text-sm font-medium text-slate-900">
                                        {selectedConversationAuditMessage.sender} · {selectedConversationAuditMessage.time}
                                      </div>
                                      <div className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                                        {selectedConversationAuditMessage.content}
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      {selectedConversationAuditMessage.turnNumber ? (
                                        <Badge className="border-slate-200 bg-white text-slate-600">
                                          第 {selectedConversationAuditMessage.turnNumber} 轮
                                        </Badge>
                                      ) : null}
                                      {selectedConversationAuditMessage.traceId ? (
                                        <Badge className="border-sky-100 bg-sky-50 font-mono text-sky-700">
                                          {selectedConversationAuditMessage.traceId}
                                        </Badge>
                                      ) : null}
                                      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                        成功{" "}
                                        {
                                          selectedConversationAuditMessage.auditRecords.filter(
                                            (record) => record.status === "成功"
                                          ).length
                                        }
                                      </Badge>
                                      {selectedConversationAuditMessage.auditRecords.some(
                                        (record) => record.status === "已拦截"
                                      ) ? (
                                        <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                                          拦截{" "}
                                          {
                                            selectedConversationAuditMessage.auditRecords.filter(
                                              (record) => record.status === "已拦截"
                                            ).length
                                          }
                                        </Badge>
                                      ) : null}
                                    </div>

                                    <div className="space-y-3">
                                      {selectedConversationAuditMessage.auditRecords.map((record) => (
                                        <div key={record.id} className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                                          <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <Badge className={cn("border", getAuditTypeClassName(record.type))}>
                                                  {record.type}
                                                </Badge>
                                                <Badge className={cn("border", getAuditStatusClassName(record.status))}>
                                                  {record.status}
                                                </Badge>
                                                <div className="text-sm font-semibold text-slate-900">{record.targetName}</div>
                                              </div>
                                              <div className="mt-2 text-xs font-mono text-slate-400">
                                                Trace · {record.traceId}
                                              </div>
                                            </div>

                                            <div className="text-sm font-medium text-slate-700">
                                              {formatDurationMs(record.durationMs)}
                                            </div>
                                          </div>

                                          <div className="mt-4 space-y-3">
                                            <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-3">
                                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                入参摘要
                                              </div>
                                              <div className="mt-2 text-sm leading-6 text-slate-600">{record.inputSummary}</div>
                                            </div>
                                            <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-3">
                                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                结果摘要
                                              </div>
                                              <div className="mt-2 text-sm leading-6 text-slate-600">{record.outputSummary}</div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </ScrollArea>
                              ) : (
                                <ScrollArea className="mt-4 h-[420px] pr-3 md:h-[520px] xl:h-[680px]">
                                  <div className="flex min-h-full flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 px-5 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                                      <FileStack className="h-5 w-5" />
                                    </div>
                                    <div className="mt-4 text-base font-semibold text-slate-950">请选择消息以查看执行记录</div>
                                  </div>
                                </ScrollArea>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">
                          暂无会话运行记录
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeLogPanel === "task" ? (
                <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-[22px] border border-slate-200 bg-white/90 p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          任务运行总数
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-slate-950">{detail.taskRuns.length}</div>
                      </div>
                      <div className="rounded-[22px] border border-slate-200 bg-white/90 p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          成功运行
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-emerald-700">
                          {detail.taskRuns.filter((task) => task.status === "成功").length}
                        </div>
                      </div>
                      <div className="rounded-[22px] border border-slate-200 bg-white/90 p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          运行中
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-sky-700">
                          {detail.taskRuns.filter((task) => task.status === "运行中").length}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      {detail.taskRuns.map((task) => (
                        <div key={task.id} className="rounded-[24px] border border-slate-200 bg-white/90 p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="text-lg font-semibold text-slate-950">{task.taskName}</div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge className="border-slate-200 bg-slate-100 text-slate-700">{task.taskType}</Badge>
                                <Badge className={cn("border", getTaskRunStatusClassName(task.status))}>
                                  {task.status}
                                </Badge>
                              </div>
                            </div>

                            <Badge className="border-sky-100 bg-sky-50 font-mono text-sky-700">
                              {task.traceId}
                            </Badge>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                触发来源
                              </div>
                              <div className="mt-2 text-sm font-medium text-slate-900">{task.triggerSource}</div>
                            </div>
                            <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                运行时长
                              </div>
                              <div className="mt-2 text-sm font-medium text-slate-900">{formatDurationMs(task.durationMs)}</div>
                            </div>
                            <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                开始时间
                              </div>
                              <div className="mt-2 text-sm font-medium text-slate-900">{task.startedAt}</div>
                            </div>
                            <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                结束时间
                              </div>
                              <div className="mt-2 text-sm font-medium text-slate-900">{task.finishedAt ?? "仍在运行"}</div>
                            </div>
                          </div>

                          <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50/60 px-4 py-4">
                            <div className="text-sm font-semibold text-slate-900">结果摘要</div>
                            <div className="mt-3 text-sm leading-7 text-slate-600">{task.resultSummary}</div>
                          </div>

                          {task.relatedSessionId ? (
                            <div className="mt-4 text-sm text-slate-500">关联会话：{task.relatedSessionId}</div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

              {activeLogPanel === "security" ? (
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
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <ClawSecuritySection
              securityManagement={securityManagement}
              lexiconDrafts={lexiconDrafts}
              enabledSecurityPolicies={enabledSecurityPolicies}
              approvalBoundaryCount={approvalBoundaryCount}
              activeLexiconBindingCount={activeLexiconBindingCount}
              onAutonomyBoundaryLevelChange={handleAutonomyBoundaryLevelChange}
              onToggleSecurityPolicy={handleToggleSecurityPolicy}
              onSecurityPolicyModeChange={handleSecurityPolicyModeChange}
              onSecurityPolicyActionChange={handleSecurityPolicyActionChange}
              onSecurityPolicyRuleLevelChange={handleSecurityPolicyRuleLevelChange}
              onToggleLexiconPolicy={handleToggleLexiconPolicy}
              onLexiconPolicyModeChange={handleLexiconPolicyModeChange}
              onLexiconPolicyActionChange={handleLexiconPolicyActionChange}
              onLexiconDraftChange={handleLexiconDraftChange}
              onAddLexiconLibrary={handleAddLexiconLibrary}
              onRemoveLexiconLibrary={handleRemoveLexiconLibrary}
            />
          </TabsContent>

          <TabsContent value="relations" className="mt-0">
            <SectionCard title="关系" description="关系分为人和 Agent 两大块。">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div className="text-lg font-semibold text-slate-950">人</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.success("已预留添加人的入口。")}>
                      <Plus className="h-4 w-4" />
                      添加人
                    </Button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {detail.personRelations.map((item) => (
                      <div key={item.name} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                          <Badge className="border-slate-200 bg-slate-100 text-slate-700">{item.role}</Badge>
                        </div>
                        <div className="mt-3 text-sm leading-7 text-slate-600">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="text-lg font-semibold text-slate-950">Agent</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.success("已预留添加 Agent 的入口。")}>
                      <Plus className="h-4 w-4" />
                      添加Agent
                    </Button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {detail.agentRelations.map((item) => (
                      <div key={item.name} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                          <Badge className="border-slate-200 bg-slate-100 text-slate-700">{item.goal}</Badge>
                        </div>
                        <div className="mt-3 text-sm leading-7 text-slate-600">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="resource" className="mt-0">
            <ClawResourceSection
              resourceConfig={resourceConfig}
              resourceValidation={resourceValidation}
              runtimeAdvancedOpen={runtimeAdvancedOpen}
              onToggleRuntimeAdvanced={() => setRuntimeAdvancedOpen((current) => !current)}
              onResetResourceConfig={handleResetResourceConfig}
              onRuntimeTierChange={handleRuntimeTierChange}
              onExecutionTierChange={handleExecutionTierChange}
              onRuntimeNumberChange={handleRuntimeNumberChange}
              onRuntimeAdvancedNumberChange={handleRuntimeAdvancedNumberChange}
              onRuntimeAdvancedTextChange={handleRuntimeAdvancedTextChange}
              onExecutionNumberChange={handleExecutionNumberChange}
              onExecutionCapabilityChange={handleExecutionCapabilityChange}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <SectionCard title="设置" description="设置目前包含用量和权限两部分。">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700">
                      <Gauge className="h-4 w-4" />
                    </div>
                    <div className="text-lg font-semibold text-slate-950">用量</div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {detail.usageSettings.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                          <div className="text-sm font-semibold text-slate-950">{item.value}</div>
                        </div>
                        <div className="mt-3 text-sm leading-7 text-slate-600">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="text-lg font-semibold text-slate-950">权限</div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {detail.permissionSettings.map((item) => (
                      <div key={item.name} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                          <Badge className="border-slate-200 bg-slate-100 text-slate-700">{item.mode}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-slate-600">范围：{item.scope}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          </TabsContent>
        </div>
      </Tabs>
      <ToolConfigDialog open={toolConfigDialogOpen} onOpenChange={setToolConfigDialogOpen} onConfirm={handleConfirmToolConfig} />
      <SkillConfigDialog
        open={skillConfigDialogOpen}
        onOpenChange={setSkillConfigDialogOpen}
        onConfirm={handleConfirmSkillConfig}
      />
    </div>
  );
}
