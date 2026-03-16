"use client";

import Link from "next/link";
import { type ComponentType, type ReactNode, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bot,
  Brain,
  Building2,
  ChevronRight,
  Clock3,
  Cloud,
  Download,
  Edit3,
  Globe,
  Layers3,
  Lock,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { ModelSelector } from "@/components/agent-editor/ModelSelector";
import { SkillMarketplacePickerDialog } from "@/components/skills/skill-marketplace-picker-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { type SkillMarketplaceItem } from "@/lib/mock/skill-marketplace";
import { cn } from "@/lib/utils";
import {
  cloneCloudClawDetail,
  type ChannelStatus,
  type CloudClawBaseDoc,
  type CloudClawDetail,
  type CloudClawDocId,
  type CloudClawStatus,
  type IntegrationStatus,
  type TaskStatus,
} from "@/lib/mock/cloud-claw-hub";

function truncateText(value: string, maxLength = 108) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

function formatConfiguredAt() {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return `${date} ${time}`;
}

function getStatusBadgeClass(
  status: CloudClawStatus | ChannelStatus | IntegrationStatus | TaskStatus
) {
  if (status === "已发布" || status === "在线" || status === "运行中") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "草稿" || status === "待执行") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (status === "告警") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getProtectionModeClass(mode: string) {
  if (mode === "严格") return "border-rose-200 bg-rose-50 text-rose-700";
  if (mode === "宽松") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getProtectionActionClass(action: string) {
  if (action === "拦截") return "border-rose-200 bg-rose-50 text-rose-700";
  if (action === "放行") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</div>
          <div className="mt-1 truncate text-lg font-semibold text-slate-950">{value}</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">{caption}</div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0 last:pb-0">
      <div className="text-sm text-slate-500">{label}</div>
      {badge ? (
        <Badge className={cn("rounded-full border px-2.5 py-1 text-xs", getStatusBadgeClass(value as CloudClawStatus))}>
          {value}
        </Badge>
      ) : (
        <div className="max-w-[75%] text-right text-sm font-medium leading-6 text-slate-900">{value}</div>
      )}
    </div>
  );
}

function DocumentCard({
  doc,
  onEdit,
}: {
  doc: CloudClawBaseDoc;
  onEdit: (docId: CloudClawDocId) => void;
}) {
  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-950">{doc.title}</div>
          <div className="mt-1 text-xs text-slate-500">{doc.subtitle}</div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="absolute top-3 right-3 h-6 px-2 text-[11px] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          onClick={() => onEdit(doc.id)}
        >
          <Edit3 className="h-3.5 w-3.5" />
          编辑
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {doc.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
            {tag}
          </Badge>
        ))}
      </div>
      <div className="mt-4 text-sm leading-7 text-slate-700">{truncateText(doc.summary)}</div>
    </div>
  );
}

function SectionPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function CloudClawDetailView({ detail }: { detail: CloudClawDetail }) {
  const initialDetail = useMemo(() => cloneCloudClawDetail(detail), [detail]);

  const [overview, setOverview] = useState(initialDetail.overview);
  const [docs, setDocs] = useState(initialDetail.docs);
  const [modelConfig, setModelConfig] = useState(initialDetail.modelConfig);
  const [capabilities, setCapabilities] = useState(initialDetail.capabilities);
  const [subAgents, setSubAgents] = useState(initialDetail.subAgents);
  const [integrations] = useState(initialDetail.integrations);
  const [channels, setChannels] = useState(initialDetail.channels);
  const [permissionScope, setPermissionScope] = useState(initialDetail.permissionScope);
  const [securityGovernance] = useState(initialDetail.securityGovernance);
  const [scheduledTasks, setScheduledTasks] = useState(initialDetail.scheduledTasks);
  const [editingDocId, setEditingDocId] = useState<CloudClawDocId | null>(null);
  const [docDraft, setDocDraft] = useState("");
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);

  const skillCapabilities = useMemo(
    () => capabilities.filter((item) => item.type === "技能"),
    [capabilities]
  );
  const workflowToolEntries = useMemo(
    () =>
      capabilities
        .filter((item) => item.type === "工作流")
        .map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          status: item.enabled ? ("在线" as const) : ("未启用" as const),
          description: item.description,
        })),
    [capabilities]
  );
  const toolEntries = useMemo(
    () => [
      ...workflowToolEntries,
      ...integrations.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        status: item.status,
        description: item.description,
      })),
    ],
    [workflowToolEntries, integrations]
  );
  const enabledSkillCount = useMemo(
    () => skillCapabilities.filter((item) => item.enabled).length,
    [skillCapabilities]
  );
  const enabledSubAgentCount = useMemo(
    () => subAgents.filter((agent) => agent.enabled).length,
    [subAgents]
  );
  const connectedToolCount = useMemo(
    () => toolEntries.filter((item) => item.status !== "未启用").length,
    [toolEntries]
  );
  const publishedChannelCount = useMemo(
    () => channels.filter((channel) => channel.status === "已发布").length,
    [channels]
  );
  const enabledTaskCount = useMemo(
    () => scheduledTasks.filter((task) => task.enabled).length,
    [scheduledTasks]
  );
  const warningToolCount = useMemo(
    () => toolEntries.filter((item) => item.status === "告警").length,
    [toolEntries]
  );
  const highRiskRuleCount = useMemo(
    () => securityGovernance.rules.filter((rule) => rule.level === "高" && rule.enabled).length,
    [securityGovernance.rules]
  );

  const editingDoc = useMemo(
    () => docs.find((doc) => doc.id === editingDocId) ?? null,
    [docs, editingDocId]
  );

  const openDocEditor = (docId: CloudClawDocId) => {
    const target = docs.find((doc) => doc.id === docId);
    if (!target) return;
    setEditingDocId(docId);
    setDocDraft(target.content);
  };

  const closeDocEditor = (open: boolean) => {
    if (!open) {
      setEditingDocId(null);
      setDocDraft("");
    }
  };

  const saveDoc = () => {
    if (!editingDocId) return;
    setDocs((current) =>
      current.map((doc) =>
        doc.id === editingDocId
          ? {
              ...doc,
              content: docDraft,
              summary: truncateText(docDraft.replaceAll("#", "").replaceAll("-", "").replaceAll("\n", " "), 150),
            }
          : doc
      )
    );
    toast.success("基础设定已更新");
    setEditingDocId(null);
    setDocDraft("");
  };

  const handleSaveDraft = () => {
    setOverview((current) => ({
      ...current,
      status: "草稿",
      version: current.status === "草稿" ? current.version : `${current.version}-draft`,
      updatedAt: "2026-03-16 16:10",
      latestOperation: `2026-03-16 16:10 保存了 ${current.name} 的一版草稿配置，等待下一步确认。`,
    }));
    setChannels((current) =>
      current.map((channel) =>
        channel.status === "已停用"
          ? channel
          : {
              ...channel,
              status: "草稿",
              version: channel.version.includes("draft") ? channel.version : `${channel.version}-draft`,
              publishedAt: "待发布",
            }
      )
    );
    toast.success("已保存为草稿");
  };

  const handlePublish = () => {
    setOverview((current) => ({
      ...current,
      status: "已发布",
      version: current.version.replace("-draft", ""),
      updatedAt: "2026-03-16 16:25",
      publishedAt: "2026-03-16 16:25",
      latestOperation: `2026-03-16 16:25 完成 ${current.name} 的正式发布并同步到启用渠道。`,
    }));
    setChannels((current) =>
      current.map((channel) =>
        channel.status === "已停用"
          ? channel
          : {
              ...channel,
              status: "已发布",
              version: channel.version.replace("-draft", ""),
              publishedAt: "2026-03-16 16:25",
            }
      )
    );
    toast.success("已正式发布");
  };

  const handleRollback = () => {
    setOverview((current) => ({
      ...current,
      status: "已发布",
      updatedAt: "2026-03-16 16:40",
      publishedAt: "2026-03-16 16:40",
      latestOperation: `2026-03-16 16:40 回滚 ${current.name} 到最近一版稳定版本。`,
    }));
    toast.success("已回滚到上一稳定版本");
  };

  const handleImportTemplate = () => {
    toast.success("已导入 OpenClaw 模板");
  };

  const updateCapabilityEnabled = (id: string, enabled: boolean) => {
    setCapabilities((current) => current.map((item) => (item.id === id ? { ...item, enabled } : item)));
  };

  const removeCapability = (id: string) => {
    setCapabilities((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        toast.success(target.type === "技能" ? "已删除技能" : "已删除工作流");
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const addSkillFromMarketplace = (item: SkillMarketplaceItem) => {
    if (capabilities.some((capability) => capability.marketplaceId === item.id)) {
      toast.info("这个技能已经添加过了");
      return;
    }

    setCapabilities((current) => [
      ...current,
      {
        id: `market-${item.id}`,
        marketplaceId: item.id,
        name: item.name,
        type: "技能",
        source: item.sourceType === "platform" ? "平台预置" : "自定义",
        configuredAt: formatConfiguredAt(),
        version: "市场模板",
        entry: `${item.author} / ${item.category}`,
        description: item.description,
        enabled: true,
      },
    ]);
    toast.success(`已添加技能：${item.name}`);
  };

  const updateSubAgent = (id: string, patch: Partial<(typeof detail.subAgents)[number]>) => {
    setSubAgents((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const updateFallbackModel = (index: number, value: string) => {
    setModelConfig((current) => ({
      ...current,
      fallbackModels: current.fallbackModels.map((model, modelIndex) =>
        modelIndex === index ? value : model
      ),
    }));
  };

  const addFallbackModel = () => {
    setModelConfig((current) => ({
      ...current,
      fallbackModels: [...current.fallbackModels, "Qwen3-8B"],
    }));
  };

  const moveFallbackModel = (index: number, direction: "up" | "down") => {
    setModelConfig((current) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.fallbackModels.length) return current;
      const nextFallbacks = [...current.fallbackModels];
      [nextFallbacks[index], nextFallbacks[targetIndex]] = [nextFallbacks[targetIndex], nextFallbacks[index]];
      return { ...current, fallbackModels: nextFallbacks };
    });
  };

  const removeFallbackModel = (index: number) => {
    setModelConfig((current) => ({
      ...current,
      fallbackModels: current.fallbackModels.filter((_, modelIndex) => modelIndex !== index),
    }));
  };

  const updateScheduledTask = (id: string, enabled: boolean) => {
    setScheduledTasks((current) => current.map((item) => (item.id === id ? { ...item, enabled } : item)));
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_38%),linear-gradient(135deg,#ffffff_8%,#f7fbff_54%,#edf5ff_100%)] p-7 shadow-sm">
        <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-cyan-100/70 blur-3xl" />
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
          <div className="space-y-5">
            <div className="space-y-3">
              <Badge className="border-sky-200 bg-sky-100 text-sky-700">
                <Link href="/" className="hover:text-sky-900">
                  应用开发
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href="/claw-hub" className="hover:text-sky-900">
                  ClawHub
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href="/claw-hub" className="hover:text-sky-900">
                  云端 Claw
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                {overview.name}
              </Badge>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{overview.name}</h2>
                <Badge className={cn("rounded-full border px-2.5 py-1 text-xs", getStatusBadgeClass(overview.status))}>
                  {overview.status}
                </Badge>
              </div>
              <p className="max-w-4xl text-sm leading-7 text-slate-600">{overview.description}</p>
              <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-slate-600">
                当前场景：<span className="font-medium text-slate-900">{overview.scene}</span>
                <span className="mx-2 text-slate-300">|</span>
                服务对象：{overview.targetAudience}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SummaryTile
                icon={Brain}
                label="主模型"
                value={modelConfig.primaryModel}
                caption="统一承担主推理、制度解释与结果生成。"
              />
              <SummaryTile
                icon={Sparkles}
                label="已启用技能"
                value={`${enabledSkillCount} 个`}
                caption="统一承载问答、执行与业务辅助能力。"
              />
              <SummaryTile
                icon={Bot}
                label="子Agent"
                value={`${enabledSubAgentCount} 个`}
                caption="按职责分层协作，支撑复杂服务链路。"
              />
              <SummaryTile
                icon={Wrench}
                label="工具"
                value={`${connectedToolCount} 项`}
                caption="覆盖 MCP、接口、插件、工作流与业务工具。"
              />
              <SummaryTile
                icon={Radio}
                label="渠道&集成"
                value={`${publishedChannelCount} 个`}
                caption="当前已同步发布或接入的服务入口数量。"
              />
              <SummaryTile
                icon={Clock3}
                label="定时任务"
                value={`${enabledTaskCount} 个`}
                caption="用于制度同步、预热和审计汇总。"
              />
              <SummaryTile
                icon={Layers3}
                label="当前版本"
                value={overview.version}
                caption="支持草稿保存、正式发布与版本回滚。"
              />
              <SummaryTile
                icon={Shield}
                label="治理状态"
                value={`${highRiskRuleCount} 条高风险规则`}
                caption={`当前存在 ${warningToolCount} 项告警工具需要关注。`}
              />
            </div>
          </div>

          <div className="rounded-[26px] border border-white/80 bg-white/88 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-semibold text-slate-950">{overview.name}</div>
                <div className="mt-1 text-sm text-slate-500">面向多用户服务的官方云端 Claw</div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
              当前页面聚焦单个云端 Claw 的治理详情，不包含灰度发布，仅支持草稿、正式发布与版本回滚。
            </div>

            <div className="mt-5">
              <MetaRow label="当前状态" value={overview.status} badge />
              <MetaRow label="创建人" value={overview.creator} />
              <MetaRow label="服务负责人" value={overview.serviceOwner} />
              <MetaRow label="最近更新时间" value={overview.updatedAt} />
              <MetaRow label="正式发布时间" value={overview.publishedAt} />
              <MetaRow label="服务范围" value={overview.serviceScope} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={handleImportTemplate}>
                <Download className="h-4 w-4" />
                导入 OpenClaw 模板
              </Button>
              <Button variant="outline" onClick={handleSaveDraft}>
                <Save className="h-4 w-4" />
                保存为草稿
              </Button>
              <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={handlePublish}>
                <Cloud className="h-4 w-4" />
                正式发布
              </Button>
              <Button variant="outline" onClick={handleRollback}>
                <RotateCcw className="h-4 w-4" />
                回滚版本
              </Button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <div className="font-medium text-slate-900">最新操作</div>
              <div className="mt-2 leading-6">{overview.latestOperation}</div>
            </div>
          </div>
        </div>
      </section>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>基础设定</CardTitle>
          <CardDescription>
            遵循 OpenClaw 官方文件结构，聚焦身份、灵魂、用户画像、心跳规则与防护摘要；需要修改时，再进入对应的 .md 文件编辑。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {docs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onEdit={openDocEditor} />
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm md:grid-cols-3 xl:grid-cols-8">
          <TabsTrigger value="models" className="h-auto py-3">
            <Brain className="h-4 w-4" />
            模型配置
          </TabsTrigger>
          <TabsTrigger value="capabilities" className="h-auto py-3">
            <Sparkles className="h-4 w-4" />
            技能配置
          </TabsTrigger>
          <TabsTrigger value="agents" className="h-auto py-3">
            <Bot className="h-4 w-4" />
            子Agent配置
          </TabsTrigger>
          <TabsTrigger value="integrations" className="h-auto py-3">
            <Wrench className="h-4 w-4" />
            工具
          </TabsTrigger>
          <TabsTrigger value="channels" className="h-auto py-3">
            <Globe className="h-4 w-4" />
            渠道&集成配置
          </TabsTrigger>
          <TabsTrigger value="permissions" className="h-auto py-3">
            <Lock className="h-4 w-4" />
            权限与可见范围
          </TabsTrigger>
          <TabsTrigger value="security" className="h-auto py-3">
            <Shield className="h-4 w-4" />
            安全治理
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="h-auto py-3">
            <Clock3 className="h-4 w-4" />
            定时任务配置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <SectionPanel
            title="统一模型配置"
            description="主模型负责稳定服务输出，回退模型链用于限流、波动和异常时的兜底切换。"
          >
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="text-base font-semibold text-slate-950">主模型</div>
                <div className="mt-2 text-sm text-slate-500">承担复杂问答、制度解释和主服务编排。</div>
                <div className="mt-4 space-y-2">
                  <Label>当前主模型</Label>
                  <ModelSelector
                    selectedModel={modelConfig.primaryModel}
                    onModelChange={(model) => setModelConfig((current) => ({ ...current, primaryModel: model }))}
                    showParams={false}
                    triggerClassName="w-full justify-between rounded-md border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50"
                  />
                </div>

                <div className="mt-5 space-y-2">
                  <Label>模型用途说明</Label>
                  <Textarea
                    value={modelConfig.purpose}
                    onChange={(event) => setModelConfig((current) => ({ ...current, purpose: event.target.value }))}
                    className="min-h-32"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-950">回退模型链</div>
                    <div className="mt-2 text-sm text-slate-500">从上到下表示优先级顺序，主模型不可用时依次回退。</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={addFallbackModel}>
                    <Plus className="h-4 w-4" />
                    新增回退模型
                  </Button>
                </div>

                <div className="mt-5 space-y-3">
                  {modelConfig.fallbackModels.map((model, index) => (
                    <div key={`${model}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <ModelSelector
                            selectedModel={model}
                            onModelChange={(value) => updateFallbackModel(index, value)}
                            showParams={false}
                            triggerClassName="w-full justify-between rounded-md border border-slate-200 bg-white px-3 py-2 hover:bg-white"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => moveFallbackModel(index, "up")} disabled={index === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => moveFallbackModel(index, "down")}
                            disabled={index === modelConfig.fallbackModels.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeFallbackModel(index)}
                            disabled={modelConfig.fallbackModels.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-2">
                  <Label>推理策略</Label>
                  <Textarea
                    value={modelConfig.strategy}
                    onChange={(event) => setModelConfig((current) => ({ ...current, strategy: event.target.value }))}
                    className="min-h-32"
                  />
                </div>
              </div>
            </div>
          </SectionPanel>
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-4">
          <SectionPanel
            title="技能配置"
            description="仅保留名称、描述、配置时间与启停状态，方便快速调整云端 Claw 绑定的技能。"
          >
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSkillPickerOpen(true)}>
                  <Plus className="h-4 w-4" />
                  新增技能
                </Button>
              </div>
              {skillCapabilities.length > 0 ? (
                skillCapabilities.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-3xl border p-5 transition-colors",
                      item.enabled ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50/80"
                    )}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="text-base font-semibold text-slate-950">{item.name}</div>
                        <p className="max-w-3xl text-sm leading-6 text-slate-500">{item.description}</p>
                        <div className="text-xs text-slate-400">配置时间 {item.configuredAt}</div>
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <span className="text-sm text-slate-500">启用</span>
                        <Switch checked={item.enabled} onCheckedChange={(checked) => updateCapabilityEnabled(item.id, checked)} />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeCapability(item.id)}
                          className="text-slate-500 hover:text-rose-600"
                          aria-label={`删除${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                  <div className="text-base font-semibold text-slate-900">暂无技能</div>
                  <div className="mt-2 text-sm text-slate-500">删除后会即时从当前云端 Claw 配置中移除。</div>
                </div>
              )}
            </div>
          </SectionPanel>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <SectionPanel
            title="子Agent配置"
            description="保留业务描述和触发语义，用更贴近业务场景的方式维护云端 Claw 的子Agent编排。"
          >
            <div className="space-y-4">
              {subAgents.map((agent) => (
                <div key={agent.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-base font-semibold text-slate-950">{agent.name}</div>
                    <div className="flex items-center gap-3 self-end md:self-auto">
                      <span className="text-sm text-slate-500">启用</span>
                      <Switch checked={agent.enabled} onCheckedChange={(checked) => updateSubAgent(agent.id, { enabled: checked })} />
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-500">描述</div>
                      <div className="mt-1 text-sm leading-6 text-slate-700">{agent.responsibility}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <Label className="text-xs text-slate-500">触发语义</Label>
                      <Input
                        value={agent.dispatchMode}
                        onChange={(event) => updateSubAgent(agent.id, { dispatchMode: event.target.value })}
                        className="mt-2 h-10 border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionPanel>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <SectionPanel
            title="工具"
            description="统一展示云端 Claw 绑定的 MCP、接口、插件、工作流和业务工具。"
          >
            {toolEntries.length > 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>能力名称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="w-[360px]">说明</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {toolEntries.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>
                          <Badge className={cn("rounded-full border", getStatusBadgeClass(item.status))}>{item.status}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-normal text-slate-600">{item.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                <div className="text-base font-semibold text-slate-900">暂无工具</div>
                <div className="mt-2 text-sm text-slate-500">工作流、MCP、插件和业务工具会统一展示在这里。</div>
              </div>
            )}
          </SectionPanel>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <SectionPanel
            title="渠道&集成配置"
            description="统一管理云端 Claw 的渠道发布与业务系统接入，当前页面只支持草稿、正式发布和版本回滚，不包含灰度发布。"
          >
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="text-base font-semibold text-slate-950">渠道与集成摘要</div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-sm text-slate-500">当前版本</div>
                    <div className="mt-1 text-lg font-semibold text-slate-950">{overview.version}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-sm text-slate-500">发布与接入策略</div>
                    <div className="mt-1 text-sm leading-6 text-slate-700">
                      统一由平台管理员发布，并同步到既定渠道和业务系统入口；如发生异常，直接回滚到上一稳定版本。
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-sm text-slate-500">服务范围</div>
                    <div className="mt-1 text-sm leading-6 text-slate-700">{overview.serviceScope}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>渠道 / 集成项</TableHead>
                      <TableHead>发布状态</TableHead>
                      <TableHead>当前版本</TableHead>
                      <TableHead>发布时间</TableHead>
                      <TableHead className="w-[240px]">入口</TableHead>
                      <TableHead>负责人</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channels.map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell className="font-medium text-slate-900">{channel.channel}</TableCell>
                        <TableCell>
                          <Badge className={cn("rounded-full border", getStatusBadgeClass(channel.status))}>{channel.status}</Badge>
                        </TableCell>
                        <TableCell>{channel.version}</TableCell>
                        <TableCell>{channel.publishedAt}</TableCell>
                        <TableCell className="whitespace-normal text-slate-600">{channel.entry}</TableCell>
                        <TableCell>{channel.owner}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </SectionPanel>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <SectionPanel
            title="权限与可见范围"
            description="控制云端 Claw 面向哪些部门、角色和用户组开放，并明确管理员可见范围与使用边界。"
          >
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-base font-semibold text-slate-950">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    面向部门
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {permissionScope.departments.map((item) => (
                      <Badge key={item} variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-base font-semibold text-slate-950">
                    <Users className="h-4 w-4 text-slate-500" />
                    面向角色 / 用户组
                  </div>
                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="text-sm text-slate-500">角色</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {permissionScope.roles.map((item) => (
                          <Badge key={item} variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">用户组</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {permissionScope.userGroups.map((item) => (
                          <Badge key={item} variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-slate-950">管理员可见范围</div>
                      <div className="mt-1 text-sm text-slate-500">控制是否仅管理员可见，或按部门 / 角色开放。</div>
                    </div>
                    <Switch
                      checked={permissionScope.adminVisibleOnly}
                      onCheckedChange={(checked) =>
                        setPermissionScope((current) => ({ ...current, adminVisibleOnly: checked }))
                      }
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <Label>可见范围说明</Label>
                  <Textarea
                    value={permissionScope.visibilityNote}
                    onChange={(event) =>
                      setPermissionScope((current) => ({ ...current, visibilityNote: event.target.value }))
                    }
                    className="mt-3 min-h-28"
                  />
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <Label>使用范围说明</Label>
                  <Textarea
                    value={permissionScope.usageNote}
                    onChange={(event) =>
                      setPermissionScope((current) => ({ ...current, usageNote: event.target.value }))
                    }
                    className="mt-3 min-h-28"
                  />
                </div>
              </div>
            </div>
          </SectionPanel>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>安全治理</CardTitle>
              <CardDescription>
                参考防护任务详情的信息布局，集中查看当前云端 Claw 的任务信息、防护配置、词库防护与响应配置。
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">基础信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-slate-700">任务名称</div>
                    <div className="mt-2 text-sm leading-6 text-slate-900">{securityGovernance.taskName}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-700">任务ID</div>
                    <div className="mt-2 text-sm leading-6 text-slate-900">{securityGovernance.taskId}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-700">任务描述</div>
                    <div className="mt-2 text-sm leading-7 text-slate-900">{securityGovernance.description}</div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-medium text-slate-700">输入防护</div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">{securityGovernance.inputGuard}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-medium text-slate-700">输出防护</div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">{securityGovernance.outputGuard}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-medium text-slate-700">风险策略</div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">{securityGovernance.riskStrategy}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-medium text-slate-700">审计与 Trace</div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">
                      {securityGovernance.behaviorAudit ? "已开启行为审计" : "未开启行为审计"}
                      <span className="mx-2 text-slate-300">|</span>
                      {securityGovernance.logLevel}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">{securityGovernance.traceNote}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">防护配置</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">策略名称</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">生效阶段</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">检测规则</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">执行动作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityGovernance.policyConfigs.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                              <Shield className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm font-medium text-slate-900">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-slate-700">{item.stage}</td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            {item.rules.map((rule) => (
                              <Badge
                                key={rule.id}
                                variant="outline"
                                className={cn("rounded-md border px-2.5 py-1 text-xs", getProtectionModeClass(rule.mode))}
                              >
                                {rule.name}
                                <span className="ml-1 opacity-80">{rule.mode}</span>
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <Badge className={cn("rounded-md border px-2.5 py-1 text-xs", getProtectionActionClass(item.action))}>
                            {item.action}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">词库防护</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">词库类型</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">生效阶段</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">词库名称</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">执行动作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityGovernance.lexiconConfigs.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                              <Layers3 className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm font-medium text-slate-900">{item.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-slate-700">{item.stage}</td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            {item.names.map((name) => (
                              <Badge
                                key={name}
                                variant="outline"
                                className={cn(
                                  "rounded-md border px-2.5 py-1 text-xs",
                                  item.type === "白名单词库"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : item.type === "灰名单词库"
                                      ? "border-amber-200 bg-amber-50 text-amber-700"
                                      : "border-rose-200 bg-rose-50 text-rose-700"
                                )}
                              >
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <Badge className={cn("rounded-md border px-2.5 py-1 text-xs", getProtectionActionClass(item.action))}>
                            {item.action}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">响应配置</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">策略名称</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">响应内容</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityGovernance.responseConfigs.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                              <Radio className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm font-medium text-slate-900">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm leading-7 text-slate-700">{item.content}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <SectionPanel
            title="定时任务配置"
            description="统一管理制度同步、预热、审计汇总等定时能力，并明确绑定对象与运行状态。"
          >
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">任务数量</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{scheduledTasks.length}</div>
                <div className="mt-2 text-sm text-slate-600">覆盖同步巡检、预热、内容生成与审计汇总。</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">启用中</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{enabledTaskCount}</div>
                <div className="mt-2 text-sm text-slate-600">已接入正式运行的定时能力数量。</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">最近一次巡检</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">
                  {scheduledTasks[0]?.lastRun.split(" ")[0] ?? "暂无记录"}
                </div>
                <div className="mt-2 text-sm text-slate-600">当前定时任务状态仅做原型展示，不接真实调度器。</div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>任务名</TableHead>
                    <TableHead>触发方式</TableHead>
                    <TableHead>绑定对象</TableHead>
                    <TableHead>运行上下文</TableHead>
                    <TableHead>最近执行</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>启用</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium text-slate-900">{task.name}</TableCell>
                      <TableCell>{task.trigger}</TableCell>
                      <TableCell>{`${task.bindType} / ${task.bindName}`}</TableCell>
                      <TableCell className="whitespace-normal text-slate-600">{task.runtime}</TableCell>
                      <TableCell>{task.lastRun}</TableCell>
                      <TableCell>
                        <Badge className={cn("rounded-full border", getStatusBadgeClass(task.status))}>{task.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch checked={task.enabled} onCheckedChange={(checked) => updateScheduledTask(task.id, checked)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionPanel>
        </TabsContent>
      </Tabs>

      <SkillMarketplacePickerDialog
        open={skillPickerOpen}
        onOpenChange={setSkillPickerOpen}
        selectedIds={capabilities.flatMap((item) => (item.marketplaceId ? [item.marketplaceId] : []))}
        onSelect={addSkillFromMarketplace}
        title="为云端 Claw 添加技能"
        description="从资源管理 - Skills 广场中选择已存在的技能，快速加入到当前云端 Claw。"
      />

      <Dialog open={Boolean(editingDoc)} onOpenChange={closeDocEditor}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingDoc?.title ?? "编辑基础设定"}</DialogTitle>
            <DialogDescription>这里直接编辑对应的配置文件内容，适合维护身份、灵魂、用户画像、心跳规则与防护摘要。</DialogDescription>
          </DialogHeader>
          {editingDoc ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-sm font-medium text-slate-900">{editingDoc.subtitle}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {editingDoc.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="border-slate-200 bg-white text-slate-600">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <Textarea
                value={docDraft}
                onChange={(event) => setDocDraft(event.target.value)}
                className="min-h-[420px] font-mono text-sm leading-6"
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => closeDocEditor(false)}>
              取消
            </Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={saveDoc}>
              保存文件
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
