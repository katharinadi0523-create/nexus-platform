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
  ChevronDown,
  SlidersHorizontal,
  Sparkles,
  Wrench,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  filterPluginMarketplaceItems,
  getPluginMarketplaceCategoryLabel,
  getPluginMarketplaceKindLabel,
  PLUGIN_MARKETPLACE_CATEGORY_FILTERS,
  PLUGIN_MARKETPLACE_ORGANIZATION_FILTERS,
  PLUGIN_MARKETPLACE_ITEMS,
  PLUGIN_MARKETPLACE_SOURCE_FILTERS,
  type MinePluginItem,
  type PluginMarketCategory,
  type PluginMarketOrganizationScope,
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
  personalWorkspace?: boolean;
  capabilityWorkspace?: boolean;
  viewSwitcher?: ReactNode;
  onOpenManagement?: () => void;
  managementCount?: number;
  onCreateCustom?: (kind: "mcp" | "plugin") => void;
}

export function PluginsPlaza({
  plugins,
  onAddToMine,
  personalWorkspace = false,
  capabilityWorkspace = false,
  viewSwitcher,
  onOpenManagement,
  managementCount,
  onCreateCustom,
}: PluginsPlazaProps) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<PluginMarketSourceFilter>("all");
  const [organizationScope, setOrganizationScope] =
    useState<PluginMarketOrganizationScope>("all");
  const [category, setCategory] = useState<PluginMarketCategory>("all");
  const [detailTarget, setDetailTarget] = useState<PluginMarketplaceItem | null>(null);
  const [connectTarget, setConnectTarget] = useState<PluginMarketplaceItem | null>(null);

  const items = useMemo(
    () =>
      filterPluginMarketplaceItems(PLUGIN_MARKETPLACE_ITEMS, {
        query,
        source,
        organizationScope,
        category,
        includeKindInSearch: !personalWorkspace,
      }),
    [query, source, organizationScope, category, personalWorkspace]
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

  const handlePresetConnect = (item: PluginMarketplaceItem) => {
    onAddToMine(item);
    toast.success(`已连接并启用「${item.name}」`);
    setConnectTarget(null);
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col",
        personalWorkspace && "bg-[#f8fafc]"
      )}
      style={personalWorkspace ? undefined : {
        background:
          "linear-gradient(180deg, #f2f7fd 0%, #e8f0fb 38%, #e4edf8 100%)",
      }}
    >
      <div
        className={cn(
          "skills-plaza-canvas flex-1 overflow-y-auto !min-h-0 px-4 py-5 md:px-6",
          personalWorkspace && "bg-[#f8fafc] !px-5 py-5 md:!px-8"
        )}
      >
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1
              className={cn(
                "skills-plaza-gradient-title inline-block text-[26px] font-semibold leading-tight",
                personalWorkspace && "text-[22px] tracking-normal text-slate-900"
              )}
              style={personalWorkspace ? { backgroundImage: "none", WebkitTextFillColor: "currentColor", color: "#0f172a" } : undefined}
            >
              {viewSwitcher ?? "插件广场"}
            </h1>
            <p className={cn("mt-2 text-sm leading-6 text-[#5a6779]", personalWorkspace && "mt-1 text-[13px] leading-5 text-slate-500")}>
              {personalWorkspace
                ? capabilityWorkspace
                  ? "按类别浏览可用插件；已添加的插件可在插件管理中启停，内置插件不支持移除。"
                  : "按类别浏览可用插件，添加后在“我的插件”中管理。"
                : "按来源与类型浏览可复用组件，一键添加到我的插件。"}
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
            <label className="relative flex w-full min-w-[220px] max-w-[320px] items-center lg:w-[280px]">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#2773ff]" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索插件名称、作者或描述"
                autoComplete="off"
                className={cn(
                  "h-10 rounded-xl border-[#dbeafe] bg-white pl-9 shadow-sm",
                  personalWorkspace && "h-9 rounded-md border-slate-200 text-[13px] shadow-none"
                )}
              />
            </label>
          {personalWorkspace && capabilityWorkspace ? (
            <>
              <Button variant="outline" className="h-9 shrink-0 rounded-md border-slate-200 bg-white px-3 text-[13px]" onClick={onOpenManagement}>
                <SlidersHorizontal className="mr-1.5 size-4" />我的插件（{managementCount ?? 0}）
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-9 shrink-0 rounded-md bg-[#2773ff] px-3 text-[13px] text-white hover:bg-blue-700"><Plus className="mr-1 size-4" />自定义插件<ChevronDown className="ml-1 size-3.5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onSelect={() => onCreateCustom?.("mcp")}>MCP 服务</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onCreateCustom?.("plugin")}>OpenAPI 插件</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}
          </div>
        </header>

        {personalWorkspace && capabilityWorkspace ? (
          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav className="flex flex-wrap items-center gap-1" aria-label="插件来源">
                {PLUGIN_MARKETPLACE_SOURCE_FILTERS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    aria-pressed={source === tab.value}
                    onClick={() => {
                      setSource(tab.value);
                      if (tab.value === "organization") setOrganizationScope("all");
                    }}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-[13px] leading-6 transition-colors",
                      source === tab.value
                        ? "bg-[#eaf2ff] font-medium text-[#2773ff]"
                        : "text-[#334155] hover:text-[#2773ff]"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              {source === "organization" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-8 rounded-md border-slate-200 bg-white px-3 text-[13px] font-normal text-slate-600">
                      {PLUGIN_MARKETPLACE_ORGANIZATION_FILTERS.find((item) => item.value === organizationScope)?.label}
                      <ChevronDown className="ml-2 size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    {PLUGIN_MARKETPLACE_ORGANIZATION_FILTERS.map((item) => (
                      <DropdownMenuItem
                        key={item.value}
                        onSelect={() => setOrganizationScope(item.value)}
                      >
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
            <nav className="flex flex-wrap items-center gap-0.5" aria-label="业务领域筛选">
              <span className="mr-2 shrink-0 text-[12px] text-slate-500">业务领域</span>
              {PLUGIN_MARKETPLACE_CATEGORY_FILTERS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={category === tab.value}
                  onClick={() => setCategory(tab.value)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[13px] leading-6 transition-colors",
                    category === tab.value
                      ? "bg-[#eaf2ff] font-medium text-[#2773ff]"
                      : "text-[#334155] hover:text-[#2773ff]"
                  )}
                >
                  {tab.value === "all" ? "全部" : tab.label}
                </button>
              ))}
            </nav>
          </div>
        ) : personalWorkspace ? (
          <div className="mt-4 space-y-2">
            <nav className="flex flex-wrap items-center gap-0.5" aria-label="插件来源筛选">
              {PLUGIN_MARKETPLACE_SOURCE_FILTERS.filter((tab) => tab.value !== "third_party").map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={source === tab.value}
                  onClick={() => setSource(tab.value)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[13px] leading-6 transition-colors",
                    source === tab.value
                      ? "bg-[#eaf2ff] font-medium text-[#2773ff]"
                      : "text-[#334155] hover:text-[#2773ff]"
                  )}
                >
                  {tab.value === "all" ? "全部组织" : "我的组织"}
                </button>
              ))}
            </nav>
            <nav className="flex flex-wrap items-center gap-0.5" aria-label="插件类别筛选">
              {PLUGIN_MARKETPLACE_CATEGORY_FILTERS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={category === tab.value}
                  onClick={() => setCategory(tab.value)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[13px] leading-6 transition-colors",
                    category === tab.value
                      ? "bg-[#eaf2ff] font-medium text-[#2773ff]"
                      : "text-[#334155] hover:text-[#2773ff]"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        ) : (
          <>
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
              aria-label="插件类别"
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
          </>
        )}

        {items.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-[#c7d7ef] bg-white/70 px-6 py-16 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <div className="mt-3 text-base font-semibold text-slate-900">
              暂无匹配组件
            </div>
            <p className="mt-1 text-sm text-[#5a6779]">
              {personalWorkspace
                ? capabilityWorkspace
                  ? "试试调整插件类型、组织范围、类别或搜索关键词。"
                  : "试试调整来源、类别或搜索关键词。"
                : "试试调整来源、类型或搜索关键词。"}
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
                    PLUGINS_PLAZA_CARD_CLASS,
                    personalWorkspace && "min-h-[196px] rounded-xl p-4"
                  )}
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <div className="relative flex h-full flex-col">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setDetailTarget(item)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setDetailTarget(item);
                        }
                      }}
                      aria-label={`查看${item.name}详情`}
                      className="flex w-full flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2773ff] focus-visible:ring-offset-2"
                    >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 gap-3">
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5",
                            TONE_CLASS[item.tone]
                          )}
                        >
                          {item.logoUrl ? (
                            <img src={item.logoUrl} alt="" className="h-full w-full object-contain" />
                          ) : (
                            <Icon className="h-6 w-6" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex w-fit max-w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <h3 className="min-w-0 shrink truncate text-base font-semibold leading-normal text-[#1e293b]">
                              {item.name}
                            </h3>
                            {!personalWorkspace ? (
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
                            ) : null}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] leading-5 text-[#6e7b8d]">
                            <span
                              className={cn(
                                "font-medium",
                                item.source === "organization"
                                  ? "text-[#6e7b8d]"
                                  : "text-[#2773ff]"
                              )}
                            >
                              {item.source === "organization" ? `@${item.author}` : item.author}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-3 min-h-[66px] text-sm leading-[22px] text-[#6e7b8d]">
                      {item.description || "暂无描述"}
                    </p>

                    <div className="mt-auto flex w-full items-center justify-between pt-3">
                      <span className="inline-flex shrink-0 items-center rounded border border-transparent bg-[#f1f5f9] px-2 py-1 text-[12px] text-[#475569]">
                        {getPluginMarketplaceCategoryLabel(item.category)}
                      </span>
                      <span className="text-xs text-slate-400 transition group-hover:text-[#2773ff]">查看详情</span>
                    </div>
                    </div>

                    <div className="mt-3 border-t border-[#e2e8f0] pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => item.personalCredentialMode || item.oauthPermissions ? setConnectTarget(item) : handleAdd(item)}
                          disabled={inMine}
                          className={cn(
                            "inline-flex h-8 items-center gap-1 rounded-full px-3 text-sm font-medium transition",
                            inMine
                              ? "cursor-default bg-transparent text-emerald-600"
                              : "bg-[#2773ff] text-white hover:bg-[#1f63e6]"
                          )}
                          aria-label={
                            inMine ? `已添加「${item.name}」` : `连接「${item.name}」`
                          }
                          title={inMine ? "已添加" : "连接插件"}
                        >
                          {!inMine ? <Plus className="h-3.5 w-3.5" /> : null}
                          {inMine ? "已添加" : "连接"}
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
      <PluginMarketplaceDetailDialog
        key={`detail:${detailTarget?.id ?? "closed"}`}
        item={detailTarget}
        inMine={detailTarget ? isMarketplaceItemInMine(plugins, detailTarget.id) : false}
        onClose={() => setDetailTarget(null)}
        onConnect={() => {
          if (!detailTarget) return;
          setConnectTarget(detailTarget);
          setDetailTarget(null);
        }}
      />
      <PresetPluginConnectDialog
        key={`connect:${connectTarget?.id ?? "closed"}`}
        item={connectTarget}
        onClose={() => setConnectTarget(null)}
        onConnected={handlePresetConnect}
      />
    </div>
  );
}

function PluginMarketplaceDetailDialog({
  item,
  inMine,
  onClose,
  onConnect,
}: {
  item: PluginMarketplaceItem | null;
  inMine: boolean;
  onClose: () => void;
  onConnect: () => void;
}) {
  const Icon = item ? ICON_MAP[item.icon] ?? Wrench : Wrench;
  const publisher = item
    ? item.source === "organization"
      ? `@${item.author}`
      : item.author
    : "";

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="flex max-h-[86vh] w-[min(800px,calc(100vw-32px))] max-w-none flex-col gap-0 overflow-hidden rounded-xl border-slate-200 p-0 sm:max-w-[800px]">
        {item ? (
          <>
            <DialogHeader className="shrink-0 border-b border-slate-200 px-6 pb-5 pt-6 pr-12">
              <div className="flex items-start gap-4 text-left">
                <div className={cn("grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl", TONE_CLASS[item.tone])}>
                  {item.logoUrl ? <img src={item.logoUrl} alt="" className="h-full w-full bg-white p-1.5 object-contain" /> : <Icon className="size-6" />}
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="break-words text-xl font-semibold text-slate-900">{item.name}</DialogTitle>
                  <DialogDescription className="mt-2 line-clamp-2 text-left text-sm leading-6 text-slate-600">{item.description || "暂无简介"}</DialogDescription>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-4">
                <div><dt className="text-xs text-slate-400">插件类型</dt><dd className="mt-1 font-medium text-slate-800">{getPluginMarketplaceKindLabel(item.kind)}</dd></div>
                <div><dt className="text-xs text-slate-400">业务类型</dt><dd className="mt-1 font-medium text-slate-800">{getPluginMarketplaceCategoryLabel(item.category)}</dd></div>
                <div><dt className="text-xs text-slate-400">发布时间</dt><dd className="mt-1 break-words font-medium text-slate-800">{item.publishedAt ?? "—"}</dd></div>
                <div><dt className="text-xs text-slate-400">发布者</dt><dd className="mt-1 break-words font-medium text-slate-800">{publisher}</dd></div>
              </dl>
            </DialogHeader>

            <div className="min-h-[240px] overflow-y-auto px-6 py-5 sm:max-h-[48vh]">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">工具列表 <span className="ml-1 font-normal text-slate-500">共 {item.presetTools?.length ?? 0} 个</span></h3>
                {item.presetTools?.length ? (
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {item.presetTools.map((tool) => (
                      <li key={tool.name} className="flex items-center gap-3 px-4 py-3">
                        <Wrench className="size-4 shrink-0 text-slate-400" />
                        <p className="break-all text-sm font-medium text-slate-900">{tool.name}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 px-5 py-12 text-center text-sm text-slate-500">暂未提供工具信息</div>
                )}
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-slate-100 px-6 py-4 sm:justify-between">
              {inMine ? <span className="self-center text-sm text-emerald-600">已添加到插件管理</span> : <span />}
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>关闭</Button>
                {!inMine ? <Button onClick={onConnect} className="bg-[#2773ff] text-white hover:bg-blue-700">连接</Button> : null}
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PresetPluginConnectDialog({
  item,
  onClose,
  onConnected,
}: {
  item: PluginMarketplaceItem | null;
  onClose: () => void;
  onConnected: (item: PluginMarketplaceItem) => void;
}) {
  const Icon = item ? ICON_MAP[item.icon] ?? Wrench : Wrench;
  const [credential, setCredential] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [showCredential, setShowCredential] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [oauthStep, setOauthStep] = useState<"intro" | "consent">("intro");

  const close = () => {
    if (connecting) return;
    setCredential("");
    setEndpoint("");
    setShowCredential(false);
    setError("");
    setOauthStep("intro");
    onClose();
  };

  const connect = async () => {
    if (item?.oauthPermissions) {
      if (oauthStep === "intro") {
        setOauthStep("consent");
        return;
      }
      setConnecting(true);
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      setConnecting(false);
      onConnected(item);
      return;
    }
    if (!item || !credential.trim()) {
      setError(`请输入${item?.credentialLabel ?? "服务凭据"}。`);
      return;
    }
    if (item.customEndpointRequired && !endpoint.trim()) {
      setError(`请输入${item.endpointInputLabel ?? "MCP 服务 URL"}。`);
      return;
    }
    setError("");
    setConnecting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    if (/invalid|错误|无效/i.test(credential)) {
      setError("凭据校验失败，请检查后重试。");
      setConnecting(false);
      return;
    }
    setConnecting(false);
    onConnected(item);
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-xl border-slate-200 p-0 sm:max-w-[520px]">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle className="text-lg">{item?.oauthPermissions && oauthStep === "consent" ? `授权${item.name}` : `连接${item?.name ?? "插件"}`}</DialogTitle>
          <DialogDescription className="text-sm leading-5 text-slate-500">
            {item?.oauthPermissions
              ? oauthStep === "consent" ? "确认授权范围后，即可连接该服务。" : "通过服务商账号授权连接。"
              : "填写你在服务商处获取的个人凭据，连接该服务。"}
          </DialogDescription>
        </DialogHeader>
        {item ? (
          <div className="space-y-5 px-6 py-5">
            {item.oauthPermissions && oauthStep === "consent" ? (
              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-100">
                    {item.logoUrl ? <img src={item.logoUrl} alt="" className="size-full object-contain p-1" /> : <Boxes className="size-5 text-indigo-600" />}
                  </span>
                  <div><p className="text-sm font-semibold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">授权访问范围</p></div>
                </div>
                <ul className="space-y-2">
                  {item.oauthPermissions.map((permission) => (
                    <li key={permission} className="flex items-start gap-2 text-sm text-slate-600">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />{permission}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 rounded-md bg-slate-50 px-3 py-2.5 text-xs text-slate-500">授权后，服务商会将授权结果返回 Clawflow。</div>
              </section>
            ) : (
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-100">
                  {item.logoUrl ? <img src={item.logoUrl} alt="" className="size-full object-contain p-1" /> : <Icon className="size-5 text-blue-600" />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{item.description || "暂无简介"}</p>
                </div>
              </div>
              {item.presetTools?.length ? (
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="mb-2 text-xs font-medium text-slate-600">可用工具（{item.presetTools.length}）</p>
                  <ul className="space-y-1.5">
                    {(item.presetTools ?? []).map((tool) => (
                      <li key={tool.name} className="flex items-center gap-2 text-xs text-slate-700">
                        <Wrench className="size-3.5 shrink-0 text-slate-400" />{tool.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
                  暂无工具信息
                </p>
              )}
            </section>
            )}

            {item.customEndpointRequired ? (
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>服务地址<span className="ml-1 text-red-500">*</span></span>
                <Input
                  type="url"
                  value={endpoint}
                  onChange={(event) => { setEndpoint(event.target.value); setError(""); }}
                  placeholder="请输入服务地址"
                  aria-invalid={!!error && !endpoint.trim()}
                  className="h-10"
                  disabled={connecting}
                />
                <span className="block text-xs font-normal text-slate-500">请输入服务商提供的服务地址。</span>
              </label>
            ) : null}

            {!item.oauthPermissions ? <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>{item.credentialLabel ?? "服务凭据"}<span className="ml-1 text-red-500">*</span></span>
              <span className="relative block">
                <Input
                  type={showCredential ? "text" : "password"}
                  value={credential}
                  onChange={(event) => { setCredential(event.target.value); setError(""); }}
                  onKeyDown={(event) => { if (event.key === "Enter") void connect(); }}
                  autoComplete="new-password"
                  placeholder={`请输入${item.credentialLabel ?? "服务凭据"}`}
                  aria-invalid={!!error}
                  className="h-10 pr-10"
                  disabled={connecting}
                />
                <button
                  type="button"
                  aria-label={showCredential ? "隐藏凭据" : "显示凭据"}
                  onClick={() => setShowCredential((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  {showCredential ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
              <span className="block text-xs font-normal text-slate-500">{item.credentialHelp}</span>
            </label> : null}

            {error ? <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          </div>
        ) : null}
        <DialogFooter className="border-t border-slate-100 px-6 py-4 sm:justify-end">
          <Button variant="outline" onClick={() => {
            if (item?.oauthPermissions && oauthStep === "consent") toast.info("已取消授权，插件未添加");
            close();
          }} disabled={connecting}>{item?.oauthPermissions && oauthStep === "consent" ? "取消授权" : "取消"}</Button>
          <Button onClick={() => void connect()} disabled={connecting || !item} className="bg-[#2773ff] text-white hover:bg-blue-700">
            {connecting ? <><LoaderCircle className="mr-2 size-4 animate-spin" />正在连接</> : item?.oauthPermissions ? oauthStep === "intro" ? "前往授权" : "同意并连接" : "连接并启用"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
