"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { ProjectConversationPage } from "@/components/my-claw/project-conversation/project-conversation-page";

interface ProjectRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function ProjectRoutePage({ params }: ProjectRoutePageProps) {
  const { projectId } = use(params);
  const searchParams = useSearchParams();
  const messageId = searchParams.get("message");
  const issueId = searchParams.get("issue");
  const viewParam = searchParams.get("view");
  const view = viewParam === "issues" ? "issues" : "conversation";

  return (
    <ProjectConversationPage
      projectId={projectId}
      messageId={messageId}
      issueId={issueId}
      view={view}
    />
  );
}
