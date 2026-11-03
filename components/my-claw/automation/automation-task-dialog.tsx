"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useMyClaw } from "@/components/my-claw/provider";
import { ManagementPrimaryButton, ManagementSecondaryButton } from "@/components/management/management-list";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AUTOMATION_DELIVERY_CHANNELS,
  buildTriggerSummary,
  createTaskId,
  getClawSelectOptions,
  type AutomationDeliveryChannel,
  type AutomationTask,
} from "@/lib/mock/my-claw/automation";
import { cn } from "@/lib/utils";

export type CreateKind = "cron" | "poll";

export interface TaskFormState {
  kind: CreateKind;
  mode: "create" | "edit";
  draft: AutomationTask;
}

export const CHANNEL_OPTIONS = AUTOMATION_DELIVERY_CHANNELS.map((channel) => ({
  value: channel,
  label: channel,
}));

export function cloneTask(task: AutomationTask): AutomationTask {
  return JSON.parse(JSON.stringify(task)) as AutomationTask;
}

/** 新建 / 编辑自动化任务的弹窗：自动化页面和对话里的定时任务卡片共用。 */
export function AutomationTaskDialog({
  form,
  onFormChange: setForm,
}: {
  form: TaskFormState | null;
  onFormChange: React.Dispatch<React.SetStateAction<TaskFormState | null>>;
}) {
  const { upsertAutomationTask } = useMyClaw();

  const clawOptions = useMemo(
    () => getClawSelectOptions(form?.draft.claw_id),
    [form?.draft.claw_id]
  );

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

  return (
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
  );
}
