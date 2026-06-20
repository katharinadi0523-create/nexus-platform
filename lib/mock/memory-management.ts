export type MemoryStoreType = "shared" | "fork" | "builtin_c";
export type MemoryNodeStatus = "active" | "outdated" | "contested";
export type MemoryNodeType =
  | "user"
  | "feedback"
  | "project"
  | "reference";
export type UpdateJobStatus =
  | "queued"
  | "running"
  | "pending_review"
  | "published"
  | "dismissed"
  | "failed";
export type UpdateJobMaterialScope = "since_last" | "time_range" | "manual";
export type UpdateJobModelTier = "standard" | "advanced";
export type MountAccess = "read_only" | "propose_only";
export type UpdateMaterialStatus = "pending" | "included" | "ignored";

export interface MemoryFile {
  id: string;
  path: string;
  content: string;
}

export interface MemoryVersion {
  version: number;
  source: "人工" | "记忆沉淀" | "导入" | "fork";
  author: string;
  createdAt: string;
  summary: string;
  files: MemoryFile[];
}

export interface StoreUpdateMaterial {
  id: string;
  content: string;
  sourceClaw: string;
  sourceSession: string;
  confidence: number;
  relation: "new" | "duplicate" | "conflict";
  status: UpdateMaterialStatus;
  createdAt: string;
}

export interface StoreMountRelation {
  id: string;
  clawName: string;
  access: MountAccess;
  usagePrompt: string;
  updatedAt: string;
}

export interface MemoryStore {
  id: string;
  name: string;
  description: string;
  type: MemoryStoreType;
  nodeCount: number;
  tokenCount: number;
  currentVersion: number;
  mountCount: number;
  updateMaterialCount: number;
  lastUpdateJobAt?: string;
  updatedBy: string;
  updatedAt: string;
  files: MemoryFile[];
  versions: MemoryVersion[];
  updateMaterials: StoreUpdateMaterial[];
  mountRelations: StoreMountRelation[];
}

export interface MemoryDiffLine {
  type: "same" | "added" | "removed";
  content: string;
}

export interface MemoryFileDiff {
  path: string;
  before: MemoryDiffLine[];
  after: MemoryDiffLine[];
}

export interface UpdateJob {
  id: string;
  name: string;
  storeId: string;
  materialScope: UpdateJobMaterialScope;
  inputMaterialCount: number;
  prompt?: string;
  modelTier: UpdateJobModelTier;
  status: UpdateJobStatus;
  tokenUsage: number;
  duration: string;
  addedNodeCount: number;
  removedNodeCount: number;
  modifiedNodeCount: number;
  createdBy: string;
  createdAt: string;
  diffFiles: MemoryFileDiff[];
}

export interface ClawMemoryMount {
  id: string;
  storeId: string;
  access: MountAccess;
  usagePrompt: string;
}

const customerIndexV2 = `# store_客户某局

## 记忆索引

- [[entities/决策链]]：王主任主导业务决策，李工负责技术把关。
- [[entities/项目状态]]：POC 计划与当前交付状态。
- [[decisions/2026-06-POC时间承诺]]：POC 最晚于 2026 年 7 月中旬完成。
- [[lessons/沟通注意事项]]：强调私有化、等保三级与可回滚交付。
`;

const customerFilesV2: MemoryFile[] = [
  {
    id: "customer-index",
    path: "INDEX.md",
    content: customerIndexV2,
  },
  {
    id: "customer-chain",
    path: "entities/决策链.md",
    content: `---
slug: decision-chain
type: project
description: 客户决策链与关键角色
status: active
sources: [sess_visit_0610]
updated: 2026-06-11
---

## 结论

王主任主导业务决策，李工负责技术路线和 POC 验收。

## 原因与背景

首次拜访和第二轮方案评审均由王主任确认推进节奏，李工负责技术问题收口。
`,
  },
  {
    id: "customer-status",
    path: "entities/项目状态.md",
    content: `---
slug: project-status
type: project
description: 某局项目当前状态
status: active
sources: [sess_visit_0610, sess_plan_0611]
updated: 2026-06-11
---

## 结论

项目处于 POC 准备阶段，客户要求补充等保三级说明和本地模型部署清单。
`,
  },
  {
    id: "customer-poc",
    path: "decisions/2026-06-POC时间承诺.md",
    content: `---
slug: poc-commitment-202606
type: project
description: POC 时间承诺
status: active
sources: [sess_plan_0611]
updated: 2026-06-11
---

## 结论

POC 最晚于 2026 年 7 月中旬完成，首轮环境检查在 6 月底前完成。

## 原因与背景

客户机房变更窗口集中在 7 月，交付计划必须预留安全测评时间。
`,
  },
  {
    id: "customer-lesson",
    path: "lessons/沟通注意事项.md",
    content: `---
slug: communication-notes
type: project
description: 客户沟通注意事项
status: active
sources: [sess_visit_0610]
updated: 2026-06-11
---

## 结论

方案沟通优先强调私有化部署、等保三级适配和升级可回滚，不使用公网模型案例作为主证据。
`,
  },
];

const customerFilesV1: MemoryFile[] = [
  {
    id: "customer-index-v1",
    path: "INDEX.md",
    content: `# store_客户某局

- 客户偏好私有化部署。
- 王主任关注 POC 时间。
- 李工要求补充安全方案。
`,
  },
  {
    id: "customer-notes-v1",
    path: "notes/散记.md",
    content: `- 6 月 10 日：王主任说 POC 最好 6 月底完成。
- 李工问了等保和模型部署位置。
- 客户不能使用公网模型。
- 下次需要带架构图。
`,
  },
];

const salesPlaybookFiles: MemoryFile[] = [
  {
    id: "sales-index",
    path: "INDEX.md",
    content: `# store_售前打法

- [[procedures/政企方案五要素]]：政企方案的标准信息结构。
- [[lessons/预算章节检查清单]]：预算章节提交前检查项。
- [[lessons/竞品异议处理]]：常见竞品异议应对。
`,
  },
  {
    id: "sales-five",
    path: "procedures/政企方案五要素.md",
    content: `---
slug: government-solution-five-elements
type: reference
description: 政企技术方案的五个关键部分
status: active
sources: [job_202605]
updated: 2026-05-28
---

## 结论

方案必须明确现状、建设目标、总体架构、实施路径和安全合规，并在每部分给出客户证据。
`,
  },
  {
    id: "sales-budget",
    path: "lessons/预算章节检查清单.md",
    content: `# 预算章节检查清单

1. 先核对财政口径与采购边界。
2. 软件、服务和资源费用分别列示。
3. 保留扩容项但不计入本期总价。
`,
  },
];

const builtInFiles: MemoryFile[] = [
  {
    id: "builtin-index",
    path: "INDEX.md",
    content: `# 本体 Claw · 经验记忆

- [[procedures/政企方案编写流程]]：先核对客户事实，再生成章节。
- [[lessons/引用检查]]：最终输出前核对来源和时效。
`,
  },
  {
    id: "builtin-procedure",
    path: "procedures/政企方案编写流程.md",
    content: `---
slug: solution-writing-flow
type: reference
description: 政企方案写作流程
status: active
sources: [call_310, call_322, call_338]
updated: 2026-06-12
---

## 结论

先检索客户 Store 和行业规范，再建立章节证据表，最后生成可交付文档。
`,
  },
];

function cloneFiles(files: MemoryFile[]) {
  return files.map((file) => ({ ...file }));
}

const customerUpdateMaterials: StoreUpdateMaterial[] = [
  {
    id: "mat-customer-security",
    content: "客户要求补充等保三级适配说明，并确认模型推理不得出公网。",
    sourceClaw: "本体 Claw",
    sourceSession: "sess_visit_0618",
    confidence: 0.92,
    relation: "new",
    status: "pending",
    createdAt: "2026-06-18 16:20",
  },
  {
    id: "mat-customer-poc",
    content: "POC 首轮环境检查时间从 6 月底调整为 7 月第一周。",
    sourceClaw: "方案写作 Claw",
    sourceSession: "sess_plan_0618",
    confidence: 0.86,
    relation: "conflict",
    status: "pending",
    createdAt: "2026-06-18 18:42",
  },
  {
    id: "mat-customer-contact",
    content: "李工新增数据侧接口人周工，负责样例数据脱敏。",
    sourceClaw: "实施顾问 Claw",
    sourceSession: "sess_impl_0617",
    confidence: 0.78,
    relation: "new",
    status: "included",
    createdAt: "2026-06-17 11:05",
  },
];

const salesUpdateMaterials: StoreUpdateMaterial[] = [
  {
    id: "mat-sales-budget",
    content: "预算章节先拆软件、服务、算力，再说明扩容项不进入首期总价。",
    sourceClaw: "复盘专家 Claw",
    sourceSession: "sess_review_0611",
    confidence: 0.9,
    relation: "duplicate",
    status: "pending",
    createdAt: "2026-06-11 17:20",
  },
  {
    id: "mat-sales-objection",
    content: "客户提竞品价格时，先确认服务边界，再给出等价能力对比。",
    sourceClaw: "售前 Claw",
    sourceSession: "sess_bid_0610",
    confidence: 0.84,
    relation: "new",
    status: "pending",
    createdAt: "2026-06-10 20:12",
  },
];

const customerMountRelations: StoreMountRelation[] = [
  {
    id: "rel-customer-native",
    clawName: "本体 Claw",
    access: "read_only",
    usagePrompt: "处理某局项目、方案与交付问题时检索；新事实标为更新材料。",
    updatedAt: "2026-06-12 10:20",
  },
  {
    id: "rel-customer-plan",
    clawName: "方案写作 Claw",
    access: "propose_only",
    usagePrompt: "生成方案时读取客户事实，发现冲突或新增事实时标为更新材料。",
    updatedAt: "2026-06-13 09:40",
  },
  {
    id: "rel-customer-impl",
    clawName: "实施顾问 Claw",
    access: "read_only",
    usagePrompt: "仅在交付计划和安全方案问答中检索。",
    updatedAt: "2026-06-15 14:12",
  },
];

export const memoryStores: MemoryStore[] = [
  {
    id: "store-customer-bureau",
    name: "store_客户某局",
    description: "沉淀某局项目决策链、项目状态、关键承诺与沟通注意事项。",
    type: "shared",
    nodeCount: 4,
    tokenCount: 18420,
    currentVersion: 2,
    mountCount: 3,
    updateMaterialCount: 5,
    lastUpdateJobAt: "2026-06-12 09:36",
    updatedBy: "张敏",
    updatedAt: "2026-06-12 10:18",
    files: cloneFiles(customerFilesV2),
    versions: [
      {
        version: 2,
        source: "记忆沉淀",
        author: "张敏",
        createdAt: "2026-06-12 09:36",
        summary: "将会话材料与 C 记忆合成为 4 个主题节点，并更新 INDEX。",
        files: cloneFiles(customerFilesV2),
      },
      {
        version: 1,
        source: "人工",
        author: "张敏",
        createdAt: "2026-06-10 16:20",
        summary: "由两次客户拜访纪要初始化。",
        files: cloneFiles(customerFilesV1),
      },
    ],
    updateMaterials: customerUpdateMaterials,
    mountRelations: customerMountRelations,
  },
  {
    id: "store-sales-playbook",
    name: "store_售前打法",
    description: "面向政企售前团队的通用方案方法、异议处理与复盘经验。",
    type: "shared",
    nodeCount: 48,
    tokenCount: 76350,
    currentVersion: 5,
    mountCount: 8,
    updateMaterialCount: 2,
    lastUpdateJobAt: "2026-06-08 18:12",
    updatedBy: "复盘专家 Claw",
    updatedAt: "2026-06-11 17:42",
    files: cloneFiles(salesPlaybookFiles),
    versions: [
      {
        version: 5,
        source: "记忆沉淀",
        author: "复盘专家 Claw",
        createdAt: "2026-06-08 18:12",
        summary: "合并重复打法并淘汰过时竞品信息。",
        files: cloneFiles(salesPlaybookFiles),
      },
      {
        version: 4,
        source: "人工",
        author: "李华",
        createdAt: "2026-05-28 11:04",
        summary: "补充预算章节检查清单。",
        files: cloneFiles(salesPlaybookFiles),
      },
    ],
    updateMaterials: salesUpdateMaterials,
    mountRelations: [
      {
        id: "rel-sales-native",
        clawName: "本体 Claw",
        access: "propose_only",
        usagePrompt: "编写政企方案和复盘售前任务时检索；复用方法标为更新材料。",
        updatedAt: "2026-06-11 17:42",
      },
    ],
  },
  {
    id: "store-bid-special",
    name: "store_某局_投标专项",
    description: "从客户记忆拆出的投标专项 Store，用于新投标 Claw 冷启动。",
    type: "fork",
    nodeCount: 9,
    tokenCount: 12680,
    currentVersion: 1,
    mountCount: 1,
    updateMaterialCount: 0,
    updatedBy: "王宇",
    updatedAt: "2026-06-09 14:30",
    files: cloneFiles(customerFilesV2.slice(0, 4)),
    versions: [
      {
        version: 1,
        source: "fork",
        author: "王宇",
        createdAt: "2026-06-09 14:30",
        summary: "从 store_客户某局 v1 初始化投标专项记忆。",
        files: cloneFiles(customerFilesV2.slice(0, 4)),
      },
    ],
    updateMaterials: [],
    mountRelations: [
      {
        id: "rel-bid-special",
        clawName: "投标 Claw",
        access: "read_only",
        usagePrompt: "投标专项资料生成时只读检索。",
        updatedAt: "2026-06-09 14:35",
      },
    ],
  },
  {
    id: "store-claw-native",
    name: "本体 Claw · 经验记忆",
    description: "本体 Claw 在跨用户任务中积累的脱敏执行经验。",
    type: "builtin_c",
    nodeCount: 26,
    tokenCount: 43820,
    currentVersion: 3,
    mountCount: 1,
    updateMaterialCount: 0,
    lastUpdateJobAt: "2026-06-10 02:00",
    updatedBy: "系统",
    updatedAt: "2026-06-12 10:02",
    files: cloneFiles(builtInFiles),
    versions: [
      {
        version: 3,
        source: "记忆沉淀",
        author: "系统",
        createdAt: "2026-06-10 02:00",
        summary: "从 30 次调用中蒸馏政企方案写作经验。",
        files: cloneFiles(builtInFiles),
      },
      {
        version: 2,
        source: "人工",
        author: "陈晨",
        createdAt: "2026-05-30 15:16",
        summary: "补充输出引用检查规则。",
        files: cloneFiles(builtInFiles),
      },
    ],
    updateMaterials: [],
    mountRelations: [
      {
        id: "rel-native-self",
        clawName: "本体 Claw",
        access: "read_only",
        usagePrompt: "系统自动挂载，不可卸载。",
        updatedAt: "2026-06-12 10:02",
      },
    ],
  },
];

const customerDiff: MemoryFileDiff[] = [
  {
    path: "INDEX.md",
    before: [
      { type: "same", content: "# store_客户某局" },
      { type: "removed", content: "- 客户偏好私有化部署。" },
      { type: "removed", content: "- 王主任关注 POC 时间。" },
      { type: "removed", content: "- 李工要求补充安全方案。" },
    ],
    after: [
      { type: "same", content: "# store_客户某局" },
      { type: "added", content: "## 记忆索引" },
      { type: "added", content: "- [[entities/决策链]]：王主任主导，李工负责技术把关。" },
      { type: "added", content: "- [[decisions/2026-06-POC时间承诺]]：7 月中旬完成 POC。" },
      { type: "added", content: "- [[lessons/沟通注意事项]]：强调私有化与等保三级。" },
    ],
  },
  {
    path: "decisions/2026-06-POC时间承诺.md",
    before: [
      { type: "removed", content: "POC 最好在 6 月底完成。" },
      { type: "same", content: "客户要求预留安全测评时间。" },
    ],
    after: [
      { type: "added", content: "POC 最晚于 2026 年 7 月中旬完成。" },
      { type: "added", content: "首轮环境检查在 6 月底前完成。" },
      { type: "same", content: "客户要求预留安全测评时间。" },
    ],
  },
];

export const updateJobs: UpdateJob[] = [
  {
    id: "job-customer-v2",
    name: "某局客户记忆沉淀",
    storeId: "store-customer-bureau",
    materialScope: "since_last",
    inputMaterialCount: 20,
    prompt: "重点整理决策与原因，合并重复的客户偏好，检查 POC 时间承诺。",
    modelTier: "advanced",
    status: "pending_review",
    tokenUsage: 28640,
    duration: "3 分 42 秒",
    addedNodeCount: 4,
    removedNodeCount: 1,
    modifiedNodeCount: 3,
    createdBy: "张敏",
    createdAt: "2026-06-12 09:32",
    diffFiles: customerDiff,
  },
  {
    id: "job-sales-v5",
    name: "售前打法季度记忆沉淀",
    storeId: "store-sales-playbook",
    materialScope: "time_range",
    inputMaterialCount: 36,
    prompt: "只保留可复用方法，删除过时竞品信息。",
    modelTier: "advanced",
    status: "published",
    tokenUsage: 52380,
    duration: "6 分 18 秒",
    addedNodeCount: 6,
    removedNodeCount: 3,
    modifiedNodeCount: 9,
    createdBy: "李华",
    createdAt: "2026-06-08 18:06",
    diffFiles: customerDiff.slice(0, 1),
  },
  {
    id: "job-claw-running",
    name: "本体 Claw 跨调用经验记忆沉淀",
    storeId: "store-claw-native",
    materialScope: "since_last",
    inputMaterialCount: 30,
    modelTier: "standard",
    status: "running",
    tokenUsage: 17420,
    duration: "运行中",
    addedNodeCount: 0,
    removedNodeCount: 0,
    modifiedNodeCount: 0,
    createdBy: "系统",
    createdAt: "2026-06-12 10:15",
    diffFiles: [],
  },
  {
    id: "job-bid-failed",
    name: "投标专项记忆沉淀",
    storeId: "store-bid-special",
    materialScope: "manual",
    inputMaterialCount: 4,
    modelTier: "standard",
    status: "failed",
    tokenUsage: 6180,
    duration: "42 秒",
    addedNodeCount: 0,
    removedNodeCount: 0,
    modifiedNodeCount: 0,
    createdBy: "王宇",
    createdAt: "2026-06-09 15:02",
    diffFiles: [],
  },
];

export const defaultClawMemoryMounts: ClawMemoryMount[] = [
  {
    id: "mount-customer",
    storeId: "store-customer-bureau",
    access: "read_only",
    usagePrompt: "处理某局项目、方案与交付问题时检索；发现新的客户事实时标为更新材料。",
  },
  {
    id: "mount-sales",
    storeId: "store-sales-playbook",
    access: "propose_only",
    usagePrompt: "编写政企方案和复盘售前任务时检索；可复用的方法标为更新材料。",
  },
];

export interface DreamingSessionOption {
  id: string;
  title: string;
  updatedAt: string;
}

export interface DreamingAgentSessionGroup {
  agentId: string;
  agentName: string;
  sessions: DreamingSessionOption[];
}

export interface DreamingDistilledMaterial {
  id: string;
  agentName: string;
  nodePath: string;
  summary: string;
  updatedAt: string;
}

export const dreamingAgentSessionGroups: DreamingAgentSessionGroup[] = [
  {
    agentId: "claw-native",
    agentName: "本体 Claw",
    sessions: [
      { id: "sess_visit_0610", title: "某局首次拜访纪要", updatedAt: "2026-06-10 16:20" },
      { id: "sess_visit_0618", title: "安全方案补充沟通", updatedAt: "2026-06-18 16:20" },
    ],
  },
  {
    agentId: "claw-plan",
    agentName: "方案写作 Claw",
    sessions: [
      { id: "sess_plan_0611", title: "POC 计划对齐", updatedAt: "2026-06-11 10:15" },
      { id: "sess_plan_0618", title: "POC 时间调整讨论", updatedAt: "2026-06-18 18:42" },
    ],
  },
  {
    agentId: "claw-impl",
    agentName: "实施顾问 Claw",
    sessions: [
      { id: "sess_impl_0617", title: "样例数据脱敏对接", updatedAt: "2026-06-17 11:05" },
    ],
  },
  {
    agentId: "claw-review",
    agentName: "复盘专家 Claw",
    sessions: [
      { id: "sess_review_0611", title: "售前复盘与打法整理", updatedAt: "2026-06-11 17:20" },
    ],
  },
  {
    agentId: "claw-sales",
    agentName: "售前 Claw",
    sessions: [
      { id: "sess_bid_0610", title: "竞品异议处理演练", updatedAt: "2026-06-10 20:12" },
    ],
  },
];

export const dreamingDistilledMaterials: DreamingDistilledMaterial[] = [
  {
    id: "cnode-native-solution-flow",
    agentName: "本体 Claw",
    nodePath: "procedures/政企方案编写流程.md",
    summary: "生成方案前先建立客户事实证据表。",
    updatedAt: "2026-06-12 10:02",
  },
  {
    id: "cnode-plan-poc",
    agentName: "方案写作 Claw",
    nodePath: "projects/POC 交付节奏.md",
    summary: "客户 POC 需预留安全测评与环境检查窗口。",
    updatedAt: "2026-06-18 18:42",
  },
  {
    id: "cnode-sales-budget",
    agentName: "售前 Claw",
    nodePath: "feedback/预算章节检查.md",
    summary: "先拆软件、服务、算力，再确认首期总价边界。",
    updatedAt: "2026-06-11 17:20",
  },
];

export function getMemoryStore(storeId: string) {
  return memoryStores.find((store) => store.id === storeId);
}

export function getUpdateJob(jobId: string) {
  return updateJobs.find((job) => job.id === jobId);
}

export function createMemoryStoreId(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "");

  if (!normalized) {
    return `store-${Date.now()}`;
  }

  return normalized.startsWith("store-") ? normalized : `store-${normalized}`;
}

export function createBlankMemoryFiles(storeName: string): MemoryFile[] {
  return [
    {
      id: `file-${Date.now()}-index`,
      path: "INDEX.md",
      content: `# ${storeName}\n\n## 记忆索引\n\n当前还没有主题节点。\n`,
    },
  ];
}

export function createTemplateMemoryFiles(storeName: string): MemoryFile[] {
  return [
    {
      id: `file-${Date.now()}-index`,
      path: "INDEX.md",
      content: `# ${storeName}\n\n## 记忆索引\n\n- [[entities/关键角色]]\n- [[decisions/关键决策]]\n- [[lessons/经验教训]]\n`,
    },
    {
      id: `file-${Date.now()}-entity`,
      path: "entities/关键角色.md",
      content: `---\ntype: project\nstatus: active\nsources: []\n---\n\n## 结论\n\n请补充关键角色与关系。\n`,
    },
    {
      id: `file-${Date.now()}-decision`,
      path: "decisions/关键决策.md",
      content: `---\ntype: project\nstatus: active\nsources: []\n---\n\n## 结论\n\n请补充决策、原因与决策人。\n`,
    },
    {
      id: `file-${Date.now()}-lesson`,
      path: "lessons/经验教训.md",
      content: `---\ntype: feedback\nstatus: active\nsources: []\n---\n\n## 结论\n\n请补充可复用经验。\n`,
    },
  ];
}
