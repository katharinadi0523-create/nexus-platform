"use client";

import { useState } from "react";
import { Sparkles, HelpCircle, Maximize2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DataQueryNodeData {
  description?: string;
  inputVariables?: Array<{ name: string; value: string }>;
  llmPrompt?: string;
  deepThinking?: boolean;
}

interface DataQueryNodeConfigProps {
  nodeData?: DataQueryNodeData;
  onUpdate: (data: DataQueryNodeData) => void;
}

export function DataQueryNodeConfig({
  nodeData,
  onUpdate,
}: DataQueryNodeConfigProps) {
  const [description, setDescription] = useState(nodeData?.description || "");
  const [inputVariables, setInputVariables] = useState<
    Array<{ name: string; value: string }>
  >(
    nodeData?.inputVariables || [
      { name: "query", value: "" },
      { name: "dataList", value: "" },
    ]
  );
  const [llmPrompt, setLlmPrompt] = useState(nodeData?.llmPrompt || "");
  const [deepThinking, setDeepThinking] = useState(nodeData?.deepThinking || false);

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

      {/* 大模型提示词 */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-slate-900">大模型提示词</h3>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-3 text-xs text-slate-700"
              side="right"
              sideOffset={8}
            >
              {`在这里写你的提示词，输入 '{' 插入变量、输入 '/' 插入命令`}
            </PopoverContent>
          </Popover>
        </div>
        <div className="relative">
          <Textarea
            placeholder="在这里写你的提示词,输入'{' 插入变量、输入'/' 插入..."
            value={llmPrompt}
            onChange={(e) => {
              setLlmPrompt(e.target.value);
              onUpdate({ ...nodeData, llmPrompt: e.target.value });
            }}
            className="w-full min-h-[120px] pr-20"
          />
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                // TODO: 插入变量
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                // TODO: 插入变量
              }}
            >
              <span className="text-xs">{"{x}"}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                // TODO: 全屏编辑
              }}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 输出 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-900">输出</h3>
          <div className="flex items-center gap-2">
            <Label htmlFor="deep-thinking" className="text-sm text-slate-700 cursor-pointer">
              深度思考
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="cursor-help">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 p-3 text-xs text-slate-700"
                side="right"
                sideOffset={8}
              >
                启用深度思考模式，模型会进行更深入的推理
              </PopoverContent>
            </Popover>
            <Switch
              id="deep-thinking"
              checked={deepThinking}
              onCheckedChange={(checked) => {
                setDeepThinking(checked);
                onUpdate({ ...nodeData, deepThinking: checked });
              }}
            />
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 space-y-3">
          <div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">resultSet</span>{" "}
              <span className="text-slate-500">Array[Object]</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              执行SQL查询之后获得的原始结果内容
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">queryCode</span>{" "}
              <span className="text-slate-500">String</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              大模型生成的SQL语句
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">message</span>{" "}
              <span className="text-slate-500">String</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              执行结果
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
