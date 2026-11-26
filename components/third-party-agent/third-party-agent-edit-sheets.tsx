"use client";

import { useMemo, useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type {
  ThirdPartyAgentAuthConfig,
  ThirdPartyAgentInterfaceSpec,
  ThirdPartyAgentRecord,
} from "@/lib/mock/third-party-agents";
import { buildSecurityLevelOptionsUpToUser, type SecurityLevel } from "@/lib/security-level";

const INTERFACE_OPTIONS = [
  { value: "Chat Completions", label: "OpenAI Chat Completions" },
  { value: "Responses", label: "OpenAI Responses" },
  { value: "Dify Agent API", label: "Dify Agent API" },
  { value: "Coze Studio Agent API", label: "Coze Studio Agent API" },
];

const AUTH_OPTIONS = [
  { value: "Bearer Token", label: "Bearer Token" },
  { value: "API Key", label: "API Key" },
  { value: "HTTP Basic", label: "HTTP Basic" },
  { value: "OAuth 2.0", label: "OAuth 2.0（Client Credentials）" },
  { value: "无认证", label: "无认证" },
];

export function ThirdPartyAgentBasicEditSheet({ open, onOpenChange, initialName, initialDescription, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  initialDescription: string;
  onSave: (value: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const save = () => {
    if (!name.trim() || !description.trim()) return void toast.error("请填写名称和能力描述。");
    onSave({ name: name.trim(), description: description.trim() });
    onOpenChange(false);
    toast.success("基础信息已更新。");
  };
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="right" className="flex h-full w-[560px] max-w-[94vw] flex-col gap-0 p-0 sm:max-w-[560px]"><SheetHeader className="border-b border-slate-200 px-6 py-5 pr-14"><SheetTitle>编辑基础信息</SheetTitle><SheetDescription className="sr-only">修改第三方 Agent 名称和描述</SheetDescription></SheetHeader><div className="flex-1 space-y-5 overflow-y-auto px-6 py-6"><Field label="Agent 名称" required><Input value={name} onChange={(event) => setName(event.target.value)} /></Field><Field label="能力描述" required hint="请描述该 Agent 的主要能力及适用场景，帮助其他智能体判断何时调用。"><Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-28 resize-none" placeholder="例如：根据客户画像与历史交互生成洞察摘要和跟进建议，适用于销售跟进前的客户分析。" /></Field></div><SheetFooter className="border-t border-slate-200 px-6 py-4"><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button onClick={save} className="bg-blue-600 text-white hover:bg-blue-700">保存</Button></SheetFooter></SheetContent></Sheet>;
}

export function ThirdPartyAgentSecurityEditSheet({ open, onOpenChange, initialSecurityLevel, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSecurityLevel: SecurityLevel;
  onSave: (value: SecurityLevel) => void;
}) {
  const [securityLevel, setSecurityLevel] = useState(initialSecurityLevel);
  const [reason, setReason] = useState("");
  const securityOptions = useMemo(() => buildSecurityLevelOptionsUpToUser(), []);
  const submit = () => {
    if (securityLevel === initialSecurityLevel) return void toast.error("请选择新的密级。");
    if (!reason.trim()) return void toast.error("请填写调整原因。");
    onSave(securityLevel);
    onOpenChange(false);
    toast.success("密级调整已单独提交。");
  };
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="right" className="flex h-full w-[520px] max-w-[94vw] flex-col gap-0 p-0 sm:max-w-[520px]"><SheetHeader className="border-b border-slate-200 px-6 py-5 pr-14"><SheetTitle>调整密级</SheetTitle><SheetDescription>审批完成前继续使用当前密级。</SheetDescription></SheetHeader><div className="flex-1 space-y-5 overflow-y-auto px-6 py-6"><Field label="调整为" required><Select value={securityLevel} onValueChange={(value) => setSecurityLevel(value as SecurityLevel)} options={securityOptions} /></Field><Field label="调整原因" required><Textarea value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-28 resize-none" /></Field></div><SheetFooter className="border-t border-slate-200 px-6 py-4"><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button onClick={submit} className="bg-blue-600 text-white hover:bg-blue-700">提交密级调整</Button></SheetFooter></SheetContent></Sheet>;
}

interface ConnectionValue {
  endpoint: string;
  interfaceSpec: ThirdPartyAgentInterfaceSpec;
  modelIdentifier?: string;
  botId?: string;
  authMode: ThirdPartyAgentRecord["authMode"];
  authConfig: ThirdPartyAgentAuthConfig;
}

export function ThirdPartyAgentConnectionEditSheet({
  open,
  onOpenChange,
  initialEndpoint,
  initialInterfaceSpec,
  initialModelIdentifier,
  initialBotId,
  initialAuthMode,
  initialAuthConfig,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEndpoint: string;
  initialInterfaceSpec: ThirdPartyAgentInterfaceSpec;
  initialModelIdentifier?: string;
  initialBotId?: string;
  initialAuthMode: ThirdPartyAgentRecord["authMode"];
  initialAuthConfig?: ThirdPartyAgentAuthConfig;
  onSave: (value: ConnectionValue) => void;
}) {
  const [endpoint, setEndpoint] = useState(initialEndpoint);
  const [interfaceSpec, setInterfaceSpec] = useState(initialInterfaceSpec);
  const [modelIdentifier, setModelIdentifier] = useState(initialModelIdentifier ?? "");
  const [botId, setBotId] = useState(initialBotId ?? "");
  const [authMode, setAuthMode] = useState<ThirdPartyAgentRecord["authMode"]>(initialAuthMode);
  const [credential, setCredential] = useState("");
  const [apiKeyLocation, setApiKeyLocation] = useState<"Header" | "Query">(initialAuthConfig?.apiKeyLocation ?? "Header");
  const [apiKeyParameter, setApiKeyParameter] = useState(initialAuthConfig?.apiKeyParameter ?? initialAuthConfig?.apiKeyHeader ?? "x-api-key");
  const [tokenUrl, setTokenUrl] = useState(initialAuthConfig?.tokenUrl ?? "");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [scope, setScope] = useState(initialAuthConfig?.scope ?? "");
  const [basicUsername, setBasicUsername] = useState(initialAuthConfig?.username ?? "");
  const [basicPassword, setBasicPassword] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isDify = interfaceSpec === "Dify Agent API";
  const isCoze = interfaceSpec === "Coze Studio Agent API";
  const isOpenAI = !isDify && !isCoze;

  const clearError = () => setValidationError("");
  const selectInterface = (value: string) => {
    const next = value as ThirdPartyAgentInterfaceSpec;
    setInterfaceSpec(next);
    if (next === "Responses") setEndpoint("https://api.partner.example.com/v1/responses");
    else if (next === "Dify Agent API") { setEndpoint("https://dify.example.com/v1"); setAuthMode("API Key"); }
    else if (next === "Coze Studio Agent API") { setEndpoint("https://coze.example.com/v3/chat"); setAuthMode("Bearer Token"); }
    else setEndpoint("https://api.partner.example.com/v1/chat/completions");
    clearError();
  };

  const validateAndReview = () => {
    if (!endpoint.trim()) return setValidationError(isCoze ? "请填写 Chat V3 API 请求地址。" : "请填写 API 地址。");
    if (interfaceSpec === "Chat Completions" && !modelIdentifier.trim()) return setValidationError("请填写服务方提供的模型标识（model）。");
    if (isCoze && !botId.trim()) return setValidationError("请填写 Coze Studio Bot ID。");
    const changedCredentialRule = interfaceSpec !== initialInterfaceSpec || authMode !== initialAuthMode;
    if (changedCredentialRule && (authMode === "Bearer Token" || authMode === "API Key") && !credential.trim()) return setValidationError("接口或认证方式已变化，请填写新的认证凭证。");
    setValidationError("");
    setValidating(true);
    window.setTimeout(() => {
      const error = getConnectionError(endpoint, credential || clientSecret || basicPassword, interfaceSpec);
      setValidating(false);
      if (error) {
        setValidationError(error);
        toast.error("接入校验失败，当前生效配置保持不变。");
        return;
      }
      setConfirmOpen(true);
    }, 900);
  };

  const confirmSave = () => {
    onSave({
      endpoint: endpoint.trim(),
      interfaceSpec,
      modelIdentifier: isOpenAI ? modelIdentifier.trim() || undefined : undefined,
      botId: isCoze ? botId.trim() : undefined,
      authMode: isDify ? "API Key" : isCoze ? "Bearer Token" : authMode,
      authConfig: {
        tokenUrl: authMode === "OAuth 2.0" ? tokenUrl.trim() : undefined,
        scope: authMode === "OAuth 2.0" ? scope.trim() : undefined,
        apiKeyLocation: authMode === "API Key" ? apiKeyLocation : undefined,
        apiKeyParameter: isDify ? "Authorization" : authMode === "API Key" ? apiKeyParameter.trim() : undefined,
        apiKeyHeader: isDify ? "Authorization" : authMode === "API Key" && apiKeyLocation === "Header" ? apiKeyParameter.trim() : undefined,
        bearerFormat: isCoze ? "Access Token" : initialAuthConfig?.bearerFormat,
        username: authMode === "HTTP Basic" ? basicUsername.trim() : undefined,
      },
    });
    setConfirmOpen(false);
    onOpenChange(false);
    toast.success("接入配置已更新；新调用将使用最新生效配置。");
  };

  return <>
    <Sheet open={open} onOpenChange={(next) => { if (!validating) onOpenChange(next); }}>
      <SheetContent side="right" className="flex h-full w-[620px] max-w-[94vw] flex-col gap-0 p-0 sm:max-w-[620px]">
        <SheetHeader className="border-b border-slate-200 px-6 py-5 pr-14"><SheetTitle>编辑接入配置</SheetTitle><SheetDescription className="sr-only">修改第三方 Agent API 接入配置</SheetDescription></SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-5 text-blue-800">根据所选接口类型，填写 API 地址及必要的调用参数。平台按照对应接口规范处理请求和响应。</div>
          <Field label="接口类型" required><Select value={interfaceSpec} onValueChange={selectInterface} options={INTERFACE_OPTIONS} /></Field>
          <Field label={isCoze ? "Chat V3 API 请求地址" : isOpenAI ? "服务地址" : "API 基础地址"} required hint={isCoze ? "平台按照 Coze Studio Chat V3 接口规范完成调用，默认使用标准路径 /v3/chat，支持填写实际部署环境提供的完整接口地址。" : undefined}><Input value={endpoint} onChange={(event) => { setEndpoint(event.target.value); clearError(); }} placeholder={isCoze ? "https://coze.example.com/v3/chat" : undefined} /></Field>
          {isOpenAI ? <Field label="模型标识（model）" required={interfaceSpec === "Chat Completions"} hint={interfaceSpec === "Chat Completions" ? "填写服务方提供的 model 值，用于指定调用目标；不是在 AF 中选择底层模型。" : "按服务方要求填写。仅当服务方支持默认调用目标时可留空，留空不传 model；保存时进行接入校验。"}><Input value={modelIdentifier} onChange={(event) => { setModelIdentifier(event.target.value); clearError(); }} placeholder="请填写服务方提供的 model 值" /></Field> : null}
          {isDify ? <Field label="调用接口"><Input value="/chat-messages" disabled /></Field> : null}
          {isCoze ? <Field label="Bot ID" required><Input value={botId} onChange={(event) => { setBotId(event.target.value); clearError(); }} /></Field> : null}
          {isDify ? <FixedCredential label="更新应用 API Key" value={credential} onChange={setCredential} hint="留空表示继续使用当前凭证。" /> : isCoze ? <FixedCredential label="更新 Access Token" value={credential} onChange={setCredential} hint="留空表示继续使用当前凭证。" /> : <div className="space-y-4"><Field label="认证方式" required><Select value={authMode} onValueChange={(value) => { setAuthMode(value as ThirdPartyAgentRecord["authMode"]); clearError(); }} options={AUTH_OPTIONS} /></Field>{(authMode === "Bearer Token" || authMode === "API Key") ? <Field label={`更新 ${authMode}`}><Input type="password" value={credential} onChange={(event) => setCredential(event.target.value)} placeholder="留空表示不修改" /></Field> : null}{authMode === "API Key" ? <div className="grid gap-4 sm:grid-cols-2"><Field label="放置位置"><Select value={apiKeyLocation} onValueChange={(value) => setApiKeyLocation(value as "Header" | "Query")} options={[{ value: "Header", label: "Header" }, { value: "Query", label: "Query" }]} /></Field><Field label="参数名称"><Input value={apiKeyParameter} onChange={(event) => setApiKeyParameter(event.target.value)} /></Field></div> : null}{authMode === "HTTP Basic" ? <div className="grid gap-4 sm:grid-cols-2"><Field label="用户名"><Input value={basicUsername} onChange={(event) => setBasicUsername(event.target.value)} /></Field><Field label="更新密码"><Input type="password" value={basicPassword} onChange={(event) => setBasicPassword(event.target.value)} placeholder="留空表示不修改" /></Field></div> : null}{authMode === "OAuth 2.0" ? <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Token URL" required><Input value={tokenUrl} onChange={(event) => setTokenUrl(event.target.value)} /></Field></div><Field label="Client ID"><Input value={clientId} onChange={(event) => setClientId(event.target.value)} placeholder="留空表示不修改" /></Field><Field label="Client Secret"><Input type="password" value={clientSecret} onChange={(event) => setClientSecret(event.target.value)} placeholder="留空表示不修改" /></Field><div className="sm:col-span-2"><Field label="Scope"><Input value={scope} onChange={(event) => setScope(event.target.value)} /></Field></div></div> : null}</div>}
          {validationError ? <div role="alert" className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700"><XCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><div className="text-sm font-medium">接入校验失败，未更新配置</div><p className="mt-1 text-xs leading-5">{validationError} 当前配置仍然生效，请修改后重新保存。</p></div></div> : null}
        </div>
        <SheetFooter className="border-t border-slate-200 px-6 py-4"><Button variant="outline" onClick={() => onOpenChange(false)} disabled={validating}>取消</Button><Button onClick={validateAndReview} disabled={validating} className="bg-blue-600 text-white hover:bg-blue-700">{validating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{validating ? "正在校验" : "查看变更并保存"}</Button></SheetFooter>
      </SheetContent>
    </Sheet>
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent className="max-w-[620px]"><DialogHeader><DialogTitle>确认接入配置变更</DialogTitle><DialogDescription>校验已通过，确认后替换当前生效配置。</DialogDescription></DialogHeader><div className="overflow-hidden rounded-lg border border-slate-200 text-sm"><ChangeRow label="接口类型" before={formatSpec(initialInterfaceSpec)} after={formatSpec(interfaceSpec)} /><ChangeRow label={isCoze ? "Chat V3 API 请求地址" : isDify ? "API 基础地址" : "服务地址"} before={initialEndpoint} after={endpoint} /><ChangeRow label="模型 / Bot" before={initialModelIdentifier || initialBotId || "—"} after={modelIdentifier || botId || "—"} /><ChangeRow label="认证方式" before={initialAuthMode} after={isDify ? "应用 API Key" : isCoze ? "Access Token" : authMode} last /></div><div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">已有引用关系保持不变；确认后，新发起的调用使用最新生效配置。</div><DialogFooter><Button variant="outline" onClick={() => setConfirmOpen(false)}>返回修改</Button><Button onClick={confirmSave} className="bg-blue-600 text-white hover:bg-blue-700">确认更新配置</Button></DialogFooter></DialogContent></Dialog>
  </>;
}

function Field({ label, required = false, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}{required ? <span className="ml-1 text-rose-500">*</span> : null}</Label>{children}{hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}</div>; }
function FixedCredential({ label, value, onChange, hint }: { label: string; value: string; onChange: (value: string) => void; hint: string }) { return <div className="space-y-2"><Field label={label}><Input type="password" value={value} onChange={(event) => onChange(event.target.value)} placeholder="留空表示不修改" /></Field><p className="text-xs text-slate-500">{hint}</p></div>; }
function ChangeRow({ label, before, after, last = false }: { label: string; before: string; after: string; last?: boolean }) { return <div className={`grid grid-cols-[110px_1fr_24px_1fr] items-start gap-3 px-4 py-3 ${last ? "" : "border-b border-slate-200"}`}><span className="text-slate-500">{label}</span><span className="break-all text-slate-600">{before || "—"}</span><span className="text-center text-slate-400">→</span><span className="break-all font-medium text-slate-900">{after || "—"}</span></div>; }
function formatSpec(spec: ThirdPartyAgentInterfaceSpec): string { return spec === "Chat Completions" ? "OpenAI Chat Completions" : spec === "Responses" ? "OpenAI Responses" : spec; }
function getConnectionError(endpoint: string, credential: string, spec: ThirdPartyAgentInterfaceSpec): string | null { if (/unreachable|offline|connection-error|timeout/i.test(endpoint)) return "无法连接 API 地址，请检查地址、网络或 TLS 配置。"; if (/invalid|expired|auth-error|unauthorized/i.test(credential)) return "API 可达，但认证凭证无效或已过期。"; if (/invalid-response|interface-error|schema-error/i.test(endpoint)) return `连接与认证通过，但响应不符合 ${spec} 规范。`; return null; }
