export type OpenApiPluginStatus = "未上架" | "审核中" | "已上架" | "审核不通过";
export type OpenApiToolDebugStatus = "调试成功" | "未调试成功";
export type OpenApiToolParamType = "String" | "Integer" | "Array / Integer";

export interface OpenApiToolInputParam {
  id: string;
  name: string;
  description: string;
  type: OpenApiToolParamType;
  required: boolean;
}

export const OPEN_API_TOOL_PARAM_TYPE_OPTIONS: OpenApiToolParamType[] = [
  "String",
  "Integer",
  "Array / Integer",
];

export const OPEN_API_TOOL_PARAM_NAME_MAX = 20;
export const OPEN_API_TOOL_PARAM_DESC_MAX = 200;

function createInputParam(
  id: string,
  name: string,
  description: string,
  type: OpenApiToolParamType,
  required: boolean
): OpenApiToolInputParam {
  return { id, name, description, type, required };
}

const LINK_TYPE_MAINTENANCE_INPUT_PARAMS: OpenApiToolInputParam[] = [
  createInputParam("ltm-link-db-name", "linkDbName", "链接数据库名称", "String", true),
  createInputParam("ltm-sync-status-list", "syncStatusList", "同步状态列表", "Array / Integer", false),
  createInputParam("ltm-ontology-table-name", "ontologyTableName", "根据关系在 TiDB 生成的关系表名", "String", false),
  createInputParam("ltm-target-object-type-id", "targetObjectTypeID", "目标对象类型ID", "Integer", true),
  createInputParam("ltm-code", "code", "用户给出的唯一编码，首字符必须为英文字母;仅允许英文字母", "String", true),
  createInputParam("ltm-comment", "comment", "列名中文", "String", true),
  createInputParam("ltm-is-use", "isUse", "是否使用 (1: 是, 0: 否)", "Integer", true),
  createInputParam("ltm-source-column-origin-nam", "sourceColumnOriginNam", "数据源表字段原始名称", "String", false),
  createInputParam("ltm-column-type", "columnType", "列类型", "String", true),
  createInputParam("ltm-link-type-id", "linkTypeID", "链接类型ID", "Integer", true),
  createInputParam("ltm-source-column-name", "sourceColumnName", "数据源表字段名", "String", true),
  createInputParam("ltm-source-column-type", "sourceColumnType", "数据源表字段类型", "String", true),
  createInputParam("ltm-is-primary", "isPrimary", "是否主键 (1: 是, 0: 否)", "Integer", true),
  createInputParam("ltm-source-column-comment", "sourceColumnComment", "数据源表字段注释", "String", false),
  createInputParam("ltm-type", "type", "链接类型: 1表示1:1链接, 2表示1:n链接, 3表示n:n链接", "Integer", true),
  createInputParam("ltm-ontology-model-id", "ontologyModelID", "本体模型ID", "Integer", true),
];

const OBJECT_TYPE_META_QUERY_INPUT_PARAMS: OpenApiToolInputParam[] = [
  createInputParam("otmq-action", "action", "操作类型：meta_get 或 meta_list", "String", true),
  createInputParam("otmq-object-type-id", "objectTypeID", "对象类型 ID，action 为 meta_get 时必填", "Integer", false),
  createInputParam("otmq-page-num", "pageNum", "分页页码，action 为 meta_list 时使用", "Integer", false),
  createInputParam("otmq-page-size", "pageSize", "分页大小，action 为 meta_list 时使用", "Integer", false),
];

const OBJECT_TYPE_MAINTENANCE_INPUT_PARAMS: OpenApiToolInputParam[] = [
  createInputParam("otm-action", "action", "操作类型：list、get 或 create", "String", true),
  createInputParam("otm-object-type-id", "objectTypeID", "对象类型 ID", "Integer", false),
  createInputParam("otm-name", "name", "对象类型名称", "String", false),
  createInputParam("otm-code", "code", "对象类型编码", "String", false),
];

const ATTRIBUTE_MAINTENANCE_INPUT_PARAMS: OpenApiToolInputParam[] = [
  createInputParam("am-action", "action", "操作类型：list、get、create、update 或 delete", "String", true),
  createInputParam("am-object-type-id", "objectTypeID", "所属对象类型 ID", "Integer", true),
  createInputParam("am-attribute-id", "attributeID", "属性 ID", "Integer", false),
  createInputParam("am-name", "name", "属性名称", "String", false),
  createInputParam("am-data-type", "dataType", "属性数据类型", "String", false),
];
export type OpenApiPluginPublishScope = "组织发布" | "公开发布";
export type OpenApiPluginType = "本体工具" | "数据查询" | "业务操作" | "系统集成" | "内容生成";

export const OPEN_API_PLUGIN_PUBLISH_SCOPE_OPTIONS: OpenApiPluginPublishScope[] = ["组织发布", "公开发布"];

export const OPEN_API_PLUGIN_TYPE_OPTIONS: { value: OpenApiPluginType; label: string }[] = [
  { value: "本体工具", label: "本体工具" },
  { value: "数据查询", label: "数据查询" },
  { value: "业务操作", label: "业务操作" },
  { value: "系统集成", label: "系统集成" },
  { value: "内容生成", label: "内容生成" },
];

export interface OpenApiToolItem {
  id: string;
  name: string;
  debugStatus: OpenApiToolDebugStatus;
  description: string;
  enabled: boolean;
  updatedAt: string;
  configurable: boolean;
  deletable: boolean;
  inputParams: OpenApiToolInputParam[];
}

export interface OpenApiPluginItem {
  id: string;
  name: string;
  status: OpenApiPluginStatus;
  description: string;
  creator: string;
  publisher: string;
  pluginType: OpenApiPluginType;
  publishScope: OpenApiPluginPublishScope;
  updatedAt: string;
  createdAt: string;
  tools: OpenApiToolItem[];
}

export const openApiPlugins: OpenApiPluginItem[] = [
  {
    id: "local-toolbox-structure-codex",
    name: "本体结构建模工具箱_codex",
    status: "未上架",
    description: "对象类型、属性、链接与元信息相关工具",
    creator: "管理员d",
    publisher: "个人",
    pluginType: "本体工具",
    publishScope: "组织发布",
    updatedAt: "2026-06-01 09:21:15",
    createdAt: "2026-06-01 09:21:15",
    tools: [
      {
        id: "object-type-meta-query",
        name: "对象类型元信息查询",
        debugStatus: "调试成功",
        description: "查询对象类型列表或某个对象类型的完整定义。action包括meta_get、meta_list。",
        enabled: false,
        updatedAt: "2026-06-01 09:20:41",
        configurable: true,
        deletable: true,
        inputParams: OBJECT_TYPE_META_QUERY_INPUT_PARAMS,
      },
      {
        id: "schema-link-validate",
        name: "Schema链接校验",
        debugStatus: "未调试成功",
        description: "校验对象类型、属性与链接路径是否完整，返回缺失字段和冲突说明。",
        enabled: false,
        updatedAt: "2026-06-01 09:18:02",
        configurable: true,
        deletable: true,
        inputParams: [
          createInputParam("slv-object-type-id", "objectTypeID", "待校验的对象类型 ID", "Integer", true),
          createInputParam("slv-link-type-id", "linkTypeID", "待校验的链接类型 ID", "Integer", false),
        ],
      },
    ],
  },
  {
    id: "local-toolbox-objects-links",
    name: "本体工具箱_对象和链接",
    status: "审核中",
    description: "对象维护、链接维护",
    creator: "管理员d",
    publisher: "个人",
    pluginType: "本体工具",
    publishScope: "公开发布",
    updatedAt: "2026-05-28 20:39:37",
    createdAt: "2026-05-28 20:39:37",
    tools: [
      {
        id: "object-type-meta-query",
        name: "对象类型元信息查询",
        debugStatus: "调试成功",
        description: "查询对象类型列表或某个对象类型的完整定义。action包括meta_get、meta_list，可返回字段、索引与展示配置。",
        enabled: false,
        updatedAt: "2026-05-29 15:14:31",
        configurable: true,
        deletable: true,
        inputParams: OBJECT_TYPE_META_QUERY_INPUT_PARAMS,
      },
      {
        id: "object-type-maintenance",
        name: "对象类型维护",
        debugStatus: "调试成功",
        description: "面向对象类型执行列表查询、详情查看和创建，当前版本不支持删除已绑定数据的对象类型。",
        enabled: true,
        updatedAt: "2026-05-29 15:14:26",
        configurable: false,
        deletable: false,
        inputParams: OBJECT_TYPE_MAINTENANCE_INPUT_PARAMS,
      },
      {
        id: "link-type-maintenance",
        name: "链接类型维护",
        debugStatus: "调试成功",
        description: "面向链接类型执行查询和创建。action包括list(获取列表)、get(详情)、create(创建)。",
        enabled: true,
        updatedAt: "2026-05-29 06:30:02",
        configurable: false,
        deletable: false,
        inputParams: LINK_TYPE_MAINTENANCE_INPUT_PARAMS,
      },
      {
        id: "ontology-schema-path-traverse",
        name: "本体结构路径遍历",
        debugStatus: "调试成功",
        description: "分析本体内对象类型之间是否存在 Schema 路径，并返回可达关系、路径节点和方向。",
        enabled: true,
        updatedAt: "2026-05-28 20:40:12",
        configurable: false,
        deletable: false,
        inputParams: [
          createInputParam("ospt-source-id", "sourceObjectTypeID", "起点对象类型 ID", "Integer", true),
          createInputParam("ospt-target-id", "targetObjectTypeID", "终点对象类型 ID", "Integer", true),
          createInputParam("ospt-max-depth", "maxDepth", "最大遍历深度", "Integer", false),
        ],
      },
      {
        id: "data-source-query",
        name: "数据源查询",
        debugStatus: "调试成功",
        description: "查询数据源列表和信息，查询指定连接器关联数据库的数据表列表和字段信息。",
        enabled: true,
        updatedAt: "2026-05-28 20:32:57",
        configurable: false,
        deletable: false,
        inputParams: [
          createInputParam("dsq-connector-id", "connectorId", "连接器 ID", "Integer", false),
          createInputParam("dsq-database-name", "databaseName", "数据库名称", "String", false),
          createInputParam("dsq-table-name", "tableName", "数据表名称", "String", false),
        ],
      },
      {
        id: "object-attribute-source-query",
        name: "对象类型属性实例来源查询",
        debugStatus: "调试成功",
        description: "查询对象类型各个属性来源于哪个数据源的哪个字段；查询同步状态和映射口径。",
        enabled: true,
        updatedAt: "2026-05-28 20:32:10",
        configurable: false,
        deletable: false,
        inputParams: [
          createInputParam("oasq-object-type-id", "objectTypeID", "对象类型 ID", "Integer", true),
          createInputParam("oasq-attribute-id", "attributeID", "属性 ID", "Integer", false),
        ],
      },
      {
        id: "attribute-maintenance",
        name: "属性维护",
        debugStatus: "未调试成功",
        description: "查询、创建、修改或删除指定对象类型下的属性。适合围绕对象模型做结构变更。",
        enabled: false,
        updatedAt: "2026-05-28 20:26:05",
        configurable: true,
        deletable: true,
        inputParams: ATTRIBUTE_MAINTENANCE_INPUT_PARAMS,
      },
      {
        id: "link-instance-query",
        name: "链接实例查询",
        debugStatus: "调试成功",
        description: "按链接类型、起点对象、终点对象与时间范围查询链接实例，支持分页返回。",
        enabled: true,
        updatedAt: "2026-05-28 20:24:39",
        configurable: true,
        deletable: true,
        inputParams: [
          createInputParam("liq-link-type-id", "linkTypeID", "链接类型 ID", "Integer", false),
          createInputParam("liq-source-id", "sourceObjectID", "起点对象实例 ID", "Integer", false),
          createInputParam("liq-target-id", "targetObjectID", "终点对象实例 ID", "Integer", false),
        ],
      },
      {
        id: "object-instance-create",
        name: "对象实例创建",
        debugStatus: "调试成功",
        description: "基于对象类型定义创建实例，并校验必填字段、枚举字段和唯一键约束。",
        enabled: true,
        updatedAt: "2026-05-28 20:22:17",
        configurable: true,
        deletable: true,
        inputParams: [
          createInputParam("oic-object-type-id", "objectTypeID", "对象类型 ID", "Integer", true),
          createInputParam("oic-properties", "properties", "实例属性 JSON 字符串", "String", true),
        ],
      },
      {
        id: "object-instance-update",
        name: "对象实例更新",
        debugStatus: "调试成功",
        description: "更新对象实例属性，支持局部更新、版本检查和字段级校验。",
        enabled: true,
        updatedAt: "2026-05-28 20:21:09",
        configurable: true,
        deletable: true,
        inputParams: [
          createInputParam("oiu-object-id", "objectID", "对象实例 ID", "Integer", true),
          createInputParam("oiu-properties", "properties", "待更新属性 JSON 字符串", "String", true),
        ],
      },
      {
        id: "object-instance-delete",
        name: "对象实例删除",
        debugStatus: "未调试成功",
        description: "删除对象实例前检查关联链接和业务引用，返回可删除性评估。",
        enabled: false,
        updatedAt: "2026-05-28 20:18:42",
        configurable: true,
        deletable: true,
        inputParams: [
          createInputParam("oid-object-id", "objectID", "对象实例 ID", "Integer", true),
          createInputParam("oid-force", "force", "是否强制删除 (1: 是, 0: 否)", "Integer", false),
        ],
      },
      {
        id: "link-instance-create",
        name: "链接实例创建",
        debugStatus: "调试成功",
        description: "在两个对象实例之间创建链接，校验链接类型方向、基数和必填属性。",
        enabled: true,
        updatedAt: "2026-05-28 20:17:55",
        configurable: true,
        deletable: true,
        inputParams: [
          createInputParam("lic-link-type-id", "linkTypeID", "链接类型 ID", "Integer", true),
          createInputParam("lic-source-id", "sourceObjectID", "起点对象实例 ID", "Integer", true),
          createInputParam("lic-target-id", "targetObjectID", "终点对象实例 ID", "Integer", true),
        ],
      },
      {
        id: "link-instance-delete",
        name: "链接实例删除",
        debugStatus: "未调试成功",
        description: "按链接实例 ID 删除关系，并返回删除影响范围。",
        enabled: false,
        updatedAt: "2026-05-28 20:16:31",
        configurable: true,
        deletable: true,
        inputParams: [createInputParam("lid-link-instance-id", "linkInstanceID", "链接实例 ID", "Integer", true)],
      },
      {
        id: "ontology-diff-check",
        name: "本体变更差异检查",
        debugStatus: "调试成功",
        description: "对比两个版本的对象类型、属性和链接定义，输出变更摘要。",
        enabled: true,
        updatedAt: "2026-05-28 20:13:08",
        configurable: true,
        deletable: true,
        inputParams: [
          createInputParam("odc-base-version", "baseVersion", "基准版本号", "String", true),
          createInputParam("odc-target-version", "targetVersion", "对比版本号", "String", true),
        ],
      },
      {
        id: "schema-export",
        name: "结构定义导出",
        debugStatus: "调试成功",
        description: "导出指定对象域的结构定义，支持 JSON Schema 与 OpenAPI 片段格式。",
        enabled: true,
        updatedAt: "2026-05-28 20:10:19",
        configurable: true,
        deletable: true,
        inputParams: [
          createInputParam("se-object-type-id", "objectTypeID", "对象类型 ID", "Integer", false),
          createInputParam("se-format", "format", "导出格式：json_schema 或 openapi", "String", false),
        ],
      },
      {
        id: "mapping-sync-preview",
        name: "映射同步预览",
        debugStatus: "未调试成功",
        description: "预览对象属性与数据表字段映射的同步结果，输出新增、变更和异常项。",
        enabled: false,
        updatedAt: "2026-05-28 20:08:26",
        configurable: true,
        deletable: true,
        inputParams: [
          createInputParam("msp-object-type-id", "objectTypeID", "对象类型 ID", "Integer", true),
          createInputParam("msp-dry-run", "dryRun", "是否仅预览 (1: 是, 0: 否)", "Integer", false),
        ],
      },
    ],
  },
  {
    id: "local-toolbox-instances",
    name: "本体工具箱_实例",
    status: "已上架",
    description: "对象实例复杂查询相关工具",
    creator: "管理员d",
    publisher: "个人",
    pluginType: "本体工具",
    publishScope: "公开发布",
    updatedAt: "2026-05-28 20:39:23",
    createdAt: "2026-05-28 20:39:23",
    tools: [],
  },
  {
    id: "local-toolbox-scenarios",
    name: "本体工具箱_整体场景",
    status: "审核不通过",
    description: "场景快照、场景校验",
    creator: "管理员d",
    publisher: "个人",
    pluginType: "业务操作",
    publishScope: "组织发布",
    updatedAt: "2026-05-28 20:37:36",
    createdAt: "2026-05-28 20:37:36",
    tools: [],
  },
  {
    id: "local-toolbox-functions",
    name: "本体工具箱_函数和行为",
    status: "已上架",
    description: "函数和行为",
    creator: "管理员d",
    publisher: "个人",
    pluginType: "业务操作",
    publishScope: "组织发布",
    updatedAt: "2026-05-28 20:36:32",
    createdAt: "2026-05-28 20:36:32",
    tools: [],
  },
  {
    id: "local-toolbox-data-source",
    name: "本体工具箱_数据源",
    status: "已上架",
    description: "数据源查询",
    creator: "管理员d",
    publisher: "个人",
    pluginType: "数据查询",
    publishScope: "组织发布",
    updatedAt: "2026-05-28 20:35:14",
    createdAt: "2026-05-28 20:35:14",
    tools: [],
  },
  {
    id: "local-platform-toolbox",
    name: "本体平台工具箱",
    status: "已上架",
    description: "本体平台工具箱",
    creator: "管理员d",
    publisher: "个人",
    pluginType: "系统集成",
    publishScope: "公开发布",
    updatedAt: "2026-05-26 19:39:31",
    createdAt: "2026-05-26 19:39:31",
    tools: [],
  },
];

export type OpenApiPluginMountType = "智能体" | "Claw";

export interface OpenApiPluginMountRef {
  id: string;
  name: string;
  type: OpenApiPluginMountType;
}

/** 已挂载 OpenAPI 插件的智能体 / Claw（按插件 ID 索引） */
export const openApiPluginMounts: Record<string, OpenApiPluginMountRef[]> = {
  "local-toolbox-objects-links": [
    { id: "agent-ontology-modeler", name: "本体结构建模助手", type: "智能体" },
    { id: "agent-situational", name: "态势感知智能体", type: "智能体" },
    { id: "claw-ontology-structure", name: "本体结构运维 Claw", type: "Claw" },
    { id: "claw-link-governance", name: "链接治理 Claw", type: "Claw" },
  ],
  "local-toolbox-structure-codex": [
    { id: "agent-schema-editor", name: "Schema 编辑 Copilot", type: "智能体" },
    { id: "claw-meta-inspector", name: "元信息巡检 Claw", type: "Claw" },
  ],
  "local-toolbox-instances": [
    { id: "agent-instance-query", name: "实例检索助手", type: "智能体" },
  ],
  "local-platform-toolbox": [
    { id: "agent-platform-ops", name: "平台运维助手", type: "智能体" },
    { id: "claw-platform-toolbox", name: "平台工具箱 Claw", type: "Claw" },
  ],
};

export function getOpenApiPluginMounts(pluginId: string): OpenApiPluginMountRef[] {
  return openApiPluginMounts[pluginId] ?? [];
}

export function getOpenApiPlugin(pluginId: string) {
  return openApiPlugins.find((plugin) => plugin.id === pluginId);
}

export function getOpenApiTool(pluginId: string, toolId: string) {
  const plugin = getOpenApiPlugin(pluginId);
  if (!plugin) {
    return undefined;
  }

  const tool = plugin.tools.find((item) => item.id === toolId);
  if (!tool) {
    return undefined;
  }

  return { plugin, tool };
}

export function createEmptyOpenApiToolInputParam(): OpenApiToolInputParam {
  return {
    id: `param-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    description: "",
    type: "String",
    required: false,
  };
}
