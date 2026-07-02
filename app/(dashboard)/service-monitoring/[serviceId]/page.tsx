"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { MetricCardsGrid } from "@/components/service-monitoring/metric-card";
import { MonitoringLineChart } from "@/components/service-monitoring/monitoring-line-chart";
import { TimeRangeToolbar } from "@/components/service-monitoring/time-range-toolbar";
import {
  getServiceMonitoringDetail,
  type TimeRangePreset,
} from "@/lib/mock/service-monitoring";

const CHANNEL_OPTIONS = [
  { value: "all", label: "全部渠道" },
  { value: "api", label: "Api" },
  { value: "preview", label: "Preview" },
];

export default function ServiceMonitoringDetailPage() {
  const params = useParams<{ serviceId: string }>();
  const serviceId = params.serviceId;
  const [timePreset, setTimePreset] = useState<TimeRangePreset>("7d");
  const [selectedChannel, setSelectedChannel] = useState("all");

  const detail = useMemo(() => getServiceMonitoringDetail(serviceId), [serviceId]);

  const filteredChannels = useMemo(() => {
    if (!detail) return [];
    if (selectedChannel === "all") return detail.channels;
    return detail.channels.filter(
      (channel) => channel.channelName.toLowerCase() === selectedChannel
    );
  }, [detail, selectedChannel]);

  if (!detail) {
    return (
      <div className="space-y-4">
        <Link
          href="/service-monitoring"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回服务监控
        </Link>
        <div className="rounded-lg border bg-white p-8 text-center text-slate-500">
          未找到该服务的监控数据
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/service-monitoring"
              className="inline-flex items-center gap-1 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              服务监控
            </Link>
            <span>/</span>
            <span className="text-slate-700">{detail.name}</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">监控详情</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedChannel}
            onValueChange={setSelectedChannel}
            options={CHANNEL_OPTIONS}
            placeholder="请选择渠道"
            className="w-40"
          />
          <TimeRangeToolbar preset={timePreset} onPresetChange={setTimePreset} />
        </div>
      </div>

      <MetricCardsGrid metrics={detail.summaryMetrics} />

      <div className="overflow-hidden rounded-md border bg-white">
        <div className="border-b px-4 py-3 text-sm font-medium text-slate-700">
          渠道运行概览
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="min-w-[120px] align-middle">
                渠道名称
              </TableHead>
              <TableHead colSpan={2} className="border-l text-center">
                流量规模
              </TableHead>
              <TableHead rowSpan={2} className="border-l min-w-[110px] align-middle text-center">
                累计用户数
              </TableHead>
              <TableHead colSpan={2} className="border-l text-center">
                服务稳定性 (SLA)
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="border-l text-center">总调用量</TableHead>
              <TableHead className="text-center">对话量</TableHead>
              <TableHead className="border-l text-center">平均响应时长</TableHead>
              <TableHead className="text-center">响应成功率</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChannels.map((channel) => (
              <TableRow key={channel.channelName}>
                <TableCell>{channel.channelName}</TableCell>
                <TableCell className="border-l text-center">{channel.totalCalls}</TableCell>
                <TableCell className="text-center">{channel.conversationVolume}</TableCell>
                <TableCell className="border-l text-center">{channel.cumulativeUsers}</TableCell>
                <TableCell className="border-l text-center">
                  {channel.avgResponseTime.toFixed(2)}s
                </TableCell>
                <TableCell className="text-center">
                  {channel.responseSuccessRate.toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {detail.charts.slice(0, 3).map((chart) => (
          <MonitoringLineChart key={chart.id} chart={chart} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {detail.charts.slice(3).map((chart) => (
          <MonitoringLineChart key={chart.id} chart={chart} />
        ))}
      </div>
    </div>
  );
}
