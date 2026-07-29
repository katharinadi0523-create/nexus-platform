"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  MessagesSquare,
  Pin,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";
import { CreateProjectConversationDialog } from "@/components/my-claw/project-conversation/create-project-conversation-dialog";
import { CreateProjectDialog } from "@/components/my-claw/shell/create-project-dialog";
import { formatRelativeTime } from "@/components/my-claw/project-issues/format";

/** Project list with nested conversations (folder expand, default open). */
export function ProjectList() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, currentUserId, getVisibleConversations } =
    useProjectConversation();
  const [query, setQuery] = useState("");
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createConversationProjectId, setCreateConversationProjectId] =
    useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandedReady, setExpandedReady] = useState(false);

  const activeProjectId = useMemo(() => {
    const match =
      pathname.match(/^\/my-claw\/projects\/([^/]+)/) ??
      pathname.match(/^\/my-claw\/workspaces\/[^/]+\/projects\/([^/]+)/);
    return match?.[1] ?? null;
  }, [pathname]);

  const activeConversationId = useMemo(() => {
    const match = pathname.match(
      /^\/my-claw\/projects\/[^/]+\/conversations\/([^/]+)/,
    );
    return match?.[1] ?? null;
  }, [pathname]);

  const projects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.projects
      .filter((project) => project.status === "active")
      .filter((project) => {
        if (!q) return true;
        if (project.name.toLowerCase().includes(q)) return true;
        return getVisibleConversations(project.id, currentUserId).some((c) =>
          c.name.toLowerCase().includes(q),
        );
      })
      .sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) {
          return a.pinned ? -1 : 1;
        }
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
  }, [currentUserId, getVisibleConversations, query, state.projects]);

  useEffect(() => {
    if (expandedReady) return;
    setExpandedIds(new Set(projects.map((p) => p.id)));
    setExpandedReady(true);
  }, [expandedReady, projects]);

  useEffect(() => {
    if (!activeProjectId) return;
    setExpandedIds((prev) => {
      if (prev.has(activeProjectId)) return prev;
      const next = new Set(prev);
      next.add(activeProjectId);
      return next;
    });
  }, [activeProjectId]);

  const toggleExpanded = (projectId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-1 px-3 pb-2 pt-1">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5a6779]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索项目或会话…"
            className="h-8 border-[#e2e8f0] bg-[#f8f9fb] pl-8 text-[13px] shadow-none focus-visible:ring-[#2773ff]/30"
          />
        </div>
        <button
          type="button"
          title="新建 Project"
          onClick={() => setCreateProjectOpen(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-slate-50 hover:text-[#2773ff]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {projects.map((project) => {
          const href = `/my-claw/projects/${project.id}`;
          const projectActive =
            project.id === activeProjectId && !activeConversationId;
          const expanded = expandedIds.has(project.id);
          const conversations = getVisibleConversations(
            project.id,
            currentUserId,
          ).filter((item) => {
            const q = query.trim().toLowerCase();
            if (!q) return true;
            return (
              item.name.toLowerCase().includes(q) ||
              project.name.toLowerCase().includes(q)
            );
          });

          return (
            <div key={project.id} className="space-y-0.5">
              <div
                className={cn(
                  "group flex items-center gap-0.5 rounded-lg pr-1 transition-colors",
                  projectActive ? "bg-[#e8f0fb]" : "hover:bg-slate-50",
                )}
              >
                <button
                  type="button"
                  aria-label={expanded ? "折叠会话" : "展开会话"}
                  onClick={() => toggleExpanded(project.id)}
                  className="flex h-8 w-6 shrink-0 items-center justify-center text-[#94a3b8] hover:text-slate-700"
                >
                  {expanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
                <Link
                  href={href}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 py-2 pr-1 text-[13px] font-medium",
                    projectActive ? "text-[#2773ff]" : "text-slate-700",
                  )}
                  title={project.description}
                >
                  <Folder
                    className={cn(
                      "h-4 w-4 shrink-0",
                      projectActive ? "text-[#2773ff]" : "text-amber-500",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {project.name}
                  </span>
                  {project.pinned ? (
                    <Pin className="h-3 w-3 shrink-0 text-[#2773ff]" />
                  ) : null}
                </Link>
                <button
                  type="button"
                  title="新建会话"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCreateConversationProjectId(project.id);
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#94a3b8] opacity-0 transition-opacity hover:bg-white hover:text-[#2773ff] group-hover:opacity-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {expanded ? (
                <div className="ml-4 space-y-0.5 border-l border-[#eef2f6] pl-2">
                  {conversations.map((conversation) => {
                    const convHref = `/my-claw/projects/${project.id}/conversations/${conversation.id}`;
                    const active = conversation.id === activeConversationId;
                    const running = state.invocations.some(
                      (inv) =>
                        inv.threadId === conversation.id &&
                        (inv.status === "running" || inv.status === "queued") &&
                        !inv.parentInvocationId,
                    );

                    return (
                      <Link
                        key={conversation.id}
                        href={convHref}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                          active
                            ? "bg-[#e8f0fb] text-[#2773ff]"
                            : "text-slate-700 hover:bg-slate-50",
                        )}
                      >
                        <MessagesSquare
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            active ? "text-[#2773ff]" : "text-[#5a6779]",
                          )}
                        />
                        <div className="flex min-w-0 flex-1 items-center gap-1">
                          <span className="truncate text-[12px] font-medium">
                            {conversation.name}
                          </span>
                          {running ? (
                            <span className="shrink-0 rounded bg-[#e8f0fb] px-1 py-0.5 text-[9px] text-[#2773ff]">
                              运行中
                            </span>
                          ) : null}
                        </div>
                        <span className="shrink-0 pt-0.5 text-[10px] text-[#5a6779]">
                          {formatRelativeTime(conversation.updatedAt)}
                        </span>
                      </Link>
                    );
                  })}
                  {conversations.length === 0 ? (
                    <div className="px-2 py-2 text-[11px] text-[#5a6779]">
                      暂无可见会话
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}

        {projects.length === 0 ? (
          <div className="px-2.5 py-8 text-center text-[12px] leading-5 text-[#5a6779]">
            {query.trim() ? "未找到匹配项目" : "暂无 Project"}
          </div>
        ) : null}
      </nav>

      <CreateProjectDialog
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onCreated={(id) => {
          setCreateProjectOpen(false);
          router.push(`/my-claw/projects/${id}`);
        }}
      />

      {createConversationProjectId ? (
        <CreateProjectConversationDialog
          projectId={createConversationProjectId}
          open
          onClose={() => setCreateConversationProjectId(null)}
          onCreated={(conversationId) => {
            const projectId = createConversationProjectId;
            setCreateConversationProjectId(null);
            setExpandedIds((prev) => new Set(prev).add(projectId));
            router.push(
              `/my-claw/projects/${projectId}/conversations/${conversationId}`,
            );
          }}
        />
      ) : null}
    </div>
  );
}

/** @deprecated Use ProjectList */
export { ProjectList as ProjectChatList };
