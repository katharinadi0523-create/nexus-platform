"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Globe,
  Info,
  Loader2,
  RefreshCw,
  Terminal,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  advanceProductDocFlow,
  commandOutputForStage,
  createInitialProductDocFlows,
  formatProductDocJson,
  jumpProductDocPhase,
  PRODUCT_DOC_DEMOS,
  PRODUCT_DOC_STAGES,
  PRODUCT_DOC_TABS,
  productDocCardState,
  productDocKeyHint,
  retreatProductDocFlow,
  type ProductDocDemo,
  type ProductDocFlowState,
  type ProductDocOutcome,
  type ProductDocPhase,
  type ProductDocTab,
  type ProductDocTone,
} from "@/lib/mock/my-claw/product-doc";
import { cn } from "@/lib/utils";

function toneBorderClass(tone: ProductDocTone): string {
  switch (tone) {
    case "approval":
      return "border-l-amber-500";
    case "running":
      return "border-l-blue-600";
    case "success":
      return "border-l-emerald-600";
    case "failed":
    case "denied":
      return "border-l-red-600";
    default:
      return "border-l-slate-400";
  }
}

function toneBadgeClass(tone: ProductDocTone): string {
  switch (tone) {
    case "approval":
      return "bg-amber-50 text-amber-700";
    case "running":
      return "bg-blue-50 text-blue-700";
    case "success":
      return "bg-emerald-50 text-emerald-700";
    case "failed":
    case "denied":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function railNumClass(stageId: ProductDocPhase, phase: ProductDocPhase, tone: ProductDocTone): string {
  const state = productDocCardState(stageId, phase);
  if (state !== "is-current") {
    return "bg-slate-500 text-white";
  }
  switch (tone) {
    case "approval":
      return "bg-amber-500 text-white";
    case "running":
      return "bg-blue-600 text-white";
    case "success":
      return "bg-emerald-600 text-white";
    case "failed":
    case "denied":
      return "bg-red-600 text-white";
    default:
      return "bg-slate-600 text-white";
  }
}

function StatusBadge({ label, tone }: { label: string; tone: ProductDocTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
        toneBadgeClass(tone)
      )}
    >
      {tone === "running" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {tone === "success" ? <Check className="h-3.5 w-3.5" /> : null}
      {tone === "failed" || tone === "denied" ? <X className="h-3.5 w-3.5" /> : null}
      {tone === "approval" ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
      {tone === "pending" ? <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> : null}
      <span>{label}</span>
    </span>
  );
}

function JsonBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: unknown;
  tone?: "success" | "failed";
}) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50/60">
      <div className="border-b border-slate-200 px-3 py-2 text-xs font-medium text-slate-500">
        {label}
      </div>
      <pre
        className={cn(
          "overflow-x-auto px-3 py-3 font-mono text-[12px] leading-6 text-slate-700",
          tone === "success" && "text-emerald-700",
          tone === "failed" && "text-red-700"
        )}
      >
        {formatProductDocJson(value)}
      </pre>
    </div>
  );
}

function CommandBlock({ kind, content }: { kind: string; content: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-[#0f172a]">
      <div className="border-b border-slate-700 px-3 py-2 text-xs font-medium text-slate-300">
        {kind}
      </div>
      <pre className="overflow-x-auto px-3 py-3 font-mono text-[12px] leading-6 text-slate-100">
        {content}
      </pre>
    </div>
  );
}

function OutcomeRow({
  outcome,
  onChange,
  className,
}: {
  outcome: ProductDocOutcome;
  onChange: (outcome: ProductDocOutcome) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-sm text-slate-600", className)}>
      <span>执行结果分支</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={cn(
          "h-8 rounded-md shadow-none",
          outcome !== "failed" && "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50"
        )}
        onClick={() => onChange("success")}
      >
        模拟成功
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={cn(
          "h-8 rounded-md shadow-none",
          outcome === "failed" && "border-red-200 bg-red-50 text-red-700 hover:bg-red-50"
        )}
        onClick={() => onChange("failed")}
      >
        模拟失败
      </Button>
    </div>
  );
}

function RequestBody({
  phase,
  demo,
  onApprove,
  onDeny,
}: {
  phase: ProductDocPhase;
  demo: ProductDocDemo;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const requestPayload = {
    endpoint: demo.requestLine,
    ...(demo.request || {}),
  };

  if (phase === "pending") {
    return null;
  }

  if (phase === "approval_required") {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50/70 px-3 py-3 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <div className="font-medium">{demo.approvalCopy}</div>
            {demo.approvalSubcopy ? <div className="text-amber-800/80">{demo.approvalSubcopy}</div> : null}
          </div>
        </div>
        <JsonBlock label="Request" value={requestPayload} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="rounded-md shadow-none" onClick={onDeny}>
            拒绝
          </Button>
          <Button
            type="button"
            className="rounded-md bg-blue-600 text-white hover:bg-blue-700"
            onClick={onApprove}
          >
            允许
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "denied") {
    return (
      <div className="space-y-3">
        {demo.deniedCopy ? <p className="text-sm text-slate-600">{demo.deniedCopy}</p> : null}
        <JsonBlock label="Request" value={requestPayload} />
        <div className="text-xs text-slate-500">拒绝时间：2026-05-18 10:16:22</div>
      </div>
    );
  }

  if (phase === "running") {
    return (
      <div className="space-y-3">
        {demo.runningCopy ? <p className="text-sm text-slate-600">{demo.runningCopy}</p> : null}
        <JsonBlock label="Request" value={requestPayload} />
        <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-3">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Response</span>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="space-y-3">
        {demo.successCopy ? <p className="text-sm text-slate-600">{demo.successCopy}</p> : null}
        <JsonBlock label="Request" value={requestPayload} />
        <JsonBlock label="Response" value={demo.successResponse} tone="success" />
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className="space-y-3">
        {demo.failedCopy ? <p className="text-sm text-slate-600">{demo.failedCopy}</p> : null}
        <JsonBlock label="Request" value={requestPayload} />
        <JsonBlock
          label={demo.failureDetailLabel || "Response"}
          value={demo.errorResponse}
          tone="failed"
        />
      </div>
    );
  }

  return null;
}

function CodeBody({
  phase,
  demo,
  flow,
  onApprove,
  onDeny,
  onOutcomeChange,
}: {
  phase: ProductDocPhase;
  demo: ProductDocDemo;
  flow: ProductDocFlowState;
  onApprove: () => void;
  onDeny: () => void;
  onOutcomeChange: (outcome: ProductDocOutcome) => void;
}) {
  const output = commandOutputForStage(phase, demo);
  const commandText = [`$ ${demo.command || ""}`, output].filter(Boolean).join("\n");
  const commandBlock = <CommandBlock kind={demo.commandType || "shell"} content={commandText} />;

  if (phase === "pending") {
    return commandBlock;
  }

  if (phase === "approval_required") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{demo.approvalCopy}</p>
        {demo.approvalSubcopy ? (
          <p className="text-sm text-slate-500">{demo.approvalSubcopy}</p>
        ) : null}
        {commandBlock}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="rounded-md shadow-none" onClick={onDeny}>
            拒绝
          </Button>
          <Button
            type="button"
            className="rounded-md bg-blue-600 text-white hover:bg-blue-700"
            onClick={onApprove}
          >
            允许
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "denied") {
    return (
      <div className="space-y-3">
        {commandBlock}
        {demo.deniedCopy ? <p className="text-sm text-slate-600">{demo.deniedCopy}</p> : null}
      </div>
    );
  }

  if (phase === "running") {
    return (
      <div className="space-y-3">
        {commandBlock}
        <div className="inline-flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span>正在执行...</span>
        </div>
        <OutcomeRow outcome={flow.outcome} onChange={onOutcomeChange} />
      </div>
    );
  }

  return commandBlock;
}

export function MyClawProductDocPage() {
  const [tab, setTab] = useState<ProductDocTab>("request");
  const [flows, setFlows] = useState(createInitialProductDocFlows);

  const flow = flows[tab];
  const demo = PRODUCT_DOC_DEMOS[tab];
  const phaseConfig = useMemo(
    () => PRODUCT_DOC_STAGES.find((stage) => stage.id === flow.phase) ?? PRODUCT_DOC_STAGES[0]!,
    [flow.phase]
  );
  const cardTitle =
    flow.phase === "pending"
      ? demo.pendingTitle
      : flow.phase === "running"
        ? demo.runningTitle
        : demo.title;

  function updateFlow(updater: (current: ProductDocFlowState) => ProductDocFlowState) {
    setFlows((current) => ({
      ...current,
      [tab]: updater(current[tab]),
    }));
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) {
        return;
      }
      event.preventDefault();
      setFlows((current) => ({
        ...current,
        [tab]:
          event.key === "ArrowRight"
            ? advanceProductDocFlow(current[tab])
            : retreatProductDocFlow(current[tab]),
      }));
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [tab]);

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden px-6 py-5 text-slate-900"
      tabIndex={0}
      aria-label="工具调用状态说明"
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tool Call Status
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">工具调用状态说明</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            通过左右方向键或左侧状态编号切换；审批态需要在页面点击同意或拒绝。
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="inline-flex min-h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600">
            当前：{phaseConfig.code} · {phaseConfig.label}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-md border-slate-200 bg-white shadow-none"
            onClick={() =>
              updateFlow(() => ({
                phase: "pending",
                outcome: "success",
              }))
            }
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            重置
          </Button>
        </div>
      </header>

      <nav
        className="mb-4 inline-flex w-max max-w-full gap-1 rounded-md border border-slate-200 bg-white p-1"
        aria-label="工具调用类型"
      >
        {PRODUCT_DOC_TABS.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-[4px] px-3.5 text-sm font-medium transition-colors",
                active ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-800"
              )}
              onClick={() => setTab(item.id)}
            >
              {item.id === "code" ? (
                <Terminal className="h-4 w-4" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[160px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4" aria-label="状态列表">
          {PRODUCT_DOC_STAGES.map((stage, index) => {
            const state = productDocCardState(stage.id, flow.phase);
            return (
              <button
                key={stage.id}
                type="button"
                className={cn(
                  "grid w-full gap-1 text-left transition-colors",
                  state === "is-future" && "opacity-60",
                  state === "is-current" &&
                    (stage.tone === "failed" || stage.tone === "denied"
                      ? "text-red-700"
                      : "text-slate-700"),
                  state !== "is-current" && "text-slate-500 hover:text-blue-700"
                )}
                aria-current={stage.id === flow.phase ? "step" : undefined}
                onClick={() => updateFlow((current) => jumpProductDocPhase(current, stage.id))}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full text-sm font-bold",
                    railNumClass(stage.id, flow.phase, stage.tone)
                  )}
                >
                  {index + 1}
                </span>
                <span className="font-mono text-[13px] font-semibold">{stage.code}</span>
                <strong className="text-[15px] font-semibold leading-snug text-slate-900">
                  {stage.label}
                </strong>
              </button>
            );
          })}
          <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs leading-5 text-slate-500">
            {productDocKeyHint(flow.phase)}
          </div>
        </aside>

        <div className="min-h-0 space-y-3.5 overflow-y-auto pr-1">
          <article
            className={cn(
              "rounded-md border border-slate-200 border-l-[3px] bg-white shadow-sm",
              toneBorderClass(phaseConfig.tone)
            )}
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
              {tab === "code" ? (
                <Terminal className="h-4 w-4 text-slate-500" />
              ) : (
                <Wrench className="h-4 w-4 text-slate-500" />
              )}
              <span className="text-sm font-semibold text-slate-900">{cardTitle}</span>
              <span className="flex-1" />
              <StatusBadge label={phaseConfig.label} tone={phaseConfig.tone} />
            </div>
            <div className="px-4 py-4">
              {tab === "code" ? (
                <CodeBody
                  phase={flow.phase}
                  demo={demo}
                  flow={flow}
                  onApprove={() =>
                    updateFlow((current) =>
                      current.phase === "approval_required"
                        ? { ...current, phase: "running" }
                        : current
                    )
                  }
                  onDeny={() =>
                    updateFlow((current) =>
                      current.phase === "approval_required"
                        ? { ...current, phase: "denied" }
                        : current
                    )
                  }
                  onOutcomeChange={(outcome) =>
                    updateFlow((current) => {
                      const next = { ...current, outcome };
                      if (
                        current.phase === "running" ||
                        current.phase === "success" ||
                        current.phase === "failed"
                      ) {
                        next.phase = outcome;
                      }
                      return next;
                    })
                  }
                />
              ) : (
                <RequestBody
                  phase={flow.phase}
                  demo={demo}
                  onApprove={() =>
                    updateFlow((current) =>
                      current.phase === "approval_required"
                        ? { ...current, phase: "running" }
                        : current
                    )
                  }
                  onDeny={() =>
                    updateFlow((current) =>
                      current.phase === "approval_required"
                        ? { ...current, phase: "denied" }
                        : current
                    )
                  }
                />
              )}
            </div>
          </article>

          {tab === "request" && flow.phase === "running" ? (
            <OutcomeRow
              outcome={flow.outcome}
              onChange={(outcome) =>
                updateFlow((current) => {
                  const next = { ...current, outcome };
                  if (
                    current.phase === "running" ||
                    current.phase === "success" ||
                    current.phase === "failed"
                  ) {
                    next.phase = outcome;
                  }
                  return next;
                })
              }
              className="rounded-md border border-slate-200 bg-white px-3 py-2.5"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
