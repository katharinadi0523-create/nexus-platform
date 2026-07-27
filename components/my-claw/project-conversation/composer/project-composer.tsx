"use client";

import { useMemo, useRef, useState } from "react";
import { AtSign, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectMessage } from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "../project-conversation-provider";
import { MentionPicker, type MentionTarget } from "./mention-picker";

interface ProjectComposerProps {
  projectId: string;
  quotedMessage?: ProjectMessage | null;
  onClearQuote?: () => void;
  disabled?: boolean;
}

export function ProjectComposer({
  projectId,
  quotedMessage,
  onClearQuote,
  disabled,
}: ProjectComposerProps) {
  const {
    state,
    getMembers,
    getUser,
    getActor,
    sendMessage,
  } = useProjectConversation();

  const [content, setContent] = useState("");
  const [mentionedHumanIds, setMentionedHumanIds] = useState<string[]>([]);
  const [mentionedActorIds, setMentionedActorIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const members = getMembers(projectId);
  const project = state.projects.find((item) => item.id === projectId);
  const isArchived = project?.status === "archived";

  const chips = useMemo(
    () => [
      ...mentionedHumanIds.map((id) => ({
        key: `h-${id}`,
        kind: "human" as const,
        id,
        label: `@${getUser(id)?.name ?? id}`,
      })),
      ...mentionedActorIds.map((id) => ({
        key: `a-${id}`,
        kind: "agent" as const,
        id,
        label: `@${getActor(id)?.name ?? id}`,
      })),
    ],
    [getActor, getUser, mentionedActorIds, mentionedHumanIds]
  );

  const openPicker = (query = "") => {
    setMentionQuery(query);
    setPickerOpen(true);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setMentionQuery("");
  };

  const handleSelectMention = (target: MentionTarget) => {
    if (target.kind === "human") {
      setMentionedHumanIds((prev) =>
        prev.includes(target.id) ? prev : [...prev, target.id]
      );
    } else {
      setMentionedActorIds((prev) =>
        prev.includes(target.id) ? prev : [...prev, target.id]
      );
    }

    setContent((prev) => {
      const atIndex = prev.lastIndexOf("@");
      if (atIndex >= 0 && pickerOpen) {
        return `${prev.slice(0, atIndex)}@${target.label} `;
      }
      if (!prev.includes(`@${target.label}`)) {
        return `${prev}${prev && !prev.endsWith(" ") ? " " : ""}@${target.label} `;
      }
      return prev;
    });
    closePicker();
    textareaRef.current?.focus();
  };

  const removeChip = (kind: "human" | "agent", id: string) => {
    if (kind === "human") {
      setMentionedHumanIds((prev) => prev.filter((item) => item !== id));
    } else {
      setMentionedActorIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleSend = () => {
    if (disabled || isArchived) return;
    const trimmed = content.trim();
    if (!trimmed && mentionedActorIds.length === 0) return;

    const result = sendMessage({
      projectId,
      content: trimmed,
      mentionedHumanIds,
      mentionedActorIds,
      quotedMessageIds: quotedMessage ? [quotedMessage.id] : [],
      fileIds: [],
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setContent("");
    setMentionedHumanIds([]);
    setMentionedActorIds([]);
    setError(null);
    closePicker();
    onClearQuote?.();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && pickerOpen) {
      e.preventDefault();
      closePicker();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onChange = (value: string) => {
    setContent(value);
    setError(null);
    const atMatch = value.match(/@([^\s@]*)$/);
    if (atMatch) {
      openPicker(atMatch[1] ?? "");
    } else if (pickerOpen && !value.includes("@")) {
      closePicker();
    }
  };

  return (
    <div className="shrink-0 border-t border-[#eef2f6] bg-white px-4 py-3">
      <div className="relative mx-auto max-w-3xl">
        {quotedMessage ? (
          <div className="mb-2 flex items-start gap-2 rounded-md border border-[#e2e8f0] bg-[#f8f9fb] px-2.5 py-2 text-[12px]">
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 font-medium text-slate-600">引用消息</div>
              <div className="line-clamp-2 whitespace-pre-wrap text-[#5a6779]">
                {quotedMessage.content}
              </div>
            </div>
            <button
              type="button"
              onClick={onClearQuote}
              className="rounded p-0.5 text-[#5a6779] hover:bg-slate-200/60"
              aria-label="取消引用"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        {chips.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1">
            {chips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 rounded bg-[#e8f0fb] px-1.5 py-0.5 text-[11px] font-medium text-[#2773ff]"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={() => removeChip(chip.kind, chip.id)}
                  className="rounded hover:bg-[#d6e6fb]"
                  aria-label={`移除 ${chip.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {pickerOpen ? (
          <div className="absolute bottom-full left-0 right-0 z-20 mb-2">
            <MentionPicker
              members={members}
              users={state.users}
              actors={state.actors}
              query={mentionQuery}
              selectedHumanIds={mentionedHumanIds}
              selectedActorIds={mentionedActorIds}
              onSelect={handleSelectMention}
            />
          </div>
        ) : null}

        <div className="rounded-xl border border-[#e2e8f0] bg-[#f8f9fb] focus-within:border-[#2773ff]/50 focus-within:ring-2 focus-within:ring-[#2773ff]/15">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              isArchived
                ? "项目已归档，无法发送消息"
                : "输入消息，使用 @ 提及成员或 Agent…"
            }
            disabled={disabled || isArchived}
            className="min-h-[72px] resize-none border-0 bg-transparent px-3 py-2.5 text-[13px] shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || isArchived}
              onClick={() => (pickerOpen ? closePicker() : openPicker())}
              className="h-8 px-2 text-[#5a6779]"
            >
              <AtSign className="h-4 w-4" />
              @
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={disabled || isArchived || !content.trim()}
              onClick={handleSend}
              className="h-8 bg-[#2773ff] px-3 hover:bg-[#1f63e0]"
            >
              <Send className="h-3.5 w-3.5" />
              发送
            </Button>
          </div>
        </div>

        {error ? (
          <p className="mt-1.5 text-[12px] text-red-600">{error}</p>
        ) : (
          <p className="mt-1.5 text-[11px] text-[#5a6779]">
            Enter 发送 · Shift+Enter 换行 · Esc 关闭 @ 列表 · 单次最多 3 个 Agent
          </p>
        )}
      </div>
    </div>
  );
}
