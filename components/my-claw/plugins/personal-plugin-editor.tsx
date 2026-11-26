"use client";

import { useState, type ReactNode } from "react";
import { LoaderCircle, Minus, Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDiscardDialog, DISCARD_CONFIRMATION_DESCRIPTION } from "@/components/ui/confirm-discard-dialog";
import type { MinePluginItem } from "@/lib/mock/my-claw/plugins";

const MCP_EXAMPLE = `{
  "mcpServers": {
    "my-mcp": {
      "type": "streamableHttp",
      "url": "https://example.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN"
      }
    }
  }
}`;

export type PersonalPluginDraft = {
  name: string;
  description: string;
  kind: "mcp" | "plugin";
  config: NonNullable<MinePluginItem["personalConfig"]>;
};

export function PersonalMcpDialog({
  open,
  onOpenChange,
  onSave,
  editing,
  existingPlugins,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: PersonalPluginDraft, editingId?: string) => void;
  editing?: MinePluginItem | null;
  existingPlugins: MinePluginItem[];
}) {
  const initialName = editing?.name ?? "";
  const initialDescription = editing?.description ?? "";
  const initialJson = editing?.personalConfig?.mcpJson ?? "";
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [json, setJson] = useState(initialJson);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const hasDraftChanges = name !== initialName || description !== initialDescription || json !== initialJson;

  const requestClose = () => {
    if (connecting) return;
    if (hasDraftChanges) setDiscardConfirmOpen(true);
    else onOpenChange(false);
  };

  const invalidate = () => setError("");

  const connectAndEnable = async () => {
    try {
      const parsed: unknown = JSON.parse(json);
      if (!parsed || typeof parsed !== "object" || !("mcpServers" in parsed)) {
        throw new Error("请粘贴包含 mcpServers 的 JSON 配置。");
      }
      const servers = parsed.mcpServers;
      if (!servers || typeof servers !== "object" || Array.isArray(servers)) {
        throw new Error("mcpServers 格式不正确。");
      }
      const entries = Object.entries(servers);
      if (entries.length !== 1) {
        throw new Error("每次请配置一个 MCP 服务；多个服务请分别添加。");
      }
      const value = entries[0][1];
      if (!value || typeof value !== "object" || Array.isArray(value) || !("url" in value) || typeof value.url !== "string" || !value.url.trim()) {
        throw new Error("请检查服务 URL。");
      }
      if (!("type" in value) || typeof value.type !== "string" || !value.type.trim()) {
        throw new Error("请填写 MCP 服务类型。");
      }
      if (!/^https?:\/\//i.test(value.url.trim())) {
        throw new Error("服务 URL 需以 http:// 或 https:// 开头。");
      }
      const serviceName = name.trim();
      if (!serviceName) throw new Error("请填写服务名称。");
      if (existingPlugins.some((plugin) => plugin.personalCreated && plugin.id !== editing?.id && plugin.name.trim().toLocaleLowerCase() === serviceName.toLocaleLowerCase())) {
        throw new Error("该服务名称已存在，请更换服务名称。");
      }
      setError("");
      setConnecting(true);
      onSave({
        name: serviceName,
        description: description.trim(),
        kind: "mcp",
        config: { mcpJson: json },
      }, editing?.id);
      onOpenChange(false);
    } catch (cause) {
      setError(cause instanceof SyntaxError ? "JSON 格式有误，请检查括号和逗号。" : cause instanceof Error ? cause.message : "配置格式有误。");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(nextOpen) => { if (nextOpen) onOpenChange(true); else requestClose(); }}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden rounded-xl border-slate-200 p-0 sm:max-w-[700px]">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle className="text-lg">{editing ? "编辑自定义 MCP" : "添加自定义 MCP"}</DialogTitle>
          <DialogDescription className="sr-only">配置 MCP 服务名称、描述与 JSON</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>服务名称 <span className="text-red-500">*</span></span>
              <Input value={name} maxLength={20} onChange={(event) => { setName(event.target.value); invalidate(); }} placeholder="例如：我的搜索工具" />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>服务描述</span>
              <Input value={description} maxLength={200} onChange={(event) => { setDescription(event.target.value); invalidate(); }} placeholder="这个服务能帮 Claw 做什么" />
            </label>
          </div>
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>MCP JSON <span className="text-red-500">*</span></span>
            <Textarea
              value={json}
              onChange={(event) => { setJson(event.target.value); invalidate(); }}
              placeholder={MCP_EXAMPLE}
              spellCheck={false}
              className="h-[280px] resize-y rounded-lg border-slate-200 bg-slate-50 font-mono text-xs leading-5 placeholder:text-slate-400"
            />
          </label>
          {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
        </div>
        <DialogFooter className="border-t border-slate-100 px-6 py-4">
          <Button variant="outline" disabled={connecting} onClick={requestClose}>取消</Button>
          <Button disabled={connecting} onClick={connectAndEnable} className="bg-[#2773ff] text-white hover:bg-blue-700">
            {connecting ? <><LoaderCircle className="mr-2 size-4 animate-spin" />正在保存</> : <><Plus className="mr-1 size-4" />保存并启用</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ConfirmDiscardDialog
      open={discardConfirmOpen}
      onOpenChange={setDiscardConfirmOpen}
      onConfirm={() => { setDiscardConfirmOpen(false); onOpenChange(false); }}
      description={DISCARD_CONFIRMATION_DESCRIPTION}
    />
    </>
  );
}

export function PersonalOpenApiDialog({
  open,
  onOpenChange,
  onSave,
  editing,
  existingPlugins,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: PersonalPluginDraft, editingId?: string) => void;
  editing?: MinePluginItem | null;
  existingPlugins: MinePluginItem[];
}) {
  const config = editing?.personalConfig;
  const initialName = editing?.name ?? "";
  const initialDescription = editing?.description ?? "";
  const initialPluginUrl = config?.pluginUrl ?? "";
  const initialHeaders = config?.headers?.length ? config.headers : [{ name: "", value: "" }];
  const initialAuth = config?.auth ?? "none";
  const initialAuthLocation = config?.authLocation ?? "header";
  const initialAuthParamName = config?.authParamName ?? "";
  const initialAuthParamValue = config?.authParamValue ?? "";
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [pluginUrl, setPluginUrl] = useState(initialPluginUrl);
  const [headers, setHeaders] = useState(initialHeaders);
  const [auth, setAuth] = useState<"none" | "token">(initialAuth);
  const [authLocation, setAuthLocation] = useState<"header" | "query">(initialAuthLocation);
  const [authParamName, setAuthParamName] = useState(initialAuthParamName);
  const [authParamValue, setAuthParamValue] = useState(initialAuthParamValue);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const hasDraftChanges = name !== initialName
    || description !== initialDescription
    || pluginUrl !== initialPluginUrl
    || JSON.stringify(headers) !== JSON.stringify(initialHeaders)
    || auth !== initialAuth
    || authLocation !== initialAuthLocation
    || authParamName !== initialAuthParamName
    || authParamValue !== initialAuthParamValue;

  const requestClose = () => {
    if (connecting) return;
    if (hasDraftChanges) setDiscardConfirmOpen(true);
    else onOpenChange(false);
  };

  const invalidate = () => setError("");
  const updateHeader = (index: number, field: "name" | "value", value: string) => {
    setHeaders((current) => current.map((header, rowIndex) => rowIndex === index ? { ...header, [field]: value } : header));
    invalidate();
  };
  const checkConfig = () => {
    if (!name.trim() || !description.trim() || !pluginUrl.trim()) {
      setError("请填写插件名称、插件描述和插件 URL。");
      return false;
    }
    if (!/^[A-Za-z\u4e00-\u9fa5][A-Za-z0-9\u4e00-\u9fa5_.-]*$/.test(name.trim())) {
      setError("插件名称须以中文或英文字母开头，仅支持中文、英文、数字、下划线、中划线和点。");
      return false;
    }
    if (existingPlugins.some((plugin) => plugin.personalCreated && plugin.id !== editing?.id && plugin.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase())) {
      setError("该插件名称已存在，请更换插件名称。");
      return false;
    }
    try {
      const url = new URL(pluginUrl.trim());
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    } catch {
      setError("插件 URL 需为以 http:// 或 https:// 开头的有效地址。");
      return false;
    }
    if (headers.some((header) => !header.name.trim() || !header.value.trim())) {
      setError("请完整填写 Header 的参数名和参数值。");
      return false;
    }
    if (headers.some((header) => !/^[A-Za-z0-9_.-]{1,32}$/.test(header.name.trim()))) {
      setError("Header 参数名仅支持英文、数字、下划线、中划线和点，最多 32 个字符。");
      return false;
    }
    if (new Set(headers.map((header) => header.name.trim().toLowerCase())).size !== headers.length) {
      setError("Header 参数名不能重复。");
      return false;
    }
    if (auth === "token" && (!authParamName.trim() || !authParamValue.trim())) {
      setError("请填写鉴权参数名和鉴权参数值。");
      return false;
    }
    if (auth === "token" && !/^[A-Za-z0-9_.-]{1,32}$/.test(authParamName.trim())) {
      setError("鉴权参数名仅支持英文、数字、下划线、中划线和点，最多 32 个字符。");
      return false;
    }
    setError("");
    return true;
  };
  const saveAndEnable = () => {
    if (!checkConfig()) return;
    setConnecting(true);
    onSave({
      name: name.trim(),
      description: description.trim(),
      kind: "plugin",
      config: {
        pluginUrl: pluginUrl.trim(),
        headers: headers.map((header) => ({ name: header.name.trim(), value: header.value.trim() })),
        auth,
        ...(auth === "token" ? { authLocation, authParamName: authParamName.trim(), authParamValue: authParamValue.trim() } : {}),
      },
    }, editing?.id);
    onOpenChange(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(nextOpen) => { if (nextOpen) onOpenChange(true); else requestClose(); }}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden rounded-xl border-slate-200 p-0 sm:max-w-[720px]">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle className="text-lg">{editing ? "编辑自定义 OpenAPI" : "添加自定义 OpenAPI"}</DialogTitle>
          <DialogDescription className="sr-only">配置插件信息、访问地址、Header 和鉴权参数</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-6 overflow-y-auto px-6 py-5">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">基本信息</h2>
            <Field label="插件名称" required>
              <Input value={name} onChange={(event) => { setName(event.target.value); invalidate(); }} placeholder="请输入插件名称" maxLength={20} />
              <p className="mt-1 text-xs text-slate-500">支持中文、英文、数字、下划线、中划线和点，20 个字符以内 · {name.length}/20</p>
            </Field>
            <Field label="插件描述" required>
              <Textarea value={description} onChange={(event) => { setDescription(event.target.value); invalidate(); }} placeholder="请输入插件描述" className="min-h-16" maxLength={200} />
              <p className="mt-1 text-right text-xs text-slate-400">{description.length}/200</p>
            </Field>
          </section>
          <section className="space-y-4 border-t border-slate-100 pt-5">
            <h2 className="text-sm font-semibold text-slate-900">插件配置</h2>
            <Field label="插件 URL" required>
              <Input value={pluginUrl} onChange={(event) => { setPluginUrl(event.target.value); invalidate(); }} placeholder="请输入插件访问地址" />
            </Field>
            <div className="grid gap-2 text-sm sm:grid-cols-[112px_minmax(0,1fr)] sm:items-start">
              <span className="pt-2 font-medium text-slate-700"><span className="text-red-500">* </span>Header</span>
              <div className="min-w-0 rounded-lg border border-slate-200 p-3">
                <div className="mb-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_28px] gap-2 text-xs text-slate-500"><span>参数名</span><span>参数值</span><span>操作</span></div>
                <div className="space-y-2">
                  {headers.map((header, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_28px] items-center gap-2">
                    <Input value={header.name} onChange={(event) => updateHeader(index, "name", event.target.value)} placeholder="请输入参数名" maxLength={32} aria-label={`Header 参数名 ${index + 1}`} />
                    <Input value={header.value} onChange={(event) => updateHeader(index, "value", event.target.value)} placeholder="请输入参数值" maxLength={255} aria-label={`Header 参数值 ${index + 1}`} />
                    <Button type="button" variant="ghost" size="icon" className="size-7 text-slate-400" aria-label={`删除 Header 参数 ${index + 1}`} disabled={headers.length === 1} onClick={() => { setHeaders((current) => current.filter((_, rowIndex) => rowIndex !== index)); invalidate(); }}><Minus className="size-4" /></Button>
                  </div>)}
                </div>
                <button type="button" onClick={() => { setHeaders((current) => [...current, { name: "", value: "" }]); invalidate(); }} className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"><Plus className="size-4" />添加参数</button>
              </div>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center">
              <span className="font-medium text-slate-700">鉴权方式</span>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <label className="inline-flex cursor-pointer items-center gap-2"><input type="radio" name="openapi-auth" value="none" checked={auth === "none"} onChange={() => { setAuth("none"); invalidate(); }} className="accent-blue-600" />无鉴权</label>
                <label className="inline-flex cursor-pointer items-center gap-2"><input type="radio" name="openapi-auth" value="token" checked={auth === "token"} onChange={() => { setAuth("token"); invalidate(); }} className="accent-blue-600" />Service token/API key</label>
              </div>
            </div>
            {auth === "token" ? <div className="space-y-4">
              <div className="grid gap-2 text-sm sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center">
                <span className="font-medium text-slate-700">位置</span>
                <div className="flex gap-5">
                  <label className="inline-flex cursor-pointer items-center gap-2"><input type="radio" name="openapi-auth-location" value="header" checked={authLocation === "header"} onChange={() => { setAuthLocation("header"); invalidate(); }} className="accent-blue-600" />Header</label>
                  <label className="inline-flex cursor-pointer items-center gap-2"><input type="radio" name="openapi-auth-location" value="query" checked={authLocation === "query"} onChange={() => { setAuthLocation("query"); invalidate(); }} className="accent-blue-600" />Query</label>
                </div>
              </div>
              <Field label="鉴权参数名" required>
                <Input value={authParamName} onChange={(event) => { setAuthParamName(event.target.value); invalidate(); }} placeholder="请输入鉴权参数名" maxLength={32} />
              </Field>
              <Field label="鉴权参数值" required>
                <Input type="password" value={authParamValue} onChange={(event) => { setAuthParamValue(event.target.value); invalidate(); }} placeholder="请输入鉴权 token/key 参数值" />
              </Field>
            </div> : null}
          </section>
          {error ? <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        </div>
        <DialogFooter className="border-t border-slate-100 px-6 py-4">
          <Button variant="outline" disabled={connecting} onClick={requestClose}>取消</Button>
          <Button disabled={connecting} onClick={saveAndEnable} className="bg-[#2773ff] text-white hover:bg-blue-700">
            {connecting ? <><LoaderCircle className="mr-2 size-4 animate-spin" />正在保存</> : <><Plus className="mr-1 size-4" />保存并启用</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ConfirmDiscardDialog
      open={discardConfirmOpen}
      onOpenChange={setDiscardConfirmOpen}
      onConfirm={() => { setDiscardConfirmOpen(false); onOpenChange(false); }}
      description={DISCARD_CONFIRMATION_DESCRIPTION}
    />
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="grid gap-2 text-sm font-medium text-slate-700 sm:grid-cols-[112px_minmax(0,1fr)] sm:items-start"><span className="pt-2">{required ? <span className="text-red-500">* </span> : null}{label}</span><div className="min-w-0">{children}</div></label>;
}
