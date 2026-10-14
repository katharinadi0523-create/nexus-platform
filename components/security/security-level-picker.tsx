"use client";

import { Check, LockKeyhole } from "lucide-react";
import {
  CURRENT_USER_SECURITY_LEVEL,
  SECURITY_LEVELS,
  getSecurityLevelRank,
  type SecurityLevel,
} from "@/lib/security-level";
import { cn } from "@/lib/utils";

const LEVEL_META: Record<SecurityLevel, { active: string; selected: string }> = {
  公开: {
    active: "border-slate-300 bg-slate-50 text-slate-700",
    selected: "border-slate-500 bg-slate-50 ring-slate-100",
  },
  内部: {
    active: "border-sky-200 bg-sky-50/70 text-sky-800",
    selected: "border-sky-500 bg-sky-50 ring-sky-100",
  },
  秘密: {
    active: "border-amber-200 bg-amber-50/70 text-amber-800",
    selected: "border-amber-500 bg-amber-50 ring-amber-100",
  },
  机密: {
    active: "border-orange-200 bg-orange-50/70 text-orange-800",
    selected: "border-orange-500 bg-orange-50 ring-orange-100",
  },
  绝密: {
    active: "border-rose-200 bg-rose-50/70 text-rose-800",
    selected: "border-rose-500 bg-rose-50 ring-rose-100",
  },
};

interface SecurityLevelPickerProps {
  currentLevel: SecurityLevel;
  value: SecurityLevel;
  onValueChange: (value: SecurityLevel) => void;
  userLevel?: SecurityLevel;
  mode?: "request" | "direct";
}

export function SecurityLevelPicker({
  currentLevel,
  value,
  onValueChange,
  userLevel = CURRENT_USER_SECURITY_LEVEL,
  mode = "request",
}: SecurityLevelPickerProps) {
  const currentRank = getSecurityLevelRank(currentLevel);
  const userRank = getSecurityLevelRank(userLevel);
  const valueRank = getSecurityLevelRank(value);
  const hasAvailableTarget = currentRank < userRank;
  const targetLevels = SECURITY_LEVELS.filter((level) => getSecurityLevelRank(level) > currentRank);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="text-slate-600">
          当前密级
          <span className="ml-2 rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-900">
            {currentLevel}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          仅支持提升 · 最高可{mode === "request" ? "申请" : "调整"}至{" "}
          <span className="font-medium text-slate-700">{userLevel}</span>
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-900">提升至</p>
        {targetLevels.length ? (
          <div className="grid grid-cols-3 gap-2">
            {targetLevels.map((level) => {
              const rank = getSecurityLevelRank(level);
              const isAboveUser = rank > userRank;
              const isSelectable = rank <= userRank;
              const isSelected = level === value && isSelectable;

              return (
                <button
                  key={level}
                  type="button"
                  disabled={!isSelectable}
                  onClick={() => onValueChange(level)}
                  className={cn(
                    "group flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all",
                    isSelectable
                      ? cn(LEVEL_META[level].active, "cursor-pointer hover:border-blue-300 hover:shadow-sm")
                      : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400",
                    isSelected && cn(LEVEL_META[level].selected, "ring-2 shadow-sm")
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white",
                      isAboveUser && "border-slate-200 bg-slate-200"
                    )}
                  >
                    {isSelected ? <Check className="h-3 w-3 text-white" /> : null}
                    {isAboveUser ? <LockKeyhole className="h-3 w-3 text-slate-500" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{level}</span>
                    <span className="mt-0.5 block text-[11px] opacity-75">
                      {isAboveUser
                        ? "无申请权限"
                        : isSelected
                          ? "已选择"
                          : `${level}及以上人员可访问`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            当前资源已达到你可操作的最高密级。
          </div>
        )}
      </div>

      <div
        className={cn(
          "rounded-xl border px-3 py-2.5 text-xs leading-5",
          hasAvailableTarget
            ? "border-blue-100 bg-blue-50/60 text-blue-900"
            : "border-slate-200 bg-slate-50 text-slate-600"
        )}
      >
        {hasAvailableTarget ? (
          mode === "request" ? (
            <>审批通过前，资源仍按「{currentLevel}」控制访问。</>
          ) : (
            <>保存后立即提升为「{valueRank > currentRank ? value : "请选择目标密级"}」，不会生成新版本。</>
          )
        ) : (
          <>如需继续提升，请联系具有更高密级权限的管理员。</>
        )}
      </div>
    </div>
  );
}
