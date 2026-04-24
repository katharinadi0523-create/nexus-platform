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
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
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
import { MARKETPLACE_SKILL_DEPENDENCY_OPTIONS as DEPENDENCY_TOOL_OPTIONS, MARKETPLACE_SKILL_SEEDS as marketplaceSeeds } from "@/lib/mock/skills-marketplace";

type SkillSource = "template" | "blank" | "imported";
type SkillStatus = "draft" | "reviewing" | "published" | "reviewFailed";
type MarketplaceSourceType = "platform" | "org";
type MarketplaceSourceFilter = "all" | MarketplaceSourceType | "favorite";
type SkillsExperienceMode = "mvp" | "v2";
type SkillsTab = "marketplace" | "mine" | "foundry";
type SkillsModuleView = "hub" | "management";
type MarketplaceSortMode = "downloads" | "references" | "updatedAt";
type MySkillStatusFilter = "all" | "reviewing" | "published" | "reviewFailed";
type SkillImportMode = "local" | "url";
type SkillImportUrlSource = "github" | "skills.sh" | "clawhub";
type SkillReleaseMode = "publish" | "update";
type PublishScope = "public" | "org";
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
  usageInstructions?: string;
  originalName?: string;
  originalDescription?: string;
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
  publishScope: PublishScope;
  releaseNotes: string;
  publishedTemplateId?: string;
  hasPublishedHistory: boolean;
}

interface SkillBundle {
  schemaVersion: 1;
  name: string;
  description: string;
  displayName?: string;
  displayDescription?: string;
  usageInstructions?: string;
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
  displayName?: string;
  displayDescription?: string;
  usageInstructions?: string;
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
const PENDING_FOUNDRY_TEMPLATE_STORAGE_KEY = "skills-foundry-pending-template";
const IMPORT_URL_SOURCE_OPTIONS: Array<{
  value: SkillImportUrlSource;
  label: string;
  hint: string;
  icon: LucideIcon;
}> = [
  {
    value: "github",
    label: "从Github导入",
    hint: "从公开 GitHub 仓库导入技能",
    icon: Github,
  },
  {
    value: "skills.sh",
    label: "从skill.sh导入",
    hint: "从 skills.sh 链接导入技能",
    icon: Sparkles,
  },
  {
    value: "clawhub",
    label: "从Clawhub导入",
    hint: "从 Clawhub 链接导入技能",
    icon: Bot,
  },
];
const PUBLISH_SCOPE_OPTIONS: Array<{
  value: PublishScope;
  label: string;
  hint: string;
  icon: LucideIcon;
}> = [
  {
    value: "public",
    label: "公开发布",
    hint: "面向更大范围展示和使用",
    icon: BadgeCheck,
  },
  {
    value: "org",
    label: "组织发布",
    hint: "仅作为组织沉淀的内部资产发布",
    icon: Building2,
  },
];
const IMPORT_MAX_FILE_SIZE = 100 * 1024 * 1024;
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
  usageInstructions?: string;
  originalName?: string;
  originalDescription?: string;
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
  publishScope?: PublishScope;
  releaseNotes?: string;
  publishedTemplateId?: string;
  hasPublishedHistory?: boolean;
}) {
  const files = cloneFiles(input.files, input.id);
  const firstFileId = files[0]?.id ?? "";

  return {
    id: input.id,
    name: input.name,
    description: input.description,
    usageInstructions: input.usageInstructions,
    originalName: input.originalName,
    originalDescription: input.originalDescription,
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
    publishScope: input.publishScope ?? "org",
    releaseNotes: input.releaseNotes ?? "",
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
      "为表格治理团队定制的 xlsx 技能，补充了数据清洗、公式检查与财务字段说明。",
    category: "数据分析",
    tags: ["Excel", "财务"],
    usageInstructions:
      "导入日报或财务类表格后，说明你希望核查或汇总的字段，技能会补充字段解释、清洗规则和结果汇总口径。",
    declaredDependencies: [DEPENDENCY_TOOL_OPTIONS[4]],
    source: "template",
    status: "published",
    version: "1.1",
    releaseNotes:
      "新增财务字段核查说明和异常单元格提示规则，适合日报与经营分析表的二次复核。",
    createdBy: "王晓宁",
    updatedBy: "王晓宁",
    files: marketplaceSeeds.find((skill) => skill.id === "xlsx")?.files ?? [],
    linkedCECClaws: [CEC_CLAW_INSTANCE],
    publishedTemplateId: "xlsx",
  }),
  createMySkill({
    id: "ops-summary",
    name: "运营简报生成器",
    description: "面向每周经营复盘的内部技能草稿，聚焦周报结构化整理与摘要输出。",
    category: "通讯协作",
    tags: ["周报", "运营"],
    usageInstructions:
      "输入本周经营数据、重点事项和待协调问题，技能会整理成适合内部周会或领导复盘使用的运营简报结构。",
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
      "面向 AI 产线项目周报、立项请示、阶段汇报和会议通知的公文写作技能，统一结构、语气和审批口径。",
    category: "通讯协作",
    tags: ["公文", "AI产线", "请示", "汇报"],
    usageInstructions:
      "输入 AI 产线项目背景、阶段目标、当前进展和待决策事项，技能会生成请示、汇报或通知类正式文稿。",
    declaredDependencies: [DEPENDENCY_TOOL_OPTIONS[0], DEPENDENCY_TOOL_OPTIONS[4]],
    source: "blank",
    status: "published",
    version: "1.2",
    releaseNotes:
      "补充立项请示和阶段汇报双模板，统一公文语气与审批口径，并增强会议通知场景的结构化输出。",
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
    usageInstructions:
      "输入联调环境、接口名称、异常回包和预期结果，技能会输出排查步骤、问题记录和联调结论，便于团队复盘。",
    source: "imported",
    status: "reviewFailed",
    version: "1.1",
    releaseNotes:
      "尝试补充跨系统联调问题记录模板和错误码归因规则，但当前版本仍存在术语不统一问题，待修订后重新提交。",
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
    usageInstructions:
      "上传对外材料或项目方案后，说明本次审校重点，技能会从格式、表述一致性和敏感词角度给出问题清单。",
    declaredDependencies: [DEPENDENCY_TOOL_OPTIONS[0]],
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
  skill: Pick<
    MySkill,
    | "name"
    | "description"
    | "usageInstructions"
    | "category"
    | "tags"
    | "declaredDependencies"
    | "files"
  >
): string {
  const bundle: SkillBundle = {
    schemaVersion: 1,
    name: skill.name,
    description: skill.description,
    displayName: skill.name,
    displayDescription: skill.description,
    usageInstructions: skill.usageInstructions,
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
  skill: Pick<
    MySkill,
    | "name"
    | "description"
    | "usageInstructions"
    | "category"
    | "tags"
    | "declaredDependencies"
    | "files"
  >
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
    return { error: "导入失败：SKILL.md 中缺少 技能名称（name）" };
  }

  if (!description) {
    return { error: "导入失败：SKILL.md 中缺少 技能描述（description）" };
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

function getImportUrlPlaceholder() {
  return "请输入技能链接";
}

function getImportUrlHint(source: SkillImportUrlSource) {
  if (source === "github") {
    return "仅接受仓库地址，不支持主页、issue、pull request 或子路径链接。";
  }

  return `当前将按 ${getImportUrlSourceLabel(source)} 来源解析技能，并复用本地导入的结构校验规则。`;
}

function filterDependencyOptionsByQuery(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return DEPENDENCY_TOOL_OPTIONS;
  }

  return DEPENDENCY_TOOL_OPTIONS.filter((item) =>
    [item.name, item.type === "mcp" ? "mcp" : "插件"].join(" ").toLowerCase().includes(normalizedQuery)
  );
}

function getSkillImportUrlError(value: string, source: SkillImportUrlSource) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return "";
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedValue);
  } catch {
    return "请输入有效的 URL 地址";
  }

  const inferredImportUrlSource = inferSkillImportUrlSource(normalizedValue);
  if (!inferredImportUrlSource) {
    return "仅支持 GitHub、skills.sh 或 Clawhub 链接";
  }

  if (inferredImportUrlSource !== source) {
    return `当前选择的是 ${getImportUrlSourceLabel(source)} 导入，请填写对应来源链接`;
  }

  if (!isValidSkillImportUrlPath(parsedUrl, source)) {
    if (source === "github") {
      return "GitHub 导入请填写完整仓库链接，例如 github.com/org/repo";
    }

    if (source === "skills.sh") {
      return "skills.sh 导入请填写完整 skill 链接，例如 skills.sh/org/repo/skill";
    }

    return "Clawhub 导入请填写完整 skill 链接，例如 clawhub.ai/author/skill";
  }

  return "";
}

async function validateLocalImportArchive(file: File): Promise<LocalImportValidationResult> {
  const lowerName = file.name.toLowerCase();
  const isZipLike = lowerName.endsWith(".zip");

  if (!isZipLike) {
    return buildImportValidationError("仅支持导入 .zip文件");
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
      displayName:
        typeof metadata?.displayName === "string"
          ? metadata.displayName
          : typeof metadata?.name === "string"
            ? metadata.name
            : "",
      displayDescription:
        typeof metadata?.displayDescription === "string"
          ? metadata.displayDescription
          : typeof metadata?.description === "string"
            ? metadata.description
            : "",
      usageInstructions:
        typeof metadata?.usageInstructions === "string" ? metadata.usageInstructions : "",
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
};

const AUDIENCE_VISUAL_META: Record<AudienceCategory, AudienceVisualMeta> = {
  ai: {
    label: "通用",
    icon: Bot,
    badgeClass: "border-[#e2e8f0] bg-[#f5f9ff] text-[#334155]",
  },
  dev: {
    label: "开发工具",
    icon: Wrench,
    badgeClass: "border-[#e2e8f0] bg-[#f5f9ff] text-[#334155]",
  },
  data: {
    label: "数据分析",
    icon: ChartColumn,
    badgeClass: "border-[#e2e8f0] bg-[#f5f9ff] text-[#334155]",
  },
  communication: {
    label: "通讯协作",
    icon: MessagesSquare,
    badgeClass: "border-[#e2e8f0] bg-[#f5f9ff] text-[#334155]",
  },
  content: {
    label: "企业服务",
    icon: Building2,
    badgeClass: "border-[#e2e8f0] bg-[#f5f9ff] text-[#334155]",
  },
  efficiency: {
    label: "效率工具",
    icon: Sparkles,
    badgeClass: "border-[#e2e8f0] bg-[#f5f9ff] text-[#334155]",
  },
  security: {
    label: "安全合规",
    icon: ShieldCheck,
    badgeClass: "border-[#e2e8f0] bg-[#f5f9ff] text-[#334155]",
  },
};

/** 应用广场卡片 — 白底、4px 圆角、轻阴影（plaza-page.md + SKILL 主色 hover） */
const SKILLS_PLAZA_CARD_CLASS =
  "rounded border border-[#e2e8f0] bg-[#ffffff] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-16px_rgba(39,115,255,0.14)]";

function getMarketplaceSourceText(skill: SkillTemplate) {
  return skill.sourceType === "platform" ? "AgentFoundry 精选" : skill.author;
}

function getMySkillSourceText(skill: Pick<MySkill, "source">) {
  return skill.source === "template"
    ? "模板导入"
    : skill.source === "imported"
      ? "本地导入"
      : "空白创建";
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

/** Arco `.arco-tag` + checked：已上架 green；其余 grey（对齐 Arco Tag green / gray checked） */
function getSkillStatusArcoTagClass(status: SkillStatus): string {
  if (status === "published") {
    return "border border-transparent bg-[#e8ffea] text-[#009a29]";
  }

  return "border border-transparent bg-[#f2f3f5] text-[#86909c]";
}

const SKILL_STATUS_ARCO_TAG_FRAME =
  "inline-flex h-5 items-center gap-1 rounded-sm border border-transparent px-1 text-xs font-normal leading-[18px] whitespace-nowrap";

/** CeCloud 列表页 — 状态筛选为文本 Tab + 底部主题色描边（SKILL.md Primary `#2773ff`） */
function getMySkillStatusFilterClass(_filterValue: MySkillStatusFilter, active: boolean) {
  if (!active) {
    return "border-b-2 border-transparent pb-2.5 text-[13px] font-medium text-[#5a6779] hover:text-[#334155]";
  }
  return "border-b-2 border-[#2773ff] pb-2.5 text-[13px] font-semibold text-[#2773ff]";
}

/** 胶囊筛选：轨道与页面底一致，仅选中项白底（参考应用广场） */
function getSkillsPlazaCapsuleFilterClass(active: boolean) {
  if (!active) {
    return "border-0 bg-transparent px-3 py-1 text-[13px] leading-6 text-[#6e7b8d] hover:text-[#334155]";
  }

  return "rounded-full border-0 bg-white px-3 py-1 text-[13px] font-medium leading-6 text-[#2773ff] shadow-[0_1px_2px_rgba(15,23,42,0.06)]";
}

function getMarketplaceSourceFilterClass(_filterValue: MarketplaceSourceFilter, active: boolean) {
  return getSkillsPlazaCapsuleFilterClass(active);
}

function getAudienceFilterClass(_filterValue: AudienceCategoryFilter, active: boolean) {
  return getSkillsPlazaCapsuleFilterClass(active);
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

interface SkillsPageProps {
  moduleView?: SkillsModuleView;
}

export default function SkillsPage({ moduleView = "hub" }: SkillsPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SkillsTab>(
    moduleView === "management" ? "mine" : "marketplace"
  );
  const [experienceMode, setExperienceMode] = useState<SkillsExperienceMode>("mvp");
  const [marketplaceSkills, setMarketplaceSkills] = useState<SkillTemplate[]>(initialMarketplace);
  const [mySkills, setMySkills] = useState<MySkill[]>(initialMySkills);
  const [selectedSkillId, setSelectedSkillId] = useState(initialMySkills[0]?.id ?? "");
  const [focusedSkillId, setFocusedSkillId] = useState(initialMySkills[0]?.id ?? "");
  const [marketSearch, setMarketSearch] = useState("");
  const [mySkillSearch, setMySkillSearch] = useState("");
  const [selectedMarketplaceDetailId, setSelectedMarketplaceDetailId] = useState("");
  const [selectedMySkillDetailId, setSelectedMySkillDetailId] = useState("");
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
  const [urlImportValidation, setUrlImportValidation] = useState<LocalImportValidationResult>({
    status: "idle",
    errors: [],
    fileName: "",
  });
  const [urlImportDisplayName, setUrlImportDisplayName] = useState("");
  const [urlImportDisplayDescription, setUrlImportDisplayDescription] = useState("");
  const [urlImportUsageInstructions, setUrlImportUsageInstructions] = useState("");
  const [localImportFile, setLocalImportFile] = useState<File | null>(null);
  const [localImportValidation, setLocalImportValidation] = useState<LocalImportValidationResult>({
    status: "idle",
    errors: [],
    fileName: "",
  });
  const [localImportDisplayName, setLocalImportDisplayName] = useState("");
  const [localImportDisplayDescription, setLocalImportDisplayDescription] = useState("");
  const [localImportUsageInstructions, setLocalImportUsageInstructions] = useState("");
  const [importDependencyEnabled, setImportDependencyEnabled] = useState(false);
  const [selectedDependencyIds, setSelectedDependencyIds] = useState<string[]>([]);
  const [dependencyPopoverOpen, setDependencyPopoverOpen] = useState(false);
  const [dependencySearch, setDependencySearch] = useState("");
  const [remoteImportLoading, setRemoteImportLoading] = useState(false);
  const [updateVersionInput, setUpdateVersionInput] = useState("");
  const [releaseMode, setReleaseMode] = useState<SkillReleaseMode>("publish");
  const [releaseImportMode, setReleaseImportMode] = useState<SkillImportMode>("local");
  const [releaseImportUrlSource, setReleaseImportUrlSource] = useState<SkillImportUrlSource>("github");
  const [releaseImportUrlValue, setReleaseImportUrlValue] = useState("");
  const [releaseImportFile, setReleaseImportFile] = useState<File | null>(null);
  const [releaseImportValidation, setReleaseImportValidation] = useState<LocalImportValidationResult>({
    status: "idle",
    errors: [],
    fileName: "",
  });
  const [releaseRemoteImportLoading, setReleaseRemoteImportLoading] = useState(false);
  const [releaseDisplayNameInput, setReleaseDisplayNameInput] = useState("");
  const [releaseDisplayDescriptionInput, setReleaseDisplayDescriptionInput] = useState("");
  const [releaseNotesInput, setReleaseNotesInput] = useState("");
  const [releaseScope, setReleaseScope] = useState<PublishScope>("org");
  const [releaseCategory, setReleaseCategory] = useState("通用");
  const [pendingFoundryTemplate, setPendingFoundryTemplate] =
    useState<SkillsFoundryTemplateSeed | null>(null);
  const didResolveModuleEntryRef = useRef(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const releaseImportInputRef = useRef<HTMLInputElement>(null);
  const reviewApprovalTimersRef = useRef<Record<string, number>>({});
  const useUnifiedSkillsManagementView = true;

  const deferredMarketSearch = useDeferredValue(marketSearch);
  const deferredMySkillSearch = useDeferredValue(mySkillSearch);
  const deferredFileSearch = useDeferredValue(fileSearch);
  const isAllSkillsSelected = selectedSkillId === ALL_SKILLS_VALUE;
  const isMvpMode = experienceMode === "mvp";
  const isHubModule = moduleView === "hub";
  const isManagementModule = moduleView === "management";
  const isSkillDetailView = Boolean(selectedMarketplaceDetailId || selectedMySkillDetailId);
  const showManagementTabs = isManagementModule && !isMvpMode;
  const showExperienceSwitcher = !isSkillDetailView;
  /** 管理页版本切换为右上角 hover 浮层，不在此占位 */
  const showTopControlsBar = showManagementTabs;

  useEffect(() => {
    if (isMvpMode && marketSortMode === "references") {
      setMarketSortMode("downloads");
    }
  }, [isMvpMode, marketSortMode]);

  useEffect(() => {
    if (didResolveModuleEntryRef.current) {
      return;
    }

    const currentSearchParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
    const requestedMode = currentSearchParams.get("mode");
    const nextExperienceMode: SkillsExperienceMode = requestedMode === "v2" ? "v2" : "mvp";
    setExperienceMode(nextExperienceMode);

    if (isManagementModule) {
      const requestedTab = currentSearchParams.get("tab");
      setActiveTab(
        nextExperienceMode === "v2" && requestedTab === "foundry" ? "foundry" : "mine"
      );

      if (nextExperienceMode === "v2" && requestedTab === "foundry") {
        if (typeof window !== "undefined") {
          const serializedTemplate = window.sessionStorage.getItem(
            PENDING_FOUNDRY_TEMPLATE_STORAGE_KEY
          );
          if (serializedTemplate) {
            try {
              setPendingFoundryTemplate(JSON.parse(serializedTemplate) as SkillsFoundryTemplateSeed);
            } catch {
              window.sessionStorage.removeItem(PENDING_FOUNDRY_TEMPLATE_STORAGE_KEY);
            }
          }
        }
      }
    } else {
      setActiveTab("marketplace");
    }

    didResolveModuleEntryRef.current = true;
  }, [isManagementModule]);

  useEffect(() => {
    if (isMvpMode && activeTab === "foundry") {
      setActiveTab(isManagementModule ? "mine" : "marketplace");
    }
  }, [activeTab, isManagementModule, isMvpMode]);

  useEffect(() => {
    if (selectedMarketplaceDetailId && !marketplaceSkills.some((skill) => skill.id === selectedMarketplaceDetailId)) {
      setSelectedMarketplaceDetailId("");
    }
  }, [marketplaceSkills, selectedMarketplaceDetailId]);

  useEffect(() => {
    if (selectedMySkillDetailId && !mySkills.some((skill) => skill.id === selectedMySkillDetailId)) {
      setSelectedMySkillDetailId("");
    }
  }, [mySkills, selectedMySkillDetailId]);

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
  const normalizedImportUrl = importUrlValue.trim();
  const importUrlError = useMemo(
    () => getSkillImportUrlError(normalizedImportUrl, importUrlSource),
    [importUrlSource, normalizedImportUrl]
  );
  const normalizedReleaseImportUrl = releaseImportUrlValue.trim();
  const releaseImportUrlError = useMemo(
    () => getSkillImportUrlError(normalizedReleaseImportUrl, releaseImportUrlSource),
    [normalizedReleaseImportUrl, releaseImportUrlSource]
  );
  const selectedDeclaredDependencies = useMemo(
    () => DEPENDENCY_TOOL_OPTIONS.filter((item) => selectedDependencyIds.includes(item.id)),
    [selectedDependencyIds]
  );
  const filteredDependencyOptions = useMemo(() => {
    return filterDependencyOptionsByQuery(dependencySearch);
  }, [dependencySearch]);
  const canConfirmLocalImport = localImportValidation.status === "valid";
  const isLocalImportParsed = Boolean(
    localImportValidation.status === "valid" && localImportValidation.manifest
  );
  const isUrlImportParsed = Boolean(urlImportValidation.status === "valid" && urlImportValidation.manifest);
  const canParseUrlImport = Boolean(normalizedImportUrl && !importUrlError && !remoteImportLoading);
  const canConfirmUrlImport = isUrlImportParsed && !remoteImportLoading;
  const canSubmitRelease = Boolean(
    updateTargetSkill &&
      releaseDisplayNameInput.trim() &&
      releaseDisplayDescriptionInput.trim() &&
      (isPublishRelease
        ? true
        : releaseImportMode === "local"
          ? Boolean(updateVersionInput.trim() && !updateVersionError && releaseImportValidation.status === "valid")
          : Boolean(
              updateVersionInput.trim() &&
                !updateVersionError &&
                normalizedReleaseImportUrl &&
                !releaseImportUrlError &&
                !releaseRemoteImportLoading
            ))
  );

  const activeFile = useMemo(
    () => activeSkill?.files.find((file) => file.id === activeSkill.activeFileId) ?? null,
    [activeSkill]
  );
  const selectedMarketplaceDetail = useMemo(
    () => marketplaceSkills.find((skill) => skill.id === selectedMarketplaceDetailId) ?? null,
    [marketplaceSkills, selectedMarketplaceDetailId]
  );
  const selectedMySkillDetail = useMemo(
    () => mySkills.find((skill) => skill.id === selectedMySkillDetailId) ?? null,
    [mySkills, selectedMySkillDetailId]
  );
  const selectedMySkillPublishedTemplate = useMemo(
    () =>
      selectedMySkillDetail?.publishedTemplateId
        ? marketplaceSkills.find((skill) => skill.id === selectedMySkillDetail.publishedTemplateId) ?? null
        : null,
    [marketplaceSkills, selectedMySkillDetail]
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

    toast.success(`已保存技能：${activeSkill.name}`);
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
        author: existingTemplate?.author ?? "我的技能",
        publishedAt: formatNow(),
        publishedBy: CURRENT_SKILL_EDITOR,
        version: skillToPublish.version,
        releaseNotes: skillToPublish.releaseNotes,
        description: skillToPublish.description,
        usageInstructions: skillToPublish.usageInstructions,
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
    setReleaseImportMode("local");
    setReleaseImportUrlSource("github");
    setReleaseImportUrlValue("");
    setReleaseImportFile(null);
    setReleaseImportValidation({
      status: "idle",
      errors: [],
      fileName: "",
    });
    setReleaseRemoteImportLoading(false);
    setReleaseDisplayNameInput(skill.name);
    setReleaseDisplayDescriptionInput(skill.description);
    setReleaseNotesInput(skill.releaseNotes ?? "");
    setReleaseScope(skill.publishScope ?? "org");
    setReleaseCategory(skill.category);
    setUpdateDialogOpen(true);
  };

  const openReleaseDialogFromDetail = (skillId: string) => {
    setSelectedSkillId(skillId);
    setFocusedSkillId(skillId);
    setSelectedMySkillDetailId(skillId);
    openReleaseDialog(skillId);
  };

  const handleSubmitRelease = async () => {
    const skill = updateTargetSkill;
    if (!skill) {
      toast.error("未找到需要更新的技能");
      return;
    }

    if (!canSubmitRelease) {
      return;
    }

    const nextVersion = isPublishRelease ? "1.0" : updateVersionInput.trim();
    const nextDisplayName = releaseDisplayNameInput.trim() || skill.name;
    const nextDisplayDescription = releaseDisplayDescriptionInput.trim() || skill.description;
    const nextReleaseNotes = isPublishRelease ? "" : releaseNotesInput.trim();

    let importedPayload:
      | {
          tags: string[];
          declaredDependencies: SkillDependency[];
          files: Array<Pick<SkillFile, "path" | "content">>;
        }
      | null = null;

    if (!isPublishRelease) {
      if (releaseImportMode === "local") {
        if (
          releaseImportValidation.status !== "valid" ||
          !releaseImportValidation.manifest ||
          !releaseImportValidation.files
        ) {
          return;
        }

        importedPayload = {
          tags: releaseImportValidation.tags ?? skill.tags,
          declaredDependencies: releaseImportValidation.declaredDependencies ?? skill.declaredDependencies,
          files: releaseImportValidation.files,
        };
      } else {
        if (!normalizedReleaseImportUrl || releaseImportUrlError) {
          return;
        }

        let parsedUrl: URL;
        try {
          parsedUrl = new URL(normalizedReleaseImportUrl);
        } catch {
          toast.error(
            releaseImportUrlSource === "github"
              ? "请输入合法的 GitHub 仓库地址"
              : `请输入合法的 ${getImportUrlSourceLabel(releaseImportUrlSource)} 技能链接`
          );
          return;
        }

        setReleaseRemoteImportLoading(true);

        try {
          await new Promise((resolve) => window.setTimeout(resolve, 650));

          const inaccessibleHint = /private|not[-_]?found|404/i.test(parsedUrl.toString());
          if (inaccessibleHint) {
            toast.error(
              releaseImportUrlSource === "github"
                ? "无法访问该仓库，请确保地址正确且状态为公开"
                : `无法访问该技能，请确保链接正确且可公开访问`
            );
            return;
          }

          const remotePayload = buildImportedSkillPayloadFromUrl(
            normalizedReleaseImportUrl,
            releaseImportUrlSource,
            skill.name
          );

          importedPayload = {
            tags: remotePayload.tags,
            declaredDependencies: remotePayload.declaredDependencies,
            files: remotePayload.files,
          };
        } finally {
          setReleaseRemoteImportLoading(false);
        }
      }
    }

    setMySkills((current) => {
      const target = current.find((item) => item.id === skill.id);
      if (!target) {
        return current;
      }

      const nextFiles = importedPayload
        ? importedPayload.files.map((file, index) =>
            createFile(file.path || `file-${index + 1}.md`, file.content, `release-${target.id}`)
          )
        : target.files;
      const nextActiveFileId = nextFiles[0]?.id ?? target.activeFileId;

      const reviewingSkill = {
        ...target,
        status: "reviewing" as const,
        name: nextDisplayName,
        version: nextVersion,
        category: releaseCategory,
        description: nextDisplayDescription,
        tags: importedPayload?.tags ?? target.tags,
        declaredDependencies: importedPayload?.declaredDependencies ?? target.declaredDependencies,
        files: nextFiles,
        activeFileId: nextActiveFileId,
        openFileIds: nextActiveFileId ? [nextActiveFileId] : [],
        updatedAt: formatNow(),
        updatedBy: CURRENT_SKILL_EDITOR,
        publishScope: releaseScope,
        releaseNotes: nextReleaseNotes,
        dirty: false,
        hasPublishedHistory: hasPublishedHistory(target),
      };

      return [reviewingSkill, ...current.filter((item) => item.id !== skill.id)];
    });

    setUpdateDialogOpen(false);
    resetReleaseDraft();

    if (releaseMode === "publish") {
      toast.success(`已提交发布审核：${nextDisplayName} ${formatSkillVersion(nextVersion)}`);
      return;
    }

    toast.success(
      hasPublishedHistory(skill) && skill.status !== "published"
        ? `已提交更新发布审核：${nextDisplayName} ${formatSkillVersion(nextVersion)}`
        : `已提交更新审核：${nextDisplayName} ${formatSkillVersion(nextVersion)}`
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

      toast.success(`已下载技能：${template.name}`);
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
    const nextTemplate = {
      requestId: `${template.id}-${Date.now()}`,
      id: template.id,
      name: template.name,
      files: template.files.map((file) => ({
        path: file.path,
        content: file.content,
      })),
    };

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        PENDING_FOUNDRY_TEMPLATE_STORAGE_KEY,
        JSON.stringify(nextTemplate)
      );
    }

    setPendingFoundryTemplate(nextTemplate);

    if (moduleView === "management") {
      setExperienceMode("v2");
      setActiveTab("foundry");
      return;
    }

    router.push("/skills-management?tab=foundry&mode=v2");
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

      toast.success(`已导出技能：${skill.name}`);
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
    setSelectedMySkillDetailId((current) => (current === skill.id ? "" : current));
    toast.success(`已删除技能：${skill.name}`);
  };

  const handleOfflineMySkill = (skillId: string) => {
    const skill = mySkills.find((item) => item.id === skillId);
    if (!skill) {
      return;
    }

    if (skill.status !== "published") {
      toast.info("仅已上架的技能 支持下架");
      return;
    }

    const confirmed = window.confirm(`确认下架技能「${skill.name}」吗？下架后将不再对外展示。`);
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

    toast.success(`已下架技能：${skill.name}，当前已转为未发布`);
  };

  const openMarketplaceDetail = (skillId: string) => {
    setSelectedMarketplaceDetailId(skillId);
  };

  const closeMarketplaceDetail = () => {
    setSelectedMarketplaceDetailId("");
  };

  const openMySkillDetail = (skillId: string) => {
    setSelectedMySkillDetailId(skillId);
  };

  const closeMySkillDetail = () => {
    setSelectedMySkillDetailId("");
  };

  const resetImportDraft = () => {
    setImportMode("local");
    setImportUrlSource("github");
    setImportUrlValue("");
    setUrlImportValidation({
      status: "idle",
      errors: [],
      fileName: "",
    });
    setUrlImportDisplayName("");
    setUrlImportDisplayDescription("");
    setUrlImportUsageInstructions("");
    setLocalImportFile(null);
    setLocalImportValidation({
      status: "idle",
      errors: [],
      fileName: "",
    });
    setLocalImportDisplayName("");
    setLocalImportDisplayDescription("");
    setLocalImportUsageInstructions("");
    setImportDependencyEnabled(false);
    setSelectedDependencyIds([]);
    setDependencySearch("");
    setDependencyPopoverOpen(false);
    setRemoteImportLoading(false);
  };

  const openImportDialog = () => {
    resetImportDraft();
    setImportDialogOpen(true);
  };

  const resetUrlImportParsedState = () => {
    setUrlImportValidation({
      status: "idle",
      errors: [],
      fileName: "",
    });
    setUrlImportDisplayName("");
    setUrlImportDisplayDescription("");
    setUrlImportUsageInstructions("");
  };

  const resetReleaseDraft = () => {
    setUpdateTargetSkillId("");
    setUpdateVersionInput("");
    setReleaseImportMode("local");
    setReleaseImportUrlSource("github");
    setReleaseImportUrlValue("");
    setReleaseImportFile(null);
    setReleaseImportValidation({
      status: "idle",
      errors: [],
      fileName: "",
    });
    setReleaseRemoteImportLoading(false);
    setReleaseDisplayNameInput("");
    setReleaseDisplayDescriptionInput("");
    setReleaseNotesInput("");
    setReleaseScope("org");
    setReleaseCategory("通用");
    setReleaseMode("publish");
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

  const buildImportedSkillPayloadFromUrl = (
    urlValue: string,
    source: SkillImportUrlSource,
    nameOverride?: string
  ) => {
    const parsedUrl = new URL(urlValue);
    const sourceLabel = getImportUrlSourceLabel(source);
    const displayName = nameOverride ?? extractSkillNameFromUrl(parsedUrl, source);
    const filePrefix = `import-url-${slugify(displayName)}`;

    return {
      name: displayName,
      description: `从${sourceLabel}链接导入的 技能草稿，可继续补充说明、模板和脚本内容。`,
      category: "通用",
      tags: [sourceLabel, "URL导入"],
      declaredDependencies: [] as SkillDependency[],
      files: [
        {
          path: "SKILL.md",
          content: `---
name: "${displayName}"
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
        },
        {
          path: "SOURCE.md",
          content: `# 来源信息

- 来源类型：${sourceLabel}
- 导入链接：${parsedUrl.toString()}
- 导入时间：${formatNow()}

请在导入后校验目录结构、说明文档和脚本内容是否完整。
`,
        },
      ],
      filePrefix,
    };
  };

  const validateUrlImport = async (
    urlValue: string,
    source: SkillImportUrlSource
  ): Promise<LocalImportValidationResult> => {
    const sourceLabel = getImportUrlSourceLabel(source);
    const urlError = getSkillImportUrlError(urlValue.trim(), source);

    if (urlError) {
      return buildImportValidationError(
        source === "github" ? "请输入合法的 GitHub 仓库地址" : `请输入合法的 ${sourceLabel} 技能链接`
      );
    }

    const parsedUrl = new URL(urlValue.trim());
    await new Promise((resolve) => window.setTimeout(resolve, 650));

    const inaccessibleHint = /private|not[-_]?found|404/i.test(parsedUrl.toString());
    if (inaccessibleHint) {
      return buildImportValidationError(
        source === "github"
          ? "无法访问该仓库，请确保地址正确且状态为公开"
          : "无法访问该技能，请确保链接正确且可公开访问"
      );
    }

    const remotePayload = buildImportedSkillPayloadFromUrl(urlValue.trim(), source);
    const rootSkillFile = remotePayload.files.find((file) => file.path === "SKILL.md");
    if (!rootSkillFile) {
      return buildImportValidationError("导入失败：压缩包根目录下未检测到 SKILL.md 文件");
    }

    if (!rootSkillFile.content.trim()) {
      return buildImportValidationError("导入失败：SKILL.md 内容为空或无法正常读取");
    }

    const frontmatter = parseSkillFrontmatter(rootSkillFile.content);
    if ("error" in frontmatter) {
      return buildImportValidationError(frontmatter.error);
    }

    return {
      status: "valid",
      errors: [],
      fileName: parsedUrl.toString(),
      manifest: {
        name: frontmatter.name,
        description: frontmatter.description,
      },
      displayName: "",
      displayDescription: "",
      usageInstructions: "",
      category: remotePayload.category,
      tags: remotePayload.tags,
      declaredDependencies: remotePayload.declaredDependencies,
      files: remotePayload.files,
    };
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
      if (validationResult.status === "valid") {
        setLocalImportDisplayName(validationResult.displayName ?? "");
        setLocalImportDisplayDescription(validationResult.displayDescription ?? "");
        setLocalImportUsageInstructions(validationResult.usageInstructions ?? "");
      } else {
        setLocalImportDisplayName("");
        setLocalImportDisplayDescription("");
        setLocalImportUsageInstructions("");
      }
    } finally {
      event.target.value = "";
    }
  };

  const handleReleaseImportFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    const importFile = selectedFiles[0];
    setReleaseImportFile(importFile);
    setReleaseImportValidation({
      status: "validating",
      errors: [],
      fileName: importFile.name,
    });

    try {
      const validationResult = await validateLocalImportArchive(importFile);
      setReleaseImportValidation(validationResult);
    } finally {
      event.target.value = "";
    }
  };

  const handleConfirmLocalImport = () => {
    if (localImportValidation.status !== "valid" || !localImportValidation.manifest || !localImportValidation.files) {
      return;
    }

    const nextDisplayName = localImportDisplayName.trim() || localImportValidation.manifest.name;
    const nextDisplayDescription =
      localImportDisplayDescription.trim() || localImportValidation.manifest.description;
    const name = uniqueName(
      nextDisplayName,
      mySkills.map((skill) => skill.name)
    );

    const importedSkill = createMySkill({
      id: `${slugify(localImportValidation.manifest.name)}-${Date.now()}`,
      name,
      description: nextDisplayDescription,
      usageInstructions: localImportUsageInstructions.trim(),
      originalName: localImportValidation.manifest.name,
      originalDescription: localImportValidation.manifest.description,
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

    finalizeImportedSkill(importedSkill, `已导入技能：${importedSkill.name}`);
  };

  const handleParseImportFromUrl = async () => {
    if (!normalizedImportUrl) {
      return;
    }

    setRemoteImportLoading(true);
    setUrlImportValidation({
      status: "validating",
      errors: [],
      fileName: normalizedImportUrl,
    });

    try {
      const validationResult = await validateUrlImport(normalizedImportUrl, importUrlSource);
      setUrlImportValidation(validationResult);
      if (validationResult.status === "valid") {
        setUrlImportDisplayName(validationResult.displayName ?? "");
        setUrlImportDisplayDescription(validationResult.displayDescription ?? "");
        setUrlImportUsageInstructions(validationResult.usageInstructions ?? "");
      } else {
        setUrlImportDisplayName("");
        setUrlImportDisplayDescription("");
        setUrlImportUsageInstructions("");
      }
    } finally {
      setRemoteImportLoading(false);
    }
  };

  const handleConfirmImportFromUrl = () => {
    if (urlImportValidation.status !== "valid" || !urlImportValidation.manifest || !urlImportValidation.files) {
      return;
    }

    const nextDisplayName = urlImportDisplayName.trim() || urlImportValidation.manifest.name;
    const nextDisplayDescription =
      urlImportDisplayDescription.trim() || urlImportValidation.manifest.description;
    const name = uniqueName(
      nextDisplayName,
      mySkills.map((skill) => skill.name)
    );

    const importedSkill = createMySkill({
      id: `${slugify(urlImportValidation.manifest.name)}-${Date.now()}`,
      name,
      description: nextDisplayDescription,
      usageInstructions: urlImportUsageInstructions.trim(),
      originalName: urlImportValidation.manifest.name,
      originalDescription: urlImportValidation.manifest.description,
      category: urlImportValidation.category ?? "通用",
      tags: urlImportValidation.tags ?? [getImportUrlSourceLabel(importUrlSource), "URL导入"],
      declaredDependencies: urlImportValidation.declaredDependencies ?? [],
      source: "imported",
      files: urlImportValidation.files.map((file, index) =>
        createFile(file.path || `file-${index + 1}.md`, file.content, "import-url")
      ),
    });

    finalizeImportedSkill(
      importedSkill,
      `已从 ${getImportUrlSourceLabel(importUrlSource)} 导入技能：${importedSkill.name}`
    );
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

  const renderMarketplaceDetailPage = (skill: SkillTemplate) => {
    const audienceMeta = AUDIENCE_VISUAL_META[skill.audienceCategory];
    const SkillIcon = getMarketplaceSkillIcon(skill);
    const dependencyCount = skill.declaredDependencies?.length ?? 0;
    const shouldShowReleaseNotes =
      compareVersions(skill.version ?? "1.0", "1.0") > 0 && Boolean(skill.releaseNotes?.trim());
    const shouldShowScenarioBlock = Boolean(
      skill.scene?.trim() || skill.inputExample?.trim() || skill.outputExample?.trim()
    );

    return (
      <section className="relative overflow-hidden rounded-[24px] border-0 bg-white shadow-[0_28px_72px_-44px_rgba(39,115,255,0.16)]">
        <div aria-hidden className="absolute inset-0">
          <div className="skills-ambient-orb absolute left-[-3rem] top-0 h-28 w-28 rounded-full bg-[#4fd6ff]/18 blur-3xl" />
          <div className="skills-ambient-orb skills-ambient-orb-delay absolute right-[-2rem] top-8 h-32 w-32 rounded-full bg-[#dbe7f4]/80 blur-3xl" />
        </div>

        <div className="relative space-y-6 px-5 py-6 md:px-8 md:py-8">
          <Button
            variant="ghost"
            className="h-9 w-fit rounded-full px-3 text-[#5a6779] hover:bg-[#f8f9fb] hover:text-[#2773ff]"
            onClick={closeMarketplaceDetail}
          >
            <ArrowLeft className="h-4 w-4" />
            返回 技能广场
          </Button>

          <div className="space-y-6">
            <div className="rounded-[24px] border border-[#dbe7f4]/80 bg-[#f8f9fb] p-6 shadow-[0_18px_48px_-36px_rgba(11,16,32,0.08)] md:p-7">
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border-0 bg-[#dbe7f4]/55 text-[#2773ff]">
                  <SkillIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex w-fit max-w-full min-w-0 flex-wrap items-center gap-2">
                    <h1 className="skills-display min-w-0 max-w-full shrink break-words text-[2rem] font-bold leading-tight tracking-tight text-[#000000]">
                      {skill.name}
                    </h1>
                    <Badge
                      variant="outline"
                      className={cn(
                        "inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[12px] font-semibold",
                        audienceMeta.badgeClass
                      )}
                    >
                      {skill.category || audienceMeta.label}
                    </Badge>
                  </div>
                  <p className="max-w-4xl text-[15px] leading-7 text-[#5a6779]">
                    {skill.detailDescription ?? skill.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-[#5a6779]">
                    <span className="font-medium text-[#2f5fbf]">{getMarketplaceSourceText(skill)}</span>
                    <span className="text-[#dbe7f4]">·</span>
                    <span>
                      {skill.sourceType === "platform"
                        ? `更新于 ${skill.publishedAt}`
                        : `发布于 ${skill.publishedAt}（${skill.publishedBy}）`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-[#dbe7f4]/80 pt-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe7f4] bg-white px-3 py-1.5 text-sm text-[#5a6779]">
                    <span className="font-semibold text-[#000000]">{formatSkillVersion(skill.version)}</span>
                    <span>版本</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe7f4] bg-white px-3 py-1.5 text-sm text-[#5a6779]">
                    <span className="font-semibold text-[#000000]">{skill.downloads.toLocaleString()}</span>
                    <span>下载</span>
                  </div>
                  {dependencyCount ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-[#5a6779]">依赖声明</span>
                      {skill.declaredDependencies?.map((dependency) => (
                        <span
                          key={`${skill.id}-${dependency.id}`}
                          className="rounded-full border border-[#dbe7f4] bg-white px-2.5 py-1 text-xs font-medium text-[#2f5fbf]"
                        >
                          {dependency.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={cn(
                      "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded p-0 text-[#94a3b8] transition-colors",
                      "border-0 bg-transparent shadow-none hover:text-[#64748b]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2773ff]/25 focus-visible:ring-offset-1"
                    )}
                    onClick={() => handleToggleFavorite(skill.id)}
                    aria-label={skill.isFavorite ? "取消收藏" : "加入收藏"}
                    title={skill.isFavorite ? "取消收藏" : "加入收藏"}
                  >
                    <Star
                      className={cn(
                        "h-5 w-5 stroke-[1.35]",
                        skill.isFavorite
                          ? "fill-[#fff8e6] text-[#d4a017]"
                          : "fill-transparent text-current"
                      )}
                    />
                  </button>
                  <Button
                    className="h-11 rounded-full border-0 bg-[#2773ff] px-5 text-white shadow-[0_14px_32px_-14px_rgba(39,115,255,0.55)] hover:bg-[#1f5fe0]"
                    onClick={() => handleDownloadTemplate(skill)}
                  >
                    <Download className="h-4 w-4" />
                    导出 .zip
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#dbe7f4]/70 bg-white p-6 shadow-[0_18px_48px_-40px_rgba(39,115,255,0.1)] md:p-7">
              {shouldShowReleaseNotes ? (
                <div className="mb-6 rounded-[18px] border border-[#dbe7f4]/80 bg-[#f8f9fb] px-4 py-4">
                  <div className="text-base font-semibold text-[#000000]">更新说明</div>
                  <div className="mt-3 text-sm leading-7 text-[#5a6779]">{skill.releaseNotes}</div>
                </div>
              ) : null}

              <div className="text-base font-semibold text-[#000000]">使用说明</div>
              <div className="mt-4 rounded-[18px] border border-[#dbe7f4]/80 bg-[#f8f9fb] px-4 py-4 text-sm leading-7 text-[#5a6779]">
                {skill.usageInstructions?.trim() || "暂未填写使用说明"}
              </div>

              {shouldShowScenarioBlock ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {skill.scene?.trim() ? (
                    <div className="rounded-[18px] border border-[#dbe7f4]/80 bg-[#f8f9fb] px-4 py-4">
                      <div className="text-[11px] font-semibold tracking-[0.12em] text-[#5a6779] uppercase">
                        适用场景
                      </div>
                      <div className="mt-2 text-sm font-medium text-[#000000]">{skill.scene}</div>
                    </div>
                  ) : null}
                  {skill.inputExample?.trim() ? (
                    <div className="rounded-[18px] border border-[#dbe7f4]/80 bg-[#f8f9fb] px-4 py-4">
                      <div className="text-[11px] font-semibold tracking-[0.12em] text-[#5a6779] uppercase">
                        输入示例
                      </div>
                      <div className="mt-2 text-sm leading-6 text-[#5a6779]">{skill.inputExample}</div>
                    </div>
                  ) : null}
                  {skill.outputExample?.trim() ? (
                    <div className="rounded-[18px] border border-[#dbe7f4]/80 bg-[#f8f9fb] px-4 py-4">
                      <div className="text-[11px] font-semibold tracking-[0.12em] text-[#5a6779] uppercase">
                        输出示例
                      </div>
                      <div className="mt-2 text-sm leading-6 text-[#5a6779]">{skill.outputExample}</div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderMySkillDetailPage = (skill: MySkill) => {
    const audienceCategory = mapEditorCategoryToAudienceCategory(skill.category);
    const audienceMeta = AUDIENCE_VISUAL_META[audienceCategory];
    const SkillIcon = getMarketplaceSkillIcon({ name: skill.name, audienceCategory });
    const statusMeta = getSkillStatusMeta(skill.status);
    const StatusIcon = statusMeta.icon;
    const releaseAction = getSkillReleaseActionMeta(skill);
    const linkedTemplate = selectedMySkillPublishedTemplate;
    const downloadsValue = linkedTemplate?.downloads ?? 0;
    const dependencyCount = skill.declaredDependencies.length;
    const shouldShowReleaseNotes =
      compareVersions(skill.version ?? "1.0", "1.0") > 0 && Boolean(skill.releaseNotes?.trim());
    return (
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] shadow-[0_30px_64px_-44px_rgba(15,23,42,0.28)]">
        <div aria-hidden className="absolute inset-0">
          <div className="skills-ambient-orb absolute left-[-3rem] top-0 h-28 w-28 rounded-full bg-indigo-200/18 blur-3xl" />
          <div className="skills-ambient-orb skills-ambient-orb-delay absolute right-[-2rem] top-10 h-32 w-32 rounded-full bg-emerald-200/16 blur-3xl" />
        </div>

        <div className="relative space-y-5 px-5 py-5 md:px-6">
          <Button
            variant="ghost"
            className="h-9 w-fit rounded-2xl px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            onClick={closeMySkillDetail}
          >
            <ArrowLeft className="h-4 w-4" />
            返回 SKILLS管理
          </Button>

          <div className="space-y-5">
            <div className="rounded-[26px] border border-white/90 bg-white/86 p-5 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.22)]">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-slate-200/80 bg-slate-50/95 text-slate-700">
                  <SkillIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex w-fit max-w-full min-w-0 items-center gap-2">
                      <h1 className="skills-display min-w-0 max-w-full shrink break-words text-[2rem] leading-tight text-slate-950">
                        {skill.name}
                      </h1>
                      <Badge
                        variant="outline"
                        className={cn(
                          "inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[12px] font-semibold",
                          audienceMeta.badgeClass
                        )}
                      >
                        {skill.category}
                      </Badge>
                    </div>
                    <span
                      className={cn(
                        SKILL_STATUS_ARCO_TAG_FRAME,
                        getSkillStatusArcoTagClass(skill.status)
                      )}
                    >
                      <StatusIcon className="h-3 w-3 shrink-0" />
                      {statusMeta.label}
                    </span>
                  </div>
                  <p className="max-w-4xl text-[15px] leading-7 text-slate-600">{skill.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">创建人 {skill.createdBy}</span>
                    <span className="text-slate-300">·</span>
                    <span>{getMySkillSourceText(skill)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-200/70 pt-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/85 px-3 py-1.5 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">{formatSkillVersion(skill.version)}</span>
                    <span>版本</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/85 px-3 py-1.5 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">
                      {linkedTemplate ? downloadsValue.toLocaleString() : "--"}
                    </span>
                    <span>下载</span>
                  </div>
                  {dependencyCount ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-500">依赖声明</span>
                      {skill.declaredDependencies.map((dependency) => (
                        <span
                          key={`${skill.id}-${dependency.id}`}
                          className="rounded-full border border-sky-200/80 bg-sky-50/80 px-2.5 py-1 text-xs font-medium text-sky-700"
                        >
                          {dependency.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                    onClick={() => handleExportMySkill(skill.id)}
                  >
                    导出 .zip
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl border-slate-200/80 bg-white text-[#2773ff] hover:bg-[#f0f6fe] hover:text-[#2f5fbf] disabled:text-slate-300"
                    onClick={() => openReleaseDialogFromDetail(skill.id)}
                    disabled={releaseAction.disabled}
                  >
                    {releaseAction.label}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    onClick={() => handleOfflineMySkill(skill.id)}
                    disabled={skill.status !== "published"}
                  >
                    下架
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl border-rose-200/80 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => handleDeleteMySkill(skill.id)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.18)]">
              {shouldShowReleaseNotes ? (
                <div className="mb-5 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-4">
                  <div className="text-base font-semibold text-slate-950">更新说明</div>
                  <div className="mt-3 text-sm leading-7 text-slate-600">{skill.releaseNotes}</div>
                </div>
              ) : null}

              <div className="text-base font-semibold text-slate-950">使用说明</div>
              <div className="mt-4 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-4 text-sm leading-7 text-slate-600">
                {skill.usageInstructions?.trim() || "暂未填写使用说明"}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div
      className={cn(
        "skills-page relative pb-4",
        isManagementModule ? "space-y-4" : "space-y-6",
        isHubModule && "skills-hub-cecloud min-h-[calc(100dvh-5rem)] bg-transparent",
        isManagementModule && !isHubModule && "min-h-[calc(100dvh-5rem)] bg-white"
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden">
        {isHubModule ? (
          <>
            <div className="skills-ambient-orb absolute left-[4%] top-6 h-56 w-56 rounded-full bg-[#f0f6fe] blur-3xl" />
            <div className="skills-ambient-orb skills-ambient-orb-delay absolute right-[8%] top-16 h-64 w-64 rounded-full bg-[#dbe7f4]/35 blur-3xl" />
          </>
        ) : isManagementModule ? null : (
          <>
            <div className="skills-ambient-orb absolute left-[6%] top-8 h-56 w-56 rounded-full bg-cyan-200/35 blur-3xl" />
            <div className="skills-ambient-orb skills-ambient-orb-delay absolute right-[8%] top-24 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="skills-ambient-orb skills-ambient-orb-slow absolute left-[34%] top-36 h-48 w-48 rounded-full bg-slate-200/45 blur-3xl" />
          </>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className={cn(isManagementModule ? "space-y-4" : "space-y-5")}>
        {showTopControlsBar ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <TabsList
            className={cn(
              "inline-grid h-auto w-fit max-w-full rounded-[20px] border border-slate-200/80 bg-white p-1 shadow-sm",
              "grid-cols-2"
            )}
          >
            <TabsTrigger
              value="mine"
              className="h-12 min-w-[156px] justify-center gap-2 rounded-[16px] px-4 py-2 text-sm font-semibold data-[state=active]:border-slate-200 data-[state=active]:bg-slate-50 data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
            >
              <PanelLeft className="h-4 w-4" />
              <span>SKILLS管理</span>
            </TabsTrigger>
            <TabsTrigger
              value="foundry"
              className="h-12 min-w-[156px] justify-center gap-2 rounded-[16px] px-4 py-2 text-sm font-semibold data-[state=active]:border-slate-200 data-[state=active]:bg-slate-50 data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              <span>技能工场</span>
            </TabsTrigger>
          </TabsList>
        </div>
        ) : null}

        {isManagementModule && showExperienceSwitcher ? (
          <div
            className="pointer-events-auto fixed bottom-0 right-0 z-50 flex h-36 w-44 flex-col items-end justify-end pb-4 pr-3 pt-0 md:h-40 md:w-52 md:pr-5 md:pb-5 group/mgmt-version"
            aria-label="右下角版本切换触发区"
          >
            <div
              className={cn(
                "flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-md transition-opacity duration-200",
                "pointer-events-none opacity-0 group-hover/mgmt-version:pointer-events-auto group-hover/mgmt-version:opacity-100"
              )}
            >
              <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">版本</div>
              <div className="relative grid grid-cols-2 rounded-full bg-slate-100 p-1">
                <div
                  aria-hidden
                  className={cn(
                    "absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-slate-900 shadow-sm transition-transform duration-200",
                    isMvpMode ? "translate-x-0" : "translate-x-full"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setExperienceMode("mvp")}
                  className={cn(
                    "relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                    isMvpMode ? "text-white" : "text-slate-600"
                  )}
                >
                  MVP
                </button>
                <button
                  type="button"
                  onClick={() => setExperienceMode("v2")}
                  className={cn(
                    "relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                    isMvpMode ? "text-slate-600" : "text-white"
                  )}
                >
                  迭代版
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isHubModule ? (
          <TabsContent value="marketplace" className="mt-0 space-y-0">
          {selectedMarketplaceDetail ? renderMarketplaceDetailPage(selectedMarketplaceDetail) : (
            <>
          <div className="skills-plaza-canvas relative">
            {showExperienceSwitcher && isHubModule ? (
              <div
                className="pointer-events-auto absolute right-0 top-0 z-40 flex h-28 w-[min(100%,18rem)] flex-col items-end justify-start pt-1 pr-0 md:pr-1 group/hub-version"
                aria-label="版本切换触发区"
              >
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-full px-3 py-2 shadow-md backdrop-blur-sm transition-opacity duration-200",
                    "pointer-events-none opacity-0 group-hover/hub-version:pointer-events-auto group-hover/hub-version:opacity-100",
                    "border border-[#dbe7f4]/90 bg-white"
                  )}
                >
                  <div className="text-[11px] font-semibold tracking-[0.16em] text-[#5a6779]">版本</div>
                  <div className="relative grid grid-cols-2 rounded-full bg-[#f0f6fe] p-1">
                    <div
                      aria-hidden
                      className={cn(
                        "absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-[#2773ff] shadow-[0_10px_24px_-12px_rgba(39,115,255,0.45)] transition-transform duration-200",
                        isMvpMode ? "translate-x-0" : "translate-x-full"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setExperienceMode("mvp")}
                      className={cn(
                        "relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                        isMvpMode ? "text-white" : "text-[#5a6779]"
                      )}
                    >
                      MVP
                    </button>
                    <button
                      type="button"
                      onClick={() => setExperienceMode("v2")}
                      className={cn(
                        "relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                        isMvpMode ? "text-[#5a6779]" : "text-white"
                      )}
                    >
                      迭代版
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="skills-plaza-filter-top flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <span className="skills-plaza-gradient-title skills-display inline-block text-[1.75rem] font-bold leading-tight tracking-tight">
                  技能广场
                </span>
                <p className="mt-1 max-w-xl text-[13px] leading-5 text-[#6e7b8d]">
                  发现、筛选并复用组织内外的标准化技能资产，沉淀为可治理、可扩展的智能体能力。
                </p>
              </div>
              <div className="relative w-full shrink-0 lg:w-[min(320px,100%)]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6e7b8d]" />
                <Input
                  value={marketSearch}
                  onChange={(event) => setMarketSearch(event.target.value)}
                  placeholder="搜索 技能名称、类目或标签"
                  className="h-7 w-full rounded border border-[#e2e8f0] bg-white pl-8 pr-2.5 text-[13px] leading-7 text-[#1e293b] placeholder:text-[#6e7b8d] shadow-none focus-visible:border-[#2773ff]/40 focus-visible:ring-1 focus-visible:ring-[#2773ff]/20"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                <div className="w-11 shrink-0 text-[12px] leading-6 text-[#6e7b8d]">来源</div>
                <div className="flex min-w-0 flex-1 flex-wrap gap-0.5">
                  {SOURCE_FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setMarketSourceFilter(filter.value)}
                      className={cn(
                        "shrink-0",
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

              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                <div className="w-11 shrink-0 text-[12px] leading-6 text-[#6e7b8d]">类目</div>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5">
                  {USER_CATEGORY_FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setAudienceCategoryFilter(filter.value)}
                      className={cn(
                        "shrink-0",
                        getAudienceFilterClass(filter.value, audienceCategoryFilter === filter.value)
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:ml-auto sm:pl-3">
                  <span className="text-[12px] leading-6 text-[#6e7b8d]">排序</span>
                  <div className="inline-flex flex-wrap items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setMarketSortMode("downloads")}
                      className={cn(
                        "shrink-0",
                        getSkillsPlazaCapsuleFilterClass(marketSortMode === "downloads")
                      )}
                    >
                      下载量
                    </button>
                    {!isMvpMode ? (
                      <button
                        type="button"
                        onClick={() => setMarketSortMode("references")}
                        className={cn(
                          "shrink-0",
                          getSkillsPlazaCapsuleFilterClass(marketSortMode === "references")
                        )}
                      >
                        引用量
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setMarketSortMode("updatedAt")}
                      className={cn(
                        "shrink-0",
                        getSkillsPlazaCapsuleFilterClass(marketSortMode === "updatedAt")
                      )}
                    >
                      最新更新
                    </button>
                  </div>
                </div>
              </div>
            </div>

          {filteredMarketplaceSkills.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredMarketplaceSkills.map((skill, index) => {
                const audienceMeta = AUDIENCE_VISUAL_META[skill.audienceCategory];
                const SkillIcon = getMarketplaceSkillIcon(skill);

                return (
                  <article
                    key={skill.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openMarketplaceDetail(skill.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openMarketplaceDetail(skill.id);
                      }
                    }}
                    className={cn(
                      "skills-marketplace-card skills-stagger group relative min-h-0 w-full cursor-pointer overflow-hidden p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2773ff]/30",
                      SKILLS_PLAZA_CARD_CLASS
                    )}
                    style={{ animationDelay: `${index * 55}ms` }}
                  >
                    <div className="relative flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#2773ff] text-white shadow-none">
                            <SkillIcon className="h-6 w-6" />
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <div className="flex w-fit max-w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                              <h3 className="min-w-0 shrink truncate text-base font-semibold leading-normal text-[#1e293b]">
                                {skill.name}
                              </h3>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "inline-flex h-6 shrink-0 items-center rounded-sm border px-1.5 text-[11px] font-semibold leading-none",
                                  audienceMeta.badgeClass
                                )}
                              >
                                {audienceMeta.label}
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] leading-5 text-[#6e7b8d]">
                              <span
                                className={cn(
                                  "font-medium",
                                  skill.sourceType === "platform"
                                    ? "text-[#2773ff]"
                                    : "text-[#334155]"
                                )}
                              >
                                {getMarketplaceSourceText(skill)}
                              </span>
                              <span className="text-[#e2e8f0]">·</span>
                              <span>
                                {skill.sourceType === "platform"
                                  ? `更新于 ${skill.publishedAt}`
                                  : `发布于 ${skill.publishedAt}（${skill.publishedBy}）`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={cn(
                            "inline-flex shrink-0 items-center justify-center rounded p-0.5 text-[#94a3b8] transition-colors",
                            "border-0 bg-transparent shadow-none hover:text-[#64748b]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2773ff]/25 focus-visible:ring-offset-1"
                          )}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggleFavorite(skill.id);
                          }}
                          aria-label={skill.isFavorite ? "取消收藏" : "收藏"}
                          title={skill.isFavorite ? "取消收藏" : "收藏"}
                        >
                          <Star
                            className={cn(
                              "h-[18px] w-[18px] stroke-[1.35]",
                              skill.isFavorite
                                ? "fill-[#fff8e6] text-[#d4a017]"
                                : "fill-transparent text-current"
                            )}
                          />
                        </button>
                      </div>

                      <p className="mt-3 line-clamp-3 min-h-[44px] text-sm leading-[22px] text-[#6e7b8d]">
                        {skill.description}
                      </p>

                      <div className="mt-4 border-t border-[#e2e8f0] pt-3">
                        <div className="flex items-center gap-2 text-[12px] text-[#6e7b8d]">
                          <div className="inline-flex shrink-0 items-center gap-1 rounded border border-transparent bg-[#f1f5f9] px-2 py-1 text-[12px] text-[#475569]">
                            <span className="font-semibold tabular-nums text-[#1e293b]">
                              {skill.downloads.toLocaleString()}
                            </span>
                            <span className="ml-1">下载</span>
                          </div>
                          {skill.declaredDependencies?.length ? (
                            <TooltipProvider delayDuration={120}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={(event) => event.stopPropagation()}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#dbe7f4] bg-[#f8f9fb] px-2.5 py-1 text-[11px] font-medium text-[#2f5fbf] transition-colors hover:border-[#2773ff]/25 hover:bg-white"
                                  >
                                    <Boxes className="h-3 w-3" />
                                    依赖声明
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  align="start"
                                  className="max-w-[260px] rounded-2xl border-[#dbe7f4] bg-white px-3 py-3 text-[#5a6779] shadow-[0_20px_48px_-32px_rgba(39,115,255,0.18)]"
                                >
                                  <div className="space-y-2">
                                    <div className="text-[11px] font-semibold tracking-[0.14em] text-[#5a6779] uppercase">
                                      依赖工具
                                    </div>
                                    <div className="grid gap-1">
                                      {skill.declaredDependencies.map((dependency) => (
                                        <div
                                          key={`${skill.id}-${dependency.id}`}
                                          className="rounded-xl bg-[#f8f9fb] px-2.5 py-1.5 text-[12px] text-[#000000]/80"
                                        >
                                          {dependency.name}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : null}
                          {!isMvpMode ? (
                            <TooltipProvider delayDuration={120}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={(event) => event.stopPropagation()}
                                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#dbe7f4] bg-[#f8f9fb] px-2.5 py-1 text-[11px] text-[#5a6779] transition-colors hover:border-[#2773ff]/25 hover:bg-white hover:text-[#2f5fbf]"
                                  >
                                    <span className="font-semibold text-[#000000]">
                                      {(skill.references ?? 0).toLocaleString()}
                                    </span>
                                    <span>引用</span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  align="start"
                                  className="max-w-[260px] rounded-2xl border-[#dbe7f4] bg-white px-3 py-3 text-[#5a6779] shadow-[0_20px_48px_-32px_rgba(39,115,255,0.18)]"
                                >
                                  <div className="space-y-2">
                                    <div className="text-[11px] font-semibold tracking-[0.14em] text-[#5a6779] uppercase">
                                      引用智能体
                                    </div>
                                    <div className="grid gap-1">
                                      {(skill.referencedAgents ?? []).length > 0 ? (
                                        (skill.referencedAgents ?? []).map((agent) => (
                                          <div
                                            key={`${skill.id}-${agent}`}
                                            className="rounded-xl bg-[#f8f9fb] px-2.5 py-1.5 text-[12px] text-[#000000]/80"
                                          >
                                            {agent}
                                          </div>
                                        ))
                                      ) : (
                                        <div className="rounded-xl bg-[#f8f9fb] px-2.5 py-1.5 text-[12px] text-[#5a6779]">
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
                                className="h-9 rounded-full border border-[#2773ff]/35 bg-white px-3 text-[13px] font-medium text-[#2773ff] shadow-none hover:bg-[#2773ff]/6"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleAddToSkillsFoundry(skill);
                                }}
                              >
                                <FolderPlus className="h-4 w-4" />
                                加入Foundry
                              </Button>
                            ) : null}
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-full border border-[#dbe7f4] bg-white text-[#2773ff] shadow-none hover:border-[#2773ff]/35 hover:bg-[#2773ff]/6"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDownloadTemplate(skill);
                              }}
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
            <div className="mt-6 rounded border border-dashed border-[#e2e8f0] bg-white px-6 py-16 text-center text-sm leading-6 text-[#6e7b8d] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              当前筛选条件下没有匹配的 技能模板，试试切换来源、能力类目或搜索关键词。
            </div>
          )}
          </div>
            </>
          )}
          </TabsContent>
        ) : null}

        {isManagementModule ? (
          <TabsContent
            value="foundry"
            forceMount
            className={cn("space-y-4", activeTab !== "foundry" && "hidden", isMvpMode && "hidden")}
          >
            <SkillsFoundryTab
              pendingTemplate={pendingFoundryTemplate}
              onPendingTemplateHandled={() => {
                setPendingFoundryTemplate(null);
                if (typeof window !== "undefined") {
                  window.sessionStorage.removeItem(PENDING_FOUNDRY_TEMPLATE_STORAGE_KEY);
                }
              }}
            />
          </TabsContent>
        ) : null}

        {isManagementModule ? (
          <TabsContent value="mine" className="space-y-4">
          <input
            ref={importInputRef}
            type="file"
            accept=".zip,application/zip"
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
            <DialogContent className="!w-[min(1120px,calc(100vw-2rem))] !max-w-none max-h-[90vh] overflow-hidden rounded-[30px] border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] p-0 shadow-[0_34px_72px_-36px_rgba(15,23,42,0.36)]">
              <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-[30px]">
                <div className="border-b border-slate-200/70 bg-[linear-gradient(135deg,rgba(240,249,255,0.94),rgba(255,255,255,0.98)_52%,rgba(236,253,245,0.9))] px-6 py-5">
                  <DialogHeader className="gap-2 text-left">
                    <DialogTitle className="skills-display text-[1.6rem] text-slate-950">
                      导入技能
                    </DialogTitle>
                    <DialogDescription className="max-w-2xl text-sm leading-6 text-slate-500">
                      支持从本地压缩包导入，也支持通过 URL 引入 GitHub、skills.sh 或 Clawhub 上的 技能资产。
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="space-y-4 overflow-y-auto px-6 py-5">
                  <Tabs
                    value={importMode}
                    onValueChange={(value) => setImportMode(value as SkillImportMode)}
                    className="space-y-5"
                  >
                    <TabsList className="grid h-auto w-full max-w-[360px] grid-cols-2 rounded-[18px] bg-slate-100/90 p-1">
                      <TabsTrigger value="local" className="rounded-[14px] py-2.5 text-sm">
                        zip上传
                      </TabsTrigger>
                      <TabsTrigger value="url" className="rounded-[14px] py-2.5 text-sm">
                        链接上传
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="local" className="mt-0 space-y-4">
                      <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/88 px-5 py-4">
                        <div className="text-sm font-semibold text-slate-900">导入说明</div>
                        <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
                          <li>1. 上传文件需为合法的 `.zip` 格式压缩包，且文件大小不超过 100MB。</li>
                          <li>2. 压缩包根目录下必须包含 `SKILL.md` 文件。</li>
                          <li>3. `SKILL.md` 中需包含技能 的名称和描述信息，且采用 YAML 格式书写。</li>
                          <li>4. 任一阻断项校验失败时，不允许点击【确认导入】按钮；全部校验通过后才可确认导入。</li>
                        </ol>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
                        <div className="space-y-4">
                          <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.18)]">
                            <div className="flex items-start gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-sky-100/80 bg-sky-50/90 text-sky-700">
                                <Upload className="h-5 w-5" />
                              </div>
                              <div className="space-y-1">
                                <div className="text-base font-semibold text-slate-950">导入文件</div>
                                <div className="text-sm leading-6 text-slate-500">
                                  支持用户上传本地技能 的 `.zip` 压缩文件包
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 rounded-[24px] border border-dashed border-slate-200/90 bg-[linear-gradient(135deg,rgba(248,250,252,0.95),rgba(255,255,255,0.92))] p-5">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="truncate text-sm font-medium text-slate-900">
                                    {localImportFile ? localImportFile.name : "尚未选择导入文件"}
                                  </div>
                                  <div className="text-xs leading-5 text-slate-500">
                                    {localImportValidation.status === "validating"
                                      ? "正在校验压缩包结构和 SKILL.md 内容..."
                                      : localImportValidation.status === "valid"
                                        ? "所有阻断项校验已通过，可确认导入"
                                        : localImportValidation.status === "invalid"
                                          ? localImportValidation.errors[0]
                                          : "请选择本地 `.zip` 技能压缩包"}
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
                                  是否为合法 zip、是否可正常解压、是否未超过 100MB
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
                                  校验压缩包根目录是否存在 `SKILL.md`
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
                                  校验 YAML 格式以及 `name`、`description`
                                </div>
                              </div>
                            </div>

                            {localImportValidation.status === "invalid" ? (
                              <div className="mt-4 rounded-[22px] border border-rose-200/80 bg-rose-50/75 px-4 py-3 text-sm text-rose-700">
                                <div className="flex items-center gap-2 font-medium">
                                  <AlertTriangle className="h-4 w-4" />
                                  校验未通过
                                </div>
                                <div className="mt-2 leading-6">{localImportValidation.errors[0]}</div>
                              </div>
                            ) : null}
                          </div>

                          <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.18)]">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={importDependencyEnabled}
                                onCheckedChange={(checked) => setImportDependencyEnabled(Boolean(checked))}
                                disabled={!isLocalImportParsed}
                                className="mt-1"
                              />
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="text-sm font-semibold text-slate-900">技能依赖 MCP 或 插件</div>
                                <div className="text-xs leading-5 text-slate-500">
                                  非必填，用户可自愿声明。勾选有依赖工具后，广场上的技能 卡片会展示“依赖声明”提示。
                                </div>
                              </div>
                            </div>

                            {!isLocalImportParsed ? (
                              <div className="mt-4 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-xs leading-5 text-slate-500">
                                完成压缩包解析后，可继续声明该技能 依赖的 MCP 或插件。
                              </div>
                            ) : null}

                            {importDependencyEnabled && isLocalImportParsed ? (
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
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.18)]">
                            {!isLocalImportParsed ? (
                              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200/90 bg-[radial-gradient(circle_at_top,rgba(240,249,255,0.95),rgba(255,255,255,0.96)_58%,rgba(248,250,252,0.98))] px-8 py-10 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-slate-200/80 bg-white/90 text-slate-500 shadow-[0_18px_36px_-26px_rgba(15,23,42,0.3)]">
                                  <FileCode2 className="h-6 w-6" />
                                </div>
                                <div className="mt-5 text-lg font-semibold text-slate-950">
                                  解析成功后补充展示信息
                                </div>
                                <div className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                  完成文件解析后，可在此补充展示名称、展示描述和技能使用说明。
                                </div>
                                <div className="mt-5 flex flex-wrap justify-center gap-2">
                                  <span className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600">
                                    展示名称
                                  </span>
                                  <span className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600">
                                    展示描述
                                  </span>
                                  <span className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600">
                                    技能使用说明
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex flex-col gap-3 rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.92),rgba(255,255,255,0.95))] px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                                      <BadgeCheck className="h-4 w-4 text-emerald-600" />
                                      <span>✅已解析Skill基础信息</span>
                                    </div>
                                    <div className="text-xs leading-5 text-emerald-700/90">
                                      已成功读取 `SKILL.md` 中的原始名称与描述信息，可继续补充平台面向终端用户的展示信息。
                                    </div>
                                  </div>

                                  {localImportValidation.manifest ? (
                                    <TooltipProvider delayDuration={100}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            type="button"
                                            className="inline-flex items-center rounded-full border border-emerald-200/80 bg-white/85 px-3 py-1 text-xs font-medium text-emerald-700"
                                          >
                                            查看原始元信息
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          side="left"
                                          className="max-w-[320px] rounded-2xl border border-slate-200/80 bg-white/96 p-3 text-left text-xs leading-5 text-slate-600"
                                        >
                                          <div>
                                            <span className="font-semibold text-slate-900">name：</span>
                                            {localImportValidation.manifest.name}
                                          </div>
                                          <div className="mt-2">
                                            <span className="font-semibold text-slate-900">description：</span>
                                            {localImportValidation.manifest.description}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : null}
                                </div>

                                <div className="space-y-4 rounded-[22px] border border-slate-200/80 bg-slate-50/65 p-4">
                                  <div className="space-y-1">
                                    <div className="text-sm font-semibold text-slate-900">平台展示名称 / 描述</div>
                                    <div className="text-xs leading-5 text-slate-500">
                                      该名称与描述主要用于 技能广场、技能详情页等面向使用者的展示场景；若不填写，则默认使用 `SKILL.md` 中的原始 name 和 description。
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <Label htmlFor="local-import-display-name" className="text-sm text-slate-700">
                                        展示名称
                                      </Label>
                                      <span className="text-[11px] text-slate-400">
                                        {localImportDisplayName.length}/100
                                      </span>
                                    </div>
                                    <Input
                                      id="local-import-display-name"
                                      value={localImportDisplayName}
                                      maxLength={100}
                                      onChange={(event) => setLocalImportDisplayName(event.target.value)}
                                      placeholder="建议填写中文名称，不填则使用该SKILL名称对外展示"
                                      className="h-11 rounded-2xl border-slate-200/80 bg-white/95"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <Label
                                        htmlFor="local-import-display-description"
                                        className="text-sm text-slate-700"
                                      >
                                        展示描述
                                      </Label>
                                      <span className="text-[11px] text-slate-400">
                                        {localImportDisplayDescription.length}/500
                                      </span>
                                    </div>
                                    <Textarea
                                      id="local-import-display-description"
                                      value={localImportDisplayDescription}
                                      maxLength={500}
                                      onChange={(event) =>
                                        setLocalImportDisplayDescription(event.target.value)
                                      }
                                      placeholder="建议填写中文易懂的描述，不填则使用该skill的description对外展示"
                                      className="min-h-[120px] rounded-[22px] border-slate-200/80 bg-white/95"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2 rounded-[22px] border border-slate-200/80 bg-slate-50/65 p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <Label
                                      htmlFor="local-import-usage-instructions"
                                      className="text-sm font-semibold text-slate-900"
                                    >
                                      技能使用说明
                                    </Label>
                                    <span className="text-[11px] text-slate-400">
                                      {localImportUsageInstructions.length}/1000
                                    </span>
                                  </div>
                                  <div className="text-xs leading-5 text-slate-500">
                                    支持用户填写该技能 的使用说明，后续可在 技能广场卡片和 技能详情页中展示。若用户未填写，则详情页该部分为空。
                                  </div>
                                  <Textarea
                                    id="local-import-usage-instructions"
                                    value={localImportUsageInstructions}
                                    maxLength={1000}
                                    onChange={(event) => setLocalImportUsageInstructions(event.target.value)}
                                    placeholder={
                                      "用户应向 Agent 输入什么样的信息来使用该技能\nAgent 会基于该技能 完成什么处理\n预期会输出什么结果"
                                    }
                                    className="min-h-[160px] rounded-[22px] border-slate-200/80 bg-white/95"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="url" className="mt-0 space-y-4">
                      <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/88 p-5">
                        <div className="text-sm font-semibold text-slate-900">链接导入说明</div>
                        <div className="mt-2 text-sm leading-6 text-slate-500">
                          支持通过链接导入技能。当前支持 GitHub、skills.sh 和 ClawHub 三类来源，系统会先解析链接，再进行远程拉取与内容校验。
                        </div>
                        <ol className="mt-3 space-y-2 pl-5 text-sm leading-6 text-slate-500">
                          <li>请先选择正确的链接来源，并填写对应的 技能链接。</li>
                          <li>点击“解析技能”后，系统会读取该技能 的原始名称与描述信息，便于确认导入对象。</li>
                          <li>确认无误后，可继续补充展示名称、展示描述和技能使用说明，再完成导入。</li>
                        </ol>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
                        <div className="space-y-4">
                          <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.18)]">
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-semibold text-slate-900">链接来源</Label>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {IMPORT_URL_SOURCE_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    const active = importUrlSource === option.value;

                                    return (
                                      <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                          setImportUrlSource(option.value);
                                          resetUrlImportParsedState();
                                        }}
                                        className={cn(
                                          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all",
                                          active
                                            ? "border-slate-900 bg-slate-900 text-white shadow-[0_12px_24px_-18px_rgba(15,23,42,0.75)]"
                                            : "border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                      >
                                        <Icon className="h-4 w-4" />
                                        {option.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="skill-import-url">URL链接</Label>
                                  <TooltipProvider delayDuration={120}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200/80 bg-white text-[11px] text-slate-500"
                                        >
                                          ?
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent className="rounded-2xl border border-slate-200/80 bg-white/96 px-3 py-2 text-xs text-slate-600">
                                        支持导入 GitHub、skills.sh、ClawHub 链接
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                  <Input
                                    id="skill-import-url"
                                    value={importUrlValue}
                                    onChange={(event) => {
                                      setImportUrlValue(event.target.value);
                                      resetUrlImportParsedState();
                                    }}
                                    placeholder={getImportUrlPlaceholder()}
                                    aria-invalid={Boolean(importUrlError)}
                                    className={cn(
                                      "h-11 rounded-2xl bg-white/95 sm:flex-1",
                                      importUrlError
                                        ? "border-rose-200/90 text-rose-700 focus-visible:border-rose-300 focus-visible:ring-rose-100"
                                        : "border-slate-200/80"
                                    )}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11 rounded-2xl border-slate-200/80 bg-white px-4 text-slate-700 hover:bg-slate-50 disabled:border-slate-200/80 disabled:bg-slate-100 disabled:text-slate-400"
                                    disabled={!canParseUrlImport}
                                    onClick={handleParseImportFromUrl}
                                  >
                                    {remoteImportLoading ? (
                                      <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Search className="h-4 w-4" />
                                    )}
                                    解析技能
                                  </Button>
                                </div>
                                <p
                                  className={cn(
                                    "text-xs",
                                    importUrlError ? "font-medium text-rose-600" : "text-slate-500"
                                  )}
                                >
                                  {importUrlError || getImportUrlHint(importUrlSource)}
                                </p>
                              </div>

                              {urlImportValidation.status === "invalid" ? (
                                <div className="rounded-[22px] border border-rose-200/80 bg-rose-50/75 px-4 py-3 text-sm text-rose-700">
                                  <div className="flex items-center gap-2 font-medium">
                                    <AlertTriangle className="h-4 w-4" />
                                    解析失败
                                  </div>
                                  <div className="mt-2 leading-6">{urlImportValidation.errors[0]}</div>
                                </div>
                              ) : null}

                              {urlImportValidation.manifest ? (
                                <div className="rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.92),rgba(255,255,255,0.96))] p-4">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                                    已解析到 技能原始信息
                                  </div>
                                  <div className="mt-3 grid gap-3">
                                    <div className="rounded-[18px] border border-white/80 bg-white/85 px-4 py-3">
                                      <div className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                                        原始名称
                                      </div>
                                      <div className="mt-1 text-sm font-medium text-slate-900">
                                        {urlImportValidation.manifest.name}
                                      </div>
                                    </div>
                                    <div className="rounded-[18px] border border-white/80 bg-white/85 px-4 py-3">
                                      <div className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                                        原始描述
                                      </div>
                                      <div className="mt-1 text-sm leading-6 text-slate-600">
                                        {urlImportValidation.manifest.description}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>

                        </div>

                        <div className="space-y-4">
                          <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.18)]">
                            {!isUrlImportParsed ? (
                              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200/90 bg-[radial-gradient(circle_at_top,rgba(240,249,255,0.95),rgba(255,255,255,0.96)_58%,rgba(248,250,252,0.98))] px-8 py-10 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-slate-200/80 bg-white/90 text-slate-500 shadow-[0_18px_36px_-26px_rgba(15,23,42,0.3)]">
                                  <Github className="h-6 w-6" />
                                </div>
                                <div className="mt-5 text-lg font-semibold text-slate-950">
                                  解析成功后补充展示信息
                                </div>
                                <div className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                  完成链接解析后，可在此补充展示名称、展示描述和技能使用说明。
                                </div>
                                <div className="mt-5 flex flex-wrap justify-center gap-2">
                                  <span className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600">
                                    展示名称
                                  </span>
                                  <span className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600">
                                    展示描述
                                  </span>
                                  <span className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600">
                                    技能使用说明
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="space-y-4 rounded-[22px] border border-slate-200/80 bg-slate-50/65 p-4">
                                  <div className="space-y-1">
                                    <div className="text-sm font-semibold text-slate-900">平台展示名称 / 描述</div>
                                    <div className="text-xs leading-5 text-slate-500">
                                      该名称与描述主要用于 技能广场、技能详情页等面向使用者的展示场景；若不填写，则默认使用远程技能 中的原始 name 和 description。
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <Label htmlFor="url-import-display-name" className="text-sm text-slate-700">
                                        展示名称
                                      </Label>
                                      <span className="text-[11px] text-slate-400">
                                        {urlImportDisplayName.length}/100
                                      </span>
                                    </div>
                                    <Input
                                      id="url-import-display-name"
                                      value={urlImportDisplayName}
                                      maxLength={100}
                                      onChange={(event) => setUrlImportDisplayName(event.target.value)}
                                      placeholder="建议填写中文名称，不填则使用该SKILL名称对外展示"
                                      className="h-11 rounded-2xl border-slate-200/80 bg-white/95"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <Label
                                        htmlFor="url-import-display-description"
                                        className="text-sm text-slate-700"
                                      >
                                        展示描述
                                      </Label>
                                      <span className="text-[11px] text-slate-400">
                                        {urlImportDisplayDescription.length}/500
                                      </span>
                                    </div>
                                    <Textarea
                                      id="url-import-display-description"
                                      value={urlImportDisplayDescription}
                                      maxLength={500}
                                      onChange={(event) => setUrlImportDisplayDescription(event.target.value)}
                                      placeholder="建议填写中文易懂的描述，不填则使用该skill的description对外展示"
                                      className="min-h-[120px] rounded-[22px] border-slate-200/80 bg-white/95"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2 rounded-[22px] border border-slate-200/80 bg-slate-50/65 p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <Label
                                      htmlFor="url-import-usage-instructions"
                                      className="text-sm font-semibold text-slate-900"
                                    >
                                      技能使用说明
                                    </Label>
                                    <span className="text-[11px] text-slate-400">
                                      {urlImportUsageInstructions.length}/1000
                                    </span>
                                  </div>
                                  <div className="text-xs leading-5 text-slate-500">
                                    支持用户填写该技能 的使用说明，后续可在 技能广场卡片和 技能详情页中展示。若用户未填写，则详情页该部分为空。
                                  </div>
                                  <Textarea
                                    id="url-import-usage-instructions"
                                    value={urlImportUsageInstructions}
                                    maxLength={1000}
                                    onChange={(event) => setUrlImportUsageInstructions(event.target.value)}
                                    placeholder={
                                      "用户应向 Agent 输入什么样的信息来使用该技能\nAgent 会基于该技能 完成什么处理\n预期会输出什么结果"
                                    }
                                    className="min-h-[160px] rounded-[22px] border-slate-200/80 bg-white/95"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

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
                        disabled={!canConfirmUrlImport}
                        onClick={handleConfirmImportFromUrl}
                      >
                        <Upload className="h-4 w-4" />
                        确认导入
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {useUnifiedSkillsManagementView ? (
            <>
            {selectedMySkillDetail ? renderMySkillDetailPage(selectedMySkillDetail) : (
            <div>
                {/* list-page: 主标题 */}
                <div className="mb-5 flex flex-shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <h2 className="text-[20px] font-medium leading-8 tracking-normal text-[#0f172a]">
                    SKILLS管理
                  </h2>
                  {/** list-page §4：强视觉主按钮（Arco primary default），不用 shadcn Button 以免 h-9 / rounded-md 覆盖 */}
                  <button
                    type="button"
                    className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[4px] border border-transparent bg-[#2773ff] px-4 text-[12px] font-semibold leading-[1.5715] text-white shadow-none transition-all duration-100 ease-linear hover:bg-[#1f66f0] active:bg-[#1956d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2773ff]/35 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50"
                    onClick={openImportDialog}
                  >
                    <Upload className="pointer-events-none h-4 w-4 shrink-0 opacity-100" aria-hidden />
                    导入技能
                  </button>
                </div>

                {/* list-page: 工具条（筛选 + 搜索） */}
                <div className="mb-4 flex flex-shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="-mb-px flex flex-wrap gap-5 border-b border-slate-200">
                    {MY_SKILL_STATUS_FILTERS.map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setMySkillStatusFilter(filter.value)}
                        className={cn(
                          "transition-colors duration-100",
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
                  <div className="relative w-full min-w-0 lg:max-w-[320px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={mySkillSearch}
                      onChange={(event) => setMySkillSearch(event.target.value)}
                      placeholder="搜索 SKILLS管理"
                      className="h-8 rounded border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-none focus-visible:border-[#2773ff]/40 focus-visible:ring-[#dbe7f4]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table className="min-w-[1120px]">
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-slate-200 hover:bg-slate-50">
                        <TableHead className="h-9 px-4 text-left text-xs font-semibold text-slate-600">
                          名称
                        </TableHead>
                        <TableHead className="h-9 px-4 text-left text-xs font-semibold text-slate-600">
                          创建人
                        </TableHead>
                        <TableHead className="h-9 px-4 text-left text-xs font-semibold text-slate-600">
                          发布状态
                        </TableHead>
                        <TableHead className="h-9 px-4 text-left text-xs font-semibold text-slate-600">
                          描述
                        </TableHead>
                        <TableHead className="h-9 px-4 text-left text-xs font-semibold text-slate-600">
                          更新时间
                        </TableHead>
                        <TableHead className="h-9 px-4 text-left text-xs font-semibold text-slate-600">
                          操作
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMySkills.length === 0 ? (
                        <TableRow className="border-0 hover:bg-transparent">
                          <TableCell colSpan={6} className="px-6 py-16 text-center">
                            <div className="mx-auto max-w-md space-y-3">
                              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-400">
                                <Search className="h-5 w-5" />
                              </div>
                              <div className="text-base font-semibold text-slate-900">暂无匹配结果</div>
                              <p className="text-sm leading-6 text-slate-500">
                                没有匹配的技能，试试换个关键词，或者导入一个本地技能。
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMySkills.map((skill, rowIndex) => {
                          const audienceCategory = mapEditorCategoryToAudienceCategory(skill.category);
                          const SkillIcon = getMarketplaceSkillIcon({
                            name: skill.name,
                            audienceCategory,
                          });
                          const statusMeta = getSkillStatusMeta(skill.status);
                          const StatusIcon = statusMeta.icon;
                          const releaseAction = getSkillReleaseActionMeta(skill);
                          const statusVersionLabel = skill.version
                            ? skill.status === "draft" && hasPublishedHistory(skill)
                              ? `历史 ${formatSkillVersion(skill.version)}`
                              : formatSkillVersion(skill.version)
                            : null;

                          const rowActionClass =
                            "inline-flex h-auto items-center rounded px-1 py-1 text-xs font-semibold text-[#2773ff] transition-colors hover:bg-[#f0f6fe] hover:text-[#2f5fbf]";

                          return (
                            <TableRow
                              key={skill.id}
                              className={cn(
                                "border-slate-200 transition-colors duration-100 hover:bg-slate-50",
                                rowIndex % 2 === 1 && "bg-slate-50/60"
                              )}
                            >
                              <TableCell className="px-4 py-3 align-top text-sm leading-[1.5715] text-slate-800">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[#dbe7f4] bg-[#eef4ff] text-[#2773ff]">
                                    <SkillIcon className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 space-y-0.5">
                                    <button
                                      type="button"
                                      onClick={() => openMySkillDetail(skill.id)}
                                      className="skills-display block text-left text-sm font-semibold text-slate-900 transition-colors hover:text-[#2773ff]"
                                    >
                                      {skill.name}
                                    </button>
                                    <div className="text-xs text-slate-500">{skill.id}</div>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="px-4 py-3 align-top text-sm leading-[1.5715] text-slate-800">
                                <div className="space-y-0.5">
                                  <div className="font-medium text-slate-800">{skill.createdBy}</div>
                                  <div className="text-xs text-slate-500">
                                    {skill.source === "template"
                                      ? "模板导入"
                                      : skill.source === "imported"
                                        ? "本地导入"
                                        : "空白创建"}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="px-4 py-3 align-top whitespace-nowrap text-sm">
                                <div className="inline-flex items-center gap-2">
                                  <span
                                    className={cn(
                                      SKILL_STATUS_ARCO_TAG_FRAME,
                                      getSkillStatusArcoTagClass(skill.status)
                                    )}
                                  >
                                    <StatusIcon className="h-3 w-3 shrink-0" />
                                    {statusMeta.label}
                                  </span>
                                  {statusVersionLabel ? (
                                    <span className="whitespace-nowrap text-xs font-medium text-slate-500">
                                      {statusVersionLabel}
                                    </span>
                                  ) : null}
                                </div>
                              </TableCell>

                              <TableCell className="px-4 py-3 align-top text-sm leading-[1.5715] text-slate-600">
                                <p className="line-clamp-2 max-w-[520px]">{skill.description}</p>
                              </TableCell>

                              <TableCell className="px-4 py-3 align-top text-sm leading-[1.5715] text-slate-800">
                                <div className="space-y-0.5">
                                  <div className="font-medium text-slate-800">{skill.updatedAt}</div>
                                  <div className="text-xs text-slate-500">更新人：{skill.updatedBy}</div>
                                </div>
                              </TableCell>

                              <TableCell className="px-4 py-3 align-top">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <button
                                    type="button"
                                    className={rowActionClass}
                                    onClick={() => handleExportMySkill(skill.id)}
                                  >
                                    导出
                                  </button>
                                  <button
                                    type="button"
                                    className={cn(
                                      rowActionClass,
                                      releaseAction.disabled &&
                                        "text-[#cbd5e1] hover:bg-transparent hover:text-[#cbd5e1]"
                                    )}
                                    onClick={() => openReleaseDialog(skill.id)}
                                    disabled={releaseAction.disabled}
                                  >
                                    {releaseAction.label}
                                  </button>
                                  <button
                                    type="button"
                                    className={rowActionClass}
                                    onClick={() => handleDeleteMySkill(skill.id)}
                                  >
                                    删除
                                  </button>
                                  <button
                                    type="button"
                                    className={cn(
                                      rowActionClass,
                                      skill.status !== "published" &&
                                        "text-[#cbd5e1] hover:bg-transparent hover:text-[#cbd5e1]"
                                    )}
                                    onClick={() => handleOfflineMySkill(skill.id)}
                                    disabled={skill.status !== "published"}
                                  >
                                    下架
                                  </button>
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
	            )}

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
                                当前技能 文件
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
                    resetReleaseDraft();
                  }
                }}
              >
                <DialogContent className="!w-[min(1180px,calc(100vw-2rem))] !max-w-none max-h-[90vh] overflow-hidden rounded-[28px] border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] p-0 shadow-[0_30px_60px_-32px_rgba(15,23,42,0.35)]">
                  <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-[28px]">
                    <div className="border-b border-slate-200/70 bg-[linear-gradient(135deg,rgba(240,249,255,0.95),rgba(255,255,255,0.96)_55%,rgba(236,253,245,0.9))] px-6 py-5">
                      <DialogHeader className="gap-1 text-left">
                        <DialogTitle className="skills-display text-[1.5rem] text-slate-950">
                          {releaseMode === "publish"
                            ? "提交技能 发布"
                            : hasPublishedHistory(
                                updateTargetSkill ?? {
                                  status: "draft",
                                  publishedTemplateId: undefined,
                                  hasPublishedHistory: false,
                                }
                              )
                              && updateTargetSkill?.status !== "published"
                              ? "提交技能 更新发布"
                              : "提交技能 更新"}
                        </DialogTitle>
                        <DialogDescription className="text-sm leading-6 text-slate-500">
                          {isPublishRelease
                            ? "补充展示信息、发布范围与 技能类型。首次发布将默认以 v1.0 提交审核。"
                            : "补充展示信息、版本、发布说明与发布配置。提交后会进入审核中状态。"}
                        </DialogDescription>
                      </DialogHeader>
                    </div>

                    <div className="space-y-5 overflow-y-auto px-6 py-5">
                      {releaseMode === "update" ? (
                        <>
                          <input
                            ref={releaseImportInputRef}
                            type="file"
                            accept=".zip,application/zip"
                            className="hidden"
                            onChange={handleReleaseImportFileSelection}
                          />

                          <Tabs
                            value={releaseImportMode}
                            onValueChange={(value) => setReleaseImportMode(value as SkillImportMode)}
                            className="space-y-4"
                          >
                            <TabsList className="grid h-auto w-full max-w-[320px] grid-cols-2 rounded-[18px] bg-slate-100/90 p-1">
                              <TabsTrigger value="local" className="rounded-[14px] py-2.5 text-sm">
                                zip上传
                              </TabsTrigger>
                              <TabsTrigger value="url" className="rounded-[14px] py-2.5 text-sm">
                                链接上传
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="local" className="mt-0 space-y-4">
                              <div className="rounded-[24px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.18)]">
                                <div className="text-sm font-semibold text-slate-900">更新包</div>
                                <div className="mt-2 text-sm leading-6 text-slate-500">
                                  支持通过本地 `.zip` 技能包替换当前技能内容，并沿用原技能 ID 进入新版本审核。
                                </div>

                                <div className="mt-5 rounded-[22px] border border-dashed border-slate-200/90 bg-[linear-gradient(135deg,rgba(248,250,252,0.95),rgba(255,255,255,0.92))] p-5">
                                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium text-slate-900">
                                        {releaseImportFile ? releaseImportFile.name : "尚未选择更新包"}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {releaseImportValidation.status === "validating"
                                          ? "正在校验压缩包结构和 SKILL.md 内容..."
                                          : releaseImportValidation.status === "valid"
                                            ? "校验通过，可提交更新"
                                            : releaseImportValidation.status === "invalid"
                                              ? releaseImportValidation.errors[0]
                                              : "请先选择更新 zip 包"}
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      className="h-11 rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-800"
                                      onClick={() => releaseImportInputRef.current?.click()}
                                    >
                                      <Upload className="h-4 w-4" />
                                      选择更新包
                                    </Button>
                                  </div>
                                </div>

                                {releaseImportValidation.status === "valid" && releaseImportValidation.manifest ? (
                                  <div className="mt-4 rounded-[18px] border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
                                    <div className="font-medium">{releaseImportValidation.manifest.name}</div>
                                    <div className="mt-1 text-xs leading-5 text-emerald-700">
                                      {releaseImportValidation.manifest.description}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </TabsContent>

                            <TabsContent value="url" className="mt-0 space-y-4">
                              <div className="rounded-[24px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.18)]">
                                <div className="text-sm font-semibold text-slate-900">链接更新</div>
                                <div className="mt-2 text-sm leading-6 text-slate-500">
                                  支持通过 GitHub、skill.sh 或 Clawhub 链接拉取内容，作为当前技能 的新版本提交审核。
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  {IMPORT_URL_SOURCE_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    const active = releaseImportUrlSource === option.value;

                                    return (
                                      <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setReleaseImportUrlSource(option.value)}
                                        className={cn(
                                          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all",
                                          active
                                            ? "border-slate-900 bg-slate-900 text-white shadow-[0_12px_24px_-18px_rgba(15,23,42,0.75)]"
                                            : "border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                      >
                                        <Icon className="h-4 w-4" />
                                        {option.label}
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="mt-4 space-y-2">
                                  <Label htmlFor="skill-release-url">更新链接</Label>
                                  <Input
                                    id="skill-release-url"
                                    value={releaseImportUrlValue}
                                    onChange={(event) => setReleaseImportUrlValue(event.target.value)}
                                    placeholder={getImportUrlPlaceholder()}
                                    aria-invalid={Boolean(releaseImportUrlError)}
                                    className={cn(
                                      "h-11 rounded-2xl bg-white/95",
                                      releaseImportUrlError
                                        ? "border-rose-200/90 text-rose-700 focus-visible:border-rose-300 focus-visible:ring-rose-100"
                                        : "border-slate-200/80"
                                    )}
                                  />
                                  <p className={cn("text-xs", releaseImportUrlError ? "font-medium text-rose-600" : "text-slate-500")}>
                                    {releaseImportUrlError || getImportUrlHint(releaseImportUrlSource)}
                                  </p>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </>
                      ) : null}

                      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)]">
                        <div className="space-y-5">
                          <div className="space-y-4 rounded-[22px] border border-slate-200/80 bg-slate-50/65 p-4">
                            <div className="space-y-1">
                              <div className="text-sm font-semibold text-slate-900">平台展示名称 / 描述</div>
                              <div className="text-xs leading-5 text-slate-500">
                                该名称与描述主要用于 技能广场、技能详情页等面向使用者的展示场景；默认复用当前展示名称和展示描述，可按本次发布需要调整。
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="skill-release-display-name" className="text-sm text-slate-700">
                                  展示名称
                                </Label>
                                <span className="text-[11px] text-slate-400">
                                  {releaseDisplayNameInput.length}/100
                                </span>
                              </div>
                              <Input
                                id="skill-release-display-name"
                                value={releaseDisplayNameInput}
                                maxLength={100}
                                onChange={(event) => setReleaseDisplayNameInput(event.target.value)}
                                placeholder="建议填写中文名称，不填则沿用当前展示名称"
                                className="h-11 rounded-2xl border-slate-200/80 bg-white/95"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="skill-release-display-description" className="text-sm text-slate-700">
                                  展示描述
                                </Label>
                                <span className="text-[11px] text-slate-400">
                                  {releaseDisplayDescriptionInput.length}/500
                                </span>
                              </div>
                              <Textarea
                                id="skill-release-display-description"
                                value={releaseDisplayDescriptionInput}
                                maxLength={500}
                                onChange={(event) => setReleaseDisplayDescriptionInput(event.target.value)}
                                placeholder="建议填写中文易懂的描述，不填则沿用当前展示描述"
                                className="min-h-[128px] rounded-[22px] border-slate-200/80 bg-white/95"
                              />
                            </div>
                          </div>

                          {!isPublishRelease ? (
                            <div className="grid gap-5 lg:grid-cols-[minmax(220px,0.42fr)_minmax(0,1fr)]">
                              <div className="space-y-2 rounded-[22px] border border-slate-200/80 bg-white/92 p-4">
                                <Label htmlFor="skill-update-version">版本号</Label>
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
                                <p
                                  className={cn(
                                    "text-xs",
                                    updateVersionError ? "font-medium text-rose-600" : "text-slate-500"
                                  )}
                                >
                                  {updateVersionError ||
                                    `当前版本 ${formatSkillVersion(updateCurrentVersion)}，支持 \`1.1\` 或 \`1.1.2\` 这类格式。`}
                                </p>
                              </div>

                              <div className="space-y-2 rounded-[22px] border border-slate-200/80 bg-white/92 p-4">
                                <Label htmlFor="skill-release-notes">发布说明</Label>
                                <Textarea
                                  id="skill-release-notes"
                                  value={releaseNotesInput}
                                  onChange={(event) => setReleaseNotesInput(event.target.value)}
                                  placeholder="请说明本次发布/更新新增了什么、修复了什么、是否有兼容性影响。"
                                  className="min-h-[124px] rounded-[22px] border-slate-200/80 bg-white/95 px-4 py-3 text-sm leading-6"
                                />
                                <p className="text-xs text-slate-500">
                                  类似提交 PR 时的说明，便于审核人快速判断本次变更内容。
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-5">
                          <div className="rounded-[24px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.16)]">
                            <div className="space-y-3">
                              <Label>发布范围</Label>
                              <div className="grid gap-3 md:grid-cols-2">
                                {PUBLISH_SCOPE_OPTIONS.map((option) => {
                                  const Icon = option.icon;
                                  const active = releaseScope === option.value;

                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => setReleaseScope(option.value)}
                                      className={cn(
                                        "rounded-[20px] border px-4 py-4 text-left transition-all",
                                        active
                                          ? "border-slate-900 bg-slate-950 text-white shadow-[0_22px_42px_-28px_rgba(15,23,42,0.45)]"
                                          : "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                      )}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div
                                          className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-[14px] border",
                                            active
                                              ? "border-white/20 bg-white/10 text-white"
                                              : "border-slate-200/80 bg-slate-50 text-slate-600"
                                          )}
                                        >
                                          <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-1">
                                          <div className="text-sm font-semibold">{option.label}</div>
                                          <div className={cn("text-xs leading-5", active ? "text-slate-200" : "text-slate-500")}>
                                            {option.hint}
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 rounded-[24px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.16)]">
                            <Label htmlFor="skill-release-category">Skill类型</Label>
                            <Select
                              value={releaseCategory}
                              onValueChange={setReleaseCategory}
                              options={CATEGORY_OPTIONS}
                              className="h-11 rounded-2xl border-slate-200/80 bg-white/95"
                            />
                            <p className="text-xs text-slate-500">发布后会按该类型进入 技能广场对应分类。</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="border-t border-slate-200/70 px-6 py-4">
                      <Button
                        variant="outline"
                        className="rounded-2xl border-slate-200/80 bg-white hover:bg-slate-50"
                        onClick={() => {
                          setUpdateDialogOpen(false);
                          resetReleaseDraft();
                        }}
                      >
                        取消
                      </Button>
                      <Button
                        className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                        onClick={handleSubmitRelease}
                        disabled={!canSubmitRelease}
                      >
                        {releaseRemoteImportLoading ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : releaseMode === "publish" ? (
                          <Rocket className="h-4 w-4" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        提交审核
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
	            </>
          ) : (
            <Card className="overflow-hidden rounded-[30px] border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] shadow-[0_28px_60px_-46px_rgba(15,23,42,0.32)] backdrop-blur-sm">
              <CardHeader className="gap-4 border-b border-slate-200/70 bg-[radial-gradient(circle_at_top_left,rgba(224,242,254,0.4),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.92))] pb-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="skills-display text-[1.85rem] text-slate-950">
                      SKILLS管理
                    </CardTitle>
                    <CardDescription className="max-w-2xl leading-6 text-slate-500">
                      支持导入本地压缩包或 URL 链接，继续编辑文件内容、保存修改，并发布到 技能广场。
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
                      onClick={openImportDialog}
                    >
                      <Upload className="h-4 w-4" />
                      导入技能
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
                      发布到技能广场
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
                            ? `${mySkills.length} 个技能 · ${totalMySkillFileCount} 个文件`
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
                          全部技能
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
                          <Label>技能名称</Label>
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
                          <Label>技能描述</Label>
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
                        <span
                          className={cn(
                            SKILL_STATUS_ARCO_TAG_FRAME,
                            getSkillStatusArcoTagClass(activeSkill.status)
                          )}
                        >
                          {activeSkill.status === "published"
                            ? "已发布"
                            : activeSkill.status === "reviewing"
                              ? "审核中"
                              : activeSkill.status === "reviewFailed"
                                ? "审核失败"
                                : "草稿"}
                        </span>
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
                  还没有任何技能，先导入一个本地压缩包或 URL 链接吧。
                </div>
              )}
            </CardContent>
          </Card>
          )}
          </TabsContent>
        ) : null}
      </Tabs>

      <style jsx>{`
        .skills-page {
          --skills-display-font: "Songti SC", "Noto Serif SC", "STSong", serif;
          --skills-body-font: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
          font-family: var(--skills-body-font);
        }

        .skills-hub-cecloud {
          --skills-display-font: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
        }

        .skills-display {
          font-family: var(--skills-display-font);
          letter-spacing: -0.04em;
        }

        .skills-hub-cecloud .skills-display {
          letter-spacing: -0.02em;
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
