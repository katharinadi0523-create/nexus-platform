"use client";

import { useState } from "react";
import { Plus, Grid2x2, X, Trash2, CircleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Node, Edge } from "reactflow";
import { VariableSelector } from "../variable-selector";
import { toast } from "sonner";

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  desc: string;
  updatedAt: string;
}

interface AgentNodeData {
  description?: string;
  agentId?: string;
  agentName?: string;
  inputVariables?: Array<{ name: string; type: string; value?: string }>;
  outputVariables?: Array<{ name: string; type: string }>;
  currentVersion?: string;
  latestVersion?: string;
  latestPublishedAt?: string;
  latestVersionDescription?: string;
  hasVersionUpdate?: boolean;
  versionUpdateDismissed?: boolean;
  versionAutoSwitched?: boolean;
  previousVersion?: string;
  versionSwitchMessage?: string;
  versionSwitchedAt?: string;
  availabilityStatus?: "available" | "agent-disabled";
  agentUnavailableMessage?: string;
  runtimeError?: string;
}

interface AgentNodeConfigProps {
  nodeData?: AgentNodeData;
  onUpdate: (data: AgentNodeData) => void;
  currentNodeId?: string;
  nodes?: Node[];
  edges?: Edge[];
}

const typeOptions = [
  { value: "string", label: "string" },
  { value: "number", label: "number" },
  { value: "boolean", label: "boolean" },
  { value: "array[string]", label: "array[string]" },
  { value: "array[number]", label: "array[number]" },
  { value: "array[boolean]", label: "array[boolean]" },
  { value: "array[object]", label: "array[object]" },
  { value: "object", label: "object" },
];

// Mock 已发布的智能体数据
const PUBLISHED_AGENTS: Agent[] = [
  {
    id: "device-03",
    name: "设备维修判断与预测",
    type: "自主规划智能体",
    status: "已发布",
    desc: "基于传感器数据和历史维修记录，预测设备故障概率。",
    updatedAt: "2025-12-20 21:03:15",
  },
  {
    id: "anti-fl-07",
    name: "反FL分析智能体",
    type: "工作流智能体",
    status: "已发布",
    desc: "智能体应用描述",
    updatedAt: "2026-01-02 13:30:00",
  },
];

export function AgentNodeConfig({
  nodeData,
  onUpdate,
  currentNodeId = "",
  nodes = [],
  edges = [],
}: AgentNodeConfigProps) {
  const [description, setDescription] = useState(nodeData?.description || "");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(
    nodeData?.agentId && nodeData?.agentName
      ? {
          id: nodeData.agentId,
          name: nodeData.agentName,
          type: "",
          status: "",
          desc: "",
          updatedAt: "",
        }
      : null
  );
  const [inputVariables, setInputVariables] = useState<
    Array<{ name: string; type: string; value?: string }>
  >(
    nodeData?.inputVariables || []
  );
  const outputVariables = nodeData?.outputVariables || [
    { name: "answer", type: "String" },
    { name: "ruleIntervention", type: "String" },
  ];
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setAgentDialogOpen(false);
    // 更新节点数据
    const updated: AgentNodeData = {
      ...nodeData,
      agentId: agent.id,
      agentName: agent.name,
      currentVersion: "V1",
      latestVersion: "V2",
      latestPublishedAt: "2026-07-27 10:20:15",
      latestVersionDescription: "优化数据校验及异常处理",
      hasVersionUpdate: true,
      versionUpdateDismissed: false,
      versionAutoSwitched: false,
      previousVersion: undefined,
      versionSwitchMessage: undefined,
      versionSwitchedAt: undefined,
      availabilityStatus: "available",
      agentUnavailableMessage: undefined,
      runtimeError: undefined,
      // 根据选择的智能体，可以预设输入输出变量
      inputVariables: inputVariables.length > 0 ? inputVariables : [
        { name: "query", type: "string", value: "" },
        { name: "files", type: "array[object]", value: "" },
        { name: "*device_id", type: "string", value: "" },
      ],
      outputVariables: outputVariables.length > 0 ? outputVariables : [
        { name: "answer", type: "String" },
        { name: "ruleIntervention", type: "String" },
      ],
    };
    onUpdate(updated);
  };

  const handleUpdateInputVariable = (
    index: number,
    field: "name" | "type" | "value",
    value: string
  ) => {
    const updated = inputVariables.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    setInputVariables(updated);
    onUpdate({ ...nodeData, inputVariables: updated });
  };

  const handleAddInputVariable = () => {
    const newVariable = { name: "", type: "string", value: "" };
    const updated = [...inputVariables, newVariable];
    setInputVariables(updated);
    onUpdate({ ...nodeData, inputVariables: updated });
  };

  const handleRemoveInputVariable = (index: number) => {
    const updated = inputVariables.filter((_, i) => i !== index);
    setInputVariables(updated);
    onUpdate({ ...nodeData, inputVariables: updated });
  };

  const handleSelectInputVariable = (index: number, variablePath: string) => {
    const updated = inputVariables.map((v, i) =>
      i === index ? { ...v, value: variablePath } : v
    );
    setInputVariables(updated);
    onUpdate({ ...nodeData, inputVariables: updated });
  };

  const agentDisabled = nodeData?.availabilityStatus === "agent-disabled";

  return (
    <div className="space-y-6">
      {selectedAgent && agentDisabled ? (
        <section className="rounded-lg border border-rose-200 bg-rose-50/70 p-4">
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-rose-600" />
            <h3 className="text-sm font-semibold text-rose-950">智能体不可用</h3>
            <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">已停用</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-rose-800">
            {nodeData?.agentUnavailableMessage || "引用的智能体已停用，请重新配置。"}
          </p>
          <p className="mt-2 text-xs text-rose-600">原引用：{nodeData?.agentName} · {nodeData?.currentVersion}</p>
          <div className="mt-4 flex justify-end border-t border-rose-200 pt-3">
            <Button
              type="button"
              size="sm"
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => {
                setSelectedAgent(null);
                setAgentDialogOpen(true);
              }}
            >
              重新配置
            </Button>
          </div>
        </section>
      ) : null}

      {selectedAgent && nodeData?.versionAutoSwitched ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50/70 p-4">
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-950">引用版本已自动更新</h3>
            <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">已切换</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-blue-800">
            {nodeData.versionSwitchMessage || "原引用版本已停用，系统已自动切换至最新可用版本。"}
          </p>
          <dl className="mt-3 grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 gap-y-2 border-t border-blue-200 pt-3 text-sm">
            <dt className="text-blue-600">原引用版本</dt>
            <dd className="font-medium text-blue-950">{nodeData.previousVersion || "—"}</dd>
            <dt className="text-blue-600">实际使用版本</dt>
            <dd className="font-medium text-blue-950">{nodeData.currentVersion || "—"}</dd>
            <dt className="text-blue-600">最新版本描述</dt>
            <dd className="leading-5 text-blue-900">{nodeData.latestVersionDescription || "—"}</dd>
            <dt className="text-blue-600">切换时间</dt>
            <dd className="text-blue-900">{nodeData.versionSwitchedAt || "—"}</dd>
          </dl>
        </section>
      ) : null}

      {selectedAgent && !agentDisabled && !nodeData?.versionAutoSwitched && nodeData?.currentVersion && nodeData?.latestVersion ? (
        <section className={`rounded-lg border p-4 ${nodeData.hasVersionUpdate ? "border-amber-200 bg-amber-50/60" : "border-slate-200 bg-slate-50"}`}>
          <div className="flex items-center gap-2">
            <CircleAlert className={`h-4 w-4 ${nodeData.hasVersionUpdate ? "text-amber-500" : "text-emerald-500"}`} />
            <h3 className="text-sm font-semibold text-slate-900">版本信息</h3>
            {nodeData.hasVersionUpdate ? (
              <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">有新版本</span>
            ) : (
              <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">已是最新</span>
            )}
          </div>
          <dl className="mt-3 grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
            <dt className="text-slate-500">当前版本</dt>
            <dd className="font-medium text-slate-800">{nodeData.currentVersion}</dd>
            <dt className="text-slate-500">最新版本</dt>
            <dd className="font-medium text-slate-800">{nodeData.latestVersion}</dd>
            <dt className="text-slate-500">发布时间</dt>
            <dd className="text-slate-700">{nodeData.latestPublishedAt || "—"}</dd>
            <dt className="text-slate-500">最新版本描述</dt>
            <dd className="leading-5 text-slate-700">{nodeData.latestVersionDescription || "—"}</dd>
          </dl>
          {nodeData.hasVersionUpdate ? (
            <div className="mt-4 flex justify-end gap-2 border-t border-amber-200 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onUpdate({ ...nodeData, versionUpdateDismissed: true });
                  toast.info(`继续保留 ${nodeData.currentVersion}，未切换至最新版本`);
                }}
              >
                暂不更新
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  onUpdate({
                    ...nodeData,
                    currentVersion: nodeData.latestVersion,
                    hasVersionUpdate: false,
                    versionUpdateDismissed: false,
                  });
                  toast.success(`已更新至 ${nodeData.latestVersion}`);
                }}
              >
                立即更新
              </Button>
            </div>
          ) : null}
          {nodeData.hasVersionUpdate && nodeData.versionUpdateDismissed ? (
            <p className="mt-3 text-xs text-amber-700">已选择暂不更新，节点继续使用 {nodeData.currentVersion}。</p>
          ) : null}
        </section>
      ) : null}

      {/* 描述 */}
      <div>
        <Input
          placeholder="添加描述..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            onUpdate({ ...nodeData, description: e.target.value });
          }}
          className="w-full"
        />
      </div>

      {/* 智能体选择 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">智能体</h3>
        {selectedAgent ? (
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                <Grid2x2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 mb-1">
                  智能体名称: {selectedAgent.name}
                </div>
                <div className="text-xs text-slate-500">
                  {selectedAgent.updatedAt || "2025-12-20 21:03:15"}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedAgent(null);
                  onUpdate({ ...nodeData, agentId: undefined, agentName: undefined });
                }}
                className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        ) : (
          <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="w-4 h-4" />
                添加
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>选择智能体</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
                {PUBLISHED_AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent)}
                    className="w-full text-left p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                        <Grid2x2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 mb-1">
                          {agent.name}
                        </div>
                        <div className="text-xs text-slate-500">{agent.desc}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {agent.updatedAt}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 输入变量 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">输入变量</h3>
        {inputVariables.length > 0 ? (
          <div className="space-y-2">
            {inputVariables.map((variable, index) => (
              <div
                key={index}
                className="space-y-2 bg-slate-50 rounded-lg p-2"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={variable.name.replace(/^\*/, "")}
                    onChange={(e) => {
                      const newName = variable.name.startsWith("*")
                        ? `*${e.target.value}`
                        : e.target.value;
                      handleUpdateInputVariable(index, "name", newName);
                    }}
                    placeholder="变量名"
                    className="flex-1 text-sm"
                  />
                  <Select
                    value={variable.type}
                    onValueChange={(value) =>
                      handleUpdateInputVariable(index, "type", value)
                    }
                    options={typeOptions}
                    className="w-[140px] text-sm"
                  />
                  <button
                    onClick={() => handleRemoveInputVariable(index)}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {variable.name.startsWith("*") && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                  <VariableSelector
                    nodes={nodes}
                    edges={edges}
                    currentNodeId={currentNodeId}
                    value={variable.value}
                    onSelect={(path) => handleSelectInputVariable(index, path)}
                    placeholder="选择上游节点输出"
                    className="flex-1 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-3 text-center text-sm text-slate-500">
            未配置变量
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddInputVariable}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          添加输入变量
        </Button>
      </div>

      {/* 输出 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">输出</h3>
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          {outputVariables.map((variable, index) => (
            <div key={index} className="text-sm text-slate-700">
              <span className="font-medium">{variable.name}</span>{" "}
              <span className="text-slate-500">{variable.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
