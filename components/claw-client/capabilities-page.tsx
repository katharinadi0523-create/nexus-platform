"use client";

import { useState } from "react";
import { AgentsPlaza } from "@/components/my-claw/agents/agents-plaza";
import { MyClawPluginsHub } from "@/components/my-claw/plugins/plugins-hub";
import { MyClawSkillsHub } from "@/components/my-claw/skills/skills-hub";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CapabilityType = "agents" | "skills" | "plugins";

export function MyClawCapabilitiesPage({
  initialType = "agents",
}: {
  initialType?: CapabilityType;
}) {
  const [activeType, setActiveType] = useState<CapabilityType>(initialType);

  return (
    <Tabs
      value={activeType}
      onValueChange={(value) => setActiveType(value as CapabilityType)}
      className="flex h-full min-h-0 flex-col gap-0"
    >
      <div className="flex h-[54px] shrink-0 items-center border-b border-slate-200 bg-white px-4 md:px-6">
        <TabsList aria-label="能力类型" className="h-full w-fit gap-1 rounded-none bg-transparent p-0">
          <TabsTrigger
            value="agents"
            className="h-full rounded-none border-b-2 border-transparent px-4 text-sm font-medium text-[#5a6779] shadow-none data-[state=active]:border-[#2773ff] data-[state=active]:bg-transparent data-[state=active]:text-[#2773ff] data-[state=active]:shadow-none"
          >
            智能体
          </TabsTrigger>
          <TabsTrigger
            value="skills"
            className="h-full rounded-none border-b-2 border-transparent px-4 text-sm font-medium text-[#5a6779] shadow-none data-[state=active]:border-[#2773ff] data-[state=active]:bg-transparent data-[state=active]:text-[#2773ff] data-[state=active]:shadow-none"
          >
            技能
          </TabsTrigger>
          <TabsTrigger
            value="plugins"
            className="h-full rounded-none border-b-2 border-transparent px-4 text-sm font-medium text-[#5a6779] shadow-none data-[state=active]:border-[#2773ff] data-[state=active]:bg-transparent data-[state=active]:text-[#2773ff] data-[state=active]:shadow-none"
          >
            插件
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="agents" className="mt-0 min-h-0 flex-1 overflow-hidden">
        <AgentsPlaza />
      </TabsContent>
      <TabsContent value="skills" className="mt-0 min-h-0 flex-1 overflow-hidden">
        <MyClawSkillsHub
          personalWorkspace
          capabilityWorkspace
        />
      </TabsContent>
      <TabsContent value="plugins" className="mt-0 min-h-0 flex-1 overflow-hidden">
        <MyClawPluginsHub
          visibleKinds={["mcp", "plugin"]}
          personalWorkspace
          capabilityWorkspace
        />
      </TabsContent>
    </Tabs>
  );
}
