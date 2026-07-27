import { Suspense } from "react";
import { IssuesWorkbench } from "@/components/my-claw/collaboration/issues/issues-workbench";

export default async function IssuesPage({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-[#f8f9fb] text-[13px] text-[#5a6779]">
          加载工作项…
        </div>
      }
    >
      <IssuesWorkbench workspaceId={workspaceId} projectId={projectId} />
    </Suspense>
  );
}
