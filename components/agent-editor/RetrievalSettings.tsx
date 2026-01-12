"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface RetrievalSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSettings?: RetrievalConfig;
  onSave?: (settings: RetrievalConfig) => void;
}

export interface RetrievalConfig {
  strategy: "hybrid" | "fulltext" | "semantic";
  semanticWeight: number; // 0-1, 语义权重
  rerankEnabled: boolean;
  topK: number;
  scoreThresholdEnabled: boolean;
  scoreThreshold: number;
  autoTagFilterEnabled: boolean;
}

const defaultSettings: RetrievalConfig = {
  strategy: "hybrid",
  semanticWeight: 0.6,
  rerankEnabled: true,
  topK: 6,
  scoreThresholdEnabled: true,
  scoreThreshold: 0.1,
  autoTagFilterEnabled: false,
};

export function RetrievalSettings({
  open,
  onOpenChange,
  initialSettings = defaultSettings,
  onSave,
}: RetrievalSettingsProps) {
  const [settings, setSettings] = useState<RetrievalConfig>(initialSettings);

  const handleSave = () => {
    onSave?.(settings);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSettings(initialSettings);
    onOpenChange(false);
  };

  const semanticWeight = settings.semanticWeight;
  const keywordWeight = 1 - semanticWeight;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>检索配置</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 检索策略 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">检索策略</Label>
            <RadioGroup
              value={settings.strategy}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  strategy: value as RetrievalConfig["strategy"],
                })
              }
              className="space-y-3"
            >
              {/* 混合检索 */}
              <div
                className={cn(
                  "relative p-4 rounded-lg border-2 cursor-pointer transition-colors",
                  settings.strategy === "hybrid"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
                onClick={() =>
                  setSettings({ ...settings, strategy: "hybrid" })
                }
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="hybrid" id="hybrid" className="mt-0.5" />
                  <div className="flex-1">
                    <Label
                      htmlFor="hybrid"
                      className="text-base font-medium text-slate-900 cursor-pointer"
                    >
                      混合检索
                    </Label>
                    <p className="text-sm text-slate-500 mt-1.5">
                      同时使用全文检索和语义检索策略检索知识要点，召回对应切片内容。推荐同时需要句子语义理解和关键词匹配的场景，整体效果更好。
                    </p>
                  </div>
                </div>
              </div>

              {/* 全文检索 */}
              <div
                className={cn(
                  "relative p-4 rounded-lg border-2 cursor-pointer transition-colors",
                  settings.strategy === "fulltext"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
                onClick={() =>
                  setSettings({ ...settings, strategy: "fulltext" })
                }
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem
                    value="fulltext"
                    id="fulltext"
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="fulltext"
                      className="text-base font-medium text-slate-900 cursor-pointer"
                    >
                      全文检索
                    </Label>
                    <p className="text-sm text-slate-500 mt-1.5">
                      使用全文检索策略检索知识要点，召回对应切片内容，返回与查询关键词匹配度高的内容。推荐需要精确匹配查询关键词的场景。
                    </p>
                  </div>
                </div>
              </div>

              {/* 语义检索 */}
              <div
                className={cn(
                  "relative p-4 rounded-lg border-2 cursor-pointer transition-colors",
                  settings.strategy === "semantic"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
                onClick={() =>
                  setSettings({ ...settings, strategy: "semantic" })
                }
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem
                    value="semantic"
                    id="semantic"
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="semantic"
                      className="text-base font-medium text-slate-900 cursor-pointer"
                    >
                      语义检索
                    </Label>
                    <p className="text-sm text-slate-500 mt-1.5">
                      使用语义检索策略检索知识要点，召回对应切片内容，返回与查询含义匹配的内容。推荐需要匹配上下文相关性和意图相关性的场景。
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* 重排序配置 */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <Label className="text-base font-semibold">重排序配置</Label>

            {/* 按比例分配 */}
            {settings.strategy === "hybrid" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">按比例分配:</Label>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>语义{semanticWeight.toFixed(2)}</span>
                    <span>/</span>
                    <span>{keywordWeight.toFixed(2)}关键词</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-12">语义</span>
                  <Slider
                    value={[semanticWeight * 100]}
                    onValueChange={([value]) =>
                      setSettings({
                        ...settings,
                        semanticWeight: value / 100,
                      })
                    }
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-slate-500 w-16">关键词</span>
                  <Input
                    type="number"
                    value={semanticWeight.toFixed(2)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val >= 0 && val <= 1) {
                        setSettings({ ...settings, semanticWeight: val });
                      }
                    }}
                    step="0.01"
                    min="0"
                    max="1"
                    className="w-20"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  通过调整两种检索方式匹配分数的权重占比，确定两种检索方式的优先级。
                </p>
              </div>
            )}

            {/* 重排序 */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium">重排序:</Label>
                <p className="text-xs text-slate-500 mt-1">
                  重排序模型会根据知识库内容与用户问题的语义匹配程度，对召回的切片进行重新排序，从而提升初始排序结果。
                </p>
              </div>
              <Switch
                checked={settings.rerankEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, rerankEnabled: checked })
                }
                className="ml-4"
              />
              <span className="ml-2 text-sm text-slate-600 min-w-[24px]">
                {settings.rerankEnabled ? "开" : "关"}
              </span>
            </div>

            {/* Top K */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Top K:</Label>
                <Input
                  type="number"
                  value={settings.topK}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1) {
                      setSettings({ ...settings, topK: val });
                    }
                  }}
                  min="1"
                  className="w-20"
                />
              </div>
              <Slider
                value={[settings.topK]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, topK: value })
                }
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-slate-500">
                从知识库中召回与输入 Query 匹配的切片数量上限。
              </p>
            </div>

            {/* Score 阈值 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Score阈值:</Label>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.scoreThresholdEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        scoreThresholdEnabled: checked,
                      })
                    }
                  />
                  <span className="text-sm text-slate-600 min-w-[24px]">
                    {settings.scoreThresholdEnabled ? "开" : "关"}
                  </span>
                </div>
              </div>
              {settings.scoreThresholdEnabled && (
                <>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[settings.scoreThreshold]}
                      onValueChange={([value]) =>
                        setSettings({ ...settings, scoreThreshold: value })
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={settings.scoreThreshold.toFixed(2)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0 && val <= 1) {
                          setSettings({
                            ...settings,
                            scoreThreshold: val,
                          });
                        }
                      }}
                      step="0.01"
                      min="0"
                      max="1"
                      className="w-20"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    系统会过滤掉与输入 Query 的匹配分数 ≥
                    此阈值的切片；低于阈值的切片会被过滤掉。
                  </p>
                </>
              )}
            </div>

            {/* 自动标签过滤 */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium">自动标签过滤:</Label>
                <p className="text-xs text-slate-500 mt-1">
                  根据查询问题自动生成标签过滤条件。如果应用当前挂载的知识库没有标签，知识库标签配置将不会生效。
                </p>
              </div>
              <Switch
                checked={settings.autoTagFilterEnabled}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    autoTagFilterEnabled: checked,
                  })
                }
                className="ml-4"
              />
              <span className="ml-2 text-sm text-slate-600 min-w-[24px]">
                {settings.autoTagFilterEnabled ? "开" : "关"}
              </span>
            </div>
          </div>
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
