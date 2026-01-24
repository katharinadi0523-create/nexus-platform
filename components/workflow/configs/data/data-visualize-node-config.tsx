"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DataVisualizeNodeData {
  description?: string;
  inputVariables?: Array<{ name: string; value: string }>;
}

interface DataVisualizeNodeConfigProps {
  nodeData?: DataVisualizeNodeData;
  onUpdate: (data: DataVisualizeNodeData) => void;
}

export function DataVisualizeNodeConfig({
  nodeData,
  onUpdate,
}: DataVisualizeNodeConfigProps) {
  const [description, setDescription] = useState(nodeData?.description || "");
  const [inputVariables, setInputVariables] = useState<
    Array<{ name: string; value: string }>
  >(
    nodeData?.inputVariables || [
      { name: "query", value: "" },
      { name: "dataList", value: "" },
      { name: "dataSource", value: "" },
    ]
  );

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
        <h3 className="text-sm font-medium text-slate-900">输入</h3>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-2 px-2">
            <div>变量名</div>
            <div>变量值</div>
          </div>
          {inputVariables.map((variable, index) => (
            <div
              key={index}
              className="grid grid-cols-2 gap-2 bg-slate-50 rounded-lg p-2"
            >
              <div className="text-sm text-slate-700">
                {variable.name} {variable.name === "query" ? "string" : "array..."}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-sm text-slate-600"
                onClick={() => {
                  // TODO: 打开变量选择器
                }}
              >
                设置变量值
              </Button>
            </div>
          ))}
        </div>
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
