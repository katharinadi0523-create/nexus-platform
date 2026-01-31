"use client";

import { useState } from "react";
import { Plus, Grid3x3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { OntologyConfigDialog, type OntologyConfig } from "@/components/agent-editor/OntologyConfigDialog";

interface ObjectQueryNodeData {
  description?: string;
  ontologyConfig?: OntologyConfig;
  inputVariables?: Array<{ name: string; value: string; required?: boolean }>;
}

interface ObjectQueryNodeConfigProps {
  nodeData?: ObjectQueryNodeData;
  onUpdate: (data: ObjectQueryNodeData) => void;
}

// 级联选择数据 - 复用自主规划的逻辑
const ontologyData = {
  "海上态势感知": [
    "战斗机",
    "航空母舰",
    "海军陆战队",
    "无人机",
    "运输机",
    "运输船",
    "哨塔",
  ],
  "装备维修检测": [
    "战斗机",
    "无人机",
    "坦克",
    "海底石油开采",
    "侦察机",
  ],
  "TH态势感知与情报快判": [
    "过航事件",
    "情报报告",
    "传感器数据",
    "舰船单元",
  ],
};

// Mock 对象类型数据（用于显示已选择的对象类型）
const mockObjectTypes: Record<string, string[]> = {
  "海上态势感知": ["行动方案", "作战单位", "装备信息"],
  "装备维修检测": ["维修记录", "设备状态", "故障报告"],
};

export function ObjectQueryNodeConfig({
  nodeData,
  onUpdate,
}: ObjectQueryNodeConfigProps) {
  const [description, setDescription] = useState(nodeData?.description || "用于查询本体中的对象信息");
  const [ontologyDialogOpen, setOntologyDialogOpen] = useState(false);
  const [inputVariables, setInputVariables] = useState<
    Array<{ name: string; value: string; required?: boolean }>
  >(
    nodeData?.inputVariables || [{ name: "query", value: "开始/query", required: true }]
  );

  const ontologyConfig = nodeData?.ontologyConfig;
  const selectedOntology = ontologyConfig?.ontology || "";
  const selectedObjectType = ontologyConfig?.objectType || "";

  // 获取已选择的对象类型显示名称（如果有mock数据）
  const displayObjectType = selectedObjectType || 
    (selectedOntology && mockObjectTypes[selectedOntology]?.[0]) || 
    "行动方案";

  const handleOntologyConfigSave = (config: OntologyConfig) => {
    onUpdate({
      ...nodeData,
      ontologyConfig: config,
    });
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

      {/* 对象类型 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-900">对象类型</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setOntologyDialogOpen(true)}
              className="p-1.5 hover:bg-slate-100 rounded transition-colors"
              title="管理对象类型"
            >
              <Grid3x3 className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setOntologyDialogOpen(true)}
              className="p-1.5 hover:bg-slate-100 rounded transition-colors"
              title="添加对象类型"
            >
              <Plus className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
        {ontologyConfig ? (
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-slate-700 font-medium">{displayObjectType}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-sm text-slate-400">未选择对象类型</span>
          </div>
        )}
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
              <div className="flex items-center gap-1 text-sm text-slate-700">
                {variable.name}
                {variable.required && <span className="text-red-500">*</span>}
              </div>
              <div className="relative">
                <Input
                  value={variable.value}
                  onChange={(e) =>
                    handleUpdateInputVariable(index, "value", e.target.value)
                  }
                  placeholder="变量值"
                  className="text-sm pr-8"
                />
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => {
                    // TODO: 打开变量选择器
                  }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 输出 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">输出</h3>
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
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
        onOpenChange={setOntologyDialogOpen}
        initialConfig={ontologyConfig}
        onSave={handleOntologyConfigSave}
      />
    </div>
  );
}
