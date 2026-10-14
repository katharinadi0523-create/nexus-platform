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
  hasUnpublishedChanges,
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
}

function toSequentialVersionLabel(version?: string) {
  const normalized = version?.trim() ?? "";
  const sequentialMatch = normalized.match(/^v(\d+)$/i);
  if (sequentialMatch) {
    return `V${Math.max(1, Number.parseInt(sequentialMatch[1], 10))}`;
  }

  const [major = 1, minor = 0] = normalized
    .replace(/^v/i, "")
    .split(".")
    .map((value) => Number.parseInt(value, 10));
  if (Number.isFinite(major) && Number.isFinite(minor)) {
    return major === 1 ? `V${Math.max(1, minor + 1)}` : `V${Math.max(1, major)}`;
  }

  return "V1";
}

function getNextVersionLabel(version = "V1") {
  const current = Number.parseInt(toSequentialVersionLabel(version).slice(1), 10);
  return `V${current + 1}`;
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

function createSeedRecord(seed: SkillHubV2Seed): SkillRecord {
  const currentVersionLabel = toSequentialVersionLabel(seed.version);
  const publishedVersionLabel = seed.publishedVersion
    ? toSequentialVersionLabel(seed.publishedVersion)
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
  const currentVersionNumber = Number.parseInt(currentVersionLabel.slice(1), 10);
  const previousVersion = currentVersionNumber > 1 ? `V${currentVersionNumber - 1}` : undefined;
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
    ...(previousVersion && previousVersion !== publishedVersionLabel && previousVersion !== currentVersionLabel
      ? [
          {
            id: `${seed.id}-${previousVersion}`,
            version: previousVersion,
            createdAt: "2026-07-10 09:20",
            createdBy: seed.owner,
            source: "import" as const,
            status: "offline" as const,
            releaseNotes: "历史稳定版本。",
            evaluationStatus: null,
            evaluationReport: null,
            files: seed.files.map((file, index) =>
              index === 0 ? { ...file, content: `${file.content}\n\n<!-- 历史版本 -->` } : file
            ),
          },
        ]
      : []),
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
  };
}

export function SkillHubV2Workbench({
  initialScreen,
  seedSkill,
  onExit,
  onSkillCreated,
  onRequestImportUpdate,
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
  const [rollbackTarget, setRollbackTarget] = useState<{
    skillId: string;
    versionId: string;
  } | null>(null);
  const [rollbackConfirmation, setRollbackConfirmation] = useState("");

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
  const rollbackSkill = rollbackTarget
    ? skills.find((skill) => skill.id === rollbackTarget.skillId)
    : undefined;
  const rollbackVersion = rollbackSkill?.versions.find(
    (version) => version.id === rollbackTarget?.versionId
  );

  function openWorkspace(mode: WorkOrderType, skillId?: string, workOrderId?: string) {
    setScreen({ kind: "workspace", mode, skillId, workOrderId });
  }

  async function exportSkill(skillId: string) {
    const skill = skills.find((item) => item.id === skillId);
    if (!skill) return;

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const currentVersion = getCurrentManagedVersion(skill);
    currentVersion?.files.forEach((file) => zip.file(file.path, file.content));
    zip.file(
      "runtime/snapshot.json",
      JSON.stringify(
        {
          schemaVersion: 1,
          skillId: skill.id,
          version: currentVersion?.version,
          snapshot: skill.runtimeSnapshot,
          dependencies: skill.dependencies,
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
    anchor.download = `${skill.name}-${currentVersion?.version ?? "draft"}.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("已导出技能包与绑定的运行时快照");
  }

  function openUpdateImport(skillId: string) {
    onRequestImportUpdate?.(skillId);
  }

  function submitPublish(skillId: string) {
    const target = skills.find((skill) => skill.id === skillId);
    const draftVersion = target ? getCurrentManagedVersion(target) : undefined;
    if (!target || !draftVersion) return;

    if (target.status === "reviewing") {
      toast.info("该技能已在审核中，无需重复提交");
      return;
    }

    if (draftVersion.status !== "draft") {
      toast.info("当前没有待发布的更新版本");
      return;
    }

    setSkills((current) =>
      current.map((skill) =>
        skill.id === skillId
          ? {
              ...skill,
              status: "reviewing",
              updatedAt: "2026-07-24 12:10",
            }
          : skill
      )
    );
    toast.success(`${draftVersion.version} 已提交发布审核`);
  }

  function handleSaveVersion(input: {
    mode: WorkOrderType;
    skillId?: string;
    name: string;
    request: string;
    evidence: string[];
  }) {
    const timestamp = Date.now();
    if (input.mode === "create") {
      const skillId = `${CREATE_SKILL_ID_PREFIX}-${timestamp}`;
      const files = CREATE_SKILL_FILES.map((file) => ({
        path: file.path,
        content: file.content,
      }));
      const version: SkillVersion = {
        id: `${CREATE_SKILL_ID_PREFIX}-v10-${timestamp}`,
        version: "V1",
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
          boundVersion: "V1",
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
        outputVersion: "V1 草稿",
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
      toast.success("已保存为 V1 草稿，新技能已加入技能列表");
      setScreen({ kind: "detail", skillId: skill.id, tab: "overview" });
      return;
    }

    const target = skills.find((skill) => skill.id === input.skillId);
    if (!target) return;
    const currentVersion = getCurrentManagedVersion(target);
    const nextVersionLabel = getNextVersionLabel(currentVersion?.version);
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
      files: currentVersion?.files ?? [],
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
    toast.success(`已保存为 ${nextVersionLabel} 草稿，并生成优化工单`);
    setScreen({ kind: "detail", skillId: target.id, tab: "versions" });
  }

  function handleSaveManualVersion(skillId: string, draft: SkillManualDraft) {
    const target = skills.find((skill) => skill.id === skillId);
    if (!target) return;

    const timestamp = Date.now();
    const currentVersion = getCurrentManagedVersion(target);
    const currentVersionLabel = currentVersion?.version ?? "V1";
    const nextVersionLabel = getNextVersionLabel(currentVersionLabel);
    const nextVersion: SkillVersion = {
      id: `${target.id}-${nextVersionLabel}-manual-${timestamp}`,
      version: nextVersionLabel,
      baseVersionId: currentVersion?.id,
      createdAt: "2026-07-24 11:52",
      createdBy: "邸若楠",
      source: "manual-edit",
      status: "draft",
      releaseNotes: "手动编辑概览、文件结构与依赖后统一生成的技能版本。",
      evidence: [`基于 ${currentVersionLabel} 的技能级编辑草稿`],
      evaluationStatus: null,
      evaluationReport: null,
      files: draft.files.map((file) => ({ ...file })),
    };

    setSkills((current) =>
      current.map((skill) =>
        skill.id === skillId
          ? {
              ...skill,
              name: draft.name,
              displayName: draft.displayName,
              description: draft.description,
              usageInstructions: draft.usageInstructions,
              dependencies: draft.dependencies.map((dependency) => ({ ...dependency })),
              status: skill.publishedVersionId ? "published" : "draft",
              currentVersionId: nextVersion.id,
              updatedAt: "2026-07-24 11:52",
              versions: [nextVersion, ...skill.versions],
              runtimeSnapshot: {
                id: `pending-${nextVersionLabel}-manual`,
                boundVersion: nextVersionLabel,
                status: "not-run",
              },
            }
          : skill
      )
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
            boundVersion: getCurrentManagedVersion(skill)?.version ?? "V1",
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

  function confirmRollback() {
    if (
      !rollbackTarget ||
      !rollbackSkill ||
      !rollbackVersion ||
      rollbackConfirmation !== rollbackSkill.name
    ) {
      return;
    }
    const timestamp = Date.now();
    const currentVersion = getCurrentManagedVersion(rollbackSkill);
    const nextVersionLabel = getNextVersionLabel(currentVersion?.version);
    const rollbackRecord: SkillVersion = {
      ...rollbackVersion,
      id: `${rollbackSkill.id}-${nextVersionLabel}-rollback-${timestamp}`,
      version: nextVersionLabel,
      baseVersionId: rollbackVersion.id,
      createdAt: "2026-07-24 11:45",
      createdBy: "邸若楠",
      source: "rollback",
      status: "draft",
      releaseNotes: `由 ${rollbackVersion.version} 回滚生成，不覆盖历史。`,
      evaluationStatus: null,
      evaluationReport: null,
    };
    setSkills((current) =>
      current.map((skill) =>
        skill.id === rollbackSkill.id
          ? {
              ...skill,
              status: skill.publishedVersionId ? "published" : "draft",
              currentVersionId: rollbackRecord.id,
              updatedAt: "2026-07-24 11:45",
              versions: [rollbackRecord, ...skill.versions],
              runtimeSnapshot: {
                id: `pending-rollback-${nextVersionLabel}`,
                boundVersion: nextVersionLabel,
                status: "not-run",
              },
            }
          : skill
      )
    );
    setRollbackTarget(null);
    setRollbackConfirmation("");
    toast.success(`已生成回滚版本 ${nextVersionLabel}，等待重新发布`);
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
        screen.kind === "workspace" && !screen.workOrderId
          ? "h-full min-h-0 overflow-hidden"
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
          onBack={onExit}
          onSaveVersion={handleSaveVersion}
        />
      ) : null}

      {screen.kind === "detail" && activeSkill ? (
        <SkillDetailView
          skill={activeSkill}
          activeTab={screen.tab}
          canManage={canManage}
          onBack={onExit}
          onTabChange={(tab) => setScreen({ ...screen, tab })}
          onOptimize={() => openWorkspace("optimize", activeSkill.id)}
          onImportUpdate={() => openUpdateImport(activeSkill.id)}
          onSubmitPublish={() => submitPublish(activeSkill.id)}
          canSubmitPublish={
            activeSkill.status !== "reviewing" &&
            hasUnpublishedChanges(activeSkill) &&
            getCurrentManagedVersion(activeSkill)?.status === "draft"
          }
          publishLabel={activeSkill.status === "reviewing" ? "审核中" : "提交发布"}
          onExport={() => exportSkill(activeSkill.id)}
          onDownloadVersion={(versionId) => exportSkillVersion(activeSkill.id, versionId)}
          onRunAssembly={() => setScreen({ kind: "trial-run", skillId: activeSkill.id })}
          onSaveManualVersion={(draft) => handleSaveManualVersion(activeSkill.id, draft)}

        />
      ) : null}

      {screen.kind === "trial-run" && activeSkill ? (
        <TrialRunView
          skill={activeSkill}
          onBack={() =>
            setScreen({ kind: "detail", skillId: activeSkill.id, tab: "dependencies" })
          }
          onComplete={() => handleRunAssembly(activeSkill.id)}
        />
      ) : null}

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

      <Dialog
        open={Boolean(rollbackTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRollbackTarget(null);
            setRollbackConfirmation("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>回滚到 {rollbackVersion?.version}</DialogTitle>
            <DialogDescription className="leading-6">
              回滚不会覆盖历史，而是生成一个新版本并重新进入发布流转。当前发布版本保持可用，直到新版本发布。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rollback-confirmation">
              输入 <span className="font-mono font-semibold">{rollbackSkill?.name}</span> 确认回滚
            </Label>
            <Input
              id="rollback-confirmation"
              value={rollbackConfirmation}
              onChange={(event) => setRollbackConfirmation(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRollbackTarget(null)}>
              取消
            </Button>
            <Button
              className="bg-[#2773ff]"
              disabled={rollbackConfirmation !== rollbackSkill?.name}
              onClick={confirmRollback}
            >
              生成回滚版本
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
