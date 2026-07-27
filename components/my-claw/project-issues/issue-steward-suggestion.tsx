"use client";

import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IssueMutationProposal } from "@/lib/mock/my-claw/project-issues";

interface IssueStewardSuggestionProps {
  proposal: IssueMutationProposal;
  onApply: () => void;
  onDismiss: () => void;
}

const ACTION_LABEL: Record<IssueMutationProposal["action"], string> = {
  create: "建议创建事项",
  append: "建议追加关联",
  update: "建议更新事项",
  merge: "建议合并事项",
  complete: "建议标记完成",
  cancel: "建议取消事项",
  archive: "建议归档事项",
  none: "事项管家提示",
};

export function IssueStewardSuggestion({
  proposal,
  onApply,
  onDismiss,
}: IssueStewardSuggestionProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#d6e6fb] bg-[#f5f9ff] px-3.5 py-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f0fb] text-[#2773ff]">
        <Lightbulb className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-slate-900">
          {ACTION_LABEL[proposal.action]}
          {proposal.proposedTitle ? ` · ${proposal.proposedTitle}` : ""}
        </div>
        <p className="mt-0.5 text-[12px] leading-5 text-[#5a6779]">
          {proposal.reason}
          <span className="ml-1 text-[11px] text-slate-400">
            置信度 {Math.round(proposal.confidence * 100)}%
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[12px] text-[#5a6779]"
          onClick={onDismiss}
        >
          忽略
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-7 bg-[#2773ff] px-2.5 text-[12px] hover:bg-[#1f63e0]"
          onClick={onApply}
        >
          {proposal.requiresConfirmation ? "确认应用" : "应用"}
        </Button>
      </div>
    </div>
  );
}
