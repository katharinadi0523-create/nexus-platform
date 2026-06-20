import { cn } from "@/lib/utils";
import type { AgentRunStatusSlice } from "@/lib/mock/space-operations-dashboard";

interface DashboardRunStatusPanelProps {
  slices: AgentRunStatusSlice[];
}

export function DashboardRunStatusPanel({ slices }: DashboardRunStatusPanelProps) {
  const total = slices.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="flex h-full flex-col rounded-lg border border-slate-200/90 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <header className="mb-4 shrink-0">
        <h2 className="text-base font-semibold text-slate-900">智能体运行状态分布</h2>
        <p className="mt-0.5 text-sm text-[#5a6779]">当前空间内各状态智能体数量占比</p>
      </header>

      <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
        {slices.map((slice) => (
          <div
            key={slice.status}
            className="h-full transition-[width] duration-300"
            style={{
              width: total > 0 ? `${(slice.count / total) * 100}%` : "0%",
              backgroundColor: slice.color,
            }}
            title={`${slice.status} ${slice.count}`}
          />
        ))}
      </div>

      <ul className="space-y-3">
        {slices.map((slice) => {
          const pct = total > 0 ? Math.round((slice.count / total) * 100) : 0;
          return (
            <li key={slice.status}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-700">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.color }}
                    aria-hidden
                  />
                  {slice.status}
                </span>
                <span className="tabular-nums text-slate-900">
                  {slice.count}
                  <span className="ml-1 text-[#5a6779]">({pct}%)</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full transition-[width]")}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: slice.color,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-auto pt-4 text-xs text-[#5a6779]">
        合计 <span className="font-medium text-slate-800">{total}</span> 个智能体
      </p>
    </section>
  );
}
