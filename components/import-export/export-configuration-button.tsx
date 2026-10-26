"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bot, Check, CheckCircle2, FileArchive, FileDown, GitBranch, Loader2, RotateCcw, Workflow } from "lucide-react";
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
import { SecurityLevelBadge } from "@/components/security/security-level-badge";
import { isHighSecurityLevel, type SecurityLevel } from "@/lib/security-level";
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
  securityLevel = "公开",
  disabled = false,
  disabledTitle,
}: {
  objectType: ImportObjectType;
  objectName: string;
  sourceType: "published";
  sourceVersion?: string;
  className?: string;
  display?: "button" | "table-action";
  allowExport?: boolean;
  securityLevel?: SecurityLevel;
  disabled?: boolean;
  disabledTitle?: string;
}) {
  const relatedObjects = useMemo(() => EXPORT_RELATED_OBJECTS[objectType], [objectType]);
  const exportBlocked = disabled || isHighSecurityLevel(securityLevel);
  const exportBlockedTitle = disabledTitle
    ?? (isHighSecurityLevel(securityLevel)
      ? "密级管理已开启，仅公开、内部资源可以导出"
      : undefined);
  const exportableRelatedObjects = useMemo(
    () => relatedObjects.filter((item) => !isHighSecurityLevel(item.securityLevel)),
    [relatedObjects]
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [partialSuccessOpen, setPartialSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => exportableRelatedObjects.map((item) => item.id));
  const [failedRelatedIds, setFailedRelatedIds] = useState<string[]>([]);
  const sourceLabel = sourceVersion ? `最新发布版本 ${sourceVersion}` : "最新发布版本";

  if (!allowExport) return null;

  function toggleRelated(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function openConfirm() {
    if (exportBlocked) return;
    setSelectedIds(exportableRelatedObjects.map((item) => item.id));
    setConfirmOpen(true);
  }

  function downloadExport(excludedIds: string[] = []) {
    const selectedRelated = exportableRelatedObjects.filter((item) => selectedIds.includes(item.id) && !excludedIds.includes(item.id));
    const failedRelated = relatedObjects.filter((item) => excludedIds.includes(item.id));
    const manifest = buildExportPackageManifest({ objectType, objectName, sourceVersion, securityLevel, relatedObjects: selectedRelated });
    const prototypePackage = [
      "Agent Foundry prototype configuration package",
      "--- manifest.yaml ---",
      manifest,
      "--- note ---",
      "密钥及凭证信息未写入配置包。",
      ...(failedRelated.length
        ? ["以下关联对象未成功导出：", ...failedRelated.map((item) => `- ${item.name}`)]
        : []),
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

  function handlePartialSuccessDemo() {
    if (exporting) return;
    const failedIds = selectedIds.slice(0, Math.min(2, selectedIds.length));
    if (failedIds.length === 0) {
      toast.info("当前未选择关联对象，没有可演示的关联对象失败结果。");
      return;
    }
    setConfirmOpen(false);
    setExporting(true);
    window.setTimeout(() => {
      setFailedRelatedIds(failedIds);
      setExporting(false);
      setPartialSuccessOpen(true);
    }, 500);
  }

  function handlePartialDownload() {
    downloadExport(failedRelatedIds);
    setPartialSuccessOpen(false);
    toast.success("配置包已下载，未成功导出的关联对象未写入配置包");
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
          onClick={openConfirm}
          disabled={exportBlocked}
          title={exportBlockedTitle}
          className={cn(
            "text-sm text-blue-600 hover:text-blue-700",
            exportBlocked && "cursor-not-allowed text-slate-400 hover:text-slate-400",
            className
          )}
        >
          {exportBlocked ? "不可导出" : "导出"}
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={openConfirm}
          disabled={exportBlocked}
          title={exportBlockedTitle}
          className={cn("h-8 rounded-[4px] border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-none hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400", className)}
        >
          <FileDown className="h-4 w-4" />{exportBlocked ? "不可导出" : "导出"}
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
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    <span>{IMPORT_OBJECT_LABELS[objectType]} · {sourceLabel}</span>
                    <SecurityLevelBadge level={securityLevel} />
                  </div>
                </div>
              </div>
            </section>

            <div className="rounded-[6px] border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
              配置包将保留对象密级，导出操作不会改变原资源密级。密级管理开启时，仅允许导出公开、内部资源。
            </div>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">选择需要导出的关联对象（{selectedIds.length}/{exportableRelatedObjects.length}）</span>
                <span className="text-xs text-slate-400">可导出对象默认全选</span>
              </div>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-[6px] border border-slate-200">
                {relatedObjects.map((item) => {
                  const checked = selectedIds.includes(item.id);
                  const blocked = isHighSecurityLevel(item.securityLevel);
                  return (
                    <label key={item.id} className={cn("flex items-center gap-3 px-4 py-3", blocked ? "cursor-not-allowed bg-slate-50/80" : "cursor-pointer hover:bg-slate-50")}>
                      <input type="checkbox" className="sr-only" checked={checked} disabled={blocked} onChange={() => toggleRelated(item.id)} />
                      <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border", checked ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white")}>
                        {checked ? <Check className="h-3 w-3" /> : null}
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-slate-100 text-slate-600"><ObjectIcon type={item.type} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-900">{item.name}</span>
                        <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                          <span>{IMPORT_OBJECT_LABELS[item.type]} · {item.description}</span>
                          <SecurityLevelBadge level={item.securityLevel} />
                          {blocked ? <span className="font-medium text-rose-600">不可导出</span> : null}
                        </span>
                        <span className="mt-1 block truncate text-[11px] text-slate-400">引用路径：{item.relationPath}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">关联对象也须满足密级限制；高密对象不会写入配置包。相同对象仅导出一次，模型、知识库等外部资源以及密钥、凭证不会被导出。</p>
            </section>
          </div>
          <DialogFooter className="flex-row items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:justify-between">
            <div className="flex items-center gap-4">
              <button type="button" className="text-xs text-amber-700 hover:text-amber-800" onClick={handlePartialSuccessDemo}>查看关联对象失败状态</button>
              <button type="button" className="text-xs text-slate-500 hover:text-rose-600" onClick={handleFailureDemo}>查看主对象失败状态</button>
            </div>
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

      <Dialog open={partialSuccessOpen} onOpenChange={setPartialSuccessOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[560px]">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-lg font-semibold text-slate-950">配置包已生成</DialogTitle>
            <DialogDescription>主对象导出成功，关联对象按对象独立处理。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-6">
            <div className="flex items-start gap-3 rounded-[6px] border border-amber-200 bg-amber-50/70 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-amber-600"><AlertTriangle className="h-6 w-6" /></span>
              <div>
                <div className="text-sm font-semibold text-amber-950">导出完成，存在未成功导出的关联对象</div>
                <p className="mt-1 text-sm leading-6 text-amber-800">配置包可正常使用。下列对象未写入配置包，其余对象不受影响。</p>
              </div>
            </div>

            <div className="rounded-[6px] border border-emerald-200 bg-emerald-50/50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-900"><CheckCircle2 className="h-4 w-4" />主对象已导出</div>
              <div className="mt-1 pl-6 text-xs text-emerald-700">{objectName} · {sourceLabel}</div>
            </div>

            <section>
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                <span>未成功导出的关联对象</span>
                <span>{failedRelatedIds.length} 个</span>
              </div>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-[6px] border border-slate-200">
                {relatedObjects.filter((item) => failedRelatedIds.includes(item.id)).map((item, index) => (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-slate-100 text-slate-600"><ObjectIcon type={item.type} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-900">{item.name}</div>
                      <div className="mt-1 text-xs leading-5 text-rose-600">{index === 0 ? "最新发布版本配置读取失败" : "当前用户无导出权限"}</div>
                      <div className="mt-0.5 truncate text-[11px] text-slate-400">{item.relationPath}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">每个关联对象独立导出；单个对象失败不会中断其他对象，也不会阻断配置包生成。</p>
            </section>
          </div>
          <DialogFooter className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setPartialSuccessOpen(false)}>关闭</Button>
            <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handlePartialDownload}><FileDown className="h-4 w-4" />下载配置包</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={failureOpen} onOpenChange={setFailureOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[520px]">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-lg font-semibold text-slate-950">导出失败</DialogTitle>
            <DialogDescription>主对象导出失败，未生成配置包。</DialogDescription>
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
