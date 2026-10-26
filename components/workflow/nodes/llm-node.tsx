"use client";

import { NodeProps } from "reactflow";
import { Sparkles } from "lucide-react";
import { BaseNode } from "./base-node";

export function LLMNode(props: NodeProps) {
  const model = typeof props.data?.model === "string" ? props.data.model : "DeepSeek-V3";
  const inputVariables = props.data?.inputVariables || [{ name: "prompt", value: "{{query}}" }];
  const outputVariables = props.data?.outputVariables || [{ name: "text", type: "string" }];

  return (
    <BaseNode
      icon={Sparkles}
      label="大模型"
      color="blue"
      showTargetHandle={true}
      showSourceHandle={true}
      {...props}
    >
      <div className="space-y-3">
        {/* 模型 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">模型</div>
          <div className="rounded bg-slate-50/50 px-2 py-1.5">
            <div className={model ? "text-xs text-slate-700" : "text-xs text-amber-700"}>{model || "请选择模型"}</div>
          </div>
        </div>

        {/* 输入 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">输入</div>
          <div className="space-y-1 rounded bg-slate-50/50 px-2 py-1.5">
            {inputVariables.map((variable: { name: string; value?: string }, index: number) => (
              <div key={`${variable.name}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-700">{variable.name}</span>
                <span className="truncate text-slate-500">{variable.value || "未设置"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 输出 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">输出</div>
          <div className="space-y-1 rounded bg-slate-50/50 px-2 py-1.5">
            {outputVariables.map((variable: { name: string; type?: string }, index: number) => (
              <div key={`${variable.name}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-700">{variable.name}</span>
                <span className="text-slate-500">{variable.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BaseNode>
  );
}
