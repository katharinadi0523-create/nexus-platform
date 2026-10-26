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
import { Select } from "@/components/ui/select";
import { SecurityLevelBadge } from "@/components/security/security-level-badge";
import {
  buildImportPreview,
  IMPORT_OBJECT_LABELS,
  validateImportFile,
  type ImportObjectType,
  type ImportPreview,
  type RelatedObjectMode,
} from "@/lib/agent-import-export";
import {
  buildSecurityLevelOptionsUpToUser,
  getSecurityLevelRank,
  isHighSecurityLevel,
  type SecurityLevel,
} from "@/lib/security-level";
import { cn } from "@/lib/utils";

type ImportStep = "upload" | "confirm" | "processing" | "failure";
type ImportDemoScenario = "success" | "success_with_warnings" | "validation_failure" | "creation_failure";
type SecurityImportScenario = "tagged-low" | "tagged-high" | "untagged" | "policy-disabled" | "untagged-policy-disabled";

const DEMO_SCENARIOS: Array<{ value: ImportDemoScenario; label: string }> = [
  { value: "success", label: "成功" },
  { value: "success_with_warnings", label: "成功，有待补配" },
  { value: "validation_failure", label: "文件校验失败" },
  { value: "creation_failure", label: "对象创建失败" },
];

const SECURITY_SCENARIOS: Array<{ value: SecurityImportScenario; label: string }> = [
  { value: "tagged-low", label: "含密级 · 内部" },
  { value: "tagged-high", label: "含密级 · 秘密" },
  { value: "untagged", label: "未携带密级" },
  { value: "policy-disabled", label: "内部 · 管控关闭" },
  { value: "untagged-policy-disabled", label: "无密级 · 管控关闭" },
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
  const relatedMode: RelatedObjectMode = "draft";
  const [detectedObjectType, setDetectedObjectType] = useState<ImportObjectType>(objectType);
  const [securityScenario, setSecurityScenario] = useState<SecurityImportScenario>("tagged-low");
  const [mainSecurityLevel, setMainSecurityLevel] = useState<SecurityLevel | "">("内部");
  const [relatedSecurityLevels, setRelatedSecurityLevels] = useState<Record<string, SecurityLevel | "">>({});

  const packageSecurityLevel: SecurityLevel | null = securityScenario === "untagged" || securityScenario === "untagged-policy-disabled"
    ? null
    : securityScenario === "tagged-high"
      ? "秘密"
      : "内部";
  const securityPolicyEnabled = securityScenario !== "policy-disabled" && securityScenario !== "untagged-policy-disabled";
  const packageBlocked = securityPolicyEnabled
    && packageSecurityLevel !== null
    && isHighSecurityLevel(packageSecurityLevel);

  const preview = useMemo(
    () => buildImportPreview(
      detectedObjectType,
      selectedFileName || `${IMPORT_OBJECT_LABELS[detectedObjectType]}配置包.zip`,
      selectedScenario === "success_with_warnings",
      relatedMode,
      {
        packageSecurityLevel,
        securityPolicyEnabled,
        assignedSecurityLevel: mainSecurityLevel || undefined,
        relatedSecurityLevels: Object.fromEntries(
          Object.entries(relatedSecurityLevels).filter((entry): entry is [string, SecurityLevel] => Boolean(entry[1]))
        ),
      }
    ),
    [detectedObjectType, mainSecurityLevel, packageSecurityLevel, relatedMode, relatedSecurityLevels, securityPolicyEnabled, selectedFileName, selectedScenario]
  );

  const needsSecurityAssignment = securityPolicyEnabled && packageSecurityLevel === null;
  const importBlocked = packageBlocked || (
    securityPolicyEnabled
    && packageSecurityLevel !== null
    && preview.relatedObjects.some((item) => isHighSecurityLevel(item.securityLevel))
  );
  const securityAssignmentComplete = !needsSecurityAssignment || (
    Boolean(mainSecurityLevel)
    && preview.relatedObjects.every((item) => Boolean(relatedSecurityLevels[item.id]))
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
    setDetectedObjectType(objectType);
    setSecurityScenario("tagged-low");
    setMainSecurityLevel("内部");
    setRelatedSecurityLevels({});
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) timerRef.current = setTimeout(reset, 180);
  }

  function draftHref(result: "success" | "success_with_warnings", importedObjectType: ImportObjectType) {
    const destination = typeof destinationHref === "string" ? destinationHref : destinationHref[importedObjectType] ?? destinationHref[objectType] ?? "/agent";
    const separator = destination.includes("?") ? "&" : "?";
    const resolvedLevel = mainSecurityLevel || packageSecurityLevel;
    const securityParam = resolvedLevel ? `&securityLevel=${encodeURIComponent(resolvedLevel)}` : "";
    return `${destination}${separator}importResult=${result}&importMode=create&relatedMode=${relatedMode}${securityParam}`;
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

  function chooseSecurityPackage(scenario: SecurityImportScenario) {
    setSecurityScenario(scenario);
    setRelatedSecurityLevels({});
    setMainSecurityLevel(scenario === "untagged" || scenario === "untagged-policy-disabled" ? "" : scenario === "tagged-high" ? "秘密" : "内部");
    const label = SECURITY_SCENARIOS.find((item) => item.value === scenario)?.label ?? "密级场景";
    choosePackage(`${IMPORT_OBJECT_LABELS[detectedObjectType]}-${label}.zip`, "success_with_warnings", detectedObjectType);
  }

  function handleMainSecurityLevelChange(value: SecurityLevel) {
    setMainSecurityLevel(value);
    setRelatedSecurityLevels((current) => Object.fromEntries(
      Object.entries(current).filter(([, level]) => level && getSecurityLevelRank(level) <= getSecurityLevelRank(value))
    ));
  }

  function executeImport() {
    if (importBlocked) {
      setError("该配置包包含高密资源，当前环境禁止导入。");
      return;
    }
    if (!securityAssignmentComplete) {
      setError("请完成主对象及全部关联对象的密级设置。");
      return;
    }
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
        relatedMode,
        {
          packageSecurityLevel,
          securityPolicyEnabled,
          assignedSecurityLevel: mainSecurityLevel || undefined,
          relatedSecurityLevels: Object.fromEntries(
            Object.entries(relatedSecurityLevels).filter((entry): entry is [string, SecurityLevel] => Boolean(entry[1]))
          ),
        }
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
          <DialogDescription>完成校验后保存为草稿，不覆盖同名对象，也不会直接发布。</DialogDescription>
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
              <span className="mr-1 text-xs text-slate-500">密级场景</span>
              {SECURITY_SCENARIOS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={cn(
                    "rounded-[4px] border px-2.5 py-1.5 text-xs",
                    securityScenario === item.value
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                  )}
                  onClick={() => chooseSecurityPackage(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
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
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    <span>协议版本 {preview.schemaVersion}</span>
                    {packageSecurityLevel ? (
                      <SecurityLevelBadge level={packageSecurityLevel} />
                    ) : (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">未携带密级</span>
                    )}
                  </div>
                </div>
                <button type="button" className="text-xs text-blue-600 hover:text-blue-700" onClick={() => setStep("upload")}>重新选择</button>
              </div>

              <section>
                <div className="mb-2 text-xs font-medium text-slate-500">主对象</div>
                <div className="rounded-[6px] border border-blue-200 bg-blue-50/40 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-blue-600 text-white"><ObjectIcon type={preview.objectType} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-950">{preview.objectName}</div>
                      <div className="mt-1 text-xs text-blue-700">{preview.objectTypeLabel} · {preview.sourceLabel}</div>
                      <p className="mt-2 text-sm text-slate-600">{preview.description}</p>
                      <div className="mt-3 flex items-center gap-3 border-t border-blue-100 pt-3">
                        <span className="text-xs font-medium text-slate-600"><span className="text-rose-500">*</span> 密级</span>
                        {needsSecurityAssignment ? (
                          <Select
                            value={mainSecurityLevel}
                            onValueChange={(value) => handleMainSecurityLevelChange(value as SecurityLevel)}
                            options={buildSecurityLevelOptionsUpToUser()}
                            placeholder="请选择密级"
                            className="h-9 w-40 bg-white"
                          />
                        ) : packageSecurityLevel ? (
                          <SecurityLevelBadge level={packageSecurityLevel} />
                        ) : (
                          <span className="text-xs text-slate-500">目标环境不启用密级控制</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {importBlocked ? (
                <div className="flex items-start gap-2 rounded-[6px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-700">
                  <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
                  <span>该配置包密级为「{packageSecurityLevel}」。密级管理开启时仅允许导入公开、内部资源，本次导入已阻止。</span>
                </div>
              ) : needsSecurityAssignment ? (
                <div className="rounded-[6px] border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
                  配置包未携带密级。请先设置主对象密级，再为关联对象逐项选择不高于主对象、且在当前用户权限内的密级。
                </div>
              ) : securityPolicyEnabled ? (
                <div className="rounded-[6px] border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
                  导入后保留配置包中的原密级；导入操作不会改变资源密级。
                </div>
              ) : (
                <div className="rounded-[6px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                  {packageSecurityLevel
                    ? `目标环境未启用密级管理，允许导入；原「${packageSecurityLevel}」标识仅作记录，导入后不执行密级访问控制。`
                    : "配置包未携带密级，按原有流程导入；目标环境不执行密级访问控制。"}
                </div>
              )}

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">关联对象（{preview.relatedObjects.length}）</span>
                  <span className="text-xs text-slate-400">按引用层级展示</span>
                </div>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-[6px] border border-slate-200">
                  {preview.relatedObjects.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-slate-100 text-slate-600"><ObjectIcon type={item.type} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900">{item.name}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{IMPORT_OBJECT_LABELS[item.type]} · {item.description}</div>
                        <div className="mt-1 truncate text-[11px] text-slate-400">引用路径：{item.relationPath}</div>
                      </div>
                      {needsSecurityAssignment ? (
                        <Select
                          value={relatedSecurityLevels[item.id] ?? ""}
                          onValueChange={(value) => setRelatedSecurityLevels((current) => ({
                            ...current,
                            [item.id]: value as SecurityLevel,
                          }))}
                          options={mainSecurityLevel
                            ? buildSecurityLevelOptionsUpToUser({ maxLevel: mainSecurityLevel })
                            : []}
                          placeholder={mainSecurityLevel ? "请选择密级" : "先选主对象密级"}
                          disabled={!mainSecurityLevel}
                          className="h-9 w-40 shrink-0 bg-white"
                        />
                      ) : (
                        <SecurityLevelBadge level={item.securityLevel} />
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <div className="rounded-[6px] bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                完成校验后仅生成主对象和关联对象草稿，不直接发布；缺失或无权限的引用会保留在原配置位置，待后续补配。
              </div>
              {error ? (
                <div className="flex items-start gap-2 rounded-[6px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}
            </div>
            <DialogFooter className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <Button type="button" variant="outline" className="rounded-[4px] border-slate-300 bg-white shadow-none" onClick={() => handleOpenChange(false)}>取消</Button>
              <Button
                type="button"
                disabled={importBlocked || !securityAssignmentComplete}
                className="rounded-[4px] bg-blue-600 text-white shadow-none hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                onClick={executeImport}
              >
                保存为草稿
              </Button>
            </DialogFooter>
          </>
        ) : null}

        {step === "processing" ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Loader2 className="h-7 w-7 animate-spin" /></span>
            <div className="mt-5 text-base font-semibold text-slate-900">正在校验并创建草稿</div>
            <div className="mt-2 text-sm text-slate-500">正在保存主对象及关联对象草稿，不会直接发布…</div>
          </div>
        ) : null}

        {step === "failure" ? (
          <>
            <div className="px-6 py-8">
              <div className="flex flex-col items-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600"><XCircle className="h-7 w-7" /></span>
                <div className="mt-4 text-lg font-semibold text-slate-950">导入失败</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">本次未创建任何对象。</p>
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
