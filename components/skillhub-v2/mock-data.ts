import type { SkillRecord, SkillVersion, SkillWorkOrder } from "./types";

const PPT_FILES = [
  {
    path: "SKILL.md",
    content: `---
name: ppt-master
description: AI-driven multi-format SVG presentation generator.
---

# 使用方式

读取输入材料，规划叙事结构并生成可编辑的演示文稿。

# 运行要求

- 优先复用品牌模板
- 输出前执行结构与依赖检查
`,
  },
  {
    path: "skill.json",
    content: `{
  "name": "ppt-master",
  "entry": "src/main.py",
  "runtime": "python3.11",
  "qualityGate": null
}`,
  },
  {
    path: "src/main.py",
    content: `from parser import read_source

def run(source):
    outline = read_source(source)
    return {"outline": outline, "status": "ready"}
`,
  },
  {
    path: "src/parser.py",
    content: `def looks_like_header(row):
    return any(isinstance(value, str) for value in row)

def positional_columns(row):
    return [f"column_{index + 1}" for index, _ in enumerate(row)]

def read(file):
    first = peek(file)
    header = first if looks_like_header(first) else positional_columns(first)
    return rows(file, header)
`,
  },
  {
    path: "tests/test_headerless.py",
    content: `def test_missing_header():
    result = read_fixture("no_header.csv")
    assert result.columns == ["column_1", "column_2", "column_3"]
`,
  },
  {
    path: "config/default.yaml",
    content: `theme: cecloud
output: pptx
editable: true
`,
  },
  {
    path: "runtime/dependencies.txt",
    content: `python-pptx==0.6.23
lxml==5.2.1
`,
  },
  {
    path: "CHANGELOG.md",
    content: `# Changelog

## 1.3
- 增加缺表头文件的健壮性处理
- 增加 headerless fixture 单元测试
`,
  },
];

function version(input: Partial<SkillVersion> & Pick<SkillVersion, "id" | "version">): SkillVersion {
  return {
    createdAt: "2026-07-24 10:16",
    createdBy: "邸若楠",
    source: "import",
    status: "published",
    releaseNotes: "版本更新",
    evaluationStatus: null,
    evaluationReport: null,
    files: PPT_FILES,
    ...input,
  };
}

export const INITIAL_SKILLS: SkillRecord[] = [
  {
    id: "ppt-master",
    name: "ppt_master",
    displayName: "PPT Master",
    description: "AI-driven multi-format SVG 演示文稿生成技能，支持品牌模板、结构规划和可编辑产物。",
    owner: "邸若楠",
    updatedAt: "2026-07-24 10:16",
    status: "published",
    currentVersion: "v1.3",
    sourceLabel: "AI 优化",
    usageInstructions: "上传材料并说明汇报对象、时长和视觉风格，技能会生成可编辑演示文稿。",
    versions: [
      version({
        id: "ppt-v13",
        version: "v1.3",
        source: "ai-optimize",
        releaseNotes: "增强缺表头输入的健壮性并补充单元测试。",
        conversationId: "CONV-2087",
        evidence: ["失败运行 TASK-2087", "样本 no_header.csv"],
      }),
      version({
        id: "ppt-v12",
        version: "v1.2",
        createdAt: "2026-07-10 09:20",
        source: "import",
        releaseNotes: "支持品牌模板与结构化大纲。",
        files: PPT_FILES.filter((file) => file.path !== "tests/test_headerless.py").map((file) =>
          file.path === "src/parser.py"
            ? {
                ...file,
                content: `def read(file):
    header = next(file)
    return rows(file, header)
`,
              }
            : file
        ),
      }),
      version({
        id: "ppt-v11",
        version: "v1.1",
        createdAt: "2026-07-05 15:40",
        source: "rollback",
        releaseNotes: "由 v1.0 回滚生成，恢复稳定模板。",
      }),
      version({
        id: "ppt-v10",
        version: "v1.0",
        createdAt: "2026-07-01 11:10",
        source: "import",
        releaseNotes: "首次导入。",
      }),
    ],
    dependencies: [
      {
        id: "python-pptx",
        name: "python-pptx",
        version: "0.6.23",
        kind: "snapshot",
        type: "runtime",
        status: "ready",
        note: "已安装并锁定版本",
      },
      {
        id: "lxml",
        name: "lxml",
        version: "5.2.1",
        kind: "snapshot",
        type: "runtime",
        status: "ready",
        note: "已安装并锁定版本",
      },
      {
        id: "mail-mcp",
        name: "邮件网关 MCP",
        kind: "platform",
        type: "mcp",
        status: "offline",
        note: "依赖已下架，使用前需替换",
      },
      {
        id: "office-plugin",
        name: "办公套件插件",
        kind: "platform",
        type: "plugin",
        status: "ready",
        note: "平台引用可用",
      },
    ],
    runtimeSnapshot: {
      id: "rt-snap-ppt-v13",
      boundVersion: "v1.3",
      status: "ready",
      assembledAt: "2026-07-24 10:08",
      sample: "tests/",
    },
  },
  {
    id: "scholar-search",
    name: "scholar-search",
    displayName: "学术检索助手",
    description: "检索、去重并结构化整理学术论文，输出可追溯的来源与摘要。",
    owner: "邸若楠",
    updatedAt: "2026-07-24 09:48",
    status: "draft",
    sourceLabel: "链接导入",
    usageInstructions: "输入研究主题、时间范围和目标数据库。",
    versions: [
      version({
        id: "scholar-v10",
        version: "v1.0",
        status: "draft",
        source: "import",
        releaseNotes: "从 GitHub 导入的初始草稿。",
      }),
    ],
    dependencies: [
      {
        id: "crossref",
        name: "Crossref API",
        kind: "platform",
        type: "external-service",
        status: "ready",
      },
    ],
    runtimeSnapshot: {
      id: "pending-scholar",
      boundVersion: "v1.0",
      status: "not-run",
    },
  },
  {
    id: "ai-tone",
    name: "文章去AI味工具",
    displayName: "文章去 AI 味工具",
    description: "降低文本中的模板化 AI 写作痕迹，保留事实与原有表达意图。",
    owner: "sunli01",
    updatedAt: "2026-07-22 14:24",
    status: "draft",
    sourceLabel: "AI 创建",
    usageInstructions: "粘贴待优化文本并说明目标受众。",
    versions: [
      version({
        id: "tone-v10",
        version: "v1.0",
        status: "draft",
        source: "ai-create",
        releaseNotes: "AI 创建的首版草稿。",
      }),
    ],
    dependencies: [],
    runtimeSnapshot: {
      id: "pending-tone",
      boundVersion: "v1.0",
      status: "not-run",
    },
  },
  {
    id: "rna-expr-parser",
    name: "rna-expr-parser",
    displayName: "RNA 表达分析",
    description: "读取水稻 RNA 表达矩阵，完成基础质控、差异摘要和异常样本提示。",
    owner: "邸若楠",
    updatedAt: "2026-07-24 10:02",
    status: "reviewing",
    currentVersion: undefined,
    sourceLabel: "AI 创建",
    usageInstructions: "上传表达矩阵与样本分组文件。",
    versions: [
      version({
        id: "rna-v10",
        version: "v1.0",
        status: "draft",
        source: "ai-create",
        releaseNotes: "待确认的 AI 创建草稿。",
      }),
    ],
    dependencies: [
      {
        id: "pandas",
        name: "pandas",
        version: "2.2.2",
        kind: "snapshot",
        type: "runtime",
        status: "ready",
      },
    ],
    runtimeSnapshot: {
      id: "rt-rna-v10",
      boundVersion: "v1.0",
      status: "ready",
      assembledAt: "2026-07-24 09:58",
      sample: "samples/rice_expression.csv",
    },
  },
];

export const INITIAL_WORK_ORDERS: SkillWorkOrder[] = [
  {
    id: "WO-2087",
    type: "optimize",
    skillId: "scholar-search",
    skillName: "scholar-search",
    source: "conversation",
    status: "generating",
    request: "这个 skill 对缺表头的文件会报错，帮我优化健壮性。",
    createdAt: "2026-07-24 10:12",
    evidence: ["失败运行 TASK-2087", "样本 no_header.csv"],
    steps: [
      { id: "read", label: "读取版本与挂载依据", status: "done" },
      { id: "generate", label: "生成改动（parser + 测试）", status: "active" },
      { id: "confirm", label: "等待用户确认并另存为新版本", status: "pending" },
      { id: "publish", label: "进入发布链路（质量门默认直通）", status: "pending" },
    ],
  },
  {
    id: "WO-2086",
    type: "create",
    skillId: "rna-expr-parser",
    skillName: "rna-expr-parser",
    source: "conversation",
    status: "pending-confirmation",
    outputVersion: "v1.0 草稿",
    request: "帮我建一个能分析水稻 RNA 表达数据的 Skill。",
    createdAt: "2026-07-24 10:02",
    evidence: ["样本 rice_expression.csv"],
    steps: [
      { id: "read", label: "理解目标与样本", status: "done" },
      { id: "generate", label: "生成 Skill 包与依赖建议", status: "done" },
      { id: "confirm", label: "等待用户确认", status: "active" },
      { id: "publish", label: "进入发布链路（质量门默认直通）", status: "pending" },
    ],
  },
  {
    id: "WO-2079",
    type: "optimize",
    skillId: "ppt-master",
    skillName: "ppt_master",
    source: "conversation",
    status: "completed",
    outputVersion: "v1.3",
    request: "缺表头时按位置推断列，并补单元测试。",
    createdAt: "2026-07-24 09:45",
    evidence: ["失败运行 TASK-2079"],
    steps: [
      { id: "read", label: "读取版本与挂载依据", status: "done" },
      { id: "generate", label: "生成改动", status: "done" },
      { id: "confirm", label: "确认并保存版本", status: "done" },
      { id: "publish", label: "发布完成", status: "done" },
    ],
  },
  {
    id: "WO-2071",
    type: "create",
    skillName: "ab1-reader",
    source: "conversation",
    status: "failed",
    request: "创建一个读取 AB1 峰图的 Skill。",
    createdAt: "2026-07-23 18:20",
    evidence: [],
    steps: [
      { id: "read", label: "理解目标", status: "done" },
      { id: "generate", label: "依赖装配失败：缺少可运行样例", status: "failed" },
      { id: "confirm", label: "等待补充样例", status: "pending" },
    ],
  },
];

export const SOURCE_LABELS = {
  import: "导入",
  "ai-create": "AI 创建",
  "ai-optimize": "AI 优化",
  rollback: "回滚",
} as const;

