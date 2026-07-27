"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface RetryInvocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sessionPolicy: "continue" | "new") => void;
  agentName?: string;
}

export function RetryInvocationDialog({
  open,
  onOpenChange,
  onConfirm,
  agentName,
}: RetryInvocationDialogProps) {
  const [policy, setPolicy] = useState<"continue" | "new">("continue");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>重试执行</DialogTitle>
        </DialogHeader>
        <p className="text-[13px] text-[#5a6779]">
          重新触发 {agentName ?? "Agent"}。请选择会话策略：
        </p>
        <RadioGroup
          value={policy}
          onValueChange={(value) => setPolicy(value as "continue" | "new")}
          className="gap-3"
        >
          <div className="flex items-start gap-2 rounded-md border border-[#e2e8f0] px-3 py-2.5">
            <RadioGroupItem value="continue" id="retry-continue" className="mt-0.5" />
            <Label htmlFor="retry-continue" className="cursor-pointer">
              <div className="text-[13px] font-medium text-slate-800">
                继续当前会话
              </div>
              <div className="mt-0.5 text-[12px] text-[#5a6779]">
                沿用已有 Project-Agent Session 上下文
              </div>
            </Label>
          </div>
          <div className="flex items-start gap-2 rounded-md border border-[#e2e8f0] px-3 py-2.5">
            <RadioGroupItem value="new" id="retry-new" className="mt-0.5" />
            <Label htmlFor="retry-new" className="cursor-pointer">
              <div className="text-[13px] font-medium text-slate-800">
                新建会话
              </div>
              <div className="mt-0.5 text-[12px] text-[#5a6779]">
                创建新的独立 Session 后重试
              </div>
            </Label>
          </div>
        </RadioGroup>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            className="bg-[#2773ff] hover:bg-[#1f63e0]"
            onClick={() => {
              onConfirm(policy);
              onOpenChange(false);
            }}
          >
            确认重试
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
