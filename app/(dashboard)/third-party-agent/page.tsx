"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { SecurityLevelBadge } from "@/components/security/security-level-badge";
import {
  CreatedThirdPartyAgent,
  ThirdPartyAgentCreateDialog,
} from "@/components/third-party-agent/third-party-agent-create-dialog";
import { ThirdPartyAgentDeregisterDialog } from "@/components/third-party-agent/third-party-agent-deregister-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  THIRD_PARTY_AGENTS,
  type ThirdPartyAgentProtocol,
  type ThirdPartyAgentRecord,
  type ThirdPartyAgentStatus,
} from "@/lib/mock/third-party-agents";
import {
  CURRENT_USER_SECURITY_LEVEL,
  getSecurityLevelRank,
  type SecurityLevel,
} from "@/lib/security-level";
import { cn } from "@/lib/utils";

const PROTOCOL_OPTIONS = [
  { value: "all", label: "全部协议" },
  { value: "A2A", label: "A2A" },
  { value: "OpenAI API", label: "API" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "全部平台状态" },
  { value: "已启用", label: "已启用" },
  { value: "已停用", label: "已停用" },
];

const REFERENCE_CALLERS: Array<{
  id: string;
  type: "Claw" | "多智能体" | "工作流智能体";
  name: string;
  description: string;
  securityLevel: SecurityLevel;
}> = [
  { id: "claw", type: "Claw", name: "科研分析 Claw", description: "在任务执行中按需选择并调用外部能力。", securityLevel: "秘密" },
  { id: "multi-agent", type: "多智能体", name: "客户风险研判组", description: "由协作角色在任务编排中引用第三方 Agent。", securityLevel: "秘密" },
  { id: "workflow-agent", type: "工作流智能体", name: "合同审查工作流", description: "通过智能体节点选择第三方 Agent，选中后直接生成并配置调用节点。", securityLevel: "机密" },
];

export default function ThirdPartyAgentPage() {
  const [agents, setAgents] = useState<ThirdPartyAgentRecord[]>(THIRD_PARTY_AGENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [protocolFilter, setProtocolFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [securityFilters, setSecurityFilters] = useState<SecurityLevel[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ThirdPartyAgentRecord | null>(null);
  const [deregisterTarget, setDeregisterTarget] = useState<ThirdPartyAgentRecord | null>(null);

  const visibleAgents = useMemo(() => agents.filter((agent) =>
    agent.usePermission && getSecurityLevelRank(agent.securityLevel) <= getSecurityLevelRank(CURRENT_USER_SECURITY_LEVEL)
  ), [agents]);

  const filteredAgents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return visibleAgents.filter((agent) => {
      const matchesQuery = !query || [agent.name, agent.description, agent.interfaceSpec].some((value) => value.toLowerCase().includes(query));
      const matchesProtocol = protocolFilter === "all" || agent.protocol === protocolFilter;
      const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
      const matchesSecurity = securityFilters.length === 0 || securityFilters.includes(agent.securityLevel);
      return matchesQuery && matchesProtocol && matchesStatus && matchesSecurity;
    });
  }, [protocolFilter, searchQuery, securityFilters, statusFilter, visibleAgents]);

  const handleCreated = (created: CreatedThirdPartyAgent) => {
    const record: ThirdPartyAgentRecord = {
      id: `external-${Date.now()}`,
      name: created.name,
      description: created.description,
      protocol: created.protocol,
      interfaceSpec: created.interfaceSpec,
      modelIdentifier: created.modelIdentifier,
      botId: created.botId,
      status: "已启用",
      connectionStatus: "正常",
      securityLevel: created.securityLevel,
      owner: "当前用户",
      endpoint: created.endpoint,
      agentCardSource: created.agentCardSource,
      agentCardJson: created.agentCardJson,
      authMode: created.authMode,
      authConfig: created.authConfig,
      declaredVersion: created.declaredVersion,
      skills: created.skills,
      referenceCount: 0,
      updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      lastCheckedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      usePermission: true,
      references: [],
      callRecords: [],
      operationRecords: [],
    };
    setAgents((current) => [record, ...current]);
  };

  const confirmStatusChange = () => {
    if (!confirmTarget) return;
    const nextStatus: ThirdPartyAgentStatus = confirmTarget.status === "已启用" ? "已停用" : "已启用";
    setAgents((current) => current.map((agent) => agent.id === confirmTarget.id ? { ...agent, status: nextStatus, updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }) } : agent));
    toast.success(nextStatus === "已启用" ? "已重新启用，可恢复平台内调用。" : "已停用，已有引用保留；新调用已禁止，已开始的异步任务继续执行。");
    setConfirmTarget(null);
  };

  const requestDeregister = (agent: ThirdPartyAgentRecord) => {
    setDeregisterTarget(agent);
  };

  const confirmDeregister = () => {
    if (!deregisterTarget) return;
    const pendingTasks = deregisterTarget.callRecords.filter((record) => record.result === "处理中");
    if (deregisterTarget.referenceCount > 0 || pendingTasks.length > 0) return;
    const agent = deregisterTarget;
    toast.success(`已注销平台登记：${agent.name}。外部服务未受影响。`);
    setAgents((current) => current.filter((item) => item.id !== agent.id));
    setDeregisterTarget(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[30px] font-semibold leading-none text-slate-950">第三方 Agent</h1>
            <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">外部运行 · AF 纳管</span>
          </div>
          <p className="mt-3 text-sm text-slate-500">统一登记通过 A2A 或平台支持的原生 API 提供服务的外部 Agent。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" />登记第三方 Agent
          </Button>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-[320px]">
              <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="搜索名称、描述或接口类型" className="h-9 pr-9" />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <Select value={protocolFilter} onValueChange={setProtocolFilter} options={PROTOCOL_OPTIONS} className="w-36" />
            <Select value={statusFilter} onValueChange={setStatusFilter} options={STATUS_OPTIONS} className="w-40" />
            <SecurityFilter values={securityFilters} onChange={setSecurityFilters} />
          </div>
          <Button variant="outline" size="icon" onClick={() => toast.success("列表已刷新，外部运行状态不受影响。") } className="h-9 w-9"><RefreshCw className="h-4 w-4" /></Button>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[960px]">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="min-w-[240px]">名称</TableHead>
                <TableHead>接入方式</TableHead>
                <TableHead>密级</TableHead>
                <TableHead>平台状态</TableHead>
                <TableHead>引用数</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="w-20 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => {
                return (
                  <TableRow key={agent.id} className="hover:bg-slate-50/70">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", agent.protocol === "A2A" ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600")}><Bot className="h-5 w-5" /></div>
                        <div className="min-w-0">
                          <Link href={`/third-party-agent/${agent.id}`} className="font-medium text-slate-900 hover:text-blue-600">{agent.name}</Link>
                          <p className="mt-1 max-w-[330px] truncate text-xs text-slate-500">{agent.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><div className="space-y-1"><ProtocolBadge protocol={agent.protocol} />{agent.protocol !== "A2A" ? <div className="text-xs text-slate-500">{formatInterfaceSpec(agent.interfaceSpec)}</div> : null}</div></TableCell>
                    <TableCell><SecurityLevelBadge level={agent.securityLevel} /></TableCell>
                    <TableCell><StatusBadge status={agent.status} /></TableCell>
                    <TableCell className="text-slate-700">{agent.referenceCount}</TableCell>
                    <TableCell className="text-sm text-slate-600">{agent.updatedAt}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onSelect={() => setConfirmTarget(agent)}>{agent.status === "已启用" ? "停用" : "重新启用"}</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => requestDeregister(agent)} className="text-rose-600 focus:text-rose-600">注销登记</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredAgents.length === 0 ? <TableRow><TableCell colSpan={8} className="py-14 text-center text-slate-500">暂无符合条件的第三方 Agent</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500"><span>共 {filteredAgents.length} 条</span><span>当前用户密级上限：{CURRENT_USER_SECURITY_LEVEL}</span></div>
      </section>

      <ThirdPartyAgentCreateDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
      <ReferencePreviewDialog open={referenceOpen} onOpenChange={setReferenceOpen} agents={visibleAgents} />

      <Dialog open={Boolean(confirmTarget)} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader><DialogTitle>{confirmTarget?.status === "已启用" ? "停用第三方 Agent？" : "重新启用第三方 Agent？"}</DialogTitle><DialogDescription className="pt-2 leading-6">{confirmTarget?.status === "已启用" ? "停用后已有引用关系保留，AF 将禁止发起新的调用；已开始的异步任务继续执行，外部 Agent 不受影响。" : "重新启用后，已有引用立即恢复调用。仅当关键接入配置发生变化时，才需要重新校验。"}</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setConfirmTarget(null)}>取消</Button><Button onClick={confirmStatusChange} className="bg-blue-600 text-white hover:bg-blue-700">确认{confirmTarget?.status === "已启用" ? "停用" : "启用"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ThirdPartyAgentDeregisterDialog
        open={Boolean(deregisterTarget)}
        onOpenChange={(open) => !open && setDeregisterTarget(null)}
        agentName={deregisterTarget?.name ?? ""}
        referenceCount={deregisterTarget?.referenceCount ?? 0}
        pendingTaskIds={(deregisterTarget?.callRecords ?? [])
          .filter((record) => record.result === "处理中")
          .map((record) => record.externalTaskId ?? record.executionId)}
        detailHref={deregisterTarget ? `/third-party-agent/${deregisterTarget.id}` : undefined}
        onConfirm={confirmDeregister}
      />
    </div>
  );
}

function ProtocolBadge({ protocol }: { protocol: ThirdPartyAgentProtocol }) {
  return <span className={cn("inline-flex rounded px-2 py-1 text-xs font-medium", protocol === "A2A" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700")}>{protocol === "A2A" ? "A2A" : "API"}</span>;
}

function formatInterfaceSpec(interfaceSpec: ThirdPartyAgentRecord["interfaceSpec"]): string {
  if (interfaceSpec === "Chat Completions") return "OpenAI Chat Completions";
  if (interfaceSpec === "Responses") return "OpenAI Responses";
  return interfaceSpec;
}

function StatusBadge({ status }: { status: ThirdPartyAgentStatus }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium", status === "已启用" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}><span className={cn("h-1.5 w-1.5 rounded-full", status === "已启用" ? "bg-emerald-500" : "bg-slate-400")} />{status}</span>;
}

function SecurityFilter({ values, onChange }: { values: SecurityLevel[]; onChange: (values: SecurityLevel[]) => void }) {
  const options: SecurityLevel[] = ["公开", "内部", "秘密", "机密", "绝密"];
  return <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("h-9 border-slate-300 bg-white", values.length > 0 && "border-blue-300 bg-blue-50 text-blue-700")}><Filter className="h-4 w-4" />密级{values.length > 0 ? ` (${values.length})` : ""}</Button></PopoverTrigger><PopoverContent align="start" className="w-48 p-3"><div className="mb-2 text-sm font-medium text-slate-800">筛选密级</div><div className="space-y-2">{options.map((level) => <label key={level} className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={values.includes(level)} onCheckedChange={() => onChange(values.includes(level) ? values.filter((item) => item !== level) : [...values, level])} /><SecurityLevelBadge level={level} /></label>)}</div></PopoverContent></Popover>;
}

function ReferencePreviewDialog({ open, onOpenChange, agents }: { open: boolean; onOpenChange: (open: boolean) => void; agents: ThirdPartyAgentRecord[] }) {
  const [callerId, setCallerId] = useState(REFERENCE_CALLERS[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const caller = REFERENCE_CALLERS.find((item) => item.id === callerId) ?? REFERENCE_CALLERS[0];
  const eligibleAgents = agents.filter((agent) =>
    agent.status === "已启用"
    && agent.usePermission
    && getSecurityLevelRank(agent.securityLevel) <= getSecurityLevelRank(caller.securityLevel)
  );
  const selectedAgent = eligibleAgents.find((agent) => agent.id === selectedId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-[900px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>选择第三方 Agent</DialogTitle>
          <DialogDescription>在 Claw、多智能体的引用入口，以及工作流智能体的智能体节点中选择第三方 Agent。</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-900">选择引用对象</div>
          <div className="grid gap-3 md:grid-cols-3">
            {REFERENCE_CALLERS.map((item) => {
              const active = item.id === callerId;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => { setCallerId(item.id); setSelectedId(null); }}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    active ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-200"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-sm font-semibold", active ? "text-blue-950" : "text-slate-900")}>{item.type}</span>
                    <SecurityLevelBadge level={item.securityLevel} />
                  </div>
                  <div className="mt-2 text-sm text-slate-700">{item.name}</div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <div className="text-sm font-medium text-blue-950">当前引用方：{caller.name}</div>
          <p className="mt-1 text-xs leading-5 text-blue-700">列表已按使用权限、密级和启用状态过滤；不满足条件的资源不会展示。</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow><TableHead className="w-10" /><TableHead>第三方 Agent</TableHead><TableHead>接入协议</TableHead><TableHead>密级</TableHead><TableHead className="text-right">状态</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {eligibleAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell><Checkbox checked={selectedId === agent.id} onCheckedChange={() => setSelectedId(selectedId === agent.id ? null : agent.id)} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2"><span className="font-medium text-slate-900">{agent.name}</span><span className="rounded bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">第三方</span></div>
                    <div className="mt-1 max-w-[430px] truncate text-xs text-slate-500">{agent.description}</div>
                  </TableCell>
                  <TableCell><ProtocolBadge protocol={agent.protocol} /></TableCell>
                  <TableCell><SecurityLevelBadge level={agent.securityLevel} /></TableCell>
                  <TableCell className="text-right"><span className="inline-flex rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">可引用</span></TableCell>
                </TableRow>
              ))}
              {eligibleAgents.length === 0 ? <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-500">当前引用对象下暂无可用的第三方 Agent</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
          <ShieldCheck className="mr-2 inline h-4 w-4 text-slate-500" />建立引用只保存关联关系，不会立即调用；运行时由 {caller.type} 根据任务决定是否调用，并再次校验资源状态与权限。
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button disabled={!selectedAgent} onClick={() => { toast.success(`${caller.name} 已引用 ${selectedAgent?.name}。`); onOpenChange(false); }} className="bg-blue-600 text-white hover:bg-blue-700">确认引用</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
