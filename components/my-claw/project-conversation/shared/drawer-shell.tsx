"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DrawerShellProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Right-side drawer:
 * - Desktop (>=1280): flex sibling, width 460px, compresses conversation
 * - Narrow: overlay on conversation with close
 */
export function DrawerShell({
  title,
  onClose,
  children,
  footer,
  className,
}: DrawerShellProps) {
  return (
    <>
      {/* Narrow overlay backdrop */}
      <button
        type="button"
        aria-label="关闭抽屉"
        onClick={onClose}
        className="absolute inset-0 z-20 bg-slate-900/20 xl:hidden"
      />

      <aside
        className={cn(
          "z-30 flex h-full w-full max-w-[460px] flex-col border-l border-[#e2e8f0] bg-white shadow-sm",
          "absolute inset-y-0 right-0 xl:static xl:shadow-none",
          className
        )}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#eef2f6] px-4">
          <h2 className="truncate text-[15px] font-semibold text-slate-900">
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="关闭"
            className="text-[#5a6779] hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {children}
        </div>

        {footer ? (
          <footer className="shrink-0 border-t border-[#eef2f6] px-4 py-3">
            {footer}
          </footer>
        ) : null}
      </aside>
    </>
  );
}
