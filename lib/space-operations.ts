/** 空间运营：路由与导航配置（子页面按 segment 扩展） */

export const SPACE_OPERATIONS_BASE = "/space-operations";

/** Mock：后续可接租户 / 空间上下文 */
export const SPACE_DISPLAY_NAME = "空间运营";

export interface SpaceOperationsTab {
  /** URL 段，对应 app/(dashboard)/space-operations/<segment>/page.tsx */
  segment: string;
  label: string;
}

export const SPACE_OPERATIONS_TABS: SpaceOperationsTab[] = [
  { segment: "dashboard", label: "全局看板" },
  { segment: "tools", label: "工具" },
  { segment: "skills", label: "技能" },
  { segment: "run-config", label: "运行配置" },
  { segment: "approvals", label: "审批" },
  { segment: "logs", label: "日志" },
];

/** 从侧栏进入「空间运营」时的默认子页（与 Tab 顺序无关） */
export const DEFAULT_SPACE_OPERATIONS_SEGMENT = "run-config";

export function spaceOperationsHref(segment: string): string {
  return `${SPACE_OPERATIONS_BASE}/${segment}`;
}

const SEGMENT_SET = new Set(SPACE_OPERATIONS_TABS.map((t) => t.segment));

export function isValidSpaceOperationsSegment(segment: string): boolean {
  return SEGMENT_SET.has(segment);
}

export type SpaceOperationsTabSegment = (typeof SPACE_OPERATIONS_TABS)[number]["segment"];
