"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProjectConversation } from "../project-conversation-provider";
import { DrawerShell } from "../shared/drawer-shell";

interface ProjectInfoDrawerProps {
  projectId: string;
  onClose: () => void;
}

export function ProjectInfoDrawer({
  projectId,
  onClose,
}: ProjectInfoDrawerProps) {
  const {
    getProject,
    getWorkspace,
    getMembers,
    getWorkSources,
    updateProjectBrief,
    archiveProject,
    openDrawer,
  } = useProjectConversation();

  const project = getProject(projectId);
  const [brief, setBrief] = useState(project?.brief ?? "");
  const [confirmArchive, setConfirmArchive] = useState(false);

  if (!project) {
    return (
      <DrawerShell title="Project 信息" onClose={onClose}>
        <p className="text-[13px] text-[#5a6779]">Project 不存在</p>
      </DrawerShell>
    );
  }

  const workspace = getWorkspace(project.workspaceId);
  const members = getMembers(projectId);
  const workSources = getWorkSources(projectId);
  const humanCount = members.filter((m) => m.kind === "human").length;
  const agentCount = members.filter((m) => m.kind === "agent").length;
  const archived = project.status === "archived";

  return (
    <>
      <DrawerShell
        title="Project 信息"
        onClose={onClose}
        footer={
          !archived ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => setConfirmArchive(true)}
            >
              归档 Project
            </Button>
          ) : null
        }
      >
        <section className="mb-5 space-y-3">
          <div>
            <div className="mb-1 text-[11px] font-medium text-[#5a6779]">
              名称
            </div>
            <div className="text-[14px] font-semibold text-slate-900">
              {project.name}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[11px] font-medium text-[#5a6779]">
              描述
            </div>
            <p className="text-[13px] text-slate-700">
              {project.description || "—"}
            </p>
          </div>
          <div>
            <div className="mb-1 text-[11px] font-medium text-[#5a6779]">
              Workspace
            </div>
            <p className="text-[13px] text-slate-700">
              {workspace?.name ?? project.workspaceId}
            </p>
          </div>
        </section>

        <section className="mb-5">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="text-[11px] font-medium text-[#5a6779]">
              Project Brief
            </div>
            {!archived ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[12px] text-[#2773ff]"
                onClick={() => updateProjectBrief(projectId, brief)}
              >
                保存
              </Button>
            ) : null}
          </div>
          <Textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            disabled={archived}
            className="min-h-[100px] border-[#e2e8f0] text-[13px]"
          />
        </section>

        <section className="mb-5">
          <div className="mb-2 text-[11px] font-medium text-[#5a6779]">
            Work Sources
          </div>
          {workSources.length === 0 ? (
            <p className="text-[12px] text-[#5a6779]">暂无工作源</p>
          ) : (
            <ul className="space-y-2">
              {workSources.map((source) => (
                <li
                  key={source.id}
                  className="rounded-md border border-[#eef2f6] px-3 py-2"
                >
                  <div className="text-[13px] font-medium text-slate-800">
                    {source.name}
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#5a6779]">
                    {source.type === "github_repository"
                      ? "GitHub Repository"
                      : "Local Directory"}{" "}
                    · {source.detail}
                  </div>
                  <div className="mt-1 text-[11px] text-[#5a6779]">
                    {source.availability === "available"
                      ? "可用"
                      : source.availability === "authorization_required"
                        ? "需要授权"
                        : "不可用"}{" "}
                    · {source.access === "read_write" ? "读写" : "只读"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-2 text-[11px] font-medium text-[#5a6779]">
            成员摘要
          </div>
          <button
            type="button"
            onClick={() => openDrawer("members")}
            className="w-full rounded-md border border-[#eef2f6] px-3 py-2.5 text-left transition-colors hover:bg-[#f8f9fb]"
          >
            <div className="text-[13px] text-slate-800">
              Human {humanCount} · Agent {agentCount}
            </div>
            <div className="mt-0.5 text-[12px] text-[#2773ff]">查看成员详情</div>
          </button>
        </section>
      </DrawerShell>

      <Dialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认归档</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-[#5a6779]">
            归档后 Conversation 仍可阅读，但无法发送消息、添加成员或发起新执行。
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmArchive(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                archiveProject(projectId);
                setConfirmArchive(false);
              }}
            >
              确认归档
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
