export type SkillMarketplaceSourceType = "platform" | "org";

export interface SkillMarketplaceItem {
  id: string;
  name: string;
  author: string;
  description: string;
  category: string;
  sourceType: SkillMarketplaceSourceType;
  tags: string[];
}

export const skillMarketplaceItems: SkillMarketplaceItem[] = [
  {
    id: "outing-report",
    name: "外出报备",
    author: "综合办公室",
    description: "生成外出申请、补充事由和时间安排，串联报备、审批与回执说明。",
    category: "通用",
    sourceType: "org",
    tags: ["外出", "报备", "审批"],
  },
  {
    id: "product-data-analysis",
    name: "产品数据分析",
    author: "产品运营中心",
    description: "围绕活跃、转化、留存、需求反馈和版本效果输出结构化分析结论。",
    category: "数据分析",
    sourceType: "platform",
    tags: ["产品", "数据分析", "转化"],
  },
  {
    id: "crm-sales-management",
    name: "CRM销售管理",
    author: "销售运营中心",
    description: "整理客户跟进记录、商机推进状态和回款风险，输出销售管理建议。",
    category: "企业服务",
    sourceType: "org",
    tags: ["CRM", "销售", "客户管理"],
  },
  {
    id: "af-rag",
    name: "制度流程查询",
    author: "平台办公中心",
    description: "结合制度库、流程手册和审批规范，快速回答请示、采购、报销等常见流程问题。",
    category: "通用",
    sourceType: "platform",
    tags: ["制度", "流程", "审批"],
  },
  {
    id: "af-ask-data",
    name: "经营问数",
    author: "平台经营中心",
    description: "围绕经营指标、项目数据和预算执行情况直接提问，快速形成口径说明和异常分析。",
    category: "通用",
    sourceType: "platform",
    tags: ["经营分析", "指标", "预算"],
  },
  {
    id: "cestc-mail",
    name: "正式邮件撰写",
    author: "综合办公室",
    description: "起草对内对外正式邮件，自动补齐背景、配合动作和反馈时限。",
    category: "通用",
    sourceType: "org",
    tags: ["邮件", "催办", "汇报"],
  },
  {
    id: "lanxin-communication",
    name: "蓝信通知编写",
    author: "办公协同中心",
    description: "把会议安排、任务提醒和值班通知整理成适合蓝信发送的短消息。",
    category: "通用",
    sourceType: "org",
    tags: ["蓝信", "通知", "通讯协同"],
  },
  {
    id: "travel-expense",
    name: "差旅申请与报销",
    author: "共享服务中心",
    description:
      "根据上传的差旅票据图片和行程信息，生成差旅申请说明、整理报销材料，并衔接验票与自动填单流程。",
    category: "通用",
    sourceType: "org",
    tags: ["差旅", "报销", "审批", "验票", "填单"],
  },
  {
    id: "xlsx",
    name: "生产日报汇总",
    author: "制造运营中心",
    description: "汇总各班组产量、停机、质量和交付数据，自动形成生产日报并标出异常波动。",
    category: "数据分析",
    sourceType: "platform",
    tags: ["生产", "制造", "日报"],
  },
  {
    id: "frontend-design",
    name: "业务系统需求说明",
    author: "数字化建设部",
    description: "把调研纪要、审批流程和表单字段整理成业务系统需求说明。",
    category: "开发工具",
    sourceType: "platform",
    tags: ["需求", "项目管理", "系统建设"],
  },
  {
    id: "doc-coauthoring",
    name: "会议纪要整理",
    author: "综合办公室",
    description: "根据会议记录和待办事项快速形成正式纪要，明确责任人和时间节点。",
    category: "通讯协作",
    sourceType: "org",
    tags: ["纪要", "会议", "待办"],
  },
  {
    id: "brand-guidelines",
    name: "合同条款审阅",
    author: "法务合规部",
    description: "梳理合同关键条款、识别履约与付款风险，并生成审阅意见。",
    category: "企业服务",
    sourceType: "org",
    tags: ["合同", "法务", "合规"],
  },
  {
    id: "mcp-builder",
    name: "设备巡检记录整理",
    author: "设备管理中心",
    description: "汇总巡检记录、缺陷照片和处理意见，形成设备缺陷台账和整改清单。",
    category: "效率工具",
    sourceType: "org",
    tags: ["巡检", "台账", "电力"],
  },
  {
    id: "workflow-copilot",
    name: "公文写作",
    author: "公文规范组",
    description: "根据事项背景、请示内容和报送对象生成正式公文。",
    category: "通用",
    sourceType: "platform",
    tags: ["公文", "请示", "报告"],
  },
  {
    id: "ops-automation",
    name: "运输日报生成",
    author: "运输调度中心",
    description: "整合车队、线路、时效和异常信息，快速形成运输日报和问题清单。",
    category: "效率工具",
    sourceType: "org",
    tags: ["运输", "物流", "日报"],
  },
  {
    id: "public-opinion",
    name: "企业舆情整理",
    author: "投资研究中心",
    description: "汇总新闻、公告和公开资料，形成企业舆情摘要和风险提示。",
    category: "数据分析",
    sourceType: "platform",
    tags: ["舆情", "金融", "风控"],
  },
];
