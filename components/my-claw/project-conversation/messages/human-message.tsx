"use client";

import { FileText, Quote } from "lucide-react";
import type { ProjectMessage } from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "../project-conversation-provider";
import { ActorAvatar } from "../shared/actor-avatar";
import { InlineExecutionStatus } from "./inline-execution-status";

interface HumanMessageProps {
  message: ProjectMessage;
  highlighted?: boolean;
  onQuote?: (message: ProjectMessage) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HumanMessage({
  message,
  highlighted,
  onQuote,
}: HumanMessageProps) {
  const { getUser, getActor, getMessages, getFiles } = useProjectConversation();
  const author =
    message.author.kind === "human" ? getUser(message.author.id) : undefined;
  const projectMessages = getMessages(message.projectId);
  const quoted = projectMessages.filter((item) =>
    message.quotedMessageIds.includes(item.id)
  );
  const files = getFiles(message.projectId).filter((file) =>
    message.fileIds.includes(file.id)
  );

  const mentionChips = [
    ...message.mentionedHumanIds.map((id) => ({
      key: `h-${id}`,
      label: `@${getUser(id)?.name ?? "成员"}`,
    })),
    ...message.mentionedActorIds.map((id) => ({
      key: `a-${id}`,
      label: `@${getActor(id)?.name ?? "Agent"}`,
    })),
  ];

  return (
    <div
      id={`message-${message.id}`}
      className={`group rounded-lg px-3 py-2.5 transition-colors ${
        highlighted ? "bg-[#e8f0fb]/70 ring-1 ring-[#2773ff]/25" : ""
      }`}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <ActorAvatar
          kind="human"
          name={author?.name ?? "成员"}
          initials={author?.initials}
          size="sm"
        />
        <span className="text-[13px] font-medium text-slate-800">
          {author?.name ?? "成员"}
        </span>
        <span className="text-[11px] text-[#5a6779]">
          {formatTime(message.createdAt)}
        </span>
        {onQuote ? (
          <button
            type="button"
            onClick={() => onQuote(message)}
            className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[#5a6779] opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
          >
            <Quote className="h-3 w-3" />
            引用
          </button>
        ) : null}
      </div>

      {quoted.length > 0 ? (
        <div className="mb-2 space-y-1">
          {quoted.map((item) => (
            <div
              key={item.id}
              className="rounded-md border-l-2 border-[#2773ff]/50 bg-[#f8f9fb] px-2.5 py-1.5 text-[12px] text-[#5a6779]"
            >
              <div className="mb-0.5 font-medium text-slate-600">
                {item.author.kind === "human"
                  ? getUser(item.author.id)?.name
                  : item.author.kind === "agent"
                    ? getActor(item.author.id)?.name
                    : "系统"}
              </div>
              <div className="line-clamp-2 whitespace-pre-wrap">
                {item.content}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {mentionChips.length > 0 ? (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {mentionChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex rounded bg-[#e8f0fb] px-1.5 py-0.5 text-[11px] font-medium text-[#2773ff]"
            >
              {chip.label}
            </span>
          ))}
        </div>
      ) : null}

      <p className="whitespace-pre-wrap text-[13px] leading-6 text-slate-800">
        {message.content}
      </p>

      {files.length > 0 ? (
        <div className="mt-2 space-y-1">
          {files.map((file) => (
            <div
              key={file.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-2 py-1 text-[12px] text-slate-700"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-[#5a6779]" />
              <span className="truncate">{file.name}</span>
            </div>
          ))}
        </div>
      ) : null}

      <InlineExecutionStatus message={message} />
    </div>
  );
}
