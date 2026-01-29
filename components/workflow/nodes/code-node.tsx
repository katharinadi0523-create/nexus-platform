"use client";

import { NodeProps } from "reactflow";
import { Code, ChevronDown } from "lucide-react";
import { BaseNode } from "./base-node";
import { Handle, Position } from "reactflow";

interface CodeNodeData {
  inputVariables?: Array<{ name: string; type: string }>;
  outputVariables?: Array<{ name: string; type: string }>;
  code?: string;
}

export function CodeNode(props: NodeProps<CodeNodeData>) {
  const { data } = props;
  const inputVariables = data?.inputVariables || [];
  const outputVariables = data?.outputVariables || [];
  const hasCode = !!data?.code;

  return (
    <BaseNode
      icon={Code}
      label="代码"
      color="orange"
      showTargetHandle={true}
      showSourceHandle={false}
      {...props}
    >
      <div className="space-y-3">
        {/* 输入 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
            <ChevronDown className="w-3 h-3" />
            输入
          </div>
          {inputVariables.length > 0 ? (
            <div className="bg-slate-50/50 rounded px-2 py-1.5 space-y-1">
              {inputVariables.map((variable, index) => (
                <div key={index} className="text-xs text-slate-700">
                  {variable.name} <span className="text-slate-500">{variable.type}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50/50 rounded px-2 py-1.5">
              <span className="text-xs text-slate-400">未配置输入</span>
            </div>
          )}
        </div>

        {/* 代码状态 */}
        {hasCode && (
          <div className="bg-slate-50/50 rounded px-2 py-1.5">
            <div className="text-xs text-slate-600">代码已配置</div>
          </div>
        )}

        {/* 输出 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
            <ChevronDown className="w-3 h-3" />
            输出
          </div>
          {outputVariables.length > 0 ? (
            <div className="bg-slate-50/50 rounded px-2 py-1.5 space-y-1">
              {outputVariables.map((variable, index) => {
                // 格式化类型显示：str -> str. String
                const typeDisplay = variable.type === "str" ? "str. String" :
                                  variable.type === "int" ? "int. Integer" :
                                  variable.type === "float" ? "float. Float" :
                                  variable.type === "bool" ? "bool. Boolean" :
                                  variable.type === "list" ? "list. List" :
                                  variable.type === "dict" ? "dict. Dictionary" :
                                  variable.type;
                return (
                  <div key={index} className="text-xs text-slate-700">
                    {variable.name} <span className="text-slate-500">{typeDisplay}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50/50 rounded px-2 py-1.5">
              <span className="text-xs text-slate-400">未配置输出</span>
            </div>
          )}
        </div>
      </div>

      {/* 输出 Handle - 为每个输出变量创建一个 handle，如果没有输出变量则显示一个默认 handle */}
      {outputVariables.length > 0 ? (
        outputVariables.map((variable, index) => {
          // 计算 handle 位置：header (48px) + padding (12px) + 输入区域高度 + 代码状态高度 + 输出区域偏移
          const baseTop = 48 + 12 + 40 + (hasCode ? 30 : 0);
          const outputOffset = 20 + index * 20;
          return (
            <Handle
              key={`output-${variable.name}-${index}`}
              type="source"
              position={Position.Right}
              id={`output-${index}`}
              className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
              style={{
                top: `${baseTop + outputOffset}px`,
              }}
            />
          );
        })
      ) : (
        // 如果没有输出变量，显示一个默认的 source handle
        <Handle
          type="source"
          position={Position.Right}
          id="default-output"
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
        />
      )}
    </BaseNode>
  );
}
