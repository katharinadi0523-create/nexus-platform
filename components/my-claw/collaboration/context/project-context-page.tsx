"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Link2,
  Paperclip,
  Plus,
  Trash2,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  WORK_SOURCE_AVAILABILITY_LABELS,
  WORK_SOURCE_TYPE_LABELS,
  type ProjectWorkSourceBinding,
  type WorkSourceAvailability,
} from "@/lib/mock/my-claw/collaboration";
import { useCollaboration } from "../collaboration-provider";
import { formatDateTime, formatRelativeTime } from "../shared/format";

interface ProjectContextPageProps {
  workspaceId: string;
  projectId: string;
}

const ACCESS_LABELS: Record<ProjectWorkSourceBinding["access"], string> = {
  read: "只读",
  read_write: "读写",
};

const AVAILABILITY_STYLES: Record<WorkSourceAvailability, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  unavailable: "border-rose-200 bg-rose-50 text-rose-700",
  authorization_required: "border-amber-200 bg-amber-50 text-amber-800",
};

const ARTIFACT_KIND_LABELS = {
  file: "文件",
  report: "报告",
  link: "链接",
  pull_request: "PR",
} as const;

export function ProjectContextPage({
  workspaceId,
  projectId,
}: ProjectContextPageProps) {
  const {
    getProject,
    getIssue,
    getBindingsForProject,
    getFilesForProject,
    getArtifactsForProject,
    getCatalogForWorkspace,
    updateProjectBrief,
    bindProjectResource,
    unbindProjectResource,
    addWorkingFile,
    deleteWorkingFile,
  } = useCollaboration();

  const project = getProject(projectId);
  const bindings = getBindingsForProject(projectId);
  const files = getFilesForProject(projectId);
  const artifacts = getArtifactsForProject(projectId);
  const catalog = getCatalogForWorkspace(workspaceId);

  const [briefDrafts, setBriefDrafts] = useState<Record<string, string>>({});
  const brief = briefDrafts[projectId] ?? project?.contextBrief ?? "";
  const [bindOpen, setBindOpen] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [access, setAccess] =
    useState<ProjectWorkSourceBinding["access"]>("read");
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);

  const boundLocators = useMemo(
    () => new Set(bindings.map((binding) => binding.locator)),
    [bindings]
  );

  const unboundCatalog = useMemo(
    () => catalog.filter((item) => !boundLocators.has(item.locator)),
    [catalog, boundLocators]
  );

  if (!project || project.workspaceId !== workspaceId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#5a6779]">
        未找到协作项目
      </div>
    );
  }

  const saveBrief = () => {
    updateProjectBrief(projectId, brief);
    setBriefDrafts((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
    toast.success("项目 Brief 已保存");
  };

  const handleBind = () => {
    const resource = unboundCatalog.find((item) => item.id === selectedCatalogId);
    if (!resource) {
      toast.error("请选择要绑定的工作源");
      return;
    }
    bindProjectResource({
      workspaceId,
      projectId,
      type: resource.type,
      name: resource.name,
      locator: resource.locator,
      branch: resource.branch,
      access,
      availability: resource.availability,
    });
    toast.success(`已绑定「${resource.name}」`);
    setBindOpen(false);
    setSelectedCatalogId("");
    setAccess("read");
  };

  const handleMockUpload = () => {
    const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, "");
    const name = `工作文件-${stamp}.md`;
    addWorkingFile({ workspaceId, projectId, name });
    toast.success(`已上传「${name}」（mock）`);
  };

  const confirmDeleteFile = () => {
    if (!deleteFileId) return;
    deleteWorkingFile(deleteFileId);
    toast.success("已删除工作文件");
    setDeleteFileId(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-200/80 bg-white px-5 py-4 md:px-6">
        <h1 className="text-[20px] font-medium tracking-tight text-slate-900">
          项目上下文
        </h1>
        <p className="mt-1 text-sm text-[#5a6779]">
          Brief、工作源、工作文件与 Issue / Run 产物
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6">
        <Tabs defaultValue="brief">
          <TabsList className="bg-white">
            <TabsTrigger value="brief">Project Brief</TabsTrigger>
            <TabsTrigger value="bindings">工作源</TabsTrigger>
            <TabsTrigger value="files">工作文件</TabsTrigger>
            <TabsTrigger value="artifacts">项目产物</TabsTrigger>
          </TabsList>

          <TabsContent value="brief" className="mt-4">
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-[14px] font-semibold text-slate-900">
                    项目目标与规则
                  </h2>
                  <p className="mt-0.5 text-[12px] text-[#5a6779]">
                    支持 Markdown 文本；保存后写入项目动态
                  </p>
                </div>
                <Button
                  type="button"
                  className="bg-[#2773ff] hover:bg-[#1f63e0]"
                  onClick={saveBrief}
                >
                  保存 Brief
                </Button>
              </div>
              <Textarea
                value={brief}
                onChange={(e) =>
                  setBriefDrafts((prev) => ({
                    ...prev,
                    [projectId]: e.target.value,
                  }))
                }
                rows={14}
                placeholder={`# 项目目标\n\n## 背景\n\n## 协作规则\n\n## 交付标准\n\n## Agent 共享说明`}
                className="font-mono text-[13px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="bindings" className="mt-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[12px] text-[#5a6779]">
                  仅支持绑定 GitHub Repository 与 Local Directory
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Agent 的 Skill / 插件 / MCP / 知识库跟随 Agent，不属于 Project
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="bg-[#2773ff] hover:bg-[#1f63e0]"
                onClick={() => setBindOpen(true)}
              >
                <Link2 className="mr-1.5 h-3.5 w-3.5" />
                绑定工作源
              </Button>
            </div>
            {bindings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-[#5a6779]">
                暂无工作源绑定
              </div>
            ) : (
              <div className="space-y-2">
                {bindings.map((binding) => (
                  <div
                    key={binding.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-medium text-slate-900">
                          {binding.name}
                        </span>
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-[#5a6779]">
                          {WORK_SOURCE_TYPE_LABELS[binding.type]}
                        </span>
                        <span className="inline-flex items-center rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700">
                          {ACCESS_LABELS[binding.access]}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${AVAILABILITY_STYLES[binding.availability]}`}
                        >
                          {
                            WORK_SOURCE_AVAILABILITY_LABELS[
                              binding.availability
                            ]
                          }
                        </span>
                      </div>
                      <div className="mt-1 truncate text-[12px] text-[#5a6779]">
                        {binding.locator}
                      </div>
                      {binding.type === "github_repository" && binding.branch ? (
                        <div className="mt-0.5 text-[11px] text-[#5a6779]">
                          Branch · {binding.branch}
                        </div>
                      ) : null}
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        绑定于 {formatDateTime(binding.boundAt)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        unbindProjectResource(binding.id);
                        toast.success(`已解除「${binding.name}」`);
                      }}
                    >
                      <Unlink className="mr-1.5 h-3.5 w-3.5" />
                      解除绑定
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] text-[#5a6779]">
                来自已绑定工作源路径或 Issue 附件的工作文件（mock）
              </p>
              <Button
                type="button"
                size="sm"
                className="bg-[#2773ff] hover:bg-[#1f63e0]"
                onClick={handleMockUpload}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                上传文件
              </Button>
            </div>
            {files.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-[#5a6779]">
                暂无工作文件
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#f8f9fb] text-[12px] text-[#5a6779]">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">文件名</th>
                      <th className="hidden px-4 py-2.5 font-medium md:table-cell">
                        路径
                      </th>
                      <th className="px-4 py-2.5 font-medium">大小</th>
                      <th className="px-4 py-2.5 font-medium">更新者</th>
                      <th className="px-4 py-2.5 font-medium">更新时间</th>
                      <th className="px-4 py-2.5 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <tr
                        key={file.id}
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-3.5 w-3.5 text-[#2773ff]" />
                            <span className="font-medium text-slate-900">
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="hidden max-w-[220px] truncate px-4 py-3 text-[#5a6779] md:table-cell">
                          {file.path}
                        </td>
                        <td className="px-4 py-3 text-[#5a6779]">
                          {file.sizeLabel}
                        </td>
                        <td className="px-4 py-3 text-[#5a6779]">
                          {file.updatedByLabel}
                        </td>
                        <td className="px-4 py-3 text-[#5a6779]">
                          {formatRelativeTime(file.updatedAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setDeleteFileId(file.id)}
                            className="inline-flex items-center gap-1 text-[12px] text-[#5a6779] hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="artifacts" className="mt-4">
            {artifacts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-[#5a6779]">
                暂无项目产物
              </div>
            ) : (
              <div className="space-y-2">
                {artifacts.map((artifact) => {
                  const issue = artifact.issueId
                    ? getIssue(artifact.issueId)
                    : undefined;
                  return (
                    <div
                      key={artifact.id}
                      className="rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <FileText className="h-4 w-4 text-[#2773ff]" />
                        <span className="text-[13px] font-medium text-slate-900">
                          {artifact.name}
                        </span>
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-[#5a6779]">
                          {ARTIFACT_KIND_LABELS[artifact.kind]}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[#5a6779]">
                        <span>产生者 · {artifact.createdByLabel}</span>
                        {issue ? (
                          <span>
                            关联 Issue · {issue.key} {issue.title}
                          </span>
                        ) : (
                          <span>关联 Issue · —</span>
                        )}
                        <span>{formatDateTime(artifact.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={bindOpen} onOpenChange={setBindOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>绑定工作源</DialogTitle>
          </DialogHeader>
          {unboundCatalog.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-[#f8f9fb] px-4 py-8 text-center text-sm text-[#5a6779]">
              目录中暂无更多可绑定的 GitHub 仓库或本地目录
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>工作源</Label>
                <Select
                  value={selectedCatalogId}
                  onValueChange={setSelectedCatalogId}
                  placeholder="从工作源目录选择"
                  options={unboundCatalog.map((item) => ({
                    value: item.id,
                    label: `${WORK_SOURCE_TYPE_LABELS[item.type]} · ${item.name}`,
                  }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>访问权限</Label>
                <Select
                  value={access}
                  onValueChange={(value) =>
                    setAccess(value as ProjectWorkSourceBinding["access"])
                  }
                  options={[
                    { value: "read", label: "只读" },
                    { value: "read_write", label: "读写" },
                  ]}
                />
              </div>
              {selectedCatalogId ? (
                (() => {
                  const selected = unboundCatalog.find(
                    (item) => item.id === selectedCatalogId
                  );
                  if (!selected) return null;
                  return (
                    <div className="rounded-lg border border-slate-200 bg-[#f8f9fb] px-3 py-2.5 text-[12px] text-[#5a6779]">
                      <div className="truncate">{selected.locator}</div>
                      {selected.branch ? (
                        <div className="mt-0.5">Branch · {selected.branch}</div>
                      ) : null}
                      <div className="mt-0.5">
                        状态 ·{" "}
                        {
                          WORK_SOURCE_AVAILABILITY_LABELS[
                            selected.availability
                          ]
                        }
                      </div>
                    </div>
                  );
                })()
              ) : null}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBindOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={unboundCatalog.length === 0}
              onClick={handleBind}
            >
              确认绑定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteFileId)}
        onOpenChange={(open) => {
          if (!open) setDeleteFileId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>删除工作文件</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#5a6779]">
            确认删除该工作文件？此操作为原型 mock，不可恢复。
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteFileId(null)}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteFile}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
