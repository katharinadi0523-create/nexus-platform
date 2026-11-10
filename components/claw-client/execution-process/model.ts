/**
 * 执行过程（事件链）展示：数据模型与前端投影。
 *
 * RawItem 是后端按时间顺序推来的原始事件；projectTurn 把它投影成
 * Status Line / Narration / Segment（Segment Header + Event）/ Delivery。
 * 实时运行和历史回放共用同一个投影函数。
 */

import type { AutomationTask } from "@/lib/mock/my-claw/automation";

export type EventCategory =
  | "skill"
  | "read"
  | "list"
  | "run"
  | "progress"
  | "env"
  | "automation"
  | "stop"
  | "write"
  | "edit"
  | "search"
  | "web"
  | "browser"
  | "memory"
  | "history"
  | "deliver"
  | "other";

/** Segment Header 计数单位：按类别聚合。 */
const CATEGORY_UNIT: Record<EventCategory, (count: number) => string> = {
  skill: (n) => `使用 ${n} 个技能`,
  read: (n) => `读取 ${n} 个文件`,
  list: (n) => `查看 ${n} 个文件夹`,
  run: (n) => `执行 ${n} 次命令`,
  progress: (n) => `查看进度 ${n} 次`,
  env: () => "",
  automation: (n) => `定时任务操作 ${n} 次`,
  stop: (n) => `停止 ${n} 个命令`,
  write: (n) => `写入 ${n} 个文件`,
  edit: (n) => `修改 ${n} 个文件`,
  search: (n) => `搜索 ${n} 次`,
  web: (n) => `查看 ${n} 个网页`,
  browser: (n) => `网页操作 ${n} 次`,
  memory: (n) => `记住 ${n} 条偏好`,
  history: (n) => `回顾之前的对话 ${n} 次`,
  deliver: (n) => `交付 ${n} 次`,
  other: (n) => `使用 ${n} 个工具`,
};

/** 展开 Event 后看到的原样输入输出，没有 JSON 外壳。 */
export type EventDetail =
  | { type: "command"; command: string; output: string; exitCode?: number }
  | { type: "file"; path: string; content: string }
  | { type: "search"; query: string; results: string[] }
  | { type: "raw"; input?: string; output: string };

export interface DeliveryCard {
  type: "file" | "result" | "automation";
  title: string;
  meta?: string;
  /** 定时任务卡片：点“查看”时打开的任务。 */
  task?: AutomationTask;
}

export type RawItem =
  | { kind: "thinking"; id: string; seconds: number; text: string; at?: number; note?: string }
  | { kind: "narration"; id: string; text: string; at?: number; note?: string }
  | {
      kind: "event";
      id: string;
      tool: string;
      category: EventCategory;
      name: string;
      runningName: string;
      ok: boolean;
      detail?: EventDetail;
      /** 写入类：可预览的文件，写入完成前不可点击。 */
      preview?: { file: string; content: string };
      at?: number;
      note?: string;
    }
  /** 不显示：前端不展示。 */
  | { kind: "hidden"; id: string; tool: string; detail?: EventDetail }
  | {
      kind: "clarify";
      id: string;
      question: string;
      options: Array<{ value: string; label: string }>;
      answer?: string;
      at?: number;
      note?: string;
    }
  /** 历史会话里已有的卡片（确认、子智能体等），原样渲染，同样切段。 */
  | { kind: "card"; id: string; render: () => React.ReactNode; tool?: string }
  | {
      kind: "delivery";
      id: string;
      tool: string;
      ok: boolean;
      card: DeliveryCard;
      /** 运行中状态行文字；文件类默认“正在准备文件”。 */
      runningName?: string;
      /** 交付失败时在过程区作为一个 Event 打 ✕。 */
      failName?: string;
      /** 有值时，成功后除了 Delivery 卡片，过程区也留一行 Event（如定时任务）。 */
      eventName?: string;
      category?: EventCategory;
      detail?: EventDetail;
      at?: number;
      note?: string;
    }
  | { kind: "answer"; id: string; text: string; at?: number; note?: string }
  | { kind: "interrupt"; id: string; message: string; at?: number; note?: string };

export type TurnState = "running" | "waiting" | "done" | "interrupted" | "stopped";

export interface ProjectedEvent {
  key: string;
  name: string;
  runningName: string;
  ok: boolean;
  running: boolean;
  category: EventCategory;
  details: Array<{ tool: string; detail?: EventDetail }>;
  preview?: { file: string; content: string };
}

export type ThinkingBlock = { type: "thinking"; key: string; seconds: number; text: string; running: boolean };

/** Segment 展开后的一行：Event，或段内的思考（不计入 Header）。 */
export type SegmentRow = { type: "event"; event: ProjectedEvent } | ThinkingBlock;

export type ProcessBlock =
  | ThinkingBlock
  | { type: "narration"; key: string; text: string }
  | {
      type: "segment";
      key: string;
      events: ProjectedEvent[];
      rows: SegmentRow[];
      running: boolean;
      header: string;
      icon: "ok" | "fail" | "running";
      /** 段内最后一个结果是否成功（成功的交付也算）。 */
      tailOk: boolean;
    }
  | { type: "clarify"; key: string; item: Extract<RawItem, { kind: "clarify" }> }
  | { type: "card"; key: string; item: Extract<RawItem, { kind: "card" }> };

export interface ProjectedTurn {
  blocks: ProcessBlock[];
  answer?: string;
  deliveries: DeliveryCard[];
  interrupt?: string;
  /** 运行中状态行的文字。 */
  current: string | null;
}

export const THINKING_MIN_SECONDS = 5;

/** Header 只数 Event，段内思考不计入。 */
function segmentHeader(events: ProjectedEvent[], running: boolean): string {
  if (running) {
    const last = events[events.length - 1];
    if (!last || !last.running) return "正在思考";
    return last.runningName;
  }
  // 准备运行环境是平台动作，不计入；段里只有它时直接写它的名字。
  const counted = events.filter((event) => event.category !== "env");
  if (counted.length === 0) return events[events.length - 1]?.name ?? "";
  if (counted.length === 1) return counted[0].name;
  const order: EventCategory[] = [];
  const counts = new Map<EventCategory, number>();
  for (const event of counted) {
    if (!counts.has(event.category)) order.push(event.category);
    counts.set(event.category, (counts.get(event.category) ?? 0) + 1);
  }
  const parts = order.slice(0, 3).map((category) => CATEGORY_UNIT[category](counts.get(category)!));
  return parts.join(" · ");
}

/**
 * 投影：①查表（Event 自带名字与类别）②藏机制（hidden）③切段（Narration、卡片）④出显示。
 * `runningId` 是正在进行的那一项；为 null 时整轮视为没有进行中的项。
 */
export function projectTurn(items: RawItem[], runningId: string | null): ProjectedTurn {
  const blocks: ProcessBlock[] = [];
  const deliveries: DeliveryCard[] = [];
  let answer: string | undefined;
  let interrupt: string | undefined;
  let current: string | null = null;

  type SegmentBlock = Extract<ProcessBlock, { type: "segment" }>;
  let segment = null as SegmentBlock | null;
  let pendingThinking: Array<Extract<RawItem, { kind: "thinking" }>> = [];

  const flushOrphanThinking = () => {
    // 没有 Segment 归属的思考（开头、两次 Narration 之间没有工具）单独放一行。
    for (const thinking of pendingThinking) {
      const running = thinking.id === runningId;
      if (running || thinking.seconds >= THINKING_MIN_SECONDS) {
        blocks.push({ type: "thinking", key: thinking.id, seconds: thinking.seconds, text: thinking.text, running });
      }
    }
    pendingThinking = [];
  };

  // 段内思考：不计入 Header；超过阈值的在展开后单独一行，可看全文。
  const addThinking = (target: SegmentBlock, thinking: Extract<RawItem, { kind: "thinking" }>) => {
    const running = thinking.id === runningId;
    if (running) target.running = true;
    if (running || thinking.seconds >= THINKING_MIN_SECONDS) {
      target.rows.push({ type: "thinking", key: thinking.id, seconds: thinking.seconds, text: thinking.text, running });
    }
  };

  const cut = () => {
    // Header 文字在最后统一计算。
    if (segment) segment = null;
    else flushOrphanThinking();
  };

  const openSegment = (key: string): SegmentBlock => {
    // 开头的思考（这一轮还什么都没显示）不归入 Segment，单独一行。
    if (!segment && blocks.length === 0) flushOrphanThinking();
    const target: SegmentBlock = segment ?? { type: "segment", key, events: [], rows: [], running: false, header: "", icon: "ok", tailOk: true };
    if (!segment) {
      segment = target;
      blocks.push(target);
    }
    for (const thinking of pendingThinking) addThinking(target, thinking);
    pendingThinking = [];
    return target;
  };

  const pushEvent = (target: SegmentBlock, event: ProjectedEvent) => {
    target.events.push(event);
    target.rows.push({ type: "event", event });
  };

  for (const item of items) {
    const running = item.id === runningId;
    switch (item.kind) {
      case "thinking": {
        if (segment) {
          addThinking(segment, item);
        } else {
          pendingThinking.push(item);
        }
        if (running) current = "正在思考";
        break;
      }
      case "narration":
        cut();
        blocks.push({ type: "narration", key: item.id, text: item.text });
        break;
      case "event": {
        const target = openSegment(item.id);
        const projected: ProjectedEvent = {
          key: item.id,
          name: item.name,
          runningName: item.runningName,
          ok: item.ok,
          running,
          category: item.category,
          details: [{ tool: item.tool, detail: item.detail }],
          preview: item.preview,
        };
        pushEvent(target, projected);
        target.tailOk = item.ok;
        if (running) {
          target.running = true;
          current = item.runningName;
        }
        break;
      }
      case "hidden":
        break;
      case "clarify":
        cut();
        blocks.push({ type: "clarify", key: item.id, item });
        break;
      case "card":
        cut();
        blocks.push({ type: "card", key: item.id, item });
        break;
      case "delivery": {
        if (running) current = item.runningName ?? "正在准备文件";
        if (item.ok && !running) {
          deliveries.push(item.card);
          if (item.eventName) {
            pushEvent(openSegment(item.id), {
              key: item.id,
              name: item.eventName,
              runningName: item.runningName ?? item.eventName,
              ok: true,
              running: false,
              category: item.category ?? "deliver",
              details: [{ tool: item.tool, detail: item.detail }],
            });
          }
          if (segment) segment.tailOk = true;
        } else {
          // 交付运行中：作为一个运行中的 Event 出现在 Segment 里，成功后移进 Delivery；失败时留下打 ✕。
          const target = openSegment(item.id);
          const projected: ProjectedEvent = {
            key: item.id,
            name: item.failName ?? item.card.title,
            runningName: item.runningName ?? "正在准备文件",
            ok: item.ok,
            running,
            category: item.category ?? "deliver",
            details: [{ tool: item.tool, detail: item.detail }],
          };
          pushEvent(target, projected);
          target.tailOk = item.ok;
          if (running) target.running = true;
        }
        break;
      }
      case "answer":
        cut();
        answer = item.text;
        break;
      case "interrupt":
        cut();
        interrupt = item.message;
        break;
    }
  }
  cut();
  for (const block of blocks) {
    if (block.type === "segment") {
      block.header = segmentHeader(block.events, block.running);
      block.icon = block.running ? "running" : block.tailOk ? "ok" : "fail";
    }
  }
  return { blocks, answer, deliveries, interrupt, current };
}

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatDuration(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m} 分 ${s % 60} 秒` : `${s} 秒`;
}
