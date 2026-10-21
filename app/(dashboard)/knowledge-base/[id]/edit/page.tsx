"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RetrievalConfigStep, defaultRetrievalConfig, type RetrievalConfigState, type RetrievalEngineId } from "@/components/knowledge-base/RetrievalConfigStep";
import { HybridStrategyStep, type RetrievalStrategy } from "@/components/knowledge-base/HybridStrategyStep";
import { getKnowledgeBaseMeta, updateKnowledgeBaseRetrieval, type KnowledgeBaseListItem, type KnowledgeBaseRetrievalSnapshot } from "@/lib/mock/knowledge-base-list";

import { KNOWLEDGE_BASE_CHUNK_OPTIONS as chunkOptions } from "@/lib/knowledge-base-chunk-options";
const engineNames = { fulltext: "全文检索", semantic: "语义检索", pageindex: "PageIndex 检索", graph: "图谱检索" };
function initialStrategies(): RetrievalStrategy[] {
  return [{ id: `strategy-${Date.now()}`, name: "检索策略_1", collapsed: false, stages: [], selectedNodeId: null }];
}
function changedEngines(before: RetrievalConfigState, after: RetrievalConfigState): RetrievalEngineId[] {
  return after.engines.filter(engine => !before.engines.includes(engine) || JSON.stringify(before[engine]) !== JSON.stringify(after[engine]));
}
function hasRetrieverChanges(before: RetrievalConfigState, after: RetrievalConfigState) {
  return before.engines.some(engine => !after.engines.includes(engine)) || changedEngines(before, after).length > 0;
}
function getStrategyError(strategies: RetrievalStrategy[], engines: RetrievalEngineId[]): string | null {
  if (strategies.length === 0) return "请至少配置一个可用的检索策略";
  for (const strategy of strategies) {
    const nodes = strategy.stages.flatMap(stage => stage.nodes);
    if (!nodes.length || strategy.stages.some(stage => !stage.nodes.length)) return "请完成“" + strategy.name + "”的节点编排后再保存";
    const retrievers = nodes.filter(node => node.kind === "retriever");
    if (!retrievers.length) return "“" + strategy.name + "”需至少添加一个内容检索器";
    if (retrievers.some(node => !engines.includes((node.config.engine ?? "fulltext") as RetrievalEngineId))) return "“" + strategy.name + "”包含未启用的检索引擎，请调整内容检索器配置";
  }
  return null;
}
function Editor({ meta, initialTab }: { meta: KnowledgeBaseListItem; initialTab: string }) {
  const router = useRouter();
  const baseline = meta.retrievalSnapshot?.retrieval ?? defaultRetrievalConfig;
  const [tab, setTab] = useState(initialTab === "mixed" ? "mixed" : "retrieval");
  const [draft, setDraft] = useState<KnowledgeBaseRetrievalSnapshot>(() => meta.retrievalSnapshot ?? { retrieval: structuredClone(defaultRetrievalConfig), strategies: initialStrategies() });
  const [reset, setReset] = useState(false);
  const [saving, setSaving] = useState(false);
  const affected = changedEngines(baseline, draft.retrieval);
  const patchRetrieval = (next: RetrievalConfigState) => {
    const changed = hasRetrieverChanges(draft.retrieval, next);
    setDraft(current => ({ ...current, retrieval: next, strategies: changed ? initialStrategies() : current.strategies }));
    if (changed) setReset(true);
  };
  const chunkValue = (engine: RetrievalEngineId) => draft.chunking?.[engine] ?? { strategies: [engine === "pageindex" ? "按层级切分" : engine === "graph" ? "按句子切分" : "智能切片"], fixedLength: 800 };
  const patchChunk = (engine: RetrievalEngineId, value: { strategies: string[]; fixedLength?: number }) => setDraft(current => ({ ...current, chunking: { ...current.chunking, [engine]: value } }));
  function validateRetrieval() {
    if (!draft.retrieval.engines.length) { toast.error("请至少选择一种核心检索引擎"); setTab("retrieval"); return false; }
    if (draft.retrieval.engines.includes("graph")) {
      for (const kind of ["entity", "relation"] as const) {
        const config = draft.retrieval.graph[kind];
        if (config.categoryMode === "custom" && !config.customItems.some(item => item.name.trim())) { toast.error(kind === "entity" ? "请至少添加一个自定义实体" : "请至少添加一个自定义关系"); setTab("retrieval"); return false; }
      }
    }
    return true;
  }
  function nextStep() {
    if (validateRetrieval()) setTab("mixed");
  }
  function save() {
    if (saving || !validateRetrieval()) return;
    const error = getStrategyError(draft.strategies, draft.retrieval.engines);
    if (error) { toast.error(error); setTab("mixed"); return; }
    setSaving(true);
    try {
      const chunking = Object.fromEntries(draft.retrieval.engines.filter(engine => affected.includes(engine) || draft.chunking?.[engine]).map(engine => [engine, chunkValue(engine)]));
      updateKnowledgeBaseRetrieval(meta.id, { ...draft, chunking });
      toast.success("知识库配置已保存");
      router.push(`/knowledge-base/${meta.id}`);
    } catch { toast.error("保存失败，请重试"); setSaving(false); }
  }
  const graphOptions = (kind: "entity" | "relation") => draft.retrieval.graph[kind].categoryMode === "custom" ? draft.retrieval.graph[kind].customItems.filter(item => item.name.trim()).map(item => ({id:item.id,name:item.name})) : [];
  return <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
    <header className="flex items-center gap-3 border-b px-6 py-4"><Link href={`/knowledge-base/${meta.id}`} aria-label="返回知识库详情"><ArrowLeft className="h-5 w-5" /></Link><h1 className="text-lg font-semibold">编辑知识库配置 · {meta.name}</h1></header>
    <nav className="flex gap-8 border-b px-8" aria-label="配置步骤">{[["retrieval", "检索配置"], ["mixed", "混合检索策略配置"]].map(([value,label]) => <button key={value} type="button" onClick={() => value === "mixed" ? nextStep() : setTab("retrieval")} className={`border-b-2 py-4 text-sm ${tab === value ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}>{label}</button>)}</nav>
    <div className="min-h-0 flex-1 overflow-auto px-8 py-6">
      {!meta.retrievalSnapshot && <p className="mb-4 text-sm text-amber-600">未保存历史配置，当前从初始配置开始编辑。</p>}
      {reset && <p role="status" className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">检索器配置已变更，混合检索策略已重置为一个初始策略。请点击“下一步”重新编排可用策略后保存。</p>}
      {tab === "retrieval" ? <div className="space-y-6">
        <RetrievalConfigStep value={draft.retrieval} onChange={patchRetrieval} />
        <div className="max-w-5xl space-y-2"><label htmlFor="edit-content-tags" className="text-sm text-slate-700">内容标签</label><Input id="edit-content-tags" placeholder="多个标签用逗号分隔" value={(draft.contentTags ?? []).join(",")} onChange={event => setDraft(current => ({ ...current, contentTags: event.target.value.split(/[,，]/) }))} /></div>
        {affected.length > 0 && <section className="max-w-5xl space-y-4 rounded-lg border border-slate-200 p-4"><h2 className="font-semibold">切片策略</h2><div className="flex items-center gap-6 text-sm"><span>自动切片</span><Switch checked={draft.autoChunk ?? true} onCheckedChange={autoChunk => setDraft(current => ({ ...current, autoChunk }))} /></div>{affected.map(engine => {
          const current = chunkValue(engine);
          const options = engine === "pageindex" ? ["按层级切分"] : engine === "graph" ? ["按句子切分"] : chunkOptions;
          return <div key={engine} className="space-y-3"><h3 className="text-sm font-medium">{engineNames[engine]}</h3><div className="flex flex-wrap gap-2">{options.map(option => <button key={option} type="button" aria-pressed={current.strategies.includes(option)} className={`rounded border px-3 py-2 text-sm ${current.strategies.includes(option) ? "border-blue-500 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-600"}`} onClick={() => { const strategies = current.strategies.includes(option) ? current.strategies.filter(item => item !== option) : [...current.strategies, option]; if (strategies.length) patchChunk(engine,{ ...current, strategies }); }}>{option}</button>)}</div>{engine === "semantic" && current.strategies.includes("按长度切分") && <label className="flex items-center gap-4 text-sm">固定长度<Input type="number" className="w-28" min={300} max={1500} value={current.fixedLength ?? 800} onChange={event => patchChunk(engine, { ...current, fixedLength: Math.min(1500, Math.max(300, Number(event.target.value) || 300)) })} /></label>}</div>;
        })}</section>}
      </div> : <HybridStrategyStep value={draft.strategies} onChange={strategies => setDraft(current => ({ ...current, strategies }))} graphEntityOptions={graphOptions("entity")} graphRelationOptions={graphOptions("relation")} />}
    </div>
    <footer className="flex justify-end gap-3 border-t px-8 py-4"><Button variant="outline" onClick={() => router.push(`/knowledge-base/${meta.id}`)}>取消</Button>{tab === "retrieval" ? <Button onClick={nextStep}>下一步</Button> : <><Button variant="outline" disabled={saving} onClick={() => setTab("retrieval")}>上一步</Button><Button disabled={saving} onClick={save}>{saving ? "保存中…" : "保存配置"}</Button></>}</footer>
  </div>;
}
function LoadEditor() {
  const { id } = useParams<{id:string}>();
  const searchParams = useSearchParams();
  const [loaded, setLoaded] = useState<{meta:KnowledgeBaseListItem|null}|null>(null);
  useEffect(() => {
    // Browser storage is only available after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoaded({meta:getKnowledgeBaseMeta(id)});
  }, [id]);
  if (!loaded) return <p className="p-8 text-slate-400">加载中…</p>;
  if (!loaded.meta) return <div className="p-8">未找到知识库。<Link href="/knowledge-base" className="text-blue-600">返回列表</Link></div>;
  return <Editor key={id} meta={loaded.meta} initialTab={searchParams.get("tab") ?? "retrieval"} />;
}
export default function EditKnowledgeBasePage() {
  return <Suspense fallback={<p className="p-8">加载中…</p>}><LoadEditor /></Suspense>;
}
