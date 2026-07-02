import type { MonitoringChart } from "@/lib/mock/service-monitoring";

export type RiskLevel = "高" | "中" | "低";
export type AgentMonitorStatus = "正常" | "观察中" | "异常" | "已处置";
export type TrendDirection = "up" | "down" | "flat";

export interface DashboardOverviewMetric {
  key: string;
  label: string;
  value: string;
  tooltip?: string;
  trend?: {
    direction: TrendDirection;
    label: string;
    /** 为 true 时「下降」视为向好（如异常数、失败率） */
    invertSentiment?: boolean;
  };
  emphasis?: "default" | "warn" | "critical";
}

export type AgentRunStatusKey = "运行中" | "空闲" | "异常" | "停用";

export interface AgentRunStatusSlice {
  status: AgentRunStatusKey;
  count: number;
  color: string;
}

export interface AnomalyTypeStat {
  id: string;
  type: string;
  count: number;
  riskLevel: RiskLevel;
  trend: {
    direction: TrendDirection;
    label: string;
  };
}

export interface HighRiskAgentRow {
  id: string;
  name: string;
  space: string;
  riskLevel: RiskLevel;
  anomalyCount: number;
  lastAnomalyAt: string;
  status: AgentMonitorStatus;
}

export interface RecentAnomalyEventRow {
  id: string;
  time: string;
  agentName: string;
  anomalyType: string;
  description: string;
  disposition: AgentMonitorStatus;
}

export interface SpaceOperationsDashboardData {
  overviewMetrics: DashboardOverviewMetric[];
  runStatusDistribution: AgentRunStatusSlice[];
  runTrendChart: MonitoringChart;
  anomalyStats: AnomalyTypeStat[];
  highRiskAgents: HighRiskAgentRow[];
  recentAnomalyEvents: RecentAnomalyEventRow[];
}

const RUN_TREND_X_LABELS = [
  "00:00",
  "04:00",
  "08:00",
  "12:00",
  "16:00",
  "20:00",
  "24:00",
];

export const SPACE_OPERATIONS_DASHBOARD_MOCK: SpaceOperationsDashboardData = {
  overviewMetrics: [
    {
      key: "total-agents",
      label: "智能体总数",
      value: "128",
      tooltip: "当前空间内已注册并可调度的智能体数量",
      trend: { direction: "up", label: "较上周 +6" },
    },
    {
      key: "running-agents",
      label: "运行中智能体",
      value: "86",
      tooltip: "过去 15 分钟内有任务执行或会话活跃的智能体",
      trend: { direction: "up", label: "较昨日 +4" },
    },
    {
      key: "today-calls",
      label: "今日调用次数",
      value: "24,580",
      tooltip: "含工具调用、工作流节点与会话推理的总调用量",
      trend: { direction: "up", label: "较昨日 +12.3%" },
    },
    {
      key: "today-anomalies",
      label: "今日异常数",
      value: "37",
      tooltip: "行为检测、访问控制与工具失败等合并计数的异常事件",
      trend: { direction: "down", label: "较昨日 -8", invertSentiment: true },
      emphasis: "warn",
    },
    {
      key: "tool-failure-rate",
      label: "工具调用失败率",
      value: "1.8%",
      tooltip: "工具调用失败次数 / 工具调用总次数",
      trend: { direction: "down", label: "较昨日 -0.4pt", invertSentiment: true },
    },
    {
      key: "avg-latency",
      label: "平均响应耗时",
      value: "1.42s",
      tooltip: "端到端响应 P50，含排队与工具往返",
      trend: { direction: "flat", label: "与昨日持平" },
    },
  ],
  runStatusDistribution: [
    { status: "运行中", count: 86, color: "#2773ff" },
    { status: "空闲", count: 32, color: "#94a3b8" },
    { status: "异常", count: 6, color: "#ef4444" },
    { status: "停用", count: 4, color: "#cbd5e1" },
  ],
  runTrendChart: {
    id: "space-run-trend-24h",
    title: "近 24 小时运行趋势",
    yAxisLabel: "次",
    xLabels: RUN_TREND_X_LABELS,
    series: [
      {
        key: "calls",
        label: "调用量",
        color: "#2773ff",
        values: [820, 640, 1120, 1580, 1420, 980, 1240],
      },
      {
        key: "anomalies",
        label: "异常量",
        color: "#ef4444",
        values: [4, 3, 6, 9, 7, 5, 3],
      },
      {
        key: "failure-rate",
        label: "失败率 (%)",
        color: "#f59e0b",
        values: [2.1, 1.9, 2.4, 2.8, 2.2, 1.7, 1.8],
      },
    ],
  },
  anomalyStats: [
    {
      id: "bad-tool-call",
      type: "异常工具调用",
      count: 14,
      riskLevel: "高",
      trend: { direction: "up", label: "+3 较昨日" },
    },
    {
      id: "abnormal-access",
      type: "异常访问",
      count: 9,
      riskLevel: "高",
      trend: { direction: "up", label: "+2 较昨日" },
    },
    {
      id: "behavior-drift",
      type: "行为漂移",
      count: 6,
      riskLevel: "中",
      trend: { direction: "flat", label: "与昨日持平" },
    },
    {
      id: "privilege-escalation",
      type: "越权尝试",
      count: 4,
      riskLevel: "高",
      trend: { direction: "down", label: "-1 较昨日" },
    },
    {
      id: "sensitive-access",
      type: "敏感信息访问",
      count: 3,
      riskLevel: "中",
      trend: { direction: "up", label: "+1 较昨日" },
    },
    {
      id: "no-response",
      type: "长时间无响应",
      count: 1,
      riskLevel: "低",
      trend: { direction: "down", label: "-2 较昨日" },
    },
  ],
  highRiskAgents: [
    {
      id: "agent-1",
      name: "金融客服助手",
      space: "零售银行空间",
      riskLevel: "高",
      anomalyCount: 12,
      lastAnomalyAt: "2026-06-03 14:22",
      status: "异常",
    },
    {
      id: "agent-2",
      name: "供应链协调 Agent",
      space: "制造协同空间",
      riskLevel: "高",
      anomalyCount: 9,
      lastAnomalyAt: "2026-06-03 13:48",
      status: "观察中",
    },
    {
      id: "agent-3",
      name: "合规审阅助手",
      space: "法务合规空间",
      riskLevel: "中",
      anomalyCount: 7,
      lastAnomalyAt: "2026-06-03 11:05",
      status: "观察中",
    },
    {
      id: "agent-4",
      name: "运维巡检 Agent",
      space: "平台运维空间",
      riskLevel: "中",
      anomalyCount: 5,
      lastAnomalyAt: "2026-06-03 09:31",
      status: "正常",
    },
    {
      id: "agent-5",
      name: "营销内容生成",
      space: "品牌营销空间",
      riskLevel: "低",
      anomalyCount: 3,
      lastAnomalyAt: "2026-06-02 18:40",
      status: "已处置",
    },
  ],
  recentAnomalyEvents: [
    {
      id: "evt-1",
      time: "2026-06-03 14:22",
      agentName: "金融客服助手",
      anomalyType: "异常工具调用",
      description: "连续 3 次调用未授权转账查询接口，参数包含客户身份证号片段",
      disposition: "异常",
    },
    {
      id: "evt-2",
      time: "2026-06-03 13:48",
      agentName: "供应链协调 Agent",
      anomalyType: "越权尝试",
      description: "尝试访问跨空间采购审批 API，Token 作用域不匹配",
      disposition: "观察中",
    },
    {
      id: "evt-3",
      time: "2026-06-03 12:15",
      agentName: "合规审阅助手",
      anomalyType: "敏感信息访问",
      description: "批量读取合同附件元数据，频次超过基线 240%",
      disposition: "观察中",
    },
    {
      id: "evt-4",
      time: "2026-06-03 10:02",
      agentName: "运维巡检 Agent",
      anomalyType: "行为漂移",
      description: "回复风格与近 7 日基线偏离，工具选择分布异常",
      disposition: "正常",
    },
    {
      id: "evt-5",
      time: "2026-06-03 08:44",
      agentName: "营销内容生成",
      anomalyType: "异常访问",
      description: "访问已下线素材库路径，返回 404 后仍重试 8 次",
      disposition: "已处置",
    },
    {
      id: "evt-6",
      time: "2026-06-03 07:20",
      agentName: "金融客服助手",
      anomalyType: "长时间无响应",
      description: "会话挂起超过 120s 未释放 worker，触发熔断告警",
      disposition: "已处置",
    },
  ],
};
