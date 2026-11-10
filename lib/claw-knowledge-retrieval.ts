export const HIERARCHY_RETRIEVAL_OPTIONS = [
  { value: "title-content", label: "标题召回内容" },
  { value: "content-title", label: "内容召回标题" },
  { value: "content-title-all", label: "内容召回标题及标题下所有内容" },
] as const;
export type HierarchyRetrievalMode = typeof HIERARCHY_RETRIEVAL_OPTIONS[number]["value"];

export interface ClawKnowledgeRetrievalConfig {
  strategyId: string;
  topK: number;
  score: number;
  small2big: { enabled: boolean; mode: "adjacent" | "adaptive"; before: number; after: number };
  hierarchy: { enabled: boolean; modes: HierarchyRetrievalMode[] };
}
export function defaultClawKnowledgeRetrievalConfig(): ClawKnowledgeRetrievalConfig {
  return { strategyId: "", topK: 10, score: 0.6, small2big: { enabled: false, mode: "adjacent", before: 1, after: 1 }, hierarchy: { enabled: false, modes: ["title-content"] } };
}
export function validateClawKnowledgeRetrieval(config: ClawKnowledgeRetrievalConfig, availableIds: string[]): string | null {
  if (!availableIds.includes(config.strategyId)) return "请选择一条可用的检索策略";
  if (!Number.isInteger(config.topK) || config.topK < 1) return "Top K 必须为正整数";
  if (!Number.isFinite(config.score) || config.score < 0 || config.score > 1) return "Score 应在 0～1 之间";
  if (config.small2big.enabled && config.small2big.mode === "adjacent" && [config.small2big.before, config.small2big.after].some(value => !Number.isInteger(value) || value < 1 || value > 10)) return "前后相邻块数量必须为 1～10 的整数";
  if (config.hierarchy.enabled && (!config.hierarchy.modes.length || config.hierarchy.modes.some(mode => !HIERARCHY_RETRIEVAL_OPTIONS.some(option => option.value === mode)))) return "请至少选择一种层级结构检索方式";
  return null;
}
type SavedRetrievalConfig = Omit<Partial<ClawKnowledgeRetrievalConfig>, "hierarchy"> & {
  hierarchy?: { enabled?: boolean; mode?: HierarchyRetrievalMode; modes?: HierarchyRetrievalMode[] };
};
export function normalizeClawKnowledgeRetrieval(saved: SavedRetrievalConfig): ClawKnowledgeRetrievalConfig {
  const defaults = defaultClawKnowledgeRetrievalConfig();
  const modes = saved.hierarchy?.modes ?? (saved.hierarchy?.mode ? [saved.hierarchy.mode] : defaults.hierarchy.modes);
  return { ...defaults, ...saved, small2big: { ...defaults.small2big, ...saved.small2big }, hierarchy: { enabled: saved.hierarchy?.enabled ?? false, modes: [...new Set(modes)].filter(mode => HIERARCHY_RETRIEVAL_OPTIONS.some(option => option.value === mode)) } };
}
function storageKey(clawId: string, knowledgeBaseId: string) { return `nexus-claw-kb-retrieval:${encodeURIComponent(clawId)}:${encodeURIComponent(knowledgeBaseId)}`; }
export function loadClawKnowledgeRetrieval(clawId: string, knowledgeBaseId: string): ClawKnowledgeRetrievalConfig | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(storageKey(clawId, knowledgeBaseId));
    if (!raw) return undefined;
    const saved = JSON.parse(raw) as SavedRetrievalConfig;
    return normalizeClawKnowledgeRetrieval(saved);
  } catch { return undefined; }
}
export function saveClawKnowledgeRetrieval(clawId: string, knowledgeBaseId: string, config: ClawKnowledgeRetrievalConfig) {
  window.localStorage.setItem(storageKey(clawId, knowledgeBaseId), JSON.stringify(config));
}
