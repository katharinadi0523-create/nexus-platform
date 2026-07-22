"use client";

import { useState, type ReactNode } from "react";
import { Check, ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type RetrievalEngineId =
  | "fulltext"
  | "semantic"
  | "pageindex"
  | "graph";

export interface RetrievalConfigState {
  engines: RetrievalEngineId[];
  fulltext: {
    algorithm: "DAAT_MAXSCORE" | "DAAT_WAND" | "TAAT_NAIVE";
    k1: number;
    b: number;
  };
  semantic: {
    metric: "COSINE" | "IP" | "L2";
    topK: number;
  };
  pageindex: {
    maxDepth: number;
  };
  graph: {
    prompt: string;
  };
}

export const defaultRetrievalConfig: RetrievalConfigState = {
  engines: ["fulltext", "semantic"],
  fulltext: {
    algorithm: "DAAT_MAXSCORE",
    k1: 1.2,
    b: 0.75,
  },
  semantic: {
    metric: "COSINE",
    topK: 10,
  },
  pageindex: {
    maxDepth: 3,
  },
  graph: {
    prompt: "",
  },
};

const ENGINE_OPTIONS: {
  id: RetrievalEngineId;
  title: string;
  description: string;
}[] = [
  {
    id: "fulltext",
    title: "全文检索",
    description: "基于 BM25 的稀疏向量倒排索引，适合关键词精确匹配",
  },
  {
    id: "semantic",
    title: "语义检索",
    description: "基于 Embedding 的稠密向量索引，适合语义相似与智能问答",
  },
  {
    id: "pageindex",
    title: "PageIndex 检索",
    description: "基于文档层级结构的 Page Index，适合长文档全局理解",
  },
  {
    id: "graph",
    title: "图谱检索",
    description: "基于图谱检索方式召回参考来源，适用于多文档关联性问题",
  },
];

function HelpTip({ content }: { content: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-help">
          <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 text-xs text-slate-600" side="top">
        {content}
      </PopoverContent>
    </Popover>
  );
}

function EngineCard({
  title,
  description,
  selected,
  onToggle,
}: {
  title: string;
  description: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative flex min-h-[108px] flex-col rounded-lg border p-4 text-left transition-all",
        selected
          ? "border-[#2773ff] bg-[#2773ff]/5"
          : "border-slate-200 bg-white hover:border-slate-300"
      )}
    >
      {selected && (
        <div
          className="absolute right-0 top-0 flex h-7 w-7 items-start justify-end overflow-hidden rounded-tr-lg"
          aria-hidden
        >
          <div className="h-0 w-0 border-l-[28px] border-t-[28px] border-l-transparent border-t-[#2773ff]" />
          <Check className="absolute right-[3px] top-[3px] h-3 w-3 text-white" />
        </div>
      )}
      <h3
        className={cn(
          "mb-2 pr-5 text-sm font-semibold",
          selected ? "text-[#2773ff]" : "text-slate-800"
        )}
      >
        {title}
      </h3>
      <p className="text-xs leading-relaxed text-slate-500">{description}</p>
    </button>
  );
}

function CollapseSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 py-3 text-left text-sm font-medium text-slate-800 hover:text-[#2773ff]"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
        {title}
      </button>
      {open && <div className="space-y-5 pb-4 pl-6">{children}</div>}
    </div>
  );
}

function ConfigField({
  label,
  tip,
  children,
  hint,
}: {
  label: string;
  tip?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-4">
      <div className="flex items-center gap-1 pt-1.5">
        <span className="text-sm text-slate-600">{label}</span>
        {tip && <HelpTip content={tip} />}
      </div>
      <div className="min-w-0 space-y-1.5">
        {children}
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

function TagValue({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded border border-[#2773ff]/40 bg-blue-50 px-2.5 py-1 text-xs font-medium text-[#2773ff]">
      {children}
    </span>
  );
}

function OptionPill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded border px-3 py-1.5 text-xs font-medium transition-colors",
        selected
          ? "border-[#2773ff] bg-blue-50 text-[#2773ff]"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      )}
    >
      {children}
    </button>
  );
}

function SliderWithInput({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(vals) => onChange(vals[0] ?? min)}
        className="max-w-md flex-1 [&_[data-slot=slider-range]]:bg-[#2773ff] [&_[data-slot=slider-thumb]]:border-[#2773ff]"
      />
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (Number.isNaN(next)) return;
          onChange(Math.min(max, Math.max(min, next)));
        }}
        className="h-8 w-20"
      />
    </div>
  );
}

interface RetrievalConfigStepProps {
  value: RetrievalConfigState;
  onChange: (value: RetrievalConfigState) => void;
  showEngineError?: boolean;
}

export function RetrievalConfigStep({
  value,
  onChange,
  showEngineError = false,
}: RetrievalConfigStepProps) {
  const toggleEngine = (id: RetrievalEngineId) => {
    const exists = value.engines.includes(id);
    onChange({
      ...value,
      engines: exists
        ? value.engines.filter((item) => item !== id)
        : [...value.engines, id],
    });
  };

  const patch = <K extends keyof RetrievalConfigState>(
    key: K,
    next: RetrievalConfigState[K]
  ) => {
    onChange({ ...value, [key]: next });
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex items-center gap-1.5">
        <h2 className="text-base font-semibold text-slate-900">检索配置</h2>
        <HelpTip content="选择知识库需要启用的检索引擎，并为每个引擎配置检索参数。" />
      </div>

      {/* Engine selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-1">
          <span className="text-red-500">*</span>
          <Label className="text-sm text-slate-700">核心检索引擎</Label>
          <HelpTip content="至少选择一种检索引擎，可多选。" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {ENGINE_OPTIONS.map((engine) => (
            <EngineCard
              key={engine.id}
              title={engine.title}
              description={engine.description}
              selected={value.engines.includes(engine.id)}
              onToggle={() => toggleEngine(engine.id)}
            />
          ))}
        </div>
        {showEngineError && value.engines.length === 0 && (
          <p className="text-xs text-red-500">请至少选择一种核心检索引擎</p>
        )}
      </div>

      {/* Fulltext config */}
      {value.engines.includes("fulltext") && (
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <span className="text-red-500">*</span>
            <Label className="text-sm text-slate-700">全文检索</Label>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4">
            <CollapseSection title="索引配置" defaultOpen>
              <ConfigField
                label="索引类型"
                tip="标准倒排索引结构"
                hint="标准倒排索引：最基础的全文检索结构，全面记录词汇与文档的映射，保证最高召回率"
              >
                <TagValue>SPARSE_INVERTED_INDEX</TagValue>
              </ConfigField>

              <ConfigField
                label="倒排检索算法"
                tip="选择倒排检索的执行策略"
                hint={
                  value.fulltext.algorithm === "DAAT_MAXSCORE"
                    ? "兼顾极速与 100% 精度"
                    : value.fulltext.algorithm === "DAAT_WAND"
                      ? "更快的近似检索算法"
                      : "逐词累加的朴素检索算法"
                }
              >
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "DAAT_MAXSCORE",
                      "DAAT_WAND",
                      "TAAT_NAIVE",
                    ] as const
                  ).map((algo) => (
                    <OptionPill
                      key={algo}
                      selected={value.fulltext.algorithm === algo}
                      onClick={() =>
                        patch("fulltext", {
                          ...value.fulltext,
                          algorithm: algo,
                        })
                      }
                    >
                      {algo}
                    </OptionPill>
                  ))}
                </div>
              </ConfigField>

              <ConfigField
                label="词频饱和度"
                tip="BM25 的 k1 参数"
                hint="阈值范围区间：1.2 ~ 2.0 (精度 0.1)"
              >
                <SliderWithInput
                  value={value.fulltext.k1}
                  min={1.2}
                  max={2}
                  step={0.1}
                  onChange={(k1) =>
                    patch("fulltext", { ...value.fulltext, k1 })
                  }
                />
              </ConfigField>

              <ConfigField
                label="文档长度归一化"
                tip="BM25 的 b 参数"
                hint="阈值范围区间：0 ~ 1.0 (精度 0.01)"
              >
                <SliderWithInput
                  value={value.fulltext.b}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(b) => patch("fulltext", { ...value.fulltext, b })}
                />
              </ConfigField>

              <ConfigField label="距离度量" tip="全文检索相关性度量方式">
                <TagValue>BM25</TagValue>
              </ConfigField>
            </CollapseSection>

            <CollapseSection title="分析器配置">
              <ConfigField
                label="分词器"
                tip="文本切词方式"
                hint="默认使用标准分词器，适合中英文混合文档"
              >
                <TagValue>STANDARD</TagValue>
              </ConfigField>
              <ConfigField label="是否小写化" tip="英文统一转小写">
                <TagValue>true</TagValue>
              </ConfigField>
            </CollapseSection>
          </div>
        </div>
      )}

      {/* Semantic config */}
      {value.engines.includes("semantic") && (
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <span className="text-red-500">*</span>
            <Label className="text-sm text-slate-700">语义检索</Label>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4">
            <CollapseSection title="向量索引配置" defaultOpen>
              <ConfigField label="索引类型" tip="稠密向量索引">
                <TagValue>DENSE_VECTOR_INDEX</TagValue>
              </ConfigField>
              <ConfigField
                label="距离度量"
                tip="向量相似度计算方式"
              >
                <div className="flex flex-wrap gap-2">
                  {(["COSINE", "IP", "L2"] as const).map((metric) => (
                    <OptionPill
                      key={metric}
                      selected={value.semantic.metric === metric}
                      onClick={() =>
                        patch("semantic", { ...value.semantic, metric })
                      }
                    >
                      {metric}
                    </OptionPill>
                  ))}
                </div>
              </ConfigField>
              <ConfigField
                label="召回数量 TopK"
                tip="语义检索默认召回条数"
                hint="阈值范围区间：1 ~ 50"
              >
                <SliderWithInput
                  value={value.semantic.topK}
                  min={1}
                  max={50}
                  step={1}
                  onChange={(topK) =>
                    patch("semantic", { ...value.semantic, topK })
                  }
                />
              </ConfigField>
            </CollapseSection>
            <CollapseSection title="模型配置">
              <ConfigField label="Embedding 模型" tip="用于生成稠密向量">
                <TagValue>bge-m3</TagValue>
              </ConfigField>
            </CollapseSection>
          </div>
        </div>
      )}

      {/* PageIndex config */}
      {value.engines.includes("pageindex") && (
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <span className="text-red-500">*</span>
            <Label className="text-sm text-slate-700">PageIndex 检索</Label>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4">
            <CollapseSection title="层级索引配置" defaultOpen>
              <ConfigField label="索引类型" tip="文档层级 Page Index">
                <TagValue>PAGE_INDEX</TagValue>
              </ConfigField>
              <ConfigField
                label="最大层级深度"
                tip="文档标题层级解析深度"
                hint="阈值范围区间：1 ~ 6"
              >
                <SliderWithInput
                  value={value.pageindex.maxDepth}
                  min={1}
                  max={6}
                  step={1}
                  onChange={(maxDepth) =>
                    patch("pageindex", { ...value.pageindex, maxDepth })
                  }
                />
              </ConfigField>
            </CollapseSection>
          </div>
        </div>
      )}

      {/* Graph config */}
      {value.engines.includes("graph") && (
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <span className="text-red-500">*</span>
            <Label className="text-sm text-slate-700">图谱检索</Label>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label className="text-sm text-slate-700">提示词</Label>
                <HelpTip content="用于引导图谱检索的提示词，帮助模型理解多文档关联问题。" />
              </div>
              <div className="relative">
                <Textarea
                  value={value.graph.prompt}
                  maxLength={800}
                  rows={5}
                  placeholder="请输入图谱检索提示词，用于描述实体关系抽取与召回偏好"
                  onChange={(e) =>
                    patch("graph", { ...value.graph, prompt: e.target.value })
                  }
                  className="resize-none pb-6"
                />
                <span className="absolute bottom-2 right-3 text-xs text-slate-400">
                  {value.graph.prompt.length}/800
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
