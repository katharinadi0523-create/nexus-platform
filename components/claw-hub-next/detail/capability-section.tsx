"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Layers, Network, Plus, Puzzle, Search, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  CapabilityScope,
  CapabilitySkillItem,
  CapabilityToolItem,
  CapabilityToolKind,
  ClawCapabilityConfig,
} from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";
import {
  SKILL_VIEW_SCOPE_LABELS,
  type CapabilityPanelKey,
  type ToolSkillViewScope,
} from "./constants";
import { SectionCard } from "./section-card";
import { canDeleteCapability } from "./utils";

type CapabilitySectionProps = {
  panel: CapabilityPanelKey;
  capabilityConfig: ClawCapabilityConfig;
  toolScope: ToolSkillViewScope;
  onToolScopeChange: (scope: ToolSkillViewScope) => void;
  skillScope: ToolSkillViewScope;
  onSkillScopeChange: (scope: ToolSkillViewScope) => void;
  onOpenToolConfigDialog: () => void;
  onOpenSkillConfigDialog: () => void;
  onSetAllToolsEnabled?: (enabled: boolean) => void;
  onSetAllSkillsEnabled?: (enabled: boolean) => void;
  onToggleTool: (scope: CapabilityScope, id: string, enabled: boolean) => void;
  onDeleteTool: (scope: CapabilityScope, id: string) => void;
  onToggleSkill: (scope: CapabilityScope, id: string, enabled: boolean) => void;
  onDeleteSkill: (scope: CapabilityScope, id: string) => void;
};

type ToolListRow = {
  item: CapabilityToolItem;
  scope: CapabilityScope;
};

type ToolKindTabKey = CapabilityToolKind;
type ToolKindTab = {
  key: ToolKindTabKey;
  label: string;
  count: number;
};
type ToolOriginFilter = "all" | "builtin" | "claw";

const TOOL_KIND_ORDER: CapabilityToolKind[] = ["plugin", "mcp", "ontology_action", "workflow"];
const TOOL_KIND_META: Record<CapabilityToolKind, { Icon: typeof Network; label: string }> = {
  mcp: { Icon: Network, label: "MCP" },
  plugin: { Icon: Puzzle, label: "OpenAPI" },
  workflow: { Icon: Workflow, label: "工作流" },
  ontology_action: { Icon: Layers, label: "本体动作" },
};

function getToolOrigin(scope: CapabilityScope): Exclude<ToolOriginFilter, "all"> {
  return scope === "claw" ? "claw" : "builtin";
}

export function ClawCapabilitySection({
  panel,
  capabilityConfig,
  skillScope,
  onSkillScopeChange,
  onOpenToolConfigDialog,
  onOpenSkillConfigDialog,
  onSetAllToolsEnabled,
  onSetAllSkillsEnabled,
  onToggleTool,
  onDeleteTool,
  onToggleSkill,
  onDeleteSkill,
}: CapabilitySectionProps) {
  const toolTotalCount = Object.values(capabilityConfig.tools).reduce((total, items) => total + items.length, 0);
  const skillTotalCount = Object.values(capabilityConfig.skills).reduce((total, items) => total + items.length, 0);
  const skillPresetCount =
    capabilityConfig.skills.platform.length + capabilityConfig.skills.tenant.length;

  const [toolSearchQuery, setToolSearchQuery] = useState("");
  const [activeToolKind, setActiveToolKind] = useState<ToolKindTabKey>("plugin");
  const [toolOriginFilter, setToolOriginFilter] = useState<ToolOriginFilter>("all");
  const toolRows = useMemo<ToolListRow[]>(
    () => [
      ...capabilityConfig.tools.platform.map((item) => ({ item, scope: "platform" as const })),
      ...capabilityConfig.tools.tenant.map((item) => ({ item, scope: "tenant" as const })),
      ...capabilityConfig.tools.claw.map((item) => ({ item, scope: "claw" as const })),
    ],
    [capabilityConfig.tools]
  );
  const toolKindTabs = useMemo<ToolKindTab[]>(() => {
    const counts = new Map<CapabilityToolKind, number>();
    toolRows.forEach(({ item }) => {
      const kind = resolveCapabilityToolKind(item);
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
    });

    return TOOL_KIND_ORDER.map((kind) => ({
      key: kind,
      label: TOOL_KIND_META[kind].label,
      count: counts.get(kind) ?? 0,
    }));
  }, [toolRows]);
  const filteredToolRows = useMemo(() => {
    const q = toolSearchQuery.trim().toLowerCase();
    return toolRows.filter(({ item, scope }) => {
      if (resolveCapabilityToolKind(item) !== activeToolKind) {
        return false;
      }
      if (toolOriginFilter !== "all" && getToolOrigin(scope) !== toolOriginFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    });
  }, [activeToolKind, toolOriginFilter, toolRows, toolSearchQuery]);

  const toolSearchMatchTotal = filteredToolRows.length;
  const hasActiveToolFilter =
    Boolean(toolSearchQuery.trim()) || toolOriginFilter !== "all";

  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const filteredSkills = useMemo(() => {
    const q = skillSearchQuery.trim().toLowerCase();
    const match = (item: CapabilitySkillItem) => {
      if (!q) {
        return true;
      }
      return item.name.toLowerCase().includes(q);
    };
    return {
      platform: capabilityConfig.skills.platform.filter(match),
      tenant: capabilityConfig.skills.tenant.filter(match),
      claw: capabilityConfig.skills.claw.filter(match),
    };
  }, [capabilityConfig.skills, skillSearchQuery]);

  const skillSearchMatchTotal =
    filteredSkills.platform.length + filteredSkills.tenant.length + filteredSkills.claw.length;
  const filteredPresetSkillCount = filteredSkills.platform.length + filteredSkills.tenant.length;

  return (
    <SectionCard>
      {panel === "tools" ? (
        <CapabilityPanelShell
          title="插件"
          totalCount={toolTotalCount}
          countLabel={
            hasActiveToolFilter
              ? `匹配 ${toolSearchMatchTotal} / ${toolTotalCount} 项`
              : undefined
          }
          toolbar={
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <div className="relative min-w-0 flex-1 sm:max-w-xl">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  value={toolSearchQuery}
                  onChange={(event) => setToolSearchQuery(event.target.value)}
                  placeholder="输入插件名称或描述检索"
                  className="h-9 w-full border-slate-200 bg-white pl-9 shadow-none"
                  aria-label="按名称检索插件"
                />
              </div>
              <div className="w-full sm:w-[176px]">
                <select
                  value={toolOriginFilter}
                  onChange={(event) => setToolOriginFilter(event.target.value as ToolOriginFilter)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-300"
                  aria-label="按是否内置筛选插件"
                >
                  <option value="all">全部来源</option>
                  <option value="builtin">内置</option>
                  <option value="claw">Claw配置</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                {onSetAllToolsEnabled ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0 rounded-md border-slate-200 bg-white px-3 text-slate-700 shadow-none hover:bg-slate-50"
                    disabled={toolTotalCount === 0}
                    onClick={() => onSetAllToolsEnabled(true)}
                  >
                    一键启用
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  className="h-9 shrink-0 rounded-md bg-blue-600 px-4 text-white shadow-none hover:bg-blue-700"
                  onClick={onOpenToolConfigDialog}
                >
                  <Plus className="h-4 w-4" />
                  配置插件
                </Button>
              </div>
            </div>
          }
        >
          <ToolKindTabs tabs={toolKindTabs} activeKind={activeToolKind} onChange={setActiveToolKind} />

          {filteredToolRows.length > 0 ? (
            <CapabilityTable>
              <Table className="min-w-[1040px]">
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-200 hover:bg-slate-50">
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">名称</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">类型</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">来源</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">描述</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredToolRows.map(({ item, scope }) => (
                    <ToolRow
                      key={`${scope}-${item.id}`}
                      item={item}
                      scope={scope}
                      onToggle={onToggleTool}
                      onDelete={onDeleteTool}
                    />
                  ))}
                </TableBody>
              </Table>
            </CapabilityTable>
          ) : (
            <EmptyState label={toolTotalCount === 0 ? "当前还没有插件。" : "没有匹配条件的插件。"} />
          )}
        </CapabilityPanelShell>
      ) : null}

      {panel === "skills" ? (
        <CapabilityPanelShell
          title="技能"
          totalCount={skillTotalCount}
          countLabel={
            skillSearchQuery.trim()
              ? `匹配 ${skillSearchMatchTotal} / ${skillTotalCount} 项`
              : undefined
          }
          toolbar={
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <div className="relative min-w-0 flex-1 sm:max-w-xl">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  value={skillSearchQuery}
                  onChange={(event) => setSkillSearchQuery(event.target.value)}
                  placeholder="输入技能名称检索"
                  className="h-9 w-full border-slate-200 bg-white pl-9 shadow-none"
                  aria-label="按名称检索技能"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                {onSetAllSkillsEnabled ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0 rounded-md border-slate-200 bg-white px-3 text-slate-700 shadow-none hover:bg-slate-50"
                    disabled={skillTotalCount === 0}
                    onClick={() => onSetAllSkillsEnabled(true)}
                  >
                    一键启用
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  className="h-9 shrink-0 rounded-md bg-blue-600 px-4 text-white shadow-none hover:bg-blue-700"
                  onClick={onOpenSkillConfigDialog}
                >
                  <Plus className="h-4 w-4" />
                  配置技能
                </Button>
              </div>
            </div>
          }
        >
          <PresetClawViewTabs
            scope={skillScope}
            presetCount={skillPresetCount}
            clawCount={capabilityConfig.skills.claw.length}
            onChange={onSkillScopeChange}
            prefix="skills"
            labels={SKILL_VIEW_SCOPE_LABELS}
          />

          {skillScope === "preset" ? (
            skillPresetCount > 0 ? (
              filteredPresetSkillCount > 0 ? (
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
                      {filteredSkills.platform.map((item) => (
                        <SkillRow
                          key={`platform-${item.id}`}
                          item={item}
                          scope="platform"
                          onToggle={onToggleSkill}
                          onDelete={onDeleteSkill}
                        />
                      ))}
                      {filteredSkills.tenant.map((item) => (
                        <SkillRow
                          key={`tenant-${item.id}`}
                          item={item}
                          scope="tenant"
                          onToggle={onToggleSkill}
                          onDelete={onDeleteSkill}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </CapabilityTable>
              ) : (
                <EmptyState label="没有匹配名称的技能。" />
              )
            ) : (
              <EmptyState label="当前分类下还没有技能。" />
            )
          ) : capabilityConfig.skills.claw.length ? (
            filteredSkills.claw.length > 0 ? (
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
                    {filteredSkills.claw.map((item) => (
                      <SkillRow
                        key={item.id}
                        item={item}
                        scope="claw"
                        onToggle={onToggleSkill}
                        onDelete={onDeleteSkill}
                      />
                    ))}
                  </TableBody>
                </Table>
              </CapabilityTable>
            ) : (
              <EmptyState label="没有匹配名称的技能。" />
            )
          ) : (
            <EmptyState label="当前分类下还没有技能。" />
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
  countLabel,
  toolbar,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  description?: string;
  totalCount: number;
  /** 覆盖默认的「N 项」展示，例如检索时的匹配数量 */
  countLabel?: string;
  toolbar?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  const showHeaderAction = Boolean(onAction && actionLabel);

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div
        className={cn(
          "flex flex-col gap-4 border-b border-slate-200 pb-4",
          showHeaderAction && "lg:flex-row lg:items-start lg:justify-between"
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-base font-semibold text-slate-950">{title}</div>
            <div className="text-sm text-slate-400">{countLabel ?? `${totalCount} 项`}</div>
          </div>
          {description ? <div className="mt-1 text-sm text-slate-500">{description}</div> : null}
          {toolbar ? <div className="mt-3 w-full">{toolbar}</div> : null}
        </div>

        {showHeaderAction ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 self-start rounded-md shadow-none"
            onClick={onAction}
          >
            <Plus className="h-4 w-4" />
            {actionLabel}
          </Button>
        ) : null}
      </div>

      {children}
    </div>
  );
}

function CapabilityTable({ children }: { children: ReactNode }) {
  return <section className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">{children}</section>;
}

function PresetClawViewTabs({
  scope,
  presetCount,
  clawCount,
  onChange,
  prefix,
  labels,
}: {
  scope: ToolSkillViewScope;
  presetCount: number;
  clawCount: number;
  onChange: (next: ToolSkillViewScope) => void;
  prefix: string;
  labels: Record<ToolSkillViewScope, string>;
}) {
  const tabs: Array<{ key: ToolSkillViewScope; count: number }> = [
    { key: "preset", count: presetCount },
    { key: "claw", count: clawCount },
  ];

  return (
    <div className="overflow-x-auto border-b border-slate-200">
      <div className="flex min-w-max items-center gap-5">
        {tabs.map((tab) => (
          <button
            key={`${prefix}-${tab.key}`}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "border-b-2 border-transparent px-1 py-3 text-sm font-medium whitespace-nowrap transition-colors",
              scope === tab.key ? "border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-900"
            )}
          >
            {labels[tab.key]}
            <span className="ml-2 text-xs text-slate-400">{tab.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ToolKindTabs({
  tabs,
  activeKind,
  onChange,
}: {
  tabs: ToolKindTab[];
  activeKind: ToolKindTabKey;
  onChange: (next: ToolKindTabKey) => void;
}) {
  return (
    <div className="overflow-x-auto border-b border-slate-200">
      <div className="flex min-w-max items-center gap-5">
        {tabs.map((tab) => (
          <button
            key={`tools-kind-${tab.key}`}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "border-b-2 border-transparent px-1 py-3 text-sm font-medium whitespace-nowrap transition-colors",
              activeKind === tab.key ? "border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-900"
            )}
          >
            {tab.label}
            <span className="ml-2 text-xs text-slate-400">{tab.count}</span>
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

function resolveCapabilityToolKind(item: CapabilityToolItem): CapabilityToolKind {
  if (item.kind) {
    return item.kind;
  }
  const raw = `${item.meta ?? ""} ${item.badge ?? ""} ${item.name ?? ""}`.toLowerCase();
  if (raw.includes("工作流") || raw.includes("workflow")) {
    return "workflow";
  }
  if (raw.includes("插件")) {
    return "plugin";
  }
  if (raw.includes("mcp") || raw.includes("接口")) {
    return "mcp";
  }
  if (raw.includes("本体")) {
    return "ontology_action";
  }
  return "mcp";
}

function CapabilityToolKindCell({ kind }: { kind: CapabilityToolKind }) {
  const config = TOOL_KIND_META[kind];
  const { Icon, label } = config;
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-slate-700" aria-hidden />
      <span className="text-sm text-slate-800">{label}</span>
    </div>
  );
}

function ToolOriginBadge({ scope }: { scope: CapabilityScope }) {
  const isBuiltin = getToolOrigin(scope) === "builtin";
  return (
    <Badge
      className={cn(
        "border px-2 py-0.5 text-xs font-medium",
        isBuiltin ? "border-slate-200 bg-slate-50 text-slate-600" : "border-blue-100 bg-blue-50 text-blue-700"
      )}
    >
      {isBuiltin ? "内置" : "Claw配置"}
    </Badge>
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
  const kind = resolveCapabilityToolKind(item);

  return (
    <TableRow className="border-slate-200 bg-white hover:bg-slate-50/40">
      <TableCell className="px-4 py-3 align-middle">
        <div className="text-[15px] font-medium text-slate-900">{item.name}</div>
      </TableCell>
      <TableCell className="px-4 py-3 align-middle">
        <CapabilityToolKindCell kind={kind} />
      </TableCell>
      <TableCell className="px-4 py-3 align-middle">
        <ToolOriginBadge scope={scope} />
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
          switchAriaLabel={`${item.name} 启停`}
          removeActionLabel="移除"
          toolsSwitchBlue
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
          removeActionLabel="移除"
          toolsSwitchBlue
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
  toolsSwitchBlue,
  removeActionLabel = "删除",
}: {
  canDelete: boolean;
  enabled: boolean;
  onDelete: () => void;
  onToggle: (checked: boolean) => void;
  switchAriaLabel: string;
  /** 主题蓝启停开关（与顶栏/主按钮蓝一致） */
  toolsSwitchBlue?: boolean;
  removeActionLabel?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      {canDelete ? (
        <button type="button" onClick={onDelete} className="text-sm text-blue-600 hover:text-blue-700">
          {removeActionLabel}
        </button>
      ) : null}
      <div className="flex items-center gap-2">
        {!toolsSwitchBlue ? (
          <span className="text-sm text-slate-400">{enabled ? "启用" : "停用"}</span>
        ) : null}
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          aria-label={switchAriaLabel}
          className={
            toolsSwitchBlue
              ? "data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-200"
              : undefined
          }
        />
      </div>
    </div>
  );
}
