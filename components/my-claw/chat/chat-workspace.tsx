"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { PanelRightOpen } from "lucide-react";
import { useMyClaw } from "@/components/my-claw/provider";
import {
  PersonalChatContext,
  usePersonalChatContext,
  type PersonalChatAttachment,
} from "@/components/claw-client/personal-chat-context";
import { PersonalConversationSidePanel, type PersonalPanelView } from "@/components/claw-client/personal-conversation-side-panel";
import {
  getMyClawOpeningGreeting,
  MY_CLAW_BRAND_ICON_SRC,
  MY_CLAW_BRAND_NAME,
  MY_CLAW_USER_DISPLAY_NAME,
} from "@/lib/mock/my-claw/branding";
import { getPersonalClawDetail } from "@/lib/mock/my-claw/personal-claw";
import { getMyClawSession } from "@/lib/mock/my-claw/sessions";
import { takeWorkspaceChatBootstrap } from "@/components/workspace-1/workspaceChatBridge";
import { ComposerWithAgents } from "./composer-with-agents";
import { EnterpriseSessionPanel } from "./enterprise-session-panel";
import { ExpenseChatPanel } from "./expense-chat-panel";
import { ResearchWorkspace } from "./research-workspace";

interface ChatWorkspaceProps {
  sessionId?: string | null;
  messageId?: string | null;
  /** Enables personal-only conversation layout and model/workspace controls. */
  personalMode?: boolean;
}

function subscribeWideScreen(callback: () => void) {
  const query = window.matchMedia("(min-width: 1440px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getWideScreenSnapshot() {
  return window.matchMedia("(min-width: 1440px)").matches;
}

function BlankChatPanel({
  personalMode = false,
  workspacePanelOpen = false,
  workspaceView = "summary",
  workspacePanelWidth = 280,
  onWorkspaceViewChange,
  onWorkspacePanelWidthChange,
  onOpenWorkspace,
  onCloseWorkspace,
}: {
  personalMode?: boolean;
  workspacePanelOpen?: boolean;
  workspaceView?: PersonalPanelView;
  workspacePanelWidth?: number;
  onWorkspaceViewChange?: (view: PersonalPanelView) => void;
  onWorkspacePanelWidthChange?: (width: number) => void;
  onOpenWorkspace?: () => void;
  onCloseWorkspace?: () => void;
}) {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const chat = usePersonalChatContext();
  const [draft, setDraft] = useState("");
  const greeting = getMyClawOpeningGreeting(MY_CLAW_USER_DISPLAY_NAME);

  useEffect(() => {
    if (!chat?.incomingDraft) return;
    const text = chat.consumeIncomingDraft();
    if (text) setDraft((current) => current || text);
  }, [chat]);

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]">
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
              modelScopeKey="new"
              personalMode={personalMode}
              onOpenWorkspace={onOpenWorkspace}
              value={draft}
              onChange={setDraft}
              onSend={() => setDraft("")}
            />
          </div>
        </div>
      </div>
      {personalMode ? (
        <PersonalConversationSidePanel
          open={workspacePanelOpen}
          personalMode
          view={workspaceView}
          panelWidth={workspacePanelWidth}
          onPanelWidthChange={(width) => onWorkspacePanelWidthChange?.(width)}
          onViewChange={(view) => onWorkspaceViewChange?.(view)}
          onClose={() => onCloseWorkspace?.()}
        />
      ) : null}
    </div>
  );
}

function PersonalChatHeader({
  title,
  open,
  onOpenPanel,
}: {
  title: string;
  open: boolean;
  onOpenPanel: () => void;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{title}</h1>
      {!open ? <button type="button" onClick={onOpenPanel} aria-label="打开会话侧栏" title="打开会话侧栏" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
        <PanelRightOpen className="h-4 w-4" />
      </button> : null}
    </header>
  );
}

function PersonalChatContent({
  title,
  children,
  open,
  onOpenPanel,
  seedDraft = "",
}: {
  title: string;
  children: ReactNode;
  open: boolean;
  onOpenPanel: () => void;
  seedDraft?: string;
}) {
  const [attachments, setAttachments] = useState<PersonalChatAttachment[]>([]);
  const [incomingDraft, setIncomingDraft] = useState(seedDraft);
  const addAttachments = useCallback((items: PersonalChatAttachment[]) => {
    setAttachments((current) => {
      const ids = new Set(current.map((item) => item.id));
      return [...current, ...items.filter((item) => !ids.has(item.id))];
    });
  }, []);
  const removeAttachment = useCallback((id: string) => {
    setAttachments((current) => current.filter((item) => item.id !== id));
  }, []);
  const clearAttachments = useCallback(() => setAttachments([]), []);
  const consumeIncomingDraft = useCallback(() => {
    const text = incomingDraft;
    if (text) setIncomingDraft("");
    return text;
  }, [incomingDraft]);
  const contextValue = useMemo(
    () => ({ attachments, addAttachments, removeAttachment, clearAttachments, incomingDraft, consumeIncomingDraft }),
    [attachments, addAttachments, removeAttachment, clearAttachments, incomingDraft, consumeIncomingDraft],
  );

  return (
    <PersonalChatContext.Provider value={contextValue}>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <PersonalChatHeader title={title} open={open} onOpenPanel={onOpenPanel} />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </PersonalChatContext.Provider>
  );
}

export function ChatWorkspace({ sessionId, messageId, personalMode = false }: ChatWorkspaceProps) {
  const { setActiveSession } = useMyClaw();
  const isWideScreen = useSyncExternalStore(subscribeWideScreen, getWideScreenSnapshot, () => false);
  const sessionKey = sessionId ?? null;
  const [boot] = useState(() => takeWorkspaceChatBootstrap());
  const [panelOpenState, setPanelOpenState] = useState<{ sessionKey: string | null; open: boolean | null }>({ sessionKey, open: boot ? true : null });
  const panelOpenOverride = panelOpenState.sessionKey === sessionKey ? panelOpenState.open : null;
  const setPanelOpenOverride = (open: boolean | null) => setPanelOpenState({ sessionKey, open });
  const workspacePanelOpen = panelOpenOverride ?? (isWideScreen && Boolean(sessionId));
  const [workspaceViewState, setWorkspaceViewState] = useState<{ sessionKey: string | null; view: PersonalPanelView }>({ sessionKey, view: boot ? "workspace" : "summary" });
  const workspaceView = workspaceViewState.sessionKey === sessionKey ? workspaceViewState.view : "summary";
  const [workspacePanelWidth, setWorkspacePanelWidth] = useState(400);

  useEffect(() => {
    setActiveSession(sessionId ?? null);
  }, [sessionId, setActiveSession]);

  useEffect(() => {
    if (!messageId) return;
    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(`personal-message-${messageId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => {
      window.clearTimeout(scrollTimer);
    };
  }, [messageId, sessionId]);

  const session = sessionId ? getMyClawSession(sessionId) : null;
  const changePanelView = (view: PersonalPanelView) => {
    setWorkspaceViewState({ sessionKey, view });
    setPanelOpenOverride(true);
  };
  const openSummaryPanel = () => {
    changePanelView("summary");
  };

  let content: ReactNode;
  if (!session) {
    content = (
      <BlankChatPanel
        personalMode={personalMode}
        workspacePanelOpen={workspacePanelOpen}
        workspaceView={workspaceView}
        workspacePanelWidth={workspacePanelWidth}
        onWorkspacePanelWidthChange={setWorkspacePanelWidth}
        onWorkspaceViewChange={changePanelView}
        onOpenWorkspace={() => changePanelView("workspace")}
        onCloseWorkspace={() => setPanelOpenOverride(false)}
      />
    );
  } else if (session.kind === "expense") {
    content = <ExpenseChatPanel sessionId={sessionId!} conversationTitle={session.title} highlightedMessageId={messageId} personalMode={personalMode} workspacePanelOpen={workspacePanelOpen} workspaceView={workspaceView} workspacePanelWidth={workspacePanelWidth} onWorkspacePanelWidthChange={setWorkspacePanelWidth} onWorkspaceViewChange={changePanelView} onOpenWorkspace={() => changePanelView("workspace")} onCloseWorkspace={() => setPanelOpenOverride(false)} />;
  } else if (session.kind === "research_multi_agent") {
    content = <ResearchWorkspace sessionId={sessionId!} conversationTitle={session.title} highlightedMessageId={messageId} personalMode={personalMode} workspacePanelOpen={workspacePanelOpen} workspaceView={workspaceView} workspacePanelWidth={workspacePanelWidth} onWorkspacePanelWidthChange={setWorkspacePanelWidth} onWorkspaceViewChange={changePanelView} onOpenWorkspace={() => changePanelView("workspace")} onCloseWorkspace={() => setPanelOpenOverride(false)} />;
  } else {
    content = <EnterpriseSessionPanel session={session} highlightedMessageId={messageId} personalMode={personalMode} workspacePanelOpen={workspacePanelOpen} workspaceView={workspaceView} workspacePanelWidth={workspacePanelWidth} onWorkspacePanelWidthChange={setWorkspacePanelWidth} onWorkspaceViewChange={changePanelView} onOpenWorkspace={() => changePanelView("workspace")} onCloseWorkspace={() => setPanelOpenOverride(false)} />;
  }

  if (!personalMode) return content;
  const title = session?.title ?? "新对话";
  return (
    <PersonalChatContent key={sessionKey ?? "new"} title={title} open={workspacePanelOpen} onOpenPanel={openSummaryPanel} seedDraft={boot?.text ?? ""}>
      {content}
    </PersonalChatContent>
  );
}
