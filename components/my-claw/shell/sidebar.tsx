"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyClaw } from "@/components/my-claw/provider";
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
import {
  WorkContextSwitcher,
  getLastWorkspaceId,
  setLastWorkspaceId,
} from "@/components/my-claw/project-conversation/work-context-switcher";
import { GlobalInboxNavItem } from "@/components/my-claw/project-conversation/global-inbox-nav-item";
import { WorkspaceProjectList } from "@/components/my-claw/project-conversation/project-conversation-sidebar-nav";
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
  const [rememberedWorkspaceId, setRememberedWorkspaceId] = useState<
    string | null
  >(null);

  const projectMatch = pathname.match(
    /^\/my-claw\/workspaces\/([^/]+)\/projects\/([^/]+)/
  );
  const workspaceIdFromRoute = projectMatch?.[1] ?? null;
  const activeProjectId = projectMatch?.[2] ?? null;
  const isWorkspaceMode = Boolean(workspaceIdFromRoute);
  const isInboxMode =
    pathname === "/my-claw/inbox" || pathname.startsWith("/my-claw/inbox/");
  const isOrgMode = isWorkspaceMode || isInboxMode;
  const listWorkspaceId = workspaceIdFromRoute ?? rememberedWorkspaceId;

  useEffect(() => {
    if (workspaceIdFromRoute) {
      setRememberedWorkspaceId(workspaceIdFromRoute);
      setLastWorkspaceId(workspaceIdFromRoute);
      return;
    }
    if (isInboxMode) {
      setRememberedWorkspaceId(getLastWorkspaceId());
    }
  }, [isInboxMode, workspaceIdFromRoute]);

  return (
    <aside className="flex h-full w-[272px] shrink-0 flex-col border-r border-[#e2e8f0] bg-white">
      {/* Brand */}
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
          <div className="truncate text-[11px] text-[#5a6779]">
            {isOrgMode ? "组织协作工作台" : "个人智能工作台"}
          </div>
        </div>
      </div>

      {/* Space selector: 个人空间 / Workspace */}
      <div className="px-3 pb-2">
        <WorkContextSwitcher />
      </div>

      {/* Inbox */}
      <div className="px-2 pb-2">
        <GlobalInboxNavItem />
      </div>

      <div className="mx-3 border-t border-[#eef2f6]" />

      {isWorkspaceMode && listWorkspaceId ? (
        <WorkspaceProjectList
          workspaceId={listWorkspaceId}
          activeProjectId={activeProjectId}
        />
      ) : isInboxMode && listWorkspaceId ? (
        <WorkspaceProjectList
          workspaceId={listWorkspaceId}
          activeProjectId={null}
        />
      ) : isInboxMode ? (
        <div className="px-4 py-4 text-[12px] leading-5 text-[#5a6779]">
          从 Inbox 进入项目会话。也可通过上方空间选择器进入组织空间。
        </div>
      ) : (
        <>
          <div className="px-3 pt-3">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-[#e7ecf0] bg-[#f8f9fb] px-3 text-sm text-[#5a6779]">
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">搜索会话、技能、插件…</span>
            </div>
          </div>

          <nav className="space-y-0.5 px-2 py-3">
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
          <SessionList />
        </>
      )}

      <div className="mt-auto border-t border-[#eef2f6] px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dbe7f4] text-xs font-semibold text-[#2f5fbf]">
            邸
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-slate-800">
              {MY_CLAW_USER_DISPLAY_NAME}
            </div>
            <div className="truncate text-[11px] text-[#5a6779]">
              {isOrgMode ? "组织协作" : "个人空间"}
            </div>
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
