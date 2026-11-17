"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Box, ChevronDown, Eye, EyeOff, Info, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DISCARD_CONFIRMATION_DESCRIPTION } from "@/components/ui/confirm-discard-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  addModelToConnection,
  addPersonalModelConnection,
  removePersonalModel,
  updatePersonalModelConnection,
  updatePersonalModelConnectionSettings,
  updatePersonalModel,
  usePersonalModelConnections,
} from "@/components/claw-client/personal-model-demo-store";
import type { PersonalModelType } from "@/components/claw-client/personal-model-demo-store";

const PROVIDERS = [
  { id: "qwen", name: "阿里云百炼（通义千问）", icon: "/icons/qwen.png" },
  { id: "minimax", name: "MiniMax 开放平台", icon: "/icons/minimax.png" },
  { id: "deepseek", name: "DeepSeek 开放平台", icon: "/icons/deepseek.png" },
  { id: "zhipu", name: "智谱开放平台", icon: "/icons/zhipu.png" },
  { id: "kimi", name: "月之暗面（Kimi）", icon: "/icons/moonshot.png" },
  { id: "custom", name: "自定义", icon: <Box className="h-5 w-5 shrink-0 text-slate-500" /> },
] as const;
const PROVIDER_OPTIONS = PROVIDERS.map(({ id, name, icon }) => ({
  value: id,
  label: name,
  icon: typeof icon === "string" ? <img src={icon} alt="" className="h-5 w-5 shrink-0 rounded object-contain" /> : icon,
}));

function renderProviderIcon(providerId: string) {
  const icon = PROVIDERS.find((provider) => provider.id === providerId)?.icon;
  if (typeof icon === "string") return <img src={icon} alt="" className="h-6 w-6 object-contain" />;
  return icon ?? <span className="text-sm font-semibold text-[#5278e8]">{providerId.slice(0, 1)}</span>;
}

type View = "list" | "add" | "replace-key" | "edit-model";

export function ModelManagementPage({
  initialView = "list",
  initialModelType = "chat",
  onDirtyChange,
  onRequestDiscard,
}: {
  initialView?: "list" | "add";
  initialModelType?: PersonalModelType;
  onDirtyChange: (dirty: boolean) => void;
  onRequestDiscard: (description: string, confirmLabel: string, onConfirm: () => void) => void;
}) {
  const connections = usePersonalModelConnections();
  const [view, setView] = useState<View>(initialView);
  const [modelType, setModelType] = useState<PersonalModelType>(initialModelType);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [targetModelId, setTargetModelId] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string>(initialModelType === "image-generation" ? "custom" : PROVIDERS[0].id);
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [modelId, setModelId] = useState("");
  const [modelIdError, setModelIdError] = useState(false);
  const [toolCalling, setToolCalling] = useState(true);
  const [imageInput, setImageInput] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [inputLimit, setInputLimit] = useState("");
  const [outputLimit, setOutputLimit] = useState("");
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [pendingOverwrite, setPendingOverwrite] = useState<{ modelId: string; existingId: string; connectionId: string; apiKey: string; duplicateIds: string[] } | null>(null);
  const [formTouched, setFormTouched] = useState(false);
  const selectedConnection = connections.find((item) => item.id === connectionId);
  const selectedProvider = PROVIDERS.find((item) => item.id === providerId) ?? PROVIDERS[0];
  const isForm = view !== "list";

  useEffect(() => {
    onDirtyChange(isForm && formTouched);
  }, [formTouched, isForm, onDirtyChange]);

  function applyProviderSwitch(nextProviderId: string) {
    setProviderId(nextProviderId);
    setBaseUrl("");
    setApiKey("");
    setShowApiKey(false);
    setApiKeyError(false);
    setModelId("");
    setModelIdError(false);
    setToolCalling(true);
    setImageInput(false);
    setThinkingMode(false);
    setInputLimit("");
    setOutputLimit("");
    setAdvancedSettingsOpen(false);
    setFormTouched(true);
  }

  function requestProviderSwitch(nextProviderId: string) {
    if (nextProviderId === providerId) return;
    const hasProviderSpecificDraft = Boolean(
      apiKey.trim()
      || modelId.trim()
      || baseUrl.trim()
      || !toolCalling
      || imageInput
      || thinkingMode
      || inputLimit.trim()
      || outputLimit.trim(),
    );
    if (hasProviderSpecificDraft) {
      onRequestDiscard(
        DISCARD_CONFIRMATION_DESCRIPTION,
        "放弃更改",
        () => applyProviderSwitch(nextProviderId),
      );
      return;
    }
    applyProviderSwitch(nextProviderId);
  }

  function leaveForm() {
    if (formTouched) {
      onRequestDiscard(DISCARD_CONFIRMATION_DESCRIPTION, "放弃更改", () => resetForm("list"));
      return;
    }
    resetForm("list");
  }

  function resetForm(nextView: View, targetId: string | null = null) {
    setView(nextView);
    setConnectionId(targetId);
    setTargetModelId(null);
    setProviderId(modelType === "image-generation" ? "custom" : PROVIDERS[0].id);
    setBaseUrl("");
    setApiKey("");
    setShowApiKey(false);
    setApiKeyError(false);
    setModelId("");
    setModelIdError(false);
    setToolCalling(true);
    setImageInput(false);
    setThinkingMode(false);
    setInputLimit("");
    setOutputLimit("");
    setAdvancedSettingsOpen(false);
    setFormTouched(false);
  }

  function editModel(connectionId: string, model: { id: string; modelId: string; name: string }) {
    const connection = connections.find((item) => item.id === connectionId);
    setView("edit-model");
    setConnectionId(connectionId);
    setTargetModelId(model.id);
    setProviderId(connection?.providerId ?? PROVIDERS[0].id);
    setModelId(model.modelId);
    setBaseUrl(connection?.baseUrl ?? "");
    setApiKey(connection?.apiKey ?? "");
    setShowApiKey(false);
    setApiKeyError(false);
    setToolCalling(true);
    setModelIdError(false);
    setImageInput(false);
    setThinkingMode(false);
    setInputLimit("");
    setOutputLimit("");
    setAdvancedSettingsOpen(false);
    setFormTouched(false);
  }

  function testConnection() {
    const apiKeyMissing = view !== "list" && !apiKey.trim();
    const modelIdMissing = view !== "replace-key" && !modelId.trim();
    setApiKeyError(apiKeyMissing);
    setModelIdError(modelIdMissing);
    if (apiKeyMissing || modelIdMissing) {
      document.getElementById(apiKeyMissing ? "personal-model-key" : "personal-model-id")?.focus();
      return;
    }
    if (view === "add" && (!apiKey.trim() || !modelId.trim() || (providerId === "custom" && !baseUrl.trim()))) {
      toast.error("请填写演示凭据、模型 ID 和必填的服务地址");
      return;
    }
    if (view === "edit-model" && providerId === "custom" && !baseUrl.trim()) {
      toast.error("请填写服务地址");
      return;
    }
    if (view === "replace-key" && !apiKey.trim()) {
      toast.error("请填写演示凭据");
      return;
    }
    if (view === "edit-model" && !modelId.trim()) {
      toast.error("请填写模型 ID");
      return;
    }
    if (view === "edit-model" && selectedConnection?.models.some((item) => item.id !== targetModelId && item.type === modelType && item.modelId === modelId.trim())) {
      toast.error("此服务下已存在相同的模型 ID");
      return;
    }
    toast.success(modelType === "image-generation" ? "图片生成接口连接测试成功（演示）" : "连接测试成功");
  }

  function saveForm() {
    if (view === "add" && (!apiKey.trim() || !modelId.trim() || (providerId === "custom" && !baseUrl.trim()))) {
      toast.error("请填写 API Key、模型 ID 和必填的服务地址");
      return;
    }
    if (view === "edit-model" && !modelId.trim()) {
      toast.error("请填写模型 ID");
      return;
    }
    if ((view === "replace-key") && !apiKey.trim()) {
      toast.error("请填写 API Key");
      return;
    }
    const id = modelId.trim();
    if (view === "add") {
      const normalizedBaseUrl = (value?: string) => (value ?? "").trim().replace(/\/+$/, "");
      const matchingConnections = connections.filter((connection) =>
        connection.providerId === providerId
        && normalizedBaseUrl(connection.baseUrl) === normalizedBaseUrl(providerId === "custom" ? baseUrl : undefined)
      );
      const existingConnection = matchingConnections[0];
      const duplicate = matchingConnections
        .flatMap((connection) => connection.models.map((model) => ({ connectionId: connection.id, model })))
        .find(({ model }) => model.type === modelType && model.modelId.trim() === id);
      if (duplicate) {
        const duplicateIds = matchingConnections
          .flatMap((connection) => connection.models)
          .filter((model) => model.type === modelType && model.modelId.trim() === id && model.id !== duplicate.model.id)
          .map((model) => model.id);
        setPendingOverwrite({ modelId: id, existingId: duplicate.model.id, connectionId: duplicate.connectionId, apiKey: apiKey.trim(), duplicateIds });
        return;
      }
      if (existingConnection) {
        addModelToConnection(existingConnection.id, id, id, modelType);
        updatePersonalModelConnectionSettings(existingConnection.id, {
          providerId,
          providerName: selectedProvider.name,
          baseUrl: providerId === "custom" ? baseUrl.trim() : undefined,
          apiKey: apiKey.trim(),
        });
        toast.success("模型已保存");
        resetForm("list");
        return;
      }
      addPersonalModelConnection({
        providerId,
        providerName: selectedProvider.name,
        baseUrl: providerId === "custom" ? baseUrl.trim() : undefined,
        apiKey: apiKey.trim(),
        keyHint: apiKey.trim().slice(-4),
        modelId: id,
        name: id,
        modelType,
      });
    } else if (view === "replace-key" && selectedConnection) {
      updatePersonalModelConnection(selectedConnection.id, apiKey.trim());
    } else if (view === "edit-model" && targetModelId) {
      updatePersonalModel(targetModelId, id, id);
      if (selectedConnection) {
        updatePersonalModelConnectionSettings(selectedConnection.id, {
          providerId,
          providerName: selectedProvider.name,
          baseUrl: providerId === "custom" ? baseUrl.trim() : undefined,
          apiKey: apiKey.trim() ? apiKey.trim() : undefined,
        });
      }
    }
    toast.success("模型已保存");
    resetForm("list");
  }

  const canSave = view === "add" || view === "edit-model"
    ? Boolean(apiKey.trim() && modelId.trim() && (providerId !== "custom" || baseUrl.trim()))
    : view === "replace-key"
      ? Boolean(apiKey.trim())
      : true;
  return (
    <section className="mx-auto max-w-[720px] pb-4">
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex min-w-0 items-start gap-2">
          {isForm ? <Button type="button" variant="ghost" size="sm" aria-label="返回模型列表" className="-ml-2 h-7 w-7 shrink-0 p-0" onClick={leaveForm}><ArrowLeft className="h-4 w-4" /></Button> : null}
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{view === "list" ? "模型管理" : view === "add" ? `添加自定义${modelType === "image-generation" ? "图片生成" : "对话"}模型` : view === "edit-model" ? "编辑模型" : "更换演示凭据"}</h2>
            <p className="mt-1 text-[11px] leading-4 text-slate-500">{modelType === "image-generation" ? "管理个人图片生成模型。" : "配置供当前个人对话使用的自定义模型。"}</p>
          </div>
        </div>
        {view === "list" ? <Button type="button" size="sm" className="mr-7 h-8 shrink-0 bg-[#2773ff] px-3 text-xs hover:bg-[#1f63e0]" onClick={() => resetForm("add")}><Plus className="mr-1 h-3.5 w-3.5" />添加模型</Button> : null}
      </header>

      {view === "list" ? (
        <div className="mt-3">
          <div className="mb-3 grid grid-cols-2 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="模型类型">
            <button type="button" role="tab" aria-selected={modelType === "chat"} onClick={() => setModelType("chat")} className={`rounded-md px-3 py-2 text-xs ${modelType === "chat" ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>对话模型</button>
            <button type="button" role="tab" aria-selected={modelType === "image-generation"} onClick={() => setModelType("image-generation")} className={`rounded-md px-3 py-2 text-xs ${modelType === "image-generation" ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>图片生成模型</button>
          </div>
          <div className="space-y-3">
          {connections.flatMap((connection) => connection.models.filter((model) => model.type === modelType).map((model) => ({ connection, model }))).length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 px-5 py-10 text-center">
              <Settings2 className="mx-auto h-6 w-6 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">还没有自定义{modelType === "image-generation" ? "图片生成" : "对话"}模型</p>
              <p className="mt-1 text-xs text-slate-500">添加模型后，可在对应模型类型的列表中选择。</p>
              <Button type="button" variant="outline" size="sm" className="mt-4 h-8 text-xs" onClick={() => { if (modelType === "image-generation") setProviderId("custom"); resetForm("add"); }}>添加自定义模型</Button>
            </div>
          ) : connections.flatMap((connection) => connection.models.filter((model) => model.type === modelType).map((model) => (
            <article key={model.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-3">
              <div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-50">{renderProviderIcon(connection.providerId)}</div><div className="min-w-0"><p className="truncate text-[13px] font-medium text-slate-900">{model.name}</p><p className="mt-0.5 truncate text-[11px] text-slate-500">{connection.providerName}{connection.baseUrl ? ` · ${connection.baseUrl}` : ""}</p></div></div>
              <div className="flex shrink-0 items-center gap-1"><button type="button" title="编辑模型" aria-label={`编辑 ${model.name}`} className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" onClick={() => { editModel(connection.id, model); setModelType(model.type); }}><Pencil className="h-4 w-4" /></button><button type="button" title="删除模型" aria-label={`删除 ${model.name}`} className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => setPendingDelete({ id: model.id, name: model.name })}><Trash2 className="h-4 w-4" /></button></div>
            </article>
          )))}
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-4 max-w-[470px] space-y-3.5">
          {view === "add" || view === "edit-model" ? modelType === "image-generation" ? <>
            <div className="space-y-1.5"><Label className="text-xs">接口协议</Label><div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700">OpenAI 兼容图片生成接口</div></div>
            <div className="space-y-1.5"><Label htmlFor="personal-model-base-url" className="text-xs">Base URL <span className="text-red-500">*</span></Label><Input id="personal-model-base-url" value={baseUrl} onChange={(event) => { setBaseUrl(event.target.value); setFormTouched(true); }} placeholder="https://api.example.com/v1" className="h-9 text-xs" /><p className="text-[11px] text-slate-500">请求路径：POST /images/generations</p></div>
          </> : <><div className="space-y-1.5"><Label htmlFor="personal-model-provider" className="text-xs">服务商</Label><Select ariaLabel="选择服务商" value={providerId} onValueChange={requestProviderSwitch} options={PROVIDER_OPTIONS} /></div>{providerId === "custom" ? <div className="space-y-1.5"><Label htmlFor="personal-model-base-url" className="text-xs">Base URL</Label><Input id="personal-model-base-url" value={baseUrl} onChange={(event) => { setBaseUrl(event.target.value); setFormTouched(true); }} placeholder="https://api.example.com/v1" className="h-9 text-xs" /></div> : null}</> : <p className="text-xs text-slate-600">{selectedConnection?.providerName}</p>}
          {view === "add" || view === "replace-key" || view === "edit-model" ? <div className="space-y-1.5"><Label htmlFor="personal-model-key" className="text-xs">API Key <span className="text-red-500">*</span></Label><div className="relative"><Input id="personal-model-key" type={showApiKey ? "text" : "password"} autoComplete="off" aria-required="true" aria-invalid={apiKeyError} aria-describedby={apiKeyError ? "personal-model-key-error" : undefined} value={apiKey} onBlur={() => setApiKeyError(!apiKey.trim())} onChange={(event) => { setApiKey(event.target.value); setFormTouched(true); if (event.target.value.trim()) setApiKeyError(false); }} placeholder="输入 API Key" className={`h-9 pr-10 text-xs ${apiKeyError ? "border-red-500 focus-visible:ring-red-400" : ""}`} /><button type="button" aria-label={showApiKey ? "隐藏 API Key" : "显示 API Key"} title={showApiKey ? "隐藏 API Key" : "显示 API Key"} onClick={() => setShowApiKey((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-400 hover:text-slate-700">{showApiKey ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button></div>{apiKeyError ? <p id="personal-model-key-error" className="text-[11px] text-red-600">请输入API Key</p> : null}{view === "edit-model" ? <p className="text-[11px] text-slate-400">已保存的 Key 默认掩码显示；填写新值可替换当前 Key。</p> : null}</div> : null}
          {view !== "replace-key" ? <div className="space-y-1.5"><div className="flex items-center justify-between gap-3"><Label htmlFor="personal-model-id" className="text-xs">模型 ID <span className="text-red-500">*</span></Label><button type="button" onClick={testConnection} className="rounded px-1.5 py-1 text-xs font-medium text-[#2773ff] transition-colors hover:bg-blue-50 hover:text-[#1f63e0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">测试连接</button></div><Input id="personal-model-id" autoComplete="off" aria-required="true" aria-invalid={modelIdError} aria-describedby={modelIdError ? "personal-model-id-error" : undefined} value={modelId} onBlur={() => setModelIdError(!modelId.trim())} onChange={(event) => { setModelId(event.target.value); setFormTouched(true); if (event.target.value.trim()) setModelIdError(false); }} placeholder="填写服务提供方提供的模型 ID" className={`h-9 bg-white text-xs ${modelIdError ? "border-red-500 focus-visible:ring-red-400" : ""}`} />{modelIdError ? <p id="personal-model-id-error" className="text-[11px] text-red-600">请输入模型ID</p> : null}</div> : null}
          {providerId === "custom" && modelType === "chat" && view !== "replace-key" ? <div>
            <button type="button" aria-expanded={advancedSettingsOpen} onClick={() => setAdvancedSettingsOpen((open) => !open)} className="flex w-full items-center justify-between gap-3 py-2 text-left text-xs font-medium text-slate-700 hover:text-slate-900">
              <span className="flex items-center gap-1.5">
                高级设置
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild><span role="button" tabIndex={0} aria-label="高级设置说明" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} className="rounded-full text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><Info className="h-3.5 w-3.5" /></span></TooltipTrigger>
                    <TooltipContent side="top" className="z-[120] max-w-[280px] leading-5">各项设置的支持情况和可用范围因模型及服务商而异，实际以服务商官方文档为准。</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${advancedSettingsOpen ? "rotate-180" : ""}`} />
            </button>
            {advancedSettingsOpen ? <div className="space-y-3 pt-2">
              <TooltipProvider delayDuration={150}>
                <div className="grid w-full grid-cols-4 gap-x-5 gap-y-2 text-xs text-slate-700">
                  {[
                    { id: "tool-calling", label: "工具调用", checked: toolCalling, onChange: setToolCalling, tip: "允许模型在对话中调用工具。" },
                    { id: "image-input", label: "图片输入", checked: imageInput, onChange: setImageInput, tip: "允许在对话中向模型发送图片用于理解。" },
                    { id: "deep-thinking", label: "深度思考", checked: thinkingMode, onChange: setThinkingMode, tip: "控制是否启用模型的深度思考功能。" },
                  ].map(({ id, label, checked, onChange, tip }) => (
                    <div key={id} className="flex items-center gap-1.5">
                      <label htmlFor={`personal-model-${id}`} className="flex cursor-pointer items-center gap-2">
                        <input id={`personal-model-${id}`} type="checkbox" checked={checked} onChange={(event) => { onChange(event.target.checked); setFormTouched(true); }} className="h-4 w-4 accent-[#2773ff]" />
                        {label}
                      </label>
                      <Tooltip>
                        <TooltipTrigger asChild><button type="button" aria-label={`${label}说明`} className="rounded-full text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><Info className="h-3.5 w-3.5" /></button></TooltipTrigger>
                        <TooltipContent side="top" className="z-[120] max-w-[280px] leading-5">{tip}</TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5"><Label htmlFor="personal-model-input-limit" className="text-xs">上下文长度</Label><Tooltip><TooltipTrigger asChild><button type="button" aria-label="上下文长度说明" className="rounded-full text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><Info className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent side="top" className="z-[120] max-w-[280px] leading-5">模型可处理的最大输入上下文长度，单位为 Token。留空时使用服务商默认值。</TooltipContent></Tooltip></div>
                    <div className="relative"><Input id="personal-model-input-limit" type="number" min="1" step="1" value={inputLimit} onChange={(event) => { setInputLimit(event.target.value); setFormTouched(true); }} placeholder="使用提供商默认值" className="h-9 pr-14 text-xs" /><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] text-slate-400">Token</span></div>
                    <div className="flex flex-wrap gap-2">{[{ label: "32K", value: "32768" }, { label: "64K", value: "65536" }, { label: "128K", value: "131072" }, { label: "256K", value: "262144" }].map(({ label, value }) => <button key={label} type="button" onClick={() => { setInputLimit(value); setFormTouched(true); }} className={`text-[11px] ${inputLimit === value ? "font-semibold text-[#2773ff]" : "text-slate-500 hover:text-slate-800"}`}>{label}</button>)}</div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5"><Label htmlFor="personal-model-output-limit" className="text-xs">最大输出长度</Label><Tooltip><TooltipTrigger asChild><button type="button" aria-label="最大输出长度说明" className="rounded-full text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><Info className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent side="top" className="z-[120] max-w-[280px] leading-5">限制模型单次回复可生成的最大 Token 数。留空时使用服务商默认值。</TooltipContent></Tooltip></div>
                    <div className="relative"><Input id="personal-model-output-limit" type="number" min="1" step="1" value={outputLimit} onChange={(event) => { setOutputLimit(event.target.value); setFormTouched(true); }} placeholder="使用提供商默认值" className="h-9 pr-14 text-xs" /><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] text-slate-400">Token</span></div>
                    <div className="flex flex-wrap gap-2">{[{ label: "8K", value: "8192" }, { label: "16K", value: "16384" }, { label: "32K", value: "32768" }, { label: "64K", value: "65536" }].map(({ label, value }) => <button key={label} type="button" onClick={() => { setOutputLimit(value); setFormTouched(true); }} className={`text-[11px] ${outputLimit === value ? "font-semibold text-[#2773ff]" : "text-slate-500 hover:text-slate-800"}`}>{label}</button>)}</div>
                  </div>
                </div>
              </TooltipProvider>
            </div> : null}
          </div> : null}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3"><Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={leaveForm}>取消</Button><Button type="button" size="sm" disabled={!canSave} className="h-8 bg-[#2773ff] text-xs hover:bg-[#1f63e0]" onClick={saveForm}>保存</Button></div>
        </div>
      )}
      <Dialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <DialogContent className="gap-5 rounded-xl border-slate-200 p-6 sm:max-w-[420px]">
          <DialogHeader className="pr-7">
            <DialogTitle className="text-base">删除模型</DialogTitle>
            <DialogDescription className="pt-1 text-sm leading-6 text-slate-600">
              确认删除模型“{pendingDelete?.name}”吗？删除后无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="h-9" onClick={() => setPendingDelete(null)}>取消</Button>
            <Button type="button" className="h-9 bg-red-600 text-white hover:bg-red-700" onClick={() => {
              if (!pendingDelete) return;
              removePersonalModel(pendingDelete.id);
              setPendingDelete(null);
              toast.success("模型已删除");
            }}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={pendingOverwrite !== null} onOpenChange={(open) => { if (!open) setPendingOverwrite(null); }}>
        <DialogContent className="gap-5 rounded-xl border-slate-200 p-6 sm:max-w-[420px]">
          <DialogHeader className="pr-7">
            <DialogTitle className="text-base">覆盖现有模型</DialogTitle>
            <DialogDescription className="pt-1 text-sm leading-6 text-slate-600">
              模型 ID“{pendingOverwrite?.modelId}”已存在，是否用当前配置覆盖？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="h-9" onClick={() => setPendingOverwrite(null)}>取消</Button>
            <Button type="button" className="h-9 bg-red-600 text-white hover:bg-red-700" onClick={() => {
              if (!pendingOverwrite) return;
              updatePersonalModel(pendingOverwrite.existingId, pendingOverwrite.modelId, pendingOverwrite.modelId);
              updatePersonalModelConnectionSettings(pendingOverwrite.connectionId, {
                providerId,
                providerName: selectedProvider.name,
                baseUrl: providerId === "custom" ? baseUrl.trim() : undefined,
                apiKey: pendingOverwrite.apiKey,
              });
              pendingOverwrite.duplicateIds.forEach(removePersonalModel);
              setPendingOverwrite(null);
              toast.success("模型配置已覆盖");
              resetForm("list");
            }}>覆盖并保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
