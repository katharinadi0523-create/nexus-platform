"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessagesSquare, Pin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";

export function ProjectChatList() {
  const pathname = usePathname();
  const { state } = useProjectConversation();
  const [query, setQuery] = useState("");

  const activeProjectId = useMemo(() => {
    const match =
      pathname.match(/^\/my-claw\/projects\/([^/]+)/) ??
      pathname.match(/^\/my-claw\/workspaces\/[^/]+\/projects\/([^/]+)/);
    return match?.[1] ?? null;
  }, [pathname]);

  const projects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.projects
      .filter((project) => project.status === "active")
      .filter((project) =>
        q ? project.name.toLowerCase().includes(q) : true
      )
      .sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) {
          return a.pinned ? -1 : 1;
        }
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
  }, [query, state.projects]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 pb-2 pt-1">
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
          const href = `/my-claw/projects/${project.id}`;
          const active =
            project.id === activeProjectId ||
            pathname === href ||
            pathname.startsWith(`${href}/`);

          return (
            <Link
              key={project.id}
              href={href}
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
              {project.pinned ? (
                <Pin className="h-3 w-3 shrink-0 text-[#2773ff]" />
              ) : null}
            </Link>
          );
        })}

        {projects.length === 0 ? (
          <div className="px-2.5 py-8 text-center text-[12px] leading-5 text-[#5a6779]">
            {query.trim() ? "未找到匹配项目" : "暂无 Project Chat"}
          </div>
        ) : null}
      </nav>
    </div>
  );
}
