"use client";

import { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  Check,
  HelpCircle,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface ModelParams {
  temperature: number;
  topP: number;
  maxToken: number;
  historyRounds: number;
}

export interface ModelSelectorProps {
  selectedModel?: string;
  modelParams?: ModelParams;
  onModelChange?: (model: string) => void;
  onParamsChange?: (params: ModelParams) => void;
}

const presetModels = ["Qwen3-32B", "DeepSeek-R1", "Qwen3-8B"];
const exclusiveModels = [
  "Qwen3-DPO",
  "微调多模态感知大模型",
  "DeepSeek-R2",
];

const defaultParams: ModelParams = {
  temperature: 0.01,
  topP: 0.01,
  maxToken: 4096,
  historyRounds: 5,
};

export function ModelSelector({
  selectedModel = "DeepSeek-R2",
  modelParams = defaultParams,
  onModelChange,
  onParamsChange,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"preset" | "exclusive">(
    exclusiveModels.includes(selectedModel) ? "exclusive" : "preset"
  );
  const [currentModel, setCurrentModel] = useState(selectedModel);
  const [params, setParams] = useState<ModelParams>(modelParams);

  const handleModelSelect = (model: string) => {
    setCurrentModel(model);
    onModelChange?.(model);
    // 根据选择的模型切换 tab
    if (exclusiveModels.includes(model)) {
      setActiveTab("exclusive");
    } else {
      setActiveTab("preset");
    }
  };

  const handleParamChange = (key: keyof ModelParams, value: number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    onParamsChange?.(newParams);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Sparkles className="w-4 h-4 text-slate-600" />
          <span className="font-medium">{currentModel}</span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="start"
        sideOffset={8}
      >
        <div className="p-4">
          {/* Model Selection Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "preset" | "exclusive")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preset">预置模型</TabsTrigger>
              <TabsTrigger value="exclusive">专属模型</TabsTrigger>
            </TabsList>

            {/* Preset Models */}
            <TabsContent value="preset" className="mt-4 space-y-1">
              {presetModels.map((model) => (
                <button
                  key={model}
                  onClick={() => handleModelSelect(model)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left",
                    currentModel === model && "bg-blue-50"
                  )}
                >
                  <span className="text-sm text-slate-900">{model}</span>
                  {currentModel === model && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </TabsContent>

            {/* Exclusive Models */}
            <TabsContent value="exclusive" className="mt-4 space-y-1">
              {exclusiveModels.map((model) => (
                <button
                  key={model}
                  onClick={() => handleModelSelect(model)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left",
                    currentModel === model && "bg-blue-50"
                  )}
                >
                  <span className="text-sm text-slate-900">{model}</span>
                  {currentModel === model && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </TabsContent>
          </Tabs>

          {/* Separator */}
          <Separator className="my-4" />

          {/* Parameters Configuration */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-slate-900">
              参数配置
            </Label>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-slate-700">温度</Label>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[params.temperature]}
                  onValueChange={([value]) =>
                    handleParamChange("temperature", value)
                  }
                  min={0}
                  max={1}
                  step={0.01}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={params.temperature.toFixed(4)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= 1) {
                      handleParamChange("temperature", val);
                    }
                  }}
                  step="0.0001"
                  min="0"
                  max="1"
                  className="w-20 h-8 text-xs"
                />
              </div>
            </div>

            {/* Top P */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-slate-700">Top P</Label>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[params.topP]}
                  onValueChange={([value]) =>
                    handleParamChange("topP", value)
                  }
                  min={0}
                  max={1}
                  step={0.01}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={params.topP.toFixed(4)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= 1) {
                      handleParamChange("topP", val);
                    }
                  }}
                  step="0.0001"
                  min="0"
                  max="1"
                  className="w-20 h-8 text-xs"
                />
              </div>
            </div>

            {/* Max Token */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-slate-700">最大 Token</Label>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[params.maxToken]}
                  onValueChange={([value]) =>
                    handleParamChange("maxToken", value)
                  }
                  min={0}
                  max={8192}
                  step={128}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={params.maxToken}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= 8192) {
                      handleParamChange("maxToken", val);
                    }
                  }}
                  min="0"
                  max="8192"
                  step="128"
                  className="w-20 h-8 text-xs"
                />
              </div>
            </div>

            {/* History Rounds */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-slate-700">最大对话轮数</Label>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[params.historyRounds]}
                  onValueChange={([value]) =>
                    handleParamChange("historyRounds", value)
                  }
                  min={0}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={params.historyRounds}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= 10) {
                      handleParamChange("historyRounds", val);
                    }
                  }}
                  min="0"
                  max="10"
                  step="1"
                  className="w-20 h-8 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
