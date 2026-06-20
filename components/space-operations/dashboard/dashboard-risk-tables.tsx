import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MonitorStatusBadge,
  RiskLevelBadge,
} from "@/components/space-operations/dashboard/dashboard-badges";
import type {
  HighRiskAgentRow,
  RecentAnomalyEventRow,
} from "@/lib/mock/space-operations-dashboard";

interface DashboardRiskTablesProps {
  highRiskAgents: HighRiskAgentRow[];
  recentEvents: RecentAnomalyEventRow[];
}

function PanelTableShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm transition-shadow hover:shadow-md">
      <header className="border-b border-slate-100 px-4 py-3.5">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-sm text-[#5a6779]">{description}</p>
      </header>
      {children}
    </section>
  );
}

export function DashboardRiskTables({
  highRiskAgents,
  recentEvents,
}: DashboardRiskTablesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <PanelTableShell
        title="高风险智能体 TOP 5"
        description="按异常频次与风险等级排序，便于优先排查"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[140px]">智能体名称</TableHead>
              <TableHead className="min-w-[120px]">所属空间</TableHead>
              <TableHead>风险等级</TableHead>
              <TableHead className="text-right">异常次数</TableHead>
              <TableHead className="min-w-[130px]">最近异常时间</TableHead>
              <TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {highRiskAgents.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-default transition-colors hover:bg-[#f8f9fb]"
              >
                <TableCell className="font-medium text-slate-900">{row.name}</TableCell>
                <TableCell className="text-[#5a6779]">{row.space}</TableCell>
                <TableCell>
                  <RiskLevelBadge level={row.riskLevel} />
                </TableCell>
                <TableCell className="text-right tabular-nums text-slate-800">
                  {row.anomalyCount}
                </TableCell>
                <TableCell className="tabular-nums text-sm text-[#5a6779]">
                  {row.lastAnomalyAt}
                </TableCell>
                <TableCell>
                  <MonitorStatusBadge status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PanelTableShell>

      <PanelTableShell title="最近异常事件" description="最新行为异常记录与处置进展">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[130px]">时间</TableHead>
              <TableHead className="min-w-[120px]">智能体</TableHead>
              <TableHead className="min-w-[100px]">异常类型</TableHead>
              <TableHead className="min-w-[200px]">描述</TableHead>
              <TableHead>处置状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentEvents.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-default align-top transition-colors hover:bg-[#f8f9fb]"
              >
                <TableCell className="tabular-nums text-sm text-[#5a6779]">{row.time}</TableCell>
                <TableCell className="font-medium text-slate-900">{row.agentName}</TableCell>
                <TableCell>
                  <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {row.anomalyType}
                  </span>
                </TableCell>
                <TableCell className="max-w-[280px] text-sm leading-relaxed text-[#5a6779]">
                  {row.description}
                </TableCell>
                <TableCell>
                  <MonitorStatusBadge status={row.disposition} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PanelTableShell>
    </div>
  );
}
