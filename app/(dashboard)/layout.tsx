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
  Sparkles,
  Shrimp,
  Building2,
  FileCode,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalHeader } from "@/components/layout/global-header";

interface MenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  external?: boolean;
  /** 占位项，不可跳转 */
  disabled?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
  dividerTop?: boolean;
}

const menuGroups: MenuGroup[] = [
  {
    title: "广场",
    items: [
      {
        key: "AppMarketplace",
        label: "应用广场",
        icon: AppWindow,
        href: "/app-marketplace",
      },
      {
        key: "SkillsPlaza",
        label: "技能广场",
        icon: Sparkles,
        href: "/skills-hub",
      },
      {
        key: "ToolMarketplace",
        label: "插件广场",
        icon: Puzzle,
        href: "/tool-marketplace",
      },
    ],
  },
  {
    title: "智能体开发",
    items: [
      {
        key: "ClawHubNext",
        label: "Claw",
        icon: Shrimp,
        href: "/claw-hub-next",
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
    title: "工具",
    items: [
      {
        key: "SkillsManagement",
        label: "技能管理",
        icon: Sparkles,
        href: "/skills-management",
      },
      {
        key: "MCPManagement",
        label: "MCP管理",
        icon: Network,
        href: "/mcp-management",
      },
      {
        key: "OpenAPI",
        label: "OpenAPI",
        icon: FileCode,
        href: "/openapi-management",
      },
      {
        key: "Workflow",
        label: "工作流",
        icon: Workflow,
        href: "/workflow",
      },
    ],
  },
  {
    title: "知识",
    items: [
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
    title: "业务管理",
    dividerTop: true,
    items: [
      {
        key: "ServiceMonitoring",
        label: "服务监控",
        icon: Activity,
        href: "/service-monitoring",
      },
      {
        key: "SpaceOperations",
        label: "空间运营",
        icon: Building2,
        href: "/space-operations",
      },
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
          <div
            key={group.title}
            className={cn("mb-6", group.dividerTop && "border-t border-gray-200 pt-6")}
          >
            <div className="mb-2 px-3 text-xs font-medium text-gray-500 tracking-wider">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                if (item.disabled) {
                  return (
                    <div
                      key={item.key}
                      className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-400"
                      title="正在集成中，敬请期待"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="min-w-0 flex-1">{item.label}</span>
                      <span className="shrink-0 text-xs text-gray-400">敬请期待</span>
                    </div>
                  );
                }
                const href = item.href!;
                const isActive =
                  pathname === href || pathname.startsWith(`${href}/`);
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
                      href={href}
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
                    href={href}
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
  const pathname = usePathname();
  const isClawDetailPage = pathname.startsWith("/claw-hub-next/claws/");
  const isSpaceOperationsPage = pathname.startsWith("/space-operations");
  /** 仅技能广场（/skills-hub、/skills）：灰蓝渐变壳底；其它路由不套广场背景 */
  const isSkillsPlazaPage =
    pathname.startsWith("/skills-hub") || pathname === "/skills";
  const isSkillsManagementPage = pathname.startsWith("/skills-management");

  if (isClawDetailPage) {
    return (
      <>
        <main className="h-screen min-h-0 overflow-hidden bg-slate-50">{children}</main>
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <>
      <GlobalHeader />
      <div
        className={cn(
          "flex h-screen overflow-hidden pt-[60px]",
          isSkillsPlazaPage
            ? "bg-[#e8f0fb]"
            : isSkillsManagementPage || isSpaceOperationsPage
              ? "bg-white"
              : "bg-slate-50"
        )}
      >
        {/* 左侧侧边栏: 固定宽度 220px, z-50 */}
        <aside className="w-[220px] flex-none z-50 border-r bg-white h-[calc(100vh-60px)] hidden md:block">
          <Sidebar />
        </aside>
        {/* 右侧主体: 自动填满剩余空间 */}
        <main
          className={cn(
            "relative flex h-[calc(100vh-60px)] min-h-0 flex-1 flex-col overflow-hidden",
            isSkillsPlazaPage && "bg-[#e8f0fb]",
            (isSkillsManagementPage || isSpaceOperationsPage) && "bg-white"
          )}
        >
          {/* 页面内容滚动区：广场页用渐变；skills 管理用白底 */}
          <div
            className={cn(
              "flex-1",
              isClawDetailPage ? "px-6 pt-6 pb-0" : "p-6",
              isSkillsPlazaPage &&
                "bg-[linear-gradient(180deg,#f2f7fd_0%,#e8f0fb_38%,#e4edf8_100%)]",
              (isSkillsManagementPage || isSpaceOperationsPage) && "bg-white",
              isClawDetailPage || isSpaceOperationsPage ? "min-h-0 overflow-hidden" : "overflow-y-auto"
            )}
          >
            {children}
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </>
  );
}
