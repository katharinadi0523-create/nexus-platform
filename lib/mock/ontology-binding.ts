import { useSyncExternalStore } from "react";

/**
 * AF 接入本体 OF 的原型数据（不调用真实接口）。
 *
 * - API Key：用户在「本体构建与运营平台」创建，填入后只存密文，跟着这一个 Claw 的绑定走，不在 Claw 之间复用。
 * - 本体场景库：Key 能访问的本体场景。一个 Claw 最多绑定一个场景，绑定后以「本体子智能体」的方式被主智能体召唤。
 * - 能执行哪些行为、函数由 OF 创建 Key 时的能力包控制，AF 侧不再单独开关。
 * - 上架桥接：管控端把绑定了本体的 Claw 上架到智能体广场时，写入 localStorage，
 *   使用端「能力 › 智能体」读取后展示带本体标记的卡片。
 */

/** project = 管控端 Claw；personal = 使用端个人 Claw */
export type OntologyBindingScope = "project" | "personal";

export type OntologySceneTone = "blue" | "indigo" | "sky" | "violet" | "teal";

export interface OntologyScene {
  id: string;
  name: string;
  /** OF 中的场景说明，可能为空 */
  description: string;
  objectCount: number;
  linkCount: number;
  actionCount: number;
  functionCount: number;
  /** OF 侧最近编辑时间与编辑人，用来区分同名或相近的场景 */
  updatedAt: string;
  updatedBy: string;
  tone: OntologySceneTone;
}

export interface OntologyBinding {
  keyTail: string;
  sceneId: string;
  sceneName: string;
  sceneUpdatedAt: string;
  sceneUpdatedBy: string;
  sceneCounts: Pick<OntologyScene, "objectCount" | "linkCount" | "actionCount" | "functionCount">;
  /** 用户写给 Claw 看的场景描述：Claw 依据它判断何时调用本体 */
  sceneDescription: string;
  boundAt: string;
}

export const ONTOLOGY_KEY_GUIDE_URL = "#of-api-key-guide";
export const ONTOLOGY_PLATFORM_NAME = "本体构建与运营平台";

export const MOCK_ONTOLOGY_SCENES: OntologyScene[] = [
  {
    id: "scene-2001",
    name: "客户与商机",
    description: "",
    objectCount: 9,
    linkCount: 11,
    actionCount: 3,
    functionCount: 1,
    updatedAt: "2026-11-16",
    updatedBy: "苏澄",
    tone: "blue",
  },
  {
    id: "scene-1001",
    name: "订单履约",
    description: "",
    objectCount: 12,
    linkCount: 18,
    actionCount: 4,
    functionCount: 2,
    updatedAt: "2026-11-18",
    updatedBy: "陈屿",
    tone: "indigo",
  },
  {
    id: "scene-1002",
    name: "订单履约（测试）",
    description: "",
    objectCount: 12,
    linkCount: 18,
    actionCount: 4,
    functionCount: 2,
    updatedAt: "2026-10-09",
    updatedBy: "林越",
    tone: "sky",
  },
  {
    id: "scene-1003",
    name: "库存与仓储",
    description: "",
    objectCount: 8,
    linkCount: 9,
    actionCount: 2,
    functionCount: 0,
    updatedAt: "2026-11-12",
    updatedBy: "许珂",
    tone: "teal",
  },
  {
    id: "scene-1004",
    name: "供应商评估",
    description: "",
    objectCount: 5,
    linkCount: 6,
    actionCount: 0,
    functionCount: 1,
    updatedAt: "2026-09-27",
    updatedBy: "苏澄",
    tone: "violet",
  },
];

/** 原型：模拟用 Key 拉取本体场景库。Key 含 "bad" 时模拟失败，含 "empty" 时模拟无场景。 */
export function mockFetchSceneLibrary(
  apiKey: string,
): Promise<{ ok: true; scenes: OntologyScene[] } | { ok: false; reason: string }> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const key = apiKey.trim().toLowerCase();
      if (!key || key.includes("bad")) {
        resolve({ ok: false, reason: "API Key 无效或已过期，请到本体构建与运营平台重新创建。" });
        return;
      }
      if (key.includes("empty")) {
        resolve({ ok: false, reason: "这个 API Key 下没有可用的本体场景，请确认创建 Key 时已绑定场景。" });
        return;
      }
      resolve({ ok: true, scenes: MOCK_ONTOLOGY_SCENES });
    }, 800);
  });
}

export function getSceneById(sceneId: string) {
  return MOCK_ONTOLOGY_SCENES.find((scene) => scene.id === sceneId) ?? null;
}

export function maskKey(keyTail: string) {
  return `sk-••••••••${keyTail}`;
}

export function nowText() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function buildBinding(keyTail: string, scene: OntologyScene, sceneDescription: string): OntologyBinding {
  return {
    keyTail,
    sceneId: scene.id,
    sceneName: scene.name,
    sceneUpdatedAt: scene.updatedAt,
    sceneUpdatedBy: scene.updatedBy,
    sceneCounts: {
      objectCount: scene.objectCount,
      linkCount: scene.linkCount,
      actionCount: scene.actionCount,
      functionCount: scene.functionCount,
    },
    sceneDescription,
    boundAt: nowText(),
  };
}

/** 管控端预置：销售陪练 Claw 已绑定本体，用于演示发布与上架。 */
export const DEMO_CLAW_ONTOLOGY_BINDINGS: Record<string, OntologyBinding> = {
  "claw-sales-pilot": {
    ...buildBinding(
      "7c21",
      MOCK_ONTOLOGY_SCENES[0],
      "客户与商机本体涉及客户、联系人、商机、报价、合同及其之间的关系。适合回答“某客户本季度有哪些在跟进的商机”“报价单关联了哪些产品”这类问题。",
    ),
    boundAt: "2026-11-18 17:05",
  },
};

/* ---------------- 上架桥接：管控端 → 使用端智能体广场 ---------------- */

export interface ShelvedOntologyAgent {
  id: string;
  name: string;
  description: string;
  ontologySceneName: string;
  sceneDescription: string;
  shelvedAt: string;
  agentTypes: string[];
}

const SHELF_STORAGE_KEY = "nexus.of.shelvedOntologyAgents";

export function readShelvedOntologyAgents(): ShelvedOntologyAgent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SHELF_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as ShelvedOntologyAgent[]) : [];
  } catch {
    return [];
  }
}

export function upsertShelvedOntologyAgent(agent: ShelvedOntologyAgent) {
  if (typeof window === "undefined") return;
  try {
    const next = [agent, ...readShelvedOntologyAgents().filter((item) => item.id !== agent.id)];
    window.localStorage.setItem(SHELF_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 原型：存储不可用时忽略
  }
}

export function removeShelvedOntologyAgent(id: string) {
  if (typeof window === "undefined") return;
  try {
    const next = readShelvedOntologyAgents().filter((item) => item.id !== id);
    window.localStorage.setItem(SHELF_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

const noopSubscribe = () => () => {};

/** 客户端挂载后为 true，服务端渲染与水合首帧为 false。 */
export function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
