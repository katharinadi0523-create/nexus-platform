export * from "./types";
export * from "./users";
export * from "./workspaces";
export * from "./projects";
export * from "./actors";
export * from "./squads";
export * from "./issues";
export * from "./runs";
export * from "./context";
export * from "./inbox";

import { AGENT_ACTORS } from "./actors";
import {
  PROJECT_ACTIVITIES,
  PROJECT_ARTIFACTS,
  PROJECT_WORK_SOURCE_BINDINGS,
  PROJECT_WORKING_FILES,
  WORKSPACE_CATALOG_RESOURCES,
} from "./context";
import { INBOX_ITEMS } from "./inbox";
import { ISSUES } from "./issues";
import { COLLABORATION_PROJECTS } from "./projects";
import { ISSUE_COMMENTS, RUNS } from "./runs";
import { SQUADS } from "./squads";
import { COLLABORATION_USERS, PERSONAL_SPACE } from "./users";
import { ORGANIZATION_WORKSPACES } from "./workspaces";
import type {
  AgentActor,
  CollaborationProject,
  InboxItem,
  Issue,
  IssueComment,
  OrganizationWorkspace,
  ProjectActivityItem,
  ProjectArtifact,
  ProjectWorkSourceBinding,
  ProjectWorkingFile,
  Run,
  Squad,
  WorkspaceCatalogResource,
} from "./types";

export interface CollaborationSeedState {
  users: typeof COLLABORATION_USERS;
  personalSpace: typeof PERSONAL_SPACE;
  workspaces: OrganizationWorkspace[];
  projects: CollaborationProject[];
  actors: AgentActor[];
  squads: Squad[];
  issues: Issue[];
  runs: Run[];
  comments: IssueComment[];
  artifacts: ProjectArtifact[];
  /** Work source bindings (GitHub / Local Directory). */
  resourceBindings: ProjectWorkSourceBinding[];
  workingFiles: ProjectWorkingFile[];
  catalogResources: WorkspaceCatalogResource[];
  inboxItems: InboxItem[];
  activities: ProjectActivityItem[];
}

export function createCollaborationSeedState(): CollaborationSeedState {
  return {
    users: COLLABORATION_USERS.map((user) => ({ ...user })),
    personalSpace: { ...PERSONAL_SPACE },
    workspaces: ORGANIZATION_WORKSPACES.map((workspace) => ({ ...workspace })),
    projects: COLLABORATION_PROJECTS.map((project) => ({
      ...project,
      memberIds: [...project.memberIds],
      actorIds: [...project.actorIds],
      squadIds: [...project.squadIds],
    })),
    actors: AGENT_ACTORS.map((actor) => ({ ...actor })),
    squads: SQUADS.map((squad) => ({
      ...squad,
      agentMembers: squad.agentMembers.map((member) => ({ ...member })),
    })),
    issues: ISSUES.map((issue) => ({
      ...issue,
      acceptanceCriteria: [...issue.acceptanceCriteria],
      commentIds: [...issue.commentIds],
      runIds: [...issue.runIds],
      artifactIds: [...issue.artifactIds],
      executor: issue.executor ? { ...issue.executor } : null,
    })),
    runs: RUNS.map((run) => ({
      ...run,
      executor: { ...run.executor },
      childRuns: run.childRuns?.map((child) => ({ ...child })),
      events: run.events?.map((event) => ({ ...event })),
      tokenUsage: run.tokenUsage ? { ...run.tokenUsage } : undefined,
    })),
    comments: ISSUE_COMMENTS.map((comment) => ({
      ...comment,
      author: { ...comment.author },
      mentionedActorIds: [...comment.mentionedActorIds],
    })),
    artifacts: PROJECT_ARTIFACTS.map((artifact) => ({ ...artifact })),
    resourceBindings: PROJECT_WORK_SOURCE_BINDINGS.map((binding) => ({
      ...binding,
    })),
    workingFiles: PROJECT_WORKING_FILES.map((file) => ({ ...file })),
    catalogResources: WORKSPACE_CATALOG_RESOURCES.map((resource) => ({
      ...resource,
    })),
    inboxItems: INBOX_ITEMS.map((item) => ({
      ...item,
      source: { ...item.source },
    })),
    activities: PROJECT_ACTIVITIES.map((activity) => ({ ...activity })),
  };
}
