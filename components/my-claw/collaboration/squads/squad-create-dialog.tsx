"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SquadAgentMember } from "@/lib/mock/my-claw/collaboration";
import { useCollaboration } from "../collaboration-provider";
import { ActorAvatar } from "../shared/actor-avatar";
import {
  SquadMemberPicker,
  memberStateForActor,
} from "./squad-member-picker";

interface SquadCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  projectId: string;
}

export function SquadCreateDialog({
  open,
  onOpenChange,
  workspaceId,
  projectId,
}: SquadCreateDialogProps) {
  const router = useRouter();
  const { state, createSquad, getActor, validateSquadComposition } =
    useCollaboration();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [leaderActorId, setLeaderActorId] = useState<string>("");

  const candidates = useMemo(
    () => state.actors.filter((actor) => actor.workspaceId === workspaceId),
    [state.actors, workspaceId]
  );

  const selectedMembers: SquadAgentMember[] = useMemo(
    () =>
      selectedIds.map((actorId) => {
        const actor = getActor(actorId);
        return {
          actorId,
          state: actor ? memberStateForActor(actor) : "active",
          roleLabel: "成员",
        };
      }),
    [selectedIds, getActor]
  );

  const activeMemberIds = selectedMembers
    .filter((member) => member.state === "active")
    .map((member) => member.actorId);

  const reset = () => {
    setStep(1);
    setName("");
    setDescription("");
    setSelectedIds([]);
    setLeaderActorId("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const toggleMember = (actorId: string) => {
    setSelectedIds((current) => {
      const next = current.includes(actorId)
        ? current.filter((id) => id !== actorId)
        : [...current, actorId];
      if (leaderActorId && !next.includes(leaderActorId)) {
        setLeaderActorId("");
      }
      return next;
    });
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("请填写小队名称");
      return;
    }
    if (selectedMembers.length < 2) {
      toast.error("至少选择 2 名 Agent");
      return;
    }
    if (!leaderActorId || !activeMemberIds.includes(leaderActorId)) {
      toast.error("请从已确认 Agent 中选择 Leader");
      return;
    }

    const composition = validateSquadComposition(selectedMembers);
    if (!composition.ok) {
      toast.error(composition.message);
      return;
    }

    const agentMembers = selectedMembers.map((member) =>
      member.actorId === leaderActorId
        ? { ...member, roleLabel: "Leader" }
        : member
    );

    const id = createSquad({
      workspaceId,
      projectId,
      name: name.trim(),
      description: description.trim(),
      leaderActorId,
      agentMembers,
    });

    if (!id) {
      toast.error(composition.message);
      return;
    }

    toast.success(`已创建小队「${name.trim()}」`);
    handleOpenChange(false);
    router.push(
      `/my-claw/workspaces/${workspaceId}/projects/${projectId}/squads/${id}`
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>创建小队</DialogTitle>
          <DialogDescription>
            以 Agent 为执行成员；选择个人 Claw 时将自动派生对应 Human
          </DialogDescription>
        </DialogHeader>

        <div className="mb-1 flex items-center gap-2 text-[12px] text-[#5a6779]">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={
                step === n
                  ? "font-medium text-[#2773ff]"
                  : step > n
                    ? "text-slate-700"
                    : undefined
              }
            >
              {n === 1 ? "基本信息" : n === 2 ? "选择 Agent" : "设置 Leader"}
              {n < 3 ? " / " : null}
            </span>
          ))}
        </div>

        {step === 1 ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="squad-name">名称</Label>
              <Input
                id="squad-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：组织协作产品小队"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="squad-desc">描述</Label>
              <Textarea
                id="squad-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="说明小队职责与协作边界"
                rows={4}
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-2">
            <p className="text-[12px] text-[#5a6779]">
              已选 {selectedIds.length} 个 Agent · 须含平台 Claw 或多智能体组 ·
              非本人个人 Claw 将进入待确认
            </p>
            <SquadMemberPicker
              candidates={candidates}
              selectedIds={selectedIds}
              onToggle={toggleMember}
              className="max-h-[420px] overflow-y-auto pr-1"
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-2">
            <p className="text-[12px] text-[#5a6779]">
              仅可从已确认（active）Agent 中选择 Leader；待确认成员不可作为
              Leader
            </p>
            {activeMemberIds.length === 0 ? (
              <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/60 px-4 py-6 text-center text-sm text-amber-800">
                当前没有可用的 active Agent，请返回调整成员
              </div>
            ) : (
              <div className="space-y-1.5">
                {activeMemberIds.map((actorId) => {
                  const actor = getActor(actorId);
                  if (!actor) return null;
                  const selected = leaderActorId === actorId;
                  return (
                    <button
                      key={actorId}
                      type="button"
                      onClick={() => setLeaderActorId(actorId)}
                      className={
                        selected
                          ? "flex w-full items-center gap-3 rounded-lg border border-[#2773ff]/40 bg-[#e8f0fb] px-3 py-2.5 text-left"
                          : "flex w-full items-center gap-3 rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 text-left hover:bg-[#f8f9fb]"
                      }
                    >
                      <ActorAvatar
                        name={actor.name}
                        type={actor.type}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-slate-900">
                          {actor.name}
                        </div>
                        <div className="truncate text-[11px] text-[#5a6779]">
                          {actor.sourceLabel}
                        </div>
                      </div>
                      {selected ? (
                        <span className="text-[11px] font-medium text-[#2773ff]">
                          Leader
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
            >
              上一步
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              取消
            </Button>
          )}
          {step < 3 ? (
            <Button
              type="button"
              onClick={() => {
                if (step === 1) {
                  if (!name.trim()) {
                    toast.error("请填写小队名称");
                    return;
                  }
                  setStep(2);
                  return;
                }
                if (selectedIds.length < 2) {
                  toast.error("至少选择 2 名 Agent");
                  return;
                }
                const composition = validateSquadComposition(selectedMembers);
                if (!composition.ok) {
                  toast.error(composition.message);
                  return;
                }
                setStep(3);
              }}
            >
              下一步
            </Button>
          ) : (
            <Button type="button" onClick={handleCreate}>
              创建小队
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
