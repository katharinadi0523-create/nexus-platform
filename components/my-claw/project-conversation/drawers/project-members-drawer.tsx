"use client";

import { Button } from "@/components/ui/button";
import {
  actorTypeLabel,
  runtimeStatusLabel,
} from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "../project-conversation-provider";
import { ActorAvatar } from "../shared/actor-avatar";
import { DrawerShell } from "../shared/drawer-shell";

interface ProjectMembersDrawerProps {
  projectId: string;
  onClose: () => void;
}

export function ProjectMembersDrawer({
  projectId,
  onClose,
}: ProjectMembersDrawerProps) {
  const {
    getProject,
    getMembers,
    getUser,
    getActor,
    removeMember,
    resolvePersonalClawConsent,
    openDrawer,
    currentUserId,
  } = useProjectConversation();

  const project = getProject(projectId);
  const members = getMembers(projectId);
  const archived = project?.status === "archived";

  const humans = members.filter((m) => m.kind === "human");
  const agents = members.filter((m) => m.kind === "agent");

  return (
    <DrawerShell
      title="项目成员"
      onClose={onClose}
      footer={
        !archived ? (
          <Button
            type="button"
            size="sm"
            className="w-full bg-[#2773ff] hover:bg-[#1f63e0]"
            onClick={() => openDrawer("add_member")}
          >
            添加成员
          </Button>
        ) : null
      }
    >
      <section className="mb-5">
        <h3 className="mb-2 text-[12px] font-semibold text-[#5a6779]">
          Human（{humans.length}）
        </h3>
        <ul className="space-y-1.5">
          {humans.map((member) => {
            if (member.kind !== "human") return null;
            const user = getUser(member.userId);
            return (
              <li
                key={member.userId}
                className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-[#f8f9fb]"
              >
                <ActorAvatar
                  kind="human"
                  name={user?.name ?? "成员"}
                  initials={user?.initials}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-slate-800">
                    {user?.name ?? member.userId}
                    {member.role === "owner" ? (
                      <span className="ml-1.5 text-[11px] font-normal text-[#5a6779]">
                        Owner
                      </span>
                    ) : null}
                  </div>
                  <div className="truncate text-[11px] text-[#5a6779]">
                    {user?.title ?? "成员"} ·{" "}
                    {member.state === "invited" ? "待加入" : "已加入"}
                  </div>
                </div>
                {!archived &&
                member.role !== "owner" &&
                member.userId !== currentUserId ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[12px] text-[#5a6779]"
                    onClick={() => removeMember(projectId, member.userId)}
                  >
                    移除
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-[12px] font-semibold text-[#5a6779]">
          Agent（{agents.length}）
        </h3>
        <ul className="space-y-1.5">
          {agents.map((member) => {
            if (member.kind !== "agent") return null;
            const actor = getActor(member.actorId);
            const needsConsent =
              member.state === "pending_consent" &&
              actor?.ownerUserId === currentUserId;

            return (
              <li
                key={member.actorId}
                className="rounded-md px-2 py-2 hover:bg-[#f8f9fb]"
              >
                <div className="flex items-center gap-2">
                  <ActorAvatar
                    kind="agent"
                    name={actor?.name ?? "Agent"}
                    runtimeStatus={actor?.runtimeStatus}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-slate-800">
                      {actor?.name ?? member.actorId}
                    </div>
                    <div className="truncate text-[11px] text-[#5a6779]">
                      {actor ? actorTypeLabel(actor.type) : member.actorType}
                      {actor
                        ? ` · ${runtimeStatusLabel(actor.runtimeStatus)}`
                        : ""}
                      {member.state === "pending_consent" ? " · 待授权" : ""}
                    </div>
                  </div>
                  {!archived ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[12px] text-[#5a6779]"
                      onClick={() => removeMember(projectId, member.actorId)}
                    >
                      移除
                    </Button>
                  ) : null}
                </div>
                {needsConsent ? (
                  <div className="mt-2 flex gap-2 pl-10">
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 bg-[#2773ff] px-2.5 text-[12px] hover:bg-[#1f63e0]"
                      onClick={() =>
                        resolvePersonalClawConsent(
                          projectId,
                          member.actorId,
                          "accept"
                        )
                      }
                    >
                      同意接入
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-[12px]"
                      onClick={() =>
                        resolvePersonalClawConsent(
                          projectId,
                          member.actorId,
                          "reject"
                        )
                      }
                    >
                      拒绝
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </DrawerShell>
  );
}
