"use client";

import { useState, useEffect } from "react";
import { Edit2, Network, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Node, Edge } from "reactflow";
import { OntologyConfigDialog, type OntologyConfig } from "@/components/agent-editor/OntologyConfigDialog";
import { VariableSelector } from "../variable-selector";
import { cn } from "@/lib/utils";

interface ObjectQueryNodeData {
  description?: string;
  ontologyConfig?: OntologyConfig;
  inputVariables?: Array<{ name: string; value: string; required?: boolean }>;
}

interface ObjectQueryNodeConfigProps {
  nodeData?: ObjectQueryNodeData;
  onUpdate: (data: ObjectQueryNodeData) => void;
  currentNodeId: string;
  nodes: Node[];
  edges: Edge[];
}

// 获取对象类型的图标（根据对象类型名称）
const getObjectTypeIcon = (objectType: string) => {
  if (objectType.includes("历史") || objectType.includes("战例")) {
    return BookOpen;
  }
  return Network;
};

// 获取检索方式标签
const getRetrievalMethodLabel = (method: "structured" | "semantic" | undefined) => {
  if (method === "structured") {
    return "结构化检索";
  } else if (method === "semantic") {
    return "语义检索";
  }
  return "未设置";
};

export function ObjectQueryNodeConfig({
  nodeData,
  onUpdate,
  currentNodeId,
  nodes,
  edges,
}: ObjectQueryNodeConfigProps) {
  const [description, setDescription] = useState(nodeData?.description || "");
  const [ontologyDialogOpen, setOntologyDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputVariables, setInputVariables] = useState<
    Array<{ name: string; value: string; required?: boolean }>
  >(
    nodeData?.inputVariables || [{ name: "query", value: "开始/query", required: true }]
  );

  const ontologyConfig = nodeData?.ontologyConfig;
  const hasConfig = !!ontologyConfig && !!ontologyConfig.objectType;

  // 当 nodeData 变化时，更新本地状态
  useEffect(() => {
    if (nodeData?.description !== undefined) {
      setDescription(nodeData.description);
    }
    if (nodeData?.inputVariables) {
      setInputVariables(nodeData.inputVariables);
    }
  }, [nodeData]);

  const handleOntologyConfigSave = (config: OntologyConfig) => {
    onUpdate({
      ...nodeData,
      ontologyConfig: config,
    });
    setIsEditing(false);
    setOntologyDialogOpen(false);
  };

  const handleUpdateInputVariable = (
    index: number,
    field: "name" | "value",
    value: string
  ) => {
    const updated = inputVariables.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    setInputVariables(updated);
    onUpdate({ ...nodeData, inputVariables: updated });
  };

  const handleAddInputVariable = () => {
    const newVar = { name: "", value: "", required: false };
    const updated = [...inputVariables, newVar];
    setInputVariables(updated);
    onUpdate({ ...nodeData, inputVariables: updated });
  };

  const handleRemoveInputVariable = (index: number) => {
    const updated = inputVariables.filter((_, i) => i !== index);
    setInputVariables(updated);
    onUpdate({ ...nodeData, inputVariables: updated });
  };

  // 获取上游节点信息（用于显示输入变量映射）
  const getUpstreamNodeInfo = (value: string) => {
    if (!value || !value.includes("/")) return null;
    const [nodeId, varName] = value.split("/");
    const upstreamNode = nodes.find((n) => n.id === nodeId);
    if (!upstreamNode) return null;
    
    // 获取节点标签
    const getNodeLabel = (type: string | undefined) => {
      switch (type) {
        case "start": return "开始";
        case "llm": return "大模型";
        case "object-query": return "本体对象";
        case "mcp": return "MCP";
        default: return type || "节点";
      }
    };
    
    return {
      nodeId,
      nodeLabel: upstreamNode.data?.description || getNodeLabel(upstreamNode.type),
      varName,
    };
  };

  return (
    <div className="space-y-6">
      {/* 描述 */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">节点描述</label>
        <Input
          placeholder="添加描述..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            onUpdate({ ...nodeData, description: e.target.value });
          }}
          className="w-full"
        />
      </div>

      {/* 配置概览卡片 */}
      {hasConfig && !isEditing && (
        <div className="border border-slate-200 rounded-lg bg-white">
          {/* Card Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = getObjectTypeIcon(ontologyConfig!.objectType);
                return (
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-orange-600" />
                  </div>
                );
              })()}
              <div>
                <div className="text-sm font-medium text-slate-900">
                  {ontologyConfig!.objectType}
                </div>
                <div className="text-xs text-slate-500">
                  {ontologyConfig!.ontology}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(true);
                setOntologyDialogOpen(true);
              }}
              className="h-8 gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span className="text-xs">编辑配置</span>
            </Button>
          </div>

          {/* Card Body */}
          <div className="px-4 py-3 space-y-2">
            {/* 检索方式 */}
            <div className="flex items-center gap-2">
              <Badge
                variant={ontologyConfig!.retrievalMethod === "semantic" ? "default" : "secondary"}
                className="text-xs"
              >
                {getRetrievalMethodLabel(ontologyConfig!.retrievalMethod)}
              </Badge>
            </div>

            {/* 关键参数 */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">TopK:</span>
                <span className="ml-1 text-slate-900 font-medium">
                  {ontologyConfig!.topK ?? 20}
                </span>
              </div>
              {ontologyConfig!.retrievalMethod === "semantic" && (
                <div>
                  <span className="text-slate-500">语义权重:</span>
                  <span className="ml-1 text-slate-900 font-medium">
                    {((ontologyConfig!.semanticWeight ?? 0.6) * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-500">阈值:</span>
                <span className="ml-1 text-slate-900 font-medium">
                  {((ontologyConfig!.threshold ?? 0.6) * 100).toFixed(0)}%
                </span>
              </div>
              {ontologyConfig!.property && (
                <div>
                  <span className="text-slate-500">检索字段:</span>
                  <span className="ml-1 text-slate-900 font-medium">
                    {ontologyConfig!.property}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 未配置状态 */}
      {!hasConfig && !isEditing && (
        <div className="border border-dashed border-slate-300 rounded-lg bg-slate-50 p-6 text-center">
          <Network className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 mb-3">未配置对象类型</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsEditing(true);
              setOntologyDialogOpen(true);
            }}
          >
            添加配置
          </Button>
        </div>
      )}

      {/* 输入变量映射区域 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-900">输入变量</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddInputVariable}
            className="h-7 text-xs"
          >
            添加变量
          </Button>
        </div>
        <div className="space-y-2">
          {inputVariables.map((variable, index) => {
            const upstreamInfo = getUpstreamNodeInfo(variable.value);
            return (
              <div
                key={index}
                className="border border-slate-200 rounded-lg p-3 bg-slate-50/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-900">
                      {variable.name || `变量 ${index + 1}`}
                    </span>
                    {variable.required && (
                      <span className="text-xs text-red-500">*</span>
                    )}
                  </div>
                  {inputVariables.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveInputVariable(index)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                    >
                      ×
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {/* 变量名输入 */}
                  <Input
                    placeholder="变量名"
                    value={variable.name}
                    onChange={(e) =>
                      handleUpdateInputVariable(index, "name", e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                  {/* 变量值选择 */}
                  <VariableSelector
                    value={variable.value}
                    onSelect={(value) =>
                      handleUpdateInputVariable(index, "value", value)
                    }
                    currentNodeId={currentNodeId}
                    nodes={nodes}
                    edges={edges}
                    placeholder="选择上游节点输出"
                    className="text-sm"
                  />
                  {/* 显示上游节点信息 */}
                  {upstreamInfo && (
                    <div className="text-xs text-slate-500 bg-white rounded px-2 py-1 border border-slate-200">
                      <span className="font-medium">{upstreamInfo.nodeLabel}</span>
                      <span className="mx-1">→</span>
                      <span>{upstreamInfo.varName}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 输出 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">输出</h3>
        <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-200">
          <div className="text-sm text-slate-700">
            <span className="font-medium">objectSets</span>{" "}
            <span className="text-slate-500">Array[Object]</span>
          </div>
          <div className="pl-4 space-y-1 mt-2">
            <div className="text-xs text-slate-600">
              <span className="font-medium">objectName</span> String - 对象名称
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-medium">objectID</span> String - 对象ID
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-medium">metadata</span> Object - 元数据
            </div>
          </div>
        </div>
      </div>

      {/* Ontology Config Dialog */}
      <OntologyConfigDialog
        open={ontologyDialogOpen}
        onOpenChange={(open) => {
          setOntologyDialogOpen(open);
          if (!open) {
            setIsEditing(false);
          }
        }}
        initialConfig={ontologyConfig}
        onSave={handleOntologyConfigSave}
      />
    </div>
  );
}
