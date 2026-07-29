export type ProjectSharedToolKind =
  | "workflow"
  | "plugin"
  | "mcp"
  | "ontology_action";

export type ProjectSharedToolStatus =
  | "active"
  | "authorization_required"
  | "degraded"
  | "revoked";

export interface PublishedToolResource {
  id: string;
  versionId: string;
  kind: ProjectSharedToolKind;
  name: string;
  description: string;
  publisher: string;
  version: string;
  scenario: string;
  compatibleActorIds: string[];
  requiresCredential: boolean;
  available: boolean;
}

export interface ProjectSharedToolBinding {
  id: string;
  projectId: string;
  publishedResourceVersionId: string;
  kind: ProjectSharedToolKind;
  displayName: string;
  permission: "read" | "execute" | "write";
  credentialRef?: string;
  compatibleActorIds: string[];
  status: ProjectSharedToolStatus;
  addedByUserId: string;
  createdAt: string;
  updatedAt: string;
  hasNewerVersion?: boolean;
}

export interface ConversationToolBinding {
  id: string;
  projectId: string;
  conversationId: string;
  publishedResourceVersionId: string;
  kind: ProjectSharedToolKind;
  displayName: string;
  permission: "read" | "execute" | "write";
  credentialRef?: string;
  compatibleActorIds: string[];
  status: ProjectSharedToolStatus;
  addedByUserId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectSkillBinding {
  id: string;
  projectId: string;
  skillId: string;
  displayName: string;
  description?: string;
  source: "plaza";
  status: "active" | "revoked";
  addedByUserId: string;
  createdAt: string;
}

export interface ConversationSkillBinding {
  id: string;
  projectId: string;
  conversationId: string;
  skillId: string;
  displayName: string;
  description?: string;
  source: "plaza";
  status: "active" | "revoked";
  addedByUserId: string;
  createdAt: string;
}
