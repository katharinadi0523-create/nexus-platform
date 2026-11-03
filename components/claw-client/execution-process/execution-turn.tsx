"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppWindow,
  Bookmark,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  FilePen,
  FilePlus2,
  FileText,
  FileUp,
  Folder,
  Globe,
  History,
  Loader2,
  Paperclip,
  Pickaxe,
  Search,
  Sparkle,
  SquareTerminal,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  formatClock,
  formatDuration,
  projectTurn,
  type EventCategory,
  type EventDetail,
  type ProcessBlock,
  type ProjectedEvent,
  type RawItem,
  type ThinkingBlock,
  type TurnState,
} from "./model";

/** 运行中计时：从 base 开始逐秒走，ticking=false 时停住。 */
export function useLiveSeconds(base: number, ticking: boolean) {
  const [state, setState] = useState({ base, extra: 0 });
  const extra = state.base === base ? state.extra : 0;
  useEffect(() => {
    if (!ticking) return;
    const timer = window.setInterval(() => {
      setState((current) => (current.base === base ? { base, extra: current.extra + 1 } : { base, extra: 1 }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [base, ticking]);
  return base + extra;
}

function StatusIcon({ ok, running, className }: { ok: boolean; running?: boolean; className?: string }) {
  if (running) return <Loader2 className={cn("h-3.5 w-3.5 shrink-0 animate-spin text-slate-400", className)} />;
  if (!ok) return <X className={cn("h-3.5 w-3.5 shrink-0 text-red-500", className)} />;
  return <Check className={cn("h-3.5 w-3.5 shrink-0 text-slate-400", className)} />;
}

/** 技能单独一种图标：镐子 + 左下角小星光。 */
function SkillIcon({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex", className)} aria-hidden>
      <Pickaxe className="h-full w-full" />
      <Sparkle className="absolute -bottom-0.5 -left-0.5 h-[7px] w-[7px] fill-current" />
    </span>
  );
}

/** 每类 Event 的小图标。 */
const CATEGORY_ICON: Record<EventCategory, LucideIcon | typeof SkillIcon> = {
  skill: SkillIcon,
  read: FileText,
  list: Folder,
  run: SquareTerminal,
  write: FilePlus2,
  edit: FilePen,
  search: Search,
  web: Globe,
  browser: AppWindow,
  memory: Bookmark,
  history: History,
  deliver: FileUp,
  other: Wrench,
};

function DetailView({ detail, tool }: { detail?: EventDetail; tool: string }) {
  if (!detail) {
    return <p className="text-xs text-slate-400">没有输出</p>;
  }
  if (detail.type === "command") {
    return (
      <div className="overflow-hidden rounded-md border border-slate-200 bg-[#fafbfc] font-mono text-[12px] leading-5">
        <div className="border-b border-slate-200 px-3 py-2 text-slate-700">
          <span className="select-none text-slate-400">$ </span>
          <span className="whitespace-pre-wrap break-all">{detail.command}</span>
        </div>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all px-3 py-2 text-slate-600">{detail.output || "（没有输出）"}</pre>
        {detail.exitCode !== undefined ? (
          <div className={cn("border-t border-slate-200 px-3 py-1.5 text-[11px]", detail.exitCode === 0 ? "text-slate-400" : "text-red-500")}>
            退出码 {detail.exitCode}
          </div>
        ) : null}
      </div>
    );
  }
  if (detail.type === "file") {
    return (
      <div className="overflow-hidden rounded-md border border-slate-200 bg-[#fafbfc] text-[12px] leading-5">
        <div className="border-b border-slate-200 px-3 py-1.5 font-mono text-slate-500">{detail.path}</div>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all px-3 py-2 font-mono text-slate-600">{detail.content}</pre>
      </div>
    );
  }
  if (detail.type === "search") {
    return (
      <div className="rounded-md border border-slate-200 bg-[#fafbfc] px-3 py-2 text-[12px] leading-5 text-slate-600">
        <p className="text-slate-500">搜索：{detail.query}</p>
        <ul className="mt-1 space-y-0.5">
          {detail.results.map((result) => (
            <li key={result} className="truncate">· {result}</li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-[#fafbfc] text-[12px] leading-5">
      {detail.input ? (
        <pre className="whitespace-pre-wrap break-all border-b border-slate-200 px-3 py-2 font-mono text-slate-500">{detail.input}</pre>
      ) : null}
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all px-3 py-2 font-mono text-slate-600">{detail.output}</pre>
      <span className="sr-only">{tool}</span>
    </div>
  );
}

function EventRow({
  event,
  onPreview,
}: {
  event: ProjectedEvent;
  onPreview: (preview: { file: string; content: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const Icon = CATEGORY_ICON[event.category];
  return (
    <div>
      <div className="flex items-center gap-2 py-[3px]">
        <span className="flex w-4 justify-center">
          {event.running ? <StatusIcon ok running /> : <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
        </span>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="min-w-0 truncate text-left text-[13px] text-slate-500 hover:text-slate-800"
        >
          {event.running ? <span className="text-slate-700">{event.runningName}</span> : event.name}
        </button>
        {!event.running && !event.ok ? <X className="h-3.5 w-3.5 shrink-0 text-red-500" aria-label="失败" /> : null}
        {event.preview ? (
          <button
            type="button"
            disabled={event.running}
            title={event.running ? "写入完成后可预览" : undefined}
            onClick={() => event.preview && onPreview(event.preview)}
            className={cn(
              "shrink-0 rounded px-1.5 text-[12px]",
              event.running ? "cursor-not-allowed text-slate-300" : "text-[#2773ff] hover:bg-[#eef4ff]",
            )}
          >
            预览
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="mb-2 ml-6 mt-1 space-y-2">
          {event.details.map((item, index) => (
            <DetailView key={`${event.key}-${index}`} detail={item.detail} tool={item.tool} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SegmentView({
  block,
  onPreview,
}: {
  block: Extract<ProcessBlock, { type: "segment" }>;
  onPreview: (preview: { file: string; content: string }) => void;
}) {
  // 默认收起，运行中也不自动展开，避免自动收起时内容跳动。
  const [open, setOpen] = useState(false);
  return (
    <div data-segment={block.key}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 py-[3px] text-left"
      >
        <span className="flex w-4 justify-center">
          <StatusIcon ok={block.icon !== "fail"} running={block.icon === "running"} />
        </span>
        <span className={cn("min-w-0 truncate text-[13px]", block.running ? "text-slate-700" : "text-slate-600")}>{block.header}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
      </button>
      {open ? (
        <div>
          {block.rows.map((row) =>
            row.type === "event" ? (
              <EventRow key={row.event.key} event={row.event} onPreview={onPreview} />
            ) : (
              <ThinkingLine key={row.key} block={row} />
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function ThinkingLine({ block }: { block: ThinkingBlock }) {
  const [open, setOpen] = useState(false);
  if (block.running) {
    return (
      <div className="flex items-center gap-2 py-[3px] text-[13px] text-slate-500">
        <span className="flex w-4 justify-center"><Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /></span>
        正在思考
      </div>
    );
  }
  return (
    <div>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 py-[3px] text-left text-[13px] text-slate-500 hover:text-slate-800">
        <span className="flex w-4 justify-center"><Brain className="h-3.5 w-3.5 text-slate-400" aria-hidden /></span>
        思考 {block.seconds} 秒
        {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>
      {open ? (
        <p className="mb-2 ml-6 mt-1 whitespace-pre-line border-l-2 border-slate-200 pl-3 text-[12.5px] leading-6 text-slate-500">{block.text}</p>
      ) : null}
    </div>
  );
}

function ClarifyCard({
  item,
  waiting,
  onInteract,
  onAnswer,
}: {
  item: Extract<RawItem, { kind: "clarify" }>;
  waiting: boolean;
  onInteract?: () => void;
  onAnswer?: (value: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = item.options.find((option) => option.value === item.answer);
  if (answered) {
    return (
      <div className="my-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-[13px]">
        <p className="text-slate-700">{item.question}</p>
        <p className="mt-1 text-slate-500">你选择了：{answered.label}</p>
      </div>
    );
  }
  return (
    <div className="my-1 rounded-[12px] border border-[#c9daf8] bg-[#eef4ff] px-4 py-3.5">
      <p className="text-sm font-semibold text-[#1e3a6e]">{item.question}</p>
      <div className="mt-3 grid gap-2">
        {item.options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={!waiting}
            onClick={() => {
              if (selected === null) onInteract?.();
              setSelected(option.value);
            }}
            className={cn(
              "flex min-h-[38px] items-center rounded-[8px] border px-3 text-left text-[13px] font-medium text-[#1e3a6e]",
              selected === option.value ? "border-[#2773ff]/40 bg-[#2773ff]/10" : "border-[#c9daf8] bg-white hover:border-[#9dbbf2]",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          disabled={!waiting || selected === null}
          onClick={() => selected && onAnswer?.(selected)}
          className="rounded-md bg-[#2773ff] px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-40"
        >
          确认
        </button>
      </div>
    </div>
  );
}

function FullLogDialog({ items, open, onOpenChange }: { items: RawItem[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="text-base">完整记录</DialogTitle>
        </DialogHeader>
        <ol className="space-y-2 text-[12px] leading-5">
          {items.map((item, index) => (
            <li key={item.id} className="rounded-md border border-slate-200 px-3 py-2">
              <div className="flex gap-2 text-slate-500">
                <span className="w-6 shrink-0 text-right text-slate-300">{index + 1}</span>
                <span className="font-mono text-slate-700">{logTitle(item)}</span>
              </div>
              {logBody(item)}
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

function logTitle(item: RawItem) {
  switch (item.kind) {
    case "thinking":
      return `thinking · ${item.seconds}s`;
    case "narration":
      return "assistant_message";
    case "event":
    case "merged":
    case "hidden":
    case "delivery":
      return item.tool;
    case "clarify":
      return "AskForClarification";
    case "card":
      return item.tool ?? "card";
    case "answer":
      return "final_answer";
    case "interrupt":
      return "error";
  }
}

function logBody(item: RawItem) {
  const pre = (text: string) => (
    <pre className="ml-8 mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-slate-500">{text}</pre>
  );
  if (item.kind === "thinking") return pre(item.text);
  if (item.kind === "narration" || item.kind === "answer") return pre(item.text);
  if (item.kind === "interrupt") return pre(item.message);
  if (item.kind === "clarify") return pre(`${item.question}\n${item.options.map((o) => `- ${o.label}`).join("\n")}`);
  if (item.kind === "event" || item.kind === "merged" || item.kind === "hidden" || item.kind === "delivery") {
    const detail = item.detail;
    if (!detail) return null;
    if (detail.type === "command") return pre(`Request: ${detail.command}\nResponse: ${detail.output}${detail.exitCode !== undefined ? `\nexit_code: ${detail.exitCode}` : ""}`);
    if (detail.type === "file") return pre(`Request: ${detail.path}\nResponse: ${detail.content}`);
    if (detail.type === "search") return pre(`Request: ${detail.query}\nResponse: ${detail.results.join("\n")}`);
    return pre(`${detail.input ? `Request: ${detail.input}\n` : ""}Response: ${detail.output}`);
  }
  return null;
}

export interface ExecutionTurnProps {
  items: RawItem[];
  runningId: string | null;
  state: TurnState;
  /** 已用秒数（运行中会继续走）。 */
  elapsed: number;
  /** 计时是否在走；澄清卡片被用户交互后停住。 */
  ticking?: boolean;
  onClarifyInteract?: () => void;
  onClarifyAnswer?: (value: string) => void;
  onRetry?: () => void;
}

export function ExecutionTurn({ items, runningId, state, elapsed, ticking = false, onClarifyInteract, onClarifyAnswer, onRetry }: ExecutionTurnProps) {
  const projected = useMemo(() => projectTurn(items, runningId), [items, runningId]);
  const live = state === "running" || state === "waiting";
  const seconds = useLiveSeconds(elapsed, live && ticking);
  // 只有“已完成”整体收成状态行；运行中、中断、停止都保持展开。
  const openByDefault = state !== "done";
  const [expandState, setExpandState] = useState<{ when: boolean; open: boolean }>({ when: openByDefault, open: openByDefault });
  const expanded = expandState.when === openByDefault ? expandState.open : openByDefault;
  const [logOpen, setLogOpen] = useState(false);
  const [preview, setPreview] = useState<{ file: string; content: string } | null>(null);


  let statusText: string;
  if (state === "running") statusText = `正在执行 · ${formatClock(seconds)}`;
  else if (state === "waiting") statusText = `等待你确认 · ${formatClock(seconds)}`;
  else if (state === "done") statusText = `已完成 · ${formatDuration(seconds)}`;
  else if (state === "interrupted") statusText = `已中断 · ${formatDuration(seconds)}`;
  else statusText = `已停止 · ${formatDuration(seconds)}`;

  return (
    <div className="space-y-3 px-1">
      <div>
        <button
          type="button"
          data-status-line
          onClick={() => setExpandState({ when: openByDefault, open: !expanded })}
          className="flex items-center gap-2 py-[3px] text-left text-[13px] text-slate-500 hover:text-slate-800"
        >
          <span className="flex w-4 justify-center">
            {live ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /> : null}
            {state === "interrupted" ? <X className="h-3.5 w-3.5 text-red-500" /> : null}
          </span>
          <span className={cn(live && "text-slate-700")}>{statusText}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
        </button>

        {expanded ? (
          <div className="mt-1 space-y-1">
            {projected.blocks.map((block) => {
              if (block.type === "thinking") return <ThinkingLine key={block.key} block={block} />;
              if (block.type === "narration") {
                return (
                  <p key={block.key} className="py-1.5 text-sm leading-6 whitespace-pre-line text-slate-800">
                    {block.text}
                  </p>
                );
              }
              if (block.type === "segment") {
                return (
                  <SegmentView
                    key={block.key}
                    block={block}
                    onPreview={setPreview}
                  />
                );
              }
              if (block.type === "clarify") {
                return (
                  <ClarifyCard
                    key={block.key}
                    item={block.item}
                    waiting={state === "waiting"}
                    onInteract={onClarifyInteract}
                    onAnswer={onClarifyAnswer}
                  />
                );
              }
              return <div key={block.key}>{block.item.render()}</div>;
            })}
            {!live ? (
              <button type="button" onClick={() => setLogOpen(true)} className="flex items-center gap-2 pt-1 text-[12px] text-slate-400 hover:text-[#2773ff]">
                <span className="w-4" />
                查看完整记录
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {projected.interrupt ? (
        <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/60 px-4 py-2.5 text-[13px] text-red-600">
          <span>{projected.interrupt}</span>
          {onRetry ? (
            <button type="button" onClick={onRetry} className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-[12px] text-red-600 hover:bg-red-50">
              重试
            </button>
          ) : null}
        </div>
      ) : null}

      {projected.answer ? <p className="text-sm leading-6 whitespace-pre-line text-slate-800">{projected.answer}</p> : null}
      {projected.deliveries.length ? (
        <div className="flex flex-wrap gap-2">
          {projected.deliveries.map((card) =>
            card.type === "file" ? (
              <span key={card.title} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <Paperclip className="h-3.5 w-3.5" />
                <span>{card.title}</span>
                {card.meta ? <span className="text-slate-400">{card.meta}</span> : null}
              </span>
            ) : (
              <span key={card.title} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <Check className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">{card.title}</span>
                {card.meta ? <span className="text-slate-400">{card.meta}</span> : null}
              </span>
            ),
          )}
        </div>
      ) : null}

      <FullLogDialog items={items} open={logOpen} onOpenChange={setLogOpen} />
      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-slate-500" />
              {preview?.file}
            </DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap break-all rounded-md bg-[#fafbfc] p-3 font-mono text-[12px] leading-5 text-slate-600">{preview?.content}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
