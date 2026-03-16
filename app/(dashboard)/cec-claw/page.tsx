"use client";

import { type ComponentType, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bot,
  Brain,
  ChevronRight,
  Download,
  Edit3,
  FileText,
  Plus,
  Puzzle,
  Save,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { MCPSelector, type MCP } from "@/components/agent-editor/MCPSelector";
import { ModelSelector } from "@/components/agent-editor/ModelSelector";
import { PluginSelector, type Plugin } from "@/components/agent-editor/PluginSelector";
import { SkillMarketplacePickerDialog } from "@/components/skills/skill-marketplace-picker-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { type SkillMarketplaceItem } from "@/lib/mock/skill-marketplace";
import { cn } from "@/lib/utils";

interface SkillConfig {
  id: string;
  marketplaceId?: string;
  name: string;
  description: string;
  configuredAt: string;
  version: string;
  trigger: string;
  enabled: boolean;
}

interface SubAgentConfig {
  id: string;
  name: string;
  responsibility: string;
  trigger: string;
  model: string;
  enabled: boolean;
}

interface ScheduledTaskConfig {
  id: string;
  name: string;
  schedule: string;
  runContext: string;
  delivery: string;
  notes: string;
  enabled: boolean;
}

type ConfigEditorKey = "identity" | "soul" | "user" | "tools" | "memory" | "heartbeat" | null;

const MODEL_OPTIONS = [
  { value: "Qwen3-32B", label: "Qwen3-32B" },
  { value: "Qwen3-8B", label: "Qwen3-8B" },
  { value: "DeepSeek-R1", label: "DeepSeek-R1" },
  { value: "DeepSeek-VL2", label: "DeepSeek-VL2" },
  { value: "微调多模态感知大模型", label: "微调多模态感知大模型" },
];

const initialSkills: SkillConfig[] = [
  {
    id: "skill-outing-report",
    name: "外出报备",
    description: "生成外出申请、补充事由和时间安排，串联报备、审批与回执说明。",
    configuredAt: "2026-03-17 09:20",
    version: "v1.6.0",
    trigger: "当请求涉及外出、出差、拜访客户、现场支持或离岗报备时触发。",
    enabled: true,
  },
  {
    id: "skill-product-analysis",
    name: "产品数据分析",
    description: "围绕活跃、转化、留存、需求反馈和版本效果输出结构化分析结论。",
    configuredAt: "2026-03-16 21:45",
    version: "v2.1.3",
    trigger: "当问题涉及产品指标、运营数据、漏斗转化、版本复盘或实验效果评估时触发。",
    enabled: true,
  },
  {
    id: "skill-crm-sales",
    name: "CRM销售管理",
    description: "整理客户跟进记录、商机推进状态和回款风险，输出销售管理建议。",
    configuredAt: "2026-03-15 18:10",
    version: "v1.8.4",
    trigger: "当问题涉及客户线索、商机阶段、销售漏斗、回款进度或拜访纪要时触发。",
    enabled: true,
  },
];

const initialSubAgents: SubAgentConfig[] = [
  {
    id: "subagent-weekly-report",
    name: "产品周报Agent",
    responsibility: "汇总需求进展、版本节奏、风险事项和里程碑，生成适合周会和汇报的周报内容。",
    trigger: "当需要整理周报、阶段汇报、项目复盘或输出进展摘要时触发。",
    model: "Qwen3-32B",
    enabled: true,
  },
  {
    id: "subagent-reimbursement",
    name: "报销付款Agent",
    responsibility: "检查报销单、付款节点与凭证完整性，输出付款说明、缺失材料和跟进建议。",
    trigger: "当请求涉及报销申请、付款进度、借款冲销或凭证核对时触发。",
    model: "DeepSeek-R1",
    enabled: true,
  },
  {
    id: "subagent-attendance",
    name: "考勤休假提单Agent",
    responsibility: "处理请假、补卡、加班、出差等考勤事项，给出提单路径和填写建议。",
    trigger: "当问题涉及请假、补卡、加班、出差审批或考勤异常时触发。",
    model: "Qwen3-8B",
    enabled: true,
  },
  {
    id: "subagent-schedule",
    name: "日程安排Agent",
    responsibility: "根据会议、待办、出差和优先级整理日程，生成时间安排与冲突处理建议。",
    trigger: "当需要排期、改期、协调会议或处理时间冲突时触发。",
    model: "Qwen3-32B",
    enabled: true,
  },
];

const initialPlugins: Plugin[] = [
  {
    id: "plugin-1",
    name: "文档解析",
    description: "解析各种格式的文档内容",
    icon: <FileText className="w-5 h-5" />,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "my-plugin-1",
    name: "自定义插件1",
    description: "用户自定义的插件",
    icon: <Puzzle className="w-5 h-5" />,
    color: "bg-slate-100 text-slate-600",
  },
];

const initialMCPs: MCP[] = [
  {
    id: "mcp-1",
    name: "百度AI搜索",
    description: "通过百度AI搜索获取实时信息",
    icon: <Brain className="w-5 h-5 text-sky-600" />,
  },
];

function truncateText(value: string, maxLength = 88) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

function formatConfiguredAt() {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return `${date} ${time}`;
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            {label}
          </div>
          <div className="mt-1 truncate text-lg font-semibold text-slate-950">{value}</div>
        </div>
      </div>
      <div className="mt-3 text-sm text-slate-600">{caption}</div>
    </div>
  );
}

function BasePreviewCard({
  title,
  hint,
  preview,
  onEdit,
  children,
}: {
  title: string;
  hint: string;
  preview: string;
  onEdit: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-xs text-slate-500">{hint}</div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="absolute top-3 right-3 h-6 px-2 text-[11px] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          onClick={onEdit}
        >
          <Edit3 className="h-3.5 w-3.5" />
          编辑
        </Button>
      </div>
      {children ? (
        <div className="mt-3">{children}</div>
      ) : (
        <div className="mt-3 text-sm leading-6 text-slate-700">{preview}</div>
      )}
    </div>
  );
}

export default function CECClawPage() {
  const [identityName, setIdentityName] = useState("个人全能助理虾");
  const [identityCreature, setIdentityCreature] = useState("云端助手");
  const [identityVibe, setIdentityVibe] = useState("冷静、可靠、略带锋利感");
  const [identityEmoji, setIdentityEmoji] = useState("🪶");
  const [identityAvatar, setIdentityAvatar] = useState("资源/头像/个人全能助理虾.png");

  const [soulCoreTruths, setSoulCoreTruths] = useState(
    "优先帮我把事情做完，而不是停留在解释层；能自行查证的就先查证，再给我结果；对外动作保持谨慎，对内整理和分析可以大胆推进。"
  );
  const [soulBoundaries, setSoulBoundaries] = useState(
    "未经确认不要代我对外发送内容，不要越权修改敏感配置，不要把猜测伪装成事实。"
  );
  const [userNotes, setUserNotes] = useState(
    "用户更偏好直接、克制但高密度的信息表达；常在产品设计、智能体工作流和代码实现之间切换。"
  );
  const [toolsNotes, setToolsNotes] = useState(
    "优先使用已授权的 MCP；文档、图片和代码类任务可以直接调用插件；对个人工作区路径和私有知识库做严格隔离。"
  );
  const [memoryLongTerm, setMemoryLongTerm] = useState(
    "长期记录稳定偏好、重要决策、持续有效的上下文，以及未来仍需要记住的经验教训。"
  );
  const [memoryDaily, setMemoryDaily] = useState(
    "每天按日期追加工作记录、临时上下文和发生过的事情；会话启动时优先读取今天与昨天的内容。"
  );
  const [heartbeatPrompt, setHeartbeatPrompt] = useState(
    "定时检查待办、未完成的实验任务和知识库同步状态；如果没有异常，仅记录“心跳正常”。"
  );

  const [primaryModel, setPrimaryModel] = useState("Qwen3-32B");
  const [fallbackModels, setFallbackModels] = useState<string[]>([
    "Qwen3-8B",
    "DeepSeek-R1",
  ]);
  const [skills, setSkills] = useState(initialSkills);
  const [subAgents, setSubAgents] = useState(initialSubAgents);
  const [selectedPlugins, setSelectedPlugins] = useState<Plugin[]>(initialPlugins);
  const [selectedMCPs, setSelectedMCPs] = useState<MCP[]>(initialMCPs);
  const [pluginSelectorOpen, setPluginSelectorOpen] = useState(false);
  const [mcpSelectorOpen, setMcpSelectorOpen] = useState(false);
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);
  const [activeConfigEditor, setActiveConfigEditor] = useState<ConfigEditorKey>(null);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTaskConfig[]>([
    {
      id: "calendar-check",
      name: "早间日历巡检",
      schedule: "工作日 09:00",
      runContext: "主会话",
      delivery: "直接提醒",
      notes: "检查当天会议、冲突和 2 小时内的临近事项。",
      enabled: true,
    },
    {
      id: "memory-review",
      name: "记忆整理",
      schedule: "每两天 20:30",
      runContext: "隔离执行",
      delivery: "仅写入工作区",
      notes: "回顾最近的每日记忆，把值得长期保留的内容整理进长期记忆。",
      enabled: true,
    },
    {
      id: "weekly-summary",
      name: "周报草稿",
      schedule: "每周五 18:00",
      runContext: "隔离执行",
      delivery: "生成摘要",
      notes: "从近期任务、记忆和知识库中汇总一版周报草稿。",
      enabled: false,
    },
  ]);

  const enabledSkillCount = useMemo(
    () => skills.filter((skill) => skill.enabled).length,
    [skills]
  );
  const enabledSubAgentCount = useMemo(
    () => subAgents.filter((agent) => agent.enabled).length,
    [subAgents]
  );
  const toolCount = selectedPlugins.length + selectedMCPs.length;
  const enabledScheduledTaskCount = useMemo(
    () => scheduledTasks.filter((task) => task.enabled).length,
    [scheduledTasks]
  );
  const displayClawName = identityName.trim() || "个人全能助理虾";

  const previewCards = useMemo(
    () => [
      {
        title: "灵魂设定.md",
        hint: "核心原则与边界",
        preview: truncateText(`${soulCoreTruths} ${soulBoundaries}`),
        key: "soul" as const,
      },
      {
        title: "用户画像.md",
        hint: "关于你自己的上下文",
        preview: truncateText(userNotes),
        key: "user" as const,
      },
      {
        title: "工具说明.md",
        hint: "本地环境与工具注释",
        preview: truncateText(toolsNotes),
        key: "tools" as const,
      },
      {
        title: "记忆系统.md",
        hint: "两层记忆：长期记忆 + 每日日志",
        preview: truncateText(`长期记忆：${memoryLongTerm} 每日记忆：${memoryDaily}`),
        key: "memory" as const,
      },
      {
        title: "心跳规则.md",
        hint: "可选心跳文件，空白时可跳过心跳轮询",
        preview: truncateText(heartbeatPrompt),
        key: "heartbeat" as const,
      },
    ],
    [heartbeatPrompt, memoryDaily, memoryLongTerm, soulBoundaries, soulCoreTruths, toolsNotes, userNotes]
  );

  const activeEditorMeta =
    activeConfigEditor === "identity"
      ? {
          title: "编辑身份设定.md",
          description: "修改你的身份名片、气质描述和头像信息。",
        }
      : activeConfigEditor === "soul"
        ? {
            title: "编辑灵魂设定.md",
            description: "维护这只 CEC-Claw 的核心原则与行为边界。",
          }
        : activeConfigEditor === "user"
          ? {
              title: "编辑用户画像.md",
              description: "补充你的表达偏好、工作背景和长期上下文。",
            }
          : activeConfigEditor === "tools"
            ? {
                title: "编辑工具说明.md",
                description: "记录工具使用习惯、权限边界和环境注释。",
              }
            : activeConfigEditor === "memory"
              ? {
                  title: "编辑记忆系统",
                  description: "官方默认记忆分为两层：长期记忆 `MEMORY.md`，以及按日期追加的 `memory/YYYY-MM-DD.md`。",
                }
            : activeConfigEditor === "heartbeat"
              ? {
                  title: "编辑心跳规则.md",
                  description: "官方文档中，心跳对应的是可选文件 `HEARTBEAT.md`，用于放置简短的定期检查清单。",
                }
              : null;

  const updateSkill = (skillId: string, patch: Partial<SkillConfig>) => {
    setSkills((current) =>
      current.map((skill) => (skill.id === skillId ? { ...skill, ...patch } : skill))
    );
  };

  const removeSkill = (skillId: string) => {
    setSkills((current) => current.filter((skill) => skill.id !== skillId));
    toast.success("已删除技能");
  };

  const addSkillFromMarketplace = (item: SkillMarketplaceItem) => {
    if (skills.some((skill) => skill.marketplaceId === item.id)) {
      toast.info("这个技能已经添加过了");
      return;
    }

    setSkills((current) => [
      ...current,
      {
        id: `market-${item.id}`,
        marketplaceId: item.id,
        name: item.name,
        description: item.description,
        configuredAt: formatConfiguredAt(),
        version: "市场模板",
        trigger: "根据当前个人 Claw 的编排规则与上下文需求自动触发。",
        enabled: true,
      },
    ]);
    toast.success(`已添加技能：${item.name}`);
  };

  const updateSubAgent = (agentId: string, patch: Partial<SubAgentConfig>) => {
    setSubAgents((current) =>
      current.map((agent) => (agent.id === agentId ? { ...agent, ...patch } : agent))
    );
  };

  const updateFallbackModel = (index: number, value: string) => {
    setFallbackModels((current) =>
      current.map((model, modelIndex) => (modelIndex === index ? value : model))
    );
  };

  const addFallbackModel = () => {
    setFallbackModels((current) => [...current, MODEL_OPTIONS[0].value]);
  };

  const moveFallbackModel = (index: number, direction: "up" | "down") => {
    setFallbackModels((current) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const removeFallbackModel = (index: number) => {
    setFallbackModels((current) => current.filter((_, modelIndex) => modelIndex !== index));
  };

  const handleImport = () => {
    toast.success("已从 OpenClaw 导入我的基础配置");
  };

  const handleSave = () => {
    toast.success("已暂存当前配置");
  };

  const handleApply = () => {
    toast.success("已应用配置");
  };

  const updateScheduledTask = (taskId: string, patch: Partial<ScheduledTaskConfig>) => {
    setScheduledTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, ...patch } : task))
    );
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_38%),linear-gradient(135deg,#ffffff_10%,#f8fbff_55%,#eef6ff_100%)] p-7 shadow-sm">
        <div className="absolute -right-12 top-6 h-40 w-40 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl space-y-4">
            <Badge className="border-sky-200 bg-sky-100 text-sky-700">
              项目开发
              <ChevronRight className="h-3.5 w-3.5" />
              {displayClawName}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{displayClawName}</h1>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <SummaryTile
                icon={Brain}
                label="主模型"
                value={primaryModel}
                caption="当前承担主推理和主回复生成。"
              />
              <SummaryTile
                icon={Sparkles}
                label="已启用技能"
                value={`${enabledSkillCount} 个`}
                caption="围绕我的任务习惯和工作流进行编排。"
              />
              <SummaryTile
                icon={Bot}
                label="子Agent"
                value={`${enabledSubAgentCount} 个`}
                caption="按职责分工协同完成复杂任务。"
              />
              <SummaryTile
                icon={Wrench}
                label="已连接工具"
                value={`${toolCount} 个`}
                caption="包含我已接入的 MCP 与插件能力。"
              />
              <SummaryTile
                icon={FileText}
                label="定时任务"
                value={`${enabledScheduledTaskCount} 个`}
                caption="按精确时间调度，与心跳轮询相互独立。"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={handleImport}>
              <Download className="h-4 w-4" />
              导入 OpenClaw
            </Button>
            <Button variant="outline" onClick={handleSave}>
              <Save className="h-4 w-4" />
              暂存
            </Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleApply}>
              <Sparkles className="h-4 w-4" />
              应用配置
            </Button>
          </div>
        </div>
      </section>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>基础设定</CardTitle>
          <CardDescription>
            集中查看身份设定、灵魂设定、用户画像、工具说明、记忆系统和心跳规则。需要修改时，再点击卡片右上角的编辑按钮进入对应配置文件。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <BasePreviewCard
            title="身份设定.md"
            hint="名字、角色、气质与头像"
            preview=""
            onEdit={() => setActiveConfigEditor("identity")}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-2xl text-white">
                {identityEmoji}
              </div>
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-slate-950">{identityName}</div>
                <div className="mt-1 text-sm text-slate-700">{identityVibe}</div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              头像资源：{identityAvatar}
            </div>
          </BasePreviewCard>

          {previewCards.map((item) => (
            <BasePreviewCard
              key={item.title}
              title={item.title}
              hint={item.hint}
              preview={item.preview}
              onEdit={() => setActiveConfigEditor(item.key)}
            />
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm md:grid-cols-5">
          <TabsTrigger value="models" className="h-auto py-3">
            <Brain className="h-4 w-4" />
            模型配置
          </TabsTrigger>
          <TabsTrigger value="skills" className="h-auto py-3">
            <Sparkles className="h-4 w-4" />
            技能配置
          </TabsTrigger>
          <TabsTrigger value="agents" className="h-auto py-3">
            <Bot className="h-4 w-4" />
            子Agent配置
          </TabsTrigger>
          <TabsTrigger value="tools" className="h-auto py-3">
            <Wrench className="h-4 w-4" />
            工具配置
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="h-auto py-3">
            <FileText className="h-4 w-4" />
            定时任务配置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>模型配置</CardTitle>
              <CardDescription>
                仅保留主模型与回退模型链路；当主模型不可用时，将按顺序依次回退。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 xl:grid-cols-[minmax(320px,0.7fr)_minmax(0,1.3fr)]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="text-base font-semibold text-slate-900">主模型</div>
                <div className="mt-2 text-sm text-slate-500">
                  处理主要对话、规划和结果生成。
                </div>
                <div className="mt-4 space-y-2">
                  <Label>当前主模型</Label>
                  <ModelSelector
                    selectedModel={primaryModel}
                    onModelChange={setPrimaryModel}
                    showParams={false}
                    triggerClassName="w-full justify-between rounded-md border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-900">回退模型链</div>
                    <div className="mt-2 text-sm text-slate-500">
                      从上到下表示优先级顺序，支持继续追加多个回退模型。
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={addFallbackModel}>
                    <Plus className="h-4 w-4" />
                    新增回退模型
                  </Button>
                </div>

                <div className="mt-5 space-y-3">
                  {fallbackModels.map((model, index) => (
                    <div
                      key={`${model}-${index}`}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <ModelSelector
                          selectedModel={model}
                          onModelChange={(value) => updateFallbackModel(index, value)}
                          showParams={false}
                          triggerClassName="w-full justify-between rounded-md border border-slate-200 bg-white px-3 py-2 hover:bg-white"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => moveFallbackModel(index, "up")}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => moveFallbackModel(index, "down")}
                          disabled={index === fallbackModels.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeFallbackModel(index)}
                          disabled={fallbackModels.length === 1}
                          className="text-slate-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>技能配置</CardTitle>
                  <CardDescription>仅保留名称、描述、配置时间与启停状态，方便快速调整个人技能集。</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSkillPickerOpen(true)}>
                  <Plus className="h-4 w-4" />
                  新增技能
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <div
                    key={skill.id}
                    className={cn(
                      "rounded-3xl border p-5 transition-colors",
                      skill.enabled ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50/80"
                    )}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="text-base font-semibold text-slate-950">{skill.name}</div>
                        <p className="max-w-3xl text-sm leading-6 text-slate-500">{skill.description}</p>
                        <div className="text-xs text-slate-400">配置时间 {skill.configuredAt}</div>
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <span className="text-sm text-slate-500">启用</span>
                        <Switch
                          checked={skill.enabled}
                          onCheckedChange={(checked) => updateSkill(skill.id, { enabled: checked })}
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeSkill(skill.id)}
                          className="text-slate-500 hover:text-rose-600"
                          aria-label={`删除${skill.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                  <div className="text-base font-semibold text-slate-900">暂无技能</div>
                  <div className="mt-2 text-sm text-slate-500">删除后会即时从当前个人 Claw 配置中移除。</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>子Agent配置</CardTitle>
              <CardDescription>保留业务描述和触发语义，用更贴近业务场景的方式管理个人子Agent。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subAgents.map((agent) => (
                <div key={agent.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-base font-semibold text-slate-950">{agent.name}</div>
                    <div className="flex items-center gap-3 self-end md:self-auto">
                      <span className="text-sm text-slate-500">启用</span>
                      <Switch
                        checked={agent.enabled}
                        onCheckedChange={(checked) => updateSubAgent(agent.id, { enabled: checked })}
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-500">描述</div>
                      <div className="mt-1 text-sm leading-6 text-slate-700">{agent.responsibility}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <Label className="text-xs text-slate-500">触发语义</Label>
                      <Input
                        value={agent.trigger}
                        onChange={(e) => updateSubAgent(agent.id, { trigger: e.target.value })}
                        className="mt-2 h-10 border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>MCP配置</CardTitle>
                    <CardDescription>接入你自己的 MCP 服务能力。</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setMcpSelectorOpen(true)}>
                    <Brain className="h-4 w-4" />
                    配置 MCP
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedMCPs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                    暂未接入 MCP，点击右上角按钮添加我的服务能力。
                  </div>
                ) : (
                  selectedMCPs.map((mcp) => (
                    <div
                      key={mcp.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                          {mcp.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{mcp.name}</div>
                          <div className="text-sm text-slate-500">{mcp.description}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-red-600"
                        onClick={() =>
                          setSelectedMCPs((current) => current.filter((item) => item.id !== mcp.id))
                        }
                      >
                        移除
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>插件配置</CardTitle>
                    <CardDescription>组合我需要的文档、视觉、代码等插件能力。</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setPluginSelectorOpen(true)}>
                    <Puzzle className="h-4 w-4" />
                    配置插件
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedPlugins.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                    暂未接入插件，点击右上角按钮补充我的工具能力。
                  </div>
                ) : (
                  selectedPlugins.map((plugin) => (
                    <div
                      key={plugin.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm",
                            plugin.color
                          )}
                        >
                          {plugin.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{plugin.name}</div>
                          <div className="text-sm text-slate-500">{plugin.description}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-red-600"
                        onClick={() =>
                          setSelectedPlugins((current) =>
                            current.filter((item) => item.id !== plugin.id)
                          )
                        }
                      >
                        移除
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>定时任务配置</CardTitle>
              <CardDescription>
                参考 OpenClaw 官方的定时任务机制，适合精确时间执行的独立任务；与心跳轮询不同，这里更适合固定时点提醒和后台整理任务。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scheduledTasks.map((task) => (
                <div key={task.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="text-base font-semibold text-slate-950">{task.name}</div>
                      <p className="max-w-3xl text-sm leading-6 text-slate-500">{task.notes}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">启用</span>
                      <Switch
                        checked={task.enabled}
                        onCheckedChange={(checked) => updateScheduledTask(task.id, { enabled: checked })}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>任务名称</Label>
                      <Input
                        value={task.name}
                        onChange={(e) => updateScheduledTask(task.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>调度时间</Label>
                      <Input
                        value={task.schedule}
                        onChange={(e) => updateScheduledTask(task.id, { schedule: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>运行方式</Label>
                      <Input
                        value={task.runContext}
                        onChange={(e) => updateScheduledTask(task.id, { runContext: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>投递方式</Label>
                      <Input
                        value={task.delivery}
                        onChange={(e) => updateScheduledTask(task.id, { delivery: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>任务说明</Label>
                      <Textarea
                        value={task.notes}
                        onChange={(e) => updateScheduledTask(task.id, { notes: e.target.value })}
                        className="min-h-24"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PluginSelector
        key={selectedPlugins.map((plugin) => plugin.id).sort().join("|")}
        open={pluginSelectorOpen}
        onOpenChange={setPluginSelectorOpen}
        onSelect={setSelectedPlugins}
        selectedPlugins={selectedPlugins}
      />
      <MCPSelector
        key={selectedMCPs.map((mcp) => mcp.id).sort().join("|")}
        open={mcpSelectorOpen}
        onOpenChange={setMcpSelectorOpen}
        onSelect={setSelectedMCPs}
        selectedMCPs={selectedMCPs}
      />
      <SkillMarketplacePickerDialog
        open={skillPickerOpen}
        onOpenChange={setSkillPickerOpen}
        selectedIds={skills.flatMap((skill) => (skill.marketplaceId ? [skill.marketplaceId] : []))}
        onSelect={addSkillFromMarketplace}
        title="为我的 Claw 添加技能"
        description="从资源管理 - Skills 广场中选择已存在的技能，快速加入到当前个人 Claw。"
      />

      <Dialog open={activeConfigEditor !== null} onOpenChange={(open) => !open && setActiveConfigEditor(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{activeEditorMeta?.title}</DialogTitle>
            <DialogDescription>{activeEditorMeta?.description}</DialogDescription>
          </DialogHeader>

          {activeConfigEditor === "identity" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>名称</Label>
                <Input value={identityName} onChange={(e) => setIdentityName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>角色定位</Label>
                <Input
                  value={identityCreature}
                  onChange={(e) => setIdentityCreature(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>气质描述</Label>
                <Input value={identityVibe} onChange={(e) => setIdentityVibe(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>头像符号</Label>
                <Input value={identityEmoji} onChange={(e) => setIdentityEmoji(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>头像资源</Label>
                <Input
                  value={identityAvatar}
                  onChange={(e) => setIdentityAvatar(e.target.value)}
                />
              </div>
            </div>
          )}

          {activeConfigEditor === "soul" && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>核心原则</Label>
                <Textarea
                  value={soulCoreTruths}
                  onChange={(e) => setSoulCoreTruths(e.target.value)}
                  className="min-h-28"
                />
              </div>
              <div className="space-y-2">
                <Label>边界约束</Label>
                <Textarea
                  value={soulBoundaries}
                  onChange={(e) => setSoulBoundaries(e.target.value)}
                  className="min-h-28"
                />
              </div>
            </div>
          )}

          {activeConfigEditor === "user" && (
            <div className="space-y-2">
              <Label>用户画像内容</Label>
              <Textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="min-h-56"
              />
            </div>
          )}

          {activeConfigEditor === "tools" && (
            <div className="space-y-2">
              <Label>工具说明内容</Label>
              <Textarea
                value={toolsNotes}
                onChange={(e) => setToolsNotes(e.target.value)}
                className="min-h-56"
              />
            </div>
          )}

          {activeConfigEditor === "memory" && (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                官方默认记忆分为两层：
                <span className="font-medium text-slate-900"> 长期记忆 </span>
                用于稳定事实与偏好，
                <span className="font-medium text-slate-900"> 每日记忆 </span>
                用于按日期追加当天上下文与事件记录。
              </div>
              <div className="space-y-2">
                <Label>长期记忆（MEMORY.md）</Label>
                <Textarea
                  value={memoryLongTerm}
                  onChange={(e) => setMemoryLongTerm(e.target.value)}
                  className="min-h-28"
                />
              </div>
              <div className="space-y-2">
                <Label>每日记忆（memory/YYYY-MM-DD.md）</Label>
                <Textarea
                  value={memoryDaily}
                  onChange={(e) => setMemoryDaily(e.target.value)}
                  className="min-h-28"
                />
              </div>
            </div>
          )}

          {activeConfigEditor === "heartbeat" && (
            <div className="space-y-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                官方文档中，心跳对应的是可选文件 <span className="font-medium text-slate-900">HEARTBEAT.md</span>。
                如果这个文件为空白或只有标题，OpenClaw 会跳过心跳调用以节省开销。
              </div>
              <Label>心跳规则内容</Label>
              <Textarea
                value={heartbeatPrompt}
                onChange={(e) => setHeartbeatPrompt(e.target.value)}
                className="min-h-56"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveConfigEditor(null)}>
              关闭
            </Button>
            <Button onClick={() => {
              toast.success("基础配置已更新");
              setActiveConfigEditor(null);
            }}>
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
