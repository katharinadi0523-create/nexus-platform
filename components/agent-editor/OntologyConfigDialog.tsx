"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface OntologyConfig {
  ontology: string; // Level 1
  objectType: string; // Level 2
  property: string; // Level 3
  queryRewrite: boolean;
  retrievalMethod: "full" | "semantic";
  retrievalVector?: string;
  topK: number;
  threshold: number;
  injectionFields: string[];
}

interface OntologyConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialConfig?: OntologyConfig;
  onSave?: (config: OntologyConfig) => void;
}

// 三级级联选择数据：本体 -> 对象类型 -> 属性
const ontologyData: Record<string, Record<string, string[]>> = {
  "海上态势感知": {
    战斗机: ["驾驶员", "载重", "时速", "位置(经纬度)", "所属空军基地", "服役年限"],
    航空母舰: ["排水量", "舰载机数量", "最大航速", "服役年限"],
    海军陆战队: ["人数", "装备类型", "部署位置"],
    无人机: ["续航时间", "最大航程", "载重", "控制方式"],
    运输机: ["载重", "航程", "最大速度"],
    运输船: ["载重", "航速", "船型"],
    哨塔: ["位置", "高度", "装备"],
    战例: ["战舰", "航迹", "时间", "意图", "作战区域", "参战兵力", "作战结果", "战术类型"],
  },
  "装备维修检测": {
    战斗机: ["驾驶员", "载重", "时速", "位置(经纬度)", "所属空军基地", "服役年限"],
    无人机: ["续航时间", "最大航程", "载重", "控制方式"],
    坦克: ["装甲厚度", "主炮口径", "越野速度"],
    "海底石油开采": ["开采深度", "日产量", "设备类型"],
    侦察机: ["侦察设备", "航程", "最大速度"],
  },
};

const defaultConfig: OntologyConfig = {
  ontology: "",
  objectType: "",
  property: "",
  queryRewrite: true,
  retrievalMethod: "full",
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

  const availableObjects = config.ontology
    ? Object.keys(ontologyData[config.ontology] || {})
    : [];

  const availableProperties = config.ontology && config.objectType
    ? ontologyData[config.ontology]?.[config.objectType] || []
    : [];

  // 注入字段现在就是选中的属性，但为了兼容性，我们仍然使用 injectionFields
  // 实际上，当选择了属性后，该属性会自动添加到 injectionFields
  const availableFields = availableProperties;

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
      // 当选择属性时，自动将其添加到注入字段（如果还没有的话）
      injectionFields: config.injectionFields.includes(value)
        ? config.injectionFields
        : [...config.injectionFields, value],
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>本体配置</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* A. 检索对象 - 三级级联选择 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">检索对象</Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-slate-500 mb-2 block">
                  <span className="text-red-500">*</span> 本体
                </Label>
                <Select
                  value={config.ontology}
                  onValueChange={handleOntologyChange}
                  placeholder="请选择本体"
                  options={Object.keys(ontologyData).map((key) => ({
                    value: key,
                    label: key,
                  }))}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-2 block">
                  <span className="text-red-500">*</span> 检索对象
                </Label>
                <Select
                  value={config.objectType}
                  onValueChange={handleObjectTypeChange}
                  placeholder="请选择检索对象"
                  options={availableObjects.map((obj) => ({
                    value: obj,
                    label: obj,
                  }))}
                  className={!config.ontology ? "opacity-50" : ""}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-2 block">
                  属性
                </Label>
                <Select
                  value={config.property}
                  onValueChange={handlePropertyChange}
                  placeholder="请选择属性"
                  options={availableProperties.map((prop) => ({
                    value: prop,
                    label: prop,
                  }))}
                  className={!config.objectType ? "opacity-50" : ""}
                />
              </div>
            </div>
          </div>

          {/* B. Query 改写 */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Query 改写</Label>
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

          {/* C. 检索方式 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">检索方式</Label>
            <RadioGroup
              value={config.retrievalMethod}
              onValueChange={(value) =>
                setConfig({
                  ...config,
                  retrievalMethod: value as "full" | "semantic",
                  retrievalVector: value === "semantic" ? config.retrievalVector : undefined,
                })
              }
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="cursor-pointer">
                  全量检索
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="semantic" id="semantic" />
                <Label htmlFor="semantic" className="cursor-pointer">
                  语义检索
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* D. 检索向量 - 条件显示 */}
          {config.retrievalMethod === "semantic" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">检索向量</Label>
              <Select
                value={config.retrievalVector || ""}
                onValueChange={(value) =>
                  setConfig({ ...config, retrievalVector: value })
                }
                placeholder="请选择检索向量"
                options={[
                  { value: "战斗风格_向量", label: "战斗风格_向量" },
                  { value: "机动性能_向量", label: "机动性能_向量" },
                  { value: "武器挂载_向量", label: "武器挂载_向量" },
                ]}
              />
            </div>
          )}

          {/* E. Top K */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium">Top K</Label>
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
            <div className="flex items-center gap-3">
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
                className="w-20 h-8 text-xs"
              />
            </div>
          </div>

          {/* F. 阈值分 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">阈值分</Label>
            <div className="flex items-center gap-3">
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
                className="w-20 h-8 text-xs"
              />
            </div>
          </div>

          {/* G. 注入配置 */}
          {config.objectType && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm font-medium">注入配置</Label>
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
                    将召回对象的哪些关联字段注入到模型的上下文中
                  </PopoverContent>
                </Popover>
              </div>
              {availableFields.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  {availableFields.map((field) => (
                    <div
                      key={field}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        id={field}
                        checked={config.injectionFields.includes(field)}
                        onCheckedChange={() => handleInjectionFieldToggle(field)}
                      />
                      <Label
                        htmlFor={field}
                        className="text-sm text-slate-700 cursor-pointer"
                      >
                        {field}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-500 text-center">
                  请先选择对象类型和属性
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            确定
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
