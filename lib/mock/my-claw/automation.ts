/**
 * Automation tasks + executions ported from 会话交互
 * `automation-data.js` / `automation-executions-data.js`.
 */

export const AUTOMATION_DELIVERY_CHANNELS = [
  "飞书",
  "蓝信",
  "钉钉",
  "企微",
  "QQ",
  "AF平台",
] as const;

export type AutomationDeliveryChannel =
  (typeof AUTOMATION_DELIVERY_CHANNELS)[number];

export type AutomationTriggerType = "time" | "event";
export type AutomationTriggerMode =
  | "schedule"
  | "interval"
  | "once"
  | "webhook"
  | "poll";
export type AutomationRunResult = "success" | "failed" | "running" | "never";
export type AutomationExecutionStatus = "success" | "failure";

export interface AutomationScheduleConfig {
  execution_type: "schedule" | "interval" | "once";
  frequency: "daily" | "weekly";
  weekdays: string[];
  time: string;
  interval_value: number;
  interval_unit: "hour" | "day";
  run_at_date: string;
  run_at_time: string;
  effective_from: string;
  effective_until: string;
}

export interface AutomationEventConfig {
  source_type: "webhook" | "poll";
  source_name?: string;
  event_description?: string;
  endpoint?: string;
  secret?: string;
  trigger_note?: string;
  rate_limit?: string;
  dedupe_window?: string;
  target_name?: string;
  url?: string;
  frequency?: string;
  detection?: string;
  request_method?: string;
  headers?: string;
  auth?: string;
  timeout_seconds?: string;
  recent_requests?: Array<{ at: string; status: string; summary: string }>;
  recent_checks?: Array<{ at: string; status: string; summary: string }>;
}

export interface AutomationRecentRun {
  triggered_at: string;
  result: AutomationRunResult;
  summary: string;
  sidebar_relative?: string;
}

export interface AutomationTask {
  id: string;
  workspace_name?: string;
  name: string;
  description: string;
  trigger_type: AutomationTriggerType;
  trigger_mode: AutomationTriggerMode;
  trigger_summary: string;
  last_run_at: string;
  last_run_status: AutomationRunResult;
  enabled: boolean;
  memory_enabled: boolean;
  agent_id: string;
  claw_id: string;
  instruction: string;
  delivery_channel: AutomationDeliveryChannel;
  schedule_config?: AutomationScheduleConfig;
  event_config?: AutomationEventConfig;
  recent_runs: AutomationRecentRun[];
  disabled_by?: string;
  claw_status?: "normal" | "abnormal";
  claw_disabled_reason?: string;
  claw_disabled_at?: string;
}

export interface AutomationExecution {
  id: string;
  taskId: string;
  taskName: string;
  executionClaw: string;
  finalOutput: string;
  status: AutomationExecutionStatus;
  resultSummary: string;
  executedAt: string;
  deliveryChannel: AutomationDeliveryChannel;
  deliveryTarget: string;
  traceId: string;
  relatedSessionId?: string;
}

export interface AutomationSidebarRun {
  id: string;
  title: string;
  timeLabel: string;
  status: "success" | "error" | "running" | "awaiting";
  summary: string;
}

export interface AutomationSidebarTask {
  id: string;
  title: string;
  workspaceName: string;
  triggerSummary: string;
  status: "success" | "error" | "running" | "awaiting";
  runs: AutomationSidebarRun[];
}

export const AUTOMATION_CLAW_SELECT_GROUPS: Array<{
  label: string;
  items: Array<{ id: string; label: string }>;
}> = [
  {
    label: "我的 Claw",
    items: [{ id: "claw-mine-general", label: "我的 Claw" }],
  },
  {
    label: "AF 平台已发布",
    items: [
      { id: "claw-af-prd-writer", label: "PRD 写手" },
      { id: "claw-af-cloud-factory", label: "云码工厂维护专员" },
      { id: "claw-af-market", label: "市场洞察" },
      { id: "claw-af-frontend", label: "前端原型实现" },
    ],
  },
];

const LEGACY_AGENT_LABELS: Record<string, string> = {
  "agent-language-coach": "语言教练",
  "agent-morning-boost": "晨间鼓励助手",
  "agent-ops-sync": "库存同步助手",
  "agent-board-pack": "经营周报助手",
  "agent-ci-diagnosis": "CI 诊断助手",
  "agent-api-watch": "接口监测助手",
  "agent-general": "通用 Agent",
};

const CLAW_LABELS: Record<string, string> = {
  "claw-mine-general": "我的 Claw",
  "claw-af-prd-writer": "PRD 写手",
  "claw-af-cloud-factory": "云码工厂维护专员",
  "claw-af-market": "市场洞察",
  "claw-af-frontend": "前端原型实现",
  ...LEGACY_AGENT_LABELS,
};

const RAW_AUTOMATION_TASKS: Omit<AutomationTask, "delivery_channel">[] = [
  {
    id: "auto-schedule-daily-english",
    workspace_name: "英语单词推荐",
    name: "每天推荐 5 个实用英语单词",
    description: "每天早上推荐 5 个实用英语单词，附音标、中文释义与简短例句。",
    trigger_type: "time",
    trigger_mode: "schedule",
    trigger_summary: "每天 08:30",
    last_run_at: "2026-04-30 08:42",
    last_run_status: "success",
    enabled: true,
    memory_enabled: false,
    agent_id: "claw-mine-general",
    claw_id: "claw-mine-general",
    instruction:
      "每天早上推荐 5 个实用英语单词；每个单词输出音标、词性、中文释义和一个不超过 12 个词的英文例句，整体保持简洁、易记、适合晨读。",
    schedule_config: {
      execution_type: "schedule",
      frequency: "daily",
      weekdays: [],
      time: "08:30",
      interval_value: 6,
      interval_unit: "hour",
      run_at_date: "",
      run_at_time: "",
      effective_from: "",
      effective_until: "",
    },
    recent_runs: [
      {
        triggered_at: "2026-04-30 08:42",
        result: "success",
        summary: "已推荐 practical、nudge、cozy、steady、glimpse 5 个单词。",
        sidebar_relative: "刚刚",
      },
      {
        triggered_at: "2026-04-29 21:30",
        result: "success",
        summary: "已推荐 vivid、boost、tidy、humble、thrive 5 个单词。",
        sidebar_relative: "11小时前",
      },
      {
        triggered_at: "2026-04-29 08:30",
        result: "success",
        summary: "已推荐 clarity、gentle、spark、rely、brief 5 个单词。",
        sidebar_relative: "1天前",
      },
      {
        triggered_at: "2026-04-24 08:30",
        result: "success",
        summary: "已推荐 adapt、focus、kind、notion、value 5 个单词。",
        sidebar_relative: "6天前",
      },
      {
        triggered_at: "2026-04-24 07:55",
        result: "success",
        summary: "已推荐 settle、curious、measure、prompt、calm 5 个单词。",
        sidebar_relative: "6天前",
      },
    ],
  },
  {
    id: "auto-schedule-morning-boost",
    workspace_name: "automation-202604210800",
    name: "每天早上给我加油打气",
    description: "每天早上发送一句简短打气话和一个当天行动提醒。",
    trigger_type: "time",
    trigger_mode: "schedule",
    trigger_summary: "每天 08:00",
    last_run_at: "2026-04-30 08:00",
    last_run_status: "success",
    enabled: true,
    memory_enabled: false,
    agent_id: "claw-mine-general",
    claw_id: "claw-mine-general",
    instruction:
      "每天早上生成一句不超过 30 字的中文鼓励语，再补一句当天可执行的小提醒，整体要温和、有力量，不要鸡汤式空话。",
    schedule_config: {
      execution_type: "schedule",
      frequency: "daily",
      weekdays: [],
      time: "08:00",
      interval_value: 1,
      interval_unit: "day",
      run_at_date: "",
      run_at_time: "",
      effective_from: "",
      effective_until: "",
    },
    recent_runs: [
      {
        triggered_at: "2026-04-30 08:00",
        result: "success",
        summary: "已发送今日鼓励：先把最重要的一件事做完，今天就已经赢了一半。",
      },
      {
        triggered_at: "2026-04-29 08:00",
        result: "success",
        summary: "已发送今日鼓励：节奏稳一点，专注一点，事情就会一点点向前走。",
      },
    ],
  },
  {
    id: "auto-interval-inventory-sync",
    name: "库存同步检查",
    description: "轮询 ERP 与商城库存差异，发现差值后提醒运营处理。",
    trigger_type: "time",
    trigger_mode: "interval",
    trigger_summary: "每 6 小时",
    last_run_at: "2026-04-13 12:00",
    last_run_status: "running",
    enabled: true,
    memory_enabled: false,
    agent_id: "claw-mine-general",
    claw_id: "claw-mine-general",
    instruction:
      "对比 ERP 与电商平台 SKU 库存，识别差值超过 5 的商品，输出差异表并推送给运营值班群。",
    schedule_config: {
      execution_type: "interval",
      frequency: "daily",
      weekdays: [],
      time: "09:00",
      interval_value: 6,
      interval_unit: "hour",
      run_at_date: "",
      run_at_time: "",
      effective_from: "",
      effective_until: "",
    },
    recent_runs: [
      {
        triggered_at: "2026-04-13 12:00",
        result: "running",
        summary: "正在比对 1,284 个 SKU，同步检查尚未结束。",
      },
      {
        triggered_at: "2026-04-13 06:00",
        result: "success",
        summary: "发现 8 个差异 SKU，已向运营群发送处理列表。",
      },
      {
        triggered_at: "2026-04-13 00:00",
        result: "success",
        summary: "夜间库存检查完成，无需人工处理。",
      },
    ],
  },
  {
    id: "auto-once-board-pack",
    name: "董事会材料预检查",
    description: "会前单次整理财务与经营指标，输出给董事会材料负责人。",
    trigger_type: "time",
    trigger_mode: "once",
    trigger_summary: "单次：2026-04-20 14:00",
    last_run_at: "",
    last_run_status: "never",
    enabled: false,
    memory_enabled: false,
    agent_id: "agent-board-pack",
    claw_id: "agent-board-pack",
    instruction:
      "汇总一季度经营指标、预算执行率和重点项目里程碑，生成董事会材料预检查摘要，并列出缺失附件和异常指标。",
    schedule_config: {
      execution_type: "once",
      frequency: "daily",
      weekdays: [],
      time: "09:00",
      interval_value: 1,
      interval_unit: "day",
      run_at_date: "2026-04-20",
      run_at_time: "14:00",
      effective_from: "",
      effective_until: "",
    },
    recent_runs: [],
  },
  {
    id: "auto-webhook-build-alert",
    name: "构建失败自动诊断",
    description: "接收 GitHub 构建失败 Webhook，自动汇总失败日志并生成修复建议。",
    trigger_type: "event",
    trigger_mode: "webhook",
    trigger_summary: "Webhook 触发",
    last_run_at: "2026-04-13 11:42",
    last_run_status: "success",
    enabled: false,
    memory_enabled: false,
    disabled_by: "system",
    claw_status: "abnormal",
    claw_disabled_reason: "该智能体已停用、下架或被删除，请重新配置",
    claw_disabled_at: "2026-06-17 10:30",
    agent_id: "agent-ci-diagnosis",
    claw_id: "agent-ci-diagnosis",
    instruction:
      "收到构建失败事件后，提取失败 job、关键报错和最近相关提交，输出修复建议，并将摘要通知给对应项目负责人。",
    event_config: {
      source_type: "webhook",
      source_name: "GitHub 构建通知",
      event_description: "仓库 CI / CD 失败回调",
      endpoint: "https://hooks.cec-claw.mock/automation/auto-webhook-build-alert",
      secret: "whsec_v3aP6nq0Q7zL",
      trigger_note: "当 workflow 结论为 failure 或 cancelled 时触发。",
      rate_limit: "30 次/分钟",
      dedupe_window: "10 分钟",
      recent_requests: [
        {
          at: "2026-04-13 11:42",
          status: "success",
          summary: "接收到 build-failure 事件，已定位到 test 阶段超时。",
        },
        {
          at: "2026-04-12 18:05",
          status: "success",
          summary: "接收到 deployment-failure 事件，已提醒负责人回滚。",
        },
      ],
    },
    recent_runs: [
      {
        triggered_at: "2026-04-13 11:42",
        result: "success",
        summary: "已生成失败原因、影响范围和建议修复步骤。",
      },
      {
        triggered_at: "2026-04-12 18:05",
        result: "success",
        summary: "发布回滚建议已发送给值班同学。",
      },
    ],
  },
  {
    id: "auto-poll-api-drift",
    name: "价格接口变更检查",
    description: "定期拉取价格接口响应，对比字段和值变化后通知商品运营。",
    trigger_type: "event",
    trigger_mode: "poll",
    trigger_summary: "Poll（接口变化检查）",
    last_run_at: "2026-04-13 08:30",
    last_run_status: "failed",
    enabled: false,
    memory_enabled: false,
    agent_id: "agent-api-watch",
    claw_id: "agent-api-watch",
    instruction:
      "检查价格接口字段和值变化；若检测到价格状态值变化或折扣比例异常，生成变更摘要并通知商品运营与研发接口人。",
    event_config: {
      source_type: "poll",
      target_name: "价格聚合接口",
      url: "https://api.mock-claw.local/pricing/v1/snapshot",
      frequency: "每 30 分钟",
      detection: "status_change",
      request_method: "GET",
      headers: "Accept: application/json\nX-App: cec-claw",
      auth: "Bearer ************",
      timeout_seconds: "12",
      recent_checks: [
        {
          at: "2026-04-13 08:30",
          status: "failed",
          summary: "接口超时，未获取到本次快照。",
        },
        {
          at: "2026-04-13 08:00",
          status: "success",
          summary: "发现 status 字段由 stable 变为 degraded，已发送预警。",
        },
      ],
    },
    recent_runs: [
      {
        triggered_at: "2026-04-13 08:00",
        result: "success",
        summary: "检测到价格状态变化，已触发运营通知。",
      },
      {
        triggered_at: "2026-04-13 08:30",
        result: "failed",
        summary: "轮询接口超时，未能生成本次检查结果。",
      },
    ],
  },
];

function withDeliveryChannel(
  task: Omit<AutomationTask, "delivery_channel">,
  index: number
): AutomationTask {
  return {
    ...task,
    delivery_channel:
      AUTOMATION_DELIVERY_CHANNELS[index % AUTOMATION_DELIVERY_CHANNELS.length],
  };
}

export const INITIAL_AUTOMATION_TASKS: AutomationTask[] =
  RAW_AUTOMATION_TASKS.map(withDeliveryChannel);

function padExecutedAt(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  if (/:\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(raw)) return `${raw}:00`;
  return raw;
}

function normalizeExecutionStatus(
  result: AutomationRunResult | string
): AutomationExecutionStatus {
  if (result === "failed" || result === "failure") return "failure";
  return "success";
}

export function getAutomationClawLabel(task: Pick<AutomationTask, "claw_id" | "agent_id">): string {
  const id = String(task.claw_id || task.agent_id || "").trim();
  if (!id) return "—";
  return CLAW_LABELS[id] || id;
}

function buildExecutionsFromTasks(tasks: AutomationTask[]): AutomationExecution[] {
  const executions: AutomationExecution[] = [];

  tasks.forEach((task) => {
    const channel = task.delivery_channel;
    const target = `${channel} / ${task.workspace_name || task.name}`;
    (task.recent_runs || []).forEach((run, runIndex) => {
      if (run.result === "running") return;
      const status = normalizeExecutionStatus(run.result);
      executions.push({
        id: `auto-exec-${task.id}-${runIndex}`,
        taskId: task.id,
        taskName: task.name,
        executionClaw: getAutomationClawLabel(task),
        finalOutput: run.summary || "—",
        status,
        resultSummary:
          status === "failure"
            ? `执行失败：${run.summary || "任务未正常完成。"}`
            : `执行成功：${run.summary || "任务已按计划完成。"}`,
        executedAt: padExecutedAt(run.triggered_at),
        deliveryChannel: channel,
        deliveryTarget: target,
        traceId: `trace-${task.id}-${String(runIndex + 1).padStart(2, "0")}`,
        relatedSessionId:
          task.id === "auto-schedule-daily-english" ? "task-001" : undefined,
      });
    });
  });

  const extras: AutomationExecution[] = [
    {
      id: "auto-exec-board-pack-20260420-1400",
      taskId: "auto-once-board-pack",
      taskName: "董事会材料预检查",
      executionClaw: "经营周报助手",
      finalOutput: "生成 1 份预检查摘要，包含 4 项缺失附件提醒。",
      status: "failure",
      resultSummary: "执行失败：部分财务指标附件未上传，已保留检查清单。",
      executedAt: "2026-04-20 14:00:23",
      deliveryChannel: "企微",
      deliveryTarget: "企微 / 董事会材料协同群",
      traceId: "trace-auto-board-pack-20260420-1400",
      relatedSessionId: "task-003",
    },
    {
      id: "auto-exec-inventory-20260413-1200",
      taskId: "auto-interval-inventory-sync",
      taskName: "库存同步检查",
      executionClaw: "我的 Claw",
      finalOutput: "正在比对 1,284 个 SKU，同步检查尚未结束。",
      status: "success",
      resultSummary: "执行成功：巡检任务已启动，结果将在完成后推送。",
      executedAt: "2026-04-13 12:00:11",
      deliveryChannel: "钉钉",
      deliveryTarget: "钉钉 / 库存运营群",
      traceId: "trace-auto-inventory-20260413-1200",
    },
  ];

  extras.forEach((item) => {
    if (!executions.some((row) => row.id === item.id)) {
      executions.push(item);
    }
  });

  return executions.sort((a, b) =>
    String(b.executedAt).localeCompare(String(a.executedAt))
  );
}

export const INITIAL_AUTOMATION_EXECUTIONS: AutomationExecution[] =
  buildExecutionsFromTasks(INITIAL_AUTOMATION_TASKS);

export function getTriggerTypeLabel(task: AutomationTask): string {
  if (task.trigger_type !== "time") {
    return task.trigger_mode === "poll" ? "Poll 检查" : "Webhook 触发";
  }
  if (task.trigger_mode === "interval") return "间隔执行";
  if (task.trigger_mode === "once") return "单次执行";
  return "定时执行";
}

export function getLastRunStatusLabel(status: AutomationRunResult): string {
  switch (status) {
    case "success":
      return "成功";
    case "failed":
      return "失败";
    case "running":
      return "执行中";
    default:
      return "从未执行";
  }
}

export function deriveAutomationWorkspaceName(task: AutomationTask): string {
  if (task.workspace_name) return task.workspace_name;
  const stamp =
    String(task.last_run_at || "")
      .replace(/\D/g, "")
      .slice(0, 12) || "202604211305";
  return `automation-${stamp}`;
}

function mapSidebarStatus(
  result: AutomationRunResult | string | undefined
): AutomationSidebarRun["status"] {
  if (result === "running") return "running";
  if (result === "failed" || result === "failure" || result === "error") {
    return "error";
  }
  if (result === "never" || !result) return "awaiting";
  return "success";
}

export function buildAutomationRunId(taskId: string, index: number): string {
  return `${taskId}::run-${index + 1}`;
}

/** Map sidebar runId (`${taskId}::run-N`) to execution row id (`auto-exec-${taskId}-${N-1}`). */
export function resolveExecutionIdFromRunId(
  taskId: string,
  runId: string
): string | null {
  const prefix = `${taskId}::run-`;
  if (!runId.startsWith(prefix)) return null;
  const runNumber = Number.parseInt(runId.slice(prefix.length), 10);
  if (!Number.isFinite(runNumber) || runNumber < 1) return null;
  const index = runNumber - 1;
  if (buildAutomationRunId(taskId, index) !== runId) return null;
  return `auto-exec-${taskId}-${index}`;
}

export function getAutomationSidebarTasks(
  tasks: AutomationTask[]
): AutomationSidebarTask[] {
  return tasks.map((task) => {
    const runs = (task.recent_runs || []).slice(0, 5).map((run, index) => ({
      id: buildAutomationRunId(task.id, index),
      title: task.name || `自动化任务 ${index + 1}`,
      timeLabel: run.sidebar_relative || run.triggered_at || "—",
      status: mapSidebarStatus(run.result),
      summary: run.summary || "",
    }));

    return {
      id: task.id,
      title: task.name || "未命名任务",
      workspaceName: deriveAutomationWorkspaceName(task),
      triggerSummary: task.trigger_summary || "",
      status: mapSidebarStatus(task.last_run_status),
      runs,
    };
  });
}

export function createTaskId(prefix: string): string {
  return `auto-${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function buildTriggerSummary(task: Partial<AutomationTask>): string {
  if (task.trigger_type === "event") {
    return task.event_config?.source_type === "poll"
      ? "Poll（接口变化检查）"
      : "Webhook 触发";
  }
  const config = task.schedule_config;
  if (!config) return "每天 09:00";
  if (config.execution_type === "once") {
    return `单次：${config.run_at_date || "未设置日期"} ${config.run_at_time || "未设置时间"}`;
  }
  if (config.execution_type === "interval") {
    return `每 ${config.interval_value || 1} 小时`;
  }
  if (config.frequency === "weekly") {
    return `每周 ${config.time || "09:00"}`;
  }
  return `每天 ${config.time || "09:00"}`;
}

export function createScheduledTaskDraft(): AutomationTask {
  return {
    id: "",
    name: "",
    description: "",
    trigger_type: "time",
    trigger_mode: "schedule",
    trigger_summary: "每天 09:00",
    last_run_at: "",
    last_run_status: "never",
    enabled: true,
    memory_enabled: false,
    agent_id: "claw-mine-general",
    claw_id: "claw-mine-general",
    instruction: "",
    delivery_channel: "飞书",
    schedule_config: {
      execution_type: "schedule",
      frequency: "daily",
      weekdays: [],
      time: "09:00",
      interval_value: 6,
      interval_unit: "hour",
      run_at_date: "",
      run_at_time: "",
      effective_from: "",
      effective_until: "",
    },
    recent_runs: [],
  };
}

export function createPollTaskDraft(): AutomationTask {
  return {
    id: "",
    name: "",
    description: "",
    trigger_type: "event",
    trigger_mode: "poll",
    trigger_summary: "Poll（接口变化检查）",
    last_run_at: "",
    last_run_status: "never",
    enabled: true,
    memory_enabled: false,
    agent_id: "claw-mine-general",
    claw_id: "claw-mine-general",
    instruction: "",
    delivery_channel: "飞书",
    event_config: {
      source_type: "poll",
      target_name: "",
      url: "",
      frequency: "每 30 分钟",
      detection: "content_change",
      request_method: "GET",
      headers: "",
      auth: "",
      timeout_seconds: "12",
      recent_checks: [],
    },
    recent_runs: [],
  };
}

export function getClawSelectOptions(
  selectedId?: string
): Array<{ value: string; label: string }> {
  const options = AUTOMATION_CLAW_SELECT_GROUPS.flatMap((group) =>
    group.items.map((item) => ({
      value: item.id,
      label: `${group.label} · ${item.label}`,
    }))
  );
  const selected = String(selectedId || "").trim();
  if (selected && !options.some((item) => item.value === selected)) {
    options.push({
      value: selected,
      label: `${CLAW_LABELS[selected] || selected}（当前绑定）`,
    });
  }
  return options;
}

export function filterAutomationTasks(
  tasks: AutomationTask[],
  query: string
): AutomationTask[] {
  const q = query.trim().toLowerCase();
  if (!q) return tasks;
  return tasks.filter(
    (task) =>
      task.name.toLowerCase().includes(q) ||
      task.description.toLowerCase().includes(q) ||
      getAutomationClawLabel(task).toLowerCase().includes(q) ||
      task.delivery_channel.toLowerCase().includes(q)
  );
}

export function filterAutomationExecutions(
  executions: AutomationExecution[],
  options: {
    query?: string;
    taskId?: string;
    status?: "all" | AutomationExecutionStatus;
    channel?: "all" | AutomationDeliveryChannel;
  }
): AutomationExecution[] {
  const q = (options.query || "").trim().toLowerCase();
  return executions.filter((row) => {
    if (options.taskId && options.taskId !== "all" && row.taskId !== options.taskId) {
      return false;
    }
    if (options.status && options.status !== "all" && row.status !== options.status) {
      return false;
    }
    if (
      options.channel &&
      options.channel !== "all" &&
      row.deliveryChannel !== options.channel
    ) {
      return false;
    }
    if (!q) return true;
    return (
      row.taskName.toLowerCase().includes(q) ||
      row.finalOutput.toLowerCase().includes(q) ||
      row.traceId.toLowerCase().includes(q)
    );
  });
}
