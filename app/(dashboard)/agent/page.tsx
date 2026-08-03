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
  SecurityLevelBadge,
} from "@/components/security/security-level-badge";
import { getAllAgents, type AgentProfile } from "@/lib/agent-data";
import {
  getApprovalActionState,
  isHighSecurityLevel,
  type ApprovalStatus,
  type SecurityLevel,
} from "@/lib/security-level";
import { cn } from "@/lib/utils";

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

const ITEMS_PER_PAGE = 20;

export default function AgentPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [agents, setAgents] = useState<Agent[]>(() =>
    getAllAgents().map(convertAgentProfileToAgent)
  );

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
    setAgents(getAllAgents().map(convertAgentProfileToAgent));
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

    if (isHighSecurityLevel(agent.securityLevel) && agent.status === "已发布") {
      setAgents((current) =>
        current.map((row) =>
          row.id === agent.id ? { ...row, approvalStatus: "delete" } : row
        )
      );
      toast.success(`已提交删除审批：${agent.name}，审批通过前仍按当前已发布版本运行。`);
      return;
    }

    setAgents((current) => current.filter((row) => row.id !== agent.id));
    toast.success(`已删除：${agent.name}`);
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
              <DropdownMenuContent align="end" className="w-48 rounded-[6px] border-slate-200 p-1">
                <DropdownMenuItem asChild className="rounded-[4px] px-3 py-2">
                  <Link href="/agent-editor" className="flex cursor-pointer items-center gap-2">
                    <Bot className="h-4 w-4 text-slate-500" />
                    自主规划智能体
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/agent/flow-01")}
                  className="rounded-[4px] px-3 py-2"
                >
                  <Workflow className="h-4 w-4 text-slate-500" />
                  工作流智能体
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
    </div>
  );
}
