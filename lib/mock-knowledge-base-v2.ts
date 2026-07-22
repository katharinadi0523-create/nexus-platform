export type KnowledgeBaseStatus = "已启用" | "已停用";
export type KnowledgeBaseCreateMode = "自定义创建" | "模板创建";

export interface KnowledgeBaseGroupNode {
  id: string;
  name: string;
  count?: number;
  children?: KnowledgeBaseGroupNode[];
}

export interface KnowledgeBaseRowV2 {
  id: string;
  name: string;
  createMode: KnowledgeBaseCreateMode;
  status: KnowledgeBaseStatus;
  documentCount: number;
  updatedAt: string;
  createdBy: string;
  createdAt: string;
  description: string;
  groupName: string;
}

export interface KnowledgeDocumentRow {
  id: string;
  name: string;
  type: string;
  processStatus: "已启用" | "已停用" | "解析失败" | "切片失败";
  usageStatus: KnowledgeBaseStatus;
  quality: string;
  complexity: string;
  size: string;
  uploader: string;
  uploadedAt: string;
  metadataFields?: Array<{
    name: string;
    description: string;
    matchModes: string[];
  }>;
  documentTags?: string[];
  contentTags?: string[];
}

export const knowledgeBaseGroupsV2: KnowledgeBaseGroupNode[] = [
  {
    id: "all",
    name: "全部群组",
    children: [
      {
        id: "level-2",
        name: "二级",
        children: [
          {
            id: "level-3",
            name: "三级目录",
            children: [
              {
                id: "level-4",
                name: "四级目录",
                children: [{ id: "level-5", name: "五级目录" }],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const knowledgeBasesV2: KnowledgeBaseRowV2[] = [
  {
    id: "docstore_JzrYZMN9",
    name: "奶茶测试翻版",
    createMode: "自定义创建",
    status: "已停用",
    documentCount: 3,
    updatedAt: "2026-07-20 16:07:07",
    createdBy: "chenpengxu",
    createdAt: "2026-07-20 14:21:42",
    description: "1",
    groupName: "全部群组",
  },
  {
    id: "docstore_milk-tea",
    name: "奶茶",
    createMode: "自定义创建",
    status: "已停用",
    documentCount: 1,
    updatedAt: "2026-07-20 14:15:13",
    createdBy: "chenpengxu",
    createdAt: "2026-07-20 14:13:12",
    description: "奶茶资料测试知识库",
    groupName: "全部群组",
  },
  {
    id: "docstore_kb5",
    name: "知识库_5",
    createMode: "自定义创建",
    status: "已停用",
    documentCount: 1,
    updatedAt: "2026-07-20 14:22:03",
    createdBy: "liyushan",
    createdAt: "2026-07-20 13:42:55",
    description: "检索配置测试",
    groupName: "全部群组",
  },
  {
    id: "docstore_table",
    name: "表格知识库",
    createMode: "自定义创建",
    status: "已停用",
    documentCount: 2,
    updatedAt: "2026-07-20 14:14:36",
    createdBy: "chenpengxu",
    createdAt: "2026-07-20 11:02:21",
    description: "表格型数据导入测试",
    groupName: "全部群组",
  },
  {
    id: "docstore_image",
    name: "图片知识库",
    createMode: "自定义创建",
    status: "已停用",
    documentCount: 3,
    updatedAt: "2026-07-20 11:18:08",
    createdBy: "chenpengxu",
    createdAt: "2026-07-20 10:04:19",
    description: "图片解析与 OCR 测试",
    groupName: "全部群组",
  },
  {
    id: "docstore_trade",
    name: "中德经贸",
    createMode: "自定义创建",
    status: "已停用",
    documentCount: 1,
    updatedAt: "2026-07-17 00:48:55",
    createdBy: "邸若楠",
    createdAt: "2026-07-17 00:28:36",
    description: "中德经贸资料",
    groupName: "全部群组",
  },
  {
    id: "docstore_kb1",
    name: "知识库_1",
    createMode: "自定义创建",
    status: "已停用",
    documentCount: 1,
    updatedAt: "2026-07-10 16:26:08",
    createdBy: "sujianzhuo",
    createdAt: "2026-07-10 16:23:52",
    description: "知识库配置回归验证",
    groupName: "全部群组",
  },
];

export const knowledgeDocumentsV2: Record<string, KnowledgeDocumentRow[]> = {
  "docstore_milk-tea": [
    {
      id: "doc-milk-tea-1",
      name: "奶茶产品手册.pdf",
      type: "pdf",
      processStatus: "已启用",
      usageStatus: "已启用",
      quality: "高",
      complexity: "低",
      size: "2.4 MB",
      uploader: "chenpengxu",
      uploadedAt: "2026-07-20 14:15:13",
    },
  ],
  docstore_table: [
    {
      id: "doc-table-1",
      name: "饮品门店销售数据.xlsx",
      type: "xlsx",
      processStatus: "已启用",
      usageStatus: "已启用",
      quality: "中",
      complexity: "中",
      size: "884 KB",
      uploader: "chenpengxu",
      uploadedAt: "2026-07-20 11:08:21",
    },
    {
      id: "doc-table-2",
      name: "供应商报价表.xlsx",
      type: "xlsx",
      processStatus: "已停用",
      usageStatus: "已停用",
      quality: "中",
      complexity: "低",
      size: "412 KB",
      uploader: "chenpengxu",
      uploadedAt: "2026-07-20 11:14:36",
    },
  ],
};

export function getKnowledgeBaseV2(id: string) {
  return knowledgeBasesV2.find((item) => item.id === id) ?? knowledgeBasesV2[0];
}

export function getKnowledgeDocumentsV2(id: string) {
  return knowledgeDocumentsV2[id] ?? [];
}
