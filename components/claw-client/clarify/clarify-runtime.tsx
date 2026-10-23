"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import type { ClarifyAnswers } from "@/components/claw-hub-next/clarify-pager";
import {
  createClarifyAutoResolution,
  projectClarifyAutoResolution,
  snoozeClarifyAutoResolution,
  type ClarifyAutoResolution,
  type ClarifyAutoResolutionProjection,
  type ClarifyResolutionMode,
} from "@/lib/claw-clarify";


export interface ClarifyPending {
  requestId: string;
  autoResolution: ClarifyAutoResolution;
}

export interface ClarifyResult {
  requestId: string;
  answers: ClarifyAnswers;
  mode: ClarifyResolutionMode;
}

interface ClarifyRuntimeValue {
  now: number;
  pendings: Record<string, ClarifyPending>;
  results: Record<string, ClarifyResult>;
  /** 注册一个待回答的提问；同一 requestId 重复注册为幂等。 */
  register: (sessionId: string, requestId: string) => void;
  /** 用户首次有效操作：永久暂停本次自动继续（幂等）。 */
  snooze: (sessionId: string) => void;
  resolve: (sessionId: string, answers: ClarifyAnswers, mode: ClarifyResolutionMode) => void;
  reset: (sessionId: string) => void;
  project: (sessionId: string) => ClarifyAutoResolutionProjection | null;
}

const ClarifyRuntimeContext = createContext<ClarifyRuntimeValue | null>(null);

/**
 * 基础使用端的澄清运行时（原型）：集中管理各会话待回答的提问和计时状态，
 * 供会话列表与问答面板共同投影。
 */
export function ClarifyRuntimeProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  // 演示用时钟缩放（如 ?clarifyClockScale=20），仅缩短等待，不改变产品常量。
  const clockScale = Number(searchParams.get("clarifyClockScale")) || 1;
  const [now, setNow] = useState(() => Date.now());
  const [pendings, setPendings] = useState<Record<string, ClarifyPending>>({});
  const [results, setResults] = useState<Record<string, ClarifyResult>>({});
  const pendingsRef = useRef(pendings);

  useEffect(() => {
    pendingsRef.current = pendings;
  }, [pendings]);

  const resolve = useCallback(
    (sessionId: string, answers: ClarifyAnswers, mode: ClarifyResolutionMode) => {
      const pending = pendingsRef.current[sessionId];
      if (!pending) return;
      // 先到先得：同一提问只收口一次。
      pendingsRef.current = { ...pendingsRef.current };
      delete pendingsRef.current[sessionId];
      setResults((current) =>
        current[sessionId]?.requestId === pending.requestId
          ? current
          : { ...current, [sessionId]: { requestId: pending.requestId, answers, mode } },
      );
      setPendings((current) => {
        if (current[sessionId]?.requestId !== pending.requestId) return current;
        const next = { ...current };
        delete next[sessionId];
        return next;
      });
    },
    [],
  );

  const hasTimed = Object.values(pendings).some(
    (pending) => pending.autoResolution.state === "timed",
  );

  useEffect(() => {
    if (!hasTimed) return;
    const timer = window.setInterval(() => {
      const at = Date.now();
      setNow(at);
      // 截止时间到达：以空答案收口（与问答面板是否打开无关）。
      for (const [sessionId, pending] of Object.entries(pendingsRef.current)) {
        if (projectClarifyAutoResolution(pending.autoResolution, at).phase === "expired") {
          resolve(sessionId, {}, "auto_continued");
        }
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [hasTimed, resolve]);

  const register = useCallback(
    (sessionId: string, requestId: string) => {
      if (pendingsRef.current[sessionId]?.requestId === requestId) return;
      const startedAt = Date.now();
      const pending: ClarifyPending = {
        requestId,
        autoResolution: createClarifyAutoResolution(startedAt, clockScale),
      };
      pendingsRef.current = { ...pendingsRef.current, [sessionId]: pending };
      setNow(startedAt);
      setPendings((current) =>
        current[sessionId]?.requestId === requestId ? current : { ...current, [sessionId]: pending },
      );
    },
    [clockScale],
  );

  const snooze = useCallback((sessionId: string) => {
    setPendings((current) => {
      const pending = current[sessionId];
      if (!pending) return current;
      const next = snoozeClarifyAutoResolution(pending.autoResolution, Date.now());
      if (next === pending.autoResolution) return current;
      return { ...current, [sessionId]: { ...pending, autoResolution: next } };
    });
  }, []);

  const reset = useCallback((sessionId: string) => {
    const nextRef = { ...pendingsRef.current };
    delete nextRef[sessionId];
    pendingsRef.current = nextRef;
    setPendings((current) => {
      const next = { ...current };
      delete next[sessionId];
      return next;
    });
    setResults((current) => {
      const next = { ...current };
      delete next[sessionId];
      return next;
    });
  }, []);

  const project = useCallback(
    (sessionId: string) => {
      const pending = pendings[sessionId];
      return pending ? projectClarifyAutoResolution(pending.autoResolution, now) : null;
    },
    [pendings, now],
  );

  const value = useMemo<ClarifyRuntimeValue>(
    () => ({
      now,
      pendings,
      results,
      register,
      snooze,
      resolve,
      reset,
      project,
    }),
    [now, pendings, results, register, snooze, resolve, reset, project],
  );

  return <ClarifyRuntimeContext.Provider value={value}>{children}</ClarifyRuntimeContext.Provider>;
}

export function useClarifyRuntime(): ClarifyRuntimeValue | null {
  return useContext(ClarifyRuntimeContext);
}
