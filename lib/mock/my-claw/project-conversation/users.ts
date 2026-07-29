import type { CollaborationUser } from "./types";
import { CURRENT_USER_ID } from "./workspaces";

const WS_AGENTFOUNDRY = "ws-agentfoundry";
const WS_RESEARCH = "ws-research";

/**
 * Human directory. Add-member drawer only lists people in the same Workspace
 * as the current Project, excluding those already in the Project.
 */
export const PROJECT_CONVERSATION_USERS: CollaborationUser[] = [
  {
    id: CURRENT_USER_ID,
    name: "邸若楠",
    title: "产品经理",
    initials: "邸",
    workspaceIds: [WS_AGENTFOUNDRY, WS_RESEARCH],
  },
  {
    id: "user-linxiao",
    name: "林晓",
    title: "设计师",
    initials: "LX",
    workspaceIds: [WS_AGENTFOUNDRY, WS_RESEARCH],
  },
  {
    id: "user-litao",
    name: "李涛",
    title: "研发工程师",
    initials: "LT",
    workspaceIds: [WS_AGENTFOUNDRY],
  },
  {
    id: "user-zhouning",
    name: "周宁",
    title: "测试工程师",
    initials: "ZN",
    workspaceIds: [WS_AGENTFOUNDRY, WS_RESEARCH],
  },
  // Workspace members not yet in "Claw 组织协作机制" — for Add Member demo
  {
    id: "user-member-a",
    name: "项目成员 A",
    title: "业务分析",
    initials: "A",
    workspaceIds: [WS_AGENTFOUNDRY],
  },
  {
    id: "user-admin-b",
    name: "项目管理员 B",
    title: "项目管理",
    initials: "B",
    workspaceIds: [WS_AGENTFOUNDRY],
  },
  {
    id: "user-dev-c",
    name: "项目开发者 C",
    title: "前端开发",
    initials: "C",
    workspaceIds: [WS_AGENTFOUNDRY],
  },
  {
    id: "user-ops-d",
    name: "项目运维 D",
    title: "运维工程师",
    initials: "D",
    workspaceIds: [WS_AGENTFOUNDRY],
  },
  {
    id: "user-research-e",
    name: "科研协作 E",
    title: "科研助理",
    initials: "E",
    workspaceIds: [WS_RESEARCH],
  },
  {
    id: "user-chenhe",
    name: "陈禾",
    title: "田间技术员",
    initials: "陈",
    workspaceIds: [WS_RESEARCH],
  },
  {
    id: "user-zhaoyan",
    name: "赵妍",
    title: "农业统计研究员",
    initials: "赵",
    workspaceIds: [WS_RESEARCH],
  },
];

export function getUserById(id: string) {
  return PROJECT_CONVERSATION_USERS.find((item) => item.id === id);
}

export function getWorkspaceUsers(workspaceId: string) {
  return PROJECT_CONVERSATION_USERS.filter((user) =>
    user.workspaceIds.includes(workspaceId),
  );
}
