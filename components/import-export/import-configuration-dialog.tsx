"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, FileCode2, FileUp, Loader2, RotateCcw, UploadCloud, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  buildImportPreview,
  IMPORT_OBJECT_LABELS,
  validateImportFile,
  type ImportObjectType,
  type ImportPreview,
} from "@/lib/agent-import-export";
import { cn } from "@/lib/utils";

type ImportStep = "upload" | "processing" | "failure";
type ImportDemoScenario = "success" | "success_with_warnings" | "validation_failure" | "creation_failure";

const CREATE_STEP_LABELS = ["选择文件", "创建草稿"];
const OVERWRITE_STEP_LABELS = ["选择文件", "覆盖草稿"];
const DEMO_SCENARIOS: Array<{
  value: ImportDemoScenario;
  label: string;
  description: string;
  tone: string;
}> = [
  { value: "success", label: "导入成功", description: "创建草稿并进入编辑页", tone: "border-emerald-200 bg-emerald-50/60 text-emerald-800" },
  { value: "success_with_warnings", label: "成功，有待补配资源", description: "保留节点并标记异常", tone: "border-amber-200 bg-amber-50/60 text-amber-800" },
  { value: "validation_failure", label: "文件校验失败", description: "提示原因，不创建对象", tone: "border-rose-200 bg-rose-50/60 text-rose-800" },
  { value: "creation_failure", label: "对象创建失败", description: "提示原因，不创建对象", tone: "border-rose-200 bg-rose-50/60 text-rose-800" },
];

export function ImportConfigurationDialog({
  open,
  onOpenChange,
  objectType,
  destinationHref,
  onImported,
  mode = "create",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectType: ImportObjectType;
  destinationHref: string;
  onImported?: (preview: ImportPreview) => void;
  mode?: "create" | "overwrite";
}) {
  const router = useRouter();
  const inputId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [step, setStep] = useState<ImportStep>("upload");
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<ImportDemoScenario>("success_with_warnings");

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep("upload");
    setError(null);
    setSelectedFileName("");
    setSelectedScenario("success_with_warnings");
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) timerRef.current = setTimeout(reset, 180);
  }

  function draftHref(result: "success" | "success_with_warnings") {
    return `${destinationHref}${destinationHref.includes("?") ? "&" : "?"}importResult=${result}&importMode=${mode}`;
  }

  function executeImport(fileName: string, scenario: ImportDemoScenario) {
    setStep("processing");
    timerRef.current = setTimeout(() => {
      if (scenario === "validation_failure" || scenario === "creation_failure") {
        setStep("failure");
        return;
      }
      const preview = buildImportPreview(objectType, fileName, scenario === "success_with_warnings");
      onImported?.(preview);
      onOpenChange(false);
      router.push(draftHref(scenario));
      timerRef.current = setTimeout(reset, 180);
    }, 1000);
  }

  function selectFile(fileName: string, scenario: ImportDemoScenario = "success_with_warnings") {
    const validationError = validateImportFile(fileName);
    setError(validationError);
    if (validationError) return;
    setSelectedFileName(fileName);
    setSelectedScenario(scenario);
    if (mode === "overwrite" && scenario !== "validation_failure" && scenario !== "creation_failure") return;
    executeImport(fileName, scenario);
  }

  const stepLabels = mode === "overwrite" ? OVERWRITE_STEP_LABELS : CREATE_STEP_LABELS;
  const activeStepIndex = step === "upload" && !(mode === "overwrite" && selectedFileName)
    ? 0
    : stepLabels.length - 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[720px]" showCloseButton={step !== "processing"}>
        <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
          <DialogTitle className="text-lg font-semibold text-slate-950">{mode === "overwrite" ? "导入配置" : `导入${IMPORT_OBJECT_LABELS[objectType]}`}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {mode === "overwrite"
              ? "仅支持 Agent Foundry 导出的 YAML 配置文件。"
              : "选择文件后将自动校验并创建新草稿，不会覆盖同名对象。"}
          </DialogDescription>
          <div className="flex items-center pt-3">
            {stepLabels.map((label, index) => (
              <div key={label} className={cn("flex items-center", index < stepLabels.length - 1 && "flex-1")}>
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
                {index < stepLabels.length - 1 ? <div className={cn("mx-3 h-px flex-1", index < activeStepIndex ? "bg-blue-500" : "bg-slate-200")} /> : null}
              </div>
            ))}
          </div>
        </DialogHeader>

        {step === "upload" ? (
          <div className="space-y-4 px-6 py-5">
            {mode === "overwrite" ? (
              <div className="flex items-center gap-2 rounded-[6px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>导入后将覆盖当前草稿配置，已发布版本不受影响。</span>
              </div>
            ) : null}
            {mode === "overwrite" && selectedFileName ? (
              <div className="flex items-center gap-3 rounded-[6px] border border-slate-200 bg-white px-4 py-3">
                <FileCode2 className="h-5 w-5 shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">{selectedFileName}</div>
                  <div className="mt-0.5 text-xs text-slate-500">文件已选择，确认后覆盖当前草稿</div>
                </div>
                <button type="button" className="text-xs text-blue-600 hover:text-blue-700" onClick={() => setSelectedFileName("")}>重新选择</button>
              </div>
            ) : (
              <label htmlFor={inputId} className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed bg-slate-50/70 px-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/40",
                mode === "overwrite" ? "min-h-[160px]" : "min-h-[190px]",
                error ? "border-rose-300" : "border-slate-300"
              )}>
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-[8px] bg-blue-50 text-blue-600"><UploadCloud className="h-6 w-6" /></span>
                <span className="text-sm font-medium text-slate-900">点击选择，或将 YAML 文件拖到这里</span>
                <span className="mt-2 text-xs leading-5 text-slate-500">
                  {mode === "overwrite" ? "选择文件后需确认覆盖，仅支持 .yaml / .yml 配置文件" : "选择后自动导入，仅支持 .yaml / .yml 配置文件"}
                </span>
                <input key={selectedFileName || "empty"} id={inputId} type="file" accept=".yaml,.yml,application/yaml,text/yaml" className="sr-only" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) selectFile(file.name);
                }} />
              </label>
            )}
            {error ? (
              <div className="flex items-start gap-2 rounded-[6px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span><strong className="font-semibold">导入失败：</strong>{error} 未创建任何对象。</span>
              </div>
            ) : null}
            {mode === "create" ? <section className="rounded-[6px] border border-slate-200 bg-white p-4">
              <div className="text-sm font-medium text-slate-800">原型场景</div>
              <div className="mt-1 text-xs text-slate-500">点击后直接进入对应结果，便于评审全部状态。</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {DEMO_SCENARIOS.map((item) => (
                  <button key={item.value} type="button" className={cn("rounded-[6px] border px-3 py-2.5 text-left transition-transform hover:-translate-y-0.5", item.tone)} onClick={() => selectFile(`${IMPORT_OBJECT_LABELS[objectType]}_${item.label}.yaml`, item.value)}>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="mt-1 text-xs opacity-75">{item.description}</div>
                  </button>
                ))}
              </div>
            </section> : null}
            {mode === "overwrite" && selectedFileName ? (
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" className="rounded-[4px] border-slate-300 bg-white shadow-none" onClick={() => handleOpenChange(false)}>取消</Button>
                <Button type="button" className="rounded-[4px] bg-blue-600 text-white shadow-none hover:bg-blue-700" onClick={() => executeImport(selectedFileName, selectedScenario)}>确认覆盖并导入</Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === "processing" ? (
          <div className="flex min-h-[330px] flex-col items-center justify-center px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Loader2 className="h-7 w-7 animate-spin" /></span>
            <div className="mt-5 text-base font-semibold text-slate-900">{mode === "overwrite" ? "正在导入配置" : "正在校验并创建草稿"}</div>
            <div className="mt-2 text-sm text-slate-500">{mode === "overwrite" ? "正在使用文件内容更新当前草稿…" : "完成后将自动进入草稿配置，无需再次确认。"}</div>
          </div>
        ) : null}

        {step === "failure" ? (
          <>
            <div className="px-6 py-8">
              <div className="flex flex-col items-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600"><XCircle className="h-7 w-7" /></span>
                <div className="mt-4 text-lg font-semibold text-slate-950">导入失败</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {selectedScenario === "validation_failure"
                    ? "文件校验未通过，未创建任何对象。"
                    : "文件校验已通过，但草稿创建失败，未创建任何对象。"}
                </p>
              </div>
              <div className="mt-6 rounded-[6px] border border-rose-200 bg-rose-50/50 p-4 text-sm text-rose-800">
                {selectedScenario === "validation_failure"
                  ? "文件内容解析失败：第 18 行 YAML 缩进错误，请修正文件后重新导入。"
                  : "对象创建失败：系统未能保存草稿，请稍后重试（错误码：AF-IMP-5001）。"}
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
  destinationHref,
  onImported,
  className,
}: {
  objectType: ImportObjectType;
  destinationHref: string;
  onImported?: (preview: ImportPreview) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" className={cn("h-8 rounded-[4px] border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-none hover:bg-slate-50", className)} onClick={() => setOpen(true)}>
        <FileUp className="h-4 w-4" />导入
      </Button>
      <ImportConfigurationDialog open={open} onOpenChange={setOpen} objectType={objectType} destinationHref={destinationHref} onImported={onImported} />
    </>
  );
}
