import type { MyClawSessionListItem } from "./types";

/**
 * Session list seeds ported from 会话交互 `data.js` → `recentTasks`,
 * plus a research multi-agent session for the scientific flow.
 */
export const MY_CLAW_SESSIONS: MyClawSessionListItem[] = [
  {
    id: "task-001",
    title: "上海出差报销",
    kind: "expense",
    pinned: true,
    updatedAt: "2026-07-26T09:42:00.000Z",
    preview: "报销草稿已提交 OA，附件清单与申请表已生成。",
  },
  {
    id: "task-002",
    title: "桌面助手前端设计",
    kind: "enterprise_session",
    pinned: true,
    updatedAt: "2026-07-26T08:15:00.000Z",
    preview: "等待确认信息架构与关键界面组件拆分方案。",
  },
  {
    id: "task-research-001",
    title: "生成式 AI 科研协作效率研究",
    kind: "research_multi_agent",
    pinned: true,
    updatedAt: "2026-07-25T16:30:00.000Z",
    preview: "多智能体已完成假设与文献阶段，绘图与论文草稿进行中。",
  },
  {
    id: "task-003",
    title: "华东经营周报整理",
    kind: "enterprise_session",
    pinned: false,
    updatedAt: "2026-07-25T14:08:00.000Z",
    preview: "正在汇总区域指标与异常波动说明…",
  },
  {
    id: "task-004",
    title: "Q1 销售复盘报告",
    kind: "enterprise_session",
    pinned: false,
    updatedAt: "2026-07-24T11:20:00.000Z",
    preview: "已导入销售漏斗数据，待发起复盘结构起草。",
  },
  {
    id: "task-005",
    title: "供应商合同摘要",
    kind: "enterprise_session",
    pinned: false,
    updatedAt: "2026-07-23T19:05:00.000Z",
    preview: "解析失败：合同扫描件第 3 页无法识别关键条款。",
  },
  {
    id: "task-006",
    title: "招聘 JD 批量生成",
    kind: "enterprise_session",
    pinned: false,
    updatedAt: "2026-07-22T10:40:00.000Z",
    preview: "岗位清单已就绪，可一键生成多份 JD 草稿。",
  },
  {
    id: "task-007",
    title: "差旅制度版本对比",
    kind: "enterprise_session",
    pinned: false,
    updatedAt: "2026-07-21T15:55:00.000Z",
    preview: "已输出 v3 与 v4 差异对照表及影响范围说明。",
  },
  {
    id: "task-008",
    title: "客户拜访纪要归档",
    kind: "enterprise_session",
    pinned: false,
    updatedAt: "2026-07-20T07:30:00.000Z",
    preview: "待确认归档目录与 CRM 关联字段映射。",
  },
];

export function getMyClawSession(
  id: string
): MyClawSessionListItem | undefined {
  return MY_CLAW_SESSIONS.find((session) => session.id === id);
}

export function getPinnedMyClawSessions(): MyClawSessionListItem[] {
  return MY_CLAW_SESSIONS.filter((session) => session.pinned);
}

export function getRecentMyClawSessions(): MyClawSessionListItem[] {
  return MY_CLAW_SESSIONS.filter((session) => !session.pinned);
}
