"use client";

import { useState, useMemo } from "react";
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
import { cn } from "@/lib/utils";

// 支持的参数类型
export type ParamType = "temperature" | "topP" | "maxToken" | "topK" | "history";

// 模型参数配置接口
export interface ModelParamConfig {
  supportedParams: ParamType[];
  maxToken?: {
    min: number;
    max: number;
    default: number;
  };
  topK?: {
    default: number;
  };
}

// 模型配置映射
export interface ModelConfig {
  [modelName: string]: ModelParamConfig;
}

// 模型参数值接口
export interface ModelParams {
  temperature?: number;
  topP?: number;
  maxToken?: number;
  topK?: number;
  history?: number;
}

export interface ModelSelectorProps {
  selectedModel?: string;
  modelParams?: ModelParams;
  onModelChange?: (model: string) => void;
  onParamsChange?: (params: ModelParams) => void;
}

// 模型配置常量
export const MODEL_CONFIGS: ModelConfig = {
  // 预置模型 - 标准配置
  "Qwen3-32B": {
    supportedParams: ["temperature", "topP", "maxToken", "topK", "history"],
    maxToken: {
      min: 1,
      max: 8192,
      default: 8192,
    },
    topK: {
      default: 20,
    },
  },
  "Qwen3-8B": {
    supportedParams: ["temperature", "topP", "maxToken", "topK", "history"],
    maxToken: {
      min: 1,
      max: 8192,
      default: 8192,
    },
    topK: {
      default: 20,
    },
  },
  "DeepSeek V3": {
    supportedParams: ["temperature", "topP", "maxToken", "topK", "history"],
    maxToken: {
      min: 1,
      max: 8192,
      default: 8192,
    },
    topK: {
      default: 20,
    },
  },
  // DeepSeek R1 - 推理模型，不支持 temperature 和 topP
  "DeepSeek-R1": {
    supportedParams: ["maxToken", "topK", "history"],
    maxToken: {
      min: 1,
      max: 32768,
      default: 32768,
    },
    topK: {
      default: 20,
    },
  },
  // 我的模型 - 不支持 maxToken
  "Qwen3-DPO": {
    supportedParams: ["temperature", "topP", "topK", "history"],
    topK: {
      default: 20,
    },
  },
  "微调多模态感知大模型": {
    supportedParams: ["temperature", "topP", "topK", "history"],
    topK: {
      default: 20,
    },
  },
  "DeepSeek-R2": {
    supportedParams: ["temperature", "topP", "topK", "history"],
    topK: {
      default: 20,
    },
  },
};

// 默认参数值
const getDefaultParams = (model: string): ModelParams => {
  const config = MODEL_CONFIGS[model];
  if (!config) {
    return {
      temperature: 0.01,
      topP: 0.01,
      maxToken: 4096,
      topK: 20,
      history: 5,
    };
  }

  const params: ModelParams = {};

  if (config.supportedParams.includes("temperature")) {
    params.temperature = 0.01;
  }
  if (config.supportedParams.includes("topP")) {
    params.topP = 0.01;
  }
  if (config.supportedParams.includes("maxToken") && config.maxToken) {
    params.maxToken = config.maxToken.default;
  }
  if (config.supportedParams.includes("topK") && config.topK) {
    params.topK = config.topK.default;
  }
  if (config.supportedParams.includes("history")) {
    params.history = 5;
  }

  return params;
};

const presetModels = ["Qwen3-32B", "DeepSeek-R1", "Qwen3-8B"];
const exclusiveModels = [
  "Qwen3-DPO",
  "微调多模态感知大模型",
  "DeepSeek-R2",
];

// Tooltip 文案
const TOOLTIP_CONTENT = {
  temperature:
    "控制生成随机性和多样性，数值越高，输出越发散、创意性越强；数值越低，输出越稳定、严谨。",
  topP: "控制参与采样的概率范围，仅从累计概率不超过 P 的候选词中进行生成。数值越小，输出越稳定；数值越大，多样性越高。",
  topK: "控制采样候选集大小。数值越小采样范围越窄，关注高频词；数值越大用词越丰富。",
  maxToken:
    "限制模型单次输出的最大长度，包括思考和输出内容两部分。",
  history:
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
  selectedModel = "DeepSeek-R2",
  modelParams,
  onModelChange,
  onParamsChange,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"preset" | "exclusive">(
    exclusiveModels.includes(selectedModel) ? "exclusive" : "preset"
  );
  const [currentModel, setCurrentModel] = useState(selectedModel);

  // 获取当前模型的配置
  const currentConfig = useMemo(() => {
    return MODEL_CONFIGS[currentModel] || MODEL_CONFIGS["DeepSeek-R2"];
  }, [currentModel]);

  // 合并默认参数和传入的参数
  const defaultParams = useMemo(
    () => getDefaultParams(currentModel),
    [currentModel]
  );

  const [params, setParams] = useState<ModelParams>(
    modelParams || defaultParams
  );

  // 当模型改变时，重置参数为默认值
  const handleModelSelect = (model: string) => {
    setCurrentModel(model);
    const newDefaultParams = getDefaultParams(model);
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

  const handleParamChange = (key: keyof ModelParams, value: number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    onParamsChange?.(newParams);
  };

  // 检查是否支持某个参数
  const isParamSupported = (param: ParamType): boolean => {
    return currentConfig.supportedParams.includes(param);
  };

  // 渲染参数配置项
  const renderParamField = (
    param: ParamType,
    label: string,
    min: number,
    max: number,
    step: number,
    formatValue?: (val: number) => string
  ) => {
    if (!isParamSupported(param)) {
      return null;
    }

    const value = params[param] ?? 0;
    const displayValue = formatValue ? formatValue(value) : value.toString();

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-slate-700">{label}</Label>
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
              {TOOLTIP_CONTENT[param]}
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-3">
          <Slider
            value={[value]}
            onValueChange={([val]) => handleParamChange(param, val)}
            min={min}
            max={max}
            step={step}
            className="flex-1"
          />
          <Input
            type="number"
            value={displayValue}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= min && val <= max) {
                handleParamChange(param, val);
              }
            }}
            step={step}
            min={min}
            max={max}
            className="w-20 h-8 text-xs"
          />
        </div>
        {/* Max Token 警告提示 */}
        {param === "maxToken" && value < 1024 && (
          <div className="flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              当前设定值过小，可能导致思考中断、工具调用失败或输出中断。
            </span>
          </div>
        )}
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

            {/* Temperature */}
            {renderParamField("temperature", "温度", 0, 1, 0.01, (val) =>
              val.toFixed(4)
            )}

            {/* Top P */}
            {renderParamField("topP", "Top P", 0, 1, 0.01, (val) =>
              val.toFixed(4)
            )}

            {/* Max Token - 动态范围和可见性 */}
            {currentConfig.maxToken &&
              renderParamField(
                "maxToken",
                "最大输出Token数",
                currentConfig.maxToken.min,
                currentConfig.maxToken.max,
                128
              )}

            {/* Top K - 新增参数 */}
            {renderParamField("topK", "Top K", 0, 100, 1)}

              {/* History Rounds */}
              {renderParamField("history", "对话轮数", 0, 10, 1)}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
