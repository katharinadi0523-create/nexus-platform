import { IssueDetail } from "@/components/my-claw/collaboration/issues/issue-detail";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{
    workspaceId: string;
    projectId: string;
    issueId: string;
  }>;
}) {
  const { workspaceId, projectId, issueId } = await params;

  return (
    <IssueDetail
      workspaceId={workspaceId}
      projectId={projectId}
      issueId={issueId}
    />
  );
}
