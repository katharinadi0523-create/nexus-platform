import type {
  CapabilitySkillItem,
  CapabilityToolItem,
  ExecutionResourceTier,
  ResourceConfig,
  RuntimeResourceTier,
  SecurityManagementConfig,
} from "@/lib/mock/claw-hub-next";
import type { SkillConfigSelection } from "@/components/claw-hub-next/skill-config-dialog";
import type { ToolConfigSelection } from "@/components/claw-hub-next/tool-config-dialog";
import { TOOL_CONFIG_KIND_LABELS } from "./constants";

type EnabledItem = { id: string; enabled: boolean };
type IdentifiableItem = { id: string };

export function updateAutonomyBoundaryLevel(
  config: SecurityManagementConfig,
  boundaryId: string,
  nextLevel: SecurityManagementConfig["autonomyBoundaries"][number]["level"]
) {
  return {
    ...config,
    autonomyBoundaries: config.autonomyBoundaries.map((item) =>
      item.id === boundaryId ? { ...item, level: nextLevel } : item
    ),
  };
}

export function updateToolProtectionEnabled(config: SecurityManagementConfig, enabled: boolean): SecurityManagementConfig {
  return {
    ...config,
    toolProtection: { ...config.toolProtection, enabled },
  };
}

export function updateToolProtectionRuleEnabled(
  config: SecurityManagementConfig,
  ruleId: string,
  enabled: boolean
): SecurityManagementConfig {
  return {
    ...config,
    toolProtection: {
      ...config.toolProtection,
      rules: config.toolProtection.rules.map((rule) => (rule.id === ruleId ? { ...rule, enabled } : rule)),
    },
  };
}

export function addToolProtectionRule(
  config: SecurityManagementConfig,
  rule: SecurityManagementConfig["toolProtection"]["rules"][number]
): SecurityManagementConfig {
  if (config.toolProtection.rules.some((item) => item.id === rule.id)) {
    return config;
  }
  return {
    ...config,
    toolProtection: {
      ...config.toolProtection,
      rules: [...config.toolProtection.rules, rule],
    },
  };
}

export function updateFileProtectionEnabled(config: SecurityManagementConfig, enabled: boolean): SecurityManagementConfig {
  return {
    ...config,
    fileProtection: { ...config.fileProtection, enabled },
  };
}

export function addFileProtectionPath(
  config: SecurityManagementConfig,
  entry: SecurityManagementConfig["fileProtection"]["paths"][number]
): SecurityManagementConfig {
  const path = entry.path.trim();
  if (!path) {
    return config;
  }
  return {
    ...config,
    fileProtection: {
      ...config.fileProtection,
      paths: [...config.fileProtection.paths, { ...entry, path }],
    },
  };
}

export function removeFileProtectionPath(config: SecurityManagementConfig, pathId: string): SecurityManagementConfig {
  return {
    ...config,
    fileProtection: {
      ...config.fileProtection,
      paths: config.fileProtection.paths.filter((item) => item.id !== pathId),
    },
  };
}

export function resolveSecurityApproval(
  config: SecurityManagementConfig,
  approvalId: string,
  resolution: "approved" | "rejected"
): SecurityManagementConfig {
  const pending = config.securityApprovals.pending.find((item) => item.id === approvalId);
  if (!pending) {
    return config;
  }

  const resolvedAt = new Date().toLocaleString("zh-CN", { hour12: false });

  return {
    ...config,
    securityApprovals: {
      pending: config.securityApprovals.pending.filter((item) => item.id !== approvalId),
      history: [
        {
          id: `hist-${approvalId}-${resolvedAt}`,
          actionName: pending.actionName,
          resolution,
          resolvedAt,
          detail: pending.payload,
        },
        ...config.securityApprovals.history,
      ],
    },
  };
}

export function toggleScopedEnabledCollection<ScopeKey extends string, Item extends EnabledItem>(
  collection: Record<ScopeKey, Item[]>,
  scope: ScopeKey,
  id: string,
  enabled: boolean
) {
  return {
    ...collection,
    [scope]: collection[scope].map((item) => (item.id === id ? { ...item, enabled } : item)),
  };
}

export function deleteScopedCollectionItem<ScopeKey extends string, Item extends IdentifiableItem>(
  collection: Record<ScopeKey, Item[]>,
  scope: ScopeKey,
  id: string
) {
  return {
    ...collection,
    [scope]: collection[scope].filter((item) => item.id !== id),
  };
}

export function mergeClawToolSelections(clawTools: CapabilityToolItem[], selections: ToolConfigSelection[]) {
  const nextClawTools = [...clawTools];
  const existingIndexMap = new Map(nextClawTools.map((item, index) => [item.id, index]));
  let addedCount = 0;
  let reenabledCount = 0;

  selections.forEach((selection) => {
    const nextItem: CapabilityToolItem = {
      id: selection.id,
      name: selection.name,
      description: selection.description,
      enabled: true,
      badge: "Claw配置",
      meta: TOOL_CONFIG_KIND_LABELS[selection.kind],
    };

    const existingIndex = existingIndexMap.get(selection.id);
    if (existingIndex === undefined) {
      nextClawTools.push(nextItem);
      existingIndexMap.set(selection.id, nextClawTools.length - 1);
      addedCount += 1;
      return;
    }

    const existingItem = nextClawTools[existingIndex];
    nextClawTools[existingIndex] = {
      ...existingItem,
      ...nextItem,
      enabled: true,
    };

    if (!existingItem.enabled) {
      reenabledCount += 1;
    }
  });

  return { items: nextClawTools, addedCount, reenabledCount };
}

export function mergeClawSkillSelections(clawSkills: CapabilitySkillItem[], selections: SkillConfigSelection[]) {
  const nextClawSkills = [...clawSkills];
  const existingIndexMap = new Map(nextClawSkills.map((item, index) => [item.id, index]));
  let addedCount = 0;
  let reenabledCount = 0;

  selections.forEach((selection) => {
    const nextItem: CapabilitySkillItem = {
      id: selection.id,
      name: selection.name,
      description: selection.description,
      enabled: true,
      sizeLabel: selection.sizeLabel,
    };

    const existingIndex = existingIndexMap.get(selection.id);
    if (existingIndex === undefined) {
      nextClawSkills.push(nextItem);
      existingIndexMap.set(selection.id, nextClawSkills.length - 1);
      addedCount += 1;
      return;
    }

    const existingItem = nextClawSkills[existingIndex];
    nextClawSkills[existingIndex] = {
      ...existingItem,
      ...nextItem,
      enabled: true,
    };

    if (!existingItem.enabled) {
      reenabledCount += 1;
    }
  });

  return { items: nextClawSkills, addedCount, reenabledCount };
}

const RUNTIME_TIER_PRESETS: Record<RuntimeResourceTier, { cpu: number; memoryGb: number; diskGb: number }> = {
  light: { cpu: 2, memoryGb: 4, diskGb: 20 },
  standard: { cpu: 4, memoryGb: 8, diskGb: 40 },
  enhanced: { cpu: 8, memoryGb: 16, diskGb: 80 },
};

const EXECUTION_TIER_PRESETS: Record<ExecutionResourceTier, { workspaceDiskGb: number }> = {
  basic: { workspaceDiskGb: 5 },
  standard: { workspaceDiskGb: 10 },
  enhanced: { workspaceDiskGb: 20 },
};

export function applyRuntimeTier(config: ResourceConfig, tier: RuntimeResourceTier): ResourceConfig {
  const matched = RUNTIME_TIER_PRESETS[tier];

  return {
    ...config,
    runtime: {
      ...config.runtime,
      tier,
      advanced: {
        ...config.runtime.advanced,
        ...matched,
      },
    },
  };
}

export function applyExecutionTier(config: ResourceConfig, tier: ExecutionResourceTier): ResourceConfig {
  const matched = EXECUTION_TIER_PRESETS[tier];

  return {
    ...config,
    execution: {
      ...config.execution,
      tier,
      ...matched,
    },
  };
}

export function updateRuntimeNumber(
  config: ResourceConfig,
  field: "maxConcurrentTasks" | "maxTaskDurationMin",
  value: string
) {
  return {
    ...config,
    runtime: {
      ...config.runtime,
      [field]: parseNumericValue(value),
    },
  };
}

export function updateRuntimeAdvancedNumber(
  config: ResourceConfig,
  field: "cpu" | "memoryGb" | "diskGb" | "startupTimeoutSec",
  value: string
) {
  return {
    ...config,
    runtime: {
      ...config.runtime,
      advanced: {
        ...config.runtime.advanced,
        [field]: parseNumericValue(value),
      },
    },
  };
}

export function updateRuntimeAdvancedText(config: ResourceConfig, value: string) {
  return {
    ...config,
    runtime: {
      ...config.runtime,
      advanced: {
        ...config.runtime.advanced,
        runtimeVersion: value,
      },
    },
  };
}

export function updateExecutionNumber(
  config: ResourceConfig,
  field: "workspaceDiskGb" | "maxConcurrentExecutions" | "maxExecutionTimeoutMin",
  value: string
) {
  return {
    ...config,
    execution: {
      ...config.execution,
      [field]: parseNumericValue(value),
    },
  };
}

export function updateExecutionCapability(
  config: ResourceConfig,
  key: keyof ResourceConfig["execution"]["capabilities"],
  checked: boolean
) {
  return {
    ...config,
    execution: {
      ...config.execution,
      capabilities: {
        ...config.execution.capabilities,
        [key]: checked,
      },
    },
  };
}

function parseNumericValue(value: string) {
  const nextValue = Number.parseInt(value, 10);
  return Number.isNaN(nextValue) ? 0 : nextValue;
}
