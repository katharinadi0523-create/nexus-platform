"use client";

import { useState } from "react";
import { Plus, Settings, Trash2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";

interface InputVariable {
  id: string;
  name: string;
  type: string;
  required: boolean;
}

interface StartNodeData {
  description?: string;
  inputVariables?: InputVariable[];
}

interface StartNodeConfigProps {
  nodeData?: StartNodeData;
  onUpdate: (data: StartNodeData) => void;
}

const typeOptions = [
  "string",
  "number",
  "boolean",
  "array[string]",
  "array[number]",
  "array[boolean]",
  "array[object]",
  "object",
];

export function StartNodeConfig({ nodeData, onUpdate }: StartNodeConfigProps) {
  const [description, setDescription] = useState(nodeData?.description || "");
  const [inputVariables, setInputVariables] = useState<InputVariable[]>(
    nodeData?.inputVariables || []
  );

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    onUpdate({ ...nodeData, description: value, inputVariables });
  };

  const handleAddVariable = () => {
    const newVar: InputVariable = {
      id: `var-${Date.now()}`,
      name: "",
      type: "string",
      required: false,
    };
    const updated = [...inputVariables, newVar];
    setInputVariables(updated);
    onUpdate({ ...nodeData, description, inputVariables: updated });
  };

  const handleUpdateVariable = (id: string, field: keyof InputVariable, value: any) => {
    const updated = inputVariables.map((v) =>
      v.id === id ? { ...v, [field]: value } : v
    );
    setInputVariables(updated);
    onUpdate({ ...nodeData, description, inputVariables: updated });
  };

  const handleRemoveVariable = (id: string) => {
    const updated = inputVariables.filter((v) => v.id !== id);
    setInputVariables(updated);
    onUpdate({ ...nodeData, description, inputVariables: updated });
  };

  return (
    <div className="space-y-6">
      {/* 描述 */}
      <div>
        <Input
          placeholder="添加描述..."
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          className="w-full"
        />
      </div>

      {/* 系统变量 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900">系统变量</h3>
        <div className="space-y-2 bg-slate-50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-700">query</span>
            <span className="text-slate-500">string</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            用户输入的原始内容
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-slate-700">files</span>
            <span className="text-slate-500">array[file]</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            用户在对话中上传的附件
          </div>
        </div>
      </div>

      {/* 输入变量 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900">输入变量</h3>
        {inputVariables.length === 0 ? (
          <div className="bg-slate-50 rounded-lg p-3 text-center text-sm text-slate-500">
            未配置变量
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_140px_auto] gap-2 text-xs font-medium text-slate-600 px-2">
              <div>变量名</div>
              <div>类型</div>
              <div>必填</div>
            </div>
            {inputVariables.map((variable) => (
              <div
                key={variable.id}
                className="grid grid-cols-[1fr_140px_auto] gap-2 items-center bg-slate-50 rounded-lg p-2"
              >
                <div className="relative">
                  <Input
                    value={variable.name}
                    onChange={(e) =>
                      handleUpdateVariable(variable.id, "name", e.target.value)
                    }
                    placeholder="变量名"
                    className="text-sm pr-12"
                    maxLength={20}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    {variable.name.length}/20
                  </div>
                </div>
                <Select
                  value={variable.type}
                  onValueChange={(value) =>
                    handleUpdateVariable(variable.id, "type", value)
                  }
                  options={typeOptions.map((type) => ({ value: type, label: type }))}
                  className="text-sm"
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={variable.required}
                    onCheckedChange={(checked) =>
                      handleUpdateVariable(variable.id, "required", checked)
                    }
                  />
                  <button
                    onClick={() => handleRemoveVariable(variable.id)}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddVariable}
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
