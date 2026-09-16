"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bot,
  Check,
  FileArchive,
  FileUp,
  GitBranch,
  Loader2,
  RotateCcw,
  UploadCloud,
  Workflow,
  XCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  buildImportPreview,
  IMPORT_OBJECT_LABELS,
  validateImportFile,
  type ImportObjectType,
  type ImportPreview,
  type RelatedObjectMode,
} from "@/lib/agent-import-export";
import { cn } from "@/lib/utils";

type ImportStep = "upload" | "confirm" | "processing" | "failure";
type ImportDemoScenario = "success" | "success_with_warnings" | "validation_failure" | "creation_failure";

const DEMO_SCENARIOS: Array<{ value: ImportDemoScenario; label: string }> = [
  { value: "success", label: "成功" },
  { value: "success_with_warnings", label: "成功，有待补配" },
  { value: "validation_failure", label: "文件校验失败" },
  { value: "creation_failure", label: "对象创建失败" },
];

function ObjectIcon({ type }: { type: ImportObjectType }) {
  if (type === "workflow") return <GitBranch className="h-4 w-4" />;
  if (type === "workflow_agent") return <Workflow className="h-4 w-4" />;
  return <Bot className="h-4 w-4" />;
}

export function ImportConfigurationDialog({
  open,
  onOpenChange,
  objectType,
  objectTypeChoices,
  destinationHref,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectType: ImportObjectType;
  objectTypeChoices?: ImportObjectType[];
  destinationHref: string | Partial<Record<ImportObjectType, string>>;
  onImported?: (preview: ImportPreview) => void;
}) {
  const router = useRouter();
  const inputId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [step, setStep] = useState<ImportStep>("upload");
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<ImportDemoScenario>("success_with_warnings");
  const [relatedMode, setRelatedMode] = useState<RelatedObjectMode>("publish");
  const [detectedObjectType, setDetectedObjectType] = useState<ImportObjectType>(objectType);

  const preview = useMemo(
    () => buildImportPreview(detectedObjectType, selectedFileName || `${IMPORT_OBJECT_LABELS[detectedObjectType]}配置包.zip`, selectedScenario === "success_with_warnings", relatedMode),
    [detectedObjectType, relatedMode, selectedFileName, selectedScenario]
  );

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep("upload");
    setError(null);
    setSelectedFileName("");
    setSelectedScenario("success_with_warnings");
    setRelatedMode("publish");
    setDetectedObjectType(objectType);
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) timerRef.current = setTimeout(reset, 180);
  }

  function draftHref(result: "success" | "success_with_warnings", importedObjectType: ImportObjectType) {
    const destination = typeof destinationHref === "string" ? destinationHref : destinationHref[importedObjectType] ?? destinationHref[objectType] ?? "/agent";
    const separator = destination.includes("?") ? "&" : "?";
    return `${destination}${separator}importResult=${result}&importMode=create&relatedMode=${relatedMode}`;
  }

  function choosePackage(fileName: string, scenario: ImportDemoScenario = "success_with_warnings", packageObjectType: ImportObjectType = detectedObjectType) {
    setError(null);
    setSelectedFileName(fileName);
    setSelectedScenario(scenario);
    setDetectedObjectType(packageObjectType);
    if (scenario === "validation_failure") {
      setStep("failure");
      return;
    }
    const validationError = validateImportFile(fileName);
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep("confirm");
  }

  function executeImport() {
    setStep("processing");
    timerRef.current = setTimeout(() => {
      if (selectedScenario === "creation_failure") {
        setStep("failure");
        return;
      }
      const importedPreview = buildImportPreview(
        detectedObjectType,
        selectedFileName,
        selectedScenario === "success_with_warnings",
        relatedMode
      );
      onImported?.(importedPreview);
      onOpenChange(false);
      router.push(draftHref(selectedScenario === "success_with_warnings" || relatedMode === "draft" ? "success_with_warnings" : "success", detectedObjectType));
      timerRef.current = setTimeout(reset, 180);
    }, 900);
  }

  const activeStepIndex = step === "upload" ? 0 : 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[720px]" showCloseButton={step !== "processing"}>
        <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
          <DialogTitle className="text-lg font-semibold text-slate-950">导入配置包</DialogTitle>
          <DialogDescription>导入后会创建新对象，不会覆盖同名对象。</DialogDescription>
          <div className="flex items-center pt-3">
            {["选择配置包", "确认导入"].map((label, index) => (
              <div key={label} className={cn("flex items-center", index === 0 && "flex-1")}>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold",
                    index < activeStepIndex
                      ? "border-blue-600 bg-blue-600 text-white"
                      : index === activeStepIndex
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-400"
                  )}>{index < activeStepIndex ? <Check className="h-3.5 w-3.5" /> : index + 1}</span>
                  <span className={cn("text-xs font-medium", index <= activeStepIndex ? "text-slate-800" : "text-slate-400")}>{label}</span>
                </div>
                {index === 0 ? <div className={cn("mx-3 h-px flex-1", activeStepIndex > 0 ? "bg-blue-500" : "bg-slate-200")} /> : null}
              </div>
            ))}
          </div>
        </DialogHeader>

        {step === "upload" ? (
          <div className="space-y-4 px-6 py-5">
            <label htmlFor={inputId} className={cn(
              "flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed bg-slate-50/70 px-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/40",
              error ? "border-rose-300" : "border-slate-300"
            )}>
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-[8px] bg-blue-50 text-blue-600"><UploadCloud className="h-6 w-6" /></span>
              <span className="text-sm font-medium text-slate-900">点击选择，或将 ZIP 配置包拖到这里</span>
              <span className="mt-2 text-xs leading-5 text-slate-500">仅支持 Agent Foundry 导出的 .zip 配置包，最大 128 MB</span>
              <input id={inputId} type="file" accept=".zip,application/zip" className="sr-only" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) choosePackage(file.name);
              }} />
            </label>
            {error ? (
              <div className="flex items-start gap-2 rounded-[6px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
            {objectTypeChoices && objectTypeChoices.length > 1 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs text-slate-500">原型示例包</span>
                {objectTypeChoices.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={cn(
                      "rounded-[4px] border px-2.5 py-1.5 text-xs",
                      detectedObjectType === type ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"
                    )}
                    onClick={() => setDetectedObjectType(type)}
                  >
                    {IMPORT_OBJECT_LABELS[type]}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <span className="mr-1 text-xs text-slate-500">原型状态</span>
              {DEMO_SCENARIOS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className="rounded-[4px] border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:border-blue-300 hover:text-blue-700"
                  onClick={() => choosePackage(`${IMPORT_OBJECT_LABELS[detectedObjectType]}-${item.label}.zip`, item.value, detectedObjectType)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === "confirm" ? (
          <>
            <div className="max-h-[520px] space-y-5 overflow-y-auto px-6 py-5">
              <div className="flex items-center gap-3 rounded-[6px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                <FileArchive className="h-5 w-5 shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">{selectedFileName}</div>
                  <div className="mt-0.5 text-xs text-slate-500">协议版本 {preview.schemaVersion}</div>
                </div>
                <button type="button" className="text-xs text-blue-600 hover:text-blue-700" onClick={() => setStep("upload")}>重新选择</button>
              </div>

              <section>
                <div className="mb-2 text-xs font-medium text-slate-500">主对象</div>
                <div className="rounded-[6px] border border-blue-200 bg-blue-50/40 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-blue-600 text-white"><ObjectIcon type={preview.objectType} /></span>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-950">{preview.objectName}</div>
                      <div className="mt-1 text-xs text-blue-700">{preview.objectTypeLabel} · {preview.sourceLabel}</div>
                      <p className="mt-2 text-sm text-slate-600">{preview.description}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">关联对象（{preview.relatedObjects.length}）</span>
                  <span className="text-xs text-slate-400">仅包含主对象直接引用的一层</span>
                </div>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-[6px] border border-slate-200">
                  {preview.relatedObjects.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-slate-100 text-slate-600"><ObjectIcon type={item.type} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900">{item.name}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{IMPORT_OBJECT_LABELS[item.type]} · {item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <fieldset>
                <legend className="mb-2 text-xs font-medium text-slate-500">关联对象处理方式</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className={cn("cursor-pointer rounded-[6px] border p-3", relatedMode === "publish" ? "border-blue-500 bg-blue-50/50" : "border-slate-200 bg-white")}>
                    <input className="sr-only" type="radio" name="related-mode" checked={relatedMode === "publish"} onChange={() => setRelatedMode("publish")} />
                    <div className="flex items-start gap-2">
                      <span className={cn("mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border", relatedMode === "publish" ? "border-blue-600" : "border-slate-300")}>
                        {relatedMode === "publish" ? <span className="h-2 w-2 rounded-full bg-blue-600" /> : null}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-slate-900">发布并恢复引用</div>
                        <div className="mt-1 text-xs leading-5 text-slate-500">满足发布条件时直接发布，并恢复主对象引用</div>
                      </div>
                    </div>
                  </label>
                  <label className={cn("cursor-pointer rounded-[6px] border p-3", relatedMode === "draft" ? "border-blue-500 bg-blue-50/50" : "border-slate-200 bg-white")}>
                    <input className="sr-only" type="radio" name="related-mode" checked={relatedMode === "draft"} onChange={() => setRelatedMode("draft")} />
                    <div className="flex items-start gap-2">
                      <span className={cn("mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border", relatedMode === "draft" ? "border-blue-600" : "border-slate-300")}>
                        {relatedMode === "draft" ? <span className="h-2 w-2 rounded-full bg-blue-600" /> : null}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-slate-900">仅保存为草稿</div>
                        <div className="mt-1 text-xs leading-5 text-slate-500">关联对象保留为草稿，主对象引用将标记待补配</div>
                      </div>
                    </div>
                  </label>
                </div>
              </fieldset>
            </div>
            <DialogFooter className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <Button type="button" variant="outline" className="rounded-[4px] border-slate-300 bg-white shadow-none" onClick={() => handleOpenChange(false)}>取消</Button>
              <Button type="button" className="rounded-[4px] bg-blue-600 text-white shadow-none hover:bg-blue-700" onClick={executeImport}>确认导入</Button>
            </DialogFooter>
          </>
        ) : null}

        {step === "processing" ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Loader2 className="h-7 w-7 animate-spin" /></span>
            <div className="mt-5 text-base font-semibold text-slate-900">正在校验并导入配置包</div>
            <div className="mt-2 text-sm text-slate-500">正在创建主对象及关联对象，请稍候…</div>
          </div>
        ) : null}

        {step === "failure" ? (
          <>
            <div className="px-6 py-8">
              <div className="flex flex-col items-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600"><XCircle className="h-7 w-7" /></span>
                <div className="mt-4 text-lg font-semibold text-slate-950">导入失败</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">未创建主对象或关联对象。</p>
              </div>
              <div className="mt-6 rounded-[6px] border border-rose-200 bg-rose-50/50 p-4 text-sm text-rose-800">
                {selectedScenario === "validation_failure"
                  ? "配置包校验失败：manifest.yaml 缺少主对象对应的 DSL 文件。"
                  : "对象创建失败：系统未能保存主对象草稿，请稍后重试（错误码：AF-IMP-5001）。"}
              </div>
            </div>
            <DialogFooter className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>关闭</Button>
              <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={reset}><RotateCcw className="h-4 w-4" />重新选择</Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function ImportConfigurationButton({
  objectType,
  objectTypeChoices,
  destinationHref,
  onImported,
  className,
}: {
  objectType: ImportObjectType;
  objectTypeChoices?: ImportObjectType[];
  destinationHref: string | Partial<Record<ImportObjectType, string>>;
  onImported?: (preview: ImportPreview) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" className={cn("h-8 rounded-[4px] border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-none hover:bg-slate-50", className)} onClick={() => setOpen(true)}>
        <FileUp className="h-4 w-4" />导入
      </Button>
      <ImportConfigurationDialog open={open} onOpenChange={setOpen} objectType={objectType} objectTypeChoices={objectTypeChoices} destinationHref={destinationHref} onImported={onImported} />
    </>
  );
}
