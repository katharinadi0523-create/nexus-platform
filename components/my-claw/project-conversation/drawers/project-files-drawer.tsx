"use client";

import { useState } from "react";import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ProjectFileNode } from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "../project-conversation-provider";
import { DrawerShell } from "../shared/drawer-shell";

interface ProjectFilesDrawerProps {
  projectId: string;
  onClose: () => void;
  onJumpToMessage?: (messageId: string) => void;
}

function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectFilesDrawer({
  projectId,
  onClose,
  onJumpToMessage,
}: ProjectFilesDrawerProps) {
  const { getFiles, getUser, getActor, setHighlightedMessage, closeDrawer } =
    useProjectConversation();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "folder-docs": true,
    "folder-qa": true,
  });

  const files = getFiles(projectId);
  const q = query.trim().toLowerCase();

  const folders = files.filter((f) => f.nodeType === "folder");
  const filteredFiles = files.filter((f) => {
    if (f.nodeType !== "file") return false;
    if (!q) return true;
    return f.name.toLowerCase().includes(q);
  });
  const roots = filteredFiles.filter((f) => !f.parentFolderId);
  const byFolder = new Map<string, ProjectFileNode[]>();
  for (const file of filteredFiles) {
    if (!file.parentFolderId) continue;
    const list = byFolder.get(file.parentFolderId) ?? [];
    list.push(file);
    byFolder.set(file.parentFolderId, list);
  }

  const renderFile = (file: ProjectFileNode) => {
    const author =
      file.createdBy.kind === "human"
        ? getUser(file.createdBy.id)?.name
        : getActor(file.createdBy.id)?.name;

    return (
      <li key={file.id}>
        <button
          type="button"
          onClick={() => {
            if (file.sourceMessageId) {
              setHighlightedMessage(file.sourceMessageId);
              onJumpToMessage?.(file.sourceMessageId);
              closeDrawer();
            }
          }}
          className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-[#f8f9fb]"
        >
          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2773ff]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-slate-800">
              {file.name}
            </div>
            <div className="mt-0.5 text-[11px] text-[#5a6779]">
              {formatBytes(file.sizeBytes)} · {author ?? "未知"} ·{" "}
              {file.source === "agent_artifact" ? "Agent 产物" : "上传"}
              {file.sourceMessageId ? " · 跳转来源消息" : ""}
            </div>
          </div>
        </button>
      </li>
    );
  };

  return (
    <DrawerShell title="文件与产物" onClose={onClose}>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5a6779]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索文件…"
          className="h-8 border-[#e2e8f0] bg-[#f8f9fb] pl-8 text-[13px] shadow-none"
        />
      </div>

      {filteredFiles.length === 0 ? (
        <p className="py-8 text-center text-[12px] text-[#5a6779]">
          暂无匹配文件
        </p>
      ) : (
        <div className="space-y-2">
          {folders.map((folder) => {
            const children = byFolder.get(folder.id) ?? [];
            if (q && children.length === 0) return null;
            const isOpen = expanded[folder.id] ?? false;
            return (
              <div key={folder.id}>
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [folder.id]: !isOpen,
                    }))
                  }
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-[#f8f9fb]"
                >
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-[#5a6779]" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-[#5a6779]" />
                  )}
                  <Folder className="h-3.5 w-3.5 text-amber-500" />
                  <span className="truncate">{folder.name}</span>
                  <span className="ml-auto text-[11px] font-normal text-[#5a6779]">
                    {children.length}
                  </span>
                </button>
                {isOpen ? (
                  <ul className="ml-2 border-l border-[#eef2f6] pl-1">
                    {children.map(renderFile)}
                  </ul>
                ) : null}
              </div>
            );
          })}

          {roots.length > 0 ? (
            <ul className="space-y-0.5">{roots.map(renderFile)}</ul>
          ) : null}
        </div>
      )}
    </DrawerShell>
  );
}
