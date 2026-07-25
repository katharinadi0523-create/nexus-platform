"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Settings, Shrimp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyClaw } from "@/components/my-claw/provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MY_CLAW_PRIMARY_NAV, MY_CLAW_SETTINGS_NAV } from "./nav-items";
import { SessionList } from "./session-list";

function isNavActive(pathname: string, href: string) {
  if (href === "/my-claw") {
    return pathname === "/my-claw" || pathname === "/my-claw/chat";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MyClawSidebar() {
  const pathname = usePathname();
  const { setActiveSession } = useMyClaw();

  return (
    <aside className="flex h-full w-[272px] shrink-0 flex-col border-r border-[#e2e8f0] bg-white">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2773ff] text-white shadow-sm shadow-[#2773ff]/25">
          <Shrimp className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-slate-900">
            我的Claw
          </div>
          <div className="truncate text-[11px] text-[#5a6779]">
            个人智能工作台
          </div>
        </div>
      </div>

      {/* Search placeholder */}
      <div className="px-3 pb-3">
        <div className="flex h-9 items-center gap-2 rounded-lg border border-[#e7ecf0] bg-[#f8f9fb] px-3 text-sm text-[#5a6779]">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">搜索会话、技能、插件…</span>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="space-y-0.5 px-2 pb-3">
        {MY_CLAW_PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => {
                if (item.key === "chat") {
                  setActiveSession(null);
                }
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-[#e8f0fb] text-[#2773ff]"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-[#2773ff]" : "text-[#5a6779]"
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 border-t border-[#eef2f6]" />

      {/* Sessions */}
      <SessionList />

      {/* Footer: avatar + settings */}
      <div className="mt-auto border-t border-[#eef2f6] px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dbe7f4] text-xs font-semibold text-[#2f5fbf]">
            RN
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-slate-800">
              若楠
            </div>
            <div className="truncate text-[11px] text-[#5a6779]">个人空间</div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="设置菜单"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5a6779] transition-colors hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2773ff]/40"
              >
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              {MY_CLAW_SETTINGS_NAV.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(pathname, item.href);
                return (
                  <DropdownMenuItem key={item.key} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "cursor-pointer",
                        active && "bg-[#e8f0fb] font-medium text-[#2773ff]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          active ? "text-[#2773ff]" : "text-[#5a6779]"
                        )}
                      />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
