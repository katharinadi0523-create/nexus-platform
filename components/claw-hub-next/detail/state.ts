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

function normalizePolicyActions<Action extends string>(action: Action | Action[]) {
  return Array.isArray(action) ? action : [action];
}

function togglePolicyAction<Action extends string>(currentAction: Action | Action[], nextAction: Action) {
  const selectedActions = normalizePolicyActions(currentAction);
  const hasRecord = selectedActions.includes("记录" as Action);
  const hasNextAction = selectedActions.includes(nextAction);
  const nextIsRecord = nextAction === ("记录" as Action);

  if (nextIsRecord) {
    if (hasNextAction) {
      const primaryActions = selectedActions.filter((action) => action !== ("记录" as Action));
      return primaryActions.length > 0 ? primaryActions : selectedActions;
    }

    return [...selectedActions, nextAction];
  }

  if (hasNextAction) {
    const remainingActions = selectedActions.filter((action) => action !== nextAction);
    return remainingActions.length > 0 ? remainingActions : selectedActions;
  }

  return hasRecord ? [nextAction, "记录" as Action] : [nextAction];
}

export function buildInitialLexiconDrafts(config: SecurityManagementConfig) {
  return Object.fromEntries(
    config.lexiconPolicies.map((policy) => [
      policy.id,
      policy.availableLibraries.find((library) => !policy.selectedLibraries.includes(library)) ??
        policy.availableLibraries[0] ??
        "",
    ])
  );
}

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

export function updateSecurityPolicyEnabled(
  config: SecurityManagementConfig,
  policyId: string,
  enabled: boolean
) {
  return {
    ...config,
    strategyPolicies: config.strategyPolicies.map((policy) => (policy.id === policyId ? { ...policy, enabled } : policy)),
  };
}

export function updateSecurityPolicyMode(
  config: SecurityManagementConfig,
  policyId: string,
  mode: SecurityManagementConfig["strategyPolicies"][number]["mode"]
) {
  return {
    ...config,
    strategyPolicies: config.strategyPolicies.map((policy) =>
      policy.id === policyId ? { ...policy, mode: mode ?? policy.mode } : policy
    ),
  };
}

export function updateSecurityPolicyAction(
  config: SecurityManagementConfig,
  policyId: string,
  action: SecurityManagementConfig["strategyPolicies"][number]["availableActions"][number]
) {
  return {
    ...config,
    strategyPolicies: config.strategyPolicies.map((policy) =>
      policy.id === policyId ? { ...policy, action: togglePolicyAction(policy.action, action) } : policy
    ),
  };
}

export function updateSecurityPolicyRuleLevel(
  config: SecurityManagementConfig,
  policyId: string,
  ruleId: string,
  level: SecurityManagementConfig["strategyPolicies"][number]["rules"][number]["level"]
) {
  return {
    ...config,
    strategyPolicies: config.strategyPolicies.map((policy) =>
      policy.id === policyId
        ? {
            ...policy,
            rules: policy.rules.map((rule) => (rule.id === ruleId ? { ...rule, level } : rule)),
          }
        : policy
    ),
  };
}

export function updateLexiconPolicyEnabled(
  config: SecurityManagementConfig,
  policyId: string,
  enabled: boolean
) {
  return {
    ...config,
    lexiconPolicies: config.lexiconPolicies.map((policy) => (policy.id === policyId ? { ...policy, enabled } : policy)),
  };
}

export function updateLexiconPolicyMode(
  config: SecurityManagementConfig,
  policyId: string,
  mode: SecurityManagementConfig["lexiconPolicies"][number]["mode"]
) {
  return {
    ...config,
    lexiconPolicies: config.lexiconPolicies.map((policy) => (policy.id === policyId ? { ...policy, mode } : policy)),
  };
}

export function updateLexiconPolicyAction(
  config: SecurityManagementConfig,
  policyId: string,
  action: SecurityManagementConfig["lexiconPolicies"][number]["availableActions"][number]
) {
  return {
    ...config,
    lexiconPolicies: config.lexiconPolicies.map((policy) =>
      policy.id === policyId ? { ...policy, action: togglePolicyAction(policy.action, action) } : policy
    ),
  };
}

export function addLexiconLibrary(
  config: SecurityManagementConfig,
  policyId: string,
  selectedLibrary: string
) {
  const policy = config.lexiconPolicies.find((item) => item.id === policyId);
  if (!policy || !selectedLibrary || policy.selectedLibraries.includes(selectedLibrary)) {
    return { config, added: false, nextDraft: "" };
  }

  const nextConfig = {
    ...config,
    lexiconPolicies: config.lexiconPolicies.map((item) =>
      item.id === policyId
        ? {
            ...item,
            selectedLibraries: [...item.selectedLibraries, selectedLibrary],
          }
        : item
    ),
  };
  const nextPolicy = nextConfig.lexiconPolicies.find((item) => item.id === policyId);
  const nextDraft =
    nextPolicy?.availableLibraries.find((library) => !nextPolicy.selectedLibraries.includes(library)) ?? "";

  return { config: nextConfig, added: true, nextDraft };
}

export function removeLexiconLibrary(
  config: SecurityManagementConfig,
  policyId: string,
  libraryName: string
) {
  return {
    ...config,
    lexiconPolicies: config.lexiconPolicies.map((policy) =>
      policy.id === policyId
        ? {
            ...policy,
            selectedLibraries: policy.selectedLibraries.filter((item) => item !== libraryName),
          }
        : policy
    ),
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
