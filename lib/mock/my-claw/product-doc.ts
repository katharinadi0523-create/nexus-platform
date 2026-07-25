export type ProductDocTab = "request" | "code";

export type ProductDocPhase =
  | "pending"
  | "approval_required"
  | "denied"
  | "running"
  | "success"
  | "failed";

export type ProductDocOutcome = "success" | "failed";

export type ProductDocCardState = "is-current" | "is-past" | "is-future";

export type ProductDocTone =
  | "pending"
  | "approval"
  | "denied"
  | "running"
  | "success"
  | "failed";

export interface ProductDocStage {
  id: ProductDocPhase;
  label: string;
  code: string;
  tone: ProductDocTone;
}

export interface ProductDocTabItem {
  id: ProductDocTab;
  label: string;
}

export interface ProductDocFlowState {
  phase: ProductDocPhase;
  outcome: ProductDocOutcome;
}

export interface ProductDocDemo {
  title: string;
  pendingTitle: string;
  runningTitle: string;
  approvalCopy: string;
  approvalSubcopy?: string;
  runningCopy?: string;
  deniedCopy?: string;
  successCopy?: string;
  failedCopy?: string;
  requestLine?: string;
  request?: Record<string, unknown>;
  successResponse?: Record<string, unknown>;
  errorResponse?: Record<string, unknown>;
  failureDetailLabel?: string;
  commandType?: string;
  command?: string;
  runningOutput?: string;
  successOutput?: string;
  errorOutput?: string;
}

export const PRODUCT_DOC_TABS: ProductDocTabItem[] = [
  { id: "request", label: "请求响应类" },
  { id: "code", label: "代码执行类" },
];

export const PRODUCT_DOC_STAGES: ProductDocStage[] = [
  { id: "pending", label: "等待执行", code: "pending", tone: "pending" },
  { id: "approval_required", label: "等待用户授权", code: "approval_required", tone: "approval" },
  { id: "denied", label: "已拒绝", code: "denied", tone: "denied" },
  { id: "running", label: "执行中", code: "running", tone: "running" },
  { id: "success", label: "完成", code: "success", tone: "success" },
  { id: "failed", label: "失败", code: "failed", tone: "failed" },
];

export const PRODUCT_DOC_DEMOS: Record<ProductDocTab, ProductDocDemo> = {
  request: {
    title: "提交差旅申请（MCP）",
    pendingTitle: "提交差旅申请（MCP）",
    runningTitle: "正在提交差旅申请（MCP）",
    approvalCopy: "Agent 将代表你向差旅系统提交申请，请确认本次差旅申请记录。",
    approvalSubcopy: "",
    requestLine: "POST /api/travel/applications",
    request: {
      title: "北京出差申请",
      employee_id: "E12345",
      department: "市场部",
      destination: "北京",
      start_date: "2026-05-20",
      end_date: "2026-05-22",
      purpose: "参与市场活动及洽谈",
      estimated_cost: 3200,
      attachments: [{ type: "file", name: "会议邀请函.pdf" }],
    },
    successResponse: {
      code: 0,
      message: "success",
      data: {
        application_id: "TRV20260518101622",
        status: "Submitted",
        submit_time: "2026-05-18T10:16:22",
      },
    },
    errorResponse: {
      code: 4000,
      message: "日期不合法，无法提交申请",
      detail: "出发日期晚于返程日期，预计费用 3200 元",
    },
    failureDetailLabel: "服务端返回",
  },
  code: {
    title: "执行高敏命令",
    pendingTitle: "执行高敏命令",
    runningTitle: "执行高敏命令",
    approvalCopy:
      "Agent 请求在生产预算系统批量调增市场部差旅预算上限，该命令会写入生产数据库并影响后续审批额度，请确认。",
    runningCopy: "正在执行生产预算批量写入命令，请稍候...",
    successCopy: "命令已执行完成，生产预算策略已更新。",
    failedCopy: "命令执行失败，已停止写入并保留错误输出。",
    commandType: "shell",
    command:
      "python3 ops/budget_admin.py apply-adjustment --env prod --department 市场部 --percent 20 --commit",
    runningOutput: [
      "Connecting to prod-budget-db.internal ...",
      "Matched 18 travel budget policies",
      "Writing adjustment percent=20 to department=市场部 ...",
      "Audit log stream opened: AUD-20260518-101622",
    ].join("\n"),
    successOutput: [
      "Updated 18 travel budget policies",
      "Audit id: AUD-20260518-101622",
      "Affected approval rules: 6",
      "Exit code: 0",
    ].join("\n"),
    errorOutput: [
      "ERROR: production budget table is locked",
      "Rollback complete; no partial update remains",
      "Exit code: 1",
    ].join("\n"),
    failureDetailLabel: "执行输出",
  },
};

const PHASE_ORDER: ProductDocPhase[] = [
  "pending",
  "approval_required",
  "denied",
  "running",
  "success",
  "failed",
];

export function createInitialProductDocFlows(): Record<ProductDocTab, ProductDocFlowState> {
  return {
    request: { phase: "pending", outcome: "success" },
    code: { phase: "pending", outcome: "success" },
  };
}

export function productDocReachIndex(phase: ProductDocPhase): number {
  const order: Record<ProductDocPhase, number> = {
    pending: 0,
    approval_required: 1,
    denied: 2,
    running: 3,
    success: 4,
    failed: 5,
  };
  return order[phase] ?? 0;
}

export function productDocCardState(
  stageId: ProductDocPhase,
  phase: ProductDocPhase
): ProductDocCardState {
  if (stageId === phase) {
    return "is-current";
  }
  const currentIndex = productDocReachIndex(phase);
  const stageIndex = productDocReachIndex(stageId);

  if (phase === "denied") {
    return stageId === "pending" || stageId === "approval_required" ? "is-past" : "is-future";
  }
  if (phase === "failed") {
    return ["pending", "approval_required", "running"].includes(stageId) ? "is-past" : "is-future";
  }
  if (phase === "success") {
    return ["pending", "approval_required", "running"].includes(stageId) ? "is-past" : "is-future";
  }
  return stageIndex < currentIndex ? "is-past" : "is-future";
}

export function productDocKeyHint(phase: ProductDocPhase): string {
  if (phase === "running") {
    return "点击模拟成功或者模拟失败按钮查看不同执行结果分支";
  }
  if (phase === "denied" || phase === "success" || phase === "failed") {
    return "已到终态，按 → 可重新开始";
  }
  return "按 ← / → 切换状态";
}

export function advanceProductDocFlow(flow: ProductDocFlowState): ProductDocFlowState {
  if (flow.phase === "pending") {
    return { ...flow, phase: "approval_required" };
  }
  if (flow.phase === "running") {
    return { ...flow, phase: flow.outcome === "failed" ? "failed" : "success" };
  }
  if (flow.phase === "denied" || flow.phase === "success" || flow.phase === "failed") {
    return { phase: "pending", outcome: "success" };
  }
  return flow;
}

export function retreatProductDocFlow(flow: ProductDocFlowState): ProductDocFlowState {
  const index = PHASE_ORDER.indexOf(flow.phase);
  if (index <= 0) {
    return flow;
  }
  const phase = PHASE_ORDER[index - 1]!;
  return {
    phase,
    outcome: phase === "failed" ? flow.outcome : "success",
  };
}

export function jumpProductDocPhase(
  flow: ProductDocFlowState,
  phase: ProductDocPhase
): ProductDocFlowState {
  if (!PRODUCT_DOC_STAGES.some((stage) => stage.id === phase)) {
    return flow;
  }
  if (phase === "success") {
    return { phase, outcome: "success" };
  }
  if (phase === "failed") {
    return { phase, outcome: "failed" };
  }
  return { ...flow, phase };
}

export function formatProductDocJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value ?? "");
  }
}

export function commandOutputForStage(stageId: ProductDocPhase, demo: ProductDocDemo): string {
  if (stageId === "running") return demo.runningOutput || "";
  if (stageId === "success") return demo.successOutput || "";
  if (stageId === "failed") return demo.errorOutput || "";
  return "";
}
