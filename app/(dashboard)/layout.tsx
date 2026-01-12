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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface MenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: "Project Dev",
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
    title: "Resource",
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
    ],
  },
  {
    title: "Workspace",
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
    ],
  },
];

function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-0 h-screen w-60 bg-[#001529] text-white">
      <div className="flex h-full flex-col">
        {/* Logo/Title */}
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <h1 className="text-lg font-semibold">管理后台</h1>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          {menuGroups.map((group) => (
            <div key={group.title} className="mb-8">
              <div className="mb-3 px-3 text-xs font-medium text-white/60 uppercase tracking-wider">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

function Header() {
  const pathname = usePathname();

  // Generate breadcrumb from pathname
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Find menu item label
    const menuItem = menuGroups
      .flatMap((group) => group.items)
      .find((item) => item.href === href);

    return {
      href,
      label: menuItem?.label || label,
      isLast: index === pathSegments.length - 1,
    };
  });

  return (
    <header className="fixed left-60 right-0 top-0 z-10 h-16 border-b bg-white">
      <div className="flex h-full items-center px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">首页</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbItems.map((item, index) => (
              <div key={item.href} className="flex items-center">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {item.isLast ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="ml-60 flex-1">
          <Header />
          <main className="mt-16 p-6">{children}</main>
        </div>
      </div>
      <Toaster position="top-right" />
    </>
  );
}
