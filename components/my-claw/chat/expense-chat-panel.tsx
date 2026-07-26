"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, Wrench } from "lucide-react";
import {
  ClarifyPager,
  type ClarifyAnswers,
} from "@/components/claw-hub-next/clarify-pager";
import {
  buildClarifySummaryEntries,
  splitExpenseNodesForClarifyFlow,
  type ExpenseConversationView,
  type ExpenseRenderNode,
} from "@/lib/mock/my-claw/expense-adapter";
import { getPersonalClawDetail } from "@/lib/mock/my-claw/personal-claw";
import { ComposerWithAgents } from "./composer-with-agents";
import { ExpenseNodeView } from "./expense-node-view";

function ExpenseInspector({ view }: { view: Pick<ExpenseConversationView, "inspector"> }) {
  return (
    <aside className="hidden min-h-0 w-[320px] shrink-0 border-l border-slate-200 bg-white lg:block">
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex h-12 shrink-0 items-center border-b border-slate-200 px-4">
          <span className="text-sm font-semibold text-slate-800">任务详情</span>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <section className="border-b border-slate-200 pb-5">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">任务进程</h3>
              <span className="text-xs text-slate-400">
                {view.inspector.completedTaskCount}/{view.inspector.tasks.length}
              </span>
            </header>
            <div className="space-y-1">
              {view.inspector.tasks.map((task) => (
                <div key={task.id} className="rounded-md px-2 py-2">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-slate-700">{task.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{task.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border-b border-slate-200 py-5">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">会话文件</h3>
              <span className="text-xs text-slate-400">
                {view.inspector.files.length} 个
              </span>
            </header>
            {view.inspector.files.length > 0 ? (
              <div className="space-y-1">
                {view.inspector.files.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-start gap-2.5 rounded-md px-2 py-2 hover:bg-slate-50"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-slate-700">{file.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {file.size} · {file.path}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-2 text-xs text-slate-400">暂无会话文件</p>
            )}
          </section>

          <section className="pt-5">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">工具调用</h3>
              <span className="text-xs text-slate-400">
                {view.inspector.tools.length} 次
              </span>
            </header>
            <div className="space-y-1">
              {view.inspector.tools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-start gap-2.5 rounded-md px-2 py-2"
                >
                  <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-slate-700">{tool.headline}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {tool.name}
                      {tool.category ? ` · ${tool.category}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
}

export function ExpenseChatPanel() {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const flow = useMemo(() => splitExpenseNodesForClarifyFlow(), []);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState<"clarify" | "running">("clarify");
  const [answers, setAnswers] = useState<ClarifyAnswers | null>(null);
  /** How many post-clarify timeline nodes are revealed (summary + suffix). */
  const [runCursor, setRunCursor] = useState(0);

  const summaryNode: ExpenseRenderNode | null = useMemo(() => {
    if (!answers) return null;
    return {
      key: "clarify-summary-live",
      type: "clarify_summary",
      entries: buildClarifySummaryEntries(answers),
    };
  }, [answers]);

  const runNodes = useMemo(() => {
    if (!summaryNode) return [];
    return [summaryNode, ...flow.suffix];
  }, [summaryNode, flow.suffix]);

  const visibleNodes = useMemo(() => {
    if (phase === "clarify") return flow.prefix;
    return [...flow.prefix, ...runNodes.slice(0, Math.max(runCursor, 0))];
  }, [flow.prefix, phase, runNodes, runCursor]);

  useEffect(() => {
    if (phase !== "running") return;
    const revealed = runNodes.slice(0, Math.max(runCursor, 0));
    const actionKeys = revealed
      .filter(
        (node) =>
          node.type === "action" ||
          node.type === "plan" ||
          node.type === "todo" ||
          node.type === "destructive"
      )
      .map((node) => node.key);
    const lastKey = actionKeys[actionKeys.length - 1];
    if (!lastKey) return;
    setExpanded({ [lastKey]: true });
  }, [phase, runCursor, runNodes]);

  useEffect(() => {
    if (phase !== "running") return;

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (event.key === "ArrowRight") {
        setRunCursor((current) => Math.min(current + 1, runNodes.length));
      }
      if (event.key === "ArrowLeft") {
        setRunCursor((current) => Math.max(current - 1, 1));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, runNodes.length]);

  function handleClarifyComplete(nextAnswers: ClarifyAnswers) {
    setAnswers(nextAnswers);
    setPhase("running");
    // Reveal summary first; further nodes advance by click / →
    setRunCursor(1);
  }

  function advanceRun() {
    if (phase !== "running") return;
    setRunCursor((current) => Math.min(current + 1, runNodes.length));
  }

  return (
    <div className="flex h-full min-h-0">
      <div
        className="flex min-w-0 flex-1 cursor-pointer flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]"
        onClick={() => advanceRun()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-4xl space-y-4">
            {visibleNodes.map((node) => (
              <ExpenseNodeView
                key={node.key}
                node={node}
                expanded={Boolean(expanded[node.key])}
                onToggle={() =>
                  setExpanded((current) => ({
                    ...current,
                    [node.key]: !current[node.key],
                  }))
                }
              />
            ))}

            {phase === "clarify" ? (
              <div onClick={(event) => event.stopPropagation()}>
                <ClarifyPager
                  questions={flow.clarifyQuestions}
                  onComplete={handleClarifyComplete}
                />
              </div>
            ) : null}
          </div>
        </div>
        <div
          className="shrink-0 px-4 py-4 lg:px-8 lg:py-5"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto w-full max-w-4xl">
            <ComposerWithAgents
              detail={detail}
              value={draft}
              onChange={setDraft}
              onSend={() => {
                setDraft("");
                advanceRun();
              }}
            />
          </div>
        </div>
      </div>
      <ExpenseInspector view={{ inspector: flow.inspector }} />
    </div>
  );
}
