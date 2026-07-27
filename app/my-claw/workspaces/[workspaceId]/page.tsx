import { WorkspaceHome } from "@/components/my-claw/collaboration/workspace-home";

export default async function WorkspaceHomePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <WorkspaceHome workspaceId={workspaceId} />;
}
