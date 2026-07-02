import type { ToolConfigKind } from "@/components/claw-hub-next/tool-config-dialog";
import { KNOWLEDGE_PANEL_ITEMS, TOOL_CONFIG_KIND_LABELS } from "@/components/claw-hub-next/detail/constants";
import type { ClawDetailData, ClawHubListItem } from "@/lib/mock/claw-hub-next";

export interface AgentBomTreeNode {
  id: string;
  label: string;
  count?: number;
  detail?: string;
  children?: AgentBomTreeNode[];
}

const TOOL_KIND_ORDER: ToolConfigKind[] = ["mcp", "plugin", "workflow", "ontology_action"];

function countEnabledTools(detail: ClawDetailData) {
  const counts: Record<ToolConfigKind, number> = {
    mcp: 0,
    plugin: 0,
    workflow: 0,
    ontology_action: 0,
  };

  const allTools = [
    ...detail.capabilityConfig.tools.platform,
    ...detail.capabilityConfig.tools.tenant,
    ...detail.capabilityConfig.tools.claw,
  ].filter((tool) => tool.enabled);

  allTools.forEach((tool) => {
    const kind = tool.kind ?? "plugin";
    counts[kind] += 1;
  });

  return counts;
}

function countEnabledSkills(detail: ClawDetailData) {
  return [
    ...detail.capabilityConfig.skills.platform,
    ...detail.capabilityConfig.skills.tenant,
    ...detail.capabilityConfig.skills.claw,
  ].filter((skill) => skill.enabled).length;
}

function countKnowledgeAssets(detail: ClawDetailData) {
  const assets =
    detail.knowledgeAssets ??
    ({
      knowledgeBases: [],
      databases: [],
      ontologyObjects: [],
      termBanks: [],
    } as NonNullable<ClawDetailData["knowledgeAssets"]>);

  return {
    "knowledge-base": assets.knowledgeBases.filter((item) => item.enabled).length,
    database: assets.databases.filter((item) => item.enabled).length,
    ontology: assets.ontologyObjects.filter((item) => item.enabled).length,
    "term-bank": assets.termBanks.filter((item) => item.enabled).length,
  };
}

export function buildAgentBomTreeFromDetail(detail: ClawDetailData): AgentBomTreeNode[] {
  const toolCounts = countEnabledTools(detail);
  const skillCount = countEnabledSkills(detail);
  const knowledgeCounts = countKnowledgeAssets(detail);
  const coreFileCount = detail.coreFiles.length;
  const enabledRules = detail.securityManagement.toolProtection.rules.filter((rule) => rule.enabled).length;

  return [
    {
      id: "agent-config",
      label: "智能体配置",
      children: [
        {
          id: "core-files",
          label: "Agent.md",
          count: coreFileCount,
        },
        {
          id: "model",
          label: "模型配置",
          detail: detail.overview.model,
        },
        {
          id: "runtime",
          label: "运行时资源",
          detail: `${detail.resourceConfig.runtime.tier} · ${detail.resourceConfig.execution.tier}`,
        },
      ],
    },
    {
      id: "plugins",
      label: "插件",
      children: TOOL_KIND_ORDER.map((kind) => ({
        id: `plugin-${kind}`,
        label: TOOL_CONFIG_KIND_LABELS[kind],
        count: toolCounts[kind],
      })),
    },
    {
      id: "skills",
      label: "技能",
      count: skillCount,
      children: [
        { id: "skills-preset", label: "内置技能", count: detail.capabilityConfig.skills.platform.filter((s) => s.enabled).length },
        { id: "skills-claw", label: "Claw 配置", count: detail.capabilityConfig.skills.claw.filter((s) => s.enabled).length },
      ],
    },
    {
      id: "knowledge",
      label: "知识",
      children: KNOWLEDGE_PANEL_ITEMS.map((panel) => ({
        id: `knowledge-${panel.key}`,
        label: panel.label,
        count: knowledgeCounts[panel.key],
      })),
    },
    {
      id: "security",
      label: "安全配置",
      children: [
        {
          id: "autonomy",
          label: "自主性边界",
          count: detail.securityManagement.autonomyBoundaries.length,
        },
        {
          id: "tool-protection",
          label: "工具防护",
          count: enabledRules,
          detail: detail.securityManagement.toolProtection.enabled ? "已启用" : "未启用",
        },
        {
          id: "audit",
          label: "审计开关",
          detail: "会话审计 · 安全事件",
        },
      ],
    },
  ];
}

export function buildAgentBomTreeFromListItem(item: ClawHubListItem): AgentBomTreeNode[] {
  const isPublished = item.publishStatus === "已发布";

  return [
    {
      id: "agent-config",
      label: "智能体配置",
      children: [
        { id: "core-files", label: "Agent.md", count: 1 },
        { id: "model", label: "模型配置", detail: item.model },
        { id: "version", label: "发布版本", detail: isPublished ? "已签名快照" : "草稿" },
      ],
    },
    {
      id: "plugins",
      label: "插件",
      children: TOOL_KIND_ORDER.map((kind) => ({
        id: `plugin-${kind}`,
        label: TOOL_CONFIG_KIND_LABELS[kind],
        count: kind === "mcp" && item.model.includes("MCP") ? 2 : kind === "plugin" ? 1 : 0,
      })),
    },
    {
      id: "skills",
      label: "技能",
      count: item.model.includes("技能") ? 3 : 2,
      children: [
        { id: "skills-preset", label: "内置技能", count: 1 },
        { id: "skills-claw", label: "Claw 配置", count: item.model.includes("技能") ? 2 : 1 },
      ],
    },
    {
      id: "knowledge",
      label: "知识",
      children: KNOWLEDGE_PANEL_ITEMS.map((panel) => ({
        id: `knowledge-${panel.key}`,
        label: panel.label,
        count: panel.key === "knowledge-base" && item.model.includes("知识") ? 2 : panel.key === "ontology" && item.model.includes("本体") ? 1 : 0,
      })),
    },
    {
      id: "security",
      label: "安全配置",
      children: [
        { id: "autonomy", label: "自主性边界", count: 4 },
        { id: "tool-protection", label: "工具防护", count: 4, detail: "已启用" },
        { id: "audit", label: "审计开关", detail: "会话审计 · 安全事件" },
      ],
    },
  ];
}
