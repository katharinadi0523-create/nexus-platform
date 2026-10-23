"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bot,
  ChevronDown,
  FileText,
  FolderOpen,
  MessageSquarePlus,
  PlugZap,
  Search,
  Settings,
  Sparkles,
  UserRound,
  Workflow,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { ChatWorkspace } from "@/components/my-claw/chat/chat-workspace";
import { AgentsPlaza } from "@/components/my-claw/agents/agents-plaza";
import { MyClawAutomationWorkbench } from "@/components/my-claw/automation/automation-workbench";
import { MyClawPluginsHub } from "@/components/my-claw/plugins/plugins-hub";
import { MyClawSkillsHub } from "@/components/my-claw/skills/skills-hub";
import { MyClawFilesPage } from "@/components/my-claw/files/files-page";
import { MyClawSettingsPage } from "@/components/my-claw/settings/settings-page";
import { useMyClaw } from "@/components/my-claw/provider";
import { ClawClientKnowledgePage } from "@/components/claw-client/knowledge-page";
import { ClarifyDemoSessionPanel } from "@/components/claw-client/clarify/clarify-demo-session-panel";
import { useClarifyRuntime } from "@/components/claw-client/clarify/clarify-runtime";
import { ClarifyStatusCapsule } from "@/components/claw-client/clarify/clarify-status-capsule";
import { getMyClawSession } from "@/lib/mock/my-claw/sessions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MY_CLAW_BRAND_ICON_SRC,
  MY_CLAW_PRODUCT_NAME,
  MY_CLAW_USER_DISPLAY_NAME,
} from "@/lib/mock/my-claw/branding";
import { cn } from "@/lib/utils";

type ClientTab =
  | "chat"
  | "agents"
  | "skills"
  | "plugins"
  | "knowledge"
  | "automation"
  | "account"
  | "channels"
  | "files"
  | "settings";

const MAIN_NAV: Array<{
  key: ClientTab;
  label: string;
  icon: typeof MessageSquarePlus;
}> = [
  { key: "chat", label: "新对话", icon: MessageSquarePlus },
  { key: "agents", label: "智能体", icon: Bot },
  { key: "skills", label: "技能", icon: Sparkles },
  { key: "plugins", label: "插件", icon: PlugZap },
  { key: "knowledge", label: "知识", icon: FileText },
  { key: "automation", label: "自动化", icon: Zap },
];

const ACCOUNT_NAV: Array<{
  key: Extract<ClientTab, "settings" | "files" | "channels" | "account">;
  label: string;
  icon: typeof Settings;
}> = [
  { key: "settings", label: "Claw 配置", icon: Settings },
  { key: "files", label: "文件管理", icon: FolderOpen },
  { key: "channels", label: "接入渠道", icon: Workflow },
  { key: "account", label: "我的账号", icon: UserRound },
];

function normalizeTab(tab: string | null): ClientTab {
  return MAIN_NAV.some((item) => item.key === tab) ||
    ACCOUNT_NAV.some((item) => item.key === tab)
    ? (tab as ClientTab)
    : "chat";
}

function hrefFor(tab: ClientTab, sessionId?: string | null) {
  const params = new URLSearchParams();
  if (tab !== "chat") params.set("tab", tab);
  if (tab === "chat" && sessionId) params.set("sessionId", sessionId);
  const query = params.toString();
  return `/claw-client${query ? `?${query}` : ""}`;
}

function VersionSwitch({ compact = false }: { compact?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 rounded-md border border-[#dbe3ef] bg-white px-2 py-1 text-[11px] font-medium text-[#52657d] transition-colors hover:border-[#adc5ec] hover:bg-[#f6f9ff] hover:text-[#2773ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2773ff]/30",
            compact && "h-7 px-1.5",
          )}
          aria-label="切换 Claw 使用形态"
        >
          {compact ? "基础版" : "基础形态"}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuItem asChild>
          <Link href="/claw-client" className="cursor-pointer">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium">基础形态</span>
              <span className="text-[11px] font-normal text-slate-500">个人会话与能力管理</span>
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-claw" className="cursor-pointer">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium">项目协作形态</span>
              <span className="text-[11px] font-normal text-slate-500">Project、事项与多人协作</span>
            </span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BasicSessionList({ activeSessionId }: { activeSessionId?: string | null }) {
  const { sessions, setActiveSession } = useMyClaw();
  const clarifyRuntime = useClarifyRuntime();
  const groupedSessions = useMemo(
    () => ({
      pinned: sessions.filter((item) => item.pinned),
      recent: sessions.filter((item) => !item.pinned),
    }),
    [sessions],
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-2">
      {(["pinned", "recent"] as const).map((group) => {
        const items = groupedSessions[group];
        if (items.length === 0) return null;
        return (
          <section key={group} className="mb-4">
            <div className="px-2.5 pb-1 text-[11px] font-medium text-[#8996a8]">
              {group === "pinned" ? "置顶会话" : "历史会话"}
            </div>
            <div className="space-y-0.5">
              {items.map((session) => {
                const selected = session.id === activeSessionId;
                const clarifyProjection = clarifyRuntime?.project(session.id) ?? null;
                return (
                  <Link
                    key={session.id}
                    href={hrefFor("chat", session.id)}
                    onClick={() => setActiveSession(session.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                      selected
                        ? "bg-[#e8f0fb] font-medium text-[#245db9]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    )}
                    title={session.title}
                  >
                    <span className="min-w-0 flex-1 truncate">{session.title}</span>
                    {clarifyProjection && clarifyRuntime ? (
                      <ClarifyStatusCapsule projection={clarifyProjection} />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function AccountPage() {
  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa] px-6 py-7 lg:px-10">
      <div className="mx-auto max-w-[920px]">
        <h1 className="text-xl font-semibold text-slate-900">我的账号</h1>
        <div className="mt-5 border border-slate-200 bg-white">
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="grid grid-cols-[120px_1fr] px-5 py-4"><dt className="text-slate-500">账号</dt><dd className="font-medium text-slate-800">{MY_CLAW_USER_DISPLAY_NAME}</dd></div>
            <div className="grid grid-cols-[120px_1fr] px-5 py-4"><dt className="text-slate-500">账号角色</dt><dd className="text-slate-700">个人 Claw 使用者</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}

type Channel = "飞书" | "企业微信" | "钉钉";

const CHANNELS: Array<{ name: Channel; code: string; icon: string }> = [
  { name: "飞书", code: "feishu", icon: "/icons/飞书.png" },
  { name: "企业微信", code: "wechat", icon: "/icons/企业微信.png" },
  { name: "钉钉", code: "dingtalk", icon: "/icons/钉钉.png" },
];

function ChannelsPage() {
  const [target, setTarget] = useState<Channel | null>(null);
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const targetCode = CHANNELS.find((channel) => channel.name === target)?.code;

  const closeDialog = () => {
    setTarget(null);
    setAppId("");
    setAppSecret("");
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa] px-6 py-7 lg:px-10">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="text-xl font-semibold text-slate-900">接入渠道</h1>
        <p className="mt-2 text-sm text-slate-500">将个人 Claw 接入协作渠道，在已有会话之外接收和回复消息。</p>
        <div className="mt-5 grid max-w-4xl gap-4 md:grid-cols-3">
          {CHANNELS.map((channel) => (
            <article key={channel.code} className="border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <div className="flex items-start justify-between">
                <Image src={channel.icon} alt={channel.name} width={40} height={40} className="h-10 w-10 rounded-md object-contain" />
                <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">未接入</span>
              </div>
              <h2 className="mt-4 text-base font-medium text-slate-800">{channel.name}</h2>
              <p className="mt-1 text-xs text-slate-400">{channel.code}</p>
              <Button className="mt-5 h-8 w-full rounded-[4px] bg-[#2773ff] text-xs hover:bg-[#1f63e0]" onClick={() => setTarget(channel.name)}>
                接入
              </Button>
            </article>
          ))}
        </div>
      </div>

      <Dialog open={Boolean(target)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="gap-0 rounded-md border-slate-200 p-0 sm:max-w-[560px]" showCloseButton={false}>
          <DialogHeader className="border-b border-slate-100 px-6 py-5">
            <DialogTitle className="text-base">接入{target}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="channel-app-id">APP ID</Label>
              <Input id="channel-app-id" value={appId} maxLength={64} onChange={(event) => setAppId(event.target.value)} placeholder="请输入 APP ID" className="rounded-[4px]" />
              <p className="text-right text-[11px] text-slate-400">{appId.length} / 64</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-app-secret">APP Secret</Label>
              <Input id="channel-app-secret" type="password" value={appSecret} maxLength={256} onChange={(event) => setAppSecret(event.target.value)} placeholder="请输入 APP Secret" className="rounded-[4px]" />
              <p className="text-right text-[11px] text-slate-400">{appSecret.length} / 256</p>
            </div>
            <div className="bg-[#f8fafc] px-4 py-3 text-xs leading-6 text-slate-500">
              请在{target}开放平台完成应用创建、机器人能力和权限配置，再将凭据填写至此处。正式接入前还需完成平台侧审核和回调配置。
              <span className="mt-2 block font-medium text-[#2773ff]">渠道标识：{targetCode}</span>
            </div>
          </div>
          <DialogFooter className="border-t border-slate-100 px-6 py-4 sm:justify-end">
            <Button variant="outline" className="rounded-[4px]" onClick={closeDialog}>取消</Button>
            <Button className="rounded-[4px] bg-[#2773ff] hover:bg-[#1f63e0]" onClick={() => { toast.success(`${target} 接入信息已保存`); closeDialog(); }}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClientSidebar({ tab, sessionId }: { tab: ClientTab; sessionId?: string | null }) {
  return (
    <aside className="flex h-full w-[250px] shrink-0 flex-col border-r border-[#e6eaf0] bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-[#eef1f5] px-4">
        <Image src={MY_CLAW_BRAND_ICON_SRC} alt={MY_CLAW_PRODUCT_NAME} width={28} height={28} className="h-7 w-7 rounded-md object-cover" priority />
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-800">{MY_CLAW_PRODUCT_NAME}</span>
        <VersionSwitch compact />
      </div>
      <div className="flex items-center gap-1 px-3 pt-3">
        <Link href="/claw-client" className="flex h-8 flex-1 items-center gap-2 rounded-md bg-[#2773ff] px-3 text-[13px] font-medium text-white hover:bg-[#1f63e0]">
          <MessageSquarePlus className="h-4 w-4" />新对话
        </Link>
        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="搜索会话">
          <Search className="h-4 w-4" />
        </button>
      </div>
      <nav className="space-y-1 px-3 pb-3 pt-3">
        {MAIN_NAV.slice(1).map((item) => {
          const Icon = item.icon;
          const active = item.key === tab;
          return (
            <Link key={item.key} href={hrefFor(item.key)} className={cn("flex h-9 items-center gap-2.5 rounded-md px-3 text-[13px] transition-colors", active ? "bg-[#e8f0fb] font-medium text-[#2773ff]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
              <Icon className="h-4 w-4" />{item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mx-3 border-t border-[#eef1f5]" />
      <BasicSessionList activeSessionId={tab === "chat" ? sessionId : null} />
      <div className="border-t border-[#eef1f5] px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-slate-50">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dbe7f4] text-xs font-semibold text-[#2f5fbf]">邸</span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-700">{MY_CLAW_USER_DISPLAY_NAME}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-48">
            {ACCOUNT_NAV.map((item) => {
              const Icon = item.icon;
              return <DropdownMenuItem key={item.key} asChild><Link href={hrefFor(item.key)} className="cursor-pointer"><Icon className="h-4 w-4 text-slate-500" />{item.label}</Link></DropdownMenuItem>;
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

export function ClawClientWorkbench({ tab: rawTab, sessionId, messageId }: { tab: string | null; sessionId?: string | null; messageId?: string | null }) {
  const tab = normalizeTab(rawTab);
  let content: React.ReactNode;
  const chatSession = tab === "chat" && sessionId ? getMyClawSession(sessionId) : undefined;
  if (chatSession?.kind === "clarify_demo") content = <ClarifyDemoSessionPanel key={chatSession.id} session={chatSession} />;
  else if (tab === "chat") content = <ChatWorkspace sessionId={sessionId} messageId={messageId} />;
  else if (tab === "agents") content = <AgentsPlaza />;
  else if (tab === "skills") content = <MyClawSkillsHub />;
  else if (tab === "plugins") content = <MyClawPluginsHub />;
  else if (tab === "automation") content = <MyClawAutomationWorkbench chatBasePath="/claw-client" />;
  else if (tab === "knowledge") content = <ClawClientKnowledgePage />;
  else if (tab === "channels") content = <ChannelsPage />;
  else if (tab === "settings") content = <MyClawSettingsPage />;
  else if (tab === "files") content = <MyClawFilesPage />;
  else content = <AccountPage />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8fa]">
      <ClientSidebar tab={tab} sessionId={sessionId} />
      <main className="min-w-0 flex-1 overflow-hidden">{content}</main>
    </div>
  );
}
