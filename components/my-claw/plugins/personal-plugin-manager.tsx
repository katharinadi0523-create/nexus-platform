"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { ArrowLeft, Grid2X2, List, PlugZap, Search, Server } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { checkPluginConnection, currentLocalTime } from "@/lib/mock/my-claw/plugin-connection-check";
import type { MinePluginItem } from "@/lib/mock/my-claw/plugins";
import { cn } from "@/lib/utils";
import { PersonalPluginDetailDialog } from "./personal-plugin-detail-dialog";
import { PluginConnectionStatus, PluginRuntimeStatus } from "./plugin-connection-status";

function sourceOf(plugin: MinePluginItem): "platform" | "personal" {
  return plugin.personalCreated ? "personal" : "platform";
}

function getDisplayedStatus(plugin: MinePluginItem) {
  if (plugin.origin === "builtin") return <PluginRuntimeStatus status={plugin.runtimeStatus} />;
  if (!plugin.enabled && plugin.connectionStatus !== "checking") return null;
  return <PluginConnectionStatus status={plugin.connectionStatus} />;
}

export function PersonalPluginManager({ plugins, onPluginsChange, onBack, onEdit }: {
  plugins: MinePluginItem[];
  onPluginsChange: Dispatch<SetStateAction<MinePluginItem[]>>;
  onBack: () => void;
  onEdit: (plugin: MinePluginItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [viewing, setViewing] = useState<MinePluginItem | null>(null);
  const [removing, setRemoving] = useState<MinePluginItem | null>(null);
  const [blockedRemoval, setBlockedRemoval] = useState<MinePluginItem | null>(null);

  const updatePlugin = (pluginId: string, patch: Partial<MinePluginItem>) => {
    onPluginsChange((current) => current.map((item) => item.id === pluginId ? { ...item, ...patch } : item));
    setViewing((current) => current?.id === pluginId ? { ...current, ...patch } : current);
  };
  const openPluginDetail = (plugin: MinePluginItem) => {
    setViewing(plugin);
    if (plugin.origin !== "builtin" && plugin.enabled && plugin.connectionStatus !== "checking") void runCheck(plugin);
  };

  const filteredRows = useMemo(() => plugins.filter((plugin) => {
    const matchesQuery = `${plugin.name} ${plugin.description}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery;
  }).sort((a, b) => {
    const timestamp = (plugin: MinePluginItem) => Date.parse(plugin.addedAt ?? plugin.updatedAt) || 0;
    return timestamp(b) - timestamp(a);
  }), [plugins, query]);
  const platformRows = filteredRows.filter((plugin) => sourceOf(plugin) === "platform");
  const personalRows = filteredRows.filter((plugin) => sourceOf(plugin) === "personal");
  const hasPersonalPlugins = plugins.some((plugin) => plugin.personalCreated);

  const runCheck = async (plugin: MinePluginItem, enabling = false) => {
    const previousStatus = plugin.lastValidConnectionStatus;
    updatePlugin(plugin.id, { connectionStatus: "checking", lastConnectionCheckTimedOut: false });
    const outcome = await checkPluginConnection(plugin);
    if (outcome === "timeout") {
      updatePlugin(plugin.id, {
        enabled: enabling ? false : plugin.enabled,
        connectionStatus: previousStatus,
        lastConnectionCheckTimedOut: true,
      });
      toast.error("状态检测超时，请稍后重试");
      return;
    }
    updatePlugin(plugin.id, {
      enabled: enabling ? outcome === "connected" : plugin.enabled,
      connectionStatus: outcome,
      lastValidConnectionStatus: outcome,
      lastConnectionCheckAt: currentLocalTime(),
      lastConnectionCheckTimedOut: false,
    });
    toast[outcome === "connected" ? "success" : "error"](outcome === "connected" ? `「${plugin.name}」连接正常` : `「${plugin.name}」连接失败`);
  };

  const toggle = (plugin: MinePluginItem, enabled: boolean) => {
    if (!enabled) {
      updatePlugin(plugin.id, { enabled: false, connectionStatus: undefined, lastConnectionCheckTimedOut: false });
      toast.success(`已停用「${plugin.name}」`);
      return;
    }
    if (plugin.origin === "builtin") {
      updatePlugin(plugin.id, { enabled: true });
      toast.success(`已启用「${plugin.name}」`);
      return;
    }
    void runCheck({ ...plugin, enabled: false }, true);
  };

  const testConnection = (plugin: MinePluginItem) => { void runCheck(plugin); };

  const requestRemove = (plugin: MinePluginItem) => {
    if (plugin.origin === "builtin") return;
    if ((plugin.activeToolCalls ?? 0) > 0) setBlockedRemoval(plugin);
    else setRemoving(plugin);
  };

  const remove = () => {
    if (!removing || removing.origin === "builtin") return;
    onPluginsChange((current) => current.filter((item) => item.id !== removing.id));
    setViewing((current) => current?.id === removing.id ? null : current);
    toast.success(removing.personalCreated ? `已删除「${removing.name}」` : `已从当前账号移除「${removing.name}」`);
    setRemoving(null);
  };

  const renderEmpty = () => <div className="rounded-md border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">没有匹配的插件。</div>;
  const renderCards = (items: MinePluginItem[]) => items.length ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {items.map((plugin) => <article key={plugin.id} className="group relative flex min-h-[190px] flex-col rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 focus-within:border-blue-300">
      <button type="button" onClick={() => openPluginDetail(plugin)} aria-label={`查看插件「${plugin.name}」`} className="absolute inset-0 z-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500" />
      <div className="pointer-events-none relative flex items-start gap-3">
        <div className={cn("grid size-11 shrink-0 place-items-center rounded-lg", plugin.kind === "mcp" ? "bg-amber-50 text-amber-500" : "bg-blue-50 text-blue-600")}>{plugin.kind === "mcp" ? <Server className="size-5" /> : <PlugZap className="size-5" />}</div>
        <div className="min-w-0 flex-1"><h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold leading-6 text-slate-900"><span className="truncate">{plugin.name}</span></h3><p className="truncate text-xs text-slate-400">{plugin.personalCreated ? `添加于 ${(plugin.addedAt ?? plugin.updatedAt).split(" ")[0]}` : <>{plugin.creator} <span className="mx-1 text-slate-300">|</span>{plugin.updatedAt.split(" ")[0]} 更新</>}</p></div>
        <div className="pointer-events-auto relative z-10 shrink-0"><Switch checked={plugin.enabled} disabled={plugin.connectionStatus === "checking"} onCheckedChange={(checked) => toggle(plugin, checked)} aria-label={`${plugin.name} 启用开关`} className="data-[state=checked]:bg-blue-600" /></div>
      </div>
      <p className="pointer-events-none relative mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{plugin.description || "暂无描述"}</p>
      <div className="pointer-events-none relative mt-auto flex min-h-8 items-end justify-between gap-3 pt-3"><div className="flex flex-wrap items-center gap-3">{!["租户配置", "Claw配置"].includes(plugin.badge) ? <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{plugin.badge || (plugin.kind === "mcp" ? "MCP" : "OpenAPI")}</span> : null}{getDisplayedStatus(plugin)}</div><div className="pointer-events-none relative z-10 flex gap-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100"><Button type="button" variant="outline" size="sm" onClick={() => openPluginDetail(plugin)} className="h-8 border-slate-300 bg-white px-3 text-xs text-slate-700">查看</Button>{plugin.origin !== "builtin" ? <Button type="button" variant="outline" size="sm" onClick={() => requestRemove(plugin)} className="h-8 border-slate-300 bg-white px-3 text-xs text-slate-700">{plugin.personalCreated ? "删除" : "移除"}</Button> : null}</div></div>
    </article>)}
  </div> : renderEmpty();

  const renderList = (items: MinePluginItem[]) => items.length ? <div className="overflow-hidden rounded-md border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-slate-50 text-slate-700"><tr><th className="h-10 px-4 font-medium">名称</th><th className="h-10 px-4 font-medium">启用状态</th><th className="h-10 px-4 font-medium">连接状态</th><th className="h-10 px-4 font-medium">描述</th><th className="h-10 px-4 font-medium">创建人</th><th className="h-10 px-4 font-medium">操作</th></tr></thead><tbody>{items.map((plugin, index) => <tr key={plugin.id} className={cn("border-t border-slate-200 transition-colors hover:bg-slate-50", index % 2 === 1 && "bg-slate-50/60")}>
    <td className="max-w-[280px] px-4 py-3 align-middle"><button type="button" onClick={() => openPluginDetail(plugin)} aria-label={`查看插件「${plugin.name}」`} className="flex w-full flex-wrap items-center gap-1.5 text-left"><span className="font-medium text-slate-900 hover:text-blue-700">{plugin.name}</span><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{plugin.kind === "mcp" ? "MCP" : "OpenAPI"}</span></button></td>
    <td className="px-4 py-3 align-middle"><Switch checked={plugin.enabled} disabled={plugin.connectionStatus === "checking"} onCheckedChange={(checked) => toggle(plugin, checked)} aria-label={`${plugin.name} 启用开关`} className="data-[state=checked]:bg-blue-600" /></td><td className="px-4 py-3 align-middle">{getDisplayedStatus(plugin)}</td><td className="max-w-[420px] px-4 py-3 align-middle text-slate-600"><p className="line-clamp-2 leading-6">{plugin.description || "暂无描述"}</p></td><td className="whitespace-nowrap px-4 py-3 align-middle text-slate-700">{plugin.personalCreated ? "—" : plugin.creator}</td><td className="whitespace-nowrap px-4 py-3 align-middle"><div className="flex items-center gap-3">{plugin.personalCreated ? <button type="button" onClick={() => onEdit(plugin)} className="text-blue-600 hover:text-blue-700">编辑</button> : null}{plugin.origin !== "builtin" ? <button type="button" onClick={() => requestRemove(plugin)} className="text-blue-600 hover:text-red-600">{plugin.personalCreated ? "删除" : "移除"}</button> : null}</div></td>
    </tr>)}</tbody></table></div></div> : renderEmpty();

  const renderSection = (title: string, items: MinePluginItem[]) => <section className="mb-7 space-y-3"><h2 className="text-sm font-semibold text-slate-800">{title}</h2>{viewMode === "grid" ? renderCards(items) : renderList(items)}</section>;

  return <div className="mx-auto w-full max-w-[1440px] px-4 py-5 md:px-6">
    <header className="mb-5 flex items-start gap-3"><Button variant="outline" size="icon" aria-label="返回插件发现" onClick={onBack} className="h-9 w-9 shrink-0 rounded-md border-slate-200 bg-white"><ArrowLeft className="size-4" /></Button><div><h1 className="text-[20px] font-medium leading-9 text-slate-900">我的插件</h1><p className="text-xs text-slate-500">管理已接入的插件及其连接状态。</p></div></header>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full min-w-[220px] sm:max-w-[300px]"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索插件名称" className="h-8 rounded border-slate-200 bg-white pl-9 text-sm shadow-none" aria-label="搜索已添加插件" /></div><div className="inline-flex h-8 shrink-0 self-end items-center rounded border border-slate-200 bg-white p-0.5"><Button type="button" variant="ghost" size="icon" aria-label="表格展示" title="表格展示" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")} className={cn("h-7 w-7 rounded-sm", viewMode === "list" && "bg-blue-50 text-blue-600")}><List className="size-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="卡片展示" title="卡片展示" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")} className={cn("h-7 w-7 rounded-sm", viewMode === "grid" && "bg-blue-50 text-blue-600")}><Grid2X2 className="size-4" /></Button></div></div>
    {hasPersonalPlugins ? renderSection("自定义", personalRows) : null}{renderSection("平台与组织", platformRows)}
    <p className="mt-3 text-right text-xs text-slate-500">当前 Demo 中的变更仅保存在页面状态</p>
    {viewing ? <PersonalPluginDetailDialog key={viewing.id} plugin={viewing} onClose={() => setViewing(null)} onEdit={onEdit} onToggle={(enabled) => toggle(viewing, enabled)} onTestConnection={() => testConnection(viewing)} onDelete={() => requestRemove(viewing)} /> : null}
    <Dialog open={!!blockedRemoval} onOpenChange={(open) => { if (!open) setBlockedRemoval(null); }}><DialogContent className="sm:max-w-[420px]"><DialogHeader><DialogTitle>暂时无法删除</DialogTitle><DialogDescription>「{blockedRemoval?.name}」正在处理请求，请等待执行完成后删除。</DialogDescription></DialogHeader><DialogFooter><Button onClick={() => setBlockedRemoval(null)}>我知道了</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={!!removing} onOpenChange={(open) => { if (!open) setRemoving(null); }}><DialogContent className="sm:max-w-[420px]"><DialogHeader><DialogTitle>{removing?.personalCreated ? "删除插件" : "移除插件"}</DialogTitle><DialogDescription>{removing?.personalCreated ? `确定删除自定义插件「${removing.name}」吗？` : `确定从当前账号移除「${removing?.name}」吗？插件广场中的资源不会受影响。`}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setRemoving(null)}>取消</Button><Button variant="destructive" onClick={remove}>{removing?.personalCreated ? "删除" : "移除"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
