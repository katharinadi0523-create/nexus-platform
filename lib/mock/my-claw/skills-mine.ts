import { MARKETPLACE_SKILL_SEEDS } from "@/lib/mock/skills-marketplace";

export type MineSkillOrigin = "builtin" | "mine";
export type MineSkillOriginFilter = "all" | MineSkillOrigin;

export interface MineSkillItem {
  id: string;
  name: string;
  description: string;
  origin: MineSkillOrigin;
  enabled: boolean;
  updatedAt: string;
}

export const MINE_SKILL_ORIGIN_TABS: Array<{
  value: MineSkillOriginFilter;
  label: string;
}> = [
  { value: "all", label: "全部" },
  { value: "builtin", label: "内置" },
  { value: "mine", label: "我的" },
];

const BUILTIN_FROM_MARKETPLACE = MARKETPLACE_SKILL_SEEDS.filter(
  (skill) => skill.sourceType === "platform"
).slice(0, 5);

const MINE_SEED_SKILLS: MineSkillItem[] = [
  {
    id: "mine-ops-summary",
    name: "运营简报生成器",
    description: "面向每周经营复盘的内部技能，聚焦周报结构化整理与摘要输出。",
    origin: "mine",
    enabled: true,
    updatedAt: "2026-07-18 14:20",
  },
  {
    id: "mine-ai-gov-writing",
    name: "AI产线公文写作",
    description: "面向项目周报、立项请示与会议通知的公文写作技能。",
    origin: "mine",
    enabled: true,
    updatedAt: "2026-07-20 09:45",
  },
  {
    id: "mine-travel-checklist",
    name: "差旅材料核对",
    description: "核对差旅报销材料完整性，提示缺失票据与字段。",
    origin: "mine",
    enabled: false,
    updatedAt: "2026-07-12 16:08",
  },
  {
    id: "mine-meeting-minutes",
    name: "会议纪要整理",
    description: "将会议录音要点整理为可分发纪要，并提取待办。",
    origin: "mine",
    enabled: true,
    updatedAt: "2026-07-22 11:30",
  },
];

export const INITIAL_MINE_SKILLS: MineSkillItem[] = [
  ...BUILTIN_FROM_MARKETPLACE.map((skill, index) => ({
    id: `builtin-${skill.id}`,
    name: skill.name,
    description: skill.description,
    origin: "builtin" as const,
    enabled: index !== 2,
    updatedAt: `2026-07-${String(10 + index).padStart(2, "0")} 10:00`,
  })),
  ...MINE_SEED_SKILLS,
];

export function filterMineSkills(
  skills: MineSkillItem[],
  options: {
    query?: string;
    origin?: MineSkillOriginFilter;
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
    return (
      skill.name.toLowerCase().includes(query) ||
      skill.description.toLowerCase().includes(query)
    );
  });
}

export function getMineSkillOriginLabel(origin: MineSkillOrigin): string {
  return origin === "builtin" ? "内置" : "我的";
}
