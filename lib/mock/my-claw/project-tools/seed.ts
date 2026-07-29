import type {
  ConversationSkillBinding,
  ConversationToolBinding,
  ProjectSharedToolBinding,
  ProjectSkillBinding,
  PublishedToolResource,
} from "./types";
import { PROJECT_CLAW_COLLAB_ID } from "@/lib/mock/my-claw/project-conversation/projects";
import {
  CONV_LINEAGE,
  CONV_PROTO_VERIFY,
  CONV_REQ_DISCUSSION,
} from "@/lib/mock/my-claw/project-conversation/projects";
import { CURRENT_USER_ID } from "@/lib/mock/my-claw/project-conversation/workspaces";
import {
  LUNG_CONVERSATION_SKILLS,
  LUNG_CONVERSATION_TOOLS,
  LUNG_PROJECT_SKILLS,
  LUNG_PUBLISHED_TOOLS,
  LUNG_SHARED_TOOLS,
} from "@/lib/mock/my-claw/project-conversation/lung-immunotherapy-seed";

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
    id: "tool-prd-workflow",
    versionId: "tool-prd-workflow-v1",
    kind: "workflow",
    name: "PRD 写作工作流",
    description: "结构化撰写产品需求文档。",
    publisher: "AgentFoundry",
    version: "1.0.0",
    scenario: "产品设计 / PRD",
    compatibleActorIds: ["actor-product-design", "actor-req-analysis"],
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
    id: "tool-data-analysis",
    versionId: "tool-data-analysis-v2",
    kind: "workflow",
    name: "数据分析工作流",
    description: "清洗、统计与差异分析流水线。",
    publisher: "AgentFoundry Research",
    version: "2.0.0",
    scenario: "科研 / 数据分析",
    compatibleActorIds: [
      "actor-research-group",
      "actor-ruonan-claw",
      "actor-coding",
    ],
    requiresCredential: false,
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
    available: true,
  },
  {
    id: "tool-local-dir",
    versionId: "tool-local-dir-v1",
    kind: "plugin",
    name: "本地目录工具",
    description: "读写本机工作目录（会话增量）。",
    publisher: "AgentFoundry",
    version: "1.1.0",
    scenario: "本地调试",
    compatibleActorIds: ["actor-coding", "actor-ruonan-claw"],
    requiresCredential: false,
    available: true,
  },
  {
    id: "tool-viz-workflow",
    versionId: "tool-viz-workflow-v1",
    kind: "workflow",
    name: "科研绘图工作流",
    description: "生成科研图表与报告插图。",
    publisher: "AgentFoundry Research",
    version: "1.0.2",
    scenario: "科研可视化",
    // Incompatible with coding agent — for demo
    compatibleActorIds: ["actor-research-group", "actor-ruonan-claw"],
    requiresCredential: false,
    available: true,
  },
  {
    id: "tool-revoked-plugin",
    versionId: "tool-revoked-plugin-v1",
    kind: "plugin",
    name: "已失效文献检索",
    description: "示例：会话工具已 revoked。",
    publisher: "Marketplace",
    version: "0.9.0",
    scenario: "文献检索",
    compatibleActorIds: ["actor-research-group"],
    requiresCredential: true,
    available: false,
  },
];

export const SEED_SHARED_TOOL_BINDINGS: ProjectSharedToolBinding[] = [
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
    credentialRef: "cred-web-search",
    compatibleActorIds: [
      "actor-req-analysis",
      "actor-ruonan-claw",
      "actor-research-group",
      "actor-product-design",
      "actor-coding",
    ],
    status: "active",
    addedByUserId: CURRENT_USER_ID,
    createdAt: "2026-07-25T15:00:00+08:00",
    updatedAt: "2026-07-28T10:00:00+08:00",
  },
  {
    id: "stb-data-analysis",
    projectId: PROJECT_CLAW_COLLAB_ID,
    publishedResourceVersionId: "tool-data-analysis-v2",
    kind: "workflow",
    displayName: "数据分析工作流",
    permission: "execute",
    compatibleActorIds: [
      "actor-research-group",
      "actor-ruonan-claw",
      "actor-coding",
    ],
    status: "active",
    addedByUserId: CURRENT_USER_ID,
    createdAt: "2026-07-28T09:00:00+08:00",
    updatedAt: "2026-07-28T09:00:00+08:00",
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
    status: "authorization_required",
    addedByUserId: CURRENT_USER_ID,
    createdAt: "2026-07-20T09:00:00+08:00",
    updatedAt: "2026-07-29T08:00:00+08:00",
  },
];

export const SEED_CONVERSATION_TOOL_BINDINGS: ConversationToolBinding[] = [
  {
    id: "ctb-prd-workflow",
    projectId: PROJECT_CLAW_COLLAB_ID,
    conversationId: CONV_REQ_DISCUSSION,
    publishedResourceVersionId: "tool-prd-workflow-v1",
    kind: "workflow",
    displayName: "PRD 写作工作流",
    permission: "execute",
    compatibleActorIds: ["actor-product-design", "actor-req-analysis"],
    status: "active",
    addedByUserId: CURRENT_USER_ID,
    createdAt: "2026-07-27T09:30:00+08:00",
  },
  {
    id: "ctb-local-dir",
    projectId: PROJECT_CLAW_COLLAB_ID,
    conversationId: CONV_PROTO_VERIFY,
    publishedResourceVersionId: "tool-local-dir-v1",
    kind: "plugin",
    displayName: "本地目录工具",
    permission: "write",
    compatibleActorIds: ["actor-coding", "actor-ruonan-claw"],
    status: "active",
    addedByUserId: CURRENT_USER_ID,
    createdAt: "2026-07-28T10:00:00+08:00",
  },
  {
    // Duplicate of Project web search — for dedupe demo
    id: "ctb-web-search-dup",
    projectId: PROJECT_CLAW_COLLAB_ID,
    conversationId: CONV_PROTO_VERIFY,
    publishedResourceVersionId: "tool-web-search-v1",
    kind: "plugin",
    displayName: "网页检索插件",
    permission: "read",
    compatibleActorIds: [
      "actor-req-analysis",
      "actor-ruonan-claw",
      "actor-research-group",
      "actor-product-design",
      "actor-coding",
    ],
    status: "active",
    addedByUserId: CURRENT_USER_ID,
    createdAt: "2026-07-28T10:05:00+08:00",
  },
  {
    id: "ctb-viz-workflow",
    projectId: PROJECT_CLAW_COLLAB_ID,
    conversationId: CONV_LINEAGE,
    publishedResourceVersionId: "tool-viz-workflow-v1",
    kind: "workflow",
    displayName: "科研绘图工作流",
    permission: "execute",
    compatibleActorIds: ["actor-research-group", "actor-ruonan-claw"],
    status: "active",
    addedByUserId: CURRENT_USER_ID,
    createdAt: "2026-07-28T12:00:00+08:00",
  },
  {
    id: "ctb-revoked-plugin",
    projectId: PROJECT_CLAW_COLLAB_ID,
    conversationId: CONV_LINEAGE,
    publishedResourceVersionId: "tool-revoked-plugin-v1",
    kind: "plugin",
    displayName: "已失效文献检索",
    permission: "execute",
    compatibleActorIds: ["actor-research-group"],
    status: "revoked",
    addedByUserId: CURRENT_USER_ID,
    createdAt: "2026-07-28T12:10:00+08:00",
  },
];

export const SEED_PROJECT_SKILL_BINDINGS: ProjectSkillBinding[] = [
  {
    id: "psb-prd-writer",
    projectId: PROJECT_CLAW_COLLAB_ID,
    skillId: "skill-prd-outline",
    displayName: "PRD 大纲撰写",
    description: "从需求纪要生成 PRD 大纲。",
    source: "plaza",
    status: "active",
    addedByUserId: CURRENT_USER_ID,
    createdAt: "2026-07-27T10:00:00+08:00",
  },
  {
    id: "psb-chart",
    projectId: PROJECT_CLAW_COLLAB_ID,
    skillId: "skill-research-chart",
    displayName: "科研绘图",
    description: "根据表格数据生成对比图。",
    source: "plaza",
    status: "active",
    addedByUserId: CURRENT_USER_ID,
    createdAt: "2026-07-28T12:00:00+08:00",
  },
];

export function getSharedToolsForProject(projectId: string) {
  return SEED_SHARED_TOOL_BINDINGS.filter((item) => item.projectId === projectId);
}

export function getProjectSkills(projectId: string) {
  return SEED_PROJECT_SKILL_BINDINGS.filter((item) => item.projectId === projectId);
}

export function getConversationTools(conversationId: string) {
  return SEED_CONVERSATION_TOOL_BINDINGS.filter(
    (item) => item.conversationId === conversationId
  );
}

export function getPublishedToolByVersionId(versionId: string) {
  return PUBLISHED_TOOL_CATALOG.find((item) => item.versionId === versionId);
}

export const SEED_CONVERSATION_SKILL_BINDINGS: ConversationSkillBinding[] = [
  ...LUNG_CONVERSATION_SKILLS,
];

PUBLISHED_TOOL_CATALOG.push(...LUNG_PUBLISHED_TOOLS);
SEED_SHARED_TOOL_BINDINGS.push(...LUNG_SHARED_TOOLS);
SEED_CONVERSATION_TOOL_BINDINGS.push(...LUNG_CONVERSATION_TOOLS);
SEED_PROJECT_SKILL_BINDINGS.push(...LUNG_PROJECT_SKILLS);
