"use client";

import { useMemo, useState } from "react";
import { ClawCapabilitySection } from "@/components/claw-hub-next/detail/capability-section";
import { WorkbenchEntityProvider } from "@/components/claw-hub-next/workbench-entity-context";
import {
  SkillConfigDialog,
  type SkillConfigSelection,
} from "@/components/claw-hub-next/skill-config-dialog";
import type {
  CapabilitySkillItem,
  CapabilityToolItem,
  CapabilityToolKind,
  ClawCapabilityConfig,
} from "@/lib/mock/claw-hub-next";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";
import { AddProjectToolDialog } from "@/components/my-claw/project-tools/add-project-tool-dialog";
import type { ProjectSharedToolKind } from "@/lib/mock/my-claw/project-tools";

const KIND_META: Record<ProjectSharedToolKind, string> = {
  mcp: "MCP",
  plugin: "OpenAPI",
  workflow: "工作流",
  ontology_action: "本体动作",
};

const EMPTY_CAPABILITY: ClawCapabilityConfig = {
  tools: { platform: [], tenant: [], claw: [] },
  skills: { platform: [], tenant: [], claw: [] },
  agents: { platform: [], tenant: [], claw: [] },
  knowledge: { tenant: [], claw: [] },
};

interface ProjectCapabilityPanelsProps {
  projectId: string;
}

/** Reuses Claw workbench capability list UI for Project tools & skills. */
export function ProjectCapabilityPanels({
  projectId,
}: ProjectCapabilityPanelsProps) {
  const {
    getSharedTools,
    getProjectSkills,
    bindProjectSkill,
    unbindProjectSkill,
    unbindSharedTool,
    setSharedToolEnabled,
    setProjectSkillEnabled,
  } = useProjectConversation();

  const [toolOpen, setToolOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [toolScope, setToolScope] = useState<"preset" | "claw">("claw");
  const [skillScope, setSkillScope] = useState<"preset" | "claw">("claw");

  const tools = getSharedTools(projectId);
  const skills = getProjectSkills(projectId);

  const capabilityConfig = useMemo<ClawCapabilityConfig>(() => {
    const clawTools: CapabilityToolItem[] = tools.map((tool) => ({
      id: tool.id,
      name: tool.displayName,
      description:
        tool.status === "authorization_required"
          ? "需完成授权后可用"
          : tool.status === "degraded"
            ? "当前降级可用"
            : tool.status === "revoked"
              ? "已撤销"
              : `权限 ${tool.permission}`,
      enabled: tool.status === "active" || tool.status === "authorization_required",
      kind: tool.kind as CapabilityToolKind,
      meta: KIND_META[tool.kind],
      origin: "claw_only",
    }));

    const clawSkills: CapabilitySkillItem[] = skills.map((skill) => ({
      id: skill.id,
      name: skill.displayName,
      description: skill.description ?? "来自技能广场",
      enabled: skill.status === "active",
      sizeLabel: "技能广场",
    }));

    return {
      ...EMPTY_CAPABILITY,
      tools: { ...EMPTY_CAPABILITY.tools, claw: clawTools },
      skills: { ...EMPTY_CAPABILITY.skills, claw: clawSkills },
    };
  }, [skills, tools]);

  const handleSkillConfirm = (selections: SkillConfigSelection[]) => {
    for (const skill of selections) {
      bindProjectSkill({
        projectId,
        skillId: skill.id,
        displayName: skill.name,
        description: skill.description,
      });
    }
    setSkillOpen(false);
  };

  return (
    <WorkbenchEntityProvider entityLabel="Project">
      <div className="space-y-4 lg:col-span-2">
        <ClawCapabilitySection
          panel="tools"
          capabilityConfig={capabilityConfig}
          toolScope={toolScope}
          onToolScopeChange={setToolScope}
          skillScope={skillScope}
          onSkillScopeChange={setSkillScope}
          onOpenToolConfigDialog={() => setToolOpen(true)}
          onOpenSkillConfigDialog={() => setSkillOpen(true)}
          hideToolOriginFilter
          hideSkillPreset
          onToggleTool={(_scope, id, enabled) =>
            setSharedToolEnabled(id, enabled)
          }
          onDeleteTool={(_scope, id) => unbindSharedTool(id)}
          onToggleSkill={(_scope, id, enabled) =>
            setProjectSkillEnabled(id, enabled)
          }
          onDeleteSkill={(_scope, id) => unbindProjectSkill(id)}
        />

        <ClawCapabilitySection
          panel="skills"
          capabilityConfig={capabilityConfig}
          toolScope={toolScope}
          onToolScopeChange={setToolScope}
          skillScope={skillScope}
          onSkillScopeChange={setSkillScope}
          onOpenToolConfigDialog={() => setToolOpen(true)}
          onOpenSkillConfigDialog={() => setSkillOpen(true)}
          hideToolOriginFilter
          hideSkillPreset
          onToggleTool={(_scope, id, enabled) =>
            setSharedToolEnabled(id, enabled)
          }
          onDeleteTool={(_scope, id) => unbindSharedTool(id)}
          onToggleSkill={(_scope, id, enabled) =>
            setProjectSkillEnabled(id, enabled)
          }
          onDeleteSkill={(_scope, id) => unbindProjectSkill(id)}
        />
      </div>

      <AddProjectToolDialog
        projectId={projectId}
        open={toolOpen}
        onOpenChange={setToolOpen}
      />
      <SkillConfigDialog
        open={skillOpen}
        onOpenChange={setSkillOpen}
        onConfirm={handleSkillConfirm}
        sourceMode="plaza"
      />
    </WorkbenchEntityProvider>
  );
}
