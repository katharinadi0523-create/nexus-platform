export type PublishedMultiAgentItem = {
  id: string;
  name: string;
  type: "多智能体";
  status: "已发布";
  desc: string;
  updatedAt: string;
};

const STORAGE_KEY = "nexus-published-multi-agents";

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

export function formatMultiAgentUpdatedAt(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
