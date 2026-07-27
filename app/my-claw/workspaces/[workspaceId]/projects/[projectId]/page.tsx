"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { ProjectConversationPage } from "@/components/my-claw/project-conversation/project-conversation-page";

interface ProjectRoutePageProps {
  params: Promise<{
    workspaceId: string;
    projectId: string;
  }>;
}

export default function ProjectRoutePage({ params }: ProjectRoutePageProps) {
  const { workspaceId, projectId } = use(params);
  const searchParams = useSearchParams();
  const messageId = searchParams.get("message");

  return (
    <ProjectConversationPage
      workspaceId={workspaceId}
      projectId={projectId}
      messageId={messageId}
    />
  );
}
