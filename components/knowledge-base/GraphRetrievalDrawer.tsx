"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import ReactFlow, {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlowProvider,
  getStraightPath,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type EntityKind = "movie" | "actor";

interface EntityNodeData {
  label: string;
  kind: EntityKind;
  properties: Record<string, string>;
  selected?: boolean;
}

interface RelationEdgeData {
  label: string;
  properties: Record<string, string>;
}

type PanelSelection =
  | { type: "overview" }
  | { type: "node"; id: string }
  | { type: "edge"; id: string };

const MOVIE_COLOR = "#22c55e";
const ACTOR_COLOR = "#a855f7";
const NODE_SIZE = 64;

const centerHandleStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  right: "auto",
  bottom: "auto",
  width: 1,
  height: 1,
  minWidth: 1,
  minHeight: 1,
  opacity: 0,
  pointerEvents: "none",
  border: "none",
  background: "transparent",
  transform: "translate(-50%, -50%)",
};

function EntityNode({ data, selected }: NodeProps<EntityNodeData>) {
  const color = data.kind === "movie" ? MOVIE_COLOR : ACTOR_COLOR;
  const isSelected = Boolean(selected || data.selected);

  return (
    <div
      className="relative"
      style={{ width: NODE_SIZE, height: NODE_SIZE }}
    >
      <Handle
        id="center-source"
        type="source"
        position={Position.Top}
        style={centerHandleStyle}
        className="!left-1/2 !top-1/2 !right-auto !bottom-auto !h-px !w-px !translate-x-[-50%] !translate-y-[-50%] !border-0 !bg-transparent !opacity-0"
      />
      <Handle
        id="center-target"
        type="target"
        position={Position.Top}
        style={centerHandleStyle}
        className="!left-1/2 !top-1/2 !right-auto !bottom-auto !h-px !w-px !translate-x-[-50%] !translate-y-[-50%] !border-0 !bg-transparent !opacity-0"
      />
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full border-2 bg-white px-1 text-center shadow-sm transition-shadow",
          isSelected && "ring-2 ring-offset-2 shadow-md"
        )}
        style={{
          borderColor: color,
          ...(isSelected
            ? ({
                ["--tw-ring-color" as string]: color,
              } as CSSProperties)
            : null),
        }}
      >
        <span
          className="line-clamp-2 text-[11px] font-medium leading-tight"
          style={{ color }}
        >
          {data.label}
        </span>
      </div>
    </div>
  );
}

function CenterStraightEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={24}
        style={{
          stroke: selected ? "#2773ff" : "#94a3b8",
          strokeWidth: selected ? 2.5 : 1.5,
          ...style,
        }}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "nodrag nopan absolute rounded px-1.5 py-0.5 text-[11px] font-medium",
              selected ? "text-[#2773ff]" : "text-slate-500"
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: "rgba(248, 250, 252, 0.95)",
              borderRadius: labelBgBorderRadius ?? 4,
              padding: labelBgPadding
                ? `${labelBgPadding[0]}px ${labelBgPadding[1]}px`
                : "2px 6px",
              pointerEvents: "none",
              ...(labelStyle as CSSProperties),
              ...(labelBgStyle as CSSProperties),
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

const nodeTypes = {
  entity: EntityNode,
};

const edgeTypes = {
  centerStraight: CenterStraightEdge,
};

const initialNodes: Node<EntityNodeData>[] = [
  {
    id: "movie-avatar",
    type: "entity",
    position: { x: 320, y: 80 },
    data: {
      label: "阿凡达",
      kind: "movie",
      properties: {
        name: "阿凡达",
        date: "2009-12-18",
        brief: "系列开山之作，开启了全球3D电影的划时代热潮",
        director: "詹姆斯·卡梅隆",
        genre: "科幻 / 冒险",
      },
    },
  },
  {
    id: "movie-farewell",
    type: "entity",
    position: { x: 560, y: 200 },
    data: {
      label: "霸王别姬",
      kind: "movie",
      properties: {
        name: "霸王别姬",
        date: "1993-01-01",
        brief: "讲述两位京剧伶人半个世纪的悲欢离合",
        director: "陈凯歌",
        genre: "剧情 / 爱情",
      },
    },
  },
  {
    id: "movie-wandering",
    type: "entity",
    position: { x: 320, y: 340 },
    data: {
      label: "流浪地球",
      kind: "movie",
      properties: {
        name: "流浪地球",
        date: "2019-02-05",
        brief: "中国科幻电影里程碑，讲述太阳危机下的人类自救",
        director: "郭帆",
        genre: "科幻 / 灾难",
      },
    },
  },
  {
    id: "movie-hi-mom",
    type: "entity",
    position: { x: 80, y: 200 },
    data: {
      label: "你好，李焕英",
      kind: "movie",
      properties: {
        name: "你好，李焕英",
        date: "2021-02-12",
        brief: "穿越回母亲年轻时代的温情喜剧",
        director: "贾玲",
        genre: "喜剧 / 剧情",
      },
    },
  },
  {
    id: "movie-nezha",
    type: "entity",
    position: { x: 560, y: 400 },
    data: {
      label: "哪吒之魔童降世",
      kind: "movie",
      properties: {
        name: "哪吒之魔童降世",
        date: "2019-07-26",
        brief: "国产动画票房纪录作品，讲述哪吒成长与反抗命运的故事",
        director: "饺子",
        genre: "动画 / 奇幻",
      },
    },
  },
  {
    id: "actor-worthington",
    type: "entity",
    position: { x: 160, y: 20 },
    data: {
      label: "萨姆·沃辛顿",
      kind: "actor",
      properties: {
        name: "萨姆·沃辛顿",
        age: "48",
        gender: "男",
        nationality: "澳大利亚",
        role: "杰克·萨利",
      },
    },
  },
  {
    id: "actor-sigourney",
    type: "entity",
    position: { x: 480, y: 20 },
    data: {
      label: "西格妮·韦弗",
      kind: "actor",
      properties: {
        name: "西格妮·韦弗",
        age: "75",
        gender: "女",
        nationality: "美国",
        role: "格蕾丝·奥古斯汀",
      },
    },
  },
  {
    id: "actor-leslie",
    type: "entity",
    position: { x: 720, y: 120 },
    data: {
      label: "张国荣",
      kind: "actor",
      properties: {
        name: "张国荣",
        age: "46",
        gender: "男",
        nationality: "中国香港",
        role: "程蝶衣",
      },
    },
  },
  {
    id: "actor-maggie",
    type: "entity",
    position: { x: 720, y: 260 },
    data: {
      label: "张曼玉",
      kind: "actor",
      properties: {
        name: "张曼玉",
        age: "60",
        gender: "女",
        nationality: "中国香港",
        role: "菊仙",
      },
    },
  },
  {
    id: "actor-wujing",
    type: "entity",
    position: { x: 160, y: 420 },
    data: {
      label: "吴京",
      kind: "actor",
      properties: {
        name: "吴京",
        age: "51",
        gender: "男",
        nationality: "中国",
        role: "刘培强",
      },
    },
  },
  {
    id: "actor-jialing",
    type: "entity",
    position: { x: 20, y: 100 },
    data: {
      label: "贾玲",
      kind: "actor",
      properties: {
        name: "贾玲",
        age: "43",
        gender: "女",
        nationality: "中国",
        role: "贾晓玲 / 李焕英",
      },
    },
  },
  {
    id: "actor-shen",
    type: "entity",
    position: { x: 20, y: 300 },
    data: {
      label: "沈腾",
      kind: "actor",
      properties: {
        name: "沈腾",
        age: "45",
        gender: "男",
        nationality: "中国",
        role: "沈光林",
      },
    },
  },
  {
    id: "actor-lv",
    type: "entity",
    position: { x: 720, y: 400 },
    data: {
      label: "吕艳婷",
      kind: "actor",
      properties: {
        name: "吕艳婷",
        age: "32",
        gender: "女",
        nationality: "中国",
        role: "配音演员（哪吒）",
      },
    },
  },
];

function makeEdge(
  id: string,
  source: string,
  target: string,
  properties: Record<string, string>
): Edge<RelationEdgeData> {
  return {
    id,
    source,
    target,
    sourceHandle: "center-source",
    targetHandle: "center-target",
    label: "参演",
    type: "centerStraight",
    data: {
      label: "参演",
      properties,
    },
    style: {
      stroke: "#94a3b8",
      strokeWidth: 1.5,
    },
    labelStyle: {
      fill: "#64748b",
      fontSize: 11,
      fontWeight: 500,
    },
    labelBgStyle: {
      fill: "#f8fafc",
      fillOpacity: 0.95,
    },
    labelBgPadding: [4, 6] as [number, number],
    labelBgBorderRadius: 4,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 14,
      height: 14,
      color: "#94a3b8",
    },
  };
}

const initialEdges: Edge<RelationEdgeData>[] = [
  makeEdge("e1", "actor-worthington", "movie-avatar", {
    type: "参演",
    role: "杰克·萨利",
    year: "2009",
    billing: "男主角",
  }),
  makeEdge("e2", "actor-sigourney", "movie-avatar", {
    type: "参演",
    role: "格蕾丝·奥古斯汀",
    year: "2009",
    billing: "女配角",
  }),
  makeEdge("e3", "actor-leslie", "movie-farewell", {
    type: "参演",
    role: "程蝶衣",
    year: "1993",
    billing: "男主角",
  }),
  makeEdge("e4", "actor-maggie", "movie-farewell", {
    type: "参演",
    role: "菊仙",
    year: "1993",
    billing: "女主角",
  }),
  makeEdge("e5", "actor-wujing", "movie-wandering", {
    type: "参演",
    role: "刘培强",
    year: "2019",
    billing: "男主角",
  }),
  makeEdge("e6", "actor-jialing", "movie-hi-mom", {
    type: "参演",
    role: "贾晓玲",
    year: "2021",
    billing: "女主角",
  }),
  makeEdge("e7", "actor-shen", "movie-hi-mom", {
    type: "参演",
    role: "沈光林",
    year: "2021",
    billing: "男配角",
  }),
  makeEdge("e8", "actor-lv", "movie-nezha", {
    type: "参演",
    role: "哪吒（配音）",
    year: "2019",
    billing: "配音主演",
  }),
  makeEdge("e9", "actor-wujing", "movie-nezha", {
    type: "参演",
    role: "李靖（配音）",
    year: "2019",
    billing: "配音客串",
  }),
];

const nodeMap = Object.fromEntries(initialNodes.map((n) => [n.id, n]));
const edgeMap = Object.fromEntries(initialEdges.map((e) => [e.id, e]));

interface GraphCanvasProps {
  selection: PanelSelection;
  onSelect: (selection: PanelSelection) => void;
}

function GraphCanvas({ selection, onSelect }: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fitView({ padding: 0.2, duration: 200 });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [fitView]);

  useEffect(() => {
    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        selected: selection.type === "node" && selection.id === node.id,
      }))
    );
    setEdges((prev) =>
      prev.map((edge) => ({
        ...edge,
        selected: selection.type === "edge" && selection.id === edge.id,
        style: {
          ...edge.style,
          stroke:
            selection.type === "edge" && selection.id === edge.id
              ? "#2773ff"
              : "#94a3b8",
          strokeWidth:
            selection.type === "edge" && selection.id === edge.id ? 2.5 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color:
            selection.type === "edge" && selection.id === edge.id
              ? "#2773ff"
              : "#94a3b8",
        },
      }))
    );
  }, [selection, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: MouseEvent, node: Node) => {
      onSelect({ type: "node", id: node.id });
    },
    [onSelect]
  );

  const onEdgeClick = useCallback(
    (_: MouseEvent, edge: Edge) => {
      onSelect({ type: "edge", id: edge.id });
    },
    [onSelect]
  );

  const onPaneClick = useCallback(() => {
    onSelect({ type: "overview" });
  }, [onSelect]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      minZoom={0.25}
      maxZoom={2.5}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable
      panOnDrag
      panOnScroll={false}
      zoomOnScroll
      zoomOnPinch
      zoomOnDoubleClick
      selectionOnDrag={false}
      defaultEdgeOptions={{ type: "centerStraight" }}
      proOptions={{ hideAttribution: true }}
      style={{ width: "100%", height: "100%" }}
      className="bg-[#f4f6f8]"
    >
      <Background color="#cbd5e1" gap={20} size={1} />
      <Controls
        showInteractive={false}
        position="top-right"
        className="!overflow-hidden !rounded-md !border-slate-200 !shadow-md"
      />
    </ReactFlow>
  );
}

function PropertyPanel({ selection }: { selection: PanelSelection }) {
  const movieCount = initialNodes.filter((n) => n.data.kind === "movie").length;
  const actorCount = initialNodes.filter((n) => n.data.kind === "actor").length;
  const relationCount = initialEdges.length;
  const totalNodes = initialNodes.length;

  if (selection.type === "node") {
    const node = nodeMap[selection.id];
    if (!node) return null;

    const isMovie = node.data.kind === "movie";
    const color = isMovie ? MOVIE_COLOR : ACTOR_COLOR;

    return (
      <>
        <div className="shrink-0 border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">实体属性</h3>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-medium text-slate-800">
              {isMovie ? "电影" : "演员"} · {node.data.label}
            </span>
          </div>
          <PropertyList properties={node.data.properties} />
        </div>
      </>
    );
  }

  if (selection.type === "edge") {
    const edge = edgeMap[selection.id];
    if (!edge) return null;

    const sourceNode = nodeMap[edge.source];
    const targetNode = nodeMap[edge.target];

    return (
      <>
        <div className="shrink-0 border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">关系属性</h3>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span className="font-medium text-purple-600">
              {sourceNode?.data.label}
            </span>
            <span className="mx-1.5 text-slate-400">— 参演 →</span>
            <span className="font-medium text-emerald-600">
              {targetNode?.data.label}
            </span>
          </div>
          <PropertyList properties={edge.data?.properties ?? {}} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">结果概览</h3>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <section>
          <h4 className="mb-3 text-sm font-medium text-slate-800">
            节点（{totalNodes}）
          </h4>
          <div className="flex flex-wrap gap-2">
            <StatTag
              label="*"
              count={totalNodes}
              className="bg-violet-100 text-violet-700"
            />
            <StatTag
              label="电影"
              count={movieCount}
              dotColor={MOVIE_COLOR}
              className="bg-emerald-50 text-emerald-700"
            />
            <StatTag
              label="演员"
              count={actorCount}
              dotColor={ACTOR_COLOR}
              className="bg-purple-50 text-purple-700"
            />
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-sm font-medium text-slate-800">
            关系（{relationCount}）
          </h4>
          <div className="flex flex-wrap gap-2">
            <RelationTag label="*" count={relationCount} />
            <RelationTag label="参演" count={relationCount} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
          <p className="mb-1 font-medium text-slate-600">操作提示</p>
          <p>点击实体查看实体属性；点击连线查看关系属性。</p>
          <p className="mt-1">点击画布空白区域可返回结果概览。</p>
        </section>
      </div>
    </>
  );
}

function PropertyList({ properties }: { properties: Record<string, string> }) {
  const entries = useMemo(() => Object.entries(properties), [properties]);

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
        >
          <div className="mb-0.5 text-xs text-slate-400">{key}</div>
          <div className="text-sm leading-relaxed text-slate-800 break-words">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

interface GraphRetrievalDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GraphRetrievalDrawer({
  open,
  onOpenChange,
}: GraphRetrievalDrawerProps) {
  const [selection, setSelection] = useState<PanelSelection>({
    type: "overview",
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelection({ type: "overview" });
    }
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-[min(96vw,1100px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <SheetHeader className="shrink-0 border-b border-slate-200 px-5 py-4 text-left">
          <SheetTitle className="text-base font-semibold text-slate-900">
            图谱检索
          </SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="relative h-full min-w-0 flex-1 overflow-hidden">
            {open && (
              <ReactFlowProvider>
                <div className="absolute inset-0">
                  <GraphCanvas
                    selection={selection}
                    onSelect={setSelection}
                  />
                </div>
              </ReactFlowProvider>
            )}
          </div>

          <aside className="flex h-full w-[280px] shrink-0 flex-col border-l border-slate-200 bg-white">
            <PropertyPanel selection={selection} />
          </aside>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatTag({
  label,
  count,
  className,
  dotColor,
}: {
  label: string;
  count: number;
  className?: string;
  dotColor?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        className
      )}
    >
      {dotColor && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      )}
      {label}（{count}）
    </span>
  );
}

function RelationTag({ label, count }: { label: string; count: number }) {
  return (
    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 [clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)]">
      {label}（{count}）
    </span>
  );
}
