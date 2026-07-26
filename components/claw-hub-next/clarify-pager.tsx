"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClarifyOption {
  label: string;
  value: string;
  summary?: string;
}

export interface ClarifyQuestion {
  id: string;
  questionKey: string;
  question: string;
  options: ClarifyOption[];
  freeInputLabel?: string;
}

export type ClarifyAnswerValue = string | { type: "custom"; text: string };

export type ClarifyAnswers = Record<string, ClarifyAnswerValue>;

const EXIT_MS = 220;

/**
 * Shared HITL clarify pager for control-end (Workbench) and interface-end (我的Claw).
 * Multiple questions occupy one slot and flip; options are vertical.
 */
export function ClarifyPager({
  questions,
  onComplete,
  className,
  initialAnswers,
}: {
  questions: ClarifyQuestion[];
  onComplete: (answers: ClarifyAnswers) => void;
  className?: string;
  initialAnswers?: ClarifyAnswers;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ClarifyAnswers>(initialAnswers ?? {});
  const [exiting, setExiting] = useState(false);
  const [customDraft, setCustomDraft] = useState("");

  const current = questions[index];
  const total = questions.length;

  useEffect(() => {
    if (!current) return;
    const existing = answers[current.questionKey];
    if (existing && typeof existing === "object" && existing.type === "custom") {
      setCustomDraft(existing.text);
    } else {
      setCustomDraft("");
    }
  }, [current, answers]);

  if (!current || total === 0) return null;

  const selectedValue = (() => {
    const value = answers[current.questionKey];
    if (!value || (typeof value === "object" && value.type === "custom")) return "";
    return value;
  })();

  function advanceWith(nextAnswers: ClarifyAnswers) {
    if (exiting) return;
    setExiting(true);
    window.setTimeout(() => {
      setExiting(false);
      if (index >= total - 1) {
        onComplete(nextAnswers);
        return;
      }
      setIndex((currentIndex) => currentIndex + 1);
    }, EXIT_MS);
  }

  function selectOption(value: string) {
    if (exiting || !current) return;
    const nextAnswers = { ...answers, [current.questionKey]: value };
    setAnswers(nextAnswers);
    advanceWith(nextAnswers);
  }

  function submitCustom() {
    if (exiting || !current) return;
    const text = customDraft.trim();
    if (!text) return;
    const nextAnswers = {
      ...answers,
      [current.questionKey]: { type: "custom" as const, text },
    };
    setAnswers(nextAnswers);
    advanceWith(nextAnswers);
  }

  function goPrevious() {
    if (exiting || index <= 0) return;
    setIndex((currentIndex) => currentIndex - 1);
  }

  return (
    <div className={cn("w-full max-w-[760px]", className)}>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          {index > 0 ? (
            <button
              type="button"
              onClick={goPrevious}
              disabled={exiting}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[#2773ff] hover:bg-[#e8f0fb] disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              上一题
            </button>
          ) : (
            <span className="text-slate-400">澄清确认</span>
          )}
        </div>
        <span>
          {index + 1} / {total}
        </span>
      </div>

      <article
        className={cn(
          "rounded-[14px] border border-[#c9daf8] bg-[#eef4ff] px-[18px] py-4 transition duration-200 ease-out",
          exiting && "pointer-events-none translate-x-16 opacity-0"
        )}
      >
        <p className="text-sm font-semibold leading-[1.65] text-[#1e3a6e]">
          {current.question}
        </p>

        <div className="mt-3.5 grid gap-2.5">
          {current.options.map((option) => {
            const selected = selectedValue === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={exiting}
                onClick={() => selectOption(option.value)}
                className={cn(
                  "flex min-h-[42px] w-full items-center justify-start rounded-[10px] border px-3.5 text-left text-sm font-medium transition",
                  selected
                    ? "border-[rgba(45,95,255,0.28)] bg-[rgba(45,95,255,0.08)] text-[#1e3a6e]"
                    : "border-[#c9daf8] bg-white text-[#1e3a6e] hover:border-[rgba(45,95,255,0.28)] hover:bg-[rgba(45,95,255,0.04)]"
                )}
              >
                {option.label}
              </button>
            );
          })}

          {current.freeInputLabel ? (
            <div className="flex min-h-[42px] w-full items-center gap-2.5 rounded-[10px] border border-[#c9daf8] bg-white px-3.5 py-1">
              <input
                type="text"
                value={customDraft}
                disabled={exiting}
                placeholder="其他说明"
                aria-label={current.freeInputLabel}
                onChange={(event) => setCustomDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitCustom();
                  }
                }}
                className="min-h-8 min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                disabled={exiting || !customDraft.trim()}
                onClick={submitCustom}
                className="h-8 shrink-0 rounded-lg border border-[rgba(45,95,255,0.22)] bg-[rgba(45,95,255,0.06)] px-3 text-[13px] font-medium text-[#2773ff] disabled:opacity-40"
              >
                提交
              </button>
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}

export function resolveClarifyAnswerLabel(
  options: ClarifyOption[],
  answer: ClarifyAnswerValue | undefined,
  fallbackValue?: string,
  customLabel = "用户自定义"
): string {
  if (answer && typeof answer === "object" && answer.type === "custom") {
    return answer.text || customLabel;
  }
  const value = typeof answer === "string" ? answer : fallbackValue;
  return (
    options.find((option) => option.value === value)?.summary ||
    options.find((option) => option.value === value)?.label ||
    value ||
    customLabel
  );
}
