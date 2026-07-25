"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { type ModelParams } from "@/components/agent-editor/ModelSelector";
import { ClawCoreConfigSection } from "@/components/claw-hub-next/detail/core-config-section";
import { WorkbenchEntityProvider } from "@/components/claw-hub-next/workbench-entity-context";
import { getPersonalClawDetail } from "@/lib/mock/my-claw";
import { getDefaultModelParams, PRESET_MODEL_IDS, type ModelParamKey } from "@/lib/model-schemas";

const CLAW_MODEL_SELECTOR_HIDDEN_KEYS: readonly ModelParamKey[] = ["context_turns", "current_time"];

type FallbackModelRow = {
  id: string;
  model: string;
  params: ModelParams;
};

function pickDefaultFallbackModel(primaryModel: string): string {
  const different = PRESET_MODEL_IDS.find((id) => id !== primaryModel);
  return different ?? PRESET_MODEL_IDS[0] ?? "Qwen3-8B";
}

function isFallbackModelDuplicate(
  primaryModel: string,
  rows: FallbackModelRow[],
  rowIndex: number
): boolean {
  const model = rows[rowIndex]?.model;
  if (!model) {
    return false;
  }
  if (model === primaryModel) {
    return true;
  }
  for (let i = 0; i < rowIndex; i++) {
    if (rows[i]?.model === model) {
      return true;
    }
  }
  return false;
}

/**
 * ClawCoreConfigSection already renders only 模型配置 + Agent.md
 * (no org memory / SOUL / IDENTITY / USER tabs), so we reuse it as-is.
 */
export function MyClawSettingsPage() {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const initialModel = detail.overview.model || "Qwen3-32B";

  const [agentMdContent, setAgentMdContent] = useState(
    () => detail.coreFiles.find((file) => file.key === "agent")?.content ?? ""
  );
  const [primaryModel, setPrimaryModel] = useState(initialModel);
  const [primaryModelParams, setPrimaryModelParams] = useState<ModelParams>(() =>
    getDefaultModelParams(initialModel)
  );
  const [fallbackModels, setFallbackModels] = useState<FallbackModelRow[]>([]);

  function handleSaveAgentMd() {
    toast.success("Agent.md 已保存。");
  }

  function handleAddFallbackModel() {
    const model = pickDefaultFallbackModel(primaryModel);
    setFallbackModels((rows) => [
      ...rows,
      { id: crypto.randomUUID(), model, params: getDefaultModelParams(model) },
    ]);
  }

  return (
    <WorkbenchEntityProvider entityLabel="Claw">
      <div className="h-full min-h-0 overflow-y-auto px-6 py-5">
        <ClawCoreConfigSection
          agentMdContent={agentMdContent}
          primaryModel={primaryModel}
          primaryModelParams={primaryModelParams}
          fallbackModels={fallbackModels}
          hiddenModelParamKeys={CLAW_MODEL_SELECTOR_HIDDEN_KEYS}
          onAgentMdContentChange={setAgentMdContent}
          onSaveAgentMd={handleSaveAgentMd}
          onPrimaryModelChange={setPrimaryModel}
          onPrimaryModelParamsChange={setPrimaryModelParams}
          onAddFallbackModel={handleAddFallbackModel}
          onRemoveFallbackModel={(rowId) =>
            setFallbackModels((rows) => rows.filter((row) => row.id !== rowId))
          }
          onFallbackModelChange={(rowId, model) =>
            setFallbackModels((rows) =>
              rows.map((row) => (row.id === rowId ? { ...row, model } : row))
            )
          }
          onFallbackModelParamsChange={(rowId, params) =>
            setFallbackModels((rows) =>
              rows.map((row) => (row.id === rowId ? { ...row, params } : row))
            )
          }
          isFallbackModelDuplicate={(index) =>
            isFallbackModelDuplicate(primaryModel, fallbackModels, index)
          }
        />
      </div>
    </WorkbenchEntityProvider>
  );
}
