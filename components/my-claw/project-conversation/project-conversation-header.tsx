"use client";

import Link from "next/link";
import {
  FileStack,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectConversation } from "./project-conversation-provider";
import { ActorAvatar } from "./shared/actor-avatar";

interface ProjectConversationHeaderProps {
  projectId: string;
  conversationId: string;
}

/** Lightweight header for conversation pages only. */
export function ProjectConversationHeader({
  projectId,
  conversationId,
}: ProjectConversationHeaderProps) {
  const {
    getProject,
    getConversation,
    getUser,
    getActor,
    getConversationFiles,
    openDrawer,
  } = useProjectConversation();

  const project = getProject(projectId);
  const conversation = getConversation(conversationId);

  if (!project || !conversation) return null;

  const humans = conversation.humanMemberIds
    .map((id) => getUser(id))
    .filter(Boolean);
  const agents = conversation.agentBindingIds
    .map((id) => getActor(id))
    .filter(Boolean);
  const conversationFileCount = getConversationFiles(conversationId).length;

  return (
    <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#eef2f6] bg-white px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-[#5a6779]">
          <Link
            href={`/my-claw/projects/${projectId}`}
            className="hover:text-[#2773ff]"
          >
            {project.name}
          </Link>
          <span className="mx-1">/</span>
          <span>会话</span>
        </div>
        <h1 className="mt-0.5 truncate text-[16px] font-semibold text-slate-900">
          {conversation.name}
        </h1>
        <p className="mt-1 text-[12px] text-[#5a6779]">
          文件归属：
          {conversation.defaultArtifactScope === "conversation"
            ? "仅属于当前会话（创建后不可更改）"
            : "公开到 Project（创建后不可更改）"}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-3 rounded-lg px-1.5 py-1">
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
          <div className="flex -space-x-1.5">
            {agents.slice(0, 2).map((actor) => (
              <ActorAvatar
                key={actor!.id}
                kind="agent"
                name={actor!.name}
                size="sm"
                className="ring-1 ring-white"
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => openDrawer("conversation_files")}
          className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[12px] text-[#5a6779] transition-colors hover:bg-[#f8f9fb]"
        >
          <FileStack className="h-3.5 w-3.5" />
          会话文件 {conversationFileCount}
        </button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-[#e2e8f0] px-2.5 text-[12px]"
          onClick={() => openDrawer("conversation_settings")}
        >
          <Settings2 className="h-3.5 w-3.5" />
          会话设置
        </Button>
      </div>
    </header>
  );
}
