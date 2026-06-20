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
  DreamingDistilledMaterial,
  MemoryStore,
} from "@/lib/mock/memory-management";
import {
  dreamingAgentSessionGroups,
  dreamingDistilledMaterials,
} from "@/lib/mock/memory-management";
import { cn } from "@/lib/utils";

export interface CreateUpdateJobValue {
  storeId: string;
  session?: AgentSessionSelection;
  distilledMaterialIds: string[];
  prompt: string;
}

export interface AgentSessionSelection {
  agentId: string;
  agentName: string;
  sessionId: string;
  sessionTitle: string;
}

function DistilledMaterialPicker({
  materials,
  selectedIds,
  onChange,
}: {
  materials: DreamingDistilledMaterial[];
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
}) {
  function toggleMaterial(materialId: string) {
    onChange(
      selectedIds.includes(materialId)
        ? selectedIds.filter((id) => id !== materialId)
        : [...selectedIds, materialId]
    );
  }

  return (
    <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white">
      {materials.map((material) => {
        const selected = selectedIds.includes(material.id);
        return (
          <button
            key={material.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggleMaterial(material.id)}
            className={cn(
              "flex w-full items-start gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0",
              selected ? "bg-blue-50" : "hover:bg-slate-50"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border text-[10px]",
                selected
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 bg-white text-transparent"
              )}
            >
              ✓
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-slate-800">
                {material.agentName} · {material.nodePath}
              </span>
              <span className="mt-0.5 block line-clamp-1 text-xs text-slate-500">
                {material.summary} · {material.updatedAt}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
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

export function CreateUpdateJobDialog({
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
  onSubmit: (value: CreateUpdateJobValue) => void;
}) {
  const [storeId, setStoreId] = useState(initialStoreId ?? stores[0]?.id ?? "");
  const [useSessionInput, setUseSessionInput] = useState(true);
  const [useDistilledMaterials, setUseDistilledMaterials] = useState(false);
  const [sessionSelection, setSessionSelection] = useState<AgentSessionSelection | null>(null);
  const [distilledMaterialIds, setDistilledMaterialIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [storeError, setStoreError] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [materialError, setMaterialError] = useState("");

  function resetForm() {
    setStoreId(initialStoreId ?? stores[0]?.id ?? "");
    setUseSessionInput(true);
    setUseDistilledMaterials(false);
    setSessionSelection(null);
    setDistilledMaterialIds([]);
    setPrompt("");
    setStoreError("");
    setSessionError("");
    setMaterialError("");
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
      setStoreError("请选择原始记忆库。");
      hasError = true;
    }
    if (useSessionInput && !sessionSelection) {
      setSessionError("请选择会话输入。");
      hasError = true;
    }
    if (useDistilledMaterials && distilledMaterialIds.length === 0) {
      setMaterialError("请至少选择一条 C Node 蒸馏材料。");
      hasError = true;
    }
    if (!useSessionInput && !useDistilledMaterials) {
      setMaterialError("请至少选择一种输入材料。");
      hasError = true;
    }
    if (hasError) {
      return;
    }
    onSubmit({
      storeId,
      session: useSessionInput ? sessionSelection ?? undefined : undefined,
      distilledMaterialIds: useDistilledMaterials ? distilledMaterialIds : [],
      prompt: prompt.trim(),
    });
    resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-[8px] sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>新建记忆沉淀</DialogTitle>
          <DialogDescription>
            记忆沉淀会读取所选原始会话和/或 C Node 的当前内容，结合旧版本生成 vNext Draft。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>输入记忆库</Label>
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
            <p className="text-xs text-slate-500">作为本次记忆沉淀 vNext Draft 的目标 Store。</p>
          </div>

          <div className="space-y-2">
            <Label>输入材料</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={useSessionInput}
                onClick={() => {
                  setUseSessionInput((current) => !current);
                  setSessionError("");
                  setMaterialError("");
                }}
                className={cn(
                  "rounded-[4px] border px-3 py-2.5 text-left text-sm transition-colors",
                  useSessionInput
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                <span className="font-medium">原始会话</span>
                <span className="mt-1 block text-xs text-slate-500">按智能体与会话选择原始上下文。</span>
              </button>
              <button
                type="button"
                aria-pressed={useDistilledMaterials}
                onClick={() => {
                  setUseDistilledMaterials((current) => !current);
                  setMaterialError("");
                }}
                className={cn(
                  "rounded-[4px] border px-3 py-2.5 text-left text-sm transition-colors",
                  useDistilledMaterials
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                <span className="font-medium">蒸馏材料（C Node）</span>
                <span className="mt-1 block text-xs text-slate-500">选择已提取的 Claw 经验节点。</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">可单选或组合使用；系统读取材料当前内容，不搬运历史 Diff。</p>
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

          {useDistilledMaterials ? (
            <div className="space-y-2">
              <Label>蒸馏材料</Label>
              <DistilledMaterialPicker
                materials={dreamingDistilledMaterials}
                selectedIds={distilledMaterialIds}
                onChange={(value) => {
                  setDistilledMaterialIds(value);
                  setMaterialError("");
                }}
              />
              {materialError ? <p className="text-xs text-rose-600">{materialError}</p> : null}
            </div>
          ) : materialError ? (
            <p className="text-xs text-rose-600">{materialError}</p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="dreaming-prompt">用户提示词</Label>
            <Textarea
              id="dreaming-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="选填。在内置提示词基础上，本次记忆沉淀的重点或特殊之处，例如：重点整理决策与原因，合并冲突与重复的客户偏好信息"
              className="min-h-24 resize-none rounded-[4px] shadow-none"
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
