import { ShieldAlert, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnomalyTypeStat, TrendDirection } from "@/lib/mock/space-operations-dashboard";
import { RiskLevelBadge } from "@/components/space-operations/dashboard/dashboard-badges";

function TrendIcon({ direction }: { direction: TrendDirection }) {
  if (direction === "up") {
    return <TrendingUp className="h-3.5 w-3.5 text-red-500" aria-hidden />;
  }
  if (direction === "down") {
    return <TrendingDown className="h-3.5 w-3.5 text-[#2773ff]" aria-hidden />;
  }
  return <Minus className="h-3.5 w-3.5 text-slate-400" aria-hidden />;
}

function trendTextClass(direction: TrendDirection) {
  if (direction === "up") return "text-red-600";
  if (direction === "down") return "text-[#2773ff]";
  return "text-[#5a6779]";
}

interface DashboardAnomalyPanelProps {
  stats: AnomalyTypeStat[];
}

export function DashboardAnomalyPanel({ stats }: DashboardAnomalyPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200/90 bg-white shadow-sm transition-shadow hover:shadow-md">
      <header className="border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#2773ff]" aria-hidden />
              <h2 className="text-base font-semibold text-slate-900">Agent 行为异常检测</h2>
            </div>
            <p className="mt-0.5 text-sm text-[#5a6779]">
              按异常类型汇总今日命中次数、风险等级与较昨日变化
            </p>
          </div>
          <span className="rounded-md bg-[#f8f9fb] px-2.5 py-1 text-xs text-[#5a6779]">
            监测窗口：近 24 小时
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.id}
            className="group px-4 py-4 transition-colors hover:bg-[#fafbfc] sm:px-5"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium text-slate-800">{stat.type}</h3>
              <RiskLevelBadge level={stat.riskLevel} />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
              {stat.count}
              <span className="ml-1 text-sm font-normal text-[#5a6779]">次</span>
            </p>
            <p
              className={cn(
                "mt-2 flex items-center gap-1 text-xs",
                trendTextClass(stat.trend.direction)
              )}
            >
              <TrendIcon direction={stat.trend.direction} />
              {stat.trend.label}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
