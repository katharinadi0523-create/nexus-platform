"use client";

import { useState } from "react";
import { PluginsMineTable } from "@/components/my-claw/plugins/plugins-mine-table";
import { PluginsPlaza } from "@/components/my-claw/plugins/plugins-plaza";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  INITIAL_MINE_PLUGINS,
  type MinePluginItem,
  type PluginToolKind,
} from "@/lib/mock/my-claw/plugins";

export function MyClawPluginsHub() {
  const [plugins, setPlugins] = useState<MinePluginItem[]>(INITIAL_MINE_PLUGINS);
  const [marketAddSequence, setMarketAddSequence] = useState(0);
  const [activeTab, setActiveTab] = useState<"mine" | "plaza">("mine");
  const [focusRequest, setFocusRequest] = useState<{
    kind: PluginToolKind;
    token: number;
  } | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8f9fb]">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value === "plaza" ? "plaza" : "mine")}
        className="flex h-full min-h-0 flex-col gap-0"
      >
        <div className="shrink-0 border-b border-slate-200/80 bg-white/90 px-4 pt-3 md:px-6">
          <TabsList className="h-auto w-fit gap-1 rounded-none bg-transparent p-0">
            <TabsTrigger
              value="mine"
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-[#5a6779] shadow-none data-[state=active]:border-[#2773ff] data-[state=active]:bg-transparent data-[state=active]:text-[#2773ff] data-[state=active]:shadow-none"
            >
              我的插件
            </TabsTrigger>
            <TabsTrigger
              value="plaza"
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-[#5a6779] shadow-none data-[state=active]:border-[#2773ff] data-[state=active]:bg-transparent data-[state=active]:text-[#2773ff] data-[state=active]:shadow-none"
            >
              插件广场
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="mine" className="mt-0 min-h-0 flex-1 overflow-y-auto">
          <PluginsMineTable
            plugins={plugins}
            onPluginsChange={setPlugins}
            focusRequest={focusRequest}
          />
        </TabsContent>

        <TabsContent
          value="plaza"
          className="mt-0 min-h-0 flex-1 overflow-y-auto bg-[#e8f0fb]"
        >
          <PluginsPlaza
            plugins={plugins}
            onPluginsChange={setPlugins}
            marketAddSequence={marketAddSequence}
            onMarketAddSequenceChange={setMarketAddSequence}
            onAddedToMine={(kind) => {
              setFocusRequest({ kind, token: Date.now() });
              setActiveTab("mine");
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
