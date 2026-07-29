"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ToolConfigDialog,
  type ToolConfigSelection,
} from "@/components/claw-hub-next/tool-config-dialog";
import {
  SkillConfigDialog,
  type SkillConfigSelection,
} from "@/components/claw-hub-next/skill-config-dialog";
import { cn } from "@/lib/utils";
import type {
  ConversationSkillBinding,
  ConversationToolBinding,
  ProjectSharedToolBinding,
  ProjectSharedToolKind,
  ProjectSharedToolStatus,
  ProjectSkillBinding,
} from "@/lib/mock/my-claw/project-tools";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";

const KIND_LABEL: Partial<Record<ProjectSharedToolKind, string>> = {
  mcp: "MCP",
  plugin: "OpenAPI",
};

const STATUS_LABEL: Record<ProjectSharedToolStatus, string> = {
  active: "可用",
  authorization_required: "需授权",
  degraded: "降级",
  revoked: "已撤销",
};

function statusClass(status: ProjectSharedToolStatus) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700";
    case "authorization_required":
      return "bg-amber-50 text-amber-700";
    case "degraded":
      return "bg-orange-50 text-orange-700";
    case "revoked":
      return "bg-slate-100 text-slate-500";
  }
}

function isMcpOrOpenApi(kind: ProjectSharedToolKind) {
  return kind === "mcp" || kind === "plugin";
}

interface ConversationCapabilityPanelsProps {
  projectId: string;
  conversationId: string;
}

/** 会话设置 · 工具：项目工具（只读继承）+ 会话工具（可增删） */
export function ConversationToolsSection({
  projectId,
  conversationId,
}: ConversationCapabilityPanelsProps) {
  const {
    getSharedTools,
    getConversationTools,
    bindConversationTool,
    unbindConversationTool,
  } = useProjectConversation();

  const [toolOpen, setToolOpen] = useState(false);

  const projectTools = useMemo(
    () =>
      getSharedTools(projectId).filter((tool) => isMcpOrOpenApi(tool.kind)),
    [getSharedTools, projectId]
  );
  const conversationTools = useMemo(
    () =>
      getConversationTools(conversationId).filter((tool) =>
        isMcpOrOpenApi(tool.kind)
      ),
    [conversationId, getConversationTools]
  );

  const handleToolConfirm = (selections: ToolConfigSelection[]) => {
    for (const selection of selections) {
      if (selection.kind !== "mcp" && selection.kind !== "plugin") continue;
      bindConversationTool({
        projectId,
        conversationId,
        publishedResourceVersionId: `${selection.id}-v1`,
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
    setToolOpen(false);
  };

  return (
    <div className="space-y-4">
      <Subsection
        title={`项目工具 · ${projectTools.length}`}
        empty="暂无继承的 MCP / OpenAPI"
        isEmpty={projectTools.length === 0}
      >
        <ul className="space-y-1.5">
          {projectTools.map((tool) => (
            <ToolListRow key={tool.id} tool={tool} readOnly />
          ))}
        </ul>
      </Subsection>

      <Subsection
        title={`会话工具 · ${conversationTools.length}`}
        empty="暂无会话工具，可添加 MCP / OpenAPI"
        isEmpty={conversationTools.length === 0}
        action={
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[12px] text-[#2773ff]"
            onClick={() => setToolOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            添加
          </Button>
        }
      >
        <ul className="space-y-1.5">
          {conversationTools.map((tool) => (
            <ToolListRow
              key={tool.id}
              tool={tool}
              onRemove={() => unbindConversationTool(tool.id)}
            />
          ))}
        </ul>
      </Subsection>

      <ToolConfigDialog
        open={toolOpen}
        onOpenChange={setToolOpen}
        onConfirm={handleToolConfirm}
        allowedKinds={["mcp", "plugin"]}
        title="添加会话工具"
        confirmLabel="添加到会话"
      />
    </div>
  );
}

/** 会话设置 · 技能：项目技能（只读继承）+ 会话技能（可增删） */
export function ConversationSkillsSection({
  projectId,
  conversationId,
}: ConversationCapabilityPanelsProps) {
  const {
    getProjectSkills,
    getConversationSkills,
    bindConversationSkill,
    unbindConversationSkill,
  } = useProjectConversation();

  const [skillOpen, setSkillOpen] = useState(false);

  const projectSkills = useMemo(
    () => getProjectSkills(projectId).filter((s) => s.status === "active"),
    [getProjectSkills, projectId]
  );
  const conversationSkills = getConversationSkills(conversationId);

  const handleSkillConfirm = (selections: SkillConfigSelection[]) => {
    for (const skill of selections) {
      bindConversationSkill({
        projectId,
        conversationId,
        skillId: skill.id,
        displayName: skill.name,
        description: skill.description,
      });
    }
    setSkillOpen(false);
  };

  return (
    <div className="space-y-4">
      <Subsection
        title={`项目技能 · ${projectSkills.length}`}
        empty="暂无继承的项目技能"
        isEmpty={projectSkills.length === 0}
      >
        <ul className="space-y-1.5">
          {projectSkills.map((skill) => (
            <SkillListRow key={skill.id} skill={skill} readOnly />
          ))}
        </ul>
      </Subsection>

      <Subsection
        title={`会话技能 · ${conversationSkills.length}`}
        empty="暂无会话技能"
        isEmpty={conversationSkills.length === 0}
        action={
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[12px] text-[#2773ff]"
            onClick={() => setSkillOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            添加
          </Button>
        }
      >
        <ul className="space-y-1.5">
          {conversationSkills.map((skill) => (
            <SkillListRow
              key={skill.id}
              skill={skill}
              onRemove={() => unbindConversationSkill(skill.id)}
            />
          ))}
        </ul>
      </Subsection>

      <SkillConfigDialog
        open={skillOpen}
        onOpenChange={setSkillOpen}
        onConfirm={handleSkillConfirm}
        sourceMode="plaza"
      />
    </div>
  );
}

/** @deprecated Prefer ConversationToolsSection + ConversationSkillsSection */
export function ConversationToolsPanels(
  props: ConversationCapabilityPanelsProps
) {
  return (
    <div className="space-y-5">
      <ConversationToolsSection {...props} />
      <ConversationSkillsSection {...props} />
    </div>
  );
}

function Subsection({
  title,
  empty,
  isEmpty,
  action,
  children,
}: {
  title: string;
  empty: string;
  isEmpty: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[12px] font-medium text-[#5a6779]">{title}</div>
        {action}
      </div>
      {isEmpty ? (
        <p className="text-[12px] text-[#5a6779]">{empty}</p>
      ) : (
        children
      )}
    </div>
  );
}

function ToolListRow({
  tool,
  readOnly,
  onRemove,
}: {
  tool: ProjectSharedToolBinding | ConversationToolBinding;
  readOnly?: boolean;
  onRemove?: () => void;
}) {
  return (
    <li className="group flex items-start gap-2 rounded-md border border-[#eef2f6] px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[13px] font-medium text-slate-800">
            {tool.displayName}
          </span>
          <span className="rounded bg-[#f8f9fb] px-1.5 py-0.5 text-[10px] text-[#5a6779]">
            {KIND_LABEL[tool.kind] ?? tool.kind}
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              statusClass(tool.status)
            )}
          >
            {STATUS_LABEL[tool.status]}
          </span>
        </div>
        <div className="mt-0.5 text-[11px] text-[#5a6779]">
          {readOnly ? "只读继承 · " : ""}
          权限 {tool.permission}
        </div>
      </div>
      {!readOnly && onRemove ? (
        <button
          type="button"
          aria-label={`移除 ${tool.displayName}`}
          onClick={onRemove}
          className="rounded p-1 text-[#5a6779] opacity-0 transition-opacity hover:bg-slate-100 hover:text-red-600 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </li>
  );
}

function SkillListRow({
  skill,
  readOnly,
  onRemove,
}: {
  skill: ProjectSkillBinding | ConversationSkillBinding;
  readOnly?: boolean;
  onRemove?: () => void;
}) {
  return (
    <li className="group flex items-start gap-2 rounded-md border border-[#eef2f6] px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-slate-800">
          {skill.displayName}
        </div>
        <div className="mt-0.5 text-[11px] text-[#5a6779]">
          {readOnly ? "只读继承 · " : ""}
          技能广场
          {skill.description ? ` · ${skill.description}` : ""}
        </div>
      </div>
      {!readOnly && onRemove ? (
        <button
          type="button"
          aria-label={`移除 ${skill.displayName}`}
          onClick={onRemove}
          className="rounded p-1 text-[#5a6779] opacity-0 transition-opacity hover:bg-slate-100 hover:text-red-600 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </li>
  );
}
