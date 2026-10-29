"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  Check,
  HelpCircle,
  AlertTriangle,
  Box,
} from "lucide-react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  /** Override the preset catalog for specialized model types. */
  presetModelOptions?: readonly string[];
  /** Models that remain in the catalog but are temporarily unavailable. */
  unavailableModelIds?: readonly string[];
  selectedModel?: string;
  modelParams?: ModelParams;
  onModelChange?: (model: string) => void;
  onParamsChange?: (params: ModelParams) => void;
  showParams?: boolean;
  triggerClassName?: string;
  /**
   * When true, hides the「预置模型服务 / 我的模型服务」tabs and only shows the preset model list.
   */
  presetOnly?: boolean;
  /** Render model parameters in a separate popover beside the model selector. */
  separateParamsPopover?: boolean;
  /**
   * Hide specific schema params (e.g. context_turns) and/or global switches (current_time, sp_anti_leak).
   */
  hiddenParamKeys?: readonly ModelParamKey[];
}

const exclusiveModels = EXCLUSIVE_MODEL_IDS;

type ChatThinkingStrength = "low" | "medium" | "high";
type ChatModelUiConfig = {
  thinkingStrength: ChatThinkingStrength;
};

const CHAT_THINKING_STRENGTHS: Array<{ value: ChatThinkingStrength; label: string }> = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
];

const DEFAULT_CHAT_MODEL_UI_CONFIG: ChatModelUiConfig = {
  thinkingStrength: "medium",
};

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
  current_time: "开启后大模型能自动获取当前时间。",
  sp_anti_leak: "开启后将会加固提示词，显著降低提示词泄露情况的出现概率。",
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
  selectedModel,
  modelParams,
  onModelChange,
  onParamsChange,
  showParams = true,
  triggerClassName,
  presetOnly = false,
  separateParamsPopover = false,
  hiddenParamKeys,
  presetModelOptions,
  unavailableModelIds = [],
}: ModelSelectorProps) {
  const presetModels = presetModelOptions ?? PRESET_MODEL_IDS;
  const unavailableModelIdSet = useMemo(
    () => new Set(unavailableModelIds),
    [unavailableModelIds]
  );
  const hiddenParamKeySet = useMemo(
    () => new Set<ModelParamKey>(hiddenParamKeys ?? []),
    [hiddenParamKeys]
  );
  const initialModel = selectedModel ?? "Qwen3-32B";
  const isModelControlled = selectedModel !== undefined;
  const isParamsControlled = modelParams !== undefined;
  const [open, setOpen] = useState(false);
  const [paramsModelOpen, setParamsModelOpen] = useState<string | null>(null);
  const modelConfigCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [chatModelUiConfig, setChatModelUiConfig] = useState<Record<string, ChatModelUiConfig>>({});
  const [chatConfigSubmenu, setChatConfigSubmenu] = useState<"thinking" | null>(null);
  const [activeTab, setActiveTab] = useState<"preset" | "exclusive">(
    exclusiveModels.includes(initialModel) ? "exclusive" : "preset"
  );
  const [uncontrolledModel, setUncontrolledModel] = useState(initialModel);
  const currentModel = isModelControlled ? selectedModel : uncontrolledModel;

  const currentSchema = useMemo(() => getModelSchema(currentModel), [currentModel]);

  // 合并默认参数和传入的参数
  const defaultParams = useMemo(
    () => getDefaultModelParams(currentModel),
    [currentModel]
  );

  const [uncontrolledParams, setUncontrolledParams] = useState<ModelParams>(() => ({
    ...getDefaultModelParams(initialModel),
    ...modelParams,
    current_time: modelParams?.current_time ?? false,
    sp_anti_leak: modelParams?.sp_anti_leak ?? false,
  }));
  const params = useMemo(
    () =>
      isParamsControlled
        ? {
            ...defaultParams,
            ...modelParams,
            current_time: modelParams.current_time ?? false,
            sp_anti_leak: modelParams.sp_anti_leak ?? false,
          }
        : uncontrolledParams,
    [defaultParams, isParamsControlled, modelParams, uncontrolledParams]
  );
  const clearModelConfigCloseTimer = () => {
    if (modelConfigCloseTimer.current) {
      clearTimeout(modelConfigCloseTimer.current);
      modelConfigCloseTimer.current = null;
    }
  };

  const scheduleModelConfigClose = () => {
    clearModelConfigCloseTimer();
    modelConfigCloseTimer.current = setTimeout(() => {
      setParamsModelOpen(null);
      setChatConfigSubmenu(null);
      modelConfigCloseTimer.current = null;
    }, 180);
  };

  const updateChatModelUiConfig = (model: string, patch: Partial<ChatModelUiConfig>) => {
    setChatModelUiConfig((current) => ({
      ...current,
      [model]: {
        ...(current[model] ?? DEFAULT_CHAT_MODEL_UI_CONFIG),
        ...patch,
      },
    }));
  };

  // 当模型改变时，重置参数为默认值
  const handleModelSelect = (model: string) => {
    setChatConfigSubmenu(null);
    if (currentModel !== model || !separateParamsPopover) {
      const newDefaultParams = getDefaultModelParams(model);
      const nextParams = {
        ...newDefaultParams,
        current_time: params.current_time ?? false,
        sp_anti_leak: params.sp_anti_leak ?? false,
      };
      if (!isModelControlled) setUncontrolledModel(model);
      if (!isParamsControlled) setUncontrolledParams(nextParams);
      onModelChange?.(model);
      onParamsChange?.(nextParams);
    }

    // 根据选择的模型切换 tab（presetOnly 下仅展示预置列表，无需切换）
    if (!presetOnly) {
      if (exclusiveModels.includes(model)) {
        setActiveTab("exclusive");
      } else {
        setActiveTab("preset");
      }
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

    if (!isParamsControlled) {
      setUncontrolledParams(newParams);
    }
    onParamsChange?.(newParams);
  };

  const renderNumberParam = (param: Extract<ModelParamSchema, { type: "number" }>) => {
    const value = (params[param.key] as number | undefined) ?? param.defaultValue;
    const displayValue = param.format ? param.format(value) : value.toString();
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-slate-700">{param.label}</Label>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button type="button" className="cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="max-w-64 p-3 text-xs text-slate-700">
              {param.description || TOOLTIP_CONTENT[param.key]}
            </TooltipContent>
          </Tooltip>
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
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button type="button" className="cursor-help">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8} className="max-w-64 p-3 text-xs text-slate-700">
                {param.description || TOOLTIP_CONTENT[param.key]}
              </TooltipContent>
            </Tooltip>
          </div>

          <Switch
            checked={value}
            onCheckedChange={(checked) => handleParamChange(param.key, checked)}
          />
        </div>
      </div>
    );
  };

  const renderChatModelConfigPanel = (model: string) => {
    const modelConfig = chatModelUiConfig[model] ?? DEFAULT_CHAT_MODEL_UI_CONFIG;
    return (
    <div className="w-full p-4">
      <h3 className="mb-3 text-[13px] font-semibold text-slate-900">模型配置</h3>
      <div className="border-t border-slate-100 py-2">
        <Popover
          open={chatConfigSubmenu === "thinking"}
          onOpenChange={(nextOpen) => setChatConfigSubmenu(nextOpen ? "thinking" : null)}
        >
          <PopoverTrigger asChild>
            <button type="button" className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm text-slate-800 transition hover:bg-slate-50">
              <span>思考强度</span>
              <span className="flex items-center gap-1.5 text-slate-500">
                {CHAT_THINKING_STRENGTHS.find((item) => item.value === modelConfig.thinkingStrength)?.label}
                <ChevronRight className="h-4 w-4" />
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" sideOffset={8} collisionPadding={16} className="w-48 p-2" onMouseEnter={clearModelConfigCloseTimer} onMouseLeave={scheduleModelConfigClose}>
            <div className="px-2 py-1.5 text-xs font-medium text-slate-500">思考强度</div>
            {CHAT_THINKING_STRENGTHS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  updateChatModelUiConfig(model, { thinkingStrength: item.value });
                  setChatConfigSubmenu(null);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-slate-50",
                  modelConfig.thinkingStrength === item.value && "bg-slate-100 font-medium text-slate-900"
                )}
              >
                {item.label}
                {modelConfig.thinkingStrength === item.value ? <Check className="h-4 w-4 text-emerald-500" /> : null}
              </button>
            ))}
          </PopoverContent>
        </Popover>

      </div>
    </div>
    );
  };

  const renderModelOption = (model: string, withIcon = true) => {
    const unavailable = unavailableModelIdSet.has(model);
    const row = (
      <div
        role={unavailable ? undefined : "button"}
        tabIndex={unavailable ? -1 : 0}
        onMouseEnter={unavailable ? undefined : clearModelConfigCloseTimer}
        onMouseLeave={unavailable ? undefined : scheduleModelConfigClose}
        onClick={unavailable ? undefined : () => {
          handleModelSelect(model);
          setParamsModelOpen(model);
        }}
        onKeyDown={unavailable ? undefined : (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleModelSelect(model);
            setParamsModelOpen(model);
          }
        }}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left",
          unavailable ? "cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer",
          currentModel === model && "bg-blue-50"
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {withIcon ? <span className={unavailable ? "opacity-50" : undefined}>{getModelIcon(model)}</span> : null}
          <span className={cn("truncate text-sm", unavailable ? "text-slate-500" : "text-slate-900")}>{model}</span>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          {unavailable ? (
            <span className="group relative inline-flex cursor-help items-center text-amber-500">
              <span role="img" aria-label="模型服务异常，请先选择可用模型" tabIndex={0}>
                <AlertTriangle className="h-4 w-4" />
              </span>
              <span
                role="tooltip"
                className="invisible absolute bottom-full right-0 z-[60] mb-2 w-max max-w-[240px] rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-700 opacity-0 shadow-md transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
              >
                模型服务异常，请先选择可用模型
              </span>
            </span>
          ) : null}
          {currentModel === model ? <Check className="h-4 w-4 text-blue-600" /> : null}
        </span>
      </div>
    );

    if (unavailable) return <div key={model}>{row}</div>;
    if (!showParams || !separateParamsPopover) return <div key={model}>{row}</div>;
    return (
      <Popover key={model} open={paramsModelOpen === model} onOpenChange={(nextOpen) => {
        setParamsModelOpen(nextOpen ? model : null);
        if (!nextOpen) setChatConfigSubmenu(null);
      }}>
        <PopoverAnchor asChild>{row}</PopoverAnchor>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={8}
          className="w-[min(320px,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto p-0"
          collisionPadding={24}
          onMouseEnter={clearModelConfigCloseTimer}
          onMouseLeave={scheduleModelConfigClose}
        >
          {renderChatModelConfigPanel(model)}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
    <div className={cn(separateParamsPopover ? "flex items-center gap-1" : "contents")}>
    <Popover open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      setParamsModelOpen(null);
      setChatConfigSubmenu(null);
      clearModelConfigCloseTimer();
    }}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors",
            triggerClassName
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {getModelIcon(currentModel)}
            <span className="truncate font-medium">{currentModel}</span>
          </span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 max-h-[60vh] overflow-y-auto"
        align="start"
        side="top"
        sideOffset={8}
        collisionPadding={32}
        avoidCollisions={true}
      >
        <div className="p-4">
          {/* Section 1: 模型服务选择 */}
          <div className="mb-4">
            <h3 className="mb-2 text-[13px] font-medium text-slate-900">
              模型服务选择
            </h3>
            {presetOnly ? (
              <div className="space-y-1">
                {presetModels.map((model) => renderModelOption(model))}
              </div>
            ) : (
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
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <span
                            role="img"
                            aria-label="我的模型服务说明"
                            className="cursor-help inline-flex"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={8} className="max-w-72 p-3 text-xs text-slate-700">
                          <span>
                            本项目在模型开发平台「
                            <a
                              href="/model-dev/online-services"
                              className="text-blue-600 hover:text-blue-700 underline"
                            >
                              在线服务
                            </a>
                            」中部署的大语言模型。若该模型不支持深度思考或工具调用，Agent 的规划与执行能力可能受限，输出效果可能不稳定
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  </TabsTrigger>
                </TabsList>

                {/* Preset Models */}
                <TabsContent value="preset" className="mt-4 space-y-1">
                  {presetModels.map((model) => renderModelOption(model))}
                </TabsContent>

                {/* Exclusive Models */}
                <TabsContent value="exclusive" className="mt-4 space-y-1">
                  {exclusiveModels.map((model) => renderModelOption(model, false))}
                </TabsContent>
              </Tabs>
            )}
          </div>

          {showParams && !separateParamsPopover && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-900 mb-2">
                参数配置
              </h3>
              <div className="space-y-4">
                {currentSchema.supportedParams
                  .filter((p) => !hiddenParamKeySet.has(p.key))
                  .map((p) => (
                    <div key={p.key}>{renderParam(p)}</div>
                  ))}

                {/* 全局开关：当前时间、SP防泄漏指令（所有模型均展示，默认关闭） */}
                {!hiddenParamKeySet.has("current_time") ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-slate-700">当前时间</Label>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <button type="button" className="cursor-help">
                              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8} className="max-w-64 p-3 text-xs text-slate-700">
                            {TOOLTIP_CONTENT.current_time}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        checked={Boolean(params.current_time ?? false)}
                        onCheckedChange={(checked) => handleParamChange("current_time", checked)}
                      />
                    </div>
                  </div>
                ) : null}
                {!hiddenParamKeySet.has("sp_anti_leak") ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-slate-700">SP防泄漏指令</Label>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <button type="button" className="cursor-help">
                              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8} className="max-w-64 p-3 text-xs text-slate-700">
                            {TOOLTIP_CONTENT.sp_anti_leak}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        checked={Boolean(params.sp_anti_leak ?? false)}
                        onCheckedChange={(checked) => handleParamChange("sp_anti_leak", checked)}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
    </div>
    </TooltipProvider>
  );
}
