"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  ChevronDown,
  ChevronUp,
  BookOpen,
  BookA,
  Puzzle,
  Network,
  Workflow,
  Rocket,
  Plus,
  SlidersHorizontal,
  X,
  FileText,
  Sparkles,
} from "lucide-react";
import { KnowledgeBaseSelector, type KnowledgeBase } from "@/components/agent-editor/KnowledgeBaseSelector";
import { RetrievalSettings, type RetrievalConfig } from "@/components/agent-editor/RetrievalSettings";
import { ModelSelector, type ModelParams } from "@/components/agent-editor/ModelSelector";
import { WorkflowSelector, type Workflow as WorkflowType } from "@/components/agent-editor/WorkflowSelector";
import { PluginSelector, type Plugin } from "@/components/agent-editor/PluginSelector";
import { MCPSelector, type MCP } from "@/components/agent-editor/MCPSelector";
import { OntologyConfigDialog, type OntologyConfig } from "@/components/agent-editor/OntologyConfigDialog";
import { TerminologySelector, type Terminology } from "@/components/agent-editor/TerminologySelector";
import { Button } from "@/components/ui/button";
import { LogsTable, type LogEntry } from "@/components/agent/logs-table";

// Mock 预览与调试日志数据（模拟用户在创建过程中进行的对话测试）
const MOCK_PREVIEW_LOGS: LogEntry[] = [
  {
    id: "preview_001",
    input: "请介绍一下你的功能",
    output: "您好！我是自主规划智能体，可以帮助您进行任务规划、决策分析和问题解决。我可以理解复杂需求，制定执行计划，并逐步完成目标。",
    timestamp: "2025-01-15 15:30:22",
    source: "预览与调试",
    userFeedback: null,
    adminFeedback: null,
    status: "pending",
  },
  {
    id: "preview_002",
    input: "如何优化检索效果？",
    output: "优化检索效果可以从以下几个方面入手：1. 调整检索策略，使用混合检索结合关键词和语义检索；2. 优化Top-K参数，平衡召回率和精确率；3. 使用重排序模型对初步结果进行精细化打分；4. 优化向量模型和索引结构。",
    timestamp: "2025-01-15 15:28:15",
    source: "预览与调试",
    userFeedback: "like",
    adminFeedback: "good",
    status: "pending",
  },
  {
    id: "preview_003",
    input: "RAG技术的优势是什么？",
    output: "RAG技术的主要优势包括：1. 减少幻觉，通过检索外部知识库确保回答基于经过验证的信息；2. 知识更新灵活，无需重新训练模型即可更新知识库；3. 可追溯性，可以查看回答的来源文档；4. 成本效益，相比微调大模型更加经济。",
    timestamp: "2025-01-15 15:25:08",
    source: "预览与调试",
    userFeedback: null,
    adminFeedback: null,
    status: "pending",
  },
  {
    id: "preview_004",
    input: "测试一下长文本输入，看看智能体如何处理较长的用户问题，包括多个子问题和复杂场景的描述",
    output: "我理解您的问题。对于长文本输入，我会先进行问题分解，识别关键信息和子问题，然后逐一处理。对于复杂场景，我会分析各个要素之间的关系，制定分步骤的执行计划。",
    timestamp: "2025-01-15 15:20:45",
    source: "预览与调试",
    userFeedback: "dislike",
    adminFeedback: null,
    status: "pending",
  },
  {
    id: "preview_005",
    input: "什么是Agent的ReAct模式？",
    output: "ReAct模式结合了推理（Reasoning）和行动（Acting），通过交替执行思考和行动来解决问题。Agent首先思考下一步应该做什么，然后执行相应的行动，观察结果，再继续思考，形成推理-行动-观察的循环。",
    timestamp: "2025-01-15 15:18:32",
    source: "预览与调试",
    userFeedback: "like",
    adminFeedback: "good",
    status: "adopted",
  },
];

export default function AgentEditorPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"config" | "logs">("config");
  const [prompt, setPrompt] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    knowledge: true,
    ontology: false,
    terminology: false,
    workflow: false,
    plugins: false,
    mcp: false,
  });
  const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<
    KnowledgeBase[]
  >([]);
  const [kbSelectorOpen, setKbSelectorOpen] = useState(false);
  const [retrievalSettingsOpen, setRetrievalSettingsOpen] = useState(false);
  const [retrievalConfig, setRetrievalConfig] = useState<RetrievalConfig>({
    strategy: "hybrid",
    semanticWeight: 0.6,
    rerankEnabled: true,
    topK: 6,
    scoreThresholdEnabled: true,
    scoreThreshold: 0.1,
    autoTagFilterEnabled: false,
  });
  const [selectedModel, setSelectedModel] = useState("DeepSeek-R2");
  const [modelParams, setModelParams] = useState<ModelParams>({
    temperature: 0.01,
    topP: 0.01,
    topK: 20,
    history: 5,
  });
  const [selectedWorkflows, setSelectedWorkflows] = useState<WorkflowType[]>([]);
  const [selectedPlugins, setSelectedPlugins] = useState<Plugin[]>([]);
  const [selectedMCPs, setSelectedMCPs] = useState<MCP[]>([]);
  const [workflowSelectorOpen, setWorkflowSelectorOpen] = useState(false);
  const [pluginSelectorOpen, setPluginSelectorOpen] = useState(false);
  const [mcpSelectorOpen, setMcpSelectorOpen] = useState(false);
  const [selectedOntologies, setSelectedOntologies] = useState<OntologyConfig[]>([]);
  const [ontologyConfigOpen, setOntologyConfigOpen] = useState(false);
  const [selectedTerminologies, setSelectedTerminologies] = useState<Terminology[]>([]);
  const [terminologySelectorOpen, setTerminologySelectorOpen] = useState(false);
  const [openingStatement, setOpeningStatement] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([""]);
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp: string }>
  >([]);
  const [showSuggestedChips, setShowSuggestedChips] = useState(true);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleAddKnowledgeBase = (kb: KnowledgeBase) => {
    if (!selectedKnowledgeBases.find((k) => k.id === kb.id)) {
      setSelectedKnowledgeBases([...selectedKnowledgeBases, kb]);
    }
  };

  const handleRemoveKnowledgeBase = (id: string) => {
    setSelectedKnowledgeBases(
      selectedKnowledgeBases.filter((kb) => kb.id !== id)
    );
  };

  const handleAddWorkflow = (workflow: WorkflowType) => {
    if (!selectedWorkflows.find((w) => w.id === workflow.id)) {
      setSelectedWorkflows([...selectedWorkflows, workflow]);
    }
  };

  const handleRemoveWorkflow = (id: string) => {
    setSelectedWorkflows(selectedWorkflows.filter((w) => w.id !== id));
  };

  const handleAddPlugins = (plugins: Plugin[]) => {
    setSelectedPlugins(plugins);
  };

  const handleRemovePlugin = (id: string) => {
    setSelectedPlugins(selectedPlugins.filter((p) => p.id !== id));
  };

  const handleAddMCPs = (mcps: MCP[]) => {
    setSelectedMCPs(mcps);
  };

  const handleRemoveMCP = (id: string) => {
    setSelectedMCPs(selectedMCPs.filter((m) => m.id !== id));
  };

  const handleAddOntology = (config: OntologyConfig) => {
    setSelectedOntologies([...selectedOntologies, config]);
  };

  const handleRemoveOntology = (index: number) => {
    setSelectedOntologies(selectedOntologies.filter((_, i) => i !== index));
  };

  const handleAddTerminology = (terminology: Terminology) => {
    if (!selectedTerminologies.find((t) => t.id === terminology.id)) {
      setSelectedTerminologies([...selectedTerminologies, terminology]);
    }
  };

  const handleRemoveTerminology = (id: string) => {
    setSelectedTerminologies(selectedTerminologies.filter((t) => t.id !== id));
  };

  // Conversation Settings Handlers
  const handleAddSuggestedQuestion = () => {
    setSuggestedQuestions([...suggestedQuestions, ""]);
  };

  const handleUpdateSuggestedQuestion = (index: number, value: string) => {
    const updated = [...suggestedQuestions];
    updated[index] = value;
    setSuggestedQuestions(updated);
  };

  const handleRemoveSuggestedQuestion = (index: number) => {
    if (suggestedQuestions.length > 1) {
      setSuggestedQuestions(
        suggestedQuestions.filter((_, i) => i !== index)
      );
    } else {
      setSuggestedQuestions([""]);
    }
  };

  // Chat Preview Handlers
  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;

    const userMessage = {
      role: "user" as const,
      content: message,
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setShowSuggestedChips(false);

    // Mock AI response
    setTimeout(() => {
      const aiMessage = {
        role: "assistant" as const,
        content: "您好，有什么可以帮您？",
        timestamp: new Date().toLocaleTimeString(),
      };
      setChatHistory((prev) => [...prev, aiMessage]);
    }, 500);
  };

  const handleSuggestedQuestionClick = (question: string) => {
    if (!question.trim()) return;
    handleSendMessage(question);
  };

  // Sync opening statement to chat history
  useEffect(() => {
    if (openingStatement.trim()) {
      // Reset chat history and show opening statement
      setChatHistory([
        {
          role: "assistant",
          content: openingStatement,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setShowSuggestedChips(true);
    } else {
      setChatHistory([]);
      setShowSuggestedChips(true);
    }
  }, [openingStatement]);

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
          <span className="font-semibold text-base">创建自主规划智能体</span>
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
            配置
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "logs"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            调优
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
          <>
        {/* Left Column: Role Instructions (25%) */}
            <div className="flex h-full w-[25%] flex-col border-r border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-slate-600 font-semibold text-lg">AI</span>
            </div>
            <div>
                  <h2 className="font-semibold text-slate-900">创建自主规划智能体</h2>
              <p className="text-sm text-slate-500">角色指令</p>
            </div>
          </div>
          <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            placeholder="请输入智能体的角色指令和系统提示词..."
            className="flex-1 w-full p-4 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* Middle Column: Knowledge Config (40%) */}
            <div className="h-full w-[40%] overflow-y-auto border-r border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              知识
            </h2>
            <ModelSelector
              selectedModel={selectedModel}
              modelParams={modelParams}
              onModelChange={setSelectedModel}
              onParamsChange={setModelParams}
            />
          </div>

          {/* Knowledge Base Section */}
          <div className="mb-4 bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <button
                onClick={() => toggleSection("knowledge")}
                className="flex-1 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-900">知识库</span>
                </div>
                {expandedSections.knowledge ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRetrievalSettingsOpen(true);
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                  title="检索配置"
                >
                  <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setKbSelectorOpen(true);
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                  title="添加知识库"
                >
                  <Plus className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
            {expandedSections.knowledge && (
              <div className="px-4 pb-4 space-y-3">
                {selectedKnowledgeBases.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    暂无知识库，点击上方 + 按钮添加
                  </div>
                ) : (
                  selectedKnowledgeBases.map((kb) => (
                    <div
                      key={kb.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 truncate">
                            {kb.name}
                          </span>
                          {kb.source && (
                            <span className="text-xs text-slate-500 truncate">
                              ({kb.source.split("/").pop()})
                            </span>
                          )}
                        </div>
                        {kb.itemCount > 0 && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            已关联 {kb.itemCount} 个文档
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveKnowledgeBase(kb.id)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors shrink-0"
                        title="移除"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Ontology Section */}
          <div className="mb-4 bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <button
                onClick={() => toggleSection("ontology")}
                className="flex-1 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Network className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-900">本体</span>
                </div>
                {expandedSections.ontology ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOntologyConfigOpen(true);
                }}
                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors ml-2"
                title="添加本体"
              >
                <Plus className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            {expandedSections.ontology && (
              <div className="px-4 pb-4 space-y-3">
                {selectedOntologies.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    暂无本体，点击上方 + 按钮添加
                  </div>
                ) : (
                  selectedOntologies.map((ontology, index) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Network className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900">
                          {ontology.ontology} - {ontology.objectType}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {ontology.retrievalMethod === "semantic"
                            ? `语义检索 (${ontology.retrievalVector})`
                            : "全量检索"}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveOntology(index)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors shrink-0"
                        title="移除"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Terminology Section */}
          <div className="mb-4 bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <button
                onClick={() => toggleSection("terminology")}
                className="flex-1 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <BookA className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-900">术语库</span>
                </div>
                {expandedSections.terminology ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTerminologySelectorOpen(true);
                }}
                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors ml-2"
                title="添加术语库"
              >
                <Plus className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            {expandedSections.terminology && (
              <div className="px-4 pb-4 space-y-3">
                {selectedTerminologies.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    暂无术语库，点击上方 + 按钮添加
                  </div>
                ) : (
                  selectedTerminologies.map((term) => (
                    <div
                      key={term.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-slate-900">
                          {term.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveTerminology(term.id)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors shrink-0"
                        title="移除"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Tools Section */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 mb-4">工具</h3>

            {/* Workflow Sub-section */}
            <div className="mb-3 bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <button
                  onClick={() => toggleSection("workflow")}
                  className="flex-1 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Workflow className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-900">工作流</span>
                  </div>
                  {expandedSections.workflow ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setWorkflowSelectorOpen(true);
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors ml-2"
                  title="添加工作流"
                >
                  <Plus className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              {expandedSections.workflow && (
                <div className="px-4 pb-4">
                  {selectedWorkflows.length === 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500">
                        智能体可以调用编排并发布的工作流以实现复杂、稳定的业务流程。
                      </p>
                      <button
                        onClick={() => setWorkflowSelectorOpen(true)}
                        className="w-full py-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        添加
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedWorkflows.map((workflow) => (
                        <div
                          key={workflow.id}
                          className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                            <Workflow className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900">
                              {workflow.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {workflow.description}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveWorkflow(workflow.id)}
                            className="p-1 hover:bg-slate-200 rounded transition-colors shrink-0"
                            title="移除"
                          >
                            <X className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Plugins Sub-section */}
            <div className="mb-3 bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <button
                  onClick={() => toggleSection("plugins")}
                  className="flex-1 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Puzzle className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-900">插件</span>
                  </div>
                  {expandedSections.plugins ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPluginSelectorOpen(true);
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors ml-2"
                  title="添加插件"
                >
                  <Plus className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              {expandedSections.plugins && (
                <div className="px-4 pb-4">
                  {selectedPlugins.length === 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500">
                        智能体可以通过插件主动调用OpenAPI，例如信息查询、数据存储等。
                      </p>
                      <button
                        onClick={() => setPluginSelectorOpen(true)}
                        className="w-full py-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        添加
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedPlugins.map((plugin) => (
                        <div
                          key={plugin.id}
                          className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${plugin.color}`}
                          >
                            {plugin.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900">
                              {plugin.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {plugin.description}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemovePlugin(plugin.id)}
                            className="p-1 hover:bg-slate-200 rounded transition-colors shrink-0"
                            title="移除"
                          >
                            <X className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MCP Sub-section */}
            <div className="mb-3 bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <button
                  onClick={() => toggleSection("mcp")}
                  className="flex-1 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Puzzle className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-900">MCP</span>
                  </div>
                  {expandedSections.mcp ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMcpSelectorOpen(true);
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors ml-2"
                  title="添加MCP"
                >
                  <Plus className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              {expandedSections.mcp && (
                <div className="px-4 pb-4">
                  {selectedMCPs.length === 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500">
                        智能体可以通过MCP标准化协议连接和调用多个工具。
                      </p>
                      <button
                        onClick={() => setMcpSelectorOpen(true)}
                        className="w-full py-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        添加
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedMCPs.map((mcp) => (
                        <div
                          key={mcp.id}
                          className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 text-orange-600">
                            {mcp.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900">
                              {mcp.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {mcp.description}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveMCP(mcp.id)}
                            className="p-1 hover:bg-slate-200 rounded transition-colors shrink-0"
                            title="移除"
                          >
                            <X className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Conversation Settings Section */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              对话
            </h3>

            {/* Opening Statement */}
            <div className="mb-4 bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">
                  开场白
                </span>
                <button
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                  title="AI优化"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </button>
              </div>
              <div className="p-4 relative">
                <textarea
                  value={openingStatement}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 150) {
                      setOpeningStatement(value);
                    }
                  }}
                  placeholder="请输入开场白"
                  className="w-full min-h-[100px] p-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm text-slate-700 placeholder:text-slate-400"
                />
                <div className="absolute bottom-6 right-6 text-xs text-slate-400">
                  {openingStatement.length}/150
                </div>
              </div>
            </div>

            {/* Suggested Questions */}
            <div className="mb-4 bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200">
                <span className="text-sm font-medium text-slate-900">
                  推荐问
                </span>
              </div>
              <div className="p-4 space-y-3">
                {suggestedQuestions.map((question, index) => (
                  <div key={index} className="relative">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 50) {
                          handleUpdateSuggestedQuestion(index, value);
                        }
                      }}
                      placeholder="请输入内容"
                      className="w-full px-3 py-2 pr-20 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm text-slate-700 placeholder:text-slate-400"
                    />
                    <div className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      {question.length}/50
                    </div>
                    {suggestedQuestions.length > 1 && (
                      <button
                        onClick={() => handleRemoveSuggestedQuestion(index)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded transition-colors"
                        title="删除"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddSuggestedQuestion}
                  className="w-full py-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  添加推荐问
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Debug (35%) */}
            <div className="flex h-full w-[35%] flex-col bg-white">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">预览与调试</h2>
            <p className="text-xs text-slate-500 mt-1">
              实时测试智能体的响应效果
            </p>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 && openingStatement.trim() === "" ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                暂无对话，请在左侧配置开场白
              </div>
            ) : (
              <>
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : ""
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-slate-600">
                          AI
                        </span>
                      </div>
                    )}
                    <div className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}>
                      <div>
                        <div
                          className={`rounded-lg p-3 max-w-[80%] ${
                            message.role === "user"
                              ? "bg-slate-900 text-white ml-auto"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p
                          className={`text-xs text-slate-400 mt-1 ${
                            message.role === "user" ? "mr-1 text-right" : "ml-1"
                          }`}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-white">
                          我
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-slate-200 space-y-2">
            {/* Suggested Questions Chips (Alternative position - above input) */}
            {showSuggestedChips &&
              suggestedQuestions.filter((q) => q.trim()).length > 0 &&
              chatHistory.length <= 1 && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {suggestedQuestions
                    .filter((q) => q.trim())
                    .map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestionClick(question)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-full transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                </div>
              )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="输入消息..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm text-slate-700 placeholder:text-slate-400"
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget
                    .previousElementSibling as HTMLInputElement;
                  handleSendMessage(input.value);
                  input.value = "";
                }}
                className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center">
              内容由AI生成，仅供参考
            </p>
          </div>
        </div>
          </>
        ) : (
          <LogsTable data={MOCK_PREVIEW_LOGS} />
        )}
      </main>

      {/* Knowledge Base Selector Dialog */}
      <KnowledgeBaseSelector
        open={kbSelectorOpen}
        onOpenChange={setKbSelectorOpen}
        onSelect={handleAddKnowledgeBase}
      />

      {/* Retrieval Settings Dialog */}
      <RetrievalSettings
        open={retrievalSettingsOpen}
        onOpenChange={setRetrievalSettingsOpen}
        initialSettings={retrievalConfig}
        onSave={(settings) => {
          setRetrievalConfig(settings);
        }}
      />

      {/* Workflow Selector Dialog */}
      <WorkflowSelector
        open={workflowSelectorOpen}
        onOpenChange={setWorkflowSelectorOpen}
        onSelect={handleAddWorkflow}
      />

      {/* Plugin Selector Dialog */}
      <PluginSelector
        open={pluginSelectorOpen}
        onOpenChange={setPluginSelectorOpen}
        onSelect={handleAddPlugins}
        selectedPlugins={selectedPlugins}
      />

      {/* MCP Selector Dialog */}
      <MCPSelector
        open={mcpSelectorOpen}
        onOpenChange={setMcpSelectorOpen}
        onSelect={handleAddMCPs}
        selectedMCPs={selectedMCPs}
      />

      {/* Ontology Config Dialog */}
      <OntologyConfigDialog
        open={ontologyConfigOpen}
        onOpenChange={setOntologyConfigOpen}
        onSave={handleAddOntology}
      />

      {/* Terminology Selector Dialog */}
      <TerminologySelector
        open={terminologySelectorOpen}
        onOpenChange={setTerminologySelectorOpen}
        onSelect={handleAddTerminology}
      />
    </div>
  );
}
