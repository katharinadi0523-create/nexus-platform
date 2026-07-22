import {
  getClawDetail,
  type CapabilityAgentItem,
  type CapabilityKnowledgeItem,
  type CapabilitySkillItem,
  type CapabilityToolItem,
  type ClawDetailData,
} from "@/lib/mock/claw-hub-next";

const DISPLAY_KEYS = new Set([
  "name",
  "description",
  "badge",
  "target",
  "meta",
  "summary",
  "hint",
  "scene",
  "label",
  "title",
]);

function replaceClawInText(value: string): string {
  return value
    .replaceAll("Claw配置", "多智能体配置")
    .replaceAll("Claw", "多智能体");
}

function mapDisplayFields<T extends object>(item: T): T {
  const next = { ...item };
  for (const [key, value] of Object.entries(next)) {
    if (typeof value === "string" && DISPLAY_KEYS.has(key)) {
      (next as Record<string, unknown>)[key] = replaceClawInText(value);
    }
  }
  return next;
}

function mapList<T extends object>(
  items: T[] | undefined | null
): T[] {
  return (items ?? []).map((item) => mapDisplayFields(item));
}

function mapAgent(agent: CapabilityAgentItem): CapabilityAgentItem {
  return {
    ...mapDisplayFields(agent),
    resources: agent.resources
      ? {
          skills: mapList(agent.resources.skills as CapabilitySkillItem[]),
          tools: mapList(agent.resources.tools as CapabilityToolItem[]),
          knowledge: mapList(
            agent.resources.knowledge as CapabilityKnowledgeItem[]
          ),
        }
      : agent.resources,
  };
}

/**
 * 多智能体创建页的初始配置数据。
 * 以科研 Claw（claw-scientific-research）为模板，但使用独立 id，
 * 并将面向用户的 Claw 文案替换为「多智能体」。
 */
export function getMultiAgentCreateDetail(): ClawDetailData {
  const template = getClawDetail("claw-scientific-research");
  if (!template) {
    throw new Error("缺少多智能体配置模板数据");
  }

  const { tools, skills, agents, knowledge } = template.capabilityConfig;

  const capabilityConfig = {
    ...template.capabilityConfig,
    tools: {
      platform: mapList(tools?.platform),
      tenant: mapList(tools?.tenant),
      claw: mapList(tools?.claw),
    },
    skills: {
      platform: mapList(skills?.platform),
      tenant: mapList(skills?.tenant),
      claw: mapList(skills?.claw),
    },
    // knowledge 只有 tenant / claw，没有 platform
    knowledge: {
      tenant: mapList(knowledge?.tenant),
      claw: mapList(knowledge?.claw),
    },
    agents: {
      platform: (agents?.platform ?? []).map(mapAgent),
      tenant: (agents?.tenant ?? []).map(mapAgent),
      claw: (agents?.claw ?? []).map(mapAgent),
    },
  };

  return {
    ...template,
    overview: {
      ...template.overview,
      id: "multi-agent-create",
      name: "未命名多智能体",
      summary:
        "主智能体统筹多个子智能体协作完成复杂任务，支持技能、插件、知识与调试预览。",
      publishStatus: "未发布",
      version: "草稿",
      scene: replaceClawInText(template.overview.scene ?? ""),
    },
    capabilityConfig,
  };
}
