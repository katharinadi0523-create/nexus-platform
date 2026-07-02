"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Circle, Loader2, ShieldCheck, ShieldEllipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PUBLISH_VALIDATION_PHASES,
  type PublishValidationItemStatus,
  type PublishValidationPhaseKey,
} from "@/components/claw-hub-next/publish-validation-types";
import { cn } from "@/lib/utils";

const ITEM_STEP_MS = 520;
const PHASE_GAP_MS = 640;

type PhaseRuntimeState = {
  itemStatuses: PublishValidationItemStatus[];
  completed: boolean;
  passed: boolean;
};

interface ClawPublishValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  confirmLabel?: string;
  onValidationPassed: () => void;
}

function ValidationDot({ status }: { status: PublishValidationItemStatus }) {
  if (status === "running") {
    return (
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-blue-200/70" />
        <span className="relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-500 bg-white">
          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
        </span>
      </span>
    );
  }

  if (status === "passed") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-50">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-rose-500 bg-rose-50">
        <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
      </span>
    );
  }

  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-200 bg-white">
      <Circle className="h-2.5 w-2.5 fill-slate-200 text-slate-200" />
    </span>
  );
}

function ValidationTimeline({
  itemStatuses,
  items,
}: {
  itemStatuses: PublishValidationItemStatus[];
  items: (typeof PUBLISH_VALIDATION_PHASES)[number]["items"];
}) {
  const activeIndex = itemStatuses.findIndex((status) => status === "running");
  const completedCount = itemStatuses.filter((status) => status === "passed" || status === "failed").length;
  const progressPercent =
    items.length <= 1 ? 0 : Math.min(100, (Math.max(completedCount, activeIndex >= 0 ? activeIndex : 0) / (items.length - 1)) * 100);

  return (
    <div className="px-1 pt-1">
      <div className="relative mx-2 mb-5 h-5">
        <div className="absolute left-2.5 right-2.5 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
        <div
          className="absolute left-2.5 top-1/2 h-px -translate-y-1/2 bg-emerald-400 transition-all duration-500"
          style={{ width: `calc((100% - 20px) * ${progressPercent / 100})` }}
        />
        <div className="relative flex items-start justify-between">
          {items.map((item, index) => (
            <div key={item.id} className="flex w-[72px] flex-col items-center">
              <ValidationDot status={itemStatuses[index] ?? "pending"} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item, index) => {
          const status = itemStatuses[index] ?? "pending";

          return (
            <div key={item.id} className="min-w-0 px-0.5 text-center">
              <div
                className={cn(
                  "text-xs font-semibold leading-5",
                  status === "passed" && "text-emerald-700",
                  status === "running" && "text-blue-700",
                  status === "failed" && "text-rose-700",
                  status === "pending" && "text-slate-500"
                )}
              >
                {item.label}
              </div>
              <div className="mt-1 text-[10px] leading-4 text-slate-400">{item.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhaseSection({
  phaseKey,
  title,
  subtitle,
  items,
  runtime,
  active,
}: {
  phaseKey: PublishValidationPhaseKey;
  title: string;
  subtitle: string;
  items: (typeof PUBLISH_VALIDATION_PHASES)[number]["items"];
  runtime?: PhaseRuntimeState;
  active: boolean;
}) {
  const Icon = phaseKey === "integrity" ? ShieldCheck : ShieldEllipsis;
  const itemStatuses = runtime?.itemStatuses ?? items.map(() => "pending" as const);
  const isRunning = itemStatuses.some((status) => status === "running");
  const isComplete = runtime?.completed ?? false;
  const isPassed = runtime?.passed ?? false;

  return (
    <section
      className={cn(
        "rounded-lg border px-4 py-4 transition-colors",
        active ? "border-blue-200 bg-blue-50/40" : "border-slate-200 bg-white",
        isComplete && isPassed && "border-emerald-200 bg-emerald-50/30"
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
            isComplete && isPassed
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : active
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-slate-50 text-slate-500"
          )}
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {isComplete ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-[4px] px-2 py-0.5 text-[11px] font-medium",
                  isPassed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                )}
              >
                {isPassed ? "校验通过" : "校验未通过"}
              </span>
            ) : active ? (
              <span className="inline-flex items-center rounded-[4px] bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                校验中
              </span>
            ) : (
              <span className="inline-flex items-center rounded-[4px] bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                等待中
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
        </div>
      </div>

      {active || isComplete ? <ValidationTimeline itemStatuses={itemStatuses} items={items} /> : null}
    </section>
  );
}

function createInitialPhaseState(): Record<PublishValidationPhaseKey, PhaseRuntimeState | undefined> {
  return {
    integrity: undefined,
    security: undefined,
  };
}

export function ClawPublishValidationDialog({
  open,
  onOpenChange,
  agentName,
  confirmLabel = "确认发布",
  onValidationPassed,
}: ClawPublishValidationDialogProps) {
  const [phaseStates, setPhaseStates] = useState(createInitialPhaseState);
  const [activePhase, setActivePhase] = useState<PublishValidationPhaseKey | null>(null);
  const [allPassed, setAllPassed] = useState(false);
  const [validationFailed, setValidationFailed] = useState(false);
  const suppressOutsideDismissRef = useRef(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    suppressOutsideDismissRef.current = true;
    const dismissGuardTimer = window.setTimeout(() => {
      suppressOutsideDismissRef.current = false;
    }, 320);

    setPhaseStates(createInitialPhaseState());
    setActivePhase("integrity");
    setAllPassed(false);
    setValidationFailed(false);

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    async function runPhase(phaseKey: PublishValidationPhaseKey) {
      const phase = PUBLISH_VALIDATION_PHASES.find((item) => item.key === phaseKey);
      if (!phase) {
        return false;
      }

      setActivePhase(phaseKey);
      setPhaseStates((current) => ({
        ...current,
        [phaseKey]: {
          itemStatuses: phase.items.map(() => "pending" as const),
          completed: false,
          passed: false,
        },
      }));

      for (let index = 0; index < phase.items.length; index += 1) {
        await new Promise<void>((resolve) => {
          timeouts.push(
            setTimeout(() => {
              if (cancelled) {
                resolve();
                return;
              }

              setPhaseStates((current) => {
                const runtime = current[phaseKey];
                if (!runtime) {
                  return current;
                }

                const nextStatuses = [...runtime.itemStatuses];
                nextStatuses[index] = "running";
                return {
                  ...current,
                  [phaseKey]: {
                    ...runtime,
                    itemStatuses: nextStatuses,
                  },
                };
              });
              resolve();
            }, ITEM_STEP_MS)
          );
        });

        await new Promise<void>((resolve) => {
          timeouts.push(
            setTimeout(() => {
              if (cancelled) {
                resolve();
                return;
              }

              setPhaseStates((current) => {
                const runtime = current[phaseKey];
                if (!runtime) {
                  return current;
                }

                const nextStatuses = [...runtime.itemStatuses];
                nextStatuses[index] = "passed";
                return {
                  ...current,
                  [phaseKey]: {
                    ...runtime,
                    itemStatuses: nextStatuses,
                  },
                };
              });
              resolve();
            }, ITEM_STEP_MS)
          );
        });
      }

      if (cancelled) {
        return false;
      }

      setPhaseStates((current) => ({
        ...current,
        [phaseKey]: {
          itemStatuses: phase.items.map(() => "passed" as const),
          completed: true,
          passed: true,
        },
      }));

      return true;
    }

    void (async () => {
      const integrityPassed = await runPhase("integrity");
      if (cancelled || !integrityPassed) {
        return;
      }

      await new Promise<void>((resolve) => {
        timeouts.push(setTimeout(resolve, PHASE_GAP_MS));
      });

      const securityPassed = await runPhase("security");
      if (cancelled) {
        return;
      }

      if (integrityPassed && securityPassed) {
        setAllPassed(true);
        setActivePhase(null);
      } else {
        setValidationFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
      window.clearTimeout(dismissGuardTimer);
    };
  }, [open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && suppressOutsideDismissRef.current) {
      return;
    }

    onOpenChange(nextOpen);
  }

  function handleConfirmPublish() {
    onValidationPassed();
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="gap-0 p-0 sm:max-w-[760px]"
        onPointerDownOutside={(event) => {
          if (suppressOutsideDismissRef.current) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (suppressOutsideDismissRef.current) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
          <DialogTitle className="text-lg font-semibold text-slate-950">发布前安全校验</DialogTitle>
          <div className="text-sm text-slate-500">
            {agentName} · 两项校验均通过后方可发布
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          {PUBLISH_VALIDATION_PHASES.map((phase) => (
            <PhaseSection
              key={phase.key}
              phaseKey={phase.key}
              title={phase.title}
              subtitle={phase.subtitle}
              items={phase.items}
              runtime={phaseStates[phase.key]}
              active={activePhase === phase.key}
            />
          ))}

          {allPassed ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              资源完整性校验与安全性检查均已通过，可安全发布当前智能体版本。
            </div>
          ) : null}

          {validationFailed ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              校验未通过，请修正安全配置或资源引用后重试。
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t border-slate-100 bg-white px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-[4px] border-slate-300 bg-white px-5 text-slate-700 shadow-none"
            onClick={() => handleOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={!allPassed}
            className="h-9 rounded-[4px] bg-blue-600 px-5 text-white shadow-none hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
            onClick={handleConfirmPublish}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
