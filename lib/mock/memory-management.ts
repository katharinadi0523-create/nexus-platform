// 记忆库（Memory Store）数据模型 —— 对齐《Claw 跨会话长期记忆系统》PRD v1.0
//
// 归属（scope）：user(U) / agent(C) / org(S)。管控端只呈现 C 与 S，U 永远归用户、不在管控端出现。
// 形态（kind）：builtin(内置自动创建) / shared(人工创建的组织共享库) / fork(从已有库复制)。
// 本期挂载库统一为「全量读写」(read_write)；细粒度 RO/RW 待平台数据权限就绪后再做（见 PRD §7）。

export type MemoryScope = "user" | "agent" | "org";
export type MemoryStoreKind = "builtin" | "shared" | "fork";
export type MemoryNodeStatus = "active" | "outdated" | "contested";
export type MemoryNodeType = "user" | "feedback" | "project" | "reference";

export type DreamingJobStatus =
  | "queued"
  | "running"
  | "pending_review"
  | "published"
  | "dismissed"
  | "failed";

// Dreaming 输入两选：库当前内容（已写入的主题文件）或 原始会话。
export type DreamingInputRef = "store_content" | "session";
export type DreamingModelTier = "standard" | "advanced";

// 本期全量读写：细粒度 RO/RW 待数据权限就绪。
export type MountAccess = "read_write";

export interface MemoryFile {
  id: string;
  path: string;
  content: string;
}

export interface MemoryVersion {
  /** YYYYMMDDXX — XX is the Nth version published on that calendar day (01–99). */
  version: string;
  source: "人工" | "记忆沉淀" | "导入" | "fork";
  author: string;
  createdAt: string;
  summary: string;
  files: MemoryFile[];
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
  scope: MemoryScope;
  kind: MemoryStoreKind;
  nodeCount: number;
  tokenCount: number;
  currentVersion: string;
  mountCount: number;
  lastDreamingAt?: string;
  updatedBy: string;
  updatedAt: string;
  files: MemoryFile[];
  versions: MemoryVersion[];
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

// 外溢提示：合成时发现更适合写入其他记忆库的片段；可一键写入，不静默跨库搬运。
export interface DreamingSpilloverHint {
  id: string;
  targetStoreId: string;
  targetStoreName: string;
  snippet: string;
}

export interface DreamingJob {
  id: string;
  name: string;
  storeId: string;
  // 输入两选：库当前内容 / 原始会话（可单选或组合）。
  inputRefs: DreamingInputRef[];
  inputSummary: string;
  prompt?: string;
  modelTier: DreamingModelTier;
  status: DreamingJobStatus;
  tokenUsage: number;
  duration: string;
  addedNodeCount: number;
  removedNodeCount: number;
  modifiedNodeCount: number;
  createdBy: string;
  createdAt: string;
  diffFiles: MemoryFileDiff[];
  spilloverHints?: DreamingSpilloverHint[];
}

export interface ClawMemoryMount {
  id: string;
  storeId: string;
  access: MountAccess;
  usagePrompt: string;
}

/** Format date as YYYYMMDD for version ids. */
export function formatMemoryVersionDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/** Build YYYYMMDDXX where XX is the Nth version on that day (01 = first, 20 = twentieth). */
export function createMemoryVersionId(date: Date, dailySequence: number): string {
  const sequence = String(Math.min(Math.max(dailySequence, 1), 99)).padStart(2, "0");
  return `${formatMemoryVersionDay(date)}${sequence}`;
}

/** First version id for a given day (or today). */
export function createInitialMemoryVersionId(date: Date = new Date()): string {
  return createMemoryVersionId(date, 1);
}

/** Next version id when publishing on the same day; resets to XX=01 on a new day. */
export function getNextMemoryVersionId(
  currentVersion: string,
  date: Date = new Date()
): string {
  const day = formatMemoryVersionDay(date);
  if (currentVersion.length === 10 && currentVersion.startsWith(day)) {
    const sequence = Number.parseInt(currentVersion.slice(8), 10);
    if (!Number.isNaN(sequence)) {
      return createMemoryVersionId(date, sequence + 1);
    }
  }
  return createMemoryVersionId(date, 1);
}

export function formatMemoryVersionLabel(version: string): string {
  return `v${version}`;
}

const customerIndexV2 = `# store_客户某局

## 记忆索引

- [决策链](entities/决策链.md) — 王主任主导业务决策，李工负责技术把关。
- [项目状态](entities/项目状态.md) — POC 计划与当前交付状态。
- [POC 时间承诺](decisions/2026-06-POC时间承诺.md) — POC 最晚于 2026 年 7 月中旬完成。
- [沟通注意事项](lessons/沟通注意事项.md) — 强调私有化、等保三级与可回滚交付。
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
topic: 客户决策链
type: project
sources: [sess_visit_0610]
updated_at: 2026-06-11
---

- 王主任主导业务决策，李工负责技术路线和 POC 验收。
- 首次拜访与第二轮方案评审均由王主任确认推进节奏。
- 李工负责技术问题收口与安全合规把关。
`,
  },
  {
    id: "customer-status",
    path: "entities/项目状态.md",
    content: `---
topic: 某局项目状态
type: project
sources: [sess_visit_0610, sess_plan_0611]
updated_at: 2026-06-11
---

- 项目处于 POC 准备阶段。
- 客户要求补充等保三级说明与本地模型部署清单。
`,
  },
  {
    id: "customer-poc",
    path: "decisions/2026-06-POC时间承诺.md",
    content: `---
topic: POC 时间承诺
type: project
sources: [sess_plan_0611]
updated_at: 2026-06-11
---

- POC 最晚于 2026 年 7 月中旬完成（原 6 月底，已更新）。
- 首轮环境检查在 6 月底前完成。
- 客户机房变更窗口集中在 7 月，需预留安全测评时间。
`,
  },
  {
    id: "customer-lesson",
    path: "lessons/沟通注意事项.md",
    content: `---
topic: 客户沟通注意事项
type: project
sources: [sess_visit_0610]
updated_at: 2026-06-11
---

- 方案沟通优先强调私有化部署、等保三级适配与升级可回滚。
- 不使用公网模型案例作为主证据。
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

## 记忆索引

- [政企方案五要素](procedures/政企方案五要素.md) — 政企方案的标准信息结构。
- [预算章节检查清单](lessons/预算章节检查清单.md) — 预算章节提交前检查项。
- [竞品异议处理](lessons/竞品异议处理.md) — 常见竞品异议应对。
`,
  },
  {
    id: "sales-five",
    path: "procedures/政企方案五要素.md",
    content: `---
topic: 政企方案五要素
type: reference
sources: [job_202605]
updated_at: 2026-05-28
---

- 方案需明确现状、建设目标、总体架构、实施路径与安全合规。
- 每一部分都要给出客户证据。
`,
  },
  {
    id: "sales-budget",
    path: "lessons/预算章节检查清单.md",
    content: `---
topic: 预算章节检查清单
type: feedback
sources: [sess_review_0611]
updated_at: 2026-06-11
---

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
    content: `# 我的Claw记忆库

## 记忆索引

- [政企方案编写流程](procedures/政企方案编写流程.md) — 先核对客户事实，再生成章节。
- [引用检查](lessons/引用检查.md) — 最终输出前核对来源和时效。
`,
  },
  {
    id: "builtin-procedure",
    path: "procedures/政企方案编写流程.md",
    content: `---
topic: 政企方案写作流程
type: reference
sources: [call_310, call_322, call_338]
updated_at: 2026-06-12
---

- 先检索客户库与行业规范，再建立章节证据表。
- 最后生成可交付文档并核对引用。
`,
  },
];

function cloneFiles(files: MemoryFile[]) {
  return files.map((file) => ({ ...file }));
}

const customerMountRelations: StoreMountRelation[] = [
  {
    id: "rel-customer-native",
    clawName: "本体 Claw",
    access: "read_write",
    usagePrompt: "处理某局项目、方案与交付问题时检索；发现新的客观事实时直接写入。",
    updatedAt: "2026-06-12 10:20",
  },
  {
    id: "rel-customer-plan",
    clawName: "方案写作 Claw",
    access: "read_write",
    usagePrompt: "生成方案时读取客户事实，发现冲突或新增事实时直接写入。",
    updatedAt: "2026-06-13 09:40",
  },
  {
    id: "rel-customer-impl",
    clawName: "实施顾问 Claw",
    access: "read_write",
    usagePrompt: "在交付计划和安全方案问答中检索与写入。",
    updatedAt: "2026-06-15 14:12",
  },
];

export const memoryStores: MemoryStore[] = [
  {
    id: "store-customer-bureau",
    name: "store_客户某局",
    description: "沉淀某局项目决策链、项目状态、关键承诺与沟通注意事项。",
    scope: "org",
    kind: "shared",
    nodeCount: 4,
    tokenCount: 18420,
    currentVersion: "2026061201",
    mountCount: 3,
    lastDreamingAt: "2026-06-12 09:36",
    updatedBy: "张敏",
    updatedAt: "2026-06-12 10:18",
    files: cloneFiles(customerFilesV2),
    versions: [
      {
        version: "2026061201",
        source: "记忆沉淀",
        author: "张敏",
        createdAt: "2026-06-12 09:36",
        summary: "将会话与库内容合成为 4 个主题文件，并重排 INDEX。",
        files: cloneFiles(customerFilesV2),
      },
      {
        version: "2026061001",
        source: "人工",
        author: "张敏",
        createdAt: "2026-06-10 16:20",
        summary: "由两次客户拜访纪要初始化。",
        files: cloneFiles(customerFilesV1),
      },
    ],
    mountRelations: customerMountRelations,
  },
  {
    id: "store-sales-playbook",
    name: "store_售前打法",
    description: "面向政企售前团队的通用方案方法、异议处理与复盘经验。",
    scope: "org",
    kind: "shared",
    nodeCount: 48,
    tokenCount: 76350,
    currentVersion: "2026060801",
    mountCount: 8,
    lastDreamingAt: "2026-06-08 18:12",
    updatedBy: "复盘专家 Claw",
    updatedAt: "2026-06-11 17:42",
    files: cloneFiles(salesPlaybookFiles),
    versions: [
      {
        version: "2026060801",
        source: "记忆沉淀",
        author: "复盘专家 Claw",
        createdAt: "2026-06-08 18:12",
        summary: "合并重复打法并淘汰过时竞品信息。",
        files: cloneFiles(salesPlaybookFiles),
      },
      {
        version: "2026052801",
        source: "人工",
        author: "李华",
        createdAt: "2026-05-28 11:04",
        summary: "补充预算章节检查清单。",
        files: cloneFiles(salesPlaybookFiles),
      },
    ],
    mountRelations: [
      {
        id: "rel-sales-native",
        clawName: "本体 Claw",
        access: "read_write",
        usagePrompt: "编写政企方案和复盘售前任务时检索；可复用的方法直接写入。",
        updatedAt: "2026-06-11 17:42",
      },
    ],
  },
  {
    id: "store-bid-special",
    name: "store_某局_投标专项",
    description: "从客户记忆库 fork 出的投标专项库，用于新投标 Claw 冷启动。",
    scope: "org",
    kind: "fork",
    nodeCount: 9,
    tokenCount: 12680,
    currentVersion: "2026060901",
    mountCount: 1,
    updatedBy: "王宇",
    updatedAt: "2026-06-09 14:30",
    files: cloneFiles(customerFilesV2.slice(0, 4)),
    versions: [
      {
        version: "2026060901",
        source: "fork",
        author: "王宇",
        createdAt: "2026-06-09 14:30",
        summary: "从 store_客户某局 v2026061001 fork 出投标专项记忆。",
        files: cloneFiles(customerFilesV2.slice(0, 4)),
      },
    ],
    mountRelations: [
      {
        id: "rel-bid-special",
        clawName: "投标 Claw",
        access: "read_write",
        usagePrompt: "投标专项资料生成时检索与写入。",
        updatedAt: "2026-06-09 14:35",
      },
    ],
  },
  {
    id: "store-claw-native",
    name: "我的Claw记忆库",
    description: "本体 Claw 在跨用户任务中积累的脱敏执行经验（自带 C 库）。",
    scope: "agent",
    kind: "builtin",
    nodeCount: 26,
    tokenCount: 43820,
    currentVersion: "2026061001",
    mountCount: 1,
    lastDreamingAt: "2026-06-10 02:00",
    updatedBy: "系统",
    updatedAt: "2026-06-12 10:02",
    files: cloneFiles(builtInFiles),
    versions: [
      {
        version: "2026061001",
        source: "记忆沉淀",
        author: "系统",
        createdAt: "2026-06-10 02:00",
        summary: "从 30 次调用中蒸馏政企方案写作经验。",
        files: cloneFiles(builtInFiles),
      },
      {
        version: "2026053001",
        source: "人工",
        author: "陈晨",
        createdAt: "2026-05-30 15:16",
        summary: "补充输出引用检查规则。",
        files: cloneFiles(builtInFiles),
      },
    ],
    mountRelations: [
      {
        id: "rel-native-self",
        clawName: "本体 Claw",
        access: "read_write",
        usagePrompt: "系统自带，不可卸载。",
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
      { type: "added", content: "- [决策链](entities/决策链.md) — 王主任主导，李工技术把关。" },
      { type: "added", content: "- [POC 时间承诺](decisions/2026-06-POC时间承诺.md) — 7 月中旬完成。" },
      { type: "added", content: "- [沟通注意事项](lessons/沟通注意事项.md) — 强调私有化与等保三级。" },
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

export const dreamingJobs: DreamingJob[] = [
  {
    id: "job-customer-v2",
    name: "某局客户记忆沉淀",
    storeId: "store-customer-bureau",
    inputRefs: ["store_content", "session"],
    inputSummary: "库当前内容 + 安全方案补充会话",
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
    spilloverHints: [
      {
        id: "spill-customer-1",
        targetStoreId: "store-sales-playbook",
        targetStoreName: "store_售前打法",
        snippet: "「政企客户先确认部署方式，再谈方案细节」是可泛化打法，更适合写入售前打法库。",
      },
      {
        id: "spill-customer-2",
        targetStoreId: "store-sales-playbook",
        targetStoreName: "store_售前打法",
        snippet: "「等保三级适配清单」可抽象为政企方案的通用安全合规章节。",
      },
    ],
  },
  {
    id: "job-sales-v5",
    name: "售前打法季度记忆沉淀",
    storeId: "store-sales-playbook",
    inputRefs: ["store_content"],
    inputSummary: "库当前内容",
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
    inputRefs: ["session"],
    inputSummary: "30 次调用会话",
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
    inputRefs: ["store_content"],
    inputSummary: "库当前内容",
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
    access: "read_write",
    usagePrompt: "处理某局项目、方案与交付问题时检索；发现新的客户事实时直接写入。",
  },
  {
    id: "mount-sales",
    storeId: "store-sales-playbook",
    access: "read_write",
    usagePrompt: "编写政企方案和复盘售前任务时检索；可复用的方法直接写入。",
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

export function getMemoryStore(storeId: string) {
  return memoryStores.find((store) => store.id === storeId);
}

export function getDreamingJob(jobId: string) {
  return dreamingJobs.find((job) => job.id === jobId);
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
      content: `# ${storeName}\n\n## 记忆索引\n\n当前还没有主题文件。\n`,
    },
  ];
}

export function createTemplateMemoryFiles(storeName: string): MemoryFile[] {
  return [
    {
      id: `file-${Date.now()}-index`,
      path: "INDEX.md",
      content: `# ${storeName}\n\n## 记忆索引\n\n- [关键角色](entities/关键角色.md) — 关键角色与关系。\n- [关键决策](decisions/关键决策.md) — 决策、原因与决策人。\n- [经验教训](lessons/经验教训.md) — 可复用经验。\n`,
    },
    {
      id: `file-${Date.now()}-entity`,
      path: "entities/关键角色.md",
      content: `---\ntopic: 关键角色\ntype: project\nsources: []\n---\n\n请补充关键角色与关系。\n`,
    },
    {
      id: `file-${Date.now()}-decision`,
      path: "decisions/关键决策.md",
      content: `---\ntopic: 关键决策\ntype: project\nsources: []\n---\n\n请补充决策、原因与决策人。\n`,
    },
    {
      id: `file-${Date.now()}-lesson`,
      path: "lessons/经验教训.md",
      content: `---\ntopic: 经验教训\ntype: feedback\nsources: []\n---\n\n请补充可复用经验。\n`,
    },
  ];
}
