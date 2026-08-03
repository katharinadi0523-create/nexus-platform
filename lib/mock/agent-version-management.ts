export type AgentTraceabilityStatus = "完整可追溯" | "基础可追溯" | "追溯受限";
export type AgentResourceChange = "新增" | "移除" | "变化" | "未变化";
export type AgentVersionAvailability = "启用" | "停用";

export interface AgentRestoreIssue {
  resourceId: string;
  resourceName: string;
  category: string;
  reason: "资源已删除" | "无权访问" | "需要重新授权";
}

export interface AgentBomResource {
  id: string;
  category: string;
  name: string;
  versionEvidence: string;
  traceability: AgentTraceabilityStatus;
  change: AgentResourceChange;
  memberScope?: string;
  availabilityStatus?: "启用" | "停用";
}

export type AgentCompositionNodeType = "root" | "group" | "member" | "workflow-node" | "resource" | "config";
export type AgentCompositionBindingType = "contains" | "mounts" | "connects";

export interface AgentConfigSnapshot {
  objectId: string;
  objectType: AgentSnapshotSummary["objectType"];
  versionLabel: string;
  frozenAt: string;
  immutable: true;
  resourceStableIds: string[];
}

export interface AgentCompositionNodeRecord {
  stableId: string;
  parentStableId?: string;
  nodeType: AgentCompositionNodeType;
  name: string;
  category?: string;
  status?: string;
}

export interface AgentCompositionBinding {
  stableId: string;
  sourceStableId: string;
  targetStableId: string;
  bindingType: AgentCompositionBindingType;
  order?: number;
}
export interface AgentSnapshotSummary {
  snapshotId: string;
  objectId: string;
  objectName: string;
  objectType: "自主规划智能体" | "工作流智能体" | "Claw" | "多智能体";
  releaseRecord: string;
  publisher: string;
  frozenAt: string;
  publishedAt: string;
  scope: string;
  resourceCount: number;
  categoryCount: number;
}

export interface AgentVersionRecord {
  id: string;
  label: string;
  isLatest?: boolean;
  isReferenced?: boolean;
  referenceCount?: number;
  availabilityStatus: AgentVersionAvailability;
  description: string;
  publisher: string;
  publishedAt: string;
  versionId: string;
  restoreIssues?: AgentRestoreIssue[];
  snapshot: AgentSnapshotSummary;
  configSnapshot: AgentConfigSnapshot;
  compositionNodes: AgentCompositionNodeRecord[];
  compositionBindings: AgentCompositionBinding[];
  resources: AgentBomResource[];
}

const RESOURCES_V4: AgentBomResource[] = [
  {
    id: "demo-core-file-agent-md-001",
    category: "核心文件",
    name: "角色指令（Agent.md）",
    versionEvidence: "内容指纹 sha256:demo-a41f",
    traceability: "完整可追溯",
    change: "变化",
  },
  {
    id: "demo-model-qwen3-32b-001",
    category: "模型",
    name: "Qwen3-32B 演示模型",
    versionEvidence: "模型版本 demo-2026.07",
    traceability: "完整可追溯",
    change: "未变化",
  },
  {
    id: "demo-kb-safety-manual-001",
    category: "知识库",
    name: "演示安全规程知识库",
    versionEvidence: "内容指纹 sha256:demo-18bd",
    traceability: "基础可追溯",
    change: "变化",
  },
  {
    id: "demo-kb-device-case-001",
    category: "知识库",
    name: "演示设备案例库",
    versionEvidence: "资源引用 demo-ref-021",
    traceability: "追溯受限",
    change: "新增",
  },
  {
    id: "demo-plugin-document-parser-001",
    category: "插件与工具",
    name: "演示文档解析插件",
    versionEvidence: "配置指纹 cfg:demo-731a",
    traceability: "基础可追溯",
    change: "未变化",
  },
  {
    id: "demo-tool-data-analyzer-001",
    category: "插件与工具",
    name: "演示数据分析工具",
    versionEvidence: "配置指纹 cfg:demo-98f2",
    traceability: "基础可追溯",
    change: "变化",
  },
  {
    id: "demo-mcp-device-service-001",
    category: "MCP",
    name: "演示设备服务 MCP",
    versionEvidence: "授权状态：发布时有效",
    traceability: "追溯受限",
    change: "未变化",
  },
  {
    id: "demo-ontology-device-001",
    category: "本体",
    name: "演示设备运维本体",
    versionEvidence: "配置指纹 cfg:demo-52ec",
    traceability: "基础可追溯",
    change: "未变化",
  },
];

const LEGACY_RESOURCE: AgentBomResource = {
  id: "demo-plugin-legacy-parser-001",
  category: "插件与工具",
  name: "演示旧版文本解析插件",
  versionEvidence: "插件版本 demo-1.6",
  traceability: "完整可追溯",
  change: "移除",
};

function buildResources(
  omittedIds: string[] = [],
  evidenceOverrides: Record<string, string> = {},
  extraResources: AgentBomResource[] = []
): AgentBomResource[] {
  return [
    ...RESOURCES_V4
      .filter((resource) => !omittedIds.includes(resource.id))
      .map((resource) => ({
        ...resource,
        versionEvidence: evidenceOverrides[resource.id] ?? resource.versionEvidence,
        change: "未变化" as const,
      })),
    ...extraResources.map((resource) => ({ ...resource })),
  ];
}

function createSnapshot(
  label: string,
  frozenAt: string,
  publishedAt: string,
  resources: AgentBomResource[]
): AgentSnapshotSummary {
  const version = label.toLowerCase().replace(".", "-");
  return {
    snapshotId: `demo-snapshot-agent-001-${version}`,
    objectId: "demo-agent-autonomous-001",
    objectName: "演示设备运维智能体",
    objectType: "自主规划智能体",
    releaseRecord: `${label} / demo-release-agent-001-${version}`,
    publisher: "用户A",
    frozenAt,
    publishedAt,
    scope: "某能源集团 / 演示租户 / 演示项目",
    resourceCount: resources.length,
    categoryCount: new Set(resources.map((resource) => resource.category)).size,
  };
}

export function buildVersionCompositionData(
  snapshot: AgentSnapshotSummary,
  resources: AgentBomResource[],
  versionLabel: string
): Pick<AgentVersionRecord, "configSnapshot" | "compositionNodes" | "compositionBindings"> {
  const rootStableId = `root:${snapshot.objectId}`;
  const groupMap = new Map<string, AgentCompositionNodeRecord>();
  const compositionNodes: AgentCompositionNodeRecord[] = [
    {
      stableId: rootStableId,
      nodeType: "root",
      name: snapshot.objectName,
      status: "已发布",
    },
  ];
  const compositionBindings: AgentCompositionBinding[] = [];

  resources.forEach((resource, index) => {
    const groupName = snapshot.objectType === "多智能体"
      ? resource.category === "成员智能体" ? "成员智能体" : resource.memberScope ?? "共享资源"
      : resource.category;
    const groupStableId = `group:${snapshot.objectId}:${groupName}`;
    if (!groupMap.has(groupStableId)) {
      const groupNode: AgentCompositionNodeRecord = {
        stableId: groupStableId,
        parentStableId: rootStableId,
        nodeType: resource.category === "成员智能体" ? "member" : "group",
        name: groupName,
      };
      groupMap.set(groupStableId, groupNode);
      compositionNodes.push(groupNode);
      compositionBindings.push({
        stableId: `binding:${rootStableId}:${groupStableId}`,
        sourceStableId: rootStableId,
        targetStableId: groupStableId,
        bindingType: "contains",
      });
    }

    compositionNodes.push({
      stableId: resource.id,
      parentStableId: groupStableId,
      nodeType: resource.category === "成员智能体" ? "member" : "resource",
      name: resource.name,
      category: resource.category,
      status: resource.availabilityStatus ?? "已配置",
    });
    compositionBindings.push({
      stableId: `binding:${groupStableId}:${resource.id}`,
      sourceStableId: groupStableId,
      targetStableId: resource.id,
      bindingType: resource.category === "成员智能体" ? "contains" : "mounts",
      order: index,
    });
  });

  if (snapshot.objectType === "工作流智能体") {
    resources.slice(1).forEach((resource, index) => {
      compositionBindings.push({
        stableId: `connection:${resources[index].id}:${resource.id}`,
        sourceStableId: resources[index].id,
        targetStableId: resource.id,
        bindingType: "connects",
        order: index,
      });
    });
  }

  return {
    configSnapshot: {
      objectId: snapshot.objectId,
      objectType: snapshot.objectType,
      versionLabel,
      frozenAt: snapshot.frozenAt,
      immutable: true,
      resourceStableIds: resources.map((resource) => resource.id),
    },
    compositionNodes,
    compositionBindings,
  };
}
function createVersion({
  label,
  description,
  publishedAt,
  frozenAt,
  resources,
  isLatest,
  isReferenced,
  referenceCount,
  availabilityStatus = "启用",
  restoreIssues,
}: {
  label: string;
  description: string;
  publishedAt: string;
  frozenAt: string;
  resources: AgentBomResource[];
  isLatest?: boolean;
  isReferenced?: boolean;
  referenceCount?: number;
  availabilityStatus?: AgentVersionAvailability;
  restoreIssues?: AgentRestoreIssue[];
}): AgentVersionRecord {
  const versionSlug = label.toLowerCase().replace(".", "-");
  const snapshot = createSnapshot(label, frozenAt, publishedAt, resources);
  const composition = buildVersionCompositionData(snapshot, resources, label);
  return {
    id: `version-${versionSlug}`,
    label,
    isLatest,
    isReferenced,
    referenceCount: referenceCount ?? (isReferenced ? 1 : 0),
    availabilityStatus,
    description,
    publisher: "用户A",
    publishedAt,
    versionId: `demo-version-agent-001-${versionSlug}`,
    restoreIssues,
    snapshot,
    ...composition,
    resources,
  };
}

const RESOURCES_V3 = buildResources(
  ["demo-kb-device-case-001"],
  {
    "demo-core-file-agent-md-001": "内容指纹 sha256:demo-83ce",
    "demo-kb-safety-manual-001": "内容指纹 sha256:demo-0f92",
    "demo-tool-data-analyzer-001": "配置指纹 cfg:demo-447b",
  }
);

const RESOURCES_V2 = buildResources(
  ["demo-kb-device-case-001", "demo-tool-data-analyzer-001"],
  {
    "demo-core-file-agent-md-001": "内容指纹 sha256:demo-63ac",
    "demo-kb-safety-manual-001": "内容指纹 sha256:demo-0f92",
  }
);

const RESOURCES_V1 = buildResources(
  ["demo-kb-device-case-001", "demo-tool-data-analyzer-001", "demo-mcp-device-service-001", "demo-ontology-device-001"],
  {
    "demo-core-file-agent-md-001": "内容指纹 sha256:demo-21d0",
    "demo-kb-safety-manual-001": "内容指纹 sha256:demo-7ca1",
  },
  [LEGACY_RESOURCE]
);

export const AGENT_VERSION_HISTORY: AgentVersionRecord[] = [
  createVersion({
    label: "V12",
    isLatest: true,
    isReferenced: true,
    referenceCount: 3,
    description: "完善知识检索策略与设备案例覆盖",
    publishedAt: "2026-07-28 16:35",
    frozenAt: "2026-07-28 16:34:42",
    resources: RESOURCES_V4,
  }),
  createVersion({
    label: "V11",
    description: "优化设备故障分析结果格式",
    publishedAt: "2026-07-27 18:10",
    frozenAt: "2026-07-27 18:09:36",
    resources: buildResources(["demo-kb-device-case-001"], { "demo-core-file-agent-md-001": "内容指纹 sha256:demo-9c31" }),
  }),
  createVersion({
    label: "V10",
    isReferenced: true,
    referenceCount: 2,
    description: "更新安全规程知识内容",
    publishedAt: "2026-07-27 10:42",
    frozenAt: "2026-07-27 10:41:28",
    resources: buildResources(["demo-kb-device-case-001"], { "demo-kb-safety-manual-001": "内容指纹 sha256:demo-14ae" }),
  }),
  createVersion({
    label: "V9",
    description: "调整模型推理参数配置",
    publishedAt: "2026-07-26 17:18",
    frozenAt: "2026-07-26 17:17:43",
    resources: buildResources(["demo-kb-device-case-001"], { "demo-model-qwen3-32b-001": "模型版本 demo-2026.06" }),
  }),
  createVersion({
    label: "V8",
    description: "补充设备运维本体字段",
    publishedAt: "2026-07-26 14:03",
    frozenAt: "2026-07-26 14:02:22",
    resources: buildResources(["demo-kb-device-case-001"], { "demo-ontology-device-001": "配置指纹 cfg:demo-38b1" }),
  }),
  createVersion({
    label: "V7",
    description: "更新文档解析插件配置",
    publishedAt: "2026-07-26 09:26",
    frozenAt: "2026-07-26 09:25:44",
    resources: buildResources(["demo-kb-device-case-001"], { "demo-plugin-document-parser-001": "配置指纹 cfg:demo-61f0" }),
  }),
  createVersion({
    label: "V6",
    availabilityStatus: "停用",
    description: "调整 MCP 服务授权范围",
    publishedAt: "2026-07-25 18:46",
    frozenAt: "2026-07-25 18:45:31",
    resources: buildResources(["demo-kb-device-case-001"], { "demo-mcp-device-service-001": "授权状态：待更新" }),
  }),
  createVersion({
    label: "V5",
    description: "优化数据分析工具参数",
    publishedAt: "2026-07-25 16:12",
    frozenAt: "2026-07-25 16:11:39",
    resources: buildResources(["demo-kb-device-case-001", "demo-ontology-device-001"], { "demo-tool-data-analyzer-001": "配置指纹 cfg:demo-447b" }),
  }),
  createVersion({
    label: "V4",
    description: "修订角色指令边界说明",
    publishedAt: "2026-07-25 13:55",
    frozenAt: "2026-07-25 13:54:47",
    resources: buildResources(["demo-kb-device-case-001", "demo-ontology-device-001"], { "demo-core-file-agent-md-001": "内容指纹 sha256:demo-83ce" }),
  }),
  createVersion({
    label: "V3",
    isReferenced: true,
    referenceCount: 1,
    description: "调整角色指令和数据分析工具配置",
    publishedAt: "2026-07-25 11:20",
    frozenAt: "2026-07-25 11:19:26",
    resources: RESOURCES_V3,
  }),
  createVersion({
    label: "V2",
    description: "补充设备运维知识与工具配置",
    publishedAt: "2026-07-22 09:15",
    frozenAt: "2026-07-22 09:14:31",
    resources: RESOURCES_V2,
    restoreIssues: [
      {
        resourceId: "demo-kb-device-case-001",
        resourceName: "演示设备案例库",
        category: "知识库",
        reason: "资源已删除",
      },
      {
        resourceId: "demo-mcp-device-service-001",
        resourceName: "演示设备服务 MCP",
        category: "MCP",
        reason: "需要重新授权",
      },
    ],
  }),
  createVersion({
    label: "V1",
    description: "首次发布演示智能体",
    publishedAt: "2026-07-18 14:06",
    frozenAt: "2026-07-18 14:05:38",
    resources: RESOURCES_V1,
  }),
];
