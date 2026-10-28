"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ChevronDown, Database, Info, Pencil, Settings, UserRound, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getPersonalClawDetail } from "@/lib/mock/my-claw";

type SettingsSection = "设定" | "接入渠道" | "存储" | "账号";
type Channel = "飞书" | "企业微信" | "钉钉";
const SECTIONS: SettingsSection[] = ["设定", "接入渠道", "账号"];
const AGENT_MD_STORAGE_KEY = "claw-client-agent-md";
const AGENT_MD_MAX_LENGTH = 5_000;
const SECTION_ICONS = {
  设定: Settings,
  接入渠道: Workflow,
  存储: Database,
  账号: UserRound,
} satisfies Record<SettingsSection, typeof Settings>;
const CHANNELS: Array<{ name: Channel; code: string; icon: string }> = [
  { name: "飞书", code: "feishu", icon: "/icons/飞书.png" },
  { name: "企业微信", code: "wechat", icon: "/icons/企业微信.png" },
  { name: "钉钉", code: "dingtalk", icon: "/icons/钉钉.png" },
];

type PendingExit = { type: "close" } | { type: "section"; section: SettingsSection };

export function ClawClientSettingsPage({
  closeRequest = 0,
  onDirtyChange,
  onClose,
}: {
  closeRequest?: number;
  onDirtyChange?: (dirty: boolean) => void;
  onClose?: () => void;
}) {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const [section, setSection] = useState<SettingsSection>("设定");
  const [agentMd, setAgentMd] = useState("");
  const [savedAgentMd, setSavedAgentMd] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [channelTarget, setChannelTarget] = useState<Channel | null>(null);
  const [connectedChannels, setConnectedChannels] = useState<Set<Channel>>(() => new Set());
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [account, setAccount] = useState<{ username: string; displayName: string; role?: string } | null>(null);
  const [pendingExit, setPendingExit] = useState<PendingExit | null>(null);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [conflictField, setConflictField] = useState(false);
  const handledCloseRequest = useRef(closeRequest);
  const hasAgentMdChanges = hydrated && agentMd !== savedAgentMd;
  const hasUnsavedChanges = hasAgentMdChanges;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me").then((response) => response.ok ? response.json() : null).then((data) => {
      if (!cancelled && data?.user) setAccount(data.user);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    try {
      const storedAgentMd = window.localStorage.getItem(AGENT_MD_STORAGE_KEY) ?? "";
      setAgentMd(storedAgentMd.replace(/\\n/g, "\n"));
      setSavedAgentMd(storedAgentMd.replace(/\\n/g, "\n"));
    } catch {
      toast.error("读取本地设置失败，当前修改暂不能保存。");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  const updateSavedValue = useCallback((value: string) => {
    setAgentMd(value);
    setSavedAgentMd(value);
  }, []);

  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key === AGENT_MD_STORAGE_KEY) {
        const nextValue = event.newValue ?? "";
        if (hasAgentMdChanges) setConflictField(true);
        else updateSavedValue(nextValue);
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [hasAgentMdChanges, updateSavedValue]);
  const storage = detail.workspaceStorageConfig;
  const hasWorkspaceQuota = storage.workspaceQuotaGb != null;
  const usageCapacity: number = storage.workspaceQuotaGb ?? storage.volumeTotalGb;
  const usageAmount = hasWorkspaceQuota ? storage.workspaceUsedGb : Math.max(0, storage.volumeTotalGb - storage.volumeAvailableGb);
  const usagePercent = usageCapacity > 0 ? Math.min(100, Math.max(0, usageAmount / usageCapacity * 100)) : 0;
  const gb = (value: number) => `${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}GB`;
  const remainingCapacity = Math.max(0, usageCapacity - usageAmount);
  const roleName = account?.role === "admin" ? "管理员" : account?.role === "user" ? "普通用户" : account?.role ?? "未提供";

  function requestExit(target: PendingExit) {
    if (hasUnsavedChanges) {
      setPendingExit(target);
      setUnsavedDialogOpen(true);
      return;
    }
    if (target.type === "close") onClose?.();
    else setSection(target.section);
  }

  useEffect(() => {
    if (closeRequest === handledCloseRequest.current) return;
    handledCloseRequest.current = closeRequest;
    requestExit({ type: "close" });
  // requestExit reads the current draft state when a parent close is attempted.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeRequest]);

  function saveField() {
    if (!hydrated) return false;
    const draft = agentMd;
    const baseline = savedAgentMd;
    try {
      const currentValue = window.localStorage.getItem(AGENT_MD_STORAGE_KEY) ?? "";
      if (currentValue !== baseline) {
        setConflictField(true);
        return false;
      }
      window.localStorage.setItem(AGENT_MD_STORAGE_KEY, draft);
      setSavedAgentMd(draft);
      return true;
    } catch {
      toast.error("保存失败，内容仍保留在当前页面，请检查浏览器存储后重试。");
      return false;
    }
  }

  function saveAgentMd() {
    if (hasAgentMdChanges && saveField()) toast.success("保存成功");
  }

  function saveAllChanges() {
    const saved = !hasAgentMdChanges || saveField();
    if (saved) toast.success("保存成功");
    return saved;
  }

  function continueAfterExit() {
    const target = pendingExit;
    setPendingExit(null);
    setUnsavedDialogOpen(false);
    if (target?.type === "close") onClose?.();
    else if (target?.type === "section") setSection(target.section);
  }

  function discardAndContinue() {
    if (hasAgentMdChanges) setAgentMd(savedAgentMd);
    continueAfterExit();
  }

  function saveAndContinue() {
    if (!saveAllChanges()) return;
    continueAfterExit();
  }

  function cancelAgentMdChanges() {
    setAgentMd(savedAgentMd);
  }

  function resolveConflict(choice: "reload" | "keep") {
    if (!conflictField) return;
    try {
      const latest = window.localStorage.getItem(AGENT_MD_STORAGE_KEY) ?? "";
      if (choice === "reload") updateSavedValue(latest);
      else setSavedAgentMd(latest);
      setConflictField(false);
      if (choice === "keep") toast.message("已保留本页内容；再次保存会覆盖其他标签页的版本。");
    } catch {
      toast.error("无法读取其他标签页的最新版本。");
    }
  }

  function openChannelConfig(channel: Channel) {
    setAppId("");
    setAppSecret("");
    setChannelTarget(channel);
  }

  function closeChannelConfig() {
    setChannelTarget(null);
    setAppId("");
    setAppSecret("");
  }

  return (
    <div className="flex h-full min-h-0 bg-white">
      <aside className="w-[168px] shrink-0 border-r border-slate-200 bg-[#f3f5f8] px-3 py-4">
        <h1 className="px-2 text-sm font-semibold text-slate-900">设置</h1>
        <nav className="mt-3 space-y-1" aria-label="设置分类">
          {SECTIONS.map((item) => {
            const Icon = SECTION_ICONS[item];
            return (
              <button key={item} type="button" onClick={() => item !== section && requestExit({ type: "section", section: item })} className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] ${section === item ? "bg-[#e5eefc] font-medium text-[#2773ff]" : "text-slate-600 hover:bg-white/70"}`}>
                <Icon className={`h-3.5 w-3.5 ${section === item ? "text-[#2773ff]" : "text-slate-400"}`} aria-hidden="true" />
                {item}
                {item === "设定" && hasAgentMdChanges ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="有未保存更改" /> : null}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
        {section === "设定" ? (
          <div className="mx-auto max-w-[720px] space-y-5">
            <section>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-semibold text-slate-900">自定义指令</h2>
                <TooltipProvider delayDuration={150}><Tooltip><TooltipTrigger asChild><button type="button" aria-label="自定义指令说明" className="rounded-full text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><Info className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent side="bottom" align="start" className="z-[120] max-w-[300px] leading-5">可按需补充身份、常做任务、服务对象、输出偏好或行为边界</TooltipContent></Tooltip></TooltipProvider>
                {hasAgentMdChanges ? <span className="text-[11px] text-amber-600">尚未保存</span> : null}
              </div>
              <Textarea value={agentMd} maxLength={AGENT_MD_MAX_LENGTH} onChange={(event) => setAgentMd(event.target.value)} placeholder={'# 我的 Claw\n- 身份与目标：我是……，希望 Claw 协助我……\n- 服务对象与常做任务：主要面向……，经常处理……\n- 工作方式与输出偏好：请优先……，结果采用……格式\n- 行为边界：遇到……情况时，请……；不确定时，请……'} className="mt-2 h-[240px] min-h-[240px] max-h-[240px] resize-none overflow-y-auto rounded-md border-slate-200 bg-slate-50 font-mono text-xs leading-5 placeholder:text-slate-400" />
              <div className="mt-1 flex justify-end gap-2">{hasAgentMdChanges ? <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500 hover:text-slate-800" onClick={cancelAgentMdChanges}>取消</Button> : null}<Button type="button" size="sm" className="h-7 bg-[#2773ff] px-3 text-xs text-white hover:bg-[#1f63e0] disabled:bg-slate-100 disabled:text-slate-400" onClick={saveAgentMd} disabled={!hasAgentMdChanges}>保存</Button></div>
            </section>
          </div>
        ) : null}

        {section === "接入渠道" ? (
          <section className="mx-auto max-w-[720px]">
            {channelTarget ? (
              <>
                <header className="flex items-center gap-2 border-b border-slate-200 pb-4">
                  <Button type="button" variant="ghost" size="sm" aria-label="返回渠道列表" title="返回渠道列表" className="-ml-2 h-8 w-8 px-0 text-slate-600" onClick={closeChannelConfig}><ArrowLeft className="h-4 w-4" /></Button>
                  <span className="h-4 w-px bg-slate-200" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-slate-900">接入{channelTarget}</h2>
                </header>
                <div className="mx-auto mt-5 max-w-[520px] space-y-4">
                  <div className="space-y-2"><Label htmlFor="settings-channel-app-id">APP ID</Label><Input id="settings-channel-app-id" value={appId} maxLength={64} onChange={(event) => setAppId(event.target.value)} placeholder="请输入 APP ID" className="rounded-[4px]"/><p className="text-right text-[11px] text-slate-400">{appId.length} / 64</p></div>
                  <div className="space-y-2"><Label htmlFor="settings-channel-app-secret">APP Secret</Label><Input id="settings-channel-app-secret" type="password" value={appSecret} maxLength={256} onChange={(event) => setAppSecret(event.target.value)} placeholder="请输入 APP Secret" className="rounded-[4px]"/><p className="text-right text-[11px] text-slate-400">{appSecret.length} / 256</p></div>
                  <div className="rounded-md bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-500">请在{channelTarget}开放平台完成应用创建、机器人能力和权限配置，再将凭据填写至此处。正式接入前还需完成平台侧审核和回调配置。</div>
                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button type="button" variant="outline" className="rounded-[4px]" onClick={closeChannelConfig}>取消</Button><Button type="button" className="rounded-[4px] bg-[#2773ff] hover:bg-[#1f63e0]" onClick={() => { setConnectedChannels((current) => new Set(current).add(channelTarget)); toast.success(`${channelTarget} 接入信息已保存`); closeChannelConfig(); }}>确认接入</Button></div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-slate-900">接入渠道</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {CHANNELS.map((channel) => {
                    const connected = connectedChannels.has(channel.name);
                    return <article key={channel.code} className="border border-slate-200 bg-white p-4"><div className="flex items-start justify-between"><Image src={channel.icon} alt={channel.name} width={32} height={32} className="h-8 w-8 rounded object-contain"/><span className={`rounded px-2 py-1 text-[11px] ${connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{connected ? "已接入" : "未接入"}</span></div><h3 className="mt-3 text-sm font-medium text-slate-800">{channel.name}</h3><p className="mt-1 text-[11px] text-slate-400">{channel.code}</p><Button type="button" size="sm" variant={connected ? "outline" : "default"} className={`mt-3 h-8 w-full text-xs ${connected ? "" : "bg-[#2773ff]"}`} onClick={() => openChannelConfig(channel.name)}>{connected ? "重新配置" : "接入"}</Button></article>;
                  })}
                </div>
              </>
            )}
          </section>
        ) : null}

        {section === "存储" ? (
          <section className="mx-auto max-w-[720px] pr-7 pb-4">
            <header className="border-b border-slate-200 pb-4">
              <h2 className="text-sm font-semibold text-slate-900">存储</h2>
            </header>

            <section className="border-b border-slate-200 py-5" aria-labelledby="storage-usage-title">
              <div className="flex items-center justify-between">
                <h3 id="storage-usage-title" className="text-sm font-semibold text-slate-800">空间用量</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">只读</span>
              </div>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-xs text-slate-500">已使用空间</span>
                <span className="text-lg font-semibold tabular-nums text-slate-900">{gb(usageAmount)}</span>
                <span className="text-sm tabular-nums text-slate-500">/ {gb(usageCapacity)}</span>
              </div>
              <div
                className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label={`${hasWorkspaceQuota ? "个人工作台配额" : "存储卷容量"}使用率`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(usagePercent)}
              >
                <div className="h-full rounded-full bg-[#315efb] transition-[width]" style={{ width: `${usagePercent}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>{hasWorkspaceQuota ? "个人工作台配额" : "存储卷容量"}</span>
                <span className="shrink-0 tabular-nums">{usagePercent.toFixed(0)}% · 剩余 {gb(remainingCapacity)}</span>
              </div>
            </section>

            <section className="border-b border-slate-200 py-5" aria-labelledby="storage-volume-title">
              <h3 id="storage-volume-title" className="text-sm font-semibold text-slate-800">存储卷</h3>
              <dl className="mt-3 grid gap-x-6 gap-y-4 text-[13px] sm:grid-cols-2">
                <InfoRow label="存储卷名称" value={storage.volumeDisplayName || "—"} />
                <InfoRow label="所属组织" value={storage.organizationName || "—"} />
              </dl>
            </section>

            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-sm text-[13px] font-medium text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 [&::-webkit-details-marker]:hidden">
                <span>存储卷详情</span>
                <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <dl className="mt-4 grid gap-x-6 gap-y-4 border-t border-slate-100 pt-4 text-[13px] sm:grid-cols-2">
                <InfoRow label="存储源" value={storage.volumeName || "—"} />
                <InfoRow label="子目录" value={storage.subdirectory || "—"} />
                {!hasWorkspaceQuota ? <InfoRow label="个人工作台已用" value={gb(storage.workspaceUsedGb)} /> : null}
              </dl>
            </details>
          </section>
        ) : null}

        {section === "账号" ? (
          <section className="mx-auto max-w-[720px] pr-7 pb-4">
            <header className="border-b border-slate-200 pb-4"><h2 className="text-sm font-semibold text-slate-900">我的账号</h2></header>
            <div className="border-b border-slate-200 py-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xs font-semibold text-slate-700">个人资料</h3>
                <Button type="button" variant="outline" className="h-8 rounded-[4px] border-slate-300 px-3 text-xs text-slate-700" onClick={() => toast.info("账号资料编辑功能暂未接入")}><Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />编辑</Button>
              </div>
              <div className="mt-3 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold text-[#315efb]">{account?.displayName?.slice(0, 1) || "—"}</div>
                <dl className="grid min-w-0 flex-1 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-2">
                  <InfoRow label="姓名" value={account?.displayName || "加载中"} />
                  <InfoRow label="登录账号" value={account?.username || "加载中"} />
                  <InfoRow label="手机号" value="未提供" />
                  <InfoRow label="注册时间" value="未提供" />
                </dl>
              </div>
            </div>
            <div className="border-b border-slate-200 py-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xs font-semibold text-slate-700">登录密码</h3>
                <Button type="button" variant="outline" className="h-8 rounded-[4px] border-slate-300 px-3 text-xs text-slate-700" onClick={() => toast.info("修改密码功能暂未接入")}><Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />修改密码</Button>
              </div>
              <dl className="mt-3 grid gap-x-6 gap-y-3 text-[13px] sm:grid-cols-2">
                <InfoRow label="密码" value="••••••••••••" />
              </dl>
            </div>
            <div className="py-4">
              <h3 className="text-xs font-semibold text-slate-700">部门信息</h3>
              <dl className="mt-3 grid gap-x-6 gap-y-3 text-[13px] sm:grid-cols-2">
                <InfoRow label="部门" value="未提供" />
                <InfoRow label="角色" value={roleName} />
              </dl>
            </div>
          </section>
        ) : null}
      </main>

      <Dialog open={unsavedDialogOpen} onOpenChange={(open) => {
        setUnsavedDialogOpen(open);
        if (!open) setPendingExit(null);
      }}>
        <DialogContent className="gap-0 rounded-md border-slate-200 p-0 sm:max-w-[420px]" showCloseButton={false}>
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="text-base">存在未保存的更改</DialogTitle>
            <DialogDescription className="pt-1 text-sm leading-6">离开前要保存当前设定吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-5 py-4 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" className="rounded-[4px] text-slate-600" onClick={discardAndContinue}>放弃更改</Button>
            <div className="flex gap-2"><Button type="button" variant="outline" className="rounded-[4px]" onClick={() => { setUnsavedDialogOpen(false); setPendingExit(null); }}>继续编辑</Button><Button type="button" className="rounded-[4px] bg-[#2773ff] hover:bg-[#1f63e0]" onClick={saveAndContinue}>保存并继续</Button></div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={conflictField} onOpenChange={(open) => !open && setConflictField(false)}>
        <DialogContent className="gap-0 rounded-md border-slate-200 p-0 sm:max-w-[440px]" showCloseButton={false}>
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="text-base">设置已在其他标签页更新</DialogTitle>
            <DialogDescription className="pt-1 text-sm leading-6">为避免覆盖其他版本，请选择加载最新内容，或保留本页内容并在确认后覆盖。</DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-5 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-[4px]" onClick={() => resolveConflict("reload")}>加载最新内容</Button>
            <Button type="button" className="rounded-[4px] bg-[#2773ff] hover:bg-[#1f63e0]" onClick={() => resolveConflict("keep")}>保留本页内容</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words leading-5 text-slate-800">{value}</dd></div>;
}
