"use client";

import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectConversation } from "./project-conversation-provider";
import { ProjectConversationListItem } from "./project-conversation-list-item";

interface ProjectConversationListProps {
  projectId: string;
  activeConversationId?: string | null;
  onSelect: (conversationId: string) => void;
  onCreate: () => void;
}

export function ProjectConversationList({
  projectId,
  activeConversationId,
  onSelect,
  onCreate,
}: ProjectConversationListProps) {
  const { getVisibleConversations, currentUserId, getProject } =
    useProjectConversation();
  const project = getProject(projectId);
  const conversations = getVisibleConversations(projectId, currentUserId);

  if (!project) return null;

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[14px] font-medium text-slate-800">暂无可见会话</p>
        <p className="max-w-sm text-[12px] text-[#5a6779]">
          创建会话后即可开始协作。会话消息仅对参与者可见，事项会汇总到 Project
          看板。
        </p>
        <Button
          type="button"
          className="h-9 bg-[#2773ff] px-4 text-[13px] hover:bg-[#1f63e0]"
          onClick={onCreate}
          disabled={project.status === "archived"}
        >
          <MessageSquarePlus className="h-4 w-4" />
          新建会话
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[#eef2f6] px-4 py-2.5">
        <div>
          <div className="text-[13px] font-semibold text-slate-900">会话</div>
          <div className="text-[11px] text-[#5a6779]">
            共 {conversations.length} 个可见会话
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 bg-[#2773ff] px-2.5 text-[12px] hover:bg-[#1f63e0]"
          onClick={onCreate}
          disabled={project.status === "archived"}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          新建会话
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {conversations.map((conversation) => (
          <ProjectConversationListItem
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === activeConversationId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
