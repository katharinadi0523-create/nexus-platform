import { Toaster } from "sonner";
import { CollaborationProvider } from "@/components/my-claw/collaboration/collaboration-provider";
import { MyClawProvider } from "@/components/my-claw/provider";
import { MyClawShell } from "@/components/my-claw/shell/my-claw-shell";

export default function MyClawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MyClawProvider>
      <CollaborationProvider>
        <div className="h-screen overflow-hidden bg-slate-50">
          <MyClawShell>{children}</MyClawShell>
          <Toaster position="top-right" />
        </div>
      </CollaborationProvider>
    </MyClawProvider>
  );
}
