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

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getPublishedMultiAgents(): PublishedMultiAgentItem[] {
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

  const current = getPublishedMultiAgents();
  const index = current.findIndex((row) => row.id === nextItem.id);
  const next =
    index >= 0
      ? current.map((row, i) => (i === index ? nextItem : row))
      : [nextItem, ...current];

  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return nextItem;
}

export function removePublishedMultiAgent(id: string) {
  if (!canUseStorage()) {
    return;
  }
  const next = getPublishedMultiAgents().filter((row) => row.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
