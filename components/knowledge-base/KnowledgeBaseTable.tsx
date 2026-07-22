"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  Plus,
  FileText,
  Settings,
  Trash2,
  Crosshair,
  ChevronDown,
  LayoutTemplate,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KnowledgeBaseGroup } from "./GroupTreeSidebar";
import {
  getKnowledgeBasesByGroup,
  type KnowledgeBaseListItem,
} from "@/lib/mock/knowledge-base-list";

export type { KnowledgeBaseListItem as KnowledgeBase };

interface KnowledgeBaseTableProps {
  selectedGroup: KnowledgeBaseGroup | null;
}

export function KnowledgeBaseTable({ selectedGroup }: KnowledgeBaseTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const groupId = selectedGroup?.id || null;
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseListItem[]>(
    () => getKnowledgeBasesByGroup(groupId)
  );

  useEffect(() => {
    setKnowledgeBases(getKnowledgeBasesByGroup(groupId));
  }, [groupId]);

  const filteredKnowledgeBases = knowledgeBases.filter((kb) =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    setKnowledgeBases(getKnowledgeBasesByGroup(groupId));
  };

  const handleOpenDetail = (kb: KnowledgeBaseListItem) => {
    router.push(`/knowledge-base/${kb.id}`);
  };

  const handleHitTest = (id: string) => {
    router.push(`/knowledge-base/${id}?tab=test`);
  };

  const handleToggleStatus = (id: string) => {
    setKnowledgeBases((prev) =>
      prev.map((kb) =>
        kb.id === id
          ? {
              ...kb,
              status: kb.status === "已启用" ? "已停用" : "已启用",
              updateTime: new Date()
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
            }
          : kb
      )
    );
  };

  const handleDelete = (id: string) => {
    setKnowledgeBases((prev) => prev.filter((kb) => kb.id !== id));
  };

  const handleCreateTemplate = () => {
    router.push("/knowledge-base/create");
  };

  const handleCreateCustom = () => {
    router.push("/knowledge-base/create/custom");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">
          {selectedGroup?.name || "请选择知识库群组"}
        </h1>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索知识库名称"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="h-9 w-9 rounded-full"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="outline">标签管理</Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[#2773ff] text-white hover:bg-[#1f63e0]">
                <Plus className="mr-2 h-4 w-4" />
                创建知识库
                <ChevronDown className="ml-1.5 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={handleCreateTemplate}
              >
                <LayoutTemplate className="h-4 w-4 text-slate-500" />
                模板知识库
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={handleCreateCustom}
              >
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                自定义知识库
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>知识库名称</TableHead>
              <TableHead>创建方式</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>文档数量</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead>创建人</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="min-w-[280px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredKnowledgeBases.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-slate-400"
                >
                  {selectedGroup
                    ? "暂无知识库数据"
                    : "请从左侧选择一个知识库群组"}
                </TableCell>
              </TableRow>
            ) : (
              filteredKnowledgeBases.map((kb) => (
                <TableRow key={kb.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(kb)}
                      className="flex items-center gap-2 text-left hover:opacity-80"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-600">
                        <FileText className="h-3 w-3 text-white" />
                      </div>
                      <span className="font-semibold text-[#2773ff] hover:underline">
                        {kb.name}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {kb.createMethod}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-normal",
                        kb.status === "已启用"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                      )}
                    >
                      {kb.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{kb.documentCount}</TableCell>
                  <TableCell className="whitespace-nowrap text-slate-600">
                    {kb.updateTime}
                  </TableCell>
                  <TableCell className="text-slate-600">{kb.creator}</TableCell>
                  <TableCell className="whitespace-nowrap text-slate-600">
                    {kb.createTime}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleHitTest(kb.id)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Crosshair className="h-3.5 w-3.5" />
                        命中测试
                      </button>
                      <button
                        onClick={() => handleToggleStatus(kb.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {kb.status === "已启用" ? "停用" : "启用"}
                      </button>
                      <button
                        onClick={() => handleOpenDetail(kb)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        配置
                      </button>
                      <button
                        onClick={() => handleDelete(kb.id)}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
    </div>
  );
}
