"use client";

import { useMemo, useState } from "react";
import { CheckCheck, Inbox, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InboxEventType, InboxItem } from "@/lib/mock/my-claw/collaboration";
import { useCollaboration } from "../collaboration-provider";
import { InboxDetail } from "./inbox-detail";
import { InboxList } from "./inbox-list";

type InboxFilter =
  | "all"
  | "assigned"
  | "mentioned"
  | "review"
  | "agent"
  | "squad"
  | "session";

const FILTER_TYPES: Record<Exclude<InboxFilter, "all">, InboxEventType[]> = {
  assigned: ["issue_assigned"],
  mentioned: ["mentioned"],
  review: ["review_requested"],
  agent: ["run_completed", "run_failed"],
  squad: ["squad_invitation", "personal_claw_consent"],
  session: ["session_delivery"],
};

const FILTERS: { key: InboxFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "review", label: "待验收" },
  { key: "session", label: "会话" },
  { key: "assigned", label: "分配" },
  { key: "mentioned", label: "@我" },
  { key: "agent", label: "Agent" },
  { key: "squad", label: "小队" },
];

export function InboxWorkbench() {
  const {
    state,
    currentUserId,
    unreadInboxCount,
    markInboxRead,
    markAllInboxRead,
  } = useCollaboration();
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items = useMemo(() => {
    const mine = state.inboxItems
      .filter((item) => item.userId === currentUserId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    if (filter === "all") return mine;
    const types = FILTER_TYPES[filter];
    return mine.filter((item) => types.includes(item.type));
  }, [currentUserId, filter, state.inboxItems]);

  const selectedItem = useMemo(() => {
    if (items.length === 0) return null;
    return items.find((item) => item.id === selectedId) ?? items[0];
  }, [items, selectedId]);

  const handleSelect = (item: InboxItem) => {
    setSelectedId(item.id);
    if (item.unread) {
      markInboxRead(item.id);
    }
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-[#f8f9fb]">
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-[#e2e8f0] bg-white">
        <div className="shrink-0 border-b border-[#eef2f6] px-3 py-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-semibold text-slate-900">Inbox</h1>
              {unreadInboxCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2773ff] px-1.5 text-[11px] font-semibold text-white">
                  {unreadInboxCount}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[#5a6779]"
                onClick={() => {
                  markAllInboxRead();
                  toast.success("已全部标为已读");
                }}
                disabled={unreadInboxCount === 0}
                title="全部标为已读"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[#5a6779]"
                onClick={() => toast.message("已刷新")}
                title="刷新"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <Tabs
            value={filter}
            onValueChange={(value) => {
              setFilter(value as InboxFilter);
              setSelectedId(null);
            }}
            className="gap-0"
          >
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg bg-[#f8f9fb] p-1">
              {FILTERS.map((item) => (
                <TabsTrigger
                  key={item.key}
                  value={item.key}
                  className="h-7 rounded-md px-2 text-[11px] data-[state=active]:bg-white data-[state=active]:text-[#2773ff] data-[state=active]:shadow-sm"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <InboxList
            items={items}
            selectedId={selectedItem?.id ?? null}
            onSelect={handleSelect}
          />
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-white">
        {selectedItem ? (
          <InboxDetail item={selectedItem} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f0fb] text-[#2773ff]">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-900">选择一条通知</p>
            <p className="mt-1 text-[13px] text-[#5a6779]">
              左侧选择后，右侧直接打开 Issue 评论或会话交付内容
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
