"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConversationNavTurn {
  /** 与会话区里那一轮外层节点的 data-turn-id 一致。 */
  id: string;
  text: string;
}

/** 刻度间距：默认 10px，轮次多时压到 6px，再多就让刻度轨道自己滚动。 */
const PITCH = 10;
const MIN_PITCH = 6;
const MAX_RAIL_HEIGHT = 360;
/** 消息左侧留白小于这个宽度时放不下刻度，不显示。 */
const MIN_GUTTER = 40;
/** 视口顶部往下 48px 为基准线：开头越过它的最后一轮就是当前项，和点击跳转后的落点一致。 */
const ANCHOR_OFFSET = 48;
const STORAGE_PREFIX = "claw-client:conversation-nav:";

function readBookmarks(sessionKey: string): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + sessionKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeBookmarks(sessionKey: string, ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + sessionKey, JSON.stringify(ids));
  } catch {
    // 无痕窗口等场景写不进去，只在本次页面里生效。
  }
}

function firstLine(text: string) {
  return text.split("\n").find((line) => line.trim())?.trim() ?? "";
}

export function ConversationNav({
  scrollRef,
  turns,
  sessionKey,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  turns: ConversationNavTurn[];
  sessionKey: string;
}) {
  const [active, setActive] = useState(Math.max(0, turns.length - 1));
  const [hovered, setHovered] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [area, setArea] = useState({ gutter: 0, height: 0 });
  const [railScroll, setRailScroll] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);
  const leaveTimer = useRef<number | null>(null);

  useEffect(() => {
    setBookmarks(readBookmarks(sessionKey));
  }, [sessionKey]);

  const findTurn = useCallback(
    (id: string) => scrollRef.current?.querySelector<HTMLElement>(`[data-turn-id="${CSS.escape(id)}"]`) ?? null,
    [scrollRef],
  );

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el || lockRef.current || turns.length === 0) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) {
      setActive(turns.length - 1);
      return;
    }
    const top = el.getBoundingClientRect().top;
    let next = 0;
    turns.forEach((turn, index) => {
      const node = findTurn(turn.id);
      if (node && node.getBoundingClientRect().top - top <= ANCHOR_OFFSET) next = index;
    });
    setActive(next);
  }, [findTurn, scrollRef, turns]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(() => {
      const first = el.querySelector<HTMLElement>("[data-turn-id]");
      const gutter = first ? first.getBoundingClientRect().left - el.getBoundingClientRect().left : 0;
      setArea({ gutter, height: el.clientHeight });
      onScroll();
    });
    observer.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, [measure, scrollRef]);

  const maxRail = Math.min(MAX_RAIL_HEIGHT, area.height * 0.6);
  const pitch = Math.max(MIN_PITCH, Math.min(PITCH, turns.length ? maxRail / turns.length : PITCH));
  const railHeight = Math.min(turns.length * pitch, maxRail);
  const railScrollable = turns.length * pitch > maxRail;

  // 轨道可滚动时，当前项始终留在轨道可见范围内。
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !railScrollable) return;
    const center = active * pitch + pitch / 2;
    if (center < rail.scrollTop + pitch * 2 || center > rail.scrollTop + rail.clientHeight - pitch * 2) {
      rail.scrollTop = center - rail.clientHeight / 2;
    }
  }, [active, pitch, railScrollable]);

  const jump = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      const node = findTurn(turns[index]?.id ?? "");
      if (!el || !node) return;
      lockRef.current = true;
      setActive(index);
      const unlock = () => {
        lockRef.current = false;
        el.removeEventListener("scrollend", unlock);
      };
      el.addEventListener("scrollend", unlock);
      window.setTimeout(unlock, 900);
      el.scrollTo({ top: el.scrollTop + node.getBoundingClientRect().top - el.getBoundingClientRect().top - 16, behavior: "smooth" });
    },
    [findTurn, scrollRef, turns],
  );

  const toggleBookmark = (id: string) => {
    setBookmarks((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      writeBookmarks(sessionKey, next);
      return next;
    });
  };

  const enter = (index: number | null) => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = null;
    if (index !== null) setHovered(index);
  };
  const leave = () => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setHovered(null), 160);
  };

  useEffect(() => () => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
  }, []);

  if (turns.length < 2 || area.gutter < MIN_GUTTER) return null;

  const preview = hovered !== null ? turns[hovered] : null;
  const previewMarked = preview ? bookmarks.includes(preview.id) : false;

  return (
    <nav
      aria-label="对话导航"
      className="absolute left-2 top-1/2 z-20 -translate-y-1/2"
      onMouseLeave={leave}
    >
      <div
        ref={railRef}
        onScroll={(event) => setRailScroll(event.currentTarget.scrollTop)}
        className="overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ height: railHeight }}
      >
        {turns.map((turn, index) => {
          const current = index === active;
          const marked = bookmarks.includes(turn.id);
          return (
            <button
              key={turn.id}
              type="button"
              aria-label={`第 ${index + 1} 轮：${firstLine(turn.text)}`}
              aria-current={current ? "true" : undefined}
              onMouseEnter={() => enter(index)}
              onFocus={() => enter(index)}
              onBlur={leave}
              onClick={() => jump(index)}
              className="group flex w-6 items-center focus-visible:outline-none"
              style={{ height: pitch }}
            >
              <span
                className={cn(
                  "block h-[2px] rounded-full transition-all duration-150",
                  current ? "w-4" : hovered === index ? "w-3" : "w-2",
                  marked
                    ? current
                      ? "bg-[#1f63e0]"
                      : "bg-[#2773ff]/70 group-hover:bg-[#2773ff]"
                    : current
                      ? "bg-slate-700"
                      : "bg-slate-300 group-hover:bg-slate-500 group-focus-visible:bg-slate-500",
                )}
              />
            </button>
          );
        })}
      </div>

      {preview && hovered !== null ? (
        <div
          onMouseEnter={() => enter(null)}
          className="absolute left-8 flex w-max max-w-[320px] -translate-y-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white py-1 pl-3 pr-1 shadow-[0_6px_20px_rgba(15,23,42,0.10)]"
          style={{ top: hovered * pitch + pitch / 2 - railScroll }}
        >
          <button
            type="button"
            onClick={() => jump(hovered)}
            className="min-w-0 flex-1 truncate py-1 text-left text-[13px] text-slate-700 hover:text-slate-900"
          >
            {firstLine(preview.text)}
          </button>
          <button
            type="button"
            aria-label={previewMarked ? "取消标记" : "标记这一轮"}
            aria-pressed={previewMarked}
            onClick={() => toggleBookmark(preview.id)}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-slate-100",
              previewMarked ? "text-[#2773ff]" : "text-slate-400 hover:text-slate-600",
            )}
          >
            <Bookmark className={cn("h-4 w-4", previewMarked && "fill-current")} />
          </button>
        </div>
      ) : null}
    </nav>
  );
}
