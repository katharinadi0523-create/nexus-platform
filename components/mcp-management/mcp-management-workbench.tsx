"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Cable, ChevronDown, CircleDot, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ExternalServicesWorkbench } from "@/components/external-services/external-services-workbench";

type MCPStatus = "已上架" | "未上架" | "审核中";

const initialServices: { name: string; description: string; creator: string; updatedAt: string; status: MCPStatus }[] = [
  { name: "项目管理系统", description: "园区数据中台建设项目的任务、里程碑、验收、风险、工时及设备上报数据查询", creator: "林晓", updatedAt: "2026-11-18 10:16", status: "已上架" },
  { name: "企业知识库 MCP", description: "检索企业内部知识库中的文档与项目资料", creator: "陈佳", updatedAt: "2026-11-17 16:42", status: "已上架" },
  { name: "测试 MCP", description: "用于联调的自定义 MCP 服务", creator: "王晨", updatedAt: "2026-11-15 09:30", status: "审核中" },
  { name: "供应商查询", description: "查询供应商基础信息及合作记录", creator: "周敏", updatedAt: "2026-11-12 14:05", status: "未上架" },
];

const statusStyles: Record<MCPStatus, string> = {
  "已上架": "bg-emerald-50 text-emerald-700",
  "未上架": "bg-slate-100 text-slate-600",
  "审核中": "bg-amber-50 text-amber-700",
};

export function MCPManagementWorkbench({ activeTab }: { activeTab: "custom" | "external" }) {
  const [query, setQuery] = useState("");
  const [services, setServices] = useState(initialServices);
  const [statusFilter, setStatusFilter] = useState<"全部状态" | MCPStatus>("全部状态");
  const filteredServices = useMemo(() => services.filter((service) => {
    const matchesQuery = `${service.name} ${service.description} ${service.creator}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (statusFilter === "全部状态" || service.status === statusFilter);
  }), [query, services, statusFilter]);

  const changeStatus = (name: string, status: MCPStatus) => {
    setServices((current) => current.map((service) => service.name === name ? { ...service, status } : service));
    toast.success(status === "未上架" ? `「${name}」已下架` : `「${name}」已上架`);
  };

  return (
    <div className="min-h-full bg-white">
      <div className="border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">MCP管理</h1>
      </div>
      <div className="px-6 py-7 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">

        <div className="border-b border-slate-200">
          <nav aria-label="MCP 服务类型" className="flex gap-7">
            <Link href="/mcp-management" aria-current={activeTab === "external" ? "page" : undefined} className={cn("relative -mb-px inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors", activeTab === "external" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800")}>
              外部服务 <Cable className="h-3.5 w-3.5" />
            </Link>
            <Link href="/mcp-management/custom" aria-current={activeTab === "custom" ? "page" : undefined} className={cn("relative -mb-px inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors", activeTab === "custom" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800")}>
              自建服务 <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{services.length}</span>
            </Link>
          </nav>
        </div>

        {activeTab === "external" ? <ExternalServicesWorkbench embedded /> : <>
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索自建 MCP 服务" className="h-9 w-64 rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="relative">
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-9 appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-700 outline-none focus:border-blue-400">
                    {(["全部状态", "已上架", "未上架", "审核中"] as const).map((status) => <option key={status}>{status}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </label>
              </div>
              <button onClick={() => toast.info("沿用现有自建 MCP 创建流程")} className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3.5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" />创建 MCP 服务</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead className="bg-slate-50 text-xs font-medium text-slate-500">
                  <tr><th className="px-5 py-3">服务名称</th><th className="px-4 py-3">上架状态</th><th className="px-4 py-3">服务描述</th><th className="px-4 py-3">创建人</th><th className="px-4 py-3">更新时间</th><th className="px-5 py-3 text-right">操作</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredServices.map((service) => <tr key={service.name} className="align-middle hover:bg-slate-50/70">
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-50 text-orange-500"><Cable className="h-4 w-4" /></span><span className="font-medium text-slate-900">{service.name}</span></div></td>
                    <td className="px-4 py-4"><span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs", statusStyles[service.status])}><CircleDot className="h-3 w-3" />{service.status}</span></td>
                    <td className="max-w-sm px-4 py-4 text-sm leading-5 text-slate-600">{service.description}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{service.creator}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{service.updatedAt}</td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-3 text-sm font-medium"><button onClick={() => toast.info(`打开「${service.name}」详情`)} className="text-blue-600 hover:text-blue-700">详情</button>{service.status === "已上架" ? <button onClick={() => changeStatus(service.name, "未上架")} className="text-slate-600 hover:text-slate-900">下架</button> : service.status === "未上架" ? <button onClick={() => changeStatus(service.name, "已上架")} className="text-blue-600 hover:text-blue-700">上架</button> : <span className="text-slate-400">审核中</span>}</div></td>
                  </tr>)}
                  {filteredServices.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">没有找到匹配的 MCP 服务</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500"><span>共 {filteredServices.length} 项</span></div>
          </section>
        </>}
      </div>
      </div>
    </div>
  );
}
