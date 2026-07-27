"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectMessage } from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "./project-conversation-provider";
import { ProjectConversationHeader } from "./project-conversation-header";
import { ProjectComposer } from "./composer/project-composer";
import { MessageList, type MessageListHandle } from "./messages/message-list";
import { ProjectInfoDrawer } from "./drawers/project-info-drawer";
import { ProjectMembersDrawer } from "./drawers/project-members-drawer";
import { ProjectFilesDrawer } from "./drawers/project-files-drawer";
import { AddMemberDrawer } from "./drawers/add-member-drawer";
import { ExecutionDetailDrawer } from "./execution/execution-detail-drawer";

interface ProjectConversationPageProps {
  workspaceId: string;
  projectId: string;
  messageId?: string | null;
}

export function ProjectConversationPage({
  workspaceId,
  projectId,
  messageId,
}: ProjectConversationPageProps) {
  const {
    getProject,
    getMessages,
    state,
    setHighlightedMessage,
    closeDrawer,
  } = useProjectConversation();

  const [quotedMessage, setQuotedMessage] = useState<ProjectMessage | null>(
    null
  );
  const listRef = useRef<MessageListHandle>(null);
  const project = getProject(projectId);
  const messages = getMessages(projectId);

  useEffect(() => {
    if (messageId) {
      setHighlightedMessage(messageId);
    }
  }, [messageId, setHighlightedMessage]);

  useEffect(() => {
    if (
      !state.activeDrawer &&
      state.scrollAnchorMessageId &&
      listRef.current
    ) {
      const timer = window.setTimeout(() => {
        listRef.current?.scrollToMessage(state.scrollAnchorMessageId!);
      }, 60);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state.activeDrawer, state.scrollAnchorMessageId]);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-[#5a6779]">
        Project 不存在或无权访问
      </div>
    );
  }

  const drawerOpen = Boolean(state.activeDrawer);

  const renderDrawer = () => {
    switch (state.activeDrawer) {
      case "info":
        return (
          <ProjectInfoDrawer projectId={projectId} onClose={closeDrawer} />
        );
      case "members":
        return (
          <ProjectMembersDrawer projectId={projectId} onClose={closeDrawer} />
        );
      case "files":
        return (
          <ProjectFilesDrawer
            projectId={projectId}
            onClose={closeDrawer}
            onJumpToMessage={(id) => {
              setHighlightedMessage(id);
              listRef.current?.scrollToMessage(id);
            }}
          />
        );
      case "add_member":
        return (
          <AddMemberDrawer projectId={projectId} onClose={closeDrawer} />
        );
      case "execution":
        return state.activeInvocationId ? (
          <ExecutionDetailDrawer
            invocationId={state.activeInvocationId}
            onClose={closeDrawer}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f8f9fb]">
        <ProjectConversationHeader
          workspaceId={workspaceId}
          projectId={projectId}
        />
        <MessageList
          ref={listRef}
          messages={messages}
          highlightedMessageId={state.highlightedMessageId}
          onQuote={setQuotedMessage}
        />
        <ProjectComposer
          projectId={projectId}
          quotedMessage={quotedMessage}
          onClearQuote={() => setQuotedMessage(null)}
        />
      </div>

      {drawerOpen ? (
        <div className="pointer-events-none absolute inset-0 z-20 xl:pointer-events-auto xl:static xl:z-auto xl:flex xl:h-full xl:w-[460px] xl:shrink-0">
          <div className="pointer-events-auto relative h-full w-full">
            {renderDrawer()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
