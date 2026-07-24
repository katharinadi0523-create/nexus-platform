"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  FlaskConical,
  LoaderCircle,
  LockKeyhole,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { ClawConversationTimeline } from "@/components/claw-hub-next/conversation-timeline";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TRIAL_RUN_TIMELINE_ITEMS } from "./claw-mock-flows";
import type { SkillRecord } from "./types";

interface TrialRunViewProps {
  skill: SkillRecord;
  onBack: () => void;
  onComplete: () => void;
}

export function TrialRunView({ skill, onBack, onComplete }: TrialRunViewProps) {
  const [state, setState] = useState<"idle" | "running" | "complete">(
    skill.runtimeSnapshot.status === "ready" ? "complete" : "idle"
  );
  const lockedVersion = skill.versions[0]?.version ?? "v1.0";
  const isResearchSkill = skill.id === "research-evidence-extractor";
  const sampleInput = isResearchSkill
    ? "samples/rice_drought_study.pdf"
    : skill.runtimeSnapshot.sample ?? "samples/rice_expression.csv";
  const candidateDependencies = isResearchSkill ? "pypdf · httpx" : "pandas · scipy";
  const trialItems = TRIAL_RUN_TIMELINE_ITEMS.map((item) => {
    if (item.key === "trial-user" && item.type === "user") {
      return {
        ...item,
        message: {
          ...item.message,
          content: `用 ${sampleInput} 对当前锁定版本做一次试运行，自动识别、安装并锁定依赖。`,
          attachments: [sampleInput],
        },
      };
    }
    if (item.key === "trial-scan" && item.type === "action" && isResearchSkill) {
      return {
        ...item,
        logs: ["候选依赖：pypdf>=4.3、httpx>=0.27。", "平台引用：Crossref API。"],
      };
    }
    if (item.key === "trial-fixture" && item.type === "action") {
      return {
        ...item,
        logs: [`选择 ${sampleInput}，覆盖当前技能主执行路径。`],
      };
    }
    if (item.key === "trial-skill" && item.type === "action") {
      return {
        ...item,
        title: `Skill · ${skill.id}@${lockedVersion}`,
        logs: isResearchSkill
          ? ["退出码 0；证据一致性用例 9/9 通过。", "产物：artifacts/evidence-trace.json。"]
          : item.logs,
      };
    }
    return item;
  });

  function startRun() {
    if (state === "running") return;
    setState("running");
    window.setTimeout(() => {
      setState("complete");
      onComplete();
    }, 1200);
  }

  return (
    <section
      className="flex min-h-[calc(100vh-132px)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white"
      data-testid="skillhub-trial-run-view"
    >
      <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onBack}
            aria-label="返回依赖页"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#2773ff]">
            <FlaskConical className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-semibold text-slate-950">AI 试运行</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700">
                <Sparkles className="h-3 w-3" />
                复用 Claw
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600">
                <LockKeyhole className="h-3 w-3" />
                锁定 {lockedVersion}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {skill.displayName} · 静态扫描、沙箱运行、依赖锁定与快照冻结在同一对话中完成
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="h-9 rounded-[5px] bg-[#2773ff] hover:bg-[#1f66f0]"
          disabled={state === "running"}
          onClick={startRun}
        >
          {state === "running" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : state === "complete" ? (
            <RotateCcw className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {state === "running" ? "正在试运行" : state === "complete" ? "重新试运行" : "开始 AI 试运行"}
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(480px,1.2fr)_380px]">
        <div className="min-h-[620px] border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-800">
            Claw 执行对话
          </div>
          <ScrollArea className="h-[620px]">
            <div className="space-y-4 p-5">
              {state === "idle" ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
                  <CircleDashed className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-500">点击“开始 AI 试运行”查看完整执行链路</p>
                </div>
              ) : (
                <ClawConversationTimeline items={trialItems} />
              )}
            </div>
          </ScrollArea>
        </div>

        <aside className="bg-slate-50/50 p-5">
          <h2 className="text-sm font-semibold text-slate-900">运行配置与产物</h2>
          <dl className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
            {[
              ["锁定版本", lockedVersion],
              ["运行输入", sampleInput],
              ["运行环境", "Python 3.11 · 隔离沙箱"],
              ["候选依赖", candidateDependencies],
              ["平台引用", skill.dependencies.find((item) => item.kind === "platform")?.name ?? "无"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-right font-medium text-slate-700">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">装配进度</h3>
            <div className="mt-4 space-y-3">
              {["静态扫描", "沙箱安装", "执行 Skill", "冻结运行时快照"].map((label, index) => {
                const done = state === "complete";
                const active = state === "running" && index <= 2;
                return (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : active ? (
                      <LoaderCircle className="h-4 w-4 animate-spin text-[#2773ff]" />
                    ) : (
                      <CircleDashed className="h-4 w-4 text-slate-300" />
                    )}
                    <span className={done || active ? "text-slate-800" : "text-slate-400"}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {state === "complete" ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                试运行成功
              </div>
              <p className="mt-2 text-xs leading-5">
                {isResearchSkill ? "9/9" : "4/4"} 用例通过，运行时快照已绑定 {lockedVersion}
                ，依赖版本已冻结。
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
