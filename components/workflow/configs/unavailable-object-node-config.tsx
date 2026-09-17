"use client";

import { Select } from "@/components/ui/select";
import type { UnavailableObjectNodeData } from "../nodes/unavailable-object-node";

const OPTIONS = {
  workflow: [
    { value: "workflow-ticket", label: "客户工单处理流程" },
    { value: "workflow-report", label: "经营日报生成流程" },
  ],
  agent: [
    { value: "agent-service", label: "服务质检智能体" },
    { value: "agent-risk", label: "风险复核智能体" },
  ],
  component: [
    { value: "component-ticket", label: "工单中心组件" },
    { value: "component-message", label: "消息通知组件" },
  ],
};

export function UnavailableObjectNodeConfig({
  nodeData,
  onUpdate,
}: {
  nodeData: UnavailableObjectNodeData;
  onUpdate: (data: UnavailableObjectNodeData) => void;
}) {
  const options = OPTIONS[nodeData.objectKind];
  const label = nodeData.objectKind === "workflow" ? "工作流" : nodeData.objectKind === "agent" ? "智能体" : "组件";

  return (
    <div className="space-y-5">
      <div className="rounded-[6px] border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
        原引用：<span className="font-medium text-slate-900">{nodeData.originalReference}</span><br />
        选择新对象后，请复核当前节点的输入输出映射。
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">重新选择{label}</h3>
        <Select
          value={nodeData.referenceId || ""}
          placeholder={`请选择${label}`}
          options={options}
          onValueChange={(referenceId) => {
            const selected = options.find((item) => item.value === referenceId);
            onUpdate({ ...nodeData, referenceId, referenceName: selected?.label });
          }}
        />
        <p className="text-xs leading-5 text-slate-500">重新关联后节点恢复运行；输入输出需按新对象定义复核。</p>
      </div>
    </div>
  );
}
