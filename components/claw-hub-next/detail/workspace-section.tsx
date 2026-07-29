"use client";

import { useMemo, useState } from "react";
import {
  CheckSquare,
  ChevronRight,
  Download,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Square,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type WorkspaceEntryItem, type WorkspaceFolderItem, type WorkspaceStorageConfig } from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";
import { countWorkspaceItems, getWorkspaceTrail } from "./utils";

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

/** Finder-style glyph by extension — shared by workbench + Project files. */
export function WorkspaceEntryIcon({
  entry,
  className,
}: {
  entry: WorkspaceEntryItem | { kind: "file"; name: string } | { kind: "folder"; name?: string };
  className?: string;
}) {
  const iconClass = cn("h-4 w-4 shrink-0", className);
  if (entry.kind === "folder") {
    return <Folder className={cn(iconClass, "text-amber-500")} />;
  }

  const name = entry.name.toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop() ?? "" : "";

  if (["md", "txt", "doc", "docx", "pdf", "rtf"].includes(ext)) {
    return <FileText className={cn(iconClass, "text-sky-600")} />;
  }
  if (["csv", "xls", "xlsx", "tsv"].includes(ext)) {
    return <FileSpreadsheet className={cn(iconClass, "text-emerald-600")} />;
  }
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return <FileImage className={cn(iconClass, "text-violet-600")} />;
  }
  if (
    ["ts", "tsx", "js", "jsx", "json", "py", "ipynb", "log", "yml", "yaml", "sh"].includes(
      ext
    )
  ) {
    return <FileCode2 className={cn(iconClass, "text-slate-600")} />;
  }
  return <FileText className={cn(iconClass, "text-slate-500")} />;
}

function EntryIcon({ entry }: { entry: WorkspaceEntryItem }) {
  return <WorkspaceEntryIcon entry={entry} />;
}

export function ClawWorkspaceSection({
  workspaceRoot,
  storageConfig,
  selectedPath,
  onSelectPath,
  onOpenStorageConfig,
  mode = "full",
  title = "工作空间",
  hideRootTrail = false,
  hideEntryDescription = false,
  fileMenuMode = "download",
  onFileAction,
}: {
  workspaceRoot: WorkspaceFolderItem;
  storageConfig: WorkspaceStorageConfig;
  selectedPath: string[];
  onSelectPath: (path: string[]) => void;
  onOpenStorageConfig: () => void;
  /** embedded: omit storage hero; used inside Project overview */
  mode?: "full" | "embedded";
  title?: string;
  /** Hide breadcrumb strip when still at workspace root */
  hideRootTrail?: boolean;
  /** Hide gray subtitle under entry name */
  hideEntryDescription?: boolean;
  /** download = single download link; menu = ⋯ 预览/下载/详情 */
  fileMenuMode?: "download" | "menu";
  onFileAction?: (
    action: "preview" | "download" | "details",
    entryId: string,
    entryName: string
  ) => void;
}) {
  const embedded = mode === "embedded";
  const trail = getWorkspaceTrail(workspaceRoot, selectedPath);
  const showTrail = !(hideRootTrail && selectedPath.length === 0);
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

  const padX = embedded ? "px-4" : "px-6";

  return (
    <div className={cn("space-y-4", embedded && "space-y-0")}>
      {!embedded ? (
        <div className="border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 px-6 py-5">
            <div>
              <div className="text-lg font-semibold text-slate-950">{title}</div>
              <div className="mt-1 text-sm text-slate-500">
                当前目录共 {counts.folders} 个文件夹、{counts.files} 个文件，已使用{" "}
                {storageConfig.workspaceUsedGb}GB。
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
      ) : null}

      <div className={cn("border border-slate-200 bg-white", embedded && "rounded-xl")}>
        <div className={cn("flex flex-wrap items-center gap-3 py-3", padX, embedded && "py-2.5")}>
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

        {showTrail ? (
          <div className={cn("border-t border-slate-200 py-2.5", padX)}>
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
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-t border-slate-200">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-left text-sm text-slate-700">
                <th className={cn("w-14 py-3", padX)}>
                  <button type="button" onClick={toggleAllEntries} className="text-slate-500 hover:text-slate-700">
                    {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-2 py-3 font-medium">文件名</th>
                <th className="w-[120px] px-3 py-3 font-medium">大小</th>
                <th className="w-[160px] px-3 py-3 font-medium">修改时间</th>
                <th className="w-[120px] px-3 py-3 font-medium">更新人</th>
                <th className={cn("w-[100px] py-3 text-right font-medium", padX)}>操作</th>
              </tr>
            </thead>
            <tbody>
              {currentFolder.children.length === 0 ? (
                <tr>
                  <td colSpan={6} className={cn("py-12 text-center text-sm text-slate-500", padX)}>
                    当前目录暂无内容。
                  </td>
                </tr>
              ) : (
                currentFolder.children.map((entry) => {
                  const isSelected = visibleSelectedEntryIds.includes(entry.id);

                  return (
                    <tr key={entry.id} className={cn("border-b border-slate-200 text-sm", isSelected && "bg-slate-50")}>
                      <td className={cn("py-3", padX)}>
                        <button type="button" onClick={() => toggleEntry(entry.id)} className="text-slate-500 hover:text-slate-700">
                          {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          className="flex items-center gap-2 text-left text-slate-800 hover:text-slate-950"
                          onClick={() => handleOpenFolder(entry)}
                        >
                          <EntryIcon entry={entry} />
                          <span className="truncate">{entry.name}</span>
                        </button>
                        {!hideEntryDescription &&
                        "description" in entry &&
                        entry.description ? (
                          <div className="mt-1 text-xs text-slate-400">{entry.description}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-slate-500">{entry.kind === "folder" ? "-" : entry.sizeLabel}</td>
                      <td className="px-3 py-3 text-slate-500">{entry.kind === "folder" ? "-" : entry.updatedAt}</td>
                      <td className="px-3 py-3 text-slate-500">{entry.kind === "folder" ? "-" : entry.updatedBy}</td>
                      <td className={cn("py-3 text-right", padX)}>
                        {entry.kind === "folder" ? (
                          <button type="button" className="text-blue-600 hover:text-blue-700" onClick={() => handleOpenFolder(entry)}>
                            打开
                          </button>
                        ) : fileMenuMode === "menu" ? (
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  aria-label={`${entry.name} 操作`}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (onFileAction) {
                                      onFileAction("preview", entry.id, entry.name);
                                    } else {
                                      toast.message(`预览 ${entry.name}（原型占位）`);
                                    }
                                  }}
                                >
                                  预览
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (onFileAction) {
                                      onFileAction("download", entry.id, entry.name);
                                    } else {
                                      toast.success(`文件 ${entry.name} 下载入口待接入。`);
                                    }
                                  }}
                                >
                                  下载
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    onFileAction?.("details", entry.id, entry.name);
                                  }}
                                >
                                  详情
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
    </div>
  );
}
