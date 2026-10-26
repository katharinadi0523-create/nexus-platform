import { AlertCircle, CheckCircle2 } from "lucide-react";
import { type ImportObjectType } from "@/lib/agent-import-export";
import { cn } from "@/lib/utils";

export type ImportDraftResult = "success" | "success_with_warnings";

export function ImportDraftNotice({
  result,
  className,
}: {
  objectType: ImportObjectType;
  result: ImportDraftResult;
  operation?: "create" | "overwrite";
  className?: string;
}) {
  const hasWarnings = result === "success_with_warnings";
  if (!hasWarnings) {
    return (
      <section className={cn("border-b border-emerald-200 bg-emerald-50 px-6 py-2.5", className)}>
        <div className="mx-auto flex max-w-[1440px] items-center gap-2.5 text-sm leading-5 text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span><strong className="font-semibold">导入成功。</strong> 已进入主对象编辑页。</span>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("border-b border-amber-200 bg-amber-50 px-6 py-2.5", className)}>
      <div className="mx-auto flex max-w-[1440px] items-center gap-2.5 text-sm leading-5 text-amber-950">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
        <span>
          <strong className="font-semibold">导入成功，存在待补配资源。</strong> 请按节点或配置处提示完成补配。
        </span>
      </div>
    </section>
  );
}
