"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  MoreHorizontal,
  Pin,
  PinOff,
  Pencil,
  Trash2,
} from "lucide-react";
import { useMyClaw } from "@/components/my-claw/provider";
import type { MyClawSessionListItem } from "@/lib/mock/my-claw";
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
        <p className="mt-0.5 truncate text-xs text-[#5a6779]">
          {session.preview}
        </p>
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
          <DropdownMenuItem
            variant="destructive"
            onClick={handleDelete}
          >
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

export function SessionList() {
  const { sessions, activeSessionId, setActiveSession } = useMyClaw();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get("sessionId");

  // URL sessionId is the highlight source of truth; keep provider in sync.
  useEffect(() => {
    const nextId =
      pathname.startsWith("/my-claw/chat") && querySessionId
        ? querySessionId
        : null;

    if (activeSessionId !== nextId) {
      setActiveSession(nextId);
    }
  }, [pathname, querySessionId, activeSessionId, setActiveSession]);

  const highlightedSessionId = querySessionId;

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

        <div className="mb-2 mt-1">
          <div className="mb-1 px-2.5 text-[11px] font-medium tracking-wide text-[#5a6779]">
            自动化任务
          </div>
          <div className="mx-2 rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-[#5a6779]">
            暂无自动化任务
          </div>
        </div>
      </div>
    </div>
  );
}
