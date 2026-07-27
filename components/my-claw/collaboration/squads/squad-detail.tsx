"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Pencil,
  Plus,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { SquadAgentMember } from "@/lib/mock/my-claw/collaboration";
import { useCollaboration } from "../collaboration-provider";
import { ActorAvatar } from "../shared/actor-avatar";
import { ActorTypeBadge } from "../shared/actor-type-badge";
import { formatDateTime, formatRelativeTime } from "../shared/format";
import { IssueStatusBadge } from "../shared/issue-status-badge";
import { RunStatusBadge } from "../shared/run-status-badge";
import { SquadStatusBadge } from "../shared/squad-status-badge";
import {
  SquadMemberPicker,
  memberStateForActor,
} from "./squad-member-picker";

interface SquadDetailProps {
  workspaceId: string;
  projectId: string;
  squadId: string;
}

function memberWorkTag(
  isLeader: boolean,
  runtimeStatus?: "online" | "busy" | "offline" | "error",
  memberState?: SquadAgentMember["state"]
): { label: string; className: string } {
  if (isLeader) {
    return {
      label: "Leader",
      className: "border-[#2773ff]/30 bg-[#e8f0fb] text-[#2773ff]",
    };
  }
  if (memberState === "pending_consent") {
    return {
      label: "待确认",
      className: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }
  if (runtimeStatus === "busy") {
    return {
      label: "Working",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }
  return {
    label: "Idle",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  };
}

export function SquadDetail({
  workspaceId,
  projectId,
  squadId,
}: SquadDetailProps) {
  const {
    getSquad,
    getActor,
    getIssue,
    state,
    updateSquad,
    getDerivedHumanMembers,
    getHumanForPersonalClaw,
    validateSquadComposition,
  } = useCollaboration();
  const squad = getSquad(squadId);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [leaderActorId, setLeaderActorId] = useState("");
  const [addSelectedIds, setAddSelectedIds] = useState<string[]>([]);

  const relatedIssues = useMemo(() => {
    if (!squad) return [];
    return state.issues.filter(
      (issue) =>
        issue.projectId === projectId &&
        issue.executor?.kind === "squad" &&
        issue.executor.id === squad.id
    );
  }, [state.issues, projectId, squad]);

  const recentRuns = useMemo(() => {
    if (!squad) return [];
    return state.runs
      .filter(
        (run) =>
          run.projectId === projectId &&
          run.executor.kind === "squad" &&
          run.executor.id === squad.id
      )
      .sort(
        (a, b) =>
          new Date(b.startedAt ?? b.completedAt ?? 0).getTime() -
          new Date(a.startedAt ?? a.completedAt ?? 0).getTime()
      )
      .slice(0, 6);
  }, [state.runs, projectId, squad]);

  const existingMemberIds = useMemo(
    () => new Set(squad?.agentMembers.map((m) => m.actorId) ?? []),
    [squad]
  );

  const addCandidates = useMemo(
    () =>
      state.actors.filter(
        (actor) =>
          actor.workspaceId === workspaceId && !existingMemberIds.has(actor.id)
      ),
    [state.actors, workspaceId, existingMemberIds]
  );

  const derivedHumans = useMemo(
    () => (squad ? getDerivedHumanMembers(squad) : []),
    [squad, getDerivedHumanMembers]
  );

  if (!squad || squad.projectId !== projectId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-[#5a6779]">
        <div>未找到小队</div>
        <Link
          href={`/my-claw/workspaces/${workspaceId}/projects/${projectId}/squads`}
          className="text-[#2773ff] hover:underline"
        >
          返回小队列表
        </Link>
      </div>
    );
  }

  const leader = getActor(squad.leaderActorId);
  const activeMembers = squad.agentMembers.filter((m) => m.state === "active");
  const pendingCount = squad.agentMembers.filter(
    (m) => m.state === "pending_consent"
  ).length;

  const openEdit = () => {
    setDescription(squad.description);
    setLeaderActorId(squad.leaderActorId);
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!activeMembers.some((m) => m.actorId === leaderActorId)) {
      toast.error("Leader 必须来自已确认的 Agent");
      return;
    }
    const agentMembers = squad.agentMembers.map((member) => ({
      ...member,
      roleLabel:
        member.actorId === leaderActorId
          ? "Leader"
          : member.roleLabel === "Leader"
            ? "成员"
            : member.roleLabel,
    }));
    const composition = validateSquadComposition(agentMembers);
    if (!composition.ok) {
      toast.error(composition.message);
      return;
    }
    const ok = updateSquad({
      squadId: squad.id,
      description: description.trim(),
      leaderActorId,
      agentMembers,
    });
    if (!ok) {
      toast.error(composition.message);
      return;
    }
    toast.success("小队已更新");
    setEditOpen(false);
  };

  const removeMember = (actorId: string) => {
    if (actorId === squad.leaderActorId) {
      toast.error("请先更换 Leader 再移除该 Agent");
      return;
    }
    const nextMembers = squad.agentMembers.filter(
      (member) => member.actorId !== actorId
    );
    const composition = validateSquadComposition(nextMembers);
    if (!composition.ok) {
      toast.error(composition.message);
      return;
    }
    const ok = updateSquad({
      squadId: squad.id,
      agentMembers: nextMembers,
    });
    if (!ok) {
      toast.error(composition.message);
      return;
    }
    toast.success("已移除 Agent（派生 Human 同步消失）");
  };

  const confirmAddMembers = () => {
    if (addSelectedIds.length === 0) {
      toast.error("请选择要添加的 Agent");
      return;
    }
    const nextMembers: SquadAgentMember[] = [
      ...squad.agentMembers,
      ...addSelectedIds.map((actorId) => {
        const actor = getActor(actorId);
        return {
          actorId,
          state: actor ? memberStateForActor(actor) : "active",
          roleLabel: "成员",
        } satisfies SquadAgentMember;
      }),
    ];
    const composition = validateSquadComposition(nextMembers);
    if (!composition.ok) {
      toast.error(composition.message);
      return;
    }
    const ok = updateSquad({ squadId: squad.id, agentMembers: nextMembers });
    if (!ok) {
      toast.error(composition.message);
      return;
    }
    toast.success(`已添加 ${addSelectedIds.length} 个 Agent`);
    setAddSelectedIds([]);
    setAddOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-200/80 bg-white px-5 py-3 md:px-6">
        <Link
          href={`/my-claw/workspaces/${workspaceId}/projects/${projectId}/squads`}
          className="inline-flex items-center gap-1.5 text-[12px] text-[#5a6779] hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回小队列表
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="grid h-full min-h-0 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-y-auto border-r border-slate-200/80 bg-white px-5 py-5">
            <div className="flex flex-col items-start gap-3">
              <ActorAvatar name={squad.name} type="squad" size="lg" />
              <div className="w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[18px] font-semibold text-slate-900">
                    {squad.name}
                  </h1>
                  <SquadStatusBadge status={squad.status} />
                </div>
                <p className="mt-2 text-[13px] leading-6 text-[#5a6779]">
                  {squad.description || "暂无描述"}
                </p>
              </div>
            </div>

            <dl className="mt-6 space-y-3 text-[12px]">
              <div>
                <dt className="text-[#5a6779]">Leader</dt>
                <dd className="mt-1 flex items-center gap-2 text-slate-800">
                  <ActorAvatar
                    name={leader?.name ?? "未设置"}
                    type={leader?.type}
                    size="sm"
                  />
                  <span>{leader?.name ?? "未设置"}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[#5a6779]">成员口径</dt>
                <dd className="mt-1 text-slate-800">
                  Human {derivedHumans.length} · Agent{" "}
                  {squad.agentMembers.length}
                  {pendingCount > 0 ? (
                    <span className="ml-1 text-amber-700">
                      （{pendingCount} 待确认）
                    </span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-[#5a6779]">活跃 Issue</dt>
                <dd className="mt-1 text-slate-800">{squad.activeIssueCount}</dd>
              </div>
              <div>
                <dt className="text-[#5a6779]">更新时间</dt>
                <dd className="mt-1 text-slate-800">
                  {formatDateTime(squad.updatedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[#5a6779]">最近活动</dt>
                <dd className="mt-1 text-slate-800">
                  {formatRelativeTime(squad.updatedAt)}
                </dd>
              </div>
            </dl>

            <Button
              type="button"
              variant="outline"
              className="mt-6 w-full"
              onClick={openEdit}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              编辑描述 / Leader
            </Button>
          </aside>

          <div className="min-h-0 overflow-y-auto bg-[#f8f9fb] px-5 py-4 md:px-6">
            <Tabs defaultValue="members">
              <TabsList className="bg-white">
                <TabsTrigger value="members">成员</TabsTrigger>
                <TabsTrigger value="instructions">说明</TabsTrigger>
                <TabsTrigger value="issues">关联 Issue</TabsTrigger>
                <TabsTrigger value="runs">最近 Run</TabsTrigger>
              </TabsList>

              <TabsContent value="members" className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                    title="原型占位：创建 Agent 走现有平台能力"
                  >
                    <Bot className="mr-1.5 h-3.5 w-3.5" />
                    Create Agent
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#2773ff] hover:bg-[#1f63e0]"
                    onClick={() => {
                      setAddSelectedIds([]);
                      setAddOpen(true);
                    }}
                  >
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    添加 Agent
                  </Button>
                </div>

                <p className="text-[12px] text-[#5a6779]">
                  Human 成员由其个人 Claw 的 Squad 成员关系自动派生。仅可添加 /
                  移除 Agent；移除个人 Claw 将同步移除派生 Human。
                </p>

                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
                    <h3 className="text-[13px] font-semibold text-slate-900">
                      Human（{derivedHumans.length}）
                    </h3>
                    {derivedHumans.length === 0 ? (
                      <p className="mt-3 text-[12px] text-[#5a6779]">
                        暂无派生 Human（需加入个人 Claw）
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {squad.agentMembers
                          .filter((member) => {
                            const actor = getActor(member.actorId);
                            return actor?.type === "personal_claw";
                          })
                          .map((member) => {
                            const actor = getActor(member.actorId);
                            const human = getHumanForPersonalClaw(
                              member.actorId
                            );
                            if (!human || !actor) return null;
                            return (
                              <li
                                key={human.id}
                                className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-[#f8f9fb] px-3 py-2.5"
                              >
                                <ActorAvatar
                                  name={human.name}
                                  type="human"
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[13px] font-medium text-slate-900">
                                      {human.name}
                                    </span>
                                    {member.state === "pending_consent" ? (
                                      <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                                        待确认
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="mt-0.5 text-[11px] text-[#5a6779]">
                                    由「{actor.name}」带入
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                      </ul>
                    )}
                  </section>

                  <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
                    <h3 className="text-[13px] font-semibold text-slate-900">
                      Agent（{squad.agentMembers.length}）
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {squad.agentMembers.map((member) => {
                        const actor = getActor(member.actorId);
                        const isLeader = member.actorId === squad.leaderActorId;
                        const tag = memberWorkTag(
                          isLeader,
                          actor?.runtimeStatus,
                          member.state
                        );
                        return (
                          <li
                            key={member.actorId}
                            className="rounded-lg border border-slate-100 bg-[#f8f9fb] px-3 py-2.5"
                          >
                            <div className="flex items-start gap-2.5">
                              <ActorAvatar
                                name={actor?.name ?? member.actorId}
                                type={actor?.type}
                                size="sm"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="truncate text-[13px] font-medium text-slate-900">
                                    {actor?.name ?? member.actorId}
                                  </span>
                                  <span
                                    className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${tag.className}`}
                                  >
                                    {tag.label}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  {actor ? (
                                    <ActorTypeBadge type={actor.type} />
                                  ) : null}
                                </div>
                                <div className="mt-1 text-[11px] text-[#5a6779]">
                                  角色 · {member.roleLabel}
                                </div>
                              </div>
                            </div>
                            {!isLeader ? (
                              <div className="mt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeMember(member.actorId)}
                                  className="text-[12px] text-[#5a6779] hover:text-rose-600"
                                >
                                  移除
                                </button>
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="instructions" className="mt-4">
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
                  <h3 className="text-[13px] font-semibold text-slate-900">
                    小队说明
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-[#5a6779]">
                    {squad.description || "暂无说明。可通过左侧编辑补充协作规则。"}
                  </p>
                  <ul className="mt-4 space-y-1.5 text-[12px] text-[#5a6779]">
                    <li>· Human 由其个人 Claw 自动派生，不可单独增删</li>
                    <li>· 多智能体组仅显示一行，不展开内部子 Agent</li>
                    <li>· 多智能体组 ≠ Squad</li>
                    <li>· pending / offline 成员不参与 Squad Run 拆分执行</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="issues" className="mt-4">
                {relatedIssues.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-[#5a6779]">
                    暂无关联 Issue
                  </div>
                ) : (
                  <div className="space-y-2">
                    {relatedIssues.map((issue) => (
                      <Link
                        key={issue.id}
                        href={`/my-claw/workspaces/${workspaceId}/projects/${projectId}/issues/${issue.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm hover:bg-[#fafbfc]"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-slate-900">
                            {issue.key} · {issue.title}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#5a6779]">
                            {formatRelativeTime(issue.updatedAt)}
                          </div>
                        </div>
                        <IssueStatusBadge status={issue.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="runs" className="mt-4">
                {recentRuns.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-[#5a6779]">
                    暂无 Squad Run
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentRuns.map((run) => {
                      const issue = getIssue(run.issueId);
                      return (
                        <div
                          key={run.id}
                          className="rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-[13px] font-medium text-slate-900">
                              {issue ? `${issue.key} · ${issue.title}` : run.id}
                            </div>
                            <RunStatusBadge status={run.status} />
                          </div>
                          <p className="mt-1 text-[12px] text-[#5a6779]">
                            {run.summary}
                          </p>
                          {run.childRuns && run.childRuns.length > 0 ? (
                            <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                              {run.childRuns.map((child) => {
                                const childActor = getActor(child.actorId);
                                return (
                                  <div
                                    key={`${run.id}-${child.actorId}`}
                                    className="flex items-center justify-between gap-2 text-[11px] text-[#5a6779]"
                                  >
                                    <span className="truncate">
                                      {childActor?.name ?? child.actorId} ·{" "}
                                      {child.summary}
                                    </span>
                                    <span>{child.status}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑小队</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-desc">描述</Label>
              <Textarea
                id="edit-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Leader</Label>
              <Select
                value={leaderActorId}
                onValueChange={setLeaderActorId}
                options={activeMembers.map((member) => ({
                  value: member.actorId,
                  label: getActor(member.actorId)?.name ?? member.actorId,
                }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
            >
              取消
            </Button>
            <Button type="button" onClick={saveEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>添加 Agent</DialogTitle>
          </DialogHeader>
          <p className="text-[12px] text-[#5a6779]">
            仅添加 Agent。选择个人 Claw 时将自动派生对应 Human。
          </p>
          <SquadMemberPicker
            candidates={addCandidates}
            selectedIds={addSelectedIds}
            onToggle={(actorId) =>
              setAddSelectedIds((current) =>
                current.includes(actorId)
                  ? current.filter((id) => id !== actorId)
                  : [...current, actorId]
              )
            }
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddOpen(false)}
            >
              取消
            </Button>
            <Button type="button" onClick={confirmAddMembers}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              确认添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
