"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import {
  OPEN_API_PLUGIN_PUBLISH_SCOPE_OPTIONS,
  OPEN_API_PLUGIN_TYPE_OPTIONS,
  type OpenApiPluginPublishScope,
  type OpenApiPluginType,
} from "@/lib/mock/openapi-plugins";

export interface OpenApiPluginPublishValue {
  publishScope: OpenApiPluginPublishScope;
  pluginType: OpenApiPluginType;
}

interface OpenApiPluginPublishDialogProps {
  open: boolean;
  pluginName?: string;
  value: OpenApiPluginPublishValue;
  onValueChange: (value: OpenApiPluginPublishValue) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

export function OpenApiPluginPublishDialog({
  open,
  pluginName,
  value,
  onValueChange,
  onOpenChange,
  onSubmit,
}: OpenApiPluginPublishDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[560px]">
        <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
          <DialogTitle className="text-lg font-semibold text-slate-950">OpenAPI插件发布</DialogTitle>
          {pluginName ? <div className="text-sm text-slate-500">{pluginName}</div> : null}
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="grid items-center gap-3 sm:grid-cols-[96px_minmax(0,1fr)]">
            <Label className="flex items-center gap-1 text-sm font-medium text-slate-700">
              <span className="text-rose-500">*</span>
              <span>发布范围:</span>
            </Label>
            <RadioGroup
              value={value.publishScope}
              onValueChange={(publishScope) =>
                onValueChange({
                  ...value,
                  publishScope: publishScope as OpenApiPluginPublishScope,
                })
              }
              className="flex flex-wrap items-center gap-5"
            >
              {OPEN_API_PLUGIN_PUBLISH_SCOPE_OPTIONS.map((scope) => (
                <label key={scope} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <RadioGroupItem value={scope} className="border-slate-300 text-blue-600" />
                  <span>{scope}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="grid items-center gap-3 sm:grid-cols-[96px_minmax(0,1fr)]">
            <Label className="flex items-center gap-1 text-sm font-medium text-slate-700">
              <span className="text-rose-500">*</span>
              <span>插件类型:</span>
            </Label>
            <Select
              value={value.pluginType}
              onValueChange={(pluginType) =>
                onValueChange({
                  ...value,
                  pluginType: pluginType as OpenApiPluginType,
                })
              }
              options={OPEN_API_PLUGIN_TYPE_OPTIONS}
              placeholder="请选择插件类型"
              className="h-9 rounded-[4px] border-slate-300 bg-white shadow-none focus:ring-0"
            />
          </div>
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
            onClick={onSubmit}
          >
            提交发布审核
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
