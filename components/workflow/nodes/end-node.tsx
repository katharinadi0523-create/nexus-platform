"use client";

import { NodeProps } from "reactflow";
import { StopCircle } from "lucide-react";
import { BaseNode } from "./base-node";

export function EndNode(props: NodeProps) {
  return (
    <BaseNode
      icon={StopCircle}
      label="结束"
      color="red"
      showTargetHandle={true}
      showSourceHandle={false}
      {...props}
    >
      <div className="space-y-3">
        {/* 输出 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">输出</div>
          <div className="bg-slate-50/50 rounded px-2 py-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700">result</span>
              <span className="text-slate-500">string</span>
            </div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
}
