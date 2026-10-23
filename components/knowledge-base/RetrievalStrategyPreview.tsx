"use client";

import { useId, useState, type ReactNode } from "react";
import { ArrowDownWideNarrow, ChevronRight, Filter, Merge, Minus, Play, Plus, Search, Square, X } from "lucide-react";
import type { RetrievalStrategy, StrategyBusinessNode } from "@/components/knowledge-base/HybridStrategyStep";

const nodeStyles = {
  filter: { Icon: Filter, color: "bg-orange-500" },
  retriever: { Icon: Search, color: "bg-blue-600" },
  merger: { Icon: Merge, color: "bg-teal-500" },
  ranker: { Icon: ArrowDownWideNarrow, color: "bg-violet-500" },
};
const NODE_WIDTH = 168;
const NODE_HEIGHT = 50;
const COLUMN_GAP = 48;
const ROW_GAP = 108;

type CanvasNode = { id: string; label: string; x: number; y: number; kind: "start" | "end" | StrategyBusinessNode["kind"]; source?: StrategyBusinessNode };

export function RetrievalStrategyPreview({ strategy, renderConfig }: {
  strategy: RetrievalStrategy;
  renderConfig: (node: StrategyBusinessNode) => ReactNode;
}) {
  const [zoom, setZoom] = useState(100);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const markerId = useId().replace(/:/g, "");
  const stages = strategy.stages.filter(stage => stage.nodes.length > 0);
  const width = Math.max(760, Math.max(1, ...stages.map(stage => stage.nodes.length)) * (NODE_WIDTH + COLUMN_GAP) + 64);
  const height = Math.max(560, (stages.length + 1) * ROW_GAP + 190);
  const centerX = (width - NODE_WIDTH) / 2;
  const rows: CanvasNode[][] = [
    [{ id: "start", label: "开始", kind: "start", x: centerX, y: 94 }],
    ...stages.map((stage, index) => stage.nodes.map((node, column) => ({
      id: node.id, label: node.name, kind: node.kind, source: node,
      x: (width - (stage.nodes.length * NODE_WIDTH + (stage.nodes.length - 1) * COLUMN_GAP)) / 2 + column * (NODE_WIDTH + COLUMN_GAP),
      y: 94 + (index + 1) * ROW_GAP,
    }))),
    [{ id: "end", label: "结束", kind: "end", x: centerX, y: 94 + (stages.length + 1) * ROW_GAP }],
  ];
  const selected = stages.flatMap(stage => stage.nodes).find(node => node.id === selectedId);
  const scale = zoom / 100;

  return (
    <details open className="group/strategy overflow-hidden rounded-lg border border-slate-200">
      <summary className="flex cursor-pointer list-none items-center gap-2 bg-white px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-open/strategy:rotate-90" />
        <span className="min-w-0 truncate font-medium text-slate-900" title={strategy.name}>{strategy.name}</span>
        <span className={`shrink-0 rounded border px-1.5 py-0.5 text-xs ${stages.length ? "border-emerald-300 text-emerald-600" : "border-slate-200 text-slate-400"}`}>{stages.length ? "已配置" : "待配置"}</span>
      </summary>
      <div className="relative border-t border-slate-200 bg-slate-50/70">
        <div className="absolute left-4 top-3 z-10 flex items-center gap-1 rounded-xl bg-white p-1.5 shadow-sm" role="group" aria-label="画布缩放">
          <button type="button" aria-label="缩小画布" disabled={zoom <= 40} onClick={() => setZoom(value => Math.max(40, value - 10))} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><Minus className="h-4 w-4" /></button>
          <button type="button" aria-label="重置画布缩放" onClick={() => setZoom(100)} className="w-12 rounded py-1 text-xs tabular-nums text-blue-600 hover:bg-blue-50">{zoom}%</button>
          <button type="button" aria-label="放大画布" disabled={zoom >= 160} onClick={() => setZoom(value => Math.min(160, value + 10))} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="h-[560px] overflow-auto" role="region" aria-label={`${strategy.name}节点画布`} tabIndex={0} style={{ backgroundImage: "radial-gradient(#dce2ec 0.7px, transparent 0.7px)", backgroundSize: "10px 10px" }}>
          <div className="relative mx-auto" style={{ width: width * scale, height: height * scale }}>
            <div className="absolute left-0 top-0 origin-top-left" style={{ width, height, transform: `scale(${scale})` }}>
              <svg width={width} height={height} className="pointer-events-none absolute inset-0" aria-hidden="true">
                <defs><marker id={markerId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#cbd5e1" /></marker></defs>
                {rows.slice(0, -1).flatMap((row, index) => row.flatMap(from => rows[index + 1].map(to => {
                  const x1 = from.x + NODE_WIDTH / 2, y1 = from.y + NODE_HEIGHT;
                  const x2 = to.x + NODE_WIDTH / 2, y2 = to.y;
                  const middle = (y1 + y2) / 2;
                  return <path key={`${from.id}-${to.id}`} d={`M ${x1} ${y1} C ${x1} ${middle}, ${x2} ${middle}, ${x2} ${y2}`} fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd={`url(#${markerId})`} />;
                })))}
              </svg>
              {rows.flat().map(node => {
                const terminal = node.kind === "start" || node.kind === "end";
                const { Icon, color } = node.kind === "start" ? { Icon: Play, color: "bg-emerald-500" } : node.kind === "end" ? { Icon: Square, color: "bg-red-500" } : nodeStyles[node.kind];
                const content = <><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${color}`}><Icon className="h-4 w-4 text-white" /></span><span className="truncate text-sm font-semibold text-slate-900">{node.label}</span>{node.kind !== "start" && <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-blue-600" />}{node.kind !== "end" && <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-blue-600" />}</>;
                const className = `absolute flex items-center justify-center gap-2 rounded-xl border bg-white px-4 shadow-sm ${selectedId === node.id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`;
                const style = { left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT };
                return terminal ? <div key={node.id} className={className} style={style}>{content}</div> : <button key={node.id} type="button" className={`${className} hover:border-blue-400 focus-visible:outline-blue-500`} style={style} title={`查看${node.label}参数`} aria-pressed={selectedId === node.id} onClick={() => setSelectedId(current => current === node.id ? null : node.id)}>{content}</button>;
              })}
              {stages.length === 0 && <p className="absolute bottom-8 w-full text-center text-sm text-slate-400">创建时未编排节点</p>}
            </div>
          </div>
        </div>
      </div>
      {selected && <div className="border-t border-slate-200 bg-white p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">{selected.name} · 参数配置</h3><button type="button" aria-label="关闭节点参数" onClick={() => setSelectedId(null)} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>{renderConfig(selected)}</div>}
    </details>
  );
}
