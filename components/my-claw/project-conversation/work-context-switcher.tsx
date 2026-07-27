"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useProjectConversation } from "./project-conversation-provider";

const LAST_WORKSPACE_KEY = "my-claw-last-workspace-id";

export function getLastWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LAST_WORKSPACE_KEY);
  } catch {
    return null;
  }
}

export function setLastWorkspaceId(workspaceId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_WORKSPACE_KEY, workspaceId);
  } catch {
    // ignore
  }
}

/**
 * Top-left space selector: 个人空间 / Workspace…
 * Projects are listed flat in the sidebar under the selected space.
 */
export function WorkContextSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, getWorkspace } = useProjectConversation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const projectMatch = pathname.match(
    /^\/my-claw\/workspaces\/([^/]+)\/projects\/([^/]+)/
  );
  const activeWorkspaceId = projectMatch?.[1] ?? null;
  const isPersonal = !activeWorkspaceId;

  const activeWorkspace = activeWorkspaceId
    ? getWorkspace(activeWorkspaceId)
    : undefined;

  const workspaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.workspaces.filter((workspace) => {
      if (!q) return true;
      return (
        workspace.name.toLowerCase().includes(q) ||
        workspace.organizationName.toLowerCase().includes(q)
      );
    });
  }, [query, state.workspaces]);

  const goPersonal = () => {
    setOpen(false);
    router.push("/my-claw");
  };

  const goWorkspace = (workspaceId: string) => {
    setLastWorkspaceId(workspaceId);
    const projects = state.projects.filter(
      (project) =>
        project.workspaceId === workspaceId && project.status === "active"
    );
    const first = projects[0];
    setOpen(false);
    if (first) {
      router.push(
        `/my-claw/workspaces/${workspaceId}/projects/${first.id}`
      );
      return;
    }
    router.push("/my-claw");
  };

  return (
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
          className="flex w-full items-center gap-2.5 rounded-lg border border-[#e7ecf0] bg-[#f8f9fb] px-2.5 py-2 text-left transition-colors hover:bg-[#eef3f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2773ff]/40"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#2773ff] shadow-sm">
            {isPersonal ? (
              <User className="h-4 w-4" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-slate-900">
              {isPersonal ? "个人空间" : (activeWorkspace?.name ?? "组织空间")}
            </div>
            <div className="truncate text-[11px] text-[#5a6779]">
              {isPersonal
                ? "仅自己可见"
                : (activeWorkspace?.organizationName ?? "选择空间")}
            </div>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-[#5a6779]" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={6} className="w-[280px] p-0">
        <div className="border-b border-[#eef2f6] p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5a6779]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索空间…"
              className="h-8 border-[#e2e8f0] bg-[#f8f9fb] pl-8 text-[13px] shadow-none focus-visible:ring-[#2773ff]/30"
            />
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto py-1">
          {!query.trim() ? (
            <button
              type="button"
              onClick={goPersonal}
              className={cn(
                "mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors",
                isPersonal
                  ? "bg-[#e8f0fb] font-medium text-[#2773ff]"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 truncate">个人空间</span>
              {isPersonal ? <Check className="h-3.5 w-3.5" /> : null}
            </button>
          ) : null}

          {workspaces.map((workspace) => {
            const selected = workspace.id === activeWorkspaceId;
            const projectCount = state.projects.filter(
              (project) =>
                project.workspaceId === workspace.id &&
                project.status === "active"
            ).length;
            return (
              <button
                key={workspace.id}
                type="button"
                onClick={() => goWorkspace(workspace.id)}
                className={cn(
                  "mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors",
                  selected
                    ? "bg-[#e8f0fb] font-medium text-[#2773ff]"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate">{workspace.name}</div>
                  <div className="truncate text-[11px] font-normal text-[#5a6779]">
                    {projectCount} 个项目
                  </div>
                </div>
                {selected ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
              </button>
            );
          })}

          {workspaces.length === 0 ? (
            <div className="px-3 py-6 text-center text-[12px] text-[#5a6779]">
              未找到匹配的空间
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
