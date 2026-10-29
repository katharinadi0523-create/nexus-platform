"use client";

import { useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  FolderOpen,
  Info,
  Mic,
  Plus,
  Search,
  Square,
  Upload,
  X,
} from "lucide-react";
import { ModelSelector } from "@/components/agent-editor/ModelSelector";
import {
  detectSkillSlashCommand,
  filterConfiguredSkills,
  SkillSlashPicker,
  type ConfiguredSkillOption,
} from "@/components/claw-hub-next/skill-slash-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import type { ClawDetailData } from "@/lib/mock/claw-hub-next";
import { usePersonalChatContext } from "@/components/claw-client/personal-chat-context";
import { CLAW_CLIENT_WORKSPACE_ROOT } from "@/components/claw-client/personal-workspace-data";
import { useChatModelPreference } from "@/components/my-claw/chat/use-chat-model-preference";
import { cn } from "@/lib/utils";

type DebugChatComposerProps = {
  detail: ClawDetailData;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** Optional controls after the add menu (e.g. agent dropdown). */
  footerLeadingExtra?: ReactNode;
  /** The personal conversation whose model selection should be restored. */
  modelScopeKey?: string;
  /** Enables personal-only model, upload, skill, and workspace controls. */
  personalMode?: boolean;
  onOpenWorkspace?: () => void;
  isBusy?: boolean;
  onInterrupt?: () => void;
  queueHint?: string;
  modelFallbackDemo?: boolean;
};

type ComposerAttachment = {
  id: string;
  name: string;
  source: "upload" | "workspace";
  path?: string;
  sizeLabel?: string;
  file?: File;
};

type FlatWorkspaceFile = {
  id: string;
  name: string;
  path: string;
  sizeLabel: string;
  updatedAt?: string;
};

// Static demo state: this model remains in the catalog but its service is unavailable.
const DEMO_UNAVAILABLE_MODEL_IDS = ["Qwen3-8B"] as const;

function flattenWorkspaceFiles(folder: typeof CLAW_CLIENT_WORKSPACE_ROOT, parentPath = ""): FlatWorkspaceFile[] {
  return folder.children.flatMap((entry) => {
    const path = parentPath ? `${parentPath} / ${entry.name}` : entry.name;
    if (entry.kind === "folder") return flattenWorkspaceFiles(entry, path);
    return [{ id: entry.id, name: entry.name, path, sizeLabel: entry.sizeLabel, updatedAt: entry.updatedAt }];
  });
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function DebugChatComposer({
  detail,
  value,
  onChange,
  onSend,
  footerLeadingExtra,
  modelScopeKey = "new",
  personalMode = false,
  onOpenWorkspace,
  isBusy = false,
  onInterrupt,
  queueHint,
  modelFallbackDemo = false,
}: DebugChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [skillMenuOpen, setSkillMenuOpen] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [slashPicker, setSlashPicker] = useState<{ query: string; startIndex: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [showModelFallbackNotice, setShowModelFallbackNotice] = useState(modelFallbackDemo);
  const personalChat = usePersonalChatContext();
  const { model, params, ready, selectModel, updateParams } =
    useChatModelPreference(modelScopeKey);
  const handleModelChange = (nextModel: string) => {
    selectModel(nextModel);
    setShowModelFallbackNotice(false);
  };
  // This Demo has no runtime token-usage feed yet; use an illustrative value for existing sessions.
  const contextLimitTokens = 176_000;
  const contextUsedTokens = modelScopeKey === "new" || modelScopeKey === "model-fallback-demo" ? 0 : 116_000;
  const contextUsagePercent = Math.round((contextUsedTokens / contextLimitTokens) * 1000) / 10;
  const contextUsageLabel = `已使用上下文 ${contextUsagePercent}% · ${(contextUsedTokens / 1000).toFixed(1)}K / ${(contextLimitTokens / 1000).toFixed(1)}K`;

  const configuredSkills = useMemo<ConfiguredSkillOption[]>(() => {
    const scopes = ["platform", "tenant", "claw"] as const;
    return scopes.flatMap((scope) =>
      detail.capabilityConfig.skills[scope]
        .filter((skill) => skill.enabled)
        .map((skill) => ({ ...skill, scope }))
    );
  }, [detail.capabilityConfig.skills]);
  const filteredSlashSkills = slashPicker
    ? filterConfiguredSkills(configuredSkills, slashPicker.query)
    : [];
  const filteredMenuSkills = filterConfiguredSkills(configuredSkills, skillQuery);
  const visibleAttachments = personalMode
    ? personalChat?.attachments ?? []
    : attachments;
  function syncSlashPicker(text: string, cursor: number) {
    setSlashPicker(detectSkillSlashCommand(text, cursor));
    setActiveIndex(0);
  }

  function selectSkill(skill: ConfiguredSkillOption, fromSlash: boolean) {
    setSelectedSkill(skill.name);
    setAddMenuOpen(false);
    setSkillMenuOpen(false);

    if (fromSlash && slashPicker) {
      const cursor = textareaRef.current?.selectionStart ?? value.length;
      const insertion = `/${skill.name} `;
      const nextValue = `${value.slice(0, slashPicker.startIndex)}${insertion}${value.slice(cursor)}`;
      onChange(nextValue);
      const nextCursor = slashPicker.startIndex + insertion.length;
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
      });
    }

    setSlashPicker(null);
  }

  function addAttachments(items: ComposerAttachment[]) {
    if (personalMode && personalChat) {
      personalChat.addAttachments(items);
      return;
    }
    setAttachments((current) => {
      const currentIds = new Set(current.map((item) => item.id));
      return [...current, ...items.filter((item) => !currentIds.has(item.id))];
    });
  }

  function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    addAttachments(
      Array.from(files).map((file) => ({
        id: `upload:${file.name}:${file.size}:${file.lastModified}`,
        name: file.name,
        source: "upload",
        sizeLabel: formatFileSize(file.size),
        file,
      }))
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
    setAddMenuOpen(false);
  }

  function referenceWorkspaceFile(file: FlatWorkspaceFile) {
    personalChat?.addAttachments([{
      id: `workspace:${file.id}`,
      name: file.name,
      source: "workspace",
      path: file.path,
      sizeLabel: file.sizeLabel,
    }]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDropTarget(false);
    const workspacePayload = event.dataTransfer.getData("application/x-claw-workspace-file");
    if (workspacePayload) {
      try {
        const file = JSON.parse(workspacePayload) as FlatWorkspaceFile;
        referenceWorkspaceFile(file);
      } catch {
        // Ignore malformed drag payloads and keep the composer usable.
      }
      return;
    }
    handleUpload(event.dataTransfer.files);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (slashPicker && filteredSlashSkills.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, filteredSlashSkills.length - 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        selectSkill(filteredSlashSkills[activeIndex]!, true);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setSlashPicker(null);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (value.trim() || visibleAttachments.length > 0) handleSend();
    }
  }

  function handleSend() {
    if (!value.trim() && visibleAttachments.length === 0) return;
    onSend();
    setAttachments([]);
    personalChat?.clearAttachments();
    setSelectedSkill("");
  }

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-white px-4 pb-3 pt-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors focus-within:border-blue-300",
        isDropTarget ? "border-blue-500 bg-blue-50/40" : "border-slate-300"
      )}
      onDragEnter={personalMode ? (event) => {
        event.preventDefault();
        setIsDropTarget(true);
      } : undefined}
      onDragOver={personalMode ? (event) => event.preventDefault() : undefined}
      onDragLeave={personalMode ? (event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDropTarget(false);
        }
      } : undefined}
      onDrop={personalMode ? handleDrop : undefined}
    >
      {slashPicker ? (
        <div className="absolute bottom-full left-0 right-0 z-30 mb-2">
          <SkillSlashPicker
            skills={configuredSkills}
            query={slashPicker.query}
            activeIndex={activeIndex}
            onActiveIndexChange={setActiveIndex}
            onSelect={(skill) => selectSkill(skill, true)}
          />
        </div>
      ) : null}

      {personalMode ? (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => handleUpload(event.currentTarget.files)}
        />
      ) : null}

      {personalMode && visibleAttachments.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {visibleAttachments.map((item) => (
            <span
              key={item.id}
              title={item.path ? `${item.path} · 已引用` : "已添加到本轮对话"}
              className={cn(
                "inline-flex max-w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-xs",
                item.source === "workspace"
                  ? "border-violet-100 bg-violet-50/70 text-violet-800"
                  : "border-blue-100 bg-blue-50/70 text-slate-700"
              )}
            >
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white", item.source === "workspace" ? "text-violet-600" : "text-blue-600")}>
                <FileText className="h-4 w-4" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="max-w-[220px] truncate font-medium">{item.name}</span>
                <span className="mt-0.5 text-[10px] text-slate-500">{item.name.split(".").pop()?.toUpperCase() ?? "FILE"}{item.sizeLabel ? ` · ${item.sizeLabel}` : ""}</span>
              </span>
              <button
                type="button"
                aria-label={`移除${item.name}`}
                onClick={() => personalChat?.removeAttachment(item.id)}
                className="rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {personalMode && selectedSkill ? (
        <div className="mb-2 flex">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            <BookOpen className="h-3.5 w-3.5" />
            技能 · {selectedSkill}
            <button type="button" aria-label="取消选择技能" onClick={() => setSelectedSkill("")} className="text-slate-400 hover:text-slate-700">
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      ) : null}

      <div className="relative">
        {personalMode && showModelFallbackNotice ? (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-slate-700">
            <span className="min-w-0 flex-1">你选择的模型当前不可用，已切换至 {model}。</span>
            <button
              type="button"
              onClick={() => setModelPickerOpen(true)}
              className="shrink-0 font-medium text-blue-700 hover:text-blue-800"
            >
              更换模型
            </button>
            <button
              type="button"
              aria-label="关闭模型切换提示"
              onClick={() => setShowModelFallbackNotice(false)}
              className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-amber-100 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
        {queueHint ? <p className="mb-1 text-[11px] leading-4 text-slate-400">{queueHint}</p> : null}
        {isDropTarget ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-md border border-dashed border-blue-400 bg-blue-50/80 text-sm font-medium text-blue-700">
            松开以添加文件或引用工作空间文件
          </div>
        ) : null}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            syncSlashPicker(event.target.value, event.target.selectionStart ?? event.target.value.length);
          }}
          onClick={(event) => syncSlashPicker(event.currentTarget.value, event.currentTarget.selectionStart ?? event.currentTarget.value.length)}
          onKeyDown={handleKeyDown}
          placeholder="有问题，尽管提。输入 / 可选择技能"
          className="min-h-[76px] resize-none border-0 bg-transparent px-0 py-0 text-[15px] leading-7 shadow-none placeholder:text-slate-400 focus-visible:ring-0"
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {personalMode ? (
          <Popover open={addMenuOpen} onOpenChange={setAddMenuOpen}>
            <PopoverTrigger asChild>
              <button type="button" aria-label="添加文件或技能" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
                <Plus className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" sideOffset={8} className="w-[340px] p-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                <Upload className="h-4 w-4 text-blue-600" />上传文件
              </button>
              <button
                type="button"
                title="打开右侧工作空间，选择或拖拽文件到输入框"
                onClick={() => {
                  setAddMenuOpen(false);
                  onOpenWorkspace?.();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <FolderOpen className="h-4 w-4 text-blue-600" />
                <span className="flex-1">从工作空间引用</span>
              </button>
              <div className="my-1 border-t border-slate-100" />
              <div className="px-3 pb-2 pt-2 text-xs font-medium text-slate-600">技能</div>
              <label className="mx-2 flex h-9 items-center gap-2 rounded-md border border-slate-200 px-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input value={skillQuery} onChange={(event) => setSkillQuery(event.target.value)} placeholder="搜索技能名称" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400" />
                {skillQuery ? <button type="button" aria-label="清除搜索" onClick={() => setSkillQuery("")} className="text-slate-400 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button> : null}
              </label>
              <TooltipProvider delayDuration={150}>
                <div className="mt-1 max-h-56 overflow-y-auto p-1">
                  {filteredMenuSkills.length > 0 ? filteredMenuSkills.map((skill) => (
                    <div key={`${skill.scope}:${skill.id}`} className="flex items-center gap-2 rounded-md pr-1 hover:bg-slate-50">
                      <button type="button" onClick={() => selectSkill(skill, false)} className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-slate-700">
                        <span className="min-w-0 flex-1 truncate">{skill.name}</span>
                        <span className="shrink-0 text-[10px] text-slate-400">{skill.scope === "claw" ? "个人" : skill.scope === "tenant" ? "组织" : "平台"}</span>
                        {selectedSkill === skill.name ? <Check className="h-3.5 w-3.5 text-blue-600" /> : null}
                      </button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" aria-label={`查看${skill.name}说明`} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-white hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8} className="max-w-[280px] whitespace-normal text-xs leading-5">
                          {skill.description?.trim() || "暂无技能说明"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )) : <p className="px-3 py-7 text-center text-xs text-slate-400">{configuredSkills.length ? "没有匹配的技能" : "暂无可用技能"}</p>}
                </div>
              </TooltipProvider>
            </PopoverContent>
          </Popover>
        ) : (
          <Popover open={skillMenuOpen} onOpenChange={setSkillMenuOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="inline-flex h-9 max-w-[260px] items-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <BookOpen className="h-4 w-4" />
                <span className="truncate">{selectedSkill ? `技能 · ${selectedSkill}` : "技能"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" sideOffset={8} className="w-[420px] border-0 bg-transparent p-0 shadow-none">
              <SkillSlashPicker skills={configuredSkills} query="" activeIndex={0} onActiveIndexChange={() => undefined} onSelect={(skill) => selectSkill(skill, false)} />
            </PopoverContent>
          </Popover>
        )}

        {footerLeadingExtra}

        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-1.5">
          {personalMode ? (
            <>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`当前会话上下文用量：${contextUsageLabel}`}
                      className="inline-flex h-9 w-7 shrink-0 items-center justify-center bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[18px] w-[18px]">
                        <circle cx="10" cy="10" r="7.5" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                        <circle
                          cx="10"
                          cy="10"
                          r="7.5"
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray={`${(2 * Math.PI * 7.5 * contextUsagePercent) / 100} ${2 * Math.PI * 7.5}`}
                          transform="rotate(-90 10 10)"
                        />
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-md">
                    {contextUsageLabel}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <ModelSelector
                open={modelPickerOpen}
                onOpenChange={setModelPickerOpen}
                selectedModel={model}
                modelParams={params}
                onModelChange={handleModelChange}
                onParamsChange={updateParams}
                unavailableModelIds={DEMO_UNAVAILABLE_MODEL_IDS}
                presetOnly
                separateParamsPopover
                hiddenParamKeys={["context_turns", "sp_anti_leak"]}
                triggerClassName="h-9 max-w-[200px] rounded-full border border-slate-300 bg-white px-3 text-xs hover:bg-slate-50"
              />
            </>
          ) : null}

          {!personalMode ? <button type="button" title="上传附件" className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-50"><FileText className="h-4 w-4" /></button> : null}
          <button type="button" title="语音输入" className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-50"><Mic className="h-4 w-4" /></button>
          <span className="mx-1 h-6 w-px bg-slate-200" />
          {isBusy ? (
            <button
              type="button"
              onClick={onInterrupt}
              aria-label="中断当前响应"
              title="中断当前响应"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button type="button" onClick={personalMode ? handleSend : onSend} disabled={personalMode ? ((!value.trim() && visibleAttachments.length === 0) || !ready) : !value.trim()} aria-label="发送" className={cn("flex h-9 w-9 items-center justify-center rounded-md text-white", personalMode ? ((value.trim() || visibleAttachments.length > 0) && ready ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300") : (value.trim() ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300"))}><ArrowUp className="h-4 w-4" /></button>
          )}
        </div>
      </div>
    </div>
  );
}
