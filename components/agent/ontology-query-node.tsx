"use client";

import { useState, useMemo } from "react";
import {
  Layers,
  FileText,
  Link2,
  Copy,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  OntologyExecutionData,
  ResponseDataItem,
  TraversedNode,
} from "@/lib/mock/mock-ontology-execution";

function formatJSON(value: unknown): string {
  if (value === null || value === undefined) return "null";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

// ---------------------------------------------------------------------------
// Area B: arguments（查询条件，可展开收起，默认展开）
// ---------------------------------------------------------------------------
function OntologyNodeQueryFilters({ data }: { data: OntologyExecutionData }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="border-b border-slate-200">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-slate-50/50 transition-colors"
      >
        <span className="text-xs font-medium text-slate-700">arguments</span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-3">
          <div className="bg-slate-100 rounded-lg border border-slate-200 p-3 overflow-x-auto">
            <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words font-mono">
              <code>{formatJSON(data.request_payload)}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Area C: 业务视图 - 聚类与层级
// ---------------------------------------------------------------------------
function clusterByEntryType(
  data: ResponseDataItem[]
): Map<string, ResponseDataItem[]> {
  const map = new Map<string, ResponseDataItem[]>();
  for (const item of data) {
    const type = item.entry_object?.object_type ?? "未知类型";
    if (!map.has(type)) map.set(type, []);
    map.get(type)!.push(item);
  }
  return map;
}

/** 逐层递进：link 一行，每个目标对象一行，用 ↳ 与缩进表达层级 */
function RelationshipRow({
  edgeName,
  nodes,
}: {
  edgeName: string;
  label: string;
  nodes: TraversedNode[];
}) {
  return (
    <>
      <div className="flex items-center gap-2 pl-8 py-1.5 pr-3 rounded hover:bg-slate-50/50 transition-colors">
        <span className="text-slate-400 text-xs">↳</span>
        <Link2 className="w-4 h-4 text-orange-500 shrink-0" />
        <span className="text-xs text-slate-700">{edgeName}</span>
        <span className="text-xs text-slate-500">(link)</span>
      </div>
      {nodes.map((node, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 pl-10 py-1.5 pr-3 rounded hover:bg-slate-50/50 transition-colors"
        >
          <span className="text-slate-400 text-xs">↳</span>
          <FileText className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs font-mono text-slate-800">{node.object_id}</span>
          {node.object_type && (
            <span className="text-xs text-slate-500">({node.object_type})</span>
          )}
        </div>
      ))}
    </>
  );
}

function BusinessViewContent({ data }: { data: OntologyExecutionData }) {
  const items = data.response_data?.data ?? [];
  const clustered = useMemo(() => clusterByEntryType(items), [items]);

  if (items.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-b-lg">
        未找到匹配的对象实例
      </div>
    );
  }

  return (
    <div className="px-2 pb-4">
      {Array.from(clustered.entries()).map(([objectType, entries]) => (
        <ClusterBlock
          key={objectType}
          objectType={objectType}
          entries={entries}
        />
      ))}
    </div>
  );
}

/** 按对象类型分组：类型行不做特殊背景、展开按钮在右侧；下方为逐层递进结构 */
function ClusterBlock({
  objectType,
  entries,
}: {
  objectType: string;
  entries: ResponseDataItem[];
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden mb-2 last:mb-0 bg-white">
      <div className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-slate-50/50 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="text-sm font-medium text-slate-800">{objectType}</span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded hover:bg-slate-200/80 transition-colors shrink-0"
          aria-label={expanded ? "收起" : "展开"}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>
      {expanded && (
        <div className="pt-0.5 pb-2">
          {entries.map((item, idx) => (
            <div key={idx} className="space-y-0">
              <div className="flex items-center gap-2 pl-6 py-1.5 pr-3 rounded hover:bg-slate-50/50 transition-colors">
                <span className="text-slate-400 text-xs">↳</span>
                <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-sm font-mono text-slate-800">
                  {item.entry_object?.object_id ?? `条目 ${idx + 1}`}
                </span>
                {item.entry_object?.score != null && (
                  <span className="text-xs text-slate-500">
                    得分 {item.entry_object.score}
                  </span>
                )}
                <span className="text-xs text-slate-500">(对象实例)</span>
              </div>
              {item.traversed_paths &&
                Object.entries(item.traversed_paths).map(([edge, nodes]) => (
                  <RelationshipRow
                    key={edge}
                    edgeName={edge}
                    label={
                      edge === "has_event_subject"
                        ? "关联主体"
                        : edge.replace(/_/g, " ")
                    }
                    nodes={nodes}
                  />
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Area C: 开发者视图
// ---------------------------------------------------------------------------
function DeveloperViewContent({
  data,
  onCopy,
}: {
  data: OntologyExecutionData;
  onCopy: () => void;
}) {
  const json = formatJSON(data.response_data);
  return (
    <div className="px-4 pb-4 relative">
      <div className="absolute top-2 right-4 z-10">
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          复制
        </button>
      </div>
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 overflow-x-auto min-h-[120px]">
        <pre className="text-xs text-slate-200 whitespace-pre-wrap break-words font-mono pr-20">
          <code>{json}</code>
        </pre>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 双模式切换 + Area C 容器
// ---------------------------------------------------------------------------
function OntologyNodeResults({
  data,
  defaultView = "business",
}: {
  data: OntologyExecutionData;
  defaultView?: "business" | "developer";
}) {
  const [view, setView] = useState<"business" | "developer">(defaultView);

  const handleCopy = () => {
    const json = formatJSON(data.response_data);
    void navigator.clipboard.writeText(json);
  };

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <div className="px-4 py-2 flex items-center justify-between gap-3 border-b border-slate-100">
        <div className="text-xs font-medium text-slate-700">
          responses
        </div>
        <div
          className={cn(
            "inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200",
            "text-xs font-medium"
          )}
        >
          <button
            type="button"
            onClick={() => setView("business")}
            className={cn(
              "px-3 py-1.5 rounded-md transition-colors",
              view === "business"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            业务视图
          </button>
          <button
            type="button"
            onClick={() => setView("developer")}
            className={cn(
              "px-3 py-1.5 rounded-md transition-colors",
              view === "developer"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            开发者视图
          </button>
        </div>
      </div>
      {view === "business" ? (
        <BusinessViewContent data={data} />
      ) : (
        <DeveloperViewContent data={data} onCopy={handleCopy} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 主卡片组件
// ---------------------------------------------------------------------------
export interface OntologyQueryNodeProps {
  data: OntologyExecutionData;
  /** 默认结果视图 */
  defaultResultView?: "business" | "developer";
}

export function OntologyQueryNode({
  data,
  defaultResultView = "business",
}: OntologyQueryNodeProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
      <OntologyNodeQueryFilters data={data} />
      <OntologyNodeResults data={data} defaultView={defaultResultView} />
    </div>
  );
}
