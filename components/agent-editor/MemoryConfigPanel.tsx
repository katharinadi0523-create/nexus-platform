"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
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
  const [expanded, setExpanded] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const compatibility = useModelCompatibility(selectedModel);

  return (
    <>
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="mb-4 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex-1 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">记忆</h3>
                <CompatibilityIndicator
                  status={compatibility.items.memory.status}
                  shortLabel={compatibility.items.memory.shortLabel}
                  tooltip={compatibility.items.memory.tooltip}
                />
              </div>
              {expanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>

          {expanded && (
            <div className="px-4 pb-4">
              {/* 记忆变量子部分 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 mb-1">
                      记忆变量
                    </h4>
                    <p className="text-xs text-slate-500">
                      用于保存用户个人信息，让智能体记住用户的特征，使回复更加个性化。
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalOpen(true);
                    }}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                    title="配置记忆变量"
                  >
                    <Plus className="w-4 h-4 text-slate-600" />
                  </button>
                </div>

                {/* 变量标签展示 */}
                {variables.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {variables.map((variable) => (
                      <Badge
                        key={variable.id}
                        variant="outline"
                        className="bg-slate-100 text-slate-700 border-slate-300 px-3 py-1.5 text-sm font-normal"
                      >
                        {variable.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
