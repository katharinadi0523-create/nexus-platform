"use client";

import { FileText } from "lucide-react";
import type { ProjectMessage } from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "../project-conversation-provider";
import { ActorAvatar } from "../shared/actor-avatar";

interface FileShareMessageProps {
  message: ProjectMessage;
  highlighted?: boolean;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FileShareMessage({
  message,
  highlighted,
}: FileShareMessageProps) {
  const { getUser, getFiles, setHighlightedMessage, openDrawer } =
    useProjectConversation();
  const author =
    message.author.kind === "human" ? getUser(message.author.id) : undefined;
  const files = getFiles(message.projectId).filter((file) =>
    message.fileIds.includes(file.id)
  );

  return (
    <div
      id={`message-${message.id}`}
      className={`rounded-lg px-3 py-2.5 transition-colors ${
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
      </div>

      {message.content ? (
        <p className="mb-2 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
          {message.content}
        </p>
      ) : null}

      <div className="space-y-1.5">
        {files.map((file) => (
          <button
            key={file.id}
            type="button"
            onClick={() => {
              setHighlightedMessage(message.id);
              openDrawer("files");
            }}
            className="flex w-full items-center gap-2 rounded-md border border-[#e2e8f0] bg-white px-2.5 py-2 text-left text-[12px] text-slate-700 transition-colors hover:border-[#2773ff]/40 hover:bg-[#f8f9fb]"
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-[#2773ff]" />
            <span className="truncate font-medium">{file.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
