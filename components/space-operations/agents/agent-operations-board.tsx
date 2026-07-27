"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Search,
  Wifi,
  WifiOff,
  AlertCircle,
  Loader,
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
  type AgentActor,
  type AgentActorType,
  type ActorRuntimeStatus,
} from "@/lib/mock/my-claw/collaboration";
import { CollaborationProvider, useCollaboration } from "@/components/my-claw/collaboration/collaboration-provider";
import { ActorAvatar } from "@/components/my-claw/collaboration/shared/actor-avatar";
import { ActorTypeBadge } from "@/components/my-claw/collaboration/shared/actor-type-badge";
import { formatRelativeTime } from "@/components/my-claw/collaboration/shared/format";
import { AgentDetailDrawer } from "./agent-detail-drawer";

const RUNTIME_LABELS: Record<ActorRuntimeStatus, string> = {
  online: "Online",
  busy: "Busy",
  offline: "Offline",
  error: "Error",
};

const RUNTIME_STYLES: Record<ActorRuntimeStatus, string> = {
  online: "border-emerald-200 bg-emerald-50 text-emerald-700",
  busy: "border-blue-200 bg-blue-50 text-blue-700",
  offline: "border-slate-200 bg-slate-50 text-slate-600",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

function AgentOperationsBoardInner() {
  const { state, getWorkspace, getUser, getProject } = useCollaboration();
  const [query, setQuery] = useState("");
  const [workspaceFilter, setWorkspaceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [squadFilter, setSquadFilter] = useState("all");
  const [selectedActor, setSelectedActor] = useState<AgentActor | null>(null);

  const actorSquadMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const squad of state.squads) {
      for (const member of squad.agentMembers) {
        const list = map.get(member.actorId) ?? [];
        list.push(squad.name);
        map.set(member.actorId, list);
      }
    }
    return map;
  }, [state.squads]);

  const actorProjectLabels = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const actor of state.actors) {
      const fromActors = state.projects
        .filter((project) => project.actorIds.includes(actor.id))
        .map((project) => project.name);
      const fromSquads = state.squads
        .filter((squad) =>
          squad.agentMembers.some((member) => member.actorId === actor.id)
        )
        .map((squad) => getProject(squad.projectId)?.name)
        .filter((name): name is string => Boolean(name));
      map.set(actor.id, Array.from(new Set([...fromActors, ...fromSquads])));
    }
    return map;
  }, [state.actors, state.projects, state.squads, getProject]);

  const metrics = useMemo(() => {
    const actors = state.actors;
    return {
      total: actors.length,
      online: actors.filter((a) => a.runtimeStatus === "online").length,
      busy: actors.filter((a) => a.runtimeStatus === "busy").length,
      offline: actors.filter((a) => a.runtimeStatus === "offline").length,
      error: actors.filter((a) => a.runtimeStatus === "error").length,
      activeRuns: actors.reduce((sum, a) => sum + a.activeRunCount, 0),
    };
  }, [state.actors]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.actors.filter((actor) => {
      if (workspaceFilter !== "all" && actor.workspaceId !== workspaceFilter) {
        return false;
      }
      if (typeFilter !== "all" && actor.type !== typeFilter) return false;
      if (statusFilter !== "all" && actor.runtimeStatus !== statusFilter) {
        return false;
      }
      const inSquad = (actorSquadMap.get(actor.id)?.length ?? 0) > 0;
      if (squadFilter === "in" && !inSquad) return false;
      if (squadFilter === "out" && inSquad) return false;
      if (!q) return true;
      const owner = actor.ownerUserId
        ? getUser(actor.ownerUserId)?.name ?? ""
        : "";
      return (
        actor.name.toLowerCase().includes(q) ||
        actor.sourceLabel.toLowerCase().includes(q) ||
        owner.toLowerCase().includes(q) ||
        ACTOR_TYPE_LABELS[actor.type].includes(query.trim())
      );
    });
  }, [
    state.actors,
    query,
    workspaceFilter,
    typeFilter,
    statusFilter,
    squadFilter,
    actorSquadMap,
    getUser,
  ]);

  const metricCards = [
    { key: "total", label: "AgentActor 总数", value: metrics.total, icon: Bot },
    { key: "online", label: "Online", value: metrics.online, icon: Wifi },
    { key: "busy", label: "Busy", value: metrics.busy, icon: Loader },
    { key: "offline", label: "Offline", value: metrics.offline, icon: WifiOff },
    {
      key: "error",
      label: "Error",
      value: metrics.error,
      icon: AlertCircle,
    },
    {
      key: "activeRuns",
      label: "Active Runs",
      value: metrics.activeRuns,
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h2 className="text-[18px] font-semibold text-slate-900">Agent 看板</h2>
        <p className="mt-1 text-sm text-[#5a6779]">
          查看组织空间内可执行 AgentActor 的运行态势（只读）
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
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
            placeholder="搜索名称 / 来源 / 所属用户"
            className="pl-8"
          />
        </div>
        <Select
          value={workspaceFilter}
          onValueChange={setWorkspaceFilter}
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
          value={typeFilter}
          onValueChange={setTypeFilter}
          className="w-full lg:w-44"
          options={[
            { value: "all", label: "全部类型" },
            ...(
              Object.keys(ACTOR_TYPE_LABELS) as AgentActorType[]
            ).map((type) => ({
              value: type,
              label: ACTOR_TYPE_LABELS[type],
            })),
          ]}
        />
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="w-full lg:w-36"
          options={[
            { value: "all", label: "全部状态" },
            { value: "online", label: "Online" },
            { value: "busy", label: "Busy" },
            { value: "offline", label: "Offline" },
            { value: "error", label: "Error" },
          ]}
        />
        <Select
          value={squadFilter}
          onValueChange={setSquadFilter}
          className="w-full lg:w-40"
          options={[
            { value: "all", label: "是否加入 Squad" },
            { value: "in", label: "已加入 Squad" },
            { value: "out", label: "未加入 Squad" },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        {rows.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-[#5a6779]">
            暂无匹配的 AgentActor
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f8f9fb]">
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>所属用户 / 来源</TableHead>
                <TableHead>组织空间</TableHead>
                <TableHead>参与项目</TableHead>
                <TableHead>所属 Squad</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>Active Run</TableHead>
                <TableHead>最近活动</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((actor) => {
                const owner = actor.ownerUserId
                  ? getUser(actor.ownerUserId)
                  : undefined;
                const squadNames = actorSquadMap.get(actor.id) ?? [];
                const projectNames = actorProjectLabels.get(actor.id) ?? [];
                return (
                  <TableRow key={actor.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ActorAvatar
                          name={actor.name}
                          type={actor.type}
                          size="sm"
                        />
                        <span className="font-medium text-slate-900">
                          {actor.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ActorTypeBadge type={actor.type} />
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <div className="truncate text-[#5a6779]">
                        {owner?.name ?? actor.sourceLabel}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#5a6779]">
                      {getWorkspace(actor.workspaceId)?.name ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[160px]">
                      <div className="truncate text-[#5a6779]">
                        {projectNames.join("、") || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[140px]">
                      <div className="truncate text-[#5a6779]">
                        {squadNames.join("、") || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${RUNTIME_STYLES[actor.runtimeStatus]}`}
                      >
                        {RUNTIME_LABELS[actor.runtimeStatus]}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-800">
                      {actor.activeRunCount}
                    </TableCell>
                    <TableCell className="text-[#5a6779]">
                      {formatRelativeTime(actor.lastActiveAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedActor(actor)}
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

      <AgentDetailDrawer
        actor={selectedActor}
        open={Boolean(selectedActor)}
        onOpenChange={(open) => {
          if (!open) setSelectedActor(null);
        }}
      />
    </div>
  );
}

export function AgentOperationsBoard() {
  return (
    <CollaborationProvider>
      <AgentOperationsBoardInner />
    </CollaborationProvider>
  );
}
