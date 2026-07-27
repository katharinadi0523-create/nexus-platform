"use client";

import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentRuntimeStatus } from "@/lib/mock/my-claw/project-conversation";

interface ActorAvatarProps {
  kind: "human" | "agent";
  name: string;
  initials?: string;
  size?: "sm" | "md";
  runtimeStatus?: AgentRuntimeStatus;
  className?: string;
}

const SIZE_CLASS = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
} as const;

const DOT_CLASS = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
} as const;

function statusDotColor(status?: AgentRuntimeStatus) {
  switch (status) {
    case "online":
      return "bg-emerald-500";
    case "busy":
      return "bg-amber-400";
    case "degraded":
      return "bg-orange-400";
    case "offline":
      return "bg-slate-400";
    default:
      return null;
  }
}

export function ActorAvatar({
  kind,
  name,
  initials,
  size = "sm",
  runtimeStatus,
  className,
}: ActorAvatarProps) {
  const dotColor = statusDotColor(runtimeStatus);

  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      title={name}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold",
          SIZE_CLASS[size],
          kind === "human"
            ? "bg-[#dbe7f4] text-[#2f5fbf]"
            : "bg-[#e8f0fb] text-[#2773ff]"
        )}
      >
        {kind === "human" ? (
          (initials ?? name.slice(0, 1)).slice(0, 2)
        ) : (
          <Bot className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        )}
      </span>
      {dotColor ? (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border border-white",
            DOT_CLASS[size],
            dotColor
          )}
        />
      ) : null}
    </span>
  );
}
