"use client";

import { Bot, Boxes, GitBranch, Trash2 } from "lucide-react";
import { Handle, NodeProps, Position, useReactFlow } from "reactflow";
import { cn } from "@/lib/utils";

export interface UnavailableObjectNodeData {
  description?: string;
  objectKind: "workflow" | "agent" | "component";
  originalReference: string;
  originalVersion?: string;
  originalSource?: string;
  originalComponentType?: "MCP" | "插件" | "本体行为";
  referenceId?: string;
  referenceName?: string;
  inputVariables?: Array<{ name: string; type: string; value?: string }>;
  outputVariables?: Array<{ name: string; type: string }>;
  importIssue?: { title: string; resourceName: string; detail: string; message?: string };
  onOpenConfig?: () => void;
}

const KIND_META = {
  workflow: { label: "工作流", Icon: GitBranch, iconClass: "bg-sky-50 text-sky-600" },
  agent: { label: "智能体选择", Icon: Bot, iconClass: "bg-indigo-50 text-indigo-600" },
  component: { label: "组件", Icon: Boxes, iconClass: "bg-emerald-50 text-emerald-600" },
};

export function UnavailableObjectNode(props: NodeProps<UnavailableObjectNodeData>) {
  const data = props.data;
  const { setNodes, setEdges } = useReactFlow();
  const meta = KIND_META[data.objectKind];
  const Icon = meta.Icon;
  const inputs = data.inputVariables ?? [];
  const outputs = data.outputVariables ?? [];

  function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setNodes((nodes) => nodes.filter((node) => node.id !== props.id));
    setEdges((edges) => edges.filter((edge) => edge.source !== props.id && edge.target !== props.id));
  }

  return (
    <div
      onMouseDown={(event) => {
        if (event.button !== 0) return;
        if ((event.target as HTMLElement).closest("button")) return;
        data.onOpenConfig?.();
      }}
      className={cn(
        "w-[280px] cursor-move overflow-hidden rounded-lg border border-amber-300 bg-white shadow-sm",
        props.selected && "border-amber-500 ring-2 ring-amber-200"
      )}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} className="!h-3 !w-3 !border-2 !border-white !bg-slate-400" />

      <div className="flex items-center gap-2 border-b border-amber-200 bg-white px-3 py-2.5">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded", meta.iconClass)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-900">{data.description || meta.label}</div>
          <div className="text-[11px] text-slate-500">{meta.label}</div>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          待关联
        </span>
        <button
          type="button"
          aria-label={`删除${meta.label}节点`}
          title="删除节点"
          className="nodrag nopan flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 p-3">
        <div className="rounded border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs leading-5 text-amber-900">
          <div className="font-medium">原关联对象：{data.originalReference}{data.originalVersion ? ` ${data.originalVersion}` : ""}</div>
          <div className="text-amber-700">尚未形成有效关联，请重新选择{meta.label}</div>
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

        <div className="rounded bg-slate-50 px-2 py-1.5 text-center text-[11px] leading-4 text-slate-500">原配置仅供查看 · 点击节点重新关联</div>
      </div>

      <Handle type="source" position={Position.Right} isConnectable={false} className="!h-3 !w-3 !border-2 !border-white !bg-slate-400" />
    </div>
  );
}
