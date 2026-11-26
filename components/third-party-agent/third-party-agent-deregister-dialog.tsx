"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ThirdPartyAgentDeregisterDialog({
  open,
  onOpenChange,
  agentName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>确认注销第三方 Agent？</DialogTitle>
          <DialogDescription className="pt-1 leading-6">
            确认注销“{agentName}”在 AF 中的资产登记？注销后，本平台中对该 Agent 的引用将无法继续调用；不影响外部 Agent 的程序和运行环境。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={onConfirm} className="bg-rose-600 text-white hover:bg-rose-700">确认注销</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
