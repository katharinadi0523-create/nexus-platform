export type PluginToolKind = "mcp" | "plugin" | "workflow" | "ontology_action";
export type PluginMineOrigin = "builtin" | "claw";
export type PluginPublisherScope = "system" | "platform" | "organization" | "personal";
export type PluginConnectionStatus = "connected" | "failed" | "checking";
export type PluginRuntimeStatus = "normal" | "abnormal";
export type PluginMineOriginFilter = "all" | PluginMineOrigin;
export type PluginMarketSourceFilter = "all" | "organization" | "third_party";
export type PluginMarketOrganizationScope = "all" | "mine";
export type PluginMarketCategory =
  | "all"
  | "search"
  | "data"
  | "content_creation"
  | "data_collection"
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
  publisherScope?: PluginPublisherScope;
  enabled: boolean;
  connectionStatus?: PluginConnectionStatus;
  lastValidConnectionStatus?: Exclude<PluginConnectionStatus, "checking">;
  lastConnectionCheckAt?: string;
  lastConnectionCheckTimedOut?: boolean;
  runtimeStatus?: PluginRuntimeStatus;
  runtimeCheckedAt?: string;
  badge: string;
  meta: string;
  creator: string;
  updatedAt: string;
  addedAt?: string;
  activeToolCalls?: number;
  marketplaceId?: string;
  addedOrder?: number;
  personalCreated?: boolean;
  detail?: {
    businessCategories?: string[];
    publishedAt?: string;
    overview?: string;
    usageSteps?: string[];
    features?: string[];
    scenarios?: string[];
    tools?: Array<{ name: string; description: string }>;
  };
  personalConfig?: {
    mcpJson?: string;
    pluginUrl?: string;
    headers?: Array<{ name: string; value: string }>;
    auth?: "none" | "token";
    authLocation?: "header" | "query";
    authParamName?: string;
    authParamValue?: string;
  };
}

export interface PluginMarketplaceItem {
  id: string;
  name: string;
  author: string;
  description: string;
  publishedAt?: string;
  category: Exclude<PluginMarketCategory, "all">;
  kind: "mcp" | "plugin";
  icon: string;
  logoUrl?: string;
  tone: PluginMarketTone;
  source?: "organization" | "third_party";
  organizationId?: string;
  /** A platform-preset third-party connection that asks the user for personal credentials. */
  personalCredentialMode?: "api_key" | "mcp_credential";
  oauthPermissions?: string[];
  presetEndpoint?: string;
  endpointDisplay?: string;
  connectionMethod?: string;
  connectionSummary?: string;
  customEndpointRequired?: boolean;
  endpointInputLabel?: string;
  docsUrl?: string;
  connectionLabel?: string;
  connectionNote?: string;
  credentialLabel?: string;
  credentialHelp?: string;
  presetTools?: Array<{ name: string; description: string }>;
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
  { value: "third_party", label: "第三方" },
  { value: "organization", label: "组织" },
];

export const PLUGIN_MARKETPLACE_ORGANIZATION_FILTERS: Array<{
  value: PluginMarketOrganizationScope;
  label: string;
}> = [
  { value: "all", label: "全部组织" },
  { value: "mine", label: "我的组织" },
];

export const PLUGIN_MARKETPLACE_CATEGORY_FILTERS: Array<{
  value: PluginMarketCategory;
  label: string;
}> = [
  { value: "all", label: "全部类型" },
  { value: "search", label: "搜索" },
  { value: "data", label: "数据" },
  { value: "content_creation", label: "内容创作" },
  { value: "data_collection", label: "数据采集" },
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
    publisherScope: "system",
    creator: "官方",
    updatedAt: "2026-04-01 20:00:00",
    detail: {
      businessCategories: ["效率工具"],
      publishedAt: "2026-04-01 20:00:00",
      overview: "在沙箱中运行 Python，支持数据计算、图表绘制与文档处理。",
      usageSteps: ["在对话中描述需要计算或处理的任务。", "Claw 根据任务需要调用 Python 执行能力并返回结果。"],
      features: ["运行 Python 代码", "使用预装的数据、绘图和办公文档依赖"],
      scenarios: ["数据整理与计算", "图表与文档生成"],
      tools: [{ name: "execute_python", description: "在沙箱中执行 Python 代码。" }],
    },
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
    publisherScope: "system",
    creator: "官方",
    updatedAt: "2026-04-02 20:00:00",
    detail: {
      businessCategories: ["效率工具"],
      publishedAt: "2026-04-02 20:00:00",
      overview: "检索公开网页，并返回与问题相关的摘要和来源链接。",
      usageSteps: ["在对话中说明需要查找的信息。", "Claw 在适用时调用搜索工具并整理结果。"],
      features: ["公开网页检索", "返回摘要与来源链接"],
      scenarios: ["查找公开资料", "核对近期信息"],
      tools: [{ name: "web_search", description: "搜索公开网页并返回摘要与链接。" }],
    },
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
    publisherScope: "system",
    creator: "官方",
    updatedAt: "2026-04-03 20:00:00",
    detail: {
      businessCategories: ["办公人事"],
      publishedAt: "2026-04-03 20:00:00",
      overview: "生成 Word 文档，支持模板、表格、图表、分节及常见文档样式。",
      usageSteps: ["在对话中说明文档主题、内容和格式要求。", "Claw 在适用时调用文档生成能力。"],
      features: ["生成 Word 文档", "使用模板、表格、图表与文档样式"],
      scenarios: ["报告和纪要生成", "按模板制作办公文档"],
      tools: [{ name: "create_docx", description: "根据内容与格式要求生成 Word 文档。" }],
    },
  },
  {
    id: "tenant-erp-mcp",
    name: "ERP MCP",
    description: "对接企业 ERP 的报销单草稿写入、审批发起和状态同步能力。",
    enabled: true,
    badge: "租户配置",
    meta: "MCP",
    kind: "mcp",
    origin: "claw",
    publisherScope: "platform",
    creator: "平台办公中心",
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
    origin: "claw",
    publisherScope: "organization",
    creator: "共享服务中心",
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
    origin: "claw",
    publisherScope: "organization",
    creator: "财务共享中心",
    updatedAt: "2026-04-06 20:00:00",
  },
  {
    id: "tenant-policy-ontology",
    name: "制度条款本体动作",
    description: "根据企业制度本体做条款定位、实体关联和约束校验。",
    enabled: true,
    badge: "租户配置",
    meta: "本体",
    kind: "ontology_action",
    origin: "claw",
    publisherScope: "platform",
    creator: "平台本体中心",
    updatedAt: "2026-04-07 20:00:00",
  },
];

const INITIAL_CLAW_PLUGINS: MinePluginItem[] = [
  {
    id: "personal-calendar-mcp-demo",
    name: "个人日程 MCP",
    description: "连接个人日程服务，在对话中查询空闲时间并整理日程安排。",
    enabled: true,
    badge: "个人创建",
    meta: "MCP",
    kind: "mcp",
    origin: "claw",
    publisherScope: "personal",
    creator: "我",
    updatedAt: "2026-11-08 16:30:00",
    personalCreated: true,
    personalConfig: {
      mcpJson: `{
  "mcpServers": {
    "personal-calendar": {
      "type": "streamableHttp",
      "url": "https://calendar.example.com/mcp",
      "headers": { "Authorization": "Bearer DEMO_TOKEN" }
    }
  }
}`,
    },
    detail: {
      businessCategories: ["效率工具"],
      overview: "连接个人日程服务，帮助查询日程和安排时间。",
      tools: [
        { name: "list_events", description: "按日期范围查询日程。" },
        { name: "find_free_time", description: "查找指定时间范围内的空闲时段。" },
      ],
    },
  },
  {
    id: "personal-search-openapi-demo",
    name: "个人搜索 API",
    description: "使用个人 API Key 接入搜索服务，获取网页摘要与来源链接。",
    enabled: true,
    badge: "个人创建",
    meta: "OpenAPI",
    kind: "plugin",
    origin: "claw",
    publisherScope: "personal",
    creator: "我",
    updatedAt: "2026-11-07 10:15:00",
    personalCreated: true,
    personalConfig: {
      pluginUrl: "https://search.example.com/v1",
      headers: [{ name: "X-API-Key", value: "demo-api-key" }],
      auth: "token",
      authLocation: "header",
      authParamName: "X-API-Key",
      authParamValue: "demo-api-key",
    },
    detail: {
      businessCategories: ["效率工具"],
      overview: "通过个人 API Key 调用搜索服务，返回网页摘要和来源链接。",
      tools: [{ name: "search_web", description: "根据关键词搜索网页并返回摘要。" }],
    },
  },
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
    publisherScope: "organization",
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
    publisherScope: "organization",
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
    publisherScope: "organization",
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
    publisherScope: "organization",
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
    publisherScope: "organization",
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
    publisherScope: "platform",
    creator: "赵六六",
    updatedAt: "2026-04-06 20:00:00",
  },
];

export const INITIAL_MINE_PLUGINS: MinePluginItem[] = [
  ...INITIAL_BUILTIN_PLUGINS,
  ...INITIAL_CLAW_PLUGINS,
].map((plugin) => ({
  ...plugin,
  addedAt: plugin.updatedAt,
  // Existing demo connections have a known health state; new ones get the
  // same explicit result after the connect-and-enable action.
  connectionStatus: plugin.origin === "builtin" ? undefined : plugin.id === "claw-mail-gateway-mcp" ? "failed" : "connected",
  lastValidConnectionStatus: plugin.origin === "builtin" ? undefined : plugin.id === "claw-mail-gateway-mcp" ? "failed" : "connected",
  lastConnectionCheckAt: plugin.origin === "builtin" ? undefined : plugin.updatedAt,
  runtimeStatus: plugin.origin === "builtin" ? "normal" : undefined,
  runtimeCheckedAt: plugin.origin === "builtin" ? plugin.updatedAt : undefined,
  activeToolCalls: plugin.id === "claw-ops-watch-mcp" ? 1 : 0,
}));

export const PLUGIN_MARKETPLACE_ITEMS: PluginMarketplaceItem[] = [
  {
    id: "market-bocha-search",
    name: "博查搜索",
    author: "@平台认证",
    publishedAt: "2026-06-05 10:24:00",
    description: "搜索全网网页、新闻、天气和百科，返回标题、摘要与来源链接。",
    category: "search",
    kind: "mcp",
    icon: "globe",
    logoUrl: "/logos/third-party-plugins/bocha.ico",
    tone: "blue",
    source: "third_party",
    personalCredentialMode: "api_key",
    endpointDisplay: "官方 MCP 示例为本地 stdio 部署，未核实到托管 MCP 地址",
    connectionMethod: "官方 MCP Server · stdio · API Key",
    connectionSummary: "官方 MCP 示例需在服务端运行；本 Demo 用于展示接入信息，实际接入需由平台托管 MCP 或改用官方搜索 API。",
    docsUrl: "https://github.com/BochaAI/bocha-search-mcp",
    credentialLabel: "API Key",
    credentialHelp: "在博查 AI 开放平台获取 API Key。",
    connectionLabel: "MCP · stdio",
    connectionNote: "MCP 示例通过本地启动并读取 BOCHA_API_KEY。Claw 需评估由后端托管 MCP，或改为直接调用官方 Web Search API。",
    presetTools: [
      { name: "Bocha Web Search", description: "搜索全网网页并返回标题、链接、摘要等信息。" },
      { name: "Bocha AI Search", description: "在网页搜索基础上返回天气、日历、百科等结构化信息。" },
    ],
  },
  {
    id: "market-qichacha",
    name: "企查查",
    author: "@平台认证",
    publishedAt: "2026-06-12 14:30:00",
    description: "查询企业工商、经营、法律风险和知识产权信息，辅助尽调与供应商筛查。",
    category: "data",
    kind: "mcp",
    icon: "boxes",
    logoUrl: "/logos/third-party-plugins/qichacha.ico",
    tone: "cyan",
    source: "third_party",
    personalCredentialMode: "mcp_credential",
    endpointDisplay: "由企查查按账号及所选数据 Server 生成",
    customEndpointRequired: true,
    endpointInputLabel: "企查查 MCP 接入 URL",
    connectionMethod: "官方云端 MCP · API Key + 对应接入 URL",
    docsUrl: "https://agent.qcc.com/guide",
    credentialLabel: "企查查 API Key",
    credentialHelp: "在企查查智能体数据平台获取 API Key；调用消耗服务商积分。",
    connectionLabel: "MCP · API Key",
    connectionNote: "平台包含多个数据 Server，接入地址依账号和所选服务生成，不固定写死。调用消耗企查查积分；历史存档等能力另有开通条件。",
    presetTools: [
      { name: "企业信息查询", description: "查询企业基本信息、股东及主要人员等数据。" },
      { name: "企业风险查询", description: "查询企业经营、司法等风险信息。" },
    ],
  },
  {
    id: "market-gamma",
    name: "Gamma",
    author: "@平台认证",
    publishedAt: "2026-06-18 09:15:00",
    description: "根据自然语言生成演示文稿、文档、网页或社交内容，并支持导出。",
    category: "content_creation",
    kind: "mcp",
    icon: "spark",
    logoUrl: "/logos/third-party-plugins/gamma.ico",
    tone: "violet",
    source: "third_party",
    presetEndpoint: "https://mcp.gamma.app/mcp",
    oauthPermissions: ["创建演示文稿、文档、网页或社交内容", "访问你有权限使用的 Gamma 工作区内容"],
    connectionLabel: "MCP · OAuth",
    connectionMethod: "官方托管 MCP · OAuth 2.0 + PKCE + DCR",
    docsUrl: "https://developers.gamma.app/mcp/gamma-mcp-server.md",
    connectionNote: "Claw 需支持动态客户端注册（DCR），并预先向 Gamma 登记 OAuth 回调地址。生成、编辑和图片会消耗工作区额度。",
    presetTools: [
      { name: "生成内容", description: "创建演示文稿、文档、网页或社交内容，可使用工作区模板。" },
      { name: "管理内容", description: "读取、搜索、编辑、复制和导出有权限访问的 Gamma 内容。" },
    ],
  },
  {
    id: "market-jinshuju",
    name: "金数据",
    author: "@平台认证",
    publishedAt: "2026-06-21 11:40:00",
    description: "通过对话查询表单和提交数据，也可创建表单、管理数据记录。",
    category: "data",
    kind: "mcp",
    icon: "chart-bars",
    logoUrl: "/logos/third-party-plugins/jinshuju.ico",
    tone: "cyan",
    source: "third_party",
    presetEndpoint: "https://jinshuju.net/mcp",
    oauthPermissions: ["读取你有权访问的表单和提交数据", "按授权范围创建或修改表单及数据"],
    connectionLabel: "MCP · OAuth 授权",
    connectionMethod: "官方托管 MCP · OAuth 或 Access Token",
    docsUrl: "https://open.jinshuju.net/mcp/configuration/",
    connectionNote: "官方推荐 OAuth；也支持手动填写 Access Token，个人 Token 仅访问本人及已共享的数据。",
    presetTools: [
      { name: "查询表单与提交", description: "读取表单结构、查询提交数据并整理结果。" },
      { name: "管理表单与数据", description: "按授权范围创建或修改表单及提交记录。" },
    ],
  },
  {
    id: "market-hengsheng-juyuan",
    name: "恒生聚源金融问数",
    author: "@平台认证",
    publishedAt: "2026-07-02 16:05:00",
    description: "用自然语言查询股票、基金、行情、财务、宏观和研报等专业金融数据。",
    category: "data",
    kind: "mcp",
    icon: "chart-bars",
    logoUrl: "/logos/third-party-plugins/hengsheng.png",
    tone: "indigo",
    source: "third_party",
    personalCredentialMode: "mcp_credential",
    endpointDisplay: "订阅后取得专属 MCP URL 和凭证",
    customEndpointRequired: true,
    endpointInputLabel: "MCP 服务 URL",
    credentialLabel: "服务凭证",
    credentialHelp: "请按订阅后获得的服务配置填写鉴权凭证。",
    connectionLabel: "MCP · 订阅接入",
    connectionMethod: "订阅后获取专属 MCP URL 与鉴权信息",
    docsUrl: "https://market.aliyun.com/detail/cmapi00075042?innerSource=search",
    connectionNote: "服务地址、鉴权参数、可用工具及计费以实际订阅配置为准，公开资料未确认统一的固定地址和鉴权格式。",
    presetTools: [
      { name: "金融综合问数", description: "用自然语言查询股票、基金、债券及宏观行业数据。" },
      { name: "研究与筛选", description: "查询研报信息，并按条件筛选金融标的。" },
    ],
  },
  {
    id: "market-octoparse",
    name: "八爪鱼采集器",
    author: "@平台认证",
    publishedAt: "2026-07-08 13:20:00",
    description: "将采集需求转成云端任务，搜索模板、查看任务状态并导出结构化数据。",
    category: "data_collection",
    kind: "mcp",
    icon: "globe",
    logoUrl: "/logos/third-party-plugins/bazhuayu.ico",
    tone: "orange",
    source: "third_party",
    presetEndpoint: "https://mcp.bazhuayu.com",
    oauthPermissions: ["查找采集模板并读取任务信息", "按授权范围运行云端任务并导出结果"],
    connectionLabel: "MCP · OAuth / API Key",
    connectionMethod: "官方托管 Streamable HTTP MCP · OAuth 或 x-api-key",
    docsUrl: "https://github.com/bazhuayu-team/bazhuayu-mcp",
    connectionNote: "API Key 通过 x-api-key 请求头传递。只有支持云端执行的模板可由 MCP 启动；任务权限和额度受账号套餐限制。",
    presetTools: [
      { name: "查找采集模板", description: "按网站或数据需求查找可用模板。" },
      { name: "运行与导出", description: "运行支持云端执行的任务并导出 CSV 或 JSON。" },
    ],
  },
  {
    id: "market-writing-template",
    name: "写作模板",
    author: "中电云应用创新中心",
    publishedAt: "2026-06-01 09:00:00",
    description: "覆盖公文、行业研究、商业分析、邮件和周报等写作场景，按主题生成结构化提纲。",
    category: "office",
    kind: "mcp",
    icon: "book",
    tone: "indigo",
    source: "organization",
    organizationId: "current-org",
    presetTools: [
      { name: "generate_outline", description: "" },
      { name: "draft_content", description: "" },
    ],
  },
  {
    id: "market-timezone-convert",
    name: "时区转换",
    author: "中电云运维管理部",
    publishedAt: "2026-05-28 15:20:00",
    description: "根据原始时间及时区，换算目标时区的对应时间。",
    category: "efficiency",
    kind: "plugin",
    icon: "clock",
    tone: "indigo",
    source: "organization",
    organizationId: "other-org",
    presetTools: [{ name: "convert_timezone", description: "" }],
  },
  {
    id: "market-meeting-notes",
    name: "会议纪要助手",
    author: "中电云综合管理部",
    publishedAt: "2026-06-03 10:15:00",
    description: "整理会议录音与要点，生成结论、待办事项和责任人清单。",
    category: "office",
    kind: "plugin",
    icon: "book",
    tone: "blue",
    source: "organization",
    organizationId: "current-org",
    presetTools: [
      { name: "summarize_meeting", description: "" },
      { name: "extract_action_items", description: "" },
    ],
  },
  {
    id: "market-procurement-check",
    name: "采购合规查询",
    author: "中电云采购管理中心",
    publishedAt: "2026-06-10 13:45:00",
    description: "查询采购制度、供应商准入要求和采购流程中的合规要点。",
    category: "enterprise",
    kind: "mcp",
    icon: "boxes",
    tone: "cyan",
    source: "organization",
    organizationId: "other-org",
    presetTools: [{ name: "search_procurement_policy", description: "" }],
  },
  {
    id: "market-project-weekly",
    name: "项目周报助手",
    author: "中电云项目管理办公室",
    publishedAt: "2026-06-14 08:50:00",
    description: "汇总项目进度、风险和待协调事项，生成结构化周报。",
    category: "efficiency",
    kind: "plugin",
    icon: "chart-bars",
    tone: "indigo",
    source: "organization",
    organizationId: "other-org",
    presetTools: [
      { name: "collect_project_updates", description: "" },
      { name: "generate_weekly_report", description: "" },
    ],
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
    organizationScope?: PluginMarketOrganizationScope;
    category?: PluginMarketCategory;
    includeKindInSearch?: boolean;
  } = {}
): PluginMarketplaceItem[] {
  const query = options.query?.trim().toLowerCase() ?? "";
  const source = options.source ?? "all";
  const organizationScope = options.organizationScope ?? "all";
  const category = options.category ?? "all";
  const includeKindInSearch = options.includeKindInSearch ?? true;

  return items.filter((item) => {
    if (source !== "all" && item.source !== source) return false;
    if (
      source === "organization" &&
      organizationScope === "mine" &&
      item.organizationId !== "current-org"
    ) return false;
    if (category !== "all" && item.category !== category) return false;
    if (!query) return true;
    return [
      item.name,
      item.author,
      item.description,
      ...(includeKindInSearch ? [getPluginMarketplaceKindLabel(item.kind)] : []),
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
    connectionStatus: "connected",
    lastValidConnectionStatus: "connected",
    lastConnectionCheckAt: addedAt,
    addedAt,
    badge: "插件广场",
    meta: getPluginMarketplaceKindLabel(kind),
    kind,
    creator: marketItem.author.replace(/^@/, ""),
    origin: "claw",
    publisherScope: marketItem.source === "organization" ? "organization" : "platform",
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
