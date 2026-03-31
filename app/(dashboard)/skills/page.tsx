"use client";

import {
  ChangeEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BellRing,
  Bot,
  Boxes,
  Building2,
  ChartColumn,
  ChartColumnIncreasing,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  FileCode2,
  FilePenLine,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Github,
  LayoutGrid,
  LoaderCircle,
  Mail,
  MessagesSquare,
  PanelLeft,
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  SkillsFoundryTab,
  type SkillsFoundryTemplateSeed,
} from "@/components/skills/skills-foundry-tab";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type SkillSource = "template" | "blank" | "imported";
type SkillStatus = "draft" | "reviewing" | "published" | "reviewFailed";
type MarketplaceSourceType = "platform" | "org";
type MarketplaceSourceFilter = "all" | MarketplaceSourceType | "favorite";
type SkillsExperienceMode = "mvp" | "v2";
type SkillsTab = "marketplace" | "mine" | "foundry";
type MarketplaceSortMode = "downloads" | "references" | "updatedAt";
type MySkillStatusFilter = "all" | "reviewing" | "published" | "reviewFailed";
type SkillImportMode = "local" | "url";
type SkillImportUrlSource = "github" | "skills.sh" | "clawhub";
type SkillImportEntryMode = "local" | SkillImportUrlSource;
type SkillReleaseMode = "publish" | "update";
type DependencyToolType = "mcp" | "plugin";
type LocalImportValidationStatus = "idle" | "validating" | "valid" | "invalid";
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
  declaredDependencies?: SkillDependency[];
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
  declaredDependencies: SkillDependency[];
  source: SkillSource;
  status: SkillStatus;
  createdBy: string;
  linkedCECClaws: string[];
  files: SkillFile[];
  activeFileId: string;
  openFileIds: string[];
  dirty: boolean;
  updatedAt: string;
  updatedBy: string;
  version?: string;
  publishedTemplateId?: string;
  hasPublishedHistory: boolean;
}

interface SkillBundle {
  schemaVersion: 1;
  name: string;
  description: string;
  category: string;
  tags: string[];
  declaredDependencies?: SkillDependency[];
  files: Array<Pick<SkillFile, "path" | "content">>;
}

interface SkillDependency {
  id: string;
  name: string;
  type: DependencyToolType;
}

interface LocalImportValidationResult {
  status: LocalImportValidationStatus;
  errors: string[];
  fileName: string;
  manifest?: {
    name: string;
    description: string;
  };
  category?: string;
  tags?: string[];
  declaredDependencies?: SkillDependency[];
  files?: Array<Pick<SkillFile, "path" | "content">>;
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

const MY_SKILL_STATUS_FILTERS: Array<{ value: MySkillStatusFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "reviewing", label: "审核中" },
  { value: "published", label: "已上架" },
  { value: "reviewFailed", label: "审核失败" },
];

const CEC_CLAW_INSTANCE = "华东专属 CEC-Claw";
const ALL_SKILLS_VALUE = "__all__";
const CURRENT_SKILL_EDITOR = "楠不难";
const IMPORT_ENTRY_OPTIONS: Array<{
  value: SkillImportEntryMode;
  label: string;
  hint: string;
  icon: LucideIcon;
}> = [
  {
    value: "local",
    label: "本地.zip导入",
    hint: "上传本地 Skill 压缩包并校验结构",
    icon: Upload,
  },
  {
    value: "github",
    label: "从Github导入",
    hint: "从公开 GitHub 仓库导入 Skill",
    icon: Github,
  },
  {
    value: "skills.sh",
    label: "从skill.sh导入",
    hint: "从 skills.sh 链接导入 Skill",
    icon: Sparkles,
  },
  {
    value: "clawhub",
    label: "从Clawhub导入",
    hint: "从 Clawhub 链接导入 Skill",
    icon: Bot,
  },
];
const IMPORT_MAX_FILE_SIZE = 100 * 1024 * 1024;
const DEPENDENCY_TOOL_OPTIONS: SkillDependency[] = [
  { id: "mcp-policy-center", name: "制度中心 MCP", type: "mcp" },
  { id: "mcp-contract-review", name: "合同审阅 MCP", type: "mcp" },
  { id: "mcp-mail-gateway", name: "邮件网关 MCP", type: "mcp" },
  { id: "mcp-lanxin-message", name: "蓝信消息 MCP", type: "mcp" },
  { id: "plugin-office-suite", name: "办公套件插件", type: "plugin" },
  { id: "plugin-travel-expense", name: "差旅报销插件", type: "plugin" },
  { id: "plugin-procurement-center", name: "招采协同插件", type: "plugin" },
  { id: "plugin-public-opinion", name: "舆情监测插件", type: "plugin" },
];
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
  declaredDependencies?: SkillDependency[];
  source: SkillSource;
  status?: SkillStatus;
  files: SkillFile[];
  createdBy?: string;
  linkedCECClaws?: string[];
  updatedBy?: string;
  version?: string;
  publishedTemplateId?: string;
  hasPublishedHistory?: boolean;
}) {
  const files = cloneFiles(input.files, input.id);
  const firstFileId = files[0]?.id ?? "";

  return {
    id: input.id,
    name: input.name,
    description: input.description,
    category: input.category,
    tags: [...input.tags],
    declaredDependencies: [...(input.declaredDependencies ?? [])],
    source: input.source,
    status: input.status ?? "draft",
    createdBy: input.createdBy ?? input.updatedBy ?? CURRENT_SKILL_EDITOR,
    linkedCECClaws: input.linkedCECClaws ?? [],
    files,
    activeFileId: firstFileId,
    openFileIds: firstFileId ? [firstFileId] : [],
    dirty: false,
    updatedAt: formatNow(),
    updatedBy: input.updatedBy ?? CURRENT_SKILL_EDITOR,
    version: input.version,
    publishedTemplateId: input.publishedTemplateId,
    hasPublishedHistory: input.hasPublishedHistory ?? input.status === "published",
  } satisfies MySkill;
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
    createdBy: "王晓宁",
    updatedBy: "王晓宁",
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
    status: "reviewing",
    version: "1.0",
    createdBy: "周媛",
    updatedBy: "周媛",
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
    createdBy: "李晓晓",
    updatedBy: "李晓晓",
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
    status: "reviewFailed",
    version: "1.1",
    createdBy: "赵明",
    updatedBy: "赵明",
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
    status: "draft",
    version: "1.0",
    createdBy: "刘婧",
    updatedBy: "刘婧",
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

function serializeSkillBundle(
  skill: Pick<MySkill, "name" | "description" | "category" | "tags" | "declaredDependencies" | "files">
): string {
  const bundle: SkillBundle = {
    schemaVersion: 1,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    tags: [...skill.tags],
    declaredDependencies: [...skill.declaredDependencies],
    files: skill.files.map((file) => ({
      path: file.path,
      content: file.content,
    })),
  };

  return JSON.stringify(bundle, null, 2);
}

function downloadBlobFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function exportSkillArchive(
  filename: string,
  skill: Pick<MySkill, "name" | "description" | "category" | "tags" | "declaredDependencies" | "files">
) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  skill.files.forEach((file) => {
    zip.file(file.path, file.content);
  });

  zip.file(".skillhub.json", serializeSkillBundle(skill));

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlobFile(filename, blob);
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
  const sanitized = path.replace(/^\.?\//, "");
  const segments = sanitized.split("/").filter(Boolean);
  return segments.join("/") || "SKILL.md";
}

function extractYamlValue(rawValue: string) {
  const value = rawValue.trim();

  if (!value) {
    return "";
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }

  return value;
}

function parseSkillFrontmatter(content: string) {
  if (!content.trim()) {
    return { error: "导入失败：SKILL.md 内容为空或无法正常读取" };
  }

  const frontmatterMatch = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    return { error: "导入失败：SKILL.md 格式不符合 YAML 规范" };
  }

  const yamlLines = frontmatterMatch[1].split(/\r?\n/);
  const fields = new Map<string, string>();

  for (const line of yamlLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex <= 0) {
      return { error: "导入失败：SKILL.md 格式不符合 YAML 规范" };
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1);

    if (!key) {
      return { error: "导入失败：SKILL.md 格式不符合 YAML 规范" };
    }

    fields.set(key, extractYamlValue(value));
  }

  const name = fields.get("name")?.trim() ?? "";
  const description = fields.get("description")?.trim() ?? "";

  if (!name) {
    return { error: "导入失败：SKILL.md 中缺少 Skill 名称（name）" };
  }

  if (!description) {
    return { error: "导入失败：SKILL.md 中缺少 Skill 描述（description）" };
  }

  return {
    name,
    description,
  };
}

function buildImportValidationError(error: string): LocalImportValidationResult {
  return {
    status: "invalid",
    errors: [error],
    fileName: "",
  };
}

function getImportUrlSourceLabel(source: SkillImportUrlSource) {
  switch (source) {
    case "github":
      return "GitHub";
    case "skills.sh":
      return "skills.sh";
    default:
      return "Clawhub";
  }
}

function inferSkillImportUrlSource(value: string): SkillImportUrlSource | null {
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

    if (hostname === "github.com") {
      return "github";
    }

    if (hostname === "skills.sh") {
      return "skills.sh";
    }

    if (hostname === "clawhub.ai") {
      return "clawhub";
    }

    return null;
  } catch {
    return null;
  }
}

function formatImportedSkillName(rawSegment: string) {
  const decoded = decodeURIComponent(rawSegment).replace(/[-_]+/g, " ").trim();
  return decoded || "imported skill";
}

function extractSkillNameFromUrl(url: URL, source: SkillImportUrlSource) {
  const segments = url.pathname.split("/").filter(Boolean);

  if (source === "github") {
    return formatImportedSkillName(segments[1] ?? segments.at(-1) ?? "github-skill");
  }

  return formatImportedSkillName(segments.at(-1) ?? "imported-skill");
}

function isValidSkillImportUrlPath(url: URL, source: SkillImportUrlSource) {
  const segments = url.pathname.split("/").filter(Boolean);

  if (source === "github") {
    return segments.length === 2;
  }

  if (source === "skills.sh") {
    return segments.length >= 3;
  }

  return segments.length >= 2 && segments.length <= 3;
}

async function validateLocalImportArchive(file: File): Promise<LocalImportValidationResult> {
  const lowerName = file.name.toLowerCase();
  const isZipLike =
    lowerName.endsWith(".zip") || lowerName.endsWith(".skill") || lowerName.endsWith(".skill.json");

  if (!isZipLike) {
    return buildImportValidationError("仅支持导入 .zip 或 .skill 格式文件");
  }

  if (file.size > IMPORT_MAX_FILE_SIZE) {
    return buildImportValidationError("文件大小超过 100MB，暂不支持导入");
  }

  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const zipEntries = Object.values(zip.files).filter(
      (entry) =>
        !entry.dir &&
        !entry.name.startsWith("__MACOSX/") &&
        !entry.name.endsWith(".DS_Store")
    );

    const rootSkillEntry = zipEntries.find((entry) => /^SKILL\.md$/i.test(normalizeImportedPath(entry.name)));
    if (!rootSkillEntry) {
      return buildImportValidationError("导入失败：压缩包根目录下未检测到 SKILL.md 文件");
    }

    let skillMarkdown = "";
    try {
      skillMarkdown = await rootSkillEntry.async("string");
    } catch {
      return buildImportValidationError("导入失败：SKILL.md 内容为空或无法正常读取");
    }

    if (!skillMarkdown.trim()) {
      return buildImportValidationError("导入失败：SKILL.md 内容为空或无法正常读取");
    }

    const frontmatter = parseSkillFrontmatter(skillMarkdown);
    if ("error" in frontmatter) {
      return buildImportValidationError(frontmatter.error);
    }

    const metadataEntry = zipEntries.find((entry) => normalizeImportedPath(entry.name) === ".skillhub.json");
    let metadata: Partial<SkillBundle> | null = null;

    if (metadataEntry) {
      try {
        metadata = JSON.parse(await metadataEntry.async("string")) as Partial<SkillBundle>;
      } catch {
        metadata = null;
      }
    }

    const files = await Promise.all(
      zipEntries
        .filter((entry) => normalizeImportedPath(entry.name) !== ".skillhub.json")
        .map(async (entry, index) => ({
          path: normalizeImportedPath(entry.name || `file-${index + 1}.md`),
          content: await entry.async("string"),
        }))
    );

    return {
      status: "valid",
      errors: [],
      fileName: file.name,
      manifest: {
        name: frontmatter.name,
        description: frontmatter.description,
      },
      category: metadata?.category ?? "通用",
      tags: Array.isArray(metadata?.tags) ? metadata.tags : ["压缩包导入"],
      declaredDependencies: Array.isArray(metadata?.declaredDependencies)
        ? metadata.declaredDependencies.filter(
            (item): item is SkillDependency =>
              Boolean(item && typeof item.id === "string" && typeof item.name === "string")
          )
        : [],
      files,
    };
  } catch {
    return buildImportValidationError("文件解析失败，请检查压缩包是否损坏后重试");
  }
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

function hasPublishedHistory(
  skill: Pick<MySkill, "status" | "publishedTemplateId" | "hasPublishedHistory">
) {
  return skill.status === "published" || skill.hasPublishedHistory || Boolean(skill.publishedTemplateId);
}

function getSkillReleaseActionMeta(
  skill: Pick<MySkill, "status" | "publishedTemplateId" | "hasPublishedHistory">
) {
  if (skill.status === "reviewing") {
    return {
      mode: (hasPublishedHistory(skill) ? "update" : "publish") as const,
      label: "审核中",
      icon: Clock3,
      disabled: true,
    };
  }

  if (!hasPublishedHistory(skill)) {
    return {
      mode: "publish" as const,
      label: "发布",
      icon: Rocket,
      disabled: false,
    };
  }

  return {
    mode: "update" as const,
    label: skill.status === "published" ? "更新" : "更新发布",
    icon: Upload,
    disabled: false,
  };
}

function getSkillStatusMeta(status: SkillStatus) {
  switch (status) {
    case "published":
      return {
        label: "已上架",
        icon: BadgeCheck,
        className: "text-emerald-700",
      };
    case "reviewing":
      return {
        label: "审核中",
        icon: Clock3,
        className: "text-sky-700",
      };
    case "reviewFailed":
      return {
        label: "审核失败",
        icon: X,
        className: "text-rose-700",
      };
    default:
      return {
        label: "未发布",
        icon: FilePenLine,
        className: "text-amber-700",
      };
  }
}

function getMySkillStatusFilterClass(filterValue: MySkillStatusFilter, active: boolean) {
  if (!active) {
    return "border-transparent bg-transparent text-slate-500 hover:border-slate-200/80 hover:bg-white hover:text-slate-900";
  }

  switch (filterValue) {
    case "reviewing":
      return "border-sky-200/80 bg-sky-50 text-sky-700 shadow-[0_14px_26px_-24px_rgba(14,165,233,0.46)]";
    case "published":
      return "border-emerald-200/80 bg-emerald-50 text-emerald-700 shadow-[0_14px_26px_-24px_rgba(16,185,129,0.42)]";
    case "reviewFailed":
      return "border-rose-200/80 bg-rose-50 text-rose-700 shadow-[0_14px_26px_-24px_rgba(244,63,94,0.38)]";
    default:
      return "border-slate-200/90 bg-white text-slate-900 shadow-[0_14px_26px_-24px_rgba(15,23,42,0.18)]";
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
  const [mySkillStatusFilter, setMySkillStatusFilter] = useState<MySkillStatusFilter>("all");
  const [marketSourceFilter, setMarketSourceFilter] = useState<MarketplaceSourceFilter>("all");
  const [marketSortMode, setMarketSortMode] = useState<MarketplaceSortMode>("downloads");
  const [audienceCategoryFilter, setAudienceCategoryFilter] =
    useState<AudienceCategoryFilter>("all");
  const [fileSearch, setFileSearch] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateTargetSkillId, setUpdateTargetSkillId] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetSkillId, setDeleteTargetSkillId] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<SkillImportMode>("local");
  const [importUrlSource, setImportUrlSource] = useState<SkillImportUrlSource>("github");
  const [importUrlValue, setImportUrlValue] = useState("");
  const [localImportFile, setLocalImportFile] = useState<File | null>(null);
  const [localImportValidation, setLocalImportValidation] = useState<LocalImportValidationResult>({
    status: "idle",
    errors: [],
    fileName: "",
  });
  const [importDependencyEnabled, setImportDependencyEnabled] = useState(false);
  const [selectedDependencyIds, setSelectedDependencyIds] = useState<string[]>([]);
  const [dependencyPopoverOpen, setDependencyPopoverOpen] = useState(false);
  const [dependencySearch, setDependencySearch] = useState("");
  const [remoteImportLoading, setRemoteImportLoading] = useState(false);
  const [updateVersionInput, setUpdateVersionInput] = useState("");
  const [updateZipFile, setUpdateZipFile] = useState<File | null>(null);
  const [releaseMode, setReleaseMode] = useState<SkillReleaseMode>("publish");
  const [pendingFoundryTemplate, setPendingFoundryTemplate] =
    useState<SkillsFoundryTemplateSeed | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const updateZipInputRef = useRef<HTMLInputElement>(null);
  const reviewApprovalTimersRef = useRef<Record<string, number>>({});
  const useUnifiedSkillsManagementView = true;

  const deferredMarketSearch = useDeferredValue(marketSearch);
  const deferredMySkillSearch = useDeferredValue(mySkillSearch);
  const deferredFileSearch = useDeferredValue(fileSearch);
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

  useEffect(
    () => () => {
      Object.values(reviewApprovalTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      reviewApprovalTimersRef.current = {};
    },
    []
  );

  const activeSkill = useMemo(
    () =>
      isAllSkillsSelected
        ? mySkills.find((skill) => skill.id === focusedSkillId) ?? mySkills[0] ?? null
        : mySkills.find((skill) => skill.id === selectedSkillId) ?? mySkills[0] ?? null,
    [focusedSkillId, isAllSkillsSelected, mySkills, selectedSkillId]
  );

  const updateTargetSkill = useMemo(
    () => mySkills.find((skill) => skill.id === updateTargetSkillId) ?? null,
    [mySkills, updateTargetSkillId]
  );
  const deleteTargetSkill = useMemo(
    () => mySkills.find((skill) => skill.id === deleteTargetSkillId) ?? null,
    [deleteTargetSkillId, mySkills]
  );

  const updateCurrentVersion = updateTargetSkill?.version ?? "1.0";
  const isPublishRelease = releaseMode === "publish";
  const updateZipError =
    updateZipFile && !updateZipFile.name.toLowerCase().endsWith(".zip")
      ? "仅支持上传 zip 包"
      : "";
  const updateVersionError = useMemo(() => {
    if (!updateTargetSkill) {
      return "";
    }

    const nextVersion = updateVersionInput.trim();
    if (!nextVersion) {
      return "";
    }

    if (!isValidVersion(nextVersion)) {
      return "版本号格式需为 1.1 或 1.1.2";
    }

    if (isPublishRelease) {
      if (compareVersions(nextVersion, "1.0") < 0) {
        return `首次发布请填写不低于${formatSkillVersion("1.0")}的版本号`;
      }
      return "";
    }

    if (compareVersions(nextVersion, updateCurrentVersion) <= 0) {
      return `请填写高于${formatSkillVersion(updateCurrentVersion)}的版本号`;
    }

    return "";
  }, [isPublishRelease, updateCurrentVersion, updateTargetSkill, updateVersionInput]);
  const canSubmitRelease = Boolean(
    updateTargetSkill &&
      updateVersionInput.trim() &&
      (isPublishRelease || updateZipFile) &&
      !updateZipError &&
      !updateVersionError
  );
  const normalizedImportUrl = importUrlValue.trim();
  const inferredImportUrlSource = useMemo(
    () => (normalizedImportUrl ? inferSkillImportUrlSource(normalizedImportUrl) : null),
    [normalizedImportUrl]
  );
  const importUrlError = useMemo(() => {
    if (!normalizedImportUrl) {
      return "";
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(normalizedImportUrl);
    } catch {
      return "请输入有效的 URL 地址";
    }

    if (!inferredImportUrlSource) {
      return "仅支持 GitHub、skills.sh 或 Clawhub 链接";
    }

    if (inferredImportUrlSource !== importUrlSource) {
      return `当前选择的是 ${getImportUrlSourceLabel(importUrlSource)} 导入，请填写对应来源链接`;
    }

    if (!isValidSkillImportUrlPath(parsedUrl, importUrlSource)) {
      if (importUrlSource === "github") {
        return "GitHub 导入请填写完整仓库链接，例如 github.com/org/repo";
      }

      if (importUrlSource === "skills.sh") {
        return "skills.sh 导入请填写完整 skill 链接，例如 skills.sh/org/repo/skill";
      }

      return "Clawhub 导入请填写完整 skill 链接，例如 clawhub.ai/author/skill";
    }

    return "";
  }, [importUrlSource, inferredImportUrlSource, normalizedImportUrl]);
  const selectedDeclaredDependencies = useMemo(
    () => DEPENDENCY_TOOL_OPTIONS.filter((item) => selectedDependencyIds.includes(item.id)),
    [selectedDependencyIds]
  );
  const filteredDependencyOptions = useMemo(() => {
    const query = dependencySearch.trim().toLowerCase();
    if (!query) {
      return DEPENDENCY_TOOL_OPTIONS;
    }

    return DEPENDENCY_TOOL_OPTIONS.filter((item) =>
      [item.name, item.type === "mcp" ? "mcp" : "插件"].join(" ").toLowerCase().includes(query)
    );
  }, [dependencySearch]);
  const canConfirmLocalImport = localImportValidation.status === "valid";

  const activeFile = useMemo(
    () => activeSkill?.files.find((file) => file.id === activeSkill.activeFileId) ?? null,
    [activeSkill]
  );
  const deleteTargetAudienceCategory = deleteTargetSkill
    ? mapEditorCategoryToAudienceCategory(deleteTargetSkill.category)
    : null;
  const deleteTargetAudienceMeta = deleteTargetAudienceCategory
    ? AUDIENCE_VISUAL_META[deleteTargetAudienceCategory]
    : null;
  const DeleteTargetIcon =
    deleteTargetSkill && deleteTargetAudienceCategory
      ? getMarketplaceSkillIcon({
          name: deleteTargetSkill.name,
          audienceCategory: deleteTargetAudienceCategory,
        })
      : FilePenLine;
  const deleteTargetStatusMeta = deleteTargetSkill
    ? getSkillStatusMeta(deleteTargetSkill.status)
    : null;
  const DeleteTargetStatusIcon = deleteTargetStatusMeta?.icon ?? FilePenLine;

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
    const scopedSkills = mySkills.filter((skill) =>
      mySkillStatusFilter === "all" ? true : skill.status === mySkillStatusFilter
    );

    if (!query) {
      return scopedSkills;
    }

    return scopedSkills.filter((skill) =>
      [skill.name, skill.description, skill.category, skill.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [deferredMySkillSearch, mySkillStatusFilter, mySkills]);

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

  const handlePublish = () => {
    if (!activeSkill) {
      return;
    }

    openReleaseDialog(activeSkill.id);
  };

  const buildMarketplaceSkillTemplate = useCallback(
    (skillToPublish: MySkill, currentMarketplace: SkillTemplate[]) => {
      const publishedId = skillToPublish.publishedTemplateId ?? `${skillToPublish.id}-published`;
      const existingTemplate = currentMarketplace.find((item) => item.id === publishedId);

      const publishedTemplate: SkillTemplate = {
        id: publishedId,
        name: skillToPublish.name,
        author: existingTemplate?.author ?? "我的Skills",
        publishedAt: formatNow(),
        publishedBy: CURRENT_SKILL_EDITOR,
        description: skillToPublish.description,
        category: skillToPublish.category,
        sourceType: existingTemplate?.sourceType ?? "org",
        audienceCategory: mapEditorCategoryToAudienceCategory(skillToPublish.category),
        isFavorite: existingTemplate?.isFavorite ?? false,
        tags: skillToPublish.tags,
        declaredDependencies: skillToPublish.declaredDependencies,
        downloads: existingTemplate?.downloads ?? 0,
        references: existingTemplate?.references ?? 0,
        referencedAgents: existingTemplate?.referencedAgents ?? [],
        boundToCEC:
          !isMvpMode &&
          (skillToPublish.linkedCECClaws.length > 0 || existingTemplate?.boundToCEC === true),
        files: cloneFiles(skillToPublish.files, `published-${publishedId}`),
      };

      return {
        publishedId,
        publishedTemplate,
      };
    },
    [isMvpMode]
  );

  const approveReviewingSkill = useCallback((skillId: string, expectedVersion: string) => {
    let approvedSkill: MySkill | null = null;

    setMySkills((current) => {
      const target = current.find((item) => item.id === skillId);
      if (!target || target.status !== "reviewing" || target.version !== expectedVersion) {
        return current;
      }

      approvedSkill = {
        ...target,
        status: "published",
        updatedAt: formatNow(),
        updatedBy: CURRENT_SKILL_EDITOR,
        dirty: false,
        hasPublishedHistory: true,
        publishedTemplateId: target.publishedTemplateId ?? `${target.id}-published`,
      };

      return [approvedSkill, ...current.filter((item) => item.id !== skillId)];
    });

    if (!approvedSkill) {
      return;
    }

    setMarketplaceSkills((current) => {
      const { publishedId, publishedTemplate } = buildMarketplaceSkillTemplate(
        approvedSkill,
        current
      );
      const exists = current.some((item) => item.id === publishedId);

      if (exists) {
        return current.map((item) => (item.id === publishedId ? publishedTemplate : item));
      }

      return [publishedTemplate, ...current];
    });

    toast.success(
      `审核通过，已上架：${approvedSkill.name} ${formatSkillVersion(approvedSkill.version)}`
    );
  }, [buildMarketplaceSkillTemplate]);

  useEffect(() => {
    const activeReviewKeys = new Set<string>();

    mySkills.forEach((skill) => {
      if (skill.status !== "reviewing") {
        return;
      }

      const reviewKey = `${skill.id}:${skill.version ?? "1.0"}`;
      activeReviewKeys.add(reviewKey);

      if (reviewApprovalTimersRef.current[reviewKey]) {
        return;
      }

      reviewApprovalTimersRef.current[reviewKey] = window.setTimeout(() => {
        approveReviewingSkill(skill.id, skill.version ?? "1.0");
        delete reviewApprovalTimersRef.current[reviewKey];
      }, 5000);
    });

    Object.entries(reviewApprovalTimersRef.current).forEach(([reviewKey, timerId]) => {
      if (activeReviewKeys.has(reviewKey)) {
        return;
      }

      window.clearTimeout(timerId);
      delete reviewApprovalTimersRef.current[reviewKey];
    });
  }, [approveReviewingSkill, mySkills]);

  const openReleaseDialog = (skillId: string) => {
    const skill = mySkills.find((item) => item.id === skillId);
    if (!skill) {
      return;
    }

    const nextMode = getSkillReleaseActionMeta(skill).mode;
    setUpdateTargetSkillId(skillId);
    setReleaseMode(nextMode);
    setUpdateVersionInput(
      nextMode === "publish"
        ? isValidVersion(skill.version ?? "") && compareVersions(skill.version ?? "1.0", "1.0") >= 0
          ? (skill.version ?? "1.0")
          : "1.0"
        : suggestNextVersion(skill.version)
    );
    setUpdateZipFile(null);
    setUpdateDialogOpen(true);
  };

  const handleSubmitRelease = () => {
    const skill = updateTargetSkill;
    if (!skill) {
      toast.error("未找到需要更新的 Skill");
      return;
    }

    if (!canSubmitRelease) {
      return;
    }

    const nextVersion = updateVersionInput.trim();

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
        hasPublishedHistory: hasPublishedHistory(target),
      };

      return [reviewingSkill, ...current.filter((item) => item.id !== skill.id)];
    });

    setUpdateDialogOpen(false);
    setUpdateTargetSkillId("");
    setUpdateVersionInput("");
    setUpdateZipFile(null);
    setReleaseMode("publish");

    if (releaseMode === "publish") {
      toast.success(`已提交发布审核：${skill.name} ${formatSkillVersion(nextVersion)}`);
      return;
    }

    toast.success(
      hasPublishedHistory(skill) && skill.status !== "published"
        ? `已提交更新发布审核：${skill.name} ${formatSkillVersion(nextVersion)}`
        : `已提交更新审核：${skill.name} ${formatSkillVersion(nextVersion)}`
    );
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

  const handleDownloadTemplate = async (template: SkillTemplate) => {
    try {
      await exportSkillArchive(`${template.name}.zip`, {
        name: template.name,
        description: template.description,
        category: template.category,
        tags: template.tags,
        declaredDependencies: template.declaredDependencies ?? [],
        files: template.files,
      });

      toast.success(`已下载 Skill：${template.name}`);
    } catch {
      toast.error("导出失败，请稍后重试");
    }
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
    setPendingFoundryTemplate({
      requestId: `${template.id}-${Date.now()}`,
      id: template.id,
      name: template.name,
      files: template.files.map((file) => ({
        path: file.path,
        content: file.content,
      })),
    });
    setActiveTab("foundry");
  };

  const handleExportMySkill = async (skillId: string) => {
    const skill = mySkills.find((item) => item.id === skillId);
    if (!skill) {
      return;
    }

    try {
      await exportSkillArchive(`${skill.name}.zip`, {
        name: skill.name,
        description: skill.description,
        category: skill.category,
        tags: skill.tags,
        declaredDependencies: skill.declaredDependencies,
        files: skill.files,
      });

      toast.success(`已导出 Skill：${skill.name}`);
    } catch {
      toast.error("导出失败，请稍后重试");
    }
  };

  const handleDeleteMySkill = (skillId: string) => {
    const skill = mySkills.find((item) => item.id === skillId);
    if (!skill) {
      return;
    }

    setDeleteTargetSkillId(skillId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteMySkill = () => {
    const skill = deleteTargetSkill;
    if (!skill) {
      return;
    }

    setMySkills((current) => {
      const nextSkills = current.filter((item) => item.id !== skill.id);
      const fallbackSkillId = nextSkills[0]?.id ?? "";

      setSelectedSkillId((currentSelected) => {
        if (currentSelected === ALL_SKILLS_VALUE) {
          return nextSkills.length > 0 ? ALL_SKILLS_VALUE : "";
        }

        return currentSelected === skill.id ? fallbackSkillId : currentSelected;
      });

      setFocusedSkillId((currentFocused) =>
        currentFocused === skill.id ? fallbackSkillId : currentFocused
      );

      return nextSkills;
    });

    setDeleteDialogOpen(false);
    setDeleteTargetSkillId("");
    toast.success(`已删除 Skill：${skill.name}`);
  };

  const handleOfflineMySkill = (skillId: string) => {
    const skill = mySkills.find((item) => item.id === skillId);
    if (!skill) {
      return;
    }

    if (skill.status !== "published") {
      toast.info("仅已上架的 Skill 支持下架");
      return;
    }

    const confirmed = window.confirm(`确认下架 Skill「${skill.name}」吗？下架后将不再对外展示。`);
    if (!confirmed) {
      return;
    }

    setMySkills((current) =>
      current.map((item) =>
        item.id === skillId
          ? {
              ...item,
              status: "draft",
              updatedAt: formatNow(),
              updatedBy: CURRENT_SKILL_EDITOR,
            }
          : item
      )
    );

    if (skill.publishedTemplateId) {
      setMarketplaceSkills((current) =>
        current.filter(
          (item) => !(item.id === skill.publishedTemplateId && item.sourceType === "org")
        )
      );
    }

    toast.success(`已下架 Skill：${skill.name}，当前已转为未发布`);
  };

  const resetImportDraft = () => {
    setImportMode("local");
    setImportUrlSource("github");
    setImportUrlValue("");
    setLocalImportFile(null);
    setLocalImportValidation({
      status: "idle",
      errors: [],
      fileName: "",
    });
    setImportDependencyEnabled(false);
    setSelectedDependencyIds([]);
    setDependencySearch("");
    setDependencyPopoverOpen(false);
    setRemoteImportLoading(false);
  };

  const openImportDialogForMode = (mode: SkillImportEntryMode) => {
    if (mode === "local") {
      setImportMode("local");
    } else {
      setImportMode("url");
      setImportUrlSource(mode);
    }
    setImportDialogOpen(true);
  };

  const finalizeImportedSkill = (importedSkill: MySkill, successMessage: string) => {
    setMySkills((current) => [importedSkill, ...current]);
    setMySkillStatusFilter("all");
    setMySkillSearch("");
    setSelectedSkillId(importedSkill.id);
    setFocusedSkillId(importedSkill.id);
    setActiveTab("mine");
    setImportDialogOpen(false);
    resetImportDraft();
    toast.success(successMessage);
  };

  const buildImportedSkillFromUrl = (
    urlValue: string,
    source: SkillImportUrlSource,
    declaredDependencies: SkillDependency[]
  ) => {
    const parsedUrl = new URL(urlValue);
    const sourceLabel = getImportUrlSourceLabel(source);
    const displayName = uniqueName(
      extractSkillNameFromUrl(parsedUrl, source),
      mySkills.map((skill) => skill.name)
    );
    const filePrefix = `import-url-${slugify(displayName)}`;

    return createMySkill({
      id: `${slugify(displayName)}-${Date.now()}`,
      name: displayName,
      description: `从${sourceLabel}链接导入的 Skill 草稿，可继续补充说明、模板和脚本内容。`,
      category: "通用",
      tags: [sourceLabel, "URL导入"],
      declaredDependencies,
      source: "imported",
      files: [
        createFile(
          "SKILL.md",
          `---
name: ${slugify(displayName)}
description: "Imported from ${sourceLabel}"
source_url: "${parsedUrl.toString()}"
---

# ${displayName}

## 来源
- 类型：${sourceLabel}
- 链接：${parsedUrl.toString()}

## 后续补充
- 在这里完善技能描述
- 补充触发条件与输入输出要求
- 增加模板、脚本或参考资料
`,
          filePrefix
        ),
        createFile(
          "SOURCE.md",
          `# 来源信息

- 来源类型：${sourceLabel}
- 导入链接：${parsedUrl.toString()}
- 导入时间：${formatNow()}

请在导入后校验目录结构、说明文档和脚本内容是否完整。
`,
          filePrefix
        ),
      ],
    });
  };

  const handleLocalImportFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    const importFile = selectedFiles[0];
    setLocalImportFile(importFile);
    setLocalImportValidation({
      status: "validating",
      errors: [],
      fileName: importFile.name,
    });

    try {
      const validationResult = await validateLocalImportArchive(importFile);
      setLocalImportValidation(validationResult);
    } finally {
      event.target.value = "";
    }
  };

  const handleConfirmLocalImport = () => {
    if (localImportValidation.status !== "valid" || !localImportValidation.manifest || !localImportValidation.files) {
      return;
    }

    const name = uniqueName(
      localImportValidation.manifest.name,
      mySkills.map((skill) => skill.name)
    );

    const importedSkill = createMySkill({
      id: `${slugify(localImportValidation.manifest.name)}-${Date.now()}`,
      name,
      description: localImportValidation.manifest.description,
      category: localImportValidation.category ?? "通用",
      tags: localImportValidation.tags ?? ["压缩包导入"],
      declaredDependencies: importDependencyEnabled
        ? [
            ...(localImportValidation.declaredDependencies ?? []),
            ...selectedDeclaredDependencies.filter(
              (dependency) =>
                !(localImportValidation.declaredDependencies ?? []).some(
                  (existing) => existing.id === dependency.id
                )
            ),
          ]
        : (localImportValidation.declaredDependencies ?? []),
      source: "imported",
      files: localImportValidation.files.map((file, index) =>
        createFile(file.path || `file-${index + 1}.md`, file.content, "import-zip")
      ),
    });

    finalizeImportedSkill(importedSkill, `已导入 Skill：${importedSkill.name}`);
  };

  const handleImportFromUrl = async () => {
    const sourceLabel = getImportUrlSourceLabel(importUrlSource);

    if (!normalizedImportUrl) {
      toast.error(
        importUrlSource === "github"
          ? "请输入合法的 GitHub 仓库地址"
          : `请输入合法的 ${sourceLabel} Skill 链接`
      );
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(normalizedImportUrl);
    } catch {
      toast.error(
        importUrlSource === "github"
          ? "请输入合法的 GitHub 仓库地址"
          : `请输入合法的 ${sourceLabel} Skill 链接`
      );
      return;
    }

    if (!inferredImportUrlSource || inferredImportUrlSource !== importUrlSource) {
      toast.error(
        importUrlSource === "github"
          ? "请输入合法的 GitHub 仓库地址"
          : `请输入合法的 ${sourceLabel} Skill 链接`
      );
      return;
    }

    if (!isValidSkillImportUrlPath(parsedUrl, importUrlSource)) {
      toast.error(
        importUrlSource === "github"
          ? "请输入合法的 GitHub 仓库地址"
          : `请输入合法的 ${sourceLabel} Skill 链接`
      );
      return;
    }

    setRemoteImportLoading(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 650));

      const inaccessibleHint = /private|not[-_]?found|404/i.test(parsedUrl.toString());
      if (inaccessibleHint) {
        toast.error(
          importUrlSource === "github"
            ? "无法访问该仓库，请确保地址正确且状态为公开"
            : `无法访问该 Skill，请确保链接正确且可公开访问`
        );
        return;
      }

      const importedSkill = buildImportedSkillFromUrl(
        normalizedImportUrl,
        importUrlSource,
        importDependencyEnabled ? selectedDeclaredDependencies : []
      );

      finalizeImportedSkill(
        importedSkill,
        `已从 ${getImportUrlSourceLabel(importUrlSource)} 导入 Skill：${importedSkill.name}`
      );
    } finally {
      setRemoteImportLoading(false);
    }
  };

  const toggleDependencySelection = (dependencyId: string) => {
    setSelectedDependencyIds((current) =>
      current.includes(dependencyId)
        ? current.filter((item) => item !== dependencyId)
        : [...current, dependencyId]
    );
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
            <div className="grid items-start gap-3 xl:grid-cols-3 2xl:grid-cols-4">
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

                    <div className="relative flex flex-col">
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
                              {skill.declaredDependencies?.length ? (
                                <>
                                  <span className="text-slate-300">·</span>
                                  <TooltipProvider delayDuration={120}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-violet-50/85 px-2 py-0.5 text-[11px] font-medium text-violet-700 transition-colors hover:bg-violet-100"
                                        >
                                          <Boxes className="h-3 w-3" />
                                          依赖声明
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        align="start"
                                        className="max-w-[260px] rounded-2xl border-white/90 bg-white/96 px-3 py-3 text-slate-600 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]"
                                      >
                                        <div className="space-y-2">
                                          <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                                            依赖工具
                                          </div>
                                          <div className="grid gap-1">
                                            {skill.declaredDependencies.map((dependency) => (
                                              <div
                                                key={`${skill.id}-${dependency.id}`}
                                                className="rounded-xl bg-slate-50/90 px-2.5 py-1.5 text-[12px] text-slate-700"
                                              >
                                                {dependency.name}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </>
                              ) : null}
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

                      <div className="mt-4 border-t border-slate-200/60 pt-3">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200/70 bg-white/65 px-2.5 py-1">
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
                                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200/70 bg-white/65 px-2.5 py-1 text-[11px] text-slate-500 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-700"
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
                          <div className="ml-auto flex items-center gap-1.5">
                            {!isMvpMode ? (
                              <Button
                                variant="outline"
                                className="h-9 rounded-2xl border-white/90 bg-white/82 px-3 text-[13px] text-slate-700 hover:bg-white"
                                onClick={() => handleAddToSkillsFoundry(skill)}
                              >
                                <FolderPlus className="h-4 w-4" />
                                加入Foundry
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

        <TabsContent
          value="foundry"
          forceMount
          className={cn("space-y-4", activeTab !== "foundry" && "hidden", isMvpMode && "hidden")}
        >
          <SkillsFoundryTab
            pendingTemplate={pendingFoundryTemplate}
            onPendingTemplateHandled={() => setPendingFoundryTemplate(null)}
          />
        </TabsContent>

        <TabsContent value="mine" className="space-y-4">
          <input
            ref={importInputRef}
            type="file"
            accept=".zip,.skill,application/zip"
            className="hidden"
            onChange={handleLocalImportFileSelection}
          />

          <Dialog
            open={importDialogOpen}
            onOpenChange={(open) => {
              setImportDialogOpen(open);
              if (!open) {
                resetImportDraft();
              }
            }}
          >
            <DialogContent className="max-w-[900px] rounded-[30px] border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] p-0 shadow-[0_34px_72px_-36px_rgba(15,23,42,0.36)]">
              <div className="overflow-hidden rounded-[30px]">
                <div className="border-b border-slate-200/70 bg-[linear-gradient(135deg,rgba(240,249,255,0.94),rgba(255,255,255,0.98)_52%,rgba(236,253,245,0.9))] px-6 py-5">
                  <DialogHeader className="gap-2 text-left">
                    <DialogTitle className="skills-display text-[1.6rem] text-slate-950">
                      导入Skills
                    </DialogTitle>
                    <DialogDescription className="max-w-2xl text-sm leading-6 text-slate-500">
                      支持从本地压缩包导入，也支持通过 URL 引入 GitHub、skills.sh 或 Clawhub 上的 Skill 资产。
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="space-y-5 px-6 py-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/92 px-3 py-2 text-xs font-medium text-slate-600 shadow-[0_14px_26px_-24px_rgba(15,23,42,0.18)]">
                    {importMode === "local" ? (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        本地.zip导入
                      </>
                    ) : (
                      <>
                        {importUrlSource === "github" ? (
                          <Github className="h-3.5 w-3.5" />
                        ) : importUrlSource === "skills.sh" ? (
                          <Sparkles className="h-3.5 w-3.5" />
                        ) : (
                          <Bot className="h-3.5 w-3.5" />
                        )}
                        {importUrlSource === "github"
                          ? "从Github导入"
                          : importUrlSource === "skills.sh"
                            ? "从skill.sh导入"
                            : "从Clawhub导入"}
                      </>
                    )}
                  </div>

                  {importMode === "local" ? (
                    <div className="space-y-4">
                      <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/88 p-5">
                        <div className="text-sm font-semibold text-slate-900">导入说明</div>
                        <div className="mt-3 space-y-3 text-sm leading-6 text-slate-500">
                          <p>1. 上传文件需为 `.zip` 或 `.skill` 格式压缩包，且文件大小不超过 100MB。</p>
                          <p>2. 压缩包根目录下必须包含 `SKILL.md` 文件，且其中需使用 YAML frontmatter 声明 `name` 和 `description`。</p>
                          <p>3. 所有阻断项校验通过后，才可点击【确认导入】生成 Skill 草稿。</p>
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.18)]">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-sky-100/80 bg-sky-50/90 text-sky-700">
                            <Upload className="h-5 w-5" />
                          </div>
                          <div className="space-y-2">
                            <div className="text-base font-semibold text-slate-950">导入文件</div>
                            <div className="text-sm leading-6 text-slate-500">
                              支持导入 `.zip` 压缩包
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 rounded-[24px] border border-dashed border-slate-200/90 bg-[linear-gradient(135deg,rgba(248,250,252,0.95),rgba(255,255,255,0.92))] p-6">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-slate-900">
                                {localImportFile ? localImportFile.name : "尚未选择导入文件"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {localImportValidation.status === "validating"
                                  ? "正在校验压缩包结构和 SKILL.md 内容..."
                                  : localImportValidation.status === "valid"
                                    ? "校验通过，可确认导入"
                                    : localImportValidation.status === "invalid"
                                      ? localImportValidation.errors[0]
                                      : "请先选择本地 Skill 压缩包"}
                              </div>
                            </div>
                            <Button
                              className="h-11 rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-800"
                              onClick={() => importInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4" />
                              选择本地压缩包
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div
                            className={cn(
                              "rounded-[20px] border px-4 py-3",
                              localImportValidation.status === "valid"
                                ? "border-emerald-200/80 bg-emerald-50/70"
                                : "border-slate-200/80 bg-slate-50/70"
                            )}
                          >
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                              {localImportValidation.status === "valid" ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Boxes className="h-4 w-4 text-slate-500" />
                              )}
                              压缩包校验
                            </div>
                            <div className="mt-1 text-xs leading-5 text-slate-500">
                              格式、大小、可解压性
                            </div>
                          </div>
                          <div
                            className={cn(
                              "rounded-[20px] border px-4 py-3",
                              localImportValidation.status === "valid"
                                ? "border-emerald-200/80 bg-emerald-50/70"
                                : "border-slate-200/80 bg-slate-50/70"
                            )}
                          >
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                              {localImportValidation.status === "valid" ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <FileText className="h-4 w-4 text-slate-500" />
                              )}
                              包结构校验
                            </div>
                            <div className="mt-1 text-xs leading-5 text-slate-500">
                              根目录存在 SKILL.md
                            </div>
                          </div>
                          <div
                            className={cn(
                              "rounded-[20px] border px-4 py-3",
                              localImportValidation.status === "valid"
                                ? "border-emerald-200/80 bg-emerald-50/70"
                                : "border-slate-200/80 bg-slate-50/70"
                            )}
                          >
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                              {localImportValidation.status === "valid" ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <ScrollText className="h-4 w-4 text-slate-500" />
                              )}
                              SKILL.md 校验
                            </div>
                            <div className="mt-1 text-xs leading-5 text-slate-500">
                              YAML 规范、name、description
                            </div>
                          </div>
                        </div>

                        {localImportValidation.status === "valid" && localImportValidation.manifest ? (
                          <div className="mt-4 rounded-[22px] border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
                            <div className="font-medium">{localImportValidation.manifest.name}</div>
                            <div className="mt-1 text-xs leading-5 text-emerald-700">
                              {localImportValidation.manifest.description}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/88 p-5">
                        <div className="text-sm font-semibold text-slate-900">
                          {importUrlSource === "github"
                            ? "支持从公开的 GitHub 仓库直接导入 Skill。"
                            : importUrlSource === "skills.sh"
                              ? "输入 skills.sh Skill 链接后，系统会先校验链接合法性与可访问性，再解析 Skill 内容。"
                              : "输入 Clawhub Skill 链接后，系统会先校验链接合法性与可访问性，再解析 Skill 内容。"}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-500">
                          解析成功后，会继续校验 `SKILL.md`、YAML frontmatter 以及 `name / description` 字段。
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.18)]">
                        <div className="space-y-2">
                          <Label htmlFor="skill-import-url">导入链接</Label>
                          <Input
                            id="skill-import-url"
                            value={importUrlValue}
                            onChange={(event) => setImportUrlValue(event.target.value)}
                            placeholder={
                              importUrlSource === "github"
                                ? "http://github.com/username/this-is-a-skill"
                                : importUrlSource === "skills.sh"
                                  ? "https://skills.sh/org/repo/skill"
                                  : "https://clawhub.ai/author/skill"
                            }
                            aria-invalid={Boolean(importUrlError)}
                            className={cn(
                              "h-11 rounded-2xl bg-white/95",
                              importUrlError
                                ? "border-rose-200/90 text-rose-700 focus-visible:border-rose-300 focus-visible:ring-rose-100"
                                : "border-slate-200/80"
                            )}
                          />
                          <p
                            className={cn(
                              "text-xs",
                              importUrlError ? "font-medium text-rose-600" : "text-slate-500"
                            )}
                          >
                            {importUrlError ||
                              (importUrlSource === "github"
                                ? "仅接受仓库地址，不支持主页、issue、pull request 或子路径链接。"
                                : `当前将按 ${getImportUrlSourceLabel(importUrlSource)} 来源解析 Skill，并复用本地导入的结构校验规则。`)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.18)]">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={importDependencyEnabled}
                        onCheckedChange={(checked) => setImportDependencyEnabled(Boolean(checked))}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-sm font-semibold text-slate-900">Skill 依赖 MCP 或 插件</div>
                        <div className="text-xs leading-5 text-slate-500">
                          非必填。勾选后可声明 Skill 依赖的 MCP 或插件，后续会在广场卡片上展示“依赖声明”提示。
                        </div>
                      </div>
                    </div>

                    {importDependencyEnabled ? (
                      <div className="mt-4 space-y-3">
                        <Popover open={dependencyPopoverOpen} onOpenChange={setDependencyPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-11 w-full justify-between rounded-2xl border-slate-200/80 bg-white/95 px-4 text-slate-700 hover:bg-slate-50"
                            >
                              <span className="truncate">
                                {selectedDeclaredDependencies.length > 0
                                  ? `已选择 ${selectedDeclaredDependencies.length} 个依赖工具`
                                  : "选择依赖工具"}
                              </span>
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            className="w-[420px] rounded-[20px] border-slate-200/80 bg-white/96 p-3"
                          >
                            <div className="space-y-3">
                              <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                  value={dependencySearch}
                                  onChange={(event) => setDependencySearch(event.target.value)}
                                  placeholder="搜索 MCP 或插件"
                                  className="h-10 rounded-2xl border-slate-200/80 bg-slate-50/80 pl-10"
                                />
                              </div>
                              <div className="max-h-[260px] space-y-1 overflow-y-auto">
                                {filteredDependencyOptions.map((item) => {
                                  const checked = selectedDependencyIds.includes(item.id);

                                  return (
                                    <div
                                      key={item.id}
                                      role="button"
                                      tabIndex={0}
                                      onClick={() => toggleDependencySelection(item.id)}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                          event.preventDefault();
                                          toggleDependencySelection(item.id);
                                        }
                                      }}
                                      className={cn(
                                        "flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors outline-none",
                                        "focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2",
                                        checked
                                          ? "border-sky-200/80 bg-sky-50/85"
                                          : "border-slate-200/70 bg-white hover:bg-slate-50"
                                      )}
                                    >
                                      <Checkbox checked={checked} className="pointer-events-none" />
                                      <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-slate-900">{item.name}</div>
                                        <div className="text-xs text-slate-500">
                                          {item.type === "mcp" ? "MCP" : "插件"}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>

                        {selectedDeclaredDependencies.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedDeclaredDependencies.map((dependency) => (
                              <span
                                key={dependency.id}
                                className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/85 px-3 py-1 text-xs font-medium text-violet-700"
                              >
                                <span>{dependency.name}</span>
                                <button
                                  type="button"
                                  onClick={() => toggleDependencySelection(dependency.id)}
                                  className="rounded-full text-violet-500 transition-colors hover:text-violet-700"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-slate-200/70 pt-1">
                    <Button
                      variant="outline"
                      className="rounded-2xl border-slate-200/80 bg-white hover:bg-slate-50"
                      onClick={() => setImportDialogOpen(false)}
                    >
                      取消
                    </Button>
                    {importMode === "local" ? (
                      <Button
                        className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                        disabled={!canConfirmLocalImport}
                        onClick={handleConfirmLocalImport}
                      >
                        {localImportValidation.status === "validating" ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        确认导入
                      </Button>
                    ) : (
                      <Button
                        className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                        disabled={!normalizedImportUrl || remoteImportLoading}
                        onClick={handleImportFromUrl}
                      >
                        {remoteImportLoading ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        导入
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {useUnifiedSkillsManagementView ? (
            <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,250,252,0.92))] shadow-[0_28px_60px_-46px_rgba(15,23,42,0.3)] backdrop-blur-sm">
              <div aria-hidden className="absolute inset-0">
                <div className="skills-ambient-orb absolute left-[-3rem] top-0 h-24 w-24 rounded-full bg-cyan-200/24 blur-3xl" />
                <div className="skills-ambient-orb skills-ambient-orb-delay absolute right-[-2rem] top-8 h-28 w-28 rounded-full bg-indigo-200/18 blur-3xl" />
              </div>

              <div className="relative px-5 py-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h2 className="skills-display text-[1.75rem] text-slate-950">skills管理</h2>
                      <Badge
                        variant="outline"
                        className="border-slate-200/80 bg-slate-50/90 text-slate-600"
                      >
                        {filteredMySkills.length} 项
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="min-w-[52px] text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                        状态
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {MY_SKILL_STATUS_FILTERS.map((filter) => (
                          <button
                            key={filter.value}
                            type="button"
                            onClick={() => setMySkillStatusFilter(filter.value)}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all duration-200",
                              getMySkillStatusFilterClass(
                                filter.value,
                                mySkillStatusFilter === filter.value
                              )
                            )}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 xl:w-auto xl:min-w-[420px]">
                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="rounded-2xl border-white bg-white/88 shadow-sm hover:bg-white"
                          >
                            <Upload className="h-4 w-4" />
                            导入Skills
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-[260px] rounded-[18px] border-slate-200/80 bg-white/96 p-2 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.28)]"
                        >
                          {IMPORT_ENTRY_OPTIONS.map((option) => {
                            const Icon = option.icon;

                            return (
                              <DropdownMenuItem
                                key={option.value}
                                className="cursor-pointer rounded-[12px] px-3 py-3"
                                onSelect={() => openImportDialogForMode(option.value)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-slate-200/80 bg-slate-50/90 text-slate-700">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-sm font-medium text-slate-900">{option.label}</div>
                                    <div className="text-xs leading-5 text-slate-500">{option.hint}</div>
                                  </div>
                                </div>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        value={mySkillSearch}
                        onChange={(event) => setMySkillSearch(event.target.value)}
                        placeholder="搜索 skills管理"
                        className="h-10 rounded-2xl border-slate-200/90 bg-slate-50/96 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_14px_28px_-24px_rgba(15,23,42,0.16)] focus-visible:border-sky-200 focus-visible:ring-sky-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/92 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.2)]">
                  <Table className="min-w-[1120px]">
                    <TableHeader className="bg-slate-50/92">
                      <TableRow className="border-slate-200/80 hover:bg-slate-50/92">
                        <TableHead className="h-11 px-5 text-sm font-medium text-slate-700">名称</TableHead>
                        <TableHead className="h-11 px-5 text-sm font-medium text-slate-700">创建人</TableHead>
                        <TableHead className="h-11 px-5 text-sm font-medium text-slate-700">发布状态</TableHead>
                        <TableHead className="h-11 px-5 text-sm font-medium text-slate-700">描述</TableHead>
                        <TableHead className="h-11 px-5 text-sm font-medium text-slate-700">更新时间</TableHead>
                        <TableHead className="h-11 px-5 text-sm font-medium text-slate-700">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMySkills.length === 0 ? (
                        <TableRow className="border-0 hover:bg-transparent">
                          <TableCell colSpan={6} className="px-6 py-16 text-center">
                            <div className="mx-auto max-w-md space-y-3">
                              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[10px] border border-slate-200 bg-slate-50 text-slate-500">
                                <Search className="h-5 w-5" />
                              </div>
                              <div className="text-lg font-semibold text-slate-900">暂无匹配结果</div>
                              <p className="text-sm leading-6 text-slate-500">
                                没有匹配的 Skill，试试换个关键词，或者导入一个本地 Skill。
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMySkills.map((skill) => {
                          const audienceCategory = mapEditorCategoryToAudienceCategory(skill.category);
                          const SkillIcon = getMarketplaceSkillIcon({
                            name: skill.name,
                            audienceCategory,
                          });
                          const statusMeta = getSkillStatusMeta(skill.status);
                          const StatusIcon = statusMeta.icon;
                          const releaseAction = getSkillReleaseActionMeta(skill);
                          const ReleaseActionIcon = releaseAction.icon;
                          const statusVersionLabel = skill.version
                            ? skill.status === "draft" && hasPublishedHistory(skill)
                              ? `历史 ${formatSkillVersion(skill.version)}`
                              : formatSkillVersion(skill.version)
                            : null;

                          return (
                            <TableRow
                              key={skill.id}
                              className="border-slate-200/80 bg-white hover:bg-slate-50/45"
                            >
                              <TableCell className="px-5 py-4 align-top whitespace-normal">
                                <div className="flex items-start gap-4">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-slate-200/80 bg-slate-50/95 text-slate-700">
                                    <SkillIcon className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 space-y-1">
                                    <div className="skills-display text-[15px] font-medium leading-6 text-slate-950">
                                      {skill.name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      Skill ID：{skill.id}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="px-5 py-4 align-top whitespace-normal">
                                <div className="space-y-1">
                                  <div className="text-sm font-medium text-slate-900">{skill.createdBy}</div>
                                  <div className="text-xs text-slate-500">
                                    {skill.source === "template"
                                      ? "模板导入"
                                      : skill.source === "imported"
                                        ? "本地导入"
                                        : "空白创建"}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="px-5 py-4 align-top whitespace-nowrap">
                                <div className="inline-flex items-center gap-2 text-xs">
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
                                      skill.status === "published"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : skill.status === "reviewing"
                                          ? "bg-sky-50 text-sky-700"
                                          : skill.status === "reviewFailed"
                                            ? "bg-rose-50 text-rose-700"
                                            : "bg-amber-50 text-amber-700"
                                    )}
                                  >
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    {statusMeta.label}
                                  </span>
                                  {statusVersionLabel ? (
                                    <span className="whitespace-nowrap text-xs font-medium text-slate-500">
                                      {statusVersionLabel}
                                    </span>
                                  ) : null}
                                </div>
                              </TableCell>

                              <TableCell className="px-5 py-4 align-top whitespace-normal">
                                <p className="line-clamp-2 max-w-[520px] text-sm leading-6 text-slate-600">
                                  {skill.description}
                                </p>
                              </TableCell>

                              <TableCell className="px-5 py-4 align-top whitespace-normal">
                                <div className="space-y-1">
                                  <div className="text-sm font-medium text-slate-900">{skill.updatedAt}</div>
                                  <div className="text-xs text-slate-500">更新人：{skill.updatedBy}</div>
                                </div>
                              </TableCell>

                              <TableCell className="px-5 py-4 align-top whitespace-normal">
                                <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
                                  <Button
                                    variant="ghost"
                                    className="h-8 rounded-lg px-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                                    onClick={() => handleExportMySkill(skill.id)}
                                  >
                                    <Download className="h-4 w-4" />
                                    导出
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="h-8 rounded-lg px-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:text-slate-300"
                                    onClick={() => openReleaseDialog(skill.id)}
                                    disabled={releaseAction.disabled}
                                  >
                                    <ReleaseActionIcon className="h-4 w-4" />
                                    {releaseAction.label}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="h-8 rounded-lg px-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                                    onClick={() => handleDeleteMySkill(skill.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    删除
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="h-8 rounded-lg px-2 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:text-slate-300"
                                    onClick={() => handleOfflineMySkill(skill.id)}
                                    disabled={skill.status !== "published"}
                                  >
                                    <X className="h-4 w-4" />
                                    下架
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Dialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                  setDeleteDialogOpen(open);
                  if (!open) {
                    setDeleteTargetSkillId("");
                  }
                }}
              >
                <DialogContent
                  showCloseButton={false}
                  className="max-w-[560px] border-white/90 bg-transparent p-0 shadow-none"
                >
                  <div className="relative overflow-hidden rounded-[30px] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] shadow-[0_34px_70px_-38px_rgba(15,23,42,0.34)]">
                    <div aria-hidden className="absolute inset-0">
                      <div className="skills-ambient-orb absolute left-[-2rem] top-[-2rem] h-24 w-24 rounded-full bg-rose-200/30 blur-3xl" />
                      <div className="skills-ambient-orb skills-ambient-orb-delay absolute right-[-1rem] top-10 h-28 w-28 rounded-full bg-amber-200/20 blur-3xl" />
                    </div>

                    <div className="relative border-b border-slate-200/70 bg-[linear-gradient(135deg,rgba(255,241,242,0.92),rgba(255,255,255,0.96)_58%,rgba(255,247,237,0.88))] px-6 py-5">
                      <DialogClose asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-4 top-4 h-9 w-9 rounded-2xl text-slate-500 hover:bg-white/70 hover:text-slate-900"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </DialogClose>

                      <DialogHeader className="max-w-[440px] gap-2 text-left">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-200/80 bg-white/78 px-3 py-1 text-[12px] font-semibold text-rose-700 shadow-[0_14px_26px_-22px_rgba(244,63,94,0.35)]">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          高风险操作
                        </div>
                        <DialogTitle className="skills-display text-[1.6rem] leading-tight text-slate-950">
                          删除Skill
                        </DialogTitle>
                        <DialogDescription className="text-sm leading-6 text-slate-500">
                          删除后，该Skill不可找回，不可恢复，是否确认？（建议您删除前自行导出.zip保留备份）
                        </DialogDescription>
                      </DialogHeader>
                    </div>

                    <div className="relative space-y-4 px-6 py-5">
                      {deleteTargetSkill ? (
                        <>
                          <div className="overflow-hidden rounded-[26px] border border-white/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.88))] shadow-[0_18px_36px_-28px_rgba(15,23,42,0.22)]">
                            <div className="flex items-start gap-4 px-4 py-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-rose-100/80 bg-white/88 text-slate-700 shadow-[0_14px_30px_-26px_rgba(15,23,42,0.3)]">
                                <DeleteTargetIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="skills-display min-w-0 flex-1 text-[1.18rem] leading-7 text-slate-950">
                                    <span className="block truncate">{deleteTargetSkill.name}</span>
                                  </div>
                                  {deleteTargetAudienceMeta ? (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold",
                                        deleteTargetAudienceMeta.badgeClass
                                      )}
                                    >
                                      {deleteTargetAudienceMeta.label}
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-500">
                                  {deleteTargetStatusMeta ? (
                                    <span
                                      className={cn(
                                        "inline-flex items-center gap-1.5 font-medium",
                                        deleteTargetStatusMeta.className
                                      )}
                                    >
                                      <DeleteTargetStatusIcon className="h-3.5 w-3.5" />
                                      {deleteTargetStatusMeta.label}
                                    </span>
                                  ) : null}
                                  <span className="text-slate-300">·</span>
                                  <span>
                                    最近更新于 {deleteTargetSkill.updatedAt}（{deleteTargetSkill.updatedBy}）
                                  </span>
                                </div>
                                <p className="line-clamp-2 text-[13px] leading-6 text-slate-600">
                                  {deleteTargetSkill.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-[24px] border border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,241,242,0.82),rgba(255,255,255,0.95))] px-4 py-4">
                            <div className="text-sm font-semibold text-slate-900">删除后将同步移除</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <div className="rounded-full border border-white/90 bg-white/90 px-3 py-1.5 text-xs text-slate-600">
                                当前 Skill 文件
                              </div>
                              <div className="rounded-full border border-white/90 bg-white/90 px-3 py-1.5 text-xs text-slate-600">
                                本地版本记录
                              </div>
                              <div className="rounded-full border border-white/90 bg-white/90 px-3 py-1.5 text-xs text-slate-600">
                                管理页展示记录
                              </div>
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>

                    <DialogFooter className="border-t border-slate-200/70 px-6 py-4">
                      <DialogClose asChild>
                        <Button
                          variant="outline"
                          className="rounded-2xl border-slate-200/80 bg-white hover:bg-slate-50"
                        >
                          取消
                        </Button>
                      </DialogClose>
                      <Button
                        className="rounded-2xl bg-rose-600 text-white shadow-[0_20px_34px_-22px_rgba(225,29,72,0.65)] hover:bg-rose-500"
                        onClick={handleConfirmDeleteMySkill}
                      >
                        <Trash2 className="h-4 w-4" />
                        确认
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog
                open={updateDialogOpen}
                onOpenChange={(open) => {
                  setUpdateDialogOpen(open);
                  if (!open) {
                    setUpdateTargetSkillId("");
                    setUpdateVersionInput("");
                    setUpdateZipFile(null);
                    setReleaseMode("publish");
                  }
                }}
              >
                <DialogContent className="rounded-[28px] border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] p-0 shadow-[0_30px_60px_-32px_rgba(15,23,42,0.35)]">
                  <div className="overflow-hidden rounded-[28px]">
                    <div className="border-b border-slate-200/70 bg-[linear-gradient(135deg,rgba(240,249,255,0.95),rgba(255,255,255,0.96)_55%,rgba(236,253,245,0.9))] px-6 py-5">
                      <DialogHeader className="gap-1 text-left">
                        <DialogTitle className="skills-display text-[1.5rem] text-slate-950">
                          {releaseMode === "publish"
                            ? "提交 Skill 发布"
                            : hasPublishedHistory(
                                updateTargetSkill ?? {
                                  status: "draft",
                                  publishedTemplateId: undefined,
                                  hasPublishedHistory: false,
                                }
                              )
                              && updateTargetSkill?.status !== "published"
                              ? "提交 Skill 更新发布"
                              : "提交 Skill 更新"}
                        </DialogTitle>
                        <DialogDescription className="text-sm leading-6 text-slate-500">
                          {releaseMode === "publish"
                            ? "填写首次发布版本号。提交后会进入审核中状态。"
                            : "上传新的 zip 包，并填写高于当前版本的新版本号。提交后会进入审核中状态。"}
                        </DialogDescription>
                      </DialogHeader>
                    </div>

                    <div className="space-y-5 px-6 py-5">
                      {releaseMode === "update" ? (
                        <div className="space-y-2">
                          <Label htmlFor="skill-update-zip">更新包</Label>
                          <input
                            ref={updateZipInputRef}
                            id="skill-update-zip"
                            type="file"
                            accept=".zip,application/zip"
                            onChange={(event) => setUpdateZipFile(event.target.files?.[0] ?? null)}
                            className="hidden"
                          />
                          <div className="flex min-h-[56px] items-center gap-3 rounded-[22px] border border-slate-200/80 bg-white/96 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                            <Button
                              type="button"
                              className="h-9 shrink-0 rounded-xl bg-slate-950 px-4 text-sm text-white hover:bg-slate-800"
                              onClick={() => updateZipInputRef.current?.click()}
                            >
                              选择文件
                            </Button>
                            <div className="min-w-0 flex-1 text-sm">
                              <span className={cn("block truncate", updateZipFile ? "text-slate-700" : "text-slate-400")}>
                                {updateZipFile ? updateZipFile.name : "未选择 zip 包"}
                              </span>
                            </div>
                          </div>
                          <p className={cn("text-xs", updateZipError ? "text-rose-600" : "text-slate-500")}>
                            {updateZipError || "请上传新的 Skill zip 包"}
                          </p>
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        <Label htmlFor="skill-update-version">新版本号</Label>
                        <Input
                          id="skill-update-version"
                          value={updateVersionInput}
                          onChange={(event) => setUpdateVersionInput(event.target.value)}
                          placeholder="例如 1.1 或 1.1.2"
                          aria-invalid={Boolean(updateVersionError)}
                          className={cn(
                            "h-11 rounded-2xl bg-white/95",
                            updateVersionError
                              ? "border-rose-200/90 text-rose-700 focus-visible:border-rose-300 focus-visible:ring-rose-100"
                              : "border-slate-200/80"
                          )}
                        />
                        <p className={cn("text-xs", updateVersionError ? "font-medium text-rose-600" : "text-slate-500")}>
                          {updateVersionError ||
                            (releaseMode === "publish"
                              ? `默认从 ${formatSkillVersion("1.0")} 开始，也支持手动填写更高版本号。`
                              : `当前版本 ${formatSkillVersion(updateCurrentVersion)}，支持 \`1.1\` 或 \`1.1.2\` 这类格式。`)}
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
                          setReleaseMode("publish");
                        }}
                      >
                        取消
                      </Button>
                      <Button
                        className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                        onClick={handleSubmitRelease}
                        disabled={!canSubmitRelease}
                      >
                        {releaseMode === "publish" ? (
                          <Rocket className="h-4 w-4" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {releaseMode === "publish"
                          ? "提交发布"
                          : hasPublishedHistory(
                              updateTargetSkill ?? {
                                status: "draft",
                                publishedTemplateId: undefined,
                                hasPublishedHistory: false,
                              }
                            )
                            && updateTargetSkill?.status !== "published"
                            ? "提交更新发布"
                            : "提交更新"}
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
                      skills管理
                    </CardTitle>
                    <CardDescription className="max-w-2xl leading-6 text-slate-500">
                      支持导入本地压缩包或 URL 链接，继续编辑文件内容、保存修改，并发布到 Skills 广场。
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="rounded-2xl border-white bg-white/85 shadow-sm hover:bg-white"
                        >
                          <Upload className="h-4 w-4" />
                          导入Skills
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-[260px] rounded-[18px] border-slate-200/80 bg-white/96 p-2"
                      >
                        {IMPORT_ENTRY_OPTIONS.map((option) => {
                          const Icon = option.icon;

                          return (
                            <DropdownMenuItem
                              key={option.value}
                              className="cursor-pointer rounded-[12px] px-3 py-3"
                              onSelect={() => openImportDialogForMode(option.value)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-slate-200/80 bg-slate-50/90 text-slate-700">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="text-sm font-medium text-slate-900">{option.label}</div>
                                  <div className="text-xs leading-5 text-slate-500">{option.hint}</div>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                  还没有任何 Skill，先导入一个本地压缩包或 URL 链接吧。
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
