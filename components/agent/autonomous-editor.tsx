"use client";

import { useState, useEffect, isValidElement } from "react";
import {
  Send,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
  BookA,
  CircleHelp,
  Palette,
  Puzzle,
  Network,
  Workflow,
  Plus,
  SlidersHorizontal,
  X,
  FileText,
  Sparkles,
  Edit2,
  MessageSquareQuote,
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
import { MemoryConfigPanel } from "@/components/agent-editor/MemoryConfigPanel";
import { checkSensitiveContent } from "@/lib/content-filter";
import { generateSituationalTraceSteps } from "@/lib/mock/situational-trace";
import { useModelCompatibility } from "@/lib/useModelCompatibility";
import { CompatibilityIndicator } from "@/components/agent-editor/CompatibilityIndicator";
import { TraceView } from "@/components/agent/trace-view";
import type { ExecutionStep } from "@/lib/agent-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MemoryVariable } from "@/lib/types/agent";
import { cn } from "@/lib/utils";

// 定义详细数据源
interface AgentDetailData {
  type: "autonomous" | "workflow";
  name: string;
  description: string;
  avatarPresetId?: AgentAvatarPresetId;
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
    description: "实时分析海面目标的身份与威胁等级，支持本体检索和视觉特征分析。",
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
    mockReply: "我可以进行实时态势分析和威胁评估。请提供目标信息（如位置、特征等），我会：\n1. 通过本体检索关联情报对象\n2. 进行身份识别和融合\n3. 调用视觉模型分析目标状态\n4. 综合评估威胁等级并生成研判报告。",
  },
};

interface AutonomousEditorProps {
  agentId: string;
  initialAgentData?: AgentDetailData;
  onNameChange?: (name: string) => void;
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

function normalizeKnowledgeBases(input: unknown): KnowledgeBase[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as {
        id?: unknown;
        name?: unknown;
        itemCount?: unknown;
        createTime?: unknown;
        source?: unknown;
      };

      if (typeof obj.id !== "string" || typeof obj.name !== "string") return null;

      return {
        id: obj.id,
        name: obj.name,
        itemCount: typeof obj.itemCount === "number" ? obj.itemCount : 0,
        createTime: typeof obj.createTime === "string" ? obj.createTime : "",
        source: typeof obj.source === "string" ? obj.source : undefined,
      } satisfies KnowledgeBase;
    })
    .filter((x): x is KnowledgeBase => !!x);
}

function normalizeWorkflows(input: unknown): WorkflowType[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as {
        id?: unknown;
        name?: unknown;
        description?: unknown;
        updateTime?: unknown;
      };

      if (typeof obj.id !== "string" || typeof obj.name !== "string") return null;

      return {
        id: obj.id,
        name: obj.name,
        description: typeof obj.description === "string" ? obj.description : "",
        updateTime: typeof obj.updateTime === "string" ? obj.updateTime : "",
      } satisfies WorkflowType;
    })
    .filter((x): x is WorkflowType => !!x);
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

const SURFACE_CARD_CLASS =
  "overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] backdrop-blur-sm";
const ACTION_BUTTON_CLASS =
  "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100";
const EMPTY_PANEL_CLASS =
  "rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-7 text-center text-sm text-slate-500";

function buildDefaultExpandedSections(config: {
  knowledgeCount: number;
  ontologyCount: number;
  terminologyCount: number;
  workflowCount: number;
  pluginCount: number;
  mcpCount: number;
}) {
  return {
    knowledge: config.knowledgeCount > 0,
    ontology: config.ontologyCount > 0,
    terminology: config.terminologyCount > 0,
    workflow: config.workflowCount > 0,
    plugins: config.pluginCount > 0,
    mcp: config.mcpCount > 0,
  };
}

function buildOntologyCardCollapsedState(count: number) {
  return Array.from({ length: count }).reduce(
    (result, _, index) => {
      result[index] = true;
      return result;
    },
    {} as Record<number, boolean>
  );
}

const AGENT_AVATAR_PRESETS = [
  {
    id: "star-blue",
    label: "星蓝",
    shellClass: "bg-[linear-gradient(135deg,#5c6cff_0%,#7282ff_100%)]",
    cellClass: "bg-white/95",
  },
  {
    id: "deep-night",
    label: "深夜",
    shellClass: "bg-[linear-gradient(135deg,#0f172a_0%,#334155_100%)]",
    cellClass: "bg-white/92",
  },
  {
    id: "teal-wave",
    label: "海青",
    shellClass: "bg-[linear-gradient(135deg,#0891b2_0%,#2563eb_100%)]",
    cellClass: "bg-white/94",
  },
  {
    id: "sunrise",
    label: "朝橙",
    shellClass: "bg-[linear-gradient(135deg,#f59e0b_0%,#f97316_100%)]",
    cellClass: "bg-white/94",
  },
  {
    id: "pine",
    label: "松绿",
    shellClass: "bg-[linear-gradient(135deg,#059669_0%,#0f766e_100%)]",
    cellClass: "bg-white/94",
  },
] as const;

type AgentAvatarPresetId = (typeof AGENT_AVATAR_PRESETS)[number]["id"];

function getAgentAvatarPreset(presetId?: string) {
  return (
    AGENT_AVATAR_PRESETS.find((preset) => preset.id === presetId) ??
    AGENT_AVATAR_PRESETS[0]
  );
}

function AgentAvatarTile({
  presetId,
  size = "md",
  className,
}: {
  presetId?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const preset = getAgentAvatarPreset(presetId);
  const sizeClass =
    size === "sm"
      ? "h-9 w-9 rounded-2xl"
      : size === "lg"
        ? "h-20 w-20 rounded-[24px]"
        : "h-16 w-16 rounded-[22px]";
  const cellClass =
    size === "sm" ? "h-1.5 w-1.5 rounded-[4px]" : "h-3 w-3 rounded-[6px]";

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center shadow-[0_18px_40px_-24px_rgba(15,23,42,0.38)]",
        sizeClass,
        preset.shellClass,
        className
      )}
    >
      <div className={cn("grid grid-cols-2 gap-1.5", size === "sm" && "gap-1")}>
        <span className={cn(cellClass, preset.cellClass)} />
        <span className={cn(cellClass, preset.cellClass)} />
        <span className={cn(cellClass, preset.cellClass)} />
        <span className={cn(cellClass, preset.cellClass)} />
      </div>
    </div>
  );
}

function getCompatibilityStatus(status: string | undefined): "limited" | "unsupported" | "unknown" {
  if (status === "limited" || status === "unsupported") {
    return status;
  }

  return "unknown";
}

function HoverHint({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-300 opacity-35 transition-all duration-200 hover:text-slate-500 hover:opacity-100 focus-visible:text-slate-500 focus-visible:opacity-100",
            className
          )}
          aria-label={content}
        >
          <CircleHelp className="h-3 w-3 stroke-[2.1]" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={10}
        className="max-w-72 rounded-2xl border-slate-200 bg-white px-3 py-2.5 text-xs leading-6 text-slate-600 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

function formatChatTimestamp() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function AutonomousEditor({
  agentId,
  initialAgentData,
  onNameChange,
  onDirtyChange,
}: AutonomousEditorProps) {
  const agentData = initialAgentData || AGENTS_DETAIL_DATA[agentId] || null;
  const initialConfigSource = initialAgentData ?? agentData;
  const initialKnowledgeBases = normalizeKnowledgeBases((initialConfigSource as any)?.knowledgeBases);
  const initialWorkflows = normalizeWorkflows((initialConfigSource as any)?.workflows);
  const initialPlugins = normalizePlugins((initialConfigSource as any)?.plugins);
  const initialMCPs = normalizeMCPs((initialConfigSource as any)?.mcps);
  const initialOntologies = normalizeOntologies((initialConfigSource as any)?.ontologies);
  const initialTerminologies = normalizeTerminologies((initialConfigSource as any)?.terminologies);

  const [expandedSections, setExpandedSections] = useState(() =>
    buildDefaultExpandedSections({
      knowledgeCount: initialKnowledgeBases.length,
      ontologyCount: initialOntologies.length,
      terminologyCount: initialTerminologies.length,
      workflowCount: initialWorkflows.length,
      pluginCount: initialPlugins.length,
      mcpCount: initialMCPs.length,
    })
  );
  const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<
    KnowledgeBase[]
  >(() => initialKnowledgeBases);
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
  const [selectedWorkflows, setSelectedWorkflows] = useState<WorkflowType[]>(
    () => initialWorkflows
  );
  const [selectedPlugins, setSelectedPlugins] = useState<Plugin[]>(() => initialPlugins);
  const [selectedMCPs, setSelectedMCPs] = useState<MCP[]>(() => initialMCPs);
  const [workflowSelectorOpen, setWorkflowSelectorOpen] = useState(false);
  const [pluginSelectorOpen, setPluginSelectorOpen] = useState(false);
  const [mcpSelectorOpen, setMcpSelectorOpen] = useState(false);
  const [pluginSelectorKey, setPluginSelectorKey] = useState(0);
  const [mcpSelectorKey, setMcpSelectorKey] = useState(0);
  const [selectedOntologies, setSelectedOntologies] = useState<OntologyConfig[]>(
    () => initialOntologies
  );
  const [ontologyConfigOpen, setOntologyConfigOpen] = useState(false);
  const [editingOntologyIndex, setEditingOntologyIndex] = useState<number | null>(null);
  /** 每个本体卡片配置区是否收起，key 为卡片 index，默认展示摘要态 */
  const [ontologyCardCollapsed, setOntologyCardCollapsed] = useState<Record<number, boolean>>(
    () => buildOntologyCardCollapsedState(initialOntologies.length)
  );
  const [selectedTerminologies, setSelectedTerminologies] = useState<Terminology[]>(
    () => initialTerminologies
  );
  const [terminologySelectorOpen, setTerminologySelectorOpen] = useState(false);
  const [selectedAvatarPresetId, setSelectedAvatarPresetId] = useState<AgentAvatarPresetId>(
    () => (initialAgentData?.avatarPresetId ?? AGENT_AVATAR_PRESETS[0].id) as AgentAvatarPresetId
  );
  const [appName, setAppName] = useState(() => initialAgentData?.name ?? agentData?.name ?? "");
  const [appDescription, setAppDescription] = useState(
    () => initialAgentData?.description ?? agentData?.description ?? ""
  );
  const [memoryVariables, setMemoryVariables] = useState<MemoryVariable[]>([]);
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
    const configSource = initialAgentData ?? agentData;
    if (!configSource) return;

    const nextKnowledgeBases = normalizeKnowledgeBases((configSource as any).knowledgeBases);
    const nextWorkflows = normalizeWorkflows((configSource as any).workflows);
    const nextOntologies = normalizeOntologies((configSource as any).ontologies);
    const nextTerminologies = normalizeTerminologies((configSource as any).terminologies);
    const nextPlugins = normalizePlugins((configSource as any).plugins);
    const nextMCPs = normalizeMCPs((configSource as any).mcps);

    setSelectedKnowledgeBases(nextKnowledgeBases);
    setSelectedWorkflows(nextWorkflows);
    setSelectedOntologies(nextOntologies);
    setSelectedTerminologies(nextTerminologies);
    setSelectedPlugins(nextPlugins);
    setSelectedMCPs(nextMCPs);
    setOntologyCardCollapsed(buildOntologyCardCollapsedState(nextOntologies.length));
    setExpandedSections(
      buildDefaultExpandedSections({
        knowledgeCount: nextKnowledgeBases.length,
        ontologyCount: nextOntologies.length,
        terminologyCount: nextTerminologies.length,
        workflowCount: nextWorkflows.length,
        pluginCount: nextPlugins.length,
        mcpCount: nextMCPs.length,
      })
    );
  }, [initialAgentData, agentData]);

  // Task 2: 数据回显 (Hydration)
  useEffect(() => {
    if (agentData) {
      setAppName(agentData.name);
      setAppDescription(agentData.description);
      setSelectedAvatarPresetId(
        (agentData.avatarPresetId ?? AGENT_AVATAR_PRESETS[0].id) as AgentAvatarPresetId
      );
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
      setAppName("");
      setAppDescription("");
      setSelectedAvatarPresetId(AGENT_AVATAR_PRESETS[0].id);
      // 如果找不到数据，重置为默认值
      setPrompt("");
      setOpeningStatement("");
      setSuggestedQuestions([""]);
    }
  }, [agentId, agentData]);

  useEffect(() => {
    onNameChange?.(appName.trim() || "未命名智能体");
  }, [appName, onNameChange]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleAddKnowledgeBase = (kb: KnowledgeBase) => {
    if (!selectedKnowledgeBases.find((k) => k.id === kb.id)) {
      setSelectedKnowledgeBases([...selectedKnowledgeBases, kb]);
      setExpandedSections((prev) => ({ ...prev, knowledge: true }));
    }
  };

  const handleRemoveKnowledgeBase = (id: string) => {
    const nextKnowledgeBases = selectedKnowledgeBases.filter((kb) => kb.id !== id);
    setSelectedKnowledgeBases(nextKnowledgeBases);
    if (nextKnowledgeBases.length === 0) {
      setExpandedSections((prev) => ({ ...prev, knowledge: false }));
    }
  };

  const handleClearKnowledgeBases = () => {
    setSelectedKnowledgeBases([]);
    setExpandedSections((prev) => ({ ...prev, knowledge: false }));
  };

  const handleAddWorkflow = (workflow: WorkflowType) => {
    if (!selectedWorkflows.find((w) => w.id === workflow.id)) {
      setSelectedWorkflows([...selectedWorkflows, workflow]);
      setExpandedSections((prev) => ({ ...prev, workflow: true }));
    }
  };

  const handleRemoveWorkflow = (id: string) => {
    const nextWorkflows = selectedWorkflows.filter((w) => w.id !== id);
    setSelectedWorkflows(nextWorkflows);
    if (nextWorkflows.length === 0) {
      setExpandedSections((prev) => ({ ...prev, workflow: false }));
    }
  };

  const handleClearWorkflows = () => {
    setSelectedWorkflows([]);
    setExpandedSections((prev) => ({ ...prev, workflow: false }));
  };

  const handleAddPlugins = (plugins: Plugin[]) => {
    setSelectedPlugins(plugins);
    setExpandedSections((prev) => ({ ...prev, plugins: plugins.length > 0 }));
  };

  const openPluginSelector = () => {
    setPluginSelectorKey((prev) => prev + 1);
    setPluginSelectorOpen(true);
  };

  const handleRemovePlugin = (id: string) => {
    const nextPlugins = selectedPlugins.filter((p) => p.id !== id);
    setSelectedPlugins(nextPlugins);
    if (nextPlugins.length === 0) {
      setExpandedSections((prev) => ({ ...prev, plugins: false }));
    }
  };

  const handleClearPlugins = () => {
    setSelectedPlugins([]);
    setExpandedSections((prev) => ({ ...prev, plugins: false }));
  };

  const handleAddMCPs = (mcps: MCP[]) => {
    setSelectedMCPs(mcps);
    setExpandedSections((prev) => ({ ...prev, mcp: mcps.length > 0 }));
  };

  const openMcpSelector = () => {
    setMcpSelectorKey((prev) => prev + 1);
    setMcpSelectorOpen(true);
  };

  const handleRemoveMCP = (id: string) => {
    const nextMCPs = selectedMCPs.filter((m) => m.id !== id);
    setSelectedMCPs(nextMCPs);
    if (nextMCPs.length === 0) {
      setExpandedSections((prev) => ({ ...prev, mcp: false }));
    }
  };

  const handleClearMCPs = () => {
    setSelectedMCPs([]);
    setExpandedSections((prev) => ({ ...prev, mcp: false }));
  };

  const handleAddOntology = (config: OntologyConfig) => {
    if (editingOntologyIndex !== null) {
      // 更新现有本体配置
      const updated = [...selectedOntologies];
      updated[editingOntologyIndex] = config;
      setSelectedOntologies(updated);
      setOntologyCardCollapsed(buildOntologyCardCollapsedState(updated.length));
      setEditingOntologyIndex(null);
    } else {
      // 添加新本体配置
      const nextOntologies = [...selectedOntologies, config];
      setSelectedOntologies(nextOntologies);
      setOntologyCardCollapsed(buildOntologyCardCollapsedState(nextOntologies.length));
    }
    setExpandedSections((prev) => ({ ...prev, ontology: true }));
  };

  const handleRemoveOntology = (index: number) => {
    const nextOntologies = selectedOntologies.filter((_, i) => i !== index);
    setSelectedOntologies(nextOntologies);
    setOntologyCardCollapsed(buildOntologyCardCollapsedState(nextOntologies.length));
    if (nextOntologies.length === 0) {
      setExpandedSections((prev) => ({ ...prev, ontology: false }));
    }
  };

  const handleClearOntologies = () => {
    setSelectedOntologies([]);
    setOntologyCardCollapsed({});
    setExpandedSections((prev) => ({ ...prev, ontology: false }));
  };

  const handleEditOntology = (index: number) => {
    setEditingOntologyIndex(index);
    setOntologyConfigOpen(true);
  };

  const handleAddTerminology = (terminology: Terminology) => {
    if (!selectedTerminologies.find((t) => t.id === terminology.id)) {
      setSelectedTerminologies([...selectedTerminologies, terminology]);
      setExpandedSections((prev) => ({ ...prev, terminology: true }));
    }
  };

  const handleRemoveTerminology = (id: string) => {
    const nextTerminologies = selectedTerminologies.filter((t) => t.id !== id);
    setSelectedTerminologies(nextTerminologies);
    if (nextTerminologies.length === 0) {
      setExpandedSections((prev) => ({ ...prev, terminology: false }));
    }
  };

  const handleClearTerminologies = () => {
    setSelectedTerminologies([]);
    setExpandedSections((prev) => ({ ...prev, terminology: false }));
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
      timestamp: formatChatTimestamp(),
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
          timestamp: formatChatTimestamp(),
        };
        setChatHistory((prev) => [...prev, aiMessage]);
      }, 500);
      return;
    }

    // 生成智能回复和执行链路（基于用户消息和智能体配置）
    const generateResponse = (userMsg: string): string => {
      const msg = userMsg.toLowerCase();

      // ========== 优先级最高：态势感知相关 ==========
      if (
        msg.includes("态势") ||
        msg.includes("威胁") ||
        msg.includes("身份") ||
        msg.includes("评估") ||
        msg.includes("分析") ||
        msg.includes("海面") ||
        msg.includes("目标")
      ) {
        return "";
      }

      return agentData?.mockReply || "您好，有什么可以帮您？";
    };

    const generateTraceSteps = (userMsg: string): ExecutionStep[] => {
      const situational = generateSituationalTraceSteps(userMsg);
      if (situational.length > 0) return situational;
      return [];
    };

    // 设置 1.5秒 的 setTimeout 来模拟网络请求延迟
    setTimeout(() => {
      const response = generateResponse(message);
      const traceSteps = generateTraceSteps(message);
      
      const aiMessage = {
        role: "assistant" as const,
        content: response,
        timestamp: formatChatTimestamp(),
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
          timestamp: formatChatTimestamp(),
        },
      ]);
      setShowSuggestedChips(true);
    } else {
      setChatHistory([]);
      setShowSuggestedChips(true);
    }
  }, [openingStatement]);

  const agentName = appName.trim() || "未命名智能体";

  return (
    <TooltipProvider delayDuration={120}>
      <div className="grid h-full min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden bg-[linear-gradient(180deg,#fbfcfe_0%,#f6f8fc_45%,#eef4ff_100%)] xl:grid-cols-[minmax(280px,0.72fr)_minmax(500px,1fr)_minmax(430px,1.18fr)] 2xl:grid-cols-[minmax(300px,0.68fr)_minmax(560px,1fr)_minmax(520px,1.26fr)]">
        <div className="min-h-0 border-b border-slate-200/80 bg-white/55 backdrop-blur xl:border-b-0 xl:border-r">
          <div className="flex h-full min-h-[30rem] flex-col gap-5 p-5 xl:p-6">
            <div className="rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#f4f8ff_52%,#eef4ff_100%)] p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)]">
              <div className="flex items-start gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="group relative shrink-0"
                      aria-label="选择智能体头像"
                    >
                      <AgentAvatarTile presetId={selectedAvatarPresetId} size="lg" />
                      <span className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white bg-slate-900 text-white shadow-lg transition-transform group-hover:scale-105">
                        <Palette className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={12}
                    className="w-72 rounded-[24px] border-slate-200 bg-white p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">选择头像样式</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">
                        选择一种展示风格，实时同步到当前智能体信息卡和预览区。
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-5 gap-3">
                      {AGENT_AVATAR_PRESETS.map((preset) => {
                        const isSelected = preset.id === selectedAvatarPresetId;

                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setSelectedAvatarPresetId(preset.id)}
                            className={cn(
                              "flex flex-col items-center gap-2 rounded-[18px] border px-2 py-2 transition-colors",
                              isSelected
                                ? "border-slate-900 bg-slate-50"
                                : "border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            <div className="relative">
                              <AgentAvatarTile presetId={preset.id} size="md" />
                              {isSelected && (
                                <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white">
                                  <Check className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-600">{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="min-w-0 flex-1 space-y-3">
                    <div className="relative">
                      <Input
                        value={appName}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 50) {
                            setAppName(value);
                          }
                        }}
                        placeholder="智能体应用名称"
                        className="h-12 rounded-[18px] border-slate-200 bg-white/85 pr-14 text-sm shadow-inner"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        {appName.length}/50
                      </div>
                    </div>
                    <div className="relative">
                      <Textarea
                        value={appDescription}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 100) {
                            setAppDescription(value);
                          }
                        }}
                        placeholder="智能体应用描述"
                        className="min-h-[84px] rounded-[18px] border-slate-200 bg-white/85 pr-14 text-sm leading-6 shadow-inner"
                      />
                      <div className="absolute bottom-4 right-4 text-xs text-slate-400">
                        {appDescription.length}/100
                      </div>
                    </div>
                </div>
              </div>
            </div>

            <div className={`${SURFACE_CARD_CLASS} flex flex-1 flex-col`}>
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="group flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-950">角色指令</h3>
                    <HoverHint
                      content="这里定义智能体的身份、目标、边界与输出风格。"
                      className="group-hover:opacity-65 group-focus-within:opacity-65"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="请输入智能体的角色指令和系统提示词..."
                  className="min-h-[320px] flex-1 resize-none rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-4 text-sm leading-7 text-slate-700 shadow-inner outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 placeholder:text-slate-400"
                />
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  右侧预览会基于当前提示词、开场白和推荐问同步生成测试效果。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 overflow-hidden border-b border-slate-200/80 bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8fbff_42%,#f3f6fb_100%)] xl:border-b-0 xl:border-r">
          <div className="h-full min-h-0 overflow-y-auto overscroll-contain px-5 py-5 xl:px-6 xl:py-6">
            <div className="space-y-8">
              <div className="rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="group flex items-center gap-2">
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                        能力编排
                      </h2>
                      <HoverHint
                        content="统一配置模型、知识、工具、记忆与对话，形成完整智能体能力面板。"
                        className="group-hover:opacity-65 group-focus-within:opacity-65"
                      />
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-slate-200/80 bg-slate-50/90 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      模型
                    </p>
                    <ModelSelector
                      selectedModel={selectedModel}
                      modelParams={modelParams}
                      onModelChange={setSelectedModel}
                      onParamsChange={setModelParams}
                      triggerClassName="h-11 min-w-[16rem] justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm hover:bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              <section className="space-y-4">
                <div>
                  <div className="group flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-950">知识</h3>
                    <HoverHint
                      content="配置检索来源、本体对象与术语语境，让智能体回答更有依据。"
                      className="group-hover:opacity-65 group-focus-within:opacity-65"
                    />
                  </div>
                </div>

                <div className={SURFACE_CARD_CLASS}>
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <button
                      onClick={() => toggleSection("knowledge")}
                      className="flex flex-1 items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="inline-flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-950">知识库</span>
                            <CompatibilityIndicator
                              status={getCompatibilityStatus(compatibility.items.knowledge_base.status)}
                              shortLabel={compatibility.items.knowledge_base.shortLabel}
                              tooltip={compatibility.items.knowledge_base.tooltip}
                            />
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            接入可检索文档与资料，为回答提供稳定依据。
                          </p>
                        </div>
                      </div>
                      {expandedSections.knowledge ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    <div className="ml-3 flex items-center gap-2">
                      {selectedKnowledgeBases.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearKnowledgeBases();
                          }}
                          className="inline-flex h-9 items-center justify-center rounded-2xl px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600"
                          title="取消挂载全部知识库"
                        >
                          取消挂载
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRetrievalSettingsOpen(true);
                        }}
                        className={ACTION_BUTTON_CLASS}
                        title="检索配置"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setKbSelectorOpen(true);
                        }}
                        className={ACTION_BUTTON_CLASS}
                        title="添加知识库"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {expandedSections.knowledge && (
                    <div className="space-y-3 px-5 pb-5 pt-4">
                      {selectedKnowledgeBases.length === 0 ? (
                        <div className={EMPTY_PANEL_CLASS}>暂无知识库，点击右上角添加</div>
                      ) : (
                        selectedKnowledgeBases.map((kb) => (
                          <div
                            key={kb.id}
                            className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-[linear-gradient(135deg,#fbfdff_0%,#f8fafc_100%)] p-4"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium text-slate-900">
                                  {kb.name}
                                </span>
                                {kb.source && (
                                  <span className="truncate text-xs text-slate-500">
                                    ({kb.source.split("/").pop()})
                                  </span>
                                )}
                              </div>
                              {kb.itemCount > 0 && (
                                <p className="mt-1 text-xs text-slate-500">
                                  已关联 {kb.itemCount} 个文档
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveKnowledgeBase(kb.id)}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-200"
                              title="取消挂载"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className={SURFACE_CARD_CLASS}>
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <button
                      onClick={() => toggleSection("ontology")}
                      className="flex flex-1 items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-100">
                          <Network className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="inline-flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-950">本体</span>
                            <CompatibilityIndicator
                              status={getCompatibilityStatus(compatibility.items.ontology.status)}
                              shortLabel={compatibility.items.ontology.shortLabel}
                              tooltip={compatibility.items.ontology.tooltip}
                            />
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            为智能体建立对象类型、检索字段与注入策略。
                          </p>
                        </div>
                      </div>
                      {expandedSections.ontology ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      {selectedOntologies.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearOntologies();
                          }}
                          className="inline-flex h-9 items-center justify-center rounded-2xl px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600"
                          title="取消挂载全部本体"
                        >
                          取消挂载
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingOntologyIndex(null);
                          setOntologyConfigOpen(true);
                        }}
                        className={ACTION_BUTTON_CLASS}
                        title="添加本体"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {expandedSections.ontology && (
                    <div className="space-y-3 px-5 pb-5 pt-4">
                      {selectedOntologies.length === 0 ? (
                        <div className={EMPTY_PANEL_CLASS}>暂无本体，点击右上角添加</div>
                      ) : (
                        selectedOntologies.map((ontology, index) => {
                          const getObjectTypeIcon = (objectType: string) => {
                            if (objectType.includes("历史") || objectType.includes("战例")) {
                              return BookOpen;
                            }
                            return Network;
                          };

                          const getRetrievalMethodLabel = (
                            method: "structured" | "semantic" | undefined
                          ) => {
                            if (method === "structured") {
                              return "精准检索";
                            }
                            if (method === "semantic") {
                              return "语义检索";
                            }
                            return "未设置";
                          };

                          const Icon = getObjectTypeIcon(ontology.objectType);
                          const isCardExpanded = !ontologyCardCollapsed[index];

                          return (
                            <div
                              key={index}
                              className="overflow-hidden rounded-[20px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)]"
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOntologyCardCollapsed((prev) => ({
                                        ...prev,
                                        [index]: !prev[index],
                                      }))
                                    }
                                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                    aria-label={isCardExpanded ? "收起配置" : "展开配置"}
                                  >
                                    {isCardExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronUp className="h-4 w-4" />
                                    )}
                                  </button>
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
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
                                  className="h-9 w-9 shrink-0 rounded-2xl p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                  title="编辑配置"
                                  aria-label="编辑配置"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              {isCardExpanded && (
                                <>
                                  <div className="space-y-3 px-4 py-4">
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={
                                          ontology.retrievalMethod === "semantic"
                                            ? "default"
                                            : "secondary"
                                        }
                                        className="text-xs"
                                      >
                                        {getRetrievalMethodLabel(ontology.retrievalMethod)}
                                      </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                                        <span className="text-slate-500">召回数:</span>
                                        <span className="ml-1 font-medium text-slate-900">
                                          {ontology.topK ?? 20}
                                        </span>
                                      </div>
                                      {ontology.retrievalMethod === "semantic" && (
                                        <div className="rounded-2xl bg-slate-50 px-3 py-2">
                                          <span className="text-slate-500">语义权重:</span>
                                          <span className="ml-1 font-medium text-slate-900">
                                            {((ontology.semanticWeight ?? 0.6) * 100).toFixed(0)}%
                                          </span>
                                        </div>
                                      )}
                                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                                        <span className="text-slate-500">阈值:</span>
                                        <span className="ml-1 font-medium text-slate-900">
                                          {((ontology.threshold ?? 0.6) * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                      {ontology.property && (
                                        <div className="rounded-2xl bg-slate-50 px-3 py-2">
                                          <span className="text-slate-500">检索字段:</span>
                                          <span className="ml-1 font-medium text-slate-900">
                                            {ontology.property}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex justify-end px-4 pb-4">
                                    <button
                                      onClick={() => handleRemoveOntology(index)}
                                      className="text-xs text-slate-500 transition-colors hover:text-red-600"
                                      title="取消挂载"
                                    >
                                      取消挂载
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div className={SURFACE_CARD_CLASS}>
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <button
                      onClick={() => toggleSection("terminology")}
                      className="flex flex-1 items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100">
                          <BookA className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="inline-flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-950">术语库</span>
                            <CompatibilityIndicator
                              status={getCompatibilityStatus(compatibility.items.terminology.status)}
                              shortLabel={compatibility.items.terminology.shortLabel}
                              tooltip={compatibility.items.terminology.tooltip}
                            />
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            统一行业术语与表达语境，减少回答歧义。
                          </p>
                        </div>
                      </div>
                      {expandedSections.terminology ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      {selectedTerminologies.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearTerminologies();
                          }}
                          className="inline-flex h-9 items-center justify-center rounded-2xl px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600"
                          title="取消挂载全部术语库"
                        >
                          取消挂载
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTerminologySelectorOpen(true);
                        }}
                        className={ACTION_BUTTON_CLASS}
                        title="添加术语库"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {expandedSections.terminology && (
                    <div className="space-y-3 px-5 pb-5 pt-4">
                      {selectedTerminologies.length === 0 ? (
                        <div className={EMPTY_PANEL_CLASS}>暂无术语库，点击右上角添加</div>
                      ) : (
                        selectedTerminologies.map((term) => (
                          <div
                            key={term.id}
                            className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-[linear-gradient(135deg,#fbfdff_0%,#f8fafc_100%)] p-4"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium text-slate-900">{term.name}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveTerminology(term.id)}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-200"
                              title="取消挂载"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">工具</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    连接工作流、插件与MCP，让智能体具备执行与外部调用能力。
                  </p>
                </div>

                <div className={SURFACE_CARD_CLASS}>
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <button
                      onClick={() => toggleSection("workflow")}
                      className="flex flex-1 items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                          <Workflow className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="inline-flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-950">工作流</span>
                            <CompatibilityIndicator
                              status={getCompatibilityStatus(compatibility.items.workflow.status)}
                              shortLabel={compatibility.items.workflow.shortLabel}
                              tooltip={compatibility.items.workflow.tooltip}
                            />
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            编排可复用流程，承接稳定而复杂的业务步骤。
                          </p>
                        </div>
                      </div>
                      {expandedSections.workflow ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      {selectedWorkflows.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearWorkflows();
                          }}
                          className="inline-flex h-9 items-center justify-center rounded-2xl px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600"
                          title="取消挂载全部工作流"
                        >
                          取消挂载
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setWorkflowSelectorOpen(true);
                        }}
                        className={ACTION_BUTTON_CLASS}
                        title="添加工作流"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {expandedSections.workflow && (
                    <div className="px-5 pb-5 pt-4">
                      {selectedWorkflows.length === 0 ? (
                        <div className="space-y-3">
                          <div className={EMPTY_PANEL_CLASS}>
                            智能体可以调用编排并发布的工作流以实现复杂、稳定的业务流程。
                          </div>
                          <button
                            onClick={() => setWorkflowSelectorOpen(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            <Plus className="h-4 w-4" />
                            添加
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedWorkflows.map((workflow) => (
                            <div
                              key={workflow.id}
                              className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-[linear-gradient(135deg,#fbfdff_0%,#f8fafc_100%)] p-4"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                <Workflow className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-slate-900">
                                  {workflow.name}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {workflow.description}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveWorkflow(workflow.id)}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-200"
                                title="取消挂载"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={SURFACE_CARD_CLASS}>
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <button
                      onClick={() => toggleSection("plugins")}
                      className="flex flex-1 items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100">
                          <Puzzle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="inline-flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-950">插件</span>
                            <CompatibilityIndicator
                              status={getCompatibilityStatus(compatibility.items.plugins.status)}
                              shortLabel={compatibility.items.plugins.shortLabel}
                              tooltip={compatibility.items.plugins.tooltip}
                            />
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            挂载外部能力，支持 API 调用与功能扩展。
                          </p>
                        </div>
                      </div>
                      {expandedSections.plugins ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      {selectedPlugins.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearPlugins();
                          }}
                          className="inline-flex h-9 items-center justify-center rounded-2xl px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600"
                          title="取消挂载全部插件"
                        >
                          取消挂载
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPluginSelector();
                        }}
                        className={ACTION_BUTTON_CLASS}
                        title="添加插件"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {expandedSections.plugins && (
                    <div className="px-5 pb-5 pt-4">
                      {selectedPlugins.length === 0 ? (
                        <div className="space-y-3">
                          <div className={EMPTY_PANEL_CLASS}>
                            智能体可以通过插件主动调用 OpenAPI，例如信息查询、数据存储等。
                          </div>
                          <button
                            onClick={openPluginSelector}
                            className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            <Plus className="h-4 w-4" />
                            添加
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedPlugins.map((plugin) => (
                            <div
                              key={plugin.id}
                              className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-[linear-gradient(135deg,#fbfdff_0%,#f8fafc_100%)] p-4"
                            >
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${plugin.color}`}
                              >
                                {plugin.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-slate-900">
                                  {plugin.name}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {plugin.description}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemovePlugin(plugin.id)}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-200"
                                title="取消挂载"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={SURFACE_CARD_CLASS}>
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <button
                      onClick={() => toggleSection("mcp")}
                      className="flex flex-1 items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                          <Puzzle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="inline-flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-950">MCP</span>
                            <CompatibilityIndicator
                              status={getCompatibilityStatus(compatibility.items.mcp.status)}
                              shortLabel={compatibility.items.mcp.shortLabel}
                              tooltip={compatibility.items.mcp.tooltip}
                            />
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            通过 MCP 接入多种工具与操作能力。
                          </p>
                        </div>
                      </div>
                      {expandedSections.mcp ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      {selectedMCPs.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearMCPs();
                          }}
                          className="inline-flex h-9 items-center justify-center rounded-2xl px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600"
                          title="取消挂载全部MCP"
                        >
                          取消挂载
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMcpSelector();
                        }}
                        className={ACTION_BUTTON_CLASS}
                        title="添加MCP"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {expandedSections.mcp && (
                    <div className="px-5 pb-5 pt-4">
                      {selectedMCPs.length === 0 ? (
                        <div className="space-y-3">
                          <div className={EMPTY_PANEL_CLASS}>
                            智能体可以通过 MCP 连接和调用多个工具。
                          </div>
                          <button
                            onClick={openMcpSelector}
                            className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            <Plus className="h-4 w-4" />
                            添加
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedMCPs.map((mcp) => (
                            <div
                              key={mcp.id}
                              className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-[linear-gradient(135deg,#fbfdff_0%,#f8fafc_100%)] p-4"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                {mcp.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-slate-900">{mcp.name}</div>
                                <div className="mt-1 text-xs text-slate-500">{mcp.description}</div>
                              </div>
                              <button
                                onClick={() => handleRemoveMCP(mcp.id)}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-200"
                                title="取消挂载"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">记忆</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    记忆变量属于记忆板块，用于持续记录用户长期信息与个性化偏好。
                  </p>
                </div>
                <MemoryConfigPanel
                  variables={memoryVariables}
                  onVariablesChange={setMemoryVariables}
                  selectedModel={selectedModel}
                />
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">对话</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    控制用户首次进入时的感受，以及可快速触发的测试问题。
                  </p>
                </div>

                <div className={SURFACE_CARD_CLASS}>
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-100">
                        <MessageSquareQuote className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-950">开场白</span>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          配置首次打开对话时智能体的欢迎话术。
                        </p>
                      </div>
                    </div>
                    <button
                      className={ACTION_BUTTON_CLASS}
                      title="智能优化"
                    >
                      <Sparkles className="h-4 w-4 text-violet-600" />
                    </button>
                  </div>
                  <div className="relative p-5">
                    <textarea
                      value={openingStatement}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 150) {
                          setOpeningStatement(value);
                        }
                      }}
                      placeholder="请输入开场白"
                      className="min-h-[136px] w-full resize-none rounded-[20px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-4 text-sm leading-7 text-slate-700 shadow-inner outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 placeholder:text-slate-400"
                    />
                    <div className="absolute bottom-9 right-9 text-xs text-slate-400">
                      {openingStatement.length}/150
                    </div>
                  </div>
                </div>

                <div className={SURFACE_CARD_CLASS}>
                  <div className="border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-950">推荐问</span>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          预设几个高频提问，便于用户快速体验当前智能体能力。
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 p-5">
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
                          className="w-full rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] px-4 py-3 pr-20 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 placeholder:text-slate-400"
                        />
                        <div className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          {question.length}/50
                        </div>
                        {suggestedQuestions.length > 1 && (
                          <button
                            onClick={() => handleRemoveSuggestedQuestion(index)}
                            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100"
                            title="删除"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddSuggestedQuestion}
                      className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      <Plus className="h-4 w-4" />
                      添加推荐问
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="min-h-0 overflow-hidden bg-[linear-gradient(180deg,#f6f8fc_0%,#f3f7ff_52%,#eef3fb_100%)]">
          <div className="flex h-full min-h-0 flex-col overflow-hidden p-5 xl:min-h-[30rem] xl:p-6">
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
              <div className="border-b border-slate-100/80 px-5 py-4">
                <div className="group flex items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                    预览与调试
                  </h2>
                  <HoverHint
                    content="实时测试智能体的响应效果，检查提示词、知识与工具配置是否协同生效。"
                    className="group-hover:opacity-65 group-focus-within:opacity-65"
                  />
                </div>
              </div>

              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="pointer-events-none absolute inset-x-12 top-8 h-40 rounded-full bg-[radial-gradient(circle,_rgba(96,165,250,0.14)_0%,_rgba(255,255,255,0)_72%)] blur-3xl" />
                <div className="relative flex min-h-0 flex-1 flex-col">
                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
                    {chatHistory.length === 0 && openingStatement.trim() === "" ? (
                      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                        <AgentAvatarTile presetId={selectedAvatarPresetId} size="lg" className="h-20 w-20 rounded-[28px]" />
                        <h3 className="mt-6 text-[30px] font-semibold tracking-tight text-slate-950">
                          你好，我是{agentName}
                        </h3>
                        <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                          {appDescription.trim() || "输入消息即可实时测试当前智能体配置，开场白与推荐问会自动联动到这里。"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {chatHistory.map((message, index) => (
                          <div
                            key={index}
                            className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                          >
                            {message.role === "assistant" && (
                              <AgentAvatarTile presetId={selectedAvatarPresetId} size="sm" />
                            )}
                            <div
                              className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}
                            >
                              <div className={message.role === "user" ? "max-w-[88%]" : "w-full"}>
                                {message.content.trim() && (
                                  <div
                                    className={`rounded-[22px] px-4 py-3 ${
                                      message.role === "user"
                                        ? "ml-auto bg-slate-900 text-white shadow-[0_18px_40px_-26px_rgba(15,23,42,0.8)]"
                                        : "w-fit max-w-[90%] border border-slate-200 bg-white text-slate-700 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.3)]"
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap text-sm leading-7">
                                      {message.content}
                                    </p>
                                  </div>
                                )}
                                {message.role === "assistant" &&
                                  message.traceSteps &&
                                  message.traceSteps.length > 0 && (
                                    <div className="mt-3">
                                      <div className="rounded-[22px] border border-blue-100 bg-white p-4 shadow-[0_18px_40px_-32px_rgba(59,130,246,0.35)]">
                                        <h4 className="mb-3 text-sm font-semibold text-slate-900">
                                          执行链路
                                        </h4>
                                        <TraceView steps={message.traceSteps} />
                                      </div>
                                    </div>
                                  )}
                                <p
                                  className={`mt-2 text-xs text-slate-400 ${
                                    message.role === "user" ? "text-right" : "pl-1"
                                  }`}
                                >
                                  {message.timestamp}
                                </p>
                              </div>
                            </div>
                            {message.role === "user" && (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-700">
                                我
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100/80 bg-white/55 px-5 py-4 backdrop-blur-sm">
                    {showSuggestedChips &&
                      suggestedQuestions.filter((q) => q.trim()).length > 0 &&
                      chatHistory.length <= 1 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {suggestedQuestions
                            .filter((q) => q.trim())
                            .map((question, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestedQuestionClick(question)}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
                              >
                                {question}
                              </button>
                            ))}
                        </div>
                      )}
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="输入消息..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSendMessage(e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                        className="flex-1 rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 placeholder:text-slate-400"
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget
                            .previousElementSibling as HTMLInputElement;
                          handleSendMessage(input.value);
                          input.value = "";
                        }}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-900 text-white shadow-[0_18px_40px_-26px_rgba(15,23,42,0.8)] transition-colors hover:bg-slate-800"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="mt-3 text-center text-xs text-slate-400">
                      内容由智能生成，仅供参考
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
        key={`plugin-selector-${pluginSelectorKey}`}
        open={pluginSelectorOpen}
        onOpenChange={setPluginSelectorOpen}
        onSelect={handleAddPlugins}
        selectedPlugins={selectedPlugins}
      />

      {/* MCP Selector Dialog */}
      <MCPSelector
        key={`mcp-selector-${mcpSelectorKey}`}
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
    </TooltipProvider>
  );
}
