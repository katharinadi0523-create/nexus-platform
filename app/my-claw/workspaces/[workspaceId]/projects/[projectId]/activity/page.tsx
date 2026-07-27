import { ProjectActivityPage } from "@/components/my-claw/collaboration/activity/project-activity-page";

export default async function ProjectActivityRoutePage({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = await params;
  return (
    <ProjectActivityPage workspaceId={workspaceId} projectId={projectId} />
  );
}
