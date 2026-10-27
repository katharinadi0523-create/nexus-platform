"use client";

import { useMemo, useState } from "react";
import { ClawWorkspaceSection } from "@/components/claw-hub-next/detail/workspace-section";
import { WorkbenchEntityProvider } from "@/components/claw-hub-next/workbench-entity-context";
import { getPersonalClawDetail } from "@/lib/mock/my-claw";
import { CLAW_CLIENT_WORKSPACE_ROOT } from "./personal-workspace-data";

export function ClawClientWorkspacePage() {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  return (
    <WorkbenchEntityProvider entityLabel="Claw">
      <div className="h-full min-h-0 overflow-y-auto px-6 py-5">
        <ClawWorkspaceSection
          workspaceRoot={CLAW_CLIENT_WORKSPACE_ROOT}
          storageConfig={detail.workspaceStorageConfig}
          selectedPath={selectedPath}
          onSelectPath={setSelectedPath}
          onOpenStorageConfig={() => undefined}
          hideStorageAction
        />
      </div>
    </WorkbenchEntityProvider>
  );
}
