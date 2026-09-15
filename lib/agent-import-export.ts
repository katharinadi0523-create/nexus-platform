export type ImportObjectType = "workflow_agent" | "workflow";

export type ImportResourceStatus = "matched" | "missing" | "reauthorize";

export interface ImportResourceItem {
  id: string;
  type: string;
  name: string;
  status: ImportResourceStatus;
  reason?: string;
}

export interface ImportPreview {
  fileName: string;
  schemaVersion: string;
  objectType: ImportObjectType;
  objectTypeLabel: string;
  objectName: string;
  description: string;
  sourceLabel: string;
  configSummary: Array<{ label: string; value: string }>;
  resources: ImportResourceItem[];
}

export const IMPORT_OBJECT_LABELS: Record<ImportObjectType, string> = {
  workflow_agent: "工作流智能体",
  workflow: "工作流",
};

const RESOURCE_FIXTURES: Record<ImportObjectType, ImportResourceItem[]> = {
  workflow_agent: [
    { id: "model-qwen", type: "模型", name: "Qwen3-32B", status: "matched" },
    { id: "kb-customer", type: "知识库", name: "企业客服知识库", status: "missing", reason: "当前环境未找到同名资源" },
    { id: "plugin-ticket", type: "插件", name: "工单中心", status: "reauthorize", reason: "凭证未随配置文件导入" },
    { id: "workflow-route", type: "工作流", name: "意图识别与分流", status: "matched" },
  ],
  workflow: [
    { id: "model-deepseek", type: "模型", name: "DeepSeek-V3", status: "matched" },
    { id: "plugin-http", type: "插件", name: "HTTP 请求", status: "reauthorize", reason: "需要重新配置访问凭证" },
    { id: "kb-policy", type: "知识库", name: "售后政策知识库", status: "missing", reason: "当前环境未找到同名资源" },
    { id: "terminology-product", type: "术语库", name: "产品标准术语", status: "matched" },
  ],
};

const OBJECT_FIXTURES: Record<ImportObjectType, Omit<ImportPreview, "fileName" | "objectType">> = {
  workflow_agent: {
    schemaVersion: "1.0",
    objectTypeLabel: "工作流智能体",
    objectName: "智能客服分流助手",
    description: "识别客户意图，结合知识库回答并将复杂问题转交工单系统。",
    sourceLabel: "最新发布版本 V3",
    configSummary: [
      { label: "画布", value: "8 个节点 · 9 条连线" },
      { label: "基础配置", value: "开场白 · 推荐问题 · 3 轮上下文" },
      { label: "关联资源", value: "4 项" },
    ],
    resources: RESOURCE_FIXTURES.workflow_agent,
  },
  workflow: {
    schemaVersion: "1.0",
    objectTypeLabel: "工作流",
    objectName: "售后问题处理流程",
    description: "完成问题分类、知识检索、回复生成与人工转接。",
    sourceLabel: "最新发布版本 V5",
    configSummary: [
      { label: "画布", value: "11 个节点 · 13 条连线" },
      { label: "变量", value: "6 个输入 · 3 个输出" },
      { label: "关联资源", value: "4 项" },
    ],
    resources: RESOURCE_FIXTURES.workflow,
  },
};

export function validateImportFile(fileName: string): string | null {
  if (!fileName.trim()) return "请选择需要导入的配置文件。";
  if (!/\.ya?ml$/i.test(fileName)) return "仅支持 Agent Foundry 导出的 YAML 配置文件（.yaml 或 .yml）。";
  return null;
}

export function buildImportPreview(
  objectType: ImportObjectType,
  fileName: string,
  includeWarnings = true
): ImportPreview {
  const fixture = OBJECT_FIXTURES[objectType];
  return {
    ...fixture,
    resources: includeWarnings
      ? fixture.resources
      : fixture.resources.map((resource) => ({
          ...resource,
          status: "matched" as const,
          reason: undefined,
        })),
    fileName,
    objectType,
  };
}

export function getPendingResources(preview: ImportPreview) {
  return preview.resources.filter((resource) => resource.status !== "matched");
}

export function buildExportYaml({
  objectType,
  objectName,
  sourceType,
  sourceVersion,
}: {
  objectType: ImportObjectType;
  objectName: string;
  sourceType: "published";
  sourceVersion?: string;
}) {
  const versionLines = `  version_id: ${sourceVersion ?? "latest"}\n  version_no: ${sourceVersion ?? "latest"}`;

  return `schema_version: \"1.0\"\nobject:\n  type: ${objectType}\n  name: ${objectName}\n  description: Agent Foundry configuration export\nsource:\n  type: ${sourceType}\n${versionLines}\nconfig:\n  exported_for_prototype: true\nreferences:\n  models: []\n  knowledge_bases: []\n  plugins: []\n`;
}

export function sanitizeExportFileName(name: string) {
  const normalized = name.trim().replace(/[\\/:*?\"<>|]+/g, "-").replace(/\s+/g, "-");
  return `${normalized || "agent-foundry-config"}.yaml`;
}
