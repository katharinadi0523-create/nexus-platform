"use client";

import { ChevronRight, CircleAlert, Cpu, HardDrive, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  ExecutionResourceTier,
  ResourceConfig,
  RuntimeResourceTier,
} from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";
import { EXECUTION_CAPABILITY_OPTIONS, EXECUTION_TIER_OPTIONS, RUNTIME_TIER_OPTIONS } from "./constants";
import { SectionCard } from "./section-card";
import type { ResourceValidation } from "./utils";

type ResourceSectionProps = {
  resourceConfig: ResourceConfig;
  resourceValidation: ResourceValidation;
  runtimeAdvancedOpen: boolean;
  onToggleRuntimeAdvanced: () => void;
  onRuntimeTierChange: (tier: RuntimeResourceTier) => void;
  onExecutionTierChange: (tier: ExecutionResourceTier) => void;
  onRuntimeNumberChange: (field: "maxConcurrentTasks" | "maxTaskDurationMin", value: string) => void;
  onRuntimeAdvancedNumberChange: (
    field: "cpu" | "memoryGb" | "diskGb" | "startupTimeoutSec",
    value: string
  ) => void;
  onRuntimeAdvancedTextChange: (value: string) => void;
  onExecutionNumberChange: (
    field: "workspaceDiskGb" | "maxConcurrentExecutions" | "maxExecutionTimeoutMin",
    value: string
  ) => void;
  onExecutionCapabilityChange: (
    key: keyof ResourceConfig["execution"]["capabilities"],
    checked: boolean
  ) => void;
};

export function ClawResourceSection({
  resourceConfig,
  resourceValidation,
  runtimeAdvancedOpen,
  onToggleRuntimeAdvanced,
  onRuntimeTierChange,
  onExecutionTierChange,
  onRuntimeNumberChange,
  onRuntimeAdvancedNumberChange,
  onRuntimeAdvancedTextChange,
  onExecutionNumberChange,
  onExecutionCapabilityChange,
}: ResourceSectionProps) {
  return (
    <SectionCard>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-sky-700" />
                <div className="text-base font-semibold text-slate-950">Claw 本体资源</div>
              </div>
              <div className="mt-2 text-sm leading-7 text-slate-600">
                用于配置 Claw 在云端运行时的常驻资源规格，影响会话处理、任务规划与调度能力。
              </div>
            </div>

            <Badge className="border-sky-100 bg-sky-50 text-sky-700">云端 Docker</Badge>
          </div>

          <div className="mt-5">
            <div className="text-sm font-medium text-slate-900">资源档位</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {RUNTIME_TIER_OPTIONS.map((option) => {
                const isActive = resourceConfig.runtime.tier === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onRuntimeTierChange(option.value)}
                    className={cn(
                      "rounded-[20px] border px-4 py-4 text-left transition-all",
                      isActive
                        ? "border-[#d8e0ea] bg-[#f5f7fb] shadow-[0_16px_30px_-28px_rgba(15,23,42,0.12)]"
                        : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-950">{option.title}</div>
                      {option.value === "standard" ? (
                        <Badge className="border-[#d9e1da] bg-[#f5f7f5] text-[#5c6c5f]">推荐</Badge>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs leading-6 text-slate-500">{option.summary}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-xs text-slate-400">用于承载 Claw 常驻运行资源。</div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <NumericField
              label="最大并发任务数"
              unit="个"
              value={resourceConfig.runtime.maxConcurrentTasks}
              message={resourceValidation.maxConcurrentTasks || "控制该 Claw 可同时处理的任务数上限。"}
              error={Boolean(resourceValidation.maxConcurrentTasks)}
              onChange={(value) => onRuntimeNumberChange("maxConcurrentTasks", value)}
              max={20}
            />

            <NumericField
              label="单任务最大运行时长"
              unit="分钟"
              value={resourceConfig.runtime.maxTaskDurationMin}
              message={resourceValidation.maxTaskDurationMin || "控制单个任务在 Claw 本体侧的最大允许运行时长。"}
              error={Boolean(resourceValidation.maxTaskDurationMin)}
              onChange={(value) => onRuntimeNumberChange("maxTaskDurationMin", value)}
            />
          </div>

          <div className="mt-5 rounded-[22px] border border-dashed border-slate-200 bg-slate-50/60 p-4">
            <button type="button" onClick={onToggleRuntimeAdvanced} className="flex w-full items-center justify-between gap-3 text-left">
              <div>
                <div className="text-sm font-medium text-slate-900">高级设置</div>
                <div className="mt-1 text-xs text-slate-400">可按需要覆盖 CPU、内存、磁盘和启动参数。</div>
              </div>
              <ChevronRight className={cn("h-4 w-4 text-slate-400 transition-transform", runtimeAdvancedOpen ? "rotate-90" : "")} />
            </button>

            {runtimeAdvancedOpen ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InlineNumberField
                  label="CPU 核数"
                  value={resourceConfig.runtime.advanced.cpu}
                  onChange={(value) => onRuntimeAdvancedNumberChange("cpu", value)}
                />
                <InlineNumberField
                  label="内存大小"
                  value={resourceConfig.runtime.advanced.memoryGb}
                  unit="GB"
                  onChange={(value) => onRuntimeAdvancedNumberChange("memoryGb", value)}
                />
                <InlineNumberField
                  label="容器磁盘空间"
                  value={resourceConfig.runtime.advanced.diskGb}
                  unit="GB"
                  onChange={(value) => onRuntimeAdvancedNumberChange("diskGb", value)}
                />
                <InlineNumberField
                  label="启动超时时间"
                  value={resourceConfig.runtime.advanced.startupTimeoutSec}
                  unit="秒"
                  onChange={(value) => onRuntimeAdvancedNumberChange("startupTimeoutSec", value)}
                />
                <div className="sm:col-span-2">
                  <Label className="text-sm font-medium text-slate-900">Runtime 版本</Label>
                  <Input
                    type="text"
                    value={resourceConfig.runtime.advanced.runtimeVersion}
                    onChange={(event) => onRuntimeAdvancedTextChange(event.target.value)}
                    className="mt-2 h-10 rounded-xl border-slate-200 bg-white"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-sky-700" />
                <div className="text-base font-semibold text-slate-950">执行环境资源</div>
              </div>
              <div className="mt-2 text-sm leading-7 text-slate-600">
                用于配置 Claw 执行动作时可申请的执行环境规格，影响浏览器操作、代码执行、文件处理等任务的资源上限。
              </div>
            </div>

            <Badge className="border-slate-200 bg-slate-100 text-slate-600">平台统一隔离策略</Badge>
          </div>

          <div className="mt-5">
            <div className="text-sm font-medium text-slate-900">资源档位</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {EXECUTION_TIER_OPTIONS.map((option) => {
                const isActive = resourceConfig.execution.tier === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onExecutionTierChange(option.value)}
                    className={cn(
                      "rounded-[20px] border px-4 py-4 text-left transition-all",
                      isActive
                        ? "border-[#d8e0ea] bg-[#f5f7fb] shadow-[0_16px_30px_-28px_rgba(15,23,42,0.12)]"
                        : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-950">{option.title}</div>
                      {option.value === "standard" ? (
                        <Badge className="border-[#d9e1da] bg-[#f5f7f5] text-[#5c6c5f]">推荐</Badge>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs leading-6 text-slate-500">{option.summary}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-xs text-slate-400">用于定义执行环境的资源规格上限。</div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <NumericField
              label="工作目录空间"
              unit="GB"
              value={resourceConfig.execution.workspaceDiskGb}
              message={resourceValidation.workspaceDiskGb || "控制执行环境可使用的临时工作目录空间。"}
              error={Boolean(resourceValidation.workspaceDiskGb)}
              onChange={(value) => onExecutionNumberChange("workspaceDiskGb", value)}
            />

            <NumericField
              label="并发执行环境数上限"
              unit="个"
              value={resourceConfig.execution.maxConcurrentExecutions}
              message={resourceValidation.maxConcurrentExecutions || "控制当前 Claw 同时可拉起的执行环境数量上限。"}
              error={Boolean(resourceValidation.maxConcurrentExecutions)}
              onChange={(value) => onExecutionNumberChange("maxConcurrentExecutions", value)}
            />

            <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 sm:col-span-2">
              <Label className="text-sm font-medium text-slate-900">单次执行超时时间</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={resourceConfig.execution.maxExecutionTimeoutMin}
                  onChange={(event) => onExecutionNumberChange("maxExecutionTimeoutMin", event.target.value)}
                  aria-invalid={Boolean(resourceValidation.maxExecutionTimeoutMin)}
                  className="h-10 rounded-xl border-slate-200 bg-white"
                />
                <span className="text-sm text-slate-400">分钟</span>
              </div>
              <div className={cn("mt-2 text-xs", resourceValidation.maxExecutionTimeoutMin ? "text-rose-500" : "text-slate-400")}>
                {resourceValidation.maxExecutionTimeoutMin || "控制单次执行动作的最长允许运行时间。"}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-500" />
              <div>
                <div className="text-sm font-medium text-slate-900">执行环境说明</div>
                <div className="mt-1 text-xs leading-6 text-slate-500">
                  执行环境由平台统一按隔离策略运行，当前页面仅配置资源规格与能力范围，不暴露生命周期和复用策略。
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-sm font-medium text-slate-900">执行能力范围</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <TooltipProvider>
                {EXECUTION_CAPABILITY_OPTIONS.map((item) => (
                  <label
                    key={item.key}
                    htmlFor={`execution-capability-${item.key}`}
                    className="flex cursor-pointer items-start gap-3 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3 transition-colors hover:border-slate-300 hover:bg-white"
                  >
                    <Checkbox
                      id={`execution-capability-${item.key}`}
                      checked={resourceConfig.execution.capabilities[item.key]}
                      onCheckedChange={(checked) => onExecutionCapabilityChange(item.key, checked === true)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{item.label}</span>
                        {item.tone === "risk" ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                <CircleAlert className="h-3 w-3" />
                                高风险
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>启用后可执行系统命令，建议仅在必要场景下开放。</TooltipContent>
                          </Tooltip>
                        ) : null}
                        {item.tone === "policy" ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                <CircleAlert className="h-3 w-3" />
                                受策略约束
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>网络访问最终受平台统一策略和租户白名单控制。</TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs leading-6 text-slate-500">{item.note}</div>
                    </div>
                  </label>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function NumericField({
  label,
  unit,
  value,
  message,
  error,
  onChange,
  max,
}: {
  label: string;
  unit: string;
  value: number;
  message: string;
  error: boolean;
  onChange: (value: string) => void;
  max?: number;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
      <Label className="text-sm font-medium text-slate-900">{label}</Label>
      <div className="mt-2 flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={max}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error}
          className="h-10 rounded-xl border-slate-200 bg-white"
        />
        <span className="text-sm text-slate-400">{unit}</span>
      </div>
      <div className={cn("mt-2 text-xs", error ? "text-rose-500" : "text-slate-400")}>{message}</div>
    </div>
  );
}

function InlineNumberField({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-slate-900">{label}</Label>
      <div className="mt-2 flex items-center gap-2">
        <Input
          type="number"
          min={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 rounded-xl border-slate-200 bg-white"
        />
        {unit ? <span className="text-sm text-slate-400">{unit}</span> : null}
      </div>
    </div>
  );
}
