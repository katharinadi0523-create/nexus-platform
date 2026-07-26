"use client";

import { DebugChatComposer } from "@/components/claw-hub-next/debug-chat-composer";
import type { ClawDetailData } from "@/lib/mock/claw-hub-next";
import { AgentSelector } from "./agent-selector";

interface ComposerWithAgentsProps {
  detail: ClawDetailData;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

/**
 * Wraps Nexus DebugChatComposer with an in-footer agent dropdown
 * (aligned with 会话交互 composer-agent-button).
 */
export function ComposerWithAgents({
  detail,
  value,
  onChange,
  onSend,
}: ComposerWithAgentsProps) {
  return (
    <DebugChatComposer
      detail={detail}
      value={value}
      onChange={onChange}
      onSend={onSend}
      footerLeadingExtra={<AgentSelector />}
    />
  );
}
