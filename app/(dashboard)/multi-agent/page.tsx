"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Network,
  Plus,
  RefreshCw,
  Search,
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
  getPublishedMultiAgents,
  removePublishedMultiAgent,
  type PublishedMultiAgentItem,
} from "@/lib/published-multi-agents";

const ITEMS_PER_PAGE = 20;

export default function MultiAgentListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [publishedMultiAgents, setPublishedMultiAgents] = useState<
    PublishedMultiAgentItem[]
  >([]);

  useEffect(() => {
    setPublishedMultiAgents(getPublishedMultiAgents());
  }, []);

  const filteredAgents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return publishedMultiAgents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(query) ||
        agent.desc.toLowerCase().includes(query)
    );
  }, [publishedMultiAgents, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAgents = filteredAgents.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleRefresh = () => {
    setPublishedMultiAgents(getPublishedMultiAgents());
    toast.success("刷新成功");
  };

  const handleCopy = (agent: PublishedMultiAgentItem) => {
    toast.success(`已复制：${agent.name}`);
  };

  const handleDelete = (agent: PublishedMultiAgentItem) => {
    removePublishedMultiAgent(agent.id);
    setPublishedMultiAgents(getPublishedMultiAgents());
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

  const visiblePages = Array.from(
    { length: Math.min(4, totalPages) },
    (_, index) => {
      if (totalPages <= 4) return index + 1;
      if (currentPage <= 2) return index + 1;
      if (currentPage >= totalPages - 1) return totalPages - 3 + index;
      return currentPage - 1 + index;
    }
  );

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h1 className="text-[30px] font-semibold leading-none text-slate-950">
          多智能体
        </h1>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-[360px]">
            <Input
              placeholder="搜索多智能体名称"
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

            <Button
              asChild
              className="h-8 rounded-[4px] bg-blue-600 px-4 text-sm font-medium text-white shadow-none hover:bg-blue-700"
            >
              <Link href="/multi-agent/create">
                <Plus className="h-4 w-4" />
                新建多智能体
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">
        <Table className="min-w-[1080px]">
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-200 hover:bg-slate-50">
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">
                名称
              </TableHead>
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">
                类型
              </TableHead>
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">
                发布状态
              </TableHead>
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">
                描述
              </TableHead>
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">
                更新时间
              </TableHead>
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAgents.length === 0 ? (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={6} className="px-6 py-16 text-center">
                  <div className="mx-auto max-w-md space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[6px] border border-slate-200 bg-slate-50 text-slate-500">
                      <Network className="h-5 w-5" />
                    </div>
                    <div className="text-lg font-semibold text-slate-900">
                      {searchQuery ? "暂无匹配结果" : "暂无多智能体"}
                    </div>
                    <p className="text-sm leading-6 text-slate-500">
                      {searchQuery
                        ? "试试缩短关键词，或改用描述中的核心能力进行检索。"
                        : "点击右上角「新建多智能体」开始创建。"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedAgents.map((agent) => {
                const editHref = `/multi-agent/create?id=${encodeURIComponent(agent.id)}`;
                const isPublished = agent.status === "已发布";

                return (
                  <TableRow
                    key={agent.id}
                    className="border-slate-200 bg-white hover:bg-slate-50/40"
                  >
                    <TableCell className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-cyan-500 text-white">
                          <Network className="h-4 w-4" />
                        </div>
                        <Link
                          href={editHref}
                          className="text-[15px] font-medium text-slate-900 hover:text-blue-600"
                        >
                          {agent.name}
                        </Link>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 align-middle">
                      <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700">
                        <Network className="h-3 w-3" />
                        {agent.type}
                      </span>
                    </TableCell>

                    <TableCell className="px-4 py-3 align-middle">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-xs font-medium ${
                          isPublished
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isPublished ? "bg-emerald-500" : "bg-slate-400"
                          }`}
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
                        <Link
                          href={editHref}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          编辑
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(agent)}
                          className="text-blue-600 hover:text-blue-700"
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
          <div className="text-sm text-slate-500">
            共 {filteredAgents.length} 条记录
          </div>

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
              <DropdownMenuContent
                align="end"
                className="rounded-[6px] border-slate-200 p-1"
              >
                <DropdownMenuItem
                  onClick={() => setItemsPerPage(10)}
                  className="rounded-[4px] px-3 py-2"
                >
                  10 条/页
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setItemsPerPage(20)}
                  className="rounded-[4px] px-3 py-2"
                >
                  20 条/页
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setItemsPerPage(50)}
                  className="rounded-[4px] px-3 py-2"
                >
                  50 条/页
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <form
              onSubmit={handleGoToPage}
              className="flex items-center gap-2 text-sm text-slate-500"
            >
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
