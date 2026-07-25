"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  MY_CLAW_SESSIONS,
  type MyClawSessionListItem,
} from "@/lib/mock/my-claw";

interface MyClawContextValue {
  sessions: MyClawSessionListItem[];
  activeSessionId: string | null;
  summonedAgentIds: string[];
  selectedAgentId: string | null;
  setActiveSession: (sessionId: string | null) => void;
  pinSession: (sessionId: string, pinned?: boolean) => void;
  renameSession: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;
  summonAgent: (agentId: string) => void;
  dismissAgent: (agentId: string) => void;
  setSelectedAgentId: (agentId: string | null) => void;
}

const MyClawContext = createContext<MyClawContextValue | null>(null);

export function MyClawProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<MyClawSessionListItem[]>(() =>
    MY_CLAW_SESSIONS.map((session) => ({ ...session }))
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [summonedAgentIds, setSummonedAgentIds] = useState<string[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

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

  const summonAgent = useCallback((agentId: string) => {
    setSummonedAgentIds((prev) =>
      prev.includes(agentId) ? prev : [...prev, agentId]
    );
    setSelectedAgentId(agentId);
  }, []);

  const dismissAgent = useCallback((agentId: string) => {
    setSummonedAgentIds((prev) => prev.filter((id) => id !== agentId));
    setSelectedAgentId((current) => (current === agentId ? null : current));
  }, []);

  const value = useMemo<MyClawContextValue>(
    () => ({
      sessions,
      activeSessionId,
      summonedAgentIds,
      selectedAgentId,
      setActiveSession,
      pinSession,
      renameSession,
      deleteSession,
      summonAgent,
      dismissAgent,
      setSelectedAgentId,
    }),
    [
      sessions,
      activeSessionId,
      summonedAgentIds,
      selectedAgentId,
      setActiveSession,
      pinSession,
      renameSession,
      deleteSession,
      summonAgent,
      dismissAgent,
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
