"use client";

import { useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  FileArchive,
  List,
  LoaderCircle,
  Pencil,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import {
  ToolConfigDialog,
  type ToolConfigSelection,
} from "@/components/claw-hub-next/tool-config-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  buildFileTree,
  DependencyStatusPill,
  DependencyTypeIcon,
  FileGlyph,
  SkillStatusPill,
  SourcePill,
} from "./shared";
import type {
  SkillDependency,
  SkillDetailTab,
  SkillFile,
  SkillManualDraft,
  SkillRecord,
} from "./types";
import {
  getCurrentManagedVersion,
  getCurrentPublishedVersion,
  hasUnpublishedChanges,
} from "./versioning";

const PLATFORM_TOOL_KINDS = ["mcp", "plugin"] as const;

function mapToolSelectionToPlatformDependency(
  selection: ToolConfigSelection
): SkillDependency | null {
  if (selection.kind !== "mcp" && selection.kind !== "plugin") {
    return null;
  }
  return {
    id: selection.id,
    name: selection.name,
    kind: "platform",
    type: selection.kind,
    status: "ready",
    note: selection.description || "来自平台插件广场",
  };
}
interface SkillDetailViewProps {
  skill: SkillRecord;
  activeTab: SkillDetailTab;
  canManage: boolean;
  onBack: () => void;
  onTabChange: (tab: SkillDetailTab) => void;
  onOptimize: () => void;
  onImportUpdate: () => void;
  onSubmitPublish: () => void;
  canSubmitPublish: boolean;
  publishLabel: string;
  onExport: () => void;
  onDownloadVersion: (versionId: string) => void;
  onRunAssembly: () => void;
  onSaveManualVersion: (draft: SkillManualDraft) => void;
}

export function SkillDetailView({
  skill,
  activeTab,
  canManage,
  onBack,
  onTabChange,
  onOptimize,
  onImportUpdate,
  onSubmitPublish,
  canSubmitPublish,
  publishLabel,
  onExport,
  onDownloadVersion,
  onRunAssembly,
  onSaveManualVersion,
}: SkillDetailViewProps) {
  const currentManagedVersion = getCurrentManagedVersion(skill);
  const currentPublishedVersion = getCurrentPublishedVersion(skill);
  const hasPendingVersion = hasUnpublishedChanges(skill);
  const releaseStatus = currentPublishedVersion
    ? skill.status === "offline"
      ? "offline"
      : "published"
    : skill.status;
  const lockedVersion = currentManagedVersion?.version ?? "V1";
  const createDraft = (): SkillManualDraft => ({
    name: skill.name,
    displayName: skill.displayName,
    description: skill.description,
    usageInstructions: skill.usageInstructions,
    files: (currentManagedVersion?.files ?? []).map((file) => ({ ...file })),
    dependencies: skill.dependencies.map((dependency) => ({ ...dependency })),
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SkillManualDraft>(createDraft);
  const visibleTab = activeTab === "dependencies" || activeTab === "files" ? activeTab : "overview";
  const skillTitle = skill.displayName === skill.name
    ? skill.displayName
    : `${skill.displayName}  ${skill.name}`;

  function cancelEditing() {
    setDraft(createDraft());
    setEditing(false);
  }

  function saveAsNewVersion() {
    onSaveManualVersion(draft);
    setEditing(false);
    toast.success(`已基于 ${lockedVersion} 保存改动，生成新版本草稿`);
  }

  const detailTabs: Array<{
    id: "overview" | "dependencies";
    label: string;
    count: number;
    icon: typeof List;
  }> = [
    { id: "overview", label: "版本说明", count: skill.versions.length, icon: List },
    { id: "dependencies", label: "依赖组件", count: skill.dependencies.length, icon: Wrench },
  ];

  return (
    <section className="px-5 pb-10" data-testid="skillhub-detail-view">
      <header className="flex flex-col gap-3 border-b border-slate-200 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-[5px] border-slate-200"
            onClick={onBack}
            aria-label="返回技能管理"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold text-slate-950">{skill.name}</h1>
              <SkillStatusPill status={releaseStatus} />
              {hasPendingVersion && currentPublishedVersion ? (
                <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  {skill.status === "reviewing" ? "更新审核中" : "有未发布更新"}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pl-12 lg:shrink-0 lg:pl-0">
          {editing ? (
            <>
              <Button type="button" variant="outline" className="h-9 rounded-[5px]" onClick={cancelEditing}>
                取消
              </Button>
              <Button type="button" className="h-9 rounded-[5px] bg-[#175cff]" onClick={saveAsNewVersion}>
                保存为新版本
              </Button>
            </>
          ) : (
            <>
              {canManage ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-[5px] border-slate-200"
                  onClick={() => toast.info("演示页面暂不执行删除操作")}
                >
                  删除
                </Button>
              ) : null}
              <Button type="button" variant="outline" className="h-9 rounded-[5px] border-slate-200" onClick={onExport}>
                下载
              </Button>
              {canManage && currentPublishedVersion ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-[5px] border-slate-200"
                  onClick={() => toast.info(releaseStatus === "offline" ? "该技能已下架" : "演示页面暂不执行下架操作")}
                >
                  {releaseStatus === "offline" ? "已下架" : "下架"}
                </Button>
              ) : null}
              {canManage ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" className="h-9 rounded-[5px] bg-[#175cff] hover:bg-[#0f4fe8]">
                      更新
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-lg p-1.5">
                    <DropdownMenuItem className="cursor-pointer rounded-md px-3 py-2.5" onSelect={() => setEditing(true)}>
                      <Pencil className="h-4 w-4 text-slate-500" />
                      手动编辑
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer rounded-md px-3 py-2.5" onSelect={onOptimize}>
                      <Sparkles className="h-4 w-4 text-[#2773ff]" />
                      AI 优化
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer rounded-md px-3 py-2.5" onSelect={onImportUpdate}>
                      <FileArchive className="h-4 w-4 text-slate-500" />
                      导入更新包
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              {canSubmitPublish ? (
                <Button type="button" className="h-9 rounded-[5px] bg-[#175cff]" onClick={onSubmitPublish}>
                  {publishLabel}
                </Button>
              ) : null}
            </>
          )}
        </div>
      </header>

      <section className="flex flex-col gap-5 py-7 md:flex-row md:items-center">
        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-[#14b8b2] text-white">
          <FileArchive className="h-11 w-11" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-medium leading-tight text-slate-900 lg:text-4xl">{skillTitle}</h2>
            <span className="rounded bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-600">技能</span>
            <span className="rounded border border-slate-200 bg-white px-2.5 py-1 text-sm text-slate-600">研发工具</span>
          </div>
          <p className="mt-4 line-clamp-2 text-base leading-7 text-slate-800">{skill.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>@{skill.owner}</span>
            <span className="h-4 w-px bg-slate-300" />
            <span>更新于 {skill.updatedAt}</span>
          </div>
        </div>
      </section>

      <nav className="flex items-center gap-7 border-b border-slate-200">
        {detailTabs.map((tab) => {
          const Icon = tab.icon;
          const active = visibleTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex h-12 items-center gap-2 border-b-2 text-sm font-medium transition-colors",
                active
                  ? "border-[#175cff] text-slate-900"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}（{tab.count}）
            </button>
          );
        })}
      </nav>

      <div className="pt-5">
        {visibleTab === "overview" ? (
          editing ? (
            <OverviewTab skill={skill} draft={draft} editing={editing} onChange={setDraft} />
          ) : (
            <VersionsTab
              skill={skill}
              draft={draft}
              editing={false}
              onDownloadVersion={onDownloadVersion}
            />
          )
        ) : visibleTab === "files" ? (
          <FilesTab
            files={draft.files}
            editing={editing}
            onChange={(files) => setDraft((current) => ({ ...current, files }))}
          />
        ) : (
          <DependenciesTab
            skill={skill}
            dependencies={draft.dependencies}
            editing={editing}
            canManage={canManage}
            onChange={(dependencies) => setDraft((current) => ({ ...current, dependencies }))}
            onRunAssembly={onRunAssembly}
          />
        )}
      </div>
    </section>
  );
}
function ReadOnlyField({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  const isEmpty = !value?.trim();
  return (
    <div className="space-y-1.5">
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={cn(
          "text-sm leading-6",
          multiline ? "whitespace-pre-wrap" : "truncate",
          isEmpty ? "text-slate-400" : "text-slate-800"
        )}
      >
        {isEmpty ? "暂无内容" : value}
      </div>
    </div>
  );
}

function OverviewTab({
  skill,
  draft,
  editing,
  onChange,
}: {
  skill: SkillRecord;
  draft: SkillManualDraft;
  editing: boolean;
  onChange: Dispatch<SetStateAction<SkillManualDraft>>;
}) {
  const currentManagedVersion = getCurrentManagedVersion(skill);
  const currentPublishedVersion = getCurrentPublishedVersion(skill);
  const currentVersionStatus =
    currentManagedVersion?.id === currentPublishedVersion?.id
      ? "已发布"
      : skill.status === "reviewing"
        ? "审核中"
        : "草稿";

  return (
    <div className="grid lg:grid-cols-[minmax(0,1.25fr)_320px] lg:divide-x lg:divide-slate-200">
      <div className="bg-white py-5 lg:pr-8">
        <h2 className="text-base font-semibold text-slate-900">基本信息</h2>

        {editing ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>技能名称</Label>
              <Input
                value={draft.name}
                onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>展示名称</Label>
              <Input
                value={draft.displayName}
                onChange={(event) =>
                  onChange((current) => ({ ...current, displayName: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>描述</Label>
              <Textarea
                value={draft.description}
                className="min-h-24"
                onChange={(event) =>
                  onChange((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>使用说明</Label>
              <Textarea
                value={draft.usageInstructions}
                className="min-h-28"
                onChange={(event) =>
                  onChange((current) => ({ ...current, usageInstructions: event.target.value }))
                }
              />
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <ReadOnlyField label="技能名称" value={draft.name} />
            <ReadOnlyField label="展示名称" value={draft.displayName} />
            <div className="md:col-span-2">
              <ReadOnlyField label="描述" value={draft.description} multiline />
            </div>
            <div className="md:col-span-2">
              <ReadOnlyField label="使用说明" value={draft.usageInstructions} multiline />
            </div>
          </div>
        )}
      </div>

      <aside>
        <div className="bg-white py-5 lg:pl-8">
          <h2 className="text-base font-semibold text-slate-900">资产状态</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">当前版本</dt>
              <dd className="flex items-center gap-2">
                <span className="font-mono font-medium text-slate-800">
                  {currentManagedVersion?.version ?? "—"}
                </span>
                {currentManagedVersion ? (
                  <span className="text-xs text-slate-500">{currentVersionStatus}</span>
                ) : null}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">当前发布</dt>
              <dd className="font-mono font-medium text-slate-800">
                {currentPublishedVersion?.version ?? "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">版本来源</dt>
              <dd>
                {currentManagedVersion ? <SourcePill source={currentManagedVersion.source} /> : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">创建人</dt>
              <dd className="font-medium text-slate-700">{skill.owner}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">运行时</dt>
              <dd className="font-medium text-slate-700">
                {skill.runtimeSnapshot.status === "ready" ? "已装配" : "未试运行"}
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}

function FilesTab({
  files,
  editing,
  onChange,
}: {
  files: SkillManualDraft["files"];
  editing: boolean;
  onChange: (files: SkillManualDraft["files"]) => void;
}) {
  const [selectedPath, setSelectedPath] = useState(files[0]?.path ?? "");
  const tree = buildFileTree(files);
  const selectedFile = files.find((file) => file.path === selectedPath) ?? files[0];

  function selectFile(path: string) {
    setSelectedPath(path);
  }

  return (
    <div className="grid min-h-[580px] overflow-hidden border-b border-slate-200 bg-white lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
          文件结构
        </div>
        <div className="space-y-0.5 p-3">
          {tree.rootFiles.map((path) => (
            <FileButton
              key={path}
              path={path}
              active={selectedPath === path}
              onClick={() => selectFile(path)}
            />
          ))}
          {tree.folders.map(([folder, children]) => (
            <div key={folder}>
              <div className="flex h-8 items-center gap-2 px-2 text-xs font-medium text-slate-600">
                <FileGlyph path={folder} open />
                {folder}
              </div>
              <div className="ml-3 border-l border-slate-200 pl-2">
                {children.map((path) => (
                  <FileButton
                    key={path}
                    path={path}
                    label={path.slice(path.indexOf("/") + 1)}
                    active={selectedPath === path}
                    onClick={() => selectFile(path)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="font-mono text-xs text-slate-600">{selectedFile?.path}</span>
        </div>
        {editing ? (
          <Textarea
            value={selectedFile?.content ?? ""}
            onChange={(event) =>
              onChange(
                files.map((file) =>
                  file.path === selectedFile?.path
                    ? { ...file, content: event.target.value, change: "modified" }
                    : file
                )
              )
            }
            className="min-h-[500px] flex-1 resize-none rounded-none border-0 p-5 font-mono text-xs leading-6 shadow-none focus-visible:ring-0"
          />
        ) : (
          <pre className="max-h-[520px] flex-1 overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-6 text-slate-700">
            {selectedFile?.content}
          </pre>
        )}
      </div>
    </div>
  );
}

function FileButton({
  path,
  label,
  active,
  onClick,
}: {
  path: string;
  label?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded px-2 text-left text-xs",
        active ? "bg-blue-50 text-[#2773ff]" : "text-slate-600 hover:bg-slate-50"
      )}
    >
      <FileGlyph path={path} />
      <span className="truncate">{label ?? path}</span>
    </button>
  );
}

function DependenciesTab({
  skill,
  dependencies,
  editing,
  canManage,
  onChange,
  onRunAssembly,
}: {
  skill: SkillRecord;
  dependencies: SkillManualDraft["dependencies"];
  editing: boolean;
  canManage: boolean;
  onChange: (dependencies: SkillManualDraft["dependencies"]) => void;
  onRunAssembly: () => void;
}) {
  const [platformToolDialogOpen, setPlatformToolDialogOpen] = useState(false);
  const snapshotDependencies = dependencies.filter((item) => item.kind === "snapshot");
  const platformDependencies = dependencies.filter((item) => item.kind === "platform");
  const snapshot = skill.runtimeSnapshot;

  function updateDependency(id: string, patch: Partial<SkillDependency>) {
    onChange(
      dependencies.map((dependency) =>
        dependency.id === id ? { ...dependency, ...patch } : dependency
      )
    );
  }

  function removeDependency(id: string) {
    onChange(dependencies.filter((dependency) => dependency.id !== id));
  }

  function handleConfirmPlatformTools(selections: ToolConfigSelection[]) {
    const existingIds = new Set(dependencies.map((item) => item.id));
    const nextItems = selections
      .map(mapToolSelectionToPlatformDependency)
      .filter((item): item is SkillDependency => Boolean(item))
      .filter((item) => !existingIds.has(item.id));

    if (!nextItems.length) {
      toast.message("所选 OpenAPI / MCP 均已在平台引用中");
      setPlatformToolDialogOpen(false);
      return;
    }

    onChange([...dependencies, ...nextItems]);
    setPlatformToolDialogOpen(false);
    toast.success(`已添加 ${nextItems.length} 个平台引用`);
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,1.15fr)_300px] lg:divide-x lg:divide-slate-200">
      <div className="bg-white lg:pr-8">
        <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">依赖与 AI 试运行</h2>
            <p className="mt-1 text-sm text-slate-500">
              静态扫描候选依赖，再通过沙箱试运行完成安装、锁版本和快照绑定。
            </p>
          </div>
          {canManage ? (
            <Button
              type="button"
              className="h-9 shrink-0 rounded-[5px] bg-[#2773ff]"
              onClick={onRunAssembly}
            >
              <Play className="h-4 w-4" />
              {snapshot.status === "ready" ? "重新 AI 试运行" : "进入 AI 试运行"}
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            {snapshot.status === "ready" ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : snapshot.status === "assembling" ? (
              <LoaderCircle className="h-4 w-4 animate-spin text-[#2773ff]" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-slate-400" />
            )}
            <div>
              <div className="text-sm font-medium text-slate-800">
                {snapshot.status === "ready"
                  ? "运行时快照已装配"
                  : snapshot.status === "assembling"
                    ? "正在沙箱试运行"
                    : "尚未试运行"}
              </div>
              <div className="mt-0.5 font-mono text-xs text-slate-500">
                {snapshot.status === "ready"
                  ? `${snapshot.id} · 绑定 ${snapshot.boundVersion}`
                  : "需要样例文件或 Skill 自带 tests/"}
              </div>
            </div>
          </div>
          {snapshot.sample ? (
            <span className="text-xs text-slate-500">输入：{snapshot.sample}</span>
          ) : null}
        </div>

        <DependencyGroup
          title="沙箱依赖"
          subtitle="试运行时安装并锁定版本，在沙箱中复现运行环境"
          dependencies={snapshotDependencies}
          emptyText="试运行后将在这里展示已安装的运行时依赖。"
          editing={editing}
          onChange={updateDependency}
          onRemove={removeDependency}
        />
        <DependencyGroup
          title="平台引用"
          subtitle="从平台插件广场引用 OpenAPI / MCP；不随包携带，运行时连接"
          dependencies={platformDependencies}
          emptyText="当前没有 MCP 或 OpenAPI 平台引用。"
          editing={editing}
          onChange={updateDependency}
          onRemove={removeDependency}
          action={
            editing && canManage ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-[5px]"
                onClick={() => setPlatformToolDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                添加 OpenAPI / MCP
              </Button>
            ) : null
          }
        />
      </div>

      <aside>
        <div className="bg-white py-5 lg:pl-8">
          <h2 className="text-base font-semibold text-slate-900">装配流程</h2>
          <ol className="mt-4 space-y-4">
            {[
              ["1", "静态扫描", "扫描 imports 与声明，形成候选依赖"],
              ["2", "沙箱试运行", "用样例或 tests/ 真跑一次"],
              ["3", "安装并锁版本", "捕获运行时依赖并验证可运行"],
              ["4", "冻结快照", "绑定到当前 Skill 版本"],
            ].map(([number, title, detail]) => (
              <li key={number} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {number}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800">{title}</div>
                  <div className="mt-0.5 text-xs leading-5 text-slate-500">{detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      <ToolConfigDialog
        open={platformToolDialogOpen}
        onOpenChange={setPlatformToolDialogOpen}
        onConfirm={handleConfirmPlatformTools}
        allowedKinds={[...PLATFORM_TOOL_KINDS]}
        title="添加平台引用"
        confirmLabel="添加到平台引用"
      />
    </div>
  );
}

function DependencyGroup({
  title,
  subtitle,
  dependencies,
  emptyText,
  editing,
  onChange,
  onRemove,
  action,
}: {
  title: string;
  subtitle: string;
  dependencies: SkillDependency[];
  emptyText: string;
  editing: boolean;
  onChange: (id: string, patch: Partial<SkillDependency>) => void;
  onRemove: (id: string) => void;
  action?: ReactNode;
}) {
  return (
    <div className="border-t border-slate-100 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="mt-3 space-y-2">
        {dependencies.length > 0 ? (
          dependencies.map((dependency) => (
            <div
              key={dependency.id}
              className={cn(
                "flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                dependency.status === "offline" ? "border-rose-200 bg-rose-50/40" : "border-slate-200"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md",
                    dependency.status === "offline"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  <DependencyTypeIcon type={dependency.type} />
                </span>
                <div>
                  {editing ? (
                    <div className="grid gap-2 sm:grid-cols-[minmax(160px,1fr)_120px]">
                      <Input
                        value={dependency.name}
                        className="h-8"
                        onChange={(event) => onChange(dependency.id, { name: event.target.value })}
                      />
                      <Input
                        value={dependency.version ?? ""}
                        className="h-8 font-mono"
                        placeholder="版本"
                        onChange={(event) =>
                          onChange(dependency.id, { version: event.target.value })
                        }
                      />
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-slate-800">
                        {dependency.name}
                        {dependency.version ? (
                          <span className="font-mono text-slate-500">=={dependency.version}</span>
                        ) : null}
                      </div>
                      {dependency.note ? (
                        <div className="mt-0.5 text-xs text-slate-500">{dependency.note}</div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DependencyStatusPill status={dependency.status} />
                {editing ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-500"
                    onClick={() => onRemove(dependency.id)}
                    aria-label={`删除依赖 ${dependency.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="border-b border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

type FileChangeKind = "added" | "modified" | "removed";
interface FileChange {
  path: string;
  kind: FileChangeKind;
}

function computeFileChanges(baseline: SkillFile[], draft: SkillFile[]): FileChange[] {
  const baselineByPath = new Map(baseline.map((file) => [file.path, file.content]));
  const draftByPath = new Map(draft.map((file) => [file.path, file.content]));
  const changes: FileChange[] = [];

  draft.forEach((file) => {
    if (!baselineByPath.has(file.path)) {
      changes.push({ path: file.path, kind: "added" });
    } else if (baselineByPath.get(file.path) !== file.content) {
      changes.push({ path: file.path, kind: "modified" });
    }
  });
  baseline.forEach((file) => {
    if (!draftByPath.has(file.path)) {
      changes.push({ path: file.path, kind: "removed" });
    }
  });

  return changes;
}

const CHANGE_META: Record<FileChangeKind, { label: string; className: string }> = {
  added: { label: "新增", className: "bg-emerald-50 text-emerald-700" },
  modified: { label: "修改", className: "bg-amber-50 text-amber-700" },
  removed: { label: "删除", className: "bg-rose-50 text-rose-700" },
};

function ChangeTag({ kind }: { kind: FileChangeKind }) {
  const meta = CHANGE_META[kind];
  return (
    <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium", meta.className)}>
      {meta.label}
    </span>
  );
}

function ChangeRow({ label, kind }: { label: string; kind: FileChangeKind }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2">
      <span className="truncate font-mono text-xs text-slate-700">{label}</span>
      <ChangeTag kind={kind} />
    </div>
  );
}

function VersionsTab({
  skill,
  draft,
  editing,
  onDownloadVersion,
}: {
  skill: SkillRecord;
  draft: SkillManualDraft;
  editing: boolean;
  onDownloadVersion: (versionId: string) => void;
}) {
  const baselineVersion = getCurrentManagedVersion(skill);
  const fileChanges = computeFileChanges(baselineVersion?.files ?? [], draft.files);
  const basicInfoChanged =
    draft.name !== skill.name ||
    draft.displayName !== skill.displayName ||
    draft.description !== skill.description ||
    draft.usageInstructions !== skill.usageInstructions;
  const dependenciesChanged =
    JSON.stringify(draft.dependencies) !== JSON.stringify(skill.dependencies);
  const hasChanges = fileChanges.length > 0 || basicInfoChanged || dependenciesChanged;
  const toVersionTimestamp = (value: string) => {
    const normalized = /^\d{2}-\d{2}\s/.test(value)
      ? `${new Date().getFullYear()}-${value}`
      : value;
    return Date.parse(normalized.replace(" ", "T")) || 0;
  };
  const sortedVersions = [...skill.versions].sort(
    (a, b) => toVersionTimestamp(b.createdAt) - toVersionTimestamp(a.createdAt)
  );

  return (
    <div className={cn("grid", editing && "lg:grid-cols-[minmax(0,1fr)_360px] lg:divide-x lg:divide-slate-200")}>
      <div className={cn("min-w-0", editing && "lg:pr-8")}>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">使用说明</h2>
          <p className="mt-4 max-w-[1180px] text-base leading-8 text-slate-800">
            {skill.usageInstructions?.trim() || "暂未填写使用说明"}
          </p>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">版本历史</h2>
              <p className="mt-1 text-xs text-slate-500">历史版本按更新时间倒序排列，支持下载指定版本。</p>
            </div>
            <span className="text-xs text-slate-400">共 {sortedVersions.length} 个版本</span>
          </div>

          <div className="relative mt-4">
            {sortedVersions.length > 1 ? (
              <span className="absolute bottom-6 left-[9px] top-6 w-px bg-slate-200" aria-hidden />
            ) : null}
            <div>
              {sortedVersions.map((version, index) => {
                const current = version.id === skill.currentVersionId;
                const published = version.id === skill.publishedVersionId;
                return (
                  <article
                    key={version.id}
                    className={cn(
                      "relative grid gap-3 border-b border-slate-100 py-4 pl-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center",
                      index === 0 && "pt-2"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-1 top-6 h-3 w-3 rounded-full border-[3px] border-white ring-1",
                        published || current
                          ? "bg-[#2773ff] ring-blue-100"
                          : "bg-slate-300 ring-slate-100"
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-base font-semibold text-slate-950">{version.version}</span>
                        {published ? (
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                            当前发布版本
                          </span>
                        ) : null}
                        {current && !published ? (
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                            {skill.status === "reviewing" ? "审核中" : "当前草稿"}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{version.releaseNotes || "—"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      <span className="text-sm text-slate-500">{version.createdAt}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label={`下载 ${version.version}`}
                        className="h-8 shrink-0 gap-1.5 rounded-[5px] border-slate-200 px-3 text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                        onClick={() => onDownloadVersion(version.id)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        下载
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {editing ? (
        <aside className="bg-white py-5 lg:pl-8">
          <h2 className="text-base font-semibold text-slate-900">本次改动</h2>
          <p className="mt-1 text-xs text-slate-500">
            基于 {baselineVersion?.version ?? "当前版本"} · 保存后生成新版本
          </p>
          {hasChanges ? (
            <div className="mt-4 space-y-2">
              {fileChanges.map((change) => (
                <ChangeRow key={change.path} label={change.path} kind={change.kind} />
              ))}
              {basicInfoChanged ? <ChangeRow label="基本信息" kind="modified" /> : null}
              {dependenciesChanged ? <ChangeRow label="依赖配置" kind="modified" /> : null}
            </div>
          ) : (
            <div className="mt-4 border-b border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              尚无改动
            </div>
          )}
        </aside>
      ) : null}
    </div>
  );
}