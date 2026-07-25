"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Settings2 } from "lucide-react";
import { toast } from "sonner";
import SkillsPage from "@/app/(dashboard)/skills/page";
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

function MineSkillsWorkbench() {
  const [skills, setSkills] = useState<MineSkillItem[]>(INITIAL_MINE_SKILLS);
  const [originFilter, setOriginFilter] = useState<MineSkillOriginFilter>("all");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpInput, setJumpInput] = useState("1");

  const filteredSkills = useMemo(
    () => filterMineSkills(skills, { query, origin: originFilter }),
    [skills, query, originFilter]
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
    if (skill.origin === "builtin") {
      toast.info("内置技能暂不支持删除。");
      return;
    }
    setSkills((current) => current.filter((item) => item.id !== skill.id));
    toast.success(`已删除「${skill.name}」`);
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

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-5 md:px-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[20px] font-medium leading-8 tracking-normal text-[#0f172a]">
            我的技能
          </h2>
          <p className="mt-1 text-sm text-[#5a6779]">
            管理已启用技能，按来源筛选并配置个人能力包。
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
        <div className="relative w-full min-w-0 lg:max-w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索技能名称或描述"
            className="h-8 rounded border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-none focus-visible:border-[#2773ff]/40 focus-visible:ring-[#dbe7f4]"
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <Table className="min-w-[880px]">
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200 hover:bg-slate-50">
                <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">
                  名称
                </TableHead>
                <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">
                  来源
                </TableHead>
                <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">
                  启用
                </TableHead>
                <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">
                  描述
                </TableHead>
                <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow className="border-0 hover:bg-transparent">
                  <TableCell colSpan={5} className="px-6 py-16 text-center">
                    <div className="mx-auto max-w-md space-y-3">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-400">
                        <Search className="h-5 w-5" />
                      </div>
                      <div className="text-base font-semibold text-slate-900">暂无匹配结果</div>
                      <p className="text-sm leading-6 text-slate-500">
                        没有匹配的技能，试试换个来源或关键词。
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
                      {skill.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">
                      {getMineSkillOriginLabel(skill.origin)}
                    </TableCell>
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
                    <TableCell className="px-4 py-3 align-middle">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
      </section>
    </div>
  );
}

export function MyClawSkillsHub() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8f9fb]">
      <Tabs defaultValue="mine" className="flex h-full min-h-0 flex-col gap-0">
        <div className="shrink-0 border-b border-slate-200/80 bg-white/90 px-4 pt-3 md:px-6">
          <TabsList className="h-auto w-fit gap-1 rounded-none bg-transparent p-0">
            <TabsTrigger
              value="mine"
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-[#5a6779] shadow-none data-[state=active]:border-[#2773ff] data-[state=active]:bg-transparent data-[state=active]:text-[#2773ff] data-[state=active]:shadow-none"
            >
              我的技能
            </TabsTrigger>
            <TabsTrigger
              value="plaza"
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-[#5a6779] shadow-none data-[state=active]:border-[#2773ff] data-[state=active]:bg-transparent data-[state=active]:text-[#2773ff] data-[state=active]:shadow-none"
            >
              技能广场
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="mine" className="mt-0 min-h-0 flex-1 overflow-y-auto">
          <MineSkillsWorkbench />
        </TabsContent>

        <TabsContent
          value="plaza"
          className="mt-0 min-h-0 flex-1 overflow-y-auto bg-[#e8f0fb] px-4 py-4 md:px-6"
        >
          <SkillsPage moduleView="hub" embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
