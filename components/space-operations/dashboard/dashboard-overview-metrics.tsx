"use client";

import { Activity, AlertTriangle, Bot, Clock, HelpCircle, PhoneCall, Wrench } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  DashboardOverviewMetric,
  TrendDirection,
} from "@/lib/mock/space-operations-dashboard";

const METRIC_ICONS: Record<string, typeof Bot> = {
  "total-agents": Bot,
  "running-agents": Activity,
  "today-calls": PhoneCall,
  "today-anomalies": AlertTriangle,
  "tool-failure-rate": Wrench,
  "avg-latency": Clock,
};

function trendClass(direction: TrendDirection, invertSentiment?: boolean) {
  const good = invertSentiment ? direction === "down" : direction === "up";
  const bad = invertSentiment ? direction === "up" : direction === "down";
  if (good) return "text-emerald-600";
  if (bad) return direction === "up" && invertSentiment ? "text-red-600" : "text-[#2773ff]";
  return "text-[#5a6779]";
}

interface DashboardOverviewMetricsProps {
  metrics: DashboardOverviewMetric[];
}

export function DashboardOverviewMetrics({ metrics }: DashboardOverviewMetricsProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {metrics.map((metric) => {
          const Icon = METRIC_ICONS[metric.key] ?? Bot;
          const valueColor =
            metric.emphasis === "critical"
              ? "text-red-600"
              : metric.emphasis === "warn"
                ? "text-amber-700"
                : "text-slate-900";

          return (
            <div
              key={metric.key}
              className="group rounded-lg border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm transition-[box-shadow,background-color] hover:bg-[#fafbfc] hover:shadow-md"
            >
              <div className="mb-2.5 flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-[#2773ff]/80" />
                <span className="text-sm text-[#5a6779]">{metric.label}</span>
                {metric.tooltip ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-slate-300 transition-colors hover:text-slate-500"
                        aria-label={`${metric.label}说明`}
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-56 text-xs">
                      {metric.tooltip}
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
              <div className={cn("text-2xl font-semibold tracking-tight", valueColor)}>
                {metric.value}
              </div>
              {metric.trend ? (
                <p
                  className={cn(
                    "mt-1.5 text-xs",
                    trendClass(metric.trend.direction, metric.trend.invertSentiment)
                  )}
                >
                  {metric.trend.label}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
