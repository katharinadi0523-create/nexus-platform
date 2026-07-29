"use client";

import { useMemo } from "react";
import { ArrowDown } from "lucide-react";
import { WorkspaceEntryIcon } from "@/components/claw-hub-next/detail/workspace-section";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";
import { DrawerShell } from "@/components/my-claw/project-conversation/shared/drawer-shell";
import { formatRelativeTime } from "@/components/my-claw/project-issues/format";
import type {
  ProjectArtifact,
  ProjectFileNode,
  Transformation,
} from "@/lib/mock/my-claw/project-conversation";

interface FileDetailDrawerProps {
  fileId: string;
  onClose: () => void;
}

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface LineageStep {
  artifact: ProjectArtifact;
  transformation?: Transformation;
  isCurrent: boolean;
}

function buildUpstreamLineage(
  artifact: ProjectArtifact,
  artifacts: ProjectArtifact[],
  transformations: Transformation[]
): LineageStep[] {
  const byId = new Map(artifacts.map((item) => [item.id, item]));
  const chain: LineageStep[] = [];
  const visited = new Set<string>();
  let cursor: ProjectArtifact | undefined = artifact;

  while (cursor && !visited.has(cursor.id)) {
    visited.add(cursor.id);
    const transformation = transformations.find((item) =>
      item.outputArtifactIds.includes(cursor!.id)
    );
    chain.unshift({
      artifact: cursor,
      transformation,
      isCurrent: cursor.id === artifact.id,
    });
    const parentId = cursor.sourceArtifactIds?.[0];
    cursor = parentId ? byId.get(parentId) : undefined;
  }

  return chain;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-2 text-[12px]">
      <div className="text-[#5a6779]">{label}</div>
      <div className="min-w-0 break-words text-slate-800">{value}</div>
    </div>
  );
}

export function FileDetailDrawer({ fileId, onClose }: FileDetailDrawerProps) {
  const {
    state,
    getUser,
    getActor,
    getConversation,
    getTransformations,
  } = useProjectConversation();

  const file = state.files.find(
    (item): item is ProjectFileNode =>
      item.id === fileId && item.nodeType === "file"
  );

  const artifact = state.artifacts.find((item) => item.fileNodeId === fileId);

  const lineage = useMemo(() => {
    if (!artifact || !file) return [];
    return buildUpstreamLineage(
      artifact,
      state.artifacts,
      getTransformations(file.projectId)
    );
  }, [artifact, file, getTransformations, state.artifacts]);

  if (!file) {
    return (
      <DrawerShell title="文件详情" onClose={onClose}>
        <p className="text-[13px] text-[#5a6779]">文件不存在</p>
      </DrawerShell>
    );
  }

  const author =
    file.createdBy.kind === "human"
      ? getUser(file.createdBy.id)?.name
      : getActor(file.createdBy.id)?.name;
  const conversation = file.sourceConversationId
    ? getConversation(file.sourceConversationId)
    : undefined;
  const displayName = file.name.includes(".")
    ? file.name
    : file.name;

  return (
    <DrawerShell title="文件详情" onClose={onClose}>
      <div className="space-y-5">
        <section className="flex items-start gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8f9fb] px-3 py-3">
          <WorkspaceEntryIcon
            entry={{ kind: "file", name: displayName }}
            className="mt-0.5 h-6 w-6"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold text-slate-900">
              {displayName}
            </div>
            <div className="mt-1 text-[11px] text-[#5a6779]">
              {file.scope === "project" ? "Project 文件" : "会话文件"}
            </div>
          </div>
        </section>

        <section className="space-y-2.5">
          <h3 className="text-[12px] font-semibold text-slate-900">基本信息</h3>
          <div className="space-y-2 rounded-lg border border-[#eef2f6] px-3 py-3">
            <InfoRow label="路径" value={file.path ?? file.name} />
            <InfoRow label="大小" value={formatBytes(file.sizeBytes)} />
            <InfoRow label="类型" value={file.mimeType ?? "-"} />
            <InfoRow
              label="来源"
              value={
                file.source === "human_upload" ? "人工上传" : "Agent 产物"
              }
            />
            <InfoRow label="创建者" value={author ?? "未知"} />
            <InfoRow
              label="归属"
              value={file.scope === "project" ? "Project" : "当前会话"}
            />
            <InfoRow
              label="来源会话"
              value={conversation?.name ?? "外部上传 / 无会话"}
            />
            <InfoRow
              label="创建时间"
              value={formatRelativeTime(file.createdAt)}
            />
          </div>
        </section>

        <section className="space-y-2.5">
          <h3 className="text-[12px] font-semibold text-slate-900">数据血缘</h3>
          {lineage.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#e2e8f0] px-3 py-6 text-center text-[12px] text-[#5a6779]">
              暂无血缘记录。该文件可能为直接上传或尚未关联 Transformation。
            </div>
          ) : (
            <div className="rounded-lg border border-[#eef2f6] px-3 py-3">
              <ol className="space-y-0">
                {lineage.map((step, index) => (
                  <li key={step.artifact.id}>
                    {index > 0 ? (
                      <div className="flex items-center gap-2 py-2 pl-3 text-[11px] text-[#5a6779]">
                        <ArrowDown className="h-3.5 w-3.5 text-[#2773ff]" />
                        <span>
                          {step.transformation?.operationLabel ?? "派生"}
                          {step.transformation?.executorType
                            ? ` · ${step.transformation.executorType}`
                            : ""}
                        </span>
                      </div>
                    ) : null}
                    <div
                      className={`rounded-lg border px-3 py-2.5 ${
                        step.isCurrent
                          ? "border-[#2773ff] bg-[#e8f0fb]/50"
                          : "border-[#eef2f6] bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <WorkspaceEntryIcon
                          entry={{ kind: "file", name: step.artifact.name }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12px] font-medium text-slate-800">
                            {step.artifact.name}
                            {step.isCurrent ? (
                              <span className="ml-1.5 text-[10px] font-normal text-[#2773ff]">
                                当前文件
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#5a6779]">
                            {step.artifact.kind}
                            {" · "}
                            {formatRelativeTime(step.artifact.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      </div>
    </DrawerShell>
  );
}
