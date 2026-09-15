"use client";

import { GitBranch } from "lucide-react";
import { NodeProps } from "reactflow";
import { BaseNode } from "./base-node";

interface WorkflowReferenceNodeData {
  workflowId?: string;
  workflowName?: string;
  inputVariables?: Array<{ name: string; type: string; value?: string }>;
  outputVariables?: Array<{ name: string; type: string }>;
}

export function WorkflowReferenceNode(props: NodeProps<WorkflowReferenceNodeData>) {
  const workflowName = props.data?.workflowName;
  const inputVariables = props.data?.inputVariables || [];
  const outputVariables = props.data?.outputVariables || [];

  return (
    <BaseNode icon={GitBranch} label="工作流" color="blue" {...props}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600">工作流</div>
          <div className="rounded bg-slate-50/50 px-2 py-1.5">
            <span className={workflowName ? "text-xs text-slate-700" : "text-xs text-amber-700"}>
              {workflowName || "请选择工作流"}
            </span>
          </div>
        </div>

        {workflowName ? (
          <>
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-600">输入</div>
              <div className="space-y-1 rounded bg-slate-50/50 px-2 py-1.5">
                {inputVariables.map((variable, index) => (
                  <div key={`${variable.name}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-700">{variable.name}</span>
                    <span className="truncate text-slate-500">{variable.value || variable.type}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-600">输出</div>
              <div className="space-y-1 rounded bg-slate-50/50 px-2 py-1.5">
                {outputVariables.map((variable, index) => (
                  <div key={`${variable.name}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-700">{variable.name}</span>
                    <span className="text-slate-500">{variable.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded bg-slate-50 px-2 py-2 text-xs text-slate-400">选择工作流后重新配置输入和输出</div>
        )}
      </div>
    </BaseNode>
  );
}
