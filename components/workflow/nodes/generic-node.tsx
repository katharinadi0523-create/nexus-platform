"use client";

import { NodeProps } from "reactflow";
import { Box } from "lucide-react";
import { BaseNode } from "./base-node";

interface GenericNodeData {
  label?: string;
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
      <div className="text-xs text-slate-500 text-center py-4">
        节点配置待实现
      </div>
    </BaseNode>
  );
}
