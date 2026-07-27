"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  FileArchive,
  History,
  LoaderCircle,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
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
  onRunAssembly: () => void;
  onRollback: (versionId: string) => void;
  onSaveManualVersion: (draft: SkillManualDraft) => void;
}

const TABS: Array<{ id: SkillDetailTab; label: string }> = [
  { id: "overview", label: "概览" },
  { id: "files", label: "文件结构" },
  { id: "dependencies", label: "依赖" },
  { id: "versions", label: "版本管理" },
];

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
  onRunAssembly,
  onRollback,
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
  const lockedVersion = currentManagedVersion?.version ?? "v1.0";
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

  function cancelEditing() {
    setDraft(createDraft());
    setEditing(false);
  }

  function saveAsNewVersion() {
    onSaveManualVersion(draft);
    setEditing(false);
    toast.success(`已基于 ${lockedVersion} 保存改动，生成新版本草稿`);
  }

  return (
    <section className="space-y-5 px-5" data-testid="skillhub-detail-view">
      <div className="border-b border-slate-200 bg-white">
        <header className="flex flex-col gap-4 border-b border-slate-200 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onBack}
              aria-label="返回技能管理"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1bb3a9] text-white">
              <FileArchive className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold text-slate-950">{skill.name}</h1>
                <SkillStatusPill status={releaseStatus} />
                {hasPendingVersion && currentPublishedVersion ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    {skill.status === "reviewing" ? "更新审核中" : "有未发布更新"}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-slate-500">{skill.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-11 lg:shrink-0 lg:flex-nowrap lg:pl-0">
            <Button type="button" variant="outline" className="h-9 rounded-[5px]" onClick={onExport}>
              <Download className="h-4 w-4" />
              导出 .zip
            </Button>
            {canManage ? (
              <>
                {editing ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 rounded-[5px]"
                      onClick={cancelEditing}
                    >
                      <X className="h-4 w-4" />
                      取消
                    </Button>
                    <Button
                      type="button"
                      className="h-9 rounded-[5px] bg-[#2773ff]"
                      onClick={saveAsNewVersion}
                    >
                      <Save className="h-4 w-4" />
                      保存为新版本
                    </Button>
                  </>
                ) : (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-[5px] border-slate-200 text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                          更新技能
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-lg p-1.5">
                        <DropdownMenuItem
                          className="cursor-pointer rounded-md px-3 py-2.5"
                          onSelect={() => setEditing(true)}
                        >
                          <Pencil className="h-4 w-4 text-slate-500" />
                          <span>
                            <span className="block text-sm font-medium text-slate-900">手动编辑</span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              修改概览、文件与依赖
                            </span>
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer rounded-md px-3 py-2.5"
                          onSelect={onOptimize}
                        >
                          <Sparkles className="h-4 w-4 text-[#2773ff]" />
                          <span>
                            <span className="block text-sm font-medium text-slate-900">AI 优化</span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              通过 Claw 对话生成更新
                            </span>
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer rounded-md px-3 py-2.5"
                          onSelect={onImportUpdate}
                        >
                          <FileArchive className="h-4 w-4 text-slate-500" />
                          <span>
                            <span className="block text-sm font-medium text-slate-900">
                              导入更新包
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              用 zip 或链接更新当前技能
                            </span>
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      type="button"
                      className="h-9 rounded-[5px] bg-[#2773ff] hover:bg-[#1f66f0]"
                      onClick={onSubmitPublish}
                      disabled={!canSubmitPublish}
                    >
                      {publishLabel}
                    </Button>
                  </>
                )}
              </>
            ) : null}
          </div>
        </header>

        <nav className="flex items-center gap-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex h-12 shrink-0 items-center border-b-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-[#2773ff] text-[#2773ff]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
          <span className="flex h-12 shrink-0 items-center text-sm text-slate-300" title="评测报告（待建设）">
            评测报告
          </span>
        </nav>
      </div>

      {activeTab === "overview" ? (
        <OverviewTab skill={skill} draft={draft} editing={editing} onChange={setDraft} />
      ) : null}
      {activeTab === "files" ? (
        <FilesTab
          files={draft.files}
          editing={editing}
          onChange={(files) => setDraft((current) => ({ ...current, files }))}
        />
      ) : null}
      {activeTab === "dependencies" ? (
        <DependenciesTab
          skill={skill}
          dependencies={draft.dependencies}
          editing={editing}
          canManage={canManage}
          onChange={(dependencies) => setDraft((current) => ({ ...current, dependencies }))}
          onRunAssembly={onRunAssembly}
        />
      ) : null}
      {activeTab === "versions" ? (
        <VersionsTab
          skill={skill}
          draft={draft}
          editing={editing}
          canManage={canManage}
          onRollback={onRollback}
        />
      ) : null}
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
          title="随快照携带"
          subtitle="试运行已安装并锁定版本，随版本快照复现"
          dependencies={snapshotDependencies}
          emptyText="试运行后将在这里展示已安装的运行时依赖。"
          editing={editing}
          onChange={updateDependency}
          onRemove={removeDependency}
        />
        <DependencyGroup
          title="平台引用"
          subtitle="不随包携带，运行时连接；下架或失效会显式告警"
          dependencies={platformDependencies}
          emptyText="当前没有 MCP、插件或外部服务引用。"
          editing={editing}
          onChange={updateDependency}
          onRemove={removeDependency}
        />
        {editing ? (
          <div className="border-t border-slate-100 py-4">
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              onClick={() =>
                onChange([
                  ...dependencies,
                  {
                    id: `dependency-${Date.now()}`,
                    name: "新依赖",
                    kind: "platform",
                    type: "mcp",
                    status: "ready",
                    note: "待补充说明",
                  },
                ])
              }
            >
              <Plus className="h-4 w-4" />
              添加依赖
            </Button>
          </div>
        ) : null}
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
}: {
  title: string;
  subtitle: string;
  dependencies: SkillDependency[];
  emptyText: string;
  editing: boolean;
  onChange: (id: string, patch: Partial<SkillDependency>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="border-t border-slate-100 py-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
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
  canManage,
  onRollback,
}: {
  skill: SkillRecord;
  draft: SkillManualDraft;
  editing: boolean;
  canManage: boolean;
  onRollback: (versionId: string) => void;
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

  return (
    <div className={cn("grid", editing && "lg:grid-cols-[minmax(0,1fr)_360px] lg:divide-x lg:divide-slate-200")}>
      <div className={cn(editing && "lg:pr-8")}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">版本历史</h2>
          <History className="h-5 w-5 text-slate-400" />
        </div>
        <div className="mt-4 space-y-2">
          {skill.versions.map((version) => {
            const current = version.id === skill.currentVersionId;
            const published = version.id === skill.publishedVersionId;
            return (
              <div key={version.id} className="border-b border-slate-200 pb-3 pt-3 first:pt-0 last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-semibold text-slate-900">
                       {version.version}
                      </span>
                      <SourcePill source={version.source} />
                      {current ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                          当前版本
                        </span>
                      ) : null}
                      {published ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          当前发布
                        </span>
                      ) : null}
                      {current && !published ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {skill.status === "reviewing" ? "审核中" : "草稿"}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-5 text-slate-600">{version.releaseNotes}</p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span>{version.createdAt}</span>
                      <span>{version.createdBy}</span>
                      {version.conversationId ? <span>对话 {version.conversationId}</span> : null}
                    </div>
                    {version.evidence?.length ? (
                      <div className="mt-2 text-xs text-slate-500">
                        依据：{version.evidence.join(" · ")}
                      </div>
                    ) : null}
                  </div>
                  {!current && canManage ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 shrink-0 px-2 text-[#2773ff]"
                      onClick={() => onRollback(version.id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      回滚到此
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
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
