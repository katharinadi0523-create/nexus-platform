"use client";

import { NodeProps } from "reactflow";
import { Sparkles } from "lucide-react";
import { BaseNode } from "./base-node";

export function LLMNode(props: NodeProps) {
  return (
    <BaseNode
      icon={Sparkles}
      label="大模型"
      color="blue"
      showTargetHandle={true}
      showSourceHandle={true}
      {...props}
    >
      <div className="space-y-3">
        {/* 模型 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">模型</div>
          <div className="bg-slate-50/50 rounded px-2 py-1.5">
            <div className="text-xs text-slate-700">DeepSeek-V3</div>
          </div>
        </div>

        {/* 输入 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">输入</div>
          <div className="bg-slate-50/50 rounded px-2 py-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700">prompt</span>
              <span className="text-slate-500">{"{{query}}"}</span>
            </div>
          </div>
        </div>

        {/* 输出 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">输出</div>
          <div className="bg-slate-50/50 rounded px-2 py-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700">text</span>
            </div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
}
