import type { OrganizationWorkspace } from "./types";

export const ORGANIZATION_WORKSPACES: OrganizationWorkspace[] = [
  {
    id: "ws-agentfoundry",
    kind: "organization",
    name: "AgentFoundry 研发空间",
    description: "承载 Claw、智能体、多智能体与组织协作产品资产的研发工作空间。",
    organizationName: "AgentFoundry",
    projectCount: 2,
    actorCount: 8,
  },
  {
    id: "ws-research",
    kind: "organization",
    name: "科研协同空间",
    description: "面向科研分析、文献检索与报告交付的跨角色协作空间。",
    organizationName: "科研中心",
    projectCount: 1,
    actorCount: 4,
  },
];

export function getWorkspaceById(
  workspaceId: string
): OrganizationWorkspace | undefined {
  return ORGANIZATION_WORKSPACES.find((workspace) => workspace.id === workspaceId);
}
