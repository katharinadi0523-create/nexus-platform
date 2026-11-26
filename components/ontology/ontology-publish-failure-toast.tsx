"use client";

import { TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";

/**
 * 发布失败（本体校验不通过）的 Toast：红色三角感叹号表示异常。
 * 存在跨 Workspace 的情况，无法确定该跳到哪里，所以只说明原因和处理办法，不带跳转链接。
 */
export function showOntologyPublishFailure({
  id,
  title,
  description,
}: {
  id?: string | number;
  title: string;
  description: string;
}) {
  // 先收掉“正在发布…”的 loading Toast，避免沿用它的加载图标
  if (id !== undefined) toast.dismiss(id);
  toast.custom(
    (toastId) => (
      <div className="flex w-[380px] max-w-[calc(100vw-32px)] items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-[0_6px_20px_rgba(15,23,42,0.12)]">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 fill-[#f04438] text-white" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-medium leading-5 text-slate-900">{title}</div>
          <p className="mt-1 text-[13px] leading-5 text-slate-600">{description}</p>
        </div>
        <button
          type="button"
          aria-label="关闭"
          onClick={() => toast.dismiss(toastId)}
          className="-mr-1 shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    ),
    { duration: 10000 },
  );
}
