"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  ChevronDown,
  Check,
  HelpCircle,
  AlertTriangle,
  Box,
  ExternalLink,
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  EXCLUSIVE_MODEL_IDS,
  PRESET_MODEL_IDS,
  getDefaultModelParams,
  getModelSchema,
  type ModelParamKey,
  type ModelParamSchema,
  type ModelParamValues,
} from "@/lib/model-schemas";

// 模型参数值接口
export type ModelParams = ModelParamValues;

export interface ModelSelectorProps {
  selectedModel?: string;
  modelParams?: ModelParams;
  onModelChange?: (model: string) => void;
  onParamsChange?: (params: ModelParams) => void;
}

const presetModels = PRESET_MODEL_IDS;
const exclusiveModels = EXCLUSIVE_MODEL_IDS;

// Tooltip 文案
const TOOLTIP_CONTENT: Partial<Record<ModelParamKey, string>> = {
  temperature:
    "控制生成随机性，数值越高，输出越发散、创意性越强；数值越低，输出越稳定、严谨。",
  top_p:
    "累计概率：控制参与采样的概率范围，仅从累计概率不超过 P 的候选词中进行生成。数值越小，输出越稳定；数值越大，多样性越高。建议不要与温度同时调整",
  top_k:
    "控制采样候选集大小。数值越小采样范围越窄，关注高频词；数值越大用词越丰富。",
  max_tokens:
    "限制模型单次输出的最大长度，包括思考和输出内容两部分。",
  frequency_penalty:
    "当该值为正时，会阻止模型频繁使用相同的词汇和短语，从而增加输出内容的多样性。",
  deep_thinking: "开启后模型展示深思考过程，提升逻辑准确性。",
  context_turns:
    "传入大模型上下文的前序对话轮数（一问一答计为一轮）。数值越大，模型对历史记忆越完整，但模型上下文压力相应增大。",
};

// 获取模型图标
const getModelIcon = (modelName: string) => {
  if (modelName.includes("DeepSeek")) {
    return (
      <Image
        src="/icons/deepseek.png"
        alt="DeepSeek"
        width={20}
        height={20}
        className="object-contain"
      />
    );
  }
  if (modelName.includes("Qwen")) {
    return (
      <Image
        src="/icons/qwen.png"
        alt="Qwen"
        width={20}
        height={20}
        className="object-contain"
      />
    );
  }
  return <Box className="w-5 h-5 text-slate-500" />;
};

export function ModelSelector({
  selectedModel = "Qwen3-32B",
  modelParams,
  onModelChange,
  onParamsChange,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"preset" | "exclusive">(
    exclusiveModels.includes(selectedModel) ? "exclusive" : "preset"
  );
  const [currentModel, setCurrentModel] = useState(selectedModel);

  const currentSchema = useMemo(() => getModelSchema(currentModel), [currentModel]);

  // 合并默认参数和传入的参数
  const defaultParams = useMemo(
    () => getDefaultModelParams(currentModel),
    [currentModel]
  );

  const [params, setParams] = useState<ModelParams>(modelParams || defaultParams);

  // Keep controlled prop in sync
  useEffect(() => {
    if (!modelParams) return;
    setParams(modelParams);
  }, [modelParams]);

  // 当模型改变时，重置参数为默认值
  const handleModelSelect = (model: string) => {
    setCurrentModel(model);
    const newDefaultParams = getDefaultModelParams(model);
    setParams(newDefaultParams);
    onModelChange?.(model);
    onParamsChange?.(newDefaultParams);

    // 根据选择的模型切换 tab
    if (exclusiveModels.includes(model)) {
      setActiveTab("exclusive");
    } else {
      setActiveTab("preset");
    }
  };

  const handleParamChange = (key: ModelParamKey, value: number | boolean) => {
    let newParams = { ...params, [key]: value };

    // Qwen3 deep_thinking linkage (authoritative recommended presets)
    // - deep_thinking=true  => temperature=0.6, top_p=0.95, top_k=20
    // - deep_thinking=false => temperature=0.7, top_p=0.8,  top_k=20
    if (
      (currentModel === "Qwen3-32B" || currentModel === "Qwen3-8B") &&
      key === "deep_thinking"
    ) {
      const enabled = Boolean(value);
      newParams = {
        ...newParams,
        temperature: enabled ? 0.6 : 0.7,
        top_p: enabled ? 0.95 : 0.8,
        top_k: 20,
      };
    }

    setParams(newParams);
    onParamsChange?.(newParams);
  };

  const renderNumberParam = (param: Extract<ModelParamSchema, { type: "number" }>) => {
    const value = (params[param.key] as number | undefined) ?? param.defaultValue;
    const displayValue = param.format ? param.format(value) : value.toString();
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-slate-700">{param.label}</Label>
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
              {param.description || TOOLTIP_CONTENT[param.key]}
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-3">
          <Slider
            value={[value]}
            onValueChange={([val]) => handleParamChange(param.key, val)}
            min={param.min}
            max={param.max}
            step={param.step}
            className="flex-1"
          />
          <Input
            type="number"
            value={displayValue}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= param.min && val <= param.max) {
                handleParamChange(param.key, val);
              }
            }}
            step={param.step}
            min={param.min}
            max={param.max}
            className="w-20 h-8 text-xs"
          />
        </div>
        {/* max_tokens 警告提示 */}
        {param.key === "max_tokens" && value < 1024 && (
          <div className="flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              ⚠️ 当前设定值过小，可能导致思考中断、工具调用失败或输出中断。
            </span>
          </div>
        )}
        {/* frequency_penalty < 0 风险提示 */}
        {param.key === "frequency_penalty" && value < 0 && (
          <div className="flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              ⚠️ 负值惩罚会鼓励模型重复输出，可能导致调用插件知识库等功能超时！
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderParam = (param: ModelParamSchema) => {
    if (param.type === "number") return renderNumberParam(param);
    // boolean toggle: label + switch on one row
    const value = (params[param.key] as boolean | undefined) ?? param.defaultValue;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-slate-700">{param.label}</Label>
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
                {param.description || TOOLTIP_CONTENT[param.key]}
              </PopoverContent>
            </Popover>
          </div>

          <Switch
            checked={value}
            onCheckedChange={(checked) => handleParamChange(param.key, checked)}
          />
        </div>
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          {getModelIcon(currentModel)}
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
          {/* Section 1: 模型服务选择 */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-slate-900 mb-2">
              模型服务选择
            </h3>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "preset" | "exclusive")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preset">预置模型服务</TabsTrigger>
                <TabsTrigger value="exclusive">
                  <span className="inline-flex items-center gap-1">
                    我的模型服务
                    <Popover>
                      <PopoverTrigger asChild>
                        <span
                          role="button"
                          tabIndex={0}
                          className="cursor-help inline-flex"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          aria-label="我的模型服务说明"
                        >
                          <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                        </span>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-72 p-3 text-xs text-slate-700"
                        side="bottom"
                        align="center"
                        sideOffset={8}
                      >
                        本项目在模型开发平台「在线服务」中部署的大语言模型。若该模型不支持深度思考或工具调用，Agent 的规划与执行能力可能受限，输出效果可能不稳定
                      </PopoverContent>
                    </Popover>
                  </span>
                </TabsTrigger>
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
                    <div className="flex items-center gap-2">
                      {getModelIcon(model)}
                      <span className="text-sm text-slate-900">{model}</span>
                    </div>
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
                
                {/* 在线模型服务链接 */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <a
                    href="/model-dev/online-services"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>在线模型服务</span>
                  </a>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Section 2: 参数配置 */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-900 mb-2">
              参数配置
            </h3>
            <div className="space-y-4">
              {currentSchema.supportedParams.map((p) => (
                <div key={p.key}>{renderParam(p)}</div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
