"use client";

import { useState } from "react";
import {
  Folder,
  Github,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
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
    addGitHubWorkSource,
    addLocalWorkSource,
    removeWorkSource,
  } = useProjectConversation();

  const project = getProject(projectId);
  const [brief, setBrief] = useState(project?.brief ?? "");
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [addingGithub, setAddingGithub] = useState(false);
  const [githubInput, setGithubInput] = useState("");
  const [githubError, setGithubError] = useState<string | null>(null);
  const [addingLocal, setAddingLocal] = useState(false);
  const [localName, setLocalName] = useState("本地工作区");
  const [localPath, setLocalPath] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

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
  const hasLocalDirectory = workSources.some(
    (item) => item.type === "local_directory"
  );

  const submitGithub = () => {
    const result = addGitHubWorkSource(projectId, githubInput);
    if (!result.ok) {
      setGithubError(result.error);
      return;
    }
    setGithubInput("");
    setGithubError(null);
    setAddingGithub(false);
  };

  const submitLocal = () => {
    const result = addLocalWorkSource(projectId, localName, localPath);
    if (!result.ok) {
      setLocalError(result.error);
      return;
    }
    setLocalName("本地工作区");
    setLocalPath("");
    setLocalError(null);
    setAddingLocal(false);
  };

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
            <p className="mb-2 text-[12px] text-[#5a6779]">暂无工作源</p>
          ) : (
            <ul className="mb-2 space-y-1.5">
              {workSources.map((source) => {
                const Icon =
                  source.type === "github_repository" ? Github : Folder;
                return (
                  <li
                    key={source.id}
                    className="group flex items-start gap-2.5 rounded-md border border-[#eef2f6] px-3 py-2"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#5a6779]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-slate-800">
                        {source.name}
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-[#5a6779]">
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
                    </div>
                    {!archived ? (
                      <button
                        type="button"
                        aria-label={`移除 ${source.name}`}
                        onClick={() => removeWorkSource(projectId, source.id)}
                        className="rounded p-1 text-[#5a6779] opacity-0 transition-opacity hover:bg-slate-100 hover:text-red-600 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {!archived ? (
            <div className="space-y-2">
              {!addingGithub ? (
                <button
                  type="button"
                  onClick={() => {
                    setAddingGithub(true);
                    setAddingLocal(false);
                    setGithubError(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#f8f9fb] px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-[#eef3f8]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add resource
                </button>
              ) : (
                <div className="rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-sm">
                  <div className="mb-2 text-[12px] font-medium text-slate-800">
                    Attach a GitHub repo
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={githubInput}
                      onChange={(e) => {
                        setGithubInput(e.target.value);
                        setGithubError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          submitGithub();
                        }
                        if (e.key === "Escape") {
                          setAddingGithub(false);
                          setGithubError(null);
                        }
                      }}
                      placeholder="https://github.com/owner/repo or owner/repo"
                      className="h-8 border-[#e2e8f0] bg-[#f8f9fb] text-[12px] shadow-none"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 shrink-0 bg-[#2773ff] px-3 text-[12px] hover:bg-[#1f63e0]"
                      onClick={submitGithub}
                    >
                      Add
                    </Button>
                  </div>
                  {githubError ? (
                    <p className="mt-1.5 text-[11px] text-red-600">
                      {githubError}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setAddingGithub(false);
                      setGithubError(null);
                    }}
                    className="mt-2 text-[11px] text-[#5a6779] hover:text-slate-700"
                  >
                    取消
                  </button>
                </div>
              )}

              {!addingLocal ? (
                <div>
                  <button
                    type="button"
                    disabled={hasLocalDirectory}
                    onClick={() => {
                      if (hasLocalDirectory) return;
                      setAddingLocal(true);
                      setAddingGithub(false);
                      setLocalError(null);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-[12px] font-medium transition-colors",
                      hasLocalDirectory
                        ? "cursor-not-allowed text-slate-400"
                        : "text-slate-700 hover:text-[#2773ff]"
                    )}
                  >
                    <Folder className="h-3.5 w-3.5" />
                    Add local directory
                  </button>
                  {hasLocalDirectory ? (
                    <p className="mt-1 pl-1 text-[11px] leading-4 text-[#5a6779]">
                      This machine already has a local directory attached.
                      Remove it before adding another.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-sm">
                  <div className="mb-2 text-[12px] font-medium text-slate-800">
                    Attach a local directory
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      placeholder="显示名称"
                      className="h-8 border-[#e2e8f0] bg-[#f8f9fb] text-[12px] shadow-none"
                    />
                    <Input
                      value={localPath}
                      onChange={(e) => {
                        setLocalPath(e.target.value);
                        setLocalError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          submitLocal();
                        }
                        if (e.key === "Escape") {
                          setAddingLocal(false);
                          setLocalError(null);
                        }
                      }}
                      placeholder="~/Dev-Projects/your-folder"
                      className="h-8 border-[#e2e8f0] bg-[#f8f9fb] text-[12px] shadow-none"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 bg-[#2773ff] px-3 text-[12px] hover:bg-[#1f63e0]"
                        onClick={submitLocal}
                      >
                        Add
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingLocal(false);
                          setLocalError(null);
                        }}
                        className="text-[11px] text-[#5a6779] hover:text-slate-700"
                      >
                        取消
                      </button>
                    </div>
                    {localError ? (
                      <p className="text-[11px] text-red-600">{localError}</p>
                    ) : (
                      <p className="text-[11px] leading-4 text-[#5a6779]">
                        原型仅记录绑定信息，不执行真实本地目录授权。
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
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
