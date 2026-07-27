import { ProjectOverview } from "@/components/my-claw/collaboration/project-overview";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = await params;
  return (
    <ProjectOverview workspaceId={workspaceId} projectId={projectId} />
  );
}
