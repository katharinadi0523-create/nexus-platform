"use client";

import {
  DebugChatComposer,
  type ModelErrorDemoState,
} from "@/components/claw-hub-next/debug-chat-composer";
import type { ClawDetailData } from "@/lib/mock/claw-hub-next";
import { AgentSelector } from "./agent-selector";

interface ComposerWithAgentsProps {
  detail: ClawDetailData;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  modelScopeKey?: string;
  personalMode?: boolean;
  onOpenWorkspace?: () => void;
  isBusy?: boolean;
  onInterrupt?: () => void;
  queueHint?: string;
  modelErrorDemo?: ModelErrorDemoState;
  modelPickerOpen?: boolean;
  onModelPickerOpenChange?: (open: boolean) => void;
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
  modelScopeKey = "new",
  personalMode = false,
  onOpenWorkspace,
  isBusy = false,
  onInterrupt,
  queueHint,
  modelErrorDemo,
  modelPickerOpen,
  onModelPickerOpenChange,
}: ComposerWithAgentsProps) {
  return (
    <DebugChatComposer
      key={modelScopeKey}
      detail={detail}
      value={value}
      onChange={onChange}
      onSend={onSend}
      modelScopeKey={modelScopeKey}
      personalMode={personalMode}
      onOpenWorkspace={onOpenWorkspace}
      isBusy={isBusy}
      onInterrupt={onInterrupt}
      queueHint={queueHint}
      modelErrorDemo={modelErrorDemo}
      modelPickerOpen={modelPickerOpen}
      onModelPickerOpenChange={onModelPickerOpenChange}
      footerLeadingExtra={<AgentSelector />}
    />
  );
}
