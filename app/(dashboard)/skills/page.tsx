"use client";

import { ChangeEvent, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  BadgeCheck,
  BellRing,
  Bot,
  Building2,
  ChartColumn,
  ChartColumnIncreasing,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  FileCode2,
  FilePenLine,
  FilePlus2,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  LayoutGrid,
  Mail,
  Mic,
  MessagesSquare,
  PanelLeft,
  Paperclip,
  Plus,
  Rocket,
  Save,
  Search,
  ShieldCheck,
  ScrollText,
  Sparkles,
  Star,
  TicketsPlane,
  Trash2,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type SkillSource = "template" | "blank" | "imported";
type SkillStatus = "draft" | "reviewing" | "published";
type MarketplaceSourceType = "platform" | "org";
type MarketplaceSourceFilter = "all" | MarketplaceSourceType | "favorite";
type SkillsExperienceMode = "mvp" | "v2";
type SkillsTab = "marketplace" | "mine" | "foundry";
type MarketplaceSortMode = "downloads" | "references" | "updatedAt";
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
  publishedAt: string;
  publishedBy: string;
  description: string;
  category: string;
  sourceType: MarketplaceSourceType;
  audienceCategory: AudienceCategory;
  isFavorite: boolean;
  tags: string[];
  downloads: number;
  references?: number;
  referencedAgents?: string[];
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
  updatedBy: string;
  version?: string;
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

interface FoundryDirectory {
  id: string;
  name: string;
  templateId?: string;
  source: "preset" | "marketplace";
  files: SkillFile[];
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
const CURRENT_SKILL_EDITOR = "楠不难";
const AGENT_REFERENCE_POOL = [
  "经营分析Agent",
  "项目周报Agent",
  "督办协同Agent",
  "采购审批Agent",
  "合同审阅Agent",
  "差旅报销Agent",
  "运行日报Agent",
  "设备巡检Agent",
  "会议纪要Agent",
  "舆情跟踪Agent",
  "通知分发Agent",
  "制度问答Agent",
  "投标检查Agent",
  "公文流转Agent",
  "经营复盘Agent",
  "预算执行Agent",
  "客服工单Agent",
  "项目协调Agent",
  "蓝信通知Agent",
  "值班信息Agent",
];

const INITIAL_FOUNDRY_DIRECTORIES: FoundryDirectory[] = [
  createFoundryDirectory({
    id: "skill-creator",
    name: "skill-creator",
    source: "preset",
    files: [
      {
        path: "SKILL.md",
        content: `---
name: skill-creator
description: "Create new skills, modify and improve existing skills."
---

# Skill Creator

Use this workspace to create or optimize a skill.
`,
      },
      { path: "agents/README.md", content: "# agents\n\nStore agent prompts and usage notes here.\n" },
      { path: "assets/README.md", content: "# assets\n\nStore examples, screenshots and snippets here.\n" },
      { path: "eval-viewer/README.md", content: "# eval-viewer\n\nStore evaluation views and review notes here.\n" },
      { path: "references/README.md", content: "# references\n\nStore reference materials here.\n" },
      { path: "scripts/bootstrap.ts", content: "export function bootstrapSkill() {\n  return 'skill-creator';\n}\n" },
    ],
  }),
  createFoundryDirectory({
    id: "xlsx",
    name: "xlsx",
    source: "preset",
    files: [
      {
        path: "SKILL.md",
        content: `---
name: xlsx
description: "Process spreadsheet-heavy tasks."
---

# xlsx

Use this skill when the task is centered on spreadsheet output.
`,
      },
      { path: "scripts/normalize-sheet.ts", content: "export function normalizeSheet() {\n  return 'normalized';\n}\n" },
    ],
  }),
  createFoundryDirectory({
    id: "theme-factory",
    name: "theme-factory",
    source: "preset",
    files: [
      {
        path: "SKILL.md",
        content: `---
name: theme-factory
description: "Apply a consistent theme across outputs."
---

# theme-factory

Use this skill to apply reusable presentation themes.
`,
      },
      { path: "assets/palette.md", content: "# palette\n\n- Primary\n- Secondary\n- Accent\n" },
      { path: "scripts/apply-theme.ts", content: "export function applyTheme() {\n  return 'theme-applied';\n}\n" },
    ],
  }),
];

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
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
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
  updatedBy?: string;
  version?: string;
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
    updatedBy: input.updatedBy ?? CURRENT_SKILL_EDITOR,
    version: input.version,
    publishedTemplateId: input.publishedTemplateId,
  } satisfies MySkill;
}

function createFoundryDirectory(input: {
  id: string;
  name: string;
  source: "preset" | "marketplace";
  templateId?: string;
  files: Array<{ path: string; content: string }>;
}) {
  return {
    id: input.id,
    name: input.name,
    source: input.source,
    templateId: input.templateId,
    files: input.files.map((file) => createFile(file.path, file.content, `foundry-${input.id}`)),
  } satisfies FoundryDirectory;
}

function buildReferencedAgents(seedIndex: number, count: number) {
  return Array.from({ length: count }, (_, offset) => {
    const poolIndex = (seedIndex + offset) % AGENT_REFERENCE_POOL.length;
    return AGENT_REFERENCE_POOL[poolIndex];
  });
}

const marketplaceSeeds: SkillTemplate[] = [
  {
    id: "af-rag",
    name: "制度流程查询",
    author: "平台办公中心",
    publishedAt: "03-26 16:28",
    publishedBy: "楠不难",
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
    publishedAt: "03-25 14:18",
    publishedBy: "周可",
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
    author: "综合办公室-李晓晓",
    publishedAt: "03-24 11:06",
    publishedBy: "李晓晓",
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
    author: "共享服务中心-赵明",
    publishedAt: "03-23 09:55",
    publishedBy: "赵明",
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
    publishedAt: "03-22 18:16",
    publishedBy: "许航",
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
    publishedAt: "03-19 14:26",
    publishedBy: "宋远",
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
    publishedAt: "03-18 13:52",
    publishedBy: "韩松",
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

const initialMarketplace: SkillTemplate[] = marketplaceSeeds.map((template, index) => {
  const references = Math.max(3, Math.min(16, Math.round(template.downloads / 420)));

  return {
    ...template,
    references,
    referencedAgents: buildReferencedAgents(index, references),
    files: cloneFiles(template.files, `seed-${template.id}`),
  };
});

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
    version: "1.0",
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
    version: "1.0",
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

type AudienceVisualMeta = {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
  filterClass: string;
};

const AUDIENCE_VISUAL_META: Record<AudienceCategory, AudienceVisualMeta> = {
  ai: {
    label: "通用",
    icon: Bot,
    badgeClass: "border-cyan-200/80 bg-cyan-50/90 text-cyan-700",
    filterClass:
      "border-cyan-200/80 bg-cyan-50/90 text-cyan-700 shadow-[0_10px_24px_-18px_rgba(14,165,233,0.75)]",
  },
  dev: {
    label: "开发工具",
    icon: Wrench,
    badgeClass: "border-indigo-200/80 bg-indigo-50/90 text-indigo-700",
    filterClass:
      "border-indigo-200/80 bg-indigo-50/90 text-indigo-700 shadow-[0_10px_24px_-18px_rgba(99,102,241,0.75)]",
  },
  data: {
    label: "数据分析",
    icon: ChartColumn,
    badgeClass: "border-amber-200/80 bg-amber-50/95 text-amber-700",
    filterClass:
      "border-amber-200/80 bg-amber-50/90 text-amber-700 shadow-[0_10px_24px_-18px_rgba(245,158,11,0.75)]",
  },
  communication: {
    label: "通讯协作",
    icon: MessagesSquare,
    badgeClass: "border-emerald-200/80 bg-emerald-50/90 text-emerald-700",
    filterClass:
      "border-emerald-200/80 bg-emerald-50/90 text-emerald-700 shadow-[0_10px_24px_-18px_rgba(16,185,129,0.75)]",
  },
  content: {
    label: "企业服务",
    icon: Building2,
    badgeClass: "border-slate-300/80 bg-slate-100/90 text-slate-700",
    filterClass:
      "border-slate-300/80 bg-slate-100/90 text-slate-700 shadow-[0_10px_24px_-18px_rgba(100,116,139,0.6)]",
  },
  efficiency: {
    label: "效率工具",
    icon: Sparkles,
    badgeClass: "border-orange-200/80 bg-orange-50/95 text-orange-700",
    filterClass:
      "border-orange-200/80 bg-orange-50/90 text-orange-700 shadow-[0_10px_24px_-18px_rgba(249,115,22,0.75)]",
  },
  security: {
    label: "安全合规",
    icon: ShieldCheck,
    badgeClass: "border-teal-200/80 bg-teal-50/90 text-teal-700",
    filterClass:
      "border-teal-200/80 bg-teal-50/90 text-teal-700 shadow-[0_10px_24px_-18px_rgba(20,184,166,0.75)]",
  },
};

type MarketplaceCardPalette = {
  panelClass: string;
  iconClass: string;
  glowClass: string;
  tagClass: string;
};

const MARKETPLACE_CARD_PALETTES: MarketplaceCardPalette[] = [
  {
    panelClass:
      "border-sky-100/80 bg-[linear-gradient(160deg,rgba(240,249,255,0.96),rgba(255,255,255,0.98)_58%,rgba(236,254,255,0.92))]",
    iconClass:
      "border-sky-100/80 bg-[linear-gradient(145deg,rgba(236,254,255,0.96),rgba(224,242,254,0.9))] text-sky-700 shadow-[0_14px_30px_-20px_rgba(14,165,233,0.55)]",
    glowClass: "bg-sky-300/40",
    tagClass: "border-sky-100/80 bg-sky-50/85 text-sky-700",
  },
  {
    panelClass:
      "border-amber-100/80 bg-[linear-gradient(160deg,rgba(255,251,235,0.96),rgba(255,255,255,0.98)_58%,rgba(255,247,237,0.92))]",
    iconClass:
      "border-amber-100/80 bg-[linear-gradient(145deg,rgba(255,251,235,0.98),rgba(254,243,199,0.9))] text-amber-700 shadow-[0_14px_30px_-20px_rgba(245,158,11,0.5)]",
    glowClass: "bg-amber-300/40",
    tagClass: "border-amber-100/80 bg-amber-50/90 text-amber-700",
  },
  {
    panelClass:
      "border-emerald-100/80 bg-[linear-gradient(160deg,rgba(236,253,245,0.96),rgba(255,255,255,0.98)_58%,rgba(236,254,255,0.9))]",
    iconClass:
      "border-emerald-100/80 bg-[linear-gradient(145deg,rgba(236,253,245,0.98),rgba(209,250,229,0.9))] text-emerald-700 shadow-[0_14px_30px_-20px_rgba(16,185,129,0.48)]",
    glowClass: "bg-emerald-300/38",
    tagClass: "border-emerald-100/80 bg-emerald-50/85 text-emerald-700",
  },
  {
    panelClass:
      "border-rose-100/80 bg-[linear-gradient(160deg,rgba(255,241,242,0.95),rgba(255,255,255,0.98)_58%,rgba(255,247,237,0.9))]",
    iconClass:
      "border-rose-100/80 bg-[linear-gradient(145deg,rgba(255,241,242,0.98),rgba(255,228,230,0.92))] text-rose-700 shadow-[0_14px_30px_-20px_rgba(244,63,94,0.42)]",
    glowClass: "bg-rose-300/34",
    tagClass: "border-rose-100/80 bg-rose-50/85 text-rose-700",
  },
  {
    panelClass:
      "border-slate-200/80 bg-[linear-gradient(160deg,rgba(248,250,252,0.96),rgba(255,255,255,0.98)_58%,rgba(241,245,249,0.92))]",
    iconClass:
      "border-slate-200/80 bg-[linear-gradient(145deg,rgba(248,250,252,0.98),rgba(226,232,240,0.9))] text-slate-700 shadow-[0_14px_30px_-20px_rgba(100,116,139,0.4)]",
    glowClass: "bg-slate-300/34",
    tagClass: "border-slate-200/80 bg-slate-50/90 text-slate-700",
  },
  {
    panelClass:
      "border-teal-100/80 bg-[linear-gradient(160deg,rgba(240,253,250,0.96),rgba(255,255,255,0.98)_58%,rgba(236,254,255,0.9))]",
    iconClass:
      "border-teal-100/80 bg-[linear-gradient(145deg,rgba(240,253,250,0.98),rgba(204,251,241,0.9))] text-teal-700 shadow-[0_14px_30px_-20px_rgba(20,184,166,0.48)]",
    glowClass: "bg-teal-300/36",
    tagClass: "border-teal-100/80 bg-teal-50/85 text-teal-700",
  },
  {
    panelClass:
      "border-indigo-100/80 bg-[linear-gradient(160deg,rgba(238,242,255,0.96),rgba(255,255,255,0.98)_58%,rgba(240,249,255,0.92))]",
    iconClass:
      "border-indigo-100/80 bg-[linear-gradient(145deg,rgba(238,242,255,0.98),rgba(224,231,255,0.9))] text-indigo-700 shadow-[0_14px_30px_-20px_rgba(99,102,241,0.45)]",
    glowClass: "bg-indigo-300/34",
    tagClass: "border-indigo-100/80 bg-indigo-50/85 text-indigo-700",
  },
];

function getMarketplaceSourceText(skill: SkillTemplate) {
  return skill.sourceType === "platform" ? "AgentFoundry 精选" : skill.author;
}

function formatSkillVersion(version?: string) {
  return `v${version ?? "1.0"}`;
}

function isValidVersion(version: string) {
  return /^\d+(?:\.\d+){1,2}$/.test(version.trim());
}

function compareVersions(left: string, right: string) {
  const leftParts = left.split(".").map((segment) => Number(segment));
  const rightParts = right.split(".").map((segment) => Number(segment));
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;

    if (leftValue !== rightValue) {
      return leftValue - rightValue;
    }
  }

  return 0;
}

function suggestNextVersion(version?: string) {
  const currentVersion = version?.trim() || "1.0";
  if (!isValidVersion(currentVersion)) {
    return "1.1";
  }

  const segments = currentVersion.split(".").map((segment) => Number(segment));
  const lastIndex = segments.length - 1;
  segments[lastIndex] += 1;

  return segments.join(".");
}

function getSkillStatusMeta(status: SkillStatus) {
  switch (status) {
    case "published":
      return {
        label: "已发布",
        icon: BadgeCheck,
        className: "text-emerald-700",
      };
    case "reviewing":
      return {
        label: "审核中",
        icon: Clock3,
        className: "text-sky-700",
      };
    default:
      return {
        label: "未发布",
        icon: FilePenLine,
        className: "text-amber-700",
      };
  }
}

function getMarketplaceSourceFilterClass(filterValue: MarketplaceSourceFilter, active: boolean) {
  if (!active) {
    return "border-transparent bg-transparent text-slate-500 hover:border-slate-200/80 hover:bg-white hover:text-slate-900";
  }

  switch (filterValue) {
    case "platform":
      return "border-sky-200/80 bg-sky-50/90 text-sky-700 shadow-[0_10px_24px_-18px_rgba(14,165,233,0.75)]";
    case "org":
      return "border-emerald-200/80 bg-emerald-50/90 text-emerald-700 shadow-[0_10px_24px_-18px_rgba(16,185,129,0.75)]";
    case "favorite":
      return "border-rose-200/80 bg-rose-50/90 text-rose-700 shadow-[0_10px_24px_-18px_rgba(244,63,94,0.75)]";
    default:
      return "border-slate-200/80 bg-slate-100/90 text-slate-700 shadow-[0_10px_24px_-18px_rgba(148,163,184,0.8)]";
  }
}

function getAudienceFilterClass(filterValue: AudienceCategoryFilter, active: boolean) {
  if (!active) {
    return "border-transparent bg-transparent text-slate-500 hover:border-slate-200/80 hover:bg-white hover:text-slate-900";
  }

  if (filterValue === "all") {
    return "border-slate-200/80 bg-slate-100/90 text-slate-700 shadow-[0_10px_24px_-18px_rgba(148,163,184,0.8)]";
  }

  return AUDIENCE_VISUAL_META[filterValue].filterClass;
}

function getMarketplaceSkillIcon(skill: Pick<SkillTemplate, "name" | "audienceCategory">): LucideIcon {
  if (skill.name.includes("公文")) {
    return FilePenLine;
  }

  if (skill.name.includes("制度") || skill.name.includes("流程")) {
    return ScrollText;
  }

  if (skill.name.includes("问数")) {
    return ChartColumnIncreasing;
  }

  if (skill.name.includes("邮件")) {
    return Mail;
  }

  if (skill.name.includes("通知")) {
    return BellRing;
  }

  if (skill.name.includes("差旅") || skill.name.includes("报销")) {
    return TicketsPlane;
  }

  return AUDIENCE_VISUAL_META[skill.audienceCategory].icon;
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
  const [activeTab, setActiveTab] = useState<SkillsTab>("marketplace");
  const [experienceMode, setExperienceMode] = useState<SkillsExperienceMode>("mvp");
  const [marketplaceSkills, setMarketplaceSkills] = useState<SkillTemplate[]>(initialMarketplace);
  const [mySkills, setMySkills] = useState<MySkill[]>(initialMySkills);
  const [selectedSkillId, setSelectedSkillId] = useState(initialMySkills[0]?.id ?? "");
  const [focusedSkillId, setFocusedSkillId] = useState(initialMySkills[0]?.id ?? "");
  const [marketSearch, setMarketSearch] = useState("");
  const [mySkillSearch, setMySkillSearch] = useState("");
  const [marketSourceFilter, setMarketSourceFilter] = useState<MarketplaceSourceFilter>("all");
  const [marketSortMode, setMarketSortMode] = useState<MarketplaceSortMode>("downloads");
  const [audienceCategoryFilter, setAudienceCategoryFilter] =
    useState<AudienceCategoryFilter>("all");
  const [fileSearch, setFileSearch] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateTargetSkillId, setUpdateTargetSkillId] = useState("");
  const [updateVersionInput, setUpdateVersionInput] = useState("");
  const [updateZipFile, setUpdateZipFile] = useState<File | null>(null);
  const [foundryDirectories, setFoundryDirectories] = useState<FoundryDirectory[]>(
    INITIAL_FOUNDRY_DIRECTORIES
  );
  const [foundrySearch, setFoundrySearch] = useState("");
  const [selectedFoundryDirectoryId, setSelectedFoundryDirectoryId] = useState(
    INITIAL_FOUNDRY_DIRECTORIES[0]?.id ?? ""
  );
  const [foundryPrompt, setFoundryPrompt] = useState("");
  const [foundryAttachmentNames, setFoundryAttachmentNames] = useState<string[]>([]);
  const [foundryActiveFileId, setFoundryActiveFileId] = useState("");
  const [foundryExpandedFolders, setFoundryExpandedFolders] = useState<Record<string, boolean>>({});
  const [isFoundryTreeVisible, setIsFoundryTreeVisible] = useState(true);
  const [isFoundryEditorVisible, setIsFoundryEditorVisible] = useState(false);
  const [foundryCreateMenuOpen, setFoundryCreateMenuOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const foundryAttachmentInputRef = useRef<HTMLInputElement>(null);
  const foundryUploadFilesInputRef = useRef<HTMLInputElement>(null);
  const foundryUploadFolderInputRef = useRef<HTMLInputElement>(null);
  const useUnifiedSkillsManagementView = true;

  const deferredMarketSearch = useDeferredValue(marketSearch);
  const deferredMySkillSearch = useDeferredValue(mySkillSearch);
  const deferredFileSearch = useDeferredValue(fileSearch);
  const deferredFoundrySearch = useDeferredValue(foundrySearch);
  const isAllSkillsSelected = selectedSkillId === ALL_SKILLS_VALUE;
  const isMvpMode = experienceMode === "mvp";

  useEffect(() => {
    if (isMvpMode && marketSortMode === "references") {
      setMarketSortMode("downloads");
    }
  }, [isMvpMode, marketSortMode]);

  useEffect(() => {
    if (isMvpMode && activeTab === "foundry") {
      setActiveTab("marketplace");
    }
  }, [activeTab, isMvpMode]);

  useEffect(() => {
    const folderInput = foundryUploadFolderInputRef.current;
    if (!folderInput) {
      return;
    }

    folderInput.setAttribute("webkitdirectory", "");
    folderInput.setAttribute("directory", "");
  }, []);

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
        if (marketSortMode === "updatedAt") {
          const updatedDelta = right.publishedAt.localeCompare(left.publishedAt, "zh-CN");
          if (updatedDelta !== 0) {
            return updatedDelta;
          }
        } else if (marketSortMode === "references") {
          const referenceDelta = (right.references ?? 0) - (left.references ?? 0);
          if (referenceDelta !== 0) {
            return referenceDelta;
          }
        } else {
          const downloadDelta = right.downloads - left.downloads;
          if (downloadDelta !== 0) {
            return downloadDelta;
          }
        }

        const chineseDelta = Number(hasChineseText(right.name)) - Number(hasChineseText(left.name));
        if (chineseDelta !== 0) {
          return chineseDelta;
        }

        return left.name.localeCompare(right.name, "zh-CN");
      });
  }, [audienceCategoryFilter, deferredMarketSearch, marketSortMode, marketplaceSkills, marketSourceFilter]);
  const filteredMySkills = useMemo(() => {
    const query = deferredMySkillSearch.trim().toLowerCase();

    if (!query) {
      return mySkills;
    }

    return mySkills.filter((skill) =>
      [
        skill.name,
        skill.description,
        skill.category,
        skill.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [deferredMySkillSearch, mySkills]);

  const selectedFoundryDirectory = useMemo(
    () =>
      foundryDirectories.find((directory) => directory.id === selectedFoundryDirectoryId) ??
      foundryDirectories[0] ??
      null,
    [foundryDirectories, selectedFoundryDirectoryId]
  );

  useEffect(() => {
    if (!selectedFoundryDirectory && foundryDirectories.length > 0) {
      setSelectedFoundryDirectoryId(foundryDirectories[0].id);
    }
  }, [foundryDirectories, selectedFoundryDirectory]);

  useEffect(() => {
    if (!selectedFoundryDirectory) {
      return;
    }

    const fileStillExists = selectedFoundryDirectory.files.some(
      (file) => file.id === foundryActiveFileId
    );

    if (!fileStillExists && isFoundryEditorVisible) {
      setFoundryActiveFileId(selectedFoundryDirectory.files[0]?.id ?? "");
    }
  }, [foundryActiveFileId, isFoundryEditorVisible, selectedFoundryDirectory]);

  const selectedFoundryFile = useMemo(
    () =>
      selectedFoundryDirectory?.files.find((file) => file.id === foundryActiveFileId) ?? null,
    [foundryActiveFileId, selectedFoundryDirectory]
  );

  const foundryVisibleFiles = useMemo<TreeFileEntry[]>(() => {
    const query = deferredFoundrySearch.trim().toLowerCase();
    const files = foundryDirectories.flatMap((directory) =>
      directory.files.map((file) => ({
        fileId: file.id,
        skillId: directory.id,
        path: `${directory.name}/${file.path}`,
      }))
    );

    if (!query) {
      return files;
    }

    return files.filter((file) => file.path.toLowerCase().includes(query));
  }, [deferredFoundrySearch, foundryDirectories]);

  const foundryFileTree = useMemo(() => buildFileTree(foundryVisibleFiles), [foundryVisibleFiles]);

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
      updatedBy: CURRENT_SKILL_EDITOR,
    }));

    toast.success(`已保存 Skill：${activeSkill.name}`);
  };

  const publishSkillById = (skillId: string) => {
    const skillToPublish = mySkills.find((skill) => skill.id === skillId);
    if (!skillToPublish) {
      return;
    }

    const nextVersion =
      skillToPublish.status === "published"
        ? suggestNextVersion(skillToPublish.version)
        : "1.0";
    const publishedId =
      skillToPublish.publishedTemplateId ?? `${slugify(skillToPublish.name)}-published`;
    const publishedTemplate: SkillTemplate = {
      id: publishedId,
      name: skillToPublish.name,
      author: "我的Skills",
      publishedAt: formatNow(),
      publishedBy: CURRENT_SKILL_EDITOR,
      description: skillToPublish.description,
      category: skillToPublish.category,
      sourceType:
        marketplaceSkills.find((item) => item.id === publishedId)?.sourceType ?? "org",
      audienceCategory: mapEditorCategoryToAudienceCategory(skillToPublish.category),
      isFavorite:
        marketplaceSkills.find((item) => item.id === publishedId)?.isFavorite ?? false,
      tags: skillToPublish.tags,
      downloads:
        marketplaceSkills.find((item) => item.id === publishedId)?.downloads ?? 0,
      references:
        marketplaceSkills.find((item) => item.id === publishedId)?.references ?? 0,
      referencedAgents:
        marketplaceSkills.find((item) => item.id === publishedId)?.referencedAgents ?? [],
      boundToCEC:
        !isMvpMode &&
        (skillToPublish.linkedCECClaws.length > 0 ||
          marketplaceSkills.find((item) => item.id === publishedId)?.boundToCEC === true),
      files: cloneFiles(skillToPublish.files, `published-${publishedId}`),
    };

    setMarketplaceSkills((current) => {
      const exists = current.some((item) => item.id === publishedId);
      if (exists) {
        return current.map((item) => (item.id === publishedId ? publishedTemplate : item));
      }

      return [publishedTemplate, ...current];
    });

    updateSkill(skillToPublish.id, (skill) => ({
      ...skill,
      dirty: false,
      status: "published",
      updatedAt: formatNow(),
      updatedBy: CURRENT_SKILL_EDITOR,
      version: nextVersion,
      publishedTemplateId: publishedId,
    }));

    toast.success(
      skillToPublish.status === "published"
        ? `已更新发布：${skillToPublish.name}`
        : `已发布到 Skills 广场：${skillToPublish.name}`
    );
  };

  const handlePublish = () => {
    if (!activeSkill) {
      return;
    }

    publishSkillById(activeSkill.id);
  };

  const handleRequestReview = (skillId: string) => {
    const skill = mySkills.find((item) => item.id === skillId);
    if (!skill) {
      return;
    }

    const nextVersion = "1.0";

    setMySkills((current) => {
      const target = current.find((item) => item.id === skillId);
      if (!target) {
        return current;
      }

      const reviewingSkill = {
        ...target,
        status: "reviewing" as const,
        version: nextVersion,
        updatedAt: formatNow(),
        updatedBy: CURRENT_SKILL_EDITOR,
        dirty: false,
      };

      return [reviewingSkill, ...current.filter((item) => item.id !== skillId)];
    });

    toast.success(`已提交审核：${skill.name} ${formatSkillVersion(nextVersion)}`);
  };

  const openUpdateDialog = (skillId: string) => {
    const skill = mySkills.find((item) => item.id === skillId);
    if (!skill) {
      return;
    }

    setUpdateTargetSkillId(skillId);
    setUpdateVersionInput(suggestNextVersion(skill.version));
    setUpdateZipFile(null);
    setUpdateDialogOpen(true);
  };

  const handleSubmitUpdate = () => {
    const skill = mySkills.find((item) => item.id === updateTargetSkillId);
    if (!skill) {
      toast.error("未找到需要更新的 Skill");
      return;
    }

    const nextVersion = updateVersionInput.trim();
    const currentVersion = skill.version ?? "1.0";

    if (!updateZipFile) {
      toast.error("请先上传新的 zip 包");
      return;
    }

    if (!updateZipFile.name.toLowerCase().endsWith(".zip")) {
      toast.error("仅支持上传 zip 包");
      return;
    }

    if (!isValidVersion(nextVersion)) {
      toast.error("版本号格式不正确，请使用 1.1 或 1.1.2");
      return;
    }

    if (compareVersions(nextVersion, currentVersion) <= 0) {
      toast.error(`新版本号必须高于当前版本 ${formatSkillVersion(currentVersion)}`);
      return;
    }

    setMySkills((current) => {
      const target = current.find((item) => item.id === skill.id);
      if (!target) {
        return current;
      }

      const reviewingSkill = {
        ...target,
        status: "reviewing" as const,
        version: nextVersion,
        updatedAt: formatNow(),
        updatedBy: CURRENT_SKILL_EDITOR,
        dirty: false,
      };

      return [reviewingSkill, ...current.filter((item) => item.id !== skill.id)];
    });

    setUpdateDialogOpen(false);
    setUpdateTargetSkillId("");
    setUpdateVersionInput("");
    setUpdateZipFile(null);

    toast.success(`已提交更新审核：${skill.name} ${formatSkillVersion(nextVersion)}`);
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

  const handleAddToSkillsFoundry = (template: SkillTemplate) => {
    const targetDirectoryId = `foundry-${template.id}`;
    const alreadyAdded = foundryDirectories.some((directory) => directory.id === targetDirectoryId);
    if (alreadyAdded) {
      setSelectedFoundryDirectoryId(targetDirectoryId);
      setActiveTab("foundry");
      toast.info(`已在 Skills Foundry 中：${template.name}`);
      return;
    }

    const foundryDirectory = createFoundryDirectory({
      id: targetDirectoryId,
      name: template.name,
      templateId: template.id,
      source: "marketplace",
      files: template.files.map((file) => ({
        path: file.path,
        content: file.content,
      })),
    });

    setFoundryDirectories((current) => [foundryDirectory, ...current]);
    setSelectedFoundryDirectoryId(targetDirectoryId);
    setFoundryActiveFileId(foundryDirectory.files[0]?.id ?? "");
    setIsFoundryEditorVisible(false);
    setActiveTab("foundry");
    toast.success(`已添加到 Skills Foundry：${template.name}`);
  };

  const handleCreateFoundryDirectory = () => {
    const nextId = `draft-space-${Date.now()}`;
    const nextName = `new-skill-space-${foundryDirectories.length + 1}`;
    const nextDirectory = createFoundryDirectory({
      id: nextId,
      name: nextName,
      source: "preset",
      files: [
        {
          path: "SKILL.md",
          content: `---\nname: ${nextName}\ndescription: ""\n---\n\n# ${nextName}\n`,
        },
      ],
    });

    setFoundryDirectories((current) => [nextDirectory, ...current]);
    setSelectedFoundryDirectoryId(nextId);
    setFoundryActiveFileId(nextDirectory.files[0]?.id ?? "");
    setIsFoundryEditorVisible(true);
    setFoundryPrompt("使用/create skills创建一个技能，要求如下：");
    toast.success(`已创建目录：${nextName}`);
  };

  const handleFoundryAttachments = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    setFoundryAttachmentNames(selectedFiles.map((file) => file.name));
    toast.success(`已添加 ${selectedFiles.length} 个附件`);
    event.target.value = "";
  };

  const handleApplyFoundryTemplate = (mode: "create" | "optimize") => {
    if (mode === "create") {
      setFoundryPrompt("使用/create skills创建一个技能，要求如下：");
      return;
    }

    const targetName = selectedFoundryDirectory?.name ?? "当前";
    setFoundryPrompt(`使用/create skills优化${targetName}技能，要求如下：`);
  };

  const handleFoundryVoiceInput = () => {
    toast.info("语音输入能力建设中，后续会接入实时语音转写。");
  };

  const handleSelectFoundryFile = (directoryId: string, fileId: string) => {
    setSelectedFoundryDirectoryId(directoryId);
    setFoundryActiveFileId(fileId);
    setIsFoundryEditorVisible(true);
  };

  const updateFoundryFileContent = (content: string) => {
    if (!selectedFoundryDirectory || !selectedFoundryFile) {
      return;
    }

    setFoundryDirectories((current) =>
      current.map((directory) =>
        directory.id !== selectedFoundryDirectory.id
          ? directory
          : {
              ...directory,
              files: directory.files.map((file) =>
                file.id === selectedFoundryFile.id ? { ...file, content } : file
              ),
            }
      )
    );
  };

  const toggleFoundryFolder = (path: string) => {
    setFoundryExpandedFolders((current) => ({
      ...current,
      [path]: !(current[path] ?? true),
    }));
  };

  const handleCreateFoundryFile = () => {
    if (!selectedFoundryDirectory) {
      toast.error("请先选择一个目录");
      return;
    }

    const nextPath = window.prompt("请输入新文件名", "new-file.md")?.trim();
    if (!nextPath) {
      return;
    }

    const nextFile = createFile(nextPath, `# ${nextPath}\n`, `foundry-${selectedFoundryDirectory.id}`);

    setFoundryDirectories((current) =>
      current.map((directory) =>
        directory.id !== selectedFoundryDirectory.id
          ? directory
          : {
              ...directory,
              files: [...directory.files, nextFile],
            }
      )
    );
    setFoundryActiveFileId(nextFile.id);
    setIsFoundryEditorVisible(true);
    toast.success(`已新建文件：${nextPath}`);
  };

  const handleCreateFoundryFolder = () => {
    if (!selectedFoundryDirectory) {
      toast.error("请先选择一个目录");
      return;
    }

    const folderName = window.prompt("请输入新文件夹名", "new-folder")?.trim();
    if (!folderName) {
      return;
    }

    const nextFile = createFile(
      `${folderName}/README.md`,
      `# ${folderName}\n\n在这里补充目录说明。\n`,
      `foundry-${selectedFoundryDirectory.id}`
    );

    setFoundryDirectories((current) =>
      current.map((directory) =>
        directory.id !== selectedFoundryDirectory.id
          ? directory
          : {
              ...directory,
              files: [...directory.files, nextFile],
            }
      )
    );
    setFoundryExpandedFolders((current) => ({
      ...current,
      [selectedFoundryDirectory.name]: true,
      [`${selectedFoundryDirectory.name}/${folderName}`]: true,
    }));
    setFoundryActiveFileId(nextFile.id);
    setIsFoundryEditorVisible(true);
    toast.success(`已新建文件夹：${folderName}`);
  };

  const handleUploadFoundryFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (!selectedFoundryDirectory || selectedFiles.length === 0) {
      event.target.value = "";
      return;
    }

    const nextFiles = await Promise.all(
      selectedFiles.map(async (file, index) =>
        createFile(
          file.name || `file-${index + 1}.md`,
          await file.text(),
          `foundry-${selectedFoundryDirectory.id}`
        )
      )
    );

    setFoundryDirectories((current) =>
      current.map((directory) =>
        directory.id !== selectedFoundryDirectory.id
          ? directory
          : {
              ...directory,
              files: [...directory.files, ...nextFiles],
            }
      )
    );

    toast.success(`已上传 ${nextFiles.length} 个文件`);
    event.target.value = "";
  };

  const handleUploadFoundryFolder = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (!selectedFoundryDirectory || selectedFiles.length === 0) {
      event.target.value = "";
      return;
    }

    const nextFiles = await Promise.all(
      selectedFiles.map(async (file, index) =>
        createFile(
          normalizeImportedPath(file.webkitRelativePath || file.name || `file-${index + 1}.md`),
          await file.text(),
          `foundry-${selectedFoundryDirectory.id}`
        )
      )
    );

    setFoundryDirectories((current) =>
      current.map((directory) =>
        directory.id !== selectedFoundryDirectory.id
          ? directory
          : {
              ...directory,
              files: [...directory.files, ...nextFiles],
            }
      )
    );

    toast.success(`已上传文件夹，共 ${nextFiles.length} 个文件`);
    event.target.value = "";
  };

  const handleSendFoundryPrompt = () => {
    if (!foundryPrompt.trim() && foundryAttachmentNames.length === 0) {
      toast.error("请先输入需求或上传附件");
      return;
    }

    toast.success("已提交到 Skills Foundry，会基于你的要求开始创建或优化 Skill。");
    setFoundryPrompt("");
    setFoundryAttachmentNames([]);
  };

  const handleExportMySkill = (skillId: string) => {
    const skill = mySkills.find((item) => item.id === skillId);
    if (!skill) {
      return;
    }

    downloadTextFile(`${skill.name}.skill.json`, serializeSkillBundle({
      name: skill.name,
      description: skill.description,
      category: skill.category,
      tags: skill.tags,
      files: skill.files,
    }));

    toast.success(`已导出 Skill：${skill.name}`);
  };

  const handleDeleteMySkill = (skillId: string) => {
    const skill = mySkills.find((item) => item.id === skillId);
    if (!skill) {
      return;
    }

    const confirmed = window.confirm(`确认删除 Skill「${skill.name}」吗？此操作不可撤销。`);
    if (!confirmed) {
      return;
    }

    setMySkills((current) => {
      const nextSkills = current.filter((item) => item.id !== skillId);
      const fallbackSkillId = nextSkills[0]?.id ?? "";

      setSelectedSkillId((currentSelected) => {
        if (currentSelected === ALL_SKILLS_VALUE) {
          return nextSkills.length > 0 ? ALL_SKILLS_VALUE : "";
        }

        return currentSelected === skillId ? fallbackSkillId : currentSelected;
      });

      setFocusedSkillId((currentFocused) =>
        currentFocused === skillId ? fallbackSkillId : currentFocused
      );

      return nextSkills;
    });

    toast.success(`已删除 Skill：${skill.name}`);
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

  const renderFoundryTree = (nodes: FileTreeNode[], depth = 0) =>
    nodes.map((node) => {
      if (node.type === "folder") {
        const isRootDirectory = depth === 0;
        const isExpanded = foundryExpandedFolders[node.path] ?? !isRootDirectory;
        const rootDirectory = isRootDirectory
          ? foundryDirectories.find((directory) => directory.name === node.name) ?? null
          : null;
        const isSelectedRoot = rootDirectory?.id === selectedFoundryDirectory?.id;

        return (
          <div key={node.path}>
            <button
              type="button"
              onClick={() => {
                if (rootDirectory) {
                  setSelectedFoundryDirectoryId(rootDirectory.id);
                }
                toggleFoundryFolder(node.path);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                isRootDirectory
                  ? cn(
                      "text-[15px] font-medium text-slate-900 hover:bg-slate-100",
                      isSelectedRoot ? "bg-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]" : ""
                    )
                  : "text-sm text-slate-700 hover:bg-slate-100"
              )}
              style={{ paddingLeft: `${depth * 18 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
              {isExpanded ? (
                <FolderOpen className={cn("h-4 w-4", isRootDirectory ? "text-blue-600" : "text-slate-500")} />
              ) : (
                <Folder className={cn("h-4 w-4", isRootDirectory ? "text-blue-600" : "text-slate-500")} />
              )}
              <span className="truncate">{node.name}</span>
            </button>
            {isExpanded ? <div>{renderFoundryTree(node.children, depth + 1)}</div> : null}
          </div>
        );
      }

      const Icon = fileIcon(node.name);
      const isActive = node.fileId === foundryActiveFileId;

      return (
        <button
          key={node.path}
          type="button"
          onClick={() => node.fileId && node.skillId && handleSelectFoundryFile(node.skillId, node.fileId)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
            isActive
              ? "bg-slate-100 text-slate-950"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
          style={{ paddingLeft: `${depth * 18 + 18}px` }}
        >
          <Icon className="h-4 w-4 text-sky-500" />
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
    <div className="skills-page relative space-y-6 pb-4">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden">
        <div className="skills-ambient-orb absolute left-[6%] top-8 h-56 w-56 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="skills-ambient-orb skills-ambient-orb-delay absolute right-[8%] top-24 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="skills-ambient-orb skills-ambient-orb-slow absolute left-[34%] top-36 h-48 w-48 rounded-full bg-slate-200/45 blur-3xl" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <TabsList
            className={cn(
              "inline-grid h-auto w-fit max-w-full rounded-[20px] border border-white/80 bg-white/86 p-1 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.28)] backdrop-blur-sm",
              isMvpMode ? "grid-cols-2" : "grid-cols-3"
            )}
          >
            <TabsTrigger
              value="marketplace"
              className="h-12 min-w-[156px] justify-center gap-2 rounded-[16px] px-4 py-2 text-sm font-semibold data-[state=active]:border-white data-[state=active]:bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.95)_55%,rgba(236,253,245,0.88))] data-[state=active]:text-slate-950 data-[state=active]:shadow-[0_14px_28px_-24px_rgba(14,165,233,0.48)]"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Skills广场</span>
            </TabsTrigger>
            <TabsTrigger
              value="mine"
              className="h-12 min-w-[156px] justify-center gap-2 rounded-[16px] px-4 py-2 text-sm font-semibold data-[state=active]:border-white data-[state=active]:bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96)_52%,rgba(239,246,255,0.92))] data-[state=active]:text-slate-950 data-[state=active]:shadow-[0_14px_28px_-24px_rgba(100,116,139,0.4)]"
            >
              <PanelLeft className="h-4 w-4" />
              <span>skills管理</span>
            </TabsTrigger>
            {!isMvpMode ? (
              <TabsTrigger
                value="foundry"
                className="h-12 min-w-[156px] justify-center gap-2 rounded-[16px] px-4 py-2 text-sm font-semibold data-[state=active]:border-white data-[state=active]:bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(254,249,195,0.4)_38%,rgba(224,242,254,0.92)_100%)] data-[state=active]:text-slate-950 data-[state=active]:shadow-[0_14px_28px_-24px_rgba(14,165,233,0.34)]"
              >
                <Sparkles className="h-4 w-4" />
                <span>Skills Foundry</span>
              </TabsTrigger>
            ) : null}
          </TabsList>

          <div className="flex items-center gap-3 self-end rounded-full border border-white/85 bg-white/86 px-3 py-2 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.28)] backdrop-blur-sm">
            <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
              版本
            </div>
            <div className="relative grid grid-cols-2 rounded-full bg-slate-100/90 p-1">
              <div
                aria-hidden
                className={cn(
                  "absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-white shadow-[0_10px_20px_-16px_rgba(15,23,42,0.45)] transition-transform duration-200",
                  isMvpMode ? "translate-x-0" : "translate-x-full"
                )}
              />
              <button
                type="button"
                onClick={() => setExperienceMode("mvp")}
                className={cn(
                  "relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                  isMvpMode ? "text-slate-950" : "text-slate-500"
                )}
              >
                MVP
              </button>
              <button
                type="button"
                onClick={() => setExperienceMode("v2")}
                className={cn(
                  "relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                  isMvpMode ? "text-slate-500" : "text-slate-950"
                )}
              >
                迭代版
              </button>
            </div>
          </div>
        </div>

        <TabsContent value="marketplace" className="space-y-3">
          <section className="relative overflow-hidden rounded-[24px] border border-slate-200/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(247,250,255,0.94)_58%,rgba(245,252,248,0.9))] shadow-[0_22px_46px_-42px_rgba(15,23,42,0.24)]">
            <div aria-hidden className="absolute inset-0">
              <div className="skills-ambient-orb absolute -left-10 top-4 h-24 w-24 rounded-full bg-cyan-200/28 blur-3xl" />
              <div className="skills-ambient-orb skills-ambient-orb-delay absolute right-[-2rem] top-2 h-28 w-28 rounded-full bg-emerald-200/22 blur-3xl" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.03),transparent_36%,rgba(14,165,233,0.05)_100%)]" />
            </div>

            <div className="relative px-4 py-4 lg:px-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex flex-col gap-1.5 xl:flex-row xl:items-center">
                    <div className="min-w-[52px] text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                      来源
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SOURCE_FILTERS.map((filter) => (
                        <button
                          key={filter.value}
                          type="button"
                          onClick={() => setMarketSourceFilter(filter.value)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all duration-200",
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
                  </div>

                  <div className="flex flex-col gap-1.5 xl:flex-row xl:items-center">
                    <div className="min-w-[52px] text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                      类目
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {USER_CATEGORY_FILTERS.map((filter) => (
                        <button
                          key={filter.value}
                          type="button"
                          onClick={() => setAudienceCategoryFilter(filter.value)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all duration-200",
                            getAudienceFilterClass(
                              filter.value,
                              audienceCategoryFilter === filter.value
                            )
                          )}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-full xl:w-[320px] xl:shrink-0">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={marketSearch}
                      onChange={(event) => setMarketSearch(event.target.value)}
                      placeholder="搜索 Skill 名称、类目或标签"
                      className="h-10 rounded-2xl border-white bg-white/88 pl-11 pr-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_14px_28px_-24px_rgba(15,23,42,0.18)] focus-visible:border-sky-200 focus-visible:ring-sky-100"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <span className="text-[11px] font-medium tracking-[0.08em] text-slate-400 uppercase">
                      排序
                    </span>
                    <div className="inline-flex rounded-full border border-white/90 bg-white/76 p-1 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.18)] backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => setMarketSortMode("downloads")}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-[12px] font-medium transition-all",
                          marketSortMode === "downloads"
                            ? "bg-slate-900 text-white shadow-[0_10px_18px_-14px_rgba(15,23,42,0.65)]"
                            : "text-slate-500 hover:text-slate-900"
                        )}
                      >
                        下载量
                      </button>
                      {!isMvpMode ? (
                        <button
                          type="button"
                          onClick={() => setMarketSortMode("references")}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-[12px] font-medium transition-all",
                            marketSortMode === "references"
                              ? "bg-slate-900 text-white shadow-[0_10px_18px_-14px_rgba(15,23,42,0.65)]"
                              : "text-slate-500 hover:text-slate-900"
                          )}
                        >
                          引用量
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setMarketSortMode("updatedAt")}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-[12px] font-medium transition-all",
                        marketSortMode === "updatedAt"
                          ? "bg-slate-900 text-white shadow-[0_10px_18px_-14px_rgba(15,23,42,0.65)]"
                          : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      最新更新
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {filteredMarketplaceSkills.length > 0 ? (
            <div className="grid gap-3 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredMarketplaceSkills.map((skill, index) => {
                const audienceMeta = AUDIENCE_VISUAL_META[skill.audienceCategory];
                const showcasePalette =
                  MARKETPLACE_CARD_PALETTES[index % MARKETPLACE_CARD_PALETTES.length];
                const SkillIcon = getMarketplaceSkillIcon(skill);

                return (
                  <article
                    key={skill.id}
                    className={cn(
                      "skills-marketplace-card skills-stagger group relative self-start overflow-hidden rounded-[24px] border p-4 shadow-[0_20px_40px_-36px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_52px_-38px_rgba(15,23,42,0.34)]",
                      "min-h-0",
                      showcasePalette.panelClass
                    )}
                    style={{ animationDelay: `${index * 55}ms` }}
                  >
                    <div
                      aria-hidden
                      className={cn(
                        "skills-card-orb absolute right-[-2rem] top-[-2rem] h-32 w-32 rounded-full opacity-70 blur-3xl",
                        showcasePalette.glowClass
                      )}
                    />
                    <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(15,23,42,0.15),transparent)]" />

                    <div className="relative flex h-full flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3.5">
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border",
                              showcasePalette.iconClass
                            )}
                          >
                            <SkillIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="skills-display min-w-0 flex-1 text-[1.18rem] leading-7 text-slate-950">
                                <span className="block truncate">{skill.name}</span>
                              </h3>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold leading-none",
                                  audienceMeta.badgeClass
                                )}
                              >
                                {audienceMeta.label}
                              </Badge>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-slate-500">
                              <span
                                className={cn(
                                  "font-medium",
                                  skill.sourceType === "platform"
                                    ? "text-sky-700"
                                    : "text-emerald-700"
                                )}
                              >
                                {getMarketplaceSourceText(skill)}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span>
                                {skill.sourceType === "platform"
                                  ? `更新于 ${skill.publishedAt}`
                                  : `发布于 ${skill.publishedAt}（${skill.publishedBy}）`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            "h-9 w-9 rounded-2xl border-white/80 bg-white/80 shadow-sm backdrop-blur-sm",
                            skill.isFavorite
                              ? "border-amber-200/80 bg-amber-50/90 text-amber-500 hover:bg-amber-100"
                              : "text-slate-600 hover:text-slate-900"
                          )}
                          onClick={() => handleToggleFavorite(skill.id)}
                          aria-label={skill.isFavorite ? "取消收藏" : "收藏"}
                          title={skill.isFavorite ? "取消收藏" : "收藏"}
                        >
                          <Star className={cn("h-4 w-4", skill.isFavorite ? "fill-current" : "")} />
                        </Button>
                      </div>

                      <p className="mt-3 line-clamp-3 text-[13px] leading-5 text-slate-600">
                        {skill.description}
                      </p>

                      <div className="mt-4">
                        <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 text-[11px] text-slate-500">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/65 px-2.5 py-1">
                              <span className="font-semibold text-slate-950">
                                {skill.downloads.toLocaleString()}
                              </span>
                              <span>下载</span>
                            </div>
                            {!isMvpMode ? (
                              <TooltipProvider delayDuration={120}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/65 px-2.5 py-1 text-[11px] text-slate-500 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-700"
                                    >
                                      <span className="font-semibold text-slate-950">
                                        {(skill.references ?? 0).toLocaleString()}
                                      </span>
                                      <span>引用</span>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    align="start"
                                    className="max-w-[260px] rounded-2xl border-white/90 bg-white/96 px-3 py-3 text-slate-600 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]"
                                  >
                                    <div className="space-y-2">
                                      <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                                        引用智能体
                                      </div>
                                      <div className="grid gap-1">
                                        {(skill.referencedAgents ?? []).length > 0 ? (
                                          (skill.referencedAgents ?? []).map((agent) => (
                                            <div
                                              key={`${skill.id}-${agent}`}
                                              className="rounded-xl bg-slate-50/90 px-2.5 py-1.5 text-[12px] text-slate-700"
                                            >
                                              {agent}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="rounded-xl bg-slate-50/90 px-2.5 py-1.5 text-[12px] text-slate-500">
                                            暂无引用中的智能体
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {!isMvpMode ? (
                              <Button
                                variant="outline"
                                className="h-9 rounded-2xl border-white/90 bg-white/82 px-3 text-[13px] text-slate-700 hover:bg-white"
                                onClick={() => handleAddToSkillsFoundry(skill)}
                              >
                                <Sparkles className="h-4 w-4" />
                                添加至Skills Foundry
                              </Button>
                            ) : null}
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-2xl border-white/90 bg-white/82 text-slate-700 hover:bg-white"
                              onClick={() => handleDownloadTemplate(skill)}
                              aria-label="下载"
                              title="下载"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[30px] border border-dashed border-slate-200/90 bg-white/75 px-6 py-14 text-center text-sm text-slate-500 shadow-[0_28px_60px_-50px_rgba(15,23,42,0.24)] backdrop-blur-sm">
              当前筛选条件下没有匹配的 Skill 模板，试试切换来源、能力类目或搜索关键词。
            </div>
          )}
        </TabsContent>

        <TabsContent value="foundry" className="space-y-4">
          <input
            ref={foundryAttachmentInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFoundryAttachments}
          />
          <input
            ref={foundryUploadFilesInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUploadFoundryFiles}
          />
          <input
            ref={foundryUploadFolderInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUploadFoundryFolder}
          />

          <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,250,252,0.92))] shadow-[0_28px_60px_-46px_rgba(15,23,42,0.3)] backdrop-blur-sm">
            <div aria-hidden className="absolute inset-0">
              <div className="skills-ambient-orb absolute left-[-4rem] top-10 h-28 w-28 rounded-full bg-cyan-200/22 blur-3xl" />
              <div className="skills-ambient-orb skills-ambient-orb-delay absolute right-[8%] top-12 h-40 w-40 rounded-full bg-amber-200/18 blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_24%),linear-gradient(135deg,rgba(15,23,42,0.02),transparent_36%,rgba(250,204,21,0.05)_100%)]" />
            </div>

            <div className="relative flex flex-col gap-4 p-4 xl:flex-row xl:items-stretch xl:p-5">
              {isFoundryTreeVisible ? (
                <aside className="overflow-hidden rounded-[28px] border border-white/85 bg-white/88 shadow-[0_22px_46px_-36px_rgba(15,23,42,0.2)] backdrop-blur-sm xl:w-[292px] xl:shrink-0">
                  <div className="border-b border-slate-200/70 px-4 py-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                        Skills目录
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        onClick={() => setIsFoundryTreeVisible(false)}
                        aria-label="收起目录"
                        title="收起目录"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={foundrySearch}
                          onChange={(event) => setFoundrySearch(event.target.value)}
                          placeholder="Search files..."
                          className="h-11 rounded-2xl border-white bg-slate-50/95 pl-10 pr-3 text-sm shadow-inner shadow-slate-200/55"
                        />
                      </div>
                      <Popover open={foundryCreateMenuOpen} onOpenChange={setFoundryCreateMenuOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            size="icon"
                            className="h-11 w-11 rounded-2xl bg-blue-600 text-white shadow-[0_16px_28px_-20px_rgba(37,99,235,0.72)] hover:bg-blue-500"
                            aria-label="新建或上传"
                            title="新建或上传"
                          >
                            <Plus className="h-5 w-5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="end"
                          className="w-[268px] rounded-[26px] border border-white/90 bg-white/96 p-2 shadow-[0_24px_48px_-30px_rgba(15,23,42,0.28)]"
                        >
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                setFoundryCreateMenuOpen(false);
                                handleCreateFoundryFile();
                              }}
                              className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
                            >
                              <FilePlus2 className="h-5 w-5 text-slate-500" />
                              <span>New file</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFoundryCreateMenuOpen(false);
                                handleCreateFoundryFolder();
                              }}
                              className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
                            >
                              <FolderPlus className="h-5 w-5 text-slate-500" />
                              <span>New folder...</span>
                            </button>
                            <div className="mx-2 border-t border-slate-100" />
                            <button
                              type="button"
                              onClick={() => {
                                setFoundryCreateMenuOpen(false);
                                foundryUploadFilesInputRef.current?.click();
                              }}
                              className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
                            >
                              <Upload className="h-5 w-5 text-slate-500" />
                              <span>Upload files...</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFoundryCreateMenuOpen(false);
                                foundryUploadFolderInputRef.current?.click();
                              }}
                              className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
                            >
                              <FolderOpen className="h-5 w-5 text-slate-500" />
                              <span>Upload Folder</span>
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="max-h-[760px] overflow-y-auto px-3 py-3">
                    <div className="space-y-1.5">
                      {foundryFileTree.length > 0 ? (
                        renderFoundryTree(foundryFileTree)
                      ) : (
                        <div className="space-y-3 rounded-[20px] border border-dashed border-slate-200/80 px-4 py-8 text-center text-sm text-slate-500">
                          <div>没有匹配的文件或目录</div>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-2xl border-slate-200/80 bg-white/88"
                            onClick={handleCreateFoundryDirectory}
                          >
                            <FolderPlus className="h-4 w-4" />
                            新建 Skill 目录
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </aside>
              ) : null}

              {isFoundryEditorVisible ? (
                <section className="overflow-hidden rounded-[28px] border border-white/85 bg-white/88 shadow-[0_22px_46px_-36px_rgba(15,23,42,0.18)] backdrop-blur-sm xl:w-[430px] xl:shrink-0">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        {selectedFoundryFile ? (
                          <>
                            {(() => {
                              const Icon = fileIcon(selectedFoundryFile.path);
                              return <Icon className="h-4 w-4 text-slate-500" />;
                            })()}
                            <span className="truncate">{selectedFoundryFile.path}</span>
                          </>
                        ) : (
                          <>
                            <FilePenLine className="h-4 w-4 text-slate-500" />
                            <span>编辑器</span>
                          </>
                        )}
                      </div>
                      <div className="mt-1 truncate text-[12px] text-slate-500">
                        {selectedFoundryDirectory?.name ?? "未选择目录"}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      onClick={() => setIsFoundryEditorVisible(false)}
                      aria-label="关闭编辑器"
                      title="关闭编辑器"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="px-4 py-4">
                    {selectedFoundryFile ? (
                      <Textarea
                        value={selectedFoundryFile.content}
                        onChange={(event) => updateFoundryFileContent(event.target.value)}
                        placeholder="选择文件后可在这里编辑内容。"
                        className="min-h-[680px] resize-none rounded-[24px] border-slate-200/80 bg-slate-50/80 p-4 font-mono text-[13px] leading-6 text-slate-700 shadow-inner shadow-slate-200/55 focus-visible:ring-sky-100"
                      />
                    ) : (
                      <div className="flex min-h-[680px] items-center justify-center rounded-[24px] border border-dashed border-slate-200/80 bg-slate-50/70 px-6 text-sm text-slate-500">
                        从左侧目录树选择一个文件后，即可在这里修改内容。
                      </div>
                    )}
                  </div>
                </section>
              ) : null}

              <div className="flex min-h-[680px] min-w-0 flex-1 flex-col justify-between rounded-[28px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.72))] px-6 py-6 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.2)] backdrop-blur-sm lg:px-8 lg:py-8">
                <div className="max-w-3xl space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1 text-[12px] font-semibold text-amber-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Skills Foundry
                  </div>
                  <h2 className="skills-display text-[clamp(2.2rem,3.6vw,3.35rem)] leading-[1.05] text-slate-950">
                    创建、试用、优化Skills，构建AI提效飞轮。
                  </h2>
                </div>

                <div className="flex flex-1 items-center justify-center py-8">
                  <div className="w-full max-w-5xl">
                    <div className="relative overflow-hidden rounded-[34px] border border-slate-200/80 bg-white/96 p-5 shadow-[0_34px_70px_-48px_rgba(15,23,42,0.38)]">
                      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(15,23,42,0.15),transparent)]" />

                      <div className="relative space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-slate-700">
                              {selectedFoundryDirectory?.name ?? "未选择目录"}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {!isFoundryTreeVisible ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="rounded-full border-slate-200/80 bg-slate-50/80 text-slate-700 hover:bg-slate-100"
                                  onClick={() => setIsFoundryTreeVisible(true)}
                                >
                                  <PanelLeft className="h-4 w-4" />
                                  显示目录
                                </Button>
                              ) : null}
                              {!isFoundryEditorVisible ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="rounded-full border-slate-200/80 bg-slate-50/80 text-slate-700 hover:bg-slate-100"
                                  onClick={() => setIsFoundryEditorVisible(true)}
                                  disabled={!selectedFoundryFile}
                                >
                                  <FilePenLine className="h-4 w-4" />
                                  显示编辑器
                                </Button>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-full border-slate-200/80 bg-slate-50/80 text-slate-700 hover:bg-slate-100"
                              onClick={() => handleApplyFoundryTemplate("create")}
                            >
                              <Sparkles className="h-4 w-4" />
                              创建skill
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-full border-slate-200/80 bg-slate-50/80 text-slate-700 hover:bg-slate-100"
                              onClick={() => handleApplyFoundryTemplate("optimize")}
                            >
                              <Wrench className="h-4 w-4" />
                              优化skills
                            </Button>
                          </div>
                        </div>

                        <div className="min-h-[248px] rounded-[28px] border border-slate-200/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,250,251,0.98))] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                          <Textarea
                            value={foundryPrompt}
                            onChange={(event) => setFoundryPrompt(event.target.value)}
                            placeholder="欢迎使用 Skills Foundry，可以在此输入你的要求。"
                            className="min-h-[190px] resize-none border-0 bg-transparent px-0 py-0 text-base leading-8 text-slate-700 shadow-none focus-visible:ring-0"
                          />

                          {foundryAttachmentNames.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {foundryAttachmentNames.map((name) => (
                                <div
                                  key={name}
                                  className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-sky-50/85 px-3 py-1.5 text-xs text-sky-700"
                                >
                                  <Paperclip className="h-3.5 w-3.5" />
                                  <span className="max-w-[220px] truncate">{name}</span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-14 w-14 rounded-[20px] border-slate-200/80 bg-white text-slate-700 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.48)] hover:bg-slate-50"
                              onClick={() => foundryAttachmentInputRef.current?.click()}
                              aria-label="上传附件"
                              title="上传附件"
                            >
                              <Paperclip className="h-5 w-5" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-14 w-14 rounded-[20px] border-slate-200/80 bg-white text-slate-700 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.48)] hover:bg-slate-50"
                              onClick={handleFoundryVoiceInput}
                              aria-label="语音输入"
                              title="语音输入"
                            >
                              <Mic className="h-5 w-5" />
                            </Button>
                          </div>

                          <Button
                            type="button"
                            size="icon"
                            className="h-14 w-14 rounded-[20px] bg-slate-500 text-white shadow-[0_16px_30px_-22px_rgba(15,23,42,0.7)] hover:bg-slate-700"
                            onClick={handleSendFoundryPrompt}
                            aria-label="发送"
                            title="发送"
                          >
                            <ArrowUp className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="mine" className="space-y-4">
          <input
            ref={importInputRef}
            type="file"
            accept=".json,.md,.txt,.ts,.tsx,.js,.jsx,.css,.yml,.yaml"
            multiple
            className="hidden"
            onChange={handleImportSkills}
          />

          {useUnifiedSkillsManagementView ? (
            <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,250,252,0.92))] shadow-[0_28px_60px_-46px_rgba(15,23,42,0.3)] backdrop-blur-sm">
              <div aria-hidden className="absolute inset-0">
                <div className="skills-ambient-orb absolute left-[-3rem] top-0 h-24 w-24 rounded-full bg-cyan-200/24 blur-3xl" />
                <div className="skills-ambient-orb skills-ambient-orb-delay absolute right-[-2rem] top-8 h-28 w-28 rounded-full bg-indigo-200/18 blur-3xl" />
              </div>

              <div className="relative px-5 py-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="skills-display text-[1.75rem] text-slate-950">我的Skills</h2>
                      <Badge
                        variant="outline"
                        className="border-slate-200/80 bg-slate-50/90 text-slate-600"
                      >
                        {filteredMySkills.length} 项
                      </Badge>
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-slate-500">
                      以列表方式统一管理自定义 Skill，支持导入、导出、发布、更新与删除。
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-2 xl:w-auto xl:min-w-[420px]">
                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <Button
                        variant="outline"
                        className="rounded-2xl border-white bg-white/88 shadow-sm hover:bg-white"
                        onClick={() => importInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        导入Skills
                      </Button>
                    </div>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={mySkillSearch}
                        onChange={(event) => setMySkillSearch(event.target.value)}
                        placeholder="搜索我的Skills"
                        className="h-10 rounded-2xl border-white bg-white/90 pl-11 pr-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_14px_28px_-24px_rgba(15,23,42,0.18)] focus-visible:border-sky-200 focus-visible:ring-sky-100"
                      />
                    </div>
                  </div>
                </div>

                {filteredMySkills.length > 0 ? (
                  <div className="mt-5 grid gap-3 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredMySkills.map((skill, index) => {
                      const audienceCategory = mapEditorCategoryToAudienceCategory(skill.category);
                      const audienceMeta = AUDIENCE_VISUAL_META[audienceCategory];
                      const showcasePalette =
                        MARKETPLACE_CARD_PALETTES[index % MARKETPLACE_CARD_PALETTES.length];
                      const SkillIcon = getMarketplaceSkillIcon({
                        name: skill.name,
                        audienceCategory,
                      });
                      const statusMeta = getSkillStatusMeta(skill.status);
                      const StatusIcon = statusMeta.icon;

                      return (
                        <article
                          key={skill.id}
                          className={cn(
                            "skills-marketplace-card skills-stagger group relative overflow-hidden rounded-[24px] border p-4 shadow-[0_20px_40px_-36px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_52px_-38px_rgba(15,23,42,0.34)]",
                            "min-h-[250px] xl:min-h-[262px]",
                            showcasePalette.panelClass
                          )}
                          style={{ animationDelay: `${index * 55}ms` }}
                        >
                          <div
                            aria-hidden
                            className={cn(
                              "skills-card-orb absolute right-[-2rem] top-[-2rem] h-32 w-32 rounded-full opacity-70 blur-3xl",
                              showcasePalette.glowClass
                            )}
                          />
                          <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(15,23,42,0.15),transparent)]" />

                          <div className="relative flex h-full flex-col">
                            <div className="flex items-start gap-3.5">
                              <div
                                className={cn(
                                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border",
                                  showcasePalette.iconClass
                                )}
                              >
                                <SkillIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1 pt-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="skills-display min-w-0 flex-1 text-[1.18rem] leading-7 text-slate-950">
                                    <span className="block truncate">{skill.name}</span>
                                  </h3>
                                  {skill.status === "published" ? (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold leading-none",
                                        audienceMeta.badgeClass
                                      )}
                                    >
                                      {audienceMeta.label}
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-slate-500">
                                  <span>
                                    最近更新于 {skill.updatedAt}（{skill.updatedBy}）
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <span className={cn("inline-flex items-center gap-1.5 font-medium", statusMeta.className)}>
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    {skill.status === "draft"
                                      ? statusMeta.label
                                      : `${statusMeta.label} ${formatSkillVersion(skill.version)}`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <p className="mt-3 line-clamp-3 text-[13px] leading-5 text-slate-600">
                              {skill.description}
                            </p>

                            <div className="mt-4">
                              <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 text-[11px] text-slate-500">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span>{skill.files.length} 个文件</span>
                                </div>
                              </div>

                              <div className="mt-3 grid grid-cols-3 gap-1.5">
                                <Button
                                  variant="outline"
                                  className="h-9 rounded-2xl border-white/90 bg-white/82 px-3 text-[13px] text-slate-700 hover:bg-white"
                                  onClick={() => handleExportMySkill(skill.id)}
                                >
                                  <Download className="h-4 w-4" />
                                  导出
                                </Button>
                                <Button
                                  className="h-9 flex-1 rounded-2xl bg-slate-950 px-3.5 text-[13px] text-white shadow-[0_18px_28px_-24px_rgba(15,23,42,0.76)] hover:bg-slate-800"
                                  onClick={() =>
                                    skill.status === "draft"
                                      ? handleRequestReview(skill.id)
                                      : openUpdateDialog(skill.id)
                                  }
                                >
                                  {skill.status === "draft" ? (
                                    <Rocket className="h-4 w-4" />
                                  ) : (
                                    <Upload className="h-4 w-4" />
                                  )}
                                  {skill.status === "draft" ? "发布" : "更新"}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="h-9 rounded-2xl border-white/90 bg-white/82 px-3 text-[13px] text-slate-700 hover:bg-white"
                                  onClick={() => handleDeleteMySkill(skill.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  删除
                                </Button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[28px] border border-dashed border-slate-200/90 bg-white/78 px-6 py-14 text-center text-sm text-slate-500 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.2)]">
                    没有匹配的 Skill，试试换个关键词，或者导入一个本地 Skill。
                  </div>
                )}
              </div>

              <Dialog
                open={updateDialogOpen}
                onOpenChange={(open) => {
                  setUpdateDialogOpen(open);
                  if (!open) {
                    setUpdateTargetSkillId("");
                    setUpdateVersionInput("");
                    setUpdateZipFile(null);
                  }
                }}
              >
                <DialogContent className="rounded-[28px] border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] p-0 shadow-[0_30px_60px_-32px_rgba(15,23,42,0.35)]">
                  <div className="overflow-hidden rounded-[28px]">
                    <div className="border-b border-slate-200/70 bg-[linear-gradient(135deg,rgba(240,249,255,0.95),rgba(255,255,255,0.96)_55%,rgba(236,253,245,0.9))] px-6 py-5">
                      <DialogHeader className="gap-1 text-left">
                        <DialogTitle className="skills-display text-[1.5rem] text-slate-950">
                          提交 Skill 更新
                        </DialogTitle>
                        <DialogDescription className="text-sm leading-6 text-slate-500">
                          上传新的 zip 包，并填写高于当前版本的新版本号。提交后会进入审核中状态。
                        </DialogDescription>
                      </DialogHeader>
                    </div>

                    <div className="space-y-5 px-6 py-5">
                      <div className="space-y-2">
                        <Label htmlFor="skill-update-zip">更新包</Label>
                        <input
                          id="skill-update-zip"
                          type="file"
                          accept=".zip,application/zip"
                          onChange={(event) => setUpdateZipFile(event.target.files?.[0] ?? null)}
                          className="block h-11 w-full rounded-2xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                        />
                        <p className="text-xs text-slate-500">
                          {updateZipFile ? `已选择：${updateZipFile.name}` : "请上传新的 Skill zip 包"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="skill-update-version">新版本号</Label>
                        <Input
                          id="skill-update-version"
                          value={updateVersionInput}
                          onChange={(event) => setUpdateVersionInput(event.target.value)}
                          placeholder="例如 1.1 或 1.1.2"
                          className="h-11 rounded-2xl border-slate-200/80 bg-white/95"
                        />
                        <p className="text-xs text-slate-500">
                          版本号需高于当前版本，支持 `1.1` 或 `1.1.2` 这类格式。
                        </p>
                      </div>
                    </div>

                    <DialogFooter className="border-t border-slate-200/70 px-6 py-4">
                      <Button
                        variant="outline"
                        className="rounded-2xl border-slate-200/80 bg-white hover:bg-slate-50"
                        onClick={() => {
                          setUpdateDialogOpen(false);
                          setUpdateTargetSkillId("");
                          setUpdateVersionInput("");
                          setUpdateZipFile(null);
                        }}
                      >
                        取消
                      </Button>
                      <Button
                        className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
                        onClick={handleSubmitUpdate}
                      >
                        <Upload className="h-4 w-4" />
                        提交更新
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </section>
          ) : (
            <Card className="overflow-hidden rounded-[30px] border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] shadow-[0_28px_60px_-46px_rgba(15,23,42,0.32)] backdrop-blur-sm">
              <CardHeader className="gap-4 border-b border-slate-200/70 bg-[radial-gradient(circle_at_top_left,rgba(224,242,254,0.4),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.92))] pb-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="skills-display text-[1.85rem] text-slate-950">
                      我的Skills
                    </CardTitle>
                    <CardDescription className="max-w-2xl leading-6 text-slate-500">
                      支持导入本地草稿、编辑文件内容、保存修改，并发布到 Skills 广场。
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
                      className="w-[240px] rounded-2xl border-white bg-white/80 shadow-sm"
                    />
                    <Button
                      variant="outline"
                      className="rounded-2xl border-white bg-white/85 shadow-sm hover:bg-white"
                      onClick={() => importInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      导入Skills
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-2xl border-white bg-white/85 shadow-sm hover:bg-white"
                      onClick={handleSave}
                      disabled={!activeSkill}
                    >
                      <Save className="h-4 w-4" />
                      保存
                    </Button>
                    <Button
                      className="rounded-2xl bg-slate-900 text-white shadow-[0_18px_30px_-24px_rgba(15,23,42,0.75)] hover:bg-slate-800"
                      onClick={handlePublish}
                      disabled={!activeSkill}
                    >
                      <Rocket className="h-4 w-4" />
                      发布到Skills广场
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {activeSkill ? (
                  <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <aside className="rounded-[28px] border border-white/85 bg-white/82 p-4 shadow-[0_24px_50px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-950">文件列表</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {isAllSkillsSelected
                            ? `${mySkills.length} 个 Skills · ${totalMySkillFileCount} 个文件`
                            : `${activeSkill.files.length} 个文件 · 最近保存于 ${activeSkill.updatedAt}（${activeSkill.updatedBy}）`}
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
                        className="rounded-2xl border-white bg-slate-50/90 pl-9 shadow-inner shadow-slate-200/50"
                      />
                    </div>

                    <div className="mt-4 rounded-[22px] border border-slate-200/80 bg-slate-50/70 p-2">
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
                    <div className="rounded-[28px] border border-white/85 bg-white/86 p-5 shadow-[0_24px_50px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm">
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
                              : activeSkill.status === "reviewing"
                                ? "border-sky-200 bg-sky-50 text-sky-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                          }
                        >
                          {activeSkill.status === "published"
                            ? "已发布"
                            : activeSkill.status === "reviewing"
                              ? "审核中"
                              : "草稿"}
                        </Badge>
                        {!isMvpMode
                          ? activeSkill.linkedCECClaws.map((cec) => (
                              <Badge
                                key={cec}
                                variant="outline"
                                className="border-sky-200 bg-sky-50 text-sky-700"
                              >
                                已绑定：{cec}
                              </Badge>
                            ))
                          : null}
                        {activeSkill.dirty ? (
                          <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                            未保存修改
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[28px] border border-white/85 bg-white/88 shadow-[0_24px_50px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm">
                      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/70 bg-slate-50/80 px-3 py-2">
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
                                "flex items-center gap-2 rounded-t-2xl border px-3 py-2 text-sm transition-colors",
                                isActive
                                  ? "border-slate-200 bg-white text-slate-950 shadow-sm"
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
                          <div className="border-b border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-500">
                            当前文件：
                            <span className="font-medium text-slate-900">
                              {isAllSkillsSelected ? `${activeSkill.name}/${activeFile.path}` : activeFile.path}
                            </span>
                          </div>
                          <Textarea
                            value={activeFile.content}
                            onChange={(event) => updateActiveFileContent(event.target.value)}
                            spellCheck={false}
                            className="min-h-[560px] rounded-none border-0 bg-white/70 px-4 py-4 font-mono text-[13px] leading-6 shadow-none focus-visible:ring-0"
                          />
                          <div className="flex items-center justify-between border-t border-slate-200/70 bg-slate-50/80 px-4 py-2 text-xs text-slate-500">
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
                <div className="rounded-[28px] border border-dashed border-slate-200/90 bg-white/80 px-6 py-12 text-center text-sm text-slate-500 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.2)]">
                  还没有任何 Skill，先导入本地草稿吧。
                </div>
              )}
            </CardContent>
          </Card>
          )}
        </TabsContent>
      </Tabs>

      <style jsx>{`
        .skills-page {
          --skills-display-font: "Songti SC", "Noto Serif SC", "STSong", serif;
          --skills-body-font: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
          font-family: var(--skills-body-font);
        }

        .skills-display {
          font-family: var(--skills-display-font);
          letter-spacing: -0.04em;
        }

        .skills-ambient-orb {
          animation: skillsFloat 16s ease-in-out infinite;
          will-change: transform;
        }

        .skills-ambient-orb-delay {
          animation-delay: -5s;
        }

        .skills-ambient-orb-slow {
          animation-duration: 22s;
        }

        .skills-card-orb {
          transition: transform 320ms ease, opacity 320ms ease;
        }

        .skills-marketplace-card:hover .skills-card-orb {
          opacity: 0.92;
          transform: scale(1.08);
        }

        .skills-stagger {
          animation: skillsRise 0.72s both;
        }

        @keyframes skillsFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(0, -14px, 0) scale(1.06);
          }
        }

        @keyframes skillsRise {
          from {
            opacity: 0;
            transform: translate3d(0, 18px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}
