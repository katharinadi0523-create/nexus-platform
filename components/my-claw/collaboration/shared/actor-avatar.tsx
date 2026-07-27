import { Bot, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentActorType } from "@/lib/mock/my-claw/collaboration";

export function ActorAvatar({
  name,
  type,
  size = "md",
  className,
}: {
  name: string;
  type?: AgentActorType | "human" | "squad";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "sm" ? "h-6 w-6 text-[10px]" : size === "lg" ? "h-12 w-12 text-sm" : "h-8 w-8 text-xs";
  const initials = name
    .replace(/的个人 Claw$/, "")
    .slice(0, 2)
    .toUpperCase();

  if (type === "squad") {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-[#e8f0fb] text-[#2773ff]",
          sizeClass,
          className
        )}
      >
        <Users className="h-3.5 w-3.5" />
      </div>
    );
  }

  if (type && type !== "human") {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-[#dbe7f4] text-[#2f5fbf]",
          sizeClass,
          className
        )}
      >
        <Bot className="h-3.5 w-3.5" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[#dbe7f4] font-semibold text-[#2f5fbf]",
        sizeClass,
        className
      )}
    >
      {initials}
    </div>
  );
}
