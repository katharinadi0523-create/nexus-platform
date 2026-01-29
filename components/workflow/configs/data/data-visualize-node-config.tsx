"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Node, Edge } from "reactflow";
import { VariableSelector } from "../../variable-selector";

interface DataVisualizeNodeData {
  description?: string;
  inputVariables?: Array<{ name: string; type: string; value?: string }>;
}

interface DataVisualizeNodeConfigProps {
  nodeData?: DataVisualizeNodeData;
  onUpdate: (data: DataVisualizeNodeData) => void;
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

export function DataVisualizeNodeConfig({
  nodeData,
  onUpdate,
  currentNodeId = "",
  nodes = [],
  edges = [],
}: DataVisualizeNodeConfigProps) {
  const [description, setDescription] = useState(nodeData?.description || "");
  const [inputVariables, setInputVariables] = useState<
    Array<{ name: string; type: string; value?: string }>
  >(
    nodeData?.inputVariables || [
      { name: "query", type: "string", value: "" },
      { name: "dataList", type: "array[object]", value: "" },
      { name: "dataSource", type: "string", value: "" },
    ]
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
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          添加输入变量
        </Button>
      </div>

      {/* 输出 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">输出</h3>
        <div className="bg-slate-50 rounded-lg p-3 space-y-3">
          <div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">chartContent</span>{" "}
              <span className="text-slate-500">Object</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">图表内容</div>
            <div className="pl-4 space-y-1 mt-2">
              <div className="text-xs text-slate-600">
                <span className="font-medium">chartType</span> String - 大模型推荐的图表类型
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-medium">chartSource</span> String - 图表格式的来源
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-medium">chartData</span> Object - 图表中包含的数据内容
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">message</span>{" "}
              <span className="text-slate-500">String</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">执行结果</div>
          </div>
        </div>
      </div>
    </div>
  );
}
