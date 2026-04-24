export type MarketplaceSourceType = "platform" | "org";
export type AudienceCategory =
  | "ai"
  | "dev"
  | "efficiency"
  | "data"
  | "content"
  | "security"
  | "communication";
export type MarketplaceDependencyToolType = "mcp" | "plugin";

export interface MarketplaceSkillFile {
  id: string;
  path: string;
  content: string;
}

export interface MarketplaceSkillDependency {
  id: string;
  name: string;
  type: MarketplaceDependencyToolType;
}

export interface MarketplaceSkillSeed {
  id: string;
  name: string;
  author: string;
  publishedAt: string;
  publishedBy: string;
  version?: string;
  releaseNotes?: string;
  description: string;
  detailDescription?: string;
  usageInstructions?: string;
  category: string;
  scene?: string;
  inputExample?: string;
  outputExample?: string;
  sourceType: MarketplaceSourceType;
  audienceCategory: AudienceCategory;
  isFavorite: boolean;
  tags: string[];
  declaredDependencies?: MarketplaceSkillDependency[];
  downloads: number;
  boundToCEC: boolean;
  files: MarketplaceSkillFile[];
}

export interface MarketplaceSkillConfigOption {
  id: string;
  name: string;
  description: string;
  sizeLabel: string;
  badge: string;
  hint: string;
  fileCount: number;
  createdAtLabel: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9一-龥]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function createSeedFile(path: string, content: string, prefix: string): MarketplaceSkillFile {
  return {
    id: `${prefix}-${slugify(path)}-seed`,
    path,
    content,
  };
}

export const MARKETPLACE_SKILL_DEPENDENCY_OPTIONS: MarketplaceSkillDependency[] = [
  { id: "mcp-policy-center", name: "制度中心 MCP", type: "mcp" },
  { id: "mcp-contract-review", name: "合同审阅 MCP", type: "mcp" },
  { id: "mcp-mail-gateway", name: "邮件网关 MCP", type: "mcp" },
  { id: "mcp-lanxin-message", name: "蓝信消息 MCP", type: "mcp" },
  { id: "plugin-office-suite", name: "办公套件插件", type: "plugin" },
  { id: "plugin-travel-expense", name: "差旅报销插件", type: "plugin" },
  { id: "plugin-procurement-center", name: "招采协同插件", type: "plugin" },
  { id: "plugin-public-opinion", name: "舆情监测插件", type: "plugin" },
  { id: "mcp-erp-finance", name: "ERP MCP", type: "mcp" },
  { id: "mcp-approval-workflow", name: "审批系统 MCP", type: "mcp" },
  { id: "plugin-invoice-verification", name: "票据核验服务", type: "plugin" },
  { id: "mcp-intelligence-ontology", name: "情报场景本体 MCP", type: "mcp" },
  { id: "mcp-security-validation", name: "安全校验服务MCP", type: "mcp" },
];

const TRAVEL_REIMBURSEMENT_DEPENDENCIES: MarketplaceSkillDependency[] = [
  { id: "workflow-invoice-verification", name: "验票工作流", type: "plugin" },
  { id: "workflow-auto-form-fill", name: "自动填单工作流", type: "plugin" },
];

export const MARKETPLACE_SKILL_SEEDS: MarketplaceSkillSeed[] = [
  {
    id: "af-rag",
    name: "制度流程查询",
    author: "平台办公中心",
    publishedAt: "03-26 16:28",
    publishedBy: "楠不难",
    version: "1.2",
    releaseNotes:
      "补充请示、采购、报销三类高频流程的办理口径；新增常见材料清单和跨部门会签注意事项，减少答复过泛的问题。",
    description:
      "用于结合制度库、流程手册和审批规范，快速回答请示、采购、报销等常见流程问题，并提示所需材料与注意事项。",
    category: "通用",
    sourceType: "platform",
    audienceCategory: "ai",
    isFavorite: true,
    tags: ["制度", "流程", "审批"],
    usageInstructions:
      "输入你要办理的事项、当前场景和希望得到的结果，例如“我要发起采购审批，需要准备哪些材料？”系统会先说明适用制度和流程，再列出所需材料、审批节点和注意事项。",
    declaredDependencies: [MARKETPLACE_SKILL_DEPENDENCY_OPTIONS[0]],
    downloads: 4598,
    boundToCEC: true,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: policy-process-qa
description: "围绕制度、流程和审批规范回答业务问题。"
---

# 使用规则
- 优先说明适用制度和办理流程
- 明确所需材料、审批节点和注意事项
- 涉及口径冲突时给出区别说明
`,
        "tpl-af-rag"
      ),
      createSeedFile(
        "templates/qa-card.md",
        `# 适用事项
# 办理依据
# 所需材料
# 注意事项
`,
        "tpl-af-rag"
      ),
    ],
  },
  {
    id: "af-ask-data",
    name: "经营问数",
    author: "平台经营中心",
    publishedAt: "03-25 14:18",
    publishedBy: "周可",
    version: "1.1",
    releaseNotes:
      "优化经营指标问答口径，新增预算执行偏差说明模板，并补充项目复盘场景下的异常归因建议。",
    description:
      "用于围绕经营指标、项目数据和预算执行情况直接提问，快速形成口径说明、异常原因和汇报结论。",
    category: "通用",
    sourceType: "platform",
    audienceCategory: "ai",
    isFavorite: true,
    tags: ["经营分析", "指标", "预算"],
    downloads: 4213,
    boundToCEC: true,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: business-metric-qa
description: "围绕经营指标、预算执行和项目进度形成结论说明。"
---

# 输出要求
- 先说明指标口径和统计范围
- 再给出核心结论与同比环比变化
- 对异常波动补充可能原因和建议动作
`,
        "tpl-af-ask-data"
      ),
      createSeedFile(
        "templates/brief.md",
        `# 指标口径
# 核心结论
# 异常原因
# 建议动作
`,
        "tpl-af-ask-data"
      ),
    ],
  },
  {
    id: "cestc-mail",
    name: "正式邮件撰写",
    author: "综合办公室-李晓晓",
    publishedAt: "03-24 11:06",
    publishedBy: "李晓晓",
    version: "1.1",
    releaseNotes:
      "增强催办、汇报、请示三类邮件模板，统一结尾反馈时限写法，并补充对外正式邮件的敬语规范。",
    description:
      "用于起草对内对外正式邮件，自动补齐事项背景、需要配合的动作和反馈时限，适合催办、汇报和请示场景。",
    category: "通用",
    sourceType: "org",
    audienceCategory: "ai",
    isFavorite: true,
    tags: ["邮件", "催办", "汇报"],
    usageInstructions:
      "补充邮件对象、事项背景、希望对方配合的动作和时间要求，即可生成正式邮件。适合催办、汇报、提醒、请示等场景。",
    declaredDependencies: [MARKETPLACE_SKILL_DEPENDENCY_OPTIONS[4], MARKETPLACE_SKILL_DEPENDENCY_OPTIONS[2]],
    downloads: 2984,
    boundToCEC: false,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: official-mail-writing
description: "生成正式、得体、行动清晰的业务邮件。"
---

# 写作要求
- 开头说明背景和来意
- 中间列出需配合事项与时间
- 结尾明确责任人和反馈方式
`,
        "tpl-cestc-mail"
      ),
      createSeedFile(
        "templates/mail.md",
        `各位同事：

现就 {{topic}} 事项说明如下：
1. 事项背景
2. 需协同动作
3. 反馈时限
`,
        "tpl-cestc-mail"
      ),
    ],
  },
  {
    id: "lanxin-communication",
    name: "蓝信通知编写",
    author: "办公协同中心-王晨",
    publishedAt: "03-24 17:42",
    publishedBy: "王晨",
    description:
      "用于把会议安排、任务提醒和值班通知整理成适合蓝信发送的短消息，减少群内来回确认。",
    category: "通用",
    sourceType: "org",
    audienceCategory: "ai",
    isFavorite: false,
    tags: ["蓝信", "通知", "通讯协同"],
    downloads: 2147,
    boundToCEC: false,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: lanxin-notice
description: "输出适合蓝信群聊和单聊发送的通知消息。"
---

# 表达要求
- 第一行说明主题和场景
- 第二行明确动作和责任人
- 最后一行给时间节点或会议地点
`,
        "tpl-lanxin"
      ),
    ],
  },
  {
    id: "travel-expense",
    name: "差旅申请与报销",
    author: "共享服务中心-赵明",
    publishedAt: "03-23 09:55",
    publishedBy: "赵明",
    version: "1.1",
    releaseNotes:
      "补充图片上传式使用说明；新增报销材料清单、审批说明模板和异常票据处理提示；依赖声明更新为验票工作流和自动填单工作流。",
    description:
      "用于生成差旅申请、补充审批说明，并根据上传票据整理报销材料、预校验附件完整性。",
    detailDescription:
      "这是一个面向企业行政与共享服务场景的办公技能，适合承接员工出差申请、行程说明补充和报销资料预整理。技能会根据上传的票据图片、行程信息和审批要求，生成申请说明、材料清单和后续报销建议，减少重复填报和遗漏说明。",
    category: "通用",
    scene: "智能办公",
    inputExample: "我上传了机票、酒店发票和出差说明，帮我整理差旅申请并准备后续报销材料。",
    outputExample: "已生成差旅申请说明，缺少出租车发票，已整理报销材料清单。",
    sourceType: "org",
    audienceCategory: "ai",
    isFavorite: true,
    tags: ["差旅", "报销", "审批", "验票", "填单"],
    usageInstructions:
      "上传机票、火车票、酒店发票、出租车票、电子行程单等图片或截图，并补充出差事由、时间、地点、预算和同行人员。技能会先生成差旅申请与审批说明，再整理报销所需材料、标记缺失项，并在需要时衔接验票工作流和自动填单工作流。",
    declaredDependencies: TRAVEL_REIMBURSEMENT_DEPENDENCIES,
    downloads: 2763,
    boundToCEC: false,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: travel-expense
description: "生成差旅申请说明、整理报销材料，并为后续验票与自动填单提供结构化输入。"
---

# 使用要求
- 上传机票、酒店发票、行程单和其他差旅票据图片
- 补充出差事由、时间、地点、预算和同行人员
- 输出差旅申请说明、报销材料清单和待补充项

# 默认执行链路
- 先生成差旅申请与审批说明
- 再整理报销材料并检查附件是否齐全
- 需要时把材料交给验票工作流和自动填单工作流
`,
        "tpl-travel"
      ),
      createSeedFile(
        "templates/application.md",
        `# 出差申请

## 出差目的
## 行程安排
## 预算说明
## 需审批事项
## 已上传材料
## 报销准备提示
`,
        "tpl-travel"
      ),
      createSeedFile(
        "templates/reimbursement-materials.md",
        `# 报销材料整理单

## 一、已上传票据
- 机票 / 火车票：
- 酒店发票：
- 市内交通票据：

## 二、待补充材料
- 缺失附件：
- 待补充说明：

## 三、后续处理建议
- 是否进入验票工作流：
- 是否进入自动填单工作流：
`,
        "tpl-travel"
      ),
    ],
  },
  {
    id: "travel-expense-reimbursement",
    name: "差旅报销",
    author: "平台办公服务中心",
    publishedAt: "03-26 16:28",
    publishedBy: "顾宁",
    version: "1.2",
    releaseNotes:
      "补充图片上传式使用说明；依赖声明更新为验票工作流和自动填单工作流；细化材料完整性校验、自动填单结果和审批确认文案。",
    description:
      "用于处理员工差旅报销申请，完成材料检查、验票校验、自动填单与审批发起。",
    detailDescription:
      "这是一个面向企业办公场景的标准化技能，用于承接员工差旅报销相关任务。它会根据上传的票据图片、行程单和差旅说明，先完成材料完整性检查，再调用验票工作流和自动填单工作流，生成 ERP 报销草稿，并在发起审批前给出一次人工确认。",
    category: "通用",
    scene: "智能办公",
    inputExample: "我上传了机票、酒店发票和行程单，帮我提交这笔差旅报销，验票、填单并发起审批。",
    outputExample: "验票完成，3 张票据通过校验；报销草稿已自动填写，待你确认后发起审批。",
    sourceType: "platform",
    audienceCategory: "ai",
    isFavorite: false,
    tags: ["办公", "差旅", "报销", "审批", "验票", "填单"],
    usageInstructions:
      "上传机票、火车票、酒店发票、出租车票、电子行程单、付款截图等报销材料图片，并补充出差事由、时间范围和审批单号。系统会先检查材料是否齐全，再执行验票工作流和自动填单工作流，生成 ERP 报销草稿，并在提交审批前返回确认结果或待补充项。",
    declaredDependencies: TRAVEL_REIMBURSEMENT_DEPENDENCIES,
    downloads: 3256,
    boundToCEC: false,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: travel-expense-reimbursement
description: "用于处理员工差旅报销申请，完成材料检查、验票校验、自动填单与审批发起。"
---

# 处理要求
- 上传发票、行程单、付款截图等报销材料图片
- 核对报销事项、行程和费用标准
- 先执行验票工作流，再执行自动填单工作流
- 输出表单填写结果、审批状态和待补充项
`,
        "tpl-travel-expense-reimbursement"
      ),
      createSeedFile(
        "templates/reimbursement-checklist.md",
        `# 差旅报销检查清单

## 一、材料完整性
### 已上传材料
### 缺失材料
## 二、票据校验结果
### 验票工作流结果
### 重复报销/抬头异常检查
## 三、报销字段填写
### 自动填单工作流结果
### ERP 草稿单号
## 四、审批提交状态
### HitL 确认
### 审批流去向
`,
        "tpl-travel-expense-reimbursement"
      ),
      createSeedFile(
        "templates/approval-summary.md",
        `# 报销处理结果

## 验票结果
- 通过票据数：
- 异常票据：

## 自动填单结果
- 预计报销金额：
- ERP 草稿单号：

## 下一步
- 是否发起审批：
- 待补充项：
`,
        "tpl-travel-expense-reimbursement"
      ),
    ],
  },
  {
    id: "xlsx",
    name: "生产日报汇总",
    author: "制造运营中心",
    publishedAt: "03-22 18:16",
    publishedBy: "许航",
    version: "1.1",
    releaseNotes:
      "新增班组异常波动识别规则，补充停机原因归类口径，并优化日报末尾的需协调事项摘要结构。",
    description:
      "用于汇总各班组产量、停机、质量和交付数据，自动形成生产日报并标出异常波动，适合制造和工业现场使用。",
    category: "数据分析",
    sourceType: "platform",
    audienceCategory: "data",
    isFavorite: true,
    tags: ["生产", "制造", "日报"],
    usageInstructions:
      "上传或整理班组产量、停机、质量和交付数据后，技能会自动汇总当日情况，标记异常波动，并输出适合报送的生产日报。",
    declaredDependencies: [MARKETPLACE_SKILL_DEPENDENCY_OPTIONS[4]],
    downloads: 3076,
    boundToCEC: true,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: production-daily-summary
description: "汇总生产、停机、质量和交付数据，形成生产日报。"
---

# 输出要求
- 先汇总当日产量、停机和质量情况
- 标记异常班组、异常时段和原因
- 末尾补充需协调事项和次日关注点
`,
        "tpl-xlsx"
      ),
      createSeedFile(
        "templates/daily-report.md",
        `# 生产日报

## 一、当日产量
## 二、停机情况
## 三、质量问题
## 四、交付进展
## 五、需协调事项
`,
        "tpl-xlsx"
      ),
      createSeedFile(
        "scripts/build-report.ts",
        `export function buildProductionSummary(items: string[]) {
  return items.join("\\n");
}
`,
        "tpl-xlsx"
      ),
    ],
  },
  {
    id: "intelligence-analysis",
    name: "情报分析",
    author: "平台情报分析中心",
    publishedAt: "03-26 16:28",
    publishedBy: "孟川",
    version: "2.0",
    releaseNotes:
      "新增竞品动态与行业政策情报归集能力；支持多源信息去重过滤、敏感内容校验与结构化拆解；支持结合本体历史数据进行真伪研判、重要性回填与图谱溯源。",
    description:
      "用于汇集竞品动态、行业政策等多源情报，并结合本体能力完成真伪研判、重点识别与结构化输出。",
    detailDescription:
      "这是一个面向企业情报场景的标准化技能，用于承接竞品、政策、行业动态等分析任务。它会调用本体能力完成情报汇集、真伪研判、重要性判断、关联扩散与结果沉淀，适合在情报归集和辅助决策场景中使用。",
    category: "通用",
    scene: "情报研判",
    inputExample: "搜集本周竞品动态和行业政策变化，输出一份符合公司规范的情报简报",
    outputExample: "已生成情报简报，含来源依据与重点结论",
    sourceType: "platform",
    audienceCategory: "ai",
    isFavorite: true,
    tags: ["情报", "政策", "竞品", "智能办公"],
    usageInstructions:
      "输入你关注的主题、时间范围和期望结果，例如“搜集本周竞品动态和行业政策变化，输出一份符合公司规范的情报简报”。系统会自动汇集相关情报，完成筛选、校验、研判和结构化整理，并输出带来源依据的结果。",
    declaredDependencies: [MARKETPLACE_SKILL_DEPENDENCY_OPTIONS[11], MARKETPLACE_SKILL_DEPENDENCY_OPTIONS[12]],
    downloads: 2874,
    boundToCEC: false,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: intelligence-analysis
description: "用于汇集竞品动态、行业政策等多源情报，并完成真伪研判与结构化输出。"
---

# 分析要求
- 汇集竞品动态、政策和公开行业信息
- 对来源进行去重、筛选和敏感内容校验
- 输出重点判断、来源依据和结构化简报
`,
        "tpl-intelligence-analysis"
      ),
      createSeedFile(
        "templates/intelligence-brief.md",
        `# 情报简报

## 一、重点主题
## 二、来源依据
## 三、关键变化
## 四、真伪研判
## 五、建议关注事项
`,
        "tpl-intelligence-analysis"
      ),
    ],
  },
  {
    id: "frontend-design",
    name: "业务系统需求说明",
    author: "数字化建设部",
    publishedAt: "03-22 10:24",
    publishedBy: "林越",
    description:
      "用于把调研纪要、审批流程和表单字段整理成业务系统需求说明，便于立项、评审和上线准备。",
    category: "开发工具",
    sourceType: "platform",
    audienceCategory: "dev",
    isFavorite: false,
    tags: ["需求", "项目管理", "系统建设"],
    downloads: 2107,
    boundToCEC: false,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: system-requirement-brief
description: "整理业务调研结论，形成系统建设需求说明。"
---

# 产出要求
- 明确建设目标、范围和参与角色
- 梳理流程、字段和审批节点
- 补充验收标准与上线准备事项
`,
        "tpl-frontend"
      ),
      createSeedFile(
        "templates/requirement-outline.md",
        `# 建设背景
# 业务目标
# 使用角色
# 主要流程
# 表单字段
# 验收标准
`,
        "tpl-frontend"
      ),
      createSeedFile(
        "templates/acceptance-list.md",
        `- 流程是否闭环
- 表单字段是否齐全
- 权限是否清晰
- 上线准备是否完成
`,
        "tpl-frontend"
      ),
    ],
  },
  {
    id: "doc-coauthoring",
    name: "会议纪要整理",
    author: "综合办公室-周媛",
    publishedAt: "03-21 15:08",
    publishedBy: "周媛",
    description:
      "用于根据会议录音、讨论记录和待办事项快速形成正式纪要，明确责任人、时间节点和后续动作。",
    category: "通讯协作",
    sourceType: "org",
    audienceCategory: "communication",
    isFavorite: true,
    tags: ["纪要", "会议", "待办"],
    downloads: 3382,
    boundToCEC: false,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: meeting-minutes
description: "整理会议记录并形成正式纪要。"
---

# 纪要要求
- 先写会议主题、时间和参会范围
- 再写讨论结论和责任分工
- 最后列出待办事项和完成时限
`,
        "tpl-doc"
      ),
      createSeedFile(
        "templates/meeting-minutes.md",
        `# 会议主题
# 参会人员
# 核心结论
# 待办事项
# 时间节点
`,
        "tpl-doc"
      ),
    ],
  },
  {
    id: "brand-guidelines",
    name: "合同条款审阅",
    author: "法务合规部-陈昱",
    publishedAt: "03-21 09:42",
    publishedBy: "陈昱",
    description:
      "用于梳理合同关键条款、识别履约与付款风险，并生成审阅意见和审批说明，适合采购、服务和合作协议场景。",
    category: "企业服务",
    sourceType: "org",
    audienceCategory: "content",
    isFavorite: false,
    tags: ["合同", "法务", "合规"],
    usageInstructions:
      "输入合同正文或关键条款片段，说明当前业务场景和关注点，技能会识别履约、付款、违约等重点风险，并生成审阅意见。",
    declaredDependencies: [MARKETPLACE_SKILL_DEPENDENCY_OPTIONS[1]],
    downloads: 1934,
    boundToCEC: false,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: contract-review
description: "识别合同关键风险并形成审阅意见。"
---

# 审阅要求
- 明确付款、交付、验收和违约条款
- 标记争议点和需补充说明项
- 形成审批意见与风险提示
`,
        "tpl-brand"
      ),
      createSeedFile(
        "templates/review-notes.md",
        `# 合同基本信息
# 关键条款
# 风险提示
# 审阅意见
`,
        "tpl-brand"
      ),
    ],
  },
  {
    id: "mcp-builder",
    name: "设备巡检记录整理",
    author: "设备管理中心-孙博",
    publishedAt: "03-20 16:35",
    publishedBy: "孙博",
    description:
      "用于汇总巡检记录、缺陷照片和处理意见，形成设备缺陷台账和整改清单，适合能源、电力和工业现场。",
    category: "效率工具",
    sourceType: "org",
    audienceCategory: "efficiency",
    isFavorite: false,
    tags: ["巡检", "台账", "电力"],
    usageInstructions:
      "导入巡检记录、缺陷照片说明和处理意见后，技能会自动整理缺陷台账、整改清单和复查建议，便于现场闭环。",
    declaredDependencies: [MARKETPLACE_SKILL_DEPENDENCY_OPTIONS[4]],
    downloads: 2415,
    boundToCEC: true,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: inspection-ledger
description: "整理巡检记录并形成设备缺陷台账。"
---

# 整理要求
- 区分设备名称、位置和缺陷等级
- 记录发现时间、处置状态和责任人
- 输出待整改清单和复查建议
`,
        "tpl-mcp"
      ),
      createSeedFile(
        "templates/inspection-ledger.md",
        `# 巡检时间
# 设备位置
# 缺陷描述
# 当前状态
# 整改建议
`,
        "tpl-mcp"
      ),
    ],
  },
  {
    id: "webapp-testing",
    name: "投标材料检查",
    author: "招采管理部-何静",
    publishedAt: "03-20 11:12",
    publishedBy: "何静",
    description:
      "用于核对投标文件是否齐套，检查资质、授权、盖章和报价说明，减少递交前遗漏和返工。",
    category: "安全合规",
    sourceType: "org",
    audienceCategory: "security",
    isFavorite: false,
    tags: ["招采", "投标", "合规"],
    usageInstructions:
      "输入本次投标项目的材料目录或上传拟递交文件，技能会逐项检查资质、授权、盖章、报价说明等是否齐套，并输出缺漏清单。",
    declaredDependencies: [MARKETPLACE_SKILL_DEPENDENCY_OPTIONS[6]],
    downloads: 1862,
    boundToCEC: false,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: bid-document-check
description: "检查投标材料是否齐套、合规、可递交。"
---

# 检查要求
- 核对资质、授权、盖章和时效
- 检查报价、承诺函和响应文件是否齐全
- 标记缺失项和需补充说明项
`,
        "tpl-test"
      ),
      createSeedFile(
        "checklists/bid-check.md",
        `- 资质文件是否齐全
- 授权文件是否有效
- 盖章签字是否完整
- 报价说明是否一致
`,
        "tpl-test"
      ),
    ],
  },
  {
    id: "workflow-copilot",
    name: "公文写作",
    author: "公文规范组",
    publishedAt: "03-19 14:26",
    publishedBy: "宋远",
    description:
      "用于根据事项背景、请示内容和报送对象生成正式公文，适合通知、请示、报告和情况说明等场景。",
    category: "通用",
    sourceType: "platform",
    audienceCategory: "ai",
    isFavorite: true,
    tags: ["公文", "请示", "报告"],
    usageInstructions:
      "输入事项背景、报送对象、希望生成的公文类型，以及关键事实和请示点，技能会输出结构规范、语气正式的公文初稿。",
    declaredDependencies: [MARKETPLACE_SKILL_DEPENDENCY_OPTIONS[0], MARKETPLACE_SKILL_DEPENDENCY_OPTIONS[4]],
    downloads: 4826,
    boundToCEC: true,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: official-document-writing
description: "生成正式、规范、可报送的公文内容。"
---

# 写作要求
- 先说明背景、依据和目的
- 中间写进展、问题或请示事项
- 结尾明确建议、请求和办理时限
`,
        "tpl-copilot"
      ),
      createSeedFile(
        "templates/official-doc.md",
        `# 标题
# 背景情况
# 主要事项
# 请示或建议
# 附件说明
`,
        "tpl-copilot"
      ),
    ],
  },
  {
    id: "ops-automation",
    name: "运输日报生成",
    author: "运输调度中心-刘畅",
    publishedAt: "03-19 09:18",
    publishedBy: "刘畅",
    description:
      "用于整合车队、线路、时效和异常信息，快速形成运输日报和问题清单，适合物流和运输协同场景。",
    category: "效率工具",
    sourceType: "org",
    audienceCategory: "efficiency",
    isFavorite: false,
    tags: ["运输", "物流", "日报"],
    downloads: 1725,
    boundToCEC: false,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: transport-daily
description: "汇总运输执行情况并形成日报。"
---

# 输出要求
- 汇总发运量、到货时效和异常线路
- 标记延误、滞留和待协调事项
- 形成当日情况和次日安排
`,
        "tpl-ops"
      ),
      createSeedFile(
        "templates/logistics-daily.md",
        `# 当日发运情况
# 到货时效
# 异常线路
# 协调事项
`,
        "tpl-ops"
      ),
    ],
  },
  {
    id: "public-opinion",
    name: "企业舆情整理",
    author: "投资研究中心",
    publishedAt: "03-18 13:52",
    publishedBy: "韩松",
    description:
      "用于汇总新闻、公告和公开资料，形成企业舆情摘要、风险提示和尽调备忘，适合投资研判和合作前评估。",
    category: "数据分析",
    sourceType: "platform",
    audienceCategory: "data",
    isFavorite: false,
    tags: ["舆情", "金融", "风控"],
    usageInstructions:
      "输入目标企业名称、关注时间范围和研判目的，技能会汇总公开资料并输出舆情摘要、风险提示和待核实事项。",
    declaredDependencies: [MARKETPLACE_SKILL_DEPENDENCY_OPTIONS[7]],
    downloads: 2286,
    boundToCEC: true,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: enterprise-public-opinion
description: "整理企业公开信息并输出舆情摘要和风险提示。"
---

# 输出要求
- 汇总相关新闻、公告和公开信息
- 提炼正负面舆情和影响判断
- 标记需进一步核实的事项
`,
        "tpl-public-opinion"
      ),
      createSeedFile(
        "templates/opinion-summary.md",
        `# 企业概况
# 舆情摘要
# 风险提示
# 待核实事项
`,
        "tpl-public-opinion"
      ),
    ],
  },
  {
    id: "power-operation-daily",
    name: "运行日报生成",
    author: "调度运行中心-高楠",
    publishedAt: "03-18 08:47",
    publishedBy: "高楠",
    description:
      "用于整理机组运行、负荷变化、停送电和异常处置情况，自动形成运行日报和交接班摘要，适合电力和能源场景。",
    category: "效率工具",
    sourceType: "org",
    audienceCategory: "efficiency",
    isFavorite: false,
    tags: ["运行", "电力", "值班"],
    downloads: 1848,
    boundToCEC: false,
    files: [
      createSeedFile(
        "SKILL.md",
        `---
name: power-operation-daily
description: "整理运行数据并生成日报和交接班摘要。"
---

# 输出要求
- 汇总运行状态、负荷变化和异常处置
- 记录当班重点事项和风险提示
- 形成交接班说明和后续关注点
`,
        "tpl-power-daily"
      ),
      createSeedFile(
        "templates/operation-daily.md",
        `# 运行概况
# 负荷变化
# 异常处置
# 交接班事项
`,
        "tpl-power-daily"
      ),
    ],
  },
];

function formatSkillSizeLabel(files: MarketplaceSkillFile[]) {
  const totalChars = files.reduce((sum, file) => sum + file.path.length + file.content.length, 0);
  const sizeKb = Math.max(0.3, totalChars / 1024);
  return `${sizeKb.toFixed(1)} KB`;
}

function formatSkillCreatedAtLabel(publishedAt: string): string {
  const [md, hm = "00:00"] = publishedAt.trim().split(/\s+/);
  const [mm = "01", dd = "01"] = md.split("-");
  const [hh = "00", mi = "00"] = hm.split(":");
  return `创建时间: 2026-${mm}-${dd} ${hh}:${mi}:00`;
}

export function getMarketplaceSkillConfigOptions(): MarketplaceSkillConfigOption[] {
  return MARKETPLACE_SKILL_SEEDS.map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    sizeLabel: formatSkillSizeLabel(skill.files),
    badge: skill.sourceType === "platform" ? "平台精选" : "我的组织",
    hint: skill.scene ? `适用场景：${skill.scene}` : `适用分类：${skill.category}`,
    fileCount: skill.files.length,
    createdAtLabel: formatSkillCreatedAtLabel(skill.publishedAt),
  }));
}

/** 技能管理侧可选技能（与技能广场列表分离，用于 Claw 配置弹窗第二 Tab） */
const MANAGED_SKILL_CONFIG_OPTIONS: MarketplaceSkillConfigOption[] = [
  {
    id: "skill-managed-compliance-pack",
    name: "合规审查技能包",
    description: "已在租户技能管理中发布，支持制度条款比对与引用追溯。",
    sizeLabel: "18.2 KB",
    badge: "技能管理",
    hint: "来源：本租户 · 已发布",
    fileCount: 11,
    createdAtLabel: "更新时间: 2026-02-18 14:30:00",
  },
  {
    id: "skill-managed-hr-onboarding",
    name: "入职材料归集",
    description: "从邮箱与网盘拉取材料、分类命名并写入 HR 系统草稿。",
    sizeLabel: "9.6 KB",
    badge: "技能管理",
    hint: "来源：本租户 · 已发布",
    fileCount: 6,
    createdAtLabel: "更新时间: 2026-03-05 09:12:00",
  },
  {
    id: "skill-managed-ops-daily",
    name: "运维日报生成",
    description: "汇总监控告警、变更记录与值班备注，输出结构化日报。",
    sizeLabel: "14.0 KB",
    badge: "技能管理",
    hint: "来源：本租户 · 草稿",
    fileCount: 9,
    createdAtLabel: "更新时间: 2026-03-28 16:45:00",
  },
];

export function getManagedSkillConfigOptions(): MarketplaceSkillConfigOption[] {
  return MANAGED_SKILL_CONFIG_OPTIONS;
}
