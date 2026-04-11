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
  PanelLeft,
  Sparkles,
  Shrimp,
  Building2,
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
  dividerTop?: boolean;
}

const menuGroups: MenuGroup[] = [
  {
    title: "AI资产库",
    items: [
      {
        key: "AppMarketplace",
        label: "应用广场",
        icon: AppWindow,
        href: "/app-marketplace",
      },
      {
        key: "SkillsHub",
        label: "SkillsHub",
        icon: Sparkles,
        href: "/skills-hub",
      },
    ],
  },
  {
    title: "应用管理",
    items: [
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
        key: "ClawHubNext",
        label: "Claw管理",
        icon: Shrimp,
        href: "/claw-hub-next",
      },
      {
        key: "SkillsManagement",
        label: "SKILLS管理",
        icon: PanelLeft,
        href: "/skills-management",
      },
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
    title: "业务管理",
    dividerTop: true,
    items: [
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
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
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
  const pathname = usePathname();
  const isClawDetailPage = pathname.startsWith("/claw-hub-next/claws/");
  const isSpaceOperationsPage = pathname.startsWith("/space-operations");
  /** 仅技能广场（/skills-hub、/skills）：灰蓝渐变壳底；其它路由不套广场背景 */
  const isSkillsPlazaPage =
    pathname.startsWith("/skills-hub") || pathname === "/skills";
  const isSkillsManagementPage = pathname.startsWith("/skills-management");

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
              "flex-1 p-6",
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
