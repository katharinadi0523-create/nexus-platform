export type SkillHubRole = "admin" | "developer" | "viewer";

export type SkillStatus = "draft" | "reviewing" | "published" | "offline" | "failed";

export type SkillVersionSource =
  | "import"
  | "ai-create"
  | "ai-optimize"
  | "manual-edit"
  | "rollback";

export type SkillFileChange = "added" | "modified" | "unchanged";

export interface SkillFile {
  path: string;
  content: string;
  change?: SkillFileChange;
}

export interface SkillVersion {
  id: string;
  version: string;
  createdAt: string;
  createdBy: string;
  source: SkillVersionSource;
  status: "draft" | "published" | "offline";
  releaseNotes: string;
  conversationId?: string;
  evidence?: string[];
  evaluationStatus: null;
  evaluationReport: null;
  files: SkillFile[];
}

export type DependencyKind = "snapshot" | "platform";
export type DependencyType = "runtime" | "mcp" | "plugin" | "external-service";
export type DependencyStatus = "ready" | "missing" | "offline";

export interface SkillDependency {
  id: string;
  name: string;
  kind: DependencyKind;
  type: DependencyType;
  status: DependencyStatus;
  version?: string;
  note?: string;
}

export interface RuntimeSnapshot {
  id: string;
  boundVersion: string;
  status: "not-run" | "assembling" | "ready" | "failed";
  assembledAt?: string;
  sample?: string;
}

export interface SkillRecord {
  id: string;
  name: string;
  displayName: string;
  description: string;
  owner: string;
  updatedAt: string;
  status: SkillStatus;
  currentVersion?: string;
  sourceLabel: string;
  usageInstructions: string;
  versions: SkillVersion[];
  dependencies: SkillDependency[];
  runtimeSnapshot: RuntimeSnapshot;
}

export interface SkillManualDraft {
  name: string;
  displayName: string;
  description: string;
  usageInstructions: string;
  files: SkillFile[];
  dependencies: SkillDependency[];
}

export type WorkOrderType = "create" | "optimize";
export type WorkOrderStatus = "generating" | "pending-confirmation" | "completed" | "failed";

export interface WorkOrderStep {
  id: string;
  label: string;
  status: "done" | "active" | "pending" | "failed";
}

export interface SkillWorkOrder {
  id: string;
  type: WorkOrderType;
  skillId?: string;
  skillName: string;
  source: "conversation";
  status: WorkOrderStatus;
  outputVersion?: string;
  request: string;
  createdAt: string;
  evidence: string[];
  steps: WorkOrderStep[];
}

export type SkillDetailTab = "overview" | "files" | "dependencies" | "versions";

export type SkillHubScreen =
  | { kind: "list"; tab: "skills" | "work-orders" }
  | {
      kind: "workspace";
      mode: WorkOrderType;
      skillId?: string;
      workOrderId?: string;
    }
  | {
      kind: "detail";
      skillId: string;
      tab: SkillDetailTab;
    }
  | {
      kind: "trial-run";
      skillId: string;
    };
