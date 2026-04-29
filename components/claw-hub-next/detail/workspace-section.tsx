"use client";

import { useMemo, useState } from "react";
import { CheckSquare, ChevronRight, Download, FileText, Folder, FolderPlus, Square, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { type WorkspaceEntryItem, type WorkspaceFolderItem, type WorkspaceStorageConfig } from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";
import { countWorkspaceItems, getWorkspaceTrail } from "./utils";

function formatQuota(storageConfig: WorkspaceStorageConfig) {
  if (storageConfig.workspaceQuotaGb === null) {
    return "未设置";
  }
  return `${storageConfig.workspaceQuotaGb}GB`;
}

function findCurrentFolder(root: WorkspaceFolderItem, path: string[]) {
  let current = root;

  for (const folderId of path) {
    const next = current.children.find(
      (item): item is WorkspaceFolderItem => item.kind === "folder" && item.id === folderId
    );
    if (!next) {
      break;
    }
    current = next;
  }

  return current;
}

function flattenStorageSummary(storageConfig: WorkspaceStorageConfig) {
  return [
    { label: "存储卷名称", value: storageConfig.volumeDisplayName },
    { label: "存储源", value: storageConfig.volumeName },
    { label: "分配容量", value: `${storageConfig.volumeTotalGb.toFixed(2)}GB` },
    { label: "绑定项目", value: storageConfig.projectName ?? "--" },
    { label: "存储卷描述", value: storageConfig.volumeDescription || "--" },
    { label: "子目录", value: storageConfig.subdirectory },
    { label: "所属组织", value: storageConfig.organizationName },
  ];
}

function EntryIcon({ entry }: { entry: WorkspaceEntryItem }) {
  if (entry.kind === "folder") {
    return <Folder className="h-4 w-4 text-slate-500" />;
  }

  return <FileText className="h-4 w-4 text-slate-500" />;
}

export function ClawWorkspaceSection({
  workspaceRoot,
  storageConfig,
  selectedPath,
  onSelectPath,
  onOpenStorageConfig,
}: {
  workspaceRoot: WorkspaceFolderItem;
  storageConfig: WorkspaceStorageConfig;
  selectedPath: string[];
  onSelectPath: (path: string[]) => void;
  onOpenStorageConfig: () => void;
}) {
  const trail = getWorkspaceTrail(workspaceRoot, selectedPath);
  const currentFolder = findCurrentFolder(workspaceRoot, selectedPath);
  const counts = countWorkspaceItems(workspaceRoot.children);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const visibleEntryIds = useMemo(() => currentFolder.children.map((entry) => entry.id), [currentFolder.children]);
  const visibleSelectedEntryIds = useMemo(
    () => selectedEntryIds.filter((entryId) => visibleEntryIds.includes(entryId)),
    [selectedEntryIds, visibleEntryIds]
  );
  const allSelected = currentFolder.children.length > 0 && visibleSelectedEntryIds.length === currentFolder.children.length;
  const hasSelection = visibleSelectedEntryIds.length > 0;
  const storageSummary = useMemo(() => flattenStorageSummary(storageConfig), [storageConfig]);

  function toggleEntry(entryId: string) {
    setSelectedEntryIds((current) =>
      current.includes(entryId) ? current.filter((id) => id !== entryId) : [...current, entryId]
    );
  }

  function toggleAllEntries() {
    if (allSelected) {
      setSelectedEntryIds([]);
      return;
    }

    setSelectedEntryIds(currentFolder.children.map((entry) => entry.id));
  }

  function handleOpenFolder(entry: WorkspaceEntryItem) {
    if (entry.kind !== "folder") {
      return;
    }

    onSelectPath([...selectedPath, entry.id]);
  }

  function handleBatchAction(action: "download" | "delete") {
    if (!hasSelection) {
      return;
    }

    toast.success(`已选择 ${visibleSelectedEntryIds.length} 项，${action === "download" ? "批量下载" : "批量删除"}入口待接入。`);
  }

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-6 py-5">
          <div>
            <div className="text-lg font-semibold text-slate-950">工作空间</div>
            <div className="mt-1 text-sm text-slate-500">
              当前目录共 {counts.folders} 个文件夹、{counts.files} 个文件，已使用 {storageConfig.workspaceUsedGb}GB。
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-md border-slate-200 bg-white shadow-none"
            onClick={onOpenStorageConfig}
          >
            存储配置
          </Button>
        </div>
      </div>

      <div className="border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-md border-slate-200 bg-white shadow-none"
            onClick={() => toast.success("上传入口待接入。")}
          >
            <Upload className="mr-1 h-4 w-4" />
            上传
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-md border-slate-200 bg-white shadow-none"
            onClick={() => toast.success("新建文件夹入口待接入。")}
          >
            <FolderPlus className="mr-1 h-4 w-4" />
            新建文件夹
          </Button>
          <span className="h-4 w-px bg-slate-200" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasSelection}
            className="rounded-md border-slate-200 bg-white shadow-none"
            onClick={() => handleBatchAction("download")}
          >
            批量下载
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasSelection}
            className="rounded-md border-slate-200 bg-white shadow-none"
            onClick={() => handleBatchAction("delete")}
          >
            批量操作
          </Button>
        </div>

        <div className="border-t border-slate-200 px-6 py-3">
          <div className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
            {trail.map((folder, index) => (
              <div key={folder.id} className="inline-flex items-center gap-1">
                {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-slate-300" /> : null}
                <button
                  type="button"
                  className={cn("transition-colors hover:text-slate-900", index === trail.length - 1 && "text-slate-900")}
                  onClick={() => onSelectPath(selectedPath.slice(0, Math.max(0, index)))}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-t border-slate-200">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-left text-sm text-slate-700">
                <th className="w-14 px-6 py-3">
                  <button type="button" onClick={toggleAllEntries} className="text-slate-500 hover:text-slate-700">
                    {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-2 py-3 font-medium">文件名</th>
                <th className="w-[140px] px-4 py-3 font-medium">大小</th>
                <th className="w-[200px] px-4 py-3 font-medium">修改时间</th>
                <th className="w-[160px] px-4 py-3 font-medium">更新人</th>
                <th className="w-[120px] px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {currentFolder.children.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-500">
                    当前目录暂无内容。
                  </td>
                </tr>
              ) : (
                currentFolder.children.map((entry) => {
                  const isSelected = visibleSelectedEntryIds.includes(entry.id);

                  return (
                    <tr key={entry.id} className={cn("border-b border-slate-200 text-sm", isSelected && "bg-slate-50")}>
                      <td className="px-6 py-4">
                        <button type="button" onClick={() => toggleEntry(entry.id)} className="text-slate-500 hover:text-slate-700">
                          {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-2 py-4">
                        <button
                          type="button"
                          className="flex items-center gap-2 text-left text-slate-800 hover:text-slate-950"
                          onClick={() => handleOpenFolder(entry)}
                        >
                          <EntryIcon entry={entry} />
                          <span className="truncate">{entry.name}</span>
                        </button>
                        {"description" in entry && entry.description ? (
                          <div className="mt-1 text-xs text-slate-400">{entry.description}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-slate-500">{entry.kind === "folder" ? "-" : entry.sizeLabel}</td>
                      <td className="px-4 py-4 text-slate-500">{entry.kind === "folder" ? "-" : entry.updatedAt}</td>
                      <td className="px-4 py-4 text-slate-500">{entry.kind === "folder" ? "-" : entry.updatedBy}</td>
                      <td className="px-4 py-4 text-right">
                        {entry.kind === "folder" ? (
                          <button type="button" className="text-blue-600 hover:text-blue-700" onClick={() => handleOpenFolder(entry)}>
                            打开
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                            onClick={() => toast.success(`文件 ${entry.name} 下载入口待接入。`)}
                          >
                            <Download className="h-3.5 w-3.5" />
                            下载
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border border-slate-200 bg-white">
        <div className="grid gap-x-10 gap-y-4 px-6 py-5 md:grid-cols-2">
          {storageSummary.map((item) => (
            <div key={item.label} className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
              <div className="text-slate-500">{item.label}：</div>
              <div className="text-slate-900">{item.value}</div>
            </div>
          ))}
          <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
            <div className="text-slate-500">当前配额：</div>
            <div className="text-slate-900">{formatQuota(storageConfig)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
