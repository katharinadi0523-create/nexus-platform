"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PersonalMcpDialog, PersonalOpenApiDialog, type PersonalPluginDraft } from "@/components/my-claw/plugins/personal-plugin-editor";
import { PersonalPluginManager } from "@/components/my-claw/plugins/personal-plugin-manager";
import { PluginsMineTable } from "@/components/my-claw/plugins/plugins-mine-table";
import { PluginsPlaza } from "@/components/my-claw/plugins/plugins-plaza";
import { ResourceViewSwitch } from "@/components/my-claw/resource-view-switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addMarketplaceItemToMine,
  INITIAL_MINE_PLUGINS,
  type MinePluginItem,
  type PluginMarketplaceItem,
  type PluginToolKind,
} from "@/lib/mock/my-claw/plugins";
import { checkPluginConnection, currentLocalTime } from "@/lib/mock/my-claw/plugin-connection-check";
import { cn } from "@/lib/utils";

export function MyClawPluginsHub({
  visibleKinds,
  personalWorkspace = false,
  capabilityWorkspace = false,
  hideViewTabs = false,
  activeView: controlledActiveView,
  onActiveViewChange,
}: {
  visibleKinds?: PluginToolKind[];
  personalWorkspace?: boolean;
  capabilityWorkspace?: boolean;
  hideViewTabs?: boolean;
  activeView?: "mine" | "plaza";
  onActiveViewChange?: (view: "mine" | "plaza") => void;
} = {}) {
  const tabs = personalWorkspace
    ? [
        { value: "plaza", label: "插件广场" },
        { value: "mine", label: "我的插件" },
      ]
    : [
        { value: "mine", label: "我的插件" },
        { value: "plaza", label: "插件广场" },
      ];
  const [plugins, setPlugins] = useState<MinePluginItem[]>(() =>
    INITIAL_MINE_PLUGINS.filter(
      (plugin) => plugin.publisherScope !== "system" && (!visibleKinds || visibleKinds.includes(plugin.kind)),
    ),
  );
  const [marketAddSequence, setMarketAddSequence] = useState(0);
  const [mcpDialogOpen, setMcpDialogOpen] = useState(false);
  const [openApiDialogOpen, setOpenApiDialogOpen] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<MinePluginItem | null>(null);
  const [localActiveTab, setLocalActiveTab] = useState<"mine" | "plaza">(() =>
    personalWorkspace ? "plaza" : "mine",
  );
  const activeTab = controlledActiveView ?? localActiveTab;
  const changeActiveTab = (value: string) => {
    const nextView = value === "plaza" ? "plaza" : "mine";
    setLocalActiveTab(nextView);
    onActiveViewChange?.(nextView);
  };
  const [focusRequest, setFocusRequest] = useState<{
    kind: PluginToolKind;
    token: number;
  } | null>(null);

  const handleAddToMine = (item: PluginMarketplaceItem) => {
    const result = addMarketplaceItemToMine(plugins, item, marketAddSequence);
    setPlugins(result.plugins);
    setMarketAddSequence(result.nextSequence);
    setFocusRequest({
      kind: result.added.kind,
      token: Date.now(),
    });
    changeActiveTab("mine");
    return { kind: result.added.kind };
  };
  const openCustom = (kind: "mcp" | "plugin") => {
    setEditingPlugin(null);
    if (kind === "mcp") setMcpDialogOpen(true);
    else setOpenApiDialogOpen(true);
  };
  const editCustom = (plugin: MinePluginItem) => {
    setEditingPlugin(plugin);
    if (plugin.kind === "mcp") setMcpDialogOpen(true);
    else setOpenApiDialogOpen(true);
  };
  const saveCustom = (draft: PersonalPluginDraft, editingId?: string) => {
    const now = currentLocalTime();
    const existing = editingId ? plugins.find((plugin) => plugin.id === editingId) : undefined;
    const target: MinePluginItem = existing ? {
      ...existing,
      name: draft.name,
      description: draft.description,
      personalConfig: draft.config,
      enabled: true,
      connectionStatus: "checking",
      lastConnectionCheckTimedOut: false,
      updatedAt: now,
    } : {
      id: `personal-plugin-${crypto.randomUUID()}`,
      name: draft.name,
      description: draft.description,
      kind: draft.kind,
      origin: "claw",
      publisherScope: "personal",
      enabled: true,
      connectionStatus: "checking",
      badge: "个人创建",
      meta: draft.kind === "mcp" ? "MCP" : "OpenAPI",
      creator: "我",
      updatedAt: now,
      addedAt: now,
      personalCreated: true,
      activeToolCalls: 0,
      personalConfig: draft.config,
    };
    setPlugins((current) => existing ? current.map((plugin) => plugin.id === target.id ? target : plugin) : [target, ...current]);
    toast.success(existing ? "更新成功" : "添加成功", {
      action: { label: "查看", onClick: () => changeActiveTab("mine") },
    });
    void checkPluginConnection(target).then((outcome) => {
      setPlugins((current) => current.map((plugin) => plugin.id !== target.id ? plugin : outcome === "timeout" ? {
        ...plugin,
        connectionStatus: plugin.lastValidConnectionStatus,
        lastConnectionCheckTimedOut: true,
      } : {
        ...plugin,
        enabled: true,
        connectionStatus: outcome,
        lastValidConnectionStatus: outcome,
        lastConnectionCheckAt: currentLocalTime(),
        lastConnectionCheckTimedOut: false,
      }));
    });
    setEditingPlugin(null);
    setOpenApiDialogOpen(false);
  };
  const viewSwitcher = personalWorkspace && !hideViewTabs && !capabilityWorkspace ? (
    <ResourceViewSwitch
      activeView={activeTab}
      onChange={changeActiveTab}
      plazaLabel="插件广场"
      mineLabel="我的插件"
    />
  ) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8f9fb]">
      <Tabs
        value={activeTab}
        onValueChange={changeActiveTab}
        className="flex h-full min-h-0 flex-col gap-0"
      >
        {!hideViewTabs && !personalWorkspace ? (
          <div
            className={cn(
              "shrink-0 border-b border-slate-200/80 bg-white/90 px-4 pt-3 md:px-6",
              personalWorkspace && "bg-[#f8fafc] px-4 pt-0 md:px-6"
            )}
          >
            <TabsList
              aria-label="插件视图"
              className={cn(
                "h-auto w-fit gap-1 rounded-none bg-transparent p-0",
                personalWorkspace && "h-11"
              )}
            >
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-[#5a6779] shadow-none data-[state=active]:border-[#2773ff] data-[state=active]:bg-transparent data-[state=active]:text-[#2773ff] data-[state=active]:shadow-none",
                    personalWorkspace && "px-3 py-2 text-[13px]"
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        ) : null}

        <TabsContent value="mine" className="mt-0 min-h-0 flex-1 overflow-y-auto">
          {personalWorkspace && capabilityWorkspace ? <PersonalPluginManager
            plugins={plugins}
            onPluginsChange={setPlugins}
            onBack={() => changeActiveTab("plaza")}
            onEdit={editCustom}
          /> : <PluginsMineTable
            plugins={plugins}
            onPluginsChange={setPlugins}
            focusRequest={focusRequest}
            visibleKinds={visibleKinds}
            personalWorkspace={personalWorkspace}
            capabilityWorkspace={capabilityWorkspace}
            viewSwitcher={viewSwitcher}
          />}
        </TabsContent>

        <TabsContent
          value="plaza"
          className={cn(
            "mt-0 min-h-0 flex-1 overflow-y-auto bg-[#e8f0fb]",
            personalWorkspace && "bg-[#f8fafc]"
          )}
        >
          <PluginsPlaza
            plugins={plugins}
            onAddToMine={handleAddToMine}
            personalWorkspace={personalWorkspace}
            capabilityWorkspace={capabilityWorkspace}
            viewSwitcher={viewSwitcher}
            managementCount={plugins.length}
            onOpenManagement={() => changeActiveTab("mine")}
            onCreateCustom={openCustom}
          />
        </TabsContent>
      </Tabs>
      {personalWorkspace && capabilityWorkspace && mcpDialogOpen ? <PersonalMcpDialog
        key={editingPlugin?.id ?? "new-mcp"}
        open={mcpDialogOpen}
        onOpenChange={(open) => { setMcpDialogOpen(open); if (!open) setEditingPlugin(null); }}
        onSave={saveCustom}
        editing={editingPlugin}
        existingPlugins={plugins}
      /> : null}
      {personalWorkspace && capabilityWorkspace && openApiDialogOpen ? <PersonalOpenApiDialog
        key={editingPlugin?.id ?? "new-openapi"}
        open={openApiDialogOpen}
        onOpenChange={(open) => { setOpenApiDialogOpen(open); if (!open) setEditingPlugin(null); }}
        onSave={saveCustom}
        editing={editingPlugin}
        existingPlugins={plugins}
      /> : null}
    </div>
  );
}
