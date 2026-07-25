/**
 * Enterprise agents plaza catalog ported from 会话交互 `data.js`
 * (`enterpriseAgents`, `enterpriseAgentSourceScopeTabs`, `enterpriseAgentCategoryTabs`)
 * with catalog enrichment matching `app.js` seed rules.
 */

export type EnterpriseAgentSourceScope = "all" | "favorite" | "org";
export type EnterpriseAgentSourceType = "platform" | "org";
export type EnterpriseAgentSort = "latest" | "hot";

export interface EnterpriseAgentSourceScopeTab {
  id: EnterpriseAgentSourceScope;
  label: string;
}

export interface EnterpriseAgentCategoryTab {
  id: string;
  label: string;
}

export interface EnterpriseAgentRaw {
  id: string;
  name: string;
  description: string;
  category: string;
  researchMultiAgent?: boolean;
  publishedAt?: string;
  usageCount?: number;
  favoriteCount?: number;
  shareCount?: number;
  sourceType?: EnterpriseAgentSourceType;
  isFavorite?: boolean;
  chatFlowKey?: string;
  suggestedPrompts?: string[];
}

export interface EnterpriseAgent extends Required<
  Pick<
    EnterpriseAgentRaw,
    | "id"
    | "name"
    | "description"
    | "category"
    | "publishedAt"
    | "usageCount"
    | "favoriteCount"
    | "shareCount"
    | "sourceType"
    | "isFavorite"
  >
> {
  researchMultiAgent?: boolean;
  chatFlowKey?: string;
  suggestedPrompts?: string[];
  /** Display tags derived from category / capabilities (cards). */
  tags: string[];
}

export const ENTERPRISE_AGENT_SOURCE_SCOPE_TABS: EnterpriseAgentSourceScopeTab[] =
  [
    { id: "all", label: "全部" },
    { id: "favorite", label: "我的收藏" },
    { id: "org", label: "我的组织" },
  ];

export const ENTERPRISE_AGENT_CATEGORY_TABS: EnterpriseAgentCategoryTab[] = [
  { id: "all", label: "全部" },
  { id: "product_design", label: "产品设计" },
  { id: "software_dev", label: "软件开发" },
  { id: "project_management", label: "项目管理" },
  { id: "marketing", label: "市场营销" },
  { id: "sales", label: "销售" },
  { id: "quality_testing", label: "质量测试" },
  { id: "strategic_analysis", label: "战略分析" },
  { id: "scientific_research", label: "科研实验" },
  { id: "media", label: "媒体" },
];

/** Raw list from 会话交互/data.js `enterpriseAgents` (16 agents). */
export const ENTERPRISE_AGENTS_RAW: EnterpriseAgentRaw[] = [
  {
    id: "research-claw",
    name: "科研智能体",
    description: "多智能体科研协作：假设、文献、绘图、论文生成与审核。",
    category: "scientific_research",
    researchMultiAgent: true,
    publishedAt: "2026-07-12",
    usageCount: 12800,
    isFavorite: true,
    suggestedPrompts: [
      "请研究生成式 AI 对科研协作效率的影响，并形成带图表的论文。",
    ],
  },
  {
    id: "cloud-factory-ops",
    name: "云码工厂维护专员",
    description: "自动化维护云码工厂迭代、故事、任务、缺陷等",
    category: "software_dev",
    chatFlowKey: "cloudFactoryOps",
  },
  {
    id: "prd-writer",
    name: "PRD写手",
    description:
      "把需求要点整理为可评审的 PRD：场景、流程、边界与验收口径一次写清楚。",
    category: "product_design",
    chatFlowKey: "prdWriter",
  },
  {
    id: "product-planning",
    name: "产品规划专家",
    description:
      "结合机会与组织能力拆解节奏与里程碑，输出路线图级规划与优先级建议。",
    category: "product_design",
  },
  {
    id: "market-insight",
    name: "市场洞察",
    description:
      "汇聚行业信号、竞品动作与用户线索，沉淀成可执行的小结与下一步假设。",
    category: "marketing",
    chatFlowKey: "marketInsight",
  },
  {
    id: "vibe-coder",
    name: "Vibe Coder",
    description:
      "以快速原型为导向，把想法落成可点可用的小功能，加速试错与演示闭环。",
    category: "software_dev",
    chatFlowKey: "vibeCoder",
  },
  {
    id: "architect",
    name: "资深架构师",
    description:
      "在高并发与演进约束下给出分层、边界与关键技术取舍，控制长期复杂度。",
    category: "software_dev",
  },
  {
    id: "content-creator",
    name: "内容创作专家",
    description:
      "产出品牌一致的传播与营销文案，兼顾要点提炼、叙事结构与多平台适配。",
    category: "media",
    chatFlowKey: "contentCreator",
  },
  {
    id: "senior-dev",
    name: "高级开发工程师",
    description:
      "落地核心业务功能，关注性能、可观测性、代码规范与线上稳定性。",
    category: "software_dev",
    chatFlowKey: "seniorDev",
  },
  {
    id: "ml-engineer",
    name: "模型训练算法工程师",
    description:
      "围绕任务的数据处理、训练策略与评测闭环迭代，持续提升模型效果与成本。",
    category: "scientific_research",
    suggestedPrompts: [
      "请帮我设计一个小规模文本分类实验方案：数据标注规范、训练/验证划分、基线模型选型与评测指标。",
    ],
  },
  {
    id: "ui-designer",
    name: "UI设计师",
    description:
      "以可用性与一致性为核心，完善信息架构、组件规范与关键界面表达。",
    category: "product_design",
    suggestedPrompts: [
      "请围绕企业级智能体广场与 Chat 联动，输出一版关键界面的信息架构、组件拆分与空态/加载态建议。",
    ],
  },
  {
    id: "pm-senior",
    name: "高级项目经理",
    description:
      "统筹范围、风险与干系人沟通，保障里程碑透明交付与问题及时上升。",
    category: "project_management",
    chatFlowKey: "seniorProjectManager",
    suggestedPrompts: [
      "请帮我把当前跨团队需求拆成两周节奏：里程碑、依赖、风险登记与干系人沟通要点。",
    ],
  },
  {
    id: "agent-orchestrator",
    name: "智能体编排师",
    description:
      "设计多智能体协同工作流，编排工具调用、知识检索与人类审核节点。",
    category: "software_dev",
    suggestedPrompts: [
      "请把「用户提问 → 多智能体分工 → 工具调用 → 人工审核」的典型链路拆成可编排节点与异常分支。",
    ],
  },
  {
    id: "security",
    name: "网安专家",
    description:
      "从威胁建模、访问控制到合规检查，给出加固清单、审计要点与演练建议。",
    category: "quality_testing",
    suggestedPrompts: [
      "请对企业级智能体接入场景做一次简要威胁建模，列出关键控制点、审计要点与演练建议。",
    ],
  },
  {
    id: "strategy",
    name: "战略咨询顾问",
    description:
      "用结构化方法澄清商业问题，支持决策材料、关键假设验证与路径推演。",
    category: "strategic_analysis",
    suggestedPrompts: [
      "请用一页纸结构梳理某业务线的增长假设、验证路径、资源投入与止损条件，便于上会讨论。",
    ],
  },
  {
    id: "sdet",
    name: "测开工程师",
    description:
      "建设自动化测试与质量门禁，覆盖接口、端到端与持续集成中的回归效率。",
    category: "quality_testing",
    suggestedPrompts: [
      "请为关键接口与核心用户路径给出自动化测试分层、回归门禁与 CI 集成要点建议。",
    ],
  },
];

const CATEGORY_LABEL_MAP = Object.fromEntries(
  ENTERPRISE_AGENT_CATEGORY_TABS.filter((tab) => tab.id !== "all").map((tab) => [
    tab.id,
    tab.label,
  ])
) as Record<string, string>;

function buildTags(agent: EnterpriseAgentRaw): string[] {
  const tags: string[] = [];
  const categoryLabel = CATEGORY_LABEL_MAP[agent.category];
  if (categoryLabel) tags.push(categoryLabel);
  if (agent.researchMultiAgent || agent.id === "research-claw") {
    tags.push("多智能体");
  }
  if (agent.chatFlowKey) tags.push("对话流程");
  return tags;
}

function enrichAgent(agent: EnterpriseAgentRaw, index: number): EnterpriseAgent {
  const seed = [...agent.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const day = String(5 + (seed % 20)).padStart(2, "0");
  const month = String(3 + (index % 2)).padStart(2, "0");

  return {
    ...agent,
    publishedAt: agent.publishedAt || `2026-${month}-${day}`,
    usageCount: agent.usageCount ?? 900 + (seed % 4100),
    favoriteCount: agent.favoriteCount ?? 35 + (seed % 360),
    shareCount: agent.shareCount ?? 8 + (seed % 140),
    sourceType:
      agent.sourceType ||
      (index % 4 === 1 || index % 4 === 2 ? "org" : "platform"),
    isFavorite: agent.isFavorite ?? index % 6 === 0,
    tags: buildTags(agent),
  };
}

/** Enriched catalog used by plaza + summon resolution. */
export const ENTERPRISE_AGENT_CATALOG: EnterpriseAgent[] =
  ENTERPRISE_AGENTS_RAW.map(enrichAgent);

/** Alias for callers that prefer a shorter catalog name. */
export const ENTERPRISE_AGENTS = ENTERPRISE_AGENT_CATALOG;

export function getEnterpriseAgentById(
  agentId: string
): EnterpriseAgent | undefined {
  return ENTERPRISE_AGENT_CATALOG.find((agent) => agent.id === agentId);
}

/** Lightweight options for chat agent selector chips. */
export function getEnterpriseAgentOptions(): Array<{
  id: string;
  name: string;
  description: string;
}> {
  return ENTERPRISE_AGENT_CATALOG.map((agent) => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
  }));
}

export function getEnterpriseAgentCategoryLabel(categoryId: string): string {
  return CATEGORY_LABEL_MAP[categoryId] ?? categoryId;
}

export function formatEnterpriseMetric(value: number): string {
  const n = Number(value) || 0;
  return n >= 10000
    ? `${(n / 10000).toFixed(1)}万`
    : n.toLocaleString("zh-CN");
}

export function isResearchClawAgent(
  agent: Pick<EnterpriseAgent, "id" | "researchMultiAgent"> | null | undefined
): boolean {
  return Boolean(agent && (agent.researchMultiAgent || agent.id === "research-claw"));
}

export interface FilterEnterpriseAgentsOptions {
  query?: string;
  category?: string;
  sourceScope?: EnterpriseAgentSourceScope;
  sort?: EnterpriseAgentSort;
  favoriteOverrides?: Record<string, boolean>;
}

export function isEnterpriseAgentFavorite(
  agent: EnterpriseAgent,
  favoriteOverrides?: Record<string, boolean>
): boolean {
  if (favoriteOverrides && favoriteOverrides[agent.id] !== undefined) {
    return favoriteOverrides[agent.id];
  }
  return Boolean(agent.isFavorite);
}

/** Filter + sort matching 会话交互 `filterEnterpriseAgentList`. */
export function filterEnterpriseAgentList(
  options: FilterEnterpriseAgentsOptions = {}
): EnterpriseAgent[] {
  const query = (options.query ?? "").trim().toLowerCase();
  const categoryId = options.category || "all";
  const sourceScope = options.sourceScope || "all";
  const sort = options.sort || "latest";
  const favoriteOverrides = options.favoriteOverrides;

  let list = ENTERPRISE_AGENT_CATALOG.filter((agent) => {
    if (
      sourceScope === "favorite" &&
      !isEnterpriseAgentFavorite(agent, favoriteOverrides)
    ) {
      return false;
    }
    if (sourceScope === "org" && agent.sourceType !== "org") return false;
    if (categoryId !== "all" && agent.category !== categoryId) return false;
    if (!query) return true;
    const blob = `${agent.name}${agent.description}${agent.tags.join("")}`.toLowerCase();
    return blob.includes(query);
  });

  list = [...list].sort((left, right) => {
    if (left.id === "research-claw" && right.id !== "research-claw") return -1;
    if (right.id === "research-claw" && left.id !== "research-claw") return 1;
    if (sort === "hot") {
      return right.usageCount - left.usageCount;
    }
    return String(right.publishedAt).localeCompare(String(left.publishedAt));
  });

  return list;
}

/** Alias used by some callers / barrel re-exports. */
export const filterEnterpriseAgents = filterEnterpriseAgentList;

export function getAgentAvatarInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "智";
  return trimmed.slice(0, 1);
}

/** Compatibility alias for category / source tab shapes. */
export type EnterpriseAgentTab =
  | EnterpriseAgentSourceScopeTab
  | EnterpriseAgentCategoryTab;
