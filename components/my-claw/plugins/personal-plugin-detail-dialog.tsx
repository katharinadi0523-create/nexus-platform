"use client";

import { useMemo, useState } from "react";
import { PlugZap, RefreshCw, Search, Server, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { MinePluginItem } from "@/lib/mock/my-claw/plugins";
import { cn } from "@/lib/utils";
import { PluginConnectionStatus, PluginRuntimeStatus } from "./plugin-connection-status";

type DetailTab = "intro" | "tools";

export function PersonalPluginDetailDialog({ plugin, onClose, onEdit, onToggle, onTestConnection, onDelete }: {
  plugin: MinePluginItem;
  onClose: () => void;
  onEdit: (plugin: MinePluginItem) => void;
  onToggle: (enabled: boolean) => void;
  onTestConnection: () => void;
  onDelete: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>(plugin.personalCreated ? "tools" : "intro");
  const [toolQuery, setToolQuery] = useState("");
  const tools = useMemo(() => plugin.detail?.tools ?? [], [plugin.detail?.tools]);
  const filteredTools = useMemo(() => {
    const keyword = toolQuery.trim().toLowerCase();
    return keyword ? tools.filter((tool) => `${tool.name} ${tool.description}`.toLowerCase().includes(keyword)) : tools;
  }, [toolQuery, tools]);
  const detail = plugin.detail;
  const categories = detail?.businessCategories ?? [];

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="flex max-h-[86vh] w-[min(800px,calc(100vw-32px))] max-w-none flex-col gap-0 overflow-hidden rounded-xl border-slate-200 p-0 sm:max-w-[800px]">
        <DialogHeader className="border-b border-slate-200 px-6 pb-5 pt-6 pr-12">
          <div className="flex items-start gap-4 text-left">
            <div className={cn("grid size-12 shrink-0 place-items-center rounded-xl", plugin.kind === "mcp" ? "bg-amber-50 text-amber-500" : "bg-blue-50 text-blue-600")}>
              {plugin.kind === "mcp" ? <Server className="size-6" /> : <PlugZap className="size-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="break-words text-xl font-semibold text-slate-900">{plugin.name}</DialogTitle>
                {plugin.publisherScope === "system" ? <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">系统</span> : null}
              </div>
              <DialogDescription className="mt-2 line-clamp-2 text-left text-sm leading-6 text-slate-600">{plugin.description || "暂无简介"}</DialogDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Switch checked={plugin.enabled} onCheckedChange={onToggle} aria-label={`${plugin.name} 启用开关`} className="data-[state=checked]:bg-blue-600" />
            </div>
            {plugin.personalCreated ? <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => { onClose(); onEdit(plugin); }}>编辑配置</Button> : null}
          </div>
          <dl className={cn("mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-slate-100 pt-4 text-sm", plugin.personalCreated ? "sm:grid-cols-2" : "sm:grid-cols-4")}>
            <div><dt className="text-xs text-slate-400">插件类型</dt><dd className="mt-1 font-medium text-slate-800">{plugin.kind === "mcp" ? "MCP" : "OpenAPI"}</dd></div>
            {plugin.personalCreated ? <div><dt className="text-xs text-slate-400">添加时间</dt><dd className="mt-1 font-medium text-slate-800">{plugin.addedAt ?? plugin.updatedAt}</dd></div> : <>
              <div><dt className="text-xs text-slate-400">业务类型</dt><dd className="mt-1 font-medium text-slate-800">{categories.length ? categories.join("、") : "未分类"}</dd></div>
              <div><dt className="text-xs text-slate-400">更新时间</dt><dd className="mt-1 font-medium text-slate-800">{detail?.publishedAt ?? plugin.updatedAt}</dd></div>
              <div><dt className="text-xs text-slate-400">发布方</dt><dd className="mt-1 font-medium text-slate-800">{plugin.publisherScope === "organization" ? "组织" : plugin.publisherScope === "platform" ? "平台" : "系统"}</dd></div>
            </>}
          </dl>
          {plugin.origin === "builtin" ? <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3"><span className="text-sm font-medium text-slate-700">运行状态</span><PluginRuntimeStatus status={plugin.runtimeStatus} /><span className="text-xs text-slate-500">上次连接时间：{plugin.runtimeCheckedAt ?? "暂无记录"}</span></div> : <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="space-y-1"><div className="flex flex-wrap items-center gap-3">{plugin.enabled || plugin.connectionStatus === "checking" ? <><span className="text-sm font-medium text-slate-700">连接状态</span><PluginConnectionStatus status={plugin.connectionStatus} /></> : null}</div><p className="text-xs text-slate-500">最近检测时间：{plugin.lastConnectionCheckAt ?? "暂无有效检测记录"}</p>{plugin.lastConnectionCheckTimedOut ? <p role="status" className="text-xs text-amber-700">状态检测超时，请稍后重试</p> : null}</div>
            <Button type="button" variant="outline" size="sm" disabled={plugin.connectionStatus === "checking"} onClick={onTestConnection} className="h-8 border-slate-300 bg-white text-slate-700"><RefreshCw className={cn("mr-2 size-3.5", plugin.connectionStatus === "checking" && "animate-spin text-blue-600")} />{plugin.connectionStatus === "checking" ? "正在检测" : "测试连接"}</Button>
          </div>}
        </DialogHeader>

        {!plugin.personalCreated ? <div role="tablist" aria-label="插件详情内容" className="flex h-12 shrink-0 gap-7 border-b border-slate-200 px-6">
          <button type="button" role="tab" aria-selected={activeTab === "intro"} onClick={() => setActiveTab("intro")} className={cn("border-b-2 text-sm font-medium", activeTab === "intro" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}>插件介绍</button>
          <button type="button" role="tab" aria-selected={activeTab === "tools"} onClick={() => setActiveTab("tools")} className={cn("border-b-2 text-sm font-medium", activeTab === "tools" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}>工具列表</button>
        </div> : null}

        <div className={cn("overflow-y-auto px-6 py-5 sm:max-h-[48vh]", activeTab === "intro" && !plugin.personalCreated ? "min-h-[240px]" : "min-h-[160px]")}>
          {activeTab === "intro" ? (
            <div role="tabpanel" className="space-y-6 text-sm leading-6 text-slate-700">
              <section><h3 className="mb-2 text-sm font-semibold text-slate-900">能力说明</h3><p className="whitespace-pre-wrap">{detail?.overview || plugin.description || "暂无介绍"}</p></section>
              {detail?.usageSteps?.length ? <section className="border-t border-slate-100 pt-5"><h3 className="mb-2 text-sm font-semibold text-slate-900">如何使用</h3><ol className="list-decimal space-y-1 pl-5">{detail.usageSteps.map((step) => <li key={step}>{step}</li>)}</ol></section> : null}
              {detail?.features?.length || detail?.scenarios?.length ? <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                {detail?.features?.length ? <section className="rounded-lg bg-slate-50 p-4"><h3 className="mb-2 text-sm font-semibold text-slate-900">主要功能</h3><ul className="list-disc space-y-1 pl-5">{detail.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></section> : null}
                {detail?.scenarios?.length ? <section className="rounded-lg bg-slate-50 p-4"><h3 className="mb-2 text-sm font-semibold text-slate-900">使用场景</h3><ul className="list-disc space-y-1 pl-5">{detail.scenarios.map((scenario) => <li key={scenario}>{scenario}</li>)}</ul></section> : null}
              </div> : null}
            </div>
          ) : (
            <div role="tabpanel" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">共包含 {tools.length} 个工具</p>{tools.length > 8 ? <div className="relative w-full sm:w-56"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={toolQuery} onChange={(event) => setToolQuery(event.target.value)} placeholder="搜索工具" aria-label="搜索工具" className="h-8 pl-9 text-sm" /></div> : null}</div>
              {filteredTools.length ? <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">{filteredTools.map((tool) => <li key={tool.name} className="flex items-start gap-3 px-4 py-3"><Wrench className="mt-1 size-4 shrink-0 text-slate-400" /><div className="min-w-0"><p className="break-all text-sm font-medium text-slate-900">{tool.name}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-600">{tool.description || "暂无说明"}</p></div></li>)}</ul> : <div className="rounded-lg border border-dashed border-slate-200 px-5 py-12 text-center text-sm text-slate-500">{tools.length ? "没有匹配的工具" : "暂未提供工具信息"}</div>}
            </div>
          )}
        </div>
        {plugin.personalCreated ? <DialogFooter className="border-t border-slate-100 px-6 py-4"><Button type="button" variant="outline" onClick={onDelete} className="text-red-600 hover:text-red-700"><Trash2 className="mr-2 size-4" />删除插件</Button></DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
