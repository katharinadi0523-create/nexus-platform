"use client";

import { useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { MarkdownPreview } from "@/components/claw-hub-next/detail/markdown-preview";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type AgentMdViewMode = "edit" | "preview";

export type AgentMdEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
};

export function AgentMdEditor({
  value,
  onChange,
  placeholder,
  minHeightClassName = "min-h-[520px]",
}: AgentMdEditorProps) {
  const [viewMode, setViewMode] = useState<AgentMdViewMode>("edit");
  const lineCount = value ? value.split("\n").length : 0;

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 rounded-[4px] px-2.5 text-xs shadow-none",
              viewMode === "edit" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-800"
            )}
            onClick={() => setViewMode("edit")}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            编辑
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 rounded-[4px] px-2.5 text-xs shadow-none",
              viewMode === "preview" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-800"
            )}
            onClick={() => setViewMode("preview")}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            预览
          </Button>
        </div>
        <span className="text-xs text-slate-500">{lineCount} 行</span>
      </div>

      {viewMode === "edit" ? (
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={cn(
            "resize-none rounded-md border-slate-200 bg-white px-4 py-3 font-mono text-[13px] leading-7 text-slate-700 shadow-none focus-visible:ring-0",
            minHeightClassName
          )}
        />
      ) : (
        <div
          className={cn(
            "overflow-auto rounded-md border border-slate-200 bg-white px-4 py-3",
            minHeightClassName
          )}
        >
          <MarkdownPreview content={value} placeholder={placeholder} />
        </div>
      )}
    </div>
  );
}
