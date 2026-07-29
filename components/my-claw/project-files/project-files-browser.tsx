"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ClawWorkspaceSection } from "@/components/claw-hub-next/detail/workspace-section";
import type {
  WorkspaceFileItem,
  WorkspaceFolderItem,
  WorkspaceStorageConfig,
} from "@/lib/mock/claw-hub-next";
import type { ProjectFileNode } from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";
import { formatRelativeTime } from "@/components/my-claw/project-issues/format";
import { FileDetailDrawer } from "./file-detail-drawer";
import { cn } from "@/lib/utils";

type FilesViewMode = "recent" | "theme";

interface ProjectFilesBrowserProps {
  projectId: string;
  className?: string;
  onOpenFileDetail?: (fileId: string) => void;
}

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ensureFileExtension(name: string, mimeType?: string) {
  if (name.includes(".")) return name;
  if (!mimeType) return name;
  if (mimeType.includes("markdown")) return `${name}.md`;
  if (mimeType.includes("csv")) return `${name}.csv`;
  if (mimeType.includes("json")) return `${name}.json`;
  if (mimeType.includes("pdf")) return `${name}.pdf`;
  if (mimeType.includes("python") || mimeType.includes("x-ipynb"))
    return `${name}.ipynb`;
  if (mimeType.startsWith("text/")) return `${name}.txt`;
  return name;
}

function themeFromPath(file: ProjectFileNode): string {
  const path = file.path ?? file.name;
  const segment = path.split(/[/\\]/).filter(Boolean)[0] ?? "";
  if (!segment || segment === file.name) {
    if (file.source === "human_upload") return "外部上传";
    if (file.source === "agent_artifact") return "Agent 产物";
    return "未分类";
  }
  return segment;
}

function toWorkspaceFile(
  file: ProjectFileNode,
  authorName: string
): WorkspaceFileItem {
  return {
    id: file.id,
    name: ensureFileExtension(file.name, file.mimeType),
    kind: "file",
    sizeLabel: formatBytes(file.sizeBytes),
    updatedAt: formatRelativeTime(file.updatedAt || file.createdAt),
    updatedBy: authorName,
  };
}

const EMPTY_STORAGE: WorkspaceStorageConfig = {
  volumeDisplayName: "Project 文件",
  volumeName: "project-files",
  subdirectory: "/",
  organizationName: "AgentFoundry",
  volumeTotalGb: 100,
  volumeAvailableGb: 80,
  workspaceUsedGb: 1.2,
  workspaceQuotaGb: null,
};

export function ProjectFilesBrowser({
  projectId,
  className,
  onOpenFileDetail,
}: ProjectFilesBrowserProps) {
  const { getProjectFiles, getUser, getActor } = useProjectConversation();
  const [view, setView] = useState<FilesViewMode>("theme");
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [detailFileId, setDetailFileId] = useState<string | null>(null);

  const files = useMemo(
    () =>
      getProjectFiles(projectId)
        .filter((item) => item.nodeType === "file")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [getProjectFiles, projectId]
  );

  const workspaceRoot = useMemo<WorkspaceFolderItem>(() => {
    const resolveAuthor = (file: ProjectFileNode) => {
      if (file.createdBy.kind === "human") {
        return getUser(file.createdBy.id)?.name ?? "未知";
      }
      return getActor(file.createdBy.id)?.name ?? "未知";
    };

    if (view === "recent") {
      return {
        id: `project-${projectId}-recent`,
        name: "全部文件",
        kind: "folder",
        children: files.map((file) =>
          toWorkspaceFile(file, resolveAuthor(file))
        ),
      };
    }

    const groups = new Map<string, ProjectFileNode[]>();
    for (const file of files) {
      const theme = themeFromPath(file);
      const list = groups.get(theme) ?? [];
      list.push(file);
      groups.set(theme, list);
    }

    const folders: WorkspaceFolderItem[] = Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b, "zh-CN"))
      .map(([theme, list]) => ({
        id: `theme-${encodeURIComponent(theme)}`,
        name: theme,
        kind: "folder" as const,
        children: list
          .slice()
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .map((file) => toWorkspaceFile(file, resolveAuthor(file))),
      }));

    return {
      id: `project-${projectId}-theme`,
      name: "全局",
      kind: "folder",
      children: folders,
    };
  }, [files, getActor, getUser, projectId, view]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] font-semibold text-slate-900">
          Project 文件 · {files.length}
        </div>
        <div className="inline-flex rounded-lg border border-[#e2e8f0] bg-[#f8f9fb] p-0.5">
          <button
            type="button"
            onClick={() => {
              setView("recent");
              setSelectedPath([]);
            }}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              view === "recent"
                ? "bg-white text-[#2773ff] shadow-sm"
                : "text-[#5a6779] hover:text-slate-700"
            )}
          >
            最近
          </button>
          <button
            type="button"
            onClick={() => {
              setView("theme");
              setSelectedPath([]);
            }}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              view === "theme"
                ? "bg-white text-[#2773ff] shadow-sm"
                : "text-[#5a6779] hover:text-slate-700"
            )}
          >
            全局
          </button>
        </div>
      </div>

      <ClawWorkspaceSection
        workspaceRoot={workspaceRoot}
        storageConfig={EMPTY_STORAGE}
        selectedPath={selectedPath}
        onSelectPath={setSelectedPath}
        onOpenStorageConfig={() => undefined}
        mode="embedded"
        title="Project 文件"
        hideRootTrail
        hideEntryDescription
        fileMenuMode="menu"
        onFileAction={(action, entryId, entryName) => {
          if (action === "preview") {
            toast.message(`预览 ${entryName}（原型占位）`);
            return;
          }
          if (action === "download") {
            toast.success(`已开始下载 ${entryName}`);
            return;
          }
          if (onOpenFileDetail) {
            onOpenFileDetail(entryId);
          } else {
            setDetailFileId(entryId);
          }
        }}
      />

      {!onOpenFileDetail && detailFileId ? (
        <FileDetailDrawer
          fileId={detailFileId}
          onClose={() => setDetailFileId(null)}
        />
      ) : null}
    </div>
  );
}
