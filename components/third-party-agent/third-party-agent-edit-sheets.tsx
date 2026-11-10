"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CircleDashed, Loader2, RefreshCw, XCircle } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
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
  ThirdPartyAgentProtocol,
  ThirdPartyAgentRecord,
} from "@/lib/mock/third-party-agents";
import {
  buildSecurityLevelOptionsUpToUser,
  type SecurityLevel,
} from "@/lib/security-level";

const AUTH_OPTIONS = [
  { value: "Bearer Token", label: "Bearer Token" },
  { value: "API Key", label: "API Key" },
  { value: "HTTP Basic", label: "HTTP Basic" },
  { value: "OAuth 2.0", label: "OAuth 2.0（Client Credentials）" },
  { value: "无认证", label: "未声明认证" },
];

const AUTH_LABELS: Record<ThirdPartyAgentRecord["authMode"], string> = {
  "Bearer Token": "Bearer Token",
  "API Key": "API Key",
  "HTTP Basic": "HTTP Basic",
  "OAuth 2.0": "OAuth 2.0（Client Credentials）",
  "无认证": "无认证",
};

const A2A_PREVIEW_OPTIONS: Array<{
  value: ThirdPartyAgentRecord["authMode"];
  label: string;
}> = [
  { value: "OAuth 2.0", label: "OAuth 2.0" },
  { value: "API Key", label: "API Key" },
  { value: "Bearer Token", label: "Bearer Token" },
  { value: "HTTP Basic", label: "HTTP Basic" },
  { value: "无认证", label: "无认证" },
];

type PrototypeTestScenario = "success" | "connection-error" | "auth-error" | "interface-error";
type ValidationState = "idle" | "success" | "error" | "skipped";

interface ConnectionTestResult {
  connection: ValidationState;
  authentication: ValidationState;
  interface: ValidationState;
}

const INITIAL_TEST_RESULT: ConnectionTestResult = {
  connection: "idle",
  authentication: "idle",
  interface: "idle",
};

const TEST_SCENARIO_OPTIONS = [
  { value: "success", label: "全部通过" },
  { value: "connection-error", label: "服务不可达" },
  { value: "auth-error", label: "认证失败" },
  { value: "interface-error", label: "接口校验失败" },
];

const A2A_TEST_SCENARIO_OPTIONS = TEST_SCENARIO_OPTIONS.filter(
  (option) => option.value !== "interface-error"
);

export function ThirdPartyAgentBasicEditSheet({
  open,
  onOpenChange,
  initialName,
  initialDescription,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  initialDescription: string;
  onSave: (value: {
    name: string;
    description: string;
  }) => void;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  const save = () => {
    if (!name.trim() || !description.trim()) {
      toast.error("请填写名称和能力描述。");
      return;
    }
    onSave({
      name: name.trim(),
      description: description.trim(),
    });
    onOpenChange(false);
    toast.success("登记信息已更新。");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-full w-[560px] max-w-[94vw] flex-col gap-0 p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b border-slate-200 px-6 py-5 pr-14">
          <SheetTitle>编辑登记信息</SheetTitle>
          <SheetDescription className="sr-only">编辑第三方 Agent 的平台登记信息</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <Field label="名称" required>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="能力描述" required>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-28 resize-none" />
          </Field>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
            密级不属于普通登记信息，请从详情页的“调整密级”入口单独提交。
          </div>
        </div>
        <SheetFooter className="border-t border-slate-200 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={save} className="bg-blue-600 text-white hover:bg-blue-700">保存</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function ThirdPartyAgentSecurityEditSheet({
  open,
  onOpenChange,
  initialSecurityLevel,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSecurityLevel: SecurityLevel;
  onSave: (value: SecurityLevel) => void;
}) {
  const [securityLevel, setSecurityLevel] = useState(initialSecurityLevel);
  const [reason, setReason] = useState("");
  const securityOptions = useMemo(() => buildSecurityLevelOptionsUpToUser(), []);

  const submit = () => {
    if (securityLevel === initialSecurityLevel) {
      toast.error("请选择新的密级。");
      return;
    }
    if (!reason.trim()) {
      toast.error("请填写调整原因。");
      return;
    }
    onSave(securityLevel);
    onOpenChange(false);
    toast.success("密级调整已单独提交，将按安全规则审批或生效。");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-full w-[520px] max-w-[94vw] flex-col gap-0 p-0 sm:max-w-[520px]">
        <SheetHeader className="border-b border-slate-200 px-6 py-5 pr-14">
          <SheetTitle>调整密级</SheetTitle>
          <SheetDescription>密级调整与普通信息编辑分开处理，并记录独立原因。</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
            <div><div className="text-xs text-slate-500">当前密级</div><div className="mt-1 text-sm font-medium text-slate-900">{initialSecurityLevel}</div></div>
            <Field label="调整为" required><Select value={securityLevel} onValueChange={(value) => setSecurityLevel(value as SecurityLevel)} options={securityOptions} /></Field>
          </div>
          <Field label="调整原因" required><Textarea value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-28 resize-none" placeholder="说明调整依据与业务影响" /></Field>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            提交后由密级规则决定直接生效或进入审批；审批完成前继续使用当前密级。
          </div>
        </div>
        <SheetFooter className="border-t border-slate-200 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={submit} className="bg-blue-600 text-white hover:bg-blue-700">提交密级调整</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function ThirdPartyAgentConnectionEditSheet({
  open,
  onOpenChange,
  protocol,
  initialEndpoint,
  initialAgentCardSource,
  initialAgentCardJson,
  initialInterfaceSpec,
  initialModelIdentifier,
  initialBotId,
  initialAuthMode,
  initialAuthConfig,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocol: ThirdPartyAgentProtocol;
  initialEndpoint: string;
  initialAgentCardSource?: "URL" | "JSON";
  initialAgentCardJson?: string;
  initialInterfaceSpec: ThirdPartyAgentInterfaceSpec;
  initialModelIdentifier?: string;
  initialBotId?: string;
  initialAuthMode: ThirdPartyAgentRecord["authMode"];
  initialAuthConfig?: ThirdPartyAgentAuthConfig;
  onSave: (value: {
    endpoint: string;
    agentCardSource?: "URL" | "JSON";
    agentCardJson?: string;
    interfaceSpec: ThirdPartyAgentInterfaceSpec;
    modelIdentifier?: string;
    botId?: string;
    authMode: ThirdPartyAgentRecord["authMode"];
    authConfig: ThirdPartyAgentAuthConfig;
  }) => void;
}) {
  const [endpoint, setEndpoint] = useState(initialEndpoint);
  const [agentCardSource, setAgentCardSource] = useState<"URL" | "JSON">(initialAgentCardSource ?? "URL");
  const [agentCardJson, setAgentCardJson] = useState(initialAgentCardJson ?? '{\n  "name": "示例外部 Agent",\n  "description": "提供外部业务能力",\n  "url": "https://agent.partner.example.com/a2a",\n  "version": "1.0.0",\n  "protocolVersion": "1.0",\n  "preferredTransport": "JSONRPC"\n}');
  const [interfaceSpec, setInterfaceSpec] = useState<ThirdPartyAgentInterfaceSpec>(initialInterfaceSpec);
  const [modelIdentifier, setModelIdentifier] = useState(initialModelIdentifier ?? "");
  const [botId, setBotId] = useState(initialBotId ?? "");
  const [authMode, setAuthMode] = useState<ThirdPartyAgentRecord["authMode"]>(initialAuthMode);
  const [agentCardAuthDeclared, setAgentCardAuthDeclared] = useState(initialAuthMode !== "无认证");
  const [manualAuthEnabled, setManualAuthEnabled] = useState(false);
  const [credential, setCredential] = useState("");
  const [apiKeyHeader, setApiKeyHeader] = useState(initialAuthConfig?.apiKeyParameter ?? initialAuthConfig?.apiKeyHeader ?? "x-api-key");
  const [apiKeyLocation, setApiKeyLocation] = useState<"Header" | "Query">(initialAuthConfig?.apiKeyLocation ?? "Header");
  const [tokenUrl, setTokenUrl] = useState(initialAuthConfig?.tokenUrl ?? "https://agent.partner.example.com/oauth/token");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [scope, setScope] = useState(initialAuthConfig?.scope ?? "agent.invoke");
  const [bearerFormat, setBearerFormat] = useState(initialAuthConfig?.bearerFormat ?? "Token");
  const [basicUsername, setBasicUsername] = useState(initialAuthConfig?.username ?? "");
  const [basicPassword, setBasicPassword] = useState("");
  const [agentCardParsed, setAgentCardParsed] = useState(protocol !== "A2A" || Boolean(initialEndpoint));
  const [a2aProtocolVersion, setA2AProtocolVersion] = useState(initialEndpoint.toLowerCase().includes("legacy") ? "0.3" : "1.0");
  const [a2aProtocolBinding, setA2AProtocolBinding] = useState("JSON-RPC");
  const [a2aServiceEndpoint, setA2AServiceEndpoint] = useState(resolveA2AServiceEndpoint(initialEndpoint));
  const [parsing, setParsing] = useState(false);
  const [agentCardParseError, setAgentCardParseError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testScenario, setTestScenario] = useState<PrototypeTestScenario>("success");
  const [testResult, setTestResult] = useState<ConnectionTestResult>(INITIAL_TEST_RESULT);
  const [tested, setTestedState] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const testPassed = Object.values(testResult).every((state) => state === "success");
  const testFailed = Object.values(testResult).includes("error");
  const testScenarioOptions = protocol === "A2A" ? A2A_TEST_SCENARIO_OPTIONS : TEST_SCENARIO_OPTIONS;
  const isDify = interfaceSpec === "Dify Agent API";
  const isCoze = interfaceSpec === "Coze Studio Agent API";
  const isOpenAI = protocol !== "A2A" && !isDify && !isCoze;
  const initialCardSource = initialAgentCardSource ?? "URL";
  const initialCardValue = initialCardSource === "URL"
    ? initialEndpoint || "—"
    : initialAgentCardJson?.trim()
      ? `已登记 JSON（${initialAgentCardJson.trim().length} 字符）`
      : "已登记 JSON";
  const nextCardValue = agentCardSource === "URL"
    ? endpoint || "—"
    : `已粘贴 JSON（${agentCardJson.trim().length} 字符，${agentCardJson.trim() === (initialAgentCardJson ?? "").trim() ? "内容未修改" : "内容已修改"}）`;

  const setTested = (value: boolean) => {
    setTestedState(value);
    if (!value) setTestResult(INITIAL_TEST_RESULT);
  };

  const markChanged = () => setTested(false);

  const previewAuthMode = (mode: ThirdPartyAgentRecord["authMode"]) => {
    setAuthMode(mode);
    setAgentCardParsed(true);
    setAgentCardAuthDeclared(mode !== "无认证");
    setManualAuthEnabled(false);
    setCredential("");
    setClientId("");
    setClientSecret("");
    setBasicPassword("");
    if (mode === "OAuth 2.0") {
      setTokenUrl("https://agent.partner.example.com/oauth/token");
      setScope("agent.invoke");
    }
    if (mode === "API Key") setApiKeyHeader("x-agent-key");
    if (mode === "Bearer Token") setBearerFormat("JWT");
    markChanged();
  };

  const parseAgentCard = () => {
    if (agentCardSource === "URL" && !endpoint.trim()) {
      setAgentCardParseError("请先填写 AgentCard URL。");
      toast.error("请先填写 AgentCard URL。");
      return;
    }
    if (agentCardSource === "JSON" && !agentCardJson.trim()) {
      setAgentCardParseError("请先粘贴 AgentCard JSON。");
      toast.error("请先粘贴 AgentCard JSON。");
      return;
    }
    if (agentCardSource === "JSON") {
      try {
        validateAgentCardForImport(JSON.parse(agentCardJson));
      } catch (error) {
        const message = error instanceof Error ? error.message : "AgentCard JSON 解析失败，请检查格式。";
        setAgentCardParsed(false);
        setAgentCardParseError(message);
        toast.error(message);
        return;
      }
    }
    setAgentCardParseError("");
    setParsing(true);
    window.setTimeout(() => {
      try {
        if (agentCardSource === "URL" && /invalid|parse-error|unsupported-version/i.test(endpoint)) {
          throw new Error("AgentCard 解析失败：声明格式、协议版本或服务接口不受平台支持。");
        }
        const detected = inferMockAgentCardAuth(agentCardSource === "URL" ? endpoint : agentCardJson, initialAuthMode);
        const connection = resolveA2AConnection(agentCardSource, endpoint, agentCardJson);
        const detectedMode = detected.mode;
        setAuthMode(detectedMode);
        setAgentCardAuthDeclared(detected.declared);
        setManualAuthEnabled(false);
        if (detectedMode === "OAuth 2.0") {
          setTokenUrl(initialAuthConfig?.tokenUrl ?? "https://agent.partner.example.com/oauth/token");
          setScope(initialAuthConfig?.scope ?? "agent.invoke");
        }
        if (detectedMode === "API Key") setApiKeyHeader(initialAuthConfig?.apiKeyHeader ?? "x-agent-key");
        if (detectedMode === "Bearer Token") setBearerFormat(initialAuthConfig?.bearerFormat ?? "JWT");
        setA2AProtocolVersion(connection.protocolVersion);
        setA2AProtocolBinding(connection.protocolBinding);
        setA2AServiceEndpoint(connection.serviceEndpoint);
        setAgentCardParsed(true);
        setAgentCardParseError("");
        setTested(false);
        toast.success(detected.declared
          ? "AgentCard 解析与兼容校验通过，已更新认证要求。"
          : "AgentCard 解析与兼容校验通过；未声明认证，默认按无认证接入。"
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "AgentCard 解析失败，请检查声明内容。";
        setAgentCardParsed(false);
        setTested(false);
        setAgentCardParseError(message);
        toast.error(message);
      } finally {
        setParsing(false);
      }
    }, 500);
  };

  const test = () => {
    if ((protocol !== "A2A" || agentCardSource === "URL") && !endpoint.trim()) {
      toast.error("请填写服务地址。");
      return;
    }
    if (isOpenAI && !modelIdentifier.trim()) {
      toast.error("请填写模型或服务标识。");
      return;
    }
    if (isCoze && !botId.trim()) {
      toast.error("请填写 Bot ID。");
      return;
    }
    if (protocol === "A2A" && !agentCardParsed) {
      toast.error("请先重新解析 AgentCard。");
      return;
    }
    setTesting(true);
    window.setTimeout(() => {
      setTesting(false);
      setTested(true);
      setTestResult(buildConnectionTestResult(testScenario));
      if (testScenario === "success") toast.success("连接测试通过。");
      if (testScenario === "connection-error") toast.error("服务不可达，请检查地址与网络配置。");
      if (testScenario === "auth-error") toast.error("服务可达，但认证未通过。");
      if (testScenario === "interface-error") toast.error(`${interfaceSpec} 响应结构校验失败。`);
    }, 650);
  };

  const confirmSave = () => {
    if (!testPassed) return;
    onSave({
      endpoint: endpoint.trim(),
      agentCardSource: protocol === "A2A" ? agentCardSource : undefined,
      agentCardJson: protocol === "A2A" && agentCardSource === "JSON" ? agentCardJson : undefined,
      interfaceSpec: protocol === "A2A" ? "A2A" : interfaceSpec,
      modelIdentifier: isOpenAI ? modelIdentifier.trim() : undefined,
      botId: isCoze ? botId.trim() : undefined,
      authMode: isDify ? "API Key" : isCoze ? "Bearer Token" : authMode,
      authConfig: {
        tokenUrl: !isDify && !isCoze && authMode === "OAuth 2.0" ? tokenUrl.trim() : undefined,
        scope: !isDify && !isCoze && authMode === "OAuth 2.0" ? scope.trim() : undefined,
        apiKeyLocation: isDify ? "Header" : !isCoze && authMode === "API Key" ? apiKeyLocation : undefined,
        apiKeyParameter: isDify ? "Authorization" : !isCoze && authMode === "API Key" ? apiKeyHeader.trim() : undefined,
        apiKeyHeader: isDify ? "Authorization" : !isCoze && authMode === "API Key" && apiKeyLocation === "Header" ? apiKeyHeader.trim() : undefined,
        bearerFormat: isCoze ? "Access Token" : authMode === "Bearer Token" ? bearerFormat : undefined,
        username: authMode === "HTTP Basic" ? basicUsername.trim() : undefined,
      },
    });
    setConfirmOpen(false);
    onOpenChange(false);
    toast.success("新配置已生效；原配置已由平台保留为变更记录。");
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-full w-[560px] max-w-[94vw] flex-col gap-0 p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b border-slate-200 px-6 py-5 pr-14">
          <SheetTitle>编辑接入配置</SheetTitle>
          <SheetDescription className="sr-only">编辑第三方 Agent 的服务地址和认证配置</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <Field label="接入协议">
            <Input value={protocol === "A2A" ? "A2A" : "API"} disabled />
          </Field>
          {protocol !== "A2A" ? (
            <div className="space-y-5">
              <Field label="接口类型" required><Select value={interfaceSpec} onValueChange={(value) => {
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
                  setEndpoint("https://coze.example.com");
                  setAuthMode("Bearer Token");
                } else {
                  setEndpoint("https://api.partner.example.com/v1/chat/completions");
                  setAuthMode("Bearer Token");
                }
                markChanged();
              }} options={[
                { value: "Chat Completions", label: "OpenAI Chat Completions" },
                { value: "Responses", label: "OpenAI Responses" },
                { value: "Dify Agent API", label: "Dify Agent API" },
                { value: "Coze Studio Agent API", label: "Coze Studio Agent API" },
              ]} /></Field>
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-5 text-blue-800">
                {interfaceSpec === "Chat Completions"
                  ? "适配标准 messages 请求与 choices.message 响应；平台不开放自定义字段映射。"
                  : interfaceSpec === "Responses"
                    ? "适配标准 input、输出项与任务状态；平台不开放自定义字段映射。"
                    : interfaceSpec === "Dify Agent API"
                      ? "平台固定调用 /chat-messages，不需要配置模型标识。"
                      : "平台固定调用 /v3/chat，不需要配置模型标识。"}
              </div>
              {isOpenAI ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="服务地址" required><Input value={endpoint} onChange={(event) => { setEndpoint(event.target.value); markChanged(); }} /></Field>
                  <Field label="模型 / 服务标识" required><Input value={modelIdentifier} onChange={(event) => { setModelIdentifier(event.target.value); markChanged(); }} /></Field>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="API 基础地址" required><Input value={endpoint} onChange={(event) => { setEndpoint(event.target.value); markChanged(); }} /></Field>
                  <Field label="调用接口"><Input value={isDify ? "/chat-messages" : "/v3/chat"} disabled /></Field>
                  {isCoze ? <div className="sm:col-span-2"><Field label="Bot ID" required><Input value={botId} onChange={(event) => { setBotId(event.target.value); markChanged(); }} /></Field></div> : null}
                </div>
              )}
            </div>
          ) : null}
          {protocol === "A2A" ? (
            <div className="space-y-4">
              <Field label="AgentCard 来源" required><Select value={agentCardSource} onValueChange={(value) => { setAgentCardSource(value as "URL" | "JSON"); setAgentCardParsed(false); setAgentCardParseError(""); markChanged(); }} options={[{ value: "URL", label: "AgentCard URL" }, { value: "JSON", label: "粘贴 JSON" }]} /></Field>
              {agentCardSource === "JSON" ? <Field label="AgentCard JSON" required><Textarea value={agentCardJson} onChange={(event) => { setAgentCardJson(event.target.value); setAgentCardParsed(false); setAgentCardParseError(""); markChanged(); }} className="min-h-40 font-mono text-xs leading-5" /></Field> : <Field label="AgentCard URL" required><Input value={endpoint} onChange={(event) => { setEndpoint(event.target.value); setAgentCardParsed(false); setAgentCardParseError(""); markChanged(); }} /></Field>}
            </div>
          ) : null}
          {protocol === "A2A" ? (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button variant="outline" onClick={parseAgentCard} disabled={parsing}>
                  {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {parsing ? "解析中" : "重新解析 AgentCard"}
                </Button>
              </div>
              {agentCardParseError ? (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{agentCardParseError}</span>
                </div>
              ) : null}
              {agentCardParsed && !agentCardParseError ? (
                <div className="overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50/40">
                  <div className="flex items-center justify-between border-b border-emerald-100 px-4 py-3">
                    <span className="text-sm font-medium text-emerald-900">兼容性校验通过</span>
                    <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">平台支持</span>
                  </div>
                  <dl className="grid gap-4 px-4 py-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs text-slate-500">A2A 协议版本</dt><dd className="mt-1 font-medium text-slate-900">{a2aProtocolVersion}</dd></div>
                    <div><dt className="text-xs text-slate-500">传输绑定</dt><dd className="mt-1 font-medium text-slate-900">{a2aProtocolBinding}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-xs text-slate-500">实际接入端点</dt><dd className="mt-1 break-all font-mono text-xs text-slate-800">{a2aServiceEndpoint}</dd></div>
                  </dl>
                </div>
              ) : null}
            </div>
          ) : null}
          {protocol === "A2A" ? (
            <div className="rounded-lg border border-dashed border-violet-200 bg-violet-50/60 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-violet-900">原型演示：模拟认证声明</span>
                <span className="text-[11px] text-violet-600">正式功能以解析结果为准</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {A2A_PREVIEW_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => previewAuthMode(option.value)}
                    className={agentCardParsed && (option.value === "无认证"
                      ? !agentCardAuthDeclared
                      : agentCardAuthDeclared && authMode === option.value)
                      ? "rounded-md border border-violet-500 bg-white px-2 py-2 text-xs font-medium text-violet-700 shadow-sm"
                      : "rounded-md border border-violet-100 bg-white/70 px-2 py-2 text-xs text-slate-600 transition-colors hover:border-violet-300"}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {protocol === "A2A" && !agentCardParsed ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">重新解析后显示认证要求</div>
          ) : protocol === "A2A" ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-900">AgentCard 认证声明</span>
                  <span className={agentCardAuthDeclared
                    ? "rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                    : "rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-600"}
                  >{agentCardAuthDeclared ? "已声明" : "未声明"}</span>
                </div>
                <dl className="mt-4 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-slate-500">{agentCardAuthDeclared ? "认证方式" : "默认调用方式"}</dt><dd className="mt-1 font-medium text-slate-900">{agentCardAuthDeclared ? AUTH_LABELS[authMode] : "不携带认证信息"}</dd></div>
                  {agentCardAuthDeclared && authMode === "OAuth 2.0" ? <><div><dt className="text-xs text-slate-500">Token URL</dt><dd className="mt-1 break-all text-slate-700">{tokenUrl}</dd></div><div><dt className="text-xs text-slate-500">Scope</dt><dd className="mt-1 text-slate-700">{scope || "—"}</dd></div></> : null}
                  {agentCardAuthDeclared && authMode === "API Key" ? <div><dt className="text-xs text-slate-500">Header 名称</dt><dd className="mt-1 text-slate-700">{apiKeyHeader}</dd></div> : null}
                  {agentCardAuthDeclared && authMode === "Bearer Token" ? <><div><dt className="text-xs text-slate-500">传递方式</dt><dd className="mt-1 text-slate-700">Authorization: Bearer</dd></div><div><dt className="text-xs text-slate-500">Token 格式</dt><dd className="mt-1 text-slate-700">{bearerFormat}</dd></div></> : null}
                  {agentCardAuthDeclared && authMode === "HTTP Basic" ? <div><dt className="text-xs text-slate-500">传递方式</dt><dd className="mt-1 text-slate-700">Authorization: Basic</dd></div> : null}
                </dl>
                {!agentCardAuthDeclared ? (
                  <div className="mt-4 flex items-start justify-between gap-4 border-t border-slate-200 pt-4">
                    <div>
                      <div className="text-sm font-medium text-slate-900">添加认证信息（可选）</div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">可按外部服务的实际要求选择是否添加；未添加不会阻断保存，平台调用时不携带认证信息。</p>
                    </div>
                    <Switch
                      checked={manualAuthEnabled}
                      onCheckedChange={(checked) => {
                        setManualAuthEnabled(checked);
                        setAuthMode(checked ? "Bearer Token" : "无认证");
                        markChanged();
                      }}
                      aria-label="添加认证信息"
                    />
                  </div>
                ) : null}
              </div>
              {!agentCardAuthDeclared && manualAuthEnabled ? (
                <Field label="认证方式" required>
                  <Select value={authMode} onValueChange={(value) => { setAuthMode(value as ThirdPartyAgentRecord["authMode"]); markChanged(); }} options={AUTH_OPTIONS.filter((option) => option.value !== "无认证")} />
                </Field>
              ) : null}
              {(agentCardAuthDeclared || manualAuthEnabled) && authMode !== "无认证" ? (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-slate-900">更新凭证</div>
                  {authMode === "OAuth 2.0" ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Client ID"><Input name="edit-a2a-client-id" autoComplete="off" value={clientId} onChange={(event) => { setClientId(event.target.value); markChanged(); }} placeholder="留空表示不修改" /></Field>
                      <Field label="Client Secret"><Input name="edit-a2a-client-secret" autoComplete="new-password" data-1p-ignore="true" data-lpignore="true" type="password" value={clientSecret} onChange={(event) => { setClientSecret(event.target.value); markChanged(); }} placeholder="留空表示不修改" /></Field>
                    </div>
                  ) : null}
                  {authMode === "Bearer Token" ? <Field label="Bearer Token"><Input name="edit-a2a-bearer-token" autoComplete="new-password" data-1p-ignore="true" data-lpignore="true" type="password" value={credential} onChange={(event) => { setCredential(event.target.value); markChanged(); }} placeholder="留空表示不修改" /></Field> : null}
                  {authMode === "API Key" ? <Field label="API Key"><Input name="edit-a2a-api-key" autoComplete="new-password" data-1p-ignore="true" data-lpignore="true" type="password" value={credential} onChange={(event) => { setCredential(event.target.value); markChanged(); }} placeholder="留空表示不修改" /></Field> : null}
                  {authMode === "HTTP Basic" ? <div className="grid gap-4 sm:grid-cols-2"><Field label="用户名"><Input value={basicUsername} onChange={(event) => { setBasicUsername(event.target.value); markChanged(); }} placeholder="留空表示不修改" /></Field><Field label="密码"><Input name="edit-a2a-basic-password" autoComplete="new-password" type="password" value={basicPassword} onChange={(event) => { setBasicPassword(event.target.value); markChanged(); }} placeholder="留空表示不修改" /></Field></div> : null}
                </div>
              ) : null}
            </div>
          ) : isDify ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-sm font-medium text-slate-900">Dify 应用认证</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">应用 API Key 已配置；留空表示继续使用当前凭证。</p>
              </div>
              <Field label="更新应用 API Key"><Input name="edit-dify-api-key" autoComplete="new-password" type="password" value={credential} onChange={(event) => { setCredential(event.target.value); markChanged(); }} placeholder="留空表示不修改" /></Field>
            </div>
          ) : isCoze ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-sm font-medium text-slate-900">Coze Studio 访问认证</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">Access Token 已配置；留空表示继续使用当前凭证。</p>
              </div>
              <Field label="更新 Access Token"><Input name="edit-coze-access-token" autoComplete="new-password" type="password" value={credential} onChange={(event) => { setCredential(event.target.value); markChanged(); }} placeholder="留空表示不修改" /></Field>
            </div>
          ) : (
            <div className="space-y-5">
              <Field label="认证方式" required>
                <Select value={authMode} onValueChange={(value) => { setAuthMode(value as ThirdPartyAgentRecord["authMode"]); markChanged(); }} options={AUTH_OPTIONS} />
              </Field>
              {authMode === "Bearer Token" ? (
                <Field label="更新 Bearer Token"><Input name="edit-openai-bearer-token" autoComplete="new-password" type="password" value={credential} onChange={(event) => { setCredential(event.target.value); markChanged(); }} placeholder="留空表示不修改" /></Field>
              ) : null}
              {authMode === "API Key" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="放置位置" required><Select value={apiKeyLocation} onValueChange={(value) => { setApiKeyLocation(value as "Header" | "Query"); markChanged(); }} options={[{ value: "Header", label: "Header" }, { value: "Query", label: "Query" }]} /></Field>
                  <Field label="参数名称" required><Input value={apiKeyHeader} onChange={(event) => { setApiKeyHeader(event.target.value); markChanged(); }} /></Field>
                  <div className="sm:col-span-2"><Field label="更新 API Key"><Input name="edit-openai-api-key" autoComplete="new-password" type="password" value={credential} onChange={(event) => { setCredential(event.target.value); markChanged(); }} placeholder="留空表示不修改" /></Field></div>
                </div>
              ) : null}
              {authMode === "HTTP Basic" ? <div className="grid gap-4 sm:grid-cols-2"><Field label="用户名"><Input value={basicUsername} onChange={(event) => { setBasicUsername(event.target.value); markChanged(); }} placeholder="留空表示不修改" /></Field><Field label="密码"><Input name="edit-openai-basic-password" autoComplete="new-password" type="password" value={basicPassword} onChange={(event) => { setBasicPassword(event.target.value); markChanged(); }} placeholder="留空表示不修改" /></Field></div> : null}
              {authMode === "OAuth 2.0" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                  <Field label="Token URL" required><Input value={tokenUrl} onChange={(event) => { setTokenUrl(event.target.value); markChanged(); }} /></Field>
                  </div>
                  <Field label="Client ID"><Input name="edit-openai-client-id" autoComplete="off" value={clientId} onChange={(event) => { setClientId(event.target.value); markChanged(); }} placeholder="留空表示不修改" /></Field>
                  <Field label="Client Secret"><Input name="edit-openai-client-secret" autoComplete="new-password" type="password" value={clientSecret} onChange={(event) => { setClientSecret(event.target.value); markChanged(); }} placeholder="留空表示不修改" /></Field>
                  <div className="sm:col-span-2"><Field label="Scope"><Input value={scope} onChange={(event) => { setScope(event.target.value); markChanged(); }} /></Field></div>
                </div>
              ) : null}
            </div>
          )}
          <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-sm font-medium text-slate-900">测试结果演示</div><p className="mt-1 text-xs text-slate-500">仅用于原型查看不同验证结果。</p></div>
              <Select value={testScenario} onValueChange={(value) => { setTestScenario(value as PrototypeTestScenario); setTested(false); }} options={testScenarioOptions} className="w-44" />
            </div>
          </div>
          <div className={testPassed ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3" : testFailed ? "rounded-lg border border-rose-200 bg-rose-50 px-4 py-3" : "rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <EditTestResultStatus testing={testing} tested={tested} passed={testPassed} scenario={testScenario} />
              <Button variant="outline" onClick={test} disabled={testing} className="bg-white">
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {testing ? "测试中" : tested ? "重新测试" : "测试连接"}
              </Button>
            </div>
            {tested ? <p className={testPassed ? "mt-3 border-t border-emerald-200 pt-3 text-xs leading-5 text-emerald-700" : "mt-3 border-t border-rose-200 pt-3 text-xs leading-5 text-rose-700"}>{testResultSummary(testScenario, protocol === "A2A", interfaceSpec, authMode === "无认证")}</p> : null}
          </div>
        </div>
        <SheetFooter className="border-t border-slate-200 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={() => setConfirmOpen(true)} disabled={!testPassed} className="bg-blue-600 text-white hover:bg-blue-700">查看变更并保存</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent className="max-w-[620px]">
        <DialogHeader>
          <DialogTitle>确认接入配置变更</DialogTitle>
          <DialogDescription>仅在重新校验通过后替换当前生效配置。</DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-lg border border-slate-200 text-sm">
          {protocol === "A2A" ? (
            <>
              <div className="grid grid-cols-[120px_1fr_24px_1fr] items-start gap-3 border-b border-slate-200 px-4 py-3">
                <span className="text-slate-500">AgentCard 来源</span>
                <span className="text-slate-600">{initialCardSource === "URL" ? "AgentCard URL" : "粘贴 JSON"}</span>
                <span className="text-center text-slate-400">→</span>
                <span className="font-medium text-slate-900">{agentCardSource === "URL" ? "AgentCard URL" : "粘贴 JSON"}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr_24px_1fr] items-start gap-3 border-b border-slate-200 px-4 py-3">
                <span className="text-slate-500">{agentCardSource === "URL" ? "AgentCard URL" : "AgentCard JSON"}</span>
                <span className="break-all text-slate-600">{initialCardValue}</span>
                <span className="text-center text-slate-400">→</span>
                <span className="break-all font-medium text-slate-900">{nextCardValue}</span>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-[120px_1fr_24px_1fr] items-start gap-3 border-b border-slate-200 px-4 py-3">
              <span className="text-slate-500">服务地址</span>
              <span className="break-all text-slate-600">{initialEndpoint || "—"}</span>
              <span className="text-center text-slate-400">→</span>
              <span className="break-all font-medium text-slate-900">{endpoint || "—"}</span>
            </div>
          )}
          {protocol !== "A2A" ? <div className="grid grid-cols-[120px_1fr_24px_1fr] items-center gap-3 border-b border-slate-200 px-4 py-3"><span className="text-slate-500">接口类型</span><span className="text-slate-600">{formatInterfaceSpec(initialInterfaceSpec)}</span><span className="text-center text-slate-400">→</span><span className="font-medium text-slate-900">{formatInterfaceSpec(interfaceSpec)}</span></div> : null}
          {protocol !== "A2A" && (initialInterfaceSpec === "Coze Studio Agent API" || isCoze) ? <div className="grid grid-cols-[120px_1fr_24px_1fr] items-center gap-3 border-b border-slate-200 px-4 py-3"><span className="text-slate-500">Bot ID</span><span className="text-slate-600">{initialBotId || "—"}</span><span className="text-center text-slate-400">→</span><span className="font-medium text-slate-900">{botId || "—"}</span></div> : null}
          <div className="grid grid-cols-[120px_1fr_24px_1fr] items-center gap-3 px-4 py-3">
            <span className="text-slate-500">认证方式</span>
            <span className="text-slate-600">{formatAuthDisplay(initialInterfaceSpec, initialAuthMode)}</span>
            <span className="text-center text-slate-400">→</span>
            <span className="font-medium text-slate-900">{formatAuthDisplay(interfaceSpec, authMode)}</span>
          </div>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
          已有引用关系保持不变，新调用使用新配置；若重新校验失败，平台不会覆盖当前生效配置。
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>返回修改</Button>
          <Button onClick={confirmSave} className="bg-blue-600 text-white hover:bg-blue-700">确认替换当前配置</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

function EditTestResultStatus({
  testing,
  tested,
  passed,
  scenario,
}: {
  testing: boolean;
  tested: boolean;
  passed: boolean;
  scenario: PrototypeTestScenario;
}) {
  const value = testing
    ? "正在测试"
    : !tested
      ? "未测试"
      : passed
        ? "测试通过"
        : scenario === "connection-error"
          ? "服务不可达"
          : scenario === "auth-error"
            ? "认证失败"
            : "接口校验失败";

  return (
    <div className="flex items-center gap-2 text-sm text-slate-700">
      {testing ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" /> : null}
      {!testing && tested && passed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : null}
      {!testing && tested && !passed ? <XCircle className="h-4 w-4 shrink-0 text-rose-600" /> : null}
      {!testing && !tested ? <CircleDashed className="h-4 w-4 shrink-0 text-slate-400" /> : null}
      <div><div className="text-[11px] text-slate-500">测试结果</div><div className={tested && passed ? "font-medium text-emerald-900" : tested && !passed ? "font-medium text-rose-900" : "font-medium text-slate-600"}>{value}</div></div>
    </div>
  );
}

function buildConnectionTestResult(scenario: PrototypeTestScenario): ConnectionTestResult {
  if (scenario === "connection-error") return { connection: "error", authentication: "skipped", interface: "skipped" };
  if (scenario === "auth-error") return { connection: "success", authentication: "error", interface: "skipped" };
  if (scenario === "interface-error") return { connection: "success", authentication: "success", interface: "error" };
  return { connection: "success", authentication: "success", interface: "success" };
}

function formatInterfaceSpec(interfaceSpec: ThirdPartyAgentInterfaceSpec): string {
  if (interfaceSpec === "Chat Completions") return "OpenAI Chat Completions";
  if (interfaceSpec === "Responses") return "OpenAI Responses";
  return interfaceSpec;
}

function formatAuthDisplay(interfaceSpec: ThirdPartyAgentInterfaceSpec, authMode: ThirdPartyAgentRecord["authMode"]): string {
  if (interfaceSpec === "Dify Agent API") return "应用 API Key（已配置）";
  if (interfaceSpec === "Coze Studio Agent API") return "Access Token（已配置）";
  return AUTH_LABELS[authMode];
}

function testResultSummary(scenario: PrototypeTestScenario, isA2A: boolean, interfaceSpec: ThirdPartyAgentInterfaceSpec, noAuth: boolean): string {
  if (scenario === "connection-error") return "无法连接服务地址，请检查地址、网络或 TLS 配置；认证与接口校验未执行。";
  if (scenario === "auth-error") return noAuth
    ? "AgentCard 未声明认证，但服务返回未授权；请开启平台补充认证后重试。"
    : "服务可达，但凭证校验失败；请更新认证信息后重试。";
  if (scenario === "interface-error") return `连接与认证通过，但服务响应不符合 ${interfaceSpec} 规范。`;
  return isA2A ? "连接测试通过，可以保存配置。" : `连接测试通过，服务响应符合 ${interfaceSpec} 规范，可以保存配置。`;
}

function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}{required ? <span className="ml-1 text-rose-500">*</span> : null}</Label>
      {children}
      {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

function inferMockAgentCardAuth(
  endpoint: string,
  fallback: ThirdPartyAgentRecord["authMode"]
): { mode: ThirdPartyAgentRecord["authMode"]; declared: boolean } {
  const normalized = endpoint.toLowerCase();
  if (normalized.trimStart().startsWith("{")) {
    const parsed = JSON.parse(endpoint) as Record<string, unknown>;
    const schemes = typeof parsed.securitySchemes === "object" && parsed.securitySchemes !== null && !Array.isArray(parsed.securitySchemes)
      ? parsed.securitySchemes as Record<string, unknown>
      : {};
    const requirements = Array.isArray(parsed.security)
      ? parsed.security
      : Array.isArray(parsed.securityRequirements)
        ? parsed.securityRequirements
        : [];
    if (!Object.keys(schemes).length || !requirements.length) return { mode: "无认证", declared: false };
    const firstScheme = Object.values(schemes).find(isObjectRecord);
    if (!firstScheme) return { mode: "无认证", declared: false };
    const type = typeof firstScheme.type === "string" ? firstScheme.type.toLowerCase() : "";
    if (type === "oauth2" || isObjectRecord(firstScheme.oauth2SecurityScheme)) return { mode: "OAuth 2.0", declared: true };
    if (type === "apikey" || isObjectRecord(firstScheme.apiKeySecurityScheme)) return { mode: "API Key", declared: true };
    const httpScheme = isObjectRecord(firstScheme.httpAuthSecurityScheme) ? firstScheme.httpAuthSecurityScheme : firstScheme;
    if (type === "http" || isObjectRecord(firstScheme.httpAuthSecurityScheme)) {
      const scheme = typeof httpScheme.scheme === "string" ? httpScheme.scheme.toLowerCase() : "";
      if (scheme === "bearer") return { mode: "Bearer Token", declared: true };
      if (scheme === "basic") return { mode: "HTTP Basic", declared: true };
      throw new Error(`AgentCard 声明的 HTTP ${scheme || "认证"} 暂不受平台支持。`);
    }
    throw new Error("AgentCard 声明了平台暂不支持的认证方案，不能保存为正式接入配置。");
  }
  if (normalized.includes("public") || normalized.includes("no-auth")) return { mode: "无认证", declared: false };
  if (normalized.includes("translation") || normalized.includes("bearer")) return { mode: "Bearer Token", declared: true };
  if (normalized.includes("basic")) return { mode: "HTTP Basic", declared: true };
  if (normalized.includes("legacy") || normalized.includes("api-key") || normalized.includes("apikey")) return { mode: "API Key", declared: true };
  if (normalized.includes("oauth") || normalized.includes("partner") || normalized.includes("strategy")) return { mode: "OAuth 2.0", declared: true };
  return { mode: fallback, declared: fallback !== "无认证" };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveA2AConnection(source: "URL" | "JSON", endpoint: string, agentCardJson: string): {
  protocolVersion: string;
  protocolBinding: string;
  serviceEndpoint: string;
} {
  if (source === "JSON") {
    const card = JSON.parse(agentCardJson) as Record<string, unknown>;
    const protocolVersion = typeof card.protocolVersion === "string" ? card.protocolVersion : "1.0";
    if (!protocolVersion.startsWith("1.0") && !protocolVersion.startsWith("0.3")) {
      throw new Error(`AgentCard 可解析，但 A2A ${protocolVersion} 不在平台支持范围（1.0、0.3）。`);
    }
    const preferredTransport = typeof card.preferredTransport === "string" ? card.preferredTransport : "JSONRPC";
    const normalizedBinding = preferredTransport.toUpperCase().replaceAll("-", "");
    if (!new Set(["JSONRPC", "HTTP+JSON"]).has(normalizedBinding)) {
      throw new Error(`AgentCard 可解析，但传输绑定 ${preferredTransport} 暂不受平台支持。`);
    }
    return {
      protocolVersion: protocolVersion.startsWith("0.3") ? "0.3" : "1.0",
      protocolBinding: normalizedBinding === "JSONRPC" ? "JSON-RPC" : "HTTP+JSON",
      serviceEndpoint: typeof card.url === "string" && card.url.trim() ? card.url : "AgentCard 未声明服务端点",
    };
  }
  const protocolVersion = endpoint.toLowerCase().includes("legacy") ? "0.3" : "1.0";
  return { protocolVersion, protocolBinding: "JSON-RPC", serviceEndpoint: resolveA2AServiceEndpoint(endpoint) };
}

function resolveA2AServiceEndpoint(agentCardUrl: string): string {
  if (!agentCardUrl.trim()) return "—";
  return agentCardUrl
    .replace(/\/\.well-known\/agent-card\.json$/i, "/a2a")
    .replace(/\/\.well-known\/agent\.json$/i, "/a2a");
}

function validateAgentCardForImport(card: unknown): asserts card is Record<string, unknown> {
  if (typeof card !== "object" || card === null || Array.isArray(card)) throw new Error("AgentCard 解析失败：根节点必须是 JSON 对象。");
  const record = card as Record<string, unknown>;
  if (typeof record.name !== "string" || !record.name.trim()) throw new Error("AgentCard 解析失败：缺少名称 name。");
  if (typeof record.description !== "string" || !record.description.trim()) throw new Error("AgentCard 解析失败：缺少描述 description。");
  if (typeof record.version !== "string" || !record.version.trim()) throw new Error("AgentCard 解析失败：缺少 Agent 版本 version。");
}
