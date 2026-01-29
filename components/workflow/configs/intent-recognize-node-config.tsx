"use client";

import { useState } from "react";
import { Plus, Trash2, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ModelSelector, type ModelParams } from "@/components/agent-editor/ModelSelector";
import { Node, Edge } from "reactflow";
import { VariableSelector } from "../variable-selector";

interface Intent {
  name: string;
  description: string;
}

interface IntentRecognizeNodeData {
  description?: string;
  model?: string;
  modelParams?: ModelParams;
  inputVariables?: Array<{ name: string; type: string; value?: string }>;
  intents?: Intent[];
}

interface IntentRecognizeNodeConfigProps {
  nodeData?: IntentRecognizeNodeData;
  onUpdate: (data: IntentRecognizeNodeData) => void;
  currentNodeId?: string;
  nodes?: Node[];
  edges?: Edge[];
}

const typeOptions = [
  { value: "string", label: "string" },
  { value: "number", label: "number" },
  { value: "boolean", label: "boolean" },
  { value: "array[string]", label: "array[string]" },
  { value: "array[number]", label: "array[number]" },
  { value: "array[boolean]", label: "array[boolean]" },
  { value: "array[object]", label: "array[object]" },
  { value: "object", label: "object" },
];

export function IntentRecognizeNodeConfig({
  nodeData,
  onUpdate,
  currentNodeId = "",
  nodes = [],
  edges = [],
}: IntentRecognizeNodeConfigProps) {
  const [description, setDescription] = useState(nodeData?.description || "");
  const [model, setModel] = useState(nodeData?.model || "");
  const [modelParams, setModelParams] = useState<ModelParams>(
    nodeData?.modelParams || {}
  );
  const [inputVariables, setInputVariables] = useState<
    Array<{ name: string; type: string; value?: string }>
  >(
    nodeData?.inputVariables || [{ name: "*query", type: "string", value: "" }]
  );
  const [intents, setIntents] = useState<Intent[]>(
    nodeData?.intents || []
  );

  const handleUpdateInputVariable = (
    index: number,
    field: "name" | "type" | "value",
    value: string
  ) => {
    const updated = inputVariables.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    setInputVariables(updated);
    onUpdate({ ...nodeData, inputVariables: updated });
  };

  const handleAddInputVariable = () => {
    const newVariable = { name: "", type: "string", value: "" };
    const updated = [...inputVariables, newVariable];
    setInputVariables(updated);
    onUpdate({ ...nodeData, inputVariables: updated });
  };

  const handleRemoveInputVariable = (index: number) => {
    const updated = inputVariables.filter((_, i) => i !== index);
    setInputVariables(updated);
    onUpdate({ ...nodeData, inputVariables: updated });
  };

  const handleSelectInputVariable = (index: number, variablePath: string) => {
    const updated = inputVariables.map((v, i) =>
      i === index ? { ...v, value: variablePath } : v
    );
    setInputVariables(updated);
    onUpdate({ ...nodeData, inputVariables: updated });
  };

  const handleAddIntent = () => {
    const newIntent: Intent = {
      name: "",
      description: "",
    };
    const updated = [...intents, newIntent];
    setIntents(updated);
    onUpdate({ ...nodeData, intents: updated });
  };

  const handleUpdateIntent = (
    index: number,
    field: keyof Intent,
    value: string
  ) => {
    const updated = intents.map((intent, i) =>
      i === index ? { ...intent, [field]: value } : intent
    );
    setIntents(updated);
    onUpdate({ ...nodeData, intents: updated });
  };

  const handleRemoveIntent = (index: number) => {
    const updated = intents.filter((_, i) => i !== index);
    setIntents(updated);
    onUpdate({ ...nodeData, intents: updated });
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    onUpdate({ ...nodeData, model: newModel });
  };

  const handleModelParamsChange = (newParams: ModelParams) => {
    setModelParams(newParams);
    onUpdate({ ...nodeData, modelParams: newParams });
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
            onUpdate({ ...nodeData, description: e.target.value });
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
                    value={variable.name.replace(/^\*/, "")}
                    onChange={(e) => {
                      const newName = variable.name.startsWith("*")
                        ? `*${e.target.value}`
                        : e.target.value;
                      handleUpdateInputVariable(index, "name", newName);
                    }}
                    placeholder="变量名"
                    className="flex-1 text-sm"
                  />
                  <Select
                    value={variable.type}
                    onValueChange={(value) =>
                      handleUpdateInputVariable(index, "type", value)
                    }
                    options={typeOptions}
                    className="w-[140px] text-sm"
                  />
                  <button
                    onClick={() => handleRemoveInputVariable(index)}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {variable.name.startsWith("*") && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                  <VariableSelector
                    nodes={nodes}
                    edges={edges}
                    currentNodeId={currentNodeId}
                    value={variable.value}
                    onSelect={(path) => handleSelectInputVariable(index, path)}
                    placeholder="选择上游节点输出"
                    className="flex-1 text-sm"
                  />
                </div>
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
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          添加输入变量
        </Button>
      </div>

      {/* 意图配置 */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-900">意图配置</h3>
        <div className="space-y-3">
          {intents.map((intent, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-900">
                  意图{index + 1}
                </h4>
                <button
                  onClick={() => handleRemoveIntent(index)}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">
                    意图名称:
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="请输入意图名称"
                      value={intent.name}
                      onChange={(e) =>
                        handleUpdateIntent(index, "name", e.target.value)
                      }
                      className="w-full pr-12"
                      maxLength={20}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      {intent.name.length}/20
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-600 mb-1 block">
                    意图描述:
                  </label>
                  <div className="relative">
                    <Textarea
                      placeholder="请描述意图的含义、使用场景,或提供例句,便于大模型更好识别该意图"
                      value={intent.description}
                      onChange={(e) =>
                        handleUpdateIntent(index, "description", e.target.value)
                      }
                      className="w-full min-h-[80px] pr-12"
                      maxLength={300}
                    />
                    <div className="absolute right-2 bottom-2 text-xs text-slate-400">
                      {intent.description.length}/300
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddIntent}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          新增意图
        </Button>
      </div>

      {/* 输出 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">输出</h3>
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          <div className="text-sm text-slate-700">
            <span className="font-medium">classification</span>{" "}
            <span className="text-slate-500">String</span>
          </div>
          <div className="text-xs text-slate-500">识别的对应意图</div>
          <div className="text-sm text-slate-700 mt-2">
            <span className="font-medium">classificationId</span>{" "}
            <span className="text-slate-500">String</span>
          </div>
          <div className="text-xs text-slate-500">识别的对应意图的序号</div>
        </div>
      </div>
    </div>
  );
}
