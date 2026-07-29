"use client";

import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileRowActionsProps {
  fileName: string;
  onPreview?: () => void;
  onDownload?: () => void;
  onDetails?: () => void;
}

/** Shared ⋯ menu: 预览 / 下载 / 详情 */
export function FileRowActions({
  fileName,
  onPreview,
  onDownload,
  onDetails,
}: FileRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${fileName} 操作`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#94a3b8] hover:bg-[#f8f9fb] hover:text-slate-700"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => {
            onPreview?.();
            if (!onPreview) toast.message(`预览 ${fileName}（原型占位）`);
          }}
        >
          预览
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onDownload?.();
            if (!onDownload) toast.success(`已开始下载 ${fileName}`);
          }}
        >
          下载
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onDetails?.();
          }}
          disabled={!onDetails}
        >
          详情
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
