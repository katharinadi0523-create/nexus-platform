"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, ChevronLeft, ChevronRight, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { MemoryStore } from "@/lib/mock/memory-management";
import { formatMemoryVersionLabel } from "@/lib/mock/memory-management";
import { AccessBadge } from "@/components/memory-management/memory-shared";
import { cn } from "@/lib/utils";

function toMemoryStoreLabel(name: string): string {
  const base = name.trim().replace(/^store[_-]?/i, "");
  if (base.endsWith("记忆库")) {
    return base;
  }
  return `${base}记忆库`;
}

interface MemoryMountConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: MemoryStore[];
  onConfirm: (storeIds: string[]) => void;
}

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
  const pages = new Set<number>([1, total]);
  for (let page = current - 2; page <= current + 2; page++) {
    if (page >= 1 && page <= total) {
      pages.add(page);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

function shouldEllipsisBefore(page: number, prev: number | undefined): boolean {
  return prev !== undefined && page - prev > 1;
}

export function MemoryMountConfigDialog({
  open,
  onOpenChange,
  stores,
  onConfirm,
}: MemoryMountConfigDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpInput, setJumpInput] = useState("");

  const filteredStores = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return stores;
    }
    return stores.filter((store) =>
      [store.name, store.description, store.updatedAt, toMemoryStoreLabel(store.name)]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [searchQuery, stores]);

  const total = filteredStores.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredStores.slice(start, start + pageSize);
  }, [filteredStores, safePage, pageSize]);

  const visiblePages = useMemo(
    () => getVisiblePageIndices(safePage, totalPages),
    [safePage, totalPages]
  );

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
    if (!selectedIds.length) {
      return;
    }
    onConfirm(selectedIds);
    resetDialogState();
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetDialogState();
    }
    onOpenChange(nextOpen);
  }

  function applyJumpPage() {
    const pageNumber = Number.parseInt(jumpInput.trim(), 10);
    if (Number.isNaN(pageNumber) || pageNumber < 1) {
      toast.error("请输入有效页码。");
      return;
    }
    const target = Math.min(pageNumber, totalPages);
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
          <DialogTitle className="text-base font-semibold text-slate-950">
            挂载组织共享记忆库
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-0">
          <div className="flex flex-col gap-3 border-b border-[#eeeeee] px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative min-w-0 flex-1 sm:max-w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="搜索记忆库名称"
                className="h-9 border-slate-200 bg-white pl-9 shadow-none"
                aria-label="按名称检索记忆库"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 border-slate-200 shadow-none"
                aria-label="刷新列表"
                onClick={() => toast.success("记忆库列表已刷新。")}
              >
                <RefreshCw className="h-4 w-4 text-slate-600" />
              </Button>
              <Button
                type="button"
                className="h-9 gap-1 border-0 px-4 text-white shadow-none hover:opacity-90"
                style={{ backgroundColor: PRIMARY }}
                onClick={() => router.push("/memory-management")}
              >
                <Plus className="h-4 w-4" />
                创建记忆库
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-[#eeeeee] bg-slate-50 px-6 py-2.5 text-sm text-slate-600">
            <span className="text-slate-500">已选择({selectedIds.length})</span>
            <span className="text-slate-300">|</span>
            <AccessBadge access="read_write" />
            <span>本期挂载库统一为全量读写；细粒度 RO/RW 待平台数据权限就绪后再做。</span>
          </div>

          <div className="max-h-[min(420px,50vh)] overflow-y-auto">
            {pageItems.length ? (
              <ul className="divide-y divide-[#eeeeee]">
                {pageItems.map((store) => {
                  const selected = selectedIds.includes(store.id);
                  const label = toMemoryStoreLabel(store.name);
                  return (
                    <li
                      key={store.id}
                      className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 flex-1 gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-sky-100">
                          <BrainCircuit className="h-5 w-5 text-sky-700" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[15px] font-medium text-slate-900">{label}</span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              {store.nodeCount} 个主题文件
                            </span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              {formatMemoryVersionLabel(store.currentVersion)}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                            {store.description}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">更新时间: {store.updatedAt}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pl-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-slate-300 bg-white px-3 text-slate-800 shadow-none hover:bg-slate-50"
                          onClick={() => {
                            onOpenChange(false);
                            router.push(`/memory-management/stores/${store.id}`);
                          }}
                        >
                          查看
                        </Button>
                        {selected ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 border-slate-300 bg-white px-3 text-slate-800 shadow-none hover:bg-slate-50"
                            onClick={() => handleToggleSelection(store.id, false)}
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
                            onClick={() => handleToggleSelection(store.id, true)}
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
              <div className="px-6 py-16 text-center text-sm text-slate-400">
                {stores.length
                  ? "暂无匹配的记忆库，请调整搜索条件。"
                  : "当前没有可挂载的组织共享记忆库。"}
              </div>
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
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {visiblePages.map((page, index) => (
                    <span key={page} className="flex items-center">
                      {shouldEllipsisBefore(page, visiblePages[index - 1]) ? (
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
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                  options={PAGE_SIZE_OPTIONS}
                  className="h-8 w-[108px] border-slate-200 text-sm"
                />
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap text-slate-600">前往</span>
                  <Input
                    value={jumpInput}
                    onChange={(event) => setJumpInput(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && applyJumpPage()}
                    className="h-8 w-14 border-slate-200 px-2 text-center text-sm shadow-none"
                    inputMode="numeric"
                  />
                  <span className="whitespace-nowrap text-slate-600">页</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-slate-200 shadow-none"
                    onClick={applyJumpPage}
                  >
                    确定
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-slate-600"
                  onClick={() => handleDialogOpenChange(false)}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  className="text-white shadow-none hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: PRIMARY }}
                  disabled={!selectedIds.length}
                  onClick={handleSubmit}
                >
                  确认挂载
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
