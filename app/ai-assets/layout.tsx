"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppWindow, Box, Puzzle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalHeader } from "@/components/layout/global-header";
import { Toaster } from "sonner";

const navItems = [
  {
    key: "app-marketplace",
    label: "应用广场",
    icon: AppWindow,
    href: "/ai-assets/app-marketplace",
  },
  {
    key: "model-marketplace",
    label: "模型广场",
    icon: Box,
    href: "/ai-assets/model-marketplace",
  },
  {
    key: "plugin-marketplace",
    label: "插件广场",
    icon: Puzzle,
    href: "/ai-assets/plugin-marketplace",
  },
];

export default function AIAssetsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <GlobalHeader />
      <div className="flex h-screen overflow-hidden bg-slate-50 pt-[60px]">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-gray-200 bg-white flex-shrink-0">
          <div className="p-4 h-[calc(100vh-60px)] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI资产库</h2>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.key} href={item.href} icon={Icon} label={item.label} />
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <Toaster position="top-right" />
    </>
  );
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  // 确保 Icon 组件存在
  if (!Icon) {
    return null;
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-blue-50 text-blue-600"
          : "text-gray-700 hover:bg-gray-50"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
