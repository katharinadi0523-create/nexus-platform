"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  ManagementCell,
  ManagementIconButton,
  ManagementPrimaryButton,
  ManagementRow,
  ManagementRowActions,
  ManagementTable,
  ManagementTableBody,
  ManagementTableFrame,
  ManagementTableHead,
  ManagementTableHeader,
  ManagementTextAction,
} from "@/components/management/management-list";
import {
  dreamingDistilledMaterials,
  getMemoryStore,
  type MemoryStore,
  type UpdateJob,
  updateJobs,
} from "@/lib/mock/memory-management";
import { UpdateJobStatusBadge, formatCompactNumber } from "@/components/memory-management/memory-shared";
import {
  CreateUpdateJobDialog,
  type CreateUpdateJobValue,
} from "@/components/memory-management/create-dreaming-dialog";

export function UpdateJobList({
  stores,
  createRequested,
  initialStoreId,
}: {
  stores: MemoryStore[];
  createRequested: boolean;
  initialStoreId?: string;
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState<UpdateJob[]>(updateJobs);
  const [createOpen, setCreateOpen] = useState(false);
  const dialogOpen = createOpen || createRequested;

  const storeNameById = useMemo(
    () => new Map(stores.map((store) => [store.id, store.name])),
    [stores]
  );

  function handleRefresh() {
    setJobs(updateJobs);
    toast.success("记忆沉淀任务已刷新。");
  }

  function handleCreateOpenChange(open: boolean) {
    setCreateOpen(open);
    if (!open && createRequested) {
      router.replace("/memory-management?tab=dreaming");
    }
  }

  function handleCreate(value: CreateUpdateJobValue) {
    const store = stores.find((item) => item.id === value.storeId);
    if (!store) {
      toast.error("未找到原始记忆库。");
      return;
    }
    const selectedDistilledMaterials = dreamingDistilledMaterials.filter((material) =>
      value.distilledMaterialIds.includes(material.id)
    );
    const inputMaterialCount = (value.session ? 1 : 0) + selectedDistilledMaterials.length;
    const materialSummary = value.session?.sessionTitle ?? selectedDistilledMaterials[0]?.nodePath ?? "C Node 蒸馏材料";
    const id = `job-${Date.now()}`;
    const job: UpdateJob = {
      id,
      name: `${store.name} · ${materialSummary}`,
      storeId: store.id,
      materialScope: "manual",
      inputMaterialCount,
      prompt: value.prompt || undefined,
      modelTier: "standard",
      status: "pending_review",
      tokenUsage: 22420,
      duration: "2 分 46 秒",
      addedNodeCount: 4,
      removedNodeCount: 1,
      modifiedNodeCount: 5,
      createdBy: "当前用户",
      createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      diffFiles: updateJobs[0].diffFiles,
    };
    setJobs((current) => [job, ...current]);
    setCreateOpen(false);
    toast.success("记忆沉淀已生成 vNext Draft，等待审核。");
    const params = new URLSearchParams({
      name: job.name,
      storeId: job.storeId,
      inputMaterialCount: String(job.inputMaterialCount),
      prompt: job.prompt ?? "",
      modelTier: job.modelTier,
      agentId: value.session?.agentId ?? "",
      sessionId: value.session?.sessionId ?? "",
      distilledMaterialIds: value.distilledMaterialIds.join(","),
    });
    router.push(`/memory-management/dreaming/${id}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          基于会话、C 记忆与更新材料池生产 vNext Draft，发布前不会改变当前 Store。
        </p>
        <div className="flex items-center gap-2">
          <ManagementIconButton onClick={handleRefresh} aria-label="刷新记忆沉淀">
            <RefreshCw className="h-4 w-4" />
          </ManagementIconButton>
          <ManagementPrimaryButton onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            记忆沉淀
          </ManagementPrimaryButton>
        </div>
      </div>

      <ManagementTableFrame>
        <ManagementTable className="min-w-[1080px] table-fixed">
          <ManagementTableHeader>
            <ManagementTableHead className="w-[230px]">任务名</ManagementTableHead>
            <ManagementTableHead className="w-[210px]">目标 Store</ManagementTableHead>
            <ManagementTableHead className="w-[110px]">输入材料数</ManagementTableHead>
            <ManagementTableHead className="w-[110px]">状态</ManagementTableHead>
            <ManagementTableHead className="w-[110px]">Token 消耗</ManagementTableHead>
            <ManagementTableHead className="w-[100px]">创建人</ManagementTableHead>
            <ManagementTableHead className="w-[170px]">创建时间</ManagementTableHead>
            <ManagementTableHead className="w-[90px]">操作</ManagementTableHead>
          </ManagementTableHeader>
          <ManagementTableBody>
            {jobs.map((job) => (
              <ManagementRow key={job.id}>
                <ManagementCell className="font-semibold text-slate-900">{job.name}</ManagementCell>
                <ManagementCell>
                  {storeNameById.get(job.storeId) ?? getMemoryStore(job.storeId)?.name ?? job.storeId}
                </ManagementCell>
                <ManagementCell>{job.inputMaterialCount}</ManagementCell>
                <ManagementCell>
                  <UpdateJobStatusBadge status={job.status} />
                </ManagementCell>
                <ManagementCell>{formatCompactNumber(job.tokenUsage)}</ManagementCell>
                <ManagementCell>{job.createdBy}</ManagementCell>
                <ManagementCell>{job.createdAt}</ManagementCell>
                <ManagementCell>
                  <ManagementRowActions>
                    <ManagementTextAction
                      onClick={() => router.push(`/memory-management/dreaming/${job.id}`)}
                    >
                      详情
                    </ManagementTextAction>
                  </ManagementRowActions>
                </ManagementCell>
              </ManagementRow>
            ))}
          </ManagementTableBody>
        </ManagementTable>
      </ManagementTableFrame>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>共 {jobs.length} 个任务</span>
        <span>第 1 / 1 页</span>
      </div>

      <CreateUpdateJobDialog
        open={dialogOpen}
        onOpenChange={handleCreateOpenChange}
        stores={stores}
        initialStoreId={initialStoreId}
        onSubmit={handleCreate}
      />
    </div>
  );
}
