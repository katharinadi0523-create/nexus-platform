"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProjectConversation } from "./project-conversation-provider";
import { ConversationToolsSection, ConversationSkillsSection } from "./conversation-tools-panels";
import { MembersOverlapPanel } from "@/components/my-claw/shared/members-overlap-panel";
import { DrawerShell } from "./shared/drawer-shell";

interface ConversationSettingsDrawerProps {
  conversationId: string;
  onClose: () => void;
}

export function ConversationSettingsDrawer({
  conversationId,
  onClose,
}: ConversationSettingsDrawerProps) {
  const {
    getConversation,
    getUser,
    getActor,
    updateConversation,
  } = useProjectConversation();

  const conversation = getConversation(conversationId);
  const [name, setName] = useState(conversation?.name ?? "");
  const [instructions, setInstructions] = useState(
    conversation?.instructions ?? ""
  );

  const humans = useMemo(() => {
    if (!conversation) return [];
    return conversation.humanMemberIds
      .map((id) => getUser(id))
      .filter(Boolean)
      .map((user) => ({
        key: user!.id,
        kind: "human" as const,
        name: user!.name,
        initials: user!.initials,
      }));
  }, [conversation, getUser]);

  const agents = useMemo(() => {
    if (!conversation) return [];
    return conversation.agentBindingIds
      .map((id) => getActor(id))
      .filter(Boolean)
      .map((actor) => ({
        key: actor!.id,
        kind: "agent" as const,
        name: actor!.name,
      }));
  }, [conversation, getActor]);

  if (!conversation) {
    return (
      <DrawerShell title="会话设置" onClose={onClose}>
        <p className="text-[13px] text-[#5a6779]">会话不存在</p>
      </DrawerShell>
    );
  }

  return (
    <DrawerShell title="会话设置" onClose={onClose}>
      <div className="space-y-5">
        <section className="space-y-2">
          <h3 className="text-[13px] font-semibold text-slate-900">基本信息</h3>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 border-[#e2e8f0] text-[13px]"
          />
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="会话 Instructions"
            className="min-h-[80px] border-[#e2e8f0] text-[13px]"
          />
          <Button
            type="button"
            size="sm"
            className="h-8 bg-[#2773ff] text-[12px] hover:bg-[#1f63e0]"
            onClick={() =>
              updateConversation(conversationId, {
                name: name.trim() || conversation.name,
                instructions,
              })
            }
          >
            保存
          </Button>
        </section>

        <section className="space-y-2">
          <h3 className="text-[13px] font-semibold text-slate-900">文件归属</h3>
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8f9fb] px-3 py-2.5">
            <div className="text-[13px] font-medium text-slate-800">
              {conversation.defaultArtifactScope === "project"
                ? "公开到 Project"
                : "仅属于当前会话"}
            </div>
            <p className="mt-1 text-[12px] text-[#5a6779]">
              创建时选定，之后不可更改。历史文件保留各自 scope。
            </p>
          </div>
        </section>

        <MembersOverlapPanel
          humans={humans}
          agents={agents}
          bordered={false}
        />

        <section className="space-y-2">
          <h3 className="text-[13px] font-semibold text-slate-900">工具</h3>
          <ConversationToolsSection
            projectId={conversation.projectId}
            conversationId={conversationId}
          />
        </section>

        <section className="space-y-2">
          <h3 className="text-[13px] font-semibold text-slate-900">技能</h3>
          <ConversationSkillsSection
            projectId={conversation.projectId}
            conversationId={conversationId}
          />
        </section>
      </div>
    </DrawerShell>
  );
}
