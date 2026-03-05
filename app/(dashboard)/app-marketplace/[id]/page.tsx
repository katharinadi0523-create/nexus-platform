"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Menu,
  Plus,
  X,
  Send,
  Paperclip,
  Mic,
  Play,
  Heart,
  Share2,
  TrendingUp,
  FileText,
  Shield,
  Wrench,
  Stethoscope,
  Headphones,
  Building2,
  Scale,
  MapPin,
  FileCheck,
  Code,
  Users,
  Sparkles,
  Crosshair,
  ChevronLeft,
  ChevronRight,
  Brain,
  ImageIcon,
  Puzzle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { checkSensitiveContent } from "@/lib/content-filter";
import { TraceView } from "@/components/agent/trace-view";
import {
  generateSituationalTraceSteps,
  isSituationalQuery,
} from "@/lib/mock/situational-trace";

interface AppDetail {
  id: string;
  title: string;
  author: string;
  description: string;
  tags: string[];
  icon: React.ComponentType<{ className?: string }>;
  stats: {
    downloads: string;
    favorites: string;
  };
  developer: {
    name: string;
    avatarUrl?: string;
    handle: string;
  };
  models: string[];
  workflows: string[];
  usageCount: string;
  favoriteCount: number;
  viewCount?: string;
  shareCount?: string;
  updatedAt?: string;
  publicConfig?: { key: string; value: string; icon: "model" | "mcp" | "plugin" }[];
  privateConfig?: { name: string; count: number }[];
  openingStatement?: string;
  suggestedPrompts?: string[];
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
  timeLabel: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  traceSteps?: import("@/lib/agent-data").ExecutionStep[];
}

// Mock data mapping based on marketplace apps
const getAppDetail = (id: string): AppDetail | null => {
  const appMap: Record<string, AppDetail> = {
    "4": {
      id: "4",
      title: "智能问诊智能体",
      author: "@AppForge",
      description:
        "模拟三甲医院预问诊流程，根据患者主诉生成结构化病历与挂号建议。智能问诊智能体能够快速了解患者症状，提供初步诊断建议，并推荐合适的科室和医生。",
      tags: ["医疗健康"],
      icon: Stethoscope,
      stats: { downloads: "5.1k", favorites: "312" },
      developer: { name: "AppForge", handle: "@AppForge" },
      models: ["DeepSeek", "Qwen"],
      workflows: ["问诊流程", "病历生成"],
      usageCount: "5.1k",
      favoriteCount: 312,
      openingStatement:
        "你好，我是智能问诊智能体。我能帮助你进行初步症状评估，根据你的主诉生成结构化病历，并提供挂号建议。无论你是需要就医咨询还是健康建议，我都能为你提供专业、便捷的医疗服务。请告诉我你的症状或健康问题，我会尽力提供帮助。",
      suggestedPrompts: [
        "我最近总是头痛，可能是什么原因？",
        "如何判断是否需要立即就医？",
        "体检报告显示异常，应该挂哪个科室？",
      ],
    },
    "5": {
      id: "5",
      title: "态势感知智能体",
      author: "@AppForge",
      description:
        "接入MDP平台多维数据，结合本体图谱与推理规则，实现对特定区域或目标的实时态势感知与意图快判。",
      tags: ["数据分析", "国防军工"],
      icon: Crosshair,
      stats: { downloads: "6.3k", favorites: "445" },
      developer: { name: "中国电子云", handle: "@monkeyking" },
      models: ["DeepSeek-R1 6B", "Qwen", "Llama"],
      workflows: ["情报分析", "意图研判"],
      usageCount: "24k",
      favoriteCount: 51,
      viewCount: "90k",
      shareCount: "99",
      updatedAt: "2025/05/05 15:15:15",
      publicConfig: [
        { key: "模型", value: "DeepSeek-R1 6B", icon: "model" },
        { key: "MCP", value: "图片理解", icon: "mcp" },
        { key: "插件", value: "文档解析", icon: "plugin" },
      ],
      privateConfig: [
        { name: "模型", count: 2 },
        { name: "知识库", count: 2 },
        { name: "本体对象", count: 2 },
        { name: "术语库", count: 2 },
        { name: "工作流", count: 2 },
        { name: "插件", count: 2 },
        { name: "MCP", count: 2 },
      ],
      openingStatement:
        "你好，我是态势感知智能体。我可以进行实时态势分析和威胁评估，请提供目标信息。",
      suggestedPrompts: ["实时分析海面目标的身份与威胁等级"],
    },
    "6": {
      id: "6",
      title: "企业信息查询",
      author: "@AppForge",
      description:
        "聚合工商、司法、舆情等多维数据，一键生成企业尽职调查报告。帮助企业快速了解合作伙伴背景，识别潜在风险，支持投资决策和商业合作。",
      tags: ["商业查询"],
      icon: Building2,
      stats: { downloads: "4.7k", favorites: "278" },
      developer: { name: "AppForge", handle: "@AppForge" },
      models: ["DeepSeek", "Qwen"],
      workflows: ["企业查询流程", "报告生成"],
      usageCount: "4.7k",
      favoriteCount: 278,
      openingStatement:
        "你好，我是企业信息查询助手。我能帮助你查询企业的工商信息、司法风险、舆情动态等多维度数据，并生成专业的尽职调查报告。无论你是进行商业合作、投资决策还是风险评估，我都能为你提供准确、全面的企业信息。请告诉我你需要查询的企业名称或关键词。",
      suggestedPrompts: [
        "查询某公司的工商信息和股权结构",
        "如何评估企业的信用风险？",
        "企业尽职调查报告包含哪些内容？",
      ],
    },
    "7": {
      id: "7",
      title: "司法笔录智能体",
      author: "@AppForge",
      description:
        "实时语音转写并自动提取案件关键要素，生成符合法律规范的询问笔录。大幅提升司法工作效率，确保笔录的准确性和规范性。",
      tags: ["政务司法"],
      icon: Scale,
      stats: { downloads: "3.9k", favorites: "201" },
      developer: { name: "AppForge", handle: "@AppForge" },
      models: ["DeepSeek", "Qwen"],
      workflows: ["笔录生成流程"],
      usageCount: "3.9k",
      favoriteCount: 201,
      openingStatement:
        "你好，我是司法笔录智能体。我能帮助你进行实时语音转写，自动提取案件关键要素，并生成符合法律规范的询问笔录。无论你是法官、检察官还是律师，我都能为你提供高效、准确的司法工作支持。请告诉我你的需求。",
      suggestedPrompts: [
        "如何生成标准的询问笔录？",
        "笔录中的关键要素有哪些？",
        "如何确保笔录的合法性和规范性？",
      ],
    },
    "8": {
      id: "8",
      title: "高德地图插件",
      author: "@AppForge官方",
      description:
        "集成多能力，精准导航、智能推荐，出行超便捷。提供实时路况、路线规划、地点搜索等功能，让出行更加智能高效。",
      tags: ["效率工具"],
      icon: MapPin,
      stats: { downloads: "8.2k", favorites: "567" },
      developer: { name: "AppForge官方", handle: "@AppForge官方" },
      models: ["DeepSeek", "Qwen"],
      workflows: ["导航流程"],
      usageCount: "8.2k",
      favoriteCount: 567,
      openingStatement:
        "你好，我是高德地图插件。我能帮助你进行精准导航、路线规划、地点搜索等功能。无论你是日常出行还是长途旅行，我都能为你提供最便捷的导航服务。请告诉我你的出行需求。",
      suggestedPrompts: [
        "查询从A地到B地的最佳路线",
        "附近的餐厅推荐",
        "实时路况查询",
      ],
    },
    "9": {
      id: "9",
      title: "合同审查助手",
      author: "@中国电子云",
      description:
        "针对合同管理的核心环节，提供从文档解析到风险评估的一体化服务。帮助企业和个人快速识别合同风险，提供专业审查建议。",
      tags: ["法务"],
      icon: FileCheck,
      stats: { downloads: "4.1k", favorites: "234" },
      developer: { name: "中国电子云", handle: "@中国电子云" },
      models: ["DeepSeek", "Qwen", "Llama"],
      workflows: ["合同审查流程"],
      usageCount: "4.1k",
      favoriteCount: 234,
      openingStatement:
        "你好，我是合同审查助手。我能帮助你审查合同内容，识别潜在风险，并提供专业建议。无论你是个人还是企业，我都能为你提供便捷、高效的合同审查服务。请告诉我你的合同相关需求，我会尽力提供帮助。",
      suggestedPrompts: [
        "这份合同的违约条款是否严谨？",
        "合同中的权责是否明确？",
        "合同审查需要注意哪些法律风险？",
      ],
    },
    "10": {
      id: "10",
      title: "代码审计专家",
      author: "@AppForge",
      description:
        "自动扫描代码漏洞，提供修复建议，支持主流编程语言。帮助开发团队快速发现安全问题，提升代码质量和安全性。",
      tags: ["开发工具"],
      icon: Code,
      stats: { downloads: "7.5k", favorites: "489" },
      developer: { name: "AppForge", handle: "@AppForge" },
      models: ["DeepSeek", "Qwen"],
      workflows: ["代码审计流程"],
      usageCount: "7.5k",
      favoriteCount: 489,
      openingStatement:
        "你好，我是代码审计专家。我能帮助你自动扫描代码漏洞，识别安全问题，并提供专业的修复建议。无论你是独立开发者还是企业团队，我都能为你提供全面、准确的代码安全审计服务。请告诉我你需要审计的代码类型或具体问题。",
      suggestedPrompts: [
        "如何识别常见的安全漏洞？",
        "代码审计的最佳实践是什么？",
        "如何修复SQL注入漏洞？",
      ],
    },
    "11": {
      id: "11",
      title: "HR招聘助手",
      author: "@AppForge",
      description:
        "自动筛选简历，生成面试提纲，根据JD匹配度进行打分。大幅提升HR工作效率，帮助企业快速找到合适的人才。",
      tags: ["人力资源"],
      icon: Users,
      stats: { downloads: "5.8k", favorites: "356" },
      developer: { name: "AppForge", handle: "@AppForge" },
      models: ["DeepSeek", "Qwen"],
      workflows: ["招聘流程", "简历筛选"],
      usageCount: "5.8k",
      favoriteCount: 356,
      openingStatement:
        "你好，我是HR招聘助手。我能帮助你自动筛选简历，生成面试提纲，并根据JD匹配度进行打分。无论你是HR专员还是招聘经理，我都能为你提供高效、智能的招聘支持。请告诉我你的招聘需求。",
      suggestedPrompts: [
        "如何评估简历与岗位的匹配度？",
        "生成一份前端开发工程师的面试提纲",
        "筛选简历时应该关注哪些关键点？",
      ],
    },
  };

  return appMap[id] || null;
};

// Mock conversation history
const getMockConversations = (): Conversation[] => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 5);

  return [
    {
      id: "conv-1",
      title: "昨天 15:30 会话",
      updatedAt: new Date(yesterday.setHours(15, 30, 0)),
      timeLabel: "昨天",
    },
    {
      id: "conv-2",
      title: "过去 7 天 会话 1",
      updatedAt: lastWeek,
      timeLabel: "过去 7 天",
    },
    {
      id: "conv-3",
      title: "过去 7 天 会话 2",
      updatedAt: new Date(lastWeek.getTime() - 2 * 24 * 60 * 60 * 1000),
      timeLabel: "过去 7 天",
    },
  ];
};

export default function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [app, setApp] = useState<AppDetail | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(true);

  useEffect(() => {
    if (!id) return;

    const appDetail = getAppDetail(id);
    if (!appDetail) {
      // App not found, redirect or show error
      router.push("/app-marketplace");
      return;
    }

    setApp(appDetail);
    setConversations(getMockConversations());

    // If app has opening statement, show it as initial message
    if (appDetail.openingStatement) {
      setMessages([
        {
          id: "msg-init",
          role: "assistant",
          content: appDetail.openingStatement,
          timestamp: new Date(),
        },
      ]);
    }
  }, [id, router]);

  // Generate intelligent response based on app type and user query
  const generateMockResponse = (appId: string, userQuery: string): string => {
    const query = userQuery.toLowerCase();

    // 智能问诊智能体 (id: 4)
    if (appId === "4") {
      if (query.includes("头痛") || query.includes("头疼")) {
        return "头痛可能由多种原因引起，包括：\n\n1. **紧张性头痛**：压力、疲劳或长时间工作引起\n2. **偏头痛**：可能与遗传、激素变化或某些食物有关\n3. **鼻窦炎**：感冒或过敏引起\n4. **颈椎问题**：长时间低头工作\n\n建议：\n- 注意休息，保证充足睡眠\n- 可以尝试热敷或按摩太阳穴\n- 如果头痛持续超过48小时或伴随其他症状（如发烧、视力模糊），建议尽快就医\n\n您可以尝试挂**神经内科**或**普通内科**进行进一步检查。";
      }
      if (query.includes("立即就医") || query.includes("急诊") || query.includes("什么时候")) {
        return "出现以下情况时，建议立即就医：\n\n🚨 **紧急情况**：\n- 剧烈头痛伴有意识模糊、癫痫发作\n- 持续高烧（超过39°C）\n- 胸痛、呼吸困难\n- 严重外伤\n- 急性腹痛\n\n⚠️ **需要及时就医**：\n- 症状持续超过3天且无改善\n- 出现新的严重症状\n- 慢性疾病急性发作\n- 怀疑传染性疾病\n\n建议：紧急情况拨打120，一般情况可挂相应科室的门诊。";
      }
      if (query.includes("体检") || query.includes("异常") || query.includes("科室")) {
        return "根据体检报告异常项，建议挂以下科室：\n\n- **血常规异常** → 血液内科\n- **肝功能异常** → 消化内科/肝病科\n- **肾功能异常** → 肾内科\n- **心电图异常** → 心内科\n- **胸部CT异常** → 胸外科/呼吸内科\n- **甲状腺异常** → 内分泌科\n- **妇科检查异常** → 妇科\n\n建议：\n1. 携带完整体检报告\n2. 提前预约挂号\n3. 告知医生具体异常指标\n\n需要我帮您分析具体哪项指标异常吗？";
      }
      return "感谢您的咨询。作为智能问诊助手，我可以帮助您：\n\n- 初步症状评估\n- 推荐合适的科室\n- 生成结构化病历\n- 提供健康建议\n\n请详细描述您的症状，我会尽力为您提供帮助。如需紧急医疗帮助，请立即拨打120或前往最近的急诊科。";
    }

    // 态势感知智能体 (id: 5) - 内容在执行链路 final_answer 中，此处返回空，由 traceSteps 承载
    if (appId === "5" && isSituationalQuery(query)) {
      return "";
    }
    if (appId === "5") {
      return "您好！我是态势感知智能体。\n\n我可以进行实时态势分析和威胁评估，请提供目标信息（如位置、特征等）。";
    }

    // 企业信息查询 (id: 6)
    if (appId === "6") {
      if (query.includes("工商") || query.includes("股权") || query.includes("查询")) {
        return "企业工商信息查询包含以下内容：\n\n**基本信息**：\n- 企业名称、统一社会信用代码\n- 注册地址、成立日期\n- 法定代表人、注册资本\n\n**股权结构**：\n- 股东名称及持股比例\n- 实际控制人信息\n- 对外投资情况\n\n**经营状态**：\n- 存续/注销/吊销状态\n- 经营范围\n- 变更记录\n\n**如何查询**：\n1. 提供企业全称或统一社会信用代码\n2. 系统将自动检索工商数据\n3. 生成结构化报告\n\n请输入您要查询的企业名称，我会为您生成详细的工商信息报告。";
      }
      if (query.includes("风险") || query.includes("信用") || query.includes("评估")) {
        return "企业风险评估包括多个维度：\n\n**司法风险**：\n- 法律诉讼记录（作为原告/被告）\n- 被执行记录\n- 失信被执行人记录\n- 行政处罚记录\n\n**经营风险**：\n- 经营异常记录\n- 严重违法失信记录\n- 股权质押情况\n\n**舆情风险**：\n- 负面新闻监测\n- 媒体关注度\n- 行业评价\n\n**信用评级**：\n- 综合信用得分（0-100分）\n- 风险等级（低/中/高）\n- 建议合作等级\n\n**评估建议**：\n- 高风险企业：谨慎合作，加强风控\n- 中风险企业：正常合作，定期监控\n- 低风险企业：可正常合作\n\n需要我为您生成详细的风险评估报告吗？";
      }
      if (query.includes("尽职调查") || query.includes("报告") || query.includes("包含")) {
        return "企业尽职调查报告通常包含以下内容：\n\n**一、企业基本信息**\n- 工商注册信息\n- 股权结构分析\n- 实际控制人识别\n\n**二、经营状况分析**\n- 财务状况（如有公开数据）\n- 行业地位\n- 主营业务分析\n\n**三、法律风险扫描**\n- 司法诉讼记录\n- 行政处罚情况\n- 知识产权状况\n\n**四、信用评估**\n- 信用评级\n- 历史信用记录\n- 行业口碑\n\n**五、关联方分析**\n- 关联企业查询\n- 关联人员识别\n- 关联交易情况\n\n**六、综合建议**\n- 合作建议\n- 风险提示\n- 重点关注事项\n\n报告将以PDF格式生成，包含详细的数据来源和评估依据。需要我为您生成报告吗？";
      }
      return "您好！我是企业信息查询助手。\n\n我可以帮您：\n- 查询企业工商信息\n- 评估企业信用风险\n- 生成尽职调查报告\n- 监测企业舆情动态\n\n请提供企业名称或统一社会信用代码，我会为您提供全面的企业信息查询服务。";
    }

    // 司法笔录智能体 (id: 7)
    if (appId === "7") {
      if (query.includes("笔录") || query.includes("生成") || query.includes("询问")) {
        return "司法询问笔录的标准格式包括：\n\n**笔录标题**：\n- 询问时间、地点\n- 询问人、记录人\n- 被询问人基本信息\n\n**正文内容**：\n- 告知被询问人权利义务\n- 询问笔录正文（一问一答格式）\n- 关键事实确认\n\n**结尾部分**：\n- 询问人、被询问人签名\n- 笔录页数确认\n- 日期盖章\n\n**生成流程**：\n1. 语音转写：自动识别询问对话\n2. 要素提取：识别关键信息点（人物、时间、地点、事件）\n3. 格式规范：按照法律规范格式化\n4. 审查确认：生成后需人工审核\n\n**注意事项**：\n- 确保内容真实完整\n- 符合法律程序要求\n- 当事人确认签字\n\n需要我帮您生成询问笔录吗？";
      }
      if (query.includes("要素") || query.includes("关键") || query.includes("包含")) {
        return "司法笔录中的关键要素包括：\n\n**人员要素**：\n- 当事人身份信息\n- 证人信息\n- 相关责任人\n\n**时间要素**：\n- 事件发生时间\n- 关键时间节点\n- 时间顺序\n\n**地点要素**：\n- 事件发生地点\n- 相关场所\n- 地理位置\n\n**事件要素**：\n- 事件经过描述\n- 行为方式\n- 结果和影响\n\n**证据要素**：\n- 物证、书证\n- 证人证言\n- 视听资料\n\n**程序要素**：\n- 权利义务告知\n- 程序合法性确认\n- 签字确认\n\n系统会自动识别并提取这些关键要素，生成结构化的笔录内容。";
      }
      if (query.includes("合法") || query.includes("规范") || query.includes("法律")) {
        return "确保司法笔录的合法性和规范性，需要注意：\n\n**程序合法性**：\n- 询问人具备执法资格\n- 告知被询问人权利义务\n- 询问过程全程录音录像\n- 笔录制作及时、完整\n\n**内容规范性**：\n- 如实记录，不得遗漏关键信息\n- 使用法律术语，表述准确\n- 时间、地点、人员等信息完整\n- 一问一答格式清晰\n\n**格式要求**：\n- 符合《刑事诉讼法》《民事诉讼法》等相关规定\n- 统一格式，便于归档\n- 页码清晰，无涂改\n\n**审查要点**：\n- 内容真实性核查\n- 程序合法性审查\n- 格式规范性检查\n- 签字确认完整性\n\n系统会自动检查这些要点，确保生成的笔录符合法律规范。";
      }
      return "您好！我是司法笔录智能体。\n\n我可以帮您：\n- 实时语音转写询问对话\n- 自动提取案件关键要素\n- 生成符合法律规范的询问笔录\n\n请告诉我您的需求，我会按照法律程序要求为您生成规范的笔录。";
    }

    // 默认回复
    return "感谢您的提问。这是一个模拟回复，实际应用中会连接AI模型生成回答。";
  };

  const handleSendMessage = (overrideContent?: string) => {
    const content = (overrideContent ?? inputValue).trim();
    if (!content || !app) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userQuery = content;
    if (!overrideContent) setInputValue("");

    // 检测敏感词
    const blockedResponse = checkSensitiveContent(userQuery);
    
    if (blockedResponse) {
      // 如果包含敏感词，直接返回拦截响应
      setTimeout(() => {
        const aiMessage: Message = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: blockedResponse,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }, 500);
      return;
    }

    // 态势感知智能体 (id: 5)：与 agent-situational 预览一致，使用执行链路
    const isSituational =
      app.id === "5" && isSituationalQuery(userQuery);
    const traceSteps = isSituational ? generateSituationalTraceSteps(userQuery) : undefined;
    const responseContent = isSituational
      ? ""
      : ["4", "5", "6", "7"].includes(app.id)
        ? generateMockResponse(app.id, userQuery)
        : "感谢您的提问。这是一个模拟回复，实际应用中会连接AI模型生成回答。";

    setTimeout(() => {
      const aiMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
        traceSteps,
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 800 + Math.random() * 400); // 模拟AI思考时间 800-1200ms
  };

  const handleSuggestedPromptClick = (prompt: string) => {
    handleSendMessage(prompt);
    setInputValue("");
  };

  const handleNewConversation = () => {
    setSelectedConversationId(null);
    if (app?.openingStatement) {
      setMessages([
        {
          id: "msg-init",
          role: "assistant",
          content: app.openingStatement,
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([]);
    }
  };

  if (!app) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const Icon = app.icon;
  const showEmptyState = messages.length === 0 || (messages.length === 1 && messages[0].role === "assistant");

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white">
      {/* Left Sidebar - History */}
      <div className="w-64 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* App Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {app.title}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {app.author}
              </div>
            </div>
          </div>
        </div>

        {/* New Conversation Button */}
        <div className="p-4">
          <Button
            onClick={handleNewConversation}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            新会话
          </Button>
        </div>

        {/* Conversation History */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {conversations.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">
                暂无历史会话
              </div>
            ) : (
              <>
                {conversations.reduce(
                  (acc, conv, idx) => {
                    const prevConv = idx > 0 ? conversations[idx - 1] : null;
                    const shouldShowLabel =
                      !prevConv || prevConv.timeLabel !== conv.timeLabel;
                    if (shouldShowLabel) {
                      acc.push(
                        <div key={`label-${conv.timeLabel}`} className="text-xs text-gray-500 font-medium pt-2 pb-1">
                          {conv.timeLabel}
                        </div>
                      );
                    }
                    acc.push(
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversationId(conv.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                          selectedConversationId === conv.id
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        {conv.title}
                      </button>
                    );
                    return acc;
                  },
                  [] as React.ReactNode[]
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{app.title}</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-600 font-medium">Online</span>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-8">
            {showEmptyState ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
                {/* App Icon */}
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <Icon className="h-10 w-10" />
                </div>

                {/* Greeting */}
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Hi，我是 {app.title}
                  </h3>
                  {messages.length > 0 && messages[0].content && (
                    <p className="text-gray-600 max-w-2xl mt-4">
                      {messages[0].content}
                    </p>
                  )}
                </div>

                {/* Suggested Prompts */}
                {app.suggestedPrompts && app.suggestedPrompts.length > 0 && (
                  <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                    {app.suggestedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestedPromptClick(prompt)}
                        className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex flex-col gap-1",
                      message.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    {message.content.trim() !== "" && (
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-4 py-2",
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    )}
                    {message.role === "assistant" &&
                      message.traceSteps &&
                      message.traceSteps.length > 0 && (
                        <div className="w-full max-w-[90%] mt-2">
                          <div className="bg-white border-2 border-blue-200 rounded-lg p-4 shadow-sm">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3">
                              执行链路
                            </h4>
                            <TraceView steps={message.traceSteps} />
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 px-2 py-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-700"
                title="深度思考"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="您好，有什么可以帮您？"
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-700"
                title="上传文件"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-700"
                title="语音输入"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                size="icon"
                className="h-8 w-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white"
                title="发送"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 text-xs text-gray-400 text-center">
              内容由AI生成，仅供参考
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - App Details (Collapsible) */}
      <div
        className={`border-l border-gray-200 bg-white flex flex-col transition-all duration-200 ${
          detailsPanelOpen ? "w-80" : "w-12"
        }`}
      >
        {detailsPanelOpen ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="text-base font-semibold text-gray-900">
                应用详情
              </h3>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDetailsPanelOpen(false)}
                  className="h-7 w-7 text-gray-500 hover:text-gray-700"
                  title="收起"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="h-7 w-7 text-gray-500 hover:text-gray-700"
                  title="关闭"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 space-y-5">
                {/* Stats - 4 columns */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {app.viewCount ?? app.stats.downloads}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">浏览量</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {app.usageCount}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">使用量</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {app.favoriteCount}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">收藏量</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {app.shareCount ??
                        String(Math.min(99, Math.floor(app.favoriteCount * 0.25)))}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">分享量</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-200 bg-white hover:bg-gray-50"
                  >
                    <Heart className="h-4 w-4 mr-1.5" />
                    收藏
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-200 bg-white hover:bg-gray-50"
                  >
                    <Share2 className="h-4 w-4 mr-1.5" />
                    分享
                  </Button>
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {app.description}
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    应用标签
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {app.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-gray-100 text-gray-600 hover:bg-gray-200 font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 发布信息 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    发布信息
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      发布人: {app.developer.name} {app.developer.handle}
                    </div>
                    <div>
                      更新时间: {app.updatedAt ?? "2025/05/05 15:15:15"}
                    </div>
                  </div>
                </div>

                {/* 公开配置 */}
                {(() => {
                  const publicCfg =
                    app.publicConfig ?? [
                      { key: "模型", value: app.models[0] ?? "-", icon: "model" as const },
                      { key: "MCP", value: "图片理解", icon: "mcp" as const },
                      { key: "插件", value: "文档解析", icon: "plugin" as const },
                    ];
                  return publicCfg.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      公开配置
                    </h4>
                    <div className="space-y-2">
                      {publicCfg.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="text-gray-500 w-14 shrink-0">
                            {item.key}
                          </span>
                          {item.icon === "model" && (
                            <Brain className="h-4 w-4 text-gray-400 shrink-0" />
                          )}
                          {item.icon === "mcp" && (
                            <ImageIcon className="h-4 w-4 text-gray-400 shrink-0" />
                          )}
                          {item.icon === "plugin" && (
                            <Puzzle className="h-4 w-4 text-gray-400 shrink-0" />
                          )}
                          <span className="text-gray-900 truncate">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  ) : null;
                })()}

                {/* 私有配置 */}
                {(() => {
                  const privateCfg =
                    app.privateConfig ?? [
                      { name: "模型", count: app.models.length },
                      { name: "知识库", count: 2 },
                      { name: "本体对象", count: 2 },
                      { name: "术语库", count: 2 },
                      { name: "工作流", count: app.workflows?.length ?? 2 },
                      { name: "插件", count: 2 },
                      { name: "MCP", count: 2 },
                    ];
                  return privateCfg.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      私有配置
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {privateCfg.map((item) => (
                        <Badge
                          key={item.name}
                          variant="secondary"
                          className="bg-gray-100 text-gray-600 hover:bg-gray-200 font-normal"
                        >
                          {item.name}*{item.count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  ) : null;
                })()}
              </div>
            </ScrollArea>
          </>
        ) : (
          /* Collapsed state - narrow bar */
          <div className="flex flex-col items-center py-4 gap-2 h-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDetailsPanelOpen(true)}
              className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              title="展开应用详情"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              title="关闭"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
