"use client";

import { useState } from "react";
import { FileText, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CHUNK_METHODS, GRAPH_SENTENCE_PARAMS, FORMAT_GROUPS, applicableChunkGroups, resolveRetrievalChunkConfig, enabledChunkGroups, type RetrievalChunkGroup, defaultFormatConfig, getFormatGroup, validateFormatConfig, type FormatChunkConfig, type FormatChunkConfigs } from "@/lib/knowledge-base-format-chunking";

function FormatEditor({ groupId, retrieval, retrievalLabel, initial, onSave, onClose }: { groupId: string; retrieval: RetrievalChunkGroup; retrievalLabel: string; initial: FormatChunkConfig; onSave: (config: FormatChunkConfig) => void; onClose: () => void }) {
  const group = FORMAT_GROUPS.find(item => item.id === groupId)!;
  const [draft, setDraft] = useState(() => structuredClone(initial));
  const [error, setError] = useState<string | null>(null);
  function patch(method: string, key: string, value: string | number | boolean) {
    setDraft(current => ({ ...current, params: { ...current.params, [method]: { ...current.params[method], [key]: value } } }));
    setError(null);
  }
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-[720px]">
    <DialogHeader><DialogTitle>{group.label} · {retrievalLabel} · 切片策略</DialogTitle><DialogDescription>{retrieval === "graph" ? "切片方式固定为句子切分，仅可调整切片长度和重叠比例。" : group.methods.length > 1 ? "可多选切片方式，并分别设置参数。配置仅应用于本次上传的同类文件及当前检索类别。" : "此格式使用专属切片方式，可调整以下参数。"}</DialogDescription></DialogHeader>
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2 pr-2">
      {retrieval !== "graph" && group.methods.length > 1 && <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 p-4">{group.methods.map(method => <label key={method} className="flex items-center gap-2 text-sm"><Checkbox checked={draft.methods.includes(method)} onCheckedChange={checked => { setDraft(current => ({ ...current, methods: checked ? [...current.methods, method] : current.methods.filter(item => item !== method) })); setError(null); }} />{CHUNK_METHODS[method].label}{method === group.methods[0] && <span className="text-xs text-blue-600">推荐</span>}</label>)}</div>}
      {draft.methods.map(method => <section key={method} className="space-y-4 rounded-lg border border-slate-200 p-4"><h3 className="text-sm font-semibold">{CHUNK_METHODS[method].label}</h3>{(retrieval === "graph" ? GRAPH_SENTENCE_PARAMS : CHUNK_METHODS[method].params).map(param => {
        const id = `chunk-${groupId}-${method}-${param.key}`;
        const value = draft.params[method]?.[param.key] ?? param.defaultValue;
        return <div key={param.key} className="grid grid-cols-[180px_minmax(0,1fr)] items-start gap-3"><label htmlFor={id} className="pt-2 text-sm text-slate-600">{param.label}</label><div className="space-y-1">{param.type === "boolean" ? <Switch id={id} checked={Boolean(value)} onCheckedChange={next => patch(method, param.key, next)} /> : param.type === "number" ? <Input id={id} type="number" min={param.min} max={param.max} step={param.step ?? 1} value={String(value)} onChange={event => patch(method, param.key, event.target.value === "" ? "" : Number(event.target.value))} /> : <Textarea id={id} rows={param.key === "flags" ? 1 : 3} value={String(value)} onChange={event => patch(method, param.key, event.target.value)} />}{param.hint && <p className="text-xs text-slate-400">{param.hint}</p>}</div></div>;
      })}</section>)}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>取消</Button><Button onClick={() => { const message = validateFormatConfig(groupId, draft, retrieval); if (message) { setError(message); return; } onSave(draft); }}>保存</Button></DialogFooter>
  </DialogContent></Dialog>;
}

export function FormatChunkCards({ files, value, onChange, engines }: { files: { name: string }[]; value: FormatChunkConfigs; onChange: (value: FormatChunkConfigs) => void; engines: readonly string[] }) {
  const [editing, setEditing] = useState<{ format: string; retrieval: RetrievalChunkGroup } | null>(null);
  const groups = FORMAT_GROUPS.map(group => ({ ...group, files: files.filter(file => getFormatGroup(file.name)?.id === group.id) })).filter(group => group.files.length > 0);
  const retrievalGroups = enabledChunkGroups(engines);
  const active = groups.find(group => group.id === editing?.format && group.methods.length > 1);
  const activeRetrieval = active ? applicableChunkGroups(active.id, engines).find(group => group.id === editing?.retrieval && group.id !== "pageindex") : undefined;
  return <div className="space-y-3">
    {groups.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-400">上传文本文件后，按文件格式显示切片策略卡片。</p>}
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">{groups.map(group => {
      const applicableGroups = applicableChunkGroups(group.id, engines);
      return (
      <section key={group.id} className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500" /><h4 className="text-sm font-semibold text-slate-900">{group.label}</h4><span className="text-xs text-slate-400">{group.files.length} 个文件</span></div>
        <p className="mt-2 truncate text-xs text-slate-400" title={group.files.map(file => file.name).join("、")}>{group.files.map(file => file.name).join("、")}</p>
        {applicableGroups.length === 0 && <p className="mt-4 text-xs text-slate-500">{retrievalGroups.length === 0 ? "未读取到该知识库已启用的检索引擎，请先配置检索引擎。" : "当前启用的检索引擎没有适用于此格式的切片方式。"}</p>}
        <div className="mt-3 divide-y divide-slate-100">{applicableGroups.map(retrieval => {
          const config = resolveRetrievalChunkConfig(group.id, retrieval.id, value[group.id]?.[retrieval.id]);
          const editable = group.methods.length > 1 && retrieval.id !== "pageindex";
          const recommended = JSON.stringify(config) === JSON.stringify(defaultFormatConfig(group.id));
          return <div key={retrieval.id} className="py-3 first:pt-0 last:pb-0">
            <div className="mb-2 flex items-center justify-between gap-2"><h5 className="text-xs font-medium text-slate-700">{retrieval.label}</h5>{editable && <button type="button" aria-label={`编辑${group.label}的${retrieval.label}切片策略`} title="编辑切片策略" className="rounded p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-600" onClick={() => setEditing({ format: group.id, retrieval: retrieval.id })}><Pencil className="h-3.5 w-3.5" /></button>}</div>
            <div className="flex flex-wrap gap-2">{config.methods.map(method => <span key={method} className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">{group.methods.length === 1 ? "默认切分" : CHUNK_METHODS[method].label}</span>)}</div>
            <p className="mt-2 text-xs text-slate-400">{retrieval.id === "graph" && editable ? "固定句子切分 · 可编辑切片长度和重叠比例" : !editable ? "固定切片方式，不可修改" : recommended ? "系统推荐 · 支持多选切片方式" : "自定义配置"}</p>
          </div>;
        })}</div>
      </section>
    ); })}</div>
    {files.some(file => file.name.toLowerCase().endsWith(".zip")) && <p className="text-xs text-slate-500">ZIP 压缩包不单独配置格式切片。</p>}
    {active && activeRetrieval && <FormatEditor key={`${active.id}-${activeRetrieval.id}`} groupId={active.id} retrieval={activeRetrieval.id} retrievalLabel={activeRetrieval.label} initial={resolveRetrievalChunkConfig(active.id, activeRetrieval.id, value[active.id]?.[activeRetrieval.id])} onClose={() => setEditing(null)} onSave={config => { onChange({ ...value, [active.id]: { ...value[active.id], [activeRetrieval.id]: config } }); setEditing(null); }} />}
  </div>;
}
