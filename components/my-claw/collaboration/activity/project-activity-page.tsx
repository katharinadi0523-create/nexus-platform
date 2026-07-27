"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  FolderKanban,
  MessageSquare,
  Paperclip,
  PlayCircle,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityKind } from "@/lib/mock/my-claw/collaboration";
import { useCollaboration } from "../collaboration-provider";
import { formatDateTime, formatRelativeTime } from "../shared/format";

interface ProjectActivityPageProps {
  workspaceId: string;
  projectId: string;
}

type ActivityFilter = "all" | "issue" | "run" | "squad" | "context";

const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "issue", label: "Issue" },
  { key: "run", label: "Agent·Run" },
  { key: "squad", label: "Squad" },
  { key: "context", label: "上下文" },
];

function matchesFilter(kind: ActivityKind, filter: ActivityFilter): boolean {
  if (filter === "all") return true;
  if (filter === "issue") return kind === "issue" || kind === "comment";
  if (filter === "run") return kind === "run";
  if (filter === "squad") return kind === "squad";
  if (filter === "context") return kind === "context" || kind === "project";
  return true;
}

function kindIcon(kind: ActivityKind) {
  switch (kind) {
    case "issue":
      return FolderKanban;
    case "comment":
      return MessageSquare;
    case "run":
      return PlayCircle;
    case "squad":
      return UsersRound;
    case "context":
    case "project":
      return Paperclip;
    default:
      return Activity;
  }
}

function kindLabel(kind: ActivityKind): string {
  switch (kind) {
    case "issue":
      return "Issue";
    case "comment":
      return "评论";
    case "run":
      return "Run";
    case "squad":
      return "Squad";
    case "context":
      return "上下文";
    case "project":
      return "项目";
    default:
      return kind;
  }
}

export function ProjectActivityPage({
  workspaceId,
  projectId,
}: ProjectActivityPageProps) {
  const { getProject, getActivitiesForProject } = useCollaboration();
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const project = getProject(projectId);
  const activities = getActivitiesForProject(projectId);

  const filtered = useMemo(
    () =>
      activities
        .filter((item) => matchesFilter(item.kind, filter))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [activities, filter]
  );

  if (!project || project.workspaceId !== workspaceId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#5a6779]">
        未找到协作项目
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-200/80 bg-white px-5 py-4 md:px-6">
        <h1 className="text-[20px] font-medium tracking-tight text-slate-900">
          项目动态
        </h1>
        <p className="mt-1 text-sm text-[#5a6779]">
          记录项目内发生的事件，不等于个人 Inbox
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
                filter === item.key
                  ? "bg-[#e8f0fb] text-[#2773ff]"
                  : "bg-[#f8f9fb] text-[#5a6779] hover:bg-slate-100"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <Activity className="mb-3 h-8 w-8 text-slate-300" />
            <div className="text-sm font-medium text-slate-800">暂无动态</div>
            <p className="mt-1 text-[13px] text-[#5a6779]">
              创建 Issue、更新上下文或小队变更后会出现在这里
            </p>
          </div>
        ) : (
          <ol className="relative space-y-0 border-l border-slate-200 pl-5">
            {filtered.map((item) => {
              const Icon = kindIcon(item.kind);
              return (
                <li key={item.id} className="relative pb-5 last:pb-0">
                  <span className="absolute -left-[27px] flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-[#2773ff]">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium text-slate-900">
                        {item.title}
                      </span>
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-[#5a6779]">
                        {kindLabel(item.kind)}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-5 text-[#5a6779]">
                      {item.summary}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                      <span>{item.actorLabel}</span>
                      <span>{formatRelativeTime(item.createdAt)}</span>
                      <span>{formatDateTime(item.createdAt)}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
