"use client";

import { BarChart3, HelpCircle } from "lucide-react";
import type { MonitoringChart } from "@/lib/mock/service-monitoring";

interface MonitoringLineChartProps {
  chart: MonitoringChart;
}

function buildPath(
  values: number[],
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number },
  maxValue: number
): string {
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const stepX = values.length > 1 ? innerWidth / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = padding.left + index * stepX;
      const y = padding.top + innerHeight - (maxValue > 0 ? (value / maxValue) * innerHeight : 0);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export function MonitoringLineChart({ chart }: MonitoringLineChartProps) {
  const width = 520;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 28, left: 40 };
  const maxValue = Math.max(...chart.series.flatMap((series) => series.values), 1);
  const innerHeight = height - padding.top - padding.bottom;
  const gridLines = 4;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-1.5">
        <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-sm font-medium text-slate-700">{chart.title}</span>
        <HelpCircle className="h-3.5 w-3.5 text-slate-300" />
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-full" role="img">
          {Array.from({ length: gridLines + 1 }, (_, index) => {
            const y = padding.top + (innerHeight / gridLines) * index;
            const value = maxValue - (maxValue / gridLines) * index;
            return (
              <g key={index}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
                <text x={4} y={y + 4} fill="#94a3b8" fontSize={10}>
                  {chart.yAxisLabel && index === gridLines
                    ? `0${chart.yAxisLabel}`
                    : value >= 1000
                      ? `${Math.round(value / 1000)}k`
                      : Number.isInteger(value)
                        ? value
                        : value.toFixed(1)}
                  {chart.yAxisLabel && index !== gridLines ? chart.yAxisLabel : ""}
                </text>
              </g>
            );
          })}

          {chart.series.map((series) => (
            <path
              key={series.key}
              d={buildPath(series.values, width, height, padding, maxValue)}
              fill="none"
              stroke={series.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {chart.xLabels.map((label, index) => {
            const innerWidth = width - padding.left - padding.right;
            const stepX = chart.xLabels.length > 1 ? innerWidth / (chart.xLabels.length - 1) : 0;
            const x = padding.left + index * stepX;
            return (
              <text
                key={label}
                x={x}
                y={height - 8}
                fill="#94a3b8"
                fontSize={10}
                textAnchor={index === 0 ? "start" : index === chart.xLabels.length - 1 ? "end" : "middle"}
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        {chart.series.map((series) => (
          <div key={series.key} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            <span>{series.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
