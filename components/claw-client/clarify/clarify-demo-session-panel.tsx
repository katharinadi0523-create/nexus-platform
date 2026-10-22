"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  ClawAgentAction,
  ClawAgentOutput,
  ClawAgentThinking,
  ClawUserMessage,
} from "@/components/claw-hub-next/conversation-timeline";
import type { ConversationMessageWithAudit } from "@/components/claw-hub-next/detail/utils";
import { ComposerWithAgents } from "@/components/my-claw/chat/composer-with-agents";
import { formatClarifyAnswer } from "@/lib/claw-clarify";
import {
  buildClarifyDemoSteps,
  getClarifyDemoScenario,
  type ClarifyDemoStep,
} from "@/lib/mock/my-claw/clarify-demo";
import { getPersonalClawDetail } from "@/lib/mock/my-claw/personal-claw";
import type { MyClawSessionListItem } from "@/lib/mock/my-claw/types";
import { ClarifyQuestionPanel } from "./clarify-question-panel";
import { useClarifyRuntime } from "./clarify-runtime";

function message(
  id: string,
  role: "user" | "assistant",
  content: string,
  attachments?: string[],
): ConversationMessageWithAudit {
  return {
    id,
    role,
    sender: role === "user" ? "我" : "Claw",
    time: "",
    content,
    attachments,
    auditRecords: [],
  };
}

const STEP_INTERVAL_MS = 900;

/**
 * 澄清收口后的执行过程：普通文字消息与执行步骤逐条出现；
 * 最后一个已出现的执行步骤在后续步骤出现前显示为执行中。
 */
function ClarifyDemoSteps({ steps }: { steps: ClarifyDemoStep[] }) {
  const [revealed, setRevealed] = useState(1);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (revealed >= steps.length) return;
    const timer = window.setTimeout(() => setRevealed((value) => value + 1), STEP_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [revealed, steps.length]);

  return (
    <>
      {steps.slice(0, revealed).map((step, index) => {
        if (step.kind === "text") {
          return (
            <ClawAgentOutput
              key={index}
              item={{
                key: `step-${index}`,
                type: "output",
                message: message(`s${index}`, "assistant", step.content, step.attachments),
              }}
            />
          );
        }
        const running = index === revealed - 1 && revealed < steps.length;
        return (
          <ClawAgentAction
            key={index}
            item={{
              key: `step-${index}`,
              type: "action",
              title: step.title,
              kind: "tool",
              status: running ? "running" : "done",
              logs: step.logs,
              source: "message",
            }}
            expanded={Boolean(expanded[index])}
            onToggle={() => setExpanded((current) => ({ ...current, [index]: !current[index] }))}
          />
        );
      })}
    </>
  );
}

const MODE_TITLE = {
  answered: "已获得回答",
  auto_continued: "未回答",
} as const;

/**
 * 澄清交互示例会话：用户请求 → Claw 发起澄清 → 回答 / 超时自动继续 → 最终回复
 * （说明所作假设，或说明受阻原因）。
 */
export function ClarifyDemoSessionPanel({ session }: { session: MyClawSessionListItem }) {
  const runtime = useClarifyRuntime();
  const scenario = getClarifyDemoScenario(session.id);
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const [draft, setDraft] = useState("");
  const [runId, setRunId] = useState(1);
  const [toolExpanded, setToolExpanded] = useState(true);
  const requestId = `${session.id}#${runId}`;

  const result =
    runtime?.results[session.id]?.requestId === requestId
      ? runtime.results[session.id]
      : undefined;
  const pending =
    runtime?.pendings[session.id]?.requestId === requestId
      ? runtime.pendings[session.id]
      : undefined;
  const projection = pending && runtime ? runtime.project(session.id) : null;

  const register = runtime?.register;
  useEffect(() => {
    if (!register || result) return;
    register(session.id, requestId);
  }, [register, requestId, result, session.id]);

  if (!scenario || !runtime) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        该示例仅在基础使用端可用。
      </div>
    );
  }

  const steps = result ? buildClarifyDemoSteps(scenario, result.answers) : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              {session.title} · 澄清交互示例 ·{" "}
              {scenario.risk === "redline" ? "红线操作参数（对外发送）" : "高影响信息（复盘方向）"}
            </span>
            <button
              type="button"
              onClick={() => {
                runtime.reset(session.id);
                setRunId((value) => value + 1);
                setToolExpanded(true);
              }}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[#2773ff] hover:bg-[#e8f0fb]"
            >
              <RotateCcw className="h-3 w-3" />
              重新演示
            </button>
          </div>

          <ClawUserMessage
            item={{ key: "user", type: "user", message: message("u1", "user", scenario.userMessage) }}
          />
          <ClawAgentThinking
            item={{
              key: "thinking",
              type: "thinking",
              active: false,
              message: message("t1", "assistant", scenario.thinking),
            }}
          />

          <ClawAgentAction
            item={{
              key: "clarify",
              type: "action",
              title: result
                ? `向你确认了 ${scenario.questions.length} 个问题 · ${MODE_TITLE[result.mode]}`
                : `向你确认 ${scenario.questions.length} 个问题 · 等待回答`,
              kind: "user",
              status: result ? "done" : "running",
              logs: [],
              source: "message",
            }}
            expanded={toolExpanded}
            onToggle={() => setToolExpanded((value) => !value)}
          >
            <div className="space-y-2.5">
              {scenario.questions.map((question) => {
                const answerText = result
                  ? formatClarifyAnswer(question, result.answers[question.questionKey])
                  : null;
                return (
                  <div key={question.id} className="text-sm leading-6">
                    <p className="text-slate-700">
                      {question.question}
                    </p>
                    <p className={answerText ? "text-slate-800" : "text-slate-400"}>
                      {result
                        ? answerText
                          ? `→ ${answerText}`
                          : `→ ${MODE_TITLE[result.mode]}`
                        : "→ 等待回答"}
                    </p>
                  </div>
                );
              })}
            </div>
          </ClawAgentAction>

          {steps && result ? <ClarifyDemoSteps key={result.requestId} steps={steps} /> : null}
        </div>
      </div>

      <div className="shrink-0 px-4 py-4 lg:px-8 lg:py-5">
        <div className="mx-auto w-full max-w-4xl space-y-3">
          {pending && projection ? (
            <ClarifyQuestionPanel
              key={requestId}
              questions={scenario.questions}
              secondsLeft={projection.secondsLeft}
              onFirstInteraction={() => runtime.snooze(session.id)}
              onSubmit={(answers) => runtime.resolve(session.id, answers, "answered")}
            />
          ) : null}
          <ComposerWithAgents
            detail={detail}
            value={draft}
            onChange={setDraft}
            onSend={() => setDraft("")}
          />
        </div>
      </div>
    </div>
  );
}
