"use client";

import { useState } from "react";
import { AlertTriangle, CircleX } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface CompatibilityIndicatorProps {
  status: "limited" | "unsupported" | "unknown";
  shortLabel: string;
  tooltip: string;
  className?: string;
}

export function CompatibilityIndicator({
  status,
  shortLabel,
  tooltip,
  className,
}: CompatibilityIndicatorProps) {
  const [open, setOpen] = useState(false);

  if (!shortLabel) return null;

  const visual =
    status === "unsupported"
      ? {
          wrap: "bg-red-50 text-red-700 border-red-200",
          icon: <CircleX className="h-3.5 w-3.5" />,
        }
      : status === "limited"
        ? {
            wrap: "bg-amber-50 text-amber-700 border-amber-200",
            icon: <AlertTriangle className="h-3.5 w-3.5" />,
          }
        : {
            wrap: "bg-slate-50 text-slate-600 border-slate-200",
            icon: <span className="text-[12px] leading-none">?</span>,
          };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-none cursor-help select-none",
            visual.wrap,
            className
          )}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          role="img"
          aria-label={tooltip}
        >
          {visual.icon}
          <span>{shortLabel}</span>
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-3 text-xs text-slate-700"
        side="top"
        align="start"
        sideOffset={8}
      >
        {tooltip}
      </PopoverContent>
    </Popover>
  );
}

