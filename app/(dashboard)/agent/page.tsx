"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, Bot, Workflow, RefreshCw, Copy, Edit, Trash2, Grid2x2, Network } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Agent {
  id: string;
  name: string;
  type: "autonomous" | "workflow";
  publishStatus: "published" | "unpublished";
  description: string;
  updateTime: string;
}

const mockAgents: Agent[] = [
  {
    id: "1",
    name: "多智能体写作",
    type: "workflow",
    publishStatus: "unpublished",
    description: "智能体应用描述",
    updateTime: "2026-01-07 10:30:00",
  },
  {
    id: "2",
    name: "文件内容提取",
    type: "workflow",
    publishStatus: "unpublished",
    description: "智能体应用描述",
    updateTime: "2026-01-06 14:20:00",
  },
  {
    id: "3",
    name: "OSINT开源情报整编",
    type: "autonomous",
    publishStatus: "unpublished",
    description: "智能体应用描述",
    updateTime: "2026-01-05 09:15:00",
  },
  {
    id: "4",
    name: "高血压病大模型",
    type: "workflow",
    publishStatus: "unpublished",
    description: "智能体应用描述",
    updateTime: "2026-01-04 16:45:00",
  },
  {
    id: "5",
    name: "设备维修判断与预测",
    type: "workflow",
    publishStatus: "published",
    description: "感知Sensor当前参数、结合历史维保记录与设...",
    updateTime: "2026-01-03 11:00:00",
  },
  {
    id: "6",
    name: "反FL分析智能体",
    type: "workflow",
    publishStatus: "published",
    description: "智能体应用描述",
    updateTime: "2026-01-02 13:30:00",
  },
  {
    id: "7",
    name: "数据分析工作流",
    type: "workflow",
    publishStatus: "unpublished",
    description: "自动化数据分析流程，支持多数据源整合",
    updateTime: "2026-01-01 10:20:00",
  },
  {
    id: "8",
    name: "知识库问答",
    type: "autonomous",
    publishStatus: "unpublished",
    description: "基于知识库的智能问答系统",
    updateTime: "2025-12-31 15:45:00",
  },
  {
    id: "9",
    name: "审批流程智能体",
    type: "workflow",
    publishStatus: "unpublished",
    description: "企业审批流程自动化处理",
    updateTime: "2025-12-30 09:30:00",
  },
  {
    id: "10",
    name: "报表生成工作流",
    type: "workflow",
    publishStatus: "unpublished",
    description: "自动生成各类业务报表",
    updateTime: "2025-12-30 08:15:00",
  },
];

const ITEMS_PER_PAGE = 20;

export default function AgentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [agents] = useState<Agent[]>(mockAgents);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAgents = filteredAgents.slice(startIndex, endIndex);

  const handleRefresh = () => {
    toast.success("刷新成功");
  };

  const handleCopy = (agent: Agent) => {
    toast.success(`已复制：${agent.name}`);
  };

  const handleEdit = (agent: Agent) => {
    // Navigate to editor
  };

  const handleDelete = (agent: Agent) => {
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
    const page = parseInt(formData.get("page") as string);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">智能体</h1>
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索智能体名称"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="pl-9"
            />
          </div>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="h-9 w-9 rounded-full"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Create Button Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                创建智能体
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link
                  href="/agent-editor"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Bot className="h-4 w-4" />
                  自主规划智能体
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.info("功能开发中")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Workflow className="h-4 w-4" />
                工作流智能体
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>发布状态</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              paginatedAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {agent.type === "autonomous" ? (
                        <Network className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Grid2x2 className="h-4 w-4 text-blue-600" />
                      )}
                      <span className="font-medium">{agent.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={agent.type === "autonomous" ? "secondary" : "default"}
                      className={
                        agent.type === "autonomous"
                          ? "bg-purple-100 text-purple-800 border-purple-200"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }
                    >
                      {agent.type === "autonomous" ? (
                        <>
                          <Network className="mr-1 h-3 w-3" />
                          自主规划智能体
                        </>
                      ) : (
                        <>
                          <Workflow className="mr-1 h-3 w-3" />
                          工作流智能体
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          agent.publishStatus === "published"
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                      <span className="text-sm">
                        {agent.publishStatus === "published" ? "已发布" : "未发布"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {agent.description}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {agent.updateTime}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleCopy(agent)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        复制
                      </button>
                      <Link
                        href="/agent-editor"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(agent)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
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

      {/* Pagination */}
      {filteredAgents.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {filteredAgents.length} 条
          </div>
          <div className="flex items-center gap-4">
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <span>‹</span>
              </Button>
              {Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 4) {
                  pageNum = i + 1;
                } else if (currentPage <= 2) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 1) {
                  pageNum = totalPages - 3 + i;
                } else {
                  pageNum = currentPage - 1 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span>›</span>
              </Button>
            </div>

            {/* Items Per Page */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {itemsPerPage}条/页
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setItemsPerPage(10)}>
                  10条/页
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setItemsPerPage(20)}>
                  20条/页
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setItemsPerPage(50)}>
                  50条/页
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Go To Page */}
            <form onSubmit={handleGoToPage} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">前往</span>
              <Input
                name="page"
                type="number"
                min={1}
                max={totalPages}
                defaultValue={currentPage}
                className="w-16 h-8 text-center"
              />
              <span className="text-sm text-muted-foreground">页</span>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
