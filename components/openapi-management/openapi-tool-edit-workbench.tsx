"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, MinusCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  ManagementPrimaryButton,
  ManagementSecondaryButton,
  ManagementStatusDot,
  ManagementTextAction,
} from "@/components/management/management-list";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  createEmptyOpenApiToolInputParam,
  OPEN_API_TOOL_PARAM_DESC_MAX,
  OPEN_API_TOOL_PARAM_NAME_MAX,
  OPEN_API_TOOL_PARAM_TYPE_OPTIONS,
  type OpenApiPluginItem,
  type OpenApiToolInputParam,
  type OpenApiToolItem,
} from "@/lib/mock/openapi-plugins";
import { buildToolInputParamSavePreview, type OpenApiToolParamSavePreview } from "@/lib/openapi-management/tool-input-param-diff";
import { OpenApiToolParamSaveDialog } from "@/components/openapi-management/openapi-tool-param-save-dialog";
import { cn } from "@/lib/utils";

interface OpenApiToolEditWorkbenchProps {
  plugin: OpenApiPluginItem;
  tool: OpenApiToolItem;
}

function truncatePluginName(name: string, maxLength = 12) {
  if (name.length <= maxLength) {
    return name;
  }

  return `${name.slice(0, maxLength)}...`;
}

function ParamCounter({ current, max }: { current: number; max: number }) {
  return (
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
      {current}/{max}
    </span>
  );
}

function InputParamRow({
  param,
  editing,
  onChange,
  onRemove,
}: {
  param: OpenApiToolInputParam;
  editing: boolean;
  onChange: (next: OpenApiToolInputParam) => void;
  onRemove: () => void;
}) {
  const typeOptions = OPEN_API_TOOL_PARAM_TYPE_OPTIONS.map((type) => ({
    value: type,
    label: type,
  }));

  return (
    <div className="grid grid-cols-1 gap-3 border-b border-slate-100 py-4 last:border-b-0 lg:grid-cols-[220px_minmax(0,1fr)_180px_72px_40px] lg:items-center">
      <div className="relative">
        <Input
          value={param.name}
          readOnly={!editing}
          maxLength={OPEN_API_TOOL_PARAM_NAME_MAX}
          placeholder="参数名称"
          onChange={(event) => onChange({ ...param, name: event.target.value })}
          className={cn(
            "h-10 rounded-[4px] border-slate-300 bg-white pr-14 text-sm shadow-none",
            !editing && "cursor-default bg-slate-50 text-slate-700"
          )}
        />
        <ParamCounter current={param.name.length} max={OPEN_API_TOOL_PARAM_NAME_MAX} />
      </div>

      <div className="relative">
        <Input
          value={param.description}
          readOnly={!editing}
          maxLength={OPEN_API_TOOL_PARAM_DESC_MAX}
          placeholder="参数描述"
          onChange={(event) => onChange({ ...param, description: event.target.value })}
          className={cn(
            "h-10 rounded-[4px] border-slate-300 bg-white pr-16 text-sm shadow-none",
            !editing && "cursor-default bg-slate-50 text-slate-700"
          )}
        />
        <ParamCounter current={param.description.length} max={OPEN_API_TOOL_PARAM_DESC_MAX} />
      </div>

      <div>
        {editing ? (
          <Select
            value={param.type}
            onValueChange={(value) =>
              onChange({ ...param, type: value as OpenApiToolInputParam["type"] })
            }
            options={typeOptions}
            className="h-10 rounded-[4px] border-slate-300 bg-white text-sm shadow-none"
          />
        ) : (
          <div className="flex h-10 items-center rounded-[4px] border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
            {param.type}
          </div>
        )}
      </div>

      <div className="flex items-center justify-start lg:justify-center">
        <Checkbox
          checked={param.required}
          disabled={!editing}
          onCheckedChange={(checked) => onChange({ ...param, required: checked === true })}
          className="size-4 rounded-[4px] border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
        />
      </div>

      <div className="flex items-center justify-end lg:justify-center">
        {editing ? (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="删除参数"
          >
            <MinusCircle className="h-5 w-5" />
          </button>
        ) : (
          <span className="inline-block h-8 w-8" />
        )}
      </div>
    </div>
  );
}

export function OpenApiToolEditWorkbench({ plugin, tool }: OpenApiToolEditWorkbenchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTool, setCurrentTool] = useState(tool);
  const [savedParams, setSavedParams] = useState<OpenApiToolInputParam[]>(tool.inputParams);
  const [draftParams, setDraftParams] = useState<OpenApiToolInputParam[]>(tool.inputParams);
  const [editingInputParams, setEditingInputParams] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savePreview, setSavePreview] = useState<OpenApiToolParamSavePreview | null>(null);

  const debugPassed = currentTool.debugStatus === "调试成功";
  const autoEditInputParams = searchParams.get("editInputParams") === "1";

  useEffect(() => {
    if (autoEditInputParams) {
      setEditingInputParams(true);
    }
  }, [autoEditInputParams]);

  function navigateToPluginDetail() {
    router.push(`/openapi-management/${plugin.id}`);
  }

  function handleStartEditInputParams() {
    setDraftParams(savedParams.map((param) => ({ ...param })));
    setEditingInputParams(true);
  }

  function handleCancelEditInputParams() {
    setDraftParams(savedParams.map((param) => ({ ...param })));
    setEditingInputParams(false);
  }

  function handleSaveInputParams() {
    const hasEmptyName = draftParams.some((param) => !param.name.trim());
    if (hasEmptyName) {
      toast.error("请填写所有参数名称。");
      return;
    }

    const preview = buildToolInputParamSavePreview(savedParams, draftParams, plugin);
    if (!preview.hasChanges) {
      setEditingInputParams(false);
      toast.info("输入参数未发生变化。");
      return;
    }

    setSavePreview(preview);
    setSaveDialogOpen(true);
  }

  function handleConfirmSaveInputParams() {
    setSavedParams(draftParams.map((param) => ({ ...param })));
    setCurrentTool((current) => ({ ...current, inputParams: draftParams }));
    setEditingInputParams(false);
    setSaveDialogOpen(false);
    setSavePreview(null);
    toast.success("输入参数已保存。");
  }

  function handleAddParam() {
    setDraftParams((current) => [...current, createEmptyOpenApiToolInputParam()]);
  }

  function handleUpdateParam(index: number, next: OpenApiToolInputParam) {
    setDraftParams((current) => current.map((param, paramIndex) => (paramIndex === index ? next : param)));
  }

  function handleRemoveParam(index: number) {
    setDraftParams((current) => current.filter((_, paramIndex) => paramIndex !== index));
  }

  function handleToggleEnabled() {
    setCurrentTool((current) => {
      const nextEnabled = !current.enabled;
      toast.success(nextEnabled ? "工具已启用。" : "工具已停用。");
      return { ...current, enabled: nextEnabled };
    });
  }

  const visibleParams = editingInputParams ? draftParams : savedParams;

  return (
    <div className="-m-6 min-h-[calc(100vh-60px)] bg-white">
      <div className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={navigateToPluginDetail}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
            aria-label="返回插件详情"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 items-center gap-3 text-[20px] font-semibold">
            <span className="shrink-0 text-slate-500">插件管理</span>
            <span className="shrink-0 text-slate-400">/</span>
            <button
              type="button"
              onClick={navigateToPluginDetail}
              className="shrink-0 text-slate-500 transition-colors hover:text-blue-600"
            >
              {truncatePluginName(plugin.name)}
            </button>
            <span className="shrink-0 text-slate-400">/</span>
            <span className="truncate text-slate-950">{currentTool.name}</span>
          </div>

          <ManagementStatusDot
            label={currentTool.debugStatus}
            active={debugPassed}
            inactiveClassName="bg-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <ManagementSecondaryButton onClick={() => toast.info(`编辑：${currentTool.name}`)}>
            编辑
          </ManagementSecondaryButton>
          <ManagementSecondaryButton onClick={() => toast.info(`调试：${currentTool.name}`)}>
            调试
          </ManagementSecondaryButton>
          <ManagementSecondaryButton
            onClick={handleToggleEnabled}
            disabled={!currentTool.enabled && currentTool.debugStatus !== "调试成功"}
            className={cn(
              currentTool.enabled
                ? "border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                : "disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white"
            )}
          >
            {currentTool.enabled ? "停用" : "启用"}
          </ManagementSecondaryButton>
        </div>
      </div>

      <div className="px-6 py-8">
        <section className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-[18px] font-semibold text-slate-950">配置输入参数</h2>
            {!editingInputParams ? (
              <ManagementTextAction onClick={handleStartEditInputParams}>配置输入参数</ManagementTextAction>
            ) : null}
          </div>

          <div className="hidden border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-600 lg:grid lg:grid-cols-[220px_minmax(0,1fr)_180px_72px_40px] lg:items-center">
            <span>参数名称</span>
            <span>参数描述</span>
            <span>数据类型</span>
            <span className="text-center">必填</span>
            <span />
          </div>

          <div className="px-5">
            {visibleParams.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500">
                当前工具还没有输入参数，{editingInputParams ? "可点击下方添加参数。" : "点击右上角开始配置。"}
              </div>
            ) : (
              visibleParams.map((param, index) => (
                <InputParamRow
                  key={param.id}
                  param={param}
                  editing={editingInputParams}
                  onChange={(next) => handleUpdateParam(index, next)}
                  onRemove={() => handleRemoveParam(index)}
                />
              ))
            )}
          </div>

          {editingInputParams ? (
            <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleAddParam}
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                添加参数
              </button>

              <div className="flex items-center gap-2">
                <ManagementPrimaryButton onClick={handleSaveInputParams}>保存</ManagementPrimaryButton>
                <ManagementSecondaryButton onClick={handleCancelEditInputParams}>取消</ManagementSecondaryButton>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <OpenApiToolParamSaveDialog
        open={saveDialogOpen}
        toolName={currentTool.name}
        preview={savePreview}
        onOpenChange={setSaveDialogOpen}
        onConfirm={handleConfirmSaveInputParams}
      />
    </div>
  );
}
