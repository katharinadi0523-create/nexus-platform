export type ImportObjectType = "workflow_agent" | "workflow" | "autonomous_agent";

export type ImportResourceStatus = "matched" | "missing" | "reauthorize";
export type RelatedObjectMode = "publish" | "draft";

export interface ImportResourceItem {
  id: string;
  type: string;
  name: string;
  status: ImportResourceStatus;
  reason?: string;
}

export interface RelatedObjectItem {
  id: string;
  type: ImportObjectType;
  name: string;
  description: string;
  relationPath: string;
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
  relatedObjects: RelatedObjectItem[];
  relatedObjectMode?: RelatedObjectMode;
}

export const IMPORT_OBJECT_LABELS: Record<ImportObjectType, string> = {
  workflow_agent: "工作流智能体",
  workflow: "工作流",
  autonomous_agent: "自主规划智能体",
};

export const EXPORT_RELATED_OBJECTS: Record<ImportObjectType, RelatedObjectItem[]> = {
  workflow_agent: [
    { id: "related-agent", type: "autonomous_agent", name: "售后分析智能体", description: "由智能体选择节点引用", relationPath: "主对象 → 售后分析智能体" },
    { id: "related-workflow", type: "workflow", name: "退款审批流程", description: "由工作流节点引用", relationPath: "主对象 → 退款审批流程" },
    { id: "nested-profile-workflow", type: "workflow", name: "客户画像查询流程", description: "由售后分析智能体继续引用", relationPath: "主对象 → 售后分析智能体 → 客户画像查询流程" },
    { id: "nested-audit-agent", type: "workflow_agent", name: "人工复核智能体", description: "由退款审批流程继续引用", relationPath: "主对象 → 退款审批流程 → 人工复核智能体" },
  ],
  workflow: [
    { id: "related-agent", type: "autonomous_agent", name: "服务质检智能体", description: "由智能体节点引用", relationPath: "主对象 → 服务质检智能体" },
    { id: "related-workflow", type: "workflow", name: "人工复核流程", description: "由工作流节点引用", relationPath: "主对象 → 人工复核流程" },
    { id: "nested-agent", type: "workflow_agent", name: "升级处理智能体", description: "由人工复核流程继续引用", relationPath: "主对象 → 人工复核流程 → 升级处理智能体" },
  ],
  autonomous_agent: [
    { id: "related-workflow", type: "workflow", name: "情报研判流程", description: "由工具配置引用", relationPath: "主对象 → 情报研判流程" },
    { id: "nested-agent", type: "workflow_agent", name: "风险复核智能体", description: "由情报研判流程继续引用", relationPath: "主对象 → 情报研判流程 → 风险复核智能体" },
    { id: "nested-workflow", type: "workflow", name: "报告生成流程", description: "由风险复核智能体继续引用", relationPath: "主对象 → 情报研判流程 → 风险复核智能体 → 报告生成流程" },
  ],
};

const RESOURCE_FIXTURES: Record<ImportObjectType, ImportResourceItem[]> = {
  workflow_agent: [
    { id: "model-qwen", type: "模型", name: "Qwen3-32B", status: "missing", reason: "当前环境未提供该模型服务" },
    { id: "kb-customer", type: "知识库", name: "企业客服知识库", status: "missing", reason: "当前环境未找到同名资源" },
    { id: "plugin-ticket", type: "插件", name: "工单中心", status: "reauthorize", reason: "凭证未随配置文件导入" },
    { id: "workflow-route", type: "工作流", name: "意图识别与分流", status: "missing", reason: "原工作流版本已不可用" },
  ],
  workflow: [
    { id: "model-deepseek", type: "模型", name: "DeepSeek-V3", status: "missing", reason: "当前环境未提供该模型服务" },
    { id: "plugin-http", type: "插件", name: "HTTP 请求", status: "reauthorize", reason: "需要重新配置访问凭证" },
    { id: "kb-policy", type: "知识库", name: "售后政策知识库", status: "missing", reason: "当前环境未找到同名资源" },
    { id: "workflow-refund", type: "工作流", name: "退款审批流程", status: "missing", reason: "原工作流版本已不可用" },
    { id: "terminology-product", type: "术语库", name: "产品标准术语", status: "matched" },
  ],
  autonomous_agent: [
    { id: "model-ernie", type: "模型", name: "ERNIE-X1-Turbo-32K", status: "missing", reason: "当前环境未提供该模型服务" },
    { id: "kb-intel", type: "知识库", name: "开源情报资料库", status: "missing", reason: "当前环境未找到同名资源" },
    { id: "mcp-search", type: "MCP", name: "全网检索服务", status: "reauthorize", reason: "鉴权信息未导入" },
    { id: "workflow-analysis", type: "工作流", name: "情报研判流程", status: "missing", reason: "原工作流版本已不可用" },
  ],
};

const OBJECT_FIXTURES: Record<ImportObjectType, Omit<ImportPreview, "fileName" | "objectType">> = {
  workflow_agent: {
    schemaVersion: "1.0",
    objectTypeLabel: "工作流智能体",
    objectName: "智能客服分流助手",
    description: "识别客户意图，结合知识库回答并将复杂问题转交工单系统。",
    sourceLabel: "来源版本 V3",
    configSummary: [
      { label: "画布", value: "8 个节点 · 9 条连线" },
      { label: "基础配置", value: "开场白 · 推荐问题 · 3 轮上下文" },
      { label: "关联对象", value: "4 个 · 完整关联链" },
    ],
    resources: RESOURCE_FIXTURES.workflow_agent,
    relatedObjects: EXPORT_RELATED_OBJECTS.workflow_agent,
  },
  workflow: {
    schemaVersion: "1.0",
    objectTypeLabel: "工作流",
    objectName: "售后问题处理流程",
    description: "完成问题分类、知识检索、回复生成与人工转接。",
    sourceLabel: "来源版本 V5",
    configSummary: [
      { label: "画布", value: "11 个节点 · 13 条连线" },
      { label: "变量", value: "6 个输入 · 3 个输出" },
      { label: "关联对象", value: "3 个 · 完整关联链" },
    ],
    resources: RESOURCE_FIXTURES.workflow,
    relatedObjects: EXPORT_RELATED_OBJECTS.workflow,
  },
  autonomous_agent: {
    schemaVersion: "1.0",
    objectTypeLabel: "自主规划智能体",
    objectName: "开源情报分析助手",
    description: "检索多源公开信息并生成结构化研判报告。",
    sourceLabel: "来源版本 V2",
    configSummary: [
      { label: "基础配置", value: "角色指令 · 开场白 · 推荐问题" },
      { label: "能力配置", value: "模型 · 知识 · 工具" },
      { label: "关联对象", value: "3 个 · 完整关联链" },
    ],
    resources: RESOURCE_FIXTURES.autonomous_agent,
    relatedObjects: EXPORT_RELATED_OBJECTS.autonomous_agent,
  },
};

export function validateImportFile(fileName: string): string | null {
  if (!fileName.trim()) return "请选择需要导入的配置包。";
  if (!/\.zip$/i.test(fileName)) return "仅支持 Agent Foundry 导出的 ZIP 配置包。";
  return null;
}

export function buildImportPreview(
  objectType: ImportObjectType,
  fileName: string,
  includeWarnings = true,
  relatedObjectMode: RelatedObjectMode = "publish"
): ImportPreview {
  const fixture = OBJECT_FIXTURES[objectType];
  return {
    ...fixture,
    resources: includeWarnings
      ? fixture.resources
      : fixture.resources.map((resource) => ({ ...resource, status: "matched" as const, reason: undefined })),
    fileName,
    objectType,
    relatedObjectMode,
  };
}

export function getPendingResources(preview: ImportPreview) {
  const pendingResources = preview.resources.filter((resource) => resource.status !== "matched");
  if (preview.relatedObjectMode === "draft") {
    return [
      ...pendingResources,
      ...preview.relatedObjects.map((object) => ({
        id: `related-${object.id}`,
        type: IMPORT_OBJECT_LABELS[object.type],
        name: object.name,
        status: "missing" as const,
        reason: "关联对象保存为草稿，主对象引用待重新关联",
      })),
    ];
  }
  return pendingResources;
}

export function buildExportPackageManifest({
  objectType,
  objectName,
  sourceVersion,
  relatedObjects,
}: {
  objectType: ImportObjectType;
  objectName: string;
  sourceVersion?: string;
  relatedObjects: RelatedObjectItem[];
}) {
  const objectLines = relatedObjects.map((item) => `  - type: ${item.type}\n    role: related\n    name: ${item.name}\n    relation_path: ${item.relationPath}`).join("\n");
  return `package_schema_version: "1.0"\nmain_object:\n  type: ${objectType}\n  name: ${objectName}\n  version_no: ${sourceVersion ?? "latest"}\nobjects:\n  - type: ${objectType}\n    role: main\n    name: ${objectName}\n${objectLines ? `${objectLines}\n` : ""}`;
}

export function sanitizeExportFileName(name: string) {
  const normalized = name.trim().replace(/[\\/:*?\"<>|]+/g, "-").replace(/\s+/g, "-");
  return `${normalized || "agent-foundry-config"}-配置包.zip`;
}
