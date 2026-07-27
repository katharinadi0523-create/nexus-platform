"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  AgentActor,
  CollaborationProject,
  CollaborationUser,
  Squad,
} from "@/lib/mock/my-claw/collaboration";
import { ActorAvatar } from "./shared/actor-avatar";

function AvatarGroup({
  items,
  emptyLabel,
}: {
  items: { key: string; name: string; type: AgentActor["type"] | "human" | "squad" }[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <span className="text-[12px] text-[#8a97a8]">{emptyLabel}</span>;
  }
  const visible = items.slice(0, 5);
  const rest = items.length - visible.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {visible.map((item) => (
          <div
            key={item.key}
            title={item.name}
            className="rounded-full ring-2 ring-white"
          >
            <ActorAvatar name={item.name} type={item.type} size="sm" />
          </div>
        ))}
      </div>
      {rest > 0 ? (
        <span className="ml-2 text-[11px] text-[#5a6779]">+{rest}</span>
      ) : null}
    </div>
  );
}

export function ProjectHeader({
  workspaceId,
  project,
  lead,
  humans,
  agents,
  squads,
}: {
  workspaceId: string;
  project: CollaborationProject;
  lead: CollaborationUser | undefined;
  humans: CollaborationUser[];
  agents: AgentActor[];
  squads: Squad[];
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const projectBase = `/my-claw/workspaces/${workspaceId}/projects/${project.id}`;

  return (
    <>
      <div className="shrink-0 border-b border-[#eef2f6] bg-white px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">
                {project.name}
              </h1>
              <span
                className={
                  project.status === "active"
                    ? "rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                    : "rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500"
                }
              >
                {project.status === "active" ? "进行中" : "已归档"}
              </span>
            </div>
            <p className="mt-1.5 max-w-3xl text-[13px] leading-5 text-[#5a6779]">
              {project.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div>
                <div className="mb-1 text-[11px] text-[#8a97a8]">Project Lead</div>
                <div className="flex items-center gap-2">
                  <ActorAvatar
                    name={lead?.name ?? "未指定"}
                    type="human"
                    size="sm"
                  />
                  <span className="text-[13px] text-slate-800">
                    {lead?.name ?? "未指定"}
                  </span>
                </div>
              </div>
              <div>
                <div className="mb-1 text-[11px] text-[#8a97a8]">Human</div>
                <AvatarGroup
                  emptyLabel="无成员"
                  items={humans.map((user) => ({
                    key: user.id,
                    name: user.name,
                    type: "human" as const,
                  }))}
                />
              </div>
              <div>
                <div className="mb-1 text-[11px] text-[#8a97a8]">Agent</div>
                <AvatarGroup
                  emptyLabel="无 Agent"
                  items={agents.map((actor) => ({
                    key: actor.id,
                    name: actor.name,
                    type: actor.type,
                  }))}
                />
              </div>
              <div>
                <div className="mb-1 text-[11px] text-[#8a97a8]">Squad</div>
                <AvatarGroup
                  emptyLabel="无小队"
                  items={squads.map((squad) => ({
                    key: squad.id,
                    name: squad.name,
                    type: "squad" as const,
                  }))}
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              className="h-9 border-[#e2e8f0] text-[#5a6779]"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 className="mr-1.5 h-3.5 w-3.5" />
              项目设置
            </Button>
            <Button asChild className="h-9 bg-[#2773ff] hover:bg-[#1f63e0]">
              <Link href={`${projectBase}/issues?create=1`}>
                <Plus className="mr-1.5 h-4 w-4" />
                新建 Issue
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>项目设置</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-[13px] text-[#5a6779]">
            <p>原型阶段仅展示设置入口，后续可配置：</p>
            <ul className="list-inside list-disc space-y-1">
              <li>项目名称与描述</li>
              <li>Lead / 成员管理</li>
              <li>归档与恢复</li>
              <li>通知偏好</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              className="bg-[#2773ff] hover:bg-[#1f63e0]"
              onClick={() => setSettingsOpen(false)}
            >
              知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
