"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ACTOR_TYPE_LABELS,
  SQUAD_STATUS_LABELS,
  type AgentActorType,
  type Squad,
} from "@/lib/mock/my-claw/collaboration";
import { useCollaboration } from "../collaboration-provider";
import { ActorAvatar } from "../shared/actor-avatar";
import { formatRelativeTime } from "../shared/format";
import { SquadStatusBadge } from "../shared/squad-status-badge";
import { SquadCreateDialog } from "./squad-create-dialog";

interface SquadListProps {
  workspaceId: string;
  projectId: string;
}

function typeDistribution(
  squad: Squad,
  getActor: (id: string) => { type: AgentActorType } | undefined
): string {
  const counts = new Map<AgentActorType, number>();
  for (const member of squad.agentMembers) {
    const actor = getActor(member.actorId);
    if (!actor) continue;
    counts.set(actor.type, (counts.get(actor.type) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([type, count]) => `${ACTOR_TYPE_LABELS[type]} ${count}`)
    .join(" · ");
}

export function SquadList({ workspaceId, projectId }: SquadListProps) {
  const { state, getActor, getSquad, getDerivedHumanMembers } =
    useCollaboration();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const project = state.projects.find((item) => item.id === projectId);
  const squads = useMemo(() => {
    const list = state.squads.filter(
      (squad) =>
        squad.projectId === projectId && squad.workspaceId === workspaceId
    );
    const q = query.trim().toLowerCase();
    return list.filter((squad) => {
      if (statusFilter !== "all" && squad.status !== statusFilter) return false;
      if (!q) return true;
      const leader = getActor(squad.leaderActorId);
      return (
        squad.name.toLowerCase().includes(q) ||
        squad.description.toLowerCase().includes(q) ||
        (leader?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [
    state.squads,
    projectId,
    workspaceId,
    query,
    statusFilter,
    getActor,
  ]);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#5a6779]">
        未找到协作项目
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-200/80 bg-white px-5 py-4 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[20px] font-medium tracking-tight text-slate-900">
              小队
            </h1>
            <p className="mt-1 text-sm text-[#5a6779]">
              Agent 为执行成员；Human 由个人 Claw 自动派生
            </p>
          </div>
          <Button
            type="button"
            className="bg-[#2773ff] hover:bg-[#1f63e0]"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            创建小队
          </Button>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索小队或 Leader"
              className="pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-full sm:w-40"
            options={[
              { value: "all", label: "全部状态" },
              { value: "ready", label: SQUAD_STATUS_LABELS.ready },
              { value: "running", label: SQUAD_STATUS_LABELS.running },
              { value: "degraded", label: SQUAD_STATUS_LABELS.degraded },
            ]}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6">
        {squads.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <UsersRound className="mb-3 h-8 w-8 text-slate-300" />
            <div className="text-sm font-medium text-slate-800">暂无小队</div>
            <p className="mt-1 max-w-sm text-[13px] text-[#5a6779]">
              创建小队后，可将个人 Claw、平台 Claw 与多智能体组组合为项目执行单元
            </p>
            <Button
              type="button"
              className="mt-4 bg-[#2773ff] hover:bg-[#1f63e0]"
              onClick={() => setCreateOpen(true)}
            >
              创建小队
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {squads.map((squad) => {
              const leader = getActor(squad.leaderActorId);
              const resolved = getSquad(squad.id) ?? squad;
              const humanCount = getDerivedHumanMembers(resolved).length;
              const agentCount = resolved.agentMembers.length;
              return (
                <Link
                  key={squad.id}
                  href={`/my-claw/workspaces/${workspaceId}/projects/${projectId}/squads/${squad.id}`}
                  className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <ActorAvatar
                        name={resolved.name}
                        type="squad"
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold text-slate-900">
                          {resolved.name}
                        </div>
                        <div className="truncate text-[12px] text-[#5a6779]">
                          Leader · {leader?.name ?? "未设置"}
                        </div>
                      </div>
                    </div>
                    <SquadStatusBadge status={resolved.status} />
                  </div>
                  <p className="mb-3 line-clamp-2 text-[12px] leading-5 text-[#5a6779]">
                    {resolved.description || "暂无描述"}
                  </p>
                  <div className="mb-3 flex -space-x-1.5">
                    {resolved.agentMembers.slice(0, 5).map((member) => {
                      const actor = getActor(member.actorId);
                      return (
                        <ActorAvatar
                          key={member.actorId}
                          name={actor?.name ?? member.actorId}
                          type={actor?.type}
                          size="sm"
                          className="ring-2 ring-white"
                        />
                      );
                    })}
                    {resolved.agentMembers.length > 5 ? (
                      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] text-[#5a6779] ring-2 ring-white">
                        +{resolved.agentMembers.length - 5}
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-1 text-[11px] text-[#5a6779]">
                    <div>
                      Human {humanCount} · Agent {agentCount}
                    </div>
                    <div className="truncate">
                      {typeDistribution(resolved, getActor) || "暂无类型分布"}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>活跃 Issue {resolved.activeIssueCount}</span>
                      <span>{formatRelativeTime(resolved.updatedAt)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <SquadCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        workspaceId={workspaceId}
        projectId={projectId}
      />
    </div>
  );
}
