"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ArtifactScope } from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "./project-conversation-provider";
import {
  ToolConfigDialog,
  type ToolConfigSelection,
} from "@/components/claw-hub-next/tool-config-dialog";
import {
  SkillConfigDialog,
  type SkillConfigSelection,
} from "@/components/claw-hub-next/skill-config-dialog";
import { cn } from "@/lib/utils";

interface CreateProjectConversationDialogProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

interface PickedTool {
  versionId: string;
  name: string;
}

interface PickedSkill {
  id: string;
  name: string;
}

export function CreateProjectConversationDialog({
  projectId,
  open,
  onClose,
  onCreated,
}: CreateProjectConversationDialogProps) {
  const {
    currentUserId,
    getProject,
    getMembers,
    getUser,
    getActor,
    createConversation,
  } = useProjectConversation();

  const project = getProject(projectId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [humanMemberIds, setHumanMemberIds] = useState<string[]>([
    currentUserId,
  ]);
  const [agentBindingIds, setAgentBindingIds] = useState<string[]>([]);
  const [humanQuery, setHumanQuery] = useState("");
  const [agentQuery, setAgentQuery] = useState("");
  const [humanOpen, setHumanOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [tools, setTools] = useState<PickedTool[]>([]);
  const [skills, setSkills] = useState<PickedSkill[]>([]);
  const [toolDialogOpen, setToolDialogOpen] = useState(false);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [scope, setScope] = useState<ArtifactScope>("project");
  const [error, setError] = useState<string | null>(null);

  const humans = useMemo(() => {
    return getMembers(projectId)
      .filter((m) => m.kind === "human")
      .map((m) => getUser(m.userId))
      .filter(Boolean);
  }, [getMembers, getUser, projectId]);

  const agents = useMemo(() => {
    return getMembers(projectId)
      .filter((m) => m.kind === "agent")
      .map((m) => getActor(m.actorId))
      .filter(Boolean);
  }, [getActor, getMembers, projectId]);

  const filteredHumans = humans.filter((user) => {
    if (!user || humanMemberIds.includes(user.id)) return false;
    const q = humanQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      user.name.toLowerCase().includes(q) ||
      user.title.toLowerCase().includes(q)
    );
  });

  const filteredAgents = agents.filter((actor) => {
    if (!actor || agentBindingIds.includes(actor.id)) return false;
    if (
      actor.type === "personal_claw" &&
      actor.ownerUserId &&
      !humanMemberIds.includes(actor.ownerUserId)
    ) {
      return false;
    }
    const q = agentQuery.trim().toLowerCase();
    if (!q) return true;
    return actor.name.toLowerCase().includes(q);
  });

  if (!open || !project) return null;

  const handleCreate = () => {
    if (!name.trim()) {
      setError("请填写会话名称");
      return;
    }
    if (humanMemberIds.length === 0) {
      setError("至少选择一位 Human 参与者");
      return;
    }
    const id = createConversation({
      projectId,
      name: name.trim(),
      description: description.trim() || undefined,
      humanMemberIds,
      agentBindingIds,
      conversationToolResourceIds: tools.map((t) => t.versionId),
      conversationToolPicks: tools.map((t) => ({
        versionId: t.versionId,
        name: t.name,
        kind: "mcp",
      })),
      conversationSkills: skills.map((s) => ({
        skillId: s.id,
        displayName: s.name,
      })),
      defaultArtifactScope: scope,
    });
    if (!id) {
      setError("创建失败：请确认参与者属于当前 Project");
      return;
    }
    setName("");
    setDescription("");
    setHumanMemberIds([currentUserId]);
    setAgentBindingIds([]);
    setTools([]);
    setSkills([]);
    setScope("project");
    setError(null);
    onCreated(id);
    onClose();
  };

  const handleToolConfirm = (selections: ToolConfigSelection[]) => {
    setTools((prev) => {
      const next = [...prev];
      for (const item of selections) {
        const versionId = `${item.id}-v1`;
        if (!next.some((t) => t.versionId === versionId || t.versionId === item.id)) {
          next.push({ versionId, name: item.name });
        }
      }
      return next;
    });
    setToolDialogOpen(false);
  };

  const handleSkillConfirm = (selections: SkillConfigSelection[]) => {
    setSkills((prev) => {
      const next = [...prev];
      for (const item of selections) {
        if (!next.some((s) => s.id === item.id)) {
          next.push({ id: item.id, name: item.name });
        }
      }
      return next;
    });
    setSkillDialogOpen(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e2e8f0] bg-white shadow-xl">
          <div className="border-b border-[#eef2f6] px-5 py-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              新建会话
            </h2>
            <p className="mt-1 text-[12px] text-[#5a6779]">
              在「{project.name}」下创建。消息仅会话成员可见。
            </p>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-slate-700">
                会话名称
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：方案评审"
                className="h-9 text-[13px]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-medium text-slate-700">
                会话说明（可选）
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[64px] text-[13px]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-medium text-slate-700">
                Human 参与者
              </label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {humanMemberIds.map((id) => {
                  const user = getUser(id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full bg-[#e8f0fb] px-2 py-0.5 text-[11px] text-[#2773ff]"
                    >
                      {user?.name ?? id}
                      {id !== currentUserId ? (
                        <button
                          type="button"
                          onClick={() =>
                            setHumanMemberIds((prev) =>
                              prev.filter((item) => item !== id)
                            )
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      ) : null}
                    </span>
                  );
                })}
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5a6779]" />
                <Input
                  value={humanQuery}
                  onChange={(e) => {
                    setHumanQuery(e.target.value);
                    setHumanOpen(true);
                  }}
                  onFocus={() => setHumanOpen(true)}
                  placeholder="搜索并添加 Human…"
                  className="h-9 border-[#e2e8f0] pl-8 text-[13px]"
                />
                {humanOpen ? (
                  <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-[#e2e8f0] bg-white shadow-lg">
                    {filteredHumans.map((user) => (
                      <button
                        key={user!.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f8f9fb]"
                        onClick={() => {
                          setHumanMemberIds((prev) => [...prev, user!.id]);
                          setHumanQuery("");
                          setHumanOpen(false);
                        }}
                      >
                        {user!.name}
                        <span className="ml-2 text-[11px] text-[#5a6779]">
                          {user!.title}
                        </span>
                      </button>
                    ))}
                    {filteredHumans.length === 0 ? (
                      <div className="px-3 py-3 text-[12px] text-[#5a6779]">
                        无更多可选成员
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-medium text-slate-700">
                参与 Agent
              </label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {agentBindingIds.map((id) => {
                  const actor = getActor(id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full bg-[#f0f4f8] px-2 py-0.5 text-[11px] text-slate-700"
                    >
                      {actor?.name ?? id}
                      <button
                        type="button"
                        onClick={() =>
                          setAgentBindingIds((prev) =>
                            prev.filter((item) => item !== id)
                          )
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5a6779]" />
                <Input
                  value={agentQuery}
                  onChange={(e) => {
                    setAgentQuery(e.target.value);
                    setAgentOpen(true);
                  }}
                  onFocus={() => setAgentOpen(true)}
                  placeholder="搜索并添加 Agent…"
                  className="h-9 border-[#e2e8f0] pl-8 text-[13px]"
                />
                {agentOpen ? (
                  <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-[#e2e8f0] bg-white shadow-lg">
                    {filteredAgents.map((actor) => (
                      <button
                        key={actor!.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f8f9fb]"
                        onClick={() => {
                          setAgentBindingIds((prev) => [...prev, actor!.id]);
                          setAgentQuery("");
                          setAgentOpen(false);
                        }}
                      >
                        {actor!.name}
                      </button>
                    ))}
                    {filteredAgents.length === 0 ? (
                      <div className="px-3 py-3 text-[12px] text-[#5a6779]">
                        无更多可选 Agent
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[12px] font-medium text-slate-700">
                  工具
                </label>
                <button
                  type="button"
                  onClick={() => setToolDialogOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-[#2773ff]"
                >
                  <Plus className="h-3 w-3" />
                  添加
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tools.map((tool) => (
                  <span
                    key={tool.versionId}
                    className="inline-flex items-center gap-1 rounded-full bg-[#f8f9fb] px-2 py-0.5 text-[11px] text-slate-700"
                  >
                    {tool.name}
                    <button
                      type="button"
                      onClick={() =>
                        setTools((prev) =>
                          prev.filter((item) => item.versionId !== tool.versionId)
                        )
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {tools.length === 0 ? (
                  <span className="text-[11px] text-[#5a6779]">
                    可选 MCP / OpenAPI（会话增量）
                  </span>
                ) : null}
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[12px] font-medium text-slate-700">
                  技能
                </label>
                <button
                  type="button"
                  onClick={() => setSkillDialogOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-[#2773ff]"
                >
                  <Plus className="h-3 w-3" />
                  添加
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center gap-1 rounded-full bg-[#f8f9fb] px-2 py-0.5 text-[11px] text-slate-700"
                  >
                    {skill.name}
                    <button
                      type="button"
                      onClick={() =>
                        setSkills((prev) =>
                          prev.filter((item) => item.id !== skill.id)
                        )
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {skills.length === 0 ? (
                  <span className="text-[11px] text-[#5a6779]">
                    从技能广场选择
                  </span>
                ) : null}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[12px] font-medium text-slate-700">
                文件归属
              </label>
              <div className="space-y-2">
                {(
                  [
                    {
                      value: "project" as const,
                      title: "文件公开到 Project（默认）",
                      desc: "该会话产生的文件自动进入 Project 文件区。会话消息仍然只对会话成员可见。",
                    },
                    {
                      value: "conversation" as const,
                      title: "文件仅属于当前会话",
                      desc: "文件进入当前会话文件区，不进入 Project 文件区。",
                    },
                  ] as const
                ).map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "block cursor-pointer rounded-xl border px-3 py-2.5",
                      scope === option.value
                        ? "border-[#2773ff] bg-[#e8f0fb]/40"
                        : "border-[#e2e8f0]"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="artifact-scope"
                        checked={scope === option.value}
                        onChange={() => setScope(option.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-[13px] font-medium text-slate-800">
                          {option.title}
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#5a6779]">
                          {option.desc}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-[#5a6779]">
                创建后不可更改默认归属；历史文件保留各自 scope。
              </p>
            </div>

            {error ? (
              <p className="text-[12px] text-red-600">{error}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-[#eef2f6] px-5 py-3">
            <Button
              type="button"
              variant="ghost"
              className="h-9 text-[13px]"
              onClick={onClose}
            >
              取消
            </Button>
            <Button
              type="button"
              className="h-9 bg-[#2773ff] text-[13px] hover:bg-[#1f63e0]"
              onClick={handleCreate}
            >
              创建会话
            </Button>
          </div>
        </div>
      </div>

      <ToolConfigDialog
        open={toolDialogOpen}
        onOpenChange={setToolDialogOpen}
        onConfirm={handleToolConfirm}
        allowedKinds={["mcp", "plugin"]}
        title="添加会话工具"
        confirmLabel="添加到会话"
      />
      <SkillConfigDialog
        open={skillDialogOpen}
        onOpenChange={setSkillDialogOpen}
        onConfirm={handleSkillConfirm}
        sourceMode="plaza"
      />
    </>
  );
}
