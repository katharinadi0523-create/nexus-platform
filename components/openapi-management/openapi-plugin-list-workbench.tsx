"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Plug, Plus, RefreshCw, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import {
  ManagementCell,
  ManagementEmptyRow,
  ManagementIconButton,
  ManagementPageTitle,
  ManagementPrimaryButton,
  ManagementRow,
  ManagementRowActions,
  ManagementStatusDot,
  ManagementTable,
  ManagementTableBody,
  ManagementTableFrame,
  ManagementTableHead,
  ManagementTableHeader,
  ManagementTextAction,
  ManagementToolbar,
} from "@/components/management/management-list";
import {
  openApiPlugins,
  type OpenApiPluginItem,
  type OpenApiPluginStatus,
} from "@/lib/mock/openapi-plugins";
import {
  OpenApiPluginPublishDialog,
  type OpenApiPluginPublishValue,
} from "@/components/openapi-management/openapi-plugin-publish-dialog";
import { cn } from "@/lib/utils";

function PluginIconTile({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-emerald-400 text-white", className)}>
      <Plug className="h-5 w-5 fill-white" />
    </div>
  );
}

function pluginDetailHref(plugin: OpenApiPluginItem) {
  return `/openapi-management/${plugin.id}`;
}

function getPluginStatusDotClass(status: OpenApiPluginStatus) {
  const statusClassMap: Record<OpenApiPluginStatus, string> = {
    未上架: "bg-slate-400",
    审核中: "bg-amber-500",
    已上架: "bg-emerald-500",
    审核不通过: "bg-rose-500",
  };

  return statusClassMap[status];
}

export function OpenApiPluginListWorkbench() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [plugins, setPlugins] = useState<OpenApiPluginItem[]>(openApiPlugins);
  const [publishTarget, setPublishTarget] = useState<OpenApiPluginItem | null>(null);
  const [publishValue, setPublishValue] = useState<OpenApiPluginPublishValue>({
    publishScope: "组织发布",
    pluginType: "本体工具",
  });
  const deferredKeyword = useDeferredValue(keyword);

  const filteredPlugins = useMemo(() => {
    const normalizedKeyword = deferredKeyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return plugins;
    }

    return plugins.filter((plugin) =>
      [plugin.name, plugin.status, plugin.description, plugin.creator, plugin.updatedAt]
        .join(" ")
        .toLowerCase()
        .includes(normalizedKeyword)
    );
  }, [deferredKeyword, plugins]);

  useEffect(() => {
    filteredPlugins.forEach((plugin) => router.prefetch(pluginDetailHref(plugin)));
  }, [filteredPlugins, router]);

  function handleRefresh() {
    setPlugins(openApiPlugins);
    toast.success("插件列表已刷新。");
  }

  function handleOpenPublishDialog(plugin: OpenApiPluginItem) {
    setPublishTarget(plugin);
    setPublishValue({
      publishScope: plugin.publishScope,
      pluginType: plugin.pluginType,
    });
  }

  function handleSubmitPublishReview() {
    if (!publishTarget) {
      return;
    }

    setPlugins((current) =>
      current.map((item) =>
        item.id === publishTarget.id
          ? {
              ...item,
              status: "审核中",
              publishScope: publishValue.publishScope,
              pluginType: publishValue.pluginType,
            }
          : item
      )
    );
    toast.success(`已提交发布审核：${publishTarget.name}`);
    setPublishTarget(null);
  }

  function handleOffline(plugin: OpenApiPluginItem) {
    setPlugins((current) =>
      current.map((item) => (item.id === plugin.id ? { ...item, status: "未上架" } : item))
    );
    toast.success(`已下架：${plugin.name}`);
  }

  function handleDelete(plugin: OpenApiPluginItem) {
    if (plugin.status === "已上架" || plugin.status === "审核中") {
      toast.info("已上架或审核中的插件需先下架或完成审核后才能删除。");
      return;
    }

    setPlugins((current) => current.filter((item) => item.id !== plugin.id));
    toast.success(`已删除：${plugin.name}`);
  }

  return (
    <div className="space-y-5 pb-10">
      <ManagementPageTitle>插件管理</ManagementPageTitle>

      <ManagementToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="搜索插件名称"
        actions={
          <>
            <ManagementIconButton onClick={handleRefresh} aria-label="刷新插件列表">
              <RefreshCw className="h-4 w-4" />
            </ManagementIconButton>
            <ManagementPrimaryButton onClick={() => toast.info("创建插件表单正在接入。")}>
              <Plus className="h-4 w-4" />
              创建插件
            </ManagementPrimaryButton>
          </>
        }
      />

      <ManagementTableFrame>
        <ManagementTable className="min-w-[980px] table-fixed">
          <ManagementTableHeader>
            <ManagementTableHead className="w-[280px]">插件名称</ManagementTableHead>
            <ManagementTableHead className="w-[120px]">
              <span className="inline-flex items-center gap-6">
                上架状态
                <Filter className="h-4 w-4 text-slate-700" />
              </span>
            </ManagementTableHead>
            <ManagementTableHead>插件描述</ManagementTableHead>
            <ManagementTableHead className="w-[110px]">创建人</ManagementTableHead>
            <ManagementTableHead className="w-[170px]">
              <span className="inline-flex items-center gap-2">
                更新时间
                <ArrowUpDown className="h-4 w-4 text-slate-700" />
              </span>
            </ManagementTableHead>
            <ManagementTableHead className="w-[150px]">操作</ManagementTableHead>
          </ManagementTableHeader>

          <ManagementTableBody>
            {filteredPlugins.length === 0 ? (
              <ManagementEmptyRow
                colSpan={6}
                description={keyword ? "试试缩短关键词，或改用插件描述中的核心能力进行检索。" : "当前没有可展示的插件。"}
              />
            ) : (
              filteredPlugins.map((plugin) => {
                const isPublished = plugin.status === "已上架";
                const isReviewing = plugin.status === "审核中";

                return (
                  <ManagementRow key={plugin.id}>
                    <ManagementCell>
                      <div className="flex items-center gap-4">
                        <PluginIconTile />
                        <button
                          type="button"
                          onClick={() => router.push(pluginDetailHref(plugin))}
                          className="min-w-0 text-left text-[15px] font-semibold text-slate-900 transition-colors hover:text-blue-600"
                        >
                          <span className="block truncate">{plugin.name}</span>
                        </button>
                      </div>
                    </ManagementCell>

                    <ManagementCell>
                      <ManagementStatusDot
                        label={plugin.status}
                        active={isPublished}
                        inactiveClassName={getPluginStatusDotClass(plugin.status)}
                      />
                    </ManagementCell>

                    <ManagementCell className="max-w-[360px] text-slate-700">
                      <p className="truncate">{plugin.description}</p>
                    </ManagementCell>

                    <ManagementCell className="font-medium text-slate-800">{plugin.creator}</ManagementCell>

                    <ManagementCell className="text-slate-800">{plugin.updatedAt}</ManagementCell>

                    <ManagementCell>
                      <ManagementRowActions>
                        <ManagementTextAction onClick={() => toast.info(`编辑：${plugin.name}`)}>编辑</ManagementTextAction>
                        <ManagementTextAction
                          disabled={isReviewing}
                          onClick={() => (isPublished ? handleOffline(plugin) : handleOpenPublishDialog(plugin))}
                        >
                          {isPublished ? "下架" : isReviewing ? "审核中" : "上架"}
                        </ManagementTextAction>
                        <ManagementTextAction disabled={isPublished || isReviewing} onClick={() => handleDelete(plugin)}>
                          删除
                        </ManagementTextAction>
                      </ManagementRowActions>
                    </ManagementCell>
                  </ManagementRow>
                );
              })
            )}
          </ManagementTableBody>
        </ManagementTable>
      </ManagementTableFrame>

      <OpenApiPluginPublishDialog
        open={!!publishTarget}
        pluginName={publishTarget?.name}
        value={publishValue}
        onValueChange={setPublishValue}
        onOpenChange={(open) => {
          if (!open) {
            setPublishTarget(null);
          }
        }}
        onSubmit={handleSubmitPublishReview}
      />
    </div>
  );
}
