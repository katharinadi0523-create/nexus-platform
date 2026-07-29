"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { ProjectOverviewPage } from "@/components/my-claw/project-overview/project-overview-page";

interface ProjectRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function ProjectRoutePage({ params }: ProjectRoutePageProps) {
  const { projectId } = use(params);
  const searchParams = useSearchParams();
  const issueId = searchParams.get("issue");
  const viewParam = searchParams.get("view");
  const view = viewParam === "issues" ? "issues" : "overview";

  return (
    <ProjectOverviewPage
      projectId={projectId}
      issueId={issueId}
      view={view}
    />
  );
}
