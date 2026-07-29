"use client";

import { useEffect, useRef, useState } from "react";
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
import { ProjectList } from "./project-list";

function isNavActive(pathname: string, href: string) {
  if (href === "/my-claw") {
    return pathname === "/my-claw" || pathname === "/my-claw/chat";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MyClawSidebar() {
  const pathname = usePathname();
  const splitAreaRef = useRef<HTMLDivElement>(null);
  const [personalPaneHeight, setPersonalPaneHeight] = useState(240);
  const [isResizingPanes, setIsResizingPanes] = useState(false);

  useEffect(() => {
    if (!isResizingPanes) return undefined;

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const handlePointerMove = (event: PointerEvent) => {
      const splitArea = splitAreaRef.current;
      if (!splitArea) return;

      const rect = splitArea.getBoundingClientRect();
      const minPersonalHeight = 120;
      const maxPersonalHeight = Math.max(minPersonalHeight, rect.height - 160);
      setPersonalPaneHeight(
        Math.min(
          Math.max(event.clientY - rect.top, minPersonalHeight),
          maxPersonalHeight,
        ),
      );
    };
    const handlePointerUp = () => setIsResizingPanes(false);

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizingPanes]);

  const resizePersonalPane = (delta: number) => {
    const splitArea = splitAreaRef.current;
    if (!splitArea) return;
    const minPersonalHeight = 120;
    const maxPersonalHeight = Math.max(
      minPersonalHeight,
      splitArea.clientHeight - 160,
    );
    setPersonalPaneHeight((current) =>
      Math.min(Math.max(current + delta, minPersonalHeight), maxPersonalHeight),
    );
  };

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

      <div
        ref={splitAreaRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <section
          className="flex min-h-0 shrink-0 flex-col overflow-hidden"
          style={{ height: personalPaneHeight }}
        >
          <div className="shrink-0 px-3 pb-1 pt-3">
            <div className="px-0.5 text-[11px] font-medium text-[#5a6779]">
              个人 Chat
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <SessionList />
          </div>
        </section>

        <div
          role="separator"
          aria-label="调整个人 Chat 与 Project 的高度"
          aria-orientation="horizontal"
          tabIndex={0}
          onPointerDown={(event) => {
            event.preventDefault();
            setIsResizingPanes(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") {
              event.preventDefault();
              resizePersonalPane(-16);
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              resizePersonalPane(16);
            }
          }}
          className="group relative flex h-2 shrink-0 cursor-row-resize items-center justify-center focus-visible:outline-none"
        >
          <span className="h-px w-full bg-[#eef2f6] transition-colors group-hover:bg-[#b9d0f7] group-focus-visible:bg-[#2773ff]" />
        </div>

        <section className="flex min-h-[160px] min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 px-3 pb-1 pt-3">
            <div className="px-0.5 text-[11px] font-medium text-[#5a6779]">
              Project
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ProjectList />
          </div>
        </section>
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
                        active && "bg-[#e8f0fb] font-medium text-[#2773ff]",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          active ? "text-[#2773ff]" : "text-[#5a6779]",
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
