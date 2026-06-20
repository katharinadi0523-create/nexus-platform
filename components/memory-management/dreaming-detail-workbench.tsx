"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, GitCompareArrows, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type {
  MemoryDiffLine,
  UpdateJob,
  UpdateJobStatus,
} from "@/lib/mock/memory-management";
import { getMemoryStore } from "@/lib/mock/memory-management";
import {
  UpdateJobStatusBadge,
  formatCompactNumber,
} from "@/components/memory-management/memory-shared";
import { cn } from "@/lib/utils";

function DiffLine({ line }: { line: MemoryDiffLine }) {
  const marker = line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
  return (
    <div
      className={cn(
        "grid grid-cols-[28px_minmax(0,1fr)] font-mono text-xs leading-6",
        line.type === "added" && "bg-emerald-50 text-emerald-800",
        line.type === "removed" && "bg-rose-50 text-rose-800",
        line.type === "same" && "text-slate-600"
      )}
    >
      <span className="select-none border-r border-slate-200 px-2 text-slate-400">{marker}</span>
      <span className="whitespace-pre-wrap break-words px-3">{line.content || " "}</span>
    </div>
  );
}

export function UpdateJobDetailWorkbench({ job }: { job: UpdateJob }) {
  const router = useRouter();
  const [status, setStatus] = useState<UpdateJobStatus>(job.status);
  const store = getMemoryStore(job.storeId);
  const reviewable = status === "pending_review";

  function applyVersion() {
    setStatus("published");
    toast.success(`已发布新版本：${store?.name ?? job.storeId}`);
  }

  function dismissVersion() {
    setStatus("dismissed");
    toast.success("已驳回本次记忆沉淀结果。");
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-60px)] bg-white">
      <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/memory-management?tab=dreaming")}
            className="h-9 w-9 rounded-[4px] border-slate-300 shadow-none"
            aria-label="返回记忆沉淀"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-xl font-semibold text-slate-950">{job.name}</h1>
              <UpdateJobStatusBadge status={status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              目标 Store：{store?.name ?? job.storeId} · {job.inputMaterialCount} 份输入材料
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={!reviewable}
            onClick={dismissVersion}
            className="h-8 rounded-[4px] border-slate-300 px-4 text-sm shadow-none"
          >
            <XCircle className="h-4 w-4" />
            驳回
          </Button>
          <Button
            disabled={!reviewable}
            onClick={applyVersion}
            className="h-8 rounded-[4px] bg-blue-600 px-4 text-sm shadow-none hover:bg-blue-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            发布新版本
          </Button>
        </div>
      </header>

      <main className="space-y-6 p-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: "耗时", value: job.duration },
            { label: "Token", value: formatCompactNumber(job.tokenUsage) },
            { label: "新增 Node", value: `${job.addedNodeCount} 个`, tone: "text-emerald-700" },
            { label: "删除 Node", value: `${job.removedNodeCount} 个`, tone: "text-rose-700" },
            { label: "修改 Node", value: `${job.modifiedNodeCount} 个`, tone: "text-blue-700" },
            { label: "模型档位", value: job.modelTier === "advanced" ? "增强档" : "标准档" },
          ].map((item) => (
            <div key={item.label} className="rounded-[6px] border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">{item.label}</div>
              <div className={cn("mt-1 text-base font-semibold text-slate-900", item.tone)}>
                {item.value}
              </div>
            </div>
          ))}
        </section>

        {job.prompt ? (
          <section className="rounded-[6px] border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs font-medium text-slate-500">usage_prompt / policy</div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{job.prompt}</p>
          </section>
        ) : null}

        <section>
          <div className="mb-4 flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-950">版本 Diff</h2>
            <span className="text-sm text-slate-500">
              v{store?.currentVersion ?? 1} → v{(store?.currentVersion ?? 1) + 1}
            </span>
          </div>

          {job.diffFiles.length > 0 ? (
            <div className="space-y-5">
              {job.diffFiles.map((file) => (
                <article key={file.path} className="overflow-hidden rounded-[6px] border border-slate-200">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm font-medium text-slate-800">
                    {file.path}
                  </div>
                  <div className="grid min-w-[840px] grid-cols-2 divide-x divide-slate-200">
                    <div>
                      <div className="border-b border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-500">
                        当前版本
                      </div>
                      <div className="py-2">
                        {file.before.map((line, index) => (
                          <DiffLine key={`before-${index}-${line.content}`} line={line} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="border-b border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-500">
                        vNext Draft
                      </div>
                      <div className="py-2">
                        {file.after.map((line, index) => (
                          <DiffLine key={`after-${index}-${line.content}`} line={line} />
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[6px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <p className="text-sm font-medium text-slate-700">当前任务还没有可审核的 Diff</p>
              <p className="mt-2 text-sm text-slate-500">任务完成后将在这里展示文件级变化。</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
