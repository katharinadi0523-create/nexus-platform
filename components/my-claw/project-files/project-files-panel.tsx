"use client";

import { useState } from "react";
import { toast } from "sonner";
import { WorkspaceEntryIcon } from "@/components/claw-hub-next/detail/workspace-section";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";
import { DrawerShell } from "@/components/my-claw/project-conversation/shared/drawer-shell";
import { FileDetailDrawer } from "./file-detail-drawer";
import { FileRowActions } from "./file-row-actions";

interface ProjectFilesPanelProps {
  projectId: string;
  onClose: () => void;
  onJumpToMessage?: (messageId: string) => void;
}

export function ProjectFilesPanel({
  projectId,
  onClose,
}: ProjectFilesPanelProps) {
  const { getProjectFiles } = useProjectConversation();
  const [detailFileId, setDetailFileId] = useState<string | null>(null);

  const files = getProjectFiles(projectId).filter(
    (item) => item.nodeType === "file",
  );

  if (detailFileId) {
    return (
      <FileDetailDrawer
        fileId={detailFileId}
        onClose={() => setDetailFileId(null)}
      />
    );
  }

  return (
    <DrawerShell title="Project 文件" onClose={onClose}>
      <ul className="space-y-1">
        {files.map((file) => (
          <li
            key={file.id}
            className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] px-3 py-2"
          >
            <WorkspaceEntryIcon
              entry={{ kind: "file", name: file.name }}
              className="h-4 w-4"
            />
            <div className="min-w-0 flex-1 truncate text-[12px] font-medium text-slate-800">
              {file.name}
            </div>
            <FileRowActions
              fileName={file.name}
              onPreview={() => toast.message(`预览 ${file.name}（原型占位）`)}
              onDownload={() => toast.success(`已开始下载 ${file.name}`)}
              onDetails={() => setDetailFileId(file.id)}
            />
          </li>
        ))}
      </ul>
      {files.length === 0 ? (
        <div className="py-8 text-center text-[12px] text-[#5a6779]">
          暂无 Project 公开文件
        </div>
      ) : null}
    </DrawerShell>
  );
}

interface ConversationFilesPanelProps {
  conversationId: string;
  onClose: () => void;
  onJumpToMessage?: (messageId: string) => void;
}

export function ConversationFilesPanel({
  conversationId,
  onClose,
}: ConversationFilesPanelProps) {
  const {
    getConversationFiles,
    getConversationProducedFiles,
    getConversation,
    publishArtifactToProject,
    state,
  } = useProjectConversation();
  const [detailFileId, setDetailFileId] = useState<string | null>(null);

  const conversation = getConversation(conversationId);
  const privateFiles = getConversationFiles(conversationId);
  const publishedFiles = getConversationProducedFiles(conversationId).filter(
    (file) => file.scope === "project",
  );

  const renderFile = (file: (typeof privateFiles)[number]) => {
    const artifact = state.artifacts.find(
      (item) => item.fileNodeId === file.id,
    );
    const published = file.scope === "project";

    return (
      <li
        key={file.id}
        className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] px-3 py-2"
      >
        <WorkspaceEntryIcon
          entry={{ kind: "file", name: file.name }}
          className="h-4 w-4"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-medium text-slate-800">
            {file.name}
          </div>
          <div className="mt-0.5 text-[10px] text-[#5a6779]">
            {published ? "已发布到 Project" : "仅当前会话可见"}
          </div>
        </div>
        <FileRowActions
          fileName={file.name}
          onPreview={() => toast.message(`预览 ${file.name}（原型占位）`)}
          onDownload={() => toast.success(`已开始下载 ${file.name}`)}
          onDetails={() => setDetailFileId(file.id)}
        />
        {artifact && artifact.scope === "conversation" ? (
          <button
            type="button"
            className="shrink-0 text-[11px] text-[#2773ff]"
            onClick={() => {
              publishArtifactToProject(artifact.id);
              toast.success("已同步到 Project");
            }}
          >
            同步
          </button>
        ) : null}
      </li>
    );
  };

  if (detailFileId) {
    return (
      <FileDetailDrawer
        fileId={detailFileId}
        onClose={() => setDetailFileId(null)}
      />
    );
  }

  return (
    <DrawerShell title="会话文件" onClose={onClose}>
      <p className="mb-3 text-[12px] text-[#5a6779]">
        展示当前会话产生的文件；已发布产物可在此直接查看详情与数据血缘。
        {conversation?.defaultArtifactScope === "conversation"
          ? " 本会话新文件默认落入此处。"
          : " 本会话新文件默认公开到 Project。"}
      </p>
      {publishedFiles.length > 0 ? (
        <section>
          <h3 className="mb-1.5 text-[12px] font-semibold text-slate-800">
            已发布产物 · {publishedFiles.length}
          </h3>
          <ul className="space-y-1">{publishedFiles.map(renderFile)}</ul>
        </section>
      ) : null}
      {privateFiles.length > 0 ? (
        <section className={publishedFiles.length > 0 ? "mt-4" : undefined}>
          <h3 className="mb-1.5 text-[12px] font-semibold text-slate-800">
            当前会话文件 · {privateFiles.length}
          </h3>
          <ul className="space-y-1">{privateFiles.map(renderFile)}</ul>
        </section>
      ) : null}
      {privateFiles.length === 0 && publishedFiles.length === 0 ? (
        <div className="py-8 text-center text-[12px] text-[#5a6779]">
          暂无当前会话产生的文件
        </div>
      ) : null}
    </DrawerShell>
  );
}
