"use client";

import { NodeProps } from "reactflow";
import { Eye, ChevronDown } from "lucide-react";
import { BaseNode } from "./base-node";
import { Handle, Position } from "reactflow";

interface IntentRecognizeNodeData {
  model?: string;
  inputVariables?: Array<{ name: string; type: string }>;
  intents?: Array<{ name: string; description?: string }>;
}

export function IntentRecognizeNode(props: NodeProps<IntentRecognizeNodeData>) {
  const { data } = props;
  const model = data?.model || "未配置模型";
  const inputVariables = data?.inputVariables || [];
  const intents = data?.intents || [];

  return (
    <BaseNode
      icon={Eye}
      label="意图识别"
      color="blue"
      showTargetHandle={true}
      showSourceHandle={false}
      {...props}
    >
      <div className="space-y-3">
        {/* 模型 */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600 mb-1.5">模型</div>
          <div className="bg-slate-50/50 rounded px-2 py-1.5">
            <div className="text-xs text-slate-700">{model}</div>
          </div>
        </div>

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
                  {variable.name.startsWith("*") ? (
                    <span className="text-red-500">*</span>
                  ) : null}
                  {variable.name.replace(/^\*/, "")} <span className="text-slate-500">{variable.type}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50/50 rounded px-2 py-1.5">
              <span className="text-xs text-slate-400">未配置变量</span>
            </div>
          )}
        </div>

        {/* 输出 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
            <ChevronDown className="w-3 h-3" />
            输出
          </div>
          <div className="bg-slate-50/50 rounded px-2 py-1.5 space-y-1">
            <div className="text-xs text-slate-700">
              classification <span className="text-slate-500">string</span>
            </div>
            <div className="text-xs text-slate-700">
              classificationId <span className="text-slate-500">string</span>
            </div>
          </div>
        </div>

        {/* 意图列表预览 */}
        {intents.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-600 mb-1.5">意图</div>
            <div className="bg-slate-50/50 rounded px-2 py-1.5 space-y-1">
              {intents.map((intent, index) => (
                <div key={index} className="text-xs text-slate-700">
                  意图{index + 1}: {intent.name}
                </div>
              ))}
              <div className="text-xs text-slate-500">其他意图</div>
            </div>
          </div>
        )}
      </div>

      {/* 动态输出 Handle - 为每个意图创建一个 handle */}
      {intents.map((_, index) => (
        <Handle
          key={`intent-${index}`}
          type="source"
          position={Position.Right}
          id={`intent-${index}`}
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
          style={{
            top: `${120 + index * 20}px`,
          }}
        />
      ))}
      {/* 其他意图的 handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="other"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
        style={{
          top: `${120 + intents.length * 20}px`,
        }}
      />
    </BaseNode>
  );
}
