"use client";

import { useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Info } from "lucide-react";
import type {
  ClarifyAnswers,
  ClarifyQuestion,
} from "@/components/claw-hub-next/clarify-pager";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * 基础使用端的澄清问答面板（交互对齐智谱 ZCode）：
 * - 一次 1–4 个问题，逐题切换；每题必须选择一个选项或填写自定义回答，才能「继续 / 提交」；
 * - 答不了的问题可在自定义回答中直接写明（如「不确定」）；不作答时 5 分钟后自动继续，按未回答处理；
 * - 首次有效操作（选择选项、输入自定义回答、切换题目）即暂停自动继续；
 * - 最后一分钟在右上角显示秒数。
 */
export function ClarifyQuestionPanel({
  questions,
  secondsLeft,
  onFirstInteraction,
  onSubmit,
}: {
  questions: ClarifyQuestion[];
  secondsLeft: number | null;
  onFirstInteraction: () => void;
  onSubmit: (answers: ClarifyAnswers) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ClarifyAnswers>({});
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>({});
  const reported = useRef(false);

  const current = questions[index];
  if (!current) return null;
  const total = questions.length;
  const isLast = index >= total - 1;
  const answer = answers[current.questionKey];
  const selectedValue = typeof answer === "string" ? answer : null;
  const customDraft = customDrafts[current.questionKey] ?? "";
  const currentAnswered = answer !== undefined;
  const allAnswered = questions.every((question) => answers[question.questionKey] !== undefined);
  const canAdvance = isLast ? allAnswered : currentAnswered;

  function report() {
    if (reported.current) return;
    reported.current = true;
    onFirstInteraction();
  }

  function goTo(nextIndex: number) {
    report();
    setIndex(Math.max(0, Math.min(total - 1, nextIndex)));
  }

  function advance(nextAnswers: ClarifyAnswers) {
    if (isLast) {
      onSubmit(nextAnswers);
      return;
    }
    setIndex((value) => value + 1);
  }

  function selectOption(value: string) {
    report();
    setAnswers((currentAnswers) => ({ ...currentAnswers, [current.questionKey]: value }));
    setCustomDrafts((drafts) => ({ ...drafts, [current.questionKey]: "" }));
  }

  function changeCustom(text: string) {
    report();
    setCustomDrafts((drafts) => ({ ...drafts, [current.questionKey]: text }));
    setAnswers((currentAnswers) => {
      const next = { ...currentAnswers };
      if (text.trim()) next[current.questionKey] = { type: "custom", text: text.trim() };
      else delete next[current.questionKey];
      return next;
    });
  }

  return (
    <section
      aria-label="Claw 需要确认"
      className="w-full rounded-2xl border border-[#d5e1f4] bg-white p-3 shadow-[0_6px_24px_rgba(39,115,255,0.08)]"
    >
      <div className="flex items-start justify-between gap-3 px-1 pt-0.5">
        <div className="min-w-0 flex-1 text-[14px] font-medium leading-6 text-slate-800">
          <span className="mr-2 inline-flex h-5 items-center rounded bg-[#e8f0fb] px-1.5 align-[1px] text-[11px] font-medium text-[#245db9]">
            需要确认
          </span>
          {current.question}
        </div>
        <div className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-slate-400">
          {secondsLeft !== null ? (
            <span className="min-w-10 px-1.5 py-0.5 tabular-nums text-slate-500">
              {secondsLeft}秒
            </span>
          ) : null}
          {total > 1 ? (
            <>
              <button
                type="button"
                aria-label="上一题"
                disabled={index === 0}
                onClick={() => goTo(index - 1)}
                className="rounded p-1 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-9 text-center tabular-nums">
                {index + 1} / {total}
              </span>
              <button
                type="button"
                aria-label="下一题"
                disabled={isLast}
                onClick={() => goTo(index + 1)}
                className="rounded p-1 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div role="radiogroup" aria-label={current.question} className="mt-2.5 space-y-1">
        {current.options.map((option, optionIndex) => {
          const selected = selectedValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => selectOption(option.value)}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                selected ? "bg-[#eef4ff]" : "hover:bg-slate-50",
              )}
            >
              <span
                className={cn(
                  "mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  selected ? "border-[#2773ff] bg-[#2773ff] text-white" : "border-slate-300 bg-white",
                )}
              >
                {selected ? <Check className="h-3 w-3" /> : null}
              </span>
              <span className="min-w-0 flex-1 text-[14px] leading-6">
                <span className="font-medium text-slate-800">{option.label}</span>
                {/* 契约：推荐项放在第一位，由界面标注。 */}
                {optionIndex === 0 ? (
                  <span className="ml-1.5 rounded bg-[#e8f0fb] px-1 py-px align-[1px] text-[11px] font-medium text-[#245db9]">
                    推荐
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}

        {current.freeInputLabel ? (
          <label
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2",
              answer && typeof answer === "object" ? "bg-[#eef4ff]" : "hover:bg-slate-50",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                answer && typeof answer === "object"
                  ? "border-[#2773ff] bg-[#2773ff] text-white"
                  : "border-slate-300 bg-white",
              )}
            >
              {answer && typeof answer === "object" ? <Check className="h-3 w-3" /> : null}
            </span>
            <input
              type="text"
              value={customDraft}
              onChange={(event) => changeCustom(event.target.value)}
              placeholder="自定义回答：输入你的回答…"
              aria-label={current.freeInputLabel}
              className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>
        ) : null}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-1 pt-2.5">
        <p className="flex min-w-0 items-center gap-1.5 text-[12px] text-slate-500">
          <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          {isLast && currentAnswered && !allAnswered
            ? "还有问题没有回答，回答后才能提交"
            : "选择一个选项，或在自定义回答中写下你的想法"}
        </p>
        <div className="flex shrink-0 items-center">
          <Button
            type="button"
            disabled={!canAdvance}
            className="h-8 rounded-lg bg-[#2773ff] px-4 text-[13px] hover:bg-[#1f63e0] disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-100"
            onClick={() => {
              report();
              advance(answers);
            }}
          >
            {isLast ? "提交" : "继续"}
          </Button>
        </div>
      </div>
    </section>
  );
}
