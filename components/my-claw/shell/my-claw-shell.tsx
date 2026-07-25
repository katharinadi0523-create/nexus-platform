"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MyClawSidebar } from "./sidebar";
import { cn } from "@/lib/utils";

interface MyClawShellProps {
  children: ReactNode;
}

/**
 * Fullscreen workbench shell: left nav + center content.
 * Chat right panel is rendered by the chat host later, not here.
 */
export function MyClawShell({ children }: MyClawShellProps) {
  const pathname = usePathname();
  const isAgentsPlaza = pathname.startsWith("/my-claw/agents");

  return (
    <div className="flex h-full w-full overflow-hidden">
      <MyClawSidebar />
      <main
        className={cn(
          "relative flex min-w-0 flex-1 flex-col overflow-hidden",
          isAgentsPlaza ? "bg-[#e8f0fb]" : "bg-[#f8f9fb]"
        )}
      >
        {children}
      </main>
    </div>
  );
}
