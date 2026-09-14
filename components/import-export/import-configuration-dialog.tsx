"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  FileCode2,
  FileUp,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Unplug,
  UploadCloud,
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

type ImportStep = "upload" | "analyzing" | "review" | "importing" | "result";

const STEP_LABELS = ["选择文件", "校验配置", "创建草稿"];

const STATUS_COPY: Record<ImportResourceItem["status"], { label: string; className: string }> = {
  matched: { label: "已匹配", className: "bg-emerald-50 text-emerald-700" },
  missing: { label: "待关联", className: "bg-amber-50 text-amber-700" },
  reauthorize: { label: "待鉴权", className: "bg-orange-50 text-orange-700" },
};

function getStepIndex(step: ImportStep) {
  if (step === "upload") return 0;
  if (step === "analyzing" || step === "review") return 1;
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
      <span className={cn("inline-flex justify-center rounded-[4px] px-2 py-1 text-xs font-medium", status.className)}>
        {status.label}
      </span>
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
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const preview = useMemo(
    () => (fileName ? buildImportPreview(objectType, fileName) : null),
    [fileName, objectType]
  );
  const pendingResources = preview ? getPendingResources(preview) : [];

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep("upload");
    setFileName("");
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) timerRef.current = setTimeout(reset, 180);
  }

  function analyze(nextFileName: string) {
    const validationError = validateImportFile(nextFileName);
    setFileName(nextFileName);
    setError(validationError);
    if (validationError) return;
    setStep("analyzing");
    timerRef.current = setTimeout(() => setStep("review"), 850);
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[760px]" showCloseButton={step !== "analyzing" && step !== "importing"}>
        <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
          <DialogTitle className="text-lg font-semibold text-slate-950">导入{IMPORT_OBJECT_LABELS[objectType]}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            导入后将创建新的草稿对象，不会覆盖当前环境中的同名对象。
          </DialogDescription>
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
                  )}>
                    {index < activeStepIndex ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span className={cn("text-xs font-medium", index <= activeStepIndex ? "text-slate-800" : "text-slate-400")}>{label}</span>
                </div>
                {index < STEP_LABELS.length - 1 ? <div className={cn("mx-3 h-px flex-1", index < activeStepIndex ? "bg-blue-500" : "bg-slate-200")} /> : null}
              </div>
            ))}
          </div>
        </DialogHeader>

        {step === "upload" ? (
          <div className="space-y-4 px-6 py-6">
            <label
              htmlFor={inputId}
              className={cn(
                "flex min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed bg-slate-50/70 px-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/40",
                error ? "border-rose-300" : "border-slate-300"
              )}
            >
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-[8px] bg-blue-50 text-blue-600">
                <UploadCloud className="h-6 w-6" />
              </span>
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
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between rounded-[6px] border border-slate-200 bg-white px-4 py-3">
              <div>
                <div className="text-sm font-medium text-slate-800">原型演示</div>
                <div className="mt-1 text-xs text-slate-500">无需准备文件，可直接体验完整校验与补配流程。</div>
              </div>
              <Button type="button" variant="outline" className="h-8 rounded-[4px] border-slate-300 shadow-none" onClick={() => analyze(`${IMPORT_OBJECT_LABELS[objectType]}_示例配置.yaml`)}>
                使用示例配置
              </Button>
            </div>
          </div>
        ) : null}

        {step === "analyzing" || step === "importing" ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Loader2 className="h-7 w-7 animate-spin" />
            </span>
            <div className="mt-5 text-base font-semibold text-slate-900">
              {step === "analyzing" ? "正在校验并读取配置" : "正在创建草稿对象"}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {step === "analyzing" ? "检查文件格式、协议版本、对象类型及必要字段…" : "正在恢复配置与可匹配的资源引用…"}
            </div>
          </div>
        ) : null}

        {step === "review" && preview ? (
          <div className="max-h-[58vh] overflow-y-auto px-6 py-5">
            <div className="flex items-start gap-3 rounded-[6px] border border-blue-100 bg-blue-50/60 px-4 py-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-slate-900">文件校验通过</div>
                <div className="mt-1 text-xs leading-5 text-slate-600">协议版本 {preview.schemaVersion} 可兼容，配置结构完整。检测到 {pendingResources.length} 项资源需要导入后补配，不影响创建草稿。</div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
              <section className="rounded-[6px] border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-blue-50 text-blue-600"><FileCode2 className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{preview.objectName}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{preview.objectTypeLabel} · {preview.sourceLabel}</div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{preview.description}</p>
                <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  {preview.configSummary.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
                      <dt className="text-slate-500">{item.label}</dt>
                      <dd className="text-right font-medium text-slate-800">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="rounded-[6px] border border-slate-200 bg-slate-50/60 p-4">
                <div className="text-sm font-semibold text-slate-900">导入规则</div>
                <ul className="mt-3 space-y-3 text-sm leading-5 text-slate-600">
                  <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>生成新的对象 ID，状态为未发布草稿</span></li>
                  <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>保留原名称；同名对象不会被覆盖</span></li>
                  <li className="flex gap-2"><Unplug className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><span>只匹配当前对象直接引用的资源</span></li>
                </ul>
              </section>
            </div>

            <section className="mt-4 overflow-hidden rounded-[6px] border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">关联资源匹配</div>
                <div className="text-xs text-slate-500">{preview.resources.length - pendingResources.length} 项已匹配 · {pendingResources.length} 项待补配</div>
              </div>
              {preview.resources.map((resource) => <ResourceRow key={resource.id} resource={resource} />)}
            </section>
          </div>
        ) : null}

        {step === "result" && preview ? (
          <div className="px-6 py-7">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></span>
              <div className="mt-4 text-lg font-semibold text-slate-950">导入成功，存在待补配资源</div>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">已创建“{preview.objectName}”草稿。{pendingResources.length} 项资源需要重新关联或配置鉴权，补配完成前不会影响草稿保存与编辑。</p>
            </div>
            <div className="mt-6 overflow-hidden rounded-[6px] border border-amber-200 bg-amber-50/40">
              <div className="border-b border-amber-100 px-4 py-3 text-sm font-semibold text-slate-900">待补配资源（{pendingResources.length}）</div>
              {pendingResources.map((resource) => <ResourceRow key={resource.id} resource={resource} />)}
            </div>
          </div>
        ) : null}

        {step === "review" ? (
          <DialogFooter className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            <Button type="button" variant="outline" className="rounded-[4px] border-slate-300 bg-white shadow-none" onClick={reset}>
              <RotateCcw className="h-4 w-4" />重新选择
            </Button>
            <Button type="button" className="rounded-[4px] bg-blue-600 text-white shadow-none hover:bg-blue-700" onClick={handleImport}>
              确认导入并创建草稿
            </Button>
          </DialogFooter>
        ) : null}

        {step === "result" ? (
          <DialogFooter className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            <Button type="button" variant="outline" className="rounded-[4px] border-slate-300 bg-white shadow-none" onClick={() => handleOpenChange(false)}>返回列表</Button>
            <Button type="button" className="rounded-[4px] bg-blue-600 text-white shadow-none hover:bg-blue-700" onClick={handleEnterDraft}>
              进入配置并补配<ArrowRight className="h-4 w-4" />
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
