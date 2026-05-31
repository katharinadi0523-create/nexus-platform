"use client";

import { BarChart3, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  tooltip?: string;
  className?: string;
}

export function MetricCard({ label, value, tooltip, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm",
        className
      )}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-sm text-slate-600">{label}</span>
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-slate-400 hover:text-slate-600">
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56 text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        ) : (
          <HelpCircle className="h-3.5 w-3.5 text-slate-300" />
        )}
      </div>
      <div className="text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
    </div>
  );
}

interface MetricCardsGridProps {
  metrics: Array<{ label: string; value: string; tooltip?: string }>;
  columns?: 4 | 2;
}

export function MetricCardsGrid({ metrics, columns = 4 }: MetricCardsGridProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "grid gap-3",
          columns === 4 ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"
        )}
      >
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            tooltip={metric.tooltip}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}
