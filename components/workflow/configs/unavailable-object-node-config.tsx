"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Bot, Boxes, Check, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { UnavailableObjectNodeData } from "../nodes/unavailable-object-node";

type Candidate = {
  id: string;
  name: string;
  version: string;
  subtitle: string;
  componentType?: "MCP" | "插件" | "本体行为";
};

const CANDIDATES: Record<UnavailableObjectNodeData["objectKind"], Candidate[]> = {
  workflow: [
    { id: "workflow-ticket", name: "客户工单处理流程", version: "V5", subtitle: "已发布 · 2026-07-12" },
    { id: "workflow-report", name: "经营日报生成流程", version: "V3", subtitle: "已发布 · 2026-07-11" },
  ],
  agent: [
    { id: "agent-quality", name: "服务质检智能体", version: "V4", subtitle: "工作流智能体 · 已发布" },
    { id: "agent-risk", name: "风险复核智能体", version: "V2", subtitle: "自主规划智能体 · 已发布" },
  ],
  component: [
    { id: "mcp-web-search", name: "全网检索服务", version: "V2", subtitle: "MCP · 可用", componentType: "MCP" },
    { id: "plugin-ticket", name: "工单中心", version: "V3", subtitle: "插件 · 可用", componentType: "插件" },
    { id: "ontology-action-threat", name: "更新威胁等级", version: "V1", subtitle: "本体行为 · 可用", componentType: "本体行为" },
  ],
};

const KIND_META = {
  workflow: { label: "工作流", action: "重新关联工作流", Icon: GitBranch },
  agent: { label: "智能体", action: "重新关联智能体", Icon: Bot },
  component: { label: "组件", action: "选择组件", Icon: Boxes },
};

function VariableList({ title, variables }: { title: string; variables?: Array<{ name: string; type: string; value?: string }> }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
      <div className="mb-2 text-xs font-semibold text-slate-700">{title}</div>
      {variables?.length ? variables.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-3 border-t border-slate-200 py-2 text-xs first:border-0 first:pt-0 last:pb-0">
          <span className="font-medium text-slate-700">{item.name}</span>
          <span className="truncate text-slate-400">{item.value || item.type}</span>
        </div>
      )) : <div className="text-xs text-slate-400">无</div>}
    </div>
  );
}

export function UnavailableObjectNodeConfig({ nodeData, onUpdate }: { nodeData: UnavailableObjectNodeData; onUpdate: (data: Partial<UnavailableObjectNodeData>) => void }) {
  const [open, setOpen] = useState(false);
  const meta = KIND_META[nodeData.objectKind];
  const candidates = useMemo(() => {
    const all = CANDIDATES[nodeData.objectKind];
    if (nodeData.objectKind !== "component" || !nodeData.originalComponentType) return all;
    return [...all].sort((a, b) => Number(b.componentType === nodeData.originalComponentType) - Number(a.componentType === nodeData.originalComponentType));
  }, [nodeData.objectKind, nodeData.originalComponentType]);
  const [selectedId, setSelectedId] = useState(candidates[0]?.id ?? "");

  function handleConfirm() {
    const selected = candidates.find((item) => item.id === selectedId);
    if (!selected) return;
    onUpdate({
      referenceId: selected.id,
      referenceName: selected.name,
      originalVersion: selected.version,
      originalComponentType: selected.componentType,
    });
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2 text-sm font-semibold text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          待重新关联
        </div>
        <p className="mt-1.5 text-xs leading-5 text-amber-800">该节点保留原位置、连线和可恢复配置，但当前不参与运行。</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">原关联对象</h3>
        <div className="rounded-md border border-slate-200 p-3 text-sm">
          <div className="font-medium text-slate-900">{nodeData.originalReference} {nodeData.originalVersion ?? "V3"}</div>
          <div className="mt-1 text-xs text-slate-500">来源标识：{nodeData.originalSource ?? "配置包记录"}</div>
          <div className="mt-2 flex items-center gap-2 text-xs"><span className="text-slate-500">当前状态</span><span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-700">待重新关联</span></div>
        </div>
        <Button type="button" className="w-full bg-blue-600 text-white hover:bg-blue-700" onClick={() => setOpen(true)}>
          {meta.action}<ArrowRight className="h-4 w-4" />
        </Button>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">原输入输出配置</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">重新关联前仅供查看，不作为当前有效配置。</p>
        </div>
        <VariableList title="输入" variables={nodeData.inputVariables} />
        <VariableList title="输出" variables={nodeData.outputVariables} />
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader><DialogTitle>{meta.action}</DialogTitle></DialogHeader>
          <div className="rounded-md bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">确认后将校验输入输出：兼容字段自动恢复原映射，不兼容字段会标记异常。</div>
          {nodeData.objectKind === "component" ? <div className="text-xs text-slate-500">已优先定位原组件类型：{nodeData.originalComponentType ?? "插件"}</div> : null}
          <div className="max-h-[360px] space-y-2 overflow-y-auto">
            {candidates.map((item) => {
              const active = selectedId === item.id;
              return (
                <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={cn("flex w-full items-center gap-3 rounded-md border p-3 text-left transition", active ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50")}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-blue-600 shadow-sm"><meta.Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block font-medium text-slate-900">{item.name} <span className="text-xs text-slate-400">{item.version}</span></span><span className="mt-0.5 block text-xs text-slate-500">{item.subtitle}</span></span>
                  {active ? <Check className="h-4 w-4 text-blue-600" /> : null}
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleConfirm}>确认关联</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
