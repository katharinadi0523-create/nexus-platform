export type PublishedMultiAgentItem = {
  id: string;
  name: string;
  type: "多智能体";
  status: "已发布";
  desc: string;
  updatedAt: string;
};

/** 已上架到应用广场的多智能体 */
export type ShelvedMultiAgentItem = {
  id: string;
  name: string;
  description: string;
  releaseMode: "组织发布" | "公开发布";
  agentTypes: string[];
  author: string;
  shelvedAt: string;
};

const STORAGE_KEY = "nexus-published-multi-agents";
const SHELVED_STORAGE_KEY = "nexus-shelved-multi-agents";
const REMOVED_SEED_STORAGE_KEY = "nexus-published-multi-agents-removed-seeds";

/** 内置已发布多智能体（写入代码，所有环境默认可见） */
export const SEED_PUBLISHED_MULTI_AGENTS: PublishedMultiAgentItem[] = [
  {
    id: "multi-agent-scientific-research",
    name: "科研多智能体",
    type: "多智能体",
    status: "已发布",
    desc: "面向科研全流程，协同完成假设生成、文献检索、科研绘图、论文生成与论文审核。",
    updatedAt: "2026-07-11 10:30",
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getStoredPublishedMultiAgents(): PublishedMultiAgentItem[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as PublishedMultiAgentItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getRemovedSeedIds(): Set<string> {
  if (!canUseStorage()) {
    return new Set();
  }
  try {
    const raw = window.localStorage.getItem(REMOVED_SEED_STORAGE_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function setRemovedSeedIds(ids: Set<string>) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(
    REMOVED_SEED_STORAGE_KEY,
    JSON.stringify([...ids])
  );
}

export function getPublishedMultiAgents(): PublishedMultiAgentItem[] {
  const stored = getStoredPublishedMultiAgents();
  const removedSeeds = getRemovedSeedIds();
  const byId = new Map<string, PublishedMultiAgentItem>();

  for (const seed of SEED_PUBLISHED_MULTI_AGENTS) {
    if (!removedSeeds.has(seed.id)) {
      byId.set(seed.id, seed);
    }
  }
  // 本地发布/编辑覆盖同名 id，并保留其余本地项
  for (const item of stored) {
    byId.set(item.id, item);
  }

  return Array.from(byId.values()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

export function getPublishedMultiAgentById(id: string): PublishedMultiAgentItem | null {
  if (!id) {
    return null;
  }
  return getPublishedMultiAgents().find((item) => item.id === id) ?? null;
}

export function upsertPublishedMultiAgent(
  item: Omit<PublishedMultiAgentItem, "type" | "status"> &
    Partial<Pick<PublishedMultiAgentItem, "type" | "status">>
): PublishedMultiAgentItem {
  const nextItem: PublishedMultiAgentItem = {
    id: item.id,
    name: item.name.trim() || "未命名多智能体",
    type: "多智能体",
    status: "已发布",
    desc: item.desc,
    updatedAt: item.updatedAt,
  };

  const current = getStoredPublishedMultiAgents();
  const index = current.findIndex((row) => row.id === nextItem.id);
  const next =
    index >= 0
      ? current.map((row, i) => (i === index ? nextItem : row))
      : [nextItem, ...current];

  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    // 重新发布内置项时，取消「已删除种子」标记
    const removed = getRemovedSeedIds();
    if (removed.delete(nextItem.id)) {
      setRemovedSeedIds(removed);
    }
  }

  return nextItem;
}

export function removePublishedMultiAgent(id: string) {
  if (!canUseStorage()) {
    return;
  }
  const next = getStoredPublishedMultiAgents().filter((row) => row.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  if (SEED_PUBLISHED_MULTI_AGENTS.some((seed) => seed.id === id)) {
    const removed = getRemovedSeedIds();
    removed.add(id);
    setRemovedSeedIds(removed);
  }
}

export function getShelvedMultiAgents(): ShelvedMultiAgentItem[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SHELVED_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ShelvedMultiAgentItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getShelvedMultiAgentById(id: string): ShelvedMultiAgentItem | null {
  if (!id) {
    return null;
  }
  return getShelvedMultiAgents().find((item) => item.id === id) ?? null;
}

export function upsertShelvedMultiAgent(
  item: Omit<ShelvedMultiAgentItem, "author" | "shelvedAt"> &
    Partial<Pick<ShelvedMultiAgentItem, "author" | "shelvedAt">>
): ShelvedMultiAgentItem {
  const nextItem: ShelvedMultiAgentItem = {
    id: item.id,
    name: item.name.trim() || "未命名多智能体",
    description: item.description.trim() || "多智能体应用",
    releaseMode: item.releaseMode,
    agentTypes: item.agentTypes.slice(0, 2),
    author: item.author?.trim() || "@当前用户",
    shelvedAt: item.shelvedAt || formatMultiAgentUpdatedAt(),
  };

  const current = getShelvedMultiAgents();
  const index = current.findIndex((row) => row.id === nextItem.id);
  const next =
    index >= 0
      ? current.map((row, i) => (i === index ? nextItem : row))
      : [nextItem, ...current];

  if (canUseStorage()) {
    window.localStorage.setItem(SHELVED_STORAGE_KEY, JSON.stringify(next));
  }

  return nextItem;
}

export function removeShelvedMultiAgent(id: string) {
  if (!canUseStorage()) {
    return;
  }
  const next = getShelvedMultiAgents().filter((row) => row.id !== id);
  window.localStorage.setItem(SHELVED_STORAGE_KEY, JSON.stringify(next));
}

export function formatMultiAgentUpdatedAt(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
