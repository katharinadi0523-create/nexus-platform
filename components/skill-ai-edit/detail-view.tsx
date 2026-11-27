"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  FileArchive,
  Pencil,
  Sparkles,
  Trash2,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SkillIconPreview, SkillStatusPill } from "./shared";
import type { SkillDetailTab, SkillFile, SkillManualDraft, SkillRecord } from "./types";
import { SkillFilesTab, type SkillFilesTabHandle } from "./skill-files-tab";
import {
  getCurrentManagedVersion,
  getCurrentPublishedVersion,
  hasUnpublishedChanges,
} from "./versioning";
import SkillAiEditSidebar from "@/components/skill-ai-edit/SkillAiEditSidebar";
import type { AiEditRoundKind } from "@/components/skill-ai-edit/skillAiEditModel";
import { CREATE_TIMELINE_ITEMS } from "./claw-mock-flows";

interface SkillDetailViewProps {
  skill: SkillRecord;
  activeTab: SkillDetailTab;
  canManage: boolean;
  onBack: () => void;
  onTabChange: (tab: SkillDetailTab) => void;
  onOptimize: () => void;
  /** 技能 AI 编辑原型：开放「更新技能 → AI 编辑」 */
  enableAiEdit?: boolean;
  /** 方案1「AI 编辑」置灰（方案2 仍可用） */
  disableAiEditScheme1?: boolean;
  /** 置灰「试用和 AI 编辑」合并入口（下方单独提供 AI 编辑 / 试用） */
  disableAiClawJumpCombined?: boolean;
  /** 方案2：跳转 claw-render-1 */
  onAiEditV2?: () => void;
  onImportUpdate: () => void;
  onSubmitPublish: () => void;
  canSubmitPublish: boolean;
  publishLabel: string;
  onExport: () => void;
  onRunAssembly: () => void;
  onRollback?: (versionId: string) => void;
  onSaveManualVersion: (draft: SkillManualDraft) => void;
  onOverwriteDraft?: (versionId: string) => void;
  onDelete: () => void;
  initialEditing?: boolean;
}

const SKILL_NAME_PATTERN = /^[A-Za-z\u4e00-\u9fa5][A-Za-z0-9\u4e00-\u9fa5_.-]*$/;
const SKILL_ICON_ACCEPT =
  "image/png,image/jpeg,image/svg+xml,image/webp,.png,.jpg,.jpeg,.svg,.webp";
const SKILL_ICON_MAX_BYTES = 2 * 1024 * 1024;
const UNSAVED_PUBLISH_TOAST = "当前文档尚未保存，请保存后再发布";

function isAllowedSkillIcon(file: File) {
  const type = file.type.toLowerCase();
  if (["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(type)) {
    return true;
  }
  return /\.(png|jpe?g|svg|webp)$/i.test(file.name);
}

async function readSkillIconDataUrl(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  const mime = file.type || "image/png";
  return `data:${mime};base64,${btoa(binary)}`;
}

function getSkillNameError(name: string) {
  const nextName = name.trim();
  if (!nextName) {
    return "";
  }
  if (!SKILL_NAME_PATTERN.test(nextName)) {
    return "支持字母、中文、数字、下划线 (_)、中划线 (-)、点 (.)，以字母或中文开头";
  }
  return "";
}

function snapshotFromSkill(skill: SkillRecord): SkillManualDraft {
  const currentManagedVersion = getCurrentManagedVersion(skill);
  const source = skill.savedDraft;
  if (source) {
    return {
      name: source.name,
      displayName: source.displayName,
      description: source.description,
      usageInstructions: source.usageInstructions,
      iconUrl: source.iconUrl,
      files: source.files.map((file) => ({ ...file })),
      dependencies: source.dependencies.map((dependency) => ({ ...dependency })),
    };
  }
  return {
    name: skill.name,
    displayName: skill.displayName,
    description: skill.description,
    usageInstructions: skill.usageInstructions,
    iconUrl: skill.iconUrl,
    files: (currentManagedVersion?.files ?? []).map((file) => ({ ...file })),
    dependencies: skill.dependencies.map((dependency) => ({ ...dependency })),
  };
}

export function SkillDetailView({
  skill,
  activeTab,
  canManage,
  onBack,
  onTabChange,
  onOptimize,
  enableAiEdit = false,
  onImportUpdate,
  onSubmitPublish,
  canSubmitPublish,
  publishLabel,
  onExport,
  onRunAssembly: _onRunAssembly,
  onSaveManualVersion,
  onDelete,
  initialEditing = false,
}: SkillDetailViewProps) {
  const currentPublishedVersion = getCurrentPublishedVersion(skill);
  const hasPendingVersion = hasUnpublishedChanges(skill);
  const isReviewing = skill.status === "reviewing";
  const canEdit = canManage && !isReviewing;
  const releaseStatus = currentPublishedVersion
    ? skill.status === "offline"
      ? "offline"
      : "published"
    : skill.status;

  const [draft, setDraft] = useState<SkillManualDraft>(() => snapshotFromSkill(skill));
  const [metaField, setMetaField] = useState<"name" | "description" | null>(null);
  const [nameDraft, setNameDraft] = useState(draft.name);
  const [descriptionDraft, setDescriptionDraft] = useState(draft.description);
  const [nameError, setNameError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [fileDirty, setFileDirty] = useState(false);
  const [fileEditing, setFileEditing] = useState(false);
  const [aiEditOpen, setAiEditOpen] = useState(false);
  const [aiEditMounted, setAiEditMounted] = useState(false);
  const [aiEditMode, setAiEditMode] = useState<AiEditRoundKind>("modify");
  const [aiSessionView, setAiSessionView] = useState<"preview" | "edit" | null>(null);
  const createdFromConversation =
    skill.sourceLabel === "AI 创建" ||
    skill.versions.some((version) => version.source === "ai-create");
  const filesTabRef = useRef<SkillFilesTabHandle>(null);
  const closeAiPanelRef = useRef<(() => void) | null>(null);
  const bindAiClose = useCallback((close: () => void) => {
    closeAiPanelRef.current = close;
  }, []);
  const pendingReplayRef = useRef<HTMLElement | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const [pendingReplay, setPendingReplay] = useState<HTMLElement | null>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const next = snapshotFromSkill(skill);
    setDraft(next);
    setNameDraft(next.name);
    setDescriptionDraft(next.description);
    setMetaField(null);
    setNameError("");
  }, [skill.id]);

  useEffect(() => {
    if (activeTab !== "files") {
      onTabChange("files");
    }
  }, [activeTab, onTabChange]);

  useEffect(() => {
    if (metaField === "name") nameInputRef.current?.focus();
    if (metaField === "description") descriptionInputRef.current?.focus();
  }, [metaField]);

  useEffect(() => {
    if (!metaField) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(`[data-meta-editor="${metaField}"]`)) return;
      if (metaField === "name") commitName();
      else commitDescription();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  });

  useEffect(() => {
    if (fileDirty || !pendingReplay) return;
    const target = pendingReplay;
    setPendingReplay(null);
    pendingReplayRef.current = null;
    target.click();
  }, [fileDirty, pendingReplay]);

  function blockPublishIfFileUnsaved() {
    if (fileEditing || fileDirty) {
      toast.error(UNSAVED_PUBLISH_TOAST);
      return true;
    }
    return false;
  }

  function handleSubmitPublishClick() {
    if (blockPublishIfFileUnsaved()) return;
    onSubmitPublish();
  }

  useEffect(() => {
    if (!fileDirty) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const clickable = target.closest("button, a, [role='menuitem']") as HTMLElement | null;
      if (!clickable) return;
      if (clickable.closest("[data-skill-publish]")) {
        event.preventDefault();
        event.stopPropagation();
        toast.error(UNSAVED_PUBLISH_TOAST);
        return;
      }
      if (clickable.closest("[data-unsaved-safe]")) return;
      if (aiEditOpen) {
        filesTabRef.current?.save({ keepEditing: true, silent: true });
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      pendingReplayRef.current = clickable;
      pendingActionRef.current = null;
      setLeaveOpen(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [aiEditOpen, fileDirty]);

  function persist(next: SkillManualDraft) {
    setDraft(next);
    onSaveManualVersion({
      ...next,
      name: next.name.trim(),
      displayName: next.name.trim(),
    });
  }

  function persistFiles(files: SkillFile[]) {
    persist({ ...draft, files });
  }

  function requestLeave(action: () => void) {
    if (!fileDirty) {
      action();
      return;
    }
    if (aiEditOpen) {
      filesTabRef.current?.save({ keepEditing: true, silent: true });
      action();
      return;
    }
    pendingActionRef.current = action;
    pendingReplayRef.current = null;
    setLeaveOpen(true);
  }

  function resolveLeave(mode: "save" | "discard" | "cancel") {
    if (mode === "cancel") {
      pendingActionRef.current = null;
      pendingReplayRef.current = null;
      setLeaveOpen(false);
      return;
    }
    if (mode === "save") {
      const ok = filesTabRef.current?.save() ?? true;
      if (!ok) return;
    } else {
      filesTabRef.current?.discard();
    }
    setLeaveOpen(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) {
      action();
      return;
    }
    const replay = pendingReplayRef.current;
    pendingReplayRef.current = null;
    if (replay) setPendingReplay(replay);
  }

  function commitName() {
    const nextName = nameDraft.trim();
    const error = getSkillNameError(nextName) || (!nextName ? "请输入技能名称" : "");
    if (error) {
      setNameError(error);
      nameInputRef.current?.focus();
      return;
    }
    setNameError("");
    setMetaField(null);
    if (nextName !== draft.name) {
      persist({ ...draft, name: nextName, displayName: nextName });
    }
  }

  function commitDescription() {
    setMetaField(null);
    if (descriptionDraft !== draft.description) {
      persist({ ...draft, description: descriptionDraft });
    }
  }

  function handleIconFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !canEdit) return;
    if (!isAllowedSkillIcon(file)) {
      toast.error("请上传 PNG、JPG、SVG 或 WebP 图片");
      return;
    }
    if (file.size > SKILL_ICON_MAX_BYTES) {
      toast.error("图片不能超过 2MB");
      return;
    }
    void readSkillIconDataUrl(file)
      .then((iconUrl) => persist({ ...draft, iconUrl }))
      .catch(() => toast.error("图标读取失败，请重试"));
  }

  function openAiEdit(mode: AiEditRoundKind = "modify") {
    filesTabRef.current?.save({ keepEditing: true, silent: true });
    setAiEditMode(mode);
    setAiSessionView("edit");
    setAiEditMounted(true);
    setAiEditOpen(true);
  }

  function closeAiEdit() {
    filesTabRef.current?.save({ keepEditing: false, silent: true });
    setAiEditOpen(false);
    setAiSessionView(null);
  }

  function toggleAiEdit() {
    if (aiEditOpen) {
      if (closeAiPanelRef.current) closeAiPanelRef.current();
      else closeAiEdit();
      return;
    }
    openAiEdit("modify");
  }

  const filesTab = (
    <SkillFilesTab
      ref={filesTabRef}
      files={draft.files}
      canEdit={canEdit && !(aiEditOpen && aiSessionView === "preview")}
      initialEditing={initialEditing}
      fill={Boolean(enableAiEdit)}
      fillTreeWidth={aiEditOpen ? 200 : 220}
      onFilesChange={persistFiles}
      onDirtyChange={setFileDirty}
      onEditingChange={setFileEditing}
      onGuard={requestLeave}
      enableAiEdit={enableAiEdit}
      aiEditOpen={aiEditOpen}
      aiEditMode={aiEditMode}
      aiSessionView={aiEditOpen ? aiSessionView : null}
    />
  );

  return (
    <section
      className={cn(
        enableAiEdit
          ? "flex h-full min-h-0 overflow-hidden"
          : "space-y-5 px-5",
      )}
      data-testid="skillhub-detail-view"
    >
      <div
        className={cn(
          enableAiEdit && "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-5",
        )}
      >
      <div className="shrink-0 border-b border-slate-200 bg-white">
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
            <div className="relative shrink-0" data-unsaved-safe>
              <button
                type="button"
                className="relative block"
                disabled={!canEdit}
                title={canEdit ? "点击更换图标" : undefined}
                onClick={() => iconInputRef.current?.click()}
              >
                <SkillIconPreview src={draft.iconUrl} size="sm" />
                {canEdit ? (
                  <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900/45 text-[10px] font-medium text-white opacity-0 transition-opacity hover:opacity-100">
                    更换
                  </span>
                ) : null}
              </button>
              <input
                ref={iconInputRef}
                type="file"
                accept={SKILL_ICON_ACCEPT}
                className="sr-only"
                onChange={handleIconFileChange}
              />
            </div>
            <div className="min-w-0 flex-1" data-unsaved-safe>
              <div className="flex flex-wrap items-center gap-2">
                {metaField === "name" ? (
                  <div className="min-w-0 flex-1" data-meta-editor="name">
                    <Input
                      ref={nameInputRef}
                      value={nameDraft}
                      maxLength={100}
                      aria-label="技能名称"
                      onChange={(event) => {
                        setNameDraft(event.target.value);
                        setNameError(getSkillNameError(event.target.value));
                      }}
                      onBlur={commitName}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          commitName();
                        }
                        if (event.key === "Escape") {
                          setNameDraft(draft.name);
                          setNameError("");
                          setMetaField(null);
                        }
                      }}
                      className="h-8 max-w-md rounded-[4px] text-sm"
                    />
                    {nameError ? (
                      <p className="mt-1 text-xs text-rose-600">{nameError}</p>
                    ) : null}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="group min-w-0 text-left"
                    disabled={!canEdit}
                    title={canEdit ? "点击编辑名称" : undefined}
                    onClick={() => {
                      setNameDraft(draft.name);
                      setMetaField("name");
                    }}
                  >
                    <h1 className="truncate text-xl font-semibold text-slate-950 group-hover:text-[#2773ff]">
                      {draft.name}
                    </h1>
                  </button>
                )}
                <SkillStatusPill status={releaseStatus} />
                {hasPendingVersion && currentPublishedVersion ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    {skill.status === "reviewing" ? "更新审核中" : "有未发布更新"}
                  </span>
                ) : null}
              </div>
              {metaField === "description" ? (
                <Textarea
                  data-meta-editor="description"
                  ref={descriptionInputRef}
                  value={descriptionDraft}
                  maxLength={500}
                  aria-label="技能描述"
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  onBlur={commitDescription}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setDescriptionDraft(draft.description);
                      setMetaField(null);
                    }
                  }}
                  className="mt-2 min-h-[64px] max-w-xl rounded-[4px] text-sm"
                />
              ) : (
                <button
                  type="button"
                  className="mt-1 block max-w-xl text-left"
                  disabled={!canEdit}
                  title={canEdit ? "点击编辑描述" : undefined}
                  onClick={() => {
                    setDescriptionDraft(draft.description);
                    setMetaField("description");
                  }}
                >
                  <p className="line-clamp-2 text-sm text-slate-500 hover:text-slate-700">
                    {draft.description || (canEdit ? "点击添加描述" : "暂无描述")}
                  </p>
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-11 lg:pl-0">
            {canManage ? (
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-[5px] text-rose-600 hover:text-rose-700"
                onClick={() => {
                  setDeleteConfirmName("");
                  setDeleteOpen(true);
                }}
                disabled={isReviewing}
                title={isReviewing ? "审核中不可删除" : undefined}
              >
                <Trash2 className="h-4 w-4" />
                删除
              </Button>
            ) : null}
            <Button type="button" variant="outline" className="h-9 rounded-[5px]" onClick={onExport}>
              <Download className="h-4 w-4" />
              下载
            </Button>
            {canManage ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-[5px] border-slate-200 text-slate-700"
                      disabled={isReviewing}
                      title={isReviewing ? "审核中不可更新" : undefined}
                    >
                      更新技能
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-lg p-1.5">
                    {enableAiEdit ? null : (
                      <>
                        <DropdownMenuItem
                          className="cursor-pointer rounded-md px-3 py-2.5"
                          onSelect={onOptimize}
                        >
                          <Sparkles className="h-4 w-4 text-blue-500" />
                          <span>
                            <span className="block text-sm font-medium text-slate-900">AI 优化</span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              通过 Claw 对话生成更新
                            </span>
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      className="cursor-pointer rounded-md px-3 py-2.5"
                      onSelect={onImportUpdate}
                    >
                      <FileArchive className="h-4 w-4 text-slate-500" />
                      <span>
                        <span className="block text-sm font-medium text-slate-900">导入更新包</span>
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
                  data-skill-publish
                  onClick={handleSubmitPublishClick}
                  disabled={!canSubmitPublish}
                  title={isReviewing ? "审核中不可重复提交" : undefined}
                >
                  {publishLabel}
                </Button>
              </>
            ) : null}
            {enableAiEdit ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  "rounded-[5px]",
                  aiEditOpen && "border-[#2773ff] bg-[#f0f6fe] text-[#2773ff] hover:bg-[#e7f0fe] hover:text-[#2773ff]",
                )}
                aria-label="编辑技能"
                title="编辑技能"
                aria-pressed={aiEditOpen}
                aria-expanded={aiEditOpen}
                data-unsaved-safe
                onClick={toggleAiEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </header>
      </div>

      <div className={cn(enableAiEdit && "min-h-0 flex-1 overflow-hidden")}>{filesTab}</div>
      </div>
      {enableAiEdit && aiEditMounted ? (
            <div
              className={cn(
                "sdp-ai-edit-pane sdp-ai-edit-pane--detail flex min-h-0 shrink flex-col overflow-hidden border-l border-slate-200",
                !aiEditOpen && "hidden",
              )}
              data-unsaved-safe
            >
              <SkillAiEditSidebar
                open={aiEditOpen}
                variant="inline"
                placement="right"
                skillName={draft.name || skill.name}
                preferredSendMode={aiEditMode}
                defaultComplexity="simple"
                seedTimeline={createdFromConversation ? CREATE_TIMELINE_ITEMS : undefined}
                onCloseComplete={closeAiEdit}
                onBindClose={bindAiClose}
                onRoundPhaseChange={(phase) => {
                  if (phase === "sending") {
                    filesTabRef.current?.save({ keepEditing: false, silent: true });
                    setAiSessionView("preview");
                    return;
                  }
                  filesTabRef.current?.save({ keepEditing: true, silent: true });
                  setAiSessionView("edit");
                }}
                onRequestFileSave={() => {
                  filesTabRef.current?.save({ keepEditing: false, silent: true });
                }}
                onOverwrite={() => {
                  toast.success("已保存");
                }}
                onSaveAs={(_zip, newName) => {
                  toast.success(`已另存为 ${newName}（原型）。发布版本未自动更新。`);
                }}
              />
            </div>
      ) : null}

      <Dialog
        open={leaveOpen}
        onOpenChange={(open) => {
          if (!open) resolveLeave("cancel");
        }}
      >
        <DialogContent className="sm:max-w-[440px]" data-unsaved-safe showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>文件有未保存的编辑</DialogTitle>
            <DialogDescription className="leading-6">
              当前文件有未保存的编辑，是否保存后再离开？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-[5px]"
              onClick={() => resolveLeave("cancel")}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-[5px]"
              onClick={() => resolveLeave("discard")}
            >
              不保存
            </Button>
            <Button
              type="button"
              className="rounded-[5px] bg-[#2773ff] hover:bg-[#1f66f0]"
              onClick={() => resolveLeave("save")}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteConfirmName("");
        }}
      >
        <DialogContent className="z-[200] sm:max-w-[440px]" data-unsaved-safe>
          <DialogHeader>
            <DialogTitle>确认删除技能</DialogTitle>
            <DialogDescription className="leading-6">
              删除后不可恢复。请输入技能名称「{draft.name}」以二次确认。
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmName}
            onChange={(event) => setDeleteConfirmName(event.target.value)}
            placeholder={draft.name}
            aria-label="输入技能名称以确认删除"
            className="h-9 rounded-[5px]"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-[5px]"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirmName("");
              }}
            >
              取消
            </Button>
            <Button
              type="button"
              className="rounded-[5px] bg-rose-600 hover:bg-rose-700"
              disabled={deleteConfirmName.trim() !== draft.name}
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirmName("");
                onDelete();
              }}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
