"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Squad } from "@/lib/mock/my-claw/collaboration";
import { useCollaboration } from "@/components/my-claw/collaboration/collaboration-provider";
import { ActorAvatar } from "@/components/my-claw/collaboration/shared/actor-avatar";
import { ActorTypeBadge } from "@/components/my-claw/collaboration/shared/actor-type-badge";
import { formatDateTime, formatRelativeTime } from "@/components/my-claw/collaboration/shared/format";
import { IssueStatusBadge } from "@/components/my-claw/collaboration/shared/issue-status-badge";
import { RunStatusBadge } from "@/components/my-claw/collaboration/shared/run-status-badge";
import { SquadStatusBadge } from "@/components/my-claw/collaboration/shared/squad-status-badge";

interface SquadDetailDrawerProps {
  squad: Squad | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SquadDetailDrawer({
  squad,
  open,
  onOpenChange,
}: SquadDetailDrawerProps) {
  const {
    getWorkspace,
    getProject,
    getActor,
    getIssue,
    getDerivedHumanMembers,
    getHumanForPersonalClaw,
    state,
  } = useCollaboration();

  if (!squad) return null;

  const workspace = getWorkspace(squad.workspaceId);
  const project = getProject(squad.projectId);
  const leader = getActor(squad.leaderActorId);
  const derivedHumans = getDerivedHumanMembers(squad);
  const pendingMembers = squad.agentMembers.filter(
    (member) => member.state === "pending_consent"
  );
  const activeIssues = state.issues.filter(
    (issue) =>
      issue.executor?.kind === "squad" &&
      issue.executor.id === squad.id &&
      issue.status !== "done" &&
      issue.status !== "cancelled"
  );
  const recentRuns = state.runs
    .filter(
      (run) =>
        run.executor.kind === "squad" && run.executor.id === squad.id
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
            <ActorAvatar name={squad.name} type="squad" size="lg" />
            <div className="min-w-0">
              <SheetTitle className="truncate">{squad.name}</SheetTitle>
              <SheetDescription className="mt-1 flex flex-wrap items-center gap-1.5">
                <SquadStatusBadge status={squad.status} />
                <span className="text-[11px] text-[#5a6779]">
                  {workspace?.name}
                </span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-5 text-[13px]">
          <section>
            <h3 className="mb-2 text-[12px] font-medium text-[#5a6779]">
              项目
            </h3>
            <div className="rounded-lg border border-slate-200/90 bg-[#f8f9fb] px-3 py-3">
              <div className="font-medium text-slate-900">
                {project?.name ?? "—"}
              </div>
              <div className="mt-1 text-[12px] text-[#5a6779]">
                {squad.description || "暂无描述"}
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-[12px] font-medium text-[#5a6779]">
              Leader
            </h3>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-3 py-2">
              <ActorAvatar
                name={leader?.name ?? "未设置"}
                type={leader?.type}
                size="sm"
              />
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-900">
                  {leader?.name ?? "未设置"}
                </div>
                {leader ? <ActorTypeBadge type={leader.type} /> : null}
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-[12px] font-medium text-[#5a6779]">
              Human（{derivedHumans.length}）· 由个人 Claw 派生
            </h3>
            {derivedHumans.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-[12px] text-[#5a6779]">
                暂无派生 Human
              </div>
            ) : (
              <ul className="space-y-1.5">
                {squad.agentMembers
                  .filter((member) => {
                    const actor = getActor(member.actorId);
                    return actor?.type === "personal_claw";
                  })
                  .map((member) => {
                    const actor = getActor(member.actorId);
                    const human = getHumanForPersonalClaw(member.actorId);
                    if (!human || !actor) return null;
                    return (
                      <li
                        key={human.id}
                        className="rounded-lg border border-slate-200/90 bg-white px-3 py-2"
                      >
                        <div className="font-medium text-slate-900">
                          {human.name}
                        </div>
                        <div className="text-[11px] text-[#5a6779]">
                          由「{actor.name}」带入
                          {member.state === "pending_consent"
                            ? " · 待确认"
                            : ""}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-[12px] font-medium text-[#5a6779]">
              Agent（{squad.agentMembers.length}）
            </h3>
            <ul className="space-y-1.5">
              {squad.agentMembers.map((member) => {
                const actor = getActor(member.actorId);
                return (
                  <li
                    key={member.actorId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/90 bg-white px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <ActorAvatar
                        name={actor?.name ?? member.actorId}
                        type={actor?.type}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-900">
                          {actor?.name ?? member.actorId}
                        </div>
                        <div className="text-[11px] text-[#5a6779]">
                          {member.roleLabel}
                          {member.state === "pending_consent"
                            ? " · 待确认"
                            : ""}
                        </div>
                      </div>
                    </div>
                    {actor ? <ActorTypeBadge type={actor.type} /> : null}
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-[11px] text-slate-400">
              多智能体组 ≠ Squad；组内子 Agent 不展开
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-[12px] font-medium text-[#5a6779]">
              待确认个人 Claw
            </h3>
            {pendingMembers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-[12px] text-[#5a6779]">
                无待确认成员
              </div>
            ) : (
              <ul className="space-y-1.5">
                {pendingMembers.map((member) => {
                  const actor = getActor(member.actorId);
                  return (
                    <li
                      key={member.actorId}
                      className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-amber-900"
                    >
                      {actor?.name ?? member.actorId}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-[12px] font-medium text-[#5a6779]">
              活跃 Issue
            </h3>
            {activeIssues.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-[12px] text-[#5a6779]">
                暂无活跃 Issue
              </div>
            ) : (
              <ul className="space-y-1.5">
                {activeIssues.map((issue) => (
                  <li
                    key={issue.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/90 bg-white px-3 py-2"
                  >
                    <span className="truncate font-medium text-slate-900">
                      {issue.key} · {issue.title}
                    </span>
                    <IssueStatusBadge status={issue.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-[12px] font-medium text-[#5a6779]">
              最近 Squad Run
            </h3>
            {recentRuns.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-[12px] text-[#5a6779]">
                暂无 Squad Run
              </div>
            ) : (
              <ul className="space-y-1.5">
                {recentRuns.map((run) => {
                  const issue = getIssue(run.issueId);
                  return (
                    <li
                      key={run.id}
                      className="rounded-lg border border-slate-200/90 bg-white px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-slate-900">
                          {issue ? `${issue.key} · ${issue.title}` : run.summary}
                        </span>
                        <RunStatusBadge status={run.status} />
                      </div>
                      <div className="mt-1 text-[11px] text-[#5a6779]">
                        {formatDateTime(run.startedAt ?? run.completedAt ?? "")}{" "}
                        · {formatRelativeTime(run.startedAt ?? run.completedAt ?? squad.updatedAt)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <p className="text-[11px] text-slate-400">
            只读视图：不提供创建、修改或删除
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
