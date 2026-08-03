"use client";

import { useCallback, useState, useMemo, useRef, useEffect } from "react";
import { Plus, Bug } from "lucide-react";
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
import { TableSelectNode } from "./nodes/data/table-select-node";
import { DataClarifyNode } from "./nodes/data/data-clarify-node";
import { DataQueryNode } from "./nodes/data/data-query-node";
import { DataVisualizeNode } from "./nodes/data/data-visualize-node";
import { AgentNode } from "./nodes/agent-node";
import { BranchNode } from "./nodes/branch-node";
import { IntentRecognizeNode } from "./nodes/intent-recognize-node";
import { CodeNode } from "./nodes/code-node";
import { GenericNode } from "./nodes/generic-node";
import { MCPNode } from "./nodes/mcp-node";
import { NodeConfigPanel } from "./node-config-panel";
import { NodeLibraryMenu } from "./node-library-menu";
import { BasicConfigSheet } from "./basic-config-sheet";
import { executeWorkflow, FlowRuntimeResult } from "./workflow-runner";
import { WorkflowResultPanel } from "./workflow-result-panel";
import { getWorkflowByAgentId } from "@/lib/mock/workflow-data";

interface WorkflowEditorProps {
  agentId: string;
  readOnly?: boolean;
}

// 定义节点类型
const nodeTypes = {
  start: StartNode,
  end: EndNode,
  llm: LLMNode,
  knowledge: KnowledgeNode,
  // 数据节点
  "table-select": TableSelectNode,
  "data-clarify": DataClarifyNode,
  "data-query": DataQueryNode,
  "data-visualize": DataVisualizeNode,
  // 其他节点类型
  agent: AgentNode,
  branch: BranchNode,
  "intent-recognize": IntentRecognizeNode,
  code: CodeNode,
  mcp: MCPNode,
  api: GenericNode,
  message: GenericNode,
  "object-query": ObjectQueryNode,
};

// 初始节点数据
const initialNodes: Node[] = [
  {
    id: "start-1",
    type: "start",
    position: { x: 80, y: 350 },
    data: {},
  },
  {
    id: "knowledge-1",
    type: "knowledge",
    position: { x: 360, y: 350 },
    data: {
      outputVariables: [{ name: "result", type: "array[object]" }],
    },
  },
  {
    id: "agent-version-demo",
    type: "agent",
    position: { x: 700, y: 60 },
    data: {
      description: "设备维修判断与预测",
      agentId: "device-03",
      agentName: "设备维修判断与预测",
      currentVersion: "V1",
      latestVersion: "V2",
      latestPublishedAt: "2026-07-27 10:20:15",
      latestVersionDescription: "优化数据校验及异常处理",
      hasVersionUpdate: true,
      versionUpdateDismissed: false,
      availabilityStatus: "available",
      inputVariables: [
        { name: "query", type: "string" },
        { name: "files", type: "array[object]" },
        { name: "*device_id", type: "string" },
      ],
      outputVariables: [
        { name: "answer", type: "String" },
        { name: "ruleIntervention", type: "String" },
      ],
    },
  },
  {
    id: "agent-version-auto-switch-demo",
    type: "agent",
    position: { x: 700, y: 350 },
    data: {
      description: "合同审查（引用版本已自动切换）",
      agentId: "contract-review-agent",
      agentName: "合同审查智能体",
      previousVersion: "V1",
      currentVersion: "V2",
      latestVersion: "V2",
      latestVersionDescription: "优化合同条款识别与风险提示",
      versionAutoSwitched: true,
      versionSwitchMessage: "原引用版本 V1 已停用，系统已自动切换至最新可用版本 V2。",
      versionSwitchedAt: "2026-08-03 10:30:12",
      hasVersionUpdate: false,
      availabilityStatus: "available",
      inputVariables: [{ name: "query", type: "string" }],
      outputVariables: [{ name: "answer", type: "String" }],
    },
  },
  {
    id: "agent-disabled-demo",
    type: "agent",
    position: { x: 700, y: 640 },
    data: {
      description: "设备诊断（引用智能体已停用）",
      agentId: "legacy-device-agent",
      agentName: "旧版设备诊断智能体",
      currentVersion: "V3",
      latestVersion: "V3",
      hasVersionUpdate: false,
      availabilityStatus: "agent-disabled",
      agentUnavailableMessage: "引用的智能体已停用，请重新配置。",
      runtimeError: "引用的智能体“旧版设备诊断智能体”已停用，当前节点无法调用，请重新配置后再运行。",
      inputVariables: [{ name: "query", type: "string" }],
      outputVariables: [{ name: "answer", type: "String" }],
    },
  },
  {
    id: "llm-1",
    type: "llm",
    position: { x: 1080, y: 350 },
    data: {
      outputVariables: [{ name: "text", type: "string" }],
    },
  },
  {
    id: "end-1",
    type: "end",
    position: { x: 1400, y: 350 },
    data: {},
  },
];

const initialEdges: Edge[] = [
  { id: "e1", source: "start-1", target: "knowledge-1", type: "smoothstep", animated: true },
  { id: "e2", source: "knowledge-1", target: "agent-version-demo", type: "smoothstep", animated: true },
  { id: "e3", source: "knowledge-1", target: "agent-version-auto-switch-demo", type: "smoothstep", animated: true },
  { id: "e4", source: "knowledge-1", target: "agent-disabled-demo", type: "smoothstep", animated: true },
  { id: "e5", source: "agent-version-demo", target: "llm-1", type: "smoothstep", animated: true },
  { id: "e6", source: "agent-version-auto-switch-demo", target: "llm-1", type: "smoothstep", animated: true },
  { id: "e7", source: "agent-disabled-demo", target: "llm-1", type: "smoothstep", animated: true },
  { id: "e8", source: "llm-1", target: "end-1", type: "smoothstep", animated: true },
];
export function WorkflowEditor({ agentId, readOnly = false }: WorkflowEditorProps) {
  // 根据 agentId 加载工作流数据，如果没有则使用默认值
  const workflowData = agentId ? getWorkflowByAgentId(agentId) : null;
  const defaultNodes = workflowData?.nodes || initialNodes;
  const defaultEdges = workflowData?.edges || initialEdges;

  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeLibraryOpen, setNodeLibraryOpen] = useState(false);
  const [basicConfigOpen, setBasicConfigOpen] = useState(false);
  const [runResult, setRunResult] = useState<FlowRuntimeResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // 当 agentId 变化时，重新加载工作流数据
  useEffect(() => {
    const newWorkflowData = agentId ? getWorkflowByAgentId(agentId) : null;
    if (newWorkflowData) {
      setNodes(newWorkflowData.nodes);
      setEdges(newWorkflowData.edges);
    }
  }, [agentId, setNodes, setEdges]);

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
    (nodeId: string, data: Record<string, unknown>) => {
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

  const handleRun = useCallback(async () => {
    setIsExecuting(true);

    setRunResult(null); // 清空之前的结果
    
    try {
      const result = await executeWorkflow(
        nodes,
        edges,
        (partialResult) => {
          // 实时更新运行结果，显示执行进度
          setRunResult({
            ...partialResult,
            endedAt: partialResult.endedAt || Date.now(),
          } as FlowRuntimeResult);
        }
      );
      setRunResult(result);
    } catch (error) {
      console.error("工作流执行失败:", error);
      setRunResult({
        status: "failed",
        startedAt: Date.now(),
        endedAt: Date.now(),
        nodeResults: {},
        nodeOrder: [],
        finalOutput: null,
        warnings: [`执行失败: ${error instanceof Error ? error.message : String(error)}`],
      });
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, edges]);

  const handleNodeClickFromResult = useCallback((nodeId: string) => {
    // 点击结果面板中的节点时，高亮画布上的对应节点
    setSelectedNodeId(nodeId);
    // 可以在这里添加更多的高亮逻辑
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* 中间画布区 */}
      <div
        className="flex-1 bg-slate-50 relative transition-all"
        style={{
          marginRight: selectedNode || runResult ? "400px" : "0",
        }}
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
            onNodesChange={readOnly ? undefined : onNodesChange}
            onEdgesChange={readOnly ? undefined : onEdgesChange}
            onConnect={readOnly ? undefined : onConnect}
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
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
                  case "agent":
                  case "intent-recognize":
                    return "#3b82f6";
                  case "knowledge":
                  case "object-query":
                  case "table-select":
                  case "data-clarify":
                  case "data-query":
                  case "data-visualize":
                    return "#a855f7";
                  case "branch":
                  case "code":
                    return "#f97316";
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
              <Button variant="outline" size="sm" className="gap-2" disabled={readOnly}>
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
          <Button
            variant="default"
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700"
            onClick={handleRun}
            disabled={isExecuting || readOnly}
          >
            <Bug className="h-4 w-4" />
            {isExecuting ? "执行中..." : "运行"}
          </Button>
        </div>

        {/* Node Config Panel */}
        {selectedNode && !runResult && (
          <NodeConfigPanel
            selectedNode={selectedNode}
            onUpdateNode={handleUpdateNode}
            onClose={() => setSelectedNodeId(null)}
            nodes={nodes}
            edges={edges}
            readOnly={readOnly}
          />
        )}

        {/* Workflow Result Panel */}
        {runResult && (
          <WorkflowResultPanel
            result={runResult}
            onClose={() => setRunResult(null)}
            onNodeClick={handleNodeClickFromResult}
            isExecuting={isExecuting}
            nodes={nodes}
          />
        )}
      </div>

      {/* Basic Config Sheet */}
      <BasicConfigSheet
        open={basicConfigOpen}
        onOpenChange={setBasicConfigOpen}
        readOnly={readOnly}
      />
    </div>
  );
}
