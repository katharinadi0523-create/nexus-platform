"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileStack, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useWorkbenchEntity } from "@/components/claw-hub-next/workbench-entity-context";

export interface KnowledgeConfigSelection {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  updatedAt: string;
}

interface KnowledgeConfigOption extends KnowledgeConfigSelection {
  badge: string;
}

interface KnowledgeConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selections: KnowledgeConfigSelection[]) => void;
}

const KNOWLEDGE_CONFIG_OPTIONS: KnowledgeConfigOption[] = [
  {
    id: "kb-pick-regulation-2025",
    name: "制度与合规条款库",
    description: "收录现行制度、审批红线与合规模板片段，支持条款级检索与引用。",
    documentCount: 186,
    updatedAt: "2026-04-08 11:20:00",
    badge: "制度",
  },
  {
    id: "kb-pick-product-faq",
    name: "产品说明与常见问题",
    description: "面向对客话术、功能说明与常见故障排查，按场景聚合问答对。",
    documentCount: 542,
    updatedAt: "2026-04-07 16:05:00",
    badge: "产品",
  },
  {
    id: "kb-pick-sales-playbook",
    name: "销售话术与案例库",
    description: "行业案例、报价口径与异议处理要点，供销售与售前快速引用。",
    documentCount: 89,
    updatedAt: "2026-04-06 09:40:00",
    badge: "销售",
  },
  {
    id: "kb-pick-ops-runbook",
    name: "运维排障与变更手册",
    description: "标准操作步骤、应急预案与变更记录模板，支撑一线运维处置。",
    documentCount: 124,
    updatedAt: "2026-04-05 14:12:00",
    badge: "运维",
  },
  {
    id: "kb-pick-hr-policy",
    name: "人力政策与流程说明",
    description: "假期、绩效、入职离职等 HR 政策原文与流程图解。",
    documentCount: 67,
    updatedAt: "2026-04-04 10:00:00",
    badge: "人力",
  },
  {
    id: "kb-pick-security-baseline",
    name: "安全基线与审计要点",
    description: "等保要点、日志留存与安全事件分级说明，供审计与自查引用。",
    documentCount: 41,
    updatedAt: "2026-04-03 08:55:00",
    badge: "安全",
  },
  {
    id: "kb-pick-legal-templates",
    name: "合同与法务模板库",
    description: "标准合同条款、补充协议范本及风险提示语料。",
    documentCount: 73,
    updatedAt: "2026-04-02 17:30:00",
    badge: "法务",
  },
  {
    id: "kb-pick-research-notes",
    name: "研报与行业观察摘要",
    description: "内部整理的公开研报摘要、数据口径与引用来源索引。",
    documentCount: 215,
    updatedAt: "2026-04-01 13:18:00",
    badge: "研究",
  },
];

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 条/页" },
  { value: "20", label: "20 条/页" },
  { value: "50", label: "50 条/页" },
];

const PRIMARY = "#1890ff";

function getVisiblePageIndices(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const s = new Set<number>([1, total]);
  for (let p = current - 2; p <= current + 2; p++) {
    if (p >= 1 && p <= total) s.add(p);
  }
  return [...s].sort((a, b) => a - b);
}

function shouldEllipsisBefore(page: number, prev: number | undefined): boolean {
  return prev !== undefined && page - prev > 1;
}

export function KnowledgeConfigDialog({ open, onOpenChange, onConfirm }: KnowledgeConfigDialogProps) {
  const { configLabel } = useWorkbenchEntity();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpInput, setJumpInput] = useState("");

  const filteredOptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return KNOWLEDGE_CONFIG_OPTIONS;
    }
    return KNOWLEDGE_CONFIG_OPTIONS.filter((item) =>
      [item.name, item.description, item.badge, item.updatedAt]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [searchQuery]);

  const total = filteredOptions.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredOptions.slice(start, start + pageSize);
  }, [filteredOptions, safePage, pageSize]);

  const visiblePages = useMemo(() => getVisiblePageIndices(safePage, totalPages), [safePage, totalPages]);

  function handleToggleSelection(id: string, add: boolean) {
    setSelectedIds((current) => {
      if (add) {
        return current.includes(id) ? current : [...current, id];
      }
      return current.filter((item) => item !== id);
    });
  }

  function resetDialogState() {
    setSearchQuery("");
    setSelectedIds([]);
    setCurrentPage(1);
    setPageSize(10);
    setJumpInput("");
  }

  function handleSubmit() {
    const selections = KNOWLEDGE_CONFIG_OPTIONS.filter((item) => selectedIds.includes(item.id)).map(
      ({ id, name, description, documentCount, updatedAt }) => ({
        id,
        name,
        description,
        documentCount,
        updatedAt,
      })
    );
    resetDialogState();
    onConfirm(selections);
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetDialogState();
    }
    onOpenChange(nextOpen);
  }

  function applyJumpPage() {
    const n = Number.parseInt(jumpInput.trim(), 10);
    if (Number.isNaN(n) || n < 1) {
      toast.error("请输入有效页码。");
      return;
    }
    const target = Math.min(n, totalPages);
    setCurrentPage(target);
    setJumpInput(String(target));
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-[880px] gap-0 overflow-hidden rounded-lg border-[#eeeeee] p-0 shadow-lg sm:max-w-[880px]"
      >
        <DialogHeader className="border-b border-[#eeeeee] px-6 py-4 text-left">
          <DialogTitle className="text-base font-semibold text-slate-950">选择知识库</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-0">
          <div className="flex flex-col gap-3 border-b border-[#eeeeee] px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative min-w-0 flex-1 sm:max-w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索知识库名称"
                className="h-9 border-slate-200 bg-white pl-9 shadow-none"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 border-slate-200 shadow-none"
                aria-label="刷新列表"
                onClick={() => toast.success("知识库列表已刷新。")}
              >
                <RefreshCw className="h-4 w-4 text-slate-600" />
              </Button>
              <Button
                type="button"
                className="h-9 gap-1 border-0 px-4 text-white shadow-none hover:opacity-90"
                style={{ backgroundColor: PRIMARY }}
                onClick={() => toast.info("创建知识库入口即将接入。")}
              >
                <Plus className="h-4 w-4" />
                创建知识库
              </Button>
            </div>
          </div>

          <div className="max-h-[min(420px,50vh)] overflow-y-auto">
            {pageItems.length ? (
              <ul className="divide-y divide-[#eeeeee]">
                {pageItems.map((item) => {
                  const selected = selectedIds.includes(item.id);
                  return (
                    <li key={item.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-1 gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-sky-100">
                          <FileStack className="h-5 w-5 text-sky-700" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[15px] font-medium text-slate-900">{item.name}</span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{item.documentCount} 篇</span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{item.badge}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">更新时间: {item.updatedAt}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pl-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-slate-300 bg-white px-3 text-slate-800 shadow-none hover:bg-slate-50"
                          onClick={() => toast.message(item.name, { description: item.description })}
                        >
                          查看
                        </Button>
                        {selected ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 border-slate-300 bg-white px-3 text-slate-800 shadow-none hover:bg-slate-50"
                            onClick={() => handleToggleSelection(item.id, false)}
                          >
                            移除
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 border px-3 shadow-none hover:opacity-90"
                            style={{ borderColor: PRIMARY, color: PRIMARY }}
                            onClick={() => handleToggleSelection(item.id, true)}
                          >
                            添加
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-6 py-16 text-center text-sm text-slate-400">暂无匹配的知识库，请调整搜索条件。</div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-[#eeeeee] px-6 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>共 {total} 条</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-slate-200 shadow-none"
                    disabled={safePage <= 1}
                    aria-label="上一页"
                    onClick={() => setCurrentPage((p) => Math.max(1, Math.min(p, totalPages) - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {visiblePages.map((page, idx) => (
                    <span key={page} className="flex items-center">
                      {shouldEllipsisBefore(page, visiblePages[idx - 1]) ? (
                        <span className="px-1 text-slate-400">…</span>
                      ) : null}
                      <button
                        type="button"
                        className={cn(
                          "min-w-8 rounded px-2.5 py-1 text-sm transition-colors",
                          safePage === page ? "font-medium text-white" : "text-slate-600 hover:bg-slate-100"
                        )}
                        style={safePage === page ? { backgroundColor: PRIMARY } : undefined}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </span>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-slate-200 shadow-none"
                    disabled={safePage >= totalPages}
                    aria-label="下一页"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, Math.min(p, totalPages) + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(Number(v))}
                  options={PAGE_SIZE_OPTIONS}
                  className="h-8 w-[108px] border-slate-200 text-sm"
                />
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap text-slate-600">前往</span>
                  <Input
                    value={jumpInput}
                    onChange={(e) => setJumpInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyJumpPage()}
                    className="h-8 w-14 border-slate-200 px-2 text-center text-sm shadow-none"
                    inputMode="numeric"
                  />
                  <span className="whitespace-nowrap text-slate-600">页</span>
                  <Button type="button" variant="outline" size="sm" className="h-8 border-slate-200 shadow-none" onClick={applyJumpPage}>
                    确定
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button type="button" variant="ghost" className="text-slate-600" onClick={() => handleDialogOpenChange(false)}>
                  取消
                </Button>
                <Button
                  type="button"
                  className="text-white shadow-none hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: PRIMARY }}
                  disabled={!selectedIds.length}
                  onClick={handleSubmit}
                >
                  添加到{configLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
