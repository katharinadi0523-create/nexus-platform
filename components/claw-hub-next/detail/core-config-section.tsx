"use client";

import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { ModelSelector, type ModelParams } from "@/components/agent-editor/ModelSelector";
import { SectionCard } from "@/components/claw-hub-next/detail/section-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClawCoreFileKey, ClawDetailData } from "@/lib/mock/claw-hub-next";
import type { ModelParamKey } from "@/lib/model-schemas";
import { cn } from "@/lib/utils";

type FallbackModelRow = {
  id: string;
  model: string;
  params: ModelParams;
};

export type ClawCoreConfigSectionProps = {
  coreFiles: ClawDetailData["coreFiles"];
  selectedCoreFileKey: ClawCoreFileKey | null;
  coreFileDrafts: Record<ClawCoreFileKey, string>;
  primaryModel: string;
  primaryModelParams: ModelParams;
  fallbackModels: FallbackModelRow[];
  hiddenModelParamKeys: readonly ModelParamKey[];
  onSelectedCoreFileKeyChange: (key: ClawCoreFileKey | null) => void;
  onCoreFileDraftChange: (key: ClawCoreFileKey, value: string) => void;
  onSaveCoreFile: () => void;
  onPrimaryModelChange: (model: string) => void;
  onPrimaryModelParamsChange: (params: ModelParams) => void;
  onAddFallbackModel: () => void;
  onRemoveFallbackModel: (rowId: string) => void;
  onFallbackModelChange: (rowId: string, model: string) => void;
  onFallbackModelParamsChange: (rowId: string, params: ModelParams) => void;
  isFallbackModelDuplicate: (rowIndex: number) => boolean;
};

export function ClawCoreConfigSection({
  coreFiles,
  selectedCoreFileKey,
  coreFileDrafts,
  primaryModel,
  primaryModelParams,
  fallbackModels,
  hiddenModelParamKeys,
  onSelectedCoreFileKeyChange,
  onCoreFileDraftChange,
  onSaveCoreFile,
  onPrimaryModelChange,
  onPrimaryModelParamsChange,
  onAddFallbackModel,
  onRemoveFallbackModel,
  onFallbackModelChange,
  onFallbackModelParamsChange,
  isFallbackModelDuplicate,
}: ClawCoreConfigSectionProps) {
  const selectedCoreFile = coreFiles.find((file) => file.key === selectedCoreFileKey) ?? null;

  return (
    <div className="space-y-6">
      <SectionCard title="模型配置" description="配置 Claw 的主力模型和 Fallback 顺序。">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="grid gap-0 md:grid-cols-2 md:divide-x md:divide-slate-200">
            <div className="space-y-3 p-5">
              <Label className="text-sm font-medium text-slate-800">
                <span className="text-rose-500" aria-hidden>
                  *
                </span>
                主力模型
              </Label>
              <ModelSelector
                selectedModel={primaryModel}
                modelParams={primaryModelParams}
                onModelChange={onPrimaryModelChange}
                onParamsChange={onPrimaryModelParamsChange}
                presetOnly
                hiddenParamKeys={hiddenModelParamKeys}
                triggerClassName="w-full min-w-0 justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 hover:bg-slate-50"
              />
            </div>
            <div className="space-y-3 border-t border-slate-200 p-5 md:border-t-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Label className="text-sm font-medium text-slate-800">Fallback 模型</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-md border-slate-200 bg-white shadow-none"
                  onClick={onAddFallbackModel}
                >
                  <Plus className="h-4 w-4" />
                  添加
                </Button>
              </div>

              {fallbackModels.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-800">
                  暂无 Fallback，请点击「添加」加入降级模型。
                </div>
              ) : (
                <ul className="space-y-3">
                  {fallbackModels.map((row, index) => {
                    const duplicate = isFallbackModelDuplicate(index);
                    return (
                      <li
                        key={row.id}
                        className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/30 p-3 sm:flex-row sm:items-start sm:gap-2"
                      >
                        <span className="shrink-0 text-xs font-medium text-slate-500 sm:w-6 sm:pt-1">
                          {index + 1}.
                        </span>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <ModelSelector
                            selectedModel={row.model}
                            modelParams={row.params}
                            onModelChange={(model) => onFallbackModelChange(row.id, model)}
                            onParamsChange={(params) => onFallbackModelParamsChange(row.id, params)}
                            presetOnly
                            hiddenParamKeys={hiddenModelParamKeys}
                            triggerClassName={cn(
                              "w-full min-w-0 justify-between rounded-lg bg-white px-3 py-2.5",
                              duplicate
                                ? "border-2 border-red-500 hover:bg-red-50/40"
                                : "border border-slate-200 hover:bg-slate-50"
                            )}
                          />
                          {duplicate ? (
                            <p className="text-xs leading-5 text-red-600" role="status">
                              与已选模型重复，建议选择不同模型作为fallback模型
                            </p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 self-start text-slate-500 hover:text-red-600"
                          onClick={() => onRemoveFallbackModel(row.id)}
                          aria-label={`移除第 ${index + 1} 条 Fallback 模型`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="核心文件">
        {selectedCoreFile ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => onSelectedCoreFileKeyChange(null)}>
                  <ArrowLeft className="h-4 w-4" />
                  返回
                </Button>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-slate-950">{selectedCoreFile.title}</div>
                  <div className="text-sm text-slate-500">{selectedCoreFile.note}</div>
                </div>
              </div>
              <Button type="button" size="sm" onClick={onSaveCoreFile}>
                保存
              </Button>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
              <div className="mb-2 flex items-center justify-between px-1 text-xs text-slate-500">
                <span>Markdown 编辑器</span>
                <span>{coreFileDrafts[selectedCoreFile.key].split("\n").length} 行</span>
              </div>
              <Textarea
                value={coreFileDrafts[selectedCoreFile.key]}
                onChange={(event) => onCoreFileDraftChange(selectedCoreFile.key, event.target.value)}
                className="min-h-[520px] resize-none rounded-md border-slate-200 bg-white px-4 py-3 font-mono text-[13px] leading-7 text-slate-700 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
            {coreFiles.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
                <div className="min-w-0 flex flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                  <span className="shrink-0 font-medium text-slate-950">{item.title}</span>
                  <span className="text-sm text-slate-500">{item.note}</span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => onSelectedCoreFileKeyChange(item.key)}>
                  编辑
                </Button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
