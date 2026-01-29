import { useMemo } from "react";
import { getModelSchema, type ModelCapabilityScore } from "@/lib/model-schemas";

export type CompatibilityStatus = "supported" | "limited" | "unsupported" | "unknown";

export interface CompatibilityItem {
  key:
    | "knowledge_base"
    | "ontology"
    | "terminology"
    | "workflow"
    | "plugins"
    | "mcp";
  status: CompatibilityStatus;
  shortLabel: "" | "部分支持" | "模型不支持" | "未知";
  tooltip: string;
}

function scoreToStatus(score: ModelCapabilityScore | undefined): CompatibilityStatus {
  if (score === 2) return "supported";
  if (score === 1) return "limited";
  if (score === 0) return "unsupported";
  return "unknown";
}

function statusToShortLabel(status: CompatibilityStatus): CompatibilityItem["shortLabel"] {
  if (status === "limited") return "部分支持";
  if (status === "unsupported") return "模型不支持";
  if (status === "unknown") return "未知";
  return "";
}

function buildTooltip(
  key: CompatibilityItem["key"],
  status: CompatibilityStatus,
  modelName: string
): string {
  // Per PRD (and your latest spec): only show details on hover.
  // Unsupported must use the exact template.
  if (status === "unsupported") {
    return `${modelName}不支持此功能。建议关闭此功能或切换其他模型`;
  }
  if (status === "limited") {
    return `${modelName}对该功能支持受限，效果可能不稳定。建议谨慎使用或切换其他模型`;
  }
  if (status === "supported") {
    return `${modelName}支持此功能`;
  }
  return `${modelName}的兼容性未知`;
}

export function useModelCompatibility(modelId: string) {
  return useMemo(() => {
    const schema = getModelSchema(modelId);
    const capabilities = schema.capabilities;
    const modelName = schema.displayName || schema.id;

    const kbStatus = scoreToStatus(capabilities?.knowledge_base);
    const ontologyStatus = scoreToStatus(capabilities?.ontology);
    const terminologyStatus = scoreToStatus(capabilities?.terminology);
    const workflowStatus = scoreToStatus(capabilities?.workflow);
    const pluginsStatus = scoreToStatus(capabilities?.plugins);
    const mcpStatus = scoreToStatus(capabilities?.mcp);

    const items: Record<CompatibilityItem["key"], CompatibilityItem> = {
      knowledge_base: {
        key: "knowledge_base",
        status: kbStatus,
        shortLabel: statusToShortLabel(kbStatus),
        tooltip: buildTooltip("knowledge_base", kbStatus, modelName),
      },
      ontology: {
        key: "ontology",
        status: ontologyStatus,
        shortLabel: statusToShortLabel(ontologyStatus),
        tooltip: buildTooltip("ontology", ontologyStatus, modelName),
      },
      terminology: {
        key: "terminology",
        status: terminologyStatus,
        shortLabel: statusToShortLabel(terminologyStatus),
        tooltip: buildTooltip("terminology", terminologyStatus, modelName),
      },
      workflow: {
        key: "workflow",
        status: workflowStatus,
        shortLabel: statusToShortLabel(workflowStatus),
        tooltip: buildTooltip("workflow", workflowStatus, modelName),
      },
      plugins: {
        key: "plugins",
        status: pluginsStatus,
        shortLabel: statusToShortLabel(pluginsStatus),
        tooltip: buildTooltip("plugins", pluginsStatus, modelName),
      },
      mcp: {
        key: "mcp",
        status: mcpStatus,
        shortLabel: statusToShortLabel(mcpStatus),
        tooltip: buildTooltip("mcp", mcpStatus, modelName),
      },
    };

    return {
      modelId: schema.id,
      modelName,
      items,
    };
  }, [modelId]);
}

