"use client";

import { useState } from "react";
import { Ban, MoreHorizontal, Power } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AgentAvailabilityControlProps {
  entityLabel: string;
  disabled: boolean;
  hasListedVersion: boolean;
  locked?: boolean;
  lockedReason?: string;
  onDisabledChange: (disabled: boolean) => void;
}

export function AgentAvailabilityControl({
  entityLabel,
  disabled,
  hasListedVersion,
  locked = false,
  lockedReason,
  onDisabledChange,
}: AgentAvailabilityControlProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [stopBlockedOpen, setStopBlockedOpen] = useState(false);

  const requestAvailabilityChange = () => {
    if (!disabled && hasListedVersion) {
      setStopBlockedOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  const confirmChange = () => {
    onDisabledChange(!disabled);
    setConfirmOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`${entityLabel}更多操作`}
            disabled={locked}
            title={locked ? lockedReason : undefined}
            className="h-9 w-9 rounded-md border-slate-300 bg-white text-slate-600 shadow-none hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-md p-1">
          <DropdownMenuItem
            onSelect={requestAvailabilityChange}
            disabled={locked}
            className="cursor-pointer rounded"
          >
            {disabled ? <Power className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            {disabled ? `重新启用${entityLabel}` : `停用${entityLabel}`}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-[480px] rounded-lg">
          <DialogHeader>
            <DialogTitle>{disabled ? `重新启用${entityLabel}？` : `停用${entityLabel}？`}</DialogTitle>
            <DialogDescription className="pt-2 leading-6 text-slate-600">
              {disabled
                ? "重新启用后，本次整体停用的版本将恢复被引用和调用；此前单独停用的版本保持不变。"
                : `停用后，${entityLabel}下当前可用版本将停止被引用和调用，历史记录继续保留。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="rounded-md">取消</Button>
            <Button onClick={confirmChange} className="rounded-md bg-blue-600 text-white hover:bg-blue-700">
              {disabled ? "确认启用" : "确认停用"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={stopBlockedOpen} onOpenChange={setStopBlockedOpen}>
        <DialogContent className="max-w-[460px] rounded-lg">
          <DialogHeader>
            <DialogTitle>暂不能停用{entityLabel}</DialogTitle>
            <DialogDescription className="pt-2 leading-6 text-slate-600">
              该资源仍有版本处于上架状态。请先完成下架，再停用{entityLabel}。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setStopBlockedOpen(false)} className="rounded-md bg-blue-600 text-white hover:bg-blue-700">我知道了</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
