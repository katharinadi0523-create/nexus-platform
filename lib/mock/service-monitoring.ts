export type ServiceType = "智能体" | "工作流" | "插件";
export type AuthMethod = "Session" | "ApiKey";

export interface ServiceMonitoringItem {
  id: string;
  name: string;
  description: string;
  type: ServiceType;
  authMethod: AuthMethod;
  totalCalls: number;
  totalTokens: number;
  successCalls: number;
  failedCalls: number;
  failureRate: number;
}

export interface MonitoringMetric {
  label: string;
  value: string;
  tooltip?: string;
}

export interface ChannelOverviewRow {
  channelName: string;
  totalCalls: number;
  conversationVolume: number;
  cumulativeUsers: number;
  avgResponseTime: number;
  responseSuccessRate: number;
}

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

export interface MonitoringChart {
  id: string;
  title: string;
  yAxisLabel?: string;
  xLabels: string[];
  series: ChartSeries[];
}

export interface ServiceMonitoringDetail {
  id: string;
  name: string;
  summaryMetrics: MonitoringMetric[];
  channels: ChannelOverviewRow[];
  charts: MonitoringChart[];
}

export interface ServiceMonitoringOverview {
  metrics: MonitoringMetric[];
  services: ServiceMonitoringItem[];
}

const CHART_X_LABELS = [
  "05-21 09:30",
  "05-21 18:00",
  "05-22 12:00",
  "05-23 09:30",
  "05-24 15:00",
  "05-25 10:00",
  "05-26 14:00",
  "05-27 14:00",
];

function createPeakSeries(
  key: string,
  label: string,
  color: string,
  base: number,
  peak1: number,
  peak2: number
): ChartSeries {
  return {
    key,
    label,
    color,
    values: [base, peak1 * 0.3, peak1, base * 0.5, peak2, peak2 * 0.8, base, base * 0.2],
  };
}

export const SERVICE_MONITORING_OVERVIEW: ServiceMonitoringOverview = {
  metrics: [
    { label: "总调用量", value: "270", tooltip: "选定时间范围内的服务调用总次数" },
    { label: "服务发布量", value: "35", tooltip: "当前已发布的服务数量" },
    { label: "总消耗Token", value: "1,942,459", tooltip: "选定时间范围内的 Token 消耗总量" },
    { label: "失败率", value: "20%", tooltip: "调用失败次数 / 总调用次数" },
    { label: "首包时延 (平均值)", value: "13.44秒", tooltip: "首包响应时延的平均值" },
    { label: "首包时延 (P50)", value: "10.22秒", tooltip: "首包响应时延的 P50 分位值" },
    { label: "首包时延 (P95)", value: "33.54秒", tooltip: "首包响应时延的 P95 分位值" },
    { label: "首包时延 (P99)", value: "1.06分钟", tooltip: "首包响应时延的 P99 分位值" },
  ],
  services: [
    {
      id: "demo-terminology",
      name: "1.3上线能力演示 - 有术语库",
      description: "记忆、本体、术语库效果演示",
      type: "智能体",
      authMethod: "Session",
      totalCalls: 3,
      totalTokens: 76820,
      successCalls: 3,
      failedCalls: 0,
      failureRate: 0,
    },
    {
      id: "official-document-writing",
      name: "公文写作",
      description: "面向政务场景的公文起草与润色助手",
      type: "智能体",
      authMethod: "Session",
      totalCalls: 16,
      totalTokens: 83065,
      successCalls: 15,
      failedCalls: 1,
      failureRate: 6.25,
    },
    {
      id: "appforge-customer-service",
      name: "AppForge客服助手",
      description: "面向企业客服场景的多轮对话智能体",
      type: "智能体",
      authMethod: "ApiKey",
      totalCalls: 42,
      totalTokens: 312400,
      successCalls: 38,
      failedCalls: 4,
      failureRate: 9.52,
    },
    {
      id: "research-assistant",
      name: "科研文献助手",
      description: "科研文献检索、摘要与引用整理",
      type: "智能体",
      authMethod: "Session",
      totalCalls: 28,
      totalTokens: 198600,
      successCalls: 25,
      failedCalls: 3,
      failureRate: 10.71,
    },
    {
      id: "medical-qa",
      name: "医疗问答助手",
      description: "医疗知识问答与风险提示",
      type: "智能体",
      authMethod: "ApiKey",
      totalCalls: 19,
      totalTokens: 145200,
      successCalls: 17,
      failedCalls: 2,
      failureRate: 10.53,
    },
    {
      id: "finance-report",
      name: "财报分析助手",
      description: "上市公司财报解读与指标对比",
      type: "智能体",
      authMethod: "ApiKey",
      totalCalls: 11,
      totalTokens: 98400,
      successCalls: 10,
      failedCalls: 1,
      failureRate: 9.09,
    },
    {
      id: "contract-review",
      name: "合同审查助手",
      description: "合同条款风险识别与修改建议",
      type: "智能体",
      authMethod: "Session",
      totalCalls: 8,
      totalTokens: 67200,
      successCalls: 7,
      failedCalls: 1,
      failureRate: 12.5,
    },
    {
      id: "code-review",
      name: "代码审查助手",
      description: "代码质量检查与安全漏洞扫描",
      type: "智能体",
      authMethod: "ApiKey",
      totalCalls: 24,
      totalTokens: 176800,
      successCalls: 21,
      failedCalls: 3,
      failureRate: 12.5,
    },
    {
      id: "knowledge-qa",
      name: "企业知识库问答",
      description: "基于企业知识库的内部问答服务",
      type: "智能体",
      authMethod: "Session",
      totalCalls: 35,
      totalTokens: 256300,
      successCalls: 32,
      failedCalls: 3,
      failureRate: 8.57,
    },
    {
      id: "workflow-demo",
      name: "审批流自动化演示",
      description: "多节点审批流编排与执行演示",
      type: "工作流",
      authMethod: "ApiKey",
      totalCalls: 6,
      totalTokens: 45200,
      successCalls: 5,
      failedCalls: 1,
      failureRate: 16.67,
    },
    ...Array.from({ length: 35 }, (_, index) => {
      const id = `service-${index + 11}`;
      const totalCalls = 5 + ((index * 7) % 40);
      const failedCalls = index % 5 === 0 ? Math.max(1, Math.floor(totalCalls * 0.2)) : 0;
      const successCalls = totalCalls - failedCalls;
      return {
        id,
        name: `演示服务 ${index + 11}`,
        description: `用于服务监控 Mock 展示的第 ${index + 11} 个示例服务`,
        type: (index % 4 === 0 ? "工作流" : "智能体") as ServiceType,
        authMethod: (index % 3 === 0 ? "ApiKey" : "Session") as AuthMethod,
        totalCalls,
        totalTokens: totalCalls * (4200 + (index % 6) * 800),
        successCalls,
        failedCalls,
        failureRate: totalCalls > 0 ? Number(((failedCalls / totalCalls) * 100).toFixed(2)) : 0,
      };
    }),
  ],
};

const DEFAULT_DETAIL_CHARTS: MonitoringChart[] = [
  {
    id: "calls-sessions",
    title: "总调用量和有效会话量",
    xLabels: CHART_X_LABELS,
    series: [
      createPeakSeries("totalCalls", "总调用量", "#2773ff", 0, 6, 5),
      createPeakSeries("effectiveSessions", "有效会话量", "#7c5cfc", 0, 6, 5),
    ],
  },
  {
    id: "token-consumption",
    title: "总token消耗",
    xLabels: CHART_X_LABELS,
    series: [
      createPeakSeries("inputTokens", "输入token", "#2773ff", 0, 24000, 20000),
      createPeakSeries("outputTokens", "输出token", "#7c5cfc", 0, 8000, 6500),
    ],
  },
  {
    id: "tpm",
    title: "TPM (每日峰值)",
    xLabels: CHART_X_LABELS,
    series: [createPeakSeries("tpm", "TPM", "#2773ff", 0, 5, 4)],
  },
  {
    id: "latency-quantile",
    title: "全流程耗时均值分位图",
    yAxisLabel: "秒",
    xLabels: CHART_X_LABELS,
    series: [
      { key: "avg", label: "AVG", color: "#2773ff", values: [10, 9, 8.5, 7.8, 8.2, 7.5, 6.8, 4] },
      { key: "p50", label: "P50", color: "#7c5cfc", values: [9.5, 8.8, 8, 7.2, 7.8, 7, 6.2, 3.5] },
      { key: "p90", label: "P90", color: "#22c55e", values: [11, 10.2, 9.5, 8.8, 9.2, 8.5, 7.8, 5] },
      { key: "p99", label: "P99", color: "#ec4899", values: [12, 11.5, 10.8, 10, 10.5, 9.8, 9, 6] },
    ],
  },
  {
    id: "agent-performance",
    title: "Agent生成性能",
    yAxisLabel: "秒",
    xLabels: CHART_X_LABELS,
    series: [
      { key: "nonFirstPacket", label: "非首包时延均值", color: "#2773ff", values: [35, 32, 28, 25, 30, 22, 20, 18] },
      { key: "firstPacket", label: "首包时延均值", color: "#7c5cfc", values: [8, 7.5, 7, 6.5, 6.8, 6.2, 5.8, 5] },
    ],
  },
];

export const SERVICE_MONITORING_DETAILS: Record<string, ServiceMonitoringDetail> = {
  "official-document-writing": {
    id: "official-document-writing",
    name: "公文写作",
    summaryMetrics: [
      { label: "累积用户数", value: "3" },
      { label: "总调用量", value: "16" },
      { label: "总消耗Token", value: "83,065" },
      { label: "平均响应成功率", value: "93.75%" },
      { label: "有效对话量", value: "16" },
      { label: "全流程耗时均值", value: "26.42s" },
      { label: "消耗token均值", value: "5,537.67" },
      { label: "首包时延 (平均值)", value: "6.19s" },
    ],
    channels: [
      {
        channelName: "Api",
        totalCalls: 14,
        conversationVolume: 14,
        cumulativeUsers: 1,
        avgResponseTime: 26.05,
        responseSuccessRate: 92.85,
      },
      {
        channelName: "Preview",
        totalCalls: 2,
        conversationVolume: 2,
        cumulativeUsers: 1,
        avgResponseTime: 21.7,
        responseSuccessRate: 100,
      },
    ],
    charts: DEFAULT_DETAIL_CHARTS,
  },
};

export function getServiceMonitoringDetail(serviceId: string): ServiceMonitoringDetail | null {
  if (SERVICE_MONITORING_DETAILS[serviceId]) {
    return SERVICE_MONITORING_DETAILS[serviceId];
  }

  const service = SERVICE_MONITORING_OVERVIEW.services.find((item) => item.id === serviceId);
  if (!service) {
    return null;
  }

  const successRate =
    service.totalCalls > 0
      ? ((service.successCalls / service.totalCalls) * 100).toFixed(2)
      : "0.00";

  return {
    id: service.id,
    name: service.name,
    summaryMetrics: [
      { label: "累积用户数", value: String(Math.max(1, Math.floor(service.totalCalls / 4))) },
      { label: "总调用量", value: String(service.totalCalls) },
      { label: "总消耗Token", value: service.totalTokens.toLocaleString() },
      { label: "平均响应成功率", value: `${successRate}%` },
      { label: "有效对话量", value: String(service.successCalls) },
      { label: "全流程耗时均值", value: `${(18 + (service.totalCalls % 12)).toFixed(2)}s` },
      {
        label: "消耗token均值",
        value: service.totalCalls > 0
          ? (service.totalTokens / service.totalCalls).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })
          : "0",
      },
      { label: "首包时延 (平均值)", value: `${(5 + (service.totalCalls % 8)).toFixed(2)}s` },
    ],
    channels: [
      {
        channelName: "Api",
        totalCalls: Math.max(1, service.totalCalls - 2),
        conversationVolume: Math.max(1, service.totalCalls - 2),
        cumulativeUsers: Math.max(1, Math.floor(service.totalCalls / 5)),
        avgResponseTime: 20 + (service.totalCalls % 10),
        responseSuccessRate: Number(successRate),
      },
      {
        channelName: "Preview",
        totalCalls: Math.min(2, service.totalCalls),
        conversationVolume: Math.min(2, service.totalCalls),
        cumulativeUsers: 1,
        avgResponseTime: 18 + (service.totalCalls % 6),
        responseSuccessRate: 100,
      },
    ],
    charts: DEFAULT_DETAIL_CHARTS,
  };
}

export function formatFailureRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

export const TIME_RANGE_PRESETS = [
  { key: "1m", label: "近1分钟" },
  { key: "5m", label: "近5分钟" },
  { key: "1d", label: "近1天" },
  { key: "7d", label: "近7天" },
] as const;

export type TimeRangePreset = (typeof TIME_RANGE_PRESETS)[number]["key"];

export function getDefaultDateRangeLabel(): string {
  const end = new Date("2026-05-27T21:18:00");
  const start = new Date("2026-05-20T21:18:00");
  const format = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d} ${h}:${min}`;
  };
  return `${format(start)} - ${format(end)}`;
}
