"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectConversation } from "./project-conversation-provider";

export function GlobalInboxNavItem() {
  const pathname = usePathname();
  const { unreadInboxCount } = useProjectConversation();
  const active =
    pathname === "/my-claw/inbox" || pathname.startsWith("/my-claw/inbox/");

  return (
    <Link
      href="/my-claw/inbox"
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
        active
          ? "bg-[#e8f0fb] text-[#2773ff]"
          : "text-slate-700 hover:bg-slate-50"
      )}
    >
      <Inbox
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-[#2773ff]" : "text-[#5a6779]"
        )}
      />
      <span className="min-w-0 flex-1 truncate">Inbox</span>
      {unreadInboxCount > 0 ? (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2773ff] px-1.5 text-[11px] font-semibold text-white">
          {unreadInboxCount > 99 ? "99+" : unreadInboxCount}
        </span>
      ) : null}
    </Link>
  );
}
