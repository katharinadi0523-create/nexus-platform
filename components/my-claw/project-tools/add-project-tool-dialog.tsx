"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";

interface AddProjectToolDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProjectToolDialog({
  projectId,
  open,
  onOpenChange,
}: AddProjectToolDialogProps) {
  const { state, getSharedTools, bindSharedTool } = useProjectConversation();
  const boundVersionIds = useMemo(
    () =>
      new Set(
        getSharedTools(projectId).map((item) => item.publishedResourceVersionId)
      ),
    [getSharedTools, projectId]
  );

  const catalog = state.publishedTools.filter(
    (item) => item.available && !boundVersionIds.has(item.versionId)
  );

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );
  const [permission, setPermission] = useState<"read" | "execute" | "write">(
    "execute"
  );

  const selected = catalog.find((item) => item.versionId === selectedVersionId);

  const handleAdd = () => {
    if (!selectedVersionId) return;
    bindSharedTool({
      projectId,
      publishedResourceVersionId: selectedVersionId,
      permission,
      credentialRef: selected?.requiresCredential
        ? `cred-${selected.id}`
        : undefined,
    });
    setSelectedVersionId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>添加共享工具</DialogTitle>
        </DialogHeader>

        <p className="text-[12px] text-[#5a6779]">
          从当前用户可访问的已发布资源目录选择，绑定到本 Project。
        </p>

        <ul className="max-h-64 space-y-1.5 overflow-y-auto">
          {catalog.length === 0 ? (
            <li className="py-8 text-center text-[12px] text-[#5a6779]">
              没有可添加的工具
            </li>
          ) : (
            catalog.map((tool) => {
              const active = selectedVersionId === tool.versionId;
              return (
                <li key={tool.versionId}>
                  <button
                    type="button"
                    onClick={() => setSelectedVersionId(tool.versionId)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                      active
                        ? "border-[#2773ff] bg-[#f5f9ff]"
                        : "border-[#eef2f6] hover:bg-[#f8f9fb]"
                    )}
                  >
                    <div className="text-[13px] font-medium text-slate-900">
                      {tool.name}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#5a6779]">
                      {tool.kind} · {tool.version} · {tool.publisher}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[12px] text-[#5a6779]">
                      {tool.description}
                    </p>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        {selected ? (
          <div className="rounded-lg border border-[#eef2f6] bg-[#f8f9fb] px-3 py-2">
            <div className="mb-1.5 text-[11px] font-medium text-[#5a6779]">
              权限
            </div>
            <div className="flex gap-1">
              {(["read", "execute", "write"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPermission(item)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[12px] font-medium",
                    permission === item
                      ? "bg-white text-[#2773ff] shadow-sm"
                      : "text-[#5a6779]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            {selected.requiresCredential ? (
              <p className="mt-2 text-[11px] text-amber-700">
                该工具需要凭证，添加后可能进入「需授权」状态。
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            className="bg-[#2773ff] hover:bg-[#1f63e0]"
            disabled={!selectedVersionId}
            onClick={handleAdd}
          >
            添加到 Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
