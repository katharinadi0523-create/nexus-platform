import { type ReactNode } from "react";
import Link from "next/link";
import { Cloud, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const CLAW_HUB_TABS = [
  {
    value: "mine",
    label: "我的 Claw",
    href: "/claw-hub?tab=mine",
    icon: Monitor,
  },
  {
    value: "cloud",
    label: "云端 Claw",
    href: "/claw-hub",
    icon: Cloud,
  },
] as const;

export function ClawHubShell({
  activeTab,
  children,
}: {
  activeTab: "cloud" | "mine";
  children: ReactNode;
}) {
  return (
    <div className="space-y-5 pb-10">
      <section className="flex items-center">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          {CLAW_HUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <Link
                key={tab.value}
                href={tab.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sky-50 text-sky-900 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-sky-700" : "text-slate-500")} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {children}
    </div>
  );
}
