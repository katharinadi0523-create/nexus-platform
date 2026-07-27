"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MY_CLAW_BRAND_ICON_SRC,
  MY_CLAW_BRAND_NAME,
  MY_CLAW_USER_DISPLAY_NAME,
} from "@/lib/mock/my-claw/branding";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalInboxNavItem } from "@/components/my-claw/project-conversation/global-inbox-nav-item";
import { MY_CLAW_SETTINGS_NAV } from "./nav-items";
import { SessionList } from "./session-list";
import { MyWorkNavItem } from "./my-work-nav-item";
import { ProjectChatList } from "./project-chat-list";

function isNavActive(pathname: string, href: string) {
  if (href === "/my-claw") {
    return pathname === "/my-claw" || pathname === "/my-claw/chat";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MyClawSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[272px] shrink-0 flex-col border-r border-[#e2e8f0] bg-white">
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={MY_CLAW_BRAND_ICON_SRC}
            alt={MY_CLAW_BRAND_NAME}
            width={36}
            height={36}
            className="h-9 w-9 object-cover"
            priority
          />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-slate-900">
            {MY_CLAW_BRAND_NAME}
          </div>
          <div className="truncate text-[11px] text-[#5a6779]">我的空间</div>
        </div>
      </div>

      <div className="space-y-0.5 px-2 pb-2">
        <GlobalInboxNavItem />
        <MyWorkNavItem />
      </div>

      <div className="mx-3 border-t border-[#eef2f6]" />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="px-3 pb-1 pt-3">
          <div className="px-0.5 text-[11px] font-medium text-[#5a6779]">
            个人 Chat
          </div>
        </div>
        <div className="max-h-[42%] min-h-0 overflow-hidden border-b border-[#eef2f6]">
          <SessionList />
        </div>

        <div className="px-3 pb-1 pt-3">
          <div className="px-0.5 text-[11px] font-medium text-[#5a6779]">
            Project Chat
          </div>
        </div>
        <ProjectChatList />
      </div>

      <div className="mt-auto border-t border-[#eef2f6] px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dbe7f4] text-xs font-semibold text-[#2f5fbf]">
            邸
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-slate-800">
              {MY_CLAW_USER_DISPLAY_NAME}
            </div>
            <div className="truncate text-[11px] text-[#5a6779]">我的空间</div>
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
