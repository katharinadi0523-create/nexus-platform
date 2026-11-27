"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { WorkOrderType } from "./types";

/** 为 false 时仅隐藏侧栏 UI，保留组件供后续展开 */
export const SKILL_EMBEDDED_CLAW_HISTORY_VISIBLE = false;

export type SkillEmbeddedClawHistoryItem = {
  id: string;
  title: string;
};

function defaultHistory(mode: WorkOrderType, skillName?: string): SkillEmbeddedClawHistoryItem[] {
  const skillLabel = skillName?.trim() || "当前技能";
  if (mode === "create") {
    return [
      { id: "current", title: "新技能 · 当前对话" },
      { id: "h-create-1", title: "GFF 基因注释解析 Skill" },
      { id: "h-create-2", title: "水稻 RNA 表达分析" },
      { id: "h-create-3", title: "AB1 峰图读取（失败重试）" },
    ];
  }
  return [
    { id: "current", title: `${skillLabel} · 当前对话` },
    { id: "h-edit-1", title: "缺表头 CSV 健壮性优化" },
    { id: "h-edit-2", title: "补充异常用例与单测" },
    { id: "h-edit-3", title: "依赖版本对齐 v1.2" },
  ];
}

export function SkillEmbeddedClawHistory({
  mode,
  skillName,
  activeId = "current",
  onSelect,
}: {
  mode: WorkOrderType;
  skillName?: string;
  activeId?: string;
  onSelect?: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const items = useMemo(() => defaultHistory(mode, skillName), [mode, skillName]);
  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((item) => item.title.toLowerCase().includes(q))
    : items;

  return (
    <aside
      className="flex w-[248px] shrink-0 flex-col border-r border-slate-200 bg-white"
      aria-label="对话历史"
    >
      <div className="border-b border-slate-100 px-3 py-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索对话名称"
          aria-label="搜索对话名称"
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="px-3 pb-2 pt-3 text-xs font-medium text-slate-400">历史会话</div>
      <ul className="min-h-0 flex-1 list-none overflow-y-auto px-2 pb-3">
        {filtered.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect?.(item.id)}
              className={cn(
                "mb-0.5 w-full truncate rounded-lg px-3 py-2.5 text-left text-[13px]",
                activeId === item.id
                  ? "bg-slate-100 font-semibold text-slate-900"
                  : "text-slate-700 hover:bg-slate-50",
              )}
            >
              {item.title}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}