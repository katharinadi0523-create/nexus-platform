"use client";

import { useState } from "react";
import { Plus, X, Minus, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Node, Edge } from "reactflow";
import { VariableSelector } from "../variable-selector";

interface Condition {
  variable: string; // 变量路径，如 "大模型 - output"
  operator: string;
  value: string; // 输入值或引用参数值
  subConditions?: Condition[]; // 支持子条件（AND/OR）
}

interface BranchNodeData {
  description?: string;
  conditions?: Condition[];
  elseContent?: string; // 否则分支的内容
  hasElse?: boolean;
}

interface BranchNodeConfigProps {
  nodeData?: BranchNodeData;
  onUpdate: (data: BranchNodeData) => void;
  currentNodeId?: string;
  nodes?: Node[];
  edges?: Edge[];
}

const operatorOptions = [
  { value: "equals", label: "等于" },
  { value: "notEquals", label: "不等于" },
  { value: "contains", label: "包含" },
  { value: "notContains", label: "不包含" },
  { value: "lengthGreaterThan", label: "长度大于" },
  { value: "lengthGreaterThanOrEquals", label: "长度大于等于" },
  { value: "lengthLessThan", label: "长度小于" },
  { value: "lengthLessThanOrEquals", label: "长度小于等于" },
  { value: "isEmpty", label: "为空" },
  { value: "isNotEmpty", label: "不为空" },
];

export function BranchNodeConfig({
  nodeData,
  onUpdate,
  currentNodeId = "",
  nodes = [],
  edges = [],
}: BranchNodeConfigProps) {
  const [description, setDescription] = useState(
    nodeData?.description ||
      '连接多个下游分支,若设定的条件成立则仅运行对应的分支,若均不成立则只运行"否则"分支'
  );
  const [conditions, setConditions] = useState<Condition[]>(
    nodeData?.conditions || []
  );
  const [elseContent, setElseContent] = useState(nodeData?.elseContent || "");
  const [hasElse, setHasElse] = useState(nodeData?.hasElse !== false);

  const handleUpdateCondition = (
    index: number,
    field: keyof Condition,
    value: string
  ) => {
    const updated = conditions.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    );
    setConditions(updated);
    onUpdate({ ...nodeData, conditions: updated });
  };

  const handleAddCondition = () => {
    const newCondition: Condition = {
      variable: "",
      operator: "equals",
      value: "",
    };
    const updated = [...conditions, newCondition];
    setConditions(updated);
    onUpdate({ ...nodeData, conditions: updated });
  };

  const handleAddSubCondition = (parentIndex: number) => {
    const updated = conditions.map((c, i) => {
      if (i === parentIndex) {
        return {
          ...c,
          subConditions: [
            ...(c.subConditions || []),
            { variable: "", operator: "equals", value: "" },
          ],
        };
      }
      return c;
    });
    setConditions(updated);
    onUpdate({ ...nodeData, conditions: updated });
  };

  const handleRemoveSubCondition = (parentIndex: number, subIndex: number) => {
    const updated = conditions.map((c, i) => {
      if (i === parentIndex) {
        return {
          ...c,
          subConditions: (c.subConditions || []).filter((_, si) => si !== subIndex),
        };
      }
      return c;
    });
    setConditions(updated);
    onUpdate({ ...nodeData, conditions: updated });
  };

  const handleRemoveCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index);
    setConditions(updated);
    onUpdate({ ...nodeData, conditions: updated });
  };

  return (
    <div className="space-y-6">
      {/* 描述 */}
      <div>
        <Textarea
          placeholder='连接多个下游分支,若设定的条件成立则仅运行对应的分支,若均不成立则只运行"否则"分支'
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            onUpdate({ ...nodeData, description: e.target.value });
          }}
          className="w-full min-h-[60px] text-sm"
        />
      </div>

      {/* 条件分支 */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-900">条件分支</h3>

        {/* 如果条件 */}
        {conditions.map((condition, index) => (
          <div
            key={index}
            className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-900">
                {index === 0 ? "如果" : `否则如果`}
              </h4>
              {index > 0 && (
                <button
                  onClick={() => handleRemoveCondition(index)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <Minus className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              {/* 主条件 */}
              <div className="flex items-center gap-2">
                {/* 运算符下拉 */}
                <Select
                  value={condition.operator}
                  onValueChange={(value) =>
                    handleUpdateCondition(index, "operator", value)
                  }
                  options={operatorOptions}
                  className="w-[100px]"
                />
                {/* 变量选择器 */}
                <div className="flex-1">
                  <VariableSelector
                    nodes={nodes}
                    edges={edges}
                    currentNodeId={currentNodeId}
                    value={condition.variable}
                    onSelect={(path) =>
                      handleUpdateCondition(index, "variable", path)
                    }
                    placeholder="选择变量"
                    className="text-sm"
                  />
                </div>
                {/* + 按钮 */}
                <button
                  className="p-1.5 hover:bg-blue-100 rounded-full transition-colors bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: 打开变量设置对话框
                  }}
                  title="添加变量"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                </button>
                {/* 输入值 */}
                <div className="flex-1 relative">
                  <Input
                    placeholder="str. 输入或引用参数值"
                    value={condition.value}
                    onChange={(e) =>
                      handleUpdateCondition(index, "value", e.target.value)
                    }
                    className="w-full pr-8 text-sm"
                  />
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: 打开参数设置对话框
                    }}
                    title="参数设置"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
                {/* 删除按钮 */}
                <button
                  onClick={() => {
                    // 删除当前条件（如果是唯一条件，则清空）
                    if (conditions.length === 1) {
                      const updated: Condition[] = [];
                      setConditions(updated);
                      onUpdate({ ...nodeData, conditions: updated });
                    } else {
                      handleRemoveCondition(index);
                    }
                  }}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                  title="删除条件"
                >
                  <Minus className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* 子条件 */}
              {condition.subConditions && condition.subConditions.length > 0 && (
                <div className="pl-4 space-y-2 border-l-2 border-slate-300">
                  {condition.subConditions.map((subCondition, subIndex) => (
                    <div key={subIndex} className="flex items-center gap-2">
                      <Select
                        value={subCondition.operator}
                        onValueChange={(value) => {
                          const updated = conditions.map((c, i) => {
                            if (i === index) {
                              const updatedSubs = (c.subConditions || []).map(
                                (sc, si) =>
                                  si === subIndex ? { ...sc, operator: value } : sc
                              );
                              return { ...c, subConditions: updatedSubs };
                            }
                            return c;
                          });
                          setConditions(updated);
                          onUpdate({ ...nodeData, conditions: updated });
                        }}
                        options={operatorOptions}
                        className="w-[100px]"
                      />
                      <div className="flex-1">
                        <VariableSelector
                          nodes={nodes}
                          edges={edges}
                          currentNodeId={currentNodeId}
                          value={subCondition.variable}
                          onSelect={(path) => {
                            const updated = conditions.map((c, i) => {
                              if (i === index) {
                                const updatedSubs = (c.subConditions || []).map(
                                  (sc, si) =>
                                    si === subIndex ? { ...sc, variable: path } : sc
                                );
                                return { ...c, subConditions: updatedSubs };
                              }
                              return c;
                            });
                            setConditions(updated);
                            onUpdate({ ...nodeData, conditions: updated });
                          }}
                          placeholder="选择变量"
                          className="text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="输入值"
                          value={subCondition.value}
                          onChange={(e) => {
                            const updated = conditions.map((c, i) => {
                              if (i === index) {
                                const updatedSubs = (c.subConditions || []).map(
                                  (sc, si) =>
                                    si === subIndex ? { ...sc, value: e.target.value } : sc
                                );
                                return { ...c, subConditions: updatedSubs };
                              }
                              return c;
                            });
                            setConditions(updated);
                            onUpdate({ ...nodeData, conditions: updated });
                          }}
                          className="w-full text-sm"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveSubCondition(index, subIndex)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Minus className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 添加子条件按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddSubCondition(index)}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                添加条件
              </Button>
            </div>
          </div>
        ))}

        {/* 添加否则如果按钮 */}
        {conditions.length === 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCondition}
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            新增
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCondition}
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            否则如果
          </Button>
        )}

        {/* 否则分支 */}
        {hasElse && (
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <h4 className="text-sm font-medium text-slate-900 mb-2">否则</h4>
            <Textarea
              placeholder="用于定义当 if 条件不满足时应执行的逻辑"
              value={elseContent}
              onChange={(e) => {
                setElseContent(e.target.value);
                onUpdate({ ...nodeData, elseContent: e.target.value });
              }}
              className="w-full min-h-[100px] text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}
