"use client";

import { FileStack, Info, UserPlus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectConversation } from "./project-conversation-provider";
import { ActorAvatar } from "./shared/actor-avatar";
import type { ProjectPageView } from "./project-conversation-page";
import { cn } from "@/lib/utils";

interface ProjectConversationHeaderProps {
  workspaceId?: string;
  projectId: string;
  activeView?: ProjectPageView;
  onChangeView?: (view: ProjectPageView) => void;
}

export function ProjectConversationHeader({
  projectId,
  activeView = "conversation",
  onChangeView,
}: ProjectConversationHeaderProps) {
  const {
    getProject,
    getMembers,
    getUser,
    getActor,
    getFiles,
    getSharedTools,
    openDrawer,
  } = useProjectConversation();

  const project = getProject(projectId);
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
  const fileCount = getFiles(projectId).length;
  const toolCount = getSharedTools(projectId).length;

  return (
    <header className="flex shrink-0 flex-col border-b border-[#eef2f6] bg-white">
      <div className="flex items-start justify-between gap-4 px-5 py-3.5">
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
          {project.description ? (
            <p className="mt-1 line-clamp-1 text-[12px] text-[#5a6779]">
              {project.description}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => openDrawer("members")}
            className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-[#f8f9fb]"
            title="Human"
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
            <span className="text-[12px] text-[#5a6779]">
              Human {humans.length}
            </span>
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
            <span className="text-[12px] text-[#5a6779]">
              Agent {agents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => openDrawer("info")}
            className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[12px] text-[#5a6779] transition-colors hover:bg-[#f8f9fb]"
            title="共享工具"
          >
            <Wrench className="h-3.5 w-3.5" />
            工具 {toolCount}
          </button>

          <button
            type="button"
            onClick={() => openDrawer("files")}
            className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[12px] text-[#5a6779] transition-colors hover:bg-[#f8f9fb]"
            title="文件"
          >
            <FileStack className="h-3.5 w-3.5" />
            文件 {fileCount}
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
            onClick={() => openDrawer("info")}
          >
            <Info className="h-3.5 w-3.5" />
            信息
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 px-5 pb-2">
        {(
          [
            { id: "conversation", label: "会话" },
            { id: "issues", label: "事项" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeView?.(tab.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              activeView === tab.id
                ? "bg-[#e8f0fb] text-[#2773ff]"
                : "text-[#5a6779] hover:bg-slate-50 hover:text-slate-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
