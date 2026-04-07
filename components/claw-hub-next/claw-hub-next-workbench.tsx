"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Database,
  Layers3,
  Library,
  Network,
  Plus,
  Puzzle,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  clawHubList,
  tenantSettingSections,
  type ClawHubListItem,
} from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";

const CURRENT_OPERATOR = "RowanDI";

function PublishStatusBadge({ status }: { status: ClawHubListItem["publishStatus"] }) {
  const isPublished = status === "已发布";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-xs font-medium",
        isPublished ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", isPublished ? "bg-emerald-500" : "bg-slate-400")} />
      {status}
    </span>
  );
}

function formatUpdatedInfo(item: Pick<ClawHubListItem, "updatedAt" | "updatedBy">) {
  return `${item.updatedAt} （${item.updatedBy}）`;
}

function formatNow(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ClawHubNextWorkbench() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [claws, setClaws] = useState<ClawHubListItem[]>(clawHubList);
  const deferredKeyword = useDeferredValue(keyword);

  const filteredClaws = useMemo(() => {
    const normalizedKeyword = deferredKeyword.trim().toLowerCase();

    return claws.filter((item) => {
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        item.name.toLowerCase().includes(normalizedKeyword) ||
        item.creator.toLowerCase().includes(normalizedKeyword) ||
        item.updatedBy.toLowerCase().includes(normalizedKeyword) ||
        item.summary.toLowerCase().includes(normalizedKeyword);

      return matchesKeyword;
    });
  }, [claws, deferredKeyword]);

  useEffect(() => {
    filteredClaws.forEach((item) => {
      router.prefetch(`/claw-hub-next/claws/${item.id}`);
    });
  }, [filteredClaws, router]);

  function handleOpenConfig(item: ClawHubListItem) {
    router.push(`/claw-hub-next/claws/${item.id}`);
  }

  function handleRefresh() {
    setClaws(clawHubList);
    toast.success("Claw 列表已刷新。");
  }

  function handlePublish(item: ClawHubListItem) {
    if (item.publishStatus === "已发布") {
      toast.success(`${item.name} 已发布。`);
      return;
    }

    setClaws((current) =>
      current.map((claw) =>
        claw.id === item.id
          ? {
              ...claw,
              status: "运行中",
              publishStatus: "已发布",
              updatedAt: formatNow(),
              updatedBy: CURRENT_OPERATOR,
            }
          : claw
      )
    );
    toast.success(`已发布：${item.name}`);
  }

  function handleDelete(item: ClawHubListItem) {
    setClaws((current) => current.filter((claw) => claw.id !== item.id));
    toast.success(`已删除：${item.name}`);
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="space-y-1">
        <h1 className="text-[30px] font-semibold leading-none text-slate-950">Claw管理</h1>
      </div>

      <Tabs defaultValue="list" className="gap-5">
        <div className="rounded-[24px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-1.5 shadow-sm">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-1.5 bg-transparent p-0 md:grid-cols-2">
            <TabsTrigger
              value="list"
              className="justify-start rounded-[18px] border border-transparent px-5 py-3.5 text-left text-[15px] font-semibold text-slate-500 data-[state=active]:border-sky-200 data-[state=active]:bg-[linear-gradient(135deg,rgba(239,246,255,1),rgba(255,255,255,1))] data-[state=active]:text-sky-700 data-[state=active]:shadow-sm"
            >
              Claw列表
            </TabsTrigger>
            <TabsTrigger
              value="tenant"
              className="justify-start rounded-[18px] border border-transparent px-5 py-3.5 text-left text-[15px] font-semibold text-slate-500 data-[state=active]:border-sky-200 data-[state=active]:bg-[linear-gradient(135deg,rgba(239,246,255,1),rgba(255,255,255,1))] data-[state=active]:text-sky-700 data-[state=active]:shadow-sm"
            >
              租户级Claw Setting
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="mt-0">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-[360px]">
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索 Claw 名称"
                  className="h-10 rounded-[6px] border-slate-300 bg-white px-3 pr-9 text-sm shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100"
                />
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={handleRefresh}
                  className="h-10 w-10 rounded-[6px] border-slate-300 bg-white text-slate-600 shadow-none hover:bg-slate-50 hover:text-slate-900"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>

                <Button
                  className="h-10 rounded-[6px] bg-blue-600 px-4 text-sm font-medium text-white shadow-none hover:bg-blue-700"
                  onClick={() => toast.success("已预留创建 Claw 的入口。")}
                >
                  <Plus className="h-4 w-4" />
                  创建Claw
                </Button>
              </div>
            </div>

            <section className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">
              <Table className="min-w-[1180px]">
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-200 hover:bg-slate-50">
                    <TableHead className="h-11 px-4 text-sm font-medium text-slate-700">名称</TableHead>
                    <TableHead className="h-11 px-4 text-sm font-medium text-slate-700">创建人</TableHead>
                    <TableHead className="h-11 px-4 text-sm font-medium text-slate-700">发布状态</TableHead>
                    <TableHead className="h-11 px-4 text-sm font-medium text-slate-700">描述</TableHead>
                    <TableHead className="h-11 px-4 text-sm font-medium text-slate-700">更新时间</TableHead>
                    <TableHead className="h-11 px-4 text-sm font-medium text-slate-700">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaws.length === 0 ? (
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableCell colSpan={6} className="px-6 py-16 text-center">
                        <div className="mx-auto max-w-md space-y-3">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[6px] border border-slate-200 bg-slate-50 text-slate-500">
                            <Search className="h-5 w-5" />
                          </div>
                          <div className="text-lg font-semibold text-slate-900">暂无匹配结果</div>
                          <p className="text-sm leading-6 text-slate-500">
                            {keyword ? "试试缩短关键词，或改用描述中的核心能力进行检索。" : "当前没有可展示的 Claw。"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClaws.map((item) => (
                      <TableRow key={item.id} className="border-slate-200 bg-white hover:bg-slate-50/40">
                        <TableCell className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[linear-gradient(135deg,#4f46e5,#2563eb)] text-white">
                              <Bot className="h-4 w-4" />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenConfig(item)}
                              className="text-left text-[15px] font-medium text-slate-900 transition-colors hover:text-blue-600"
                            >
                              {item.name}
                            </button>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-4 align-middle text-sm text-slate-700">{item.creator}</TableCell>

                        <TableCell className="px-4 py-4 align-middle">
                          <PublishStatusBadge status={item.publishStatus} />
                        </TableCell>

                        <TableCell className="max-w-[420px] whitespace-normal px-4 py-4 align-middle text-sm leading-6 text-slate-600">
                          {item.summary}
                        </TableCell>

                        <TableCell className="px-4 py-4 align-middle text-sm text-slate-700">
                          {formatUpdatedInfo(item)}
                        </TableCell>

                        <TableCell className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-4 text-sm">
                            <button
                              type="button"
                              onClick={() => handleOpenConfig(item)}
                              className="text-blue-600 transition-colors hover:text-blue-700"
                            >
                              更新配置
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePublish(item)}
                              className={cn(
                                "transition-colors",
                                item.publishStatus === "已发布"
                                  ? "cursor-not-allowed text-slate-400 hover:text-slate-400"
                                  : "text-blue-600 hover:text-blue-700"
                              )}
                            >
                              发布
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="text-blue-600 transition-colors hover:text-blue-700"
                            >
                              删除
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="tenant" className="mt-0">
          <div className="grid gap-5 xl:grid-cols-2">
            {tenantSettingSections.map((section) => (
              <Card key={section.title} className="gap-0 rounded-[28px] border-slate-200 bg-white py-0 shadow-sm">
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      {section.title === "资源与环境配置" ? (
                        <Database className="h-5 w-5" />
                      ) : (
                        <Network className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-slate-950">{section.title}</div>
                      <div className="mt-2 text-sm leading-7 text-slate-600">{section.description}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {section.groups.map((group) => (
                      <div key={group.title} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700">
                            {group.title === "Agent" ? (
                              <Bot className="h-4 w-4" />
                            ) : group.title.includes("知识库") ? (
                              <Library className="h-4 w-4" />
                            ) : group.title.includes("Skill") ? (
                              <Sparkles className="h-4 w-4" />
                            ) : group.title.includes("Tool") ? (
                              <Puzzle className="h-4 w-4" />
                            ) : (
                              <Layers3 className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-slate-950">{group.title}</div>
                            <div className="mt-1 text-sm text-slate-600">{group.description}</div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {group.entries.map((entry) => (
                            <div
                              key={`${section.title}-${group.title}-${entry}`}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                            >
                              {entry}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
