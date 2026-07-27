import { ProjectContextPage } from "@/components/my-claw/collaboration/context/project-context-page";

export default async function ProjectContextRoutePage({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = await params;
  return (
    <ProjectContextPage workspaceId={workspaceId} projectId={projectId} />
  );
}
