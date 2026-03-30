"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CircleAlert,
  ChevronRight,
  Clock3,
  Cpu,
  FilePlus2,
  FileText,
  FileStack,
  FolderOpen,
  FolderPlus,
  Gauge,
  HardDrive,
  Mic,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Plus,
  RadioTower,
  RotateCcw,
  SendHorizontal,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  CapabilityScope,
  ClawCoreFileKey,
  ClawDetailData,
  ExecutionResourceTier,
  KnowledgeScope,
  ResourceConfig,
  RuntimeResourceTier,
  WorkspaceFolderItem,
} from "@/lib/mock/claw-hub-next";
import { createDefaultResourceConfig } from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";

type DetailSectionKey =
  | "chat"
  | "status"
  | "core"
  | "capability"
  | "channels"
  | "tasks"
  | "workspace"
  | "logs"
  | "relations"
  | "resource"
  | "settings";

type CapabilityPanelKey = "tools" | "skills" | "agents" | "knowledge";

const DETAIL_SECTION_ITEMS: Array<{
  value: DetailSectionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "chat", label: "对话", icon: MessageSquareText },
  { value: "status", label: "状态", icon: Bot },
  { value: "core", label: "核心文件", icon: FileText },
  { value: "capability", label: "能力配置", icon: Sparkles },
  { value: "channels", label: "渠道与分发", icon: RadioTower },
  { value: "tasks", label: "任务", icon: Clock3 },
  { value: "workspace", label: "工作空间", icon: FolderOpen },
  { value: "logs", label: "日志管理", icon: FileStack },
  { value: "relations", label: "关系", icon: UserRound },
  { value: "resource", label: "资源配置", icon: Server },
  { value: "settings", label: "设置", icon: Settings2 },
];

const CORE_FILE_ICONS: Record<ClawCoreFileKey, React.ComponentType<{ className?: string }>> = {
  identity: FileText,
  soul: Sparkles,
  memory: FileStack,
  heartbeat: Gauge,
};

const CAPABILITY_SCOPE_LABELS: Record<CapabilityScope, string> = {
  platform: "平台预置",
  tenant: "租户配置",
  claw: "Claw配置",
};

const KNOWLEDGE_SCOPE_LABELS: Record<KnowledgeScope, string> = {
  tenant: "租户配置",
  claw: "Claw配置",
};

const RUNTIME_TIER_OPTIONS: Array<{
  value: RuntimeResourceTier;
  title: string;
  summary: string;
}> = [
  { value: "light", title: "轻量型", summary: "2 vCPU / 4 GB 内存" },
  { value: "standard", title: "标准型", summary: "4 vCPU / 8 GB 内存" },
  { value: "enhanced", title: "增强型", summary: "8 vCPU / 16 GB 内存" },
];

const EXECUTION_TIER_OPTIONS: Array<{
  value: ExecutionResourceTier;
  title: string;
  summary: string;
}> = [
  { value: "basic", title: "基础型", summary: "2 vCPU / 4 GB / 5 GB 工作目录" },
  { value: "standard", title: "标准型", summary: "4 vCPU / 8 GB / 10 GB 工作目录" },
  { value: "enhanced", title: "增强型", summary: "8 vCPU / 16 GB / 20 GB 工作目录" },
];

const EXECUTION_CAPABILITY_OPTIONS = [
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

function cloneResourceConfig(config: ResourceConfig): ResourceConfig {
  return {
    runtime: {
      ...config.runtime,
      advanced: { ...config.runtime.advanced },
    },
    execution: {
      ...config.execution,
      capabilities: { ...config.execution.capabilities },
    },
  };
}

function getResourceValidation(config: ResourceConfig) {
  return {
    maxConcurrentTasks:
      config.runtime.maxConcurrentTasks < 1 || config.runtime.maxConcurrentTasks > 20
        ? "请输入 1 - 20 之间的并发任务数。"
        : "",
    maxTaskDurationMin: config.runtime.maxTaskDurationMin > 0 ? "" : "单任务最大运行时长必须大于 0 分钟。",
    workspaceDiskGb: config.execution.workspaceDiskGb > 0 ? "" : "工作目录空间必须大于 0 GB。",
    maxConcurrentExecutions: config.execution.maxConcurrentExecutions >= 1 ? "" : "并发执行环境数上限至少为 1。",
    maxExecutionTimeoutMin: config.execution.maxExecutionTimeoutMin > 0 ? "" : "单次执行超时时间必须大于 0 分钟。",
  };
}

function canDeleteCapability(scope: CapabilityScope | KnowledgeScope) {
  return scope === "claw";
}

function getWorkspaceTrail(root: WorkspaceFolderItem, path: string[]) {
  const trail: WorkspaceFolderItem[] = [root];
  let current = root;

  for (const folderId of path) {
    const next = current.children.find((item) => item.id === folderId);
    if (!next) {
      break;
    }

    trail.push(next);
    current = next;
  }

  return trail;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 rounded-[28px] border-slate-200 bg-white py-0 shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div>
          <div className="text-xl font-semibold text-slate-950">{title}</div>
          {description ? <div className="mt-2 text-sm leading-7 text-slate-600">{description}</div> : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function ClawDetailWorkbench({ detail }: { detail: ClawDetailData }) {
  const [activeSection, setActiveSection] = useState<DetailSectionKey>("chat");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatSessions, setChatSessions] = useState(detail.chatSessions);
  const [selectedChatId, setSelectedChatId] = useState(detail.chatSessions[0]?.id ?? "");
  const [draftMessage, setDraftMessage] = useState("");
  const [queuedFiles, setQueuedFiles] = useState<string[]>([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [selectedCoreFileKey, setSelectedCoreFileKey] = useState<ClawCoreFileKey | null>(null);
  const [capabilityConfig, setCapabilityConfig] = useState(detail.capabilityConfig);
  const [resourceConfig, setResourceConfig] = useState<ResourceConfig>(() => cloneResourceConfig(detail.resourceConfig));
  const [activeCapabilityPanel, setActiveCapabilityPanel] = useState<CapabilityPanelKey>("tools");
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
  const selectedCoreFile = detail.coreFiles.find((file) => file.key === selectedCoreFileKey) ?? null;
  const workspaceTrail = getWorkspaceTrail(detail.workspaceRoot, workspacePath);
  const currentWorkspaceFolder = workspaceTrail[workspaceTrail.length - 1];
  const resourceValidation = getResourceValidation(resourceConfig);
  const capabilityPanels: Array<{
    key: CapabilityPanelKey;
    title: string;
    description: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      key: "tools",
      title: "工具配置",
      description: "管理平台预置、租户配置和 Claw 配置三类工具。",
      count: Object.values(capabilityConfig.tools).reduce((total, items) => total + items.length, 0),
      icon: Wrench,
    },
    {
      key: "skills",
      title: "技能配置",
      description: "统一管理平台、租户和 Claw 的技能清单与状态。",
      count: Object.values(capabilityConfig.skills).reduce((total, items) => total + items.length, 0),
      icon: Sparkles,
    },
    {
      key: "agents",
      title: "Agent（as Function）",
      description: "封装平台、租户和 Claw 级别的可调用 Agent 能力。",
      count: Object.values(capabilityConfig.agents).reduce((total, items) => total + items.length, 0),
      icon: Bot,
    },
    {
      key: "knowledge",
      title: "知识",
      description: "维护租户与 Claw 两层知识库的启用和绑定状态。",
      count: Object.values(capabilityConfig.knowledge).reduce((total, items) => total + items.length, 0),
      icon: FileStack,
    },
  ];

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
              id: `${session.id}-user-${Date.now()}`,
              role: "user",
              sender: "你",
              time: "刚刚",
              content: userContent,
              attachments: queuedFiles.length ? queuedFiles : undefined,
            },
            {
              id: `${session.id}-assistant-${Date.now()}`,
              role: "assistant",
              sender: detail.overview.name,
              time: "刚刚",
              content: assistantContent || "已收到，我继续处理。",
            },
          ],
        };
      });

      const active = updated.find((session) => session.id === currentSession.id);
      return active ? [active, ...updated.filter((session) => session.id !== currentSession.id)] : updated;
    });

    setDraftMessage("");
    setQueuedFiles([]);
    setVoiceMode(false);
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
      tools: {
        ...current.tools,
        [scope]: current.tools[scope].map((item) => (item.id === id ? { ...item, enabled: checked } : item)),
      },
    }));
  }

  function handleDeleteTool(scope: CapabilityScope, id: string) {
    setCapabilityConfig((current) => ({
      ...current,
      tools: {
        ...current.tools,
        [scope]: current.tools[scope].filter((item) => item.id !== id),
      },
    }));
    toast.success("工具已删除。");
  }

  function handleToggleSkill(scope: CapabilityScope, id: string, enabled: boolean) {
    setCapabilityConfig((current) => ({
      ...current,
      skills: {
        ...current.skills,
        [scope]: current.skills[scope].map((item) => (item.id === id ? { ...item, enabled } : item)),
      },
    }));
    toast.success(enabled ? "技能已启用。" : "技能已停用。");
  }

  function handleDeleteSkill(scope: CapabilityScope, id: string) {
    setCapabilityConfig((current) => ({
      ...current,
      skills: {
        ...current.skills,
        [scope]: current.skills[scope].filter((item) => item.id !== id),
      },
    }));
    toast.success("技能已删除。");
  }

  function handleToggleAgent(scope: CapabilityScope, id: string, enabled: boolean) {
    setCapabilityConfig((current) => ({
      ...current,
      agents: {
        ...current.agents,
        [scope]: current.agents[scope].map((item) => (item.id === id ? { ...item, enabled } : item)),
      },
    }));
    toast.success(enabled ? "Agent 已启用。" : "Agent 已停用。");
  }

  function handleDeleteAgent(scope: CapabilityScope, id: string) {
    setCapabilityConfig((current) => ({
      ...current,
      agents: {
        ...current.agents,
        [scope]: current.agents[scope].filter((item) => item.id !== id),
      },
    }));
    toast.success("Agent 已删除。");
  }

  function handleToggleKnowledge(scope: KnowledgeScope, id: string, enabled: boolean) {
    setCapabilityConfig((current) => ({
      ...current,
      knowledge: {
        ...current.knowledge,
        [scope]: current.knowledge[scope].map((item) => (item.id === id ? { ...item, enabled } : item)),
      },
    }));
    toast.success(enabled ? "知识已启用。" : "知识已停用。");
  }

  function handleDeleteKnowledge(scope: KnowledgeScope, id: string) {
    setCapabilityConfig((current) => ({
      ...current,
      knowledge: {
        ...current.knowledge,
        [scope]: current.knowledge[scope].filter((item) => item.id !== id),
      },
    }));
    toast.success("知识已删除。");
  }

  function handleRuntimeTierChange(tier: RuntimeResourceTier) {
    const matched = {
      light: { cpu: 2, memoryGb: 4, diskGb: 20 },
      standard: { cpu: 4, memoryGb: 8, diskGb: 40 },
      enhanced: { cpu: 8, memoryGb: 16, diskGb: 80 },
    }[tier];

    setResourceConfig((current) => ({
      ...current,
      runtime: {
        ...current.runtime,
        tier,
        advanced: {
          ...current.runtime.advanced,
          ...matched,
        },
      },
    }));
  }

  function handleExecutionTierChange(tier: ExecutionResourceTier) {
    const matched = {
      basic: { workspaceDiskGb: 5 },
      standard: { workspaceDiskGb: 10 },
      enhanced: { workspaceDiskGb: 20 },
    }[tier];

    setResourceConfig((current) => ({
      ...current,
      execution: {
        ...current.execution,
        tier,
        ...matched,
      },
    }));
  }

  function handleRuntimeNumberChange(field: "maxConcurrentTasks" | "maxTaskDurationMin", value: string) {
    const nextValue = Number.parseInt(value, 10);

    setResourceConfig((current) => ({
      ...current,
      runtime: {
        ...current.runtime,
        [field]: Number.isNaN(nextValue) ? 0 : nextValue,
      },
    }));
  }

  function handleRuntimeAdvancedNumberChange(field: "cpu" | "memoryGb" | "diskGb" | "startupTimeoutSec", value: string) {
    const nextValue = Number.parseInt(value, 10);

    setResourceConfig((current) => ({
      ...current,
      runtime: {
        ...current.runtime,
        advanced: {
          ...current.runtime.advanced,
          [field]: Number.isNaN(nextValue) ? 0 : nextValue,
        },
      },
    }));
  }

  function handleRuntimeAdvancedTextChange(value: string) {
    setResourceConfig((current) => ({
      ...current,
      runtime: {
        ...current.runtime,
        advanced: {
          ...current.runtime.advanced,
          runtimeVersion: value,
        },
      },
    }));
  }

  function handleExecutionNumberChange(
    field: "workspaceDiskGb" | "maxConcurrentExecutions" | "maxExecutionTimeoutMin",
    value: string
  ) {
    const nextValue = Number.parseInt(value, 10);

    setResourceConfig((current) => ({
      ...current,
      execution: {
        ...current.execution,
        [field]: Number.isNaN(nextValue) ? 0 : nextValue,
      },
    }));
  }

  function handleExecutionCapabilityChange(key: keyof ResourceConfig["execution"]["capabilities"], checked: boolean) {
    setResourceConfig((current) => ({
      ...current,
      execution: {
        ...current.execution,
        capabilities: {
          ...current.execution.capabilities,
          [key]: checked,
        },
      },
    }));
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
        onValueChange={setActiveSection}
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
                            onClick={() => {
                              setSelectedChatId(session.id);
                              setChatSessions((current) =>
                                current.map((item) => (item.id === session.id ? { ...item, unreadCount: 0 } : item))
                              );
                            }}
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
            <SectionCard title="能力配置" description="能力配置包括工具配置、技能配置、Agent（as Function）和知识。">
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {capabilityPanels.map((panel) => {
                    const Icon = panel.icon;
                    const isActive = activeCapabilityPanel === panel.key;

                    return (
                      <button
                        key={panel.key}
                        type="button"
                        onClick={() => setActiveCapabilityPanel(panel.key)}
                        className={cn(
                          "group rounded-[24px] border p-4 text-left transition-all",
                          isActive
                            ? "border-sky-200 bg-[linear-gradient(180deg,rgba(240,249,255,0.92),rgba(255,255,255,0.98))] shadow-[0_16px_36px_-28px_rgba(14,165,233,0.5)]"
                            : "border-slate-200 bg-slate-50/70 hover:border-sky-100 hover:bg-white"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-[18px] border bg-white text-sky-700 shadow-sm shadow-sky-100/50",
                              isActive ? "border-sky-200" : "border-sky-100"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <Badge className={cn(isActive ? "border-sky-200 bg-white text-sky-700" : "border-slate-200 bg-white text-slate-500")}>
                            {panel.count} 项
                          </Badge>
                        </div>

                        <div className="mt-4">
                          <div className="text-base font-semibold text-slate-950">{panel.title}</div>
                          <div className="mt-2 text-sm leading-6 text-slate-600">{panel.description}</div>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-xs font-medium">
                          <span className={isActive ? "text-sky-700" : "text-slate-400"}>{isActive ? "当前展开" : "点击查看详情"}</span>
                          <ChevronRight className={cn("h-4 w-4 transition-transform", isActive ? "text-sky-600" : "text-slate-300 group-hover:text-slate-500")} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0.98))] p-5">
                  {activeCapabilityPanel === "tools" ? (
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-sky-100 bg-white text-sky-700 shadow-sm shadow-sky-100/50">
                            <Wrench className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-slate-950">工具配置</div>
                            <div className="mt-2 text-sm leading-7 text-slate-600">平台预置、租户配置、Claw 配置三类工具统一在这里管理。</div>
                          </div>
                        </div>

                        <Button type="button" variant="outline" size="sm" onClick={() => toast.success("已预留配置工具入口。")}>
                          <Plus className="h-4 w-4" />
                          配置工具
                        </Button>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-2 rounded-[18px] bg-slate-100/80 p-1">
                        {(["platform", "tenant", "claw"] as CapabilityScope[]).map((scope) => (
                          <button
                            key={`tools-${scope}`}
                            type="button"
                            onClick={() => setToolScope(scope)}
                            className={cn(
                              "rounded-[14px] px-3 py-2 text-sm font-medium transition-all",
                              toolScope === scope ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                            )}
                          >
                            {CAPABILITY_SCOPE_LABELS[scope]} ({capabilityConfig.tools[scope].length})
                          </button>
                        ))}
                      </div>

                      <div className="mt-5 space-y-3">
                        {capabilityConfig.tools[toolScope].length ? (
                          capabilityConfig.tools[toolScope].map((item) => (
                            <div key={item.id} className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-base font-semibold text-slate-950">{item.name}</div>
                                    {item.badge ? (
                                      <Badge className="border-slate-200 bg-slate-100 text-slate-600">{item.badge}</Badge>
                                    ) : null}
                                  </div>
                                  {item.meta ? (
                                    <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                      {item.meta}
                                    </div>
                                  ) : null}
                                  <div className="mt-2 text-sm leading-7 text-slate-600">{item.description}</div>
                                </div>

                                <div className="flex shrink-0 items-center gap-3">
                                  <Badge
                                    className={cn(
                                      item.enabled
                                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 bg-slate-100 text-slate-600"
                                    )}
                                  >
                                    {item.enabled ? "已启用" : "已停用"}
                                  </Badge>
                                  {canDeleteCapability(toolScope) ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                      onClick={() => handleDeleteTool(toolScope, item.id)}
                                    >
                                      删除
                                    </Button>
                                  ) : null}
                                  <Switch
                                    checked={item.enabled}
                                    onCheckedChange={(checked) => handleToggleTool(toolScope, item.id, checked)}
                                    aria-label={`${item.name} 开关`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/80 px-4 py-8 text-center text-sm text-slate-400">
                            当前分类下还没有工具。
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {activeCapabilityPanel === "skills" ? (
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-sky-100 bg-white text-sky-700 shadow-sm shadow-sky-100/50">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-slate-950">技能配置</div>
                            <div className="mt-2 text-sm leading-7 text-slate-600">区分平台预置、租户配置和 Claw 配置的技能清单。</div>
                          </div>
                        </div>

                        <Button type="button" variant="outline" size="sm" onClick={() => toast.success("已预留配置技能入口。")}>
                          <Plus className="h-4 w-4" />
                          配置技能
                        </Button>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-2 rounded-[18px] bg-slate-100/80 p-1">
                        {(["platform", "tenant", "claw"] as CapabilityScope[]).map((scope) => (
                          <button
                            key={`skills-${scope}`}
                            type="button"
                            onClick={() => setSkillScope(scope)}
                            className={cn(
                              "rounded-[14px] px-3 py-2 text-sm font-medium transition-all",
                              skillScope === scope ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                            )}
                          >
                            {CAPABILITY_SCOPE_LABELS[scope]} ({capabilityConfig.skills[scope].length})
                          </button>
                        ))}
                      </div>

                      <div className="mt-5 space-y-3">
                        {capabilityConfig.skills[skillScope].length ? (
                          capabilityConfig.skills[skillScope].map((item) => (
                            <div key={item.id} className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-300">/</span>
                                    <div className="min-w-0">
                                      <div className="truncate text-base font-semibold text-slate-950">{item.name}</div>
                                      <div className="mt-2 text-sm leading-7 text-slate-600">{item.description}</div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                  <span className="text-sm text-slate-400">{item.sizeLabel}</span>
                                  <Badge
                                    className={cn(
                                      item.enabled
                                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 bg-slate-100 text-slate-600"
                                    )}
                                  >
                                    {item.enabled ? "已启用" : "已停用"}
                                  </Badge>
                                  {canDeleteCapability(skillScope) ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                      onClick={() => handleDeleteSkill(skillScope, item.id)}
                                    >
                                      删除
                                    </Button>
                                  ) : null}
                                  <Switch
                                    checked={item.enabled}
                                    onCheckedChange={(checked) => handleToggleSkill(skillScope, item.id, checked)}
                                    aria-label={`${item.name} 开关`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/80 px-4 py-8 text-center text-sm text-slate-400">
                            当前分类下还没有技能。
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {activeCapabilityPanel === "agents" ? (
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-sky-100 bg-white text-sky-700 shadow-sm shadow-sky-100/50">
                            <Bot className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-slate-950">Agent（as Function）</div>
                            <div className="mt-2 text-sm leading-7 text-slate-600">把平台、租户和 Claw 级别的 Agent 能力封装成可调用函数。</div>
                          </div>
                        </div>

                        <Button type="button" variant="outline" size="sm" onClick={() => toast.success("已预留配置 Agent 入口。")}>
                          <Plus className="h-4 w-4" />
                          配置Agent
                        </Button>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-2 rounded-[18px] bg-slate-100/80 p-1">
                        {(["platform", "tenant", "claw"] as CapabilityScope[]).map((scope) => (
                          <button
                            key={`agents-${scope}`}
                            type="button"
                            onClick={() => setAgentScope(scope)}
                            className={cn(
                              "rounded-[14px] px-3 py-2 text-sm font-medium transition-all",
                              agentScope === scope ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                            )}
                          >
                            {CAPABILITY_SCOPE_LABELS[scope]} ({capabilityConfig.agents[scope].length})
                          </button>
                        ))}
                      </div>

                      <div className="mt-5 space-y-3">
                        {capabilityConfig.agents[agentScope].length ? (
                          capabilityConfig.agents[agentScope].map((item) => (
                            <div key={item.id} className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-base font-semibold text-slate-950">{item.name}</div>
                                    <Badge className="border-sky-100 bg-sky-50 text-sky-700">{item.target}</Badge>
                                  </div>
                                  <div className="mt-2 text-sm leading-7 text-slate-600">{item.description}</div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                  <Badge
                                    className={cn(
                                      item.enabled
                                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 bg-slate-100 text-slate-600"
                                    )}
                                  >
                                    {item.enabled ? "已启用" : "已停用"}
                                  </Badge>
                                  {canDeleteCapability(agentScope) ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                      onClick={() => handleDeleteAgent(agentScope, item.id)}
                                    >
                                      删除
                                    </Button>
                                  ) : null}
                                  <Switch
                                    checked={item.enabled}
                                    onCheckedChange={(checked) => handleToggleAgent(agentScope, item.id, checked)}
                                    aria-label={`${item.name} 开关`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/80 px-4 py-8 text-center text-sm text-slate-400">
                            当前分类下还没有 Agent。
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {activeCapabilityPanel === "knowledge" ? (
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-sky-100 bg-white text-sky-700 shadow-sm shadow-sky-100/50">
                            <FileStack className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-slate-950">知识</div>
                            <div className="mt-2 text-sm leading-7 text-slate-600">知识分为租户配置和 Claw 配置两层，便于统一下发和单独增强。</div>
                          </div>
                        </div>

                        <Button type="button" variant="outline" size="sm" onClick={() => toast.success("已预留配置知识入口。")}>
                          <Plus className="h-4 w-4" />
                          配置知识
                        </Button>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-2 rounded-[18px] bg-slate-100/80 p-1">
                        {(["tenant", "claw"] as KnowledgeScope[]).map((scope) => (
                          <button
                            key={`knowledge-${scope}`}
                            type="button"
                            onClick={() => setKnowledgeScope(scope)}
                            className={cn(
                              "rounded-[14px] px-3 py-2 text-sm font-medium transition-all",
                              knowledgeScope === scope ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                            )}
                          >
                            {KNOWLEDGE_SCOPE_LABELS[scope]} ({capabilityConfig.knowledge[scope].length})
                          </button>
                        ))}
                      </div>

                      <div className="mt-5 space-y-3">
                        {capabilityConfig.knowledge[knowledgeScope].length ? (
                          capabilityConfig.knowledge[knowledgeScope].map((item) => (
                            <div key={item.id} className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="text-base font-semibold text-slate-950">{item.name}</div>
                                  <div className="mt-2 text-sm leading-7 text-slate-600">{item.description}</div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                  <Badge
                                    className={cn(
                                      item.enabled
                                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 bg-slate-100 text-slate-600"
                                    )}
                                  >
                                    {item.enabled ? "已启用" : "已停用"}
                                  </Badge>
                                  {canDeleteCapability(knowledgeScope) ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                      onClick={() => handleDeleteKnowledge(knowledgeScope, item.id)}
                                    >
                                      删除
                                    </Button>
                                  ) : null}
                                  <Switch
                                    checked={item.enabled}
                                    onCheckedChange={(checked) => handleToggleKnowledge(knowledgeScope, item.id, checked)}
                                    aria-label={`${item.name} 开关`}
                                  />
                                </div>
                              </div>

                              <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                                <span>{item.documentCount} 篇文档</span>
                                <span>最近更新 {item.updatedAt}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/80 px-4 py-8 text-center text-sm text-slate-400">
                            当前分类下还没有知识库。
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                </div>
              </div>
            </SectionCard>
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
            <SectionCard title="日志管理" description="日志管理包含消息日志和任务日志。">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700">
                      <MessageSquareText className="h-4 w-4" />
                    </div>
                    <div className="text-lg font-semibold text-slate-950">消息</div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {detail.messageLogs.map((log) => (
                      <div key={`${log.time}-${log.peer}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-sm font-semibold text-slate-900">{log.peer}</div>
                        <div className="mt-1 text-xs text-slate-400">{log.time}</div>
                        <div className="mt-3 text-sm leading-7 text-slate-600">{log.summary}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700">
                      <FileStack className="h-4 w-4" />
                    </div>
                    <div className="text-lg font-semibold text-slate-950">任务</div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {detail.taskLogs.map((log) => (
                      <div key={`${log.time}-${log.taskName}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-sm font-semibold text-slate-900">{log.taskName}</div>
                        <div className="mt-1 text-xs text-slate-400">{log.time}</div>
                        <div className="mt-3 text-sm leading-7 text-slate-600">{log.result}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
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
            <SectionCard title="资源配置" description="用于配置 Claw 的运行资源、执行环境上限与基础能力边界。">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-sky-100 bg-white text-sky-700 shadow-sm shadow-sky-100/50">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-950">资源配置</div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">
                      管理 Claw 本体运行资源和执行环境资源规格。
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="border-slate-200 bg-white text-slate-600">2项</Badge>
                  <Button type="button" variant="outline" size="sm" onClick={handleResetResourceConfig}>
                    <RotateCcw className="h-4 w-4" />
                    恢复默认
                  </Button>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-sky-700" />
                        <div className="text-base font-semibold text-slate-950">Claw 本体资源</div>
                      </div>
                      <div className="mt-2 text-sm leading-7 text-slate-600">
                        用于配置 Claw 在云端运行时的常驻资源规格，影响会话处理、任务规划与调度能力。
                      </div>
                    </div>

                    <Badge className="border-sky-100 bg-sky-50 text-sky-700">云端 Docker</Badge>
                  </div>

                  <div className="mt-5">
                    <div className="text-sm font-medium text-slate-900">资源档位</div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {RUNTIME_TIER_OPTIONS.map((option) => {
                        const isActive = resourceConfig.runtime.tier === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleRuntimeTierChange(option.value)}
                            className={cn(
                              "rounded-[20px] border px-4 py-4 text-left transition-all",
                              isActive
                                ? "border-sky-200 bg-sky-50/70 shadow-[0_16px_30px_-28px_rgba(14,165,233,0.5)]"
                                : "border-slate-200 bg-slate-50/70 hover:border-sky-100 hover:bg-white"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-semibold text-slate-950">{option.title}</div>
                              {option.value === "standard" ? (
                                <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700">推荐</Badge>
                              ) : null}
                            </div>
                            <div className="mt-2 text-xs leading-6 text-slate-500">{option.summary}</div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">用于承载 Claw 常驻运行资源。</div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                      <Label className="text-sm font-medium text-slate-900">最大并发任务数</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          value={resourceConfig.runtime.maxConcurrentTasks}
                          onChange={(event) => handleRuntimeNumberChange("maxConcurrentTasks", event.target.value)}
                          aria-invalid={Boolean(resourceValidation.maxConcurrentTasks)}
                          className="h-10 rounded-xl border-slate-200 bg-white"
                        />
                        <span className="text-sm text-slate-400">个</span>
                      </div>
                      <div className={cn("mt-2 text-xs", resourceValidation.maxConcurrentTasks ? "text-rose-500" : "text-slate-400")}>
                        {resourceValidation.maxConcurrentTasks || "控制该 Claw 可同时处理的任务数上限。"}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                      <Label className="text-sm font-medium text-slate-900">单任务最大运行时长</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={resourceConfig.runtime.maxTaskDurationMin}
                          onChange={(event) => handleRuntimeNumberChange("maxTaskDurationMin", event.target.value)}
                          aria-invalid={Boolean(resourceValidation.maxTaskDurationMin)}
                          className="h-10 rounded-xl border-slate-200 bg-white"
                        />
                        <span className="text-sm text-slate-400">分钟</span>
                      </div>
                      <div className={cn("mt-2 text-xs", resourceValidation.maxTaskDurationMin ? "text-rose-500" : "text-slate-400")}>
                        {resourceValidation.maxTaskDurationMin || "控制单个任务在 Claw 本体侧的最大允许运行时长。"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[22px] border border-dashed border-slate-200 bg-slate-50/60 p-4">
                    <button
                      type="button"
                      onClick={() => setRuntimeAdvancedOpen((current) => !current)}
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-900">高级设置</div>
                        <div className="mt-1 text-xs text-slate-400">可按需要覆盖 CPU、内存、磁盘和启动参数。</div>
                      </div>
                      <ChevronRight className={cn("h-4 w-4 text-slate-400 transition-transform", runtimeAdvancedOpen ? "rotate-90" : "")} />
                    </button>

                    {runtimeAdvancedOpen ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium text-slate-900">CPU 核数</Label>
                          <Input
                            type="number"
                            min={1}
                            value={resourceConfig.runtime.advanced.cpu}
                            onChange={(event) => handleRuntimeAdvancedNumberChange("cpu", event.target.value)}
                            className="mt-2 h-10 rounded-xl border-slate-200 bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-900">内存大小</Label>
                          <div className="mt-2 flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              value={resourceConfig.runtime.advanced.memoryGb}
                              onChange={(event) => handleRuntimeAdvancedNumberChange("memoryGb", event.target.value)}
                              className="h-10 rounded-xl border-slate-200 bg-white"
                            />
                            <span className="text-sm text-slate-400">GB</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-900">容器磁盘空间</Label>
                          <div className="mt-2 flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              value={resourceConfig.runtime.advanced.diskGb}
                              onChange={(event) => handleRuntimeAdvancedNumberChange("diskGb", event.target.value)}
                              className="h-10 rounded-xl border-slate-200 bg-white"
                            />
                            <span className="text-sm text-slate-400">GB</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-900">启动超时时间</Label>
                          <div className="mt-2 flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              value={resourceConfig.runtime.advanced.startupTimeoutSec}
                              onChange={(event) => handleRuntimeAdvancedNumberChange("startupTimeoutSec", event.target.value)}
                              className="h-10 rounded-xl border-slate-200 bg-white"
                            />
                            <span className="text-sm text-slate-400">秒</span>
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="text-sm font-medium text-slate-900">Runtime 版本</Label>
                          <Input
                            type="text"
                            value={resourceConfig.runtime.advanced.runtimeVersion}
                            onChange={(event) => handleRuntimeAdvancedTextChange(event.target.value)}
                            className="mt-2 h-10 rounded-xl border-slate-200 bg-white"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-sky-700" />
                        <div className="text-base font-semibold text-slate-950">执行环境资源</div>
                      </div>
                      <div className="mt-2 text-sm leading-7 text-slate-600">
                        用于配置 Claw 执行动作时可申请的执行环境规格，影响浏览器操作、代码执行、文件处理等任务的资源上限。
                      </div>
                    </div>

                    <Badge className="border-slate-200 bg-slate-100 text-slate-600">平台统一隔离策略</Badge>
                  </div>

                  <div className="mt-5">
                    <div className="text-sm font-medium text-slate-900">资源档位</div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {EXECUTION_TIER_OPTIONS.map((option) => {
                        const isActive = resourceConfig.execution.tier === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleExecutionTierChange(option.value)}
                            className={cn(
                              "rounded-[20px] border px-4 py-4 text-left transition-all",
                              isActive
                                ? "border-sky-200 bg-sky-50/70 shadow-[0_16px_30px_-28px_rgba(14,165,233,0.5)]"
                                : "border-slate-200 bg-slate-50/70 hover:border-sky-100 hover:bg-white"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-semibold text-slate-950">{option.title}</div>
                              {option.value === "standard" ? (
                                <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700">推荐</Badge>
                              ) : null}
                            </div>
                            <div className="mt-2 text-xs leading-6 text-slate-500">{option.summary}</div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">用于定义执行环境的资源规格上限。</div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                      <Label className="text-sm font-medium text-slate-900">工作目录空间</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={resourceConfig.execution.workspaceDiskGb}
                          onChange={(event) => handleExecutionNumberChange("workspaceDiskGb", event.target.value)}
                          aria-invalid={Boolean(resourceValidation.workspaceDiskGb)}
                          className="h-10 rounded-xl border-slate-200 bg-white"
                        />
                        <span className="text-sm text-slate-400">GB</span>
                      </div>
                      <div className={cn("mt-2 text-xs", resourceValidation.workspaceDiskGb ? "text-rose-500" : "text-slate-400")}>
                        {resourceValidation.workspaceDiskGb || "控制执行环境可使用的临时工作目录空间。"}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                      <Label className="text-sm font-medium text-slate-900">并发执行环境数上限</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={resourceConfig.execution.maxConcurrentExecutions}
                          onChange={(event) => handleExecutionNumberChange("maxConcurrentExecutions", event.target.value)}
                          aria-invalid={Boolean(resourceValidation.maxConcurrentExecutions)}
                          className="h-10 rounded-xl border-slate-200 bg-white"
                        />
                        <span className="text-sm text-slate-400">个</span>
                      </div>
                      <div className={cn("mt-2 text-xs", resourceValidation.maxConcurrentExecutions ? "text-rose-500" : "text-slate-400")}>
                        {resourceValidation.maxConcurrentExecutions || "控制当前 Claw 同时可拉起的执行环境数量上限。"}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 sm:col-span-2">
                      <Label className="text-sm font-medium text-slate-900">单次执行超时时间</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={resourceConfig.execution.maxExecutionTimeoutMin}
                          onChange={(event) => handleExecutionNumberChange("maxExecutionTimeoutMin", event.target.value)}
                          aria-invalid={Boolean(resourceValidation.maxExecutionTimeoutMin)}
                          className="h-10 rounded-xl border-slate-200 bg-white"
                        />
                        <span className="text-sm text-slate-400">分钟</span>
                      </div>
                      <div className={cn("mt-2 text-xs", resourceValidation.maxExecutionTimeoutMin ? "text-rose-500" : "text-slate-400")}>
                        {resourceValidation.maxExecutionTimeoutMin || "控制单次执行动作的最长允许运行时间。"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-500" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">执行环境说明</div>
                        <div className="mt-1 text-xs leading-6 text-slate-500">
                          执行环境由平台统一按隔离策略运行，当前页面仅配置资源规格与能力范围，不暴露生命周期和复用策略。
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-sm font-medium text-slate-900">执行能力范围</div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <TooltipProvider>
                        {EXECUTION_CAPABILITY_OPTIONS.map((item) => (
                          <label
                            key={item.key}
                            htmlFor={`execution-capability-${item.key}`}
                            className="flex cursor-pointer items-start gap-3 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3 transition-colors hover:border-sky-100 hover:bg-white"
                          >
                            <Checkbox
                              id={`execution-capability-${item.key}`}
                              checked={resourceConfig.execution.capabilities[item.key]}
                              onCheckedChange={(checked) => handleExecutionCapabilityChange(item.key, checked === true)}
                              className="mt-0.5"
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-slate-900">{item.label}</span>
                                {item.tone === "risk" ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                        <CircleAlert className="h-3 w-3" />
                                        高风险
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>启用后可执行系统命令，建议仅在必要场景下开放。</TooltipContent>
                                  </Tooltip>
                                ) : null}
                                {item.tone === "policy" ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                        <CircleAlert className="h-3 w-3" />
                                        受策略约束
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>网络访问最终受平台统一策略和租户白名单控制。</TooltipContent>
                                  </Tooltip>
                                ) : null}
                              </div>
                              <div className="mt-1 text-xs leading-6 text-slate-500">{item.note}</div>
                            </div>
                          </label>
                        ))}
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
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
    </div>
  );
}
