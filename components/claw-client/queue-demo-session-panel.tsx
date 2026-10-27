"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  CornerUpRight,
  GripVertical,
  Pencil,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ComposerWithAgents } from "@/components/my-claw/chat/composer-with-agents";
import { getPersonalClawDetail } from "@/lib/mock/my-claw/personal-claw";
import type { MyClawSessionListItem } from "@/lib/mock/my-claw/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type QueueItem = { id: string; text: string };

type QueueDemoState = {
  currentTask: string | null;
  queue: QueueItem[];
  paused: boolean;
  interruptedTask: string | null;
  guidance: string[];
  completed: string[];
};

const STORAGE_KEY = "claw-client:queue-steer-demo:v1";

function createInitialState(): QueueDemoState {
  return {
    currentTask: "输出对我们产品的发展建议",
    queue: [
      { id: "queue-demo-1", text: "分点罗列" },
      { id: "queue-demo-2", text: "做成 HTML 演示" },
    ],
    paused: false,
    interruptedTask: null,
    guidance: [],
    completed: [],
  };
}

function readSavedState(): QueueDemoState {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<QueueDemoState>;
    if (!Array.isArray(parsed.queue) || typeof parsed.paused !== "boolean") {
      return createInitialState();
    }
    return {
      ...createInitialState(),
      ...parsed,
      queue: parsed.queue.filter(
        (item): item is QueueItem => Boolean(item && typeof item.id === "string" && typeof item.text === "string"),
      ),
      guidance: Array.isArray(parsed.guidance) ? parsed.guidance : [],
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
    };
  } catch {
    return createInitialState();
  }
}

function newQueueItem(text: string): QueueItem {
  return { id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text };
}

export function QueueDemoSessionPanel({ session }: { session: MyClawSessionListItem }) {
  const [demo, setDemo] = useState<QueueDemoState>(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [dialog, setDialog] = useState<"send" | "edit" | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const detail = getPersonalClawDetail();
  const isBusy = Boolean(demo.currentTask) && !demo.paused;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDemo(readSavedState());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
  }, [demo, hydrated]);

  function queueMessage(text: string, replaceExisting = false) {
    const item = newQueueItem(text);
    setDemo((current) => ({
      ...current,
      queue: [...(replaceExisting ? [] : current.queue), item],
    }));
    setDraft("");
    toast.success(replaceExisting ? "已清空原队列，新消息已加入" : "消息已加入队列");
  }

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    if (isBusy) {
      if (demo.queue.length > 0) {
        setPendingMessage(text);
        setDialog("send");
      } else {
        queueMessage(text);
      }
      return;
    }
    if (demo.paused) {
      queueMessage(text);
      return;
    }
    setDemo((current) => ({ ...current, currentTask: text, interruptedTask: null, guidance: [] }));
    setDraft("");
    toast.success("演示任务已开始");
  }

  function completeCurrentTask() {
    setDemo((current) => {
      if (!current.currentTask) return current;
      const [next, ...remaining] = current.queue;
      return {
        ...current,
        currentTask: next?.text ?? null,
        queue: remaining,
        interruptedTask: null,
        guidance: [],
        completed: [...current.completed, current.currentTask],
      };
    });
  }

  function interruptCurrentTask() {
    setDemo((current) => ({
      ...current,
      currentTask: null,
      paused: current.queue.length > 0,
      interruptedTask: current.currentTask,
      guidance: [],
    }));
    toast("当前响应已中断；待处理消息已暂停");
  }

  function resumeQueue() {
    setDemo((current) => {
      const [next, ...remaining] = current.queue;
      return {
        ...current,
        currentTask: next?.text ?? null,
        queue: remaining,
        paused: false,
        interruptedTask: null,
        guidance: [],
      };
    });
  }

  function guideWith(item: QueueItem) {
    if (!isBusy) return;
    setDemo((current) => ({
      ...current,
      queue: current.queue.filter((queueItem) => queueItem.id !== item.id),
      guidance: [...current.guidance, item.text],
    }));
    toast.success("已将这条消息作为引导发送给当前任务");
  }

  function moveItem(index: number, offset: -1 | 1) {
    setDemo((current) => {
      const nextIndex = index + offset;
      if (nextIndex < 0 || nextIndex >= current.queue.length) return current;
      const queue = [...current.queue];
      [queue[index], queue[nextIndex]] = [queue[nextIndex]!, queue[index]!];
      return { ...current, queue };
    });
  }

  function dropItem(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    setDemo((current) => {
      const queue = [...current.queue];
      const sourceIndex = queue.findIndex((item) => item.id === draggedId);
      const targetIndex = queue.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const [item] = queue.splice(sourceIndex, 1);
      queue.splice(targetIndex, 0, item!);
      return { ...current, queue };
    });
    setDraggedId(null);
  }

  function openEdit(item: QueueItem) {
    setEditingId(item.id);
    setEditingText(item.text);
    setDialog("edit");
  }

  function saveEdit() {
    const text = editingText.trim();
    if (!text || !editingId) return;
    setDemo((current) => ({
      ...current,
      queue: current.queue.map((item) => item.id === editingId ? { ...item, text } : item),
    }));
    setDialog(null);
    toast.success("队列消息已更新");
  }

  function resetDemo() {
    const initial = createInitialState();
    setDemo(initial);
    setDraft("");
    setDialog(null);
    window.sessionStorage.removeItem(STORAGE_KEY);
    toast.success("演示已重置");
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
            <span>{session.title} · 本地交互演示，不会调用模型</span>
            <button type="button" onClick={resetDemo} className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-100" aria-label="重置演示">
              <RotateCcw className="h-3.5 w-3.5" />重置
            </button>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[#edf2ff] px-4 py-3 text-sm leading-6 text-slate-800">
              输出对我们产品的发展建议
            </div>
          </div>

          <section className="rounded-xl border border-slate-100 bg-white px-4 py-4">
            {demo.currentTask ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Sparkles className="h-4 w-4 text-[#596bff]" />
                    <span>正在处理</span>
                    <span className="max-w-[520px] truncate font-medium text-slate-800">{demo.currentTask}</span>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={completeCurrentTask} className="h-8 rounded-lg border-slate-200 text-xs">
                    模拟完成当前响应
                  </Button>
                </div>
                {demo.guidance.length > 0 ? (
                  <div className="mt-3 space-y-1.5 border-l-2 border-blue-300 pl-3">
                    {demo.guidance.map((text, index) => (
                      <p key={`${index}-${text}`} className="text-xs leading-5 text-blue-700">引导：{text}</p>
                    ))}
                  </div>
                ) : null}
              </>
            ) : demo.paused ? (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                <span>当前响应已中断，队列已暂停</span>
                <Button type="button" size="sm" onClick={resumeQueue} className="h-8 rounded-lg bg-[#315cf5] text-xs hover:bg-[#244cdb]">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />继续队列
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {demo.interruptedTask ? "当前响应已中断。" : "当前没有正在处理的响应。"}
                {demo.completed.length > 0 ? ` 已完成 ${demo.completed.length} 项演示任务。` : ""}
              </p>
            )}
          </section>

        </div>
      </div>

      <div className="shrink-0 px-4 pb-5 pt-0 lg:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col">
          <section className="overflow-hidden rounded-t-2xl border border-b-0 border-[#cfd8eb] bg-[#f5f7fc]">
            <div className="flex min-h-11 items-center justify-between gap-3 px-4">
              <button type="button" onClick={() => setExpanded((value) => !value)} className="flex items-center gap-2 text-sm font-semibold text-slate-800" aria-expanded={expanded}>
                <ChevronDown className={cn("h-4 w-4 transition-transform", !expanded && "-rotate-90")} />
                {demo.paused ? "队列已暂停" : "队列中任务"}
                <span className="font-medium text-slate-500">{demo.queue.length}</span>
              </button>
              {demo.paused ? (
                <button type="button" onClick={resumeQueue} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-[#315cf5] hover:bg-blue-50">继续</button>
              ) : null}
            </div>

            {expanded ? (
              demo.queue.length > 0 ? (
                <ol className="divide-y divide-slate-200/70 px-2 pb-2">
                  {demo.queue.map((item, index) => (
                    <li
                      key={item.id}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => dropItem(item.id)}
                      className={cn("group flex min-h-11 items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-white/70", draggedId === item.id && "opacity-50")}
                    >
                      <button
                        type="button"
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", item.id);
                          setDraggedId(item.id);
                        }}
                        onDragEnd={() => setDraggedId(null)}
                        aria-label={`拖动排序：${item.text}`}
                        title="拖动排序"
                        className="flex h-7 w-5 shrink-0 cursor-grab items-center justify-center text-slate-400 active:cursor-grabbing"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{item.text}</span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button type="button" disabled={!isBusy} onClick={() => guideWith(item)} title={isBusy ? "引导当前响应" : "当前没有正在运行的响应"} aria-label={`引导当前响应：${item.text}`} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-slate-500 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40">
                          <CornerUpRight className="h-3.5 w-3.5" />引导
                        </button>
                        <button type="button" disabled={index === 0} onClick={() => moveItem(index, -1)} title="上移" aria-label={`上移：${item.text}`} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-slate-700 disabled:invisible">
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button type="button" disabled={index === demo.queue.length - 1} onClick={() => moveItem(index, 1)} title="下移" aria-label={`下移：${item.text}`} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-slate-700 disabled:invisible">
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => openEdit(item)} title="编辑" aria-label={`编辑：${item.text}`} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-slate-800">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => {
                          setDemo((current) => {
                            const queue = current.queue.filter((queueItem) => queueItem.id !== item.id);
                            return { ...current, queue, paused: queue.length > 0 && current.paused };
                          });
                          toast.success("已从队列移除");
                        }} title="删除" aria-label={`删除：${item.text}`} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="px-5 pb-4 text-xs text-slate-500">暂无排队任务。当前响应结束后，排队消息会按顺序执行。</p>
              )
            ) : null}
          </section>
          <ComposerWithAgents
            detail={detail}
            value={draft}
            onChange={setDraft}
            onSend={handleSend}
            modelScopeKey="queue-demo"
            isBusy={isBusy}
            onInterrupt={interruptCurrentTask}
            queueHint={isBusy ? "当前响应进行中 · 发送消息会加入队列" : demo.paused ? "队列已暂停 · 新消息会加入队列" : "发送后开始新的演示响应"}
          />
        </div>
      </div>

      <Dialog open={dialog === "send"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="gap-0 rounded-2xl border-slate-200 p-0 sm:max-w-[440px]">
          <DialogHeader className="px-6 pb-2 pt-5">
            <DialogTitle className="text-base">发送消息？</DialogTitle>
            <DialogDescription className="leading-6">
              队列中已有 {demo.queue.length} 条待处理消息。你可以清空原队列后加入这条消息，也可以保留原队列并将它排到末尾。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => { queueMessage(pendingMessage, true); setPendingMessage(""); setDialog(null); }} className="rounded-full border-blue-200 text-blue-700 hover:bg-blue-50">
              清空队列并加入
            </Button>
            <Button type="button" onClick={() => { queueMessage(pendingMessage); setPendingMessage(""); setDialog(null); }} className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
              保留队列并追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "edit"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="gap-0 rounded-2xl border-slate-200 p-0 sm:max-w-[480px]">
          <DialogHeader className="px-6 pb-2 pt-5">
            <DialogTitle className="text-base">编辑排队消息</DialogTitle>
            <DialogDescription>修改后仍保留在原来的队列位置。</DialogDescription>
          </DialogHeader>
          <div className="px-6 py-3">
            <Textarea autoFocus value={editingText} onChange={(event) => setEditingText(event.target.value)} className="min-h-28 resize-y rounded-xl border-slate-200" />
          </div>
          <DialogFooter className="gap-2 px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setDialog(null)} className="rounded-full">取消</Button>
            <Button type="button" onClick={saveEdit} disabled={!editingText.trim()} className="rounded-full bg-[#315cf5] hover:bg-[#244cdb]">
              <Check className="mr-1 h-4 w-4" />保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
