"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Clock3,
  Folder,
  Loader2,
  MoreHorizontal,
  Pin,
  PinOff,
  Pencil,
  Trash2,
} from "lucide-react";
import { useMyClaw } from "@/components/my-claw/provider";
import {
  getAutomationSidebarTasks,
  type AutomationSidebarRun,
  type AutomationSidebarTask,
  type MyClawSessionListItem,
} from "@/lib/mock/my-claw";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function sortByUpdatedAt(a: MyClawSessionListItem, b: MyClawSessionListItem) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

interface SessionRowProps {
  session: MyClawSessionListItem;
  isActive: boolean;
}

function SessionRow({ session, isActive }: SessionRowProps) {
  const { setActiveSession, pinSession, renameSession, deleteSession } =
    useMyClaw();

  const handleRename = () => {
    const next = window.prompt("重命名会话", session.title);
    if (next === null) return;
    renameSession(session.id, next);
  };

  const handleDelete = () => {
    if (!window.confirm(`确认删除会话「${session.title}」？`)) return;
    deleteSession(session.id);
  };

  return (
    <div
      className={cn(
        "group relative flex items-center rounded-lg transition-colors",
        isActive ? "bg-[#e8f0fb]" : "hover:bg-slate-50",
      )}
    >
      <Link
        href={`/my-claw/chat?sessionId=${encodeURIComponent(session.id)}`}
        onClick={() => setActiveSession(session.id)}
        className="min-w-0 flex-1 px-2.5 py-1.5"
      >
        <div className="flex items-center gap-1.5">
          {session.pinned ? (
            <Pin className="h-3 w-3 shrink-0 text-[#2773ff]" />
          ) : null}
          <span
            className={cn(
              "truncate text-[13px] leading-5",
              isActive ? "font-medium text-slate-900" : "text-slate-700",
            )}
          >
            {session.title}
          </span>
        </div>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="会话操作"
            className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 transition-opacity hover:bg-white hover:text-slate-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2773ff]/40 group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => pinSession(session.id)}>
            {session.pinned ? (
              <>
                <PinOff className="h-3.5 w-3.5" />
                取消置顶
              </>
            ) : (
              <>
                <Pin className="h-3.5 w-3.5" />
                置顶
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRename}>
            <Pencil className="h-3.5 w-3.5" />
            重命名
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface SessionGroupProps {
  title: string;
  sessions: MyClawSessionListItem[];
  activeSessionId: string | null;
}

function SessionGroup({ title, sessions, activeSessionId }: SessionGroupProps) {
  if (sessions.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="mb-1 px-2.5 text-[11px] font-medium tracking-wide text-[#5a6779]">
        {title}
      </div>
      <div className="space-y-0.5">
        {sessions.map((session) => (
          <SessionRow
            key={session.id}
            session={session}
            isActive={activeSessionId === session.id}
          />
        ))}
      </div>
    </div>
  );
}

function RunStatusGlyph({
  status,
}: {
  status: AutomationSidebarRun["status"];
}) {
  if (status === "running") {
    return <Loader2 className="h-3 w-3 animate-spin text-amber-500" />;
  }
  if (status === "error") {
    return <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />;
  }
  if (status === "awaiting") {
    return <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />;
  }
  return <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />;
}

interface AutomationTaskRowProps {
  task: AutomationSidebarTask;
  expanded: boolean;
  activeTaskId: string | null;
  activeRunId: string | null;
  onToggle: (taskId: string) => void;
  onOpenTask: (taskId: string) => void;
  onOpenRun: (taskId: string, runId: string) => void;
}

function AutomationTaskRow({
  task,
  expanded,
  activeTaskId,
  activeRunId,
  onToggle,
  onOpenTask,
  onOpenRun,
}: AutomationTaskRowProps) {
  const isTaskActive = activeTaskId === task.id && !activeRunId;

  return (
    <article className="mb-0.5">
      <button
        type="button"
        onClick={() => {
          onToggle(task.id);
          onOpenTask(task.id);
        }}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors",
          isTaskActive ? "bg-[#e8f0fb]" : "hover:bg-slate-50",
        )}
        title={task.workspaceName}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
        )}
        <Folder className="h-3.5 w-3.5 shrink-0 text-[#2773ff]" />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-[13px] leading-5",
            isTaskActive ? "font-medium text-slate-900" : "text-slate-700",
          )}
        >
          {task.workspaceName}
        </span>
      </button>

      {expanded ? (
        task.runs.length === 0 ? (
          <div className="ml-6 px-2 py-1.5 text-[11px] text-[#5a6779]">
            暂无执行记录
          </div>
        ) : (
          <div className="ml-5 space-y-0.5 border-l border-slate-100 pl-2">
            {task.runs.map((run) => {
              const active = activeTaskId === task.id && activeRunId === run.id;
              return (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => onOpenRun(task.id, run.id)}
                  className={cn(
                    "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors",
                    active ? "bg-[#e8f0fb]" : "hover:bg-slate-50",
                  )}
                  title={run.summary || `${run.title} · ${run.timeLabel}`}
                >
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                    <RunStatusGlyph status={run.status} />
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[12px]",
                      active ? "font-medium text-slate-900" : "text-slate-600",
                    )}
                  >
                    {run.title}
                  </span>
                  <span className="shrink-0 text-[10px] text-[#5a6779]">
                    {run.timeLabel}
                  </span>
                </button>
              );
            })}
          </div>
        )
      ) : null}
    </article>
  );
}

function AutomationTaskGroup({
  activeTaskId,
  activeRunId,
}: {
  activeTaskId: string | null;
  activeRunId: string | null;
}) {
  const router = useRouter();
  const { automationTasks } = useMyClaw();

  const sidebarTasks = useMemo(
    () => getAutomationSidebarTasks(automationTasks),
    [automationTasks],
  );

  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>(() => {
    const initial = getAutomationSidebarTasks(automationTasks);
    const firstRunnable =
      initial.find((task) => task.runs.length > 0) || initial[0];
    return firstRunnable ? [firstRunnable.id] : [];
  });

  useEffect(() => {
    const taskIds = new Set(sidebarTasks.map((task) => task.id));
    setExpandedTaskIds((prev) => {
      const kept = prev.filter((id) => taskIds.has(id));
      if (kept.length > 0 || sidebarTasks.length === 0) return kept;
      const firstRunnable =
        sidebarTasks.find((task) => task.runs.length > 0) || sidebarTasks[0];
      return firstRunnable ? [firstRunnable.id] : [];
    });
  }, [sidebarTasks]);

  const handleToggle = (taskId: string) => {
    setExpandedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  const handleOpenTask = (taskId: string) => {
    router.push(`/my-claw/automation?taskId=${encodeURIComponent(taskId)}`);
  };

  const handleOpenRun = (taskId: string, runId: string) => {
    // Demo seed: first english-task run links to the expense session.
    if (taskId === "auto-schedule-daily-english") {
      router.push("/my-claw/chat?sessionId=task-001");
      return;
    }
    router.push(
      `/my-claw/automation?taskId=${encodeURIComponent(taskId)}&runId=${encodeURIComponent(runId)}`,
    );
  };

  return (
    <div className="mb-2 mt-1">
      <div className="mb-1 flex items-center justify-between px-2.5">
        <div className="flex items-center gap-1 text-[11px] font-medium tracking-wide text-[#5a6779]">
          <Clock3 className="h-3 w-3" />
          <span>自动化任务</span>
        </div>
        {sidebarTasks.length > 0 ? (
          <span className="text-[11px] text-[#5a6779]">
            {sidebarTasks.length}
          </span>
        ) : null}
      </div>

      {sidebarTasks.length === 0 ? (
        <div className="mx-2 rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-[#5a6779]">
          暂无自动化任务
        </div>
      ) : (
        <div className="px-1">
          {sidebarTasks.map((task) => (
            <AutomationTaskRow
              key={task.id}
              task={task}
              expanded={expandedTaskIds.includes(task.id)}
              activeTaskId={activeTaskId}
              activeRunId={activeRunId}
              onToggle={handleToggle}
              onOpenTask={handleOpenTask}
              onOpenRun={handleOpenRun}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionListBody({
  highlightedSessionId,
  activeTaskId,
  activeRunId,
}: {
  highlightedSessionId: string | null;
  activeTaskId: string | null;
  activeRunId: string | null;
}) {
  const { sessions } = useMyClaw();
  const pinned = sessions.filter((s) => s.pinned).sort(sortByUpdatedAt);
  const recent = sessions.filter((s) => !s.pinned).sort(sortByUpdatedAt);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <SessionGroup
          title="置顶"
          sessions={pinned}
          activeSessionId={highlightedSessionId}
        />
        <SessionGroup
          title="最近"
          sessions={recent}
          activeSessionId={highlightedSessionId}
        />
        <AutomationTaskGroup
          activeTaskId={activeTaskId}
          activeRunId={activeRunId}
        />
      </div>
    </div>
  );
}

function SessionListWithSearchParams() {
  const { activeSessionId, setActiveSession } = useMyClaw();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get("sessionId");
  const focusTaskId = searchParams.get("taskId");
  const focusRunId = searchParams.get("runId");

  useEffect(() => {
    const nextId =
      pathname.startsWith("/my-claw/chat") && querySessionId
        ? querySessionId
        : null;

    if (activeSessionId !== nextId) {
      setActiveSession(nextId);
    }
  }, [pathname, querySessionId, activeSessionId, setActiveSession]);

  const highlightedSessionId =
    pathname.startsWith("/my-claw/chat") || pathname === "/my-claw"
      ? querySessionId
      : null;
  const activeTaskId = pathname.startsWith("/my-claw/automation")
    ? focusTaskId
    : null;
  const activeRunId = pathname.startsWith("/my-claw/automation")
    ? focusRunId
    : null;

  return (
    <SessionListBody
      highlightedSessionId={highlightedSessionId}
      activeTaskId={activeTaskId}
      activeRunId={activeRunId}
    />
  );
}

/**
 * Mount-gate + Suspense: SSR/first paint render the same unfocused list,
 * then attach URL focus via `useSearchParams` to avoid hydration mismatch.
 */
export function SessionList() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <SessionListBody
        highlightedSessionId={null}
        activeTaskId={null}
        activeRunId={null}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <SessionListBody
          highlightedSessionId={null}
          activeTaskId={null}
          activeRunId={null}
        />
      }
    >
      <SessionListWithSearchParams />
    </Suspense>
  );
}
