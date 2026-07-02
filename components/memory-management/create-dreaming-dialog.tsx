"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  DreamingAgentSessionGroup,
  DreamingInputRef,
  DreamingModelTier,
  MemoryStore,
} from "@/lib/mock/memory-management";
import { dreamingAgentSessionGroups } from "@/lib/mock/memory-management";
import { cn } from "@/lib/utils";

export interface CreateDreamingJobValue {
  storeId: string;
  inputRefs: DreamingInputRef[];
  session?: AgentSessionSelection;
  prompt: string;
  modelTier: DreamingModelTier;
}

export interface AgentSessionSelection {
  agentId: string;
  agentName: string;
  sessionId: string;
  sessionTitle: string;
}

function AgentSessionCascader({
  groups,
  value,
  onChange,
  className,
}: {
  groups: DreamingAgentSessionGroup[];
  value: AgentSessionSelection | null;
  onChange: (value: AgentSessionSelection) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState(groups[0]?.agentId ?? "");

  const activeGroup = useMemo(
    () => groups.find((group) => group.agentId === activeAgentId) ?? groups[0],
    [activeAgentId, groups]
  );

  const displayText = value
    ? `${value.agentName} / ${value.sessionTitle}`
    : "请选择智能体与会话";

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setActiveAgentId(value?.agentId ?? groups[0]?.agentId ?? "");
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            className
          )}
        >
          <span className={cn("truncate text-left", !value && "text-muted-foreground")}>
            {displayText}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex max-h-72">
          <div className="w-44 shrink-0 overflow-y-auto border-r border-slate-200 py-1">
            {groups.map((group) => (
              <button
                key={group.agentId}
                type="button"
                onMouseEnter={() => setActiveAgentId(group.agentId)}
                onFocus={() => setActiveAgentId(group.agentId)}
                onClick={() => setActiveAgentId(group.agentId)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50",
                  activeGroup?.agentId === group.agentId && "bg-slate-50 text-blue-600"
                )}
              >
                <span className="truncate">{group.agentName}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
          <div className="w-60 overflow-y-auto py-1">
            {activeGroup?.sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => {
                  onChange({
                    agentId: activeGroup.agentId,
                    agentName: activeGroup.agentName,
                    sessionId: session.id,
                    sessionTitle: session.title,
                  });
                  setOpen(false);
                }}
                className={cn(
                  "block w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
                  value?.sessionId === session.id && "bg-blue-50 text-blue-600"
                )}
              >
                <div className="truncate font-medium">{session.title}</div>
                <div className="text-xs text-slate-500">{session.updatedAt}</div>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function CreateDreamingJobDialog({
  open,
  onOpenChange,
  stores,
  initialStoreId,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: MemoryStore[];
  initialStoreId?: string;
  onSubmit: (value: CreateDreamingJobValue) => void;
}) {
  const [storeId, setStoreId] = useState(initialStoreId ?? stores[0]?.id ?? "");
  const [useStoreContent, setUseStoreContent] = useState(true);
  const [useSessionInput, setUseSessionInput] = useState(false);
  const [sessionSelection, setSessionSelection] = useState<AgentSessionSelection | null>(null);
  const [prompt, setPrompt] = useState("");
  const [modelTier, setModelTier] = useState<DreamingModelTier>("standard");
  const [storeError, setStoreError] = useState("");
  const [inputError, setInputError] = useState("");
  const [sessionError, setSessionError] = useState("");

  function resetForm() {
    setStoreId(initialStoreId ?? stores[0]?.id ?? "");
    setUseStoreContent(true);
    setUseSessionInput(false);
    setSessionSelection(null);
    setPrompt("");
    setModelTier("standard");
    setStoreError("");
    setInputError("");
    setSessionError("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit() {
    let hasError = false;
    if (!storeId) {
      setStoreError("请选择目标记忆库。");
      hasError = true;
    }
    if (!useStoreContent && !useSessionInput) {
      setInputError("请至少选择一种输入：库当前内容或原始会话。");
      hasError = true;
    }
    if (useSessionInput && !sessionSelection) {
      setSessionError("请选择会话输入。");
      hasError = true;
    }
    if (hasError) {
      return;
    }
    const inputRefs: DreamingInputRef[] = [];
    if (useStoreContent) inputRefs.push("store_content");
    if (useSessionInput) inputRefs.push("session");
    onSubmit({
      storeId,
      inputRefs,
      session: useSessionInput ? sessionSelection ?? undefined : undefined,
      prompt: prompt.trim(),
      modelTier,
    });
    resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-[8px] sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>新建记忆沉淀</DialogTitle>
          <DialogDescription>
            记忆沉淀（Dreaming）读取所选输入与旧版本，重新合成 vNext 草稿；发布前不会改变当前记忆库。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>目标记忆库</Label>
            <Select
              value={storeId}
              onValueChange={(value) => {
                setStoreId(value);
                setStoreError("");
              }}
              placeholder="请选择记忆库"
              options={stores.map((store) => ({ value: store.id, label: store.name }))}
              className="rounded-[4px] border-slate-300 bg-white shadow-none"
            />
            {storeError ? <p className="text-xs text-rose-600">{storeError}</p> : null}
            <p className="text-xs text-slate-500">本次记忆沉淀 vNext 草稿写入该记忆库的新版本，旧版本保留可回滚。</p>
          </div>

          <div className="space-y-2">
            <Label>输入材料（两选其一或组合）</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={useStoreContent}
                onClick={() => {
                  setUseStoreContent((current) => !current);
                  setInputError("");
                }}
                className={cn(
                  "rounded-[4px] border px-3 py-2.5 text-left text-sm transition-colors",
                  useStoreContent
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                <span className="font-medium">库当前内容</span>
                <span className="mt-1 block text-xs text-slate-500">读取已写入的主题文件，质量高、更轻。</span>
              </button>
              <button
                type="button"
                aria-pressed={useSessionInput}
                onClick={() => {
                  setUseSessionInput((current) => !current);
                  setInputError("");
                  setSessionError("");
                }}
                className={cn(
                  "rounded-[4px] border px-3 py-2.5 text-left text-sm transition-colors",
                  useSessionInput
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                <span className="font-medium">原始会话</span>
                <span className="mt-1 block text-xs text-slate-500">信息更全，适合复杂资产全量重整。</span>
              </button>
            </div>
            {inputError ? <p className="text-xs text-rose-600">{inputError}</p> : null}
            <p className="text-xs text-slate-500">机制是「重合成」，读取输入与旧版本重新合成主题文件，不搬运历史 Diff。</p>
          </div>

          {useSessionInput ? (
            <div className="space-y-2">
              <Label>输入会话</Label>
              <AgentSessionCascader
                groups={dreamingAgentSessionGroups}
                value={sessionSelection}
                onChange={(value) => {
                  setSessionSelection(value);
                  setSessionError("");
                }}
                className="rounded-[4px] border-slate-300 bg-white shadow-none"
              />
              {sessionError ? <p className="text-xs text-rose-600">{sessionError}</p> : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="dreaming-prompt">用户提示词（usage_prompt / policy）</Label>
            <Textarea
              id="dreaming-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="选填。在内置提示词基础上，本次记忆沉淀的重点或特殊之处，例如：重点整理决策与原因，合并冲突与重复的客户偏好信息。"
              className="min-h-24 resize-none rounded-[4px] shadow-none"
            />
          </div>

          <div className="space-y-2">
            <Label>模型档位</Label>
            <Select
              value={modelTier}
              onValueChange={(value) => setModelTier(value as DreamingModelTier)}
              options={[
                { value: "standard", label: "标准档 · 更快更省，适合轻量整理" },
                { value: "advanced", label: "增强档 · 更强重整，适合复杂资产" },
              ]}
              className="rounded-[4px] border-slate-300 bg-white shadow-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} className="rounded-[4px]">
            取消
          </Button>
          <Button onClick={handleSubmit} className="rounded-[4px] bg-blue-600 hover:bg-blue-700">
            创建记忆沉淀
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
