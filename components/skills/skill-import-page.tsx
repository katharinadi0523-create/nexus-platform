"use client";

import { useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  ChevronLeft,
  Copy,
  LoaderCircle,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const SKILL_IMPORT_TYPE_OPTIONS = [
  { value: "文档创作", label: "文档创作" },
  { value: "办公协同", label: "办公协同" },
  { value: "数据分析", label: "数据分析" },
  { value: "开发工具", label: "开发工具" },
  { value: "企业服务", label: "企业服务" },
  { value: "效率工具", label: "效率工具" },
  { value: "通讯协作", label: "通讯协作" },
  { value: "安全合规", label: "安全合规" },
] as const;

export type SkillImportPublishScope = "public" | "org";
export type SkillImportValidationStatus = "idle" | "validating" | "valid" | "invalid";

export interface SkillImportDependencyOption {
  id: string;
  name: string;
  type: string;
}

interface SkillImportPageProps {
  name: string;
  onNameChange: (value: string) => void;
  nameError?: string;
  description: string;
  onDescriptionChange: (value: string) => void;
  usageInstructions: string;
  onUsageInstructionsChange: (value: string) => void;
  fileName?: string;
  parsedName?: string;
  parsedDescription?: string;
  validationStatus: SkillImportValidationStatus;
  validationError?: string;
  onPickFile: () => void;
  onDropFile: (file: File) => void;
  onClearFile: () => void;
  selectedDependencies: SkillImportDependencyOption[];
  filteredDependencies: SkillImportDependencyOption[];
  selectedDependencyIds: string[];
  onToggleDependency: (id: string) => void;
  dependencySearch: string;
  onDependencySearchChange: (value: string) => void;
  publishScope: SkillImportPublishScope;
  onPublishScopeChange: (value: SkillImportPublishScope) => void;
  skillTypes: string[];
  onToggleSkillType: (value: string) => void;
  releaseNotes: string;
  onReleaseNotesChange: (value: string) => void;
  canSubmit: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

function Counter({ current, max }: { current: number; max: number }) {
  return (
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94a3b8]">
      {current}/{max}
    </span>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mb-4 text-base font-semibold leading-6 text-[#000]">{children}</h2>
  );
}

function ZipGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect width="20" height="20" rx="4" fill="#22c55e" />
      <path d="M10.8 3.2 6.4 10.4h3.1L8.2 16.8l5.5-8.1H10.7L10.8 3.2Z" fill="#fff" />
    </svg>
  );
}

function CopyButton({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={copied ? `${label}已复制` : `复制${label}`}
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[#94a3b8] transition-colors hover:text-[#64748b]"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[#22c55e]" strokeWidth={2.5} /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function FieldLabel({
  htmlFor,
  required,
  children,
  hint,
}: {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center gap-1">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-[#1e293b]">
        {required ? <span className="mr-1 text-[#e5484d]">*</span> : null}
        {children}
      </Label>
      {hint}
    </div>
  );
}

export function SkillImportPage({
  name,
  onNameChange,
  nameError,
  description,
  onDescriptionChange,
  usageInstructions,
  onUsageInstructionsChange,
  fileName,
  parsedName,
  parsedDescription,
  validationStatus,
  validationError,
  onPickFile,
  onDropFile,
  onClearFile,
  selectedDependencies,
  filteredDependencies,
  selectedDependencyIds,
  onToggleDependency,
  dependencySearch,
  onDependencySearchChange,
  publishScope,
  onPublishScopeChange,
  skillTypes,
  onToggleSkillType,
  releaseNotes,
  onReleaseNotesChange,
  canSubmit,
  onSubmit,
  onCancel,
}: SkillImportPageProps) {
  const [dragOver, setDragOver] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [dependencyOpen, setDependencyOpen] = useState(false);
  const parsed = validationStatus === "valid";

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-white"
      data-testid="skill-import-page"
    >
      <header className="shrink-0 px-1 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            aria-label="返回技能管理"
            className="inline-flex h-8 w-8 items-center justify-center rounded text-[#334155] transition-colors hover:bg-slate-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold leading-[30px] text-[#0f172a]">创建技能</h1>
        </div>
        <div className="mt-4 h-px w-full bg-[#e2e8f0]" />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4 pr-2">
        <div className="max-w-[760px] space-y-8">
          <section>
            <SectionTitle>技能导入</SectionTitle>
            {parsed || (fileName && validationStatus !== "idle") ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <span className="mt-2 w-28 shrink-0 text-sm text-[#1e293b]">
                  <span className="mr-1 text-[#e5484d]">*</span>
                  上传压缩包
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-[4px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                      <ZipGlyph />
                      <span className="min-w-0 flex-1 truncate text-xs text-[#1e293b]">
                        {fileName}
                      </span>
                      {validationStatus === "validating" ? (
                        <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-[#2773ff]" />
                      ) : parsed ? (
                        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#22c55e]">
                          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={onClearFile}
                      aria-label="删除压缩包"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#94a3b8] transition-colors hover:bg-slate-50 hover:text-[#64748b]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {validationStatus === "invalid" && validationError ? (
                    <p className="mt-1 text-xs leading-[18px] text-[#e5484d]">{validationError}</p>
                  ) : null}
                  {parsed ? (
                    <div className="mt-2 rounded-[8px] bg-[#f4f6f8] px-3 py-2.5 text-xs leading-5 text-[#334155]">
                      <div className="flex items-center gap-1.5">
                        <span className="min-w-0 break-all">
                          <span className="text-[#64748b]">Name: </span>
                          {parsedName || "—"}
                        </span>
                        <CopyButton value={parsedName || ""} label="名称" />
                      </div>
                      <div className="relative mt-1.5 pr-5">
                        <span className="whitespace-pre-wrap break-words">
                          <span className="text-[#64748b]">Description: </span>
                          {parsedDescription || "—"}
                        </span>
                        <span className="absolute right-0 top-0">
                          <CopyButton value={parsedDescription || ""} label="描述" />
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div>
                <FieldLabel required>上传压缩包</FieldLabel>
                <button
                  type="button"
                  onClick={onPickFile}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragOver(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragOver(false);
                    const file = event.dataTransfer.files?.[0];
                    if (file) onDropFile(file);
                  }}
                  className={cn(
                    "flex w-full flex-col items-center justify-center rounded-[4px] border border-dashed px-6 py-8 text-center transition-colors",
                    dragOver
                      ? "border-[#2773ff] bg-[#f0f6fe]"
                      : "border-[#cbd5e1] bg-[#f8fafc] hover:border-[#2773ff]"
                  )}
                >
                  <Upload className="h-8 w-8 text-[#2773ff]" />
                  <div className="mt-3 text-sm font-medium text-[#1e293b]">
                    点击选择或拖拽zip压缩包到此处
                  </div>
                  <div className="mt-1 text-xs text-[#7f8c9f]">支持 .zip 格式，不超过 100MB</div>
                </button>
                <p className="mt-1 text-xs leading-[18px] text-[#7f8c9f]">
                  根目录下必须包含 SKILL.md，需包含 Skill 名称及描述，YAML 格式
                </p>
              </div>
            )}
          </section>

          {parsed ? (
            <>
          <section className="animate-in fade-in slide-in-from-top-2 duration-300">
            <SectionTitle>基本信息</SectionTitle>
            <div className="space-y-5">
              <div>
                <FieldLabel htmlFor="import-skill-name" required>
                  技能名称
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="import-skill-name"
                    value={name}
                    maxLength={100}
                    onChange={(event) => onNameChange(event.target.value)}
                    placeholder="请输入技能名称"
                    aria-invalid={Boolean(nameError)}
                    className="h-8 rounded-[4px] border-[#cbd5e1] pr-16 text-xs shadow-none focus-visible:border-[#2773ff] focus-visible:ring-0"
                  />
                  <Counter current={name.length} max={100} />
                </div>
                <p className={cn("mt-1 text-xs leading-[18px]", nameError ? "text-[#e5484d]" : "text-[#7f8c9f]")}>
                  {nameError ||
                    "支持字母、中文、数字、下划线 (_)、中划线 (-)、点 (.)，以字母或中文开头，不可与已有名称重复"}
                </p>
              </div>

              <div>
                <FieldLabel htmlFor="import-skill-description">技能描述</FieldLabel>
                <div className="relative">
                  <Textarea
                    id="import-skill-description"
                    value={description}
                    maxLength={500}
                    onChange={(event) => onDescriptionChange(event.target.value)}
                    placeholder="请输入技能描述"
                    className="min-h-[88px] rounded-[4px] border-[#cbd5e1] pb-6 text-xs shadow-none focus-visible:border-[#2773ff] focus-visible:ring-0"
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-[#94a3b8]">
                    {description.length}/500
                  </span>
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="import-skill-usage">使用说明</FieldLabel>
                <div className="relative">
                  <Textarea
                    id="import-skill-usage"
                    value={usageInstructions}
                    maxLength={1000}
                    onChange={(event) => onUsageInstructionsChange(event.target.value)}
                    placeholder="请输入技能使用说明，建议填写该技能的用户输入要求、核心处理能力及预期输出结果"
                    className="min-h-[120px] rounded-[4px] border-[#cbd5e1] pb-6 text-xs shadow-none focus-visible:border-[#2773ff] focus-visible:ring-0"
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-[#94a3b8]">
                    {usageInstructions.length}/1000
                  </span>
                </div>
              </div>

              <div>
                <FieldLabel>技能图标</FieldLabel>
                <div className="flex h-16 w-16 items-center justify-center rounded-[6px] bg-[#14b8a6] text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
                  <BookOpen className="h-8 w-8" strokeWidth={1.75} />
                </div>
              </div>
            </div>
          </section>

          <section className="animate-in fade-in slide-in-from-top-2 duration-300">
            <SectionTitle>关联配置</SectionTitle>
            <div>
              <FieldLabel
                hint={
                  <TooltipProvider delayDuration={120}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex text-[#94a3b8] hover:text-[#64748b]"
                          aria-label="依赖组件说明"
                        >
                          <CircleHelp className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[280px] text-xs leading-5">
                        声明技能运行时依赖的 MCP 或插件工具，便于在技能卡片上提示依赖信息。
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                }
              >
                依赖组件
              </FieldLabel>
              <Popover open={dependencyOpen} onOpenChange={setDependencyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-[4px] border-[#2773ff] bg-white px-3 text-xs font-medium text-[#2773ff] shadow-none hover:bg-[#f0f6fe]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    选择组件
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[360px] rounded-[8px] p-3">
                  <Input
                    value={dependencySearch}
                    onChange={(event) => onDependencySearchChange(event.target.value)}
                    placeholder="搜索 MCP 或插件"
                    className="mb-2 h-8 rounded-[4px] border-[#cbd5e1] text-xs shadow-none"
                  />
                  <div className="max-h-[240px] space-y-1 overflow-y-auto">
                    {filteredDependencies.map((item) => {
                      const checked = selectedDependencyIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onToggleDependency(item.id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs hover:bg-slate-50",
                            checked && "bg-[#f0f6fe]"
                          )}
                        >
                          <Checkbox checked={checked} className="pointer-events-none" />
                          <span className="min-w-0 flex-1 truncate text-[#1e293b]">{item.name}</span>
                          <span className="text-[#7f8c9f]">{item.type === "mcp" ? "MCP" : "插件"}</span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedDependencies.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedDependencies.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 rounded-[4px] bg-[#eef6ff] px-2 py-0.5 text-xs text-[#2773ff]"
                    >
                      {item.name}
                      <button type="button" onClick={() => onToggleDependency(item.id)} aria-label={`移除 ${item.name}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="mt-1 text-xs leading-[18px] text-[#7f8c9f]">
                请选择该技能执行过程中依赖的 MCP 或插件工具
              </p>
            </div>
          </section>

          <section className="animate-in fade-in slide-in-from-top-2 duration-300">
            <SectionTitle>更新版本信息</SectionTitle>
            <div className="space-y-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="w-28 shrink-0 text-sm text-[#1e293b]">发布范围</span>
                <RadioGroup
                  value={publishScope}
                  onValueChange={(value) => onPublishScopeChange(value as SkillImportPublishScope)}
                  className="grid-flow-col auto-cols-max gap-6"
                >
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#1e293b]">
                    <RadioGroupItem value="org" className="border-[#cbd5e1] text-[#2773ff]" />
                    组织发布
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#1e293b]">
                    <RadioGroupItem value="public" className="border-[#cbd5e1] text-[#2773ff]" />
                    公开发布
                  </label>
                </RadioGroup>
              </div>

              <div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <span className="mt-1.5 w-28 shrink-0 text-sm text-[#1e293b]">
                    <span className="mr-1 text-[#e5484d]">*</span>
                    技能类型
                  </span>
                  <div className="min-w-0 flex-1">
                    <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex min-h-8 w-full items-center justify-between rounded-[4px] border border-[#cbd5e1] bg-white px-2 py-1 text-left text-xs hover:border-[#2773ff]"
                        >
                          <span className="flex min-w-0 flex-1 flex-wrap gap-1">
                            {skillTypes.length === 0 ? (
                              <span className="px-1 text-[#94a3b8]">请选择技能类型</span>
                            ) : (
                              skillTypes.map((type) => (
                                <span
                                  key={type}
                                  className="inline-flex items-center gap-1 rounded-[2px] bg-[#eef6ff] px-1.5 py-0.5 text-[#2773ff]"
                                >
                                  {type}
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      onToggleSkillType(type);
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        onToggleSkillType(type);
                                      }
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </span>
                                </span>
                              ))
                            )}
                          </span>
                          <ChevronDown className="h-4 w-4 shrink-0 text-[#94a3b8]" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] rounded-[8px] p-1">
                        {SKILL_IMPORT_TYPE_OPTIONS.map((option) => {
                          const checked = skillTypes.includes(option.value);
                          const disabled = !checked && skillTypes.length >= 2;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              disabled={disabled}
                              onClick={() => onToggleSkillType(option.value)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs",
                                disabled ? "cursor-not-allowed text-[#cbd5e1]" : "hover:bg-slate-50",
                                checked && "bg-[#f0f6fe] text-[#2773ff]"
                              )}
                            >
                              <Checkbox checked={checked} className="pointer-events-none" />
                              {option.label}
                            </button>
                          );
                        })}
                      </PopoverContent>
                    </Popover>
                    <p className="mt-1 text-xs leading-[18px] text-[#7f8c9f]">最多选择两个类型</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <span className="mt-1.5 w-28 shrink-0 text-sm text-[#1e293b]">
                  <span className="mr-1 text-[#e5484d]">*</span>
                  更新说明
                </span>
                <div className="relative min-w-0 flex-1">
                  <Textarea
                    value={releaseNotes}
                    maxLength={1000}
                    onChange={(event) => onReleaseNotesChange(event.target.value)}
                    placeholder="请输入更新说明"
                    className="min-h-[120px] rounded-[4px] border-[#cbd5e1] pb-6 text-xs shadow-none focus-visible:border-[#2773ff] focus-visible:ring-0"
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-[#94a3b8]">
                    {releaseNotes.length}/1000
                  </span>
                </div>
              </div>
            </div>
          </section>
            </>
          ) : null}
        </div>
      </div>

      <footer className="flex shrink-0 items-center gap-3 border-t border-[#e2e8f0] bg-white px-1 py-4">
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="h-9 min-w-[80px] rounded-[4px] bg-[#2773ff] px-[19px] text-sm font-semibold text-white shadow-none hover:bg-[#1f66f0] disabled:bg-[#cbd5e1] disabled:text-white"
        >
          确定
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-9 min-w-[80px] rounded-[4px] border-[#2773ff] bg-white px-[19px] text-sm font-semibold text-[#2773ff] shadow-none hover:bg-[#f0f6fe]"
        >
          取消
        </Button>
      </footer>
    </div>
  );
}
