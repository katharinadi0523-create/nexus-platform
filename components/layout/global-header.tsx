"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, AlertCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Platform navigation items
interface PlatformNavItem {
  key: string;
  label: string;
  href: string;
  external?: boolean;
}

const platformNavItems: PlatformNavItem[] = [
  { key: "ai-assets", label: "AI资产库", href: "/ai-assets" },
  { key: "procurement", label: "采购管理", href: "/procurement" },
  { key: "vision", label: "多模态视觉", href: "/vision" },
  { key: "app-dev", label: "应用开发", href: "/" },
  { key: "model-dev", label: "模型开发", href: "/model-dev/online-services" },
  { key: "data-gov", label: "多模态数据治理", href: "https://mdp.mydemo.top/", external: true },
  { key: "platform-mgmt", label: "平台管理", href: "https://aibase.andywork.top/organization", external: true },
];

export function GlobalHeader() {
  const pathname = usePathname();

  // Determine active platform based on pathname
  const getActivePlatform = () => {
    if (
      pathname === "/" ||
      pathname.startsWith("/agent") ||
      pathname.startsWith("/agent-editor") ||
      pathname.startsWith("/claw-hub-next") ||
      pathname.startsWith("/app-marketplace") ||
      pathname.startsWith("/skills") ||
      pathname.startsWith("/skills-hub") ||
      pathname.startsWith("/skills-management") ||
      pathname.startsWith("/mcp-management") ||
      pathname.startsWith("/openapi-management") ||
      pathname.startsWith("/tool-marketplace") ||
      pathname.startsWith("/workflow") ||
      pathname.startsWith("/knowledge-base") ||
      pathname.startsWith("/database") ||
      pathname.startsWith("/term-bank") ||
      pathname.startsWith("/space-operations") ||
      pathname.startsWith("/api-key") ||
      pathname.startsWith("/tag-management")
    ) {
      return "app-dev";
    }
    if (pathname.startsWith("/model-dev")) return "model-dev";
    if (pathname.startsWith("/data-gov")) return "data-gov";
    if (pathname.startsWith("/vision")) return "vision";
    if (pathname.startsWith("/ai-assets")) return "ai-assets";
    if (pathname.startsWith("/procurement")) return "procurement";
    if (pathname.startsWith("/platform-mgmt")) return "platform-mgmt";
    return "app-dev";
  };

  const activePlatform = getActivePlatform();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-white border-b border-gray-200">
      <div className="flex h-full items-center px-6 gap-6">
        {/* A. Branding Area */}
        <div className="flex items-center gap-2">
          <img 
            src="/icons/cecloud.png" 
            alt="中国电子云" 
            className="h-6 w-auto"
          />
          <span className="text-base font-semibold text-gray-900">中国电子云 | AI平台</span>
        </div>

        {/* B. Platform Navigation Menu */}
        <nav className="flex-1 flex items-center gap-1">
          {platformNavItems.map((item) => {
            const isActive = activePlatform === item.key;
            const linkClassName = cn(
              "px-4 py-2 text-sm font-medium transition-colors relative",
              isActive
                ? "text-blue-600 font-semibold"
                : "text-gray-600 hover:text-gray-900"
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
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </a>
              );
            }
            
            return (
              <Link
                key={item.key}
                href={item.href}
                className={linkClassName}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* C. Right Side Utilities */}
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <AlertCircle className="h-5 w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3 text-sm text-slate-700" side="bottom" align="end">
              INTERNAL PROTOTYPE - DEMO ONLY。部分功能仅作界面预览，实际能力以正式发布为准。
            </PopoverContent>
          </Popover>
          <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors" title="帮助手册">
            <HelpCircle className="h-5 w-5" />
          </button>
          <button className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors" title="用户">
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
