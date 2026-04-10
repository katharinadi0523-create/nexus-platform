import { SpaceOperationsHeader } from "@/components/space-operations/space-operations-header";
import { SpaceOperationsTabNav } from "@/components/space-operations/space-operations-tab-nav";

export default function SpaceOperationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="claw-detail-muted-theme flex h-full min-h-0 flex-col overflow-hidden">
      <SpaceOperationsHeader />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SpaceOperationsTabNav />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-0 pt-3 sm:px-6 sm:pt-4">{children}</div>
      </div>
    </div>
  );
}
