"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCollaboration } from "./collaboration-provider";
import { ActorAvatar } from "./shared/actor-avatar";

interface CreateProjectDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({
  workspaceId,
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const { state, currentUserId, createProject } = useCollaboration();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leadUserId, setLeadUserId] = useState(currentUserId);
  const [memberIds, setMemberIds] = useState<string[]>([currentUserId]);
  const [actorIds, setActorIds] = useState<string[]>([]);
  const [brief, setBrief] = useState("");

  const workspaceActors = useMemo(
    () => state.actors.filter((actor) => actor.workspaceId === workspaceId),
    [state.actors, workspaceId]
  );

  const leadOptions = state.users.map((user) => ({
    value: user.id,
    label: user.name,
  }));

  const reset = () => {
    setName("");
    setDescription("");
    setLeadUserId(currentUserId);
    setMemberIds([currentUserId]);
    setActorIds([]);
    setBrief("");
  };

  const toggleMember = (userId: string) => {
    setMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleActor = (actorId: string) => {
    setActorIds((prev) =>
      prev.includes(actorId)
        ? prev.filter((id) => id !== actorId)
        : [...prev, actorId]
    );
  };

  const handleCreate = () => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName || !trimmedDescription) {
      toast.error("请填写项目名称与说明");
      return;
    }
    const members = Array.from(
      new Set([leadUserId, ...memberIds.filter(Boolean)])
    );
    const projectId = createProject({
      workspaceId,
      name: trimmedName,
      description: trimmedDescription,
      leadUserId,
      memberIds: members,
      actorIds,
      contextBrief: brief.trim() || undefined,
    });
    toast.success("项目已创建");
    onOpenChange(false);
    reset();
    router.push(`/my-claw/workspaces/${workspaceId}/projects/${projectId}`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新建协作项目</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-700">
              项目名称 <span className="text-rose-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：发布保障协作"
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-700">
              项目说明 <span className="text-rose-500">*</span>
            </label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="简要描述项目目标与协作范围"
              className="min-h-[72px] resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-700">
              Project Lead
            </label>
            <Select
              value={leadUserId}
              onValueChange={setLeadUserId}
              options={leadOptions}
              placeholder="选择负责人"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-700">
              初始 Human 成员
            </label>
            <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-[#e2e8f0] p-2">
              {state.users.map((user) => (
                <label
                  key={user.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-[#f8f9fb]"
                >
                  <Checkbox
                    checked={memberIds.includes(user.id)}
                    onCheckedChange={() => toggleMember(user.id)}
                  />
                  <ActorAvatar name={user.name} type="human" size="sm" />
                  <span className="text-[13px] text-slate-800">{user.name}</span>
                  <span className="text-[11px] text-[#5a6779]">
                    {user.roleLabel}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-700">
              初始 Agent
            </label>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[#e2e8f0] p-2">
              {workspaceActors.length === 0 ? (
                <p className="px-2 py-3 text-[12px] text-[#5a6779]">
                  当前空间暂无可用 Agent
                </p>
              ) : (
                workspaceActors.map((actor) => (
                  <label
                    key={actor.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-[#f8f9fb]"
                  >
                    <Checkbox
                      checked={actorIds.includes(actor.id)}
                      onCheckedChange={() => toggleActor(actor.id)}
                    />
                    <ActorAvatar
                      name={actor.name}
                      type={actor.type}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] text-slate-800">
                        {actor.name}
                      </div>
                      <div className="truncate text-[11px] text-[#5a6779]">
                        {actor.sourceLabel}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-700">
              项目上下文 Brief（可选）
            </label>
            <Textarea
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder="目标、协作规则、交付标准…"
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#e2e8f0]"
          >
            取消
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-[#2773ff] hover:bg-[#1f63e0]"
          >
            创建项目
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
