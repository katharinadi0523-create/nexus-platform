"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight, FileStack, Plus, Sparkles, Trash2, Wrench } from "lucide-react";
import { ModelSelector, type ModelParams } from "@/components/agent-editor/ModelSelector";
import { ClawCapabilitySection } from "@/components/claw-hub-next/detail/capability-section";
import { ClawKnowledgeAssetsSection } from "@/components/claw-hub-next/detail/claw-knowledge-assets-section";
import { SectionCard } from "@/components/claw-hub-next/detail/section-card";
import type {
  CapabilityPanelKey,
  KnowledgePanelKey,
  ToolSkillViewScope,
} from "@/components/claw-hub-next/detail/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  CapabilityScope,
  ClawCapabilityConfig,
  ClawKnowledgeAssets,
} from "@/lib/mock/claw-hub-next";
import type { ModelParamKey } from "@/lib/model-schemas";
import { cn } from "@/lib/utils";
import { useWorkbenchEntity } from "@/components/claw-hub-next/workbench-entity-context";

type FallbackModelRow = {
  id: string;
  model: string;
  params: ModelParams;
};

type ResourceAccordionKey = "skills" | "tools" | "knowledge";

function ResourceAccordion({
  title,
  icon: Icon,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  icon: typeof Sparkles;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="text-sm font-semibold text-slate-900">{title}</span>
        </div>
        <ChevronRight
          className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-90")}
        />
      </button>
      {open ? <div className="border-t border-slate-200 px-4 py-4">{children}</div> : null}
    </div>
  );
}

export type MultiAgentMainAgentConfigProps = {
  agentName: string;
  onAgentNameChange: (name: string) => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  primaryModel: string;
  primaryModelParams: ModelParams;
  fallbackModels: FallbackModelRow[];
  hiddenModelParamKeys: readonly ModelParamKey[];
  onPrimaryModelChange: (model: string) => void;
  onPrimaryModelParamsChange: (params: ModelParams) => void;
  onAddFallbackModel: () => void;
  onRemoveFallbackModel: (rowId: string) => void;
  onFallbackModelChange: (rowId: string, model: string) => void;
  onFallbackModelParamsChange: (rowId: string, params: ModelParams) => void;
  isFallbackModelDuplicate: (rowIndex: number) => boolean;
  capabilityConfig: ClawCapabilityConfig;
  toolScope: ToolSkillViewScope;
  onToolScopeChange: (scope: ToolSkillViewScope) => void;
  skillScope: ToolSkillViewScope;
  onSkillScopeChange: (scope: ToolSkillViewScope) => void;
  onOpenToolConfigDialog: () => void;
  onOpenSkillConfigDialog: () => void;
  onSetAllSkillsEnabled: (enabled: boolean) => void;
  onSetAllToolsEnabled: (enabled: boolean) => void;
  onToggleTool: (scope: CapabilityScope, id: string, enabled: boolean) => void;
  onDeleteTool: (scope: CapabilityScope, id: string) => void;
  onToggleSkill: (scope: CapabilityScope, id: string, enabled: boolean) => void;
  onDeleteSkill: (scope: CapabilityScope, id: string) => void;
  activeKnowledgePanel: KnowledgePanelKey;
  onActiveKnowledgePanelChange: (panel: KnowledgePanelKey) => void;
  knowledgeAssets: ClawKnowledgeAssets;
  onDeleteKnowledgeBase: (id: string) => void;
  onDeleteDatabase: (id: string) => void;
  onDeleteOntology: (id: string) => void;
  onDeleteTermBank: (id: string) => void;
  onOpenKnowledgeBaseConfig: () => void;
  onOpenDatabaseConfig: () => void;
  onOpenOntologyConfig: () => void;
  onOpenTermBankConfig: () => void;
};

/**
 * 选中「主智能体」后的右侧配置：名称 + 模型 + 提示词 + 可折叠资源。
 */
export function MultiAgentMainAgentConfig({
  agentName,
  onAgentNameChange,
  prompt,
  onPromptChange,
  primaryModel,
  primaryModelParams,
  fallbackModels,
  hiddenModelParamKeys,
  onPrimaryModelChange,
  onPrimaryModelParamsChange,
  onAddFallbackModel,
  onRemoveFallbackModel,
  onFallbackModelChange,
  onFallbackModelParamsChange,
  isFallbackModelDuplicate,
  capabilityConfig,
  toolScope,
  onToolScopeChange,
  skillScope,
  onSkillScopeChange,
  onOpenToolConfigDialog,
  onOpenSkillConfigDialog,
  onSetAllSkillsEnabled,
  onSetAllToolsEnabled,
  onToggleTool,
  onDeleteTool,
  onToggleSkill,
  onDeleteSkill,
  activeKnowledgePanel,
  onActiveKnowledgePanelChange,
  knowledgeAssets,
  onDeleteKnowledgeBase,
  onDeleteDatabase,
  onDeleteOntology,
  onDeleteTermBank,
  onOpenKnowledgeBaseConfig,
  onOpenDatabaseConfig,
  onOpenOntologyConfig,
  onOpenTermBankConfig,
}: MultiAgentMainAgentConfigProps) {
  const { entityLabel } = useWorkbenchEntity();
  const [openResources, setOpenResources] = useState<Record<ResourceAccordionKey, boolean>>({
    skills: false,
    tools: false,
    knowledge: false,
  });

  const toggleResource = (key: ResourceAccordionKey) => {
    setOpenResources((current) => ({ ...current, [key]: !current[key] }));
  };

  const renderCapability = (panel: CapabilityPanelKey) => (
    <ClawCapabilitySection
      panel={panel}
      capabilityConfig={capabilityConfig}
      toolScope={toolScope}
      onToolScopeChange={onToolScopeChange}
      skillScope={skillScope}
      onSkillScopeChange={onSkillScopeChange}
      onOpenToolConfigDialog={onOpenToolConfigDialog}
      onOpenSkillConfigDialog={onOpenSkillConfigDialog}
      onSetAllSkillsEnabled={onSetAllSkillsEnabled}
      onSetAllToolsEnabled={onSetAllToolsEnabled}
      onToggleTool={onToggleTool}
      onDeleteTool={onDeleteTool}
      onToggleSkill={onToggleSkill}
      onDeleteSkill={onDeleteSkill}
    />
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/60">
        <div className="space-y-2">
          <Label htmlFor="multi-agent-main-name" className="text-sm font-medium text-slate-800">
            智能体名称
          </Label>
          <Input
            id="multi-agent-main-name"
            value={agentName}
            onChange={(event) => onAgentNameChange(event.target.value)}
            placeholder="请输入主智能体名称"
            className="h-10 rounded-lg border-slate-200 bg-slate-50/40"
          />
        </div>
      </div>

      <SectionCard title="模型配置" description={`配置 ${entityLabel} 的主力模型和 Fallback 顺序。`}>
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="grid gap-0 md:grid-cols-2 md:divide-x md:divide-slate-200">
            <div className="space-y-3 p-5">
              <Label className="text-sm font-medium text-slate-800">
                <span className="text-rose-500" aria-hidden>
                  *
                </span>
                主力模型
              </Label>
              <ModelSelector
                selectedModel={primaryModel}
                modelParams={primaryModelParams}
                onModelChange={onPrimaryModelChange}
                onParamsChange={onPrimaryModelParamsChange}
                presetOnly
                hiddenParamKeys={hiddenModelParamKeys}
                triggerClassName="w-full min-w-0 justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 hover:bg-slate-50"
              />
            </div>
            <div className="space-y-3 border-t border-slate-200 p-5 md:border-t-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Label className="text-sm font-medium text-slate-800">Fallback 模型</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-md border-slate-200 bg-white shadow-none"
                  onClick={onAddFallbackModel}
                >
                  <Plus className="h-4 w-4" />
                  添加
                </Button>
              </div>

              {fallbackModels.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-800">
                  暂无 Fallback，请点击「添加」加入降级模型。
                </div>
              ) : (
                <ul className="space-y-3">
                  {fallbackModels.map((row, index) => {
                    const duplicate = isFallbackModelDuplicate(index);
                    return (
                      <li
                        key={row.id}
                        className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/30 p-3 sm:flex-row sm:items-start sm:gap-2"
                      >
                        <span className="shrink-0 text-xs font-medium text-slate-500 sm:w-6 sm:pt-1">
                          {index + 1}.
                        </span>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <ModelSelector
                            selectedModel={row.model}
                            modelParams={row.params}
                            onModelChange={(model) => onFallbackModelChange(row.id, model)}
                            onParamsChange={(params) => onFallbackModelParamsChange(row.id, params)}
                            presetOnly
                            hiddenParamKeys={hiddenModelParamKeys}
                            triggerClassName={cn(
                              "w-full min-w-0 justify-between rounded-lg bg-white px-3 py-2.5",
                              duplicate
                                ? "border-2 border-red-500 hover:bg-red-50/40"
                                : "border border-slate-200 hover:bg-slate-50"
                            )}
                          />
                          {duplicate ? (
                            <p className="text-xs leading-5 text-red-600" role="status">
                              与已选模型重复，建议选择不同模型作为fallback模型
                            </p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 self-start text-slate-500 hover:text-red-600"
                          onClick={() => onRemoveFallbackModel(row.id)}
                          aria-label={`移除第 ${index + 1} 条 Fallback 模型`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/60">
        <div className="space-y-2">
          <Label htmlFor="multi-agent-main-prompt" className="text-sm font-medium text-slate-800">
            提示词
          </Label>
          <Textarea
            id="multi-agent-main-prompt"
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="请输入智能体提示词..."
            className="min-h-[180px] rounded-lg border-slate-200 bg-slate-50/40"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-slate-900">资源</div>
        <ResourceAccordion
          title="技能"
          icon={Sparkles}
          open={openResources.skills}
          onOpenChange={() => toggleResource("skills")}
        >
          {renderCapability("skills")}
        </ResourceAccordion>
        <ResourceAccordion
          title="插件"
          icon={Wrench}
          open={openResources.tools}
          onOpenChange={() => toggleResource("tools")}
        >
          {renderCapability("tools")}
        </ResourceAccordion>
        <ResourceAccordion
          title="知识"
          icon={FileStack}
          open={openResources.knowledge}
          onOpenChange={() => toggleResource("knowledge")}
        >
          <ClawKnowledgeAssetsSection
            activePanel={activeKnowledgePanel}
            onActivePanelChange={onActiveKnowledgePanelChange}
            assets={knowledgeAssets}
            onDeleteKnowledgeBase={onDeleteKnowledgeBase}
            onDeleteDatabase={onDeleteDatabase}
            onDeleteOntology={onDeleteOntology}
            onDeleteTermBank={onDeleteTermBank}
            onOpenKnowledgeBaseConfig={onOpenKnowledgeBaseConfig}
            onOpenDatabaseConfig={onOpenDatabaseConfig}
            onOpenOntologyConfig={onOpenOntologyConfig}
            onOpenTermBankConfig={onOpenTermBankConfig}
          />
        </ResourceAccordion>
      </div>
    </div>
  );
}
