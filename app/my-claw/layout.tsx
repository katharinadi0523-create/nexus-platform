import { MyClawProvider } from "@/components/my-claw/provider";
import { ProjectConversationProvider } from "@/components/my-claw/project-conversation/project-conversation-provider";
import { MyClawShell } from "@/components/my-claw/shell/my-claw-shell";
import { WorkspaceCatalogProvider } from "@/components/workspace-1/workspaceCatalog";

export default function MyClawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MyClawProvider>
      <WorkspaceCatalogProvider>
        <ProjectConversationProvider>
          <div className="h-screen overflow-hidden bg-slate-50">
            <MyClawShell>{children}</MyClawShell>
          </div>
        </ProjectConversationProvider>
      </WorkspaceCatalogProvider>
    </MyClawProvider>
  );
}
