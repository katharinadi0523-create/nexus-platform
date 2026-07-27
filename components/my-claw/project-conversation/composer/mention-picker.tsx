"use client";

import { cn } from "@/lib/utils";
import {
  actorTypeLabel,
  runtimeStatusLabel,
  type AgentActor,
  type CollaborationUser,
  type ProjectMember,
} from "@/lib/mock/my-claw/project-conversation";
import { ActorAvatar } from "../shared/actor-avatar";

export type MentionTarget =
  | { kind: "human"; id: string; label: string }
  | { kind: "agent"; id: string; label: string };

interface MentionPickerProps {
  members: ProjectMember[];
  users: CollaborationUser[];
  actors: AgentActor[];
  query: string;
  selectedHumanIds: string[];
  selectedActorIds: string[];
  onSelect: (target: MentionTarget) => void;
}

interface GroupItem {
  target: MentionTarget;
  subtitle: string;
  disabled?: boolean;
  runtimeStatus?: AgentActor["runtimeStatus"];
}

function matchesQuery(label: string, query: string) {
  return !query || label.toLowerCase().includes(query);
}

export function MentionPicker({
  members,
  users,
  actors,
  query,
  selectedHumanIds,
  selectedActorIds,
  onSelect,
}: MentionPickerProps) {
  const q = query.trim().toLowerCase();

  const humanItems: GroupItem[] = [];
  for (const member of members) {
    if (member.kind !== "human" || member.state !== "active") continue;
    if (selectedHumanIds.includes(member.userId)) continue;
    const user = users.find((u) => u.id === member.userId);
    const label = user?.name ?? member.userId;
    if (!matchesQuery(label, q)) continue;
    humanItems.push({
      target: { kind: "human", id: member.userId, label },
      subtitle: user?.title ?? "成员",
    });
  }

  const buildAgentItems = (type: AgentActor["type"]): GroupItem[] => {
    const items: GroupItem[] = [];
    for (const member of members) {
      if (member.kind !== "agent" || member.actorType !== type) continue;
      if (selectedActorIds.includes(member.actorId)) continue;
      const actor = actors.find((a) => a.id === member.actorId);
      if (!actor) continue;
      if (!matchesQuery(actor.name, q)) continue;
      const executable = member.state !== "pending_consent";
      items.push({
        target: { kind: "agent", id: actor.id, label: actor.name },
        subtitle: [
          actorTypeLabel(actor.type),
          runtimeStatusLabel(actor.runtimeStatus),
          !executable ? "待授权" : null,
        ]
          .filter(Boolean)
          .join(" · "),
        disabled: !executable,
        runtimeStatus: actor.runtimeStatus,
      });
    }
    return items;
  };

  const groups: Array<{ title: string; items: GroupItem[] }> = [
    { title: "Human", items: humanItems },
    { title: "个人 Claw", items: buildAgentItems("personal_claw") },
    { title: "平台 Claw", items: buildAgentItems("platform_claw") },
    { title: "多智能体组", items: buildAgentItems("multi_agent_group") },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-4 text-center text-[12px] text-[#5a6779] shadow-sm">
        无匹配成员
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-md">
      <div className="max-h-[280px] overflow-y-auto py-1">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="px-3 pb-1 pt-2 text-[11px] font-medium text-[#5a6779]">
              {group.title}
            </div>
            {group.items.map((item) => (
              <button
                key={`${item.target.kind}-${item.target.id}`}
                type="button"
                disabled={item.disabled}
                onClick={() => onSelect(item.target)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors",
                  item.disabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-[#f8f9fb]"
                )}
              >
                <ActorAvatar
                  kind={item.target.kind}
                  name={item.target.label}
                  initials={
                    item.target.kind === "human"
                      ? users.find((u) => u.id === item.target.id)?.initials
                      : undefined
                  }
                  runtimeStatus={item.runtimeStatus}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-800">
                    {item.target.label}
                  </div>
                  <div className="truncate text-[11px] text-[#5a6779]">
                    {item.subtitle}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
