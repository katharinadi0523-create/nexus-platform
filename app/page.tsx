"use client";

import { useState } from "react";
import {
  Bell,
  Building2,
  CalendarDays,
  Cloud,
  FolderOpen,
  Grid2X2,
  LayoutGrid,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  SquarePen,
  Star,
  Users,
} from "lucide-react";

type WorkspaceSection = {
  title: string;
  items: {
    name: string;
    accent: string;
    icon: React.ReactNode;
  }[];
};

type Conversation = {
  id: number;
  name: string;
  avatar: string;
  preview: string;
  time: string;
  unread?: number;
  tag?: string;
};

type Message = {
  id: number;
  side: "left" | "right";
  avatar: string;
  content: string;
  time?: string;
  attachment?: boolean;
};

const workspaceSections: WorkspaceSection[] = [
  {
    title: "常用应用",
    items: [
      {
        name: "视频会议",
        accent: "from-sky-400 to-sky-600",
        icon: <Phone className="h-5 w-5" />,
      },
      {
        name: "E访客",
        accent: "from-emerald-400 to-teal-500",
        icon: <SquarePen className="h-5 w-5" />,
      },
      {
        name: "中电E查",
        accent: "from-blue-500 to-cyan-500",
        icon: <Search className="h-5 w-5" />,
      },
      {
        name: "云邮箱",
        accent: "from-indigo-400 to-blue-600",
        icon: <Mail className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "集团动态",
    items: [
      {
        name: "人才强企",
        accent: "from-cyan-400 to-blue-500",
        icon: <Building2 className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "我为群众办实事",
    items: [
      {
        name: "学习中心",
        accent: "from-teal-400 to-emerald-500",
        icon: <FolderOpen className="h-5 w-5" />,
      },
      {
        name: "中电e家",
        accent: "from-blue-500 to-indigo-600",
        icon: <Grid2X2 className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "业财工具",
    items: [
      {
        name: "报销付款",
        accent: "from-orange-400 to-orange-500",
        icon: <Star className="h-5 w-5" />,
      },
      {
        name: "CRM销售管理",
        accent: "from-amber-300 to-orange-400",
        icon: <Users className="h-5 w-5" />,
      },
    ],
  },
];

const conversations: Conversation[] = [
  {
    id: 1,
    name: "邵若楠",
    avatar: "邵",
    preview: "[图片] 2000 行代码，AI 也得写挺久",
    time: "昨天",
  },
  {
    id: 2,
    name: "王雅兰",
    avatar: "王",
    preview: "Skills 部分 is generating",
    time: "昨天",
  },
  {
    id: 3,
    name: "智能体及管控产品",
    avatar: "智",
    preview: "李韬：结束语音会议",
    time: "03/12",
  },
  {
    id: 4,
    name: "于家晟",
    avatar: "于",
    preview: "[已读] http://110.154.34.22:37701/...",
    time: "昨天",
  },
  {
    id: 5,
    name: "APPForge 迭代",
    avatar: "A",
    preview: "彭晓峰：0316 1.1.4 版本测试进度...",
    time: "昨天",
    unread: 7,
  },
  {
    id: 6,
    name: "AI 产品设计",
    avatar: "AI",
    preview: "汪超: [文件] 新疆数据流通知利用建...",
    time: "昨天",
    unread: 4,
  },
];

const messages: Message[] = [
  {
    id: 1,
    side: "left",
    avatar: "王",
    content: "嗯差不多~",
  },
  {
    id: 2,
    side: "right",
    avatar: "猫",
    content: "速成一版 ing",
  },
  {
    id: 3,
    side: "left",
    avatar: "王",
    content: "那什么 boclaw 有没有产品页面直接进行一个抄袭",
  },
  {
    id: 4,
    side: "right",
    avatar: "猫",
    content: "OpenClaw 配置写好初版了",
    time: "昨天 20:48",
    attachment: true,
  },
  {
    id: 5,
    side: "right",
    avatar: "猫",
    content: "Skills 部分 is generating",
  },
];

const navItems = [
  { key: "workspace", icon: LayoutGrid, label: "工作台", badge: false },
  { key: "chat", icon: MessageCircle, label: "对话", badge: true },
  { key: "contacts", icon: Users, label: "通讯录", badge: false },
  { key: "apps", icon: Grid2X2, label: "应用", badge: true },
  { key: "calendar", icon: CalendarDays, label: "日程", badge: false },
  { key: "cloud", icon: Cloud, label: "云盘", badge: false },
  { key: "favorite", icon: Star, label: "收藏", badge: false },
  { key: "notice", icon: Bell, label: "通知", badge: false },
] as const;

function AppIcon({
  accent,
  icon,
}: {
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-[0_10px_24px_rgba(43,111,196,0.18)]`}
    >
      {icon}
    </div>
  );
}

export default function Home() {
  const [activeModule, setActiveModule] = useState<"workspace" | "chat">(
    "workspace",
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(237,243,255,0.92)_42%,_rgba(228,237,250,0.98)_100%)] p-0 text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1600px] overflow-hidden rounded-[28px] border border-white/60 bg-white/45 shadow-[0_20px_80px_rgba(61,98,149,0.18)] backdrop-blur xl:m-3 xl:min-h-[calc(100vh-24px)]">
        <aside className="flex w-[76px] flex-col items-center justify-between bg-gradient-to-b from-[#5f88d8] via-[#4a73be] to-[#385688] py-5 text-white">
          <div className="flex flex-col items-center gap-5">
            <div className="flex gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff6257]" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28ca42]" />
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/30 text-lg font-semibold shadow-inner shadow-white/15">
              猫
            </div>

            <nav className="flex flex-col gap-3">
              {navItems.map(({ key, icon: Icon, label, badge }) => {
                const isActive = activeModule === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (key === "workspace" || key === "chat") {
                        setActiveModule(key);
                      }
                    }}
                    className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                      isActive
                        ? "bg-white/18 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                        : "text-white/80 hover:bg-white/12 hover:text-white"
                    }`}
                    aria-label={label}
                  >
                    <Icon className="h-5 w-5" />
                    {badge ? (
                      <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#4d74bd]" />
                    ) : null}
                    {isActive ? (
                      <span className="absolute -right-[14px] h-8 w-1 rounded-full bg-white" />
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-white/85 transition hover:bg-white/12 hover:text-white"
            aria-label="设置"
          >
            <Settings className="h-5 w-5" />
          </button>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,_rgba(255,255,255,0.82),_rgba(247,250,255,0.92))]">
          <header className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
            <div className="flex items-center gap-8">
              <div className="flex items-end gap-8 text-[15px]">
                <button
                  type="button"
                  onClick={() => setActiveModule("workspace")}
                  className={`relative pb-2 transition ${
                    activeModule === "workspace"
                      ? "font-semibold text-[#2f6de0]"
                      : "text-slate-600"
                  }`}
                >
                  常用应用
                  {activeModule === "workspace" ? (
                    <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-[#4b7bf0]" />
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModule("chat")}
                  className={`relative pb-2 transition ${
                    activeModule === "chat"
                      ? "font-semibold text-[#2f6de0]"
                      : "text-slate-600"
                  }`}
                >
                  即时通讯
                  {activeModule === "chat" ? (
                    <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-[#4b7bf0]" />
                  ) : null}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 self-stretch md:self-auto">
              <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 text-slate-400 shadow-sm md:w-[220px] md:flex-none">
                <Search className="h-4 w-4" />
                <input
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  placeholder="搜索"
                />
              </label>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="刷新"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="应用入口"
              >
                <Grid2X2 className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
              </button>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="更多设置"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </header>

          {activeModule === "workspace" ? (
            <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
              <div className="space-y-4">
                {workspaceSections.map((section) => (
                  <section
                    key={section.title}
                    className="rounded-[22px] border border-white/70 bg-white/78 px-5 py-5 shadow-[0_8px_24px_rgba(127,152,194,0.10)] backdrop-blur"
                  >
                    <h2 className="mb-5 text-[18px] font-semibold text-slate-800">
                      {section.title}
                    </h2>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      {section.items.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          className="group flex items-center gap-4 rounded-2xl border border-transparent px-2 py-2 text-left transition hover:border-slate-100 hover:bg-slate-50/80"
                        >
                          <AppIcon accent={item.accent} icon={item.icon} />
                          <div>
                            <p className="text-[17px] font-medium text-slate-800">
                              {item.name}
                            </p>
                            <p className="text-sm text-slate-400">
                              进入模块处理工作任务
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <aside className="flex w-full shrink-0 flex-col border-b border-slate-200/80 bg-white/75 lg:w-[320px] lg:border-b-0 lg:border-r">
                <div className="flex items-center gap-3 border-b border-slate-200/80 px-4 py-3">
                  <label className="flex h-10 flex-1 items-center gap-2 rounded-xl bg-slate-100/80 px-3 text-slate-400">
                    <Search className="h-4 w-4" />
                    <input
                      className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                      placeholder="搜索"
                    />
                  </label>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                    aria-label="新建会话"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="border-b border-slate-200/80 bg-[#fff7ef] px-4 py-3 text-sm font-medium text-[#ff7a00]">
                  严禁传输涉密敏感信息
                </div>

                <div className="flex items-center gap-6 border-b border-slate-200/80 px-4 py-3 text-[15px] text-slate-500">
                  <button type="button" className="border-b-2 border-[#4b7bf0] pb-2 font-semibold text-[#2f6de0]">
                    全部
                  </button>
                  <button type="button" className="pb-2">
                    未读 99+
                  </button>
                  <button type="button" className="pb-2">
                    @我 4
                  </button>
                  <button type="button" className="ml-auto">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {conversations.map((conversation, index) => (
                    <button
                      key={conversation.id}
                      type="button"
                      className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50/80 ${
                        index === 1 ? "bg-slate-50 shadow-[inset_3px_0_0_#60a5fa]" : ""
                      }`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 text-sm font-semibold text-slate-700">
                        {conversation.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-[17px] font-medium text-slate-900">
                            {conversation.name}
                          </p>
                          <span className="shrink-0 text-xs text-slate-400">
                            {conversation.time}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-400">
                          {conversation.tag ? `[${conversation.tag}] ` : ""}
                          {conversation.preview}
                        </p>
                      </div>
                      {conversation.unread ? (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                          {conversation.unread}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </aside>

              <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,_rgba(249,251,255,0.9),_rgba(255,255,255,0.96))]">
                <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 md:px-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[30px] font-semibold tracking-tight text-slate-800">
                      王雅兰
                    </h2>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label="详情"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <button
                      type="button"
                      className="rounded-xl p-2 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="文件"
                    >
                      <FolderOpen className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="rounded-xl p-2 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="会话检索"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="rounded-xl p-2 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="更多"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6">
                  <div className="mx-auto flex max-w-4xl flex-col gap-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start gap-3 ${
                          message.side === "right" ? "justify-end" : ""
                        }`}
                      >
                        {message.side === "left" ? (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-200 to-amber-100 text-sm font-semibold text-slate-700">
                            {message.avatar}
                          </div>
                        ) : null}

                        <div
                          className={`max-w-[78%] ${
                            message.side === "right" ? "items-end" : "items-start"
                          } flex flex-col gap-2`}
                        >
                          {message.time ? (
                            <span className="text-xs text-slate-400">
                              {message.time}
                            </span>
                          ) : null}
                          <div
                            className={`rounded-2xl px-4 py-3 text-[15px] leading-7 shadow-sm ${
                              message.side === "right"
                                ? "bg-[#ddebff] text-slate-800"
                                : "border border-slate-200 bg-white text-slate-800"
                            }`}
                          >
                            <p>{message.content}</p>
                            {message.attachment ? (
                              <div className="mt-3 rounded-2xl border border-white/60 bg-white/70 p-3">
                                <div className="mb-3 text-sm font-medium text-slate-700">
                                  配置页面预览
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  {Array.from({ length: 6 }).map((_, index) => (
                                    <div
                                      key={index}
                                      className="aspect-[4/3] rounded-lg border border-slate-200 bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(232,239,250,0.9))]"
                                    />
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                          <span className="text-xs text-slate-400">已读</span>
                        </div>

                        {message.side === "right" ? (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-200 to-cyan-100 text-sm font-semibold text-slate-700">
                            {message.avatar}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200/80 bg-white/90 px-4 py-4 md:px-6">
                  <div className="mx-auto max-w-4xl">
                    <div className="mb-3 flex items-center gap-3 text-slate-500">
                      <button
                        type="button"
                        className="rounded-lg p-2 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="表情"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="附件"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="更多工具"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-3 shadow-inner shadow-white">
                      <textarea
                        rows={4}
                        className="w-full resize-none bg-transparent text-[15px] leading-7 text-slate-700 outline-none placeholder:text-slate-400"
                        placeholder="输入消息..."
                        defaultValue="Skills 部分 is generating"
                      />
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          Enter 发送，Shift + Enter 换行
                        </span>
                        <button
                          type="button"
                          className="rounded-xl bg-[#4b7bf0] px-5 py-2 text-sm font-medium text-white shadow-[0_12px_24px_rgba(75,123,240,0.24)] transition hover:bg-[#3d6de5]"
                        >
                          发送
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
