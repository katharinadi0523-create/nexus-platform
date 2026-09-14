import { AlertCircle, CheckCircle2 } from "lucide-react";
import { buildImportPreview, getPendingResources, type ImportObjectType } from "@/lib/agent-import-export";
import { cn } from "@/lib/utils";

export type ImportDraftResult = "success" | "success_with_warnings";

export function ImportDraftNotice({
  objectType,
  result,
  className,
}: {
  objectType: ImportObjectType;
  result: ImportDraftResult;
  className?: string;
}) {
  const hasWarnings = result === "success_with_warnings";
  const preview = buildImportPreview(objectType, "imported.yaml", hasWarnings);
  const pendingResources = getPendingResources(preview);

  if (!hasWarnings) {
    return (
      <section className={cn("border-b border-emerald-200 bg-emerald-50 px-6 py-3", className)}>
        <div className="mx-auto flex max-w-[1440px] items-start gap-3 text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <div className="text-sm font-semibold">导入完成，已创建未发布草稿</div>
            <div className="mt-0.5 text-xs leading-5 text-emerald-800/80">配置及直接引用资源均已恢复，可继续编辑或发布。</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("border-b border-amber-200 bg-amber-50 px-6 py-3", className)}>
      <div className="mx-auto max-w-[1440px]">
        <div className="flex items-start gap-3 text-amber-950">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">导入完成，已创建未发布草稿；有 {pendingResources.length} 项资源待补配</div>
            <div className="mt-0.5 text-xs leading-5 text-amber-800/80">不影响继续编辑。请在发布前完成下列资源的关联或鉴权。</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {pendingResources.map((resource) => (
                <span key={resource.id} className="inline-flex items-center gap-1.5 rounded-[4px] border border-amber-200 bg-white/75 px-2.5 py-1 text-xs text-slate-700">
                  <span className="text-slate-500">{resource.type}</span>
                  <span className="font-medium text-slate-900">{resource.name}</span>
                  <span className="text-amber-700">· {resource.status === "missing" ? "待关联" : "待鉴权"}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
