"use client";

import { ChangeEvent, useDeferredValue, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  BookCopy,
  Bot,
  ChevronDown,
  ChevronRight,
  Download,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  Heart,
  LayoutGrid,
  Package,
  PanelLeft,
  Plus,
  Rocket,
  Save,
  Search,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SkillSource = "template" | "blank" | "imported";
type SkillStatus = "draft" | "published";
type MarketplaceSourceType = "platform" | "org";
type MarketplaceSourceFilter = "all" | MarketplaceSourceType | "favorite";
type AudienceCategory =
  | "ai"
  | "dev"
  | "efficiency"
  | "data"
  | "content"
  | "security"
  | "communication";
type AudienceCategoryFilter = "all" | AudienceCategory;

interface SkillFile {
  id: string;
  path: string;
  content: string;
}

interface SkillTemplate {
  id: string;
  name: string;
  author: string;
  description: string;
  category: string;
  sourceType: MarketplaceSourceType;
  audienceCategory: AudienceCategory;
  isFavorite: boolean;
  tags: string[];
  downloads: number;
  boundToCEC: boolean;
  files: SkillFile[];
}

interface MySkill {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  source: SkillSource;
  status: SkillStatus;
  linkedCECClaws: string[];
  files: SkillFile[];
  activeFileId: string;
  openFileIds: string[];
  dirty: boolean;
  updatedAt: string;
  publishedTemplateId?: string;
}

interface SkillBundle {
  schemaVersion: 1;
  name: string;
  description: string;
  category: string;
  tags: string[];
  files: Array<Pick<SkillFile, "path" | "content">>;
}

interface FileTreeNode {
  name: string;
  path: string;
  type: "folder" | "file";
  fileId?: string;
  skillId?: string;
  children: FileTreeNode[];
}

interface TreeFileEntry {
  fileId: string;
  path: string;
  skillId: string;
}

const CATEGORY_OPTIONS = [
  { value: "通用", label: "通用" },
  { value: "开发工具", label: "开发工具" },
  { value: "数据分析", label: "数据分析" },
  { value: "通讯协作", label: "通讯协作" },
  { value: "企业服务", label: "企业服务" },
  { value: "效率工具", label: "效率工具" },
  { value: "安全合规", label: "安全合规" },
];

const CEC_CLAW_INSTANCE = "华东专属 CEC-Claw";
const ALL_SKILLS_VALUE = "__all__";

const SOURCE_FILTERS = [
  { value: "all", label: "全部" },
  { value: "platform", label: "平台精选" },
  { value: "org", label: "我的组织" },
  { value: "favorite", label: "我收藏的" },
] satisfies Array<{ value: MarketplaceSourceFilter; label: string }>;

const USER_CATEGORY_FILTERS = [
  { value: "all", label: "全部类型" },
  { value: "ai", label: "通用" },
  { value: "dev", label: "开发工具" },
  { value: "data", label: "数据分析" },
  { value: "communication", label: "通讯协作" },
  { value: "content", label: "企业服务" },
  { value: "efficiency", label: "效率工具" },
  { value: "security", label: "安全合规" },
] satisfies Array<{ value: AudienceCategoryFilter; label: string }>;

function formatNow() {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function createFile(path: string, content: string, prefix: string): SkillFile {
  return {
    id: `${prefix}-${slugify(path)}-${Math.random().toString(36).slice(2, 7)}`,
    path,
    content,
  };
}

function cloneFiles(files: SkillFile[], prefix: string) {
  return files.map((file) => createFile(file.path, file.content, prefix));
}

function createMySkill(input: {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  source: SkillSource;
  status?: SkillStatus;
  files: SkillFile[];
  linkedCECClaws?: string[];
  publishedTemplateId?: string;
}) {
  const files = cloneFiles(input.files, input.id);
  const firstFileId = files[0]?.id ?? "";

  return {
    id: input.id,
    name: input.name,
    description: input.description,
    category: input.category,
    tags: [...input.tags],
    source: input.source,
    status: input.status ?? "draft",
    linkedCECClaws: input.linkedCECClaws ?? [],
    files,
    activeFileId: firstFileId,
    openFileIds: firstFileId ? [firstFileId] : [],
    dirty: false,
    updatedAt: formatNow(),
    publishedTemplateId: input.publishedTemplateId,
  } satisfies MySkill;
}

const marketplaceSeeds: SkillTemplate[] = [
  {
    id: "af-rag",
    name: "制度流程查询",
    author: "平台办公中心",
    description:
      "用于结合制度库、流程手册和审批规范，快速回答请示、采购、报销等常见流程问题，并提示所需材料与注意事项。",
    category: "通用",
    sourceType: "platform",
    audienceCategory: "ai",
    isFavorite: true,
    tags: ["制度", "流程", "审批"],
    downloads: 4598,
    boundToCEC: true,
    files: [
      createFile(
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
      createFile(
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
      createFile(
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
      createFile(
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
    author: "综合办公室",
    description:
      "用于起草对内对外正式邮件，自动补齐事项背景、需要配合的动作和反馈时限，适合催办、汇报和请示场景。",
    category: "通用",
    sourceType: "org",
    audienceCategory: "ai",
    isFavorite: true,
    tags: ["邮件", "催办", "汇报"],
    downloads: 2984,
    boundToCEC: false,
    files: [
      createFile(
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
      createFile(
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
    author: "办公协同中心",
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
      createFile(
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
    author: "共享服务中心",
    description:
      "用于自动生成差旅申请、补充审批说明并衔接报销材料整理，减少重复填报和遗漏说明。",
    category: "通用",
    sourceType: "org",
    audienceCategory: "ai",
    isFavorite: true,
    tags: ["差旅", "报销", "审批"],
    downloads: 2763,
    boundToCEC: false,
    files: [
      createFile(
        "SKILL.md",
        `---
name: travel-expense
description: "生成差旅申请、预算说明和报销摘要。"
---

# 办理要求
- 写清事由、时间、地点和预算
- 标记同行人和审批链
- 报销时补充票据和异常说明
`,
        "tpl-travel"
      ),
      createFile(
        "templates/application.md",
        `# 出差申请

## 出差目的
## 行程安排
## 预算说明
## 需审批事项
`,
        "tpl-travel"
      ),
    ],
  },
  {
    id: "xlsx",
    name: "生产日报汇总",
    author: "制造运营中心",
    description:
      "用于汇总各班组产量、停机、质量和交付数据，自动形成生产日报并标出异常波动，适合制造和工业现场使用。",
    category: "数据分析",
    sourceType: "platform",
    audienceCategory: "data",
    isFavorite: true,
    tags: ["生产", "制造", "日报"],
    downloads: 3076,
    boundToCEC: true,
    files: [
      createFile(
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
      createFile(
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
      createFile(
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
    id: "frontend-design",
    name: "业务系统需求说明",
    author: "数字化建设部",
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
      createFile(
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
      createFile(
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
      createFile(
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
    author: "综合办公室",
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
      createFile(
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
      createFile(
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
    author: "法务合规部",
    description:
      "用于梳理合同关键条款、识别履约与付款风险，并生成审阅意见和审批说明，适合采购、服务和合作协议场景。",
    category: "企业服务",
    sourceType: "org",
    audienceCategory: "content",
    isFavorite: false,
    tags: ["合同", "法务", "合规"],
    downloads: 1934,
    boundToCEC: false,
    files: [
      createFile(
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
      createFile(
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
    author: "设备管理中心",
    description:
      "用于汇总巡检记录、缺陷照片和处理意见，形成设备缺陷台账和整改清单，适合能源、电力和工业现场。",
    category: "效率工具",
    sourceType: "org",
    audienceCategory: "efficiency",
    isFavorite: false,
    tags: ["巡检", "台账", "电力"],
    downloads: 2415,
    boundToCEC: true,
    files: [
      createFile(
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
      createFile(
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
    author: "招采管理部",
    description:
      "用于核对投标文件是否齐套，检查资质、授权、盖章和报价说明，减少递交前遗漏和返工。",
    category: "安全合规",
    sourceType: "org",
    audienceCategory: "security",
    isFavorite: false,
    tags: ["招采", "投标", "合规"],
    downloads: 1862,
    boundToCEC: false,
    files: [
      createFile(
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
      createFile(
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
    description:
      "用于根据事项背景、请示内容和报送对象生成正式公文，适合通知、请示、报告和情况说明等场景。",
    category: "通用",
    sourceType: "platform",
    audienceCategory: "ai",
    isFavorite: true,
    tags: ["公文", "请示", "报告"],
    downloads: 4826,
    boundToCEC: true,
    files: [
      createFile(
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
      createFile(
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
    author: "运输调度中心",
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
      createFile(
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
      createFile(
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
    description:
      "用于汇总新闻、公告和公开资料，形成企业舆情摘要、风险提示和尽调备忘，适合投资研判和合作前评估。",
    category: "数据分析",
    sourceType: "platform",
    audienceCategory: "data",
    isFavorite: false,
    tags: ["舆情", "金融", "风控"],
    downloads: 2286,
    boundToCEC: true,
    files: [
      createFile(
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
      createFile(
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
    author: "调度运行中心",
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
      createFile(
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
      createFile(
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

const initialMarketplace: SkillTemplate[] = marketplaceSeeds.map((template) => ({
  ...template,
  files: cloneFiles(template.files, `seed-${template.id}`),
}));

const initialMySkills: MySkill[] = [
  createMySkill({
    id: "my-xlsx",
    name: "xlsx",
    description:
      "为表格治理团队定制的 xlsx Skill，补充了数据清洗、公式检查与财务字段说明。",
    category: "数据分析",
    tags: ["Excel", "财务"],
    source: "template",
    status: "published",
    files: marketplaceSeeds.find((skill) => skill.id === "xlsx")?.files ?? [],
    linkedCECClaws: [CEC_CLAW_INSTANCE],
    publishedTemplateId: "xlsx",
  }),
  createMySkill({
    id: "ops-summary",
    name: "运营简报生成器",
    description: "面向每周经营复盘的内部 Skill 草稿，聚焦周报结构化整理与摘要输出。",
    category: "通讯协作",
    tags: ["周报", "运营"],
    source: "blank",
    files: [
      createFile(
        "START.md",
        `# START

1. 收集经营数据
2. 生成结构化摘要
3. 标记风险与待办
`,
        "my-ops"
      ),
      createFile(
        "SKILL.md",
        `---
name: ops-weekly
description: "沉淀经营周报模板与摘要规范。"
---

# Output
- 周重点
- 目标完成度
- 风险与资源请求
`,
        "my-ops"
      ),
      createFile(
        "scripts/render-report.ts",
        `export function renderWeeklySummary(items: string[]) {
  return items.map((item, index) => \`\${index + 1}. \${item}\`).join("\\n");
}
`,
        "my-ops"
      ),
    ],
  }),
  createMySkill({
    id: "ai-gov-writing",
    name: "AI产线公文写作",
    description:
      "面向 AI 产线项目周报、立项请示、阶段汇报和会议通知的公文写作 Skill，统一结构、语气和审批口径。",
    category: "通讯协作",
    tags: ["公文", "AI产线", "请示", "汇报"],
    source: "blank",
    status: "published",
    linkedCECClaws: [CEC_CLAW_INSTANCE],
    files: [
      createFile(
        "START.md",
        `# START

1. 选择公文类型：请示 / 通知 / 周报 / 汇报
2. 补充背景、目标、进展、风险和待决策事项
3. 根据审批对象切换正式程度与措辞
`,
        "my-gov"
      ),
      createFile(
        "SKILL.md",
        `---
name: ai-official-writing
description: "为 AI 产线项目生成规范、正式、可审批的公文与汇报材料。"
---

# Writing Rules
- 先写背景和目标，再写进展、问题和请求
- 行文保持正式、简洁、可执行
- 对关键数字、时间节点和责任人做显式说明
- 涉及风险时同步给出缓释方案和决策建议
`,
        "my-gov"
      ),
      createFile(
        "templates/weekly-brief.md",
        `# AI产线周报

## 一、本周重点进展
## 二、关键指标与交付状态
## 三、存在问题
## 四、下周计划
## 五、需协调事项
`,
        "my-gov"
      ),
      createFile(
        "templates/meeting-notice.md",
        `# 会议通知

各相关单位：

兹定于 {{date}} 召开 AI 产线专题会，请围绕以下事项做好准备：
1. 阶段目标完成情况
2. 当前阻塞问题
3. 下阶段资源需求
`,
        "my-gov"
      ),
      createFile(
        "scripts/polish-official-tone.ts",
        `export function polishOfficialTone(content: string) {
  return content
    .replace(/我们/g, "项目组")
    .replace(/尽快/g, "按计划")
    .replace(/搞定/g, "完成");
}
`,
        "my-gov"
      ),
    ],
  }),
  createMySkill({
    id: "mcp-sync-assistant",
    name: "MCP接口联调助手",
    description:
      "帮助研发团队沉淀 MCP 服务联调脚本、接口约定和问题排查记录，适合多系统联调阶段快速复用。",
    category: "开发工具",
    tags: ["MCP", "联调", "接口", "排障"],
    source: "imported",
    files: [
      createFile(
        "START.md",
        `# START

1. 确认待联调接口和环境
2. 补充鉴权方式与参数样例
3. 记录错误码、回包与排查动作
`,
        "my-mcp"
      ),
      createFile(
        "SKILL.md",
        `---
name: mcp-sync-assistant
description: "沉淀 MCP 联调流程、检查单和问题记录。"
---

# Workflow
- 先校验入参与环境变量
- 对比预期回包与实际回包
- 将排查结果整理成可复用结论
`,
        "my-mcp"
      ),
      createFile(
        "checklists/debug-checklist.md",
        `- 网关地址是否正确
- Token 是否过期
- Tool schema 是否同步
- 超时和重试策略是否符合预期
`,
        "my-mcp"
      ),
      createFile(
        "scripts/mock-request.ts",
        `export async function mockRequest(toolName: string) {
  return { toolName, status: "ok", latency: 128 };
}
`,
        "my-mcp"
      ),
    ],
  }),
  createMySkill({
    id: "quality-review-assistant",
    name: "质检审校助手",
    description:
      "用于对外材料、项目方案和交付文档进行一致性检查、敏感词审校和格式复核，适合上线前最后一轮质检。",
    category: "安全合规",
    tags: ["质检", "审校", "合规"],
    source: "template",
    files: [
      createFile(
        "START.md",
        `# START

1. 导入待审校文档
2. 指定审校标准：格式 / 敏感词 / 表述一致性
3. 输出问题清单和修订建议
`,
        "my-review"
      ),
      createFile(
        "SKILL.md",
        `---
name: quality-review-assistant
description: "检查交付文档中的格式、表述和合规问题。"
---

# Review Focus
- 标题层级是否一致
- 术语与命名是否统一
- 是否存在不宜对外披露的描述
`,
        "my-review"
      ),
      createFile(
        "templates/review-report.md",
        `# 审校报告

## 问题概览
## 高优先级修改项
## 一般修改建议
## 建议责任人
`,
        "my-review"
      ),
    ],
  }),
];

function buildFileTree(files: TreeFileEntry[]) {
  const nodes: FileTreeNode[] = [];

  files.forEach((file) => {
    const segments = file.path.split("/").filter(Boolean);
    let currentLevel = nodes;
    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const existing = currentLevel.find((node) => node.path === currentPath);

      if (existing) {
        currentLevel = existing.children;
        return;
      }

      const node: FileTreeNode = {
        name: segment,
        path: currentPath,
        type: index === segments.length - 1 ? "file" : "folder",
        fileId: index === segments.length - 1 ? file.fileId : undefined,
        skillId: index === segments.length - 1 ? file.skillId : undefined,
        children: [],
      };

      currentLevel.push(node);
      currentLevel = node.children;
    });
  });

  const sortNodes = (tree: FileTreeNode[]): FileTreeNode[] =>
    [...tree]
      .sort((left, right) => {
        if (left.type !== right.type) {
          return left.type === "folder" ? -1 : 1;
        }
        return left.name.localeCompare(right.name, "zh-CN");
      })
      .map((node) => ({
        ...node,
        children: sortNodes(node.children),
      }));

  return sortNodes(nodes);
}

function fileIcon(path: string) {
  const lowerPath = path.toLowerCase();
  if (
    lowerPath.endsWith(".ts") ||
    lowerPath.endsWith(".tsx") ||
    lowerPath.endsWith(".js") ||
    lowerPath.endsWith(".jsx") ||
    lowerPath.endsWith(".json") ||
    lowerPath.endsWith(".css")
  ) {
    return FileCode2;
  }

  return FileText;
}

function serializeSkillBundle(skill: Pick<MySkill, "name" | "description" | "category" | "tags" | "files">): string {
  const bundle: SkillBundle = {
    schemaVersion: 1,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    tags: [...skill.tags],
    files: skill.files.map((file) => ({
      path: file.path,
      content: file.content,
    })),
  };

  return JSON.stringify(bundle, null, 2);
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function uniqueName(name: string, existingNames: string[]) {
  let candidate = name;
  let counter = 2;

  while (existingNames.includes(candidate)) {
    candidate = `${name} ${counter}`;
    counter += 1;
  }

  return candidate;
}

function normalizeImportedPath(path: string) {
  const segments = path.split("/").filter(Boolean);
  if (segments.length > 1) {
    return segments.slice(1).join("/");
  }

  return segments[0] ?? "SKILL.md";
}

const CATEGORY_SORT_ORDER: Record<AudienceCategory, number> = {
  ai: 0,
  dev: 1,
  data: 2,
  communication: 3,
  content: 4,
  efficiency: 5,
  security: 6,
};

const GENERAL_SKILL_PRIORITY = [
  "公文写作",
  "制度流程查询",
  "经营问数",
  "正式邮件撰写",
  "蓝信通知编写",
  "差旅申请与报销",
];

function getMarketplaceSourceLabel(sourceType: MarketplaceSourceType) {
  return sourceType === "platform" ? "平台精选" : "我的组织";
}

function getMarketplaceSourceBadgeClass(sourceType: MarketplaceSourceType) {
  return sourceType === "platform"
    ? "border-sky-200 bg-sky-50 text-sky-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getMarketplaceSourceFilterClass(filterValue: MarketplaceSourceFilter, active: boolean) {
  if (!active) {
    return "text-slate-600 hover:text-slate-900";
  }

  switch (filterValue) {
    case "platform":
      return "bg-sky-100 text-sky-700";
    case "org":
      return "bg-emerald-100 text-emerald-700";
    case "favorite":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function hasChineseText(value: string) {
  return /[\u4e00-\u9fff]/.test(value);
}

function mapEditorCategoryToAudienceCategory(category: string): AudienceCategory {
  switch (category) {
    case "通用":
      return "ai";
    case "开发工具":
      return "dev";
    case "数据分析":
      return "data";
    case "通讯协作":
      return "communication";
    case "企业服务":
      return "content";
    case "安全合规":
      return "security";
    default:
      return "efficiency";
  }
}

export default function SkillsPage() {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [marketplaceSkills, setMarketplaceSkills] = useState<SkillTemplate[]>(initialMarketplace);
  const [mySkills, setMySkills] = useState<MySkill[]>(initialMySkills);
  const [selectedSkillId, setSelectedSkillId] = useState(initialMySkills[0]?.id ?? "");
  const [focusedSkillId, setFocusedSkillId] = useState(initialMySkills[0]?.id ?? "");
  const [marketSearch, setMarketSearch] = useState("");
  const [marketSourceFilter, setMarketSourceFilter] = useState<MarketplaceSourceFilter>("all");
  const [audienceCategoryFilter, setAudienceCategoryFilter] =
    useState<AudienceCategoryFilter>("all");
  const [fileSearch, setFileSearch] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const importInputRef = useRef<HTMLInputElement>(null);

  const deferredMarketSearch = useDeferredValue(marketSearch);
  const deferredFileSearch = useDeferredValue(fileSearch);
  const isAllSkillsSelected = selectedSkillId === ALL_SKILLS_VALUE;

  const activeSkill = useMemo(
    () =>
      isAllSkillsSelected
        ? mySkills.find((skill) => skill.id === focusedSkillId) ?? mySkills[0] ?? null
        : mySkills.find((skill) => skill.id === selectedSkillId) ?? mySkills[0] ?? null,
    [focusedSkillId, isAllSkillsSelected, mySkills, selectedSkillId]
  );

  const activeFile = useMemo(
    () => activeSkill?.files.find((file) => file.id === activeSkill.activeFileId) ?? null,
    [activeSkill]
  );

  const filteredMarketplaceSkills = useMemo(() => {
    const query = deferredMarketSearch.trim().toLowerCase();

    return marketplaceSkills
      .filter((skill) => {
        const matchesSource =
          marketSourceFilter === "all"
            ? true
            : marketSourceFilter === "favorite"
              ? skill.isFavorite
              : skill.sourceType === marketSourceFilter;
        const matchesAudience =
          audienceCategoryFilter === "all" || skill.audienceCategory === audienceCategoryFilter;

        if (!query) {
          return matchesSource && matchesAudience;
        }

        const matchesQuery = [skill.name, skill.description, skill.category, skill.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(query);

        return matchesSource && matchesAudience && matchesQuery;
      })
      .sort((left, right) => {
        if (audienceCategoryFilter === "all") {
          const categoryDelta =
            CATEGORY_SORT_ORDER[left.audienceCategory] - CATEGORY_SORT_ORDER[right.audienceCategory];
          if (categoryDelta !== 0) {
            return categoryDelta;
          }
        }

        if (left.audienceCategory === "ai" && right.audienceCategory === "ai") {
          const leftPriority = GENERAL_SKILL_PRIORITY.indexOf(left.name);
          const rightPriority = GENERAL_SKILL_PRIORITY.indexOf(right.name);
          const normalizedLeftPriority =
            leftPriority === -1 ? Number.MAX_SAFE_INTEGER : leftPriority;
          const normalizedRightPriority =
            rightPriority === -1 ? Number.MAX_SAFE_INTEGER : rightPriority;

          if (normalizedLeftPriority !== normalizedRightPriority) {
            return normalizedLeftPriority - normalizedRightPriority;
          }
        }

        const chineseDelta = Number(hasChineseText(right.name)) - Number(hasChineseText(left.name));
        if (chineseDelta !== 0) {
          return chineseDelta;
        }

        return left.name.localeCompare(right.name, "zh-CN");
      });
  }, [audienceCategoryFilter, deferredMarketSearch, marketplaceSkills, marketSourceFilter]);

  const visibleFiles = useMemo<TreeFileEntry[]>(() => {
    const scopedSkills = isAllSkillsSelected ? mySkills : activeSkill ? [activeSkill] : [];
    if (scopedSkills.length === 0) {
      return [];
    }

    const query = deferredFileSearch.trim().toLowerCase();
    const files = scopedSkills.flatMap((skill) =>
      skill.files.map((file) => ({
        fileId: file.id,
        skillId: skill.id,
        path: isAllSkillsSelected ? `${skill.name}/${file.path}` : file.path,
      }))
    );

    if (!query) {
      return files;
    }

    return files.filter((file) => file.path.toLowerCase().includes(query));
  }, [activeSkill, deferredFileSearch, isAllSkillsSelected, mySkills]);

  const fileTree = useMemo(() => buildFileTree(visibleFiles), [visibleFiles]);

  const updateSkill = (skillId: string, updater: (skill: MySkill) => MySkill) => {
    setMySkills((current) =>
      current.map((skill) => (skill.id === skillId ? updater(skill) : skill))
    );
  };

  const selectSkill = (skillId: string) => {
    setSelectedSkillId(skillId);
    if (skillId !== ALL_SKILLS_VALUE) {
      setFocusedSkillId(skillId);
    }
    setFileSearch("");
  };

  const selectFile = (fileId: string, skillId: string) => {
    if (!skillId) {
      return;
    }

    setFocusedSkillId(skillId);
    updateSkill(skillId, (skill) => ({
      ...skill,
      activeFileId: fileId,
      openFileIds: skill.openFileIds.includes(fileId)
        ? skill.openFileIds
        : [...skill.openFileIds, fileId],
    }));
  };

  const closeFile = (fileId: string, skillId: string) => {
    if (!skillId) {
      return;
    }

    setFocusedSkillId(skillId);
    updateSkill(skillId, (skill) => {
      const nextOpenFileIds = skill.openFileIds.filter((openFileId) => openFileId !== fileId);
      const nextActiveFileId =
        skill.activeFileId === fileId
          ? nextOpenFileIds[0] ?? skill.files.find((file) => file.id !== fileId)?.id ?? ""
          : skill.activeFileId;

      return {
        ...skill,
        openFileIds: nextOpenFileIds,
        activeFileId: nextActiveFileId,
      };
    });
  };

  const updateActiveFileContent = (content: string) => {
    if (!activeSkill || !activeFile) {
      return;
    }

    updateSkill(activeSkill.id, (skill) => ({
      ...skill,
      dirty: true,
      files: skill.files.map((file) => (file.id === activeFile.id ? { ...file, content } : file)),
    }));
  };

  const updateActiveSkillField = (field: keyof Pick<MySkill, "name" | "description" | "category">, value: string) => {
    if (!activeSkill) {
      return;
    }

    updateSkill(activeSkill.id, (skill) => ({
      ...skill,
      [field]: value,
      dirty: true,
    }));
  };

  const handleSave = () => {
    if (!activeSkill) {
      return;
    }

    updateSkill(activeSkill.id, (skill) => ({
      ...skill,
      dirty: false,
      updatedAt: formatNow(),
    }));

    toast.success(`已保存 Skill：${activeSkill.name}`);
  };

  const handlePublish = () => {
    if (!activeSkill) {
      return;
    }

    const publishedId = activeSkill.publishedTemplateId ?? `${slugify(activeSkill.name)}-published`;
    const publishedTemplate: SkillTemplate = {
      id: publishedId,
      name: activeSkill.name,
      author: "我的Skills",
      description: activeSkill.description,
      category: activeSkill.category,
      sourceType:
        marketplaceSkills.find((item) => item.id === publishedId)?.sourceType ?? "org",
      audienceCategory: mapEditorCategoryToAudienceCategory(activeSkill.category),
      isFavorite:
        marketplaceSkills.find((item) => item.id === publishedId)?.isFavorite ?? false,
      tags: activeSkill.tags,
      downloads:
        marketplaceSkills.find((item) => item.id === publishedId)?.downloads ?? 0,
      boundToCEC:
        activeSkill.linkedCECClaws.length > 0 ||
        marketplaceSkills.find((item) => item.id === publishedId)?.boundToCEC === true,
      files: cloneFiles(activeSkill.files, `published-${publishedId}`),
    };

    setMarketplaceSkills((current) => {
      const exists = current.some((item) => item.id === publishedId);
      if (exists) {
        return current.map((item) => (item.id === publishedId ? publishedTemplate : item));
      }

      return [publishedTemplate, ...current];
    });

    updateSkill(activeSkill.id, (skill) => ({
      ...skill,
      dirty: false,
      status: "published",
      updatedAt: formatNow(),
      publishedTemplateId: publishedId,
    }));

    toast.success(`已发布到 Skills 广场：${activeSkill.name}`);
  };

  const handleCreateBlankSkill = () => {
    const nextName = uniqueName("new-skill", mySkills.map((skill) => skill.name));
    const skill = createMySkill({
      id: `${slugify(nextName)}-${Date.now()}`,
      name: nextName,
      description: "请在这里填写 Skill 的用途、触发条件和交付要求。",
      category: "通用",
      tags: ["自定义"],
      source: "blank",
      files: [
        createFile(
          "START.md",
          `# START

1. 定义使用场景
2. 列出输入与输出
3. 补充需要调用的脚本或模板
`,
          "blank-start"
        ),
        createFile(
          "SKILL.md",
          `---
name: ${nextName}
description: "Describe what this skill should do."
---

# Instructions
- Trigger when...
- Deliverable should include...
- Avoid...
`,
          "blank-skill"
        ),
      ],
    });

    setMySkills((current) => [skill, ...current]);
    setSelectedSkillId(skill.id);
    setActiveTab("mine");
    toast.success(`已创建空白 Skill：${skill.name}`);
  };

  const handleAddFile = () => {
    if (!activeSkill) {
      return;
    }

    const nextIndex = activeSkill.files.length + 1;
    const nextFile = createFile(
      `draft-${nextIndex}.md`,
      `# draft-${nextIndex}

在这里补充新的模板说明或脚本设计。
`,
      `draft-${activeSkill.id}`
    );

    updateSkill(activeSkill.id, (skill) => ({
      ...skill,
      dirty: true,
      files: [...skill.files, nextFile],
      activeFileId: nextFile.id,
      openFileIds: [...skill.openFileIds, nextFile.id],
    }));

    toast.success(`已新增文件：${nextFile.path}`);
  };

  const handleDownloadTemplate = (template: SkillTemplate) => {
    downloadTextFile(`${template.name}.skill.json`, serializeSkillBundle({
      name: template.name,
      description: template.description,
      category: template.category,
      tags: template.tags,
      files: template.files,
    }));

    toast.success(`已下载 Skill：${template.name}`);
  };

  const handleBindToCEC = (templateId: string) => {
    setMarketplaceSkills((current) =>
      current.map((skill) =>
        skill.id === templateId ? { ...skill, boundToCEC: true } : skill
      )
    );

    toast.success(`已绑定到 ${CEC_CLAW_INSTANCE}`);
  };

  const handleToggleFavorite = (templateId: string) => {
    let nextFavorite = false;

    setMarketplaceSkills((current) =>
      current.map((skill) => {
        if (skill.id !== templateId) {
          return skill;
        }

        nextFavorite = !skill.isFavorite;

        return {
          ...skill,
          isFavorite: nextFavorite,
        };
      })
    );

    toast.success(nextFavorite ? "已加入收藏" : "已取消收藏");
  };

  const handleCopyTemplate = (template: SkillTemplate) => {
    const nextName = uniqueName(template.name, mySkills.map((skill) => skill.name));
    const nextSkill = createMySkill({
      id: `${slugify(nextName)}-${Date.now()}`,
      name: nextName,
      description: template.description,
      category: template.category,
      tags: template.tags,
      source: "template",
      files: template.files,
      linkedCECClaws: template.boundToCEC ? [CEC_CLAW_INSTANCE] : [],
      publishedTemplateId: template.id,
    });

    setMySkills((current) => [nextSkill, ...current]);
    setSelectedSkillId(nextSkill.id);
    setActiveTab("mine");
    toast.success(`模板已复制到我的Skills：${nextSkill.name}`);
  };

  const handleImportSkills = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    try {
      if (
        selectedFiles.length === 1 &&
        selectedFiles[0].name.toLowerCase().endsWith(".skill.json")
      ) {
        const bundle = JSON.parse(await selectedFiles[0].text()) as Partial<SkillBundle>;
        const bundleFiles =
          bundle.files?.map((file, index) =>
            createFile(file.path ?? `file-${index + 1}.md`, file.content ?? "", "import-bundle")
          ) ?? [];

        const importedSkill = createMySkill({
          id: `${slugify(bundle.name ?? "imported-skill")}-${Date.now()}`,
          name: uniqueName(bundle.name ?? "imported-skill", mySkills.map((skill) => skill.name)),
          description: bundle.description ?? "从导出文件导入的 Skill。",
          category: bundle.category ?? "通用",
          tags: bundle.tags ?? ["导入"],
          source: "imported",
          files:
            bundleFiles.length > 0
              ? bundleFiles
              : [createFile("SKILL.md", "# Imported Skill", "import-fallback")],
        });

        setMySkills((current) => [importedSkill, ...current]);
        setSelectedSkillId(importedSkill.id);
        setActiveTab("mine");
        toast.success(`已导入 Skill：${importedSkill.name}`);
      } else {
        const contents = await Promise.all(
          selectedFiles.map(async (file) => ({
            path: normalizeImportedPath(file.webkitRelativePath || file.name),
            content: await file.text(),
          }))
        );

        const rawName = selectedFiles[0].webkitRelativePath
          ? selectedFiles[0].webkitRelativePath.split("/")[0]
          : selectedFiles[0].name.replace(/\.[^.]+$/, "");

        const importedSkill = createMySkill({
          id: `${slugify(rawName)}-${Date.now()}`,
          name: uniqueName(rawName, mySkills.map((skill) => skill.name)),
          description: "从本地文件导入的 Skill 草稿。",
          category: "通用",
          tags: ["导入"],
          source: "imported",
          files: contents.map((file, index) =>
            createFile(file.path || `file-${index + 1}.md`, file.content, "import-multi")
          ),
        });

        setMySkills((current) => [importedSkill, ...current]);
        setSelectedSkillId(importedSkill.id);
        setActiveTab("mine");
        toast.success(`已导入 Skill：${importedSkill.name}`);
      }
    } catch {
      toast.error("导入失败，请检查文件格式");
    } finally {
      event.target.value = "";
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((current) => ({
      ...current,
      [path]: !(current[path] ?? true),
    }));
  };

  const renderTree = (nodes: FileTreeNode[], depth = 0) =>
    nodes.map((node) => {
      if (node.type === "folder") {
        const isExpanded = expandedFolders[node.path] ?? true;

        return (
          <div key={node.path}>
            <button
              type="button"
              onClick={() => toggleFolder(node.path)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-sky-600" />
              ) : (
                <Folder className="h-4 w-4 text-slate-500" />
              )}
              <span className="truncate">{node.name}</span>
            </button>
            {isExpanded ? <div>{renderTree(node.children, depth + 1)}</div> : null}
          </div>
        );
      }

      const Icon = fileIcon(node.name);
      const isActive = activeSkill?.activeFileId === node.fileId;

      return (
        <button
          key={node.path}
          type="button"
          onClick={() => node.fileId && node.skillId && selectFile(node.fileId, node.skillId)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
            isActive
              ? "bg-slate-100 text-slate-950"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
          style={{ paddingLeft: `${depth * 16 + 24}px` }}
        >
          <Icon className="h-4 w-4 text-slate-500" />
          <span className="truncate">{node.name}</span>
        </button>
      );
    });

  const activeFileLineCount = activeFile ? activeFile.content.split("\n").length : 0;
  const activeFileCharCount = activeFile?.content.length ?? 0;
  const totalMySkillFileCount = useMemo(
    () => mySkills.reduce((total, skill) => total + skill.files.length, 0),
    [mySkills]
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm md:w-[340px]">
          <TabsTrigger value="marketplace" className="h-auto py-3">
            <LayoutGrid className="h-4 w-4" />
            Skills广场
          </TabsTrigger>
          <TabsTrigger value="mine" className="h-auto py-3">
            <PanelLeft className="h-4 w-4" />
            我的Skills
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="gap-4 md:flex md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <CardTitle>Skills广场</CardTitle>
                <CardDescription>
                  浏览模板、下载到本地、直接绑定到我的 CEC-Claw，或复制模板到我的Skills继续定制。
                </CardDescription>
              </div>
              <div className="relative w-full md:w-[320px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={marketSearch}
                  onChange={(event) => setMarketSearch(event.target.value)}
                  placeholder="搜索 Skill 名称、类目或标签"
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2 border-b border-slate-200 pb-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
                    {SOURCE_FILTERS.map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setMarketSourceFilter(filter.value)}
                        className={cn(
                          "rounded-full px-4 py-2 transition-colors",
                          getMarketplaceSourceFilterClass(
                            filter.value,
                            marketSourceFilter === filter.value
                          )
                        )}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
                    {USER_CATEGORY_FILTERS.map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setAudienceCategoryFilter(filter.value)}
                        className={cn(
                          "rounded-full px-4 py-2 transition-colors",
                          audienceCategoryFilter === filter.value
                            ? "bg-sky-100 text-sky-700"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredMarketplaceSkills.length > 0 ? (
                  <div className="grid gap-4 xl:grid-cols-3">
                    {filteredMarketplaceSkills.map((skill) => (
                      <div
                        key={skill.id}
                        className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sky-700">
                            <Package className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-lg font-semibold text-slate-950">
                                {skill.name}
                              </h3>
                              <Badge
                                variant="outline"
                                className={getMarketplaceSourceBadgeClass(skill.sourceType)}
                              >
                                {getMarketplaceSourceLabel(skill.sourceType)}
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                              <span>{skill.author}</span>
                              <span>·</span>
                              <span>{skill.category}</span>
                              <span>·</span>
                              <span>{skill.downloads.toLocaleString()} 下载</span>
                            </div>
                          </div>
                        </div>

                        <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">
                          {skill.description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {skill.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="border-sky-200 bg-sky-50 text-sky-700"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {skill.boundToCEC ? (
                            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                              <BadgeCheck className="h-3.5 w-3.5" />
                              已绑定 CEC-Claw
                            </Badge>
                          ) : null}
                        </div>

                        <div className="mt-5 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-10 w-10 rounded-xl border-slate-200",
                              skill.isFavorite
                                ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                : "text-slate-600 hover:text-slate-900"
                            )}
                            onClick={() => handleToggleFavorite(skill.id)}
                            aria-label={skill.isFavorite ? "取消收藏" : "收藏"}
                            title={skill.isFavorite ? "取消收藏" : "收藏"}
                          >
                            <Heart
                              className={cn("h-4 w-4", skill.isFavorite ? "fill-current" : "")}
                            />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900"
                            onClick={() => handleDownloadTemplate(skill)}
                            aria-label="下载"
                            title="下载"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900"
                            onClick={() => handleBindToCEC(skill.id)}
                            aria-label="绑定到我的CEC-Claw"
                            title="绑定到我的CEC-Claw"
                          >
                            <Bot className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900"
                            onClick={() => handleCopyTemplate(skill)}
                            aria-label="复制模板到我的Skills"
                            title="复制模板到我的Skills"
                          >
                            <BookCopy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                    当前筛选条件下没有匹配的 Skill 模板，试试切换来源或用户分类。
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mine" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-2">
                  <CardTitle>我的Skills</CardTitle>
                  <CardDescription>
                    支持新建空白 Skill、导入本地草稿、编辑文件内容、保存修改，并发布到 Skills 广场。
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={selectedSkillId}
                    onValueChange={selectSkill}
                    options={[
                      { value: ALL_SKILLS_VALUE, label: "全部" },
                      ...mySkills.map((skill) => ({
                        value: skill.id,
                        label: `${skill.name}${skill.dirty ? " · 未保存" : ""}`,
                      })),
                    ]}
                    className="w-[240px]"
                  />
                  <Button variant="outline" onClick={handleCreateBlankSkill}>
                    <Plus className="h-4 w-4" />
                    新建空白Skill
                  </Button>
                  <Button variant="outline" onClick={() => importInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    导入Skills
                  </Button>
                  <Button variant="outline" onClick={handleSave} disabled={!activeSkill}>
                    <Save className="h-4 w-4" />
                    保存
                  </Button>
                  <Button
                    className="bg-slate-900 text-white hover:bg-slate-800"
                    onClick={handlePublish}
                    disabled={!activeSkill}
                  >
                    <Rocket className="h-4 w-4" />
                    发布到Skills广场
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <input
                ref={importInputRef}
                type="file"
                accept=".json,.md,.txt,.ts,.tsx,.js,.jsx,.css,.yml,.yaml"
                multiple
                className="hidden"
                onChange={handleImportSkills}
              />

              {activeSkill ? (
                <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <aside className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-950">文件列表</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {isAllSkillsSelected
                            ? `${mySkills.length} 个 Skills · ${totalMySkillFileCount} 个文件`
                            : `${activeSkill.files.length} 个文件 · 最近保存于 ${activeSkill.updatedAt}`}
                        </div>
                      </div>
                      <Button variant="outline" size="icon" onClick={handleAddFile}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="relative mt-4">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={fileSearch}
                        onChange={(event) => setFileSearch(event.target.value)}
                        placeholder="Search files..."
                        className="border-slate-200 bg-white pl-9"
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-2">
                      {isAllSkillsSelected ? (
                        <div className="rounded-lg px-2 py-2 text-sm font-medium text-slate-900">
                          全部 Skills
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-900">
                          <FolderOpen className="h-4 w-4 text-sky-600" />
                          <span className="truncate">{activeSkill.name}</span>
                        </div>
                      )}

                      <div className="mt-1 space-y-0.5">
                        {fileTree.length > 0 ? (
                          renderTree(fileTree)
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-slate-500">
                            没有匹配的文件
                          </div>
                        )}
                      </div>
                    </div>
                  </aside>

                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                        <div className="space-y-2">
                          <Label>Skill 名称</Label>
                          <Input
                            value={activeSkill.name}
                            onChange={(event) => updateActiveSkillField("name", event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>类目</Label>
                          <Select
                            value={activeSkill.category}
                            onValueChange={(value) => updateActiveSkillField("category", value)}
                            options={CATEGORY_OPTIONS}
                          />
                        </div>
                        <div className="space-y-2 lg:col-span-2">
                          <Label>Skill 描述</Label>
                          <Textarea
                            value={activeSkill.description}
                            onChange={(event) =>
                              updateActiveSkillField("description", event.target.value)
                            }
                            className="min-h-24"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                          来源：
                          {activeSkill.source === "template"
                            ? "模板"
                            : activeSkill.source === "imported"
                              ? "导入"
                              : "空白"}
                        </Badge>
                        <Badge
                          className={
                            activeSkill.status === "published"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }
                        >
                          {activeSkill.status === "published" ? "已发布" : "草稿"}
                        </Badge>
                        {activeSkill.linkedCECClaws.map((cec) => (
                          <Badge
                            key={cec}
                            variant="outline"
                            className="border-sky-200 bg-sky-50 text-sky-700"
                          >
                            已绑定：{cec}
                          </Badge>
                        ))}
                        {activeSkill.dirty ? (
                          <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                            未保存修改
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 px-3 py-2">
                        {activeSkill.openFileIds.map((fileId) => {
                          const file = activeSkill.files.find((item) => item.id === fileId);
                          if (!file) {
                            return null;
                          }

                          const isActive = file.id === activeSkill.activeFileId;
                          const FileIcon = fileIcon(file.path);

                          return (
                            <div
                              key={file.id}
                              className={cn(
                                "flex items-center gap-2 rounded-t-xl border px-3 py-2 text-sm transition-colors",
                                isActive
                                  ? "border-slate-200 bg-white text-slate-950"
                                  : "border-transparent bg-transparent text-slate-500 hover:text-slate-800"
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => selectFile(file.id, activeSkill.id)}
                                className="flex items-center gap-2"
                              >
                                <FileIcon className="h-4 w-4" />
                                <span>
                                  {isAllSkillsSelected
                                    ? `${activeSkill.name}/${file.path.split("/").slice(-1)[0]}`
                                    : file.path.split("/").slice(-1)[0]}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => closeFile(file.id, activeSkill.id)}
                                className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {activeFile ? (
                        <>
                          <div className="border-b border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                            当前文件：
                            <span className="font-medium text-slate-900">
                              {isAllSkillsSelected ? `${activeSkill.name}/${activeFile.path}` : activeFile.path}
                            </span>
                          </div>
                          <Textarea
                            value={activeFile.content}
                            onChange={(event) => updateActiveFileContent(event.target.value)}
                            spellCheck={false}
                            className="min-h-[560px] rounded-none border-0 px-4 py-4 font-mono text-[13px] leading-6 shadow-none focus-visible:ring-0"
                          />
                          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
                            <span>
                              {isAllSkillsSelected ? `${activeSkill.name}/${activeFile.path}` : activeFile.path}
                            </span>
                            <span>
                              {activeFileLineCount} 行 / {activeFileCharCount} 字符
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex min-h-[420px] items-center justify-center px-6 text-sm text-slate-500">
                          从左侧文件列表选择一个文件开始编辑。
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                  还没有创建任何 Skill，先新建一个空白 Skill 或导入本地草稿吧。
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
