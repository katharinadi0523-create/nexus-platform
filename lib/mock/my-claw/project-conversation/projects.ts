import type {
  CollaborationProject,
  ProjectMember,
  ProjectThread,
  ProjectWorkSource,
} from "./types";
import { CURRENT_USER_ID } from "./workspaces";

export const PROJECT_CLAW_COLLAB_ID = "proj-claw-collab";
export const PROJECT_KB_ID = "proj-kb-2";
export const PROJECT_RESEARCH_ID = "proj-research-agent";

export const PROJECT_CONVERSATION_PROJECTS: CollaborationProject[] = [
  {
    id: PROJECT_CLAW_COLLAB_ID,
    workspaceId: "ws-agentfoundry",
    name: "Claw 组织协作机制",
    description: "订单导出功能的跨角色 Agent 协作示例",
    status: "active",
    ownerUserId: CURRENT_USER_ID,
    threadId: "thread-claw-collab",
    brief:
      "目标：完成「订单导出」功能从需求拆解、PRD、开发到测试的端到端协作。",
    humanMemberIds: [
      CURRENT_USER_ID,
      "user-linxiao",
      "user-litao",
      "user-zhouning",
    ],
    agentMemberIds: [
      "actor-req-analysis",
      "actor-product-design",
      "actor-coding",
      "actor-auto-test",
      "actor-ruonan-claw",
    ],
    workSourceIds: ["ws-github-collab", "ws-local-collab"],
    createdAt: "2026-07-20T10:00:00+08:00",
    updatedAt: "2026-07-27T16:40:00+08:00",
  },  {
    id: PROJECT_KB_ID,
    workspaceId: "ws-agentfoundry",
    name: "知识库 2.0",
    description: "知识库检索与写作协作",
    status: "active",
    ownerUserId: "user-litao",
    threadId: "thread-kb-2",
    brief: "建设可引用的企业知识库能力。",
    humanMemberIds: [CURRENT_USER_ID, "user-litao"],
    agentMemberIds: ["actor-ruonan-claw", "actor-req-analysis"],
    workSourceIds: ["ws-github-kb"],
    createdAt: "2026-07-18T09:00:00+08:00",
    updatedAt: "2026-07-26T16:00:00+08:00",
  },
  {
    id: PROJECT_RESEARCH_ID,
    workspaceId: "ws-research",
    name: "科研 Agent 协作",
    description: "跨学科科研 Agent 协同验证",
    status: "active",
    ownerUserId: "user-zhouning",
    threadId: "thread-research",
    brief: "验证科研多智能体在公开会话中的协作体验。",
    humanMemberIds: [CURRENT_USER_ID, "user-zhouning", "user-linxiao"],
    agentMemberIds: ["actor-research-group", "actor-ruonan-claw"],
    workSourceIds: [],
    createdAt: "2026-07-15T11:00:00+08:00",
    updatedAt: "2026-07-25T14:00:00+08:00",
  },
];

export const PROJECT_CONVERSATION_THREADS: ProjectThread[] = [
  {
    id: "thread-claw-collab",
    workspaceId: "ws-agentfoundry",
    projectId: PROJECT_CLAW_COLLAB_ID,
    messageIds: [],
    createdAt: "2026-07-20T10:00:00+08:00",
    updatedAt: "2026-07-27T10:20:00+08:00",
  },
  {
    id: "thread-kb-2",
    workspaceId: "ws-agentfoundry",
    projectId: PROJECT_KB_ID,
    messageIds: [],
    createdAt: "2026-07-18T09:00:00+08:00",
    updatedAt: "2026-07-26T16:00:00+08:00",
  },
  {
    id: "thread-research",
    workspaceId: "ws-research",
    projectId: PROJECT_RESEARCH_ID,
    messageIds: [],
    createdAt: "2026-07-15T11:00:00+08:00",
    updatedAt: "2026-07-25T14:00:00+08:00",
  },
];

export const PROJECT_WORK_SOURCES: ProjectWorkSource[] = [
  {
    id: "ws-github-collab",
    projectId: PROJECT_CLAW_COLLAB_ID,
    type: "github_repository",
    name: "nexus-platform",
    detail: "github.com/agentfoundry/nexus-platform · main · /docs",
    access: "read_write",
    availability: "available",
  },
  {
    id: "ws-local-collab",
    projectId: PROJECT_CLAW_COLLAB_ID,
    type: "local_directory",
    name: "本地工作区",
    detail: "~/Dev-Projects/nexus-platform",
    access: "read_write",
    availability: "available",
    runtimeActorId: "actor-coding",
  },
  {
    id: "ws-github-kb",
    projectId: PROJECT_KB_ID,
    type: "github_repository",
    name: "knowledge-base-2",
    detail: "github.com/agentfoundry/knowledge-base-2 · develop",
    access: "read",
    availability: "available",
  },
];

export const PROJECT_MEMBERS_BY_PROJECT: Record<string, ProjectMember[]> = {
  [PROJECT_CLAW_COLLAB_ID]: [
    {
      kind: "human",
      userId: CURRENT_USER_ID,
      role: "owner",
      state: "active",
    },
    {
      kind: "human",
      userId: "user-linxiao",
      role: "member",
      state: "active",
    },
    {
      kind: "human",
      userId: "user-litao",
      role: "member",
      state: "active",
    },
    {
      kind: "human",
      userId: "user-zhouning",
      role: "member",
      state: "active",
    },
    {
      kind: "agent",
      actorId: "actor-req-analysis",
      actorType: "platform_claw",
      state: "active",
    },
    {
      kind: "agent",
      actorId: "actor-product-design",
      actorType: "platform_claw",
      state: "active",
    },
    {
      kind: "agent",
      actorId: "actor-coding",
      actorType: "platform_claw",
      state: "active",
    },
    {
      kind: "agent",
      actorId: "actor-auto-test",
      actorType: "platform_claw",
      state: "active",
    },
    {
      kind: "agent",
      actorId: "actor-ruonan-claw",
      actorType: "personal_claw",
      state: "active",
    },
  ],
  [PROJECT_KB_ID]: [
    {
      kind: "human",
      userId: "user-litao",
      role: "owner",
      state: "active",
    },
    {
      kind: "human",
      userId: CURRENT_USER_ID,
      role: "member",
      state: "active",
    },
    {
      kind: "agent",
      actorId: "actor-ruonan-claw",
      actorType: "personal_claw",
      state: "active",
    },
    {
      kind: "agent",
      actorId: "actor-req-analysis",
      actorType: "platform_claw",
      state: "active",
    },
  ],
  [PROJECT_RESEARCH_ID]: [
    {
      kind: "human",
      userId: "user-zhouning",
      role: "owner",
      state: "active",
    },
    {
      kind: "human",
      userId: CURRENT_USER_ID,
      role: "member",
      state: "active",
    },
    {
      kind: "human",
      userId: "user-linxiao",
      role: "member",
      state: "active",
    },
    {
      kind: "agent",
      actorId: "actor-research-group",
      actorType: "multi_agent_group",
      state: "active",
    },
    {
      kind: "agent",
      actorId: "actor-ruonan-claw",
      actorType: "personal_claw",
      state: "pending_consent",
    },
  ],
};
export function getProjectById(id: string) {
  return PROJECT_CONVERSATION_PROJECTS.find((item) => item.id === id);
}

export function getThreadById(id: string) {
  return PROJECT_CONVERSATION_THREADS.find((item) => item.id === id);
}

export function getWorkSourcesForProject(projectId: string) {
  return PROJECT_WORK_SOURCES.filter((item) => item.projectId === projectId);
}
