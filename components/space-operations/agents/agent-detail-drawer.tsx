"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AgentActor } from "@/lib/mock/my-claw/collaboration";
import { useCollaboration } from "@/components/my-claw/collaboration/collaboration-provider";
import { ActorAvatar } from "@/components/my-claw/collaboration/shared/actor-avatar";
import { ActorTypeBadge } from "@/components/my-claw/collaboration/shared/actor-type-badge";
import { formatDateTime, formatRelativeTime } from "@/components/my-claw/collaboration/shared/format";
import { RunStatusBadge } from "@/components/my-claw/collaboration/shared/run-status-badge";
import { SquadStatusBadge } from "@/components/my-claw/collaboration/shared/squad-status-badge";

const RUNTIME_LABELS: Record<AgentActor["runtimeStatus"], string> = {
  online: "Online",
  busy: "Busy",
  offline: "Offline",
  error: "Error",
};

interface AgentDetailDrawerProps {
  actor: AgentActor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentDetailDrawer({
  actor,
  open,
  onOpenChange,
}: AgentDetailDrawerProps) {
  const {
    getWorkspace,
    getUser,
    getProject,
    state,
  } = useCollaboration();

  if (!actor) return null;

  const workspace = getWorkspace(actor.workspaceId);
  const owner = actor.ownerUserId ? getUser(actor.ownerUserId) : undefined;
  const squads = state.squads.filter((squad) =>
    squad.agentMembers.some((member) => member.actorId === actor.id)
  );
  const projects = state.projects.filter(
    (project) =>
      project.actorIds.includes(actor.id) ||
      squads.some((squad) => squad.projectId === project.id)
  );
  const recentRuns = state.runs
    .filter(
      (run) =>
        (run.executor.kind === "agent" && run.executor.id === actor.id) ||
        run.childRuns?.some((child) => child.actorId === actor.id)
    )
    .sort(
      (a, b) =>
        new Date(b.startedAt ?? b.completedAt ?? 0).getTime() -
        new Date(a.startedAt ?? a.completedAt ?? 0).getTime()
    )
    .slice(0, 5);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <ActorAvatar name={actor.name} type={actor.type} size="lg" />
            <div className="min-w-0">
              <SheetTitle className="truncate">{actor.name}</SheetTitle>
              <SheetDescription className="mt-1 flex flex-wrap items-center gap-1.5">
                <ActorTypeBadge type={actor.type} />
                <span className="text-[11px] text-[#5a6779]">
                  {RUNTIME_LABELS[actor.runtimeStatus]}
                </span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-5 text-[13px]">
          <section>
            <h3 className="mb-2 text-[12px] font-medium text-[#5a6779]">
              基本信息
            </h3>
            <dl className="space-y-2 rounded-lg border border-slate-200/90 bg-[#f8f9fb] px-3 py-3">
              <div className="flex justify-between gap-3">
                <dt className="text-[#5a6779]">所属用户 / 来源</dt>
                <dd className="text-right text-slate-800">
                  {owner?.name ?? actor.sourceLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#5a6779]">组织空间</dt>
                <dd className="text-right text-slate-800">
                  {workspace?.name ?? actor.workspaceId}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#5a6779]">Active Runs</dt>
                <dd className="text-right text-slate-800">
                  {actor.activeRunCount}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#5a6779]">最近活动</dt>
                <dd className="text-right text-slate-800">
                  {formatRelativeTime(actor.lastActiveAt)}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-[12px] leading-5 text-[#5a6779]">
              {actor.description}
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-[12px] font-medium text-[#5a6779]">
              当前项目
            </h3>
            {projects.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-[12px] text-[#5a6779]">
                未参与协作项目
              </div>
            ) : (
              <ul className="space-y-1.5">
                {projects.map((project) => (
                  <li
                    key={project.id}
                    className="rounded-lg border border-slate-200/90 bg-white px-3 py-2"
                  >
                    <div className="font-medium text-slate-900">
                      {project.name}
                    </div>
                    <div className="text-[11px] text-[#5a6779]">
                      {getWorkspace(project.workspaceId)?.name}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-[12px] font-medium text-[#5a6779]">
              所属 Squad
            </h3>
            <p className="mb-2 text-[11px] text-[#5a6779]">
              多智能体组仍是 AgentActor，不等于 Squad
            </p>
            {squads.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-[12px] text-[#5a6779]">
                未加入小队
              </div>
            ) : (
              <ul className="space-y-1.5">
                {squads.map((squad) => (
                  <li
                    key={squad.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/90 bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-900">
                        {squad.name}
                      </div>
                      <div className="truncate text-[11px] text-[#5a6779]">
                        {getProject(squad.projectId)?.name}
                      </div>
                    </div>
                    <SquadStatusBadge status={squad.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-[12px] font-medium text-[#5a6779]">
              最近 Run
            </h3>
            {recentRuns.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-[12px] text-[#5a6779]">
                暂无 Run 记录
              </div>
            ) : (
              <ul className="space-y-1.5">
                {recentRuns.map((run) => (
                  <li
                    key={run.id}
                    className="rounded-lg border border-slate-200/90 bg-white px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-slate-900">
                        {run.summary}
                      </span>
                      <RunStatusBadge status={run.status} />
                    </div>
                    <div className="mt-1 text-[11px] text-[#5a6779]">
                      {formatDateTime(run.startedAt ?? run.completedAt ?? "")}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-[12px] font-medium text-[#5a6779]">
              来源资产
            </h3>
            <div className="rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-[12px] text-[#5a6779]">
              {actor.sourceLabel}
              <div className="mt-1">
                <Link
                  href="/space-operations/dashboard"
                  className="text-[#2773ff] hover:underline"
                >
                  在 Nexus 运营看板查看态势
                </Link>
              </div>
            </div>
          </section>

          <p className="text-[11px] text-slate-400">
            只读视图：不提供创建、删除、发布或权限修改
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
