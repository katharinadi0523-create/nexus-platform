"use client";

import { NodeProps } from "reactflow";
import { Filter } from "lucide-react";
import { BaseNode } from "../base-node";

interface DataClarifyNodeData {
  inputVariables?: Array<{ name: string; value: string }>;
}

export function DataClarifyNode(props: NodeProps<DataClarifyNodeData>) {
  const inputVariables = props.data?.inputVariables || [
    { name: "dataList", value: "" },
  ];

  return (
    <BaseNode
      icon={Filter}
      label="数据澄清"
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
                <span className="text-slate-500">array[object]</span>
              </div>
            </div>
          ))}
        </div>

        {/* 输出 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">输出</div>
          <div className="bg-slate-50/50 rounded px-2 py-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700">resultSet</span>
              <span className="text-slate-500">array[object]</span>
            </div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
}
