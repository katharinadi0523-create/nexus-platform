"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, MinusCircle, AlertCircle } from "lucide-react";
import { FlowRuntimeResult, NodeRuntime } from "./workflow-runner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface WorkflowResultPanelProps {
  result: FlowRuntimeResult | null;
  onClose: () => void;
  onNodeClick?: (nodeId: string) => void;
  isExecuting?: boolean;
}

function NodeResultItem({
  nodeId,
  nodeRuntime,
  onNodeClick,
}: {
  nodeId: string;
  nodeRuntime: NodeRuntime;
  onNodeClick?: (nodeId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

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

  const getStatusColor = () => {
    switch (nodeRuntime.status) {
      case "success":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "skipped":
        return "text-slate-400";
      case "running":
        return "text-blue-600";
      default:
        return "text-slate-600";
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
        {getStatusIcon()}
        <span className="flex-1 text-sm font-medium text-slate-900">
          {nodeId}
        </span>
        <span className={cn("text-xs", getStatusColor())}>
          {nodeRuntime.status === "success"
            ? "成功"
            : nodeRuntime.status === "failed"
            ? "失败"
            : nodeRuntime.status === "running"
            ? "执行中..."
            : "跳过"}
        </span>
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
}: WorkflowResultPanelProps) {
  if (!result) return null;

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
                return (
                  <NodeResultItem
                    key={nodeId}
                    nodeId={nodeId}
                    nodeRuntime={nodeRuntime}
                    onNodeClick={onNodeClick}
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
