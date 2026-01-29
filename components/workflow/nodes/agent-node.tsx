"use client";

import { NodeProps } from "reactflow";
import { Bot, ChevronRight, ChevronDown } from "lucide-react";
import { BaseNode } from "./base-node";
import { Handle, Position } from "reactflow";

interface AgentNodeData {
  agentId?: string;
  agentName?: string;
  inputVariables?: Array<{ name: string; type: string }>;
  outputVariables?: Array<{ name: string; type: string }>;
}

export function AgentNode(props: NodeProps<AgentNodeData>) {
  const { data } = props;
  const hasAgent = !!data?.agentId && !!data?.agentName;
  const inputVariables = data?.inputVariables || [];
  const outputVariables = data?.outputVariables || [];

  return (
    <BaseNode
      icon={Bot}
      label="智能体"
      color="blue"
      showTargetHandle={true}
      showSourceHandle={false}
      {...props}
    >
      <div className="space-y-3">
        {/* 智能体选择 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
            <ChevronRight className="w-3 h-3" />
            智能体
          </div>
          {hasAgent ? (
            <div className="bg-slate-50/50 rounded px-2 py-1.5 flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-600 rounded-sm"></div>
              </div>
              <span className="text-xs text-slate-700">{data.agentName}</span>
            </div>
          ) : (
            <div className="bg-slate-50/50 rounded px-2 py-1.5">
              <span className="text-xs text-slate-400">未配置智能体</span>
            </div>
          )}
        </div>

        {/* 输入 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
            <ChevronDown className="w-3 h-3" />
            输入
          </div>
          {inputVariables.length > 0 ? (
            <div className="bg-slate-50/50 rounded px-2 py-1.5 space-y-1">
              {inputVariables.map((variable, index) => (
                <div key={index} className="text-xs text-slate-700">
                  {variable.name.startsWith("*") ? (
                    <span className="text-red-500">*</span>
                  ) : null}
                  {variable.name.replace(/^\*/, "")} <span className="text-slate-500">{variable.type}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50/50 rounded px-2 py-1.5">
              <span className="text-xs text-slate-400">未配置变量</span>
            </div>
          )}
        </div>

        {/* 输出 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
            <ChevronDown className="w-3 h-3" />
            输出
          </div>
          {outputVariables.length > 0 ? (
            <div className="bg-slate-50/50 rounded px-2 py-1.5 space-y-1">
              {outputVariables.map((variable, index) => (
                <div key={index} className="text-xs text-slate-700">
                  {variable.name} <span className="text-slate-500">{variable.type}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50/50 rounded px-2 py-1.5">
              <span className="text-xs text-slate-400">未配置变量</span>
            </div>
          )}
        </div>
      </div>

      {/* 动态输出 Handle - 为每个输出变量创建一个 handle */}
      {outputVariables.map((variable, index) => (
        <Handle
          key={`output-${index}`}
          type="source"
          position={Position.Right}
          id={`output-${index}`}
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
          style={{
            top: `${60 + index * 20}px`,
          }}
        />
      ))}
    </BaseNode>
  );
}
