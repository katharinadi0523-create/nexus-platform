import { MARKETPLACE_SKILL_SEEDS } from "@/lib/mock/skills-marketplace";

export type MineSkillOrigin = "builtin" | "mine";
export type MineSkillPublisherScope = "system" | "platform" | "organization" | "personal";
export type MineSkillOriginFilter = "all" | MineSkillOrigin;

export interface MineSkillItem {
  id: string;
  name: string;
  description: string;
  creator: string;
  origin: MineSkillOrigin;
  publisherScope?: MineSkillPublisherScope;
  enabled: boolean;
  addedAt?: string;
  updatedAt: string;
  version?: string;
  files?: string[];
  skillMdContent?: string;
  packageFiles?: Array<{ path: string; content: string }>;
  archiveFile?: File;
  scene?: string;
}

export const MINE_SKILL_ORIGIN_TABS: Array<{
  value: MineSkillOriginFilter;
  label: string;
}> = [
  { value: "all", label: "全部" },
  { value: "builtin", label: "内置" },
  { value: "mine", label: "我的" },
];

const SYSTEM_SKILLS_FROM_MARKETPLACE = MARKETPLACE_SKILL_SEEDS.filter(
  (skill) => skill.sourceType === "platform"
).slice(0, 5);
const PUBLISHED_SKILLS_FROM_MARKETPLACE = MARKETPLACE_SKILL_SEEDS.filter(
  (skill) => skill.sourceType === "org"
).slice(0, 3);

const MINE_SEED_SKILLS: MineSkillItem[] = [
  {
    id: "mine-ops-summary",
    name: "运营简报生成器",
    description: "面向每周经营复盘的内部技能，聚焦周报结构化整理与摘要输出。",
    creator: "邸若楠",
    origin: "mine",
    enabled: true,
    addedAt: "2026-07-18 14:20",
    updatedAt: "2026-07-18 14:20",
    version: "1.0",
    files: ["SKILL.md"],
    skillMdContent: `---
name: ops-weekly-brief
description: "沉淀经营周报模板与摘要规范。"
---

# 运营周报整理
- 按经营指标、重点事项、风险和待协调问题组织内容
- 对关键数字注明统计口径和数据周期
- 将待办写明责任人和时间节点
`,
  },
  {
    id: "mine-ai-gov-writing",
    name: "AI产线公文写作",
    description: "面向项目周报、立项请示与会议通知的公文写作技能。",
    creator: "Jing",
    origin: "mine",
    enabled: true,
    addedAt: "2026-07-20 09:45",
    updatedAt: "2026-07-20 09:45",
    version: "1.0",
    files: ["SKILL.md"],
    skillMdContent: `---
name: ai-official-writing
description: "为 AI 产线项目生成规范、正式、可审批的公文与汇报材料。"
---

# Writing Rules
- 先写背景和目标，再写进展、问题和请求
- 行文保持正式、简洁、可执行
- 对关键数字、时间节点和责任人做显式说明
- 涉及风险时同步给出缓释方案和决策建议
`,
  },
  {
    id: "mine-travel-checklist",
    name: "差旅材料核对",
    description: "核对差旅报销材料完整性，提示缺失票据与字段。",
    creator: "邸若楠",
    origin: "mine",
    enabled: false,
    addedAt: "2026-07-12 16:08",
    updatedAt: "2026-07-12 16:08",
    version: "1.0",
    files: ["SKILL.md"],
    skillMdContent: `---
name: travel-expense-checklist
description: "核对差旅报销材料完整性，提示缺失票据与字段。"
---

# 核对步骤
- 检查申请单、行程凭证和费用票据
- 标记缺失材料及需要补充的字段
- 汇总异常项和后续处理建议
`,
  },
  {
    id: "mine-meeting-minutes",
    name: "会议纪要整理",
    description: "将会议录音要点整理为可分发纪要，并提取待办。",
    creator: "Jing",
    origin: "mine",
    enabled: true,
    addedAt: "2026-07-22 11:30",
    updatedAt: "2026-07-22 11:30",
    version: "1.0",
    files: ["SKILL.md"],
    skillMdContent: `---
name: meeting-minutes
description: "将会议录音要点整理为可分发纪要，并提取待办。"
---

# 整理要求
- 按议题归纳讨论结论和关键依据
- 区分已确认结论、待确认事项和风险
- 提取责任人、交付物和完成时间
`,
  },
];

export const INITIAL_MINE_SKILLS: MineSkillItem[] = [
  ...SYSTEM_SKILLS_FROM_MARKETPLACE.map((skill) => ({
    id: `builtin-${skill.id}`,
    name: skill.name,
    description: skill.description,
    creator: skill.author || skill.publishedBy,
    origin: "builtin" as const,
    publisherScope: "system" as const,
    enabled: true,
    addedAt: skill.publishedAt,
    updatedAt: skill.publishedAt,
    version: skill.version ?? "1.0",
    files: skill.files.map((file) => file.path),
    skillMdContent: skill.files.find((file) => file.path === "SKILL.md")?.content,
    packageFiles: skill.files.map((file) => ({ path: file.path, content: file.content })),
  })),
  ...PUBLISHED_SKILLS_FROM_MARKETPLACE.map((skill) => ({
    id: `published-${skill.id}`,
    name: skill.name,
    description: skill.description,
    creator: skill.author || skill.publishedBy,
    origin: "builtin" as const,
    publisherScope: "organization" as const,
    enabled: true,
    addedAt: skill.publishedAt,
    updatedAt: skill.publishedAt,
    version: skill.version ?? "1.0",
    files: skill.files.map((file) => file.path),
    skillMdContent: skill.files.find((file) => file.path === "SKILL.md")?.content,
    packageFiles: skill.files.map((file) => ({ path: file.path, content: file.content })),
  })),
  ...MINE_SEED_SKILLS,
];

export function filterMineSkills(
  skills: MineSkillItem[],
  options: {
    query?: string;
    origin?: MineSkillOriginFilter;
    nameOnly?: boolean;
  } = {}
): MineSkillItem[] {
  const query = options.query?.trim().toLowerCase() ?? "";
  const origin = options.origin ?? "all";

  return skills.filter((skill) => {
    if (origin !== "all" && skill.origin !== origin) {
      return false;
    }
    if (!query) {
      return true;
    }
    return skill.name.toLowerCase().includes(query) || (!options.nameOnly && skill.description.toLowerCase().includes(query));
  });
}

export function getMineSkillOriginLabel(origin: MineSkillOrigin): string {
  return origin === "builtin" ? "内置" : "我的";
}
