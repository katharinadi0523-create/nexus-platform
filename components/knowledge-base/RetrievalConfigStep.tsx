"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { ModelSelector, type ModelParams } from "@/components/agent-editor/ModelSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getDefaultModelParams } from "@/lib/model-schemas";
import { cn } from "@/lib/utils";

export type RetrievalEngineId =
  | "fulltext"
  | "semantic"
  | "pageindex"
  | "graph";

export type GraphCategoryMode = "system" | "custom";

export interface GraphNamedItem {
  id: string;
  name: string;
  description: string;
  /** 用户手动添加的同义词，标签展示 */
  synonyms: string[];
}

export interface GraphEntityConfig {
  prompt: string;
  categoryMode: GraphCategoryMode;
  customItems: GraphNamedItem[];
  /** 将实体名称、描述、枚举值等向量化，用于语义检索 */
  vectorize: boolean;
  similarityMerge: number;
}

export interface GraphRelationConfig {
  prompt: string;
  categoryMode: GraphCategoryMode;
  customItems: GraphNamedItem[];
}

export interface GraphRetrievalConfig {
  model: string;
  modelParams: ModelParams;
  entity: GraphEntityConfig;
  relation: GraphRelationConfig;
}

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
  graph: GraphRetrievalConfig;
}

const DEFAULT_GRAPH_MODEL = "Qwen3-32B";

function createNamedItem(): GraphNamedItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    description: "",
    synonyms: [],
  };
}

/** 同义词标签输入：Enter 添加，标签可删除 */
function SynonymTagInput({
  synonyms,
  onChange,
  placeholder = "输入同义词后按 Enter 添加",
}: {
  synonyms: string[];
  onChange: (synonyms: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const addSynonym = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    if (synonyms.some((s) => s.toLowerCase() === next.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...synonyms, next]);
    setDraft("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSynonym(draft);
    } else if (e.key === "Backspace" && !draft && synonyms.length > 0) {
      onChange(synonyms.slice(0, -1));
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="text-xs text-slate-500">同义词</div>
      <div className="min-h-[40px] rounded-md border border-slate-200 bg-white px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {synonyms.map((synonym) => (
            <Badge
              key={synonym}
              variant="secondary"
              className="gap-1 bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-700 hover:bg-slate-100"
            >
              {synonym}
              <button
                type="button"
                aria-label={`删除同义词 ${synonym}`}
                onClick={() =>
                  onChange(synonyms.filter((s) => s !== synonym))
                }
                className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={synonyms.length === 0 ? placeholder : "继续添加…"}
            className="h-7 min-w-[120px] flex-1 border-0 px-1 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
    </div>
  );
}

export const defaultGraphRetrievalConfig: GraphRetrievalConfig = {
  model: DEFAULT_GRAPH_MODEL,
  modelParams: getDefaultModelParams(DEFAULT_GRAPH_MODEL),
  entity: {
    prompt: "",
    categoryMode: "system",
    customItems: [],
    vectorize: false,
    similarityMerge: 0.8,
  },
  relation: {
    prompt: "",
    categoryMode: "system",
    customItems: [],
  },
};

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
  graph: defaultGraphRetrievalConfig,
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

function PromptField({
  label,
  tip,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  tip?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <ConfigField label={label} tip={tip}>
      <div className="relative">
        <Textarea
          value={value}
          maxLength={800}
          rows={4}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="resize-none pb-6"
        />
        <span className="absolute bottom-2 right-3 text-xs text-slate-400">
          {value.length}/800
        </span>
      </div>
    </ConfigField>
  );
}

function NamedItemListEditor({
  items,
  onChange,
  namePlaceholder = "请输入名称",
  descriptionPlaceholder = "请输入描述",
  addLabel = "添加",
}: {
  items: GraphNamedItem[];
  onChange: (items: GraphNamedItem[]) => void;
  namePlaceholder?: string;
  descriptionPlaceholder?: string;
  addLabel?: string;
}) {
  const updateItem = (id: string, patch: Partial<GraphNamedItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3"
        >
          <div className="flex items-start gap-2">
            <Input
              value={item.name}
              placeholder={namePlaceholder}
              onChange={(e) => updateItem(item.id, { name: e.target.value })}
              className="h-8 flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-slate-400 hover:text-red-500"
              onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            value={item.description}
            placeholder={descriptionPlaceholder}
            rows={2}
            onChange={(e) =>
              updateItem(item.id, { description: e.target.value })
            }
            className="resize-none"
          />
          <SynonymTagInput
            synonyms={item.synonyms ?? []}
            onChange={(synonyms) => updateItem(item.id, { synonyms })}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => onChange([...items, createNamedItem()])}
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </Button>
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

  const patchGraph = (next: Partial<GraphRetrievalConfig>) => {
    patch("graph", { ...value.graph, ...next });
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
          <div className="rounded-lg border border-slate-200 bg-white px-4">
            <CollapseSection title="模型选择" defaultOpen>
              <ConfigField
                label="模型"
                tip="用于实体/关系抽取的大模型"
              >
                <ModelSelector
                  presetOnly
                  selectedModel={value.graph.model}
                  modelParams={value.graph.modelParams}
                  onModelChange={(model) =>
                    patchGraph({
                      model,
                      modelParams: getDefaultModelParams(model),
                    })
                  }
                  onParamsChange={(modelParams) => patchGraph({ modelParams })}
                />
              </ConfigField>
            </CollapseSection>

            <CollapseSection title="实体抽取" defaultOpen>
              <PromptField
                label="用户提示词"
                tip="引导模型抽取实体的用户提示词"
                value={value.graph.entity.prompt}
                placeholder="请输入实体抽取用户提示词"
                onChange={(prompt) =>
                  patchGraph({
                    entity: { ...value.graph.entity, prompt },
                  })
                }
              />

              <ConfigField
                label="实体分类"
                tip="使用系统预置分类或自定义实体类型"
              >
                <div className="flex flex-wrap gap-2">
                  <OptionPill
                    selected={value.graph.entity.categoryMode === "system"}
                    onClick={() =>
                      patchGraph({
                        entity: {
                          ...value.graph.entity,
                          categoryMode: "system",
                        },
                      })
                    }
                  >
                    系统默认
                  </OptionPill>
                  <OptionPill
                    selected={value.graph.entity.categoryMode === "custom"}
                    onClick={() =>
                      patchGraph({
                        entity: {
                          ...value.graph.entity,
                          categoryMode: "custom",
                          customItems:
                            value.graph.entity.customItems.length > 0
                              ? value.graph.entity.customItems
                              : [createNamedItem()],
                        },
                      })
                    }
                  >
                    自定义
                  </OptionPill>
                </div>
              </ConfigField>

              <ConfigField
                label="向量化"
                tip="将实体名称、描述、枚举值等进行向量化，后续可用于语义检索"
              >
                <Switch
                  checked={value.graph.entity.vectorize}
                  onCheckedChange={(vectorize) =>
                    patchGraph({
                      entity: { ...value.graph.entity, vectorize },
                    })
                  }
                />
              </ConfigField>

              {value.graph.entity.categoryMode === "custom" && (
                <ConfigField
                  label="自定义实体"
                  tip="配置实体名称、描述与同义词"
                >
                  <NamedItemListEditor
                    items={value.graph.entity.customItems}
                    namePlaceholder="实体名称"
                    descriptionPlaceholder="实体描述"
                    addLabel="添加实体"
                    onChange={(customItems) =>
                      patchGraph({
                        entity: { ...value.graph.entity, customItems },
                      })
                    }
                  />
                </ConfigField>
              )}

              <ConfigField
                label="相似度合并"
                tip="相似度高于阈值的实体将合并"
                hint="取值范围区间：0 ~ 1.0 (精度 0.01)"
              >
                <SliderWithInput
                  value={value.graph.entity.similarityMerge}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(similarityMerge) =>
                    patchGraph({
                      entity: { ...value.graph.entity, similarityMerge },
                    })
                  }
                />
              </ConfigField>
            </CollapseSection>

            <CollapseSection title="关系抽取">
              <PromptField
                label="用户提示词"
                tip="引导模型抽取关系的用户提示词"
                value={value.graph.relation.prompt}
                placeholder="请输入关系抽取用户提示词"
                onChange={(prompt) =>
                  patchGraph({
                    relation: { ...value.graph.relation, prompt },
                  })
                }
              />

              <ConfigField
                label="关系分类"
                tip="使用系统预置分类或自定义关系类型"
              >
                <div className="flex flex-wrap gap-2">
                  <OptionPill
                    selected={value.graph.relation.categoryMode === "system"}
                    onClick={() =>
                      patchGraph({
                        relation: {
                          ...value.graph.relation,
                          categoryMode: "system",
                        },
                      })
                    }
                  >
                    系统默认
                  </OptionPill>
                  <OptionPill
                    selected={value.graph.relation.categoryMode === "custom"}
                    onClick={() =>
                      patchGraph({
                        relation: {
                          ...value.graph.relation,
                          categoryMode: "custom",
                          customItems:
                            value.graph.relation.customItems.length > 0
                              ? value.graph.relation.customItems
                              : [createNamedItem()],
                        },
                      })
                    }
                  >
                    自定义
                  </OptionPill>
                </div>
              </ConfigField>

              {value.graph.relation.categoryMode === "custom" && (
                <ConfigField
                  label="自定义关系"
                  tip="配置关系名称、描述与同义词"
                >
                  <NamedItemListEditor
                    items={value.graph.relation.customItems}
                    namePlaceholder="关系名称"
                    descriptionPlaceholder="关系描述"
                    addLabel="添加关系"
                    onChange={(customItems) =>
                      patchGraph({
                        relation: { ...value.graph.relation, customItems },
                      })
                    }
                  />
                </ConfigField>
              )}
            </CollapseSection>
          </div>
        </div>
      )}
    </div>
  );
}
