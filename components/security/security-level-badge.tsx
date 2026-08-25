"use client";

import { cn } from "@/lib/utils";
import {
  getSecurityLevelBadgeClass,
  type ApprovalStatus,
  type SecurityLevel,
} from "@/lib/security-level";

export function SecurityLevelBadge({
  level,
  className,
}: {
  level: SecurityLevel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] px-2 py-1 text-xs font-medium",
        getSecurityLevelBadgeClass(level),
        className
      )}
    >
      {level}
    </span>
  );
}

/** 审批过程状态不在列表/详情中展示，仅用于内部锁态与 hover。 */
export function ApprovalStatusBadge(_props: { status: ApprovalStatus }) {
  return null;
}
