"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import {
  AppWindow,
  Bot,
  Database,
  Key,
  Library,
  Network,
  Puzzle,
  Tag,
  Workflow,
  BookA,
  History,
  ExternalLink,
  Shield,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalHeader } from "@/components/layout/global-header";

interface MenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  external?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: "项目开发",
    items: [
      {
        key: "AppMarketplace",
        label: "应用广场",
        icon: AppWindow,
        href: "/app-marketplace",
      },
      {
        key: "Agent",
        label: "智能体",
        icon: Bot,
        href: "/agent",
      },
    ],
  },
  {
    title: "资源管理",
    items: [
      {
        key: "MCPManagement",
        label: "MCP管理",
        icon: Network,
        href: "/mcp-management",
      },
      {
        key: "ToolMarketplace",
        label: "插件广场",
        icon: Puzzle,
        href: "/tool-marketplace",
      },
      {
        key: "Workflow",
        label: "工作流",
        icon: Workflow,
        href: "/workflow",
      },
      {
        key: "KnowledgeBase",
        label: "知识库",
        icon: Library,
        href: "/knowledge-base",
      },
      {
        key: "DataBase",
        label: "数据库",
        icon: Database,
        href: "/database",
      },
      {
        key: "TermBank",
        label: "术语库",
        icon: BookA,
        href: "/term-bank",
      },
    ],
  },
  {
    title: "工作空间",
    items: [
      {
        key: "ApiKey",
        label: "API-Key",
        icon: Key,
        href: "/api-key",
      },
      {
        key: "TagManagement",
        label: "标签管理",
        icon: Tag,
        href: "/tag-management",
      },
      {
        key: "Trace",
        label: "Trace",
        icon: History,
        href: "/trace",
      },
    ],
  },
  {
    title: "安全防护",
    items: [
      {
        key: "KeywordLibrary",
        label: "安全词库",
        icon: FileText,
        href: "/security/keyword-library",
      },
      {
        key: "ProtectionTask",
        label: "防护任务",
        icon: Shield,
        href: "/security/protection-task",
      },
    ],
  },
];

function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        {menuGroups.map((group) => (
          <div key={group.title} className="mb-6">
            <div className="mb-2 px-3 text-xs font-medium text-gray-500 tracking-wider">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const linkClassName = cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                );
                
                if (item.external) {
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClassName}
                    >
                      <Icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-gray-500")} />
                      <span>{item.label}</span>
                      <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
                    </a>
                  );
                }
                
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={linkClassName}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-gray-500")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GlobalHeader />
      <div className="flex h-screen overflow-hidden bg-slate-50 pt-[60px]">
        {/* 左侧侧边栏: 固定宽度 220px, z-50 */}
        <aside className="w-[220px] flex-none z-50 border-r bg-white h-[calc(100vh-60px)] hidden md:block">
          <Sidebar />
        </aside>
        {/* 右侧主体: 自动填满剩余空间 */}
        <main className="flex-1 flex flex-col h-[calc(100vh-60px)] overflow-hidden relative">
          {/* 页面内容滚动区 */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </>
  );
}
