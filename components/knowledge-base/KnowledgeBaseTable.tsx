"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Copy,
  FileText,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import {
  knowledgeBasesV2,
  type KnowledgeBaseRowV2,
} from "@/lib/mock-knowledge-base-v2";
import { loadCreatedKnowledgeBases } from "@/lib/mock/knowledge-base-list";
import type { KnowledgeBaseGroup } from "./GroupTreeSidebar";

interface KnowledgeBaseTableProps {
  selectedGroup: KnowledgeBaseGroup | null;
}

function StatusDot({ status }: { status: KnowledgeBaseRowV2["status"] }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-700">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          status === "已启用" ? "bg-emerald-500" : "bg-slate-300"
        )}
      />
      {status}
    </span>
  );
}

function loadGraphRagRows(): KnowledgeBaseRowV2[] {
  return loadCreatedKnowledgeBases().map((item) => ({
    id: item.id,
    name: item.name,
    createMode: item.createMethod,
    status: item.status,
    documentCount: item.documentCount,
    updatedAt: item.updateTime,
    createdBy: item.creator,
    createdAt: item.createTime,
    description: item.description ?? "",
    groupName: item.groupName ?? "全部群组",
  }));
}

export function KnowledgeBaseTable({ selectedGroup }: KnowledgeBaseTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [graphRagRows, setGraphRagRows] = useState<KnowledgeBaseRowV2[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect -- Graph RAG rows are persisted in browser localStorage. */
  useEffect(() => {
    setGraphRagRows(loadGraphRagRows());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const rows = useMemo(() => {
    const graphRagIds = new Set(graphRagRows.map((item) => item.id));
    return [
      ...graphRagRows,
      ...knowledgeBasesV2.filter((item) => !graphRagIds.has(item.id)),
    ];
  }, [graphRagRows]);

  const filteredRows = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return rows.filter((item) => {
      const groupMatched =
        !selectedGroup || selectedGroup.id === "all" || item.groupName === selectedGroup.name;
      const searchMatched = !normalized || item.name.toLowerCase().includes(normalized);
      return groupMatched && searchMatched;
    });
  }, [rows, searchQuery, selectedGroup]);

  return (
    <div className="flex h-full min-w-0 flex-col bg-white">
      <div className="flex items-center justify-between px-6 py-7">
        <h1 className="text-lg font-semibold text-slate-950">
          {selectedGroup?.name ?? "全部群组"}
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索知识库名称"
              className="h-9 rounded border-slate-200 pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded"
            onClick={() => setGraphRagRows(loadGraphRagRows())}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-9 gap-2 rounded bg-blue-600 px-4 text-white hover:bg-blue-700">
                创建知识库
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px] p-2">
              <DropdownMenuItem
                className="items-start gap-3 rounded p-3"
                onSelect={() => router.push("/knowledge-base/create?type=Template")}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-600 text-white">
                  <FileText className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-medium text-slate-950">模板创建</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    使用系统预制的知识库配置，快速创建知识库
                  </span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="items-start gap-3 rounded p-3"
                onSelect={() => router.push("/knowledge-base/create/custom")}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-violet-600 text-white">
                  <Settings2 className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-medium text-slate-950">自定义创建</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    支持配置知识库 2.0 检索引擎、Graph RAG 与混合检索策略
                  </span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
        <Table className="table-fixed text-sm">
          <TableHeader>
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="w-[190px] text-slate-800">知识库名称</TableHead>
              <TableHead className="w-[104px]">创建方式</TableHead>
              <TableHead className="w-[78px]">状态</TableHead>
              <TableHead className="w-[70px]">文档数量</TableHead>
              <TableHead className="w-[145px]">更新时间</TableHead>
              <TableHead className="w-[84px]">创建人</TableHead>
              <TableHead className="w-[145px]">创建时间</TableHead>
              <TableHead className="sticky right-0 z-10 w-[166px] bg-white shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((item) => (
              <TableRow
                key={item.id}
                className="h-16 cursor-pointer border-slate-100 hover:bg-blue-50/70"
                onClick={() => router.push(`/knowledge-base/${item.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded bg-blue-500 text-white shadow-sm">
                      <FileText className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 truncate font-medium text-slate-950">{item.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <Settings2 className="h-4 w-4 text-violet-600" />
                    {item.createMode}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusDot status={item.status} />
                </TableCell>
                <TableCell>{item.documentCount}</TableCell>
                <TableCell className="truncate">{item.updatedAt}</TableCell>
                <TableCell className="truncate">{item.createdBy}</TableCell>
                <TableCell className="truncate">{item.createdAt}</TableCell>
                <TableCell
                  onClick={(event) => event.stopPropagation()}
                  className="sticky right-0 z-10 bg-white shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]"
                >
                  <div className="flex items-center gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => router.push(`/knowledge-base/hit-test?id=${item.id}`)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      命中测试
                    </button>
                    <button type="button" className="text-blue-600 hover:text-blue-700">
                      启用
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          更多
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-28">
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          复制
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-56 text-center text-slate-400">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
