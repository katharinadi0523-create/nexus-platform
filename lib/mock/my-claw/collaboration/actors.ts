import type { AgentActor, CollaborationUser } from "./types";
import { CURRENT_USER_ID } from "./types";
import { COLLABORATION_USERS } from "./users";

export const AGENT_ACTORS: AgentActor[] = [
  {
    id: "actor-rowan-claw",
    workspaceId: "ws-agentfoundry",
    type: "personal_claw",
    name: "若楠的 Claw",
    description: "擅长产品拆解、原型规格与协作流程设计。",
    ownerUserId: CURRENT_USER_ID,
    sourceLabel: "个人空间 / 若楠",
    runtimeStatus: "online",
    activeRunCount: 1,
    lastActiveAt: "2026-07-27T01:20:00+08:00",
  },
  {
    id: "actor-linxiao-claw",
    workspaceId: "ws-agentfoundry",
    type: "personal_claw",
    name: "林晓的 Claw",
    description: "产品负责人侧助手，负责需求收敛与验收对齐。",
    ownerUserId: "user-linxiao",
    sourceLabel: "个人空间 / 林晓",
    runtimeStatus: "busy",
    activeRunCount: 2,
    lastActiveAt: "2026-07-27T01:25:00+08:00",
  },
  {
    id: "actor-litao-claw",
    workspaceId: "ws-agentfoundry",
    type: "personal_claw",
    name: "李涛的 Claw",
    description: "偏运维与稳定性，适合值班巡检与发布风险检查。",
    ownerUserId: "user-litao",
    sourceLabel: "个人空间 / 李涛",
    runtimeStatus: "online",
    activeRunCount: 0,
    lastActiveAt: "2026-07-26T21:10:00+08:00",
  },
  {
    id: "actor-zhouning-claw",
    workspaceId: "ws-research",
    type: "personal_claw",
    name: "周宁的 Claw",
    description: "科研数据与实验记录助手。",
    ownerUserId: "user-zhouning",
    sourceLabel: "个人空间 / 周宁",
    runtimeStatus: "offline",
    activeRunCount: 0,
    lastActiveAt: "2026-07-25T18:00:00+08:00",
  },
  {
    id: "actor-research-claw",
    workspaceId: "ws-research",
    type: "platform_claw",
    name: "科研 Claw",
    description: "组织侧发布的科研调研主 Claw，负责报告结构与任务编排。",
    sourceLabel: "科研协同空间 / 平台 Claw",
    runtimeStatus: "online",
    activeRunCount: 1,
    lastActiveAt: "2026-07-27T00:45:00+08:00",
  },
  {
    id: "actor-sre-claw",
    workspaceId: "ws-agentfoundry",
    type: "platform_claw",
    name: "SRE 值班 Claw",
    description: "发布检查、告警解读与值班交接。",
    sourceLabel: "AgentFoundry 研发空间 / 平台 Claw",
    runtimeStatus: "online",
    activeRunCount: 0,
    lastActiveAt: "2026-07-26T23:00:00+08:00",
  },
  {
    id: "actor-req-analyst",
    workspaceId: "ws-agentfoundry",
    type: "platform_claw",
    name: "需求分析 Claw",
    description: "平台发布的需求分析 Claw，拆解 PRD 并补齐验收标准。",
    sourceLabel: "AgentFoundry 研发空间 / 平台 Claw",
    runtimeStatus: "online",
    activeRunCount: 1,
    lastActiveAt: "2026-07-27T01:10:00+08:00",
  },
  {
    id: "actor-literature",
    workspaceId: "ws-research",
    type: "platform_claw",
    name: "文献检索 Claw",
    description: "检索、筛选并摘要开源仓库与论文。",
    sourceLabel: "科研协同空间 / 平台 Claw",
    runtimeStatus: "busy",
    activeRunCount: 1,
    lastActiveAt: "2026-07-27T00:40:00+08:00",
  },
  {
    id: "actor-release-workflow",
    workspaceId: "ws-agentfoundry",
    type: "platform_claw",
    name: "发布检查 Claw",
    description: "封装发布前检查工作流的平台 Claw。",
    sourceLabel: "AgentFoundry 研发空间 / 平台 Claw",
    runtimeStatus: "online",
    activeRunCount: 0,
    lastActiveAt: "2026-07-26T19:30:00+08:00",
  },
  {
    id: "actor-research-multi",
    workspaceId: "ws-research",
    type: "multi_agent_group",
    name: "科研多智能体",
    description:
      "内部编排文献、可视化与写作子 Agent，对外作为一个完整多智能体组。",
    sourceLabel: "科研协同空间 / 多智能体组",
    runtimeStatus: "online",
    activeRunCount: 1,
    lastActiveAt: "2026-07-27T00:42:00+08:00",
  },
  {
    id: "actor-product-multi",
    workspaceId: "ws-agentfoundry",
    type: "multi_agent_group",
    name: "产品设计多智能体",
    description: "覆盖交互、视觉与前端落地建议的多智能体组，外层计为一个 Agent。",
    sourceLabel: "AgentFoundry 研发空间 / 多智能体组",
    runtimeStatus: "busy",
    activeRunCount: 1,
    lastActiveAt: "2026-07-27T01:22:00+08:00",
  },
];

export function getActorById(actorId: string): AgentActor | undefined {
  return AGENT_ACTORS.find((actor) => actor.id === actorId);
}

export function getPersonalClawForUser(
  userId: string
): AgentActor | undefined {
  return AGENT_ACTORS.find(
    (actor) => actor.type === "personal_claw" && actor.ownerUserId === userId
  );
}

export function getHumanForPersonalClaw(
  actorId: string
): CollaborationUser | undefined {
  const actor = getActorById(actorId);
  if (!actor || actor.type !== "personal_claw" || !actor.ownerUserId) {
    return undefined;
  }
  return COLLABORATION_USERS.find((user) => user.id === actor.ownerUserId);
}
