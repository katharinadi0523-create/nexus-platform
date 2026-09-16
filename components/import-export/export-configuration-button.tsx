"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bot, Check, FileArchive, FileDown, GitBranch, Loader2, RotateCcw, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  buildExportPackageManifest,
  EXPORT_RELATED_OBJECTS,
  IMPORT_OBJECT_LABELS,
  sanitizeExportFileName,
  type ImportObjectType,
} from "@/lib/agent-import-export";
import { cn } from "@/lib/utils";

function ObjectIcon({ type }: { type: ImportObjectType }) {
  if (type === "workflow") return <GitBranch className="h-4 w-4" />;
  if (type === "workflow_agent") return <Workflow className="h-4 w-4" />;
  return <Bot className="h-4 w-4" />;
}

export function ExportConfigurationButton({
  objectType,
  objectName,
  sourceVersion,
  className,
  display = "button",
  allowExport = true,
}: {
  objectType: ImportObjectType;
  objectName: string;
  sourceType: "published";
  sourceVersion?: string;
  className?: string;
  display?: "button" | "table-action";
  allowExport?: boolean;
  disabled?: boolean;
  disabledTitle?: string;
}) {
  const relatedObjects = useMemo(() => EXPORT_RELATED_OBJECTS[objectType], [objectType]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => relatedObjects.map((item) => item.id));
  const sourceLabel = sourceVersion ? `最新发布版本 ${sourceVersion}` : "最新发布版本";

  if (!allowExport) return null;

  function toggleRelated(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function downloadExport() {
    const selectedRelated = relatedObjects.filter((item) => selectedIds.includes(item.id));
    const manifest = buildExportPackageManifest({ objectType, objectName, sourceVersion, relatedObjects: selectedRelated });
    const prototypePackage = [
      "Agent Foundry prototype configuration package",
      "--- manifest.yaml ---",
      manifest,
      "--- note ---",
      "密钥及凭证信息未写入配置包。",
    ].join("\n");
    const blob = new Blob([prototypePackage], { type: "application/zip" });
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
      setConfirmOpen(false);
      toast.success("配置包已生成并下载");
    }, 650);
  }

  function handleFailureDemo() {
    setConfirmOpen(false);
    setExporting(true);
    window.setTimeout(() => {
      setExporting(false);
      setFailureOpen(true);
    }, 500);
  }

  return (
    <>
      {display === "table-action" ? (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className={cn("text-sm text-blue-600 hover:text-blue-700", className)}
        >
          导出
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirmOpen(true)}
          className={cn("h-8 rounded-[4px] border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-none hover:bg-slate-50", className)}
        >
          <FileDown className="h-4 w-4" />导出
        </Button>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[640px]" showCloseButton={!exporting}>
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-lg font-semibold text-slate-950">导出配置包</DialogTitle>
            <DialogDescription>将导出{sourceLabel}，不包含当前草稿中的未发布修改。</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 px-6 py-5">
            <section>
              <div className="mb-2 text-xs font-medium text-slate-500">主对象</div>
              <div className="flex items-center gap-3 rounded-[6px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-blue-600 text-white"><ObjectIcon type={objectType} /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-950">{objectName}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{IMPORT_OBJECT_LABELS[objectType]} · {sourceLabel}</div>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">随包导出的关联对象（{selectedIds.length}/{relatedObjects.length}）</span>
                <span className="text-xs text-slate-400">默认全部选择</span>
              </div>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-[6px] border border-slate-200">
                {relatedObjects.map((item) => {
                  const checked = selectedIds.includes(item.id);
                  return (
                    <label key={item.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50">
                      <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleRelated(item.id)} />
                      <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border", checked ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white")}>
                        {checked ? <Check className="h-3 w-3" /> : null}
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-slate-100 text-slate-600"><ObjectIcon type={item.type} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-900">{item.name}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{IMPORT_OBJECT_LABELS[item.type]} · {item.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">仅列出当前对象直接引用的一层对象；模型、知识库等资源不会打包，密钥及凭证会被过滤。</p>
            </section>
          </div>
          <DialogFooter className="flex-row items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:justify-between">
            <button type="button" className="text-xs text-slate-500 hover:text-rose-600" onClick={handleFailureDemo}>查看导出失败状态</button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="rounded-[4px] border-slate-300 bg-white shadow-none" onClick={() => setConfirmOpen(false)}>取消</Button>
              <Button type="button" disabled={exporting} className="rounded-[4px] bg-blue-600 text-white shadow-none hover:bg-blue-700" onClick={handleExport}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}
                {exporting ? "生成中" : "导出配置包"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={failureOpen} onOpenChange={setFailureOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[520px]">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-lg font-semibold text-slate-950">导出失败</DialogTitle>
            <DialogDescription>未生成不完整的配置包。</DialogDescription>
          </DialogHeader>
          <div className="px-6 py-6">
            <div className="flex items-start gap-3 rounded-[6px] border border-rose-200 bg-rose-50/50 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-rose-600"><AlertTriangle className="h-6 w-6" /></span>
              <div>
                <div className="text-sm font-medium text-rose-900">配置包生成失败</div>
                <p className="mt-1 text-sm leading-6 text-rose-800">最新发布版本配置读取失败，请稍后重试。</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-[88px_minmax(0,1fr)] gap-y-3 rounded-[6px] border border-slate-200 bg-slate-50 p-4 text-sm">
              <dt className="text-slate-500">导出对象</dt><dd className="font-medium text-slate-800">{objectName}</dd>
              <dt className="text-slate-500">失败原因</dt><dd className="font-medium text-slate-800">最新发布版本配置读取失败</dd>
            </dl>
          </div>
          <DialogFooter className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setFailureOpen(false)}>关闭</Button>
            <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => { setFailureOpen(false); setConfirmOpen(true); }}><RotateCcw className="h-4 w-4" />重新导出</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
