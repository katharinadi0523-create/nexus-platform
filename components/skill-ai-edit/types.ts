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
  sizeLabel?: string;
  updatedAt?: string;
  /** 回收站条目：自动清理前的剩余天数 */
  trashDaysRemaining?: number;
  /** 回收站条目：还原目标路径 */
  trashedFrom?: string;
}

export interface SkillVersion {
  id: string;
  version: string;
  baseVersionId?: string;
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
  currentVersionId: string;
  publishedVersionId?: string;
  sourceLabel: string;
  usageInstructions: string;
  /** 自定义技能图标，data URL 或静态地址；空则用默认图标 */
  iconUrl?: string;
  versions: SkillVersion[];
  dependencies: SkillDependency[];
  runtimeSnapshot: RuntimeSnapshot;
  /**
   * 已保存、尚未发布的工作副本。
   * 手动编辑的保存只写这里，不进入 versions；提交发布时才固化成新版本。
   */
  savedDraft?: SkillManualDraft;
  /** 当前发布版本的概览与依赖。还原时用它覆盖草稿，避免草稿内容留下。 */
  publishedBaseline?: {
    name: string;
    displayName: string;
    description: string;
    usageInstructions: string;
    iconUrl?: string;
    dependencies: SkillDependency[];
    runtimeSnapshot: RuntimeSnapshot;
  };
}

export interface SkillManualDraft {
  name: string;
  displayName: string;
  description: string;
  usageInstructions: string;
  iconUrl?: string;
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
