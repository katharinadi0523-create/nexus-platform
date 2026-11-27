import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConversationTimelineItem } from "@/components/claw-hub-next/detail/utils";
import { CREATE_TIMELINE_ITEMS } from "./claw-mock-flows";
import type { SkillFile } from "./types";

export type CreatePlaybackPhase = "idle" | "running" | "complete";
export type ChainStepStatus = "pending" | "active" | "done";

export const CREATE_CHAIN_STEPS = [
  { id: "intake", label: "接收需求与样本", keys: ["create-user", "create-skill"] },
  {
    id: "search",
    label: "检索本地 Skill / 工单池",
    keys: ["create-intent", "create-local-skills", "create-work-order-pool"],
  },
  { id: "ontology", label: "本体装配解析方法", keys: ["create-ontology", "create-parser-method"] },
  { id: "package", label: "生成标准 Skill 包", keys: ["create-package"] },
  { id: "verify", label: "基础生成校验", keys: ["create-tests"] },
  { id: "ready", label: "产出可保存草稿", keys: ["create-output"] },
] as const;

export function buildTimelineScript(
  items: ConversationTimelineItem[],
  request: string,
  attachments?: string[],
): ConversationTimelineItem[] {
  return items.map((item) =>
    item.type === "user"
      ? {
          ...item,
          message: {
            ...item.message,
            content: request,
            attachments: attachments?.length ? attachments : item.message.attachments,
          },
        }
      : item,
  );
}

export function buildCreateScript(
  request: string,
  attachments?: string[],
): ConversationTimelineItem[] {
  return buildTimelineScript(CREATE_TIMELINE_ITEMS, request, attachments);
}

export function createPlaybackSnapshot(
  script: ConversationTimelineItem[],
  doneIndex: number,
  live: boolean,
): ConversationTimelineItem[] {
  if (doneIndex < 0 && !live) return [];
  const end = live ? doneIndex + 2 : doneIndex + 1;
  return script.slice(0, Math.max(0, end)).map((item, index, arr) => {
    const isTail = live && index === arr.length - 1;
    if (item.type === "action") {
      return { ...item, status: isTail ? "running" : "done" };
    }
    if (item.type === "thinking") {
      return { ...item, active: isTail };
    }
    return item;
  });
}

function isSettled(item: ConversationTimelineItem): boolean {
  if (item.type === "action") return item.status === "done";
  if (item.type === "thinking") return !item.active;
  return true;
}

export function chainStepStatuses(
  items: ConversationTimelineItem[],
  complete: boolean,
): Array<{ id: string; label: string; status: ChainStepStatus }> {
  return CREATE_CHAIN_STEPS.map((step) => {
    if (complete) return { id: step.id, label: step.label, status: "done" };
    const stepItems = items.filter((item) => (step.keys as readonly string[]).includes(item.key));
    if (step.keys.every((key) => stepItems.some((item) => item.key === key && isSettled(item)))) {
      return { id: step.id, label: step.label, status: "done" };
    }
    if (stepItems.length > 0) {
      return { id: step.id, label: step.label, status: "active" };
    }
    return { id: step.id, label: step.label, status: "pending" };
  });
}

/** 产物预览只在对话完整输出后一次性给出，不跟随对话流式出现。 */
export function visibleCreateFiles(all: SkillFile[], complete: boolean): SkillFile[] {
  return complete ? all : [];
}

function dwellFor(item: ConversationTimelineItem): number {
  if (item.type === "user") return 320;
  if (item.type === "thinking") return 980;
  if (item.type === "output") return 480;
  return 720;
}

export function useSkillTimelinePlayback(sourceItems: ConversationTimelineItem[]) {
  const [phase, setPhase] = useState<CreatePlaybackPhase>("idle");
  const [script, setScript] = useState(sourceItems);
  const [doneIndex, setDoneIndex] = useState(-1);
  const [live, setLive] = useState(false);

  const start = useCallback(
    (request: string, attachments?: string[]) => {
      setScript(buildTimelineScript(sourceItems, request, attachments));
      setDoneIndex(0);
      setLive(false);
      setPhase("running");
    },
    [sourceItems],
  );

  useEffect(() => {
    if (phase !== "running") return;
    const nextIndex = doneIndex + 1;
    if (nextIndex >= script.length) {
      setLive(false);
      setPhase("complete");
      return;
    }
    const next = script[nextIndex]!;
    const needsLive = next.type === "action" || next.type === "thinking";
    if (needsLive && !live) {
      const timer = window.setTimeout(() => setLive(true), 280);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      setDoneIndex(nextIndex);
      setLive(false);
    }, dwellFor(next));
    return () => window.clearTimeout(timer);
  }, [doneIndex, live, phase, script]);

  const items = useMemo(
    () =>
      phase !== "complete"
        ? createPlaybackSnapshot(script, doneIndex, live)
        : script,
    [doneIndex, live, phase, script],
  );

  return {
    phase,
    items,
    isPlaying: phase === "running",
    start,
  };
}

export function useCreateSkillPlayback(enabled: boolean) {
  const playback = useSkillTimelinePlayback(CREATE_TIMELINE_ITEMS);
  const steps = useMemo(
    () => chainStepStatuses(enabled ? playback.items : CREATE_TIMELINE_ITEMS, !enabled || playback.phase === "complete"),
    [enabled, playback.items, playback.phase],
  );
  return {
    phase: enabled ? playback.phase : ("complete" as const),
    items: enabled ? playback.items : [],
    steps,
    isPlaying: enabled && playback.isPlaying,
    start: playback.start,
  };
}
