"use client";

import type { ComponentType } from "react";
import { Bot, ChevronRight, FileStack, Plus, Sparkles, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type {
  CapabilityAgentItem,
  CapabilityKnowledgeItem,
  CapabilityScope,
  CapabilitySkillItem,
  CapabilityToolItem,
  ClawCapabilityConfig,
  KnowledgeScope,
} from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";
import {
  CAPABILITY_SCOPE_LABELS,
  KNOWLEDGE_SCOPE_LABELS,
  type CapabilityPanelKey,
} from "./constants";
import { SectionCard } from "./section-card";
import { canDeleteCapability } from "./utils";

type CapabilitySectionProps = {
  capabilityConfig: ClawCapabilityConfig;
  activeCapabilityPanel: CapabilityPanelKey;
  onActiveCapabilityPanelChange: (panel: CapabilityPanelKey) => void;
  toolScope: CapabilityScope;
  onToolScopeChange: (scope: CapabilityScope) => void;
  skillScope: CapabilityScope;
  onSkillScopeChange: (scope: CapabilityScope) => void;
  agentScope: CapabilityScope;
  onAgentScopeChange: (scope: CapabilityScope) => void;
  knowledgeScope: KnowledgeScope;
  onKnowledgeScopeChange: (scope: KnowledgeScope) => void;
  onOpenToolConfigDialog: () => void;
  onOpenSkillConfigDialog: () => void;
  onToggleTool: (scope: CapabilityScope, id: string, enabled: boolean) => void;
  onDeleteTool: (scope: CapabilityScope, id: string) => void;
  onToggleSkill: (scope: CapabilityScope, id: string, enabled: boolean) => void;
  onDeleteSkill: (scope: CapabilityScope, id: string) => void;
  onToggleAgent: (scope: CapabilityScope, id: string, enabled: boolean) => void;
  onDeleteAgent: (scope: CapabilityScope, id: string) => void;
  onToggleKnowledge: (scope: KnowledgeScope, id: string, enabled: boolean) => void;
  onDeleteKnowledge: (scope: KnowledgeScope, id: string) => void;
};

export function ClawCapabilitySection({
  capabilityConfig,
  activeCapabilityPanel,
  onActiveCapabilityPanelChange,
  toolScope,
  onToolScopeChange,
  skillScope,
  onSkillScopeChange,
  agentScope,
  onAgentScopeChange,
  knowledgeScope,
  onKnowledgeScopeChange,
  onOpenToolConfigDialog,
  onOpenSkillConfigDialog,
  onToggleTool,
  onDeleteTool,
  onToggleSkill,
  onDeleteSkill,
  onToggleAgent,
  onDeleteAgent,
  onToggleKnowledge,
  onDeleteKnowledge,
}: CapabilitySectionProps) {
  const capabilityPanels: Array<{
    key: CapabilityPanelKey;
    title: string;
    description: string;
    count: number;
    icon: ComponentType<{ className?: string }>;
  }> = [
    {
      key: "tools",
      title: "工具配置",
      description: "管理平台预置、租户配置和 Claw 配置三类工具。",
      count: Object.values(capabilityConfig.tools).reduce((total, items) => total + items.length, 0),
      icon: Wrench,
    },
    {
      key: "skills",
      title: "技能配置",
      description: "统一管理平台、租户和 Claw 的技能清单与状态。",
      count: Object.values(capabilityConfig.skills).reduce((total, items) => total + items.length, 0),
      icon: Sparkles,
    },
    {
      key: "agents",
      title: "Agent（as Function）",
      description: "封装平台、租户和 Claw 级别的可调用 Agent 能力。",
      count: Object.values(capabilityConfig.agents).reduce((total, items) => total + items.length, 0),
      icon: Bot,
    },
    {
      key: "knowledge",
      title: "知识",
      description: "维护租户与 Claw 两层知识库的启用和绑定状态。",
      count: Object.values(capabilityConfig.knowledge).reduce((total, items) => total + items.length, 0),
      icon: FileStack,
    },
  ];

  return (
    <SectionCard title="能力配置" description="能力配置包括工具配置、技能配置、Agent（as Function）和知识。">
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {capabilityPanels.map((panel) => {
            const Icon = panel.icon;
            const isActive = activeCapabilityPanel === panel.key;

            return (
              <button
                key={panel.key}
                type="button"
                onClick={() => onActiveCapabilityPanelChange(panel.key)}
                className={cn(
                  "group rounded-[24px] border p-4 text-left transition-all",
                  isActive
                    ? "border-sky-200 bg-[linear-gradient(180deg,rgba(240,249,255,0.92),rgba(255,255,255,0.98))] shadow-[0_16px_36px_-28px_rgba(14,165,233,0.5)]"
                    : "border-slate-200 bg-slate-50/70 hover:border-sky-100 hover:bg-white"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-[18px] border bg-white text-sky-700 shadow-sm shadow-sky-100/50",
                      isActive ? "border-sky-200" : "border-sky-100"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge className={cn(isActive ? "border-sky-200 bg-white text-sky-700" : "border-slate-200 bg-white text-slate-500")}>
                    {panel.count} 项
                  </Badge>
                </div>

                <div className="mt-4">
                  <div className="text-base font-semibold text-slate-950">{panel.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">{panel.description}</div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-medium">
                  <span className={isActive ? "text-sky-700" : "text-slate-400"}>{isActive ? "当前展开" : "点击查看详情"}</span>
                  <ChevronRight className={cn("h-4 w-4 transition-transform", isActive ? "text-sky-600" : "text-slate-300 group-hover:text-slate-500")} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0.98))] p-5">
          {activeCapabilityPanel === "tools" ? (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-sky-100 bg-white text-sky-700 shadow-sm shadow-sky-100/50">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-950">工具配置</div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">平台预置、租户配置、Claw 配置三类工具统一在这里管理。</div>
                  </div>
                </div>

                <Button type="button" variant="outline" size="sm" onClick={onOpenToolConfigDialog}>
                  <Plus className="h-4 w-4" />
                  配置工具
                </Button>
              </div>

              <CapabilityScopeTabs
                scope={toolScope}
                scopes={["platform", "tenant", "claw"] as CapabilityScope[]}
                counts={capabilityConfig.tools}
                labels={CAPABILITY_SCOPE_LABELS}
                onChange={onToolScopeChange}
                prefix="tools"
              />

              <div className="mt-5 space-y-3">
                {capabilityConfig.tools[toolScope].length ? (
                  capabilityConfig.tools[toolScope].map((item) => (
                    <ToolItemCard
                      key={item.id}
                      item={item}
                      scope={toolScope}
                      onToggle={onToggleTool}
                      onDelete={onDeleteTool}
                    />
                  ))
                ) : (
                  <EmptyState label="当前分类下还没有工具。" />
                )}
              </div>
            </div>
          ) : null}

          {activeCapabilityPanel === "skills" ? (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-sky-100 bg-white text-sky-700 shadow-sm shadow-sky-100/50">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-950">技能配置</div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">区分平台预置、租户配置和 Claw 配置的技能清单。</div>
                  </div>
                </div>

                <Button type="button" variant="outline" size="sm" onClick={onOpenSkillConfigDialog}>
                  <Plus className="h-4 w-4" />
                  配置技能
                </Button>
              </div>

              <CapabilityScopeTabs
                scope={skillScope}
                scopes={["platform", "tenant", "claw"] as CapabilityScope[]}
                counts={capabilityConfig.skills}
                labels={CAPABILITY_SCOPE_LABELS}
                onChange={onSkillScopeChange}
                prefix="skills"
              />

              <div className="mt-5 space-y-3">
                {capabilityConfig.skills[skillScope].length ? (
                  capabilityConfig.skills[skillScope].map((item) => (
                    <SkillItemCard
                      key={item.id}
                      item={item}
                      scope={skillScope}
                      onToggle={onToggleSkill}
                      onDelete={onDeleteSkill}
                    />
                  ))
                ) : (
                  <EmptyState label="当前分类下还没有技能。" />
                )}
              </div>
            </div>
          ) : null}

          {activeCapabilityPanel === "agents" ? (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-sky-100 bg-white text-sky-700 shadow-sm shadow-sky-100/50">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-950">Agent（as Function）</div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">把平台、租户和 Claw 级别的 Agent 能力封装成可调用函数。</div>
                  </div>
                </div>

                <Button type="button" variant="outline" size="sm" onClick={() => toast.success("已预留配置 Agent 入口。")}>
                  <Plus className="h-4 w-4" />
                  配置Agent
                </Button>
              </div>

              <CapabilityScopeTabs
                scope={agentScope}
                scopes={["platform", "tenant", "claw"] as CapabilityScope[]}
                counts={capabilityConfig.agents}
                labels={CAPABILITY_SCOPE_LABELS}
                onChange={onAgentScopeChange}
                prefix="agents"
              />

              <div className="mt-5 space-y-3">
                {capabilityConfig.agents[agentScope].length ? (
                  capabilityConfig.agents[agentScope].map((item) => (
                    <AgentItemCard
                      key={item.id}
                      item={item}
                      scope={agentScope}
                      onToggle={onToggleAgent}
                      onDelete={onDeleteAgent}
                    />
                  ))
                ) : (
                  <EmptyState label="当前分类下还没有 Agent。" />
                )}
              </div>
            </div>
          ) : null}

          {activeCapabilityPanel === "knowledge" ? (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-sky-100 bg-white text-sky-700 shadow-sm shadow-sky-100/50">
                    <FileStack className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-950">知识</div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">知识分为租户配置和 Claw 配置两层，便于统一下发和单独增强。</div>
                  </div>
                </div>

                <Button type="button" variant="outline" size="sm" onClick={() => toast.success("已预留配置知识入口。")}>
                  <Plus className="h-4 w-4" />
                  配置知识
                </Button>
              </div>

              <CapabilityScopeTabs
                scope={knowledgeScope}
                scopes={["tenant", "claw"] as KnowledgeScope[]}
                counts={capabilityConfig.knowledge}
                labels={KNOWLEDGE_SCOPE_LABELS}
                onChange={onKnowledgeScopeChange}
                prefix="knowledge"
              />

              <div className="mt-5 space-y-3">
                {capabilityConfig.knowledge[knowledgeScope].length ? (
                  capabilityConfig.knowledge[knowledgeScope].map((item) => (
                    <KnowledgeItemCard
                      key={item.id}
                      item={item}
                      scope={knowledgeScope}
                      onToggle={onToggleKnowledge}
                      onDelete={onDeleteKnowledge}
                    />
                  ))
                ) : (
                  <EmptyState label="当前分类下还没有知识库。" />
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}

function CapabilityScopeTabs<ScopeKey extends string>({
  scope,
  scopes,
  counts,
  labels,
  onChange,
  prefix,
}: {
  scope: ScopeKey;
  scopes: ScopeKey[];
  counts: Record<ScopeKey, Array<unknown>>;
  labels: Record<ScopeKey, string>;
  onChange: (scope: ScopeKey) => void;
  prefix: string;
}) {
  return (
    <div
      className={cn(
        "mt-5 grid gap-2 rounded-[18px] bg-slate-100/80 p-1",
        scopes.length === 2 ? "grid-cols-2" : "grid-cols-3"
      )}
    >
      {scopes.map((currentScope) => (
        <button
          key={`${prefix}-${currentScope}`}
          type="button"
          onClick={() => onChange(currentScope)}
          className={cn(
            "rounded-[14px] px-3 py-2 text-sm font-medium transition-all",
            scope === currentScope ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
          )}
        >
          {labels[currentScope]} ({counts[currentScope].length})
        </button>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/80 px-4 py-8 text-center text-sm text-slate-400">
      {label}
    </div>
  );
}

function ItemStatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge className={cn(enabled ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600")}>
      {enabled ? "已启用" : "已停用"}
    </Badge>
  );
}

function DeleteItemButton({
  canDelete,
  onDelete,
}: {
  canDelete: boolean;
  onDelete: () => void;
}) {
  if (!canDelete) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
      onClick={onDelete}
    >
      删除
    </Button>
  );
}

function ToolItemCard({
  item,
  scope,
  onToggle,
  onDelete,
}: {
  item: CapabilityToolItem;
  scope: CapabilityScope;
  onToggle: (scope: CapabilityScope, id: string, enabled: boolean) => void;
  onDelete: (scope: CapabilityScope, id: string) => void;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold text-slate-950">{item.name}</div>
            {item.badge ? <Badge className="border-slate-200 bg-slate-100 text-slate-600">{item.badge}</Badge> : null}
          </div>
          {item.meta ? (
            <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{item.meta}</div>
          ) : null}
          <div className="mt-2 text-sm leading-7 text-slate-600">{item.description}</div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <ItemStatusBadge enabled={item.enabled} />
          <DeleteItemButton canDelete={canDeleteCapability(scope)} onDelete={() => onDelete(scope, item.id)} />
          <Switch checked={item.enabled} onCheckedChange={(checked) => onToggle(scope, item.id, checked)} aria-label={`${item.name} 开关`} />
        </div>
      </div>
    </div>
  );
}

function SkillItemCard({
  item,
  scope,
  onToggle,
  onDelete,
}: {
  item: CapabilitySkillItem;
  scope: CapabilityScope;
  onToggle: (scope: CapabilityScope, id: string, enabled: boolean) => void;
  onDelete: (scope: CapabilityScope, id: string) => void;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-slate-300">/</span>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-slate-950">{item.name}</div>
              <div className="mt-2 text-sm leading-7 text-slate-600">{item.description}</div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm text-slate-400">{item.sizeLabel}</span>
          <ItemStatusBadge enabled={item.enabled} />
          <DeleteItemButton canDelete={canDeleteCapability(scope)} onDelete={() => onDelete(scope, item.id)} />
          <Switch checked={item.enabled} onCheckedChange={(checked) => onToggle(scope, item.id, checked)} aria-label={`${item.name} 开关`} />
        </div>
      </div>
    </div>
  );
}

function AgentItemCard({
  item,
  scope,
  onToggle,
  onDelete,
}: {
  item: CapabilityAgentItem;
  scope: CapabilityScope;
  onToggle: (scope: CapabilityScope, id: string, enabled: boolean) => void;
  onDelete: (scope: CapabilityScope, id: string) => void;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold text-slate-950">{item.name}</div>
            <Badge className="border-sky-100 bg-sky-50 text-sky-700">{item.target}</Badge>
          </div>
          <div className="mt-2 text-sm leading-7 text-slate-600">{item.description}</div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ItemStatusBadge enabled={item.enabled} />
          <DeleteItemButton canDelete={canDeleteCapability(scope)} onDelete={() => onDelete(scope, item.id)} />
          <Switch checked={item.enabled} onCheckedChange={(checked) => onToggle(scope, item.id, checked)} aria-label={`${item.name} 开关`} />
        </div>
      </div>
    </div>
  );
}

function KnowledgeItemCard({
  item,
  scope,
  onToggle,
  onDelete,
}: {
  item: CapabilityKnowledgeItem;
  scope: KnowledgeScope;
  onToggle: (scope: KnowledgeScope, id: string, enabled: boolean) => void;
  onDelete: (scope: KnowledgeScope, id: string) => void;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-semibold text-slate-950">{item.name}</div>
          <div className="mt-2 text-sm leading-7 text-slate-600">{item.description}</div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ItemStatusBadge enabled={item.enabled} />
          <DeleteItemButton canDelete={canDeleteCapability(scope)} onDelete={() => onDelete(scope, item.id)} />
          <Switch checked={item.enabled} onCheckedChange={(checked) => onToggle(scope, item.id, checked)} aria-label={`${item.name} 开关`} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
        <span>{item.documentCount} 篇文档</span>
        <span>最近更新 {item.updatedAt}</span>
      </div>
    </div>
  );
}
