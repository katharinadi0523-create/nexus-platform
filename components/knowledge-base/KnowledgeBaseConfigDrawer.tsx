"use client";

import { RetrievalStrategyPreview } from "@/components/knowledge-base/RetrievalStrategyPreview";
import type { ReactNode } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { KnowledgeBaseRetrievalSnapshot } from "@/lib/mock/knowledge-base-list";
import type { StrategyBusinessNode } from "@/components/knowledge-base/HybridStrategyStep";

const labels: Record<string, string> = {
  model: "模型", modelParams: "模型参数", synonymTermBanks: "同义词术语库",
  mergeStrategies: "合并策略", mergeDistanceScore: "距离合并 Score", mergeSimilarityModel: "相似度合并模型", mergeSimilarityScore: "相似度合并 Score",
  prompt: "用户提示词", categoryMode: "类别来源", customItems: "自定义类别", allowExpand: "允许系统扩充",
  name: "名称", description: "描述", synonyms: "同义词", key: "词条", values: "同义词", attributes: "属性", enumValues: "枚举值", mergeMode: "合并方式", sourceEntityId: "前置实体", targetEntityId: "后置实体",
  temperature: "温度", top_p: "Top P", top_k: "Top K", max_tokens: "最大输出长度", frequency_penalty: "频率惩罚", deep_thinking: "深度思考", context_turns: "上下文轮数", current_time: "当前时间", sp_anti_leak: "提示词防泄露",
  filterMode: "过滤模式", exactMatch: "精确匹配", semanticMatch: "语义匹配", inputDocCount: "输入文档数量", engine: "检索引擎", topK: "Top K", maxHops: "最大跳数", searchStrategy: "检索策略", entityFilter: "实体过滤", relationFilter: "关系过滤", entitySort: "实体排序", score: "Score 阈值", mergeStrategy: "合并策略", rrfK: "平滑常数 K", rsfScoreWeight: "得分权重", mergeWeights: "Merge 比例", label: "检索器", weight: "权重", rankMode: "排序模式", rankModel: "模型", rankReasoningModel: "模型", rankUserPrompt: "用户提示词", rankTopK: "输出数量 TopK",
};
const values: Record<string, string> = { system: "系统预置", custom: "自定义", exact: "精确", distance: "距离", similarity: "相似度", metadata: "元数据", fulltext: "全文检索", semantic: "语义检索", graph: "图谱检索", pageindex: "PageIndex 检索", reranker: "Reranker", reasoning: "推理", weighted: "加权" };

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid grid-cols-[minmax(100px,160px)_minmax(0,1fr)] items-start gap-4 py-2 text-sm"><div className="pt-1.5 text-slate-600">{label}</div><div className="min-w-0 whitespace-pre-wrap break-words rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700">{children}</div></div>;
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <details className="group/section border-b border-slate-200 last:border-b-0"><summary className="flex cursor-pointer list-none items-center gap-2 py-4 text-sm font-medium text-slate-900 [&::-webkit-details-marker]:hidden"><ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open/section:rotate-90" />{title}</summary><div className="pb-4">{children}</div></details>;
}
function Card({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-lg border border-slate-200 px-4 pt-4"><h3 className="font-semibold text-slate-900">{title}</h3>{children}</section>;
}
function Fields({ data, names = {} }: { data: Record<string, unknown>; names?: Record<string, string> }) {
  return <>{Object.entries(data).filter(([key, value]) => key !== "id" && value !== undefined).map(([key, value]) => {
    if (Array.isArray(value) && value.some(item => item && typeof item === "object")) {
      return <Section key={key} title={labels[key] ?? key}>{value.map((item, index) => <div key={index} className="mb-3 rounded border border-slate-200 p-3"><Fields data={item as Record<string, unknown>} names={names} /></div>)}</Section>;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) return <Section key={key} title={labels[key] ?? key}><Fields data={value as Record<string, unknown>} names={names} /></Section>;
    const display = (item: unknown) => typeof item === "boolean" ? (item ? "开" : "关") : names[String(item)] ?? values[String(item)] ?? String(item ?? "");
    return <Row key={key} label={labels[key] ?? key}>{Array.isArray(value) ? value.map(display).join("、") || "未配置" : display(value) || "未配置"}</Row>;
  })}</>;
}
function NodeConfig({ node, names }: { node: StrategyBusinessNode; names: Record<string, string> }) {
  if (node.kind === "ranker") {
    const mode = node.config.rankMode ?? "reranker";
    return <><Row label="排序模式">{values[mode]}</Row>{mode === "weighted" ? <p className="py-2 text-sm leading-6 text-slate-500">加权模式将综合考虑多个重排序策略的结果，通过权重计算得出最终排序</p> : <><Row label="模型">{mode === "reasoning" ? node.config.rankReasoningModel ?? "Qwen3-32B" : node.config.rankModel ?? "bge-reranker-v2"}</Row>{mode === "reasoning" && <Row label="用户提示词">{node.config.rankUserPrompt || "未配置"}</Row>}</>}</>;
  }
  return <Fields data={node.config} names={names} />;
}

export function KnowledgeBaseConfigDrawer({ open, onOpenChange, snapshot, knowledgeBaseId }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshot?: KnowledgeBaseRetrievalSnapshot;
  knowledgeBaseId?: string;
}) {
  const config = snapshot?.retrieval;
  const names = Object.fromEntries([...(config?.graph.entity.customItems ?? []), ...(config?.graph.relation.customItems ?? [])].map(item => [item.id, item.name]));
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:w-[850px] sm:max-w-[95vw]">
      <SheetHeader className="shrink-0 px-6 py-5 text-left">
        <SheetTitle className="text-base">知识库检索配置</SheetTitle>
        <SheetDescription className="sr-only">查看知识库创建时保存的检索配置，只读展示</SheetDescription>
      </SheetHeader>
      <Tabs defaultValue="retrieval" className="min-h-0 flex-1 gap-0">
        <div className="shrink-0 border-b border-slate-200 px-6"><TabsList className="h-11 gap-6 rounded-none bg-transparent p-0">
          <TabsTrigger value="retrieval" className="h-full rounded-none border-0 border-b-2 border-transparent px-4 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none">检索配置</TabsTrigger>
          {knowledgeBaseId && <Link href={`/knowledge-base/${knowledgeBaseId}/edit?tab=retrieval`} aria-label="编辑检索配置" title="编辑检索配置" className="-ml-5 rounded p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-4 w-4" /></Link>}
          <TabsTrigger value="mixed" className="h-full rounded-none border-0 border-b-2 border-transparent px-0 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none">混合检索策略配置</TabsTrigger>
          {knowledgeBaseId && <Link href={`/knowledge-base/${knowledgeBaseId}/edit?tab=mixed`} aria-label="编辑混合检索策略配置" title="编辑混合检索策略配置" className="-ml-5 rounded p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-4 w-4" /></Link>}
        </TabsList></div>
        <TabsContent value="retrieval" className="min-h-0 overflow-y-auto p-6">
          {!config ? <p className="py-12 text-center text-sm text-slate-400">该知识库未保存创建时的检索配置</p> : <div className="space-y-6">
            <h2 className="text-sm font-semibold text-slate-900">检索器配置</h2>
            {config.engines.includes("fulltext") && <Card title="全文检索">
              <Section title="索引配置"><Row label="索引类型">SPARSE_INVERTED_INDEX</Row><Row label="倒排检索算法">{config.fulltext.algorithm}</Row><Row label="词频饱和度">{config.fulltext.k1}</Row><Row label="文档长度归一化">{config.fulltext.b}</Row><Row label="距离度量">BM25</Row></Section>
              <Section title="分析器配置"><Row label="分词器">STANDARD</Row><Row label="是否小写化">开</Row></Section>
            </Card>}
            {config.engines.includes("semantic") && <Card title="语义检索"><Section title="向量索引配置"><Row label="索引类型">DENSE_VECTOR_INDEX</Row><Row label="距离度量">{config.semantic.metric}</Row><Row label="召回数量 TopK">{config.semantic.topK}</Row></Section><Section title="模型配置"><Row label="Embedding 模型">bge-m3</Row></Section></Card>}
            {config.engines.includes("pageindex") && <Card title="PageIndex 检索"><Section title="索引配置"><Row label="最大深度">{config.pageindex.maxDepth}</Row></Section></Card>}
            {config.engines.includes("graph") && <Card title="图谱检索">
              <Section title="全局配置"><Fields data={{ model: config.graph.model, modelParams: config.graph.modelParams, synonymTermBanks: config.graph.synonymTermBanks }} /></Section>
              <Section title="实体抽取"><Fields data={{ ...config.graph.entity, mergeStrategies: config.graph.mergeStrategies, ...(config.graph.mergeStrategies.includes("distance") ? { mergeDistanceScore: config.graph.mergeDistanceScore } : {}), ...(config.graph.mergeStrategies.includes("similarity") ? { mergeSimilarityModel: config.graph.mergeSimilarityModel, mergeSimilarityScore: config.graph.mergeSimilarityScore } : {}) }} names={names} /></Section>
              <Section title="关系抽取"><Fields data={{ ...config.graph.relation }} names={names} /></Section>
            </Card>}
            <Row label="内容标签">{snapshot?.contentTags?.join("、") || "未配置"}</Row>
            <h2 className="text-sm font-semibold text-slate-900">过滤器配置</h2>
            <Row label="元数据">{snapshot?.metadataEnabled === undefined ? "未配置" : snapshot.metadataEnabled ? "开" : "关"}</Row>
            <Row label="文档标签">{snapshot?.documentTags?.join("、") || "未配置"}</Row>
          </div>}
        </TabsContent>
        <TabsContent value="mixed" className="min-h-0 overflow-y-auto p-6">
          {!snapshot ? <p className="py-12 text-center text-sm text-slate-400">该知识库未保存创建时的混合检索策略配置</p> : <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">检索策略（{snapshot.strategies.length}）</h2>
            {snapshot.strategies.length === 0 && <p className="text-sm text-slate-400">未配置混合检索策略</p>}
            {snapshot.strategies.map(strategy => <RetrievalStrategyPreview key={strategy.id} strategy={strategy} renderConfig={node => <NodeConfig node={node} names={names} />} />)}
          </div>}
        </TabsContent>
      </Tabs>
    </SheetContent>
  </Sheet>;
}
