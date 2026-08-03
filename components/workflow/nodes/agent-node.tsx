"use client";

import { NodeProps } from "reactflow";
import { Bot, ChevronRight, ChevronDown, CircleAlert } from "lucide-react";
import { BaseNode } from "./base-node";
import { Handle, Position } from "reactflow";

interface AgentNodeData {
  agentId?: string;
  agentName?: string;
  inputVariables?: Array<{ name: string; type: string }>;
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

export function AgentNode(props: NodeProps<AgentNodeData>) {
  const { data } = props;
  const hasAgent = !!data?.agentId && !!data?.agentName;
  const inputVariables = data?.inputVariables || [];
  const outputVariables = data?.outputVariables || [];
  const agentDisabled = data?.availabilityStatus === "agent-disabled";

  return (
    <div className="relative">
      {agentDisabled ? (
        <span
          title="引用的智能体已停用"
          aria-label="引用的智能体已停用"
          className="absolute -right-3 -top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-white shadow-sm"
        >
          <CircleAlert className="h-4 w-4" />
        </span>
      ) : data?.versionAutoSwitched ? (
        <span
          title="原引用版本已停用，已自动切换"
          aria-label="原引用版本已停用，已自动切换"
          className="absolute -right-3 -top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-sm"
        >
          <CircleAlert className="h-4 w-4" />
        </span>
      ) : data?.hasVersionUpdate ? (
        <span
          title="存在可用新版本"
          aria-label="存在可用新版本"
          className="absolute -right-3 -top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-white shadow-sm"
        >
          <CircleAlert className="h-4 w-4" />
        </span>
      ) : null}
      <BaseNode
        icon={Bot}
        label="智能体"
        color={agentDisabled ? "red" : "blue"}
        showTargetHandle={true}
        showSourceHandle={false}
        {...props}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
              <ChevronRight className="h-3 w-3" />
              智能体
            </div>
            {hasAgent ? (
              <div className={`flex items-center gap-2 rounded px-2 py-1.5 ${agentDisabled ? "bg-rose-50" : "bg-slate-50/50"}`}>
                <div className={`flex h-4 w-4 items-center justify-center rounded ${agentDisabled ? "bg-rose-100" : "bg-blue-100"}`}>
                  <div className={`h-2 w-2 rounded-sm ${agentDisabled ? "bg-rose-500" : "bg-blue-600"}`} />
                </div>
                <span className={`text-xs ${agentDisabled ? "text-rose-700" : "text-slate-700"}`}>{data.agentName}</span>
                {agentDisabled ? (
                  <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">不可用</span>
                ) : null}
                {data.currentVersion ? (
                  <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {data.currentVersion}
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="rounded bg-slate-50/50 px-2 py-1.5">
                <span className="text-xs text-slate-400">未配置智能体</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
              <ChevronDown className="h-3 w-3" />
              输入
            </div>
            {inputVariables.length > 0 ? (
              <div className="space-y-1 rounded bg-slate-50/50 px-2 py-1.5">
                {inputVariables.map((variable, index) => (
                  <div key={index} className="text-xs text-slate-700">
                    {variable.name.startsWith("*") ? <span className="text-red-500">*</span> : null}
                    {variable.name.replace(/^\*/, "")} <span className="text-slate-500">{variable.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded bg-slate-50/50 px-2 py-1.5">
                <span className="text-xs text-slate-400">未配置变量</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
              <ChevronDown className="h-3 w-3" />
              输出
            </div>
            {outputVariables.length > 0 ? (
              <div className="space-y-1 rounded bg-slate-50/50 px-2 py-1.5">
                {outputVariables.map((variable, index) => (
                  <div key={index} className="text-xs text-slate-700">
                    {variable.name} <span className="text-slate-500">{variable.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded bg-slate-50/50 px-2 py-1.5">
                <span className="text-xs text-slate-400">未配置变量</span>
              </div>
            )}
          </div>
        </div>

        {outputVariables.map((_, index) => (
          <Handle
            key={`output-${index}`}
            type="source"
            position={Position.Right}
            id={`output-${index}`}
            className="!h-3 !w-3 !border-2 !border-white !bg-blue-500"
            style={{ top: `${60 + index * 20}px` }}
          />
        ))}
      </BaseNode>
    </div>
  );
}