"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronDown, ChevronUp, BrainCircuit } from "lucide-react";
import { MemoryVariableModal } from "./MemoryVariableModal";
import type { MemoryVariable } from "@/lib/types/agent";
import { Badge } from "@/components/ui/badge";
import { useModelCompatibility } from "@/lib/useModelCompatibility";
import { CompatibilityIndicator } from "./CompatibilityIndicator";

interface MemoryConfigPanelProps {
  variables: MemoryVariable[];
  onVariablesChange: (variables: MemoryVariable[]) => void;
  selectedModel?: string;
}

export function MemoryConfigPanel({
  variables,
  onVariablesChange,
  selectedModel = "Qwen3-32B",
}: MemoryConfigPanelProps) {
  const [expanded, setExpanded] = useState(() => variables.length > 0);
  const [modalOpen, setModalOpen] = useState(false);
  const compatibility = useModelCompatibility(selectedModel);

  useEffect(() => {
    setExpanded(variables.length > 0);
  }, [variables.length]);

  return (
    <>
      <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex flex-1 items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-100">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div className="min-w-0 text-left">
                <div className="inline-flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-950">记忆变量</h3>
                  <CompatibilityIndicator
                    status={compatibility.items.memory.status}
                    shortLabel={compatibility.items.memory.shortLabel}
                    tooltip={compatibility.items.memory.tooltip}
                  />
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  保存用户画像与关键事实，让回复延续上下文与个人偏好。
                </p>
              </div>
            </div>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            className="ml-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100"
            title="配置记忆变量"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {expanded && (
          <div className="px-5 pb-5 pt-4">
            {variables.length === 0 ? (
              <button
                onClick={() => setModalOpen(true)}
                className="flex w-full flex-col items-center justify-center rounded-[20px] border border-dashed border-cyan-200 bg-cyan-50/50 px-4 py-8 text-center transition-colors hover:bg-cyan-50"
              >
                <span className="text-sm font-medium text-slate-800">添加记忆变量</span>
                <span className="mt-1 text-xs leading-5 text-slate-500">
                  例如姓名、所属单位、关注方向等长期信息。
                </span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] text-slate-400">
                      记忆条目
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      已配置 {variables.length} 个变量，用于持久化用户特征。
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {variables.map((variable) => (
                    <Badge
                      key={variable.id}
                      variant="outline"
                      className="rounded-full border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-sm font-medium text-cyan-900 shadow-sm"
                    >
                      {variable.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <MemoryVariableModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        variables={variables}
        onSave={onVariablesChange}
      />
    </>
  );
}
