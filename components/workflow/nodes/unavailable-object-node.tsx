"use client";

import { Bot, Boxes, GitBranch } from "lucide-react";
import { NodeProps } from "reactflow";
import { BaseNode } from "./base-node";

export interface UnavailableObjectNodeData {
  description?: string;
  objectKind: "workflow" | "agent" | "component";
  originalReference: string;
  referenceId?: string;
  referenceName?: string;
  inputVariables?: Array<{ name: string; type: string; value?: string }>;
  outputVariables?: Array<{ name: string; type: string }>;
  importIssue?: { title: string; resourceName: string; detail: string; message?: string };
}

const KIND_META = {
  workflow: { label: "工作流", icon: GitBranch, empty: "请选择工作流" },
  agent: { label: "智能体选择", icon: Bot, empty: "请选择智能体" },
  component: { label: "组件", icon: Boxes, empty: "请选择组件" },
};

export function UnavailableObjectNode(props: NodeProps<UnavailableObjectNodeData>) {
  const data = props.data;
  const meta = KIND_META[data.objectKind];
  const inputs = data.inputVariables ?? [];
  const outputs = data.outputVariables ?? [];

  return (
    <BaseNode icon={meta.icon} label={meta.label} color="blue" {...props}>
      <div className="space-y-3">
        <div>
          <div className="text-xs font-medium text-slate-600">{meta.label}</div>
          <div className="mt-1 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
            {data.referenceName || meta.empty}
          </div>
          {!data.referenceName ? <div className="mt-1 text-[11px] text-slate-500">原引用：{data.originalReference}</div> : null}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded bg-slate-50 px-2 py-1.5">
            <div className="font-medium text-slate-600">输入</div>
            {inputs.map((item) => <div key={item.name} className="mt-1 truncate text-slate-500">{item.name} · {item.type}</div>)}
          </div>
          <div className="rounded bg-slate-50 px-2 py-1.5">
            <div className="font-medium text-slate-600">输出</div>
            {outputs.map((item) => <div key={item.name} className="mt-1 truncate text-slate-500">{item.name} · {item.type}</div>)}
          </div>
        </div>

        {data.importIssue ? (
          <div className="rounded bg-slate-100 px-2 py-1.5 text-[11px] leading-4 text-slate-500">仅用于展示，重新关联前不可运行</div>
        ) : null}
      </div>
    </BaseNode>
  );
}
