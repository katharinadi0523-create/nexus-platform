"use client";

import { useState } from "react";
import { Plus, ChevronRight, Sparkles, X, Maximize2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ModelSelector, type ModelParams } from "@/components/agent-editor/ModelSelector";
import { Node, Edge } from "reactflow";
import { VariableSelector } from "../variable-selector";

interface LLMNodeData {
  description?: string;
  model?: string;
  modelParams?: ModelParams;
  context?: string;
  prompt?: string;
  inputVariables?: Array<{ name: string; type: string; value?: string }>;
  outputVariables?: Array<{ name: string; type: string }>;
}

interface LLMNodeConfigProps {
  nodeData?: LLMNodeData;
  onUpdate: (data: LLMNodeData) => void;
  currentNodeId?: string;
  nodes?: Node[];
  edges?: Edge[];
}

const outputTypeOptions = [
  { value: "string", label: "string" },
  { value: "number", label: "number" },
  { value: "boolean", label: "boolean" },
  { value: "array[string]", label: "array[string]" },
  { value: "array[number]", label: "array[number]" },
  { value: "array[boolean]", label: "array[boolean]" },
  { value: "array[object]", label: "array[object]" },
  { value: "object", label: "object" },
];

export function LLMNodeConfig({
  nodeData,
  onUpdate,
  currentNodeId = "",
  nodes = [],
  edges = [],
}: LLMNodeConfigProps) {
  const [description, setDescription] = useState(nodeData?.description || "");
  const [model, setModel] = useState(nodeData?.model || "DeepSeek-R2");
  const [modelParams, setModelParams] = useState<ModelParams>(
    nodeData?.modelParams || {}
  );
  const [context, setContext] = useState(nodeData?.context || "");
  const [prompt, setPrompt] = useState(
    nodeData?.prompt || ""
  );
  const [inputVariables, setInputVariables] = useState<
    Array<{ name: string; type: string; value?: string }>
  >(nodeData?.inputVariables || []);
  const [outputVariables, setOutputVariables] = useState<
    Array<{ name: string; type: string }>
  >(nodeData?.outputVariables || [{ name: "text", type: "string" }]);

  const handleUpdate = (field: keyof LLMNodeData, value: any) => {
    const updated = { ...nodeData, [field]: value };
    onUpdate(updated);
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    handleUpdate("model", newModel);
  };

  const handleModelParamsChange = (newParams: ModelParams) => {
    setModelParams(newParams);
    handleUpdate("modelParams", newParams);
  };

  const handleAddOutputVariable = () => {
    const updated = [
      ...outputVariables,
      { name: "", type: "string" },
    ];
    setOutputVariables(updated);
    handleUpdate("outputVariables", updated);
  };

  const handleUpdateOutputVariable = (
    index: number,
    field: "name" | "type",
    value: string
  ) => {
    const updated = outputVariables.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    setOutputVariables(updated);
    handleUpdate("outputVariables", updated);
  };

  const handleRemoveOutputVariable = (index: number) => {
    const updated = outputVariables.filter((_, i) => i !== index);
    setOutputVariables(updated);
    handleUpdate("outputVariables", updated);
  };

  const handleAddInputVariable = () => {
    const newVariable = { name: "", type: "string", value: "" };
    const updated = [...inputVariables, newVariable];
    setInputVariables(updated);
    handleUpdate("inputVariables", updated);
  };

  const handleUpdateInputVariable = (
    index: number,
    field: "name" | "type" | "value",
    value: string
  ) => {
    const updated = inputVariables.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    setInputVariables(updated);
    handleUpdate("inputVariables", updated);
  };

  const handleRemoveInputVariable = (index: number) => {
    const updated = inputVariables.filter((_, i) => i !== index);
    setInputVariables(updated);
    handleUpdate("inputVariables", updated);
  };

  const handleSelectInputVariable = (index: number, variablePath: string) => {
    const updated = inputVariables.map((v, i) =>
      i === index ? { ...v, value: variablePath } : v
    );
    setInputVariables(updated);
    handleUpdate("inputVariables", updated);
  };

  return (
    <div className="space-y-6">
      {/* 描述 */}
      <div>
        <Input
          placeholder="添加描述..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            handleUpdate("description", e.target.value);
          }}
          className="w-full"
        />
      </div>

      {/* 模型 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">模型</h3>
        <ModelSelector
          selectedModel={model}
          modelParams={modelParams}
          onModelChange={handleModelChange}
          onParamsChange={handleModelParamsChange}
        />
      </div>

      {/* 输入变量 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">输入变量</h3>
        {inputVariables.length > 0 ? (
          <div className="space-y-2">
            {inputVariables.map((variable, index) => (
              <div
                key={index}
                className="space-y-2 bg-slate-50 rounded-lg p-2"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={variable.name}
                    onChange={(e) =>
                      handleUpdateInputVariable(index, "name", e.target.value)
                    }
                    placeholder="变量名"
                    className="flex-1 text-sm"
                  />
                  <Select
                    value={variable.type}
                    onValueChange={(value) =>
                      handleUpdateInputVariable(index, "type", value)
                    }
                    options={outputTypeOptions}
                    className="w-[140px] text-sm"
                  />
                  <button
                    onClick={() => handleRemoveInputVariable(index)}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
                <VariableSelector
                  nodes={nodes}
                  edges={edges}
                  currentNodeId={currentNodeId}
                  value={variable.value}
                  onSelect={(path) => handleSelectInputVariable(index, path)}
                  placeholder="选择上游节点输出"
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-3 text-center text-sm text-slate-500">
            未配置变量
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddInputVariable}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          添加输入变量
        </Button>
      </div>

      {/* 上下文 */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-medium text-slate-900">上下文</h3>
          <button className="text-slate-400 hover:text-slate-600">
            <span className="text-xs">?</span>
          </button>
        </div>
        <VariableSelector
          nodes={nodes}
          edges={edges}
          currentNodeId={currentNodeId}
          value={context}
          onSelect={(path) => {
            setContext(path);
            handleUpdate("context", path);
          }}
          placeholder="设置变量值"
        />
      </div>

      {/* 提示词 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">提示词</h3>
        <div className="relative">
          <Textarea
            placeholder="在这里写你的提示词,输入'{'插入变量、输入'/'插入提示..."
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              handleUpdate("prompt", e.target.value);
            }}
            className="w-full min-h-[120px] pr-20"
          />
          <div className="absolute right-2 top-2 flex items-center gap-1">
            <button className="p-1 hover:bg-slate-100 rounded">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </button>
            <button className="p-1 hover:bg-slate-100 rounded">
              <X className="w-4 h-4 text-slate-400" />
            </button>
            <button className="p-1 hover:bg-slate-100 rounded">
              <Maximize2 className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 输出 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">输出</h3>
        {outputVariables.length === 0 ? (
          <div className="bg-slate-50 rounded-lg p-3 text-center text-sm text-slate-500">
            未配置变量
          </div>
        ) : (
          <div className="space-y-2">
            {outputVariables.map((variable, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-slate-50 rounded-lg p-2"
              >
                <Input
                  value={variable.name}
                  onChange={(e) =>
                    handleUpdateOutputVariable(index, "name", e.target.value)
                  }
                  placeholder="变量名"
                  className="flex-1 text-sm"
                />
                <Select
                  value={variable.type}
                  onValueChange={(value) =>
                    handleUpdateOutputVariable(index, "type", value)
                  }
                  options={outputTypeOptions}
                  className="w-[140px] text-sm"
                />
                {outputVariables.length > 1 && (
                  <button
                    onClick={() => handleRemoveOutputVariable(index)}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddOutputVariable}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            添加变量
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <ChevronRight className="w-4 h-4" />
            JSON导入
          </Button>
        </div>
      </div>
    </div>
  );
}
