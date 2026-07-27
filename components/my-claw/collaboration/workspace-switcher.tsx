"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Check,
  ChevronsUpDown,
  FolderKanban,
  Search,
  User,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CollaborationProject } from "@/lib/mock/my-claw/collaboration";
import { useCollaboration } from "./collaboration-provider";

function parseWorkspaceContext(pathname: string) {
  const workspaceMatch = pathname.match(/^\/my-claw\/workspaces\/([^/]+)/);
  const projectMatch = pathname.match(
    /^\/my-claw\/workspaces\/([^/]+)\/projects\/([^/]+)/
  );
  return {
    workspaceId: workspaceMatch?.[1] ?? null,
    projectId: projectMatch?.[2] ?? null,
    isPersonal: !workspaceMatch,
  };
}

interface WorkspaceProjectGroup {
  workspaceId: string;
  workspaceName: string;
  projects: CollaborationProject[];
}

export function WorkContextSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { state, getWorkspace, getProject } = useCollaboration();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { workspaceId, projectId, isPersonal } = parseWorkspaceContext(pathname);
  const currentWorkspace = workspaceId ? getWorkspace(workspaceId) : null;
  const currentProject = projectId ? getProject(projectId) : null;

  const projectGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups: WorkspaceProjectGroup[] = [];

    for (const workspace of state.workspaces) {
      const projects = state.projects.filter(
        (project) => project.workspaceId === workspace.id
      );
      if (projects.length === 0) continue;

      const workspaceMatched =
        q.length > 0 && workspace.name.toLowerCase().includes(q);
      const visibleProjects = q
        ? workspaceMatched
          ? projects
          : projects.filter((project) =>
              project.name.toLowerCase().includes(q)
            )
        : projects;

      if (visibleProjects.length === 0) continue;

      groups.push({
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        projects: visibleProjects,
      });
    }

    return groups;
  }, [query, state.projects, state.workspaces]);

  const hasQuery = query.trim().length > 0;
  const showEmpty = hasQuery && projectGroups.length === 0;

  const triggerIcon = isPersonal ? (
    <User className="h-4 w-4" />
  ) : (
    <FolderKanban className="h-4 w-4" />
  );

  const triggerTitle = isPersonal
    ? "个人空间"
    : currentProject?.name ?? currentWorkspace?.name ?? "组织空间";

  const triggerSubtitle = isPersonal
    ? "仅自己可见"
    : currentProject
      ? (currentWorkspace?.name ?? "组织空间")
      : (currentWorkspace?.organizationName ?? "全部 Project");

  return (
    <div className="px-3 pb-2">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg border border-[#e7ecf0] bg-[#f8f9fb] px-2.5 py-2 text-left transition-colors hover:bg-[#eef3f8]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#2773ff] shadow-sm">
              {triggerIcon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-slate-900">
                {triggerTitle}
              </div>
              <div className="truncate text-[11px] text-[#5a6779]">
                {triggerSubtitle}
              </div>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-[#5a6779]" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[320px] p-0" sideOffset={6}>
          <div className="border-b border-[#eef2f6] p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5a6779]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索 Project…"
                className="h-9 pl-8"
              />
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-2">
            {showEmpty ? (
              <div className="px-2.5 py-8 text-center text-[13px] text-[#5a6779]">
                未找到 Project
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push("/my-claw");
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50",
                    isPersonal && "bg-[#e8f0fb]"
                  )}
                >
                  <User className="h-4 w-4 text-[#5a6779]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-slate-900">
                      个人空间
                    </div>
                    <div className="text-[11px] text-[#5a6779]">仅自己可见</div>
                  </div>
                  {isPersonal ? (
                    <Check className="h-4 w-4 text-[#2773ff]" />
                  ) : null}
                </button>

                {projectGroups.map((group) => (
                  <div key={group.workspaceId} className="mt-1">
                    <div className="px-2.5 py-1.5 text-[11px] font-medium text-[#5a6779]">
                      {group.workspaceName}
                    </div>
                    {group.projects.map((project) => {
                      const active = project.id === projectId;
                      return (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            router.push(
                              `/my-claw/workspaces/${project.workspaceId}/projects/${project.id}`
                            );
                          }}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50",
                            active && "bg-[#e8f0fb]"
                          )}
                        >
                          <FolderKanban className="h-4 w-4 shrink-0 text-[#5a6779]" />
                          <div className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-900">
                            {project.name}
                          </div>
                          {active ? (
                            <Check className="h-4 w-4 shrink-0 text-[#2773ff]" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** @deprecated Use WorkContextSwitcher */
export { WorkContextSwitcher as WorkspaceSwitcher };

export function useCollaborationRouteContext() {
  const pathname = usePathname();
  return parseWorkspaceContext(pathname);
}
