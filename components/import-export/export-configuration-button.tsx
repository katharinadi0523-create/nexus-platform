"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, Download, FileDown, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  buildExportYaml,
  sanitizeExportFileName,
  type ImportObjectType,
} from "@/lib/agent-import-export";
import { cn } from "@/lib/utils";

export function ExportConfigurationButton({
  objectType,
  objectName,
  sourceType,
  sourceVersion,
  className,
}: {
  objectType: ImportObjectType;
  objectName: string;
  sourceType: "published" | "draft";
  sourceVersion?: string;
  className?: string;
}) {
  const [exporting, setExporting] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const sourceLabel =
    sourceType === "published"
      ? ("最新发布版本 " + (sourceVersion ?? "")).trim()
      : "当前草稿";

  function downloadExport() {
    const yaml = buildExportYaml({ objectType, objectName, sourceType, sourceVersion });
    const blob = new Blob([yaml], { type: "application/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = sanitizeExportFileName(objectName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function handleExport() {
    if (exporting) return;
    setExporting(true);
    window.setTimeout(() => {
      downloadExport();
      setExporting(false);
      toast.success("已导出" + sourceLabel + "，密钥及凭证信息已过滤。");
    }, 650);
  }

  function handleFailureDemo() {
    if (exporting) return;
    setExporting(true);
    window.setTimeout(() => {
      setExporting(false);
      setFailureOpen(true);
    }, 650);
  }

  return (
    <>
      <div
        className={cn(
          "inline-flex h-8 overflow-hidden rounded-[4px] border border-slate-300 bg-white text-slate-700 shadow-none",
          className
        )}
      >
        <Button
          type="button"
          variant="ghost"
          disabled={exporting}
          onClick={handleExport}
          title={"导出" + sourceLabel}
          className="h-8 rounded-none border-0 bg-transparent px-3 text-sm text-slate-700 shadow-none hover:bg-slate-50 hover:text-slate-900"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          {exporting ? "导出中" : "导出"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={exporting}
              aria-label="查看导出原型场景"
              title="查看导出原型场景"
              className="h-8 w-8 rounded-none border-0 border-l border-slate-300 bg-transparent text-slate-500 shadow-none hover:bg-slate-50 hover:text-slate-800"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-[6px] border-slate-200 p-1">
            <DropdownMenuLabel className="px-3 py-2 text-xs font-medium text-slate-500">
              原型场景
            </DropdownMenuLabel>
            <DropdownMenuItem onSelect={handleExport} className="rounded-[4px] px-3 py-2.5">
              <Download className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="text-sm font-medium text-slate-800">导出成功</div>
                <div className="mt-0.5 text-xs text-slate-500">生成 YAML 并自动下载</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleFailureDemo} className="rounded-[4px] px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <div>
                <div className="text-sm font-medium text-slate-800">导出失败</div>
                <div className="mt-0.5 text-xs text-slate-500">展示失败原因与重试操作</div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={failureOpen} onOpenChange={setFailureOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[520px]">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-lg font-semibold text-slate-950">导出失败</DialogTitle>
            <DialogDescription>未生成配置文件。</DialogDescription>
          </DialogHeader>
          <div className="px-6 py-6">
            <div className="flex items-start gap-3 rounded-[6px] border border-rose-200 bg-rose-50/50 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-rose-600">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <div>
                <div className="text-sm font-medium text-rose-900">配置文件生成失败</div>
                <p className="mt-1 text-sm leading-6 text-rose-800">
                  系统未能读取{sourceLabel}，请稍后重试。
                </p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-[100px_minmax(0,1fr)] gap-y-3 rounded-[6px] border border-slate-200 bg-slate-50 p-4 text-sm">
              <dt className="text-slate-500">导出对象</dt>
              <dd className="font-medium text-slate-800">{objectName}</dd>
              <dt className="text-slate-500">失败原因</dt>
              <dd className="font-medium text-slate-800">配置文件生成失败</dd>
              <dt className="text-slate-500">错误标识</dt>
              <dd className="font-mono text-xs text-slate-600">EXPORT_CONFIG_FAILED</dd>
            </dl>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              系统不会下载不完整的配置文件。若多次重试仍失败，请稍后再试。
            </p>
          </div>
          <DialogFooter className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-[4px] border-slate-300 bg-white shadow-none"
              onClick={() => setFailureOpen(false)}
            >
              关闭
            </Button>
            <Button
              type="button"
              className="rounded-[4px] bg-blue-600 text-white shadow-none hover:bg-blue-700"
              onClick={() => {
                setFailureOpen(false);
                handleExport();
              }}
            >
              <RotateCcw className="h-4 w-4" />
              重试导出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
