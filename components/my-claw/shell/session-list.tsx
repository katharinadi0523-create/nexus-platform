"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  Clock3,
  MoreHorizontal,
  Pin,
  PinOff,
  Pencil,
  Trash2,
} from "lucide-react";
import { useMyClaw } from "@/components/my-claw/provider";
import type {
  AutomationTask,
  MyClawSessionListItem,
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

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

/** Parse mock stamps like `2026-04-30 08:42` or ISO strings. */
function toSortTime(value: string | undefined): number {
  if (!value) return 0;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const ms = new Date(normalized).getTime();
  return Number.isFinite(ms) ? ms : 0;
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
        isActive ? "bg-[#e8f0fb]" : "hover:bg-slate-50"
      )}
    >
      <Link
        href={`/my-claw/chat?sessionId=${encodeURIComponent(session.id)}`}
        onClick={() => setActiveSession(session.id)}
        className="min-w-0 flex-1 px-2.5 py-2"
      >
        <div className="flex items-center gap-1.5">
          {session.pinned ? (
            <Pin className="h-3 w-3 shrink-0 text-[#2773ff]" />
          ) : null}
          <span
            className={cn(
              "truncate text-[13px] leading-5",
              isActive ? "font-medium text-slate-900" : "text-slate-700"
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

interface AutomationSessionRowProps {
  task: AutomationTask;
  isActive: boolean;
}

function AutomationSessionRow({ task, isActive }: AutomationSessionRowProps) {
  const router = useRouter();
  const title = task.name || "未命名自动化任务";

  return (
    <button
      type="button"
      onClick={() =>
        router.push(`/my-claw/automation?taskId=${encodeURIComponent(task.id)}`)
      }
      className={cn(
        "flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-left transition-colors",
        isActive ? "bg-[#e8f0fb]" : "hover:bg-slate-50"
      )}
      title={title}
    >
      <Clock3
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          isActive ? "text-[#2773ff]" : "text-[#94a3b8]"
        )}
        aria-hidden
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[13px] leading-5",
          isActive ? "font-medium text-slate-900" : "text-slate-700"
        )}
      >
        {title}
      </span>
      <span className="sr-only">自动化任务</span>
    </button>
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

type RecentListItem =
  | { kind: "session"; sortAt: number; session: MyClawSessionListItem }
  | { kind: "automation"; sortAt: number; task: AutomationTask };

function RecentGroup({
  sessions,
  automationTasks,
  activeSessionId,
  activeTaskId,
}: {
  sessions: MyClawSessionListItem[];
  automationTasks: AutomationTask[];
  activeSessionId: string | null;
  activeTaskId: string | null;
}) {
  const items = useMemo(() => {
    const rows: RecentListItem[] = [
      ...sessions.map((session) => ({
        kind: "session" as const,
        sortAt: toSortTime(session.updatedAt),
        session,
      })),
      ...automationTasks.map((task) => ({
        kind: "automation" as const,
        sortAt: toSortTime(task.last_run_at),
        task,
      })),
    ];

    return rows.sort((a, b) => b.sortAt - a.sortAt);
  }, [sessions, automationTasks]);

  if (items.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="mb-1 px-2.5 text-[11px] font-medium tracking-wide text-[#5a6779]">
        最近
      </div>
      <div className="space-y-0.5">
        {items.map((item) =>
          item.kind === "session" ? (
            <SessionRow
              key={item.session.id}
              session={item.session}
              isActive={activeSessionId === item.session.id}
            />
          ) : (
            <AutomationSessionRow
              key={item.task.id}
              task={item.task}
              isActive={activeTaskId === item.task.id}
            />
          )
        )}
      </div>
    </div>
  );
}

function SessionListBody({
  highlightedSessionId,
  activeTaskId,
}: {
  highlightedSessionId: string | null;
  activeTaskId: string | null;
}) {
  const { sessions, automationTasks } = useMyClaw();
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
        <RecentGroup
          sessions={recent}
          automationTasks={automationTasks}
          activeSessionId={highlightedSessionId}
          activeTaskId={activeTaskId}
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

  return (
    <SessionListBody
      highlightedSessionId={highlightedSessionId}
      activeTaskId={activeTaskId}
    />
  );
}

/**
 * Mount-gate + Suspense: SSR/first paint render the same unfocused list,
 * then attach URL focus via `useSearchParams` to avoid hydration mismatch.
 */
export function SessionList() {
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );

  if (!mounted) {
    return (
      <SessionListBody highlightedSessionId={null} activeTaskId={null} />
    );
  }

  return (
    <Suspense
      fallback={
        <SessionListBody highlightedSessionId={null} activeTaskId={null} />
      }
    >
      <SessionListWithSearchParams />
    </Suspense>
  );
}
