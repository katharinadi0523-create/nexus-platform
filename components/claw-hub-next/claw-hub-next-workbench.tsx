"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Database,
  Layers3,
  Library,
  Network,
  Plus,
  Puzzle,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  clawHubList,
  tenantSettingSections,
  type ClawHubListItem,
  type ClawStatus,
  type ClawType,
} from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: ClawStatus }) {
  const statusClassName =
    status === "运行中"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "设计中"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : status === "待评审"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-100 text-slate-600";

  return <Badge className={cn("rounded-full border px-2.5 py-1 text-xs", statusClassName)}>{status}</Badge>;
}

function ClawRow({ item }: { item: ClawHubListItem }) {
  const router = useRouter();

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-slate-600">
              {item.type}
            </Badge>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-950">{item.name}</div>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{item.summary}</div>
          </div>
        </div>

        <Button
          variant="outline"
          className="rounded-full border-slate-300 bg-white/90 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
          onClick={() => {
            startTransition(() => {
              router.push(`/claw-hub-next/claws/${item.id}`);
            });
          }}
        >
          进入配置
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Owner</div>
          <div className="mt-1 font-medium text-slate-900">{item.owner}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">场景</div>
          <div className="mt-1 font-medium text-slate-900">{item.scene}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Model</div>
          <div className="mt-1 font-medium text-slate-900">{item.model}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Updated</div>
          <div className="mt-1 font-medium text-slate-900">{item.updatedAt}</div>
        </div>
      </div>
    </div>
  );
}

const STATUS_FILTERS = ["全部", "运行中", "设计中", "待评审", "冻结"] as const;

export function ClawHubNextWorkbench() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("全部");
  const [typeFilter, setTypeFilter] = useState<ClawType | "全部">("全部");
  const deferredKeyword = useDeferredValue(keyword);
  const typeFilters = useMemo<(ClawType | "全部")[]>(
    () => ["全部", ...Array.from(new Set(clawHubList.map((item) => item.type)))],
    []
  );

  const filteredClaws = useMemo(() => {
    const normalizedKeyword = deferredKeyword.trim().toLowerCase();

    return clawHubList.filter((item) => {
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        item.name.toLowerCase().includes(normalizedKeyword) ||
        item.owner.toLowerCase().includes(normalizedKeyword) ||
        item.scene.toLowerCase().includes(normalizedKeyword) ||
        item.summary.toLowerCase().includes(normalizedKeyword);

      const matchesStatus = statusFilter === "全部" || item.status === statusFilter;
      const matchesType = typeFilter === "全部" || item.type === typeFilter;
      return matchesKeyword && matchesStatus && matchesType;
    });
  }, [deferredKeyword, statusFilter, typeFilter]);

  useEffect(() => {
    filteredClaws.forEach((item) => {
      router.prefetch(`/claw-hub-next/claws/${item.id}`);
    });
  }, [filteredClaws, router]);

  return (
    <div className="space-y-5 pb-10">
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
          <div className="space-y-5">
            <Card className="gap-0 rounded-[28px] border-slate-200 bg-white py-0 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      placeholder="搜索 Claw 名称、类型、场景、Owner 或描述"
                      className="h-11 min-w-0 rounded-2xl border-slate-300 bg-white pl-10 lg:w-[720px]"
                    />
                  </div>
                  <Button
                    className="h-11 rounded-[16px] border border-sky-200 bg-sky-50 px-5 text-sm font-semibold text-sky-700 shadow-none hover:bg-sky-100"
                    onClick={() => toast.success("已预留创建 Claw 的入口。")}
                  >
                    <Plus className="h-4 w-4" />
                    创建Claw
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm transition-colors",
                        statusFilter === status
                          ? "border-sky-200 bg-sky-50 text-sky-700 shadow-sm"
                          : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {typeFilters.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTypeFilter(type)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm transition-colors",
                        typeFilter === type
                          ? "border-sky-200 bg-sky-50 text-sky-700 shadow-sm"
                          : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {filteredClaws.length > 0 ? (
                filteredClaws.map((item) => <ClawRow key={item.id} item={item} />)
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                  <div className="text-base font-semibold text-slate-900">没有匹配到 Claw</div>
                  <div className="mt-2 text-sm text-slate-500">可以调整关键词、状态或类型筛选后重试。</div>
                </div>
              )}
            </div>
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
