"use client";

import { NodeProps } from "reactflow";
import { Network } from "lucide-react";
import { BaseNode } from "./base-node";

interface ObjectQueryNodeData {
  ontologyConfig?: {
    ontology?: string;
    objectType?: string;
  };
  inputVariables?: Array<{ name: string; value: string }>;
}

export function ObjectQueryNode(props: NodeProps<ObjectQueryNodeData>) {
  const inputVariables = props.data?.inputVariables || [
    { name: "query", value: "开始/query" },
  ];

  return (
    <BaseNode
      icon={Network}
      label="对象查询"
      color="purple"
      showTargetHandle={true}
      showSourceHandle={true}
      selected={props.selected}
      {...props}
    >
      <div className="space-y-3">
        {/* 输入 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">输入</div>
          {inputVariables.map((variable, index) => (
            <div key={index} className="bg-slate-50/50 rounded px-2 py-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700">{variable.name}</span>
                <span className="text-slate-500">{variable.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 输出 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">输出</div>
          <div className="bg-slate-50/50 rounded px-2 py-1.5">
            <div className="text-xs text-slate-700">
              <span className="font-medium">objectSets</span>{" "}
              <span className="text-slate-500">Array[Object]</span>
            </div>
            <div className="pl-2 mt-1 space-y-0.5">
              <div className="text-xs text-slate-600">
                <span className="font-medium">objectName</span> String
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-medium">objectID</span> String
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-medium">metadata</span> Object
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
}
