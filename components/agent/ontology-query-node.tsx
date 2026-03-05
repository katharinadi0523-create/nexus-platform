"use client";

import { useState, useMemo } from "react";
import {
  Layers,
  FileText,
  Copy,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  OntologyExecutionData,
  ResponseDataItem,
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
// Area C: 业务视图 - 按对象类型聚类，扁平列出实例
// ---------------------------------------------------------------------------

/**
 * 从 response_data 中按「对象类型」聚类，收集每个类型下的所有对象实例 ID。
 * 结构：Map<object_type, object_id[]>
 */
function collectObjectsByType(
  data: ResponseDataItem[]
): Map<string, string[]> {
  const map = new Map<string, Set<string>>();
  const typeOrder: string[] = [];

  const add = (objectType: string, objectId: string) => {
    const type = objectType || "未知类型";
    if (!map.has(type)) {
      map.set(type, new Set());
      typeOrder.push(type);
    }
    map.get(type)!.add(objectId);
  };

  for (const item of data) {
    const entry = item.entry_object;
    if (entry) {
      add(entry.object_type, entry.object_id);
    }
    const paths = item.traversed_paths ?? {};
    for (const nodes of Object.values(paths)) {
      for (const node of nodes) {
        add(node.object_type, node.object_id);
      }
    }
  }

  const result = new Map<string, string[]>();
  for (const type of typeOrder) {
    result.set(type, Array.from(map.get(type)!));
  }
  return result;
}

function BusinessViewContent({ data }: { data: OntologyExecutionData }) {
  const items = data.response_data?.data ?? [];
  const clustered = useMemo(() => collectObjectsByType(items), [items]);

  if (items.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-b-lg">
        未找到匹配的对象实例
      </div>
    );
  }

  return (
    <div className="px-2 pb-4">
      {Array.from(clustered.entries()).map(([objectType, instanceIds]) => (
        <ClusterBlock
          key={objectType}
          objectType={objectType}
          instanceIds={instanceIds}
        />
      ))}
    </div>
  );
}

/** 按对象类型分组：类型标题 + 扁平实例列表（|_ 前缀） */
function ClusterBlock({
  objectType,
  instanceIds,
}: {
  objectType: string;
  instanceIds: string[];
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
          {instanceIds.map((id) => (
            <div
              key={id}
              className="flex items-center gap-2 pl-6 py-1.5 pr-3 rounded hover:bg-slate-50/50 transition-colors"
            >
              <span className="text-slate-400 text-xs">|_</span>
              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-sm font-mono text-slate-800">{id}</span>
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
            开发者模式
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
