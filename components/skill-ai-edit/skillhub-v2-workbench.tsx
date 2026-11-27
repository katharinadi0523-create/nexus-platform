"use client";

import { useState } from "react";
import {
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SkillReleaseInfoFields } from "./skill-import-page";
import { SkillDetailView } from "./detail-view";
import { INITIAL_SKILLS, INITIAL_WORK_ORDERS } from "./mock-data";
import {
  CREATE_SKILL_DESCRIPTION,
  CREATE_SKILL_DISPLAY_NAME,
  CREATE_SKILL_FILES,
  CREATE_SKILL_ID_PREFIX,
  CREATE_SKILL_NAME,
  CREATE_SKILL_SAMPLE,
  CREATE_SKILL_USAGE,
} from "./create-skill-mock";
import type {
  SkillFile,
  SkillHubScreen,
  SkillManualDraft,
  SkillRecord,
  SkillVersion,
  SkillWorkOrder,
  WorkOrderType,
} from "./types";
import { SkillWorkspaceView } from "./workspace-view";
import { WorkOrderView } from "./work-order-view";
import { TrialRunView } from "./trial-run-view";
import {
  getCurrentManagedVersion,
  getCurrentPublishedVersion,
  isUnpublishedDraftVersion,
} from "./versioning";

export interface SkillHubV2Seed {
  id: string;
  name: string;
  /** 中文展示名；缺省时回退 name */
  displayName?: string;
  description: string;
  owner: string;
  updatedAt: string;
  status: "draft" | "reviewing" | "published" | "failed";
  version?: string;
  publishedVersion?: string;
  usageInstructions: string;
  files: SkillFile[];
}

interface SkillHubV2WorkbenchProps {
  initialScreen: SkillHubScreen;
  seedSkill?: SkillHubV2Seed;
  onExit: () => void;
  /** AI 创建保存后同步到技能管理列表 */
  onSkillCreated?: (skill: {
    id: string;
    name: string;
    displayName: string;
    description: string;
    usageInstructions: string;
    files: SkillFile[];
  }) => void;
  onRequestImportUpdate?: (skillId: string) => void;
  /** 提交审批确认后，把审核状态同步回技能管理列表 */
  onReviewSubmitted?: (input: {
    skillId: string;
    publishScope: "public" | "org";
    skillTypes: string[];
    releaseNotes: string;
  }) => void;
  /** 进入详情时是否直接打开手动编辑 */
  initialEditing?: boolean;
  /** 详情页删除，交给技能列表的二次确认 */
  onDelete?: (skillId: string) => void;
  /** 技能 AI 编辑原型：开放详情「AI 编辑」入口 */
  enableAiEdit?: boolean;
  disableAiEditScheme1?: boolean;
  /** 置灰「试用和 AI 编辑」等外链 Claw 入口 */
  disableAiClawJumpCombined?: boolean;
  onAiEdit?: (skillName: string) => void;
  onAiEditV2?: (skillName: string) => void;
  /** 内部切到工作台时同步外层，保证高度链按 workspace 收口 */
  onScreenChange?: (screen: SkillHubScreen) => void;
  /** 创建/修改工作台：注册离开守卫 */
  onBindWorkspaceLeaveGuard?: (guard: ((action: () => void) => void) | null) => void;
}

function cloneManualDraft(draft: SkillManualDraft): SkillManualDraft {
  return {
    name: draft.name,
    displayName: draft.displayName,
    description: draft.description,
    usageInstructions: draft.usageInstructions,
    iconUrl: draft.iconUrl,
    files: draft.files.map((file) => ({ ...file })),
    dependencies: draft.dependencies.map((dependency) => ({ ...dependency })),
  };
}

function snapshotPublishedBaseline(skill: SkillRecord): NonNullable<SkillRecord["publishedBaseline"]> {
  return {
    name: skill.name,
    displayName: skill.displayName,
    description: skill.description,
    usageInstructions: skill.usageInstructions,
    iconUrl: skill.iconUrl,
    dependencies: skill.dependencies.map((dependency) => ({ ...dependency })),
    runtimeSnapshot: { ...skill.runtimeSnapshot },
  };
}

function getNextVersionLabel(version = "v1.0") {
  const [major = 1, minor = 0] = version
    .replace(/^v/i, "")
    .split(".")
    .map((value) => Number.parseInt(value, 10));
  return `v${Number.isFinite(major) ? major : 1}.${(Number.isFinite(minor) ? minor : 0) + 1}`;
}

function getDefaultBoundDependencies(skillId: string): SkillRecord["dependencies"] {
  if (skillId === "fastq-parser" || skillId.startsWith("fastq-parser")) {
    return [
      {
        id: "biopython",
        name: "biopython",
        version: "1.83",
        kind: "snapshot",
        type: "runtime",
        status: "ready",
        note: "随发布版本锁定的运行时依赖",
      },
      {
        id: "pysam",
        name: "pysam",
        version: "0.22.1",
        kind: "snapshot",
        type: "runtime",
        status: "ready",
        note: "随发布版本锁定的运行时依赖",
      },
    ];
  }
  if (skillId === "gff-parser" || skillId.startsWith("gff-parser")) {
    return [
      {
        id: "gffutils",
        name: "gffutils",
        version: "0.12",
        kind: "snapshot",
        type: "runtime",
        status: "ready",
        note: "随发布版本锁定的运行时依赖",
      },
      {
        id: "biopython",
        name: "biopython",
        version: "1.83",
        kind: "snapshot",
        type: "runtime",
        status: "ready",
        note: "随发布版本锁定的运行时依赖",
      },
    ];
  }
  if (skillId === "research-evidence-extractor") {
    return [
      {
        id: "pypdf",
        name: "pypdf",
        version: "4.3.1",
        kind: "snapshot",
        type: "runtime",
        status: "ready",
        note: "随发布版本锁定的运行时依赖",
      },
      {
        id: "httpx",
        name: "httpx",
        version: "0.27.2",
        kind: "snapshot",
        type: "runtime",
        status: "ready",
        note: "随发布版本锁定的运行时依赖",
      },
      {
        id: "crossref",
        name: "Crossref API",
        kind: "platform",
        type: "external-service",
        status: "ready",
        note: "平台引用可用",
      },
    ];
  }
  return [
    {
      id: "pandas",
      name: "pandas",
      version: "2.2.2",
      kind: "snapshot",
      type: "runtime",
      status: "ready",
      note: "随发布版本锁定的运行时依赖",
    },
  ];
}

function getDefaultTrialSample(skillId: string) {
  if (skillId === "fastq-parser" || skillId.startsWith("fastq-parser")) {
    return "samples/SRR000001.fastq";
  }
  if (skillId === "gff-parser" || skillId.startsWith("gff-parser")) {
    return "samples/genes.gff";
  }
  if (skillId === "research-evidence-extractor") return "samples/rice_drought_study.pdf";
  return "samples/rice_expression.csv";
}

function stepVersionBack(label: string) {
  const [majorRaw, minorRaw = "0"] = label.replace(/^v/i, "").split(".");
  let major = Number.parseInt(majorRaw, 10);
  let minor = Number.parseInt(minorRaw, 10);
  if (!Number.isFinite(major)) return undefined;
  if (!Number.isFinite(minor)) minor = 0;
  if (minor > 0) {
    minor -= 1;
  } else if (major > 0) {
    major -= 1;
    minor = 9;
  } else {
    return undefined;
  }
  return `v${major}.${minor}`;
}

function buildHistoricalVersions(
  seed: SkillHubV2Seed,
  currentVersionLabel: string,
  publishedVersionLabel?: string
): SkillVersion[] {
  const reserved = new Set(
    [currentVersionLabel, publishedVersionLabel].filter((label): label is string => Boolean(label))
  );
  const notes = [
    "历史稳定版本。",
    "收紧输出结构，补充风险提示。",
    "调整字段口径，保留上一版可用模板。",
    "首次导入的可用版本。",
  ];
  const dates = ["2026-07-10 09:20", "2026-06-26 16:05", "2026-06-12 11:40", "2026-05-28 14:15"];
  const sources = ["import", "manual-edit", "ai-optimize", "import"] as const;
  const versions: SkillVersion[] = [];
  let cursor = currentVersionLabel;
  while (versions.length < notes.length) {
    const next = stepVersionBack(cursor);
    if (!next) break;
    cursor = next;
    if (reserved.has(next)) continue;
    const index = versions.length;
    versions.push({
      id: `${seed.id}-${next}`,
      version: next,
      createdAt: dates[index],
      createdBy: seed.owner,
      source: sources[index],
      status: "offline",
      releaseNotes: notes[index],
      evaluationStatus: null,
      evaluationReport: null,
      files: seed.files.map((file, fileIndex) =>
        fileIndex === 0 ? { ...file, content: `${file.content}\n\n<!-- ${next} -->` } : { ...file }
      ),
    });
  }
  return versions;
}

function createSeedRecord(seed: SkillHubV2Seed): SkillRecord {
  const currentVersionLabel = seed.version ? `v${seed.version.replace(/^v/i, "")}` : "v1.0";
  const publishedVersionLabel = seed.publishedVersion
    ? `v${seed.publishedVersion.replace(/^v/i, "")}`
    : seed.status === "published"
      ? currentVersionLabel
      : undefined;
  const currentVersionId = `${seed.id}-${currentVersionLabel}`;
  const publishedVersionId = publishedVersionLabel
    ? `${seed.id}-${publishedVersionLabel}`
    : undefined;
  /** 发布版本 = 当前版本：线上已装配，试运行与依赖默认就绪，无需再走一遍 */
  const isPublishedCurrent = Boolean(publishedVersionId) && publishedVersionId === currentVersionId;
  const existingBaseline = INITIAL_SKILLS.find((item) => item.id === seed.id);
  const versionHistory: SkillVersion[] = [
    {
      id: currentVersionId,
      version: currentVersionLabel,
      baseVersionId:
        publishedVersionId && publishedVersionId !== currentVersionId
          ? publishedVersionId
          : undefined,
      createdAt: seed.updatedAt,
      createdBy: seed.owner,
      source: "ai-optimize",
      status: publishedVersionId === currentVersionId ? "published" : "draft",
      releaseNotes: "由现有技能管理记录同步，补充为二期版本基线。",
      conversationId: "CONV-2087",
      evidence: ["失败运行 TASK-2087", "样本 no_header.csv"],
      evaluationStatus: null,
      evaluationReport: null,
      files: seed.files,
    },
    ...(publishedVersionId && publishedVersionLabel !== currentVersionLabel
      ? [
          {
            id: publishedVersionId,
            version: publishedVersionLabel!,
            createdAt: "2026-07-18 15:30",
            createdBy: seed.owner,
            source: "import" as const,
            status: "published" as const,
            releaseNotes: "当前对技能广场与线上运行生效的发布版本。",
            evaluationStatus: null,
            evaluationReport: null,
            files: seed.files.map((file) => ({ ...file })),
          },
        ]
      : []),
    ...buildHistoricalVersions(seed, currentVersionLabel, publishedVersionLabel),
  ];
  return {
    id: seed.id,
    name: seed.name,
    displayName: seed.displayName ?? existingBaseline?.displayName ?? seed.name,
    description: seed.description,
    owner: seed.owner,
    updatedAt: seed.updatedAt,
    status: seed.status,
    currentVersionId,
    publishedVersionId,
    sourceLabel: "现有技能管理",
    usageInstructions: seed.usageInstructions,
    versions: versionHistory,
    dependencies: isPublishedCurrent
      ? existingBaseline?.dependencies?.length
        ? existingBaseline.dependencies.map((item) => ({ ...item }))
        : getDefaultBoundDependencies(seed.id)
      : [],
    runtimeSnapshot: isPublishedCurrent
      ? {
          id:
            existingBaseline?.runtimeSnapshot.status === "ready"
              ? existingBaseline.runtimeSnapshot.id
              : `rt-snap-${seed.id}-${currentVersionLabel}`,
          boundVersion: currentVersionLabel,
          status: "ready",
          assembledAt:
            existingBaseline?.runtimeSnapshot.assembledAt ?? seed.updatedAt ?? "2026-07-24 10:00",
          sample:
            existingBaseline?.runtimeSnapshot.sample ?? getDefaultTrialSample(seed.id),
        }
      : {
          id: `pending-${seed.id}-${currentVersionLabel}`,
          boundVersion: currentVersionLabel,
          status: "not-run",
        },
    publishedBaseline: isPublishedCurrent
      ? {
          name: seed.name,
          displayName: seed.displayName ?? existingBaseline?.displayName ?? seed.name,
          description: seed.description,
          usageInstructions: seed.usageInstructions,
          dependencies: existingBaseline?.dependencies?.length
            ? existingBaseline.dependencies.map((item) => ({ ...item }))
            : getDefaultBoundDependencies(seed.id),
          runtimeSnapshot: {
            id:
              existingBaseline?.runtimeSnapshot.status === "ready"
                ? existingBaseline.runtimeSnapshot.id
                : `rt-snap-${seed.id}-${currentVersionLabel}`,
            boundVersion: currentVersionLabel,
            status: "ready",
            assembledAt:
              existingBaseline?.runtimeSnapshot.assembledAt ?? seed.updatedAt ?? "2026-07-24 10:00",
            sample:
              existingBaseline?.runtimeSnapshot.sample ?? getDefaultTrialSample(seed.id),
          },
        }
      : undefined,
  };
}

export function SkillHubV2Workbench({
  initialScreen,
  seedSkill,
  onExit,
  onSkillCreated,
  onRequestImportUpdate,
  onReviewSubmitted,
  initialEditing = false,
  onDelete,
  enableAiEdit = false,
  disableAiEditScheme1 = false,
  disableAiClawJumpCombined = false,
  onAiEdit,
  onAiEditV2,
  onScreenChange,
  onBindWorkspaceLeaveGuard,
}: SkillHubV2WorkbenchProps) {
  const [skills, setSkills] = useState<SkillRecord[]>(() => {
    if (!seedSkill) return INITIAL_SKILLS;
    const seeded = createSeedRecord(seedSkill);
    return [seeded, ...INITIAL_SKILLS.filter((item) => item.id !== seeded.id)];
  });
  const [workOrders, setWorkOrders] = useState<SkillWorkOrder[]>(INITIAL_WORK_ORDERS);
  const [screen, setScreen] = useState<SkillHubScreen>(initialScreen);
  const [deleteTargetId, setDeleteTargetId] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [reviewTargetId, setReviewTargetId] = useState("");
  const [reviewScope, setReviewScope] = useState<"public" | "org">("public");
  const [reviewTypes, setReviewTypes] = useState<string[]>([]);
  const [reviewNotes, setReviewNotes] = useState("");

  const canManage = true;
  const activeSkill =
    screen.kind === "workspace" || screen.kind === "detail" || screen.kind === "trial-run"
      ? skills.find((skill) => skill.id === screen.skillId)
      : undefined;
  const activeWorkOrder =
    screen.kind === "workspace" && screen.workOrderId
      ? workOrders.find((item) => item.id === screen.workOrderId)
      : undefined;
  const deleteTarget = skills.find((skill) => skill.id === deleteTargetId);

  function bindWorkspaceLeaveGuard(guard: ((action: () => void) => void) | null) {
    onBindWorkspaceLeaveGuard?.(guard);
  }

  function openWorkspace(mode: WorkOrderType, skillId?: string, workOrderId?: string) {
    const next: SkillHubScreen = { kind: "workspace", mode, skillId, workOrderId };
    setScreen(next);
    onScreenChange?.(next);
  }

  async function exportSkill(skillId: string) {
    const skill = skills.find((item) => item.id === skillId);
    if (!skill) return;

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const currentVersion = getCurrentManagedVersion(skill);
    const exportFiles = skill.savedDraft?.files ?? currentVersion?.files ?? [];
    exportFiles.forEach((file) => {
      if (file.path.endsWith("/")) {
        zip.folder(file.path.replace(/\/+$/, ""));
        return;
      }
      zip.file(file.path, file.content);
    });
    zip.file(
      "runtime/snapshot.json",
      JSON.stringify(
        {
          schemaVersion: 1,
          skillId: skill.id,
          version: skill.savedDraft ? "draft" : currentVersion?.version,
          snapshot: skill.runtimeSnapshot,
          dependencies: skill.savedDraft?.dependencies ?? skill.dependencies,
          qualityGate: {
            enabled: false,
            evaluationStatus: currentVersion?.evaluationStatus ?? null,
            evaluationReport: currentVersion?.evaluationReport ?? null,
          },
        },
        null,
        2
      )
    );
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${skill.name}-${skill.savedDraft ? "draft" : currentVersion?.version ?? "draft"}.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("已开始下载技能包");
  }

  function openUpdateImport(skillId: string) {
    const target = skills.find((skill) => skill.id === skillId);
    if (target?.status === "reviewing") {
      toast.info("审核中不可编辑");
      return;
    }
    onRequestImportUpdate?.(skillId);
  }

  function openReviewDialog(skillId: string) {
    const target = skills.find((skill) => skill.id === skillId);
    const draftVersion = target ? getCurrentManagedVersion(target) : undefined;
    if (!target || !draftVersion) return;

    if (target.status === "reviewing") {
      toast.info("该技能已在审核中，无需重复提交");
      return;
    }

    if (!target.savedDraft && !isUnpublishedDraftVersion(target, draftVersion)) {
      toast.info("当前没有待发布的更新");
      return;
    }

    setReviewScope("public");
    setReviewTypes([]);
    setReviewNotes("");
    setReviewTargetId(skillId);
  }

  function toggleReviewType(value: string) {
    setReviewTypes((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }
      if (current.length >= 2) {
        return current;
      }
      return [...current, value];
    });
  }

  function confirmReview() {
    const target = skills.find((skill) => skill.id === reviewTargetId);
    const draftVersion = target ? getCurrentManagedVersion(target) : undefined;
    const notes = reviewNotes.trim();
    if (!target || !draftVersion || reviewTypes.length === 0 || !notes) {
      return;
    }
    if (!target.savedDraft && !isUnpublishedDraftVersion(target, draftVersion)) {
      return;
    }

    const materialized = materializePublishVersion(target, notes);
    const publishedVersionLabel = getCurrentManagedVersion(materialized)?.version ?? draftVersion.version;

    setSkills((current) =>
      current.map((skill) =>
        skill.id === target.id
          ? {
              ...materialized,
              status: "reviewing",
              updatedAt: "2026-07-24 12:10",
              versions: materialized.versions.map((version) =>
                version.id === materialized.currentVersionId
                  ? { ...version, releaseNotes: notes }
                  : version
              ),
            }
          : skill
      )
    );
    onReviewSubmitted?.({
      skillId: target.id,
      publishScope: reviewScope,
      skillTypes: reviewTypes,
      releaseNotes: notes,
    });
    setReviewTargetId("");
    toast.success(`${publishedVersionLabel} 已提交审批`);
  }

  function materializePublishVersion(skill: SkillRecord, releaseNotes: string): SkillRecord {
    if (!skill.savedDraft) return skill;
    const currentVersion = getCurrentManagedVersion(skill);
    if (isUnpublishedDraftVersion(skill, currentVersion)) {
      return { ...skill, savedDraft: undefined };
    }

    const baseLabel =
      getCurrentPublishedVersion(skill)?.version ?? currentVersion?.version ?? "v1.0";
    const nextVersionLabel = getNextVersionLabel(baseLabel);
    const nextVersion: SkillVersion = {
      id: `${skill.id}-${nextVersionLabel}-publish-${Date.now()}`,
      version: nextVersionLabel,
      baseVersionId: skill.publishedVersionId ?? currentVersion?.id,
      createdAt: "2026-07-24 12:10",
      createdBy: skill.owner,
      source: "manual-edit",
      status: "draft",
      releaseNotes,
      evidence: [`基于 ${baseLabel} 发布`],
      evaluationStatus: null,
      evaluationReport: null,
      files: skill.savedDraft.files.map((file) => ({ ...file })),
    };
    return {
      ...skill,
      savedDraft: undefined,
      currentVersionId: nextVersion.id,
      versions: [nextVersion, ...skill.versions],
      runtimeSnapshot: {
        id: `pending-${nextVersionLabel}`,
        boundVersion: nextVersionLabel,
        status: "not-run",
      },
    };
  }

  function handleSaveVersion(input: {
    mode: WorkOrderType;
    skillId?: string;
    name: string;
    request: string;
    evidence: string[];
    intent?: "default" | "as-new";
    silent?: boolean;
    files?: SkillFile[];
  }) {
    const timestamp = Date.now();
    if (input.mode === "create") {
      const skillId = `${CREATE_SKILL_ID_PREFIX}-${timestamp}`;
      const sourceFiles = input.files?.length ? input.files : CREATE_SKILL_FILES;
      const files = sourceFiles.map((file) => ({
        path: file.path,
        content: file.content,
      }));
      const version: SkillVersion = {
        id: `${CREATE_SKILL_ID_PREFIX}-v10-${timestamp}`,
        version: "v1.0",
        createdAt: "2026-07-27 15:20",
        createdBy: "邸若楠",
        source: "ai-create",
        status: "draft",
        releaseNotes: "AI 创建首版：本地无 GFF Skill，按本体 Object Type「GeneAnnotation」装配解析器。",
        conversationId: `CONV-${timestamp.toString().slice(-4)}`,
        evidence: input.evidence.length ? input.evidence : [CREATE_SKILL_SAMPLE],
        evaluationStatus: null,
        evaluationReport: null,
        files,
      };
      const skill: SkillRecord = {
        id: skillId,
        name: CREATE_SKILL_NAME,
        displayName: CREATE_SKILL_DISPLAY_NAME,
        description: CREATE_SKILL_DESCRIPTION,
        owner: "邸若楠",
        updatedAt: "2026-07-27 15:20",
        status: "draft",
        currentVersionId: version.id,
        sourceLabel: "AI 创建",
        usageInstructions: CREATE_SKILL_USAGE,
        versions: [version],
        dependencies: [],
        runtimeSnapshot: {
          id: `pending-${CREATE_SKILL_ID_PREFIX}`,
          boundVersion: "v1.0",
          status: "not-run",
          sample: CREATE_SKILL_SAMPLE,
        },
      };
      const order: SkillWorkOrder = {
        id: `WO-${timestamp.toString().slice(-4)}`,
        type: "create",
        skillId: skill.id,
        skillName: skill.name,
        source: "conversation",
        status: "pending-confirmation",
        outputVersion: "v1.0 草稿",
        request: input.request,
        createdAt: "2026-07-27 15:20",
        evidence: skill.versions[0]?.evidence ?? [CREATE_SKILL_SAMPLE],
        steps: [
          { id: "local-search", label: "检索本地 Skill 与工单池", status: "done" },
          { id: "ontology", label: "检索本体对象类型并装配解析方法", status: "done" },
          { id: "generate", label: "生成标准 Skill 包与基础校验", status: "done" },
          { id: "confirm", label: "等待用户确认", status: "active" },
          { id: "publish", label: "进入发布链路（质量门默认直通）", status: "pending" },
        ],
      };
      setSkills((current) => [skill, ...current]);
      setWorkOrders((current) => [order, ...current]);
      onSkillCreated?.({
        id: skill.id,
        name: skill.name,
        displayName: skill.displayName,
        description: skill.description,
        usageInstructions: skill.usageInstructions,
        files,
      });
      if (!input.silent) {
        toast.success("已保存，新技能已加入技能列表");
      }
      setScreen({ kind: "detail", skillId: skill.id, tab: "files" });
      return;
    }

    const target = skills.find((skill) => skill.id === input.skillId);
    if (!target) return;
    const currentVersion = getCurrentManagedVersion(target);
    const versionFiles = (currentVersion?.files ?? []).map((file) => ({ ...file }));

    if (input.intent === "as-new") {
      const newSkillId = `skill-ai-copy-${timestamp}`;
      const newSkillName = `${target.name}-edited`;
      const version: SkillVersion = {
        id: `${newSkillId}-v10-${timestamp}`,
        version: "v1.0",
        baseVersionId: currentVersion?.id,
        createdAt: "2026-07-24 11:42",
        createdBy: "邸若楠",
        source: "ai-optimize",
        status: "draft",
        releaseNotes: "AI 修改另存：基于当前优化草稿复制为新技能。",
        conversationId: `CONV-${timestamp.toString().slice(-4)}`,
        evidence: input.evidence,
        evaluationStatus: null,
        evaluationReport: null,
        files: versionFiles,
      };
      const newSkill: SkillRecord = {
        id: newSkillId,
        name: newSkillName,
        displayName: `${target.displayName ?? target.name}（副本）`,
        description: target.description,
        owner: target.owner,
        updatedAt: "2026-07-24 11:42",
        status: "draft",
        currentVersionId: version.id,
        sourceLabel: "AI 优化另存",
        usageInstructions: target.usageInstructions,
        versions: [version],
        dependencies: target.dependencies.map((item) => ({ ...item })),
        runtimeSnapshot: {
          id: `pending-${newSkillId}`,
          boundVersion: "v1.0",
          status: "not-run",
          sample: target.runtimeSnapshot.sample,
        },
      };
      setSkills((current) => [newSkill, ...current]);
      onSkillCreated?.({
        id: newSkill.id,
        name: newSkill.name,
        displayName: newSkill.displayName,
        description: newSkill.description,
        usageInstructions: newSkill.usageInstructions,
        files: versionFiles,
      });
      toast.success("已另存为新技能");
      setScreen({ kind: "detail", skillId: newSkill.id, tab: "files" });
      onScreenChange?.({ kind: "detail", skillId: newSkill.id, tab: "files" });
      return;
    }

    const currentNumber = Number.parseInt(currentVersion?.version.replace(/\D/g, "") || "10", 10);
    const nextVersionLabel = `v${Math.floor(currentNumber / 10)}.${(currentNumber % 10) + 1}`;
    const nextVersion: SkillVersion = {
      id: `${target.id}-${nextVersionLabel}-${timestamp}`,
      version: nextVersionLabel,
      baseVersionId: currentVersion?.id,
      createdAt: "2026-07-24 11:38",
      createdBy: "邸若楠",
      source: "ai-optimize",
      status: "draft",
      releaseNotes: "AI 优化生成：增强异常输入处理并补充回归测试。",
      conversationId: `CONV-${timestamp.toString().slice(-4)}`,
      evidence: input.evidence,
      evaluationStatus: null,
      evaluationReport: null,
      files: versionFiles,
    };
    const workOrder: SkillWorkOrder = {
      id: `WO-${timestamp.toString().slice(-4)}`,
      type: "optimize",
      skillId: target.id,
      skillName: target.name,
      source: "conversation",
      status: "pending-confirmation",
      outputVersion: `${nextVersionLabel} 草稿`,
      request: input.request,
      createdAt: "2026-07-24 11:38",
      evidence: input.evidence,
      steps: [
        { id: "read", label: "读取版本与挂载依据", status: "done" },
        { id: "generate", label: "生成改动与测试", status: "done" },
        { id: "confirm", label: "等待用户确认", status: "active" },
        { id: "publish", label: "进入发布链路（质量门默认直通）", status: "pending" },
      ],
    };
    setSkills((current) =>
      current.map((skill) =>
        skill.id === target.id
          ? {
              ...skill,
              status: target.publishedVersionId ? "published" : "draft",
              currentVersionId: nextVersion.id,
              updatedAt: "2026-07-24 11:38",
              versions: [nextVersion, ...skill.versions],
              runtimeSnapshot: {
                id: `pending-${nextVersionLabel}`,
                boundVersion: nextVersionLabel,
                status: "not-run",
              },
            }
          : skill
      )
    );
    setWorkOrders((current) => [workOrder, ...current]);
    toast.success("已保存");
    setScreen({ kind: "detail", skillId: target.id, tab: "files" });
  }

  function handleSaveManualVersion(skillId: string, draft: SkillManualDraft) {
    const target = skills.find((skill) => skill.id === skillId);
    if (!target || target.status === "reviewing") return;

    const currentVersion = getCurrentManagedVersion(target);
    const saved = cloneManualDraft(draft);
    const overview = {
      name: saved.name,
      displayName: saved.displayName,
      description: saved.description,
      usageInstructions: saved.usageInstructions,
      iconUrl: saved.iconUrl,
      dependencies: saved.dependencies.map((dependency) => ({ ...dependency })),
    };

    setSkills((current) =>
      current.map((skill) => {
        if (skill.id !== skillId) return skill;
        if (isUnpublishedDraftVersion(skill, currentVersion) && currentVersion) {
          return {
            ...skill,
            ...overview,
            savedDraft: undefined,
            updatedAt: "2026-07-24 11:52",
            versions: skill.versions.map((version) =>
              version.id === currentVersion.id
                ? { ...version, files: saved.files.map((file) => ({ ...file })) }
                : version
            ),
          };
        }

        const publishedBaseline =
          skill.publishedBaseline ??
          (skill.publishedVersionId && skill.currentVersionId === skill.publishedVersionId
            ? snapshotPublishedBaseline(skill)
            : undefined);

        return {
          ...skill,
          ...overview,
          publishedBaseline,
          savedDraft: saved,
          updatedAt: "2026-07-24 11:52",
        };
      })
    );
  }

  function handleRunAssembly(skillId: string) {
    setSkills((current) =>
      current.map((skill) => {
        if (skill.id !== skillId) return skill;
        return {
          ...skill,
          dependencies:
            skill.dependencies.length > 0
              ? skill.dependencies
              : getDefaultBoundDependencies(skill.id),
          runtimeSnapshot: {
            id: `rt-snap-${skill.id}-${Date.now().toString().slice(-4)}`,
            boundVersion: getCurrentManagedVersion(skill)?.version ?? "v1.0",
            status: "ready",
            assembledAt: "2026-07-24 11:42",
            sample: skill.runtimeSnapshot.sample ?? getDefaultTrialSample(skill.id),
          },
        };
      })
    );
    toast.success("试运行成功：依赖已锁定并冻结为运行时快照");
  }

  function confirmDelete() {
    if (!deleteTarget || deleteConfirmation !== deleteTarget.name) return;
    setSkills((current) => current.filter((skill) => skill.id !== deleteTarget.id));
    setDeleteTargetId("");
    setDeleteConfirmation("");
    toast.success("技能及未受保护的草稿已删除");
    onExit();
  }

  function confirmWorkOrder(workOrderId: string) {
    setWorkOrders((current) =>
      current.map((item) =>
        item.id === workOrderId
          ? {
              ...item,
              status: "completed",
              steps: item.steps.map((step) => ({ ...step, status: "done" as const })),
            }
          : item
      )
    );
    toast.success("版本已确认，质量门默认直通并进入发布链路");
  }

  return (
    <div
      className={cn(
        (screen.kind === "workspace" && !screen.workOrderId) ||
          (enableAiEdit && screen.kind === "detail")
          ? "flex h-full min-h-0 flex-col overflow-hidden"
          : "min-h-full"
      )}
      data-testid="skillhub-v2-extension"
    >
      {screen.kind === "workspace" && screen.workOrderId && activeWorkOrder ? (
        <WorkOrderView
          workOrder={activeWorkOrder}
          canManage={canManage}
          onBack={onExit}
          onOpenWorkspace={() =>
            openWorkspace(activeWorkOrder.type, activeWorkOrder.skillId, activeWorkOrder.id)
          }
          onConfirmVersion={() => confirmWorkOrder(activeWorkOrder.id)}
        />
      ) : null}

      {screen.kind === "workspace" && !screen.workOrderId ? (
        <SkillWorkspaceView
          mode={screen.mode}
          skill={activeSkill}
          embeddedClawLayout={enableAiEdit}
          onBack={onExit}
          onSaveVersion={handleSaveVersion}
          bindWorkspaceLeaveGuard={bindWorkspaceLeaveGuard}
        />
      ) : null}

      {screen.kind === "detail" && activeSkill ? (
        <SkillDetailView
          skill={activeSkill}
          activeTab={screen.tab}
          canManage={canManage}
          onBack={onExit}
          onTabChange={(tab) => setScreen({ ...screen, tab })}
          onOptimize={() => {
            openWorkspace("optimize", activeSkill.id);
          }}
          onAiEditV2={
            enableAiEdit && onAiEditV2
              ? () => onAiEditV2(activeSkill.name)
              : undefined
          }
          enableAiEdit={enableAiEdit}
          disableAiEditScheme1={disableAiEditScheme1}
          disableAiClawJumpCombined={disableAiClawJumpCombined}
          onImportUpdate={() => openUpdateImport(activeSkill.id)}
          onSubmitPublish={() => openReviewDialog(activeSkill.id)}
          canSubmitPublish={
            activeSkill.status !== "reviewing" &&
            (Boolean(activeSkill.savedDraft) ||
              isUnpublishedDraftVersion(activeSkill, getCurrentManagedVersion(activeSkill)))
          }
          publishLabel={activeSkill.status === "reviewing" ? "审核中" : "提交发布"}
          onExport={() => exportSkill(activeSkill.id)}
          onRunAssembly={() => setScreen({ kind: "trial-run", skillId: activeSkill.id })}
          onSaveManualVersion={(draft) => handleSaveManualVersion(activeSkill.id, draft)}
          onDelete={() => onDelete?.(activeSkill.id)}
          initialEditing={initialEditing}
        />
      ) : null}

      {screen.kind === "trial-run" && activeSkill ? (
        <TrialRunView
          skill={activeSkill}
          onBack={() =>
            setScreen({ kind: "detail", skillId: activeSkill.id, tab: "files" })
          }
          onComplete={() => handleRunAssembly(activeSkill.id)}
        />
      ) : null}

      <Dialog
        modal={false}
        open={Boolean(reviewTargetId)}
        onOpenChange={(open) => {
          if (!open) setReviewTargetId("");
        }}
      >
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>提交审批</DialogTitle>
          </DialogHeader>
          <SkillReleaseInfoFields
            publishScope={reviewScope}
            onPublishScopeChange={setReviewScope}
            skillTypes={reviewTypes}
            onToggleSkillType={toggleReviewType}
            releaseNotes={reviewNotes}
            onReleaseNotesChange={setReviewNotes}
          />
          <div className="flex items-center gap-3">
            <Button
              type="button"
              className="h-9 min-w-[80px] rounded-[4px] bg-[#2773ff] px-[19px] text-sm font-semibold text-white shadow-none hover:bg-[#1f66f0] disabled:bg-[#cbd5e1] disabled:text-white"
              disabled={reviewTypes.length === 0 || !reviewNotes.trim()}
              onClick={confirmReview}
            >
              确定
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 min-w-[80px] rounded-[4px] border-[#2773ff] bg-white px-[19px] text-sm font-semibold text-[#2773ff] shadow-none hover:bg-[#f0f6fe]"
              onClick={() => setReviewTargetId("")}
            >
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTargetId("");
            setDeleteConfirmation("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
              删除技能
            </DialogTitle>
            <DialogDescription className="leading-6">
              {deleteTarget?.versions.some((version) => version.status === "published")
                ? "该技能包含已发布历史。删除后这些版本将无法作为回滚目标，已发布版本不会被静默清除。"
                : "该操作会删除技能草稿与版本记录。"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-confirmation">
              输入 <span className="font-mono font-semibold">{deleteTarget?.name}</span> 确认删除
            </Label>
            <Input
              id="delete-confirmation"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetId("")}>
              取消
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmation !== deleteTarget?.name}
              onClick={confirmDelete}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
