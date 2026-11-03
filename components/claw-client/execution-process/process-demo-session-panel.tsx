"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Paperclip, RotateCcw } from "lucide-react";
import { ComposerWithAgents } from "@/components/my-claw/chat/composer-with-agents";
import { PersonalChatContext, type PersonalChatContextValue } from "@/components/claw-client/personal-chat-context";
import { getPersonalClawDetail } from "@/lib/mock/my-claw/personal-claw";
import type { MyClawSessionListItem } from "@/lib/mock/my-claw/types";
import { cn } from "@/lib/utils";
import { ExecutionTurn } from "./execution-turn";
import { PROCESS_DEMOS, type DemoTurn, type ProcessDemo } from "./demo-scripts";
import type { RawItem, TurnState } from "./model";

interface Frame {
  turn: number;
  /** 本轮已出现的条目数。 */
  count: number;
  runningId: string | null;
  state: TurnState;
  at: number;
  note: string;
}

const RUNNABLE = new Set<RawItem["kind"]>(["thinking", "event", "delivery"]);

function buildFrames(demo: ProcessDemo): Frame[] {
  const frames: Frame[] = [];
  demo.turns.forEach((turn, turnIndex) => {
    turn.entries.forEach((entry, index) => {
      // 最终答复随结束帧一起出现。
      if (entry.silent || entry.item.kind === "answer") return;
      const item = entry.item;
      // silent 条目随前一个可见步骤一起出现。
      let count = index + 1;
      while (count < turn.entries.length && turn.entries[count].silent) count += 1;
      frames.push({
        turn: turnIndex,
        count,
        runningId: RUNNABLE.has(item.kind) ? item.id : null,
        state: item.kind === "clarify" ? "waiting" : item.kind === "interrupt" ? turn.end.state : "running",
        at: "at" in item && item.at !== undefined ? item.at : 0,
        note: entry.note ?? defaultNote(item),
      });
    });
    frames.push({ turn: turnIndex, count: turn.entries.length, runningId: null, state: turn.end.state, at: turn.end.at, note: turn.end.note });
  });
  // 中断条目本身就是结束态，去掉重复的结束帧。
  return frames.filter((frame, index) => {
    const prev = frames[index - 1];
    return !(prev && prev.turn === frame.turn && prev.count === frame.count && prev.state === frame.state);
  });
}

function defaultNote(item: RawItem) {
  switch (item.kind) {
    case "thinking":
      return "模型在思考：显示“正在思考”，状态行写“正在执行”";
    case "narration":
      return "Narration 原样显示，并在这里切一刀";
    case "event":
      return `运行中：状态行写“正在执行”，Segment Header 写“${item.runningName}”`;
    case "answer":
      return "最终答复放在 Delivery";
    default:
      return "";
  }
}

function itemsFor(turn: DemoTurn, count: number, answers: Record<string, string>): RawItem[] {
  return turn.entries.slice(0, count).map(({ item }) => {
    if (item.kind === "clarify" && answers[item.id]) return { ...item, answer: answers[item.id] };
    return item;
  });
}

function UserBubble({ turn }: { turn: DemoTurn }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        {turn.attachments?.length ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {turn.attachments.map((name) => (
              <span key={name} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                <Paperclip className="h-3.5 w-3.5" />
                {name}
              </span>
            ))}
          </div>
        ) : null}
        <p className="text-[15px] leading-6 text-slate-700">{turn.user}</p>
      </div>
    </div>
  );
}

export function ProcessDemoSessionPanel({ session }: { session: MyClawSessionListItem }) {
  const demo = useMemo(() => PROCESS_DEMOS.find((item) => item.id === session.id) ?? PROCESS_DEMOS[0], [session.id]);
  const frames = useMemo(() => buildFrames(demo), [demo]);
  const [cursor, setCursor] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const frame = frames[cursor];

  const chatContext = useMemo<PersonalChatContextValue>(
    () => ({
      attachments: [],
      addAttachments: () => undefined,
      removeAttachment: () => undefined,
      clearAttachments: () => undefined,
      incomingDraft: "",
      consumeIncomingDraft: () => "",
    }),
    [],
  );

  const go = useCallback(
    (next: number) => {
      const target = Math.max(0, Math.min(frames.length - 1, next));
      const current = frames[cursor];
      // 停在澄清卡片上点“下一步”：等同于用户选了第一个选项并确认。
      if (target > cursor && current.state === "waiting") {
        const clarify = demo.turns[current.turn].entries
          .slice(0, current.count)
          .map((entry) => entry.item)
          .find((item): item is Extract<RawItem, { kind: "clarify" }> => item.kind === "clarify" && !answers[item.id]);
        if (clarify) setAnswers((value) => ({ ...value, [clarify.id]: clarify.options[0].value }));
      }
      if (target < cursor) {
        // 回退时撤销回退点之后的回答。
        const keep = new Set(
          demo.turns
            .flatMap((turn, turnIndex) =>
              turn.entries.slice(0, turnIndex < frames[target].turn ? turn.entries.length : turnIndex === frames[target].turn ? frames[target].count : 0),
            )
            .map((entry) => entry.item.id),
        );
        setAnswers((value) => Object.fromEntries(Object.entries(value).filter(([key]) => keep.has(key) && frames[target].state !== "waiting")));
      }
      setPausedAt(null);
      setCursor(target);
    },
    [answers, cursor, demo.turns, frames],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowRight") go(cursor + 1);
      if (event.key === "ArrowLeft") go(cursor - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cursor, go]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [cursor]);

  return (
    <PersonalChatContext.Provider value={chatContext}>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{session.title}</h1>
        </header>
        <div className="flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-6 lg:px-10">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
              {demo.turns.slice(0, frame.turn + 1).map((turn, turnIndex) => {
                const isCurrent = turnIndex === frame.turn;
                const last = turn.entries[turn.entries.length - 1]?.item;
                return (
                  <div key={turnIndex} className="flex flex-col gap-4">
                    <UserBubble turn={turn} />
                    <ExecutionTurn
                      key={`${turnIndex}-${isCurrent ? "live" : "done"}`}
                      items={itemsFor(turn, isCurrent ? frame.count : turn.entries.length, answers)}
                      runningId={isCurrent ? frame.runningId : null}
                      state={isCurrent ? frame.state : turn.end.state}
                      elapsed={isCurrent ? (pausedAt ?? frame.at) : turn.end.at}
                      ticking={isCurrent && pausedAt === null}
                      onClarifyInteract={() => setPausedAt(frame.at)}
                      onClarifyAnswer={(value) => {
                        const clarify = turn.entries.map((entry) => entry.item).find((item) => item.kind === "clarify" && !answers[item.id]);
                        if (clarify) setAnswers((current) => ({ ...current, [clarify.id]: value }));
                        setPausedAt(null);
                        setCursor((current) => Math.min(frames.length - 1, current + 1));
                      }}
                      onRetry={last?.kind === "interrupt" ? () => go(0) : undefined}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 px-5 pb-4 lg:px-10">
            <div className="mx-auto w-full max-w-4xl">
              <div className="mb-2 flex items-center gap-3 rounded-lg border border-[#d6e2f5] bg-[#f5f8fe] px-3 py-2 text-[12px] text-slate-600">
                <span className="shrink-0 rounded bg-white px-1.5 py-0.5 font-medium text-[#2773ff]">
                  演示 {cursor + 1}/{frames.length}
                </span>
                <span className="min-w-0 flex-1 leading-5">{frame.note}</span>
                <button type="button" onClick={() => go(0)} className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 hover:bg-white" aria-label="从头开始">
                  <RotateCcw className="h-3.5 w-3.5" />从头
                </button>
                <button type="button" disabled={cursor === 0} onClick={() => go(cursor - 1)} className="inline-flex shrink-0 items-center rounded px-2 py-1 hover:bg-white disabled:opacity-40" aria-label="上一步">
                  <ChevronLeft className="h-3.5 w-3.5" />上一步
                </button>
                <button
                  type="button"
                  disabled={cursor === frames.length - 1}
                  onClick={() => go(cursor + 1)}
                  className={cn("inline-flex shrink-0 items-center rounded bg-[#2773ff] px-2.5 py-1 font-medium text-white hover:bg-[#1f63e0] disabled:opacity-40")}
                  aria-label="下一步"
                >
                  下一步<ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <ComposerWithAgents detail={detail} modelScopeKey={session.id} personalMode value={draft} onChange={setDraft} onSend={() => setDraft("")} />
            </div>
          </div>
        </div>
      </div>
    </PersonalChatContext.Provider>
  );
}
