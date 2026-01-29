"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Edit, RefreshCw, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Mock data for protection task detail
const mockProtectionTasks: Record<string, any> = {
  "1": {
    id: "1",
    name: "科研智能体内容合规检测",
    taskId: "task-research-compliance-001",
    description: "针对科研智能体的内容合规检测任务，通过策略和词库双重防护，确保科研场景下的内容安全。",
    protectedObjectCount: 16,
  },
  "2": {
    id: "2",
    name: "医疗问答敏感信息过滤",
    taskId: "task-medical-filter-002",
    description: "医疗场景下的敏感信息过滤任务，保护患者隐私信息，确保医疗数据安全。",
    protectedObjectCount: 12,
  },
  "3": {
    id: "3",
    name: "金融客服风险内容拦截",
    taskId: "task-finance-risk-003",
    description: "金融客服场景的风险内容拦截任务，防范金融诈骗和敏感信息泄露。",
    protectedObjectCount: 19,
  },
  "gf-protection": {
    id: "gf-protection",
    name: "GF专属防护",
    taskId: "task-gf-exclusive-001",
    description: "GF项目专属安全防护任务，针对GF项目场景定制的内容合规检测和敏感信息过滤，确保项目数据安全和合规性。",
    protectedObjectCount: 8,
  },
};

export default function ProtectionTaskDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const taskId = params.id as string;
  const [activeTab, setActiveTab] = useState<"objects" | "info" | "logs">("objects");

  // Handle tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "info" || tabParam === "objects" || tabParam === "logs") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const taskDetail = useMemo(() => {
    return mockProtectionTasks[taskId] || {
      id: taskId,
      name: "防护任务",
      taskId: `task-${taskId}`,
      description: "防护任务描述",
      protectedObjectCount: 0,
    };
  }, [taskId]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(taskDetail.taskId);
    toast.success("已复制到剪贴板");
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Top Header */}
      <div className="border-b bg-white">
        {/* Header Row 1: Title and Back */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/security/protection-task"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">{taskDetail.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                任务ID: {taskDetail.taskId}
                <button
                  onClick={handleCopyId}
                  className="ml-2 inline-flex items-center text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Header Row 2: Tabs */}
        <div className="px-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "objects" | "info" | "logs")}>
            <TabsList className="h-10 bg-transparent border-b border-transparent p-0">
              <TabsTrigger
                value="objects"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600"
              >
                防护对象
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600"
              >
                任务信息
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600"
              >
                防护日志
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "objects" | "info" | "logs")}>
          <TabsContent value="objects" className="mt-0 p-6">
            <ProtectionObjectsTab taskId={taskId} />
          </TabsContent>
          <TabsContent value="info" className="mt-0 p-6">
            <TaskInfoTab taskDetail={taskDetail} />
          </TabsContent>
          <TabsContent value="logs" className="mt-0 p-6">
            <ProtectionLogsTab taskId={taskId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Mock data for protection objects by task
const getProtectionObjectsByTask = (taskId: string) => {
  if (taskId === "gf-protection") {
    return [
      {
        id: "gf-1",
        name: "GF项目数据分析智能体",
        type: "agent",
        category: "应用开发 > 智能体",
        interceptionCount: 3245,
        recordCount: 198,
      },
      {
        id: "gf-2",
        name: "GF数据查询服务",
        type: "service",
        category: "模型开发 > 在线服务",
        interceptionCount: 1876,
        recordCount: 87,
      },
      {
        id: "gf-3",
        name: "GF报告生成工作流",
        type: "workflow",
        category: "应用开发 > 工作流",
        interceptionCount: 1234,
        recordCount: 156,
      },
      {
        id: "gf-4",
        name: "GF信息检索智能体",
        type: "agent",
        category: "应用开发 > 智能体",
        interceptionCount: 2156,
        recordCount: 134,
      },
      {
        id: "gf-5",
        name: "GF数据处理服务",
        type: "service",
        category: "模型开发 > 在线服务",
        interceptionCount: 1456,
        recordCount: 92,
      },
      {
        id: "gf-6",
        name: "GF内容审核工作流",
        type: "workflow",
        category: "应用开发 > 工作流",
        interceptionCount: 987,
        recordCount: 203,
      },
      {
        id: "gf-7",
        name: "GF智能助手",
        type: "agent",
        category: "应用开发 > 智能体",
        interceptionCount: 1892,
        recordCount: 145,
      },
      {
        id: "gf-8",
        name: "GF模型推理服务",
        type: "service",
        category: "模型开发 > 在线服务",
        interceptionCount: 1123,
        recordCount: 78,
      },
    ];
  }
  // Default objects for other tasks
  return [
    {
      id: "1",
      name: "科研数据分析智能体",
      type: "agent",
      category: "应用开发 > 智能体",
      interceptionCount: 2973,
      recordCount: 183,
    },
    {
      id: "2",
      name: "医疗影像诊断服务",
      type: "service",
      category: "模型开发 > 在线服务",
      interceptionCount: 1476,
      recordCount: 62,
    },
    {
      id: "3",
      name: "病历信息提取服务",
      type: "service",
      category: "模型开发 > 在线服务",
      interceptionCount: 1245,
      recordCount: 89,
    },
    {
      id: "4",
      name: "科研论文生成工作流",
      type: "workflow",
      category: "应用开发 > 工作流",
      interceptionCount: 982,
      recordCount: 287,
    },
    {
      id: "5",
      name: "文献检索智能体",
      type: "agent",
      category: "应用开发 > 智能体",
      interceptionCount: 2156,
      recordCount: 145,
    },
    {
      id: "6",
      name: "实验数据分析工作流",
      type: "workflow",
      category: "应用开发 > 工作流",
      interceptionCount: 756,
      recordCount: 198,
    },
    {
      id: "7",
      name: "科研助手智能体",
      type: "agent",
      category: "应用开发 > 智能体",
      interceptionCount: 1892,
      recordCount: 112,
    },
    {
      id: "8",
      name: "数据预处理服务",
      type: "service",
      category: "模型开发 > 在线服务",
      interceptionCount: 1034,
      recordCount: 76,
    },
    {
      id: "9",
      name: "结果可视化工作流",
      type: "workflow",
      category: "应用开发 > 工作流",
      interceptionCount: 623,
      recordCount: 234,
    },
    {
      id: "10",
      name: "学术写作助手",
      type: "agent",
      category: "应用开发 > 智能体",
      interceptionCount: 1645,
      recordCount: 98,
    },
    {
      id: "11",
      name: "模型推理服务",
      type: "service",
      category: "模型开发 > 在线服务",
      interceptionCount: 892,
      recordCount: 54,
    },
    {
      id: "12",
      name: "报告生成工作流",
      type: "workflow",
      category: "应用开发 > 工作流",
      interceptionCount: 534,
      recordCount: 167,
    },
    {
      id: "13",
      name: "知识问答智能体",
      type: "agent",
      category: "应用开发 > 智能体",
      interceptionCount: 2234,
      recordCount: 156,
    },
    {
      id: "14",
      name: "文本分析服务",
      type: "service",
      category: "模型开发 > 在线服务",
      interceptionCount: 1123,
      recordCount: 67,
    },
    {
      id: "15",
      name: "数据处理工作流",
      type: "workflow",
      category: "应用开发 > 工作流",
      interceptionCount: 445,
      recordCount: 189,
    },
    {
      id: "16",
      name: "智能推荐智能体",
      type: "agent",
      category: "应用开发 > 智能体",
      interceptionCount: 1789,
      recordCount: 134,
    },
  ];
};

// Protection Objects Tab Component
function ProtectionObjectsTab({ taskId }: { taskId: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [protectedObjects] = useState(() => getProtectionObjectsByTask(taskId));

  const filteredObjects = protectedObjects.filter((obj) =>
    obj.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalInterceptions = filteredObjects.reduce((sum, obj) => sum + obj.interceptionCount, 0);
  const totalRecords = filteredObjects.reduce((sum, obj) => sum + obj.recordCount, 0);

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <span className="text-green-800 font-medium">
          {filteredObjects.length}个防护对象安全防护中
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Input
          type="text"
          placeholder="请搜索防护对象的名称"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredObjects.map((obj) => (
          <div
            key={obj.id}
            className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow relative"
          >
            {/* Icon */}
            <div className="absolute top-4 right-4">
              {obj.type === "agent" ? (
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                  </svg>
                </div>
              ) : obj.type === "service" ? (
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                  </svg>
                </div>
              ) : (
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold mb-2 pr-16">{obj.name}</h3>

            {/* Status */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm text-green-600">安全防护中</span>
            </div>

            {/* Category */}
            <p className="text-sm text-muted-foreground mb-4">{obj.category}</p>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground mb-1">拦截次数</p>
                <p className="text-2xl font-bold text-slate-900">{obj.interceptionCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">记录次数</p>
                <p className="text-2xl font-bold text-slate-900">{obj.recordCount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Task Info Tab Component
function TaskInfoTab({ taskDetail }: { taskDetail: any }) {
  const isGFProtection = taskDetail.id === "gf-protection";
  const [description, setDescription] = useState(taskDetail.description);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">基础信息</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">任务名称</label>
            <p className="mt-1 text-slate-900">{taskDetail.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">任务ID</label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-slate-900">{taskDetail.taskId}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(taskDetail.taskId);
                  toast.success("已复制到剪贴板");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">任务描述</label>
            <div className="mt-1 flex items-start gap-2">
              {isEditingDescription ? (
                <div className="flex-1">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsEditingDescription(false);
                        toast.success("描述已更新");
                      }}
                    >
                      保存
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDescription(taskDetail.description);
                        setIsEditingDescription(false);
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="flex-1 text-slate-900">{description}</p>
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Protection Configuration */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">防护配置</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">策略名称</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">生效阶段</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">检测规则</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">执行动作</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">内容合规防护</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm">输入</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {["涉暴内容", "涉黄内容", "涉政内容", "非法内容", "人身伤害", "不道德内容", "侵权内容"].map(
                      (rule, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-50 text-red-700 border border-red-200"
                        >
                          {rule}
                          <span className="ml-1 text-red-500">严格</span>
                        </span>
                      )
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                    拦截
                  </span>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">内容合规防护</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm">输出</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {["涉暴内容", "涉黄内容", "涉政内容", "非法内容", "人身伤害", "侵权内容"].map(
                      (rule, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-50 text-red-700 border border-red-200"
                        >
                          {rule}
                          <span className="ml-1 text-red-500">严格</span>
                        </span>
                      )
                    )}
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-50 text-yellow-700 border border-yellow-200">
                      不道德内容
                      <span className="ml-1 text-yellow-500">宽松</span>
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                    拦截
                  </span>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">提示词攻击防护</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm">输入</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-50 text-red-700 border border-red-200">
                    提示词攻击防护
                    <span className="ml-1 text-red-500">严格</span>
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                    拦截
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">敏感信息防护</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm">输入+输出</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-50 text-yellow-700 border border-yellow-200">
                    敏感信息防护
                    <span className="ml-1 text-yellow-500">宽松</span>
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                    拦截
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Lexicon Protection */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">词库防护</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">词库类型</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">生效阶段</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">词库名称</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">执行动作</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.04-.96.07 1.16.84 1.96 1.96 1.96 3.43V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">黑名单词库</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm">输入</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {isGFProtection ? (
                      <>
                        {["GFJG", "政治敏感词黑名单", "社交媒体违规词黑名单", "通用违规词库"].map((name, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-50 text-red-700 border border-red-200"
                          >
                            {name}
                          </span>
                        ))}
                      </>
                    ) : (
                      <>
                        {[
                          "金融敏感词黑名单",
                          "政治敏感词黑名单",
                          "社交媒体违规词黑名单",
                          "通用违规词库",
                          "行业禁用词库",
                          "内容审核词库",
                          "安全过滤词库",
                        ].map((name, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-50 text-red-700 border border-red-200"
                          >
                            {name}
                          </span>
                        ))}
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-100 text-slate-600">
                          +3
                        </span>
                      </>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                    拦截
                  </span>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.04-.96.07 1.16.84 1.96 1.96 1.96 3.43V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">黑名单词库</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm">输出</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {isGFProtection ? (
                      <>
                        {["GFJG", "政治敏感词黑名单", "社交媒体违规词黑名单", "通用违规词库"].map((name, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-50 text-red-700 border border-red-200"
                          >
                            {name}
                          </span>
                        ))}
                      </>
                    ) : (
                      <>
                        {[
                          "金融敏感词黑名单",
                          "政治敏感词黑名单",
                          "社交媒体违规词黑名单",
                          "通用违规词库",
                          "行业禁用词库",
                          "内容审核词库",
                          "安全过滤词库",
                        ].map((name, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-50 text-red-700 border border-red-200"
                          >
                            {name}
                          </span>
                        ))}
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-100 text-slate-600">
                          +3
                        </span>
                      </>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                    拦截
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.04-.96.07 1.16.84 1.96 1.96 1.96 3.43V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">白名单词库</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm">输入+输出</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {taskDetail.id === "gf-protection" ? (
                      <>
                        {["GFJG"].map((name, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-50 text-green-700 border border-green-200"
                          >
                            {name}
                          </span>
                        ))}
                      </>
                    ) : (
                      <>
                        {[
                          "科研白名单",
                          "医疗白名单",
                          "教育领域白名单",
                          "法律术语白名单",
                          "技术术语白名单",
                          "学术用语白名单",
                          "专业术语白名单",
                        ].map((name, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-50 text-green-700 border border-green-200"
                          >
                            {name}
                          </span>
                        ))}
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-100 text-slate-600">
                          +2
                        </span>
                      </>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                    放行
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Response Configuration */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">响应配置</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">策略名称</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">响应内容</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">自定义拦截响应</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-900">
                  对不起,请换个问题聊聊吧
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Mock data for protection logs by task
const getProtectionLogsByTask = (taskId: string) => {
  if (taskId === "gf-protection") {
    return [
      {
        id: "gf-log-1",
        detectionContent: "GF项目数据查询请求",
        requestId: "gf-req-12345678",
        hitStage: "输入",
        hitStrategyType: "内容合规防护",
        hitSubcategory: "涉政内容",
        executionAction: "拦截",
        requestTime: "2026-01-29 16:41:24",
      },
      {
        id: "gf-log-2",
        detectionContent: "GF敏感信息访问",
        requestId: "gf-req-12345678",
        hitStage: "输出",
        hitStrategyType: "敏感信息防护",
        hitSubcategory: "敏感信息防护",
        executionAction: "记录",
        requestTime: "2026-01-29 14:32:15",
      },
      {
        id: "gf-log-3",
        detectionContent: "GF数据导出请求",
        requestId: "gf-req-12345678",
        hitStage: "输入",
        hitStrategyType: "黑名单词库",
        hitSubcategory: "GFJG",
        executionAction: "拦截",
        requestTime: "2026-01-29 11:25:42",
      },
      {
        id: "gf-log-4",
        detectionContent: "GF报告生成内容",
        requestId: "gf-req-12345678",
        hitStage: "输出",
        hitStrategyType: "内容合规防护",
        hitSubcategory: "涉政内容",
        executionAction: "拦截",
        requestTime: "2026-01-28 09:18:33",
      },
      {
        id: "gf-log-5",
        detectionContent: "GF项目信息查询",
        requestId: "gf-req-87654321",
        hitStage: "输入",
        hitStrategyType: "提示词攻击防护",
        hitSubcategory: "提示词攻击防护",
        executionAction: "拦截",
        requestTime: "2026-01-28 15:42:18",
      },
      {
        id: "gf-log-6",
        detectionContent: "GF数据分析结果",
        requestId: "gf-req-87654321",
        hitStage: "输出",
        hitStrategyType: "敏感信息防护",
        hitSubcategory: "敏感信息防护",
        executionAction: "记录",
        requestTime: "2026-01-27 13:28:55",
      },
      {
        id: "gf-log-7",
        detectionContent: "GF正常业务请求",
        requestId: "gf-req-11223344",
        hitStage: "输入",
        hitStrategyType: "白名单词库",
        hitSubcategory: "GFJG",
        executionAction: "放行",
        requestTime: "2026-01-27 10:15:30",
      },
      {
        id: "gf-log-8",
        detectionContent: "GF内容审核通过",
        requestId: "gf-req-11223344",
        hitStage: "输出",
        hitStrategyType: "内容合规防护",
        hitSubcategory: "涉政内容",
        executionAction: "拦截",
        requestTime: "2026-01-26 16:33:47",
      },
    ];
  }
  // Default logs for other tasks
  return [
    {
      id: "1",
      detectionContent: "这是一个请求内容",
      requestId: "ciku-12345678",
      hitStage: "输入",
      hitStrategyType: "内容合规防护",
      hitSubcategory: "涉暴内容",
      executionAction: "拦截",
      requestTime: "2025-10-30 16:41:24",
    },
    {
      id: "2",
      detectionContent: "这是一个请求内容词",
      requestId: "ciku-12345678",
      hitStage: "输出",
      hitStrategyType: "敏感信息防护",
      hitSubcategory: "敏感信息防护",
      executionAction: "记录",
      requestTime: "2025-10-29 14:32:15",
    },
    {
      id: "3",
      detectionContent: "这是一个请求",
      requestId: "ciku-12345678",
      hitStage: "输入",
      hitStrategyType: "黑名单词库",
      hitSubcategory: "金融敏感词黑名单",
      executionAction: "拦截",
      requestTime: "2025-10-28 11:25:42",
    },
    {
      id: "4",
      detectionContent: "这是一个请求内",
      requestId: "ciku-12345678",
      hitStage: "输出",
      hitStrategyType: "内容合规防护",
      hitSubcategory: "涉黄内容",
      executionAction: "拦截",
      requestTime: "2025-10-27 09:18:33",
    },
    {
      id: "5",
      detectionContent: "用户查询敏感信息",
      requestId: "ciku-87654321",
      hitStage: "输入",
      hitStrategyType: "提示词攻击防护",
      hitSubcategory: "提示词攻击防护",
      executionAction: "拦截",
      requestTime: "2025-10-26 15:42:18",
    },
    {
      id: "6",
      detectionContent: "包含违规词汇的请求",
      requestId: "ciku-87654321",
      hitStage: "输入",
      hitStrategyType: "黑名单词库",
      hitSubcategory: "政治敏感词黑名单",
      executionAction: "拦截",
      requestTime: "2025-10-25 13:28:55",
    },
    {
      id: "7",
      detectionContent: "科研数据查询请求",
      requestId: "ciku-11223344",
      hitStage: "输出",
      hitStrategyType: "敏感信息防护",
      hitSubcategory: "敏感信息防护",
      executionAction: "记录",
      requestTime: "2025-10-24 10:15:30",
    },
    {
      id: "8",
      detectionContent: "正常业务请求",
      requestId: "ciku-11223344",
      hitStage: "输入",
      hitStrategyType: "白名单词库",
      hitSubcategory: "科研白名单",
      executionAction: "放行",
      requestTime: "2025-10-23 08:52:12",
    },
    {
      id: "9",
      detectionContent: "检测到可疑内容",
      requestId: "ciku-55667788",
      hitStage: "输出",
      hitStrategyType: "内容合规防护",
      hitSubcategory: "涉政内容",
      executionAction: "拦截",
      requestTime: "2025-10-22 16:33:47",
    },
    {
      id: "10",
      detectionContent: "用户输入测试",
      requestId: "ciku-55667788",
      hitStage: "输入",
      hitStrategyType: "黑名单词库",
      hitSubcategory: "社交媒体违规词黑名单",
      executionAction: "拦截",
      requestTime: "2025-10-21 12:20:09",
    },
    {
      id: "11",
      detectionContent: "医疗信息查询",
      requestId: "ciku-99887766",
      hitStage: "输出",
      hitStrategyType: "敏感信息防护",
      hitSubcategory: "敏感信息防护",
      executionAction: "记录",
      requestTime: "2025-10-20 09:28:01",
    },
  ];
};

// Protection Logs Tab Component
function ProtectionLogsTab({ taskId }: { taskId: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [requestContentFilter, setRequestContentFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [startDate, setStartDate] = useState("2025-09-30");
  const [endDate, setEndDate] = useState("2025-10-30");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [logs] = useState(() => getProtectionLogsByTask(taskId));

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.detectionContent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.requestTime.localeCompare(b.requestTime);
    } else {
      return b.requestTime.localeCompare(a.requestTime);
    }
  });

  const handleExport = () => {
    toast.success("导出成功");
  };

  const handleCopyRequestId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("已复制到剪贴板");
  };

  const handleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={requestContentFilter}
            onChange={(e) => setRequestContentFilter(e.target.value)}
            className="h-9 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">请求内容</option>
            <option value="input">输入</option>
            <option value="output">输出</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="请输入内容搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="h-9 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">应用开发&gt;智能体&gt;科研数据分析智能体</option>
            <option value="agent1">应用开发&gt;智能体&gt;科研数据分析智能体</option>
            <option value="agent2">应用开发&gt;智能体&gt;文献检索智能体</option>
          </select>

          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 text-sm"
          />
          <span className="text-muted-foreground">至</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 text-sm"
          />

          <Button variant="ghost" size="icon" className="h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">检测内容</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">请求ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">命中阶段</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">
                  命中策略/词库类型
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">
                  命中子类/词库名称
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">执行动作</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">
                  <button onClick={handleSort} className="flex items-center gap-1">
                    请求时间
                    {sortOrder === "asc" ? (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              ) : (
                sortedLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm">{log.detectionContent}</td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{log.requestId}</span>
                        <button
                          onClick={() => handleCopyRequestId(log.requestId)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{log.hitStage}</td>
                    <td className="py-3 px-4 text-sm">{log.hitStrategyType}</td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span>{log.hitSubcategory}</span>
                        {log.hitSubcategory.includes("+N") && (
                          <span className="text-muted-foreground">+N</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                          log.executionAction === "拦截"
                            ? "bg-red-100 text-red-700"
                            : log.executionAction === "记录"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {log.executionAction}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{log.requestTime}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
