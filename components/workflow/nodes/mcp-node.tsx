"use client";

import { NodeProps } from "reactflow";
import { Package } from "lucide-react";
import { BaseNode } from "./base-node";

interface MCPNodeData {
  selectedMCP?: {
    id: string;
    name: string;
    description?: string;
  };
  inputVariables?: Array<{ name: string; value: string }>;
  outputVariables?: Array<{ name: string; type: string }>;
}

export function MCPNode(props: NodeProps<MCPNodeData>) {
  const selectedMCP = props.data?.selectedMCP;
  const inputVariables = props.data?.inputVariables || [];
  const outputVariables = props.data?.outputVariables || [];

  return (
    <BaseNode
      icon={Package}
      label={selectedMCP?.name || "MCP"}
      color="green"
      showTargetHandle={true}
      showSourceHandle={true}
      selected={props.selected}
      {...props}
    >
      <div className="space-y-3">
        {/* MCP 信息 */}
        {selectedMCP ? (
          <div className="text-xs text-slate-600">
            {selectedMCP.description || "MCP工具"}
          </div>
        ) : (
          <div className="text-xs text-slate-400">未选择MCP工具</div>
        )}

        {/* 输入 */}
        {inputVariables.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-600 mb-1.5">输入</div>
            {inputVariables.map((variable, index) => (
              <div key={index} className="bg-slate-50/50 rounded px-2 py-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{variable.name}</span>
                  <span className="text-slate-500 truncate ml-2">{variable.value || "未设置"}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 输出 */}
        {outputVariables.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-600 mb-1.5">输出</div>
            {outputVariables.map((variable, index) => (
              <div key={index} className="bg-slate-50/50 rounded px-2 py-1.5">
                <div className="text-xs text-slate-700">
                  <span className="font-medium">{variable.name}</span>{" "}
                  <span className="text-slate-500">{variable.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
