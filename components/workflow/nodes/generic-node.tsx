"use client";

import { NodeProps } from "reactflow";
import { Box } from "lucide-react";
import { BaseNode } from "./base-node";

interface GenericNodeData {
  label?: string;
  referenceName?: string;
  inputVariables?: Array<{ name: string; type?: string; value?: string }>;
  outputVariables?: Array<{ name: string; type?: string }>;
  importIssue?: { title: string; resourceName: string; detail: string; message?: string };
}

export function GenericNode(props: NodeProps<GenericNodeData>) {
  const label = props.data?.label || props.type || "节点";

  return (
    <BaseNode
      icon={Box}
      label={label}
      color="blue"
      showTargetHandle={true}
      showSourceHandle={true}
      selected={props.selected}
      {...props}
    >
      <div className="space-y-3 text-xs text-slate-600">
        {props.data?.referenceName ? (
          <div className="rounded bg-slate-50 px-2 py-1.5">关联资源：{props.data.referenceName}</div>
        ) : null}
        {props.data?.inputVariables?.length ? (
          <div className="rounded bg-slate-50 px-2 py-1.5">输入：{props.data.inputVariables.map((item) => item.name).join("、")}</div>
        ) : null}
        {props.data?.outputVariables?.length ? (
          <div className="rounded bg-slate-50 px-2 py-1.5">输出：{props.data.outputVariables.map((item) => item.name).join("、")}</div>
        ) : null}
        {props.data?.importIssue ? (
          <div className="rounded bg-slate-100 px-2 py-1.5 text-[11px] text-slate-500">重新关联前不可运行</div>
        ) : null}
      </div>
    </BaseNode>
  );
}
