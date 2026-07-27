import type { CollaborationWorkspace } from "./types";

export const CURRENT_USER_ID = "user-ruonan";

export const PROJECT_CONVERSATION_WORKSPACES: CollaborationWorkspace[] = [
  {
    id: "ws-agentfoundry",
    name: "AgentFoundry 产研空间",
    organizationName: "AgentFoundry",
    description: "组织协作与 Agent 产研相关项目",
  },
  {
    id: "ws-research",
    name: "科研项目协同空间",
    organizationName: "科研中心",
    description: "跨团队科研 Agent 协作",
  },
];

export function getWorkspaceById(id: string) {
  return PROJECT_CONVERSATION_WORKSPACES.find((item) => item.id === id);
}
