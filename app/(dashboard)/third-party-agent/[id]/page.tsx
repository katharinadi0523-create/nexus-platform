"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  FileClock,
  MoreHorizontal,
  Pencil,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";
import {
  ThirdPartyAgentBasicEditSheet,
  ThirdPartyAgentConnectionEditSheet,
  ThirdPartyAgentSecurityEditSheet,
} from "@/components/third-party-agent/third-party-agent-edit-sheets";
import { ThirdPartyAgentDeregisterDialog } from "@/components/third-party-agent/third-party-agent-deregister-dialog";
import { SecurityLevelBadge } from "@/components/security/security-level-badge";
import { Button } from "@/components/ui/button";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getThirdPartyAgent,
  type A2AAgentCardDeclaration,
} from "@/lib/mock/third-party-agents";
import type { SecurityLevel } from "@/lib/security-level";
import { cn } from "@/lib/utils";

export default function ThirdPartyAgentDetailPage() {
  const params = useParams<{ id: string }>();
  const source = getThirdPartyAgent(params.id);
  const [status, setStatus] = useState(source?.status ?? "已启用");
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false);
  const [basicEditOpen, setBasicEditOpen] = useState(false);
  const [securityEditOpen, setSecurityEditOpen] = useState(false);
  const [connectionEditOpen, setConnectionEditOpen] = useState(false);
  const [name, setName] = useState(source?.name ?? "");
  const [description, setDescription] = useState(source?.description ?? "");
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>(source?.securityLevel ?? "内部");
  const [endpoint, setEndpoint] = useState(source?.endpoint ?? "");
  const [agentCardSource, setAgentCardSource] = useState<"URL" | "JSON">(source?.agentCardSource ?? "URL");
  const [agentCardJson, setAgentCardJson] = useState(source?.agentCardJson);
  const [interfaceSpec, setInterfaceSpec] = useState(source?.interfaceSpec ?? "A2A");
  const [modelIdentifier, setModelIdentifier] = useState(source?.modelIdentifier ?? "");
  const [botId, setBotId] = useState(source?.botId ?? "");
  const [authMode, setAuthMode] = useState(source?.authMode ?? "无认证");
  const [authConfig, setAuthConfig] = useState(source?.authConfig);
  const [lastValidatedAt, setLastValidatedAt] = useState(source?.lastCheckedAt ?? "");
  const declaredVersion = source?.declaredVersion;
  const serviceEndpoint = source?.a2aDeclaration?.serviceEndpoint ?? "";
  const skills = source?.skills ?? [];
  const skillDeclarations = source?.a2aDeclaration?.skills ?? [];
  const lastFetchedAt = source?.lastCheckedAt ?? "";
  const [operationRecords, setOperationRecords] = useState(source?.operationRecords ?? []);
  const pendingAsyncTaskIds = (source?.callRecords ?? [])
    .filter((record) => record.result === "处理中")
    .map((record) => record.externalTaskId ?? record.executionId);
  const declaredCapabilities = source?.a2aDeclaration
    ? getDeclaredCapabilities(source.a2aDeclaration.capabilities)
    : [];
  const isDify = interfaceSpec === "Dify Agent API";
  const isCoze = interfaceSpec === "Coze Studio Agent API";
  const isOpenAI = source?.protocol !== "A2A" && !isDify && !isCoze;

  if (!source) {
    return (
      <div className="space-y-4">
        <Link href="/third-party-agent" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />返回第三方 Agent</Link>
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">未找到该第三方 Agent</div>
      </div>
    );
  }

  const confirmStatus = () => {
    const next = status === "已启用" ? "已停用" : "已启用";
    setStatus(next);
    setStatusConfirmOpen(false);
    toast.success(next === "已启用" ? "已重新启用。" : "已停用；新调用已禁止，已开始的异步任务继续执行。");
  };

  return (
    <TooltipProvider delayDuration={250}>
    <div className="mx-auto max-w-[1440px] space-y-4">
      <Link href="/third-party-agent" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />第三方 Agent
      </Link>

      <section className="rounded-lg border border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-4">
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", source.protocol === "A2A" ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600")}>
              <Bot className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-slate-950">{name}</h1>
                <SecurityLevelBadge level={securityLevel} />
                <StatusBadge value={status} tone={status === "已启用" ? "success" : "muted"} />
                <StatusBadge value={source.protocol === "A2A" ? "A2A" : "API"} tone="info" />
                {source.protocol !== "A2A" ? <StatusBadge value={formatInterfaceSpec(interfaceSpec)} tone="info" /> : null}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="mt-2 max-w-3xl cursor-default truncate text-sm leading-6 text-slate-600">{description}</p>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="max-w-lg leading-5">
                  {description}
                </TooltipContent>
              </Tooltip>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500">
                <span>负责人：{source.owner}</span>
                <span>更新于 {source.updatedAt}</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" onClick={() => setBasicEditOpen(true)}><Pencil className="h-4 w-4" />编辑登记信息</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => setStatusConfirmOpen(true)}>{status === "已启用" ? "停用" : "重新启用"}</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSecurityEditOpen(true)}>调整密级</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setDeleteBlockedOpen(true)} className="text-rose-600 focus:text-rose-600">注销登记</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </section>

      {status === "已停用" ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700"><Unplug className="h-5 w-5 text-slate-500" />该 Agent 已停用</div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-slate-950">{source.protocol === "A2A" ? "AgentCard 声明" : "能力信息"}</h2>
                {source.protocol === "A2A" && source.a2aDeclaration ? (
                  <>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">外部只读</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">Agent {declaredVersion ?? "—"}</span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">A2A {source.a2aDeclaration.protocolVersion}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">Skills · {skillDeclarations.length}</span>
                  </>
                ) : null}
              </div>
              {source.protocol === "A2A" && source.a2aDeclaration ? (
                <p className="mt-1 text-xs text-slate-500">{source.a2aDeclaration.provider ? `${source.a2aDeclaration.provider} · ` : ""}最近获取 {lastFetchedAt}</p>
              ) : null}
            </div>
          </div>
        </div>

        {source.protocol === "A2A" && source.a2aDeclaration ? (
          <div className="border-t border-slate-100">
            <div className="px-6 py-5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-slate-900">Skills</h3>
                <span className="text-xs text-slate-400">{skillDeclarations.length}</span>
              </div>
              <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
                {skillDeclarations.map((skill) => (
                  <div key={skill.id} className="grid items-center gap-3 px-4 py-4 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{skill.name}</div>
                      <div className="mt-1 font-mono text-xs text-slate-400">{skill.id}</div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="min-w-0 cursor-default truncate text-sm text-slate-600">{skill.description}</p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="start" className="max-w-md leading-5">{skill.description}</TooltipContent>
                    </Tooltip>
                    <div className="flex flex-wrap gap-1.5 lg:justify-end">{skill.tags.length ? skill.tags.map((tag) => <span key={tag} className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">{tag}</span>) : <span className="text-xs text-slate-400">无标签</span>}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-slate-900">接入声明</h3>
                <span className="text-xs text-slate-400">来自 AgentCard</span>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs font-medium text-slate-500">服务端点</div>
                  <div className="mt-1.5 break-all font-mono text-sm text-slate-800">{serviceEndpoint}</div>
                </div>

                <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="min-h-24 bg-white p-4">
                    <div className="text-xs font-medium text-slate-500">协议绑定</div>
                    <div className="mt-2 text-sm font-medium text-slate-800">{formatProtocolBinding(source.a2aDeclaration.protocolBinding)}</div>
                  </div>
                  <div className="min-h-24 bg-white p-4">
                    <div className="text-xs font-medium text-slate-500">默认输入</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">{source.a2aDeclaration.defaultInputModes.length ? source.a2aDeclaration.defaultInputModes.map((mode) => <span key={mode} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">{mode}</span>) : <span className="text-sm text-slate-500">无</span>}</div>
                  </div>
                  <div className="min-h-24 bg-white p-4">
                    <div className="text-xs font-medium text-slate-500">默认输出</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">{source.a2aDeclaration.defaultOutputModes.length ? source.a2aDeclaration.defaultOutputModes.map((mode) => <span key={mode} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">{mode}</span>) : <span className="text-sm text-slate-500">无</span>}</div>
                  </div>
                  <div className="min-h-24 bg-white p-4">
                    <div className="text-xs font-medium text-slate-500">可选协议能力</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">{declaredCapabilities.length ? declaredCapabilities.map((capability) => <span key={capability} className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{capability}</span>) : <span className="text-sm text-slate-500">无</span>}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 px-6 py-5">{skills.map((skill) => <span key={skill} className="rounded-md bg-blue-50 px-3 py-1.5 text-sm text-blue-700">{skill}</span>)}</div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><h2 className="font-semibold text-slate-900">当前生效配置</h2><StatusBadge value="生效中" tone="success" /></div>
            <p className="mt-1 text-xs text-slate-500">平台实际用于发起调用的配置。URL、JSON 与认证配置统一从此处编辑；重新解析和校验通过后才保存生效。</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setConnectionEditOpen(true)}><Pencil className="h-4 w-4" />编辑配置</Button>
        </div>
        <dl className="mt-5 grid gap-x-10 gap-y-5 md:grid-cols-3">
          <Info label="接入方式" value={source.protocol === "A2A" ? "A2A" : "API"} />
          {source.protocol !== "A2A" ? <Info label="接口类型" value={formatInterfaceSpec(interfaceSpec)} /> : null}
          {source.protocol === "A2A" ? (
            <>
              <div className="md:col-span-3"><Info label="AgentCard 来源" value={agentCardSource === "URL" ? endpoint : "JSON（已登记）"} /></div>
              <Info label="认证方式" value={authMode} />
              {authMode === "API Key" ? <Info label="API Key 位置" value={`${authConfig?.apiKeyLocation ?? "Header"} · ${authConfig?.apiKeyParameter ?? authConfig?.apiKeyHeader ?? "—"}`} /> : null}
              {authMode === "OAuth 2.0" ? <Info label="Token URL / Scope" value={`${authConfig?.tokenUrl ?? "—"} · ${authConfig?.scope || "无"}`} /> : null}
              {authMode === "HTTP Basic" ? <Info label="用户名" value={authConfig?.username || "已配置"} /> : null}
              {authMode !== "无认证" ? <Info label="认证凭证" value="••••••••••••" /> : null}
            </>
          ) : isDify ? (
            <>
              <div className="md:col-span-3"><Info label="API 基础地址" value={endpoint} /></div>
              <Info label="调用接口" value="/chat-messages" />
              <Info label="认证方式" value="应用 API Key（已配置）" />
              <Info label="最近一次接入校验" value={`通过 · ${lastValidatedAt}`} />
            </>
          ) : isCoze ? (
            <>
              <div className="md:col-span-3"><Info label="API 基础地址" value={endpoint} /></div>
              <Info label="调用接口" value="/v3/chat" />
              <Info label="Bot ID" value={botId || "—"} />
              <Info label="认证方式" value="Access Token（已配置）" />
              <Info label="最近一次接入校验" value={`通过 · ${lastValidatedAt}`} />
            </>
          ) : isOpenAI ? (
            <>
              <div className="md:col-span-3"><Info label="服务地址" value={endpoint} /></div>
              <Info label="模型 / 服务标识" value={modelIdentifier || "—"} />
              <Info label="认证方式" value={authMode} />
              {authMode === "API Key" ? <Info label="API Key 位置" value={`${authConfig?.apiKeyLocation ?? "Header"} · ${authConfig?.apiKeyParameter ?? authConfig?.apiKeyHeader ?? "—"}`} /> : null}
              {authMode === "OAuth 2.0" ? <Info label="Token URL / Scope" value={`${authConfig?.tokenUrl ?? "—"} · ${authConfig?.scope || "无"}`} /> : null}
              {authMode === "HTTP Basic" ? <Info label="用户名" value={authConfig?.username || "已配置"} /> : null}
              {authMode !== "无认证" ? <Info label="认证凭证" value="••••••••••••" /> : null}
            </>
          ) : null}
        </dl>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <DetailSectionTitle title="引用关系" count={source.referenceCount} />
        <Table><TableHeader className="bg-slate-50"><TableRow><TableHead>引用方</TableHead><TableHead>类型</TableHead><TableHead>密级</TableHead><TableHead>负责人</TableHead><TableHead>更新时间</TableHead><TableHead className="text-right">状态</TableHead></TableRow></TableHeader><TableBody>{source.references.length ? source.references.map((reference) => <TableRow key={reference.id}><TableCell className="font-medium text-slate-900">{reference.name}</TableCell><TableCell>{reference.type}</TableCell><TableCell><SecurityLevelBadge level={reference.securityLevel} /></TableCell><TableCell>{reference.owner}</TableCell><TableCell>{reference.updatedAt}</TableCell><TableCell className="text-right"><StatusBadge value={status === "已启用" ? "可调用" : "不可用"} tone={status === "已启用" ? "success" : "muted"} /></TableCell></TableRow>) : <EmptyRow colSpan={6}>暂无引用关系</EmptyRow>}</TableBody></Table>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <DetailSectionTitle title="管理操作记录" count={operationRecords.length} description="记录创建、测试、接入配置变更及启停等资产管理行为。" />
        <div className="space-y-3 p-6">{operationRecords.length ? operationRecords.map((record) => <div key={record.id} className="flex gap-4 rounded-lg border border-slate-200 p-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"><FileClock className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-medium text-slate-900">{record.action}</div><div className="text-xs text-slate-500">{record.operatedAt}</div></div><p className="mt-1 text-sm text-slate-600">{record.summary}</p><p className="mt-2 text-xs text-slate-400">操作人：{record.operator}</p></div></div>) : <div className="py-8 text-center text-slate-500">暂无操作记录</div>}</div>
      </section>

      {basicEditOpen ? (
        <ThirdPartyAgentBasicEditSheet
          open
          onOpenChange={setBasicEditOpen}
          initialName={name}
          initialDescription={description}
          onSave={(value) => {
            setName(value.name);
            setDescription(value.description);
          }}
        />
      ) : null}
      {securityEditOpen ? (
        <ThirdPartyAgentSecurityEditSheet
          open
          onOpenChange={setSecurityEditOpen}
          initialSecurityLevel={securityLevel}
          onSave={(value) => {
            const previous = securityLevel;
            setSecurityLevel(value);
            setOperationRecords((current) => [{
              id: `op-security-${Date.now()}`,
              operatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
              operator: source.owner,
              action: "调整密级",
              summary: `密级由 ${previous} 调整为 ${value}，已进入独立密级流程`,
            }, ...current]);
          }}
        />
      ) : null}
      {connectionEditOpen ? (
        <ThirdPartyAgentConnectionEditSheet
          open
          onOpenChange={setConnectionEditOpen}
          protocol={source.protocol}
          initialEndpoint={endpoint}
          initialAgentCardSource={agentCardSource}
          initialAgentCardJson={agentCardJson}
          initialInterfaceSpec={interfaceSpec}
          initialModelIdentifier={modelIdentifier}
          initialBotId={botId}
          initialAuthMode={authMode}
          initialAuthConfig={authConfig}
          onSave={(value) => {
            setEndpoint(value.endpoint);
            setAgentCardSource(value.agentCardSource ?? "URL");
            setAgentCardJson(value.agentCardJson);
            setInterfaceSpec(value.interfaceSpec);
            setModelIdentifier(value.modelIdentifier ?? "");
            setBotId(value.botId ?? "");
            setAuthMode(value.authMode);
            setAuthConfig(value.authConfig);
            setLastValidatedAt(new Date().toLocaleString("zh-CN", { hour12: false }));
            setOperationRecords((current) => [{
              id: `op-config-${Date.now()}`,
              operatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
              operator: source.owner,
              action: "更新接入配置",
              summary: "新配置重新校验通过后生效；已有引用关系保留",
            }, ...current]);
          }}
        />
      ) : null}

      <Dialog open={statusConfirmOpen} onOpenChange={setStatusConfirmOpen}><DialogContent className="max-w-[500px]"><DialogHeader><DialogTitle>{status === "已启用" ? "停用第三方 Agent？" : "重新启用第三方 Agent？"}</DialogTitle><DialogDescription className="pt-2 leading-6">{status === "已启用" ? `停用后，${source.referenceCount} 个已有引用关系继续保留，但不能发起新调用；已开始的异步任务继续执行。` : "重新启用后，已有引用立即恢复调用。仅当关键接入配置发生变化时，才需要重新校验。"}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setStatusConfirmOpen(false)}>取消</Button><Button onClick={confirmStatus} className="bg-blue-600 text-white hover:bg-blue-700">确认{status === "已启用" ? "停用" : "启用"}</Button></DialogFooter></DialogContent></Dialog>

      <ThirdPartyAgentDeregisterDialog
        open={deleteBlockedOpen}
        onOpenChange={setDeleteBlockedOpen}
        agentName={source.name}
        referenceCount={source.referenceCount}
        pendingTaskIds={pendingAsyncTaskIds}
        onConfirm={() => {
          setDeleteBlockedOpen(false);
          toast.success(`已注销平台登记：${source.name}。外部服务未受影响。`);
        }}
      />
    </div>
    </TooltipProvider>
  );
}

function StatusBadge({
  value,
  tone,
}: {
  value: string;
  tone: "success" | "danger" | "info" | "muted";
}) {
  return <span className={cn("inline-flex rounded px-2 py-1 text-xs font-medium", tone === "success" && "bg-emerald-50 text-emerald-700", tone === "danger" && "bg-rose-50 text-rose-700", tone === "info" && "bg-blue-50 text-blue-700", tone === "muted" && "bg-slate-100 text-slate-600")}>{value}</span>;
}

function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return <TableRow><TableCell colSpan={colSpan} className="py-12 text-center text-slate-500">{children}</TableCell></TableRow>;
}

function DetailSectionTitle({ title, count, description }: { title: string; count: number; description?: string }) {
  return (
    <div className="border-b border-slate-200 px-6 py-4">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{count}</span>
      </div>
      {description ? <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p> : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-all text-sm leading-6 text-slate-800">{value}</dd></div>;
}

function formatInterfaceSpec(interfaceSpec: string): string {
  if (interfaceSpec === "Chat Completions") return "OpenAI Chat Completions";
  if (interfaceSpec === "Responses") return "OpenAI Responses";
  return interfaceSpec;
}

function getDeclaredCapabilities(capabilities: A2AAgentCardDeclaration["capabilities"]): string[] {
  return [
    capabilities.streaming ? "流式响应" : null,
    capabilities.pushNotifications ? "异步结果通知" : null,
    capabilities.extendedAgentCard ? "认证后扩展卡" : null,
  ].filter((value): value is string => Boolean(value));
}

function formatProtocolBinding(binding: A2AAgentCardDeclaration["protocolBinding"]): string {
  if (binding === "JSONRPC") return "JSON-RPC";
  if (binding === "GRPC") return "gRPC";
  return "HTTP+JSON";
}
