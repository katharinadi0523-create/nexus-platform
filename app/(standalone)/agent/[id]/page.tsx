"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AgentLogsView } from "@/components/agent/agent-logs-view";
import { WorkflowEditor } from "@/components/workflow/workflow-editor";
import { AutonomousEditor } from "@/components/agent/autonomous-editor";
import { getAgentById } from "@/lib/agent-data";
import { ProtectionStatusBadge } from "@/components/security/ProtectionStatusBadge";
import {
  SecurityLevelBadge,
} from "@/components/security/security-level-badge";
import {
  buildSecurityLevelSelectOptions,
  isHighSecurityLevel,
  getApprovalActionState,
  type ApprovalStatus,
  type SecurityLevel,
} from "@/lib/security-level";
import { cn } from "@/lib/utils";

// 定义详细数据源
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
    suggestedQuestions: ["分析当前传感器读数", "预测设备故障概率"],
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
  const [activeTab, setActiveTab] = useState<"config" | "logs">("config");

  const agentData = agentId ? AGENTS_DETAIL_DATA[agentId] || null : null;
  const agentProfile = agentId ? getAgentById(agentId) : null;
  const isWorkflow = agentProfile?.type === "workflow";
  const initialDisplayName = agentData?.name || agentProfile?.name || "加载中...";
  const [displayName, setDisplayName] = useState(initialDisplayName);
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

  const isPublished = publishStatus === "已发布";

  useEffect(() => {
    setDisplayName(initialDisplayName);
  }, [initialDisplayName]);

  useEffect(() => {
    if (!agentProfile) return;
    setPublishStatus(agentProfile.publishStatus ?? "未发布");
    setSecurityLevel(agentProfile.securityLevel ?? "公开");
    setApprovalStatus(agentProfile.approvalStatus ?? "none");
    setDraftSecurityLevel(agentProfile.securityLevel ?? "公开");
  }, [agentProfile]);

  function handlePublish() {
    const action = getApprovalActionState(approvalStatus);
    if (action.publishLocked) {
      toast.info(action.publishTitle ?? "审批中，暂不可发布。");
      return;
    }

    if (isHighSecurityLevel(securityLevel)) {
      setApprovalStatus("publish");
      toast.success(
        isPublished
          ? `已提交发布审批：${displayName}，审批通过前仍按当前已发布版本运行。`
          : `已提交发布审批：${displayName}，审批通过后方可生效。`
      );
      return;
    }

    setPublishStatus("已发布");
    setApprovalStatus("none");
    toast.success(`已发布：${displayName}`);
  }

  function handleSubmitSecurityChange() {
    const reason = securityChangeDraft.reason.trim();
    if (!reason) {
      toast.error("请填写申请原因。");
      return;
    }
    if (securityChangeDraft.targetLevel === securityLevel) {
      toast.error("请选择与当前不同的目标密级。");
      return;
    }
    setApprovalStatus("securityChange");
    setSecurityChangeOpen(false);
    toast.success("已提交密级修改审批，审批通过后方可生效。");
  }

  function handleSaveDraftSecurity() {
    setSecurityLevel(draftSecurityLevel);
    setDraftSecurityOpen(false);
    toast.success("密级已更新。");
  }

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
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate text-base font-semibold text-slate-950">{displayName}</span>
            <span
              className={cn(isPublished && "cursor-not-allowed opacity-70")}
              title={isPublished ? "已发布密级已锁定" : undefined}
            >
              <SecurityLevelBadge
                level={securityLevel}
                className={isPublished ? "bg-slate-100 text-slate-400" : undefined}
              />
            </span>
            {isPublished ? (
              <button
                type="button"
                disabled={approvalStatus === "securityChange"}
                title={
                  approvalStatus === "securityChange" ? "密级修改审批中" : "申请修改密级"
                }
                onClick={() => {
                  setSecurityChangeDraft({ targetLevel: securityLevel, reason: "" });
                  setSecurityChangeOpen(true);
                }}
                className={cn(
                  "text-xs font-medium",
                  approvalStatus === "securityChange"
                    ? "cursor-not-allowed text-slate-400"
                    : "text-blue-600 hover:text-blue-700"
                )}
              >
                修改
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDraftSecurityLevel(securityLevel);
                  setDraftSecurityOpen(true);
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                调整密级
              </button>
            )}
          </div>
        </div>

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)]">
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
        </div>

        <div className="flex items-center gap-3">
          <ProtectionStatusBadge
            protectionTaskName="GF专属防护"
            protectionTaskId="1"
            protectionTypes={["policy", "lexicon"]}
          />
          <Button
            disabled={getApprovalActionState(approvalStatus).publishLocked}
            title={getApprovalActionState(approvalStatus).publishTitle ?? "发布"}
            onClick={handlePublish}
            className="rounded-2xl bg-slate-900 px-4 text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.8)] hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Rocket className="h-4 w-4" />
            发布
          </Button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 overflow-hidden">
        {activeTab === "config" ? (
          isWorkflow ? (
            <WorkflowEditor agentId={agentId} />
          ) : (
            <AutonomousEditor
              agentId={agentId}
              initialAgentData={agentData || undefined}
              onNameChange={setDisplayName}
            />
          )
        ) : (
          <AgentLogsView />
        )}
      </main>

      <Dialog open={draftSecurityOpen} onOpenChange={setDraftSecurityOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>调整密级</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>
              <span className="text-rose-500">*</span>密级
            </Label>
            <Select
              value={draftSecurityLevel}
              onValueChange={(value) => setDraftSecurityLevel(value as SecurityLevel)}
              options={buildSecurityLevelSelectOptions({ currentLevel: securityLevel })}
              className="h-10 max-w-xs"
            />
            <p className="text-xs text-slate-400">禁止降密，且不可超过当前用户密级。</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDraftSecurityOpen(false)}>
              取消
            </Button>
            <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleSaveDraftSecurity}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={securityChangeOpen} onOpenChange={setSecurityChangeOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>申请修改密级</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              当前密级：<span className="font-medium text-slate-900">{securityLevel}</span>
            </div>
            <div className="space-y-2">
              <Label>
                <span className="text-rose-500">*</span>目标密级
              </Label>
              <Select
                value={securityChangeDraft.targetLevel}
                onValueChange={(value) =>
                  setSecurityChangeDraft((current) => ({
                    ...current,
                    targetLevel: value as SecurityLevel,
                  }))
                }
                options={buildSecurityLevelSelectOptions({ currentLevel: securityLevel })}
                className="h-10 max-w-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-security-reason">
                <span className="text-rose-500">*</span>申请原因
              </Label>
              <Textarea
                id="agent-security-reason"
                value={securityChangeDraft.reason}
                onChange={(event) =>
                  setSecurityChangeDraft((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                rows={4}
                placeholder="请说明修改密级的原因"
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSecurityChangeOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleSubmitSecurityChange}
            >
              提交审批
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
