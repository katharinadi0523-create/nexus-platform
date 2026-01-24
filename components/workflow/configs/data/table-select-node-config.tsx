"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TableSelectNodeData {
  description?: string;
  dataSource?: string;
  inputVariables?: Array<{ name: string; value: string }>;
}

interface TableSelectNodeConfigProps {
  nodeData?: TableSelectNodeData;
  onUpdate: (data: TableSelectNodeData) => void;
}

export function TableSelectNodeConfig({
  nodeData,
  onUpdate,
}: TableSelectNodeConfigProps) {
  const [description, setDescription] = useState(nodeData?.description || "");
  const [inputVariables, setInputVariables] = useState<
    Array<{ name: string; value: string }>
  >(
    nodeData?.inputVariables || [{ name: "query", value: "" }]
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

  const handleSelectDataSource = () => {
    // Mock: 选择数据源
    onUpdate({
      ...nodeData,
      dataSource: "示例数据库",
    });
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
              <div className="text-sm text-slate-700">{variable.name} string</div>
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

      {/* 数据来源 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">数据来源</h3>
        <Button
          variant="outline"
          size="lg"
          className="w-full border-dashed border-2 border-slate-300 hover:border-purple-400 hover:bg-purple-50/50 transition-colors"
          onClick={handleSelectDataSource}
        >
          <Plus className="w-4 h-4 mr-2" />
          选择表数据库
        </Button>
        {nodeData?.dataSource && (
          <div className="text-sm text-slate-600 mt-2">
            已选择: {nodeData.dataSource}
          </div>
        )}
      </div>

      {/* 输出 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">输出</h3>
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          <div className="text-sm text-slate-700">
            <span className="font-medium">resultSet</span>{" "}
            <span className="text-slate-500">Array[Object]</span>
          </div>
          <div className="text-xs text-slate-500">数据表的元数据信息</div>
          <div className="text-sm text-slate-700 mt-2">
            <span className="font-medium">message</span>{" "}
            <span className="text-slate-500">String</span>
          </div>
          <div className="text-xs text-slate-500">执行结果</div>
        </div>
      </div>
    </div>
  );
}
