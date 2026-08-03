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
  onDisabledChange: (disabled: boolean) => void;
}

export function AgentAvailabilityControl({
  entityLabel,
  disabled,
  onDisabledChange,
}: AgentAvailabilityControlProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

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
            className="h-9 w-9 rounded-md border-slate-300 bg-white text-slate-600 shadow-none hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-md p-1">
          <DropdownMenuItem
            onSelect={() => setConfirmOpen(true)}
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
                ? `重新启用后，${entityLabel}及其可用版本可以再次被其他资源引用和调用。`
                : `停用后，${entityLabel}将停止被其他资源引用和调用；已发布版本及历史记录仍会保留。`}
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
    </>
  );
}