"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildExportYaml, sanitizeExportFileName, type ImportObjectType } from "@/lib/agent-import-export";
import { cn } from "@/lib/utils";

export function ExportConfigurationButton({
  objectType,
  objectName,
  sourceType,
  sourceVersion,
  className,
}: {
  objectType: ImportObjectType;
  objectName: string;
  sourceType: "published" | "draft";
  sourceVersion?: string;
  className?: string;
}) {
  const [exporting, setExporting] = useState(false);

  function handleExport() {
    if (exporting) return;
    setExporting(true);
    window.setTimeout(() => {
      const yaml = buildExportYaml({ objectType, objectName, sourceType, sourceVersion });
      const blob = new Blob([yaml], { type: "application/yaml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = sanitizeExportFileName(objectName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExporting(false);
      const source = sourceType === "published" ? `最新发布版本 ${sourceVersion ?? ""}`.trim() : "当前草稿";
      toast.success(`已导出${source}，密钥及凭证信息已过滤。`);
    }, 650);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={exporting}
      onClick={handleExport}
      title={sourceType === "published" ? `导出最新发布版本 ${sourceVersion ?? ""}` : "导出当前草稿"}
      className={cn("h-9 rounded-md border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-none hover:border-slate-400 hover:bg-slate-50", className)}
    >
      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {exporting ? "正在生成" : "导出"}
    </Button>
  );
}
