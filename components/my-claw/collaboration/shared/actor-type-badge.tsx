import { cn } from "@/lib/utils";
import {
  ACTOR_TYPE_LABELS,
  type AgentActorType,
} from "@/lib/mock/my-claw/collaboration";

const STYLES: Record<AgentActorType, string> = {
  personal_claw: "border-sky-200 bg-sky-50 text-sky-700",
  platform_claw: "border-violet-200 bg-violet-50 text-violet-700",
  multi_agent_group: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

export function ActorTypeBadge({
  type,
  className,
}: {
  type: AgentActorType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        STYLES[type],
        className
      )}
    >
      {ACTOR_TYPE_LABELS[type]}
    </span>
  );
}
