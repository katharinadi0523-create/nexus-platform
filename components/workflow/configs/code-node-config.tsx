"use client";

import { useState } from "react";
import { Plus, X, ExternalLink, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Node, Edge } from "reactflow";
import { VariableSelector } from "../variable-selector";

interface CodeNodeData {
  description?: string;
  inputVariables?: Array<{ name: string; type: string }>;
  outputVariables?: Array<{ name: string; type: string }>;
  code?: string;
  timeout?: number;
  retryCount?: string;
  exceptionHandling?: string;
}

interface CodeNodeConfigProps {
  nodeData?: CodeNodeData;
  onUpdate: (data: CodeNodeData) => void;
  currentNodeId?: string;
  nodes?: Node[];
  edges?: Edge[];
}

const outputTypeOptions = [
  { value: "str", label: "str. String" },
  { value: "int", label: "int. Integer" },
  { value: "float", label: "float. Float" },
  { value: "bool", label: "bool. Boolean" },
  { value: "list", label: "list. List" },
  { value: "dict", label: "dict. Dictionary" },
];

const retryOptions = [
  { value: "no-retry", label: "不重试" },
  { value: "1", label: "1次" },
  { value: "2", label: "2次" },
  { value: "3", label: "3次" },
];

const exceptionHandlingOptions = [
  { value: "interrupt", label: "中断流程" },
  { value: "continue", label: "继续执行" },
  { value: "return-default", label: "返回默认值" },
];

const defaultCode = `import random

async def main(inputs=None):
    result = random.choices(
        ["yes", "no"],
        weights=[1, 2],
        k=1
    )[0]

    return {
        "result": result
    }`;

export function CodeNodeConfig({
  nodeData,
  onUpdate,
  currentNodeId = "",
  nodes = [],
  edges = [],
}: CodeNodeConfigProps) {
  const [description, setDescription] = useState(
    nodeData?.description || "编写代码,处理输入变量来生成返回值"
  );
  const [inputVariables, setInputVariables] = useState<
    Array<{ name: string; type: string; value?: string }>
  >(nodeData?.inputVariables || []);
  const [outputVariables, setOutputVariables] = useState<
    Array<{ name: string; type: string }>
  >(nodeData?.outputVariables || [{ name: "result", type: "str" }]);
  const [code, setCode] = useState(nodeData?.code || defaultCode);
  const [timeout, setTimeout] = useState(nodeData?.timeout || 60);
  const [retryCount, setRetryCount] = useState(nodeData?.retryCount || "no-retry");
  const [exceptionHandling, setExceptionHandling] = useState(
    nodeData?.exceptionHandling || "interrupt"
  );

  const handleAddInputVariable = () => {
    const newVariable = { name: "", type: "str", value: "" };
    const updated = [...inputVariables, newVariable];
    setInputVariables(updated);
    onUpdate({ ...nodeData, inputVariables: updated });
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
    onUpdate({ ...nodeData, inputVariables: updated });
  };

  const handleSelectInputVariable = (index: number, variablePath: string) => {
    const updated = inputVariables.map((v, i) =>
      i === index ? { ...v, value: variablePath } : v
    );
    setInputVariables(updated);
    onUpdate({ ...nodeData, inputVariables: updated });
  };

  const handleRemoveInputVariable = (index: number) => {
    const updated = inputVariables.filter((_, i) => i !== index);
    setInputVariables(updated);
    onUpdate({ ...nodeData, inputVariables: updated });
  };

  const handleAddOutputVariable = () => {
    const newVariable = { name: "", type: "str" };
    const updated = [...outputVariables, newVariable];
    setOutputVariables(updated);
    onUpdate({ ...nodeData, outputVariables: updated });
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
    onUpdate({ ...nodeData, outputVariables: updated });
  };

  const handleRemoveOutputVariable = (index: number) => {
    const updated = outputVariables.filter((_, i) => i !== index);
    setOutputVariables(updated);
    onUpdate({ ...nodeData, outputVariables: updated });
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    onUpdate({ ...nodeData, code: value });
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

      {/* 输入 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-medium text-slate-900">输入①</h3>
        </div>
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
            暂无数据
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

      {/* 代码编辑器 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-medium text-slate-900">代码</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              // TODO: 打开 IDE 编辑器
            }}
          >
            <ExternalLink className="w-4 h-4" />
            在IDE中编辑
          </Button>
        </div>
        <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
          <div className="relative">
            {/* 行号 */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-800 text-slate-500 text-xs font-mono py-3 px-2 select-none">
              {code.split("\n").map((_, i) => (
                <div key={i} className="leading-6 text-right pr-2">
                  {i + 1}
                </div>
              ))}
            </div>
            <Textarea
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full min-h-[300px] font-mono text-sm text-slate-100 bg-slate-900 border-0 resize-none focus:ring-0 focus-visible:ring-0 pl-14 py-3"
              style={{
                fontFamily: "monospace",
                lineHeight: "1.5rem",
              }}
            />
          </div>
        </div>
      </div>

      {/* 输出 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-medium text-slate-900">输出①</h3>
        </div>
        {outputVariables.length > 0 ? (
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
        ) : (
          <div className="bg-slate-50 rounded-lg p-3 text-center text-sm text-slate-500">
            暂无数据
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddOutputVariable}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          添加输出变量
        </Button>
      </div>

      {/* 异常处理 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-medium text-slate-900">异常处理①</h3>
        </div>
        <div className="space-y-3 bg-slate-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-slate-700 w-20">超时时间</Label>
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="number"
                value={timeout}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 60;
                  setTimeout(value);
                  onUpdate({ ...nodeData, timeout: value });
                }}
                className="flex-1"
              />
              <span className="text-sm text-slate-500">s</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-slate-700 w-20">重试次数</Label>
            <Select
              value={retryCount}
              onValueChange={(value) => {
                setRetryCount(value);
                onUpdate({ ...nodeData, retryCount: value });
              }}
              options={retryOptions}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-slate-700 w-20">异常处理方式</Label>
            <Select
              value={exceptionHandling}
              onValueChange={(value) => {
                setExceptionHandling(value);
                onUpdate({ ...nodeData, exceptionHandling: value });
              }}
              options={exceptionHandlingOptions}
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
