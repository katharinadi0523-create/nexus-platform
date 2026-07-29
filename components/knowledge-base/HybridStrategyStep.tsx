"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronRight,
  Expand,
  Filter,
  HelpCircle,
  Merge,
  Pencil,
  Plus,
  Search,
  ArrowDownWideNarrow,
  Play,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MultiSelect } from "@/components/knowledge-base/MultiSelect";
import { cn } from "@/lib/utils";

export type BusinessNodeKind = "filter" | "retriever" | "merger" | "ranker";

export type GraphSearchStrategy = "BFS" | "DFS" | "Weighted";
export type GraphEntitySort =
  | "GraphDistance"
  | "PageRank"
  | "EmbeddingScore"
  | "Hybrid";
export type ChunkMergeStrategy =
  | "Union"
  | "Intersection"
  | "WeightedMerge"
  | "RRF"
  | "RSF";

/** 第二步自定义实体/关系，供图谱检索节点过滤多选 */
export interface GraphFilterOption {
  id: string;
  name: string;
}

export interface StrategyBusinessNode {
  id: string;
  kind: BusinessNodeKind;
  name: string;
  config: {
    filterMode?: string;
    exactMatch?: boolean;
    semanticMatch?: boolean;
    engine?: string;
    topK?: number;
    /** 图谱检索：最大跳数 1~10，默认 3 */
    maxHops?: number;
    /** 图谱检索：检索策略 */
    searchStrategy?: GraphSearchStrategy;
    /** 图谱检索：实体过滤（第二步自定义实体 id） */
    entityFilter?: string[];
    /** 图谱检索：关系过滤（第二步自定义关系 id） */
    relationFilter?: string[];
    /** 图谱检索：实体排序 */
    entitySort?: GraphEntitySort;
    /** 图谱检索：Score 阈值 0~1，默认 0.3，低于阈值的切片不会被选取 */
    score?: number;
    /** 内容合并器：合并策略 */
    mergeStrategy?: ChunkMergeStrategy;
    /** Weighted Merge 时 graph 权重 0~1，默认 0.7（vector 为 1-ratio） */
    weightedMergeGraphRatio?: number;
    rankModel?: string;
    rankTopK?: number;
  };
}

export const defaultGraphRetrieverConfig = {
  maxHops: 3,
  searchStrategy: "BFS" as GraphSearchStrategy,
  entityFilter: [] as string[],
  relationFilter: [] as string[],
  entitySort: "Hybrid" as GraphEntitySort,
  score: 0.3,
};

export const defaultMergerConfig = {
  mergeStrategy: "RRF" as ChunkMergeStrategy,
  weightedMergeGraphRatio: 0.7,
};

/** 流水线中的一层：同层多个节点为并列关系 */
export interface PipelineStage {
  id: string;
  nodes: StrategyBusinessNode[];
}

export interface RetrievalStrategy {
  id: string;
  name: string;
  collapsed: boolean;
  stages: PipelineStage[];
  selectedNodeId: string | null;
}

const NODE_META: Record<
  BusinessNodeKind,
  {
    label: string;
    description: string;
    color: string;
    bg: string;
    border: string;
    Icon: typeof Filter;
  }
> = {
  filter: {
    label: "文档过滤器",
    description: "用于文档级别的粗筛选",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    Icon: Filter,
  },
  retriever: {
    label: "内容检索器",
    description: "用于召回相关内容片段",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    Icon: Search,
  },
  merger: {
    label: "内容合并器",
    description: "将多个切片按策略合并",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    Icon: Merge,
  },
  ranker: {
    label: "内容排序器",
    description: "用于对召回结果重排序",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    Icon: ArrowDownWideNarrow,
  },
};

const LINE = "bg-[#2773ff]";
const EDGE_HEIGHT = 52;
const BRANCH_STEM = 20;

function createDefaultStrategy(index: number): RetrievalStrategy {
  return {
    id: `strategy-${Date.now()}-${index}`,
    name: `检索策略_${index}`,
    collapsed: false,
    stages: [],
    selectedNodeId: null,
  };
}

export const defaultHybridStrategies: RetrievalStrategy[] = [
  createDefaultStrategy(1),
];

function flattenNodes(stages: PipelineStage[]): StrategyBusinessNode[] {
  return stages.flatMap((s) => s.nodes);
}

function nextNodeName(
  nodes: StrategyBusinessNode[],
  kind: BusinessNodeKind
): string {
  const base = NODE_META[kind].label;
  const same = nodes.filter((n) => n.kind === kind);
  if (same.length === 0) return base;
  return `${base}_${same.length}`;
}

function createBusinessNode(
  kind: BusinessNodeKind,
  nodes: StrategyBusinessNode[]
): StrategyBusinessNode {
  const base: StrategyBusinessNode = {
    id: `node-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    name: nextNodeName(nodes, kind),
    config: {},
  };

  if (kind === "filter") {
    base.config = {
      filterMode: "metadata",
      exactMatch: false,
      semanticMatch: false,
    };
  } else if (kind === "retriever") {
    base.config = {
      engine: "fulltext",
      topK: 10,
    };
  } else if (kind === "merger") {
    base.config = { ...defaultMergerConfig };
  } else {
    base.config = {
      rankModel: "bge-reranker-v2",
      rankTopK: 5,
    };
  }

  return base;
}

function createStage(nodes: StrategyBusinessNode[]): PipelineStage {
  return {
    id: `stage-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nodes,
  };
}

function findSelected(
  stages: PipelineStage[],
  selectedNodeId: string | null
): {
  stageIndex: number;
  nodeIndex: number;
  node: StrategyBusinessNode;
} | null {
  if (!selectedNodeId) return null;
  for (let si = 0; si < stages.length; si++) {
    const ni = stages[si].nodes.findIndex((n) => n.id === selectedNodeId);
    if (ni >= 0) {
      return { stageIndex: si, nodeIndex: ni, node: stages[si].nodes[ni] };
    }
  }
  return null;
}

function HelpTip({ content }: { content: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-help">
          <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 text-xs text-slate-600" side="top">
        {content}
      </PopoverContent>
    </Popover>
  );
}

/**
 * 固定定位菜单（Portal 到 body），避免：
 * 1) 画布 overflow/transform 裁切菜单
 * 2) 画布 pointer capture 吞掉 Radix Popover 的点击
 */
function AddNodeMenu({
  onAdd,
  trigger,
  placement = "bottom",
}: {
  onAdd: (kind: BusinessNodeKind) => void;
  trigger: ReactNode;
  placement?: "bottom" | "top" | "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    let top = rect.bottom + gap;
    let left = rect.left + rect.width / 2;

    if (placement === "top") {
      top = rect.top - gap;
      left = rect.left + rect.width / 2;
    } else if (placement === "left") {
      top = rect.top + rect.height / 2;
      left = rect.left - gap;
    } else if (placement === "right") {
      top = rect.top + rect.height / 2;
      left = rect.right + gap;
    }

    setPos({ top, left });
  }, [placement]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(updatePosition);
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    // 不在 capture 阶段拦截，避免抢在菜单按钮之前关闭
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [open]);

  const transform =
    placement === "top"
      ? "translate(-50%, -100%)"
      : placement === "left"
        ? "translate(-100%, -50%)"
        : placement === "right"
          ? "translateY(-50%)"
          : "translateX(-50%)";

  const menu =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={menuRef}
        className="w-64 rounded-md border border-slate-200 bg-white p-2 shadow-lg"
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          transform,
          zIndex: 9999,
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-2 px-2 text-xs text-slate-400">选择要添加的节点</p>
        {(Object.keys(NODE_META) as BusinessNodeKind[]).map((kind) => {
          const meta = NODE_META[kind];
          const Icon = meta.Icon;
          return (
            <button
              key={kind}
              type="button"
              className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left hover:bg-slate-50"
              onPointerDown={(e) => {
                // 用 pointerdown 保证在菜单失焦/关闭前就完成添加
                e.preventDefault();
                e.stopPropagation();
                onAdd(kind);
                setOpen(false);
              }}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 items-center justify-center rounded-md border",
                  meta.bg,
                  meta.border
                )}
              >
                <Icon className={cn("h-4 w-4", meta.color)} />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800">
                  {meta.label}
                </div>
                <div className="text-xs text-slate-400">{meta.description}</div>
              </div>
            </button>
          );
        })}
      </div>,
      document.body
    );

  return (
    <div
      ref={triggerRef}
      className={cn("relative inline-flex", open && "[&_button]:!opacity-100")}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        if (open) {
          setOpen(false);
        } else {
          updatePosition();
          setOpen(true);
        }
      }}
    >
      {trigger}
      {menu}
    </div>
  );
}

function EdgePlusButton({
  onAdd,
  title = "在此处插入节点（顺序）",
}: {
  onAdd: (kind: BusinessNodeKind) => void;
  title?: string;
}) {
  return (
    <AddNodeMenu
      onAdd={onAdd}
      placement="right"
      trigger={
        <button
          type="button"
          title={title}
          className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border border-[#2773ff] bg-white text-[#2773ff] opacity-0 shadow-sm transition-all group-hover/edge:opacity-100 hover:!opacity-100 hover:bg-[#2773ff] hover:text-white focus-visible:!opacity-100"
        >
          <Plus className="h-3 w-3" />
        </button>
      }
    />
  );
}

/** 阶段之间的竖直连线（完整不断开），hover 显示顺序插入加号 */
function SequentialEdge({
  onInsert,
}: {
  onInsert: (kind: BusinessNodeKind) => void;
}) {
  return (
    <div
      className="group/edge relative flex w-full shrink-0 items-center justify-center"
      style={{ height: EDGE_HEIGHT }}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2",
          LINE
        )}
      />
      <EdgePlusButton onAdd={onInsert} />
    </div>
  );
}

function EmptyCanvasGuide({
  onAdd,
}: {
  onAdd: (kind: BusinessNodeKind) => void;
}) {
  return (
    <div className="flex h-full min-h-[360px] flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="mb-3 text-sm font-semibold text-slate-800">使用说明</h4>
        <ol className="mb-4 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-slate-500">
          <li>在开始和结束节点之间添加节点，点击节点可进行节点配置</li>
          <li>
            悬停连线加号可按流水线顺序插入；选中节点后左右加号可添加并列节点
          </li>
          <li>
            建议按照【文档过滤 -&gt; 内容检索 -&gt; 内容合并 -&gt; 内容排序】的顺序编排检索策略
          </li>
        </ol>
        <div className="mb-1 flex items-center justify-center gap-2">
          {(
            [
              ["filter", "文档过滤器"],
              ["retriever", "内容检索器"],
              ["merger", "内容合并器"],
              ["ranker", "内容排序器"],
            ] as const
          ).map(([kind, label], index) => {
            const meta = NODE_META[kind];
            const Icon = meta.Icon;
            return (
              <div key={kind} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs",
                    meta.bg,
                    meta.border,
                    meta.color
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </div>
                {index < 2 && (
                  <span className="text-[#2773ff]/60">→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AddNodeMenu
        onAdd={onAdd}
        trigger={
          <Button className="mt-5 bg-[#2773ff] text-white hover:bg-[#1f63e0]">
            <Plus className="mr-1.5 h-4 w-4" />
            添加节点
          </Button>
        }
      />
    </div>
  );
}

function TerminalNode({ kind }: { kind: "start" | "end" }) {
  const isStart = kind === "start";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
        {isStart ? (
          <Play className="h-4 w-4 fill-emerald-500 text-emerald-500" />
        ) : (
          <Square className="h-3.5 w-3.5 fill-red-500 text-red-500" />
        )}
      </div>
      <span className="text-xs text-slate-500">{isStart ? "开始" : "结束"}</span>
    </div>
  );
}

function BusinessNodeCard({
  node,
  selected,
  onSelect,
  onAddParallel,
}: {
  node: StrategyBusinessNode;
  selected: boolean;
  onSelect: () => void;
  onAddParallel: (kind: BusinessNodeKind, side: "left" | "right") => void;
}) {
  const meta = NODE_META[node.kind];
  const Icon = meta.Icon;

  return (
    <div className="relative flex items-center">
      {selected && (
        <div className="absolute right-full mr-2 flex items-center">
          <AddNodeMenu
            placement="left"
            onAdd={(kind) => onAddParallel(kind, "left")}
            trigger={
              <button
                type="button"
                title="添加并列节点"
                className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2773ff] bg-white text-[#2773ff] shadow-sm hover:bg-[#2773ff] hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            }
          />
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          "flex min-w-[140px] items-center gap-2 rounded-lg border bg-white px-3 py-2.5 text-left shadow-sm transition-all",
          selected
            ? "border-[#2773ff] ring-2 ring-[#2773ff]/20"
            : "border-slate-200 hover:border-slate-300"
        )}
      >
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
            meta.bg,
            meta.border
          )}
        >
          <Icon className={cn("h-4 w-4", meta.color)} />
        </div>
        <span className="text-sm font-medium text-slate-800">{node.name}</span>
      </button>

      {selected && (
        <div className="absolute left-full ml-2 flex items-center">
          <AddNodeMenu
            placement="right"
            onAdd={(kind) => onAddParallel(kind, "right")}
            trigger={
              <button
                type="button"
                title="添加并列节点"
                className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2773ff] bg-white text-[#2773ff] shadow-sm hover:bg-[#2773ff] hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}

/** 单层阶段：单节点直连；多节点为完整分叉/汇合连线 */
function StageBlock({
  stage,
  selectedNodeId,
  onSelect,
  onAddParallel,
}: {
  stage: PipelineStage;
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
  onAddParallel: (
    nodeId: string,
    kind: BusinessNodeKind,
    side: "left" | "right"
  ) => void;
}) {
  const count = stage.nodes.length;

  if (count === 1) {
    const node = stage.nodes[0];
    return (
      <div className="relative z-[1] flex justify-center">
        <BusinessNodeCard
          node={node}
          selected={selectedNodeId === node.id}
          onSelect={() => onSelect(node.id)}
          onAddParallel={(kind, side) => onAddParallel(node.id, kind, side)}
        />
      </div>
    );
  }

  // 横梁只覆盖首尾节点中心：间距 = 节点宽 140 + gap 24
  const barWidth = (count - 1) * 164;

  return (
    <div className="relative z-[1] flex w-full flex-col items-center">
      {/* 分叉：中心竖线接到横梁，再落到各节点 */}
      <div
        className="relative flex w-full justify-center"
        style={{ height: BRANCH_STEM }}
      >
        <div
          className={cn(
            "absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2",
            LINE
          )}
        />
        <div
          className={cn("absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2", LINE)}
          style={{ width: barWidth }}
        />
      </div>

      <div className="flex items-stretch justify-center gap-6">
        {stage.nodes.map((node) => (
          <div key={node.id} className="flex w-[140px] flex-col items-center">
            <div
              className={cn("w-0.5 shrink-0", LINE)}
              style={{ height: BRANCH_STEM }}
            />
            <BusinessNodeCard
              node={node}
              selected={selectedNodeId === node.id}
              onSelect={() => onSelect(node.id)}
              onAddParallel={(kind, side) =>
                onAddParallel(node.id, kind, side)
              }
            />
            <div
              className={cn("w-0.5 shrink-0", LINE)}
              style={{ height: BRANCH_STEM }}
            />
          </div>
        ))}
      </div>

      {/* 汇合：各节点竖线接到横梁，再回中心 */}
      <div
        className="relative flex w-full justify-center"
        style={{ height: BRANCH_STEM }}
      >
        <div
          className={cn("absolute left-1/2 top-0 h-0.5 -translate-x-1/2", LINE)}
          style={{ width: barWidth }}
        />
        <div
          className={cn(
            "absolute bottom-0 left-1/2 h-full w-0.5 -translate-x-1/2",
            LINE
          )}
        />
      </div>
    </div>
  );
}

function StrategyPipelineCanvas({
  strategy,
  onChange,
  graphEntityOptions = [],
  graphRelationOptions = [],
}: {
  strategy: RetrievalStrategy;
  onChange: (next: RetrievalStrategy) => void;
  graphEntityOptions?: GraphFilterOption[];
  graphRelationOptions?: GraphFilterOption[];
}) {
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  const strategyRef = useRef(strategy);
  useEffect(() => {
    strategyRef.current = strategy;
  }, [strategy]);

  const selected = findSelected(strategy.stages, strategy.selectedNodeId);

  const insertSequential = useCallback(
    (atIndex: number, kind: BusinessNodeKind) => {
      const current = strategyRef.current;
      const node = createBusinessNode(kind, flattenNodes(current.stages));
      const stage = createStage([node]);
      const stages = [...current.stages];
      stages.splice(atIndex, 0, stage);
      onChange({
        ...current,
        stages,
        selectedNodeId: node.id,
      });
    },
    [onChange]
  );

  const appendNode = useCallback(
    (kind: BusinessNodeKind) => {
      insertSequential(strategyRef.current.stages.length, kind);
    },
    [insertSequential]
  );

  const addParallel = useCallback(
    (nodeId: string, kind: BusinessNodeKind, side: "left" | "right") => {
      const current = strategyRef.current;
      const found = findSelected(current.stages, nodeId);
      if (!found) return;
      const node = createBusinessNode(kind, flattenNodes(current.stages));
      const stages = current.stages.map((stage, si) => {
        if (si !== found.stageIndex) return stage;
        const nodes = [...stage.nodes];
        const insertAt =
          side === "left" ? found.nodeIndex : found.nodeIndex + 1;
        nodes.splice(insertAt, 0, node);
        return { ...stage, nodes };
      });
      onChange({
        ...current,
        stages,
        selectedNodeId: node.id,
      });
    },
    [onChange]
  );

  const updateSelectedConfig = (
    patch: Partial<StrategyBusinessNode["config"]>
  ) => {
    const current = strategyRef.current;
    const sel = findSelected(current.stages, current.selectedNodeId);
    if (!sel) return;
    onChange({
      ...current,
      stages: current.stages.map((stage, si) =>
        si !== sel.stageIndex
          ? stage
          : {
              ...stage,
              nodes: stage.nodes.map((n, ni) =>
                ni !== sel.nodeIndex
                  ? n
                  : { ...n, config: { ...n.config, ...patch } }
              ),
            }
      ),
    });
  };

  const deleteSelected = () => {
    const current = strategyRef.current;
    const sel = findSelected(current.stages, current.selectedNodeId);
    if (!sel) return;
    const stages = current.stages
      .map((stage, si) => {
        if (si !== sel.stageIndex) return stage;
        return {
          ...stage,
          nodes: stage.nodes.filter((n) => n.id !== sel.node.id),
        };
      })
      .filter((stage) => stage.nodes.length > 0);
    onChange({
      ...current,
      stages,
      selectedNodeId: null,
    });
    toast.success("节点已删除");
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, input, [data-radix-popper-content-wrapper]")) {
      return;
    }
    draggingRef.current = true;
    setIsPanning(true);
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    setIsPanning(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    setZoom((z) => Math.min(200, Math.max(40, z + delta)));
  };

  if (strategy.stages.length === 0) {
    return <EmptyCanvasGuide onAdd={appendNode} />;
  }

  return (
    <div className="relative flex h-[420px] overflow-hidden">
      <div
        className={cn(
          "relative min-w-0 flex-1 overflow-hidden",
          isPanning ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{
          backgroundImage:
            "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          backgroundColor: "#f8fafc",
        }}
        onClick={() =>
          onChange({ ...strategyRef.current, selectedNodeId: null })
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        {/* Toolbar */}
        <div
          className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 shadow-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
            onClick={() => setZoom((z) => Math.max(40, z - 10))}
          >
            -
          </button>
          <span className="min-w-10 text-center text-xs text-slate-500">
            {zoom}%
          </span>
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
          >
            +
          </button>
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-50"
            title="重置视图"
            onClick={() => {
              setZoom(100);
              setPan({ x: 0, y: 0 });
            }}
          >
            重置
          </button>
          <div className="mx-1 h-3 w-px bg-slate-200" />
          <AddNodeMenu
            onAdd={appendNode}
            trigger={
              <button
                type="button"
                className="rounded p-1 text-slate-500 hover:bg-slate-50 hover:text-[#2773ff]"
                title="在末尾添加节点"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            }
          />
        </div>

        <div
          className="flex min-h-full w-full origin-center flex-col items-center justify-center px-16 py-16"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
          }}
        >
          <TerminalNode kind="start" />

          {/* Start → first stage */}
          <SequentialEdge onInsert={(kind) => insertSequential(0, kind)} />

          {strategy.stages.map((stage, index) => (
            <div key={stage.id} className="flex w-full flex-col items-center">
              <StageBlock
                stage={stage}
                selectedNodeId={strategy.selectedNodeId}
                onSelect={(nodeId) =>
                  onChange({ ...strategy, selectedNodeId: nodeId })
                }
                onAddParallel={addParallel}
              />
              {/* stage → next stage / End */}
              <SequentialEdge
                onInsert={(kind) => insertSequential(index + 1, kind)}
              />
            </div>
          ))}

          <TerminalNode kind="end" />
        </div>
      </div>

      {selected && (
        <aside
          className={cn(
            "flex shrink-0 flex-col border-l border-slate-200 bg-white",
            selected.node.kind === "retriever" &&
              selected.node.config.engine === "graph"
              ? "w-[320px]"
              : "w-[280px]"
          )}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-start gap-2">
              {(() => {
                const meta = NODE_META[selected.node.kind];
                const Icon = meta.Icon;
                return (
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 items-center justify-center rounded-md border",
                      meta.bg,
                      meta.border
                    )}
                  >
                    <Icon className={cn("h-4 w-4", meta.color)} />
                  </div>
                );
              })()}
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {selected.node.name}
                </div>
                <div className="text-xs text-slate-400">
                  {NODE_META[selected.node.kind].description}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              onClick={() =>
                onChange({ ...strategy, selectedNodeId: null })
              }
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {selected.node.kind === "filter" && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-700">过滤模式</Label>
                  <Select
                    value={selected.node.config.filterMode || "metadata"}
                    onValueChange={(filterMode) =>
                      updateSelectedConfig({ filterMode })
                    }
                    options={[
                      { value: "metadata", label: "元数据过滤" },
                      { value: "tag", label: "标签过滤" },
                      { value: "rule", label: "规则过滤" },
                    ]}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm text-slate-700">精准匹配</Label>
                    <HelpTip content="开启后按元数据字段进行精确匹配过滤。" />
                  </div>
                  <Switch
                    checked={Boolean(selected.node.config.exactMatch)}
                    onCheckedChange={(exactMatch) =>
                      updateSelectedConfig({ exactMatch })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm text-slate-700">语义匹配</Label>
                    <HelpTip content="开启后使用语义相似度进行文档粗筛。" />
                  </div>
                  <Switch
                    checked={Boolean(selected.node.config.semanticMatch)}
                    onCheckedChange={(semanticMatch) =>
                      updateSelectedConfig({ semanticMatch })
                    }
                  />
                </div>
              </>
            )}

            {selected.node.kind === "retriever" && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-700">检索引擎</Label>
                  <Select
                    value={selected.node.config.engine || "fulltext"}
                    onValueChange={(engine) => {
                      if (engine === "graph") {
                        updateSelectedConfig({
                          engine,
                          maxHops:
                            selected.node.config.maxHops ??
                            defaultGraphRetrieverConfig.maxHops,
                          searchStrategy:
                            selected.node.config.searchStrategy ??
                            defaultGraphRetrieverConfig.searchStrategy,
                          entityFilter:
                            selected.node.config.entityFilter ??
                            defaultGraphRetrieverConfig.entityFilter,
                          relationFilter:
                            selected.node.config.relationFilter ??
                            defaultGraphRetrieverConfig.relationFilter,
                          entitySort:
                            selected.node.config.entitySort ??
                            defaultGraphRetrieverConfig.entitySort,
                          score:
                            selected.node.config.score ??
                            defaultGraphRetrieverConfig.score,
                        });
                        return;
                      }
                      updateSelectedConfig({ engine });
                    }}
                    options={[
                      { value: "fulltext", label: "全文检索" },
                      { value: "semantic", label: "语义检索" },
                      { value: "pageindex", label: "PageIndex 检索" },
                      { value: "graph", label: "图谱检索" },
                    ]}
                  />
                </div>

                {(selected.node.config.engine || "fulltext") === "graph" && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label className="text-sm text-slate-700">最大跳数</Label>
                        <HelpTip content="最大可根据图谱多跳查询的步数，范围 1~10。" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[selected.node.config.maxHops ?? 3]}
                          min={1}
                          max={10}
                          step={1}
                          onValueChange={(vals) =>
                            updateSelectedConfig({
                              maxHops: vals[0] ?? 3,
                            })
                          }
                          className="flex-1 [&_[data-slot=slider-range]]:bg-[#2773ff] [&_[data-slot=slider-thumb]]:border-[#2773ff]"
                        />
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          className="h-8 w-14"
                          value={selected.node.config.maxHops ?? 3}
                          onChange={(e) => {
                            const raw = Number(e.target.value);
                            if (Number.isNaN(raw)) return;
                            updateSelectedConfig({
                              maxHops: Math.min(10, Math.max(1, raw)),
                            });
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label className="text-sm text-slate-700">检索策略</Label>
                        <HelpTip content="图谱遍历策略：BFS、DFS 或 Weighted。" />
                      </div>
                      <Select
                        value={selected.node.config.searchStrategy || "BFS"}
                        onValueChange={(searchStrategy) =>
                          updateSelectedConfig({
                            searchStrategy:
                              searchStrategy as GraphSearchStrategy,
                          })
                        }
                        options={[
                          { value: "BFS", label: "BFS" },
                          { value: "DFS", label: "DFS" },
                          { value: "Weighted", label: "Weighted" },
                        ]}
                      />
                    </div>

                    {graphEntityOptions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label className="text-sm text-slate-700">
                            实体过滤
                          </Label>
                          <HelpTip content="依据第二步自定义实体进行多选过滤。" />
                        </div>
                        <MultiSelect
                          value={
                            selected.node.config.entityFilter?.filter((id) =>
                              graphEntityOptions.some((o) => o.id === id)
                            ) ?? []
                          }
                          onChange={(entityFilter) =>
                            updateSelectedConfig({ entityFilter })
                          }
                          options={graphEntityOptions.map((item) => ({
                            value: item.id,
                            label: item.name,
                          }))}
                          placeholder="请选择实体"
                        />
                      </div>
                    )}

                    {graphRelationOptions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label className="text-sm text-slate-700">
                            关系过滤
                          </Label>
                          <HelpTip content="依据第二步自定义关系进行多选过滤。" />
                        </div>
                        <MultiSelect
                          value={
                            selected.node.config.relationFilter?.filter((id) =>
                              graphRelationOptions.some((o) => o.id === id)
                            ) ?? []
                          }
                          onChange={(relationFilter) =>
                            updateSelectedConfig({ relationFilter })
                          }
                          options={graphRelationOptions.map((item) => ({
                            value: item.id,
                            label: item.name,
                          }))}
                          placeholder="请选择关系"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label className="text-sm text-slate-700">实体排序</Label>
                        <HelpTip content="对图谱召回实体的排序方式。" />
                      </div>
                      <Select
                        value={selected.node.config.entitySort || "Hybrid"}
                        onValueChange={(entitySort) =>
                          updateSelectedConfig({
                            entitySort: entitySort as GraphEntitySort,
                          })
                        }
                        options={[
                          {
                            value: "GraphDistance",
                            label: "Graph Distance",
                          },
                          { value: "PageRank", label: "PageRank" },
                          {
                            value: "EmbeddingScore",
                            label: "Embedding Score",
                          },
                          { value: "Hybrid", label: "Hybrid" },
                        ]}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label className="text-sm text-slate-700">
                    {(selected.node.config.engine || "fulltext") === "graph"
                      ? "Top K"
                      : "召回数量 TopK"}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={selected.node.config.topK ?? 10}
                    onChange={(e) =>
                      updateSelectedConfig({
                        topK: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                {(selected.node.config.engine || "fulltext") === "graph" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label className="text-sm text-slate-700">Score</Label>
                      <HelpTip content="低于阈值的切片将不会被选取，范围 0~1.0，步长 0.1。" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[selected.node.config.score ?? 0.3]}
                        min={0}
                        max={1}
                        step={0.1}
                        onValueChange={(vals) =>
                          updateSelectedConfig({
                            score: vals[0] ?? 0.3,
                          })
                        }
                        className="flex-1 [&_[data-slot=slider-range]]:bg-[#2773ff] [&_[data-slot=slider-thumb]]:border-[#2773ff]"
                      />
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        className="h-8 w-14"
                        value={selected.node.config.score ?? 0.3}
                        onChange={(e) => {
                          const raw = Number(e.target.value);
                          if (Number.isNaN(raw)) return;
                          const clamped = Math.min(1, Math.max(0, raw));
                          updateSelectedConfig({
                            score: Math.round(clamped * 10) / 10,
                          });
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {selected.node.kind === "merger" && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm text-slate-700">合并策略</Label>
                    <HelpTip content="将多个切片按照策略进行合并。" />
                  </div>
                  <Select
                    value={selected.node.config.mergeStrategy || "RRF"}
                    onValueChange={(mergeStrategy) =>
                      updateSelectedConfig({
                        mergeStrategy: mergeStrategy as ChunkMergeStrategy,
                        weightedMergeGraphRatio:
                          selected.node.config.weightedMergeGraphRatio ??
                          defaultMergerConfig.weightedMergeGraphRatio,
                      })
                    }
                    options={[
                      { value: "Union", label: "Union" },
                      { value: "Intersection", label: "Intersection" },
                      { value: "WeightedMerge", label: "Weighted Merge" },
                      { value: "RRF", label: "RRF" },
                      { value: "RSF", label: "RSF" },
                    ]}
                  />
                </div>

                {(selected.node.config.mergeStrategy || "RRF") ===
                  "WeightedMerge" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label className="text-sm text-slate-700">
                        Merge 比例
                      </Label>
                      <HelpTip content="Weighted Merge 中 vector 与 graph 的权重比例。" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          vector{" "}
                          {Math.round(
                            (1 -
                              (selected.node.config.weightedMergeGraphRatio ??
                                0.7)) *
                              100
                          )}
                          %
                        </span>
                        <span>
                          graph{" "}
                          {Math.round(
                            (selected.node.config.weightedMergeGraphRatio ??
                              0.7) * 100
                          )}
                          %
                        </span>
                      </div>
                      <Slider
                        value={[
                          Math.round(
                            (selected.node.config.weightedMergeGraphRatio ??
                              0.7) * 100
                          ),
                        ]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(vals) =>
                          updateSelectedConfig({
                            weightedMergeGraphRatio: (vals[0] ?? 70) / 100,
                          })
                        }
                        className="[&_[data-slot=slider-range]]:bg-[#2773ff] [&_[data-slot=slider-thumb]]:border-[#2773ff]"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>vector</span>
                        <span>graph</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {selected.node.kind === "ranker" && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-700">排序模型</Label>
                  <Select
                    value={selected.node.config.rankModel || "bge-reranker-v2"}
                    onValueChange={(rankModel) =>
                      updateSelectedConfig({ rankModel })
                    }
                    options={[
                      { value: "bge-reranker-v2", label: "bge-reranker-v2" },
                      {
                        value: "bge-reranker-base",
                        label: "bge-reranker-base",
                      },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-700">输出数量 TopK</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={selected.node.config.rankTopK ?? 5}
                    onChange={(e) =>
                      updateSelectedConfig({
                        rankTopK: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </>
            )}

            <Button
              variant="outline"
              className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={deleteSelected}
            >
              删除节点
            </Button>
          </div>
        </aside>
      )}
    </div>
  );
}

interface HybridStrategyStepProps {
  value: RetrievalStrategy[];
  onChange: (value: RetrievalStrategy[]) => void;
  /** 第二步自定义实体（有名称的项），用于图谱检索实体过滤 */
  graphEntityOptions?: GraphFilterOption[];
  /** 第二步自定义关系（有名称的项），用于图谱检索关系过滤 */
  graphRelationOptions?: GraphFilterOption[];
}

export function HybridStrategyStep({
  value,
  onChange,
  graphEntityOptions = [],
  graphRelationOptions = [],
}: HybridStrategyStepProps) {
  const configuredCount = useMemo(
    () => value.filter((s) => s.stages.length > 0).length,
    [value]
  );

  const updateStrategy = (id: string, next: RetrievalStrategy) => {
    onChange(value.map((s) => (s.id === id ? next : s)));
  };

  const createStrategy = () => {
    const index = value.length + 1;
    onChange([...value, createDefaultStrategy(index)]);
    toast.success(`已创建检索策略_${index}`);
  };

  const renameStrategy = (id: string, name: string) => {
    onChange(value.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const deleteStrategy = (id: string) => {
    if (value.length <= 1) {
      toast.error("至少保留一个检索策略");
      return;
    }
    onChange(value.filter((s) => s.id !== id));
    toast.success("检索策略已删除");
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          检索策略（{value.length}）
          <span className="ml-2 text-xs font-normal text-slate-400">
            已配置 {configuredCount} 个
          </span>
        </h2>
        <Button variant="outline" onClick={createStrategy}>
          <Plus className="mr-1.5 h-4 w-4" />
          创建检索策略
        </Button>
      </div>

      <div className="space-y-4">
        {value.map((strategy) => (
          <div
            key={strategy.id}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  onClick={() =>
                    updateStrategy(strategy.id, {
                      ...strategy,
                      collapsed: !strategy.collapsed,
                    })
                  }
                >
                  {strategy.collapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                <input
                  value={strategy.name}
                  onChange={(e) =>
                    renameStrategy(strategy.id, e.target.value)
                  }
                  className="w-40 border-b border-transparent bg-transparent text-sm font-medium text-slate-800 outline-none focus:border-slate-300"
                />
                <Pencil className="h-3.5 w-3.5 text-slate-300" />
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-xs",
                    strategy.stages.length > 0
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-orange-50 text-orange-500"
                  )}
                >
                  {strategy.stages.length > 0 ? "已配置" : "待配置"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  title="全屏"
                  onClick={() => toast.message("全屏预览开发中")}
                >
                  <Expand className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  title="删除"
                  onClick={() => deleteStrategy(strategy.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!strategy.collapsed && (
              <StrategyPipelineCanvas
                strategy={strategy}
                onChange={(next) => updateStrategy(strategy.id, next)}
                graphEntityOptions={graphEntityOptions}
                graphRelationOptions={graphRelationOptions}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
