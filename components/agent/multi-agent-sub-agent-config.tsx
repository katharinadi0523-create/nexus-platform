"use client";

import { useState } from "react";
import { CirclePlay } from "lucide-react";
import { toast } from "sonner";
import { SingleAgentDebugDialog } from "@/components/claw-hub-next/single-agent-debug-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  EMPTY_AGENT_RESOURCES,
  MultiAgentAgentResources,
} from "@/components/agent/multi-agent-agent-resources";
import type { CapabilityAgentItem, ClawDetailData } from "@/lib/mock/claw-hub-next";
import { PRESET_MODEL_IDS } from "@/lib/model-schemas";

const MODEL_OPTIONS = PRESET_MODEL_IDS.map((id) => ({ value: id, label: id }));

export type MultiAgentSubAgentConfigProps = {
  agent: CapabilityAgentItem;
  clawDetail: ClawDetailData;
  onChange: (patch: Partial<CapabilityAgentItem>) => void;
};

/**
 * 子智能体右侧配置：名称、模型、提示词、资源，以及复用「智能体」页的单智能体调试。
 */
export function MultiAgentSubAgentConfig({
  agent,
  clawDetail,
  onChange,
}: MultiAgentSubAgentConfigProps) {
  const [debugOpen, setDebugOpen] = useState(false);
  const isEnabled = agent.enabled !== false;
  const canDebug = isEnabled;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">{isEnabled ? "已启用" : "已停用"}</span>
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => {
              onChange({ enabled: checked });
              toast.success(checked ? "已启用子智能体" : "已停用子智能体");
            }}
            aria-label={`${isEnabled ? "停用" : "启用"} ${agent.name}`}
            title={isEnabled ? "停用子智能体" : "启用子智能体"}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-md border-slate-200 bg-white text-blue-600 shadow-none hover:bg-blue-50 hover:text-blue-700"
          disabled={!canDebug}
          title={canDebug ? `调试 ${agent.name}` : "请先启用智能体"}
          onClick={() => setDebugOpen(true)}
        >
          <CirclePlay className="h-4 w-4" />
          调试
        </Button>
      </div>

      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/60">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-800">智能体名称</Label>
          <Input
            value={agent.name}
            onChange={(event) => onChange({ name: event.target.value })}
            className="h-10 rounded-lg border-slate-200 bg-slate-50/40"
          />
        </div>
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-900">模型配置</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-800">主力模型</Label>
              <Select
                value={agent.primaryModel ?? PRESET_MODEL_IDS[0]}
                options={MODEL_OPTIONS}
                onValueChange={(primaryModel) => onChange({ primaryModel })}
                className="h-10 rounded-lg border-slate-200 bg-slate-50/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-800">评测模型</Label>
              <Select
                value={agent.fallbackModel ?? PRESET_MODEL_IDS[1] ?? PRESET_MODEL_IDS[0]}
                options={MODEL_OPTIONS}
                onValueChange={(fallbackModel) => onChange({ fallbackModel })}
                className="h-10 rounded-lg border-slate-200 bg-slate-50/40"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-800">提示词</Label>
          <Textarea
            value={agent.prompt ?? ""}
            onChange={(event) => onChange({ prompt: event.target.value })}
            placeholder="请输入智能体提示词..."
            className="min-h-[180px] rounded-lg border-slate-200 bg-slate-50/40"
          />
        </div>
      </div>

      <MultiAgentAgentResources
        resources={agent.resources ?? EMPTY_AGENT_RESOURCES}
        onChange={(resources) => onChange({ resources })}
      />

      <SingleAgentDebugDialog
        open={debugOpen}
        onOpenChange={setDebugOpen}
        agent={debugOpen ? agent : null}
        clawDetail={clawDetail}
      />
    </div>
  );
}
