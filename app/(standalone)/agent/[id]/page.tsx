"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  History,
  Rocket,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AgentLogsView } from "@/components/agent/agent-logs-view";
import { WorkflowEditor } from "@/components/workflow/workflow-editor";
import { AutonomousEditor } from "@/components/agent/autonomous-editor";
import {
  AgentVersionHistoryDrawer,
  type RestoredAgentDraft,
} from "@/components/agent/agent-version-history-drawer";
import { AgentAvailabilityControl } from "@/components/agent/agent-availability-control";
import { getAgentById } from "@/lib/agent-data";
import { AGENT_VERSION_HISTORY, buildVersionCompositionData, type AgentVersionRecord } from "@/lib/mock/agent-version-management";
import { ProtectionStatusBadge } from "@/components/security/ProtectionStatusBadge";
import { ExportConfigurationButton } from "@/components/import-export/export-configuration-button";
import { ImportDraftNotice, type ImportDraftResult } from "@/components/import-export/import-draft-notice";
import { ReferenceRelationshipDialog } from "@/components/reference-relations/reference-relationship-dialog";
import {
  SecurityLevelBadge,
} from "@/components/security/security-level-badge";
import {
  ApprovalInteractionPanel,
  type ApprovalFeedback,
} from "@/components/security/approval-interaction-panel";
import {
  buildSecurityLevelSelectOptions,
  SECURITY_LEVELS,
  isHighSecurityLevel,
  getApprovalActionState,
  type ApprovalStatus,
  type SecurityLevel,
} from "@/lib/security-level";
import { cn } from "@/lib/utils";

function createApprovalRequestId() {
  return `AF-${Date.now().toString().slice(-8)}`;
}

function formatApprovalTime() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

interface AgentDetailData {
  type: "autonomous" | "workflow";
  name: string;
  description: string;
  prompt: string;
  openingStatement: string;
  suggestedQuestions: string[];
  knowledgeBases?: Array<{
    id: string;
    name: string;
    itemCount: number;
    createTime: string;
    source?: string;
    securityLevel?: SecurityLevel;
  }>;
  workflows?: Array<{
    id: string;
    name: string;
    description?: string;
    updateTime?: string;
    securityLevel?: SecurityLevel;
  }>;
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
    suggestedQuestions: ["分析当前传感器读数", "预测设备故障概率"],
    knowledgeBases: [
      {
        id: "kb-project-ready-30s",
        name: "项目准备测试_30s",
        itemCount: 1,
        createTime: "2026-10-19 13:59:35",
        securityLevel: "秘密",
      },
    ],
    workflows: [
      {
        id: "workflow-device-inspection",
        name: "设备巡检工作流",
        description: "执行设备巡检、异常识别与维修建议生成。",
        updateTime: "2026-08-18 15:08:26",
        securityLevel: "内部",
      },
      {
        id: "workflow-device-alert",
        name: "设备告警联动工作流",
        description: "联动告警通知与设备处置流程。",
        updateTime: "2026-07-26 11:42:08",
        securityLevel: "秘密",
      },
    ],
    plugins: ["Sensor Data Analyzer"],
    mockReply: "正在分析传感器数据... 检测到异常模式。建议在 48 小时内进行维护检查。",
  },
  "flow-01": {
    type: "workflow",
    name: "数据清洗工作流",
    description: "自动化数据清洗和预处理工作流，支持多数据源输入和标准化输出。",
    prompt: "这是一个工作流智能体，通过可视化流程节点执行数据处理任务。",
    openingStatement: "欢迎使用数据清洗工作流。请提供数据源，我将自动执行清洗流程。",
    suggestedQuestions: ["开始数据清洗流程", "查看工作流配置"],
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
    mockReply:
      "我可以进行实时态势分析和威胁评估。请提供目标信息（如位置、特征等），我会：\n1. 通过本体检索关联情报对象\n2. 进行身份识别和融合\n3. 调用视觉模型分析目标状态\n4. 综合评估威胁等级并生成研判报告。",
  },
} satisfies Record<string, AgentDetailData>;



export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params?.id as string;
  const agentData = agentId ? AGENTS_DETAIL_DATA[agentId] || null : null;
  const agentProfile = agentId ? getAgentById(agentId) : null;
  const isWorkflow = agentProfile?.type === "workflow";
  const entityLabel = isWorkflow ? "工作流智能体" : "智能体";
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
      listingStatus: isWorkflow ? "未上架" as const : version.listingStatus,
      snapshot,
      ...buildVersionCompositionData(snapshot, version.resources, version.label),
    };
  }));
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [versionDetailMode, setVersionDetailMode] = useState(false);
  const [versionView, setVersionView] = useState<"config" | "logs">("config");
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState<RestoredAgentDraft | null>({ sourceLabel: "", issues: [] });
  const [restoreToDraftVersion, setRestoreToDraftVersion] = useState<string | null>(null);
  const currentDraftConfigRef = useRef<unknown>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [versionDescription, setVersionDescription] = useState("");
  const [publishApprovalReason, setPublishApprovalReason] = useState("");
  const [entityDisabled, setEntityDisabled] = useState(false);
  const batchDisabledVersionIds = useRef<Set<string>>(new Set());

  const initialDisplayName = agentData?.name || agentProfile?.name || "加载中...";
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const selectedVersion = versions.find((version) => version.id === selectedVersionId) ?? null;
  const [publishStatus, setPublishStatus] = useState<"已发布" | "未发布">(
    agentProfile?.publishStatus ?? "未发布"
  );
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>(
    agentProfile?.securityLevel ?? "公开"
  );
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(
    agentProfile?.approvalStatus ?? "none"
  );
  const [securityChangeOpen, setSecurityChangeOpen] = useState(false);
  const [securityChangeDraft, setSecurityChangeDraft] = useState({
    targetLevel: (agentProfile?.securityLevel ?? "公开") as SecurityLevel,
    reason: "",
  });
  const [draftSecurityOpen, setDraftSecurityOpen] = useState(false);
  const [draftSecurityLevel, setDraftSecurityLevel] = useState<SecurityLevel>(
    agentProfile?.securityLevel ?? "公开"
  );
  const [securityChangeError, setSecurityChangeError] = useState("");
  const [pendingSecurityRequest, setPendingSecurityRequest] = useState<{
    requestId: string;
    fromLevel: SecurityLevel;
    targetLevel: SecurityLevel;
    reason: string;
    submittedAt: string;
  } | null>(null);
  const [pendingPublishRequest, setPendingPublishRequest] = useState<{
    requestId: string;
    action: "create" | "publish";
    description: string;
    approvalReason: string;
    submittedAt: string;
  } | null>(null);
  const [approvalFeedback, setApprovalFeedback] = useState<ApprovalFeedback | null>(null);
  const [importResult, setImportResult] = useState<ImportDraftResult | null>(null);
  const [importOperation, setImportOperation] = useState<"create" | "overwrite">("overwrite");
  const [hasBlockingIssues, setHasBlockingIssues] = useState(false);

  const isPublished = publishStatus === "已发布";

  const isHistorical = Boolean(versionDetailMode && selectedVersion);
  const isVersionContext = Boolean(versionDetailMode && selectedVersion);
  const approvalAction = getApprovalActionState(approvalStatus);
  const configReadOnly = isHistorical || approvalAction.configLocked;
  const nextVersionNumber = versions.reduce((highest, version) => {
    const parsed = Number(version.label.replace(/^V/, ""));
    return Number.isInteger(parsed) ? Math.max(highest, parsed) : highest;
  }, 0) + 1;
  const nextVersionLabel = `V${nextVersionNumber}`;

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const result = urlSearchParams.get("importResult");
    if (result !== "success" && result !== "success_with_warnings") return;
    setImportResult(result);
    setImportOperation(urlSearchParams.get("importMode") === "overwrite" ? "overwrite" : "create");
    setDisplayName(
      urlSearchParams.get("objectType") === "autonomous_agent"
        ? "开源情报分析助手"
        : "智能客服分流助手"
    );
    const importedSecurityLevel = urlSearchParams.get("securityLevel") as SecurityLevel | null;
    if (importedSecurityLevel && SECURITY_LEVELS.includes(importedSecurityLevel)) {
      setSecurityLevel(importedSecurityLevel);
      setDraftSecurityLevel(importedSecurityLevel);
    }
    setPublishStatus("未发布");
  }, []);

  const handleSelectVersion = (versionId: string | null) => {
    setRestoreToDraftVersion(null);
    if (versionId === null) {
      setSelectedVersionId(null);
      setVersionDetailMode(false);
      setVersionView("config");
      setActiveTab("config");
      return;
    }

    const targetVersion = versions.find((version) => version.id === versionId);
    if (!targetVersion) return;

    setSelectedVersionId(versionId);
    setVersionDetailMode(true);
    setVersionView("config");
    setActiveTab("config");
  };

  const returnToCurrentDraft = () => {
    setRestoreToDraftVersion(null);
    setSelectedVersionId(null);
    setVersionDetailMode(false);
    setVersionView("config");
    setActiveTab("config");
  };

  const handleRestoreConfirm = () => {
    if (!selectedVersion) return;
    const restored: RestoredAgentDraft = {
      sourceLabel: selectedVersion.label,
      issues: selectedVersion.restoreIssues ?? [],
      notice: `${selectedVersion.label} 已还原为当前草稿`,
    };
    setRestoredDraft(restored);
    setRestoreToDraftVersion(selectedVersion.label);
    setRestoreConfirmOpen(false);
    setHistoryOpen(false);
    setSelectedVersionId(null);
    setVersionDetailMode(false);
    setVersionView("config");
    setActiveTab("config");
    toast.success(`${selectedVersion.label} 已还原为当前草稿`);
  };

  const handleHistoricalReferenceAction = (action: "update" | "reconfigure") => {
    if (!selectedVersion) return;
    setRestoredDraft({
      sourceLabel: selectedVersion.label,
      issues: selectedVersion.restoreIssues ?? [],
      notice: `${selectedVersion.label} 已复制到当前草稿`,
    });
    setRestoreToDraftVersion(selectedVersion.label);
    setHistoryOpen(false);
    setSelectedVersionId(null);
    setVersionDetailMode(false);
    setVersionView("config");
    setActiveTab("config");
    toast.success(
      action === "update"
        ? `${selectedVersion.label} 已复制到当前草稿，请确认引用更新`
        : `${selectedVersion.label} 已复制到当前草稿，请重新配置引用`
    );
  };

  const finalizePublish = (description: string, requestId?: string) => {
    const sourceVersion = versions.find((version) => version.isLatest) ?? versions[0];
    if (!sourceVersion) return;

    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    const publishedAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
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
      listingStatus: "未上架",
      description,
      publisher: "\u7528\u6237A",
      publishedAt,
      versionId: `demo-version-agent-001-${versionSlug}`,
      snapshot,
      ...composition,
      configSnapshot: {
        ...composition.configSnapshot,
        editorState: currentDraftConfigRef.current,
      },
      resources,
    };

    setVersions((current) => [newVersion, ...current.map((version) => ({ ...version, isLatest: false }))]);
    setRestoredDraft({ sourceLabel: "", issues: [] });
    setVersionDescription("");
    setPublishApprovalReason("");
    setPublishDialogOpen(false);
    setHistoryOpen(true);
    setPublishStatus("已发布");
    setApprovalStatus("none");
    setPendingPublishRequest(null);
    if (requestId) {
      setApprovalFeedback({
        tone: "success",
        title: `${nextVersionLabel} 已发布`,
        description: `新版本已生成，并沿用资源密级「${securityLevel}」。`,
        requestId,
        canTestDuplicate: true,
      });
    }
    toast.success(`${nextVersionLabel} \u53d1\u5e03\u6210\u529f`);
  };

  const handlePublishConfirm = () => {
    const description = versionDescription.trim();
    const approvalReason = publishApprovalReason.trim();
    if (!description || (isHighSecurityLevel(securityLevel) && !approvalReason) || isHistorical) return;
    const approvalAction = getApprovalActionState(approvalStatus);
    if (approvalAction.publishLocked) {
      toast.info(approvalAction.publishTitle ?? "审批中，暂不可发布。");
      return;
    }
    if (isHighSecurityLevel(securityLevel)) {
      const requestId = createApprovalRequestId();
      setPendingPublishRequest({
        requestId,
        action: isPublished ? "publish" : "create",
        description,
        approvalReason,
        submittedAt: formatApprovalTime(),
      });
      setApprovalFeedback(null);
      setApprovalStatus(isPublished ? "publish" : "create");
      setPublishDialogOpen(false);
      setVersionDescription("");
      setPublishApprovalReason("");
      toast.success(
        isPublished
          ? `${nextVersionLabel} 发布申请已提交，当前已发布版本可继续使用。`
          : "高密智能体创建申请已提交，审批通过后方可进入配置或使用。"
      );
      return;
    }
    finalizePublish(description);
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

  const handleEntityDisabledChange = (disabled: boolean) => {
    if (disabled) {
      const ids = versions
        .filter((version) => version.availabilityStatus === "启用")
        .map((version) => version.id);
      batchDisabledVersionIds.current = new Set(ids);
      setVersions((current) => current.map((version) => (
        ids.includes(version.id) ? { ...version, availabilityStatus: "停用" as const } : version
      )));
    } else {
      const ids = batchDisabledVersionIds.current;
      setVersions((current) => current.map((version) => (
        ids.has(version.id) ? { ...version, availabilityStatus: "启用" as const } : version
      )));
      batchDisabledVersionIds.current = new Set();
    }
    setEntityDisabled(disabled);
    toast.success(disabled ? `${entityLabel}已停用` : `${entityLabel}已重新启用`);
  };
  const renderAgentConfig = () => (
    <div
      aria-readonly={configReadOnly}
      className={configReadOnly
        ? "h-full w-full bg-slate-50 [&_button:disabled]:cursor-not-allowed [&_input:disabled]:cursor-not-allowed [&_input]:!border-slate-200 [&_input]:!bg-slate-100 [&_input]:!text-slate-500 [&_select:disabled]:cursor-not-allowed [&_select]:!border-slate-200 [&_select]:!bg-slate-100 [&_select]:!text-slate-500 [&_textarea:disabled]:cursor-not-allowed [&_textarea]:!border-slate-200 [&_textarea]:!bg-slate-100 [&_textarea]:!text-slate-500 [&_[contenteditable='true']]:!cursor-not-allowed [&_[contenteditable='true']]:!bg-slate-100 [&_[contenteditable='true']]:!text-slate-500"
        : "h-full w-full"}
    >
      {isWorkflow ? (
        <WorkflowEditor
          agentId={agentId}
          importResult={importResult}
          importObjectType="workflow_agent"
          onBlockingIssueChange={setHasBlockingIssues}
          readOnly={configReadOnly}
          securityLevel={securityLevel}
          snapshotVersion={isHistorical ? selectedVersion?.label ?? null : null}
          showReferenceAlerts={!isHistorical}
          historicalConfigSnapshot={selectedVersion?.configSnapshot.editorState}
          restoreToDraftVersion={restoreToDraftVersion}
          onDraftSnapshotChange={(snapshot) => {
            currentDraftConfigRef.current = snapshot;
          }}
          onOpenNodeConfig={() => setHistoryOpen(false)}
          onRequestDraftAction={handleHistoricalReferenceAction}
          onSecurityLevelChangeRequest={handleOpenSecurityEditor}
          securityLevelChangeDisabled={
            isHistorical || approvalStatus !== "none" || !canRaiseSecurityLevel
          }
          securityLevelChangeTitle={
            isHistorical
              ? "历史版本不可修改密级"
              : approvalStatus !== "none"
                ? approvalAction.securityChangeTitle ?? "审批中，暂不可修改密级"
                : canRaiseSecurityLevel
                  ? "修改密级"
                  : "当前已是可选最高密级"
          }
        />
      ) : (
        <fieldset disabled={configReadOnly} className="h-full w-full min-w-0 border-0 p-0">
          <AutonomousEditor
            agentId={agentId}
            initialAgentData={agentData || undefined}
            snapshotVersion={isHistorical ? selectedVersion?.label ?? null : null}
            showReferenceAlerts={!isHistorical}
            historicalConfigSnapshot={selectedVersion?.configSnapshot.editorState}
            restoreToDraftVersion={restoreToDraftVersion}
            onDraftSnapshotChange={(snapshot) => {
              currentDraftConfigRef.current = snapshot;
            }}
            onNameChange={setDisplayName}
            securityLevel={securityLevel}
            onSecurityLevelChangeRequest={handleOpenSecurityEditor}
            securityLevelChangeDisabled={
              isHistorical || approvalStatus !== "none" || !canRaiseSecurityLevel
            }
            securityLevelChangeTitle={
              isHistorical
                ? "历史版本不可修改密级"
                : approvalStatus !== "none"
                  ? approvalAction.securityChangeTitle ?? "审批中，暂不可修改密级"
                  : canRaiseSecurityLevel
                    ? "修改密级"
                    : "当前已是可选最高密级"
            }
          />
        </fieldset>
      )}
    </div>
  );

  function handleOpenPublishDialog() {
    if (hasBlockingIssues) {
      toast.error("存在待关联或异常节点，请完成配置后再发布。");
      return;
    }
    const action = getApprovalActionState(approvalStatus);
    if (action.publishLocked) {
      toast.info(action.publishTitle ?? "审批中，暂不可发布。");
      return;
    }
    setPublishDialogOpen(true);
  }

  function handleSubmitSecurityChange() {
    const reason = securityChangeDraft.reason.trim();
    if (!reason) {
      setSecurityChangeError("请填写申请原因后再提交。");
      toast.error("请填写申请原因。");
      return;
    }
    if (securityChangeDraft.targetLevel === securityLevel) {
      setSecurityChangeError("目标密级必须高于当前密级。");
      toast.error("请选择与当前不同的目标密级。");
      return;
    }
    const requestId = createApprovalRequestId();
    setPendingSecurityRequest({
      requestId,
      fromLevel: securityLevel,
      targetLevel: securityChangeDraft.targetLevel,
      reason,
      submittedAt: formatApprovalTime(),
    });
    setSecurityChangeError("");
    setApprovalFeedback(null);
    setApprovalStatus("securityChange");
    setSecurityChangeOpen(false);
    toast.success(`升密申请已提交，审批通过前资源保持「${securityLevel}」。`);
  }

  function handleSimulateApprovalStartFailure() {
    setSecurityChangeError("申请提交失败，资源密级未发生变化。请稍后重试。");
    toast.error("审批发起失败，申请未提交。资源状态未变化。");
  }

  function handleSaveDraftSecurity() {
    const previousLevel = securityLevel;
    setSecurityLevel(draftSecurityLevel);
    setDraftSecurityOpen(false);
    setApprovalFeedback({
      tone: "success",
      title: `密级已提升至「${draftSecurityLevel}」`,
      description: `资源首次发布前可直接调整。本次由「${previousLevel}」提升，不会生成新版本。`,
    });
    toast.success("密级已更新，首次发布前升密无需审批。");
  }

  function getDefaultSecurityTarget() {
    return (
      buildSecurityLevelSelectOptions({ currentLevel: securityLevel }).find(
        (option) => !option.disabled
      )?.value ?? securityLevel
    );
  }

  function handleOpenSecurityEditor() {
    if (approvalStatus !== "none") {
      toast.info(approvalAction.securityChangeTitle ?? "审批中，暂不可修改密级。");
      return;
    }
    if (!canRaiseSecurityLevel) {
      toast.info("当前已是可选最高密级。");
      return;
    }
    if (isPublished) {
      setSecurityChangeDraft({ targetLevel: getDefaultSecurityTarget(), reason: "" });
      setSecurityChangeError("");
      setSecurityChangeOpen(true);
      return;
    }
    setDraftSecurityLevel(getDefaultSecurityTarget());
    setDraftSecurityOpen(true);
  }

  function clearPendingApproval() {
    setPendingSecurityRequest(null);
    setPendingPublishRequest(null);
    setApprovalStatus("none");
  }

  function handleApprovalResult(result: "approved" | "rejected" | "withdrawn" | "writebackFailed") {
    const requestId = pendingSecurityRequest?.requestId ?? pendingPublishRequest?.requestId;

    if (result === "writebackFailed") {
      setApprovalFeedback({
        tone: "danger",
        title: "状态同步失败",
        description: "审批结果暂未同步完成，资源保持原状态。请稍后重试。",
        requestId,
        canRetry: true,
      });
      toast.error("状态同步失败，资源保持原状态。");
      return;
    }

    if (result === "approved") {
      if (approvalStatus === "securityChange" && pendingSecurityRequest) {
        const { targetLevel, fromLevel } = pendingSecurityRequest;
        setSecurityLevel(targetLevel);
        setApprovalFeedback({
          tone: "success",
          title: `密级已提升至「${targetLevel}」`,
          description: `该资源及全部版本已由「${fromLevel}」统一调整，系统将重新校验访问和引用关系。`,
          requestId,
          canTestDuplicate: true,
        });
        clearPendingApproval();
        toast.success(`资源密级已更新为「${targetLevel}」。`);
        return;
      }
      if (approvalStatus === "publish" && pendingPublishRequest) {
        finalizePublish(pendingPublishRequest.description, pendingPublishRequest.requestId);
        return;
      }
      setApprovalFeedback({
        tone: "success",
        title: "申请已处理",
        description: "资源状态已更新，相关操作已恢复。",
        requestId,
        canTestDuplicate: true,
      });
      clearPendingApproval();
      return;
    }

    const rejected = result === "rejected";
    setApprovalFeedback({
      tone: rejected ? "warning" : "info",
      title: rejected ? "申请未通过" : "申请已撤回",
      description: rejected
        ? "资源保持原状态，相关操作已恢复。"
        : "资源保持原状态，相关操作已恢复。",
      requestId,
    });
    clearPendingApproval();
    toast.info(rejected ? "申请未通过，资源保持原状态。" : "申请已撤回，资源保持原状态。");
  }

  function handleDuplicateApprovalCallback() {
    setApprovalFeedback((current) => current ? {
      ...current,
      tone: "info",
      title: "重复结果已忽略",
      description: "该申请已经处理完成，本次重复结果未再次修改密级或生成版本。",
      canTestDuplicate: false,
    } : current);
    toast.info("重复结果已忽略。");
  }

  const activeApprovalRequest = pendingSecurityRequest ?? pendingPublishRequest;
  const activeApprovalSummary = pendingSecurityRequest
    ? `已申请从「${pendingSecurityRequest.fromLevel}」提升至「${pendingSecurityRequest.targetLevel}」。审批通过前仍按原密级控制访问。`
    : pendingPublishRequest
      ? pendingPublishRequest.action === "create"
        ? "高密智能体创建申请已提交，审批通过后方可进入配置或使用。"
        : `${nextVersionLabel} 发布申请已提交，审批通过后才会生成新版本。`
      : undefined;
  const securityChangeOptions = buildSecurityLevelSelectOptions({ currentLevel: securityLevel }).filter(
    (option) => !option.disabled
  );
  const canRaiseSecurityLevel = securityChangeOptions.length > 0;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[linear-gradient(180deg,#fbfcfe_0%,#f5f7fb_45%,#eef4ff_100%)]">
      <header className="relative flex h-20 flex-none items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur">
        <div className="flex min-w-0 items-center gap-4">
          <Button
            variant="ghost"
            className="gap-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm hover:bg-slate-50 hover:text-slate-900"
            onClick={() => router.push("/agent")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">返回</span>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex min-w-0 items-center gap-2">
            <span className="max-w-[240px] truncate text-base font-semibold text-slate-950">{displayName}</span>
            <span
              className={cn("shrink-0", isPublished && "cursor-not-allowed opacity-70")}
              title={isPublished ? "已发布密级已锁定" : undefined}
            >
              <SecurityLevelBadge
                level={securityLevel}
                className={isPublished ? "bg-slate-100 text-slate-400" : undefined}
              />
            </span>
            <ApprovalInteractionPanel
              pending={approvalStatus !== "none" && !approvalFeedback?.canRetry}
              approvalLabel={
                pendingSecurityRequest
                  ? "密级提升审批中"
                  : pendingPublishRequest
                    ? "发布审批中"
                    : approvalAction.configTitle
              }
              summary={activeApprovalSummary}
              requestId={activeApprovalRequest?.requestId}
              submittedAt={activeApprovalRequest?.submittedAt}
              existingVersionContinues={isPublished}
              feedback={approvalFeedback}
              onApprove={() => handleApprovalResult("approved")}
              onReject={() => handleApprovalResult("rejected")}
              onWithdraw={() => handleApprovalResult("withdrawn")}
              onWritebackFailure={() => handleApprovalResult("writebackFailed")}
              onRetry={() => handleApprovalResult("approved")}
              onDuplicateCallback={handleDuplicateApprovalCallback}
              onDismissFeedback={() => setApprovalFeedback(null)}
            />
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
          <ReferenceRelationshipDialog
            objectType={isWorkflow ? "workflow_agent" : "autonomous_agent"}
            objectId={agentId}
            objectName={displayName}
            objectStatus={isPublished ? "已发布" : "草稿"}
          />
          {isPublished ? (
            <ExportConfigurationButton
              objectType={isWorkflow ? "workflow_agent" : "autonomous_agent"}
              objectName={displayName}
              sourceType="published"
              sourceVersion="V3"
              securityLevel={securityLevel}
            />
          ) : null}
          <ProtectionStatusBadge
            protectionTaskName="GF专属防护"
            protectionTaskId="1"
            protectionTypes={["policy", "lexicon"]}
          />
          <AgentAvailabilityControl
            entityLabel={entityLabel}
            disabled={entityDisabled}
            hasListedVersion={versions.some((version) => version.listingStatus === "已上架")}
            locked={approvalStatus !== "none"}
            lockedReason={approvalAction.configTitle}
            onDisabledChange={handleEntityDisabledChange}
          />
          <TooltipProvider delayDuration={200}>
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

          <Button
            disabled={isHistorical || approvalAction.publishLocked || hasBlockingIssues}
            title={
              isHistorical
                ? "\u5386\u53f2\u7248\u672c\u4e0d\u53ef\u53d1\u5e03"
                : hasBlockingIssues
                  ? "存在待关联或异常节点，完成配置后才能发布"
                  : approvalAction.publishTitle ?? "发布"
            }
            onClick={handleOpenPublishDialog}
            className="rounded-2xl bg-slate-900 px-4 text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.8)] hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Rocket className="h-4 w-4" />
            发布
          </Button>
        </div>
      </header>

      {importResult ? (
        <ImportDraftNotice
          objectType={isWorkflow ? "workflow_agent" : "autonomous_agent"}
          result={importResult}
          operation={importOperation}
        />
      ) : null}

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
      ) : null}

      {!isHistorical && approvalStatus === "none" && !approvalFeedback && restoredDraft?.issues.length ? (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              {restoredDraft.notice ?? `${restoredDraft.sourceLabel} 已还原为当前草稿`}
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

      </main>

      <Dialog
        open={publishDialogOpen}
        onOpenChange={(open) => {
          setPublishDialogOpen(open);
          if (!open) {
            setVersionDescription("");
            setPublishApprovalReason("");
          }
        }}
      >
        <DialogContent className="flex max-h-[calc(100vh-32px)] max-w-[560px] flex-col gap-0 overflow-hidden rounded-lg p-0">
          <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-4">
            <DialogTitle>
              {!isPublished && isHighSecurityLevel(securityLevel)
                ? `提交${isWorkflow ? "工作流智能体" : "自主规划智能体"}创建申请`
                : isWorkflow
                  ? "发布工作流智能体"
                  : "发布智能体应用"}
            </DialogTitle>
            <DialogDescription className="sr-only">{"\u786e\u8ba4\u7248\u672c\u53f7\u5e76\u586b\u5199\u672c\u6b21\u53d1\u5e03\u8bf4\u660e"}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">{"\u7248\u672c\u53f7"}</label>
              <div className="flex h-11 items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3">
                <span className="text-sm font-semibold text-slate-900">{nextVersionLabel}</span>
                <span className="text-xs text-slate-500">{"\u7cfb\u7edf\u81ea\u52a8\u9012\u589e\uff0c\u4e0d\u53ef\u4fee\u6539"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-800">资源密级</p>
                <p className="mt-1 text-xs text-slate-500">新版本沿用资源当前密级，不单独设置。</p>
              </div>
              <SecurityLevelBadge level={securityLevel} />
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
                  rows={4}
                  onChange={(event) => setVersionDescription(event.target.value)}
                  placeholder={"\u8bf7\u8f93\u5165\u672c\u6b21\u53d1\u5e03\u7684\u4e3b\u8981\u53d8\u66f4\uff0c\u4f8b\u5982\uff1a\u65b0\u589e\u5de5\u4f5c\u6d41\u8c03\u7528\u3001\u4f18\u5316\u89d2\u8272\u6307\u4ee4\u3001\u4fee\u590d\u77e5\u8bc6\u5e93\u56de\u7b54\u5f02\u5e38\u2026"}
                  className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2.5 pb-8 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <span className="absolute bottom-2.5 right-3 text-xs text-slate-400">{versionDescription.length}/500</span>
              </div>
            </div>

            {isHighSecurityLevel(securityLevel) && (
              <div className="space-y-2">
                <label htmlFor="publish-approval-reason" className="text-sm font-medium text-slate-800">
                  <span className="mr-1 text-rose-500">*</span>申请原因
                </label>
                <div className="relative">
                  <textarea
                    id="publish-approval-reason"
                    aria-label="申请原因"
                    value={publishApprovalReason}
                    maxLength={500}
                    rows={3}
                    onChange={(event) => setPublishApprovalReason(event.target.value)}
                    placeholder="请说明发布该高密资源的业务原因、使用场景和必要性"
                    className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2.5 pb-8 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="absolute bottom-2.5 right-3 text-xs text-slate-400">{publishApprovalReason.length}/500</span>
                </div>
                <p className="text-xs text-slate-400">该内容将随发布申请提交给审批人，不写入版本记录。</p>
              </div>
            )}

            <div className={cn(
              "rounded-md px-3 py-2.5 text-xs leading-5",
              isHighSecurityLevel(securityLevel)
                ? "border border-amber-200 bg-amber-50 text-amber-800"
                : "bg-blue-50 text-blue-800"
            )}>
              {isHighSecurityLevel(securityLevel)
                ? !isPublished
                  ? `当前资源为${securityLevel}。版本描述用于记录初始配置，申请原因将用于创建审批；审批通过后方可进入配置或使用。`
                  : `当前资源为${securityLevel}。版本描述将写入版本记录，申请原因将用于发布审批；审批通过后生成 ${nextVersionLabel}，当前已发布版本不受影响。`
                : `${nextVersionLabel} 将沿用资源当前密级，发布成功后生成新版本记录。`}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)} className="rounded-md">{"\u53d6\u6d88"}</Button>
            <Button
              disabled={!versionDescription.trim() || (isHighSecurityLevel(securityLevel) && !publishApprovalReason.trim())}
              onClick={handlePublishConfirm}
              className="rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isHighSecurityLevel(securityLevel)
                ? isPublished ? "提交发布申请" : "提交创建申请"
                : "确认发布"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={draftSecurityOpen} onOpenChange={setDraftSecurityOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-[600px]">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-xl font-semibold text-slate-950">修改密级</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 px-6 py-5">
            <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-400">资源名称</span>
              <span className="truncate text-slate-800">{displayName}</span>
              <span className="text-slate-400">资源类型</span>
              <span className="text-slate-800">{isWorkflow ? "工作流智能体" : "自主规划智能体"}</span>
              <span className="text-slate-400">当前密级</span>
              <SecurityLevelBadge level={securityLevel} />
            </div>
            <div className="space-y-2">
              <Label>
                <span className="text-rose-500">*</span> 目标密级
              </Label>
              <Select
                value={draftSecurityLevel}
                onValueChange={(value) => setDraftSecurityLevel(value as SecurityLevel)}
                options={securityChangeOptions}
                className="h-10 bg-white"
              />
              <p className="text-xs text-slate-400">仅可选择高于当前密级且不超过你权限范围的密级。</p>
            </div>
            <div className="rounded-md bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-700">
              保存后立即生效，资源及全部版本将统一使用新密级；本次调整不会生成新版本。
            </div>
          </div>
          <DialogFooter className="flex-row justify-end border-t border-slate-100 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setDraftSecurityOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              disabled={draftSecurityLevel === securityLevel}
              className="min-w-24 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
              onClick={handleSaveDraftSecurity}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={securityChangeOpen} onOpenChange={setSecurityChangeOpen}>
        <DialogContent className="grid max-h-[calc(100vh-1.5rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-[600px]">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-xl font-semibold text-slate-950">申请修改密级</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 space-y-5 overflow-y-auto px-6 py-5">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
              <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
              <span>
                提升密级需要提交审批。审批通过前资源仍按当前密级运行；审批期间不可编辑、发布、删除或再次提交申请。
              </span>
            </div>

            <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-400">资源名称</span>
              <span className="truncate text-slate-800">{displayName}</span>
              <span className="text-slate-400">资源类型</span>
              <span className="text-slate-800">{isWorkflow ? "工作流智能体" : "自主规划智能体"}</span>
              <span className="text-slate-400">当前密级</span>
              <SecurityLevelBadge level={securityLevel} />
            </div>

            <div className="space-y-2">
              <Label>
                <span className="text-rose-500">*</span> 目标密级
              </Label>
              <Select
                value={securityChangeDraft.targetLevel}
                onValueChange={(value) =>
                  setSecurityChangeDraft((current) => ({
                    ...current,
                    targetLevel: value as SecurityLevel,
                  }))
                }
                options={securityChangeOptions}
                className="h-10 bg-white"
              />
              <p className="text-xs text-slate-400">仅展示高于当前密级且在你权限范围内的可选密级。</p>
              <p className="rounded-md bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-700">
                审批通过后，资源及全部版本将统一调整为「{securityChangeDraft.targetLevel}」；低于该密级的用户将无法访问。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-security-reason">
                <span className="text-rose-500">*</span> 申请原因
              </Label>
              <Textarea
                id="agent-security-reason"
                value={securityChangeDraft.reason}
                onChange={(event) =>
                  {
                    setSecurityChangeDraft((current) => ({
                      ...current,
                      reason: event.target.value,
                    }));
                    if (event.target.value.trim()) setSecurityChangeError("");
                  }
                }
                rows={4}
                placeholder="请说明提升密级的业务原因"
                aria-invalid={Boolean(securityChangeError)}
                className={cn(
                  "resize-none border-slate-200 bg-white shadow-none",
                  securityChangeError ? "border-rose-300 focus-visible:ring-rose-200" : "border-slate-200"
                )}
              />
              {securityChangeError ? (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{securityChangeError}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-400">申请原因将提交给审批人，请准确说明业务背景。</p>
              )}
            </div>
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer select-none hover:text-slate-600">原型演示</summary>
              <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
                <span>模拟申请提交失败，验证资源状态不变且可以重试。</span>
                <Button type="button" size="sm" variant="outline" className="h-7 shrink-0 bg-white text-xs" onClick={handleSimulateApprovalStartFailure}>
                  模拟失败
                </Button>
              </div>
            </details>
          </div>
          <DialogFooter className="flex-row justify-end border-t border-slate-100 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setSecurityChangeOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              disabled={securityChangeDraft.targetLevel === securityLevel}
              className="min-w-28 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
              onClick={handleSubmitSecurityChange}
            >
              提交审批
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AgentVersionHistoryDrawer
        open={historyOpen}
        versions={versions}
        selectedVersionId={selectedVersionId}
        restoredDraft={restoredDraft}
        entityDisabled={entityDisabled}
        securityLevel={securityLevel}
        actionsLocked={approvalStatus !== "none"}
        lockedReason={approvalAction.configTitle}
        restoreConfirmOpen={restoreConfirmOpen}
        onOpenChange={setHistoryOpen}
        onSelectVersion={handleSelectVersion}
        onRestoreRequest={() => setRestoreConfirmOpen(true)}
        onRestoreConfirmChange={setRestoreConfirmOpen}
        onRestoreConfirm={handleRestoreConfirm}
        onVersionAvailabilityChange={handleVersionAvailabilityChange}
      />
    </div>
  );
}
