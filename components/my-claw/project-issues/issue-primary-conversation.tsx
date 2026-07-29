"use client";

import {
  ChevronRight,
  Link2,
  MessageSquareText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";

interface IssuePrimaryConversationProps {
  issueId: string;
  onOpenConversation?: (conversationId: string, messageId?: string) => void;
  onBind?: (conversationId: string) => void;
  bindableConversationIds?: string[];
}

export function IssuePrimaryConversation({
  issueId,
  onOpenConversation,
  onBind,
  bindableConversationIds = [],
}: IssuePrimaryConversationProps) {
  const {
    getIssue,
    getConversation,
    canAccessConversation,
    currentUserId,
  } = useProjectConversation();

  const issue = getIssue(issueId);
  if (!issue) return null;

  if (!issue.conversationId) {
    return (
      <section>
        <div className="mb-1.5 text-[11px] font-medium text-[#5a6779]">
          主会话
        </div>
        <div className="rounded-lg border border-dashed border-[#d9e0ea] bg-[#fbfcfe] px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f3f7] text-[#7a8798]">
              <Link2 className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-slate-700">
                尚未绑定会话
              </p>
              <p className="mt-0.5 text-[11px] text-[#7a8798]">
                绑定后可从事项返回来源讨论
              </p>
            </div>
          </div>
          {bindableConversationIds.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-[#edf1f5] pt-2.5">
              {bindableConversationIds.map((id) => {
                const conversation = getConversation(id);
                if (!conversation) return null;
                return (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 border-[#e2e8f0] text-[11px]"
                    onClick={() => onBind?.(id)}
                  >
                    绑定到 {conversation.name}
                  </Button>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  const canAccess = canAccessConversation(issue.conversationId, currentUserId);
  if (!canAccess) {
    return null;
  }

  const conversation = getConversation(issue.conversationId);
  return (
    <section>
      <div className="mb-1.5 text-[11px] font-medium text-[#5a6779]">
        主会话
      </div>
      <button
        type="button"
        className="group flex w-full items-center gap-2.5 rounded-lg border border-[#e6ebf2] bg-white px-3 py-2.5 text-left transition-colors hover:border-[#cddbf2] hover:bg-[#f8fbff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2773ff]/25"
        onClick={() =>
          onOpenConversation?.(
            issue.conversationId!,
            issue.sourceMessageId
          )
        }
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#edf4ff] text-[#2773ff]">
          <MessageSquareText className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-medium text-slate-800">
            {conversation?.name ?? "会话"}
          </span>
          <span className="mt-0.5 block text-[11px] text-[#7a8798]">
            定位到事项来源消息
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-[#2773ff]">
          打开
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </button>
    </section>
  );
}
