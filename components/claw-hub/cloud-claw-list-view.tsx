"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Clock3,
  Cloud,
  Layers3,
  Plus,
  Radio,
  Search,
  ServerCog,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  cloudClawCatalog,
  type CloudClawListItem,
  type CloudClawStatus,
} from "@/lib/mock/cloud-claw-hub";

function getStatusBadgeClass(status: CloudClawStatus) {
  if (status === "已发布") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "草稿") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</div>
          <div className="mt-1 text-lg font-semibold text-slate-950">{value}</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">{caption}</div>
        </div>
      </div>
    </div>
  );
}

function ClawCard({ item }: { item: CloudClawListItem }) {
  return (
    <Link
      href={`/claw-hub/cloud/${item.id}`}
      className="group block rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("rounded-full border px-2.5 py-1 text-xs", getStatusBadgeClass(item.status))}>
              {item.status}
            </Badge>
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
              {item.sceneType}
            </Badge>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-950">{item.name}</div>
            <div className="mt-2 text-sm leading-7 text-slate-600">{item.description}</div>
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-sky-50 group-hover:text-sky-700">
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="text-xs text-slate-500">当前版本</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{item.version}</div>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="text-xs text-slate-500">组织 / 负责人</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {item.owner}
            <span className="mx-1 text-slate-300">/</span>
            {item.creator}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="text-xs text-slate-500">最近更新时间</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{item.updatedAt}</div>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="text-xs text-slate-500">发布渠道</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {item.channels.slice(0, 3).map((channel) => (
              <Badge key={channel} variant="outline" className="border-slate-200 bg-white text-slate-600">
                {channel}
              </Badge>
            ))}
            {item.channels.length === 0 ? (
              <span className="text-sm text-slate-500">暂无启用渠道</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
        <span>已绑定技能 {item.skillCount} 个</span>
        <span>子Agent {item.subAgentCount} 个</span>
        <span>工具 {item.toolCount} 项</span>
      </div>
    </Link>
  );
}

export function CloudClawListView() {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sceneFilter, setSceneFilter] = useState("all");

  const statusOptions = [
    { value: "all", label: "全部状态" },
    { value: "已发布", label: "已发布" },
    { value: "草稿", label: "草稿" },
    { value: "已停用", label: "已停用" },
  ];

  const sceneOptions = useMemo(
    () => [
      { value: "all", label: "全部场景" },
      ...Array.from(new Set(cloudClawCatalog.map((item) => item.sceneType))).map((scene) => ({
        value: scene,
        label: scene,
      })),
    ],
    []
  );

  const filteredClaws = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return cloudClawCatalog.filter((item) => {
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        item.name.toLowerCase().includes(normalizedKeyword) ||
        item.description.toLowerCase().includes(normalizedKeyword) ||
        item.owner.toLowerCase().includes(normalizedKeyword);

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesScene = sceneFilter === "all" || item.sceneType === sceneFilter;

      return matchesKeyword && matchesStatus && matchesScene;
    });
  }, [keyword, sceneFilter, statusFilter]);

  const publishedCount = useMemo(
    () => cloudClawCatalog.filter((item) => item.status === "已发布").length,
    []
  );
  const draftCount = useMemo(
    () => cloudClawCatalog.filter((item) => item.status === "草稿").length,
    []
  );
  const stoppedCount = useMemo(
    () => cloudClawCatalog.filter((item) => item.status === "已停用").length,
    []
  );
  const channelCount = useMemo(
    () => new Set(cloudClawCatalog.flatMap((item) => item.channels)).size,
    []
  );
  const toolCount = useMemo(
    () => cloudClawCatalog.reduce((total, item) => total + item.toolCount, 0),
    []
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.14),_transparent_38%),linear-gradient(135deg,#ffffff_8%,#f7fbff_54%,#edf5ff_100%)] p-7 shadow-sm">
        <div className="absolute -right-10 top-5 h-40 w-40 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="relative space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <Badge className="border-sky-200 bg-sky-100 text-sky-700">
                应用开发
                <ChevronRight className="h-3.5 w-3.5" />
                ClawHub
                <ChevronRight className="h-3.5 w-3.5" />
                云端 Claw
              </Badge>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">云端 Claws</h2>
                <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-600">
                  这里管理当前开发者维护的全部云端 Claw。列表页聚焦概览、检索与进入配置，详情页再承载单个 Claw 的完整治理与编辑能力。
                </p>
              </div>
            </div>

            <Button
              className="bg-slate-900 text-white hover:bg-slate-800"
              onClick={() => toast.success("已创建一份新的云端 Claw 空白草稿，可继续补充基础设定与发布配置。")}
            >
              <Plus className="h-4 w-4" />
              新建云端 Claw
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <SummaryTile
              icon={Layers3}
              label="Claw 总数"
              value={`${cloudClawCatalog.length} 个`}
              caption="当前纳入统一治理的云端 Claw 数量。"
            />
            <SummaryTile
              icon={Cloud}
              label="已发布"
              value={`${publishedCount} 个`}
              caption="已正式对业务渠道开放服务的 Claw。"
            />
            <SummaryTile
              icon={Sparkles}
              label="草稿"
              value={`${draftCount} 个`}
              caption="正在建设或待评审发布的 Claw。"
            />
            <SummaryTile
              icon={Clock3}
              label="已停用"
              value={`${stoppedCount} 个`}
              caption="当前已停止服务但保留治理记录的 Claw。"
            />
            <SummaryTile
              icon={Radio}
              label="覆盖渠道"
              value={`${channelCount} 类`}
              caption="当前已配置的 Web、IM、工作台等渠道类型。"
            />
            <SummaryTile
              icon={ServerCog}
              label="已接入工具"
              value={`${toolCount} 项`}
              caption="当前全部 Claw 已登记的工具能力数量。"
            />
          </div>
        </div>
      </section>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>云端 Claw 列表</CardTitle>
          <CardDescription>支持按名称、负责人、状态与业务场景快速筛选并进入详情配置页。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_220px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索 Claw 名称、描述或负责人"
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter} options={statusOptions} />
            <Select value={sceneFilter} onValueChange={setSceneFilter} options={sceneOptions} />
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>共找到 {filteredClaws.length} 个云端 Claw</span>
            <span>卡片列表仅做原型展示，不包含真实分页与批量操作</span>
          </div>

          {filteredClaws.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredClaws.map((item) => (
                <ClawCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <div className="text-base font-semibold text-slate-900">没有匹配到云端 Claw</div>
              <div className="mt-2 text-sm text-slate-500">你可以调整筛选条件，或者清空关键词后重新查看全部列表。</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
