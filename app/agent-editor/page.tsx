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
  Edit2,
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
import { Badge } from "@/components/ui/badge";
import { checkSensitiveContent } from "@/lib/content-filter";
import { ProtectionStatusBadge } from "@/components/security/ProtectionStatusBadge";
import { LogsTable, type LogEntry } from "@/components/agent/logs-table";
import { useModelCompatibility } from "@/lib/useModelCompatibility";
import { CompatibilityIndicator } from "@/components/agent-editor/CompatibilityIndicator";
import { TraceView } from "@/components/agent/trace-view";
import type { ExecutionStep } from "@/lib/agent-data";

// Mock 预览与调试日志数据（模拟用户在创建过程中进行的对话测试）
const MOCK_PREVIEW_LOGS: LogEntry[] = [
  {
    id: "preview_001",
    input: "请介绍一下你的功能",
    output: "您好！我是自主规划智能体，可以帮助您进行任务规划、决策分析和问题解决。我可以理解复杂需求，制定执行计划，并逐步完成目标。",
    timestamp: "2025-01-15 15:30:22",
    source: "预览与调试",
    userFeedback: { status: null },
    adminFeedback: { status: null },
    status: "pending",
  },
  {
    id: "preview_002",
    input: "如何优化检索效果？",
    output: "优化检索效果可以从以下几个方面入手：1. 调整检索策略，使用混合检索结合关键词和语义检索；2. 优化Top-K参数，平衡召回率和精确率；3. 使用重排序模型对初步结果进行精细化打分；4. 优化向量模型和索引结构。",
    timestamp: "2025-01-15 15:28:15",
    source: "预览与调试",
    userFeedback: { status: "like" },
    adminFeedback: { status: "like" },
    status: "pending",
  },
  {
    id: "preview_003",
    input: "RAG技术的优势是什么？",
    output: "RAG技术的主要优势包括：1. 减少幻觉，通过检索外部知识库确保回答基于经过验证的信息；2. 知识更新灵活，无需重新训练模型即可更新知识库；3. 可追溯性，可以查看回答的来源文档；4. 成本效益，相比微调大模型更加经济。",
    timestamp: "2025-01-15 15:25:08",
    source: "预览与调试",
    userFeedback: { status: null },
    adminFeedback: { status: null },
    status: "pending",
  },
  {
    id: "preview_004",
    input: "测试一下长文本输入，看看智能体如何处理较长的用户问题，包括多个子问题和复杂场景的描述",
    output: "我理解您的问题。对于长文本输入，我会先进行问题分解，识别关键信息和子问题，然后逐一处理。对于复杂场景，我会分析各个要素之间的关系，制定分步骤的执行计划。",
    timestamp: "2025-01-15 15:20:45",
    source: "预览与调试",
    userFeedback: { 
      status: "dislike",
      tags: ["逻辑问题", "其他"],
      content: "理解错误，没有正确理解问题。"
    },
    adminFeedback: { status: null },
    status: "pending",
  },
  {
    id: "preview_005",
    input: "什么是Agent的ReAct模式？",
    output: "ReAct模式结合了推理（Reasoning）和行动（Acting），通过交替执行思考和行动来解决问题。Agent首先思考下一步应该做什么，然后执行相应的行动，观察结果，再继续思考，形成推理-行动-观察的循环。",
    timestamp: "2025-01-15 15:18:32",
    source: "预览与调试",
    userFeedback: { status: "like" },
    adminFeedback: { status: "like" },
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
  const [selectedModel, setSelectedModel] = useState("Qwen3-32B");
  const [modelParams, setModelParams] = useState<ModelParams>({
    temperature: 0.01,
    top_p: 0.01,
    top_k: 20,
    context_turns: 5,
  });
  const compatibility = useModelCompatibility(selectedModel);
  const [selectedWorkflows, setSelectedWorkflows] = useState<WorkflowType[]>([]);
  const [selectedPlugins, setSelectedPlugins] = useState<Plugin[]>([]);
  const [selectedMCPs, setSelectedMCPs] = useState<MCP[]>([]);
  const [workflowSelectorOpen, setWorkflowSelectorOpen] = useState(false);
  const [pluginSelectorOpen, setPluginSelectorOpen] = useState(false);
  const [mcpSelectorOpen, setMcpSelectorOpen] = useState(false);
  // 预置的自主规划智能体的初始本体配置
  // 态势感知智能体 (agent-situational) 的预置配置
  const getInitialOntologies = (): OntologyConfig[] => {
    // 态势感知智能体：预置情报报告和舰船单元的本体配置
    return [
      {
        ontology: "TH态势感知与情报快判",
        objectType: "情报报告",
        property: "content",
        queryRewrite: true,
        retrievalMethod: "semantic",
        semanticWeight: 0.6,
        topK: 10,
        threshold: 0.6,
        injectionFields: [],
      },
      {
        ontology: "TH态势感知与情报快判",
        objectType: "舰船单元",
        property: "name",
        queryRewrite: true,
        retrievalMethod: "structured",
        topK: 5,
        threshold: 0.6,
        injectionFields: [],
      },
    ];
  };
  
  const [selectedOntologies, setSelectedOntologies] = useState<OntologyConfig[]>(getInitialOntologies());
  const [ontologyConfigOpen, setOntologyConfigOpen] = useState(false);
  const [editingOntologyIndex, setEditingOntologyIndex] = useState<number | null>(null);
  const [selectedTerminologies, setSelectedTerminologies] = useState<Terminology[]>([]);
  const [terminologySelectorOpen, setTerminologySelectorOpen] = useState(false);
  const [openingStatement, setOpeningStatement] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([""]);
  const [chatHistory, setChatHistory] = useState<
    Array<{ 
      role: "user" | "assistant"; 
      content: string; 
      timestamp: string;
      traceSteps?: ExecutionStep[]; // 执行链路步骤
    }>
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
    if (editingOntologyIndex !== null) {
      // 更新现有本体配置
      const updated = [...selectedOntologies];
      updated[editingOntologyIndex] = config;
      setSelectedOntologies(updated);
      setEditingOntologyIndex(null);
    } else {
      // 添加新本体配置
    setSelectedOntologies([...selectedOntologies, config]);
    }
  };

  const handleRemoveOntology = (index: number) => {
    setSelectedOntologies(selectedOntologies.filter((_, i) => i !== index));
  };

  const handleEditOntology = (index: number) => {
    setEditingOntologyIndex(index);
    setOntologyConfigOpen(true);
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

    // 强制输出 - 确保函数被调用
    console.log('🚀 [handleSendMessage] 被调用，消息:', message);

    const userMessage = {
      role: "user" as const,
      content: message,
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setShowSuggestedChips(false);

    // 检测敏感词
    const blockedResponse = checkSensitiveContent(message);
    
    if (blockedResponse) {
      // 如果包含敏感词，直接返回拦截响应
      setTimeout(() => {
        const aiMessage = {
          role: "assistant" as const,
          content: blockedResponse,
          timestamp: new Date().toLocaleTimeString(),
        };
        setChatHistory((prev) => [...prev, aiMessage]);
      }, 500);
      return;
    }

    // 生成智能回复（基于用户消息和智能体配置）
    const generateResponse = (userMsg: string): string => {
      const msg = userMsg.toLowerCase();
      
      // ========== 优先级最高：态势感知相关 ==========
      // 只要包含"态势"，就匹配态势感知逻辑（必须放在最前面，甚至比开场白还优先）
      if (msg.includes("态势") || msg.includes("威胁") || msg.includes("身份") || msg.includes("评估") || msg.includes("分析") || msg.includes("海面") || msg.includes("目标")) {
        console.log('[DEBUG] 匹配到态势感知逻辑，消息:', userMsg);
        // 返回完整的研判报告（基于 lib/agent-data.ts 中的 log-sit-01）
        return `### 研判报告

**1. 身份确认**
* 目标 I: USS John Finn (DDG-113)
* 目标 II: USNS Bowditch (TAGS-62)
* 依据: 关联冲绳基地 HUMINT 情报 (Report_088)，编队构成与离港时间完全匹配。

**2. 威胁评估: [中等 - 常态化巡航]**
* 视觉征候: 经传感器图像分析，目标主炮处于归零位置 (Stowed)，垂发盖板关闭，甲板无舰载机起降作业。
* 结论: 判定为过航执行测量任务，未发现即时攻击意图。`;
      }
      
      // 如果有开场白且是第一条消息，使用开场白
      if (chatHistory.length === 0 && openingStatement.trim()) {
        return openingStatement;
      }

      // 根据用户消息内容生成相关回复
      // 注意：将问候语检查放在后面，优先匹配具体功能
      if (msg === "你好" || msg === "hello" || msg === "hi" || msg.trim() === "") {
        return openingStatement.trim() || "您好！我是您的智能助手，有什么可以帮您的吗？";
      }

      // 如果用户询问功能或能力
      if (msg.includes("功能") || msg.includes("能力") || msg.includes("做什么") || msg.includes("能做什么")) {
        const hasKnowledge = selectedKnowledgeBases.length > 0;
        const hasTools = selectedPlugins.length > 0 || selectedWorkflows.length > 0;
        const hasOntology = selectedOntologies.length > 0;
        
        let response = "我可以帮助您：\n";
        if (hasKnowledge) response += "• 基于知识库回答问题\n";
        if (hasOntology) response += "• 查询本体对象和关联信息\n";
        if (hasTools) response += "• 调用工具和工作流完成任务\n";
        if (prompt.trim()) {
          response += `\n${prompt.slice(0, 200)}${prompt.length > 200 ? '...' : ''}`;
        }
        return response;
      }

      // 如果用户询问本体检索相关
      if (msg.includes("本体") || msg.includes("ontology") || msg.includes("对象")) {
        if (selectedOntologies.length > 0) {
          return `我可以帮您查询本体对象。当前已配置 ${selectedOntologies.length} 个本体。您可以告诉我需要查询的对象类型和条件，我会为您检索相关信息。`;
        } else {
          return "本体检索功能需要先配置本体。请在左侧\"知识\"面板中添加本体配置。";
        }
      }

      // 如果用户询问知识库相关（注意：必须在态势感知之后，避免"态势感知"被误匹配）
      if (msg.includes("知识库") || (msg.includes("知识") && !msg.includes("态势"))) {
        if (selectedKnowledgeBases.length > 0) {
          return `我可以基于知识库回答您的问题。当前已关联 ${selectedKnowledgeBases.length} 个知识库。请告诉我您想了解的内容，我会从知识库中检索相关信息为您解答。`;
        } else {
          return "知识库功能需要先添加知识库。请在左侧\"知识\"面板中点击 + 按钮添加知识库。";
        }
      }

      // 如果用户询问视觉分析相关
      if (msg.includes("视觉") || msg.includes("图像") || msg.includes("图片") || msg.includes("识别")) {
        return "我可以进行视觉特征分析。请提供图像数据，我会识别目标的主炮状态、垂发系统、甲板活动等关键特征，并评估目标的威胁等级。";
      }

      // 默认回复：基于角色指令生成
        if (prompt.trim()) {
          const promptPreview = prompt.slice(0, 150);
          return `我理解您的问题。${promptPreview}${prompt.length > 150 ? '...' : ''}\n\n请告诉我更多细节，我会根据我的能力为您提供帮助。`;
        }

      // 最后的默认回复
      return "我理解您的问题。这是一个预览模式，实际部署后我会根据配置的知识库、工具和本体为您提供更详细的回答。您可以尝试询问我的功能、知识库内容或本体检索相关的问题。";
    };

    // 生成执行链路（基于用户消息和智能体配置）
    const generateTraceSteps = (userMsg: string): ExecutionStep[] => {
      console.log('🔍 [generateTraceSteps] 被调用，消息:', userMsg);
      const msg = userMsg.toLowerCase();
      console.log('🔍 [generateTraceSteps] 转小写后:', msg);
      const now = new Date();
      const baseTime = now.getTime();
      let stepIndex = 0;
      const steps: ExecutionStep[] = [];

      // 如果涉及态势感知、威胁评估相关
      if (msg.includes("威胁") || msg.includes("态势") || msg.includes("身份") || msg.includes("评估") || msg.includes("分析") || msg.includes("海面") || msg.includes("目标")) {
        console.log('✅ [generateTraceSteps] 匹配到态势感知关键词，开始生成执行链路');
        let currentTime = baseTime;
        
        // ==========================================
        // 阶段一：身份推理 (Identity Reasoning)
        // ==========================================
        // Step 1: 思考 (Reasoning)
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: 'Step 1: 场景分析与规划',
          stepType: 'thought',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 1500).toLocaleTimeString(),
          duration: 1500,
          input: '',
          output: '监测到台海区域出现不明目标组合 (1驱+1测，ID未知)。\n[常识] 目标在台海，则来源可能是冲绳或佐世保\n[规划] 在 MDP 中检索符合地点和舰型组合的情报对象。'
        });
        currentTime += 1500;

        // Step 2: 本体检索 IntelligenceReport
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: '本体检索: IntelligenceReport',
          stepType: 'ontology_query',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 2500).toLocaleTimeString(),
          duration: 2500,
          input: {
            objectType: 'IntelligenceReport',
            filter: {
              location: ['Okinawa'],
              keywords: ['Destroyer'],
              time: '-72h'
            }
          },
          output: {
            matched: [{
              id: 'Report_Obj_088',
              content: '冲绳集结: 菲恩号(DDG-113), 鲍迪奇号(TAGS-62)'
            }]
          }
        });
        currentTime += 2500;

        // Step 3: 融合与计算 (Spatiotemporal Check)
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: 'Step 2: 时空融合与计算',
          stepType: 'thought',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 1500).toLocaleTimeString(),
          duration: 1500,
          input: '',
          output: '融合与计算：\n1. 距离：冲绳至台海约 600km，耗时 24h\n2. 航速：600 除以 24 等于 25km/h (13.5节)，符合驱逐舰经济航速\n3. 结论：观测对象即为 Report_Obj_088 中的编队'
        });
        currentTime += 1500;

        // Step 4: 更新事件身份 (Link Identity)
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: '动作: 更新事件身份 (Link Identity)',
          stepType: 'tool_call',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 800).toLocaleTimeString(),
          duration: 800,
          input: {
            action: 'Update_Entity',
            target: 'TransitEvent_001',
            updates: {
              ship_ids: ['US-DDG-113', 'US-TAGS-62'],
              Status: 'Identified'
            }
          },
          output: {
            success: true,
            snapshot_id: 'evt_v2',
            updated_fields: ['ship_ids', 'Status']
          }
        });
        currentTime += 800;

        // ==========================================
        // 阶段二：视觉态势评估 (Visual Threat Assessment)
        // ==========================================
        // Step 5: 思考 (Reasoning)
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: 'Step 3: 态势评估策略',
          stepType: 'thought',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 1500).toLocaleTimeString(),
          duration: 1500,
          input: '',
          output: '身份已更新。需读取关联的图像对象，分析物理征候以评估威胁。'
        });
        currentTime += 1500;

        // Step 6: 读取对象 SensorData (Image)
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: '读取对象: SensorData (Image)',
          stepType: 'ontology_query',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 1000).toLocaleTimeString(),
          duration: 1000,
          input: {
            objectType: 'SensorData',
            filter: {
              linked_to: 'TransitEvent_001',
              type: 'Image'
            }
          },
          output: {
            matched: [{
              id: 'Sensor_Img_001',
              type: 'Image',
              linked_to: 'TransitEvent_001',
              binary_data: 'Image_Binary_Data'
            }]
          }
        });
        currentTime += 1000;

        // Step 7: 视觉模型处理 (Internal Model)
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: '视觉模型处理 (Internal Model)',
          stepType: 'tool_call',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 2000).toLocaleTimeString(),
          duration: 2000,
          input: {
            image_data: 'Image_Binary_Data',
            targets: ['Main_Gun', 'VLS_Hatch', 'Deck']
          },
          output: {
            Gun: 'Stowed',
            VLS: 'Closed',
            Deck: 'Clear',
            Posture: 'Non-Aggressive Posture'
          }
        });
        currentTime += 2000;

        // Step 8: 综合定级 (Decision)
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: 'Step 4: 综合定级',
          stepType: 'thought',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 1500).toLocaleTimeString(),
          duration: 1500,
          input: '',
          output: '综合定级：\n1. 高能力：DDG 具备区域防空能力\n2. 抵近：目标已进入台海区域\n>> 初步结论：高能力(DDG) + 抵近 = High Threat\n>> 虽然视觉分析显示主炮归零，但驱逐舰始终有攻击属性\n>> 最终结论：综合判定为 High Threat (常态化巡航)'
        });
        currentTime += 1500;

        // Step 9: 更新最终威胁评估 (Final Decision)
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: '动作: 更新最终威胁评估 (Final Decision)',
          stepType: 'tool_call',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 1000).toLocaleTimeString(),
          duration: 1000,
          input: {
            action: 'Update_Entity',
            target: 'TransitEvent_001',
            updates: {
              Final_Threat_Assessment: 'High',
              Reasoning: '经时空计算确认身份为菲恩号，高能力(DDG) + 抵近 = High Threat，虽然视觉分析显示主炮归零，但驱逐舰始终有攻击属性，判定为常态化巡航'
            }
          },
          output: {
            success: true,
            timestamp: new Date(currentTime + 1000).toLocaleTimeString(),
            final_assessment: 'High',
            reasoning: '经时空计算确认身份为菲恩号，高能力(DDG) + 抵近 = High Threat，虽然视觉分析显示主炮归零，但驱逐舰始终有攻击属性，判定为常态化巡航'
          }
        });
        currentTime += 1000;

        // Step 10: 最终答案生成
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: 'Step 5: 生成研判报告',
          stepType: 'final_answer',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 2000).toLocaleTimeString(),
          duration: 2000,
          input: {
            intelligenceData: '已关联冲绳基地 HUMINT 情报 (Report_Obj_088)',
            spatiotemporalCheck: '距离 600km，航速 13.5节，符合经济航速，确认身份匹配',
            visualAnalysis: '主炮归零(Stowed)、垂发关闭(Closed)、甲板无异常(Clear)，姿态为非攻击性',
            threatLevel: '高 - 常态化巡航'
          },
          output: '### 研判报告\n\n**1. 身份确认**\n* 目标 I: USS John Finn (DDG-113)\n* 目标 II: USNS Bowditch (TAGS-62)\n* 依据: 关联冲绳基地 HUMINT 情报 (Report_Obj_088)，经时空计算（距离 600km，航速 13.5节）确认编队构成与离港时间完全匹配。\n\n**2. 威胁评估: [高 - 常态化巡航]**\n* 能力评估: DDG-113 具备区域防空能力，属于高能力平台\n* 行为分析: 目标已进入台海区域（抵近），视觉分析显示主炮归零(Stowed)、垂发关闭(Closed)、甲板无异常活动(Clear)\n* 综合定级: 高能力(DDG) + 抵近 = High Threat。虽然视觉分析显示主炮归零，但驱逐舰始终有攻击属性，综合判定为 High Threat\n* 结论: 判定为过航执行测量任务，常态化巡航，但需持续关注其动态。'
        });
        console.log('✅ [generateTraceSteps] 态势感知执行链路生成完成，共', steps.length, '个步骤');
      } else if (msg.includes("本体") || msg.includes("ontology") || msg.includes("对象")) {
        // 本体检索场景
        if (selectedOntologies.length > 0) {
          steps.push({
            id: `step-${++stepIndex}`,
            stepName: '本体检索: 查询对象实例',
            stepType: 'ontology_query',
            status: 'success',
            startTime: new Date(baseTime + stepIndex * 1000).toLocaleTimeString(),
            endTime: new Date(baseTime + (stepIndex + 2) * 1000).toLocaleTimeString(),
            duration: 2000,
            input: {
              objectType: 'Vehicle',
              filter: { license_plate: '京A88888' }
            },
            output: [
              {
                id: 'obj_123',
                type: 'Vehicle',
                title: '车辆对象',
                properties: {
                  color: 'Black',
                  owner: 'Zhang San',
                  license_plate: '京A88888'
                }
              }
            ]
          });
        }
      } else if (msg.includes("知识库") || msg.includes("知识") || selectedKnowledgeBases.length > 0) {
        // RAG 检索场景
        if (selectedKnowledgeBases.length > 0) {
          steps.push({
            id: `step-${++stepIndex}`,
            stepName: '知识检索: 从知识库获取相关信息',
            stepType: 'rag_retrieval',
            status: 'success',
            startTime: new Date(baseTime + stepIndex * 1000).toLocaleTimeString(),
            endTime: new Date(baseTime + (stepIndex + 2) * 1000).toLocaleTimeString(),
            duration: 2000,
            input: {
              query: userMsg,
              knowledgeBases: selectedKnowledgeBases.map(kb => kb.id),
              topK: 5
            },
            output: {
              chunks: [
                {
                  id: 'chunk_001',
                  content: '相关文档片段内容...',
                  score: 0.85,
                  source: '知识库文档1'
                }
              ]
            },
            citations: [
              {
                sourceName: '知识库文档1',
                content: '相关文档片段内容...',
                url: '#'
              }
            ]
          });
        }
      } else {
        // 通用思考步骤
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: 'Step 1: 理解用户意图',
          stepType: 'thought',
          status: 'success',
          startTime: new Date(baseTime + stepIndex * 1000).toLocaleTimeString(),
          endTime: new Date(baseTime + (stepIndex + 1) * 1000).toLocaleTimeString(),
          duration: 1000,
          input: `用户消息: ${userMsg}`,
          output: '正在分析用户需求，准备生成回复...'
        });
      }

      console.log('📊 [generateTraceSteps] 最终返回步骤数量:', steps.length);
      return steps;
    };

    // Mock AI response with delay
    setTimeout(() => {
      console.log('🚀🚀🚀 [CRITICAL] setTimeout 回调执行，消息:', message);
      const response = generateResponse(message);
      console.log('🚀🚀🚀 [CRITICAL] generateResponse 返回:', response.substring(0, 100));
      const traceSteps = generateTraceSteps(message);
      console.log('🚀🚀🚀 [CRITICAL] generateTraceSteps 返回步骤数:', traceSteps.length);
      
      // 调试日志 - 强制输出
      console.log('========== [Agent Editor Debug] ==========');
      console.log('[Agent Editor] User message:', message);
      console.log('[Agent Editor] Generated response:', response);
      console.log('[Agent Editor] Trace steps count:', traceSteps.length);
      console.log('[Agent Editor] Trace steps:', JSON.stringify(traceSteps, null, 2));
      
      // 确保 traceSteps 总是存在（即使是空数组也要显示）
      // 强制验证：确保态势感知消息总是有执行链路
      if ((message.toLowerCase().includes("态势") || message.toLowerCase().includes("威胁") || message.toLowerCase().includes("身份") || message.toLowerCase().includes("评估") || message.toLowerCase().includes("分析") || message.toLowerCase().includes("海面") || message.toLowerCase().includes("目标")) && traceSteps.length === 0) {
        console.error('❌❌❌ [CRITICAL] 态势感知消息但没有生成执行链路！强制生成...');
        // 如果执行链路为空，强制生成完整的4个步骤
        const baseTime = Date.now();
        traceSteps.push({
          id: 'step-1',
          stepName: 'Step 1: 场景理解与规划',
          stepType: 'thought',
          status: 'success',
          startTime: new Date(baseTime).toLocaleTimeString(),
          endTime: new Date(baseTime + 1000).toLocaleTimeString(),
          duration: 1000,
          input: `用户请求: ${message}`,
          output: '目标在台海出现，需要检索 MDP 中符合条件的情报对象，并进行视觉特征分析以评估威胁等级。'
        });
        traceSteps.push({
          id: 'step-2',
          stepName: '本体检索: 关联情报对象',
          stepType: 'ontology_query',
          status: 'success',
          startTime: new Date(baseTime + 1000).toLocaleTimeString(),
          endTime: new Date(baseTime + 4000).toLocaleTimeString(),
          duration: 3000,
          input: { objectType: 'IntelligenceReport', filter: { keywords: ['Destroyer', 'Survey Ship'], timeRange: '-72h' } },
          output: [{ id: 'Report_Obj_088', type: 'IntelligenceReport', title: 'HUMINT: Okinawa Port Departure', properties: { summary: '冲绳集结: 菲恩号(DDG-113), 鲍迪奇号(TAGS-62) 于今日离港...', confidence: 'High' } }]
        });
        traceSteps.push({
          id: 'step-3',
          stepName: '调用: 视觉模型 (Posture Check)',
          stepType: 'tool_call',
          status: 'success',
          startTime: new Date(baseTime + 4000).toLocaleTimeString(),
          endTime: new Date(baseTime + 7000).toLocaleTimeString(),
          duration: 3000,
          input: { image_source: 'Linked_Sensor_Data', detection_targets: ['Main_Gun', 'VLS_Hatch', 'Deck_Activity'] },
          output: { image_url: '/mock/ddg-sensor.jpg', features: { gun_posture: 'Stowed (归零)', vls_state: 'Closed', deck: 'Clear' }, conclusion: 'Non-Aggressive' }
        });
        traceSteps.push({
          id: 'step-4',
          stepName: 'Step 4: 生成研判报告',
          stepType: 'final_answer',
          status: 'success',
          startTime: new Date(baseTime + 7000).toLocaleTimeString(),
          endTime: new Date(baseTime + 9000).toLocaleTimeString(),
          duration: 2000,
          input: { intelligenceData: '已关联冲绳基地 HUMINT 情报 (Report_088)', visualAnalysis: '主炮归零、垂发关闭、甲板无异常活动', threatLevel: '中等 - 常态化巡航' },
          output: '### 研判报告\n\n**1. 身份确认**\n* 目标 I: USS John Finn (DDG-113)\n* 目标 II: USNS Bowditch (TAGS-62)\n* 依据: 关联冲绳基地 HUMINT 情报 (Report_088)，编队构成与离港时间完全匹配。\n\n**2. 威胁评估: [中等 - 常态化巡航]**\n* 视觉征候: 经传感器图像分析，目标主炮处于归零位置 (Stowed)，垂发盖板关闭，甲板无舰载机起降作业。\n* 结论: 判定为过航执行测量任务，未发现即时攻击意图。'
        });
      }
      
      const aiMessage = {
        role: "assistant" as const,
        content: response,
        timestamp: new Date().toLocaleTimeString(),
        traceSteps: traceSteps.length > 0 ? traceSteps : undefined, // 只有非空时才设置
      };
      
      // 强制验证：如果消息包含"态势"但 traceSteps 为空，输出警告
      if (message.toLowerCase().includes("态势") && traceSteps.length === 0) {
        console.error('❌ [ERROR] 态势感知消息但没有生成执行链路！消息:', message);
        console.error('❌ [ERROR] traceSteps:', traceSteps);
      }
      
      console.log('[Agent Editor] AI Message with traceSteps:', JSON.stringify(aiMessage, null, 2));
      console.log('[Agent Editor] traceSteps exists?', !!aiMessage.traceSteps);
      console.log('[Agent Editor] traceSteps length:', aiMessage.traceSteps?.length || 0);
      console.log('==========================================');
      
      setChatHistory((prev) => {
        const newHistory = [...prev, aiMessage];
        console.log('[Agent Editor] Updated chat history length:', newHistory.length);
        console.log('[Agent Editor] Last message traceSteps:', newHistory[newHistory.length - 1]?.traceSteps?.length || 0);
        console.log('[Agent Editor] Last message traceSteps 详情:', newHistory[newHistory.length - 1]?.traceSteps);
        // 强制验证：确保执行链路被正确添加
        if (message.toLowerCase().includes("态势") && newHistory[newHistory.length - 1]?.traceSteps?.length === 0) {
          console.error('❌❌❌ [CRITICAL ERROR] 态势感知消息但执行链路为空！');
        }
        return newHistory;
      });
    }, 800 + Math.random() * 400); // 模拟思考时间 800-1200ms
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
          <ProtectionStatusBadge
            protectionTaskName="GF专属防护"
            protectionTaskId="1"
            protectionTypes={["policy", "lexicon"]}
          />
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
                  <span className="font-medium text-slate-900 inline-flex items-center gap-2">
                    知识库
                    <CompatibilityIndicator
                      status={
                        compatibility.items.knowledge_base.status === "limited"
                          ? "limited"
                          : compatibility.items.knowledge_base.status === "unsupported"
                            ? "unsupported"
                            : "unknown"
                      }
                      shortLabel={compatibility.items.knowledge_base.shortLabel}
                      tooltip={compatibility.items.knowledge_base.tooltip}
                    />
                  </span>
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
                  <Network className="w-5 h-5" style={{ color: '#ea580c' }} />
                  <span className="font-medium text-slate-900 inline-flex items-center gap-2">
                    本体
                    <CompatibilityIndicator
                      status={
                        compatibility.items.ontology.status === "limited"
                          ? "limited"
                          : compatibility.items.ontology.status === "unsupported"
                            ? "unsupported"
                            : "unknown"
                      }
                      shortLabel={compatibility.items.ontology.shortLabel}
                      tooltip={compatibility.items.ontology.tooltip}
                    />
                  </span>
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
                  setEditingOntologyIndex(null);
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
                  selectedOntologies.map((ontology, index) => {
                    // 获取对象类型图标
                    const getObjectTypeIcon = (objectType: string) => {
                      if (objectType.includes("历史") || objectType.includes("战例")) {
                        return BookOpen;
                      }
                      return Network;
                    };
                    
                    // 获取检索方式标签
                    const getRetrievalMethodLabel = (method: "structured" | "semantic" | undefined) => {
                      if (method === "structured") {
                        return "结构化检索";
                      } else if (method === "semantic") {
                        return "语义检索";
                      }
                      return "未设置";
                    };
                    
                    const Icon = getObjectTypeIcon(ontology.objectType);
                    
                    return (
                    <div
                      key={index}
                        className="border border-slate-200 rounded-lg bg-white"
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                              <Icon className="w-4 h-4 text-orange-600" />
                      </div>
                            <div>
                        <div className="text-sm font-medium text-slate-900">
                                {ontology.objectType}
                        </div>
                              <div className="text-xs text-slate-500">
                                {ontology.ontology}
                        </div>
                      </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditOntology(index)}
                            className="h-8 gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="text-xs">编辑配置</span>
                          </Button>
                        </div>

                        {/* Card Body */}
                        <div className="px-4 py-3 space-y-2">
                          {/* 检索方式 */}
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={ontology.retrievalMethod === "semantic" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {getRetrievalMethodLabel(ontology.retrievalMethod)}
                            </Badge>
                          </div>

                          {/* 关键参数 */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-slate-500">TopK:</span>
                              <span className="ml-1 text-slate-900 font-medium">
                                {ontology.topK ?? 20}
                              </span>
                            </div>
                            {ontology.retrievalMethod === "semantic" && (
                              <div>
                                <span className="text-slate-500">语义权重:</span>
                                <span className="ml-1 text-slate-900 font-medium">
                                  {((ontology.semanticWeight ?? 0.6) * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-slate-500">阈值:</span>
                              <span className="ml-1 text-slate-900 font-medium">
                                {((ontology.threshold ?? 0.6) * 100).toFixed(0)}%
                              </span>
                            </div>
                            {ontology.property && (
                              <div>
                                <span className="text-slate-500">检索字段:</span>
                                <span className="ml-1 text-slate-900 font-medium">
                                  {ontology.property}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Remove Button - Outside card body */}
                        <div className="px-4 pb-3 flex justify-end">
                      <button
                        onClick={() => handleRemoveOntology(index)}
                            className="text-xs text-slate-500 hover:text-red-600 transition-colors"
                        title="移除"
                      >
                            移除
                      </button>
                    </div>
                      </div>
                    );
                  })
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
                  <span className="font-medium text-slate-900 inline-flex items-center gap-2">
                    术语库
                    <CompatibilityIndicator
                      status={
                        compatibility.items.terminology.status === "limited"
                          ? "limited"
                          : compatibility.items.terminology.status === "unsupported"
                            ? "unsupported"
                            : "unknown"
                      }
                      shortLabel={compatibility.items.terminology.shortLabel}
                      tooltip={compatibility.items.terminology.tooltip}
                    />
                  </span>
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
                    <span className="font-medium text-slate-900 inline-flex items-center gap-2">
                      工作流
                      <CompatibilityIndicator
                        status={
                          compatibility.items.workflow.status === "limited"
                            ? "limited"
                            : compatibility.items.workflow.status === "unsupported"
                              ? "unsupported"
                              : "unknown"
                        }
                        shortLabel={compatibility.items.workflow.shortLabel}
                        tooltip={compatibility.items.workflow.tooltip}
                      />
                    </span>
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
                    <span className="font-medium text-slate-900 inline-flex items-center gap-2">
                      插件
                      <CompatibilityIndicator
                        status={
                          compatibility.items.plugins.status === "limited"
                            ? "limited"
                            : compatibility.items.plugins.status === "unsupported"
                              ? "unsupported"
                              : "unknown"
                        }
                        shortLabel={compatibility.items.plugins.shortLabel}
                        tooltip={compatibility.items.plugins.tooltip}
                      />
                    </span>
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
                    <span className="font-medium text-slate-900 inline-flex items-center gap-2">
                      MCP
                      <CompatibilityIndicator
                        status={
                          compatibility.items.mcp.status === "limited"
                            ? "limited"
                            : compatibility.items.mcp.status === "unsupported"
                              ? "unsupported"
                              : "unknown"
                        }
                        shortLabel={compatibility.items.mcp.shortLabel}
                        tooltip={compatibility.items.mcp.tooltip}
                      />
                    </span>
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
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0 text-green-600">
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
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {/* 执行链路展示 - 强制显示 */}
                        {message.role === "assistant" && (
                          <>
                            {(() => {
                              // 调试：在渲染时输出
                              console.log('🎨 [Render] 渲染消息，role:', message.role);
                              console.log('🎨 [Render] Message traceSteps:', message.traceSteps);
                              console.log('🎨 [Render] Message traceSteps length:', message.traceSteps?.length || 0);
                              console.log('🎨 [Render] Message content:', message.content.substring(0, 50));
                              
                              if (message.traceSteps && message.traceSteps.length > 0) {
                                console.log('✅ [Render] 显示执行链路，步骤数:', message.traceSteps.length);
                                return (
                                  <div className="mt-3 max-w-[80%]">
                                    <div className="bg-white border-2 border-blue-200 rounded-lg p-4 shadow-sm">
                                      <h4 className="text-sm font-semibold text-slate-900 mb-3">
                                        执行链路
                                      </h4>
                                      <TraceView steps={message.traceSteps} />
                                    </div>
                                  </div>
                                );
                              } else {
                                console.warn('⚠️ [Render] 无执行链路数据，traceSteps:', message.traceSteps);
                                return (
                                  <div className="mt-2 text-xs text-red-500 italic max-w-[80%] p-2 bg-red-50 rounded border border-red-200">
                                    ⚠️ 调试: 无执行链路数据
                                    <br />
                                    traceSteps: {message.traceSteps ? '存在但为空数组' : '不存在'}
                                    <br />
                                    <span className="text-xs">消息内容: {message.content.substring(0, 50)}...</span>
                                  </div>
                                );
                              }
                            })()}
                          </>
                        )}
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
        onOpenChange={(open) => {
          setOntologyConfigOpen(open);
          if (!open) {
            setEditingOntologyIndex(null);
          }
        }}
        initialConfig={
          editingOntologyIndex !== null
            ? selectedOntologies[editingOntologyIndex]
            : undefined
        }
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
