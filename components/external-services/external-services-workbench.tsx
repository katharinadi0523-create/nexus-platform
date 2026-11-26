"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleHelp,
  Link2,
  Search,
  Settings2,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ServiceLogo } from "@/components/external-services/service-logo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EXTERNAL_SERVICE_CATALOG,
  EXTERNAL_SERVICE_WORKSPACES,
  useExternalServicesDemo,
  type ExternalServiceConnection,
} from "@/lib/external-services-demo";

type View = "catalog" | "connected";
type ServiceDialogView = "details" | "config";

export function ExternalServicesWorkbench({ embedded = false }: { embedded?: boolean }) {
  const { state, update, activeWorkspaceId } = useExternalServicesDemo();
  const [view, setView] = useState<View>("catalog");
  const [query, setQuery] = useState("");
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [dialogView, setDialogView] = useState<ServiceDialogView>("details");
  const [credential, setCredential] = useState("");
  const [tested, setTested] = useState(false);
  const [ownerScope, setOwnerScope] = useState<"personal" | "workspace">("workspace");

  const activeService = EXTERNAL_SERVICE_CATALOG.find((item) => item.id === activeServiceId);
  const activeWorkspace = EXTERNAL_SERVICE_WORKSPACES.find((workspace) => workspace.id === activeWorkspaceId);
  const currentWorkspaceConnections = state.connections.filter((connection) => connection.ownerScope === "personal" || connection.workspaceId === activeWorkspaceId);
  const activeConnection = currentWorkspaceConnections.find((item) => item.serviceId === activeServiceId);
  const filteredServices = useMemo(() => EXTERNAL_SERVICE_CATALOG.filter((service) =>
    `${service.name} ${service.description} ${service.vendor}`.toLowerCase().includes(query.toLowerCase())
  ), [query]);

  const openConnection = (serviceId: string) => {
    const connection = currentWorkspaceConnections.find((item) => item.serviceId === serviceId);
    setActiveServiceId(serviceId);
    setDialogView("config");
    setCredential("");
    setOwnerScope(connection?.ownerScope ?? "workspace");
    setTested(Boolean(connection?.credentialConfigured));
  };

  const openServiceDetails = (serviceId: string) => {
    setActiveServiceId(serviceId);
    setDialogView("details");
  };

  const runConnectionTest = () => {
    if (credential.trim().length < 4) {
      toast.error("请输入供应商提供的 Key 或 Token");
      return;
    }
    setTested(true);
    toast.success("连接测试通过");
  };

  const saveConnection = () => {
    if (!activeService) return;
    const previous = currentWorkspaceConnections.find((item) => item.serviceId === activeService.id);
    const suffix = credential.trim().slice(-4) || previous?.maskedCredential.slice(-4) || "8A3F";
    const connection: ExternalServiceConnection = {
      serviceId: activeService.id,
      workspaceId: activeWorkspaceId,
      ownerScope,
      enabled: true,
      credentialConfigured: true,
      maskedCredential: `••••••••${suffix}`,
      updatedAt: new Date().toISOString(),
    };
    update({
      connections: [connection, ...state.connections.filter((item) => item.serviceId !== activeService.id)],
    });
    setActiveServiceId(null);
    toast.success(ownerScope === "personal" ? "已配置个人连接" : `已在「${activeWorkspace?.name ?? "当前工作空间"}」接入服务`);
    setView("connected");
  };

  const toggleConnection = (serviceId: string) => {
    const connection = currentWorkspaceConnections.find((item) => item.serviceId === serviceId);
    if (!connection) return;
    update({
      connections: state.connections.map((item) => item.serviceId === serviceId
        ? { ...item, enabled: !item.enabled, updatedAt: new Date().toISOString() }
        : item),
    });
    toast.success(connection.enabled ? "连接已停用" : "连接已启用");
  };

  return (
    <div className={cn(embedded ? "space-y-5" : "min-h-full bg-slate-50 px-6 py-7 lg:px-8")}>
      <div className={cn("mx-auto space-y-6", embedded ? "max-w-none" : "max-w-6xl")}>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">{view === "catalog" ? "服务目录" : "连接管理"}</h2>
              {view === "connected" && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{currentWorkspaceConnections.length}</span>}
            </div>
            <div className="flex items-center gap-2">
              <label className="relative block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索服务" className="h-9 w-48 rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </label>
              <button onClick={() => setView(view === "catalog" ? "connected" : "catalog")} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {view === "catalog" ? <><Settings2 className="h-4 w-4" />连接管理</> : "返回服务目录"}
              </button>
            </div>
          </div>

          {view === "catalog" ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead className="bg-slate-50 text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-5 py-3">服务</th>
                    <th className="px-4 py-3">服务说明</th>
                    <th className="px-4 py-3">接入状态</th>
                    <th className="px-5 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredServices.map((service) => {
                const connection = currentWorkspaceConnections.find((item) => item.serviceId === service.id);
                const active = Boolean(connection?.enabled);
                const statusLabel = connection ? active ? "已接入" : "已停用" : "未接入";
                return <tr key={service.id} onClick={() => openServiceDetails(service.id)} className="cursor-pointer align-middle transition-colors hover:bg-blue-50/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3"><ServiceLogo src={service.logoSrc} className="h-10 w-10 rounded-lg" /><div><button onClick={() => openServiceDetails(service.id)} className="text-left font-medium text-slate-900 hover:text-blue-700">{service.name}</button><div className="mt-1 text-xs text-blue-600">{service.vendor}</div></div></div>
                  </td>
                  <td className="max-w-sm px-4 py-4 text-sm leading-5 text-slate-600">{service.description}</td>
                  <td className="px-4 py-4"><span className={cn("inline-flex items-center gap-1.5 text-sm", active ? "text-emerald-700" : "text-slate-500")}>{active ? <CheckCircle2 className="h-4 w-4" /> : connection ? <Unplug className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}{statusLabel}</span></td>
                  <td className="px-5 py-4 text-right"><button onClick={(event) => { event.stopPropagation(); if (connection) setView("connected"); else openConnection(service.id); }} className={cn("rounded-md px-3 py-2 text-sm font-medium", connection ? "text-blue-700 hover:bg-blue-50" : "bg-blue-600 text-white hover:bg-blue-700")}>{connection ? "查看连接" : "配置连接"}</button></td>
                </tr>;
                  })}
                  {filteredServices.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-500">没有找到匹配的服务</td></tr>}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5">
              {currentWorkspaceConnections.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center"><Link2 className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 text-sm font-medium text-slate-800">暂无连接</p></div> : <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-[minmax(180px,1.5fr)_minmax(160px,1fr)_minmax(150px,1fr)_170px] gap-4 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500"><span>服务</span><span>连接状态</span><span>资源归属</span><span className="text-right">操作</span></div>
                {currentWorkspaceConnections.map((connection) => {
                  const service = EXTERNAL_SERVICE_CATALOG.find((item) => item.id === connection.serviceId);
                  if (!service || !`${service.name} ${service.description}`.toLowerCase().includes(query.toLowerCase())) return null;
                  return <div key={connection.serviceId} className="grid grid-cols-[minmax(180px,1.5fr)_minmax(160px,1fr)_minmax(150px,1fr)_170px] items-center gap-4 border-t border-slate-100 px-4 py-4 text-sm">
                    <div className="flex items-center gap-3"><ServiceLogo src={service.logoSrc} className="h-10 w-10 rounded-lg" /><div><div className="font-medium text-slate-900">{service.name}</div><div className="mt-0.5 text-xs text-slate-500">{connection.maskedCredential}</div></div></div>
                    <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-1 text-xs", connection.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{connection.enabled ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Unplug className="h-3.5 w-3.5" />}{connection.enabled ? "已启用" : "已停用"}</span>
                    <span className="text-slate-600">{connection.ownerScope === "personal" ? "个人" : "当前工作空间"}</span>
                    <div className="flex justify-end gap-3"><button onClick={() => openConnection(connection.serviceId)} className="text-sm font-medium text-blue-600 hover:text-blue-700">管理</button><button onClick={() => toggleConnection(connection.serviceId)} className="text-sm text-slate-500 hover:text-slate-800">{connection.enabled ? "停用" : "启用"}</button></div>
                  </div>;
                })}
              </div>}
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-800"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0" />停用当前 workspace 的连接后，该空间内的后续调用将不可用；已配置的智能体仍保留工具依赖。</div>
            </div>
          )}
        </section>

      </div>

      <Dialog open={Boolean(activeService)} onOpenChange={(open) => { if (!open) setActiveServiceId(null); }}>
        {activeService && <DialogContent className={cn("flex max-h-[88vh] flex-col gap-0 overflow-hidden rounded-xl border-slate-200 p-0", dialogView === "details" ? "w-[min(800px,calc(100vw-32px))] max-w-none sm:max-w-[800px]" : "sm:max-w-[720px]")}>
          {dialogView === "details" ? <>
            <DialogHeader className="shrink-0 border-b border-slate-200 px-6 pb-5 pt-6 pr-12 text-left">
              <div className="flex items-start gap-4">
                <ServiceLogo src={activeService.logoSrc} className="h-12 w-12 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <DialogTitle className="break-words text-xl font-semibold text-slate-900">{activeService.name}</DialogTitle>
                  <DialogDescription className="mt-2 line-clamp-2 text-left text-sm leading-6 text-slate-600">{activeService.description}</DialogDescription>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
                <div><dt className="text-xs text-slate-400">服务类型</dt><dd className="mt-1 font-medium text-slate-800">第三方 MCP</dd></div>
                <div><dt className="text-xs text-slate-400">服务商</dt><dd className="mt-1 break-words font-medium text-slate-800">{activeService.vendor}</dd></div>
                <div><dt className="text-xs text-slate-400">业务分类</dt><dd className="mt-1 font-medium text-slate-800">{activeService.category}</dd></div>
              </dl>
            </DialogHeader>
            <div className="min-h-[220px] flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:max-h-[48vh]">
              <section>
                <h3 className="text-sm font-semibold text-slate-900">可用能力</h3>
                <ul className="mt-3 divide-y divide-slate-100">{activeService.capabilities.map((capability) => <li key={capability} className="flex items-start gap-3 py-3 text-sm leading-6 text-slate-700"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-600" />{capability}</li>)}</ul>
              </section>
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800"><ShieldCheck className="mt-1 h-4 w-4 shrink-0" />可配置为个人使用或当前工作空间使用；个人连接仅本人可用，工作空间连接遵循空间现有权限。凭证由创建者保管，其他成员不能查看明文。</div>
            </div>
            <DialogFooter className="shrink-0 border-t border-slate-100 px-6 py-4 sm:justify-between">
              <button onClick={() => setActiveServiceId(null)} className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">关闭</button>
              <button onClick={() => { if (activeConnection) { setActiveServiceId(null); setView("connected"); } else { openConnection(activeService.id); } }} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">{activeConnection ? "查看连接" : "配置并接入"}</button>
            </DialogFooter>
          </> : <>
            <DialogHeader className="border-b border-slate-100 px-6 py-5 pr-14">
              <div className="flex items-center gap-3"><ServiceLogo src={activeService.logoSrc} className="h-11 w-11 rounded-lg" /><div><div className="text-xs font-medium text-blue-700">{activeConnection ? "管理连接" : "配置连接"} · MCP 服务</div><DialogTitle className="mt-1 text-xl text-slate-900">{activeService.name}</DialogTitle></div></div>
              <DialogDescription className="pt-2 text-sm text-slate-500">选择连接的使用范围，并配置供应商凭证。</DialogDescription>
            </DialogHeader>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <section className="space-y-5">
                <fieldset className="mt-4">
                  <legend className="text-sm font-medium text-slate-800">资源归属</legend>
                  <div className="mt-3 flex flex-wrap gap-x-7 gap-y-3">
                    {([{ value: "personal", label: "个人" }, { value: "workspace", label: "当前工作空间" }] as const).map((option) => <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                      <input type="radio" name="resource-owner-scope" value={option.value} checked={ownerScope === option.value} onChange={() => setOwnerScope(option.value)} className="h-4 w-4 accent-blue-600" />
                      <span>{option.label}</span>
                    </label>)}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">个人连接仅本人可用；工作空间连接供当前空间内具备权限的成员使用。</p>
                </fieldset>
                <label htmlFor="service-credential" className="mt-4 block text-sm font-medium text-slate-800">供应商凭证</label>
                <div className="mt-2 flex items-center gap-2">
                  <input id="service-credential" type="password" value={credential} onChange={(event) => { setCredential(event.target.value); setTested(false); }} placeholder={activeConnection?.maskedCredential ?? (activeService.connectionMethod.includes("OAuth") ? "粘贴服务商授权凭证或 Access Token" : `粘贴 ${activeService.name} 提供的 API Key 或 Token`)} className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                  <button onClick={runConnectionTest} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">{tested && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}{tested ? "测试通过" : "测试连接"}</button>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">凭证由连接创建者保管；{ownerScope === "personal" ? "仅本人可使用。" : "工作空间成员仅能调用，不能查看或复制凭证。"}</p>
              </section>
            </div>
            <DialogFooter className="items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button onClick={() => setActiveServiceId(null)} className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">取消</button>
              <button onClick={saveConnection} disabled={!tested} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">保存连接</button>
            </DialogFooter>
          </>}
        </DialogContent>}
      </Dialog>
    </div>
  );
}
