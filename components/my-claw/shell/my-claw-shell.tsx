"use client";

import type { ReactNode } from "react";
import { MyClawSidebar } from "./sidebar";

interface MyClawShellProps {
  children: ReactNode;
}

/**
 * Fullscreen workbench shell: left nav + center content.
 * Chat right panel is rendered by the chat host later, not here.
 */
export function MyClawShell({ children }: MyClawShellProps) {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <MyClawSidebar />
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f8f9fb]">
        {children}
      </main>
    </div>
  );
}
