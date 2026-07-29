"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
} from "lucide-react";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";
import { PROJECT_ISSUE_STATUS_LABELS } from "@/lib/mock/my-claw/project-issues";
import { formatRelativeTime } from "@/components/my-claw/project-issues/format";

function IssueLinkRow({
  issueId,
  accent,
}: {
  issueId: string;
  accent?: "attention" | "running" | "done";
}) {
  const { getIssue, getProject } = useProjectConversation();
  const issue = getIssue(issueId);
  if (!issue) return null;
  const project = getProject(issue.projectId);
  const href = `/my-claw/projects/${issue.projectId}?view=issues&issue=${issue.id}`;

  const Icon =
    accent === "done"
      ? CheckCircle2
      : accent === "running"
        ? Clock3
        : AlertTriangle;

  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-[#eef2f6] bg-white px-3.5 py-3 transition-colors hover:border-[#d6e6fb] hover:bg-[#f5f9ff]"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f0fb] text-[#2773ff]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-slate-900">
          {issue.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#5a6779]">
          <span>{issue.key}</span>
          <span>·</span>
          <span>{PROJECT_ISSUE_STATUS_LABELS[issue.status]}</span>
          {project ? (
            <>
              <span>·</span>
              <span>{project.name}</span>
            </>
          ) : null}
          <span>·</span>
          <span>{formatRelativeTime(issue.updatedAt)}</span>
        </div>
        {issue.latestProgress ? (
          <p className="mt-1 line-clamp-1 text-[12px] text-[#5a6779]">
            {issue.latestProgress}
          </p>
        ) : null}
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#5a6779]" />
    </Link>
  );
}

export function MyWorkAndProjectsPage() {
  const { getMyWorkProjection, getProject } = useProjectConversation();
  const projection = getMyWorkProjection();

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8f9fb]">
      <header className="shrink-0 border-b border-[#eef2f6] bg-white px-6 py-4">
        <h1 className="text-[18px] font-semibold text-slate-900">
          我的工作与项目
        </h1>
        <p className="mt-0.5 text-[13px] text-[#5a6779]">
          跨 Project 聚合需要你处理、正在推进与最近交付的事项
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            <section>
              <h2 className="mb-2 text-[13px] font-semibold text-slate-900">
                需要我处理
              </h2>
              <div className="space-y-2">
                {projection.attentionIssueIds.map((id) => (
                  <IssueLinkRow key={id} issueId={id} accent="attention" />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-[13px] font-semibold text-slate-900">
                进行中
              </h2>
              <div className="space-y-2">
                {projection.runningIssueIds.map((id) => (
                  <IssueLinkRow key={id} issueId={id} accent="running" />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-[13px] font-semibold text-slate-900">
                最近交付
              </h2>
              <div className="space-y-2">
                {projection.recentDeliveryIssueIds.map((id) => (
                  <IssueLinkRow key={id} issueId={id} accent="done" />
                ))}
              </div>
            </section>
          </div>

          <section>
            <h2 className="mb-2 text-[13px] font-semibold text-slate-900">
              我的 Projects
            </h2>
            <ul className="space-y-2">
              {projection.projectIds.map((projectId) => {
                const project = getProject(projectId);
                if (!project) return null;
                return (
                  <li key={projectId}>
                    <Link
                      href={`/my-claw/projects/${project.id}`}
                      className="flex items-center gap-3 rounded-xl border border-[#eef2f6] bg-white px-3.5 py-3 transition-colors hover:border-[#d6e6fb] hover:bg-[#f5f9ff]"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f0fb] text-[#2773ff]">
                        <FolderKanban className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-slate-900">
                          {project.name}
                        </div>
                        <div className="truncate text-[11px] text-[#5a6779]">
                          {project.description}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#5a6779]" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
