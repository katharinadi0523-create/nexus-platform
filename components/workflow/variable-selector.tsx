"use client";

import { useState, useMemo } from "react";
import { Node, Edge } from "reactflow";
import { Check, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface VariableSelectorProps {
  nodes: Node[];
  edges: Edge[];
  currentNodeId: string;
  value?: string;
  onSelect: (variablePath: string) => void;
  placeholder?: string;
  className?: string;
}

interface VariableOption {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  variableName: string;
  variableType: string;
  path: string; // 格式: "节点名 - 变量名"
}

// 获取节点标签的辅助函数
const getNodeLabel = (nodeType: string): string => {
  const labelMap: Record<string, string> = {
    start: "开始",
    end: "结束",
    llm: "大模型",
    knowledge: "知识检索",
    agent: "智能体",
    branch: "分支器",
    "intent-recognize": "意图识别",
    code: "代码",
    "table-select": "选表",
    "data-clarify": "数据澄清",
    "data-query": "数据查询",
    "data-visualize": "数据可视化",
    "object-query": "本体对象",
    "mcp": "MCP",
  };
  return labelMap[nodeType] || "节点";
};

// 获取开始节点的默认输入变量（系统变量）
const getStartNodeInputVariables = (): Array<{ name: string; type: string }> => {
  return [
    { name: "query", type: "string" },
    { name: "files", type: "array" },
  ];
};

// 获取节点的默认输出变量
const getDefaultOutputVariables = (nodeType: string): Array<{ name: string; type: string }> => {
  const defaultOutputsMap: Record<string, Array<{ name: string; type: string }>> = {
    llm: [
      { name: "text", type: "string" },
    ],
    knowledge: [
      { name: "result", type: "array[object]" },
    ],
    agent: [
      { name: "answer", type: "String" },
      { name: "ruleIntervention", type: "String" },
    ],
    code: [
      { name: "result", type: "str" },
    ],
    "intent-recognize": [
      { name: "classification", type: "String" },
      { name: "classificationId", type: "String" },
    ],
    "table-select": [
      { name: "resultSet", type: "Array[Object]" },
      { name: "message", type: "String" },
    ],
    "data-clarify": [
      { name: "resultSet", type: "Array[Object]" },
    ],
    "data-query": [
      { name: "resultSet", type: "Array[Object]" },
      { name: "queryCode", type: "String" },
      { name: "message", type: "String" },
    ],
    "data-visualize": [
      { name: "chartContent", type: "Object" },
      { name: "message", type: "String" },
    ],
    "object-query": [
      { name: "objectSets", type: "Array[Object]" },
    ],
    "mcp": [
      { name: "result", type: "Any" },
      { name: "success", type: "Boolean" },
    ],
  };
  return defaultOutputsMap[nodeType] || [];
};

export function VariableSelector({
  nodes,
  edges,
  currentNodeId,
  value,
  onSelect,
  placeholder = "选择变量",
  className,
}: VariableSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 获取上游节点（通过 edges 找到所有连接到当前节点的节点）
  const upstreamNodes = useMemo(() => {
    const upstreamNodeIds = new Set<string>();
    edges.forEach((edge) => {
      if (edge.target === currentNodeId) {
        upstreamNodeIds.add(edge.source);
      }
    });
    return nodes.filter((node) => upstreamNodeIds.has(node.id));
  }, [nodes, edges, currentNodeId]);

  // 获取所有可用的变量选项
  const variableOptions = useMemo(() => {
    const options: VariableOption[] = [];
    
    upstreamNodes.forEach((node) => {
      const nodeLabel = node.data?.label || getNodeLabel(node.type || "");
      const nodeType = node.type || "";
      
      // 开始节点特殊处理：读取输入变量而不是输出变量
      if (nodeType === "start") {
        // 系统变量（query, files）
        const systemVariables = getStartNodeInputVariables();
        systemVariables.forEach((variable) => {
          options.push({
            nodeId: node.id,
            nodeLabel,
            nodeType,
            variableName: variable.name,
            variableType: variable.type,
            path: `${nodeLabel}/${variable.name}`,
          });
        });
        
        // 自定义输入变量
        const inputVariables = node.data?.inputVariables || [];
        inputVariables.forEach((variable: { name: string; type: string; id?: string }) => {
          options.push({
            nodeId: node.id,
            nodeLabel,
            nodeType,
            variableName: variable.name,
            variableType: variable.type,
            path: `${nodeLabel}/${variable.name}`,
          });
        });
      } else {
        // 其他节点：读取输出变量
        const outputVariables = node.data?.outputVariables || [];
        
        // 如果没有 outputVariables，尝试从节点类型推断默认输出
        if (outputVariables.length === 0) {
          // 为某些节点类型提供默认输出变量
          const defaultOutputs = getDefaultOutputVariables(nodeType);
          defaultOutputs.forEach((variable) => {
            options.push({
              nodeId: node.id,
              nodeLabel,
              nodeType,
              variableName: variable.name,
              variableType: variable.type,
              path: `${nodeLabel} - ${variable.name}`,
            });
          });
        } else {
          outputVariables.forEach((variable: { name: string; type: string }) => {
            options.push({
              nodeId: node.id,
              nodeLabel,
              nodeType,
              variableName: variable.name,
              variableType: variable.type,
              path: `${nodeLabel} - ${variable.name}`,
            });
          });
        }
      }
    });

    return options;
  }, [upstreamNodes]);

  // 过滤选项
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return variableOptions;
    const query = searchQuery.toLowerCase();
    return variableOptions.filter(
      (option) =>
        option.nodeLabel.toLowerCase().includes(query) ||
        option.variableName.toLowerCase().includes(query) ||
        option.path.toLowerCase().includes(query)
    );
  }, [variableOptions, searchQuery]);

  const selectedOption = variableOptions.find((opt) => opt.path === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("w-full justify-start text-sm text-slate-600", className)}
        >
          {selectedOption ? (
            <span className="truncate">{selectedOption.path}</span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" sideOffset={8}>
        <div className="p-3">
          {/* 搜索框 */}
          <Input
            placeholder="搜索变量..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />

          {/* 变量列表 */}
          <div className="max-h-[300px] overflow-y-auto">
            {filteredOptions.length > 0 ? (
              <div className="space-y-1">
                {filteredOptions.map((option, index) => (
                  <button
                    key={`${option.nodeId}-${option.variableName}-${index}`}
                    onClick={() => {
                      onSelect(option.path);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left",
                      value === option.path && "bg-blue-50"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-900 truncate">
                        {option.path}
                      </div>
                      <div className="text-xs text-slate-500">
                        {option.variableType}
                      </div>
                    </div>
                    {value === option.path && (
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-500">
                {upstreamNodes.length === 0
                  ? "没有可用的上游节点"
                  : searchQuery
                  ? "未找到匹配的变量"
                  : "上游节点没有输出变量"}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
