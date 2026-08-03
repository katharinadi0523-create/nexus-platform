"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, GitCompareArrows, History, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AgentLogsView } from "@/components/agent/agent-logs-view";
import { WorkflowEditor } from "@/components/workflow/workflow-editor";
import { AutonomousEditor } from "@/components/agent/autonomous-editor";
import {
  AgentVersionHistoryDrawer,
  type RestoredAgentDraft,
} from "@/components/agent/agent-version-history-drawer";
import { AgentVersionComposition } from "@/components/agent/agent-version-composition";
import { AgentAvailabilityControl } from "@/components/agent/agent-availability-control";
import { getAgentById } from "@/lib/agent-data";
import { AGENT_VERSION_HISTORY, buildVersionCompositionData, type AgentVersionRecord } from "@/lib/mock/agent-version-management";
import { ProtectionStatusBadge } from "@/components/security/ProtectionStatusBadge";

interface AgentDetailData {
  type: "autonomous" | "workflow";
  name: string;
  description: string;
  prompt: string;
  openingStatement: string;
  suggestedQuestions: string[];
  plugins?: unknown;
  ontologies?: Array<{ id: string; name: string; description?: string }>;
  terminologies?: Array<{ id: string; name: string }>;
  mcps?: Array<{ id: string; name: string; description?: string; actionId?: string }>;
  mockReply: string;
}

const AGENTS_DETAIL_DATA: Record<string, AgentDetailData> = {
  "osint-01": {
    type: "autonomous",
    name: "OSINT开源情报整编",
    description: "基于全网开源数据的深度情报挖掘与关联分析。",
    prompt: "你是一名资深情报分析师。请调用搜索插件和知识库，对目标实体进行全网画像...",
    openingStatement: "你好，我是情报分析助手。请输入目标名称，我将为您生成研判报告。",
    suggestedQuestions: [
      "分析'暗流'组织的资金来源",
      "生成红海地区最近24小时的安全简报",
      "查询目标人物的关联社交账号",
    ],
    ontologies: [
      {
        id: "onto-1",
        name: "海上态势感知 - 无人机",
        description: "语义检索 (战斗风格_向量)",
      },
    ],
    terminologies: [{ id: "term-1", name: "北约军事术语集 2025" }],
    plugins: [
      {
        id: "plug-1",
        name: "文档解析",
        description: "解析各种格式的文档内容",
        icon: "FileText",
        type: "plugin",
      },
    ],
    mockReply: "收到。正在检索多源情报库... [进度: 80%] 已发现 3 条高置信度线索。建议调用卫星图谱验证。",
  },
  "code-02": {
    type: "autonomous",
    name: "CodeMaster 架构师",
    description: "专注于代码审查、重构建议和技术方案设计。",
    prompt: "你是一个精通 Next.js 和 Python 的全栈架构师...",
    openingStatement: "Talk is cheap, show me the code. 请粘贴代码。",
    suggestedQuestions: ["优化这段 React Hooks 代码", "如何设计高并发接口？"],
    plugins: ["Code Interpreter"],
    mockReply: "这段代码存在内存泄漏风险。建议使用 useMemo 进行优化。以下是重构后的代码示例...",
  },
  "device-03": {
    type: "autonomous",
    name: "设备维修判断与预测",
    description: "基于传感器数据和历史维修记录，预测设备故障概率。",
    prompt: "你是一个设备维修专家，能够分析传感器数据并预测故障...",
    openingStatement: "你好，我是设备维修助手。请提供传感器数据，我将为您分析设备状态。",
    suggestedQuestions: ["?????????", "????????"],
    plugins: ["Sensor Data Analyzer"],
    mockReply: "正在分析传感器数据... 检测到异常模式。建议在 48 小时内进行维护检查。",
  },
  "flow-01": {
    type: "workflow",
    name: "数据清洗工作流",
    description: "自动化数据清洗和预处理工作流，支持多数据源输入和标准化输出。",
    prompt: "这是一个工作流智能体，通过可视化流程节点执行数据处理任务。",
    openingStatement: "欢迎使用数据清洗工作流。请提供数据源，我将自动执行清洗流程。",
    suggestedQuestions: ["????????", "???????"],
    plugins: ["Data Processor", "Schema Validator"],
    mockReply: "工作流已启动。正在执行数据清洗步骤... [步骤 1/5] 数据读取完成。",
  },
  "agent-situational": {
    type: "autonomous",
    name: "态势感知智能体",
    description: "实时分析海面目标的身份与威胁等级，支持本体检索和视觉特征分析。",
    prompt: "你是一个海战态势感知智能体，负责实时分析海面目标的身份与威胁等级。",
    openingStatement: "你好，我是态势感知智能体。我可以进行实时态势分析和威胁评估，请提供目标信息。",
    suggestedQuestions: ["实时分析海面目标的身份与威胁等级"],
    ontologies: [
      {
        id: "onto-situational-1",
        name: "TH态势感知与情报快判 - 情报报告",
        description: "语义检索 (向量)",
      },
    ],
    plugins: [
      {
        id: "plugin-vision-1",
        name: "视觉特征分析",
        description: "分析目标的主炮状态、垂发系统、甲板活动等关键特征",
        icon: "Eye",
        type: "plugin",
      },
    ],
    mcps: [
      {
        id: "mcp-transit-event",
        name: "TransitEvent MDP",
        description: "过航事件相关的操作",
        actionId: "action-transit-update-identity",
      },
      {
        id: "mcp-transit-event-2",
        name: "TransitEvent MDP",
        description: "过航事件相关的操作",
        actionId: "action-transit-update-threat",
      },
    ],
    mockReply: "我可以进行实时态势分析和威胁评估。请提供目标信息（如位置、特征等），我会：\n1. 通过本体检索关联情报对象\n2. 进行身份识别和融合\n3. 调用视觉模型分析目标状态\n4. 综合评估威胁等级并生成研判报告。",
  },
};



export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params?.id as string;
  const agentData = agentId ? AGENTS_DETAIL_DATA[agentId] || null : null;
  const agentProfile = agentId ? getAgentById(agentId) : null;
  const isWorkflow = agentProfile?.type === "workflow";
  const initialObjectName = isWorkflow ? "演示数据处理工作流智能体" : "演示设备运维智能体";
  const [activeTab, setActiveTab] = useState<"config" | "logs">("config");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<AgentVersionRecord[]>(() => AGENT_VERSION_HISTORY.map((version) => {
    const snapshot = {
      ...version.snapshot,
      objectId: isWorkflow ? "demo-agent-workflow-001" : "demo-agent-autonomous-001",
      objectName: initialObjectName,
      objectType: isWorkflow ? "工作流智能体" as const : "自主规划智能体" as const,
    };
    return {
      ...version,
      snapshot,
      ...buildVersionCompositionData(snapshot, version.resources, version.label),
    };
  }));
  const [versionTotalCount, setVersionTotalCount] = useState(AGENT_VERSION_HISTORY.length);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [versionDetailMode, setVersionDetailMode] = useState(false);
  const [versionView, setVersionView] = useState<"config" | "logs">("config");
  const [compositionOpen, setCompositionOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState<RestoredAgentDraft | null>({ sourceLabel: "", issues: [] });
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [versionDescription, setVersionDescription] = useState("");
  const [entityDisabled, setEntityDisabled] = useState(false);

  const initialDisplayName = agentData?.name || agentProfile?.name || "加载中...";
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const selectedVersion = versions.find((version) => version.id === selectedVersionId) ?? null;

  const isHistorical = Boolean(versionDetailMode && selectedVersion);
  const isVersionContext = Boolean(versionDetailMode && selectedVersion);
  const nextVersionNumber = versions.reduce((highest, version) => {
    const parsed = Number(version.label.replace(/^V/, ""));
    return Number.isInteger(parsed) ? Math.max(highest, parsed) : highest;
  }, 0) + 1;
  const nextVersionLabel = `V${nextVersionNumber}`;

  const handleSelectVersion = (versionId: string | null) => {
    if (versionId === null) {
      setSelectedVersionId(null);
      setVersionDetailMode(false);
      setVersionView("config");
      setCompositionOpen(false);
      setActiveTab("config");
      return;
    }

    const targetVersion = versions.find((version) => version.id === versionId);
    if (!targetVersion) return;

    setSelectedVersionId(versionId);
    setVersionDetailMode(true);
    setVersionView("config");
      setCompositionOpen(false);
    setActiveTab("config");
  };

  const returnToCurrentDraft = () => {
    setSelectedVersionId(null);
    setVersionDetailMode(false);
    setVersionView("config");
      setCompositionOpen(false);
    setActiveTab("config");
  };

  const handleRestoreConfirm = () => {
    if (!selectedVersion) return;
    const restored: RestoredAgentDraft = {
      sourceLabel: selectedVersion.label,
      issues: selectedVersion.restoreIssues ?? [],
    };
    setRestoredDraft(restored);
    setRestoreConfirmOpen(false);
    setHistoryOpen(false);
    setSelectedVersionId(null);
    setVersionDetailMode(false);
    setVersionView("config");
      setCompositionOpen(false);
    setActiveTab("config");
    toast.success(`${selectedVersion.label} 已还原为当前草稿`);
  };

  const handlePublishConfirm = () => {
    const description = versionDescription.trim();
    if (!description || isHistorical) return;
    const sourceVersion = versions.find((version) => version.isLatest) ?? versions[0];
    if (!sourceVersion) return;

    const publishedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    const versionSlug = nextVersionLabel.toLowerCase();
    const resources = sourceVersion.resources.map((resource) => ({ ...resource, change: "未变化" as const }));
    const snapshot = {
      ...sourceVersion.snapshot,
      snapshotId: `demo-snapshot-agent-001-${versionSlug}`,
      objectId: isWorkflow ? "demo-agent-workflow-001" : "demo-agent-autonomous-001",
      objectName: isWorkflow ? "演示数据处理工作流智能体" : "演示设备运维智能体",
      objectType: isWorkflow ? "工作流智能体" as const : "自主规划智能体" as const,
      releaseRecord: `${nextVersionLabel} / demo-release-agent-001-${versionSlug}`,
      publisher: "用户A",
      frozenAt: publishedAt,
      publishedAt,
      resourceCount: resources.length,
      categoryCount: new Set(resources.map((resource) => resource.category)).size,
    };
    const composition = buildVersionCompositionData(snapshot, resources, nextVersionLabel);
    const newVersion: AgentVersionRecord = {
      id: `version-${versionSlug}`,
      label: nextVersionLabel,
      isLatest: true,
      referenceCount: 0,
      availabilityStatus: "启用",
      description,
      publisher: "\u7528\u6237A",
      publishedAt,
      versionId: `demo-version-agent-001-${versionSlug}`,
      snapshot,
      ...composition,
      resources,
    };

    setVersions((current) => [newVersion, ...current.map((version) => ({ ...version, isLatest: false }))]);
    setVersionTotalCount((count) => count + 1);
    setRestoredDraft({ sourceLabel: "", issues: [] });
    setVersionDescription("");
    setPublishDialogOpen(false);
    setHistoryOpen(true);
    toast.success(`${nextVersionLabel} \u53d1\u5e03\u6210\u529f`);
  };
  const handleDeleteVersion = (versionId: string) => {
    const deleted = versions.find((version) => version.id === versionId);
    setVersions((current) => current.filter((version) => version.id !== versionId));
    setVersionTotalCount((count) => Math.max(0, count - 1));
    if (selectedVersionId === versionId) {
      returnToCurrentDraft();
    }
    toast.success(`${deleted?.label ?? "版本"} 已删除`);
  };

  const handleVersionAvailabilityChange = (
    versionId: string,
    status: AgentVersionRecord["availabilityStatus"]
  ) => {
    const target = versions.find((version) => version.id === versionId);
    setVersions((current) =>
      current.map((version) =>
        version.id === versionId ? { ...version, availabilityStatus: status } : version
      )
    );
    toast.success(`${target?.label ?? "版本"} 已${status === "停用" ? "停用" : "重新启用"}`);
  };
  const renderAgentConfig = () => (
    <div
      aria-readonly={isHistorical}
      className={isHistorical
        ? "h-full w-full bg-slate-50 [&_input]:!border-slate-200 [&_input]:!bg-slate-100 [&_input]:!text-slate-500 [&_select]:!border-slate-200 [&_select]:!bg-slate-100 [&_select]:!text-slate-500 [&_textarea]:!border-slate-200 [&_textarea]:!bg-slate-100 [&_textarea]:!text-slate-500 [&_[contenteditable='true']]:!bg-slate-100 [&_[contenteditable='true']]:!text-slate-500"
        : "h-full w-full"}
    >
      {isWorkflow ? (
        <WorkflowEditor agentId={agentId} readOnly={isHistorical} />
      ) : (
        <fieldset disabled={isHistorical} className="h-full w-full min-w-0 border-0 p-0">
          <AutonomousEditor
            agentId={agentId}
            initialAgentData={agentData || undefined}
            onNameChange={setDisplayName}
          />
        </fieldset>
      )}
    </div>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[linear-gradient(180deg,#fbfcfe_0%,#f5f7fb_45%,#eef4ff_100%)]">
      <header className="relative flex h-20 flex-none items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="gap-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm hover:bg-slate-50 hover:text-slate-900"
            onClick={() => router.push("/agent")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">返回</span>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <span className="text-base font-semibold text-slate-950">{displayName}</span>
          </div>
        </div>

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)]">
          {isVersionContext ? (
            <>
              {([
                ["config", "应用配置"],
                ["logs", "日志与调优"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setVersionView(value)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    versionView === value
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab("config")}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "config"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                应用配置
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "logs"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                日志与调优
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ProtectionStatusBadge
            protectionTaskName="GF专属防护"
            protectionTaskId="1"
            protectionTypes={["policy", "lexicon"]}
          />
          <AgentAvailabilityControl
            entityLabel="该智能体"
            disabled={entityDisabled}
            onDisabledChange={(disabled) => {
              setEntityDisabled(disabled);
              toast.success(disabled ? "该智能体已停用" : "该智能体已重新启用");
            }}
          />          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="版本历史"
                  aria-pressed={historyOpen}
                  onClick={() => setHistoryOpen((open) => !open)}
                  className={`h-10 w-10 rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 ${
                    historyOpen ? "border-blue-400 text-blue-600" : "text-slate-600"
                  }`}
                >
                  <History className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>版本历史</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isHistorical ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCompositionOpen(true);
                setHistoryOpen(false);
              }}
              className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-3 text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <GitCompareArrows className="h-4 w-4" />
              版本对比
            </Button>
          ) : null}
          <Button
            disabled={isHistorical}
            title={isHistorical ? "\u5386\u53f2\u7248\u672c\u4e0d\u53ef\u53d1\u5e03" : undefined}
            onClick={() => setPublishDialogOpen(true)}
            className="rounded-2xl bg-slate-900 px-4 text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.8)] hover:bg-slate-800 disabled:bg-slate-300"
          >
            <Rocket className="h-4 w-4" />
            发布
          </Button>
        </div>
      </header>

      {isHistorical && selectedVersion ? (
        <div className="flex min-h-11 shrink-0 items-center justify-between gap-4 border-b border-blue-200 bg-blue-50 px-6 py-2 text-sm text-blue-800">
          <span>{`\u5f53\u524d\u6b63\u5728\u67e5\u770b\u5386\u53f2\u7248\u672c\uff08${selectedVersion.label}\uff09\uff0c\u914d\u7f6e\u4e0d\u53ef\u7f16\u8f91\u3002`}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={returnToCurrentDraft}
            className="h-8 shrink-0 rounded-md text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          >
            {"\u8fd4\u56de\u5f53\u524d\u8349\u7a3f"}
          </Button>
        </div>
      ) : restoredDraft?.issues.length ? (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              {restoredDraft.sourceLabel} {"\u5df2\u8fd8\u539f\u4e3a\u5f53\u524d\u8349\u7a3f"}
            </div>
            <span className="text-amber-800">{restoredDraft.issues.length} {"\u9879\u8d44\u6e90\u5f85\u5904\u7406"}</span>
            {restoredDraft.issues.map((issue) => (
              <span key={issue.resourceId} className="rounded border border-amber-200 bg-white/70 px-2 py-1 text-xs">
                {issue.resourceName} {"\u00b7"} {issue.reason === "\u8d44\u6e90\u5df2\u5220\u9664" ? "\u5df2\u5220\u9664" : issue.reason === "\u9700\u8981\u91cd\u65b0\u6388\u6743" ? "\u9700\u91cd\u65b0\u6388\u6743" : issue.reason}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <main className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0 w-full min-w-0">
          {isVersionContext && selectedVersion ? (
            versionView === "logs" ? (
              <div className="flex h-full w-full min-w-0 flex-col">
                <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-2 text-xs text-slate-600">
                  当前筛选：{selectedVersion.label} 发布后的运行记录
                  {isHistorical ? "；历史日志可查看，产生配置变更的调优结果需应用到当前草稿。" : ""}
                </div>
                <div className="min-h-0 flex-1">
                  <AgentLogsView />
                </div>
              </div>
            ) : (
              renderAgentConfig()
            )
          ) : activeTab === "config" ? (
            renderAgentConfig()
          ) : (
            <AgentLogsView />
          )}
        </div>

        {compositionOpen && isVersionContext && selectedVersion ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/35 p-3 backdrop-blur-[2px]">
            <div className="flex max-h-full w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <AgentVersionComposition
                versions={versions}
                initialBaselineVersionId={selectedVersion.id}
                onClose={() => setCompositionOpen(false)}
              />
            </div>
          </div>
        ) : null}
      </main>

      <Dialog
        open={publishDialogOpen}
        onOpenChange={(open) => {
          setPublishDialogOpen(open);
          if (!open) setVersionDescription("");
        }}
      >
        <DialogContent className="max-w-[520px] gap-0 overflow-hidden rounded-lg p-0">
          <DialogHeader className="border-b border-slate-200 px-5 py-4">
            <DialogTitle>{isWorkflow ? "\u53d1\u5e03\u5de5\u4f5c\u6d41\u667a\u80fd\u4f53" : "\u53d1\u5e03\u667a\u80fd\u4f53\u5e94\u7528"}</DialogTitle>
            <DialogDescription className="sr-only">{"\u786e\u8ba4\u7248\u672c\u53f7\u5e76\u586b\u5199\u672c\u6b21\u53d1\u5e03\u8bf4\u660e"}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-5 py-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">{"\u7248\u672c\u53f7"}</label>
              <div className="flex h-11 items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3">
                <span className="text-sm font-semibold text-slate-900">{nextVersionLabel}</span>
                <span className="text-xs text-slate-500">{"\u7cfb\u7edf\u81ea\u52a8\u9012\u589e\uff0c\u4e0d\u53ef\u4fee\u6539"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="publish-version-description" className="text-sm font-medium text-slate-800">
                <span className="mr-1 text-rose-500">*</span>{"\u7248\u672c\u63cf\u8ff0"}
              </label>
              <div className="relative">
                <textarea
                  id="publish-version-description"
                  aria-label={"\u7248\u672c\u63cf\u8ff0"}
                  value={versionDescription}
                  maxLength={500}
                  rows={5}
                  onChange={(event) => setVersionDescription(event.target.value)}
                  placeholder={"\u8bf7\u8f93\u5165\u672c\u6b21\u53d1\u5e03\u7684\u4e3b\u8981\u53d8\u66f4\uff0c\u4f8b\u5982\uff1a\u65b0\u589e\u5de5\u4f5c\u6d41\u8c03\u7528\u3001\u4f18\u5316\u89d2\u8272\u6307\u4ee4\u3001\u4fee\u590d\u77e5\u8bc6\u5e93\u56de\u7b54\u5f02\u5e38\u2026"}
                  className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2.5 pb-8 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <span className="absolute bottom-2.5 right-3 text-xs text-slate-400">{versionDescription.length}/500</span>
              </div>
            </div>

            <div className="rounded-md bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-800">
              {"\u53d1\u5e03\u6210\u529f\u540e\u5c06\u751f\u6210\u65b0\u7684\u7248\u672c\u8bb0\u5f55\uff0c\u5e76\u8bb0\u5f55\u53d1\u5e03\u65f6\u95f4\u3001\u53d1\u5e03\u4eba\u548c\u7248\u672c ID\u3002\u5f53\u524d\u8349\u7a3f\u5185\u5bb9\u5c06\u4f5c\u4e3a"} {nextVersionLabel} {"\u4e0a\u7ebf\u3002"}
            </div>
          </div>

          <DialogFooter className="border-t border-slate-200 px-5 py-4">
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)} className="rounded-md">{"\u53d6\u6d88"}</Button>
            <Button
              disabled={!versionDescription.trim()}
              onClick={handlePublishConfirm}
              className="rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {"\u786e\u8ba4\u53d1\u5e03"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AgentVersionHistoryDrawer
        open={historyOpen}
        versions={versions}
        entityLabel="该智能体"
        versionTotalCount={versionTotalCount}
        selectedVersionId={selectedVersionId}
        restoredDraft={restoredDraft}
        restoreConfirmOpen={restoreConfirmOpen}
        onOpenChange={setHistoryOpen}
        onSelectVersion={handleSelectVersion}
        onRestoreRequest={() => setRestoreConfirmOpen(true)}
        onRestoreConfirmChange={setRestoreConfirmOpen}
        onRestoreConfirm={handleRestoreConfirm}
        onDeleteVersion={handleDeleteVersion}
        onVersionAvailabilityChange={handleVersionAvailabilityChange}
      />
    </div>
  );
}
