"use client";

import { Node } from "reactflow";
import { X, Play, StopCircle, Sparkles, BookOpen, Network, Table, Filter, Database, BarChart3 } from "lucide-react";
import { StartNodeConfig } from "./configs/start-node-config";
import { LLMNodeConfig } from "./configs/llm-node-config";
import { KnowledgeNodeConfig } from "./configs/knowledge-node-config";
import { EndNodeConfig } from "./configs/end-node-config";
import { ObjectQueryNodeConfig } from "./configs/object-query-node-config";
import { TableSelectNodeConfig } from "./configs/data/table-select-node-config";
import { DataClarifyNodeConfig } from "./configs/data/data-clarify-node-config";
import { DataQueryNodeConfig } from "./configs/data/data-query-node-config";
import { DataVisualizeNodeConfig } from "./configs/data/data-visualize-node-config";
import { cn } from "@/lib/utils";

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, data: any) => void;
  onClose: () => void;
}

const getNodeIcon = (type: string | undefined) => {
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
    default:
      return Play;
  }
};

const getNodeLabel = (type: string | undefined) => {
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
      return "对象查询";
    case "table-select":
      return "选表";
    case "data-clarify":
      return "数据澄清";
    case "data-query":
      return "数据查询";
    case "data-visualize":
      return "数据可视化";
    default:
      return "节点";
  }
};

const getNodeColor = (type: string | undefined) => {
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
      return "text-purple-600";
    case "table-select":
    case "data-clarify":
    case "data-query":
    case "data-visualize":
      return "text-purple-600";
    default:
      return "text-slate-600";
  }
};

export function NodeConfigPanel({
  selectedNode,
  onUpdateNode,
  onClose,
}: NodeConfigPanelProps) {
  if (!selectedNode) return null;

  const Icon = getNodeIcon(selectedNode.type);
  const label = getNodeLabel(selectedNode.type);
  const iconColor = getNodeColor(selectedNode.type);

  const handleUpdate = (data: any) => {
    onUpdateNode(selectedNode.id, data);
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] bg-white border-l border-slate-200 shadow-lg z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-5 h-5", iconColor)} />
          <span className="text-base font-semibold text-slate-900">{label}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedNode.type === "start" && (
          <StartNodeConfig
            nodeData={selectedNode.data}
            onUpdate={handleUpdate}
          />
        )}
        {selectedNode.type === "llm" && (
          <LLMNodeConfig
            nodeData={selectedNode.data}
            onUpdate={handleUpdate}
          />
        )}
        {selectedNode.type === "knowledge" && (
          <KnowledgeNodeConfig
            nodeData={selectedNode.data}
            onUpdate={handleUpdate}
          />
        )}
        {selectedNode.type === "end" && (
          <EndNodeConfig
            nodeData={selectedNode.data}
            onUpdate={handleUpdate}
          />
        )}
        {selectedNode.type === "object-query" && (
          <ObjectQueryNodeConfig
            nodeData={selectedNode.data}
            onUpdate={handleUpdate}
          />
        )}
        {selectedNode.type === "table-select" && (
          <TableSelectNodeConfig
            nodeData={selectedNode.data}
            onUpdate={handleUpdate}
          />
        )}
        {selectedNode.type === "data-clarify" && (
          <DataClarifyNodeConfig
            nodeData={selectedNode.data}
            onUpdate={handleUpdate}
          />
        )}
        {selectedNode.type === "data-query" && (
          <DataQueryNodeConfig
            nodeData={selectedNode.data}
            onUpdate={handleUpdate}
          />
        )}
        {selectedNode.type === "data-visualize" && (
          <DataVisualizeNodeConfig
            nodeData={selectedNode.data}
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </div>
  );
}
