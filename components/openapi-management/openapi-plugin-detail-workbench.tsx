"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ChevronLeft, Code2, Filter, Plug, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  ManagementCell,
  ManagementEmptyRow,
  ManagementIconButton,
  ManagementPrimaryButton,
  ManagementRow,
  ManagementRowActions,
  ManagementSecondaryButton,
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
  OpenApiPluginPublishDialog,
  type OpenApiPluginPublishValue,
} from "@/components/openapi-management/openapi-plugin-publish-dialog";
import { Switch } from "@/components/ui/switch";
import type { OpenApiPluginItem, OpenApiPluginStatus, OpenApiToolItem } from "@/lib/mock/openapi-plugins";
import { cn } from "@/lib/utils";

function PluginIconTile({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-[8px] bg-emerald-400 text-white", className)}>
      <Plug className="h-12 w-12 fill-white" />
    </div>
  );
}

function PluginStatus({ status }: { status: OpenApiPluginItem["status"] }) {
  return (
    <ManagementStatusDot
      label={status}
      active={status === "已上架"}
      inactiveClassName={getPluginStatusDotClass(status)}
    />
  );
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

export function OpenApiPluginDetailWorkbench({ plugin }: { plugin: OpenApiPluginItem }) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [currentPlugin, setCurrentPlugin] = useState(plugin);
  const [tools, setTools] = useState<OpenApiToolItem[]>(plugin.tools);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishValue, setPublishValue] = useState<OpenApiPluginPublishValue>({
    publishScope: plugin.publishScope,
    pluginType: plugin.pluginType,
  });
  const deferredKeyword = useDeferredValue(keyword);
  const isPublished = currentPlugin.status === "已上架";
  const isReviewing = currentPlugin.status === "审核中";

  const filteredTools = useMemo(() => {
    const normalizedKeyword = deferredKeyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return tools;
    }

    return tools.filter((tool) =>
      [tool.name, tool.debugStatus, tool.description, tool.updatedAt]
        .join(" ")
        .toLowerCase()
        .includes(normalizedKeyword)
    );
  }, [deferredKeyword, tools]);

  function navigateToToolEdit(toolId: string, editInputParams = false) {
    const query = editInputParams ? "?editInputParams=1" : "";
    router.push(`/openapi-management/${plugin.id}/${toolId}${query}`);
  }

  function handleRefresh() {
    setCurrentPlugin(plugin);
    setTools(plugin.tools);
    toast.success("工具列表已刷新。");
  }

  function handleTogglePluginStatus() {
    if (!isPublished) {
      if (isReviewing) {
        toast.info("插件正在审核中。");
        return;
      }

      setPublishValue({
        publishScope: currentPlugin.publishScope,
        pluginType: currentPlugin.pluginType,
      });
      setPublishDialogOpen(true);
      return;
    }

    setCurrentPlugin((current) => ({ ...current, status: "未上架" }));
    toast.success(`已下架：${currentPlugin.name}`);
  }

  function handleSubmitPublishReview() {
    setCurrentPlugin((current) => ({
      ...current,
      status: "审核中",
      publishScope: publishValue.publishScope,
      pluginType: publishValue.pluginType,
    }));
    setPublishDialogOpen(false);
    toast.success(`已提交发布审核：${currentPlugin.name}`);
  }

  function handleToggleToolEnabled(toolId: string, enabled: boolean) {
    setTools((current) => current.map((tool) => (tool.id === toolId ? { ...tool, enabled } : tool)));
    toast.success(enabled ? "工具已启用。" : "工具已停用。");
  }

  function handleDeleteTool(tool: OpenApiToolItem) {
    if (!tool.deletable) {
      toast.info("内置工具暂不支持删除。");
      return;
    }

    setTools((current) => current.filter((item) => item.id !== tool.id));
    toast.success(`已删除工具：${tool.name}`);
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-60px)] bg-white">
      <div className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/openapi-management")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
            aria-label="返回插件管理"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-4 text-[20px] font-semibold">
            <span className="shrink-0 text-slate-500">插件管理</span>
            <span className="shrink-0 text-slate-400">/</span>
            <span className="truncate text-slate-950">{currentPlugin.name}</span>
          </div>
          <div className="hidden shrink-0 md:block">
            <PluginStatus status={currentPlugin.status} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ManagementSecondaryButton onClick={() => toast.info(`编辑：${currentPlugin.name}`)}>编辑</ManagementSecondaryButton>
          <ManagementSecondaryButton
            onClick={handleTogglePluginStatus}
            disabled={isReviewing}
            className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white"
          >
            {isPublished ? "下架" : isReviewing ? "审核中" : "上架"}
          </ManagementSecondaryButton>
        </div>
      </div>

      <div className="space-y-8 px-6 py-8">
        <section className="space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <PluginIconTile />
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex min-w-0 items-center gap-3">
                <h1 className="truncate text-[40px] font-semibold leading-tight text-slate-950">
                  {currentPlugin.name}
                </h1>
                <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-1 text-sm font-medium text-sky-700">
                  插件
                </span>
              </div>
              <div className="text-base font-medium text-slate-900">{currentPlugin.description}</div>
              <div className="text-base font-medium text-slate-500">
                @{currentPlugin.publisher}发布 · {currentPlugin.updatedAt} 更新
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200" />
        </section>

        <section className="space-y-5">
          <h2 className="text-[20px] font-semibold leading-8 text-slate-950">工具列表 ({tools.length})</h2>

          <ManagementToolbar
            searchValue={keyword}
            onSearchChange={setKeyword}
            searchPlaceholder="搜索工具名称"
            actions={
              <>
                <ManagementIconButton onClick={handleRefresh} aria-label="刷新工具列表">
                  <RefreshCw className="h-4 w-4" />
                </ManagementIconButton>
                <ManagementSecondaryButton onClick={() => toast.info("代码模式正在接入。")}>
                  <Code2 className="h-4 w-4" />
                  代码模式
                </ManagementSecondaryButton>
                <ManagementPrimaryButton onClick={() => toast.info("创建工具表单正在接入。")}>
                  <Plus className="h-4 w-4" />
                  创建工具
                </ManagementPrimaryButton>
              </>
            }
          />

          <ManagementTableFrame className="border-0">
            <ManagementTable className="min-w-[980px] table-fixed">
              <ManagementTableHeader>
                <ManagementTableHead className="w-[220px]">工具名称</ManagementTableHead>
                <ManagementTableHead className="w-[130px]">
                  <span className="inline-flex items-center gap-6">
                    调试状态
                    <Filter className="h-4 w-4 text-slate-700" />
                  </span>
                </ManagementTableHead>
                <ManagementTableHead>工具描述</ManagementTableHead>
                <ManagementTableHead className="w-[90px]">
                  <span className="inline-flex items-center gap-8">
                    启用
                    <Filter className="h-4 w-4 text-slate-700" />
                  </span>
                </ManagementTableHead>
                <ManagementTableHead className="w-[170px]">
                  <span className="inline-flex items-center gap-2">
                    更新时间
                    <ArrowUpDown className="h-4 w-4 text-slate-700" />
                  </span>
                </ManagementTableHead>
                <ManagementTableHead className="w-[160px]">操作</ManagementTableHead>
              </ManagementTableHeader>

              <ManagementTableBody>
                {filteredTools.length === 0 ? (
                  <ManagementEmptyRow
                    colSpan={6}
                    description={keyword ? "试试缩短关键词，或改用工具描述中的核心能力进行检索。" : "当前插件还没有工具。"}
                  />
                ) : (
                  filteredTools.map((tool, index) => {
                    const debugPassed = tool.debugStatus === "调试成功";

                    return (
                      <ManagementRow key={tool.id} selected={index === 0}>
                        <ManagementCell>
                          <button
                            type="button"
                            onClick={() => navigateToToolEdit(tool.id)}
                            className={cn(
                              "text-left text-[15px] font-semibold transition-colors hover:text-blue-700",
                              index === 0 ? "text-blue-600" : "text-slate-900"
                            )}
                          >
                            {tool.name}
                          </button>
                        </ManagementCell>

                        <ManagementCell>
                          <ManagementStatusDot
                            label={tool.debugStatus}
                            active={debugPassed}
                            inactiveClassName="bg-slate-400"
                          />
                        </ManagementCell>

                        <ManagementCell className="max-w-[520px] text-slate-700">
                          <p className="truncate">{tool.description}</p>
                        </ManagementCell>

                        <ManagementCell>
                          <Switch
                            checked={tool.enabled}
                            onCheckedChange={(checked) => handleToggleToolEnabled(tool.id, checked)}
                            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200"
                          />
                        </ManagementCell>

                        <ManagementCell className="text-slate-800">{tool.updatedAt}</ManagementCell>

                        <ManagementCell>
                          <ManagementRowActions>
                            <ManagementTextAction onClick={() => toast.info(`调试：${tool.name}`)}>调试</ManagementTextAction>
                            <ManagementTextAction
                              disabled={!tool.configurable}
                              onClick={() => navigateToToolEdit(tool.id, true)}
                            >
                              配置
                            </ManagementTextAction>
                            <ManagementTextAction
                              disabled={!tool.deletable}
                              onClick={() => handleDeleteTool(tool)}
                            >
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
        </section>
      </div>

      <OpenApiPluginPublishDialog
        open={publishDialogOpen}
        pluginName={currentPlugin.name}
        value={publishValue}
        onValueChange={setPublishValue}
        onOpenChange={setPublishDialogOpen}
        onSubmit={handleSubmitPublishReview}
      />
    </div>
  );
}
