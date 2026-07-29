"use client";

import {
  ToolConfigDialog,
  type ToolConfigSelection,
} from "@/components/claw-hub-next/tool-config-dialog";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";

interface AddProjectToolDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Reuses Claw workbench ToolConfigDialog, limited to MCP + OpenAPI tabs.
 */
export function AddProjectToolDialog({
  projectId,
  open,
  onOpenChange,
}: AddProjectToolDialogProps) {
  const { bindSharedTool } = useProjectConversation();

  const handleConfirm = (selections: ToolConfigSelection[]) => {
    for (const selection of selections) {
      const versionId = `${selection.id}-v1`;
      bindSharedTool({
        projectId,
        publishedResourceVersionId: versionId,
        permission: "execute",
        credentialRef:
          selection.kind === "mcp" ? `cred-${selection.id}` : undefined,
        resource: {
          kind: selection.kind,
          displayName: selection.name,
          description: selection.description,
          requiresCredential: selection.kind === "mcp",
          compatibleActorIds: [],
        },
      });
    }
    onOpenChange(false);
  };

  return (
    <ToolConfigDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleConfirm}
      allowedKinds={["mcp", "plugin", "workflow", "ontology_action"]}
      title="配置插件"
      confirmLabel="添加到 Project"
    />
  );
}
