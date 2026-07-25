"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useMyClaw } from "@/components/my-claw/provider";
import {
  ManagementCell,
  ManagementEmptyRow,
  ManagementPageTitle,
  ManagementPrimaryButton,
  ManagementRow,
  ManagementRowActions,
  ManagementSecondaryButton,
  ManagementStatusDot,
  ManagementTable,
  ManagementTableBody,
  ManagementTableFrame,
  ManagementTableHead,
  ManagementTableHeader,
  ManagementTextAction,
  ManagementToolbar,
} from "@/components/management/management-list";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AUTOMATION_DELIVERY_CHANNELS,
  buildTriggerSummary,
  createPollTaskDraft,
  createScheduledTaskDraft,
  createTaskId,
  filterAutomationExecutions,
  filterAutomationTasks,
  getAutomationClawLabel,
  getClawSelectOptions,
  getLastRunStatusLabel,
  getTriggerTypeLabel,
  INITIAL_AUTOMATION_EXECUTIONS,
  resolveExecutionIdFromRunId,
  type AutomationDeliveryChannel,
  type AutomationExecution,
  type AutomationTask,
} from "@/lib/mock/my-claw/automation";
import { cn } from "@/lib/utils";

type PanelKey = "task-list" | "execution-history";
type CreateKind = "cron" | "poll";

interface TaskFormState {
  kind: CreateKind;
  mode: "create" | "edit";
  draft: AutomationTask;
}

const PANEL_ITEMS: Array<{ key: PanelKey; label: string; description: string }> = [
  {
    key: "task-list",
    label: "任务列表",
    description: "管理当前 Claw 已配置的自动化任务。",
  },
  {
    key: "execution-history",
    label: "执行历史",
    description: "查看每次触发与执行产生的历史记录。",
  },
];

const CHANNEL_OPTIONS = AUTOMATION_DELIVERY_CHANNELS.map((channel) => ({
  value: channel,
  label: channel,
}));

function cloneTask(task: AutomationTask): AutomationTask {
  return JSON.parse(JSON.stringify(task)) as AutomationTask;
}

function LastRunStatusCell({ status }: { status: AutomationTask["last_run_status"] }) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-amber-700">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        执行中
      </span>
    );
  }
  if (status === "never") {
    return <ManagementStatusDot label="从未执行" active={false} />;
  }
  return (
    <ManagementStatusDot
      label={getLastRunStatusLabel(status)}
      active={status === "success"}
      inactiveClassName="bg-rose-500"
    />
  );
}

export function MyClawAutomationWorkbench() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    automationTasks,
    setAutomationTasks,
    upsertAutomationTask,
    deleteAutomationTask,
    toggleAutomationTask,
  } = useMyClaw();

  const [activePanel, setActivePanel] = useState<PanelKey>("task-list");
  const [query, setQuery] = useState("");
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [form, setForm] = useState<TaskFormState | null>(null);
  const [executions, setExecutions] = useState<AutomationExecution[]>(() =>
    INITIAL_AUTOMATION_EXECUTIONS.map((item) => ({ ...item }))
  );
  const [executionQuery, setExecutionQuery] = useState("");
  const [executionScope, setExecutionScope] = useState<"all" | "specified">("all");
  const [executionTaskId, setExecutionTaskId] = useState("all");
  const [executionStatus, setExecutionStatus] = useState<"all" | "success" | "failure">(
    "all"
  );
  const [executionChannel, setExecutionChannel] = useState<"all" | AutomationDeliveryChannel>(
    "all"
  );

  const focusTaskId = searchParams.get("taskId");
  const focusRunId = searchParams.get("runId");

  const highlightedExecutionId = useMemo(() => {
    if (!focusTaskId || !focusRunId) return null;
    return resolveExecutionIdFromRunId(focusTaskId, focusRunId);
  }, [focusTaskId, focusRunId]);

  useEffect(() => {
    if (!focusTaskId) return;

    if (focusRunId) {
      setActivePanel("execution-history");
      setExecutionScope("specified");
      setExecutionTaskId(focusTaskId);
      setExecutionQuery("");
      setExecutionStatus("all");
      setExecutionChannel("all");
      return;
    }

    setActivePanel("task-list");
    setQuery("");
  }, [focusTaskId, focusRunId]);

  const filteredTasks = useMemo(
    () => filterAutomationTasks(automationTasks, query),
    [automationTasks, query]
  );

  const filteredExecutions = useMemo(
    () =>
      filterAutomationExecutions(executions, {
        query: executionQuery,
        taskId: executionScope === "specified" ? executionTaskId : "all",
        status: executionStatus,
        channel: executionChannel,
      }),
    [
      executions,
      executionQuery,
      executionScope,
      executionTaskId,
      executionStatus,
      executionChannel,
    ]
  );

  const clawOptions = useMemo(
    () => getClawSelectOptions(form?.draft.claw_id),
    [form?.draft.claw_id]
  );

  const activePanelMeta =
    PANEL_ITEMS.find((item) => item.key === activePanel) || PANEL_ITEMS[0];

  const openCreate = (kind: CreateKind) => {
    setCreateMenuOpen(false);
    setForm({
      kind,
      mode: "create",
      draft: kind === "cron" ? createScheduledTaskDraft() : createPollTaskDraft(),
    });
  };

  const openEdit = (task: AutomationTask) => {
    const kind: CreateKind = task.trigger_mode === "poll" ? "poll" : "cron";
    setForm({
      kind,
      mode: "edit",
      draft: cloneTask(task),
    });
  };

  const updateDraft = (patch: Partial<AutomationTask>) => {
    setForm((prev) => (prev ? { ...prev, draft: { ...prev.draft, ...patch } } : prev));
  };

  const updateSchedule = (
    patch: Partial<NonNullable<AutomationTask["schedule_config"]>>
  ) => {
    setForm((prev) => {
      if (!prev?.draft.schedule_config) return prev;
      return {
        ...prev,
        draft: {
          ...prev.draft,
          schedule_config: { ...prev.draft.schedule_config, ...patch },
        },
      };
    });
  };

  const updateEvent = (
    patch: Partial<NonNullable<AutomationTask["event_config"]>>
  ) => {
    setForm((prev) => {
      if (!prev?.draft.event_config) return prev;
      return {
        ...prev,
        draft: {
          ...prev.draft,
          event_config: { ...prev.draft.event_config, ...patch },
        },
      };
    });
  };

  const handleSave = () => {
    if (!form) return;
    const name = form.draft.name.trim();
    const instruction = form.draft.instruction.trim();
    const clawId = String(form.draft.claw_id || form.draft.agent_id || "").trim();

    if (!name) {
      toast.error("请填写任务名称");
      return;
    }
    if (!clawId) {
      toast.error("请选择执行 Claw");
      return;
    }
    if (!instruction) {
      toast.error("请填写任务执行提示词");
      return;
    }

    const isPollForm =
      form.kind === "poll" || form.draft.trigger_mode === "poll";
    const isWebhookEdit =
      form.mode === "edit" && form.draft.trigger_mode === "webhook";

    if (!isWebhookEdit && !isPollForm) {
      const schedule = form.draft.schedule_config;
      if (!schedule) {
        toast.error("触发配置不完整");
        return;
      }
      if (schedule.execution_type === "schedule" && !schedule.time) {
        toast.error("请设置执行时间");
        return;
      }
      if (
        schedule.execution_type === "interval" &&
        (!schedule.interval_value || schedule.interval_value < 1)
      ) {
        toast.error("请设置有效的间隔小时数");
        return;
      }
      if (
        schedule.execution_type === "once" &&
        (!schedule.run_at_date || !schedule.run_at_time)
      ) {
        toast.error("请设置单次执行日期与时间");
        return;
      }
    }

    if (isPollForm && !isWebhookEdit) {
      const event = form.draft.event_config;
      if (!event?.target_name?.trim() || !event.url?.trim() || !event.frequency?.trim()) {
        toast.error("请完善 Poll 目标、URL 与检查频率");
        return;
      }
    }

    const nextTriggerType: AutomationTask["trigger_type"] = isWebhookEdit
      ? form.draft.trigger_type
      : isPollForm
        ? "event"
        : "time";
    const nextTriggerMode: AutomationTask["trigger_mode"] = isWebhookEdit
      ? form.draft.trigger_mode
      : isPollForm
        ? "poll"
        : form.draft.schedule_config?.execution_type || "schedule";

    const next: AutomationTask = {
      ...form.draft,
      name,
      instruction,
      claw_id: clawId,
      agent_id: clawId,
      description: form.draft.description.trim() || name,
      trigger_type: nextTriggerType,
      trigger_mode: nextTriggerMode,
      trigger_summary: buildTriggerSummary({
        ...form.draft,
        trigger_type: nextTriggerType,
        trigger_mode: nextTriggerMode,
      }),
    };

    if (form.mode === "create") {
      next.id = createTaskId(form.kind === "poll" ? "poll" : "schedule");
      next.last_run_at = "";
      next.last_run_status = "never";
      next.recent_runs = [];
      next.workspace_name = next.workspace_name || next.name;
      upsertAutomationTask(next);
      toast.success(`已创建「${next.name}」`);
    } else {
      upsertAutomationTask(next);
      toast.success(`已保存「${next.name}」`);
    }

    setForm(null);
  };

  const handleDelete = (task: AutomationTask) => {
    if (!window.confirm(`确认删除自动化任务「${task.name}」？`)) return;
    deleteAutomationTask(task.id);
    setExecutions((prev) => prev.filter((row) => row.taskId !== task.id));
    toast.success(`已删除「${task.name}」`);
  };

  const handleToggle = (task: AutomationTask, enabled: boolean) => {
    if (enabled && task.claw_status === "abnormal") {
      toast.error(task.claw_disabled_reason || "执行 Claw 异常，请先重新配置");
      return;
    }
    toggleAutomationTask(task.id, enabled);
    toast.success(enabled ? `已启用「${task.name}」` : `已停用「${task.name}」`);
  };

  const handleViewExecution = (row: AutomationExecution) => {
    if (row.relatedSessionId) {
      router.push(`/my-claw/chat?sessionId=${encodeURIComponent(row.relatedSessionId)}`);
      return;
    }
    toast.info(row.resultSummary);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f5f7fb]">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 lg:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
          <ManagementPageTitle>自动化任务</ManagementPageTitle>

          <div className="rounded-[6px] border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex rounded-[4px] bg-slate-100 p-0.5">
                  {PANEL_ITEMS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActivePanel(item.key)}
                      className={cn(
                        "h-8 rounded-[4px] px-3 text-sm transition-colors",
                        activePanel === item.key
                          ? "bg-white font-medium text-[#2773ff] shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-[#5a6779]">{activePanelMeta.description}</p>
              </div>
            </div>

            {activePanel === "task-list" ? (
              <div className="space-y-4 pt-4">
                <ManagementToolbar
                  searchValue={query}
                  searchPlaceholder="搜索任务名称"
                  onSearchChange={setQuery}
                  actions={
                    <>
                      <ManagementSecondaryButton
                        type="button"
                        aria-label="刷新任务列表"
                        onClick={() => {
                          setAutomationTasks(automationTasks.map((task) => ({ ...task })));
                          toast.success("任务列表已刷新");
                        }}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </ManagementSecondaryButton>
                      <div className="relative">
                        <ManagementPrimaryButton
                          type="button"
                          className="bg-[#2773ff] hover:bg-[#1f63e0]"
                          onClick={() => setCreateMenuOpen((open) => !open)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          创建任务
                          <ChevronDown className="h-3.5 w-3.5" />
                        </ManagementPrimaryButton>
                        {createMenuOpen ? (
                          <div className="absolute right-0 z-20 mt-1 w-64 overflow-hidden rounded-[6px] border border-slate-200 bg-white shadow-lg">
                            <button
                              type="button"
                              className="block w-full px-3 py-2.5 text-left hover:bg-slate-50"
                              onClick={() => openCreate("cron")}
                            >
                              <div className="text-sm font-medium text-slate-900">
                                定时触发（Cron）
                              </div>
                              <div className="mt-0.5 text-xs text-[#5a6779]">
                                定时、间隔或单次执行
                              </div>
                            </button>
                            <button
                              type="button"
                              className="block w-full border-t border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50"
                              onClick={() => openCreate("poll")}
                            >
                              <div className="text-sm font-medium text-slate-900">
                                Poll 轮询
                              </div>
                              <div className="mt-0.5 text-xs text-[#5a6779]">
                                接口变化检查后触发
                              </div>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </>
                  }
                />

                <ManagementTableFrame>
                  <div className="overflow-x-auto">
                    <ManagementTable className="min-w-[1100px]">
                      <ManagementTableHeader>
                        <ManagementTableHead className="min-w-[180px]">
                          任务名称
                        </ManagementTableHead>
                        <ManagementTableHead className="min-w-[160px]">
                          触发条件
                        </ManagementTableHead>
                        <ManagementTableHead className="min-w-[120px]">
                          执行 Claw
                        </ManagementTableHead>
                        <ManagementTableHead className="min-w-[96px]">
                          交付渠道
                        </ManagementTableHead>
                        <ManagementTableHead className="min-w-[100px]">
                          状态
                        </ManagementTableHead>
                        <ManagementTableHead className="min-w-[140px]">
                          操作
                        </ManagementTableHead>
                      </ManagementTableHeader>
                      <ManagementTableBody>
                        {filteredTasks.length === 0 ? (
                          <ManagementEmptyRow
                            colSpan={6}
                            title="未找到匹配任务"
                            description="可尝试调整搜索关键词，或从右上角新建任务。"
                          />
                        ) : (
                          filteredTasks.map((task) => {
                            const highlighted = focusTaskId === task.id;
                            return (
                              <ManagementRow key={task.id} selected={highlighted}>
                                <ManagementCell>
                                  <div className="min-w-0">
                                    <div className="truncate font-medium text-slate-900">
                                      {task.name}
                                    </div>
                                    <p className="mt-0.5 line-clamp-1 text-xs text-[#5a6779]">
                                      {task.description || "—"}
                                    </p>
                                  </div>
                                </ManagementCell>
                                <ManagementCell>
                                  <div className="space-y-1.5">
                                    <div className="text-sm text-slate-800">
                                      {task.trigger_summary}
                                    </div>
                                    <span className="inline-flex rounded-[4px] border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-[#2773ff]">
                                      {getTriggerTypeLabel(task)}
                                    </span>
                                  </div>
                                </ManagementCell>
                                <ManagementCell>
                                  <div className="text-sm text-slate-800">
                                    {getAutomationClawLabel(task)}
                                  </div>
                                  {task.claw_status === "abnormal" ? (
                                    <p className="mt-1 text-xs text-rose-600">
                                      {task.claw_disabled_reason || "Claw 异常"}
                                    </p>
                                  ) : null}
                                </ManagementCell>
                                <ManagementCell>
                                  <span className="inline-flex rounded-[4px] border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                                    {task.delivery_channel}
                                  </span>
                                </ManagementCell>
                                <ManagementCell>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={task.enabled}
                                        onCheckedChange={(checked) =>
                                          handleToggle(task, checked)
                                        }
                                        aria-label={`${task.name} 启停`}
                                        className="data-[state=checked]:bg-[#2773ff]"
                                      />
                                      <span className="text-xs text-slate-500">
                                        {task.enabled ? "启用" : "停用"}
                                      </span>
                                    </div>
                                    <LastRunStatusCell status={task.last_run_status} />
                                  </div>
                                </ManagementCell>
                                <ManagementCell>
                                  <ManagementRowActions>
                                    <ManagementTextAction onClick={() => openEdit(task)}>
                                      编辑
                                    </ManagementTextAction>
                                    <ManagementTextAction
                                      className="text-rose-600 hover:text-rose-700"
                                      onClick={() => handleDelete(task)}
                                    >
                                      删除
                                    </ManagementTextAction>
                                  </ManagementRowActions>
                                </ManagementCell>
                              </ManagementRow>
                            );
                          })
                        )}
                      </ManagementTableBody>
                    </ManagementTable>
                  </div>
                </ManagementTableFrame>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">
                      自动化任务执行历史
                    </h2>
                    <p className="mt-1 text-sm text-[#5a6779]">
                      一条记录对应一次任务触发与执行。
                    </p>
                  </div>
                  <div className="text-xs font-medium text-slate-400">排序：最新优先</div>
                </div>

                <div className="grid gap-3 rounded-[6px] border border-slate-200 bg-slate-50/70 p-3 lg:grid-cols-[140px_minmax(160px,1fr)_minmax(220px,1.2fr)_120px_120px]">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">任务范围</Label>
                    <Select
                      value={executionScope}
                      onValueChange={(value) => {
                        const next = value as "all" | "specified";
                        setExecutionScope(next);
                        if (next === "all") setExecutionTaskId("all");
                      }}
                      options={[
                        { value: "all", label: "全部任务" },
                        { value: "specified", label: "指定任务" },
                      ]}
                      className="h-8 rounded-[4px] border-slate-300 bg-white shadow-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">指定任务</Label>
                    {executionScope === "specified" ? (
                      <Select
                        value={executionTaskId}
                        onValueChange={setExecutionTaskId}
                        options={[
                          { value: "all", label: "请选择任务" },
                          ...automationTasks.map((task) => ({
                            value: task.id,
                            label: task.name,
                          })),
                        ]}
                        className="h-8 rounded-[4px] border-slate-300 bg-white shadow-none"
                      />
                    ) : (
                      <div className="flex h-8 items-center rounded-[4px] border border-dashed border-slate-300 bg-white px-3 text-sm text-slate-400">
                        不限定具体任务
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">搜索</Label>
                    <Input
                      value={executionQuery}
                      onChange={(event) => setExecutionQuery(event.target.value)}
                      placeholder="按任务名称或执行输出筛选"
                      className="h-8 rounded-[4px] border-slate-300 bg-white shadow-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">执行结果</Label>
                    <Select
                      value={executionStatus}
                      onValueChange={(value) =>
                        setExecutionStatus(value as "all" | "success" | "failure")
                      }
                      options={[
                        { value: "all", label: "全部" },
                        { value: "success", label: "成功" },
                        { value: "failure", label: "失败" },
                      ]}
                      className="h-8 rounded-[4px] border-slate-300 bg-white shadow-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">交付渠道</Label>
                    <Select
                      value={executionChannel}
                      onValueChange={(value) =>
                        setExecutionChannel(value as "all" | AutomationDeliveryChannel)
                      }
                      options={[
                        { value: "all", label: "全部" },
                        ...CHANNEL_OPTIONS,
                      ]}
                      className="h-8 rounded-[4px] border-slate-300 bg-white shadow-none"
                    />
                  </div>
                </div>

                <ManagementTableFrame>
                  <div className="overflow-x-auto">
                    <ManagementTable className="min-w-[1080px]">
                      <ManagementTableHeader>
                        <ManagementTableHead>任务名称</ManagementTableHead>
                        <ManagementTableHead>执行智能体</ManagementTableHead>
                        <ManagementTableHead>执行输出</ManagementTableHead>
                        <ManagementTableHead>执行结果</ManagementTableHead>
                        <ManagementTableHead>执行时间</ManagementTableHead>
                        <ManagementTableHead>操作</ManagementTableHead>
                      </ManagementTableHeader>
                      <ManagementTableBody>
                        {filteredExecutions.length === 0 ? (
                          <ManagementEmptyRow
                            colSpan={6}
                            title="暂无匹配的执行记录"
                            description="可调整筛选条件，或等待任务产生新的执行结果。"
                          />
                        ) : (
                          filteredExecutions.map((row) => (
                            <ManagementRow
                              key={row.id}
                              selected={row.id === highlightedExecutionId}
                            >
                              <ManagementCell>
                                <div
                                  className="font-medium text-slate-900"
                                  data-automation-execution-id={row.id}
                                >
                                  {row.taskName}
                                </div>
                                <div className="mt-0.5 text-xs text-[#5a6779]">
                                  {row.traceId}
                                </div>
                              </ManagementCell>
                              <ManagementCell>{row.executionClaw}</ManagementCell>
                              <ManagementCell className="max-w-[280px]">
                                <p className="line-clamp-2 text-sm text-slate-700">
                                  {row.finalOutput}
                                </p>
                              </ManagementCell>
                              <ManagementCell>
                                <ManagementStatusDot
                                  label={row.status === "success" ? "成功" : "失败"}
                                  active={row.status === "success"}
                                  inactiveClassName="bg-rose-500"
                                />
                              </ManagementCell>
                              <ManagementCell className="whitespace-nowrap">
                                {row.executedAt}
                              </ManagementCell>
                              <ManagementCell>
                                <ManagementTextAction
                                  onClick={() => handleViewExecution(row)}
                                >
                                  {row.relatedSessionId ? "查看会话" : "查看详情"}
                                </ManagementTextAction>
                              </ManagementCell>
                            </ManagementRow>
                          ))
                        )}
                      </ManagementTableBody>
                    </ManagementTable>
                  </div>
                </ManagementTableFrame>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-h-[88vh] max-w-[640px] overflow-y-auto rounded-[8px] border-slate-200 p-0 shadow-xl sm:max-w-[640px]">
          {form ? (
            <>
              <DialogHeader className="border-b border-slate-100 px-6 py-4">
                <DialogTitle className="text-lg font-semibold text-slate-950">
                  {form.mode === "edit"
                    ? form.kind === "poll"
                      ? "编辑 Poll 任务"
                      : "编辑定时任务"
                    : form.kind === "poll"
                      ? "新建 Poll 任务"
                      : "新建定时任务"}
                </DialogTitle>
                <p className="text-sm text-[#5a6779]">
                  配置触发方式、执行 Claw、交付渠道与提示词。
                </p>
              </DialogHeader>

              <div className="space-y-5 px-6 py-5">
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">基础信息</h3>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-slate-700">
                      选择 Claw <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={form.draft.claw_id || form.draft.agent_id}
                      onValueChange={(value) =>
                        updateDraft({ claw_id: value, agent_id: value })
                      }
                      options={clawOptions}
                      className="h-8 rounded-[4px] border-slate-300 bg-white shadow-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-slate-700">
                      任务名称 <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={form.draft.name}
                      onChange={(event) => updateDraft({ name: event.target.value })}
                      placeholder="例如：每日销售简报"
                      className="h-8 rounded-[4px] border-slate-300 shadow-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-slate-700">任务描述</Label>
                    <Textarea
                      value={form.draft.description}
                      onChange={(event) =>
                        updateDraft({ description: event.target.value })
                      }
                      rows={3}
                      className="rounded-[4px] border-slate-300 shadow-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-slate-700">
                      任务执行提示词 <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      value={form.draft.instruction}
                      onChange={(event) =>
                        updateDraft({ instruction: event.target.value })
                      }
                      rows={5}
                      className="rounded-[4px] border-slate-300 shadow-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-slate-700">
                      交付渠道 <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={form.draft.delivery_channel}
                      onValueChange={(value) =>
                        updateDraft({
                          delivery_channel: value as AutomationDeliveryChannel,
                        })
                      }
                      options={CHANNEL_OPTIONS}
                      className="h-8 rounded-[4px] border-slate-300 bg-white shadow-none"
                    />
                  </div>
                </section>

                {form.mode === "edit" && form.draft.trigger_mode === "webhook" ? (
                  <section className="rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-[#5a6779]">
                    当前为 Webhook 触发任务（{form.draft.trigger_summary}
                    ）。本次仅支持更新基础信息与交付渠道。
                  </section>
                ) : null}

                {form.kind === "cron" &&
                form.draft.schedule_config &&
                form.draft.trigger_mode !== "webhook" ? (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900">触发配置</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          ["schedule", "定时执行"],
                          ["interval", "间隔执行"],
                          ["once", "单次执行"],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            updateSchedule({ execution_type: value })
                          }
                          className={cn(
                            "h-8 rounded-[4px] border text-sm transition-colors",
                            form.draft.schedule_config?.execution_type === value
                              ? "border-[#2773ff] bg-blue-50 font-medium text-[#2773ff]"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {form.draft.schedule_config.execution_type === "schedule" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-sm text-slate-700">频率</Label>
                          <Select
                            value={form.draft.schedule_config.frequency}
                            onValueChange={(value) =>
                              updateSchedule({
                                frequency: value as "daily" | "weekly",
                              })
                            }
                            options={[
                              { value: "daily", label: "每天" },
                              { value: "weekly", label: "每周" },
                            ]}
                            className="h-8 rounded-[4px] border-slate-300 bg-white shadow-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm text-slate-700">执行时间</Label>
                          <Input
                            type="time"
                            value={form.draft.schedule_config.time}
                            onChange={(event) =>
                              updateSchedule({ time: event.target.value })
                            }
                            className="h-8 rounded-[4px] border-slate-300 shadow-none"
                          />
                        </div>
                      </div>
                    ) : null}

                    {form.draft.schedule_config.execution_type === "interval" ? (
                      <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">
                          每隔多少小时执行一次
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={form.draft.schedule_config.interval_value}
                          onChange={(event) =>
                            updateSchedule({
                              interval_value: Number(event.target.value) || 1,
                            })
                          }
                          className="h-8 rounded-[4px] border-slate-300 shadow-none"
                        />
                      </div>
                    ) : null}

                    {form.draft.schedule_config.execution_type === "once" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-sm text-slate-700">执行日期</Label>
                          <Input
                            type="date"
                            value={form.draft.schedule_config.run_at_date}
                            onChange={(event) =>
                              updateSchedule({ run_at_date: event.target.value })
                            }
                            className="h-8 rounded-[4px] border-slate-300 shadow-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm text-slate-700">执行时间</Label>
                          <Input
                            type="time"
                            value={form.draft.schedule_config.run_at_time}
                            onChange={(event) =>
                              updateSchedule({ run_at_time: event.target.value })
                            }
                            className="h-8 rounded-[4px] border-slate-300 shadow-none"
                          />
                        </div>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {form.kind === "poll" && form.draft.event_config ? (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Poll 检查配置
                    </h3>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-slate-700">检查目标名称</Label>
                      <Input
                        value={form.draft.event_config.target_name || ""}
                        onChange={(event) =>
                          updateEvent({ target_name: event.target.value })
                        }
                        placeholder="例如：价格聚合接口"
                        className="h-8 rounded-[4px] border-slate-300 shadow-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-slate-700">接口地址 URL</Label>
                      <Input
                        value={form.draft.event_config.url || ""}
                        onChange={(event) => updateEvent({ url: event.target.value })}
                        placeholder="https://api.example.com/status"
                        className="h-8 rounded-[4px] border-slate-300 shadow-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-slate-700">检查频率</Label>
                      <Input
                        value={form.draft.event_config.frequency || ""}
                        onChange={(event) =>
                          updateEvent({ frequency: event.target.value })
                        }
                        placeholder="例如：每 30 分钟"
                        className="h-8 rounded-[4px] border-slate-300 shadow-none"
                      />
                    </div>
                  </section>
                ) : null}
              </div>

              <DialogFooter className="border-t border-slate-100 px-6 py-4">
                <ManagementSecondaryButton type="button" onClick={() => setForm(null)}>
                  取消
                </ManagementSecondaryButton>
                <ManagementPrimaryButton
                  type="button"
                  className="bg-[#2773ff] hover:bg-[#1f63e0]"
                  onClick={handleSave}
                >
                  {form.mode === "edit" ? "保存修改" : "创建任务"}
                </ManagementPrimaryButton>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
