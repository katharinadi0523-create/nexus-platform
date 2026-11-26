"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bot, MoreHorizontal, Pencil } from "lucide-react";
import { toast } from "sonner";
import { ThirdPartyAgentDebugPanel } from "@/components/third-party-agent/third-party-agent-debug-panel";
import {
  ThirdPartyAgentBasicEditSheet,
  ThirdPartyAgentConnectionEditSheet,
  ThirdPartyAgentSecurityEditSheet,
} from "@/components/third-party-agent/third-party-agent-edit-sheets";
import { ThirdPartyAgentDeregisterDialog } from "@/components/third-party-agent/third-party-agent-deregister-dialog";
import { SecurityLevelBadge } from "@/components/security/security-level-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getThirdPartyAgent } from "@/lib/mock/third-party-agents";
import type { SecurityLevel } from "@/lib/security-level";

export default function ThirdPartyAgentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const source = getThirdPartyAgent(params.id);
  const [deregisterOpen, setDeregisterOpen] = useState(false);
  const [basicEditOpen, setBasicEditOpen] = useState(false);
  const [securityEditOpen, setSecurityEditOpen] = useState(false);
  const [connectionEditOpen, setConnectionEditOpen] = useState(false);
  const [name, setName] = useState(source?.name ?? "");
  const [description, setDescription] = useState(source?.description ?? "");
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>(source?.securityLevel ?? "内部");
  const [endpoint, setEndpoint] = useState(source?.endpoint ?? "");
  const [interfaceSpec, setInterfaceSpec] = useState(source?.interfaceSpec ?? "Chat Completions");
  const [modelIdentifier, setModelIdentifier] = useState(source?.modelIdentifier ?? "");
  const [botId, setBotId] = useState(source?.botId ?? "");
  const [authMode, setAuthMode] = useState(source?.authMode ?? "无认证");
  const [authConfig, setAuthConfig] = useState(source?.authConfig);

  if (!source) {
    return <div className="space-y-4"><Link href="/agent" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />返回智能体列表</Link><div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">未找到该第三方 Agent</div></div>;
  }

  const isDify = interfaceSpec === "Dify Agent API";
  const isCoze = interfaceSpec === "Coze Studio Agent API";

  return (
    <div className="space-y-4">
      <Link href="/agent" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />智能体</Link>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(560px,1fr)_minmax(520px,0.9fr)]">
        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Bot className="h-6 w-6" /></div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold text-slate-950">{name}</h1><span className="rounded bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">第三方</span><SecurityLevelBadge level={securityLevel} /><span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{formatSpec(interfaceSpec)}</span></div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 text-xs text-slate-500"><span>创建人：{source.owner}</span><span>更新于 {source.updatedAt}</span></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setBasicEditOpen(true)}><Pencil className="h-4 w-4" />编辑基础信息</Button>
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setSecurityEditOpen(true)}>调整密级</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setDeregisterOpen(true)} className="text-rose-600 focus:text-rose-600">注销</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-semibold text-slate-900">当前生效配置</h2><span className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">生效中</span></div><p className="mt-1 text-xs text-slate-500">保存修改时平台自动进行接入校验；校验失败不会覆盖当前配置。</p></div><Button variant="outline" size="sm" onClick={() => setConnectionEditOpen(true)}><Pencil className="h-4 w-4" />编辑配置</Button></div>
            <dl className="mt-5 grid gap-x-10 gap-y-5 md:grid-cols-2">
              <Info label="接口类型" value={formatSpec(interfaceSpec)} />
              <div className="md:col-span-2"><Info label={isCoze ? "Chat V3 API 请求地址" : isDify ? "API 基础地址" : "服务地址"} value={endpoint} /></div>
              {isDify ? <><Info label="调用接口" value="/chat-messages" /><Info label="认证方式" value="应用 API Key（已配置）" /></> : null}
              {isCoze ? <><Info label="Bot ID" value={botId || "—"} /><Info label="认证方式" value="Access Token（已配置）" /></> : null}
              {!isDify && !isCoze ? <>{modelIdentifier ? <Info label="模型标识（model）" value={modelIdentifier} /> : null}<Info label="认证方式" value={authMode} />{authMode !== "无认证" ? <Info label="认证凭证" value="已配置" /> : null}</> : null}
            </dl>
          </section>
        </div>

        <aside className="xl:sticky xl:top-4"><ThirdPartyAgentDebugPanel className="h-[calc(100vh-150px)] min-h-[680px] rounded-xl border border-slate-200" /></aside>
      </div>

      {basicEditOpen ? <ThirdPartyAgentBasicEditSheet open onOpenChange={setBasicEditOpen} initialName={name} initialDescription={description} onSave={(value) => { setName(value.name); setDescription(value.description); }} /> : null}
      {securityEditOpen ? <ThirdPartyAgentSecurityEditSheet open onOpenChange={setSecurityEditOpen} initialSecurityLevel={securityLevel} onSave={setSecurityLevel} /> : null}
      {connectionEditOpen ? <ThirdPartyAgentConnectionEditSheet open onOpenChange={setConnectionEditOpen} initialEndpoint={endpoint} initialInterfaceSpec={interfaceSpec} initialModelIdentifier={modelIdentifier} initialBotId={botId} initialAuthMode={authMode} initialAuthConfig={authConfig} onSave={(value) => { setEndpoint(value.endpoint); setInterfaceSpec(value.interfaceSpec); setModelIdentifier(value.modelIdentifier ?? ""); setBotId(value.botId ?? ""); setAuthMode(value.authMode); setAuthConfig(value.authConfig); }} /> : null}
      <ThirdPartyAgentDeregisterDialog open={deregisterOpen} onOpenChange={setDeregisterOpen} agentName={name} onConfirm={() => { setDeregisterOpen(false); toast.success(`已注销平台登记：${name}。外部服务未受影响。`); router.push("/agent"); }} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-all text-sm font-medium text-slate-900">{value}</dd></div>; }
function formatSpec(spec: string): string { return spec === "Chat Completions" ? "OpenAI Chat Completions" : spec === "Responses" ? "OpenAI Responses" : spec; }
