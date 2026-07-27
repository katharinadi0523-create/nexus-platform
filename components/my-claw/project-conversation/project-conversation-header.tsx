"use client";

import { FileStack, Info, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectConversation } from "./project-conversation-provider";
import { ActorAvatar } from "./shared/actor-avatar";

interface ProjectConversationHeaderProps {
  workspaceId: string;
  projectId: string;
}

export function ProjectConversationHeader({
  workspaceId,
  projectId,
}: ProjectConversationHeaderProps) {
  const {
    getProject,
    getWorkspace,
    getMembers,
    getUser,
    getActor,
    openDrawer,
  } = useProjectConversation();

  const project = getProject(projectId);
  const workspace = getWorkspace(workspaceId);
  const members = getMembers(projectId);

  if (!project) return null;

  const humans = members
    .filter((m) => m.kind === "human")
    .map((m) => getUser(m.userId))
    .filter(Boolean);
  const agents = members
    .filter((m) => m.kind === "agent")
    .map((m) => getActor(m.actorId))
    .filter(Boolean);

  return (
    <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#eef2f6] bg-white px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-[16px] font-semibold text-slate-900">
            {project.name}
          </h1>
          <span
            className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
              project.status === "active"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {project.status === "active" ? "进行中" : "已归档"}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[12px] text-[#5a6779]">
          {workspace?.name ?? workspaceId}
        </div>
        {project.description ? (
          <p className="mt-1 line-clamp-1 text-[12px] text-[#5a6779]">
            {project.description}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => openDrawer("members")}
          className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-[#f8f9fb]"
          title="成员"
        >
          <div className="flex -space-x-1.5">
            {humans.slice(0, 3).map((user) => (
              <ActorAvatar
                key={user!.id}
                kind="human"
                name={user!.name}
                initials={user!.initials}
                size="sm"
                className="ring-1 ring-white"
              />
            ))}
          </div>
          <span className="text-[12px] text-[#5a6779]">{humans.length}</span>
        </button>

        <button
          type="button"
          onClick={() => openDrawer("members")}
          className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-[#f8f9fb]"
          title="Agent"
        >
          <div className="flex -space-x-1.5">
            {agents.slice(0, 3).map((actor) => (
              <ActorAvatar
                key={actor!.id}
                kind="agent"
                name={actor!.name}
                runtimeStatus={actor!.runtimeStatus}
                size="sm"
                className="ring-1 ring-white"
              />
            ))}
          </div>
          <span className="text-[12px] text-[#5a6779]">{agents.length}</span>
        </button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-[#e2e8f0] px-2.5 text-[12px]"
          onClick={() => openDrawer("add_member")}
          disabled={project.status === "archived"}
        >
          <UserPlus className="h-3.5 w-3.5" />
          添加
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-[#e2e8f0] px-2.5 text-[12px]"
          onClick={() => openDrawer("files")}
        >
          <FileStack className="h-3.5 w-3.5" />
          文件
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-[#e2e8f0] px-2.5 text-[12px]"
          onClick={() => openDrawer("info")}
        >
          <Info className="h-3.5 w-3.5" />
          信息
        </Button>
      </div>
    </header>
  );
}
