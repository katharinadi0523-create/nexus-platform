"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronRight, FileStack, Plus, Search, Sparkles, Wrench } from "lucide-react";
import { ClawCapabilitySection } from "@/components/claw-hub-next/detail/capability-section";
import { SkillConfigDialog, type SkillConfigSelection } from "@/components/claw-hub-next/skill-config-dialog";
import { ToolConfigDialog, type ToolConfigSelection } from "@/components/claw-hub-next/tool-config-dialog";
import { KnowledgeConfigDialog, type KnowledgeConfigSelection } from "@/components/claw-hub-next/knowledge-config-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  CapabilityKnowledgeItem,
  CapabilitySkillItem,
  CapabilityToolItem,
  ClawCapabilityConfig,
} from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";

export type AgentScopedResources = {
  skills: CapabilitySkillItem[];
  tools: CapabilityToolItem[];
  knowledge: CapabilityKnowledgeItem[];
};

export const EMPTY_AGENT_RESOURCES: AgentScopedResources = {
  skills: [],
  tools: [],
  knowledge: [],
};

type ResourceAccordionKey = keyof AgentScopedResources;

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

function buildScopedCapabilityConfig(resources: AgentScopedResources): ClawCapabilityConfig {
  return {
    tools: { platform: [], tenant: [], claw: resources.tools },
    skills: { platform: [], tenant: [], claw: resources.skills },
    agents: { platform: [], tenant: [], claw: [] },
    knowledge: { tenant: [], claw: resources.knowledge },
  };
}

function SubAgentKnowledgePanel({
  items,
  onToggle,
  onDelete,
  onSetAllEnabled,
  onOpenConfig,
}: {
  items: CapabilityKnowledgeItem[];
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onSetAllEnabled: (enabled: boolean) => void;
  onOpenConfig: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-base font-semibold text-slate-950">知识</div>
          <div className="text-sm text-slate-400">
            {searchQuery.trim() ? `匹配 ${filtered.length} / ${items.length} 项` : `${items.length} 项`}
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <div className="relative min-w-0 flex-1 sm:max-w-xl">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="输入知识名称或描述检索"
              className="h-9 w-full border-slate-200 bg-white pl-9 shadow-none"
              aria-label="按名称检索知识"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0 rounded-md border-slate-200 bg-white px-3 text-slate-700 shadow-none hover:bg-slate-50"
              disabled={items.length === 0}
              onClick={() => onSetAllEnabled(true)}
            >
              一键启用
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 shrink-0 rounded-md bg-blue-600 px-4 text-white shadow-none hover:bg-blue-700"
              onClick={onOpenConfig}
            >
              <Plus className="h-4 w-4" />
              配置知识
            </Button>
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <section className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">
          <Table className="min-w-[960px]">
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200 hover:bg-slate-50">
                <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">名称</TableHead>
                <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">文档数</TableHead>
                <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">状态</TableHead>
                <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">描述</TableHead>
                <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="border-slate-200 bg-white hover:bg-slate-50/40">
                  <TableCell className="px-4 py-3 align-middle">
                    <div className="text-[15px] font-medium text-slate-900">{item.name}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">
                    {item.documentCount}
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle">
                    <Badge
                      className={cn(
                        item.enabled
                          ? "border-[#d9e1da] bg-[#f5f7f5] text-[#5c6c5f]"
                          : "border-slate-200 bg-slate-100 text-slate-600"
                      )}
                    >
                      {item.enabled ? "已启用" : "已停用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[480px] whitespace-normal px-4 py-3 align-middle text-sm leading-6 text-slate-600">
                    {item.description}
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        移除
                      </button>
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={(checked) => onToggle(item.id, checked)}
                        aria-label={`${item.name} 启停`}
                        className="data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-200"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
          {items.length === 0 ? "当前还没有知识。" : "没有匹配条件的知识。"}
        </div>
      )}
    </div>
  );
}

export type MultiAgentAgentResourcesProps = {
  resources?: AgentScopedResources;
  onChange: (resources: AgentScopedResources) => void;
};

/**
 * 子智能体资源配置：交互与主智能体一致（检索、一键启用、配置、启停、移除），
 * 技能不含「内置技能」分层。
 */
export function MultiAgentAgentResources({ resources, onChange }: MultiAgentAgentResourcesProps) {
  const current = resources ?? EMPTY_AGENT_RESOURCES;
  const capabilityConfig = useMemo(() => buildScopedCapabilityConfig(current), [current]);
  const [openResources, setOpenResources] = useState<Record<ResourceAccordionKey, boolean>>({
    skills: false,
    tools: false,
    knowledge: false,
  });
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [toolDialogOpen, setToolDialogOpen] = useState(false);
  const [knowledgeDialogOpen, setKnowledgeDialogOpen] = useState(false);
  const [skillScope, setSkillScope] = useState<"preset" | "claw">("claw");
  const [toolScope, setToolScope] = useState<"preset" | "claw">("claw");

  const toggleResource = (key: ResourceAccordionKey) => {
    setOpenResources((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateSkills = (skills: CapabilitySkillItem[]) => onChange({ ...current, skills });
  const updateTools = (tools: CapabilityToolItem[]) => onChange({ ...current, tools });
  const updateKnowledge = (knowledge: CapabilityKnowledgeItem[]) => onChange({ ...current, knowledge });

  const mergeSkills = (selections: SkillConfigSelection[]) => {
    const map = new Map(current.skills.map((item) => [item.id, item]));
    selections.forEach((item) => map.set(item.id, { ...item, enabled: true }));
    updateSkills([...map.values()]);
    setSkillDialogOpen(false);
  };

  const mergeTools = (selections: ToolConfigSelection[]) => {
    const map = new Map(current.tools.map((item) => [item.id, item]));
    selections.forEach((item) =>
      map.set(item.id, {
        ...item,
        enabled: true,
        kind: item.kind,
        meta:
          item.kind === "plugin"
            ? "OpenAPI"
            : item.kind === "ontology_action"
              ? "本体动作"
              : item.kind.toUpperCase(),
      })
    );
    updateTools([...map.values()]);
    setToolDialogOpen(false);
  };

  const mergeKnowledge = (selections: KnowledgeConfigSelection[]) => {
    const map = new Map(current.knowledge.map((item) => [item.id, item]));
    selections.forEach((item) => map.set(item.id, { ...item, enabled: true }));
    updateKnowledge([...map.values()]);
    setKnowledgeDialogOpen(false);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="text-sm font-semibold text-slate-900">资源</div>
        <ResourceAccordion
          title="技能"
          icon={Sparkles}
          open={openResources.skills}
          onOpenChange={() => toggleResource("skills")}
        >
          <ClawCapabilitySection
            panel="skills"
            capabilityConfig={capabilityConfig}
            toolScope={toolScope}
            onToolScopeChange={setToolScope}
            skillScope={skillScope}
            onSkillScopeChange={setSkillScope}
            hideSkillPreset
            onOpenToolConfigDialog={() => setToolDialogOpen(true)}
            onOpenSkillConfigDialog={() => setSkillDialogOpen(true)}
            onSetAllSkillsEnabled={(enabled) =>
              updateSkills(current.skills.map((item) => ({ ...item, enabled })))
            }
            onToggleSkill={(_scope, id, enabled) =>
              updateSkills(current.skills.map((item) => (item.id === id ? { ...item, enabled } : item)))
            }
            onDeleteSkill={(_scope, id) => updateSkills(current.skills.filter((item) => item.id !== id))}
            onToggleTool={() => undefined}
            onDeleteTool={() => undefined}
          />
        </ResourceAccordion>
        <ResourceAccordion
          title="插件"
          icon={Wrench}
          open={openResources.tools}
          onOpenChange={() => toggleResource("tools")}
        >
          <ClawCapabilitySection
            panel="tools"
            capabilityConfig={capabilityConfig}
            toolScope={toolScope}
            onToolScopeChange={setToolScope}
            skillScope={skillScope}
            onSkillScopeChange={setSkillScope}
            hideToolOriginFilter
            onOpenToolConfigDialog={() => setToolDialogOpen(true)}
            onOpenSkillConfigDialog={() => setSkillDialogOpen(true)}
            onSetAllToolsEnabled={(enabled) =>
              updateTools(current.tools.map((item) => ({ ...item, enabled })))
            }
            onToggleTool={(_scope, id, enabled) =>
              updateTools(current.tools.map((item) => (item.id === id ? { ...item, enabled } : item)))
            }
            onDeleteTool={(_scope, id) => updateTools(current.tools.filter((item) => item.id !== id))}
            onToggleSkill={() => undefined}
            onDeleteSkill={() => undefined}
          />
        </ResourceAccordion>
        <ResourceAccordion
          title="知识"
          icon={FileStack}
          open={openResources.knowledge}
          onOpenChange={() => toggleResource("knowledge")}
        >
          <SubAgentKnowledgePanel
            items={current.knowledge}
            onToggle={(id, enabled) =>
              updateKnowledge(
                current.knowledge.map((item) => (item.id === id ? { ...item, enabled } : item))
              )
            }
            onDelete={(id) => updateKnowledge(current.knowledge.filter((item) => item.id !== id))}
            onSetAllEnabled={(enabled) =>
              updateKnowledge(current.knowledge.map((item) => ({ ...item, enabled })))
            }
            onOpenConfig={() => setKnowledgeDialogOpen(true)}
          />
        </ResourceAccordion>
      </div>

      <SkillConfigDialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen} onConfirm={mergeSkills} />
      <ToolConfigDialog open={toolDialogOpen} onOpenChange={setToolDialogOpen} onConfirm={mergeTools} />
      <KnowledgeConfigDialog
        open={knowledgeDialogOpen}
        onOpenChange={setKnowledgeDialogOpen}
        onConfirm={mergeKnowledge}
      />
    </>
  );
}
