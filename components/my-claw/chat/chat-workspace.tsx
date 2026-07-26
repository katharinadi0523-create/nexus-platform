"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useMyClaw } from "@/components/my-claw/provider";
import {
  getMyClawOpeningGreeting,
  MY_CLAW_BRAND_ICON_SRC,
  MY_CLAW_BRAND_NAME,
  MY_CLAW_USER_DISPLAY_NAME,
} from "@/lib/mock/my-claw/branding";
import { getPersonalClawDetail } from "@/lib/mock/my-claw/personal-claw";
import { getMyClawSession } from "@/lib/mock/my-claw/sessions";
import { ComposerWithAgents } from "./composer-with-agents";
import { EnterpriseSessionPanel } from "./enterprise-session-panel";
import { ExpenseChatPanel } from "./expense-chat-panel";
import { ResearchWorkspace } from "./research-workspace";

interface ChatWorkspaceProps {
  sessionId?: string | null;
}

function BlankChatPanel() {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const [draft, setDraft] = useState("");
  const greeting = getMyClawOpeningGreeting(MY_CLAW_USER_DISPLAY_NAME);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]">
      <div className="flex min-h-0 flex-1 items-center justify-center px-6">
        <div className="flex max-w-lg flex-col items-center text-center">
          <Image
            src={MY_CLAW_BRAND_ICON_SRC}
            alt={MY_CLAW_BRAND_NAME}
            width={112}
            height={112}
            className="h-28 w-28 object-contain drop-shadow-sm"
            priority
          />
          <p className="mt-6 text-[17px] font-medium leading-8 tracking-[-0.01em] text-slate-800">
            {greeting}
          </p>
        </div>
      </div>
      <div className="shrink-0 px-4 py-4 lg:px-8 lg:py-5">
        <div className="mx-auto w-full max-w-4xl">
          <ComposerWithAgents
            detail={detail}
            value={draft}
            onChange={setDraft}
            onSend={() => setDraft("")}
          />
        </div>
      </div>
    </div>
  );
}

export function ChatWorkspace({ sessionId }: ChatWorkspaceProps) {
  const { setActiveSession } = useMyClaw();

  useEffect(() => {
    setActiveSession(sessionId ?? null);
  }, [sessionId, setActiveSession]);

  if (!sessionId) {
    return <BlankChatPanel />;
  }

  const session = getMyClawSession(sessionId);

  if (!session) {
    return <BlankChatPanel />;
  }

  if (session.kind === "expense") {
    return <ExpenseChatPanel />;
  }

  if (session.kind === "research_multi_agent") {
    return <ResearchWorkspace />;
  }

  return <EnterpriseSessionPanel session={session} />;
}
