"use client";

import { MonitoringLineChart } from "@/components/service-monitoring/monitoring-line-chart";
import { DashboardAnomalyPanel } from "@/components/space-operations/dashboard/dashboard-anomaly-panel";
import { DashboardOverviewMetrics } from "@/components/space-operations/dashboard/dashboard-overview-metrics";
import { DashboardRiskTables } from "@/components/space-operations/dashboard/dashboard-risk-tables";
import { DashboardRunStatusPanel } from "@/components/space-operations/dashboard/dashboard-run-status-panel";
import { SPACE_OPERATIONS_DASHBOARD_MOCK } from "@/lib/mock/space-operations-dashboard";

export function SpaceOperationsDashboardWorkbench() {
  const data = SPACE_OPERATIONS_DASHBOARD_MOCK;

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 pb-6">
      <section aria-labelledby="dashboard-overview-heading">
        <h2 id="dashboard-overview-heading" className="sr-only">
          核心指标概览
        </h2>
        <DashboardOverviewMetrics metrics={data.overviewMetrics} />
      </section>

      <section aria-labelledby="dashboard-runtime-heading" className="space-y-3">
        <div>
          <h2
            id="dashboard-runtime-heading"
            className="text-base font-semibold text-slate-900"
          >
            运行态势
          </h2>
          <p className="mt-0.5 text-sm text-[#5a6779]">
            智能体状态分布与近 24 小时调用、异常、失败率走势
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <DashboardRunStatusPanel slices={data.runStatusDistribution} />
          </div>
          <div className="lg:col-span-3">
            <MonitoringLineChart chart={data.runTrendChart} />
          </div>
        </div>
      </section>

      <section aria-labelledby="dashboard-anomaly-heading">
        <h2 id="dashboard-anomaly-heading" className="sr-only">
          异常监测
        </h2>
        <DashboardAnomalyPanel stats={data.anomalyStats} />
      </section>

      <section aria-labelledby="dashboard-risk-heading" className="space-y-3">
        <div>
          <h2 id="dashboard-risk-heading" className="text-base font-semibold text-slate-900">
            风险列表
          </h2>
          <p className="mt-0.5 text-sm text-[#5a6779]">
            高风险智能体优先排查与最新异常事件追踪
          </p>
        </div>
        <DashboardRiskTables
          highRiskAgents={data.highRiskAgents}
          recentEvents={data.recentAnomalyEvents}
        />
      </section>
    </div>
  );
}
