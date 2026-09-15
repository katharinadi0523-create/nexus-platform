import { AlertCircle, CheckCircle2 } from "lucide-react";
import { buildImportPreview, getPendingResources, type ImportObjectType } from "@/lib/agent-import-export";
import { cn } from "@/lib/utils";

export type ImportDraftResult = "success" | "success_with_warnings";

export function ImportDraftNotice({
  objectType,
  result,
  operation = "create",
  className,
}: {
  objectType: ImportObjectType;
  result: ImportDraftResult;
  operation?: "create" | "overwrite";
  className?: string;
}) {
  const hasWarnings = result === "success_with_warnings";
  const preview = buildImportPreview(objectType, "imported.yaml", hasWarnings);
  const pendingResources = getPendingResources(preview);
  const pendingSummary = pendingResources
    .map((resource) => `${resource.type}「${resource.name}」${resource.status === "missing" ? "待关联" : "待鉴权"}`)
    .join("、");
  const successSummary = operation === "create" ? "已创建新对象草稿并进入编辑页。" : "已覆盖当前草稿，已发布版本不受影响。";

  if (!hasWarnings) {
    return (
      <section className={cn("border-b border-emerald-200 bg-emerald-50 px-6 py-2.5", className)}>
        <div className="mx-auto flex max-w-[1440px] items-center gap-2.5 text-sm leading-5 text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span><strong className="font-semibold">导入成功。</strong> {successSummary}配置及关联资源均已恢复，可继续编辑或发布。</span>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("border-b border-amber-200 bg-amber-50 px-6 py-2.5", className)}>
      <div className="mx-auto flex max-w-[1440px] items-center gap-2.5 text-sm leading-5 text-amber-950">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
        <span>
          <strong className="font-semibold">导入成功，存在待补配资源。</strong>{" "}
          {successSummary}{pendingResources.length} 项资源需在发布前补配：{pendingSummary}。原节点、位置和连线已保留。
        </span>
      </div>
    </section>
  );
}
