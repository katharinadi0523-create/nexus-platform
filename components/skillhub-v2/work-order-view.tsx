"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  Circle,
  Clock3,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WorkOrderStatusPill } from "./shared";
import type { SkillWorkOrder } from "./types";

interface WorkOrderViewProps {
  workOrder: SkillWorkOrder;
  canManage: boolean;
  onBack: () => void;
  onOpenWorkspace: () => void;
  onConfirmVersion: () => void;
}

export function WorkOrderView({
  workOrder,
  canManage,
  onBack,
  onOpenWorkspace,
  onConfirmVersion,
}: WorkOrderViewProps) {
  return (
    <section className="space-y-4" data-testid="skillhub-work-order-view">
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onBack}
            aria-label="返回工单列表"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-semibold text-slate-950">{workOrder.id}</h1>
              <WorkOrderStatusPill status={workOrder.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {workOrder.type === "create" ? "AI 创建" : "AI 优化"} · {workOrder.skillName}
            </p>
          </div>
        </div>
        <div className="flex gap-2 pl-11 lg:pl-0">
          <Button type="button" variant="outline" className="h-9 rounded-[5px]" onClick={onOpenWorkspace}>
            回到工作台
          </Button>
          {canManage && workOrder.status === "pending-confirmation" ? (
            <Button
              type="button"
              className="h-9 rounded-[5px] bg-[#2773ff]"
              onClick={onConfirmVersion}
            >
              <Check className="h-4 w-4" />
              确认并存为版本
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_380px]">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">原始诉求</h2>
            <blockquote className="mt-3 rounded-md border-l-2 border-[#2773ff] bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
              “{workOrder.request}”
            </blockquote>
            {workOrder.evidence.length > 0 ? (
              <div className="mt-4">
                <div className="text-xs font-medium text-slate-500">挂载依据</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {workOrder.evidence.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">生成流程</h2>
            <div className="mt-5 space-y-0">
              {workOrder.steps.map((step, index) => {
                const Icon =
                  step.status === "done"
                    ? Check
                    : step.status === "active"
                      ? Clock3
                      : step.status === "failed"
                        ? AlertCircle
                        : Circle;
                return (
                  <div key={step.id} className="relative flex gap-3 pb-6 last:pb-0">
                    {index < workOrder.steps.length - 1 ? (
                      <span className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px bg-slate-200" />
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                        step.status === "done"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : step.status === "active"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : step.status === "failed"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-slate-200 bg-white text-slate-300"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="pt-1">
                      <div className="text-sm font-medium text-slate-800">{step.label}</div>
                      {step.status === "active" ? (
                        <div className="mt-1 text-xs text-amber-600">当前步骤</div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">产物</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">关联技能</dt>
                <dd className="font-medium text-slate-800">{workOrder.skillName}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">版本</dt>
                <dd className="font-mono font-medium text-[#2773ff]">
                  {workOrder.outputVersion ?? "生成中"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">来源血缘</dt>
                <dd className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  <Sparkles className="h-3 w-3" />
                  对话
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}

