"use client";

import { AlertTriangle, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getOpenApiToolParamFieldLabel,
  type OpenApiToolParamDiffItem,
  type OpenApiToolParamImpactItem,
  type OpenApiToolParamSavePreview,
} from "@/lib/openapi-management/tool-input-param-diff";
import { cn } from "@/lib/utils";

interface OpenApiToolParamSaveDialogProps {
  open: boolean;
  toolName: string;
  preview: OpenApiToolParamSavePreview | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

function DiffKindBadge({ kind }: { kind: OpenApiToolParamDiffItem["kind"] }) {
  const config = {
    added: { label: "新增", className: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
    removed: { label: "删除", className: "bg-rose-50 text-rose-700 ring-rose-100" },
    modified: { label: "修改", className: "bg-amber-50 text-amber-700 ring-amber-100" },
  }[kind];

  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", config.className)}>
      {config.label}
    </span>
  );
}

function SchemaDiffSection({ diffs }: { diffs: OpenApiToolParamDiffItem[] }) {
  if (diffs.length === 0) {
    return (
      <div className="rounded-[6px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        未检测到 Schema 变更。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[6px] border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
        Schema Diff（{diffs.length} 项变更）
      </div>

      <div className="divide-y divide-slate-100">
        {diffs.map((diff, index) => (
          <div key={`${diff.kind}-${diff.paramName}-${index}`} className="space-y-3 px-4 py-4">
            <div className="flex items-center gap-2">
              <DiffKindBadge kind={diff.kind} />
              <span className="text-sm font-semibold text-slate-900">{diff.paramName}</span>
            </div>

            {diff.kind === "added" ? (
              <p className="text-sm text-slate-600">新增输入参数，将写入工具 Schema。</p>
            ) : null}

            {diff.kind === "removed" ? (
              <p className="text-sm text-slate-600">该参数将从工具 Schema 中移除。</p>
            ) : null}

            {diff.fieldChanges?.length ? (
              <div className="overflow-hidden rounded-[4px] border border-slate-200">
                <div className="grid grid-cols-[120px_minmax(0,1fr)_24px_minmax(0,1fr)] gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                  <span>字段</span>
                  <span>变更前</span>
                  <span />
                  <span>变更后</span>
                </div>
                {diff.fieldChanges.map((change) => (
                  <div
                    key={`${diff.paramName}-${change.field}`}
                    className="grid grid-cols-[120px_minmax(0,1fr)_24px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-3 py-2.5 text-sm last:border-b-0"
                  >
                    <span className="font-medium text-slate-700">{getOpenApiToolParamFieldLabel(change.field)}</span>
                    <span className="break-all text-slate-500 line-through decoration-slate-300">{change.before || "—"}</span>
                    <span className="flex items-center justify-center text-slate-300">→</span>
                    <span className="break-all font-medium text-slate-900">{change.after || "—"}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ImpactScopeSection({
  impactItems,
  pluginName,
}: {
  impactItems: OpenApiToolParamImpactItem[];
  pluginName: string;
}) {
  const agentCount = impactItems.filter((item) => item.type === "智能体").length;
  const clawCount = impactItems.filter((item) => item.type === "Claw").length;

  return (
    <div className="overflow-hidden rounded-[6px] border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <div className="text-sm font-medium text-slate-700">受影响范围</div>
          <div className="mt-0.5 text-xs text-slate-500">已挂载插件「{pluginName}」的智能体与 Claw</div>
        </div>
        {impactItems.length > 0 ? (
          <div className="text-xs text-slate-500">
            {agentCount > 0 ? `${agentCount} 个智能体` : null}
            {agentCount > 0 && clawCount > 0 ? " · " : null}
            {clawCount > 0 ? `${clawCount} 个 Claw` : null}
          </div>
        ) : null}
      </div>

      {impactItems.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-500">
          当前暂无智能体或 Claw 挂载该插件，Schema 变更不会波及线上调用方。
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {impactItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3">
              <span
                className={cn(
                  "mt-0.5 inline-flex shrink-0 rounded-[4px] px-2 py-0.5 text-xs font-medium",
                  item.type === "智能体" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"
                )}
              >
                {item.type}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-900">{item.name}</div>
                <div className="mt-1 text-sm text-slate-500">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OpenApiToolParamSaveDialog({
  open,
  toolName,
  preview,
  onOpenChange,
  onConfirm,
}: OpenApiToolParamSaveDialogProps) {
  const diffs = preview?.diffs ?? [];
  const impactItems = preview?.impactItems ?? [];
  const pluginName = preview?.pluginName ?? "";
  const addedCount = diffs.filter((item) => item.kind === "added").length;
  const removedCount = diffs.filter((item) => item.kind === "removed").length;
  const modifiedCount = diffs.filter((item) => item.kind === "modified").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[720px]">
        <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
          <DialogTitle className="text-lg font-semibold text-slate-950">确认保存输入参数</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {toolName} 的 Schema 将发生变更，请确认 Diff 与受影响范围后再保存。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap items-center gap-2 rounded-[6px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              保存后将更新工具 Schema。
              {impactItems.length > 0
                ? ` 已有 ${impactItems.length} 个智能体 / Claw 挂载该插件，请确认影响范围。`
                : " 当前暂无智能体或 Claw 挂载该插件。"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {addedCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <Plus className="h-3 w-3" />
                新增 {addedCount}
              </span>
            ) : null}
            {modifiedCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                修改 {modifiedCount}
              </span>
            ) : null}
            {removedCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                <Minus className="h-3 w-3" />
                删除 {removedCount}
              </span>
            ) : null}
          </div>

          <SchemaDiffSection diffs={diffs} />
          <ImpactScopeSection impactItems={impactItems} pluginName={pluginName} />
        </div>

        <DialogFooter className="border-t border-slate-100 bg-white px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-[4px] border-slate-300 bg-white px-5 text-slate-700 shadow-none"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            className="h-9 rounded-[4px] bg-blue-600 px-5 text-white shadow-none hover:bg-blue-700"
            onClick={onConfirm}
          >
            确认保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
