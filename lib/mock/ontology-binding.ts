import { useSyncExternalStore } from "react";

/**
 * AF 接入本体 OF 的原型数据（不调用真实接口）。
 *
 * - API Key：用户在「本体构建与运营平台」创建，填入后只存密文，跟着这一个 Claw 的绑定走，不在 Claw 之间复用。
 * - 本体场景库：Key 能访问的本体场景。一个 Claw 最多绑定一个场景，绑定后以「本体子智能体」的方式被主智能体召唤。
 * - 能执行哪些行为由 OF 创建 Key 时的能力包控制，AF 侧不再单独开关。本期不调用函数（OF 无执行函数接口）。
 * - 上架桥接：管控端把绑定了本体的 Claw 上架到智能体广场时，写入 localStorage，
 *   使用端「能力 › 智能体」读取后展示带本体标记的卡片。
 */

/** project = 管控端 Claw；personal = 使用端个人 Claw */
export type OntologyBindingScope = "project" | "personal";

export type OntologySceneTone = "blue" | "indigo" | "sky" | "violet" | "teal";

export interface OntologyScene {
  id: string;
  name: string;
  /** OF 场景说明（HttpListOntologyModel 返回），质量取决于建模人员，可能为空或很简略 */
  description: string;
  objectCount: number;
  linkCount: number;
  actionCount: number;
  functionCount: number;
  /** 对象类型、行为的名称：从 OF 同步，展示在“本体能力”并拼进主智能体提示词；functionNames 本期不用 */
  objectNames: string[];
  actionNames: string[];
  functionNames: string[];
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
  /** 用户写的补充说明（选填）：使用范围、注意事项。为空就不拼进提示词 */
  sceneDescription: string;
  boundAt: string;
  /** 原型演示用：发布时后台校验要返回的问题 */
  demoIssue?: OntologyPublishIssue;
}

export type OntologyPublishIssue = "key_expired" | "scene_deleted";

export const ONTOLOGY_KEY_GUIDE_URL = "#of-api-key-guide";
export const ONTOLOGY_PLATFORM_NAME = "本体构建与运营平台";

export const MOCK_ONTOLOGY_SCENES: OntologyScene[] = [
  {
    id: "scene-2001",
    name: "客户与商机",
    description: "客户商机模型",
    objectCount: 9,
    linkCount: 11,
    actionCount: 3,
    functionCount: 1,
    objectNames: ["客户", "联系人", "商机", "报价单", "报价明细", "产品", "合同", "回款", "销售人员"],
    actionNames: ["提交报价审批", "更新商机阶段", "分配负责人"],
    functionNames: ["计算商机赢率"],
    updatedAt: "2026-11-16",
    updatedBy: "苏澄",
    tone: "blue",
  },
  {
    id: "scene-1001",
    name: "订单履约",
    description: "订单履约相关对象与流程",
    objectCount: 52,
    linkCount: 18,
    actionCount: 4,
    functionCount: 2,
    objectNames: ["订单", "订单明细", "客户", "收货地址", "发货单", "发货明细", "物流单", "物流轨迹", "承运商", "司机", "车辆", "仓库", "库位", "拣货单", "打包单", "出库单", "签收单", "签收照片", "退货单", "退货明细", "换货单", "发票", "付款单", "退款单", "产品", "产品规格", "价格政策", "促销活动", "异常工单", "客服记录", "配送区域", "服务时效", "门店", "门店库存", "调拨单", "调拨明细", "预约单", "安装工单", "安装师傅", "服务评价", "投诉单", "赔付单", "会员", "会员等级", "积分记录", "优惠券", "渠道商", "渠道订单", "结算单", "对账单", "运费模板", "包材"],
    actionNames: ["催办发货", "标记签收异常", "创建退货单", "改约配送"],
    functionNames: ["预估送达时间", "计算履约时效"],
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
    objectNames: ["订单", "订单明细", "客户", "发货单", "物流单", "承运商", "仓库", "签收单", "退货单", "发票", "产品", "异常工单"],
    actionNames: ["催办发货", "标记签收异常", "创建退货单", "改约配送"],
    functionNames: ["预估送达时间", "计算履约时效"],
    updatedAt: "2026-10-09",
    updatedBy: "林越",
    tone: "sky",
  },
  {
    id: "scene-1003",
    name: "库存与仓储",
    description: "库存、仓库、出入库数据",
    objectCount: 8,
    linkCount: 9,
    actionCount: 2,
    functionCount: 0,
    objectNames: ["仓库", "库位", "物料", "库存", "入库单", "出库单", "盘点单", "供应商"],
    actionNames: ["发起补货", "冻结库存"],
    functionNames: [],
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
    objectNames: ["供应商", "资质证书", "采购订单", "质检记录", "评估报告"],
    actionNames: [],
    functionNames: ["计算供应商评分"],
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

/** 原型：连接时按 Key 内容决定发布时的演示问题。含 "expired" = Key 失效；含 "deleted" = 场景已删除。 */
export function demoIssueFromKey(apiKey: string): OntologyPublishIssue | undefined {
  const key = apiKey.toLowerCase();
  if (key.includes("expired")) return "key_expired";
  if (key.includes("deleted")) return "scene_deleted";
  return undefined;
}

/**
 * 原型：发布前的后台校验。前台不展示校验过程，只在失败时给 Toast。
 * 校验 Key 仍有效、绑定的场景仍存在；通过后生成本体助手的场景目录。
 */
export function checkOntologyForPublish(
  binding: OntologyBinding | null,
  /** 多智能体：出问题的子智能体名称，用在提示里 */
  ownerName?: string,
): Promise<{ ok: true } | { ok: false; title: string; description: string }> {
  const owner = ownerName ? `子智能体「${ownerName}」的` : "";
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (binding?.demoIssue === "key_expired") {
        resolve({
          ok: false,
          title: `发布失败：${owner}本体 API Key 已失效`,
          description: `Key 已过期或已在${ONTOLOGY_PLATFORM_NAME}删除，请更换 Key 后重新发布。`,
        });
        return;
      }
      if (binding?.demoIssue === "scene_deleted") {
        resolve({
          ok: false,
          title: `发布失败：${owner}本体场景「${binding.sceneName}」已不存在`,
          description: `该场景已在${ONTOLOGY_PLATFORM_NAME}删除，请解除绑定后重新选择场景。`,
        });
        return;
      }
      resolve({ ok: true });
    }, 900);
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
      "只用于销售跟进相关的问题；报价金额以合同为准。",
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
