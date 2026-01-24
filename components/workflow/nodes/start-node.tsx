"use client";

import { NodeProps } from "reactflow";
import { Play, ChevronRight } from "lucide-react";
import { BaseNode } from "./base-node";

export function StartNode(props: NodeProps) {
  return (
    <BaseNode
      icon={Play}
      label="开始"
      color="green"
      showTargetHandle={false}
      showSourceHandle={true}
      {...props}
    >
      <div className="space-y-3">
        {/* 系统变量 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">系统变量</div>
          <div className="bg-slate-50/50 rounded px-2 py-1.5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700">query</span>
              <span className="text-slate-500">必填 string</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700">files</span>
              <span className="text-slate-500">array[file]</span>
            </div>
          </div>
        </div>

        {/* 自定义变量 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">自定义变量</div>
          <button className="w-full bg-slate-50/50 rounded px-2 py-1.5 flex items-center justify-between text-xs text-slate-500 hover:bg-slate-100 transition-colors">
            <span>未配置变量</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </BaseNode>
  );
}
