"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export function MyWorkNavItem() {
  const pathname = usePathname();
  const active =
    pathname === "/my-claw/work" || pathname.startsWith("/my-claw/work/");

  return (
    <Link
      href="/my-claw/work"
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
        active
          ? "bg-[#e8f0fb] text-[#2773ff]"
          : "text-slate-700 hover:bg-slate-50"
      )}
    >
      <Briefcase
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-[#2773ff]" : "text-[#5a6779]"
        )}
      />
      <span className="truncate">我的工作与项目</span>
    </Link>
  );
}
