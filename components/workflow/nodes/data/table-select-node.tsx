"use client";

import { NodeProps } from "reactflow";
import { Table } from "lucide-react";
import { BaseNode } from "../base-node";

interface TableSelectNodeData {
  dataSource?: string;
  inputVariables?: Array<{ name: string; value: string }>;
}

export function TableSelectNode(props: NodeProps<TableSelectNodeData>) {
  const inputVariables = props.data?.inputVariables || [
    { name: "query", value: "" },
  ];
  const dataSource = props.data?.dataSource;

  return (
    <BaseNode
      icon={Table}
      label="选表"
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
                <span className="text-slate-500">string</span>
              </div>
            </div>
          ))}
        </div>

        {/* 数据来源 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">数据来源</div>
          <div className="bg-slate-50/50 rounded px-2 py-1.5">
            <div className="text-xs text-slate-500">
              {dataSource || "未配置"}
            </div>
          </div>
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
              <span className="text-slate-700">message</span>
              <span className="text-slate-500">string</span>
            </div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
}
