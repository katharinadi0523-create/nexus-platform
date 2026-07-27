import { SquadList } from "@/components/my-claw/collaboration/squads/squad-list";

export default async function ProjectSquadsPage({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = await params;
  return <SquadList workspaceId={workspaceId} projectId={projectId} />;
}
