"use client";

import { useMemo, useState } from "react";
import { CirclePlay, Eye, FileStack, Pencil, Plus, Puzzle, Search, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SkillConfigDialog, type SkillConfigSelection } from "@/components/claw-hub-next/skill-config-dialog";
import { ToolConfigDialog, type ToolConfigSelection } from "@/components/claw-hub-next/tool-config-dialog";
import { KnowledgeConfigDialog, type KnowledgeConfigSelection } from "@/components/claw-hub-next/knowledge-config-dialog";
import { SingleAgentDebugDialog } from "@/components/claw-hub-next/single-agent-debug-dialog";
import type { CapabilityAgentItem, CapabilityKnowledgeItem, CapabilitySkillItem, CapabilityToolItem, ClawDetailData } from "@/lib/mock/claw-hub-next";
import { PRESET_MODEL_IDS } from "@/lib/model-schemas";
import { SectionCard } from "./section-card";

type Props = {
  agents: CapabilityAgentItem[];
  clawDetail: ClawDetailData;
  onChange: (agents: CapabilityAgentItem[]) => void;
};

const EMPTY_RESOURCES = { skills: [], tools: [], knowledge: [] };
const MODEL_OPTIONS = PRESET_MODEL_IDS.map((id) => ({ value: id, label: id }));
const REFERENCE_CANDIDATES: CapabilityAgentItem[] = [
  { id: "ref-data-analysis", name: "数据分析智能体", description: "对结构化科研数据进行统计分析并解释结果。", enabled: true, target: "智能体广场", primaryModel: "Qwen3-32B", fallbackModel: "Qwen3-8B", prompt: "依据输入数据完成统计分析，明确方法、假设与结果边界。", sourceType: "referenced" },
  { id: "ref-experiment-design", name: "实验设计智能体", description: "辅助设计实验变量、对照组与验证流程。", enabled: true, target: "智能体广场", primaryModel: "Qwen3-32B", fallbackModel: "Qwen3-8B", prompt: "根据研究目标设计可执行、可复现的实验方案。", sourceType: "referenced" },
  { id: "ref-academic-translation", name: "学术翻译智能体", description: "完成中英文学术内容翻译与术语一致性检查。", enabled: true, target: "组织智能体库", primaryModel: "Qwen3-32B", fallbackModel: "Qwen3-8B", prompt: "保持原文事实、术语与论证关系，输出规范学术译文。", sourceType: "referenced" },
];

export function ClawAgentResourceSection({ agents, clawDetail, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CapabilityAgentItem | null>(null);
  const [resourceTab, setResourceTab] = useState<"skills" | "tools" | "knowledge">("skills");
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [toolDialogOpen, setToolDialogOpen] = useState(false);
  const [knowledgeDialogOpen, setKnowledgeDialogOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [debugAgent, setDebugAgent] = useState<CapabilityAgentItem | null>(null);
  const [selectedReferenceId, setSelectedReferenceId] = useState(REFERENCE_CANDIDATES[0].id);
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value ? agents.filter((item) => `${item.name}${item.description}`.toLowerCase().includes(value)) : agents;
  }, [agents, query]);

  function openEditor(item: CapabilityAgentItem) {
    setEditingId(item.id);
    setDraft({ ...item, primaryModel: item.primaryModel ?? PRESET_MODEL_IDS[0], fallbackModel: item.fallbackModel ?? PRESET_MODEL_IDS[1], prompt: item.prompt ?? "", resources: item.resources ?? EMPTY_RESOURCES });
  }

  function createAgent() {
    const id = `agent-${Date.now()}`;
    setEditingId(id);
    setDraft({ id, name: "", description: "", enabled: true, target: "Claw私有智能体", primaryModel: PRESET_MODEL_IDS[0], fallbackModel: PRESET_MODEL_IDS[1], prompt: "", sourceType: "created", resources: { skills: [], tools: [], knowledge: [] } });
  }

  function addReference() {
    const candidate = REFERENCE_CANDIDATES.find((item) => item.id === selectedReferenceId);
    if (!candidate) return;
    if (agents.some((item) => item.id === candidate.id)) {
      setReferenceOpen(false);
      return toast.info("该智能体已被引用。");
    }
    onChange([...agents, candidate]);
    setReferenceOpen(false);
    openEditor(candidate);
    toast.success(`已引用：${candidate.name}`);
  }

  function save() {
    if (!draft?.name.trim()) return toast.error("请填写智能体名称。");
    const saved = { ...draft, name: draft.name.trim(), description: draft.description.trim(), sourceType: "created" as const };
    onChange(agents.some((item) => item.id === editingId) ? agents.map((item) => (item.id === editingId ? saved : item)) : [...agents, saved]);
    setEditingId(null);
    toast.success(`已保存：${draft.name}`);
  }

  function mergeSkills(selections: SkillConfigSelection[]) {
    if (!draft) return;
    const current = draft.resources ?? EMPTY_RESOURCES;
    const map = new Map(current.skills.map((item) => [item.id, item]));
    selections.forEach((item) => map.set(item.id, { ...item, enabled: true }));
    setDraft({ ...draft, resources: { ...current, skills: [...map.values()] } });
    setSkillDialogOpen(false);
  }

  function mergeTools(selections: ToolConfigSelection[]) {
    if (!draft) return;
    const current = draft.resources ?? EMPTY_RESOURCES;
    const map = new Map(current.tools.map((item) => [item.id, item]));
    selections.forEach((item) => map.set(item.id, { ...item, enabled: true, kind: item.kind, meta: item.kind === "plugin" ? "OpenAPI" : item.kind === "ontology_action" ? "本体动作" : item.kind.toUpperCase() }));
    setDraft({ ...draft, resources: { ...current, tools: [...map.values()] } });
    setToolDialogOpen(false);
  }

  function mergeKnowledge(selections: KnowledgeConfigSelection[]) {
    if (!draft) return;
    const current = draft.resources ?? EMPTY_RESOURCES;
    const map = new Map(current.knowledge.map((item) => [item.id, item]));
    selections.forEach((item) => map.set(item.id, { ...item, enabled: true }));
    setDraft({ ...draft, resources: { ...current, knowledge: [...map.values()] } });
    setKnowledgeDialogOpen(false);
  }

  function removeResource(kind: "skills" | "tools" | "knowledge", id: string) {
    if (!draft || draft.sourceType === "referenced") return;
    const current = draft.resources ?? EMPTY_RESOURCES;
    setDraft({ ...draft, resources: { ...current, [kind]: current[kind].filter((item) => item.id !== id) } });
  }

  return (
    <SectionCard>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">智能体</h2>
            <p className="mt-1 text-sm text-slate-500">管理当前 Claw 在任务执行中可调度的专业智能体。</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-[320px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索智能体名称或描述" className="h-9 border-slate-200 bg-white pl-9 shadow-none" />
            </div>
            <div className="group relative shrink-0 pb-2 -mb-2">
              <Button type="button" size="icon" className="h-9 w-9 bg-blue-600 text-white hover:bg-blue-700" aria-label="新增智能体"><Plus className="h-4 w-4" /></Button>
              <div className="invisible absolute right-0 top-full z-30 w-40 translate-y-1 rounded-md border border-slate-200 bg-white p-1 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <button type="button" className="w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={createAgent}>新建子智能体</button>
                <button type="button" className="w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => setReferenceOpen(true)}>引用子智能体</button>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow><TableHead className="px-4">名称</TableHead><TableHead className="w-[130px] px-4">状态</TableHead><TableHead className="px-4">描述</TableHead><TableHead className="w-[360px] px-4">资源配置</TableHead><TableHead className="w-[220px] px-4">操作</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 font-medium text-slate-900">{item.name}</TableCell>
                  <TableCell className="px-4"><div className="flex items-center gap-2"><Switch className="data-[state=checked]:bg-blue-600" checked={item.enabled} onCheckedChange={(enabled) => onChange(agents.map((row) => row.id === item.id ? { ...row, enabled } : row))} /><span className="text-sm text-slate-600">{item.enabled ? "已启用" : "未启用"}</span></div></TableCell>
                  <TableCell className="max-w-[520px] px-4 text-sm text-slate-500">{item.description}</TableCell>
                  <TableCell className="px-4"><AgentResourceSummary resources={item.resources} /></TableCell>
                  <TableCell className="px-4"><div className="flex gap-1"><Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" disabled={!item.enabled} title={item.enabled ? `调试 ${item.name}` : "请先启用智能体"} onClick={() => setDebugAgent(item)}><CirclePlay className="h-4 w-4" />调试</Button><Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" onClick={() => openEditor(item)}>{item.sourceType === "referenced" ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}{item.sourceType === "referenced" ? "查看" : "编辑"}</Button><Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-600" onClick={() => { onChange(agents.filter((row) => row.id !== item.id)); toast.success(`已删除：${item.name}`); }}><Trash2 className="h-4 w-4" />删除</Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 ? <div className="py-16 text-center text-sm text-slate-400">没有匹配的智能体</div> : null}
        </div>
      </div>

      <Dialog open={Boolean(editingId)} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="max-h-[90vh] w-[min(960px,calc(100vw-32px))] max-w-none gap-0 overflow-hidden border-slate-200 p-0">
          {draft ? <>
            <DialogHeader className="border-b border-slate-200 px-6 py-4"><DialogTitle>{draft.sourceType === "referenced" ? "查看智能体配置" : agents.some((item) => item.id === editingId) ? "编辑智能体" : "新建子智能体"}</DialogTitle>{draft.sourceType === "referenced" ? <p className="text-sm text-slate-500">该智能体来自{draft.target}，配置仅供查看。</p> : null}</DialogHeader>
            <div className="max-h-[calc(90vh-126px)] overflow-y-auto px-6 py-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div><Label>智能体名称</Label><Input disabled={draft.sourceType === "referenced"} className="mt-2" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
                <div><Label>状态</Label><div className="mt-2 flex h-10 items-center gap-3 rounded-md border border-slate-200 px-3"><Switch className="data-[state=checked]:bg-blue-600" disabled={draft.sourceType === "referenced"} checked={draft.enabled} onCheckedChange={(enabled) => setDraft({ ...draft, enabled })} /><span className="text-sm text-slate-600">{draft.enabled ? "已启用" : "未启用"}</span></div></div>
                <div className="sm:col-span-2"><Label>描述</Label><Textarea disabled={draft.sourceType === "referenced"} className="mt-2 min-h-24 resize-none" maxLength={200} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /><div className="mt-1 text-right text-xs text-slate-400">{draft.description.length} / 200</div></div>
              </div>
              <div className="my-5 border-t border-slate-200" />
              <h3 className="text-sm font-semibold text-slate-900">模型配置</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2"><div><Label className="text-slate-500">主力模型</Label>{draft.sourceType === "referenced" ? <Input disabled className="mt-2" value={draft.primaryModel} /> : <Select className="mt-2" value={draft.primaryModel} options={MODEL_OPTIONS} onValueChange={(primaryModel) => setDraft({ ...draft, primaryModel })} />}</div><div><Label className="text-slate-500">降级模型</Label>{draft.sourceType === "referenced" ? <Input disabled className="mt-2" value={draft.fallbackModel} /> : <Select className="mt-2" value={draft.fallbackModel} options={MODEL_OPTIONS} onValueChange={(fallbackModel) => setDraft({ ...draft, fallbackModel })} />}</div></div>
              <div className="mt-4"><Label className="text-slate-500">提示词</Label><Textarea disabled={draft.sourceType === "referenced"} className="mt-2 min-h-32 resize-y" placeholder="请输入智能体提示词..." value={draft.prompt} onChange={(e) => setDraft({ ...draft, prompt: e.target.value })} /></div>
              <div className="mt-6 border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-slate-900">资源配置</h3>{draft.sourceType !== "referenced" ? <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => resourceTab === "skills" ? setSkillDialogOpen(true) : resourceTab === "tools" ? setToolDialogOpen(true) : setKnowledgeDialogOpen(true)}><Plus className="h-4 w-4" />添加{resourceTab === "skills" ? "技能" : resourceTab === "tools" ? "插件" : "知识"}</Button> : null}</div>
                <div className="mt-4 flex border-b border-slate-200">{([{ id: "skills", label: "技能", icon: Sparkles }, { id: "tools", label: "插件", icon: Puzzle }, { id: "knowledge", label: "知识", icon: FileStack }] as const).map((tab) => { const Icon = tab.icon; const count = (draft.resources ?? EMPTY_RESOURCES)[tab.id].length; return <button key={tab.id} type="button" onClick={() => setResourceTab(tab.id)} className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm ${resourceTab === tab.id ? "border-blue-600 font-medium text-blue-600" : "border-transparent text-slate-500"}`}><Icon className="h-4 w-4" />{tab.label}<span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{count}</span></button>; })}</div>
                <AgentResourceList kind={resourceTab} resources={draft.resources ?? EMPTY_RESOURCES} readOnly={draft.sourceType === "referenced"} onRemove={removeResource} />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4"><Button variant="outline" onClick={() => setEditingId(null)}>{draft.sourceType === "referenced" ? "关闭" : "取消"}</Button>{draft.sourceType !== "referenced" ? <Button className="bg-blue-600 hover:bg-blue-700" onClick={save}>保存</Button> : null}</div>
          </> : null}
        </DialogContent>
      </Dialog>

      <SkillConfigDialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen} onConfirm={mergeSkills} />
      <ToolConfigDialog open={toolDialogOpen} onOpenChange={setToolDialogOpen} onConfirm={mergeTools} />
      <KnowledgeConfigDialog open={knowledgeDialogOpen} onOpenChange={setKnowledgeDialogOpen} onConfirm={mergeKnowledge} />

      <SingleAgentDebugDialog
        open={Boolean(debugAgent)}
        onOpenChange={(open) => !open && setDebugAgent(null)}
        agent={debugAgent}
        clawDetail={clawDetail}
      />

      <Dialog open={referenceOpen} onOpenChange={setReferenceOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader><DialogTitle>引用子智能体</DialogTitle><p className="text-sm text-slate-500">引用后可查看配置，但不能修改来源智能体的配置。</p></DialogHeader>
          <div className="space-y-2">{REFERENCE_CANDIDATES.map((item) => <button key={item.id} type="button" onClick={() => setSelectedReferenceId(item.id)} className={`w-full rounded-md border p-4 text-left transition ${selectedReferenceId === item.id ? "border-blue-400 bg-blue-50/60" : "border-slate-200 hover:bg-slate-50"}`}><div className="flex items-center justify-between gap-3"><span className="font-medium text-slate-900">{item.name}</span><span className="text-xs text-slate-400">{item.target}</span></div><p className="mt-1 text-sm text-slate-500">{item.description}</p></button>)}</div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setReferenceOpen(false)}>取消</Button><Button className="bg-blue-600 hover:bg-blue-700" onClick={addReference}>确认引用</Button></div>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

type AgentResources = { skills: CapabilitySkillItem[]; tools: CapabilityToolItem[]; knowledge: CapabilityKnowledgeItem[] };

function AgentResourceSummary({ resources }: { resources?: AgentResources }) {
  const groups = [
    ["技能", resources?.skills ?? [], 2],
    ["插件", resources?.tools ?? [], 2],
    ["知识", resources?.knowledge ?? [], 1],
  ] as const;
  if (groups.every(([, items]) => items.length === 0)) return <span className="text-sm text-slate-400">未配置</span>;
  return <TooltipProvider delayDuration={200}><div className="space-y-1.5">{groups.filter(([, items]) => items.length > 0).map(([label, items, limit]) => {
    const visible = items.slice(0, limit);
    const hidden = items.slice(limit);
    return <div key={label} className="flex min-w-0 items-center gap-2"><span className="w-7 shrink-0 text-xs text-slate-400">{label}</span><div className="flex min-w-0 items-center gap-1">{visible.map((item) => <span key={item.id} className="max-w-[116px] truncate rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600" title={item.name}>{item.name}</span>)}{hidden.length ? <Tooltip><TooltipTrigger asChild><span className="shrink-0 cursor-default rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600">+{hidden.length}</span></TooltipTrigger><TooltipContent className="max-w-[280px] leading-5">{hidden.map((item) => item.name).join("、")}</TooltipContent></Tooltip> : null}</div></div>;
  })}</div></TooltipProvider>;
}

function AgentResourceList({ kind, resources, readOnly, onRemove }: { kind: keyof AgentResources; resources: AgentResources; readOnly: boolean; onRemove: (kind: keyof AgentResources, id: string) => void }) {
  const items = resources[kind];
  if (!items.length) return <div className="py-10 text-center text-sm text-slate-400">暂未配置{kind === "skills" ? "技能" : kind === "tools" ? "插件" : "知识"}</div>;
  return <div className="divide-y divide-slate-100">{items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="truncate text-sm font-medium text-slate-900">{item.name}</span>{kind === "tools" && "meta" in item && item.meta ? <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{item.meta}</span> : null}</div><p className="mt-1 truncate text-xs text-slate-500">{item.description}</p></div>{!readOnly ? <Button variant="ghost" size="sm" className="shrink-0 text-slate-500 hover:text-red-600" onClick={() => onRemove(kind, item.id)}><Trash2 className="h-4 w-4" />移除</Button> : null}</div>)}</div>;
}
