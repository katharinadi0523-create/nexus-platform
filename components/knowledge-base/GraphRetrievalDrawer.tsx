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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type EntityKind = "movie" | "actor";

interface GraphSliceSource {
  id: number;
  content: string;
  tags: string[];
}

interface GraphDocumentSource {
  id: string;
  name: string;
  /** 为空时界面展示为 "-" */
  description?: string;
  slices: GraphSliceSource[];
}

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
  properties: Record<string, string>,
  label = "参演"
): Edge<RelationEdgeData> {
  return {
    id,
    source,
    target,
    sourceHandle: "center-source",
    targetHandle: "center-target",
    label,
    type: "centerStraight",
    data: {
      label,
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

/** 文档详情「查看图谱」示例数据（住房租赁合同） */
const documentInitialNodes: Node<EntityNodeData>[] = [
  {
    id: "contract",
    type: "entity",
    position: { x: 280, y: 200 },
    data: {
      label: "租赁合同",
      kind: "movie",
      properties: {
        name: "北京住房租赁合同",
        date: "2024-02-20",
        type: "住房租赁",
        term: "24个月",
      },
    },
  },
  {
    id: "party-a",
    type: "entity",
    position: { x: 80, y: 60 },
    data: {
      label: "甲方",
      kind: "actor",
      properties: {
        name: "张某某",
        role: "出租人",
        idNo: "1101**********1234",
      },
    },
  },
  {
    id: "party-b",
    type: "entity",
    position: { x: 480, y: 60 },
    data: {
      label: "乙方",
      kind: "actor",
      properties: {
        name: "李某某",
        role: "承租人",
        idNo: "1101**********5678",
      },
    },
  },
  {
    id: "house",
    type: "entity",
    position: { x: 280, y: 380 },
    data: {
      label: "租赁房屋",
      kind: "movie",
      properties: {
        name: "建国路88号1501室",
        area: "89㎡",
        usage: "住宅",
        district: "北京市朝阳区",
      },
    },
  },
  {
    id: "rent",
    type: "entity",
    position: { x: 520, y: 280 },
    data: {
      label: "租金",
      kind: "actor",
      properties: {
        name: "月租金",
        amount: "8000元",
        deposit: "16000元",
        payDay: "每月1日前",
      },
    },
  },
];

const documentInitialEdges: Edge<RelationEdgeData>[] = [
  makeEdge(
    "de1",
    "party-a",
    "contract",
    { type: "签订", role: "出租人", date: "2024-02-20" },
    "签订"
  ),
  makeEdge(
    "de2",
    "party-b",
    "contract",
    { type: "签订", role: "承租人", date: "2024-02-20" },
    "签订"
  ),
  makeEdge(
    "de3",
    "contract",
    "house",
    { type: "标的", address: "朝阳区建国路88号1501室" },
    "标的"
  ),
  makeEdge(
    "de4",
    "contract",
    "rent",
    { type: "约定", monthly: "8000元", deposit: "16000元" },
    "约定"
  ),
];

function createSlices(contents: string[]): GraphSliceSource[] {
  return contents.map((content, index) => ({
    id: index + 1,
    content,
    tags: Array.from({ length: 7 }, (_, i) => `切片标签${i + 1}`),
  }));
}

const DOCUMENT_LIBRARY: Record<string, GraphDocumentSource> = {
  avatarScript: {
    id: "doc-avatar-001",
    name: "阿凡达电影剧本节选.pdf",
    description: "收录阿凡达主要角色设定与关键剧情段落",
    slices: createSlices([
      "杰克·萨利作为残疾前海军陆战队员，通过阿凡达计划进入潘多拉星球，逐步理解纳威族文化并与自然建立深层连接。",
      "格蕾丝·奥古斯汀博士长期研究潘多拉生态网络，指出树木与生物之间存在可量化的能量与信息交换。",
      "采矿公司为获取稀有矿物，持续扩大对潘多拉圣地的侵入，冲突由此升级为全面对抗。",
    ]),
  },
  avatarReview: {
    id: "doc-avatar-002",
    name: "全球3D电影技术白皮书.docx",
    description: "",
    slices: createSlices([
      "《阿凡达》推动立体摄影与虚拟制片流程标准化，使大规模 CG 角色表演成为可行的工业方案。",
      "后续科幻影片在光影捕捉、表情驱动与实景合成方面大量复用该片积累的工程经验。",
    ]),
  },
  farewellEssay: {
    id: "doc-farewell-001",
    name: "霸王别姬影评合集.md",
    description: "京剧伶人半世纪命运与时代变迁的文本资料",
    slices: createSlices([
      "程蝶衣与段小楼的师兄弟关系贯穿全片，既是艺术共同体，也是个人身份认同的重要来源。",
      "菊仙作为关键人物，在动荡年代以世俗智慧维系情感与生存，推动三人关系不断改写。",
    ]),
  },
  wanderingNote: {
    id: "doc-earth-001",
    name: "流浪地球设定集.pdf",
    description: "太阳危机背景下的人类自救与家庭情感线索",
    slices: createSlices([
      "刘培强在空间站执行关键任务，其选择与地球表面的救援行动形成互文叙事。",
      "行星发动机与地下城体系构成故事的技术骨架，强调集体协作高于个人英雄主义。",
    ]),
  },
  himomScript: {
    id: "doc-himom-001",
    name: "你好李焕英剧本大纲.txt",
    description: undefined,
    slices: createSlices([
      "贾晓玲穿越回母亲年轻时代，在工厂生活中重新理解亲情与遗憾。",
      "沈光林等配角以喜剧节奏缓冲情绪高潮，使温情主线更易被观众接受。",
    ]),
  },
  nezhaArt: {
    id: "doc-nezha-001",
    name: "哪吒之魔童降世美术设定.pdf",
    description: "角色造型、场景概念与配音备注",
    slices: createSlices([
      "哪吒以反抗宿命为主题，配音表演强调少年感与爆发力的平衡。",
      "李靖形象在传统严父与现代父亲之间取舍，配音客串强化角色辨识度。",
    ]),
  },
  castingSheet: {
    id: "doc-cast-001",
    name: "主演阵容与角色对照表.xlsx",
    description: "演员、角色、档期与戏份权重说明",
    slices: createSlices([
      "参演关系通常包含角色名、出演年份与戏份级别，用于图谱检索中的关系证据回溯。",
      "同一演员可关联多部影片，文档切片用于支撑实体抽取与关系校验。",
    ]),
  },
};

const ENTITY_DOCUMENTS: Record<string, GraphDocumentSource[]> = {
  "movie-avatar": [
    DOCUMENT_LIBRARY.avatarScript,
    DOCUMENT_LIBRARY.avatarReview,
  ],
  "movie-farewell": [DOCUMENT_LIBRARY.farewellEssay],
  "movie-wandering": [DOCUMENT_LIBRARY.wanderingNote],
  "movie-hi-mom": [DOCUMENT_LIBRARY.himomScript],
  "movie-nezha": [DOCUMENT_LIBRARY.nezhaArt],
  "actor-worthington": [
    DOCUMENT_LIBRARY.avatarScript,
    DOCUMENT_LIBRARY.castingSheet,
  ],
  "actor-sigourney": [DOCUMENT_LIBRARY.avatarScript],
  "actor-leslie": [DOCUMENT_LIBRARY.farewellEssay, DOCUMENT_LIBRARY.castingSheet],
  "actor-maggie": [DOCUMENT_LIBRARY.farewellEssay],
  "actor-wujing": [
    DOCUMENT_LIBRARY.wanderingNote,
    DOCUMENT_LIBRARY.nezhaArt,
    DOCUMENT_LIBRARY.castingSheet,
  ],
  "actor-jialing": [DOCUMENT_LIBRARY.himomScript],
  "actor-shen": [DOCUMENT_LIBRARY.himomScript],
  "actor-lv": [DOCUMENT_LIBRARY.nezhaArt],
};

const EDGE_DOCUMENTS: Record<string, GraphDocumentSource[]> = {
  e1: [DOCUMENT_LIBRARY.avatarScript, DOCUMENT_LIBRARY.castingSheet],
  e2: [DOCUMENT_LIBRARY.avatarScript],
  e3: [DOCUMENT_LIBRARY.farewellEssay, DOCUMENT_LIBRARY.castingSheet],
  e4: [DOCUMENT_LIBRARY.farewellEssay],
  e5: [DOCUMENT_LIBRARY.wanderingNote, DOCUMENT_LIBRARY.castingSheet],
  e6: [DOCUMENT_LIBRARY.himomScript],
  e7: [DOCUMENT_LIBRARY.himomScript],
  e8: [DOCUMENT_LIBRARY.nezhaArt],
  e9: [DOCUMENT_LIBRARY.nezhaArt, DOCUMENT_LIBRARY.castingSheet],
};

function getDocumentSources(selection: PanelSelection): GraphDocumentSource[] {
  if (selection.type === "node") {
    return ENTITY_DOCUMENTS[selection.id] ?? [];
  }
  if (selection.type === "edge") {
    return EDGE_DOCUMENTS[selection.id] ?? [];
  }
  return [];
}

interface GraphCanvasProps {
  selection: PanelSelection;
  onSelect: (selection: PanelSelection) => void;
  nodes: Node<EntityNodeData>[];
  onNodesChange: ReturnType<typeof useNodesState<EntityNodeData>>[2];
  setNodes: ReturnType<typeof useNodesState<EntityNodeData>>[1];
  edges: Edge<RelationEdgeData>[];
  onEdgesChange: ReturnType<typeof useEdgesState>[2];
  setEdges: ReturnType<typeof useEdgesState>[1];
}

function GraphCanvas({
  selection,
  onSelect,
  nodes,
  onNodesChange,
  setNodes,
  edges,
  onEdgesChange,
  setEdges,
}: GraphCanvasProps) {
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

function PropertyPanel({
  selection,
  nodes,
  edges,
  onUpdateEntityName,
  variant = "default",
}: {
  selection: PanelSelection;
  nodes: Node<EntityNodeData>[];
  edges: Edge<RelationEdgeData>[];
  onUpdateEntityName: (nodeId: string, name: string) => void;
  variant?: "default" | "document";
}) {
  const movieCount = nodes.filter((n) => n.data.kind === "movie").length;
  const actorCount = nodes.filter((n) => n.data.kind === "actor").length;
  const relationCount = edges.length;
  const totalNodes = nodes.length;
  const liveNodeMap = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes]
  );
  const liveEdgeMap = useMemo(
    () => Object.fromEntries(edges.map((e) => [e.id, e])),
    [edges]
  );
  const primaryLabel = variant === "document" ? "标的" : "电影";
  const secondaryLabel = variant === "document" ? "主体" : "演员";
  const relationLabel = variant === "document" ? "关联" : "参演";

  if (selection.type === "node") {
    const node = liveNodeMap[selection.id];
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
              {isMovie ? primaryLabel : secondaryLabel} · {node.data.label}
            </span>
          </div>
          <PropertyList
            properties={node.data.properties}
            editableKeys={["name"]}
            onPropertyChange={(key, value) => {
              if (key === "name") {
                onUpdateEntityName(node.id, value);
              }
            }}
          />
          <DocumentSourcesSection
            documents={getDocumentSources(selection)}
          />
        </div>
      </>
    );
  }

  if (selection.type === "edge") {
    const edge = liveEdgeMap[selection.id];
    if (!edge) return null;

    const sourceNode = liveNodeMap[edge.source];
    const targetNode = liveNodeMap[edge.target];
    const edgeLabel = edge.data?.label || relationLabel;

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
            <span className="mx-1.5 text-slate-400">— {edgeLabel} →</span>
            <span className="font-medium text-emerald-600">
              {targetNode?.data.label}
            </span>
          </div>
          <PropertyList properties={edge.data?.properties ?? {}} />
          <DocumentSourcesSection
            documents={getDocumentSources(selection)}
          />
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
              label={primaryLabel}
              count={movieCount}
              dotColor={MOVIE_COLOR}
              className="bg-emerald-50 text-emerald-700"
            />
            <StatTag
              label={secondaryLabel}
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
            <RelationTag label={relationLabel} count={relationCount} />
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

function PropertyList({
  properties,
  editableKeys = [],
  onPropertyChange,
}: {
  properties: Record<string, string>;
  editableKeys?: string[];
  onPropertyChange?: (key: string, value: string) => void;
}) {
  const entries = useMemo(() => Object.entries(properties), [properties]);

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => {
        const editable = editableKeys.includes(key);
        return (
          <div
            key={key}
            className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
          >
            <div className="mb-0.5 text-xs text-slate-400">{key}</div>
            {editable ? (
              <Input
                value={value}
                onChange={(e) => onPropertyChange?.(key, e.target.value)}
                className="h-8 border-slate-200 bg-white text-sm text-slate-800"
                placeholder="请输入名称"
              />
            ) : (
              <div className="text-sm leading-relaxed text-slate-800 break-words">
                {value}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const VISIBLE_TAG_COUNT = 4;

function SliceTagRow({ tags }: { tags: string[] }) {
  const visible = tags.slice(0, VISIBLE_TAG_COUNT);
  const remaining = Math.max(0, tags.length - VISIBLE_TAG_COUNT);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((tag) => (
        <span
          key={tag}
          className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
        >
          {tag}
        </span>
      ))}
      {remaining > 0 && (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          +{remaining}
        </span>
      )}
    </div>
  );
}

function SliceSourceDialog({
  document,
  open,
  onOpenChange,
}: {
  document: GraphDocumentSource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    if (!open) setKeyword("");
  }, [open]);

  const filteredSlices = useMemo(() => {
    if (!document) return [];
    const q = keyword.trim().toLowerCase();
    if (!q) return document.slices;
    return document.slices.filter(
      (slice) =>
        slice.content.toLowerCase().includes(q) ||
        String(slice.id).includes(q) ||
        slice.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [document, keyword]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[min(92vw,640px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px]">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-5 py-4 text-left">
          <DialogTitle className="text-base font-semibold text-slate-900">
            切片来源
            {document ? (
              <span className="ml-2 text-sm font-normal text-slate-500">
                {document.name}
              </span>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col bg-[#f4f6f8]">
          <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-3">
            <div className="relative">
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索关键词"
                className="h-9 rounded-md border-slate-200 pr-9"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {filteredSlices.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
                暂无匹配的切片
              </div>
            ) : (
              filteredSlices.map((slice) => (
                <div
                  key={slice.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>切片 ID: {slice.id}</span>
                    <span>字符: {slice.content.length}</span>
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-slate-800">
                    {slice.content}
                  </p>
                  <SliceTagRow tags={slice.tags} />
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentSourcesSection({
  documents,
}: {
  documents: GraphDocumentSource[];
}) {
  const [activeDoc, setActiveDoc] = useState<GraphDocumentSource | null>(null);

  return (
    <section className="space-y-2">
      <h4 className="text-sm font-medium text-slate-800">
        文档来源
        <span className="ml-1 text-xs font-normal text-slate-400">
          ({documents.length})
        </span>
      </h4>

      {documents.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
          暂无关联文档
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => setActiveDoc(doc)}
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-[#2773ff]/40 hover:bg-blue-50/40"
            >
              <div className="mb-1 truncate text-sm font-medium text-slate-800">
                {doc.name}
              </div>
              <div className="mb-1 text-xs text-slate-400">文档 ID: {doc.id}</div>
              <div className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                {doc.description?.trim() ? doc.description : "-"}
              </div>
            </button>
          ))}
        </div>
      )}

      <SliceSourceDialog
        document={activeDoc}
        open={Boolean(activeDoc)}
        onOpenChange={(open) => {
          if (!open) setActiveDoc(null);
        }}
      />
    </section>
  );
}

interface GraphRetrievalDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  variant?: "default" | "document";
}

export function GraphRetrievalDrawer({
  open,
  onOpenChange,
  title = "图谱检索",
  variant = "default",
}: GraphRetrievalDrawerProps) {
  const seedNodes =
    variant === "document" ? documentInitialNodes : initialNodes;
  const seedEdges =
    variant === "document" ? documentInitialEdges : initialEdges;

  const [selection, setSelection] = useState<PanelSelection>({
    type: "overview",
  });
  const [nodes, setNodes, onNodesChange] = useNodesState(seedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(seedEdges);

  useEffect(() => {
    if (!open) return;
    const nextNodes =
      variant === "document" ? documentInitialNodes : initialNodes;
    const nextEdges =
      variant === "document" ? documentInitialEdges : initialEdges;
    setSelection({ type: "overview" });
    setNodes(nextNodes);
    setEdges(nextEdges);
  }, [open, variant, setNodes, setEdges]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelection({ type: "overview" });
      setNodes(
        variant === "document" ? documentInitialNodes : initialNodes
      );
      setEdges(
        variant === "document" ? documentInitialEdges : initialEdges
      );
    }
    onOpenChange(nextOpen);
  };

  const updateEntityName = useCallback(
    (nodeId: string, name: string) => {
      setNodes((prev) =>
        prev.map((node) => {
          if (node.id !== nodeId) return node;
          const nextLabel = name.trim() || node.data.label;
          return {
            ...node,
            data: {
              ...node.data,
              label: nextLabel,
              properties: {
                ...node.data.properties,
                name,
              },
            },
          };
        })
      );
    },
    [setNodes]
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-[min(96vw,1100px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <SheetHeader className="shrink-0 border-b border-slate-200 px-5 py-4 text-left">
          <SheetTitle className="text-base font-semibold text-slate-900">
            {title}
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
                    nodes={nodes}
                    onNodesChange={onNodesChange}
                    setNodes={setNodes}
                    edges={edges}
                    onEdgesChange={onEdgesChange}
                    setEdges={setEdges}
                  />
                </div>
              </ReactFlowProvider>
            )}
          </div>

          <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-slate-200 bg-white">
            <PropertyPanel
              selection={selection}
              nodes={nodes}
              edges={edges}
              onUpdateEntityName={updateEntityName}
              variant={variant}
            />
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
