"use client";

import { Suspense, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FileText,
  Folder,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const steps = ["定义知识库", "索引配置", "混合检索策略配置"];

const retrievalEngines = [
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
];

interface MetadataFieldDraft {
  id: string;
  name: string;
  description: string;
  matchModes: string[];
}

interface MixedStrategyDraft {
  id: string;
  name: string;
  enabledEngines: string[];
  fusionMode: string;
  topK: string;
  scoreThreshold: string;
  collapsed: boolean;
  weights: Record<string, string>;
}

const documentTagOptions = ["产品手册", "制度规范", "FAQ", "合同资料", "培训材料"];
const contentTagOptions = ["奶茶", "门店经营", "供应商", "定价", "售后"];

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center border-t border-slate-100 px-10 py-5">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const completed = stepNumber < currentStep;
        const active = stepNumber === currentStep;
        return (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                completed && "bg-blue-50 text-blue-600",
                active && "bg-blue-600 text-white",
                !completed && !active && "bg-slate-100 text-slate-500"
              )}
            >
              {completed ? <Check className="h-4 w-4" /> : stepNumber}
            </div>
            <span
              className={cn(
                "ml-3 text-sm",
                active ? "font-medium text-slate-950" : "text-slate-600"
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 && <div className="mx-10 h-px w-40 bg-slate-200" />}
          </div>
        );
      })}
    </div>
  );
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-1 text-sm text-slate-700">
      {required && <span className="text-red-500">*</span>}
      <span>{children}</span>
      <Info className="h-3.5 w-3.5 text-slate-400" />
    </div>
  );
}

function EngineCard({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative min-h-[104px] flex-1 border bg-white p-4 text-left transition-colors",
        checked ? "border-blue-500 bg-blue-50/70" : "border-slate-200 hover:border-blue-300"
      )}
    >
      <div className="absolute right-0 top-0 h-0 w-0 border-l-[18px] border-t-[18px] border-l-transparent border-t-blue-600 opacity-0 data-[checked=true]:opacity-100" data-checked={checked} />
      <div className="flex items-start gap-3">
        <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
        <div>
          <div className="font-semibold text-blue-700">{title}</div>
          <p className="mt-3 text-sm leading-6 text-slate-700">{description}</p>
        </div>
      </div>
    </button>
  );
}

function ConfigBlock({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-12 w-full items-center gap-2 px-4 text-sm font-medium text-slate-900"
      >
        <ChevronDown className={cn("h-4 w-4 transition-transform", !open && "-rotate-90")} />
        {title}
      </button>
      {open && <div className="border-t border-slate-100 px-5 py-4">{children}</div>}
    </div>
  );
}

function OptionButton({
  children,
  selected,
  onClick,
}: {
  children: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 border px-4 text-sm",
        selected
          ? "border-blue-500 bg-blue-50 font-medium text-blue-700"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
      )}
    >
      {children}
    </button>
  );
}

function StepOne({
  name,
  setName,
  description,
  setDescription,
}: {
  name: string;
  setName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-7 py-8">
      <p className="text-base font-semibold text-slate-950">基本信息</p>
      <div className="grid grid-cols-[120px_1fr] items-start gap-x-4 gap-y-6">
        <FieldLabel required>知识库名称</FieldLabel>
        <div>
          <div className="relative">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder="请输入"
              className="h-10 pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              {name.length}/100
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            支持字母、中文、数字、下划线(_)、中划线(-)、点(.)，并且必须以字母或中文开头
          </p>
        </div>

        <FieldLabel>描述</FieldLabel>
        <div>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={200}
            placeholder="请输入知识库内容备注说明，便于查找和管理知识库。描述不影响Agent对知识库的调用效果"
            className="min-h-24 resize-none pr-16"
          />
          <div className="mt-1 text-right text-xs text-slate-400">{description.length}/200</div>
        </div>

        <FieldLabel required>所属群组</FieldLabel>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-between border border-slate-200 bg-white px-3 text-sm text-slate-800"
        >
          <span className="inline-flex items-center gap-2">
            <Folder className="h-4 w-4 fill-amber-300 text-amber-500" />
            全部群组
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        <FieldLabel>图标</FieldLabel>
        <div className="flex h-12 w-12 items-center justify-center rounded bg-blue-500 text-white">
          <FileText className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function StepTwo({
  selectedEngines,
  setSelectedEngines,
}: {
  selectedEngines: string[];
  setSelectedEngines: (value: string[]) => void;
}) {
  const [contentTagEnabled, setContentTagEnabled] = useState(true);
  const [metadataEnabled, setMetadataEnabled] = useState(true);
  const [documentTagEnabled, setDocumentTagEnabled] = useState(true);
  const [contentTags, setContentTags] = useState<string[]>(["奶茶"]);
  const [documentTags, setDocumentTags] = useState<string[]>(["产品手册"]);
  const [metadataFields, setMetadataFields] = useState<MetadataFieldDraft[]>([
    {
      id: "metadata-source",
      name: "来源",
      description: "文档来源系统或资料出处",
      matchModes: ["精准匹配"],
    },
  ]);

  const toggleEngine = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEngines(Array.from(new Set([...selectedEngines, id])));
      return;
    }
    if (selectedEngines.length > 1) {
      setSelectedEngines(selectedEngines.filter((item) => item !== id));
    }
  };

  const toggleTag = (value: string, selected: string[], setSelected: (next: string[]) => void) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((item) => item !== value));
      return;
    }
    setSelected([...selected, value]);
  };

  const addMetadataField = () => {
    setMetadataFields((current) => [
      ...current,
      {
        id: `metadata-${Date.now()}`,
        name: "",
        description: "",
        matchModes: ["精准匹配"],
      },
    ]);
  };

  const updateMetadataField = (id: string, patch: Partial<MetadataFieldDraft>) => {
    setMetadataFields((current) =>
      current.map((field) => (field.id === id ? { ...field, ...patch } : field))
    );
  };

  const removeMetadataField = (id: string) => {
    setMetadataFields((current) => current.filter((field) => field.id !== id));
  };

  const toggleMetadataMatchMode = (id: string, mode: string) => {
    setMetadataFields((current) =>
      current.map((field) => {
        if (field.id !== id) return field;
        const nextModes = field.matchModes.includes(mode)
          ? field.matchModes.filter((item) => item !== mode)
          : [...field.matchModes, mode];
        return { ...field, matchModes: nextModes };
      })
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 py-8">
      <p className="text-base font-semibold text-slate-950">索引配置</p>
      <div className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-6">
        <FieldLabel required>核心检索引擎</FieldLabel>
        <div className="flex gap-4">
          {retrievalEngines.map((engine) => (
            <EngineCard
              key={engine.id}
              title={engine.title}
              description={engine.description}
              checked={selectedEngines.includes(engine.id)}
              onCheckedChange={(checked) => toggleEngine(engine.id, checked)}
            />
          ))}
        </div>

        {selectedEngines.includes("fulltext") && (
          <>
            <div className="pt-4 text-sm text-slate-700">全文检索</div>
            <div className="space-y-3">
              <ConfigBlock title="索引配置">
                <div className="grid grid-cols-[150px_1fr] gap-y-5">
                  <FieldLabel required>索引类型</FieldLabel>
                  <div>
                    <OptionButton selected>SPARSE_INVERTED_INDEX</OptionButton>
                    <p className="mt-2 text-xs text-slate-500">标准倒排索引，完整记录词汇与文档的映射关系，保证最高召回率</p>
                  </div>
                  <FieldLabel required>倒排检索算法</FieldLabel>
                  <div className="flex items-center gap-0">
                    <OptionButton>DAAT_MAXSCORE</OptionButton>
                    <OptionButton selected>DAAT_WAND</OptionButton>
                    <OptionButton>TAAT_NAIVE</OptionButton>
                  </div>
                  <FieldLabel required>词频饱和度</FieldLabel>
                  <div className="flex items-center gap-4">
                    <input type="range" min="1.2" max="2" step="0.1" defaultValue="1.2" className="w-80" />
                    <Input value="1.2" readOnly className="h-9 w-16 text-center" />
                    <span className="text-xs text-slate-500">阈值范围区间：1.2~2.0（精度0.1）</span>
                  </div>
                  <FieldLabel required>文档长度归一化</FieldLabel>
                  <div className="flex items-center gap-4">
                    <input type="range" min="0" max="1" step="0.01" defaultValue="0.75" className="w-80" />
                    <Input value="0.75" readOnly className="h-9 w-16 text-center" />
                    <span className="text-xs text-slate-500">阈值范围区间：0~1.0（精度0.01）</span>
                  </div>
                  <FieldLabel required>距离度量</FieldLabel>
                  <div>
                    <OptionButton selected>BM25</OptionButton>
                    <p className="mt-2 text-xs text-slate-500">基于词频、逆文档频率和文档长度归一化的全文检索相关性评分模型</p>
                  </div>
                </div>
              </ConfigBlock>
              <ConfigBlock title="分析器配置" defaultOpen={false}>
                <RadioGroup defaultValue="Standard" className="flex gap-5">
                  {["Standard", "English", "Chinese", "自定义"].map((item) => (
                    <label key={item} className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value={item} />
                      {item}
                    </label>
                  ))}
                </RadioGroup>
                <div className="mt-4 border border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-500">
                  点击或拖拽文件到此处上传，支持上传 .txt 格式的文件
                </div>
              </ConfigBlock>
            </div>
          </>
        )}

        {selectedEngines.includes("semantic") && (
          <>
            <div className="pt-4 text-sm text-slate-700">语义检索</div>
            <div className="space-y-3">
              <ConfigBlock title="向量构建参数">
                <div className="grid grid-cols-[140px_1fr] gap-y-5">
                  <FieldLabel required>向量模型</FieldLabel>
                  <div>
                    <div className="text-sm text-slate-400">暂无可用模型</div>
                  </div>
                  <FieldLabel required>向量精度</FieldLabel>
                  <div className="flex items-center gap-0">
                    <OptionButton selected>FLOAT_VECTOR</OptionButton>
                    <OptionButton>FLOAT16_VECTOR</OptionButton>
                    <OptionButton>BFLOAT16_VECTOR</OptionButton>
                    <OptionButton>INT8_VECTOR</OptionButton>
                  </div>
                  <FieldLabel>向量归一化</FieldLabel>
                  <Switch defaultChecked />
                </div>
              </ConfigBlock>
              <ConfigBlock title="索引构建参数" defaultOpen={false}>
                <p className="text-sm text-slate-500">可配置向量维度、最大 Token 数量、索引算法等参数。</p>
              </ConfigBlock>
            </div>
          </>
        )}

        {selectedEngines.includes("pageindex") && (
          <>
            <div className="pt-4 text-sm text-slate-700">PageIndex 检索</div>
            <ConfigBlock title="层级索引参数">
              <div className="grid grid-cols-[140px_1fr] gap-y-5">
                <FieldLabel required>最小字符数</FieldLabel>
                <Input value="100" readOnly className="h-9 w-40" />
                <FieldLabel required>最大字符数</FieldLabel>
                <Input value="4000" readOnly className="h-9 w-40" />
                <FieldLabel>数据瘦身</FieldLabel>
                <Switch defaultChecked />
              </div>
            </ConfigBlock>
          </>
        )}

        <div className="pt-2 text-sm text-slate-700">内容标签增强</div>
        <div className="space-y-3 border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <Switch checked={contentTagEnabled} onCheckedChange={setContentTagEnabled} />
            <span className="text-sm text-slate-900">启用内容标签增强</span>
          </div>
          <div className={cn("flex flex-wrap gap-2", !contentTagEnabled && "opacity-50")}>
            {contentTagOptions.map((tag) => (
              <OptionButton
                key={tag}
                selected={contentTagEnabled && contentTags.includes(tag)}
                onClick={() => contentTagEnabled && toggleTag(tag, contentTags, setContentTags)}
              >
                {tag}
              </OptionButton>
            ))}
          </div>
          <p className="text-xs text-slate-500">用于文档内容层面的标签召回和过滤，创建后导入文档时可继续补充。</p>
        </div>

        <div className="pt-2 text-sm text-slate-700">过滤器配置</div>
        <div className="space-y-5">
          <div className="border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <Switch checked={metadataEnabled} onCheckedChange={setMetadataEnabled} />
                <span className="text-sm font-medium text-slate-950">元数据增强</span>
              </div>
              <Button type="button" variant="outline" size="sm" className="rounded" onClick={addMetadataField} disabled={!metadataEnabled}>
                <Plus className="mr-2 h-4 w-4" />
                添加字段
              </Button>
            </div>
            <div className={cn(!metadataEnabled && "opacity-50")}>
              <div className="grid grid-cols-[180px_1fr_260px_52px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <span>字段名称</span>
                <span>字段描述</span>
                <span>匹配模式</span>
                <span />
              </div>
              <div className="divide-y divide-slate-100">
                {metadataFields.map((field) => (
                  <div key={field.id} className="grid grid-cols-[180px_1fr_260px_52px] items-center gap-3 px-4 py-3">
                    <Input
                      value={field.name}
                      onChange={(event) => updateMetadataField(field.id, { name: event.target.value })}
                      placeholder="请输入字段名"
                      maxLength={20}
                      disabled={!metadataEnabled}
                      className="h-9 rounded"
                    />
                    <Input
                      value={field.description}
                      onChange={(event) => updateMetadataField(field.id, { description: event.target.value })}
                      placeholder="请输入字段描述"
                      maxLength={100}
                      disabled={!metadataEnabled}
                      className="h-9 rounded"
                    />
                    <div className="flex items-center gap-4 text-sm">
                      {["精准匹配", "语义匹配"].map((mode) => (
                        <label key={mode} className="flex items-center gap-2">
                          <Checkbox
                            checked={field.matchModes.includes(mode)}
                            disabled={!metadataEnabled}
                            onCheckedChange={() => metadataEnabled && toggleMetadataMatchMode(field.id, mode)}
                          />
                          {mode}
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={!metadataEnabled}
                      className="text-slate-400 hover:text-red-600 disabled:hover:text-slate-400"
                      onClick={() => removeMetadataField(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <Switch checked={documentTagEnabled} onCheckedChange={setDocumentTagEnabled} />
              <span className="text-sm font-medium text-slate-950">文档标签增强</span>
            </div>
            <div className={cn("flex flex-wrap gap-2", !documentTagEnabled && "opacity-50")}>
              {documentTagOptions.map((tag) => (
                <OptionButton
                  key={tag}
                  selected={documentTagEnabled && documentTags.includes(tag)}
                  onClick={() => documentTagEnabled && toggleTag(tag, documentTags, setDocumentTags)}
                >
                  {tag}
                </OptionButton>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepThree({ selectedEngines }: { selectedEngines: string[] }) {
  const enginesInStrategy = retrievalEngines.filter((engine) => selectedEngines.includes(engine.id));
  const [strategies, setStrategies] = useState<MixedStrategyDraft[]>([
    {
      id: "strategy-1",
      name: "检索策略_1",
      enabledEngines: selectedEngines,
      fusionMode: "加权融合",
      topK: "20",
      scoreThreshold: "0.50",
      collapsed: false,
      weights: Object.fromEntries(selectedEngines.map((engineId) => [engineId, engineId === "semantic" ? "0.6" : "0.4"])),
    },
  ]);

  const selectedEngineSet = new Set(selectedEngines);

  const updateStrategy = (id: string, patch: Partial<MixedStrategyDraft>) => {
    setStrategies((current) =>
      current.map((strategy) => (strategy.id === id ? { ...strategy, ...patch } : strategy))
    );
  };

  const addStrategy = () => {
    const nextIndex = strategies.length + 1;
    setStrategies((current) => [
      ...current,
      {
        id: `strategy-${Date.now()}`,
        name: `检索策略_${nextIndex}`,
        enabledEngines: selectedEngines,
        fusionMode: "加权融合",
        topK: "20",
        scoreThreshold: "0.50",
        collapsed: false,
        weights: Object.fromEntries(selectedEngines.map((engineId) => [engineId, engineId === "semantic" ? "0.6" : "0.4"])),
      },
    ]);
  };

  const removeStrategy = (id: string) => {
    if (strategies.length === 1) return;
    setStrategies((current) => current.filter((strategy) => strategy.id !== id));
  };

  const toggleStrategyEngine = (strategy: MixedStrategyDraft, engineId: string) => {
    const engineEnabled = strategy.enabledEngines.includes(engineId);
    if (engineEnabled && strategy.enabledEngines.length === 1) return;
    const nextEngines = engineEnabled
      ? strategy.enabledEngines.filter((item) => item !== engineId)
      : [...strategy.enabledEngines, engineId];
    updateStrategy(strategy.id, { enabledEngines: nextEngines });
  };

  const updateWeight = (strategy: MixedStrategyDraft, engineId: string, value: string) => {
    updateStrategy(strategy.id, {
      weights: {
        ...strategy.weights,
        [engineId]: value,
      },
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-slate-950">混合检索策略配置</p>
          <p className="mt-1 text-xs text-slate-500">按已启用的检索器配置召回融合策略，创建后可在详情页继续调整。</p>
        </div>
        <Button type="button" variant="outline" className="rounded" onClick={addStrategy}>
          <Plus className="mr-2 h-4 w-4" />
          新增策略
        </Button>
      </div>

      <div className="space-y-4">
        {strategies.map((strategy, index) => {
          const availableEngines = enginesInStrategy.filter((engine) => selectedEngineSet.has(engine.id));
          const activeEngines = availableEngines.filter((engine) => strategy.enabledEngines.includes(engine.id));
          const configured = strategy.name.trim().length > 0 && activeEngines.length > 0;

          return (
            <div key={strategy.id} className="border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateStrategy(strategy.id, { collapsed: !strategy.collapsed })}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    <ChevronDown className={cn("h-4 w-4 transition-transform", strategy.collapsed && "-rotate-90")} />
                  </button>
                  <div>
                    <div className="font-medium text-slate-950">检索策略（{index + 1}）</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {activeEngines.map((engine) => engine.title).join("、") || "至少选择一个检索器"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("rounded px-2 py-1 text-xs", configured ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500")}>
                    {configured ? "已配置" : "待配置"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded text-slate-400 hover:text-red-600"
                    disabled={strategies.length === 1}
                    onClick={() => removeStrategy(strategy.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!strategy.collapsed && (
                <div className="space-y-6 px-5 py-5">
                  <div className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-5">
                    <FieldLabel required>策略名称</FieldLabel>
                    <Input
                      value={strategy.name}
                      onChange={(event) => updateStrategy(strategy.id, { name: event.target.value })}
                      placeholder="请输入策略名称"
                      maxLength={50}
                      className="h-9 max-w-md rounded"
                    />

                    <FieldLabel required>生效检索器</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {availableEngines.map((engine) => (
                        <OptionButton
                          key={engine.id}
                          selected={strategy.enabledEngines.includes(engine.id)}
                          onClick={() => toggleStrategyEngine(strategy, engine.id)}
                        >
                          {engine.title}
                        </OptionButton>
                      ))}
                    </div>

                    <FieldLabel required>融合方式</FieldLabel>
                    <div className="flex items-center gap-0">
                      {["加权融合", "RRF", "Rerank"].map((mode) => (
                        <OptionButton
                          key={mode}
                          selected={strategy.fusionMode === mode}
                          onClick={() => updateStrategy(strategy.id, { fusionMode: mode })}
                        >
                          {mode}
                        </OptionButton>
                      ))}
                    </div>

                    <FieldLabel required>Top K</FieldLabel>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={strategy.topK}
                      onChange={(event) => updateStrategy(strategy.id, { topK: event.target.value })}
                      className="h-9 w-40 rounded"
                    />

                    <FieldLabel>Score 阈值</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={strategy.scoreThreshold}
                      onChange={(event) => updateStrategy(strategy.id, { scoreThreshold: event.target.value })}
                      className="h-9 w-40 rounded"
                    />
                  </div>

                  <div className="border border-slate-200">
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
                      权重配置
                    </div>
                    <div className="divide-y divide-slate-100">
                      {activeEngines.map((engine) => (
                        <div key={engine.id} className="grid grid-cols-[180px_1fr_90px] items-center gap-4 px-4 py-3">
                          <span className="text-sm text-slate-800">{engine.title}</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={strategy.weights[engine.id] ?? "0.5"}
                            onChange={(event) => updateWeight(strategy, engine.id, event.target.value)}
                            disabled={strategy.fusionMode !== "加权融合"}
                          />
                          <Input
                            type="number"
                            min={0}
                            max={1}
                            step={0.1}
                            value={strategy.weights[engine.id] ?? "0.5"}
                            onChange={(event) => updateWeight(strategy, engine.id, event.target.value)}
                            disabled={strategy.fusionMode !== "加权融合"}
                            className="h-8 rounded text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreateKnowledgeBaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createType = searchParams.get("type") ?? "Custom";
  const isTemplate = createType === "Template";
  const [currentStep, setCurrentStep] = useState(isTemplate ? 1 : 1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEngines, setSelectedEngines] = useState(["fulltext", "semantic"]);

  const nextDisabled = useMemo(() => currentStep === 1 && name.trim().length === 0, [currentStep, name]);

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col bg-white">
      <div className="flex h-20 items-center gap-4 border-b border-slate-200 px-6">
        <Button variant="outline" size="icon" className="h-8 w-8 rounded" onClick={() => router.push("/knowledge-base")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-slate-950">创建知识库</h1>
          <p className="mt-1 text-xs text-slate-500">
            {isTemplate ? "使用系统预制的知识库配置快速创建。" : "自定义选择索引模式及参数，创建后再导入文档。"}
          </p>
        </div>
      </div>
      <Stepper currentStep={currentStep} />
      <div className="min-h-0 flex-1 overflow-auto bg-white px-6">
        {currentStep === 1 && <StepOne name={name} setName={setName} description={description} setDescription={setDescription} />}
        {currentStep === 2 && <StepTwo selectedEngines={selectedEngines} setSelectedEngines={setSelectedEngines} />}
        {currentStep === 3 && <StepThree selectedEngines={selectedEngines} />}
      </div>
      <div className="flex h-16 items-center gap-3 border-t border-slate-200 bg-white px-6">
        <Button
          disabled={nextDisabled}
          onClick={() => {
            if (currentStep < 3) setCurrentStep(currentStep + 1);
            else router.push("/knowledge-base/docstore_JzrYZMN9");
          }}
          className="rounded bg-blue-600 px-8 hover:bg-blue-700"
        >
          {currentStep === 3 ? "确定" : "下一步"}
        </Button>
        {currentStep > 1 && (
          <Button variant="outline" className="rounded px-6" onClick={() => setCurrentStep(currentStep - 1)}>
            上一步
          </Button>
        )}
        <Button variant="outline" className="rounded px-6" onClick={() => router.push("/knowledge-base")}>
          取消
        </Button>
      </div>
    </div>
  );
}

export default function CreateKnowledgeBasePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-white text-sm text-slate-400">
          加载创建配置...
        </div>
      }
    >
      <CreateKnowledgeBaseContent />
    </Suspense>
  );
}
