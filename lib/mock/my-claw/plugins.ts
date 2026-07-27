export type PluginToolKind = "mcp" | "plugin" | "workflow" | "ontology_action";
export type PluginMineOrigin = "builtin" | "claw";
export type PluginMineOriginFilter = "all" | PluginMineOrigin;
export type PluginMarketSourceFilter = "all" | "organization";
export type PluginMarketCategory =
  | "all"
  | "office"
  | "enterprise"
  | "efficiency"
  | "learning"
  | "marketing"
  | "manufacturing"
  | "other";
export type PluginMarketTone =
  | "orange"
  | "cyan"
  | "indigo"
  | "violet"
  | "blue";

export interface MinePluginItem {
  id: string;
  name: string;
  description: string;
  kind: PluginToolKind;
  origin: PluginMineOrigin;
  enabled: boolean;
  badge: string;
  meta: string;
  creator: string;
  updatedAt: string;
  marketplaceId?: string;
  addedOrder?: number;
}

export interface PluginMarketplaceItem {
  id: string;
  name: string;
  author: string;
  description: string;
  category: Exclude<PluginMarketCategory, "all">;
  kind: "mcp" | "plugin";
  icon: string;
  tone: PluginMarketTone;
  source?: "organization";
}

export interface PluginKindMeta {
  kind: PluginToolKind;
  label: string;
  createLabel: string;
}

export const PLUGIN_TOOL_KIND_ORDER: PluginToolKind[] = [
  "mcp",
  "plugin",
  "workflow",
  "ontology_action",
];

export const PLUGIN_TOOL_KIND_META: Record<PluginToolKind, PluginKindMeta> = {
  mcp: { kind: "mcp", label: "MCP", createLabel: "创建MCP服务" },
  plugin: { kind: "plugin", label: "OpenAPI", createLabel: "创建 OpenAPI" },
  workflow: { kind: "workflow", label: "工作流", createLabel: "创建工作流" },
  ontology_action: {
    kind: "ontology_action",
    label: "本体动作",
    createLabel: "创建本体动作",
  },
};

export const MINE_PLUGIN_ORIGIN_TABS: Array<{
  value: PluginMineOriginFilter;
  label: string;
}> = [
  { value: "all", label: "全部" },
  { value: "builtin", label: "内置" },
  { value: "claw", label: "claw" },
];

export const PLUGIN_MARKETPLACE_SOURCE_FILTERS: Array<{
  value: PluginMarketSourceFilter;
  label: string;
}> = [
  { value: "all", label: "全部" },
  { value: "organization", label: "我的组织" },
];

export const PLUGIN_MARKETPLACE_CATEGORY_FILTERS: Array<{
  value: PluginMarketCategory;
  label: string;
}> = [
  { value: "all", label: "全部类型" },
  { value: "office", label: "办公人事" },
  { value: "enterprise", label: "企业服务" },
  { value: "efficiency", label: "效率工具" },
  { value: "learning", label: "学习教育" },
  { value: "marketing", label: "营销创办" },
  { value: "manufacturing", label: "智能制造" },
  { value: "other", label: "其他" },
];

const INITIAL_BUILTIN_PLUGINS: MinePluginItem[] = [
  {
    id: "platform-execute-python",
    name: "execute_python",
    description:
      "沙箱内 Python，预装 pandas、numpy、matplotlib、plotly、openpyxl、python-docx、python-pptx、requests 等常用库。",
    enabled: true,
    badge: "代码执行",
    meta: "沙箱",
    kind: "mcp",
    origin: "builtin",
    creator: "平台内置",
    updatedAt: "2026-04-01 20:00:00",
  },
  {
    id: "platform-web-search",
    name: "web_search",
    description: "搜索引擎检索，获取公开网页摘要与链接。",
    enabled: true,
    badge: "网络工具",
    meta: "网络",
    kind: "mcp",
    origin: "builtin",
    creator: "平台内置",
    updatedAt: "2026-04-02 20:00:00",
  },
  {
    id: "platform-create-docx",
    name: "create_docx",
    description:
      "生成 Word（.docx）；支持企业上传标准模板、表格、图表、分节、页眉页脚与样式。",
    enabled: true,
    badge: "文档生成",
    meta: "文档",
    kind: "plugin",
    origin: "builtin",
    creator: "平台内置",
    updatedAt: "2026-04-03 20:00:00",
  },
  {
    id: "tenant-erp-mcp",
    name: "ERP MCP",
    description: "对接企业 ERP 的报销单草稿写入、审批发起和状态同步能力。",
    enabled: true,
    badge: "租户配置",
    meta: "MCP",
    kind: "mcp",
    origin: "builtin",
    creator: "公共配置",
    updatedAt: "2026-04-04 20:00:00",
  },
  {
    id: "tenant-ocr-openapi",
    name: "票据 OCR 识别服务",
    description: "识别机票行程单、酒店发票和出租车票的结构化字段。",
    enabled: true,
    badge: "租户配置",
    meta: "OpenAPI",
    kind: "plugin",
    origin: "builtin",
    creator: "公共配置",
    updatedAt: "2026-04-05 20:00:00",
  },
  {
    id: "tenant-invoice-check",
    name: "企业验票系统接口",
    description: "完成票据真伪核查、重复报销校验和发票抬头一致性检查。",
    enabled: true,
    badge: "租户配置",
    meta: "接口",
    kind: "plugin",
    origin: "builtin",
    creator: "公共配置",
    updatedAt: "2026-04-06 20:00:00",
  },
  {
    id: "tenant-policy-ontology",
    name: "制度条款本体动作",
    description: "根据企业制度本体做条款定位、实体关联和约束校验。",
    enabled: false,
    badge: "租户配置",
    meta: "本体",
    kind: "ontology_action",
    origin: "builtin",
    creator: "公共配置",
    updatedAt: "2026-04-07 20:00:00",
  },
];

const INITIAL_CLAW_PLUGINS: MinePluginItem[] = [
  {
    id: "claw-ops-watch-mcp",
    name: "运维值守Claw",
    description:
      "占位文字占位文字占位文字占位文字占位文字占位文字占位文字占位文字占位文字占位文字。",
    enabled: true,
    badge: "Claw配置",
    meta: "MCP",
    kind: "mcp",
    origin: "claw",
    creator: "赵六六",
    updatedAt: "2026-04-01 20:00:00",
  },
  {
    id: "claw-policy-center-mcp",
    name: "制度中心MCP",
    description: "按标准协议查询制度条款、版本记录和生效范围，并回传依据片段。",
    enabled: true,
    badge: "Claw配置",
    meta: "MCP",
    kind: "mcp",
    origin: "claw",
    creator: "赵六六",
    updatedAt: "2026-04-02 20:00:00",
  },
  {
    id: "claw-mail-gateway-mcp",
    name: "邮件网关MCP",
    description: "统一发送、抄送和归档业务邮件，支持会话上下文回填。",
    enabled: false,
    badge: "Claw配置",
    meta: "MCP",
    kind: "mcp",
    origin: "claw",
    creator: "赵六六",
    updatedAt: "2026-04-03 20:00:00",
  },
  {
    id: "workflow-invoice-validation",
    name: "验票工作流",
    description: "完成 OCR 识别发票、票据信息结构化提取、系统核查与合规校验。",
    enabled: true,
    badge: "Claw配置",
    meta: "工作流",
    kind: "workflow",
    origin: "claw",
    creator: "赵六六",
    updatedAt: "2026-04-04 20:00:00",
  },
  {
    id: "workflow-expense-submit",
    name: "差旅表单填写与提交工作流",
    description: "完成出行信息提取、字段映射、自动填充表单、ERP 写入与审批提交。",
    enabled: true,
    badge: "Claw配置",
    meta: "工作流",
    kind: "workflow",
    origin: "claw",
    creator: "赵六六",
    updatedAt: "2026-04-05 20:00:00",
  },
  {
    id: "plugin-document-parser",
    name: "文档解析 OpenAPI",
    description: "解析 PDF、Word、图片文档并提取结构化字段。",
    enabled: true,
    badge: "Claw配置",
    meta: "文档",
    kind: "plugin",
    origin: "claw",
    creator: "赵六六",
    updatedAt: "2026-04-06 20:00:00",
  },
];

export const INITIAL_MINE_PLUGINS: MinePluginItem[] = [
  ...INITIAL_BUILTIN_PLUGINS,
  ...INITIAL_CLAW_PLUGINS,
];

export const PLUGIN_MARKETPLACE_ITEMS: PluginMarketplaceItem[] = [
  {
    id: "market-baidu-baike",
    name: "百度百科",
    author: "@个人发布",
    description: "查询水务相关词条名或者词条ID去百度百科查询跟该词条相关的内容",
    category: "other",
    kind: "mcp",
    icon: "tool",
    tone: "orange",
  },
  {
    id: "market-pathogen-mcp",
    name: "病原实时鉴定MCPServer1",
    author: "@个人发布",
    description: "",
    category: "other",
    kind: "mcp",
    icon: "boxes",
    tone: "orange",
  },
  {
    id: "market-mcp-admin",
    name: "测试mcp管理",
    author: "@个人发布",
    description: "",
    category: "office",
    kind: "mcp",
    icon: "tool",
    tone: "orange",
  },
  {
    id: "market-audio-parser",
    name: "音频解析",
    author: "@官方发布",
    description: "音频解析工具，输出长字符串，支持MP3/M4A/WAV/PCM/AMR/OGG类别。",
    category: "office",
    kind: "plugin",
    icon: "chart-bars",
    tone: "cyan",
  },
  {
    id: "market-writing-template",
    name: "写作模板",
    author: "@官方发布",
    description:
      "插件可在公文写作、行业研究报告、商业分析报告、邮件撰写、周报撰写五大内置模板中自动挑选最契合的写作提示。它先解析输入主题与篇幅要求，再生成结构化提纲。",
    category: "office",
    kind: "mcp",
    icon: "book",
    tone: "indigo",
    source: "organization",
  },
  {
    id: "market-jwt-encode",
    name: "JWT编码",
    author: "@官方发布",
    description:
      "JWT编码器是一项将结构化声明快速封装、签名并序列化为 RFC7519 标准JSON Web Token 的核心能力，自动完成 Header 构造与 Payload 校验。",
    category: "other",
    kind: "plugin",
    icon: "code",
    tone: "cyan",
  },
  {
    id: "market-user-agent",
    name: "随机生成User-Agent",
    author: "@官方发布",
    description:
      "专门用于随机生成或自动轮换用户标识字符串，为每一次请求动态赋予全新的用户代理。用户代理模拟器本质上是浏览器或爬虫请求中的身份生成工具。",
    category: "other",
    kind: "plugin",
    icon: "spark",
    tone: "violet",
  },
  {
    id: "market-language-detect",
    name: "语言检测",
    author: "@官方发布",
    description:
      "语言检测是一项智能文本识别能力，能够自动判断输入内容所属的语言类型及其国家或地区。例如，系统可精准识别中文、英文、日文等常见语言。",
    category: "enterprise",
    kind: "plugin",
    icon: "globe",
    tone: "blue",
  },
  {
    id: "market-timezone-convert",
    name: "时区转换",
    author: "@官方发布",
    description:
      "时区转换是一项实用的时间管理工具，能够根据用户输入的时间和原始时区，自动换算为目标时区的对应时间。该功能支持全球主要时区。",
    category: "efficiency",
    kind: "plugin",
    icon: "clock",
    tone: "indigo",
    source: "organization",
  },
];

export function getPluginKindLabel(kind: PluginToolKind): string {
  return PLUGIN_TOOL_KIND_META[kind]?.label ?? kind;
}

export function getMinePluginOriginLabel(origin: PluginMineOrigin): string {
  return origin === "builtin" ? "内置" : "claw";
}

export function getPluginMarketplaceKindLabel(kind: "mcp" | "plugin"): string {
  return kind === "mcp" ? "MCP" : "插件";
}

export function getPluginMarketplaceCategoryLabel(
  value: PluginMarketCategory | string
): string {
  return (
    PLUGIN_MARKETPLACE_CATEGORY_FILTERS.find((item) => item.value === value)
      ?.label || "其他"
  );
}

export function getPluginKindCounts(
  plugins: MinePluginItem[]
): Array<{ kind: PluginToolKind; count: number }> {
  return PLUGIN_TOOL_KIND_ORDER.map((kind) => ({
    kind,
    count: plugins.filter((item) => item.kind === kind).length,
  }));
}

export function filterMinePlugins(
  plugins: MinePluginItem[],
  options: {
    query?: string;
    origin?: PluginMineOriginFilter;
    kind?: PluginToolKind;
  } = {}
): MinePluginItem[] {
  const query = options.query?.trim().toLowerCase() ?? "";
  const origin = options.origin ?? "all";
  const kind = options.kind;

  return plugins
    .filter((plugin) => {
      if (kind && plugin.kind !== kind) return false;
      if (origin !== "all" && plugin.origin !== origin) return false;
      if (!query) return true;
      return (
        plugin.name.toLowerCase().includes(query) ||
        plugin.description.toLowerCase().includes(query)
      );
    })
    .slice()
    .sort(
      (a, b) =>
        (b.addedOrder || 0) - (a.addedOrder || 0) ||
        a.name.localeCompare(b.name, "zh-CN")
    );
}

export function filterPluginMarketplaceItems(
  items: PluginMarketplaceItem[],
  options: {
    query?: string;
    source?: PluginMarketSourceFilter;
    category?: PluginMarketCategory;
  } = {}
): PluginMarketplaceItem[] {
  const query = options.query?.trim().toLowerCase() ?? "";
  const source = options.source ?? "all";
  const category = options.category ?? "all";

  return items.filter((item) => {
    if (source !== "all" && item.source !== source) return false;
    if (category !== "all" && item.category !== category) return false;
    if (!query) return true;
    return [
      item.name,
      item.author,
      item.description,
      getPluginMarketplaceKindLabel(item.kind),
      getPluginMarketplaceCategoryLabel(item.category),
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

export function formatPluginAddedAt(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function buildMinePluginFromMarketplace(
  marketItem: PluginMarketplaceItem,
  addedOrder: number,
  addedAt = formatPluginAddedAt()
): MinePluginItem {
  const kind = marketItem.kind === "mcp" ? "mcp" : "plugin";
  return {
    id: marketItem.id,
    marketplaceId: marketItem.id,
    name: marketItem.name,
    description:
      marketItem.description || `${marketItem.name}组件，来自插件广场。`,
    enabled: true,
    badge: "插件广场",
    meta: getPluginMarketplaceKindLabel(kind),
    kind,
    creator: marketItem.author.replace(/^@/, ""),
    origin: "claw",
    updatedAt: addedAt,
    addedOrder,
  };
}

export function addMarketplaceItemToMine(
  plugins: MinePluginItem[],
  marketItem: PluginMarketplaceItem,
  marketAddSequence: number
): {
  plugins: MinePluginItem[];
  nextSequence: number;
  added: MinePluginItem;
  replaced: boolean;
} {
  const nextSequence = marketAddSequence + 1;
  const added = buildMinePluginFromMarketplace(marketItem, nextSequence);
  const existingIndex = plugins.findIndex(
    (item) => item.marketplaceId === marketItem.id || item.id === marketItem.id
  );

  if (existingIndex >= 0) {
    const next = plugins.slice();
    next[existingIndex] = { ...next[existingIndex], ...added };
    return {
      plugins: next,
      nextSequence,
      added: next[existingIndex],
      replaced: true,
    };
  }

  return {
    plugins: [...plugins, added],
    nextSequence,
    added,
    replaced: false,
  };
}
