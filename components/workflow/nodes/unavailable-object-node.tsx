"use client";

import { FileQuestion, LockKeyhole } from "lucide-react";
import { Handle, NodeProps, Position } from "reactflow";

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
  workflow: { label: "工作流", empty: "原工作流未恢复" },
  agent: { label: "智能体", empty: "原智能体未恢复" },
  component: { label: "组件", empty: "原组件未恢复" },
};

export function UnavailableObjectNode(props: NodeProps<UnavailableObjectNodeData>) {
  const data = props.data;
  const meta = KIND_META[data.objectKind];
  const inputs = data.inputVariables ?? [];
  const outputs = data.outputVariables ?? [];

  return (
    <div aria-disabled="true" className="w-[280px] cursor-not-allowed overflow-hidden rounded-lg border border-dashed border-slate-400 bg-slate-50/95 shadow-none">
      <Handle type="target" position={Position.Left} isConnectable={false} className="!h-3 !w-3 !border-2 !border-white !bg-slate-400" />

      <div className="flex items-center gap-2 border-b border-dashed border-slate-300 bg-slate-100 px-3 py-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded bg-white text-slate-500 ring-1 ring-slate-200">
          <FileQuestion className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-700">{meta.label}占位节点</div>
          <div className="text-[11px] text-slate-500">{meta.empty}</div>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500">
          <LockKeyhole className="h-3 w-3" />只读
        </span>
      </div>

      <div className="space-y-3 p-3">
        <div className="rounded border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs leading-5 text-amber-900">
          <div className="font-medium">原{meta.label}：{data.originalReference}</div>
          <div className="text-amber-700">无法恢复，仅保留原配置用于查看</div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs opacity-75">
          <div className="rounded bg-slate-50 px-2 py-1.5">
            <div className="font-medium text-slate-600">输入</div>
            {inputs.map((item) => <div key={item.name} className="mt-1 truncate text-slate-500">{item.name} · {item.type}</div>)}
          </div>
          <div className="rounded bg-slate-50 px-2 py-1.5">
            <div className="font-medium text-slate-600">输出</div>
            {outputs.map((item) => <div key={item.name} className="mt-1 truncate text-slate-500">{item.name} · {item.type}</div>)}
          </div>
        </div>

        <div className="rounded bg-slate-200/70 px-2 py-1.5 text-center text-[11px] leading-4 text-slate-600">只读占位 · 请新增可用{meta.label}节点完成替换</div>
      </div>

      <Handle type="source" position={Position.Right} isConnectable={false} className="!h-3 !w-3 !border-2 !border-white !bg-slate-400" />
    </div>
  );
}
