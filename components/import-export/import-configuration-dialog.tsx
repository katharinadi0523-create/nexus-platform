"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  FileCheck2,
  FileCode2,
  FileUp,
  Loader2,
  RotateCcw,
  UploadCloud,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  buildImportPreview,
  getPendingResources,
  IMPORT_OBJECT_LABELS,
  validateImportFile,
  type ImportObjectType,
  type ImportPreview,
  type ImportResourceItem,
} from "@/lib/agent-import-export";
import { cn } from "@/lib/utils";

type ImportStep = "upload" | "analyzing" | "review" | "importing" | "result" | "failure";
type ImportDemoScenario = "success" | "success_with_warnings" | "failure";

const STEP_LABELS = ["选择文件", "确认导入", "创建草稿"];

const STATUS_COPY: Record<ImportResourceItem["status"], { label: string; className: string }> = {
  matched: { label: "已匹配", className: "bg-emerald-50 text-emerald-700" },
  missing: { label: "待关联", className: "bg-amber-50 text-amber-700" },
  reauthorize: { label: "待鉴权", className: "bg-orange-50 text-orange-700" },
};

const DEMO_SCENARIOS: Array<{
  value: ImportDemoScenario;
  label: string;
  description: string;
  tone: string;
}> = [
  { value: "success", label: "完全成功", description: "资源均可匹配", tone: "border-emerald-200 bg-emerald-50/60 text-emerald-800" },
  { value: "success_with_warnings", label: "成功但有缺失", description: "导入后需要补配", tone: "border-amber-200 bg-amber-50/60 text-amber-800" },
  { value: "failure", label: "导入失败", description: "协议版本不支持", tone: "border-rose-200 bg-rose-50/60 text-rose-800" },
];

function getStepIndex(step: ImportStep) {
  if (step === "upload") return 0;
  if (step === "analyzing" || step === "review" || step === "failure") return 1;
  return 2;
}

function ResourceRow({ resource }: { resource: ImportResourceItem }) {
  const status = STATUS_COPY[resource.status];
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)_72px] items-start gap-3 border-t border-slate-100 px-4 py-3 first:border-t-0">
      <span className="text-sm text-slate-500">{resource.type}</span>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-slate-800">{resource.name}</div>
        {resource.reason ? <div className="mt-1 text-xs leading-5 text-slate-500">{resource.reason}</div> : null}
      </div>
      <span className={cn("inline-flex justify-center rounded-[4px] px-2 py-1 text-xs font-medium", status.className)}>{status.label}</span>
    </div>
  );
}

export function ImportConfigurationDialog({
  open,
  onOpenChange,
  objectType,
  destinationHref,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectType: ImportObjectType;
  destinationHref: string;
  onImported?: (preview: ImportPreview) => void;
}) {
  const router = useRouter();
  const inputId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [step, setStep] = useState<ImportStep>("upload");
  const [scenario, setScenario] = useState<ImportDemoScenario>("success_with_warnings");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const preview = useMemo(
    () => (fileName ? buildImportPreview(objectType, fileName, scenario !== "success") : null),
    [fileName, objectType, scenario]
  );
  const pendingResources = preview ? getPendingResources(preview) : [];

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep("upload");
    setScenario("success_with_warnings");
    setFileName("");
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) timerRef.current = setTimeout(reset, 180);
  }

  function analyze(nextFileName: string, nextScenario: ImportDemoScenario = "success_with_warnings") {
    const validationError = validateImportFile(nextFileName);
    setScenario(nextScenario);
    setFileName(nextFileName);
    setError(validationError);
    if (validationError) return;
    setStep("analyzing");
    timerRef.current = setTimeout(() => setStep(nextScenario === "failure" ? "failure" : "review"), 850);
  }

  function handleImport() {
    if (!preview) return;
    setStep("importing");
    timerRef.current = setTimeout(() => {
      setStep("result");
      onImported?.(preview);
    }, 900);
  }

  function handleEnterDraft() {
    handleOpenChange(false);
    router.push(destinationHref);
  }

  const activeStepIndex = getStepIndex(step);
  const hasWarnings = pendingResources.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[720px]" showCloseButton={step !== "analyzing" && step !== "importing"}>
        <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
          <DialogTitle className="text-lg font-semibold text-slate-950">导入{IMPORT_OBJECT_LABELS[objectType]}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">导入后将创建新的草稿对象，不会覆盖当前环境中的同名对象。</DialogDescription>
          <div className="flex items-center pt-3">
            {STEP_LABELS.map((label, index) => (
              <div key={label} className={cn("flex items-center", index < STEP_LABELS.length - 1 && "flex-1")}>
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
                {index < STEP_LABELS.length - 1 ? <div className={cn("mx-3 h-px flex-1", index < activeStepIndex ? "bg-blue-500" : "bg-slate-200")} /> : null}
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
              <span className="text-sm font-medium text-slate-900">点击选择，或将 YAML 文件拖到这里</span>
              <span className="mt-2 text-xs leading-5 text-slate-500">仅支持 Agent Foundry 导出的 .yaml / .yml 配置文件，单次导入 1 个文件</span>
              <input
                id={inputId}
                type="file"
                accept=".yaml,.yml,application/yaml,text/yaml"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) analyze(file.name);
                }}
              />
            </label>
            {error ? (
              <div className="flex items-start gap-2 rounded-[6px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
              </div>
            ) : null}
            <section className="rounded-[6px] border border-slate-200 bg-white p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-800">原型场景</div>
                  <div className="mt-1 text-xs text-slate-500">直接选择结果，便于评审全部状态。</div>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {DEMO_SCENARIOS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={cn("rounded-[6px] border px-3 py-2.5 text-left transition-transform hover:-translate-y-0.5", item.tone)}
                    onClick={() => analyze(`${IMPORT_OBJECT_LABELS[objectType]}_${item.label}.yaml`, item.value)}
                  >
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="mt-1 text-xs opacity-75">{item.description}</div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {step === "analyzing" || step === "importing" ? (
          <div className="flex min-h-[330px] flex-col items-center justify-center px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Loader2 className="h-7 w-7 animate-spin" /></span>
            <div className="mt-5 text-base font-semibold text-slate-900">{step === "analyzing" ? "正在校验并读取配置" : "正在创建草稿对象"}</div>
            <div className="mt-2 text-sm text-slate-500">{step === "analyzing" ? "检查文件格式、协议版本、对象类型及必要字段…" : "正在恢复配置与可匹配的资源引用…"}</div>
          </div>
        ) : null}

        {step === "review" && preview ? (
          <div className="max-h-[58vh] overflow-y-auto px-6 py-5">
            <section className="rounded-[6px] border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-blue-50 text-blue-600"><FileCode2 className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-slate-900">{preview.objectName}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{preview.objectTypeLabel} · {preview.sourceLabel}</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{preview.description}</p>
              <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                {preview.configSummary.map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs text-slate-500">{item.label}</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-800">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {hasWarnings ? (
              <div className="mt-4 flex items-start gap-3 rounded-[6px] border border-amber-200 bg-amber-50/70 px-4 py-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <div className="text-sm font-medium text-amber-900">检测到 {pendingResources.length} 项资源需要导入后补配</div>
                  <div className="mt-1 text-xs leading-5 text-amber-800/80">资源缺失或需要重新鉴权不影响创建草稿，具体项目将在导入结果中展示。</div>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-start gap-3 rounded-[6px] border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium text-emerald-900">配置可完整恢复</div>
                  <div className="mt-1 text-xs leading-5 text-emerald-800/80">当前对象直接引用的资源均已匹配。</div>
                </div>
              </div>
            )}

            <div className="mt-4 rounded-[6px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              确认后将生成新的对象 ID，并以“未发布”草稿状态创建；同名对象不会被覆盖，也不会带入原历史版本。
            </div>
          </div>
        ) : null}

        {step === "failure" ? (
          <div className="px-6 py-8">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600"><XCircle className="h-7 w-7" /></span>
              <div className="mt-4 text-lg font-semibold text-slate-950">导入失败</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">配置文件协议版本不受支持，未创建任何对象。</p>
            </div>
            <div className="mt-6 rounded-[6px] border border-rose-200 bg-rose-50/50 p-4">
              <div className="text-sm font-medium text-rose-900">失败原因</div>
              <div className="mt-2 text-sm text-rose-800">文件 schema_version 为 0.7，当前环境支持 1.0。</div>
              <div className="mt-2 text-xs leading-5 text-rose-700/80">请从 Agent Foundry 重新导出配置文件后再试。</div>
            </div>
          </div>
        ) : null}

        {step === "result" && preview ? (
          <div className="px-6 py-7">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></span>
              <div className="mt-4 text-lg font-semibold text-slate-950">{hasWarnings ? "导入成功，存在待补配资源" : "导入成功"}</div>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                {hasWarnings
                  ? `已创建“${preview.objectName}”草稿。${pendingResources.length} 项资源需要重新关联或配置鉴权。`
                  : `已创建“${preview.objectName}”草稿，配置与资源引用均已恢复。`}
              </p>
            </div>
            {hasWarnings ? (
              <div className="mt-6 overflow-hidden rounded-[6px] border border-amber-200 bg-amber-50/40">
                <div className="border-b border-amber-100 px-4 py-3 text-sm font-semibold text-slate-900">待补配资源（{pendingResources.length}）</div>
                {pendingResources.map((resource) => <ResourceRow key={resource.id} resource={resource} />)}
              </div>
            ) : (
              <div className="mt-6 flex items-center justify-center gap-2 rounded-[6px] border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />所有直接引用资源均已匹配，无需补配
              </div>
            )}
          </div>
        ) : null}

        {step === "review" ? (
          <DialogFooter className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            <Button type="button" variant="outline" className="rounded-[4px] border-slate-300 bg-white shadow-none" onClick={reset}><RotateCcw className="h-4 w-4" />重新选择</Button>
            <Button type="button" className="rounded-[4px] bg-blue-600 text-white shadow-none hover:bg-blue-700" onClick={handleImport}>确认导入并创建草稿</Button>
          </DialogFooter>
        ) : null}

        {step === "failure" ? (
          <DialogFooter className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            <Button type="button" variant="outline" className="rounded-[4px] border-slate-300 bg-white shadow-none" onClick={() => handleOpenChange(false)}>关闭</Button>
            <Button type="button" className="rounded-[4px] bg-blue-600 text-white shadow-none hover:bg-blue-700" onClick={reset}><RotateCcw className="h-4 w-4" />重新选择</Button>
          </DialogFooter>
        ) : null}

        {step === "result" ? (
          <DialogFooter className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            <Button type="button" variant="outline" className="rounded-[4px] border-slate-300 bg-white shadow-none" onClick={() => handleOpenChange(false)}>返回列表</Button>
            <Button type="button" className="rounded-[4px] bg-blue-600 text-white shadow-none hover:bg-blue-700" onClick={handleEnterDraft}>
              {hasWarnings ? "进入配置并补配" : "进入配置"}<ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
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
