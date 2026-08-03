"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  ChevronDown,
  Equal,
  GitCompareArrows,
  Minus,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  AgentBomResource,
  AgentResourceChange,
  AgentVersionRecord,
} from "@/lib/mock/agent-version-management";
import { cn } from "@/lib/utils";

type DiffFilter = "全部差异" | "新增" | "移除" | "变化";

interface ResourceFieldChange {
  label: string;
  before: string;
  after: string;
}

interface ResourceDiff {
  id: string;
  change: AgentResourceChange;
  resource: AgentBomResource;
  before?: AgentBomResource;
  after?: AgentBomResource;
  fields: ResourceFieldChange[];
  conclusion?: string;
}

interface AgentVersionCompositionProps {
  versions: AgentVersionRecord[];
  initialBaselineVersionId: string;
  initialTargetVersionId?: string;
  onClose: () => void;
}

const CHANGE_STYLES: Record<AgentResourceChange, {
  badge: string;
  rail: string;
  icon: typeof Plus;
  label: string;
}> = {
  新增: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rail: "border-l-emerald-500",
    icon: Plus,
    label: "新增",
  },
  移除: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    rail: "border-l-rose-500",
    icon: Minus,
    label: "移除",
  },
  变化: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    rail: "border-l-amber-500",
    icon: RefreshCw,
    label: "有变化",
  },
  未变化: {
    badge: "border-slate-200 bg-slate-100 text-slate-500",
    rail: "border-l-slate-300",
    icon: Equal,
    label: "未变化",
  },
};

function evidenceType(value: string) {
  if (/内容指纹|sha256/i.test(value)) return "内容";
  if (/配置指纹|cfg:/i.test(value)) return "配置";
  return null;
}

function friendlyEvidence(value: string) {
  const type = evidenceType(value);
  if (type === "内容") return "内容已固化";
  if (type === "配置") return "配置已固化";
  if (/资源引用/i.test(value)) return "按资源引用记录";
  return value;
}

function valueOrDefault(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function buildResourceDiffs(baseline: AgentBomResource[], target: AgentBomResource[]): ResourceDiff[] {
  const baselineMap = new Map(baseline.map((resource) => [resource.id, resource]));
  const targetMap = new Map(target.map((resource) => [resource.id, resource]));
  const targetIds = new Set(target.map((resource) => resource.id));
  const orderedIds = [
    ...target.map((resource) => resource.id),
    ...baseline.filter((resource) => !targetIds.has(resource.id)).map((resource) => resource.id),
  ];

  return orderedIds.map((id) => {
    const before = baselineMap.get(id);
    const after = targetMap.get(id);

    if (!before && after) {
      return { id, change: "新增", resource: after, after, fields: [] };
    }
    if (before && !after) {
      return { id, change: "移除", resource: before, before, fields: [] };
    }

    const fields: ResourceFieldChange[] = [];
    let conclusion: string | undefined;
    if (before && after) {
      if (before.name !== after.name) {
        fields.push({ label: "资源名称", before: before.name, after: after.name });
      }
      if (before.category !== after.category) {
        fields.push({ label: "资源分类", before: before.category, after: after.category });
      }
      const beforeScope = valueOrDefault(before.memberScope, "直接配置");
      const afterScope = valueOrDefault(after.memberScope, "直接配置");
      if (beforeScope !== afterScope) {
        fields.push({ label: "挂载位置", before: beforeScope, after: afterScope });
      }
      const beforeStatus = valueOrDefault(before.availabilityStatus, "启用");
      const afterStatus = valueOrDefault(after.availabilityStatus, "启用");
      if (beforeStatus !== afterStatus) {
        fields.push({ label: "使用状态", before: beforeStatus, after: afterStatus });
      }
      if (before.traceability !== after.traceability) {
        fields.push({ label: "追溯状态", before: before.traceability, after: after.traceability });
      }
      if (before.versionEvidence !== after.versionEvidence) {
        const beforeType = evidenceType(before.versionEvidence);
        const afterType = evidenceType(after.versionEvidence);
        const type = afterType ?? beforeType;
        if (type) {
          conclusion = `指纹校验：${type}有差异`;
        } else {
          fields.push({
            label: "版本依据",
            before: friendlyEvidence(before.versionEvidence),
            after: friendlyEvidence(after.versionEvidence),
          });
        }
      }
    }

    return {
      id,
      change: fields.length || conclusion ? "变化" : "未变化",
      resource: after ?? before!,
      before,
      after,
      fields,
      conclusion,
    };
  });
}

function VersionSelect({
  label,
  value,
  versions,
  disabledVersionId,
  onChange,
}: {
  label: string;
  value: string;
  versions: AgentVersionRecord[];
  disabledVersionId: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="relative mt-1.5">
        <select
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full appearance-none truncate rounded-lg border border-slate-300 bg-white px-3 pr-8 text-sm font-semibold text-slate-900 outline-none hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          {versions.map((version) => (
            <option key={version.id} value={version.id} disabled={version.id === disabledVersionId}>
              {version.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}
function ChangeBadge({ change }: { change: AgentResourceChange }) {
  const style = CHANGE_STYLES[change];
  const Icon = style.icon;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", style.badge)}>
      <Icon className="h-3.5 w-3.5" />
      {style.label}
    </span>
  );
}

function ResourceDiffDetails({
  item,
}: {
  item: ResourceDiff;
}) {
  const rows: ResourceFieldChange[] = [];

  if (item.change === "变化") rows.push(...item.fields);

  if (rows.length === 0) return null;

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">

      <dl className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[76px_minmax(0,1fr)_24px_minmax(0,1fr)] items-start gap-2 px-3 py-2 text-xs"
          >
            <dt className="font-medium text-slate-500">{row.label}</dt>
            <dd className={cn(
              "min-w-0 break-words rounded-md bg-rose-50 px-2 py-1.5 font-semibold text-rose-700",
              row.before === "—" && "font-normal text-slate-400"
            )}>
              {row.before}
            </dd>
            <ArrowRight className="mt-1.5 h-4 w-4 text-slate-400" />
            <dd className={cn(
              "min-w-0 break-words rounded-md bg-emerald-50 px-2 py-1.5 font-semibold text-emerald-700",
              row.after === "—" && "font-normal text-slate-400"
            )}>
              {row.after}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
export function AgentVersionComposition({
  versions,
  initialBaselineVersionId,
  initialTargetVersionId,
  onClose,
}: AgentVersionCompositionProps) {
  const fallbackTargetId = initialTargetVersionId
    ?? versions.find((version) => version.id !== initialBaselineVersionId)?.id
    ?? initialBaselineVersionId;
  const [baselineVersionId, setBaselineVersionId] = useState(initialBaselineVersionId);
  const [targetVersionId, setTargetVersionId] = useState(fallbackTargetId);
  const [filter, setFilter] = useState<DiffFilter>("全部差异");
  const [showUnchanged, setShowUnchanged] = useState(false);

  const baselineVersion = versions.find((version) => version.id === baselineVersionId) ?? versions[0];
  const targetVersion = versions.find((version) => version.id === targetVersionId)
    ?? versions.find((version) => version.id !== baselineVersion?.id)
    ?? versions[0];

  const diffs = useMemo(
    () => buildResourceDiffs(baselineVersion?.resources ?? [], targetVersion?.resources ?? []),
    [baselineVersion, targetVersion]
  );
  const counts = diffs.reduce<Record<AgentResourceChange, number>>(
    (current, item) => ({ ...current, [item.change]: current[item.change] + 1 }),
    { 新增: 0, 移除: 0, 变化: 0, 未变化: 0 }
  );
  const differenceCount = counts.新增 + counts.移除 + counts.变化;
  const visibleDiffs = diffs.filter((item) => {
    if (!showUnchanged && item.change === "未变化") return false;
    if (filter === "全部差异") return showUnchanged || item.change !== "未变化";
    return item.change === filter;
  });

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const filters: Array<{ key: DiffFilter; label: string; count: number }> = [
    { key: "全部差异", label: "全部差异", count: differenceCount },
    { key: "新增", label: "新增", count: counts.新增 },
    { key: "移除", label: "移除", count: counts.移除 },
    { key: "变化", label: "有变化", count: counts.变化 },
  ];

  const handleBaselineChange = (versionId: string) => {
    setBaselineVersionId(versionId);
    if (versionId === targetVersionId) {
      setTargetVersionId(versions.find((version) => version.id !== versionId)?.id ?? versionId);
    }
    setFilter("全部差异");
  };
  const handleTargetChange = (versionId: string) => {
    setTargetVersionId(versionId);
    if (versionId === baselineVersionId) {
      setBaselineVersionId(versions.find((version) => version.id !== versionId)?.id ?? versionId);
    }
    setFilter("全部差异");
  };

  if (!baselineVersion || !targetVersion) return null;

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label="版本对比"
      className="flex max-h-[min(680px,calc(100vh-4.5rem))] w-full flex-col overflow-hidden bg-slate-50"
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-2.5">
        <div className="flex items-center gap-2">
          <GitCompareArrows className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-semibold text-slate-950">版本对比</h1>
          <span className="text-xs text-slate-400">仅展示差异项</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="关闭版本对比"
          onClick={onClose}
          className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="shrink-0 border-b border-slate-200 bg-slate-100/70 px-5 py-2">
        <div className="grid grid-cols-[minmax(0,1fr)_36px_minmax(0,1fr)] items-end gap-2.5">
          <VersionSelect
            label="基准版本"
            value={baselineVersion.id}
            versions={versions}
            disabledVersionId={targetVersion.id}
            onChange={handleBaselineChange}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="交换对比版本"
            title="交换对比版本"
            onClick={() => {
              setBaselineVersionId(targetVersion.id);
              setTargetVersionId(baselineVersion.id);
            }}
            className="h-9 w-9 rounded-lg border-blue-200 bg-white text-blue-600 hover:border-blue-300 hover:bg-blue-50"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <VersionSelect
            label="对照版本"
            value={targetVersion.id}
            versions={versions}
            disabledVersionId={baselineVersion.id}
            onChange={handleTargetChange}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-2.5 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <span className="mr-1 text-sm font-semibold text-slate-900">共 {differenceCount} 处差异</span>
            {filters.slice(1).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setFilter(filter === option.key ? "全部差异" : option.key)}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors",
                  filter === option.key
                    ? option.key === "新增"
                      ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                      : option.key === "移除"
                        ? "border-rose-300 bg-rose-100 text-rose-700"
                        : "border-amber-300 bg-amber-100 text-amber-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                {option.label} {option.count}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={showUnchanged}
              onClick={() => setShowUnchanged((value) => !value)}
              className={cn(
                "ml-auto inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs font-medium",
                showUnchanged
                  ? "border-slate-400 bg-slate-100 text-slate-700"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              )}
            >
              {showUnchanged ? <Check className="h-3.5 w-3.5" /> : <Equal className="h-3.5 w-3.5" />}
              {showUnchanged ? "隐藏未变化" : `未变化 ${counts.未变化}`}
            </button>
          </div>

          {visibleDiffs.length ? (
            <div className="space-y-2.5">
              {visibleDiffs.map((item) => {
                const style = CHANGE_STYLES[item.change];
                return (
                  <article
                    key={item.id}
                    className={cn("rounded-xl border border-slate-200 border-l-4 bg-white px-4 py-3.5 shadow-sm", style.rail)}
                  >
                    <div className="flex min-h-8 min-w-0 flex-nowrap items-center gap-2">
                      <ChangeBadge change={item.change} />
                      <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">分类：{item.resource.category}</span>
                      <h2 className="ml-auto min-w-0 truncate text-right text-sm font-semibold text-slate-950">{item.resource.name}</h2>
                    </div>
                    <ResourceDiffDetails item={item} />
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <Equal className="mx-auto h-7 w-7 text-slate-300" />
              <h2 className="mt-2 text-sm font-semibold text-slate-800">当前筛选条件下没有差异</h2>
              <p className="mt-1 text-xs text-slate-500">可切换版本或查看未变化内容。</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}