"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  BOARD_COLUMNS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_LABELS,
  type ExecutorRef,
  type IssuePriority,
  type IssueStatus,
} from "@/lib/mock/my-claw/collaboration";
import { useCollaboration } from "../collaboration-provider";

export interface IssueCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  projectId: string;
  onCreated?: (issueId: string) => void;
}

interface FormState {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: IssueStatus;
  priority: IssuePriority;
  ownerUserId: string;
  executorKind: "human" | "agent" | "squad" | "none";
  executorId: string;
  reviewerUserId: string;
  attachmentName: string;
}

const STATUS_OPTIONS = BOARD_COLUMNS.map((status) => ({
  value: status,
  label: ISSUE_STATUS_LABELS[status],
}));

const PRIORITY_OPTIONS = (
  Object.keys(ISSUE_PRIORITY_LABELS) as IssuePriority[]
).map((priority) => ({
  value: priority,
  label: ISSUE_PRIORITY_LABELS[priority],
}));

export function IssueCreateDialog({
  open,
  onOpenChange,
  workspaceId,
  projectId,
  onCreated,
}: IssueCreateDialogProps) {
  const {
    currentUserId,
    getProject,
    getUser,
    getActor,
    getSquad,
    state,
    createIssue,
  } = useCollaboration();
  const project = getProject(projectId);

  const initialForm = useMemo<FormState>(
    () => ({
      title: "",
      description: "",
      acceptanceCriteria: [""],
      status: "todo",
      priority: "medium",
      ownerUserId: currentUserId,
      executorKind: "none",
      executorId: "",
      reviewerUserId: project?.leadUserId ?? currentUserId,
      attachmentName: "",
    }),
    [currentUserId, project?.leadUserId]
  );

  const [form, setForm] = useState<FormState>(initialForm);

  const memberOptions = useMemo(
    () =>
      (project?.memberIds ?? []).map((id) => ({
        value: id,
        label: getUser(id)?.name ?? id,
      })),
    [getUser, project?.memberIds]
  );

  const actorOptions = useMemo(
    () =>
      (project?.actorIds ?? [])
        .map((id) => getActor(id))
        .filter((actor): actor is NonNullable<typeof actor> => Boolean(actor))
        .map((actor) => ({
          value: actor.id,
          label: actor.name,
        })),
    [getActor, project?.actorIds]
  );

  const squadOptions = useMemo(
    () =>
      state.squads
        .filter((squad) => squad.projectId === projectId)
        .map((squad) => ({
          value: squad.id,
          label: squad.name,
        })),
    [projectId, state.squads]
  );

  const resetAndClose = (nextOpen: boolean) => {
    if (!nextOpen) setForm(initialForm);
    onOpenChange(nextOpen);
  };

  const buildExecutor = (): ExecutorRef | null => {
    if (form.executorKind === "none" || !form.executorId) return null;
    return { kind: form.executorKind, id: form.executorId };
  };

  const handleSubmit = () => {
    const title = form.title.trim();
    if (!title) {
      toast.error("请填写标题");
      return;
    }
    const acceptanceCriteria = form.acceptanceCriteria
      .map((item) => item.trim())
      .filter(Boolean);
    const executor = buildExecutor();
    if (
      (form.executorKind === "agent" || form.executorKind === "squad") &&
      !executor
    ) {
      toast.error("请选择 Executor");
      return;
    }

    const issueId = createIssue({
      workspaceId,
      projectId,
      title,
      description: form.description.trim(),
      acceptanceCriteria,
      status: form.status,
      priority: form.priority,
      ownerUserId: form.ownerUserId,
      executor,
      reviewerUserId: form.reviewerUserId || null,
    });

    const executorLabelText =
      executor?.kind === "agent"
        ? getActor(executor.id)?.name
        : executor?.kind === "squad"
          ? getSquad(executor.id)?.name
          : executor?.kind === "human"
            ? getUser(executor.id)?.name
            : null;

    toast.success(
      executor && (executor.kind === "agent" || executor.kind === "squad")
        ? `已创建 Issue，并指派给 ${executorLabelText ?? "执行者"} 开始执行`
        : "Issue 已创建"
    );
    resetAndClose(false);
    onCreated?.(issueId);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>新建 Issue</DialogTitle>
          <DialogDescription>
            填写业务信息。Executor 为 Agent / Squad 时会自动创建 Run。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <Field label="标题">
            <Input
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="简要描述要完成的事项"
            />
          </Field>

          <Field label="描述">
            <Textarea
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="背景、范围与上下文"
              className="min-h-[88px]"
            />
          </Field>

          <Field label="验收标准">
            <div className="space-y-2">
              {form.acceptanceCriteria.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(event) =>
                      setForm((prev) => {
                        const next = [...prev.acceptanceCriteria];
                        next[index] = event.target.value;
                        return { ...prev, acceptanceCriteria: next };
                      })
                    }
                    placeholder={`标准 ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={form.acceptanceCriteria.length <= 1}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        acceptanceCriteria: prev.acceptanceCriteria.filter(
                          (_, i) => i !== index
                        ),
                      }))
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    acceptanceCriteria: [...prev.acceptanceCriteria, ""],
                  }))
                }
              >
                <Plus className="h-3.5 w-3.5" />
                添加标准
              </Button>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="状态">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    status: value as IssueStatus,
                  }))
                }
                options={STATUS_OPTIONS}
              />
            </Field>
            <Field label="优先级">
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: value as IssuePriority,
                  }))
                }
                options={PRIORITY_OPTIONS}
              />
            </Field>
          </div>

          <Field label="Human Owner">
            <Select
              value={form.ownerUserId}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, ownerUserId: value }))
              }
              options={memberOptions}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Executor 类型">
              <Select
                value={form.executorKind}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    executorKind: value as FormState["executorKind"],
                    executorId: "",
                  }))
                }
                options={[
                  { value: "none", label: "未指派" },
                  { value: "human", label: "Human" },
                  { value: "agent", label: "Agent" },
                  { value: "squad", label: "Squad" },
                ]}
              />
            </Field>
            <Field label="Executor">
              <Select
                value={form.executorId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, executorId: value }))
                }
                placeholder={
                  form.executorKind === "none" ? "无需选择" : "请选择"
                }
                options={
                  form.executorKind === "human"
                    ? memberOptions
                    : form.executorKind === "agent"
                      ? actorOptions
                      : form.executorKind === "squad"
                        ? squadOptions
                        : []
                }
                className={
                  form.executorKind === "none"
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            </Field>
          </div>

          <Field label="Reviewer">
            <Select
              value={form.reviewerUserId}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, reviewerUserId: value }))
              }
              options={memberOptions}
            />
          </Field>

          <Field label="附件（占位）">
            <Input
              value={form.attachmentName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  attachmentName: event.target.value,
                }))
              }
              placeholder="选择或粘贴附件名称（原型占位）"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => resetAndClose(false)}>
            取消
          </Button>
          <Button
            className="bg-[#2773ff] hover:bg-[#1f63e0]"
            onClick={handleSubmit}
          >
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-medium text-[#5a6779]">{label}</label>
      {children}
    </div>
  );
}
