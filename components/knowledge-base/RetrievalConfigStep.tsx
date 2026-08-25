"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { ModelSelector, type ModelParams } from "@/components/agent-editor/ModelSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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

/** 实体抽取合并方式 */
export type GraphEntityMergeMode = "exact" | "distance" | "similarity";

/** 同义词条目：一个 key 对应多个 value */
export interface GraphSynonymPair {
  id: string;
  key: string;
  values: string[];
}

export interface GraphNamedItem {
  id: string;
  name: string;
  description: string;
  /** 实体同义词（key → 多个 value） */
  synonyms: GraphSynonymPair[];
  /** 合并方式：选自已勾选的合并策略 */
  mergeMode?: GraphEntityMergeMode;
  /** 实体：属性列表（名称、描述、同义词、枚举值、合并方式） */
  attributes?: GraphEntityAttribute[];
}

/** 实体属性：名称、描述、同义词、枚举值、合并方式 */
export interface GraphEntityAttribute {
  id: string;
  name: string;
  description: string;
  /** 属性同义词（key → 多个 value） */
  synonyms: GraphSynonymPair[];
  enumValues: string[];
  /** 合并方式：选自已勾选的合并策略 */
  mergeMode?: GraphEntityMergeMode;
}

export interface GraphEntityConfig {
  prompt: string;
  categoryMode: GraphCategoryMode;
  customItems: GraphNamedItem[];
  /** 自定义模式下：是否允许系统在自定义实体之外按需扩充 */
  allowExpand: boolean;
}

/** 自定义关系：名称、描述、前置/后置实体 */
export interface GraphRelationItem {
  id: string;
  name: string;
  description: string;
  /** 前置实体（引用自定义实体 id） */
  sourceEntityId: string;
  /** 后置实体（引用自定义实体 id） */
  targetEntityId: string;
}

export interface GraphRelationConfig {
  prompt: string;
  categoryMode: GraphCategoryMode;
  customItems: GraphRelationItem[];
  /** 自定义模式下：是否允许系统在自定义关系之外按需扩充 */
  allowExpand: boolean;
}

export interface GraphSynonymTermBank {
  id: string;
  name: string;
}

export interface GraphRetrievalConfig {
  model: string;
  modelParams: ModelParams;
  /** 全局同义词来源：术语库（可多选） */
  synonymTermBanks: GraphSynonymTermBank[];
  /** 合并策略（可多选：精确 / 距离 / 相似度；配置于实体抽取自定义模式） */
  mergeStrategies: GraphEntityMergeMode[];
  /** 距离合并 Score */
  mergeDistanceScore: number;
  /** 相似度合并处理模型 */
  mergeSimilarityModel: string;
  /** 相似度合并 Score */
  mergeSimilarityScore: number;
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

/** 与语义检索 Embedding / 混合检索 Reranker 模型规范一致 */
const SIMILARITY_MODEL_OPTIONS = [
  { value: "bge-m3", label: "bge-m3" },
  { value: "bge-reranker-v2", label: "bge-reranker-v2" },
  { value: "bge-reranker-base", label: "bge-reranker-base" },
] as const;

const MERGE_MODE_OPTIONS: {
  value: GraphEntityMergeMode;
  label: string;
}[] = [
  { value: "exact", label: "精确" },
  { value: "distance", label: "距离" },
  { value: "similarity", label: "相似度" },
];

function createSynonymPair(): GraphSynonymPair {
  return {
    id: `syn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    key: "",
    values: [],
  };
}

function createNamedItem(
  withAttributes = false,
  defaultMergeMode: GraphEntityMergeMode = "exact"
): GraphNamedItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    description: "",
    synonyms: [],
    mergeMode: defaultMergeMode,
    ...(withAttributes ? { attributes: [] } : {}),
  };
}

function createRelationItem(): GraphRelationItem {
  return {
    id: `rel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    description: "",
    sourceEntityId: "",
    targetEntityId: "",
  };
}

function createEntityAttribute(
  defaultMergeMode: GraphEntityMergeMode = "exact"
): GraphEntityAttribute {
  return {
    id: `attr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    description: "",
    synonyms: [],
    enumValues: [],
    mergeMode: defaultMergeMode,
  };
}

function resolveMergeMode(
  current: GraphEntityMergeMode | undefined,
  strategies: GraphEntityMergeMode[]
): GraphEntityMergeMode {
  const available = strategies.length > 0 ? strategies : (["exact"] as GraphEntityMergeMode[]);
  if (current && available.includes(current)) return current;
  return available[0] ?? "exact";
}

function buildMergeModeSelectOptions(strategies: GraphEntityMergeMode[]) {
  const available = strategies.length > 0 ? strategies : (["exact"] as GraphEntityMergeMode[]);
  return MERGE_MODE_OPTIONS.filter((option) => available.includes(option.value)).map(
    (option) => ({
      value: option.value,
      label: option.label,
    })
  );
}

/** 标签列表输入：Enter 添加，标签可删除（同义词 value / 枚举值等） */
function TagListInput({
  values,
  onChange,
  label,
  description,
  placeholder = "输入后按 Enter 添加",
}: {
  values: string[];
  onChange: (values: string[]) => void;
  label?: string;
  /** 字段说明文案 */
  description?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const addValue = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    if (values.some((s) => s.toLowerCase() === next.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, next]);
    setDraft("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addValue(draft);
    } else if (e.key === "Backspace" && !draft && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className="space-y-1.5">
      {label || description ? (
        <div className="space-y-0.5">
          {label ? <div className="text-xs text-slate-500">{label}</div> : null}
          {description ? (
            <div className="text-[11px] leading-relaxed text-slate-400">
              {description}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="min-h-[40px] rounded-md border border-slate-200 bg-white px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {values.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="gap-1 bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-700 hover:bg-slate-100"
            >
              {value}
              <button
                type="button"
                aria-label={`删除${label ? ` ${label}` : ""} ${value}`}
                onClick={() => onChange(values.filter((s) => s !== value))}
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
            placeholder={values.length === 0 ? placeholder : "继续添加…"}
            className="h-7 min-w-[120px] flex-1 border-0 px-1 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
    </div>
  );
}

/** 同义词 Key-Value 编辑：支持多组 key，每组多个 value */
function SynonymKeyValueEditor({
  pairs,
  onChange,
  label = "同义词",
}: {
  pairs: GraphSynonymPair[];
  onChange: (pairs: GraphSynonymPair[]) => void;
  label?: string;
}) {
  const updatePair = (id: string, patch: Partial<GraphSynonymPair>) => {
    onChange(pairs.map((pair) => (pair.id === id ? { ...pair, ...patch } : pair)));
  };

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="space-y-2">
        {pairs.map((pair) => (
          <div
            key={pair.id}
            className="space-y-2 rounded-md border border-slate-200 bg-white p-2.5"
          >
            <div className="flex items-center gap-2">
              <div className="shrink-0 text-xs text-slate-400">Key</div>
              <Input
                value={pair.key}
                placeholder="请输入同义词 Key"
                onChange={(e) => updatePair(pair.id, { key: e.target.value })}
                className="h-8 flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-slate-400 hover:text-red-500"
                onClick={() =>
                  onChange(pairs.filter((entry) => entry.id !== pair.id))
                }
                aria-label="删除同义词组"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-2.5 shrink-0 text-xs text-slate-400">Value</div>
              <div className="min-w-0 flex-1">
                <TagListInput
                  values={pair.values}
                  onChange={(values) => updatePair(pair.id, { values })}
                  placeholder="输入 Value 后按 Enter 添加"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1 text-xs"
        onClick={() => onChange([...pairs, createSynonymPair()])}
      >
        <Plus className="h-3 w-3" />
        添加同义词
      </Button>
    </div>
  );
}

export const defaultGraphRetrievalConfig: GraphRetrievalConfig = {
  model: DEFAULT_GRAPH_MODEL,
  modelParams: getDefaultModelParams(DEFAULT_GRAPH_MODEL),
  synonymTermBanks: [],
  mergeStrategies: ["exact"],
  mergeDistanceScore: 0.8,
  mergeSimilarityModel: "bge-m3",
  mergeSimilarityScore: 0.8,
  entity: {
    prompt: "",
    categoryMode: "system",
    customItems: [],
    allowExpand: false,
  },
  relation: {
    prompt: "",
    categoryMode: "system",
    customItems: [],
    allowExpand: false,
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
  const safeValue = Number.isFinite(value) ? value : min;

  return (
    <div className="flex items-center gap-4">
      <Slider
        value={[safeValue]}
        min={min}
        max={max}
        step={step}
        onValueChange={(vals) => onChange(vals[0] ?? min)}
        className="max-w-md flex-1 [&_[data-slot=slider-range]]:bg-[#2773ff] [&_[data-slot=slider-thumb]]:border-[#2773ff]"
      />
      <Input
        type="number"
        value={safeValue}
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
  showAttributes = false,
  showAttributeSynonyms = false,
  showMergeMode = false,
  mergeStrategies = ["exact"],
  preferredMergeMode,
}: {
  items: GraphNamedItem[];
  onChange: (items: GraphNamedItem[]) => void;
  namePlaceholder?: string;
  descriptionPlaceholder?: string;
  addLabel?: string;
  /** 实体：支持为每项配置多个属性 */
  showAttributes?: boolean;
  /** 属性内是否展示同义词（自定义实体开启） */
  showAttributeSynonyms?: boolean;
  /** 是否展示合并方式（自定义实体） */
  showMergeMode?: boolean;
  /** 可选合并策略：来自合并策略配置已勾选项 */
  mergeStrategies?: GraphEntityMergeMode[];
  /** 新建项默认合并方式 */
  preferredMergeMode?: GraphEntityMergeMode;
}) {
  const mergeOptions = buildMergeModeSelectOptions(mergeStrategies);
  const defaultMergeMode = resolveMergeMode(preferredMergeMode, mergeStrategies);

  const updateItem = (id: string, patch: Partial<GraphNamedItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const updateAttribute = (
    itemId: string,
    attrId: string,
    patch: Partial<GraphEntityAttribute>
  ) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;
    const attributes = (item.attributes ?? []).map((attr) =>
      attr.id === attrId ? { ...attr, ...patch } : attr
    );
    updateItem(itemId, { attributes });
  };

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const itemMergeMode = resolveMergeMode(item.mergeMode, mergeStrategies);
        return (
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
          <SynonymKeyValueEditor
            pairs={item.synonyms ?? []}
            onChange={(synonyms) => updateItem(item.id, { synonyms })}
          />
          {showMergeMode ? (
            <div className="space-y-1.5">
              <div className="text-xs text-slate-500">合并方式</div>
              <Select
                value={itemMergeMode}
                onValueChange={(mergeMode) =>
                  updateItem(item.id, {
                    mergeMode: mergeMode as GraphEntityMergeMode,
                  })
                }
                options={mergeOptions}
                placeholder="请选择合并方式"
                className="h-8 max-w-xs"
              />
            </div>
          ) : null}

          {showAttributes && (
            <div className="space-y-2 border-t border-slate-200/80 pt-2">
              <div className="text-xs font-medium text-slate-600">属性</div>
              {(item.attributes ?? []).map((attr) => {
                const attrMergeMode = resolveMergeMode(
                  attr.mergeMode,
                  mergeStrategies
                );
                return (
                <div
                  key={attr.id}
                  className="space-y-2 rounded-md border border-slate-200 bg-white p-2.5"
                >
                  <div className="flex items-start gap-2">
                    <Input
                      value={attr.name}
                      placeholder="属性名称"
                      onChange={(e) =>
                        updateAttribute(item.id, attr.id, {
                          name: e.target.value,
                        })
                      }
                      className="h-8 flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-slate-400 hover:text-red-500"
                      onClick={() =>
                        updateItem(item.id, {
                          attributes: (item.attributes ?? []).filter(
                            (entry) => entry.id !== attr.id
                          ),
                        })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    value={attr.description}
                    placeholder="属性描述"
                    rows={2}
                    onChange={(e) =>
                      updateAttribute(item.id, attr.id, {
                        description: e.target.value,
                      })
                    }
                    className="resize-none"
                  />
                  {showAttributeSynonyms ? (
                    <SynonymKeyValueEditor
                      pairs={attr.synonyms ?? []}
                      onChange={(synonyms) =>
                        updateAttribute(item.id, attr.id, { synonyms })
                      }
                    />
                  ) : null}
                  <TagListInput
                    label="枚举值"
                    description="若添加枚举值，系统只会从填写的枚举值中选择作为属性值"
                    values={attr.enumValues ?? []}
                    onChange={(enumValues) =>
                      updateAttribute(item.id, attr.id, { enumValues })
                    }
                    placeholder="输入枚举值后按 Enter 添加"
                  />
                  {showMergeMode ? (
                    <div className="space-y-1.5">
                      <div className="text-xs text-slate-500">合并方式</div>
                      <Select
                        value={attrMergeMode}
                        onValueChange={(mergeMode) =>
                          updateAttribute(item.id, attr.id, {
                            mergeMode: mergeMode as GraphEntityMergeMode,
                          })
                        }
                        options={mergeOptions}
                        placeholder="请选择合并方式"
                        className="h-8 max-w-xs"
                      />
                    </div>
                  ) : null}
                </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() =>
                  updateItem(item.id, {
                    attributes: [
                      ...(item.attributes ?? []),
                      createEntityAttribute(defaultMergeMode),
                    ],
                  })
                }
              >
                <Plus className="h-3 w-3" />
                添加属性
              </Button>
            </div>
          )}
        </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() =>
          onChange([
            ...items,
            createNamedItem(showAttributes, defaultMergeMode),
          ])
        }
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}

function RelationItemListEditor({
  items,
  onChange,
  entityOptions,
}: {
  items: GraphRelationItem[];
  onChange: (items: GraphRelationItem[]) => void;
  entityOptions: Array<{ value: string; label: string }>;
}) {
  const updateItem = (id: string, patch: Partial<GraphRelationItem>) => {
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
              placeholder="关系名称"
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
            placeholder="关系描述"
            rows={2}
            onChange={(e) =>
              updateItem(item.id, { description: e.target.value })
            }
            className="resize-none"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="text-xs text-slate-500">
                <span className="text-red-500">*</span>前置实体
              </div>
              <Select
                value={
                  entityOptions.some((opt) => opt.value === item.sourceEntityId)
                    ? item.sourceEntityId
                    : undefined
                }
                onValueChange={(sourceEntityId) =>
                  updateItem(item.id, { sourceEntityId })
                }
                placeholder={
                  entityOptions.length === 0
                    ? "请先配置自定义实体"
                    : "请选择前置实体"
                }
                options={entityOptions}
                disabled={entityOptions.length === 0}
                className="h-8"
              />
            </div>
            <div className="space-y-1.5">
              <div className="text-xs text-slate-500">
                <span className="text-red-500">*</span>后置实体
              </div>
              <Select
                value={
                  entityOptions.some((opt) => opt.value === item.targetEntityId)
                    ? item.targetEntityId
                    : undefined
                }
                onValueChange={(targetEntityId) =>
                  updateItem(item.id, { targetEntityId })
                }
                placeholder={
                  entityOptions.length === 0
                    ? "请先配置自定义实体"
                    : "请选择后置实体"
                }
                options={entityOptions}
                disabled={entityOptions.length === 0}
                className="h-8"
              />
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => onChange([...items, createRelationItem()])}
      >
        <Plus className="h-3.5 w-3.5" />
        添加关系
      </Button>
    </div>
  );
}

/** 可选术语库列表（对齐术语库管理页 mock） */
const AVAILABLE_TERM_BANKS: GraphSynonymTermBank[] = [
  { id: "1", name: "耐糖量测试" },
  { id: "2", name: "耐糖量测试2" },
  { id: "3", name: "耐糖量测试耐糖量测试" },
  { id: "4", name: "耐糖量测试6546" },
  { id: "5", name: "耐糖量测试/845" },
  { id: "6", name: "耐糖量测试855" },
  { id: "term-1", name: "北约军事术语集 2025" },
  { id: "term-2", name: "电子战缩略语表" },
];

function TermBankMultiSelectDialog({
  open,
  onOpenChange,
  selected,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: GraphSynonymTermBank[];
  onConfirm: (items: GraphSynonymTermBank[]) => void;
}) {
  const [draftIds, setDraftIds] = useState<string[]>(() =>
    selected.map((item) => item.id)
  );

  const syncDraftOnOpen = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftIds(selected.map((item) => item.id));
    }
    onOpenChange(nextOpen);
  };

  const toggleId = (id: string, checked: boolean) => {
    setDraftIds((current) =>
      checked
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter((itemId) => itemId !== id)
    );
  };

  const handleConfirm = () => {
    const selectedSet = new Set(draftIds);
    onConfirm(AVAILABLE_TERM_BANKS.filter((bank) => selectedSet.has(bank.id)));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={syncDraftOnOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>选择术语库</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-slate-500">
          可多选术语库作为图谱检索的同义词来源
        </p>
        <div className="max-h-[360px] space-y-2 overflow-y-auto py-2">
          {AVAILABLE_TERM_BANKS.map((bank) => {
            const checked = draftIds.includes(bank.id);
            return (
              <label
                key={bank.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                  checked
                    ? "border-[#2773ff] bg-[#2773ff]/5"
                    : "border-slate-200 hover:bg-slate-50"
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) =>
                    toggleId(bank.id, value === true)
                  }
                />
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                  {bank.name}
                </span>
              </label>
            );
          })}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            className="bg-[#2773ff] hover:bg-[#1f63e6]"
            onClick={handleConfirm}
          >
            确定（已选 {draftIds.length}）
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SynonymTermBankField({
  items,
  onChange,
}: {
  items: GraphSynonymTermBank[];
  onChange: (items: GraphSynonymTermBank[]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => (
          <Badge
            key={item.id}
            variant="secondary"
            className="gap-1 bg-slate-100 px-2 py-1 text-xs font-normal text-slate-700 hover:bg-slate-100"
          >
            {item.name}
            <button
              type="button"
              aria-label={`移除术语库 ${item.name}`}
              onClick={() =>
                onChange(items.filter((entry) => entry.id !== item.id))
              }
              className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 border-dashed border-slate-300 text-slate-500 hover:border-[#2773ff] hover:text-[#2773ff]"
          onClick={() => setDialogOpen(true)}
          aria-label="添加同义词术语库"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">
          点击「+」选择术语库作为同义词来源
        </p>
      ) : null}
      <TermBankMultiSelectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selected={items}
        onConfirm={onChange}
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

  const patchGraph = (next: Partial<GraphRetrievalConfig>) => {
    patch("graph", { ...value.graph, ...next });
  };

  const relationEntityOptions = value.graph.entity.customItems
    .filter((item) => item.name.trim())
    .map((item) => ({
      value: item.id,
      label: item.name.trim(),
    }));

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
            <CollapseSection title="全局配置" defaultOpen>
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
              <ConfigField
                label="同义词"
                tip="选择术语库作为图谱检索的同义词来源，支持多选与删除"
              >
                <SynonymTermBankField
                  items={value.graph.synonymTermBanks ?? []}
                  onChange={(synonymTermBanks) =>
                    patchGraph({ synonymTermBanks })
                  }
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
                    onClick={() => {
                      const defaultMerge = resolveMergeMode(
                        undefined,
                        value.graph.mergeStrategies ?? ["exact"]
                      );
                      patchGraph({
                        entity: {
                          ...value.graph.entity,
                          categoryMode: "custom",
                          customItems:
                            value.graph.entity.customItems.length > 0
                              ? value.graph.entity.customItems
                              : [createNamedItem(true, defaultMerge)],
                        },
                      });
                    }}
                  >
                    自定义
                  </OptionPill>
                </div>
              </ConfigField>

              {value.graph.entity.categoryMode === "custom" && (
                <>
                  <ConfigField
                    label="合并策略配置"
                    tip="可多选精确、距离、相似度合并策略；选中后下方展示对应配置项"
                  >
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {MERGE_MODE_OPTIONS.map((option) => {
                          const selected = (
                            value.graph.mergeStrategies ?? ["exact"]
                          ).includes(option.value);
                          return (
                            <OptionPill
                              key={option.value}
                              selected={selected}
                              onClick={() => {
                                const current =
                                  value.graph.mergeStrategies ?? ["exact"];
                                const next = selected
                                  ? current.filter(
                                      (item) => item !== option.value
                                    )
                                  : [...current, option.value];
                                if (next.length === 0) return;
                                patchGraph({
                                  mergeStrategies: next,
                                  mergeDistanceScore:
                                    value.graph.mergeDistanceScore ?? 0.8,
                                  mergeSimilarityModel:
                                    value.graph.mergeSimilarityModel ??
                                    "bge-m3",
                                  mergeSimilarityScore:
                                    value.graph.mergeSimilarityScore ?? 0.8,
                                });
                              }}
                            >
                              {option.label}
                            </OptionPill>
                          );
                        })}
                      </div>

                      {(value.graph.mergeStrategies ?? ["exact"]).includes(
                        "distance"
                      ) ? (
                        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50/60 px-3 py-3">
                          <div className="text-xs font-medium text-slate-600">
                            距离
                          </div>
                          <ConfigField
                            label="Score"
                            tip="距离低于阈值的实体将合并"
                            hint="取值范围区间：0 ~ 1.0（步长 0.1）"
                          >
                            <SliderWithInput
                              value={value.graph.mergeDistanceScore ?? 0.8}
                              min={0}
                              max={1}
                              step={0.1}
                              onChange={(mergeDistanceScore) =>
                                patchGraph({ mergeDistanceScore })
                              }
                            />
                          </ConfigField>
                        </div>
                      ) : null}

                      {(value.graph.mergeStrategies ?? ["exact"]).includes(
                        "similarity"
                      ) ? (
                        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50/60 px-3 py-3">
                          <div className="text-xs font-medium text-slate-600">
                            相似度
                          </div>
                          <ConfigField
                            label="处理模型"
                            tip="选择用于相似度合并的 Embedding 或 Reranker 模型"
                          >
                            <Select
                              value={
                                value.graph.mergeSimilarityModel ?? "bge-m3"
                              }
                              onValueChange={(mergeSimilarityModel) =>
                                patchGraph({ mergeSimilarityModel })
                              }
                              options={SIMILARITY_MODEL_OPTIONS.map(
                                (option) => ({
                                  value: option.value,
                                  label: option.label,
                                })
                              )}
                              className="max-w-xs"
                            />
                          </ConfigField>
                          <ConfigField
                            label="Score"
                            tip="相似度高于阈值的实体将合并"
                            hint="取值范围区间：0 ~ 1.0（步长 0.1）"
                          >
                            <SliderWithInput
                              value={value.graph.mergeSimilarityScore ?? 0.8}
                              min={0}
                              max={1}
                              step={0.1}
                              onChange={(mergeSimilarityScore) =>
                                patchGraph({ mergeSimilarityScore })
                              }
                            />
                          </ConfigField>
                        </div>
                      ) : null}
                    </div>
                  </ConfigField>

                  <ConfigField
                    label="允许扩充"
                    tip="开启后，除按用户自定义实体字段抽取外，系统还可按需自行扩充实体"
                  >
                    <Switch
                      checked={value.graph.entity.allowExpand ?? false}
                      onCheckedChange={(allowExpand) =>
                        patchGraph({
                          entity: { ...value.graph.entity, allowExpand },
                        })
                      }
                    />
                  </ConfigField>
                  <ConfigField
                    label="自定义实体"
                    tip="配置实体类型、描述、同义词、合并方式与属性"
                  >
                    <NamedItemListEditor
                      items={value.graph.entity.customItems}
                      namePlaceholder="实体类型"
                      descriptionPlaceholder="实体描述"
                      addLabel="添加实体"
                      showAttributes
                      showAttributeSynonyms
                      showMergeMode
                      mergeStrategies={value.graph.mergeStrategies ?? ["exact"]}
                      preferredMergeMode={resolveMergeMode(
                        undefined,
                        value.graph.mergeStrategies ?? ["exact"]
                      )}
                      onChange={(customItems) =>
                        patchGraph({
                          entity: { ...value.graph.entity, customItems },
                        })
                      }
                    />
                  </ConfigField>
                </>
              )}
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
                              : [createRelationItem()],
                        },
                      })
                    }
                  >
                    自定义
                  </OptionPill>
                </div>
              </ConfigField>

              {value.graph.relation.categoryMode === "custom" && (
                <>
                  <ConfigField
                    label="允许扩充"
                    tip="开启后，除按用户自定义关系字段抽取外，系统还可按需自行扩充关系"
                  >
                    <Switch
                      checked={value.graph.relation.allowExpand ?? false}
                      onCheckedChange={(allowExpand) =>
                        patchGraph({
                          relation: { ...value.graph.relation, allowExpand },
                        })
                      }
                    />
                  </ConfigField>
                  <ConfigField
                    label="自定义关系"
                    tip="配置关系名称、描述，并选择前置实体与后置实体（来自上方已配置的自定义实体）"
                  >
                    <RelationItemListEditor
                      items={value.graph.relation.customItems}
                      entityOptions={relationEntityOptions}
                      onChange={(customItems) =>
                        patchGraph({
                          relation: { ...value.graph.relation, customItems },
                        })
                      }
                    />
                  </ConfigField>
                </>
              )}
            </CollapseSection>
          </div>
        </div>
      )}
    </div>
  );
}
