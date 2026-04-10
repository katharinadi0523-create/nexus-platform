"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  panel: CapabilityPanelKey;
  capabilityConfig: ClawCapabilityConfig;
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
  onOpenKnowledgeConfigDialog: () => void;
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
  panel,
  capabilityConfig,
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
  onOpenKnowledgeConfigDialog,
  onToggleTool,
  onDeleteTool,
  onToggleSkill,
  onDeleteSkill,
  onToggleAgent,
  onDeleteAgent,
  onToggleKnowledge,
  onDeleteKnowledge,
}: CapabilitySectionProps) {
  const toolTotalCount = Object.values(capabilityConfig.tools).reduce((total, items) => total + items.length, 0);
  const skillTotalCount = Object.values(capabilityConfig.skills).reduce((total, items) => total + items.length, 0);
  const agentTotalCount = Object.values(capabilityConfig.agents).reduce((total, items) => total + items.length, 0);
  const knowledgeTotalCount = Object.values(capabilityConfig.knowledge).reduce((total, items) => total + items.length, 0);

  return (
    <SectionCard>
      {panel === "tools" ? (
        <CapabilityPanelShell
          title="工具"
          description="管理平台预置、租户配置和 Claw 配置三类工具。"
          totalCount={toolTotalCount}
          actionLabel="配置工具"
          onAction={onOpenToolConfigDialog}
        >
          <CapabilityScopeTabs
            scope={toolScope}
            scopes={["platform", "tenant", "claw"] as CapabilityScope[]}
            counts={capabilityConfig.tools}
            labels={CAPABILITY_SCOPE_LABELS}
            onChange={onToolScopeChange}
            prefix="tools"
          />

          {capabilityConfig.tools[toolScope].length ? (
            <CapabilityTable>
              <Table className="min-w-[960px]">
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-200 hover:bg-slate-50">
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">名称</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">类型</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">状态</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">描述</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
              {capabilityConfig.tools[toolScope].map((item) => (
                    <ToolRow
                      key={item.id}
                      item={item}
                      scope={toolScope}
                      onToggle={onToggleTool}
                      onDelete={onDeleteTool}
                    />
              ))}
                </TableBody>
              </Table>
            </CapabilityTable>
          ) : (
            <EmptyState label="当前分类下还没有工具。" />
          )}
        </CapabilityPanelShell>
      ) : null}

      {panel === "skills" ? (
        <CapabilityPanelShell
          title="技能"
          description="统一管理平台、租户和 Claw 配置的技能清单与状态。"
          totalCount={skillTotalCount}
          actionLabel="配置技能"
          onAction={onOpenSkillConfigDialog}
        >
          <CapabilityScopeTabs
            scope={skillScope}
            scopes={["platform", "tenant", "claw"] as CapabilityScope[]}
            counts={capabilityConfig.skills}
            labels={CAPABILITY_SCOPE_LABELS}
            onChange={onSkillScopeChange}
            prefix="skills"
          />

          {capabilityConfig.skills[skillScope].length ? (
            <CapabilityTable>
              <Table className="min-w-[960px]">
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-200 hover:bg-slate-50">
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">名称</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">大小</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">状态</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">描述</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
              {capabilityConfig.skills[skillScope].map((item) => (
                    <SkillRow
                      key={item.id}
                      item={item}
                      scope={skillScope}
                      onToggle={onToggleSkill}
                      onDelete={onDeleteSkill}
                    />
              ))}
                </TableBody>
              </Table>
            </CapabilityTable>
          ) : (
            <EmptyState label="当前分类下还没有技能。" />
          )}
        </CapabilityPanelShell>
      ) : null}

      {panel === "agents" ? (
        <CapabilityPanelShell
          title="多智能体"
          description="封装平台、租户和 Claw 级别的可调用智能体能力。"
          totalCount={agentTotalCount}
          actionLabel="配置多智能体"
          onAction={() => toast.success("已预留配置多智能体入口。")}
        >
          <CapabilityScopeTabs
            scope={agentScope}
            scopes={["platform", "tenant", "claw"] as CapabilityScope[]}
            counts={capabilityConfig.agents}
            labels={CAPABILITY_SCOPE_LABELS}
            onChange={onAgentScopeChange}
            prefix="agents"
          />

          {capabilityConfig.agents[agentScope].length ? (
            <CapabilityList>
              {capabilityConfig.agents[agentScope].map((item) => (
                <AgentItemCard
                  key={item.id}
                  item={item}
                  scope={agentScope}
                  onToggle={onToggleAgent}
                  onDelete={onDeleteAgent}
                />
              ))}
            </CapabilityList>
          ) : (
            <EmptyState label="当前分类下还没有多智能体。" />
          )}
        </CapabilityPanelShell>
      ) : null}

      {panel === "knowledge" ? (
        <CapabilityPanelShell
          title="知识库"
          description="维护租户和 Claw 两层知识库的启用与绑定状态。"
          totalCount={knowledgeTotalCount}
          actionLabel="配置知识库"
          onAction={onOpenKnowledgeConfigDialog}
        >
          <CapabilityScopeTabs
            scope={knowledgeScope}
            scopes={["tenant", "claw"] as KnowledgeScope[]}
            counts={capabilityConfig.knowledge}
            labels={KNOWLEDGE_SCOPE_LABELS}
            onChange={onKnowledgeScopeChange}
            prefix="knowledge"
          />

          {capabilityConfig.knowledge[knowledgeScope].length ? (
            <CapabilityTable>
              <Table className="min-w-[960px]">
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-200 hover:bg-slate-50">
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">名称</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">文档数</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">状态</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">描述</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">更新时间</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
              {capabilityConfig.knowledge[knowledgeScope].map((item) => (
                    <KnowledgeRow
                      key={item.id}
                      item={item}
                      scope={knowledgeScope}
                      onToggle={onToggleKnowledge}
                      onDelete={onDeleteKnowledge}
                    />
              ))}
                </TableBody>
              </Table>
            </CapabilityTable>
          ) : (
            <EmptyState label="当前分类下还没有知识库。" />
          )}
        </CapabilityPanelShell>
      ) : null}
    </SectionCard>
  );
}

function CapabilityPanelShell({
  title,
  description,
  totalCount,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  description: string;
  totalCount: number;
  actionLabel: string;
  onAction: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-base font-semibold text-slate-950">{title}</div>
            <div className="text-sm text-slate-400">{totalCount} 项</div>
          </div>
          <div className="mt-1 text-sm text-slate-500">{description}</div>
        </div>

        <Button type="button" variant="outline" size="sm" className="rounded-md shadow-none" onClick={onAction}>
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      </div>

      {children}
    </div>
  );
}

function CapabilityList({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-lg border border-slate-200 bg-white divide-y divide-slate-200">{children}</div>;
}

function CapabilityTable({ children }: { children: ReactNode }) {
  return <section className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">{children}</section>;
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
    <div className="overflow-x-auto border-b border-slate-200">
      <div className="flex min-w-max items-center gap-5">
        {scopes.map((currentScope) => (
          <button
            key={`${prefix}-${currentScope}`}
            type="button"
            onClick={() => onChange(currentScope)}
            className={cn(
              "border-b-2 border-transparent px-1 py-3 text-sm font-medium whitespace-nowrap transition-colors",
              scope === currentScope ? "border-slate-950 text-slate-950" : "text-slate-500 hover:text-slate-900"
            )}
          >
            {labels[currentScope]}
            <span className="ml-2 text-xs text-slate-400">{counts[currentScope].length}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
      {label}
    </div>
  );
}

function ItemStatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge className={cn(enabled ? "border-[#d9e1da] bg-[#f5f7f5] text-[#5c6c5f]" : "border-slate-200 bg-slate-100 text-slate-600")}>
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
      className="text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      onClick={onDelete}
    >
      删除
    </Button>
  );
}

function ToolRow({
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
    <TableRow className="border-slate-200 bg-white hover:bg-slate-50/40">
      <TableCell className="px-4 py-3 align-middle">
        <div className="text-[15px] font-medium text-slate-900">{item.name}</div>
      </TableCell>
      <TableCell className="px-4 py-3 align-middle">
        <div className="flex flex-wrap items-center gap-2">
          {item.badge ? <Badge className="border-slate-200 bg-slate-100 text-slate-600">{item.badge}</Badge> : null}
          {item.meta ? <span className="text-sm text-slate-500">{item.meta}</span> : null}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 align-middle">
        <ItemStatusBadge enabled={item.enabled} />
      </TableCell>
      <TableCell className="max-w-[480px] whitespace-normal px-4 py-3 align-middle text-sm leading-6 text-slate-600">
        {item.description}
      </TableCell>
      <TableCell className="px-4 py-3 align-middle">
        <CapabilityRowActions
          canDelete={canDeleteCapability(scope)}
          enabled={item.enabled}
          onDelete={() => onDelete(scope, item.id)}
          onToggle={(checked) => onToggle(scope, item.id, checked)}
          switchAriaLabel={`${item.name} 开关`}
        />
      </TableCell>
    </TableRow>
  );
}

function SkillRow({
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
    <TableRow className="border-slate-200 bg-white hover:bg-slate-50/40">
      <TableCell className="px-4 py-3 align-middle">
        <div className="text-[15px] font-medium text-slate-900">{item.name}</div>
      </TableCell>
      <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">{item.sizeLabel}</TableCell>
      <TableCell className="px-4 py-3 align-middle">
        <ItemStatusBadge enabled={item.enabled} />
      </TableCell>
      <TableCell className="max-w-[480px] whitespace-normal px-4 py-3 align-middle text-sm leading-6 text-slate-600">
        {item.description}
      </TableCell>
      <TableCell className="px-4 py-3 align-middle">
        <CapabilityRowActions
          canDelete={canDeleteCapability(scope)}
          enabled={item.enabled}
          onDelete={() => onDelete(scope, item.id)}
          onToggle={(checked) => onToggle(scope, item.id, checked)}
          switchAriaLabel={`${item.name} 开关`}
        />
      </TableCell>
    </TableRow>
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
    <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold text-slate-950">{item.name}</div>
          <Badge className="border-[#d8e0ea] bg-[#f5f7fb] text-[#596b86]">{item.target}</Badge>
        </div>
        <div className="mt-2 text-sm leading-6 text-slate-600">{item.description}</div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3 lg:justify-end">
        <ItemStatusBadge enabled={item.enabled} />
        <DeleteItemButton canDelete={canDeleteCapability(scope)} onDelete={() => onDelete(scope, item.id)} />
        <Switch checked={item.enabled} onCheckedChange={(checked) => onToggle(scope, item.id, checked)} aria-label={`${item.name} 开关`} />
      </div>
    </div>
  );
}

function KnowledgeRow({
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
    <TableRow className="border-slate-200 bg-white hover:bg-slate-50/40">
      <TableCell className="px-4 py-3 align-middle">
        <div className="text-[15px] font-medium text-slate-900">{item.name}</div>
      </TableCell>
      <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">{item.documentCount}</TableCell>
      <TableCell className="px-4 py-3 align-middle">
        <ItemStatusBadge enabled={item.enabled} />
      </TableCell>
      <TableCell className="max-w-[420px] whitespace-normal px-4 py-3 align-middle text-sm leading-6 text-slate-600">
        {item.description}
      </TableCell>
      <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">{item.updatedAt}</TableCell>
      <TableCell className="px-4 py-3 align-middle">
        <CapabilityRowActions
          canDelete={canDeleteCapability(scope)}
          enabled={item.enabled}
          onDelete={() => onDelete(scope, item.id)}
          onToggle={(checked) => onToggle(scope, item.id, checked)}
          switchAriaLabel={`${item.name} 开关`}
        />
      </TableCell>
    </TableRow>
  );
}

function CapabilityRowActions({
  canDelete,
  enabled,
  onDelete,
  onToggle,
  switchAriaLabel,
}: {
  canDelete: boolean;
  enabled: boolean;
  onDelete: () => void;
  onToggle: (checked: boolean) => void;
  switchAriaLabel: string;
}) {
  return (
    <div className="flex items-center gap-4">
      {canDelete ? (
        <button type="button" onClick={onDelete} className="text-sm text-blue-600 hover:text-blue-700">
          删除
        </button>
      ) : null}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">{enabled ? "启用" : "停用"}</span>
        <Switch checked={enabled} onCheckedChange={onToggle} aria-label={switchAriaLabel} />
      </div>
    </div>
  );
}
