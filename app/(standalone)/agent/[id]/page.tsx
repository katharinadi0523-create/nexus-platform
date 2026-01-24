"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentLogsView } from "@/components/agent/agent-logs-view";
import { WorkflowEditor } from "@/components/workflow/workflow-editor";
import { AutonomousEditor } from "@/components/agent/autonomous-editor";
import { getAgentById } from "@/lib/agent-data";

// 定义详细数据源
interface AgentDetailData {
  type: "autonomous" | "workflow";
  name: string;
  description: string;
  prompt: string;
  openingStatement: string;
  suggestedQuestions: string[];
  plugins?: unknown;
  ontologies?: Array<{ id: string; name: string; description?: string }>;
  terminologies?: Array<{ id: string; name: string }>;
  mockReply: string;
}

const AGENTS_DETAIL_DATA: Record<string, AgentDetailData> = {
  "osint-01": {
    type: "autonomous",
    name: "OSINT开源情报整编",
    description: "基于全网开源数据的深度情报挖掘与关联分析。",
    prompt: "你是一名资深情报分析师。请调用搜索插件和知识库，对目标实体进行全网画像...",
    openingStatement: "你好，我是情报分析助手。请输入目标名称，我将为您生成研判报告。",
    suggestedQuestions: [
      "分析'暗流'组织的资金来源",
      "生成红海地区最近24小时的安全简报",
      "查询目标人物的关联社交账号",
    ],
    ontologies: [
      {
        id: "onto-1",
        name: "海上态势感知 - 无人机",
        description: "语义检索 (战斗风格_向量)",
      },
    ],
    terminologies: [{ id: "term-1", name: "北约军事术语集 2025" }],
    plugins: [
      {
        id: "plug-1",
        name: "文档解析",
        description: "解析各种格式的文档内容",
        icon: "FileText",
        type: "plugin",
      },
    ],
    mockReply: "收到。正在检索多源情报库... [进度: 80%] 已发现 3 条高置信度线索。建议调用卫星图谱验证。",
  },
  "code-02": {
    type: "autonomous",
    name: "CodeMaster 架构师",
    description: "专注于代码审查、重构建议和技术方案设计。",
    prompt: "你是一个精通 Next.js 和 Python 的全栈架构师...",
    openingStatement: "Talk is cheap, show me the code. 请粘贴代码。",
    suggestedQuestions: [
      "优化这段 React Hooks 代码",
      "如何设计高并发接口？",
    ],
    plugins: ["Code Interpreter"],
    mockReply: "这段代码存在内存泄漏风险。建议使用 useMemo 进行优化。以下是重构后的代码示例...",
  },
  "device-03": {
    type: "autonomous",
    name: "设备维修判断与预测",
    description: "基于传感器数据和历史维修记录，预测设备故障概率。",
    prompt: "你是一个设备维修专家，能够分析传感器数据并预测故障...",
    openingStatement: "你好，我是设备维修助手。请提供传感器数据，我将为您分析设备状态。",
    suggestedQuestions: [
      "分析当前传感器读数",
      "预测设备故障概率",
    ],
    plugins: ["Sensor Data Analyzer"],
    mockReply: "正在分析传感器数据... 检测到异常模式。建议在 48 小时内进行维护检查。",
  },
  "flow-01": {
    type: "workflow",
    name: "数据清洗工作流",
    description: "自动化数据清洗和预处理工作流，支持多数据源输入和标准化输出。",
    prompt: "这是一个工作流智能体，通过可视化流程节点执行数据处理任务。",
    openingStatement: "欢迎使用数据清洗工作流。请提供数据源，我将自动执行清洗流程。",
    suggestedQuestions: [
      "开始数据清洗流程",
      "查看工作流配置",
    ],
    plugins: ["Data Processor", "Schema Validator"],
    mockReply: "工作流已启动。正在执行数据清洗步骤... [步骤 1/5] 数据读取完成。",
  },
};

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params?.id as string;
  const [activeTab, setActiveTab] = useState<"config" | "logs">("config");

  // Load agent data based on ID - synchronous lookup
  const agentData = agentId ? AGENTS_DETAIL_DATA[agentId] || null : null;
  
  // Get agent type from agent-data.ts (source of truth)
  const agentProfile = agentId ? getAgentById(agentId) : null;
  const isWorkflow = agentProfile?.type === "workflow";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header - Fixed */}
      <header className="relative flex h-16 flex-none items-center justify-between border-b border-slate-200 bg-white px-6">
        {/* Left: Back Button & Title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="gap-2 pl-0 hover:bg-transparent hover:text-primary"
            onClick={() => router.push("/agent")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">返回</span>
          </Button>
          <div className="h-6 w-px bg-border" />
          <span className="font-semibold text-base">{agentData?.name || agentProfile?.name || "加载中..."}</span>
        </div>

        {/* Center: Tab Switcher (Absolutely Centered) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("config")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "config"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            应用配置
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "logs"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            日志与调优
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <Button className="bg-slate-900 text-white hover:bg-slate-800">
            <Rocket className="w-4 h-4" />
            发布
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {activeTab === "config" ? (
          isWorkflow ? (
            <WorkflowEditor agentId={agentId} />
          ) : (
            <AutonomousEditor agentId={agentId} initialAgentData={agentData || undefined} />
          )
        ) : (
          <AgentLogsView />
        )}
      </main>
    </div>
  );
}
