import { Suspense } from "react";
import { MemoryManagementWorkbench } from "@/components/memory-management/memory-management-workbench";

export default function MemoryManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500">
          正在加载记忆管理...
        </div>
      }
    >
      <MemoryManagementWorkbench />
    </Suspense>
  );
}
