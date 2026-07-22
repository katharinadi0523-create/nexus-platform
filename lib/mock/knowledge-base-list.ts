export type KnowledgeBaseCreateMethod = "模板创建" | "自定义创建";
export type KnowledgeBaseStatus = "已启用" | "已停用";

export interface KnowledgeBaseListItem {
  id: string;
  name: string;
  createMethod: KnowledgeBaseCreateMethod;
  status: KnowledgeBaseStatus;
  documentCount: number;
  updateTime: string;
  creator: string;
  createTime: string;
  description?: string;
  groupName?: string;
}

const CREATED_KB_STORAGE_KEY = "nexus-created-knowledge-bases";
const KB_DOCS_STORAGE_KEY = "nexus-kb-documents";

const GROUP_META: Record<string, { prefix: string; groupName: string }> = {
  all: { prefix: "custom", groupName: "全部群组" },
  tianjin: { prefix: "tianjin", groupName: "天津纪委知识库" },
  test1: { prefix: "test", groupName: "测试群组1" },
  migration: { prefix: "migration", groupName: "迁移知识库" },
};

function formatNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function loadCreatedKnowledgeBases(): KnowledgeBaseListItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CREATED_KB_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as KnowledgeBaseListItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCreatedKnowledgeBases(list: KnowledgeBaseListItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CREATED_KB_STORAGE_KEY, JSON.stringify(list));
}

export interface CreateCustomKnowledgeBaseInput {
  name: string;
  description?: string;
  groupId: string;
  creator?: string;
}

/** 创建自定义知识库（写入本地存储，便于列表/详情读取） */
export function createCustomKnowledgeBase(
  input: CreateCustomKnowledgeBaseInput
): KnowledgeBaseListItem {
  const group = GROUP_META[input.groupId] ?? GROUP_META.all;
  const now = formatNow();
  const item: KnowledgeBaseListItem = {
    id: `${group.prefix}_${Date.now()}`,
    name: input.name.trim(),
    createMethod: "自定义创建",
    status: "已启用",
    documentCount: 0,
    updateTime: now,
    creator: input.creator || "当前用户",
    createTime: now,
    description: input.description?.trim() || undefined,
    groupName: group.groupName,
  };

  const list = loadCreatedKnowledgeBases();
  saveCreatedKnowledgeBases([item, ...list.filter((kb) => kb.id !== item.id)]);
  saveKnowledgeBaseDocuments(item.id, []);
  return item;
}

export type StoredKbDocument = {
  id: string;
  name: string;
  type: string;
  processStatus: string;
  usageStatus: string;
  quality: string;
  layoutComplexity: string;
  size: string;
  uploader: string;
  uploadedAt: string;
};

export function loadKnowledgeBaseDocuments(
  kbId: string
): StoredKbDocument[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KB_DOCS_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, StoredKbDocument[]>;
    if (!(kbId in map)) return null;
    return map[kbId] ?? [];
  } catch {
    return null;
  }
}

export function saveKnowledgeBaseDocuments(
  kbId: string,
  docs: StoredKbDocument[]
) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KB_DOCS_STORAGE_KEY);
    const map = raw
      ? (JSON.parse(raw) as Record<string, StoredKbDocument[]>)
      : {};
    map[kbId] = docs;
    localStorage.setItem(KB_DOCS_STORAGE_KEY, JSON.stringify(map));

    const created = loadCreatedKnowledgeBases();
    const idx = created.findIndex((kb) => kb.id === kbId);
    if (idx >= 0) {
      created[idx] = {
        ...created[idx],
        documentCount: docs.length,
        updateTime: formatNow(),
      };
      saveCreatedKnowledgeBases(created);
    }
  } catch {
    /* ignore */
  }
}

export const allKnowledgeBases: KnowledgeBaseListItem[] = [
  {
    id: "ai_001",
    name: "Transformer 架构详解",
    createMethod: "模板创建",
    status: "已启用",
    documentCount: 1,
    updateTime: "2024-02-12 09:20:00",
    creator: "张明",
    createTime: "2023-12-10 14:30:00",
    description: "Transformer 架构详解与 Attention 机制实践说明",
    groupName: "全部群组",
  },
  {
    id: "ai_002",
    name: "RAG 检索增强生成技术",
    createMethod: "自定义创建",
    status: "已启用",
    documentCount: 1,
    updateTime: "2024-02-18 15:40:00",
    creator: "李华",
    createTime: "2024-01-05 10:15:00",
    description: "RAG 检索增强生成技术白皮书",
    groupName: "全部群组",
  },
  {
    id: "ai_003",
    name: "AI Agent 设计模式",
    createMethod: "模板创建",
    status: "已停用",
    documentCount: 1,
    updateTime: "2024-01-28 11:05:00",
    creator: "王芳",
    createTime: "2024-01-14 16:20:00",
    description: "AI Agent 设计模式与工程实践",
    groupName: "全部群组",
  },
  {
    id: "ai_004",
    name: "大语言模型原理与实践",
    createMethod: "自定义创建",
    status: "已启用",
    documentCount: 3,
    updateTime: "2024-03-01 08:50:00",
    creator: "赵强",
    createTime: "2024-01-20 09:45:00",
    description: "深入理解大语言模型的工作原理和应用实践",
    groupName: "全部群组",
  },
  {
    id: "ai_005",
    name: "向量数据库技术指南",
    createMethod: "模板创建",
    status: "已启用",
    documentCount: 2,
    updateTime: "2024-02-25 16:10:00",
    creator: "陈晨",
    createTime: "2024-02-01 11:30:00",
    description: "向量数据库在 RAG 系统中的应用指南",
    groupName: "全部群组",
  },
  {
    id: "tianjin_001",
    name: "笔录知识库",
    createMethod: "模板创建",
    status: "已启用",
    documentCount: 19,
    updateTime: "2025-12-18 10:12:00",
    creator: "刘明明",
    createTime: "2025-03-12 12:21:00",
    description: "这是一段描述信息描述信息描述信息描述信息描述信息",
    groupName: "全部群组",
  },
  {
    id: "tianjin_002",
    name: "自查清单",
    createMethod: "自定义创建",
    status: "已启用",
    documentCount: 3,
    updateTime: "2025-12-19 14:22:00",
    creator: "刘洋",
    createTime: "2025-12-17 19:35:45",
    description: "自查清单",
    groupName: "天津纪委知识库",
  },
  {
    id: "tianjin_003",
    name: "法律法规",
    createMethod: "模板创建",
    status: "已启用",
    documentCount: 2,
    updateTime: "2025-12-20 09:08:00",
    creator: "周敏",
    createTime: "2025-12-17 19:35:45",
    description: "法律法规相关文档集合",
    groupName: "天津纪委知识库",
  },
  {
    id: "tianjin_004",
    name: "初核报告模板",
    createMethod: "模板创建",
    status: "已停用",
    documentCount: 1,
    updateTime: "2025-12-17 20:01:00",
    creator: "周敏",
    createTime: "2025-12-17 19:35:45",
    description: "初核报告模板",
    groupName: "天津纪委知识库",
  },
  {
    id: "tianjin_005",
    name: "领域映射关系知识库",
    createMethod: "自定义创建",
    status: "已启用",
    documentCount: 2,
    updateTime: "2025-12-21 11:45:00",
    creator: "孙伟",
    createTime: "2025-12-17 19:35:45",
    description: "领域映射关系知识库(测试)",
    groupName: "天津纪委知识库",
  },
  {
    id: "tianjin_006",
    name: "纪检调查报告知识库",
    createMethod: "模板创建",
    status: "已启用",
    documentCount: 1,
    updateTime: "2025-12-18 16:30:00",
    creator: "孙伟",
    createTime: "2025-12-17 19:35:45",
    description: "纪检调查报告知识库",
    groupName: "天津纪委知识库",
  },
  {
    id: "tianjin_007",
    name: "纪检初步核实报告知识库",
    createMethod: "自定义创建",
    status: "已停用",
    documentCount: 1,
    updateTime: "2025-12-17 21:10:00",
    creator: "吴倩",
    createTime: "2025-12-17 19:35:45",
    description: "纪检初步核实报告知识库",
    groupName: "天津纪委知识库",
  },
  {
    id: "tianjin_008",
    name: "纪检审查报告知识库",
    createMethod: "模板创建",
    status: "已启用",
    documentCount: 1,
    updateTime: "2025-12-22 08:15:00",
    creator: "吴倩",
    createTime: "2025-12-17 19:35:45",
    description: "纪检审查报告知识库",
    groupName: "天津纪委知识库",
  },
  {
    id: "test_001",
    name: "测试知识库1",
    createMethod: "自定义创建",
    status: "已启用",
    documentCount: 5,
    updateTime: "2025-12-16 11:00:00",
    creator: "管理员",
    createTime: "2025-12-15 10:20:00",
    description: "测试群组1的知识库",
    groupName: "测试群组1",
  },
  {
    id: "test_002",
    name: "测试知识库2",
    createMethod: "模板创建",
    status: "已停用",
    documentCount: 3,
    updateTime: "2025-12-17 09:40:00",
    creator: "管理员",
    createTime: "2025-12-16 14:30:00",
    description: "测试群组2的知识库",
    groupName: "测试群组1",
  },
  {
    id: "migration_001",
    name: "迁移知识库1",
    createMethod: "自定义创建",
    status: "已启用",
    documentCount: 4,
    updateTime: "2025-12-12 13:25:00",
    creator: "系统迁移",
    createTime: "2025-12-10 08:15:00",
    description: "迁移知识库示例",
    groupName: "迁移知识库",
  },
];

function matchesGroup(
  kb: KnowledgeBaseListItem,
  groupId: string | null
): boolean {
  if (!groupId || groupId === "all") return true;
  if (groupId === "tianjin") return kb.id.startsWith("tianjin_");
  if (groupId === "test1") return kb.id.startsWith("test_");
  if (groupId === "migration") return kb.id.startsWith("migration_");
  return (
    kb.id.startsWith("ai_") ||
    kb.id.startsWith("custom_") ||
    kb.groupName === "全部群组"
  );
}

export function getKnowledgeBasesByGroup(
  groupId: string | null
): KnowledgeBaseListItem[] {
  const created = loadCreatedKnowledgeBases().filter((kb) =>
    matchesGroup(kb, groupId)
  );
  const seeded = allKnowledgeBases.filter((kb) => matchesGroup(kb, groupId));
  const seededIds = new Set(seeded.map((kb) => kb.id));
  return [...created.filter((kb) => !seededIds.has(kb.id)), ...seeded];
}

export function getKnowledgeBaseMeta(
  id: string
): KnowledgeBaseListItem | null {
  const created = loadCreatedKnowledgeBases().find((kb) => kb.id === id);
  if (created) return created;
  return allKnowledgeBases.find((kb) => kb.id === id) ?? null;
}
