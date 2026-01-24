"use client";

import { useCallback, useState, useMemo, useRef } from "react";
import { Plus, Play, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { StartNode } from "./nodes/start-node";
import { EndNode } from "./nodes/end-node";
import { LLMNode } from "./nodes/llm-node";
import { KnowledgeNode } from "./nodes/knowledge-node";
import { ObjectQueryNode } from "./nodes/object-query-node";
import { GenericNode } from "./nodes/generic-node";
import { NodeConfigPanel } from "./node-config-panel";
import { NodeLibraryMenu } from "./node-library-menu";
import { BasicConfigSheet } from "./basic-config-sheet";

interface WorkflowEditorProps {
  agentId: string;
}

// 定义节点类型
const nodeTypes = {
  start: StartNode,
  end: EndNode,
  llm: LLMNode,
  knowledge: KnowledgeNode,
  // 新节点类型 - 暂时使用 GenericNode
  agent: GenericNode,
  "table-select": GenericNode,
  "data-clarify": GenericNode,
  "data-query": GenericNode,
  "data-visualize": GenericNode,
  branch: GenericNode,
  "intent-recognize": GenericNode,
  code: GenericNode,
  mcp: GenericNode,
  api: GenericNode,
  message: GenericNode,
  "object-query": ObjectQueryNode,
};

// 初始节点数据
const initialNodes: Node[] = [
  {
    id: "start-1",
    type: "start",
    position: { x: 100, y: 250 },
    data: {},
  },
  {
    id: "knowledge-1",
    type: "knowledge",
    position: { x: 400, y: 250 },
    data: {},
  },
  {
    id: "llm-1",
    type: "llm",
    position: { x: 700, y: 250 },
    data: {},
  },
  {
    id: "end-1",
    type: "end",
    position: { x: 1000, y: 250 },
    data: {},
  },
];

// 初始边数据
const initialEdges: Edge[] = [
  {
    id: "e1",
    source: "start-1",
    target: "knowledge-1",
    type: "smoothstep",
    animated: true,
  },
  {
    id: "e2",
    source: "knowledge-1",
    target: "llm-1",
    type: "smoothstep",
    animated: true,
  },
  {
    id: "e3",
    source: "llm-1",
    target: "end-1",
    type: "smoothstep",
    animated: true,
  },
];

export function WorkflowEditor({ agentId }: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeLibraryOpen, setNodeLibraryOpen] = useState(false);
  const [basicConfigOpen, setBasicConfigOpen] = useState(false);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleUpdateNode = useCallback(
    (nodeId: string, data: any) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
        )
      );
    },
    [setNodes]
  );

  const handleAddNode = useCallback(
    (nodeType: string, label: string) => {
      if (!reactFlowInstance.current) return;

      // 获取画布中心位置（使用屏幕坐标转换为画布坐标）
      const reactFlowBounds = reactFlowInstance.current.getViewport();
      const centerX = (window.innerWidth / 2 - reactFlowBounds.x) / reactFlowBounds.zoom;
      const centerY = (window.innerHeight / 2 - reactFlowBounds.y) / reactFlowBounds.zoom;

      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position: { x: centerX - 100, y: centerY - 50 },
        data: { label },
      };

      setNodes((nds) => [...nds, newNode]);
      setNodeLibraryOpen(false);
    },
    [setNodes]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* 中间画布区 */}
      <div
        className="flex-1 bg-slate-50 relative transition-all"
        style={{ marginRight: selectedNode ? "400px" : "0" }}
      >
        {/* 顶部工具栏 */}
        <div className="absolute top-4 left-4 right-4 flex items-center z-10">
          {/* 左侧：基本配置 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBasicConfigOpen(true)}
          >
            基本配置
          </Button>
        </div>

        {/* React Flow Canvas */}
        <div className="absolute inset-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={onInit}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-50"
            style={{ width: "100%", height: "100%" }}
          >
            <Background color="#cbd5e1" gap={16} />
            <Controls position="bottom-right" />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case "start":
                    return "#10b981";
                  case "end":
                    return "#ef4444";
                  case "llm":
                    return "#3b82f6";
                  case "knowledge":
                    return "#a855f7";
                  default:
                    return "#94a3b8";
                }
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        </div>

        {/* 底部工具栏 - 使用固定定位确保可见 */}
        <div 
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-lg p-2 flex items-center gap-2 pointer-events-auto border border-slate-200"
          style={{ 
            zIndex: 9999
          }}
        >
          <Popover open={nodeLibraryOpen} onOpenChange={setNodeLibraryOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                节点
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="center"
              className="w-auto p-0 border-0 shadow-lg"
              style={{ zIndex: 10000 }}
            >
              <NodeLibraryMenu onSelectNode={handleAddNode} />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm">
            100%
          </Button>
          <Button variant="default" size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
            <Bug className="h-4 w-4" />
            调试
          </Button>
        </div>

        {/* Node Config Panel */}
        <NodeConfigPanel
          selectedNode={selectedNode}
          onUpdateNode={handleUpdateNode}
          onClose={() => setSelectedNodeId(null)}
        />
      </div>

      {/* Basic Config Sheet */}
      <BasicConfigSheet
        open={basicConfigOpen}
        onOpenChange={setBasicConfigOpen}
      />
    </div>
  );
}
