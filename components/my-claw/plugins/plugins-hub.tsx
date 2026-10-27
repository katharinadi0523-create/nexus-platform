"use client";

import { useState } from "react";
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
      (plugin) => !visibleKinds || visibleKinds.includes(plugin.kind),
    ),
  );
  const [marketAddSequence, setMarketAddSequence] = useState(0);
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
  const viewSwitcher = personalWorkspace && !hideViewTabs ? (
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
          <PluginsMineTable
            plugins={plugins}
            onPluginsChange={setPlugins}
            focusRequest={focusRequest}
            visibleKinds={visibleKinds}
            personalWorkspace={personalWorkspace}
            capabilityWorkspace={capabilityWorkspace}
            viewSwitcher={viewSwitcher}
          />
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
            viewSwitcher={viewSwitcher}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
