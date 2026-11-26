import type { MineSkillItem } from "./skills-mine";

const PERSONAL_SKILLS_KEY = "af-claw-demo:personal-skills";
const PERSONAL_SKILL_OVERRIDES_KEY = "af-claw-demo:personal-skill-overrides";

export type PersonalSkillOverride = Pick<MineSkillItem, "description" | "skillMdContent" | "updatedAt" | "packageFiles" | "files"> & Partial<Pick<MineSkillItem, "creator" | "origin" | "publisherScope">>;

export function readPersonalSkills(): MineSkillItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(PERSONAL_SKILLS_KEY) ?? "[]") as MineSkillItem[];
    return Array.isArray(stored) ? stored.filter((skill) => skill && skill.publisherScope !== "system") : [];
  } catch {
    return [];
  }
}

export function writePersonalSkills(skills: MineSkillItem[]) {
  if (typeof window === "undefined") return;
  const serializable = skills.map(({ archiveFile: _archiveFile, ...skill }) => skill);
  window.localStorage.setItem(PERSONAL_SKILLS_KEY, JSON.stringify(serializable));
}

export function upsertPersonalSkill(skill: MineSkillItem) {
  const skills = readPersonalSkills();
  const index = skills.findIndex((item) => item.id === skill.id);
  if (index < 0) writePersonalSkills([skill, ...skills]);
  else writePersonalSkills(skills.map((item) => item.id === skill.id ? skill : item));
}

export function updateStoredPersonalSkill(skillId: string, patch: Partial<MineSkillItem>) {
  const skills = readPersonalSkills();
  if (!skills.some((item) => item.id === skillId)) return false;
  writePersonalSkills(skills.map((item) => item.id === skillId ? { ...item, ...patch } : item));
  return true;
}

export function readPersonalSkillOverrides(): Record<string, PersonalSkillOverride> {
  if (typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem(PERSONAL_SKILL_OVERRIDES_KEY) ?? "{}") as Record<string, PersonalSkillOverride>;
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

export function writePersonalSkillOverride(skillId: string, patch: PersonalSkillOverride) {
  if (typeof window === "undefined") return;
  const next = readPersonalSkillOverrides();
  next[skillId] = patch;
  window.localStorage.setItem(PERSONAL_SKILL_OVERRIDES_KEY, JSON.stringify(next));
}
