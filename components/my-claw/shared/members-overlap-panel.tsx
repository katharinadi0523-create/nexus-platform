"use client";

import { Plus } from "lucide-react";
import { ActorAvatar } from "@/components/my-claw/project-conversation/shared/actor-avatar";
import { cn } from "@/lib/utils";

export interface MemberAvatarItem {
  key: string;
  kind: "human" | "agent";
  name: string;
  initials?: string;
}

function OverlapAvatars({ items }: { items: MemberAvatarItem[] }) {
  const shown = items.slice(0, 6);
  const rest = items.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((item) => (
          <ActorAvatar
            key={item.key}
            kind={item.kind}
            name={item.name}
            initials={item.initials}
            size="sm"
            className="ring-2 ring-white"
          />
        ))}
      </div>
      {rest > 0 ? (
        <span className="ml-2 text-[11px] text-[#5a6779]">+{rest}</span>
      ) : null}
      {items.length === 0 ? (
        <span className="text-[12px] text-[#5a6779]">暂无</span>
      ) : null}
    </div>
  );
}

interface MembersOverlapPanelProps {
  humans: MemberAvatarItem[];
  agents: MemberAvatarItem[];
  title?: string;
  onAdd?: () => void;
  addDisabled?: boolean;
  addTitle?: string;
  /** Card shell for overview; false for nested drawers */
  bordered?: boolean;
  className?: string;
}

/** Shared Human / Agent overlap avatar panel (Project overview + Conversation settings). */
export function MembersOverlapPanel({
  humans,
  agents,
  title = "成员",
  onAdd,
  addDisabled,
  addTitle = "添加成员 / Agent",
  bordered = true,
  className,
}: MembersOverlapPanelProps) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-slate-900">{title}</h2>
        {onAdd ? (
          <button
            type="button"
            title={addTitle}
            disabled={addDisabled}
            onClick={onAdd}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#94a3b8] hover:bg-[#f8f9fb] hover:text-[#2773ff] disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <div className="mt-3 space-y-3">
        <div>
          <div className="mb-1.5 text-[11px] text-[#5a6779]">
            Human · {humans.length}
          </div>
          <OverlapAvatars items={humans} />
        </div>
        <div>
          <div className="mb-1.5 text-[11px] text-[#5a6779]">
            Agent · {agents.length}
          </div>
          <OverlapAvatars items={agents} />
        </div>
      </div>
    </>
  );

  if (!bordered) {
    return <div className={cn(className)}>{body}</div>;
  }

  return (
    <section
      className={cn(
        "rounded-xl border border-[#e2e8f0] bg-white p-4",
        className
      )}
    >
      {body}
    </section>
  );
}
