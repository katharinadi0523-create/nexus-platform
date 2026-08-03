import {
  AGENT_VERSION_HISTORY,
  buildVersionCompositionData,
  type AgentBomResource,
  type AgentSnapshotSummary,
  type AgentVersionRecord,
} from "@/lib/mock/agent-version-management";

export type VersionedEntityKind = "claw" | "multi-agent";

const VERSION_DESCRIPTIONS: Record<VersionedEntityKind, Record<string, string>> = {
  claw: {
    V12: "完善知识检索与技能配置",
    V11: "优化输出格式与角色指令",
    V10: "更新行业知识库内容",
    V9: "调整模型推理参数",
    V8: "补充业务对象配置",
    V7: "更新文档解析插件",
    V6: "调整 MCP 服务授权",
    V5: "优化数据分析工具参数",
    V4: "修订角色与行为边界",
    V3: "调整角色指令和工具配置",
    V2: "补充知识与工具配置",
    V1: "首次发布 Claw",
  },
  "multi-agent": {
    V12: "完善子智能体协作与知识资源配置",
    V11: "优化主智能体汇总输出格式",
    V10: "更新成员共享知识内容",
    V9: "调整主智能体模型参数",
    V8: "补充成员业务对象配置",
    V7: "更新文献解析插件",
    V6: "调整成员 MCP 服务授权",
    V5: "优化数据分析成员工具参数",
    V4: "修订成员角色与协作边界",
    V3: "调整主智能体指令和成员配置",
    V2: "补充成员知识与工具配置",
    V1: "首次发布多智能体",
  },
};

const RESOURCE_NAMES: Record<string, string> = {
  "demo-core-file-agent-md-001": "主配置文件（Agent.md）",
  "demo-kb-safety-manual-001": "演示行业知识库",
  "demo-kb-device-case-001": "演示业务案例库",
  "demo-mcp-device-service-001": "演示业务服务 MCP",
  "demo-ontology-device-001": "演示业务对象本体",
};

const MULTI_AGENT_MEMBER_SCOPE: Record<string, string> = {
  "demo-core-file-agent-md-001": "主智能体",
  "demo-model-qwen3-32b-001": "主智能体",
  "demo-kb-safety-manual-001": "文献检索智能体",
  "demo-kb-device-case-001": "主智能体、文献检索智能体",
  "demo-plugin-document-parser-001": "文献检索智能体",
  "demo-tool-data-analyzer-001": "数据分析智能体",
  "demo-mcp-device-service-001": "主智能体",
  "demo-ontology-device-001": "主智能体",
  "demo-plugin-legacy-parser-001": "主智能体",
};
const MULTI_AGENT_MEMBERS = {
  main: { id: "demo-member-agent-main-001", name: "主智能体", role: "任务规划与结果汇总" },
  hypothesis: { id: "demo-member-agent-hypothesis-001", name: "假设生成智能体", role: "研究假设生成" },
  literature: { id: "demo-member-agent-literature-001", name: "文献检索智能体", role: "文献检索与证据整理" },
  drawing: { id: "demo-member-agent-drawing-001", name: "科研绘图智能体", role: "科研图表生成" },
  writing: { id: "demo-member-agent-writing-001", name: "论文生成智能体", role: "论文内容生成" },
  review: { id: "demo-member-agent-review-001", name: "论文审核智能体", role: "论文质量审核" },
  archive: { id: "demo-member-agent-archive-001", name: "资料整理智能体", role: "研究资料归档" },
} as const;

type MultiAgentMemberKey = keyof typeof MULTI_AGENT_MEMBERS;

const MULTI_AGENT_MEMBER_VERSIONS: Record<
  string,
  Array<{ key: MultiAgentMemberKey; status: "启用" | "停用"; fingerprint: string }>
> = {
  V12: [
    { key: "main", status: "启用", fingerprint: "cfg:member-main-v12" },
    { key: "hypothesis", status: "启用", fingerprint: "cfg:member-hypothesis-v8" },
    { key: "literature", status: "停用", fingerprint: "cfg:member-literature-v11" },
    { key: "drawing", status: "启用", fingerprint: "cfg:member-drawing-v9" },
    { key: "writing", status: "启用", fingerprint: "cfg:member-writing-v10" },
    { key: "review", status: "启用", fingerprint: "cfg:member-review-v12" },
  ],
  V11: [
    { key: "main", status: "启用", fingerprint: "cfg:member-main-v11" },
    { key: "hypothesis", status: "启用", fingerprint: "cfg:member-hypothesis-v8" },
    { key: "literature", status: "启用", fingerprint: "cfg:member-literature-v11" },
    { key: "drawing", status: "启用", fingerprint: "cfg:member-drawing-v9" },
    { key: "writing", status: "启用", fingerprint: "cfg:member-writing-v10" },
    { key: "archive", status: "启用", fingerprint: "cfg:member-archive-v7" },
  ],
};

function buildMultiAgentMembers(versionLabel: string): AgentBomResource[] {
  const fallback = MULTI_AGENT_MEMBER_VERSIONS.V11;
  const definitions = MULTI_AGENT_MEMBER_VERSIONS[versionLabel] ?? fallback;
  return definitions.map(({ key, status, fingerprint }) => {
    const member = MULTI_AGENT_MEMBERS[key];
    return {
      id: member.id,
      category: "成员智能体",
      name: member.name,
      memberScope: member.role,
      availabilityStatus: status,
      versionEvidence: fingerprint,
      traceability: "完整可追溯",
      change: "未变化",
    };
  });
}
function mapResource(resource: AgentBomResource, kind: VersionedEntityKind): AgentBomResource {
  return {
    ...resource,
    name: RESOURCE_NAMES[resource.id] ?? resource.name,
    memberScope: kind === "multi-agent" ? MULTI_AGENT_MEMBER_SCOPE[resource.id] ?? "主智能体" : undefined,
  };
}

export function createEntityVersionHistory({
  kind,
  objectId,
  objectName,
}: {
  kind: VersionedEntityKind;
  objectId: string;
  objectName: string;
}): AgentVersionRecord[] {
  const objectType = kind === "claw" ? "Claw" : "多智能体";
  const idPrefix = kind === "claw" ? "claw" : "multi-agent";

  return AGENT_VERSION_HISTORY.map((version) => {
    const versionSlug = version.label.toLowerCase();
    const resources = [
      ...(kind === "multi-agent" ? buildMultiAgentMembers(version.label) : []),
      ...version.resources.map((resource) => mapResource(resource, kind)),
    ];
    const snapshot: AgentSnapshotSummary = {
      ...version.snapshot,
      snapshotId: `demo-snapshot-${idPrefix}-001-${versionSlug}`,
      objectId,
      objectName,
      objectType,
      releaseRecord: `${version.label} / demo-release-${idPrefix}-001-${versionSlug}`,
      resourceCount: resources.length,
      categoryCount: new Set(resources.map((resource) => resource.category)).size,
    };
    const composition = buildVersionCompositionData(snapshot, resources, version.label);

    return {
      ...version,
      id: `${idPrefix}-${version.id}`,
      description: VERSION_DESCRIPTIONS[kind][version.label] ?? version.description,
      versionId: `demo-version-${idPrefix}-001-${versionSlug}`,
      restoreIssues: version.restoreIssues?.map((issue) => ({
        ...issue,
        resourceName: RESOURCE_NAMES[issue.resourceId] ?? issue.resourceName,
      })),
      snapshot,
      ...composition,
      resources,
    };
  });
}
