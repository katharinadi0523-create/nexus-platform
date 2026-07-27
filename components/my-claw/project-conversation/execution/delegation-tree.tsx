"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AgentDelegation } from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "../project-conversation-provider";
import { ActorAvatar } from "../shared/actor-avatar";

interface DelegationTreeProps {
  delegations: AgentDelegation[];
}

function statusLabel(status: AgentDelegation["status"]) {
  switch (status) {
    case "requested":
      return "已请求";
    case "accepted":
      return "已接受";
    case "running":
      return "执行中";
    case "responded":
      return "已响应";
    case "failed":
      return "失败";
    case "rejected":
      return "已拒绝";
  }
}

export function DelegationTree({ delegations }: DelegationTreeProps) {
  const { getActor } = useProjectConversation();
  const [expanded, setExpanded] = useState(false);

  if (delegations.length === 0) {
    return (
      <p className="text-[12px] text-[#5a6779]">本次执行未发生委派</p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mb-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#2773ff] hover:underline"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        委派链（{delegations.length}）
      </button>

      {expanded ? (
        <ul className="space-y-2 border-l border-[#e2e8f0] pl-3">
          {delegations.map((item) => {
            const source = getActor(item.sourceActorId);
            const target = getActor(item.targetActorId);
            return (
              <li
                key={item.id}
                className="rounded-md bg-[#f8f9fb] px-2.5 py-2 text-[12px]"
              >
                <div className="flex items-center gap-2">
                  <ActorAvatar
                    kind="agent"
                    name={source?.name ?? "Agent"}
                    size="sm"
                  />
                  <span className="text-[#5a6779]">→</span>
                  <ActorAvatar
                    kind="agent"
                    name={target?.name ?? "Agent"}
                    size="sm"
                  />
                  <span className="font-medium text-slate-800">
                    {target?.name ?? "Agent"}
                  </span>
                  <span className="ml-auto text-[#5a6779]">
                    {statusLabel(item.status)}
                  </span>
                </div>
                <p className="mt-1 text-[#5a6779]">{item.requestSummary}</p>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
