/** 密级：从低到高 */
export type SecurityLevel = "公开" | "内部" | "秘密" | "机密" | "绝密";

/** 审批中类型（高密资源相关） */
export type ApprovalStatus =
  | "none"
  | "create"
  | "publish"
  | "shelf"
  | "delete"
  | "securityChange";

export const SECURITY_LEVELS: SecurityLevel[] = [
  "公开",
  "内部",
  "秘密",
  "机密",
  "绝密",
];

/** 低密：公开、内部；其余为高密 */
export const LOW_SECURITY_LEVELS: SecurityLevel[] = ["公开", "内部"];

/** 原型演示：当前登录用户密级上限 */
export const CURRENT_USER_SECURITY_LEVEL: SecurityLevel = "机密";

export function getSecurityLevelRank(level: SecurityLevel): number {
  return SECURITY_LEVELS.indexOf(level);
}

export function isHighSecurityLevel(level: SecurityLevel): boolean {
  return getSecurityLevelRank(level) >= getSecurityLevelRank("秘密");
}

export function isLowSecurityLevel(level: SecurityLevel): boolean {
  return !isHighSecurityLevel(level);
}

/** 取更高密级 */
export function maxSecurityLevel(
  ...levels: Array<SecurityLevel | undefined | null>
): SecurityLevel {
  let max: SecurityLevel = "公开";
  for (const level of levels) {
    if (!level) continue;
    if (getSecurityLevelRank(level) > getSecurityLevelRank(max)) {
      max = level;
    }
  }
  return max;
}

/** 取更低密级 */
export function minSecurityLevel(
  ...levels: Array<SecurityLevel | undefined | null>
): SecurityLevel {
  const defined = levels.filter(Boolean) as SecurityLevel[];
  if (defined.length === 0) return "公开";
  return defined.reduce((min, level) =>
    getSecurityLevelRank(level) < getSecurityLevelRank(min) ? level : min
  );
}

/**
 * 通用密级下拉：同时受用户上限、父级上限、子级下限约束。
 * - maxLevel：不可超过（如父群组密级、用户角色密级）
 * - minLevel：不可低于（如当前密级禁止降密、子群组/子知识库最高密级）
 */
export function buildSecurityLevelOptions(params?: {
  userLevel?: SecurityLevel;
  maxLevel?: SecurityLevel;
  minLevel?: SecurityLevel;
}): { value: SecurityLevel; label: string; disabled?: boolean }[] {
  const userLevel = params?.userLevel ?? CURRENT_USER_SECURITY_LEVEL;
  const ceiling = minSecurityLevel(userLevel, params?.maxLevel ?? userLevel);
  const floor = params?.minLevel ?? "公开";
  const floorRank = getSecurityLevelRank(floor);
  const ceilingRank = getSecurityLevelRank(ceiling);

  if (floorRank > ceilingRank) {
    // 约束冲突时至少展示下限，避免下拉为空
    return [{ value: floor, label: floor }];
  }

  return SECURITY_LEVELS.filter((level) => {
    const rank = getSecurityLevelRank(level);
    return rank >= floorRank && rank <= ceilingRank;
  }).map((level) => ({ value: level, label: level }));
}

/**
 * 已创建资源改密：仅展示 ≥ 当前密级 且 ≤ 用户密级（禁止降密、不可超用户上限）。
 * 可额外传入 maxLevel（如父群组密级）。
 */
export function buildSecurityLevelSelectOptions(params: {
  currentLevel: SecurityLevel;
  userLevel?: SecurityLevel;
  maxLevel?: SecurityLevel;
}): { value: SecurityLevel; label: string; disabled?: boolean }[] {
  return buildSecurityLevelOptions({
    userLevel: params.userLevel,
    maxLevel: params.maxLevel,
    minLevel: params.currentLevel,
  });
}

/**
 * 创建时密级可选：仅展示用户项目角色密级及以下；可再受父群组上限约束。
 */
export function buildSecurityLevelOptionsUpToUser(params?: {
  userLevel?: SecurityLevel;
  maxLevel?: SecurityLevel;
}): { value: SecurityLevel; label: string; disabled?: boolean }[] {
  return buildSecurityLevelOptions({
    userLevel: params?.userLevel,
    maxLevel: params?.maxLevel,
  });
}

export function getApprovalActionState(approval: ApprovalStatus = "none") {
  const configLocked = approval === "publish" || approval === "create";
  const deleteLocked =
    approval === "publish" || approval === "delete" || approval === "create";

  return {
    approval,
    configLocked,
    deleteLocked,
    configTitle:
      approval === "create"
        ? "资源审批中"
        : approval === "publish"
          ? "发布审批中"
          : undefined,
    deleteTitle:
      approval === "create"
        ? "资源审批中"
        : approval === "publish"
          ? "发布审批中"
          : approval === "delete"
            ? "删除审批中"
            : undefined,
    shelfLocked: approval === "shelf",
    shelfTitle: approval === "shelf" ? "上架审批中" : undefined,
    securityChangeLocked: approval === "securityChange",
    securityChangeTitle:
      approval === "securityChange" ? "密级修改审批中" : undefined,
  };
}

export function getSecurityLevelBadgeClass(level: SecurityLevel): string {
  switch (level) {
    case "公开":
      return "bg-slate-100 text-slate-600";
    case "内部":
      return "bg-sky-50 text-sky-700";
    case "秘密":
      return "bg-amber-50 text-amber-700";
    case "机密":
      return "bg-orange-50 text-orange-700";
    case "绝密":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
