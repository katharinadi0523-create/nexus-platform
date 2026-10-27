"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getKnowledgeBaseMeta } from "@/lib/mock/knowledge-base-list";
import { HIERARCHY_RETRIEVAL_OPTIONS, normalizeClawKnowledgeRetrieval, defaultClawKnowledgeRetrievalConfig, loadClawKnowledgeRetrieval, saveClawKnowledgeRetrieval, validateClawKnowledgeRetrieval, type ClawKnowledgeRetrievalConfig } from "@/lib/claw-knowledge-retrieval";
import type { KnowledgeBaseRow } from "@/lib/mock/claw-hub-next";

export function KnowledgeRetrievalConfigDialog({ clawId, knowledgeBase, onClose, onSave }: { clawId: string; knowledgeBase: KnowledgeBaseRow; onClose: () => void; onSave: (config: ClawKnowledgeRetrievalConfig) => void }) {
  const [strategies] = useState(() => getKnowledgeBaseMeta(knowledgeBase.id)?.retrievalSnapshot?.strategies ?? []);
  const usable = (strategy: typeof strategies[number]) => strategy.stages.length > 0 && strategy.stages.every(stage => stage.nodes.length > 0) && strategy.stages.some(stage => stage.nodes.some(node => node.kind === "retriever"));
  const availableIds = strategies.filter(usable).map(strategy => strategy.id);
  const [draft, setDraft] = useState(() => normalizeClawKnowledgeRetrieval(loadClawKnowledgeRetrieval(clawId, knowledgeBase.id) ?? knowledgeBase.retrievalConfig ?? defaultClawKnowledgeRetrievalConfig()));
  const [error, setError] = useState<string | null>(null);
  const selected = availableIds.includes(draft.strategyId);
  const patch = (value: Partial<ClawKnowledgeRetrievalConfig>) => { setDraft(current => ({ ...current, ...value })); setError(null); };
  function save() {
    const current = getKnowledgeBaseMeta(knowledgeBase.id)?.retrievalSnapshot?.strategies ?? [];
    const message = validateClawKnowledgeRetrieval(draft, current.filter(usable).map(strategy => strategy.id));
    if (message) { setError(message); return; }
    try { saveClawKnowledgeRetrieval(clawId, knowledgeBase.id, draft); onSave(draft); toast.success("检索配置已保存"); onClose(); } catch { setError("保存失败，请重试"); }
  }
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-[680px]">
    <DialogHeader><DialogTitle>检索配置</DialogTitle><DialogDescription>{knowledgeBase.name} · 选择一条检索策略，并设置召回参数</DialogDescription></DialogHeader>
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-2">
      <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">检索策略（单选）</legend>
        {strategies.length === 0 ? <div className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-500">该知识库暂无已保存的检索策略。请先在<Link href={`/knowledge-base/${knowledgeBase.id}`} className="text-blue-600">知识库详情</Link>中配置。</div> : strategies.map(strategy => <label key={strategy.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${draft.strategyId === strategy.id ? "border-blue-500 bg-blue-50" : "border-slate-200"} ${!usable(strategy) ? "opacity-50" : ""}`}><input type="radio" name="claw-kb-strategy" value={strategy.id} checked={draft.strategyId === strategy.id} disabled={!usable(strategy)} onChange={() => patch({ strategyId: strategy.id })} /><span className="flex-1">{strategy.name}</span><span className="text-xs text-slate-400">{usable(strategy) ? `${strategy.stages.flatMap(stage => stage.nodes).length} 个节点` : "未完成配置"}</span></label>)}
      </fieldset>
      {draft.strategyId && !selected && <p role="status" className="text-sm text-amber-600">原策略已删除或不可用，请重新选择。</p>}
      <fieldset disabled={!selected} className="space-y-5 disabled:opacity-50">
        <div className="grid grid-cols-2 gap-4"><label className="space-y-2 text-sm"><span>Top K</span><Input type="number" min={1} step={1} value={Number.isNaN(draft.topK) ? "" : draft.topK} onChange={event => patch({ topK: event.target.valueAsNumber })} /></label><label className="space-y-2 text-sm"><span>Score</span><Input type="number" min={0} max={1} step={0.01} value={Number.isNaN(draft.score) ? "" : draft.score} onChange={event => patch({ score: event.target.valueAsNumber })} /></label></div>
        <details className="rounded-lg border border-slate-200" open><summary className="cursor-pointer px-4 py-3 text-sm font-medium">高级配置</summary><div className="space-y-5 border-t border-slate-100 p-4">
          <section className="space-y-3"><div className="flex items-center justify-between"><label htmlFor="small2big" className="text-sm font-medium">small2big</label><Switch id="small2big" checked={draft.small2big.enabled} disabled={!selected} onCheckedChange={enabled => patch({ small2big: { ...draft.small2big, enabled } })} /></div>
            {draft.small2big.enabled && <><Select value={draft.small2big.mode} onValueChange={mode => patch({ small2big: { ...draft.small2big, mode: mode as "adjacent" | "adaptive" } })} options={[{value:"adjacent",label:"相邻召回"},{value:"adaptive",label:"自适应召回"}]} />{draft.small2big.mode === "adjacent" && <div className="grid grid-cols-2 gap-3">{(["before","after"] as const).map(direction => <label key={direction} className="space-y-2 text-sm text-slate-600"><span>{direction === "before" ? "向前相邻块数量" : "向后相邻块数量"}</span><Input type="number" min={1} max={10} step={1} value={Number.isNaN(draft.small2big[direction]) ? "" : draft.small2big[direction]} onChange={event => patch({ small2big: { ...draft.small2big, [direction]: event.target.valueAsNumber } })} /></label>)}</div>}</>}
          </section>
          <section className="space-y-3 border-t border-slate-100 pt-4"><div className="flex items-center justify-between"><label htmlFor="hierarchy-retrieval" className="text-sm font-medium">层级结构检索</label><Switch id="hierarchy-retrieval" checked={draft.hierarchy.enabled} disabled={!selected} onCheckedChange={enabled => patch({ hierarchy: { ...draft.hierarchy, enabled } })} /></div><p className="text-xs text-slate-500">仅对层级切片文档生效。</p>
            {draft.hierarchy.enabled && <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3"><legend className="px-1 text-xs text-slate-500">召回方式（可多选）</legend>{HIERARCHY_RETRIEVAL_OPTIONS.map(option => <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><Checkbox disabled={!selected} checked={draft.hierarchy.modes.includes(option.value)} onCheckedChange={checked => patch({ hierarchy: { ...draft.hierarchy, modes: checked ? [...draft.hierarchy.modes, option.value] : draft.hierarchy.modes.filter(mode => mode !== option.value) } })} />{option.label}</label>)}</fieldset>}
          </section>
        </div></details>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>取消</Button><Button disabled={!selected} onClick={save}>保存</Button></DialogFooter>
  </DialogContent></Dialog>;
}
