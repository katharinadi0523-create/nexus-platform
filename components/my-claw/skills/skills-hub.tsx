"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Grid2X2, List, Plus, RefreshCw, Search, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { SkillsPage } from "@/components/skills/skills-page";
import { ResourceViewSwitch } from "@/components/my-claw/resource-view-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  filterMineSkills,
  getMineSkillOriginLabel,
  INITIAL_MINE_SKILLS,
  MINE_SKILL_ORIGIN_TABS,
  type MineSkillItem,
  type MineSkillOriginFilter,
} from "@/lib/mock/my-claw/skills-mine";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

function getVisiblePageIndices(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5];
  }
  if (currentPage >= totalPages - 2) {
    return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
}

function shouldShowEllipsis(page: number, previous?: number) {
  return previous !== undefined && page - previous > 1;
}

function MineSkillsWorkbench({
  personalWorkspace = false,
  capabilityWorkspace = false,
  viewSwitcher,
  onAddSkill,
}: {
  personalWorkspace?: boolean;
  capabilityWorkspace?: boolean;
  viewSwitcher?: ReactNode;
  onAddSkill?: () => void;
}) {
  const [skills, setSkills] = useState<MineSkillItem[]>(INITIAL_MINE_SKILLS);
  const [originFilter, setOriginFilter] = useState<MineSkillOriginFilter>("all");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpInput, setJumpInput] = useState("1");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const filteredSkills = useMemo(
    () =>
      filterMineSkills(skills, {
        query,
        origin: personalWorkspace ? "all" : originFilter,
      }).sort((left, right) =>
        personalWorkspace
          ? Number(right.origin === "builtin") - Number(left.origin === "builtin")
          : 0,
      ),
    [skills, query, originFilter, personalWorkspace]
  );

  const total = filteredSkills.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = filteredSkills.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
    setJumpInput("1");
  }, [query, originFilter, pageSize]);

  useEffect(() => {
    setJumpInput(String(safePage));
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const handleToggle = (id: string, enabled: boolean) => {
    setSkills((current) =>
      current.map((skill) => (skill.id === id ? { ...skill, enabled } : skill))
    );
    const target = skills.find((skill) => skill.id === id);
    if (target) {
      toast.success(enabled ? `已启用「${target.name}」` : `已停用「${target.name}」`);
    }
  };

  const handleDelete = (skill: MineSkillItem) => {
    if (skill.origin === "builtin" && !capabilityWorkspace) {
      toast.info("内置技能暂不支持删除。");
      return;
    }
    setSkills((current) => current.filter((item) => item.id !== skill.id));
    toast.success(capabilityWorkspace ? `已从我的技能移除「${skill.name}」` : `已删除「${skill.name}」`);
  };

  const handleConfig = (skill: MineSkillItem) => {
    toast.info(`「${skill.name}」配置能力即将接入`);
  };

  const applyJump = () => {
    const next = Number(jumpInput);
    if (!Number.isFinite(next)) {
      setJumpInput(String(safePage));
      return;
    }
    setCurrentPage(Math.min(totalPages, Math.max(1, Math.floor(next))));
  };

  const visiblePages = getVisiblePageIndices(safePage, totalPages);
  const enableAll = () => {
    const ids = new Set(filteredSkills.map((skill) => skill.id));
    const count = filteredSkills.filter((skill) => !skill.enabled).length;
    setSkills((current) => current.map((skill) => ids.has(skill.id) ? { ...skill, enabled: true } : skill));
    toast.success(count ? `已启用 ${count} 个技能` : "当前技能均已启用");
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-5 md:px-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[20px] font-medium leading-8 tracking-normal text-[#0f172a]">
            {viewSwitcher ?? "我的技能"}
          </h2>
          <p className="mt-1 text-sm text-[#5a6779]">
            {personalWorkspace
              ? "管理已添加技能，可启用、停用或移除。"
              : "管理已启用技能，按来源筛选并配置个人能力包。"}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {!personalWorkspace ? (
          <div className="-mb-px flex flex-wrap gap-5 border-b border-slate-200">
            {MINE_SKILL_ORIGIN_TABS.map((tab) => {
              const active = originFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setOriginFilter(tab.value)}
                  className={cn(
                    "pb-2.5 text-[13px] transition-colors duration-100",
                    active
                      ? "border-b-2 border-[#2773ff] font-semibold text-[#2773ff]"
                      : "border-b-2 border-transparent font-medium text-[#5a6779] hover:text-[#334155]"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : capabilityWorkspace ? <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full min-w-[220px] sm:w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索技能名称" className="h-8 rounded border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-none" />
          </div>
          <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded border-slate-200" aria-label="刷新技能列表" title="刷新" onClick={() => { setCurrentPage(1); toast.success("技能列表已刷新"); }}><RefreshCw className="h-4 w-4" /></Button>
        </div> : <div />}
        {!capabilityWorkspace ? <div className={cn("relative w-full min-w-0 lg:max-w-[320px]", personalWorkspace && "lg:ml-auto")}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索技能名称或描述"
            className="h-8 rounded border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-none focus-visible:border-[#2773ff]/40 focus-visible:ring-[#dbe7f4]"
          />
        </div> : null}
        {capabilityWorkspace ? <div className="flex shrink-0 items-center gap-2">
          <div className="inline-flex h-8 items-center rounded border border-slate-200 bg-white p-0.5">
            <Button type="button" variant="ghost" size="icon" aria-label="表格展示" title="表格展示" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")} className={cn("h-7 w-7 rounded-sm", viewMode === "list" && "bg-blue-50 text-blue-600")}><List className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label="卡片展示" title="卡片展示" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")} className={cn("h-7 w-7 rounded-sm", viewMode === "grid" && "bg-blue-50 text-blue-600")}><Grid2X2 className="h-4 w-4" /></Button>
          </div>
          <Button type="button" variant="outline" className="h-8 rounded border-slate-200 px-3 text-sm" onClick={enableAll}>一键启用</Button>
          <Button type="button" className="h-8 rounded bg-[#2773ff] px-3 text-sm text-white hover:bg-blue-700" onClick={onAddSkill}><Plus className="mr-1 h-4 w-4" />添加技能</Button>
        </div> : null}
      </div>

      {capabilityWorkspace && viewMode === "grid" ? <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {pageRows.map((skill) => <article key={skill.id} className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 font-medium text-slate-900">{skill.name}{skill.origin === "builtin" ? <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">系统</span> : null}</h3><p className="mt-1 text-xs text-slate-400">{skill.creator}</p></div><Switch checked={skill.enabled} onCheckedChange={(checked) => handleToggle(skill.id, checked)} aria-label={`${skill.name} 启用开关`} /></div>
          <p className="mt-3 line-clamp-3 min-h-[60px] text-sm leading-5 text-slate-600">{skill.description}</p>
          <div className="mt-4 flex gap-3 border-t border-slate-100 pt-3"><button type="button" onClick={() => toast.info(skill.description)} className="text-sm font-medium text-blue-600">查看</button><button type="button" onClick={() => handleDelete(skill)} className="text-sm font-medium text-blue-600">移除</button></div>
        </article>)}
      </div> : <section className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <Table className="min-w-[880px]">
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200 hover:bg-slate-50">
                <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">
                  名称
                </TableHead>
                {!personalWorkspace ? (
                  <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">
                    来源
                  </TableHead>
                ) : null}
                <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">
                  {capabilityWorkspace ? "启用状态" : "启用"}
                </TableHead>
                <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">
                  描述
                </TableHead>
                {capabilityWorkspace ? <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">创建人</TableHead> : null}
                <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow className="border-0 hover:bg-transparent">
                  <TableCell colSpan={personalWorkspace ? (capabilityWorkspace ? 5 : 4) : 5} className="px-6 py-16 text-center">
                    <div className="mx-auto max-w-md space-y-3">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-400">
                        <Search className="h-5 w-5" />
                      </div>
                      <div className="text-base font-semibold text-slate-900">暂无匹配结果</div>
                      <p className="text-sm leading-6 text-slate-500">
                        {personalWorkspace
                          ? "没有匹配的技能，试试调整关键词。"
                          : "没有匹配的技能，试试换个来源或关键词。"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((skill, rowIndex) => (
                  <TableRow
                    key={skill.id}
                    className={cn(
                      "border-slate-200 transition-colors duration-100 hover:bg-slate-50",
                      rowIndex % 2 === 1 && "bg-slate-50/60"
                    )}
                  >
                    <TableCell className="px-4 py-3 align-middle text-sm font-medium text-slate-900">
                      <span className="inline-flex items-center gap-2">
                        {skill.name}
                        {personalWorkspace && skill.origin === "builtin" ? (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                            系统
                          </span>
                        ) : null}
                      </span>
                    </TableCell>
                    {!personalWorkspace ? (
                      <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">
                        {getMineSkillOriginLabel(skill.origin)}
                      </TableCell>
                    ) : null}
                    <TableCell className="px-4 py-3 align-middle">
                      <Switch
                        checked={skill.enabled}
                        onCheckedChange={(checked) => handleToggle(skill.id, checked)}
                        aria-label={`${skill.name} 启用开关`}
                        className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200"
                      />
                    </TableCell>
                    <TableCell className="max-w-[420px] px-4 py-3 align-middle text-sm leading-6 text-slate-600">
                      <p className="line-clamp-2">{skill.description}</p>
                    </TableCell>
                    {capabilityWorkspace ? <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">{skill.creator}</TableCell> : null}
                    <TableCell className="px-4 py-3 align-middle">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {capabilityWorkspace ? <button type="button" onClick={() => toast.info(skill.description)} className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">查看</button> : null}
                        {capabilityWorkspace ? <button type="button" onClick={() => handleDelete(skill)} className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">移除</button> : null}
                        {!capabilityWorkspace ? <>
                        <button
                          type="button"
                          onClick={() => handleConfig(skill)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                          配置
                        </button>
                        {skill.origin !== "builtin" ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(skill)}
                            className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                          >
                            删除
                          </button>
                        ) : null}
                        </> : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {total > 0 ? (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-end">
            <span className="lg:mr-3">共{total}条</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-[4px] text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                aria-label="上一页"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {visiblePages.map((page, index) => (
                <span key={page} className="inline-flex items-center gap-1.5">
                  {shouldShowEllipsis(page, visiblePages[index - 1]) ? (
                    <span className="px-2 text-slate-400">...</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "h-8 min-w-8 rounded-[4px] px-2 text-sm font-medium transition-colors",
                      page === safePage
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                    )}
                  >
                    {page}
                  </button>
                </span>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-[4px] text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                aria-label="下一页"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <select
              value={String(pageSize)}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="h-8 w-[92px] rounded-[4px] border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-300"
              aria-label="每页条数"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}条/页
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-slate-500">前往</span>
              <Input
                value={jumpInput}
                onChange={(event) => setJumpInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyJump();
                  }
                }}
                className="h-8 w-10 rounded-[4px] border-slate-200 px-2 text-center shadow-none"
                aria-label="跳转页码"
              />
              <span className="text-slate-500">页</span>
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-[4px] border-slate-200 px-3 text-sm shadow-none"
                onClick={applyJump}
              >
                确定
              </Button>
            </div>
          </div>
        ) : null}
      </section>}
      {capabilityWorkspace && viewMode === "grid" && total > pageSize ? <div className="mt-3 flex items-center justify-end gap-2 text-sm text-slate-600">
        <span className="mr-2">共{total}条</span>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label="上一页" disabled={safePage <= 1} onClick={() => setCurrentPage(Math.max(1, safePage - 1))}><ChevronLeft className="h-4 w-4" /></Button>
        <span>{safePage}/{totalPages}</span>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label="下一页" disabled={safePage >= totalPages} onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}><ChevronRight className="h-4 w-4" /></Button>
      </div> : null}
    </div>
  );
}

export function MyClawSkillsHub({
  personalWorkspace = false,
  capabilityWorkspace = false,
  hideViewTabs = false,
  activeView: controlledActiveView,
  onActiveViewChange,
}: {
  personalWorkspace?: boolean;
  capabilityWorkspace?: boolean;
  hideViewTabs?: boolean;
  activeView?: "mine" | "plaza";
  onActiveViewChange?: (view: "mine" | "plaza") => void;
} = {}) {
  const tabs = personalWorkspace
    ? [
        { value: "plaza", label: "技能广场" },
        { value: "mine", label: "我的技能" },
      ]
    : [
        { value: "mine", label: "我的技能" },
        { value: "plaza", label: "技能广场" },
      ];
  const [localActiveView, setLocalActiveView] = useState<"mine" | "plaza">(
    personalWorkspace ? "plaza" : "mine",
  );
  const activeView = controlledActiveView ?? localActiveView;
  const handleActiveViewChange = (value: string) => {
    const nextView = value === "plaza" ? "plaza" : "mine";
    setLocalActiveView(nextView);
    onActiveViewChange?.(nextView);
  };
  const viewSwitcher = capabilityWorkspace && !hideViewTabs ? (
    <ResourceViewSwitch
      activeView={activeView}
      onChange={handleActiveViewChange}
      plazaLabel="技能广场"
      mineLabel="我的技能"
    />
  ) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8f9fb]">
      <Tabs
        value={activeView}
        onValueChange={handleActiveViewChange}
        className="flex h-full min-h-0 flex-col gap-0"
      >
        {!hideViewTabs && !capabilityWorkspace ? (
          <div
            className={cn(
              "shrink-0 border-b border-slate-200/80 bg-white/90 px-4 pt-3 md:px-6",
              personalWorkspace && "bg-[#f8fafc] px-4 pt-0 md:px-6"
            )}
          >
            <TabsList
              aria-label="技能视图"
              className={cn(
                "h-auto w-fit gap-1 rounded-none bg-transparent p-0",
                personalWorkspace && "h-11"
              )}
            >
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-[#5a6779] shadow-none data-[state=active]:border-[#2773ff] data-[state=active]:bg-transparent data-[state=active]:text-[#2773ff] data-[state=active]:shadow-none",
                    personalWorkspace && "px-3 py-2 text-[13px]"
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        ) : null}

        <TabsContent value="mine" className="mt-0 min-h-0 flex-1 overflow-y-auto">
          <MineSkillsWorkbench
            personalWorkspace={personalWorkspace}
            capabilityWorkspace={capabilityWorkspace}
            onAddSkill={() => handleActiveViewChange("plaza")}
            viewSwitcher={viewSwitcher}
          />
        </TabsContent>

        <TabsContent
          value="plaza"
          className={cn(
            "mt-0 min-h-0 flex-1 overflow-y-auto bg-[#e8f0fb] px-4 py-4 md:px-6",
            capabilityWorkspace && "bg-[#f8fafc] px-5 py-4 md:px-8"
          )}
        >
          <SkillsPage
            moduleView="hub"
            embedded
            capabilityWorkspace={capabilityWorkspace}
            viewSwitcher={viewSwitcher}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
