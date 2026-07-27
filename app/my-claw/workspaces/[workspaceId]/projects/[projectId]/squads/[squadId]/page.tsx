import { SquadDetail } from "@/components/my-claw/collaboration/squads/squad-detail";

export default async function ProjectSquadDetailPage({
  params,
}: {
  params: Promise<{
    workspaceId: string;
    projectId: string;
    squadId: string;
  }>;
}) {
  const { workspaceId, projectId, squadId } = await params;
  return (
    <SquadDetail
      workspaceId={workspaceId}
      projectId={projectId}
      squadId={squadId}
    />
  );
}
