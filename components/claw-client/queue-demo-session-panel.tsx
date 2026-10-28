"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Check,
  ChevronDown,
  ChevronsUp,
  CornerUpRight,
  PanelRightOpen,
  Pencil,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ComposerWithAgents } from "@/components/my-claw/chat/composer-with-agents";
import { PersonalChatContext, type PersonalChatAttachment } from "@/components/claw-client/personal-chat-context";
import { PersonalConversationSidePanel, type PersonalPanelView } from "@/components/claw-client/personal-conversation-side-panel";
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

function subscribeWideScreen(callback: () => void) {
  const query = window.matchMedia("(min-width: 1440px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getWideScreenSnapshot() {
  return window.matchMedia("(min-width: 1440px)").matches;
}

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
  const isWideScreen = useSyncExternalStore(subscribeWideScreen, getWideScreenSnapshot, () => false);
  const [demo, setDemo] = useState<QueueDemoState>(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [workspacePanelOverride, setWorkspacePanelOverride] = useState<boolean | null>(null);
  const [workspaceView, setWorkspaceView] = useState<PersonalPanelView>("execution");
  const [workspacePanelWidth, setWorkspacePanelWidth] = useState(400);
  const [attachments, setAttachments] = useState<PersonalChatAttachment[]>([]);
  const [dialog, setDialog] = useState<"edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const detail = getPersonalClawDetail();
  const isBusy = Boolean(demo.currentTask) && !demo.paused;
  const workspacePanelOpen = workspacePanelOverride ?? isWideScreen;
  const addAttachments = useCallback((items: PersonalChatAttachment[]) => {
    setAttachments((current) => {
      const ids = new Set(current.map((item) => item.id));
      return [...current, ...items.filter((item) => !ids.has(item.id))];
    });
  }, []);
  const removeAttachment = useCallback((id: string) => {
    setAttachments((current) => current.filter((item) => item.id !== id));
  }, []);
  const clearAttachments = useCallback(() => setAttachments([]), []);
  const personalChatContext = useMemo(() => ({ attachments, addAttachments, removeAttachment, clearAttachments }), [attachments, addAttachments, removeAttachment, clearAttachments]);

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

  function queueMessage(text: string) {
    const item = newQueueItem(text);
    setDemo((current) => ({
      ...current,
      queue: [...current.queue, item],
    }));
    setDraft("");
    toast.success("消息已加入队列");
  }

  function handleSend() {
    const attachmentText = attachments.length > 0
      ? `附件：${attachments.map((attachment) => attachment.name).join("、")}`
      : "";
    const text = [draft.trim(), attachmentText].filter(Boolean).join("\n");
    if (!text) return;
    if (isBusy) {
      queueMessage(text);
      return;
    }
    setDemo((current) => ({
      ...current,
      currentTask: text,
      paused: false,
      interruptedTask: null,
      guidance: [],
    }));
    setDraft("");
    toast.success(demo.paused ? "新消息已开始处理，原队列将在其后执行" : "演示任务已开始");
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
      if (current.interruptedTask) {
        return {
          ...current,
          currentTask: current.interruptedTask,
          paused: false,
          interruptedTask: null,
          guidance: [],
        };
      }
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
    const canResumeInterruptedTask = demo.paused && Boolean(demo.interruptedTask);
    if (!isBusy && !canResumeInterruptedTask) return;
    setDemo((current) => ({
      ...current,
      currentTask: current.currentTask ?? (canResumeInterruptedTask ? current.interruptedTask : null),
      paused: false,
      interruptedTask: canResumeInterruptedTask ? null : current.interruptedTask,
      queue: current.queue.filter((queueItem) => queueItem.id !== item.id),
      guidance: [...current.guidance, item.text],
    }));
    toast.success(canResumeInterruptedTask ? "已加入引导，正在继续当前会话" : "已将这条消息作为引导发送给当前任务");
  }

  function pinToTop(itemId: string) {
    setDemo((current) => {
      const queue = [...current.queue];
      const index = queue.findIndex((item) => item.id === itemId);
      if (index <= 0) return current;
      const [item] = queue.splice(index, 1);
      queue.unshift(item!);
      return { ...current, queue };
    });
    if (demo.queue[0]?.id !== itemId) toast.success("消息已置顶到队首");
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
    <PersonalChatContext.Provider value={personalChatContext}>
    <div className="flex h-full min-h-0 flex-col bg-white">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{session.title}</h1>
        {!workspacePanelOpen ? (
          <button type="button" onClick={() => setWorkspacePanelOverride(true)} aria-label="打开会话侧栏" title="打开会话侧栏" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
            <PanelRightOpen className="h-4 w-4" />
          </button>
        ) : null}
      </header>
      <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]">
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
          {demo.queue.length > 0 ? (
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
                <ol className="divide-y divide-slate-200/70 px-2 pb-2">
                  {demo.queue.map((item, index) => (
                    <li key={item.id} className="group flex min-h-11 items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-white/70">
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{item.text}</span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button type="button" disabled={!isBusy && !(demo.paused && demo.interruptedTask)} onClick={() => guideWith(item)} title={demo.paused && demo.interruptedTask ? "引导并继续当前会话" : isBusy ? "引导当前响应" : "当前没有可继续的会话"} aria-label={`引导当前会话：${item.text}`} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-slate-500 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40">
                          <CornerUpRight className="h-3.5 w-3.5" />引导
                        </button>
                        <button type="button" disabled={index === 0} onClick={() => pinToTop(item.id)} title={index === 0 ? "已在队首" : "置顶"} aria-label={`置顶：${item.text}`} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
                          <ChevronsUp className="h-3.5 w-3.5" />
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
              ) : null}
            </section>
          ) : null}
          <ComposerWithAgents
            detail={detail}
            value={draft}
            onChange={setDraft}
            onSend={handleSend}
            modelScopeKey="queue-demo"
            personalMode
            onOpenWorkspace={() => { setWorkspaceView("workspace"); setWorkspacePanelOverride(true); }}
            isBusy={isBusy}
            onInterrupt={interruptCurrentTask}
          />
        </div>
      </div>
      </div>
      <PersonalConversationSidePanel
        open={workspacePanelOpen}
        personalMode
        view={workspaceView}
        panelWidth={workspacePanelWidth}
        onPanelWidthChange={setWorkspacePanelWidth}
        onViewChange={(view) => { setWorkspaceView(view); setWorkspacePanelOverride(true); }}
        onClose={() => setWorkspacePanelOverride(false)}
        tasks={[]}
        outputs={[]}
        conversationTitle={session.title}
      />
      </div>

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
    </PersonalChatContext.Provider>
  );
}
