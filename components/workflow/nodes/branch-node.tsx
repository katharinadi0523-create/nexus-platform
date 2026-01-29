"use client";

import { NodeProps } from "reactflow";
import { GitBranch, ChevronDown } from "lucide-react";
import { BaseNode } from "./base-node";
import { Handle, Position } from "reactflow";

interface BranchNodeData {
  conditions?: Array<{
    variable: string;
    operator: string;
    value: string;
  }>;
  hasElse?: boolean;
}

export function BranchNode(props: NodeProps<BranchNodeData>) {
  const { data } = props;
  const conditions = data?.conditions || [];
  const hasElse = data?.hasElse !== false; // 默认有 else

  return (
    <BaseNode
      icon={GitBranch}
      label="分支器"
      color="orange"
      showTargetHandle={true}
      showSourceHandle={false}
      {...props}
    >
      <div className="space-y-3">
        {/* 条件分支预览 */}
        {conditions.length > 0 ? (
          <div className="space-y-2">
            {conditions.map((condition, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                  <ChevronDown className="w-3 h-3" />
                  {index === 0 ? "如果" : `否则如果 ${index}`}
                </div>
                <div className="bg-slate-50/50 rounded px-2 py-1.5">
                  <div className="text-xs text-slate-700">
                    {condition.variable} {condition.operator} {condition.value}
                  </div>
                </div>
                {/* 为每个条件分支创建输出 handle */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`condition-${index}`}
                  className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
                  style={{
                    top: `${40 + index * 50}px`,
                  }}
                />
              </div>
            ))}
            {hasElse && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                  <ChevronDown className="w-3 h-3" />
                  否则
                </div>
                <div className="bg-slate-50/50 rounded px-2 py-1.5">
                  <div className="text-xs text-slate-400">默认分支</div>
                </div>
                {/* Else 分支的 handle */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id="else"
                  className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
                  style={{
                    top: `${40 + conditions.length * 50}px`,
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50/50 rounded px-2 py-1.5">
            <span className="text-xs text-slate-400">未配置条件</span>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
