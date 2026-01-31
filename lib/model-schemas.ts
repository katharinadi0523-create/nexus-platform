export type ModelCapabilityScore = 0 | 1 | 2;

export type ModelParamWidget = "slider" | "stepper" | "toggle";

export type ModelParamKey =
  | "temperature"
  | "top_p"
  | "max_tokens"
  | "top_k"
  | "frequency_penalty"
  | "deep_thinking"
  | "context_turns";

export interface NumberParamSchema {
  key: ModelParamKey;
  type: "number";
  widget: Exclude<ModelParamWidget, "toggle">;
  label: string;
  description?: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  /**
   * Optional display formatting (e.g. 0.1234).
   */
  format?: (value: number) => string;
}

export interface BooleanParamSchema {
  key: ModelParamKey;
  type: "boolean";
  widget: "toggle";
  label: string;
  description?: string;
  defaultValue: boolean;
}

export type ModelParamSchema = NumberParamSchema | BooleanParamSchema;

export interface ModelCapabilitiesSchema {
  knowledge_base: ModelCapabilityScore; // RAG
  ontology: ModelCapabilityScore;
  terminology: ModelCapabilityScore;
  workflow: ModelCapabilityScore;
  plugins: ModelCapabilityScore; // Function Calling / Plugins
  mcp: ModelCapabilityScore;
}

export interface ModelSchema {
  id: string;
  displayName: string;
  category: "preset" | "exclusive";
  supportedParams: ModelParamSchema[];
  capabilities: ModelCapabilitiesSchema;
}

export type ModelParamValues = Partial<
  Record<ModelParamKey, number | boolean>
>;

export const MODEL_SCHEMAS: Record<string, ModelSchema> = {
  "Qwen3-32B": {
    id: "Qwen3-32B",
    displayName: "Qwen3-32B",
    category: "preset",
    supportedParams: [
      {
        key: "temperature",
        type: "number",
        widget: "slider",
        label: "温度",
        // Default is driven by deep_thinking linkage (see ModelSelector behavior).
        // Use non-thinking recommendation as base default.
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        key: "top_p",
        type: "number",
        widget: "slider",
        label: "Top P",
        // Authority: top_p default = 1 (will be overridden by deep_thinking linkage).
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        key: "max_tokens",
        type: "number",
        widget: "stepper",
        label: "最大输出 Token 数",
        // Authority: max 32768, default 8192
        defaultValue: 8192,
        min: 1,
        max: 32768,
        step: 1,
      },
      {
        key: "top_k",
        type: "number",
        widget: "stepper",
        label: "Top K",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
      },
      {
        key: "frequency_penalty",
        type: "number",
        widget: "stepper",
        label: "重复语句惩罚",
        defaultValue: 0,
        min: -2,
        max: 2,
        step: 0.1,
      },
      {
        key: "deep_thinking",
        type: "boolean",
        widget: "toggle",
        label: "深度思考开关",
        defaultValue: false,
      },
      {
        key: "context_turns",
        type: "number",
        widget: "stepper",
        label: "携带上下文轮数",
        defaultValue: 2,
        min: 0,
        max: 20,
        step: 1,
      },
    ],
    capabilities: {
      knowledge_base: 2,
      ontology: 2,
      terminology: 2,
      workflow: 2,
      plugins: 2,
      mcp: 2,
    },
  },
  "Qwen3-8B": {
    id: "Qwen3-8B",
    displayName: "Qwen3-8B",
    category: "preset",
    supportedParams: [
      {
        key: "temperature",
        type: "number",
        widget: "slider",
        label: "温度",
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        key: "top_p",
        type: "number",
        widget: "slider",
        label: "Top P",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        key: "max_tokens",
        type: "number",
        widget: "stepper",
        label: "最大输出 Token 数",
        defaultValue: 8192,
        min: 1,
        max: 32768,
        step: 1,
      },
      {
        key: "top_k",
        type: "number",
        widget: "stepper",
        label: "Top K",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
      },
      {
        key: "frequency_penalty",
        type: "number",
        widget: "stepper",
        label: "重复语句惩罚",
        defaultValue: 0,
        min: -2,
        max: 2,
        step: 0.1,
      },
      {
        key: "deep_thinking",
        type: "boolean",
        widget: "toggle",
        label: "深度思考开关",
        defaultValue: false,
      },
      {
        key: "context_turns",
        type: "number",
        widget: "stepper",
        label: "携带上下文轮数",
        defaultValue: 2,
        min: 0,
        max: 20,
        step: 1,
      },
    ],
    capabilities: {
      knowledge_base: 2,
      ontology: 2,
      terminology: 2,
      workflow: 2,
      plugins: 2,
      mcp: 2,
    },
  },
  "DeepSeek V3": {
    id: "DeepSeek V3",
    displayName: "DeepSeek V3",
    category: "preset",
    supportedParams: [
      {
        key: "temperature",
        type: "number",
        widget: "slider",
        label: "温度",
        defaultValue: 0.99,
        min: 0,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        key: "max_tokens",
        type: "number",
        widget: "stepper",
        label: "最大输出 Token 数",
        defaultValue: 4096,
        min: 1,
        max: 8192,
        step: 1,
      },
      {
        key: "context_turns",
        type: "number",
        widget: "stepper",
        label: "携带上下文轮数",
        defaultValue: 2,
        min: 0,
        max: 20,
        step: 1,
      },
    ],
    capabilities: {
      knowledge_base: 2,
      ontology: 2,
      terminology: 2,
      workflow: 2,
      plugins: 2,
      mcp: 2,
    },
  },
  "DeepSeek-R1": {
    id: "DeepSeek-R1",
    displayName: "DeepSeek-R1",
    category: "preset",
    supportedParams: [
      {
        key: "temperature",
        type: "number",
        widget: "slider",
        label: "温度",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        key: "max_tokens",
        type: "number",
        widget: "stepper",
        label: "最大输出 Token 数",
        defaultValue: 32768,
        min: 1,
        max: 65536,
        step: 1,
      },
      {
        key: "context_turns",
        type: "number",
        widget: "stepper",
        label: "携带上下文轮数",
        defaultValue: 2,
        min: 0,
        max: 20,
        step: 1,
      },
    ],
    capabilities: {
      knowledge_base: 2,
      ontology: 2,
      terminology: 2,
      workflow: 2,
      plugins: 2,
      mcp: 2,
    },
  },
  "Qwen3-DPO": {
    id: "Qwen3-DPO",
    displayName: "Qwen3-DPO",
    category: "exclusive",
    supportedParams: [
      {
        key: "temperature",
        type: "number",
        widget: "slider",
        label: "温度",
        defaultValue: 0.99,
        min: 0,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        key: "top_p",
        type: "number",
        widget: "slider",
        label: "Top P",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        key: "max_tokens",
        type: "number",
        widget: "stepper",
        label: "最大输出 Token 数",
        defaultValue: 4096,
        min: 1,
        max: 8192,
        step: 1,
      },
    ],
    capabilities: {
      knowledge_base: 2,
      ontology: 2,
      terminology: 2,
      workflow: 1,
      plugins: 1,
      mcp: 2,
    },
  },
  "微调多模态感知大模型": {
    id: "微调多模态感知大模型",
    displayName: "微调多模态感知大模型",
    category: "exclusive",
    supportedParams: [
      {
        key: "temperature",
        type: "number",
        widget: "slider",
        label: "温度",
        defaultValue: 0.99,
        min: 0,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        key: "top_p",
        type: "number",
        widget: "slider",
        label: "Top P",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        key: "max_tokens",
        type: "number",
        widget: "stepper",
        label: "最大输出 Token 数",
        defaultValue: 4096,
        min: 1,
        max: 8192,
        step: 1,
      },
    ],
    capabilities: {
      knowledge_base: 2,
      ontology: 2,
      terminology: 2,
      workflow: 1,
      plugins: 1,
      mcp: 2,
    },
  },
  "DeepSeek-R2": {
    id: "DeepSeek-R2",
    displayName: "DeepSeek-R2",
    category: "exclusive",
    supportedParams: [
      {
        key: "temperature",
        type: "number",
        widget: "slider",
        label: "温度",
        defaultValue: 0.99,
        min: 0,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        key: "top_p",
        type: "number",
        widget: "slider",
        label: "Top P",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        key: "max_tokens",
        type: "number",
        widget: "stepper",
        label: "最大输出 Token 数",
        defaultValue: 4096,
        min: 1,
        max: 8192,
        step: 1,
      },
    ],
    capabilities: {
      knowledge_base: 2,
      ontology: 2,
      terminology: 2,
      workflow: 2,
      plugins: 2,
      mcp: 2,
    },
  },

  /**
   * PRD Mock model for compatibility testing:
   * - NeoRoleplay-7B-Instruct
   * - only 4 params visible: temperature, top_p, max_tokens, context_turns
   * - hide: top_k, frequency_penalty, deep_thinking
   * - capabilities: RAG=1 (limited), Tools=0 (unsupported), MCP=2
   */
  "NeoRoleplay-7B-Instruct": {
    id: "NeoRoleplay-7B-Instruct",
    displayName: "NeoRoleplay-7B-Instruct",
    category: "preset",
    supportedParams: [
      {
        key: "temperature",
        type: "number",
        widget: "slider",
        label: "温度",
        defaultValue: 0.99,
        min: 0,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        key: "max_tokens",
        type: "number",
        widget: "stepper",
        label: "最大输出 Token 数",
        defaultValue: 2048,
        min: 1,
        max: 4096,
        step: 1,
      },
    ],
    capabilities: {
      // 角色扮演微调：对知识域理解/引用能力受限；对工具域（规划与调用）较弱
      knowledge_base: 1,
      ontology: 1,
      terminology: 1,
      workflow: 0,
      plugins: 0,
      mcp: 0,
    },
  },
};

export function getModelSchema(modelId: string): ModelSchema {
  const base = MODEL_SCHEMAS[modelId] || MODEL_SCHEMAS["Qwen3-32B"];

  const normalizeToolDomain = (schema: ModelSchema): ModelSchema => {
    const { workflow, plugins, mcp } = schema.capabilities;
    // Tool domain must be consistent: workflow/plugins/mcp share the same support level.
    // Use the weakest level as the unified tool score.
    const unifiedToolScore = Math.min(workflow, plugins, mcp) as ModelCapabilityScore;
    if (workflow === unifiedToolScore && plugins === unifiedToolScore && mcp === unifiedToolScore) {
      return schema;
    }
    return {
      ...schema,
      capabilities: {
        ...schema.capabilities,
        workflow: unifiedToolScore,
        plugins: unifiedToolScore,
        mcp: unifiedToolScore,
      },
    };
  };

  // For "我的模型服务" group: capabilities can be random (but must be stable/deterministic).
  if (base.category === "exclusive") {
    const unstableIds = new Set(["Qwen3-DPO", "微调多模态感知大模型", "DeepSeek-R2"]);
    if (unstableIds.has(base.id)) {
      const seed = hashStringToInt(base.id);
      const pick = (offset: number): ModelCapabilityScore => {
        const v = (seed + offset) % 3;
        return (v === 0 ? 0 : v === 1 ? 1 : 2) as ModelCapabilityScore;
      };
      const toolScore = pick(4);
      const randomized: ModelSchema = {
        ...base,
        capabilities: {
          knowledge_base: pick(1),
          ontology: pick(2),
          terminology: pick(3),
          // tool domain: one score drives all
          workflow: toolScore,
          plugins: toolScore,
          mcp: toolScore,
        },
      };
      return normalizeToolDomain(randomized);
    }
  }

  return normalizeToolDomain(base);
}

export function getDefaultModelParams(modelId: string): ModelParamValues {
  const schema = getModelSchema(modelId);
  const defaults: ModelParamValues = {};
  for (const param of schema.supportedParams) {
    defaults[param.key] = param.defaultValue as any;
  }
  return defaults;
}

function hashStringToInt(input: string): number {
  // Simple deterministic hash for stable pseudo-randomization.
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export const PRESET_MODEL_IDS = Object.values(MODEL_SCHEMAS)
  .filter((m) => m.category === "preset")
  .map((m) => m.id);

export const EXCLUSIVE_MODEL_IDS = Object.values(MODEL_SCHEMAS)
  .filter((m) => m.category === "exclusive")
  .map((m) => m.id);

