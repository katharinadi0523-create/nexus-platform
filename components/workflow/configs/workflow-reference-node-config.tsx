"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface WorkflowReferenceNodeData {
  description?: string;
  workflowId?: string;
  workflowName?: string;
  inputVariables?: Array<{ name: string; type: string; value?: string }>;
  outputVariables?: Array<{ name: string; type: string }>;
}

const WORKFLOW_OPTIONS = [
  { value: "workflow-ticket", label: "客户工单处理流程" },
  { value: "workflow-report", label: "经营日报生成流程" },
  { value: "workflow-review", label: "合同条款审核流程" },
];

export function WorkflowReferenceNodeConfig({
  nodeData,
  onUpdate,
}: {
  nodeData?: WorkflowReferenceNodeData;
  onUpdate: (data: WorkflowReferenceNodeData) => void;
}) {
  return (
    <div className="space-y-6">
      <Input
        value={nodeData?.description || ""}
        placeholder="添加描述..."
        onChange={(event) => onUpdate({ ...nodeData, description: event.target.value })}
      />

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">工作流</h3>
        <Select
          value={nodeData?.workflowId || ""}
          placeholder="请选择工作流"
          options={WORKFLOW_OPTIONS}
          onValueChange={(workflowId) => {
            const selected = WORKFLOW_OPTIONS.find((item) => item.value === workflowId);
            onUpdate({
              ...nodeData,
              workflowId,
              workflowName: selected?.label,
              inputVariables: [{ name: "input", type: "object", value: "" }],
              outputVariables: [{ name: "result", type: "object" }],
            });
          }}
        />
        <p className="text-xs leading-5 text-slate-500">重新选择工作流后，再按新工作流的定义配置输入和输出。</p>
      </div>

      {!nodeData?.workflowId ? (
        <div className="rounded-[6px] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
          选择工作流后显示可配置的输入和输出参数。
        </div>
      ) : null}
    </div>
  );
}
