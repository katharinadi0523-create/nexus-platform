"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleDashed,
  Code2,
  KeyRound,
  Link2,
  Loader2,
  Network,
  ServerCog,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

export interface CreatedThirdPartyAgent {
  name: string;
  description: string;
  protocol: ThirdPartyAgentProtocol;
  interfaceSpec: ThirdPartyAgentInterfaceSpec;
  modelIdentifier?: string;
  botId?: string;
  endpoint: string;
  agentCardSource?: "URL" | "JSON";
  agentCardJson?: string;
  authMode: ThirdPartyAgentAuthMode;
  authConfig?: ThirdPartyAgentAuthConfig;
  securityLevel: SecurityLevel;
  approvalReason?: string;
  declaredVersion?: string;
  skills: string[];
}

interface ThirdPartyAgentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (agent: CreatedThirdPartyAgent) => void;
}

const AUTH_OPTIONS = [
  { value: "bearer", label: "Bearer Token" },
  { value: "api-key", label: "API Key" },
  { value: "basic", label: "HTTP Basic" },
  { value: "oauth", label: "OAuth 2.0（Client Credentials）" },
  { value: "none", label: "未声明认证" },
];

const AUTH_LABELS: Record<string, string> = Object.fromEntries(
  AUTH_OPTIONS.map((option) => [option.value, option.label])
);

const A2A_PREVIEW_OPTIONS = [
  { value: "oauth", label: "OAuth 2.0" },
  { value: "api-key", label: "API Key" },
  { value: "bearer", label: "Bearer Token" },
  { value: "basic", label: "HTTP Basic" },
  { value: "none", label: "无认证" },
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

export function ThirdPartyAgentCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: ThirdPartyAgentCreateDialogProps) {
  const [protocol, setProtocol] = useState<ThirdPartyAgentProtocol>("A2A");
  const [interfaceSpec, setInterfaceSpec] = useState<ThirdPartyAgentInterfaceSpec>("Chat Completions");
  const [modelIdentifier, setModelIdentifier] = useState("partner-agent-v1");
  const [botId, setBotId] = useState("");
  const [agentCardSource, setAgentCardSource] = useState("url");
  const [endpoint, setEndpoint] = useState(
    "https://agent.partner.example.com/.well-known/agent-card.json"
  );
  const [agentCardJson, setAgentCardJson] = useState(
    '{\n  "name": "风控审查 Agent",\n  "description": "识别合同风险并返回结构化结论",\n  "version": "2.4.1",\n  "protocolVersion": "1.0",\n  "url": "https://agent.partner.example.com/a2a",\n  "preferredTransport": "JSONRPC",\n  "securitySchemes": {\n    "partnerOAuth": {\n      "type": "oauth2",\n      "flows": {\n        "clientCredentials": {\n          "tokenUrl": "https://agent.partner.example.com/oauth/token",\n          "scopes": { "agent.invoke": "调用 Agent" }\n        }\n      }\n    }\n  },\n  "security": [{ "partnerOAuth": ["agent.invoke"] }]\n}'
  );
  const [authMode, setAuthMode] = useState("oauth");
  const [agentCardParsed, setAgentCardParsed] = useState(false);
  const [agentCardAuthDeclared, setAgentCardAuthDeclared] = useState(true);
  const [a2aProtocolVersion, setA2AProtocolVersion] = useState("1.0");
  const [a2aProtocolBinding, setA2AProtocolBinding] = useState("JSON-RPC");
  const [a2aServiceEndpoint, setA2AServiceEndpoint] = useState("https://agent.partner.example.com/a2a");
  const [manualAuthEnabled, setManualAuthEnabled] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [agentCardParseError, setAgentCardParseError] = useState("");
  const [credential, setCredential] = useState("");
  const [apiKeyHeader, setApiKeyHeader] = useState("x-api-key");
  const [apiKeyLocation, setApiKeyLocation] = useState<"Header" | "Query">("Header");
  const [tokenUrl, setTokenUrl] = useState("https://agent.partner.example.com/oauth/token");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [scope, setScope] = useState("agent.invoke");
  const [basicUsername, setBasicUsername] = useState("");
  const [basicPassword, setBasicPassword] = useState("");
  const [name, setName] = useState("风控审查 Agent");
  const [description, setDescription] = useState(
    "对客户材料进行风险识别、条款核验并返回结构化审查结论。"
  );
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>("秘密");
  const [approvalReason, setApprovalReason] = useState("");
  const [testing, setTesting] = useState(false);
  const [testScenario, setTestScenario] = useState<PrototypeTestScenario>("success");
  const [testResult, setTestResult] = useState<ConnectionTestResult>(INITIAL_TEST_RESULT);
  const [tested, setTestedState] = useState(false);

  const isA2A = protocol === "A2A";
  const isDify = interfaceSpec === "Dify Agent API";
  const isCoze = interfaceSpec === "Coze Studio Agent API";
  const isOpenAI = !isA2A && !isDify && !isCoze;
  const securityOptions = useMemo(() => buildSecurityLevelOptionsUpToUser(), []);
  const testScenarioOptions = isA2A ? A2A_TEST_SCENARIO_OPTIONS : TEST_SCENARIO_OPTIONS;
  const testPassed = Object.values(testResult).every((state) => state === "success");
  const testFailed = Object.values(testResult).includes("error");

  const setTested = (value: boolean) => {
    setTestedState(value);
    if (!value) setTestResult(INITIAL_TEST_RESULT);
  };

  const reset = () => {
    setProtocol("A2A");
    setInterfaceSpec("Chat Completions");
    setModelIdentifier("partner-agent-v1");
    setBotId("");
    setAgentCardSource("url");
    setEndpoint("https://agent.partner.example.com/.well-known/agent-card.json");
    setAgentCardJson(
      '{\n  "name": "风控审查 Agent",\n  "description": "识别合同风险并返回结构化结论",\n  "version": "2.4.1",\n  "protocolVersion": "1.0",\n  "url": "https://agent.partner.example.com/a2a",\n  "preferredTransport": "JSONRPC",\n  "securitySchemes": {\n    "partnerOAuth": {\n      "type": "oauth2",\n      "flows": {\n        "clientCredentials": {\n          "tokenUrl": "https://agent.partner.example.com/oauth/token",\n          "scopes": { "agent.invoke": "调用 Agent" }\n        }\n      }\n    }\n  },\n  "security": [{ "partnerOAuth": ["agent.invoke"] }]\n}'
    );
    setAuthMode("oauth");
    setAgentCardParsed(false);
    setAgentCardAuthDeclared(true);
    setA2AProtocolVersion("1.0");
    setA2AProtocolBinding("JSON-RPC");
    setA2AServiceEndpoint("https://agent.partner.example.com/a2a");
    setManualAuthEnabled(false);
    setParsing(false);
    setAgentCardParseError("");
    setCredential("");
    setApiKeyHeader("x-api-key");
    setApiKeyLocation("Header");
    setTokenUrl("https://agent.partner.example.com/oauth/token");
    setClientId("");
    setClientSecret("");
    setScope("agent.invoke");
    setBasicUsername("");
    setBasicPassword("");
    setName("风控审查 Agent");
    setDescription("对客户材料进行风险识别、条款核验并返回结构化审查结论。");
    setSecurityLevel("秘密");
    setApprovalReason("");
    setTesting(false);
    setTested(false);
    setTestScenario("success");
    setTestResult(INITIAL_TEST_RESULT);
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  const selectProtocol = (value: string) => {
    const next = value as ThirdPartyAgentProtocol;
    setProtocol(next);
    setTested(false);
    setTestScenario("success");
    if (next === "A2A") {
      setEndpoint("https://agent.partner.example.com/.well-known/agent-card.json");
      setAuthMode("oauth");
      setAgentCardParsed(false);
      setAgentCardAuthDeclared(true);
      setManualAuthEnabled(false);
      setAgentCardParseError("");
    } else {
      setInterfaceSpec("Chat Completions");
      setEndpoint("https://api.partner.example.com/v1/chat/completions");
      setAuthMode("bearer");
      setBotId("");
    }
  };

  const selectInterfaceSpec = (value: string) => {
    const next = value as ThirdPartyAgentInterfaceSpec;
    setInterfaceSpec(next);
    setCredential("");
    setBotId("");
    if (next === "Responses") {
      setEndpoint("https://api.partner.example.com/v1/responses");
      setAuthMode("bearer");
    } else if (next === "Dify Agent API") {
      setEndpoint("https://dify.example.com/v1");
      setAuthMode("api-key");
      setApiKeyLocation("Header");
      setApiKeyHeader("Authorization");
    } else if (next === "Coze Studio Agent API") {
      setEndpoint("https://coze.example.com");
      setAuthMode("bearer");
    } else {
      setEndpoint("https://api.partner.example.com/v1/chat/completions");
      setAuthMode("bearer");
    }
    setTested(false);
  };

  const previewAuthMode = (mode: string) => {
    setAuthMode(mode);
    setAgentCardParsed(true);
    setAgentCardAuthDeclared(mode !== "none");
    setManualAuthEnabled(false);
    setCredential("");
    setClientId("");
    setClientSecret("");
    setBasicUsername("");
    setBasicPassword("");
    setA2AProtocolVersion("1.0");
    setA2AProtocolBinding("JSON-RPC");
    setA2AServiceEndpoint(resolveA2AServiceEndpoint(endpoint));
    if (mode === "oauth") {
      setTokenUrl("https://agent.partner.example.com/oauth/token");
      setScope("agent.invoke");
    }
    if (mode === "api-key") setApiKeyHeader("x-agent-key");
    setTested(false);
  };

  const parseAgentCard = () => {
    if (agentCardSource === "url" && !endpoint.trim()) {
      setAgentCardParseError("请先填写 AgentCard URL。");
      toast.error("请先填写 AgentCard URL。");
      return;
    }
    if (agentCardSource === "json" && !agentCardJson.trim()) {
      setAgentCardParseError("请先粘贴 AgentCard JSON。");
      toast.error("请先粘贴 AgentCard JSON。");
      return;
    }

    setAgentCardParseError("");
    setParsing(true);
    window.setTimeout(() => {
      try {
        let authDeclared = false;
        if (agentCardSource === "json") {
          const parsed = JSON.parse(agentCardJson) as Record<string, unknown>;
          validateAgentCardForImport(parsed);
          const detected = detectAgentCardAuth(parsed);
          setAuthMode(detected.mode);
          setAgentCardAuthDeclared(detected.declared);
          setManualAuthEnabled(false);
          authDeclared = detected.declared;
          if (detected.tokenUrl) setTokenUrl(detected.tokenUrl);
          if (detected.scope) setScope(detected.scope);
          if (detected.apiKeyHeader) setApiKeyHeader(detected.apiKeyHeader);
          if (typeof parsed.name === "string") setName(parsed.name);
          if (typeof parsed.description === "string") setDescription(parsed.description);
        } else {
          if (/invalid|parse-error|unsupported-version/i.test(endpoint)) {
            throw new Error("AgentCard 解析失败：声明格式、协议版本或服务接口不受平台支持。");
          }
          const detected = inferMockUrlAuth(endpoint);
          setAuthMode(detected.mode);
          setAgentCardAuthDeclared(detected.declared);
          setManualAuthEnabled(false);
          authDeclared = detected.declared;
          if (detected.tokenUrl) setTokenUrl(detected.tokenUrl);
          if (detected.scope) setScope(detected.scope);
          if (detected.apiKeyHeader) setApiKeyHeader(detected.apiKeyHeader);
        }
        const connection = resolveCreateA2AConnection(agentCardSource, endpoint, agentCardJson);
        setA2AProtocolVersion(connection.protocolVersion);
        setA2AProtocolBinding(connection.protocolBinding);
        setA2AServiceEndpoint(connection.serviceEndpoint);
        setAgentCardParsed(true);
        setAgentCardParseError("");
        setTested(false);
        toast.success(authDeclared
          ? "AgentCard 解析与兼容校验通过，已识别认证要求。"
          : "AgentCard 解析与兼容校验通过；未声明认证，默认按无认证接入。"
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "AgentCard JSON 解析失败，请检查格式。";
        setAgentCardParsed(false);
        setAgentCardParseError(message);
        toast.error(message);
      } finally {
        setParsing(false);
      }
    }, 500);
  };

  const testConnection = () => {
    if (isA2A && agentCardSource === "json" && !agentCardJson.trim()) {
      toast.error("请先粘贴 AgentCard JSON。");
      return;
    }
    if ((!isA2A || agentCardSource === "url") && !endpoint.trim()) {
      toast.error("请先填写可访问的服务地址。");
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
    if (isA2A && !agentCardParsed) {
      toast.error("请先解析 AgentCard。");
      return;
    }
    const requiresValidCredential = testScenario === "success" || testScenario === "interface-error";
    if (requiresValidCredential && (authMode === "bearer" || authMode === "api-key") && !credential.trim()) {
      toast.error("请填写认证凭证后再测试连接。");
      return;
    }
    if (requiresValidCredential && authMode === "basic" && (!basicUsername.trim() || !basicPassword.trim())) {
      toast.error("请填写 HTTP Basic 用户名和密码。");
      return;
    }
    if (requiresValidCredential && authMode === "oauth" && (!tokenUrl.trim() || !clientId.trim() || !clientSecret.trim())) {
      toast.error("请补充 OAuth 2.0 认证信息。");
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

  const submit = () => {
    if (!name.trim() || !description.trim()) {
      toast.error("请补充名称与能力描述。");
      return;
    }
    if (!testPassed) {
      toast.error("请先完成接入校验。");
      return;
    }
    if (isHighSecurityLevel(securityLevel) && !approvalReason.trim()) {
      toast.error("请填写高密级登记申请原因。");
      return;
    }
    const created: CreatedThirdPartyAgent = {
      name: name.trim(),
      description: description.trim(),
      protocol,
      interfaceSpec: isA2A ? "A2A" : interfaceSpec,
      modelIdentifier: isOpenAI ? modelIdentifier.trim() : undefined,
      botId: isCoze ? botId.trim() : undefined,
      endpoint,
      agentCardSource: isA2A ? (agentCardSource === "url" ? "URL" : "JSON") : undefined,
      agentCardJson: isA2A && agentCardSource === "json" ? agentCardJson : undefined,
      authMode: isDify ? "API Key" : isCoze ? "Bearer Token" : toRecordAuthMode(authMode),
      authConfig: {
        tokenUrl: !isDify && !isCoze && authMode === "oauth" ? tokenUrl.trim() : undefined,
        scope: !isDify && !isCoze && authMode === "oauth" ? scope.trim() : undefined,
        apiKeyLocation: isDify ? "Header" : !isCoze && authMode === "api-key" ? apiKeyLocation : undefined,
        apiKeyParameter: isDify ? "Authorization" : !isCoze && authMode === "api-key" ? apiKeyHeader.trim() : undefined,
        apiKeyHeader: isDify ? "Authorization" : !isCoze && authMode === "api-key" && apiKeyLocation === "Header" ? apiKeyHeader.trim() : undefined,
        bearerFormat: isCoze ? "Access Token" : undefined,
        username: authMode === "basic" ? basicUsername.trim() : undefined,
      },
      securityLevel,
      approvalReason: isHighSecurityLevel(securityLevel) ? approvalReason.trim() : undefined,
      declaredVersion: isA2A ? "2.4.1" : undefined,
      skills: isA2A
        ? ["合同风险识别", "合规条款核验", "风险报告生成"]
        : ["对话问答"],
    };
    if (isHighSecurityLevel(securityLevel)) {
      toast.success(
        `已提交${securityLevel}级第三方 Agent 登记审批，审批通过前不会进入可引用目录。`
      );
    } else {
      onCreated?.(created);
      toast.success("第三方 Agent 已登记并启用。");
    }
    handleOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-[720px] max-w-[94vw] flex-col gap-0 p-0 sm:max-w-[720px]"
      >
        <SheetHeader className="shrink-0 border-b border-slate-200 px-6 py-5 pr-14">
          <SheetTitle className="text-xl">登记第三方 Agent</SheetTitle>
          <SheetDescription className="sr-only">
            登记已部署的外部 Agent
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-slate-200 px-6 pt-5">
            <div className="mb-3 text-sm font-medium text-slate-900">
              接入方式 <span className="text-rose-500">*</span>
            </div>
            <Tabs value={protocol} onValueChange={selectProtocol}>
              <TabsList className="h-11 w-full justify-start gap-1 rounded-lg bg-slate-100 p-1">
                <TabsTrigger value="A2A" className="h-9 flex-1">
                  <Network className="h-4 w-4" />A2A
                </TabsTrigger>
                <TabsTrigger value="OpenAI API" className="h-9 flex-1">
                  <Code2 className="h-4 w-4" />API
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="py-3 text-xs text-slate-500">{isA2A ? "通过 AgentCard 接入" : "选择平台支持的原生 API 接口类型"}</p>
          </div>

          <div className="space-y-7 px-6 py-6">
            <FormSection
              icon={<ServerCog className="h-4 w-4" />}
              title="基本信息"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field label="名称" required>
                    <Input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="请输入 Agent 名称"
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="能力描述" required>
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      className="min-h-24 resize-none"
                    />
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection
              icon={<Link2 className="h-4 w-4" />}
              title={isA2A ? "AgentCard 与服务" : "接口配置"}
            >
              {isA2A ? (
                <div className="space-y-4">
                  <Tabs
                    value={agentCardSource}
                    onValueChange={(value) => {
                      setAgentCardSource(value);
                      setAgentCardParsed(false);
                      setAgentCardParseError("");
                      setTested(false);
                    }}
                  >
                    <TabsList className="h-9 rounded-md bg-slate-100">
                      <TabsTrigger value="url" className="px-4">AgentCard URL</TabsTrigger>
                      <TabsTrigger value="json" className="px-4">粘贴 JSON</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {agentCardSource === "json" ? (
                    <Field label="AgentCard JSON" required>
                      <Textarea
                        value={agentCardJson}
                        onChange={(event) => {
                          setAgentCardJson(event.target.value);
                          setAgentCardParsed(false);
                          setAgentCardParseError("");
                          setTested(false);
                        }}
                        className="min-h-40 font-mono text-xs leading-5"
                      />
                    </Field>
                  ) : (
                    <Field label="AgentCard URL" required>
                      <Input
                        value={endpoint}
                        onChange={(event) => {
                          setEndpoint(event.target.value);
                          setAgentCardParsed(false);
                          setAgentCardParseError("");
                          setTested(false);
                        }}
                        placeholder="https://example.com/.well-known/agent-card.json"
                      />
                    </Field>
                  )}
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={parseAgentCard} disabled={parsing}>
                      {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {parsing ? "解析中" : agentCardParsed ? "重新解析" : "解析 AgentCard"}
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
                        <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">可接入</span>
                      </div>
                      <dl className="grid gap-4 px-4 py-3 text-sm md:grid-cols-3">
                        <div><dt className="text-xs text-slate-500">A2A 协议版本</dt><dd className="mt-1 font-medium text-slate-900">{a2aProtocolVersion}</dd></div>
                        <div><dt className="text-xs text-slate-500">传输绑定</dt><dd className="mt-1 font-medium text-slate-900">{a2aProtocolBinding}</dd></div>
                        <div className="md:col-span-3"><dt className="text-xs text-slate-500">实际接入端点</dt><dd className="mt-1 break-all font-mono text-xs text-slate-800">{a2aServiceEndpoint}</dd></div>
                      </dl>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  <Field label="接口类型" required>
                    <Tabs value={interfaceSpec} onValueChange={selectInterfaceSpec}>
                      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-md bg-slate-100 p-1">
                        <TabsTrigger value="Chat Completions" className="h-8">OpenAI Chat Completions</TabsTrigger>
                        <TabsTrigger value="Responses" className="h-8">OpenAI Responses</TabsTrigger>
                        <TabsTrigger value="Dify Agent API" className="h-8">Dify Agent API</TabsTrigger>
                        <TabsTrigger value="Coze Studio Agent API" className="h-8">Coze Studio Agent API</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </Field>
                  <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-5 text-blue-800">
                    {interfaceSpec === "Chat Completions"
                      ? "适配标准 messages 请求与 choices.message 响应；平台负责协议转换，不支持自定义字段映射。"
                      : interfaceSpec === "Responses"
                        ? "适配标准 input 请求、输出项与任务状态；平台负责结果归一化，不支持自定义字段映射。"
                        : interfaceSpec === "Dify Agent API"
                          ? "平台按 Dify Agent 应用规范调用，固定使用 /chat-messages 接口。"
                          : "平台按 Coze Studio Bot 规范调用，固定使用 /v3/chat 接口。"}
                  </div>
                  {isOpenAI ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="服务地址" required><Input value={endpoint} onChange={(event) => { setEndpoint(event.target.value); setTested(false); }} placeholder={interfaceSpec === "Responses" ? "https://example.com/v1/responses" : "https://example.com/v1/chat/completions"} /></Field>
                      <Field label="模型 / 服务标识" required><Input value={modelIdentifier} onChange={(event) => { setModelIdentifier(event.target.value); setTested(false); }} placeholder="例如 partner-agent-v1" /></Field>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="API 基础地址" required><Input value={endpoint} onChange={(event) => { setEndpoint(event.target.value); setTested(false); }} placeholder={isDify ? "https://dify.example.com/v1" : "https://coze.example.com"} /></Field>
                      <Field label="调用接口"><Input value={isDify ? "/chat-messages" : "/v3/chat"} disabled /></Field>
                      {isCoze ? <div className="md:col-span-2"><Field label="Bot ID" required><Input value={botId} onChange={(event) => { setBotId(event.target.value); setTested(false); }} placeholder="请输入 Coze Studio Bot ID" /></Field></div> : null}
                    </div>
                  )}
                </div>
              )}
            </FormSection>

            <FormSection
              icon={<KeyRound className="h-4 w-4" />}
              title="认证配置"
            >
              {isA2A ? (
                <div className="mb-5 rounded-lg border border-dashed border-violet-200 bg-violet-50/60 p-3">
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
                        className={cn(
                          "rounded-md border px-2 py-2 text-xs transition-colors",
                          agentCardParsed && (option.value === "none"
                            ? !agentCardAuthDeclared
                            : agentCardAuthDeclared && authMode === option.value)
                            ? "border-violet-500 bg-white font-medium text-violet-700 shadow-sm"
                            : "border-violet-100 bg-white/70 text-slate-600 hover:border-violet-300"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {isA2A && !agentCardParsed ? (
                <div className="rounded-lg border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">解析 AgentCard 后显示认证要求</div>
              ) : isA2A ? (
                <div className="space-y-5">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-900">AgentCard 认证声明</span>
                      <span className={cn(
                        "rounded px-2 py-1 text-xs font-medium",
                        agentCardAuthDeclared ? "bg-blue-50 text-blue-700" : "bg-slate-200 text-slate-600"
                      )}>{agentCardAuthDeclared ? "已声明" : "未声明"}</span>
                    </div>
                    <dl className="mt-4 grid gap-x-6 gap-y-4 text-sm md:grid-cols-2">
                      <div><dt className="text-xs text-slate-500">{agentCardAuthDeclared ? "认证方式" : "默认调用方式"}</dt><dd className="mt-1 font-medium text-slate-900">{agentCardAuthDeclared ? AUTH_LABELS[authMode] : "不携带认证信息"}</dd></div>
                      {agentCardAuthDeclared && authMode === "oauth" ? <><div><dt className="text-xs text-slate-500">Token URL</dt><dd className="mt-1 break-all text-slate-700">{tokenUrl}</dd></div><div><dt className="text-xs text-slate-500">Scope</dt><dd className="mt-1 text-slate-700">{scope || "—"}</dd></div></> : null}
                      {agentCardAuthDeclared && authMode === "api-key" ? <div><dt className="text-xs text-slate-500">Header 名称</dt><dd className="mt-1 text-slate-700">{apiKeyHeader}</dd></div> : null}
                      {agentCardAuthDeclared && authMode === "bearer" ? <div><dt className="text-xs text-slate-500">传递方式</dt><dd className="mt-1 text-slate-700">Authorization: Bearer</dd></div> : null}
                      {agentCardAuthDeclared && authMode === "basic" ? <div><dt className="text-xs text-slate-500">传递方式</dt><dd className="mt-1 text-slate-700">Authorization: Basic</dd></div> : null}
                    </dl>
                    {!agentCardAuthDeclared ? (
                      <div className="mt-4 flex items-start justify-between gap-4 border-t border-slate-200 pt-4">
                        <div>
                          <div className="text-sm font-medium text-slate-900">添加认证信息（可选）</div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">可按外部服务的实际要求选择是否添加；未添加不会阻断创建，平台调用时不携带认证信息。</p>
                        </div>
                        <Switch
                          checked={manualAuthEnabled}
                          onCheckedChange={(checked) => {
                            setManualAuthEnabled(checked);
                            setAuthMode(checked ? "bearer" : "none");
                            setTested(false);
                          }}
                          aria-label="添加认证信息"
                        />
                      </div>
                    ) : null}
                  </div>
                  {!agentCardAuthDeclared && manualAuthEnabled ? (
                    <div className="max-w-sm">
                      <Field label="认证方式" required>
                        <Select value={authMode} onValueChange={(value) => { setAuthMode(value); setTested(false); }} options={AUTH_OPTIONS.filter((option) => option.value !== "none")} />
                      </Field>
                    </div>
                  ) : null}
                  {(agentCardAuthDeclared || manualAuthEnabled) && authMode !== "none" ? (
                    <div className="space-y-4">
                      <div className="text-sm font-medium text-slate-900">凭证信息</div>
                      {authMode === "oauth" ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Client ID" required><Input name="a2a-client-id" autoComplete="off" value={clientId} onChange={(event) => { setClientId(event.target.value); setTested(false); }} placeholder="请输入 Client ID" /></Field>
                          <Field label="Client Secret" required><Input name="a2a-client-secret" autoComplete="new-password" data-1p-ignore="true" data-lpignore="true" type="password" value={clientSecret} onChange={(event) => { setClientSecret(event.target.value); setTested(false); }} placeholder="请输入 Client Secret" /></Field>
                        </div>
                      ) : null}
                      {authMode === "bearer" ? <Field label="Bearer Token" required><Input name="a2a-bearer-token" autoComplete="new-password" data-1p-ignore="true" data-lpignore="true" type="password" value={credential} onChange={(event) => { setCredential(event.target.value); setTested(false); }} placeholder="请输入 Token" /></Field> : null}
                      {authMode === "api-key" ? <Field label="API Key" required><Input name="a2a-api-key" autoComplete="new-password" data-1p-ignore="true" data-lpignore="true" type="password" value={credential} onChange={(event) => { setCredential(event.target.value); setTested(false); }} placeholder="请输入 API Key" /></Field> : null}
                      {authMode === "basic" ? <div className="grid gap-4 md:grid-cols-2"><Field label="用户名" required><Input value={basicUsername} onChange={(event) => { setBasicUsername(event.target.value); setTested(false); }} /></Field><Field label="密码" required><Input name="a2a-basic-password" autoComplete="new-password" type="password" value={basicPassword} onChange={(event) => { setBasicPassword(event.target.value); setTested(false); }} /></Field></div> : null}
                    </div>
                  ) : null}
                </div>
              ) : isDify ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">Dify 应用认证</div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">平台固定通过 Authorization Header 传递应用 API Key。</p>
                  </div>
                  <Field label="应用 API Key" required><Input name="dify-api-key" autoComplete="new-password" type="password" value={credential} onChange={(event) => { setCredential(event.target.value); setTested(false); }} placeholder="请输入 Dify 应用 API Key" /></Field>
                </div>
              ) : isCoze ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">Coze Studio 访问认证</div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">平台固定使用 Access Token 调用已配置的 Bot。</p>
                  </div>
                  <Field label="Access Token" required><Input name="coze-access-token" autoComplete="new-password" type="password" value={credential} onChange={(event) => { setCredential(event.target.value); setTested(false); }} placeholder="请输入 Coze Studio Access Token" /></Field>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-w-sm">
                    <Field label="认证方式" required>
                      <Select
                        value={authMode}
                        onValueChange={(value) => {
                          setAuthMode(value);
                          setTested(false);
                        }}
                        options={AUTH_OPTIONS}
                      />
                    </Field>
                  </div>
                  {authMode === "bearer" ? <Field label="Bearer Token" required><Input name="openai-bearer-token" autoComplete="new-password" type="password" value={credential} onChange={(event) => { setCredential(event.target.value); setTested(false); }} placeholder="请输入 Token" /></Field> : null}
                  {authMode === "api-key" ? <div className="grid gap-4 md:grid-cols-2"><Field label="放置位置" required><Select value={apiKeyLocation} onValueChange={(value) => { setApiKeyLocation(value as "Header" | "Query"); setTested(false); }} options={[{ value: "Header", label: "Header" }, { value: "Query", label: "Query" }]} /></Field><Field label="参数名称" required><Input value={apiKeyHeader} onChange={(event) => { setApiKeyHeader(event.target.value); setTested(false); }} placeholder={apiKeyLocation === "Header" ? "例如 x-api-key" : "例如 api_key"} /></Field><div className="md:col-span-2"><Field label="API Key" required><Input name="openai-api-key" autoComplete="new-password" type="password" value={credential} onChange={(event) => { setCredential(event.target.value); setTested(false); }} placeholder="请输入 API Key" /></Field></div></div> : null}
                  {authMode === "basic" ? <div className="grid gap-4 md:grid-cols-2"><Field label="用户名" required><Input value={basicUsername} onChange={(event) => { setBasicUsername(event.target.value); setTested(false); }} /></Field><Field label="密码" required><Input name="openai-basic-password" autoComplete="new-password" type="password" value={basicPassword} onChange={(event) => { setBasicPassword(event.target.value); setTested(false); }} /></Field></div> : null}
                  {authMode === "oauth" ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2"><Field label="Token URL" required><Input value={tokenUrl} onChange={(event) => { setTokenUrl(event.target.value); setTested(false); }} /></Field></div>
                      <Field label="Client ID" required><Input name="openai-client-id" autoComplete="off" value={clientId} onChange={(event) => { setClientId(event.target.value); setTested(false); }} /></Field>
                      <Field label="Client Secret" required><Input name="openai-client-secret" autoComplete="new-password" type="password" value={clientSecret} onChange={(event) => { setClientSecret(event.target.value); setTested(false); }} /></Field>
                      <div className="md:col-span-2"><Field label="Scope"><Input value={scope} onChange={(event) => { setScope(event.target.value); setTested(false); }} /></Field></div>
                    </div>
                  ) : null}
                </div>
              )}
            </FormSection>

            <FormSection
              icon={<ShieldCheck className="h-4 w-4" />}
              title="安全设置"
            >
              <div className="space-y-4">
                <div className="max-w-sm">
                  <Field label="密级" required>
                    <Select
                      value={securityLevel}
                      onValueChange={(value) => setSecurityLevel(value as SecurityLevel)}
                      options={securityOptions}
                    />
                  </Field>
                </div>
                {isHighSecurityLevel(securityLevel) ? (
                  <div className="max-w-2xl">
                    <Field label="申请原因" required>
                      <Textarea
                        value={approvalReason}
                        onChange={(event) => setApprovalReason(event.target.value)}
                        rows={4}
                        maxLength={200}
                        placeholder="请说明申请高密级纳管的业务依据和使用范围"
                        className="resize-none"
                      />
                    </Field>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                      <span>秘密、机密、绝密登记需提交审批</span>
                      <span>{approvalReason.length}/200</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </FormSection>

            <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><div className="text-sm font-medium text-slate-900">测试结果演示</div><p className="mt-1 text-xs text-slate-500">仅用于原型查看不同验证结果。</p></div>
                <Select value={testScenario} onValueChange={(value) => { setTestScenario(value as PrototypeTestScenario); setTested(false); }} options={testScenarioOptions} className="w-44" />
              </div>
            </div>

            <div className={cn("rounded-lg border px-4 py-3", testPassed ? "border-emerald-200 bg-emerald-50" : testFailed ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50")}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <TestResultStatus testing={testing} tested={tested} passed={testPassed} scenario={testScenario} />
                <Button variant="outline" onClick={testConnection} disabled={testing} className="bg-white">
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {testing ? "校验中" : tested ? "重新测试" : "测试连接"}
                </Button>
              </div>
              {tested ? <p className={cn("mt-3 border-t pt-3 text-xs leading-5", testPassed ? "border-emerald-200 text-emerald-700" : "border-rose-200 text-rose-700")}>{testResultSummary(testScenario, isA2A, interfaceSpec, authMode === "none")}</p> : null}
            </div>
          </div>
        </div>

        <SheetFooter className="shrink-0 border-t border-slate-200 bg-white px-6 py-4 sm:justify-between">
          <div className="mr-auto self-center text-xs text-amber-700">
            {isHighSecurityLevel(securityLevel) ? "当前密级登记需审批" : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={submit}
              disabled={!testPassed || (isHighSecurityLevel(securityLevel) && !approvalReason.trim())}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <ShieldCheck className="h-4 w-4" />
              {isHighSecurityLevel(securityLevel) ? "提交登记审批" : "确认登记"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function TestResultStatus({
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
    <div className="flex items-center gap-2">
      {testing ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" /> : null}
      {!testing && tested && passed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : null}
      {!testing && tested && !passed ? <XCircle className="h-4 w-4 shrink-0 text-rose-600" /> : null}
      {!testing && !tested ? <CircleDashed className="h-4 w-4 shrink-0 text-slate-400" /> : null}
      <div>
        <div className="text-[11px] text-slate-500">测试结果</div>
        <div className={cn("text-sm font-medium", tested && passed && "text-emerald-900", tested && !passed && "text-rose-900", !tested && "text-slate-600")}>{value}</div>
      </div>
    </div>
  );
}

function buildConnectionTestResult(scenario: PrototypeTestScenario): ConnectionTestResult {
  if (scenario === "connection-error") return { connection: "error", authentication: "skipped", interface: "skipped" };
  if (scenario === "auth-error") return { connection: "success", authentication: "error", interface: "skipped" };
  if (scenario === "interface-error") return { connection: "success", authentication: "success", interface: "error" };
  return { connection: "success", authentication: "success", interface: "success" };
}

function testResultSummary(scenario: PrototypeTestScenario, isA2A: boolean, interfaceSpec: ThirdPartyAgentInterfaceSpec, noAuth: boolean): string {
  if (scenario === "connection-error") return "无法连接服务地址，请检查地址、网络或 TLS 配置；认证与接口校验未执行。";
  if (scenario === "auth-error") return noAuth
    ? "AgentCard 未声明认证，但服务返回未授权；请开启平台补充认证后重试。"
    : "服务可达，但凭证校验失败；请更新认证信息后重试。";
  if (scenario === "interface-error") return `连接与认证通过，但服务响应不符合 ${interfaceSpec} 规范。`;
  return isA2A ? "连接测试通过，可以提交纳管。" : `连接测试通过，服务响应符合 ${interfaceSpec} 规范，可以提交纳管。`;
}

function FormSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="text-slate-500">{icon}</span>
          {title}
        </div>
      </div>
      {children}
    </section>
  );
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
      <Label>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

function detectAgentCardAuth(card: Record<string, unknown>): {
  mode: string;
  declared: boolean;
  tokenUrl?: string;
  scope?: string;
  apiKeyHeader?: string;
} {
  const schemes = isRecord(card.securitySchemes) ? card.securitySchemes : {};
  const schemeNames = Object.keys(schemes);
  if (!schemeNames.length) return { mode: "none", declared: false };

  const requirements = Array.isArray(card.security)
    ? card.security
    : Array.isArray(card.securityRequirements)
      ? card.securityRequirements
      : [];
  if (!requirements.length) return { mode: "none", declared: false };
  const firstRequirement = requirements.find(isRecord);
  const requirementSchemes = firstRequirement && isRecord(firstRequirement.schemes)
    ? firstRequirement.schemes
    : firstRequirement;
  const preferredName = requirementSchemes ? Object.keys(requirementSchemes)[0] : undefined;
  if (!preferredName) return { mode: "none", declared: false };
  const rawScheme = isRecord(schemes[preferredName]) ? schemes[preferredName] : {};

  if (isRecord(rawScheme.oauth2SecurityScheme) || rawScheme.type === "oauth2") {
    const oauth = isRecord(rawScheme.oauth2SecurityScheme) ? rawScheme.oauth2SecurityScheme : rawScheme;
    const flows = isRecord(oauth.flows) ? oauth.flows : {};
    const clientCredentials = isRecord(flows.clientCredentials) ? flows.clientCredentials : {};
    const scopes = isRecord(clientCredentials.scopes) ? Object.keys(clientCredentials.scopes) : [];
    return {
      mode: "oauth",
      declared: true,
      tokenUrl: typeof clientCredentials.tokenUrl === "string" ? clientCredentials.tokenUrl : undefined,
      scope: scopes.join(" "),
    };
  }

  if (isRecord(rawScheme.apiKeySecurityScheme) || rawScheme.type === "apiKey") {
    const apiKey = isRecord(rawScheme.apiKeySecurityScheme) ? rawScheme.apiKeySecurityScheme : rawScheme;
    return {
      mode: "api-key",
      declared: true,
      apiKeyHeader: typeof apiKey.name === "string" ? apiKey.name : "x-api-key",
    };
  }

  if (isRecord(rawScheme.httpAuthSecurityScheme) || rawScheme.type === "http") {
    const httpAuth = isRecord(rawScheme.httpAuthSecurityScheme) ? rawScheme.httpAuthSecurityScheme : rawScheme;
    if (typeof httpAuth.scheme === "string" && httpAuth.scheme.toLowerCase() === "bearer") {
      return { mode: "bearer", declared: true };
    }
    if (typeof httpAuth.scheme === "string" && httpAuth.scheme.toLowerCase() === "basic") {
      return { mode: "basic", declared: true };
    }
    throw new Error(`暂不支持 AgentCard 声明的 ${String(httpAuth.scheme ?? "HTTP")} 认证方式。`);
  }

  if (isRecord(rawScheme.openIdConnectSecurityScheme)) {
    throw new Error("暂不支持 AgentCard 声明的 OpenID Connect 认证方式。");
  }
  if (isRecord(rawScheme.mtlsSecurityScheme)) {
    throw new Error("暂不支持 AgentCard 声明的 mTLS 认证方式。");
  }
  throw new Error("无法识别 AgentCard 声明的认证方式。");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateAgentCardForImport(card: unknown): asserts card is Record<string, unknown> {
  if (!isRecord(card)) throw new Error("AgentCard 解析失败：根节点必须是 JSON 对象。");
  if (typeof card.name !== "string" || !card.name.trim()) throw new Error("AgentCard 解析失败：缺少名称 name。");
  if (typeof card.description !== "string" || !card.description.trim()) throw new Error("AgentCard 解析失败：缺少描述 description。");
  if (typeof card.version !== "string" || !card.version.trim()) throw new Error("AgentCard 解析失败：缺少 Agent 版本 version。");
}

function inferMockUrlAuth(endpoint: string): {
  mode: string;
  declared: boolean;
  tokenUrl?: string;
  scope?: string;
  apiKeyHeader?: string;
} {
  const normalized = endpoint.toLowerCase();
  if (normalized.includes("public") || normalized.includes("no-auth")) return { mode: "none", declared: false };
  if (normalized.includes("translation") || normalized.includes("bearer")) return { mode: "bearer", declared: true };
  if (normalized.includes("basic")) return { mode: "basic", declared: true };
  if (normalized.includes("legacy") || normalized.includes("api-key")) return { mode: "api-key", declared: true, apiKeyHeader: "x-agent-key" };
  return {
    mode: "oauth",
    declared: true,
    tokenUrl: "https://agent.partner.example.com/oauth/token",
    scope: "agent.invoke",
  };
}

function resolveCreateA2AConnection(source: string, endpoint: string, agentCardJson: string): {
  protocolVersion: string;
  protocolBinding: string;
  serviceEndpoint: string;
} {
  if (source === "json") {
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
  return {
    protocolVersion: endpoint.toLowerCase().includes("legacy") ? "0.3" : "1.0",
    protocolBinding: "JSON-RPC",
    serviceEndpoint: resolveA2AServiceEndpoint(endpoint),
  };
}

function resolveA2AServiceEndpoint(agentCardUrl: string): string {
  if (!agentCardUrl.trim()) return "—";
  return agentCardUrl
    .replace(/\/\.well-known\/agent-card\.json$/i, "/a2a")
    .replace(/\/\.well-known\/agent\.json$/i, "/a2a");
}

function toRecordAuthMode(mode: string): ThirdPartyAgentAuthMode {
  if (mode === "api-key") return "API Key";
  if (mode === "bearer") return "Bearer Token";
  if (mode === "basic") return "HTTP Basic";
  if (mode === "oauth") return "OAuth 2.0";
  return "无认证";
}
