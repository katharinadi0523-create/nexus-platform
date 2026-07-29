"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { ProjectConversationPage } from "@/components/my-claw/project-conversation/project-conversation-page";

interface ConversationRoutePageProps {
  params: Promise<{
    projectId: string;
    conversationId: string;
  }>;
}

export default function ConversationRoutePage({
  params,
}: ConversationRoutePageProps) {
  const { projectId, conversationId } = use(params);
  const searchParams = useSearchParams();
  const messageId = searchParams.get("message");
  const issueId = searchParams.get("issue");

  return (
    <ProjectConversationPage
      projectId={projectId}
      conversationId={conversationId}
      messageId={messageId}
      issueId={issueId}
    />
  );
}
