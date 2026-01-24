"use client";

import { NodeProps } from "reactflow";
import { Database } from "lucide-react";
import { BaseNode } from "../base-node";

interface DataQueryNodeData {
  inputVariables?: Array<{ name: string; value: string }>;
}

export function DataQueryNode(props: NodeProps<DataQueryNodeData>) {
  const inputVariables = props.data?.inputVariables || [
    { name: "query", value: "" },
    { name: "dataList", value: "" },
  ];

  return (
    <BaseNode
      icon={Database}
      label="数据查询"
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
              <span className="text-slate-700">resultSet</span>
              <span className="text-slate-500">array[object]</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700">queryCode</span>
              <span className="text-slate-500">string</span>
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
