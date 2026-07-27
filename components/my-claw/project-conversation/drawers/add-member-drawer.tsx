"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  actorTypeLabel,
  runtimeStatusLabel,
} from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "../project-conversation-provider";
import { ActorAvatar } from "../shared/actor-avatar";
import { DrawerShell } from "../shared/drawer-shell";

interface AddMemberDrawerProps {
  projectId: string;
  onClose: () => void;
}

export function AddMemberDrawer({
  projectId,
  onClose,
}: AddMemberDrawerProps) {
  const {
    state,
    getMembers,
    getProject,
    addHumanMember,
    addAgentMember,
  } = useProjectConversation();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"human" | "agent">("human");

  const project = getProject(projectId);
  const members = getMembers(projectId);
  const existingHumanIds = members
    .filter((m): m is Extract<(typeof members)[number], { kind: "human" }> =>
      m.kind === "human"
    )
    .map((m) => m.userId);
  const existingActorIds = members
    .filter((m): m is Extract<(typeof members)[number], { kind: "agent" }> =>
      m.kind === "agent"
    )
    .map((m) => m.actorId);

  const q = query.trim().toLowerCase();

  const availableHumans = useMemo(() => {
    if (!project) return [];
    return state.users.filter(
      (user) =>
        user.workspaceIds.includes(project.workspaceId) &&
        !existingHumanIds.includes(user.id) &&
        (!q ||
          user.name.toLowerCase().includes(q) ||
          user.title.toLowerCase().includes(q))
    );
  }, [existingHumanIds, project, q, state.users]);

  const availableAgents = useMemo(() => {
    if (!project) return [];
    return state.actors.filter(
      (actor) =>
        (!actor.workspaceId || actor.workspaceId === project.workspaceId) &&
        !existingActorIds.includes(actor.id) &&
        (!q || actor.name.toLowerCase().includes(q))
    );
  }, [existingActorIds, project, q, state.actors]);

  if (project?.status === "archived") {
    return (
      <DrawerShell title="添加成员" onClose={onClose}>
        <p className="text-[13px] text-[#5a6779]">
          项目已归档，无法添加成员
        </p>
      </DrawerShell>
    );
  }

  return (
    <DrawerShell title="添加成员" onClose={onClose}>
      <div className="mb-3 flex gap-1 rounded-lg bg-[#f8f9fb] p-1">
        <button
          type="button"
          onClick={() => setTab("human")}
          className={`flex-1 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors ${
            tab === "human"
              ? "bg-white text-[#2773ff] shadow-sm"
              : "text-[#5a6779]"
          }`}
        >
          Human
        </button>
        <button
          type="button"
          onClick={() => setTab("agent")}
          className={`flex-1 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors ${
            tab === "agent"
              ? "bg-white text-[#2773ff] shadow-sm"
              : "text-[#5a6779]"
          }`}
        >
          Agent
        </button>
      </div>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={tab === "human" ? "搜索成员…" : "搜索 Agent…"}
        className="mb-2 h-8 border-[#e2e8f0] bg-[#f8f9fb] text-[13px] shadow-none"
      />

      <p className="mb-3 text-[11px] leading-4 text-[#5a6779]">
        {tab === "human"
          ? "列表按当前 Workspace 成员范围拉取，已在本 Project 的成员不会出现。"
          : "列表按当前 Workspace 可接入的 Agent 拉取，已加入本 Project 的不会出现。"}
      </p>

      {tab === "human" ? (
        <ul className="space-y-1">
          {availableHumans.length === 0 ? (
            <li className="py-8 text-center text-[12px] text-[#5a6779]">
              没有可添加的成员
            </li>
          ) : (
            availableHumans.map((user) => (
              <li
                key={user.id}
                className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-[#f8f9fb]"
              >
                <ActorAvatar
                  kind="human"
                  name={user.name}
                  initials={user.initials}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-slate-800">
                    {user.name}
                  </div>
                  <div className="truncate text-[11px] text-[#5a6779]">
                    {user.title}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 bg-[#2773ff] px-2.5 text-[12px] hover:bg-[#1f63e0]"
                  onClick={() => addHumanMember(projectId, user.id)}
                >
                  添加
                </Button>
              </li>
            ))
          )}
        </ul>
      ) : (
        <ul className="space-y-1">
          {availableAgents.length === 0 ? (
            <li className="py-8 text-center text-[12px] text-[#5a6779]">
              没有可添加的 Agent
            </li>
          ) : (
            availableAgents.map((actor) => (
              <li
                key={actor.id}
                className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-[#f8f9fb]"
              >
                <ActorAvatar
                  kind="agent"
                  name={actor.name}
                  runtimeStatus={actor.runtimeStatus}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-slate-800">
                    {actor.name}
                  </div>
                  <div className="truncate text-[11px] text-[#5a6779]">
                    {actorTypeLabel(actor.type)} ·{" "}
                    {runtimeStatusLabel(actor.runtimeStatus)}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 bg-[#2773ff] px-2.5 text-[12px] hover:bg-[#1f63e0]"
                  onClick={() => addAgentMember(projectId, actor.id)}
                >
                  添加
                </Button>
              </li>
            ))
          )}
        </ul>
      )}
    </DrawerShell>
  );
}
