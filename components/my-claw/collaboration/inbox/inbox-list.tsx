"use client";

import type { ComponentType } from "react";
import {
  AtSign,
  Bot,
  CheckCircle2,
  Inbox,
  MessageSquare,
  UserPlus,
  UsersRound,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxEventType, InboxItem } from "@/lib/mock/my-claw/collaboration";
import { useCollaboration } from "../collaboration-provider";
import { formatRelativeTime } from "../shared/format";

const TYPE_META: Record<
  InboxEventType,
  { icon: ComponentType<{ className?: string }>; label: string }
> = {
  issue_assigned: { icon: UserPlus, label: "分配" },
  mentioned: { icon: AtSign, label: "@提及" },
  review_requested: { icon: CheckCircle2, label: "验收" },
  run_completed: { icon: Bot, label: "Agent" },
  run_failed: { icon: XCircle, label: "失败" },
  squad_invitation: { icon: UsersRound, label: "小队" },
  personal_claw_consent: { icon: UsersRound, label: "入队确认" },
  project_update: { icon: Inbox, label: "动态" },
  session_delivery: { icon: MessageSquare, label: "会话" },
};

export function InboxList({
  items,
  selectedId,
  onSelect,
}: {
  items: InboxItem[];
  selectedId: string | null;
  onSelect: (item: InboxItem) => void;
}) {
  const { getIssue } = useCollaboration();

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0fb] text-[#2773ff]">
          <Inbox className="h-4 w-4" />
        </div>
        <p className="text-[13px] font-medium text-slate-900">暂无通知</p>
        <p className="mt-1 text-[12px] text-[#5a6779]">当前筛选无结果</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#eef2f6]">
      {items.map((item) => {
        const meta = TYPE_META[item.type];
        const Icon = meta.icon;
        const selected = item.id === selectedId;
        const issueKey =
          item.source.kind === "project" && item.source.issueId
            ? getIssue(item.source.issueId)?.key
            : null;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "flex w-full items-start gap-2.5 px-3 py-3 text-left transition-colors",
              selected
                ? "bg-[#e8f0fb]"
                : item.unread
                  ? "bg-[#f7faff] hover:bg-[#f0f6ff]"
                  : "hover:bg-[#f8f9fb]"
            )}
          >
            <div className="relative mt-0.5 shrink-0">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border bg-white text-[#5a6779]",
                  selected || item.unread
                    ? "border-[#c9dbf8] text-[#2773ff]"
                    : "border-[#e2e8f0]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              {item.unread ? (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p
                  className={cn(
                    "truncate text-[13px] text-slate-900",
                    item.unread || selected ? "font-semibold" : "font-medium"
                  )}
                >
                  {item.title}
                </p>
                <span className="shrink-0 text-[11px] text-[#94a3b8]">
                  {formatRelativeTime(item.createdAt).replace(" ago", "")}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-[12px] text-[#5a6779]">
                {item.summary}
              </p>
              {issueKey ? (
                <p className="mt-1 truncate text-[11px] text-[#8a97a8]">
                  {issueKey}
                </p>
              ) : item.source.kind === "session" ? (
                <p className="mt-1 truncate text-[11px] text-[#8a97a8]">
                  会话交付
                </p>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
