"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ontologyDataWithMetadata } from "@/lib/mock-ontology-data";

export interface OntologyConfig {
  ontology: string; // Level 1
  objectType: string; // Level 2
  property: string; // Level 3 - 检索目标字段
  queryRewrite: boolean;
  retrievalMethod: "structured" | "semantic"; // mode_a: structured, mode_b: semantic
  semanticWeight?: number; // 语义检索权重 (0-1)，仅在语义检索时使用
  topK: number;
  threshold: number;
  injectionFields: string[]; // 注入字段列表（自动过滤向量字段）
}

interface OntologyConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialConfig?: OntologyConfig;
  onSave?: (config: OntologyConfig) => void;
}

const defaultConfig: OntologyConfig = {
  ontology: "",
  objectType: "",
  property: "",
  queryRewrite: true,
  retrievalMethod: "structured",
  semanticWeight: 0.6, // 默认语义权重 0.6，关键词权重 0.4
  topK: 20,
  threshold: 0.6,
  injectionFields: [],
};

export function OntologyConfigDialog({
  open,
  onOpenChange,
  initialConfig = defaultConfig,
  onSave,
}: OntologyConfigDialogProps) {
  const [config, setConfig] = useState<OntologyConfig>(initialConfig);

  const handleSave = () => {
    onSave?.(config);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setConfig(initialConfig);
    onOpenChange(false);
  };

  // 获取可用对象类型列表
  const availableObjects = useMemo(() => {
    if (!config.ontology) return [];
    return Object.keys(ontologyDataWithMetadata[config.ontology] || {});
  }, [config.ontology]);

  // 获取当前对象类型的所有属性（带元数据）
  const allProperties = useMemo(() => {
    if (!config.ontology || !config.objectType) return [];
    return ontologyDataWithMetadata[config.ontology]?.[config.objectType] || [];
  }, [config.ontology, config.objectType]);

  // Block 3: 根据检索方式过滤属性
  // Mode A (结构化检索): 只显示非向量字段
  // Mode B (语义检索): 只显示向量字段
  const availableTargetProperties = useMemo(() => {
    if (config.retrievalMethod === "structured") {
      return allProperties.filter((prop) => !prop.isVector);
    } else {
      // semantic
      return allProperties.filter((prop) => prop.isVector === true);
    }
  }, [allProperties, config.retrievalMethod]);

  // Block 5: 注入字段（自动过滤向量字段）
  const availableInjectionFields = useMemo(() => {
    return allProperties.filter((prop) => !prop.isVector);
  }, [allProperties]);

  const handleOntologyChange = (value: string) => {
    setConfig({
      ...config,
      ontology: value,
      objectType: "", // 重置对象类型
      property: "", // 重置属性
      injectionFields: [], // 重置注入字段
    });
  };

  const handleObjectTypeChange = (value: string) => {
    setConfig({
      ...config,
      objectType: value,
      property: "", // 重置属性
      injectionFields: [], // 重置注入字段
    });
  };

  const handlePropertyChange = (value: string) => {
    setConfig({
      ...config,
      property: value,
    });
  };

  const handleRetrievalMethodChange = (value: "structured" | "semantic") => {
    setConfig({
      ...config,
      retrievalMethod: value,
      property: "", // 重置目标字段
    });
  };

  const handleInjectionFieldToggle = (field: string) => {
    setConfig({
      ...config,
      injectionFields: config.injectionFields.includes(field)
        ? config.injectionFields.filter((f) => f !== field)
        : [...config.injectionFields, field],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto !p-6">
        <DialogHeader className="!pb-2 !mb-0">
          <DialogTitle className="text-lg font-semibold">本体配置</DialogTitle>
        </DialogHeader>

        <div className="space-y-8 !pt-0">
          {/* Block 1: Query Rewrite */}
          <div className="flex items-center justify-between py-2">
            <Label className="text-base font-medium">Query 改写</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.queryRewrite}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, queryRewrite: checked })
                }
              />
              <span className="text-sm text-slate-600 min-w-[24px]">
                {config.queryRewrite ? "开" : "关"}
              </span>
            </div>
          </div>

          {/* Block 2: Retrieval Method */}
          <div className="space-y-4">
            <Label className="text-base font-medium">检索方式</Label>
            <div className="grid grid-cols-2 gap-4">
              {/* Option A: 结构化检索 */}
              <button
                type="button"
                onClick={() => handleRetrievalMethodChange("structured")}
                className={cn(
                  "relative p-5 rounded-lg border-2 transition-all text-left",
                  "hover:border-slate-300",
                  config.retrievalMethod === "structured"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 bg-white"
                )}
              >
                {config.retrievalMethod === "structured" && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                <div className="font-semibold text-base text-slate-900 mb-2">
                  结构化检索
                </div>
                <div className="text-sm text-slate-500 leading-relaxed">
                  基于精确匹配和结构化查询，适用于已知字段值的场景
                </div>
              </button>

              {/* Option B: 语义检索 */}
              <button
                type="button"
                onClick={() => handleRetrievalMethodChange("semantic")}
                className={cn(
                  "relative p-5 rounded-lg border-2 transition-all text-left",
                  "hover:border-slate-300",
                  config.retrievalMethod === "semantic"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 bg-white"
                )}
              >
                {config.retrievalMethod === "semantic" && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                <div className="font-semibold text-base text-slate-900 mb-2">
                  语义检索
                </div>
                <div className="text-sm text-slate-500 leading-relaxed">
                  基于向量相似度匹配，适用于理解语义意图的场景
                </div>
              </button>
            </div>

            {/* 混合权重配置 - 仅在语义检索时显示 */}
            {config.retrievalMethod === "semantic" && (
              <div className="space-y-4 pt-4 mt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">按比例分配:</Label>
                  <div className="text-sm text-slate-600 font-medium">
                    语义{(config.semanticWeight || 0.6).toFixed(2)} / {(1 - (config.semanticWeight || 0.6)).toFixed(2)}关键词
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600 min-w-[50px] font-medium">语义</span>
                    <div className="flex-1 relative">
                      <Slider
                        value={[config.semanticWeight || 0.6]}
                        onValueChange={([value]) =>
                          setConfig({ ...config, semanticWeight: value })
                        }
                        min={0}
                        max={1}
                        step={0.01}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-sm text-slate-600 min-w-[60px] text-right font-medium">关键词</span>
                    <Input
                      type="number"
                      value={(config.semanticWeight || 0.6).toFixed(2)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0 && val <= 1) {
                          setConfig({ ...config, semanticWeight: val });
                        }
                      }}
                      step="0.01"
                      min="0"
                      max="1"
                      className="w-24 h-9 text-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    通过调整两种检索方式匹配分数的权重占比，确定两种检索方式的优先级。
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Block 3: Target Selection (3-Level Cascade) */}
          <div className="space-y-4">
            <Label className="text-base font-medium">检索目标</Label>
            <div className="grid grid-cols-3 gap-4">
              {/* Level 1: Ontology */}
              <div>
                <Label className="text-sm text-slate-600 mb-2.5 block">
                  <span className="text-red-500">*</span> 本体
                </Label>
                <Select
                  value={config.ontology}
                  onValueChange={handleOntologyChange}
                  placeholder="请选择本体"
                  options={Object.keys(ontologyDataWithMetadata).map((key) => ({
                    value: key,
                    label: key,
                  }))}
                />
              </div>

              {/* Level 2: Object Type */}
              <div>
                <Label className="text-sm text-slate-600 mb-2.5 block">
                  <span className="text-red-500">*</span> 对象类型
                </Label>
                <Select
                  value={config.objectType}
                  onValueChange={handleObjectTypeChange}
                  placeholder="请选择对象类型"
                  options={availableObjects.map((obj) => ({
                    value: obj,
                    label: obj,
                  }))}
                  className={!config.ontology ? "opacity-50" : ""}
                />
              </div>

              {/* Level 3: Target Property (Filtered by Method) */}
              <div>
                <Label className="text-sm text-slate-600 mb-2.5 block">
                  属性
                </Label>
                <Select
                  value={config.property}
                  onValueChange={handlePropertyChange}
                  placeholder="请选择属性"
                  options={availableTargetProperties.map((prop) => ({
                    value: prop.name,
                    label: prop.name,
                  }))}
                  className={!config.objectType ? "opacity-50" : ""}
                />
              </div>
            </div>

            {/* Hint for semantic retrieval */}
            {config.retrievalMethod === "semantic" && !config.property && (
              <p className="text-xs text-slate-500 mt-1">
                提示：语义检索需要选择向量字段（如 route_embedding）
              </p>
            )}
          </div>

          {/* Block 4: Parameters */}
          <div className="space-y-5">
            {/* Top K */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Label className="text-base font-medium">Top K</Label>
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
                    召回的相关对象个数
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[config.topK]}
                  onValueChange={([value]) =>
                    setConfig({ ...config, topK: value })
                  }
                  min={1}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={config.topK}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 100) {
                      setConfig({ ...config, topK: val });
                    }
                  }}
                  min="1"
                  max="100"
                  step="1"
                  className="w-24 h-9 text-sm"
                />
              </div>
            </div>

            {/* Threshold */}
            <div className="space-y-3">
              <Label className="text-base font-medium">阈值分</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[config.threshold]}
                  onValueChange={([value]) =>
                    setConfig({ ...config, threshold: value })
                  }
                  min={0}
                  max={1}
                  step={0.01}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={config.threshold.toFixed(2)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= 1) {
                      setConfig({ ...config, threshold: val });
                    }
                  }}
                  step="0.01"
                  min="0"
                  max="1"
                  className="w-24 h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Block 5: Context Injection (Strict Filter) */}
          {config.objectType && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Label className="text-base font-medium">
                  注入字段配置
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
                    选择检索命中后，注入到 Agent 上下文的属性（自动过滤向量字段）
                  </PopoverContent>
                </Popover>
              </div>
              {availableInjectionFields.length > 0 ? (
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  {availableInjectionFields.map((field) => (
                    <div key={field.name} className="flex items-center gap-2">
                      <Checkbox
                        id={`injection-${field.name}`}
                        checked={config.injectionFields.includes(field.name)}
                        onCheckedChange={() => handleInjectionFieldToggle(field.name)}
                      />
                      <Label
                        htmlFor={`injection-${field.name}`}
                        className="text-sm text-slate-700 cursor-pointer"
                      >
                        {field.name}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-500 text-center">
                  请先选择对象类型
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 gap-3">
          <button
            onClick={handleCancel}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            确定
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
