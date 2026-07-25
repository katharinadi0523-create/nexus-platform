"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Boxes,
  ChartColumn,
  Clock3,
  Code2,
  Globe2,
  Plus,
  Search,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  filterPluginMarketplaceItems,
  getPluginMarketplaceCategoryLabel,
  getPluginMarketplaceKindLabel,
  PLUGIN_MARKETPLACE_CATEGORY_FILTERS,
  PLUGIN_MARKETPLACE_ITEMS,
  PLUGIN_MARKETPLACE_SOURCE_FILTERS,
  type MinePluginItem,
  type PluginMarketCategory,
  type PluginMarketplaceItem,
  type PluginMarketSourceFilter,
  type PluginMarketTone,
  type PluginToolKind,
} from "@/lib/mock/my-claw/plugins";
import { cn } from "@/lib/utils";

const PLUGINS_PLAZA_CARD_CLASS =
  "rounded border border-[#e2e8f0] bg-[#ffffff] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-16px_rgba(39,115,255,0.14)]";

const ICON_MAP: Record<string, LucideIcon> = {
  tool: Wrench,
  boxes: Boxes,
  "chart-bars": ChartColumn,
  book: BookOpen,
  code: Code2,
  spark: Sparkles,
  globe: Globe2,
  clock: Clock3,
};

const TONE_CLASS: Record<PluginMarketTone, string> = {
  orange: "bg-[#fff7ed] text-[#ea580c]",
  cyan: "bg-[#ecfeff] text-[#0891b2]",
  indigo: "bg-[#eef2ff] text-[#4338ca]",
  violet: "bg-[#f5f3ff] text-[#7c3aed]",
  blue: "bg-[#eff6ff] text-[#2773ff]",
};

function isMarketplaceItemInMine(plugins: MinePluginItem[], marketId: string) {
  return plugins.some(
    (plugin) => plugin.marketplaceId === marketId || plugin.id === marketId
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium transition",
        active
          ? "bg-[#2773ff] text-white shadow-sm"
          : "border border-[#dbeafe] bg-white text-[#5a6779] hover:border-[#93c5fd] hover:text-[#2773ff]"
      )}
    >
      {children}
    </button>
  );
}

export interface PluginsPlazaProps {
  plugins: MinePluginItem[];
  onAddToMine: (item: PluginMarketplaceItem) => { kind: PluginToolKind };
}

export function PluginsPlaza({ plugins, onAddToMine }: PluginsPlazaProps) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<PluginMarketSourceFilter>("all");
  const [category, setCategory] = useState<PluginMarketCategory>("all");

  const items = useMemo(
    () =>
      filterPluginMarketplaceItems(PLUGIN_MARKETPLACE_ITEMS, {
        query,
        source,
        category,
      }),
    [query, source, category]
  );

  const handleAdd = (item: PluginMarketplaceItem) => {
    const wasInMine = isMarketplaceItemInMine(plugins, item.id);
    onAddToMine(item);
    toast.success(
      wasInMine
        ? `已更新「${item.name}」到我的插件`
        : `已添加「${item.name}」到我的插件`
    );
  };

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{
        background:
          "linear-gradient(180deg, #f2f7fd 0%, #e8f0fb 38%, #e4edf8 100%)",
      }}
    >
      <div className="skills-plaza-canvas flex-1 overflow-y-auto !min-h-0 px-4 py-5 md:px-6">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="skills-plaza-gradient-title inline-block text-[26px] font-semibold leading-tight">
              插件广场
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#5a6779]">
              按来源与类型浏览可复用组件，一键添加到我的插件。
            </p>
          </div>

          <label className="relative flex w-full min-w-[220px] max-w-[320px] items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#2773ff]" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索插件名称、作者或描述"
              autoComplete="off"
              className="h-10 rounded-xl border-[#dbeafe] bg-white pl-9 shadow-sm"
            />
          </label>
        </header>

        <nav
          className="mt-6 rounded-xl border border-[#dbeafe] bg-white p-2.5 shadow-sm"
          aria-label="来源范围"
        >
          <div className="flex flex-wrap gap-2">
            {PLUGIN_MARKETPLACE_SOURCE_FILTERS.map((tab) => (
              <FilterChip
                key={tab.value}
                active={source === tab.value}
                onClick={() => setSource(tab.value)}
              >
                {tab.label}
              </FilterChip>
            ))}
          </div>
        </nav>

        <nav
          className="mt-4 rounded-xl border border-[#dbeafe] bg-[rgba(219,234,254,0.55)] p-2"
          aria-label="插件类型"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {PLUGIN_MARKETPLACE_CATEGORY_FILTERS.map((tab) => (
              <FilterChip
                key={tab.value}
                active={category === tab.value}
                onClick={() => setCategory(tab.value)}
              >
                {tab.label}
              </FilterChip>
            ))}
          </div>
        </nav>

        {items.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-[#c7d7ef] bg-white/70 px-6 py-16 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <div className="mt-3 text-base font-semibold text-slate-900">
              暂无匹配组件
            </div>
            <p className="mt-1 text-sm text-[#5a6779]">
              试试调整来源、类型或搜索关键词。
            </p>
          </div>
        ) : (
          <section
            className="mt-6 grid auto-rows-fr grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-label="插件列表"
          >
            {items.map((item, index) => {
              const Icon = ICON_MAP[item.icon] ?? Wrench;
              const inMine = isMarketplaceItemInMine(plugins, item.id);
              return (
                <article
                  key={item.id}
                  className={cn(
                    "group relative flex h-full min-h-[212px] w-full flex-col overflow-hidden p-5 text-left",
                    PLUGINS_PLAZA_CARD_CLASS
                  )}
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 gap-3">
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                            TONE_CLASS[item.tone]
                          )}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex w-fit max-w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <h3 className="min-w-0 shrink truncate text-base font-semibold leading-normal text-[#1e293b]">
                              {item.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "inline-flex h-6 shrink-0 items-center rounded-sm border px-1.5 text-[11px] font-semibold leading-none",
                                item.kind === "mcp"
                                  ? "border-[#bfdbfe] bg-[#eff6ff] text-[#2773ff]"
                                  : "border-[#dbe7f4] bg-[#f8f9fb] text-[#2f5fbf]"
                              )}
                            >
                              {getPluginMarketplaceKindLabel(item.kind)}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] leading-5 text-[#6e7b8d]">
                            <span
                              className={cn(
                                "font-medium",
                                item.source === "organization"
                                  ? "text-[#334155]"
                                  : "text-[#2773ff]"
                              )}
                            >
                              {item.author}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-3 min-h-[66px] text-sm leading-[22px] text-[#6e7b8d]">
                      {item.description || "暂无描述"}
                    </p>

                    <div className="mt-auto border-t border-[#e2e8f0] pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex shrink-0 items-center rounded border border-transparent bg-[#f1f5f9] px-2 py-1 text-[12px] text-[#475569]">
                          {getPluginMarketplaceCategoryLabel(item.category)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdd(item)}
                          className={cn(
                            "inline-flex h-8 items-center gap-1 rounded-full px-3 text-sm font-medium transition",
                            inMine
                              ? "border border-[#dbeafe] bg-[#e8f0fb] text-[#2773ff]"
                              : "bg-[#2773ff] text-white hover:bg-[#1f63e6]"
                          )}
                          aria-label={
                            inMine ? `更新「${item.name}」` : `添加「${item.name}」`
                          }
                          title={inMine ? "已在我的插件，点击可更新" : "添加到我的插件"}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {inMine ? "已添加" : "添加"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
