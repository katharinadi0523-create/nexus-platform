"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  MY_CLAW_SESSIONS,
  RESEARCH_CLAW_ID,
  RESEARCH_SESSION_ID,
  type MyClawSessionListItem,
} from "@/lib/mock/my-claw";

const RESEARCH_SUMMON_IDS = new Set([
  RESEARCH_CLAW_ID,
  "research-claw-main",
  "ra-hypothesis",
  "ra-literature",
  "ra-viz",
  "ra-paper",
  "ra-review",
]);

interface MyClawContextValue {
  sessions: MyClawSessionListItem[];
  activeSessionId: string | null;
  summonedAgentIds: string[];
  selectedAgentId: string | null;
  /** Plaza favorite overrides; survives summon → chat → plaza navigation. */
  favoriteOverrides: Record<string, boolean>;
  setActiveSession: (sessionId: string | null) => void;
  pinSession: (sessionId: string, pinned?: boolean) => void;
  renameSession: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;
  summonAgent: (agentId: string) => void;
  dismissAgent: (agentId: string) => void;
  setSelectedAgentId: (agentId: string | null) => void;
  syncSummonedAgents: (agentIds: string[]) => void;
  setAgentFavorite: (agentId: string, favorite: boolean) => void;
}

const MyClawContext = createContext<MyClawContextValue | null>(null);

export function MyClawProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [sessions, setSessions] = useState<MyClawSessionListItem[]>(() =>
    MY_CLAW_SESSIONS.map((session) => ({ ...session }))
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [summonedAgentIds, setSummonedAgentIds] = useState<string[]>([
    "prd-writer",
    "ui-designer",
  ]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [favoriteOverrides, setFavoriteOverrides] = useState<
    Record<string, boolean>
  >({});

  const setActiveSession = useCallback((sessionId: string | null) => {
    setActiveSessionId(sessionId);
  }, []);

  const pinSession = useCallback((sessionId: string, pinned?: boolean) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              pinned: pinned ?? !session.pinned,
              updatedAt: new Date().toISOString(),
            }
          : session
      )
    );
  }, []);

  const renameSession = useCallback((sessionId: string, title: string) => {
    const nextTitle = title.trim();
    if (!nextTitle) return;

    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              title: nextTitle,
              updatedAt: new Date().toISOString(),
            }
          : session
      )
    );
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId));
    setActiveSessionId((current) => (current === sessionId ? null : current));
  }, []);

  const summonAgent = useCallback(
    (agentId: string) => {
      setSummonedAgentIds((prev) =>
        prev.includes(agentId) ? prev : [...prev, agentId]
      );
      setSelectedAgentId(agentId);

      // Research claw (and sub-agents) activate/create the research session.
      if (RESEARCH_SUMMON_IDS.has(agentId) || agentId === RESEARCH_CLAW_ID) {
        setSessions((prev) => {
          const exists = prev.some(
            (session) => session.id === RESEARCH_SESSION_ID
          );
          if (exists) {
            return prev.map((session) =>
              session.id === RESEARCH_SESSION_ID
                ? {
                    ...session,
                    kind: "research_multi_agent",
                    updatedAt: new Date().toISOString(),
                  }
                : session
            );
          }
          return [
            {
              id: RESEARCH_SESSION_ID,
              title: "科研多智能体协作",
              kind: "research_multi_agent" as const,
              pinned: true,
              updatedAt: new Date().toISOString(),
              preview: "多智能体科研协作会话",
            },
            ...prev,
          ];
        });
        setActiveSessionId(RESEARCH_SESSION_ID);
        router.push(
          `/my-claw/chat?sessionId=${encodeURIComponent(RESEARCH_SESSION_ID)}`
        );
        return;
      }

      // Non-research agents: summon into chat (blank / current draft host).
      router.push("/my-claw/chat");
    },
    [router]
  );

  const dismissAgent = useCallback((agentId: string) => {
    setSummonedAgentIds((prev) => prev.filter((id) => id !== agentId));
    setSelectedAgentId((current) => (current === agentId ? null : current));
  }, []);

  const syncSummonedAgents = useCallback((agentIds: string[]) => {
    setSummonedAgentIds((prev) => {
      const next = new Set(prev);
      for (const id of agentIds) next.add(id);
      return Array.from(next);
    });
  }, []);

  const setAgentFavorite = useCallback(
    (agentId: string, favorite: boolean) => {
      setFavoriteOverrides((prev) => ({ ...prev, [agentId]: favorite }));
    },
    []
  );

  const value = useMemo<MyClawContextValue>(
    () => ({
      sessions,
      activeSessionId,
      summonedAgentIds,
      selectedAgentId,
      favoriteOverrides,
      setActiveSession,
      pinSession,
      renameSession,
      deleteSession,
      summonAgent,
      dismissAgent,
      setSelectedAgentId,
      syncSummonedAgents,
      setAgentFavorite,
    }),
    [
      sessions,
      activeSessionId,
      summonedAgentIds,
      selectedAgentId,
      favoriteOverrides,
      setActiveSession,
      pinSession,
      renameSession,
      deleteSession,
      summonAgent,
      dismissAgent,
      syncSummonedAgents,
      setAgentFavorite,
    ]
  );

  return (
    <MyClawContext.Provider value={value}>{children}</MyClawContext.Provider>
  );
}

export function useMyClaw(): MyClawContextValue {
  const context = useContext(MyClawContext);
  if (!context) {
    throw new Error("useMyClaw must be used within MyClawProvider");
  }
  return context;
}
