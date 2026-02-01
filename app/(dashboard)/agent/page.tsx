"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Bot, Workflow, RefreshCw, Copy, Edit, Trash2, Sparkles, GitBranch } from "lucide-react";
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
import { getAllAgents } from "@/lib/agent-data";

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  desc: string;
  updatedAt: string;
}

// 将 AgentProfile 转换为页面需要的 Agent 格式
function convertAgentProfileToAgent(profile: ReturnType<typeof getAllAgents>[0]): Agent {
  return {
    id: profile.id,
    name: profile.name,
    type: profile.type === 'autonomous' ? '自主规划智能体' : '工作流智能体',
    status: '未发布', // 默认状态
    desc: profile.description,
    updatedAt: profile.updatedAt,
  };
}

// 某些智能体的特殊状态配置
const AGENTS_STATUS_MAP: Record<string, string> = {
  'agent-situational': '已发布',
  'agent-intent-analysis': '已发布',
  'device-03': '已发布',
  'anti-fl-07': '已发布',
};

const ITEMS_PER_PAGE = 20;

export default function AgentPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  // 从 lib/agent-data.ts 获取所有智能体数据
  const agents = useMemo(() => {
    const allAgents = getAllAgents();
    return allAgents.map((profile) => {
      const agent = convertAgentProfileToAgent(profile);
      // 如果有特殊状态配置，使用配置的状态
      if (AGENTS_STATUS_MAP[agent.id]) {
        agent.status = AGENTS_STATUS_MAP[agent.id];
      }
      return agent;
    });
  }, []);

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.desc.toLowerCase().includes(searchQuery.toLowerCase())
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
                onClick={() => router.push("/agent/flow-01")}
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
              paginatedAgents.map((agent) => {
                const isAutonomous = agent.type === "自主规划智能体";
                const isPublished = agent.status === "已发布";
                return (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isAutonomous ? (
                          <Sparkles className="h-4 w-4 text-blue-600" />
                        ) : (
                          <GitBranch className="h-4 w-4 text-blue-600" />
                        )}
                        <Link
                          href={`/agent/${agent.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {agent.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={isAutonomous ? "secondary" : "default"}
                        className={
                          isAutonomous
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }
                      >
                        {isAutonomous ? (
                          <>
                            <Sparkles className="mr-1 h-3 w-3" />
                            {agent.type}
                          </>
                        ) : (
                          <>
                            <GitBranch className="mr-1 h-3 w-3" />
                            {agent.type}
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            isPublished ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                        <span className="text-sm">{agent.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {agent.desc}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {agent.updatedAt}
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
                          href={`/agent/${agent.id}`}
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
                );
              })
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
