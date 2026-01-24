"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OutputVariable {
  name: string;
  value: string;
}

interface EndNodeData {
  description?: string;
  outputVariables?: OutputVariable[];
}

interface EndNodeConfigProps {
  nodeData?: EndNodeData;
  onUpdate: (data: EndNodeData) => void;
}

export function EndNodeConfig({ nodeData, onUpdate }: EndNodeConfigProps) {
  const [description, setDescription] = useState(nodeData?.description || "");
  const [outputVariables, setOutputVariables] = useState<OutputVariable[]>(
    nodeData?.outputVariables || []
  );

  const handleAddVariable = () => {
    const updated = [...outputVariables, { name: "", value: "" }];
    setOutputVariables(updated);
    onUpdate({ ...nodeData, outputVariables: updated });
  };

  const handleUpdateVariable = (
    index: number,
    field: "name" | "value",
    value: string
  ) => {
    const updated = outputVariables.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    setOutputVariables(updated);
    onUpdate({ ...nodeData, outputVariables: updated });
  };

  const handleRemoveVariable = (index: number) => {
    const updated = outputVariables.filter((_, i) => i !== index);
    setOutputVariables(updated);
    onUpdate({ ...nodeData, outputVariables: updated });
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

      {/* 输出变量 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900">输出变量</h3>
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
                    handleUpdateVariable(index, "name", e.target.value)
                  }
                  placeholder="变量名"
                  className="flex-1 text-sm"
                />
                <Input
                  value={variable.value}
                  onChange={(e) =>
                    handleUpdateVariable(index, "value", e.target.value)
                  }
                  placeholder="设置变量值"
                  className="flex-1 text-sm"
                />
                <button
                  onClick={() => handleRemoveVariable(index)}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddVariable}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          添加
        </Button>
      </div>
    </div>
  );
}
