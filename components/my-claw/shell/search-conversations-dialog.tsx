"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useMyClaw } from "@/components/my-claw/provider";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  buildConversationHref,
  searchConversations,
  toPersonalSearchableConversation,
  toProjectSearchableConversation,
  type ConversationSearchHit,
} from "@/lib/mock/my-claw/conversation-search";
import { cn } from "@/lib/utils";

interface SearchConversationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function HighlightedText({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  className?: string;
}) {
  const needle = query.trim();
  if (!needle || !text) {
    return <span className={className}>{text}</span>;
  }

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === needle.toLowerCase() ? (
          <mark
            key={`${part}-${index}`}
            className="rounded-[2px] bg-[#fff3bf] text-inherit"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </span>
  );
}

function SearchResultRow({
  hit,
  query,
  onSelect,
}: {
  hit: ConversationSearchHit;
  query: string;
  onSelect: (hit: ConversationSearchHit) => void;
}) {
  const highlight = query.trim().length > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(hit)}
      className="flex w-full flex-col gap-1 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#f8f9fb] focus-visible:bg-[#e8f0fb] focus-visible:outline-none"
    >
      <HighlightedText
        text={hit.conversation.title}
        query={highlight ? query : ""}
        className="block truncate text-[14px] font-medium text-slate-900"
      />
      <div className="truncate text-[12px] leading-5 text-[#5a6779]">
        {hit.conversation.agentName}
      </div>
      {hit.snippet ? (
        <HighlightedText
          text={hit.snippet}
          query={highlight ? query : ""}
          className="line-clamp-2 text-[12px] leading-5 text-slate-600"
        />
      ) : null}
    </button>
  );
}

export function SearchConversationsDialog({
  open,
  onOpenChange,
}: SearchConversationsDialogProps) {
  const router = useRouter();
  const { sessions, setActiveSession } = useMyClaw();
  const {
    state,
    currentUserId,
    getProject,
    getActor,
    getMessages,
  } = useProjectConversation();
  const [query, setQuery] = useState("");

  const searchableConversations = useMemo(() => {
    const personal = sessions.map(toPersonalSearchableConversation);
    const project = state.threads.flatMap((conversation) => {
      if (!conversation.humanMemberIds.includes(currentUserId)) return [];
      const item = toProjectSearchableConversation({
        conversation,
        project: getProject(conversation.projectId),
        messages: getMessages(conversation.projectId, conversation.id),
        getActor,
      });
      return item ? [item] : [];
    });
    return [...personal, ...project];
  }, [
    currentUserId,
    getActor,
    getMessages,
    getProject,
    sessions,
    state.threads,
  ]);

  const hits = useMemo(
    () => searchConversations(searchableConversations, query),
    [query, searchableConversations],
  );

  const isSearching = query.trim().length > 0;

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) setQuery("");
  };

  const handleSelect = (hit: ConversationSearchHit) => {
    const href = buildConversationHref(hit);
    if (hit.conversation.source === "personal") {
      setActiveSession(hit.conversation.id);
    }
    handleOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex h-[520px] max-h-[520px] w-full flex-col gap-0 overflow-hidden rounded-2xl border-[#e2e8f0] p-0 shadow-xl sm:max-w-[480px]"
      >
        <DialogHeader className="shrink-0 space-y-0 border-b border-[#eef2f6] px-5 py-4 text-left">
          <DialogTitle className="text-[15px] font-semibold text-slate-900">
            搜索会话
          </DialogTitle>
          <DialogDescription className="sr-only">
            搜索可访问的会话名称，以及用户消息与 Agent 回复正文
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a6779]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索会话名称或内容"
              autoFocus
              className="h-9 border-[#e2e8f0] bg-[#f8f9fb] pl-9 text-[13px] shadow-none placeholder:text-[#9aa6b6] focus-visible:border-[#2773ff]/40 focus-visible:ring-[#2773ff]/20"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {!isSearching ? (
            <div className="px-3 pb-1 pt-1 text-[11px] font-medium tracking-wide text-[#5a6779]">
              最近会话
            </div>
          ) : null}

          {hits.length > 0 ? (
            <div className="space-y-0.5">
              {hits.map((hit) => (
                <SearchResultRow
                  key={`${hit.conversation.source}-${hit.conversation.id}`}
                  hit={hit}
                  query={query}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ) : (
            <div
              className={cn(
                "flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center",
              )}
            >
              <Search className="mb-3 h-8 w-8 text-[#c5ced9]" />
              <p className="text-[13px] text-[#5a6779]">
                {isSearching
                  ? "没有匹配的会话名称或内容"
                  : "暂无最近会话"}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
