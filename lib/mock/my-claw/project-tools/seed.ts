import type {
  ProjectSharedToolBinding,
  PublishedToolResource,
} from "./types";
import { PROJECT_CLAW_COLLAB_ID } from "@/lib/mock/my-claw/project-conversation/projects";
import { CURRENT_USER_ID } from "@/lib/mock/my-claw/project-conversation/workspaces";

export const PUBLISHED_TOOL_CATALOG: PublishedToolResource[] = [
  {
    id: "tool-req-workflow",
    versionId: "tool-req-workflow-v3",
    kind: "workflow",
    name: "需求分析工作流",
    description: "从需求澄清到拆解清单的标准工作流。",
    publisher: "AgentFoundry",
    version: "3.1.0",
    scenario: "需求调研 / 方案拆解",
    compatibleActorIds: [
      "actor-req-analysis",
      "actor-product-design",
      "actor-ruonan-claw",
    ],
    requiresCredential: false,
    available: true,
  },
  {
    id: "tool-github-mcp",
    versionId: "tool-github-mcp-v2",
    kind: "mcp",
    name: "GitHub MCP",
    description: "读写仓库、创建 PR、查询 Issue。",
    publisher: "AgentFoundry",
    version: "2.4.0",
    scenario: "代码协作 / 仓库操作",
    compatibleActorIds: ["actor-coding", "actor-product-design"],
    requiresCredential: true,
    available: true,
  },
  {
    id: "tool-web-search",
    versionId: "tool-web-search-v1",
    kind: "plugin",
    name: "网页检索插件",
    description: "对公开网页进行检索与摘要。",
    publisher: "Nexus Marketplace",
    version: "1.2.0",
    scenario: "调研 / 竞品分析",
    compatibleActorIds: [
      "actor-req-analysis",
      "actor-ruonan-claw",
      "actor-research-group",
      "actor-product-design",
      "actor-coding",
    ],
    requiresCredential: true,
    available: true,
  },
  {
    id: "tool-approval-action",
    versionId: "tool-approval-action-v1",
    kind: "ontology_action",
    name: "审批动作",
    description: "触发企业审批流动作。",
    publisher: "CeCloud Ontology",
    version: "1.0.1",
    scenario: "权限审批 / 发布门禁",
    compatibleActorIds: ["actor-product-design"],
    requiresCredential: true,
    available: false,
  },
];

export const SEED_SHARED_TOOL_BINDINGS: ProjectSharedToolBinding[] = [
  {
    id: "stb-workflow-req",
    projectId: PROJECT_CLAW_COLLAB_ID,
    publishedResourceVersionId: "tool-req-workflow-v3",
    kind: "workflow",
    displayName: "需求分析工作流",
    permission: "execute",
    compatibleActorIds: [
      "actor-req-analysis",
      "actor-product-design",
      "actor-ruonan-claw",
    ],
    status: "active",
    addedByUserId: CURRENT_USER_ID,
    createdAt: "2026-07-21T10:00:00+08:00",
    updatedAt: "2026-07-21T10:00:00+08:00",
  },
  {
    id: "stb-github-mcp",
    projectId: PROJECT_CLAW_COLLAB_ID,
    publishedResourceVersionId: "tool-github-mcp-v2",
    kind: "mcp",
    displayName: "GitHub MCP",
    permission: "write",
    credentialRef: "cred-github-org",
    compatibleActorIds: ["actor-coding", "actor-product-design"],
    status: "active",
    addedByUserId: CURRENT_USER_ID,
    createdAt: "2026-07-22T11:00:00+08:00",
    updatedAt: "2026-07-27T09:00:00+08:00",
    hasNewerVersion: true,
  },
  {
    id: "stb-web-search",
    projectId: PROJECT_CLAW_COLLAB_ID,
    publishedResourceVersionId: "tool-web-search-v1",
    kind: "plugin",
    displayName: "网页检索插件",
    permission: "execute",
    compatibleActorIds: [
      "actor-req-analysis",
      "actor-ruonan-claw",
      "actor-research-group",
      "actor-product-design",
      "actor-coding",
    ],
    status: "authorization_required",
    addedByUserId: CURRENT_USER_ID,
    createdAt: "2026-07-25T15:00:00+08:00",
    updatedAt: "2026-07-27T08:00:00+08:00",
  },
  {
    id: "stb-approval",
    projectId: PROJECT_CLAW_COLLAB_ID,
    publishedResourceVersionId: "tool-approval-action-v1",
    kind: "ontology_action",
    displayName: "审批动作",
    permission: "execute",
    credentialRef: "cred-ontology",
    compatibleActorIds: ["actor-product-design"],
    status: "revoked",
    addedByUserId: CURRENT_USER_ID,
    createdAt: "2026-07-20T09:00:00+08:00",
    updatedAt: "2026-07-26T18:00:00+08:00",
  },
];

export function getSharedToolsForProject(projectId: string) {
  return SEED_SHARED_TOOL_BINDINGS.filter((item) => item.projectId === projectId);
}

export function getPublishedToolByVersionId(versionId: string) {
  return PUBLISHED_TOOL_CATALOG.find((item) => item.versionId === versionId);
}
