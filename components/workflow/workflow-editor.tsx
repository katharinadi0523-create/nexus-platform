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
import { WorkflowReferenceNode } from "./nodes/workflow-reference-node";
import { UnavailableObjectNode } from "./nodes/unavailable-object-node";
import { NodeConfigPanel } from "./node-config-panel";
import { NodeLibraryMenu } from "./node-library-menu";
import { BasicConfigSheet } from "./basic-config-sheet";
import { executeWorkflow, FlowRuntimeResult } from "./workflow-runner";
import { WorkflowResultPanel } from "./workflow-result-panel";
import { getWorkflowByAgentId } from "@/lib/mock/workflow-data";
import { type ImportObjectType } from "@/lib/agent-import-export";

interface WorkflowEditorProps {
  agentId: string;
  importResult?: "success" | "success_with_warnings" | null;
  importObjectType?: ImportObjectType;
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
  "workflow-ref": WorkflowReferenceNode,
  "unavailable-object": UnavailableObjectNode,
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
    data: {
      // 开始节点没有输出，只有输入变量可以被下游引用
    },
  },
  {
    id: "knowledge-1",
    type: "knowledge",
    position: { x: 400, y: 250 },
    data: {
      outputVariables: [
        { name: "result", type: "array[object]" },
      ],
    },
  },
  {
    id: "llm-1",
    type: "llm",
    position: { x: 700, y: 250 },
    data: {
      outputVariables: [
        { name: "text", type: "string" },
      ],
    },
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

const importedPrototypeNodes: Node[] = [
  { id: "import-start", type: "start", position: { x: 20, y: 430 }, data: { description: "接收售后问题" } },
  {
    id: "import-classify", type: "llm", position: { x: 340, y: 430 },
    data: {
      description: "问题分类", model: "DeepSeek-V3",
      modelParams: { temperature: 0.2, max_tokens: 1024 },
      prompt: "判断用户问题所属的售后类别，并输出分类结果。",
      inputVariables: [{ name: "prompt", type: "string", value: "接收售后问题/query" }],
      outputVariables: [{ name: "category", type: "string" }],
    },
  },
  { id: "import-knowledge", type: "knowledge", position: { x: 680, y: 0 }, data: { description: "检索售后政策", knowledgeBaseName: "售后政策知识库", inputVariables: [{ name: "query", value: "问题分类/category" }] } },
  { id: "import-database", type: "data-query", position: { x: 680, y: 270 }, data: { description: "查询客户订单", databaseName: "客户订单数据库", inputVariables: [{ name: "customerId", value: "接收售后问题/customerId" }], outputVariables: [{ name: "results", type: "array[object]" }] } },
  { id: "import-ontology", type: "object-query", position: { x: 680, y: 560 }, data: { description: "查询产品本体", objectTypeName: "售后产品对象", inputVariables: [{ name: "productId", value: "接收售后问题/productId" }] } },
  { id: "import-api", type: "api", position: { x: 680, y: 850 }, data: { label: "查询客户信息 API", referenceName: "客户信息查询 API", inputVariables: [{ name: "customerId", type: "string" }], outputVariables: [{ name: "profile", type: "object" }] } },
  { id: "import-database-missing", type: "data-query", position: { x: 680, y: 1120 }, data: { description: "查询历史服务记录", databaseName: "历史服务数据库", inputVariables: [{ name: "customerId", value: "接收售后问题/customerId" }], outputVariables: [{ name: "results", type: "array[object]" }] } },
  {
    id: "import-workflow", type: "unavailable-object", position: { x: 1040, y: 0 },
    data: { description: "执行退款审批", objectKind: "workflow", originalReference: "退款审批流程", referenceId: "workflow-refund", referenceName: "退款审批流程", inputVariables: [{ name: "request", type: "object", value: "问题分类/category" }], outputVariables: [{ name: "approvalResult", type: "object" }] },
  },
  {
    id: "import-agent", type: "unavailable-object", position: { x: 1040, y: 280 },
    data: { description: "复核处理建议", objectKind: "agent", originalReference: "售后分析智能体", referenceId: "agent-service", referenceName: "售后分析智能体", inputVariables: [{ name: "query", type: "string", value: "接收售后问题/query" }], outputVariables: [{ name: "answer", type: "string" }] },
  },
  {
    id: "import-component", type: "unavailable-object", position: { x: 1040, y: 560 },
    data: { description: "创建售后工单", objectKind: "component", originalReference: "工单中心组件", referenceId: "component-ticket", referenceName: "工单中心组件", inputVariables: [{ name: "category", type: "string", value: "问题分类/category" }], outputVariables: [{ name: "ticketId", type: "string" }] },
  },
  { id: "import-terminology", type: "message", position: { x: 1040, y: 850 }, data: { label: "Query 多轮改写", referenceName: "产品标准术语库", inputVariables: [{ name: "query", type: "string" }], outputVariables: [{ name: "rewrittenQuery", type: "string" }] } },
  { id: "import-auth", type: "mcp", position: { x: 1040, y: 1120 }, data: { description: "调用全网检索服务", selectedMCP: { id: "mcp-web-search", name: "全网检索服务", description: "检索公开网络信息" }, inputVariables: [{ name: "query", type: "string", required: true }], outputVariables: [{ name: "result", type: "object" }] } },
  {
    id: "import-reply", type: "llm", position: { x: 1400, y: 430 },
    data: { description: "生成处理回复", model: "Qwen3-32B", modelParams: { temperature: 0.7, max_tokens: 2048 }, prompt: "结合各节点结果生成面向用户的处理回复。", inputVariables: [{ name: "prompt", type: "string", value: "接收售后问题/query" }], outputVariables: [{ name: "text", type: "string" }] },
  },
  { id: "import-end", type: "end", position: { x: 1750, y: 430 }, data: { description: "返回处理结果" } },
];

const branchNodeIds = ["import-knowledge", "import-database", "import-ontology", "import-api", "import-database-missing", "import-workflow", "import-agent", "import-component", "import-terminology", "import-auth"];
const importedPrototypeEdges: Edge[] = [
  { id: "import-e-start", source: "import-start", target: "import-classify", type: "smoothstep", animated: true },
  ...branchNodeIds.map((target) => ({ id: `import-e-classify-${target}`, source: "import-classify", target, type: "smoothstep", animated: true })),
  ...branchNodeIds.map((source) => ({ id: `import-e-${source}-reply`, source, target: "import-reply", type: "smoothstep", animated: true })),
  { id: "import-e-end", source: "import-reply", target: "import-end", type: "smoothstep", animated: true },
];

const IMPORT_ISSUES: Record<string, { title: string; resourceName: string; detail: string; message: string }> = {
  "import-classify": { title: "模型服务不可用", resourceName: "DeepSeek-V3", detail: "当前不可用", message: "原模型“DeepSeek-V3”当前不可用，请重新选择模型。" },
  "import-knowledge": { title: "知识库未匹配", resourceName: "售后政策知识库", detail: "未找到原知识库", message: "未找到原知识库“售后政策知识库”，请重新选择知识库。" },
  "import-database": { title: "数据库无访问权限", resourceName: "客户订单数据库", detail: "当前用户无访问权限", message: "无权访问数据库“客户订单数据库”，请申请权限或重新选择数据库。" },
  "import-ontology": { title: "本体资源未匹配", resourceName: "售后产品对象", detail: "未找到原本体对象类型", message: "未找到原本体或对象类型“售后产品对象”，请重新选择。" },
  "import-api": { title: "API 不可用", resourceName: "客户信息查询 API", detail: "关联 API 当前不可用", message: "当前节点关联的 API“客户信息查询 API”不可用，请重新关联资源。" },
  "import-database-missing": { title: "数据库未匹配", resourceName: "历史服务数据库", detail: "未找到原数据库", message: "未找到原数据库“历史服务数据库”，请重新选择数据库。" },
  "import-workflow": { title: "工作流未恢复", resourceName: "退款审批流程", detail: "原关联对象未能恢复", message: "原工作流“退款审批流程”未能恢复，请重新选择工作流。" },
  "import-agent": { title: "智能体未恢复", resourceName: "售后分析智能体", detail: "原关联对象未能恢复", message: "原智能体“售后分析智能体”未能恢复，请重新选择智能体。" },
  "import-component": { title: "组件未恢复", resourceName: "工单中心组件", detail: "原关联对象未能恢复", message: "原组件“工单中心组件”未能恢复，请重新选择组件。" },
  "import-terminology": { title: "术语库未匹配", resourceName: "产品标准术语库", detail: "未找到原术语库", message: "未找到原术语库“产品标准术语库”，请重新选择术语库。" },
  "import-auth": { title: "鉴权信息缺失", resourceName: "全网检索服务", detail: "鉴权信息未随配置包导入", message: "“全网检索服务”的鉴权信息未导入，请重新完成鉴权。" },
};

function buildImportedPrototypeNodes(_objectType: ImportObjectType, result: "success" | "success_with_warnings") {
  return importedPrototypeNodes.map((node) => {
    const data = { ...node.data };
    if (result === "success") return { ...node, data };
    const issue = IMPORT_ISSUES[node.id];
    if (!issue) return { ...node, data };

    if (node.id === "import-classify") data.model = "";
    if (node.type === "unavailable-object") {
      data.referenceId = "";
      data.referenceName = "";
    }
    data.importIssue = issue;
    return { ...node, data };
  });
}

export function WorkflowEditor({ agentId, importResult = null, importObjectType = "workflow_agent" }: WorkflowEditorProps) {
  // 根据 agentId 加载工作流数据，如果没有则使用默认值
  const workflowData = agentId ? getWorkflowByAgentId(agentId) : null;
  const defaultNodes = importResult ? buildImportedPrototypeNodes(importObjectType, importResult) : workflowData?.nodes || initialNodes;
  const defaultEdges = importResult ? importedPrototypeEdges : workflowData?.edges || initialEdges;

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
    if (importResult) {
      setNodes(buildImportedPrototypeNodes(importObjectType, importResult));
      setEdges(importedPrototypeEdges);
      return;
    }
    const newWorkflowData = agentId ? getWorkflowByAgentId(agentId) : null;
    if (newWorkflowData) {
      setNodes(newWorkflowData.nodes);
      setEdges(newWorkflowData.edges);
    }
  }, [agentId, importObjectType, importResult, setNodes, setEdges]);

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
    (nodeId: string, data: object) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) return node;
          const nextData = { ...node.data, ...data };
          const resourceReconfigured = (node.type === "knowledge" && nextData.knowledgeBaseId)
            || (node.type === "mcp" && nextData.selectedMCP?.id !== node.data?.selectedMCP?.id)
            || (node.type === "llm" && nextData.model)
            || (node.type === "workflow-ref" && nextData.workflowId)
            || (node.type === "unavailable-object" && nextData.referenceId);
          if (resourceReconfigured) delete nextData.importIssue;
          return { ...node, data: nextData };
        })
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
    if (nodes.some((node) => Boolean(node.data?.importIssue))) return;
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

  const hasBlockingImportIssues = nodes.some((node) => Boolean(node.data?.importIssue));

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
                  case "workflow-ref":
                    return "#0ea5e9";
                  case "unavailable-object":
                    return "#f59e0b";
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
          <Button
            variant="default"
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700"
            onClick={handleRun}
            disabled={isExecuting || hasBlockingImportIssues}
            title={hasBlockingImportIssues ? "存在待补配节点，完成配置后才能运行" : undefined}
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
      />
    </div>
  );
}
