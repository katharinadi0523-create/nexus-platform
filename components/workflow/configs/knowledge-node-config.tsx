"use client";

import { useState } from "react";
import { Plus, List, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KnowledgeBaseSelector, type KnowledgeBase } from "@/components/agent-editor/KnowledgeBaseSelector";

interface KnowledgeNodeData {
  description?: string;
  knowledgeBaseId?: string;
  knowledgeBaseName?: string;
  inputVariables?: Array<{ name: string; value: string }>;
}

interface KnowledgeNodeConfigProps {
  nodeData?: KnowledgeNodeData;
  onUpdate: (data: KnowledgeNodeData) => void;
}

export function KnowledgeNodeConfig({
  nodeData,
  onUpdate,
}: KnowledgeNodeConfigProps) {
  const [description, setDescription] = useState(nodeData?.description || "");
  const [kbSelectorOpen, setKbSelectorOpen] = useState(false);
  const [inputVariables, setInputVariables] = useState<
    Array<{ name: string; value: string }>
  >(
    nodeData?.inputVariables || [{ name: "query", value: "开始/query" }]
  );

  const handleKnowledgeBaseSelect = (kb: KnowledgeBase) => {
    onUpdate({
      ...nodeData,
      knowledgeBaseId: kb.id,
      knowledgeBaseName: kb.name,
    });
    setKbSelectorOpen(false);
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

      {/* 知识库 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">知识库</h3>
        <div className="flex items-center gap-2">
          <Input
            placeholder="点击 '+' 按钮添加知识库"
            value={nodeData?.knowledgeBaseName || ""}
            readOnly
            className="flex-1"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setKbSelectorOpen(true)}
              className="p-2 hover:bg-slate-100 rounded transition-colors"
            >
              <List className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setKbSelectorOpen(true)}
              className="p-2 hover:bg-slate-100 rounded transition-colors"
            >
              <Plus className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 输入变量 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">输入变量</h3>
        <div className="space-y-2">
          {inputVariables.map((variable, index) => (
            <div
              key={index}
              className="grid grid-cols-2 gap-2 bg-slate-50 rounded-lg p-2"
            >
              <div className="text-sm text-slate-700">{variable.name}</div>
              <Input
                value={variable.value}
                onChange={(e) =>
                  handleUpdateInputVariable(index, "value", e.target.value)
                }
                placeholder="变量值"
                className="text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 输出 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">输出</h3>
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          <div className="text-sm text-slate-700">
            <span className="font-medium">result</span>{" "}
            <span className="text-slate-500">Array[Object]</span>
          </div>
          <div className="text-xs text-slate-500">召回的分段</div>
          <div className="pl-4 space-y-1 mt-2">
            <div className="text-xs text-slate-600">
              <span className="font-medium">content</span> String - 分段内容
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-medium">title</span> String - 分段标题
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-medium">url</span> String - 分段链接
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-medium">icon</span> String - 分段图标
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-medium">metadata</span> Object - 其他元数据
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Base Selector Dialog */}
      <KnowledgeBaseSelector
        open={kbSelectorOpen}
        onOpenChange={setKbSelectorOpen}
        onSelect={handleKnowledgeBaseSelect}
      />
    </div>
  );
}
