"use client";

import { NodeProps } from "reactflow";
import { BookOpen } from "lucide-react";
import { BaseNode } from "./base-node";

export function KnowledgeNode(props: NodeProps) {
  return (
    <BaseNode
      icon={BookOpen}
      label="知识检索"
      color="purple"
      showTargetHandle={true}
      showSourceHandle={true}
      {...props}
    >
      <div className="space-y-3">
        {/* 知识库 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">知识库</div>
          <div className="bg-slate-50/50 rounded px-2 py-1.5">
            <div className="text-xs text-slate-700">图片提取测试</div>
          </div>
        </div>

        {/* 输入 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">输入</div>
          <div className="bg-slate-50/50 rounded px-2 py-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700">query</span>
            </div>
          </div>
        </div>

        {/* 输出 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">输出</div>
          <div className="bg-slate-50/50 rounded px-2 py-1.5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700">chunks</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700">metadata</span>
            </div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
}
