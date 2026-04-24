"use client";

import { useMemo, useState } from "react";
import { Clock, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  AUTOMATED_TASK_DELIVERY_CHANNELS,
  AUTOMATED_TASK_DELIVERY_CONVERSATIONS_SAMPLE,
  type AutomatedTaskDeliveryChannel,
  type AutomatedTaskDeliveryLocation,
  type ClawAutomatedTaskItem,
} from "@/lib/mock/claw-hub-next";

export type AutomatedTaskExecutionMode = "scheduled" | "interval" | "once";

export interface CreateAutomatedTaskPayload {
  item: ClawAutomatedTaskItem;
}

const EXECUTION_TABS: { id: AutomatedTaskExecutionMode; label: string }[] = [
  { id: "scheduled", label: "定时执行" },
  { id: "interval", label: "间隔执行" },
  { id: "once", label: "单次执行" },
];

const WEEKDAY_OPTIONS = [
  { value: "1", label: "周一" },
  { value: "2", label: "周二" },
  { value: "3", label: "周三" },
  { value: "4", label: "周四" },
  { value: "5", label: "周五" },
  { value: "6", label: "周六" },
  { value: "0", label: "周日" },
];

const DEFAULT_WEEKDAYS_MON_FRI = ["1", "2", "3", "4", "5"];

const WEEK_ORDER = ["1", "2", "3", "4", "5", "6", "0"] as const;

function sortWeekDayValues(values: string[]): string[] {
  return [...values].sort((a, b) => WEEK_ORDER.indexOf(a as (typeof WEEK_ORDER)[number]) - WEEK_ORDER.indexOf(b as (typeof WEEK_ORDER)[number]));
}

function formatWeeklyTriggerSummary(weekDays: string[], executionTime: string): string {
  const sorted = sortWeekDayValues(weekDays);
  if (sorted.length === 0) {
    return `每周 ${executionTime}`;
  }
  const shorts = sorted.map(
    (v) => WEEKDAY_OPTIONS.find((o) => o.value === v)?.label.replace(/^周/, "") ?? ""
  );
  const isMonFri =
    sorted.length === 5 && ["1", "2", "3", "4", "5"].every((d) => sorted.includes(d));
  const daysPart = isMonFri ? "每周一至周五" : `每周${shorts.join("、")}`;
  return `${daysPart} ${executionTime}`;
}

function appendEffectiveRange(summary: string, start: string, end: string): string {
  if (start && end) {
    return `${summary}（${start} 至 ${end}）`;
  }
  return summary;
}

const PRIMARY_DELIVERY_CHANNEL = "AF平台" as const satisfies AutomatedTaskDeliveryChannel;
const CONFIGURED_DELIVERY_CHANNELS = AUTOMATED_TASK_DELIVERY_CHANNELS.filter((c) => c !== PRIMARY_DELIVERY_CHANNEL);

function formatSessionUpdatedDisplay(iso: string): string {
  return iso.replace("T", " ").slice(0, 16);
}

/** 选中会话后回填到搜索框的展示格式（与列表副文案一致，便于识别） */
function formatConversationBackfill(c: { name: string; id: string }): string {
  return `${c.name} · ${c.id}`;
}

function buildTaskFromForm(state: {
  name: string;
  description: string;
  executionPrompt: string;
  deliveryChannel: AutomatedTaskDeliveryChannel;
  deliveryLocation: AutomatedTaskDeliveryLocation;
  deliveryConversationId: string | null;
  executionMode: AutomatedTaskExecutionMode;
  scheduleFrequency: "daily" | "weekly";
  weekDays: string[];
  executionTime: string;
  effectiveDateStart: string;
  effectiveDateEnd: string;
  intervalHours: string;
  onceDateTime: string;
}): ClawAutomatedTaskItem {
  const triggerKind =
    state.executionMode === "scheduled"
      ? "定时执行"
      : state.executionMode === "interval"
        ? "间隔执行"
        : "单次执行";

  const descriptionText =
    state.description.trim() ||
    (state.executionPrompt.trim()
      ? `${state.executionPrompt.trim().slice(0, 120)}${state.executionPrompt.length > 120 ? "…" : ""}`
      : state.name.trim());

  let triggerSummary = "";
  if (state.executionMode === "scheduled") {
    if (state.scheduleFrequency === "daily") {
      triggerSummary = `每天 ${state.executionTime}`;
    } else {
      triggerSummary = formatWeeklyTriggerSummary(state.weekDays, state.executionTime);
    }
    triggerSummary = appendEffectiveRange(triggerSummary, state.effectiveDateStart, state.effectiveDateEnd);
  } else if (state.executionMode === "interval") {
    const h = Number.parseInt(state.intervalHours, 10);
    const base = Number.isFinite(h) && h > 0 ? `每 ${h} 小时` : "每 6 小时";
    triggerSummary = appendEffectiveRange(base, state.effectiveDateStart, state.effectiveDateEnd);
  } else {
    triggerSummary = state.onceDateTime
      ? `单次: ${state.onceDateTime.replace("T", " ")}`
      : "单次执行（待设定时间）";
  }

  return {
    id: `auto-task-${crypto.randomUUID()}`,
    name: state.name.trim(),
    description: descriptionText,
    triggerSummary,
    triggerKind,
    deliveryChannel: state.deliveryChannel,
    deliveryLocation: state.deliveryLocation,
    deliveryConversationId: state.deliveryLocation === "existing" ? state.deliveryConversationId : null,
    lastExecutedAt: null,
    recentResult: "never",
    enabled: true,
  };
}

type CreateAutomatedTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 打开时的默认触发类型（与「新建任务」下拉一致） */
  initialExecutionMode?: AutomatedTaskExecutionMode;
  onCreated?: (payload: CreateAutomatedTaskPayload) => void;
};

export function CreateAutomatedTaskDialog({
  open,
  onOpenChange,
  initialExecutionMode = "scheduled",
  onCreated,
}: CreateAutomatedTaskDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [executionPrompt, setExecutionPrompt] = useState("");
  const [deliveryChannel, setDeliveryChannel] = useState<AutomatedTaskDeliveryChannel>(PRIMARY_DELIVERY_CHANNEL);
  const [deliveryLocation, setDeliveryLocation] = useState<AutomatedTaskDeliveryLocation>("dedicated");
  const [deliveryConversationId, setDeliveryConversationId] = useState<string>("");
  const [conversationQuery, setConversationQuery] = useState("");
  const [executionMode, setExecutionMode] = useState<AutomatedTaskExecutionMode>(initialExecutionMode);
  const [scheduleFrequency, setScheduleFrequency] = useState<"daily" | "weekly">("daily");
  const [weekDays, setWeekDays] = useState<string[]>(() => [...DEFAULT_WEEKDAYS_MON_FRI]);
  const [executionTime, setExecutionTime] = useState("09:00");
  const [effectiveDateStart, setEffectiveDateStart] = useState("");
  const [effectiveDateEnd, setEffectiveDateEnd] = useState("");
  const [intervalHours, setIntervalHours] = useState("6");
  const [onceDateTime, setOnceDateTime] = useState("");

  const sortedConversations = useMemo(() => {
    return [...AUTOMATED_TASK_DELIVERY_CONVERSATIONS_SAMPLE].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
  }, []);

  const filteredConversations = useMemo(() => {
    const raw = conversationQuery.trim();
    const q = raw.toLowerCase();
    if (!q) {
      return sortedConversations;
    }
    const selected =
      deliveryConversationId !== ""
        ? sortedConversations.find((c) => c.id === deliveryConversationId)
        : undefined;
    if (selected && raw === formatConversationBackfill(selected)) {
      return sortedConversations;
    }
    return sortedConversations.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [conversationQuery, deliveryConversationId, sortedConversations]);

  function resetFormForOpen() {
    setName("");
    setDescription("");
    setExecutionPrompt("");
    setDeliveryChannel(PRIMARY_DELIVERY_CHANNEL);
    setDeliveryLocation("dedicated");
    setDeliveryConversationId("");
    setConversationQuery("");
    setExecutionMode(initialExecutionMode);
    setScheduleFrequency("daily");
    setWeekDays([...DEFAULT_WEEKDAYS_MON_FRI]);
    setExecutionTime("09:00");
    setEffectiveDateStart("");
    setEffectiveDateEnd("");
    setIntervalHours("6");
    setOnceDateTime("");
  }

  function handleDialogOpenChange(next: boolean) {
    if (next) {
      resetFormForOpen();
    }
    onOpenChange(next);
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("请填写任务名称。");
      return;
    }
    if (!executionPrompt.trim()) {
      toast.error("请填写任务执行提示词。");
      return;
    }
    if (executionMode === "interval") {
      const h = Number.parseInt(intervalHours, 10);
      if (!Number.isFinite(h) || h < 1) {
        toast.error("请填写有效的间隔小时数。");
        return;
      }
    }
    if (executionMode === "once" && !onceDateTime.trim()) {
      toast.error("请选择单次执行时间。");
      return;
    }
    if (executionMode === "scheduled" && scheduleFrequency === "weekly" && weekDays.length === 0) {
      toast.error("请至少选择一个星期。");
      return;
    }
    if (deliveryLocation === "existing" && !deliveryConversationId.trim()) {
      toast.error("请选择已有会话。");
      return;
    }

    const item = buildTaskFromForm({
      name,
      description,
      executionPrompt,
      deliveryChannel,
      deliveryLocation,
      deliveryConversationId: deliveryLocation === "existing" ? deliveryConversationId.trim() : null,
      executionMode,
      scheduleFrequency,
      weekDays,
      executionTime,
      effectiveDateStart,
      effectiveDateEnd,
      intervalHours,
      onceDateTime,
    });

    onCreated?.({ item });
    toast.success("任务已创建。");
    handleDialogOpenChange(false);
  }

  const dialogTitle =
    executionMode === "scheduled"
      ? "新建自动化任务"
      : executionMode === "interval"
        ? "新建间隔任务"
        : "新建单次任务";

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(92vh,880px)] max-w-[640px] flex-col gap-0 overflow-hidden rounded-lg border-slate-200 p-0 sm:max-w-[640px]"
      >
        <DialogHeader className="shrink-0 border-b border-slate-200 px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold text-slate-950">{dialogTitle}</DialogTitle>
        </DialogHeader>

        <TooltipProvider delayDuration={0}>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div>
              <div>
                <h3 className="mb-4 text-base font-semibold text-slate-950">基础信息</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="auto-task-name" className="text-sm text-slate-800">
                      <span className="mr-1 text-rose-500">*</span>
                      任务名称
                    </Label>
                    <Input
                      id="auto-task-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="例如：每日销售简报"
                      className="h-9 border-slate-200 shadow-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auto-task-desc" className="text-sm text-slate-800">
                      任务描述
                    </Label>
                    <Textarea
                      id="auto-task-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="补充任务概述、任务背景、产出说明等，用于识别自动化任务"
                      className="min-h-[88px] resize-y border-slate-200 text-sm shadow-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="auto-task-prompt" className="text-sm text-slate-800">
                        <span className="mr-1 text-rose-500">*</span>
                        任务执行提示词
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="提示词说明"
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                          面向 Agent 的自然语言指令，说明本次自动化要读取的数据、产出格式与投递对象。
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Textarea
                      id="auto-task-prompt"
                      value={executionPrompt}
                      onChange={(e) => setExecutionPrompt(e.target.value)}
                      placeholder="例如：读取昨日日报数据，生成晨会摘要并发送给销售负责人"
                      className="min-h-[120px] resize-y border-slate-200 text-sm shadow-none"
                    />
                  </div>
                </div>
              </div>

              <div className="my-6 h-px w-full bg-slate-200/90" aria-hidden />

              <div>
                <h3 className="mb-4 text-base font-semibold text-slate-950">触发频率与时间</h3>

                <div className="mb-4 grid grid-cols-3 gap-2">
                  {EXECUTION_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setExecutionMode(tab.id)}
                      className={cn(
                        "rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
                        executionMode === tab.id
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {executionMode === "scheduled" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-800">
                        <span className="mr-1 text-rose-500">*</span>
                        频率
                      </Label>
                      <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() => setScheduleFrequency("daily")}
                          className={cn(
                            "rounded px-4 py-1.5 text-sm font-medium",
                            scheduleFrequency === "daily" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          每天
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setScheduleFrequency("weekly");
                            setWeekDays((current) =>
                              current.length > 0 ? current : [...DEFAULT_WEEKDAYS_MON_FRI]
                            );
                          }}
                          className={cn(
                            "rounded px-4 py-1.5 text-sm font-medium",
                            scheduleFrequency === "weekly" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          每周
                        </button>
                      </div>
                    </div>

                    {scheduleFrequency === "weekly" ? (
                      <div className="space-y-2">
                        <Label className="text-sm text-slate-800">
                          <span className="mr-1 text-rose-500">*</span>
                          星期
                          <span className="ml-1 font-normal text-slate-400">（可多选）</span>
                        </Label>
                        <div className="flex flex-wrap gap-2" role="group" aria-label="选择星期">
                          {WEEKDAY_OPTIONS.map((o) => {
                            const selected = weekDays.includes(o.value);
                            return (
                              <button
                                key={o.value}
                                type="button"
                                onClick={() => {
                                  setWeekDays((prev) => {
                                    if (prev.includes(o.value)) {
                                      return sortWeekDayValues(prev.filter((v) => v !== o.value));
                                    }
                                    return sortWeekDayValues([...prev, o.value]);
                                  });
                                }}
                                className={cn(
                                  "min-w-[52px] rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                                  selected
                                    ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                )}
                              >
                                {o.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="auto-task-time" className="text-sm text-slate-800">
                        <span className="mr-1 text-rose-500">*</span>
                        执行时间
                      </Label>
                      <div className="relative max-w-[200px]">
                        <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="auto-task-time"
                          type="time"
                          value={executionTime}
                          onChange={(e) => setExecutionTime(e.target.value)}
                          className="h-9 border-slate-200 pl-9 shadow-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-slate-800">
                        生效日期区间
                        <span className="ml-1 font-normal text-slate-400">（可选，留空表示始终生效。）</span>
                      </Label>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          type="date"
                          value={effectiveDateStart}
                          onChange={(e) => setEffectiveDateStart(e.target.value)}
                          className="h-9 max-w-[160px] border-slate-200 shadow-none"
                        />
                        <span className="text-sm text-slate-500">至</span>
                        <Input
                          type="date"
                          value={effectiveDateEnd}
                          onChange={(e) => setEffectiveDateEnd(e.target.value)}
                          className="h-9 max-w-[160px] border-slate-200 shadow-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {executionMode === "interval" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="auto-task-interval" className="text-sm text-slate-800">
                        <span className="mr-1 text-rose-500">*</span>
                        间隔（小时）
                      </Label>
                      <Input
                        id="auto-task-interval"
                        type="number"
                        min={1}
                        max={168}
                        value={intervalHours}
                        onChange={(e) => setIntervalHours(e.target.value)}
                        className="h-9 max-w-[200px] border-slate-200 shadow-none"
                      />
                      <p className="text-xs text-slate-500">按固定间隔重复执行，例如每 6 小时巡检一次。</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-800">
                        生效日期区间
                        <span className="ml-1 font-normal text-slate-400">（可选，留空表示始终生效。）</span>
                      </Label>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          type="date"
                          value={effectiveDateStart}
                          onChange={(e) => setEffectiveDateStart(e.target.value)}
                          className="h-9 max-w-[160px] border-slate-200 shadow-none"
                        />
                        <span className="text-sm text-slate-500">至</span>
                        <Input
                          type="date"
                          value={effectiveDateEnd}
                          onChange={(e) => setEffectiveDateEnd(e.target.value)}
                          className="h-9 max-w-[160px] border-slate-200 shadow-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {executionMode === "once" ? (
                  <div className="space-y-2">
                    <Label htmlFor="auto-task-once" className="text-sm text-slate-800">
                      <span className="mr-1 text-rose-500">*</span>
                      执行时间
                    </Label>
                    <Input
                      id="auto-task-once"
                      type="datetime-local"
                      value={onceDateTime}
                      onChange={(e) => setOnceDateTime(e.target.value)}
                      className="h-9 max-w-[280px] border-slate-200 shadow-none"
                    />
                  </div>
                ) : null}
              </div>

              <div className="my-6 h-px w-full bg-slate-200/90" aria-hidden />

              <div>
                <h3 className="mb-4 text-base font-semibold text-slate-950">任务交付</h3>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="auto-task-delivery" className="text-sm text-slate-800">
                        <span className="mr-1 text-rose-500">*</span>
                        交付位置（渠道）
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="交付位置（渠道）说明"
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                          希望收到该条交付消息的渠道
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <select
                      id="auto-task-delivery"
                      value={deliveryChannel}
                      onChange={(e) => setDeliveryChannel(e.target.value as AutomatedTaskDeliveryChannel)}
                      className="h-9 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-none"
                    >
                      <option value={PRIMARY_DELIVERY_CHANNEL}>{PRIMARY_DELIVERY_CHANNEL}</option>
                      <optgroup label="已配置渠道">
                        {CONFIGURED_DELIVERY_CHANNELS.map((ch) => (
                          <option key={ch} value={ch}>
                            {ch}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-sm text-slate-800">
                        <span className="mr-1 text-rose-500">*</span>
                        会话
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="会话说明"
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                          将该任务的消息发送至指定会话
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <RadioGroup
                      value={deliveryLocation}
                      onValueChange={(v) => {
                        const next = v as AutomatedTaskDeliveryLocation;
                        setDeliveryLocation(next);
                        if (next === "dedicated") {
                          setDeliveryConversationId("");
                          setConversationQuery("");
                        }
                      }}
                      className="space-y-2"
                    >
                      <div
                        className={cn(
                          "cursor-pointer rounded-lg border p-3 transition-colors",
                          deliveryLocation === "dedicated"
                            ? "border-blue-600 bg-blue-50/80"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                        onClick={() => {
                          setDeliveryLocation("dedicated");
                          setDeliveryConversationId("");
                          setConversationQuery("");
                        }}
                      >
                        <div className="flex items-start gap-2.5">
                          <RadioGroupItem value="dedicated" id="delivery-loc-dedicated" className="mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Label htmlFor="delivery-loc-dedicated" className="cursor-pointer text-sm font-medium text-slate-900">
                                自动化任务独立会话（推荐）
                              </Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-white/80 hover:text-slate-600"
                                    aria-label="说明"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <HelpCircle className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                                  新建独立会话用于该任务执行，便于会话管理与上下文管理
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "cursor-pointer rounded-lg border p-3 transition-colors",
                          deliveryLocation === "existing"
                            ? "border-blue-600 bg-blue-50/80"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                        onClick={() => setDeliveryLocation("existing")}
                      >
                        <div className="flex items-start gap-2.5">
                          <RadioGroupItem value="existing" id="delivery-loc-existing" className="mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <Label htmlFor="delivery-loc-existing" className="cursor-pointer text-sm font-medium text-slate-900">
                              已有
                            </Label>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>

                    {deliveryLocation === "existing" ? (
                      <div className="relative z-10 mt-2 space-y-2 border-l-2 border-slate-200 pl-4 sm:pl-5">
                        <p className="text-xs leading-relaxed text-slate-600">
                          选择已有会话后，需进一步选择支持输入会话。
                        </p>
                        <Input
                          placeholder="搜索名称或会话 ID，点选下方会话后回填"
                          value={conversationQuery}
                          onChange={(e) => {
                            const v = e.target.value;
                            setConversationQuery(v);
                            if (deliveryConversationId) {
                              const sel = sortedConversations.find((c) => c.id === deliveryConversationId);
                              if (sel && v !== formatConversationBackfill(sel)) {
                                setDeliveryConversationId("");
                              }
                            }
                          }}
                          className="h-9 border-slate-200 text-sm shadow-none"
                        />
                        <div className="max-h-[220px] overflow-y-auto rounded-md border border-slate-200 bg-white">
                          {filteredConversations.length === 0 ? (
                            <div className="px-3 py-6 text-center text-xs text-slate-500">无匹配会话</div>
                          ) : (
                            <ul className="divide-y divide-slate-100" role="listbox" aria-label="会话列表">
                              {filteredConversations.map((c) => {
                                const selected = deliveryConversationId === c.id;
                                function selectThisSession() {
                                  setDeliveryConversationId(c.id);
                                  setConversationQuery(formatConversationBackfill(c));
                                }
                                return (
                                  <li key={c.id}>
                                    <button
                                      type="button"
                                      role="option"
                                      aria-selected={selected}
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        selectThisSession();
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        selectThisSession();
                                      }}
                                      className={cn(
                                        "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50",
                                        selected && "bg-blue-50/90"
                                      )}
                                    >
                                      <span className="font-medium text-slate-900">{c.name}</span>
                                      <span className="text-xs text-slate-500">
                                        {c.id} · 更新时间 {formatSessionUpdatedDisplay(c.updatedAt)}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TooltipProvider>

        <DialogFooter className="shrink-0 gap-2 border-t border-slate-200 px-6 py-4">
          <Button type="button" variant="outline" className="border-slate-200" onClick={() => handleDialogOpenChange(false)}>
            取消
          </Button>
          <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleSubmit}>
            创建任务
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
