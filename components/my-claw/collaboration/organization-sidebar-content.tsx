"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  FolderKanban,
  Home,
  ListTodo,
  Paperclip,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollaboration } from "./collaboration-provider";
import { useCollaborationRouteContext } from "./workspace-switcher";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
        active
          ? "bg-[#e8f0fb] text-[#2773ff]"
          : "text-slate-700 hover:bg-slate-50"
      )}
      title={label}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-[#2773ff]" : "text-[#5a6779]"
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function OrganizationSidebarContent() {
  const pathname = usePathname();
  const { workspaceId, projectId } = useCollaborationRouteContext();
  const { getProject, getProjectsForWorkspace } = useCollaboration();

  if (!workspaceId) return null;

  const project = projectId ? getProject(projectId) : null;
  const projects = getProjectsForWorkspace(workspaceId);
  const base = `/my-claw/workspaces/${workspaceId}`;

  if (project && projectId) {
    const projectBase = `${base}/projects/${projectId}`;
    const items = [
      {
        key: "overview",
        label: "概览",
        href: projectBase,
        icon: Home,
        active: pathname === projectBase,
      },
      {
        key: "issues",
        label: "工作项",
        href: `${projectBase}/issues`,
        icon: ListTodo,
        active: pathname.startsWith(`${projectBase}/issues`),
      },
      {
        key: "squads",
        label: "小队",
        href: `${projectBase}/squads`,
        icon: UsersRound,
        active: pathname.startsWith(`${projectBase}/squads`),
      },
      {
        key: "context",
        label: "Project Context",
        href: `${projectBase}/context`,
        icon: Paperclip,
        active: pathname.startsWith(`${projectBase}/context`),
      },
      {
        key: "activity",
        label: "动态",
        href: `${projectBase}/activity`,
        icon: Activity,
        active: pathname.startsWith(`${projectBase}/activity`),
      },
    ];

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <nav className="space-y-0.5 px-2 pb-3">
          {items.map((item) => (
            <NavLink
              key={item.key}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={item.active}
            />
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 py-3 text-[12px] leading-5 text-[#5a6779]">
        请通过左上工作上下文选择器进入 Project
      </div>
      {projects.length > 0 ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          <div className="mb-1.5 px-2.5 text-[11px] font-medium text-[#5a6779]">
            本空间 Project
          </div>
          <div className="space-y-0.5">
            {projects.map((item) => {
              const href = `${base}/projects/${item.id}`;
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={item.id}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
                    active ? "bg-[#e8f0fb]" : "hover:bg-slate-50"
                  )}
                >
                  <FolderKanban
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-[#2773ff]" : "text-[#5a6779]"
                    )}
                  />
                  <span
                    className={cn(
                      "truncate text-[13px]",
                      active
                        ? "font-medium text-slate-900"
                        : "text-slate-700"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
