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
 * Composer stack: agent chips above Nexus DebugChatComposer.
 * Avoids editing DebugChatComposer; selector sits near the input.
 */
export function ComposerWithAgents({
  detail,
  value,
  onChange,
  onSend,
}: ComposerWithAgentsProps) {
  return (
    <div className="space-y-3">
      <AgentSelector />
      <DebugChatComposer
        detail={detail}
        value={value}
        onChange={onChange}
        onSend={onSend}
      />
    </div>
  );
}
