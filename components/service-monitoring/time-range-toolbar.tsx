"use client";

import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TIME_RANGE_PRESETS,
  type TimeRangePreset,
  getDefaultDateRangeLabel,
} from "@/lib/mock/service-monitoring";

interface TimeRangeToolbarProps {
  preset: TimeRangePreset;
  onPresetChange: (preset: TimeRangePreset) => void;
  dateRangeLabel?: string;
  className?: string;
}

export function TimeRangeToolbar({
  preset,
  onPresetChange,
  dateRangeLabel = getDefaultDateRangeLabel(),
  className,
}: TimeRangeToolbarProps) {
  const handleRefresh = () => {
    toast.success("刷新成功");
  };

  const handleExport = () => {
    toast.success("导出任务已创建");
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center rounded-md border bg-white p-0.5">
        {TIME_RANGE_PRESETS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onPresetChange(item.key)}
            className={cn(
              "rounded px-3 py-1.5 text-sm transition-colors",
              preset === item.key
                ? "bg-[#2773ff] text-white"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-md border bg-white px-3 py-1.5 text-sm text-slate-600">
        {dateRangeLabel}
      </div>

      <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRefresh}>
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleExport}>
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
