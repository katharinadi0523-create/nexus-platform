"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProjectMessage } from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "./project-conversation-provider";
import { ProjectConversationHeader } from "./project-conversation-header";
import { ProjectComposer } from "./composer/project-composer";
import { MessageList, type MessageListHandle } from "./messages/message-list";
import { ConversationSettingsDrawer } from "./conversation-settings-drawer";
import { ExecutionDetailDrawer } from "./execution/execution-detail-drawer";
import { ConversationFilesPanel } from "@/components/my-claw/project-files/project-files-panel";
import { ProjectIssueDetailDrawer } from "@/components/my-claw/project-issues/project-issue-detail-drawer";

interface ProjectConversationPageProps {
  projectId: string;
  conversationId: string;
  messageId?: string | null;
  issueId?: string | null;
}

export function ProjectConversationPage({
  projectId,
  conversationId,
  messageId,
  issueId,
}: ProjectConversationPageProps) {
  const {
    getProject,
    getMessages,
    getConversation,
    canAccessConversation,
    rememberVisitedConversation,
    currentUserId,
    state,
    setHighlightedMessage,
    closeDrawer,
    openIssueDrawer,
  } = useProjectConversation();

  const router = useRouter();
  const searchParams = useSearchParams();
  const [quotedMessage, setQuotedMessage] = useState<ProjectMessage | null>(
    null
  );
  const listRef = useRef<MessageListHandle>(null);
  const project = getProject(projectId);
  const conversation = getConversation(conversationId);
  const canAccess = canAccessConversation(conversationId, currentUserId);
  const messages = canAccess ? getMessages(projectId, conversationId) : [];

  useEffect(() => {
    if (canAccess) {
      rememberVisitedConversation(projectId, conversationId);
    }
  }, [
    canAccess,
    conversationId,
    projectId,
    rememberVisitedConversation,
  ]);

  useEffect(() => {
    if (messageId) {
      setHighlightedMessage(messageId);
    }
  }, [messageId, setHighlightedMessage]);

  useEffect(() => {
    if (issueId) {
      openIssueDrawer(issueId);
    }
  }, [issueId, openIssueDrawer]);

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

  if (!project || !conversation) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-[#5a6779]">
        会话不存在或无权访问
      </div>
    );
  }

  const drawerOpen = Boolean(state.activeDrawer);

  const renderDrawer = () => {
    switch (state.activeDrawer) {
      case "conversation_files":
        return (
          <ConversationFilesPanel
            conversationId={conversationId}
            onClose={closeDrawer}
            onJumpToMessage={(id) => {
              setHighlightedMessage(id);
              listRef.current?.scrollToMessage(id);
            }}
          />
        );
      case "conversation_settings":
        return (
          <ConversationSettingsDrawer
            conversationId={conversationId}
            onClose={closeDrawer}
          />
        );
      case "execution":
        return state.activeInvocationId ? (
          <ExecutionDetailDrawer
            invocationId={state.activeInvocationId}
            onClose={closeDrawer}
          />
        ) : null;
      case "issue":
        return state.activeIssueId ? (
          <ProjectIssueDetailDrawer
            issueId={state.activeIssueId}
            onClose={() => {
              closeDrawer();
              const params = new URLSearchParams(searchParams.toString());
              params.delete("issue");
              const qs = params.toString();
              router.replace(
                qs
                  ? `/my-claw/projects/${projectId}/conversations/${conversationId}?${qs}`
                  : `/my-claw/projects/${projectId}/conversations/${conversationId}`,
                { scroll: false }
              );
            }}
            onJumpToMessage={(id) => {
              setHighlightedMessage(id);
              window.setTimeout(() => {
                listRef.current?.scrollToMessage(id);
              }, 80);
            }}
            onOpenConversation={(id, msgId) => {
              const qs = msgId ? `?message=${msgId}` : "";
              router.push(
                `/my-claw/projects/${projectId}/conversations/${id}${qs}`
              );
            }}
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
          projectId={projectId}
          conversationId={conversationId}
        />

        {!canAccess ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-[13px] text-[#5a6779]">
            无权访问该会话消息。相关事项仍可在 Project 事项看板查看。
          </div>
        ) : (
          <>
            <MessageList
              ref={listRef}
              messages={messages}
              highlightedMessageId={state.highlightedMessageId}
              onQuote={setQuotedMessage}
            />
            <ProjectComposer
              projectId={projectId}
              conversationId={conversationId}
              quotedMessage={quotedMessage}
              onClearQuote={() => setQuotedMessage(null)}
            />
          </>
        )}
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
