"use client";

import { NodeProps } from "reactflow";
import { BarChart3 } from "lucide-react";
import { BaseNode } from "../base-node";

interface DataVisualizeNodeData {
  inputVariables?: Array<{ name: string; value: string }>;
}

export function DataVisualizeNode(props: NodeProps<DataVisualizeNodeData>) {
  const inputVariables = props.data?.inputVariables || [
    { name: "query", value: "" },
    { name: "dataList", value: "" },
    { name: "dataSource", value: "" },
  ];

  return (
    <BaseNode
      icon={BarChart3}
      label="数据可视化"
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
                <span className="text-slate-500">
                  {variable.name === "query" ? "string" : "array[object]"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 输出 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">输出</div>
          <div className="bg-slate-50/50 rounded px-2 py-1.5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700">chartContent</span>
              <span className="text-slate-500">object</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700">message</span>
              <span className="text-slate-500">string</span>
            </div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
}
