"use client";

import { useMemo, useState } from "react";
import { ClawWorkspaceSection } from "@/components/claw-hub-next/detail/workspace-section";
import { WorkbenchEntityProvider } from "@/components/claw-hub-next/workbench-entity-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getPersonalClawDetail } from "@/lib/mock/my-claw";

export function MyClawFilesPage() {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [storageDialogOpen, setStorageDialogOpen] = useState(false);
  const storageConfig = detail.workspaceStorageConfig;

  return (
    <WorkbenchEntityProvider entityLabel="Claw">
      <div className="h-full min-h-0 overflow-y-auto px-6 py-5">
        <ClawWorkspaceSection
          workspaceRoot={detail.workspaceRoot}
          storageConfig={storageConfig}
          selectedPath={selectedPath}
          onSelectPath={setSelectedPath}
          onOpenStorageConfig={() => setStorageDialogOpen(true)}
        />
      </div>

      <Dialog open={storageDialogOpen} onOpenChange={setStorageDialogOpen}>
        <DialogContent className="sm:max-w-[920px]">
          <DialogHeader>
            <DialogTitle>存储配置</DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="border border-slate-200 bg-slate-50/50 px-5 py-4">
              <div className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                  <div className="text-slate-500">存储卷名称:</div>
                  <div className="text-slate-900">{storageConfig.volumeDisplayName}</div>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                  <div className="text-slate-500">存储卷描述:</div>
                  <div className="text-slate-900">{storageConfig.volumeDescription || "--"}</div>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                  <div className="text-slate-500">存储源:</div>
                  <div className="text-slate-900">{storageConfig.volumeName}</div>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                  <div className="text-slate-500">子目录:</div>
                  <div className="text-slate-900">{storageConfig.subdirectory}</div>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                  <div className="text-slate-500">分配容量:</div>
                  <div className="text-slate-900">{storageConfig.volumeTotalGb.toFixed(2)}GB</div>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                  <div className="text-slate-500">所属组织:</div>
                  <div className="text-slate-900">{storageConfig.organizationName}</div>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                  <div className="text-slate-500">绑定项目:</div>
                  <div className="text-slate-900">{storageConfig.projectName ?? "--"}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-800">已使用/总空间</Label>
              <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                {storageConfig.workspaceUsedGb}GB / {storageConfig.volumeTotalGb}GB
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStorageDialogOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setStorageDialogOpen(false)}
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkbenchEntityProvider>
  );
}
