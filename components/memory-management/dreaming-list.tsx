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
  dreamingJobs,
  getMemoryStore,
  type DreamingJob,
  type DreamingInputRef,
  type MemoryStore,
} from "@/lib/mock/memory-management";
import {
  DreamingJobStatusBadge,
  dreamingInputRefLabels,
  formatCompactNumber,
} from "@/components/memory-management/memory-shared";
import {
  CreateDreamingJobDialog,
  type CreateDreamingJobValue,
} from "@/components/memory-management/create-dreaming-dialog";

function describeInput(inputRefs: DreamingInputRef[]) {
  return inputRefs.map((ref) => dreamingInputRefLabels[ref]).join(" + ") || "—";
}

export function DreamingJobList({
  stores,
  createRequested,
  initialStoreId,
  onCreateRequestHandled,
}: {
  stores: MemoryStore[];
  createRequested: boolean;
  initialStoreId?: string;
  onCreateRequestHandled?: () => void;
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState<DreamingJob[]>(dreamingJobs);
  const [createOpen, setCreateOpen] = useState(false);
  const dialogOpen = createOpen || createRequested;

  const storeNameById = useMemo(
    () => new Map(stores.map((store) => [store.id, store.name])),
    [stores]
  );

  function handleRefresh() {
    setJobs(dreamingJobs);
    toast.success("记忆沉淀任务已刷新。");
  }

  function handleCreateOpenChange(open: boolean) {
    setCreateOpen(open);
    if (!open && createRequested) {
      onCreateRequestHandled?.();
      router.replace("/memory-management?tab=dreaming");
    }
  }

  function handleCreate(value: CreateDreamingJobValue) {
    const store = stores.find((item) => item.id === value.storeId);
    if (!store) {
      toast.error("未找到目标记忆库。");
      return;
    }
    const inputSummary = value.inputRefs
      .map((ref) =>
        ref === "session" && value.session
          ? `原始会话「${value.session.sessionTitle}」`
          : dreamingInputRefLabels[ref]
      )
      .join(" + ");
    const id = `job-${Date.now()}`;
    const job: DreamingJob = {
      id,
      name: `${store.name} · ${inputSummary}`,
      storeId: store.id,
      inputRefs: value.inputRefs,
      inputSummary,
      prompt: value.prompt || undefined,
      modelTier: value.modelTier,
      status: "pending_review",
      tokenUsage: 22420,
      duration: "2 分 46 秒",
      addedNodeCount: 4,
      removedNodeCount: 1,
      modifiedNodeCount: 5,
      createdBy: "当前用户",
      createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      diffFiles: dreamingJobs[0].diffFiles,
    };
    setJobs((current) => [job, ...current]);
    setCreateOpen(false);
    onCreateRequestHandled?.();
    toast.success("记忆沉淀已生成 vNext 草稿，等待审核。");
    const params = new URLSearchParams({
      name: job.name,
      storeId: job.storeId,
      inputRefs: job.inputRefs.join(","),
      inputSummary: job.inputSummary,
      prompt: job.prompt ?? "",
      modelTier: job.modelTier,
    });
    router.push(`/memory-management/dreaming/${id}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          记忆沉淀基于「库当前内容 / 原始会话 + 旧版本」重新合成 vNext 草稿，发布前不会改变当前记忆库。
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
        <ManagementTable className="min-w-[1120px] table-fixed">
          <ManagementTableHeader>
            <ManagementTableHead className="w-[240px]">任务名</ManagementTableHead>
            <ManagementTableHead className="w-[200px]">目标记忆库</ManagementTableHead>
            <ManagementTableHead className="w-[170px]">输入</ManagementTableHead>
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
                <ManagementCell className="text-slate-600">{describeInput(job.inputRefs)}</ManagementCell>
                <ManagementCell>
                  <DreamingJobStatusBadge status={job.status} />
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

      <CreateDreamingJobDialog
        open={dialogOpen}
        onOpenChange={handleCreateOpenChange}
        stores={stores}
        initialStoreId={initialStoreId}
        onSubmit={handleCreate}
      />
    </div>
  );
}
