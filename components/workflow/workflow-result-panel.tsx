"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, MinusCircle, AlertCircle, Play, StopCircle, Sparkles, BookOpen, Network, Table, Filter, Database, BarChart3, Bot, GitBranch, Eye, Code, Package, LucideIcon } from "lucide-react";
import { FlowRuntimeResult, NodeRuntime } from "./workflow-runner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Node } from "reactflow";

interface WorkflowResultPanelProps {
  result: FlowRuntimeResult | null;
  onClose: () => void;
  onNodeClick?: (nodeId: string) => void;
  isExecuting?: boolean;
  nodes?: Node[];
}

// 获取节点图标
const getNodeIcon = (type: string | undefined): LucideIcon => {
  switch (type) {
    case "start":
      return Play;
    case "end":
      return StopCircle;
    case "llm":
      return Sparkles;
    case "knowledge":
      return BookOpen;
    case "object-query":
      return Network;
    case "table-select":
      return Table;
    case "data-clarify":
      return Filter;
    case "data-query":
      return Database;
    case "data-visualize":
      return BarChart3;
    case "agent":
      return Bot;
    case "branch":
      return GitBranch;
    case "intent-recognize":
      return Eye;
    case "code":
      return Code;
    case "mcp":
      return Package;
    default:
      return Play;
  }
};

// 获取节点默认标签
const getNodeLabel = (type: string | undefined): string => {
  switch (type) {
    case "start":
      return "开始";
    case "end":
      return "结束";
    case "llm":
      return "大模型";
    case "knowledge":
      return "知识检索";
    case "object-query":
      return "本体对象";
    case "table-select":
      return "选表";
    case "data-clarify":
      return "数据澄清";
    case "data-query":
      return "数据查询";
    case "data-visualize":
      return "数据可视化";
    case "agent":
      return "智能体";
    case "branch":
      return "分支器";
    case "intent-recognize":
      return "意图识别";
    case "code":
      return "代码";
    case "mcp":
      return "MCP";
    default:
      return "节点";
  }
};

// 获取节点颜色
const getNodeColor = (type: string | undefined): string => {
  switch (type) {
    case "start":
      return "text-green-600";
    case "end":
      return "text-red-600";
    case "llm":
      return "text-blue-600";
    case "knowledge":
      return "text-purple-600";
    case "object-query":
      return "text-orange-600";
    case "table-select":
    case "data-clarify":
    case "data-query":
    case "data-visualize":
      return "text-purple-600";
    case "agent":
      return "text-blue-600";
    case "branch":
      return "text-orange-600";
    case "intent-recognize":
      return "text-blue-600";
    case "code":
      return "text-orange-600";
    case "mcp":
      return "text-green-600";
    default:
      return "text-slate-600";
  }
};

function NodeResultItem({
  nodeId,
  nodeRuntime,
  onNodeClick,
  node,
}: {
  nodeId: string;
  nodeRuntime: NodeRuntime;
  onNodeClick?: (nodeId: string) => void;
  node?: Node;
}) {
  const [expanded, setExpanded] = useState(false);
  
  // 获取节点图标、名称和颜色
  const nodeType = node?.type || nodeRuntime.nodeType;
  const Icon = getNodeIcon(nodeType);
  const nodeName = node?.data?.description || node?.data?.label || getNodeLabel(nodeType);
  const iconColor = getNodeColor(nodeType);

  const getStatusIcon = () => {
    switch (nodeRuntime.status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "skipped":
        return <MinusCircle className="w-4 h-4 text-slate-400" />;
      case "running":
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg mb-2">
      <button
        onClick={() => {
          setExpanded(!expanded);
          if (onNodeClick) {
            onNodeClick(nodeId);
          }
        }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
        <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-100">
          <Icon className={cn("w-3.5 h-3.5", iconColor)} />
        </div>
        <span className="flex-1 text-sm font-medium text-slate-900">
          {nodeName}
        </span>
        {getStatusIcon()}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-200">
          {/* 节点类型 */}
          <div>
            <div className="text-xs font-medium text-slate-600 mb-1">节点类型</div>
            <div className="text-sm text-slate-900 bg-slate-50 rounded px-2 py-1">
              {nodeRuntime.nodeType}
            </div>
          </div>

          {/* 输入 */}
          <div>
            <div className="text-xs font-medium text-slate-600 mb-1">输入</div>
            <pre className="text-xs bg-slate-50 rounded p-2 overflow-auto max-h-40">
              {JSON.stringify(nodeRuntime.inputActual, null, 2)}
            </pre>
          </div>

          {/* 输出 */}
          <div>
            <div className="text-xs font-medium text-slate-600 mb-1">输出</div>
            <pre className="text-xs bg-slate-50 rounded p-2 overflow-auto max-h-40">
              {JSON.stringify(nodeRuntime.outputActual, null, 2)}
            </pre>
          </div>

          {/* 日志 */}
          {nodeRuntime.logs && nodeRuntime.logs.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-600 mb-1">日志</div>
              <div className="space-y-1">
                {nodeRuntime.logs.map((log, index) => (
                  <div key={index} className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function WorkflowResultPanel({
  result,
  onClose,
  onNodeClick,
  isExecuting = false,
  nodes = [],
}: WorkflowResultPanelProps) {
  if (!result) return null;
  
  // 创建节点映射，方便快速查找
  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  // 根据执行状态动态设置默认tab：运行中显示"节点执行"，运行结束显示"最终输出"
  const [activeTab, setActiveTab] = useState<string>(isExecuting ? "nodes" : "output");

  // 当执行状态变化时，自动切换tab
  useEffect(() => {
    if (!isExecuting && result.endedAt) {
      // 执行结束时，切换到"最终输出"tab
      setActiveTab("output");
    } else if (isExecuting) {
      // 开始执行时，切换到"节点执行"tab
      setActiveTab("nodes");
    }
  }, [isExecuting, result.endedAt]);

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] bg-white border-l border-slate-200 shadow-lg z-30 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-slate-900">运行结果</span>
          {result.status === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded transition-colors"
        >
          <span className="text-slate-500">×</span>
        </button>
      </div>

      {/* Body with Tabs */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mb-2 mt-4">
            <TabsTrigger value="output">最终输出</TabsTrigger>
            <TabsTrigger value="nodes">节点执行</TabsTrigger>
          </TabsList>

          <TabsContent value="output" className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-4">
              {/* 状态信息 */}
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">状态</span>
                  <span
                    className={cn(
                      "font-medium",
                      result.status === "success" ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {result.status === "success" ? "成功" : "失败"}
                  </span>
                </div>
                {result.endedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">执行时间</span>
                    <span className="text-slate-900">
                      {((result.endedAt - result.startedAt) / 1000).toFixed(2)}s
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">执行节点数</span>
                  <span className="text-slate-900">{result.nodeOrder.length}</span>
                </div>
              </div>

              {/* 警告 */}
              {result.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">警告</span>
                  </div>
                  <div className="space-y-1">
                    {result.warnings.map((warning, index) => (
                      <div key={index} className="text-xs text-yellow-800">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 最终输出 */}
              <div>
                <div className="text-sm font-medium text-slate-900 mb-2">输出内容</div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result.finalOutput, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="nodes" className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              {result.nodeOrder.map((nodeId) => {
                const nodeRuntime = result.nodeResults[nodeId];
                if (!nodeRuntime) return null;
                const node = nodeMap.get(nodeId);
                return (
                  <NodeResultItem
                    key={nodeId}
                    nodeId={nodeId}
                    nodeRuntime={nodeRuntime}
                    onNodeClick={onNodeClick}
                    node={node}
                  />
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
