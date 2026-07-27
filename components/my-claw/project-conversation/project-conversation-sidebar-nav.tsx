"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessagesSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useProjectConversation } from "./project-conversation-provider";
import { setLastWorkspaceId } from "./work-context-switcher";

interface WorkspaceProjectListProps {
  workspaceId: string;
  activeProjectId?: string | null;
}

/**
 * Flat list of projects in the current workspace.
 * Each item is a Project Conversation — label is the project name.
 */
export function WorkspaceProjectList({
  workspaceId,
  activeProjectId,
}: WorkspaceProjectListProps) {
  const pathname = usePathname();
  const { state, getWorkspace } = useProjectConversation();
  const [query, setQuery] = useState("");
  const workspace = getWorkspace(workspaceId);

  const projects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.projects
      .filter(
        (project) =>
          project.workspaceId === workspaceId && project.status === "active"
      )
      .filter((project) =>
        q ? project.name.toLowerCase().includes(q) : true
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [query, state.projects, workspaceId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 pb-2 pt-3">
        <div className="mb-2 px-0.5 text-[11px] font-medium text-[#5a6779]">
          {workspace?.name ?? "当前空间"} · 项目
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5a6779]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索项目…"
            className="h-8 border-[#e2e8f0] bg-[#f8f9fb] pl-8 text-[13px] shadow-none focus-visible:ring-[#2773ff]/30"
          />
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {projects.map((project) => {
          const href = `/my-claw/workspaces/${project.workspaceId}/projects/${project.id}`;
          const active =
            project.id === activeProjectId ||
            pathname === href ||
            pathname.startsWith(`${href}/`);

          return (
            <Link
              key={project.id}
              href={href}
              onClick={() => setLastWorkspaceId(project.workspaceId)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-[#e8f0fb] text-[#2773ff]"
                  : "text-slate-700 hover:bg-slate-50"
              )}
              title={project.description}
            >
              <MessagesSquare
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-[#2773ff]" : "text-[#5a6779]"
                )}
              />
              <span className="min-w-0 flex-1 truncate">{project.name}</span>
            </Link>
          );
        })}

        {projects.length === 0 ? (
          <div className="px-2.5 py-8 text-center text-[12px] leading-5 text-[#5a6779]">
            {query.trim() ? "未找到匹配项目" : "该空间暂无项目"}
          </div>
        ) : null}
      </nav>
    </div>
  );
}

/** @deprecated Use WorkspaceProjectList */
export function ProjectConversationSidebarNav({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  return (
    <WorkspaceProjectList
      workspaceId={workspaceId}
      activeProjectId={projectId}
    />
  );
}
