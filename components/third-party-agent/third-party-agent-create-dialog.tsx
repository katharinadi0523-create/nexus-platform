"use client";

import { useMemo, useState } from "react";
import { Code2, KeyRound, Loader2, ServerCog, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
  ThirdPartyAgentAuthConfig,
  ThirdPartyAgentAuthMode,
  ThirdPartyAgentInterfaceSpec,
  ThirdPartyAgentProtocol,
} from "@/lib/mock/third-party-agents";
import {
  buildSecurityLevelOptionsUpToUser,
  isHighSecurityLevel,
  type SecurityLevel,
} from "@/lib/security-level";

export interface CreatedThirdPartyAgent {
  name: string;
  description: string;
  protocol: ThirdPartyAgentProtocol;
  interfaceSpec: ThirdPartyAgentInterfaceSpec;
  modelIdentifier?: string;
  botId?: string;
  endpoint: string;
  authMode: ThirdPartyAgentAuthMode;
  authConfig?: ThirdPartyAgentAuthConfig;
  securityLevel: SecurityLevel;
  approvalReason?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (agent: CreatedThirdPartyAgent) => void;
}

const INTERFACE_OPTIONS: Array<{ value: ThirdPartyAgentInterfaceSpec; label: string }> = [
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

export function ThirdPartyAgentCreateDialog({ open, onOpenChange, onCreated }: Props) {
  const [interfaceSpec, setInterfaceSpec] = useState<ThirdPartyAgentInterfaceSpec>("Chat Completions");
  const [name, setName] = useState("客户洞察 Agent");
  const [description, setDescription] = useState("根据客户信息生成洞察摘要和跟进建议。");
  const [endpoint, setEndpoint] = useState("https://api.partner.example.com/v1/chat/completions");
  const [modelIdentifier, setModelIdentifier] = useState("partner-agent-v1");
  const [botId, setBotId] = useState("");
  const [authMode, setAuthMode] = useState<ThirdPartyAgentAuthMode>("Bearer Token");
  const [credential, setCredential] = useState("");
  const [apiKeyLocation, setApiKeyLocation] = useState<"Header" | "Query">("Header");
  const [apiKeyParameter, setApiKeyParameter] = useState("x-api-key");
  const [tokenUrl, setTokenUrl] = useState("https://identity.example.com/oauth/token");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [scope, setScope] = useState("");
  const [basicUsername, setBasicUsername] = useState("");
  const [basicPassword, setBasicPassword] = useState("");
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>("秘密");
  const [approvalReason, setApprovalReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isDify = interfaceSpec === "Dify Agent API";
  const isCoze = interfaceSpec === "Coze Studio Agent API";
  const isOpenAI = !isDify && !isCoze;
  const securityOptions = useMemo(() => buildSecurityLevelOptionsUpToUser(), []);

  const clearError = () => setSubmitError("");

  const reset = () => {
    setInterfaceSpec("Chat Completions");
    setName("客户洞察 Agent");
    setDescription("根据客户信息生成洞察摘要和跟进建议。");
    setEndpoint("https://api.partner.example.com/v1/chat/completions");
    setModelIdentifier("partner-agent-v1");
    setBotId("");
    setAuthMode("Bearer Token");
    setCredential("");
    setApiKeyLocation("Header");
    setApiKeyParameter("x-api-key");
    setTokenUrl("https://identity.example.com/oauth/token");
    setClientId("");
    setClientSecret("");
    setScope("");
    setBasicUsername("");
    setBasicPassword("");
    setSecurityLevel("秘密");
    setApprovalReason("");
    setSubmitting(false);
    setSubmitError("");
  };

  const handleOpenChange = (next: boolean) => {
    if (submitting) return;
    onOpenChange(next);
    if (!next) reset();
  };

  const selectInterface = (value: string) => {
    const next = value as ThirdPartyAgentInterfaceSpec;
    setInterfaceSpec(next);
    setCredential("");
    setBotId("");
    if (next === "Responses") {
      setEndpoint("https://api.partner.example.com/v1/responses");
      setAuthMode("Bearer Token");
    } else if (next === "Dify Agent API") {
      setEndpoint("https://dify.example.com/v1");
      setAuthMode("API Key");
    } else if (next === "Coze Studio Agent API") {
      setEndpoint("https://coze.example.com/v3/chat");
      setAuthMode("Bearer Token");
    } else {
      setEndpoint("https://api.partner.example.com/v1/chat/completions");
      setAuthMode("Bearer Token");
    }
    clearError();
  };

  const validate = (): string | null => {
    if (!name.trim() || !description.trim()) return "请填写 Agent 名称和能力描述。";
    if (!endpoint.trim()) return isCoze ? "请填写 Chat V3 API 请求地址。" : "请填写 API 地址。";
    if (interfaceSpec === "Chat Completions" && !modelIdentifier.trim()) return "请填写服务方提供的模型标识（model）。";
    if (isCoze && !botId.trim()) return "请填写 Coze Studio Bot ID。";
    if (authMode === "Bearer Token" || authMode === "API Key") {
      if (!credential.trim()) return isDify ? "请填写 Dify 应用 API Key。" : isCoze ? "请填写 Coze Studio Access Token。" : "请填写认证凭证。";
    }
    if (authMode === "HTTP Basic" && (!basicUsername.trim() || !basicPassword.trim())) return "请填写 HTTP Basic 用户名和密码。";
    if (authMode === "OAuth 2.0" && (!tokenUrl.trim() || !clientId.trim() || !clientSecret.trim())) return "请补充 OAuth 2.0 认证信息。";
    if (isHighSecurityLevel(securityLevel) && !approvalReason.trim()) return "请填写高密级登记申请原因。";
    return null;
  };

  const submit = () => {
    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      toast.error(validationError);
      return;
    }
    setSubmitError("");
    setSubmitting(true);
    window.setTimeout(() => {
      const connectionError = getConnectionError(endpoint, credential || clientSecret || basicPassword, interfaceSpec);
      if (connectionError) {
        setSubmitting(false);
        setSubmitError(connectionError);
        toast.error("接入校验失败，未提交登记审批。");
        return;
      }
      const created: CreatedThirdPartyAgent = {
        name: name.trim(),
        description: description.trim(),
        protocol: "OpenAI API",
        interfaceSpec,
        modelIdentifier: isOpenAI ? modelIdentifier.trim() || undefined : undefined,
        botId: isCoze ? botId.trim() : undefined,
        endpoint: endpoint.trim(),
        authMode: isDify ? "API Key" : isCoze ? "Bearer Token" : authMode,
        authConfig: {
          tokenUrl: authMode === "OAuth 2.0" ? tokenUrl.trim() : undefined,
          scope: authMode === "OAuth 2.0" ? scope.trim() : undefined,
          apiKeyLocation: authMode === "API Key" ? apiKeyLocation : undefined,
          apiKeyParameter: isDify ? "Authorization" : authMode === "API Key" ? apiKeyParameter.trim() : undefined,
          apiKeyHeader: isDify ? "Authorization" : authMode === "API Key" && apiKeyLocation === "Header" ? apiKeyParameter.trim() : undefined,
          bearerFormat: isCoze ? "Access Token" : undefined,
          username: authMode === "HTTP Basic" ? basicUsername.trim() : undefined,
        },
        securityLevel,
        approvalReason: isHighSecurityLevel(securityLevel) ? approvalReason.trim() : undefined,
      };
      setSubmitting(false);
      onCreated?.(created);
      toast.success(isHighSecurityLevel(securityLevel) ? "接入校验通过，已提交第三方 Agent 登记审批。" : "接入校验通过，第三方 Agent 已完成登记。");
      onOpenChange(false);
      reset();
    }, 900);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex h-full w-[720px] max-w-[94vw] flex-col gap-0 p-0 sm:max-w-[720px]">
        <SheetHeader className="shrink-0 border-b border-slate-200 px-6 py-5 pr-14">
          <SheetTitle className="text-xl">登记第三方 Agent</SheetTitle>
          <SheetDescription className="sr-only">通过平台支持的 API 接口登记外部 Agent</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-7">
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-5 text-blue-800">
              根据所选接口类型，填写 API 地址及必要的调用参数。平台按照对应接口规范处理请求和响应。
            </div>

            <FormSection icon={<ServerCog className="h-4 w-4" />} title="基本信息">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Agent 名称" required><Input value={name} onChange={(event) => { setName(event.target.value); clearError(); }} /></Field>
                <div className="md:col-span-2"><Field label="能力描述" required hint="请描述该 Agent 的主要能力及适用场景，帮助其他智能体判断何时调用。"><Textarea value={description} onChange={(event) => { setDescription(event.target.value); clearError(); }} className="min-h-24 resize-none" placeholder="例如：根据客户画像与历史交互生成洞察摘要和跟进建议，适用于销售跟进前的客户分析。" /></Field></div>
              </div>
            </FormSection>

            <FormSection icon={<Code2 className="h-4 w-4" />} title="接入配置">
              <Field label="接口类型" required>
                <Tabs value={interfaceSpec} onValueChange={selectInterface}>
                  <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 md:grid-cols-4">
                    {INTERFACE_OPTIONS.map((item) => <TabsTrigger key={item.value} value={item.value} className="min-h-9 px-2 text-xs">{item.label}</TabsTrigger>)}
                  </TabsList>
                </Tabs>
              </Field>
              <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">{interfaceGuidance(interfaceSpec)}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={isCoze ? "Chat V3 API 请求地址" : isOpenAI ? "服务地址" : "API 基础地址"} required><Input value={endpoint} onChange={(event) => { setEndpoint(event.target.value); clearError(); }} placeholder={isCoze ? "https://coze.example.com/v3/chat" : undefined} /></Field>
                {isOpenAI ? <Field label="模型标识（model）" required={interfaceSpec === "Chat Completions"} hint={interfaceSpec === "Chat Completions" ? "填写服务方提供的 model 值，用于指定调用目标；不是在 AF 中选择底层模型。" : "按服务方要求填写。仅当服务方支持默认调用目标时可留空，留空不传 model；保存时进行接入校验。"}><Input value={modelIdentifier} onChange={(event) => { setModelIdentifier(event.target.value); clearError(); }} placeholder="请填写服务方提供的 model 值" /></Field> : null}
                {isDify ? <Field label="调用接口"><Input value="/chat-messages" disabled /></Field> : null}
                {isCoze ? <Field label="Bot ID" required><Input value={botId} onChange={(event) => { setBotId(event.target.value); clearError(); }} /></Field> : null}
              </div>
            </FormSection>

            <FormSection icon={<KeyRound className="h-4 w-4" />} title="认证配置">
              {isDify ? <FixedCredential label="应用 API Key" value={credential} onChange={(value) => { setCredential(value); clearError(); }} hint="平台固定通过 Authorization Header 调用 Dify 应用。" /> : isCoze ? <FixedCredential label="Access Token" value={credential} onChange={(value) => { setCredential(value); clearError(); }} hint="平台固定使用 Access Token 调用已配置的 Bot。" /> : (
                <div className="space-y-4">
                  <div className="max-w-sm"><Field label="认证方式" required><Select value={authMode} onValueChange={(value) => { setAuthMode(value as ThirdPartyAgentAuthMode); clearError(); }} options={AUTH_OPTIONS} /></Field></div>
                  {(authMode === "Bearer Token" || authMode === "API Key") ? <Field label={authMode} required><Input type="password" value={credential} onChange={(event) => { setCredential(event.target.value); clearError(); }} /></Field> : null}
                  {authMode === "API Key" ? <div className="grid gap-4 md:grid-cols-2"><Field label="放置位置" required><Select value={apiKeyLocation} onValueChange={(value) => setApiKeyLocation(value as "Header" | "Query")} options={[{ value: "Header", label: "Header" }, { value: "Query", label: "Query" }]} /></Field><Field label="参数名称" required><Input value={apiKeyParameter} onChange={(event) => setApiKeyParameter(event.target.value)} /></Field></div> : null}
                  {authMode === "HTTP Basic" ? <div className="grid gap-4 md:grid-cols-2"><Field label="用户名" required><Input value={basicUsername} onChange={(event) => setBasicUsername(event.target.value)} /></Field><Field label="密码" required><Input type="password" value={basicPassword} onChange={(event) => setBasicPassword(event.target.value)} /></Field></div> : null}
                  {authMode === "OAuth 2.0" ? <div className="grid gap-4 md:grid-cols-2"><div className="md:col-span-2"><Field label="Token URL" required><Input value={tokenUrl} onChange={(event) => setTokenUrl(event.target.value)} /></Field></div><Field label="Client ID" required><Input value={clientId} onChange={(event) => setClientId(event.target.value)} /></Field><Field label="Client Secret" required><Input type="password" value={clientSecret} onChange={(event) => setClientSecret(event.target.value)} /></Field><div className="md:col-span-2"><Field label="Scope"><Input value={scope} onChange={(event) => setScope(event.target.value)} /></Field></div></div> : null}
                </div>
              )}
            </FormSection>

            <FormSection icon={<ShieldCheck className="h-4 w-4" />} title="安全设置">
              <div className="max-w-sm"><Field label="密级" required><Select value={securityLevel} onValueChange={(value) => { setSecurityLevel(value as SecurityLevel); clearError(); }} options={securityOptions} /></Field></div>
              {isHighSecurityLevel(securityLevel) ? <Field label="申请原因" required><Textarea value={approvalReason} onChange={(event) => { setApprovalReason(event.target.value); clearError(); }} maxLength={200} className="min-h-24 resize-none" placeholder="请说明申请高密级登记的业务依据和使用范围" /></Field> : null}
            </FormSection>

            {submitError ? <div role="alert" className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700"><XCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><div className="text-sm font-medium">提交失败，未发起登记审批</div><p className="mt-1 text-xs leading-5">{submitError} 已填写内容已保留，请修改后重新提交。</p></div></div> : null}
          </div>
        </div>
        <SheetFooter className="shrink-0 border-t border-slate-200 bg-white px-6 py-4 sm:justify-between">
          <span className="mr-auto self-center text-xs text-amber-700">{isHighSecurityLevel(securityLevel) ? "当前密级登记需审批" : null}</span>
          <div className="flex gap-2"><Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>取消</Button><Button onClick={submit} disabled={submitting} className="bg-blue-600 text-white hover:bg-blue-700">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}{submitting ? "正在校验并提交" : isHighSecurityLevel(securityLevel) ? "提交登记审批" : "确认登记"}</Button></div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function FormSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <section className="space-y-4"><div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-semibold text-slate-900"><span className="text-slate-500">{icon}</span>{title}</div>{children}</section>;
}

function Field({ label, required = false, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}{required ? <span className="ml-1 text-rose-500">*</span> : null}</Label>{children}{hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}</div>;
}

function FixedCredential({ label, value, onChange, hint }: { label: string; value: string; onChange: (value: string) => void; hint: string }) {
  return <div className="space-y-3"><p className="rounded-lg bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">{hint}</p><Field label={label} required><Input type="password" value={value} onChange={(event) => onChange(event.target.value)} /></Field></div>;
}

function interfaceGuidance(spec: ThirdPartyAgentInterfaceSpec): string {
  if (spec === "Dify Agent API") return "填写 Dify API 基础地址和应用 API Key；调用路径由平台固定为 /chat-messages。";
  if (spec === "Coze Studio Agent API") return "填写 Chat V3 API 请求地址、Access Token 及 Bot ID。平台按照 Coze Studio Chat V3 接口规范完成调用，默认使用标准路径 /v3/chat，支持填写实际部署环境提供的完整接口地址。";
  return `平台按 OpenAI ${spec === "Responses" ? "Responses" : "Chat Completions"} 标准组装请求与解析响应，不支持自定义字段映射。`;
}

function getConnectionError(endpoint: string, credential: string, spec: ThirdPartyAgentInterfaceSpec): string | null {
  if (/unreachable|offline|connection-error|timeout/i.test(endpoint)) return "无法连接 API 地址，请检查地址、网络或 TLS 配置。";
  if (/invalid|expired|auth-error|unauthorized/i.test(credential)) return "API 可达，但认证凭证无效或已过期。";
  if (/invalid-response|interface-error|schema-error/i.test(endpoint)) return `连接与认证通过，但响应不符合 ${spec} 规范。`;
  return null;
}
