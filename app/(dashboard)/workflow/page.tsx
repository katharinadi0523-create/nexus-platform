"use client";

import { useState } from "react";
import { ChevronRight, GitBranch, RefreshCw, Search, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImportConfigurationButton } from "@/components/import-export/import-configuration-dialog";
import type { ImportPreview } from "@/lib/agent-import-export";

type WorkflowRow = {
  id: string;
  name: string;
  description: string;
  nodes: number;
  status: "已发布" | "未发布";
  updatedAt: string;
};

const INITIAL_WORKFLOWS: WorkflowRow[] = [
  { id: "workflow-ticket", name: "客户工单处理流程", description: "完成工单识别、优先级判断、知识检索与人工转接。", nodes: 12, status: "已发布", updatedAt: "2026-09-12 16:30" },
  { id: "workflow-report", name: "经营日报生成流程", description: "汇总业务数据并生成结构化经营日报。", nodes: 8, status: "已发布", updatedAt: "2026-09-11 09:24" },
  { id: "workflow-review", name: "合同条款审核流程", description: "抽取关键条款，识别风险并输出审核意见。", nodes: 10, status: "未发布", updatedAt: "2026-09-09 14:08" },
];

export default function WorkflowPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(INITIAL_WORKFLOWS);
  const filteredRows = rows.filter((row) => `${row.name}${row.description}`.toLowerCase().includes(query.toLowerCase()));

  function handleImported(preview: ImportPreview) {
    setRows((current) => [
      {
        id: `imported-${Date.now()}`,
        name: preview.objectName,
        description: preview.description,
        nodes: 11,
        status: "未发布",
        updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      },
      ...current,
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <h1 className="text-[30px] font-semibold leading-none text-slate-950">工作流</h1>
          <p className="mt-2 text-sm text-slate-500">创建、编排和复用可独立运行的工作流。</p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-[360px]">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索工作流名称"
              className="h-8 rounded-[4px] border-slate-300 bg-white px-3 pr-9 text-sm shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100"
            />
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <ImportConfigurationButton objectType="workflow" destinationHref="/workflow?source=import" onImported={handleImported} />
            <Button type="button" variant="outline" size="icon-sm" className="h-8 w-8 rounded-[4px] border-slate-300 bg-white text-slate-600 shadow-none" onClick={() => toast.success("刷新成功")}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button type="button" className="h-8 rounded-[4px] bg-blue-600 px-4 text-sm font-medium text-white shadow-none hover:bg-blue-700" onClick={() => toast.info("已进入空白工作流创建页（原型）")}>
              <GitBranch className="h-4 w-4" />新建工作流
            </Button>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">
        <Table className="min-w-[920px]">
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-200 hover:bg-slate-50">
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">名称</TableHead>
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">发布状态</TableHead>
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">节点数</TableHead>
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">更新时间</TableHead>
              <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.id} className="border-slate-200 bg-white hover:bg-slate-50/40">
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-violet-500 text-white"><Workflow className="h-4 w-4" /></span>
                    <div>
                      <div className="text-[15px] font-medium text-slate-900">{row.name}</div>
                      <div className="mt-1 max-w-[560px] text-sm text-slate-500">{row.description}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span className={row.status === "已发布" ? "inline-flex rounded-[4px] bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700" : "inline-flex rounded-[4px] bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"}>{row.status}</span>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-slate-700">{row.nodes}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-slate-600">{row.updatedAt}</TableCell>
                <TableCell className="px-4 py-3">
                  <button type="button" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700" onClick={() => toast.info(`打开工作流配置：${row.name}`)}>编辑<ChevronRight className="h-3.5 w-3.5" /></button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <div className="text-sm text-slate-500">共 {filteredRows.length} 条记录</div>
    </div>
  );
}
