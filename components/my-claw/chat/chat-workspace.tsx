"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useMyClaw } from "@/components/my-claw/provider";
import { getPersonalClawDetail } from "@/lib/mock/my-claw/personal-claw";
import { getMyClawSession } from "@/lib/mock/my-claw/sessions";
import type { MyClawSessionListItem } from "@/lib/mock/my-claw/types";
import { ComposerWithAgents } from "./composer-with-agents";
import { ExpenseChatPanel } from "./expense-chat-panel";

interface ChatWorkspaceProps {
  sessionId?: string | null;
}

function ResearchPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-md text-center">
        <Loader2 className="mx-auto h-5 w-5 text-slate-400" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900">科研会话</h2>
        <p className="mt-2 text-sm leading-6 text-[#5a6779]">
          科研会话将在 Task 5 接入
        </p>
      </div>
    </div>
  );
}

function BlankChatPanel() {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const [draft, setDraft] = useState("");

  return (
    <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]">
      <div className="flex min-h-0 flex-1 items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold text-slate-900">开始新会话</h2>
          <p className="mt-2 text-sm leading-6 text-[#5a6779]">
            在下方输入问题，或从左侧选择「上海出差报销」查看完整差旅演示。
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

/**
 * Enterprise / non-expense host: empty timeline + ComposerWithAgents.
 * Avoids ClawInteractiveChatPanel seed-session mismatch (task-* vs office-shrimp-*).
 */
function EnterpriseSessionPanel({ session }: { session: MyClawSessionListItem }) {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const [draft, setDraft] = useState("");

  return (
    <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]">
      <div className="flex min-h-0 flex-1 items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold text-slate-900">{session.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#5a6779]">
            {session.preview || "企业会话时间线暂未接入，可先在下方输入继续对话。"}
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
    return <ResearchPlaceholder />;
  }

  return <EnterpriseSessionPanel session={session} />;
}
