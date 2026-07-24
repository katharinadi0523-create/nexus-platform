"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Link2,
  Upload,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { SkillDetailView } from "./detail-view";
import { INITIAL_SKILLS, INITIAL_WORK_ORDERS } from "./mock-data";
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

export interface SkillHubV2Seed {
  id: string;
  name: string;
  description: string;
  owner: string;
  updatedAt: string;
  status: "draft" | "reviewing" | "published" | "failed";
  version?: string;
  usageInstructions: string;
  files: SkillFile[];
}

interface SkillHubV2WorkbenchProps {
  initialScreen: SkillHubScreen;
  seedSkill?: SkillHubV2Seed;
  onExit: () => void;
}

function getNextVersionLabel(version = "v1.0") {
  const [major = 1, minor = 0] = version
    .replace(/^v/i, "")
    .split(".")
    .map((value) => Number.parseInt(value, 10));
  return `v${Number.isFinite(major) ? major : 1}.${(Number.isFinite(minor) ? minor : 0) + 1}`;
}

function createSeedRecord(seed: SkillHubV2Seed): SkillRecord {
  const currentVersion = seed.version ? `v${seed.version.replace(/^v/i, "")}` : "v1.0";
  const [major, minor] = currentVersion
    .replace(/^v/i, "")
    .split(".")
    .map((value) => Number.parseInt(value, 10));
  const previousVersion =
    Number.isFinite(minor) && minor > 0 ? `v${major}.${minor - 1}` : `v${Math.max(major - 1, 0)}.9`;
  const versionHistory: SkillVersion[] = [
    {
      id: `${seed.id}-${currentVersion}`,
      version: currentVersion,
      createdAt: seed.updatedAt,
      createdBy: seed.owner,
      source: "ai-optimize",
      status: seed.status === "published" ? "published" : "draft",
      releaseNotes: "由现有技能管理记录同步，补充为二期版本基线。",
      conversationId: "CONV-2087",
      evidence: ["失败运行 TASK-2087", "样本 no_header.csv"],
      evaluationStatus: null,
      evaluationReport: null,
      files: seed.files,
    },
    {
      id: `${seed.id}-${previousVersion}`,
      version: previousVersion,
      createdAt: "2026-07-10 09:20",
      createdBy: seed.owner,
      source: "import",
      status: "published",
      releaseNotes: "历史稳定版本。",
      evaluationStatus: null,
      evaluationReport: null,
      files: seed.files.map((file, index) =>
        index === 0 ? { ...file, content: `${file.content}\n\n<!-- 历史版本 -->` } : file
      ),
    },
  ];
  return {
    id: seed.id,
    name: seed.name,
    displayName: seed.name,
    description: seed.description,
    owner: seed.owner,
    updatedAt: seed.updatedAt,
    status: seed.status,
    currentVersion: seed.status === "published" ? currentVersion : undefined,
    sourceLabel: "现有技能管理",
    usageInstructions: seed.usageInstructions,
    versions: versionHistory,
    dependencies: [],
    runtimeSnapshot: {
      id: `pending-${seed.id}-${currentVersion}`,
      boundVersion: currentVersion,
      status: "not-run",
    },
  };
}

export function SkillHubV2Workbench({
  initialScreen,
  seedSkill,
  onExit,
}: SkillHubV2WorkbenchProps) {
  const [skills, setSkills] = useState<SkillRecord[]>(() => {
    if (!seedSkill) return INITIAL_SKILLS;
    const seeded = createSeedRecord(seedSkill);
    return [seeded, ...INITIAL_SKILLS.filter((item) => item.id !== seeded.id)];
  });
  const [workOrders, setWorkOrders] = useState<SkillWorkOrder[]>(INITIAL_WORK_ORDERS);
  const [screen, setScreen] = useState<SkillHubScreen>(initialScreen);
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<"local" | "url">("local");
  const [importUrl, setImportUrl] = useState("");
  const [importFileName, setImportFileName] = useState("");
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

  function openDetail(
    skillId: string,
    tab: "overview" | "files" | "dependencies" | "versions" = "overview"
  ) {
    setScreen({ kind: "detail", skillId, tab });
  }

  function openWorkspace(mode: WorkOrderType, skillId?: string, workOrderId?: string) {
    setScreen({ kind: "workspace", mode, skillId, workOrderId });
  }

  async function exportSkill(skillId: string) {
    const skill = skills.find((item) => item.id === skillId);
    if (!skill) return;

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const currentVersion = skill.versions[0];
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

  function handleImport() {
    const valid = importMode === "url" ? importUrl.trim().length > 0 : importFileName.length > 0;
    if (!valid) {
      toast.error(importMode === "url" ? "请输入导入链接" : "请选择 zip 文件");
      return;
    }
    const stamp = Date.now().toString().slice(-5);
    const name =
      importMode === "url"
        ? importUrl.split("/").filter(Boolean).pop()?.replace(/\.git$/, "") || `imported-${stamp}`
        : importFileName.replace(/\.zip$/i, "") || `imported-${stamp}`;
    const files: SkillFile[] = [
      {
        path: "SKILL.md",
        content: `---\nname: ${name}\ndescription: 导入的 Skill 草稿\n---\n`,
      },
      { path: "src/main.py", content: "def run(input):\n    return input\n" },
    ];
    const version: SkillVersion = {
      id: `${name}-v10`,
      version: "v1.0",
      createdAt: "2026-07-24 11:30",
      createdBy: "邸若楠",
      source: "import",
      status: "draft",
      releaseNotes: "导入生成的首版草稿。",
      evaluationStatus: null,
      evaluationReport: null,
      files,
    };
    const skill: SkillRecord = {
      id: `${name}-${stamp}`,
      name,
      displayName: name,
      description: "通过统一新建入口导入的 Skill，等待试运行装配与发布。",
      owner: "邸若楠",
      updatedAt: "2026-07-24 11:30",
      status: "draft",
      sourceLabel: importMode === "url" ? "链接导入" : "压缩包导入",
      usageInstructions: "请完善使用说明。",
      versions: [version],
      dependencies: [],
      runtimeSnapshot: {
        id: `pending-${name}`,
        boundVersion: "v1.0",
        status: "not-run",
      },
    };
    setSkills((current) => [skill, ...current]);
    setImportOpen(false);
    setImportUrl("");
    setImportFileName("");
    toast.success("导入成功，已生成 v1.0 草稿");
    openDetail(skill.id, "dependencies");
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
      const files = [
        {
          path: "SKILL.md",
          content:
            "---\nname: rice-rna-analysis\ndescription: 分析水稻 RNA 表达矩阵。\n---\n",
        },
        { path: "src/main.py", content: "def run(expression, metadata):\n    return qc(expression)\n" },
        { path: "tests/test_expression.py", content: "def test_expression_fixture():\n    assert True\n" },
      ];
      const version: SkillVersion = {
        id: `rice-v10-${timestamp}`,
        version: "v1.0",
        createdAt: "2026-07-24 11:36",
        createdBy: "邸若楠",
        source: "ai-create",
        status: "draft",
        releaseNotes: "AI 创建的首版草稿。",
        conversationId: `CONV-${timestamp.toString().slice(-4)}`,
        evidence: input.evidence,
        evaluationStatus: null,
        evaluationReport: null,
        files,
      };
      const skill: SkillRecord = {
        id: `rice-rna-${timestamp}`,
        name: input.name,
        displayName: "水稻 RNA 表达分析",
        description: "读取水稻 RNA 表达矩阵，完成质控、差异摘要和异常样本提示。",
        owner: "邸若楠",
        updatedAt: "2026-07-24 11:36",
        status: "draft",
        sourceLabel: "AI 创建",
        usageInstructions: "上传表达矩阵、样本分组和对照组信息。",
        versions: [version],
        dependencies: [],
        runtimeSnapshot: {
          id: "pending-rice-rna",
          boundVersion: "v1.0",
          status: "not-run",
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
        createdAt: "2026-07-24 11:36",
        evidence: input.evidence,
        steps: [
          { id: "create-skill", label: "调用 create skill 接管创建任务", status: "done" },
          { id: "ontology", label: "检索本体并确定解析方法", status: "done" },
          { id: "generate", label: "生成标准 Skill 包与基础校验", status: "done" },
          { id: "confirm", label: "等待用户确认", status: "active" },
          { id: "publish", label: "进入发布链路（质量门默认直通）", status: "pending" },
        ],
      };
      setSkills((current) => [skill, ...current]);
      setWorkOrders((current) => [order, ...current]);
      toast.success("已保存为 v1.0 草稿，并生成创建工单");
      setScreen({ kind: "detail", skillId: skill.id, tab: "dependencies" });
      return;
    }

    const target = skills.find((skill) => skill.id === input.skillId);
    if (!target) return;
    const currentNumber = Number.parseInt(target.versions[0]?.version.replace(/\D/g, "") || "10", 10);
    const nextVersionLabel = `v${Math.floor(currentNumber / 10)}.${(currentNumber % 10) + 1}`;
    const nextVersion: SkillVersion = {
      id: `${target.id}-${nextVersionLabel}-${timestamp}`,
      version: nextVersionLabel,
      createdAt: "2026-07-24 11:38",
      createdBy: "邸若楠",
      source: "ai-optimize",
      status: "draft",
      releaseNotes: "AI 优化生成：增强异常输入处理并补充回归测试。",
      conversationId: `CONV-${timestamp.toString().slice(-4)}`,
      evidence: input.evidence,
      evaluationStatus: null,
      evaluationReport: null,
      files: target.versions[0]?.files ?? [],
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
              status: "reviewing",
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
    const currentVersion = target.versions[0]?.version ?? "v1.0";
    const nextVersionLabel = getNextVersionLabel(currentVersion);
    const nextVersion: SkillVersion = {
      id: `${target.id}-${nextVersionLabel}-manual-${timestamp}`,
      version: nextVersionLabel,
      createdAt: "2026-07-24 11:52",
      createdBy: "邸若楠",
      source: "manual-edit",
      status: "draft",
      releaseNotes: "手动编辑概览、文件结构与依赖后统一生成的技能版本。",
      evidence: [`基于 ${currentVersion} 的技能级编辑草稿`],
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
              status: "reviewing",
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
      current.map((skill) =>
        skill.id === skillId
          ? {
              ...skill,
              dependencies:
                skill.dependencies.length > 0
                  ? skill.dependencies
                  : [
                      {
                        id: "pandas",
                        name: "pandas",
                        version: "2.2.2",
                        kind: "snapshot",
                        type: "runtime",
                        status: "ready",
                        note: "由静态扫描识别并在 AI 试运行中锁定",
                      },
                    ],
              runtimeSnapshot: {
                id: `rt-snap-${skill.id}-${Date.now().toString().slice(-4)}`,
                boundVersion: skill.versions[0]?.version ?? "v1.0",
                status: "ready",
                assembledAt: "2026-07-24 11:42",
                sample: skill.runtimeSnapshot.sample ?? "samples/rice_expression.csv",
              },
            }
          : skill
      )
    );
    toast.success("AI 试运行成功：依赖已锁定并冻结为运行时快照");
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
    const currentNumber = Number.parseInt(
      rollbackSkill.versions[0]?.version.replace(/\D/g, "") || "10",
      10
    );
    const nextVersionLabel = `v${Math.floor(currentNumber / 10)}.${(currentNumber % 10) + 1}`;
    const rollbackRecord: SkillVersion = {
      ...rollbackVersion,
      id: `${rollbackSkill.id}-${nextVersionLabel}-rollback-${timestamp}`,
      version: nextVersionLabel,
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
              status: "reviewing",
              currentVersion: skill.currentVersion,
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
    <div className="min-h-full" data-testid="skillhub-v2-extension">
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
          onExport={() => exportSkill(activeSkill.id)}
          onRunAssembly={() => setScreen({ kind: "trial-run", skillId: activeSkill.id })}
          onSaveManualVersion={(draft) => handleSaveManualVersion(activeSkill.id, draft)}
          onRollback={(versionId) => {
            setRollbackTarget({ skillId: activeSkill.id, versionId });
            setRollbackConfirmation("");
          }}
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

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>导入技能</DialogTitle>
            <DialogDescription>
              导入只携带代码；保存为 v1.0 草稿后，通过试运行完成依赖装配。
            </DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={importMode}
            onValueChange={(value) => setImportMode(value as "local" | "url")}
            className="grid grid-cols-2 gap-3"
          >
            <Label
              htmlFor="import-local"
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-4",
                importMode === "local" ? "border-blue-300 bg-blue-50/50" : "border-slate-200"
              )}
            >
              <RadioGroupItem id="import-local" value="local" className="mt-0.5" />
              <span>
                <span className="flex items-center gap-1.5 font-medium text-slate-900">
                  <Upload className="h-4 w-4" />
                  压缩包
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">本地 .zip 文件</span>
              </span>
            </Label>
            <Label
              htmlFor="import-url"
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-4",
                importMode === "url" ? "border-blue-300 bg-blue-50/50" : "border-slate-200"
              )}
            >
              <RadioGroupItem id="import-url" value="url" className="mt-0.5" />
              <span>
                <span className="flex items-center gap-1.5 font-medium text-slate-900">
                  <Link2 className="h-4 w-4" />
                  链接
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  GitHub / skills.sh / ClawHub
                </span>
              </span>
            </Label>
          </RadioGroup>
          {importMode === "local" ? (
            <div className="space-y-2">
              <Label htmlFor="skill-zip">选择文件</Label>
              <Input
                id="skill-zip"
                type="file"
                accept=".zip,application/zip"
                onChange={(event) => setImportFileName(event.target.files?.[0]?.name ?? "")}
              />
              {importFileName ? (
                <p className="text-xs text-emerald-600">已选择：{importFileName}</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="skill-url">导入链接</Label>
              <Input
                id="skill-url"
                value={importUrl}
                onChange={(event) => setImportUrl(event.target.value)}
                placeholder="https://github.com/org/repo"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              取消
            </Button>
            <Button className="bg-[#2773ff]" onClick={handleImport}>
              校验并导入
            </Button>
          </DialogFooter>
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
