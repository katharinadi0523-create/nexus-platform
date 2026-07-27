import type { CollaborationProject } from "./types";
import { CURRENT_USER_ID } from "./types";

export const COLLABORATION_PROJECTS: CollaborationProject[] = [
  {
    id: "proj-org-collab",
    workspaceId: "ws-agentfoundry",
    name: "Claw 组织协作机制",
    description:
      "专门用来调研 Agent and Human in Org 的协作项目，沉淀 Issue、Squad 与项目上下文机制。",
    status: "active",
    leadUserId: CURRENT_USER_ID,
    memberIds: [CURRENT_USER_ID, "user-linxiao", "user-litao"],
    actorIds: [
      "actor-rowan-claw",
      "actor-linxiao-claw",
      "actor-req-analyst",
      "actor-product-multi",
      "actor-sre-claw",
    ],
    squadIds: ["squad-org-product"],
    contextBrief:
      "## 项目目标\n围绕 My Claw 组织协作，验证 Issue / Squad / Inbox 的人机协同闭环。\n\n## 协作规则\n- Issue 状态与 Run 状态分开\n- Squad 不可嵌套\n- 多智能体作为完整 AgentActor 加入 Squad\n\n## 交付标准\n可演示的完整原型路径与运营看板。",
    createdAt: "2026-07-20T09:00:00+08:00",
    updatedAt: "2026-07-27T01:28:00+08:00",
  },
  {
    id: "proj-kb20",
    workspaceId: "ws-agentfoundry",
    name: "知识库 2.0",
    description: "升级组织知识库检索、引用与 Agent 共享上下文能力。",
    status: "active",
    leadUserId: "user-linxiao",
    memberIds: [CURRENT_USER_ID, "user-linxiao", "user-zhouning"],
    actorIds: [
      "actor-rowan-claw",
      "actor-linxiao-claw",
      "actor-req-analyst",
      "actor-release-workflow",
    ],
    squadIds: [],
    contextBrief:
      "## 项目目标\n完成知识库 2.0 的检索质量、引用链路与 Agent 上下文注入方案。\n\n## 交付标准\n检索评测报告、引用规范、Agent 上下文接入说明。",
    createdAt: "2026-07-18T10:00:00+08:00",
    updatedAt: "2026-07-26T16:40:00+08:00",
  },
  {
    id: "proj-research-auto",
    workspaceId: "ws-research",
    name: "科研分析自动化",
    description: "用异构 Squad 自动化完成文献检索、可视化与结构化调研报告交付。",
    status: "active",
    leadUserId: "user-zhouning",
    memberIds: ["user-zhouning", CURRENT_USER_ID, "user-linxiao"],
    actorIds: [
      "actor-research-claw",
      "actor-zhouning-claw",
      "actor-literature",
      "actor-research-multi",
    ],
    squadIds: ["squad-research-delivery"],
    contextBrief:
      "## 项目目标\n每次调研任务最终交付结构化 Markdown 报告；开源仓库交给 Token 类 Agent，可视化交给 Helper 类 Agent。\n\n## 协作规则\nSquad Leader 负责任务拆分与汇总；Human Reviewer 验收后才可 Done。",
    createdAt: "2026-07-22T11:00:00+08:00",
    updatedAt: "2026-07-27T00:50:00+08:00",
  },
];

export function getProjectById(
  projectId: string
): CollaborationProject | undefined {
  return COLLABORATION_PROJECTS.find((project) => project.id === projectId);
}
