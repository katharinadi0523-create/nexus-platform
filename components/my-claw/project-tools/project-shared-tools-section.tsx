"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ProjectSharedToolBinding,
  ProjectSharedToolKind,
  ProjectSharedToolStatus,
} from "@/lib/mock/my-claw/project-tools";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";
import { AddProjectToolDialog } from "./add-project-tool-dialog";

const KIND_LABEL: Record<ProjectSharedToolKind, string> = {
  workflow: "Workflow",
  plugin: "Plugin",
  mcp: "MCP",
  ontology_action: "Ontology Action",
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

interface ProjectSharedToolsSectionProps {
  projectId: string;
  archived?: boolean;
}

export function ProjectSharedToolsSection({
  projectId,
  archived,
}: ProjectSharedToolsSectionProps) {
  const { getSharedTools, unbindSharedTool, getActor } =
    useProjectConversation();
  const [open, setOpen] = useState(false);
  const tools = getSharedTools(projectId);

  const rows = useMemo(
    () =>
      [...tools].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [tools]
  );

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-medium text-[#5a6779]">共享工具</div>
        {!archived ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[12px] text-[#2773ff]"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            添加
          </Button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="mb-2 text-[12px] text-[#5a6779]">
          暂无共享工具。可从已发布目录添加 Workflow / Plugin / MCP。
        </p>
      ) : (
        <ul className="mb-2 space-y-1.5">
          {rows.map((tool) => (
            <ToolRow
              key={tool.id}
              tool={tool}
              archived={archived}
              onRemove={() => unbindSharedTool(tool.id)}
              actorNames={tool.compatibleActorIds
                .map((id) => getActor(id)?.name)
                .filter(Boolean)
                .slice(0, 3)
                .join("、")}
            />
          ))}
        </ul>
      )}

      <AddProjectToolDialog
        projectId={projectId}
        open={open}
        onOpenChange={setOpen}
      />
    </section>
  );
}

function ToolRow({
  tool,
  archived,
  onRemove,
  actorNames,
}: {
  tool: ProjectSharedToolBinding;
  archived?: boolean;
  onRemove: () => void;
  actorNames: string;
}) {
  return (
    <li className="group flex items-start gap-2.5 rounded-md border border-[#eef2f6] px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[13px] font-medium text-slate-800">
            {tool.displayName}
          </span>
          <span className="rounded bg-[#f8f9fb] px-1.5 py-0.5 text-[10px] text-[#5a6779]">
            {KIND_LABEL[tool.kind]}
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              statusClass(tool.status)
            )}
          >
            {STATUS_LABEL[tool.status]}
          </span>
          {tool.hasNewerVersion ? (
            <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] text-sky-700">
              有新版本
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 text-[11px] text-[#5a6779]">
          权限 {tool.permission}
          {actorNames ? ` · 兼容 ${actorNames}` : ""}
        </div>
      </div>
      {!archived ? (
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
