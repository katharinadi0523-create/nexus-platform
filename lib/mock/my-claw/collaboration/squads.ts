import type { Squad } from "./types";

export const SQUADS: Squad[] = [
  {
    id: "squad-org-product",
    workspaceId: "ws-agentfoundry",
    projectId: "proj-org-collab",
    name: "组织协作产品小队",
    description:
      "个人 Claw 带入 Human，再叠加需求分析平台 Claw 与产品设计多智能体组。",
    leaderActorId: "actor-linxiao-claw",
    agentMembers: [
      {
        actorId: "actor-linxiao-claw",
        state: "active",
        roleLabel: "Leader",
      },
      {
        actorId: "actor-rowan-claw",
        state: "active",
        roleLabel: "产品规格",
      },
      {
        actorId: "actor-req-analyst",
        state: "active",
        roleLabel: "需求分析",
      },
      {
        actorId: "actor-product-multi",
        state: "active",
        roleLabel: "可视化与前端",
      },
    ],
    status: "running",
    activeIssueCount: 2,
    updatedAt: "2026-07-27T01:20:00+08:00",
  },
  {
    id: "squad-research-delivery",
    workspaceId: "ws-research",
    projectId: "proj-research-auto",
    name: "科研交付小队",
    description:
      "科研平台 Claw 带领文献检索、科研多智能体组与周宁的 Claw（待确认）。",
    leaderActorId: "actor-research-claw",
    agentMembers: [
      {
        actorId: "actor-research-claw",
        state: "active",
        roleLabel: "Leader",
      },
      {
        actorId: "actor-zhouning-claw",
        state: "pending_consent",
        roleLabel: "数据核对",
      },
      {
        actorId: "actor-literature",
        state: "active",
        roleLabel: "文献检索",
      },
      {
        actorId: "actor-research-multi",
        state: "active",
        roleLabel: "报告编排",
      },
    ],
    status: "degraded",
    activeIssueCount: 1,
    updatedAt: "2026-07-27T00:48:00+08:00",
  },
];

export function getSquadById(squadId: string): Squad | undefined {
  return SQUADS.find((squad) => squad.id === squadId);
}
