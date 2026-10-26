"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SecurityLevelBadge } from "@/components/security/security-level-badge";
import { ResourceDeleteApprovalDialog } from "@/components/security/resource-delete-approval-dialog";
import { getAllAgents, type AgentProfile } from "@/lib/agent-data";
import {
  buildSecurityLevelOptionsUpToUser,
  getApprovalActionState,
  isHighSecurityLevel,
  requiresResourceDeleteApproval,
  type ApprovalStatus,
  type SecurityLevel,
} from "@/lib/security-level";
import { cn } from "@/lib/utils";
import { ImportConfigurationButton } from "@/components/import-export/import-configuration-dialog";
import { ExportConfigurationButton } from "@/components/import-export/export-configuration-button";

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  desc: string;
  updatedAt: string;
  securityLevel: SecurityLevel;
  approvalStatus: ApprovalStatus;
}

function convertAgentProfileToAgent(profile: AgentProfile): Agent {
  return {
    id: profile.id,
    name: profile.name,
    type: profile.type === "autonomous" ? "自主规划智能体" : "工作流智能体",
    status: profile.publishStatus ?? "未发布",
    desc: profile.description,
    updatedAt: profile.updatedAt,
    securityLevel: profile.securityLevel ?? "公开",
    approvalStatus: profile.approvalStatus ?? "none",
  };
}

const AGENTS_STATUS_MAP: Record<string, string> = {
  "agent-situational": "已发布",
  "agent-intent-analysis": "已发布",
  "code-02": "已发布",
  "device-03": "已发布",
  "anti-fl-07": "已发布",
};

// 原型演示：该资源已经完成“停用整个资源”，其全部发布版本均不可被引用或调用。
const ALL_VERSIONS_DISABLED_AGENT_IDS = new Set(["code-02"]);

const ITEMS_PER_PAGE = 20;

function buildDemoAgents() {
  return getAllAgents().map((profile) => {
    const agent = convertAgentProfileToAgent(profile);
    if (AGENTS_STATUS_MAP[agent.id]) {
      agent.status = AGENTS_STATUS_MAP[agent.id];
    }
    return agent;
  });
}

export default function AgentPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteApprovalOpen, setDeleteApprovalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [agents, setAgents] = useState<Agent[]>(buildDemoAgents);
  const [workflowCreateOpen, setWorkflowCreateOpen] = useState(false);
  const [workflowCreateDraft, setWorkflowCreateDraft] = useState<{
    name: string;
    description: string;
    securityLevel: SecurityLevel | "";
    approvalReason: string;
  }>({
    name: "",
    description: "",
    securityLevel: "",
    approvalReason: "",
  });
  const [workflowCreateError, setWorkflowCreateError] = useState("");

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.securityLevel.includes(searchQuery)
  );

  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAgents = filteredAgents.slice(startIndex, startIndex + itemsPerPage);

  const handleRefresh = () => {
    setAgents(buildDemoAgents());
    toast.success("刷新成功");
  };

  const handleCopy = (agent: Agent) => {
    toast.success(`已复制：${agent.name}`);
  };

  const handleOpenEdit = (agent: Agent) => {
    const action = getApprovalActionState(agent.approvalStatus);
    if (action.configLocked) {
      toast.info(action.configTitle ?? "审批中，暂无法进入配置。");
      return;
    }
    router.push(`/agent/${agent.id}`);
  };

  const handleDelete = (agent: Agent) => {
    const action = getApprovalActionState(agent.approvalStatus);
    if (action.deleteLocked) {
      toast.info(action.deleteTitle ?? "审批中");
      return;
    }

    setDeleteTarget(agent);
    if (agent.status === "已发布" && !ALL_VERSIONS_DISABLED_AGENT_IDS.has(agent.id)) {
      setDeleteBlockedOpen(true);
      return;
    }
    if (
      requiresResourceDeleteApproval(
        agent.type === "工作流智能体" ? "workflow-agent" : "agent",
        agent.securityLevel
      )
    ) {
      setDeleteReason("");
      setDeleteApprovalOpen(true);
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    setAgents((current) => current.filter((row) => row.id !== deleteTarget.id));
    setDeleteConfirmOpen(false);
    toast.success(`已删除：${deleteTarget.name}`);
    setDeleteTarget(null);
  };

  const submitDeleteApproval = () => {
    if (!deleteTarget) return;
    if (!deleteReason.trim()) {
      toast.error("请填写申请原因。");
      return;
    }
    setAgents((current) =>
      current.map((row) =>
        row.id === deleteTarget.id ? { ...row, approvalStatus: "delete" } : row
      )
    );
    setDeleteApprovalOpen(false);
    setDeleteReason("");
    toast.success(`已提交删除审批：${deleteTarget.name}，审批通过前资源保持当前状态。`);
    setDeleteTarget(null);
  };

  const resetWorkflowCreateDraft = () => {
    setWorkflowCreateDraft({
      name: "",
      description: "",
      securityLevel: "",
      approvalReason: "",
    });
    setWorkflowCreateError("");
  };

  const openWorkflowCreateDialog = () => {
    resetWorkflowCreateDraft();
    setWorkflowCreateOpen(true);
  };

  const submitWorkflowCreate = () => {
    const name = workflowCreateDraft.name.trim();
    const description = workflowCreateDraft.description.trim();
    const securityLevel = workflowCreateDraft.securityLevel;
    const approvalReason = workflowCreateDraft.approvalReason.trim();

    if (!name) {
      setWorkflowCreateError("请输入工作流智能体名称。");
      return;
    }
    if (!description) {
      setWorkflowCreateError("请输入工作流智能体描述。");
      return;
    }
    if (!securityLevel) {
      setWorkflowCreateError("请选择密级。");
      return;
    }
    if (isHighSecurityLevel(securityLevel) && !approvalReason) {
      setWorkflowCreateError("秘密、机密资源需填写申请原因。");
      return;
    }

    setWorkflowCreateError("");
    if (isHighSecurityLevel(securityLevel)) {
      setAgents((current) => [
        {
          id: `workflow-pending-${Date.now()}`,
          name,
          type: "工作流智能体",
          status: "未发布",
          desc: description,
          updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
          securityLevel,
          approvalStatus: "create",
        },
        ...current,
      ]);
      setWorkflowCreateOpen(false);
      resetWorkflowCreateDraft();
      toast.success("创建申请已提交。审批通过前不可进入编辑或使用。");
      return;
    }

    const searchParams = new URLSearchParams({
      source: "create",
      name,
      description,
      securityLevel,
    });
    setWorkflowCreateOpen(false);
    resetWorkflowCreateDraft();
    router.push(`/agent/workflow-new?${searchParams.toString()}`);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleGoToPage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const page = parseInt(formData.get("page") as string, 10);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const visiblePages = Array.from({ length: Math.min(4, totalPages) }, (_, index) => {
    if (totalPages <= 4) return index + 1;
    if (currentPage <= 2) return index + 1;
    if (currentPage >= totalPages - 1) return totalPages - 3 + index;
    return currentPage - 1 + index;
  });

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h1 className="text-[30px] font-semibold leading-none text-slate-950">智能体</h1>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-[360px]">
            <Input
              placeholder="搜索智能体名称"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 rounded-[4px] border-slate-300 bg-white px-3 pr-9 text-sm shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100"
            />
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>

          <div className="flex items-center justify-end gap-2">
            <ImportConfigurationButton
              objectType="workflow_agent"
              objectTypeChoices={["workflow_agent", "autonomous_agent"]}
              destinationHref={{
                workflow_agent: "/agent/flow-01?source=import&objectType=workflow_agent",
                autonomous_agent: "/agent/osint-01?source=import&objectType=autonomous_agent",
              }}
              onImported={(preview) => {
                setAgents((current) => [
                  {
                    id: `imported-${Date.now()}`,
                    name: preview.objectName,
                    type: preview.objectTypeLabel,
                    status: "未发布",
                    desc: preview.description,
                    updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
                    securityLevel: preview.securityLevel ?? "公开",
                    approvalStatus: "none",
                  },
                  ...current,
                ]);
              }}
            />
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleRefresh}
              className="h-8 w-8 rounded-[4px] border-slate-300 bg-white text-slate-600 shadow-none hover:bg-slate-50 hover:text-slate-900"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-8 rounded-[4px] bg-blue-600 px-4 text-sm font-medium text-white shadow-none hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  创建智能体
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-[6px] border-slate-200 p-1">
                <DropdownMenuItem asChild className="rounded-[4px] px-3 py-2">
                  <Link href="/agent-editor" className="flex cursor-pointer items-center gap-2">
                    <Bot className="h-4 w-4 text-slate-500" />
                    <div>
                      <div className="text-sm font-medium">新建自主规划智能体</div>
                      <div className="mt-0.5 text-xs text-slate-500">从空白配置开始创建</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={openWorkflowCreateDialog}
                  className="rounded-[4px] px-3 py-2"
                >
                  <Workflow className="h-4 w-4 text-slate-500" />
                  <div>
                    <div className="text-sm font-medium">新建工作流智能体</div>
                    <div className="mt-0.5 text-xs text-slate-500">填写基本信息和密级后创建</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">
        <Table className="min-w-[1180px]">
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-200 hover:bg-slate-50">
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">名称</TableHead>
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">类型</TableHead>
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">密级</TableHead>
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">发布状态</TableHead>
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">描述</TableHead>
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">更新时间</TableHead>
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAgents.length === 0 ? (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={7} className="px-6 py-16 text-center">
                  <div className="mx-auto max-w-md space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[6px] border border-slate-200 bg-slate-50 text-slate-500">
                      <Search className="h-5 w-5" />
                    </div>
                    <div className="text-lg font-semibold text-slate-900">暂无匹配结果</div>
                    <p className="text-sm leading-6 text-slate-500">
                      {searchQuery
                        ? "试试缩短关键词，或改用描述中的核心能力进行检索。"
                        : "当前没有可展示的智能体。"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedAgents.map((agent) => {
                const isAutonomous = agent.type === "自主规划智能体";
                const isPublished = agent.status === "已发布";
                const areAllVersionsDisabled = ALL_VERSIONS_DISABLED_AGENT_IDS.has(agent.id);
                const action = getApprovalActionState(agent.approvalStatus);

                return (
                  <TableRow key={agent.id} className="border-slate-200 bg-white hover:bg-slate-50/40">
                    <TableCell className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-[8px] ${
                            isAutonomous ? "bg-indigo-500 text-white" : "bg-blue-500 text-white"
                          }`}
                        >
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(agent)}
                            disabled={action.configLocked}
                            title={action.configTitle ?? agent.name}
                            className={cn(
                              "text-left text-[15px] font-medium transition-colors",
                              action.configLocked
                                ? "cursor-not-allowed text-slate-400"
                                : "text-slate-900 hover:text-blue-600"
                            )}
                          >
                            {agent.name}
                          </button>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 align-middle">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-xs font-medium ${
                          isAutonomous
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {isAutonomous ? (
                          <Sparkles className="h-3 w-3" />
                        ) : (
                          <Workflow className="h-3 w-3" />
                        )}
                        {agent.type}
                      </span>
                    </TableCell>

                    <TableCell className="px-4 py-3 align-middle">
                      <SecurityLevelBadge level={agent.securityLevel} />
                    </TableCell>

                    <TableCell className="px-4 py-3 align-middle">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-xs font-medium ${
                            isPublished ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${isPublished ? "bg-emerald-500" : "bg-slate-400"}`}
                          />
                          {agent.status}
                        </span>
                        {areAllVersionsDisabled && (
                          <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-rose-50 px-2 py-1 text-xs font-medium text-rose-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            全部版本已停用
                          </span>
                        )}
                        {agent.approvalStatus !== "none" && action.configTitle ? (
                          <span className="inline-flex items-center rounded-[4px] bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                            {action.configTitle}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-[360px] whitespace-normal px-4 py-3 align-middle text-sm leading-6 text-slate-600">
                      {agent.desc}
                    </TableCell>

                    <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">
                      {agent.updatedAt}
                    </TableCell>

                    <TableCell className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-4 text-sm">
                        <button
                          type="button"
                          onClick={() => handleCopy(agent)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          复制
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(agent)}
                          disabled={action.configLocked}
                          title={action.configTitle ?? "编辑"}
                          className={cn(
                            action.configLocked
                              ? "cursor-not-allowed text-slate-400"
                              : "text-blue-600 hover:text-blue-700"
                          )}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(agent)}
                          disabled={action.deleteLocked}
                          title={action.deleteTitle ?? "删除"}
                          className={cn(
                            action.deleteLocked
                              ? "cursor-not-allowed text-slate-400"
                              : "text-blue-600 hover:text-blue-700"
                          )}
                        >
                          删除
                        </button>
                        {isPublished ? (
                          <ExportConfigurationButton
                            objectType={isAutonomous ? "autonomous_agent" : "workflow_agent"}
                            objectName={agent.name}
                            sourceType="published"
                            display="table-action"
                            securityLevel={agent.securityLevel}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </section>

      {filteredAgents.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-slate-500">共 {filteredAgents.length} 条记录</div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 rounded-[4px] border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {visiblePages.map((pageNum) => (
                <Button
                  key={pageNum}
                  variant="ghost"
                  size="sm"
                  className={`h-8 min-w-8 rounded-[4px] border px-2 text-sm ${
                    currentPage === pageNum
                      ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              ))}

              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 rounded-[4px] border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-[4px] border-slate-300 bg-white px-3 text-slate-600 shadow-none hover:bg-slate-50 hover:text-slate-900"
                >
                  {itemsPerPage} 条/页
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-[6px] border-slate-200 p-1">
                <DropdownMenuItem onClick={() => setItemsPerPage(10)} className="rounded-[4px] px-3 py-2">
                  10 条/页
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setItemsPerPage(20)} className="rounded-[4px] px-3 py-2">
                  20 条/页
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setItemsPerPage(50)} className="rounded-[4px] px-3 py-2">
                  50 条/页
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <form onSubmit={handleGoToPage} className="flex items-center gap-2 text-sm text-slate-500">
              <span>前往</span>
              <Input
                name="page"
                type="number"
                min={1}
                max={totalPages}
                defaultValue={currentPage}
                className="h-8 w-14 rounded-[4px] border-slate-300 bg-white text-center shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100"
              />
              <span>页</span>
            </form>
          </div>
        </div>
      )}

      <Dialog
        open={workflowCreateOpen}
        onOpenChange={(open) => {
          setWorkflowCreateOpen(open);
          if (!open) resetWorkflowCreateDraft();
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-[560px] flex-col overflow-hidden rounded-lg p-0">
          <DialogHeader className="shrink-0 border-b border-slate-200 px-6 py-5">
            <DialogTitle>创建工作流智能体</DialogTitle>
            <DialogDescription className="pt-1 text-slate-500">
              填写基本信息并选择密级。创建后从空白画布开始编排。
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="workflow-create-name">
                  <span className="mr-1 text-rose-500">*</span>名称
                </Label>
                <span className="text-xs text-slate-400">{workflowCreateDraft.name.length}/50</span>
              </div>
              <Input
                id="workflow-create-name"
                value={workflowCreateDraft.name}
                placeholder="请输入工作流智能体名称"
                maxLength={50}
                onChange={(event) => {
                  setWorkflowCreateDraft((current) => ({ ...current, name: event.target.value }));
                  setWorkflowCreateError("");
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="workflow-create-description">
                  <span className="mr-1 text-rose-500">*</span>描述
                </Label>
                <span className="text-xs text-slate-400">{workflowCreateDraft.description.length}/200</span>
              </div>
              <Textarea
                id="workflow-create-description"
                value={workflowCreateDraft.description}
                placeholder="请说明该工作流智能体负责的业务场景"
                maxLength={200}
                className="min-h-24 resize-none"
                onChange={(event) => {
                  setWorkflowCreateDraft((current) => ({ ...current, description: event.target.value }));
                  setWorkflowCreateError("");
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>
                <span className="mr-1 text-rose-500">*</span>密级
              </Label>
              <Select
                value={workflowCreateDraft.securityLevel}
                placeholder="请选择密级"
                options={buildSecurityLevelOptionsUpToUser()}
                onValueChange={(value) => {
                  setWorkflowCreateDraft((current) => ({
                    ...current,
                    securityLevel: value as SecurityLevel,
                    approvalReason: isHighSecurityLevel(value as SecurityLevel)
                      ? current.approvalReason
                      : "",
                  }));
                  setWorkflowCreateError("");
                }}
              />
              <p className="text-xs leading-5 text-slate-500">
                公开、内部可直接创建；秘密、机密需提交审批。仅展示当前角色可选密级。
              </p>
            </div>

            {workflowCreateDraft.securityLevel && isHighSecurityLevel(workflowCreateDraft.securityLevel) ? (
              <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div>
                  <div className="text-sm font-medium text-amber-900">高密资源创建需审批</div>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    审批通过前不可进入编辑、发布或使用。
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workflow-create-reason">
                    <span className="mr-1 text-rose-500">*</span>申请原因
                  </Label>
                  <Textarea
                    id="workflow-create-reason"
                    value={workflowCreateDraft.approvalReason}
                    placeholder="请说明创建该高密工作流智能体的业务用途和必要性"
                    maxLength={500}
                    className="min-h-24 resize-none bg-white"
                    onChange={(event) => {
                      setWorkflowCreateDraft((current) => ({
                        ...current,
                        approvalReason: event.target.value,
                      }));
                      setWorkflowCreateError("");
                    }}
                  />
                </div>
              </div>
            ) : null}

            {workflowCreateError ? (
              <p className="text-sm text-rose-600" role="alert">{workflowCreateError}</p>
            ) : null}
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-200 px-6 py-4">
            <Button variant="outline" onClick={() => setWorkflowCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={submitWorkflowCreate} className="bg-blue-600 text-white hover:bg-blue-700">
              {workflowCreateDraft.securityLevel && isHighSecurityLevel(workflowCreateDraft.securityLevel)
                ? "提交创建申请"
                : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteBlockedOpen} onOpenChange={setDeleteBlockedOpen}>
        <DialogContent className="max-w-[480px] rounded-lg">
          <DialogHeader>
            <DialogTitle>暂不能删除{deleteTarget?.name ? `「${deleteTarget.name}」` : "该资源"}</DialogTitle>
            <DialogDescription className="pt-2 leading-6 text-slate-600">
              该资源仍有可用版本。请先停用整个资源，确认全部版本停止被引用和调用后，再从列表删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDeleteBlockedOpen(false)} className="rounded-md bg-blue-600 text-white hover:bg-blue-700">
              我知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-[480px] rounded-lg">
          <DialogHeader>
            <DialogTitle>删除{deleteTarget?.name ? `「${deleteTarget.name}」` : "该资源"}？</DialogTitle>
            <DialogDescription className="pt-2 leading-6 text-slate-600">
              {deleteTarget && ALL_VERSIONS_DISABLED_AGENT_IDS.has(deleteTarget.id)
                ? "该资源的全部发布版本均已停用。删除后，当前草稿、全部历史版本及相关配置将被永久移除，且无法恢复。"
                : "删除后，当前草稿、全部历史版本及相关配置将被永久移除，且无法恢复。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="rounded-md">
              取消
            </Button>
            <Button onClick={confirmDelete} className="rounded-md bg-rose-600 text-white hover:bg-rose-700">
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ResourceDeleteApprovalDialog
        open={deleteApprovalOpen}
        resourceName={deleteTarget?.name ?? ""}
        resourceType={deleteTarget?.type ?? "智能体"}
        securityLevel={deleteTarget?.securityLevel ?? "公开"}
        reason={deleteReason}
        impactDescription="审批通过后将删除该资源的当前草稿、全部历史版本及相关配置，已有引用将无法继续使用该资源。"
        onOpenChange={(open) => {
          setDeleteApprovalOpen(open);
          if (!open) {
            setDeleteTarget(null);
            setDeleteReason("");
          }
        }}
        onReasonChange={setDeleteReason}
        onSubmit={submitDeleteApproval}
      />
    </div>
  );
}
