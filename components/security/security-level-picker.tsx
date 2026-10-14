"use client";

import { Check, LockKeyhole, ShieldCheck } from "lucide-react";
import {
  CURRENT_USER_SECURITY_LEVEL,
  SECURITY_LEVELS,
  getSecurityLevelRank,
  type SecurityLevel,
} from "@/lib/security-level";
import { cn } from "@/lib/utils";

const LEVEL_META: Record<
  SecurityLevel,
  { dot: string; active: string; selected: string }
> = {
  公开: {
    dot: "bg-slate-400",
    active: "border-slate-300 bg-slate-50 text-slate-700",
    selected: "border-slate-500 bg-slate-50 ring-slate-100",
  },
  内部: {
    dot: "bg-sky-500",
    active: "border-sky-200 bg-sky-50/70 text-sky-800",
    selected: "border-sky-500 bg-sky-50 ring-sky-100",
  },
  秘密: {
    dot: "bg-amber-500",
    active: "border-amber-200 bg-amber-50/70 text-amber-800",
    selected: "border-amber-500 bg-amber-50 ring-amber-100",
  },
  机密: {
    dot: "bg-orange-500",
    active: "border-orange-200 bg-orange-50/70 text-orange-800",
    selected: "border-orange-500 bg-orange-50 ring-orange-100",
  },
  绝密: {
    dot: "bg-rose-500",
    active: "border-rose-200 bg-rose-50/70 text-rose-800",
    selected: "border-rose-500 bg-rose-50 ring-rose-100",
  },
};

interface SecurityLevelPickerProps {
  currentLevel: SecurityLevel;
  value: SecurityLevel;
  onValueChange: (value: SecurityLevel) => void;
  userLevel?: SecurityLevel;
}

export function SecurityLevelPicker({
  currentLevel,
  value,
  onValueChange,
  userLevel = CURRENT_USER_SECURITY_LEVEL,
}: SecurityLevelPickerProps) {
  const currentRank = getSecurityLevelRank(currentLevel);
  const userRank = getSecurityLevelRank(userLevel);
  const valueRank = getSecurityLevelRank(value);
  const hasAvailableTarget = currentRank < userRank;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">资源当前密级</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-950">{currentLevel}</p>
          </div>
        </div>
        <div className="rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-xs text-slate-600 shadow-sm">
          当前用户最高可操作至 <span className="font-semibold text-slate-900">{userLevel}</span>
        </div>
      </div>

      <div>
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">选择目标密级</p>
          <p className="text-xs text-slate-400">只允许升密，不允许降密</p>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {SECURITY_LEVELS.map((level, index) => {
            const rank = getSecurityLevelRank(level);
            const isCurrent = level === currentLevel;
            const isBelowCurrent = rank < currentRank;
            const isAboveUser = rank > userRank;
            const isSelectable = rank > currentRank && rank <= userRank;
            const isSelected = level === value && isSelectable;
            const status = isCurrent
              ? "当前密级"
              : isBelowCurrent
                ? "不可降级"
                : isAboveUser
                  ? "超出权限"
                  : isSelected
                    ? "已选择"
                    : "可申请";

            return (
              <button
                key={level}
                type="button"
                disabled={!isSelectable}
                onClick={() => onValueChange(level)}
                className={cn(
                  "group relative min-w-0 rounded-2xl border px-2 py-3 text-center transition-all",
                  isSelectable
                    ? cn(
                        LEVEL_META[level].active,
                        "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
                      )
                    : "cursor-not-allowed border-slate-200 bg-slate-50/70 text-slate-400",
                  isSelected && cn(LEVEL_META[level].selected, "ring-4 shadow-sm"),
                  isCurrent && "border-blue-300 bg-blue-50 text-blue-800"
                )}
              >
                {index < SECURITY_LEVELS.length - 1 ? (
                  <span className="absolute left-[58%] top-[22px] h-px w-[92%] bg-slate-200" />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 mx-auto flex h-7 w-7 items-center justify-center rounded-full border-4 border-white shadow-sm",
                    isSelected || isCurrent ? LEVEL_META[level].dot : "bg-slate-300"
                  )}
                >
                  {isSelected ? <Check className="h-3.5 w-3.5 text-white" /> : null}
                  {isAboveUser ? <LockKeyhole className="h-3 w-3 text-white" /> : null}
                </span>
                <span className="relative z-10 mt-2 block truncate text-sm font-semibold">{level}</span>
                <span className="relative z-10 mt-0.5 block truncate text-[11px] opacity-75">{status}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={cn(
          "rounded-2xl border px-4 py-3 text-sm",
          hasAvailableTarget
            ? "border-blue-100 bg-blue-50/60 text-blue-900"
            : "border-slate-200 bg-slate-50 text-slate-600"
        )}
      >
        {hasAvailableTarget ? (
          <>
            本次申请将资源从 <span className="font-semibold">{currentLevel}</span> 提升为{" "}
            <span className="font-semibold">{valueRank > currentRank ? value : "请选择目标密级"}</span>。
            提交后由基础管控平台审批，审批通过前资源保持原密级。
          </>
        ) : (
          <>当前资源已达到您的最高可操作密级，暂无可申请的目标密级。</>
        )}
      </div>
    </div>
  );
}
