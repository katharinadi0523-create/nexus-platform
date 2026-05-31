"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Bot, Plus, RefreshCw, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { clawHubList, type ClawHubListItem } from "@/lib/mock/claw-hub-next";
import { PRESET_MODEL_IDS } from "@/lib/model-schemas";
import { cn } from "@/lib/utils";

const CURRENT_OPERATOR = "RowanDI";
const PERSONAL_CLAW_URL = "https://claw-dialogue.vercel.app/";
const STATIC_CLAW_IDS = new Set(clawHubList.map((item) => item.id));
const STORAGE_VOLUME_OPTIONS = [
  { value: "s3://juicefs-vol-001", label: "GF专用存储卷" },
  { value: "s3://juicefs-vol-002", label: "办公共享存储卷" },
  { value: "s3://juicefs-vol-003", label: "研发测试存储卷" },
];

type CreateClawDraft = {
  name: string;
  description: string;
  identityContent: string;
  soulContent: string;
  primaryModel: string;
  storageVolume: string;
};

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

function buildClawDetailUrl(item: ClawHubListItem) {
  const pathname = `/claw-hub-next/claws/${item.id}`;

  if (STATIC_CLAW_IDS.has(item.id)) {
    return pathname;
  }

  const params = new URLSearchParams({
    name: item.name,
    creator: item.creator,
    model: item.model,
    summary: item.summary,
    updatedAt: item.updatedAt,
    updatedBy: item.updatedBy,
  });

  return `${pathname}?${params.toString()}`;
}

export function ClawHubNextWorkbench() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [claws, setClaws] = useState<ClawHubListItem[]>(clawHubList);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<CreateClawDraft>({
    name: "",
    description: "",
    identityContent: "",
    soulContent: "",
    primaryModel: PRESET_MODEL_IDS[0] ?? "Qwen3-32B",
    storageVolume: "",
  });
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
      router.prefetch(buildClawDetailUrl(item));
    });
  }, [filteredClaws, router]);

  function handleOpenConfig(item: ClawHubListItem) {
    router.push(buildClawDetailUrl(item));
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

  function handleOpenCreateDialog() {
    setCreateDraft({
      name: "",
      description: "",
      identityContent: "",
      soulContent: "",
      primaryModel: PRESET_MODEL_IDS[0] ?? "Qwen3-32B",
      storageVolume: "",
    });
    setCreateDialogOpen(true);
  }

  function handleCreateDraftChange(field: keyof CreateClawDraft, value: string) {
    setCreateDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleCreateClaw() {
    const name = createDraft.name.trim();
    const description = createDraft.description.trim();

    if (!name) {
      toast.error("请填写 Claw 名称。");
      return;
    }

    if (!description) {
      toast.error("请填写 Claw 描述。");
      return;
    }

    if (!createDraft.primaryModel) {
      toast.error("请选择主模型。");
      return;
    }

    if (!createDraft.storageVolume) {
      toast.error("请选择存储卷。");
      return;
    }

    const nextClaw: ClawHubListItem = {
      id: `claw-${Date.now()}`,
      name,
      creator: CURRENT_OPERATOR,
      type: "办公型",
      scene: "通用办公",
      owner: "默认项目组",
      status: "设计中",
      publishStatus: "未发布",
      model: createDraft.primaryModel,
      updatedAt: formatNow(),
      updatedBy: CURRENT_OPERATOR,
      summary: description || "新建 Claw，待补充描述。",
    };

    setClaws((current) => [nextClaw, ...current]);
    setCreateDialogOpen(false);
    toast.success(`已创建：${name}`);
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[30px] font-semibold leading-none text-slate-950">Claw管理</h1>
        <a
          href={PERSONAL_CLAW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 text-sm font-medium text-blue-700 shadow-[0_4px_14px_-8px_rgba(37,99,235,0.45)] transition-colors hover:border-blue-300 hover:from-blue-100 hover:to-indigo-100 hover:text-blue-800"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-blue-600" />
          查看我的claw
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-blue-500" />
        </a>
      </div>

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
                  onClick={handleOpenCreateDialog}
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

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[880px]">
          <DialogHeader>
            <DialogTitle>新建Claw</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <section className="space-y-4">
              <div className="text-base font-semibold text-slate-950">基本信息</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="create-claw-name">
                    <span className="text-rose-500">*</span>名称
                  </Label>
                  <Input
                    id="create-claw-name"
                    value={createDraft.name}
                    onChange={(event) => handleCreateDraftChange("name", event.target.value)}
                    placeholder="例如：办公审批虾、运维巡检虾"
                    className="h-10 border-slate-200 bg-white shadow-none"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="create-claw-description">
                    <span className="text-rose-500">*</span>描述
                  </Label>
                  <textarea
                    id="create-claw-description"
                    value={createDraft.description}
                    onChange={(event) => handleCreateDraftChange("description", event.target.value)}
                    placeholder="简要说明这个 Claw 负责什么场景、解决什么问题。"
                    className="min-h-[92px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-none outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </section>

            <div className="my-6 border-t border-slate-200" />

            <section className="space-y-4">
              <div className="text-base font-semibold text-slate-950">人格设定</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-claw-identity">IDENTITY.md</Label>
                  <textarea
                    id="create-claw-identity"
                    value={createDraft.identityContent}
                    onChange={(event) => handleCreateDraftChange("identityContent", event.target.value)}
                    placeholder="选填，例如：定义 Claw 的角色、职责边界和服务对象。"
                    className="min-h-[180px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-none outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-claw-soul">SOUL.md</Label>
                  <textarea
                    id="create-claw-soul"
                    value={createDraft.soulContent}
                    onChange={(event) => handleCreateDraftChange("soulContent", event.target.value)}
                    placeholder="选填，例如：定义 Claw 的语气、风格和处理偏好。"
                    className="min-h-[180px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-none outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </section>

            <div className="my-6 border-t border-slate-200" />

            <section className="space-y-4">
              <div className="text-base font-semibold text-slate-950">运行配置</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    <span className="text-rose-500">*</span>主模型
                  </Label>
                  <Select
                    value={createDraft.primaryModel}
                    onValueChange={(value) => handleCreateDraftChange("primaryModel", value)}
                    options={PRESET_MODEL_IDS.map((modelId) => ({ value: modelId, label: modelId }))}
                    placeholder="选择该 Claw 默认使用的主模型"
                    className="h-10 border-slate-200 bg-white shadow-none focus:ring-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    <span className="text-rose-500">*</span>存储卷
                  </Label>
                  <Select
                    value={createDraft.storageVolume}
                    onValueChange={(value) => handleCreateDraftChange("storageVolume", value)}
                    options={STORAGE_VOLUME_OPTIONS}
                    placeholder="选择该 Claw 工作空间绑定的存储卷"
                    className="h-10 border-slate-200 bg-white shadow-none focus:ring-0"
                  />
                </div>
              </div>
            </section>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleCreateClaw}>
              创建Claw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
