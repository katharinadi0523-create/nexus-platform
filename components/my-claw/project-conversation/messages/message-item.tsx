"use client";

import type { ProjectMessage } from "@/lib/mock/my-claw/project-conversation";
import { AgentReply } from "./agent-reply";
import { FileShareMessage } from "./file-share-message";
import { HumanMessage } from "./human-message";
import { SystemMessage } from "./system-message";

interface MessageItemProps {
  message: ProjectMessage;
  highlighted?: boolean;
  onQuote?: (message: ProjectMessage) => void;
}

export function MessageItem({
  message,
  highlighted,
  onQuote,
}: MessageItemProps) {
  switch (message.kind) {
    case "human":
      return (
        <HumanMessage
          message={message}
          highlighted={highlighted}
          onQuote={onQuote}
        />
      );
    case "agent_reply":
      return (
        <AgentReply message={message} highlighted={highlighted} />
      );
    case "file_share":
      return (
        <FileShareMessage message={message} highlighted={highlighted} />
      );
    case "system":
      return <SystemMessage message={message} />;
    default:
      return null;
  }
}
