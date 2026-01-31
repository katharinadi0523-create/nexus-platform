"use client";

import { useState, useEffect, isValidElement } from "react";
import {
  Send,
  ChevronDown,
  ChevronUp,
  BookOpen,
  BookA,
  Puzzle,
  Network,
  Workflow,
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
import { Package } from "lucide-react";
import { getAllActions } from "@/lib/mock/mock-mcp-actions";
import { OntologyConfigDialog, type OntologyConfig } from "@/components/agent-editor/OntologyConfigDialog";
import { TerminologySelector, type Terminology } from "@/components/agent-editor/TerminologySelector";
import { checkSensitiveContent } from "@/lib/content-filter";
import { useModelCompatibility } from "@/lib/useModelCompatibility";
import { CompatibilityIndicator } from "@/components/agent-editor/CompatibilityIndicator";
import { TraceView } from "@/components/agent/trace-view";
import type { ExecutionStep } from "@/lib/agent-data";

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
  mcps?: Array<{ id: string; name: string; description?: string; actionId?: string }>;
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
    plugins: ["Google Search", "Twitter Firehose"],
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
  "agent-situational": {
    type: "autonomous",
    name: "态势感知智能体",
    description: "实时分析海面目标的身份与威胁等级，支持本体查询和视觉特征分析。",
    prompt: "你是一个海战态势感知智能体，负责实时分析海面目标的身份与威胁等级。",
    openingStatement: "你好，我是态势感知智能体。我可以进行实时态势分析和威胁评估，请提供目标信息。",
    suggestedQuestions: [
      "实时分析海面目标的身份与威胁等级",
    ],
    ontologies: [
      {
        id: "onto-situational-1",
        name: "TH态势感知与情报快判 - 情报报告",
        description: "语义检索 (向量)",
      },
    ],
    plugins: [
      {
        id: "plugin-vision-1",
        name: "视觉特征分析",
        description: "分析目标的主炮状态、垂发系统、甲板活动等关键特征",
        icon: "Eye",
        type: "plugin",
      },
    ],
    mcps: [
      {
        id: "mcp-transit-event",
        name: "TransitEvent MDP",
        description: "过航事件相关的操作",
        actionId: "action-transit-update-identity",
      },
      {
        id: "mcp-transit-event-2",
        name: "TransitEvent MDP",
        description: "过航事件相关的操作",
        actionId: "action-transit-update-threat",
      },
    ],
    mockReply: "我可以进行实时态势分析和威胁评估。请提供目标信息（如位置、特征等），我会：\n1. 通过本体查询关联情报对象\n2. 进行身份识别和融合\n3. 调用视觉模型分析目标状态\n4. 综合评估威胁等级并生成研判报告。",
  },
};

interface AutonomousEditorProps {
  agentId: string;
  initialAgentData?: AgentDetailData;
  onDirtyChange?: (dirty: boolean) => void;
}

type PresetPlugin = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  type?: string;
};

function normalizeTerminologies(input: unknown): Terminology[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((t) => {
      if (t && typeof t === "object") {
        const obj = t as { id?: unknown; name?: unknown };
        if (typeof obj.id === "string" && typeof obj.name === "string") {
          return { id: obj.id, name: obj.name } satisfies Terminology;
        }
      }
      return null;
    })
    .filter((x): x is Terminology => !!x);
}

function normalizeMCPs(input: unknown): MCP[] {
  if (!Array.isArray(input)) return [];
  const allActions = getAllActions();
  
  return input
    .map((m) => {
      if (!m || typeof m !== "object") return null;
      const obj = m as { id?: unknown; name?: unknown; description?: unknown; actionId?: unknown };
      
      // If it's an ontology action (has actionId), find the action and create MCP
      if (typeof obj.actionId === "string") {
        const action = allActions.find((a: any) => a.id === obj.actionId);
        if (action) {
          return {
            id: action.id,
            name: action.name,
            description: action.description,
            icon: <Package className="w-5 h-5 text-green-600" />,
          } satisfies MCP;
        }
      }
      
      // Otherwise, treat as regular MCP
      if (typeof obj.id === "string" && typeof obj.name === "string") {
        return {
          id: obj.id,
          name: obj.name,
          description: typeof obj.description === "string" ? obj.description : "",
          icon: <Package className="w-5 h-5 text-green-600" />,
        } satisfies MCP;
      }
      
      return null;
    })
    .filter((x): x is MCP => !!x);
}

function normalizeOntologies(input: unknown): OntologyConfig[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((o) => {
      if (!o || typeof o !== "object") return null;
      const obj = o as { name?: unknown; description?: unknown };
      const name = typeof obj.name === "string" ? obj.name : "";
      const desc = typeof obj.description === "string" ? obj.description : "";

      // name example: "海上态势感知 - 无人机" or "海上态势感知 - 无人机 - 续航时间"
      const parts = name.split(" - ").map((s) => s.trim());
      const ontology = parts[0] || "";
      const objectType = parts[1] || "";
      const property = parts[2] || "";

      // desc example: "语义检索 (战斗风格_向量)"
      const isSemantic = desc.includes("语义检索");
      const vectorMatch = desc.match(/\(([^)]+)\)/);
      const retrievalVector = vectorMatch?.[1];

      if (!ontology || !objectType) return null;

      const normalized: OntologyConfig = {
        ontology,
        objectType,
        property,
        queryRewrite: true,
        retrievalMethod: isSemantic ? "semantic" : "full",
        retrievalVector: isSemantic ? retrievalVector : undefined,
        topK: 20,
        threshold: 0.6,
        injectionFields: property ? [property] : [],
      };

      return normalized;
    })
    .filter((x): x is OntologyConfig => !!x);
}

function normalizePlugins(input: unknown): Plugin[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((p) => {
      if (!p || typeof p !== "object") return null;

      // If already looks like PluginSelector.Plugin (has ReactNode icon), keep it.
      const asAny = p as any;
      if (
        typeof asAny.id === "string" &&
        typeof asAny.name === "string" &&
        isValidElement(asAny.icon)
      ) {
        return {
          id: asAny.id,
          name: asAny.name,
          description: typeof asAny.description === "string" ? asAny.description : "",
          icon: asAny.icon,
          color: typeof asAny.color === "string" ? asAny.color : "bg-blue-100 text-blue-600",
        } satisfies Plugin;
      }

      // Otherwise accept preset form with icon as string name.
      const preset = p as PresetPlugin;
      if (typeof preset.id !== "string" || typeof preset.name !== "string") return null;

      const iconName = typeof preset.icon === "string" ? preset.icon : "";
      const icon =
        iconName === "FileText" ? <FileText className="w-5 h-5" /> : <Puzzle className="w-5 h-5" />;

      return {
        id: preset.id,
        name: preset.name,
        description: typeof preset.description === "string" ? preset.description : "",
        icon,
        color: "bg-blue-100 text-blue-600",
      } satisfies Plugin;
    })
    .filter((x): x is Plugin => !!x);
}

export function AutonomousEditor({
  agentId,
  initialAgentData,
  onDirtyChange,
}: AutonomousEditorProps) {
  const agentData = initialAgentData || AGENTS_DETAIL_DATA[agentId] || null;

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
  const [selectedPlugins, setSelectedPlugins] = useState<Plugin[]>(
    () => normalizePlugins((initialAgentData as any)?.plugins)
  );
  const [selectedMCPs, setSelectedMCPs] = useState<MCP[]>([]);
  const [workflowSelectorOpen, setWorkflowSelectorOpen] = useState(false);
  const [pluginSelectorOpen, setPluginSelectorOpen] = useState(false);
  const [mcpSelectorOpen, setMcpSelectorOpen] = useState(false);
  const [selectedOntologies, setSelectedOntologies] = useState<OntologyConfig[]>(
    () => normalizeOntologies((initialAgentData as any)?.ontologies)
  );
  const [ontologyConfigOpen, setOntologyConfigOpen] = useState(false);
  const [selectedTerminologies, setSelectedTerminologies] = useState<Terminology[]>(
    () => normalizeTerminologies((initialAgentData as any)?.terminologies)
  );
  const [terminologySelectorOpen, setTerminologySelectorOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
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

  // If initialAgentData arrives asynchronously (common when parent loads in useEffect),
  // hydrate selections once it becomes available.
  useEffect(() => {
    if (!initialAgentData) return;

    const nextOntologies = normalizeOntologies((initialAgentData as any).ontologies);
    const nextTerminologies = normalizeTerminologies((initialAgentData as any).terminologies);
    const nextPlugins = normalizePlugins((initialAgentData as any).plugins);
    const nextMCPs = normalizeMCPs((initialAgentData as any).mcps);

    // Only overwrite when we actually have incoming presets.
    if (nextOntologies.length > 0) {
      setSelectedOntologies(nextOntologies);
      setExpandedSections((prev) => ({ ...prev, ontology: true }));
    }
    if (nextTerminologies.length > 0) {
      setSelectedTerminologies(nextTerminologies);
      setExpandedSections((prev) => ({ ...prev, terminology: true }));
    }
    if (nextPlugins.length > 0) {
      setSelectedPlugins(nextPlugins);
      setExpandedSections((prev) => ({ ...prev, plugins: true }));
    }
    if (nextMCPs.length > 0) {
      setSelectedMCPs(nextMCPs);
      setExpandedSections((prev) => ({ ...prev, mcp: true }));
    }
  }, [initialAgentData]);

  // Task 2: 数据回显 (Hydration)
  useEffect(() => {
    if (agentData) {
      // 填充 Prompt
      setPrompt(agentData.prompt);
      
      // 填充开场白
      setOpeningStatement(agentData.openingStatement);
      
      // 填充推荐问
      if (agentData.suggestedQuestions.length > 0) {
        setSuggestedQuestions(agentData.suggestedQuestions);
      } else {
        setSuggestedQuestions([""]);
      }
      
      // 填充插件（需要根据插件名称匹配）
      // 这里假设插件选择器可以根据名称匹配
      // 实际实现可能需要根据插件名称查找对应的插件对象
    } else {
      // 如果找不到数据，重置为默认值
      setPrompt("");
      setOpeningStatement("");
      setSuggestedQuestions([""]);
    }
  }, [agentId, agentData]);

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

  // Task 3: 预览区联动与模拟回复
  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;

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

    // 生成智能回复和执行链路（基于用户消息和智能体配置）
    const generateResponse = (userMsg: string): string => {
      const msg = userMsg.toLowerCase();
      
      // ========== 优先级最高：态势感知相关 ==========
      if (msg.includes("态势") || msg.includes("威胁") || msg.includes("身份") || msg.includes("评估") || msg.includes("分析") || msg.includes("海面") || msg.includes("目标")) {
        // 返回空字符串，研判报告只在执行链路的最后一步（final_answer）中显示
        return "";
      }
      
      // 根据当前的 id，从 AGENTS_DETAIL_DATA[id].mockReply 获取模拟回复内容
      return agentData?.mockReply || "您好，有什么可以帮您？";
    };

    // 生成执行链路（基于用户消息和智能体配置）
    const generateTraceSteps = (userMsg: string): ExecutionStep[] => {
      const msg = userMsg.toLowerCase();
      const now = new Date();
      const baseTime = now.getTime();
      let stepIndex = 0;
      const steps: ExecutionStep[] = [];

      // 如果涉及态势感知、威胁评估相关
      if (msg.includes("威胁") || msg.includes("态势") || msg.includes("身份") || msg.includes("评估") || msg.includes("分析") || msg.includes("海面") || msg.includes("目标")) {
        let currentTime = baseTime;
        
        // Step 1: 初始思考
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: 'Step 1: 场景分析与规划',
          stepType: 'thought',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 1500).toLocaleTimeString(),
          duration: 1500,
          input: '',
          output: '监测到台海区域出现不明目标组合 (1驱+1测)。\n基于常识判断，目标来源极可能是冲绳或佐世保基地。\n>> 规划：检索 MDP 情报库中符合 [地点+舰型] 的近期情报。'
        });
        currentTime += 1500;

        // Step 2: 本体查询
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: '本体查询: 关联情报对象',
          stepType: 'ontology_query',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 2500).toLocaleTimeString(),
          duration: 2500,
          input: { 
            objectType: 'IntelligenceReport', 
            filter: { 
              loc: ['Okinawa', 'Sasebo'], 
              keywords: ['Destroyer', 'Survey'], 
              time: '-72h' 
            } 
          },
          output: { 
            matched: [{ 
              id: 'Report_088', 
              content: '冲绳集结: 菲恩号(DDG-113), 鲍迪奇号(TAGS-62)...' 
            }] 
          }
        });
        currentTime += 2500;

        // Step 3: 融合思考 (Fusion)
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: 'Step 2: 情报融合与锁定',
          stepType: 'thought',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 1000).toLocaleTimeString(),
          duration: 1000,
          input: '',
          output: '查询结果 Report_088 中的编队构成与现场观测完美匹配。\n>> 结论：锁定身份为美海军"菲恩"号编队。\n>> 行动：更新事件实体的身份属性。'
        });
        currentTime += 1000;

        // Step 4: 写动作
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: '动作: 更新事件身份',
          stepType: 'tool_call',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 800).toLocaleTimeString(),
          duration: 800,
          input: { 
            action: 'Update_Entity', 
            target: 'TransitEvent_001', 
            updates: { 
              identity: ['US-DDG-113', 'US-TAGS-62'] 
            } 
          },
          output: { 
            success: true, 
            snapshot_id: 'evt_v2' 
          }
        });
        currentTime += 800;

        // Step 5: 态势评估思考 (Reasoning)
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: 'Step 3: 态势评估策略 (Reasoning)',
          stepType: 'thought',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 1500).toLocaleTimeString(),
          duration: 1500,
          input: '',
          output: '身份已确认。下一步需评估其威胁等级。\n>> 规划：读取关联的传感器图像 (SensorData)，调用视觉模型分析 主炮状态 与 垂发盖板 开启情况。'
        });
        currentTime += 1500;

        // Step 6: 视觉动作
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: '调用: 视觉态势分析',
          stepType: 'tool_call',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 3000).toLocaleTimeString(),
          duration: 3000,
          input: { 
            image_id: 'Sensor_Img_001', 
            targets: ['Main_Gun', 'VLS_Hatch'] 
          },
          output: { 
            gun: 'Stowed (归零)', 
            vls: 'Closed', 
            deck: 'Clear', 
            conclusion: 'Non-Aggressive' 
          }
        });
        currentTime += 3000;

        // Step 7: 最终决策思考 (Decision)
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: 'Step 4: 综合决策 (Decision)',
          stepType: 'thought',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 1500).toLocaleTimeString(),
          duration: 1500,
          input: '',
          output: '综合研判：\n1. 高能力 (DDG-113 具备区域防空能力)\n2. 低姿态 (主炮归零，无攻击征候)\n>> 结论：判定威胁等级为 Medium (常态化巡航)。\n>> 行动：更新事件威胁等级，并生成报告。'
        });
        currentTime += 1500;

        // Step 8: 更新威胁等级动作
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: '动作: 更新威胁等级 (Update Threat Level)',
          stepType: 'tool_call',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 1000).toLocaleTimeString(),
          duration: 1000,
          input: { 
            action: 'Update_Entity', 
            target: 'TransitEvent_001', 
            updates: { 
              threat_level: 'Medium', 
              risk_factor: 'Non-Aggressive' 
            } 
          },
          output: { 
            success: true, 
            timestamp: new Date(currentTime + 1000).toLocaleTimeString()
          }
        });
        currentTime += 1000;

        // Step 9: 最终答案生成
        steps.push({
          id: `step-${++stepIndex}`,
          stepName: 'Step 5: 生成研判报告',
          stepType: 'final_answer',
          status: 'success',
          startTime: new Date(currentTime).toLocaleTimeString(),
          endTime: new Date(currentTime + 2000).toLocaleTimeString(),
          duration: 2000,
          input: {
            intelligenceData: '已关联冲绳基地 HUMINT 情报 (Report_088)',
            visualAnalysis: '主炮归零、垂发关闭、甲板无异常活动',
            threatLevel: '中等 - 常态化巡航'
          },
          output: '### 研判报告\n\n**1. 身份确认**\n* 目标 I: USS John Finn (DDG-113)\n* 目标 II: USNS Bowditch (TAGS-62)\n* 依据: 关联冲绳基地 HUMINT 情报 (Report_088)，编队构成与离港时间完全匹配。\n\n**2. 威胁评估: [中等 - 常态化巡航]**\n* 视觉征候: 经传感器图像分析，目标主炮处于归零位置 (Stowed)，垂发盖板关闭，甲板无舰载机起降作业。\n* 结论: 判定为过航执行测量任务，未发现即时攻击意图。'
        });
      }

      return steps;
    };

    // 设置 1.5秒 的 setTimeout 来模拟网络请求延迟
    setTimeout(() => {
      const response = generateResponse(message);
      const traceSteps = generateTraceSteps(message);
      
      const aiMessage = {
        role: "assistant" as const,
        content: response,
        timestamp: new Date().toLocaleTimeString(),
        traceSteps: traceSteps.length > 0 ? traceSteps : undefined,
      };
      setChatHistory((prev) => [...prev, aiMessage]);
    }, 1500);
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

  const agentName = agentData?.name || "智能体";

  return (
    <>
      {/* Left Column: Role Instructions (25%) */}
      <div className="flex h-full w-[25%] flex-col border-r border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
            <span className="text-slate-600 font-semibold text-lg">AI</span>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">{agentName}</h2>
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
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#ffedd5' }}>
                      <Network className="w-4 h-4" style={{ color: '#ea580c' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">
                        {ontology.ontology} - {ontology.objectType}
                        {ontology.property && ` - ${ontology.property}`}
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
                      {/* 只有当 content 不为空时才显示消息气泡 */}
                      {message.content.trim() && (
                        <div
                          className={`rounded-lg p-3 max-w-[80%] ${
                            message.role === "user"
                              ? "bg-slate-900 text-white ml-auto"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      )}
                      {/* 执行链路展示 */}
                      {message.role === "assistant" && message.traceSteps && message.traceSteps.length > 0 && (
                        <div className="mt-3 max-w-[80%]">
                          <div className="bg-white border-2 border-blue-200 rounded-lg p-4 shadow-sm">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                              <span>执行链路</span>
                              <span className="text-xs font-normal text-blue-600">
                                ({message.traceSteps.length} 个步骤)
                              </span>
                            </h4>
                            <TraceView steps={message.traceSteps} />
                          </div>
                        </div>
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
    </>
  );
}
