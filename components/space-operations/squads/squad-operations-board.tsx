"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ListTodo,
  Search,
  UsersRound,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ACTOR_TYPE_LABELS,
  SQUAD_STATUS_LABELS,
  type AgentActorType,
  type Squad,
} from "@/lib/mock/my-claw/collaboration";
import {
  CollaborationProvider,
  useCollaboration,
} from "@/components/my-claw/collaboration/collaboration-provider";
import { ActorAvatar } from "@/components/my-claw/collaboration/shared/actor-avatar";
import { formatRelativeTime } from "@/components/my-claw/collaboration/shared/format";
import { SquadStatusBadge } from "@/components/my-claw/collaboration/shared/squad-status-badge";
import { SquadDetailDrawer } from "./squad-detail-drawer";

function typeDistributionLabel(
  squad: Squad,
  getActor: (id: string) => { type: AgentActorType; name: string } | undefined
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

function SquadOperationsBoardInner() {
  const { state, getWorkspace, getProject, getActor, getDerivedHumanMembers } =
    useCollaboration();
  const [query, setQuery] = useState("");
  const [workspaceFilter, setWorkspaceFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [leaderTypeFilter, setLeaderTypeFilter] = useState("all");
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);

  const metrics = useMemo(() => {
    const squads = state.squads;
    return {
      total: squads.length,
      ready: squads.filter((s) => s.status === "ready").length,
      running: squads.filter((s) => s.status === "running").length,
      degraded: squads.filter((s) => s.status === "degraded").length,
      activeIssues: squads.reduce((sum, s) => sum + s.activeIssueCount, 0),
    };
  }, [state.squads]);

  const projectOptions = useMemo(() => {
    if (workspaceFilter === "all") return state.projects;
    return state.projects.filter(
      (project) => project.workspaceId === workspaceFilter
    );
  }, [state.projects, workspaceFilter]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.squads.filter((squad) => {
      if (workspaceFilter !== "all" && squad.workspaceId !== workspaceFilter) {
        return false;
      }
      if (projectFilter !== "all" && squad.projectId !== projectFilter) {
        return false;
      }
      if (statusFilter !== "all" && squad.status !== statusFilter) return false;
      const leader = getActor(squad.leaderActorId);
      if (leaderTypeFilter !== "all" && leader?.type !== leaderTypeFilter) {
        return false;
      }
      if (!q) return true;
      return (
        squad.name.toLowerCase().includes(q) ||
        (leader?.name.toLowerCase().includes(q) ?? false) ||
        (getProject(squad.projectId)?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [
    state.squads,
    query,
    workspaceFilter,
    projectFilter,
    statusFilter,
    leaderTypeFilter,
    getActor,
    getProject,
  ]);

  const metricCards = [
    {
      key: "total",
      label: "Squad 总数",
      value: metrics.total,
      icon: UsersRound,
    },
    {
      key: "ready",
      label: "Ready",
      value: metrics.ready,
      icon: CheckCircle2,
    },
    {
      key: "running",
      label: "Running",
      value: metrics.running,
      icon: PlayCircle,
    },
    {
      key: "degraded",
      label: "Degraded",
      value: metrics.degraded,
      icon: AlertTriangle,
    },
    {
      key: "activeIssues",
      label: "Active Issues",
      value: metrics.activeIssues,
      icon: ListTodo,
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h2 className="text-[18px] font-semibold text-slate-900">Squad 看板</h2>
        <p className="mt-1 text-sm text-[#5a6779]">
          运营只读查看小队组成与运行态势；多智能体 ≠ Squad
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="rounded-lg border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm"
            >
              <div className="mb-2 flex items-center gap-1.5 text-sm text-[#5a6779]">
                <Icon className="h-3.5 w-3.5 text-[#2773ff]/80" />
                {card.label}
              </div>
              <div className="text-2xl font-semibold tracking-tight text-slate-900">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索小队 / Leader / 项目"
            className="pl-8"
          />
        </div>
        <Select
          value={workspaceFilter}
          onValueChange={(value) => {
            setWorkspaceFilter(value);
            setProjectFilter("all");
          }}
          className="w-full lg:w-48"
          options={[
            { value: "all", label: "全部空间" },
            ...state.workspaces.map((workspace) => ({
              value: workspace.id,
              label: workspace.name,
            })),
          ]}
        />
        <Select
          value={projectFilter}
          onValueChange={setProjectFilter}
          className="w-full lg:w-44"
          options={[
            { value: "all", label: "全部项目" },
            ...projectOptions.map((project) => ({
              value: project.id,
              label: project.name,
            })),
          ]}
        />
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="w-full lg:w-36"
          options={[
            { value: "all", label: "全部状态" },
            { value: "ready", label: SQUAD_STATUS_LABELS.ready },
            { value: "running", label: SQUAD_STATUS_LABELS.running },
            { value: "degraded", label: SQUAD_STATUS_LABELS.degraded },
          ]}
        />
        <Select
          value={leaderTypeFilter}
          onValueChange={setLeaderTypeFilter}
          className="w-full lg:w-44"
          options={[
            { value: "all", label: "Leader 类型" },
            ...(Object.keys(ACTOR_TYPE_LABELS) as AgentActorType[]).map(
              (type) => ({
                value: type,
                label: ACTOR_TYPE_LABELS[type],
              })
            ),
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        {rows.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-[#5a6779]">
            暂无匹配的 Squad
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f8f9fb]">
                <TableHead>Squad 名称</TableHead>
                <TableHead>所属空间</TableHead>
                <TableHead>所属项目</TableHead>
                <TableHead>Leader</TableHead>
                <TableHead>Human / Agent</TableHead>
                <TableHead>类型分布</TableHead>
                <TableHead>Active Issue</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((squad) => {
                const leader = getActor(squad.leaderActorId);
                return (
                  <TableRow key={squad.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ActorAvatar
                          name={squad.name}
                          type="squad"
                          size="sm"
                        />
                        <span className="font-medium text-slate-900">
                          {squad.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#5a6779]">
                      {getWorkspace(squad.workspaceId)?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-[#5a6779]">
                      {getProject(squad.projectId)?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <ActorAvatar
                          name={leader?.name ?? "—"}
                          type={leader?.type}
                          size="sm"
                        />
                        <span className="text-[#5a6779]">
                          {leader?.name ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-[12px] text-slate-800">
                          Human {getDerivedHumanMembers(squad).length} · Agent{" "}
                          {squad.agentMembers.length}
                        </div>
                        <div className="flex -space-x-1.5">
                          {squad.agentMembers.slice(0, 4).map((member) => {
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
                          {squad.agentMembers.length > 4 ? (
                            <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] text-[#5a6779] ring-2 ring-white">
                              +{squad.agentMembers.length - 4}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <div className="truncate text-[12px] text-[#5a6779]">
                        {typeDistributionLabel(squad, getActor) || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-800">
                      {squad.activeIssueCount}
                    </TableCell>
                    <TableCell>
                      <SquadStatusBadge status={squad.status} />
                    </TableCell>
                    <TableCell className="text-[#5a6779]">
                      {formatRelativeTime(squad.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSquad(squad)}
                      >
                        查看详情
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <SquadDetailDrawer
        squad={selectedSquad}
        open={Boolean(selectedSquad)}
        onOpenChange={(open) => {
          if (!open) setSelectedSquad(null);
        }}
      />
    </div>
  );
}

export function SquadOperationsBoard() {
  return (
    <CollaborationProvider>
      <SquadOperationsBoardInner />
    </CollaborationProvider>
  );
}
