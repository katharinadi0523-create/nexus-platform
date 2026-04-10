"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NumericPlainInput } from "@/components/space-operations/run-config/numeric-plain-input";
import { NumberStepper } from "@/components/space-operations/run-config/number-stepper";
import { cn } from "@/lib/utils";

interface ConfigFieldRowProps {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

/** 标签与一级模块标题左缘对齐；底部分隔线在各字段格内 */
function ConfigFieldRow({ id, label, required, children, hint }: ConfigFieldRowProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 py-4 sm:flex-row sm:items-center sm:gap-x-6 xl:gap-x-5">
      <Label htmlFor={id} className="w-full shrink-0 text-left text-sm font-medium text-slate-900 sm:w-36">
        <span className="inline-flex flex-wrap items-center gap-1">
          {required ? <span className="text-red-500">*</span> : null}
          <span>{label}</span>
        </span>
      </Label>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
        {children}
        {hint ? <span className="text-sm leading-6 text-slate-400">{hint}</span> : null}
      </div>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  /** 模块灰字说明，显示在标题下方 */
  description?: string;
  className?: string;
}

function SectionHeader({ title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}>
      <h3 className="shrink-0 text-base font-semibold text-slate-900">{title}</h3>
      {description ? (
        <span className="min-w-0 text-sm font-normal leading-relaxed text-slate-500">{description}</span>
      ) : null}
    </div>
  );
}

const MODULE_DESCRIPTIONS = {
  resource:
    "约束单个 Agent 可使用的 CPU、GPU、工作空间与任务规模，以及本空间单日 Token 消耗上限。",
  agent: "限制 Agent 侧任务并发、单次运行时长、推理迭代步数与上下文长度。",
  llm: "配置大模型调用的重试、并发与按分钟请求上限（QPM），避免瞬时打满网关。",
  trigger: "约束本空间内定时或事件触发器的数量，以及两次触发之间的最短间隔。",
} as const;

/** 窄屏单列；足够宽时（xl）每行两个字段 */
function SectionFields({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 grid grid-cols-1 border-t border-slate-100 xl:grid-cols-2 xl:gap-x-10 2xl:gap-x-14">
      {children}
    </div>
  );
}

export interface RunConfigurationFormState {
  cpuCores: number;
  gpuCards: number;
  workspaceStorageGib: number;
  maxConcurrentTasks: number;
  maxTaskDurationMinutes: number;
  dailyTokenLimit: number;
  maxIterations: number;
  maxContextLength: number;
  maxLlmRetries: number;
  maxConcurrentLlmRequests: number;
  maxQpm: number;
  maxTriggers: number;
  minTriggerIntervalMinutes: number;
}

const GLOBAL_EFFECT_NOTICE_MS = 2000;

const DEFAULT_STATE: RunConfigurationFormState = {
  cpuCores: 4,
  gpuCards: 0,
  workspaceStorageGib: 20,
  maxConcurrentTasks: 3,
  maxTaskDurationMinutes: 120,
  dailyTokenLimit: 1_000_000,
  maxIterations: 32,
  maxContextLength: 128_000,
  maxLlmRetries: 3,
  maxConcurrentLlmRequests: 8,
  maxQpm: 60,
  maxTriggers: 50,
  minTriggerIntervalMinutes: 1,
};

export function RunConfigurationForm() {
  const [values, setValues] = useState<RunConfigurationFormState>(DEFAULT_STATE);
  const [globalEffectNoticeOpen, setGlobalEffectNoticeOpen] = useState(false);
  const globalEffectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (globalEffectTimerRef.current) {
        clearTimeout(globalEffectTimerRef.current);
      }
    };
  }, []);

  const patch = <K extends keyof RunConfigurationFormState>(key: K, v: RunConfigurationFormState[K]) => {
    setValues((s) => ({ ...s, [key]: v }));
  };

  const handleApplyGlobally = () => {
    if (globalEffectTimerRef.current) {
      clearTimeout(globalEffectTimerRef.current);
    }
    setGlobalEffectNoticeOpen(true);
    globalEffectTimerRef.current = setTimeout(() => {
      setGlobalEffectNoticeOpen(false);
      globalEffectTimerRef.current = null;
    }, GLOBAL_EFFECT_NOTICE_MS);
  };

  const handleReset = () => {
    setValues(DEFAULT_STATE);
    toast.message("已恢复默认示例值");
  };

  return (
    <div className="flex min-h-full max-w-5xl flex-col xl:max-w-6xl 2xl:max-w-7xl">
      {globalEffectNoticeOpen ? (
        <div
          className={cn(
            "pointer-events-none fixed top-[68px] z-[70] flex justify-center px-4",
            "left-0 right-0 md:left-[220px]"
          )}
        >
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-auto inline-flex max-w-[min(100%,24rem)] items-center justify-center gap-2 rounded-none border border-slate-200/60 bg-white/80 px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm"
          >
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2.5} aria-hidden />
            运行配置已全局生效
          </div>
        </div>
      ) : null}

      <div className="flex-1 space-y-10 pb-4">
      <section className="space-y-0">
        <SectionHeader title="资源配置" description={MODULE_DESCRIPTIONS.resource} />
        <SectionFields>
          <ConfigFieldRow id="cpu" label="CPU" required>
            <NumberStepper value={values.cpuCores} onChange={(n) => patch("cpuCores", n)} min={1} max={256} suffix="核" />
          </ConfigFieldRow>
          <ConfigFieldRow id="gpu" label="GPU" required>
            <NumberStepper value={values.gpuCards} onChange={(n) => patch("gpuCards", n)} min={0} max={64} suffix="卡" />
          </ConfigFieldRow>
          <ConfigFieldRow id="ws" label="工作空间存储" required>
            <NumericPlainInput
              id="ws"
              value={values.workspaceStorageGib}
              onChange={(n) => patch("workspaceStorageGib", n)}
              min={1}
              max={10_240}
              suffix="GiB"
            />
          </ConfigFieldRow>
          <ConfigFieldRow id="tokens" label="单日 Token 消耗上限" required>
            <NumericPlainInput
              id="tokens"
              value={values.dailyTokenLimit}
              onChange={(n) => patch("dailyTokenLimit", n)}
              min={1000}
              max={999_999_999}
            />
          </ConfigFieldRow>
        </SectionFields>
      </section>

      <section className="space-y-0">
        <SectionHeader title="智能体限制" description={MODULE_DESCRIPTIONS.agent} />
        <SectionFields>
          <ConfigFieldRow id="tasks" label="最大任务并发数" required>
            <NumberStepper value={values.maxConcurrentTasks} onChange={(n) => patch("maxConcurrentTasks", n)} min={1} max={100} />
          </ConfigFieldRow>
          <ConfigFieldRow id="dur" label="单任务上限时长" required>
            <NumberStepper
              value={values.maxTaskDurationMinutes}
              onChange={(n) => patch("maxTaskDurationMinutes", n)}
              min={1}
              max={10080}
              suffix="分钟"
            />
          </ConfigFieldRow>
          <ConfigFieldRow id="iter" label="最大迭代次数" required>
            <NumberStepper value={values.maxIterations} onChange={(n) => patch("maxIterations", n)} min={1} max={500} />
          </ConfigFieldRow>
          <ConfigFieldRow id="ctx" label="最大上下文长度" required>
            <NumericPlainInput
              id="ctx"
              value={values.maxContextLength}
              onChange={(n) => patch("maxContextLength", n)}
              min={4096}
              max={2_000_000}
            />
          </ConfigFieldRow>
        </SectionFields>
      </section>

      <section className="space-y-0">
        <SectionHeader title="LLM" description={MODULE_DESCRIPTIONS.llm} />
        <SectionFields>
          <ConfigFieldRow id="retry" label="最大重试次数" required>
            <NumberStepper value={values.maxLlmRetries} onChange={(n) => patch("maxLlmRetries", n)} min={0} max={20} />
          </ConfigFieldRow>
          <ConfigFieldRow id="conc" label="最大并发请求数" required>
            <NumberStepper
              value={values.maxConcurrentLlmRequests}
              onChange={(n) => patch("maxConcurrentLlmRequests", n)}
              min={1}
              max={500}
            />
          </ConfigFieldRow>
          <ConfigFieldRow id="qpm" label="每分钟最大请求数（QPM）" required>
            <NumericPlainInput id="qpm" value={values.maxQpm} onChange={(n) => patch("maxQpm", n)} min={1} max={100_000} />
          </ConfigFieldRow>
        </SectionFields>
      </section>

      <section className="space-y-0">
        <SectionHeader title="触发器限制" description={MODULE_DESCRIPTIONS.trigger} />
        <SectionFields>
          <ConfigFieldRow id="trig" label="最大触发器数" required>
            <NumberStepper value={values.maxTriggers} onChange={(n) => patch("maxTriggers", n)} min={0} max={10_000} />
          </ConfigFieldRow>
          <ConfigFieldRow id="interval" label="最短间隔" required>
            <NumberStepper
              value={values.minTriggerIntervalMinutes}
              onChange={(n) => patch("minTriggerIntervalMinutes", n)}
              min={1}
              max={1440}
              suffix="分钟"
            />
          </ConfigFieldRow>
        </SectionFields>
      </section>
      </div>

      <div
        className={cn(
          "sticky bottom-0 z-10 -mx-4 shrink-0 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm",
          "supports-[backdrop-filter]:bg-white/85",
          "sm:-mx-6 sm:px-6"
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            className="min-w-[88px] bg-blue-600 hover:bg-blue-700"
            onClick={handleApplyGlobally}
          >
            全局运用
          </Button>
          <Button type="button" variant="outline" className="border-slate-200 text-slate-700" onClick={handleReset}>
            恢复默认
          </Button>
        </div>
      </div>
    </div>
  );
}
