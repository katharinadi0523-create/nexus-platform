"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Bot, GitBranch, Info, Link2, RefreshCw, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ImportObjectType } from "@/lib/agent-import-export";

type RelationshipObjectType = "workflow_agent" | "autonomous_agent" | "workflow";
type ObjectStatus = "已发布" | "草稿" | "导入失败";
type RelationStatus = "已关联" | "待重新关联" | "可重新关联";

type RelationshipNode = {
  id: string;
  name: string;
  type: RelationshipObjectType;
  status: ObjectStatus;
  relationStatus: RelationStatus;
  version?: string;
  href: string;
  parentId?: string;
  originalReference?: string;
};

const TYPE_META = {
  workflow_agent: { label: "工作流智能体", Icon: Workflow, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  autonomous_agent: { label: "自主规划智能体", Icon: Bot, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  workflow: { label: "工作流", Icon: GitBranch, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
};

const OBJECT_STATUS_CLASS: Record<ObjectStatus, string> = {
  已发布: "bg-emerald-50 text-emerald-700",
  草稿: "bg-slate-100 text-slate-600",
  导入失败: "bg-rose-50 text-rose-700",
};

const RELATION_STATUS_CLASS: Record<RelationStatus, string> = {
  已关联: "bg-blue-50 text-blue-700",
  待重新关联: "bg-amber-50 text-amber-700",
  可重新关联: "bg-cyan-50 text-cyan-700",
};

function normalizeType(type: ImportObjectType): RelationshipObjectType {
  return type === "autonomous_agent" ? "autonomous_agent" : type === "workflow" ? "workflow" : "workflow_agent";
}

function targetHref(type: RelationshipObjectType, id: string) {
  if (type === "workflow") return `/workflow/${id}`;
  return `/agent/${id}`;
}

function RelationCard({ node, selected, onSelect }: { node: RelationshipNode; selected: boolean; onSelect: () => void }) {
  const meta = TYPE_META[node.type];
  const Icon = meta.Icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative z-10 w-[230px] rounded-lg border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        selected ? "border-blue-500 ring-2 ring-blue-100" : meta.border
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", meta.bg, meta.color)}><Icon className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-900">{node.name}</span>
          <span className="mt-0.5 block text-xs text-slate-500">{meta.label}{node.version ? ` · ${node.version}` : ""}</span>
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={cn("rounded px-2 py-0.5 text-[11px] font-medium", OBJECT_STATUS_CLASS[node.status])}>{node.status}</span>
        <span className={cn("rounded px-2 py-0.5 text-[11px] font-medium", RELATION_STATUS_CLASS[node.relationStatus])}>{node.relationStatus}</span>
      </div>
    </button>
  );
}

export function ReferenceRelationshipDialog({ objectType, objectId, objectName, objectStatus = "草稿" }: { objectType: ImportObjectType; objectId: string; objectName: string; objectStatus?: ObjectStatus }) {
  const rootType = normalizeType(objectType);
  const [synced, setSynced] = useState(false);
  const nodes = useMemo<RelationshipNode[]>(() => [
    { id: objectId, name: objectName, type: rootType, status: objectStatus, relationStatus: "已关联", href: targetHref(rootType, objectId), version: objectStatus === "已发布" ? "V3" : "当前草稿" },
    { id: "osint-01", parentId: objectId, name: "售后分析智能体", type: "autonomous_agent", status: "已发布", relationStatus: "可重新关联", href: "/agent/osint-01", version: "V4", originalReference: "售后分析智能体 V3" },
    { id: "workflow-ticket", parentId: objectId, name: "退款审批流程", type: "workflow", status: synced ? "已发布" : "草稿", relationStatus: synced ? "可重新关联" : "待重新关联", href: "/workflow/workflow-ticket", version: synced ? "V5" : "草稿", originalReference: "退款审批流程 V3" },
    { id: "flow-01", parentId: "osint-01", name: "人工复核智能体", type: "workflow_agent", status: "导入失败", relationStatus: "待重新关联", href: "/agent/flow-01", originalReference: "人工复核智能体 V2" },
    { id: "workflow-report", parentId: "workflow-ticket", name: "经营日报生成流程", type: "workflow", status: "已发布", relationStatus: "已关联", href: "/workflow/workflow-report", version: "V3" },
  ], [objectId, objectName, objectStatus, rootType, synced]);
  const [selectedId, setSelectedId] = useState(objectId);
  const selected = nodes.find((item) => item.id === selectedId) ?? nodes[0];
  const selectedMeta = TYPE_META[selected.type];

  function handleRefresh() {
    setSynced(true);
    toast.info("对象状态已更新；画布中的待关联节点不会自动变更。", { duration: 3500 });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="icon-sm" className="h-8 w-8 rounded-[4px] border-slate-300 bg-white shadow-none" title="查看引用关系" aria-label="查看引用关系">
          <Link2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton className="h-[calc(100vh-48px)] w-[calc(100vw-48px)] max-w-none gap-0 overflow-hidden rounded-xl p-0 sm:max-w-none">
        <DialogHeader className="flex h-[72px] flex-row items-center justify-between border-b border-slate-200 px-6 text-left">
          <div>
            <DialogTitle className="flex items-center gap-2 text-xl">引用关系 <Info className="h-4 w-4 text-slate-400" /></DialogTitle>
            <p className="mt-1 text-xs text-slate-500">展示配置包记录的原对象引用，以及对象当前状态。</p>
          </div>
          <Button type="button" variant="outline" size="sm" className="mr-10 gap-2" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />刷新状态
          </Button>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          <aside className="w-[240px] shrink-0 border-r border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-3 text-xs font-medium text-slate-500">按对象查看</div>
            <div className="space-y-1">
              {nodes.map((node) => {
                const meta = TYPE_META[node.type];
                const Icon = meta.Icon;
                return (
                  <button key={node.id} type="button" onClick={() => setSelectedId(node.id)} className={cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm", selectedId === node.id ? "bg-blue-50 font-medium text-blue-700" : "text-slate-600 hover:bg-white hover:text-slate-900")}>
                    <Icon className="h-4 w-4 shrink-0" /><span className="truncate">{node.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 rounded-md border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
              状态会随关联对象更新，但不会自动修改源节点引用。
            </div>
          </aside>

          <section className="relative min-w-0 flex-1 overflow-auto bg-[radial-gradient(circle,#d7dee8_1px,transparent_1px)] [background-size:20px_20px]">
            <div className="relative mx-auto min-h-[650px] min-w-[820px] max-w-[980px] p-10">
              <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                <path d="M490 145 V200 M490 200 H265 V235 M490 200 H715 V235" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                <path d="M265 340 V405 M715 340 V405" fill="none" stroke="#cbd5e1" strokeWidth="2" />
              </svg>
              <div className="absolute left-1/2 top-[55px] -translate-x-1/2"><RelationCard node={nodes[0]} selected={selectedId === nodes[0].id} onSelect={() => setSelectedId(nodes[0].id)} /></div>
              <div className="absolute left-[150px] top-[235px]"><RelationCard node={nodes[1]} selected={selectedId === nodes[1].id} onSelect={() => setSelectedId(nodes[1].id)} /></div>
              <div className="absolute right-[150px] top-[235px]"><RelationCard node={nodes[2]} selected={selectedId === nodes[2].id} onSelect={() => setSelectedId(nodes[2].id)} /></div>
              <div className="absolute left-[150px] top-[405px]"><RelationCard node={nodes[3]} selected={selectedId === nodes[3].id} onSelect={() => setSelectedId(nodes[3].id)} /></div>
              <div className="absolute right-[150px] top-[405px]"><RelationCard node={nodes[4]} selected={selectedId === nodes[4].id} onSelect={() => setSelectedId(nodes[4].id)} /></div>
            </div>
          </section>

          <aside className="w-[300px] shrink-0 border-l border-slate-200 bg-white p-5">
            <div className="text-xs font-medium text-slate-500">对象详情</div>
            <div className="mt-4 flex items-center gap-3">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", selectedMeta.bg, selectedMeta.color)}><selectedMeta.Icon className="h-5 w-5" /></span>
              <div className="min-w-0"><div className="truncate font-semibold text-slate-900">{selected.name}</div><div className="mt-0.5 text-xs text-slate-500">{selectedMeta.label}</div></div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3"><dt className="text-slate-500">当前状态</dt><dd className={cn("rounded px-2 py-0.5 text-xs font-medium", OBJECT_STATUS_CLASS[selected.status])}>{selected.status}</dd></div>
              <div className="flex items-center justify-between gap-3"><dt className="text-slate-500">引用状态</dt><dd className={cn("rounded px-2 py-0.5 text-xs font-medium", RELATION_STATUS_CLASS[selected.relationStatus])}>{selected.relationStatus}</dd></div>
              {selected.originalReference ? <div className="border-t border-slate-100 pt-3"><dt className="text-slate-500">原引用对象</dt><dd className="mt-1 text-slate-900">{selected.originalReference}</dd></div> : null}
            </dl>
            {selected.relationStatus !== "已关联" ? <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">该对象尚未形成有效引用。请进入源对象，在对应节点中重新选择并确认关联。</div> : null}
            <a href={selected.href} target="_blank" rel="noreferrer" className="mt-5 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700">
              前往处理<ArrowUpRight className="h-4 w-4" />
            </a>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
